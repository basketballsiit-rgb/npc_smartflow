<?php

namespace App\Http\Controllers;

use App\Models\RoutineBudgetPlan;
use App\Models\Department;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoutineBudgetController extends Controller
{
    /**
     * Display a listing of routine budget plans.
     */
    public function index()
    {
        $user = auth()->user();
        $fiscalYear = SystemSetting::where('key', 'current_fiscal_year')->value('value') ?? date('Y') + 543;

        if ($user->isAdmin() || $user->isPlanHead()) {
            $routinePlans = RoutineBudgetPlan::with(['department', 'procurements.items', 'procurements.committees'])->latest()->get();
        } else {
            $deptIds = $user->getResponsibleDepartmentIds();
            $routinePlans = RoutineBudgetPlan::whereIn('department_id', $deptIds)
                ->with(['department', 'procurements.items', 'procurements.committees'])
                ->latest()
                ->get();
        }

        return Inertia::render('RoutineBudgets/Index', [
            'routinePlans' => $routinePlans,
            'departments' => Department::all(),
            'currentFiscalYear' => $fiscalYear,
            'allUsers' => \App\Models\User::where('is_active', true)->orderBy('name', 'asc')->get(),
        ]);
    }

    /**
     * Store a newly created routine budget plan.
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $validated = $request->validate([
            'fiscal_year' => 'required|string',
            'department_id' => 'required|exists:departments,id',
            'title' => 'required|string|max:255',
            'allocated_amount' => 'required|numeric|min:0',
        ], [
            'title.required' => 'กรุณาระบุชื่อแผนงบประมาณ',
            'allocated_amount.required' => 'กรุณาระบุจำนวนเงิน',
            'allocated_amount.numeric' => 'จำนวนเงินต้องเป็นตัวเลข',
        ]);

        RoutineBudgetPlan::create($validated);

        return redirect()->back()->with('success', 'เพิ่มแผนงบประมาณประจำปีเรียบร้อยแล้ว');
    }

    /**
     * Update the specified routine budget plan.
     */
    public function update(Request $request, RoutineBudgetPlan $routineBudget)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'allocated_amount' => 'required|numeric|min:0',
        ], [
            'title.required' => 'กรุณาระบุชื่อแผนงบประมาณ',
            'allocated_amount.required' => 'กรุณาระบุจำนวนเงิน',
        ]);

        $routineBudget->update($validated);

        return redirect()->back()->with('success', 'แก้ไขข้อมูลแผนงบประมาณเรียบร้อยแล้ว');
    }

    /**
     * Remove the specified routine budget plan.
     */
    public function destroy(RoutineBudgetPlan $routineBudget)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        }

        $routineBudget->delete();

        return redirect()->back()->with('success', 'ลบแผนงบประมาณประจำปีเรียบร้อยแล้ว');
    }
}
