<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use Illuminate\Support\Facades\Auth;
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
     */
    public function callback()
    {
        try {
            // ดึงข้อมูล user จาก Keycloak
            $keycloakUser = Socialite::driver('keycloak')->stateless()->user();

            $email    = $keycloakUser->getEmail();
            $name     = $keycloakUser->getName()
                        ?? ($keycloakUser->user['given_name'] ?? '')
                        . ' ' . ($keycloakUser->user['family_name'] ?? '');
            $name     = trim($name) ?: $email;

            // ค้นหา user ที่มีอยู่ในระบบด้วย email
            $user = User::where('email', $email)->first();

            if (!$user) {
                // Auto-provision: สร้าง user ใหม่จากข้อมูล Keycloak
                $defaultRole = Role::where('name', 'teacher')->first()
                               ?? Role::first();
                $defaultDept = Department::first();

                $user = User::create([
                    'name'          => $name,
                    'email'         => $email,
                    'password'      => bcrypt(Str::random(32)), // random password ที่ไม่สามารถ login ตรงได้
                    'role_id'       => $defaultRole?->id,
                    'department_id' => $defaultDept?->id,
                    'position'      => 'บุคลากร',
                    'is_active'     => true,
                ]);

                Log::info("Keycloak SSO: สร้างบัญชีใหม่สำหรับ {$email}");
            }

            // ตรวจสอบว่าบัญชีถูก active อยู่
            if (!$user->is_active) {
                return redirect()->route('login')
                    ->withErrors(['email' => 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ']);
            }

            // เข้าสู่ระบบ
            Auth::login($user, true);

            Log::info("Keycloak SSO: {$email} เข้าสู่ระบบสำเร็จ");

            return redirect()->intended(route('dashboard'));

        } catch (\Exception $e) {
            Log::error('Keycloak SSO Error: ' . $e->getMessage());

            return redirect()->route('login')
                ->withErrors(['email' => 'การเข้าสู่ระบบด้วย SSO ล้มเหลว: ' . $e->getMessage()]);
        }
    }
}
