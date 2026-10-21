<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\Department;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\UserPosition;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Standardize 4 Parent Divisions with their official Deputy Directors
        $divisions = [
            'ฝ่ายบริหารทรัพยากร' => [
                'deputy_director_name' => 'นายจักรพงศ์ พรหมสกุลปัญญา',
                'deputy_director_position' => 'รองผู้อำนวยการฝ่ายบริหารทรัพยากร',
            ],
            'ฝ่ายวิชาการ' => [
                'deputy_director_name' => 'นายนิพนธ์ ร่องพืช',
                'deputy_director_position' => 'รองผู้อำนวยการฝ่ายวิชาการ',
            ],
            'ฝ่ายกิจการนักเรียนนักศึกษา' => [
                'deputy_director_name' => 'นายวิทยา ปันโน',
                'deputy_director_position' => 'ปฏิบัติหน้าที่รองผู้อำนวยการฝ่ายกิจการนักเรียนนักศึกษา',
            ],
            'ฝ่ายยุทธศาสตร์และแผนงาน' => [
                'deputy_director_name' => 'นายนิพนธ์ ร่องพืช',
                'deputy_director_position' => 'รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน',
            ],
        ];

        foreach ($divisions as $name => $data) {
            Department::whereNull('parent_id')
                ->where('name', $name)
                ->update([
                    'deputy_director_name' => $data['deputy_director_name'],
                    'deputy_director_position' => $data['deputy_director_position'],
                ]);
        }

        // 2. Standardize SystemSettings for Executive & Deputy Roles
        $settings = [
            'director_name' => 'นายกเชษฐ์ กิ่งชนะ',
            'director_position' => 'ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน',
            'academic_deputy_name' => 'นายนิพนธ์ ร่องพืช',
            'academic_deputy_position' => 'รองผู้อำนวยการฝ่ายวิชาการ',
            'resource_deputy_name' => 'นายจักรพงศ์ พรหมสกุลปัญญา',
            'resource_deputy_position' => 'รองผู้อำนวยการฝ่ายบริหารทรัพยากร',
            'student_affairs_deputy_name' => 'นายวิทยา ปันโน',
            'student_affairs_deputy_position' => 'ปฏิบัติหน้าที่รองผู้อำนวยการฝ่ายกิจการนักเรียนนักศึกษา',
            'plan_deputy_name' => 'นายนิพนธ์ ร่องพืช',
            'plan_deputy_position' => 'รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน',
            'plan_head_name' => 'นายพิพัฒน์ สีมา',
            'plan_head_position' => 'หัวหน้างานพัฒนายุทธศาสตร์ แผนงานและงบประมาณ',
        ];

        foreach ($settings as $key => $val) {
            SystemSetting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => $val,
                    'group' => 'general',
                    'label' => $key,
                    'type' => 'text',
                ]
            );
        }

        // 3. Align User "นายนิพนธ์ ร่องพืช" to Deputy Director of Academic Affairs (ฝ่ายวิชาการ)
        $acadDept = Department::whereNull('parent_id')->where('name', 'ฝ่ายวิชาการ')->first();
        if ($acadDept) {
            $niponUsers = User::where('name', 'like', '%นิพนธ์%')->orWhere('email', 'nipon@npc.ac.th')->get();
            foreach ($niponUsers as $u) {
                $u->update([
                    'department_id' => $acadDept->id,
                    'position' => 'รองผู้อำนวยการฝ่ายวิชาการ',
                ]);

                UserPosition::updateOrCreate(
                    [
                        'user_id' => $u->id,
                        'is_primary' => true,
                    ],
                    [
                        'department_id' => $acadDept->id,
                        'position' => 'รองผู้อำนวยการฝ่ายวิชาการ',
                        'duty' => 'รองผู้อำนวยการ',
                    ]
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse
    }
};
