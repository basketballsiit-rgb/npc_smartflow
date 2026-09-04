<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TeacherDashboardController;
use App\Http\Controllers\PlanHeadDashboardController;
use App\Http\Controllers\ProcurementDashboardController;
use App\Http\Controllers\ExecutiveDashboardController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\ProcurementController;
use App\Http\Controllers\SurveyController;
use App\Http\Controllers\AppendixController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\RoutineBudgetController;
use App\Http\Controllers\CentralAllocationController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\Auth\KeycloakController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Keycloak SSO Routes
Route::get('/auth/keycloak', [KeycloakController::class, 'redirect'])->name('keycloak.redirect');
Route::get('/auth/keycloak/callback', [KeycloakController::class, 'callback'])->name('keycloak.callback');


Route::get('/', function () {
    return Inertia::render('Welcome', [
        'publicStats' => [
            'totalProjects' => \App\Models\Project::count(),
            'approvedProjects' => \App\Models\Project::where('status', 'approved')->count(),
            'totalBudget' => (float)\App\Models\Project::sum('estimated_budget'),
            'satisfactionRate' => (function() {
                $avgScore = \App\Models\SurveyResponse::selectRaw('AVG((rating_q1 + rating_q2 + rating_q3 + rating_q4 + rating_q5) / 5.0) as avg_score')->value('avg_score');
                return $avgScore ? round(($avgScore / 5.0) * 100, 1) : 0;
            })(),
        ],
        'recentProjects' => \App\Models\Project::where('status', 'approved')
            ->with(['department', 'user'])
            ->latest()
            ->take(4)
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'title' => $p->title,
                    'department' => $p->department?->name ?? 'N/A',
                    'budget' => (float)$p->estimated_budget,
                    'academic_year' => $p->academic_year,
                ];
            }),
    ]);
});

// Unified role-based dashboard
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

// Public Project Survey Evaluation
Route::get('projects/{project}/survey/evaluate', [SurveyController::class, 'evaluate'])->name('surveys.evaluate');
Route::post('projects/{project}/survey/submit', [SurveyController::class, 'submitResponse'])->name('surveys.submit_response');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/citizen-id', [ProfileController::class, 'updateCitizenId'])->name('profile.update_citizen_id');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Vendor Directory Routes
    Route::get('/vendors', [VendorController::class, 'index'])->name('vendors.index');
    Route::post('/vendors', [VendorController::class, 'store'])->name('vendors.store');
    Route::put('/vendors/{vendor}', [VendorController::class, 'update'])->name('vendors.update');
    Route::delete('/vendors/{vendor}', [VendorController::class, 'destroy'])->name('vendors.destroy');

    // Admin User & Department Routes
    Route::post('/admin/users', [AdminController::class, 'storeUser'])->name('admin.users.store');
    Route::put('/admin/users/{user}', [AdminController::class, 'updateUser'])->name('admin.users.update');
    Route::patch('/admin/users/{user}/toggle', [AdminController::class, 'toggleUserStatus'])->name('admin.users.toggle');
    Route::delete('/admin/users/{user}', [AdminController::class, 'deleteUser'])->name('admin.users.delete');
    Route::post('/admin/settings', [AdminController::class, 'updateSettings'])->name('admin.settings.update');

    // Funding Sources Management (Plan Staff & Admin)
    Route::post('/admin/funding-sources', [AdminController::class, 'storeFundingSource'])->name('admin.funding_sources.store');
    Route::put('/admin/funding-sources/{fundingSource}', [AdminController::class, 'updateFundingSource'])->name('admin.funding_sources.update');
    Route::delete('/admin/funding-sources/{fundingSource}', [AdminController::class, 'deleteFundingSource'])->name('admin.funding_sources.delete');

    // Admin & Plan Head Routine Budget Routes
    Route::get('/admin/routine-budgets', [RoutineBudgetController::class, 'index'])->name('admin.routine_budgets.index');
    Route::post('/admin/routine-budgets', [RoutineBudgetController::class, 'store'])->name('admin.routine_budgets.store');
    Route::put('/admin/routine-budgets/{routineBudget}', [RoutineBudgetController::class, 'update'])->name('admin.routine_budgets.update');
    Route::delete('/admin/routine-budgets/{routineBudget}', [RoutineBudgetController::class, 'destroy'])->name('admin.routine_budgets.destroy');
    Route::post('/routine-budgets/{routineBudget}/procurement/save', [ProcurementController::class, 'saveRoutineProcurement'])->name('routine_procurements.save');
    Route::get('/routine-budgets/procurement/{procurement}/document/{type}', [ProcurementController::class, 'downloadRoutineDocument'])->name('routine_procurements.download_document');

    // Central Budget Allocation Routes
    Route::post('/admin/central-allocations', [CentralAllocationController::class, 'store'])->name('admin.central_allocations.store');
    Route::put('/admin/central-allocations/{centralAllocation}', [CentralAllocationController::class, 'update'])->name('admin.central_allocations.update');
    // Standard Material Item Catalog Routes
    Route::get('/api/standard-items/search', [\App\Http\Controllers\StandardItemController::class, 'search'])->name('standard_items.search');
    Route::get('/api/standard-items', [\App\Http\Controllers\StandardItemController::class, 'index'])->name('standard_items.index');
    Route::post('/api/standard-items', [\App\Http\Controllers\StandardItemController::class, 'store'])->name('standard_items.store');
    Route::put('/api/standard-items/{standardItem}', [\App\Http\Controllers\StandardItemController::class, 'update'])->name('standard_items.update');
    Route::delete('/api/standard-items/{standardItem}', [\App\Http\Controllers\StandardItemController::class, 'destroy'])->name('standard_items.destroy');

    Route::post('/admin/departments', [AdminController::class, 'storeDepartment'])->name('admin.departments.store');
    Route::put('/admin/departments/{department}', [AdminController::class, 'updateDepartment'])->name('admin.departments.update');
    Route::delete('/admin/departments/{department}', [AdminController::class, 'deleteDepartment'])->name('admin.departments.delete');

    // Admin Strategy Routes
    Route::post('/admin/iqa-strategies', [AdminController::class, 'storeIqaStrategy'])->name('admin.iqa.store');
    Route::put('/admin/iqa-strategies/{strategy}', [AdminController::class, 'updateIqaStrategy'])->name('admin.iqa.update');
    Route::delete('/admin/iqa-strategies/{strategy}', [AdminController::class, 'deleteIqaStrategy'])->name('admin.iqa.delete');
    Route::post('/admin/ovec-strategies', [AdminController::class, 'storeOvecStrategy'])->name('admin.ovec.store');
    Route::put('/admin/ovec-strategies/{strategy}', [AdminController::class, 'updateOvecStrategy'])->name('admin.ovec.update');
    Route::delete('/admin/ovec-strategies/{strategy}', [AdminController::class, 'deleteOvecStrategy'])->name('admin.ovec.delete');
    // Admin Dynamic Strategy Category & Item Routes
    Route::post('/admin/strategy-categories', [AdminController::class, 'storeStrategyCategory'])->name('admin.categories.store');
    Route::put('/admin/strategy-categories/{category}', [AdminController::class, 'updateStrategyCategory'])->name('admin.categories.update');
    Route::patch('/admin/strategy-categories/{category}/toggle', [AdminController::class, 'toggleStrategyCategoryActive'])->name('admin.categories.toggle');
    Route::delete('/admin/strategy-categories/{category}', [AdminController::class, 'deleteStrategyCategory'])->name('admin.categories.delete');
    
    Route::post('/admin/strategy-items', [AdminController::class, 'storeStrategyItem'])->name('admin.items.store');
    Route::put('/admin/strategy-items/{item}', [AdminController::class, 'updateStrategyItem'])->name('admin.items.update');
    Route::patch('/admin/strategy-items/{item}/toggle', [AdminController::class, 'toggleStrategyItemActive'])->name('admin.items.toggle');
    Route::delete('/admin/strategy-items/{item}', [AdminController::class, 'deleteStrategyItem'])->name('admin.items.delete');

    // Projects CRUD & Approvals
    Route::get('projects/quick-create', [ProjectController::class, 'preliminaryCreate'])->name('projects.quick_create');
    Route::post('projects/preliminary', [ProjectController::class, 'preliminaryStore'])->name('projects.preliminary_store');
    Route::post('projects/direct-allocate', [ProjectController::class, 'directStoreAndAllocate'])->name('projects.direct_allocate_store');
    Route::post('projects/{project}/committee-allocate', [ProjectController::class, 'committeeAllocateBudget'])->name('projects.committee_allocate');
    Route::resource('projects', ProjectController::class)->except(['index']);
    Route::get('projects/{project}/print', [ProjectController::class, 'print'])->name('projects.print');
    Route::post('projects/generate-ai-content', [ProjectController::class, 'generateAiContent'])->name('projects.generate_ai_content');
    Route::post('projects/{project}/submit', [ProjectController::class, 'submit'])->name('projects.submit');
    Route::post('projects/{project}/approve', [ProjectController::class, 'approve'])->name('projects.approve');
    Route::post('projects/{project}/admin-approve', [ProjectController::class, 'adminApprove'])->name('projects.admin_approve');
    Route::post('projects/{project}/update-status', [ProjectController::class, 'updateStatus'])->name('projects.update_status');
    Route::post('projects/{project}/reject', [ProjectController::class, 'reject'])->name('projects.reject');

    // Budget & Procurement DO phase routes
    Route::post('budgets/{budget}/clear', [BudgetController::class, 'clear'])->name('budgets.clear');
    Route::post('projects/{project}/procurement/committees', [ProcurementController::class, 'assignCommittees'])->name('procurements.assign_committees');
    Route::post('projects/{project}/procurement/save', [ProcurementController::class, 'saveProcurement'])->name('procurements.save');
    Route::post('projects/{project}/procurement/receive', [ProcurementController::class, 'receive'])->name('procurements.receive');
    Route::post('projects/{project}/procurement/plan-cut-budget', [ProcurementController::class, 'planCutBudget'])->name('procurements.plan_cut_budget');
    Route::post('procurements/document-numbering-settings', [ProcurementController::class, 'updateDocumentNumberingSettings'])->name('procurements.document_numbering_settings');
    Route::post('projects/{project}/procurement/forward-to-finance', [ProcurementController::class, 'forwardToFinance'])->name('procurements.forward_to_finance');
    Route::post('projects/{project}/procurement/finance-receive', [ProcurementController::class, 'financeReceive'])->name('procurements.finance_receive');
    Route::post('projects/{project}/procurement/finance-disburse', [ProcurementController::class, 'financeDisburse'])->name('procurements.finance_disburse');
    Route::post('projects/{project}/procurement/finance-clear', [ProcurementController::class, 'financeClear'])->name('procurements.finance_clear');
    Route::post('projects/{project}/procurement/rollback', [ProcurementController::class, 'rollbackStatus'])->name('procurements.rollback');
    Route::get('projects/{project}/procurement/document/{type}', [ProcurementController::class, 'downloadDocument'])->name('procurements.download_document');

    // Survey stats
    Route::get('projects/{project}/survey/stats', [SurveyController::class, 'stats'])->name('surveys.stats');
    Route::post('projects/{project}/survey/generate-ai', [SurveyController::class, 'generateAiRecommendations'])->name('surveys.generate_ai');

    // Appendices & Photo Uploads
    Route::post('projects/{project}/appendices', [AppendixController::class, 'store'])->name('appendices.store');
    Route::delete('appendices/{appendix}', [AppendixController::class, 'destroy'])->name('appendices.destroy');
    Route::post('projects/{project}/photos', [AppendixController::class, 'storePhoto'])->name('appendices.store_photo');
    Route::delete('photos/{photo}', [AppendixController::class, 'destroyPhoto'])->name('appendices.destroy_photo');

    // Final stitched report download
    Route::get('projects/{project}/download-report', [ProjectController::class, 'downloadReport'])->name('projects.download_report');
});

require __DIR__.'/auth.php';
