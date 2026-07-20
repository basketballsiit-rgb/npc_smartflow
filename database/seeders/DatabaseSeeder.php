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
            ['name' => 'executive', 'display_name' => 'ผู้บริหาร (ผู้อำนวยการ/รองฯ)', 'description' => 'พิจารณาอนุมัติขั้นสุดท้าย ดูรายงานและสถิติภาพรวม'],
        ];

        foreach ($roles as $roleData) {
            Role::firstOrCreate(['name' => $roleData['name']], $roleData);
        }

        // 2. Seed Departments
        $departments = [
            ['name' => 'ฝ่ายบริหารจัดการ / งานวางแผน', 'code' => 'PLAN'],
            ['name' => 'ฝ่ายวิชาการ / สาขาวิชาการ', 'code' => 'ACAD'],
            ['name' => 'ฝ่ายพัฒนากิจการนักเรียนนักศึกษา', 'code' => 'STUD'],
            ['name' => 'ฝ่ายบริหารงานทั่วไป / งานพัสดุ', 'code' => 'ADMIN'],
        ];

        foreach ($departments as $deptData) {
            Department::firstOrCreate(['code' => $deptData['code']], $deptData);
        }

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

        // 3. Seed Users
        $users = [
            [
                'name' => 'ผู้ดูแลระบบ (Super Admin)',
                'email' => 'admin@smartflow.local',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
                'department_id' => $planDept->id,
                'position' => 'นักวิชาการคอมพิวเตอร์ / ผู้ดูแลระบบ',
                'is_active' => true,
            ],
            [
                'name' => 'นายสมศักดิ์ ครูผู้สอน (อาจารย์ประจำสาขา)',
                'email' => 'teacher@smartflow.local',
                'password' => Hash::make('password'),
                'role_id' => $teacherRole->id,
                'department_id' => $acadDept->id,
                'position' => 'ครู ชำนาญการ',
                'is_active' => true,
            ],
            [
                'name' => 'นางวิภา หัวหน้างานวางแผนและงบประมาณ',
                'email' => 'plan@smartflow.local',
                'password' => Hash::make('password'),
                'role_id' => $planRole->id,
                'department_id' => $planDept->id,
                'position' => 'หัวหน้างานวางแผนและงบประมาณ',
                'is_active' => true,
            ],
            [
                'name' => 'นายปิติ หัวหน้างานพัสดุ',
                'email' => 'procurement@smartflow.local',
                'password' => Hash::make('password'),
                'role_id' => $procurementRole->id,
                'department_id' => $adminDept->id,
                'position' => 'หัวหน้างานพัสดุ',
                'is_active' => true,
            ],
            [
                'name' => 'นายอนันต์ ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน',
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

        // 6. Seed Funding Sources
        $funding = [
            ['name' => 'Revenue (เงินรายได้สถานศึกษา)', 'code' => 'REVENUE', 'description' => 'School tuition and training fees.'],
            ['name' => 'Government Budget (เงินงบประมาณแผ่นดิน)', 'code' => 'GOV_BUDGET', 'description' => 'Annual government subsidies.'],
            ['name' => 'Donation / Special Funds (เงินบริจาค/เงินสนับสนุนพิเศษ)', 'code' => 'DONATION', 'description' => 'Specific CSR or external donations.'],
        ];
        foreach ($funding as $item) {
            FundingSource::firstOrCreate(['code' => $item['code']], $item);
        }

        // 7. Seed System Settings
        $settings = [
            ['key' => 'college_name_th', 'value' => 'วิทยาลัยสารพัดช่างน่าน', 'group' => 'general', 'label' => 'ชื่อสถานศึกษา (ภาษาไทย)', 'type' => 'text'],
            ['key' => 'college_name_en', 'value' => 'Nan Polytechnic College', 'group' => 'general', 'label' => 'ชื่อสถานศึกษา (ภาษาอังกฤษ)', 'type' => 'text'],
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
