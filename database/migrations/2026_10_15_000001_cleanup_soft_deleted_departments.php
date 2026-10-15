<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Department;
use App\Models\User;
use App\Models\UserPosition;
use App\Models\Project;
use App\Models\RoutineBudgetPlan;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. ตรวจสอบฝ่ายที่ถูก Soft-delete ทั้งหมดในระบบ
        $trashedDepartments = Department::onlyTrashed()->get();

        foreach ($trashedDepartments as $trashed) {
            $name = $trashed->name;
            $coreName = preg_replace('/^(แผนกวิชา|สาขาวิชา|แผนก|สาขา|งาน)/u', '', $name);
            $coreName = trim($coreName);

            // ค้นหาฝ่ายที่ยัง Active อยู่ที่มีชื่อใกล้เคียงกัน (เช่น สาขาวิชา... เทียบกับ แผนกวิชา...)
            $activeCounterpart = null;
            if (!empty($coreName) && mb_strlen($coreName) >= 3) {
                $activeCounterpart = Department::where('name', 'like', "%{$coreName}%")->first();
            }

            if ($activeCounterpart && $activeCounterpart->id !== $trashed->id) {
                // ย้ายความสัมพันธ์ทั้งหมดมายังฝ่ายที่ Active อยู่
                User::where('department_id', $trashed->id)->update([
                    'department_id' => $activeCounterpart->parent_id ?: $activeCounterpart->id
                ]);
                UserPosition::where('department_id', $trashed->id)->update([
                    'department_id' => $activeCounterpart->parent_id ?: $activeCounterpart->id
                ]);
                UserPosition::where('sub_department_id', $trashed->id)->update([
                    'sub_department_id' => $activeCounterpart->id
                ]);
                Project::where('department_id', $trashed->id)->update([
                    'department_id' => $activeCounterpart->id
                ]);
                RoutineBudgetPlan::where('department_id', $trashed->id)->update([
                    'department_id' => $activeCounterpart->id
                ]);

                // ลบถาวร (forceDelete) เพื่อปลดล็อค SQLite UNIQUE constraint บน departments.name
                $trashed->forceDelete();
            } else {
                // ตรวจสอบว่ามีข้อมูลผูกอยู่หรือไม่
                $hasUsers = User::where('department_id', $trashed->id)->exists();
                $hasPositions = UserPosition::where('department_id', $trashed->id)
                    ->orWhere('sub_department_id', $trashed->id)->exists();
                $hasProjects = Project::where('department_id', $trashed->id)->exists();
                $hasPlans = RoutineBudgetPlan::where('department_id', $trashed->id)->exists();

                if (!$hasUsers && !$hasPositions && !$hasProjects && !$hasPlans) {
                    $trashed->forceDelete();
                } else {
                    // หากมีข้อมูลสำคัญผูกอยู่และไม่มีตัวแทนที่ active ให้ restore กลับคืนมา
                    $trashed->restore();
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse operation needed for cleanup migration
    }
};
