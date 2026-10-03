<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    /**
     * Generate ACT Recommendations from survey data using Gemini API.
     */
    public function generateRecommendations(int $totalResponses, array $averages, array $suggestions): string
    {
        // 1. Check Admin UI Setting first, then fallback to .env
        $apiKey = SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));

        // 2. Check if AI Gemini feature is enabled in system settings
        $aiEnabled = SystemSetting::get('enable_ai_recommendations', true);
        if (!$aiEnabled) {
            return $this->getDynamicFallback($totalResponses, $averages, $suggestions);
        }

        if (empty($apiKey)) {
            return $this->getDynamicFallback($totalResponses, $averages, $suggestions);
        }

        $prompt = $this->buildPrompt($totalResponses, $averages, $suggestions);

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json'
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['candidates'][0]['content']['parts'][0]['text'] ?? $this->getDynamicFallback($totalResponses, $averages, $suggestions);
            }

            Log::warning('Gemini API call failed, status code: ' . $response->status());
        } catch (\Exception $e) {
            Log::error('Gemini API connection error: ' . $e->getMessage());
        }

        return $this->getDynamicFallback($totalResponses, $averages, $suggestions);
    }

    /**
     * Build prompt for the Gemini API.
     */
    private function buildPrompt(int $totalResponses, array $averages, array $suggestions): string
    {
        $suggestionsList = empty($suggestions) ? 'None' : implode("\n- ", $suggestions);
        
        $dimDetails = '';
        if (!empty($averages['dimensionStats']) && is_array($averages['dimensionStats'])) {
            $dimDetails .= "\nEvaluation Results Across 4 Standard Dimensions:\n";
            foreach ($averages['dimensionStats'] as $dNum => $d) {
                $title = $d['title'] ?? "ด้านที่ {$dNum}";
                $mean = $d['mean'] ?? 0;
                $sd = $d['sd'] ?? 0;
                $level = $d['level'] ?? '';
                $pct = $d['percentage'] ?? 0;
                $dimDetails .= "- {$title}: Mean={$mean}/5.0, SD={$sd}, Percentage={$pct}%, Level={$level}\n";
            }
        }

        return "You are an educational quality assurance AI evaluator. Analyze the following project evaluation survey results and write a comprehensive, professional project improvement proposal focusing on corrective actions and 'ACT' phase adjustments for Nan Polytechnic College.

Survey Summary:
- Total respondents: {$totalResponses}
- Overall Satisfaction Mean: {$averages['overall']}/5.0 ({$averages['satisfaction_percentage']}%)
{$dimDetails}
Textual Feedback / Suggestions from Participants:
- {$suggestionsList}

Write the report in Thai. Include sections for:
1. การวิเคราะห์สรุปผลภาพรวมตามมิติ 4 ด้าน (Executive Summary & Dimension Analysis)
2. จุดแข็งที่ควรส่งเสริมและรักษามาตรฐาน (Strengths to Maintain)
3. ประเด็นที่ควรปรับปรุงเร่งด่วนในรอบ PDCA ถัดไป (Priority Areas for Improvement)
4. ข้อเสนอแนะเชิงรุกสำหรับการพัฒนาโครงการในรอบปีการศึกษาถัดไป (ACT Phase Recommendations)";
    }

    /**
     * Provide a highly detailed, dynamically tailored fallback response.
     */
    private function getDynamicFallback(int $totalResponses, array $averages, array $suggestions): string
    {
        $strengths = [];
        $improvements = [];

        $dimStats = $averages['dimensionStats'] ?? [];

        if (!empty($dimStats)) {
            $d1 = $dimStats[1] ?? null;
            $d2 = $dimStats[2] ?? null;
            $d3 = $dimStats[3] ?? null;
            $d4 = $dimStats[4] ?? null;

            if ($d1 && $d1['mean'] >= 4.0) $strengths[] = "ด้านกระบวนการและขั้นตอนการดำเนินงาน (เฉลี่ย {$d1['mean']}/5.00) มีการบริหารจัดการที่ดี กระบวนการกระชับและไม่ซับซ้อน";
            elseif ($d1 && $d1['mean'] < 3.8) $improvements[] = "ด้านกระบวนการ (เฉลี่ย {$d1['mean']}/5.00) ควรปรับปรุงการประชาสัมพันธ์ล่วงหน้า และจัดสรรช่วงเวลาจัดกิจกรรมให้กระชับเหมาะสมยิ่งขึ้น";

            if ($d2 && $d2['mean'] >= 4.0) $strengths[] = "ด้านปัจจัยนำเข้าและสิ่งอำนวยความสะดวก (เฉลี่ย {$d2['mean']}/5.00) มีความพร้อมด้านสถานที่ สื่อวัสดุอุปกรณ์ และการดูแลสวัสดิการอย่างดียิ่ง";
            elseif ($d2 && $d2['mean'] < 3.8) $improvements[] = "ด้านปัจจัยนำเข้า (เฉลี่ย {$d2['mean']}/5.00) ควรเพิ่มความพร้อมของเทคโนโลยี เอกสารประกอบ และตรวจสอบสถานที่ให้พร้อมก่อนเริ่มกิจกรรม";

            if ($d3 && $d3['mean'] >= 4.0) $strengths[] = "ด้านผลผลิตและวัตถุประสงค์โครงการ (เฉลี่ย {$d3['mean']}/5.00) บรรลุผลสัมฤทธิ์อย่างเป็นรูปธรรม ผู้เข้าร่วมได้รับความรู้และทักษะตามเป้าหมาย";
            elseif ($d3 && $d3['mean'] < 3.8) $improvements[] = "ด้านผลผลิตตามวัตถุประสงค์ (เฉลี่ย {$d3['mean']}/5.00) ควรเพิ่มสัดส่วนการฝึกปฏิบัติจริงเพื่อให้ผู้เรียนเกิดทักษะฝีมือตรงตามวัตถุประสงค์";

            if ($d4 && $d4['mean'] >= 4.0) $strengths[] = "ด้านประโยชน์และการนำไปใช้ (เฉลี่ย {$d4['mean']}/5.00) เกิดความคุ้มค่าสูง สามารถนำความรู้และประสบการณ์ไปประยุกต์ใช้ในการเรียนและการปฏิบัติงานได้จริง";
            elseif ($d4 && $d4['mean'] < 3.8) $improvements[] = "ด้านประโยชน์และการประยุกต์ใช้ (เฉลี่ย {$d4['mean']}/5.00) ควรส่งเสริมการนำผลงานไปต่อยอดสู่การใช้งานจริงหรือบูรณาการกับรายวิชา";
        } else {
            if (($averages['q1'] ?? 0) >= 4.0) $strengths[] = "ความสอดคล้องของโครงการกับวัตถุประสงค์อยู่ในเกณฑ์ดีเลิศ";
            if (($averages['q5'] ?? 0) >= 4.0) $strengths[] = "ผู้เข้าร่วมโครงการเห็นพ้องว่าโครงการนี้สามารถนำไปใช้งานได้จริงเป็นรูปธรรม";
            if (($averages['q2'] ?? 0) < 4.0) $improvements[] = "ควรปรับปรุงด้านการบริหารเวลาและระยะเวลาดำเนินกิจกรรม";
            if (($averages['q3'] ?? 0) < 4.0) $improvements[] = "ควรพัฒนาด้านการอำนวยความสะดวก ประสานงาน และสถานที่จัดงาน";
        }

        if (empty($strengths)) {
            $strengths[] = "โครงการสามารถดำเนินงานจนเสร็จสิ้นตามกรอบระยะเวลาที่กำหนด โดยได้รับความร่วมมือจากทุกฝ่าย";
        }
        if (empty($improvements)) {
            $improvements[] = "แนะนำให้คงประสิทธิภาพปัจจุบัน และเสริมการติดตามผลผู้เข้าร่วมโครงการระยะยาว (3 - 6 เดือน) เพื่อประเมินผลกระทบเชิงประจักษ์";
        }

        $improvementsText = implode("\n", array_map(fn($item) => "   - {$item}", $improvements));
        $strengthsText = implode("\n", array_map(fn($item) => "   - {$item}", $strengths));

        $suggestionsText = empty($suggestions) 
            ? "   - ไม่มีการระบุข้อเสนอแนะเพิ่มเติมจากผู้ประเมิน"
            : implode("\n", array_map(fn($item) => "   - \"{$item}\"", array_slice($suggestions, 0, 3)));

        return "### รายงานข้อเสนอแนะเพื่อการพัฒนาและปรับปรุงโครงการ (AI ACT Recommendations)
*(ระบบวิเคราะห์ข้อมูลอัตโนมัติ SMART FLOW - สังเคราะห์ผลการประเมิน 4 มิติ)*

**1. สรุปภาพรวมผลการประเมิน (Executive Summary)**
จากข้อมูลการตอบแบบประเมินทั้งหมด {$totalResponses} คน โครงการมีค่าเฉลี่ยความพึงพอใจภาพรวมอยู่ที่ {$averages['overall']}/5.00 คิดเป็นร้อยละ **{$averages['satisfaction_percentage']}%** อยู่ในระดับคุณภาพที่มีประสิทธิภาพสูงตามเกณฑ์มาตรฐาน

**2. จุดเด่นและข้อดีของโครงการ (Strengths to Maintain)**
{$strengthsText}

**3. ประเด็นที่ควรปรับปรุงและพัฒนาในรอบถัดไป (Corrective Actions & Improvements)**
{$improvementsText}

**4. สรุปข้อเสนอแนะจากผู้เข้าร่วมโครงการ (Stakeholder Voice)**
{$suggestionsText}

**5. แนวทางการปรับปรุงเชิงรุกสำหรับรอบปีการศึกษาถัดไป (ACT Phase Action Plan)**
- **ด้านการวางแผน (Plan)**: นำผลคะแนนเฉลี่ยด้านที่ได้รับคะแนนน้อยที่สุดไปเป็นโจทย์ตั้งต้นในการปรับปรุงกิจกรรมโครงการรอบถัดไป
- **ด้านการปฏิบัติ (Do)**: เน้นกระบวนการบูรณาการกับการเรียนการสอนจริงในแผนกวิชาเพื่อเสริมสร้างสมรรถนะผู้เรียนอย่างยั่งยืน
- **ด้านการรายงานผล (Check & Act)**: นำข้อเสนอแนะไปสังเคราะห์บรรจุในรายงานผลการดำเนินงาน บทที่ 5 อย่างเป็นรูปธรรม";
    }

    /**
     * Generate dynamic survey evaluation questions aligned with project objectives and indicators using Gemini API.
     */
    public function generateSurveyQuestions(\App\Models\Project $project): array
    {
        $apiKey = SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));
        $aiEnabled = SystemSetting::get('enable_ai_recommendations', true);

        if (!$aiEnabled || empty($apiKey)) {
            return $this->getFallbackSurveyQuestions($project);
        }

        $title = $project->title ?: 'โครงการ';
        
        // Extract objectives
        $rawObjectives = [];
        $ch1 = is_array($project->chapter_1_sections) ? $project->chapter_1_sections : [];
        if (!empty($ch1['objectives'])) {
            $rawObjectives = is_array($ch1['objectives']) ? $ch1['objectives'] : explode("\n", (string)$ch1['objectives']);
        } elseif (is_array($project->objectives)) {
            $rawObjectives = $project->objectives;
        } elseif (is_string($project->objectives)) {
            $rawObjectives = explode("\n", $project->objectives);
        }
        $objectives = [];
        foreach ($rawObjectives as $item) {
            $cleaned = trim(preg_replace('/^[๐-๙0-9.\s\-]+/u', '', (string)$item));
            if (!empty($cleaned)) {
                $objectives[] = $cleaned;
            }
        }

        // Extract indicators
        $indicators = [];
        $rawIndicators = $project->indicators;
        if (is_array($rawIndicators)) {
            if (!empty($rawIndicators['quantitative'])) {
                $q = is_array($rawIndicators['quantitative']) ? implode(', ', $rawIndicators['quantitative']) : (string)$rawIndicators['quantitative'];
                $indicators[] = "เชิงปริมาณ: {$q}";
            }
            if (!empty($rawIndicators['qualitative'])) {
                $ql = is_array($rawIndicators['qualitative']) ? implode(', ', $rawIndicators['qualitative']) : (string)$rawIndicators['qualitative'];
                $indicators[] = "เชิงคุณภาพ: {$ql}";
            }
            if (empty($indicators)) {
                foreach ($rawIndicators as $k => $v) {
                    if (is_string($v) && !empty($v)) $indicators[] = $v;
                }
            }
        } elseif (is_string($rawIndicators) && !empty($rawIndicators)) {
            $indicators[] = $rawIndicators;
        }

        $targetText = '';
        if (is_array($project->targets)) {
            $targetText = implode(', ', array_filter(array_map(fn($t) => is_string($t) ? $t : ($t['text'] ?? ($t['name'] ?? '')), $project->targets)));
        } elseif (is_string($project->targets)) {
            $targetText = $project->targets;
        }

        $objList = empty($objectives) ? '- เพื่อพัฒนาศักยภาพและทักษะวิชาชีพของผู้เข้าร่วมโครงการ' : '- ' . implode("\n- ", $objectives);
        $indList = empty($indicators) ? '- ร้อยละของผู้เข้าร่วมโครงการมีความพึงพอใจในระดับดีขึ้นไป' : '- ' . implode("\n- ", $indicators);

        $prompt = "คุณคือผู้เชี่ยวชาญด้านการประเมินผลโครงการทางการศึกษาและการประกันคุณภาพการศึกษาของสถานศึกษาอาชีวศึกษา
กรุณาสร้างข้อคำถามสำหรับแบบประเมินความพึงพอใจโครงการ (มาตราส่วนประมาณค่า 5 ระดับ Likert Scale: 5=มากที่สุด, 4=มาก, 3=ปานกลาง, 2=น้อย, 1=น้อยที่สุด/ปรับปรุง)
โดยข้อคำถามต้องมีความ 'สอดคล้องอย่างตรงจุดกับวัตถุประสงค์และตัวชี้วัดความสำเร็จของโครงการ' ที่กำหนดไว้นี้:

ชื่อโครงการ: {$title}
กลุ่มเป้าหมาย: {$targetText}

วัตถุประสงค์โครงการ:
{$objList}

ตัวชี้วัดความสำเร็จของโครงการ:
{$indList}

คำสั่ง:
1. สร้างข้อคำถามจำนวน 5 ถึง 6 ข้อคำถาม โดยครอบคลุม:
   - ด้านกระบวนการจัดกิจกรรมตามวัตถุประสงค์ (Process & Objectives)
   - ด้านเนื้อหาสาระและการถ่ายทอดความรู้ (Knowledge & Content)
   - ด้านสิ่งอำนวยความสะดวก ระยะเวลา และสถานที่ (Facilities & Timing)
   - ด้านประโยชน์และการบรรลุตามตัวชี้วัดความสำเร็จของโครงการ (Benefits & Indicators)
   - ด้านความพึงพอใจในภาพรวมต่อการจัดโครงการ (Overall Satisfaction)
2. ข้อความคำถามต้องใช้ภาษาไทยทางการ สุภาพ ชัดเจน เข้าใจง่าย วัดผลได้จริง
3. ตอบกลับในรูปแบบ JSON Array เท่านั้น โดยไม่ต้องมีข้อความเกริ่นนำหรือ markdown formatting อื่น ๆ นอกเหนือจาก JSON code block ดังนี้:
[
  {
    \"id\": 1,
    \"category\": \"ด้านกระบวนการจัดกิจกรรม (Process)\",
    \"question\": \"ข้อความคำถาม...\"
  }
]";

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json'
            ])->timeout(25)->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $rawText = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
                
                // Clean markdown code blocks
                $cleanJson = preg_replace('/^```(?:json)?\s*|\s*```$/ui', '', trim($rawText));
                $decoded = json_decode($cleanJson, true);

                if (is_array($decoded) && count($decoded) >= 3) {
                    $formatted = [];
                    $idx = 1;
                    foreach ($decoded as $item) {
                        if (!empty($item['question'])) {
                            $formatted[] = [
                                'id' => $idx,
                                'category' => $item['category'] ?? "ด้านที่ {$idx}",
                                'question' => trim($item['question']),
                            ];
                            $idx++;
                        }
                    }
                    if (count($formatted) >= 3) {
                        return $formatted;
                    }
                }
            }

            Log::warning('Gemini generateSurveyQuestions failed or returned non-JSON, status: ' . $response->status());
        } catch (\Exception $e) {
            Log::error('Gemini generateSurveyQuestions exception: ' . $e->getMessage());
        }

        return $this->getFallbackSurveyQuestions($project);
    }

    /**
     * Fallback survey questions directly synthesized from project objectives and indicators,
     * following the 4-dimension evaluation standard (15 questions).
     */
    public function getFallbackSurveyQuestions(\App\Models\Project $project): array
    {
        return $this->getStandard15PatternQuestions($project);
    }

    /**
     * Standard 15-question pattern across 4 dimensions connecting directly to Chapter 1 & Chapter 4:
     * ด้านที่ 1: ด้านกระบวนการและขั้นตอนการดำเนินงาน (Process / Plan & Do) [ข้อ 1-4]
     * ด้านที่ 2: ด้านปัจจัยนำเข้าและการอำนวยความสะดวก (Input) [ข้อ 5-8]
     * ด้านที่ 3: ด้านผลผลิตและผลลัพธ์โดยตรง (Output / Objective) [ข้อ 9-12]
     * ด้านที่ 4: ด้านประโยชน์และการนำไปใช้ประโยชน์ (Outcome / Impact) [ข้อ 13-15]
     */
    public function getStandard15PatternQuestions(\App\Models\Project $project): array
    {
        $title = $project->title ?: 'โครงการ';

        // Extract objectives
        $rawObjectives = [];
        $ch1 = is_array($project->chapter_1_sections) ? $project->chapter_1_sections : [];
        if (!empty($ch1['objectives'])) {
            $rawObjectives = is_array($ch1['objectives']) ? $ch1['objectives'] : explode("\n", (string)$ch1['objectives']);
        } elseif (is_array($project->objectives)) {
            $rawObjectives = $project->objectives;
        } elseif (is_string($project->objectives)) {
            $rawObjectives = explode("\n", $project->objectives);
        }
        $objectives = [];
        foreach ($rawObjectives as $item) {
            $cleaned = trim(preg_replace('/^[๐-๙0-9.\s\-]+/u', '', (string)$item));
            if (!empty($cleaned)) {
                $objectives[] = $cleaned;
            }
        }

        // Extract expected benefits
        $benefitText = '';
        if (!empty($ch1['benefits'])) {
            $benefitText = is_array($ch1['benefits']) ? implode(', ', $ch1['benefits']) : (string)$ch1['benefits'];
        } elseif (!empty($project->expected_benefits)) {
            $benefitText = is_array($project->expected_benefits) ? implode(', ', $project->expected_benefits) : (string)$project->expected_benefits;
        }
        $benefitClean = trim(preg_replace('/^[๐-๙0-9.\s\-]+/u', '', $benefitText));
        if (mb_strlen($benefitClean) > 60) {
            $benefitClean = mb_substr($benefitClean, 0, 60) . '...';
        }

        // Tailor objective questions
        $obj1Note = !empty($objectives[0]) ? " ({$objectives[0]})" : "";
        $obj2Note = !empty($objectives[1]) ? " ({$objectives[1]})" : (isset($objectives[0]) ? " ({$objectives[0]})" : "");

        return [
            // ด้านที่ 1: ด้านกระบวนการและขั้นตอนการดำเนินงาน (Process / Plan & Do)
            [
                'id' => 1,
                'dimension' => 1,
                'category' => 'ด้านที่ 1: ด้านกระบวนการและขั้นตอนการดำเนินงาน (Process / Plan & Do)',
                'question' => 'การประชาสัมพันธ์ข้อมูลข่าวสารของโครงการมีความทั่วถึงและรวดเร็ว',
            ],
            [
                'id' => 2,
                'dimension' => 1,
                'category' => 'ด้านที่ 1: ด้านกระบวนการและขั้นตอนการดำเนินงาน (Process / Plan & Do)',
                'question' => 'ขั้นตอนและกระบวนการจัดกิจกรรมมีความเหมาะสม ไม่ซับซ้อน',
            ],
            [
                'id' => 3,
                'dimension' => 1,
                'category' => 'ด้านที่ 1: ด้านกระบวนการและขั้นตอนการดำเนินงาน (Process / Plan & Do)',
                'question' => 'ระยะเวลาในการจัดกิจกรรมมีความเหมาะสม (ไม่สั้นหรือยาวจนเกินไป)',
            ],
            [
                'id' => 4,
                'dimension' => 1,
                'category' => 'ด้านที่ 1: ด้านกระบวนการและขั้นตอนการดำเนินงาน (Process / Plan & Do)',
                'question' => 'ลำดับขั้นตอนของกิจกรรมดำเนินไปอย่างต่อเนื่องและราบรื่น',
            ],

            // ด้านที่ 2: ด้านปัจจัยนำเข้าและการอำนวยความสะดวก (Input)
            [
                'id' => 5,
                'dimension' => 2,
                'category' => 'ด้านที่ 2: ด้านปัจจัยนำเข้าและการอำนวยความสะดวก (Input)',
                'question' => 'สถานที่จัดกิจกรรมมีความเหมาะสม สะอาด และเดินทางสะดวก (หรือระบบออนไลน์มีความเสถียร)',
            ],
            [
                'id' => 6,
                'dimension' => 2,
                'category' => 'ด้านที่ 2: ด้านปัจจัยนำเข้าและการอำนวยความสะดวก (Input)',
                'question' => 'สิ่งอำนวยความสะดวก อาหาร อาหารว่าง หรือวัสดุอุปกรณ์มีความพร้อมและเพียงพอ',
            ],
            [
                'id' => 7,
                'dimension' => 2,
                'category' => 'ด้านที่ 2: ด้านปัจจัยนำเข้าและการอำนวยความสะดวก (Input)',
                'question' => 'วิทยากร/ผู้ให้ความรู้ มีความเชี่ยวชาญ ถ่ายทอดเข้าใจง่าย และตอบคำถามได้ชัดเจน',
            ],
            [
                'id' => 8,
                'dimension' => 2,
                'category' => 'ด้านที่ 2: ด้านปัจจัยนำเข้าและการอำนวยความสะดวก (Input)',
                'question' => 'คณะทำงาน/เจ้าหน้าที่ ให้การต้อนรับ ดูแล และประสานงานอย่างสุภาพเรียบร้อย',
            ],

            // ด้านที่ 3: ด้านผลผลิตและผลลัพธ์โดยตรง (Output / Objective)
            [
                'id' => 9,
                'dimension' => 3,
                'category' => 'ด้านที่ 3: ด้านผลผลิตและผลลัพธ์โดยตรง (Output / Objective)',
                'question' => 'ผู้เข้าร่วมโครงการมีความรู้ ความเข้าใจในเนื้อหา/ประเด็นของโครงการเพิ่มมากขึ้น (เทียบกับก่อนร่วมงาน)' . $obj1Note,
            ],
            [
                'id' => 10,
                'dimension' => 3,
                'category' => 'ด้านที่ 3: ด้านผลผลิตและผลลัพธ์โดยตรง (Output / Objective)',
                'question' => 'ผู้เข้าร่วมโครงการได้รับทักษะ หรือแนวคิดใหม่ๆ ที่สามารถนำไปใช้ปฏิบัติได้จริง' . $obj2Note,
            ],
            [
                'id' => 11,
                'dimension' => 3,
                'category' => 'ด้านที่ 3: ด้านผลผลิตและผลลัพธ์โดยตรง (Output / Objective)',
                'question' => 'เนื้อหาของโครงการมีความสอดคล้องกับวัตถุประสงค์ที่กำหนดไว้',
            ],
            [
                'id' => 12,
                'dimension' => 3,
                'category' => 'ด้านที่ 3: ด้านผลผลิตและผลลัพธ์โดยตรง (Output / Objective)',
                'question' => 'ภาพรวมของกิจกรรมบรรลุเป้าหมายตามที่ท่านคาดหวังไว้',
            ],

            // ด้านที่ 4: ด้านประโยชน์และการนำไปใช้ประโยชน์ (Outcome / Impact)
            [
                'id' => 13,
                'dimension' => 4,
                'category' => 'ด้านที่ 4: ด้านประโยชน์และการนำไปใช้ประโยชน์ (Outcome / Impact)',
                'question' => 'ท่านสามารถนำความรู้/ประโยชน์จากโครงการนี้ไปประยุกต์ใช้ในการทำงานหรือชีวิตประจำวันได้',
            ],
            [
                'id' => 14,
                'dimension' => 4,
                'category' => 'ด้านที่ 4: ด้านประโยชน์และการนำไปใช้ประโยชน์ (Outcome / Impact)',
                'question' => !empty($benefitClean)
                    ? "โครงการนี้ช่วยแก้ปัญหา หรือพัฒนาหน่วยงาน/ชุมชน/ตัวท่านได้อย่างเป็นรูปธรรม ({$benefitClean})"
                    : 'โครงการนี้ช่วยแก้ปัญหา หรือพัฒนาหน่วยงาน/ชุมชน/ตัวท่านได้อย่างเป็นรูปธรรม',
            ],
            [
                'id' => 15,
                'dimension' => 4,
                'category' => 'ด้านที่ 4: ด้านประโยชน์และการนำไปใช้ประโยชน์ (Outcome / Impact)',
                'question' => 'โครงการนี้มีความสำคัญ ประโยชน์ และควรจะมีการจัดในครั้งต่อไป',
            ],
        ];
    }

    /**
     * Smart Budget Routing: Recommend optimal vocational funding source based on project details.
     */
    public function recommendFundingSource(string $title, string $objectives = '', array $items = [], ?float $budget = null): array
    {
        $apiKey = SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));
        $aiEnabled = SystemSetting::get('enable_ai_recommendations', true);

        $itemListStr = !empty($items) ? implode(', ', array_map(fn($i) => is_array($i) ? ($i['name'] ?? $i['description'] ?? '') : (string)$i, $items)) : 'ไม่ได้ระบุ';
        $budgetText = $budget ? number_format($budget, 2) . ' บาท' : 'ไม่ระบุวงเงิน';

        if ($aiEnabled && !empty($apiKey)) {
            $prompt = "คุณคือผู้เชี่ยวชาญด้านระบบการเงินและงบประมาณของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)
วิเคราะห์ข้อมูลโครงการและแนะนำ 'แหล่งเงินงบประมาณ' (Funding Source) ที่ถูกต้องตามระเบียบพัสดุและการเงิน สอศ.
ข้อมูลโครงการ:
- ชื่อโครงการ: {$title}
- วัตถุประสงค์: {$objectives}
- รายการวัสดุ/ครุภัณฑ์/กิจกรรม: {$itemListStr}
- วงเงินงบประมาณ: {$budgetText}

แหล่งเงินงบประมาณหลักของวิทยาลัยอาชีวศึกษา:
1. เงินอุดหนุนการจัดการเรียนการสอน (เงินอุดหนุนพัฒนาผู้เรียน / กิจกรรมพัฒนาคุณภาพผู้เรียน)
2. เงินบำรุงการศึกษา (หมวดค่าตอบแทน ใช้สอย และวัสดุ)
3. เงินรายได้สถานศึกษา
4. เงินงบประมาณแผ่นดิน (งบดำเนินงาน / งบลงทุน)
5. เงินบริจาค / กองทุนส่งเสริมการศึกษา

ตอบกลับเป็น JSON Object เท่านั้น:
{
  \"recommended_source\": \"ชื่อแหล่งเงินที่เหมาะสมที่สุด\",
  \"category\": \"หมวดรายจ่าย เช่น ค่าตอบแทนใช้สอยและวัสดุ หรือ ค่าครุภัณฑ์\",
  \"confidence\": 95,
  \"reasoning\": \"เหตุผลความสอดคล้องตามระเบียบอย่างกระชับ\",
  \"alternative_sources\": [\"แหล่งเงินทางเลือกที่ 1\", \"แหล่งเงินทางเลือกที่ 2\"],
  \"compliance_tips\": \"ข้อควรระวังหรือเงื่อนไขการเบิกจ่ายตามระเบียบ สอศ.\"
}";

            try {
                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->timeout(20)
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                        'contents' => [['parts' => [['text' => $prompt]]]]
                    ]);

                if ($response->successful()) {
                    $rawText = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $cleanJson = preg_replace('/^```(?:json)?\s*|\s*```$/ui', '', trim($rawText));
                    $decoded = json_decode($cleanJson, true);
                    if (is_array($decoded) && !empty($decoded['recommended_source'])) {
                        return $decoded;
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Gemini recommendFundingSource failed: ' . $e->getMessage());
            }
        }

        // Rule-based vocational education fallback
        $text = mb_strtolower($title . ' ' . $objectives . ' ' . $itemListStr);

        if (preg_match('/(คอมพิวเตอร์|เซิร์ฟเวอร์|เครื่องปรับอากาศ|ยานยนต์|เครื่องจักร|ครุภัณฑ์|ลิฟต์|อาคาร|ปรับปรุงห้อง)/ui', $text)) {
            return [
                'recommended_source' => 'เงินบำรุงการศึกษา (หมวดค่าครุภัณฑ์ ที่ดินและสิ่งก่อสร้าง)',
                'category' => 'งบลงทุน / ครุภัณฑ์',
                'confidence' => 90,
                'reasoning' => 'โครงการมีรายการจัดซื้อหรือปรับปรุงครุภัณฑ์/สิ่งก่อสร้าง จึงควรเบิกจ่ายจากงบหมวดค่าครุภัณฑ์ หรือเงินบำรุงการศึกษาที่มีรายการจัดซื้อรองรับ',
                'alternative_sources' => ['เงินงบประมาณแผ่นดิน (งบลงทุน)', 'เงินรายได้สถานศึกษา'],
                'compliance_tips' => 'ต้องจัดทำเอกสาร TOR และมีเกณฑ์เปรียบเทียบราคาตามระเบียบพัสดุภาครัฐ'
            ];
        }

        if (preg_match('/(นักเรียน|นักศึกษา|ผู้เรียน|ทักษะ|อบรม|ค่าย|ศึกษาดูงาน|ทัศนศึกษา|สิ่งประดิษฐ์|แข่งขันทักษะ|ลูกเสือ|คุณธรรม)/ui', $text)) {
            return [
                'recommended_source' => 'เงินอุดหนุนการจัดการเรียนการสอน (กิจกรรมพัฒนาคุณภาพผู้เรียน)',
                'category' => 'งบพัฒนาผู้เรียน (อุดหนุนรายหัว)',
                'confidence' => 92,
                'reasoning' => 'กิจกรรมมุ่งเน้นการพัฒนาทักษะวิชาชีพ คุณธรรม หรือศักยภาพผู้เรียนโดยตรง สอดคล้องกับระเบียบการใช้จ่ายเงินอุดหนุนรายหัวผู้เรียนของ สอศ.',
                'alternative_sources' => ['เงินบำรุงการศึกษา', 'เงินรายได้สถานศึกษา'],
                'compliance_tips' => 'ตรวจสอบว่าผู้เข้าร่วมเป็นนักเรียน/นักศึกษาที่มีสิทธิ์ และมีหลักฐานลายมือชื่อเข้าร่วมโครงการครบถ้วน'
            ];
        }

        return [
            'recommended_source' => 'เงินบำรุงการศึกษา (หมวดค่าตอบแทน ใช้สอยและวัสดุ)',
            'category' => 'งบดำเนินงาน',
            'confidence' => 85,
            'reasoning' => 'โครงการเป็นการดำเนินงานตามภารกิจปกติของแผนก/งาน สามารถเบิกจ่ายจากเงินบำรุงการศึกษาในหมวดค่าใช้สอยหรือวัสดุได้ตามความจำเป็น',
            'alternative_sources' => ['เงินรายได้สถานศึกษา', 'เงินอุดหนุนการจัดการเรียนการสอน'],
            'compliance_tips' => 'ควรมีเอกสารใบเสนอราคาหรือประมาณการค่าใช้จ่ายประกอบการเสนอขออนุมัติโครงการ'
        ];
    }

    /**
     * AI-Assisted TOR Studio: Draft government standard Terms of Reference (TOR) specifications.
     */
    public function draftTor(string $itemName, string $category = 'วัสดุ/ครุภัณฑ์', float $estimatedPrice = 0, array $requirements = []): array
    {
        $apiKey = SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));
        $aiEnabled = SystemSetting::get('enable_ai_recommendations', true);
        $reqStr = !empty($requirements) ? implode(', ', $requirements) : 'ตามมาตรฐานทางวิชาการและระเบียบพัสดุ';

        if ($aiEnabled && !empty($apiKey)) {
            $prompt = "คุณคือนักวิชาการพัสดุมืออาชีพและผู้เชี่ยวชาญด้านระเบียบการจัดซื้อจัดจ้างภาครัฐ (พ.ร.บ. การจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560)
ร่างขอบเขตของงานและรายละเอียดคุณลักษณะเฉพาะ (TOR) สำหรับ:
- รายการพัสดุ/งาน: {$itemName}
- หมวดหมู่: {$category}
- วงเงินงบประมาณโดยประมาณ: " . number_format($estimatedPrice, 2) . " บาท
- ความต้องการเบื้องต้น: {$reqStr}

ข้อกำหนดสำคัญ:
1. ห้ามระบุยี่ห้อสินค้า เว้นแต่มีคำว่า 'หรือเทียบเท่า' หรือ 'หรือมีคุณสมบัติดีกว่า' ตามระเบียบมาตรา 9
2. กำหนดเกณฑ์คุณลักษณะเฉพาะเชิงฟังก์ชันการใช้งานอย่างชัดเจน
3. ระบุระยะเวลารับประกันและการส่งมอบ

ส่งคืนรูปแบบ JSON Object เท่านั้น:
{
  \"title\": \"ขอบเขตของงานและรายละเอียดคุณลักษณะเฉพาะ {$itemName}\",
  \"purpose\": \"วัตถุประสงค์ของการจัดซื้อจัดจ้าง...\",
  \"qualifications\": [\"คุณสมบัติผู้ยื่นข้อเสนอข้อที่ 1\", \"คุณสมบัติผู้ยื่นข้อเสนอข้อที่ 2\"],
  \"specifications\": [
    {\"label\": \"คุณลักษณะทั่วไป\", \"details\": \"รายละเอียดคุณลักษณะ...\"},
    {\"label\": \"คุณลักษณะเฉพาะทางเทคนิค\", \"details\": \"รายละเอียดทางเทคนิค (ไม่ล็อกสเปก)...\"},
    {\"label\": \"มาตรฐานความปลอดภัยและการรับรอง\", \"details\": \"มี มอก. หรือมาตรฐานสากลรับรอง\"}
  ],
  \"warranty\": \"รับประกันการใช้งานไม่น้อยกว่า 1 ปี พร้อมบริการตรวจเช็ค\",
  \"delivery_days\": 30,
  \"testing_and_acceptance\": \"ตรวจรับโดยคณะกรรมการตรวจรับพัสดุ เมื่อทดสอบการใช้งานสมบูรณ์ 100%\"
}";

            try {
                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->timeout(25)
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                        'contents' => [['parts' => [['text' => $prompt]]]]
                    ]);

                if ($response->successful()) {
                    $rawText = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $cleanJson = preg_replace('/^```(?:json)?\s*|\s*```$/ui', '', trim($rawText));
                    $decoded = json_decode($cleanJson, true);
                    if (is_array($decoded) && !empty($decoded['title'])) {
                        return $decoded;
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Gemini draftTor failed: ' . $e->getMessage());
            }
        }

        // Rule-based fallback
        return [
            'title' => "ขอบเขตของงานและรายละเอียดคุณลักษณะเฉพาะ (TOR) {$itemName}",
            'purpose' => "เพื่อจัดหา {$itemName} สำหรับใช้ในการเรียนการสอนและฝึกทักษะวิชาชีพของนักศึกษาให้มีคุณภาพตามมาตรฐาน",
            'qualifications' => [
                'เป็นนิติบุคคลหรือบุคคลธรรมดาที่มีอาชีพขายหรือรับจ้างพัสดุตามประกาศนี้',
                'ไม่เป็นผู้ถูกระบุชื่อไว้ในบัญชีรายชื่อผู้ทิ้งงานของทางราชการ',
                'มีประวัติการให้บริการและพร้อมดูแลหลังการขายตามเงื่อนไขที่กำหนด'
            ],
            'specifications' => [
                [
                    'label' => 'คุณลักษณะทั่วไป',
                    'details' => "พัสดุ {$itemName} เป็นของใหม่ 100% ไม่เคยผ่านการใช้งานหรือการปรับสภาพมาก่อน มีความแข็งแรงทนทานตามมาตรฐานอุตสาหกรรม"
                ],
                [
                    'label' => 'คุณลักษณะทางเทคนิคและสมรรถนะ',
                    'details' => "มีความสามารถและประสิทธิภาพรองรับงานตามมาตรฐานการอาชีวศึกษา มีอุปกรณ์ประกอบการใช้งานครบชุดพร้อมใช้งานได้ทันที"
                ],
                [
                    'label' => 'คู่มือและการฝึกอบรม',
                    'details' => "มีคู่มือการใช้งานและบำรุงรักษาภาษาไทยหรือภาษาอังกฤษ พร้อมมีผู้เชี่ยวชาญสาธิตการใช้งานให้แก่บุคลากรผู้รับผิดชอบ"
                ]
            ],
            'warranty' => 'รับประกันคุณภาพและความชำรุดบกพร่องไม่น้อยกว่า 1 ปี นับถัดจากวันตรวจรับมอบพัสดุ',
            'delivery_days' => 30,
            'testing_and_acceptance' => 'คณะกรรมการตรวจรับพัสดุจะดำเนินการทดสอบระบบและการใช้งานจนถูกต้องครบถ้วนสมบูรณ์ก่อนลงนามตรวจรับ'
        ];
    }

    /**
     * AI Compliance Check: Verify TOR text against Government Anti-Lock-in Regulations.
     */
    public function checkTorCompliance(string $torText): array
    {
        $apiKey = SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));
        $aiEnabled = SystemSetting::get('enable_ai_recommendations', true);

        if ($aiEnabled && !empty($apiKey)) {
            $prompt = "คุณคือผู้ตรวจสอบพัสดุและนิติกรผู้เชี่ยวชาญด้านระเบียบการจัดซื้อจัดจ้างภาครัฐ (พ.ร.บ. การจัดซื้อจัดจ้างฯ พ.ศ. 2560 มาตรา 9)
ตรวจสอบข้อความข้อกำหนดพัสดุ (TOR) ด้านล่างว่ามีความเสี่ยงในการ 'ล็อกสเปก' (Restricted Specification) หรือขัดต่อระเบียบหรือไม่:

ข้อความ TOR:
\"\"\"
{$torText}
\"\"\"

เกณฑ์การตรวจสอบ:
1. มีการระบุชื่อยี่ห้อ ตราสินค้า หรือรุ่นเฉพาะเจาะจง โดยไม่มีคำว่า 'หรือเทียบเท่า' หรือไม่
2. มีการกำหนดขนาด มิติ หรือฟีเจอร์ที่เข้าข่ายมีผู้ผลิตเพียงรายเดียวในท้องตลาด (Exclusive Lock-in) หรือไม่
3. เงื่อนไขการรับประกันและระยะเวลาส่งมอบมีความเป็นธรรมและเปิดกว้างต่อการแข่งขันหรือไม่

ส่งคืนเป็น JSON Object เท่านั้น:
{
  \"compliance_status\": \"pass\" หรือ \"warning\" หรือ \"fail\",
  \"compliance_score\": 90,
  \"summary\": \"สรุปผลการตรวจสอบโดยรวมอย่างกระชับ\",
  \"identified_risks\": [\"ข้อสังเกตจุดที่ 1\", \"ข้อสังเกตจุดที่ 2\"],
  \"suggested_revisions\": [\"ข้อเสนอแนะในการปรับปรุงข้อความให้รัดกุม\"]
}";

            try {
                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->timeout(25)
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                        'contents' => [['parts' => [['text' => $prompt]]]]
                    ]);

                if ($response->successful()) {
                    $rawText = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $cleanJson = preg_replace('/^```(?:json)?\s*|\s*```$/ui', '', trim($rawText));
                    $decoded = json_decode($cleanJson, true);
                    if (is_array($decoded) && isset($decoded['compliance_status'])) {
                        return $decoded;
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Gemini checkTorCompliance failed: ' . $e->getMessage());
            }
        }

        // Rule-based fallback check
        $risks = [];
        $suggestions = [];
        $score = 95;
        $status = 'pass';

        // Check common brand names without 'หรือเทียบเท่า'
        $brands = ['apple', 'intel', 'microsoft', 'dell', 'hp', 'cisco', 'sony', 'canon', 'toyota', 'honda', 'samsung'];
        foreach ($brands as $brand) {
            if (stripos($torText, $brand) !== false && stripos($torText, 'หรือเทียบเท่า') === false) {
                $risks[] = "พบการระบุชื่อยี่ห้อ '{$brand}' โดยไม่มีข้อความ 'หรือเทียบเท่า' กำกับ ซึ่งอาจเข้าข่ายฝ่าฝืนมาตรา 9 แห่ง พ.ร.บ. การจัดซื้อจัดจ้างฯ 2560";
                $suggestions[] = "เติมข้อความ 'หรือเทียบเท่า หรือมีคุณสมบัติดีกว่า' ต่อท้ายการระบุยี่ห้อ หรือเปลี่ยนไปใช้คุณลักษณะทางเทคนิคเชิงสมรรถนะแทน";
                $score -= 20;
            }
        }

        if (mb_strlen(trim($torText)) < 30) {
            $risks[] = "ข้อความรายละเอียดสเปกสั้นเกินไป อาจทำให้ขาดความชัดเจนในการตรวจรับพัสดุ";
            $suggestions[] = "เพิ่มรายละเอียดคุณลักษณะทางเทคนิคและเงื่อนไขการรับประกันให้ครอบคลุม";
            $score -= 15;
        }

        if ($score < 70) {
            $status = 'fail';
        } elseif ($score < 90) {
            $status = 'warning';
        }

        return [
            'compliance_status' => $status,
            'compliance_score' => max(0, $score),
            'summary' => $status === 'pass'
                ? 'สเปกมีความเป็นกลาง สอดคล้องกับระเบียบจัดซื้อจัดจ้างภาครัฐ ไม่พบความเสี่ยงการล็อกสเปกที่ชัดเจน'
                : 'พบประเด็นความเสี่ยงที่อาจเข้าข่ายการกำหนดคุณลักษณะเฉพาะเจาะจง แนะนำให้ปรับปรุงตามข้อเสนอแนะ',
            'identified_risks' => $risks,
            'suggested_revisions' => $suggestions,
        ];
    }

    /**
     * AI Survey Analytics: Sentiment Analysis & Qualitative Clustering of Participant Feedback.
     */
    public function analyzeSurveySentiment(array $suggestions, array $ratings = []): array
    {
        $apiKey = SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));
        $aiEnabled = SystemSetting::get('enable_ai_recommendations', true);

        $validSuggestions = array_values(array_filter($suggestions, fn($s) => !empty(trim((string)$s))));

        if ($aiEnabled && !empty($apiKey) && !empty($validSuggestions)) {
            $textList = implode("\n- ", array_slice($validSuggestions, 0, 40));
            $prompt = "คุณคือนักวิจัยและผู้เชี่ยวชาญด้านการวิเคราะห์ความรู้สึก (Sentiment Analysis) และการประเมินโครงการทางการศึกษา
วิเคราะห์ข้อคิดเห็นและข้อเสนอแนะของผู้เข้าร่วมโครงการด้านล่าง:
- ข้อคิดเห็น:
- {$textList}

วิเคราะห์และตอบกลับในรูปแบบ JSON Object:
{
  \"sentiment_distribution\": {
    \"positive_pct\": 75,
    \"neutral_pct\": 15,
    \"negative_pct\": 10
  },
  \"key_themes\": [
    {\"theme\": \"ความพึงพอใจด้านเนื้อหา/วิทยากร\", \"sentiment\": \"positive\", \"count\": 12, \"sample\": \"วิทยากรถ่ายทอดได้เข้าใจง่ายมาก\"},
    {\"theme\": \"การบริหารเวลาและสถานที่\", \"sentiment\": \"suggestion\", \"count\": 5, \"sample\": \"อยากให้เพิ่มเวลาในการฝึกปฏิบัติ\"}
  ],
  \"executive_summary\": \"สรุปข้อคิดเห็นเชิงคุณภาพสำหรับใส่ในรายงานการประเมินโครงการ บทที่ 4 และบทที่ 5...\",
  \"actionable_recommendations\": [\"ข้อเสนอแนะเชิงรุกข้อที่ 1\", \"ข้อเสนอแนะเชิงรุกข้อที่ 2\"]
}";

            try {
                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->timeout(25)
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                        'contents' => [['parts' => [['text' => $prompt]]]]
                    ]);

                if ($response->successful()) {
                    $rawText = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $cleanJson = preg_replace('/^```(?:json)?\s*|\s*```$/ui', '', trim($rawText));
                    $decoded = json_decode($cleanJson, true);
                    if (is_array($decoded) && isset($decoded['sentiment_distribution'])) {
                        return $decoded;
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Gemini analyzeSurveySentiment failed: ' . $e->getMessage());
            }
        }

        // Rule-based sentiment analysis fallback
        $total = count($validSuggestions);
        if ($total === 0) {
            return [
                'sentiment_distribution' => ['positive_pct' => 100, 'neutral_pct' => 0, 'negative_pct' => 0],
                'key_themes' => [],
                'executive_summary' => 'ยังไม่มีข้อคิดเห็นเพิ่มเติมจากผู้ตอบแบบสอบถามในระบบ',
                'actionable_recommendations' => ['เปิดช่องทางรับฟังความคิดเห็นเพิ่มเติมจากกลุ่มเป้าหมายในกิจกรรมครั้งถัดไป']
            ];
        }

        $posCount = 0;
        $sugCount = 0;
        $neuCount = 0;

        foreach ($validSuggestions as $text) {
            if (preg_match('/(ดี|ยอดเยี่ยม|ชอบ|ประทับใจ|มีประโยชน์|เข้าใจง่าย|คุ้มค่า|ขอบคุณ)/ui', $text)) {
                $posCount++;
            } elseif (preg_match('/(ควร|อยากให้|ปรับปรุง|เพิ่ม|ช้า|ไม่พอ|น้อย|ติดขัด|แก้ไข)/ui', $text)) {
                $sugCount++;
            } else {
                $neuCount++;
            }
        }

        $posPct = round(($posCount / $total) * 100);
        $sugPct = round(($sugCount / $total) * 100);
        $neuPct = max(0, 100 - $posPct - $sugPct);

        return [
            'sentiment_distribution' => [
                'positive_pct' => $posPct,
                'neutral_pct' => $neuPct,
                'negative_pct' => $sugPct,
            ],
            'key_themes' => [
                [
                    'theme' => 'ความพึงพอใจต่อผลสัมฤทธิ์และกิจกรรม',
                    'sentiment' => 'positive',
                    'count' => $posCount,
                    'sample' => $validSuggestions[0] ?? 'กิจกรรมมีประโยชน์และสามารถนำไปใช้ได้จริง'
                ],
                [
                    'theme' => 'ข้อเสนอแนะในการต่อยอดและพัฒนา',
                    'sentiment' => 'suggestion',
                    'count' => $sugCount,
                    'sample' => 'เสนอให้จัดกิจกรรมต่อเนื่องและเพิ่มระยะเวลาปฏิบัติงานจริง'
                ]
            ],
            'executive_summary' => "จากการวิเคราะห์ข้อคิดเห็นเชิงคุณภาพของผู้ตอบแบบสอบถามจำนวน {$total} ข้อความ พบว่าผู้เข้าร่วมโครงการส่วนใหญ่มีความรู้สึกเชิงบวกในสัดส่วนร้อยละ {$posPct}% สะท้อนความพึงพอใจในกระบวนการจัดกิจกรรมและเนื้อหาที่ได้รับ โดยมีข้อเสนอแนะเชิงพัฒนาคิดเป็นร้อยละ {$sugPct}% ซึ่งมุ่งเน้นการต่อยอดระยะเวลาจัดกิจกรรมและการนำไปประยุกต์ใช้ในการปฏิบัติงานจริง",
            'actionable_recommendations' => [
                'นำผลการประเมินเชิงบวกเป็นแนวทางในการรักษามาตรฐานกระบวนการดำเนินงาน',
                'บูรณาการข้อเสนอแนะเชิงพัฒนาเข้าสู่การวางแผนโครงการในรอบปีการศึกษาถัดไปตามวงจร PDCA'
            ]
        ];
    }

    /**
     * AI-Assisted Personnel Workload Analysis for Fair Distribution.
     */
    public function analyzePersonnelWorkload(array $personnelData): array
    {
        $apiKey = SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));
        $aiEnabled = SystemSetting::get('enable_ai_recommendations', true);

        if (!$aiEnabled || empty($apiKey) || empty($personnelData)) {
            return $this->getDynamicWorkloadFallback($personnelData);
        }

        $prompt = "คุณคือผู้เชี่ยวชาญด้านการบริหารทรัพยากรบุคคลและการจัดองค์กรของสถาบันอาชีวศึกษา (สอศ.)\n" .
            "จงวิเคราะห์ภาระงาน (Workload Analysis) ของบุคลากรต่อไปนี้ เพื่อช่วยผู้บริหารประเมินการกระจายงานอย่างเป็นธรรม ป้องกันปัญหาคอขวด (Bottlenecks) และภาวะหมดไฟ (Burnout):\n\n" .
            json_encode(array_slice($personnelData, 0, 30), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n\n" .
            "ตอบกลับเป็น JSON เท่านั้น รูปแบบ:\n" .
            "{\n" .
            "  \"workload_balance_score\": 82,\n" .
            "  \"executive_summary\": \"สรุปภาพรวมภาระงานของบุคลากรในสถานศึกษา...\",\n" .
            "  \"high_workload_alerts\": [\n" .
            "    {\"name\": \"ชื่อ\", \"reason\": \"เหตุผลที่ภาระงานหนาแน่น\", \"recommendation\": \"ข้อแนะนำการปรับลด\"}\n" .
            "  ],\n" .
            "  \"balanced_capacity_personnel\": [\n" .
            "    {\"name\": \"ชื่อ\", \"status\": \"ภาระงานสมดุล/สามารถรับงานส่งเสริมเพิ่มได้\"}\n" .
            "  ],\n" .
            "  \"fairness_recommendations\": [\n" .
            "    \"ข้อเสนอแนะเชิงนโยบายเพื่อกระจายงานอย่างเป็นธรรมตามสมรรถนะ\"\n" .
            "  ]\n" .
            "}";

        try {
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                    'contents' => [['parts' => [['text' => $prompt]]]]
                ]);

            if ($response->successful()) {
                $rawText = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? '';
                if (preg_match('/\{[\s\S]*\}/', $rawText, $matches)) {
                    $json = json_decode($matches[0], true);
                    if ($json && isset($json['executive_summary'])) {
                        return $json;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Gemini Workload Analysis Error: ' . $e->getMessage());
        }

        return $this->getDynamicWorkloadFallback($personnelData);
    }

    private function getDynamicWorkloadFallback(array $personnelData): array
    {
        $highLoad = [];
        $balanced = [];

        foreach ($personnelData as $p) {
            $score = ($p['positions_count'] ?? 1) * 2 + ($p['active_project_count'] ?? 0) * 3;
            if ($score >= 8) {
                $highLoad[] = [
                    'name' => $p['name'] ?? 'ไม่ระบุ',
                    'reason' => "รับผิดชอบหลายหน้าที่ (" . ($p['positions_count'] ?? 1) . " บทบาท) และขับเคลื่อนโครงการ " . ($p['active_project_count'] ?? 0) . " โครงการ",
                    'recommendation' => 'ควรพิจารณาแต่งตั้งผู้ช่วยผู้ประสานงาน หรือมอบหมายโครงการบางส่วนให้เพื่อนร่วมงานในฝ่าย'
                ];
            } else {
                $balanced[] = [
                    'name' => $p['name'] ?? 'ไม่ระบุ',
                    'status' => 'ภาระงานอยู่ในเกณฑ์มาตรฐาน มีศักยภาพร่วมเป็นกรรมการหรือผู้ขับเคลื่อนกิจกรรมเพิ่มได้'
                ];
            }
        }

        return [
            'workload_balance_score' => $balanceScore,
            'executive_summary' => "จากการประเมินภาระงานของบุคลากรจำนวน " . count($personnelData) . " ท่าน พบว่าดัชนีการกระจายงานเฉลี่ยอยู่ที่ " . $balanceScore . "/100 โดยมีบุคลากรที่มีบทบาทหน้าที่ซ้อนทับและมีโครงการในความรับผิดชอบสูงจำนวน " . count($highLoad) . " ท่าน ที่ควรได้รับการเกลี่ยภาระงาน และมีบุคลากรจำนวน " . count($balanced) . " ท่านที่มีศักยภาพพร้อมสนับสนุนโครงการเพิ่มเติม",
            'high_workload_alerts' => array_slice($highLoad, 0, 5),
            'balanced_capacity_personnel' => array_slice($balanced, 0, 5),
            'fairness_recommendations' => [
                'กระจายบทบาทกรรมการจัดซื้อจัดจ้างและตรวจรับพัสดุให้ครอบคลุมบุคลากรทุกท่าน เพื่อป้องกันคอขวดที่ครูท่านเดิม',
                'ส่งเสริมระบบพี่เลี้ยง (Mentorship) ให้ครูรุ่นใหม่ร่วมรับผิดชอบโครงการคู่กับครูผู้มีประสบการณ์',
                'ใช้ระบบ SmartFlow ในการตรวจสอบจำนวนโครงการค้างคาของผู้เสนอก่อนอนุมัติโครงการใหม่'
            ]
        ];
    }

    /**
     * AI Auto-Mapping Strategies based on project title, rationale, and objectives.
     */
    public function mapStrategies(string $title, string $rationale, array $objectives, array $availableCategories, array $iqaList = [], array $ovecList = []): array
    {
        $apiKey = SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));
        $aiEnabled = SystemSetting::get('enable_ai_recommendations', true);

        if ($aiEnabled && !empty($apiKey)) {
            $catSummary = [];
            foreach ($availableCategories as $cat) {
                $items = [];
                foreach ($cat['items'] ?? [] as $it) {
                    $items[] = ['id' => $it['id'], 'name' => $it['name'], 'category_id' => $cat['id'], 'category_name' => $cat['name']];
                }
                $catSummary[] = ['category_id' => $cat['id'], 'category_name' => $cat['name'], 'items' => $items];
            }

            $prompt = "คุณคือผู้เชี่ยวชาญด้านงานแผนงานและการประกันคุณภาพการศึกษาของสถานศึกษาสังกัด สอศ.\n"
                . "ภารกิจ: วิเคราะห์ 'ชื่อโครงการ', 'หลักการและเหตุผล', และ 'วัตถุประสงค์' ต่อไปนี้ แล้วเลือกยุทธศาสตร์/มาตรฐานที่สอดคล้องที่สุดจากรายการที่กำหนดให้ โดยคัดเลือกเฉพาะข้อที่ตรงกับเป้าหมายโครงการจริง 2-5 ข้อ\n\n"
                . "ข้อมูลโครงการ:\n"
                . "- ชื่อโครงการ: {$title}\n"
                . "- หลักการและเหตุผล: {$rationale}\n"
                . "- วัตถุประสงค์: " . implode('; ', $objectives) . "\n\n"
                . "รายการยุทธศาสตร์ที่มีในระบบ (JSON):\n"
                . json_encode($catSummary, JSON_UNESCAPED_UNICODE) . "\n\n"
                . "ยุทธศาสตร์ IQA: " . json_encode($iqaList, JSON_UNESCAPED_UNICODE) . "\n"
                . "ยุทธศาสตร์ สอศ. (OVEC): " . json_encode($ovecList, JSON_UNESCAPED_UNICODE) . "\n\n"
                . "ตอบกลับเป็น JSON เท่านั้นในรูปแบบ:\n"
                . "{\n"
                . "  \"category_selections\": { \"[category_id]\": [item_ids] },\n"
                . "  \"iqa_strategy_ids\": [ids],\n"
                . "  \"ovec_strategy_ids\": [ids],\n"
                . "  \"matched_reasons\": [\n"
                . "     { \"name\": \"ชื่อยุทธศาสตร์\", \"reason\": \"เหตุผลสั้นๆ ที่สอดคล้อง\" }\n"
                . "  ],\n"
                . "  \"summary\": \"สรุปภาพรวมความสอดคล้อง 1-2 บรรทัด\"\n"
                . "}";

            try {
                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->timeout(15)
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                        'contents' => [['parts' => [['text' => $prompt]]]]
                    ]);

                if ($response->successful()) {
                    $text = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $clean = preg_replace('/```(?:json)?\s*([\s\S]*?)\s*```/', '$1', trim($text));
                    $decoded = json_decode($clean, true);
                    if ($decoded && is_array($decoded)) {
                        return [
                            'category_selections' => $decoded['category_selections'] ?? [],
                            'iqa_strategy_ids' => $decoded['iqa_strategy_ids'] ?? [],
                            'ovec_strategy_ids' => $decoded['ovec_strategy_ids'] ?? [],
                            'matched_reasons' => $decoded['matched_reasons'] ?? [],
                            'summary' => $decoded['summary'] ?? 'วิเคราะห์ความสอดคล้องเชิงยุทธศาสตร์เรียบร้อย'
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Gemini Strategy Mapping Error: ' . $e->getMessage());
            }
        }

        // Fallback: Keyword heuristic matching
        return $this->fallbackStrategyMapping($title, $rationale, $objectives, $availableCategories, $iqaList, $ovecList);
    }

    private function fallbackStrategyMapping(string $title, string $rationale, array $objectives, array $categories, array $iqaList, array $ovecList): array
    {
        $text = mb_strtolower($title . ' ' . $rationale . ' ' . implode(' ', $objectives));
        $catSelections = [];
        $matchedReasons = [];

        foreach ($categories as $cat) {
            $catId = $cat['id'];
            $selectedItems = [];
            foreach ($cat['items'] ?? [] as $item) {
                $itemName = mb_strtolower($item['name'] ?? '');
                // Check common keywords
                $keywords = array_filter(explode(' ', str_replace(['การ', 'ความ', 'ที่', 'และ', 'ของ'], ' ', $itemName)));
                $hit = false;
                foreach ($keywords as $kw) {
                    if (mb_strlen(trim($kw)) >= 3 && str_contains($text, trim($kw))) {
                        $hit = true;
                        break;
                    }
                }
                if ($hit && count($selectedItems) < 2) {
                    $selectedItems[] = $item['id'];
                    $matchedReasons[] = [
                        'name' => $item['name'],
                        'reason' => 'สอดคล้องกับคำสำคัญและเป้าหมายโครงการ'
                    ];
                }
            }
            if (!empty($selectedItems)) {
                $catSelections[$catId] = $selectedItems;
            }
        }

        // Default pick first item of first category if none matched
        if (empty($catSelections) && !empty($categories[0]['items'][0])) {
            $firstCat = $categories[0];
            $catSelections[$firstCat['id']] = [$firstCat['items'][0]['id']];
            $matchedReasons[] = [
                'name' => $firstCat['items'][0]['name'],
                'reason' => 'สอดคล้องกับยุทธศาสตร์สถานศึกษาเบื้องต้น'
            ];
        }

        $iqaIds = !empty($iqaList) ? [$iqaList[0]['id']] : [];
        $ovecIds = !empty($ovecList) ? [$ovecList[0]['id']] : [];

        return [
            'category_selections' => $catSelections,
            'iqa_strategy_ids' => $iqaIds,
            'ovec_strategy_ids' => $ovecIds,
            'matched_reasons' => $matchedReasons,
            'summary' => 'แนะนำยุทธศาสตร์ที่สอดคล้องกับเนื้อหาโครงการเบื้องต้น ' . count($matchedReasons) . ' รายการ'
        ];
    }

    /**
     * AI Duplicate Detection (ตรวจจับโครงการซ้ำซ้อน).
     */
    public function detectProjectDuplicates(string $title, string $rationale, array $objectives, array $existingProjects): array
    {
        $apiKey = SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));
        $aiEnabled = SystemSetting::get('enable_ai_recommendations', true);

        if (empty($existingProjects)) {
            return [
                'has_duplicate' => false,
                'similarity_score' => 0,
                'risk_level' => 'none',
                'matched_project' => null,
                'analysis' => 'ไม่พบโครงการเดิมในระบบที่นำมาเปรียบเทียบ',
                'recommendation' => 'สามารถเสนอโครงการได้ตามปกติ'
            ];
        }

        // Limit candidates to 30 most recent projects to save context
        $candidates = array_slice($existingProjects, 0, 30);

        if ($aiEnabled && !empty($apiKey)) {
            $prompt = "คุณคือประธานคณะกรรมการกลั่นกรองงบประมาณสถานศึกษา (สอศ.)\n"
                . "ภารกิจ: เปรียบเทียบโครงการที่เสนอขอใหม่กับฐานข้อมูลโครงการที่เคยได้รับการจัดสรรงบประมาณแล้วว่า 'มีความซ้ำซ้อนเชิงความหมาย (Semantic Duplicate)' ในแง่ของเนื้อหา กลุ่มเป้าหมาย หรือการจัดซื้อจัดจ้างซ้ำซ้อนหรือไม่\n\n"
                . "โครงการที่เสนอใหม่:\n"
                . "- ชื่อ: {$title}\n"
                . "- เหตุผล: {$rationale}\n"
                . "- วัตถุประสงค์: " . implode('; ', $objectives) . "\n\n"
                . "รายการโครงการที่มีอยู่เดิม (JSON):\n"
                . json_encode($candidates, JSON_UNESCAPED_UNICODE) . "\n\n"
                . "ตอบกลับเป็น JSON เท่านั้นในรูปแบบ:\n"
                . "{\n"
                . "  \"has_duplicate\": true/false,\n"
                . "  \"similarity_score\": 0-100,\n"
                . "  \"risk_level\": \"none\" | \"low\" | \"medium\" | \"high\",\n"
                . "  \"matched_project_id\": null หรือ id ของโครงการที่ใกล้เคียงที่สุด,\n"
                . "  \"matched_project_title\": \"ชื่อโครงการเดิมที่คล้ายคลึง\",\n"
                . "  \"analysis\": \"วิเคราะห์จุดที่เหมือนหรือแตกต่างกัน 1-2 ย่อหน้า\",\n"
                . "  \"recommendation\": \"คำแนะนำสำหรับคณะกรรมการและผู้เสนอโครงการ (เช่น ให้บูรณาการรวมกัน หรือให้ปรับขอบเขตงานให้ชัดเจน)\"\n"
                . "}";

            try {
                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->timeout(15)
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                        'contents' => [['parts' => [['text' => $prompt]]]]
                    ]);

                if ($response->successful()) {
                    $text = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $clean = preg_replace('/```(?:json)?\s*([\s\S]*?)\s*```/', '$1', trim($text));
                    $decoded = json_decode($clean, true);
                    if ($decoded && is_array($decoded)) {
                        return [
                            'has_duplicate' => (bool)($decoded['has_duplicate'] ?? false),
                            'similarity_score' => (int)($decoded['similarity_score'] ?? 0),
                            'risk_level' => $decoded['risk_level'] ?? 'none',
                            'matched_project_id' => $decoded['matched_project_id'] ?? null,
                            'matched_project_title' => $decoded['matched_project_title'] ?? '',
                            'analysis' => $decoded['analysis'] ?? 'วิเคราะห์ความซ้ำซ้อนเรียบร้อย',
                            'recommendation' => $decoded['recommendation'] ?? 'พิจารณาดำเนินการตามดุลยพินิจ'
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Gemini Duplicate Detection Error: ' . $e->getMessage());
            }
        }

        // Fallback: Text similarity comparison
        $highestSim = 0;
        $bestMatch = null;
        $targetTitle = mb_strtolower(trim($title));

        foreach ($candidates as $cand) {
            $candTitle = mb_strtolower(trim($cand['title'] ?? ''));
            similar_text($targetTitle, $candTitle, $percent);
            if ($percent > $highestSim) {
                $highestSim = $percent;
                $bestMatch = $cand;
            }
        }

        $highestSimInt = (int)round($highestSim);
        $hasDup = $highestSimInt >= 60;
        $risk = $highestSimInt >= 80 ? 'high' : ($highestSimInt >= 50 ? 'medium' : ($highestSimInt >= 30 ? 'low' : 'none'));

        return [
            'has_duplicate' => $hasDup,
            'similarity_score' => $highestSimInt,
            'risk_level' => $risk,
            'matched_project_id' => $bestMatch ? $bestMatch['id'] : null,
            'matched_project_title' => $bestMatch ? $bestMatch['title'] : '',
            'analysis' => $hasDup 
                ? "พบโครงการ '{$bestMatch['title']}' ของ {$bestMatch['department_name']} ที่มีชื่อหรือลักษณะคล้ายกัน (ความคล้ายคลึง {$highestSimInt}%)"
                : "ไม่พบโครงการที่มีความซ้ำซ้อนอย่างมีนัยสำคัญในฐานข้อมูล (ความคล้ายคลึงสูงสุด {$highestSimInt}%)",
            'recommendation' => $hasDup
                ? "คณะกรรมการควรตรวจสอบขอบเขตกิจกรรมและกลุ่มเป้าหมายกับ {$bestMatch['department_name']} เพื่อป้องกันการเบิกจ่ายงบประมาณซ้ำซ้อน"
                : "โครงการมีความเป็นเอกเทศ สามารถดำเนินการเสนอของบประมาณตามขั้นตอนได้"
        ];
    }

    /**
     * AI Consistency Auditor: Evaluates alignment between Objectives, 4D KPIs, Action Plan, and Budget itemization.
     */
    public function auditProjectConsistency(array $projectData): array
    {
        $title = $projectData['title'] ?? 'โครงการ';
        $objectives = (array)($projectData['objectives'] ?? []);
        $indicators = (array)($projectData['indicators'] ?? []);
        $actionPlan = (array)($projectData['action_plan'] ?? []);
        $activities = (array)($projectData['activities'] ?? []);
        $targets = (array)($projectData['targets'] ?? []);
        $allocatedBudget = (float)($projectData['allocated_budget'] ?? 0);

        $apiKey = SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));
        $aiEnabled = SystemSetting::get('enable_ai_features', true) || SystemSetting::get('enable_ai_recommendations', true);

        if ($aiEnabled && !empty($apiKey)) {
            try {
                $prompt = "คุณคือผู้เชี่ยวชาญการตรวจสอบและประเมินคุณภาพข้อเสนอโครงการ (Project Proposal Auditor) ของสถานศึกษา สังกัดสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)\n"
                    . "จงวิเคราะห์ความสอดคล้องเชิงตรรกะ (Consistency & Logical Alignment) ของข้อเสนอโครงการนี้:\n"
                    . "- ชื่อโครงการ: {$title}\n"
                    . "- วัตถุประสงค์: " . json_encode($objectives, JSON_UNESCAPED_UNICODE) . "\n"
                    . "- ตัวชี้วัด 4 มิติ (ปริมาณ, คุณภาพ, เวลา, ค่าใช้จ่าย): " . json_encode($indicators, JSON_UNESCAPED_UNICODE) . "\n"
                    . "- กลุ่มเป้าหมาย: " . json_encode($targets, JSON_UNESCAPED_UNICODE) . "\n"
                    . "- แผนการปฏิบัติงาน (Action Plan): " . json_encode($actionPlan, JSON_UNESCAPED_UNICODE) . "\n"
                    . "- รายละเอียดกิจกรรมและงบประมาณ: " . json_encode($activities, JSON_UNESCAPED_UNICODE) . "\n"
                    . "- กรอบวงเงินงบประมาณที่จัดสรร: {$allocatedBudget} บาท\n\n"
                    . "หลักการตรวจสอบ:\n"
                    . "1. ความสอดคล้องระหว่างวัตถุประสงค์กับตัวชี้วัดความสำเร็จ 4 มิติ\n"
                    . "2. ความสอดคล้องระหว่างตัวชี้วัดเชิงปริมาณกับกลุ่มเป้าหมายในตารางกิจกรรมและขั้นตอน\n"
                    . "3. ความสอดคล้องระหว่างตัวชี้วัดด้านเวลากับไตรมาสที่ติ๊กเลือกในตารางแผนงาน\n"
                    . "4. ความสอดคล้องระหว่างกิจกรรมกับหมวดเงินค่าใช้จ่าย (เช่น มีการจัดอบรม ต้องมีค่าอาหาร/วิทยากร/วัสดุ)\n\n"
                    . "จงตอบกลับเป็น JSON strictly ในโครงสร้างนี้เท่านั้น:\n"
                    . "{\n"
                    . "  \"score\": 85,\n"
                    . "  \"status\": \"excellent\",\n"
                    . "  \"summary\": \"สรุปภาพรวมความสอดคล้องใน 1-2 ประโยค\",\n"
                    . "  \"checks\": [\n"
                    . "    {\"dimension\": \"objectives_kpi\", \"name\": \"วัตถุประสงค์ vs ตัวชี้วัด\", \"status\": \"pass\", \"detail\": \"คำอธิบาย\"},\n"
                    . "    {\"dimension\": \"quantity_target\", \"name\": \"ตัวชี้วัดเชิงปริมาณ vs กลุ่มเป้าหมาย\", \"status\": \"pass\", \"detail\": \"คำอธิบาย\"},\n"
                    . "    {\"dimension\": \"time_quarter\", \"name\": \"ตัวชี้วัดเวลา vs ไตรมาส\", \"status\": \"pass\", \"detail\": \"คำอธิบาย\"},\n"
                    . "    {\"dimension\": \"budget_activities\", \"name\": \"กิจกรรม vs หมวดเงินงบประมาณ\", \"status\": \"pass\", \"detail\": \"คำอธิบาย\"}\n"
                    . "  ],\n"
                    . "  \"recommendations\": [\n"
                    . "    \"ข้อแนะนำที่ 1\",\n"
                    . "    \"ข้อแนะนำที่ 2\"\n"
                    . "  ]\n"
                    . "}";

                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->withoutVerifying()
                    ->timeout(25)
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]]
                        ],
                        'generationConfig' => [
                            'temperature' => 0.2,
                            'maxOutputTokens' => 1500,
                            'responseMimeType' => 'application/json'
                        ]
                    ]);

                if ($response->successful()) {
                    $body = $response->json();
                    $text = $body['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $clean = preg_replace('/```(?:json)?\s*([\s\S]*?)\s*```/', '$1', trim($text));
                    $decoded = json_decode($clean, true);
                    if ($decoded && is_array($decoded) && isset($decoded['score'])) {
                        return $decoded;
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini Consistency Auditor Error: ' . $e->getMessage());
            }
        }

        return $this->fallbackProjectConsistency($projectData);
    }

    /**
     * Fallback Consistency Auditor when API key is offline
     */
    private function fallbackProjectConsistency(array $projectData): array
    {
        $objectives = (array)($projectData['objectives'] ?? []);
        $indicators = (array)($projectData['indicators'] ?? []);
        $actionPlan = (array)($projectData['action_plan'] ?? []);
        $targets = (array)($projectData['targets'] ?? []);
        $allocatedBudget = (float)($projectData['allocated_budget'] ?? 0);

        $actionPlanTotal = 0;
        $hasQ1 = false; $hasQ2 = false; $hasQ3 = false; $hasQ4 = false;
        foreach ($actionPlan as $row) {
            $actionPlanTotal += (float)($row['budget_operating'] ?? 0)
                              + (float)($row['budget_investment'] ?? 0)
                              + (float)($row['budget_other'] ?? 0)
                              + (float)($row['budget_subsidy'] ?? 0);
            if (!empty($row['q1'])) $hasQ1 = true;
            if (!empty($row['q2'])) $hasQ2 = true;
            if (!empty($row['q3'])) $hasQ3 = true;
            if (!empty($row['q4'])) $hasQ4 = true;
        }

        $checks = [];
        $recommendations = [];
        $score = 85;

        // Check 1: Objectives vs KPIs
        if (count($objectives) > 0 && !empty($indicators['quantitative']['text']) && !empty($indicators['qualitative']['text'])) {
            $checks[] = [
                'dimension' => 'objectives_kpi',
                'name' => 'วัตถุประสงค์ vs ตัวชี้วัด 4 มิติ',
                'status' => 'pass',
                'detail' => 'วัตถุประสงค์ (' . count($objectives) . ' ข้อ) มีตัวชี้วัดครอบคลุมทั้งมิติด้านปริมาณ คุณภาพ เวลา และงบประมาณ'
            ];
        } else {
            $score -= 15;
            $checks[] = [
                'dimension' => 'objectives_kpi',
                'name' => 'วัตถุประสงค์ vs ตัวชี้วัด 4 มิติ',
                'status' => 'warning',
                'detail' => 'ควรกำหนดตัวชี้วัดให้ครบทั้ง 4 มิติ เพื่อให้ครอบคลุมวัตถุประสงค์โครงการทุกข้อ'
            ];
            $recommendations[] = 'ทบทวนตัวชี้วัดความสำเร็จ 4 มิติในข้อ ๑๐ ให้สอดรับกับวัตถุประสงค์';
        }

        // Check 2: Quantity vs Targets
        $quantTarget = !empty($targets['quantitative'][0]) ? $targets['quantitative'][0] : '';
        $quantKpi = $indicators['quantitative']['unit'] ?? ($indicators['quantitative']['text'] ?? '');
        $hasTargetMatch = !empty($quantTarget) && (!empty($quantKpi));
        if ($hasTargetMatch) {
            $checks[] = [
                'dimension' => 'quantity_target',
                'name' => 'ตัวชี้วัดเชิงปริมาณ vs กลุ่มเป้าหมาย',
                'status' => 'pass',
                'detail' => "กลุ่มเป้าหมายเชิงปริมาณระบุชัดเจน สอดคล้องกับตัวชี้วัดเชิงปริมาณของโครงการ ({$quantKpi})"
            ];
        } else {
            $score -= 10;
            $checks[] = [
                'dimension' => 'quantity_target',
                'name' => 'ตัวชี้วัดเชิงปริมาณ vs กลุ่มเป้าหมาย',
                'status' => 'warning',
                'detail' => 'กรุณาระบุจำนวนกลุ่มเป้าหมายเชิงปริมาณในข้อ ๗.๑ ให้ชัดเจน เช่น ๕๐ คน'
            ];
            $recommendations[] = 'ระบุจำนวนกลุ่มเป้าหมายเชิงปริมาณและหน่วยนับให้ตรงกับตัวชี้วัดเชิงปริมาณ';
        }

        // Check 3: Time vs Quarters
        $hasAnyQuarter = $hasQ1 || $hasQ2 || $hasQ3 || $hasQ4;
        if ($hasAnyQuarter) {
            $qList = [];
            if ($hasQ1) $qList[] = 'ไตรมาส ๑';
            if ($hasQ2) $qList[] = 'ไตรมาส ๒';
            if ($hasQ3) $qList[] = 'ไตรมาส ๓';
            if ($hasQ4) $qList[] = 'ไตรมาส ๔';
            $checks[] = [
                'dimension' => 'time_quarter',
                'name' => 'ตัวชี้วัดเวลา vs ไตรมาสในแผนปฏิบัติงาน',
                'status' => 'pass',
                'detail' => 'มีการกระจายกิจกรรมลงใน ' . implode(', ', $qList) . ' สอดคล้องกับปฏิทินปฏิบัติงาน'
            ];
        } else {
            $score -= 10;
            $checks[] = [
                'dimension' => 'time_quarter',
                'name' => 'ตัวชี้วัดเวลา vs ไตรมาสในแผนปฏิบัติงาน',
                'status' => 'issue',
                'detail' => 'ยังไม่ได้ติ๊กเลือกไตรมาสที่ดำเนินงานในตารางแผนปฏิบัติงาน (ข้อ ๑๑)'
            ];
            $recommendations[] = 'ติ๊กเลือกไตรมาส (๑-๔) ในตารางข้อ ๑๑ เพื่อใช้คำนวณปฏิทินปฏิบัติงานรวม';
        }

        // Check 4: Budget vs Action Plan
        if ($allocatedBudget > 0) {
            $diff = $actionPlanTotal - $allocatedBudget;
            if (abs($diff) < 0.01) {
                $checks[] = [
                    'dimension' => 'budget_activities',
                    'name' => 'กิจกรรม vs หมวดเงินงบประมาณ',
                    'status' => 'pass',
                    'detail' => 'ยอดรวมหมวดเงินในตารางแผนการปฏิบัติงาน (' . number_format($actionPlanTotal) . ' บาท) ตรงกับวงเงินที่ได้รับการจัดสรร 100%'
                ];
            } elseif ($diff > 0) {
                $score -= 25;
                $checks[] = [
                    'dimension' => 'budget_activities',
                    'name' => 'กิจกรรม vs หมวดเงินงบประมาณ',
                    'status' => 'issue',
                    'detail' => 'ยอดรวมหมวดเงิน (' . number_format($actionPlanTotal) . ' บาท) เกินกว่าวงเงินจัดสรร (' . number_format($allocatedBudget) . ' บาท) เป็นเงิน ' . number_format($diff) . ' บาท'
                ];
                $recommendations[] = 'ปรับลดงบประมาณในตารางแผนการปฏิบัติงาน (ข้อ ๑๑) ลง ' . number_format($diff) . ' บาท เพื่อไม่ให้เกินวงเงินที่ได้รับจัดสรร';
            } else {
                $checks[] = [
                    'dimension' => 'budget_activities',
                    'name' => 'กิจกรรม vs หมวดเงินงบประมาณ',
                    'status' => 'warning',
                    'detail' => 'ยอดรวมหมวดเงิน (' . number_format($actionPlanTotal) . ' บาท) ยังจัดสรรไม่เต็มวงเงิน คงเหลือ ' . number_format(abs($diff)) . ' บาท'
                ];
                $recommendations[] = 'สามารถจัดสรรงบประมาณลงในหมวดที่จำเป็นเพิ่มเติมได้อีก ' . number_format(abs($diff)) . ' บาท';
            }
        } else {
            $checks[] = [
                'dimension' => 'budget_activities',
                'name' => 'กิจกรรม vs หมวดเงินงบประมาณ',
                'status' => 'pass',
                'detail' => 'ตารางหมวดเงินมียอดรวม ' . number_format($actionPlanTotal) . ' บาท'
            ];
        }

        $finalScore = max(30, min(100, $score));
        $status = $finalScore >= 80 ? 'excellent' : ($finalScore >= 60 ? 'good' : 'needs_improvement');

        return [
            'score' => $finalScore,
            'status' => $status,
            'summary' => $finalScore >= 80 
                ? 'โครงสร้างโครงการมีความสอดคล้องเชิงตรรกะในเกณฑ์ดีเยี่ยม ตัวชี้วัดและแผนงานเชื่อมโยงกันอย่างเป็นระบบ'
                : 'พบประเด็นที่ควรปรับปรุงเพื่อเพิ่มความถูกต้องสมบูรณ์ของเอกสารก่อนเสนออนุมัติ',
            'checks' => $checks,
            'recommendations' => $recommendations ?: ['ข้อเสนอโครงการมีความสมบูรณ์พร้อมยื่นเสนอขออนุมัติตามขั้นตอน']
        ];
    }

    /**
     * Contextual Standard Plan Generator (4-step PDCA for Vocational Education)
     */
    public function generateContextualStandardPlan(string $title, array $objectives = [], array $targets = [], string $location = '', float $allocatedBudget = 0): array
    {
        $targetStr = !empty($targets['quantitative'][0]) ? $targets['quantitative'][0] : 'นักเรียน นักศึกษา และบุคลากร จำนวน 50 คน';
        $locationStr = !empty($location) ? $location : 'ณ วิทยาลัยสารพัดช่างน่าน';

        $apiKey = SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));
        $aiEnabled = SystemSetting::get('enable_ai_features', true) || SystemSetting::get('enable_ai_recommendations', true);

        if ($aiEnabled && !empty($apiKey)) {
            try {
                $prompt = "คุณคือผู้เชี่ยวชาญการเขียนโครงการของสถานศึกษา สังกัดสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)\n"
                    . "จงปรับปรุงข้อความ '4 ขั้นตอนมาตรฐานวงจรคุณภาพ PDCA' ให้เข้ากับบริบทของโครงการนี้อย่างสมบูรณ์แบบ:\n"
                    . "- ชื่อโครงการ: {$title}\n"
                    . "- กลุ่มเป้าหมาย: {$targetStr}\n"
                    . "- สถานที่จัด: {$locationStr}\n"
                    . "- วงเงินงบประมาณที่จัดสรร: {$allocatedBudget} บาท\n\n"
                    . "โดยมีโครงสร้าง 4 ขั้นตอน:\n"
                    . "1. ขั้นวางแผน (Plan : P) - ประชุมคณะทำงาน วางแผน กำหนดแนวทาง\n"
                    . "2. ขั้นเตรียมการ (Plan : P) - จัดทำคำสั่งวิทยาลัย ประสานวิทยากรและสถานที่\n"
                    . "3. ขั้นปฏิบัติตามแผน (Do : D) - ดำเนินการจัดกิจกรรม/ฝึกอบรม/แข่งขันทักษะตามโครงการ ให้ระบุชื่อโครงการและกลุ่มเป้าหมายให้ชัดเจน\n"
                    . "4. ขั้นตรวจสอบและปรับปรุง (Check & Act : C & A) - สรุปประเมินผลความพึงพอใจ ถอดบทเรียน AAR และจัดทำรายงาน 5 บท\n\n"
                    . "ตอบกลับเป็น JSON array ของ 4 ขั้นตอน strictly ในโครงสร้างนี้:\n"
                    . "[\n"
                    . "  {\"step_name\": \"...\", \"q1\": true, \"q2\": false, \"q3\": false, \"q4\": false, \"target_count\": \"คณะทำงาน 1 ชุด\", \"location_name\": \"...\", \"budget_operating\": 0, \"budget_investment\": 0, \"budget_other\": 0, \"budget_subsidy\": 0},\n"
                    . "  {\"step_name\": \"...\", \"q1\": true, \"q2\": false, \"q3\": false, \"q4\": false, \"target_count\": \"1 ครั้ง\", \"location_name\": \"...\", \"budget_operating\": 0, \"budget_investment\": 0, \"budget_other\": 0, \"budget_subsidy\": 0},\n"
                    . "  {\"step_name\": \"...\", \"q1\": false, \"q2\": true, \"q3\": false, \"q4\": false, \"target_count\": \"...\", \"location_name\": \"...\", \"budget_operating\": {$allocatedBudget}, \"budget_investment\": 0, \"budget_other\": 0, \"budget_subsidy\": 0},\n"
                    . "  {\"step_name\": \"...\", \"q1\": false, \"q2\": false, \"q3\": false, \"q4\": true, \"target_count\": \"รายงาน 1 เล่ม\", \"location_name\": \"...\", \"budget_operating\": 0, \"budget_investment\": 0, \"budget_other\": 0, \"budget_subsidy\": 0}\n"
                    . "]";

                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->withoutVerifying()
                    ->timeout(20)
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]]
                        ],
                        'generationConfig' => [
                            'temperature' => 0.3,
                            'maxOutputTokens' => 1000,
                            'responseMimeType' => 'application/json'
                        ]
                    ]);

                if ($response->successful()) {
                    $body = $response->json();
                    $text = $body['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $clean = preg_replace('/```(?:json)?\s*([\s\S]*?)\s*```/', '$1', trim($text));
                    $decoded = json_decode($clean, true);
                    if ($decoded && is_array($decoded) && count($decoded) >= 4) {
                        return $decoded;
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini Contextual Standard Plan Error: ' . $e->getMessage());
            }
        }

        // Fallback tailored 4 steps
        return [
            [
                'step_name' => "1. ประชุมวางแผนเพื่อจัดทำโครงการ \"{$title}\" กำหนดกรอบแนวทางและแต่งตั้งคณะทำงานดำเนินงาน",
                'q1' => true, 'q2' => false, 'q3' => false, 'q4' => false,
                'target_count' => 'คณะทำงาน 1 ชุด',
                'location_name' => $locationStr,
                'budget_operating' => 0, 'budget_investment' => 0, 'budget_other' => 0, 'budget_subsidy' => 0
            ],
            [
                'step_name' => "2. ดำเนินการออกคำสั่งวิทยาลัย เชิญคณะกรรมการโครงการประชุมกำหนดวัน เวลา และประสานงานสถานที่ดำเนินโครงการ",
                'q1' => true, 'q2' => false, 'q3' => false, 'q4' => false,
                'target_count' => '1 ครั้ง',
                'location_name' => $locationStr,
                'budget_operating' => 0, 'budget_investment' => 0, 'budget_other' => 0, 'budget_subsidy' => 0
            ],
            [
                'step_name' => "3. ดำเนินการจัดกิจกรรมตามโครงการ \"{$title}\" ให้แก่{$targetStr}",
                'q1' => false, 'q2' => true, 'q3' => false, 'q4' => false,
                'target_count' => $targetStr,
                'location_name' => $locationStr,
                'budget_operating' => $allocatedBudget, 'budget_investment' => 0, 'budget_other' => 0, 'budget_subsidy' => 0
            ],
            [
                'step_name' => "4. สรุปประเมินผลความพึงพอใจ ถอดบทเรียน (AAR) วิเคราะห์ปัญหา อุปสรรค และจัดทำรูปเล่มรายงานโครงการ 5 บท ฉบับสมบูรณ์ เสนอต่อคณะผู้บริหาร",
                'q1' => false, 'q2' => false, 'q3' => false, 'q4' => true,
                'target_count' => 'รายงาน 1 เล่ม',
                'location_name' => $locationStr,
                'budget_operating' => 0, 'budget_investment' => 0, 'budget_other' => 0, 'budget_subsidy' => 0
            ],
        ];
    }

    /**
     * Default Global College Directive
     */
    public static function getDefaultGlobalDirective(): string
    {
        return "ข้อกำหนดและบริบทกลางของวิทยาลัยสารพัดช่างน่าน (สอศ.):\n"
            . "1. มุ่งเน้นการจัดการศึกษาและฝึกอบรมวิชาชีพที่มีคุณภาพตามมาตรฐานอาชีวศึกษา\n"
            . "2. สอดคล้องกับนโยบาย 'เรียนดี มีความสุข', การยกระดับทักษะ (Up-skill / Re-skill) และสมรรถนะวิชาชีพตามความต้องการของตลาดแรงงาน\n"
            . "3. ส่งเสริมคุณธรรม จริยธรรม จิตอาสา และความร่วมมืออย่างใกล้ชิดกับสถานประกอบการ ชุมชน และหน่วยงานท้องถิ่นจังหวัดน่าน\n"
            . "4. การดำเนินงาน ทุกขั้นตอน การจัดซื้อจัดจ้าง และการเบิกจ่ายงบประมาณต้องยึดระเบียบการเงินภาครัฐและหลักธรรมาภิบาลอย่างเคร่งครัด";
    }

    /**
     * Get Central Agent Definitions & Metadata
     */
    public static function getAgentsDefinitions(): array
    {
        return [
            'rationale' => [
                'id' => 'rationale',
                'title' => 'AI ยกร่างหลักการและเหตุผล (Background & Rationale)',
                'icon' => '📝',
                'role' => 'วิเคราะห์ปัญหา ความจำเป็นเร่งด่วน และยกร่างหลักการและเหตุผลตามมาตรฐาน สอศ.',
                'upstream_inputs' => ['ชื่อโครงการ', 'ปีงบประมาณ', 'ฝ่าย/แผนก', 'ยุทธศาสตร์ที่เลือก', 'นโยบายกลางวิทยาลัย'],
                'downstream_outputs' => ['หลักการและเหตุผล 3 ย่อหน้า', 'ส่งต่อให้ AI วัตถุประสงค์'],
                'available_tags' => ['{title}', '{academic_year}', '{department}', '{strategies}', '{college_name}'],
                'default_prompt' => "คุณคือผู้เชี่ยวชาญการเขียนโครงการของสถานศึกษา สังกัดสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)\nจงยกร่าง 'หลักการและเหตุผล' (Background & Rationale) จำนวน 3 ย่อหน้าอย่างเป็นทางการและสมบูรณ์แบบ:\n- ย่อหน้าที่ 1: กล่าวถึงความสำคัญ นโยบายกระทรวงศึกษาธิการ และมาตรฐานวิชาชีพอาชีวศึกษา\n- ย่อหน้าที่ 2: ชี้ให้เห็นสภาพปัญหา ความจำเป็นเร่งด่วน หรือโอกาสในการพัฒนาทักษะของผู้เรียน/บุคลากร\n- ย่อหน้าที่ 3: สรุปเหตุผลความจำเป็นที่ต้องจัดทำโครงการนี้ และประโยชน์ที่จะเกิดต่อผู้เรียนและชุมชน",
            ],
            'objectives' => [
                'id' => 'objectives',
                'title' => 'AI กำหนดวัตถุประสงค์และเป้าหมาย (Objectives & Goals)',
                'icon' => '🎯',
                'role' => 'กำหนดวัตถุประสงค์ 3-4 ข้อตามหลัก SMART สอดคล้องกับหลักการและชื่อโครงการ',
                'upstream_inputs' => ['ชื่อโครงการ', 'หลักการและเหตุผล', 'ยุทธศาสตร์ที่เลือก'],
                'downstream_outputs' => ['รายการวัตถุประสงค์ 3-4 ข้อ', 'ส่งต่อให้ AI ตัวชี้วัด 4 มิติ และ แผน PDCA'],
                'available_tags' => ['{title}', '{rationale}', '{strategies}', '{college_name}'],
                'default_prompt' => "คุณคือผู้เชี่ยวชาญการเขียนโครงการอาชีวศึกษา\nจงกำหนดวัตถุประสงค์ของโครงการจำนวน 3-4 ข้อที่ชัดเจน สอดคล้องกับชื่อโครงการและหลักการเหตุผล\nโดยยึดหลัก SMART (Specific, Measurable, Achievable, Relevant, Time-bound)\nขึ้นต้นด้วย 'เพื่อ...' ทุกข้อ และตอบกลับเป็น JSON array ของสตริง เช่น [\"เพื่อ...\", \"เพื่อ...\"]",
            ],
            'indicators' => [
                'id' => 'indicators',
                'title' => 'AI ออกแบบตัวชี้วัด 4 มิติ (4-Dimension Indicators)',
                'icon' => '📊',
                'role' => 'ออกแบบตัวชี้วัดเชิงปริมาณ คุณภาพ เวลา (ไตรมาส) และค่าใช้จ่าย ให้เชื่อมโยงกับวัตถุประสงค์',
                'upstream_inputs' => ['ชื่อโครงการ', 'วัตถุประสงค์', 'กลุ่มเป้าหมาย', 'วงเงินจัดสรร'],
                'downstream_outputs' => ['ตัวชี้วัดเชิงปริมาณ', 'ตัวชี้วัดเชิงคุณภาพ', 'ตัวชี้วัดเชิงเวลา', 'ตัวชี้วัดเชิงงบประมาณ', 'ส่งต่อให้ AI ตรวจสอบ'],
                'available_tags' => ['{title}', '{objectives}', '{target_group}', '{budget}', '{college_name}'],
                'default_prompt' => "คุณคือผู้เชี่ยวชาญด้านการประกันคุณภาพและประเมินผลโครงการอาชีวศึกษา\nจงออกแบบตัวชี้วัดความสำเร็จ 4 มิติของโครงการ:\n1. เชิงปริมาณ (Quantitative): จำนวนผู้เข้าร่วม/ผลผลิตที่เป็นตัวเลขรูปธรรม\n2. เชิงคุณภาพ (Qualitative): ระดับความพึงพอใจ ทักษะความรู้ที่เพิ่มขึ้น (เช่น ร้อยละ 85 ขึ้นไป)\n3. เชิงเวลา (Time): ดำเนินกิจกรรมแล้วเสร็จตามกำหนดการในไตรมาส ร้อยละ 100\n4. เชิงต้นทุน/ค่าใช้จ่าย (Cost): การบริหารงบประมาณอย่างคุ้มค่า ไม่เกินวงเงินจัดสรร ร้อยละ 100",
            ],
            'action_plan' => [
                'id' => 'action_plan',
                'title' => 'AI วางแผนปฏิบัติงาน 4 ขั้นตอน PDCA (Contextual PDCA Plan)',
                'icon' => '📋',
                'role' => 'ปรับบริบท 4 ขั้นตอนมาตรฐานวงจรคุณภาพ พร้อมจัดสรรงบประมาณไม่เกินวงเงิน',
                'upstream_inputs' => ['ชื่อโครงการ', 'วัตถุประสงค์', 'กลุ่มเป้าหมาย', 'วงเงินจัดสรร', 'ไตรมาส'],
                'downstream_outputs' => ['ตาราง 4 ขั้นตอน PDCA', 'การกำหนดไตรมาสและหมวดเงิน', 'ส่งต่อให้ Auditor'],
                'available_tags' => ['{title}', '{objectives}', '{target_group}', '{budget}', '{location}'],
                'default_prompt' => "คุณคือผู้เชี่ยวชาญการวางแผนปฏิบัติงานตามวงจรคุณภาพ PDCA สำหรับอาชีวศึกษา\nจงปรับแต่ง 4 ขั้นตอนมาตรฐาน (Plan: วางแผน, Plan: เตรียมการ, Do: ดำเนินการ, Check & Act: ตรวจสอบและรายงาน)\nให้สอดคล้องกับชื่อโครงการ กลุ่มเป้าหมาย และกระจายงบประมาณลงในขั้นตอนที่ 3 ไม่ให้เกินวงเงินจัดสรร",
            ],
            'auditor' => [
                'id' => 'auditor',
                'title' => 'AI ตรวจสอบความสอดคล้องเชิงตรรกะ (Consistency Auditor)',
                'icon' => '🛡️',
                'role' => 'ตรวจสอบความสอดคล้องตลอดสาย: วัตถุประสงค์ ↔ ตัวชี้วัด ↔ แผนงาน ↔ งบประมาณ พร้อมให้คะแนน 0-100',
                'upstream_inputs' => ['ข้อมูลโครงการทั้งหมดแบบครบวงจร', 'นโยบายกลางวิทยาลัย'],
                'downstream_outputs' => ['คะแนนความสอดคล้อง (0-100)', 'ผลตรวจ 4 มิติ (Pass/Warning/Issue)', 'ข้อเสนอแนะปรับปรุง'],
                'available_tags' => ['{title}', '{objectives}', '{indicators}', '{action_plan}', '{budget}'],
                'default_prompt' => "คุณคือ AI Consistency Auditor ผู้ตรวจสอบความสอดคล้องเชิงตรรกะของโครงการอาชีวศึกษา\nตรวจสอบความเชื่อมโยง วัตถุประสงค์ ↔ ตัวชี้วัด 4 มิติ ↔ แผนงาน ↔ หมวดงบประมาณ\nวิเคราะห์ความสมเหตุสมผล ให้คะแนน 0-100 ตรวจสอบ 4 มิติ และให้ข้อเสนอแนะเชิงพัฒนาที่ปฏิบัติได้จริง",
            ],
            'mapping' => [
                'id' => 'mapping',
                'title' => 'AI แนะนำยุทธศาสตร์และตรวจซ้ำซ้อน (Strategy Mapper & Duplicate Detector)',
                'icon' => '🔗',
                'role' => 'จับคู่ยุทธศาสตร์ สอศ., IQA, มาตรฐานสถานศึกษา และตรวจจับโครงการที่ทับซ้อนกัน',
                'upstream_inputs' => ['ชื่อโครงการ', 'หลักการและเหตุผล', 'วัตถุประสงค์', 'ฐานข้อมูลยุทธศาสตร์'],
                'downstream_outputs' => ['รหัสยุทธศาสตร์ที่แนะนำ', 'ระดับความเสี่ยงการซ้ำซ้อน'],
                'available_tags' => ['{title}', '{rationale}', '{objectives}'],
                'default_prompt' => "คุณคือผู้เชี่ยวชาญด้านยุทธศาสตร์และนโยบายการอาชีวศึกษา\nวิเคราะห์ชื่อโครงการและเนื้อหา เพื่อจับคู่ยุทธศาสตร์ นโยบาย และมาตรฐานการศึกษาที่ตรงและเหมาะสมที่สุด\nพร้อมประเมินความซ้ำซ้อนกับโครงการอื่น ๆ ในสถานศึกษา",
            ],
            'survey' => [
                'id' => 'survey',
                'title' => 'AI สร้างแบบสอบถามและประเมินผล (Survey Generator & Evaluator)',
                'icon' => '📝',
                'role' => 'สร้างแบบสอบถาม 5 ระดับ (Likert Scale) และวิเคราะห์ความรู้สึก (Sentiment) ของผู้ร่วมโครงการ',
                'upstream_inputs' => ['ชื่อโครงการ', 'วัตถุประสงค์', 'กลุ่มเป้าหมาย', 'ผลการสำรวจจริง'],
                'downstream_outputs' => ['ชุดข้อคำถาม 15 ข้อ', 'การวิเคราะห์ผลประเมิน และข้อเสนอแนะ ACT Phase'],
                'available_tags' => ['{title}', '{objectives}', '{target_group}', '{survey_stats}'],
                'default_prompt' => "คุณคือผู้เชี่ยวชาญการวัดและประเมินผลโครงการทางการศึกษา\nสร้างแบบสอบถามประเมินความพึงพอใจ 4 ด้านมาตรฐาน (ด้านกระบวนการ ด้านวิทยากร ด้านสิ่งอำนวยความสะดวก ด้านการนำไปใช้)\nและวิเคราะห์ข้อเสนอแนะของผู้เข้าร่วมโครงการตามวงจร Deming (PDCA)",
            ],
            'tor' => [
                'id' => 'tor',
                'title' => 'AI ยกร่างและตรวจสอบ TOR งานพัสดุ (Procurement TOR & Compliance)',
                'icon' => '📦',
                'role' => 'ยกร่างขอบเขตของงาน (TOR) และตรวจสอบความถูกต้องตามระเบียบจัดซื้อจัดจ้างภาครัฐ',
                'upstream_inputs' => ['ชื่อรายการครุภัณฑ์/จ้างเหมา', 'หมวดเงิน', 'วงเงินงบประมาณ', 'แผนงาน'],
                'downstream_outputs' => ['ร่างเอกสาร TOR', 'ผลตรวจความสอดคล้องตามระเบียบพัสดุ พ.ร.บ. 2560'],
                'available_tags' => ['{item_name}', '{category}', '{estimated_price}', '{department}'],
                'default_prompt' => "คุณคือผู้เชี่ยวชาญระเบียบการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560\nยกร่างขอบเขตของงาน (Terms of Reference : TOR) หรือรายละเอียดคุณลักษณะเฉพาะของพัสดุ\nที่ถูกต้อง โปร่งใส เป็นธรรม ไม่ล็อคสเปก และคุ้มค่ากับงบประมาณแผ่นดิน",
            ],
            'reports' => [
                'id' => 'reports',
                'title' => 'AI สังเคราะห์รายงานสรุปโครงการ 5 บท (Report Book Synthesizer)',
                'icon' => '📑',
                'role' => 'ประมวลผลข้อมูลทั้งวงจรโครงการ สังเคราะห์รายงานบทที่ 1 ถึงบทที่ 5 ฉบับสมบูรณ์',
                'upstream_inputs' => ['ข้อมูลโครงการทั้งหมด', 'ผลสำรวจความพึงพอใจ', 'ภาพกิจกรรมและหลักฐาน'],
                'downstream_outputs' => ['เนื้อหารายงานบทที่ 1, 2, 3, 4, 5', 'พร้อมพิมพ์รูปเล่ม A4'],
                'available_tags' => ['{title}', '{objectives}', '{targets}', '{survey_results}'],
                'default_prompt' => "คุณคือผู้เชี่ยวชาญการเขียนรายงานผลการดำเนินโครงการ 5 บท สำหรับสถานศึกษาอาชีวศึกษา\nสังเคราะห์ผลการดำเนินงาน เปรียบเทียบกับวัตถุประสงค์และตัวชี้วัดที่ตั้งไว้ อภิปรายผลเชิงวิชาการ\nและจัดทำข้อเสนอแนะเพื่อนำผลไปปรับปรุงในรอบปีการศึกษาถัดไป",
            ],
        ];
    }

    /**
     * Shared Context Pipeline Builder: aggregates upstream data from previous AI agents and project fields.
     */
    public static function buildSharedProjectContext(array $projectData): string
    {
        $college = SystemSetting::get('college_name_th', 'วิทยาลัยสารพัดช่างน่าน');
        $year = $projectData['academic_year'] ?? SystemSetting::get('current_academic_year', '2569');
        $title = $projectData['title'] ?? 'โครงการพัฒนาทักษะวิชาชีพ';
        $department = $projectData['department_name'] ?? ($projectData['department'] ?? 'งานแผนงานและงบประมาณ');
        $budget = !empty($projectData['allocated_budget']) ? number_format((float)$projectData['allocated_budget']) . ' บาท' : (!empty($projectData['estimated_budget']) ? number_format((float)$projectData['estimated_budget']) . ' บาท' : 'ไม่ระบุ');
        
        $directives = SystemSetting::get('ai_global_directive', self::getDefaultGlobalDirective());

        $context = "=== ข้อมูลบริบทโครงการและสถาบัน (Shared Project Context) ===\n";
        $context .= "- สถานศึกษา: {$college}\n";
        $context .= "- ปีงบประมาณ/ปีการศึกษา: พ.ศ. {$year}\n";
        $context .= "- ชื่อโครงการ: {$title}\n";
        $context .= "- หน่วยงานผู้รับผิดชอบ: {$department}\n";
        $context .= "- วงเงินงบประมาณ: {$budget}\n";

        if (!empty($projectData['rationale']) || !empty($projectData['background_rationale'])) {
            $rat = $projectData['rationale'] ?? $projectData['background_rationale'];
            $context .= "- หลักการและเหตุผล (ร่างแล้ว): " . mb_substr(strip_tags($rat), 0, 300) . "...\n";
        }

        if (!empty($projectData['objectives'])) {
            $objs = is_array($projectData['objectives']) ? implode('; ', $projectData['objectives']) : $projectData['objectives'];
            $context .= "- วัตถุประสงค์โครงการ: {$objs}\n";
        }

        if (!empty($projectData['indicators'])) {
            $ind = $projectData['indicators'];
            $qnt = is_array($ind['quantitative'] ?? null) ? implode('; ', $ind['quantitative']) : ($ind['quantitative'] ?? '');
            $qlt = is_array($ind['qualitative'] ?? null) ? implode('; ', $ind['qualitative']) : ($ind['qualitative'] ?? '');
            if ($qnt) $context .= "- ตัวชี้วัดเชิงปริมาณ: {$qnt}\n";
            if ($qlt) $context .= "- ตัวชี้วัดเชิงคุณภาพ: {$qlt}\n";
        }

        if (!empty($projectData['strategies_text'])) {
            $context .= "- ยุทธศาสตร์ที่เกี่ยวข้อง: {$projectData['strategies_text']}\n";
        }

        $context .= "\n=== นโยบายและข้อกำหนดเฉพาะของวิทยาลัย (Global Directives) ===\n";
        $context .= "{$directives}\n";

        return $context;
    }

    /**
     * Generate Project Background & Rationale using Shared Pipeline and Role Prompt
     */
    public function generateRationale(array $data): string
    {
        $apiKey = SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));
        $aiEnabled = SystemSetting::get('enable_ai_features', true) || SystemSetting::get('enable_ai_recommendations', true);
        $title = trim($data['title'] ?? 'โครงการพัฒนาทักษะวิชาชีพ');

        if ($aiEnabled && !empty($apiKey)) {
            $agentPrompt = SystemSetting::get('ai_prompt_rationale', self::getAgentsDefinitions()['rationale']['default_prompt']);
            $context = self::buildSharedProjectContext($data);
            $model = SystemSetting::get('ai_model', 'gemini-2.5-flash');
            $temp = (float)SystemSetting::get('ai_temperature', 0.4);

            $fullPrompt = "{$agentPrompt}\n\n{$context}\n\nคำสั่ง: จงยกร่าง 'หลักการและเหตุผล' ของโครงการ \"{$title}\" จำนวน 3 ย่อหน้าอย่างสมบูรณ์แบบ ตอบเฉพาะเนื้อหาหลักการและเหตุผลภาษาไทย ไม่ต้องมีเกริ่นนำหรือหัวข้อข้อความ";

            try {
                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->withoutVerifying()
                    ->timeout(22)
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                        'contents' => [['parts' => [['text' => $fullPrompt]]]],
                        'generationConfig' => ['temperature' => $temp, 'maxOutputTokens' => 1200]
                    ]);

                if ($response->successful()) {
                    $body = $response->json();
                    $text = $body['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    if (!empty(trim($text))) {
                        return trim($text);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini generateRationale error: ' . $e->getMessage());
            }
        }

        // Standard Fallback Rationale
        return "ตามที่ สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) มุ่งเน้นการจัดการศึกษาและการฝึกอบรมวิชาชีพที่มีคุณภาพ เพื่อพัฒนากำลังคนด้านวิชาชีพให้มีสมรรถนะตรงตามความต้องการของสถานประกอบการ สังคม และชุมชน สอดรับกับนโยบายการยกระดับคุณภาพการอาชีวศึกษาและความเปลี่ยนแปลงทางเทคโนโลยี\n\nวิทยาลัยสารพัดช่างน่าน ได้ตระหนักถึงความสำคัญในการส่งเสริมและพัฒนาศักยภาพของผู้เรียนและบุคลากร จึงมีความจำเป็นต้องขับเคลื่อนกิจกรรมที่ส่งเสริมการเรียนรู้เชิงปฏิบัติการ ทักษะวิชาชีพเฉพาะทาง ตลอดจนการปลูกฝังคุณธรรม จริยธรรม และจิตอาสา เพื่อให้การดำเนินงานบรรลุตามมาตรฐานการประกันคุณภาพการศึกษา\n\nดังนั้น เพื่อให้การดำเนินงานเกิดประสิทธิภาพสูงสุด วิทยาลัยสารพัดช่างน่านจึงได้จัดทำโครงการ \"{$title}\" ขึ้น เพื่อเป็นกลไกสำคัญในการพัฒนาทักษะ เสริมสร้างประสบการณ์จริง และสร้างประโยชน์อย่างยั่งยืนแก่ผู้เรียน สถานศึกษา และชุมชนท้องถิ่นต่อไป";
    }

    /**
     * Generate Project Objectives using Shared Pipeline and Role Prompt
     */
    public function generateObjectives(array $data): array
    {
        $apiKey = SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));
        $aiEnabled = SystemSetting::get('enable_ai_features', true) || SystemSetting::get('enable_ai_recommendations', true);
        $title = trim($data['title'] ?? 'โครงการพัฒนาทักษะวิชาชีพ');

        if ($aiEnabled && !empty($apiKey)) {
            $agentPrompt = SystemSetting::get('ai_prompt_objectives', self::getAgentsDefinitions()['objectives']['default_prompt']);
            $context = self::buildSharedProjectContext($data);
            $model = SystemSetting::get('ai_model', 'gemini-2.5-flash');
            $temp = (float)SystemSetting::get('ai_temperature', 0.3);

            $fullPrompt = "{$agentPrompt}\n\n{$context}\n\nคำสั่ง: กำหนดวัตถุประสงค์ 3 ข้อ สำหรับโครงการ \"{$title}\" ตอบเป็น JSON array ของสตริง strictly ในรูปแบบ [\"เพื่อ...\", \"เพื่อ...\", \"เพื่อ...\"]";

            try {
                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->withoutVerifying()
                    ->timeout(18)
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                        'contents' => [['parts' => [['text' => $fullPrompt]]]],
                        'generationConfig' => [
                            'temperature' => $temp,
                            'maxOutputTokens' => 600,
                            'responseMimeType' => 'application/json'
                        ]
                    ]);

                if ($response->successful()) {
                    $body = $response->json();
                    $text = $body['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $clean = preg_replace('/```(?:json)?\s*([\s\S]*?)\s*```/', '$1', trim($text));
                    $decoded = json_decode($clean, true);
                    if (is_array($decoded) && count($decoded) >= 2) {
                        return array_values($decoded);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini generateObjectives error: ' . $e->getMessage());
            }
        }

        return [
            "เพื่อส่งเสริมและพัฒนาองค์ความรู้ ทักษะวิชาชีพ และสมรรถนะที่จำเป็นในการดำเนินกิจกรรมตามโครงการ {$title} ให้แก่กลุ่มเป้าหมาย",
            "เพื่อให้ผู้เข้าร่วมโครงการสามารถนำความรู้และประสบการณ์ไปประยุกต์ใช้ในการเรียน การปฏิบัติงาน และการประกอบอาชีพได้อย่างมีประสิทธิภาพ",
            "เพื่อสร้างความตระหนัก คุณธรรม จริยธรรม เจตคติที่ดี และความรับผิดชอบต่อตนเอง สังคม และสิ่งแวดล้อม"
        ];
    }

    /**
     * Generate 4-Dimension Indicators using Shared Pipeline and Role Prompt
     */
    public function generateIndicators(array $data): array
    {
        $apiKey = SystemSetting::get('gemini_api_key', env('GEMINI_API_KEY'));
        $aiEnabled = SystemSetting::get('enable_ai_features', true) || SystemSetting::get('enable_ai_recommendations', true);
        $title = trim($data['title'] ?? 'โครงการพัฒนาทักษะวิชาชีพ');

        if ($aiEnabled && !empty($apiKey)) {
            $agentPrompt = SystemSetting::get('ai_prompt_indicators', self::getAgentsDefinitions()['indicators']['default_prompt']);
            $context = self::buildSharedProjectContext($data);
            $model = SystemSetting::get('ai_model', 'gemini-2.5-flash');
            $temp = (float)SystemSetting::get('ai_temperature', 0.3);

            $fullPrompt = "{$agentPrompt}\n\n{$context}\n\nคำสั่ง: ออกแบบตัวชี้วัด 4 มิติ สำหรับโครงการ \"{$title}\" ตอบกลับเป็น JSON object strictly ในรูปแบบ:\n"
                . "{\n"
                . "  \"quantitative\": [\"...\", \"...\"],\n"
                . "  \"qualitative\": [\"...\", \"...\"],\n"
                . "  \"time\": \"...\",\n"
                . "  \"cost\": \"...\"\n"
                . "}";

            try {
                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->withoutVerifying()
                    ->timeout(18)
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                        'contents' => [['parts' => [['text' => $fullPrompt]]]],
                        'generationConfig' => [
                            'temperature' => $temp,
                            'maxOutputTokens' => 800,
                            'responseMimeType' => 'application/json'
                        ]
                    ]);

                if ($response->successful()) {
                    $body = $response->json();
                    $text = $body['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $clean = preg_replace('/```(?:json)?\s*([\s\S]*?)\s*```/', '$1', trim($text));
                    $decoded = json_decode($clean, true);
                    if (is_array($decoded) && (!empty($decoded['quantitative']) || !empty($decoded['qualitative']))) {
                        return $decoded;
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini generateIndicators error: ' . $e->getMessage());
            }
        }

        return [
            'quantitative' => [
                'นักเรียน นักศึกษา บุคลากร หรือกลุ่มเป้าหมายเข้าร่วมโครงการไม่น้อยกว่า 50 คน',
                'มีการจัดกิจกรรมและดำเนินงานตามโครงการสำเร็จครบถ้วน จำนวน 1 โครงการ'
            ],
            'qualitative' => [
                'ผู้เข้าร่วมโครงการมีความรู้ ความเข้าใจ และทักษะเพิ่มขึ้นไม่น้อยกว่าร้อยละ 85',
                'ผู้เข้าร่วมโครงการมีความพึงพอใจต่อภาพรวมของการจัดโครงการในระดับดีมาก (ร้อยละ 90 ขึ้นไป)'
            ],
            'time' => 'ดำเนินกิจกรรมตามโครงการแล้วเสร็จตามกำหนดเวลาในแผนปฏิบัติงาน ร้อยละ 100',
            'cost' => 'การใช้จ่ายงบประมาณเป็นไปตามระเบียบของทางราชการ คุ้มค่า และไม่เกินวงเงินที่ได้รับจัดสรร ร้อยละ 100'
        ];
    }
}

