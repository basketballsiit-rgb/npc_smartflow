<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>บันทึกข้อความขออนุมัติจัดซื้อจัดจ้าง</title>
    <style>
        body {
            font-family: "TH Sarabun PSK", "Angsana New", sans-serif;
            font-size: 16pt;
            line-height: 1.3;
            color: #000;
            padding: 0.6in 0.8in 0.6in 0.8in;
            max-width: 7.2in;
            margin: auto;
        }
        .header-container {
            position: relative;
            min-height: 60px;
            margin-bottom: 10px;
        }
        .garuda-img {
            position: absolute;
            left: 0;
            top: 0;
            width: 55px;
            height: auto;
        }
        .header-title {
            text-align: center;
            font-weight: bold;
            font-size: 26pt;
            line-height: 1.1;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 8px;
            border-collapse: collapse;
        }
        .meta-table td {
            padding: 2px 0;
            vertical-align: top;
            font-size: 16pt;
        }
        .subject-title {
            font-weight: bold;
        }
        .salutation {
            margin-top: 10px;
            margin-bottom: 10px;
            font-size: 16pt;
        }
        .paragraph {
            text-indent: 0.8in;
            text-align: justify;
            margin-bottom: 8px;
            line-height: 1.35;
        }
        .closing {
            text-indent: 0.8in;
            margin-top: 10px;
            margin-bottom: 15px;
        }
        .divider {
            border-bottom: 1.5px solid #000;
            margin-bottom: 10px;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
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

    if (!function_exists('convertToThaiBahtTextMemo')) {
        function convertToThaiBahtTextMemo($number) {
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

    // 1. Proposer (ผู้ขออนุมัติจัดซื้อ)
    $rawProposerName = $project->responsible_person ?: ($project->user ? $project->user->name : '..........................................................');
    $extractedProposerPos = '';
    if (preg_match('/\((.*?)\)/u', $rawProposerName, $matches)) {
        $extractedProposerPos = trim($matches[1]);
    }
    $cleanProposerName = cleanPersonName($rawProposerName);
    $displayProposerPos = $project->position ?: ($extractedProposerPos ?: ($project->user?->position ?: 'ครู'));

    // Department & Division details
    $dept = $project->department;
    $deptName = $dept ? $dept->name : 'วิทยาลัยสารพัดช่างน่าน';
    $displayDeptAffiliation = $deptName ? (str_starts_with($deptName, 'งาน') || str_starts_with($deptName, 'แผนก') ? $deptName : 'แผนกวิชา ' . $deptName) : '';

    $parentDept = $dept ? $dept->parent : null;
    $divisionDept = $parentDept ?: $dept;
    $divisionName = $divisionDept ? $divisionDept->name : 'ฝ่ายวิชาการ';
    if (!str_starts_with($divisionName, 'ฝ่าย')) {
        $divisionName = 'ฝ่าย' . $divisionName;
    }

    // 2. Head of Department / Section (หัวหน้างาน/หัวหน้าสาขา)
    $headUser = null;
    if ($dept) {
        $headUser = \App\Models\User::where('department_id', $dept->id)
            ->where(function($q) {
                $q->where('position', 'like', '%หัวหน้า%')
                  ->orWhere('position', 'like', '%รักษาการ%');
            })->first();
    }
    $headOfDeptName = $headUser ? cleanPersonName($headUser->name) : $cleanProposerName;
    $headOfDeptTitle = 'หัวหน้า' . (str_starts_with($deptName, 'งาน') || str_starts_with($deptName, 'แผนก') || str_starts_with($deptName, 'ฝ่าย') ? $deptName : 'แผนกวิชา' . $deptName);

    // List of standard Deputy Directors in the college
    $deputyOptions = [
        'academic' => [
            'key' => 'academic',
            'division' => 'ฝ่ายวิชาการ',
            'title' => 'รองผู้อำนวยการฝ่ายวิชาการ',
            'name' => 'นายนิพนธ์ ร่องพืช',
        ],
        'student_affairs' => [
            'key' => 'student_affairs',
            'division' => 'ฝ่ายพัฒนากิจการนักเรียน นักศึกษา',
            'title' => 'รองผู้อำนวยการฝ่ายพัฒนากิจการนักเรียนนักศึกษา',
            'name' => 'นายสุทธิชัย ศรีวิชัย',
        ],
        'resources' => [
            'key' => 'resources',
            'division' => 'ฝ่ายบริหารทรัพยากร',
            'title' => 'รองผู้อำนวยการฝ่ายบริหารทรัพยากร',
            'name' => 'นางสาวสิริกร มงคลวัจน์',
        ],
        'planning' => [
            'key' => 'planning',
            'division' => 'ฝ่ายแผนงานและความร่วมมือ',
            'title' => 'รองผู้อำนวยการฝ่ายแผนงานและความร่วมมือ',
            'name' => 'นายวิทวัส ดวงใจ',
        ],
    ];

    // Check if any Deputy users exist in database and override default names
    foreach ($deputyOptions as $k => $opt) {
        $foundUser = \App\Models\User::where('position', 'like', "%{$opt['title']}%")
            ->orWhere('position', 'like', "%{$opt['division']}%")
            ->first();
        if ($foundUser) {
            $deputyOptions[$k]['name'] = cleanPersonName($foundUser->name);
        }
    }

    // Determine initial selected key based on department division
    $initialDeputyKey = 'academic';
    if (str_contains($divisionName, 'บริหาร') || str_contains($divisionName, 'ทรัพยากร')) {
        $initialDeputyKey = 'resources';
    } elseif (str_contains($divisionName, 'กิจการ') || str_contains($divisionName, 'พัฒนา')) {
        $initialDeputyKey = 'student_affairs';
    } elseif (str_contains($divisionName, 'แผน') || str_contains($divisionName, 'ร่วมมือ')) {
        $initialDeputyKey = 'planning';
    } elseif (str_contains($divisionName, 'วิชาการ')) {
        $initialDeputyKey = 'academic';
    }

    $deputyDirectorName = $deputyOptions[$initialDeputyKey]['name'];
    $deputyDirectorTitle = $deputyOptions[$initialDeputyKey]['title'];

    // 4. College Director (ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน)
    $directorUser = \App\Models\User::where('position', 'like', '%ผู้อำนวยการวิทยาลัย%')
        ->orWhere('position', 'like', '%ผู้อำนวยการ%')
        ->where('position', 'not like', '%รองผู้อำนวยการ%')
        ->first();

    $directorSetting = \App\Models\SystemSetting::where('key', 'director_name')->first();
    $directorName = $directorSetting ? cleanPersonName($directorSetting->value) : ($directorUser ? cleanPersonName($directorUser->name) : 'นายกเชษฐ์ กิ่งชนะ');

    // Calculation & Items count
    $itemsCount = $items->count() > 0 ? $items->count() : ($project->items ? $project->items->count() : 1);
    $totalProcSum = $items->sum('total_price') ?: $items->reduce(function($carry, $i) {
        return $carry + (floatval($i->quantity) * floatval($i->unit_price));
    }, 0);
    $finalProcAmount = $totalProcSum > 0 ? $totalProcSum : ($project->estimated_budget ?: 0);
    $bahtText = convertToThaiBahtTextMemo($finalProcAmount);

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
    <!-- Interactive Top Control Bar -->
    <div class="no-print" style="margin-bottom: 20px; background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 12px 18px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.04);">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <label for="deputy-select" style="font-weight: bold; color: #1e293b; font-size: 14pt; display: flex; align-items: center; gap: 6px;">
                <span>👔</span> เลือกรองผู้อำนวยการฝ่ายที่เกี่ยวข้อง:
            </label>
            <select id="deputy-select" onchange="changeDeputy(this.value)" style="padding: 6px 14px; border-radius: 10px; border: 2px solid #7c3aed; font-family: inherit; font-size: 14pt; font-weight: bold; color: #4c1d95; background-color: #ffffff; cursor: pointer; outline: none; box-shadow: 0 2px 4px rgba(124,58,237,0.1);">
                @foreach($deputyOptions as $key => $opt)
                    <option value="{{ $key }}" {{ ($initialDeputyKey === $key) ? 'selected' : '' }}>
                        {{ $opt['division'] }} — ({{ $opt['name'] }})
                    </option>
                @endforeach
                <option value="custom">✏️ ระบุชื่อ/ตำแหน่งเอง (กำหนดเอง)...</option>
            </select>
        </div>

        <div style="display: flex; gap: 8px;">
            <button onclick="window.print()" style="padding: 7px 20px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; border: none; border-radius: 10px; font-family: inherit; font-size: 14pt; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(124,58,237,0.25); display: flex; align-items: center; gap: 6px;">
                <span>🖨️</span> สั่งพิมพ์เอกสาร / PDF
            </button>
        </div>
    </div>

    <div class="header-container">
        <img src="{{ $garudaSrc }}" class="garuda-img" alt="ตราครุฑ">
        <div class="header-title">บันทึกข้อความ</div>
    </div>
    
    <table class="meta-table">
        <tr>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; padding-right: 15px;">ส่วนราชการ</td>
            <td colspan="3">วิทยาลัยสารพัดช่างน่าน {{ $displayDeptAffiliation ? ' ' . $displayDeptAffiliation : '' }}</td>
        </tr>
        <tr>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; padding-right: 15px;">ที่</td>
            <td>{{ $procurement->procurement_number ?: '........../2569' }}</td>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; text-align: right; padding-right: 15px;">วันที่</td>
            <td>{{ $thaiDateStr }}</td>
        </tr>
        <tr>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; padding-right: 15px;">เรื่อง</td>
            <td colspan="3" class="subject-title">ขออนุมัติจัดซื้อพัสดุตามโครงการ {{$project->title}}</td>
        </tr>
    </table>

    <div class="divider"></div>

    <div class="salutation">
        <strong>เรียน</strong> ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน
    </div>

    <div class="paragraph">
        ด้วยข้าพเจ้า <span contenteditable="true" style="outline: none;">{{ $cleanProposerName }}</span> ตำแหน่ง <span contenteditable="true" style="outline: none;">{{ $displayProposerPos }}</span> {{ $displayDeptAffiliation }} มีความประสงค์ จัดซื้อพัสดุ เพื่อใช้ในการดำเนินโครงการ "{{$project->title}}" ใน<span id="division-name-text">{{ $divisionName }}</span>
    </div>

    <div class="paragraph">
        ดังนั้น ข้าพเจ้าจึงขออนุมัติจัดซื้อพัสดุในครั้งนี้ จำนวน {{ $itemsCount }} รายการ รวมเป็นเงินทั้งสิ้น {{ number_format($finalProcAmount, 2) }} บาท ({{ $bahtText }}) ตามบันทึกข้อความรายงานขอซื้อ/ขอจ้างแนบท้ายมาพร้อมนี้
    </div>

    <div class="closing">
        จึงเรียนมาเพื่อโปรดทราบ และพิจารณาอนุมัติ
    </div>

    <!-- 1. ผู้ขออนุมัติจัดซื้อ (Proposer) -->
    <div style="margin-top: 20px; margin-left: auto; width: 3.3in; text-align: center;">
        <div style="margin-bottom: 6px; border-bottom: 1px dotted #000; height: 26px;"></div>
        <div>( <span contenteditable="true" style="outline: none;">{{ $cleanProposerName }}</span> )</div>
        <div style="font-size: 15pt; margin-top: 2px;">ผู้ขออนุมัติจัดซื้อ</div>
    </div>
    <div style="clear: both;"></div>

    <!-- 2. หัวหน้างาน / หัวหน้าแผนกวิชา (Head of Department) -->
    <div style="margin-top: 25px; margin-left: auto; width: 3.3in; text-align: center;">
        <div style="margin-bottom: 6px; border-bottom: 1px dotted #000; height: 26px;"></div>
        <div>( <span contenteditable="true" style="outline: none;">{{ $headOfDeptName }}</span> )</div>
        <div style="font-size: 15pt; margin-top: 2px;" contenteditable="true" style="outline: none;">{{ $headOfDeptTitle }}</div>
    </div>
    <div style="clear: both;"></div>

    <!-- 3 & 4. รองผู้อำนวยการฝ่ายฯ ที่เกี่ยวข้อง & ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน (Aligned 2-Column Structure) -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 22px; table-layout: fixed;">
        <tr>
            <!-- Left Header -->
            <td style="width: 50%; vertical-align: top; padding-right: 12px;">
                <div style="font-size: 16pt; line-height: 1.35; margin-bottom: 4px;">
                    เรียน ผู้อำนวยการ วช.น่าน เพื่อโปรด
                </div>
            </td>
            <!-- Right Header (Invisible/Empty placeholder with exact line-height for 100% horizontal alignment) -->
            <td style="width: 50%; vertical-align: top; padding-left: 12px;">
                <div style="font-size: 16pt; line-height: 1.35; margin-bottom: 4px; visibility: hidden;">
                    เรียน ผู้อำนวยการ วช.น่าน เพื่อโปรด
                </div>
            </td>
        </tr>

        <!-- Dotted Line Row 1 -->
        <tr>
            <td style="padding-right: 12px; padding-bottom: 4px;">
                <div style="border-bottom: 1px dotted #000; height: 18px; width: 100%;"></div>
            </td>
            <td style="padding-left: 12px; padding-bottom: 4px;">
                <div style="border-bottom: 1px dotted #000; height: 18px; width: 100%;"></div>
            </td>
        </tr>

        <!-- Dotted Line Row 2 -->
        <tr>
            <td style="padding-right: 12px; padding-bottom: 16px;">
                <div style="border-bottom: 1px dotted #000; height: 18px; width: 100%;"></div>
            </td>
            <td style="padding-left: 12px; padding-bottom: 16px;">
                <div style="border-bottom: 1px dotted #000; height: 18px; width: 100%;"></div>
            </td>
        </tr>

        <!-- Signature Line Row -->
        <tr>
            <td style="padding-right: 12px; text-align: center; padding-bottom: 4px;">
                <div style="border-bottom: 1px dotted #000; height: 26px; width: 85%; margin: 0 auto;"></div>
            </td>
            <td style="padding-left: 12px; text-align: center; padding-bottom: 4px;">
                <div style="border-bottom: 1px dotted #000; height: 26px; width: 85%; margin: 0 auto;"></div>
            </td>
        </tr>

        <!-- Name Row -->
        <tr>
            <td style="padding-right: 12px; text-align: center; font-size: 16pt; line-height: 1.3;">
                ( <span id="deputy-name-text" contenteditable="true" style="outline: none;">{{ $deputyDirectorName }}</span> )
            </td>
            <td style="padding-left: 12px; text-align: center; font-size: 16pt; line-height: 1.3;">
                ( <span contenteditable="true" style="outline: none;">{{ $directorName }}</span> )
            </td>
        </tr>

        <!-- Position Row -->
        <tr>
            <td style="padding-right: 12px; text-align: center; font-size: 15pt; line-height: 1.3; padding-top: 2px;">
                <span id="deputy-title-text" contenteditable="true" style="outline: none;">{{ $deputyDirectorTitle }}</span>
            </td>
            <td style="padding-left: 12px; text-align: center; font-size: 15pt; line-height: 1.3; padding-top: 2px;">
                ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน
            </td>
        </tr>

        <!-- Date Row -->
        <tr>
            <td style="padding-right: 12px; text-align: center; font-size: 14pt; line-height: 1.3; padding-top: 4px;">
                ............../............../..............
            </td>
            <td style="padding-left: 12px; text-align: center; font-size: 14pt; line-height: 1.3; padding-top: 4px;">
                ............../............../..............
            </td>
        </tr>
    </table>

    <script>
        const deputiesData = @json($deputyOptions);

        function changeDeputy(key) {
            if (key === 'custom') {
                const currentName = document.getElementById('deputy-name-text').innerText;
                const currentTitle = document.getElementById('deputy-title-text').innerText;
                const customName = prompt('ระบุชื่อ-สกุล รองผู้อำนวยการ:', currentName);
                if (customName !== null && customName.trim() !== '') {
                    document.getElementById('deputy-name-text').innerText = customName.trim();
                }
                const customTitle = prompt('ระบุตำแหน่ง รองผู้อำนวยการ:', currentTitle);
                if (customTitle !== null && customTitle.trim() !== '') {
                    document.getElementById('deputy-title-text').innerText = customTitle.trim();
                }
                return;
            }

            const data = deputiesData[key];
            if (data) {
                document.getElementById('deputy-name-text').innerText = data.name;
                document.getElementById('deputy-title-text').innerText = data.title;
                const divTextElem = document.getElementById('division-name-text');
                if (divTextElem) {
                    divTextElem.innerText = data.division;
                }
            }
        }
    </script>
</body>
</html>
