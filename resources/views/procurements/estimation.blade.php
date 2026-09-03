<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ใบประมาณการราคาค่าพัสดุ - {{ $project->title }}</title>
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
        }
        th {
            font-weight: bold;
            background-color: #f8fafc;
            text-align: center;
        }
        .text-left {
            text-align: left;
        }
        .text-right {
            text-align: right;
        }
        .committee-block {
            margin-top: 35px;
            width: 100%;
            text-align: center;
            page-break-inside: avoid;
        }
        .committee-title {
            font-weight: bold;
            text-align: left;
            margin-bottom: 10px;
            font-size: 13pt;
        }
        .committee-member {
            margin: 10px 0;
            display: inline-block;
            width: 31%;
            vertical-align: top;
            font-size: 13pt;
        }
        .underline-dotted {
            border-bottom: 1px dotted #000;
            height: 25px;
            width: 80%;
            margin: auto;
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
            $cleaned = trim(str_replace(['(', ')'], '', $cleaned));
            return $cleaned ?: '..........................................................';
        }
    }
@endphp
<body>
    <div class="no-print" style="margin-bottom: 15px; text-align: right;">
        <button onclick="window.print()" style="padding: 6px 14px; background-color: #7c3aed; color: white; border: none; border-radius: 6px; font-family: inherit; font-size: 13pt; font-weight: bold; cursor: pointer;">🖨️ สั่งพิมพ์เอกสาร / PDF</button>
    </div>

    <div class="title">ตารางคำนวณและประมาณการราคากลางพัสดุ</div>

    <div class="text-left" style="font-size: 13pt; line-height: 1.4;">
        <strong>โครงการ:</strong> {{$project->title}}<br>
        <strong>แผนกวิชา/งาน:</strong> {{$project->department?->name}}<br>
        <strong>ประมาณการโดย:</strong> คณะกรรมการกำหนดราคากลาง / คณะกรรมการจัดซื้อจัดจ้าง
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 7%;">ลำดับ</th>
                <th>รายการพัสดุ</th>
                <th style="width: 10%;">จำนวน</th>
                <th style="width: 11%;">หน่วย</th>
                <th style="width: 16%;">ราคากลาง/หน่วย (บาท)</th>
                <th style="width: 18%;">รวมเป็นเงิน (บาท)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $index => $item)
            @php
                $cleanDesc = preg_replace('/[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', '', $item->description);
                $cleanDesc = trim(str_replace(['💵', '📦', '💰', '📑', '📝', '🛒', '📄', '📊'], '', $cleanDesc));
            @endphp
            <tr>
                <td style="text-align: center;">{{$index + 1}}</td>
                <td class="text-left">{{$cleanDesc}}</td>
                <td style="text-align: center;">{{number_format($item->quantity, 0)}}</td>
                <td style="text-align: center;">{{$item->unit}}</td>
                <td class="text-right">{{number_format($item->unit_price, 2)}}</td>
                <td class="text-right font-bold">{{number_format($item->total_price, 2)}}</td>
            </tr>
            @endforeach
            <tr>
                <td colspan="5" style="text-align: right; font-weight: bold;">รวมประมาณการราคากลางทั้งสิ้น</td>
                <td class="text-right" style="font-weight: bold; font-size: 13pt;">{{number_format($project->estimated_budget, 2)}}</td>
            </tr>
        </tbody>
    </table>

    <div class="committee-block">
        <div class="committee-title">คณะกรรมการกำหนดราคากลางและจัดซื้อจัดจ้าง</div>
        
        @foreach($purchasingCommittee as $member)
            <div class="committee-member">
                <div class="underline-dotted"></div>
                <div style="margin-top: 4px;">( {{ cleanPersonName($member->name) }} )</div>
                <div style="font-size: 11.5pt; color: #333; margin-top: 2px;">
                    {{$member->pivot->role === 'chairperson' ? 'ประธานกรรมการ' : 'กรรมการ'}}
                </div>
            </div>
        @endforeach
    </div>
</body>
</html>
