<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ข้อกำหนดขอบเขตงาน (TOR) - {{ $project->title }}</title>
    <style>
        * {
            box-sizing: border-box;
        }
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
            margin-bottom: 12px;
            line-height: 1.2;
        }
        .tor-list {
            width: 100%;
        }
        .tor-item {
            margin-top: 6px;
            margin-bottom: 0px;
        }
        .tor-item:first-child {
            margin-top: 0px;
        }
        .section-title {
            font-weight: bold;
            font-size: 14pt;
            line-height: 1.25;
            margin: 0 0 1px 0;
            padding: 0;
        }
        .content {
            text-indent: 0.5in;
            text-align: justify;
            line-height: 1.25;
            margin: 0;
            padding: 0;
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
            margin: 6px 4px;
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

    $rawTor = trim($procurement->tor_specifications ?? '');
    
    // Parse into structured sections
    if (empty($rawTor)) {
        $torSections = [
            [
                'title' => '1. วัตถุประสงค์',
                'body' => 'วิทยาลัยสารพัดช่างน่าน แผนกวิชา ' . ($project->department?->name ?? 'ฝ่ายวิชาการ') . ' มีความประสงค์จัดหาวัสดุอุปกรณ์พัสดุ เพื่อนำไปใช้สนับสนุนการจัดกิจกรรมและกระบวนการเรียนการสอนของโครงการ "' . $project->title . '"'
            ],
            [
                'title' => '2. คุณลักษณะเฉพาะและขอบเขตงาน',
                'body' => 'พัสดุและรายการวัสดุที่จัดหาต้องมีคุณลักษณะที่เหมาะสมกับการใช้งานการเรียนการสอน ตามเกณฑ์มาตรฐานสายอาชีวศึกษา โดยประกอบด้วยรายการพัสดุระบุตามบัญชีเอกสารแนบเสนอซื้อเสนอจ้าง' . ($procurement->procurement_number ? ' เลขที่ ' . $procurement->procurement_number : '')
            ],
            [
                'title' => '3. ระยะเวลาการส่งมอบและเงื่อนไขการส่งมอบ',
                'body' => 'ผู้จำหน่ายหรือผู้รับจ้างจะต้องส่งมอบพัสดุทั้งหมด ณ วิทยาลัยสารพัดช่างน่าน ภายในกำหนดเวลา 7 วัน นับถัดจากวันที่ได้รับใบสั่งซื้อสั่งจ้างจากทางวิทยาลัย'
            ],
            [
                'title' => '4. การตรวจรับพัสดุ',
                'body' => 'การตรวจรับจะดำเนินการโดยคณะกรรมการตรวจรับพัสดุที่วิทยาลัยแต่งตั้งขึ้น โดยต้องตรวจรับพัสดุให้ถูกต้องตรงตามเอกสารประมาณการและใบเสนอซื้อเสนอจ้างทุกประการ'
            ]
        ];
    } else {
        $lines = preg_split("/\r\n|\n|\r/", $rawTor);
        $torSections = [];
        $currentTitle = '';
        $currentBody = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if (empty($trimmed)) continue;

            if (preg_match('/^([0-9]+|[๑-๙]+)\.\s*(.+)$/u', $trimmed)) {
                if (!empty($currentTitle) || !empty($currentBody)) {
                    $torSections[] = [
                        'title' => $currentTitle,
                        'body' => implode(' ', $currentBody)
                    ];
                    $currentBody = [];
                }
                $currentTitle = $trimmed;
            } else {
                if (empty($currentTitle)) {
                    $currentTitle = $trimmed;
                } else {
                    $currentBody[] = $trimmed;
                }
            }
        }
        if (!empty($currentTitle) || !empty($currentBody)) {
            $torSections[] = [
                'title' => $currentTitle,
                'body' => $currentBody
            ];
        }
    }
@endphp
<body>
    <div class="no-print" style="margin-bottom: 12px; text-align: right;">
        <button onclick="window.print()" style="padding: 6px 14px; background-color: #7c3aed; color: white; border: none; border-radius: 6px; font-family: inherit; font-size: 13pt; font-weight: bold; cursor: pointer;">🖨️ สั่งพิมพ์เอกสาร / PDF</button>
    </div>

    <div class="title">ข้อกำหนดขอบเขตงาน (Terms of Reference : TOR)<br>การจัดหาพัสดุสำหรับโครงการ "{{$project->title}}"</div>

    <div class="tor-list">
        @foreach($torSections as $sec)
            <div class="tor-item">
                @if(!empty($sec['title']))
                    <div class="section-title">{{ $sec['title'] }}</div>
                @endif
                @if(!empty($sec['body']))
                    <div class="content">
                        @if(is_array($sec['body']))
                            @foreach($sec['body'] as $bLine)
                                @php $trimmedB = trim($bLine); @endphp
                                @if(preg_match('/^(\d+\.\d+|[•\-\*])\s*/u', $trimmedB))
                                    <div style="margin-left: 0.3in; text-indent: 0; line-height: 1.25;">{{ $trimmedB }}</div>
                                @else
                                    <div style="line-height: 1.25;">{{ $trimmedB }}</div>
                                @endif
                            @endforeach
                        @else
                            {{ $sec['body'] }}
                        @endif
                    </div>
                @endif
            </div>
        @endforeach
    </div>

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
