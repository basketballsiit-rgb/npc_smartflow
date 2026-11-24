<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get user's notifications and unread count.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['notifications' => [], 'unread_count' => 0]);
        }

        // Sync pending actionable items to notifications table
        try {
            NotificationService::syncPendingActionsForUser($user);
        } catch (\Throwable $e) {
            // Gracefully handle any edge cases in sync
        }

        $notifications = AppNotification::where('user_id', $user->id)
            ->latest()
            ->take(20)
            ->get()
            ->map(function ($n) {
                $actionUrl = $n->action_url;
                if ($actionUrl) {
                    $host = request()->getHost() ?: (request()->header('Host') ?: 'service.npc.ac.th');
                    $isSecure = str_contains($host, 'npc.ac.th') || request()->secure();

                    if ($isSecure && str_starts_with($actionUrl, 'http://')) {
                        $actionUrl = preg_replace('#^http://#', 'https://', $actionUrl);
                    }

                    if (str_contains($host, 'npc.ac.th')) {
                        if (str_contains($actionUrl, 'localhost')) {
                            $actionUrl = preg_replace('#^https?://[^/]+#', 'https://service.npc.ac.th', $actionUrl);
                        }
                        if (!str_contains($actionUrl, '/npc_smartflow')) {
                            $actionUrl = str_replace('service.npc.ac.th/', 'service.npc.ac.th/npc_smartflow/', $actionUrl);
                        }
                    }
                }

                // Auto-heal activity assignment URLs if missing activity_id
                if (($n->type === 'activity_assigned' || str_starts_with($n->reference_id ?? '', 'act_assign_')) && $n->reference_id) {
                    if (preg_match('/^act_assign_(\d+)_(.+)$/', $n->reference_id, $m)) {
                        $pId = $m[1];
                        $actId = $m[2];
                        if (!str_contains($actionUrl ?? '', 'activity_id=')) {
                            $sep = str_contains($actionUrl ?? '', '?') ? '&' : '?';
                            $actionUrl = ($actionUrl ?: route('projects.show', ['project' => $pId, 'tab' => 'do'])) . "{$sep}activity_id={$actId}";
                        }
                        if (!str_contains($actionUrl ?? '', 'tab=do')) {
                            $sep = str_contains($actionUrl ?? '', '?') ? '&' : '?';
                            $actionUrl .= "{$sep}tab=do";
                        }
                    }
                }

                return [
                    'id' => $n->id,
                    'title' => $n->title,
                    'message' => $n->message,
                    'type' => $n->type,
                    'action_url' => $actionUrl,
                    'icon' => $n->icon,
                    'color' => $n->color,
                    'is_read' => $n->isRead(),
                    'created_at' => $n->created_at ? $n->created_at->diffForHumans() : '',
                    'timestamp' => $n->created_at ? $n->created_at->format('d/m/Y H:i') : '',
                ];
            });

        $unreadCount = AppNotification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark a single notification as read and redirect or return JSON.
     */
    public function markAsRead(Request $request, $id)
    {
        $user = Auth::user();
        $notification = AppNotification::where('user_id', $user->id)->findOrFail($id);

        $notification->markAsRead();

        $actionUrl = $notification->action_url;
        if ($actionUrl) {
            $host = request()->getHost() ?: (request()->header('Host') ?: 'service.npc.ac.th');
            $isSecure = str_contains($host, 'npc.ac.th') || request()->secure();

            if ($isSecure && str_starts_with($actionUrl, 'http://')) {
                $actionUrl = preg_replace('#^http://#', 'https://', $actionUrl);
            }

            if (str_contains($host, 'npc.ac.th')) {
                if (str_contains($actionUrl, 'localhost')) {
                    $actionUrl = preg_replace('#^https?://[^/]+#', 'https://service.npc.ac.th', $actionUrl);
                }
                if (!str_contains($actionUrl, '/npc_smartflow')) {
                    $actionUrl = str_replace('service.npc.ac.th/', 'service.npc.ac.th/npc_smartflow/', $actionUrl);
                }
            }
        }

        // Auto-heal activity assignment URLs if missing activity_id
        if (($notification->type === 'activity_assigned' || str_starts_with($notification->reference_id ?? '', 'act_assign_')) && $notification->reference_id) {
            if (preg_match('/^act_assign_(\d+)_(.+)$/', $notification->reference_id, $m)) {
                $pId = $m[1];
                $actId = $m[2];
                if (!str_contains($actionUrl ?? '', 'activity_id=')) {
                    $sep = str_contains($actionUrl ?? '', '?') ? '&' : '?';
                    $actionUrl = ($actionUrl ?: route('projects.show', ['project' => $pId, 'tab' => 'do'])) . "{$sep}activity_id={$actId}";
                }
                if (!str_contains($actionUrl ?? '', 'tab=do')) {
                    $sep = str_contains($actionUrl ?? '', '?') ? '&' : '?';
                    $actionUrl .= "{$sep}tab=do";
                }
            }
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'action_url' => $actionUrl,
            ]);
        }

        if ($actionUrl) {
            return redirect()->to($actionUrl);
        }

        return redirect()->back();
    }

    /**
     * Mark all user's notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = Auth::user();
        if ($user) {
            AppNotification::where('user_id', $user->id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);
        }

        return response()->json(['success' => true]);
    }
}
