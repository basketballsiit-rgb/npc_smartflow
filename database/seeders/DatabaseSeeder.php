<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\IqaStrategy;
use App\Models\OvecStrategy;
use App\Models\FundingSource;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Roles
        $roles = [
            ['name' => 'admin', 'display_name' => 'ผู้ดูแลระบบ (Admin)', 'description' => 'ผู้ดูแลระบบสูงสุด สามารถกำหนดค่าระบบและจัดการผู้ใช้'],
            ['name' => 'teacher', 'display_name' => 'ครูผู้สอน / ผู้เสนอโครงการ', 'description' => 'เสนอโครงการ ดำเนินการ DO ประเมินผล CHECK และติดตามรายงาน'],
            ['name' => 'plan_head', 'display_name' => 'หัวหน้างานวางแผน', 'description' => 'ตรวจสอบและอนุมัติโครงการ ผูกพันงบประมาณ'],
            ['name' => 'procurement_head', 'display_name' => 'หัวหน้างานพัสดุ', 'description' => 'จัดการคิวพัสดุ แต่งตั้งกรรมการ และออกเอกสารจัดซื้อจัดจ้าง'],
            ['name' => 'finance_head', 'display_name' => 'หัวหน้างานการเงิน', 'description' => 'ตรวจสอบและลงรับสัญญายืมเงิน โอนเงิน/จ่ายเงินจริง และปิดยอดเคลียร์เงินยืม'],
            ['name' => 'executive', 'display_name' => 'ผู้บริหาร (ผู้อำนวยการ/รองฯ)', 'description' => 'พิจารณาอนุมัติขั้นสุดท้าย ดูรายงานและสถิติภาพรวม'],
        ];

        foreach ($roles as $roleData) {
            Role::firstOrCreate(['name' => $roleData['name']], $roleData);
        }

        // 2. Seed Departments
        $departments = [
            ['name' => 'ฝ่ายบริหารทรัพยากร', 'code' => 'PLAN'],
            ['name' => 'ฝ่ายวิชาการ', 'code' => 'ACAD'],
            ['name' => 'ฝ่ายกิจการนักเรียน นักศึกษา', 'code' => 'STUD'],
            ['name' => 'ฝ่ายยุทธศาสตร์และแผนงาน', 'code' => 'ADMIN'],
        ];

        foreach ($departments as $deptData) {
            Department::firstOrCreate(['code' => $deptData['code']], $deptData);
        }

        // Seed Default Legacy Strategies if needed
        IqaStrategy::firstOrCreate(['id' => 1], ['name' => 'มาตรฐานการอาชีวศึกษา', 'description' => 'มาตรฐานการอาชีวศึกษา']);
        OvecStrategy::firstOrCreate(['id' => 1], ['name' => 'นโยบายเร่งด่วน สอศ.', 'description' => 'นโยบายเร่งด่วน สอศ.']);

        // Fetch models to map IDs
        $adminRole = Role::where('name', 'admin')->first();
        $teacherRole = Role::where('name', 'teacher')->first();
        $planRole = Role::where('name', 'plan_head')->first();
        $procurementRole = Role::where('name', 'procurement_head')->first();
        $execRole = Role::where('name', 'executive')->first();

        $planDept = Department::where('code', 'PLAN')->first();
        $acadDept = Department::where('code', 'ACAD')->first();
        $studDept = Department::where('code', 'STUD')->first();
        $adminDept = Department::where('code', 'ADMIN')->first();
        $finDept = Department::where('code', 'FIN')->first();
        $finRole = Role::where('name', 'finance_head')->first();

        // 3. Seed Users
        $users = [
            [
                'name' => 'ผู้ดูแลระบบ',
                'email' => 'admin@smartflow.local',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
                'department_id' => $planDept->id,
                'position' => 'นักวิชาการคอมพิวเตอร์ / ผู้ดูแลระบบ',
                'is_active' => true,
            ],
            [
                'name' => 'นายสมศักดิ์ ครูผู้สอน',
                'email' => 'teacher@smartflow.local',
                'password' => Hash::make('password'),
                'role_id' => $teacherRole->id,
                'department_id' => $acadDept->id,
                'position' => 'ครู ชำนาญการ',
                'is_active' => true,
            ],
            [
                'name' => 'นางวิภา วางแผน',
                'email' => 'plan@smartflow.local',
                'password' => Hash::make('password'),
                'role_id' => $planRole->id,
                'department_id' => $planDept->id,
                'position' => 'หัวหน้างานวางแผนและงบประมาณ',
                'is_active' => true,
            ],
            [
                'name' => 'นายปิติ พัสดุ',
                'email' => 'procurement@smartflow.local',
                'password' => Hash::make('password'),
                'role_id' => $procurementRole->id,
                'department_id' => $adminDept->id,
                'position' => 'หัวหน้างานพัสดุ',
                'is_active' => true,
            ],
            [
                'name' => 'นางสาวพิมพ์ใจ การเงิน',
                'email' => 'finance@smartflow.local',
                'password' => Hash::make('password'),
                'role_id' => $finRole->id,
                'department_id' => $finDept ? $finDept->id : $adminDept->id,
                'position' => 'หัวหน้างานการเงินและบัญชี',
                'is_active' => true,
            ],
            [
                'name' => 'นายอนันต์ กลิ่นสุคนธ์',
                'email' => 'executive@smartflow.local',
                'password' => Hash::make('password'),
                'role_id' => $execRole->id,
                'department_id' => $planDept->id,
                'position' => 'ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน',
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            User::firstOrCreate(['email' => $userData['email']], $userData);
        }

        // 4. Dynamic Strategy Categories Seeding
        $categoriesData = [
            [
                'code' => 'iqa',
                'name' => 'ยุทธศาสตร์ประกันคุณภาพ (IQA)',
                'description' => 'ตัวเลือกยุทธศาสตร์ประกันคุณภาพการศึกษาของสถานศึกษา',
                'items' => [
                    'IQA 1: คุณภาพผู้เรียนและผู้สำเร็จการศึกษาอาชีวศึกษา',
                    'IQA 2: การจัดการศึกษาอาชีวศึกษา',
                    'IQA 3: การสร้างสังคมแห่งการเรียนรู้',
                    'IQA 4: การทำนุบำรุงศิลปะ วัฒนธรรม สิ่งแวดล้อม',
                    'IQA 5: การบริหารจัดการสถานศึกษาอาชีวศึกษา',
                ]
            ],
            [
                'code' => 'ovec',
                'name' => 'ยุทธศาสตร์ สอศ. (OVEC)',
                'description' => 'ตัวเลือกยุทธศาสตร์สำนักงานคณะกรรมการการอาชีวศึกษา',
                'items' => [
                    'OVEC 1: การพัฒนาหลักสูตรและการจัดการเรียนรู้สู่อนาคต',
                    'OVEC 2: การยกระดับคุณภาพครูและบุคลากรทางการศึกษา',
                    'OVEC 3: การส่งเสริมการวิจัย เทคโนโลยี และนวัตกรรมอาชีวศึกษา',
                    'OVEC 4: การปฏิรูประบบการบริหารจัดการภาครัฐสถานศึกษา',
                    'OVEC 5: การผลิตกำลังคนสมรรถนะสูงร่วมกับภาคเอกชน',
                ]
            ],
            [
                'code' => 'national',
                'name' => 'ยุทธศาสตร์ชาติ 20 ปี (National Strategy)',
                'description' => 'ตัวเลือกยุทธศาสตร์ชาติ พ.ศ. 2561 - 2580',
                'items' => [
                    'ยุทธศาสตร์ชาติ ด้านความมั่นคง',
                    'ยุทธศาสตร์ชาติ ด้านการสร้างความสามารถในการแข่งขัน',
                    'ยุทธศาสตร์ชาติ ด้านการพัฒนาและเสริมสร้างศักยภาพทรัพยากรมนุษย์',
                    'ยุทธศาสตร์ชาติ ด้านการสร้างโอกาสและความเสมอภาคทางสังคม',
                    'ยุทธศาสตร์ชาติ ด้านการสร้างการเติบโตบนคุณภาพชีวิตที่เป็นมิตรต่อสิ่งแวดล้อม',
                    'ยุทธศาสตร์ชาติ ด้านการปรับสมดุลและพัฒนาระบบการบริหารจัดการภาครัฐ',
                ]
            ],
            [
                'code' => 'provincial',
                'name' => 'ยุทธศาสตร์การพัฒนาจังหวัดน่าน (Provincial Strategy)',
                'description' => 'ตัวเลือกยุทธศาสตร์การพัฒนาจังหวัดน่าน',
                'items' => [
                    'ยุทธศาสตร์จังหวัดน่าน ด้านการส่งเสริมเกษตรปลอดภัยและเกษตรมูลค่าสูง',
                    'ยุทธศาสตร์จังหวัดน่าน ด้านการพัฒนาการท่องเที่ยวเชิงวัฒนธรรมและธรรมชาติอย่างยั่งยืน',
                    'ยุทธศาสตร์จังหวัดน่าน ด้านการยกระดับคุณภาพชีวิต การศึกษา และสวัสดิการสังคม',
                    'ยุทธศาสตร์จังหวัดน่าน ด้านการอนุรักษ์ ฟื้นฟูทรัพยากรธรรมชาติและสิ่งแวดล้อมเมืองน่าน',
                ]
            ]
        ];

        foreach ($categoriesData as $catIndex => $cat) {
            $category = \App\Models\StrategyCategory::firstOrCreate(
                ['code' => $cat['code']],
                [
                    'name' => $cat['name'],
                    'description' => $cat['description'],
                    'is_active' => true,
                    'order_index' => $catIndex + 1,
                ]
            );

            foreach ($cat['items'] as $itemIndex => $itemName) {
                \App\Models\StrategyItem::firstOrCreate(
                    [
                        'strategy_category_id' => $category->id,
                        'name' => $itemName,
                    ],
                    [
                        'is_active' => true,
                        'order_index' => $itemIndex + 1,
                    ]
                );
            }
        }

        // 6. Seed Funding Sources (11 columns matching Action Plan Expenditure Report)
        $funding = [
            ['id' => 1, 'name' => 'ปวช.', 'code' => 'VEC_CERT', 'description' => 'งบดำเนินงาน ปวช.', 'fiscal_year' => '2570', 'budget_number' => null],
            ['id' => 2, 'name' => 'ปวส.', 'code' => 'VEC_DIP', 'description' => 'งบดำเนินงาน ปวส.', 'fiscal_year' => '2570', 'budget_number' => null],
            ['id' => 3, 'name' => 'ระยะสั้น (ตอบแทน วัสดุ ใช้สอย)', 'code' => 'SHORT_COURSE_REMUN', 'description' => 'งบดำเนินงาน ระยะสั้น (ตอบแทน วัสดุ ใช้สอย)', 'fiscal_year' => '2570', 'budget_number' => null],
            ['id' => 4, 'name' => 'ระยะสั้น (ค่าสาธารณูปโภค)', 'code' => 'SHORT_COURSE_UTIL', 'description' => 'งบดำเนินงาน ระยะสั้น (ค่าสาธารณูปโภค)', 'fiscal_year' => '2570', 'budget_number' => null],
            ['id' => 5, 'name' => 'ทวิศึกษา', 'code' => 'DUAL_EDU', 'description' => 'งบทวิศึกษา', 'fiscal_year' => '2570', 'budget_number' => null],
            ['id' => 6, 'name' => 'อุดหนุนเพื่อการจัดการ', 'code' => 'MANAGEMENT_SUBSIDY', 'description' => 'เงินอุดหนุนเพื่อการจัดการศึกษา', 'fiscal_year' => '2570', 'budget_number' => null],
            ['id' => 7, 'name' => 'อุดหนุนพัฒนา', 'code' => 'DEVELOPMENT_SUBSIDY', 'description' => 'เงินอุดหนุนพัฒนาสถานศึกษา/นักเรียนนักศึกษา', 'fiscal_year' => '2570', 'budget_number' => null],
            ['id' => 8, 'name' => 'อุดหนุนเรียนฟรี 15 ปี (ค่าหนังสือ)', 'code' => 'FREE15_BOOK', 'description' => 'เงินอุดหนุนเรียนฟรี 15 ปี (ค่าหนังสือเรียน)', 'fiscal_year' => '2570', 'budget_number' => null],
            ['id' => 9, 'name' => 'อุดหนุนเรียนฟรี 15 ปี (อุปกรณ์การเรียน)', 'code' => 'FREE15_EQUIP', 'description' => 'เงินอุดหนุนเรียนฟรี 15 ปี (ค่าอุปกรณ์การเรียน)', 'fiscal_year' => '2570', 'budget_number' => null],
            ['id' => 10, 'name' => 'อุดหนุนเรียนฟรี 15 ปี (เครื่องแบบนักเรียน)', 'code' => 'FREE15_UNIFORM', 'description' => 'เงินอุดหนุนเรียนฟรี 15 ปี (ค่าเครื่องแบบนักเรียน)', 'fiscal_year' => '2570', 'budget_number' => null],
            ['id' => 11, 'name' => 'บกศ.', 'code' => 'LOCAL_INCOME', 'description' => 'เงินบำรุงการศึกษา (บกศ.)', 'fiscal_year' => '2570', 'budget_number' => null],
        ];
        foreach ($funding as $item) {
            FundingSource::updateOrCreate(['code' => $item['code']], $item);
        }

        // 7. Seed System Settings
        $settings = [
            ['key' => 'college_name_th', 'value' => 'วิทยาลัยสารพัดช่างน่าน', 'group' => 'general', 'label' => 'ชื่อสถานศึกษา (ภาษาไทย)', 'type' => 'text'],
            ['key' => 'college_name_en', 'value' => 'Nan Polytechnic College', 'group' => 'general', 'label' => 'ชื่อสถานศึกษา (ภาษาอังกฤษ)', 'type' => 'text'],
            ['key' => 'director_name', 'value' => 'นายกเชษฐ์ กิ่งชนะ', 'group' => 'general', 'label' => 'ชื่อ-นามสกุล ของท่านผู้อำนวยการ', 'type' => 'text'],
            ['key' => 'director_position', 'value' => 'ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน', 'group' => 'general', 'label' => 'ตำแหน่งผู้บริหารสูงสุด', 'type' => 'text'],
            ['key' => 'current_fiscal_year', 'value' => '2569', 'group' => 'academic', 'label' => 'ปีงบประมาณปัจจุบัน', 'type' => 'text'],
            ['key' => 'current_quarter', 'value' => 'auto', 'group' => 'academic', 'label' => 'ไตรมาสงบประมาณปัจจุบัน', 'type' => 'text'],
            ['key' => 'current_academic_year', 'value' => '2569', 'group' => 'academic', 'label' => 'ปีการศึกษาปัจจุบัน', 'type' => 'text'],
            ['key' => 'current_semester', 'value' => '1', 'group' => 'academic', 'label' => 'ภาคเรียนปัจจุบัน', 'type' => 'text'],
            ['key' => 'system_announcement', 'value' => 'ยินดีต้อนรับสู่ระบบวางแผน งบประมาณ และประเมินผลโครงการดิจิทัล (NPC SMART FLOW) วิทยาลัยสารพัดช่างน่าน', 'group' => 'general', 'label' => 'ประกาศระบบประจำวัน', 'type' => 'textarea'],
            ['key' => 'allow_new_projects', 'value' => 'true', 'group' => 'features', 'label' => 'เปิดรับเสนอโครงการใหม่', 'type' => 'boolean'],
            ['key' => 'enable_ai_recommendations', 'value' => 'true', 'group' => 'ai', 'label' => 'เปิดใช้งานระบบวิเคราะห์ AI Gemini', 'type' => 'boolean'],
            ['key' => 'gemini_api_key', 'value' => '', 'group' => 'ai', 'label' => 'Gemini API Key (Google AI Studio)', 'type' => 'text'],
        ];

        foreach ($settings as $settingData) {
            SystemSetting::firstOrCreate(['key' => $settingData['key']], $settingData);
        }
    }
}
