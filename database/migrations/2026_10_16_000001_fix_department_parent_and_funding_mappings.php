<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\Department;
use App\Models\Project;
use App\Models\Budget;
use App\Models\FundingSource;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Resolve canonical Main Divisions
        $planDept = Department::whereNull('parent_id')
            ->where(function ($q) {
                $q->where('name', 'like', '%ยุทธศาสตร์%')->orWhere('name', 'like', '%แผนงาน%');
            })
            ->first() ?: Department::where('code', 'STRATEGY_PLAN')->first();

        $acadDept = Department::whereNull('parent_id')
            ->where('name', 'like', '%วิชาการ%')
            ->first() ?: Department::where('code', 'ACAD')->first();

        $bksoSource = FundingSource::where('name', 'like', '%บกศ%')->orWhere('code', 'LOCAL_INCOME')->first();
        $bksoId = $bksoSource ? $bksoSource->id : 11;

        // 2. Link "งานส่งเสริมธุรกิจและการเป็นผู้ประกอบการ (ศูนย์บ่มเพาะฯ)" strictly under ฝ่ายยุทธศาสตร์และแผนงาน
        if ($planDept) {
            Department::where(function ($q) {
                $q->where('name', 'like', '%ส่งเสริมธุรกิจ%')
                  ->orWhere('name', 'like', '%ผู้ประกอบการ%')
                  ->orWhere('name', 'like', '%ศูนย์บ่มเพาะ%')
                  ->orWhere('name', 'like', '%บ่มเพาะ%');
            })
            ->update(['parent_id' => $planDept->id]);

            // Ensure projects under business/incubator department have Section 6.4 (โครงการฝ่ายยุทธศาสตร์และแผนงาน)
            $planDeptIds = Department::where('parent_id', $planDept->id)
                ->orWhere('id', $planDept->id)
                ->pluck('id')
                ->toArray();

            Project::whereIn('department_id', $planDeptIds)
                ->update(['report_category' => '6.4']);

            // Specifically for projects with titles mentioning business/entrepreneurship under strategy division
            Project::where(function ($q) {
                $q->where('title', 'like', '%ผู้ประกอบการ%')
                  ->orWhere('title', 'like', '%ศูนย์บ่มเพาะ%')
                  ->orWhere('title', 'like', '%ส่งเสริมธุรกิจ%');
            })->update(['report_category' => '6.4']);
        }

        // 3. Reconcile projects that use บกศ. funding source to have funding_source_id = 11 (not 7)
        $bksoProjectTitles = [
            'โครงการจัดทำแผนปฏิบัติราชการ%',
            'โครงการพัฒนาอินเทอร์เน็ตภายในวิทยาลัยสารพัดช่างน่าน%',
            'โครงการพิธีมอบประกาศนียบัตรแก่ผู้สำเร็จการศึกษา%'
        ];

        foreach ($bksoProjectTitles as $pattern) {
            $projects = Project::where('title', 'like', $pattern)->get();
            foreach ($projects as $proj) {
                $proj->funding_source_id = $bksoId;
                $proj->save();

                Budget::where('project_id', $proj->id)->update([
                    'funding_source_id' => $bksoId,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse operation required
    }
};
