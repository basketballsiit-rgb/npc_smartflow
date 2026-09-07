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
        $user = $request->user();

        // ฝ่ายหลัก 4 ฝ่าย (parent_id is null)
        $divisions = \App\Models\Department::whereNull('parent_id')
            ->orderBy('id', 'asc')
            ->get();

        // งานย่อยและสาขาวิชาทั้งหมด
        $subDepartments = \App\Models\Department::whereNotNull('parent_id')
            ->orderBy('parent_id', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $availableMajors = [
            'ช่างยนต์',
            'สารสนเทศ',
            'เทคนิคพื้นฐาน',
            'อิเล็กทรอนิกส์',
            'ไฟฟ้า',
            'บัญชี',
            'การตลาด',
            'สามัญสัมพันธ์',
            'ระยะสั้น',
        ];

        $availableDuties = [
            'หัวหน้างาน',
            'หัวหน้าสาขาวิชา',
            'เจ้าหน้าที่',
            'ครูผู้สอน',
        ];

        $userPositions = $user->userPositions()
            ->with(['department', 'subDepartment'])
            ->orderBy('is_primary', 'desc')
            ->orderBy('id', 'asc')
            ->get();

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'divisions' => $divisions,
            'subDepartments' => $subDepartments,
            'availableMajors' => $availableMajors,
            'availableDuties' => $availableDuties,
            'initialPositions' => $userPositions,
        ]);
    }

    /**
     * Update and sync user duties & positions.
     */
    public function savePositions(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'positions' => 'required|array|min:1',
            'positions.*.id' => 'nullable|integer',
            'positions.*.department_id' => 'required|exists:departments,id',
            'positions.*.duty' => 'required|string|in:หัวหน้างาน,หัวหน้าสาขาวิชา,เจ้าหน้าที่,ครูผู้สอน',
            'positions.*.sub_department_id' => 'nullable|exists:departments,id',
            'positions.*.major' => 'nullable|string',
            'positions.*.is_primary' => 'nullable|boolean',
        ], [
            'positions.required' => 'กรุณาระบุภาระงานอย่างน้อย 1 รายการ',
            'positions.min' => 'กรุณาระบุภาระงานอย่างน้อย 1 รายการ',
            'positions.*.department_id.required' => 'กรุณาเลือกฝ่ายที่สังกัด',
            'positions.*.duty.required' => 'กรุณาเลือกหน้าที่',
        ]);

        $incomingPositions = $validated['positions'];
        $incomingIds = [];

        // Check if there is any primary position marked, else mark the first one as primary
        $hasPrimary = false;
        foreach ($incomingPositions as $p) {
            if (!empty($p['is_primary'])) {
                $hasPrimary = true;
                break;
            }
        }
        if (!$hasPrimary && count($incomingPositions) > 0) {
            $incomingPositions[0]['is_primary'] = true;
        }

        // Save each position
        $primaryPosModel = null;
        foreach ($incomingPositions as $item) {
            $deptId = (int)$item['department_id'];
            $duty = $item['duty'];
            $subDeptId = !empty($item['sub_department_id']) ? (int)$item['sub_department_id'] : null;
            $major = $item['major'] ?? null;
            $isPrimary = !empty($item['is_primary']);

            // If major is selected for head_of_major / teacher, find or match sub_department_id under academic division
            if (in_array($duty, ['หัวหน้าสาขาวิชา', 'ครูผู้สอน']) && $major) {
                $matchedDept = \App\Models\Department::where(function($q) use ($major) {
                    $q->where('name', 'like', "%{$major}%");
                })->first();
                if ($matchedDept) {
                    $subDeptId = $matchedDept->id;
                }
            }

            $pos = null;
            if (!empty($item['id'])) {
                $pos = \App\Models\UserPosition::where('id', $item['id'])->where('user_id', $user->id)->first();
            }

            if (!$pos) {
                $pos = new \App\Models\UserPosition();
                $pos->user_id = $user->id;
            }

            $pos->department_id = $deptId;
            $pos->duty = $duty;
            $pos->sub_department_id = $subDeptId;
            $pos->major = $major;
            $pos->is_primary = $isPrimary;
            $pos->save();

            // Refresh formatted title and persist
            $pos->position = $pos->formatPositionTitle();
            $pos->save();

            $incomingIds[] = $pos->id;

            if ($isPrimary || $primaryPosModel === null) {
                $primaryPosModel = $pos;
            }
        }

        // Remove positions deleted by user
        \App\Models\UserPosition::where('user_id', $user->id)
            ->whereNotIn('id', $incomingIds)
            ->delete();

        // Update primary position in users table for backwards-compatibility
        if ($primaryPosModel) {
            $user->department_id = $primaryPosModel->sub_department_id ?: $primaryPosModel->department_id;
            $user->position = $primaryPosModel->position;
            $user->save();
        }

        return Redirect::back()->with('message', 'บันทึกข้อมูลภาระงานและหน้าที่ความรับผิดชอบเรียบร้อยแล้ว');
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
