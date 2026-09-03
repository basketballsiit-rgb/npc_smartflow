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

    // 3. Relevant Deputy Director (รองผู้อำนวยการฝ่ายฯ ที่เกี่ยวข้อง)
    $deputyTitle = 'รองผู้อำนวยการฝ่ายวิชาการ';
    if (str_contains($divisionName, 'บริหาร') || str_contains($divisionName, 'ทรัพยากร')) {
        $deputyTitle = 'รองผู้อำนวยการฝ่ายบริหารทรัพยากร';
    } elseif (str_contains($divisionName, 'กิจการ') || str_contains($divisionName, 'พัฒนากิจการ')) {
        $deputyTitle = 'รองผู้อำนวยการฝ่ายพัฒนากิจการนักเรียนนักศึกษา';
    } elseif (str_contains($divisionName, 'แผน') || str_contains($divisionName, 'ร่วมมือ')) {
        $deputyTitle = 'รองผู้อำนวยการฝ่ายแผนงานและความร่วมมือ';
    } elseif (str_contains($divisionName, 'วิชาการ')) {
        $deputyTitle = 'รองผู้อำนวยการฝ่ายวิชาการ';
    }

    $deputyUser = \App\Models\User::where('position', 'like', "%{$deputyTitle}%")
        ->orWhere(function($q) use ($divisionDept) {
            if ($divisionDept) {
                $q->where('department_id', $divisionDept->id)
                  ->where('position', 'like', '%รองผู้อำนวยการ%');
            }
        })->first();

    $deputyDirectorName = $deputyUser ? cleanPersonName($deputyUser->name) : 'นายนิพนธ์ ร่องพืช';
    $deputyDirectorTitle = $deputyUser ? $deputyUser->position : $deputyTitle;

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
    <div class="no-print" style="margin-bottom: 15px; text-align: right;">
        <button onclick="window.print()" style="padding: 6px 14px; background-color: #7c3aed; color: white; border: none; border-radius: 6px; font-family: inherit; font-size: 13pt; font-weight: bold; cursor: pointer;">🖨️ สั่งพิมพ์เอกสาร / PDF</button>
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
        ด้วยข้าพเจ้า {{ $cleanProposerName }} ตำแหน่ง {{ $displayProposerPos }} {{ $displayDeptAffiliation }} มีความประสงค์ จัดซื้อพัสดุ เพื่อใช้ในการดำเนินโครงการ "{{$project->title}}" ใน{{ $divisionName }}
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
        <div>( {{ $cleanProposerName }} )</div>
        <div style="font-size: 15pt; margin-top: 2px;">ผู้ขออนุมัติจัดซื้อ</div>
    </div>
    <div style="clear: both;"></div>

    <!-- 2. หัวหน้างาน / หัวหน้าแผนกวิชา (Head of Department) -->
    <div style="margin-top: 25px; margin-left: auto; width: 3.3in; text-align: center;">
        <div style="margin-bottom: 6px; border-bottom: 1px dotted #000; height: 26px;"></div>
        <div>( {{ $headOfDeptName }} )</div>
        <div style="font-size: 15pt; margin-top: 2px;">{{ $headOfDeptTitle }}</div>
    </div>
    <div style="clear: both;"></div>

    <!-- 3 & 4. รองผู้อำนวยการฝ่ายฯ ที่เกี่ยวข้อง & ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน -->
    <div style="margin-top: 25px; width: 100%; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;">
        <!-- Left: รองผู้อำนวยการฝ่ายที่เกี่ยวข้อง -->
        <div style="width: 48%; text-align: left;">
            <div style="margin-bottom: 4px;">เรียน ผู้อำนวยการ วช.น่าน เพื่อโปรด</div>
            <div style="border-bottom: 1px dotted #000; height: 18px; margin-bottom: 4px;"></div>
            <div style="border-bottom: 1px dotted #000; height: 18px; margin-bottom: 10px;"></div>
            
            <div style="text-align: center; margin-top: 10px;">
                <div style="border-bottom: 1px dotted #000; height: 26px; width: 85%; margin: 0 auto 6px auto;"></div>
                <div>( {{ $deputyDirectorName }} )</div>
                <div style="font-size: 15pt; margin-top: 2px;">{{ $deputyDirectorTitle }}</div>
                <div style="font-size: 14pt; margin-top: 4px;">............../............../..............</div>
            </div>
        </div>

        <!-- Right: ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน -->
        <div style="width: 48%; text-align: left;">
            <div style="height: 24px;"></div>
            <div style="border-bottom: 1px dotted #000; height: 18px; margin-bottom: 4px;"></div>
            <div style="border-bottom: 1px dotted #000; height: 18px; margin-bottom: 10px;"></div>
            
            <div style="text-align: center; margin-top: 10px;">
                <div style="border-bottom: 1px dotted #000; height: 26px; width: 85%; margin: 0 auto 6px auto;"></div>
                <div>( {{ $directorName }} )</div>
                <div style="font-size: 15pt; margin-top: 2px;">ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน</div>
                <div style="font-size: 14pt; margin-top: 4px;">............../............../..............</div>
            </div>
        </div>
    </div>
</body>
</html>
