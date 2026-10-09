<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FundingSource;
use Illuminate\Support\Facades\DB;

class UpdateFundingSourcesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks to prevent cascade issues during updates if any
        DB::statement('PRAGMA foreign_keys = OFF;'); // SQLite syntax

        // Clear existing funding sources
        DB::table('funding_sources')->truncate();

        $sources = [
            ['id' => 1, 'name' => 'ปวช.', 'code' => 'VEC_CERT', 'description' => 'งบดำเนินงาน ปวช.', 'fiscal_year' => '2570', 'budget_number' => '20006-2570-001'],
            ['id' => 2, 'name' => 'ปวส.', 'code' => 'VEC_DIP', 'description' => 'งบดำเนินงาน ปวส.', 'fiscal_year' => '2570', 'budget_number' => '20006-2570-101'],
            ['id' => 3, 'name' => 'ระยะสั้น (ตอบแทน วัสดุ ใช้สอย)', 'code' => 'SHORT_COURSE_REMUN', 'description' => 'งบดำเนินงาน ระยะสั้น (ตอบแทน วัสดุ ใช้สอย)', 'fiscal_year' => '2570', 'budget_number' => '20006-2570-201'],
            ['id' => 4, 'name' => 'ระยะสั้น (ค่าสาธารณูปโภค)', 'code' => 'SHORT_COURSE_UTIL', 'description' => 'งบดำเนินงาน ระยะสั้น (ค่าสาธารณูปโภค)', 'fiscal_year' => '2570', 'budget_number' => '20006-2570-202'],
            ['id' => 5, 'name' => 'ทวิศึกษา', 'code' => 'DUAL_EDU', 'description' => 'งบทวิศึกษา', 'fiscal_year' => '2570', 'budget_number' => '20006-2570-301'],
            ['id' => 6, 'name' => 'อุดหนุนเพื่อการจัดการ', 'code' => 'MANAGEMENT_SUBSIDY', 'description' => 'เงินอุดหนุนเพื่อการจัดการศึกษา', 'fiscal_year' => '2570', 'budget_number' => '20006-2570-401'],
            ['id' => 7, 'name' => 'อุดหนุนพัฒนา', 'code' => 'DEVELOPMENT_SUBSIDY', 'description' => 'เงินอุดหนุนพัฒนาสถานศึกษา/นักเรียนนักศึกษา', 'fiscal_year' => '2570', 'budget_number' => '20006-2570-501'],
            ['id' => 8, 'name' => 'อุดหนุนเรียนฟรี 15 ปี (ค่าหนังสือ)', 'code' => 'FREE15_BOOK', 'description' => 'เงินอุดหนุนเรียนฟรี 15 ปี (ค่าหนังสือเรียน)', 'fiscal_year' => '2570', 'budget_number' => '20006-2570-701'],
            ['id' => 9, 'name' => 'อุดหนุนเรียนฟรี 15 ปี (อุปกรณ์การเรียน)', 'code' => 'FREE15_EQUIP', 'description' => 'เงินอุดหนุนเรียนฟรี 15 ปี (ค่าอุปกรณ์การเรียน)', 'fiscal_year' => '2570', 'budget_number' => '20006-2570-702'],
            ['id' => 10, 'name' => 'อุดหนุนเรียนฟรี 15 ปี (เครื่องแบบนักเรียน)', 'code' => 'FREE15_UNIFORM', 'description' => 'เงินอุดหนุนเรียนฟรี 15 ปี (ค่าเครื่องแบบนักเรียน)', 'fiscal_year' => '2570', 'budget_number' => '20006-2570-703'],
            ['id' => 11, 'name' => 'บกศ.', 'code' => 'LOCAL_INCOME', 'description' => 'เงินบำรุงการศึกษา (บกศ.)', 'fiscal_year' => '2570', 'budget_number' => '20006-2570-601'],
        ];

        foreach ($sources as $source) {
            FundingSource::create($source);
        }

        DB::statement('PRAGMA foreign_keys = ON;');
    }
}
