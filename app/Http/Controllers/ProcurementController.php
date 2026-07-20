<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Procurement;
use App\Models\ProcurementItem;
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
     * Download or view the dynamic HTML/PDF stub for procurement documents.
     */
    public function downloadDocument(Project $project, $type)
    {
        $project->load(['user', 'department', 'budget.fundingSource', 'procurement.items', 'procurement.committees']);

        if (!$project->procurement) {
            return redirect()->route('dashboard')->with('error', 'Procurement process has not been initialized yet.');
        }

        if (!in_array($type, ['memo', 'request_form', 'estimation', 'tor'])) {
            abort(404);
        }

        $purchasingCommittee = $project->procurement->purchasingCommittee()->get();
        $inspectionCommittee = $project->procurement->inspectionCommittee()->get();

        return view("procurements.{$type}", [
            'project' => $project,
            'procurement' => $project->procurement,
            'items' => $project->procurement->items,
            'purchasingCommittee' => $purchasingCommittee,
            'inspectionCommittee' => $inspectionCommittee,
        ]);
    }
}
