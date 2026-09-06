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
            'plan_doc_number' => 'nullable|string|max:100',
            'plan_notes' => 'nullable|string|max:500',
        ]);

        // Generate unified document number or use provided one
        if (!empty($validated['plan_doc_number'])) {
            $docNumber = trim($validated['plan_doc_number']);
            if ($docNumber === DocumentNumberService::previewNext()) {
                DocumentNumberService::generateAndIncrement();
            }
        } else {
            $docNumber = DocumentNumberService::generateAndIncrement();
        }

        $travelLoan->update([
            'funding_source_id' => $validated['funding_source_id'],
            'plan_doc_number' => $docNumber,
            'plan_cut_at' => now(),
            'plan_cut_by' => Auth::id(),
            'plan_notes' => $validated['plan_notes'] ?? null,
            'loan_status' => 'plan_cut',
        ]);

        return redirect()->back()->with('success', "แผนงานตัดยอดงบประมาณสัญญายืมเงินสำเร็จ เลขที่เอกสาร: {$docNumber}");
    }

    /**
     * Finance Department: Receive Travel Loan Contract
     */
    public function financeReceive(Request $request, TravelLoan $travelLoan)
    {
        $validated = $request->validate([
            'finance_doc_number' => 'nullable|string|max:100',
        ]);

        $docNumber = !empty($validated['finance_doc_number']) 
            ? trim($validated['finance_doc_number']) 
            : ('REC-TL-' . date('Ymd') . '-' . str_pad($travelLoan->id, 4, '0', STR_PAD_LEFT));

        $travelLoan->update([
            'finance_doc_number' => $docNumber,
            'finance_received_at' => now(),
            'loan_status' => 'finance_received',
        ]);

        return redirect()->back()->with('success', "งานการเงินลงรับสัญญายืมเงินสำเร็จ เลขที่ลงรับ: {$docNumber}");
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
