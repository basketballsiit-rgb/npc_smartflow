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
                'category' => 'ด้านที่ ๑: ด้านกระบวนการและขั้นตอนการดำเนินงาน (Process / Plan & Do)',
                'question' => 'การประชาสัมพันธ์ข้อมูลข่าวสารของโครงการมีความทั่วถึงและรวดเร็ว',
            ],
            [
                'id' => 2,
                'dimension' => 1,
                'category' => 'ด้านที่ ๑: ด้านกระบวนการและขั้นตอนการดำเนินงาน (Process / Plan & Do)',
                'question' => 'ขั้นตอนและกระบวนการจัดกิจกรรมมีความเหมาะสม ไม่ซับซ้อน',
            ],
            [
                'id' => 3,
                'dimension' => 1,
                'category' => 'ด้านที่ ๑: ด้านกระบวนการและขั้นตอนการดำเนินงาน (Process / Plan & Do)',
                'question' => 'ระยะเวลาในการจัดกิจกรรมมีความเหมาะสม (ไม่สั้นหรือยาวจนเกินไป)',
            ],
            [
                'id' => 4,
                'dimension' => 1,
                'category' => 'ด้านที่ ๑: ด้านกระบวนการและขั้นตอนการดำเนินงาน (Process / Plan & Do)',
                'question' => 'ลำดับขั้นตอนของกิจกรรมดำเนินไปอย่างต่อเนื่องและราบรื่น',
            ],

            // ด้านที่ 2: ด้านปัจจัยนำเข้าและการอำนวยความสะดวก (Input)
            [
                'id' => 5,
                'dimension' => 2,
                'category' => 'ด้านที่ ๒: ด้านปัจจัยนำเข้าและการอำนวยความสะดวก (Input)',
                'question' => 'สถานที่จัดกิจกรรมมีความเหมาะสม สะอาด และเดินทางสะดวก (หรือระบบออนไลน์มีความเสถียร)',
            ],
            [
                'id' => 6,
                'dimension' => 2,
                'category' => 'ด้านที่ ๒: ด้านปัจจัยนำเข้าและการอำนวยความสะดวก (Input)',
                'question' => 'สิ่งอำนวยความสะดวก อาหาร อาหารว่าง หรือวัสดุอุปกรณ์มีความพร้อมและเพียงพอ',
            ],
            [
                'id' => 7,
                'dimension' => 2,
                'category' => 'ด้านที่ ๒: ด้านปัจจัยนำเข้าและการอำนวยความสะดวก (Input)',
                'question' => 'วิทยากร/ผู้ให้ความรู้ มีความเชี่ยวชาญ ถ่ายทอดเข้าใจง่าย และตอบคำถามได้ชัดเจน',
            ],
            [
                'id' => 8,
                'dimension' => 2,
                'category' => 'ด้านที่ ๒: ด้านปัจจัยนำเข้าและการอำนวยความสะดวก (Input)',
                'question' => 'คณะทำงาน/เจ้าหน้าที่ ให้การต้อนรับ ดูแล และประสานงานอย่างสุภาพเรียบร้อย',
            ],

            // ด้านที่ 3: ด้านผลผลิตและผลลัพธ์โดยตรง (Output / Objective)
            [
                'id' => 9,
                'dimension' => 3,
                'category' => 'ด้านที่ ๓: ด้านผลผลิตและผลลัพธ์โดยตรง (Output / Objective)',
                'question' => 'ผู้เข้าร่วมโครงการมีความรู้ ความเข้าใจในเนื้อหา/ประเด็นของโครงการเพิ่มมากขึ้น (เทียบกับก่อนร่วมงาน)' . $obj1Note,
            ],
            [
                'id' => 10,
                'dimension' => 3,
                'category' => 'ด้านที่ ๓: ด้านผลผลิตและผลลัพธ์โดยตรง (Output / Objective)',
                'question' => 'ผู้เข้าร่วมโครงการได้รับทักษะ หรือแนวคิดใหม่ๆ ที่สามารถนำไปใช้ปฏิบัติได้จริง' . $obj2Note,
            ],
            [
                'id' => 11,
                'dimension' => 3,
                'category' => 'ด้านที่ ๓: ด้านผลผลิตและผลลัพธ์โดยตรง (Output / Objective)',
                'question' => 'เนื้อหาของโครงการมีความสอดคล้องกับวัตถุประสงค์ที่กำหนดไว้',
            ],
            [
                'id' => 12,
                'dimension' => 3,
                'category' => 'ด้านที่ ๓: ด้านผลผลิตและผลลัพธ์โดยตรง (Output / Objective)',
                'question' => 'ภาพรวมของกิจกรรมบรรลุเป้าหมายตามที่ท่านคาดหวังไว้',
            ],

            // ด้านที่ 4: ด้านประโยชน์และการนำไปใช้ประโยชน์ (Outcome / Impact)
            [
                'id' => 13,
                'dimension' => 4,
                'category' => 'ด้านที่ ๔: ด้านประโยชน์และการนำไปใช้ประโยชน์ (Outcome / Impact)',
                'question' => 'ท่านสามารถนำความรู้/ประโยชน์จากโครงการนี้ไปประยุกต์ใช้ในการทำงานหรือชีวิตประจำวันได้',
            ],
            [
                'id' => 14,
                'dimension' => 4,
                'category' => 'ด้านที่ ๔: ด้านประโยชน์และการนำไปใช้ประโยชน์ (Outcome / Impact)',
                'question' => !empty($benefitClean)
                    ? "โครงการนี้ช่วยแก้ปัญหา หรือพัฒนาหน่วยงาน/ชุมชน/ตัวท่านได้อย่างเป็นรูปธรรม ({$benefitClean})"
                    : 'โครงการนี้ช่วยแก้ปัญหา หรือพัฒนาหน่วยงาน/ชุมชน/ตัวท่านได้อย่างเป็นรูปธรรม',
            ],
            [
                'id' => 15,
                'dimension' => 4,
                'category' => 'ด้านที่ ๔: ด้านประโยชน์และการนำไปใช้ประโยชน์ (Outcome / Impact)',
                'question' => 'โครงการนี้มีความสำคัญ ประโยชน์ และควรจะมีการจัดในครั้งต่อไป',
            ],
        ];
    }
}

