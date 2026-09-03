<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ใบสั่งซื้อ/สั่งจ้าง - {{ $project->title }}</title>
    <style>
        body {
            font-family: "TH Sarabun PSK", "Angsana New", sans-serif;
            font-size: 14pt;
            line-height: 1.25;
            color: #000;
            padding: 0.4in 0.6in;
            max-width: 7.5in;
            margin: auto;
        }
        .header {
            text-align: center;
            position: relative;
            margin-bottom: 15px;
        }
        .garuda {
            width: 60px;
            height: auto;
            margin: 0 auto 5px auto;
            display: block;
        }
        .title {
            text-align: center;
            font-weight: bold;
            font-size: 18pt;
            margin-bottom: 2px;
        }
        .subtitle {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
        }
        table.info-table {
            width: 100%;
            margin-top: 10px;
            border-collapse: collapse;
        }
        table.info-table td {
            padding: 2px 0;
            font-size: 13.5pt;
            vertical-align: top;
        }
        table.item-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        table.item-table th, table.item-table td {
            border: 1px solid #000;
            padding: 4px 6px;
            font-size: 13pt;
        }
        table.item-table th {
            text-align: center;
            font-weight: bold;
            background-color: #f8fafc;
        }
        .text-center {
            text-align: center;
        }
        .text-right {
            text-align: right;
        }
        .text-bold {
            font-weight: bold;
        }
        .conditions {
            margin-top: 12px;
            font-size: 13pt;
            line-height: 1.3;
        }
        .sig-section {
            margin-top: 25px;
            width: 100%;
            page-break-inside: avoid;
        }
        .sig-box {
            display: inline-block;
            width: 48%;
            text-align: center;
            font-size: 13pt;
            vertical-align: top;
        }
        @media print {
            body {
                padding: 0;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 15px; text-align: right;">
        <button onclick="window.print()" style="padding: 8px 16px; background-color: #7c3aed; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">🖨️ พิมพ์ใบสั่งซื้อ/สั่งจ้าง</button>
    </div>

    @php
        function thaiNumberPo($number) {
            $thainum = ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'];
            return str_replace(range(0, 9), $thainum, $number);
        }

        function convertToThaiBahtTextPo($number) {
            if (!$number || $number == 0) return 'ศูนย์บาทถ้วน';
            $number = number_format($number, 2, '.', '');
            $num_arr = explode('.', $number);
            $baht = $num_arr[0];
            $satang = $num_arr[1];

            $thai_num = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
            $thai_unit = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

            $baht_text = '';
            $len = strlen($baht);
            for ($i = 0; $i < $len; $i++) {
                $digit = substr($baht, $i, 1);
                $pos = $len - $i - 1;
                if ($digit != 0) {
                    if ($pos == 0 && $digit == 1 && $len > 1) {
                        $baht_text .= 'เอ็ด';
                    } elseif ($pos == 1 && $digit == 2) {
                        $baht_text .= 'ยี่สิบ';
                    } elseif ($pos == 1 && $digit == 1) {
                        $baht_text .= 'สิบ';
                    } else {
                        $baht_text .= $thai_num[$digit] . $thai_unit[$pos % 6];
                    }
                }
                if ($pos % 6 == 0 && $pos > 0) {
                    $baht_text .= 'ล้าน';
                }
            }

            if ($baht_text == '') $baht_text = 'ศูนย์';
            $baht_text .= 'บาท';

            if ($satang == '00') {
                $baht_text .= 'ถ้วน';
            } else {
                $len = strlen($satang);
                for ($i = 0; $i < $len; $i++) {
                    $digit = substr($satang, $i, 1);
                    $pos = $len - $i - 1;
                    if ($digit != 0) {
                        if ($pos == 0 && $digit == 1 && $len > 1) {
                            $baht_text .= 'เอ็ด';
                        } elseif ($pos == 1 && $digit == 2) {
                            $baht_text .= 'ยี่สิบ';
                        } elseif ($pos == 1 && $digit == 1) {
                            $baht_text .= 'สิบ';
                        } else {
                            $baht_text .= $thai_num[$digit] . $thai_unit[$pos];
                        }
                    }
                }
                $baht_text .= 'สตางค์';
            }

            return $baht_text;
        }

        $totalSum = $items->sum('total_price');
        $thaiYear = date('Y') + 543;
        $thaiMonthNames = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
        $currentDateThai = date('j') . ' ' . $thaiMonthNames[date('n')-1] . ' ' . $thaiYear;
    @endphp

    <div class="header">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Garuda_Emblem_of_Thailand.svg/200px-Garuda_Emblem_of_Thailand.svg.png" class="garuda" alt="ตราครุฑ">
        <div class="title">ใบสั่งซื้อ / สั่งจ้าง</div>
        <div class="subtitle">วิทยาลัยสารพัดช่างน่าน สำนักงานคณะกรรมการการอาชีวศึกษา</div>
    </div>

    <table class="info-table">
        <tr>
            <td style="width: 55%;">
                <strong>ผู้ขาย / ผู้รับจ้าง:</strong> {{ $vendorName ?: '..................................................................' }}
            </td>
            <td style="width: 45%; text-align: right;">
                <strong>ใบสั่งซื้อ/สั่งจ้างเลขที่:</strong> {{ $poNumber ?: ($procurement->procurement_number ? 'สช.น. ' . thaiNumberPo($procurement->procurement_number) : 'สช.น. ' . thaiNumberPo($project->id) . '/' . thaiNumberPo($thaiYear)) }}
            </td>
        </tr>
        <tr>
            <td>
                <strong>ที่อยู่:</strong> {{ $vendorAddress ?: '..................................................................' }}
            </td>
            <td style="text-align: right;">
                <strong>วันที่:</strong> {{ $poDate ? thaiNumberPo($poDate) : thaiNumberPo($currentDateThai) }}
            </td>
        </tr>
        <tr>
            <td>
                <strong>เลขประจำตัวผู้เสียภาษี:</strong> {{ $vendorTaxId ?: '........................................................' }}
            </td>
            <td style="text-align: right;">
                <strong>โทรศัพท์:</strong> {{ $vendorPhone ?: '........................................' }}
            </td>
        </tr>
        <tr>
            <td colspan="2" style="padding-top: 4px;">
                ตามที่ท่านได้เสนอราคาและยินยอมตกลงส่งมอบพัสดุสำหรับ <strong>{{ $project->title }}</strong> วิทยาลัยสารพัดช่างน่าน จึงขอสั่งซื้อ/สั่งจ้างพัสดุดังรายการต่อไปนี้:
            </td>
        </tr>
    </table>

    <table class="item-table">
        <thead>
            <tr>
                <th style="width: 8%;">ลำดับ</th>
                <th style="width: 48%;">รายการพัสดุ / รายละเอียด</th>
                <th style="width: 12%;">จำนวน</th>
                <th style="width: 10%;">หน่วยนับ</th>
                <th style="width: 11%;">ราคา/หน่วย</th>
                <th style="width: 11%;">รวมเป็นเงิน</th>
            </tr>
        </thead>
        <tbody>
            @forelse($items as $index => $item)
                <tr>
                    <td class="text-center">{{ thaiNumberPo($index + 1) }}</td>
                    <td>{{ $item->description }}</td>
                    <td class="text-center">{{ thaiNumberPo(number_format($item->quantity, 0)) }}</td>
                    <td class="text-center">{{ $item->unit }}</td>
                    <td class="text-right">{{ thaiNumberPo(number_format($item->unit_price, 2)) }}</td>
                    <td class="text-right">{{ thaiNumberPo(number_format($item->total_price, 2)) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="text-center">ไม่พบรายการพัสดุ</td>
                </tr>
            @endforelse
            <tr style="background-color: #faf5ff;">
                <td colspan="5" class="text-bold text-center">
                    ( {{ convertToThaiBahtTextPo($totalSum) }} )
                </td>
                <td class="text-right text-bold" style="font-size: 13.5pt;">
                    {{ thaiNumberPo(number_format($totalSum, 2)) }}
                </td>
            </tr>
        </tbody>
    </table>

    <div class="conditions">
        <strong>ข้อกำหนดและเงื่อนไขการส่งมอบ:</strong><br>
        ๑. ผู้ขาย/ผู้รับจ้าง ตกลงจะส่งมอบพัสดุตามรายการข้างต้นให้ถูกต้องครบถ้วนภายใน <strong>{{ thaiNumberPo($deliveryDays) }}</strong> วัน นับถัดจากวันที่ได้รับใบสั่งซื้อนี้ ณ งานพัสดุ วิทยาลัยสารพัดช่างน่าน<br>
        ๒. หากพ้นกำหนดส่งมอบ ผู้ขายยินยอมให้ปรับเป็นรายวันในอัตราร้อยละ ๐.๒๐ ของมูลค่าพัสดุที่ยังไม่ได้รับมอบ นับแต่วันที่ล่วงเลยกำหนดจนถึงวันที่ส่งมอบถูกต้องครบถ้วน<br>
        ๓. การสั่งซื้อ/สั่งจ้างจะสมบูรณ์เมื่อคณะกรรมการตรวจรับพัสดุได้ดำเนินการตรวจรับของถูกต้องเรียบร้อยแล้ว
    </div>

    <div class="sig-section">
        <div class="sig-box">
            ลงชื่อ............................................................ผู้รับใบสั่งซื้อ<br>
            ( {{ $vendorName ?: '..........................................................' }} )<br>
            ผู้ขาย / ผู้รับมอบอำนาจ<br>
            วันที่........เดือน...................พ.ศ. {{ thaiNumberPo($thaiYear) }}
        </div>
        <div class="sig-box">
            ลงชื่อ............................................................ผู้สั่งซื้อ/สั่งจ้าง<br>
            ( นายณัฐพงษ์ ยางสุวรรณ )<br>
            ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน<br>
            วันที่........เดือน...................พ.ศ. {{ thaiNumberPo($thaiYear) }}
        </div>
    </div>
</body>
</html>
