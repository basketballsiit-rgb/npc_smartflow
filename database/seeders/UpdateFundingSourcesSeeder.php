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
            ['name' => 'ปวช.', 'code' => 'VEC_CERT', 'description' => 'งบดำเนินงาน ปวช.'],
            ['name' => 'ปวส.', 'code' => 'VEC_DIP', 'description' => 'งบดำเนินงาน ปวส.'],
            ['name' => 'ระยะสั้น', 'code' => 'SHORT_COURSE', 'description' => 'งบดำเนินงาน ระยะสั้น'],
            ['name' => 'งบทวิศึกษา', 'code' => 'DUAL_EDU', 'description' => 'งบทวิศึกษา'],
            ['name' => 'อุดหนุนเพื่อการจัดการฯ', 'code' => 'MANAGEMENT_SUBSIDY', 'description' => 'อุดหนุนเพื่อการจัดการศึกษา'],
            ['name' => 'อุดหนุนพัฒนาฯ', 'code' => 'DEVELOPMENT_SUBSIDY', 'description' => 'อุดหนุนพัฒนาสถานศึกษา/นักศึกษา'],
            ['name' => 'บกศ.', 'code' => 'LOCAL_INCOME', 'description' => 'เงินบำรุงการศึกษา (บกศ.)'],
        ];

        foreach ($sources as $source) {
            FundingSource::create($source);
        }

        DB::statement('PRAGMA foreign_keys = ON;');
    }
}
