<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\Procurement;
use App\Models\SystemSetting;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Clear premature plan document numbers on procurements that haven't actually been cut by planning
        Procurement::whereNull('plan_procurement_cut_at')
            ->update([
                'plan_procurement_doc_number' => null,
                'procurement_number' => null,
            ]);

        Procurement::whereNull('plan_loan_cut_at')
            ->update([
                'plan_loan_doc_number' => null,
            ]);

        // 2. Reset or align unified document numbering counter based on actual cut documents
        $actualCutCount = Procurement::whereNotNull('plan_procurement_cut_at')->count();
        $nextNo = $actualCutCount > 0 ? ($actualCutCount + 1) : 1;

        SystemSetting::updateOrCreate(
            ['key' => 'doc_unified_current_no'],
            [
                'value' => $nextNo,
                'group' => 'numbering',
                'type' => 'number',
                'label' => 'ลำดับเลขที่เอกสารแผนงานปัจจุบัน',
            ]
        );

        $actualLoanCutCount = Procurement::whereNotNull('plan_loan_cut_at')->count();
        $nextLoanNo = $actualLoanCutCount > 0 ? ($actualLoanCutCount + 1) : 1;

        SystemSetting::updateOrCreate(
            ['key' => 'doc_loan_current_no'],
            [
                'value' => $nextLoanNo,
                'group' => 'numbering',
                'type' => 'number',
                'label' => 'ลำดับเลขที่สัญญายืมเงินแผนงานปัจจุบัน',
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Irreversible data cleanup
    }
};
