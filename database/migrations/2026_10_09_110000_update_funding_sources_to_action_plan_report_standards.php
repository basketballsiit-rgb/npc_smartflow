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
        if (!Schema::hasTable('funding_sources')) {
            return;
        }

        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        if ($isSqlite) {
            DB::statement('PRAGMA foreign_keys = OFF;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        }

        // Remap helper for related tables
        $tables = ['budgets', 'projects', 'central_allocations', 'routine_budget_plans', 'travel_loans', 'expense_clearings'];
        $remap = function ($fromId, $toId) use ($tables) {
            if ($fromId == $toId) return;
            foreach ($tables as $tbl) {
                if (Schema::hasTable($tbl) && Schema::hasColumn($tbl, 'funding_source_id')) {
                    DB::table($tbl)->where('funding_source_id', $fromId)->update(['funding_source_id' => $toId]);
                }
            }
        };

        // 11 Official Funding Sources matching Action Plan Expenditure Report columns
        $officialSources = [
            1 => [
                'name' => 'ปวช.',
                'code' => 'VEC_CERT',
                'description' => 'งบดำเนินงาน ปวช.',
                'fiscal_year' => '2570',
                'budget_number' => null
            ],
            2 => [
                'name' => 'ปวส.',
                'code' => 'VEC_DIP',
                'description' => 'งบดำเนินงาน ปวส.',
                'fiscal_year' => '2570',
                'budget_number' => null
            ],
            3 => [
                'name' => 'ระยะสั้น (ตอบแทน วัสดุ ใช้สอย)',
                'code' => 'SHORT_COURSE_REMUN',
                'description' => 'งบดำเนินงาน ระยะสั้น (ตอบแทน วัสดุ ใช้สอย)',
                'fiscal_year' => '2570',
                'budget_number' => null
            ],
            4 => [
                'name' => 'ระยะสั้น (ค่าสาธารณูปโภค)',
                'code' => 'SHORT_COURSE_UTIL',
                'description' => 'งบดำเนินงาน ระยะสั้น (ค่าสาธารณูปโภค)',
                'fiscal_year' => '2570',
                'budget_number' => null
            ],
            5 => [
                'name' => 'ทวิศึกษา',
                'code' => 'DUAL_EDU',
                'description' => 'งบทวิศึกษา',
                'fiscal_year' => '2570',
                'budget_number' => null
            ],
            6 => [
                'name' => 'อุดหนุนเพื่อการจัดการ',
                'code' => 'MANAGEMENT_SUBSIDY',
                'description' => 'เงินอุดหนุนเพื่อการจัดการศึกษา',
                'fiscal_year' => '2570',
                'budget_number' => null
            ],
            7 => [
                'name' => 'อุดหนุนพัฒนา',
                'code' => 'DEVELOPMENT_SUBSIDY',
                'description' => 'เงินอุดหนุนพัฒนาสถานศึกษา/นักเรียนนักศึกษา',
                'fiscal_year' => '2570',
                'budget_number' => null
            ],
            8 => [
                'name' => 'อุดหนุนเรียนฟรี 15 ปี (ค่าหนังสือ)',
                'code' => 'FREE15_BOOK',
                'description' => 'เงินอุดหนุนเรียนฟรี 15 ปี (ค่าหนังสือเรียน)',
                'fiscal_year' => '2570',
                'budget_number' => null
            ],
            9 => [
                'name' => 'อุดหนุนเรียนฟรี 15 ปี (อุปกรณ์การเรียน)',
                'code' => 'FREE15_EQUIP',
                'description' => 'เงินอุดหนุนเรียนฟรี 15 ปี (ค่าอุปกรณ์การเรียน)',
                'fiscal_year' => '2570',
                'budget_number' => null
            ],
            10 => [
                'name' => 'อุดหนุนเรียนฟรี 15 ปี (เครื่องแบบนักเรียน)',
                'code' => 'FREE15_UNIFORM',
                'description' => 'เงินอุดหนุนเรียนฟรี 15 ปี (ค่าเครื่องแบบนักเรียน)',
                'fiscal_year' => '2570',
                'budget_number' => null
            ],
            11 => [
                'name' => 'บกศ.',
                'code' => 'LOCAL_INCOME',
                'description' => 'เงินบำรุงการศึกษา (บกศ.)',
                'fiscal_year' => '2570',
                'budget_number' => null
            ],
        ];

        // Gather existing funding sources in DB to build an intelligent remap dictionary
        $existingSources = DB::table('funding_sources')->get();
        foreach ($existingSources as $old) {
            $n = mb_strtolower($old->name ?? '');
            $targetId = null;

            if (str_contains($n, 'หนังสือ')) $targetId = 8;
            elseif (str_contains($n, 'อุปกรณ์')) $targetId = 9;
            elseif (str_contains($n, 'เครื่องแบบ')) $targetId = 10;
            elseif (str_contains($n, 'สาธารณูปโภค')) $targetId = 4;
            elseif (str_contains($n, 'ระยะสั้น') || str_contains($old->code ?? '', 'SHORT_COURSE')) $targetId = 3;
            elseif (str_contains($n, 'ปวช') || str_contains($old->code ?? '', 'VEC_CERT')) $targetId = 1;
            elseif (str_contains($n, 'ปวส') || str_contains($old->code ?? '', 'VEC_DIP')) $targetId = 2;
            elseif (str_contains($n, 'ทวิ') || str_contains($old->code ?? '', 'DUAL_EDU')) $targetId = 5;
            elseif (str_contains($n, 'จัดการ') || str_contains($old->code ?? '', 'MANAGEMENT')) $targetId = 6;
            elseif (str_contains($n, 'พัฒนา') || str_contains($old->code ?? '', 'DEVELOPMENT')) $targetId = 7;
            elseif (
                str_contains($n, 'บกศ') || 
                str_contains($n, 'บำรุงการศึกษา') || 
                str_contains($n, 'สถานศึกษา') || 
                str_contains($n, 'government') || 
                str_contains($n, 'donation') || 
                str_contains($n, 'รายได้')
            ) $targetId = 11;
            else $targetId = 11; // default fallback to บกศ.

            if ($targetId && $old->id != $targetId) {
                $remap($old->id, $targetId);
            }
        }

        // Clear existing funding sources
        DB::table('funding_sources')->delete();

        // Insert standardized 11 sources
        foreach ($officialSources as $id => $data) {
            DB::table('funding_sources')->insert(array_merge($data, [
                'id' => $id,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        if ($isSqlite) {
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
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
