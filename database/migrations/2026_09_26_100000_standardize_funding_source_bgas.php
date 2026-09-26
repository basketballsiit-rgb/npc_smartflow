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
            // 1. Update any local income, school revenue, or maintenance budget to standard "บกศ."
            DB::table('funding_sources')
                ->where('name', 'LIKE', '%สถานศึกษา%')
                ->orWhere('name', 'LIKE', '%Revenue%')
                ->orWhere('name', 'LIKE', '%บำรุงการศึกษา%')
                ->orWhere('name', 'LIKE', '%บกศ%')
                ->orWhere('code', 'REVENUE')
                ->orWhere('code', 'LOCAL_INCOME')
                ->update([
                    'name' => 'บกศ.',
                    'code' => 'LOCAL_INCOME',
                    'description' => 'เงินบำรุงการศึกษา (บกศ.)',
                    'fiscal_year' => '2569',
                    'budget_number' => '20006-2569-601',
                ]);

            // 2. Ensure all 7 standard funding sources are properly named and standardized
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
                $exists = DB::table('funding_sources')
                    ->where('code', $src['code'])
                    ->orWhere('name', $src['name'])
                    ->first();

                if ($exists) {
                    DB::table('funding_sources')
                        ->where('id', $exists->id)
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
                        'total_budget' => 0,
                        'allocated_budget' => 0,
                        'encumbered_budget' => 0,
                        'spent_budget' => 0,
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
