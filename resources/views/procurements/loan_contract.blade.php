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
            line-height: 1.2;
            color: #000000;
            margin: 0;
            padding: 20px 0;
        }
        .a4-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto 25px auto;
            padding: 8mm 12mm 8mm 15mm;
            box-sizing: border-box;
            background: #ffffff;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
        }
        .outer-contract-box {
            border: 1.5px solid #000;
            min-height: 275mm;
            box-sizing: border-box;
            overflow: hidden;
            padding-bottom: 6px;
        }
        .bold { font-weight: bold; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .underline-dotted {
            border-bottom: 1px dotted #000;
            padding: 0 4px;
            display: inline-block;
        }

        table.details-table {
            width: 100%;
            border-collapse: collapse;
            border: none;
            border-top: 1.5px solid #000;
            border-bottom: 1.5px solid #000;
            font-size: 15pt;
            margin: 0;
        }
        table.details-table td {
            border: none;
            padding: 3px 10px;
            vertical-align: top;
        }
        table.details-table td.col-border-right {
            border-right: 1.5px solid #000;
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
                min-height: 280mm !important;
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

    // 5. Loan Items Extraction
    $loanItems = collect();
    $activities = is_array($project->activities) ? $project->activities : json_decode($project->activities ?? '[]', true);
    if (is_array($activities) && count($activities) > 0) {
        foreach ($activities as $actIdx => $act) {
            $actName = trim($act['name'] ?? ('กิจกรรมที่ ' . ($actIdx + 1)));
            foreach ($act['loan_items'] ?? [] as $it) {
                if (!empty($it['description']) && trim($it['description']) !== '') {
                    $qty = floatval($it['quantity'] ?? 1);
                    $price = floatval($it['unit_price'] ?? 0);
                    $loanItems->push((object)[
                        'description' => trim($it['description']),
                        'activity' => $actName,
                        'quantity' => $qty,
                        'unit' => $it['unit'] ?? 'รายการ',
                        'unit_price' => $price,
                        'total_price' => $qty * $price,
                    ]);
                }
            }
        }
    }

    if ($loanItems->isEmpty() && $project->procurement && $project->procurement->items) {
        $loanItems = $project->procurement->items->filter(function($i) {
            return preg_match('/ค่าตอบแทน|วิทยากร|ค่าอาหาร|อาหารกลางวัน|อาหารว่าง|เครื่องดื่ม|เดินทาง|พาหนะ|ยานพาหนะ|เบี้ยเลี้ยง|ที่พัก|สมนาคุณ|เงินยืม/u', $i->description);
        })->map(function($i) {
            $qty = floatval($i->quantity ?? 1);
            $price = floatval($i->unit_price ?? 0);
            return (object)[
                'description' => trim(preg_replace('/[💵📦💰📑📝🛒📄📊]/u', '', $i->description)),
                'quantity' => $qty,
                'unit' => $i->unit ?? 'รายการ',
                'unit_price' => $price,
                'total_price' => $qty * $price,
            ];
        });
    }

    if ($loanItems->isEmpty()) {
        $loanItems = collect([
            (object)['description' => 'ค่าตอบแทนวิทยากรบรรยายและฝึกอบรม', 'total_price' => floatval($project->estimated_budget) * 0.3],
            (object)['description' => 'ค่าอาหารกลางวันและเครื่องดื่มสำหรับผู้เข้าร่วมโครงการ', 'total_price' => floatval($project->estimated_budget) * 0.4],
            (object)['description' => 'ค่าอาหารว่างและเครื่องดื่ม', 'total_price' => floatval($project->estimated_budget) * 0.3],
        ]);
    }

    $totalLoanAmount = $loanItems->sum('total_price');
    if ($totalLoanAmount <= 0) {
        $totalLoanAmount = floatval($project->estimated_budget ?: 0);
    }
    $totalLoanBahtText = convertToThaiBahtTextLoan($totalLoanAmount);

    $contractNumber = $project->procurement?->procurement_number ?: ('กค.101/' . ($project->academic_year ?? '2569') . '-' . str_pad($project->id, 4, '0', STR_PAD_LEFT));
@endphp

<body>
    <!-- Interactive Top Control Bar -->
    <div class="no-print" style="margin: 0 auto 20px auto; width: 210mm; background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 12px 18px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.04);">
        <div style="font-size: 14pt; font-weight: bold; color: #1e293b; display: flex; align-items: center; gap: 8px;">
            <span>💵</span> สัญญายืมเงินทดรองราชการ (แบบ กค. ๑๐๑)
        </div>

        <button onclick="window.print()" style="padding: 8px 20px; background-color: #0284c7; color: #ffffff; border: none; border-radius: 10px; font-family: inherit; font-size: 14pt; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 8px rgba(2,132,199,0.25);">
            <span>🖨️</span> สั่งพิมพ์สัญญายืมเงิน (PDF)
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
                            <span class="underline-dotted" style="flex-grow: 1; text-align: center; min-width: 50px; font-size: 14pt;">
                                {{ $contractNumber }}
                            </span>
                        </div>
                        <div style="font-size: 15pt; line-height: 1.0;">วันครบกำหนด</div>
                        <div class="underline-dotted" style="font-size: 14pt; margin-top: 2px; min-height: 20px; text-align: center; width: 100%;">
                            30 วันนับแต่วันรับเงิน
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

            <div style="padding: 0 12px 6px 12px; text-indent: 1.2cm; text-align: justify; line-height: 1.25; font-size: 15pt;">
                เพื่อเป็นค่าใช้จ่ายในการดำเนินงานโครงการ <span class="bold">"{{ $project->title }}"</span> ประจำปีงบประมาณ พ.ศ. {{ $project->academic_year ?? '2569' }} ดังรายละเอียดต่อไปนี้
            </div>

            <!-- Details Table -->
            <table class="details-table">
                <tbody>
                    @foreach($loanItems as $item)
                        @php
                            $cleanDesc = preg_replace('/[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', '', $item->description);
                            $cleanDesc = trim(str_replace(['💵', '📦', '💰', '📑', '📝', '🛒', '📄', '📊'], '', $cleanDesc));
                        @endphp
                        <tr>
                            <td class="col-border-right">
                                - {{ $cleanDesc }}
                                @if(!empty($item->quantity) && $item->quantity > 1)
                                    ({{ number_format($item->quantity, 0) }} {{ $item->unit }} x {{ number_format($item->unit_price, 2) }} บาท)
                                @endif
                            </td>
                            <td style="text-align: right; width: 28%; white-space: nowrap; font-family: monospace; font-weight: bold;">
                                {{ number_format($item->total_price, 2) }}
                            </td>
                        </tr>
                    @endforeach
                    <tr style="font-weight: bold; border-top: 1px solid #000;">
                        <td class="col-border-right text-right" style="padding-right: 15px;">รวมเป็นเงินทั้งสิ้น</td>
                        <td style="text-align: right; font-family: monospace; font-size: 15pt;">
                            {{ number_format($totalLoanAmount, 2) }}
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Paragraph 2 -->
            <div style="padding: 6px 12px; text-indent: 1.2cm; text-align: justify; font-size: 15pt; line-height: 1.25;">
                ข้าพเจ้าสัญญาว่าจะปฏิบัติตามระเบียบของทางราชการทุกประการ และจะนำใบสำคัญคู่จ่ายที่ถูกต้อง พร้อมทั้งเงินเหลือจ่าย (ถ้ามี) ส่งใช้ภายในกำหนดไว้ในระเบียบการเบิกจ่ายจากคลัง คือ ภายใน <span class="bold">30</span> วัน นับแต่วันที่ได้รับเงินนี้ หากข้าพเจ้าไม่ส่งตามกำหนด ข้าพเจ้ายินยอมให้หักเงินเดือน ค่าจ้าง เบี้ยหวัด บำนาญ หรือเงินอื่นใดที่ข้าพเจ้าพึงได้รับจากทางราชการชดใช้จำนวนเงินที่ยืมไปจนครบถ้วนได้ทันที
            </div>

            <!-- Signature of Borrower -->
            <div style="padding: 0 12px; margin-top: 2px; margin-bottom: 6px; font-size: 15pt; text-align: left; padding-left: 1.5cm;">
                ลายมือชื่อ ........................................................................... ผู้ยืม
                <span style="display: block; padding-left: 1.8cm; margin-top: 2px;">( {{ $cleanProposerName }} )</span>
            </div>

            <!-- Divider line -->
            <div class="divider-line"></div>

            <!-- Lower Section 1: Checked by Financial & Deputy -->
            <div style="font-size: 15pt; line-height: 1.2; padding: 4px 12px;">
                <div style="margin-bottom: 2px;">เสนอ......ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน</div>
                <div style="text-indent: 1.2cm; margin-bottom: 2px;">
                    ได้ตรวจสอบแล้ว เห็นสมควรอนุมัติให้ยืมเงินตามใบยืมฉบับนี้ได้ จำนวน <span class="underline-dotted bold">{{ number_format($totalLoanAmount, 2) }}</span> บาท
                    ( <span class="underline-dotted bold">{{ $totalLoanBahtText }}</span> )
                </div>
                
                <table style="width: 100%; border: none; font-size: 14pt; margin-top: 4px; border-collapse: collapse;">
                    <tr>
                        <td style="width: 50%; text-align: center; vertical-align: top; padding: 2px 0;">
                            <div>ลงชื่อ............................................</div>
                            <div style="margin-top: 2px;">( {{ $financeHeadName }} )</div>
                            <div style="margin-top: 1px; font-size: 13.5pt; color: #334155;">หัวหน้างานการเงิน</div>
                        </td>
                        <td style="width: 50%; text-align: center; vertical-align: top; padding: 2px 0;">
                            <div>ลงชื่อ............................................</div>
                            <div style="margin-top: 2px;">( {{ $deputyResName }} )</div>
                            <div style="margin-top: 1px; font-size: 13.5pt; color: #334155; line-height: 1.1;">รองผู้อำนวยการฝ่ายบริหารทรัพยากร</div>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Divider line -->
            <div class="divider-line"></div>

            <!-- Lower Section 2: Approved by Director -->
            <div style="font-size: 15pt; line-height: 1.2; padding: 4px 12px;">
                <div style="font-weight: bold; text-align: center; margin-bottom: 2px; font-size: 15pt;">คำอนุมัติ</div>
                <div style="text-indent: 1.2cm; margin-bottom: 2px;">
                    อนุมัติให้ยืมตามเงื่อนไขข้างต้นได้ เป็นเงิน <span class="underline-dotted bold">{{ number_format($totalLoanAmount, 2) }}</span> บาท (<span class="bold">{{ $totalLoanBahtText }}</span>)
                </div>
                
                <table style="width: 100%; border: none; font-size: 14pt; margin-top: 4px; border-collapse: collapse;">
                    <tr>
                        <td style="width: 45%;"></td>
                        <td style="width: 55%; text-align: center; vertical-align: top; padding: 2px 0;">
                            <div>ลงชื่อผู้อนุมัติ............................................</div>
                            <div style="margin-top: 2px; font-weight: bold;">( {{ $directorName }} )</div>
                            <div style="margin-top: 1px; font-size: 13.5pt; color: #334155;">ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน</div>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Divider line -->
            <div class="divider-line"></div>

            <!-- Lower Section 3: Receipt -->
            <div style="font-size: 15pt; line-height: 1.2; padding: 4px 12px 4px 12px;">
                <div style="font-weight: bold; text-align: center; margin-bottom: 2px; font-size: 15pt;">ใบรับเงิน</div>
                <div style="text-indent: 1.2cm; margin-bottom: 4px;">
                    ได้รับเงินยืมจำนวน <span class="underline-dotted bold">{{ number_format($totalLoanAmount, 2) }}</span> บาท
                    ( <span class="underline-dotted bold">{{ $totalLoanBahtText }}</span> ) ไปเป็นการถูกต้องแล้ว
                </div>
                
                <table style="width: 100%; border: none; margin-top: 4px; font-size: 14pt; border-collapse: collapse;">
                    <tr>
                        <td style="width: 50%; text-align: center; vertical-align: middle; padding: 2px 0;">
                            ลงชื่อ............................................ผู้รับเงิน
                        </td>
                        <td style="width: 50%; text-align: center; vertical-align: middle; padding: 2px 0;">
                            วันที่............................................
                        </td>
                    </tr>
                </table>
            </div>

        </div>
    </div>
</body>
</html>
