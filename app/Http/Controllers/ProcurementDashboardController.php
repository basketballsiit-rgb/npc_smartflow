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
        // 1. Procurement Queue (แสดงเฉพาะโครงการที่งานแผนได้ตัดยอดงบและส่งต่อให้งานพัสดุแล้ว)
        $procurementQueue = Project::whereHas('procurement', function($q) {
                $q->whereNotNull('plan_procurement_cut_at')
                  ->orWhereNotNull('plan_procurement_doc_number')
                  ->orWhereIn('status', ['plan_cut', 'received', 'processing', 'forwarded_to_finance', 'completed']);
            })
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
