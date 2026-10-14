<?php

namespace App\Http\Controllers;

use App\Models\SpecialProjectBudget;
use App\Models\Project;
use Illuminate\Http\Request;

class SpecialProjectBudgetController extends Controller
{
    /**
     * Store a newly created special project budget allocation.
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        $isPlanStaff = $user->isAdmin() || $user->isPlanHead() || ($user->department && (str_contains($user->department->name, 'แผน') || $user->department->code === 'PLAN'));
        if (!$isPlanStaff) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้');
        }

        $validated = $request->validate([
            'fiscal_year' => 'required|string',
            'document_number' => 'nullable|string|max:255',
            'document_date' => 'nullable|date',
            'title' => 'required|string|max:255',
            'agency_name' => 'nullable|string|max:255',
            'allocated_amount' => 'required|numeric|min:0',
            'project_id' => 'nullable|exists:projects,id',
            'description' => 'nullable|string',
        ], [
            'title.required' => 'กรุณาระบุชื่อรายการงบเฉพาะกิจ / โครงการ',
            'allocated_amount.required' => 'กรุณาระบุจำนวนเงินที่ได้รับจัดสรร',
        ]);

        $validated['created_by'] = $user->id;
        $special = SpecialProjectBudget::create($validated);

        if (!empty($validated['project_id'])) {
            $project = Project::find($validated['project_id']);
            if ($project) {
                $project->special_project_budget_id = $special->id;
                $project->save();
            }
        }

        return redirect()->back()->with('success', 'บันทึกรับงบเฉพาะกิจสำหรับโครงการเรียบร้อยแล้ว');
    }

    /**
     * Update the specified special project budget allocation.
     */
    public function update(Request $request, SpecialProjectBudget $specialProjectBudget)
    {
        $user = auth()->user();
        $isPlanStaff = $user->isAdmin() || $user->isPlanHead() || ($user->department && (str_contains($user->department->name, 'แผน') || $user->department->code === 'PLAN'));
        if (!$isPlanStaff) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้');
        }

        $validated = $request->validate([
            'fiscal_year' => 'required|string',
            'document_number' => 'nullable|string|max:255',
            'document_date' => 'nullable|date',
            'title' => 'required|string|max:255',
            'agency_name' => 'nullable|string|max:255',
            'allocated_amount' => 'required|numeric|min:0',
            'project_id' => 'nullable|exists:projects,id',
            'description' => 'nullable|string',
        ], [
            'title.required' => 'กรุณาระบุชื่อรายการงบเฉพาะกิจ / โครงการ',
            'allocated_amount.required' => 'กรุณาระบุจำนวนเงินที่ได้รับจัดสรร',
        ]);

        $oldProjectId = $specialProjectBudget->project_id;
        $specialProjectBudget->update($validated);

        if ($oldProjectId && $oldProjectId != $validated['project_id']) {
            $oldProj = Project::find($oldProjectId);
            if ($oldProj && $oldProj->special_project_budget_id == $specialProjectBudget->id) {
                $oldProj->special_project_budget_id = null;
                $oldProj->save();
            }
        }

        if (!empty($validated['project_id'])) {
            $proj = Project::find($validated['project_id']);
            if ($proj) {
                $proj->special_project_budget_id = $specialProjectBudget->id;
                $proj->save();
            }
        }

        return redirect()->back()->with('success', 'แก้ไขข้อมูลงบเฉพาะกิจสำหรับโครงการเรียบร้อยแล้ว');
    }

    /**
     * Remove the specified special project budget allocation.
     */
    public function destroy(SpecialProjectBudget $specialProjectBudget)
    {
        $user = auth()->user();
        $isPlanStaff = $user->isAdmin() || $user->isPlanHead() || ($user->department && (str_contains($user->department->name, 'แผน') || $user->department->code === 'PLAN'));
        if (!$isPlanStaff) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้');
        }

        if ($specialProjectBudget->project_id) {
            $proj = Project::find($specialProjectBudget->project_id);
            if ($proj && $proj->special_project_budget_id == $specialProjectBudget->id) {
                $proj->special_project_budget_id = null;
                $proj->save();
            }
        }

        $specialProjectBudget->delete();

        return redirect()->back()->with('success', 'ลบรายการงบเฉพาะกิจสำหรับโครงการเรียบร้อยแล้ว');
    }
}
