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
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'publicStats' => [
            'totalProjects' => \App\Models\Project::count(),
            'approvedProjects' => \App\Models\Project::where('status', 'approved')->count(),
            'totalBudget' => (float)\App\Models\Project::sum('estimated_budget'),
            'satisfactionRate' => 96.5,
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
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Admin User & Department Routes
    Route::post('/admin/users', [AdminController::class, 'storeUser'])->name('admin.users.store');
    Route::put('/admin/users/{user}', [AdminController::class, 'updateUser'])->name('admin.users.update');
    Route::patch('/admin/users/{user}/toggle', [AdminController::class, 'toggleUserStatus'])->name('admin.users.toggle');
    Route::delete('/admin/users/{user}', [AdminController::class, 'deleteUser'])->name('admin.users.delete');
    Route::post('/admin/settings', [AdminController::class, 'updateSettings'])->name('admin.settings.update');

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
