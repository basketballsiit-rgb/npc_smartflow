<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('expense_clearings')) {
            Schema::create('expense_clearings', function (Blueprint $table) {
                $table->id();
                $table->string('clearing_number')->unique()->comment('รหัสคุมการเคลียร์ เช่น CLR-2569-0001');
                $table->string('clearing_type', 30)->default('with_loan')->comment('with_loan: เคลียร์สัญญายืมเงิน, direct_reimburse: ขอเบิกจ่ายตรง/ไม่มีสัญญายืม');
                
                // Budget Links
                $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
                $table->foreignId('routine_budget_plan_id')->nullable()->constrained('routine_budget_plans')->nullOnDelete();
                $table->foreignId('funding_source_id')->nullable()->constrained('funding_sources')->nullOnDelete();
                $table->foreignId('travel_loan_id')->nullable()->constrained('travel_loans')->nullOnDelete();
                $table->foreignId('procurement_id')->nullable()->constrained('procurements')->nullOnDelete();
                
                // Claimant / Borrower Info
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('claimant_name');
                $table->string('claimant_position')->nullable();
                $table->string('claimant_department')->nullable();
                $table->string('title')->comment('วัตถุประสงค์ หรือเรื่องที่ขอเบิก/เคลียร์');
                $table->date('expense_date')->nullable()->comment('วันที่ดำเนินกิจกรรมหรือจ่ายเงินจริง');

                // Amounts
                $table->decimal('loan_amount', 12, 2)->default(0)->comment('จำนวนเงินที่ยืมไป (0 ถ้าไม่มีสัญญายืม)');
                $table->decimal('actual_spent_amount', 12, 2)->default(0)->comment('ยอดจ่ายจริงตามใบเสร็จ');
                $table->decimal('difference_amount', 12, 2)->default(0)->comment('ผลต่าง actual_spent - loan_amount');
                $table->string('clearing_result', 20)->default('exact')->comment('refund: เหลือส่งคืน, exact: พอดี, reimburse: ขาด/ขอเบิกเพิ่ม');
                
                // Expense Breakdown & Receipts
                $table->json('expense_items')->nullable()->comment('ตารางแจกแจงรายการค่าใช้จ่ายย่อย');
                $table->integer('receipt_count')->default(0)->comment('จำนวนใบเสร็จหรือหลักฐานแนบ');
                $table->string('receipt_reference')->nullable()->comment('เลขที่ใบเสร็จ หรือเลขอ้างอิงเอกสารแนบ');

                // Workflow & Status
                $table->string('status', 30)->default('pending_plan')->comment('pending_plan, plan_approved, finance_completed, rejected');
                
                // Plan Department Cut
                $table->string('plan_doc_number')->nullable()->comment('เลขที่ตัดยอดงานแผนงาน เช่น ผง. 12/2569');
                $table->timestamp('plan_approved_at')->nullable();
                $table->foreignId('plan_approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('plan_notes')->nullable();

                // Finance Department Disburse / Receive
                $table->string('finance_doc_number')->nullable()->comment('เลขที่รับ/จ่ายงานการเงิน');
                $table->timestamp('finance_completed_at')->nullable();
                $table->foreignId('finance_completed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('finance_payment_ref')->nullable()->comment('เลขอ้างอิงการโอนเงินคืน/รับเงินคืน');
                $table->text('finance_notes')->nullable();

                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expense_clearings');
    }
};
