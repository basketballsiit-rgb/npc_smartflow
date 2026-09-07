<?php

namespace App\Http\Controllers;

use App\Models\ExpenseClearing;
use App\Models\Project;
use App\Models\Budget;
use App\Models\RoutineBudgetPlan;
use App\Models\TravelLoan;
use App\Models\Procurement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseClearingController extends Controller
{
    /**
     * Store a new expense clearing record (either with loan or direct reimbursement).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'clearing_type' => 'required|in:with_loan,direct_reimburse',
            'project_id' => 'nullable|exists:projects,id',
            'routine_budget_plan_id' => 'nullable|exists:routine_budget_plans,id',
            'funding_source_id' => 'nullable|exists:funding_sources,id',
            'travel_loan_id' => 'nullable|exists:travel_loans,id',
            'procurement_id' => 'nullable|exists:procurements,id',
            'claimant_name' => 'required|string|max:255',
            'claimant_position' => 'nullable|string|max:255',
            'claimant_department' => 'nullable|string|max:255',
            'title' => 'required|string|max:500',
            'expense_date' => 'nullable|date',
            'loan_amount' => 'nullable|numeric|min:0',
            'actual_spent_amount' => 'required|numeric|min:0',
            'expense_items' => 'nullable|array',
            'receipt_count' => 'nullable|integer|min:0',
            'receipt_reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ], [
            'claimant_name.required' => 'กรุณาระบุชื่อผู้ขอเบิก / ผู้ยืมเงิน',
            'title.required' => 'กรุณาระบุวัตถุประสงค์หรือเรื่องที่ขอเบิก/เคลียร์เงิน',
            'actual_spent_amount.required' => 'กรุณาระบุยอดค่าใช้จ่ายจ่ายจริงตามใบเสร็จ',
        ]);

        $user = auth()->user();
        $type = $validated['clearing_type'];
        $loanAmount = $type === 'with_loan' ? (float)($validated['loan_amount'] ?? 0) : 0.0;
        $actualSpent = (float)$validated['actual_spent_amount'];
        $diff = $actualSpent - $loanAmount;

        $result = 'exact';
        $diffAmount = 0.0;
        if ($type === 'with_loan') {
            if ($diff < -0.01) {
                $result = 'refund'; // Remaining money to return to college
                $diffAmount = abs($diff);
            } elseif ($diff > 0.01) {
                $result = 'reimburse'; // Deficit: spent more than loan, requesting additional reimbursement
                $diffAmount = $diff;
            } else {
                $result = 'exact';
                $diffAmount = 0.0;
            }
        } else {
            // Direct reimbursement: full amount is to be reimbursed
            $result = 'reimburse';
            $diffAmount = $actualSpent;
        }

        // Generate unique clearing number (CLR-2569-XXXX)
        $fiscalYear = (date('Y') + 543);
        $count = ExpenseClearing::whereYear('created_at', date('Y'))->count() + 1;
        $clearingNumber = 'CLR-' . $fiscalYear . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
        while (ExpenseClearing::where('clearing_number', $clearingNumber)->exists()) {
            $count++;
            $clearingNumber = 'CLR-' . $fiscalYear . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
        }

        $clearing = new ExpenseClearing();
        $clearing->clearing_number = $clearingNumber;
        $clearing->clearing_type = $type;
        $clearing->project_id = $validated['project_id'] ?? null;
        $clearing->routine_budget_plan_id = $validated['routine_budget_plan_id'] ?? null;
        $clearing->funding_source_id = $validated['funding_source_id'] ?? null;
        $clearing->travel_loan_id = $validated['travel_loan_id'] ?? null;
        $clearing->procurement_id = $validated['procurement_id'] ?? null;
        $clearing->user_id = $user->id;
        $clearing->claimant_name = $validated['claimant_name'];
        $clearing->claimant_position = $validated['claimant_position'] ?? $user->position;
        $clearing->claimant_department = $validated['claimant_department'] ?? $user->department?->name;
        $clearing->title = $validated['title'];
        $clearing->expense_date = $validated['expense_date'] ?? now()->toDateString();
        $clearing->loan_amount = $loanAmount;
        $clearing->actual_spent_amount = $actualSpent;
        $clearing->difference_amount = $diffAmount;
        $clearing->clearing_result = $result;
        $clearing->expense_items = $validated['expense_items'] ?? [];
        $clearing->receipt_count = (int)($validated['receipt_count'] ?? 0);
        $clearing->receipt_reference = $validated['receipt_reference'] ?? null;
        $clearing->status = 'pending_plan';
        $clearing->plan_notes = $validated['notes'] ?? null;
        $clearing->save();

        return redirect()->back()->with('message', 'บันทึกข้อมูลการเคลียร์เงิน/ขอเบิกจ่ายเรียบร้อยแล้ว (รหัส: ' . $clearingNumber . ') ส่งต่อให้งานแผนงานตรวจสอบและตัดยอดงบประมาณ');
    }

    /**
     * Planning Head approves and cuts/adjusts the budget.
     */
    public function planApprove(Request $request, ExpenseClearing $clearing)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานแผนงานหรือผู้ดูแลระบบเท่านั้นที่สามารถอนุมัติตัดยอดงบประมาณได้');
        }

        $validated = $request->validate([
            'plan_doc_number' => 'required|string|max:100',
            'plan_notes' => 'nullable|string|max:1000',
        ], [
            'plan_doc_number.required' => 'กรุณาระบุเลขที่ตัดยอดงานแผนงาน (เช่น ผง. 15/2569)',
        ]);

        $actualSpent = (float)$clearing->actual_spent_amount;

        // 1. If linked to a Project
        if ($clearing->project_id) {
            $project = Project::find($clearing->project_id);
            if ($project) {
                $budget = $project->budget;
                if (!$budget) {
                    $budget = new Budget();
                    $budget->project_id = $project->id;
                    $budget->funding_source_id = $project->funding_source_id;
                    $budget->allocated_amount = (float)($project->allocated_budget ?: $project->estimated_budget);
                }

                if ($clearing->clearing_type === 'with_loan') {
                    // With Loan: Set spent_amount to actual spent, release remaining encumbrance
                    $budget->spent_amount = $actualSpent;
                    $budget->encumbered_amount = $actualSpent;
                    $budget->advance_cleared_at = now();
                    $budget->save();

                    // Update Procurement loan_status if linked
                    if ($clearing->procurement_id) {
                        $proc = Procurement::find($clearing->procurement_id);
                        if ($proc) {
                            $proc->loan_status = 'cleared';
                            $proc->save();
                        }
                    }
                } else {
                    // Direct Reimbursement: Deduct directly from budget
                    $budget->spent_amount = (float)($budget->spent_amount ?: 0) + $actualSpent;
                    $budget->encumbered_amount = (float)($budget->encumbered_amount ?: 0) + $actualSpent;
                    $budget->save();
                }
            }
        }

        // 2. If linked to Routine Budget Plan
        if ($clearing->routine_budget_plan_id) {
            $rbp = RoutineBudgetPlan::find($clearing->routine_budget_plan_id);
            if ($rbp) {
                if ($clearing->clearing_type === 'with_loan') {
                    $rbp->spent_amount = $actualSpent;
                    $rbp->encumbered_amount = $actualSpent;
                } else {
                    $rbp->spent_amount = (float)($rbp->spent_amount ?: 0) + $actualSpent;
                    $rbp->encumbered_amount = (float)($rbp->encumbered_amount ?: 0) + $actualSpent;
                }
                $rbp->save();
            }
        }

        // 3. If linked to Travel Loan
        if ($clearing->travel_loan_id) {
            $travelLoan = TravelLoan::find($clearing->travel_loan_id);
            if ($travelLoan) {
                $travelLoan->loan_status = 'cleared';
                $travelLoan->cleared_amount = $actualSpent;
                $travelLoan->refund_amount = $clearing->clearing_result === 'refund' ? (float)$clearing->difference_amount : 0;
                $travelLoan->cleared_at = now();
                $travelLoan->clearance_ref_id = $clearing->clearing_number;
                $travelLoan->save();
            }
        }

        // Update Clearing Record
        $clearing->status = 'plan_approved';
        $clearing->plan_doc_number = $validated['plan_doc_number'];
        $clearing->plan_approved_at = now();
        $clearing->plan_approved_by = $user->id;
        $clearing->plan_notes = $validated['plan_notes'] ?? $clearing->plan_notes;
        $clearing->save();

        return redirect()->back()->with('message', 'งานแผนงานได้อนุมัติตัดยอดงบประมาณเรียบร้อยแล้ว (เลขที่ตัดยอด: ' . $validated['plan_doc_number'] . ') ส่งเรื่องต่อไปยังงานการเงิน');
    }

    /**
     * Finance Department marks as completed (received refund or paid reimbursement).
     */
    public function financeComplete(Request $request, ExpenseClearing $clearing)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isFinanceStaff()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานการเงินหรือผู้ดูแลระบบเท่านั้นที่สามารถปิดยอดการเงินได้');
        }

        $validated = $request->validate([
            'finance_doc_number' => 'nullable|string|max:100',
            'finance_payment_ref' => 'nullable|string|max:255',
            'finance_notes' => 'nullable|string|max:1000',
        ]);

        $clearing->status = 'finance_completed';
        $clearing->finance_doc_number = $validated['finance_doc_number'] 
            ?? ('กง.เคลียร์ ' . $clearing->id . '/' . (date('Y') + 543));
        $clearing->finance_completed_at = now();
        $clearing->finance_completed_by = $user->id;
        $clearing->finance_payment_ref = $validated['finance_payment_ref'] ?? 'โอนเงิน/รับเงินคืนเข้าคลังเรียบร้อย';
        $clearing->finance_notes = $validated['finance_notes'] ?? null;
        $clearing->save();

        return redirect()->back()->with('message', 'งานการเงินได้บันทึกรับเงินคืน/โอนเงินชดเชย และปิดยอดการเคลียร์เงินสมบูรณ์แล้ว');
    }

    /**
     * Delete an unapproved clearing record.
     */
    public function destroy(ExpenseClearing $clearing)
    {
        $user = auth()->user();
        if ($clearing->status !== 'pending_plan' && !$user->isAdmin()) {
            abort(403, 'ไม่สามารถลบรายการที่ผ่านการอนุมัติตัดยอดแล้วได้');
        }

        if ($clearing->user_id !== $user->id && !$user->isAdmin() && !$user->isPlanHead()) {
            abort(403, 'ไม่มีสิทธิ์ลบรายการนี้');
        }

        $clearing->delete();

        return redirect()->back()->with('message', 'ลบรายการเคลียร์เงินเรียบร้อยแล้ว');
    }

    /**
     * Printable A4 clearing and reimbursement report.
     */
    public function print(ExpenseClearing $clearing)
    {
        $clearing->load([
            'project.department',
            'routineBudgetPlan.department',
            'fundingSource',
            'travelLoan',
            'user',
            'planApprover',
            'financeApprover'
        ]);

        return view('clearings.print', [
            'clearing' => $clearing,
        ]);
    }
}
