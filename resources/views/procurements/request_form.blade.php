<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>รายงานขอซื้อ/ขอจ้าง (ใบเสนอซื้อจ้าง) - {{ $project->title }}</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: "TH Sarabun PSK", "Angsana New", sans-serif;
            font-size: 13.5pt;
            line-height: 1.2;
            color: #000;
            padding: 0.15in 0.35in 0.15in 0.55in;
            max-width: 7.4in;
            margin: auto;
        }
        .header-container {
            position: relative;
            min-height: 50px;
            margin-bottom: 4px;
        }
        .garuda-img {
            position: absolute;
            left: 0;
            top: 0;
            width: 48px;
            height: auto;
        }
        .header-title {
            text-align: center;
            font-weight: bold;
            font-size: 24pt;
            line-height: 1.05;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 2px;
            border-collapse: collapse;
        }
        .meta-table td {
            padding: 0;
            vertical-align: top;
            font-size: 13.5pt;
            line-height: 1.2;
        }
        .subject-title {
            font-weight: bold;
        }
        .paragraph {
            text-indent: 0.45in;
            text-align: justify;
            margin-bottom: 2px;
            line-height: 1.2;
            font-size: 13.5pt;
        }
        .grid-box-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            border: 1.5px solid #000 !important;
            table-layout: fixed;
        }
        .grid-box-table td {
            border: 1px solid #000 !important;
            vertical-align: top;
            padding: 4px 6px;
            font-size: 12pt;
            line-height: 1.2;
        }
        .box-title {
            font-weight: bold;
            font-size: 12.5pt;
            margin-bottom: 1px;
        }
        .bottom-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            table-layout: fixed;
        }
        .bottom-table td {
            vertical-align: top;
            font-size: 12pt;
            line-height: 1.2;
            padding: 1px 4px;
        }
        .dotted-line {
            border-bottom: 1px dotted #000;
            display: inline-block;
        }
        @media print {
            body { 
                padding: 0 !important; 
                margin: 0 !important;
                max-width: 100% !important;
                font-size: 13pt !important;
                line-height: 1.18 !important;
            }
            .paragraph {
                font-size: 13pt !important;
                line-height: 1.18 !important;
            }
            .grid-box-table td {
                font-size: 11.5pt !important;
                line-height: 1.18 !important;
            }
            .box-title {
                font-size: 12pt !important;
            }
            .bottom-table td {
                font-size: 11.5pt !important;
                line-height: 1.18 !important;
            }
            .no-print, 
            .no-print * { 
                display: none !important; 
                visibility: hidden !important;
                height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
            }
            @page {
                size: A4 portrait;
                margin: 0.8cm 1.2cm 0.6cm 1.8cm;
            }
        }
    </style>
</head>
@php
    $months = [1=>'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    $day = date('j');
    $month = $months[(int)date('n')];
    $year = date('Y') + 543;
    $thaiDateStr = "{$day} {$month} {$year}";

    if (!function_exists('cleanPersonName')) {
        function cleanPersonName($name) {
            if (!$name) return '..........................................................';
            $cleaned = preg_replace('/\s*\(.*?\)/u', '', $name);
            $cleaned = preg_replace('/\s*\[.*?\]/u', '', $cleaned);
            
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
            foreach ($rolesToStrip as $role) {
                $cleaned = str_ireplace($role, '', $cleaned);
            }
            $cleaned = trim(str_replace(['(', ')'], '', $cleaned));
            $cleaned = preg_replace('/\s+/u', ' ', $cleaned);
            return trim($cleaned) ?: '..........................................................';
        }
    }

    if (!function_exists('convertToThaiBahtTextReq')) {
        function convertToThaiBahtTextReq($number) {
            $number = floatval($number);
            if ($number == 0) return 'ศูนย์บาทถ้วน';
            
            $baht = floor($number);
            $satang = round(($number - $baht) * 100);
            
            $thaiDigits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
            $thaiUnits = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
            
            $bahtText = '';
            $bahtStr = strval($baht);
            $len = strlen($bahtStr);
            
            for ($i = 0; $i < $len; $i++) {
                $digit = intval($bahtStr[$i]);
                $unitPos = $len - $i - 1;
                
                if ($digit !== 0) {
                    if ($unitPos % 6 === 0 && $unitPos > 0) {
                        $bahtText .= ($digit === 1 && $i > 0) ? 'เอ็ด' : $thaiDigits[$digit];
                        $bahtText .= 'ล้าน';
                    } elseif ($unitPos % 6 === 1) {
                        if ($digit === 1) {
                            $bahtText .= '';
                        } elseif ($digit === 2) {
                            $bahtText .= 'ยี่';
                        } else {
                            $bahtText .= $thaiDigits[$digit];
                        }
                        $bahtText .= 'สิบ';
                    } elseif ($unitPos % 6 === 0) {
                        if ($digit === 1 && $len > 1 && $i === $len - 1 && intval($bahtStr[$i-1]) > 0) {
                            $bahtText .= 'เอ็ด';
                        } else {
                            $bahtText .= $thaiDigits[$digit];
                        }
                    } else {
                        $bahtText .= $thaiDigits[$digit] . $thaiUnits[$unitPos % 6];
                    }
                }
            }
            
            $bahtText .= 'บาท';
            
            if ($satang === 0 || $satang === 0.0) {
                $bahtText .= 'ถ้วน';
            } else {
                $satangStr = str_pad(strval($satang), 2, '0', STR_PAD_LEFT);
                $d1 = intval($satangStr[0]);
                $d2 = intval($satangStr[1]);
                
                if ($d1 === 1) $bahtText .= 'สิบ';
                elseif ($d1 === 2) $bahtText .= 'ยี่สิบ';
                elseif ($d1 > 2) $bahtText .= $thaiDigits[$d1] . 'สิบ';
                
                if ($d2 === 1 && $d1 > 0) $bahtText .= 'เอ็ด';
                elseif ($d2 > 0) $bahtText .= $thaiDigits[$d2];
                
                $bahtText .= 'สตางค์';
            }
            
            return $bahtText;
        }
    }

    // Proposer
    $rawProposerName = $project->responsible_person ?: ($project->user ? $project->user->name : '..........................................................');
    $cleanProposerName = cleanPersonName($rawProposerName);

    // Department & Division details
    $dept = $project->department;
    $deptName = $dept ? $dept->name : 'งานพัฒนาหลักสูตรและการจัดการเรียนรู้';
    $parentDept = $dept ? $dept->parent : null;
    $divisionDept = $parentDept ?: $dept;
    $divisionName = $divisionDept ? $divisionDept->name : 'ฝ่ายวิชาการ';
    if (!str_starts_with($divisionName, 'ฝ่าย')) {
        $divisionName = 'ฝ่าย' . $divisionName;
    }

    // Head of Department
    $headUser = null;
    if ($dept) {
        $headUser = \App\Models\User::where('department_id', $dept->id)
            ->where(function($q) {
                $q->where('position', 'like', '%หัวหน้า%')
                  ->orWhere('position', 'like', '%รักษาการ%');
            })->first();
    }
    $headOfDeptName = $headUser ? cleanPersonName($headUser->name) : $cleanProposerName;

    // Deputy Directors
    $deputyOptions = [
        'academic' => [
            'division' => 'ฝ่ายวิชาการ',
            'title' => 'รองผู้อำนวยการฝ่ายวิชาการ',
            'name' => 'นายนิพนธ์ ร่องพืช',
        ],
        'student_affairs' => [
            'division' => 'ฝ่ายพัฒนากิจการนักเรียน นักศึกษา',
            'title' => 'รองผู้อำนวยการฝ่ายพัฒนากิจการนักเรียนนักศึกษา',
            'name' => 'นายสุทธิชัย ศรีวิชัย',
        ],
        'resources' => [
            'division' => 'ฝ่ายบริหารทรัพยากร',
            'title' => 'รองผู้อำนวยการฝ่ายบริหารทรัพยากร',
            'name' => 'นายจักรพงศ์ พรหมสกุลปัญญา',
        ],
        'planning' => [
            'division' => 'ฝ่ายยุทธศาสตร์และแผนงาน',
            'title' => 'รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน',
            'name' => 'นายนิพนธ์ ร่องพืช',
        ],
    ];

    foreach ($deputyOptions as $k => $opt) {
        $foundUser = \App\Models\User::where('position', 'like', "%{$opt['title']}%")
            ->orWhere('position', 'like', "%{$opt['division']}%")
            ->first();
        if ($foundUser) {
            $deputyOptions[$k]['name'] = cleanPersonName($foundUser->name);
        }
    }

    $initialDeputyKey = 'academic';
    if (str_contains($divisionName, 'บริหาร') || str_contains($divisionName, 'ทรัพยากร')) {
        $initialDeputyKey = 'resources';
    } elseif (str_contains($divisionName, 'กิจการ') || str_contains($divisionName, 'พัฒนา')) {
        $initialDeputyKey = 'student_affairs';
    } elseif (str_contains($divisionName, 'แผน') || str_contains($divisionName, 'ร่วมมือ') || str_contains($divisionName, 'ยุทธศาสตร์')) {
        $initialDeputyKey = 'planning';
    }

    $deputyDirectorName = $deputyOptions[$initialDeputyKey]['name'];

    // Specific Officers for Section 3, 5, 6, 7
    $planHeadUser = \App\Models\User::where('position', 'like', '%หัวหน้างาน%แผน%')->orWhere('position', 'like', '%หัวหน้างานวางแผน%')->first();
    $planHeadName = $planHeadUser ? cleanPersonName($planHeadUser->name) : 'นายพิพัฒน์ สีมา';

    $financeHeadUser = \App\Models\User::where('position', 'like', '%หัวหน้างานการเงิน%')->orWhere('position', 'like', '%งานการเงิน%')->first();
    $financeHeadName = $financeHeadUser ? cleanPersonName($financeHeadUser->name) : 'นางสาวดวงดาว ไชยเขียว';

    $procHeadUser = \App\Models\User::where('position', 'like', '%หัวหน้างานพัสดุ%')->orWhere('position', 'like', '%งานพัสดุ%')->first();
    $procHeadName = $procHeadUser ? cleanPersonName($procHeadUser->name) : 'นายกิตติศักดิ์ ขัดเงางาม';

    $resourceDeputyName = $deputyOptions['resources']['name'] ?: 'นายจักรพงศ์ พรหมสกุลปัญญา';
    $planDeputyName = $deputyOptions['planning']['name'] ?: 'นายนิพนธ์ ร่องพืช';

    // College Director
    $directorUser = \App\Models\User::where('position', 'like', '%ผู้อำนวยการวิทยาลัย%')
        ->orWhere('position', 'like', '%ผู้อำนวยการ%')
        ->where('position', 'not like', '%รองผู้อำนวยการ%')
        ->first();
    $directorSetting = \App\Models\SystemSetting::where('key', 'director_name')->first();
    $directorName = $directorSetting ? cleanPersonName($directorSetting->value) : ($directorUser ? cleanPersonName($directorUser->name) : 'นายกเชษฐ์ กิ่งชนะ');

    // Financial calculations
    $itemsCount = $items->count() > 0 ? $items->count() : ($project->items ? $project->items->count() : 1);
    $totalProcSum = $items->sum('total_price') ?: $items->reduce(function($carry, $i) {
        return $carry + (floatval($i->quantity) * floatval($i->unit_price));
    }, 0);
    $finalProcAmount = $totalProcSum > 0 ? $totalProcSum : ($project->estimated_budget ?: 0);
    $bahtText = convertToThaiBahtTextReq($finalProcAmount);

    // Committees
    $pChair = $purchasingCommittee->where('pivot.role', 'chairperson')->first()?->name;
    $pMem1 = $purchasingCommittee->where('pivot.role', 'member')->values()->get(0)?->name;
    $pMem2 = $purchasingCommittee->where('pivot.role', 'member')->values()->get(1)?->name;

    $iChair = $inspectionCommittee->where('pivot.role', 'chairperson')->first()?->name;
    $iMem1 = $inspectionCommittee->where('pivot.role', 'member')->values()->get(0)?->name;
    $iMem2 = $inspectionCommittee->where('pivot.role', 'member')->values()->get(1)?->name;

    // Garuda Logo
    $garudaPath = public_path('images/garuda.png');
    if (!file_exists($garudaPath)) {
        $garudaPath = public_path('garuda.png');
    }
    $garudaSrc = file_exists($garudaPath) 
        ? 'data:image/png;base64,' . base64_encode(file_get_contents($garudaPath)) 
        : asset('images/garuda.png');
@endphp

<body>
    <!-- Top Interactive Control Bar (Hidden when printing) -->
    <div class="no-print" style="margin-bottom: 12px; background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 8px 14px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.04);">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <label for="deputy-select" style="font-weight: bold; color: #1e293b; font-size: 13pt;">
                👔 เลือกรองฝ่ายฯ ที่เกี่ยวข้อง:
            </label>
            <select id="deputy-select" onchange="changeDeputy(this.value)" style="padding: 4px 10px; border-radius: 8px; border: 2px solid #7c3aed; font-family: inherit; font-size: 13pt; font-weight: bold; color: #4c1d95; background-color: #ffffff; cursor: pointer;">
                @foreach($deputyOptions as $key => $opt)
                    <option value="{{ $key }}" {{ ($initialDeputyKey === $key) ? 'selected' : '' }}>
                        {{ $opt['division'] }} — ({{ $opt['name'] }})
                    </option>
                @endforeach
                <option value="custom">✏️ กำหนดเอง...</option>
            </select>
        </div>

        <div>
            <button onclick="window.print()" style="padding: 5px 16px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; border: none; border-radius: 8px; font-family: inherit; font-size: 13pt; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(124,58,237,0.25);">
                🖨️ สั่งพิมพ์เอกสาร / PDF
            </button>
        </div>
    </div>

    <!-- Header Section -->
    <div class="header-container">
        <img src="{{ $garudaSrc }}" class="garuda-img" alt="ตราครุฑ">
        <div class="header-title">บันทึกข้อความ</div>
    </div>
    
    <table class="meta-table">
        <tr>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; padding-right: 8px;">ส่วนราชการ</td>
            <td colspan="3">
                วิทยาลัยสารพัดช่างน่าน <span style="margin-left: 8px;">ฝ่าย <span id="division-header-text" contenteditable="true" style="outline: none;">{{ str_replace('ฝ่าย', '', $divisionName) }}</span> งาน / แผนกวิชา <span contenteditable="true" style="outline: none;">{{ $deptName }}</span></span>
            </td>
        </tr>
        <tr>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; padding-right: 8px;">ที่</td>
            <td><span contenteditable="true" style="outline: none;">{{ $procurement->procurement_number ?: '........../2569' }}</span></td>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; text-align: right; padding-right: 8px;">วันที่</td>
            <td><span contenteditable="true" style="outline: none;">{{ $thaiDateStr }}</span></td>
        </tr>
        <tr>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; padding-right: 8px;">เรื่อง</td>
            <td colspan="3" class="subject-title">รายงานขอซื้อ/ขอจ้าง</td>
        </tr>
    </table>

    <div style="border-bottom: 1.5px solid #000; margin-bottom: 4px;"></div>

    <div style="margin-top: 2px; margin-bottom: 2px; font-size: 13pt;">
        <strong>เรียน</strong> ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน
    </div>

    <!-- Body text with blank checkboxes ( ) -->
    <div class="paragraph">
        ด้วยแผนกวิชา/งาน <span contenteditable="true" style="outline: none; font-weight: bold;">{{ $deptName }}</span> มีความประสงค์ขอ 
        ( &nbsp;&nbsp;&nbsp; ) จัดซื้อวัสดุ/ครุภัณฑ์ &nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp; ) จัดจ้าง 
        เพื่อใช้เป็น &nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp; ) วัสดุฝึก &nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp; ) อุปกรณ์การสอน &nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp; ) งานปรับปรุง &nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp; ) งานซ่อม/แก้ไขเปลี่ยนของเดิมที่ชำรุด &nbsp;&nbsp; 
        ( &nbsp;&nbsp;&nbsp; ) อื่น ๆ <span contenteditable="true" style="outline: none;">ดำเนินโครงการ {{ $project->title }}</span>
        ประกอบการเรียนการสอนวิชา/งาน<span id="division-body-text" contenteditable="true" style="outline: none;">{{ $divisionName }}</span>
    </div>

    <div class="paragraph" style="text-indent: 0;">
        เหตุผลอื่นๆ <span contenteditable="true" style="outline: none;">เพื่อใช้ในการดำเนินกิจกรรมตามโครงการและพัฒนาคุณภาพการจัดการศึกษา</span>
    </div>

    <div class="paragraph" style="text-indent: 0;">
        จำนวน <strong style="font-size: 13pt;">{{ $itemsCount }}</strong> รายการ &nbsp; 
        เป็นเงิน <strong style="font-size: 13pt;">{{ number_format($finalProcAmount, 2) }}</strong> บาท 
        (<strong>{{ $bahtText }}</strong>) &nbsp; 
        ต้องการใช้วัสดุวันที่ <span contenteditable="true" style="outline: none;">ภายในกำหนดการดำเนินโครงการ</span>
    </div>

    <div class="paragraph" style="text-indent: 0.5in; font-weight: bold; margin-top: 2px;">
        ดังรายละเอียดในประมาณการหน้าที่ 2
    </div>
    <div class="paragraph" style="text-indent: 0.5in; margin-top: 1px;">
        จึงเรียนมาเพื่อโปรดพิจารณา
    </div>

    <!-- Signature of Proposer -->
    <div style="margin-left: auto; width: 3.2in; text-align: center; margin-top: 4px; margin-bottom: 4px;">
        <div>ลงชื่อ ....................................................................... ผู้ขอซื้อ/ขอจ้าง</div>
        <div style="margin-top: 1px;">( <span contenteditable="true" style="outline: none;">{{ $cleanProposerName }}</span> )</div>
        <div style="font-size: 11.5pt; margin-top: 1px;">............../............../..............</div>
    </div>

    <!-- 7-Section Approval Grid Box (Without inner divider lines between questions) -->
    <table class="grid-box-table">
        <tr>
            <!-- LEFT COLUMN (Box 1, 2, 3 without dividing lines) -->
            <td style="width: 50%; padding: 4px 8px;">
                <!-- Box 1 -->
                <div style="margin-bottom: 8px;">
                    <div class="box-title">1. ความเห็น หัวหน้าแผนก/งาน<span contenteditable="true" style="outline: none;">{{ $deptName }}</span></div>
                    <div style="padding-left: 6px;">
                        มีในแผนได้จัดสรรงบ <span class="dotted-line" style="width: 120px;" contenteditable="true">&nbsp;{{ number_format($finalProcAmount, 2) }}</span> บาท<br>
                        จ่ายครั้งนี้แล้วคงเหลือ <span class="dotted-line" style="width: 130px;" contenteditable="true">&nbsp;</span> บาท
                    </div>
                    <div style="text-align: center; margin-top: 4px;">
                        <div>ลงชื่อ ...................................................................</div>
                        <div style="margin-top: 1px;">( <span contenteditable="true" style="outline: none;">{{ $headOfDeptName }}</span> ) &nbsp;&nbsp; ......./......./.......</div>
                    </div>
                </div>

                <!-- Box 2 (Directly following Box 1 without horizontal border) -->
                <div style="margin-bottom: 8px;">
                    <div class="box-title">2. ความเห็น รองผู้อำนวยการฝ่าย<span id="box2-div-text" contenteditable="true" style="outline: none;">{{ str_replace('ฝ่าย', '', $divisionName) }}</span></div>
                    <div style="padding-left: 6px;">
                        มีในแผนตามข้อ 1 / เห็นควรอนุญาต / อนุมัติ
                    </div>
                    <div style="text-align: center; margin-top: 4px;">
                        <div>ลงชื่อ ...................................................................</div>
                        <div style="margin-top: 1px;">( <span id="box2-name-text" contenteditable="true" style="outline: none;">{{ $deputyDirectorName }}</span> ) &nbsp;&nbsp; ......./......./.......</div>
                    </div>
                </div>

                <!-- Box 3 (Directly following Box 2 without horizontal border) -->
                <div>
                    <div class="box-title">3. ความเห็นหัวหน้างานพัฒนายุทธศาสตร์ แผนงานและงบประมาณ</div>
                    <div style="padding-left: 4px;">
                        <strong>ตรวจสอบแล้ว</strong> &nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp; ) มีในแผน &nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp; ) ไม่มีในแผน ; ปรับแผนฯ<br>
                        งปม. ที่ได้รับจาก สอศ. <span class="dotted-line" style="width: 75px;" contenteditable="true">&nbsp;</span> บาท คงเหลือ <span class="dotted-line" style="width: 70px;" contenteditable="true">&nbsp;</span> บาท<br>
                        เงินจัดสรรโครงการ/งาน/กิจกรรม <span class="dotted-line" style="width: 55px;" contenteditable="true">&nbsp;{{ number_format($finalProcAmount, 2) }}</span> บาท คงเหลือ <span class="dotted-line" style="width: 55px;" contenteditable="true">&nbsp;</span> บาท<br>
                        จำนวนที่ขออนุมัติจัดซื้อครั้งนี้ <span class="dotted-line" style="width: 90px;" contenteditable="true">&nbsp;{{ number_format($finalProcAmount, 2) }}</span> บาท<br>
                        โดยให้เงินงบประมาณ ( &nbsp;&nbsp;&nbsp; ) รายได้สถานศึกษา ( &nbsp;&nbsp;&nbsp; ) งปม. <span class="dotted-line" style="width: 80px;" contenteditable="true">&nbsp;</span><br>
                        ( &nbsp;&nbsp;&nbsp; ) เงินอุดหนุน ............................................................................<br>
                        ( &nbsp;&nbsp;&nbsp; ) อื่น ๆ .....................................................................................
                    </div>
                    <div style="text-align: center; margin-top: 4px;">
                        <div>ลงชื่อ ...................................................................</div>
                        <div style="margin-top: 1px;">( <span contenteditable="true" style="outline: none;">{{ $planHeadName }}</span> ) &nbsp;&nbsp; ......./......./.......</div>
                    </div>
                </div>
            </td>

            <!-- RIGHT COLUMN (Box 4, 5, 6, 7 without dividing lines) -->
            <td style="width: 50%; padding: 4px 8px;">
                <!-- Box 4 -->
                <div style="margin-bottom: 7px;">
                    <div class="box-title">4. ความเห็นรองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน</div>
                    <div style="padding-left: 6px;">
                        - ได้ตรวจสอบแล้วมีในแผนและมีงบพอจ่าย/เห็นควรอนุญาต/อนุมัติ
                    </div>
                    <div style="text-align: center; margin-top: 3px;">
                        <div>ลงชื่อ ...................................................................</div>
                        <div style="margin-top: 1px;">( <span contenteditable="true" style="outline: none;">{{ $planDeputyName }}</span> ) &nbsp;&nbsp; ......./......./.......</div>
                    </div>
                </div>

                <!-- Box 5 -->
                <div style="margin-bottom: 7px;">
                    <div class="box-title">5. ความเห็นหัวหน้างานการเงิน</div>
                    <div style="padding-left: 6px;">
                        - โดยภาพรวม มีงบเพียงพอ กรณีจัดซื้อด้วยเงิน / ใช้เงิน<br>
                        ( &nbsp;&nbsp;&nbsp; ) บกศ &nbsp; ( &nbsp;&nbsp;&nbsp; ) เงินอุดหนุน &nbsp; ( &nbsp;&nbsp;&nbsp; ) งปม. &nbsp; ( &nbsp;&nbsp;&nbsp; ) อื่น ๆ ....................<br>
                        มียอดคงเหลือ <span class="dotted-line" style="width: 130px;" contenteditable="true">&nbsp;</span> บาท
                    </div>
                    <div style="text-align: center; margin-top: 3px;">
                        <div>ลงชื่อ ...................................................................</div>
                        <div style="margin-top: 1px;">( <span contenteditable="true" style="outline: none;">{{ $financeHeadName }}</span> ) &nbsp;&nbsp; ......./......./.......</div>
                    </div>
                </div>

                <!-- Box 6 -->
                <div style="margin-bottom: 7px;">
                    <div class="box-title">6. ความเห็นของหัวหน้างานพัสดุ</div>
                    <div style="padding-left: 6px;">
                        - เห็นควรดำเนินการจัดซื้อ / จัดจ้าง ด้วยวิธี<br>
                        ( &nbsp;&nbsp;&nbsp; ) วิธีเฉพาะเจาะจง &nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp; ) วิธีคัดเลือก &nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp; ) อื่นๆ ....................<br>
                        ( &nbsp;&nbsp;&nbsp; ) วิธีประกาศเชิญชวนทั่วไป ......................................................
                    </div>
                    <div style="text-align: center; margin-top: 3px;">
                        <div>ลงชื่อ ...................................................................</div>
                        <div style="margin-top: 1px;">( <span contenteditable="true" style="outline: none;">{{ $procHeadName }}</span> ) &nbsp;&nbsp; ......./......./.......</div>
                    </div>
                </div>

                <!-- Box 7 -->
                <div>
                    <div class="box-title">7. ความเห็นรองผู้อำนวยการฝ่ายบริหารทรัพยากร</div>
                    <div style="padding-left: 6px;">
                        - มีข้อมูลครบถ้วน, มีงบประมาณเพียงพอ, เห็นควรอนุญาต/อนุมัติ
                    </div>
                    <div style="text-align: center; margin-top: 3px;">
                        <div>ลงชื่อ ...................................................................</div>
                        <div style="margin-top: 1px;">( <span contenteditable="true" style="outline: none;">{{ $resourceDeputyName }}</span> ) &nbsp;&nbsp; ......./......./.......</div>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Bottom Section: คำสั่งแต่งตั้งกรรมการ และ คำสั่งผู้อำนวยการ -->
    <div style="margin-top: 4px; font-size: 11pt; line-height: 1.15;">
        <strong>คำสั่ง</strong> เพื่อให้เป็นไปตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 ข้อ 25 จึงขอแต่งตั้งบุคคลต่อไปนี้เป็นคณะกรรมการ คือ
    </div>

    <table class="bottom-table">
        <tr>
            <!-- Committees Column (Left) -->
            <td style="width: 50%;">
                <div style="font-weight: bold; font-size: 11pt;">1. คณะกรรมการซื้อ / จ้างโดยวิธีเฉพาะเจาะจง</div>
                <div style="padding-left: 8px; font-size: 10.5pt;">
                    1.1 <span contenteditable="true" style="outline: none;">{{ $pChair ? $pChair . ' (ประธานกรรมการ)' : '..........................................................................................' }}</span><br>
                    1.2 <span contenteditable="true" style="outline: none;">{{ $pMem1 ? $pMem1 . ' (กรรมการ)' : '..........................................................................................' }}</span><br>
                    1.3 <span contenteditable="true" style="outline: none;">{{ $pMem2 ? $pMem2 . ' (กรรมการ)' : '..........................................................................................' }}</span>
                </div>

                <div style="font-weight: bold; font-size: 11pt; margin-top: 2px;">2. คณะกรรมการตรวจรับพัสดุ</div>
                <div style="padding-left: 8px; font-size: 10.5pt;">
                    2.1 <span contenteditable="true" style="outline: none;">{{ $iChair ? $iChair . ' (ประธานกรรมการ)' : '..........................................................................................' }}</span><br>
                    2.2 <span contenteditable="true" style="outline: none;">{{ $iMem1 ? $iMem1 . ' (กรรมการ)' : '..........................................................................................' }}</span><br>
                    2.3 <span contenteditable="true" style="outline: none;">{{ $iMem2 ? $iMem2 . ' (กรรมการ)' : '..........................................................................................' }}</span>
                </div>
            </td>

            <!-- Director Decision Column (Right) -->
            <td style="width: 50%; padding-left: 10px;">
                <div style="font-weight: bold; font-size: 11pt;">คำสั่งผู้อำนวยการ</div>
                <div style="font-size: 11pt; margin-top: 1px;">
                    ( &nbsp;&nbsp;&nbsp; ) ทราบ &nbsp;&nbsp;&nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp; ) อนุญาต/อนุมัติ<br>
                    ( &nbsp;&nbsp;&nbsp; ) ไม่อนุญาต/อนุมัติเพราะ ...................................................................
                </div>

                <div style="text-align: center; margin-top: 8px;">
                    <div>ลงชื่อ .......................................................................</div>
                    <div style="margin-top: 1px;">( <span contenteditable="true" style="outline: none;">{{ $directorName }}</span> )</div>
                    <div style="font-size: 11pt; margin-top: 1px;">ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน</div>
                    <div style="font-size: 10.5pt; margin-top: 1px;">............../............../..............</div>
                </div>
            </td>
        </tr>
    </table>

    <script>
        const deputiesData = @json($deputyOptions);

        function changeDeputy(key) {
            if (key === 'custom') {
                const currentName = document.getElementById('box2-name-text').innerText;
                const customName = prompt('ระบุชื่อ-สกุล รองผู้อำนวยการฝ่าย:', currentName);
                if (customName !== null && customName.trim() !== '') {
                    document.getElementById('box2-name-text').innerText = customName.trim();
                }
                return;
            }

            const data = deputiesData[key];
            if (data) {
                document.getElementById('box2-name-text').innerText = data.name;
                const cleanDivName = data.division.replace('ฝ่าย', '');
                document.getElementById('box2-div-text').innerText = cleanDivName;
                document.getElementById('division-header-text').innerText = cleanDivName;
                document.getElementById('division-body-text').innerText = data.division;
            }
        }
    </script>
</body>
</html>
