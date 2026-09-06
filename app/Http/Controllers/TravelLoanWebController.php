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
}
