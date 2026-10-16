<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserPosition;
use App\Models\Role;
use App\Models\Department;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use App\Http\Controllers\Api\TravelLoanApiController;

class KeycloakController extends Controller
{
    /**
     * Redirect ผู้ใช้ไปยัง Keycloak เพื่อยืนยันตัวตน
     */
    public function redirect()
    {
        return Socialite::driver('keycloak')->redirect();
    }

    /**
     * รับข้อมูลจาก Keycloak หลังยืนยันตัวตนสำเร็จ
     * + ดึงข้อมูลตำแหน่ง/ฝ่าย จาก npcjob API
     */
    public function callback(\Illuminate\Http\Request $request)
    {
        try {
            // 1. ดึงข้อมูล user จาก Keycloak
            $keycloakUser = Socialite::driver('keycloak')->stateless()->user();

            $username = $keycloakUser->user['preferred_username'] ?? $keycloakUser->user['username'] ?? null;
            $email    = $keycloakUser->getEmail() 
                        ?? ($keycloakUser->user['email'] ?? null)
                        ?? ($username ? (str_contains($username, '@') ? $username : $username . '@npc.ac.th') : null);

            if (!$email) {
                throw new \Exception('ไม่พบอีเมลในข้อมูลจาก Keycloak SSO กรุณาติดต่อผู้ดูแลระบบ');
            }

            // 2. ดึงข้อมูลเพิ่มเติมจาก npcjob API (ฝ่าย + ตำแหน่ง)
            $npcjobProfile = $this->fetchNpcjobProfile($username);

            // 3. ประกอบชื่อ-นามสกุล
            $name = $this->buildDisplayName($keycloakUser, $npcjobProfile);

            // 4. หา/สร้าง Department ใน npc_smartflow ตามข้อมูล npcjob
            $department = $this->resolveOrCreateDepartment($npcjobProfile);

            // 5. หา/สร้าง User ใน npc_smartflow
            $user = User::where('email', $email)->first();

            if (!$user && $username) {
                // ค้นหาเผื่อ user มีอีเมลต่างกันแต่อาจใช้ username เดียวกัน
                $user = User::where('email', 'like', $username . '@%')->first();
            }

            if (!$user) {
                // Auto-provision: สร้าง user ใหม่
                $resolvedRole = $this->resolveRole($npcjobProfile);
                $defaultRole  = $resolvedRole ?? Role::where('name', 'teacher')->first() ?? Role::first();

                $mainDeptId = $department?->parent_id ?: $department?->id;

                $user = User::create([
                    'name'          => $name,
                    'email'         => $email,
                    'password'      => bcrypt(Str::random(32)),
                    'role_id'       => $defaultRole?->id,
                    'department_id' => $mainDeptId,
                    'position'      => $this->resolvePosition($npcjobProfile),
                    'is_active'     => true,
                ]);

                Log::info("Keycloak SSO: สร้างบัญชีใหม่ [{$email}] ฝ่าย: " . ($npcjobProfile['department_name'] ?? '-') . " ตำแหน่ง: " . ($npcjobProfile['position'] ?? '-'));
            } else {
                // อัปเดตข้อมูลล่าสุดจาก npcjob ทุกครั้งที่ login
                $updateData = ['name' => $name];

                // ตรวจสอบว่าผู้ใช้มีการตั้งค่าภาระงาน/หน้าที่ (duty) ใน SmartFlow แล้วหรือไม่
                $hasSmartFlowDuties = $user->userPositions()->whereNotNull('duty')->exists();

                if (!$hasSmartFlowDuties) {
                    if ($department) {
                        $updateData['department_id'] = $department->parent_id ?: $department->id;
                    }
                    $resolvedPosition = $this->resolvePosition($npcjobProfile);
                    if ($resolvedPosition) {
                        $updateData['position'] = $resolvedPosition;
                    }

                    // อัปเดต Role ตามตำแหน่งจาก npcjob (ถ้าไม่ใช่ admin และยังไม่มีการกำหนดหน้าที่ใน SmartFlow)
                    if (!$user->isAdmin()) {
                        $resolvedRole = $this->resolveRole($npcjobProfile, $user);
                        if ($resolvedRole) {
                            $updateData['role_id'] = $resolvedRole->id;
                        }
                    }
                }

                $user->update($updateData);

                Log::info("Keycloak SSO: อัปเดตข้อมูล [{$email}] ฝ่าย: " . ($user->department?->name ?? '-') . " ตำแหน่ง: " . ($user->position ?? '-'));
            }

            // 5.5 Sync ตำแหน่งทั้งหมดจาก npcjob → user_positions (เฉพาะเมื่อยังไม่มีการกำหนดหน้าที่ใน SmartFlow)
            if (!$user->userPositions()->whereNotNull('duty')->exists()) {
                $this->syncUserPositions($user, $npcjobProfile);
            }

            // 5.6 ตรวจสอบและดึงข้อมูล Line User ID จากระบบ npc_eleve มาบันทึกใน SmartFlow (ถ้ายังไม่มี)
            if (empty($user->line_user_id)) {
                try {
                    TravelLoanApiController::fetchAndSyncUserLineId($user, $username);
                } catch (\Exception $ex) {
                    Log::warning("Keycloak SSO: ไม่สามารถดึง LineUserID จาก npc_eleve สำหรับ {$user->name}: " . $ex->getMessage());
                }
            }

            // 6. ตรวจสอบสถานะบัญชี
            if (!$user->is_active) {
                return redirect()->route('login')
                    ->withErrors(['email' => 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ']);
            }

            // 7. เข้าสู่ระบบ และ Regenerate Session
            Auth::login($user, true);
            $request->session()->regenerate();

            return redirect()->intended(route('dashboard'));

        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();
            
            if ($e instanceof \GuzzleHttp\Exception\BadResponseException) {
                $responseBody = (string) $e->getResponse()->getBody();
                Log::error('Keycloak SSO Guzzle Error: ' . $errorMessage . ' | Response: ' . $responseBody);
                $json = json_decode($responseBody, true);
                if (isset($json['error_description'])) {
                    $errorMessage = $json['error_description'];
                } elseif (isset($json['error'])) {
                    $errorMessage = $json['error'];
                }
            } else {
                Log::error('Keycloak SSO Error: ' . $errorMessage . "\n" . $e->getTraceAsString());
            }

            return redirect()->route('login')
                ->withErrors(['email' => 'การเข้าสู่ระบบด้วย SSO ล้มเหลว: ' . $errorMessage]);
        }
    }

    /**
     * Diagnostic Debug Endpoint สำหรับตรวจสอบการเชื่อมต่อ Keycloak & Config
     */
    public function debug()
    {
        $baseUrl      = config('services.keycloak.base_url');
        $realm        = config('services.keycloak.realms');
        $clientId     = config('services.keycloak.client_id');
        $clientSecret = config('services.keycloak.client_secret');
        $redirectUri  = config('services.keycloak.redirect');

        $discoveryUrl = rtrim($baseUrl, '/') . "/realms/{$realm}/.well-known/openid-configuration";
        
        $results = [
            'timestamp' => now()->toDateTimeString(),
            'config' => [
                'base_url'      => $baseUrl,
                'realm'         => $realm,
                'client_id'     => $clientId,
                'has_secret'    => !empty($clientSecret),
                'redirect_uri'  => $redirectUri ?: route('keycloak.callback'),
                'discovery_url' => $discoveryUrl,
            ],
            'checks' => [],
        ];

        // Check 1: Keycloak OIDC Discovery Endpoint
        try {
            $res = Http::timeout(5)->get($discoveryUrl);
            $results['checks']['keycloak_discovery'] = [
                'status'      => $res->successful() ? 'OK' : 'FAILED',
                'http_status' => $res->status(),
                'endpoints'   => $res->successful() ? [
                    'authorization_endpoint' => $res->json('authorization_endpoint'),
                    'token_endpoint'         => $res->json('token_endpoint'),
                    'userinfo_endpoint'      => $res->json('userinfo_endpoint'),
                ] : null,
            ];
        } catch (\Exception $ex) {
            $results['checks']['keycloak_discovery'] = [
                'status' => 'ERROR',
                'error'  => $ex->getMessage(),
            ];
        }

        // Check 2: npcjob Internal API Endpoint
        try {
            $npcjobUrl   = config('services.npcjob.api_url');
            $npcjobToken = config('services.npcjob.api_token');
            $res = Http::timeout(5)->get($npcjobUrl, ['username' => 'test', 'token' => $npcjobToken]);
            $results['checks']['npcjob_api'] = [
                'status'      => $res->successful() ? 'OK' : 'FAILED',
                'http_status' => $res->status(),
                'url'         => $npcjobUrl,
            ];
        } catch (\Exception $ex) {
            $results['checks']['npcjob_api'] = [
                'status' => 'ERROR',
                'error'  => $ex->getMessage(),
            ];
        }

        return response()->json($results, 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }

    /**
     * เรียก npcjob API เพื่อดึงข้อมูลตำแหน่ง/ฝ่ายของ user
     */
    private function fetchNpcjobProfile(?string $username): array
    {
        if (!$username) return [];

        try {
            $apiBase  = config('services.npcjob.api_url', 'https://service.npc.ac.th/npcjob/api_profile.php');
            $apiToken = config('services.npcjob.api_token', 'npc_sf_2026_api_key_x9k2m');

            Log::info("npcjob API: กำลังดึงข้อมูล username={$username} จาก {$apiBase}");

            $response = Http::timeout(5)->get($apiBase, [
                'username' => $username,
                'token'    => $apiToken,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if ($data['success'] ?? false) {
                    Log::info("npcjob API: สำเร็จ — ฝ่าย: " . ($data['user']['department_name'] ?? '-') . " ตำแหน่ง: " . ($data['user']['position'] ?? '-'));
                    return $data['user'] ?? [];
                } else {
                    Log::warning("npcjob API: user ไม่พบ — " . ($data['error'] ?? 'unknown error'));
                }
            } else {
                Log::warning("npcjob API: HTTP " . $response->status() . " — " . $response->body());
            }
        } catch (\Exception $e) {
            Log::warning("npcjob API ไม่ตอบสนอง สำหรับ username: {$username} — " . $e->getMessage());
        }

        return [];
    }

    /**
     * ประกอบชื่อแสดงจากข้อมูล Keycloak หรือ npcjob
     */
    private function buildDisplayName($keycloakUser, array $npcjobProfile): string
    {
        // ถ้ามีข้อมูลจาก npcjob ให้ใช้ก่อน (มีคำนำหน้าชื่อ)
        if (!empty($npcjobProfile['display_name'])) {
            return $npcjobProfile['display_name'];
        }

        // fallback: ใช้ชื่อจาก Keycloak
        $name = $keycloakUser->getName()
                ?? trim(
                    ($keycloakUser->user['given_name']  ?? '') . ' ' .
                    ($keycloakUser->user['family_name'] ?? '')
                );

        return trim($name) ?: $keycloakUser->getEmail();
    }

    /**
     * หา Department ที่ตรงกันใน npc_smartflow หรือแมปเข้าฝ่ายหลักที่มีอยู่
     */
    private function resolveOrCreateDepartment(array $npcjobProfile): ?Department
    {
        $departmentName = $npcjobProfile['department_name'] ?? '';
        return $this->resolveOrCreateDepartmentByName($departmentName);
    }

    /**
     * ค้นหาหรือสร้าง Department จากชื่อที่ได้รับ (เช่น จาก npcjob หรือ Keycloak)
     * รองรับทั้งการจับคู่ฝ่ายหลัก, การแปลงคำนำหน้า (แผนกวิชา <-> สาขาวิชา), 
     * การกู้คืนจาก SoftDeletes (ป้องกัน UNIQUE constraint failed) และ try-catch กัน Error 500
     */
    private function resolveOrCreateDepartmentByName(?string $rawDepartmentName): ?Department
    {
        $departmentName = trim($rawDepartmentName ?? '');
        if (!$departmentName) {
            return null;
        }

        // 1. ค้นหาแบบตรงกันเป๊ะในตารางปกติ (active)
        $dept = Department::where('name', $departmentName)->first();
        if ($dept) {
            return $dept;
        }

        // 2. ป้องกันการสร้างฝ่ายซ้ำซ้อน: แมปเข้า 4 ฝ่ายหลักเดิมที่มีในระบบ
        if (mb_strpos($departmentName, 'แผนงาน') !== false || mb_strpos($departmentName, 'ยุทธศาสตร์') !== false || mb_strpos($departmentName, 'วางแผน') !== false) {
            $matched = Department::where('name', 'like', '%ยุทธศาสตร์%')->orWhere('name', 'like', '%แผนงาน%')->first();
            if ($matched) return $matched;
        }

        if (mb_strpos($departmentName, 'บริหารทรัพยากร') !== false || mb_strpos($departmentName, 'บริหารจัดการ') !== false) {
            $matched = Department::where('name', 'like', '%บริหารทรัพยากร%')->first();
            if ($matched) return $matched;
        }

        if ($departmentName === 'ฝ่ายวิชาการ' || (mb_strpos($departmentName, 'วิชาการ') !== false && mb_strpos($departmentName, 'สาขา') === false && mb_strpos($departmentName, 'แผนก') === false)) {
            $matched = Department::where('name', 'ฝ่ายวิชาการ')->first() 
                ?: Department::where('name', 'like', '%วิชาการ%')->whereNull('parent_id')->first();
            if ($matched) return $matched;
        }

        if (mb_strpos($departmentName, 'พัฒนากิจการ') !== false || mb_strpos($departmentName, 'กิจการนักเรียน') !== false) {
            $matched = Department::where('name', 'like', '%กิจการ%')->first();
            if ($matched) return $matched;
        }

        // 3. จับคู่ข้ามคำนำหน้า (เช่น "แผนกวิชาเทคโนโลยีสารสนเทศ" กับ "สาขาวิชาเทคโนโลยีสารสนเทศ")
        // ในวิทยาลัยอาชีวะ คำว่า "แผนกวิชา" กับ "สาขาวิชา" หมายถึงหน่วยงานเดียวกัน
        $coreMajorName = preg_replace('/^(แผนกวิชา|สาขาวิชา|แผนก|สาขา|งาน)/u', '', $departmentName);
        $coreMajorName = trim($coreMajorName);

        if (!empty($coreMajorName) && mb_strlen($coreMajorName) >= 3) {
            $matchedSub = Department::where(function($q) use ($coreMajorName) {
                $q->where('name', 'like', '%' . $coreMajorName . '%');
            })->first();

            if ($matchedSub) {
                return $matchedSub;
            }
        }

        // 4. ตรวจสอบใน SoftDeletes (withTrashed) เพื่อกู้คืนแทนการ INSERT ซ้ำ ป้องกัน UNIQUE constraint failed
        $trashed = Department::withTrashed()->where('name', $departmentName)->first();
        if ($trashed) {
            if ($trashed->trashed()) {
                $trashed->restore();
                Log::info("Keycloak SSO: กู้คืนฝ่ายที่เคยถูก Soft Delete: {$departmentName} (ID: {$trashed->id})");
            }
            return $trashed;
        }

        if (!empty($coreMajorName) && mb_strlen($coreMajorName) >= 3) {
            $trashedSub = Department::withTrashed()->where('name', 'like', '%' . $coreMajorName . '%')->first();
            if ($trashedSub) {
                if ($trashedSub->trashed()) {
                    $trashedSub->restore();
                    Log::info("Keycloak SSO: กู้คืนฝ่ายที่เคยถูก Soft Delete (จับคู่คำ): {$trashedSub->name} (ID: {$trashedSub->id})");
                }
                return $trashedSub;
            }
        }

        // 5. หากไม่พบเลย จึงสร้าง Department ใหม่
        $parentId = null;
        if (str_contains($departmentName, 'แผนก') || str_contains($departmentName, 'สาขา') || str_contains($departmentName, 'ช่าง') || str_contains($departmentName, 'การตลาด') || str_contains($departmentName, 'สารสนเทศ') || str_contains($departmentName, 'การบัญชี') || str_contains($departmentName, 'สามัญ')) {
            $parentId = Department::where('name', 'like', '%วิชาการ%')->whereNull('parent_id')->value('id') ?: 2;
        } elseif (str_contains($departmentName, 'กิจการ') || str_contains($departmentName, 'นักเรียน') || str_contains($departmentName, 'แนะแนว') || str_contains($departmentName, 'ครูที่ปรึกษา') || str_contains($departmentName, 'สวัสดิการ') || str_contains($departmentName, 'โครงการพิเศษ')) {
            $parentId = Department::where('name', 'like', '%กิจการ%')->whereNull('parent_id')->value('id') ?: 3;
        } elseif (str_contains($departmentName, 'บริหาร') || str_contains($departmentName, 'พัสดุ') || str_contains($departmentName, 'การเงิน') || str_contains($departmentName, 'สารบรรณ') || str_contains($departmentName, 'อาคาร')) {
            $parentId = Department::where('name', 'like', '%บริหารทรัพยากร%')->whereNull('parent_id')->value('id') ?: 1;
        } elseif (str_contains($departmentName, 'แผนงาน') || str_contains($departmentName, 'ยุทธศาสตร์') || str_contains($departmentName, 'วิจัย') || str_contains($departmentName, 'ประกัน') || str_contains($departmentName, 'ศูนย์ดิจิทัล') || str_contains($departmentName, 'บ่มเพาะ') || str_contains($departmentName, 'ส่งเสริมธุรกิจ') || str_contains($departmentName, 'ผู้ประกอบการ') || str_contains($departmentName, 'ธุรกิจ')) {
            $parentId = Department::where('name', 'like', '%ยุทธศาสตร์%')->orWhere('name', 'like', '%แผนงาน%')->whereNull('parent_id')->value('id') ?: 4;
        }

        $code = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $departmentName), 0, 10));
        if (!$code) {
            $code = 'DEPT' . rand(100, 999);
        }

        while (Department::withTrashed()->where('code', $code)->exists()) {
            $code = 'DEPT' . rand(100, 999);
        }

        try {
            $dept = Department::create([
                'name'      => $departmentName,
                'code'      => $code,
                'parent_id' => $parentId,
            ]);
            Log::info("Keycloak SSO: สร้างฝ่ายใหม่จาก npcjob: {$departmentName} (code: {$code}, parent_id: {$parentId})");
            return $dept;
        } catch (\Illuminate\Database\QueryException $e) {
            Log::warning("Keycloak SSO: เกิดการชน UNIQUE constraint ขณะสร้างฝ่าย '{$departmentName}': " . $e->getMessage());

            $existing = Department::withTrashed()->where('name', $departmentName)->first();
            if ($existing) {
                if ($existing->trashed()) {
                    $existing->restore();
                }
                if ($parentId && !$existing->parent_id) {
                    $existing->update(['parent_id' => $parentId]);
                }
                return $existing;
            }

            if ($parentId) {
                return Department::find($parentId);
            }
            return Department::first();
        }
    }

    /**
     * แปลงข้อมูลตำแหน่งจาก npcjob API
     * รองรับทั้งรูปแบบ all_positions array (ใหม่) และ position string (เก่า)
     */
    private function resolvePosition(array $profile): ?string
    {
        // รูปแบบใหม่: all_positions array จาก user_jobs table
        if (!empty($profile['all_positions']) && is_array($profile['all_positions'])) {
            $titles = array_filter(array_column($profile['all_positions'], 'title'));
            if (!empty($titles)) {
                return implode(' / ', $titles);
            }
        }

        // fallback: position string
        return $profile['position'] ?? null;
    }

    /**
     * Sync ตำแหน่งทั้งหมดจาก npcjob all_positions → user_positions table
     * ลบข้อมูลเก่าแล้ว insert ใหม่ทุกครั้งที่ Login
     */
    private function syncUserPositions(User $user, array $npcjobProfile): void
    {
        // หากผู้ใช้มีการกำหนดภาระงาน/หน้าที่ (duty) ใน SmartFlow แล้ว จะไม่ลบหรือเขียนทับเด็ดขาด
        if ($user->userPositions()->whereNotNull('duty')->exists()) {
            return;
        }

        $allPositions = $npcjobProfile['all_positions'] ?? [];

        if (empty($allPositions)) {
            // ถ้าไม่มีข้อมูลจาก API ให้ใช้ position field เดี่ยว
            if (!empty($npcjobProfile['position'])) {
                $dept = $this->resolveOrCreateDepartmentByName($npcjobProfile['department_name'] ?? null);
                $mainDeptId = $dept?->parent_id ?: $dept?->id;
                $subDeptId  = $dept?->parent_id ? $dept?->id : null;

                $user->userPositions()->delete();
                $user->userPositions()->create([
                    'position'          => $npcjobProfile['position'],
                    'department_id'     => $mainDeptId,
                    'sub_department_id' => $subDeptId,
                    'job_level'         => $npcjobProfile['job_level'] ?? null,
                    'is_primary'        => true,
                ]);
            }
            return;
        }

        // ลบข้อมูลตำแหน่งเก่าทั้งหมดออกก่อน
        $user->userPositions()->delete();

        foreach ($allPositions as $index => $pos) {
            $deptName = $pos['job_department'] ?? null;
            $dept     = $this->resolveOrCreateDepartmentByName($deptName);

            $mainDeptId = $dept?->parent_id ?: $dept?->id;
            $subDeptId  = $dept?->parent_id ? $dept?->id : null;

            $user->userPositions()->create([
                'position'          => $pos['title'] ?? '',
                'department_id'     => $mainDeptId,
                'sub_department_id' => $subDeptId,
                'job_level'         => $pos['job_level'] ?? null,
                'is_primary'        => ($index === 0), // อันแรกคือตำแหน่งหลัก
            ]);
        }

        Log::info("Sync {$user->email}: " . count($allPositions) . " ตำแหน่ง เข้า user_positions");
    }

    /**
     * แปลงตำแหน่งจาก npcjob เป็น Role ในระบบ npc_smartflow
     */
    private function resolveRole(array $npcjobProfile, ?User $existingUser = null): ?Role
    {
        if ($existingUser && $existingUser->isAdmin()) {
            return $existingUser->role;
        }

        $allPosTitles = [];
        if (!empty($npcjobProfile['all_positions']) && is_array($npcjobProfile['all_positions'])) {
            foreach ($npcjobProfile['all_positions'] as $pos) {
                if (!empty($pos['title'])) {
                    $allPosTitles[] = $pos['title'];
                }
            }
        }
        if (!empty($npcjobProfile['position'])) {
            $allPosTitles[] = $npcjobProfile['position'];
        }

        $combinedText = implode(' ', $allPosTitles);

        if (mb_strpos($combinedText, 'ผู้อำนวยการ') !== false || mb_strpos($combinedText, 'รองผู้อำนวยการ') !== false) {
            return Role::where('name', 'executive')->first();
        }
        if (User::isPlanningWorkTitle($combinedText) && mb_strpos($combinedText, 'หัวหน้า') !== false) {
            return Role::where('name', 'plan_head')->first();
        }
        if (User::isPlanningWorkTitle($combinedText)) {
            $planStaffRole = Role::where('name', 'plan_staff')->first();
            if ($planStaffRole) return $planStaffRole;
        }
        if (mb_strpos($combinedText, 'หัวหน้างานพัสดุ') !== false || mb_strpos($combinedText, 'งานพัสดุ') !== false) {
            return Role::where('name', 'procurement_head')->first();
        }

        return Role::where('name', 'teacher')->first();
    }
}
