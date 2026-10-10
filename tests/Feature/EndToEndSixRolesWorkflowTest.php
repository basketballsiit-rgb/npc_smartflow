<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\CentralAllocation;
use App\Models\Department;
use App\Models\FundingSource;
use App\Models\Procurement;
use App\Models\Project;
use App\Models\ProjectApproval;
use App\Models\Role;
use App\Models\User;
use App\Models\ExpenseClearing;
use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EndToEndSixRolesWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_six_roles_lifecycle_and_budget_refund_calculation(): void
    {
        // 0. Seed Roles & Department
        $adminRole = Role::create(['name' => 'admin', 'display_name' => 'ผู้ดูแลระบบ']);
        $teacherRole = Role::create(['name' => 'teacher', 'display_name' => 'ครูผู้สอน']);
        $planRole = Role::create(['name' => 'plan_head', 'display_name' => 'หัวหน้างานวางแผน']);
        $procRole = Role::create(['name' => 'procurement_head', 'display_name' => 'หัวหน้างานพัสดุ']);
        $execRole = Role::create(['name' => 'executive', 'display_name' => 'ผู้บริหาร']);
        $finRole = Role::create(['name' => 'finance_head', 'display_name' => 'หัวหน้างานการเงิน']);

        $department = Department::firstOrCreate(['code' => 'ACAD'], ['name' => 'ฝ่ายวิชาการ']);

        // 0. Seed the 6 predefined users
        $admin = User::create([
            'name' => 'ผู้ดูแลระบบ',
            'email' => 'admin@smartflow.local',
            'password' => bcrypt('password'),
            'role_id' => $adminRole->id,
            'department_id' => $department->id,
            'position' => 'นักวิชาการคอมพิวเตอร์ / ผู้ดูแลระบบ',
        ]);

        $teacher = User::create([
            'name' => 'นายสมศักดิ์ ครูผู้สอน',
            'email' => 'teacher@smartflow.local',
            'password' => bcrypt('password'),
            'role_id' => $teacherRole->id,
            'department_id' => $department->id,
            'position' => 'ครู ชำนาญการ',
        ]);

        $planHead = User::create([
            'name' => 'นางวิภา วางแผน',
            'email' => 'plan@smartflow.local',
            'password' => bcrypt('password'),
            'role_id' => $planRole->id,
            'department_id' => $department->id,
            'position' => 'หัวหน้างานวางแผนและงบประมาณ',
        ]);

        $procHead = User::create([
            'name' => 'นายปิติ พัสดุ',
            'email' => 'procurement@smartflow.local',
            'password' => bcrypt('password'),
            'role_id' => $procRole->id,
            'department_id' => $department->id,
            'position' => 'หัวหน้างานพัสดุ',
        ]);

        $director = User::create([
            'name' => 'นายกเชษฐ์ กิ่งชนะ ผู้อำนวยการ',
            'email' => 'director@smartflow.local',
            'password' => bcrypt('password'),
            'role_id' => $execRole->id,
            'department_id' => $department->id,
            'position' => 'ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน',
        ]);

        $financeHead = User::create([
            'name' => 'นางสาวพิมพ์ใจ การเงิน',
            'email' => 'finance@smartflow.local',
            'password' => bcrypt('password'),
            'role_id' => $finRole->id,
            'department_id' => $department->id,
            'position' => 'หัวหน้างานการเงินและบัญชี',
        ]);

        // 0. Setup isolated funding source with 100,000 THB pool
        $fundingSource = FundingSource::create([
            'name' => 'แหล่งเงินทดสอบระบบ 6 สถานะ',
            'code' => 'TEST_POOL_' . uniqid(),
            'fiscal_year' => 2569,
        ]);
        $initialPool = 100000.00;
        CentralAllocation::create([
            'funding_source_id' => $fundingSource->id,
            'fiscal_year' => 2569,
            'amount' => $initialPool,
            'title' => 'งบประมาณจัดสรรทดสอบ',
            'budget_code' => 'TEST-001'
        ]);

        // -------------------------------------------------------------
        // 1. สถานะที่ 1: ผู้เสนอโครงการ (Teacher) เสนอโครงการ
        // -------------------------------------------------------------
        $project = Project::create([
            'title' => 'โครงการพัฒนาทักษะวิชาชีพและการเรียนรู้เชิงรุก',
            'background_rationale' => 'เพื่อยกระดับสมรรถนะผู้เรียนตามมาตรฐานอาชีวศึกษา',
            'objectives' => ['เพื่อพัฒนาทักษะวิชาชีพ', 'เพื่อเสริมสร้างประสบการณ์จริง'],
            'indicators' => ['ร้อยละ 85 ของผู้เข้าร่วมมีทักษะผ่านเกณฑ์'],
            'fiscal_year' => '2569',
            'academic_year' => '2569',
            'user_id' => $teacher->id,
            'department_id' => $department->id,
            'estimated_budget' => 10000.00,
            'proposed_budget' => 10000.00,
            'status' => 'submitted',
            'current_approval_step' => 2,
        ]);

        $this->assertEquals('submitted', $project->status);
        $this->assertEquals(2, $project->current_approval_step);

        // -------------------------------------------------------------
        // 2. การอนุมัติตามสายงาน 6 ขั้นตอน
        // -------------------------------------------------------------
        // Step 2: หัวหน้าแผนก/งานต้นสังกัด
        ProjectApproval::create([
            'project_id' => $project->id,
            'user_id' => $admin->id,
            'step_number' => 2,
            'status' => 'approved',
            'comments' => 'เห็นชอบในหลักการ',
            'signed_at' => now(),
        ]);
        $project->update(['current_approval_step' => 3]);

        // Step 3: สถานะที่ 2 งานแผน (Plan Head: นางวิภา) ตรวจสอบและตัดยอดผูกพันงบประมาณ
        $project->update([
            'funding_source_id' => $fundingSource->id,
            'allocated_budget' => 10000.00,
            'current_approval_step' => 4,
        ]);
        $budget = Budget::create([
            'project_id' => $project->id,
            'funding_source_id' => $fundingSource->id,
            'allocated_amount' => 10000.00,
            'encumbered_amount' => 10000.00, // ล็อกงบ 10,000 บาท
            'spent_amount' => 0.00,
            'is_advance_payment' => true,
        ]);
        ProjectApproval::create([
            'project_id' => $project->id,
            'user_id' => $planHead->id,
            'step_number' => 3,
            'status' => 'approved',
            'comments' => 'ตรวจสอบแล้ว ตัดยอดผูกพันงบประมาณ 10,000 บาท',
            'signed_at' => now(),
        ]);

        // Step 4 & 5: รองผู้อำนวยการ
        ProjectApproval::create([
            'project_id' => $project->id,
            'user_id' => $admin->id,
            'step_number' => 4,
            'status' => 'approved',
            'signed_at' => now(),
        ]);
        ProjectApproval::create([
            'project_id' => $project->id,
            'user_id' => $admin->id,
            'step_number' => 5,
            'status' => 'approved',
            'signed_at' => now(),
        ]);
        $project->update(['current_approval_step' => 6]);

        // Step 6: สถานะที่ 5 ผู้บริหาร (Director: นายกเชษฐ์ กิ่งชนะ)
        ProjectApproval::create([
            'project_id' => $project->id,
            'user_id' => $director->id,
            'step_number' => 6,
            'status' => 'approved',
            'comments' => 'อนุมัติโครงการ',
            'signed_at' => now(),
        ]);
        $project->update([
            'status' => 'approved',
            'approved_at' => now(),
            'sealed_at' => now(),
            'verification_code' => 'NPC-TEST-' . $project->id,
        ]);

        $this->assertEquals('approved', $project->status);
        $this->assertNotNull($project->verification_code);

        // -------------------------------------------------------------
        // 3. สถานะที่ 2 งานแผน: ออกเลขคุมเอกสารและตัดยอดสัญญายืมเงิน (PDCA Do)
        // -------------------------------------------------------------
        $procurement = Procurement::create([
            'project_id' => $project->id,
            'status' => 'plan_cut',
            'loan_status' => 'plan_cut',
            'plan_loan_cut_at' => now(),
            'plan_loan_doc_number' => 'ผง. 101/2569',
            'plan_procurement_doc_number' => 'ผง. 101/2569',
            'procurement_number' => 'ผง. 101/2569',
        ]);
        $project->update(['status' => 'in_progress']);

        // -------------------------------------------------------------
        // 4. สถานะที่ 3 งานพัสดุ: ลงรับชุดจัดซื้อและส่งต่องานการเงิน
        // -------------------------------------------------------------
        $procurement->update(['status' => 'forwarded_to_finance']);
        $this->assertEquals('forwarded_to_finance', $procurement->status);

        // -------------------------------------------------------------
        // 5. สถานะที่ 4 งานการเงิน: ลงรับสัญญายืมเงิน
        // -------------------------------------------------------------
        $procurement->update([
            'finance_received_at' => now(),
            'finance_doc_number' => 'กง. 101/2569',
            'loan_status' => 'finance_received',
        ]);
        $this->assertEquals('finance_received', $procurement->loan_status);

        // -------------------------------------------------------------
        // 6. การเคลียร์เงินยืมและคืนเงิน (Expense Clearance & Refund)
        //    ยืม: 10,000 บาท | ใช้จริง: 8,000 บาท | คืนเงิน: 2,000 บาท
        // -------------------------------------------------------------
        $clearing = ExpenseClearing::create([
            'clearing_number' => 'CLR-2569-TEST01',
            'clearing_type' => 'with_loan',
            'project_id' => $project->id,
            'user_id' => $teacher->id,
            'claimant_name' => $teacher->name,
            'title' => 'เคลียร์เงินยืมโครงการ ' . $project->title,
            'loan_amount' => 10000.00,
            'actual_spent_amount' => 8000.00,
            'difference_amount' => 2000.00,
            'clearing_result' => 'refund', // คืนเงิน
            'status' => 'pending_plan',
        ]);

        $this->assertEquals('refund', $clearing->clearing_result);
        $this->assertEquals(2000.00, (float)$clearing->difference_amount);

        // งานแผนอนุมัติตัดยอดเคลียร์เงิน
        $clearing->update([
            'status' => 'plan_approved',
            'plan_doc_number' => 'ผง.เคลียร์ 101/2569',
            'plan_approved_at' => now(),
            'plan_approved_by' => $planHead->id,
        ]);

        // งานการเงินบันทึกรับเงินคืน 2,000 บาท เข้าคลัง และปิดยอดการเงิน
        $response = $this->actingAs($financeHead)->post(route('clearings.finance_complete', $clearing), [
            'finance_doc_number' => 'กง.เคลียร์ 101/2569',
            'finance_payment_ref' => 'รับคืนเงินสดเข้าคลัง ออกใบเสร็จรับเงินเรียบร้อย',
            'finance_notes' => 'ปิดยอดและคืนเงิน 2,000 บาท เข้าสู่งบประมาณ',
        ]);

        $response->assertSessionHasNoErrors();

        // -------------------------------------------------------------
        // 7. การตรวจสอบความถูกต้องของการคำนวณงบประมาณ (Budget Math Verification)
        // -------------------------------------------------------------
        $budget->refresh();
        $project->refresh();
        $clearing->refresh();

        $this->assertEquals('finance_completed', $clearing->status);
        $this->assertEquals('completed', $project->status);

        // ค่าใช้จ่ายจริงต้องเป็น 8,000.00 บาท
        $this->assertEquals(8000.00, (float)$budget->spent_amount, 'Spent amount must strictly be 8,000 THB');

        // ยอดผูกพันตัดยอดต้องถูกปลดกลับเป็น 0.00 บาท (ไม่มีการล็อกค้าง)
        $this->assertEquals(0.00, (float)$budget->encumbered_amount, 'Encumbered amount must be released to 0 THB');

        // ยอดคงเหลือในแหล่งเงิน (Central Pool Remaining)
        $centralSum = (float)CentralAllocation::where('funding_source_id', $fundingSource->id)->sum('amount');
        $encumberedSum = (float)Budget::where('funding_source_id', $fundingSource->id)->sum('encumbered_amount');
        $spentSum = (float)Budget::where('funding_source_id', $fundingSource->id)->sum('spent_amount');
        $remainingBudget = max(0, $centralSum - $spentSum - $encumberedSum);

        // ยอดที่เหลือต้องเป็น 92,000.00 บาท (100,000 - 8,000)
        // ซึ่งพิสูจน์ว่าเงินคืน 2,000.00 บาท ได้ถูกส่งคืนกลับเข้าไปในงบประมาณเรียบร้อย
        $this->assertEquals(92000.00, $remainingBudget, 'Remaining pool must be 92,000 THB (2,000 THB refund successfully returned)');

        // -------------------------------------------------------------
        // 8. สถานะที่ 6 ผู้ดูแลระบบ (Admin) ตรวจสอบและบันทึก Audit Trail
        // -------------------------------------------------------------
        AuditLog::record(
            action: 'VERIFY_FULL_WORKFLOW',
            model: $project,
            stepNumber: 6,
            notes: "ผู้ดูแลระบบตรวจสอบการทำงานครบทั้ง 6 บทบาท และการคืนเงินเข้าสู่งบประมาณถูกต้องสมบูรณ์"
        );

        $this->assertTrue($admin->isAdmin());
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'VERIFY_FULL_WORKFLOW',
            'auditable_id' => $project->id,
            'auditable_type' => Project::class,
        ]);
    }
}
