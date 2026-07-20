<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Appendix;
use App\Models\ProjectPhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AppendixController extends Controller
{
    /**
     * Store a new PDF appendix for the project.
     */
    public function store(Request $request, Project $project)
    {
        // Only author can upload appendices
        if ($project->user_id !== auth()->id()) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf|max:10240', // 10MB max
        ]);

        $path = $request->file('file')->store('appendices', 'public');

        $appendix = new Appendix([
            'title' => $validated['title'],
            'file_path' => $path,
            'file_type' => 'pdf',
            'file_size' => $request->file('file')->getSize(),
        ]);
        $project->appendices()->save($appendix);

        return redirect()->back()->with('message', 'Appendix PDF uploaded successfully.');
    }

    /**
     * Delete an appendix.
     */
    public function destroy(Appendix $appendix)
    {
        if ($appendix->project->user_id !== auth()->id()) {
            abort(403, 'Unauthorized.');
        }

        Storage::disk('public')->delete($appendix->file_path);
        $appendix->delete();

        return redirect()->back()->with('message', 'Appendix deleted successfully.');
    }

    /**
     * Store a new photo for the project photo grid.
     */
    public function storePhoto(Request $request, Project $project)
    {
        if ($project->user_id !== auth()->id()) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'caption' => 'nullable|string|max:255',
            'photo' => 'required|image|mimes:jpg,jpeg,png|max:5120', // 5MB max
        ]);

        $path = $request->file('photo')->store('photos', 'public');

        $photo = new ProjectPhoto([
            'photo_path' => $path,
            'caption' => $validated['caption'] ?? null,
        ]);
        $project->photos()->save($photo);

        return redirect()->back()->with('message', 'Activity photo uploaded successfully.');
    }

    /**
     * Delete a project photo.
     */
    public function destroyPhoto(ProjectPhoto $photo)
    {
        if ($photo->project->user_id !== auth()->id()) {
            abort(403, 'Unauthorized.');
        }

        Storage::disk('public')->delete($photo->photo_path);
        $photo->delete();

        return redirect()->back()->with('message', 'Photo deleted successfully.');
    }
}
