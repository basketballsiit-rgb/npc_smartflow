<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ใบประมาณการราคาค่าพัสดุ</title>
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
        }
        th {
            font-weight: bold;
            background-color: #f5f5f5;
        }
        .text-left {
            text-align: left;
        }
        .text-right {
            text-align: right;
        }
        .committee-block {
            margin-top: 50px;
            width: 100%;
            text-align: center;
        }
        .committee-title {
            font-weight: bold;
            text-align: left;
            margin-bottom: 10px;
        }
        .committee-member {
            margin: 15px 0;
            display: inline-block;
            width: 30%;
        }
        .underline-dotted {
            border-bottom: 1px dotted #000;
            height: 25px;
            width: 80%;
            margin: auto;
        }
    </style>
</head>
<body>
    <div class="title">ตารางคำนวณและประมาณการราคากลางพัสดุ</div>

    <div class="text-left">
        <strong>โครงการ:</strong> {{$project->title}}<br>
        <strong>แผนกวิชา/งาน:</strong> {{$project->department?->name}}<br>
        <strong>ประมาณการโดย:</strong> คณะกรรมการกำหนดราคากลาง/คณะกรรมการจัดซื้อจัดจ้าง
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 8%;">ลำดับ</th>
                <th>รายการพัสดุ</th>
                <th style="width: 12%;">จำนวน</th>
                <th style="width: 12%;">หน่วย</th>
                <th style="width: 18%;">ประมาณการราคากลาง (บาท)</th>
                <th style="width: 18%;">รวมเป็นเงิน (บาท)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $index => $item)
            <tr>
                <td style="text-align: center;">{{$index + 1}}</td>
                <td class="text-left">{{$item->description}}</td>
                <td style="text-align: center;">{{number_format($item->quantity, 2)}}</td>
                <td style="text-align: center;">{{$item->unit}}</td>
                <td class="text-right">{{number_format($item->unit_price, 2)}}</td>
                <td class="text-right">{{number_format($item->total_price, 2)}}</td>
            </tr>
            @endforeach
            <tr>
                <td colspan="5" style="text-align: right; font-weight: bold;">รวมประมาณการราคากลางทั้งสิ้น</td>
                <td class="text-right" style="font-weight: bold;">{{number_format($project->estimated_budget, 2)}}</td>
            </tr>
        </tbody>
    </table>

    <div class="committee-block">
        <div class="committee-title">คณะกรรมการกำหนดราคากลางและจัดซื้อจัดจ้าง</div>
        
        @foreach($purchasingCommittee as $member)
            <div class="committee-member">
                <div class="underline-dotted"></div>
                <div style="margin-top: 5px;">( {{$member->name}} )</div>
                <div style="font-size: 11pt; color: #666;">
                    {{$member->pivot->role === 'chairperson' ? 'ประธานกรรมการ' : 'กรรมการ'}}
                </div>
            </div>
        @endforeach
    </div>
</body>
</html>
