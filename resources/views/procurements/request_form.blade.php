<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>บันทึกข้อความขออนุมัติจัดซื้อ - {{ $project->title }}</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: "TH Sarabun PSK", "TH Sarabun New", "Angsana New", sans-serif;
            font-size: 13pt;
            line-height: 1.18;
            color: #000;
            padding: 0.18in 0.35in 0.12in 0.45in;
            max-width: 7.5in;
            margin: auto;
        }
        .header-container {
            position: relative;
            min-height: 48px;
            margin-bottom: 2px;
        }
        .garuda-img {
            position: absolute;
            left: 0;
            top: 0;
            width: 48px;
            height: auto;
        }
        .header-title {
            text-align: center;
            font-weight: bold;
            font-size: 24pt;
            line-height: 1.05;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 2px;
            border-collapse: collapse;
        }
        .meta-table td {
            padding: 0;
            vertical-align: top;
            font-size: 13pt;
            line-height: 1.18;
        }
        .subject-title {
            font-weight: bold;
        }
        .paragraph {
            text-indent: 0.45in;
            text-align: justify;
            margin-bottom: 1.5px;
            line-height: 1.18;
            font-size: 13pt;
        }
        .proposer-section {
            margin-left: auto;
            width: 3.3in;
            text-align: center;
            margin-top: 3px;
            margin-bottom: 3px;
            font-size: 12.5pt;
            line-height: 1.18;
        }
        .approval-grid {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000 !important;
            table-layout: fixed;
            margin-top: 2px;
            margin-bottom: 3px;
        }
        .approval-grid td {
            border: 1px solid #000 !important;
            vertical-align: top;
            padding: 2.5px 5px;
            font-size: 11pt;
            line-height: 1.16;
        }
        .box-title {
            font-weight: bold;
            font-size: 11.5pt;
            margin-bottom: 1px;
        }
        .dotted-line {
            border-bottom: 1px dotted #000;
            display: inline-block;
        }
        .director-order-box {
            width: 100%;
            margin-top: 2px;
            text-align: center;
            font-size: 11.5pt;
            line-height: 1.18;
        }
        .chk-box {
            display: inline-block;
            cursor: pointer;
            user-select: none;
            padding: 0 1px;
        }
        .chk-box:hover {
            background-color: #f1f5f9;
            border-radius: 3px;
        }
        @media print {
            body { 
                padding: 0 !important; 
                margin: 0 !important;
                max-width: 100% !important;
                font-size: 12.5pt !important;
                line-height: 1.15 !important;
            }
            .paragraph {
                font-size: 12.5pt !important;
                line-height: 1.15 !important;
            }
            .approval-grid td {
                font-size: 10.5pt !important;
                line-height: 1.13 !important;
                padding: 2px 4px !important;
            }
            .box-title {
                font-size: 11pt !important;
            }
            .director-order-box {
                font-size: 11pt !important;
                line-height: 1.15 !important;
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
                margin: 0.6cm 1.0cm 0.4cm 1.4cm;
            }
        }
    </style>
</head>
@php
    $months = [1=>'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    $day = date('j');
    $month = $months[(int)date('n')];
    $year = date('Y') + 543;
    $thaiDateStr = "{$day} {$month} {$year}";

    if (!function_exists('cleanPersonNameReqNew')) {
        function cleanPersonNameReqNew($name) {
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

    if (!function_exists('convertToThaiBahtTextReqNew')) {
        function convertToThaiBahtTextReqNew($number) {
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

    // Proposer
    $rawProposerName = $project->responsible_person ?: ($project->user ? $project->user->name : '..........................................................');
    $cleanProposerName = cleanPersonNameReqNew($rawProposerName);

    // Department & Sub-department Resolution
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
        $deptName = $actualDept ? $actualDept->name : 'วิทยาลัยสารพัดช่างน่าน';
        $divisionDept = ($actualDept && $actualDept->parent) ? $actualDept->parent : $actualDept;
    }

    $divisionName = $divisionDept ? $divisionDept->name : 'ฝ่ายวิชาการ';
    if (!str_starts_with($divisionName, 'ฝ่าย')) {
        $divisionName = 'ฝ่าย' . $divisionName;
    }

    // Resolve Box 1 Title: e.g. "งานสวัสดิการนักเรียนนักศึกษา" -> "1. ความเห็น หัวหน้างานสวัสดิการนักเรียนนักศึกษา"
    if (str_starts_with($deptName, 'งาน')) {
        $box1Title = '1. ความเห็น หัวหน้า' . $deptName;
    } elseif (str_starts_with($deptName, 'สาขาวิชา') || str_starts_with($deptName, 'แผนกวิชา')) {
        $box1Title = '1. ความเห็น หัวหน้าแผนกวิชา' . preg_replace('/^(สาขาวิชา(งาน)?|แผนกวิชา)/u', '', $deptName);
    } else {
        $box1Title = '1. ความเห็น หัวหน้าแผนก/งาน ' . $deptName;
    }

    // Resolve Head of Dept / Sub-unit (Box 1 Name)
    $headOfDeptName = null;
    $sig2 = $project->approvals?->where('step_number', 2)->first();
    if ($sig2 && $sig2->user && $sig2->status === 'approved') {
        $isFastTrack = in_array($sig2->signature_type, ['fast_track', 'admin']) 
            || (isset($sig2->comments) && (str_contains($sig2->comments, 'รวดเดียว') || str_contains($sig2->comments, 'Fast-Track') || str_contains($sig2->comments, 'Super Override')));
        if (!$isFastTrack && $sig2->user->name && $sig2->user_id !== $project->user_id) {
            $headOfDeptName = cleanPersonNameReqNew($sig2->user->name);
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
            $headOfDeptName = cleanPersonNameReqNew($headUp->user->name);
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
                $headOfDeptName = cleanPersonNameReqNew($matchedHead->name);
            }
        }
    }

    $headOfDeptName = $headOfDeptName ?: '............................................................';

    // Deputy Directors
    $deputyOptions = [
        'academic' => [
            'division' => 'ฝ่ายวิชาการ',
            'title' => 'รองผู้อำนวยการฝ่ายวิชาการ',
            'name' => \App\Models\SystemSetting::where('key', 'academic_deputy_name')->value('value') 
                ?: (\App\Models\Department::whereNull('parent_id')->where('name', 'ฝ่ายวิชาการ')->value('deputy_director_name') ?: 'นายนิพนธ์ ร่องพืช'),
        ],
        'student_affairs' => [
            'division' => 'ฝ่ายกิจการนักเรียนนักศึกษา',
            'title' => 'รองผู้อำนวยการฝ่ายกิจการนักเรียนนักศึกษา',
            'name' => \App\Models\SystemSetting::where('key', 'student_affairs_deputy_name')->value('value') 
                ?: (\App\Models\Department::whereNull('parent_id')->where('name', 'like', '%กิจการ%')->value('deputy_director_name') ?: 'นายนิพนธ์ ร่องพืช'),
        ],
        'resources' => [
            'division' => 'ฝ่ายบริหารทรัพยากร',
            'title' => 'รองผู้อำนวยการฝ่ายบริหารทรัพยากร',
            'name' => \App\Models\SystemSetting::where('key', 'resource_deputy_name')->value('value') 
                ?: (\App\Models\Department::whereNull('parent_id')->where('name', 'ฝ่ายบริหารทรัพยากร')->value('deputy_director_name') ?: 'นายจักรพงศ์ พรหมสกุลปัญญา'),
        ],
        'planning' => [
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
            $deputyOptions[$k]['name'] = cleanPersonNameReqNew($foundUser->name);
        }
    }

    $initialDeputyKey = 'academic';
    if (str_contains($divisionName, 'บริหาร') || str_contains($divisionName, 'ทรัพยากร')) {
        $initialDeputyKey = 'resources';
    } elseif (str_contains($divisionName, 'กิจการ') || str_contains($divisionName, 'พัฒนา')) {
        $initialDeputyKey = 'student_affairs';
    } elseif (str_contains($divisionName, 'แผน') || str_contains($divisionName, 'ร่วมมือ') || str_contains($divisionName, 'ยุทธศาสตร์')) {
        $initialDeputyKey = 'planning';
    }

    $deputyDirectorName = $deputyOptions[$initialDeputyKey]['name'];

    // Specific Officers for Section 3, 4, 5, 6, 7 (Strict lookups matching database settings)
    $planHeadName = \App\Models\SystemSetting::where('key', 'plan_head_name')->value('value');
    if (!$planHeadName) {
        $planHeadUser = \App\Models\User::where('name', 'like', '%พิพัฒน์%')
            ->orWhere('position', 'like', '%หัวหน้างานพัฒนายุทธศาสตร์%')
            ->first();
        $planHeadName = $planHeadUser ? cleanPersonNameReqNew($planHeadUser->name) : 'นายพิพัฒน์ สีมา';
    }

    $planDeputyName = $deputyOptions['planning']['name'] ?: 'นายนิพนธ์ ร่องพืช';

    $financeHeadName = \App\Models\SystemSetting::where('key', 'finance_head_name')->value('value');
    if (!$financeHeadName) {
        $financeHeadUser = \App\Models\User::where('position', 'like', '%หัวหน้างานการเงิน%')
            ->orWhere('name', 'like', '%ดวงดาว%')
            ->first();
        $financeHeadName = $financeHeadUser ? cleanPersonNameReqNew($financeHeadUser->name) : 'นางสาวดวงดาว ไชยเขียว';
    }

    $procHeadName = \App\Models\SystemSetting::where('key', 'procurement_head_name')->value('value');
    if (!$procHeadName) {
        $procHeadUser = \App\Models\User::where('position', 'like', '%หัวหน้างานพัสดุ%')
            ->orWhere('position', 'like', '%หัวหน้าเจ้าหน้าที่%')
            ->orWhere('name', 'like', '%กิตติศักดิ์%')
            ->first();
        $procHeadName = $procHeadUser ? cleanPersonNameReqNew($procHeadUser->name) : 'นายกิตติศักดิ์ ขัดเงางาม';
    }

    $resourceDeputyName = $deputyOptions['resources']['name'] ?: 'นายจักรพงศ์ พรหมสกุลปัญญา';

    // College Director
    $directorSetting = \App\Models\SystemSetting::where('key', 'director_name')->first();
    $directorName = $directorSetting ? cleanPersonNameReqNew($directorSetting->value) : 'นายกเชษฐ์ กิ่งชนะ';

    // All Sub-departments for Interactive Selection
    $allSubDepts = \App\Models\Department::whereNotNull('parent_id')->with('parent')->orderBy('name')->get();

    // Financial calculations
    $itemsCount = $items->count() > 0 ? $items->count() : ($project->items ? $project->items->count() : 1);
    $totalProcSum = $items->sum('total_price') ?: $items->reduce(function($carry, $i) {
        return $carry + (floatval($i->quantity) * floatval($i->unit_price));
    }, 0);
    $finalProcAmount = $totalProcSum > 0 ? $totalProcSum : ($project->estimated_budget ?: 0);
    $bahtText = convertToThaiBahtTextReqNew($finalProcAmount);

    $budgetAllocated = $project->allocated_budget ?: ($project->estimated_budget ?: $finalProcAmount);
    $budgetRemaining = max(0, $budgetAllocated - $finalProcAmount);

    // Committees
    $pChair = $purchasingCommittee->where('pivot.role', 'chairperson')->first()?->name;
    $pMem1 = $purchasingCommittee->where('pivot.role', 'member')->values()->get(0)?->name;
    $pMem2 = $purchasingCommittee->where('pivot.role', 'member')->values()->get(1)?->name;

    $iChair = $inspectionCommittee->where('pivot.role', 'chairperson')->first()?->name;
    $iMem1 = $inspectionCommittee->where('pivot.role', 'member')->values()->get(0)?->name;
    $iMem2 = $inspectionCommittee->where('pivot.role', 'member')->values()->get(1)?->name;

    // Garuda Logo
    $garudaPath = public_path('images/garuda.png');
    if (!file_exists($garudaPath)) {
        $garudaPath = public_path('garuda.png');
    }
    $garudaSrc = file_exists($garudaPath) 
        ? 'data:image/png;base64,' . base64_encode(file_get_contents($garudaPath)) 
        : asset('images/garuda.png');
@endphp

<body>
    <!-- Top Interactive Control Bar (Hidden when printing) -->
    <div class="no-print" style="margin-bottom: 10px; background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 8px 14px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.04);">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px;">
                <label for="unit-select" style="font-weight: bold; color: #1e293b; font-size: 13pt;">
                    🏢 เลือกงาน/แผนกวิชา (ข้อ 1):
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
                    👔 เลือกรองฝ่ายฯ ที่เกี่ยวข้อง (ข้อ 2):
                </label>
                <select id="deputy-select" onchange="changeDeputy(this.value)" style="padding: 4px 10px; border-radius: 8px; border: 2px solid #7c3aed; font-family: inherit; font-size: 13pt; font-weight: bold; color: #4c1d95; background-color: #ffffff; cursor: pointer;">
                    @foreach($deputyOptions as $key => $opt)
                        <option value="{{ $key }}" {{ ($initialDeputyKey === $key) ? 'selected' : '' }}>
                            {{ $opt['division'] }} — ({{ $opt['name'] }})
                        </option>
                    @endforeach
                    <option value="custom">✏️ กำหนดเอง...</option>
                </select>
            </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11pt; color: #64748b;">(คลิกที่วงเล็บเพื่อติ๊กเลือก/แก้ไขข้อความได้โดยตรง)</span>
            <button onclick="window.print()" style="padding: 5px 16px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; border: none; border-radius: 8px; font-family: inherit; font-size: 13pt; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(124,58,237,0.25);">
                🖨️ สั่งพิมพ์เอกสาร / บันทึก PDF
            </button>
        </div>
    </div>

    <!-- Header Section -->
    <div class="header-container">
        <img src="{{ $garudaSrc }}" class="garuda-img" alt="ตราครุฑ">
        <div class="header-title">บันทึกข้อความ</div>
    </div>
    
    <table class="meta-table">
        <tr>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; padding-right: 8px;">ส่วนราชการ</td>
            <td colspan="3">
                วิทยาลัยสารพัดช่างน่าน <span style="margin-left: 8px;">ฝ่าย <span id="division-header-text" contenteditable="true" style="outline: none;">{{ str_replace('ฝ่าย', '', $divisionName) }}</span> งาน / แผนกวิชา <span id="unit-header-text" contenteditable="true" style="outline: none;">{{ $deptName }}</span></span>
            </td>
        </tr>
        <tr>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; padding-right: 8px;">ที่</td>
            <td><span contenteditable="true" style="outline: none;">{{ (!empty($procurement->plan_procurement_cut_at) && !empty($procurement->plan_procurement_doc_number)) ? $procurement->plan_procurement_doc_number : '........../' . ($project->academic_year ?: '2570') }}</span></td>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; text-align: right; padding-right: 8px;">วันที่</td>
            <td><span contenteditable="true" style="outline: none;">............</span> เดือน <span contenteditable="true" style="outline: none;">....................................</span> พ.ศ. <span contenteditable="true" style="outline: none;">................</span></td>
        </tr>
        <tr>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; padding-right: 8px;">เรื่อง</td>
            <td colspan="3" class="subject-title">ขออนุมัติจัดซื้อ</td>
        </tr>
        <tr>
            <td style="white-space: nowrap; width: 1%; font-weight: bold; padding-right: 8px;">เรียน</td>
            <td colspan="3">ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน</td>
        </tr>
    </table>

    <div style="border-bottom: 1.5px solid #000; margin-bottom: 4px; margin-top: 2px;"></div>

    <!-- Body Text (Exact layout matching the image) -->
    <div class="paragraph">
        ด้วยแผนกวิชา/งาน <span id="body-unit-text" contenteditable="true" style="outline: none; font-weight: bold;">{{ $deptName }}</span> มีความประสงค์ขอ 
        <span class="chk-box">(&nbsp;/&nbsp;) จัดซื้อวัสดุ</span> เพื่อใช้เป็น 
        <span class="chk-box">(&nbsp;/&nbsp;) วัสดุฝึก</span> 
        <span class="chk-box">(&nbsp;&nbsp;&nbsp;) อุปกรณ์จัดการเรียนการสอน</span> 
        <span class="chk-box">(&nbsp;&nbsp;&nbsp;) งานซ่อม/แก้ไขเปลี่ยนของเดิมที่ชำรุด</span> 
        <span class="chk-box">(&nbsp;&nbsp;&nbsp;) อื่น ๆ</span> <span contenteditable="true" style="outline: none;">................................................................</span>
    </div>

    <div class="paragraph" style="text-indent: 0;">
        สำหรับประกอบการเรียนการสอนวิชา/งาน/โครงการ <span contenteditable="true" style="outline: none; font-weight: bold;">{{ $project->title }}</span>
    </div>

    <div class="paragraph" style="text-indent: 0;">
        เหตุผลอื่นๆ <span contenteditable="true" style="outline: none;">เพื่อใช้ในการดำเนินกิจกรรมตามโครงการและพัฒนาคุณภาพการจัดการศึกษา</span>
    </div>

    <div class="paragraph" style="text-indent: 0;">
        จำนวน <strong style="font-size: 13pt;">{{ $itemsCount }}</strong> รายการ &nbsp; 
        เป็นเงิน <strong style="font-size: 13pt;">{{ number_format($finalProcAmount, 2) }}</strong> บาท 
        (<strong>{{ $bahtText }}</strong>) &nbsp; 
        ต้องการใช้วัสดุวันที่ <span contenteditable="true" style="outline: none;">ภายในกำหนดการดำเนินโครงการ</span>
    </div>

    <div class="paragraph" style="text-indent: 0.45in; font-weight: bold; margin-top: 2px;">
        ดังรายละเอียดในประมาณการหน้าที่ 2
    </div>
    <div class="paragraph" style="text-indent: 0.45in; margin-top: 1px;">
        จึงเรียนมาเพื่อโปรดพิจารณา
    </div>

    <!-- Proposer Signature (Top Right) -->
    <div class="proposer-section">
        <div>ลงชื่อ ....................................................................... ผู้ขออนุมัติจัดซื้อ</div>
        <div style="margin-top: 1px;">( <span contenteditable="true" style="outline: none;">{{ $cleanProposerName }}</span> )</div>
        <div style="font-size: 11pt; margin-top: 1px;">............../....................../................</div>
    </div>

    <!-- 2-Column Outer Box (Left: 1, 2, 3, 4 | Right: 5, 6, 7) Exactly Matching Image -->
    <table class="approval-grid">
        <colgroup>
            <col style="width: 50%;">
            <col style="width: 50%;">
        </colgroup>
        <tbody>
            <!-- Row 1: Box 1 (Left) & Box 5 (Right) -->
            <tr>
                <!-- 1. ความเห็น หัวหน้าแผนก/งาน -->
                <td style="padding: 3px 6px;">
                    <div class="box-title"><span id="box1-title-text" contenteditable="true" style="outline: none;">{{ $box1Title }}</span></div>
                    <div style="padding-left: 6px; line-height: 1.2;">
                        มีในแผนได้จัดสรรงบ <span class="dotted-line" style="min-width: 130px;" contenteditable="true">&nbsp;{{ number_format($budgetAllocated, 2) }}</span> บาท<br>
                        จ่ายครั้งนี้แล้วคงเหลือ <span class="dotted-line" style="min-width: 140px;" contenteditable="true">&nbsp;{{ number_format($budgetRemaining, 2) }}</span> บาท
                    </div>
                    <div style="text-align: center; margin-top: 4px;">
                        <div>ลงชื่อ............................................................</div>
                        <div style="margin-top: 1px;">( <span id="box1-head-name" contenteditable="true" style="outline: none;">{{ $headOfDeptName }}</span> ) &nbsp;&nbsp; ........./............/............</div>
                    </div>
                </td>

                <!-- 5. ความเห็นหัวหน้างานการเงิน -->
                <td style="padding: 3px 6px;">
                    <div class="box-title">5. ความเห็นหัวหน้างานการเงิน</div>
                    <div style="padding-left: 6px; line-height: 1.2;">
                        - โดยภาพรวม มีงบเพียงพอ กรณีจัดซื้อด้วยเงิน / ใช้เงิน<br>
                        <span class="chk-box">(&nbsp;&nbsp;&nbsp;) รายได้สถานศึกษา</span> &nbsp;
                        <span class="chk-box">(&nbsp;/&nbsp;) เงินอุดหนุน</span> &nbsp;
                        <span class="chk-box">(&nbsp;&nbsp;&nbsp;) งปม.</span> &nbsp;
                        <span class="chk-box">(&nbsp;&nbsp;&nbsp;) อื่น ๆ</span>..........................<br>
                        มียอดคงเหลือ <span class="dotted-line" style="min-width: 140px;" contenteditable="true">&nbsp;{{ number_format($budgetRemaining, 2) }}</span> บาท
                    </div>
                    <div style="text-align: center; margin-top: 4px;">
                        <div>ลงชื่อ............................................................</div>
                        <div style="margin-top: 1px;">( <span contenteditable="true" style="outline: none;">{{ $financeHeadName }}</span> ) &nbsp;&nbsp; ........./............/............</div>
                    </div>
                </td>
            </tr>

            <!-- Row 2: Box 2 (Left) & Box 6 (Right - Tall with Committees) -->
            <tr>
                <!-- 2. ความเห็น รองผู้อำนวยการฝ่าย -->
                <td style="padding: 3px 6px;">
                    <div class="box-title">2. ความเห็น รองผู้อำนวยการฝ่าย <span id="box2-div-text" contenteditable="true" style="outline: none;">{{ str_replace('ฝ่าย', '', $divisionName) }}</span></div>
                    <div style="padding-left: 6px; line-height: 1.2;">
                        มีในแผนตามข้อ 1 เห็นควรอนุมัติ
                    </div>
                    <div style="text-align: center; margin-top: 6px;">
                        <div>ลงชื่อ............................................................</div>
                        <div style="margin-top: 1px;">( <span id="box2-name-text" contenteditable="true" style="outline: none;">{{ $deputyDirectorName }}</span> ) &nbsp;&nbsp; ........./............/............</div>
                    </div>
                </td>

                <!-- 6. ความเห็นของหัวหน้าเจ้าหน้าที่ (พัสดุ) with Committees and Loan Officer -->
                <td rowspan="2" style="padding: 3px 6px;">
                    <div class="box-title">6. ความเห็นของหัวหน้าเจ้าหน้าที่ เห็นควรดำเนินการจัดซื้อด้วยวิธี</div>
                    <div style="padding-left: 4px; line-height: 1.18;">
                        <span class="chk-box">(&nbsp;/&nbsp;) วิธีเฉพาะเจาะจง</span> &nbsp;
                        <span class="chk-box">(&nbsp;&nbsp;&nbsp;) วิธีคัดเลือก</span> &nbsp;
                        <span class="chk-box">(&nbsp;&nbsp;&nbsp;) วิธีประกาศเชิญชวนทั่วไป</span>................<br>
                        - จัดซื้อโดยการจ่ายตรงให้กับผู้ค้าจำนวน <span class="dotted-line" style="min-width: 25px; text-align: center;" contenteditable="true">&nbsp;{{ $itemsCount }}&nbsp;</span> รายการ ดังนี้ <span contenteditable="true">................................</span><br>
                        - จัดซื้อโดยการยืมเงินจำนวน <span class="dotted-line" style="min-width: 25px; text-align: center;" contenteditable="true">&nbsp;&nbsp;</span> รายการ ดังนี้ <span contenteditable="true">................................</span><br>
                        โดยมอบหมายให้บุคคลที่มีรายชื่อดังต่อไปนี้ ปฏิบัติหน้าที่เป็น<br>
                        (1) <span contenteditable="true" style="outline: none; font-weight: bold;">{{ $cleanProposerName }}</span> เป็นผู้ดำเนินการยืมเงินในครั้งนี้<br>
                        (2) คณะกรรมการกำหนดร่างขอบเขตงานฯ <span contenteditable="true" style="outline: none;">{{ $pChair ? $pChair : '........................................................' }}</span> ประธานกรรมการ<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span contenteditable="true" style="outline: none;">{{ $pMem1 ? $pMem1 : '..................................................' }}</span> กรรมการ <span contenteditable="true" style="outline: none;">{{ $pMem2 ? $pMem2 : '..................................................' }}</span> กรรมการ<br>
                        (3) คณะกรรมการตรวจรับพัสดุ <span contenteditable="true" style="outline: none;">{{ $iChair ? $iChair : '......................................................' }}</span> ประธานกรรมการ<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span contenteditable="true" style="outline: none;">{{ $iMem1 ? $iMem1 : '..................................................' }}</span> กรรมการ <span contenteditable="true" style="outline: none;">{{ $iMem2 ? $iMem2 : '..................................................' }}</span> กรรมการ
                    </div>
                    <div style="text-align: center; margin-top: 5px;">
                        <div>ลงชื่อ............................................................</div>
                        <div style="margin-top: 1px;">( <span contenteditable="true" style="outline: none;">{{ $procHeadName }}</span> ) &nbsp;&nbsp; ........./............/............</div>
                    </div>
                </td>
            </tr>

            <!-- Row 3: Box 3 (Left - Tall) -->
            <tr>
                <!-- 3. ความเห็นหัวหน้างานพัฒนายุทธศาสตร์แผนงานและงบประมาณ -->
                <td style="padding: 3px 6px;">
                    <div class="box-title">3. ความเห็นหัวหน้างานพัฒนายุทธศาสตร์แผนงานและงบประมาณ</div>
                    <div style="padding-left: 4px; line-height: 1.18;">
                        ตรวจสอบแล้ว &nbsp; <span class="chk-box">(&nbsp;/&nbsp;) มีในแผน</span> &nbsp; <span class="chk-box">(&nbsp;&nbsp;&nbsp;) ไม่มีในแผน ปรับแผนฯ</span><br>
                        งปม.ที่ได้รับจาก สอศ. <span class="dotted-line" style="min-width: 80px;" contenteditable="true">&nbsp;</span> บาท คงเหลือ <span class="dotted-line" style="min-width: 75px;" contenteditable="true">&nbsp;</span> บาท<br>
                        เงินจัดสรรงบโครงการ/งาน/กิจกรรม <span class="dotted-line" style="min-width: 70px;" contenteditable="true">&nbsp;{{ number_format($budgetAllocated, 2) }}</span> บาท คงเหลือ <span class="dotted-line" style="min-width: 65px;" contenteditable="true">&nbsp;{{ number_format($budgetRemaining, 2) }}</span> บาท<br>
                        จำนวนที่ขออนุมัติจัดซื้อครั้งนี้ <span class="dotted-line" style="min-width: 100px;" contenteditable="true">&nbsp;{{ number_format($finalProcAmount, 2) }}</span> บาท<br>
                        โดยใช้เงินงบประมาณ &nbsp; <span class="chk-box">(&nbsp;&nbsp;&nbsp;) รายได้สถานศึกษา</span> &nbsp; <span class="chk-box">(&nbsp;&nbsp;&nbsp;) งปม.</span>..........................<br>
                        <span class="chk-box">(&nbsp;/&nbsp;) เงินอุดหนุน</span> <span class="dotted-line" style="min-width: 80px;" contenteditable="true">&nbsp;{{ number_format($finalProcAmount, 2) }}&nbsp;</span> &nbsp; <span class="chk-box">(&nbsp;&nbsp;&nbsp;) อื่น ๆ</span> ..........................
                    </div>
                    <div style="text-align: center; margin-top: 5px;">
                        <div>ลงชื่อ............................................................</div>
                        <div style="margin-top: 1px;">( <span contenteditable="true" style="outline: none;">{{ $planHeadName }}</span> ) &nbsp;&nbsp; ........./............/............</div>
                    </div>
                </td>
            </tr>

            <!-- Row 4: Box 4 (Left) & Box 7 (Right) -->
            <tr>
                <!-- 4. ความเห็นรองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน -->
                <td style="padding: 3px 6px;">
                    <div class="box-title">4. ความเห็นรองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน</div>
                    <div style="padding-left: 6px; line-height: 1.2;">
                        <span class="chk-box">(&nbsp;/&nbsp;) ได้ตรวจสอบแล้วมีงบประมาณแผน</span> &nbsp; <span class="chk-box">(&nbsp;/&nbsp;) เห็นควรอนุมัติ</span><br>
                        <span class="chk-box">(&nbsp;&nbsp;&nbsp;) เหตุผล</span>........................................................................................................
                    </div>
                    <div style="text-align: center; margin-top: 5px;">
                        <div>ลงชื่อ............................................................</div>
                        <div style="margin-top: 1px;">( <span contenteditable="true" style="outline: none;">{{ $planDeputyName }}</span> ) &nbsp;&nbsp; ........./............/............</div>
                    </div>
                </td>

                <!-- 7. ความเห็นรองผู้อำนวยการฝ่ายบริหารทรัพยากร -->
                <td style="padding: 3px 6px;">
                    <div class="box-title">7. ความเห็นรองผู้อำนวยการฝ่ายบริหารทรัพยากร</div>
                    <div style="padding-left: 6px; line-height: 1.2;">
                        เรียน ผู้อำนวยการฯ<br>
                        <span class="chk-box">(&nbsp;&nbsp;&nbsp;) มีข้อมูลครบถ้วน และมีงบประมาณเพียงพอ</span><br>
                        <span class="chk-box">(&nbsp;&nbsp;&nbsp;) เห็นควรอนุมัติ</span>
                    </div>
                    <div style="text-align: center; margin-top: 5px;">
                        <div>ลงชื่อ............................................................</div>
                        <div style="margin-top: 1px;">( <span contenteditable="true" style="outline: none;">{{ $resourceDeputyName }}</span> ) &nbsp;&nbsp; ........./............/............</div>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Bottom Section: คำสั่งผู้อำนวยการ (Matching Image) -->
    <div class="director-order-box">
        <div style="font-weight: bold; font-size: 12pt; margin-bottom: 2px;">คำสั่งผู้อำนวยการ</div>
        <div style="margin-bottom: 1px;">
            <span class="chk-box">(&nbsp;&nbsp;&nbsp;) ทราบ</span> &nbsp;&nbsp;&nbsp;&nbsp; 
            <span class="chk-box">(&nbsp;&nbsp;&nbsp;) อนุมัติ ตามงบประมาณที่ขอจัดซื้อ และคณะกรรมการฯ รายชื่อตามเสนอข้างต้น</span>
        </div>
        <div style="margin-bottom: 2px;">
            <span class="chk-box">(&nbsp;&nbsp;&nbsp;) ไม่อนุมัติเพราะ</span> ........................................................................................................................
        </div>

        <div style="text-align: center; margin-top: 4px;">
            <div>ลงชื่อ............................................................</div>
            <div style="margin-top: 1px;">( <span contenteditable="true" style="outline: none;">{{ $directorName }}</span> )</div>
            <div style="margin-top: 1px; font-weight: bold;">ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน</div>
            <div style="font-size: 11pt; margin-top: 1px;">............../....................../................</div>
        </div>
    </div>

    <script>
        const deputiesData = @json($deputyOptions);

        function changeUnit(unitName) {
            const select = document.getElementById('unit-select');
            const selectedOpt = select.options[select.selectedIndex];
            const parentDiv = selectedOpt ? selectedOpt.getAttribute('data-parent') : '';

            // Update Header
            const headerUnit = document.getElementById('unit-header-text');
            if (headerUnit) headerUnit.innerText = unitName;

            // Update Body
            const bodyUnit = document.getElementById('body-unit-text');
            if (bodyUnit) bodyUnit.innerText = unitName;

            // Update Box 1 Title
            const box1Title = document.getElementById('box1-title-text');
            if (box1Title) {
                if (unitName.startsWith('งาน')) {
                    box1Title.innerText = '1. ความเห็น หัวหน้า' + unitName;
                } else if (unitName.startsWith('สาขาวิชา') || unitName.startsWith('แผนกวิชา')) {
                    box1Title.innerText = '1. ความเห็น หัวหน้าแผนกวิชา' + unitName.replace(/^(สาขาวิชา(งาน)?|แผนกวิชา)/, '');
                } else {
                    box1Title.innerText = '1. ความเห็น หัวหน้าแผนก/งาน ' + unitName;
                }
            }

            // Auto-align Deputy if parent division exists
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

        function changeDeputy(key) {
            if (key === 'custom') {
                const currentName = document.getElementById('box2-name-text').innerText;
                const customName = prompt('ระบุชื่อ-สกุล รองผู้อำนวยการฝ่าย:', currentName);
                if (customName !== null && customName.trim() !== '') {
                    document.getElementById('box2-name-text').innerText = customName.trim();
                }
                return;
            }

            const data = deputiesData[key];
            if (data) {
                document.getElementById('box2-name-text').innerText = data.name;
                const cleanDivName = data.division.replace('ฝ่าย', '');
                document.getElementById('box2-div-text').innerText = cleanDivName;
                document.getElementById('division-header-text').innerText = cleanDivName;
            }
        }

        // Clickable interactive checkboxes
        document.querySelectorAll('.chk-box').forEach(el => {
            el.addEventListener('click', function() {
                const txt = this.innerHTML;
                if (txt.includes('/') || txt.includes('&#x2713;') || txt.includes('✓')) {
                    this.innerHTML = '(&nbsp;&nbsp;&nbsp;)' + txt.substring(txt.indexOf(')') + 1);
                } else {
                    this.innerHTML = '(&nbsp;/&nbsp;)' + txt.substring(txt.indexOf(')') + 1);
                }
            });
        });
    </script>
</body>
</html>
