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
            'gender' => 'nullable|string|max:50',
            'education_level' => 'nullable|string|max:50',
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
            'gender' => $validated['gender'] ?? 'male',
            'education_level' => $validated['education_level'] ?? 'voc_cert',
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
            $dim = $q['dimension'] ?? null;
            if (!$dim) {
                if ($idx <= 4) $dim = 1;
                elseif ($idx <= 8) $dim = 2;
                elseif ($idx <= 12) $dim = 3;
                else $dim = 4;
            }
            $cleanQuestions[] = [
                'id' => $idx++,
                'dimension' => (int)$dim,
                'category' => trim($q['category'] ?? "ด้านที่ {$dim}"),
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
     * Load the standard 15-question pattern across 4 dimensions into project survey.
     */
    public function loadStandardPattern(Request $request, Project $project, GeminiService $geminiService)
    {
        $questions = $geminiService->getStandard15PatternQuestions($project);

        $survey = Survey::firstOrCreate(
            ['project_id' => $project->id],
            [
                'survey_code' => 'SV-' . str_pad($project->id, 5, '0', STR_PAD_LEFT),
                'title' => 'แบบประเมินความพึงพอใจโครงการ ' . $project->title,
            ]
        );

        $survey->questions = $questions;
        $survey->is_active = true;
        $survey->save();

        return response()->json([
            'success' => true,
            'message' => 'โหลดชุดคำถามมาตรฐาน 4 ด้าน (15 ข้อ) สอดคล้องกับวัตถุประสงค์และตัวชี้วัดเรียบร้อยแล้ว',
            'questions' => $questions,
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
            'dimensionStats' => $detailedStats['dimensionStats'] ?? [],
        ];

        $commentsList = $responses->whereNotNull('comments')->pluck('comments')->toArray();
        $recommendation = $geminiService->generateRecommendations($totalResponses, $averages, $commentsList);

        $survey->act_recommendation = $recommendation;
        $survey->save();

        return redirect()->route('surveys.stats', $project->id)->with('message', 'AI ACT Recommendation generated successfully.');
    }

    /**
     * Compute comprehensive statistical analysis for survey questions (Mean, S.D., Level)
     * and organize into 4 standard evaluation dimensions with Chapter 1 comparison synthesis.
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
                'dimensionStats' => [],
                'chapter1Comparison' => null,
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

        $dimensionTitles = [
            1 => 'ด้านที่ 1: ด้านกระบวนการและขั้นตอนการดำเนินงาน (Process / Plan & Do)',
            2 => 'ด้านที่ 2: ด้านปัจจัยนำเข้าและการอำนวยความสะดวก (Input)',
            3 => 'ด้านที่ 3: ด้านผลผลิตและผลลัพธ์โดยตรง (Output / Objective)',
            4 => 'ด้านที่ 4: ด้านประโยชน์และการนำไปใช้ประโยชน์ (Outcome / Impact)',
        ];

        if ($totalResponses === 0) {
            return [
                'totalResponses' => 0,
                'overallMean' => 0.0,
                'overallSd' => 0.0,
                'overallPercentage' => 0.0,
                'overallLevel' => 'ยังไม่มีข้อมูล',
                'questionsStats' => array_map(function($q, $idx) use ($dimensionTitles) {
                    $dim = $q['dimension'] ?? ($idx < 4 ? 1 : ($idx < 8 ? 2 : ($idx < 12 ? 3 : 4)));
                    return [
                        'id' => $q['id'] ?? ($idx + 1),
                        'dimension' => (int)$dim,
                        'category' => $q['category'] ?? ($dimensionTitles[$dim] ?? "ด้านที่ {$dim}"),
                        'question' => $q['question'] ?? '',
                        'count' => 0,
                        'mean' => 0.0,
                        'sd' => 0.0,
                        'percentage' => 0.0,
                        'level' => 'ยังไม่มีข้อมูล'
                    ];
                }, $questions, array_keys($questions)),
                'dimensionStats' => [],
                'chapter1Comparison' => null,
                'demographicStats' => $this->computeDemographicStats($responses, 0),
            ];
        }

        $questionsStats = [];
        $allScores = [];
        $dimensionScores = [1 => [], 2 => [], 3 => [], 4 => []];

        foreach ($questions as $index => $q) {
            $qId = (string)($q['id'] ?? ($index + 1));
            $scores = [];

            // Determine dimension
            $dim = $q['dimension'] ?? null;
            if (!$dim) {
                if ($index < 4) $dim = 1;
                elseif ($index < 8) $dim = 2;
                elseif ($index < 12) $dim = 3;
                else $dim = 4;
            }
            $dim = (int)$dim;

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
                    $dimensionScores[$dim][] = (float)$val;
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
                'dimension' => $dim,
                'category' => $q['category'] ?? ($dimensionTitles[$dim] ?? "ด้านที่ {$dim}"),
                'question' => $q['question'] ?? '',
                'count' => $qCount,
                'mean' => $mean,
                'sd' => $sd,
                'percentage' => $percentage,
                'level' => $level,
            ];
        }

        // Overall calculations
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

        // Dimension subtotals calculations
        $dimensionStats = [];
        foreach ([1, 2, 3, 4] as $dNum) {
            $dScores = $dimensionScores[$dNum] ?? [];
            $dCount = count($dScores);
            $dMean = $dCount > 0 ? round(array_sum($dScores) / $dCount, 2) : 0.0;
            $dSd = 0.0;
            if ($dCount > 1) {
                $variance = 0.0;
                foreach ($dScores as $s) {
                    $variance += pow($s - $dMean, 2);
                }
                $dSd = round(sqrt($variance / ($dCount - 1)), 2);
            }
            $dPct = round(($dMean / 5.0) * 100, 1);
            $dLevel = $this->interpretLikert($dMean);

            $dimensionStats[$dNum] = [
                'dimension' => $dNum,
                'title' => $dimensionTitles[$dNum],
                'mean' => $dMean,
                'sd' => $dSd,
                'percentage' => $dPct,
                'level' => $dLevel,
            ];
        }

        // Chapter 1 Comparison Synthesis
        $dim3 = $dimensionStats[3] ?? null;
        $dim4 = $dimensionStats[4] ?? null;

        $chapter1Comparison = [
            'objectiveFulfillment' => [
                'title' => '1. การตอบโจทย์วัตถุประสงค์ของโครงการ (ดึงจากด้านที่ 3: Output / Objective)',
                'mean' => $dim3 ? $dim3['mean'] : 0.0,
                'sd' => $dim3 ? $dim3['sd'] : 0.0,
                'level' => $dim3 ? $dim3['level'] : 'ยังไม่มีข้อมูล',
                'summary' => $dim3 && $dim3['mean'] > 0
                    ? "โครงการบรรลุผลสำเร็จตามวัตถุประสงค์ในการให้ความรู้/พัฒนาทักษะ โดยมีผลการประเมินอยู่ในระดับ{$dim3['level']} (X̄ = {$dim3['mean']}, S.D. = {$dim3['sd']})"
                    : "อยู่ระหว่างการเก็บรวบรวมข้อมูลแบบประเมิน",
            ],
            'benefitRealization' => [
                'title' => '2. การตอบโจทย์ประโยชน์ที่คาดว่าจะได้รับ (ดึงจากด้านที่ 4: Outcome / Impact)',
                'mean' => $dim4 ? $dim4['mean'] : 0.0,
                'sd' => $dim4 ? $dim4['sd'] : 0.0,
                'level' => $dim4 ? $dim4['level'] : 'ยังไม่มีข้อมูล',
                'summary' => $dim4 && $dim4['mean'] > 0
                    ? "การประเมินด้านประโยชน์และการนำไปใช้ประโยชน์อยู่ในระดับ{$dim4['level']} (X̄ = {$dim4['mean']}, S.D. = {$dim4['sd']}) ยืนยันว่าโครงการส่งผลกระทบเชิงบวกและเกิดความคุ้มค่าตามประโยชน์ที่คาดว่าจะได้รับ"
                    : "อยู่ระหว่างการเก็บรวบรวมข้อมูลแบบประเมิน",
            ],
            'kpiAchievement' => [
                'title' => '3. การตอบโจทย์ตัวชี้วัดความสำเร็จ (KPIs) (เกณฑ์ความพึงพอใจภาพรวมไม่น้อยกว่าร้อยละ 80 หรือ X̄ ≥ 3.51)',
                'overallMean' => $overallMean,
                'overallPercentage' => $overallPercentage,
                'overallLevel' => $overallLevel,
                'isPassed' => ($overallMean >= 3.51),
                'benchmark' => 'ร้อยละ 80.0 (X̄ ≥ 3.51 ขึ้นไป)',
                'summary' => $overallMean >= 3.51
                    ? "คะแนนเฉลี่ยความพึงพอใจภาพรวมทั้งโครงการอยู่ที่ {$overallMean}/5.00 (ร้อยละ {$overallPercentage} ระดับ{$overallLevel}) ซึ่งสูงกว่าเกณฑ์ตัวชี้วัดขั้นต่ำ จึงถือว่า 'ผ่านเกณฑ์ตัวชี้วัดความสำเร็จ (KPI) ทุกประเด็น'"
                    : ($overallMean > 0
                        ? "คะแนนเฉลี่ยความพึงพอใจภาพรวมอยู่ที่ {$overallMean}/5.00 (ร้อยละ {$overallPercentage}) ซึ่งจำเป็นต้องเพิ่มประสิทธิภาพเพื่อบรรลุเกณฑ์ตัวชี้วัดเป้าหมาย"
                        : "อยู่ระหว่างการเก็บรวบรวมข้อมูลแบบประเมิน"),
            ],
        ];

        return [
            'totalResponses' => $totalResponses,
            'overallMean' => $overallMean,
            'overallSd' => $overallSd,
            'overallPercentage' => $overallPercentage,
            'overallLevel' => $overallLevel,
            'questionsStats' => $questionsStats,
            'dimensionStats' => $dimensionStats,
            'chapter1Comparison' => $chapter1Comparison,
            'demographicStats' => $this->computeDemographicStats($responses, $totalResponses),
        ];
    }

    /**
     * Compute demographic statistics for gender, education level, and respondent type.
     */
    private function computeDemographicStats($responses, int $totalResponses): array
    {
        $genderLabels = [
            'male' => 'ชาย',
            'female' => 'หญิง',
        ];

        $educationLabels = [
            'voc_cert' => 'ประกาศนียบัตรวิชาชีพ (ปวช.)',
            'high_voc_cert' => 'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)',
            'bachelor' => 'ปริญญาตรี (ป.ตรี)',
            'master' => 'ปริญญาโท (ป.โท)',
            'doctorate' => 'ปริญญาเอก (ป.เอก)',
            'other' => 'อื่นๆ',
        ];

        $respondentTypeLabels = [
            'student' => 'นักเรียน/นักศึกษา',
            'teacher' => 'ครู/อาจารย์',
            'staff' => 'บุคลากร/เจ้าหน้าที่',
            'public' => 'ประชาชน/ผู้ปกครอง',
        ];

        $genderCounts = ['male' => 0, 'female' => 0];
        $educationCounts = ['voc_cert' => 0, 'high_voc_cert' => 0, 'bachelor' => 0, 'master' => 0, 'doctorate' => 0, 'other' => 0];
        $respondentTypeCounts = ['student' => 0, 'teacher' => 0, 'staff' => 0, 'public' => 0];

        if ($responses) {
            foreach ($responses as $resp) {
                // Gender
                $g = $resp->gender;
                if ($g === 'female' || $g === 'หญิง') {
                    $genderCounts['female']++;
                } else {
                    $genderCounts['male']++;
                }

                // Education level
                $e = $resp->education_level;
                if ($e === 'voc_cert' || str_contains($e ?? '', 'ปวช')) {
                    $educationCounts['voc_cert']++;
                } elseif ($e === 'high_voc_cert' || str_contains($e ?? '', 'ปวส')) {
                    $educationCounts['high_voc_cert']++;
                } elseif ($e === 'bachelor' || str_contains($e ?? '', 'ตรี')) {
                    $educationCounts['bachelor']++;
                } elseif ($e === 'master' || str_contains($e ?? '', 'โท')) {
                    $educationCounts['master']++;
                } elseif ($e === 'doctorate' || str_contains($e ?? '', 'เอก')) {
                    $educationCounts['doctorate']++;
                } else {
                    $educationCounts['other']++;
                }

                // Respondent type
                $rt = $resp->respondent_type;
                if (isset($respondentTypeCounts[$rt])) {
                    $respondentTypeCounts[$rt]++;
                } else {
                    $respondentTypeCounts['student']++;
                }
            }
        }

        $formatGroup = function(array $counts, array $labels) use ($totalResponses) {
            $result = [];
            foreach ($counts as $k => $c) {
                $pct = $totalResponses > 0 ? round(($c / $totalResponses) * 100, 1) : 0.0;
                $result[] = [
                    'key' => $k,
                    'label' => $labels[$k] ?? $k,
                    'count' => $c,
                    'percentage' => $pct,
                ];
            }
            return $result;
        };

        return [
            'gender' => $formatGroup($genderCounts, $genderLabels),
            'education_level' => $formatGroup($educationCounts, $educationLabels),
            'respondent_type' => $formatGroup($respondentTypeCounts, $respondentTypeLabels),
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

