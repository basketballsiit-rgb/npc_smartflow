<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('procurements', function (Blueprint $table) {
            if (!Schema::hasColumn('procurements', 'loan_status')) {
                $table->string('loan_status')->default('pending')->after('status');
            }
            if (!Schema::hasColumn('procurements', 'plan_procurement_cut_at')) {
                $table->timestamp('plan_procurement_cut_at')->nullable()->after('loan_status');
            }
            if (!Schema::hasColumn('procurements', 'plan_procurement_doc_number')) {
                $table->string('plan_procurement_doc_number')->nullable()->after('plan_procurement_cut_at');
            }
            if (!Schema::hasColumn('procurements', 'plan_loan_cut_at')) {
                $table->timestamp('plan_loan_cut_at')->nullable()->after('plan_procurement_doc_number');
            }
            if (!Schema::hasColumn('procurements', 'plan_loan_doc_number')) {
                $table->string('plan_loan_doc_number')->nullable()->after('plan_loan_cut_at');
            }
            if (!Schema::hasColumn('procurements', 'finance_received_at')) {
                $table->timestamp('finance_received_at')->nullable()->after('plan_loan_doc_number');
            }
            if (!Schema::hasColumn('procurements', 'finance_doc_number')) {
                $table->string('finance_doc_number')->nullable()->after('finance_received_at');
            }
            if (!Schema::hasColumn('procurements', 'finance_disbursed_at')) {
                $table->timestamp('finance_disbursed_at')->nullable()->after('finance_doc_number');
            }
            if (!Schema::hasColumn('procurements', 'finance_disbursed_amount')) {
                $table->decimal('finance_disbursed_amount', 12, 2)->nullable()->after('finance_disbursed_at');
            }
            if (!Schema::hasColumn('procurements', 'finance_payment_ref')) {
                $table->string('finance_payment_ref')->nullable()->after('finance_disbursed_amount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('procurements', function (Blueprint $table) {
            $table->dropColumn([
                'loan_status',
                'plan_procurement_cut_at',
                'plan_procurement_doc_number',
                'plan_loan_cut_at',
                'plan_loan_doc_number',
                'finance_received_at',
                'finance_doc_number',
                'finance_disbursed_at',
                'finance_disbursed_amount',
                'finance_payment_ref'
            ]);
        });
    }
};
