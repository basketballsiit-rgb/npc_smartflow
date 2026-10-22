<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class PhotoSyncApiController extends Controller
{
    /**
     * Verify Secret Token from PhotoSync
     */
    protected function verifySecret(Request $request): bool
    {
        $expectedSecret = env('SMARTFLOW_SECRET_KEY', 'npc-smartflow-secret-production-2026');
        $incomingSecret = $request->header('X-SmartFlow-Secret')
            ?? $request->header('X-PhotoSync-Api-Key')
            ?? $request->query('secret');

        if (!$incomingSecret) {
            return false;
        }

        return hash_equals($expectedSecret, $incomingSecret);
    }

    /**
     * GET /api/v1/projects
     * Returns approved projects formatted for PhotoSync integration
     */
    public function getProjects(Request $request)
    {
        if (!$this->verifySecret($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Invalid X-SmartFlow-Secret',
            ], 401);
        }

        $query = Project::with(['department.parent']);

        if ($request->has('academicYear') && !empty($request->query('academicYear'))) {
            $query->where('academic_year', $request->query('academicYear'));
        }

        if ($request->has('q') && !empty($request->query('q'))) {
            $keyword = $request->query('q');
            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', "%{$keyword}%")
                  ->orWhere('id', 'like', "%{$keyword}%")
                  ->orWhere('responsible_person', 'like', "%{$keyword}%");
            });
        }

        $projects = $query->orderBy('academic_year', 'desc')->orderBy('id', 'asc')->get();

        $formatted = $projects->map(function ($p) {
            $dept = $p->department;
            $divisionName = 'ฝ่ายบริหารทรัพยากร';
            $departmentName = null;

            if ($dept) {
                if ($dept->parent) {
                    $divisionName = $dept->parent->name;
                    $departmentName = $dept->name;
                } else {
                    $divisionName = $dept->name;
                    $departmentName = null;
                }
            }

            $shortYear = substr((string)($p->academic_year ?: 2569), -2);
            $paddedId = str_pad((string)$p->id, 3, '0', STR_PAD_LEFT);
            $projectCode = "PRJ-{$shortYear}-{$paddedId}";

            return [
                'smartflowId' => (string)$p->id,
                'projectCode' => $projectCode,
                'projectName' => $p->title,
                'academicYear' => (int)($p->academic_year ?: 2569),
                'budgetYear' => (int)($p->academic_year ?: 2569),
                'divisionName' => $divisionName,
                'departmentName' => $departmentName,
                'ownerTeacherName' => $p->responsible_person ?: ($dept ? $dept->deputy_director_name : 'ครูผู้รับผิดชอบ'),
                'ownerEmail' => $p->email ?: 'academic@npc.ac.th',
                'projectStatus' => 'APPROVED',
            ];
        });

        return response()->json([
            'success' => true,
            'count' => $formatted->count(),
            'projects' => $formatted,
        ]);
    }

    /**
     * POST /api/v1/webhooks/photosync
     * Webhook receiver when PhotoSync creates/links an album to a project
     */
    public function receivePhotoSyncWebhook(Request $request)
    {
        if (!$this->verifySecret($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Invalid X-SmartFlow-Secret',
            ], 401);
        }

        $data = $request->all();
        Log::info('PhotoSync Webhook Received:', $data);

        // Notify project owner in SmartFlow
        $projectCode = $data['projectCode'] ?? '';
        $albumTitle = $data['albumTitle'] ?? 'ภาพกิจกรรม';
        $photoCount = $data['photoCount'] ?? 0;

        if ($projectCode) {
            $parts = explode('-', $projectCode);
            $idCandidate = end($parts);
            $projectId = intval($idCandidate);

            $project = Project::find($projectId);
            if ($project && $project->user_id) {
                try {
                    AppNotification::create([
                        'user_id' => $project->user_id,
                        'title' => '📷 ได้รับภาพกิจกรรมจาก PhotoSync',
                        'message' => "อัลบั้ม \"{$albumTitle}\" ({$photoCount} ภาพ) เชื่อมโยงเข้าสู่โครงการเรียบร้อยแล้ว พร้อมนำไปใส่เล่มรายงาน 5 บท",
                        'type' => 'photosync',
                        'action_url' => "/projects/{$project->id}/report",
                        'icon' => 'camera',
                        'color' => 'emerald',
                        'reference_id' => $project->id,
                    ]);
                } catch (\Exception $e) {
                    Log::warning('Failed to create AppNotification for PhotoSync webhook: ' . $e->getMessage());
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Webhook received and processed successfully',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * GET /api/v1/projects/{id}/photosync-status
     * Check photos available from PhotoSync for a specific SmartFlow project (accepts ID or projectCode)
     */
    public function checkPhotoSyncStatus($id)
    {
        $project = null;
        $projectCode = null;

        if (is_numeric($id)) {
            $project = Project::find($id);
            if ($project) {
                $shortYear = substr((string)($project->academic_year ?: 2569), -2);
                $paddedId = str_pad((string)$project->id, 3, '0', STR_PAD_LEFT);
                $projectCode = "PRJ-{$shortYear}-{$paddedId}";
            }
        }

        // Support direct project code e.g. PRJ-69-001 or ID parsing
        if (!$projectCode) {
            $cleaned = trim(str_replace(['{', '}', '%7B', '%7D'], '', (string)$id));
            if (preg_match('/PRJ-\d+-(\d+)/i', $cleaned, $matches)) {
                $projectCode = strtoupper($cleaned);
                $project = Project::find(intval($matches[1]));
            } else if (is_numeric($cleaned)) {
                $project = Project::find(intval($cleaned));
                if ($project) {
                    $shortYear = substr((string)($project->academic_year ?: 2569), -2);
                    $paddedId = str_pad((string)$project->id, 3, '0', STR_PAD_LEFT);
                    $projectCode = "PRJ-{$shortYear}-{$paddedId}";
                } else {
                    $projectCode = "PRJ-69-" . str_pad($cleaned, 3, '0', STR_PAD_LEFT);
                }
            } else {
                $projectCode = strtoupper($cleaned);
            }
        }

        $photosyncUrl = env('PHOTOSYNC_API_URL', 'https://service.npc.ac.th/npc_photosync/api/v1');
        $apiKey = env('PHOTOSYNC_API_KEY', 'photosync-secure-rest-api-key-for-smartflow-reports');

        try {
            $response = Http::withHeaders([
                'x-photosync-api-key' => $apiKey,
            ])->timeout(8)->get("{$photosyncUrl}/media/by-project/{$projectCode}");

            if ($response->ok()) {
                return response()->json([
                    'success' => true,
                    'projectCode' => $projectCode,
                    'projectName' => $project ? $project->title : $response->json('data.project.projectName'),
                    'smartflowProject' => $project ? [
                        'id' => $project->id,
                        'title' => $project->title,
                        'academic_year' => $project->academic_year,
                    ] : null,
                    'photosyncData' => $response->json('data'),
                ]);
            }

            return response()->json([
                'success' => false,
                'projectCode' => $projectCode,
                'status' => $response->status(),
                'error' => 'Could not fetch media from PhotoSync. Project might not have linked albums yet.',
            ], $response->status());
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'projectCode' => $projectCode,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
