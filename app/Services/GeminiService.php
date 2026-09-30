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
        
        return "You are an educational quality assurance AI evaluator. Analyze the following project evaluation survey results and write a comprehensive, professional project improvement proposal focusing on corrective actions and 'ACT' phase adjustments for Nan Polytechnic College.

Survey Summary:
- Total respondents: {$totalResponses}
- Q1 Average (Objectives Met): {$averages['q1']}/5.0
- Q2 Average (Appropriate Duration): {$averages['q2']}/5.0
- Q3 Average (Facilities & Coordination): {$averages['q3']}/5.0
- Q4 Average (Materials & Documentation): {$averages['q4']}/5.0
- Q5 Average (Useful & Practical): {$averages['q5']}/5.0
- Overall Satisfaction: {$averages['satisfaction_percentage']}%

Textual Feedback / Suggestions:
- {$suggestionsList}

Write the report in Thai. Include sections for:
1. การวิเคราะห์สรุปผล (Executive Summary & Analysis)
2. จุดแข็งที่ควรส่งเสริม (Strengths to Maintain)
3. ข้อควรปรับปรุงเร่งด่วน (Priority Areas for Improvement)
4. ข้อเสนอแนะเชิงรุกสำหรับโครงการครั้งถัดไป (ACT Phase Recommendations for Next Project Cycle)";
    }

    /**
     * Provide a highly detailed, dynamically tailored fallback response.
     */
    private function getDynamicFallback(int $totalResponses, array $averages, array $suggestions): string
    {
        $strengths = [];
        $improvements = [];

        if ($averages['q1'] >= 4.0) $strengths[] = "ความสอดคล้องของโครงการกับวัตถุประสงค์ (เฉลี่ย {$averages['q1']}/5.0) อยู่ในเกณฑ์ดีเลิศ";
        if ($averages['q5'] >= 4.0) $strengths[] = "ผู้เข้าร่วมโครงการเห็นพ้องว่าโครงการนี้สามารถนำไปใช้งานได้จริงเป็นรูปธรรม (เฉลี่ย {$averages['q5']}/5.0)";
        
        if ($averages['q2'] < 4.0) $improvements[] = "ควรปรับปรุงด้านการบริหารเวลาและระยะเวลาดำเนินกิจกรรม (เฉลี่ย {$averages['q2']}/5.0) โดยเพิ่มเวลาสัมมนาเชิงปฏิบัติการ";
        if ($averages['q3'] < 4.0) $improvements[] = "ควรพัฒนาด้านการอำนวยความสะดวก ประสานงาน และสถานที่จัดงาน (เฉลี่ย {$averages['q3']}/5.0)";
        if ($averages['q4'] < 4.0) $improvements[] = "ควรปรับปรุงการจัดเตรียมเอกสาร สื่อประกอบการสอน และเครื่องมือปฏิบัติงานให้พร้อมก่อนเริ่มกิจกรรม (เฉลี่ย {$averages['q4']}/5.0)";

        if (empty($improvements)) {
            $improvements[] = "แนะนำให้คงประสิทธิภาพปัจจุบัน และเสริมการติดตามผลผู้เข้าร่วมโครงการระยะยาว (3-6 เดือน) เพื่อประเมินทักษะที่นำไปใช้ในการปฏิบัติงานจริง";
        }

        $improvementsText = implode("\n", array_map(fn($item) => "   - {$item}", $improvements));
        $strengthsText = empty($strengths) 
            ? "   - ผลสัมฤทธิ์ของโครงการโดยรวมอยู่ในระดับปานกลาง จำเป็นต้องเพิ่มประสิทธิภาพในทุกมิติของกิจกรรม"
            : implode("\n", array_map(fn($item) => "   - {$item}", $strengths));

        $suggestionsText = empty($suggestions) 
            ? "   - ไม่มีการระบุข้อเสนอแนะเพิ่มเติมจากผู้ประเมิน"
            : implode("\n", array_map(fn($item) => "   - \"{$item}\"", array_slice($suggestions, 0, 3)));

        return "### รายงานข้อเสนอแนะเพื่อการพัฒนาและปรับปรุงโครงการ (AI ACT Recommendations)
*(ระบบวิเคราะห์ข้อมูลอัตโนมัติ SMART FLOW - จำลองผลวิเคราะห์ออฟไลน์)*

**1. สรุปภาพรวมการประเมิน (Executive Summary)**
จากข้อมูลการตอบแบบสอบถามทั้งหมด {$totalResponses} ชุด โครงการมีค่าเฉลี่ยความพึงพอใจโดยรวมอยู่ที่ {$averages['overall']}/5.0 คิดเป็นอัตราความพึงพอใจ **{$averages['satisfaction_percentage']}%** อยู่ในเกณฑ์วิเคราะห์ทิศทางบวก

**2. จุดเด่นและข้อดีของโครงการ (Strengths to Maintain)**
{$strengthsText}

**3. ประเด็นที่ควรดำเนินงานปรับปรุงเร่งด่วน (Corrective Action Areas)**
{$improvementsText}

**4. สรุปข้อเสนอแนะและทิศทางการวิเคราะห์จากผู้เข้าร่วมโครงการ**
{$suggestionsText}

**5. ข้อเสนอแนะเชิงรุกสำหรับรอบปีการศึกษาถัดไป (ACT Action Plan)**
- **การวางแผนงบประมาณ**: ควรพิจารณาเพิ่ม/ลด สัดส่วนการจัดสรรตามจุดรับพัสดุและเวลาที่กำหนดให้กระชับ
- **การปรับปรุงหลักสูตร**: ประสานงานวิชาการเพื่อนำเนื้อหาโครงการบรรจุเข้าในตารางสอนหลักสูตรปกติ เพื่อความยั่งยืนของทักษะผู้เรียน";
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
     * Fallback survey questions directly synthesized from project objectives and indicators.
     */
    public function getFallbackSurveyQuestions(\App\Models\Project $project): array
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

        // Extract indicators
        $indicatorNote = '';
        $rawIndicators = $project->indicators;
        if (is_array($rawIndicators)) {
            if (!empty($rawIndicators['qualitative'])) {
                $indicatorNote = is_array($rawIndicators['qualitative']) ? implode(' ', $rawIndicators['qualitative']) : (string)$rawIndicators['qualitative'];
            } elseif (!empty($rawIndicators['quantitative'])) {
                $indicatorNote = is_array($rawIndicators['quantitative']) ? implode(' ', $rawIndicators['quantitative']) : (string)$rawIndicators['quantitative'];
            }
        } elseif (is_string($rawIndicators) && !empty($rawIndicators)) {
            $indicatorNote = $rawIndicators;
        }

        $questions = [];
        $idx = 1;

        // Question 1: Objectives & Process
        if (!empty($objectives[0])) {
            $questions[] = [
                'id' => $idx++,
                'category' => 'ด้านกระบวนการและการจัดกิจกรรม (Process)',
                'question' => "การจัดกิจกรรมมีความสอดคล้องและบรรลุตามวัตถุประสงค์โครงการ ({$objectives[0]})"
            ];
        } else {
            $questions[] = [
                'id' => $idx++,
                'category' => 'ด้านกระบวนการและการจัดกิจกรรม (Process)',
                'question' => "การดำเนินกิจกรรมมีความสอดคล้องกับวัตถุประสงค์และเป้าหมายของ{$title}"
            ];
        }

        // Question 2: Second objective or Content/Knowledge
        if (isset($objectives[1]) && !empty($objectives[1])) {
            $questions[] = [
                'id' => $idx++,
                'category' => 'ด้านความรู้และทักษะตามวัตถุประสงค์ (Content & Skills)',
                'question' => "ผู้เข้าร่วมโครงการได้รับความรู้ ความเข้าใจ และทักษะตามวัตถุประสงค์ ({$objectives[1]})"
            ];
        } else {
            $questions[] = [
                'id' => $idx++,
                'category' => 'ด้านเนื้อหาสาระและวิทยากร (Content & Knowledge)',
                'question' => "เนื้อหาสาระ เทคนิคการถ่ายทอดความรู้ และวิทยากรผู้ให้การอบรมมีความเหมาะสมและชัดเจน"
            ];
        }

        // Question 3: Facilities, Materials & Timing
        $questions[] = [
            'id' => $idx++,
            'category' => 'ด้านการบริหารจัดการและสิ่งอำนวยความสะดวก (Facilities & Timing)',
            'question' => "ระยะเวลาการจัดกิจกรรม สถานที่ สื่อโสตทัศนูปกรณ์ และการประสานงานมีความพร้อมและเหมาะสม"
        ];

        // Question 4: Indicator / Outcomes
        if (!empty($indicatorNote)) {
            $indicatorShort = mb_substr(trim(preg_replace('/^[๐-๙0-9.\s\-]+/u', '', $indicatorNote)), 0, 80);
            $questions[] = [
                'id' => $idx++,
                'category' => 'ด้านประโยชน์และผลสัมฤทธิ์ตามตัวชี้วัด (Outcomes & Indicators)',
                'question' => "ผลการเข้าร่วมกิจกรรมเป็นไปตามตัวชี้วัดความสำเร็จของโครงการ ({$indicatorShort})"
            ];
        } else {
            $questions[] = [
                'id' => $idx++,
                'category' => 'ด้านประโยชน์และการนำไปใช้จริง (Outcomes & Benefits)',
                'question' => "ความรู้และประสบการณ์ที่ได้รับสามารถนำไปประยุกต์ใช้ในการปฏิบัติงานหรือการเรียนรู้ได้จริง"
            ];
        }

        // Question 5: Overall Satisfaction
        $questions[] = [
            'id' => $idx++,
            'category' => 'ด้านความพึงพอใจในภาพรวม (Overall Satisfaction)',
            'question' => "ความพึงพอใจในภาพรวมต่อการเข้าร่วมและการดำเนินงาน{$title}"
        ];

        return $questions;
    }
}

