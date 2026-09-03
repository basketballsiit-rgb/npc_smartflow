<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>สัญญายืมเงิน (แบบ กค. ๑๐๑) - {{ $project->title }}</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            background-color: #f1f5f9;
            font-family: "TH Sarabun PSK", "THSarabunPSK", "Angsana New", sans-serif;
            font-size: 15pt;
            line-height: 1.25;
            color: #000000;
            margin: 0;
            padding: 20px 0;
        }
        .a4-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto 25px auto;
            padding: 6mm 12mm 6mm 15mm;
            box-sizing: border-box;
            background: #ffffff;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
        }
        .outer-contract-box {
            border: 1.5px solid #000;
            min-height: 278mm;
            box-sizing: border-box;
            overflow: hidden;
            padding-bottom: 4px;
        }
        .bold { font-weight: bold; }
        .font-normal { font-weight: normal; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .underline-dotted {
            border-bottom: 1px dotted #000;
            padding: 0 4px;
            display: inline;
        }

        table.details-table {
            width: 100%;
            border-collapse: collapse;
            border: none;
            border-top: 1.5px solid #000;
            border-bottom: 1.5px solid #000;
            font-size: 15pt;
            font-family: inherit;
            margin: 0;
        }
        table.details-table td {
            border: none;
            padding: 2px 10px;
            vertical-align: top;
            font-family: inherit;
            font-size: 15pt;
        }
        table.details-table td.col-border-right {
            border-right: 1.5px solid #000;
        }
        table.details-table td.col-amount {
            text-align: right;
            width: 22%;
            white-space: nowrap;
            font-family: inherit;
            font-size: 15pt;
            font-weight: normal;
        }

        .divider-line {
            border-top: 1.5px solid #000;
            width: 100%;
            margin: 0;
        }

        @media print {
            body {
                background-color: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            .a4-page {
                width: 100% !important;
                min-height: auto !important;
                padding: 4mm 10mm 4mm 12mm !important;
                margin: 0 !important;
                box-shadow: none !important;
            }
            .outer-contract-box {
                min-height: 282mm !important;
            }
            .no-print,
            .no-print * {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
            }
            @page {
                size: A4 portrait;
                margin: 0;
            }
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

    if (!function_exists('toThaiDigits')) {
        function toThaiDigits($str) {
            $thaiDigits = ['0'=>'๐', '1'=>'๑', '2'=>'๒', '3'=>'๓', '4'=>'๔', '5'=>'๕', '6'=>'๖', '7'=>'๗', '8'=>'๘', '9'=>'๙'];
            return strtr((string)$str, $thaiDigits);
        }
    }

    if (!function_exists('formatThaiMoney')) {
        function formatThaiMoney($number) {
            $formatted = number_format(floatval($number), 2);
            return toThaiDigits($formatted);
        }
    }

    if (!function_exists('formatThaiLoanItemDesc')) {
        function formatThaiLoanItemDesc($desc, $itemIndex) {
            $desc = trim(preg_replace('/[💵📦💰📑📝🛒📄📊]/u', '', $desc));
            // Strip leading dashes or bullet points e.g. "- ", "• ", "- ๑. ", "- 1. "
            $desc = preg_replace('/^[\-\–\—\•\*\s]+/u', '', $desc);
            
            // If it starts with a number like "1. ", "๑. ", "1) ", "๑) ", "1 ", "๑ "
            if (preg_match('/^([0-9]+|[๐-๙]+)[\.\)]\s*(.*)$/u', $desc, $m)) {
                $thaiNum = toThaiDigits($m[1]);
                $rest = $m[2];
                $desc = $thaiNum . '. ' . $rest;
            } else {
                $thaiIdx = toThaiDigits($itemIndex);
                $desc = $thaiIdx . '. ' . $desc;
            }
            // Convert any remaining Arabic digits in the item description to Thai digits
            return toThaiDigits($desc);
        }
    }

    if (!function_exists('convertToThaiBahtTextLoan')) {
        function convertToThaiBahtTextLoan($number) {
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

    // 1. Requester / Borrower
    $rawProposerName = $project->responsible_person ?: ($project->user ? $project->user->name : '..........................................................');
    $extractedProposerPos = '';
    if (preg_match('/\((.*?)\)/u', $rawProposerName, $matches)) {
        $extractedProposerPos = trim($matches[1]);
    }
    $cleanProposerName = cleanPersonName($rawProposerName);
    $displayProposerPos = $project->position ?: ($extractedProposerPos ?: ($project->user?->position ?: 'ครู'));
    $deptName = $project->department ? $project->department->name : ($project->user?->department?->name ?? 'วิทยาลัยสารพัดช่างน่าน');

    // 2. Financial Head
    $financeUser = \App\Models\User::where('position', 'like', '%การเงิน%')
        ->orWhere('position', 'like', '%หัวหน้างานการเงิน%')
        ->first();
    $financeHeadName = $financeUser ? cleanPersonName($financeUser->name) : 'นางสาวดวงดาว ไชยเขียว';

    // 3. Deputy Resources
    $deputyResUser = \App\Models\User::where('position', 'like', '%บริหารทรัพยากร%')->first();
    $deputyResName = $deputyResUser ? cleanPersonName($deputyResUser->name) : 'นายจักรพงศ์ พรหมสกุลปัญญา';

    // 4. College Director
    $directorUser = \App\Models\User::where('position', 'like', '%ผู้อำนวยการวิทยาลัย%')
        ->orWhere('position', 'like', '%ผู้อำนวยการ%')
        ->where('position', 'not like', '%รองผู้อำนวยการ%')
        ->first();
    $directorSetting = \App\Models\SystemSetting::where('key', 'director_name')->first();
    $directorName = $directorSetting ? cleanPersonName($directorSetting->value) : ($directorUser ? cleanPersonName($directorUser->name) : 'นายกเชษฐ์ กิ่งชนะ');

    // 5. Structure Activities & Loan Items Data
    $activitiesRaw = is_array($project->activities) ? $project->activities : json_decode($project->activities ?? '[]', true);
    $structuredActivities = [];
    $allLoanItems = [];

    $baseContractNum = $project->procurement?->procurement_number ?: ('กค.101/' . ($project->academic_year ?? '2569') . '-' . str_pad($project->id, 4, '0', STR_PAD_LEFT));

    if (is_array($activitiesRaw) && count($activitiesRaw) > 0) {
        foreach ($activitiesRaw as $actIdx => $act) {
            $actName = trim($act['name'] ?? ('กิจกรรมที่ ' . ($actIdx + 1)));
            $actItems = [];
            $actSum = 0;

            foreach ($act['loan_items'] ?? [] as $itIdx => $it) {
                if (!empty($it['description']) && trim($it['description']) !== '') {
                    $qty = floatval($it['quantity'] ?? 1);
                    $price = floatval($it['unit_price'] ?? 0);
                    $tot = $qty * $price;
                    $actSum += $tot;
                    
                    $formattedDesc = formatThaiLoanItemDesc($it['description'], $itIdx + 1);
                    
                    $itemObj = [
                        'description' => $formattedDesc,
                        'quantity' => $qty,
                        'unit' => $it['unit'] ?? 'รายการ',
                        'unit_price' => $price,
                        'total_price' => $tot,
                    ];
                    $actItems[] = $itemObj;
                }
            }

            if (count($actItems) > 0) {
                $structuredActivities[] = [
                    'index' => $actIdx + 1,
                    'name' => $actName,
                    'contract_no' => $baseContractNum . '/' . ($actIdx + 1),
                    'items' => $actItems,
                    'total_amount' => $actSum,
                    'baht_text' => convertToThaiBahtTextLoan($actSum),
                ];
            }
        }
    }

    // Build flattened all items with sequential Thai numbers
    if (!empty($structuredActivities)) {
        $flatIdx = 1;
        foreach ($structuredActivities as $act) {
            foreach ($act['items'] as $it) {
                $descWithoutNum = preg_replace('/^[๐-๙0-9]+\.\s*/u', '', $it['description']);
                $allLoanItems[] = array_merge($it, [
                    'description' => toThaiDigits($flatIdx) . '. ' . toThaiDigits($descWithoutNum),
                ]);
                $flatIdx++;
            }
        }
    }

    if (empty($allLoanItems) && $project->procurement && $project->procurement->items) {
        $filtered = $project->procurement->items->filter(function($i) {
            return preg_match('/ค่าตอบแทน|วิทยากร|ค่าอาหาร|อาหารกลางวัน|อาหารว่าง|เครื่องดื่ม|เดินทาง|พาหนะ|ยานพาหนะ|เบี้ยเลี้ยง|ที่พัก|สมนาคุณ|เงินยืม/u', $i->description);
        });
        $flatIdx = 1;
        foreach ($filtered as $i) {
            $qty = floatval($i->quantity ?? 1);
            $price = floatval($i->unit_price ?? 0);
            $tot = $qty * $price;
            $allLoanItems[] = [
                'description' => formatThaiLoanItemDesc($i->description, $flatIdx),
                'quantity' => $qty,
                'unit' => $i->unit ?? 'รายการ',
                'unit_price' => $price,
                'total_price' => $tot,
            ];
            $flatIdx++;
        }
    }

    if (empty($allLoanItems)) {
        $allLoanItems = [
            ['description' => '๑. ค่าตอบแทนวิทยากรบรรยายและฝึกปฏิบัติการ (๖ ชม. x ๖๐๐ บาท)', 'quantity' => 6, 'unit' => 'ชั่วโมง', 'unit_price' => 600, 'total_price' => 3600],
            ['description' => '๒. ค่าอาหารกลางวันสำหรับผู้เข้าร่วมโครงการ (๕๐ คน x ๘๐ บาท x ๑ มื้อ)', 'quantity' => 50, 'unit' => 'คน', 'unit_price' => 80, 'total_price' => 4000],
            ['description' => '๓. ค่าอาหารว่างและเครื่องดื่ม (๕๐ คน x ๓๕ บาท x ๒ มื้อ)', 'quantity' => 50, 'unit' => 'คน', 'unit_price' => 70, 'total_price' => 3500],
        ];
    }

    $allTotalSum = array_sum(array_column($allLoanItems, 'total_price'));
    if ($allTotalSum <= 0) {
        $allTotalSum = floatval($project->estimated_budget ?: 0);
    }
    $allBahtText = convertToThaiBahtTextLoan($allTotalSum);

    // Bundle full JSON dataset for seamless client-side activity filtering
    $clientPayload = [
        'all' => [
            'name' => 'ทุกกิจกรรมรวมกัน',
            'contract_no' => $baseContractNum,
            'purpose_text' => 'เพื่อเป็นค่าใช้จ่ายในการดำเนินงานโครงการ "' . $project->title . '" ประจำปีงบประมาณ พ.ศ. ' . toThaiDigits($project->academic_year ?? '2569') . ' ดังรายละเอียดต่อไปนี้',
            'items' => $allLoanItems,
            'total_amount' => $allTotalSum,
            'baht_text' => $allBahtText,
        ],
        'activities' => $structuredActivities,
    ];
@endphp

<body>
    <!-- Interactive Top Control Bar -->
    <div class="no-print" style="margin: 0 auto 20px auto; width: 210mm; background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 12px 18px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.04);">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <label for="activity-select" style="font-weight: bold; color: #1e293b; font-size: 14pt; display: flex; align-items: center; gap: 6px;">
                <span>🎯</span> เลือกกิจกรรมที่ต้องการขอยืมเงิน:
            </label>
            <select id="activity-select" onchange="switchActivity(this.value)" style="padding: 6px 14px; border-radius: 10px; border: 2px solid #0284c7; font-family: inherit; font-size: 14pt; font-weight: bold; color: #0369a1; background-color: #ffffff; cursor: pointer; outline: none; box-shadow: 0 2px 4px rgba(2,132,199,0.1);">
                <option value="all">ทุกกิจกรรมรวมกัน (ยอดรวมทั้งหมด {{ formatThaiMoney($allTotalSum) }} บาท)</option>
                @foreach($structuredActivities as $act)
                    <option value="{{ $act['index'] }}">
                        กิจกรรมที่ {{ toThaiDigits($act['index']) }}: {{ Str::limit($act['name'], 40) }} ({{ formatThaiMoney($act['total_amount']) }} บาท)
                    </option>
                @endforeach
            </select>
        </div>

        <button onclick="window.print()" style="padding: 8px 20px; background-color: #0284c7; color: #ffffff; border: none; border-radius: 10px; font-family: inherit; font-size: 14pt; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 8px rgba(2,132,199,0.25);">
            <span>🖨️</span> สั่งพิมพ์สัญญายืมเงิน
        </button>
    </div>

    <!-- Main Contract Paper (A4) -->
    <div class="a4-page">
        <div class="outer-contract-box">
            <!-- Top Title Box -->
            <table style="width: 100%; border-collapse: collapse; border: none; border-bottom: 1.5px solid black; font-size: 16pt; margin: 0;">
                <tr>
                    <td style="width: 70%; border-right: 1.5px solid black; padding: 6px 12px; vertical-align: middle; text-align: center;">
                        <div style="font-size: 19pt; font-weight: bold; margin-bottom: 4px;">สัญญายืมเงิน</div>
                        <div style="text-align: left; font-size: 15pt; white-space: nowrap; overflow: hidden;">
                            ยื่นต่อ...ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน..................................................
                        </div>
                    </td>
                    <td style="width: 30%; padding: 6px 12px; vertical-align: top;">
                        <div style="font-size: 15pt; margin-bottom: 2px; display: flex; align-items: baseline; gap: 4px;">
                            <span style="white-space: nowrap;">เลขที่</span>
                            <span class="underline-dotted" id="contract-no-display" style="flex-grow: 1; text-align: center; min-width: 50px; font-size: 14pt;">
                                {{ toThaiDigits($baseContractNum) }}
                            </span>
                        </div>
                        <div style="font-size: 15pt; line-height: 1.0; margin-top: 4px;">วันครบกำหนด</div>
                        <div class="underline-dotted" style="font-size: 14pt; margin-top: 4px; min-height: 20px; text-align: center; width: 100%;">
                            &nbsp;
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Paragraph 1 -->
            <div style="padding: 6px 12px 2px 12px; text-indent: 1.2cm; text-align: justify; font-size: 15pt; line-height: 1.25;">
                ข้าพเจ้า <span class="bold">{{ $cleanProposerName }}</span>
                ตำแหน่ง <span class="bold">{{ $displayProposerPos }}</span>
                สังกัด <span class="bold">{{ $deptName }}</span>
                จังหวัด <span class="bold">น่าน</span>
                มีความประสงค์ขอยืมเงินจาก <span class="bold">วิทยาลัยสารพัดช่างน่าน</span>
            </div>

            <div id="contract-purpose-display" style="padding: 0 12px 6px 12px; text-indent: 1.2cm; text-align: justify; line-height: 1.25; font-size: 15pt;">
                เพื่อเป็นค่าใช้จ่ายในการดำเนินงานโครงการ <span class="bold">"{{ $project->title }}"</span> ประจำปีงบประมาณ พ.ศ. {{ toThaiDigits($project->academic_year ?? '2569') }} ดังรายละเอียดต่อไปนี้
            </div>

            <!-- Details Table -->
            <table class="details-table">
                <tbody id="loan-items-tbody">
                    @foreach($allLoanItems as $item)
                        @php
                            $hasBracket = preg_match('/\([^\)]*[\d\sxบาทมื้อคนชมชั่วโมง].*\)/u', $item['description']);
                            $qtyText = (!$hasBracket && !empty($item['quantity']) && $item['quantity'] > 1 && !empty($item['unit_price'])) 
                                ? ' (' . toThaiDigits(number_format($item['quantity'], 0)) . ' ' . $item['unit'] . ' x ' . formatThaiMoney($item['unit_price']) . ' บาท)'
                                : '';
                        @endphp
                        <tr>
                            <td class="col-border-right">
                                {{ toThaiDigits($item['description']) }}{{ $qtyText }}
                            </td>
                            <td class="col-amount">
                                {{ formatThaiMoney($item['total_price']) }}
                            </td>
                        </tr>
                    @endforeach
                    <tr style="border-top: 1px solid #000;">
                        <td class="col-border-right text-right bold" style="padding-right: 15px;">รวมเป็นเงินทั้งสิ้น</td>
                        <td class="col-amount bold" id="table-total-display">
                            {{ formatThaiMoney($allTotalSum) }}
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Paragraph 2 -->
            <div style="padding: 6px 12px; text-indent: 1.2cm; text-align: justify; font-size: 15pt; line-height: 1.25;">
                ข้าพเจ้าสัญญาว่าจะปฏิบัติตามระเบียบของทางราชการทุกประการ และจะนำใบสำคัญคู่จ่ายที่ถูกต้อง พร้อมทั้งเงินเหลือจ่าย (ถ้ามี) ส่งใช้ภายในกำหนดไว้ในระเบียบการเบิกจ่ายจากคลัง คือ ภายใน <span class="bold">๓๐</span> วัน นับแต่วันที่ได้รับเงินนี้ หากข้าพเจ้าไม่ส่งตามกำหนด ข้าพเจ้ายินยอมให้หักเงินเดือน ค่าจ้าง เบี้ยหวัด บำนาญ หรือเงินอื่นใดที่ข้าพเจ้าพึงได้รับจากทางราชการชดใช้จำนวนเงินที่ยืมไปจนครบถ้วนได้ทันที
            </div>

            <!-- Signature of Borrower -->
            <div style="padding: 0 12px; margin-top: 4px; margin-bottom: 8px; font-size: 15pt; text-align: left; padding-left: 1.5cm;">
                ลายมือชื่อ ........................................................................... ผู้ยืม
                <span style="display: block; padding-left: 1.8cm; margin-top: 14px;">( {{ $cleanProposerName }} )</span>
            </div>

            <!-- Divider line -->
            <div class="divider-line"></div>

            <!-- Lower Section 1: Checked by Financial & Deputy -->
            <div style="font-size: 15pt; line-height: 1.3; padding: 4px 12px 6px 12px;">
                <div style="margin-bottom: 2px;">เสนอ......ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน</div>
                <div style="text-indent: 1.2cm; margin-bottom: 2px;">
                    ได้ตรวจสอบแล้ว เห็นสมควรอนุมัติให้ยืมเงินตามใบยืมฉบับนี้ได้ จำนวน <span class="underline-dotted" id="checked-amount-num">{{ formatThaiMoney($allTotalSum) }}</span> บาท
                </div>
                <div style="text-align: left; padding-left: 1.2cm; margin-bottom: 4px;">
                    ( <span class="underline-dotted" id="checked-amount-thai">{{ $allBahtText }}</span> )
                </div>
                
                <table style="width: 100%; border: none; font-size: 14pt; margin-top: 6px; border-collapse: collapse;">
                    <tr>
                        <td style="width: 50%; text-align: center; vertical-align: top; padding: 2px 0;">
                            <div>ลงชื่อ............................................</div>
                            <div style="margin-top: 14px;">( {{ $financeHeadName }} )</div>
                            <div style="margin-top: 2px; font-size: 13.5pt; color: #334155;">หัวหน้างานการเงิน</div>
                        </td>
                        <td style="width: 50%; text-align: center; vertical-align: top; padding: 2px 0;">
                            <div>ลงชื่อ............................................</div>
                            <div style="margin-top: 14px;">( {{ $deputyResName }} )</div>
                            <div style="margin-top: 2px; font-size: 13.5pt; color: #334155; line-height: 1.1;">รองผู้อำนวยการฝ่ายบริหารทรัพยากร</div>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Divider line -->
            <div class="divider-line"></div>

            <!-- Lower Section 2: Approved by Director -->
            <div style="font-size: 15pt; line-height: 1.3; padding: 4px 12px 6px 12px;">
                <div style="font-weight: bold; text-align: center; margin-bottom: 2px; font-size: 15pt;">คำอนุมัติ</div>
                <div style="text-indent: 1.2cm; margin-bottom: 2px;">
                    อนุมัติให้ยืมตามเงื่อนไขข้างต้นได้ เป็นเงิน <span class="underline-dotted" id="approved-amount-num">{{ formatThaiMoney($allTotalSum) }}</span> บาท ( <span class="underline-dotted" id="approved-amount-thai">{{ $allBahtText }}</span> )
                </div>
                
                <table style="width: 100%; border: none; font-size: 14pt; margin-top: 6px; border-collapse: collapse;">
                    <tr>
                        <td style="width: 45%;"></td>
                        <td style="width: 55%; text-align: center; vertical-align: top; padding: 2px 0;">
                            <div>ลงชื่อผู้อนุมัติ............................................</div>
                            <div style="margin-top: 15px; font-weight: bold;">( {{ $directorName }} )</div>
                            <div style="margin-top: 2px; font-size: 13.5pt; color: #334155;">ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน</div>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Divider line -->
            <div class="divider-line"></div>

            <!-- Lower Section 3: Receipt -->
            <div style="font-size: 15pt; line-height: 1.3; padding: 4px 12px 8px 12px;">
                <div style="font-weight: bold; text-align: center; margin-bottom: 2px; font-size: 15pt;">ใบรับเงิน</div>
                <div style="text-indent: 1.2cm; margin-bottom: 4px;">
                    ได้รับเงินยืมจำนวน <span class="underline-dotted" id="receipt-amount-num">{{ formatThaiMoney($allTotalSum) }}</span> บาท ( <span class="underline-dotted" id="receipt-amount-thai">{{ $allBahtText }}</span> ) ไปเป็นการถูกต้องแล้ว
                </div>
                
                <table style="width: 100%; border: none; margin-top: 8px; font-size: 14pt; border-collapse: collapse;">
                    <tr>
                        <td style="width: 50%; text-align: center; vertical-align: middle; padding: 4px 0;">
                            ลงชื่อ............................................ผู้รับเงิน
                        </td>
                        <td style="width: 50%; text-align: center; vertical-align: middle; padding: 4px 0;">
                            วันที่............................................
                        </td>
                    </tr>
                </table>
            </div>

        </div>
    </div>

    <!-- Client-Side Dynamic Activity Switcher Script -->
    <script>
        const loanData = @json($clientPayload);
        const projectTitle = @json($project->title);
        const fiscalYearThai = @json(toThaiDigits($project->academic_year ?? '2569'));

        function toThaiDigits(num) {
            const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
            return String(num).replace(/[0-9]/g, d => thaiDigits[d]);
        }

        function formatThaiMoney(num) {
            const formatted = parseFloat(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return toThaiDigits(formatted);
        }

        function cleanThaiItemDesc(desc, idx) {
            let clean = (desc || '').replace(/[💵📦💰📑📝🛒📄📊]/g, '').trim();
            // Remove leading dashes or bullets
            clean = clean.replace(/^[\-\–\—\•\*\s]+/g, '').trim();
            
            // Check if already has a number prefix like "1. ", "๑. ", "1) "
            const match = clean.match(/^([0-9]+|[๐-๙]+)[\.\)]\s*(.*)$/);
            if (match) {
                const thaiNum = toThaiDigits(match[1]);
                return thaiNum + '. ' + toThaiDigits(match[2]);
            }
            return toThaiDigits(idx) + '. ' + toThaiDigits(clean);
        }

        function switchActivity(val) {
            let activeDataset;
            let purposeHtml;

            if (val === 'all' || !val) {
                activeDataset = loanData.all;
                purposeHtml = `เพื่อเป็นค่าใช้จ่ายในการดำเนินงานโครงการ <span class="bold">"${projectTitle}"</span> ประจำปีงบประมาณ พ.ศ. ${fiscalYearThai} ดังรายละเอียดต่อไปนี้`;
            } else {
                const targetIdx = parseInt(val);
                const found = loanData.activities.find(a => a.index === targetIdx);
                if (found) {
                    activeDataset = found;
                    const actNameThai = toThaiDigits(found.name);
                    purposeHtml = `เพื่อเป็นค่าใช้จ่ายในการดำเนินงานโครงการ <span class="bold">"${projectTitle}"</span> (<span class="bold">กิจกรรมที่ ${toThaiDigits(found.index)}: ${actNameThai}</span>) ประจำปีงบประมาณ พ.ศ. ${fiscalYearThai} ดังรายละเอียดต่อไปนี้`;
                } else {
                    activeDataset = loanData.all;
                    purposeHtml = `เพื่อเป็นค่าใช้จ่ายในการดำเนินงานโครงการ <span class="bold">"${projectTitle}"</span> ประจำปีงบประมาณ พ.ศ. ${fiscalYearThai} ดังรายละเอียดต่อไปนี้`;
                }
            }

            // 1. Update Contract Number (with Thai digits)
            document.getElementById('contract-no-display').innerText = toThaiDigits(activeDataset.contract_no);

            // 2. Update Purpose Line
            document.getElementById('contract-purpose-display').innerHTML = purposeHtml;

            // 3. Render Table Rows
            const tbody = document.getElementById('loan-items-tbody');
            let rowsHtml = '';
            activeDataset.items.forEach((it, idx) => {
                const formattedDesc = cleanThaiItemDesc(it.description, idx + 1);
                const hasBracket = /\([^\)]*[\d\sxบาทมื้อคนชมชั่วโมง].*\)/.test(formattedDesc);
                const qtyText = (!hasBracket && it.quantity && it.quantity > 1 && it.unit_price) 
                    ? ` (${toThaiDigits(parseFloat(it.quantity).toLocaleString())} ${it.unit || 'รายการ'} x ${formatThaiMoney(it.unit_price)} บาท)` 
                    : '';
                rowsHtml += `
                    <tr>
                        <td class="col-border-right">
                            ${formattedDesc}${qtyText}
                        </td>
                        <td class="col-amount">
                            ${formatThaiMoney(it.total_price)}
                        </td>
                    </tr>
                `;
            });

            // Total row
            rowsHtml += `
                <tr style="border-top: 1px solid #000;">
                    <td class="col-border-right text-right bold" style="padding-right: 15px;">รวมเป็นเงินทั้งสิ้น</td>
                    <td class="col-amount bold" id="table-total-display">
                        ${formatThaiMoney(activeDataset.total_amount || activeDataset.total_price || 0)}
                    </td>
                </tr>
            `;
            tbody.innerHTML = rowsHtml;

            // 4. Update Lower Sections (Numbers & Thai Baht Text - Normal Weight Font & Thai Digits)
            const amtStr = formatThaiMoney(activeDataset.total_amount || activeDataset.total_price || 0);
            const bahtStr = activeDataset.baht_text;

            document.getElementById('checked-amount-num').innerText = amtStr;
            document.getElementById('checked-amount-thai').innerText = bahtStr;

            document.getElementById('approved-amount-num').innerText = amtStr;
            document.getElementById('approved-amount-thai').innerText = bahtStr;

            document.getElementById('receipt-amount-num').innerText = amtStr;
            document.getElementById('receipt-amount-thai').innerText = bahtStr;
        }
    </script>
</body>
</html>
