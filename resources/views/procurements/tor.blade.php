<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ข้อกำหนดขอบเขตงาน (TOR) - {{ $project->title }}</title>
    <style>
        body {
            font-family: "TH Sarabun PSK", "Angsana New", sans-serif;
            font-size: 14pt;
            line-height: 1.25;
            color: #000;
            padding: 0.4in 0.7in;
            max-width: 7.2in;
            margin: auto;
        }
        .title {
            text-align: center;
            font-weight: bold;
            font-size: 16.5pt;
            margin-bottom: 10px;
            line-height: 1.2;
        }
        .tor-item {
            margin-bottom: 6px;
        }
        .section-title {
            font-weight: bold;
            margin-top: 4px;
            margin-bottom: 2px;
            font-size: 14pt;
            text-decoration: underline;
        }
        .content {
            text-indent: 0.5in;
            text-align: justify;
            line-height: 1.25;
        }
        .committee-block {
            margin-top: 25px;
            width: 100%;
            text-align: center;
            page-break-inside: avoid;
        }
        .committee-title {
            font-weight: bold;
            text-align: left;
            margin-bottom: 8px;
            font-size: 13.5pt;
        }
        .committee-member {
            margin: 8px 4px;
            display: inline-block;
            min-width: 28%;
            vertical-align: top;
            font-size: 13pt;
            white-space: nowrap;
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
@endphp
<body>
    <div class="no-print" style="margin-bottom: 12px; text-align: right;">
        <button onclick="window.print()" style="padding: 6px 14px; background-color: #7c3aed; color: white; border: none; border-radius: 6px; font-family: inherit; font-size: 13pt; font-weight: bold; cursor: pointer;">🖨️ สั่งพิมพ์เอกสาร / PDF</button>
    </div>

    <div class="title">ข้อกำหนดขอบเขตงาน (Terms of Reference : TOR)<br>การจัดหาพัสดุสำหรับโครงการ "{{$project->title}}"</div>

    @if(!empty($procurement->tor_specifications))
        <div class="content" style="white-space: pre-line; text-indent: 0; line-height: 1.25;">
            {!! nl2br(e($procurement->tor_specifications)) !!}
        </div>
    @else
        <div class="tor-item">
            <div class="section-title">1. วัตถุประสงค์</div>
            <div class="content">
                วิทยาลัยสารพัดช่างน่าน แผนกวิชา {{$project->department?->name}} มีความประสงค์จัดหาวัสดุอุปกรณ์พัสดุ เพื่อนำไปใช้สนับสนุนการจัดกิจกรรมและกระบวนการเรียนการสอนของโครงการ "{{$project->title}}"
            </div>
        </div>

        <div class="tor-item">
            <div class="section-title">2. คุณลักษณะเฉพาะและขอบเขตงาน</div>
            <div class="content">
                พัสดุและรายการวัสดุที่จัดหาต้องมีคุณลักษณะที่เหมาะสมกับการใช้งานการเรียนการสอน ตามเกณฑ์มาตรฐานสายอาชีวศึกษา โดยประกอบด้วยรายการพัสดุระบุตามบัญชีเอกสารแนบเสนอซื้อเสนอจ้าง เลขที่ {{$procurement->procurement_number}}
            </div>
        </div>

        <div class="tor-item">
            <div class="section-title">3. ระยะเวลาการส่งมอบและเงื่อนไขการส่งมอบ</div>
            <div class="content">
                ผู้จำหน่ายหรือผู้รับจ้างจะต้องส่งมอบพัสดุทั้งหมด ณ วิทยาลัยสารพัดช่างน่าน ภายในกำหนดเวลา 7 วัน นับถัดจากวันที่ได้รับใบสั่งซื้อสั่งจ้างจากทางวิทยาลัย
            </div>
        </div>

        <div class="tor-item">
            <div class="section-title">4. การตรวจรับพัสดุ</div>
            <div class="content">
                การตรวจรับจะดำเนินการโดยคณะกรรมการตรวจรับพัสดุที่วิทยาลัยแต่งตั้งขึ้น โดยต้องตรวจรับพัสดุให้ถูกต้องตรงตามเอกสารประมาณการและใบเสนอซื้อเสนอจ้างทุกประการ
            </div>
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
