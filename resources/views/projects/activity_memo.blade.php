@php
    $toThaiDigits = function ($str) {
        $arabic = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $thai   = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        return str_replace($arabic, $thai, (string)$str);
    };

    $fiscalYear = $project->academic_year ?: (date('Y') + 543);
    $fiscalYearThai = $toThaiDigits($fiscalYear);
    $thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    $todayThai = $toThaiDigits(date('j')) . ' ' . $thaiMonths[(int)date('n')] . ' ' . $toThaiDigits(date('Y') + 543);
    $subjectText = 'ขออนุญาตดำเนินกิจกรรม ' . ($activity['name'] ?? '') . ' ภายใต้โครงการ ' . ($project->title ?? '');
@endphp
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>บันทึกข้อความ - {{ $subjectText }}</title>
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
        .toolbar-hint {
            font-size: 12px;
            color: #ddd6fe;
            font-weight: 400;
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
            margin: 18px auto 30px auto;
            padding: 20mm 20mm 18mm 28mm; /* Thai Saraban standard margins (Left ~3cm, Right ~2cm, Top ~2-2.5cm) */
            background: #ffffff;
            box-shadow: 0 10px 28px rgba(15, 23, 42, 0.18);
            font-size: 16pt;
            line-height: 1.38;
        }

        .editable {
            outline: none;
            border-radius: 3px;
            transition: background-color 0.15s;
        }
        .editable:hover {
            background-color: rgba(99, 102, 241, 0.08);
        }
        .editable:focus {
            background-color: rgba(254, 243, 199, 0.55);
            box-shadow: 0 0 0 1px #f59e0b;
        }

        /* Header with Garuda */
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

        /* Metadata rows with dotted lines */
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
        .meta-col-left {
            flex: 1;
            display: flex;
            align-items: baseline;
        }
        .meta-col-right {
            flex: 1;
            display: flex;
            align-items: baseline;
        }
        .subject-divider {
            border: none;
            border-top: 1.2px solid #000000;
            margin: 6px 0 10px 0;
        }

        /* Salutation & Body */
        .salutation {
            margin-bottom: 8px;
            font-size: 16pt;
        }
        .salutation-label {
            font-weight: 700;
            margin-right: 6px;
        }
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
            margin-top: 16px;
            width: 100%;
            font-size: 15.5pt;
            line-height: 1.35;
        }
        .sig-row-right {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 26px;
        }
        .sig-row-two {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 28px;
        }
        .sig-box {
            width: 46%;
            text-align: center;
        }
        .sig-space {
            height: 28px;
        }
        .sig-name {
            display: block;
        }
        .sig-position {
            display: block;
        }

        @media print {
            body {
                background: #ffffff !important;
            }
            .toolbar {
                display: none !important;
            }
            .a4-page {
                margin: 0 !important;
                box-shadow: none !important;
                width: 210mm !important;
                min-height: 297mm !important;
                padding: 20mm 20mm 16mm 28mm !important;
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
                <span>บันทึกข้อความขออนุญาตดำเนินกิจกรรม (แบบฟอร์มราชการ Sarabun)</span>
            </div>
            <div class="toolbar-hint">
                💡 คลิกที่ข้อความ วันที่ เลขที่ หรือชื่อผู้ลงนามในกระดาษเพื่อแก้ไขก่อนพิมพ์ได้ทันที
            </div>
        </div>
        <div class="toolbar-actions">
            <button type="button" id="btnAiRedraft" class="btn btn-ai" onclick="regenerateAiMemo()">
                <span>✨</span>
                <span id="btnAiText">ให้ AI เรียบเรียงข้อความใหม่</span>
            </button>
            <button type="button" class="btn btn-secondary" onclick="toggleThaiDigits()">
                <span>🔢</span>
                <span>แปลงเลขไทย</span>
            </button>
            <button type="button" class="btn btn-print" onclick="window.print()">
                <span>🖨️</span>
                <span>พิมพ์ / บันทึก PDF</span>
            </button>
        </div>
    </div>

    <!-- Official A4 Document -->
    <div class="a4-page" id="memoDocument">
        <!-- Garuda & Title -->
        <div class="memo-header">
            @if($garudaBase64)
                <img src="{{ $garudaBase64 }}" alt="ตราครุฑ" class="garuda-logo">
            @else
                <img src="{{ asset('images/garuda.png') }}" alt="ตราครุฑ" class="garuda-logo">
            @endif
            <div class="memo-title">บันทึกข้อความ</div>
        </div>

        <!-- ส่วนราชการ -->
        <div class="meta-row">
            <span class="meta-label">ส่วนราชการ</span>
            <span class="meta-dotted editable" contenteditable="true">{{ $collegeName }} ({{ $divisionName }})</span>
        </div>

        <!-- ที่ / วันที่ -->
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

        <!-- เรื่อง -->
        <div class="meta-row">
            <span class="meta-label">เรื่อง</span>
            <span class="meta-dotted editable" contenteditable="true" style="font-weight: 600;">{{ $subjectText }}</span>
        </div>

        <hr class="subject-divider">

        <!-- เรียน -->
        <div class="salutation">
            <span class="salutation-label">เรียน</span>
            <span class="editable" contenteditable="true">ผู้อำนวยการ{{ $collegeName }}</span>
        </div>

        <!-- Body Paragraphs (AI-Drafted, Editable) -->
        <p class="body-paragraph editable" id="memoParagraph1" contenteditable="true">{{ $toThaiDigits($paragraph1) }}</p>
        <p class="body-paragraph editable" id="memoParagraph2" contenteditable="true">{{ $toThaiDigits($paragraph2) }}</p>
        <p class="closing-paragraph editable" contenteditable="true">จึงเรียนมาเพื่อโปรดพิจารณาอนุญาตให้ดำเนินกิจกรรมดังกล่าว</p>

        <!-- 5-Signer Official Signature Block -->
        <div class="signatures-wrapper">
            <!-- 1. ผู้รับผิดชอบกิจกรรม (ผู้ที่ดำเนินการกรอกข้อมูล) -->
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

    <script>
        const toThaiDigitsJs = (str) => {
            const thai = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
            return String(str || '').replace(/[0-9]/g, d => thai[Number(d)]);
        };

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
                btnText.textContent = 'ให้ AI เรียบเรียงข้อความใหม่';
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
