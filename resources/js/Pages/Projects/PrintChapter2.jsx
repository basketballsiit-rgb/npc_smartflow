import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';

export default function PrintChapter2({ project }) {
    // Font size preset state: 'compact' (14px) | 'normal' (15px) | 'large' (16.5px) - Matches Print.jsx 1:1
    const [fontSizePreset, setFontSizePreset] = useState('normal');

    const sections = project?.chapter_2_sections || {};
    const fullContent = project?.chapter_2_content || '';

    // Standardize all numerals to Arabic (0-9)
    const toArabicNumerals = (val) => {
        if (val === null || val === undefined) return '';
        const map = { '๐':'0', '๑':'1', '๒':'2', '๓':'3', '๔':'4', '๕':'5', '๖':'6', '๗':'7', '๘':'8', '๙':'9' };
        return String(val).replace(/[๐-๙]/g, (digit) => map[digit] || digit);
    };
    const toThaiNumerals = toArabicNumerals;

    const handlePrint = () => {
        window.print();
    };

    const fontStyles = {
        compact: { docSize: '14px', lineHeight: '1.6', titleSize: '18px', headingSize: '15px' },
        normal: { docSize: '15px', lineHeight: '1.68', titleSize: '20px', headingSize: '16px' },
        large: { docSize: '16.5px', lineHeight: '1.75', titleSize: '22px', headingSize: '17.5px' },
    }[fontSizePreset];

    const exportToWord = (filename = 'รายงานผลโครงการ_บทที่_2') => {
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

    // Helper to render inline markdown formatting such as **bold**
    const renderInlineFormattedText = (str) => {
        if (!str) return null;
        const parts = str.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // Academic section renderer that parses headings, hanging indent lists, and sub-points
    const renderAcademicSection = (rawContent, sectionPrefix = '') => {
        if (!rawContent) return null;
        let text = toArabicNumerals(rawContent);

        const headingPattern = new RegExp(`^(?:#*\\s*)?(?:${sectionPrefix}|2\\.[1-4])\\s*[^\\n]*\\n*`, 'u');
        text = text.replace(headingPattern, '').trim();

        const lines = text.split(/\r?\n/);
        const elements = [];
        let currentParagraphLines = [];

        const flushParagraph = (key) => {
            if (currentParagraphLines.length > 0) {
                const pText = currentParagraphLines.join(' ').trim();
                if (pText) {
                    elements.push(
                        <p
                            key={`p-${key}`}
                            className="thai-content thai-indent my-2.5 text-justify leading-relaxed"
                        >
                            {renderInlineFormattedText(pText)}
                        </p>
                    );
                }
                currentParagraphLines = [];
            }
        };

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) {
                flushParagraph(index);
                return;
            }

            // Sub-heading e.g. "2.1.1 ..."
            const subSecMatch = trimmed.match(/^(?:#*\s*)?(2\.\d+\.\d+)\s*(.*)$/u);
            if (subSecMatch) {
                flushParagraph(index);
                elements.push(
                    <div key={`subsec-${index}`} className="mt-4 mb-2 font-bold text-slate-900 pl-4 sm:pl-6">
                        <span>{subSecMatch[1]} </span>
                        <span>{renderInlineFormattedText(subSecMatch[2])}</span>
                    </div>
                );
                return;
            }

            // Sub-points like "(1) ..."
            const parenSubMatch = trimmed.match(/^\(([0-9]+)\)\s*(.*)$/u);
            if (parenSubMatch) {
                flushParagraph(index);
                const subNum = parenSubMatch[1];
                const rest = parenSubMatch[2];
                const colonIndex = rest.indexOf(':');
                let label = '';
                let body = rest;
                if (colonIndex !== -1 && colonIndex < 80) {
                    label = rest.slice(0, colonIndex + 1);
                    body = rest.slice(colonIndex + 1).trim();
                }

                elements.push(
                    <div key={`subnum-${index}`} className="flex items-start pl-8 sm:pl-12 my-2 text-justify leading-relaxed">
                        <span className="shrink-0 font-bold mr-2 text-slate-900">({subNum})</span>
                        <div className="flex-1 text-slate-800">
                            {label && <strong className="font-bold text-slate-900 mr-1">{label}</strong>}
                            <span>{renderInlineFormattedText(body)}</span>
                        </div>
                    </div>
                );
                return;
            }

            // Bullet or dash like "- ..."
            const bulletMatch = trimmed.match(/^[-•]\s*(.*)$/u);
            if (bulletMatch) {
                flushParagraph(index);
                const rest = bulletMatch[1];
                const colonIndex = rest.indexOf(':');
                let label = '';
                let body = rest;
                if (colonIndex !== -1 && colonIndex < 60) {
                    label = rest.slice(0, colonIndex + 1);
                    body = rest.slice(colonIndex + 1).trim();
                }
                elements.push(
                    <div key={`bullet-${index}`} className="flex items-start pl-10 sm:pl-14 my-1.5 text-justify leading-relaxed">
                        <span className="shrink-0 w-4 font-bold text-slate-700">-</span>
                        <div className="flex-1 text-slate-800">
                            {label && <strong className="font-bold text-slate-900 mr-1">{label}</strong>}
                            <span>{renderInlineFormattedText(body)}</span>
                        </div>
                    </div>
                );
                return;
            }

            // Numbered list item e.g. "1. ..." with hanging indent
            const numListMatch = trimmed.match(/^(\d+)\.\s+(.+)$/u);
            if (numListMatch) {
                flushParagraph(index);
                const num = numListMatch[1];
                const rest = numListMatch[2];
                elements.push(
                    <div key={`num-${index}`} className="flex items-start pl-8 sm:pl-10 my-1.5 text-justify leading-relaxed">
                        <span className="shrink-0 w-7 font-bold text-slate-900">{num}.</span>
                        <span className="flex-1 text-slate-800">{renderInlineFormattedText(rest)}</span>
                    </div>
                );
                return;
            }

            // Sub-items like "1) ..."
            const itemParenMatch = trimmed.match(/^(\d+\))\s*(.+)$/u);
            if (itemParenMatch) {
                flushParagraph(index);
                const numPart = itemParenMatch[1];
                const contentPart = itemParenMatch[2];

                const colonIndex = contentPart.indexOf(':');
                if (colonIndex !== -1 && colonIndex < 80) {
                    const label = contentPart.slice(0, colonIndex + 1);
                    const body = contentPart.slice(colonIndex + 1).trim();
                    if (body) {
                        elements.push(
                            <div key={`itemp-${index}`} className="mt-3.5 mb-2 pl-4 sm:pl-6 text-justify leading-relaxed">
                                <span className="font-bold text-slate-900">{numPart} {label} </span>
                                <span className="text-slate-800">{renderInlineFormattedText(body)}</span>
                            </div>
                        );
                    } else {
                        elements.push(
                            <div key={`itemp-${index}`} className="mt-4 mb-2 pl-4 sm:pl-6 font-bold text-slate-900">
                                <span>{numPart} {label}</span>
                            </div>
                        );
                    }
                } else {
                    elements.push(
                        <div key={`itemp-${index}`} className="flex items-start pl-8 sm:pl-10 my-1.5 text-justify leading-relaxed">
                            <span className="shrink-0 w-7 font-bold text-slate-900">{numPart}</span>
                            <span className="flex-1 text-slate-800">{renderInlineFormattedText(contentPart)}</span>
                        </div>
                    );
                }
                return;
            }

            currentParagraphLines.push(trimmed);
        });

        flushParagraph(lines.length);

        return <div className="space-y-1">{elements}</div>;
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900">
            <Head>
                <title>{`รายงานผลโครงการ บทที่ 2 - ${project.title}`}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />
            </Head>

            {/* Dynamic CSS matching Screen & Print 1:1 with 1 Inch All-Around Page Margin (Matches Print.jsx) */}
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

            {/* Top Action Bar (Hidden when printing - Matches Print.jsx styling) */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden font-sans">
                <div>
                    <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span>📖</span> รายงานผลโครงการ: บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        ระยะขอบทุกด้าน 1 นิ้ว | ฟอนต์ TH Sarabun PSK ขนาดมาตรฐาน 1:1 กับแบบเสนอโครงการ
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
                        title="ดูแบบเสนอโครงการ / บทที่ 1"
                    >
                        📄 พิมพ์แบบเสนอ (บทที่ 1)
                    </a>

                    <Link
                        href={route('projects.show', project.id)}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                        ← กลับหน้าโครงการ
                    </Link>

                    <button
                        type="button"
                        onClick={() => exportToWord(`รายงานผลโครงการ_บทที่_2_${project.title || ''}`)}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        title="ดาวน์โหลดเนื้อหาบทที่ 2 เป็นไฟล์ Microsoft Word (.doc)"
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
                    <h2 className="print-title tracking-wide text-black mb-1">บทที่ 2</h2>
                    <h1 className="print-title tracking-wide text-black">เอกสารและงานวิจัยที่เกี่ยวข้อง</h1>
                </div>

                {/* Content Render */}
                {sections && (sections.section_2_1 || sections.section_2_2 || sections.section_2_3) ? (
                    <div className="space-y-6 text-justify text-black leading-relaxed">
                        
                        {/* Intro */}
                        {sections.intro && (
                            <div>
                                {renderAcademicSection(sections.intro)}
                            </div>
                        )}

                        {/* 2.1 */}
                        {sections.section_2_1 && (
                            <div className="pt-2">
                                <h3 className="print-heading mb-2 text-black">
                                    2.1 แนวคิด หลักการ และทฤษฎีที่เกี่ยวข้อง
                                </h3>
                                {renderAcademicSection(sections.section_2_1, '2\\.1')}
                            </div>
                        )}

                        {/* 2.2 OVEC Strategies & Policies */}
                        {sections.section_2_2 && (
                            <div className="pt-4">
                                <h3 className="print-heading mb-2 text-black">
                                    2.2 ยุทธศาสตร์และนโยบายจุดเน้นของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ที่เกี่ยวข้อง
                                </h3>
                                {renderAcademicSection(sections.section_2_2, '2\\.2')}
                            </div>
                        )}

                        {/* 2.3 Related Literature & Research */}
                        {sections.section_2_3 && (
                            <div className="pt-4">
                                <h3 className="print-heading mb-2 text-black">
                                    2.3 เอกสารและงานวิจัยที่เกี่ยวข้อง
                                </h3>
                                {renderAcademicSection(sections.section_2_3, '2\\.3')}
                            </div>
                        )}

                        {/* References */}
                        {sections.references && (
                            <div className="pt-8 border-t border-slate-300 print:border-black print-break-inside-avoid">
                                <h3 className="print-heading mb-4 text-center text-black">
                                    เอกสารอ้างอิง
                                </h3>
                                <div className="space-y-3 leading-relaxed">
                                    {toArabicNumerals(sections.references)
                                        .replace(/^เอกสารอ้างอิง\s*\n+/u, '')
                                        .split(/\n+/)
                                        .filter(line => line.trim().length > 0)
                                        .map((refLine, idx) => (
                                            <p key={idx} className="thai-hanging-indent text-justify">
                                                {renderInlineFormattedText(refLine.trim())}
                                            </p>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                ) : fullContent ? (
                    <div>
                        {renderAcademicSection(fullContent)}
                    </div>
                ) : (
                    <div className="p-8 bg-amber-50 rounded-2xl border border-amber-200 text-center font-sans print:hidden">
                        <p className="text-amber-800 font-bold">ยังไม่มีเนื้อหาบทที่ 2 ในระบบ</p>
                        <p className="text-xs text-amber-600 mt-1">
                            กรุณากลับไปที่หน้ารายละเอียดโครงการ แท็บที่ 4 (Act) และกดปุ่ม "✨ ให้ AI ช่วยค้นคว้าและร่างเนื้อหาบทที่ 2"
                        </p>
                        <Link
                            href={route('projects.show', project.id)}
                            className="mt-4 inline-block px-4 py-2 bg-purple-700 text-white font-bold text-xs rounded-xl shadow"
                        >
                            กลับไปสร้างเนื้อหาบทที่ 2
                        </Link>
                    </div>
                )}

            </div>
        </div>
    );
}
