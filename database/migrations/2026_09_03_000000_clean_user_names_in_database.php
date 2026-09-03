<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $users = DB::table('users')->get();

        $rolesToStrip = [
            'หัวหน้างานวางแผนและงบประมาณ',
            'หัวหน้างานวางแผน',
            'หัวหน้างานพัสดุ',
            'ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน',
            'รองผู้อำนวยการฝ่ายบริหารทรัพยากร',
            'รองผู้อำนวยการฝ่ายแผนงานและความร่วมมือ',
            'รองผู้อำนวยการฝ่ายวิชาการ',
            'รองผู้อำนวยการฝ่ายพัฒนากิจการนักเรียนนักศึกษา',
            'หัวหน้างานการเงิน',
            'หัวหน้าแผนกวิชา',
            'หัวหน้างาน',
            'อาจารย์ประจำสาขา',
            'ครูผู้สอน',
            'Super Admin',
        ];

        foreach ($users as $user) {
            $name = $user->name;
            // Clean parenthetical tags
            $cleaned = preg_replace('/\s*\(.*?\)/u', '', $name);
            $cleaned = preg_replace('/\s*\[.*?\]/u', '', $cleaned);

            foreach ($rolesToStrip as $role) {
                $cleaned = str_ireplace($role, '', $cleaned);
            }

            $cleaned = trim(str_replace(['(', ')'], '', $cleaned));
            $cleaned = preg_replace('/\s+/u', ' ', $cleaned);

            if (!empty($cleaned) && $cleaned !== $name) {
                DB::table('users')->where('id', $user->id)->update([
                    'name' => $cleaned
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rollback needed
    }
};
