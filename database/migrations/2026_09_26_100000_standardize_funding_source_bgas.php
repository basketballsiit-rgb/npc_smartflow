<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('funding_sources')) {
            // Helper function to safely remap foreign keys and delete obsolete rows
            $remapAndDelete = function ($fromId, $toId) {
                if ($fromId == $toId) return;

                $tables = ['budgets', 'projects', 'central_allocations', 'routine_budget_plans', 'travel_loans', 'expense_clearings'];
                foreach ($tables as $tbl) {
                    if (Schema::hasTable($tbl) && Schema::hasColumn($tbl, 'funding_source_id')) {
                        DB::table($tbl)->where('funding_source_id', $fromId)->update(['funding_source_id' => $toId]);
                    }
                }
                DB::table('funding_sources')->where('id', $fromId)->delete();
            };

            // 1. Gather all existing rows that represent บกศ. / school revenue / local income
            $bgasRows = DB::table('funding_sources')
                ->where('name', 'LIKE', '%สถานศึกษา%')
                ->orWhere('name', 'LIKE', '%Revenue%')
                ->orWhere('name', 'LIKE', '%บำรุงการศึกษา%')
                ->orWhere('name', 'LIKE', '%บกศ%')
                ->orWhere('code', 'REVENUE')
                ->orWhere('code', 'LOCAL_INCOME')
                ->get();

            if ($bgasRows->isNotEmpty()) {
                // Prefer ID 7 if present, otherwise the first matched record
                $primaryBgas = $bgasRows->firstWhere('id', 7) ?: $bgasRows->first();

                // Merge and delete any duplicate rows to prevent UNIQUE constraint violation on code/name
                foreach ($bgasRows as $row) {
                    if ($row->id != $primaryBgas->id) {
                        $remapAndDelete($row->id, $primaryBgas->id);
                    }
                }

                // Update the single primary row to standard บกศ.
                DB::table('funding_sources')
                    ->where('id', $primaryBgas->id)
                    ->update([
                        'name' => 'บกศ.',
                        'code' => 'LOCAL_INCOME',
                        'description' => 'เงินบำรุงการศึกษา (บกศ.)',
                        'fiscal_year' => '2569',
                        'budget_number' => '20006-2569-601',
                    ]);
            }

            // 2. Standardize all 7 standard funding sources safely
            $standardSources = [
                ['name' => 'ปวช.', 'code' => 'VEC_CERT', 'description' => 'งบดำเนินงาน ปวช.', 'budget_number' => '20006-2569-001'],
                ['name' => 'ปวส.', 'code' => 'VEC_DIP', 'description' => 'งบดำเนินงาน ปวส.', 'budget_number' => '20006-2569-101'],
                ['name' => 'ระยะสั้น', 'code' => 'SHORT_COURSE', 'description' => 'งบดำเนินงาน ระยะสั้น', 'budget_number' => '20006-2569-201'],
                ['name' => 'งบทวิศึกษา', 'code' => 'DUAL_EDU', 'description' => 'งบทวิศึกษา', 'budget_number' => '20006-2569-301'],
                ['name' => 'อุดหนุนเพื่อการจัดการฯ', 'code' => 'MANAGEMENT_SUBSIDY', 'description' => 'อุดหนุนเพื่อการจัดการศึกษา', 'budget_number' => '20006-2569-401'],
                ['name' => 'อุดหนุนพัฒนาฯ', 'code' => 'DEVELOPMENT_SUBSIDY', 'description' => 'อุดหนุนพัฒนาสถานศึกษา/นักศึกษา', 'budget_number' => '20006-2569-501'],
                ['name' => 'บกศ.', 'code' => 'LOCAL_INCOME', 'description' => 'เงินบำรุงการศึกษา (บกศ.)', 'budget_number' => '20006-2569-601'],
            ];

            foreach ($standardSources as $src) {
                $byCode = DB::table('funding_sources')->where('code', $src['code'])->first();
                $byName = DB::table('funding_sources')->where('name', $src['name'])->first();

                if ($byCode && $byName && $byCode->id != $byName->id) {
                    // Merge byName into byCode
                    $remapAndDelete($byName->id, $byCode->id);
                    $existing = $byCode;
                } else {
                    $existing = $byCode ?: $byName;
                }

                if ($existing) {
                    DB::table('funding_sources')
                        ->where('id', $existing->id)
                        ->update([
                            'name' => $src['name'],
                            'code' => $src['code'],
                            'description' => $src['description'],
                            'fiscal_year' => '2569',
                            'budget_number' => $src['budget_number'],
                        ]);
                } else {
                    DB::table('funding_sources')->insert(array_merge($src, [
                        'fiscal_year' => '2569',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]));
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive standardization does not require reversal
    }
};
