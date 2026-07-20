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

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id'              => $user->id,
                    'name'            => $user->name,
                    'email'           => $user->email,
                    'position'        => $user->position,
                    'department_name' => $user->department?->name,
                    'department_id'   => $user->department_id,
                    'role'            => $user->role?->name,
                    'role_display'    => $user->role?->display_name,
                    'is_active'       => $user->is_active,
                    // ทุกตำแหน่งจาก user_positions table
                    'all_positions'   => $user->userPositions->map(fn($p) => [
                        'position'        => $p->position,
                        'department_name' => $p->department?->name,
                        'job_level'       => $p->job_level,
                        'is_primary'      => $p->is_primary,
                    ]),
                ] : null,
            ],
        ];
    }
}
