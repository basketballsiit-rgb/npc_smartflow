<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ใบเสนอซื้อจัดจ้าง</title>
    <style>
        body {
            font-family: "TH Sarabun PSK", "Angsana New", sans-serif;
            font-size: 15pt;
            line-height: 1.2;
            color: #000;
            padding: 0.8in;
        }
        .title {
            text-align: center;
            font-weight: bold;
            font-size: 18pt;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            border: 1px solid #000;
            padding: 6px;
            text-align: left;
        }
        th {
            text-align: center;
            font-weight: bold;
            background-color: #f5f5f5;
        }
        .text-center {
            text-align: center;
        }
        .text-right {
            text-align: right;
        }
        .no-border td {
            border: none;
            padding: 4px 0;
        }
        .sig-section {
            margin-top: 40px;
            display: grid;
            grid-cols-2;
            width: 100%;
        }
        .sig-box {
            display: inline-block;
            width: 48%;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="title">ใบเสนอซื้อจัดจ้างพัสดุ/วัสดุ</div>

    <table class="no-border" style="width: 100%;">
        <tr>
            <td style="font-weight: bold;">แผนกวิชา/งาน:</td>
            <td>{{$project->department?->name}}</td>
            <td style="font-weight: bold; text-align: right;">เลขที่เอกสาร:</td>
            <td>{{$procurement->procurement_number}}</td>
        </tr>
        <tr>
            <td style="font-weight: bold;">ชื่อโครงการ:</td>
            <td colspan="3">{{$project->title}}</td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th style="width: 8%;">ลำดับ</th>
                <th>รายการวัสดุ/อุปกรณ์ที่ประสงค์จัดซื้อจัดจ้าง</th>
                <th style="width: 12%;">จำนวน</th>
                <th style="width: 12%;">หน่วย</th>
                <th style="width: 15%;">ราคาต่อหน่วย</th>
                <th style="width: 18%;">จำนวนเงิน (บาท)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $index => $item)
            <tr>
                <td class="text-center">{{$index + 1}}</td>
                <td>{{$item->description}}</td>
                <td class="text-center">{{number_format($item->quantity, 2)}}</td>
                <td class="text-center">{{$item->unit}}</td>
                <td class="text-right">{{number_format($item->unit_price, 2)}}</td>
                <td class="text-right">{{number_format($item->total_price, 2)}}</td>
            </tr>
            @endforeach
            <tr>
                <td colspan="5" style="text-align: right; font-weight: bold;">รวมเป็นเงินทั้งสิ้น</td>
                <td class="text-right" style="font-weight: bold;">{{number_format($project->estimated_budget, 2)}}</td>
            </tr>
        </tbody>
    </table>

    <div style="margin-top: 20px;">
        <span style="font-weight: bold;">แหล่งงบประมาณ:</span> {{$project->budget?->fundingSource?->name ?? 'เงินรายได้สถานศึกษา'}}
        @if($project->budget?->is_advance_payment)
            <span style="margin-left: 20px; font-weight: bold; color: #b45309;">[ ✓ ขออนุมัติรับเงินสำรองจ่ายล่วงหน้า ]</span>
        @endif
    </div>

    <div class="sig-section">
        <div class="sig-box">
            <div style="border-bottom: 1px dotted #000; height: 35px; width: 80%; margin: auto;"></div>
            <div style="margin-top: 5px;">( {{$project->user?->name}} )</div>
            <div style="font-size: 11pt; color: #666;">ผู้เสนอซื้อ/จ้าง</div>
        </div>
        <div class="sig-box" style="float: right;">
            <div style="border-bottom: 1px dotted #000; height: 35px; width: 80%; margin: auto;"></div>
            <div style="margin-top: 5px;">( .................................................... )</div>
            <div style="font-size: 11pt; color: #666;">หัวหน้าแผนกวิชา / ผู้เห็นชอบ</div>
        </div>
    </div>
</body>
</html>
