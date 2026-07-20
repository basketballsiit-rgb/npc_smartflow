<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeacherDashboardController extends Controller
{
    /**
     * Display the teacher dashboard.
     */
    public function index(Request $request)
    {
        $userId = auth()->id();

        $projects = Project::where('user_id', $userId)
            ->with(['department', 'iqaStrategy', 'ovecStrategy', 'budget.fundingSource'])
            ->latest()
            ->get();

        $stats = [
            'total' => $projects->count(),
            'draft' => $projects->where('status', 'draft')->count(),
            'pending' => $projects->whereIn('status', ['submitted', 'pending_approval'])->count(),
            'approved' => $projects->where('status', 'approved')->count(),
            'rejected' => $projects->where('status', 'rejected')->count(),
            'total_budget' => $projects->sum('estimated_budget'),
        ];

        return Inertia::render('Teacher/Dashboard', [
            'projects' => $projects,
            'stats' => $stats,
        ]);
    }
}
