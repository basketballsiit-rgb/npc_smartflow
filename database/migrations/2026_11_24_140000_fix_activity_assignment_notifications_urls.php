<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use App\Models\AppNotification;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('app_notifications')) {
            return;
        }

        // Find all notifications related to activity assignments
        $notifications = AppNotification::where(function ($q) {
            $q->where('type', 'activity_assigned')
              ->orWhere('reference_id', 'LIKE', 'act_assign_%')
              ->orWhere('title', 'LIKE', '%ท่านได้รับมอบหมายให้รับผิดชอบกิจกรรม%');
        })->get();

        foreach ($notifications as $n) {
            $refId = $n->reference_id ?? '';
            $actionUrl = $n->action_url ?? '';
            $projectId = null;
            $actId = null;

            if ($refId && preg_match('/^act_assign_(\d+)_(.+)$/', $refId, $matches)) {
                $projectId = $matches[1];
                $actId = $matches[2];
            } elseif (preg_match('#/projects/(\d+)#', $actionUrl, $matches)) {
                $projectId = $matches[1];
            }

            if ($projectId) {
                // If actId wasn't found in reference_id, look inside the project's activities
                if (!$actId) {
                    $project = \App\Models\Project::find($projectId);
                    if ($project && is_array($project->activities)) {
                        foreach ($project->activities as $act) {
                            $assigned = array_map('intval', $act['assigned_user_ids'] ?? []);
                            if (in_array((int)$n->user_id, $assigned, true)) {
                                $actId = $act['id'] ?? null;
                                break;
                            }
                        }
                    }
                }

                $query = ['tab' => 'do'];
                if ($actId) {
                    $query['activity_id'] = $actId;
                }

                try {
                    $n->action_url = route('projects.show', array_merge(['project' => $projectId], $query));
                } catch (\Throwable $e) {
                    $n->action_url = "/projects/{$projectId}?tab=do" . ($actId ? "&activity_id={$actId}" : '');
                }

                if ($actId && empty($n->reference_id)) {
                    $n->reference_id = 'act_assign_' . $projectId . '_' . $actId;
                }
                $n->save();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reversal needed
    }
};
