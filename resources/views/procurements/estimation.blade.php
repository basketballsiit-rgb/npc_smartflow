<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ประมาณการรายละเอียดพัสดุที่จะซื้อหรืองานที่จะจ้าง - {{ $project->title }}</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: "TH Sarabun PSK", "Angsana New", sans-serif;
            font-size: 14pt;
            line-height: 1.25;
            color: #000;
            padding: 0.3in 0.5in;
            max-width: 7.4in;
            margin: auto;
        }
        .header-title-1 {
            text-align: center;
            font-weight: bold;
            font-size: 18pt;
            line-height: 1.2;
        }
        .header-title-2 {
            text-align: center;
            font-size: 15pt;
            line-height: 1.3;
            margin-bottom: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }
        th, td {
            border: 1px solid #000;
            padding: 4px 6px;
            font-size: 13pt;
        }
        th {
            font-weight: bold;
            text-align: center;
            background-color: #fdfdfd;
        }
        .text-center {
            text-align: center;
        }
        .text-left {
            text-align: left;
        }
        .text-right {
            text-align: right;
        }
        .sig-container {
            margin-top: 35px;
            margin-left: auto;
            width: 3.4in;
            text-align: center;
            page-break-inside: avoid;
        }
        @media print {
            body { 
                padding: 0 !important; 
                margin: 0 !important;
                max-width: 100% !important;
                font-size: 13.5pt !important;
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
                margin: 1.0cm 1.5cm 1.0cm 1.8cm;
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

    if (!function_exists('convertToThaiBahtTextEst')) {
        function convertToThaiBahtTextEst($number) {
            $number = floatval($number);
            if ($number == 0) return 'ศูนย์บาทถ้วน';
            
            $baht = floor($number);
            $satang = round(($number - $baht) * 100);
            
            $thaiDigits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
            $thaiUnits = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
            
            $bahtText = '';
            $bahtStr = strval($baht);
            $len = strlen($bahtStr);
            
            for ($i = 0; $i < $len; $i++) {
                $digit = intval($bahtStr[$i]);
                $unitPos = $len - $i - 1;
                
                if ($digit !== 0) {
                    if ($unitPos % 6 === 0 && $unitPos > 0) {
                        $bahtText .= ($digit === 1 && $i > 0) ? 'เอ็ด' : $thaiDigits[$digit];
                        $bahtText .= 'ล้าน';
                    } elseif ($unitPos % 6 === 1) {
                        if ($digit === 1) {
                            $bahtText .= '';
                        } elseif ($digit === 2) {
                            $bahtText .= 'ยี่';
                        } else {
                            $bahtText .= $thaiDigits[$digit];
                        }
                        $bahtText .= 'สิบ';
                    } elseif ($unitPos % 6 === 0) {
                        if ($digit === 1 && $len > 1 && $i === $len - 1 && intval($bahtStr[$i-1]) > 0) {
                            $bahtText .= 'เอ็ด';
                        } else {
                            $bahtText .= $thaiDigits[$digit];
                        }
                    } else {
                        $bahtText .= $thaiDigits[$digit] . $thaiUnits[$unitPos % 6];
                    }
                }
            }
            
            $bahtText .= 'บาท';
            
            if ($satang === 0 || $satang === 0.0) {
                $bahtText .= 'ถ้วน';
            } else {
                $satangStr = str_pad(strval($satang), 2, '0', STR_PAD_LEFT);
                $d1 = intval($satangStr[0]);
                $d2 = intval($satangStr[1]);
                
                if ($d1 === 1) $bahtText .= 'สิบ';
                elseif ($d1 === 2) $bahtText .= 'ยี่สิบ';
                elseif ($d1 > 2) $bahtText .= $thaiDigits[$d1] . 'สิบ';
                
                if ($d2 === 1 && $d1 > 0) $bahtText .= 'เอ็ด';
                elseif ($d2 > 0) $bahtText .= $thaiDigits[$d2];
                
                $bahtText .= 'สตางค์';
            }
            
            return $bahtText;
        }
    }

    $rawProposerName = $project->responsible_person ?: ($project->user ? $project->user->name : '..........................................................');
    $cleanProposerName = cleanPersonName($rawProposerName);

    $totalProcSum = $items->sum('total_price') ?: $items->reduce(function($carry, $i) {
        return $carry + (floatval($i->quantity) * floatval($i->unit_price));
    }, 0);
    $finalAmount = $totalProcSum > 0 ? $totalProcSum : ($project->estimated_budget ?: 0);
    $bahtText = convertToThaiBahtTextEst($finalAmount);
@endphp
<body>
    <!-- Top Interactive Control Bar (Hidden when printing) -->
    <div class="no-print" style="margin-bottom: 16px; background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.04);">
        <div style="font-weight: bold; color: #1e293b; font-size: 13pt;">
            📊 ประมาณการรายละเอียดพัสดุที่จะซื้อหรืองานที่จะจ้าง
        </div>
        <div>
            <button onclick="window.print()" style="padding: 5px 16px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; border: none; border-radius: 8px; font-family: inherit; font-size: 13pt; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(124,58,237,0.25);">
                🖨️ สั่งพิมพ์เอกสาร / PDF
            </button>
        </div>
    </div>

    <!-- Header matching Image 2 -->
    <div class="header-title-1">วิทยาลัยสารพัดช่างน่าน</div>
    <div class="header-title-2">ประมาณการรายละเอียดพัสดุที่จะซื้อหรืองานที่จะจ้างเพิ่มเติม ดังนี้</div>

    <!-- Table matching Image 2 & Image 3 -->
    <table>
        <thead>
            <tr>
                <th style="width: 7%;">ที่</th>
                <th>รายการ</th>
                <th colspan="2" style="width: 18%;">จำนวน</th>
                <th style="width: 17%;">ราคาต่อหน่วย</th>
                <th style="width: 20%;">จำนวนเงิน</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $index => $item)
            @php
                $cleanDesc = preg_replace('/[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', '', $item->description);
                $cleanDesc = trim(str_replace(['💵', '📦', '💰', '📑', '📝', '🛒', '📄', '📊'], '', $cleanDesc));
                
                $qtyVal = (float)$item->quantity;
                $formattedQty = ($qtyVal == (int)$qtyVal) ? number_format($qtyVal, 0) : number_format($qtyVal, 2);
                
                $unitPriceVal = (float)$item->unit_price;
                $formattedUnitPrice = ($unitPriceVal == (int)$unitPriceVal) ? number_format($unitPriceVal, 0) . '  .-' : number_format($unitPriceVal, 2);

                $totalPriceVal = (float)$item->total_price ?: ($qtyVal * $unitPriceVal);
                $formattedTotalPrice = ($totalPriceVal == (int)$totalPriceVal) ? number_format($totalPriceVal, 0) . '  .-' : number_format($totalPriceVal, 2);
            @endphp
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td class="text-left">{{ $cleanDesc }}</td>
                <td class="text-right" style="width: 8%; border-right: none;">{{ $formattedQty }}</td>
                <td class="text-center" style="width: 10%; border-left: none;">{{ $item->unit }}</td>
                <td class="text-right">{{ $formattedUnitPrice }}</td>
                <td class="text-right" style="font-weight: bold;">{{ $formattedTotalPrice }}</td>
            </tr>
            @endforeach

            <!-- Summary Row matching Image 3 -->
            <tr>
                <td colspan="2" class="text-center" style="font-weight: bold; font-size: 13.5pt;">
                    ({{ $bahtText }})
                </td>
                <td colspan="3" class="text-right" style="font-weight: bold; font-size: 13.5pt;">
                    รวมเป็นเงินทั้งสิ้น
                </td>
                <td class="text-right" style="font-weight: bold; font-size: 14pt;">
                    {{ number_format($finalAmount, 2) }}
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Footer Signature of Proposer matching Image 3 -->
    <div class="sig-container">
        <div>ลงชื่อ ....................................................................... ผู้ประมาณการ</div>
        <div style="margin-top: 4px;">( <span contenteditable="true" style="outline: none;">{{ $cleanProposerName }}</span> )</div>
        <div style="font-size: 12.5pt; margin-top: 2px;">............../............../..............</div>
    </div>
</body>
</html>
