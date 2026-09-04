<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Procurement;
use App\Models\ProcurementItem;
use App\Models\RoutineBudgetPlan;
use App\Services\DocumentNumberService;
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
                'procurement_number' => 'PR-' . str_pad($project->id, 5, '0', STR_PAD_LEFT),
                'status' => 'processing'
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
                'procurement_number' => 'PR-' . str_pad($project->id, 5, '0', STR_PAD_LEFT),
                'status' => 'processing'
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
                'procurement_number' => 'PR-' . str_pad($project->id, 5, '0', STR_PAD_LEFT),
                'status' => 'pending'
            ]
        );

        if ($request->filled('procurement_number')) {
            $procurement->procurement_number = $request->input('procurement_number');
        }
        if ($request->filled('memo_date')) {
            $procurement->memo_date = $request->input('memo_date');
        }
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

        $now = now();
        $target = $validated['target'];

        // Assign the single unified document number to both procurement and loan tracking fields
        if ($target === 'all' || $target === 'procurement') {
            $procurement->plan_procurement_cut_at = $now;
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
            $procurement->plan_loan_cut_at = $now;
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
     * Update unified document numbering settings.
     */
    public function updateDocumentNumberingSettings(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead()) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานวางแผนและงบประมาณหรือผู้ดูแลระบบเท่านั้นที่สามารถตั้งค่าเลขที่เอกสารได้');
        }

        $validated = $request->validate([
            'prefix' => 'required|string|max:50',
            'format' => 'required|string|max:100',
            'digits' => 'required|integer|min:1|max:10',
            'current_no' => 'required|integer|min:1',
        ]);

        DocumentNumberService::updateSettings($validated);

        return redirect()->back()->with('message', 'บันทึกการตั้งค่ารูปแบบเลขที่เอกสารเรียบร้อยแล้ว (เลขถัดไป: ' . DocumentNumberService::previewNext() . ')');
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
        ]);

        $procurement = $project->procurement;
        if (!$procurement) {
            $procurement = Procurement::create([
                'project_id' => $project->id,
                'status' => 'pending',
                'loan_status' => 'pending',
            ]);
        }

        $procurement->loan_status = 'finance_received';
        $procurement->finance_received_at = now();
        $procurement->finance_doc_number = $validated['finance_number'] ?? ('กง. ' . $project->id . '/' . (date('Y') + 543));
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
        ]);

        $actualSpent = (float)$validated['actual_spent_amount'];
        $allocAmount = (float)($project->allocated_budget ?: $project->estimated_budget);
        $diff = $allocAmount - $actualSpent;

        $procurement = $project->procurement;
        if (!$procurement) {
            $procurement = Procurement::create([
                'project_id' => $project->id,
                'status' => 'pending',
                'loan_status' => 'pending',
            ]);
        }

        $procurement->loan_status = 'cleared';
        $procurement->finance_disbursed_at = now();
        $procurement->finance_disbursed_amount = $actualSpent;
        $procurement->finance_payment_ref = $validated['payment_ref'] ?? 'โอนเงินยืม KTB';
        $procurement->save();

        // Update budget table
        $budget = $project->budget;
        if (!$budget) {
            $budget = new \App\Models\Budget();
            $budget->project_id = $project->id;
            $budget->funding_source_id = $project->funding_source_id;
            $budget->allocated_amount = $allocAmount;
        }
        $budget->spent_amount = $actualSpent;
        $budget->advance_cleared_at = now();
        $budget->save();

        if ($project->status === 'approved') {
            $project->status = 'in_progress';
            $project->save();
        }

        $diffMsg = $diff > 0 
            ? (' (มียอดเงินคงเหลือคืนงบประมาณโครงการ: ฿' . number_format($diff, 2) . ')')
            : ($diff < 0 ? (' (ใช้จ่ายเกินวงเงินที่ตั้งไว้: ฿' . number_format(abs($diff), 2) . ')') : ' (ใช้จ่ายพอดีตามวงเงิน)');

        return redirect()->back()->with('message', 'งานการเงินได้โอนเงิน/จ่ายจริง ฿' . number_format($actualSpent, 2) . ' และปิดยอดการเคลียร์เงินยืมสมบูรณ์แล้ว' . $diffMsg);
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
        $project->load(['user', 'department', 'budget.fundingSource', 'procurement.items', 'procurement.committees']);

        if (!$project->procurement) {
            return redirect()->route('dashboard')->with('error', 'Procurement process has not been initialized yet.');
        }

        if (!in_array($type, ['memo', 'request_form', 'estimation', 'tor', 'loan_contract', 'po', 'purchase_order'])) {
            abort(404);
        }

        $purchasingCommittee = $project->procurement->purchasingCommittee()->get();
        $inspectionCommittee = $project->procurement->inspectionCommittee()->get();

        $viewName = ($type === 'purchase_order' || $type === 'po') ? 'procurements.po' : "procurements.{$type}";

        return view($viewName, [
            'project' => $project,
            'procurement' => $project->procurement,
            'items' => $project->procurement->items,
            'purchasingCommittee' => $purchasingCommittee,
            'inspectionCommittee' => $inspectionCommittee,
            'vendorName' => request('vendor_name', ''),
            'vendorAddress' => request('vendor_address', ''),
            'vendorTaxId' => request('vendor_tax_id', ''),
            'vendorPhone' => request('vendor_phone', ''),
            'deliveryDays' => request('delivery_days', '๗'),
            'poNumber' => request('po_number', ''),
            'poDate' => request('po_date', ''),
        ]);
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
}
