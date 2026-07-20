<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use App\Models\Project;
use App\Models\SystemSetting;
use App\Models\IqaStrategy;
use App\Models\OvecStrategy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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
            'department_id' => 'required|exists:departments,id',
            'position' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['is_active'] = $request->boolean('is_active', true);

        User::create($validated);

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
            'department_id' => 'required|exists:departments,id',
            'position' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $validated['is_active'] = $request->boolean('is_active', true);

        $user->update($validated);

        return redirect()->back()->with('success', 'อัปเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว');
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
                    'group' => 'academic',
                    'label' => $key,
                    'type' => 'text',
                ]);
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
     * Store a new dynamic Strategy Category.
     */
    public function storeStrategyCategory(Request $request)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        \App\Models\StrategyCategory::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
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
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category->update($validated);

        return redirect()->back()->with('success', 'อัปเดตหมวดหมู่อยุทธศาสตร์เรียบร้อยแล้ว');
    }

    /**
     * Toggle Strategy Category Active / Inactive status.
     */
    public function toggleStrategyCategoryActive(\App\Models\StrategyCategory $category)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
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
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $category->delete();

        return redirect()->back()->with('success', 'ลบหมวดหมู่อยุทธศาสตร์เรียบร้อยแล้ว');
    }

    /**
     * Store a new Strategy Item under a Category.
     */
    public function storeStrategyItem(Request $request)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'strategy_category_id' => 'required|exists:strategy_categories,id',
            'name' => 'required|string|max:255',
        ]);

        \App\Models\StrategyItem::create([
            'strategy_category_id' => $validated['strategy_category_id'],
            'name' => $validated['name'],
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
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $item->update($validated);

        return redirect()->back()->with('success', 'อัปเดตตัวเลือกยุทธศาสตร์เรียบร้อยแล้ว');
    }

    /**
     * Toggle Strategy Item Active status.
     */
    public function toggleStrategyItemActive(\App\Models\StrategyItem $item)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
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
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        $item->delete();

        return redirect()->back()->with('success', 'ลบตัวเลือกยุทธศาสตร์เรียบร้อยแล้ว');
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
        ]);

        $department->update($validated);

        return redirect()->back()->with('success', 'อัปเดตข้อมูลฝ่าย/สังกัดแผนกเรียบร้อยแล้ว');
    }

    /**
     * Delete department.
     */
    public function deleteDepartment(Department $department)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        }

        // Prevent deletion if there are active projects attached to this department
        if (Project::where('department_id', $department->id)->count() > 0) {
            return redirect()->back()->with('error', 'ไม่สามารถลบฝ่ายนี้ได้ เนื่องจากมีโครงการในระบบผูกอยู่กับฝ่ายนี้');
        }

        // Safely reassign users to parent department or null before deleting
        User::where('department_id', $department->id)->update([
            'department_id' => $department->parent_id
        ]);

        // Safely reassign any child sub-departments to parent department
        Department::where('parent_id', $department->id)->update([
            'parent_id' => $department->parent_id
        ]);

        $department->delete();

        return redirect()->back()->with('success', 'ลบข้อมูลฝ่าย/สังกัดแผนกเรียบร้อยแล้ว');
    }
}
