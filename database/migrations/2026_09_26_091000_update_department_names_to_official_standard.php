<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update Main Department names to official standard:
        // 1. ฝ่ายวิชาการ
        // 2. ฝ่ายกิจการนักเรียน นักศึกษา
        // 3. ฝ่ายบริหารทรัพยากร
        // 4. ฝ่ายยุทธศาสตร์และแผนงาน
        DB::table('departments')
            ->where('id', 3)
            ->orWhere('name', 'like', '%พัฒนากิจการนักเรียน%')
            ->update(['name' => 'ฝ่ายกิจการนักเรียน นักศึกษา']);

        DB::table('departments')
            ->where('name', 'ฝ่ายแผนงานและความร่วมมือ')
            ->orWhere('name', 'ฝ่ายแผนงานและงบประมาณ')
            ->update(['name' => 'ฝ่ายยุทธศาสตร์และแผนงาน']);

        // Update any deputy positions in departments table if they matched old strings
        DB::table('departments')
            ->where('deputy_director_position', 'like', '%พัฒนากิจการนักเรียน%')
            ->update(['deputy_director_position' => 'รองผู้อำนวยการฝ่ายกิจการนักเรียน นักศึกษา']);

        DB::table('departments')
            ->where('deputy_director_position', 'like', '%แผนงานและความร่วมมือ%')
            ->update(['deputy_director_position' => 'รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน']);
    }

    public function down(): void
    {
        DB::table('departments')
            ->where('name', 'ฝ่ายกิจการนักเรียน นักศึกษา')
            ->update(['name' => 'ฝ่ายพัฒนากิจการนักเรียนนักศึกษา']);
    }
};
