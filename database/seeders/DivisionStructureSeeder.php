<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DivisionStructureSeeder extends Seeder
{
    public function run(): void
    {
        $mainDivisions = [
            ['name' => 'ฝ่ายบริหารทรัพยากร', 'code' => 'RESOURCE'],
            ['name' => 'ฝ่ายยุทธศาสตร์และแผนงาน', 'code' => 'STRATEGY_PLAN'],
            ['name' => 'ฝ่ายวิชาการ', 'code' => 'ACADEMIC'],
            ['name' => 'ฝ่ายพัฒนากิจการนักเรียนนักศึกษา', 'code' => 'STUDENT_AFFAIRS'],
        ];

        $parents = [];
        foreach ($mainDivisions as $m) {
            $p = Department::firstOrCreate(
                ['name' => $m['name']],
                ['code' => $m['code'], 'parent_id' => null]
            );
            $parents[$m['code']] = $p->id;
        }

        $subStructure = [
            'RESOURCE' => [
                'งานบริหารงานทั่วไป / งานสารบรรณ',
                'งานการเงิน',
                'งานการบัญชี',
                'งานพัสดุ',
                'งานอาคารสถานที่และยานพาหนะ',
                'งานประชาสัมพันธ์',
            ],
            'STRATEGY_PLAN' => [
                'งานพัฒนายุทธศาสตร์แผนงานและงบประมาณ',
                'งานส่งเสริมธุรกิจและการเป็นผู้ประกอบการ (ศูนย์บ่มเพาะฯ)',
                'งานประกันคุณภาพการศึกษา (IQA)',
                'งานศูนย์ข้อมูลสารสนเทศ',
                'งานวิจัย นวัตกรรม และสิ่งประดิษฐ์',
            ],
            'ACADEMIC' => [
                'งานพัฒนาหลักสูตรการเรียนการสอน',
                'งานวัดผลและประเมินผล',
                'งานวิทยบริการและห้องดูสื่อ',
                'สาขาวิชาช่างยนต์ / งานยานยนต์',
                'สาขาวิชาเทคโนโลยีสารสนเทศ',
                'สาขาวิชาการบัญชี',
                'สาขาวิชาการตลาด',
                'สาขาวิชาการโรงแรมและการท่องเที่ยว',
            ],
            'STUDENT_AFFAIRS' => [
                'งานกิจกรรมนักเรียนนักศึกษา',
                'งานครูอัศวิน / ครูที่ปรึกษา',
                'งานแนะแนวอาชีพและจัดหางาน',
                'งานสวัสดิการนักเรียนนักศึกษา',
                'งานโครงการพิเศษและบริการสังคม',
            ],
        ];

        foreach ($subStructure as $code => $subs) {
            $parentId = $parents[$code];
            foreach ($subs as $subName) {
                Department::firstOrCreate(
                    ['name' => $subName],
                    ['parent_id' => $parentId]
                );
            }
        }

        // Re-map existing orphaned departments if any
        Department::whereNull('parent_id')
            ->whereNotIn('name', ['ฝ่ายบริหารทรัพยากร', 'ฝ่ายยุทธศาสตร์และแผนงาน', 'ฝ่ายวิชาการ', 'ฝ่ายพัฒนากิจการนักเรียนนักศึกษา'])
            ->get()
            ->each(function($d) use ($parents) {
                $n = $d->name;
                if (str_contains($n, 'วิชาการ') || str_contains($n, 'สาขา')) {
                    $d->update(['parent_id' => $parents['ACADEMIC']]);
                } elseif (str_contains($n, 'บริหาร') || str_contains($n, 'สารบรรณ') || str_contains($n, 'พัสดุ')) {
                    $d->update(['parent_id' => $parents['RESOURCE']]);
                } elseif (str_contains($n, 'นักเรียน') || str_contains($n, 'กิจกรรม')) {
                    $d->update(['parent_id' => $parents['STUDENT_AFFAIRS']]);
                } else {
                    $d->update(['parent_id' => $parents['STRATEGY_PLAN']]);
                }
            });
    }
}
