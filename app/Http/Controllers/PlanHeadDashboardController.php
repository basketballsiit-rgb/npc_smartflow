<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Budget;
use App\Models\FundingSource;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanHeadDashboardController extends Controller
{
    /**
     * Display the planning head dashboard.
     */
    public function index(Request $request)
    {
        // 1. Global Budget Statistics
        $stats = [
            'total_allocated' => Budget::sum('allocated_amount'),
            'total_encumbered' => Budget::sum('encumbered_amount'),
            'total_spent' => Budget::sum('spent_amount'),
        ];

        // 2. Budget breakdown by Funding Source
        $fundingSources = FundingSource::all()->map(function ($source) {
            return [
                'id' => $source->id,
                'name' => $source->name,
                'code' => $source->code,
                'total_allocated' => (float) $source->budgets()->sum('allocated_amount'),
                'total_encumbered' => (float) $source->budgets()->sum('encumbered_amount'),
                'total_spent' => (float) $source->budgets()->sum('spent_amount'),
            ];
        });

        // 3. Approval Queue (Projects currently at Step 3: Plan Head review)
        $approvalQueue = Project::whereIn('status', ['submitted', 'pending_approval'])
            ->where('current_approval_step', 3)
            ->with(['user', 'department', 'iqaStrategy', 'ovecStrategy'])
            ->latest()
            ->get();

        // 4. Advance Payments Queue
        $advancePayments = Budget::where('is_advance_payment', true)
            ->with(['project.user', 'project.department'])
            ->latest()
            ->get();

        return Inertia::render('PlanHead/Dashboard', [
            'stats' => $stats,
            'fundingSources' => $fundingSources,
            'approvalQueue' => $approvalQueue,
            'advancePayments' => $advancePayments,
        ]);
    }
}
