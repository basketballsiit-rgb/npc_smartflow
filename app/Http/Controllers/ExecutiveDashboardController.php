<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Budget;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExecutiveDashboardController extends Controller
{
    /**
     * Display the executive dashboard.
     */
    public function index(Request $request)
    {
        // 1. Fetch departments and compute global metrics for each
        $departmentMetrics = Department::all()->map(function ($dept) {
            $projectIds = Project::where('department_id', $dept->id)->pluck('id');

            return [
                'id' => $dept->id,
                'name' => $dept->name,
                'code' => $dept->code,
                'total_projects' => Project::where('department_id', $dept->id)->count(),
                'approved_projects' => Project::where('department_id', $dept->id)->where('status', 'approved')->count(),
                'total_estimated_budget' => (float) Project::where('department_id', $dept->id)->sum('estimated_budget'),
                'total_spent_budget' => (float) Budget::whereIn('project_id', $projectIds)->sum('spent_amount'),
            ];
        });

        // 2. Budget comparison summary
        $execTotalAllocated = (float) Budget::sum('allocated_amount');
        if ($execTotalAllocated <= 0) {
            $execTotalAllocated = (float) Project::whereIn('status', ['approved', 'budget_approved', 'completed', 'in_progress'])->sum('allocated_budget');
        }
        $execTotalEncumbered = (float) Budget::sum('encumbered_amount');
        $execTotalSpent = (float) Budget::sum('spent_amount');
        $execDisbursementRate = $execTotalAllocated > 0 ? round(($execTotalSpent / $execTotalAllocated) * 100, 2) : 0.00;
        $execEncumbranceRate = $execTotalAllocated > 0 ? round(($execTotalEncumbered / $execTotalAllocated) * 100, 2) : 0.00;
        $execRemainingBudget = max(0, $execTotalAllocated - $execTotalSpent);
        $execRemainingRate = $execTotalAllocated > 0 ? round(($execRemainingBudget / $execTotalAllocated) * 100, 2) : 0.00;

        $budgetSummary = [
            'total_allocated' => $execTotalAllocated,
            'total_encumbered' => $execTotalEncumbered,
            'total_spent' => $execTotalSpent,
            'remaining_budget' => $execRemainingBudget,
            'disbursement_percentage' => $execDisbursementRate,
            'encumbrance_percentage' => $execEncumbranceRate,
            'remaining_percentage' => $execRemainingRate,
        ];

        // 3. Completed projects list (approved projects with survey response counts)
        $completedProjects = Project::where('status', 'approved')
            ->with(['user', 'department', 'survey.responses', 'budget'])
            ->latest()
            ->get()
            ->map(function ($proj) {
                return [
                    'id' => $proj->id,
                    'title' => $proj->title,
                    'proposer' => $proj->user?->name ?? 'N/A',
                    'department' => $proj->department?->name ?? 'N/A',
                    'estimated_budget' => $proj->estimated_budget,
                    'spent_budget' => $proj->budget?->spent_amount ?? 0.00,
                    'survey_responses_count' => $proj->survey?->responses()->count() ?? 0,
                    'approved_at' => $proj->approved_at?->format('d/m/Y') ?? 'N/A',
                ];
            });

        // 4. โครงการทั้งหมดในฝ่ายที่ผู้บริหารดูแล (ทุกสถานะ เพื่อการติดตามตั้งแต่เริ่มต้น)
        $user = $request->user();
        $responsibleDeptIds = $user->getResponsibleDepartmentIds();

        $departmentProjects = Project::whereIn('department_id', $responsibleDeptIds)
            ->with(['user', 'department', 'budget'])
            ->latest()
            ->get()
            ->map(function ($proj) {
                return [
                    'id'               => $proj->id,
                    'title'            => $proj->title,
                    'proposer'         => $proj->user?->name ?? 'N/A',
                    'department'       => $proj->department?->name ?? 'N/A',
                    'estimated_budget' => $proj->estimated_budget,
                    'status'           => $proj->status,
                    'created_at'       => $proj->created_at->format('d/m/Y'),
                ];
            });

        return Inertia::render('Executive/Dashboard', [
            'departmentMetrics'  => $departmentMetrics,
            'budgetSummary'      => $budgetSummary,
            'completedProjects'  => $completedProjects,
            'departmentProjects' => $departmentProjects, // ส่งโครงการของฝ่ายไปให้ UI
        ]);
    }
}
