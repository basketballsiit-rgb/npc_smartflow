<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ขอบเขตและรายละเอียดคุณลักษณะเฉพาะ (TOR) - {{ $project->title }}</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            background-color: #f1f5f9;
            font-family: "TH Sarabun PSK", "THSarabunPSK", "Angsana New", sans-serif;
            font-size: 16pt;
            line-height: 1.25;
            color: #000;
            margin: 0;
            padding: 20px 0;
        }
        .page-container {
            width: 210mm;
            min-height: 297mm;
            padding: 2.0cm 2.0cm 2.0cm 2.5cm;
            margin: 0 auto 25px auto;
            background: #ffffff;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
            box-sizing: border-box;
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
            page-break-inside: auto;
        }
        .section-heading {
            font-weight: bold;
            margin-bottom: 4px;
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

        /* ตารางรายละเอียดคุณลักษณะเฉพาะของพัสดุตามภาพที่ 1 */
        .tor-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0 12px 0;
        }
        .tor-table th, .tor-table td {
            border: 1px solid #000;
            padding: 5px 8px;
            font-size: 14pt;
            line-height: 1.25;
            vertical-align: top;
        }
        .tor-table th {
            font-weight: bold;
            text-align: center;
            background-color: #fdfdfd;
        }

        .signatures-container {
            margin-top: 30px;
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

        @media print {
            body {
                background-color: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            .page-container {
                width: 100% !important;
                min-height: auto !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
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
                margin: 2.0cm 2.0cm 2.0cm 2.5cm;
            }
            .tor-table {
                page-break-inside: auto;
            }
            .tor-table tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            .tor-table thead {
                display: table-header-group;
            }
            .signature-row {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
@php
    if (!function_exists('cleanItemDescription')) {
        function cleanItemDescription($desc) {
            if (!$desc) return '';
            $cleaned = preg_replace('/[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', '', $desc);
            $cleaned = str_replace(['💵', '📦', '💰', '📑', '📝', '🛒', '📄', '📊', '🎯', '📍', '🏷️'], '', $cleaned);
            // เอาคำว่า [กิจกรรมที่ 1], (กิจกรรมที่ 1), หรือ กิจกรรมที่ ... ออกจากหน้ารายการ
            $cleaned = preg_replace('/^\[\s*กิจกรรมที่\s*[\d๐-๙]+\s*\]\s*/u', '', $cleaned);
            $cleaned = preg_replace('/^\(\s*กิจกรรมที่\s*[\d๐-๙]+\s*\)\s*/u', '', $cleaned);
            $cleaned = preg_replace('/[\(\[\{]\s*กิจกรรมที่\s*[\d๐-๙]+[^\]\)\}]*[\)\]\}]\s*/u', '', $cleaned);
            $cleaned = preg_replace('/^กิจกรรมที่\s*[\d๐-๙]+\s*[:：\-–—]?\s*/u', '', $cleaned);
            return trim($cleaned);
        }
    }

    if (!function_exists('generateDefaultSpec')) {
        function generateDefaultSpec($itemName, $unit = 'ชุด') {
            $name = trim($itemName);
            if (preg_match('/กระเป๋า(พยาบาล|ฉุกเฉิน|ปฐมพยาบาล)/u', $name)) {
                return 'เป็นกระเป๋าสำหรับจัดเก็บยาและอุปกรณ์ปฐมพยาบาลเบื้องต้น ผลิตจากวัสดุที่มีความแข็งแรงทนทาน ไม่ฉีกขาดง่าย และทำความสะอาดได้ มีช่องจัดเก็บอุปกรณ์อย่างเหมาะสม สามารถเปิดและปิดได้สะดวก มีหูหิ้วหรือสายสำหรับถือหรือเคลื่อนย้าย มีขนาดประมาณ 25 × 50 × 20 เซนติเมตร';
            }
            if (preg_match('/(ความดัน|วัดความดัน|omron)/ui', $name)) {
                return 'เป็นเครื่องวัดความดันโลหิตแบบดิจิทัลชนิดวัดบริเวณต้นแขน ใช้พลังงานจากแบตเตอรี่ สามารถใช้งานได้โดยไม่ต้องต่อไฟฟ้าตลอดเวลา สามารถแสดงค่าความดันโลหิตตัวบน ค่าความดันโลหิตตัวล่าง และอัตราการเต้นของชีพจร มีผ้าพันต้นแขนและอุปกรณ์ประกอบครบถ้วนตามมาตรฐานของผู้ผลิต มีคู่มือการใช้งานและเงื่อนไขการรับประกันสินค้า 5 ปี ตามที่ผู้ผลิตหรือผู้จำหน่ายกำหนด สินค้าต้องเป็นของใหม่ อยู่ในสภาพพร้อมใช้งาน';
            }
            if (preg_match('/(กระดาษ|a4|double\s*a|80\s*แกรม)/ui', $name)) {
                return 'เป็นกระดาษถ่ายเอกสารสีขาว เนื้อกระดาษเรียบเนียน ไม่ติดขัดเครื่อง พิมพ์ได้สองหน้า ความหนาไม่น้อยกว่า 80 แกรม ขนาดมาตรฐาน A4 (210 × 297 มม.) บรรจุ 500 แผ่นต่อรีม คุณภาพได้มาตรฐาน มอก. หรือเทียบเท่า';
            }
            if (preg_match('/(หมึก|toner|cartridge|ตลับหมึก|ขวดหมึก|epson|canon|hp)/ui', $name)) {
                return 'เป็นหมึกพิมพ์แท้หรือเทียบเท่าคุณภาพสูงตรงรุ่น ให้คุณภาพงานพิมพ์ที่คมชัด สีสันสดใส ไม่ทำให้หัวพิมพ์อุดตันหรืออุปกรณ์พิมพ์ชำรุดเสียหาย บรรจุในบรรจุภัณฑ์มาตรฐานจากโรงงานผู้ผลิต สินค้าใหม่ไม่เคยผ่านการใช้งาน';
            }
            if (preg_match('/(แฟ้ม|ห่วง|ตราช้าง)/ui', $name)) {
                return 'เป็นแฟ้มสำหรับจัดเก็บเอกสาร ขนาดมาตรฐาน ผลิตจากวัสดุคุณภาพดี สันแฟ้มและกลไกหนีบเอกสารแข็งแรง ทนทาน เอกสารไม่หลุดร่วงง่าย จัดเก็บเอกสารได้อย่างเป็นระเบียบเรียบร้อย';
            }
            if (preg_match('/(ปากกา|เขียน)/ui', $name)) {
                return 'เป็นปากกาเขียนลื่น หมึกไหลสม่ำเสมอ เส้นคมชัด ไม่ขาดตอน แห้งเร็ว ด้ามจับกระชับมือ คุณภาพได้มาตรฐานการใช้งานในสำนักงานและการเรียนการสอน';
            }
            if (preg_match('/(คอมพิวเตอร์|computer|โน้ตบุ๊ก|notebook|จอ|monitor)/ui', $name)) {
                return 'เป็นอุปกรณ์เทคโนโลยีสารสนเทศที่มีประสิทธิภาพ มีคุณลักษณะตรงตามเกณฑ์มาตรฐานขั้นต่ำของกระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคมหรือเทียบเท่า มีอุปกรณ์ต่อพ่วงและระบบความปลอดภัยครบถ้วน พร้อมการรับประกันคุณภาพตามมาตรฐาน';
            }
            if (preg_match('/(ชุดฝึก|อุปกรณ์ฝึก|เครื่องมือ|ชุดทดลอง)/ui', $name)) {
                return 'เป็นชุดอุปกรณ์หรือเครื่องมือฝึกปฏิบัติการที่มีมาตรฐาน มีความปลอดภัยต่อผู้ใช้งาน ผลิตจากวัสดุแข็งแรงทนทาน เหมาะสมสำหรับการจัดการเรียนการสอนสายอาชีพตามหลักสูตร';
            }
            return 'เป็นพัสดุ/วัสดุที่มีคุณภาพ ได้มาตรฐานตามที่ทางราชการกำหนด ของใหม่ ไม่เคยผ่านการใช้งานหรือนำมาปรับสภาพใหม่ มีความแข็งแรงทนทาน และเหมาะสมกับการใช้งานตามวัตถุประสงค์ของโครงการ';
        }
    }

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
                'รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน',
                'รองผู้อำนวยการฝ่ายแผนงานและความร่วมมือ',
                'รองผู้อำนวยการฝ่ายวิชาการ',
                'รองผู้อำนวยการฝ่ายกิจการนักเรียน นักศึกษา',
                'รองผู้อำนวยการฝ่ายกิจการนักเรียนนักศึกษา',
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

    // 1. Proposer & Staff (ผู้เสนอ / เจ้าหน้าที่ในงาน หรือเกี่ยวข้องในงาน)
    $cleanProposerName = cleanPersonName($project->responsible_person ?: ($project->user?->name ?? '..........................................................'));
    $defaultStaffName = $cleanProposerName;
    $defaultStaffPosition = $project->position ?: ($project->user?->position ?? 'เจ้าหน้าที่ผู้รับผิดชอบงาน');

    // 2. Department & Sub-department Resolution
    $actualDept = $project->department;
    $userPos = null;
    if ($project->user_position_id) {
        $userPos = \App\Models\UserPosition::with(['department', 'subDepartment'])->find($project->user_position_id);
    } elseif ($project->user) {
        $userPos = \App\Models\UserPosition::with(['department', 'subDepartment'])
            ->where('user_id', $project->user_id)
            ->where('is_primary', true)
            ->first() 
            ?: \App\Models\UserPosition::with(['department', 'subDepartment'])
                ->where('user_id', $project->user_id)
                ->first();
    }

    $subDept = null;
    if ($userPos && $userPos->subDepartment) {
        $subDept = $userPos->subDepartment;
    } elseif ($actualDept && $actualDept->parent_id) {
        $subDept = $actualDept;
    } else {
        $posStr = ($project->position ?? '') . ' ' . ($project->user?->position ?? '');
        if (!empty($posStr)) {
            $matchedSub = \App\Models\Department::whereNotNull('parent_id')->get()->first(function($d) use ($posStr) {
                $core = preg_replace('/^(งาน|สาขาวิชา(งาน)?|แผนกวิชา)/u', '', $d->name);
                return !empty($core) && str_contains($posStr, $core);
            });
            if ($matchedSub) {
                $subDept = $matchedSub;
            }
        }
    }

    if ($subDept) {
        $deptName = $subDept->name;
        $divisionDept = $subDept->parent ?: $actualDept;
    } else {
        $deptName = $actualDept ? $actualDept->name : ($project->user?->department?->name ?? 'พัฒนาหลักสูตรและการจัดการเรียนรู้');
        $divisionDept = ($actualDept && $actualDept->parent) ? $actualDept->parent : $actualDept;
    }

    $divisionName = $divisionDept ? $divisionDept->name : 'ฝ่ายวิชาการ';
    if (!str_starts_with($divisionName, 'ฝ่าย')) {
        $divisionName = 'ฝ่าย' . $divisionName;
    }
    
    $deptDisplayName = $deptName;
    if (!str_starts_with($deptDisplayName, 'งาน') && !str_starts_with($deptDisplayName, 'แผนก') && !str_starts_with($deptDisplayName, 'ฝ่าย')) {
        $deptDisplayName = 'งาน' . $deptDisplayName;
    }

    if (empty($defaultStaffPosition) || $defaultStaffPosition === '..........................................................') {
        $defaultStaffPosition = 'เจ้าหน้าที่' . $deptDisplayName;
    }

    // Resolve Head of Dept / Sub-unit (หัวหน้างาน / หัวหน้าแผนก)
    $headOfDeptName = null;
    $sig2 = $project->approvals?->where('step_number', 2)->first();
    if ($sig2 && $sig2->user && $sig2->status === 'approved') {
        $isFastTrack = in_array($sig2->signature_type, ['fast_track', 'admin']) 
            || (isset($sig2->comments) && (str_contains($sig2->comments, 'รวดเดียว') || str_contains($sig2->comments, 'Fast-Track') || str_contains($sig2->comments, 'Super Override')));
        if (!$isFastTrack && $sig2->user->name && $sig2->user_id !== $project->user_id) {
            $headOfDeptName = cleanPersonName($sig2->user->name);
        }
    }

    $posCombined = ($project->position ?? '') . ' ' . ($project->user?->position ?? '');
    if (!$headOfDeptName && (str_contains($posCombined, 'หัวหน้า') || in_array($project->proposer_duty, ['หัวหน้างาน', 'หัวหน้าสาขาวิชา', 'หัวหน้าแผนกวิชา']))) {
        $headOfDeptName = $cleanProposerName;
    }

    if (!$headOfDeptName && $subDept) {
        $headUp = \App\Models\UserPosition::with('user')
            ->where(function($q) use ($subDept) {
                $q->where('sub_department_id', $subDept->id)
                  ->orWhere('department_id', $subDept->id);
            })
            ->whereIn('duty', ['หัวหน้างาน', 'หัวหน้าแผนกวิชา', 'หัวหน้าสาขาวิชา'])
            ->first();
        if ($headUp && $headUp->user) {
            $headOfDeptName = cleanPersonName($headUp->user->name);
        }
    }

    if (!$headOfDeptName && $subDept) {
        $coreSub = preg_replace('/^(งาน|สาขาวิชา(งาน)?|แผนกวิชา)/u', '', $subDept->name);
        if (!empty($coreSub)) {
            $matchedHead = \App\Models\User::where('position', 'like', "%หัวหน้า%{$coreSub}%")
                ->where('position', 'not like', '%รองผู้อำนวยการ%')
                ->where('position', 'not like', '%เจ้าหน้าที่%')
                ->first();
            if ($matchedHead) {
                $headOfDeptName = cleanPersonName($matchedHead->name);
            }
        }
    }

    $headOfDeptName = $headOfDeptName ?: $cleanProposerName;
    $headOfDeptTitle = 'หัวหน้า' . (str_starts_with($deptName, 'งาน') || str_starts_with($deptName, 'แผนก') || str_starts_with($deptName, 'ฝ่าย') ? $deptName : $deptDisplayName);

    // 3. Deputy Director options (รองผู้อำนวยการฝ่ายที่เกี่ยวข้องกับงาน)
    $deputyOptions = [
        'academic' => [
            'key' => 'academic',
            'division' => 'ฝ่ายวิชาการ',
            'title' => 'รองผู้อำนวยการฝ่ายวิชาการ',
            'name' => \App\Models\SystemSetting::where('key', 'academic_deputy_name')->value('value') 
                ?: (\App\Models\Department::whereNull('parent_id')->where('name', 'ฝ่ายวิชาการ')->value('deputy_director_name') ?: 'นายนิพนธ์ ร่องพืช'),
        ],
        'student_affairs' => [
            'key' => 'student_affairs',
            'division' => 'ฝ่ายพัฒนากิจการนักเรียนนักศึกษา',
            'title' => 'รองผู้อำนวยการฝ่ายพัฒนากิจการนักเรียนนักศึกษา',
            'name' => \App\Models\SystemSetting::where('key', 'student_affairs_deputy_name')->value('value') 
                ?: (\App\Models\Department::whereNull('parent_id')->where('name', 'like', '%กิจการ%')->value('deputy_director_name') ?: 'นายนิพนธ์ ร่องพืช'),
        ],
        'resources' => [
            'key' => 'resources',
            'division' => 'ฝ่ายบริหารทรัพยากร',
            'title' => 'รองผู้อำนวยการฝ่ายบริหารทรัพยากร',
            'name' => \App\Models\SystemSetting::where('key', 'resource_deputy_name')->value('value') 
                ?: (\App\Models\Department::whereNull('parent_id')->where('name', 'ฝ่ายบริหารทรัพยากร')->value('deputy_director_name') ?: 'นายจักรพงศ์ พรหมสกุลปัญญา'),
        ],
        'planning' => [
            'key' => 'planning',
            'division' => 'ฝ่ายยุทธศาสตร์และแผนงาน',
            'title' => 'รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน',
            'name' => \App\Models\SystemSetting::where('key', 'plan_deputy_name')->value('value') 
                ?: (\App\Models\Department::whereNull('parent_id')->where(function($q) {
                        $q->where('name', 'like', '%ยุทธศาสตร์%')->orWhere('name', 'like', '%แผนงาน%');
                    })->value('deputy_director_name') ?: 'นายนิพนธ์ ร่องพืช'),
        ],
    ];

    foreach ($deputyOptions as $k => $opt) {
        $foundUser = \App\Models\User::where('position', 'like', "%{$opt['title']}%")
            ->orWhere(function($q) use ($opt) {
                $q->where('position', 'like', '%รองผู้อำนวยการ%')
                  ->where('position', 'like', "%{$opt['division']}%");
            })
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
    } elseif (str_contains($divisionName, 'แผน') || str_contains($divisionName, 'ร่วมมือ') || str_contains($divisionName, 'ยุทธศาสตร์')) {
        $initialDeputyKey = 'planning';
    } elseif (str_contains($divisionName, 'วิชาการ')) {
        $initialDeputyKey = 'academic';
    }

    $deputyDirectorName = $deputyOptions[$initialDeputyKey]['name'];
    $deputyDirectorTitle = $deputyOptions[$initialDeputyKey]['title'];

    // 4. College Director (ผู้อำนวยการสถานศึกษา)
    $directorUser = \App\Models\User::where('position', 'like', '%ผู้อำนวยการวิทยาลัย%')
        ->orWhere('position', 'like', '%ผู้อำนวยการ%')
        ->where('position', 'not like', '%รองผู้อำนวยการ%')
        ->first();
    $directorSetting = \App\Models\SystemSetting::where('key', 'director_name')->first();
    $directorName = $directorSetting ? cleanPersonName($directorSetting->value) : ($directorUser ? cleanPersonName($directorUser->name) : 'นายกเชษฐ์ กิ่งชนะ');

    // All Staff Users for Selection Dropdown
    $allStaffUsers = \App\Models\User::where('is_active', true)->orderBy('name')->get(['id', 'name', 'position', 'department_id']);

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

    // All Sub-departments for Interactive Selection
    $allSubDepts = \App\Models\Department::whereNotNull('parent_id')->with('parent')->orderBy('name')->get();
@endphp

<body>
    <!-- Interactive Top Control Bar -->
    <div class="no-print" style="margin: 0 auto 20px auto; width: 210mm; background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 12px 18px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.04);">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px;">
            <div style="font-weight: bold; color: #1e293b; font-size: 14pt;">
                📋 ขอบเขตและรายละเอียดคุณลักษณะเฉพาะ (TOR)
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button type="button" onclick="toggleSignatureOrder()" style="padding: 5px 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-family: inherit; font-size: 11pt; font-weight: bold; cursor: pointer;">
                    🔄 สลับลำดับลายเซ็น
                </button>
                <button onclick="window.print()" style="padding: 6px 18px; background-color: #7c3aed; color: #ffffff; border: none; border-radius: 8px; font-family: inherit; font-size: 13pt; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 8px rgba(124,58,237,0.25);">
                    <span>🖨️</span> สั่งพิมพ์แบบฟอร์ม TOR
                </button>
            </div>
        </div>

        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 14px;">
            <!-- 1. เลือกรองฝ่ายที่เกี่ยวข้อง -->
            <div style="display: flex; align-items: center; gap: 6px;">
                <label for="deputy-select" style="font-weight: bold; color: #1e293b; font-size: 12.5pt;">
                    👔 1. รองฝ่ายที่เกี่ยวข้อง:
                </label>
                <select id="deputy-select" onchange="changeDeputy(this.value)" style="padding: 4px 8px; border-radius: 8px; border: 2px solid #7c3aed; font-family: inherit; font-size: 12pt; font-weight: bold; color: #4c1d95; background-color: #ffffff; cursor: pointer; outline: none; max-width: 250px;">
                    @foreach($deputyOptions as $key => $opt)
                        <option value="{{ $key }}" {{ ($initialDeputyKey === $key) ? 'selected' : '' }}>
                            {{ $opt['division'] }} — ({{ $opt['name'] }})
                        </option>
                    @endforeach
                    <option value="custom">✏️ กำหนดเอง...</option>
                </select>
            </div>

            <!-- 2. เลือกงาน/แผนกวิชา (หัวหน้างาน) -->
            <div style="display: flex; align-items: center; gap: 6px;">
                <label for="unit-select" style="font-weight: bold; color: #1e293b; font-size: 12.5pt;">
                    🏢 2. หัวหน้างาน/แผนก:
                </label>
                <select id="unit-select" onchange="changeUnit(this.value)" style="padding: 4px 8px; border-radius: 8px; border: 2px solid #0284c7; font-family: inherit; font-size: 12pt; font-weight: bold; color: #0369a1; background-color: #ffffff; cursor: pointer; max-width: 240px;">
                    @foreach($allSubDepts as $sd)
                        <option value="{{ $sd->name }}" data-parent="{{ $sd->parent?->name }}" {{ ($deptName === $sd->name) ? 'selected' : '' }}>
                            {{ $sd->name }} ({{ $sd->parent?->name ?: 'ฝ่ายทั่วไป' }})
                        </option>
                    @endforeach
                </select>
            </div>

            <!-- 3. เจ้าหน้าที่ในงาน หรือเกี่ยวข้องในงาน (ทำเป็นตัวเลือก) -->
            <div style="display: flex; align-items: center; gap: 6px;">
                <label for="staff-select" style="font-weight: bold; color: #1e293b; font-size: 12.5pt;">
                    👤 3. เจ้าหน้าที่ในงาน/ผู้เกี่ยวข้อง:
                </label>
                <select id="staff-select" onchange="changeStaff(this.value)" style="padding: 4px 8px; border-radius: 8px; border: 2px solid #059669; font-family: inherit; font-size: 12pt; font-weight: bold; color: #065f46; background-color: #ffffff; cursor: pointer; max-width: 260px;">
                    <option value="default" data-name="{{ $defaultStaffName }}" data-pos="{{ $defaultStaffPosition }}">
                        {{ $defaultStaffName }} ({{ $defaultStaffPosition }})
                    </option>
                    @foreach($allStaffUsers as $staff)
                        @php $sClean = cleanPersonName($staff->name); @endphp
                        @if($sClean !== $defaultStaffName)
                            <option value="{{ $staff->id }}" data-name="{{ $sClean }}" data-pos="{{ $staff->position ?: ('เจ้าหน้าที่' . $deptDisplayName) }}">
                                {{ $sClean }} ({{ $staff->position ?: 'เจ้าหน้าที่' }})
                            </option>
                        @endif
                    @endforeach
                    <option value="custom">✏️ กำหนดชื่อเอง...</option>
                </select>
            </div>
        </div>
    </div>

    <div class="page-container">
        <!-- Header -->
        <div class="doc-header">
            <div>ขอบเขตและรายละเอียดคุณลักษณะเฉพาะ</div>
            <div>การจัดซื้อพัสดุ<span id="tor-dept-header1">{{ $deptDisplayName }}</span> จำนวน .......<span id="tor-items-count-display">{{ $itemsCount }}</span>......รายการ</div>
            <div><span id="tor-dept-header2">{{ $deptDisplayName }}</span>..... วิทยาลัยสารพัดช่างน่าน</div>
        </div>

        <!-- 1. ความเป็นมา -->
        <div class="section-block">
            <div class="section-heading">1. ความเป็นมา</div>
            <div class="section-body">
                การบริหาร{{ $deptDisplayName }} เป็นงานที่ทางวิทยาลัยฯ ต้องดำเนินการภายใต้ระเบียบข้อบังคับ เป็นงานสนับสนุนงานอื่น ๆ ให้สามารถดำเนินการไปได้ด้วยดี ซึ่งเป็นหน่วยงานที่ต้องดำเนินการจึงต้องมีการพัฒนา งานด้าน{{ $deptDisplayName }}อยู่เสมอ เพื่อให้เกิดความถูกต้อง ไม่ให้เกิดการเสียหายแก่ทางราชการและบังเกิดผลดีต่อการจัดการศึกษา
            </div>
            <div class="section-body">
                {{ $deptDisplayName }} วิทยาลัยสารพัดช่างน่าน ตระหนักและเห็นความสำคัญของการบริหาร{{ $deptDisplayName }} และจัดระบบงานดังกล่าวให้สามารถตรวจสอบติดตามได้อย่างมีระบบมากยิ่งขึ้น มีความจำเป็นต้องจัดซื้อวัสดุอุปกรณ์ จำนวน <span id="tor-items-count-display2">{{ $itemsCount }}</span> รายการ เพื่อใช้รองรับการปฏิบัติงานและดำเนินงานตามภารกิจของเจ้าหน้าที่ผู้ปฏิบัติงานด้านการบริหาร{{ $deptDisplayName }} และสามารถเบิกใช้งานได้อย่างต่อเนื่อง
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

        <!-- 4. รายละเอียดคุณลักษณะเฉพาะของพัสดุ (แบบฟอร์มตารางตามภาพที่ 1) -->
        <div class="section-block">
            <div class="section-heading">4. รายละเอียดคุณลักษณะเฉพาะของพัสดุ</div>
            <table class="tor-table" id="tor-items-table">
                <thead>
                    <tr>
                        <th style="width: 6%;">ที่</th>
                        <th style="width: 29%;">รายการพัสดุ</th>
                        <th style="width: 49%;">คุณลักษณะเฉพาะที่กำหนด</th>
                        <th style="width: 8%;">จำนวน</th>
                        <th style="width: 8%;">หน่วยนับ</th>
                    </tr>
                </thead>
                <tbody id="tor-items-tbody">
                    @forelse($procItems as $idx => $it)
                        @php
                            $cleanName = cleanItemDescription($it->description ?? $it->name ?? '');
                            $specText = !empty($it->specification) ? $it->specification : generateDefaultSpec($cleanName, $it->unit ?? 'ชุด');
                            $qty = (float)($it->quantity ?? 1);
                            $formattedQty = ($qty == (int)$qty) ? number_format($qty, 0) : number_format($qty, 2);
                            $unit = $it->unit ?? 'ชุด';
                        @endphp
                        <tr>
                            <td style="text-align: center;">{{ $idx + 1 }}</td>
                            <td style="text-align: left;">
                                <div contenteditable="true" style="outline: none;">{{ $cleanName }}</div>
                            </td>
                            <td style="text-align: left; text-align: justify; text-justify: inter-cluster;">
                                <div contenteditable="true" style="outline: none; min-height: 20px;">{{ $specText }}</div>
                            </td>
                            <td style="text-align: center;">
                                <div contenteditable="true" style="outline: none;">{{ $formattedQty }}</div>
                            </td>
                            <td style="text-align: center;">
                                <div contenteditable="true" style="outline: none;">{{ $unit }}</div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td style="text-align: center;">1</td>
                            <td style="text-align: left;">
                                <div contenteditable="true" style="outline: none;">จัดซื้อวัสดุอุปกรณ์ตามโครงการ {{ $project->title }}</div>
                            </td>
                            <td style="text-align: left; text-align: justify;">
                                <div contenteditable="true" style="outline: none;">เป็นพัสดุ/วัสดุที่มีคุณภาพ ได้มาตรฐานตามที่ทางราชการกำหนด ของใหม่ ไม่เคยผ่านการใช้งาน มีความแข็งแรงทนทาน เหมาะสมสำหรับการปฏิบัติงานตามโครงการ</div>
                            </td>
                            <td style="text-align: center;">
                                <div contenteditable="true" style="outline: none;">1</div>
                            </td>
                            <td style="text-align: center;">
                                <div contenteditable="true" style="outline: none;">งาน</div>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
            <div class="no-print" style="margin-top: 4px; display: flex; align-items: center; gap: 8px;">
                <button type="button" onclick="addTorRow()" style="padding: 4px 12px; background: #059669; color: white; border: none; border-radius: 6px; font-family: inherit; font-size: 11pt; cursor: pointer; font-weight: bold;">
                    ➕ เพิ่มรายการพัสดุในตาราง
                </button>
                <button type="button" onclick="removeTorLastRow()" style="padding: 4px 12px; background: #e11d48; color: white; border: none; border-radius: 6px; font-family: inherit; font-size: 11pt; cursor: pointer; font-weight: bold;">
                    ➖ ลบรายการสุดท้าย
                </button>
                <span style="font-size: 11pt; color: #64748b; margin-left: 8px;">* คลิกที่ข้อความในตารางเพื่อพิมพ์แก้ไขได้ทันทีก่อนสั่งพิมพ์</span>
            </div>
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
        <div class="signatures-container" id="signatures-wrapper">
            <!-- 1. เจ้าหน้าที่ในงาน หรือเกี่ยวข้องในงาน (ทำเป็นตัวเลือก) -->
            <div class="signature-row" id="sig-row-staff">
                <div>(ลงชื่อ) <span class="sig-dots"></span> เจ้าหน้าที่ในงาน / ผู้กำหนดรายละเอียดคุณลักษณะเฉพาะ</div>
                <div style="padding-left: 2.2cm;">( <span id="staff-name-text" contenteditable="true" style="outline: none;">{{ $defaultStaffName }}</span> )</div>
                <div style="padding-left: 2.2cm; font-size: 13.5pt; color: #333;" id="staff-pos-text" contenteditable="true" style="outline: none;">ตำแหน่ง {{ $defaultStaffPosition }}</div>
            </div>

            <!-- 2. หัวหน้างาน / หัวหน้าแผนก -->
            <div class="signature-row" id="sig-row-head">
                <div>(ลงชื่อ) <span class="sig-dots"></span> <span id="tor-head-title">{{ $headOfDeptTitle }}</span></div>
                <div style="padding-left: 2.2cm;">( <span id="tor-head-name" contenteditable="true" style="outline: none;">{{ $headOfDeptName }}</span> )</div>
                <div style="padding-left: 2.2cm; font-size: 13.5pt; color: #333;" id="tor-head-pos" contenteditable="true" style="outline: none;">ตำแหน่ง {{ $headOfDeptTitle }}</div>
            </div>

            <!-- 3. รองผู้อำนวยการฝ่ายที่เกี่ยวข้องกับงาน -->
            <div class="signature-row" id="sig-row-deputy">
                <div>(ลงชื่อ) <span class="sig-dots"></span> <span id="deputy-title-text">{{ $deputyDirectorTitle }}</span></div>
                <div style="padding-left: 2.2cm;">( <span id="deputy-name-text" contenteditable="true" style="outline: none;">{{ $deputyDirectorName }}</span> )</div>
                <div style="padding-left: 2.2cm; font-size: 13.5pt; color: #333;" id="deputy-pos-text" contenteditable="true" style="outline: none;">ตำแหน่ง {{ $deputyDirectorTitle }}</div>
            </div>

            <!-- 4. ผู้อำนวยการสถานศึกษา (วิทยาลัยสารพัดช่างน่าน) -->
            <div class="signature-row" id="sig-row-director">
                <div>(ลงชื่อ) <span class="sig-dots"></span> ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน</div>
                <div style="padding-left: 2.2cm;">( <span id="director-name-text" contenteditable="true" style="outline: none;">{{ $directorName }}</span> )</div>
                <div style="padding-left: 2.2cm; font-size: 13.5pt; color: #333;">ตำแหน่ง ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน</div>
            </div>
        </div>
    </div>

    <!-- Client-Side Switcher & Dynamic Table Script -->
    <script>
        const deputyData = @json($deputyOptions);

        function changeStaff(val) {
            if (val === 'custom') {
                const customName = prompt("กรุณาระบุชื่อ-นามสกุล เจ้าหน้าที่ในงาน/ผู้เกี่ยวข้อง:", "");
                if (!customName) return;
                const customPos = prompt("กรุณาระบุตำแหน่ง:", "เจ้าหน้าที่...");
                document.getElementById('staff-name-text').innerText = customName;
                document.getElementById('staff-pos-text').innerText = 'ตำแหน่ง ' + (customPos || 'เจ้าหน้าที่');
                return;
            }
            const sel = document.getElementById('staff-select');
            const opt = sel.options[sel.selectedIndex];
            if (opt) {
                const name = opt.getAttribute('data-name');
                const pos = opt.getAttribute('data-pos');
                if (name) document.getElementById('staff-name-text').innerText = name;
                if (pos) document.getElementById('staff-pos-text').innerText = 'ตำแหน่ง ' + pos;
            }
        }

        function changeUnit(unitName) {
            const select = document.getElementById('unit-select');
            const selectedOpt = select.options[select.selectedIndex];
            const parentDiv = selectedOpt ? selectedOpt.getAttribute('data-parent') : '';

            let display = unitName;
            if (!display.startsWith('งาน') && !display.startsWith('แผนก') && !display.startsWith('ฝ่าย') && !display.startsWith('สาขาวิชา')) {
                display = 'งาน' + display;
            }

            const h1 = document.getElementById('tor-dept-header1');
            if (h1) h1.innerText = display;
            const h2 = document.getElementById('tor-dept-header2');
            if (h2) h2.innerText = display;

            const ht = document.getElementById('tor-head-title');
            const hp = document.getElementById('tor-head-pos');
            let newTitle = '';
            if (display.startsWith('งาน') || display.startsWith('แผนก') || display.startsWith('ฝ่าย')) {
                newTitle = 'หัวหน้า' + display;
            } else if (display.startsWith('สาขาวิชา')) {
                newTitle = 'หัวหน้าแผนกวิชา' + display.replace(/^สาขาวิชา(งาน)?/, '');
            } else {
                newTitle = 'หัวหน้างาน' + display;
            }
            if (ht) ht.innerText = newTitle;
            if (hp) hp.innerText = 'ตำแหน่ง ' + newTitle;

            if (parentDiv) {
                if (parentDiv.includes('บริหาร') || parentDiv.includes('ทรัพยากร')) {
                    const sel = document.getElementById('deputy-select');
                    if (sel) { sel.value = 'resources'; changeDeputy('resources'); }
                } else if (parentDiv.includes('กิจการ') || parentDiv.includes('พัฒนา')) {
                    const sel = document.getElementById('deputy-select');
                    if (sel) { sel.value = 'student_affairs'; changeDeputy('student_affairs'); }
                } else if (parentDiv.includes('แผน') || parentDiv.includes('ยุทธศาสตร์')) {
                    const sel = document.getElementById('deputy-select');
                    if (sel) { sel.value = 'planning'; changeDeputy('planning'); }
                } else if (parentDiv.includes('วิชาการ')) {
                    const sel = document.getElementById('deputy-select');
                    if (sel) { sel.value = 'academic'; changeDeputy('academic'); }
                }
            }
        }

        function changeDeputy(val) {
            if (val === 'custom') {
                const customTitle = prompt("กรุณาระบุตำแหน่งรองผู้อำนวยการฝ่าย:", "รองผู้อำนวยการฝ่าย...");
                if (!customTitle) return;
                const customName = prompt("กรุณาระบุชื่อ-นามสกุล:", "");
                if (!customName) return;

                document.getElementById('deputy-title-text').innerText = customTitle;
                document.getElementById('deputy-name-text').innerText = customName;
                document.getElementById('deputy-pos-text').innerText = 'ตำแหน่ง ' + customTitle;
                return;
            }

            if (deputyData[val]) {
                document.getElementById('deputy-title-text').innerText = deputyData[val].title;
                document.getElementById('deputy-name-text').innerText = deputyData[val].name;
                document.getElementById('deputy-pos-text').innerText = 'ตำแหน่ง ' + deputyData[val].title;
            }
        }

        let isOrderFlipped = false;
        function toggleSignatureOrder() {
            const wrapper = document.getElementById('signatures-wrapper');
            const staff = document.getElementById('sig-row-staff');
            const head = document.getElementById('sig-row-head');
            const deputy = document.getElementById('sig-row-deputy');
            const director = document.getElementById('sig-row-director');

            if (!isOrderFlipped) {
                // ลำดับ: รองฝ่าย -> หัวหน้างาน -> เจ้าหน้าที่ -> ผอ.
                wrapper.innerHTML = '';
                wrapper.appendChild(deputy);
                wrapper.appendChild(head);
                wrapper.appendChild(staff);
                wrapper.appendChild(director);
                isOrderFlipped = true;
            } else {
                // ลำดับ: เจ้าหน้าที่ -> หัวหน้างาน -> รองฝ่าย -> ผอ.
                wrapper.innerHTML = '';
                wrapper.appendChild(staff);
                wrapper.appendChild(head);
                wrapper.appendChild(deputy);
                wrapper.appendChild(director);
                isOrderFlipped = false;
            }
        }

        function addTorRow() {
            const tbody = document.getElementById('tor-items-tbody');
            const count = tbody.querySelectorAll('tr').length + 1;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: center;">${count}</td>
                <td style="text-align: left;">
                    <div contenteditable="true" style="outline: none;">ระบุชื่อรายการพัสดุ...</div>
                </td>
                <td style="text-align: left; text-align: justify;">
                    <div contenteditable="true" style="outline: none;">เป็นพัสดุ/วัสดุที่มีคุณภาพ ได้มาตรฐานตามที่ทางราชการกำหนด ของใหม่ ไม่เคยผ่านการใช้งาน...</div>
                </td>
                <td style="text-align: center;">
                    <div contenteditable="true" style="outline: none;">1</div>
                </td>
                <td style="text-align: center;">
                    <div contenteditable="true" style="outline: none;">ชุด</div>
                </td>
            `;
            tbody.appendChild(tr);
            updateItemsCount();
        }

        function removeTorLastRow() {
            const tbody = document.getElementById('tor-items-tbody');
            const rows = tbody.querySelectorAll('tr');
            if (rows.length > 1) {
                rows[rows.length - 1].remove();
                updateItemsCount();
            }
        }

        function updateItemsCount() {
            const tbody = document.getElementById('tor-items-tbody');
            const count = tbody.querySelectorAll('tr').length;
            const disp1 = document.getElementById('tor-items-count-display');
            const disp2 = document.getElementById('tor-items-count-display2');
            if (disp1) disp1.innerText = count;
            if (disp2) disp2.innerText = count;
        }
    </script>
</body>
</html>
