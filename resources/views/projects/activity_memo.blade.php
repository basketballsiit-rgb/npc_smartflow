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

    $toThaiDigits = function ($str) use ($formatValue) {
        $str = $formatValue($str);
        $arabic = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $thai   = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        return str_replace($arabic, $thai, $str);
    };
    $toThaiNumerals = $toThaiDigits;

    $cleanPersonName = function ($name) {
        if (!$name) return '';
        $cleaned = preg_replace('/\s*\([^)]*\)/u', '', (string)$name);
        return trim(trim($cleaned), "()");
    };

    $cleanPositionText = function ($pos) {
        if (!$pos) return '';
        // If position has slash /, split and return first part cleanly
        if (str_contains($pos, '/')) {
            $parts = array_filter(array_map('trim', explode('/', $pos)));
            $pos = reset($parts) ?: $pos;
        }
        $pos = preg_replace('/\s*\([^)]*ฝ่าย[^)]*\)/u', '', $pos);
        $pos = preg_replace('/\s*\(ฝ่ายวิชาการ\)/u', '', $pos);
        return trim($pos);
    };

    $fiscalYear = $project->academic_year ?: (date('Y') + 543);
    $fiscalYearThai = $toThaiDigits($fiscalYear);
    $thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    $todayThai = $toThaiDigits(date('j')) . ' ' . $thaiMonths[(int)date('n')] . ' ' . $toThaiDigits(date('Y') + 543);
    $subjectText = 'ขออนุญาตดำเนินกิจกรรม ' . ($activity['name'] ?? '') . ' ภายใต้โครงการ ' . ($project->title ?? '');

    $formatDateThai = function ($dateVal) use ($thaiMonths, $toThaiDigits) {
        if (!$dateVal) return '-';
        try {
            $c = \Carbon\Carbon::parse($dateVal);
            return $toThaiDigits($c->day) . ' ' . $thaiMonths[$c->month] . ' ' . $toThaiDigits($c->year + 543);
        } catch (\Throwable $e) {
            return (string)$dateVal;
        }
    };

    // Helper for Approval Signatures
    $getStepSigImg = function ($step) use ($approvalsByStep) {
        $ap = $approvalsByStep[$step] ?? null;
        if (!$ap) return null;
        if (!empty($ap->signature_data)) return $ap->signature_data;
        if (!empty($ap->user?->signature_data)) return $ap->user->signature_data;
        return null;
    };

    $getStepSignerName = function ($step, $fallbackName) use ($approvalsByStep, $cleanPersonName) {
        $ap = $approvalsByStep[$step] ?? null;
        if ($ap && $ap->user?->name) return $cleanPersonName($ap->user->name);
        return $cleanPersonName($fallbackName);
    };

    $projectFundingList = [];
    if ($project->budgets && $project->budgets->count() > 0) {
        foreach ($project->budgets as $b) {
            $projectFundingList[] = ($b->fundingSource?->name ?: 'งบประมาณ') . ' จำนวน ' . $toThaiDigits(number_format((float)$b->allocated_amount, 2)) . ' บาท';
        }
    } elseif ($project->fundingSource) {
        $projectFundingList[] = $project->fundingSource->name . ' จำนวน ' . $toThaiDigits(number_format((float)$totalProjectBudget, 2)) . ' บาท';
    }

    // Helper for Strategic Category items in Project Proposal (Part 2)
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
            'step_name' => '๑. ประชุมวางแผนเพื่อจัดทำโครงการ/กิจกรรม',
            'q1' => true, 'q2' => false, 'q3' => false, 'q4' => false,
            'target_count' => '๑ ครั้ง',
            'location_name' => $project->location ?: $collegeName,
            'budget_operating' => 0, 'budget_investment' => 0, 'budget_other' => 0, 'budget_subsidy' => 0,
        ],
        [
            'step_name' => '๒. ดำเนินการเขียนโครงการเพื่อของบประมาณ ออกคำสั่งวิทยาลัย เชิญคณะกรรมการโครงการประชุมกำหนดวันและสถานที่',
            'q1' => true, 'q2' => false, 'q3' => false, 'q4' => false,
            'target_count' => '๑ ครั้ง',
            'location_name' => $project->location ?: $collegeName,
            'budget_operating' => 0, 'budget_investment' => 0, 'budget_other' => 0, 'budget_subsidy' => 0,
        ],
        [
            'step_name' => '๓. ดำเนินการตามกิจกรรมและโครงการ',
            'q1' => false, 'q2' => true, 'q3' => false, 'q4' => false,
            'target_count' => 'ตามกลุ่มเป้าหมาย',
            'location_name' => $project->location ?: $collegeName,
            'budget_operating' => (float)($totalProjectBudget ?: $project->estimated_budget), 'budget_investment' => 0, 'budget_other' => 0, 'budget_subsidy' => 0,
        ],
        [
            'step_name' => '๔. สรุปประเมินโครงการและรายงานผล ปัญหา อุปสรรค โครงการให้กับคณะผู้บริหาร',
            'q1' => false, 'q2' => false, 'q3' => false, 'q4' => true,
            'target_count' => '๑ เล่ม',
            'location_name' => $project->location ?: $collegeName,
            'budget_operating' => 0, 'budget_investment' => 0, 'budget_other' => 0, 'budget_subsidy' => 0,
        ],
    ];

    $planSteps = (count($action_plan) >= 4) ? $action_plan : $defaultStandardSteps;

    // Indicators Data
    $indicators = is_array($project->indicators) ? $project->indicators : [];
    $targetQuant = is_array($project->targets['quantitative'] ?? null)
        ? implode("\n", $project->targets['quantitative'])
        : ($project->targets['quantitative'] ?? 'ผู้เข้าร่วมโครงการบรรลุตามเป้าหมายที่กำหนด คิดเป็นร้อยละ ๑๐๐');
    $quantText = $indicators['quantitative']['text'] ?? $targetQuant;
    $quantUnit = $indicators['quantitative']['unit'] ?? 'ร้อยละ ๑๐๐';

    $targetQual = is_array($project->targets['qualitative'] ?? null)
        ? implode("\n", $project->targets['qualitative'])
        : ($project->targets['qualitative'] ?? 'ผู้เข้าร่วมมีความพึงพอใจต่อการดำเนินงานและได้รับความรู้ทักษะเพิ่มขึ้นในระดับดีมาก');
    $qualText = $indicators['qualitative']['text'] ?? $targetQual;
    $qualUnit = $indicators['qualitative']['unit'] ?? 'ร้อยละ ๙๐';

    $timeText = $indicators['time']['text'] ?? 'ดำเนินกิจกรรมแล้วเสร็จตามระยะเวลาที่กำหนดในแผนปฏิบัติการ';
    $timeUnit = $indicators['time']['unit'] ?? '๑๐๐%';

    $costText = $indicators['cost']['text'] ?? ('บริหารจัดการงบประมาณเป็นไปอย่างคุ้มค่าและไม่เกินวงเงินที่ได้รับจัดสรร ' . $toThaiDigits(number_format((float)$totalProjectBudget, 2)) . ' บาท');
    $costUnit = $indicators['cost']['unit'] ?? ($toThaiDigits(number_format((float)$totalProjectBudget, 2)) . ' บาท');

    // 6 Approvals for Main Project (Part 2)
    $sig1 = $approvalsByStep[1] ?? null;
    $sig2 = $approvalsByStep[2] ?? null;
    $sig3 = $approvalsByStep[3] ?? null;
    $sig4 = $approvalsByStep[4] ?? null;
    $sig5 = $approvalsByStep[5] ?? null;
    $sig6 = $approvalsByStep[6] ?? null;

    $sig1Name = $sig1?->user?->name ?: $signers['project_responsible']['name'];
    $sig1Pos = $defaultProjPos;

    $sig2Name = $sig2?->user?->name ?: ($resolvedHead['name'] ?? '........................................');
    $sig2Pos = $sig2?->acting_position_text ?: ($resolvedHead['position'] ?? 'หัวหน้างาน / แผนกวิชา');

    $sig3Name = $sig3?->user?->name ?: ($collegeSettings['plan_head_name'] ?? 'นายพิพัฒน์ สีมา');
    $sig3Pos = $sig3?->acting_position_text ?: ($collegeSettings['plan_head_position'] ?? 'หัวหน้างานพัฒนายุทธศาสตร์ แผนงานและงบประมาณ');

    $sig4Name = $sig4?->acting_signatory_name ?: ($sig4?->user?->name ?: $signers['project_deputy']['name']);
    $sig4Pos = $sig4?->acting_position_text ?: $signers['project_deputy']['title'];

    $sig5Name = $sig5?->user?->name ?: $signers['plan_deputy']['name'];
    $sig5Pos = $sig5?->acting_position_text ?: $signers['plan_deputy']['title'];

    $sig6Name = $sig6?->user?->name ?: $signers['director']['name'];
    $sig6Pos = $sig6?->acting_position_text ?: $signers['director']['title'];
@endphp
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>ชุดเอกสารขออนุญาตดำเนินกิจกรรม - {{ $activity['name'] ?? '' }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
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
            background-color: #e2e8f0;
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

        /* Official A4 Saraban Paper */
        .a4-page {
            width: 210mm;
            min-height: 297mm;
            margin: 18px auto 26px auto;
            padding: 20mm 20mm 18mm 28mm;
            background: #ffffff;
            box-shadow: 0 10px 28px rgba(15, 23, 42, 0.18);
            font-size: 16pt;
            line-height: 1.38;
            position: relative;
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

        /* PART 1: Memo Header with Garuda */
        .memo-header {
            position: relative;
            min-height: 1.7cm;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            margin-bottom: 6px;
        }
        .garuda-logo {
            position: absolute;
            left: 0;
            top: 0;
            height: 1.55cm;
            width: auto;
        }
        .memo-title {
            font-size: 29pt;
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
            font-size: 16pt;
            line-height: 1.35;
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
            min-height: 22px;
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
            margin: 6px 0 10px 0;
        }
        .salutation { margin-bottom: 8px; font-size: 16pt; }
        .salutation-label { font-weight: 700; margin-right: 6px; }
        .body-paragraph {
            text-indent: 2.5cm;
            text-align: justify;
            text-justify: inter-cluster;
            margin: 0 0 8px 0;
            font-size: 16pt;
            line-height: 1.42;
        }
        .closing-paragraph {
            text-indent: 2.5cm;
            margin: 4px 0 18px 0;
            font-size: 16pt;
        }

        /* 5-Signer Layout for Part 1 (Memo) */
        .signatures-wrapper {
            margin-top: 14px;
            width: 100%;
            font-size: 15.5pt;
            line-height: 1.35;
        }
        .sig-row-right {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 24px;
        }
        .sig-row-two {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 26px;
        }
        .sig-box {
            width: 46%;
            text-align: center;
        }
        .sig-space {
            min-height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .sig-name, .sig-position { display: block; }

        /* Proposal Official Document Styling (Part 2 & Part 3) */
        .doc-header {
            text-align: center;
            font-weight: 700;
            margin-bottom: 18px;
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
            font-size: 16pt;
            line-height: 1.45;
            text-align: justify;
            text-justify: inter-cluster;
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
            font-size: 14pt;
            margin: 8px 0;
            line-height: 1.3;
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

        /* Part 2: Official 6-Step Approvals Grid (Without Dates) */
        .approval-grid-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000000;
            margin-top: 16px;
            font-size: 14.5pt;
            line-height: 1.3;
        }
        .approval-grid-table td {
            border: 1px solid #000000;
            width: 50%;
            padding: 8px 12px;
            vertical-align: top;
            text-align: center;
        }
        .approval-step-header {
            font-weight: 700;
            text-align: left;
            margin-bottom: 4px;
            display: block;
        }
        .sig-img-container {
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 4px 0;
        }
        .sig-img {
            max-height: 42px;
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
                padding: 18mm 18mm 16mm 26mm !important;
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
                    <label><input type="checkbox" id="chkPart1" checked onchange="toggleSections()"> ส่วนที่ 1: บันทึกข้อความขออนุญาต (ปะหน้า)</label>
                    <label><input type="checkbox" id="chkPart2" checked onchange="toggleSections()"> ส่วนที่ 2: แบบเสนอโครงการหลัก (ฉบับสมบูรณ์พร้อมลงนามครบ)</label>
                    <label><input type="checkbox" id="chkPart3" checked onchange="toggleSections()"> ส่วนที่ 3: แบบเสนอรายละเอียดกิจกรรม (จัดพิมพ์แบบราชการเหมือนโครงการหลัก)</label>
                </div>
            </div>
            <div class="toolbar-actions">
                <button type="button" id="btnAiRedraft" class="btn btn-ai" onclick="regenerateAiMemo()">
                    <span>✨</span>
                    <span id="btnAiText">ให้ AI เรียบเรียงบันทึกข้อความใหม่</span>
                </button>
                <button type="button" class="btn btn-secondary" onclick="toggleThaiDigits()">
                    <span>🔢</span>
                    <span>แปลงเลขไทย</span>
                </button>
                <button type="button" class="btn btn-print" onclick="window.print()">
                    <span>🖨️</span>
                    <span>พิมพ์ทั้งชุด / บันทึก PDF</span>
                </button>
            </div>
        </div>

        <!-- Position Selector Row (When users hold multiple positions) -->
        <div class="toolbar-positions">
            @if(count($actUserPositions) > 1)
                <div class="pos-select-group">
                    <span class="pos-select-label">🏢 ตำแหน่งผู้รับผิดชอบกิจกรรม (เลือกในนามงานใดงานหนึ่ง):</span>
                    <select id="selectActPos" class="pos-select" onchange="applyPositionChange('act', this.value)">
                        @foreach($actUserPositions as $pIdx => $pVal)
                            <option value="{{ $pVal }}" {{ $pVal === $defaultActPos ? 'selected' : '' }}>{{ $pVal }}</option>
                        @endforeach
                    </select>
                </div>
            @endif
            @if(count($projUserPositions) > 1)
                <div class="pos-select-group">
                    <span class="pos-select-label">🏢 ตำแหน่งผู้รับผิดชอบโครงการ (เลือกในนามงานใดงานหนึ่ง):</span>
                    <select id="selectProjPos" class="pos-select" onchange="applyPositionChange('proj', this.value)">
                        @foreach($projUserPositions as $pIdx => $pVal)
                            <option value="{{ $pVal }}" {{ $pVal === $defaultProjPos ? 'selected' : '' }}>{{ $pVal }}</option>
                        @endforeach
                    </select>
                </div>
            @endif
        </div>
    </div>

    <!-- =================================================================== -->
    <!-- PART 1: บันทึกข้อความขออนุญาตดำเนินกิจกรรม (ปะหน้า) -->
    <!-- =================================================================== -->
    <div class="a4-page" id="sectionPart1">
        <span class="section-badge-screen">ส่วนที่ 1 / 3 • บันทึกข้อความปะหน้า</span>
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
                    <span class="meta-dotted editable" contenteditable="true">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/{{ $fiscalYearThai }}</span>
                </div>
                <div class="meta-col-right">
                    <span class="meta-label">วันที่</span>
                    <span class="meta-dotted editable" contenteditable="true">{{ $todayThai }}</span>
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

        <p class="body-paragraph editable" id="memoParagraph1" contenteditable="true">{{ $toThaiDigits($paragraph1) }}</p>
        <p class="body-paragraph editable" id="memoParagraph2" contenteditable="true">{{ $toThaiDigits($paragraph2) }}</p>
        <p class="closing-paragraph editable" contenteditable="true">จึงเรียนมาเพื่อโปรดพิจารณาอนุญาตให้ดำเนินกิจกรรมดังกล่าว</p>

        <!-- 5-Signer Official Signature Block (Without signature dates) -->
        <div class="signatures-wrapper">
            <!-- 1. ผู้รับผิดชอบกิจกรรม -->
            <div class="sig-row-right">
                <div class="sig-box">
                    <div class="sig-space">
                        @if(!empty($signers['activity_responsible']['signature_data']))
                            <img src="{{ $signers['activity_responsible']['signature_data'] }}" class="sig-img" alt="ลายเซ็นผู้รับผิดชอบกิจกรรม">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <span class="sig-name editable" contenteditable="true">({{ $signers['activity_responsible']['name'] }})</span>
                    <span class="sig-position act-pos-display editable" contenteditable="true">{{ $signers['activity_responsible']['title'] }}</span>
                </div>
            </div>

            <!-- 2. ผู้รับผิดชอบโครงการ -->
            <div class="sig-row-right">
                <div class="sig-box">
                    <div class="sig-space">
                        @if(!empty($signers['project_responsible']['signature_data']))
                            <img src="{{ $signers['project_responsible']['signature_data'] }}" class="sig-img" alt="ลายเซ็นผู้รับผิดชอบโครงการ">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <span class="sig-name editable" contenteditable="true">({{ $signers['project_responsible']['name'] }})</span>
                    <span class="sig-position proj-pos-display editable" contenteditable="true">{{ $signers['project_responsible']['title'] }}</span>
                </div>
            </div>

            <!-- 3. รองฝ่ายผู้รับผิดชอบโครงการ (ซ้าย) & 4. รองฝ่ายยุทธศาสตร์และแผนงาน (ขวา) -->
            <div class="sig-row-two">
                <div class="sig-box">
                    <div class="sig-space">
                        @if(!empty($signers['project_deputy']['signature_data']))
                            <img src="{{ $signers['project_deputy']['signature_data'] }}" class="sig-img" alt="ลายเซ็นรองฝ่าย">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <span class="sig-name editable" contenteditable="true">({{ $signers['project_deputy']['name'] }})</span>
                    <span class="sig-position editable" contenteditable="true">{{ $signers['project_deputy']['title'] }}</span>
                </div>
                <div class="sig-box">
                    <div class="sig-space">
                        @if(!empty($signers['plan_deputy']['signature_data']))
                            <img src="{{ $signers['plan_deputy']['signature_data'] }}" class="sig-img" alt="ลายเซ็นรองแผน">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <span class="sig-name editable" contenteditable="true">({{ $signers['plan_deputy']['name'] }})</span>
                    <span class="sig-position editable" contenteditable="true">{{ $signers['plan_deputy']['title'] }}</span>
                </div>
            </div>

            <!-- 5. ผู้อำนวยการ -->
            <div class="sig-row-right" style="margin-bottom: 0;">
                <div class="sig-box">
                    <div class="sig-space">
                        @if(!empty($signers['director']['signature_data']))
                            <img src="{{ $signers['director']['signature_data'] }}" class="sig-img" alt="ลายเซ็นผู้อำนวยการ">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <span class="sig-name editable" contenteditable="true">({{ $signers['director']['name'] }})</span>
                    <span class="sig-position editable" contenteditable="true">{{ $signers['director']['title'] }}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- =================================================================== -->
    <!-- PART 2: แบบเสนอโครงการหลัก (ฉบับสมบูรณ์เหมือนที่พิมพ์เล่มรวม) -->
    <!-- =================================================================== -->
    <div class="a4-page page-break" id="sectionPart2">
        <span class="section-badge-screen">ส่วนที่ 2 / 3 • แบบเสนอโครงการหลัก (ฉบับสมบูรณ์)</span>
        
        <div class="doc-header">
            <h1>โครงการ/กิจกรรม ตาม พ.ร.บ. งบประมาณ ประจำปีงบประมาณ พ.ศ. {{ $fiscalYearThai }}</h1>
            <div class="doc-header-divider"></div>
            <h2>{{ $project->department?->name ?: $divisionName }} {{ $collegeName }}</h2>
        </div>

        <div class="sec-title">๑. ชื่อโครงการ: <span style="font-weight: 600;">{{ $project->title }}</span></div>
        <div class="sec-content">
            <p><strong>ผู้รับผิดชอบโครงการ ชื่อ-สกุล :</strong> {{ $signers['project_responsible']['name'] }}</p>
            <p><strong>ตำแหน่ง :</strong> <span class="proj-raw-pos-display">{{ $defaultProjPos }}</span></p>
            <p><strong>โทรศัพท์เคลื่อนที่ :</strong> {{ $project->phone ?: ($projOwner?->phone ?: '-') }} &nbsp;&nbsp;&nbsp;&nbsp; <strong>E-mail :</strong> {{ $project->email ?: ($projOwner?->email ?: '-') }}</p>
        </div>

        <div class="sec-title">๒. ลักษณะโครงการ</div>
        <div class="sec-content">
            <p><strong>๒.๑ สอดคล้องกับแผนพัฒนาการจัดการศึกษาของสถานศึกษา (พ.ศ. ๒๕๖๘-๒๕๗๐) {{ $collegeName }}</strong></p>
            <div style="padding-left: 20px;">
                <p><strong>- พันธกิจที่ ๑</strong> {{ $toThaiDigits($project->mission ?: 'ผลิตและพัฒนากำลังคนด้านวิชาชีพให้มีคุณภาพตามมาตรฐานการอาชีวศึกษา') }}</p>
                <p><strong>- เป้าประสงค์</strong> {{ $toThaiDigits($project->goal ?: 'ผู้เรียนและผู้สำเร็จการศึกษามีความรู้ ทักษะ การประยุกต์ใช้และมีคุณธรรม จริยธรรม ตามมาตรฐานวิชาชีพ') }}</p>
                <p><strong>- กลยุทธ์ที่ ๑</strong> {{ $toThaiDigits($project->strategy_tactic ?: 'ส่งเสริมด้านวิชาการ คุณธรรม จริยธรรม และค่านิยมที่ดีงามในวิชาชีพ') }}</p>
            </div>

            @if(!empty($strategyCategories) && count($strategyCategories) > 0)
                <p style="margin-top: 6px;"><strong>๒.๒ สอดคล้องกับยุทธศาสตร์ นโยบาย และมาตรฐานการอาชีวศึกษา:</strong></p>
                <div style="padding-left: 20px;">
                    @foreach($strategyCategories as $catIdx => $cat)
                        @php $catItems = $getSelectedCategoryItems($cat); @endphp
                        @if(count($catItems) > 0)
                            <p style="font-weight: 700; margin-top: 4px;">๒.๒.{{ $toThaiDigits($catIdx + 1) }} {{ $cat->name }}</p>
                            <div style="padding-left: 18px;">
                                @foreach($catItems as $itemIdx => $it)
                                    <p>{{ $toThaiDigits($itemIdx + 1) }}) {{ $toThaiDigits($it->name ?: $it->title) }}</p>
                                @endforeach
                            </div>
                        @endif
                    @endforeach
                </div>
            @endif
        </div>

        <div class="sec-title">๓. ความสำคัญของโครงการ/ หลักการและเหตุผล</div>
        <div class="sec-content">
            @if($project->background_rationale)
                @foreach(explode("\n\n", $project->background_rationale) as $bgP)
                    @if(trim($bgP))
                        <p class="thai-indent">{{ $toThaiDigits(trim($bgP)) }}</p>
                    @endif
                @endforeach
            @else
                <p class="thai-indent">-</p>
            @endif
        </div>

        <div class="sec-title">๔. วัตถุประสงค์ของโครงการ</div>
        <div class="sec-content">
            @if(is_array($project->objectives) && count($project->objectives) > 0)
                @foreach($project->objectives as $oIdx => $obj)
                    <p>๔.{{ $toThaiDigits($oIdx + 1) }} {{ $toThaiDigits($obj) }}</p>
                @endforeach
            @else
                <p>๔.๑ {{ $toThaiDigits($project->objectives ?: '-') }}</p>
            @endif
        </div>

        <div class="sec-title">๕. ผลผลิตโครงการ (Output)</div>
        <div class="sec-content">
            @if(count($outputs) > 0)
                @foreach($outputs as $opIdx => $op)
                    <p>๕.{{ $toThaiDigits($opIdx + 1) }} {{ $toThaiDigits($op) }}</p>
                @endforeach
            @else
                <p>๕.๑ ผู้เข้าร่วมโครงการได้รับการอบรมและพัฒนาสมรรถนะครบถ้วนตามหลักเกณฑ์ที่กำหนด</p>
                <p>๕.๒ มีเอกสาร สื่อการเรียนรู้ หรือผลงานจากการดำเนินโครงการที่นำไปใช้ประโยชน์ได้จริง</p>
            @endif
        </div>

        <div class="sec-title">๖. ผลลัพธ์โครงการ (Outcome)</div>
        <div class="sec-content">
            @if(count($outcomes) > 0)
                @foreach($outcomes as $ocIdx => $oc)
                    <p>๖.{{ $toThaiDigits($ocIdx + 1) }} {{ $toThaiDigits($oc) }}</p>
                @endforeach
            @else
                <p>๖.๑ ผู้เรียนและบุคลากรสามารถนำองค์ความรู้และทักษะจากโครงการไปประยุกต์ใช้ในการปฏิบัติงานจริงได้อย่างมีประสิทธิภาพ</p>
                <p>๖.๒ สถานศึกษามีมาตรฐานการจัดการเรียนการสอนและการบริการวิชาชีพที่ได้รับการยอมรับ</p>
            @endif
        </div>

        <div class="sec-title">๗. กลุ่มเป้าหมาย</div>
        <div class="sec-content">
            <p><strong>๗.๑ เชิงปริมาณ</strong></p>
            <div style="padding-left: 20px;">
                @if(is_array($project->targets['quantitative'] ?? null) && count($project->targets['quantitative']) > 0)
                    @foreach($project->targets['quantitative'] as $qIdx => $qVal)
                        <p>๗.๑.{{ $toThaiDigits($qIdx + 1) }} {{ $toThaiDigits($qVal) }}</p>
                    @endforeach
                @else
                    <p>๗.๑.๑ {{ $toThaiDigits($project->targets['quantitative'] ?? '-') }}</p>
                @endif
            </div>
            <p style="margin-top: 4px;"><strong>๗.๒ เชิงคุณภาพ</strong></p>
            <div style="padding-left: 20px;">
                @if(is_array($project->targets['qualitative'] ?? null) && count($project->targets['qualitative']) > 0)
                    @foreach($project->targets['qualitative'] as $qlIdx => $qlVal)
                        <p>๗.๒.{{ $toThaiDigits($qlIdx + 1) }} {{ $toThaiDigits($qlVal) }}</p>
                    @endforeach
                @else
                    <p>๗.๒.๑ {{ $toThaiDigits($project->targets['qualitative'] ?? '-') }}</p>
                @endif
            </div>
        </div>

        <div class="sec-title">๘. พื้นที่ดำเนินการ: <span style="font-weight: 500;">{{ $toThaiDigits($project->location ?: ('ณ ' . $collegeName)) }}</span></div>

        <div class="sec-title">๙. ผลที่คาดว่าจะได้รับ</div>
        <div class="sec-content">
            @if(count($expected_benefits) > 0)
                @foreach($expected_benefits as $ebIdx => $eb)
                    <p>๙.{{ $toThaiDigits($ebIdx + 1) }} {{ $toThaiDigits($eb) }}</p>
                @endforeach
            @else
                <p>๙.๑ ผู้เข้าร่วมโครงการมีทักษะและสมรรถนะตรงตามมาตรฐานวิชาชีพและความต้องการของตลาดแรงงาน</p>
                <p>๙.๒ สถานศึกษามีผลการดำเนินงานที่ตอบสนองต่อนโยบายของสำนักงานคณะกรรมการการอาชีวศึกษา</p>
            @endif
        </div>

        <div class="sec-title">๑๐. ตัวชี้วัดเป้าหมายโครงการ</div>
        <table class="official-table">
            <thead>
                <tr>
                    <th style="width: 22%;">ประเภทตัวชี้วัด</th>
                    <th>ตัวชี้วัด</th>
                    <th style="width: 25%;">หน่วยนับ / จำนวนเงิน</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="font-weight: 700; text-align: center;">เชิงปริมาณ</td>
                    <td>{{ $toThaiDigits($quantText) }}</td>
                    <td style="text-align: center; font-weight: 600;">{{ $toThaiDigits($quantUnit) }}</td>
                </tr>
                <tr>
                    <td style="font-weight: 700; text-align: center;">เชิงคุณภาพ</td>
                    <td>{{ $toThaiDigits($qualText) }}</td>
                    <td style="text-align: center; font-weight: 600;">{{ $toThaiDigits($qualUnit) }}</td>
                </tr>
                <tr>
                    <td style="font-weight: 700; text-align: center;">เชิงเวลา</td>
                    <td>{{ $toThaiDigits($timeText) }}</td>
                    <td style="text-align: center; font-weight: 600;">{{ $toThaiDigits($timeUnit) }}</td>
                </tr>
                <tr>
                    <td style="font-weight: 700; text-align: center;">เชิงต้นทุน</td>
                    <td>{{ $toThaiDigits($costText) }}</td>
                    <td style="text-align: center; font-weight: 600;">{{ $toThaiDigits($costUnit) }}</td>
                </tr>
            </tbody>
        </table>

        <div class="sec-title">๑๑. สรุปขั้นตอน/วิธีดำเนินการ และหมวดเงินที่ใช้</div>
        <table class="official-table" style="font-size: 13pt;">
            <thead>
                <tr>
                    <th rowspan="2" style="width: 32%;">ขั้นตอน/วิธีดำเนินการ</th>
                    <th colspan="4" style="width: 16%;">ดำเนินการในไตรมาส (✓)</th>
                    <th rowspan="2" style="width: 14%;">เป้าหมาย</th>
                    <th rowspan="2" style="width: 14%;">พื้นที่ดำเนินการ</th>
                    <th colspan="4">หมวดเงิน (บาท)</th>
                </tr>
                <tr>
                    <th style="width: 4%;">๑</th>
                    <th style="width: 4%;">๒</th>
                    <th style="width: 4%;">๓</th>
                    <th style="width: 4%;">๔</th>
                    <th style="width: 7%;">ดำเนินงาน</th>
                    <th style="width: 6%;">ลงทุน</th>
                    <th style="width: 6%;">รายจ่ายอื่น</th>
                    <th style="width: 6%;">อุดหนุน</th>
                </tr>
            </thead>
            <tbody>
                @foreach($planSteps as $sIdx => $st)
                    <tr>
                        <td style="text-align: left;">{{ $toThaiDigits($st['step_name'] ?? '') }}</td>
                        <td style="text-align: center; font-weight: 700;">{{ !empty($st['q1']) ? '✓' : '' }}</td>
                        <td style="text-align: center; font-weight: 700;">{{ !empty($st['q2']) ? '✓' : '' }}</td>
                        <td style="text-align: center; font-weight: 700;">{{ !empty($st['q3']) ? '✓' : '' }}</td>
                        <td style="text-align: center; font-weight: 700;">{{ !empty($st['q4']) ? '✓' : '' }}</td>
                        <td style="text-align: center;">{{ $toThaiDigits($st['target_count'] ?? '') }}</td>
                        <td style="text-align: center;">{{ $toThaiDigits($st['location_name'] ?? '') }}</td>
                        <td style="text-align: right;">{{ !empty($st['budget_operating']) ? $toThaiDigits(number_format((float)$st['budget_operating'], 0)) : '' }}</td>
                        <td style="text-align: right;">{{ !empty($st['budget_investment']) ? $toThaiDigits(number_format((float)$st['budget_investment'], 0)) : '' }}</td>
                        <td style="text-align: right;">{{ !empty($st['budget_other']) ? $toThaiDigits(number_format((float)$st['budget_other'], 0)) : '' }}</td>
                        <td style="text-align: right;">{{ !empty($st['budget_subsidy']) ? $toThaiDigits(number_format((float)$st['budget_subsidy'], 0)) : '' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- 12. การอนุมัติโครงการ (Official 6 Approvals Table - NO DATE) -->
        <div class="sec-title" style="margin-top: 18px;">๑๒. การอนุมัติโครงการ: {{ $project->title }}</div>
        <table class="approval-grid-table">
            <tr>
                <td>
                    <span class="approval-step-header">๑. ผู้เสนอโครงการ</span>
                    <div class="sig-img-container">
                        @if($getStepSigImg(1) ?: ($signers['project_responsible']['signature_data'] ?? null))
                            <img src="{{ $getStepSigImg(1) ?: $signers['project_responsible']['signature_data'] }}" class="sig-img" alt="ลายเซ็นผู้เสนอ">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <div>({{ $sig1Name }})</div>
                    <div><span class="proj-raw-pos-display">{{ $sig1Pos }}</span></div>
                </td>
                <td>
                    <span class="approval-step-header">ผู้เห็นชอบโครงการ (รองผู้อำนวยการฝ่ายที่กำกับดูแล)</span>
                    <div class="sig-img-container">
                        @if($getStepSigImg(4))
                            <img src="{{ $getStepSigImg(4) }}" class="sig-img" alt="ลายเซ็นรองฝ่าย">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <div>({{ $sig4Name }})</div>
                    <div>{{ $sig4Pos }}</div>
                </td>
            </tr>
            <tr>
                <td>
                    <span class="approval-step-header">๒. หัวหน้างาน / หัวหน้าแผนกวิชา</span>
                    <div class="sig-img-container">
                        @if($getStepSigImg(2))
                            <img src="{{ $getStepSigImg(2) }}" class="sig-img" alt="ลายเซ็นหัวหน้างาน">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <div>({{ $sig2Name }})</div>
                    <div>{{ $sig2Pos }}</div>
                </td>
                <td>
                    <span class="approval-step-header">๓. งานวางแผนและงบประมาณ</span>
                    <div class="sig-img-container">
                        @if($getStepSigImg(3))
                            <img src="{{ $getStepSigImg(3) }}" class="sig-img" alt="ลายเซ็นงานแผน">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <div>({{ $sig3Name }})</div>
                    <div>{{ $sig3Pos }}</div>
                </td>
            </tr>
            <tr>
                <td>
                    <span class="approval-step-header">๕. รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน</span>
                    <div class="sig-img-container">
                        @if($getStepSigImg(5))
                            <img src="{{ $getStepSigImg(5) }}" class="sig-img" alt="ลายเซ็นรองแผน">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <div>({{ $sig5Name }})</div>
                    <div>{{ $sig5Pos }}</div>
                </td>
                <td>
                    <span class="approval-step-header">๖. การพิจารณาอนุมัติ (ผู้อำนวยการสถานศึกษา)</span>
                    <div class="sig-img-container">
                        @if($getStepSigImg(6))
                            <img src="{{ $getStepSigImg(6) }}" class="sig-img" alt="ลายเซ็นผู้อำนวยการ">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <div>({{ $sig6Name }})</div>
                    <div>{{ $sig6Pos }}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- =================================================================== -->
    <!-- PART 3: แบบเสนอรายละเอียดการดำเนินกิจกรรม (จัดพิมพ์เหมือนโครงการหลัก) -->
    <!-- =================================================================== -->
    <div class="a4-page page-break" id="sectionPart3">
        <span class="section-badge-screen">ส่วนที่ 3 / 3 • รายละเอียดการดำเนินกิจกรรม</span>

        <div class="doc-header">
            <h1>โครงการ/กิจกรรม ตาม พ.ร.บ. งบประมาณ ประจำปีงบประมาณ พ.ศ. {{ $fiscalYearThai }}</h1>
            <div class="doc-header-divider"></div>
            <h2>แบบเสนอรายละเอียดการดำเนินกิจกรรม</h2>
            <p style="margin: 2px 0 0 0; font-size: 15pt;">กิจกรรม: <strong>{{ $activity['name'] ?? '-' }}</strong></p>
            <p style="margin: 2px 0 0 0; font-size: 14pt;">ภายใต้โครงการ: {{ $project->title }} • {{ $project->department?->name ?: $divisionName }} {{ $collegeName }}</p>
        </div>

        <div class="sec-title">๑. ชื่อกิจกรรม และผู้รับผิดชอบดำเนินกิจกรรม</div>
        <div class="sec-content">
            <p><strong>๑.๑ ชื่อกิจกรรม :</strong> <span style="font-weight: 600;">{{ $activity['name'] ?? '-' }}</span></p>
            <p><strong>๑.๒ ผู้รับผิดชอบกิจกรรม :</strong> {{ $signers['activity_responsible']['name'] }}</p>
            <p><strong>๑.๓ ตำแหน่ง :</strong> <span class="act-raw-pos-display">{{ $defaultActPos }}</span></p>
            <p><strong>๑.๔ ข้อมูลติดต่อ :</strong> โทรศัพท์: {{ $fillerUser?->phone ?: '-' }} &nbsp;&nbsp;&nbsp;&nbsp; E-mail: {{ $fillerUser?->email ?: '-' }}</p>
            @if($assignedUsers && $assignedUsers->count() > 1)
                <p><strong>๑.๕ ผู้ร่วมดำเนินกิจกรรม :</strong> {{ $assignedUsers->pluck('name')->implode(', ') }}</p>
            @endif
        </div>

        <div class="sec-title">๒. ความสอดคล้องกับวัตถุประสงค์และเป้าหมายของโครงการหลัก</div>
        <div class="sec-content">
            <p class="thai-indent">
                กิจกรรมนี้ดำเนินการภายใต้โครงการหลัก "<strong>{{ $project->title }}</strong>" เพื่อสนับสนุนการดำเนินงานให้บรรลุตามวัตถุประสงค์ของโครงการหลัก โดยจัดสรรกรอบงบประมาณจำนวน {{ $toThaiDigits(number_format((float)$budgetAmount, 2)) }} บาท จากวงเงินงบประมาณโครงการที่ได้รับจัดสรรทั้งสิ้น {{ $toThaiDigits(number_format((float)$totalProjectBudget, 2)) }} บาท
            </p>
        </div>

        <div class="sec-title">๓. ความสำคัญของกิจกรรม / หลักการและเหตุผล</div>
        <div class="sec-content">
            @php $actBg = !empty($activity['background_rationale']) ? $activity['background_rationale'] : $project->background_rationale; @endphp
            @if($actBg)
                @foreach(explode("\n\n", $actBg) as $actP)
                    @if(trim($actP))
                        <p class="thai-indent">{{ $toThaiDigits(trim($actP)) }}</p>
                    @endif
                @endforeach
            @else
                <p class="thai-indent">-</p>
            @endif
        </div>

        <div class="sec-title">๔. วัตถุประสงค์ของกิจกรรม</div>
        <div class="sec-content">
            @php $actObjs = !empty($activity['objectives']) ? $activity['objectives'] : $project->objectives; @endphp
            @if(is_array($actObjs) && count($actObjs) > 0)
                @foreach($actObjs as $aObjIdx => $aObj)
                    <p>๔.{{ $toThaiDigits($aObjIdx + 1) }} {{ $toThaiDigits($aObj) }}</p>
                @endforeach
            @else
                <p>๔.๑ {{ $toThaiDigits($actObjs ?: '-') }}</p>
            @endif
        </div>

        <div class="sec-title">๕. ผลผลิตและผลลัพธ์ของกิจกรรม (Output & Outcome)</div>
        <div class="sec-content">
            <p><strong>๕.๑ ผลผลิต (Output) :</strong> ผู้เข้าร่วมกิจกรรมได้รับการพัฒนาความรู้ ทักษะวิชาชีพ และสมรรถนะตรงตามเกณฑ์ที่กำหนด</p>
            <p><strong>๕.๒ ผลลัพธ์ (Outcome) :</strong> ผู้เรียนและบุคลากรสามารถนำทักษะจากการดำเนินกิจกรรมไปประยุกต์ใช้ในการปฏิบัติงานและการประกอบอาชีพได้อย่างมีประสิทธิภาพ</p>
        </div>

        <div class="sec-title">๖. กลุ่มเป้าหมายของกิจกรรม</div>
        <div class="sec-content">
            <p><strong>๖.๑ เชิงปริมาณ :</strong> {{ $toThaiDigits(!empty($activity['target_group']) ? $activity['target_group'] : ($project->targets['quantitative'] ?? 'ผู้เข้าร่วมกิจกรรมตามเป้าหมายที่กำหนด')) }}</p>
            <p><strong>๖.๒ เชิงคุณภาพ :</strong> ผู้เข้าร่วมกิจกรรมมีความพึงพอใจและมีผลสัมฤทธิ์ผ่านเกณฑ์การประเมินในระดับดีมาก</p>
        </div>

        <div class="sec-title">๗. พื้นที่และระยะเวลาดำเนินการ</div>
        <div class="sec-content">
            <p><strong>๗.๑ ระยะเวลาดำเนินการ :</strong> {{ $toThaiDigits($dateText) }}</p>
            <p><strong>๗.๒ สถานที่ดำเนินการ :</strong> {{ $location ?: $collegeName }}</p>
        </div>

        <div class="sec-title">๘. ผลที่คาดว่าจะได้รับจากกิจกรรม</div>
        <div class="sec-content">
            @php $actBenefits = !empty($activity['expected_benefits']) ? $activity['expected_benefits'] : $project->expected_benefits; @endphp
            @if(is_array($actBenefits) && count($actBenefits) > 0)
                @foreach($actBenefits as $bIdx => $bVal)
                    <p>๘.{{ $toThaiDigits($bIdx + 1) }} {{ $toThaiDigits($bVal) }}</p>
                @endforeach
            @else
                <p>๘.๑ {{ $toThaiDigits($actBenefits ?: '-') }}</p>
            @endif
        </div>

        <div class="sec-title">๙. ตัวชี้วัดความสำเร็จของกิจกรรม</div>
        <div class="sec-content">
            @php $actInds = !empty($activity['indicators']) ? $activity['indicators'] : null; @endphp
            @if($actInds)
                <p>{{ $toThaiDigits($actInds) }}</p>
            @else
                <p>๙.๑ เชิงปริมาณ: มีผู้เข้าร่วมกิจกรรมครบถ้วนตามเป้าหมายที่กำหนด คิดเป็นร้อยละ ๑๐๐</p>
                <p>๙.๒ เชิงคุณภาพ: ผู้เข้าร่วมมีความพึงพอใจต่อการจัดกิจกรรมในระดับดีขึ้นไป ไม่น้อยกว่าร้อยละ ๘๕</p>
                <p>๙.๓ เชิงเวลา: กิจกรรมดำเนินการแล้วเสร็จตามกำหนดการในแผนปฏิบัติการ</p>
            @endif
        </div>

        <div class="sec-title">๑๐. รายละเอียดงบประมาณและการจัดซื้อจัดจ้าง / สัญญายืมเงิน (กค. ๑๐๑) ของกิจกรรม</div>
        <div class="sec-content">
            <p>
                <strong>วงเงินงบประมาณกิจกรรมทั้งสิ้น :</strong> {{ $toThaiDigits(number_format((float)$budgetAmount, 2)) }} บาท
                <span style="font-size: 14pt; color: #334155;">(ตัดจากกรอบวงเงินงบประมาณโครงการหลัก {{ $toThaiDigits(number_format((float)$totalProjectBudget, 2)) }} บาท)</span>
            </p>
        </div>

        @if($linkedSets && $linkedSets->count() > 0)
            <table class="official-table" style="margin-top: 8px;">
                <thead>
                    <tr>
                        <th style="width: 8%;">ลำดับ</th>
                        <th style="width: 24%;">ประเภทเอกสาร</th>
                        <th>ชื่อชุดเอกสาร / รายการ</th>
                        <th style="width: 20%;">วงเงิน (บาท)</th>
                    </tr>
                </thead>
                <tbody>
                    @php $grandSetSum = 0; @endphp
                    @foreach($linkedSets as $sIdx => $s)
                        @php
                            $sSum = (float) $s->items->sum('total_price');
                            $grandSetSum += $sSum;
                        @endphp
                        <tr>
                            <td style="text-align: center;">{{ $toThaiDigits($sIdx + 1) }}</td>
                            <td style="text-align: center;">{{ ($s->set_type ?? 'procurement') === 'loan' ? 'สัญญายืมเงิน (กค. ๑๐๑)' : 'จัดซื้อจัดจ้างพัสดุ' }}</td>
                            <td>
                                <strong>{{ $s->set_name ?: $s->procurement_number }}</strong>
                                @if($s->items && $s->items->count() > 0)
                                    <div style="font-size: 13pt; color: #334155; margin-top: 2px;">
                                        @foreach($s->items as $itIdx => $it)
                                            • {{ $it->description }} ({{ $toThaiDigits($it->quantity) }} {{ $it->unit }} × {{ $toThaiDigits(number_format((float)$it->unit_price, 2)) }})<br>
                                        @endforeach
                                    </div>
                                @endif
                            </td>
                            <td style="text-align: right; font-weight: 700;">{{ $toThaiDigits(number_format($sSum, 2)) }}</td>
                        </tr>
                    @endforeach
                    <tr>
                        <td colspan="3" style="text-align: right; font-weight: 700; background: #f8fafc;">รวมงบประมาณที่ใช้ในกิจกรรมนี้ทั้งสิ้น</td>
                        <td style="text-align: right; font-weight: 700; background: #f8fafc;">{{ $toThaiDigits(number_format($grandSetSum, 2)) }}</td>
                    </tr>
                </tbody>
            </table>
        @endif

        <!-- 11. การลงนามรับผิดชอบการดำเนินกิจกรรม (NO DATE) -->
        <div class="sec-title" style="margin-top: 24px;">๑๑. การลงนามรับผิดชอบการดำเนินกิจกรรม</div>
        <div class="signatures-wrapper" style="margin-top: 16px;">
            <div class="sig-row-two" style="margin-bottom: 0;">
                <!-- ซ้าย: ผู้รับผิดชอบกิจกรรม -->
                <div class="sig-box" style="width: 48%;">
                    <div class="sig-space">
                        @if(!empty($signers['activity_responsible']['signature_data']))
                            <img src="{{ $signers['activity_responsible']['signature_data'] }}" class="sig-img" alt="ลายเซ็นผู้รับผิดชอบกิจกรรม">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <span class="sig-name editable" contenteditable="true">({{ $signers['activity_responsible']['name'] }})</span>
                    <span class="sig-position act-pos-display editable" contenteditable="true">{{ $signers['activity_responsible']['title'] }}</span>
                </div>

                <!-- ขวา: ผู้รับผิดชอบโครงการ -->
                <div class="sig-box" style="width: 48%;">
                    <div class="sig-space">
                        @if(!empty($signers['project_responsible']['signature_data']))
                            <img src="{{ $signers['project_responsible']['signature_data'] }}" class="sig-img" alt="ลายเซ็นผู้รับผิดชอบโครงการ">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <span class="sig-name editable" contenteditable="true">({{ $signers['project_responsible']['name'] }})</span>
                    <span class="sig-position proj-pos-display editable" contenteditable="true">{{ $signers['project_responsible']['title'] }}</span>
                </div>
            </div>
        </div>
    </div>

    <script>
        const toThaiDigitsJs = (str) => {
            const thai = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
            return String(str || '').replace(/[0-9]/g, d => thai[Number(d)]);
        };

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
                    document.getElementById('memoParagraph1').textContent = toThaiDigitsJs(data.paragraph1);
                    document.getElementById('memoParagraph2').textContent = toThaiDigitsJs(data.paragraph2);
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
            const p1 = document.getElementById('memoParagraph1');
            const p2 = document.getElementById('memoParagraph2');
            p1.textContent = toThaiDigitsJs(p1.textContent);
            p2.textContent = toThaiDigitsJs(p2.textContent);
        }
    </script>
</body>
</html>
