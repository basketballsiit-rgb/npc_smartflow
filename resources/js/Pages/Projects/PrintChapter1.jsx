import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';

export default function PrintChapter1({ project }) {
    const [fontSizePreset, setFontSizePreset] = useState('normal');

    const sections = project?.chapter_1_sections || {};
    const fullContent = project?.chapter_1_content || '';

    // Standardize all numerals to Arabic (0-9)
    const toArabicNumerals = (val) => {
        if (val === null || val === undefined) return '';
        const map = { '๐':'0', '๑':'1', '๒':'2', '๓':'3', '๔':'4', '๕':'5', '๖':'6', '๗':'7', '๘':'8', '๙':'9' };
        return String(val).replace(/[๐-๙]/g, (digit) => map[digit] || digit);
    };
    const toThaiNumerals = toArabicNumerals;

    // Safe string serializer ensuring objects like {text, unit} never crash React
    const safeString = (val, fallback = '') => {
        if (val === null || val === undefined) return fallback;
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return String(val);
        if (typeof val === 'object') {
            if (Array.isArray(val)) {
                return val.map(item => safeString(item)).filter(Boolean).join('\n') || fallback;
            }
            if (val.text !== undefined || val.unit !== undefined) {
                const parts = [val.text, val.unit].filter(Boolean);
                return parts.join(' ') || fallback;
            }
            if (val.description) return String(val.description);
            if (val.title) return String(val.title);
            if (val.name) return String(val.name);
            try {
                return JSON.stringify(val);
            } catch (e) {
                return fallback;
            }
        }
        return String(val);
    };

    const handlePrint = () => {
        window.print();
    };

    const fontStyles = {
        compact: { docSize: '14px', lineHeight: '1.6', titleSize: '18px', headingSize: '15px' },
        normal: { docSize: '15px', lineHeight: '1.68', titleSize: '20px', headingSize: '16px' },
        large: { docSize: '16.5px', lineHeight: '1.75', titleSize: '22px', headingSize: '17.5px' },
    }[fontSizePreset];

    const exportToWord = (filename = 'รายงานผลโครงการ_บทที่_1') => {
        const contentElement = document.querySelector('.print-doc-container');
        if (!contentElement) return;

        const clone = contentElement.cloneNode(true);
        clone.querySelectorAll('.no-print').forEach(el => el.remove());

        const cleanFilename = (filename || 'รายงานโครงการ').replace(/[\/\\?%*:|"<>]/g, '_');

        const header = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${cleanFilename}</title>
                <!--[if gte mso 9]>
                <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>100</w:Zoom>
                        <w:DoNotOptimizeForBrowser/>
                    </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    @page Section1 {
                        size: 21.0cm 29.7cm;
                        margin: 2.54cm 2.54cm 2.54cm 2.54cm;
                        mso-header-margin: 1.27cm;
                        mso-footer-margin: 1.27cm;
                        mso-paper-source: 0;
                    }
                    div.Section1 { page: Section1; }
                    body {
                        font-family: 'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', 'Cordia New', sans-serif;
                        font-size: 16pt;
                        line-height: 1.65;
                        color: #000000;
                    }
                    h1 {
                        font-size: 20pt;
                        font-weight: bold;
                        text-align: center;
                        margin-top: 0;
                        margin-bottom: 8pt;
                    }
                    h2 {
                        font-size: 18pt;
                        font-weight: bold;
                        text-align: center;
                        margin-top: 0;
                        margin-bottom: 16pt;
                    }
                    h3 {
                        font-size: 16pt;
                        font-weight: bold;
                        margin-top: 14pt;
                        margin-bottom: 6pt;
                    }
                    h4 {
                        font-size: 16pt;
                        font-weight: bold;
                        margin-top: 8pt;
                        margin-bottom: 4pt;
                    }
                    p {
                        font-size: 16pt;
                        line-height: 1.65;
                        margin-top: 0;
                        margin-bottom: 6pt;
                        text-align: justify;
                        text-justify: inter-cluster;
                    }
                    .thai-indent {
                        text-indent: 1.5cm;
                    }
                    .thai-hanging-indent {
                        padding-left: 1.5cm;
                        text-indent: -1.5cm;
                    }
                </style>
            </head>
            <body>
                <div class="Section1">
                    ${clone.innerHTML}
                </div>
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', header], {
            type: 'application/msword;charset=utf-8'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${cleanFilename}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Helper to format objectives array
    const rawObjectives = Array.isArray(project.objectives) ? project.objectives : (project.objectives ? [project.objectives] : []);
    const rawBenefits = Array.isArray(project.expected_benefits) ? project.expected_benefits : (project.expected_benefits ? [project.expected_benefits] : []);
    const rawTargets = Array.isArray(project.targets) ? project.targets : (project.targets ? [project.targets] : []);
    const rawActivities = Array.isArray(project.activities) ? project.activities : [];

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900">
            <Head>
                <title>{`รายงานผลโครงการ บทที่ 1 - ${project.title}`}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />
            </Head>

            {/* Dynamic CSS matching Screen & Print 1:1 with 1 Inch All-Around Page Margin */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

                :root {
                    --doc-font-size: ${fontStyles.docSize};
                    --doc-line-height: ${fontStyles.lineHeight};
                    --title-font-size: ${fontStyles.titleSize};
                    --heading-font-size: ${fontStyles.headingSize};
                }

                .font-sarabun {
                    font-family: 'TH Sarabun PSK', 'TH Sarabun Chula', 'THSarabunNew', 'Sarabun', sans-serif !important;
                }

                .thai-indent {
                    text-indent: 1.5cm !important;
                }

                .thai-hanging-indent {
                    padding-left: 1.5cm !important;
                    text-indent: -1.5cm !important;
                }

                .thai-content {
                    text-align: justify !important;
                    text-justify: inter-cluster !important;
                    line-height: var(--doc-line-height) !important;
                }

                .print-doc-container {
                    font-size: var(--doc-font-size) !important;
                    line-height: var(--doc-line-height) !important;
                    box-sizing: border-box !important;
                    width: 210mm !important;
                    max-width: 100% !important;
                    min-height: 297mm;
                    padding-left: 1in !important;
                    padding-right: 1in !important;
                    padding-top: 1in !important;
                    padding-bottom: 1in !important;
                    background: #ffffff !important;
                }

                @media (max-width: 768px) {
                    .print-doc-container {
                        padding-left: 0.5in !important;
                        padding-right: 0.5in !important;
                        padding-top: 0.5in !important;
                        padding-bottom: 0.5in !important;
                    }
                }

                .print-title {
                    font-size: var(--title-font-size) !important;
                    font-weight: bold !important;
                    line-height: 1.3 !important;
                }

                .print-heading {
                    font-size: var(--heading-font-size) !important;
                    font-weight: bold !important;
                    line-height: 1.4 !important;
                }

                @media print {
                    @page {
                        size: A4 portrait;
                        margin-top: 1in !important;
                        margin-bottom: 1in !important;
                        margin-left: 1in !important;
                        margin-right: 1in !important;
                    }
                    html, body {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                        font-family: 'TH Sarabun PSK', 'TH Sarabun Chula', 'THSarabunNew', 'Sarabun', sans-serif !important;
                        font-size: var(--doc-font-size) !important;
                        line-height: var(--doc-line-height) !important;
                        color: #000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print-doc-container {
                        font-size: var(--doc-font-size) !important;
                        line-height: var(--doc-line-height) !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        min-height: auto !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .print-break-inside-avoid {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                    h1, h2, h3, h4 {
                        break-after: avoid;
                        page-break-after: avoid;
                    }
                }
            `}</style>

            {/* Top Action Bar (Hidden when printing) */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden font-sans">
                <div>
                    <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span>📘</span> รายงานผลโครงการ: บทที่ 1 บทนำ (Introduction)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        ระยะขอบทุกด้าน 1 นิ้ว | ฟอนต์ TH Sarabun PSK ขนาดมาตรฐาน 1:1 กับรายงาน 5 บท
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Font Size Preset Switcher */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                        <span className="text-slate-500 px-1.5 text-[11px]">ขนาดฟอนต์:</span>
                        <button
                            type="button"
                            onClick={() => setFontSizePreset('compact')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                                fontSizePreset === 'compact' 
                                    ? 'bg-purple-600 text-white shadow-xs' 
                                    : 'text-slate-700 hover:bg-slate-200'
                            }`}
                            title="ขนาดกระทัดรัด (14px)"
                        >
                            กระทัดรัด
                        </button>
                        <button
                            type="button"
                            onClick={() => setFontSizePreset('normal')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                                fontSizePreset === 'normal' 
                                    ? 'bg-purple-600 text-white shadow-xs' 
                                    : 'text-slate-700 hover:bg-slate-200'
                            }`}
                            title="ขนาดมาตรฐาน (15px)"
                        >
                            ปกติ
                        </button>
                        <button
                            type="button"
                            onClick={() => setFontSizePreset('large')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                                fontSizePreset === 'large' 
                                    ? 'bg-purple-600 text-white shadow-xs' 
                                    : 'text-slate-700 hover:bg-slate-200'
                            }`}
                            title="ขนาดตัวโต (16.5px)"
                        >
                            ตัวโต
                        </button>
                    </div>

                    <a
                        href={route('projects.print', project.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs"
                        title="ดูแบบเสนอโครงการฉบับเต็ม"
                    >
                        📄 แบบเสนอโครงการ
                    </a>

                    <Link
                        href={route('projects.show', project.id)}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                        ← กลับหน้าโครงการ
                    </Link>

                    <button
                        type="button"
                        onClick={() => exportToWord(`รายงานผลโครงการ_บทที่_1_${project.title || ''}`)}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        title="ดาวน์โหลดเนื้อหาบทที่ 1 เป็นไฟล์ Microsoft Word (.doc)"
                    >
                        <span>📥</span> ดาวน์โหลด Word (.doc)
                    </button>

                    <button
                        onClick={handlePrint}
                        className="rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-800 hover:to-indigo-800 transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <span>🖨️</span> สั่งพิมพ์ / บันทึกเป็น PDF
                    </button>
                </div>
            </div>

            {/* Document Container */}
            <div className="print-doc-container font-sarabun mx-auto bg-white shadow-md rounded-2xl print:p-0 print:m-0 print:shadow-none print:border-none print:rounded-none">
                
                {/* Chapter Heading */}
                <div className="text-center mb-8">
                    <h2 className="print-title tracking-wide text-black mb-1">บทที่ 1</h2>
                    <h1 className="print-title tracking-wide text-black">บทนำ</h1>
                </div>

                {/* If full custom content is provided, display it directly */}
                {fullContent ? (
                    <div className="space-y-6 text-black whitespace-pre-wrap leading-relaxed text-justify">
                        {toArabicNumerals(fullContent)}
                    </div>
                ) : (
                    <div className="space-y-6 text-black leading-relaxed">
                        
                        {/* 1.1 ความเป็นมาและความสำคัญของปัญหา */}
                        <div className="print-break-inside-avoid">
                            <h3 className="print-heading text-black mb-2">
                                1.1 ความเป็นมาและความสำคัญของปัญหา
                            </h3>
                            <div className="text-justify thai-indent whitespace-pre-wrap leading-relaxed">
                                {toArabicNumerals(safeString(sections.background) || safeString(project.background_rationale) || 'ไม่ได้ระบุความเป็นมาและความสำคัญของปัญหา')}
                            </div>
                        </div>

                        {/* 1.2 วัตถุประสงค์ของโครงการ */}
                        <div className="print-break-inside-avoid">
                            <h3 className="print-heading text-black mb-2">
                                1.2 วัตถุประสงค์ของโครงการ
                            </h3>
                            <div className="space-y-1.5">
                                {sections.objectives ? (
                                    <div className="whitespace-pre-wrap thai-indent leading-relaxed">{toArabicNumerals(safeString(sections.objectives))}</div>
                                ) : rawObjectives.length > 0 ? (
                                    rawObjectives.map((obj, idx) => (
                                        <div key={idx} className="flex items-start pl-6 sm:pl-8 my-1.5 text-justify leading-relaxed">
                                            <span className="font-bold shrink-0 w-12 sm:w-14">1.2.{toArabicNumerals(idx + 1)}</span>
                                            <span className="flex-1">{toArabicNumerals(safeString(obj))}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="thai-indent">ไม่ได้ระบุวัตถุประสงค์โครงการ</div>
                                )}
                            </div>
                        </div>

                        {/* 1.3 ขอบเขตของโครงการ */}
                        <div className="print-break-inside-avoid space-y-3">
                            <h3 className="print-heading text-black mb-1">
                                1.3 ขอบเขตของโครงการ
                            </h3>

                            {/* 1.3.1 ประชากรและกลุ่มเป้าหมาย */}
                            <div className="pl-4">
                                <h4 className="font-bold text-black mb-1">
                                    1.3.1 ขอบเขตด้านประชากรและกลุ่มเป้าหมาย
                                </h4>
                                <div className="thai-indent whitespace-pre-wrap">
                                    {toArabicNumerals(safeString(sections.scope_target) || (
                                        rawTargets.length > 0
                                            ? rawTargets.map(t => safeString(t)).filter(Boolean).join(', ')
                                            : 'นักเรียน นักศึกษา ครู และบุคลากรทางการศึกษาที่เกี่ยวข้อง'
                                    ))}
                                </div>
                            </div>

                            {/* 1.3.2 ด้านเนื้อหาและกิจกรรม */}
                            <div className="pl-4">
                                <h4 className="font-bold text-black mb-1">
                                    1.3.2 ขอบเขตด้านเนื้อหาและกิจกรรมการดำเนินงาน
                                </h4>
                                <div className="thai-indent whitespace-pre-wrap">
                                    {toArabicNumerals(safeString(sections.scope_content) || (
                                        rawActivities.length > 0
                                            ? rawActivities.map((a, i) => `${toArabicNumerals(i + 1)}. ${safeString(a)}`).join('\n')
                                            : 'ดำเนินงานตามกิจกรรมและขั้นตอนการดำเนินงานที่ระบุไว้ในแผนปฏิบัติการ'
                                    ))}
                                </div>
                            </div>

                            {/* 1.3.3 ด้านสถานที่และระยะเวลา */}
                            <div className="pl-4">
                                <h4 className="font-bold text-black mb-1">
                                    1.3.3 ขอบเขตด้านสถานที่และระยะเวลาดำเนินการ
                                </h4>
                                <div className="thai-indent">
                                    {toArabicNumerals(safeString(sections.scope_location_time) || (
                                        `สถานที่ดำเนินโครงการ: ${project.location || 'วิทยาลัยสารพัดช่างน่าน'} ` +
                                        (project.start_date ? `ระยะเวลาตั้งแต่วันที่ ${toArabicNumerals(project.start_date)} ถึง ${toArabicNumerals(project.end_date || project.start_date)}` : '')
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 1.4 ตัวชี้วัดและเป้าหมายความสำเร็จ */}
                        <div className="print-break-inside-avoid">
                            <h3 className="print-heading text-black mb-2">
                                1.4 ตัวชี้วัดและเป้าหมายความสำเร็จ
                            </h3>
                            <div className="space-y-2 pl-4">
                                <div>
                                    <span className="font-bold">1.4.1 ตัวชี้วัดเชิงปริมาณ: </span>
                                    <span>
                                        {toArabicNumerals(safeString(sections.indicators_quantitative) || 
                                         safeString(project.indicators?.quantitative) || 'ผู้เข้าร่วมโครงการไม่น้อยกว่าร้อยละ 80 ของกลุ่มเป้าหมาย')}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-bold">1.4.2 ตัวชี้วัดเชิงคุณภาพ: </span>
                                    <span>
                                        {toArabicNumerals(safeString(sections.indicators_qualitative) || 
                                         safeString(project.indicators?.qualitative) || 'ผู้เข้าร่วมโครงการมีความพึงพอใจในระดับดีขึ้นไป (ค่าเฉลี่ย 3.51 ขึ้นไป)')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 1.5 ประโยชน์ที่คาดว่าจะได้รับ */}
                        <div className="print-break-inside-avoid">
                            <h3 className="print-heading text-black mb-2">
                                1.5 ประโยชน์ที่คาดว่าจะได้รับ
                            </h3>
                            <div className="space-y-1.5">
                                {sections.benefits || sections.expected_benefits ? (
                                    <div className="whitespace-pre-wrap thai-indent leading-relaxed">{toArabicNumerals(safeString(sections.benefits || sections.expected_benefits))}</div>
                                ) : rawBenefits.length > 0 ? (
                                    rawBenefits.map((b, idx) => (
                                        <div key={idx} className="flex items-start pl-6 sm:pl-8 my-1.5 text-justify leading-relaxed">
                                            <span className="font-bold shrink-0 w-12 sm:w-14">1.5.{toArabicNumerals(idx + 1)}</span>
                                            <span className="flex-1">{toArabicNumerals(safeString(b))}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="thai-indent">การดำเนินงานบรรลุผลสำเร็จตามเป้าหมายและเกิดประโยชน์ต่อผู้เรียนและสถานศึกษา</div>
                                )}
                            </div>
                        </div>

                        {/* 1.6 นิยามศัพท์เฉพาะ (ถ้ามี) */}
                        {sections.definitions && (
                            <div className="print-break-inside-avoid">
                                <h3 className="print-heading text-black mb-2">
                                    1.6 นิยามศัพท์เฉพาะ
                                </h3>
                                <div className="text-justify thai-indent whitespace-pre-wrap">
                                    {toArabicNumerals(safeString(sections.definitions))}
                                </div>
                            </div>
                        )}

                    </div>
                )}

            </div>
        </div>
    );
}
