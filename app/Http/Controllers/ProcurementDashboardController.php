<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProcurementDashboardController extends Controller
{
    /**
     * Display the procurement head dashboard.
     */
    public function index(Request $request)
    {
        // 1. Procurement Queue (Approved projects ready for purchasing)
        $procurementQueue = Project::where('status', 'approved')
            ->with(['user', 'department', 'procurement.items', 'procurement.committees'])
            ->latest()
            ->get();

        // 2. Master users list for committee assignment (exclude other roles if needed, but usually any staff user is eligible)
        $users = User::with(['role', 'department'])->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role_display' => $u->role?->display_name ?? 'N/A',
                'department_name' => $u->department?->name ?? 'N/A',
            ];
        });

        return Inertia::render('ProcurementHead/Dashboard', [
            'procurementQueue' => $procurementQueue,
            'users' => $users,
        ]);
    }
}
