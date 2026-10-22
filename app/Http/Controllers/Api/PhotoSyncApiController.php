<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

        return response()->json([
            'success' => true,
            'message' => 'Webhook received successfully',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
