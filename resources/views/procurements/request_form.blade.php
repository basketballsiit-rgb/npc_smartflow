<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ใบเสนอซื้อจัดจ้าง - {{ $project->title }}</title>
    <style>
        body {
            font-family: "TH Sarabun PSK", "Angsana New", sans-serif;
            font-size: 13.5pt;
            line-height: 1.25;
            color: #000;
            padding: 0.5in 0.7in;
            max-width: 7.2in;
            margin: auto;
        }
        .title {
            text-align: center;
            font-weight: bold;
            font-size: 17pt;
            margin-bottom: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #000;
            padding: 4px 6px;
            font-size: 12.5pt;
            text-align: left;
        }
        th {
            text-align: center;
            font-weight: bold;
            background-color: #f8fafc;
        }
        .text-center {
            text-align: center;
        }
        .text-right {
            text-align: right;
        }
        .no-border td {
            border: none;
            padding: 2px 0;
            font-size: 13pt;
        }
        .sig-section {
            margin-top: 30px;
            width: 100%;
            page-break-inside: avoid;
        }
        .sig-box {
            display: inline-block;
            width: 48%;
            text-align: center;
            font-size: 13pt;
            vertical-align: top;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
@php
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
    $cleanProposerName = cleanPersonName($project->responsible_person ?: $project->user?->name);
@endphp
<body>
    <div class="no-print" style="margin-bottom: 15px; text-align: right;">
        <button onclick="window.print()" style="padding: 6px 14px; background-color: #7c3aed; color: white; border: none; border-radius: 6px; font-family: inherit; font-size: 13pt; font-weight: bold; cursor: pointer;">🖨️ สั่งพิมพ์เอกสาร / PDF</button>
    </div>

    <div class="title">ใบเสนอซื้อจัดจ้างพัสดุ / วัสดุ</div>

    <table class="no-border" style="width: 100%;">
        <tr>
            <td style="font-weight: bold; width: 15%;">แผนกวิชา/งาน:</td>
            <td style="width: 45%;">{{$project->department?->name}}</td>
            <td style="font-weight: bold; text-align: right; width: 20%;">เลขที่เอกสาร:</td>
            <td style="width: 20%;">{{$procurement->procurement_number}}</td>
        </tr>
        <tr>
            <td style="font-weight: bold;">ชื่อโครงการ:</td>
            <td colspan="3">{{$project->title}}</td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th style="width: 7%;">ลำดับ</th>
                <th>รายการวัสดุ/อุปกรณ์ที่ประสงค์จัดซื้อจัดจ้าง</th>
                <th style="width: 10%;">จำนวน</th>
                <th style="width: 11%;">หน่วย</th>
                <th style="width: 16%;">ราคาต่อหน่วย (บาท)</th>
                <th style="width: 18%;">จำนวนเงิน (บาท)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $index => $item)
            @php
                $cleanDesc = preg_replace('/[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', '', $item->description);
                $cleanDesc = trim(str_replace(['💵', '📦', '💰', '📑', '📝', '🛒', '📄', '📊'], '', $cleanDesc));
            @endphp
            <tr>
                <td class="text-center">{{$index + 1}}</td>
                <td>{{$cleanDesc}}</td>
                <td class="text-center">{{number_format($item->quantity, 0)}}</td>
                <td class="text-center">{{$item->unit}}</td>
                <td class="text-right">{{number_format($item->unit_price, 2)}}</td>
                <td class="text-right font-bold">{{number_format($item->total_price, 2)}}</td>
            </tr>
            @endforeach
            <tr>
                <td colspan="5" style="text-align: right; font-weight: bold;">รวมเป็นเงินทั้งสิ้น</td>
                <td class="text-right" style="font-weight: bold; font-size: 13pt;">{{number_format($project->estimated_budget, 2)}}</td>
            </tr>
        </tbody>
    </table>

    <div style="margin-top: 15px; font-size: 13pt;">
        <span style="font-weight: bold;">แหล่งงบประมาณ:</span> {{$project->budget?->fundingSource?->name ?? 'เงินรายได้สถานศึกษา'}}
        @if($project->budget?->is_advance_payment)
            <span style="margin-left: 15px; font-weight: bold; color: #b45309;">[ ✓ ขออนุมัติรับเงินสำรองจ่ายล่วงหน้า ]</span>
        @endif
    </div>

    <div class="sig-section">
        <div class="sig-box">
            <div style="border-bottom: 1px dotted #000; height: 30px; width: 80%; margin: auto;"></div>
            <div style="margin-top: 4px;">( {{ $cleanProposerName }} )</div>
            <div style="font-size: 12pt; color: #333; margin-top: 2px;">ผู้เสนอซื้อ/จ้าง</div>
        </div>
        <div class="sig-box" style="float: right;">
            <div style="border-bottom: 1px dotted #000; height: 30px; width: 80%; margin: auto;"></div>
            <div style="margin-top: 4px;">( .................................................... )</div>
            <div style="font-size: 12pt; color: #333; margin-top: 2px;">หัวหน้าแผนกวิชา / ผู้เห็นชอบ</div>
        </div>
    </div>
</body>
</html>
