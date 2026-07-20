<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

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
    public function callback()
    {
        try {
            // 1. ดึงข้อมูล user จาก Keycloak
            $keycloakUser = Socialite::driver('keycloak')->stateless()->user();

            $email    = $keycloakUser->getEmail();
            $username = $keycloakUser->user['preferred_username'] ?? null;

            // 2. ดึงข้อมูลเพิ่มเติมจาก npcjob API (ฝ่าย + ตำแหน่ง)
            $npcjobProfile = $this->fetchNpcjobProfile($username);

            // 3. ประกอบชื่อ-นามสกุล
            $name = $this->buildDisplayName($keycloakUser, $npcjobProfile);

            // 4. หา/สร้าง Department ใน npc_smartflow ตามข้อมูล npcjob
            $department = $this->resolveOrCreateDepartment($npcjobProfile);

            // 5. หา/สร้าง User ใน npc_smartflow
            $user = User::where('email', $email)->first();

            if (!$user) {
                // Auto-provision: สร้าง user ใหม่
                $defaultRole = Role::where('name', 'teacher')->first() ?? Role::first();

                $user = User::create([
                    'name'          => $name,
                    'email'         => $email,
                    'password'      => bcrypt(Str::random(32)),
                    'role_id'       => $defaultRole?->id,
                    'department_id' => $department?->id,
                    'position'      => $this->resolvePosition($npcjobProfile),
                    'is_active'     => true,
                ]);

                Log::info("Keycloak SSO: สร้างบัญชีใหม่ [{$email}] ฝ่าย: " . ($npcjobProfile['department_name'] ?? '-') . " ตำแหน่ง: " . ($npcjobProfile['position'] ?? '-'));
            } else {
                // อัปเดตข้อมูลล่าสุดจาก npcjob ทุกครั้งที่ login
                $updateData = ['name' => $name];

                if ($department) {
                    $updateData['department_id'] = $department->id;
                }
                $resolvedPosition = $this->resolvePosition($npcjobProfile);
                if ($resolvedPosition) {
                    $updateData['position'] = $resolvedPosition;
                }

                $user->update($updateData);

                Log::info("Keycloak SSO: อัปเดตข้อมูล [{$email}] ฝ่าย: " . ($npcjobProfile['department_name'] ?? '-') . " ตำแหน่ง: " . ($resolvedPosition ?? '-'));
            }

            // 6. ตรวจสอบสถานะบัญชี
            if (!$user->is_active) {
                return redirect()->route('login')
                    ->withErrors(['email' => 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ']);
            }

            // 7. เข้าสู่ระบบ
            Auth::login($user, true);

            return redirect()->intended(route('dashboard'));

        } catch (\Exception $e) {
            Log::error('Keycloak SSO Error: ' . $e->getMessage());

            return redirect()->route('login')
                ->withErrors(['email' => 'การเข้าสู่ระบบด้วย SSO ล้มเหลว: ' . $e->getMessage()]);
        }
    }

    /**
     * เรียก npcjob API เพื่อดึงข้อมูลตำแหน่ง/ฝ่ายของ user
     */
    private function fetchNpcjobProfile(?string $username): array
    {
        if (!$username) return [];

        // ตัด @domain ออก: nipon@npc.ac.th → nipon
        $usernameOnly = explode('@', $username)[0];

        try {
            $apiBase  = config('services.npcjob.api_url', 'https://service.npc.ac.th/npcjob/api/user_profile.php');
            $apiToken = config('services.npcjob.api_token', 'npc_sf_2026_api_key_x9k2m');

            Log::info("npcjob API: กำลังดึงข้อมูล username={$usernameOnly} จาก {$apiBase}");

            $response = Http::timeout(5)->get($apiBase, [
                'username' => $usernameOnly,
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
            Log::warning("npcjob API ไม่ตอบสนอง สำหรับ username: {$usernameOnly} — " . $e->getMessage());
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
     * หา Department ที่ตรงกันใน npc_smartflow หรือสร้างใหม่
     */
    private function resolveOrCreateDepartment(array $npcjobProfile): ?Department
    {
        $departmentName = $npcjobProfile['department_name'] ?? null;

        if (!$departmentName) return null;

        // หา department ที่ชื่อตรงกัน
        $dept = Department::where('name', $departmentName)->first();

        if (!$dept) {
            // สร้าง department ใหม่ถ้ายังไม่มี
            $code = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $departmentName), 0, 10))
                    ?: 'DEPT' . rand(100, 999);

            $dept = Department::create([
                'name' => $departmentName,
                'code' => $code,
            ]);

            Log::info("สร้างฝ่ายใหม่จาก npcjob: {$departmentName} (code: {$code})");
        }

        return $dept;
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
}
