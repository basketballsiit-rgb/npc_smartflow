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

        // Find or auto-initialize survey for the project
        $survey = Survey::firstOrCreate(
            ['project_id' => $project->id],
            [
                'survey_code' => 'SV-' . str_pad($project->id, 5, '0', STR_PAD_LEFT),
                'title' => 'แบบประเมินความพึงพอใจโครงการ ' . $project->title,
                'questions' => (new GeminiService())->getFallbackSurveyQuestions($project),
                'is_active' => true,
            ]
        );

        if (empty($survey->questions) || !is_array($survey->questions)) {
            $survey->questions = (new GeminiService())->getFallbackSurveyQuestions($project);
            $survey->save();
        }

        return Inertia::render('Surveys/Evaluate', [
            'project' => $project->only(['id', 'title', 'academic_year']),
            'survey' => [
                'id' => $survey->id,
                'title' => $survey->title,
                'description' => $survey->description,
                'questions' => $survey->questions,
                'is_active' => $survey->is_active,
            ],
        ]);
    }

    /**
     * Submit a survey response (Public).
     */
    public function submitResponse(Request $request, Project $project)
    {
        if (!in_array($project->status, ['approved', 'in_progress', 'evaluating', 'completed'])) {
            abort(403, 'ระบบยังไม่เปิดให้ตอบแบบประเมินสำหรับโครงการนี้');
        }

        $validated = $request->validate([
            'ratings' => 'nullable|array',
            'ratings.*' => 'nullable|integer|min:1|max:5',
            'rating_q1' => 'nullable|integer|min:1|max:5',
            'rating_q2' => 'nullable|integer|min:1|max:5',
            'rating_q3' => 'nullable|integer|min:1|max:5',
            'rating_q4' => 'nullable|integer|min:1|max:5',
            'rating_q5' => 'nullable|integer|min:1|max:5',
            'respondent_name' => 'nullable|string|max:255',
            'respondent_type' => 'nullable|string|max:50',
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

        $ratings = $validated['ratings'] ?? [];
        $scoresList = array_values(array_filter($ratings, fn($v) => is_numeric($v)));

        $q1 = $scoresList[0] ?? ($validated['rating_q1'] ?? 5);
        $q2 = $scoresList[1] ?? ($validated['rating_q2'] ?? 5);
        $q3 = $scoresList[2] ?? ($validated['rating_q3'] ?? 5);
        $q4 = $scoresList[3] ?? ($validated['rating_q4'] ?? 5);
        $q5 = $scoresList[4] ?? ($validated['rating_q5'] ?? 5);

        // Store survey response
        $survey->responses()->create([
            'respondent_name' => $validated['respondent_name'] ?? null,
            'respondent_type' => $validated['respondent_type'] ?? 'student',
            'ratings' => !empty($ratings) ? $ratings : [$q1, $q2, $q3, $q4, $q5],
            'rating_q1' => $q1,
            'rating_q2' => $q2,
            'rating_q3' => $q3,
            'rating_q4' => $q4,
            'rating_q5' => $q5,
            'comments' => $validated['comments'] ?? null,
        ]);

        return redirect()->route('surveys.evaluate', $project->id)->with('message', 'บันทึกผลการประเมินความพึงพอใจโครงการเรียบร้อยแล้ว ขอบพระคุณสำหรับความร่วมมือ');
    }

    /**
     * Get survey builder data for Chapter 3 / Evaluation builder.
     */
    public function getBuilderData(Project $project, GeminiService $geminiService)
    {
        $survey = Survey::firstOrCreate(
            ['project_id' => $project->id],
            [
                'survey_code' => 'SV-' . str_pad($project->id, 5, '0', STR_PAD_LEFT),
                'title' => 'แบบประเมินความพึงพอใจโครงการ ' . $project->title,
                'questions' => $geminiService->getFallbackSurveyQuestions($project),
                'is_active' => true,
            ]
        );

        if (empty($survey->questions) || !is_array($survey->questions)) {
            $survey->questions = $geminiService->getFallbackSurveyQuestions($project);
            $survey->save();
        }

        $evaluationUrl = route('surveys.evaluate', $project->id);
        $qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" . urlencode($evaluationUrl);
        $statsSummary = $this->calculateDetailedStats($survey);

        return response()->json([
            'success' => true,
            'survey' => $survey,
            'totalResponses' => $survey->responses()->count(),
            'evaluationUrl' => $evaluationUrl,
            'qrCodeUrl' => $qrCodeUrl,
            'statsSummary' => $statsSummary,
        ]);
    }

    /**
     * Synthesize survey questions from Project Objectives & Indicators using AI (Authenticated).
     */
    public function generateAiQuestions(Request $request, Project $project, GeminiService $geminiService)
    {
        $questions = $geminiService->generateSurveyQuestions($project);

        if ($request->boolean('save', false)) {
            $survey = Survey::firstOrCreate(
                ['project_id' => $project->id],
                [
                    'survey_code' => 'SV-' . str_pad($project->id, 5, '0', STR_PAD_LEFT),
                    'title' => 'แบบประเมินความพึงพอใจโครงการ ' . $project->title,
                ]
            );
            $survey->questions = $questions;
            $survey->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'AI สังเคราะห์ข้อคำถามประเมินโครงการจากวัตถุประสงค์และตัวชี้วัดสำเร็จ',
            'questions' => $questions,
        ]);
    }

    /**
     * Save customized survey questions (Authenticated).
     */
    public function saveQuestions(Request $request, Project $project)
    {
        $validated = $request->validate([
            'questions' => 'required|array|min:1',
            'questions.*.id' => 'nullable',
            'questions.*.category' => 'nullable|string|max:255',
            'questions.*.question' => 'required|string|max:1000',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $survey = Survey::firstOrCreate(
            ['project_id' => $project->id],
            [
                'survey_code' => 'SV-' . str_pad($project->id, 5, '0', STR_PAD_LEFT),
                'title' => $validated['title'] ?? ('แบบประเมินความพึงพอใจโครงการ ' . $project->title),
            ]
        );

        $cleanQuestions = [];
        $idx = 1;
        foreach ($validated['questions'] as $q) {
            $cleanQuestions[] = [
                'id' => $idx++,
                'category' => trim($q['category'] ?? "ด้านที่ {$idx}"),
                'question' => trim($q['question']),
            ];
        }

        $survey->questions = $cleanQuestions;
        if (!empty($validated['title'])) {
            $survey->title = $validated['title'];
        }
        if (isset($validated['description'])) {
            $survey->description = $validated['description'];
        }
        $survey->is_active = true;
        $survey->save();

        return response()->json([
            'success' => true,
            'message' => 'บันทึกแบบประเมินโครงการเรียบร้อยแล้ว',
            'survey' => $survey,
        ]);
    }

    /**
     * Display survey statistics (Authenticated).
     */
    public function stats(Request $request, Project $project)
    {
        $survey = Survey::where('project_id', $project->id)->first();
        $detailedStats = $this->calculateDetailedStats($survey);

        $totalResponses = $detailedStats['totalResponses'];
        $actRecommendation = $survey?->act_recommendation;
        $comments = $survey ? $survey->responses()->whereNotNull('comments')->pluck('comments')->toArray() : [];

        $evaluationUrl = route('surveys.evaluate', $project->id);
        $qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" . urlencode($evaluationUrl);

        if ($request->wantsJson()) {
            return response()->json([
                'project' => $project->only(['id', 'title', 'academic_year']),
                'totalResponses' => $totalResponses,
                'detailedStats' => $detailedStats,
                'comments' => $comments,
                'actRecommendation' => $actRecommendation,
                'qrCodeUrl' => $qrCodeUrl,
                'evaluationUrl' => $evaluationUrl,
            ]);
        }

        $averages = [
            'q1' => $detailedStats['questionsStats'][0]['mean'] ?? 0.0,
            'q2' => $detailedStats['questionsStats'][1]['mean'] ?? 0.0,
            'q3' => $detailedStats['questionsStats'][2]['mean'] ?? 0.0,
            'q4' => $detailedStats['questionsStats'][3]['mean'] ?? 0.0,
            'q5' => $detailedStats['questionsStats'][4]['mean'] ?? 0.0,
            'overall' => $detailedStats['overallMean'],
            'satisfaction_percentage' => $detailedStats['overallPercentage'],
        ];

        return Inertia::render('Surveys/Stats', [
            'project' => $project->only(['id', 'title', 'academic_year']),
            'totalResponses' => $totalResponses,
            'averages' => $averages,
            'detailedStats' => $detailedStats,
            'comments' => $comments,
            'actRecommendation' => $actRecommendation,
            'qrCodeUrl' => $qrCodeUrl,
            'evaluationUrl' => $evaluationUrl,
        ]);
    }

    /**
     * Generate AI ACT Recommendations using Gemini.
     */
    public function generateAiRecommendations(Project $project, GeminiService $geminiService)
    {
        $survey = Survey::where('project_id', $project->id)->first();
        if (!$survey) {
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

        $detailedStats = $this->calculateDetailedStats($survey);
        $averages = [
            'q1' => $detailedStats['questionsStats'][0]['mean'] ?? 0.0,
            'q2' => $detailedStats['questionsStats'][1]['mean'] ?? 0.0,
            'q3' => $detailedStats['questionsStats'][2]['mean'] ?? 0.0,
            'q4' => $detailedStats['questionsStats'][3]['mean'] ?? 0.0,
            'q5' => $detailedStats['questionsStats'][4]['mean'] ?? 0.0,
            'overall' => $detailedStats['overallMean'],
            'satisfaction_percentage' => $detailedStats['overallPercentage'],
        ];

        $commentsList = $responses->whereNotNull('comments')->pluck('comments')->toArray();
        $recommendation = $geminiService->generateRecommendations($totalResponses, $averages, $commentsList);

        $survey->act_recommendation = $recommendation;
        $survey->save();

        return redirect()->route('surveys.stats', $project->id)->with('message', 'AI ACT Recommendation generated successfully.');
    }

    /**
     * Compute comprehensive statistical analysis for survey questions (Mean, S.D., Level).
     */
    public function calculateDetailedStats(?Survey $survey): array
    {
        if (!$survey) {
            return [
                'totalResponses' => 0,
                'overallMean' => 0.0,
                'overallSd' => 0.0,
                'overallPercentage' => 0.0,
                'overallLevel' => 'ยังไม่มีข้อมูล',
                'questionsStats' => [],
            ];
        }

        $responses = $survey->responses;
        $totalResponses = $responses->count();
        $questions = is_array($survey->questions) && count($survey->questions) > 0 
            ? $survey->questions 
            : ($survey->project ? (new GeminiService())->getFallbackSurveyQuestions($survey->project) : []);

        if (empty($survey->questions) && !empty($questions)) {
            $survey->questions = $questions;
            $survey->save();
        }

        if ($totalResponses === 0) {
            return [
                'totalResponses' => 0,
                'overallMean' => 0.0,
                'overallSd' => 0.0,
                'overallPercentage' => 0.0,
                'overallLevel' => 'ยังไม่มีข้อมูล',
                'questionsStats' => array_map(function($q, $idx) {
                    return [
                        'id' => $q['id'] ?? ($idx + 1),
                        'category' => $q['category'] ?? "ด้านที่ " . ($idx + 1),
                        'question' => $q['question'] ?? '',
                        'count' => 0,
                        'mean' => 0.0,
                        'sd' => 0.0,
                        'percentage' => 0.0,
                        'level' => 'ยังไม่มีข้อมูล'
                    ];
                }, $questions, array_keys($questions)),
            ];
        }

        $questionsStats = [];
        $allScores = [];

        foreach ($questions as $index => $q) {
            $qId = (string)($q['id'] ?? ($index + 1));
            $scores = [];

            foreach ($responses as $resp) {
                $val = null;
                if (is_array($resp->ratings)) {
                    if (isset($resp->ratings[$qId])) {
                        $val = $resp->ratings[$qId];
                    } elseif (isset($resp->ratings[$index])) {
                        $val = $resp->ratings[$index];
                    }
                }
                if ($val === null) {
                    $legacyKey = 'rating_q' . min(5, max(1, $index + 1));
                    $val = $resp->$legacyKey;
                }
                if (is_numeric($val) && $val >= 1 && $val <= 5) {
                    $scores[] = (float)$val;
                    $allScores[] = (float)$val;
                }
            }

            $qCount = count($scores);
            $mean = $qCount > 0 ? round(array_sum($scores) / $qCount, 2) : 0.0;
            $sd = 0.0;
            if ($qCount > 1) {
                $variance = 0.0;
                foreach ($scores as $s) {
                    $variance += pow($s - $mean, 2);
                }
                $sd = round(sqrt($variance / ($qCount - 1)), 2);
            }
            $percentage = round(($mean / 5.0) * 100, 1);
            $level = $this->interpretLikert($mean);

            $questionsStats[] = [
                'id' => $q['id'] ?? ($index + 1),
                'category' => $q['category'] ?? "ด้านที่ " . ($index + 1),
                'question' => $q['question'] ?? '',
                'count' => $qCount,
                'mean' => $mean,
                'sd' => $sd,
                'percentage' => $percentage,
                'level' => $level,
            ];
        }

        $totalAll = count($allScores);
        $overallMean = $totalAll > 0 ? round(array_sum($allScores) / $totalAll, 2) : 0.0;
        $overallSd = 0.0;
        if ($totalAll > 1) {
            $variance = 0.0;
            foreach ($allScores as $s) {
                $variance += pow($s - $overallMean, 2);
            }
            $overallSd = round(sqrt($variance / ($totalAll - 1)), 2);
        }
        $overallPercentage = round(($overallMean / 5.0) * 100, 1);
        $overallLevel = $this->interpretLikert($overallMean);

        return [
            'totalResponses' => $totalResponses,
            'overallMean' => $overallMean,
            'overallSd' => $overallSd,
            'overallPercentage' => $overallPercentage,
            'overallLevel' => $overallLevel,
            'questionsStats' => $questionsStats,
        ];
    }

    /**
     * Interpret Likert score according to Best (1977) scale.
     */
    private function interpretLikert(float $score): string
    {
        if ($score >= 4.50) return 'มากที่สุด';
        if ($score >= 3.50) return 'มาก';
        if ($score >= 2.50) return 'ปานกลาง';
        if ($score >= 1.50) return 'น้อย';
        if ($score > 0) return 'น้อยที่สุด / ปรับปรุง';
        return 'ยังไม่มีข้อมูล';
    }
}

