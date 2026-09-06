<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Department;
use App\Models\Budget;
use App\Models\FundingSource;
use App\Models\User;
use App\Models\Role;
use App\Models\SystemSetting;
use App\Models\TravelLoan;
use App\Services\DocumentNumberService;
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
               ($user->isProcurementHead() ? 'procurement_head' :
               ($user->isFinanceStaff() ? 'finance_head' :
               ($user->isDepartmentHead() ? 'department_head' : 'teacher')))));

        $data = [
            'role' => $role,
            'currentTab' => $request->query('tab'),
        ];

        // Global data available for User/Admin Management
        $data['allRoles'] = Role::all();
        $data['allDepartments'] = Department::all();
        $data['systemSettings'] = SystemSetting::all();
        $data['docNumberSettings'] = DocumentNumberService::getSettings();
        $data['nextUnifiedDocNumber'] = DocumentNumberService::previewNext();
        $data['allUsers'] = User::where('is_active', true)->orderBy('name', 'asc')->get();
        $data['allVendors'] = \App\Models\Vendor::orderBy('name', 'asc')->get();
        $data['allFundingSources'] = FundingSource::orderBy('fiscal_year', 'desc')->orderBy('name', 'asc')->get();

        // Fetch routine budget plans based on permissions
        if ($user->isAdmin() || $user->isPlanHead()) {
            $data['routinePlans'] = \App\Models\RoutineBudgetPlan::with(['department', 'procurements.items', 'procurements.committees', 'fundingSource'])->latest()->get();
        } else {
            $deptIds = $user->getResponsibleDepartmentIds();
            $data['routinePlans'] = \App\Models\RoutineBudgetPlan::whereIn('department_id', $deptIds)
                ->with(['department', 'procurements.items', 'procurements.committees', 'fundingSource'])
                ->latest()
                ->get();
        }

        // Fetch central allocations based on permissions (Admin, Plan Head, Finance Staff)
        if ($user->isAdmin() || $user->isPlanHead() || $user->isFinanceStaff()) {
            $data['centralAllocations'] = \App\Models\CentralAllocation::with(['fundingSource'])->latest()->get();
        } else {
            $data['centralAllocations'] = [];
        }

        // Global Funding Sources & Channel Progress for Plan Head & Finance
        $fundingSources = FundingSource::orderBy('fiscal_year', 'desc')->orderBy('name', 'asc')->get();
        $fundingChannelProgress = [];
        foreach ($fundingSources as $source) {
            $centralSum = (float)\App\Models\CentralAllocation::where('funding_source_id', $source->id)->sum('amount');
            $allocated = (float)Budget::where('funding_source_id', $source->id)->sum('allocated_amount');
            $encumbered = (float)Budget::where('funding_source_id', $source->id)->sum('encumbered_amount');
            $spent = (float)Budget::where('funding_source_id', $source->id)->sum('spent_amount');

            // Also account for travel loan amounts cut or spent from this funding source
            $tlEncumbered = (float)TravelLoan::where('funding_source_id', $source->id)
                ->whereIn('loan_status', ['plan_cut', 'finance_received'])
                ->sum('total_loan_amount');
            $tlSpent = (float)TravelLoan::where('funding_source_id', $source->id)
                ->whereIn('loan_status', ['disbursed', 'cleared'])
                ->sum('finance_disbursed_amount');

            $encumbered += $tlEncumbered;
            $spent += $tlSpent;

            $projectsCount = Project::where('funding_source_id', $source->id)
                ->orWhereHas('budget', function($q) use ($source) { $q->where('funding_source_id', $source->id); })
                ->count();

            $fundingChannelProgress[] = [
                'id' => $source->id,
                'name' => $source->name,
                'code' => $source->code,
                'fiscal_year' => $source->fiscal_year,
                'description' => $source->description,
                'central_allocated' => $centralSum,
                'allocated' => $allocated,
                'encumbered' => $encumbered,
                'spent' => $spent,
                'remaining' => $allocated - $spent,
                'central_remaining' => $centralSum - $spent,
                'projects_count' => $projectsCount,
            ];
        }
        $data['fundingChannelProgress'] = $fundingChannelProgress;
        $data['fundingSources'] = $fundingSources;

        $advancePayments = Budget::where('is_advance_payment', true)
            ->whereNull('advance_cleared_at')
            ->with(['project.user', 'project.department'])
            ->latest()
            ->get();
        $data['advancePayments'] = $advancePayments;

        // Load External Travel Loans (from npc_eleve / npc_hr)
        $allTravelLoans = TravelLoan::with(['fundingSource', 'planCutByUser', 'project'])
            ->latest()
            ->get()
            ->map(function ($tl) {
                return [
                    'id' => $tl->id,
                    'travel_id' => $tl->travel_id,
                    'contract_no' => $tl->contract_no,
                    'system_source' => $tl->system_source,
                    'borrower_user_id' => $tl->borrower_user_id,
                    'borrower_name' => $tl->borrower_name,
                    'borrower_position' => $tl->borrower_position,
                    'borrower_department' => $tl->borrower_department,
                    'borrower_staff_type' => $tl->borrower_staff_type,
                    'subject' => $tl->subject,
                    'destination' => $tl->destination,
                    'start_date' => $tl->start_date ? $tl->start_date->format('Y-m-d') : null,
                    'end_date' => $tl->end_date ? $tl->end_date->format('Y-m-d') : null,
                    'start_date_formatted' => $tl->start_date ? $tl->start_date->format('d/m/Y') : null,
                    'end_date_formatted' => $tl->end_date ? $tl->end_date->format('d/m/Y') : null,
                    'total_days' => (float)$tl->total_days,
                    'doc_date' => $tl->doc_date ? $tl->doc_date->format('d/m/Y') : null,
                    'due_date' => $tl->due_date ? $tl->due_date->format('d/m/Y') : null,
                    'return_days' => (int)$tl->return_days,
                    'project_id' => $tl->project_id,
                    'funding_source_id' => $tl->funding_source_id,
                    'funding_source_name' => $tl->fundingSource?->name,
                    'funding_source_code' => $tl->fundingSource?->code,
                    'expense_type' => $tl->expense_type,
                    'allowance_amount' => (float)$tl->allowance_amount,
                    'allowance_detail' => $tl->allowance_detail,
                    'rent_amount' => (float)$tl->rent_amount,
                    'rent_detail' => $tl->rent_detail,
                    'vehicle_amount' => (float)$tl->vehicle_amount,
                    'vehicle_detail' => $tl->vehicle_detail,
                    'other_amount' => (float)$tl->other_amount,
                    'other_detail' => $tl->other_detail,
                    'total_loan_amount' => (float)$tl->total_loan_amount,
                    'thai_baht_text' => $tl->thai_baht_text,
                    'loan_status' => $tl->loan_status,
                    'plan_doc_number' => $tl->plan_doc_number,
                    'plan_cut_at' => $tl->plan_cut_at ? $tl->plan_cut_at->format('d/m/Y H:i') : null,
                    'plan_cut_by' => $tl->plan_cut_by,
                    'plan_cut_by_name' => $tl->planCutByUser?->name,
                    'finance_doc_number' => $tl->finance_doc_number,
                    'finance_received_at' => $tl->finance_received_at ? $tl->finance_received_at->format('d/m/Y H:i') : null,
                    'finance_disbursed_at' => $tl->finance_disbursed_at ? $tl->finance_disbursed_at->format('d/m/Y H:i') : null,
                    'finance_disbursed_amount' => (float)($tl->finance_disbursed_amount ?? 0),
                    'finance_payment_ref' => $tl->finance_payment_ref,
                    'plan_notes' => $tl->plan_notes,
                    'cleared_amount' => (float)($tl->cleared_amount ?? 0),
                    'refund_amount' => (float)($tl->refund_amount ?? 0),
                    'cleared_at' => $tl->cleared_at ? $tl->cleared_at->format('d/m/Y H:i') : null,
                    'approved_by_director' => $tl->approved_by_director,
                    'approved_by_deputy' => $tl->approved_by_deputy,
                    'finance_checked_by' => $tl->finance_checked_by,
                    'created_at' => $tl->created_at ? $tl->created_at->format('d/m/Y H:i') : '',
                ];
            });
        $data['allTravelLoans'] = $allTravelLoans;

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
                ->with(['department', 'iqaStrategy', 'ovecStrategy', 'approvals.user', 'fundingSource', 'budget.fundingSource', 'procurement'])
                ->latest()
                ->get(),
            'proposalsCount' => Project::where('user_id', $user->id)->count(),
            'approvedCount' => Project::where('user_id', $user->id)->whereIn('status', ['approved', 'budget_approved'])->count(),
            'totalBudget' => Project::where('user_id', $user->id)->sum('estimated_budget'),
        ];

        // 2. Plan Head Dashboard Data
        if ($user->isPlanHead() || $user->isAdmin()) {
            $data['planHeadData'] = [
                'fundingSources' => $fundingSources,
                'globalAllocated' => Budget::sum('allocated_amount'),
                'globalEncumbered' => Budget::sum('encumbered_amount'),
                'globalSpent' => Budget::sum('spent_amount'),
                'fundingChannelProgress' => $fundingChannelProgress,
                'preliminaryQueue' => Project::whereIn('status', ['preliminary', 'budget_approved', 'budget_rejected'])
                    ->with(['user', 'department', 'fundingSource', 'budget.fundingSource', 'approvals'])
                    ->latest()
                    ->get(),
                'planHeadQueue' => Project::whereIn('status', ['pending_approval', 'submitted', 'draft', 'rejected'])
                    ->with(['user', 'department', 'fundingSource', 'budget.fundingSource', 'approvals'])
                    ->orderByRaw("CASE WHEN status = 'pending_approval' AND current_approval_step = 3 THEN 0 WHEN status = 'pending_approval' THEN 1 ELSE 2 END")
                    ->latest()
                    ->get(),
                'advancePayments' => $advancePayments,
                'externalTravelLoans' => $allTravelLoans,
                'nextDocNumberPreview' => DocumentNumberService::previewNext(),
            ];
        }

        // 2.1 Finance Staff Dashboard Data
        if ($user->isFinanceStaff() || $user->isAdmin()) {
            $data['financeData'] = [
                'fundingChannelProgress' => $fundingChannelProgress,
                'centralAllocations' => $data['centralAllocations'],
                'advancePayments' => $advancePayments,
                'externalTravelLoans' => $allTravelLoans,
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
                'vendors' => \App\Models\Vendor::orderBy('name', 'asc')->get(),
                'users' => User::with('department')->get()->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'citizen_id' => $u->citizen_id,
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

        // Master Projects list for Admin, Plan Head, Procurement, Finance & Executives
        if ($user->isAdmin() || $user->isPlanHead() || $user->isProcurementHead() || $user->isFinanceStaff() || $user->isExecutive() || $request->query('tab') === 'document_tracking' || $request->query('tab') === 'central_budgets') {
            $data['allProjectsMaster'] = Project::with(['user', 'department', 'fundingSource', 'budget.fundingSource', 'approvals.user', 'procurement.items', 'appendices'])
                ->latest()
                ->get()
                ->map(function ($p) {
                    $fundingName = $p->fundingSource?->name ?: ($p->budget?->fundingSource?->name ?? 'ยังไม่จัดสรร');
                    $fundingId = $p->funding_source_id ?: ($p->budget?->funding_source_id ?? null);
                    $allocAmt = (float)($p->allocated_budget ?: ($p->budget?->allocated_amount ?? 0));
                    return [
                        'id' => $p->id,
                        'title' => $p->title,
                        'academic_year' => $p->academic_year,
                        'estimated_budget' => (float)$p->estimated_budget,
                        'proposed_budget' => (float)($p->proposed_budget ?: $p->estimated_budget),
                        'allocated_budget' => $allocAmt,
                        'allocated_amount' => $allocAmt,
                        'report_category' => $p->report_category,
                        'status' => $p->status,
                        'current_approval_step' => $p->current_approval_step,
                        'procurement_status' => $p->procurement?->status,
                        'loan_status' => $p->procurement?->loan_status ?? 'pending',
                        'plan_procurement_cut_at' => $p->procurement?->plan_procurement_cut_at ? $p->procurement->plan_procurement_cut_at->format('d/m/Y H:i') : null,
                        'plan_procurement_doc_number' => $p->procurement?->plan_procurement_doc_number,
                        'plan_loan_cut_at' => $p->procurement?->plan_loan_cut_at ? $p->procurement->plan_loan_cut_at->format('d/m/Y H:i') : null,
                        'plan_loan_doc_number' => $p->procurement?->plan_loan_doc_number,
                        'finance_received_at' => $p->procurement?->finance_received_at ? $p->procurement->finance_received_at->format('d/m/Y H:i') : null,
                        'finance_doc_number' => $p->procurement?->finance_doc_number,
                        'finance_disbursed_at' => $p->procurement?->finance_disbursed_at ? $p->procurement->finance_disbursed_at->format('d/m/Y H:i') : null,
                        'finance_disbursed_amount' => (float)($p->procurement?->finance_disbursed_amount ?? 0),
                        'finance_payment_ref' => $p->procurement?->finance_payment_ref,
                        'encumbered_amount' => (float)($p->budget?->encumbered_amount ?? 0),
                        'procurement_number' => $p->procurement?->procurement_number,
                        'created_at' => $p->created_at ? $p->created_at->format('Y-m-d H:i') : '',
                        'proposer_name' => $p->user?->name ?? 'ไม่ระบุชื่อ',
                        'proposer_email' => $p->user?->email ?? '',
                        'department_name' => $p->department?->name ?? 'ฝ่ายงานทั่วไป',
                        'department_id' => $p->department_id,
                        'funding_source_name' => $fundingName,
                        'funding_source_id' => $fundingId,
                        'spent_amount' => (float)($p->budget?->spent_amount ?? 0),
                        'activities' => $p->activities ?? [],
                        'appendices' => $p->appendices ? $p->appendices->map(function ($app) {
                            return [
                                'id' => $app->id,
                                'title' => $app->title,
                                'file_url' => asset('storage/' . $app->file_path),
                                'file_type' => $app->file_type,
                                'file_size' => (int)$app->file_size,
                            ];
                        }) : [],
                        'print_url' => route('projects.print', $p->id),
                        'procurement_items' => $p->procurement?->items ? $p->procurement->items->map(function ($it) {
                            return [
                                'id' => $it->id,
                                'description' => $it->description,
                                'quantity' => (float)$it->quantity,
                                'unit' => $it->unit,
                                'unit_price' => (float)$it->unit_price,
                                'total_price' => (float)$it->total_price,
                            ];
                        }) : [],
                        'approvals' => $p->approvals->map(function ($a) {
                            return [
                                'id' => $a->id,
                                'step_number' => (int)$a->step_number,
                                'status' => $a->status,
                                'comments' => $a->comments,
                                'user_name' => $a->user?->name ?? ($a->approver_name ?: '-'),
                                'user_position' => $a->user?->position ?? '',
                                'date' => $a->created_at ? $a->created_at->format('d/m/Y H:i') : '',
                            ];
                        }),
                    ];
                });
        }

        return Inertia::render('Dashboard', $data);
    }
}
