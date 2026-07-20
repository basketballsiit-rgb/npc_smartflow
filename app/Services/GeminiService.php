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
}
