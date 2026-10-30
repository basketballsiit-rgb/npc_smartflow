<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Procurement;
use App\Models\ProcurementItem;
use App\Models\RoutineBudgetPlan;
use App\Models\AuditLog;
use App\Services\DocumentNumberService;
use App\Services\GeminiService;
use Illuminate\Http\Request;

class ProcurementController extends Controller
{
    /**
     * Assign committees for the project procurement pipeline.
     */
    public function assignCommittees(Request $request, Project $project)
    {
        // Procurement Head, Admin, or Project Owner can assign committees & items
        if (!auth()->user()->isProcurementHead() && !auth()->user()->isAdmin() && auth()->id() !== $project->user_id) {
            abort(403, 'เฉพาะเจ้าหน้าที่พัสดุ ผู้ดูแลระบบ หรือผู้เสนอโครงการเท่านั้นที่สามารถดำเนินการพัสดุได้');
        }

        $validated = $request->validate([
            'purchasing_chair' => 'required|exists:users,id',
            'purchasing_members' => 'required|array|min:2|max:2',
            'purchasing_members.*' => 'required|exists:users,id',
            'inspection_chair' => 'required|exists:users,id',
            'inspection_members' => 'required|array|min:2|max:2',
            'inspection_members.*' => 'required|exists:users,id',
        ]);

        // Find or create procurement record
        $procurement = Procurement::firstOrCreate(
            ['project_id' => $project->id],
            [
                'status' => 'pending'
            ]
        );

        // Sync committees pivot table
        $syncData = [];

        // Add Purchasing Chair
        $syncData[$validated['purchasing_chair']] = ['committee_type' => 'purchasing', 'role' => 'chairperson'];
        // Add Purchasing Members
        foreach ($validated['purchasing_members'] as $memberId) {
            $syncData[$memberId] = ['committee_type' => 'purchasing', 'role' => 'member'];
        }

        // Add Inspection Chair
        $syncData[$validated['inspection_chair']] = ['committee_type' => 'inspection', 'role' => 'chairperson'];
        // Add Inspection Members
        foreach ($validated['inspection_members'] as $memberId) {
            $syncData[$memberId] = ['committee_type' => 'inspection', 'role' => 'member'];
        }

        // Save to pivot table
        $procurement->committees()->sync($syncData);

        // Auto-create some mock items for the estimation document if none exist
        if ($procurement->items()->count() === 0) {
            $procurement->items()->createMany([
                [
                    'description' => 'จัดซื้อวัสดุคอมพิวเตอร์เพื่อการเรียนการสอน',
                    'quantity' => 1.00,
                    'unit' => 'งาน',
                    'unit_price' => $project->estimated_budget,
                    'total_price' => $project->estimated_budget,
                ]
            ]);
        }

        return redirect()->route('dashboard')->with('message', 'Procurement committees appointed successfully.');
    }

    /**
     * Save or update procurement items and committees.
     */
    public function saveProcurement(Request $request, Project $project)
    {
        if (!auth()->user()->isProcurementHead() && !auth()->user()->isAdmin() && auth()->id() !== $project->user_id) {
            abort(403, 'เฉพาะเจ้าหน้าที่พัสดุ ผู้ดูแลระบบ หรือผู้เสนอโครงการเท่านั้นที่สามารถดำเนินการพัสดุได้');
        }

        if (!in_array($project->status, ['approved', 'in_progress', 'evaluating', 'completed']) && $project->current_approval_step < 6) {
            return redirect()->back()->with('error', 'โครงการนี้ยังไม่ผ่านการอนุมัติสมบูรณ์ในแท็บที่ 1 (Plan) จึงยังไม่สามารถดำเนินการจัดซื้อจัดจ้างได้');
        }

        $validated = $request->validate([
            'purchasing_chair' => 'nullable|exists:users,id',
            'purchasing_member1' => 'nullable|exists:users,id',
            'purchasing_member2' => 'nullable|exists:users,id',
            'inspection_chair' => 'nullable|exists:users,id',
            'inspection_member1' => 'nullable|exists:users,id',
            'inspection_member2' => 'nullable|exists:users,id',
            'tor_specifications' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit' => 'required|string',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $procurement = Procurement::firstOrCreate(
            ['project_id' => $project->id],
            [
                'status' => 'pending'
            ]
        );

        if ($request->has('tor_specifications')) {
            $procurement->tor_specifications = $request->input('tor_specifications');
            $procurement->save();
        }

        // Sync Committees
        $syncData = [];
        if (!empty($validated['purchasing_chair'])) {
            $syncData[$validated['purchasing_chair']] = ['committee_type' => 'purchasing', 'role' => 'chairperson'];
        }
        if (!empty($validated['purchasing_member1'])) {
            $syncData[$validated['purchasing_member1']] = ['committee_type' => 'purchasing', 'role' => 'member'];
        }
        if (!empty($validated['purchasing_member2'])) {
            $syncData[$validated['purchasing_member2']] = ['committee_type' => 'purchasing', 'role' => 'member'];
        }
        if (!empty($validated['inspection_chair'])) {
            $syncData[$validated['inspection_chair']] = ['committee_type' => 'inspection', 'role' => 'chairperson'];
        }
        if (!empty($validated['inspection_member1'])) {
            $syncData[$validated['inspection_member1']] = ['committee_type' => 'inspection', 'role' => 'member'];
        }
        if (!empty($validated['inspection_member2'])) {
            $syncData[$validated['inspection_member2']] = ['committee_type' => 'inspection', 'role' => 'member'];
        }

        if (!empty($syncData)) {
            $procurement->committees()->sync($syncData);
        }

        // Validate total procurement items sum against approved allocated budget
        $allocatedBudget = $project->budget ? floatval($project->budget->allocated_amount) : floatval($project->estimated_budget);
        
        if (!empty($request->input('items'))) {
            $totalProcurementSum = 0;
            foreach ($request->input('items') as $item) {
                $totalProcurementSum += (floatval($item['quantity']) * floatval($item['unit_price']));
            }

            if ($totalProcurementSum > ($allocatedBudget + 0.01)) {
                return redirect()->back()->with('error', 'ไม่สามารถบันทึกได้: ยอดรวมพัสดุจัดซื้อจัดจ้าง (' . number_format($totalProcurementSum, 2) . ' บาท) เกินวงเงินงบประมาณที่ได้รับอนุมัติ (' . number_format($allocatedBudget, 2) . ' บาท)');
            }
        }

        // Save Items
        if (!empty($request->input('items'))) {
            $procurement->items()->delete();
            foreach ($request->input('items') as $item) {
                $procurement->items()->create([
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit' => $item['unit'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => floatval($item['quantity']) * floatval($item['unit_price']),
                ]);
            }
        } else if ($procurement->items()->count() === 0) {
            $procurement->items()->create([
                'description' => 'จัดซื้อวัสดุอุปกรณ์และดำเนินงานตามโครงการ ' . $project->title,
                'quantity' => 1,
                'unit' => 'งาน',
                'unit_price' => $project->budget ? $project->budget->allocated_amount : $project->estimated_budget,
                'total_price' => $project->budget ? $project->budget->allocated_amount : $project->estimated_budget,
            ]);
        }

        // Auto-advance project status to 'in_progress' (PDCA Do phase / Step 4)
        if ($project->status === 'approved') {
            $project->status = 'in_progress';
            $project->save();
        }

        return redirect()->back()->with('message', 'บันทึกข้อมูลจัดซื้อจัดจ้าง และเข้าสู่ขั้นตอนการดำเนินโครงการเรียบร้อยแล้ว');
    }

    /**
     * Procurement staff acknowledges and receives the procurement package.
     */
    public function receive(Request $request, Project $project)
    {
        if (!auth()->user()->isProcurementHead() && !auth()->user()->isAdmin()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานพัสดุหรือผู้ดูแลระบบเท่านั้นที่สามารถลงรับได้');
        }

        $request->validate([
            'procurement_number' => 'nullable|string|max:100',
            'memo_date' => 'nullable|date',
        ]);

        $procurement = Procurement::firstOrCreate(
            ['project_id' => $project->id],
            [
                'status' => 'pending'
            ]
        );

        // Single document number determined by Planning or provided by staff
        if ($request->filled('procurement_number')) {
            $docNumber = trim($request->input('procurement_number'));
        } else {
            $docNumber = $procurement->plan_procurement_doc_number ?: $procurement->plan_loan_doc_number;
        }

        if ($docNumber) {
            $procurement->procurement_number = $docNumber;
            if (empty($procurement->plan_procurement_doc_number)) {
                $procurement->plan_procurement_doc_number = $docNumber;
            }
        }

        $procurement->memo_date = $request->filled('memo_date') ? $request->input('memo_date') : now();
        $procurement->status = 'received';
        $procurement->save();

        if ($project->status === 'approved') {
            $project->status = 'in_progress';
            $project->save();
        }

        return redirect()->back()->with('message', 'งานพัสดุลงรับชุดจัดซื้อจัดจ้างโครงการ "' . $project->title . '" เรียบร้อยแล้ว');
    }

    /**
     * Procurement staff forwards the completed procurement package to finance.
     */
    /**
     * Planning staff acknowledges and cuts budget for procurement package and/or loan contract.
     */
    public function planCutBudget(Request $request, Project $project)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานวางแผนและงบประมาณหรือผู้ดูแลระบบเท่านั้นที่สามารถตัดยอดงบประมาณได้');
        }

        $validated = $request->validate([
            'target' => 'required|string|in:all,procurement,loan',
            'plan_doc_number' => 'nullable|string|max:100',
            'cut_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        $procurement = $project->procurement;
        if (!$procurement) {
            $procurement = Procurement::create([
                'project_id' => $project->id,
                'status' => 'pending',
                'loan_status' => 'pending',
            ]);
        }

        // Generate unified document number or use provided one
        if (!empty($validated['plan_doc_number'])) {
            $docNumber = trim($validated['plan_doc_number']);
            // If the entered number matches next preview, increment counter
            if ($docNumber === DocumentNumberService::previewNext()) {
                DocumentNumberService::generateAndIncrement();
            }
        } else {
            $docNumber = DocumentNumberService::generateAndIncrement();
        }

        $cutDateTime = !empty($validated['cut_date']) ? \Carbon\Carbon::parse($validated['cut_date']) : now();
        $target = $validated['target'];

        // Assign the single unified document number to both procurement and loan tracking fields
        if ($target === 'all' || $target === 'procurement') {
            $procurement->plan_procurement_cut_at = $cutDateTime;
            $procurement->plan_procurement_doc_number = $docNumber;
            // Also assign as default procurement_number if empty so it carries through to e-GP & PR forms
            if (empty($procurement->procurement_number) || str_starts_with($procurement->procurement_number, 'PR-')) {
                $procurement->procurement_number = $docNumber;
            }
            if ($procurement->status === 'pending' || empty($procurement->status)) {
                $procurement->status = 'plan_cut';
            }
        }

        if ($target === 'all' || $target === 'loan') {
            $procurement->plan_loan_cut_at = $cutDateTime;
            $procurement->plan_loan_doc_number = $docNumber;
            if ($procurement->loan_status === 'pending' || empty($procurement->loan_status)) {
                $procurement->loan_status = 'plan_cut';
            }

            // Encumber budget in budgets table
            $budget = $project->budget;
            if (!$budget) {
                $budget = new \App\Models\Budget();
                $budget->project_id = $project->id;
                $budget->funding_source_id = $project->funding_source_id;
            }
            $budget->allocated_amount = (float)($project->allocated_budget ?: $project->estimated_budget);
            $budget->encumbered_amount = $budget->allocated_amount;
            $budget->save();
        }

        $procurement->save();

        $targetText = $target === 'all' ? 'ทั้งชุดจัดซื้อจัดจ้างและสัญญายืมเงิน' : ($target === 'procurement' ? 'ชุดจัดซื้อจัดจ้าง (ส่งต่อไปยังพัสดุ)' : 'สัญญายืมเงิน (ส่งต่อไปยังการเงิน)');
        return redirect()->back()->with('message', 'งานแผนงานได้ออกเลขคุมหลักและตัดยอดงบประมาณ ' . $targetText . ' เรียบร้อยแล้ว (เลขคุมเอกสาร: ' . $docNumber . ')');
    }

    /**
     * Planning staff cuts budget for external paper documents (both non-project routine budget and project-based).
     */
    public function planCutExternalBudget(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานวางแผนและงบประมาณหรือผู้ดูแลระบบเท่านั้นที่สามารถตัดยอดงบประมาณได้');
        }

        $validated = $request->validate([
            'cut_mode' => 'required|string|in:non_project,project',
            'target' => 'required|string|in:all,procurement,loan',
            'project_id' => 'required_if:cut_mode,project|nullable|exists:projects,id',
            'department_id' => 'required_if:cut_mode,non_project|nullable|exists:departments,id',
            'funding_source_id' => 'required_if:cut_mode,non_project|nullable|exists:funding_sources,id',
            'report_category' => 'nullable|string|max:50',
            'title' => 'required_if:cut_mode,non_project|nullable|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'proposer_name' => 'nullable|string|max:150',
            'plan_doc_number' => 'nullable|string|max:100',
            'cut_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        $target = $validated['target'];
        $cutDate = !empty($validated['cut_date']) ? \Carbon\Carbon::parse($validated['cut_date']) : now();
        $amount = (float)$validated['amount'];

        // Unified document number handling
        if (!empty($validated['plan_doc_number'])) {
            $docNumber = trim($validated['plan_doc_number']);
            if ($docNumber === DocumentNumberService::previewNext()) {
                DocumentNumberService::generateAndIncrement();
            }
        } else {
            $docNumber = DocumentNumberService::generateAndIncrement();
        }

        if ($validated['cut_mode'] === 'non_project') {
            $fiscalYear = \App\Models\SystemSetting::where('key', 'current_fiscal_year')->value('value')
                ?: (string)(date('Y') + 543 + (date('n') >= 10 ? 1 : 0));

            $routinePlan = RoutineBudgetPlan::create([
                'fiscal_year' => $fiscalYear,
                'department_id' => $validated['department_id'],
                'title' => $validated['title'],
                'allocated_amount' => $amount,
                'encumbered_amount' => $amount,
                'spent_amount' => $amount,
                'funding_source_id' => $validated['funding_source_id'],
                'report_category' => $validated['report_category'] ?: '2.2.1',
            ]);

            $memoSubject = $validated['title'];
            if (!empty($validated['proposer_name'])) {
                $memoSubject .= ' (ผู้ขอ: ' . $validated['proposer_name'] . ')';
            }

            $procurement = Procurement::create([
                'project_id' => null,
                'routine_budget_plan_id' => $routinePlan->id,
                'procurement_number' => $docNumber,
                'memo_subject' => $memoSubject,
                'memo_date' => $cutDate,
                'tor_specifications' => $validated['notes'] ?? null,
                'status' => ($target === 'all' || $target === 'procurement') ? 'plan_cut' : 'pending',
                'loan_status' => ($target === 'all' || $target === 'loan') ? 'plan_cut' : 'pending',
                'plan_procurement_cut_at' => ($target === 'all' || $target === 'procurement') ? $cutDate : null,
                'plan_procurement_doc_number' => ($target === 'all' || $target === 'procurement') ? $docNumber : null,
                'plan_loan_cut_at' => ($target === 'all' || $target === 'loan') ? $cutDate : null,
                'plan_loan_doc_number' => ($target === 'all' || $target === 'loan') ? $docNumber : null,
            ]);

            ProcurementItem::create([
                'procurement_id' => $procurement->id,
                'description' => $validated['title'],
                'quantity' => 1,
                'unit' => 'รายการ',
                'unit_price' => $amount,
                'total_price' => $amount,
            ]);

            $targetText = $target === 'all' ? 'ชุดจัดซื้อจัดจ้างและสัญญายืมเงิน' : ($target === 'procurement' ? 'ชุดจัดซื้อจัดจ้าง (ส่งต่อไปพัสดุ)' : 'สัญญายืมเงิน (ส่งต่อไปการเงิน)');
            return redirect()->back()->with('message', "งานแผนงานได้ออกเลขคุมหลักและตัดยอดงบประมาณ {$targetText} งบดำเนินงานทั่วไป (ไม่อิงโครงการ) เรียบร้อยแล้ว (เลขคุมเอกสาร: {$docNumber})");
        } else {
            $project = Project::findOrFail($validated['project_id']);
            $procurement = $project->procurement;
            if (!$procurement) {
                $procurement = Procurement::create([
                    'project_id' => $project->id,
                    'status' => 'pending',
                    'loan_status' => 'pending',
                ]);
            }

            if ($target === 'all' || $target === 'procurement') {
                $procurement->plan_procurement_cut_at = $cutDate;
                $procurement->plan_procurement_doc_number = $docNumber;
                if (empty($procurement->procurement_number) || str_starts_with($procurement->procurement_number, 'PR-')) {
                    $procurement->procurement_number = $docNumber;
                }
                if ($procurement->status === 'pending' || empty($procurement->status)) {
                    $procurement->status = 'plan_cut';
                }
            }

            if ($target === 'all' || $target === 'loan') {
                $procurement->plan_loan_cut_at = $cutDate;
                $procurement->plan_loan_doc_number = $docNumber;
                if ($procurement->loan_status === 'pending' || empty($procurement->loan_status)) {
                    $procurement->loan_status = 'plan_cut';
                }

                $budget = $project->budget;
                if (!$budget) {
                    $budget = new \App\Models\Budget();
                    $budget->project_id = $project->id;
                    $budget->funding_source_id = $project->funding_source_id;
                }
                $budget->allocated_amount = (float)($project->allocated_budget ?: $project->estimated_budget);
                $budget->encumbered_amount = $budget->allocated_amount;
                $budget->save();
            }

            $procurement->save();

            $targetText = $target === 'all' ? 'ชุดจัดซื้อจัดจ้างและสัญญายืมเงิน' : ($target === 'procurement' ? 'ชุดจัดซื้อจัดจ้าง (ส่งต่อไปพัสดุ)' : 'สัญญายืมเงิน (ส่งต่อไปการเงิน)');
            return redirect()->back()->with('message', "งานแผนงานได้ออกเลขคุมหลักและตัดยอดงบประมาณ {$targetText} โครงการ \"{$project->title}\" เรียบร้อยแล้ว (เลขคุมเอกสาร: {$docNumber})");
        }
    }

    /**
     * Procurement staff acknowledges and logs receipt of routine procurement package.
     */
    public function receiveRoutineProcurement(Request $request, Procurement $procurement)
    {
        if (!auth()->user()->isProcurementHead() && !auth()->user()->isAdmin()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานพัสดุหรือผู้ดูแลระบบเท่านั้นที่สามารถลงรับเอกสารได้');
        }

        $docNumber = $procurement->procurement_number;
        if ($request->filled('procurement_number')) {
            $docNumber = trim($request->input('procurement_number'));
        }
        if (!$docNumber) {
            $docNumber = DocumentNumberService::generateAndIncrement();
        }

        $procurement->procurement_number = $docNumber;
        if (empty($procurement->plan_procurement_doc_number)) {
            $procurement->plan_procurement_doc_number = $docNumber;
        }

        $procurement->memo_date = $request->filled('memo_date') ? $request->input('memo_date') : now();
        $procurement->status = 'received';
        $procurement->save();

        return redirect()->back()->with('message', 'งานพัสดุลงรับชุดจัดซื้อจัดจ้างงบดำเนินงาน "' . ($procurement->memo_subject ?: $procurement->routineBudgetPlan?->title) . '" เรียบร้อยแล้ว');
    }

    /**
     * Procurement staff forwards routine procurement package to finance.
     */
    public function forwardRoutineToFinance(Request $request, Procurement $procurement)
    {
        if (!auth()->user()->isProcurementHead() && !auth()->user()->isAdmin()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานพัสดุหรือผู้ดูแลระบบเท่านั้นที่สามารถส่งต่อได้');
        }

        $procurement->status = 'forwarded_to_finance';
        $procurement->save();

        return redirect()->back()->with('message', 'ตั้งเบิกชุดจัดซื้อจัดจ้างและส่งต่อให้งานการเงินเรียบร้อยแล้ว');
    }

    /**
     * Finance staff acknowledges and logs receipt of routine loan or procurement.
     */
    public function financeReceiveRoutine(Request $request, Procurement $procurement)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isFinanceStaff()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานการเงินหรือผู้ดูแลระบบเท่านั้นที่สามารถลงรับเอกสารการเงินได้');
        }

        $validated = $request->validate([
            'finance_number' => 'nullable|string|max:100',
            'receive_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
            'target' => 'nullable|string',
        ]);

        $target = $request->input('target', 'all');
        if ($target === 'procurement' || $procurement->status === 'forwarded_to_finance') {
            $procurement->status = 'finance_received';
        }
        if ($target === 'loan' || $procurement->loan_status === 'plan_cut' || !empty($procurement->plan_loan_cut_at)) {
            $procurement->loan_status = 'finance_received';
        }
        $procurement->finance_received_at = now();
        $procurement->finance_doc_number = $validated['finance_number'] 
            ?? $procurement->plan_loan_doc_number 
            ?? $procurement->plan_procurement_doc_number 
            ?? ('กง. R-' . $procurement->id . '/' . (date('Y') + 543));
        $procurement->save();

        return redirect()->back()->with('message', 'งานการเงินได้ลงรับสัญญายืมเงิน/เอกสารการเงินงบดำเนินงานเรียบร้อยแล้ว');
    }

    /**
     * Finance staff records disbursement for routine procurement / loan.
     */
    public function financeDisburseRoutine(Request $request, Procurement $procurement)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isFinanceStaff()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานการเงินหรือผู้ดูแลระบบเท่านั้นที่สามารถบันทึกจ่ายเงินได้');
        }

        $validated = $request->validate([
            'actual_spent_amount' => 'required|numeric|min:0',
            'payment_ref' => 'nullable|string|max:100',
            'disburse_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
            'target' => 'nullable|string',
        ]);

        $target = $request->input('target', 'all');
        $actualSpent = (float)$validated['actual_spent_amount'];
        $now = now();
        $ref = $validated['payment_ref'] ?? 'โอนเงิน KTB';

        if ($target === 'loan') {
            $procurement->loan_status = 'cleared';
            $procurement->finance_disbursed_at = $now;
            $procurement->finance_disbursed_amount = (float)($procurement->finance_disbursed_amount ?: 0) + $actualSpent;
            $procurement->finance_payment_ref = $ref;
        } elseif (str_starts_with($target, 'proc_set_')) {
            $setId = (int)str_replace('proc_set_', '', $target);
            $setProc = Procurement::find($setId);
            if ($setProc) {
                $setProc->status = 'completed';
                $setProc->finance_disbursed_at = $now;
                $setProc->finance_disbursed_amount = $actualSpent;
                $setProc->finance_payment_ref = $ref;
                $setProc->save();
            }
            $procurement->status = 'completed';
            $procurement->finance_disbursed_at = $now;
            $procurement->finance_disbursed_amount = (float)($procurement->finance_disbursed_amount ?: 0) + $actualSpent;
            $procurement->finance_payment_ref = $procurement->finance_payment_ref 
                ? ($procurement->finance_payment_ref . ' | ' . $ref)
                : $ref;
        } elseif ($target === 'procurement') {
            $procurement->status = 'completed';
            $procurement->finance_disbursed_at = $now;
            $procurement->finance_disbursed_amount = (float)($procurement->finance_disbursed_amount ?: 0) + $actualSpent;
            $procurement->finance_payment_ref = $ref;
        } else {
            $procurement->status = 'completed';
            $procurement->loan_status = 'cleared';
            $procurement->finance_disbursed_at = $now;
            $procurement->finance_disbursed_amount = $actualSpent;
            $procurement->finance_payment_ref = $ref;
        }
        $procurement->save();

        $routinePlan = $procurement->routineBudgetPlan;
        if ($routinePlan) {
            $routinePlan->spent_amount = $actualSpent;
            $routinePlan->save();
        }

        return redirect()->back()->with('message', 'งานการเงินได้บันทึกจ่ายเงิน/โอนเงินและปิดสัญญาเรียบร้อยแล้ว (อ้างอิง: ' . $ref . ')');
    }


    /**
     * Update unified document numbering settings.
     */
    public function updateDocumentNumberingSettings(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานวางแผนและงบประมาณหรือผู้ดูแลระบบเท่านั้นที่สามารถตั้งค่าเลขที่เอกสารได้');
        }

        $validated = $request->validate([
            'prefix' => 'sometimes|string|max:50',
            'format' => 'sometimes|string|max:100',
            'digits' => 'sometimes|integer|min:1|max:10',
            'current_no' => 'sometimes|integer|min:1',
            'loan_prefix' => 'nullable|string|max:50',
            'loan_format' => 'nullable|string|max:100',
            'loan_digits' => 'nullable|integer|min:1|max:10',
            'loan_current_no' => 'nullable|integer|min:1',
        ]);

        DocumentNumberService::updateSettings($validated);

        return redirect()->back()->with('message', 'บันทึกการตั้งค่ารูปแบบเลขที่เอกสารเรียบร้อยแล้ว (เลขชุดจัดซื้อจัดจ้างถัดไป: ' . DocumentNumberService::previewNext() . ' | เลขสัญญายืมเงินถัดไป: ' . DocumentNumberService::previewNextLoan() . ')');
    }

    public function forwardToFinance(Request $request, Project $project)
    {
        if (!auth()->user()->isProcurementHead() && !auth()->user()->isAdmin()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานพัสดุหรือผู้ดูแลระบบเท่านั้นที่สามารถส่งต่อได้');
        }

        $procurement = $project->procurement;
        if ($procurement) {
            $procurement->status = 'forwarded_to_finance';
            $procurement->save();
        }

        return redirect()->back()->with('message', 'ตั้งเบิกชุดจัดซื้อจัดจ้างและส่งต่อให้งานการเงินเรียบร้อยแล้ว');
    }

    /**
     * Finance staff acknowledges and logs receipt of loan contract.
     */
    public function financeReceive(Request $request, Project $project)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isFinanceStaff()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานการเงินหรือผู้ดูแลระบบเท่านั้นที่สามารถลงรับเอกสารการเงินได้');
        }

        $validated = $request->validate([
            'finance_number' => 'nullable|string|max:100',
            'receive_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
            'target' => 'nullable|string',
        ]);

        $procurement = $project->procurement;
        if (!$procurement) {
            $procurement = Procurement::create([
                'project_id' => $project->id,
                'status' => 'pending',
                'loan_status' => 'pending',
            ]);
        }

        $target = $request->input('target', 'all');
        if ($target === 'procurement' || $procurement->status === 'forwarded_to_finance') {
            $procurement->status = 'finance_received';
        }
        if ($target === 'loan' || $procurement->loan_status === 'plan_cut' || !empty($procurement->plan_loan_cut_at)) {
            $procurement->loan_status = 'finance_received';
        }
        $procurement->finance_received_at = now();
        $procurement->finance_doc_number = $validated['finance_number'] 
            ?? $procurement->plan_loan_doc_number 
            ?? $procurement->plan_procurement_doc_number 
            ?? ('กง. ' . $project->id . '/' . (date('Y') + 543));
        $procurement->save();

        return redirect()->back()->with('message', 'งานการเงินได้ลงรับสัญญายืมเงินและเอกสารที่เกี่ยวข้องเรียบร้อยแล้ว');
    }

    /**
     * Finance staff marks funds as disbursed / transferred to borrower with actual spent amount,
     * closing the loan contract in one single step.
     */
    public function financeDisburse(Request $request, Project $project)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isFinanceStaff()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานการเงินหรือผู้ดูแลระบบเท่านั้นที่สามารถบันทึกจ่ายเงินยืมได้');
        }

        $validated = $request->validate([
            'actual_spent_amount' => 'required|numeric|min:0',
            'payment_ref' => 'nullable|string|max:100',
            'disburse_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
            'target' => 'nullable|string', // 'loan', 'procurement', 'all'
        ]);

        $target = $request->input('target', 'all');
        $actualSpent = (float)$validated['actual_spent_amount'];
        $allocAmount = (float)($project->allocated_budget ?: $project->estimated_budget);

        $procurement = $project->procurement;
        if (!$procurement) {
            $procurement = Procurement::create([
                'project_id' => $project->id,
                'status' => 'pending',
                'loan_status' => 'pending',
            ]);
        }

        $now = now();
        $ref = $validated['payment_ref'] ?? 'โอนเงิน KTB';

        if ($target === 'loan') {
            $procurement->loan_status = 'cleared';
            $procurement->finance_disbursed_at = $now;
            $procurement->finance_disbursed_amount = (float)($procurement->finance_disbursed_amount ?: 0) + $actualSpent;
            $procurement->finance_payment_ref = $procurement->finance_payment_ref 
                ? ($procurement->finance_payment_ref . ' | ' . $ref)
                : $ref;
        } elseif (str_starts_with($target, 'proc_set_')) {
            $setId = (int)str_replace('proc_set_', '', $target);
            $setProc = Procurement::find($setId);
            if ($setProc) {
                $setProc->status = 'completed';
                $setProc->finance_disbursed_at = $now;
                $setProc->finance_disbursed_amount = $actualSpent;
                $setProc->finance_payment_ref = $ref;
                $setProc->save();
            }
            $procurement->status = 'completed';
            $procurement->finance_disbursed_at = $now;
            $procurement->finance_disbursed_amount = (float)($procurement->finance_disbursed_amount ?: 0) + $actualSpent;
            $procurement->finance_payment_ref = $procurement->finance_payment_ref 
                ? ($procurement->finance_payment_ref . ' | ' . $ref)
                : $ref;
        } elseif ($target === 'procurement') {
            $procurement->status = 'completed';
            $procurement->finance_disbursed_at = $now;
            $procurement->finance_disbursed_amount = (float)($procurement->finance_disbursed_amount ?: 0) + $actualSpent;
            $procurement->finance_payment_ref = $procurement->finance_payment_ref 
                ? ($procurement->finance_payment_ref . ' | ' . $ref)
                : $ref;
        } else {
            $procurement->loan_status = 'cleared';
            $procurement->status = 'completed';
            $procurement->finance_disbursed_at = $now;
            $procurement->finance_disbursed_amount = $actualSpent;
            $procurement->finance_payment_ref = $ref;
        }
        $procurement->save();

        // Update budget table
        $budget = $project->budget;
        if (!$budget) {
            $budget = new \App\Models\Budget();
            $budget->project_id = $project->id;
            $budget->funding_source_id = $project->funding_source_id;
            $budget->allocated_amount = $allocAmount;
        }
        if ($target === 'all') {
            $budget->spent_amount = $actualSpent;
        } else {
            $budget->spent_amount = (float)($budget->spent_amount ?: 0) + $actualSpent;
        }
        if ($procurement->loan_status === 'cleared') {
            $budget->advance_cleared_at = $now;
        }
        $isLoanDone = ($procurement->loan_status === 'cleared');
        $isProcDone = ($procurement->status === 'completed');

        // Check components that this project actually has
        $hasLoan = !empty($procurement->plan_loan_cut_at) || !empty($procurement->finance_received_at) || ($procurement->loan_status !== 'pending');
        $hasProc = !empty($procurement->plan_procurement_cut_at) || !empty($procurement->procurement_number) || ($procurement->status === 'forwarded_to_finance') || ($procurement->items()->count() > 0);

        if (!$hasLoan && !$hasProc) {
            $isAllDone = true;
        } elseif ($hasLoan && $hasProc) {
            $isAllDone = $isLoanDone && $isProcDone;
        } elseif ($hasLoan) {
            $isAllDone = $isLoanDone;
        } else {
            $isAllDone = $isProcDone;
        }

        // Release encumbrance when completed or cleared so refund is restored to available budget
        if ($target === 'all' || $isAllDone) {
            $budget->encumbered_amount = 0.00;
        } elseif ($procurement->loan_status === 'cleared' && $procurement->status === 'completed') {
            $budget->encumbered_amount = 0.00;
        }
        $budget->save();

        if ($target === 'all' || $isAllDone) {
            $project->status = 'completed';
        } else {
            $project->status = 'in_progress';
        }
        $project->save();

        $totalSpent = (float)$budget->spent_amount;
        $diff = $allocAmount - $totalSpent;
        $diffMsg = $diff > 0 
            ? (' (ยอดเงินคงเหลือคืนงบประมาณโครงการ: ฿' . number_format($diff, 2) . ')')
            : ($diff < 0 ? (' (ใช้จ่ายเกินวงเงินที่ตั้งไว้: ฿' . number_format(abs($diff), 2) . ')') : ' (ใช้จ่ายพอดีตามวงเงิน)');

        $partName = $target === 'loan' ? 'สัญญายืมเงิน' : ($target === 'procurement' ? 'ชุดจัดซื้อจัดจ้าง' : (str_starts_with($target, 'proc_set_') ? 'ชุดจัดซื้อจัดจ้าง' : 'ทั้งหมด'));
        return redirect()->back()->with('message', "งานการเงินได้บันทึกโอนเงิน/จ่ายจริง [{$partName}] ฿" . number_format($actualSpent, 2) . " เรียบร้อยแล้ว{$diffMsg}");
    }

    /**
     * Fallback to clear loan manually if needed.
     */
    public function financeClear(Request $request, Project $project)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isFinanceStaff()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานการเงินหรือผู้ดูแลระบบเท่านั้นที่สามารถปิดสัญญายืมเงินได้');
        }

        $procurement = $project->procurement;
        if ($procurement) {
            $procurement->loan_status = 'cleared';
            $procurement->save();
        }

        return redirect()->back()->with('message', 'งานการเงินได้ตรวจหลักฐานและปิดสัญญายืมเงิน (เคลียร์สมบูรณ์) เรียบร้อยแล้ว');
    }

    /**
     * Admin or Procurement/Finance officer rolls back/cancels the procurement status
     * in case of an error, allowing the supply staff, finance staff, or project creator to make corrections.
     */
    public function rollbackStatus(Request $request, Project $project)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isProcurementHead() && !$user->isPlanHead()) {
            abort(403, 'เฉพาะผู้ดูแลระบบหรือเจ้าหน้าที่งานพัสดุเท่านั้นที่สามารถยกเลิก/ส่งคืนสถานะจัดซื้อจัดจ้างได้');
        }

        $request->validate([
            'target_status' => 'required|string|in:pending,received,processing,forwarded_to_finance,finance_received,funds_transferred,cleared,reset_all',
            'reason' => 'nullable|string|max:500'
        ]);

        $procurement = $project->procurement;
        if (!$procurement) {
            return redirect()->back()->with('error', 'ไม่พบข้อมูลการจัดซื้อจัดจ้างของโครงการนี้');
        }

        $target = $request->input('target_status');
        $reason = $request->input('reason');

        if ($target === 'reset_all') {
            $procurement->status = 'pending';
            $procurement->save();
            return redirect()->back()->with('message', 'รีเซ็ตสถานะการจัดซื้อจัดจ้างของโครงการ "' . $project->title . '" เรียบร้อยแล้ว');
        }

        $procurement->status = $target;
        $procurement->save();

        $statusLabel = [
            'pending' => 'รอพัสดุลงรับเรื่อง (เปิดให้ผู้เสนอโครงการแก้ไขได้)',
            'received' => 'พัสดุลงรับเรื่องแล้ว (เปิดให้งานพัสดุแก้ไข/ตรวจสอบ)',
            'processing' => 'อยู่ระหว่างดำเนินการ'
        ][$target] ?? $target;

        $msg = 'ยกเลิก/ส่งคืนสถานะการจัดซื้อจัดจ้างโครงการ "' . $project->title . '" ไปยังสถานะ: ' . $statusLabel . ' เรียบร้อยแล้ว';
        if ($reason) {
            $msg .= ' (เหตุผล: ' . $reason . ')';
        }

        return redirect()->back()->with('message', $msg);
    }

    /**
     * Download or view the dynamic HTML/PDF stub for procurement documents.
     */
    public function downloadDocument(Project $project, $type)
    {
        $project->load(['user', 'department', 'budget.fundingSource', 'procurements.items', 'procurements.committees']);

        $procurement = null;
        if (request()->has('procurement_id')) {
            $procurement = Procurement::find(request('procurement_id'));
        }
        if (!$procurement) {
            $procurement = $project->procurement;
        }

        if (!$procurement) {
            return redirect()->route('dashboard')->with('error', 'Procurement process has not been initialized yet.');
        }

        if (!in_array($type, ['memo', 'request_form', 'estimation', 'tor', 'loan_contract', 'po', 'purchase_order'])) {
            abort(404);
        }

        // If procurement has a delegated department, use it for the document
        if ($procurement->department) {
            $project->department = $procurement->department;
        }
        if ($procurement->creator) {
            $project->user = $procurement->creator;
        }

        $purchasingCommittee = $procurement->purchasingCommittee()->get();
        $inspectionCommittee = $procurement->inspectionCommittee()->get();

        $viewName = ($type === 'purchase_order' || $type === 'po') ? 'procurements.po' : "procurements.{$type}";

        return view($viewName, [
            'project' => $project,
            'procurement' => $procurement,
            'items' => $procurement->items,
            'purchasingCommittee' => $purchasingCommittee,
            'inspectionCommittee' => $inspectionCommittee,
            'vendorName' => request('vendor_name', ''),
            'vendorAddress' => request('vendor_address', ''),
            'vendorTaxId' => request('vendor_tax_id', ''),
            'vendorPhone' => request('vendor_phone', ''),
            'deliveryDays' => request('delivery_days', '7'),
            'poNumber' => request('po_number', ''),
            'poDate' => request('po_date', ''),
        ]);
    }

    /**
     * Download document directly for a specific procurement set.
     */
    public function downloadProcurementDocument(Procurement $procurement, $type)
    {
        $project = $procurement->project;
        if (!$project) {
            return $this->downloadRoutineDocument($procurement, $type);
        }
        request()->merge(['procurement_id' => $procurement->id]);
        return $this->downloadDocument($project, $type);
    }

    /**
     * Create a new procurement set (ชุดจัดซื้อจัดจ้างย่อย) for a project under the shared budget pool.
     */
    public function createProcurementSet(Request $request, Project $project)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isProcurementHead() && $user->id !== $project->user_id && !$user->department_id) {
            abort(403, 'คุณไม่มีสิทธิ์ในการสร้างชุดจัดซื้อจัดจ้างสำหรับโครงการนี้');
        }

        if (!in_array($project->status, ['approved', 'in_progress', 'evaluating', 'completed']) && $project->current_approval_step < 6) {
            return redirect()->back()->with('error', 'โครงการนี้ยังไม่ผ่านการอนุมัติสมบูรณ์ในแท็บที่ 1 (Plan) จึงยังไม่สามารถสร้างชุดจัดซื้อจัดจ้างได้');
        }

        $validated = $request->validate([
            'set_name' => 'required|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'activity_name' => 'nullable|string|max:255',
            'tor_specifications' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit' => 'required|string|max:50',
            'items.*.unit_price' => 'required|numeric|min:0',
        ], [
            'set_name.required' => 'กรุณาระบุชื่อชุดจัดซื้อจัดจ้าง',
            'items.required' => 'กรุณาระบุรายการพัสดุอย่างน้อย 1 รายการ',
            'items.*.description.required' => 'กรุณาระบุชื่อรายการพัสดุ',
        ]);

        $setTotal = 0;
        foreach ($validated['items'] as $item) {
            $setTotal += (floatval($item['quantity']) * floatval($item['unit_price']));
        }

        // Shared Budget Pool Validation
        $projectBudget = floatval($project->allocated_budget ?: $project->estimated_budget);
        $existingProcurementsSum = 0;
        foreach ($project->procurements as $existingProc) {
            $existingProcurementsSum += $existingProc->items->sum('total_price');
        }

        $remainingBudget = max(0, $projectBudget - $existingProcurementsSum);
        if ($projectBudget > 0 && $remainingBudget <= 0.001) {
            return redirect()->back()->with('error', 'ไม่สามารถสร้างชุดจัดซื้อจัดจ้างเพิ่มเติมได้: โครงการนี้ได้จัดทำชุดจัดซื้อจัดจ้างครบตามวงเงินงบประมาณที่ได้รับจัดสรรแล้ว (' . number_format($projectBudget, 2) . ' บาท)');
        }

        if (($existingProcurementsSum + $setTotal) > ($projectBudget + 0.01)) {
            return redirect()->back()->with('error', 'ไม่สามารถสร้างชุดจัดซื้อได้: ยอดเงินชุดจัดซื้อนี้ (' . number_format($setTotal, 2) . ' บาท) เกินวงเงินคงเหลือของโครงการ (' . number_format($remainingBudget, 2) . ' บาท จากวงเงินโครงการทั้งหมด ' . number_format($projectBudget, 2) . ' บาท)');
        }

        $setCount = $project->procurements()->count() + 1;
        $procurementNumber = 'PR-' . $project->id . '-' . str_pad($setCount, 2, '0', STR_PAD_LEFT);

        $departmentId = !empty($validated['department_id']) ? $validated['department_id'] : ($user->department_id ?: $project->department_id);

        $procurement = Procurement::create([
            'project_id' => $project->id,
            'department_id' => $departmentId,
            'created_by' => $user->id,
            'set_name' => $validated['set_name'],
            'activity_name' => $validated['activity_name'] ?? null,
            'procurement_number' => $procurementNumber,
            'tor_specifications' => $validated['tor_specifications'] ?? null,
            'status' => 'pending',
            'memo_date' => now(),
            'memo_subject' => $validated['set_name'] . ' (' . $project->title . ')',
        ]);

        foreach ($validated['items'] as $item) {
            $procurement->items()->create([
                'description' => $item['description'],
                'quantity' => $item['quantity'],
                'unit' => $item['unit'],
                'unit_price' => $item['unit_price'],
                'total_price' => floatval($item['quantity']) * floatval($item['unit_price']),
            ]);
        }

        // Auto-advance project status to 'in_progress' (PDCA Do phase)
        if ($project->status === 'approved') {
            $project->status = 'in_progress';
            $project->save();
        }

        return redirect()->back()->with('message', 'สร้างชุดจัดซื้อจัดจ้าง "' . $validated['set_name'] . '" ยอดเงิน ฿' . number_format($setTotal, 2) . ' เรียบร้อยแล้ว (อยู่ภายใต้งบประมาณโครงการรวม)');
    }

    /**
     * Update an existing procurement set.
     */
    public function updateProcurementSet(Request $request, Procurement $procurement)
    {
        $user = auth()->user();
        $project = $procurement->project;
        if (!$project) {
            return redirect()->back()->with('error', 'ไม่พบข้อมูลโครงการ');
        }

        if (!$user->isAdmin() && !$user->isProcurementHead() && $user->id !== $project->user_id && $user->id !== $procurement->created_by) {
            abort(403, 'คุณไม่มีสิทธิ์แก้ไขชุดจัดซื้อจัดจ้างนี้');
        }

        if (in_array($procurement->status, ['forwarded_to_finance', 'finance_received', 'completed'])) {
            return redirect()->back()->with('error', 'ชุดจัดซื้อนี้ถูกส่งไปยังงานการเงินหรือเบิกจ่ายแล้ว ไม่สามารถแก้ไขได้');
        }

        $validated = $request->validate([
            'set_name' => 'required|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'activity_name' => 'nullable|string|max:255',
            'tor_specifications' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit' => 'required|string|max:50',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $setTotal = 0;
        foreach ($validated['items'] as $item) {
            $setTotal += (floatval($item['quantity']) * floatval($item['unit_price']));
        }

        // Shared Budget Pool Validation
        $projectBudget = floatval($project->allocated_budget ?: $project->estimated_budget);
        $otherProcurementsSum = 0;
        foreach ($project->procurements as $otherProc) {
            if ($otherProc->id !== $procurement->id) {
                $otherProcurementsSum += $otherProc->items->sum('total_price');
            }
        }

        if (($otherProcurementsSum + $setTotal) > ($projectBudget + 0.01)) {
            $remainingBudget = max(0, $projectBudget - $otherProcurementsSum);
            return redirect()->back()->with('error', 'ไม่สามารถบันทึกได้: ยอดเงินชุดจัดซื้อนี้ (' . number_format($setTotal, 2) . ' บาท) รวมกับชุดอื่นจะเกินวงเงินโครงการคงเหลือ (' . number_format($remainingBudget, 2) . ' บาท จากวงเงินโครงการทั้งหมด ' . number_format($projectBudget, 2) . ' บาท)');
        }

        $procurement->set_name = $validated['set_name'];
        if (!empty($validated['department_id'])) {
            $procurement->department_id = $validated['department_id'];
        }
        $procurement->activity_name = $validated['activity_name'] ?? null;
        $procurement->tor_specifications = $validated['tor_specifications'] ?? null;
        $procurement->memo_subject = $validated['set_name'] . ' (' . $project->title . ')';
        $procurement->save();

        // Recreate items
        $procurement->items()->delete();
        foreach ($validated['items'] as $item) {
            $procurement->items()->create([
                'description' => $item['description'],
                'quantity' => $item['quantity'],
                'unit' => $item['unit'],
                'unit_price' => $item['unit_price'],
                'total_price' => floatval($item['quantity']) * floatval($item['unit_price']),
            ]);
        }

        return redirect()->back()->with('message', 'อัปเดตข้อมูลชุดจัดซื้อจัดจ้าง "' . $validated['set_name'] . '" เรียบร้อยแล้ว');
    }

    /**
     * Delete a procurement set.
     */
    public function deleteProcurementSet(Request $request, Procurement $procurement)
    {
        $user = auth()->user();
        $project = $procurement->project;

        if (!$user->isAdmin() && !$user->isProcurementHead() && $user->id !== $project?->user_id && $user->id !== $procurement->created_by) {
            abort(403, 'คุณไม่มีสิทธิ์ลบชุดจัดซื้อจัดจ้างนี้');
        }

        if (in_array($procurement->status, ['received', 'forwarded_to_finance', 'finance_received', 'completed'])) {
            return redirect()->back()->with('error', 'ชุดจัดซื้อนี้ได้รับการลงรับหรือส่งต่อแล้ว ไม่สามารถลบได้ กรุณาติดต่อเจ้าหน้าที่พัสดุ');
        }

        $setName = $procurement->set_name ?: ('ชุดจัดซื้อ ' . $procurement->procurement_number);
        $procurement->items()->delete();
        $procurement->delete();

        return redirect()->back()->with('message', 'ลบชุดจัดซื้อจัดจ้าง "' . $setName . '" เรียบร้อยแล้ว วงเงินถูกคืนกลับสู่กองงบประมาณโครงการ');
    }

    /**
     * Plan cut budget for an individual procurement set.
     */
    public function planCutSet(Request $request, Procurement $procurement)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานวางแผนและงบประมาณหรือผู้ดูแลระบบเท่านั้นที่สามารถตัดยอดงบประมาณได้');
        }

        $validated = $request->validate([
            'plan_doc_number' => 'nullable|string|max:100',
            'cut_date' => 'nullable|date',
        ]);

        if (!empty($validated['plan_doc_number'])) {
            $docNumber = trim($validated['plan_doc_number']);
            if ($docNumber === DocumentNumberService::previewNext()) {
                DocumentNumberService::generateAndIncrement();
            }
        } else {
            $docNumber = DocumentNumberService::generateAndIncrement();
        }

        $cutDateTime = !empty($validated['cut_date']) ? \Carbon\Carbon::parse($validated['cut_date']) : now();

        $procurement->plan_procurement_cut_at = $cutDateTime;
        $procurement->plan_procurement_doc_number = $docNumber;
        if (empty($procurement->procurement_number) || str_starts_with($procurement->procurement_number, 'PR-')) {
            $procurement->procurement_number = $docNumber;
        }
        $procurement->status = 'plan_cut';
        $procurement->save();

        return redirect()->back()->with('message', 'งานแผนงานตัดยอดงบประมาณชุดจัดซื้อ "' . ($procurement->set_name ?: $procurement->procurement_number) . '" เรียบร้อยแล้ว (เลขคุม: ' . $docNumber . ')');
    }

    /**
     * Procurement staff acknowledges and receives an individual procurement set.
     */
    public function receiveSet(Request $request, Procurement $procurement)
    {
        if (!auth()->user()->isProcurementHead() && !auth()->user()->isAdmin()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานพัสดุหรือผู้ดูแลระบบเท่านั้นที่สามารถลงรับได้');
        }

        $docNumber = $procurement->procurement_number;
        if ($request->filled('procurement_number')) {
            $docNumber = trim($request->input('procurement_number'));
        } elseif (!empty($procurement->plan_procurement_doc_number)) {
            $docNumber = $procurement->plan_procurement_doc_number;
        }

        if ($docNumber) {
            $procurement->procurement_number = $docNumber;
        }
        $procurement->memo_date = $request->filled('memo_date') ? $request->input('memo_date') : now();
        $procurement->status = 'received';
        $procurement->save();

        return redirect()->back()->with('message', 'งานพัสดุลงรับชุดจัดซื้อ "' . ($procurement->set_name ?: $procurement->procurement_number) . '" เรียบร้อยแล้ว');
    }

    /**
     * Procurement staff forwards an individual procurement set to finance.
     */
    public function forwardToFinanceSet(Request $request, Procurement $procurement)
    {
        if (!auth()->user()->isProcurementHead() && !auth()->user()->isAdmin()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานพัสดุหรือผู้ดูแลระบบเท่านั้นที่สามารถส่งต่อได้');
        }

        $procurement->status = 'forwarded_to_finance';
        $procurement->save();

        return redirect()->back()->with('message', 'ส่งต่อชุดจัดซื้อ "' . ($procurement->set_name ?: $procurement->procurement_number) . '" ให้งานการเงินเรียบร้อยแล้ว');
    }

    /**
     * Finance staff acknowledges and receives an individual procurement set.
     */
    public function financeReceiveSet(Request $request, Procurement $procurement)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isFinanceStaff()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานการเงินหรือผู้ดูแลระบบเท่านั้นที่สามารถลงรับได้');
        }

        $procurement->status = 'finance_received';
        $procurement->finance_received_at = now();
        $procurement->finance_doc_number = $request->input('finance_number') 
            ?: ($procurement->plan_procurement_doc_number ?: ('กง. P-' . $procurement->id . '/' . (date('Y') + 543)));
        $procurement->save();

        return redirect()->back()->with('message', 'งานการเงินลงรับชุดจัดซื้อ "' . ($procurement->set_name ?: $procurement->procurement_number) . '" เรียบร้อยแล้ว');
    }

    /**
     * Finance staff records actual disbursement for an individual procurement set.
     */
    public function financeDisburseSet(Request $request, Procurement $procurement)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isFinanceStaff()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานการเงินหรือผู้ดูแลระบบเท่านั้นที่สามารถบันทึกจ่ายเงินได้');
        }

        $validated = $request->validate([
            'actual_spent_amount' => 'required|numeric|min:0',
            'payment_ref' => 'nullable|string|max:100',
        ]);

        $actualSpent = (float)$validated['actual_spent_amount'];
        $ref = $validated['payment_ref'] ?? 'โอนเงิน KTB';
        $now = now();

        $procurement->status = 'completed';
        $procurement->finance_disbursed_at = $now;
        $procurement->finance_disbursed_amount = $actualSpent;
        $procurement->finance_payment_ref = $ref;
        $procurement->save();

        // Update project budget
        $project = $procurement->project;
        if ($project) {
            $budget = $project->budget;
            if (!$budget) {
                $budget = new \App\Models\Budget();
                $budget->project_id = $project->id;
                $budget->funding_source_id = $project->funding_source_id;
                $budget->allocated_amount = (float)($project->allocated_budget ?: $project->estimated_budget);
            }
            $budget->spent_amount = (float)($budget->spent_amount ?: 0) + $actualSpent;
            $budget->save();
        }

        return redirect()->back()->with('message', 'งานการเงินบันทึกจ่ายเงิน/โอนเงินชุดจัดซื้อ "' . ($procurement->set_name ?: $procurement->procurement_number) . '" ฿' . number_format($actualSpent, 2) . ' เรียบร้อยแล้ว (อ้างอิง: ' . $ref . ')');
    }

    /**
     * Save or update routine procurement items and committees.
     */
    public function saveRoutineProcurement(Request $request, RoutineBudgetPlan $routineBudget)
    {
        $validated = $request->validate([
            'procurement_id' => 'nullable|exists:procurements,id',
            'purchasing_chair' => 'nullable|exists:users,id',
            'purchasing_member1' => 'nullable|exists:users,id',
            'purchasing_member2' => 'nullable|exists:users,id',
            'inspection_chair' => 'nullable|exists:users,id',
            'inspection_member1' => 'nullable|exists:users,id',
            'inspection_member2' => 'nullable|exists:users,id',
            'tor_specifications' => 'nullable|string',
            'memo_subject' => 'required|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit' => 'required|string',
            'items.*.unit_price' => 'required|numeric|min:0',
        ], [
            'memo_subject.required' => 'กรุณาระบุหัวข้อเสนอซื้อ/จ้าง',
            'items.required' => 'กรุณาระบุรายการพัสดุอย่างน้อย 1 รายการ',
        ]);

        $totalSum = 0;
        foreach ($validated['items'] as $item) {
            $totalSum += (floatval($item['quantity']) * floatval($item['unit_price']));
        }

        $remaining = floatval($routineBudget->allocated_amount) - floatval($routineBudget->spent_amount);
        
        $procurement = null;
        $oldTotal = 0;
        if (!empty($validated['procurement_id'])) {
            $procurement = Procurement::find($validated['procurement_id']);
            $oldTotal = $procurement->items()->sum('total_price');
        }

        if ($totalSum > ($remaining + $oldTotal + 0.01)) {
            return redirect()->back()->with('error', 'ไม่สามารถบันทึกได้: ยอดเงินรวมจัดซื้อจัดจ้าง (' . number_format($totalSum, 2) . ' บาท) เกินวงเงินคงเหลือในแผนงบประมาณ (' . number_format($remaining + $oldTotal, 2) . ' บาท)');
        }

        if (!$procurement) {
            $procurement = new Procurement();
            $procurement->routine_budget_plan_id = $routineBudget->id;
            $procurement->status = 'completed';
            $procurement->procurement_number = 'PR-RT-' . str_pad($routineBudget->id . '-' . time(), 8, '0', STR_PAD_LEFT);
        }

        $procurement->memo_subject = $validated['memo_subject'];
        $procurement->memo_date = now();
        $procurement->tor_specifications = $validated['tor_specifications'] ?? '';
        $procurement->save();

        $syncData = [];
        if (!empty($validated['purchasing_chair'])) {
            $syncData[$validated['purchasing_chair']] = ['committee_type' => 'purchasing', 'role' => 'chairperson'];
        }
        if (!empty($validated['purchasing_member1'])) {
            $syncData[$validated['purchasing_member1']] = ['committee_type' => 'purchasing', 'role' => 'member'];
        }
        if (!empty($validated['purchasing_member2'])) {
            $syncData[$validated['purchasing_member2']] = ['committee_type' => 'purchasing', 'role' => 'member'];
        }
        if (!empty($validated['inspection_chair'])) {
            $syncData[$validated['inspection_chair']] = ['committee_type' => 'inspection', 'role' => 'chairperson'];
        }
        if (!empty($validated['inspection_member1'])) {
            $syncData[$validated['inspection_member1']] = ['committee_type' => 'inspection', 'role' => 'member'];
        }
        if (!empty($validated['inspection_member2'])) {
            $syncData[$validated['inspection_member2']] = ['committee_type' => 'inspection', 'role' => 'member'];
        }

        if (!empty($syncData)) {
            $procurement->committees()->sync($syncData);
        }

        $procurement->items()->delete();
        foreach ($validated['items'] as $item) {
            $procurement->items()->create([
                'description' => $item['description'],
                'quantity' => $item['quantity'],
                'unit' => $item['unit'],
                'unit_price' => $item['unit_price'],
                'total_price' => floatval($item['quantity']) * floatval($item['unit_price']),
            ]);
        }

        $routineBudget->spent_amount = ($routineBudget->spent_amount - $oldTotal) + $totalSum;
        $routineBudget->save();

        return redirect()->back()->with('message', 'บันทึกข้อมูลและเบิกตัดแผนงบประมาณประจำปีเรียบร้อยแล้ว');
    }

    /**
     * Download or view the dynamic HTML/PDF stub for routine procurement documents.
     */
    public function downloadRoutineDocument(Procurement $procurement, $type)
    {
        $procurement->load(['routineBudgetPlan.department', 'items', 'committees']);

        if (!in_array($type, ['memo', 'request_form', 'estimation', 'tor'])) {
            abort(404);
        }

        $purchasingCommittee = $procurement->purchasingCommittee()->get();
        $inspectionCommittee = $procurement->inspectionCommittee()->get();

        $project = new Project();
        $project->title = $procurement->memo_subject;
        $project->estimated_budget = $procurement->items()->sum('total_price');
        $project->department = $procurement->routineBudgetPlan?->department;
        $project->user = auth()->user();

        return view("procurements.{$type}", [
            'project' => $project,
            'procurement' => $procurement,
            'items' => $procurement->items,
            'purchasingCommittee' => $purchasingCommittee,
            'inspectionCommittee' => $inspectionCommittee,
        ]);
    }

    /**
     * AI-Assisted TOR Studio: Draft Terms of Reference (TOR) technical specs.
     */
    public function aiDraftTor(Request $request, GeminiService $geminiService)
    {
        $validated = $request->validate([
            'item_name' => 'required|string',
            'category' => 'nullable|string',
            'estimated_price' => 'nullable|numeric',
            'requirements' => 'nullable|array',
        ]);

        $torData = $geminiService->draftTor(
            itemName: $validated['item_name'],
            category: $validated['category'] ?? 'วัสดุ/ครุภัณฑ์',
            estimatedPrice: (float)($validated['estimated_price'] ?? 0),
            requirements: $validated['requirements'] ?? []
        );

        return response()->json($torData);
    }

    /**
     * AI Compliance Check: Verify TOR text against Anti-Lock-in Regulations.
     */
    public function aiCheckTorCompliance(Request $request, GeminiService $geminiService)
    {
        $validated = $request->validate([
            'tor_text' => 'required|string',
        ]);

        $complianceResult = $geminiService->checkTorCompliance($validated['tor_text']);

        return response()->json($complianceResult);
    }
}

