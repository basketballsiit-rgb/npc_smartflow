<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>สัญญายืมเงินราชการ (แบบ กค. ๑๐๑) - {{ $project->title }}</title>
    <style>
        body {
            font-family: "TH Sarabun PSK", "Angsana New", sans-serif;
            font-size: 15pt;
            line-height: 1.3;
            color: #000;
            padding: 0.6in 0.8in;
            max-width: 7.2in;
            margin: auto;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .title { font-size: 22pt; font-weight: bold; margin-bottom: 2px; }
        .subtitle { font-size: 17pt; font-weight: bold; margin-bottom: 12px; }
        .meta-box { margin-bottom: 12px; }
        .table-border {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 12px;
        }
        .table-border th, .table-border td {
            border: 1px solid #000;
            padding: 4px 8px;
            font-size: 14pt;
        }
        .indent { text-indent: 0.8in; }
        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            page-break-inside: avoid;
        }
        .signature-table td {
            vertical-align: top;
            text-align: center;
            font-size: 14pt;
            padding: 6px;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>

    <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="padding: 8px 16px; background-color: #7c3aed; color: white; border: none; border-radius: 8px; font-family: inherit; font-size: 14pt; font-weight: bold; cursor: pointer;">🖨️ สั่งพิมพ์เอกสาร / บันทึกเป็น PDF</button>
    </div>

    <div class="text-right font-bold" style="font-size: 13pt;">แบบ กค. ๑๐๑</div>
    <div class="text-center">
        <div class="title">สัญญาการยืมเงิน</div>
        <div class="subtitle">วิทยาลัยสารพัดช่างน่าน</div>
    </div>

    <div class="meta-box" style="margin-top: 10px;">
        <table style="width: 100%;">
            <tr>
                <td style="width: 50%;"><strong>สัญญาเลขที่:</strong> ...................................</td>
                <td style="width: 50%; text-align: right;"><strong>วันที่:</strong> {{ date('d') }} เดือน {{ ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'][(int)date('m')-1] }} พ.ศ. {{ (int)date('Y')+543 }}</td>
            </tr>
            <tr>
                <td colspan="2"><strong>ยื่นต่อ:</strong> ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน</td>
            </tr>
        </table>
    </div>

    <div style="margin-top: 8px;">
        <p class="indent" style="text-align: justify;">
            ข้าพเจ้า <strong>{{ $project->responsible_person ?: ($project->user ? $project->user->name : '..........................................................') }}</strong>
            ตำแหน่ง <strong>{{ $project->position ?: 'ครู / ผู้รับผิดชอบโครงการ' }}</strong>
            สังกัด <strong>{{ $project->department ? $project->department->name : 'วิทยาลัยสารพัดช่างน่าน' }}</strong>
            มีความประสงค์ขอยืมเงินจาก <strong>{{ $project->fundingSource ? $project->fundingSource->name : 'เงินรายได้สถานศึกษา (Revenue)' }}</strong>
            เพื่อเป็นค่าใช้จ่ายในการดำเนินงานโครงการ <strong>"{{ $project->title }}"</strong> ประจำปีงบประมาณ พ.ศ. <strong>{{ $project->academic_year }}</strong>
            ดังรายการประมาณการค่าใช้จ่ายต่อไปนี้:
        </p>

        @php
            $loanItems = $project->procurement && $project->procurement->items
                ? $project->procurement->items->filter(function($i) {
                    return str_contains($i->description, 'วิทยากร') || 
                           str_contains($i->description, 'อาหาร') || 
                           str_contains($i->description, 'เดินทาง') || 
                           str_contains($i->description, 'พาหนะ') ||
                           str_contains($i->description, 'ยืมเงิน');
                })
                : collect();

            if ($loanItems->isEmpty() && $project->procurement && $project->procurement->items) {
                $loanItems = $project->procurement->items;
            }

            $totalLoan = $loanItems->sum('total_price');
        @endphp

        <table class="table-border">
            <thead>
                <tr style="background-color: #f8fafc; text-align: center;">
                    <th style="width: 8%;">ลำดับ</th>
                    <th style="width: 47%;">รายการค่าใช้จ่ายเงินยืมทดรอง</th>
                    <th style="width: 12%;">จำนวน</th>
                    <th style="width: 13%;">หน่วยนับ</th>
                    <th style="width: 20%;">รวมเป็นเงิน (บาท)</th>
                </tr>
            </thead>
            <tbody>
                @forelse($loanItems as $index => $item)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $item->description }}</td>
                    <td class="text-center">{{ number_format($item->quantity, 0) }}</td>
                    <td class="text-center">{{ $item->unit }}</td>
                    <td class="text-right font-bold">{{ number_format($item->total_price, 2) }}</td>
                </tr>
                @empty
                <tr>
                    <td class="text-center">๑</td>
                    <td>ค่าตอบแทนวิทยากรบรรยายและฝึกอบรม</td>
                    <td class="text-center">๖</td>
                    <td class="text-center">ชั่วโมง</td>
                    <td class="text-right font-bold">๓,๖๐๐.๐๐</td>
                </tr>
                <tr>
                    <td class="text-center">๒</td>
                    <td>ค่าอาหารกลางวันผู้เข้าร่วมโครงการ</td>
                    <td class="text-center">๕๐</td>
                    <td class="text-center">คน</td>
                    <td class="text-right font-bold">๔,๐๐๐.๐๐</td>
                </tr>
                <tr>
                    <td class="text-center">๓</td>
                    <td>ค่าอาหารว่างและเครื่องดื่ม</td>
                    <td class="text-center">๕๐</td>
                    <td class="text-center">คน</td>
                    <td class="text-right font-bold">๓,๕๐๐.๐๐</td>
                </tr>
                <tr>
                    <td class="text-center">๔</td>
                    <td>ค่าใช้จ่ายในการเดินทางไปราชการ / ค่าพาหนะ</td>
                    <td class="text-center">๑</td>
                    <td class="text-center">งาน</td>
                    <td class="text-right font-bold">-</td>
                </tr>
                @endforelse
                <tr style="background-color: #f8fafc; font-weight: bold;">
                    <td colspan="4" class="text-right">รวมเงินขอยืมทั้งสิ้น</td>
                    <td class="text-right" style="font-size: 15pt; color: #000;">{{ number_format($totalLoan ?: $project->estimated_budget, 2) }} บาท</td>
                </tr>
            </tbody>
        </table>

        <p class="indent" style="text-align: justify;">
            ข้าพเจ้าสัญญาว่าจะปฏิบัติตามระเบียบของทางราชการทุกประการ และจะนำหลักฐานใบเสร็จรับเงินค่าใช้จ่ายที่ถูกต้อง พร้อมเงินเหลือจ่าย (ถ้ามี) มาส่งใช้คืนเงินยืมตามสัญญานี้ให้เสร็จสิ้นภายในกำหนด <strong>๓๐ วัน</strong> นับแต่วันที่ได้รับเงินยืมนี้ หากข้าพเจ้าไม่ส่งใช้คืนเงินยืมตามกำหนด ข้าพเจ้ายินยอมให้ผู้บังคับบัญชาหักเงินเดือน หรือเงินอื่นใดที่ข้าพเจ้าพึงได้รับจากทางราชการเพื่อชดใช้เงินยืมนี้ได้ทันที
        </p>

        <table class="signature-table">
            <tr>
                <td style="width: 50%;">
                    ลายมือชื่อ ..................................................... ผู้ยืมเงิน<br>
                    ( <strong>{{ $project->responsible_person ?: ($project->user ? $project->user->name : '..........................................................') }}</strong> )<br>
                    ตำแหน่ง {{ $project->position ?: 'ครู / ผู้รับผิดชอบโครงการ' }}
                </td>
                <td style="width: 50%;">
                    ลายมือชื่อ ..................................................... ผู้จ่ายเงิน<br>
                    ( .......................................................... )<br>
                    เจ้าหน้าที่การเงิน
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding-top: 25px;">
                    <strong>คำอนุมัติ</strong><br>
                    อนุมัติให้ยืมเงินตามสัญญาข้างต้นได้ เป็นเงินจำนวน <strong>{{ number_format($totalLoan ?: $project->estimated_budget, 2) }} บาท</strong><br><br>
                    ลายมือชื่อ ..................................................... ผู้อนุมัติ<br>
                    ( .......................................................... )<br>
                    ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
