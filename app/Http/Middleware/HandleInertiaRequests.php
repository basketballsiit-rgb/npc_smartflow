<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $citizenId = null;
        $hasCitizenId = false;

        if ($user) {
            try {
                $citizenId = $user->citizen_id;
                $hasCitizenId = !empty($citizenId);
            } catch (\Throwable $e) {
                $citizenId = null;
                $hasCitizenId = false;
            }
        }

        return [
            ...parent::share($request),
            'asset_url' => $request->getBaseUrl() . '/',
            'auth' => [
                'user' => $user ? [
                    'id'              => $user->id,
                    'name'            => $user->name ?? '',
                    'email'           => $user->email ?? '',
                    'position'        => $user->position,
                    'citizen_id'      => $citizenId,
                    'has_citizen_id'  => $hasCitizenId,
                    'department_name' => $user->department?->name,
                    'department_id'   => $user->department_id,
                    'role'            => $user->role?->name,
                    'role_display'    => $user->role?->display_name,
                    'is_active'       => (bool)$user->is_active,
                    'is_admin'           => $user->isAdmin(),
                    'is_teacher'         => $user->isTeacher(),
                    'is_department_head' => $user->isDepartmentHead(),
                    'is_plan_head'       => $user->isPlanHead(),
                    'is_plan_staff'      => $user->isPlanStaff(),
                    'is_procurement_head'=> $user->isProcurementHead(),
                    'is_procurement_staff'=> $user->isProcurementStaff(),
                    'is_finance_staff'   => $user->isFinanceStaff(),
                    'is_executive'       => $user->isExecutive(),
                    // ทุกตำแหน่งจาก user_positions table
                    'all_positions'   => $user->userPositions()->with(['department', 'subDepartment'])->get()->map(function($p) {
                        try {
                            $formattedTitle = $p->formatPositionTitle();
                        } catch (\Throwable $e) {
                            $formattedTitle = $p->position ?: 'บุคลากร';
                        }
                        return [
                            'id'                  => $p->id,
                            'position'            => $p->position,
                            'duty'                => $p->duty,
                            'department_id'       => $p->department_id,
                            'department_name'     => $p->department?->name,
                            'sub_department_id'   => $p->sub_department_id,
                            'sub_department_name' => $p->subDepartment?->name,
                            'major'               => $p->major,
                            'job_level'           => $p->job_level,
                            'is_primary'          => $p->is_primary,
                            'formatted_title'     => $formattedTitle,
                        ];
                    }),
                ] : null,
            ],
        ];
    }
}
