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
        if (!Schema::hasTable('travel_loans')) {
            Schema::create('travel_loans', function (Blueprint $table) {
                $table->id();
                $table->string('travel_id')->unique()->comment('ID คำขอไปราชการจากระบบ npc_hr');
                $table->string('contract_no')->nullable()->comment('เลขที่สัญญายืมเงิน เช่น สย.01/2569');
                $table->string('system_source')->default('npc_hr')->comment('ระบบต้นทาง');
                
                // ข้อมูลผู้ยืม
                $table->string('borrower_user_id')->nullable();
                $table->string('borrower_name');
                $table->string('borrower_position')->nullable();
                $table->string('borrower_department')->nullable();
                $table->string('borrower_staff_type')->nullable();
                
                // รายละเอียดการเดินทาง
                $table->string('subject');
                $table->string('destination');
                $table->date('start_date');
                $table->date('end_date');
                $table->decimal('total_days', 5, 2)->default(0);
                $table->date('doc_date')->nullable();
                $table->date('due_date')->nullable()->comment('วันครบกำหนดส่งใช้เงินยืม');
                $table->integer('return_days')->default(30);
                $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
                $table->string('expense_type')->default('claim');
                
                // รายการยอดเงินยืม
                $table->decimal('allowance_amount', 12, 2)->default(0);
                $table->text('allowance_detail')->nullable();
                $table->decimal('rent_amount', 12, 2)->default(0);
                $table->text('rent_detail')->nullable();
                $table->decimal('vehicle_amount', 12, 2)->default(0);
                $table->text('vehicle_detail')->nullable();
                $table->decimal('other_amount', 12, 2)->default(0);
                $table->text('other_detail')->nullable();
                
                $table->decimal('total_loan_amount', 12, 2)->default(0);
                $table->string('thai_baht_text')->nullable();
                
                // สถานะสัญญายืมเงิน
                $table->string('loan_status')->default('borrowed')->comment('borrowed, cleared, partial_cleared, cancelled');
                $table->decimal('cleared_amount', 12, 2)->default(0);
                $table->decimal('refund_amount', 12, 2)->default(0);
                $table->timestamp('cleared_at')->nullable();
                $table->string('clearance_ref_id')->nullable();
                
                // ข้อมูลผู้อนุมัติ
                $table->timestamp('approved_at')->nullable();
                $table->string('approved_by_director')->nullable();
                $table->string('approved_by_deputy')->nullable();
                $table->string('finance_checked_by')->nullable();
                
                // เก็บ JSON Payload ทั้งหมดไว้ตรวจสอบย้อนหลัง
                $table->longText('raw_payload')->nullable();
                
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('travel_loans');
    }
};
