<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Appendix;
use App\Models\ProjectPhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AppendixController extends Controller
{
    /**
     * Check if current user is authorized to manage appendices for the project.
     */
    private function authorizeProject(Project $project): void
    {
        $user = auth()->user();
        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        $isAuthor = $project->user_id === $user->id;
        $isPowerUser = $user->isAdmin() || $user->isPlanHead() || $user->isPlanStaff();

        if (!$isAuthor && !$isPowerUser) {
            abort(403, 'ท่านไม่มีสิทธิ์ในการจัดการเอกสารภาคผนวกของโครงการนี้');
        }
    }

    /**
     * Store or replace an appendix file for the project (Max 10MB, PDF/Images).
     */
    public function store(Request $request, Project $project)
    {
        $this->authorizeProject($project);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:50',
            'caption' => 'nullable|string|max:1000',
            'external_url' => 'nullable|string|max:500',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png,webp|max:10240', // 10MB max
            'sort_order' => 'nullable|integer',
        ]);

        $filePath = null;
        $fileType = 'pdf';
        $fileSize = 0;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filePath = $file->store('appendices', 'public');
            $fileType = strtolower($file->getClientOriginalExtension());
            $fileSize = $file->getSize();
        }

        // Single-instance categories (covers, single official documents)
        $singleFileCategories = ['front_cover', 'back_cover', 'approved_proposal', 'memo_request', 'procurement_loan', 'evaluation_survey', 'official_order', 'schedule', 'speech', 'certificate_sample'];
        
        // If it's a single file category, replace existing or update
        if (in_array($validated['category'], $singleFileCategories)) {
            $existing = $project->appendices()->where('category', $validated['category'])->first();
            if ($existing) {
                if ($filePath && $existing->file_path) {
                    Storage::disk('public')->delete($existing->file_path);
                }
                $existing->update([
                    'title' => $validated['title'],
                    'file_path' => $filePath ?: $existing->file_path,
                    'file_type' => $filePath ? $fileType : $existing->file_type,
                    'file_size' => $filePath ? $fileSize : $existing->file_size,
                    'caption' => $validated['caption'] ?? $existing->caption,
                    'external_url' => $validated['external_url'] ?? $existing->external_url,
                ]);

                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => true,
                        'message' => 'อัพเดตไฟล์ ' . $existing->title . ' เรียบร้อยแล้ว',
                        'appendix' => [
                            'id' => $existing->id,
                            'title' => $existing->title,
                            'category' => $existing->category,
                            'caption' => $existing->caption,
                            'external_url' => $existing->external_url,
                            'file_url' => $existing->file_path ? asset('storage/' . $existing->file_path) : null,
                            'file_type' => $existing->file_type,
                            'file_size' => (int)$existing->file_size,
                        ]
                    ]);
                }

                return redirect()->back()->with('message', 'อัพเดตเอกสารเรียบร้อยแล้ว');
            }
        }

        // Otherwise create new appendix record
        $appendix = new Appendix([
            'project_id' => $project->id,
            'title' => $validated['title'],
            'category' => $validated['category'],
            'caption' => $validated['caption'] ?? null,
            'file_path' => $filePath ?: '',
            'external_url' => $validated['external_url'] ?? null,
            'file_type' => $fileType,
            'file_size' => $fileSize,
            'sort_order' => $validated['sort_order'] ?? ($project->appendices()->count() + 1),
        ]);
        $project->appendices()->save($appendix);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'อัพโหลดไฟล์ ' . $appendix->title . ' สำเร็จ',
                'appendix' => [
                    'id' => $appendix->id,
                    'title' => $appendix->title,
                    'category' => $appendix->category,
                    'caption' => $appendix->caption,
                    'external_url' => $appendix->external_url,
                    'file_url' => $appendix->file_path ? asset('storage/' . $appendix->file_path) : null,
                    'file_type' => $appendix->file_type,
                    'file_size' => (int)$appendix->file_size,
                ]
            ]);
        }

        return redirect()->back()->with('message', 'อัพโหลดเอกสารภาคผนวกเรียบร้อยแล้ว');
    }

    /**
     * Delete an appendix.
     */
    public function destroy(Appendix $appendix)
    {
        $this->authorizeProject($appendix->project);

        if ($appendix->file_path) {
            Storage::disk('public')->delete($appendix->file_path);
        }
        $appendix->delete();

        if (request()->wantsJson()) {
            return response()->json(['success' => true, 'message' => 'ลบเอกสารภาคผนวกเรียบร้อยแล้ว']);
        }

        return redirect()->back()->with('message', 'ลบเอกสารภาคผนวกเรียบร้อยแล้ว');
    }

    /**
     * Store a new photo for project activity grid (Max 10MB, Images only).
     */
    public function storePhoto(Request $request, Project $project)
    {
        $this->authorizeProject($project);

        $validated = $request->validate([
            'caption' => 'nullable|string|max:500',
            'photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:10240', // 10MB max
            'sort_order' => 'nullable|integer',
        ]);

        $path = $request->file('photo')->store('photos', 'public');

        $photo = new ProjectPhoto([
            'project_id' => $project->id,
            'photo_path' => $path,
            'caption' => $validated['caption'] ?? ('ภาพกิจกรรมที่ ' . ($project->photos()->count() + 1)),
            'sort_order' => $validated['sort_order'] ?? ($project->photos()->count() + 1),
        ]);
        $project->photos()->save($photo);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'อัพโหลดภาพกิจกรรมสำเร็จ',
                'photo' => [
                    'id' => $photo->id,
                    'photo_url' => asset('storage/' . $photo->photo_path),
                    'caption' => $photo->caption,
                    'sort_order' => $photo->sort_order,
                ]
            ]);
        }

        return redirect()->back()->with('message', 'อัพโหลดภาพกิจกรรมเรียบร้อยแล้ว');
    }

    /**
     * Update activity photo caption or sort order.
     */
    public function updatePhotoCaption(Request $request, ProjectPhoto $photo)
    {
        $this->authorizeProject($photo->project);

        $validated = $request->validate([
            'caption' => 'nullable|string|max:500',
            'sort_order' => 'nullable|integer',
        ]);

        $photo->update($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'บันทึกคำบรรยายภาพเรียบร้อยแล้ว',
                'photo' => [
                    'id' => $photo->id,
                    'caption' => $photo->caption,
                    'sort_order' => $photo->sort_order,
                ]
            ]);
        }

        return redirect()->back()->with('message', 'บันทึกคำบรรยายภาพเรียบร้อยแล้ว');
    }

    /**
     * Delete a project photo.
     */
    public function destroyPhoto(ProjectPhoto $photo)
    {
        $this->authorizeProject($photo->project);

        if ($photo->photo_path) {
            Storage::disk('public')->delete($photo->photo_path);
        }
        $photo->delete();

        if (request()->wantsJson()) {
            return response()->json(['success' => true, 'message' => 'ลบภาพกิจกรรมเรียบร้อยแล้ว']);
        }

        return redirect()->back()->with('message', 'ลบภาพกิจกรรมเรียบร้อยแล้ว');
    }

    /**
     * Display printable official Appendix document (A4 Layout).
     */
    public function printAppendix(Project $project)
    {
        $project->load([
            'department.parent',
            'user',
            'survey',
            'appendices',
            'photos' => function ($q) {
                $q->orderBy('sort_order', 'asc')->orderBy('id', 'asc');
            },
            'procurement.items',
            'approvals.user',
            'fundingSource',
            'budget.fundingSource',
        ]);

        return Inertia::render('Projects/PrintAppendix', [
            'project' => $project,
        ]);
    }
}
