<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Update or register the user's 13-digit Thai Citizen ID (stored encrypted).
     */
    public function updateCitizenId(Request $request): RedirectResponse
    {
        $request->validate([
            'citizen_id' => 'required|string|regex:/^[0-9\-]{13,17}$/',
        ], [
            'citizen_id.required' => 'กรุณากรอกเลขประจำตัวประชาชน 13 หลัก',
            'citizen_id.regex' => 'รูปแบบเลขประจำตัวประชาชนไม่ถูกต้อง (ต้องเป็นตัวเลข 13 หลัก)',
        ]);

        $cleanCitizenId = preg_replace('/[^0-9]/', '', $request->input('citizen_id'));

        if (strlen($cleanCitizenId) !== 13) {
            return Redirect::back()->withErrors(['citizen_id' => 'เลขประจำตัวประชาชนต้องมีครบ 13 หลัก']);
        }

        $user = $request->user();
        $user->citizen_id = $cleanCitizenId;
        $user->save();

        return Redirect::back()->with('message', 'บันทึกเลขประจำตัวประชาชน 13 หลัก (เข้ารหัสความปลอดภัย AES-256) เรียบร้อยแล้ว');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
