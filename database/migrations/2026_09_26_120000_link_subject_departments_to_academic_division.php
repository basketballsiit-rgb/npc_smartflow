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
        if (Schema::hasTable('departments')) {
            $acadDept = DB::table('departments')->where('name', 'ฝ่ายวิชาการ')->first()
                ?: DB::table('departments')->where('name', 'like', '%วิชาการ%')->whereNull('parent_id')->first();
            $adminDept = DB::table('departments')->where('name', 'like', '%บริหารทรัพยากร%')->whereNull('parent_id')->first();
            $studDept = DB::table('departments')->where('name', 'like', '%กิจการนักเรียน%')->orWhere('name', 'like', '%พัฒนากิจการ%')->whereNull('parent_id')->first();
            $planDept = DB::table('departments')->where('name', 'like', '%ยุทธศาสตร์%')->orWhere('name', 'like', '%แผนงาน%')->whereNull('parent_id')->first();

            $acadId = $acadDept ? $acadDept->id : 2;
            $adminId = $adminDept ? $adminDept->id : 1;
            $studId = $studDept ? $studDept->id : 3;
            $planId = $planDept ? $planDept->id : 4;

            // 1. Link all subject departments and majors to Academic Division (ฝ่ายวิชาการ)
            DB::table('departments')
                ->where('id', '!=', $acadId)
                ->where(function ($q) {
                    $q->where('name', 'like', 'แผนกวิชา%')
                      ->orWhere('name', 'like', 'สาขาวิชา%')
                      ->orWhere('name', 'like', '%ช่างยนต์%')
                      ->orWhere('name', 'like', '%การตลาด%')
                      ->orWhere('name', 'like', '%สารสนเทศ%')
                      ->orWhere('name', 'like', '%เทคโนโลยีสารสนเทศ%')
                      ->orWhere('name', 'like', '%ช่างไฟฟ้า%')
                      ->orWhere('name', 'like', '%ช่างอิเล็กทรอนิกส์%')
                      ->orWhere('name', 'like', '%เทคนิคพื้นฐาน%')
                      ->orWhere('name', 'like', '%การบัญชี%')
                      ->orWhere('name', 'like', '%สามัญสัมพันธ์%')
                      ->orWhere('name', 'like', '%วิชาชีพระยะสั้น%')
                      ->orWhere('name', 'like', '%หลักสูตร%')
                      ->orWhere('name', 'like', '%วัดผล%')
                      ->orWhere('name', 'like', '%วิทยบริการ%');
                })
                ->update(['parent_id' => $acadId]);

            // 2. Link student affairs sub-units (ฝ่ายพัฒนากิจการนักเรียน นักศึกษา)
            DB::table('departments')
                ->where('id', '!=', $studId)
                ->where(function ($q) {
                    $q->where('name', 'like', '%แนะแนว%')
                      ->orWhere('name', 'like', '%ครูที่ปรึกษา%')
                      ->orWhere('name', 'like', '%กิจกรรมนักเรียน%')
                      ->orWhere('name', 'like', '%สวัสดิการนักเรียน%')
                      ->orWhere('name', 'like', '%โครงการพิเศษ%');
                })
                ->update(['parent_id' => $studId]);

            // 3. Link resource management sub-units (ฝ่ายบริหารทรัพยากร)
            DB::table('departments')
                ->where('id', '!=', $adminId)
                ->where(function ($q) {
                    $q->where('name', 'like', '%สารบรรณ%')
                      ->orWhere('name', 'like', '%การเงิน%')
                      ->orWhere('name', 'like', '%พัสดุ%')
                      ->orWhere('name', 'like', '%อาคารสถานที่%')
                      ->orWhere('name', 'like', '%ยานพาหนะ%');
                })
                ->update(['parent_id' => $adminId]);

            // 4. Link strategic planning sub-units (ฝ่ายยุทธศาสตร์และแผนงาน)
            DB::table('departments')
                ->where('id', '!=', $planId)
                ->where(function ($q) {
                    $q->where('name', 'like', '%ประกันคุณภาพ%')
                      ->orWhere('name', 'like', '%ศูนย์บ่มเพาะ%')
                      ->orWhere('name', 'like', '%วิจัย%')
                      ->orWhere('name', 'like', '%ศูนย์ดิจิทัล%')
                      ->orWhere('name', 'like', '%ประชาสัมพันธ์%')
                      ->orWhere('name', 'like', '%พัฒนายุทธศาสตร์%');
                })
                ->update(['parent_id' => $planId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
