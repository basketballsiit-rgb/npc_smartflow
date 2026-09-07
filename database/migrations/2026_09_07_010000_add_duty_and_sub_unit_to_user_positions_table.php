<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. เพิ่มคอลัมน์ในตาราง user_positions
        Schema::table('user_positions', function (Blueprint $table) {
            $table->string('duty')->nullable()->after('position'); // หัวหน้างาน, หัวหน้าสาขาวิชา, เจ้าหน้าที่, ครูผู้สอน
            $table->foreignId('sub_department_id')->nullable()->after('duty')->constrained('departments')->nullOnDelete(); // งานย่อย หรือ สาขาวิชา
            $table->string('major')->nullable()->after('sub_department_id'); // ช่างยนต์, สารสนเทศ, ฯลฯ
        });

        // 2. เพิ่มคอลัมน์ในตาราง projects
        Schema::table('projects', function (Blueprint $table) {
            $table->foreignId('user_position_id')->nullable()->after('department_id')->constrained('user_positions')->nullOnDelete();
            $table->string('proposer_duty')->nullable()->after('user_position_id');
        });

        // 3. ตรวจสอบและเพิ่ม 9 สาขาวิชามาตรฐาน ภายใต้ ฝ่ายวิชาการ (parent_id = 2)
        $academicDept = DB::table('departments')->where('name', 'like', '%ฝ่ายวิชาการ%')->orWhere('code', 'ACAD')->first();
        $academicId = $academicDept ? $academicDept->id : 2;

        $standardMajors = [
            ['name' => 'สาขาวิชาช่างยนต์', 'alias' => 'ช่างยนต์', 'code' => 'AUTO'],
            ['name' => 'สาขาวิชาเทคโนโลยีสารสนเทศ', 'alias' => 'สารสนเทศ', 'code' => 'IT'],
            ['name' => 'สาขาวิชาเทคนิคพื้นฐาน', 'alias' => 'เทคนิคพื้นฐาน', 'code' => 'BASIC_TECH'],
            ['name' => 'สาขาวิชาช่างอิเล็กทรอนิกส์', 'alias' => 'อิเล็กทรอนิกส์', 'code' => 'ELEC'],
            ['name' => 'สาขาวิชาช่างไฟฟ้ากำลัง', 'alias' => 'ไฟฟ้า', 'code' => 'POWER'],
            ['name' => 'สาขาวิชาการบัญชี', 'alias' => 'บัญชี', 'code' => 'ACC'],
            ['name' => 'สาขาวิชาการตลาด', 'alias' => 'การตลาด', 'code' => 'MKT'],
            ['name' => 'สาขาวิชาสามัญสัมพันธ์', 'alias' => 'สามัญสัมพันธ์', 'code' => 'GEN'],
            ['name' => 'สาขาวิชาวิชาชีพระยะสั้น', 'alias' => 'ระยะสั้น', 'code' => 'SHORT'],
        ];

        foreach ($standardMajors as $major) {
            $exists = DB::table('departments')
                ->where('parent_id', $academicId)
                ->where(function ($q) use ($major) {
                    $q->where('name', 'like', '%' . $major['alias'] . '%')
                      ->orWhere('name', $major['name']);
                })
                ->exists();

            if (!$exists) {
                DB::table('departments')->insert([
                    'name' => $major['name'],
                    'code' => $major['code'],
                    'parent_id' => $academicId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['user_position_id']);
            $table->dropColumn(['user_position_id', 'proposer_duty']);
        });

        Schema::table('user_positions', function (Blueprint $table) {
            $table->dropForeign(['sub_department_id']);
            $table->dropColumn(['duty', 'sub_department_id', 'major']);
        });
    }
};
