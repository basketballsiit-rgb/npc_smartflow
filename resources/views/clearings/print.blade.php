<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ใบรายงานการเคลียร์เงินยืมทดรองและขอเบิกจ่าย - {{ $clearing->clearing_number }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        body {
            font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
            font-size: 14pt;
            line-height: 1.4;
            color: #000;
            background-color: #fff;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .underline { text-decoration: underline; }
        
        .header-title {
            font-size: 17pt;
            font-weight: bold;
            margin-bottom: 2px;
        }
        .sub-header {
            font-size: 14pt;
            margin-bottom: 12px;
        }
        .meta-box {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 13pt;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        .info-table td {
            padding: 3px 6px;
            vertical-align: top;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 14px;
        }
        .data-table th, .data-table td {
            border: 1px solid #000;
            padding: 5px 8px;
            font-size: 12.5pt;
        }
        .data-table th {
            background-color: #f2f2f2;
            text-align: center;
            font-weight: bold;
        }

        .summary-box {
            border: 1.5px solid #000;
            padding: 10px 14px;
            margin-bottom: 16px;
            background-color: #fafafa;
            border-radius: 4px;
        }
        .checkbox-item {
            margin-top: 4px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .box-check {
            display: inline-block;
            width: 15px;
            height: 15px;
            border: 1.5px solid #000;
            text-align: center;
            line-height: 12px;
            font-size: 12pt;
            font-weight: bold;
            margin-right: 6px;
        }

        .signature-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 18px 24px;
            margin-top: 18px;
            page-break-inside: avoid;
        }
        .sign-box {
            border: 1px dashed #777;
            padding: 10px 12px;
            border-radius: 6px;
            text-align: center;
            font-size: 11.5pt;
            background-color: #fff;
        }
        .sign-space {
            height: 38px;
        }

        .no-print-bar {
            background-color: #4c1d95;
            color: #fff;
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            border-radius: 8px;
            font-family: sans-serif;
        }
        .print-btn {
            background-color: #f59e0b;
            color: #000;
            border: none;
            padding: 8px 18px;
            font-weight: bold;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
        }
        .print-btn:hover {
            background-color: #d97706;
        }
        @media print {
            .no-print-bar { display: none !important; }
            body { margin: 0; padding: 0; }
        }
    </style>
</head>
<body>

<div class="container">
    <!-- Non-print toolbar -->
    <div class="no-print-bar">
        <div>
            <b>ระบบ NPC SMART FLOW</b> &mdash; แบบฟอร์มรายงานการเคลียร์เงินยืมและขอเบิกจ่ายเงิน ({{ $clearing->clearing_number }})
        </div>
        <div>
            <button class="print-btn" onclick="window.print()">🖨️ สั่งพิมพ์เอกสาร (Print A4)</button>
        </div>
    </div>

    <!-- Official Document Header -->
    <div class="text-center">
        <div class="header-title">วิทยาลัยสารพัดช่างน่าน</div>
        <div class="sub-header font-bold">
            @if($clearing->clearing_type === 'with_loan')
                ใบรายงานผลการปฏิบัติงานและการเคลียร์เงินยืมทดรองราชการ
            @else
                ใบรายงานผลการปฏิบัติงานและขออนุมัติเบิกเงินชดเชยค่าใช้จ่าย (สำรองจ่าย)
            @endif
        </div>
    </div>

    <div class="meta-box">
        <div>
            <b>เลขที่เอกสารเคลียร์:</b> {{ $clearing->clearing_number }}
        </div>
        <div>
            <b>วันที่จัดทำ:</b> {{ \Carbon\Carbon::parse($clearing->created_at)->thaidate('j F Y') }}
        </div>
    </div>

    <!-- Basic Info Table -->
    <table class="info-table">
        <tr>
            <td style="width: 18%;" class="font-bold">เรื่อง:</td>
            <td style="width: 82%;" colspan="3">{{ $clearing->title }}</td>
        </tr>
        <tr>
            <td class="font-bold">ผู้ขอเบิก/ยืมเงิน:</td>
            <td style="width: 38%;">{{ $clearing->claimant_name }}</td>
            <td style="width: 14%;" class="font-bold">ตำแหน่ง:</td>
            <td style="width: 30%;">{{ $clearing->claimant_position ?: '-' }}</td>
        </tr>
        <tr>
            <td class="font-bold">หน่วยงาน/ฝ่าย:</td>
            <td>{{ $clearing->claimant_department ?: ($clearing->project?->department?->name ?: '-') }}</td>
            <td class="font-bold">วันที่ดำเนินงาน:</td>
            <td>{{ $clearing->expense_date ? \Carbon\Carbon::parse($clearing->expense_date)->thaidate('j F Y') : '-' }}</td>
        </tr>
        <tr>
            <td class="font-bold">งบประมาณที่ตัดยอด:</td>
            <td colspan="3">
                @if($clearing->project)
                    <b>โครงการ:</b> {{ $clearing->project->title }} (ปีงบประมาณ {{ $clearing->project->academic_year }})
                @elseif($clearing->routineBudgetPlan)
                    <b>งบดำเนินงาน:</b> {{ $clearing->routineBudgetPlan->title }} ({{ $clearing->routineBudgetPlan->fiscal_year }})
                @elseif($clearing->fundingSource)
                    <b>แหล่งเงิน:</b> {{ $clearing->fundingSource->name }}
                @else
                    -
                @endif
                @if($clearing->plan_doc_number)
                    &nbsp;&nbsp;<span style="color: #4338ca;">(เลขที่ตัดยอดงานแผนงาน: <b>{{ $clearing->plan_doc_number }}</b>)</span>
                @endif
            </td>
        </tr>
        @if($clearing->clearing_type === 'with_loan')
        <tr>
            <td class="font-bold">อ้างถึงสัญญายืมเงิน:</td>
            <td colspan="3">
                @if($clearing->travelLoan)
                    สัญญายืมเงินไปราชการ เลขที่: <b>{{ $clearing->travelLoan->contract_no ?: ('TL-' . $clearing->travelLoan->id) }}</b>
                    (ยืมเงินจำนวน {{ number_format($clearing->loan_amount, 2) }} บาท)
                @elseif($clearing->project && $clearing->project->procurement?->plan_loan_doc_number)
                    สัญญายืมเงินโครงการ เลขที่คุม: <b>{{ $clearing->project->procurement->plan_loan_doc_number }}</b>
                    (ยืมเงินจำนวน {{ number_format($clearing->loan_amount, 2) }} บาท)
                @else
                    สัญญายืมเงินทดรองราชการ (ยืมเงินจำนวน {{ number_format($clearing->loan_amount, 2) }} บาท)
                @endif
            </td>
        </tr>
        @else
        <tr>
            <td class="font-bold">ประเภทการเบิก:</td>
            <td colspan="3">
                <b>ขอเบิกจ่ายตรง (ไม่มีสัญญายืมเงินล่วงหน้า)</b> &mdash; ได้สำรองจ่ายเงินส่วนตัวเพื่อประโยชน์แก่ทางราชการ
            </td>
        </tr>
        @endif
    </table>

    <!-- Expense Breakdown Table -->
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 8%;">ลำดับ</th>
                <th style="width: 48%;">รายการค่าใช้จ่าย</th>
                <th style="width: 24%;">ใบเสร็จ / เลขอ้างอิง</th>
                <th style="width: 20%;">จำนวนเงิน (บาท)</th>
            </tr>
        </thead>
        <tbody>
            @if(empty($clearing->expense_items) || count($clearing->expense_items) === 0)
                <tr>
                    <td class="text-center">1</td>
                    <td>{{ $clearing->title }}</td>
                    <td class="text-center">{{ $clearing->receipt_reference ?: 'ใบเสร็จรับเงิน/ใบสำคัญ' }}</td>
                    <td class="text-right font-bold">{{ number_format($clearing->actual_spent_amount, 2) }}</td>
                </tr>
            @else
                @foreach($clearing->expense_items as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>{{ $item['description'] ?? 'ค่าใช้จ่าย' }}</td>
                        <td class="text-center font-mono">{{ $item['receipt_no'] ?? ($clearing->receipt_reference ?: '-') }}</td>
                        <td class="text-right">{{ number_format((float)($item['amount'] ?? 0), 2) }}</td>
                    </tr>
                @endforeach
            @endif
            <tr style="background-color: #f9f9f9; font-weight: bold;">
                <td colspan="3" class="text-right">รวมค่าใช้จ่ายจ่ายจริงทั้งสิ้น (Actual Total Spent):</td>
                <td class="text-right" style="font-size: 13pt;">{{ number_format($clearing->actual_spent_amount, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <!-- Calculation Summary Box -->
    <div class="summary-box">
        <div class="font-bold underline" style="margin-bottom: 6px;">สรุปผลการตรวจสอบและการเคลียร์ยอดเงิน:</div>
        
        @if($clearing->clearing_type === 'with_loan')
            <div style="margin-bottom: 4px;">
                1. ได้รับเงินยืมทดรองราชการไปแล้ว เป็นเงิน: <b>{{ number_format($clearing->loan_amount, 2) }}</b> บาท
            </div>
            <div style="margin-bottom: 6px;">
                2. ค่าใช้จ่ายจ่ายจริงตามหลักฐานใบเสร็จข้างต้น เป็นเงิน: <b>{{ number_format($clearing->actual_spent_amount, 2) }}</b> บาท
            </div>
            <div class="font-bold">
                ผลต่างการเคลียร์เงินยืม:
            </div>
            <div class="checkbox-item">
                <span class="box-check">{{ $clearing->clearing_result === 'refund' ? '✓' : '' }}</span>
                <span><b>มีเงินเหลือส่งคืนคลัง</b> เป็นจำนวนเงิน <b>{{ number_format($clearing->difference_amount, 2) }}</b> บาท (ส่งคืนงานการเงินเรียบร้อยแล้ว)</span>
            </div>
            <div class="checkbox-item">
                <span class="box-check">{{ $clearing->clearing_result === 'exact' ? '✓' : '' }}</span>
                <span><b>ค่าใช้จ่ายพอดีกับเงินยืม</b> ไม่มียอดเงินเหลือส่งคืน และไม่ต้องเบิกจ่ายเพิ่ม</span>
            </div>
            <div class="checkbox-item">
                <span class="box-check">{{ $clearing->clearing_result === 'reimburse' ? '✓' : '' }}</span>
                <span><b>เงินไม่เพียงพอ / จ่ายเกินเงินยืม</b> ขออนุมัติเบิกเงินชดเชยเพิ่มเติม เป็นจำนวนเงิน <b>{{ number_format($clearing->difference_amount, 2) }}</b> บาท</span>
            </div>
        @else
            <div style="margin-bottom: 4px;">
                1. จำนวนเงินที่สำรองจ่ายจริงตามหลักฐานใบเสร็จ: <b>{{ number_format($clearing->actual_spent_amount, 2) }}</b> บาท
            </div>
            <div class="checkbox-item">
                <span class="box-check">✓</span>
                <span><b>ขออนุมัติตัดยอดงบประมาณและเบิกจ่ายเงินคืน</b> แก่ผู้สำรองจ่าย เป็นจำนวนเงิน <b>{{ number_format($clearing->actual_spent_amount, 2) }}</b> บาท</span>
            </div>
        @endif
        
        <div style="margin-top: 6px; font-size: 11pt; color: #444;">
            แนบหลักฐานใบเสร็จรับเงิน/ใบสำคัญรับเงิน จำนวนทั้งสิ้น <b>{{ $clearing->receipt_count ?: (empty($clearing->expense_items) ? 1 : count($clearing->expense_items)) }}</b> ฉบับ
        </div>
    </div>

    <!-- Signatures: 4 Columns / Blocks -->
    <div class="signature-grid">
        <!-- 1. Claimant / Borrower -->
        <div class="sign-box">
            <div class="font-bold">๑. ผู้ยืมเงิน / ผู้ขอเบิกจ่าย</div>
            <div class="sign-space"></div>
            <div>ลงชื่อ..............................................................</div>
            <div class="font-bold">({{ $clearing->claimant_name }})</div>
            <div>ตำแหน่ง {{ $clearing->claimant_position ?: 'ครูผู้สอน / ผู้รับผิดชอบ' }}</div>
            <div>วันที่ ....../....../......</div>
        </div>

        <!-- 2. Planning Department (Budget Cut) -->
        <div class="sign-box" style="border-color: #4f46e5;">
            <div class="font-bold" style="color: #3730a3;">๒. ความเห็นงานวางแผนและงบประมาณ</div>
            <div style="font-size: 10.5pt; text-align: left; margin: 4px 0 2px 8px;">
                [✓] ตรวจสอบความถูกต้องและตัดยอดงบแล้ว<br>
                เลขที่ตัดยอด: <b>{{ $clearing->plan_doc_number ?: '...........................' }}</b>
            </div>
            <div class="sign-space" style="height: 22px;"></div>
            <div>ลงชื่อ..............................................................</div>
            <div class="font-bold">({{ $clearing->planApprover?->name ?: 'หัวหน้างานวางแผนและงบประมาณ' }})</div>
            <div>วันที่ {{ $clearing->plan_approved_at ? \Carbon\Carbon::parse($clearing->plan_approved_at)->thaidate('j M y') : '....../....../......' }}</div>
        </div>

        <!-- 3. Finance Department (Disburse / Receive) -->
        <div class="sign-box" style="border-color: #059669;">
            <div class="font-bold" style="color: #065f46;">๓. ความเห็นงานการเงิน</div>
            <div style="font-size: 10.5pt; text-align: left; margin: 4px 0 2px 8px;">
                @if($clearing->clearing_result === 'refund')
                    [✓] ได้รับเงินเหลือส่งคืนคลังครบถ้วนแล้ว<br>
                @elseif($clearing->clearing_result === 'reimburse')
                    [✓] ตรวจสอบหลักฐานเพื่อสั่งจ่ายเงินชดเชย<br>
                @else
                    [✓] เคลียร์เงินยืมและปิดสัญญาสมบูรณ์<br>
                @endif
                เลขที่เอกสาร กง.: <b>{{ $clearing->finance_doc_number ?: '...........................' }}</b>
            </div>
            <div class="sign-space" style="height: 22px;"></div>
            <div>ลงชื่อ..............................................................</div>
            <div class="font-bold">({{ $clearing->financeApprover?->name ?: 'หัวหน้างานการเงิน' }})</div>
            <div>วันที่ {{ $clearing->finance_completed_at ? \Carbon\Carbon::parse($clearing->finance_completed_at)->thaidate('j M y') : '....../....../......' }}</div>
        </div>

        <!-- 4. Director (Approval) -->
        <div class="sign-box">
            <div class="font-bold">๔. การอนุมัติของผู้บริหาร</div>
            <div style="font-size: 11pt; margin: 4px 0;">
                [✓] อนุมัติ &nbsp;&nbsp;&nbsp; [ &nbsp; ] ไม่อนุมัติ
            </div>
            <div class="sign-space" style="height: 22px;"></div>
            <div>ลงชื่อ..............................................................</div>
            <div class="font-bold">(ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน)</div>
            <div>วันที่ ....../....../......</div>
        </div>
    </div>
</div>

</body>
</html>
