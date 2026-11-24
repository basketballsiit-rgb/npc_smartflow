@php
    $formatValue = function ($val) {
        if (is_array($val)) {
            $items = [];
            foreach ($val as $k => $v) {
                if (is_string($v) || is_numeric($v)) {
                    $items[] = (is_numeric($k) ? '• ' : '') . trim((string)$v);
                } elseif (is_array($v)) {
                    $items[] = json_encode($v, JSON_UNESCAPED_UNICODE);
                }
            }
            return implode("\n", $items);
        }
        return (string)($val ?? '');
    };

    $cleanPersonName = function ($name) {
        if (!$name) return '';
        $cleaned = preg_replace('/\s*\([^)]*\)/u', '', (string)$name);
        return trim(trim($cleaned), "()");
    };

    $cleanPositionText = function ($pos) {
        if (!$pos) return '';
        if (str_contains($pos, '/')) {
            $parts = array_filter(array_map('trim', explode('/', $pos)));
            $pos = reset($parts) ?: $pos;
        }
        $pos = preg_replace('/\s*\([^)]*ฝ่าย[^)]*\)/u', '', $pos);
        $pos = preg_replace('/\s*\(ฝ่ายวิชาการ\)/u', '', $pos);
        return trim($pos);
    };

    $inputDateParam = request('date') ?: (request('sig_date') ?: date('Y-m-d'));
    $timestamp = strtotime($inputDateParam) ?: time();
    $isoDateParam = date('Y-m-d', $timestamp);

    $fiscalYear = $project->academic_year ?: (date('Y') + 543);
    $thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    $actSigDateInitial = 'วันที่ ' . date('j', $timestamp) . ' เดือน ' . $thaiMonths[(int)date('n', $timestamp)] . ' พ.ศ. ' . (date('Y', $timestamp) + 543);
    $todayDateOfficial = $actSigDateInitial;

    $formatThaiDate = function ($dateVal) use ($thaiMonths) {
        if (!$dateVal) return '-';
        try {
            $c = \Carbon\Carbon::parse($dateVal);
            return $c->day . ' ' . $thaiMonths[$c->month] . ' ' . ($c->year + 543);
        } catch (\Throwable $e) {
            return (string)$dateVal;
        }
    };

    $formatSignatureDate = function ($dateVal) use ($thaiMonths) {
        if (!$dateVal) return 'วันที่ ........ เดือน .................... พ.ศ. ............';
        try {
            $c = \Carbon\Carbon::parse($dateVal);
            return 'วันที่ ' . $c->day . ' เดือน ' . $thaiMonths[$c->month] . ' พ.ศ. ' . ($c->year + 543);
        } catch (\Throwable $e) {
            return 'วันที่ ........ เดือน .................... พ.ศ. ............';
        }
    };

    $subjectText = 'ขออนุญาตดำเนินกิจกรรม ' . ($activity['name'] ?? '') . ' ภายใต้โครงการ ' . ($project->title ?? '');

    // Approvals resolution
    $sig1 = $approvalsByStep[1] ?? null;
    $sig2 = $approvalsByStep[2] ?? null;
    $sig3 = $approvalsByStep[3] ?? null;
    $sig4 = $approvalsByStep[4] ?? null;
    $sig5 = $approvalsByStep[5] ?? null;
    $sig6 = $approvalsByStep[6] ?? null;

    $isFastTrackApproval = function ($sig) {
        if (!$sig) return false;
        if (($sig->signature_type ?? '') === 'fast_track' || ($sig->signature_type ?? '') === 'admin') return true;
        $comments = $sig->comments ?? '';
        if (str_contains($comments, 'รวดเดียว') || str_contains($comments, 'Fast-Track') || str_contains($comments, 'fast-track') || str_contains($comments, 'อนุมัติโดยผู้ดูแลระบบ')) {
            return true;
        }
        return false;
    };

    // Uniform signing date matching Image 2 & Print.jsx
    $uniformSourceDate = $sig6?->signed_at ?: ($sig1?->signed_at ?: $project->created_at);
    $sigDateUniform = $formatSignatureDate($uniformSourceDate);

    // 1. ผู้เสนอโครงการ
    $sig1Name = (!empty($sig1?->user?->name) && !$isFastTrackApproval($sig1))
        ? $cleanPersonName($sig1->user->name)
        : $signers['project_responsible']['name'];
    $sig1Pos = $defaultProjPos;
    $sig1Img = $sig1?->signature_data ?: ($project->user?->signature_data ?: ($signers['project_responsible']['signature_data'] ?? null));
    $sig1Date = $sigDateUniform;

    // 2. หัวหน้างาน / หัวหน้าแผนกวิชา
    $sig2Name = (!empty($sig2?->user?->name) && !$isFastTrackApproval($sig2))
        ? $cleanPersonName($sig2->user->name)
        : ($resolvedHead['name'] ?? '........................................');
    $sig2Pos = (!$isFastTrackApproval($sig2) && $sig2?->acting_position_text)
        ? $sig2->acting_position_text
        : ($resolvedHead['position'] ?? 'หัวหน้างาน / หัวหน้าแผนกวิชา');
    $sig2Img = ($sig2?->signature_data && !$isFastTrackApproval($sig2)) ? $sig2->signature_data : null;
    $sig2Date = $sigDateUniform;

    // 4. ผู้เห็นชอบโครงการ: รองผู้อำนวยการฝ่ายที่กำกับดูแล
    $parentName = $project->department?->parent?->name ?? '';
    $curDeptName = $project->department?->name ?? '';
    $combinedDept = "{$parentName} {$curDeptName}";

    $sig4Name = (!empty($sig4?->user?->name) && !$isFastTrackApproval($sig4) && $sig4->user_id !== $project->user_id)
        ? $cleanPersonName($sig4->user->name)
        : ($project->department?->deputy_director_name
            ?: (str_contains($combinedDept, 'บริหารทรัพยากร')
                ? ($collegeSettings['resource_deputy_name'] ?? 'นายจักรพงศ์ พรหมสกุลปัญญา')
                : ($collegeSettings['academic_deputy_name'] ?? 'นายนิพนธ์ ร่องพืช')));

    $sig4Pos = (!$isFastTrackApproval($sig4) && $sig4?->acting_position_text)
        ? $sig4->acting_position_text
        : ($project->department?->deputy_director_position
            ?: (str_contains($combinedDept, 'บริหารทรัพยากร')
                ? ($collegeSettings['resource_deputy_position'] ?? 'รองผู้อำนวยการฝ่ายบริหารทรัพยากร')
                : ($collegeSettings['academic_deputy_position'] ?? 'รองผู้อำนวยการฝ่ายวิชาการ')));

    $sig4Img = ($sig4?->signature_data && !$isFastTrackApproval($sig4) && $sig4->user_id !== $project->user_id)
        ? $sig4->signature_data
        : (str_contains($combinedDept, 'บริหารทรัพยากร')
            ? ($collegeSettings['resource_deputy_signature'] ?? null)
            : ($collegeSettings['academic_deputy_signature'] ?? null));
    $sig4Date = $sigDateUniform;

    // 3. ผู้ตรวจสอบโครงการ: หัวหน้างานพัฒนายุทธศาสตร์ แผนงานและงบประมาณ
    $sig3Name = (!empty($sig3?->user?->name) && !$isFastTrackApproval($sig3))
        ? $cleanPersonName($sig3->user->name)
        : ($collegeSettings['plan_head_name'] ?? 'นายพิพัฒน์ สีมา');
    $sig3Pos = (!$isFastTrackApproval($sig3) && $sig3?->acting_position_text)
        ? $sig3->acting_position_text
        : ($collegeSettings['plan_head_position'] ?? 'หัวหน้างานพัฒนายุทธศาสตร์ แผนงานและงบประมาณ');
    $sig3Img = ($sig3?->signature_data && !$isFastTrackApproval($sig3))
        ? $sig3->signature_data
        : ($collegeSettings['plan_head_signature'] ?? null);
    $sig3Date = $sigDateUniform;

    // 5. ผู้เห็นชอบโครงการ: รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน
    $sig5Name = (!empty($sig5?->user?->name) && !$isFastTrackApproval($sig5) && $sig5->user_id !== $project->user_id)
        ? $cleanPersonName($sig5->user->name)
        : ($collegeSettings['plan_deputy_name'] ?? 'นายนิพนธ์ ร่องพืช');
    $sig5Pos = (!$isFastTrackApproval($sig5) && $sig5?->acting_position_text)
        ? $sig5->acting_position_text
        : ($collegeSettings['plan_deputy_position'] ?? 'รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน');
    $sig5Img = ($sig5?->signature_data && !$isFastTrackApproval($sig5) && $sig5->user_id !== $project->user_id)
        ? $sig5->signature_data
        : ($collegeSettings['plan_deputy_signature'] ?? null);
    $sig5Date = $sigDateUniform;

    // Resource Deputy: ผู้เห็นชอบโครงการ (รองผู้อำนวยการฝ่ายบริหารทรัพยากร)
    $resourceDeputyName = ($resourceDeputySig && !$isFastTrackApproval($resourceDeputySig) && $resourceDeputySig->user?->name)
        ? $cleanPersonName($resourceDeputySig->user->name)
        : ($collegeSettings['resource_deputy_name'] ?? 'นายจักรพงศ์ พรหมสกุลปัญญา');
    $resourceDeputyPos = ($resourceDeputySig && !$isFastTrackApproval($resourceDeputySig) && $resourceDeputySig->acting_position_text)
        ? $resourceDeputySig->acting_position_text
        : ($collegeSettings['resource_deputy_position'] ?? 'รองผู้อำนวยการฝ่ายบริหารทรัพยากร');
    $resourceDeputyImg = ($resourceDeputySig && !$isFastTrackApproval($resourceDeputySig) && $resourceDeputySig->signature_data)
        ? $resourceDeputySig->signature_data
        : ($collegeSettings['resource_deputy_signature'] ?? null);
    $resourceDeputyDate = $sigDateUniform;

    // 6. ผู้อนุมัติโครงการ: ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน
    $sig6Name = (!empty($sig6?->user?->name) && !$isFastTrackApproval($sig6))
        ? $cleanPersonName($sig6->user->name)
        : ($collegeSettings['director_name'] ?? 'นายกเชษฐ์ กิ่งชนะ');
    $sig6Pos = (!$isFastTrackApproval($sig6) && $sig6?->acting_position_text)
        ? $sig6->acting_position_text
        : ($collegeSettings['director_position'] ?? ('ผู้อำนวยการ' . $collegeName));
    $sig6Img = ($sig6?->signature_data && !$isFastTrackApproval($sig6))
        ? $sig6->signature_data
        : ($collegeSettings['director_signature'] ?? null);
    $sig6Date = $sigDateUniform;

    // Categories
    $getSelectedCategoryItems = function ($cat) use ($project) {
        if (!$cat || !$cat->items || count($cat->items) === 0) return [];
        $selectedIds = $project->strategy_selections[$cat->id] ?? ($project->strategy_selections[(string)$cat->id] ?? []);
        if (is_array($selectedIds) && count($selectedIds) > 0) {
            return $cat->items->filter(fn($item) => in_array($item->id, $selectedIds) || in_array((string)$item->id, $selectedIds))->values();
        }
        $catCode = strtoupper($cat->code ?? '');
        if ($catCode === 'IQA' && is_array($project->iqa_strategy_ids)) {
            return $cat->items->filter(fn($item) => in_array($item->id, $project->iqa_strategy_ids))->values();
        }
        if ($catCode === 'OVEC' && is_array($project->ovec_strategy_ids)) {
            return $cat->items->filter(fn($item) => in_array($item->id, $project->ovec_strategy_ids))->values();
        }
        return $cat->items->slice(0, 1);
    };

    // Arrays & Action Plan Data
    $outputs = is_array($project->outputs) ? $project->outputs : [];
    $outcomes = is_array($project->outcomes) ? $project->outcomes : [];
    $expected_benefits = is_array($project->expected_benefits) ? $project->expected_benefits : [];
    $action_plan = is_array($project->action_plan) ? $project->action_plan : [];

    $defaultStandardSteps = [
        [
            'step_name' => '1. ประชุมวางแผนเพื่อจัดทำโครงการ/กิจกรรม',
            'q1' => true, 'q2' => false, 'q3' => false, 'q4' => false,
            'target_count' => '1 ครั้ง',
            'location_name' => $project->location ?: $collegeName,
            'budget_operating' => 0, 'budget_investment' => 0, 'budget_other' => 0, 'budget_subsidy' => 0,
        ],
        [
            'step_name' => '2. ดำเนินการเขียนโครงการเพื่อของบประมาณ ออกคำสั่งวิทยาลัย เชิญคณะกรรมการโครงการประชุมกำหนดวันและสถานที่',
            'q1' => true, 'q2' => false, 'q3' => false, 'q4' => false,
            'target_count' => '1 ครั้ง',
            'location_name' => $project->location ?: $collegeName,
            'budget_operating' => 0, 'budget_investment' => 0, 'budget_other' => 0, 'budget_subsidy' => 0,
        ],
        [
            'step_name' => '3. ดำเนินการตามกิจกรรมและโครงการ',
            'q1' => false, 'q2' => true, 'q3' => false, 'q4' => false,
            'target_count' => 'ตามกลุ่มเป้าหมาย',
            'location_name' => $project->location ?: $collegeName,
            'budget_operating' => (float)($totalProjectBudget ?: $project->estimated_budget), 'budget_investment' => 0, 'budget_other' => 0, 'budget_subsidy' => 0,
        ],
        [
            'step_name' => '4. สรุปประเมินโครงการและรายงานผล ปัญหา อุปสรรค โครงการให้กับคณะผู้บริหาร',
            'q1' => false, 'q2' => false, 'q3' => false, 'q4' => true,
            'target_count' => '1 เล่ม',
            'location_name' => $project->location ?: $collegeName,
            'budget_operating' => 0, 'budget_investment' => 0, 'budget_other' => 0, 'budget_subsidy' => 0,
        ],
    ];

    $planSteps = (count($action_plan) >= 4) ? $action_plan : $defaultStandardSteps;

    // Totals for Action Plan Table
    $sumOperating = 0;
    $sumInvestment = 0;
    $sumOther = 0;
    $sumSubsidy = 0;
    foreach ($planSteps as $st) {
        $sumOperating += (float)($st['budget_operating'] ?? 0);
        $sumInvestment += (float)($st['budget_investment'] ?? 0);
        $sumOther += (float)($st['budget_other'] ?? 0);
        $sumSubsidy += (float)($st['budget_subsidy'] ?? 0);
    }
    $grandTotalSteps = $sumOperating + $sumInvestment + $sumOther + $sumSubsidy;
    if ($grandTotalSteps == 0 && (float)($project->estimated_budget ?? 0) > 0) {
        $sumOperating = (float)$project->estimated_budget;
        $grandTotalSteps = $sumOperating;
    }

    // Indicators Data
    $indicators = is_array($project->indicators) ? $project->indicators : [];
    $targetQuant = is_array($project->targets['quantitative'] ?? null)
        ? implode("\n", $project->targets['quantitative'])
        : ($project->targets['quantitative'] ?? 'ผู้เข้าร่วมโครงการบรรลุตามเป้าหมายที่กำหนด คิดเป็นร้อยละ 100');
    $quantText = $indicators['quantitative']['text'] ?? $targetQuant;
    $quantUnit = $indicators['quantitative']['unit'] ?? (is_array($project->targets['quantitative'] ?? null) ? (count($project->targets['quantitative']) . ' รายการ') : '100%');

    $targetQual = is_array($project->targets['qualitative'] ?? null)
        ? implode("\n", $project->targets['qualitative'])
        : ($project->targets['qualitative'] ?? 'ผู้เข้าร่วมมีความพึงพอใจต่อการดำเนินงานและได้รับความรู้ทักษะเพิ่มขึ้นในระดับดีมาก');
    $qualText = $indicators['qualitative']['text'] ?? $targetQual;
    $qualUnit = $indicators['qualitative']['unit'] ?? 'ร้อยละ 90';

    $timeText = $indicators['time']['text'] ?? ('ดำเนินโครงการแล้วเสร็จตามระยะเวลาและปฏิทินปฏิบัติงาน ประจำปีงบประมาณ พ.ศ. ' . $fiscalYear);
    $timeUnit = $indicators['time']['unit'] ?? '1 ปีการศึกษา';

    $costText = $indicators['cost']['text'] ?? ('ประมาณการค่าใช้จ่ายในการดำเนินโครงการ' . ($project->title ?? ''));
    $costUnit = $indicators['cost']['unit'] ?? (number_format((float)($project->estimated_budget ?: $totalProjectBudget), 0) . ' บาท');
@endphp
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>ชุดเอกสารขออนุญาตดำเนินกิจกรรม - {{ $activity['name'] ?? '' }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4 portrait;
            margin: 0;
        }
        * {
            box-sizing: border-box;
        }
        body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: "TH Sarabun New", "TH Sarabun PSK", "Sarabun", sans-serif;
            color: #000000;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* Screen Toolbar */
        .toolbar {
            position: sticky;
            top: 0;
            z-index: 50;
            background: linear-gradient(90deg, #1e1b4b, #312e81, #4c1d95);
            color: #ffffff;
            padding: 10px 20px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
            font-family: "Sarabun", sans-serif;
        }
        .toolbar-top {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }
        .toolbar-title {
            font-size: 14px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .toolbar-checks {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 12px;
            font-size: 12px;
            color: #e0e7ff;
            margin-top: 4px;
        }
        .toolbar-checks label {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            font-weight: 500;
        }
        .toolbar-actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
        }
        .btn {
            border: none;
            border-radius: 8px;
            padding: 7px 14px;
            font-size: 13px;
            font-weight: 700;
            font-family: "Sarabun", sans-serif;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s ease;
        }
        .btn-ai {
            background: linear-gradient(135deg, #f59e0b, #ea580c);
            color: #ffffff;
        }
        .btn-ai:hover { filter: brightness(1.08); }
        .btn-ai:disabled { opacity: 0.6; cursor: wait; }
        .btn-secondary {
            background: rgba(255, 255, 255, 0.16);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .btn-secondary:hover { background: rgba(255, 255, 255, 0.25); }
        .btn-print {
            background: #10b981;
            color: #ffffff;
        }
        .btn-print:hover { background: #059669; }

        /* Toolbar Position Selectors Row */
        .toolbar-positions {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.18);
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 16px;
            font-size: 12px;
        }
        .pos-select-group {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .pos-select-label {
            font-weight: 600;
            color: #fde68a;
        }
        .pos-select {
            background: #ffffff;
            color: #1e1b4b;
            font-size: 12px;
            font-weight: 700;
            font-family: "Sarabun", sans-serif;
            border: 1px solid #c7d2fe;
            border-radius: 6px;
            padding: 3px 8px;
            cursor: pointer;
            outline: none;
        }

        /* Official A4 Pages */
        .a4-page {
            width: 210mm;
            min-height: 297mm;
            margin: 18px auto 26px auto;
            padding: 20mm 20mm 18mm 25mm;
            background: #ffffff;
            box-shadow: 0 10px 28px rgba(15, 23, 42, 0.18);
            font-size: 15.5pt;
            line-height: 1.38;
            position: relative;
            box-sizing: border-box;
        }

        .table-page-break {
            page-break-before: always;
            break-before: page;
        }

        /* PART 1: Cover Memo STRICT 1-PAGE RULE */
        #sectionPart1 {
            width: 210mm;
            max-height: 297mm;
            overflow: hidden;
            padding: 12mm 20mm 10mm 25mm !important;
            font-size: 14.5pt;
            line-height: 1.3;
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .page-break {
            page-break-before: always;
            break-before: page;
        }
        .section-badge-screen {
            position: absolute;
            top: 6px;
            right: 12px;
            font-family: "Sarabun", sans-serif;
            font-size: 11px;
            font-weight: 700;
            background: #eef2ff;
            color: #3730a3;
            border: 1px solid #c7d2fe;
            padding: 2px 10px;
            border-radius: 999px;
        }

        .editable {
            outline: none;
            border-radius: 3px;
            transition: background-color 0.15s;
        }
        .editable:hover { background-color: rgba(99, 102, 241, 0.08); }
        .editable:focus {
            background-color: rgba(254, 243, 199, 0.55);
            box-shadow: 0 0 0 1px #f59e0b;
        }

        /* Memo Header */
        .memo-header {
            position: relative;
            min-height: 1.5cm;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            margin-bottom: 4px;
        }
        .garuda-logo {
            position: absolute;
            left: 0;
            top: 0;
            height: 1.45cm;
            width: auto;
        }
        .memo-title {
            font-size: 28pt;
            font-weight: 700;
            line-height: 1.05;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }
        .meta-row {
            display: flex;
            align-items: baseline;
            width: 100%;
            margin-bottom: 2px;
            font-size: 14.5pt;
            line-height: 1.3;
        }
        .meta-label {
            font-weight: 700;
            white-space: nowrap;
            margin-right: 6px;
        }
        .meta-dotted {
            flex: 1;
            border-bottom: 1px dotted #000000;
            padding: 0 4px 1px 4px;
            min-height: 20px;
        }
        .meta-split {
            display: flex;
            align-items: baseline;
            width: 100%;
            gap: 14px;
        }
        .meta-col-left, .meta-col-right {
            flex: 1;
            display: flex;
            align-items: baseline;
        }
        .subject-divider {
            border: none;
            border-top: 1.2px solid #000000;
            margin: 4px 0 8px 0;
        }
        .salutation { margin-bottom: 6px; font-size: 14.5pt; }
        .salutation-label { font-weight: 700; margin-right: 6px; }
        .body-paragraph {
            text-indent: 2.5cm;
            text-align: justify;
            text-justify: inter-cluster;
            margin: 0 0 6px 0;
            font-size: 14.5pt;
            line-height: 1.35;
        }
        .closing-paragraph {
            text-indent: 2.5cm;
            margin: 4px 0 12px 0;
            font-size: 14.5pt;
        }

        /* Part 1: 4 Compact Signature Rows */
        .memo-signatures {
            margin-top: 10px;
            width: 100%;
            font-size: 14pt;
            line-height: 1.25;
        }
        .memo-sig-right {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 12px;
        }
        .memo-sig-two {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 12px;
        }
        .memo-sig-box {
            width: 48%;
            text-align: center;
        }
        .memo-sig-space {
            min-height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Proposal Official Document Styling (Part 2 & Part 3) */
        .doc-header {
            text-align: center;
            font-weight: 700;
            margin-bottom: 16px;
        }
        .doc-header h1 {
            font-size: 18pt;
            font-weight: 700;
            margin: 0 0 4px 0;
            line-height: 1.3;
        }
        .doc-header-divider {
            border-bottom: 2px solid #000000;
            width: 220px;
            margin: 6px auto;
        }
        .doc-header h2 {
            font-size: 16pt;
            font-weight: 700;
            margin: 4px 0 0 0;
            line-height: 1.3;
        }

        .sec-title {
            font-size: 16pt;
            font-weight: 700;
            margin-top: 14px;
            margin-bottom: 4px;
        }
        .sec-content {
            padding-left: 24px;
            font-size: 15.5pt;
            line-height: 1.42;
            text-align: justify;
            text-justify: inter-cluster;
        }
        .sec-content p {
            margin: 2px 0;
        }
        .thai-indent {
            text-indent: 2.5cm;
            margin-bottom: 6px;
            line-height: 1.45;
        }

        /* Official Tables */
        .official-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000000;
            font-size: 13.5pt;
            margin: 8px 0;
            line-height: 1.25;
        }
        .official-table th, .official-table td {
            border: 1px solid #000000;
            padding: 4px 6px;
        }
        .official-table th {
            background-color: #f8fafc;
            font-weight: 700;
            text-align: center;
        }

        .signature-img {
            max-height: 44px;
            max-width: 140px;
            object-fit: contain;
            mix-blend-mode: multiply;
        }

        .hidden-section {
            display: none !important;
        }

        @media print {
            body { background: #ffffff !important; }
            .toolbar, .section-badge-screen, .no-print { display: none !important; }
            .a4-page {
                margin: 0 !important;
                box-shadow: none !important;
                width: 210mm !important;
                min-height: 297mm !important;
                padding: 18mm 18mm 16mm 25mm !important;
            }
            #sectionPart1 {
                padding: 12mm 18mm 10mm 25mm !important;
                max-height: 297mm !important;
                overflow: hidden !important;
                page-break-after: always !important;
                break-after: page !important;
            }
            .table-page-break {
                page-break-before: always !important;
                break-before: page !important;
            }
            .official-table {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            .editable:hover, .editable:focus {
                background: transparent !important;
                box-shadow: none !important;
            }
        }
    </style>
</head>
<body>
    <!-- Interactive Toolbar (Screen Only) -->
    <div class="toolbar no-print">
        <div class="toolbar-top">
            <div>
                <div class="toolbar-title">
                    <span>📄</span>
                    <span>ชุดเอกสารขออนุญาตดำเนินกิจกรรม (แบบฟอร์มราชการ Sarabun)</span>
                </div>
                <div class="toolbar-checks">
                    <label><input type="checkbox" id="chkPart1" checked onchange="toggleSections()"> ส่วนที่ 1: บันทึกข้อความขออนุญาต (ปะหน้า 1 หน้า A4)</label>
                    <label><input type="checkbox" id="chkPart2" checked onchange="toggleSections()"> ส่วนที่ 2: แบบเสนอโครงการหลัก (12 หมวด ฉบับสมบูรณ์)</label>
                    <label><input type="checkbox" id="chkPart3" checked onchange="toggleSections()"> ส่วนที่ 3: แบบเสนอรายละเอียดกิจกรรม (12 หมวด ลงนามเฉพาะผู้รับผิดชอบกิจกรรม)</label>
                </div>
            </div>
            <div class="toolbar-actions">
                <button type="button" id="btnAiRedraft" class="btn btn-ai" onclick="regenerateAiMemo()">
                    <span>✨</span>
                    <span id="btnAiText">ให้ AI เรียบเรียงบันทึกข้อความใหม่</span>
                </button>
                <button type="button" class="btn btn-secondary" onclick="toggleThaiDigits()">
                    <span>🔢</span>
                    <span id="btnDigitText">แปลงเลขไทย</span>
                </button>
                <button type="button" class="btn btn-print" onclick="window.print()">
                    <span>🖨️</span>
                    <span>พิมพ์ทั้งชุด / บันทึก PDF</span>
                </button>
            </div>
        </div>

        <!-- Position & Date Selector Row -->
        <div class="toolbar-positions" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;">
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 14px;">
                <div class="date-select-group" style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.12); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.25);">
                    <span class="pos-select-label" style="color: #fde68a;">📅 วันที่ลงนามกิจกรรม:</span>
                    <input type="date" id="inputActivityDate" class="pos-select" value="{{ $isoDateParam }}" onchange="onActivityDateChange(this.value)" style="padding: 2px 6px; cursor: pointer;">
                    <button type="button" class="btn btn-secondary" style="padding: 2px 8px; font-size: 11px; height: 26px; line-height: 1;" onclick="setActivityDatePreset('today')" title="ตั้งเป็นวันนี้">วันนี้</button>
                    <button type="button" class="btn btn-secondary" style="padding: 2px 8px; font-size: 11px; height: 26px; line-height: 1;" onclick="setActivityDatePreset('blank')" title="เว้นว่างให้เขียนด้วยมือ">เว้นว่าง</button>
                    <label style="color: #cbd5e1; font-size: 11px; display: inline-flex; align-items: center; gap: 4px; margin-left: 6px; cursor: pointer;">
                        <input type="checkbox" id="syncMemoDate" checked style="cursor: pointer;"> ปรับวันที่ในบันทึกข้อความ (ส่วนที่ 1) ด้วย
                    </label>
                </div>

                @if(count($actUserPositions) > 1)
                    <div class="pos-select-group">
                        <span class="pos-select-label">🏢 ตำแหน่งผู้รับผิดชอบกิจกรรม:</span>
                        <select id="selectActPos" class="pos-select" onchange="applyPositionChange('act', this.value)">
                            @foreach($actUserPositions as $pIdx => $pVal)
                                <option value="{{ $pVal }}" {{ $pVal === $defaultActPos ? 'selected' : '' }}>{{ $pVal }}</option>
                            @endforeach
                        </select>
                    </div>
                @endif
                @if(count($projUserPositions) > 1)
                    <div class="pos-select-group">
                        <span class="pos-select-label">🏢 ตำแหน่งผู้รับผิดชอบโครงการ:</span>
                        <select id="selectProjPos" class="pos-select" onchange="applyPositionChange('proj', this.value)">
                            @foreach($projUserPositions as $pIdx => $pVal)
                                <option value="{{ $pVal }}" {{ $pVal === $defaultProjPos ? 'selected' : '' }}>{{ $pVal }}</option>
                            @endforeach
                        </select>
                    </div>
                @endif
            </div>
            <div style="font-size: 11px; color: #cbd5e1;">
                💡 <em>สามารถคลิกแก้ไขวันที่หรือข้อความบนเอกสารได้โดยตรง</em>
            </div>
        </div>
    </div>

    <!-- =================================================================== -->
    <!-- PART 1: บันทึกข้อความขออนุญาตดำเนินกิจกรรม (ปะหน้า строго 1 หน้า A4) -->
    <!-- =================================================================== -->
    <div class="a4-page" id="sectionPart1">
        <span class="section-badge-screen">ส่วนที่ 1 / 3 • บันทึกข้อความปะหน้า (1 หน้า A4)</span>
        <div class="memo-header">
            @if($garudaBase64)
                <img src="{{ $garudaBase64 }}" alt="ตราครุฑ" class="garuda-logo">
            @else
                <img src="{{ asset('images/garuda.png') }}" alt="ตราครุฑ" class="garuda-logo">
            @endif
            <div class="memo-title">บันทึกข้อความ</div>
        </div>

        <div class="meta-row">
            <span class="meta-label">ส่วนราชการ</span>
            <span class="meta-dotted editable" contenteditable="true">{{ $collegeName }} ({{ $divisionName }})</span>
        </div>

        <div class="meta-row">
            <div class="meta-split">
                <div class="meta-col-left">
                    <span class="meta-label">ที่</span>
                    <span class="meta-dotted editable" contenteditable="true">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/{{ $fiscalYear }}</span>
                </div>
                <div class="meta-col-right">
                    <span class="meta-label">วันที่</span>
                    <span class="meta-dotted editable" id="memoDateDisplay" contenteditable="true">{{ $todayDateOfficial }}</span>
                </div>
            </div>
        </div>

        <div class="meta-row">
            <span class="meta-label">เรื่อง</span>
            <span class="meta-dotted editable" contenteditable="true" style="font-weight: 600;">{{ $subjectText }}</span>
        </div>

        <hr class="subject-divider">

        <div class="salutation">
            <span class="salutation-label">เรียน</span>
            <span class="editable" contenteditable="true">ผู้อำนวยการ{{ $collegeName }}</span>
        </div>

        <p class="body-paragraph editable" id="memoParagraph1" contenteditable="true">{{ $paragraph1 }}</p>
        <p class="body-paragraph editable" id="memoParagraph2" contenteditable="true">{{ $paragraph2 }}</p>
        <p class="closing-paragraph editable" contenteditable="true">จึงเรียนมาเพื่อโปรดพิจารณาอนุญาตให้ดำเนินกิจกรรมดังกล่าว</p>

        <!-- 4 Compact Signature Rows for Part 1 (Strict 1-Page Layout matching official sample) -->
        <div class="memo-signatures">
            <!-- Row 1: ผู้รับผิดชอบกิจกรรม (หรือผู้เสนอโครงการสำหรับกิจกรรมนี้) -->
            <div class="memo-sig-right">
                <div class="memo-sig-box">
                    <div class="memo-sig-space">
                        @if(!empty($signers['activity_responsible']['signature_data']))
                            <img src="{{ $signers['activity_responsible']['signature_data'] }}" class="signature-img" alt="ลายเซ็นผู้รับผิดชอบกิจกรรม">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <span class="editable" contenteditable="true" style="font-weight: 600; display: block;">({{ $signers['activity_responsible']['name'] }})</span>
                    <span class="act-pos-display editable" contenteditable="true" style="display: block;">{{ $signers['activity_responsible']['title'] }}</span>
                </div>
            </div>

            <!-- Row 2: หัวหน้างาน / แผนกวิชา หรือผู้รับผิดชอบโครงการหลัก -->
            <div class="memo-sig-right">
                <div class="memo-sig-box">
                    <div class="memo-sig-space">
                        @if(!empty($approvalsByStep[2]?->signature_data))
                            <img src="{{ $approvalsByStep[2]->signature_data }}" class="signature-img" alt="ลายเซ็นหัวหน้างาน">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <span class="editable" contenteditable="true" style="font-weight: 600; display: block;">({{ $sig2Name }})</span>
                    <span class="editable" contenteditable="true" style="display: block;">{{ $sig2Pos }}</span>
                </div>
            </div>

            <!-- Row 3: 2 คอลัมน์ (ซ้าย: รองฝ่ายที่กำกับดูแล / ขวา: รองฝ่ายยุทธศาสตร์และแผนงาน) -->
            <div class="memo-sig-two">
                <div class="memo-sig-box">
                    <div class="memo-sig-space">
                        @if(!empty($signers['project_deputy']['signature_data']))
                            <img src="{{ $signers['project_deputy']['signature_data'] }}" class="signature-img" alt="ลายเซ็นรองฝ่าย">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <span class="editable" contenteditable="true" style="font-weight: 600; display: block;">({{ $signers['project_deputy']['name'] }})</span>
                    <span class="editable" contenteditable="true" style="display: block;">{{ $signers['project_deputy']['title'] }}</span>
                </div>
                <div class="memo-sig-box">
                    <div class="memo-sig-space">
                        @if(!empty($signers['plan_deputy']['signature_data']))
                            <img src="{{ $signers['plan_deputy']['signature_data'] }}" class="signature-img" alt="ลายเซ็นรองแผน">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <span class="editable" contenteditable="true" style="font-weight: 600; display: block;">({{ $signers['plan_deputy']['name'] }})</span>
                    <span class="editable" contenteditable="true" style="display: block;">{{ $signers['plan_deputy']['title'] }}</span>
                </div>
            </div>

            <!-- Row 4: ผู้อำนวยการสถานศึกษา -->
            <div class="memo-sig-right" style="margin-bottom: 0;">
                <div class="memo-sig-box">
                    <div class="memo-sig-space">
                        @if(!empty($signers['director']['signature_data']))
                            <img src="{{ $signers['director']['signature_data'] }}" class="signature-img" alt="ลายเซ็นผู้อำนวยการ">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <span class="editable" contenteditable="true" style="font-weight: 600; display: block;">({{ $signers['director']['name'] }})</span>
                    <span class="editable" contenteditable="true" style="display: block;">{{ $signers['director']['title'] }}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- =================================================================== -->
    <!-- PART 2: แบบเสนอโครงการหลัก (12 หมวด ฉบับสมบูรณ์เหมือนที่พิมพ์เล่มรวม) -->
    <!-- =================================================================== -->
    <div class="a4-page page-break" id="sectionPart2">
        <span class="section-badge-screen">ส่วนที่ 2 / 3 • แบบเสนอโครงการหลัก (12 หมวด ฉบับสมบูรณ์)</span>
        
        <div class="doc-header">
            <h1>โครงการ/กิจกรรม ตาม พ.ร.บ. งบประมาณ ประจำปีงบประมาณ พ.ศ. {{ $fiscalYear }}</h1>
            <div class="doc-header-divider"></div>
            <h2>{{ $project->department?->name ?: $divisionName }} {{ $collegeName }}</h2>
        </div>

        <div class="sec-title">1. ชื่อโครงการ: <span style="font-weight: 600;">{{ $project->title }}</span></div>
        <div class="sec-content">
            <p><strong>ผู้รับผิดชอบโครงการ ชื่อ-สกุล :</strong> {{ $signers['project_responsible']['name'] }}</p>
            <p><strong>ตำแหน่ง :</strong> <span class="proj-raw-pos-display">{{ $defaultProjPos }}</span></p>
            <p><strong>โทรศัพท์เคลื่อนที่ :</strong> {{ $project->phone ?: ($projOwner?->phone ?: '-') }} &nbsp;&nbsp;&nbsp;&nbsp; <strong>E-mail :</strong> {{ $project->email ?: ($projOwner?->email ?: '-') }}</p>
        </div>

        <div class="sec-title">2. ลักษณะโครงการ</div>
        <div class="sec-content">
            <p><strong>2.1 สอดคล้องกับแผนพัฒนาการจัดการศึกษาของสถานศึกษา (พ.ศ. 2568-2570) {{ $collegeName }}</strong></p>
            <div style="padding-left: 20px;">
                <p><strong>- พันธกิจที่ 1</strong> {{ $project->mission ?: 'ผลิตและพัฒนากำลังคนด้านวิชาชีพให้มีคุณภาพตามมาตรฐานการอาชีวศึกษา' }}</p>
                <p><strong>- เป้าประสงค์</strong> {{ $project->goal ?: 'ผู้เรียนและผู้สำเร็จการศึกษามีความรู้ ทักษะ การประยุกต์ใช้และมีคุณธรรม จริยธรรม ตามมาตรฐานวิชาชีพ' }}</p>
                <p><strong>- กลยุทธ์ที่ 1</strong> {{ $project->strategy_tactic ?: 'ส่งเสริมด้านวิชาการ คุณธรรม จริยธรรม และค่านิยมที่ดีงามในวิชาชีพ' }}</p>
            </div>

            @if(!empty($strategyCategories) && count($strategyCategories) > 0)
                <p style="margin-top: 6px;"><strong>2.2 สอดคล้องกับยุทธศาสตร์ นโยบาย และมาตรฐานการอาชีวศึกษา:</strong></p>
                <div style="padding-left: 20px;">
                    @foreach($strategyCategories as $catIdx => $cat)
                        @php $catItems = $getSelectedCategoryItems($cat); @endphp
                        @if(count($catItems) > 0)
                            <p style="font-weight: 700; margin-top: 4px;">2.2.{{ $catIdx + 1 }} {{ $cat->name }}</p>
                            <div style="padding-left: 18px;">
                                @foreach($catItems as $itemIdx => $it)
                                    @php
                                        $itName = trim($it->name ?: $it->title);
                                        $itName = preg_replace('/^\[.*?\]\s*/u', '', $itName);
                                        $itName = preg_replace('/^(IQA|OVEC)\s*([0-9๑-๙]+)?\s*[:\.\-]?\s*/iu', '', $itName);
                                        $fullDisplay = $it->group_name ? "{$it->group_name} : {$itName}" : $itName;
                                    @endphp
                                    <p>{{ $itemIdx + 1 }}) {{ $fullDisplay }}</p>
                                @endforeach
                            </div>
                        @endif
                    @endforeach
                </div>
            @endif
        </div>

        <div class="sec-title">3. ความสำคัญของโครงการ/ หลักการและเหตุผล</div>
        <div class="sec-content">
            @if($project->background_rationale)
                @foreach(explode("\n\n", $project->background_rationale) as $bgP)
                    @if(trim($bgP))
                        <p class="thai-indent">{{ trim($bgP) }}</p>
                    @endif
                @endforeach
            @else
                <p class="thai-indent">-</p>
            @endif
        </div>

        <div class="sec-title">4. วัตถุประสงค์ของโครงการ:</div>
        <div class="sec-content">
            @if(is_array($project->objectives) && count($project->objectives) > 0)
                @foreach($project->objectives as $oIdx => $obj)
                    <p>4.{{ $oIdx + 1 }} {{ $obj }}</p>
                @endforeach
            @else
                <p>4.1 {{ $project->objectives ?: '-' }}</p>
            @endif
        </div>

        <div class="sec-title">5. ผลผลิตโครงการ (Output)</div>
        <div class="sec-content">
            @if(count($outputs) > 0)
                @foreach($outputs as $opIdx => $op)
                    <p>5.{{ $opIdx + 1 }} {{ $op }}</p>
                @endforeach
            @else
                <p>5.1 ผู้เข้าร่วมโครงการได้รับการอบรมและพัฒนาสมรรถนะครบถ้วนตามหลักเกณฑ์ที่กำหนด</p>
                <p>5.2 มีเอกสาร สื่อการเรียนรู้ หรือผลงานจากการดำเนินโครงการที่นำไปใช้ประโยชน์ได้จริง</p>
            @endif
        </div>

        <div class="sec-title">6. ผลลัพธ์โครงการ (Outcome)</div>
        <div class="sec-content">
            @if(count($outcomes) > 0)
                @foreach($outcomes as $ocIdx => $oc)
                    <p>6.{{ $ocIdx + 1 }} {{ $oc }}</p>
                @endforeach
            @else
                <p>6.1 ผู้เรียนและบุคลากรสามารถนำองค์ความรู้และทักษะจากโครงการไปประยุกต์ใช้ในการปฏิบัติงานจริงได้อย่างมีประสิทธิภาพ</p>
                <p>6.2 สถานศึกษามีมาตรฐานการจัดการเรียนการสอนและการบริการวิชาชีพที่ได้รับการยอมรับ</p>
            @endif
        </div>

        <div class="sec-title">7. กลุ่มเป้าหมาย</div>
        <div class="sec-content">
            <p><strong>7.1 เชิงปริมาณ</strong></p>
            <div style="padding-left: 20px;">
                @if(is_array($project->targets['quantitative'] ?? null) && count($project->targets['quantitative']) > 0)
                    @foreach($project->targets['quantitative'] as $qIdx => $qVal)
                        <p>7.1.{{ $qIdx + 1 }} {{ $qVal }}</p>
                    @endforeach
                @else
                    <p>7.1.1 {{ $project->targets['quantitative'] ?? '-' }}</p>
                @endif
            </div>
            <p style="margin-top: 4px;"><strong>7.2 เชิงคุณภาพ</strong></p>
            <div style="padding-left: 20px;">
                @if(is_array($project->targets['qualitative'] ?? null) && count($project->targets['qualitative']) > 0)
                    @foreach($project->targets['qualitative'] as $qlIdx => $qlVal)
                        <p>7.2.{{ $qlIdx + 1 }} {{ $qlVal }}</p>
                    @endforeach
                @else
                    <p>7.2.1 {{ $project->targets['qualitative'] ?? '-' }}</p>
                @endif
            </div>
        </div>

        <div class="sec-title">8. พื้นที่ดำเนินการ : <span style="font-weight: 500;">{{ $project->location ?: ('ณ ' . $collegeName) }}</span></div>

        <div class="sec-title">9. ผลที่คาดว่าจะได้รับ</div>
        <div class="sec-content">
            @if(count($expected_benefits) > 0)
                @foreach($expected_benefits as $ebIdx => $eb)
                    <p>9.{{ $ebIdx + 1 }} {{ $eb }}</p>
                @endforeach
            @else
                <p>9.1 ผู้เข้าร่วมโครงการมีทักษะและสมรรถนะตรงตามมาตรฐานวิชาชีพและความต้องการของตลาดแรงงาน</p>
                <p>9.2 สถานศึกษามีผลการดำเนินงานที่ตอบสนองต่อนโยบายของสำนักงานคณะกรรมการการอาชีวศึกษา</p>
            @endif
        </div>

        <div class="sec-title table-page-break" style="page-break-before: always; break-before: page;">10. ตัวชี้วัดเป้าหมายโครงการ</div>
        <table class="official-table">
            <thead>
                <tr>
                    <th style="width: 20%;">ประเภทตัวชี้วัด</th>
                    <th>ตัวชี้วัด</th>
                    <th style="width: 25%;">หน่วยนับ / จำนวนเงิน</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="font-weight: 700; text-align: center;">เชิงปริมาณ</td>
                    <td>
                        @if(is_array($project->targets['quantitative'] ?? null) && count($project->targets['quantitative']) > 0)
                            @foreach($project->targets['quantitative'] as $idx => $t)
                                <p style="margin: 2px 0;">{{ $idx + 1 }}. {{ $t }}</p>
                            @endforeach
                        @else
                            {{ $quantText }}
                        @endif
                    </td>
                    <td style="text-align: center; font-weight: 700;">{{ $quantUnit }}</td>
                </tr>
                <tr>
                    <td style="font-weight: 700; text-align: center;">เชิงคุณภาพ</td>
                    <td>
                        @if(is_array($project->targets['qualitative'] ?? null) && count($project->targets['qualitative']) > 0)
                            @foreach($project->targets['qualitative'] as $idx => $t)
                                <p style="margin: 2px 0;">{{ $idx + 1 }}. {{ $t }}</p>
                            @endforeach
                        @else
                            {{ $qualText }}
                        @endif
                    </td>
                    <td style="text-align: center; font-weight: 700;">{{ $qualUnit }}</td>
                </tr>
                <tr>
                    <td style="font-weight: 700; text-align: center;">เชิงเวลา</td>
                    <td>{{ $timeText }}</td>
                    <td style="text-align: center; font-weight: 700;">{{ $timeUnit }}</td>
                </tr>
                <tr>
                    <td style="font-weight: 700; text-align: center; vertical-align: top;">เชิงค่าใช้จ่าย</td>
                    <td>
                        <p style="font-weight: 700; margin: 0 0 6px 0;">{{ $costText }}</p>
                        
                        <!-- Multi-Activity Detailed Cost Breakdown (Matching Image 3 & Print.jsx) -->
                        @if(!empty($project->activities) && is_array($project->activities) && count($project->activities) > 0)
                            <div style="padding-left: 4px; margin-bottom: 8px;">
                                @foreach($project->activities as $aIdx => $act)
                                    @php
                                        $loanItems = is_array($act['loan_items'] ?? null) ? $act['loan_items'] : [];
                                        $procItems = is_array($act['procurement_items'] ?? null) ? $act['procurement_items'] : [];
                                        $actLoanSum = 0;
                                        foreach ($loanItems as $it) {
                                            $actLoanSum += (float)($it['total_price'] ?? (((float)($it['quantity'] ?? 0)) * ((float)($it['unit_price'] ?? 0))));
                                        }
                                        $actProcSum = 0;
                                        foreach ($procItems as $it) {
                                            $actProcSum += (float)($it['total_price'] ?? (((float)($it['quantity'] ?? 0)) * ((float)($it['unit_price'] ?? 0))));
                                        }
                                        $actTotal = $actLoanSum + $actProcSum;
                                    @endphp
                                    <div style="border-left: 2px solid #94a3b8; padding: 4px 8px; margin-bottom: 6px; background: #f8fafc; border-radius: 4px;">
                                        <p style="font-weight: 700; margin: 0; color: #0f172a;">{{ $act['name'] ?? ('กิจกรรมที่ ' . ($aIdx + 1)) }}</p>
                                        @if(!empty($act['location']))
                                            <p style="font-size: 11.5pt; color: #475569; margin: 1px 0 3px 0;">สถานที่: {{ $act['location'] }}</p>
                                        @endif

                                        @if(count($loanItems) > 0)
                                            <div style="padding-left: 8px; margin-top: 3px;">
                                                <p style="font-weight: 700; font-size: 11.5pt; color: #78350f; text-decoration: underline; margin: 0;">หมวดสัญญายืมเงิน (ดำเนินกิจกรรม):</p>
                                                @foreach($loanItems as $item)
                                                    @php $itemTotal = (float)($item['total_price'] ?? (((float)($item['quantity'] ?? 0)) * ((float)($item['unit_price'] ?? 0)))); @endphp
                                                    <div style="display: flex; justify-content: space-between; font-size: 11.5pt; padding-left: 8px;">
                                                        <span>- {{ $item['description'] ?? '' }} ({{ $item['quantity'] ?? '' }} {{ $item['unit'] ?? '' }} x {{ number_format((float)($item['unit_price'] ?? 0), 2) }} บ.)</span>
                                                        <span style="font-weight: 700; margin-left: 8px;">{{ number_format($itemTotal, 2) }} บาท</span>
                                                    </div>
                                                @endforeach
                                            </div>
                                        @endif

                                        @if(count($procItems) > 0)
                                            <div style="padding-left: 8px; margin-top: 3px;">
                                                <p style="font-weight: 700; font-size: 11.5pt; color: #312e81; text-decoration: underline; margin: 0;">หมวดจัดซื้อจัดจ้างพัสดุ:</p>
                                                @foreach($procItems as $item)
                                                    @php $itemTotal = (float)($item['total_price'] ?? (((float)($item['quantity'] ?? 0)) * ((float)($item['unit_price'] ?? 0)))); @endphp
                                                    <div style="display: flex; justify-content: space-between; font-size: 11.5pt; padding-left: 8px;">
                                                        <span>- {{ $item['description'] ?? '' }} ({{ $item['quantity'] ?? '' }} {{ $item['unit'] ?? '' }} x {{ number_format((float)($item['unit_price'] ?? 0), 2) }} บ.)</span>
                                                        <span style="font-weight: 700; margin-left: 8px;">{{ number_format($itemTotal, 2) }} บาท</span>
                                                    </div>
                                                @endforeach
                                            </div>
                                        @endif

                                        <div style="display: flex; justify-content: space-between; font-size: 12pt; font-weight: 700; margin-top: 4px; padding-top: 2px; border-top: 1px solid #cbd5e1;">
                                            <span>รวมเงินกิจกรรมที่ {{ $aIdx + 1 }}</span>
                                            <span style="color: #4c1d95;">{{ number_format($actTotal, 2) }} บาท</span>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        @endif

                        <p style="font-weight: 700; text-align: right; margin: 4px 0 0 0;">รวมงบประมาณทั้งสิ้นทั้งโครงการ</p>
                    </td>
                    <td style="text-align: right; vertical-align: bottom; font-weight: 700; padding-bottom: 8px;">
                        <p style="border-top: 2px solid #000000; padding-top: 4px; margin: 0; font-size: 14pt;">
                            {{ number_format((float)($project->estimated_budget ?: $totalProjectBudget), 0) }} บาท
                        </p>
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="sec-title table-page-break" style="page-break-before: always; break-before: page;">11. สรุปขั้นตอน/วิธีดำเนินการ และหมวดเงินที่ใช้</div>
        <table class="official-table" style="font-size: 12.5pt; text-align: center;">
            <thead>
                <tr>
                    <th rowspan="2" style="width: 30%;">ขั้นตอน/วิธีดำเนินการ</th>
                    <th colspan="4" style="width: 14%;">ดำเนินการในไตรมาส (✓)</th>
                    <th rowspan="2" style="width: 14%;">เป้าหมาย</th>
                    <th rowspan="2" style="width: 14%;">พื้นที่ดำเนินการ</th>
                    <th colspan="4">หมวดเงิน (บาท)</th>
                </tr>
                <tr>
                    <th style="width: 3.5%;">1</th>
                    <th style="width: 3.5%;">2</th>
                    <th style="width: 3.5%;">3</th>
                    <th style="width: 3.5%;">4</th>
                    <th style="width: 8%;">งบดำเนินงาน</th>
                    <th style="width: 6%;">งบลงทุน</th>
                    <th style="width: 7%;">งบรายจ่ายอื่น</th>
                    <th style="width: 7%;">งบอุดหนุน</th>
                </tr>
            </thead>
            <tbody>
                @foreach($planSteps as $sIdx => $st)
                    <tr>
                        <td style="text-align: left; padding: 4px 6px;">{{ $st['step_name'] ?? '' }}</td>
                        <td style="text-align: center; font-weight: 700;">{{ !empty($st['q1']) ? '✓' : '' }}</td>
                        <td style="text-align: center; font-weight: 700;">{{ !empty($st['q2']) ? '✓' : '' }}</td>
                        <td style="text-align: center; font-weight: 700;">{{ !empty($st['q3']) ? '✓' : '' }}</td>
                        <td style="text-align: center; font-weight: 700;">{{ !empty($st['q4']) ? '✓' : '' }}</td>
                        <td style="text-align: center;">{{ $st['target_count'] ?? '' }}</td>
                        <td style="text-align: center;">{{ $st['location_name'] ?? '' }}</td>
                        <td style="text-align: right;">{{ !empty($st['budget_operating']) ? number_format((float)$st['budget_operating'], 0) : '' }}</td>
                        <td style="text-align: right;">{{ !empty($st['budget_investment']) ? number_format((float)$st['budget_investment'], 0) : '' }}</td>
                        <td style="text-align: right;">{{ !empty($st['budget_other']) ? number_format((float)$st['budget_other'], 0) : '' }}</td>
                        <td style="text-align: right;">{{ !empty($st['budget_subsidy']) ? number_format((float)$st['budget_subsidy'], 0) : '' }}</td>
                    </tr>
                @endforeach
                <!-- Row 5: รวมเงิน (Matching Image 4 & Print.jsx) -->
                <tr style="font-weight: 700; background-color: #f8fafc;">
                    <td colspan="7" style="text-align: center; font-weight: 700;">รวมเงิน</td>
                    <td style="text-align: right; font-weight: 700;">{{ $sumOperating > 0 ? number_format($sumOperating, 0) : '' }}</td>
                    <td style="text-align: right; font-weight: 700;">{{ $sumInvestment > 0 ? number_format($sumInvestment, 0) : '' }}</td>
                    <td style="text-align: right; font-weight: 700;">{{ $sumOther > 0 ? number_format($sumOther, 0) : '' }}</td>
                    <td style="text-align: right; font-weight: 700;">{{ $sumSubsidy > 0 ? number_format($sumSubsidy, 0) : '' }}</td>
                </tr>
                <!-- Row 6: งบประมาณรวมทั้งโครงการ (Matching Image 4 & Print.jsx) -->
                <tr style="font-weight: 700; background-color: #f1f5f9;">
                    <td colspan="7" style="text-align: center; font-weight: 700;">งบประมาณรวมทั้งโครงการ</td>
                    <td colspan="4" style="text-align: center; font-weight: 700;">{{ number_format($grandTotalSteps, 0) }} บาท</td>
                </tr>
            </tbody>
        </table>

        <!-- 12. การอนุมัติโครงการ (Official 6 Approvals Matching Image 2, Image 5 & Print.jsx lines 1345-1598) -->
        <div class="sec-title table-page-break" style="page-break-before: always; break-before: page; margin-top: 24px;">12. การอนุมัติโครงการ: {{ $project->title }}</div>
        
        <div style="margin-top: 20px; font-size: 15pt; line-height: 1.35;">
            <!-- Row 1: ผู้เสนอโครงการ (ซ้าย) & ผู้เห็นชอบโครงการ: รองผู้อำนวยการฝ่ายที่กำกับดูแล (ขวา) -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
                <!-- ซ้าย: ผู้เสนอโครงการ -->
                <div style="width: 48%; display: flex; justify-content: center;">
                    <div style="text-align: center; position: relative; display: inline-flex; flex-direction: column; align-items: center;">
                        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                            <span style="position: absolute; right: 100%; margin-right: 8px; white-space: nowrap; bottom: 2px;">ลงชื่อ</span>
                            <div style="display: inline-flex; flex-direction: column; align-items: center;">
                                @if(!empty($sig1Img))
                                    <img src="{{ $sig1Img }}" class="signature-img" alt="ลายมือชื่อผู้เสนอ">
                                @else
                                    <div style="height: 24px;"></div>
                                @endif
                                <span style="border-bottom: 1px dotted #334155; width: 130px; display: inline-block; margin-bottom: 4px;"></span>
                            </div>
                            <span style="position: absolute; left: 100%; margin-left: 8px; white-space: nowrap; bottom: 2px;">ผู้เสนอโครงการ</span>
                        </div>
                        <p style="font-weight: 700; margin-top: 6px; white-space: nowrap;">({{ $sig1Name }})</p>
                        <p class="proj-raw-pos-display" style="margin: 2px 0 0 0; color: #1e293b;">{{ $sig1Pos }}</p>
                        <p style="margin: 2px 0 0 0; color: #475569; white-space: nowrap;">{{ $sig1Date }}</p>
                    </div>
                </div>

                <!-- ขวา: ผู้เห็นชอบโครงการ (รองผู้อำนวยการฝ่ายที่เกี่ยวข้องกับงานดังกล่าว) -->
                <div style="width: 48%; display: flex; justify-content: center;">
                    <div style="text-align: center; position: relative; display: inline-flex; flex-direction: column; align-items: center;">
                        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                            <span style="position: absolute; right: 100%; margin-right: 8px; white-space: nowrap; bottom: 2px;">ลงชื่อ</span>
                            <div style="display: inline-flex; flex-direction: column; align-items: center;">
                                @if(!empty($sig4Img))
                                    <img src="{{ $sig4Img }}" class="signature-img" alt="ลายมือชื่อรองฝ่าย">
                                @else
                                    <div style="height: 24px;"></div>
                                @endif
                                <span style="border-bottom: 1px dotted #334155; width: 130px; display: inline-block; margin-bottom: 4px;"></span>
                            </div>
                            <span style="position: absolute; left: 100%; margin-left: 8px; white-space: nowrap; bottom: 2px;">ผู้เห็นชอบโครงการ</span>
                        </div>
                        <p style="font-weight: 700; margin-top: 6px; white-space: nowrap;">({{ $sig4Name }})</p>
                        <p style="margin: 2px 0 0 0; color: #1e293b;">{{ $sig4Pos }}</p>
                        <p style="margin: 2px 0 0 0; color: #475569; white-space: nowrap;">{{ $sig4Date }}</p>
                    </div>
                </div>
            </div>

            <!-- Row 2: ผู้ตรวจสอบโครงการ (ซ้าย) & ผู้เห็นชอบโครงการ: รองฝ่ายยุทธศาสตร์ฯ (ขวา) -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
                <!-- ซ้าย: ผู้ตรวจสอบโครงการ (หัวหน้างานพัฒนายุทธศาสตร์ แผนงานและงบประมาณ) -->
                <div style="width: 48%; display: flex; justify-content: center;">
                    <div style="text-align: center; position: relative; display: inline-flex; flex-direction: column; align-items: center;">
                        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                            <span style="position: absolute; right: 100%; margin-right: 8px; white-space: nowrap; bottom: 2px;">ลงชื่อ</span>
                            <div style="display: inline-flex; flex-direction: column; align-items: center;">
                                @if(!empty($sig3Img))
                                    <img src="{{ $sig3Img }}" class="signature-img" alt="ลายมือชื่อผู้ตรวจสอบ">
                                @else
                                    <div style="height: 24px;"></div>
                                @endif
                                <span style="border-bottom: 1px dotted #334155; width: 130px; display: inline-block; margin-bottom: 4px;"></span>
                            </div>
                            <span style="position: absolute; left: 100%; margin-left: 8px; white-space: nowrap; bottom: 2px;">ผู้ตรวจสอบโครงการ</span>
                        </div>
                        <p style="font-weight: 700; margin-top: 6px; white-space: nowrap;">({{ $sig3Name }})</p>
                        <p style="margin: 2px 0 0 0; color: #1e293b;">{{ $sig3Pos }}</p>
                        <p style="margin: 2px 0 0 0; color: #475569; white-space: nowrap;">{{ $sig3Date }}</p>
                    </div>
                </div>

                <!-- ขวา: ผู้เห็นชอบโครงการ (รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน) -->
                <div style="width: 48%; display: flex; justify-content: center;">
                    <div style="text-align: center; position: relative; display: inline-flex; flex-direction: column; align-items: center;">
                        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                            <span style="position: absolute; right: 100%; margin-right: 8px; white-space: nowrap; bottom: 2px;">ลงชื่อ</span>
                            <div style="display: inline-flex; flex-direction: column; align-items: center;">
                                @if(!empty($sig5Img))
                                    <img src="{{ $sig5Img }}" class="signature-img" alt="ลายมือชื่อรองแผน">
                                @else
                                    <div style="height: 24px;"></div>
                                @endif
                                <span style="border-bottom: 1px dotted #334155; width: 130px; display: inline-block; margin-bottom: 4px;"></span>
                            </div>
                            <span style="position: absolute; left: 100%; margin-left: 8px; white-space: nowrap; bottom: 2px;">ผู้เห็นชอบโครงการ</span>
                        </div>
                        <p style="font-weight: 700; margin-top: 6px; white-space: nowrap;">({{ $sig5Name }})</p>
                        <p style="margin: 2px 0 0 0; color: #1e293b;">{{ $sig5Pos }}</p>
                        <p style="margin: 2px 0 0 0; color: #475569; white-space: nowrap;">{{ $sig5Date }}</p>
                    </div>
                </div>
            </div>

            <!-- Row 3: ผู้เห็นชอบโครงการ: รองผู้อำนวยการฝ่ายบริหารทรัพยากร (ตรงกลาง) -->
            <div style="display: flex; justify-content: center; margin-bottom: 24px;">
                <div style="text-align: center; position: relative; display: inline-flex; flex-direction: column; align-items: center;">
                    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                        <span style="position: absolute; right: 100%; margin-right: 8px; white-space: nowrap; bottom: 2px;">ลงชื่อ</span>
                        <div style="display: inline-flex; flex-direction: column; align-items: center;">
                            @if(!empty($resourceDeputyImg))
                                <img src="{{ $resourceDeputyImg }}" class="signature-img" alt="ลายมือชื่อรองบริหาร">
                            @else
                                <div style="height: 24px;"></div>
                            @endif
                            <span style="border-bottom: 1px dotted #334155; width: 140px; display: inline-block; margin-bottom: 4px;"></span>
                        </div>
                        <span style="position: absolute; left: 100%; margin-left: 8px; white-space: nowrap; bottom: 2px;">ผู้เห็นชอบโครงการ</span>
                    </div>
                    <p style="font-weight: 700; margin-top: 6px; white-space: nowrap;">({{ $resourceDeputyName }})</p>
                    <p style="margin: 2px 0 0 0; color: #1e293b;">{{ $resourceDeputyPos }}</p>
                    <p style="margin: 2px 0 0 0; color: #475569; white-space: nowrap;">{{ $resourceDeputyDate }}</p>
                </div>
            </div>

            <!-- Row 4: ผู้อนุมัติโครงการ: ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน (ตรงกลาง) -->
            <div style="display: flex; justify-content: center; margin-bottom: 10px;">
                <div style="text-align: center; position: relative; display: inline-flex; flex-direction: column; align-items: center;">
                    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                        <span style="position: absolute; right: 100%; margin-right: 8px; white-space: nowrap; bottom: 2px;">ลงชื่อ</span>
                        <div style="display: inline-flex; flex-direction: column; align-items: center;">
                            @if(!empty($sig6Img))
                                <img src="{{ $sig6Img }}" class="signature-img" alt="ลายมือชื่อผู้อำนวยการ">
                            @else
                                <div style="height: 24px;"></div>
                            @endif
                            <span style="border-bottom: 1px dotted #334155; width: 150px; display: inline-block; margin-bottom: 4px;"></span>
                        </div>
                        <span style="position: absolute; left: 100%; margin-left: 8px; white-space: nowrap; bottom: 2px;">ผู้อนุมัติโครงการ</span>
                    </div>
                    <p style="font-weight: 700; margin-top: 6px; white-space: nowrap;">({{ $sig6Name }})</p>
                    <p style="margin: 2px 0 0 0; color: #1e293b;">{{ $sig6Pos }}</p>
                    <p style="margin: 2px 0 0 0; color: #475569; white-space: nowrap;">{{ $sig6Date }}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- =================================================================== -->
    <!-- PART 3: แบบเสนอรายละเอียดการดำเนินกิจกรรม (12 หมวด ลงนามเฉพาะผู้รับผิดชอบกิจกรรม) -->
    <!-- =================================================================== -->
    <div class="a4-page page-break" id="sectionPart3">
        <span class="section-badge-screen">ส่วนที่ 3 / 3 • รายละเอียดการดำเนินกิจกรรม (ลงนามเฉพาะผู้รับผิดชอบกิจกรรม)</span>

        <div class="doc-header">
            <h1>โครงการ/กิจกรรม ตาม พ.ร.บ. งบประมาณ ประจำปีงบประมาณ พ.ศ. {{ $fiscalYear }}</h1>
            <div class="doc-header-divider"></div>
            <h2>แบบเสนอรายละเอียดการดำเนินกิจกรรม: {{ $activity['name'] ?? '' }}</h2>
            <p style="margin: 4px 0 0 0; font-size: 14pt; font-weight: normal; color: #1e293b;">
                ภายใต้โครงการ: {{ $project->title }} • {{ $project->department?->name ?: $divisionName }} {{ $collegeName }}
            </p>
        </div>

        <div class="sec-title">1. ชื่อกิจกรรม และผู้รับผิดชอบดำเนินกิจกรรม</div>
        <div class="sec-content">
            <p><strong>ชื่อกิจกรรม :</strong> <span style="font-weight: 600;">{{ $activity['name'] ?? '-' }}</span></p>
            <p><strong>ผู้รับผิดชอบกิจกรรม ชื่อ-สกุล :</strong> {{ $signers['activity_responsible']['name'] }}</p>
            <p><strong>ตำแหน่ง :</strong> <span class="act-raw-pos-display">{{ $defaultActPos }}</span></p>
            <p><strong>โทรศัพท์เคลื่อนที่ :</strong> {{ $fillerUser?->phone ?: '-' }} &nbsp;&nbsp;&nbsp;&nbsp; <strong>E-mail :</strong> {{ $fillerUser?->email ?: '-' }}</p>
            @if($assignedUsers && $assignedUsers->count() > 1)
                <p><strong>ผู้ร่วมดำเนินกิจกรรม :</strong> {{ $assignedUsers->pluck('name')->implode(', ') }}</p>
            @endif
        </div>

        <div class="sec-title">2. ลักษณะกิจกรรม</div>
        <div class="sec-content">
            <p><strong>2.1 สอดคล้องกับแผนพัฒนาการจัดการศึกษาของสถานศึกษาและโครงการหลัก</strong></p>
            <div style="padding-left: 20px;">
                <p><strong>- พันธกิจที่ 1</strong> {{ $project->mission ?: 'ผลิตและพัฒนากำลังคนด้านวิชาชีพให้มีคุณภาพตามมาตรฐานการอาชีวศึกษา' }}</p>
                <p><strong>- เป้าประสงค์</strong> {{ $project->goal ?: 'ผู้เรียนและผู้สำเร็จการศึกษามีความรู้ ทักษะ การประยุกต์ใช้และมีคุณธรรม จริยธรรม ตามมาตรฐานวิชาชีพ' }}</p>
                <p><strong>- กลยุทธ์ที่ 1</strong> {{ $project->strategy_tactic ?: 'ส่งเสริมด้านวิชาการ คุณธรรม จริยธรรม และค่านิยมที่ดีงามในวิชาชีพ' }}</p>
            </div>
            <p class="thai-indent" style="margin-top: 6px;">
                กิจกรรมนี้ดำเนินการภายใต้โครงการ "<strong>{{ $project->title }}</strong>" เพื่อสนับสนุนการขับเคลื่อนกิจกรรมย่อยให้บรรลุตามวัตถุประสงค์และตัวชี้วัดของโครงการหลักอย่างมีประสิทธิภาพ
            </p>
        </div>

        <div class="sec-title">3. ความสำคัญของกิจกรรม / หลักการและเหตุผล</div>
        <div class="sec-content">
            @php $actBg = !empty($activity['background_rationale']) ? $activity['background_rationale'] : $project->background_rationale; @endphp
            @if($actBg)
                @foreach(explode("\n\n", $actBg) as $actP)
                    @if(trim($actP))
                        <p class="thai-indent">{{ trim($actP) }}</p>
                    @endif
                @endforeach
            @else
                <p class="thai-indent">-</p>
            @endif
        </div>

        <div class="sec-title">4. วัตถุประสงค์ของกิจกรรม:</div>
        <div class="sec-content">
            @php $actObjs = !empty($activity['objectives']) ? $activity['objectives'] : $project->objectives; @endphp
            @if(is_array($actObjs) && count($actObjs) > 0)
                @foreach($actObjs as $aObjIdx => $aObj)
                    <p>4.{{ $aObjIdx + 1 }} {{ $aObj }}</p>
                @endforeach
            @else
                <p>4.1 {{ $actObjs ?: '-' }}</p>
            @endif
        </div>

        <div class="sec-title">5. ผลผลิตกิจกรรม (Output)</div>
        <div class="sec-content">
            <p>5.1 ผู้เข้าร่วมกิจกรรมได้รับการพัฒนาความรู้ ทักษะวิชาชีพ และสมรรถนะตรงตามเกณฑ์ที่กำหนด</p>
            <p>5.2 มีเอกสาร สื่อการเรียนรู้ หรือผลงานจากการจัดกิจกรรมที่นำไปใช้ประโยชน์ได้จริง</p>
        </div>

        <div class="sec-title">6. ผลลัพธ์กิจกรรม (Outcome)</div>
        <div class="sec-content">
            <p>6.1 ผู้เรียนและผู้เข้าร่วมสามารถนำความรู้และทักษะจากกิจกรรมไปประยุกต์ใช้ในการเรียนและการประกอบอาชีพจริงได้อย่างมีประสิทธิภาพ</p>
            <p>6.2 การดำเนินกิจกรรมสนับสนุนการบรรลุเป้าหมายตามวัตถุประสงค์ของโครงการหลัก</p>
        </div>

        <div class="sec-title">7. กลุ่มเป้าหมาย</div>
        <div class="sec-content">
            <p><strong>7.1 เชิงปริมาณ :</strong> {{ !empty($activity['target_group']) ? $activity['target_group'] : (is_array($project->targets['quantitative'] ?? null) ? implode(', ', $project->targets['quantitative']) : ($project->targets['quantitative'] ?? 'ผู้เข้าร่วมกิจกรรมตามเป้าหมายที่กำหนด')) }}</p>
            <p><strong>7.2 เชิงคุณภาพ :</strong> ผู้เข้าร่วมกิจกรรมมีความพึงพอใจและมีผลสัมฤทธิ์ผ่านเกณฑ์การประเมินในระดับดีมาก (ร้อยละ 90 ขึ้นไป)</p>
        </div>

        <div class="sec-title">8. พื้นที่ดำเนินการ : <span style="font-weight: 500;">{{ $location ?: ('ณ ' . $collegeName) }}</span></div>

        <div class="sec-title">9. ผลที่คาดว่าจะได้รับ</div>
        <div class="sec-content">
            @php $actBenefits = !empty($activity['expected_benefits']) ? $activity['expected_benefits'] : $project->expected_benefits; @endphp
            @if(is_array($actBenefits) && count($actBenefits) > 0)
                @foreach($actBenefits as $bIdx => $bVal)
                    <p>9.{{ $bIdx + 1 }} {{ $bVal }}</p>
                @endforeach
            @else
                <p>9.1 ผู้เข้าร่วมกิจกรรมมีทักษะและสมรรถนะตรงตามมาตรฐานวิชาชีพและความต้องการของตลาดแรงงาน</p>
                <p>9.2 สถานศึกษาและชุมชนได้รับประโยชน์จากการจัดกิจกรรมตามวัตถุประสงค์ของโครงการหลัก</p>
            @endif
        </div>

        <div class="sec-title">10. ตัวชี้วัดเป้าหมายกิจกรรม</div>
        <table class="official-table">
            <thead>
                <tr>
                    <th style="width: 20%;">ประเภทตัวชี้วัด</th>
                    <th>ตัวชี้วัด</th>
                    <th style="width: 25%;">หน่วยนับ / จำนวนเงิน</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="font-weight: 700; text-align: center;">เชิงปริมาณ</td>
                    <td>{{ !empty($activity['target_group']) ? $activity['target_group'] : 'ผู้เข้าร่วมกิจกรรมครบถ้วนตามเป้าหมายที่กำหนด' }}</td>
                    <td style="text-align: center; font-weight: 700;">100%</td>
                </tr>
                <tr>
                    <td style="font-weight: 700; text-align: center;">เชิงคุณภาพ</td>
                    <td>ผู้เข้าร่วมมีความพึงพอใจต่อการจัดกิจกรรมในระดับดีขึ้นไป ไม่น้อยกว่าร้อยละ 85</td>
                    <td style="text-align: center; font-weight: 700;">ร้อยละ 85</td>
                </tr>
                <tr>
                    <td style="font-weight: 700; text-align: center;">เชิงเวลา</td>
                    <td>กิจกรรมดำเนินการแล้วเสร็จตามระยะเวลา {{ $dateText }}</td>
                    <td style="text-align: center; font-weight: 700;">100%</td>
                </tr>
                <tr>
                    <td style="font-weight: 700; text-align: center; vertical-align: top;">เชิงค่าใช้จ่าย</td>
                    <td>
                        <p style="font-weight: 700; margin: 0 0 6px 0;">ประมาณการค่าใช้จ่ายและชุดจัดซื้อจัดจ้าง / สัญญายืมเงิน (กค. 101) ของกิจกรรม</p>
                        @if($linkedSets && $linkedSets->count() > 0)
                            <div style="padding-left: 4px; margin-bottom: 6px;">
                                @foreach($linkedSets as $sIdx => $s)
                                    @php $sSum = (float)$s->items->sum('total_price'); @endphp
                                    <div style="border-left: 2px solid #6366f1; padding: 3px 8px; margin-bottom: 4px; background: #f8fafc; border-radius: 3px;">
                                        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 12pt;">
                                            <span>{{ $sIdx + 1 }}. {{ $s->set_name ?: $s->procurement_number }} ({{ ($s->set_type ?? 'procurement') === 'loan' ? 'สัญญายืมเงิน กค. 101' : 'จัดซื้อจัดจ้างพัสดุ' }})</span>
                                            <span>{{ number_format($sSum, 2) }} บาท</span>
                                        </div>
                                        @if($s->items && $s->items->count() > 0)
                                            <div style="font-size: 11pt; color: #475569; padding-left: 10px; margin-top: 2px;">
                                                @foreach($s->items as $it)
                                                    • {{ $it->description }} ({{ $it->quantity }} {{ $it->unit }} × {{ number_format((float)$it->unit_price, 2) }} บ.)<br>
                                                @endforeach
                                            </div>
                                        @endif
                                    </div>
                                @endforeach
                            </div>
                        @endif
                        <p style="font-weight: 700; text-align: right; margin: 4px 0 0 0;">
                            รวมงบประมาณที่ใช้ในกิจกรรมนี้ทั้งสิ้น (ตัดจากกรอบวงเงินโครงการ {{ number_format((float)$totalProjectBudget, 2) }} บาท)
                        </p>
                    </td>
                    <td style="text-align: right; vertical-align: bottom; font-weight: 700; padding-bottom: 8px;">
                        <p style="border-top: 2px solid #000000; padding-top: 4px; margin: 0; font-size: 14pt;">
                            {{ number_format((float)$budgetAmount, 2) }} บาท
                        </p>
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="sec-title table-page-break" style="page-break-before: always; break-before: page;">11. สรุปขั้นตอน/วิธีดำเนินการ และหมวดเงินที่ใช้</div>
        <table class="official-table" style="font-size: 12.5pt; text-align: center;">
            <thead>
                <tr>
                    <th rowspan="2" style="width: 30%;">ขั้นตอน/วิธีดำเนินการ</th>
                    <th colspan="4" style="width: 14%;">ดำเนินการในไตรมาส (✓)</th>
                    <th rowspan="2" style="width: 14%;">เป้าหมาย</th>
                    <th rowspan="2" style="width: 14%;">พื้นที่ดำเนินการ</th>
                    <th colspan="4">หมวดเงิน (บาท)</th>
                </tr>
                <tr>
                    <th style="width: 3.5%;">1</th>
                    <th style="width: 3.5%;">2</th>
                    <th style="width: 3.5%;">3</th>
                    <th style="width: 3.5%;">4</th>
                    <th style="width: 8%;">งบดำเนินงาน</th>
                    <th style="width: 6%;">งบลงทุน</th>
                    <th style="width: 7%;">งบรายจ่ายอื่น</th>
                    <th style="width: 7%;">งบอุดหนุน</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="text-align: left; padding: 4px 6px;">1. ประชุมเตรียมการ วางแผน และกำหนดรายละเอียดกิจกรรม</td>
                    <td style="font-weight: 700;">✓</td>
                    <td></td><td></td><td></td>
                    <td>1 ครั้ง</td>
                    <td>{{ $location ?: $collegeName }}</td>
                    <td style="text-align: right;">-</td>
                    <td style="text-align: right;">-</td>
                    <td style="text-align: right;">-</td>
                    <td style="text-align: right;">-</td>
                </tr>
                <tr>
                    <td style="text-align: left; padding: 4px 6px;">2. ดำเนินการจัดทำชุดจัดซื้อจัดจ้าง / สัญญายืมเงิน เพื่อดำเนินกิจกรรม</td>
                    <td></td>
                    <td style="font-weight: 700;">✓</td>
                    <td></td><td></td>
                    <td>ตามชุดเอกสาร</td>
                    <td>{{ $location ?: $collegeName }}</td>
                    <td style="text-align: right;">{{ number_format((float)$budgetAmount, 0) }}</td>
                    <td style="text-align: right;">-</td>
                    <td style="text-align: right;">-</td>
                    <td style="text-align: right;">-</td>
                </tr>
                <tr>
                    <td style="text-align: left; padding: 4px 6px;">3. ปฏิบัติการดำเนินกิจกรรมตามกำหนดการและวัตถุประสงค์</td>
                    <td></td>
                    <td style="font-weight: 700;">✓</td>
                    <td style="font-weight: 700;">✓</td>
                    <td></td>
                    <td>ตามกลุ่มเป้าหมาย</td>
                    <td>{{ $location ?: $collegeName }}</td>
                    <td style="text-align: right;">-</td>
                    <td style="text-align: right;">-</td>
                    <td style="text-align: right;">-</td>
                    <td style="text-align: right;">-</td>
                </tr>
                <tr>
                    <td style="text-align: left; padding: 4px 6px;">4. สรุป ประเมินผล และรายงานผลการดำเนินกิจกรรมให้กับโครงการหลัก</td>
                    <td></td><td></td><td></td>
                    <td style="font-weight: 700;">✓</td>
                    <td>1 ฉบับ</td>
                    <td>{{ $location ?: $collegeName }}</td>
                    <td style="text-align: right;">-</td>
                    <td style="text-align: right;">-</td>
                    <td style="text-align: right;">-</td>
                    <td style="text-align: right;">-</td>
                </tr>
                <tr style="font-weight: 700; background-color: #f8fafc;">
                    <td colspan="7" style="text-align: center; font-weight: 700;">รวมเงิน</td>
                    <td style="text-align: right; font-weight: 700;">{{ number_format((float)$budgetAmount, 0) }}</td>
                    <td style="text-align: right; font-weight: 700;">-</td>
                    <td style="text-align: right; font-weight: 700;">-</td>
                    <td style="text-align: right; font-weight: 700;">-</td>
                </tr>
                <tr style="font-weight: 700; background-color: #f1f5f9;">
                    <td colspan="7" style="text-align: center; font-weight: 700;">งบประมาณรวมทั้งกิจกรรม</td>
                    <td colspan="4" style="text-align: center; font-weight: 700;">{{ number_format((float)$budgetAmount, 0) }} บาท</td>
                </tr>
            </tbody>
        </table>

        <!-- 12. การลงนามรับผิดชอบการดำเนินกิจกรรม (ลงนามเฉพาะผู้รับผิดชอบกิจกรรมเท่านั้น ตามคำสั่งผู้ใช้งาน) -->
        <div class="sec-title" style="margin-top: 28px;">12. การลงนามรับผิดชอบการดำเนินกิจกรรม: {{ $activity['name'] ?? '' }}</div>
        
        <div style="display: flex; justify-content: center; margin-top: 24px;">
            <div style="text-align: center; position: relative; display: inline-flex; flex-direction: column; align-items: center; font-size: 15pt; line-height: 1.35;">
                <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                    <span style="position: absolute; right: 100%; margin-right: 8px; white-space: nowrap; bottom: 2px;">ลงชื่อ</span>
                    <div style="display: inline-flex; flex-direction: column; align-items: center;">
                        @if(!empty($signers['activity_responsible']['signature_data']))
                            <img src="{{ $signers['activity_responsible']['signature_data'] }}" class="signature-img" alt="ลายมือชื่อผู้รับผิดชอบกิจกรรม">
                        @else
                            <div style="height: 24px;"></div>
                        @endif
                        <span style="border-bottom: 1px dotted #334155; width: 140px; display: inline-block; margin-bottom: 4px;"></span>
                    </div>
                    <span style="position: absolute; left: 100%; margin-left: 8px; white-space: nowrap; bottom: 2px;">ผู้รับผิดชอบกิจกรรม</span>
                </div>
                <p style="font-weight: 700; margin-top: 8px; white-space: nowrap;">({{ $signers['activity_responsible']['name'] }})</p>
                <p class="act-pos-display" style="margin: 2px 0 0 0; color: #1e293b;">{{ $signers['activity_responsible']['title'] }}</p>
                <p id="actSigDateDisplay" class="editable" contenteditable="true" style="margin: 2px 0 0 0; color: #475569; white-space: nowrap;" title="คลิกเพื่อแก้ไขวันที่ได้โดยตรง">{{ $actSigDateInitial }}</p>
            </div>
        </div>
    </div>

    <script>
        const toThaiDigitsJs = (str) => {
            const thai = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
            return String(str || '').replace(/[0-9]/g, d => thai[Number(d)]);
        };

        const toArabicDigitsJs = (str) => {
            const thai = {'๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4', '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9'};
            return String(str || '').replace(/[๐-๙]/g, d => thai[d] || d);
        };

        let isThaiDigits = false;
        const thaiMonthsList = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

        function formatThaiDateJs(isoDateStr) {
            if (!isoDateStr) return 'วันที่ ........ เดือน .................... พ.ศ. ............';
            const parts = isoDateStr.split('-');
            if (parts.length !== 3) return isoDateStr;
            const year = parseInt(parts[0], 10) + 543;
            const month = parseInt(parts[1], 10);
            const day = parseInt(parts[2], 10);
            const monthName = thaiMonthsList[month] || '';
            
            let result = `วันที่ ${day} เดือน ${monthName} พ.ศ. ${year}`;
            if (isThaiDigits) {
                result = toThaiDigitsJs(result);
            }
            return result;
        }

        function onActivityDateChange(val) {
            const formatted = formatThaiDateJs(val);
            const actDisplay = document.getElementById('actSigDateDisplay');
            if (actDisplay) {
                actDisplay.textContent = formatted;
            }
            
            const syncChk = document.getElementById('syncMemoDate');
            if (syncChk && syncChk.checked) {
                const memoDateEl = document.getElementById('memoDateDisplay');
                if (memoDateEl) {
                    memoDateEl.textContent = formatted;
                }
            }
        }

        function setActivityDatePreset(type) {
            const dateInput = document.getElementById('inputActivityDate');
            if (type === 'today') {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                const iso = `${yyyy}-${mm}-${dd}`;
                if (dateInput) dateInput.value = iso;
                onActivityDateChange(iso);
            } else if (type === 'blank') {
                if (dateInput) dateInput.value = '';
                let blankStr = 'วันที่ ........ เดือน .................... พ.ศ. ............';
                if (isThaiDigits) blankStr = toThaiDigitsJs(blankStr);
                const actDisplay = document.getElementById('actSigDateDisplay');
                if (actDisplay) actDisplay.textContent = blankStr;
                
                const syncChk = document.getElementById('syncMemoDate');
                if (syncChk && syncChk.checked) {
                    const memoDateEl = document.getElementById('memoDateDisplay');
                    if (memoDateEl) memoDateEl.textContent = blankStr;
                }
            }
        }

        function toggleSections() {
            const p1 = document.getElementById('chkPart1').checked;
            const p2 = document.getElementById('chkPart2').checked;
            const p3 = document.getElementById('chkPart3').checked;
            document.getElementById('sectionPart1').classList.toggle('hidden-section', !p1);
            document.getElementById('sectionPart2').classList.toggle('hidden-section', !p2);
            document.getElementById('sectionPart3').classList.toggle('hidden-section', !p3);
        }

        function applyPositionChange(role, newPos) {
            if (role === 'act') {
                const titleText = newPos ? (newPos + ' ผู้รับผิดชอบกิจกรรม') : 'ผู้รับผิดชอบกิจกรรม';
                document.querySelectorAll('.act-pos-display').forEach(el => {
                    el.textContent = titleText;
                });
                document.querySelectorAll('.act-raw-pos-display').forEach(el => {
                    el.textContent = newPos;
                });
            } else if (role === 'proj') {
                const titleText = newPos ? (newPos + ' ผู้รับผิดชอบโครงการ') : 'ผู้รับผิดชอบโครงการ';
                document.querySelectorAll('.proj-pos-display').forEach(el => {
                    el.textContent = titleText;
                });
                document.querySelectorAll('.proj-raw-pos-display').forEach(el => {
                    el.textContent = newPos;
                });
            }
        }

        async function regenerateAiMemo() {
            const btn = document.getElementById('btnAiRedraft');
            const btnText = document.getElementById('btnAiText');
            btn.disabled = true;
            btnText.textContent = 'AI กำลังเรียบเรียงข้อความ...';

            try {
                const res = await fetch("{{ route('projects.activities.memo_ai_draft', [$project->id, $activityId]) }}", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({})
                });
                const data = await res.json();
                if (data.success) {
                    const p1 = isThaiDigits ? toThaiDigitsJs(data.paragraph1) : data.paragraph1;
                    const p2 = isThaiDigits ? toThaiDigitsJs(data.paragraph2) : data.paragraph2;
                    document.getElementById('memoParagraph1').textContent = p1;
                    document.getElementById('memoParagraph2').textContent = p2;
                } else {
                    alert('ไม่สามารถเรียบเรียงข้อความใหม่ได้ กรุณาลองอีกครั้ง');
                }
            } catch (e) {
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ AI กรุณาลองใหม่อีกครั้ง');
            } finally {
                btn.disabled = false;
                btnText.textContent = 'ให้ AI เรียบเรียงบันทึกข้อความใหม่';
            }
        }

        function toggleThaiDigits() {
            isThaiDigits = !isThaiDigits;
            const btnText = document.getElementById('btnDigitText');
            btnText.textContent = isThaiDigits ? 'แปลงเลขอารบิก' : 'แปลงเลขไทย';
            
            const convertNode = (node) => {
                if (node.nodeType === 3) {
                    node.nodeValue = isThaiDigits ? toThaiDigitsJs(node.nodeValue) : toArabicDigitsJs(node.nodeValue);
                } else if (node.nodeType === 1 && !node.classList.contains('no-convert') && node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE' && node.tagName !== 'SELECT') {
                    for (let child of node.childNodes) {
                        convertNode(child);
                    }
                }
            };

            const p1 = document.getElementById('sectionPart1');
            const p2 = document.getElementById('sectionPart2');
            const p3 = document.getElementById('sectionPart3');
            if (p1) convertNode(p1);
            if (p2) convertNode(p2);
            if (p3) convertNode(p3);
        }
    </script>
</body>
</html>
