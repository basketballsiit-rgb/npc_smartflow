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
        Schema::table('travel_loans', function (Blueprint $table) {
            $table->foreignId('funding_source_id')->nullable()->after('project_id')->constrained('funding_sources')->nullOnDelete();
            $table->string('plan_doc_number')->nullable()->after('loan_status')->comment('เลขคุมตัดยอดงบของงานแผน');
            $table->timestamp('plan_cut_at')->nullable()->after('plan_doc_number');
            $table->foreignId('plan_cut_by')->nullable()->after('plan_cut_at')->constrained('users')->nullOnDelete();
            $table->string('finance_doc_number')->nullable()->after('plan_cut_by')->comment('เลขลงรับงานการเงิน');
            $table->timestamp('finance_received_at')->nullable()->after('finance_doc_number');
            $table->timestamp('finance_disbursed_at')->nullable()->after('finance_received_at');
            $table->decimal('finance_disbursed_amount', 12, 2)->nullable()->after('finance_disbursed_at');
            $table->string('finance_payment_ref')->nullable()->after('finance_disbursed_amount');
            $table->text('plan_notes')->nullable()->after('finance_payment_ref');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('travel_loans', function (Blueprint $table) {
            $table->dropForeign(['funding_source_id']);
            $table->dropForeign(['plan_cut_by']);
            $table->dropColumn([
                'funding_source_id',
                'plan_doc_number',
                'plan_cut_at',
                'plan_cut_by',
                'finance_doc_number',
                'finance_received_at',
                'finance_disbursed_at',
                'finance_disbursed_amount',
                'finance_payment_ref',
                'plan_notes',
            ]);
        });
    }
};
