<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Department;
use App\Models\Budget;
use App\Models\FundingSource;
use App\Models\User;
use App\Models\Role;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Handle the unified role-based dashboard landing view.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $role = $user->isAdmin() ? 'admin' :
               ($user->isExecutive() ? 'executive' :
               ($user->isPlanHead() ? 'plan_head' :
               ($user->isProcurementHead() ? 'procurement_head' : 'teacher')));

        $data = [
            'role' => $role,
            'currentTab' => $request->query('tab'),
        ];

        // Global data available for User/Admin Management
        $data['allRoles'] = Role::all();
        $data['allDepartments'] = Department::all();
        $data['systemSettings'] = SystemSetting::all();

        // 0. Admin Dashboard Data
        if ($user->isAdmin()) {
            $data['adminData'] = [
                'users' => User::with(['role', 'department'])->get()->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'role_id' => $u->role_id,
                        'role_name' => $u->role?->name ?? 'N/A',
                        'role_display' => $u->role?->display_name ?? 'N/A',
                        'department_id' => $u->department_id,
                        'department_name' => $u->department?->name ?? 'N/A',
                        'position' => $u->position ?? 'ไม่ได้ระบุ',
                        'is_active' => (bool)$u->is_active,
                    ];
                }),
                'stats' => [
                    'totalUsers' => User::count(),
                    'activeUsers' => User::where('is_active', true)->count(),
                    'suspendedUsers' => User::where('is_active', false)->count(),
                    'totalDepartments' => Department::count(),
                    'totalProjects' => Project::count(),
                ],
                'iqaStrategies' => \App\Models\IqaStrategy::all(),
                'ovecStrategies' => \App\Models\OvecStrategy::all(),
                'nationalStrategies' => \App\Models\NationalStrategy::all(),
                'provincialStrategies' => \App\Models\ProvincialStrategy::all(),
                'strategyCategories' => \App\Models\StrategyCategory::with(['items'])->orderBy('order_index', 'asc')->orderBy('id', 'asc')->get(),
            ];
        }

        // 1. Teacher / User Proposals Data (Always loaded for all users so anyone can view their own projects)
        $data['teacherData'] = [
            'projects' => Project::where('user_id', $user->id)
                ->with(['department', 'iqaStrategy', 'ovecStrategy', 'approvals'])
                ->latest()
                ->get(),
            'proposalsCount' => Project::where('user_id', $user->id)->count(),
            'approvedCount' => Project::where('user_id', $user->id)->where('status', 'approved')->count(),
            'totalBudget' => Project::where('user_id', $user->id)->sum('estimated_budget'),
        ];

        // 2. Plan Head Dashboard Data
        if ($user->isPlanHead() || $user->isAdmin()) {
            $fundingSources = FundingSource::all();
            $fundingChannelProgress = [];

            foreach ($fundingSources as $source) {
                $allocated = Budget::where('funding_source_id', $source->id)->sum('allocated_amount');
                $encumbered = Budget::where('funding_source_id', $source->id)->sum('encumbered_amount');
                $spent = Budget::where('funding_source_id', $source->id)->sum('spent_amount');

                $fundingChannelProgress[] = [
                    'id' => $source->id,
                    'name' => $source->name,
                    'allocated' => $allocated,
                    'encumbered' => $encumbered,
                    'spent' => $spent,
                ];
            }

            $data['planHeadData'] = [
                'fundingSources' => $fundingSources,
                'globalAllocated' => Budget::sum('allocated_amount'),
                'globalEncumbered' => Budget::sum('encumbered_amount'),
                'globalSpent' => Budget::sum('spent_amount'),
                'fundingChannelProgress' => $fundingChannelProgress,
                'planHeadQueue' => Project::whereIn('status', ['pending_approval', 'submitted', 'draft', 'rejected'])
                    ->with(['user', 'department', 'budget.fundingSource', 'approvals'])
                    ->orderByRaw("CASE WHEN status = 'pending_approval' AND current_approval_step = 3 THEN 0 WHEN status = 'pending_approval' THEN 1 ELSE 2 END")
                    ->latest()
                    ->get(),
                'advancePayments' => Budget::where('is_advance_payment', true)
                    ->whereNull('advance_cleared_at')
                    ->with(['project.user', 'project.department'])
                    ->latest()
                    ->get(),
            ];
        }

        // 3. Procurement Head Dashboard Data
        if ($user->isProcurementHead() || $user->isAdmin()) {
            $data['procurementData'] = [
                'procurementQueue' => Project::where('status', 'approved')
                    ->orWhereHas('procurement')
                    ->with(['user', 'department', 'procurement.items', 'procurement.committees'])
                    ->latest()
                    ->get(),
                'users' => User::with('department')->get()->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'role_display' => $u->role?->display_name ?? 'Teacher',
                        'department_name' => $u->department?->name ?? 'N/A',
                        'position' => $u->position ?? 'ไม่ได้ระบุ',
                    ];
                }),
            ];
        }

        // 4. Executive Dashboard Data
        if ($user->isExecutive() || $user->isAdmin()) {
            $mainDivisions = Department::whereNull('parent_id')->with('children')->get();
            $divisionTreeMetrics = [];

            foreach ($mainDivisions as $mainDept) {
                $childIds = $mainDept->children->pluck('id')->toArray();
                $allIds = array_merge([$mainDept->id], $childIds);

                $totalProjects = Project::whereIn('department_id', $allIds)->count();
                $approvedProjects = Project::whereIn('department_id', $allIds)->where('status', 'approved')->count();
                $totalEstimated = Project::whereIn('department_id', $allIds)->sum('estimated_budget');
                $totalSpent = Budget::whereHas('project', function ($q) use ($allIds) {
                    $q->whereIn('department_id', $allIds);
                })->sum('spent_amount');

                $childrenMetrics = [];
                foreach ($mainDept->children as $child) {
                    $cProjects = Project::where('department_id', $child->id)->count();
                    $cApproved = Project::where('department_id', $child->id)->where('status', 'approved')->count();
                    $cEstimated = Project::where('department_id', $child->id)->sum('estimated_budget');
                    $cSpent = Budget::whereHas('project', function ($q) use ($child) {
                        $q->where('department_id', $child->id);
                    })->sum('spent_amount');

                    $childrenMetrics[] = [
                        'id' => $child->id,
                        'name' => $child->name,
                        'total_projects' => $cProjects,
                        'approved_projects' => $cApproved,
                        'total_estimated_budget' => (float)$cEstimated,
                        'total_spent_budget' => (float)$cSpent,
                    ];
                }

                $divisionTreeMetrics[] = [
                    'id' => $mainDept->id,
                    'name' => $mainDept->name,
                    'code' => $mainDept->code ?? 'DIV',
                    'total_projects' => $totalProjects,
                    'approved_projects' => $approvedProjects,
                    'total_estimated_budget' => (float)$totalEstimated,
                    'total_spent_budget' => (float)$totalSpent,
                    'children' => $childrenMetrics,
                ];
            }

            $flatDepartmentMetrics = [];
            foreach (Department::all() as $dept) {
                $flatDepartmentMetrics[] = [
                    'id' => $dept->id,
                    'name' => $dept->name,
                    'parent_id' => $dept->parent_id,
                    'total_projects' => Project::where('department_id', $dept->id)->count(),
                    'approved_projects' => Project::where('department_id', $dept->id)->where('status', 'approved')->count(),
                    'total_estimated_budget' => (float)Project::where('department_id', $dept->id)->sum('estimated_budget'),
                    'total_spent_budget' => (float)Budget::whereHas('project', function ($q) use ($dept) { $q->where('department_id', $dept->id); })->sum('spent_amount'),
                ];
            }

            $completedProjects = Project::where('status', 'approved')
                ->whereHas('survey.responses')
                ->with(['user', 'department', 'survey'])
                ->get()
                ->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'title' => $p->title,
                        'department' => $p->department?->name ?? 'N/A',
                        'proposer' => $p->user?->name ?? 'N/A',
                        'spent_budget' => (float)($p->budget?->spent_amount ?? 0.00),
                        'survey_responses_count' => $p->survey?->responses()->count() ?? 0,
                    ];
                });

            $data['executiveData'] = [
                'divisionTreeMetrics' => $divisionTreeMetrics,
                'departmentMetrics' => $flatDepartmentMetrics,
                'budgetSummary' => [
                    'total_allocated' => Budget::sum('allocated_amount'),
                    'total_encumbered' => Budget::sum('encumbered_amount'),
                    'total_spent' => Budget::sum('spent_amount'),
                ],
                'completedProjects' => $completedProjects,
            ];
        }

        // Master Projects list for Admin, Plan Head, Procurement & Executives
        if ($user->isAdmin() || $user->isPlanHead() || $user->isProcurementHead() || $user->isExecutive()) {
            $data['allProjectsMaster'] = Project::with(['user', 'department', 'budget.fundingSource', 'approvals'])
                ->latest()
                ->get()
                ->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'title' => $p->title,
                        'academic_year' => $p->academic_year,
                        'estimated_budget' => (float)$p->estimated_budget,
                        'status' => $p->status,
                        'current_approval_step' => $p->current_approval_step,
                        'created_at' => $p->created_at ? $p->created_at->format('Y-m-d H:i') : '',
                        'proposer_name' => $p->user?->name ?? 'ไม่ระบุชื่อ',
                        'proposer_email' => $p->user?->email ?? '',
                        'department_name' => $p->department?->name ?? 'ฝ่ายงานทั่วไป',
                        'department_id' => $p->department_id,
                        'funding_source_name' => $p->budget?->fundingSource?->name ?? 'ยังไม่จัดสรร',
                        'spent_amount' => (float)($p->budget?->spent_amount ?? 0),
                    ];
                });
        }

        return Inertia::render('Dashboard', $data);
    }
}
