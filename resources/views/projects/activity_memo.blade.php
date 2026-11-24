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

    $getStepSigImg = function ($step) use ($approvalsByStep) {
        $ap = $approvalsByStep[$step] ?? null;
        if (!$ap) return null;
        if (!empty($ap->signature_data)) return $ap->signature_data;
        if (!empty($ap->user?->signature_data)) return $ap->user->signature_data;
        return null;
    };

    $getStepSignerName = function ($step, $fallbackName) use ($approvalsByStep) {
        $ap = $approvalsByStep[$step] ?? null;
        if ($ap && $ap->user?->name) return $ap->user->name;
        return $fallbackName;
    };

    $getStepDate = function ($step) use ($approvalsByStep, $formatDateThai) {
        $ap = $approvalsByStep[$step] ?? null;
        if (!$ap) return '';
        $dt = $ap->action_date ?: $ap->updated_at;
        return $dt ? $formatDateThai($dt) : '';
    };

    $projectFundingList = [];
    if ($project->budgets && $project->budgets->count() > 0) {
        foreach ($project->budgets as $b) {
            $projectFundingList[] = ($b->fundingSource?->name ?: 'งบประมาณ') . ' จำนวน ' . $toThaiDigits(number_format((float)$b->allocated_amount, 2)) . ' บาท';
        }
    } elseif ($project->fundingSource) {
        $projectFundingList[] = $project->fundingSource->name . ' จำนวน ' . $toThaiDigits(number_format((float)$totalProjectBudget, 2)) . ' บาท';
    }
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
            font-family: "TH Sarabun PSK", "TH Sarabun New", "Sarabun", sans-serif;
            color: #000000;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* Screen Toolbar */
        .toolbar {
            position: sticky;
            top: 0;
            z-index: 50;
            background: linear-gradient(90deg, #312e81, #4c1d95);
            color: #ffffff;
            padding: 10px 20px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            font-family: "Sarabun", sans-serif;
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
            margin-top: 4px;
            color: #e0e7ff;
        }
        .toolbar-checks label {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
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

        /* 5-Signer Layout Matching Official Form */
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
        .sig-space { height: 28px; }
        .sig-name, .sig-position { display: block; }

        /* PART 2 & PART 3: Structured Proposal / Activity Detail Tables */
        .doc-center-header {
            text-align: center;
            margin-bottom: 12px;
            border-bottom: 1.5px solid #000000;
            padding-bottom: 8px;
        }
        .doc-center-header h1 {
            margin: 0;
            font-size: 20pt;
            font-weight: 700;
            line-height: 1.25;
        }
        .doc-center-header p {
            margin: 2px 0 0 0;
            font-size: 15pt;
        }
        .detail-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 15pt;
            line-height: 1.35;
        }
        .detail-table th, .detail-table td {
            border: 1px solid #000000;
            padding: 5px 8px;
            vertical-align: top;
        }
        .detail-table th {
            width: 28%;
            text-align: left;
            font-weight: 700;
            background-color: #f8fafc;
        }
        .pre-wrap {
            white-space: pre-line;
        }

        /* Approval Signature Grid for Part 2 (Main Project Signatures) */
        .approval-sig-grid {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 13.5pt;
            line-height: 1.3;
        }
        .approval-sig-grid td {
            border: 1px solid #000000;
            width: 50%;
            padding: 8px 10px;
            vertical-align: top;
            text-align: center;
        }
        .approval-role-label {
            font-weight: 700;
            text-align: left;
            display: block;
            margin-bottom: 4px;
            font-size: 13.5pt;
        }
        .sig-img-wrap {
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 2px 0;
        }
        .sig-img {
            max-height: 42px;
            max-width: 150px;
            object-fit: contain;
        }
        .sig-date {
            font-size: 12pt;
            color: #334155;
            display: block;
        }

        /* Items summary table inside Part 3 */
        .sets-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 14pt;
        }
        .sets-table th, .sets-table td {
            border: 1px solid #000000;
            padding: 4px 6px;
        }
        .sets-table th {
            background-color: #f1f5f9;
            text-align: center;
            font-weight: 700;
        }

        .hidden-section {
            display: none !important;
        }

        @media print {
            body { background: #ffffff !important; }
            .toolbar, .section-badge-screen { display: none !important; }
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
    <div class="toolbar">
        <div>
            <div class="toolbar-title">
                <span>📄</span>
                <span>ชุดเอกสารขออนุญาตดำเนินกิจกรรม (แบบฟอร์มราชการ Sarabun)</span>
            </div>
            <div class="toolbar-checks">
                <label><input type="checkbox" id="chkPart1" checked onchange="toggleSections()"> ส่วนที่ 1: บันทึกข้อความขออนุญาต (ปะหน้า)</label>
                <label><input type="checkbox" id="chkPart2" checked onchange="toggleSections()"> ส่วนที่ 2: รายละเอียดโครงการหลัก (พร้อมลายเซ็นต์)</label>
                <label><input type="checkbox" id="chkPart3" checked onchange="toggleSections()"> ส่วนที่ 3: รายละเอียดกิจกรรม (ลงนามผู้รับผิดชอบกิจกรรม)</label>
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

        <!-- 5-Signer Official Signature Block -->
        <div class="signatures-wrapper">
            <!-- 1. ผู้รับผิดชอบกิจกรรม -->
            <div class="sig-row-right">
                <div class="sig-box">
                    <div class="sig-space"></div>
                    <span class="sig-name editable" contenteditable="true">({{ $signers['activity_responsible']['name'] }})</span>
                    <span class="sig-position editable" contenteditable="true">{{ $signers['activity_responsible']['title'] }}</span>
                </div>
            </div>

            <!-- 2. ผู้รับผิดชอบโครงการ -->
            <div class="sig-row-right">
                <div class="sig-box">
                    <div class="sig-space"></div>
                    <span class="sig-name editable" contenteditable="true">({{ $signers['project_responsible']['name'] }})</span>
                    <span class="sig-position editable" contenteditable="true">{{ $signers['project_responsible']['title'] }}</span>
                </div>
            </div>

            <!-- 3. รองฝ่ายผู้รับผิดชอบโครงการ (ซ้าย) & 4. รองฝ่ายยุทธศาสตร์และแผนงาน (ขวา) -->
            <div class="sig-row-two">
                <div class="sig-box">
                    <div class="sig-space"></div>
                    <span class="sig-name editable" contenteditable="true">({{ $signers['project_deputy']['name'] }})</span>
                    <span class="sig-position editable" contenteditable="true">{{ $signers['project_deputy']['title'] }}</span>
                </div>
                <div class="sig-box">
                    <div class="sig-space"></div>
                    <span class="sig-name editable" contenteditable="true">({{ $signers['plan_deputy']['name'] }})</span>
                    <span class="sig-position editable" contenteditable="true">{{ $signers['plan_deputy']['title'] }}</span>
                </div>
            </div>

            <!-- 5. ผู้อำนวยการ -->
            <div class="sig-row-right" style="margin-bottom: 0;">
                <div class="sig-box">
                    <div class="sig-space"></div>
                    <span class="sig-name editable" contenteditable="true">({{ $signers['director']['name'] }})</span>
                    <span class="sig-position editable" contenteditable="true">{{ $signers['director']['title'] }}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- =================================================================== -->
    <!-- PART 2: รายละเอียดโครงการหลัก (พร้อมลายเซ็นต์อนุมัติ) -->
    <!-- =================================================================== -->
    <div class="a4-page page-break" id="sectionPart2">
        <span class="section-badge-screen">ส่วนที่ 2 / 3 • โครงการหลัก (มีลายเซ็นต์)</span>
        <div class="doc-center-header">
            <h1>แบบเสนอโครงการ (โครงการหลักที่ได้รับอนุมัติ)</h1>
            <p>{{ $collegeName }} • ปีงบประมาณ พ.ศ. {{ $fiscalYearThai }}</p>
        </div>

        <table class="detail-table">
            <tr>
                <th>ชื่อโครงการ</th>
                <td style="font-weight: 700;">{{ $project->title }}</td>
            </tr>
            <tr>
                <th>ฝ่าย / แผนกวิชา / งาน</th>
                <td>{{ $divisionName }} @if($project->department && $project->department->name !== $divisionName) ({{ $project->department->name }}) @endif</td>
            </tr>
            <tr>
                <th>ผู้รับผิดชอบโครงการ</th>
                <td>{{ $signers['project_responsible']['name'] }}</td>
            </tr>
            <tr>
                <th>งบประมาณที่ได้รับจัดสรร</th>
                <td>
                    <strong>{{ $toThaiDigits(number_format((float)$totalProjectBudget, 2)) }} บาท</strong>
                    @if(count($projectFundingList) > 0)
                        <div style="font-size: 14pt; margin-top: 2px;">แหล่งเงินทุน: {{ implode(' / ', $projectFundingList) }}</div>
                    @endif
                </td>
            </tr>
            <tr>
                <th>ระยะเวลา / สถานที่</th>
                <td>
                    {{ $project->operation_period_text ?: ($formatDateThai($project->start_date) . ' ถึง ' . $formatDateThai($project->end_date)) }}
                    @if($project->location) • ณ {{ $project->location }} @endif
                </td>
            </tr>
            @if($project->background_rationale)
            <tr>
                <th>หลักการและเหตุผล</th>
                <td class="pre-wrap">{{ $toThaiDigits($project->background_rationale) }}</td>
            </tr>
            @endif
            @if($project->objectives)
            <tr>
                <th>วัตถุประสงค์ของโครงการ</th>
                <td class="pre-wrap">{{ $toThaiDigits($project->objectives) }}</td>
            </tr>
            @endif
            @if($project->targets)
            <tr>
                <th>เป้าหมายของโครงการ</th>
                <td class="pre-wrap">{{ $toThaiDigits($project->targets) }}</td>
            </tr>
            @endif
            @if($project->indicators)
            <tr>
                <th>ตัวชี้วัดความสำเร็จ</th>
                <td class="pre-wrap">{{ $toThaiDigits($project->indicators) }}</td>
            </tr>
            @endif
            @if($project->expected_benefits)
            <tr>
                <th>ผลที่คาดว่าจะได้รับ</th>
                <td class="pre-wrap">{{ $toThaiDigits($project->expected_benefits) }}</td>
            </tr>
            @endif
        </table>

        <!-- ลายมือชื่อการอนุมัติโครงการหลัก -->
        <table class="approval-sig-grid">
            <tr>
                <td>
                    <span class="approval-role-label">๑. ผู้เสนอโครงการ</span>
                    <div class="sig-img-wrap">
                        @if($getStepSigImg(1) ?: ($signers['project_responsible']['signature_data'] ?? null))
                            <img src="{{ $getStepSigImg(1) ?: $signers['project_responsible']['signature_data'] }}" class="sig-img" alt="ลายเซ็นผู้เสนอ">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <div>({{ $getStepSignerName(1, $signers['project_responsible']['name']) }})</div>
                    <div>ผู้รับผิดชอบโครงการ</div>
                    @if($getStepDate(1))<span class="sig-date">วันที่ {{ $getStepDate(1) }}</span>@endif
                </td>
                <td>
                    <span class="approval-role-label">๒. หัวหน้างาน / หัวหน้าแผนกวิชา</span>
                    <div class="sig-img-wrap">
                        @if($getStepSigImg(2))
                            <img src="{{ $getStepSigImg(2) }}" class="sig-img" alt="ลายเซ็นหัวหน้างาน">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <div>({{ $getStepSignerName(2, '........................................') }})</div>
                    <div>หัวหน้างาน / แผนกวิชา</div>
                    @if($getStepDate(2))<span class="sig-date">วันที่ {{ $getStepDate(2) }}</span>@endif
                </td>
            </tr>
            <tr>
                <td>
                    <span class="approval-role-label">๓. งานวางแผนและงบประมาณ</span>
                    <div class="sig-img-wrap">
                        @if($getStepSigImg(3))
                            <img src="{{ $getStepSigImg(3) }}" class="sig-img" alt="ลายเซ็นงานแผน">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <div>({{ $getStepSignerName(3, '........................................') }})</div>
                    <div>หัวหน้างานวางแผนและงบประมาณ</div>
                    @if($getStepDate(3))<span class="sig-date">วันที่ {{ $getStepDate(3) }}</span>@endif
                </td>
                <td>
                    <span class="approval-role-label">๔. รองผู้อำนวยการฝ่ายที่กำกับดูแล</span>
                    <div class="sig-img-wrap">
                        @if($getStepSigImg(4))
                            <img src="{{ $getStepSigImg(4) }}" class="sig-img" alt="ลายเซ็นรองฝ่าย">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <div>({{ $getStepSignerName(4, $signers['project_deputy']['name']) }})</div>
                    <div>{{ $signers['project_deputy']['title'] }}</div>
                    @if($getStepDate(4))<span class="sig-date">วันที่ {{ $getStepDate(4) }}</span>@endif
                </td>
            </tr>
            <tr>
                <td>
                    <span class="approval-role-label">๕. รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน</span>
                    <div class="sig-img-wrap">
                        @if($getStepSigImg(5))
                            <img src="{{ $getStepSigImg(5) }}" class="sig-img" alt="ลายเซ็นรองแผน">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <div>({{ $getStepSignerName(5, $signers['plan_deputy']['name']) }})</div>
                    <div>{{ $signers['plan_deputy']['title'] }}</div>
                    @if($getStepDate(5))<span class="sig-date">วันที่ {{ $getStepDate(5) }}</span>@endif
                </td>
                <td>
                    <span class="approval-role-label">๖. การพิจารณาอนุมัติ (ผู้อำนวยการสถานศึกษา)</span>
                    <div class="sig-img-wrap">
                        @if($getStepSigImg(6))
                            <img src="{{ $getStepSigImg(6) }}" class="sig-img" alt="ลายเซ็นผู้อำนวยการ">
                        @else
                            <span>ลงชื่อ ....................................................</span>
                        @endif
                    </div>
                    <div>({{ $getStepSignerName(6, $signers['director']['name']) }})</div>
                    <div>{{ $signers['director']['title'] }}</div>
                    @if($getStepDate(6))<span class="sig-date">วันที่ {{ $getStepDate(6) }}</span>@endif
                </td>
            </tr>
        </table>
    </div>

    <!-- =================================================================== -->
    <!-- PART 3: รายละเอียดกิจกรรมย่อย (ลงนามโดยผู้รับผิดชอบกิจกรรม) -->
    <!-- =================================================================== -->
    <div class="a4-page page-break" id="sectionPart3">
        <span class="section-badge-screen">ส่วนที่ 3 / 3 • รายละเอียดกิจกรรมย่อย</span>
        <div class="doc-center-header">
            <h1>รายละเอียดการดำเนินกิจกรรม</h1>
            <p>กิจกรรม: <strong>{{ $activity['name'] ?? '-' }}</strong></p>
            <p style="font-size: 14pt;">ภายใต้โครงการ: {{ $project->title }} • ปีงบประมาณ พ.ศ. {{ $fiscalYearThai }}</p>
        </div>

        <table class="detail-table">
            <tr>
                <th>ชื่อกิจกรรม</th>
                <td style="font-weight: 700;">{{ $activity['name'] ?? '-' }}</td>
            </tr>
            <tr>
                <th>ภายใต้โครงการหลัก</th>
                <td>{{ $project->title }}</td>
            </tr>
            <tr>
                <th>ผู้รับผิดชอบกิจกรรม</th>
                <td>
                    {{ $signers['activity_responsible']['name'] }}
                    @if($assignedUsers && $assignedUsers->count() > 1)
                        <div style="font-size: 14pt;">ผู้ร่วมดำเนินกิจกรรม: {{ $assignedUsers->pluck('name')->implode(', ') }}</div>
                    @endif
                </td>
            </tr>
            <tr>
                <th>ประมาณการวันเวลาดำเนินกิจกรรม</th>
                <td>{{ $toThaiDigits($dateText) }}</td>
            </tr>
            <tr>
                <th>สถานที่ดำเนินกิจกรรม</th>
                <td>{{ $location ?: $collegeName }}</td>
            </tr>
            @if(!empty($activity['target_group']))
            <tr>
                <th>กลุ่มเป้าหมาย / ผู้เข้าร่วม</th>
                <td>{{ $toThaiDigits($activity['target_group']) }}</td>
            </tr>
            @endif
            <tr>
                <th>งบประมาณของกิจกรรม</th>
                <td>
                    <strong>{{ $toThaiDigits(number_format((float)$budgetAmount, 2)) }} บาท</strong>
                    <span style="font-size: 14pt;">(ตัดจากงบประมาณโครงการหลักที่ได้รับจัดสรร {{ $toThaiDigits(number_format((float)$totalProjectBudget, 2)) }} บาท)</span>
                </td>
            </tr>
            @if(!empty($activity['background_rationale']))
            <tr>
                <th>หลักการและเหตุผลของกิจกรรม</th>
                <td class="pre-wrap">{{ $toThaiDigits($activity['background_rationale']) }}</td>
            </tr>
            @endif
            @if(!empty($activity['objectives']))
            <tr>
                <th>วัตถุประสงค์ของกิจกรรม</th>
                <td class="pre-wrap">{{ $toThaiDigits($activity['objectives']) }}</td>
            </tr>
            @endif
            @if(!empty($activity['targets']))
            <tr>
                <th>เป้าหมายของกิจกรรม</th>
                <td class="pre-wrap">{{ $toThaiDigits($activity['targets']) }}</td>
            </tr>
            @endif
            @if(!empty($activity['indicators']))
            <tr>
                <th>ตัวชี้วัดความสำเร็จของกิจกรรม</th>
                <td class="pre-wrap">{{ $toThaiDigits($activity['indicators']) }}</td>
            </tr>
            @endif
            @if(!empty($activity['expected_benefits']))
            <tr>
                <th>ผลลัพธ์ / ผลที่คาดว่าจะได้รับ</th>
                <td class="pre-wrap">{{ $toThaiDigits($activity['expected_benefits']) }}</td>
            </tr>
            @endif
            @if(!empty($activity['description']))
            <tr>
                <th>ขั้นตอนและรายละเอียดการดำเนินกิจกรรม</th>
                <td class="pre-wrap">{{ $toThaiDigits($activity['description']) }}</td>
            </tr>
            @endif
        </table>

        @if($linkedSets && $linkedSets->count() > 0)
            <div style="margin-top: 10px;">
                <div style="font-weight: 700; font-size: 15.5pt; margin-bottom: 4px;">รายการประมาณการค่าใช้จ่าย (ชุดจัดซื้อจัดจ้าง / สัญญายืมเงินในกิจกรรมนี้)</div>
                <table class="sets-table">
                    <thead>
                        <tr>
                            <th style="width: 8%;">ลำดับ</th>
                            <th style="width: 22%;">ประเภทเอกสาร</th>
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
                                        <div style="font-size: 13pt; color: #334155;">
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
            </div>
        @endif

        <!-- ลงนามโดยผู้รับผิดชอบกิจกรรม -->
        <div class="signatures-wrapper" style="margin-top: 28px;">
            <div class="sig-row-right" style="margin-bottom: 0;">
                <div class="sig-box" style="width: 52%;">
                    <div class="sig-img-wrap">
                        @if(!empty($signers['activity_responsible']['signature_data']))
                            <img src="{{ $signers['activity_responsible']['signature_data'] }}" class="sig-img" alt="ลายเซ็นผู้รับผิดชอบกิจกรรม">
                        @else
                            <span>ลงชื่อ ............................................................</span>
                        @endif
                    </div>
                    <span class="sig-name editable" contenteditable="true">({{ $signers['activity_responsible']['name'] }})</span>
                    <span class="sig-position editable" contenteditable="true">{{ $signers['activity_responsible']['title'] }}</span>
                    <span class="sig-date">วันที่ {{ $todayThai }}</span>
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
