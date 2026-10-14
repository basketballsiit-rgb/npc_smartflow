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
        Schema::create('role_delegations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade')->comment('ผู้มอบอำนาจ');
            $table->foreignId('delegate_user_id')->constrained('users')->onDelete('cascade')->comment('ผู้รับมอบอำนาจ/รักษาการ');
            $table->date('start_date')->comment('วันที่เริ่มมีผล');
            $table->date('end_date')->comment('วันที่สิ้นสุดผล');
            $table->string('acting_position')->nullable()->comment('ตำแหน่งที่รักษาการแทน เช่น รักษาการในตำแหน่งผู้อำนวยการวิทยาลัยสารพัดช่างน่าน');
            $table->string('reason')->nullable()->comment('เหตุผลความจำเป็น เช่น ไปราชการ, ลาพักผ่อน, อบรมสัมมนา');
            $table->string('order_number')->nullable()->comment('เลขที่คำสั่งมอบอำนาจ/แต่งตั้ง (ถ้ามี)');
            $table->boolean('is_active')->default(true)->comment('สถานะเปิด/ปิดการใช้งาน');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_active', 'start_date', 'end_date'], 'user_active_delegation_idx');
            $table->index(['delegate_user_id', 'is_active', 'start_date', 'end_date'], 'delegate_active_idx');
        });

        Schema::table('project_approvals', function (Blueprint $table) {
            $table->foreignId('delegated_from_user_id')->nullable()->after('user_id')->constrained('users')->nullOnDelete()->comment('ผู้มอบอำนาจให้ลงนามแทน');
            $table->string('acting_position_text')->nullable()->after('signature_type')->comment('ข้อความประทับใต้ลายเซ็น เช่น รักษาการในตำแหน่ง...');
            $table->foreignId('role_delegation_id')->nullable()->after('delegated_from_user_id')->constrained('role_delegations')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_approvals', function (Blueprint $table) {
            $table->dropForeign(['role_delegation_id']);
            $table->dropForeign(['delegated_from_user_id']);
            $table->dropColumn(['role_delegation_id', 'delegated_from_user_id', 'acting_position_text']);
        });

        Schema::dropIfExists('role_delegations');
    }
};
