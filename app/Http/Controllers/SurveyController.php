<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SurveyController extends Controller
{
    /**
     * Display the public project survey evaluation form.
     */
    public function evaluate(Project $project)
    {
        // Allow evaluations for approved, in_progress, evaluating, and completed projects
        if (!in_array($project->status, ['approved', 'in_progress', 'evaluating', 'completed'])) {
            return Inertia::render('Surveys/Closed', [
                'project_title' => $project->title,
                'message' => 'โครงการยังอยู่ระหว่างการร่างหรือเสนอขออนุมัติ ยังไม่เปิดให้ตอบแบบประเมินความพึงพอใจในขณะนี้'
            ]);
        }

        return Inertia::render('Surveys/Evaluate', [
            'project' => $project->only(['id', 'title', 'academic_year']),
        ]);
    }

    /**
     * Submit a survey response.
     */
    public function submitResponse(Request $request, Project $project)
    {
        if (!in_array($project->status, ['approved', 'in_progress', 'evaluating', 'completed'])) {
            abort(403, 'ระบบยังไม่เปิดให้ตอบแบบประเมินสำหรับโครงการนี้');
        }

        $validated = $request->validate([
            'rating_q1' => 'required|integer|min:1|max:5',
            'rating_q2' => 'required|integer|min:1|max:5',
            'rating_q3' => 'required|integer|min:1|max:5',
            'rating_q4' => 'required|integer|min:1|max:5',
            'rating_q5' => 'required|integer|min:1|max:5',
            'comments' => 'nullable|string|max:1000',
        ]);

        // Find or create survey for the project
        $survey = Survey::firstOrCreate(
            ['project_id' => $project->id],
            [
                'survey_code' => 'SV-' . str_pad($project->id, 5, '0', STR_PAD_LEFT),
                'title' => 'แบบประเมินความพึงพอใจโครงการ ' . $project->title
            ]
        );

        // Store survey response
        $survey->responses()->create([
            'respondent_type' => 'student', // default stakeholder type
            'rating_q1' => $validated['rating_q1'],
            'rating_q2' => $validated['rating_q2'],
            'rating_q3' => $validated['rating_q3'],
            'rating_q4' => $validated['rating_q4'],
            'rating_q5' => $validated['rating_q5'],
            'comments' => $validated['comments'] ?? null,
        ]);

        return redirect()->route('surveys.evaluate', $project->id)->with('message', 'บันทึกผลการประเมินความพึงพอใจโครงการเรียบร้อยแล้ว');
    }

    /**
     * Display survey statistics (Authenticated).
     */
    public function stats(Project $project)
    {
        $survey = Survey::where('project_id', $project->id)->first();
        
        $totalResponses = 0;
        $averages = [
            'q1' => 0.0,
            'q2' => 0.0,
            'q3' => 0.0,
            'q4' => 0.0,
            'q5' => 0.0,
            'overall' => 0.0,
            'satisfaction_percentage' => 0.0
        ];
        $comments = [];
        $actRecommendation = null;

        if ($survey) {
            $responses = $survey->responses;
            $totalResponses = $responses->count();
            $actRecommendation = $survey->act_recommendation;

            if ($totalResponses > 0) {
                $sumQ1 = $responses->sum('rating_q1');
                $sumQ2 = $responses->sum('rating_q2');
                $sumQ3 = $responses->sum('rating_q3');
                $sumQ4 = $responses->sum('rating_q4');
                $sumQ5 = $responses->sum('rating_q5');

                $averages['q1'] = round($sumQ1 / $totalResponses, 2);
                $averages['q2'] = round($sumQ2 / $totalResponses, 2);
                $averages['q3'] = round($sumQ3 / $totalResponses, 2);
                $averages['q4'] = round($sumQ4 / $totalResponses, 2);
                $averages['q5'] = round($sumQ5 / $totalResponses, 2);

                $overallSum = $sumQ1 + $sumQ2 + $sumQ3 + $sumQ4 + $sumQ5;
                $averages['overall'] = round($overallSum / ($totalResponses * 5), 2);
                $averages['satisfaction_percentage'] = round(($averages['overall'] / 5) * 100, 1);

                $comments = $responses->whereNotNull('comments')->pluck('comments')->toArray();
            }
        }

        // Generate QR code link pointing to the public evaluation route
        $evaluationUrl = route('surveys.evaluate', $project->id);
        $qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" . urlencode($evaluationUrl);

        return Inertia::render('Surveys/Stats', [
            'project' => $project->only(['id', 'title', 'academic_year']),
            'totalResponses' => $totalResponses,
            'averages' => $averages,
            'comments' => $comments,
            'actRecommendation' => $actRecommendation,
            'qrCodeUrl' => $qrCodeUrl,
            'evaluationUrl' => $evaluationUrl
        ]);
    }

    /**
     * Generate AI ACT Recommendations using Gemini.
     */
    public function generateAiRecommendations(Project $project, GeminiService $geminiService)
    {
        $survey = Survey::where('project_id', $project->id)->first();
        if (!$survey) {
            // Auto-create survey if missing
            $survey = Survey::create([
                'project_id' => $project->id,
                'survey_code' => 'SV-' . str_pad($project->id, 5, '0', STR_PAD_LEFT),
                'title' => 'แบบประเมินความพึงพอใจโครงการ ' . $project->title
            ]);
        }

        $responses = $survey->responses;
        $totalResponses = $responses->count();

        if ($totalResponses === 0) {
            return redirect()->back()->with('error', 'No feedback responses have been received yet.');
        }

        $sumQ1 = $responses->sum('rating_q1');
        $sumQ2 = $responses->sum('rating_q2');
        $sumQ3 = $responses->sum('rating_q3');
        $sumQ4 = $responses->sum('rating_q4');
        $sumQ5 = $responses->sum('rating_q5');

        $averages = [
            'q1' => round($sumQ1 / $totalResponses, 2),
            'q2' => round($sumQ2 / $totalResponses, 2),
            'q3' => round($sumQ3 / $totalResponses, 2),
            'q4' => round($sumQ4 / $totalResponses, 2),
            'q5' => round($sumQ5 / $totalResponses, 2),
        ];

        $overallSum = $sumQ1 + $sumQ2 + $sumQ3 + $sumQ4 + $sumQ5;
        $averages['overall'] = round($overallSum / ($totalResponses * 5), 2);
        $averages['satisfaction_percentage'] = round(($averages['overall'] / 5) * 100, 1);

        $commentsList = $responses->whereNotNull('comments')->pluck('comments')->toArray();

        $recommendation = $geminiService->generateRecommendations($totalResponses, $averages, $commentsList);

        $survey->act_recommendation = $recommendation;
        $survey->save();

        return redirect()->route('surveys.stats', $project->id)->with('message', 'AI ACT Recommendation generated successfully.');
    }
}
