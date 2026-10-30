<?php

namespace App\Http\Controllers;

use App\Models\TravelLoan;
use App\Models\FundingSource;
use App\Services\DocumentNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TravelLoanWebController extends Controller
{
    /**
     * Plan Department: Cut Budget for Travel Loan
     */
    public function planCut(Request $request, TravelLoan $travelLoan)
    {
        $validated = $request->validate([
            'funding_source_id' => 'required|exists:funding_sources,id',
            'project_id'        => 'nullable|exists:projects,id',
            'expense_type'      => 'nullable|string|max:150',
            'budget_category'   => 'nullable|in:in_budget,off_budget',
            'plan_doc_number'   => 'nullable|string|max:100',
            'plan_notes'        => 'nullable|string|max:500',
        ]);

        $budgetCategory = $validated['budget_category'] ?? ($validated['funding_source_id'] == 11 ? 'off_budget' : 'in_budget');
        $loanPreview = DocumentNumberService::previewNextLoan($budgetCategory);

        // Auto-generate loan document number (separated from procurement and categorized by in/off budget)
        if (!empty($validated['plan_doc_number'])) {
            $docNumber = trim($validated['plan_doc_number']);
            if ($docNumber === $loanPreview) {
                DocumentNumberService::generateAndIncrementLoan($budgetCategory);
            }
        } else {
            $docNumber = DocumentNumberService::generateAndIncrementLoan($budgetCategory);
        }

        // Use the existing contract number or assign the newly generated loan number
        $contractNumber = !empty($travelLoan->contract_no) ? $travelLoan->contract_no : $docNumber;

        $travelLoan->update([
            'contract_no'       => $contractNumber,
            'funding_source_id' => $validated['funding_source_id'],
            'project_id'        => $validated['project_id'] ?? null,
            'expense_type'      => $validated['expense_type'] ?? null,
            'budget_category'   => $budgetCategory,
            'plan_doc_number'   => $docNumber,
            'plan_cut_at'       => now(),
            'plan_cut_by'       => Auth::id(),
            'plan_notes'        => $validated['plan_notes'] ?? null,
            'loan_status'       => 'plan_cut',
        ]);

        \App\Services\NotificationService::notifyFinanceDisbursementNeeded($travelLoan);

        $categoryName = $budgetCategory === 'off_budget' ? 'เงินนอกงบประมาณ (บกศ.)' : 'เงินในระบบ';
        return redirect()->back()->with('success', "งานแผนงานลงรับและตัดยอดงบประมาณ [{$categoryName}] สำเร็จ เลขที่สัญญา: {$contractNumber} (ส่งต่อให้งานการเงินเรียบร้อยแล้ว)");
    }

    /**
     * Plan Department / Admin: Register Manual Paper Loan Submission
     */
    public function createManualLoan(Request $request)
    {
        $validated = $request->validate([
            'borrower_name'        => 'required|string|max:255',
            'borrower_position'    => 'nullable|string|max:255',
            'borrower_department'  => 'nullable|string|max:255',
            'borrower_staff_type'  => 'nullable|string|max:100',
            'subject'              => 'required|string|max:1000',
            'destination'          => 'nullable|string|max:255',
            'start_date'           => 'nullable|date',
            'end_date'             => 'nullable|date',
            'total_days'           => 'nullable|numeric|min:0',
            'doc_date'             => 'nullable|date',
            'due_date'             => 'nullable|date',
            'return_days'          => 'nullable|numeric|min:0',
            'budget_category'      => 'required|in:in_budget,off_budget',
            'funding_source_id'    => 'required|exists:funding_sources,id',
            'project_id'           => 'nullable|exists:projects,id',
            'expense_type'         => 'nullable|string|max:150',
            'allowance_amount'     => 'nullable|numeric|min:0',
            'allowance_detail'     => 'nullable|string|max:500',
            'rent_amount'          => 'nullable|numeric|min:0',
            'rent_detail'          => 'nullable|string|max:500',
            'vehicle_amount'       => 'nullable|numeric|min:0',
            'vehicle_detail'       => 'nullable|string|max:500',
            'other_amount'         => 'nullable|numeric|min:0',
            'other_detail'         => 'nullable|string|max:500',
            'total_loan_amount'    => 'required|numeric|min:0.01',
            'plan_doc_number'      => 'nullable|string|max:100',
            'plan_notes'           => 'nullable|string|max:500',
            'direct_cut'           => 'nullable|boolean',
        ]);

        $budgetCategory = $validated['budget_category'];
        $directCut = $request->boolean('direct_cut', true);

        // Auto-generate or assign loan number
        $loanPreview = DocumentNumberService::previewNextLoan($budgetCategory);
        if (!empty($validated['plan_doc_number'])) {
            $docNumber = trim($validated['plan_doc_number']);
            if ($docNumber === $loanPreview) {
                DocumentNumberService::generateAndIncrementLoan($budgetCategory);
            }
        } else {
            $docNumber = DocumentNumberService::generateAndIncrementLoan($budgetCategory);
        }

        $travelId = 'MANUAL-' . date('Ymd') . '-' . strtoupper(\Illuminate\Support\Str::random(6));
        $docDate = !empty($validated['doc_date']) ? $validated['doc_date'] : now()->toDateString();
        $returnDays = !empty($validated['return_days']) ? (int)$validated['return_days'] : 30;
        $dueDate = !empty($validated['due_date']) 
            ? $validated['due_date'] 
            : (!empty($validated['end_date']) ? \Carbon\Carbon::parse($validated['end_date'])->addDays($returnDays)->toDateString() : now()->addDays($returnDays)->toDateString());

        $totalLoanAmount = (float)$validated['total_loan_amount'];
        $thaiBahtText = self::toThaiBahtText($totalLoanAmount);

        $travelLoan = TravelLoan::create([
            'travel_id'            => $travelId,
            'contract_no'          => $docNumber,
            'system_source'        => 'manual',
            'borrower_name'        => $validated['borrower_name'],
            'borrower_position'    => $validated['borrower_position'] ?? null,
            'borrower_department'  => $validated['borrower_department'] ?? null,
            'borrower_staff_type'  => $validated['borrower_staff_type'] ?? 'บุคลากรทางการศึกษา',
            'subject'              => $validated['subject'],
            'destination'          => $validated['destination'] ?? null,
            'start_date'           => $validated['start_date'] ?? null,
            'end_date'             => $validated['end_date'] ?? null,
            'total_days'           => $validated['total_days'] ?? 1,
            'doc_date'             => $docDate,
            'due_date'             => $dueDate,
            'return_days'          => $returnDays,
            'project_id'           => $validated['project_id'] ?? null,
            'funding_source_id'    => $validated['funding_source_id'],
            'budget_category'      => $budgetCategory,
            'expense_type'         => $validated['expense_type'] ?? 'allowance_rent_vehicle',
            'allowance_amount'     => (float)($validated['allowance_amount'] ?? 0),
            'allowance_detail'     => $validated['allowance_detail'] ?? null,
            'rent_amount'          => (float)($validated['rent_amount'] ?? 0),
            'rent_detail'          => $validated['rent_detail'] ?? null,
            'vehicle_amount'       => (float)($validated['vehicle_amount'] ?? 0),
            'vehicle_detail'       => $validated['vehicle_detail'] ?? null,
            'other_amount'         => (float)($validated['other_amount'] ?? 0),
            'other_detail'         => $validated['other_detail'] ?? null,
            'total_loan_amount'    => $totalLoanAmount,
            'thai_baht_text'       => $thaiBahtText,
            'loan_status'          => $directCut ? 'plan_cut' : 'pending_plan',
            'plan_doc_number'      => $docNumber,
            'plan_cut_at'          => $directCut ? now() : null,
            'plan_cut_by'          => $directCut ? Auth::id() : null,
            'plan_notes'           => $validated['plan_notes'] ?? null,
            'approved_at'          => now(),
        ]);

        if ($directCut) {
            \App\Services\NotificationService::notifyFinanceDisbursementNeeded($travelLoan);
        }

        $categoryName = $budgetCategory === 'off_budget' ? 'เงินนอกงบประมาณ (บกศ.)' : 'เงินในระบบ';
        return redirect()->back()->with('success', "บันทึกลงรับสัญญายืมเงินแบบยื่นเอกสาร/แมนนวล [{$categoryName}] สำเร็จ เลขที่สัญญา: {$docNumber}" . ($directCut ? " (ตัดยอดและส่งต่อให้งานการเงินเรียบร้อยแล้ว)" : ""));
    }

    /**
     * Convert number to Thai Baht text representation
     */
    public static function toThaiBahtText(float $amount): string
    {
        $amount = round($amount, 2);
        if ($amount == 0) {
            return 'ศูนย์บาทถ้วน';
        }

        $parts = explode('.', sprintf('%.2f', $amount));
        $baht = (int)$parts[0];
        $satang = (int)$parts[1];

        $convert = function ($num) use (&$convert) {
            $digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
            $positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
            $text = '';
            $str = (string)$num;
            $len = strlen($str);

            for ($i = 0; $i < $len; $i++) {
                $n = (int)$str[$i];
                $pos = $len - $i - 1;

                if ($pos >= 6) {
                    $millionPart = (int)substr($str, 0, $len - 6);
                    $remPart = substr($str, -6);
                    return $convert($millionPart) . 'ล้าน' . $convert((int)$remPart);
                }

                if ($n !== 0) {
                    if ($pos === 0 && $n === 1 && $len > 1 && (int)$str[$len - 2] !== 0) {
                        $text .= 'เอ็ด';
                    } elseif ($pos === 1 && $n === 1) {
                        $text .= 'สิบ';
                    } elseif ($pos === 1 && $n === 2) {
                        $text .= 'ยี่สิบ';
                    } else {
                        $text .= $digits[$n] . $positions[$pos];
                    }
                }
            }
            return $text;
        };

        $result = $baht > 0 ? $convert($baht) . 'บาท' : '';
        if ($satang > 0) {
            $result .= $convert($satang) . 'สตางค์';
        } else {
            $result .= 'ถ้วน';
        }

        return $result;
    }

    /**
     * Finance Department: Receive Travel Loan Contract
     */
    public function financeReceive(Request $request, TravelLoan $travelLoan)
    {
        $validated = $request->validate([
            'finance_doc_number' => 'nullable|string|max:100',
        ]);

        // Prioritize the exact contract number / plan doc number assigned by plan department from the beginning
        $docNumber = $travelLoan->contract_no 
            ?: ($travelLoan->plan_doc_number 
            ?: (!empty($validated['finance_doc_number']) ? trim($validated['finance_doc_number']) : ('สย.' . $travelLoan->id . '/' . (date('Y') + 543))));

        $travelLoan->update([
            'contract_no'        => $docNumber,
            'plan_doc_number'    => $travelLoan->plan_doc_number ?: $docNumber,
            'finance_doc_number' => $docNumber,
            'finance_received_at' => now(),
            'loan_status'        => 'finance_received',
        ]);

        return redirect()->back()->with('success', "งานการเงินลงรับสัญญายืมเงินสำเร็จ โดยใช้เลขที่สัญญา: {$docNumber} (ชุดเดียวกับงานแผนงาน)");
    }

    /**
     * Finance Department: Disburse Loan Amount
     */
    public function financeDisburse(Request $request, TravelLoan $travelLoan)
    {
        $validated = $request->validate([
            'finance_disbursed_amount' => 'required|numeric|min:0.01',
            'finance_payment_ref' => 'nullable|string|max:255',
            'disburse_date' => 'nullable|date',
        ]);

        $disburseAt = !empty($validated['disburse_date']) 
            ? \Carbon\Carbon::parse($validated['disburse_date']) 
            : now();

        $travelLoan->update([
            'finance_disbursed_amount' => (float)$validated['finance_disbursed_amount'],
            'finance_disbursed_at' => $disburseAt,
            'finance_payment_ref' => $validated['finance_payment_ref'] ?? null,
            'loan_status' => 'disbursed',
        ]);

        return redirect()->back()->with('success', "บันทึกการโอน/จ่ายเงินยืมไปราชการเรียบร้อยแล้ว จำนวน " . number_format($validated['finance_disbursed_amount'], 2) . " บาท");
    }

    /**
     * Rollback status if needed
     */
    public function rollback(Request $request, TravelLoan $travelLoan)
    {
        $current = $travelLoan->loan_status;

        if ($current === 'disbursed') {
            $travelLoan->update([
                'loan_status' => 'finance_received',
                'finance_disbursed_at' => null,
                'finance_disbursed_amount' => null,
                'finance_payment_ref' => null,
            ]);
            return redirect()->back()->with('success', 'ยกเลิกการจ่ายเงินยืมและย้อนสถานะกลับเป็น "การเงินลงรับแล้ว"');
        }

        if ($current === 'finance_received') {
            $travelLoan->update([
                'loan_status' => 'plan_cut',
                'finance_received_at' => null,
                'finance_doc_number' => null,
            ]);
            return redirect()->back()->with('success', 'ยกเลิกการลงรับและย้อนสถานะกลับเป็น "แผนงานตัดยอดแล้ว"');
        }

        if ($current === 'plan_cut') {
            $travelLoan->update([
                'loan_status' => 'pending_plan',
                'plan_cut_at' => null,
                'plan_cut_by' => null,
                'plan_doc_number' => null,
            ]);
            return redirect()->back()->with('success', 'ยกเลิกการตัดยอดงบประมาณและย้อนสถานะกลับเป็น "รอแผนงานตัดยอด"');
        }

        return redirect()->back()->with('error', 'ไม่สามารถย้อนสถานะได้ในขั้นตอนนี้');
    }

    /**
     * Generate a Mock Travel Loan from npc_eleve for demonstration / verification
     */
    public function generateMockLoan(Request $request)
    {
        $mockId = (string)\Illuminate\Support\Str::uuid();
        $randomSeq = str_pad((string)rand(1, 999), 3, '0', STR_PAD_LEFT);
        $contractNo = 'สย.' . $randomSeq . '/' . (date('Y') + 543);
        
        TravelLoan::create([
            'travel_id' => $mockId,
            'contract_no' => $contractNo,
            'system_source' => 'npc_eleve',
            
            'borrower_user_id' => 1,
            'borrower_name' => 'นายมาโนชญ์ ชัยศรีหา',
            'borrower_position' => 'ครูชำนาญการพิเศษ',
            'borrower_department' => 'แผนกวิชาช่างยนต์',
            'borrower_staff_type' => 'ข้าราชการครู',

            'subject' => 'ไปราชการเพื่อเข้าร่วมการประชุมเชิงปฏิบัติการการพัฒนาหลักสูตร',
            'destination' => 'โรงแรมเซ็นทารา แกรนด์ กรุงเทพฯ',
            'start_date' => now()->addDays(3)->toDateString(),
            'end_date' => now()->addDays(5)->toDateString(),
            'total_days' => 3,
            'doc_date' => now()->toDateString(),
            'due_date' => now()->addDays(33)->toDateString(),
            'return_days' => 30,
            'project_id' => null,
            'expense_type' => 'allowance_rent_vehicle',

            'allowance_amount' => 2400.00,
            'allowance_detail' => 'เบี้ยเลี้ยง 3 วัน x 2 คน x 400 บาท',
            'rent_amount' => 3600.00,
            'rent_detail' => 'ค่าที่พัก 2 คืน x 1,800 บาท',
            'vehicle_amount' => 1500.00,
            'vehicle_detail' => 'ค่าน้ำมันเชื้อเพลิงพาหนะส่วนบุคคล',
            'other_amount' => 500.00,
            'other_detail' => 'ค่าผ่านทางพิเศษ',

            'total_loan_amount' => 8000.00,
            'thai_baht_text' => 'แปดพันบาทถ้วน',
            'loan_status' => 'pending_plan',

            'approved_at' => now(),
            'approved_by_director' => 'นายกเชษฐ์ กิ่งชนะ',
            'approved_by_deputy' => 'นายวิโรจน์ แสงดาว',
            'finance_checked_by' => 'นางสาวดวงดาว ไชยเขียว',
        ]);

        return redirect()->back()->with('success', "จำลองการส่งข้อมูลสัญญายืมเงินจากระบบ npc_eleve สำเร็จ! สัญญาเลขที่: {$contractNo} เข้าสู่คิวรอแผนงานตัดยอดแล้ว");
    }

    /**
     * Authorize Admin only
     */
    protected function authorizeAdmin()
    {
        $user = Auth::user();
        if (!$user || (!$user->isAdmin() && !$user->is_admin && $user->role?->name !== 'admin')) {
            abort(403, 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่มีสิทธิ์ดำเนินการนี้');
        }
    }

    /**
     * Admin: Update Travel Loan
     */
    public function update(Request $request, TravelLoan $travelLoan)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'contract_no' => 'nullable|string|max:100',
            'doc_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'return_days' => 'nullable|numeric|min:0',
            
            'borrower_name' => 'required|string|max:255',
            'borrower_position' => 'nullable|string|max:255',
            'borrower_department' => 'nullable|string|max:255',
            
            'subject' => 'required|string|max:1000',
            'destination' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'total_days' => 'nullable|numeric|min:0',
            
            'allowance_amount' => 'nullable|numeric|min:0',
            'rent_amount' => 'nullable|numeric|min:0',
            'vehicle_amount' => 'nullable|numeric|min:0',
            'other_amount' => 'nullable|numeric|min:0',
            'total_loan_amount' => 'required|numeric|min:0',
            
            'loan_status' => 'required|in:pending_plan,pending,plan_cut,finance_received,disbursed,cleared',
            'funding_source_id' => 'nullable|exists:funding_sources,id',
            'expense_type' => 'nullable|string|max:150',
            'plan_doc_number' => 'nullable|string|max:100',
            'plan_notes' => 'nullable|string|max:500',
            'finance_doc_number' => 'nullable|string|max:100',
            'finance_disbursed_amount' => 'nullable|numeric|min:0',
            'finance_payment_ref' => 'nullable|string|max:255',
        ]);

        if (!isset($validated['total_loan_amount']) || $validated['total_loan_amount'] <= 0) {
            $validated['total_loan_amount'] = (float)($validated['allowance_amount'] ?? 0)
                + (float)($validated['rent_amount'] ?? 0)
                + (float)($validated['vehicle_amount'] ?? 0)
                + (float)($validated['other_amount'] ?? 0);
        }

        $travelLoan->update($validated);

        return redirect()->back()->with('success', "บันทึกการแก้ไขสัญญายืมเงินเลขที่ " . ($travelLoan->contract_no ?? $travelLoan->id) . " เรียบร้อยแล้ว");
    }

    /**
     * Admin: Delete Travel Loan
     */
    public function destroy(TravelLoan $travelLoan)
    {
        $this->authorizeAdmin();

        $contractNo = $travelLoan->contract_no ?? ("ID: #" . $travelLoan->id);
        $travelLoan->delete();

        return redirect()->back()->with('success', "ลบสัญญายืมเงินไปราชการเลขที่ {$contractNo} เรียบร้อยแล้ว");
    }
}
