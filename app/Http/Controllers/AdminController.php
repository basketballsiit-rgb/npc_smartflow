<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use App\Models\Project;
use App\Models\UserPosition;
use App\Models\RoutineBudgetPlan;
use App\Models\Budget;
use App\Models\ProjectApproval;
use App\Models\Procurement;
use App\Models\Survey;
use App\Models\Appendix;
use App\Models\ProjectPhoto;
use App\Models\ExpenseClearing;
use App\Models\TravelLoan;
use App\Models\SystemSetting;
use App\Models\IqaStrategy;
use App\Models\AuditLog;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    /**
     * Store a newly created user in storage.
     */
    public function storeUser(Request $request)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,id',
            'department_id' => 'nullable|exists:departments,id',
            'position' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'positions' => 'nullable|array',
            'positions.*.id' => 'nullable|integer',
            'positions.*.department_id' => 'required_with:positions|exists:departments,id',
            'positions.*.duty' => 'required_with:positions|string',
            'positions.*.sub_department_id' => 'nullable|exists:departments,id',
            'positions.*.major' => 'nullable|string',
            'positions.*.is_primary' => 'nullable|boolean',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['is_active'] = $request->boolean('is_active', true);

        $incomingPositions = $request->input('positions', []);
        unset($validated['positions']);

        if (empty($validated['department_id'])) {
            $validated['department_id'] = !empty($incomingPositions[0]['department_id']) 
                ? (int)$incomingPositions[0]['department_id'] 
                : Department::value('id');
        }

        $user = User::create($validated);

        if (!empty($incomingPositions)) {
            $this->syncUserPositions($user, $incomingPositions);
        }

        return redirect()->back()->with('success', 'เพิ่มผู้ใช้งานใหม่สำเร็จเรียบร้อยแล้ว');
    }

    /**
     * Update the specified user in storage.
     */
    public function updateUser(Request $request, User $user)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:6',
            'role_id' => 'required|exists:roles,id',
            'department_id' => 'nullable|exists:departments,id',
            'position' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'positions' => 'nullable|array',
            'positions.*.id' => 'nullable|integer',
            'positions.*.department_id' => 'required_with:positions|exists:departments,id',
            'positions.*.duty' => 'required_with:positions|string',
            'positions.*.sub_department_id' => 'nullable|exists:departments,id',
            'positions.*.major' => 'nullable|string',
            'positions.*.is_primary' => 'nullable|boolean',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $validated['is_active'] = $request->boolean('is_active', true);

        $incomingPositions = $request->input('positions');
        unset($validated['positions']);

        $user->update($validated);

        if (is_array($incomingPositions)) {
            $this->syncUserPositions($user, $incomingPositions);
        }

        return redirect()->back()->with('success', 'อัปเดตข้อมูลผู้ใช้งานและตำแหน่งหน้าที่เรียบร้อยแล้ว');
    }

    /**
     * Helper to sync positions list into user_positions table and update user's primary department/position.
     */
    private function syncUserPositions(User $user, array $incomingPositions): void
    {
        if (empty($incomingPositions)) {
            return;
        }

        $incomingIds = [];
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

        $primaryPos = null;
        $allTitles = [];

        foreach ($incomingPositions as $item) {
            $deptId = (int)$item['department_id'];
            $duty = $item['duty'];
            $subDeptId = !empty($item['sub_department_id']) ? (int)$item['sub_department_id'] : null;
            $major = $item['major'] ?? null;
            $isPrimary = !empty($item['is_primary']);

            // If major is selected for head_of_major / teacher, match department under academic division
            if (in_array($duty, ['หัวหน้าสาขาวิชา', 'ครูผู้สอน']) && $major) {
                $matchedDept = Department::where(function($q) use ($major) {
                    $q->where('name', 'like', "%{$major}%");
                })->first();
                if ($matchedDept) {
                    $subDeptId = $matchedDept->id;
                }
            }

            $pos = null;
            if (!empty($item['id'])) {
                $pos = UserPosition::where('id', $item['id'])->where('user_id', $user->id)->first();
            }
            if (!$pos) {
                $pos = new UserPosition();
                $pos->user_id = $user->id;
            }

            $pos->department_id = $deptId;
            $pos->duty = $duty;
            $pos->sub_department_id = $subDeptId;
            $pos->major = $major;
            $pos->is_primary = $isPrimary;
            $pos->position = $pos->formatPositionTitle();
            $pos->save();

            $incomingIds[] = $pos->id;
            $allTitles[] = $pos->position;

            if ($isPrimary || $primaryPos === null) {
                $primaryPos = $pos;
            }
        }

        // Delete positions not in list
        UserPosition::where('user_id', $user->id)
            ->whereNotIn('id', $incomingIds)
            ->delete();

        // Sync user's primary department_id and aggregated position string
        if ($primaryPos) {
            $user->department_id = $primaryPos->sub_department_id ?: $primaryPos->department_id;
            $user->position = implode(' / ', array_unique(array_filter($allTitles)));
            $user->save();
        }
    }

    /**
     * Toggle active/suspended status for a user.
     */
    public function toggleUserStatus(User $user)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        if ($user->id === auth()->id()) {
            return redirect()->back()->with('error', 'ไม่สามารถระงับสิทธิ์การใช้งานของตนเองได้');
        }

        $user->update(['is_active' => !$user->is_active]);

        $statusText = $user->is_active ? 'เปิดใช้งาน' : 'ระงับการใช้งาน';
        return redirect()->back()->with('success', "ทำการ{$statusText}ผู้ใช้ {$user->name} เรียบร้อยแล้ว");
    }

    /**
     * Delete user account.
     */
    public function deleteUser(User $user)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        if ($user->id === auth()->id()) {
            return redirect()->back()->with('error', 'ไม่สามารถลบบัญชีผู้ดูแลระบบของตนเองได้');
        }

        $user->delete();

        return redirect()->back()->with('success', 'ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว');
    }

    /**
     * Bulk update system settings.
     */
    public function updateSettings(Request $request)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $settings = $request->input('settings', []);

        foreach ($settings as $key => $value) {
            $setting = SystemSetting::where('key', $key)->first();
            if ($setting) {
                if ($setting->type === 'boolean') {
                    $val = filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
                } else {
                    $val = (string)$value;
                }
                $setting->update(['value' => $val]);
            } else {
                SystemSetting::create([
                    'key' => $key,
                    'value' => (string)$value,
                    'group' => 'general',
                    'label' => $key,
                    'type' => 'text',
                ]);
            }

            // Sync with Director/Executive User account
            if ($key === 'director_name' && !empty($value)) {
                $directorUser = User::where('role_id', 5)->orWhere('position', 'like', '%ผู้อำนวยการ%')->first();
                if ($directorUser) {
                    $directorUser->update(['name' => trim((string)$value)]);
                }
            }
            if ($key === 'director_position' && !empty($value)) {
                $directorUser = User::where('role_id', 5)->orWhere('position', 'like', '%ผู้อำนวยการ%')->first();
                if ($directorUser) {
                    $directorUser->update(['position' => trim((string)$value)]);
                }
            }
        }

        return redirect()->back()->with('success', 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
    }

    /**
     * Store a new IQA Strategy.
     */
    public function storeIqaStrategy(Request $request)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        IqaStrategy::create($validated);

        return redirect()->back()->with('success', 'เพิ่มยุทธศาสตร์ IQA เรียบร้อยแล้ว');
    }

    /**
     * Update an IQA Strategy.
     */
    public function updateIqaStrategy(Request $request, IqaStrategy $strategy)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $strategy->update($validated);

        return redirect()->back()->with('success', 'อัปเดตยุทธศาสตร์ IQA เรียบร้อยแล้ว');
    }

    /**
     * Delete an IQA Strategy.
     */
    public function deleteIqaStrategy(IqaStrategy $strategy)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $strategy->delete();

        return redirect()->back()->with('success', 'ลบยุทธศาสตร์ IQA เรียบร้อยแล้ว');
    }

    /**
     * Store a new OVEC Strategy.
     */
    public function storeOvecStrategy(Request $request)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        OvecStrategy::create($validated);

        return redirect()->back()->with('success', 'เพิ่มยุทธศาสตร์ สอศ. เรียบร้อยแล้ว');
    }

    /**
     * Update an OVEC Strategy.
     */
    public function updateOvecStrategy(Request $request, OvecStrategy $strategy)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $strategy->update($validated);

        return redirect()->back()->with('success', 'อัปเดตยุทธศาสตร์ สอศ. เรียบร้อยแล้ว');
    }

    /**
     * Delete an OVEC Strategy.
     */
    public function deleteOvecStrategy(OvecStrategy $strategy)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $strategy->delete();

        return redirect()->back()->with('success', 'ลบยุทธศาสตร์ สอศ. เรียบร้อยแล้ว');
    }

    /**
     * Store a new National Strategy.
     */
    public function storeNationalStrategy(Request $request)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        \App\Models\NationalStrategy::create($validated);

        return redirect()->back()->with('success', 'เพิ่มยุทธศาสตร์ชาติเรียบร้อยแล้ว');
    }

    /**
     * Update a National Strategy.
     */
    public function updateNationalStrategy(Request $request, \App\Models\NationalStrategy $strategy)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $strategy->update($validated);

        return redirect()->back()->with('success', 'อัปเดตยุทธศาสตร์ชาติเรียบร้อยแล้ว');
    }

    /**
     * Delete a National Strategy.
     */
    public function deleteNationalStrategy(\App\Models\NationalStrategy $strategy)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $strategy->delete();

        return redirect()->back()->with('success', 'ลบยุทธศาสตร์ชาติเรียบร้อยแล้ว');
    }

    /**
     * Store a new Provincial Strategy.
     */
    public function storeProvincialStrategy(Request $request)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        \App\Models\ProvincialStrategy::create($validated);

        return redirect()->back()->with('success', 'เพิ่มยุทธศาสตร์จังหวัดเรียบร้อยแล้ว');
    }

    /**
     * Update a Provincial Strategy.
     */
    public function updateProvincialStrategy(Request $request, \App\Models\ProvincialStrategy $strategy)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $strategy->update($validated);

        return redirect()->back()->with('success', 'อัปเดตยุทธศาสตร์จังหวัดเรียบร้อยแล้ว');
    }

    /**
     * Delete a Provincial Strategy.
     */
    /**
     * Convert Thai numerals (๐-๙) to Arabic numerals (0-9).
     */
    private function convertThaiToArabicNumerals(?string $text): ?string
    {
        if ($text === null) return null;
        $thai = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        $arabic = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        return str_replace($thai, $arabic, $text);
    }

    /**
     * Store a new dynamic Strategy Category.
     */
    public function storeStrategyCategory(Request $request)
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isPlanHead()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        \App\Models\StrategyCategory::create([
            'name' => $this->convertThaiToArabicNumerals($validated['name']),
            'description' => $this->convertThaiToArabicNumerals($validated['description'] ?? null),
            'is_active' => true,
            'order_index' => \App\Models\StrategyCategory::max('order_index') + 1,
        ]);

        return redirect()->back()->with('success', 'เพิ่มหมวดหมู่อยุทธศาสตร์เรียบร้อยแล้ว');
    }

    /**
     * Update a Strategy Category.
     */
    public function updateStrategyCategory(Request $request, \App\Models\StrategyCategory $category)
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isPlanHead()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category->update([
            'name' => $this->convertThaiToArabicNumerals($validated['name']),
            'description' => $this->convertThaiToArabicNumerals($validated['description'] ?? null),
        ]);

        return redirect()->back()->with('success', 'อัปเดตหมวดหมู่อยุทธศาสตร์เรียบร้อยแล้ว');
    }

    /**
     * Toggle Strategy Category Active / Inactive status.
     */
    public function toggleStrategyCategoryActive(\App\Models\StrategyCategory $category)
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isPlanHead()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $category->update([
            'is_active' => !$category->is_active,
        ]);

        $statusText = $category->is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
        return redirect()->back()->with('success', "เปลี่ยนสถานะ{$statusText}หมวดหมู่อยุทธศาสตร์เรียบร้อยแล้ว");
    }

    /**
     * Delete a Strategy Category.
     */
    public function deleteStrategyCategory(\App\Models\StrategyCategory $category)
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isPlanHead()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $category->delete();

        return redirect()->back()->with('success', 'ลบหมวดหมู่อยุทธศาสตร์เรียบร้อยแล้ว');
    }

    /**
     * Store a new Strategy Item under a Category.
     */
    public function storeStrategyItem(Request $request)
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isPlanHead() && !auth()->user()->isPlanStaff()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $validated = $request->validate([
            'strategy_category_id' => 'required|exists:strategy_categories,id',
            'group_name' => 'nullable|string|max:255',
            'name' => 'required|string|max:500',
        ]);

        $groupName = !empty($validated['group_name']) ? $this->convertThaiToArabicNumerals(trim($validated['group_name'])) : null;
        $name = $this->convertThaiToArabicNumerals(trim($validated['name']));

        // Check if there is an existing standalone placeholder item where name equals $groupName
        if ($groupName) {
            $standalonePlaceholder = \App\Models\StrategyItem::where('strategy_category_id', $validated['strategy_category_id'])
                ->where('name', $groupName)
                ->whereNull('group_name')
                ->first();

            $existingGroupCount = \App\Models\StrategyItem::where('strategy_category_id', $validated['strategy_category_id'])
                ->where('group_name', $groupName)
                ->count();

            // If this is the very first sub-item under this main topic, promote the placeholder item!
            if ($standalonePlaceholder && $existingGroupCount === 0) {
                $standalonePlaceholder->update([
                    'group_name' => $groupName,
                    'name' => $name,
                ]);

                return redirect()->back()->with('success', 'เพิ่มหัวข้อย่อยเรียบร้อยแล้ว');
            }
        }

        \App\Models\StrategyItem::create([
            'strategy_category_id' => $validated['strategy_category_id'],
            'group_name' => $groupName,
            'name' => $name,
            'is_active' => true,
            'order_index' => \App\Models\StrategyItem::where('strategy_category_id', $validated['strategy_category_id'])->max('order_index') + 1,
        ]);

        return redirect()->back()->with('success', 'เพิ่มตัวเลือกยุทธศาสตร์เรียบร้อยแล้ว');
    }

    /**
     * Update a Strategy Item.
     */
    public function updateStrategyItem(Request $request, \App\Models\StrategyItem $item)
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isPlanHead() && !auth()->user()->isPlanStaff()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $validated = $request->validate([
            'group_name' => 'nullable|string|max:255',
            'name' => 'required|string|max:500',
        ]);

        $item->update([
            'group_name' => !empty($validated['group_name']) ? $this->convertThaiToArabicNumerals(trim($validated['group_name'])) : null,
            'name' => $this->convertThaiToArabicNumerals(trim($validated['name'])),
        ]);

        return redirect()->back()->with('success', 'อัปเดตตัวเลือกยุทธศาสตร์เรียบร้อยแล้ว');
    }

    /**
     * Toggle Strategy Item Active status.
     */
    public function toggleStrategyItemActive(\App\Models\StrategyItem $item)
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isPlanHead()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $item->update([
            'is_active' => !$item->is_active,
        ]);

        return redirect()->back()->with('success', 'เปลี่ยนสถานะตัวเลือกยุทธศาสตร์เรียบร้อยแล้ว');
    }

    /**
     * Delete a Strategy Item.
     */
    public function deleteStrategyItem(\App\Models\StrategyItem $item)
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isPlanHead()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $item->delete();

        return redirect()->back()->with('success', 'ลบตัวเลือกยุทธศาสตร์เรียบร้อยแล้ว');
    }

    /**
     * Rename a Strategy Group under a Category.
     */
    public function updateStrategyGroup(Request $request)
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isPlanHead() && !auth()->user()->isPlanStaff()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $validated = $request->validate([
            'strategy_category_id' => 'required|exists:strategy_categories,id',
            'old_group_name' => 'required|string',
            'new_group_name' => 'required|string|max:255',
        ]);

        $newGroupName = $this->convertThaiToArabicNumerals(trim($validated['new_group_name']));

        \App\Models\StrategyItem::where('strategy_category_id', $validated['strategy_category_id'])
            ->where('group_name', trim($validated['old_group_name']))
            ->update(['group_name' => $newGroupName]);

        return redirect()->back()->with('success', 'เปลี่ยนชื่อหัวข้อหลักเรียบร้อยแล้ว');
    }

    /**
     * Delete a Strategy Group and all its sub-items under a Category.
     */
    public function deleteStrategyGroup(Request $request)
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isPlanHead() && !auth()->user()->isPlanStaff()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $validated = $request->validate([
            'strategy_category_id' => 'required|exists:strategy_categories,id',
            'group_name' => 'required|string',
        ]);

        \App\Models\StrategyItem::where('strategy_category_id', $validated['strategy_category_id'])
            ->where('group_name', $validated['group_name'])
            ->delete();

        return redirect()->back()->with('success', 'ลบหัวข้อหลักและรายการย่อยทั้งหมดเรียบร้อยแล้ว');
    }

    /**
     * Batch convert all Thai numerals to Arabic numerals across all strategies.
     */
    public function convertStrategyNumeralsToArabic()
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isPlanHead() && !auth()->user()->isPlanStaff()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $thai = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        $arabic = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        foreach (\App\Models\StrategyCategory::all() as $cat) {
            $cat->update([
                'name' => str_replace($thai, $arabic, $cat->name),
                'description' => $cat->description ? str_replace($thai, $arabic, $cat->description) : null,
            ]);
        }

        foreach (\App\Models\StrategyItem::all() as $item) {
            $item->update([
                'group_name' => $item->group_name ? str_replace($thai, $arabic, $item->group_name) : null,
                'name' => str_replace($thai, $arabic, $item->name),
            ]);
        }

        foreach (\App\Models\IqaStrategy::all() as $item) {
            $item->update(['name' => str_replace($thai, $arabic, $item->name)]);
        }
        foreach (\App\Models\OvecStrategy::all() as $item) {
            $item->update(['name' => str_replace($thai, $arabic, $item->name)]);
        }
        if (class_exists(\App\Models\NationalStrategy::class)) {
            foreach (\App\Models\NationalStrategy::all() as $item) {
                $item->update(['name' => str_replace($thai, $arabic, $item->name)]);
            }
        }
        if (class_exists(\App\Models\ProvincialStrategy::class)) {
            foreach (\App\Models\ProvincialStrategy::all() as $item) {
                $item->update(['name' => str_replace($thai, $arabic, $item->name)]);
            }
        }

        return redirect()->back()->with('success', 'แปลงตัวเลขไทยในยุทธศาสตร์ทั้งหมดเป็นเลขอารบิกเรียบร้อยแล้ว');
    }

    /**
     * Store a newly created department.
     */
    public function storeDepartment(Request $request)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:departments,name',
            'code' => 'nullable|string|max:50',
            'parent_id' => 'nullable|exists:departments,id',
            'deputy_director_name' => 'nullable|string|max:255',
            'deputy_director_position' => 'nullable|string|max:255',
        ]);

        Department::create($validated);

        return redirect()->back()->with('success', 'เพิ่มฝ่าย/สังกัดแผนกใหม่เรียบร้อยแล้ว');
    }

    /**
     * Update the specified department.
     */
    public function updateDepartment(Request $request, Department $department)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('departments', 'name')->ignore($department->id)],
            'code' => 'nullable|string|max:50',
            'parent_id' => 'nullable|exists:departments,id',
            'deputy_director_name' => 'nullable|string|max:255',
            'deputy_director_position' => 'nullable|string|max:255',
        ]);

        $department->update($validated);

        return redirect()->back()->with('success', 'อัปเดตข้อมูลฝ่าย/สังกัดแผนกเรียบร้อยแล้ว');
    }

    /**
     * Delete / Archive department (Soft Delete).
     * Maintains full historical integrity for past projects, budgets, and audit logs.
     */
    public function deleteDepartment(Department $department)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        try {
            DB::transaction(function () use ($department) {
                // If archiving a main division, also soft-delete all its sub-departments
                if (!$department->parent_id) {
                    Department::where('parent_id', $department->id)->delete();
                }

                // Soft-delete the department (Data Integrity Preserved)
                $department->delete();

                AuditLog::record(
                    action: 'archive_department',
                    model: $department,
                    notes: "จัดเก็บถาวร/ปิดการใช้งานฝ่าย: {$department->name} (Soft Delete)"
                );
            });

            return redirect()->back()->with('success', "จัดเก็บและปิดการใช้งาน \"{$department->name}\" เรียบร้อยแล้ว (ข้อมูลโครงการและงบประมาณในอดีตยังคงถูกรักษาความสัมพันธ์ไว้อย่างสมบูรณ์)");
        } catch (\Throwable $e) {
            Log::error('Delete Department Error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return redirect()->back()->with('error', 'ไม่สามารถลบฝ่ายได้: ' . $e->getMessage());
        }
    }

    /**
     * Restore an archived/soft-deleted department.
     */
    public function restoreDepartment($id)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $dept = Department::withTrashed()->findOrFail($id);
        $dept->restore();
        if (!$dept->parent_id) {
            Department::withTrashed()->where('parent_id', $dept->id)->restore();
        }

        AuditLog::record(
            action: 'restore_department',
            model: $dept,
            notes: "กู้คืนการใช้งานฝ่าย: {$dept->name}"
        );
        return redirect()->back()->with('success', "กู้คืนฝ่าย \"{$dept->name}\" กลับมาใช้งานเรียบร้อยแล้ว");
    }

    /**
     * Reorder sub-departments (Drag & Drop persistence).
     */
    public function reorderDepartments(Request $request)
    {
        if (!auth()->user()->isAdmin()) {
            return response()->json(['error' => 'ไม่มีสิทธิ์เข้าถึง'], 403);
        }

        $validated = $request->validate([
            'ordered_ids' => 'required|array',
            'ordered_ids.*' => 'integer',
        ]);

        foreach ($validated['ordered_ids'] as $index => $id) {
            Department::where('id', $id)->update(['order_index' => $index + 1]);
        }

        return response()->json([
            'success' => true,
            'message' => 'บันทึกลำดับโครงสร้างเรียบร้อยแล้ว'
        ]);
    }

    /**
     * AI-Assisted Workload Analysis for Personnel.
     */
    public function aiAnalyzeWorkload(Request $request, GeminiService $gemini)
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isExecutive()) {
            return response()->json(['error' => 'ไม่มีสิทธิ์เข้าถึง'], 403);
        }

        $users = User::with(['role', 'department', 'userPositions'])
            ->where('is_suspended', false)
            ->get();

        $projects = Project::select('id', 'user_id', 'status', 'allocated_budget', 'estimated_budget', 'title')->get();

        $personnelData = $users->map(function ($u) use ($projects) {
            $userProjs = $projects->where('user_id', $u->id);
            $activeProjs = $userProjs->whereNotIn('status', ['completed', 'cancelled']);
            $budgetSum = $userProjs->sum(fn($p) => (float)($p->allocated_budget ?: $p->estimated_budget ?: 0));

            return [
                'id' => $u->id,
                'name' => $u->name,
                'role' => $u->role?->name ?? 'user',
                'role_display' => $u->role_display ?? $u->role?->name ?? 'บุคลากร',
                'department' => $u->department?->name ?? 'ไม่ระบุ',
                'positions_count' => max(1, $u->userPositions->count()),
                'primary_position' => $u->position ?: ($u->userPositions->first()?->position ?? 'เจ้าหน้าที่'),
                'positions_list' => $u->userPositions->pluck('position')->toArray(),
                'total_projects' => $userProjs->count(),
                'active_project_count' => $activeProjs->count(),
                'total_budget' => $budgetSum,
            ];
        })->toArray();

        $analysis = $gemini->analyzePersonnelWorkload($personnelData);

        return response()->json([
            'success' => true,
            'analysis' => $analysis,
            'personnel_summary' => $personnelData,
        ]);
    }

    /**
     * ลบและทำความสะอาดฝ่ายซ้ำซ้อนและโครงการทดสอบตามที่ระบุ
     */
    public static function cleanupDuplicateDepartments(): array
    {
        $results = [
            'deleted_departments' => [],
            'deleted_projects' => [],
            'reassigned_users' => 0,
        ];

        try {
            $depts = Department::where(function ($q) {
                $q->where('name', 'like', '%ฝ่ายบริหารจัดการ%')
                  ->orWhere('name', 'like', '%/ สาขาวิชาการ%')
                  ->orWhere('name', 'like', '%/สาขาวิชาการ%')
                  ->orWhere('name', 'like', '%งานวางแผน%')->where('parent_id', null)->where('name', '!=', 'ฝ่ายยุทธศาสตร์และแผนงาน');
            })->get();

            if ($depts->isEmpty()) {
                return $results;
            }

            \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();

            $planDept = Department::where('name', 'like', '%ฝ่ายยุทธศาสตร์และแผนงาน%')->first()
                ?: Department::where('name', 'like', '%แผนงาน%')->first();
            $acadDept = Department::where('name', 'ฝ่ายวิชาการ')->first()
                ?: Department::where('name', 'like', '%วิชาการ%')->where('name', 'not like', '%สาขาวิชาการ%')->first();

            $deptIds = $depts->pluck('id')->toArray();

            // 1. ลบโครงการทั้งหมดที่อยู่ใต้ฝ่ายซ้ำซ้อนนี้ (เนื่องจากเป็นโครงการทดสอบตามที่ผู้ใช้ร้องขอ)
            $projects = Project::whereIn('department_id', $deptIds)->get();
            foreach ($projects as $proj) {
                Budget::where('project_id', $proj->id)->delete();
                ProjectApproval::where('project_id', $proj->id)->delete();
                Procurement::where('project_id', $proj->id)->delete();
                Survey::where('project_id', $proj->id)->delete();
                Appendix::where('project_id', $proj->id)->delete();
                ProjectPhoto::where('project_id', $proj->id)->delete();
                ExpenseClearing::where('project_id', $proj->id)->delete();
                TravelLoan::where('project_id', $proj->id)->update(['project_id' => null]);

                $results['deleted_projects'][] = [
                    'id' => $proj->id,
                    'title' => $proj->title,
                    'budget' => $proj->estimated_budget,
                ];
                $proj->delete();
            }

            foreach ($depts as $dept) {
                $correctDept = (str_contains($dept->name, 'วางแผน') || str_contains($dept->name, 'จัดการ')) ? $planDept : $acadDept;
                $correctDeptId = $correctDept?->id ?: Department::whereNotIn('id', $deptIds)->whereNull('parent_id')->value('id');

                if ($correctDeptId) {
                    $userCount = User::where('department_id', $dept->id)->update(['department_id' => $correctDeptId]);
                    UserPosition::where('department_id', $dept->id)->update(['department_id' => $correctDeptId]);
                    UserPosition::where('sub_department_id', $dept->id)->update(['sub_department_id' => null]);
                    Department::where('parent_id', $dept->id)->update(['parent_id' => $correctDeptId]);
                    RoutineBudgetPlan::where('department_id', $dept->id)->update(['department_id' => $correctDeptId]);
                    $results['reassigned_users'] += $userCount;
                }

                $results['deleted_departments'][] = [
                    'id' => $dept->id,
                    'name' => $dept->name,
                ];
                $dept->delete();
            }

            \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

            Log::info("Cleanup Duplicate Departments Successfully Completed: " . json_encode($results, JSON_UNESCAPED_UNICODE));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();
            Log::error("Cleanup Duplicate Departments Error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
        }

        return $results;
    }

    /**
     * Web endpoint สำหรับให้ Admin สั่งลบทำความสะอาดฝ่ายซ้ำซ้อนและโครงการทดสอบ
     */
    public function runCleanupDuplicateDepartments()
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $results = self::cleanupDuplicateDepartments();

        return redirect()->route('dashboard', ['tab' => 'admin_users'])
            ->with('success', 'ลบข้อมูลฝ่ายซ้ำซ้อนและโครงการทดสอบเรียบร้อยแล้ว (' . count($results['deleted_departments']) . ' ฝ่าย, ' . count($results['deleted_projects']) . ' โครงการ)');
    }


    /**
     * Store a newly created funding source (by Plan Staff or Admin).
     */
    public function storeFundingSource(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead() && !$user->isPlanStaff()) {
            abort(403, 'คุณไม่มีสิทธิ์จัดการแหล่งงบประมาณ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:100',
            'fiscal_year' => 'nullable|string|max:10',
            'budget_number' => 'nullable|string|max:100',
            'description' => 'nullable|string',
        ]);

        $created = \App\Models\FundingSource::create($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'เพิ่มแหล่งเงินงบประมาณ ' . $validated['name'] . ' สำเร็จเรียบร้อยแล้ว',
                'funding_source' => $created,
            ]);
        }

        return redirect()->back()->with('success', 'เพิ่มแหล่งเงินงบประมาณ ' . $validated['name'] . ' สำเร็จเรียบร้อยแล้ว');
    }

    /**
     * Update the specified funding source.
     */
    public function updateFundingSource(Request $request, \App\Models\FundingSource $fundingSource)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead() && !$user->isPlanStaff()) {
            abort(403, 'คุณไม่มีสิทธิ์จัดการแหล่งงบประมาณ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:100',
            'fiscal_year' => 'nullable|string|max:10',
            'budget_number' => 'nullable|string|max:100',
            'description' => 'nullable|string',
        ]);

        $fundingSource->update($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'อัปเดตแหล่งเงินงบประมาณสำเร็จเรียบร้อยแล้ว',
                'funding_source' => $fundingSource,
            ]);
        }

        return redirect()->back()->with('success', 'อัปเดตแหล่งเงินงบประมาณสำเร็จเรียบร้อยแล้ว');
    }

    /**
     * Delete funding source.
     */
    public function deleteFundingSource(Request $request, \App\Models\FundingSource $fundingSource)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead() && !$user->isPlanStaff()) {
            abort(403, 'คุณไม่มีสิทธิ์จัดการแหล่งงบประมาณ');
        }

        if (\App\Models\Budget::where('funding_source_id', $fundingSource->id)->exists() || 
            Project::where('funding_source_id', $fundingSource->id)->exists()) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'ไม่สามารถลบแหล่งงบประมาณนี้ได้ เนื่องจากมีโครงการ/งบประมาณผูกอยู่'], 422);
            }
            return redirect()->back()->with('error', 'ไม่สามารถลบแหล่งงบประมาณนี้ได้ เนื่องจากมีโครงการ/งบประมาณผูกอยู่');
        }

        $fundingSource->delete();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'ลบแหล่งเงินงบประมาณเรียบร้อยแล้ว',
            ]);
        }

        return redirect()->back()->with('success', 'ลบแหล่งเงินงบประมาณเรียบร้อยแล้ว');
    }

    /**
     * Bulk sync Line User IDs from npc_eleve for all users.
     */
    public function syncAllLineUsersFromEleve()
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        // 1. เรียก pullAllLineUsersFromNpcEleve เพื่อให้ npc_eleve push users ทั้งหมดที่ผูก LINE เข้ามา
        $res = \App\Http\Controllers\Api\TravelLoanApiController::pullAllLineUsersFromNpcEleve();

        if (!empty($res['success'])) {
            $matched = $res['data']['matchedCount'] ?? ($res['count'] ?? 0);
            return redirect()->back()->with('success', "ซิงค์ LINE User ID จาก npc_eleve สำเร็จ (จับคู่กับผู้ใช้ในระบบได้ {$matched} บัญชี)");
        }

        // 2. Fallback: หาก npc_eleve endpoint สำหรับ push ไม่สำเร็จ ให้ดึงทีละคนผ่าน API lookup
        $usersWithoutLine = User::whereNull('line_user_id')->orWhere('line_user_id', '')->get();
        $syncedCount = 0;

        foreach ($usersWithoutLine as $u) {
            $lid = \App\Http\Controllers\Api\TravelLoanApiController::fetchAndSyncUserLineId($u);
            if ($lid) {
                $syncedCount++;
            }
        }

        if ($syncedCount > 0) {
            return redirect()->back()->with('success', "ซิงค์ LINE User ID จาก npc_eleve สำเร็จ โดยตรวจพบและอัปเดต {$syncedCount} บัญชี");
        }

        $msg = $res['message'] ?? 'ไม่พบข้อมูล LINE User ID ใหม่ที่ตรงกับผู้ใช้งานในระบบ หรือผู้ใช้ทุกคนผูกเรียบร้อยแล้ว';
        return redirect()->back()->with('info', "ผลการซิงค์: {$msg}");
    }

    /**
     * Get AI Agents Orchestration Configuration & Prompts
     */
    public function getAiAgentsConfig()
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isPlanStaff()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $apiKey = SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));
        $aiModel = SystemSetting::get('ai_model', 'gemini-2.5-flash');
        $aiTemp = (float)SystemSetting::get('ai_temperature', 0.4);
        $aiEnabled = SystemSetting::get('enable_ai_features', true) || SystemSetting::get('enable_ai_recommendations', true);
        $globalDirective = SystemSetting::get('ai_global_directive', GeminiService::getDefaultGlobalDirective());

        $definitions = GeminiService::getAgentsDefinitions();
        $agents = [];
        foreach ($definitions as $key => $agent) {
            $agent['custom_prompt'] = SystemSetting::get("ai_prompt_{$key}", $agent['default_prompt']);
            $agents[] = $agent;
        }

        return response()->json([
            'success' => true,
            'has_api_key' => !empty($apiKey),
            'ai_model' => $aiModel,
            'ai_temperature' => $aiTemp,
            'ai_enabled' => $aiEnabled,
            'global_directive' => $globalDirective,
            'agents' => $agents
        ]);
    }

    /**
     * Update AI Agents Configuration & Prompts
     */
    public function updateAiAgentsConfig(Request $request)
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isPlanStaff()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        if ($request->has('ai_global_directive')) {
            SystemSetting::set('ai_global_directive', $request->input('ai_global_directive'), 'ai', 'คำสั่งนโยบายกลางของวิทยาลัย', 'textarea');
        }

        if ($request->has('ai_model')) {
            SystemSetting::set('ai_model', $request->input('ai_model'), 'ai', 'รุ่นโมเดล AI Gemini', 'text');
        }

        if ($request->has('ai_temperature')) {
            SystemSetting::set('ai_temperature', (string)$request->input('ai_temperature'), 'ai', 'ระดับความสร้างสรรค์ (Temperature)', 'text');
        }

        if ($request->has('gemini_api_key')) {
            $key = trim($request->input('gemini_api_key'));
            if (!empty($key)) {
                SystemSetting::set('gemini_api_key', $key, 'ai', 'Google Gemini API Key', 'text');
            }
        }

        if ($request->has('enable_ai_features')) {
            $enabled = filter_var($request->input('enable_ai_features'), FILTER_VALIDATE_BOOLEAN);
            SystemSetting::set('enable_ai_features', $enabled ? 'true' : 'false', 'ai', 'เปิดใช้งานฟีเจอร์ AI', 'boolean');
            SystemSetting::set('enable_ai_recommendations', $enabled ? 'true' : 'false', 'ai', 'เปิดใช้งาน AI Gemini', 'boolean');
        }

        $prompts = $request->input('prompts', []);
        foreach ($prompts as $agentId => $promptText) {
            SystemSetting::set("ai_prompt_{$agentId}", $promptText, 'ai', "คำสั่งเฉพาะ AI {$agentId}", 'textarea');
        }

        return response()->json([
            'success' => true,
            'message' => 'บันทึกการตั้งค่าคำสั่ง AI ทุกส่วนงานและนโยบายกลางเรียบร้อยแล้ว'
        ]);
    }

    /**
     * Reset AI Agents Prompts to Standard Vocational Defaults
     */
    public function resetAiAgentDefaults(Request $request)
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isPlanStaff()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $agentId = $request->input('agent_id');
        $definitions = GeminiService::getAgentsDefinitions();

        if ($agentId && isset($definitions[$agentId])) {
            SystemSetting::set("ai_prompt_{$agentId}", $definitions[$agentId]['default_prompt'], 'ai', "คำสั่งเฉพาะ AI {$agentId}", 'textarea');
            return response()->json([
                'success' => true,
                'message' => "คืนค่าคำสั่งมาตรฐานสำหรับ {$definitions[$agentId]['title']} เรียบร้อยแล้ว",
                'prompt' => $definitions[$agentId]['default_prompt']
            ]);
        }

        // Reset all
        foreach ($definitions as $key => $agent) {
            SystemSetting::set("ai_prompt_{$key}", $agent['default_prompt'], 'ai', "คำสั่งเฉพาะ AI {$key}", 'textarea');
        }
        SystemSetting::set('ai_global_directive', GeminiService::getDefaultGlobalDirective(), 'ai', 'คำสั่งนโยบายกลางของวิทยาลัย', 'textarea');

        return response()->json([
            'success' => true,
            'message' => 'คืนค่าคำสั่งมาตรฐาน สอศ. สำหรับ AI ทุกส่วนงานและนโยบายกลางเรียบร้อยแล้ว'
        ]);
    }

    /**
     * Test Gemini AI Connection and Measure Latency
     */
    public function testAiConnection(Request $request)
    {
        if (!auth()->user()->isAdmin() && !auth()->user()->isPlanStaff()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $apiKey = trim($request->input('gemini_api_key')) ?: SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));
        $model = $request->input('ai_model') ?: SystemSetting::get('ai_model', 'gemini-2.5-flash');

        if (empty($apiKey)) {
            return response()->json([
                'success' => false,
                'message' => 'ไม่พบ Gemini API Key กรุณาระบุ API Key ก่อนทดสอบ'
            ]);
        }

        $startTime = microtime(true);
        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders(['Content-Type' => 'application/json'])
                ->withoutVerifying()
                ->timeout(12)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                    'contents' => [
                        ['parts' => [['text' => 'ตอบสั้นๆ เพียง 1 คำ: พร้อมทำงาน']]]
                    ]
                ]);

            $latency = round((microtime(true) - $startTime) * 1000);

            if ($response->successful()) {
                $data = $response->json();
                $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'พร้อมทำงาน';
                return response()->json([
                    'success' => true,
                    'latency_ms' => $latency,
                    'model' => $model,
                    'reply' => trim($reply),
                    'message' => "เชื่อมต่อ AI สำเร็จ! ความเร็วตอบสนอง: {$latency} ms"
                ]);
            }

            return response()->json([
                'success' => false,
                'latency_ms' => $latency,
                'status' => $response->status(),
                'message' => 'API ปฏิเสธการเชื่อมต่อ: ' . ($response->json()['error']['message'] ?? 'Status ' . $response->status())
            ]);
        } catch (\Throwable $e) {
            $latency = round((microtime(true) - $startTime) * 1000);
            return response()->json([
                'success' => false,
                'latency_ms' => $latency,
                'message' => 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' . $e->getMessage()
            ]);
        }
    }
}
