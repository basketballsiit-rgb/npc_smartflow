<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ขอบเขตและรายละเอียดคุณลักษณะเฉพาะ (TOR) - {{ $project->title }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 2cm 2cm 2cm 2.5cm;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: "TH Sarabun PSK", "THSarabunPSK", "Angsana New", sans-serif;
            font-size: 16pt;
            line-height: 1.25;
            color: #000;
            margin: 0;
            padding: 0;
            background-color: #fff;
        }
        .page-container {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .nowrap { white-space: nowrap; }

        .doc-header {
            text-align: center;
            font-weight: bold;
            font-size: 16pt;
            line-height: 1.3;
            margin-bottom: 18px;
        }

        .section-block {
            margin-bottom: 12px;
            page-break-inside: avoid;
        }
        .section-heading {
            font-weight: bold;
            margin-bottom: 2px;
        }
        .section-body {
            text-indent: 1.2cm;
            text-align: justify;
            text-justify: inter-cluster;
            line-height: 1.25;
            margin-bottom: 4px;
        }
        .section-sublist {
            margin-left: 1.2cm;
            line-height: 1.25;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0 16px 0;
        }
        .items-table th, .items-table td {
            padding: 4px 8px;
            vertical-align: middle;
        }
        .items-table th {
            font-weight: bold;
            border-bottom: 1px solid #000;
            text-align: center;
        }
        .items-table td.col-idx {
            width: 8%;
            text-align: center;
        }
        .items-table td.col-desc {
            width: 62%;
            text-align: left;
        }
        .items-table td.col-qty {
            width: 15%;
            text-align: center;
            font-weight: bold;
        }
        .items-table td.col-unit {
            width: 15%;
            text-align: left;
        }

        .signatures-container {
            margin-top: 25px;
            page-break-inside: avoid;
        }
        .signature-row {
            margin-bottom: 22px;
            page-break-inside: avoid;
        }
        .sig-dots {
            display: inline-block;
            border-bottom: 1px dotted #000;
            min-width: 220px;
            margin-right: 6px;
        }
        .sig-name {
            display: inline-block;
            min-width: 240px;
            text-align: center;
            margin-top: 3px;
        }

        @media print {
            .no-print { display: none !important; }
            body { padding: 0 !important; }
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

    if (!function_exists('convertToThaiBahtTextTor')) {
        function convertToThaiBahtTextTor($number) {
            if (!is_numeric($number)) return '';
            $number = number_format($number, 2, '.', '');
            $exploded = explode('.', $number);
            $num = $exploded[0];
            $dec = isset($exploded[1]) ? $exploded[1] : '00';
            
            $digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
            $positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
            
            $convertGroup = function($n) use ($digits, $positions) {
                $len = strlen($n);
                $res = '';
                for ($i = 0; $i < $len; $i++) {
                    $d = (int)$n[$i];
                    $pos = $len - $i - 1;
                    if ($d !== 0) {
                        if ($pos === 1 && $d === 1) {
                            $res .= 'สิบ';
                        } elseif ($pos === 1 && $d === 2) {
                            $res .= 'ยี่สิบ';
                        } elseif ($pos === 0 && $d === 1 && $len > 1 && $n[$len - 2] != '0') {
                            $res .= 'เอ็ด';
                        } else {
                            $res .= $digits[$d] . $positions[$pos];
                        }
                    }
                }
                return $res;
            };

            $baht = '';
            if ((int)$num === 0) {
                $baht = 'ศูนย์บาท';
            } else {
                if (strlen($num) > 6) {
                    $millions = substr($num, 0, -6);
                    $remainder = substr($num, -6);
                    $baht = $convertGroup($millions) . 'ล้าน' . $convertGroup($remainder) . 'บาท';
                } else {
                    $baht = $convertGroup($num) . 'บาท';
                }
            }
            
            if ((int)$dec === 0) {
                $baht .= 'ถ้วน';
            } else {
                $baht .= $convertGroup($dec) . 'สตางค์';
            }
            return $baht;
        }
    }

    // 1. Proposer (ผู้เสนอ / ผู้กำหนดขอบเขตฯ)
    $cleanProposerName = cleanPersonName($project->user?->name ?? '..........................................................');
    
    // 2. Department & Head of Department
    $dept = $project->department;
    $deptName = $dept ? $dept->name : ($project->user?->department?->name ?? 'งานพัฒนาหลักสูตรและการจัดการเรียนรู้');
    $divisionName = $dept && $dept->division ? $dept->division : 'ฝ่ายวิชาการ';
    
    $deptDisplayName = $deptName;
    if (!str_starts_with($deptDisplayName, 'งาน') && !str_starts_with($deptDisplayName, 'แผนก') && !str_starts_with($deptDisplayName, 'ฝ่าย')) {
        $deptDisplayName = 'แผนกวิชา' . $deptDisplayName;
    }

    $headUser = null;
    if ($dept) {
        $headUser = \App\Models\User::where('department_id', $dept->id)
            ->where(function($q) {
                $q->where('position', 'like', '%หัวหน้า%')
                  ->orWhere('position', 'like', '%รักษาการ%');
            })->first();
    }
    $headOfDeptName = $headUser ? cleanPersonName($headUser->name) : $cleanProposerName;
    $headOfDeptTitle = 'หัวหน้า' . (str_starts_with($deptName, 'งาน') || str_starts_with($deptName, 'แผนก') || str_starts_with($deptName, 'ฝ่าย') ? $deptName : $deptName);

    // 3. Deputy Director options
    $deputyOptions = [
        'academic' => [
            'key' => 'academic',
            'division' => 'ฝ่ายวิชาการ',
            'title' => 'รองผู้อำนวยการฝ่ายวิชาการ',
            'name' => 'นายนิพนธ์ ร่องพืช',
        ],
        'resources' => [
            'key' => 'resources',
            'division' => 'ฝ่ายบริหารทรัพยากร',
            'title' => 'รองผู้อำนวยการฝ่ายบริหารทรัพยากร',
            'name' => 'นางสาวสุพรรณี สุขสงวน',
        ],
        'planning' => [
            'key' => 'planning',
            'division' => 'ฝ่ายแผนงานและความร่วมมือ',
            'title' => 'รองผู้อำนวยการฝ่ายแผนงานและความร่วมมือ',
            'name' => 'นายวัชระ คงเพ็ชร',
        ],
        'student_affairs' => [
            'key' => 'student_affairs',
            'division' => 'ฝ่ายพัฒนากิจการนักเรียน นักศึกษา',
            'title' => 'รองผู้อำนวยการฝ่ายพัฒนากิจการนักเรียนนักศึกษา',
            'name' => 'นายศิริชัย นันทขว้าง',
        ],
    ];

    foreach ($deputyOptions as $k => $opt) {
        $foundUser = \App\Models\User::where('position', 'like', "%{$opt['title']}%")
            ->orWhere('position', 'like', "%{$opt['division']}%")
            ->first();
        if ($foundUser) {
            $deputyOptions[$k]['name'] = cleanPersonName($foundUser->name);
        }
    }

    $initialDeputyKey = 'academic';
    if (str_contains($divisionName, 'บริหาร') || str_contains($divisionName, 'ทรัพยากร')) {
        $initialDeputyKey = 'resources';
    } elseif (str_contains($divisionName, 'กิจการ') || str_contains($divisionName, 'พัฒนา')) {
        $initialDeputyKey = 'student_affairs';
    } elseif (str_contains($divisionName, 'แผน') || str_contains($divisionName, 'ร่วมมือ')) {
        $initialDeputyKey = 'planning';
    } elseif (str_contains($divisionName, 'วิชาการ')) {
        $initialDeputyKey = 'academic';
    }

    $deputyDirectorName = $deputyOptions[$initialDeputyKey]['name'];
    $deputyDirectorTitle = $deputyOptions[$initialDeputyKey]['title'];

    // 4. College Director
    $directorUser = \App\Models\User::where('position', 'like', '%ผู้อำนวยการวิทยาลัย%')
        ->orWhere('position', 'like', '%ผู้อำนวยการ%')
        ->where('position', 'not like', '%รองผู้อำนวยการ%')
        ->first();
    $directorSetting = \App\Models\SystemSetting::where('key', 'director_name')->first();
    $directorName = $directorSetting ? cleanPersonName($directorSetting->value) : ($directorUser ? cleanPersonName($directorUser->name) : 'นายกเชษฐ์ กิ่งชนะ');

    // Items and Amounts
    $procItems = $items ?: ($procurement ? $procurement->items : collect());
    $itemsCount = $procItems->count() > 0 ? $procItems->count() : ($project->items ? $project->items->count() : 1);
    
    $totalProcSum = $procItems->sum(function($it) {
        return floatval($it->quantity ?? 1) * floatval($it->unit_price ?? 0);
    });
    $finalProcAmount = $totalProcSum > 0 ? $totalProcSum : ($project->estimated_budget ?: 0);
    $bahtText = convertToThaiBahtTextTor($finalProcAmount);

    $fiscalYear = $project->academic_year ?? '2569';
    $budgetSourceName = $project->budget?->fundingSource?->name ?? 'งบประมาณรายจ่ายอื่น';
    $deliveryDays = request('delivery_days', '5');
@endphp

<body>
    <!-- Interactive Top Control Bar -->
    <div class="no-print" style="margin: 15px auto 25px auto; max-width: 800px; background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 12px 18px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.04);">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <label for="deputy-select" style="font-weight: bold; color: #1e293b; font-size: 14pt; display: flex; align-items: center; gap: 6px;">
                <span>👔</span> เลือกรองฝ่ายที่เกี่ยวข้อง:
            </label>
            <select id="deputy-select" onchange="changeDeputy(this.value)" style="padding: 6px 14px; border-radius: 10px; border: 2px solid #7c3aed; font-family: inherit; font-size: 14pt; font-weight: bold; color: #4c1d95; background-color: #ffffff; cursor: pointer; outline: none; box-shadow: 0 2px 4px rgba(124,58,237,0.1);">
                @foreach($deputyOptions as $key => $opt)
                    <option value="{{ $key }}" {{ ($initialDeputyKey === $key) ? 'selected' : '' }}>
                        {{ $opt['division'] }} — ({{ $opt['name'] }})
                    </option>
                @endforeach
                <option value="custom">✏️ ระบุชื่อ/ตำแหน่งเอง (กำหนดเอง)...</option>
            </select>
        </div>

        <button onclick="window.print()" style="padding: 8px 20px; background-color: #7c3aed; color: #ffffff; border: none; border-radius: 10px; font-family: inherit; font-size: 14pt; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 8px rgba(124,58,237,0.25);">
            <span>🖨️</span> สั่งพิมพ์แบบฟอร์ม TOR
        </button>
    </div>

    <div class="page-container">
        <!-- Header -->
        <div class="doc-header">
            <div>ขอบเขตและรายละเอียดคุณลักษณะเฉพาะ</div>
            <div>การจัดซื้อพัสดุ{{ $deptDisplayName }} จำนวน .......{{ $itemsCount }}......รายการ</div>
            <div>{{ $deptDisplayName }}..... วิทยาลัยสารพัดช่างน่าน</div>
        </div>

        <!-- 1. ความเป็นมา -->
        <div class="section-block">
            <div class="section-heading">1. ความเป็นมา</div>
            <div class="section-body">
                การบริหาร{{ $deptDisplayName }} เป็นงานที่ทางวิทยาลัยฯ ต้องดำเนินการภายใต้ระเบียบข้อบังคับ เป็นงานสนับสนุนงานอื่น ๆ ให้สามารถดำเนินการไปได้ด้วยดี ซึ่งเป็นหน่วยงานที่ต้องดำเนินการจึงต้องมีการพัฒนา งานด้าน{{ $deptDisplayName }}อยู่เสมอ เพื่อให้เกิดความถูกต้อง ไม่ให้เกิดการเสียหายแก่ทางราชการและบังเกิดผลดีต่อการจัดการศึกษา
            </div>
            <div class="section-body">
                {{ $deptDisplayName }} วิทยาลัยสารพัดช่างน่าน ตระหนักและเห็นความสำคัญของการบริหาร{{ $deptDisplayName }} และจัดระบบงานดังกล่าวให้สามารถตรวจสอบติดตามได้อย่างมีระบบมากยิ่งขึ้น มีความจำเป็นต้องจัดซื้อวัสดุอุปกรณ์ จำนวน {{ $itemsCount }} รายการ เพื่อใช้รองรับการปฏิบัติงานและดำเนินงานตามภารกิจของเจ้าหน้าที่ผู้ปฏิบัติงานด้านการบริหาร{{ $deptDisplayName }} และสามารถเบิกใช้งานได้อย่างต่อเนื่อง
            </div>
        </div>

        <!-- 2. วัตถุประสงค์ -->
        <div class="section-block">
            <div class="section-heading">2. วัตถุประสงค์</div>
            <div class="section-sublist">
                <div>2.1 เพื่อจัดหาจัดทำเอกสารหลักฐาน{{ $deptDisplayName }}ได้อย่างถูกต้อง</div>
                <div>2.2 เพื่อพัฒนาการบริหาร{{ $deptDisplayName }} ให้เกิดประโยชน์ต่อนักเรียนและทางราชการมากที่สุด</div>
                <div>2.3 เพื่อให้เกิดความคล่องตัวในการปฏิบัติงาน</div>
            </div>
        </div>

        <!-- 3. คุณสมบัติของผู้ขาย -->
        <div class="section-block">
            <div class="section-heading">3. คุณสมบัติของผู้ขาย</div>
            <div class="section-sublist">
                <div>3.1 มีความสามารถตามกฎหมาย</div>
                <div>3.2 ไม่เป็นบุคคลล้มละลาย</div>
                <div>3.3 ไม่อยู่ระหว่างเลิกกิจการ</div>
                <div>3.4 ไม่เป็นบุคคลซึ่งอยู่ระหว่างถูกระงับการยื่นข้อเสนอหรือทำสัญญากับหน่วยงานของรัฐตาม มาตรา 106 วรรคสาม</div>
                <div>3.5 ไม่เป็นบุคคลซึ่งถูกแจ้งเวียนชื่อให้เป็นผู้ทิ้งงานของหน่วยงานของรัฐตามมาตรา 109</div>
                <div>3.6 คุณสมบัติหรือลักษณะต้องห้ามอื่นตามที่คณะกรรมการนโยบายประกาศกำหนดในราชกิจจานุเบกษา</div>
                <div>3.7 เป็นบุคคลธรรมดาหรือนิติบุคคลผู้มีอาชีพขายพัสดุนั้น</div>
            </div>
        </div>

        <!-- 4. รายละเอียดคุณลักษณะเฉพาะของพัสดุ -->
        <div class="section-block">
            <div class="section-heading">4. รายละเอียดคุณลักษณะเฉพาะของพัสดุ</div>
            <table class="items-table">
                <tbody>
                    @if($procItems->count() > 0)
                        @foreach($procItems as $idx => $it)
                            <tr>
                                <td class="col-idx">{{ $idx + 1 }}</td>
                                <td class="col-desc">{{ preg_replace('/[💵📦💰📑📝🛒📄📊]/u', '', $it->description ?? $it->name ?? '') }}</td>
                                <td class="col-qty">{{ intval($it->quantity) == $it->quantity ? intval($it->quantity) : number_format($it->quantity, 2) }}</td>
                                <td class="col-unit">{{ $it->unit ?? 'ชุด' }}</td>
                            </tr>
                        @endforeach
                    @else
                        <tr>
                            <td class="col-idx">1</td>
                            <td class="col-desc">จัดซื้อวัสดุอุปกรณ์ตามโครงการ {{ $project->title }}</td>
                            <td class="col-qty">1</td>
                            <td class="col-unit">งาน</td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </div>

        <!-- 5. ราคากลางของพัสดุที่จะซื้อ -->
        <div class="section-block">
            <div class="section-heading">5. ราคากลางของพัสดุที่จะซื้อ</div>
            <div class="section-sublist">
                ราคาสืบจากท้องตลาดในครั้งนี้รวมทั้งสิ้น ราคา {{ number_format($finalProcAmount, 2) }} บาท ({{ $bahtText }})
            </div>
        </div>

        <!-- 6. วงเงินงบประมาณ -->
        <div class="section-block">
            <div class="section-heading">6. วงเงินงบประมาณ</div>
            <div class="section-sublist">
                {{ $budgetSourceName }} ค่าใช้จ่ายโครงการ{{ $project->title }} ของวิทยาลัยสารพัดช่างน่าน ประจำปีงบประมาณ {{ $fiscalYear }} ปรากฏในแผนงาน{{ $divisionName }} วงเงินงบประมาณที่ตั้งไว้ {{ number_format($project->estimated_budget, 2) }} บาท
            </div>
        </div>

        <!-- 7. กำหนดเวลาส่งมอบพัสดุ -->
        <div class="section-block">
            <div class="section-heading">7. กำหนดเวลาส่งมอบพัสดุ</div>
            <div class="section-sublist">
                ส่งมอบพัสดุภายใน {{ $deliveryDays }} วันทำการนับแต่วันที่ลงนามในสัญญาหรือข้อตกลงเป็นหนังสือ
            </div>
        </div>

        <!-- 8. หลักเกณฑ์การพิจารณาคัดเลือกข้อเสนอ -->
        <div class="section-block">
            <div class="section-heading">8. หลักเกณฑ์การพิจารณาคัดเลือกข้อเสนอ</div>
            <div class="section-sublist">
                เกณฑ์ราคา
            </div>
        </div>

        <!-- 9. งวดงานและการจ่ายเงิน -->
        <div class="section-block">
            <div class="section-heading">9. งวดงานและการจ่ายเงิน</div>
            <div class="section-sublist">
                กำหนดส่งมอบและเบิกจ่ายงวดเดียว
            </div>
        </div>

        <!-- 10. อัตราค่าปรับ -->
        <div class="section-block">
            <div class="section-heading">10. อัตราค่าปรับ</div>
            <div class="section-sublist">
                กำหนดค่าปรับเป็นรายวันในอัตราตายตัวระหว่างร้อยละ 0.20 ของราคาพัสดุที่ยังไม่ได้รับมอบ
            </div>
        </div>

        <!-- SIGNATURES (การลงลายมือชื่อ 4 ตำแหน่ง) -->
        <div class="signatures-container">
            <!-- 1. ผู้เสนอ (ผู้กำหนดขอบเขตฯ) -->
            <div class="signature-row">
                <div>(ลงชื่อ) <span class="sig-dots"></span> ผู้กำหนดขอบเขตและรายละเอียดคุณลักษณะเฉพาะ</div>
                <div style="padding-left: 2.2cm;">( {{ $cleanProposerName }} )</div>
            </div>

            <!-- 2. หัวหน้างาน / หัวหน้าสาขา -->
            <div class="signature-row">
                <div>(ลงชื่อ) <span class="sig-dots"></span> {{ $headOfDeptTitle }}</div>
                <div style="padding-left: 2.2cm;">( {{ $headOfDeptName }} )</div>
            </div>

            <!-- 3. รองฝ่ายที่เกี่ยวข้อง (Interactive Dynamic Name & Title) -->
            <div class="signature-row">
                <div>(ลงชื่อ) <span class="sig-dots"></span> <span id="deputy-title-text">{{ $deputyDirectorTitle }}</span></div>
                <div style="padding-left: 2.2cm;">( <span id="deputy-name-text">{{ $deputyDirectorName }}</span> )</div>
            </div>

            <!-- 4. ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน -->
            <div class="signature-row">
                <div>(ลงชื่อ) <span class="sig-dots"></span> ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน</div>
                <div style="padding-left: 2.2cm;">( {{ $directorName }} )</div>
            </div>
        </div>
    </div>

    <!-- Client-Side Deputy Switcher Script -->
    <script>
        const deputyData = @json($deputyOptions);

        function changeDeputy(val) {
            if (val === 'custom') {
                const customTitle = prompt("กรุณาระบุตำแหน่งรองผู้อำนวยการฝ่าย:", "รองผู้อำนวยการฝ่าย...");
                if (!customTitle) return;
                const customName = prompt("กรุณาระบุชื่อ-นามสกุล:", "");
                if (!customName) return;

                document.getElementById('deputy-title-text').innerText = customTitle;
                document.getElementById('deputy-name-text').innerText = customName;
                return;
            }

            if (deputyData[val]) {
                document.getElementById('deputy-title-text').innerText = deputyData[val].title;
                document.getElementById('deputy-name-text').innerText = deputyData[val].name;
            }
        }
    </script>
</body>
</html>
