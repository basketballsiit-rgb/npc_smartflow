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
use App\Http\Controllers\TravelLoanWebController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Auth\KeycloakController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Keycloak SSO Routes
Route::get('/auth/keycloak', [KeycloakController::class, 'redirect'])->name('keycloak.redirect');
Route::get('/auth/keycloak/callback', [KeycloakController::class, 'callback'])->name('keycloak.callback');
Route::get('/auth/keycloak/debug', [KeycloakController::class, 'debug'])->name('keycloak.debug');


Route::get('/', function () {
    $approvedQuery = \App\Models\Project::where(function ($q) {
        $q->whereNotNull('approved_at')
          ->orWhereIn('status', ['approved', 'in_progress', 'evaluating', 'completed'])
          ->orWhere('current_approval_step', '>=', 6);
    });

    return Inertia::render('Welcome', [
        'publicStats' => [
            'totalProjects' => \App\Models\Project::count(),
            'approvedProjects' => (clone $approvedQuery)->count(),
            'totalBudget' => (float)\App\Models\Project::sum('estimated_budget'),
            'satisfactionRate' => (function() {
                $avgScore = \App\Models\SurveyResponse::selectRaw('AVG((rating_q1 + rating_q2 + rating_q3 + rating_q4 + rating_q5) / 5.0) as avg_score')->value('avg_score');
                return $avgScore ? round(($avgScore / 5.0) * 100, 1) : 0;
            })(),
        ],
        'recentProjects' => (clone $approvedQuery)
            ->with(['department', 'user'])
            ->latest()
            ->take(8)
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'title' => $p->title,
                    'department' => $p->department?->name ?? 'N/A',
                    'academic_year' => $p->academic_year,
                ];
            }),
        'publicCalendarEvents' => (clone $approvedQuery)
            ->with(['department.parent', 'user'])
            ->latest()
            ->get()
            ->map(function ($p) {
                $deptName = $p->department?->name ?? '';
                $parentName = $p->department?->parent?->name ?? '';
                $combined = mb_strtolower("{$deptName} {$parentName}");

                // Determine Division with High-Contrast Colors & Left Accent Borders
                $divKey = 'academic';
                $divName = 'ฝ่ายวิชาการ';
                $divBadge = 'bg-blue-50 text-blue-950 border-blue-200 border-l-4 border-l-blue-600 shadow-2xs';
                $divBorder = 'border-l-blue-600';
                $divBg = 'bg-blue-50/90 text-blue-950 hover:bg-blue-100/90 border border-blue-200';
                $divDot = 'bg-blue-600';
                $divGradient = 'from-blue-600 to-indigo-600';
                $divIcon = '📘';

                if (str_contains($combined, 'ทรัพยากร') || str_contains($combined, 'บริหาร') || str_contains($combined, 'การเงิน') || str_contains($combined, 'พัสดุ') || str_contains($combined, 'บุคลากร')) {
                    $divKey = 'resources';
                    $divName = 'ฝ่ายบริหารทรัพยากร';
                    $divBadge = 'bg-amber-50 text-amber-950 border-amber-200 border-l-4 border-l-amber-500 shadow-2xs';
                    $divBorder = 'border-l-amber-500';
                    $divBg = 'bg-amber-50/90 text-amber-950 hover:bg-amber-100/90 border border-amber-200';
                    $divDot = 'bg-amber-500';
                    $divGradient = 'from-amber-500 to-orange-500';
                    $divIcon = '🏢';
                } elseif (str_contains($combined, 'แผน') || str_contains($combined, 'ยุทธศาสตร์') || str_contains($combined, 'ความร่วมมือ') || str_contains($combined, 'วิจัย')) {
                    $divKey = 'strategy';
                    $divName = 'ฝ่ายยุทธศาสตร์และแผนงาน';
                    $divBadge = 'bg-purple-50 text-purple-950 border-purple-200 border-l-4 border-l-purple-600 shadow-2xs';
                    $divBorder = 'border-l-purple-600';
                    $divBg = 'bg-purple-50/90 text-purple-950 hover:bg-purple-100/90 border border-purple-200';
                    $divDot = 'bg-purple-600';
                    $divGradient = 'from-purple-600 to-indigo-600';
                    $divIcon = '📊';
                } elseif (str_contains($combined, 'กิจการ') || str_contains($combined, 'กิจกรรม') || str_contains($combined, 'แนะแนว') || str_contains($combined, 'ปกครอง')) {
                    $divKey = 'student';
                    $divName = 'ฝ่ายพัฒนากิจการนักเรียน นักศึกษา';
                    $divBadge = 'bg-emerald-50 text-emerald-950 border-emerald-200 border-l-4 border-l-emerald-600 shadow-2xs';
                    $divBorder = 'border-l-emerald-600';
                    $divBg = 'bg-emerald-50/90 text-emerald-950 hover:bg-emerald-100/90 border border-emerald-200';
                    $divDot = 'bg-emerald-600';
                    $divGradient = 'from-emerald-500 to-teal-600';
                    $divIcon = '🎓';
                }

                $subEvents = [];
                if (is_array($p->activities)) {
                    foreach ($p->activities as $actIdx => $act) {
                        if (!empty($act['activity_date'])) {
                            $subEvents[] = [
                                'name' => $act['name'] ?? ('กิจกรรมที่ ' . ($actIdx + 1)),
                                'date' => $act['activity_date'],
                                'location' => $act['location'] ?? $p->location,
                            ];
                        }
                    }
                }

                return [
                    'id' => $p->id,
                    'title' => $p->title,
                    'department' => $deptName ?: 'วิทยาลัยสารพัดช่างน่าน',
                    'proposer' => $p->user?->name ?? 'ไม่ระบุผู้เสนอ',
                    'location' => $p->location ?: 'วิทยาลัยสารพัดช่างน่าน',
                    'start_date' => $p->start_date ? (is_string($p->start_date) ? $p->start_date : $p->start_date->format('Y-m-d')) : null,
                    'end_date' => $p->end_date ? (is_string($p->end_date) ? $p->end_date : $p->end_date->format('Y-m-d')) : null,
                    'period_text' => $p->operation_period_text ?: '',
                    'division_key' => $divKey,
                    'division_name' => $divName,
                    'division_badge' => $divBadge,
                    'division_border' => $divBorder,
                    'division_bg' => $divBg,
                    'division_dot' => $divDot,
                    'division_gradient' => $divGradient,
                    'division_icon' => $divIcon,
                    'budget' => (float)($p->allocated_budget ?: $p->estimated_budget ?: 0),
                    'sub_activities' => $subEvents,
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

// Public Document Verification (Digital Seal & Signature Verification)
Route::get('/verify/{code}', [ProjectController::class, 'verifyPublicDocument'])->name('projects.verify');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/positions', [ProfileController::class, 'savePositions'])->name('profile.positions.save');
    Route::post('/profile/citizen-id', [ProfileController::class, 'updateCitizenId'])->name('profile.update_citizen_id');
    Route::post('/profile/signature', [ProfileController::class, 'updateSignature'])->name('profile.update_signature');
    Route::delete('/profile/signature', [ProfileController::class, 'destroySignature'])->name('profile.destroy_signature');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // In-App Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark_all_read');

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
    Route::post('/admin/users/sync-line-ids', [AdminController::class, 'syncAllLineUsersFromEleve'])->name('admin.users.sync_line_ids');
    Route::match(['get', 'post'], '/admin/cleanup-departments', [AdminController::class, 'runCleanupDuplicateDepartments'])->name('admin.cleanup_departments');
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
    Route::post('/admin/departments/{id}/restore', [AdminController::class, 'restoreDepartment'])->name('admin.departments.restore');
    Route::post('/admin/ai/workload-analysis', [AdminController::class, 'aiAnalyzeWorkload'])->name('admin.ai.workload_analysis');

    // Admin AI Agents Orchestration Hub Routes
    Route::get('/admin/ai-agents', [AdminController::class, 'getAiAgentsConfig'])->name('admin.ai_agents.index');
    Route::post('/admin/ai-agents/update', [AdminController::class, 'updateAiAgentsConfig'])->name('admin.ai_agents.update');
    Route::post('/admin/ai-agents/reset-defaults', [AdminController::class, 'resetAiAgentDefaults'])->name('admin.ai_agents.reset_defaults');
    Route::post('/admin/ai-agents/test-connection', [AdminController::class, 'testAiConnection'])->name('admin.ai_agents.test_connection');

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
    Route::put('/admin/strategy-groups/update', [AdminController::class, 'updateStrategyGroup'])->name('admin.groups.update');
    Route::delete('/admin/strategy-groups/delete', [AdminController::class, 'deleteStrategyGroup'])->name('admin.groups.delete');
    Route::post('/admin/strategies/convert-arabic', [AdminController::class, 'convertStrategyNumeralsToArabic'])->name('admin.strategies.convert_arabic');
    
    // Strategic Alignment Dashboard & Filtering
    Route::get('/strategies/dashboard', [\App\Http\Controllers\StrategyDashboardController::class, 'index'])->name('strategies.dashboard');

    // Projects CRUD & Approvals
    Route::get('projects/quick-create', [ProjectController::class, 'preliminaryCreate'])->name('projects.quick_create');
    Route::post('projects/preliminary', [ProjectController::class, 'preliminaryStore'])->name('projects.preliminary_store');
    Route::post('projects/direct-allocate', [ProjectController::class, 'directStoreAndAllocate'])->name('projects.direct_allocate_store');
    Route::post('projects/{project}/committee-allocate', [ProjectController::class, 'committeeAllocateBudget'])->name('projects.committee_allocate');
    Route::post('projects/batch-allocate', [ProjectController::class, 'batchAllocateBudgets'])->name('projects.batch_allocate');
    Route::post('projects/ai/map-strategies', [ProjectController::class, 'aiAutoMapStrategies'])->name('projects.ai.map_strategies');
    Route::post('projects/ai/detect-duplicates', [ProjectController::class, 'aiDetectDuplicates'])->name('projects.ai.detect_duplicates');
    Route::post('projects/ai/audit-consistency', [ProjectController::class, 'auditConsistency'])->name('projects.ai.audit_consistency');
    Route::resource('projects', ProjectController::class)->except(['index']);
    Route::get('projects/{project}/print', [ProjectController::class, 'print'])->name('projects.print');
    Route::post('projects/generate-ai-content', [ProjectController::class, 'generateAiContent'])->name('projects.generate_ai_content');
    Route::post('projects/ai/recommend-funding', [ProjectController::class, 'aiRecommendFunding'])->name('projects.ai.recommend_funding');
    Route::post('projects/{project}/submit', [ProjectController::class, 'submit'])->name('projects.submit');
    Route::post('projects/{project}/sign-step-one', [ProjectController::class, 'signStepOne'])->name('projects.sign_step_one');
    Route::post('projects/{project}/approve', [ProjectController::class, 'approve'])->name('projects.approve');
    Route::post('projects/{project}/admin-approve', [ProjectController::class, 'adminApprove'])->name('projects.admin_approve');
    Route::post('projects/{project}/update-status', [ProjectController::class, 'updateStatus'])->name('projects.update_status');
    Route::post('projects/{project}/reject', [ProjectController::class, 'reject'])->name('projects.reject');
    Route::post('projects/{project}/update-funding-source', [ProjectController::class, 'updateFundingSource'])->name('projects.update_funding_source');
    Route::post('projects/{project}/set-disbursement-type', [ProjectController::class, 'setDisbursementType'])->name('projects.set_disbursement_type');
    Route::post('projects/{project}/unlock-for-edit', [ProjectController::class, 'unlockForEdit'])->name('projects.unlock_for_edit');

    // Budget & Procurement DO phase routes
    Route::post('budgets/{budget}/clear', [BudgetController::class, 'clear'])->name('budgets.clear');
    Route::post('projects/{project}/procurement/committees', [ProcurementController::class, 'assignCommittees'])->name('procurements.assign_committees');
    Route::post('projects/{project}/procurement/save', [ProcurementController::class, 'saveProcurement'])->name('procurements.save');
    Route::post('projects/{project}/procurement/receive', [ProcurementController::class, 'receive'])->name('procurements.receive');
    Route::post('projects/{project}/procurement/plan-cut-budget', [ProcurementController::class, 'planCutBudget'])->name('procurements.plan_cut_budget');
    Route::post('procurements/document-numbering-settings', [ProcurementController::class, 'updateDocumentNumberingSettings'])->name('procurements.document_numbering_settings');
    Route::post('procurements/update-doc-numbering-settings', [ProcurementController::class, 'updateDocumentNumberingSettings'])->name('procurements.update_doc_numbering_settings');
    Route::post('projects/{project}/procurement/forward-to-finance', [ProcurementController::class, 'forwardToFinance'])->name('procurements.forward_to_finance');
    Route::post('projects/{project}/procurement/finance-receive', [ProcurementController::class, 'financeReceive'])->name('procurements.finance_receive');
    Route::post('projects/{project}/procurement/finance-disburse', [ProcurementController::class, 'financeDisburse'])->name('procurements.finance_disburse');
    Route::post('projects/{project}/procurement/finance-clear', [ProcurementController::class, 'financeClear'])->name('procurements.finance_clear');
    Route::post('projects/{project}/procurement/rollback', [ProcurementController::class, 'rollbackStatus'])->name('procurements.rollback');
    Route::get('projects/{project}/procurement/document/{type}', [ProcurementController::class, 'downloadDocument'])->name('procurements.download_document');
    Route::post('procurements/ai/draft-tor', [ProcurementController::class, 'aiDraftTor'])->name('procurements.ai.draft_tor');
    Route::post('procurements/ai/check-tor', [ProcurementController::class, 'aiCheckTorCompliance'])->name('procurements.ai.check_tor');

    // External Travel Loans (npc_eleve / npc_hr integration)
    Route::post('travel-loans/{travelLoan}/plan-cut', [TravelLoanWebController::class, 'planCut'])->name('travel_loans.plan_cut');
    Route::post('travel-loans/{travelLoan}/finance-receive', [TravelLoanWebController::class, 'financeReceive'])->name('travel_loans.finance_receive');
    Route::post('travel-loans/{travelLoan}/finance-disburse', [TravelLoanWebController::class, 'financeDisburse'])->name('travel_loans.finance_disburse');
    Route::post('travel-loans/{travelLoan}/rollback', [TravelLoanWebController::class, 'rollback'])->name('travel_loans.rollback');
    Route::post('travel-loans/generate-mock', [TravelLoanWebController::class, 'generateMockLoan'])->name('travel_loans.generate_mock');
    Route::put('travel-loans/{travelLoan}', [TravelLoanWebController::class, 'update'])->name('travel_loans.update');
    Route::delete('travel-loans/{travelLoan}', [TravelLoanWebController::class, 'destroy'])->name('travel_loans.destroy');

    // Survey stats & Questionnaire Builder
    Route::get('projects/{project}/survey/stats', [SurveyController::class, 'stats'])->name('surveys.stats');
    Route::get('projects/{project}/survey/builder', [SurveyController::class, 'getBuilderData'])->name('surveys.builder_data');
    Route::post('projects/{project}/survey/generate-questions', [SurveyController::class, 'generateAiQuestions'])->name('surveys.generate_questions');
    Route::post('projects/{project}/survey/load-standard', [SurveyController::class, 'loadStandardPattern'])->name('surveys.load_standard');
    Route::post('projects/{project}/survey/save-questions', [SurveyController::class, 'saveQuestions'])->name('surveys.save_questions');
    Route::post('projects/{project}/survey/generate-ai', [SurveyController::class, 'generateAiRecommendations'])->name('surveys.generate_ai');
    Route::post('projects/{project}/survey/ai-sentiment', [SurveyController::class, 'aiAnalyzeSentiment'])->name('surveys.ai_sentiment');

    // Appendices & Photo Uploads
    Route::post('projects/{project}/appendices', [AppendixController::class, 'store'])->name('appendices.store');
    Route::delete('appendices/{appendix}', [AppendixController::class, 'destroy'])->name('appendices.destroy');
    Route::post('projects/{project}/photos', [AppendixController::class, 'storePhoto'])->name('appendices.store_photo');
    Route::post('photos/{photo}/caption', [AppendixController::class, 'updatePhotoCaption'])->name('appendices.update_photo_caption');
    Route::delete('photos/{photo}', [AppendixController::class, 'destroyPhoto'])->name('appendices.destroy_photo');
    Route::get('projects/{project}/appendix/print', [AppendixController::class, 'printAppendix'])->name('projects.appendix.print');

    // Final stitched report download
    Route::get('projects/{project}/download-report', [ProjectController::class, 'downloadReport'])->name('projects.download_report');

    // Chapter 1 Content Save and Print
    Route::post('projects/{project}/chapter-1/save', [ProjectController::class, 'saveChapter1'])->name('projects.chapter1.save');
    Route::get('projects/{project}/chapter-1/print', [ProjectController::class, 'printChapter1'])->name('projects.chapter1.print');

    // Chapter 2 AI Generation, Save, and Print
    Route::post('projects/{project}/chapter-2/generate', [ProjectController::class, 'generateChapter2'])->name('projects.chapter2.generate');
    Route::post('projects/{project}/chapter-2/save', [ProjectController::class, 'saveChapter2'])->name('projects.chapter2.save');
    Route::get('projects/{project}/chapter-2/print', [ProjectController::class, 'printChapter2'])->name('projects.chapter2.print');

    // Chapter 3 AI Generation, Save, and Print
    Route::post('projects/{project}/chapter-3/generate', [ProjectController::class, 'generateChapter3'])->name('projects.chapter3.generate');
    Route::post('projects/{project}/chapter-3/save', [ProjectController::class, 'saveChapter3'])->name('projects.chapter3.save');
    Route::get('projects/{project}/chapter-3/print', [ProjectController::class, 'printChapter3'])->name('projects.chapter3.print');

    // Chapter 4 AI Generation, Save, and Print
    Route::post('projects/{project}/chapter-4/generate', [ProjectController::class, 'generateChapter4'])->name('projects.chapter4.generate');
    Route::post('projects/{project}/chapter-4/save', [ProjectController::class, 'saveChapter4'])->name('projects.chapter4.save');
    Route::get('projects/{project}/chapter-4/print', [ProjectController::class, 'printChapter4'])->name('projects.chapter4.print');

    // Preliminary (Front Matter - Preface, TOC, Executive Summary) AI Generation, Save, and Print
    Route::post('projects/{project}/preliminary/generate', [ProjectController::class, 'generatePreliminary'])->name('projects.preliminary.generate');
    Route::post('projects/{project}/preliminary/save', [ProjectController::class, 'savePreliminary'])->name('projects.preliminary.save');
    Route::post('projects/{project}/preliminary/calculate-pages', [ProjectController::class, 'calculatePreliminaryPages'])->name('projects.preliminary.calculate_pages');
    Route::get('projects/{project}/preliminary/print', [ProjectController::class, 'printPreliminary'])->name('projects.preliminary.print');

    // Chapter 5 AI Generation, Save, and Print
    Route::post('projects/{project}/chapter-5/generate', [ProjectController::class, 'generateChapter5'])->name('projects.chapter5.generate');
    Route::post('projects/{project}/chapter-5/save', [ProjectController::class, 'saveChapter5'])->name('projects.chapter5.save');
    Route::get('projects/{project}/chapter-5/print', [ProjectController::class, 'printChapter5'])->name('projects.chapter5.print');

    // Full Report (Complete Book - Covers, Prelim, Ch1-5, References, Appendix) Print & Status Save
    Route::get('projects/{project}/full-report/print', [ProjectController::class, 'printFullReport'])->name('projects.full_report.print');
    Route::post('projects/{project}/full-report/save-status', [ProjectController::class, 'saveFullReportStatus'])->name('projects.full_report.save_status');

    // Expense & Loan Clearing Routes (With Loan & Direct Reimbursement)
    Route::post('/clearings', [\App\Http\Controllers\ExpenseClearingController::class, 'store'])->name('clearings.store');
    Route::post('/clearings/{clearing}/plan-approve', [\App\Http\Controllers\ExpenseClearingController::class, 'planApprove'])->name('clearings.plan_approve');
    Route::post('/clearings/{clearing}/finance-complete', [\App\Http\Controllers\ExpenseClearingController::class, 'financeComplete'])->name('clearings.finance_complete');
    Route::delete('/clearings/{clearing}', [\App\Http\Controllers\ExpenseClearingController::class, 'destroy'])->name('clearings.destroy');
    Route::get('/clearings/{clearing}/print', [\App\Http\Controllers\ExpenseClearingController::class, 'print'])->name('clearings.print');
});

require __DIR__.'/auth.php';
