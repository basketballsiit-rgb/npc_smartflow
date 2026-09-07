<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // ตรวจสอบและดึง Line User ID จากระบบ npc_eleve มาบันทึกใน SmartFlow (ถ้ายังไม่มี)
        $user = Auth::user();
        if ($user && empty($user->line_user_id)) {
            try {
                \App\Http\Controllers\Api\TravelLoanApiController::fetchAndSyncUserLineId($user);
            } catch (\Exception $ex) {
                \Illuminate\Support\Facades\Log::warning("Login: ไม่สามารถดึง LineUserID จาก npc_eleve สำหรับ {$user->name}: " . $ex->getMessage());
            }
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
