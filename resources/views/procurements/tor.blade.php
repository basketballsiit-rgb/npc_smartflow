<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ข้อกำหนดขอบเขตงาน (TOR) - {{ $project->title }}</title>
    <style>
        body {
            font-family: "TH Sarabun PSK", "Angsana New", sans-serif;
            font-size: 14pt;
            line-height: 1.3;
            color: #000;
            padding: 0.5in 0.7in;
            max-width: 7.2in;
            margin: auto;
        }
        .title {
            text-align: center;
            font-weight: bold;
            font-size: 17pt;
            margin-bottom: 16px;
        }
        .section-title {
            font-weight: bold;
            margin-top: 12px;
            text-decoration: underline;
        }
        .content {
            text-indent: 0.5in;
            text-align: justify;
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
            font-size: 13.5pt;
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

    <div class="title">ข้อกำหนดขอบเขตงาน (Terms of Reference : TOR)<br>การจัดหาพัสดุสำหรับโครงการ "{{$project->title}}"</div>

    @if(!empty($procurement->tor_specifications))
        <div class="content" style="white-space: pre-line; text-indent: 0;">
            {!! nl2br(e($procurement->tor_specifications)) !!}
        </div>
    @else
        <div class="section-title">1. วัตถุประสงค์</div>
        <div class="content">
            วิทยาลัยสารพัดช่างน่าน แผนกวิชา {{$project->department?->name}} มีความประสงค์จัดหาวัสดุอุปกรณ์พัสดุ เพื่อนำไปใช้สนับสนุนการจัดกิจกรรมและกระบวนการเรียนการสอนของโครงการ "{{$project->title}}"
        </div>

        <div class="section-title">2. คุณลักษณะเฉพาะและขอบเขตงาน</div>
        <div class="content">
            พัสดุและรายการวัสดุที่จัดหาต้องมีคุณลักษณะที่เหมาะสมกับการใช้งานการเรียนการสอน ตามเกณฑ์มาตรฐานสายอาชีวศึกษา โดยประกอบด้วยรายการพัสดุระบุตามบัญชีเอกสารแนบเสนอซื้อเสนอจ้าง เลขที่ {{$procurement->procurement_number}}
        </div>

        <div class="section-title">3. ระยะเวลาการส่งมอบและเงื่อนไขการส่งมอบ</div>
        <div class="content">
            ผู้จำหน่ายหรือผู้รับจ้างจะต้องส่งมอบพัสดุทั้งหมด ณ วิทยาลัยสารพัดช่างน่าน ภายในกำหนดเวลา 7 วัน นับถัดจากวันที่ได้รับใบสั่งซื้อสั่งจ้างจากทางวิทยาลัย
        </div>

        <div class="section-title">4. การตรวจรับพัสดุ</div>
        <div class="content">
            การตรวจรับจะดำเนินการโดยคณะกรรมการตรวจรับพัสดุที่วิทยาลัยแต่งตั้งขึ้น โดยต้องตรวจรับพัสดุให้ถูกต้องตรงตามเอกสารประมาณการและใบเสนอซื้อเสนอจ้างทุกประการ
        </div>
    @endif

    <div class="committee-block">
        <div class="committee-title">คณะกรรมการตรวจรับพัสดุและควบคุมงาน</div>
        
        @foreach($inspectionCommittee as $member)
            <div class="committee-member">
                <div class="underline-dotted"></div>
                <div style="margin-top: 4px;">( {{ cleanPersonName($member->name) }} )</div>
                <div style="font-size: 11.5pt; color: #333; margin-top: 2px;">
                    {{$member->pivot->role === 'chairperson' ? 'ประธานกรรมการตรวจรับ' : 'กรรมการตรวจรับ'}}
                </div>
            </div>
        @endforeach
    </div>
</body>
</html>
