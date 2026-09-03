<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>บันทึกข้อความขออนุมัติโครงการ</title>
    <style>
        body {
            font-family: "TH Sarabun PSK", "Angsana New", sans-serif;
            font-size: 16pt;
            line-height: 1.35;
            color: #000;
            padding: 0.8in;
            max-width: 7in;
            margin: auto;
        }
        .header-container {
            position: relative;
            min-height: 55px;
            margin-bottom: 12px;
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
            margin-bottom: 12px;
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
            margin-top: 12px;
            margin-bottom: 10px;
            font-size: 16pt;
        }
        .paragraph {
            text-indent: 0.8in;
            text-align: justify;
            margin-bottom: 10px;
            line-height: 1.35;
        }
        .closing {
            text-indent: 0.8in;
            margin-top: 12px;
            margin-bottom: 25px;
        }
        .signature-block {
            float: right;
            width: 3.2in;
            text-align: center;
            margin-top: 30px;
        }
        .signature-line {
            margin-bottom: 8px;
            border-bottom: 1px dotted #000;
            height: 35px;
        }
        .date-line {
            margin-top: 8px;
            font-size: 14pt;
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

    // Clean name and position
    $rawProposerName = $project->responsible_person ?: ($project->user ? $project->user->name : '..........................................................');
    $extractedProposerPos = '';
    if (preg_match('/\((.*?)\)/u', $rawProposerName, $matches)) {
        $extractedProposerPos = trim($matches[1]);
    }
    $cleanProposerName = cleanPersonName($rawProposerName);
    $displayProposerPos = $project->position ?: ($extractedProposerPos ?: ($project->user?->position ?: 'อาจารย์ประจำสาขา / ผู้รับผิดชอบโครงการ'));
@endphp

<body>
    <div class="no-print" style="margin-bottom: 15px; text-align: right;">
        <button onclick="window.print()" style="padding: 6px 14px; background-color: #7c3aed; color: white; border: none; border-radius: 6px; font-family: inherit; font-size: 13pt; font-weight: bold; cursor: pointer;">🖨️ สั่งพิมพ์เอกสาร / PDF</button>
    </div>

    <div class="header-container">
        <img src="{{ asset('images/garuda.png') }}" class="garuda-img" alt="ตราครุฑ">
        <div class="header-title">บันทึกข้อความ</div>
    </div>
    
    <table class="meta-table">
        <tr>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; padding-right: 15px;">ส่วนราชการ</td>
            <td colspan="3">วิทยาลัยสารพัดช่างน่าน แผนกวิชา {{$project->department?->name}}</td>
        </tr>
        <tr>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; padding-right: 15px;">ที่</td>
            <td>{{$procurement->procurement_number}}</td>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; text-align: right; padding-right: 15px;">วันที่</td>
            <td>{{$thaiDateStr}}</td>
        </tr>
        <tr>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; padding-right: 15px;">เรื่อง</td>
            <td colspan="3" class="subject-title">ขออนุมัติดำเนินโครงการ {{$project->title}} และขออนุมัติจัดซื้อจัดจ้างวัสดุอุปกรณ์</td>
        </tr>
    </table>

    <div class="salutation">
        <strong>เรียน</strong> ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน
    </div>

    <div class="paragraph">
        ด้วย แผนกวิชา {{$project->department?->name}} มีความประสงค์จะดำเนินโครงการ "{{$project->title}}" ประจำปีการศึกษา {{$project->academic_year}} โดยมีวัตถุประสงค์เพื่อพัฒนาคุณภาพนักเรียนนักศึกษาและการเรียนการสอนให้สอดคล้องตามมาตรฐานหลักสูตรวิชาชีพ 
    </div>

    @php
        $totalProcSum = $items->sum('total_price') ?: $items->reduce(function($carry, $i) {
            return $carry + (floatval($i->quantity) * floatval($i->unit_price));
        }, 0);
        $finalProcAmount = $totalProcSum > 0 ? $totalProcSum : $project->estimated_budget;
    @endphp
    <div class="paragraph">
        ในการนี้ เพื่อให้โครงการดังกล่าวบรรลุตามวัตถุประสงค์และเป้าหมาย จึงใคร่ขออนุมัติจัดหาพัสดุและวัสดุสำหรับจัดทำโครงการดังกล่าว เป็นเงินจำนวนทั้งสิ้น {{number_format($finalProcAmount, 2)}} บาท โดยขอใช้เงินสนับสนุนจากแหล่งงบประมาณ {{$project->budget?->fundingSource?->name ?? 'เงินรายได้สถานศึกษา'}}
    </div>

    <div class="closing">
        จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ
    </div>

    <div class="signature-block">
        <div class="signature-line"></div>
        <div>( {{ $cleanProposerName }} )</div>
        <div style="font-size: 15pt; margin-top: 4px;">{{ $displayProposerPos }}</div>
        <div class="date-line">วันที่ ....... เดือน ............................ พ.ศ. ...............</div>
    </div>
</body>
</html>
