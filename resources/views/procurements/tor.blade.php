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
            margin: 6px 0 12px 0;
        }
        .items-table th, .items-table td {
            padding: 2px 4px;
            vertical-align: top;
            border: none;
        }
        .items-table td.col-idx {
            width: 35px;
            text-align: center;
        }
        .items-table td.col-desc {
            text-align: left;
            padding-left: 8px;
        }
        .items-table td.col-qty {
            width: 60px;
            text-align: right;
            padding-right: 12px;
        }
        .items-table td.col-unit {
            width: 80px;
            text-align: left;
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

    // 1. Proposer (ผู้เสนอ / ผู้กำหนดขอบเขตฯ)
    $cleanProposerName = cleanPersonName($project->user?->name ?? '..........................................................');
    
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

    // Resolve Head of Dept / Sub-unit
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

    // 3. Deputy Director options
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
            'division' => 'ฝ่ายกิจการนักเรียนนักศึกษา',
            'title' => 'รองผู้อำนวยการฝ่ายกิจการนักเรียนนักศึกษา',
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

    // All Sub-departments for Interactive Selection
    $allSubDepts = \App\Models\Department::whereNotNull('parent_id')->with('parent')->orderBy('name')->get();
@endphp

<body>
    <!-- Interactive Top Control Bar -->
    <div class="no-print" style="margin: 0 auto 20px auto; width: 210mm; background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 12px 18px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.04);">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px;">
                <label for="unit-select" style="font-weight: bold; color: #1e293b; font-size: 13pt;">
                    🏢 เลือกงาน/แผนกวิชา:
                </label>
                <select id="unit-select" onchange="changeUnit(this.value)" style="padding: 4px 10px; border-radius: 8px; border: 2px solid #0284c7; font-family: inherit; font-size: 13pt; font-weight: bold; color: #0369a1; background-color: #ffffff; cursor: pointer;">
                    @foreach($allSubDepts as $sd)
                        <option value="{{ $sd->name }}" data-parent="{{ $sd->parent?->name }}" {{ ($deptName === $sd->name) ? 'selected' : '' }}>
                            {{ $sd->name }} ({{ $sd->parent?->name ?: 'ฝ่ายทั่วไป' }})
                        </option>
                    @endforeach
                </select>
            </div>

            <div style="display: flex; align-items: center; gap: 6px;">
                <label for="deputy-select" style="font-weight: bold; color: #1e293b; font-size: 13pt;">
                    👔 เลือกรองฝ่ายที่เกี่ยวข้อง:
                </label>
                <select id="deputy-select" onchange="changeDeputy(this.value)" style="padding: 4px 10px; border-radius: 8px; border: 2px solid #7c3aed; font-family: inherit; font-size: 13pt; font-weight: bold; color: #4c1d95; background-color: #ffffff; cursor: pointer; outline: none;">
                    @foreach($deputyOptions as $key => $opt)
                        <option value="{{ $key }}" {{ ($initialDeputyKey === $key) ? 'selected' : '' }}>
                            {{ $opt['division'] }} — ({{ $opt['name'] }})
                        </option>
                    @endforeach
                    <option value="custom">✏️ กำหนดเอง...</option>
                </select>
            </div>
        </div>

        <button onclick="window.print()" style="padding: 6px 18px; background-color: #7c3aed; color: #ffffff; border: none; border-radius: 8px; font-family: inherit; font-size: 13pt; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 8px rgba(124,58,237,0.25);">
            <span>🖨️</span> สั่งพิมพ์แบบฟอร์ม TOR
        </button>
    </div>

    <div class="page-container">
        <!-- Header -->
        <div class="doc-header">
            <div>ขอบเขตและรายละเอียดคุณลักษณะเฉพาะ</div>
            <div>การจัดซื้อพัสดุ<span id="tor-dept-header1">{{ $deptDisplayName }}</span> จำนวน .......{{ $itemsCount }}......รายการ</div>
            <div><span id="tor-dept-header2">{{ $deptDisplayName }}</span>..... วิทยาลัยสารพัดช่างน่าน</div>
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
                <div>(ลงชื่อ) <span class="sig-dots"></span> <span id="tor-head-title">{{ $headOfDeptTitle }}</span></div>
                <div style="padding-left: 2.2cm;">( <span id="tor-head-name">{{ $headOfDeptName }}</span> )</div>
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
            if (ht) {
                if (display.startsWith('งาน') || display.startsWith('แผนก') || display.startsWith('ฝ่าย')) {
                    ht.innerText = 'หัวหน้า' + display;
                } else if (display.startsWith('สาขาวิชา')) {
                    ht.innerText = 'หัวหน้าแผนกวิชา' + display.replace(/^สาขาวิชา(งาน)?/, '');
                } else {
                    ht.innerText = 'หัวหน้างาน' + display;
                }
            }

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
