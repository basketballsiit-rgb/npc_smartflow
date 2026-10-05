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
        clone.querySelectorAll('.academic-subheading').forEach(el => {
            el.setAttribute('align', 'left');
            el.style.textAlign = 'left';
            el.style.textJustify = 'none';
        });

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
                        text-align: left !important;
                        text-justify: none !important;
                        margin-top: 14pt;
                        margin-bottom: 6pt;
                    }
                    h4 {
                        font-size: 16pt;
                        font-weight: bold;
                        text-align: left !important;
                        text-justify: none !important;
                        margin-top: 8pt;
                        margin-bottom: 4pt;
                    }
                    .academic-subheading {
                        font-size: 16pt !important;
                        font-weight: bold !important;
                        text-align: left !important;
                        text-justify: none !important;
                        margin-top: 10pt;
                        margin-bottom: 3pt;
                        padding-left: 0.75cm;
                    }
                    .academic-subheading * {
                        text-align: left !important;
                        text-justify: none !important;
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
                    .text-left {
                        text-align: left !important;
                        text-justify: none !important;
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

        const headingPattern = new RegExp(`^(?:#*\\s*)?(?:${sectionPrefix}|1\\.[1-6])\\s*[^\\n]*\\n*`, 'u');
        text = text.replace(headingPattern, '').trim();

        const lines = text.split(/\r?\n/);
        const elements = [];
        let currentParagraphLines = [];

        const joinThaiLines = (lineArray) => {
            let result = '';
            for (let i = 0; i < lineArray.length; i++) {
                const line = lineArray[i].trim();
                if (!line) continue;
                if (!result) {
                    result = line;
                } else {
                    const lastChar = result.slice(-1);
                    const firstChar = line.charAt(0);
                    const isThaiLast = /[\u0E00-\u0E7F]/.test(lastChar);
                    const isThaiFirst = /[\u0E00-\u0E7F]/.test(firstChar);
                    if (isThaiLast && isThaiFirst) {
                        result += line;
                    } else {
                        result += ' ' + line;
                    }
                }
            }
            return result;
        };

        const flushParagraph = (key) => {
            if (currentParagraphLines.length > 0) {
                const pText = joinThaiLines(currentParagraphLines).trim();
                if (pText) {
                    elements.push(
                        <p
                            key={`p-${key}`}
                            className="thai-content thai-indent my-2.5 text-justify leading-relaxed"
                            style={{ textAlign: 'justify', textJustify: 'inter-cluster' }}
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

            // Sub-heading e.g. "1.3.1 ...", "1.3.1. ..."
            const subSecMatch = trimmed.match(/^(?:#*\s*)?([1-5]\.\d+(?:\.\d+)+)\.?\s+(.*)$/u);
            if (subSecMatch) {
                flushParagraph(index);
                elements.push(
                    <div 
                        key={`subsec-${index}`} 
                        className="academic-subheading mt-4 mb-2 font-bold text-slate-900 pl-4 sm:pl-6 text-left flex items-start"
                        style={{ textAlign: 'left', textJustify: 'none' }}
                    >
                        <span className="shrink-0 mr-2 font-bold text-slate-900" style={{ textAlign: 'left', textJustify: 'none' }}>
                            {subSecMatch[1]}
                        </span>
                        <span className="flex-1 text-left font-bold text-slate-900" style={{ textAlign: 'left', textJustify: 'none' }}>
                            {renderInlineFormattedText(subSecMatch[2])}
                        </span>
                    </div>
                );
                return;
            }

            // Sub-points like "(1) ..."
            const parenSubMatch = trimmed.match(/^\(([0-9]+)\)\s+(.*)$/u);
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
                    <div 
                        key={`subnum-${index}`} 
                        className="flex items-start pl-8 sm:pl-12 my-2 leading-relaxed text-left"
                        style={{ textAlign: 'left' }}
                    >
                        <span className="shrink-0 font-bold mr-2 text-slate-900" style={{ textAlign: 'left' }}>({subNum})</span>
                        <div className="flex-1 text-slate-800 text-justify" style={{ textAlign: 'justify', textJustify: 'inter-cluster' }}>
                            {label && <strong className="font-bold text-slate-900 mr-1">{label}</strong>}
                            <span>{renderInlineFormattedText(body)}</span>
                        </div>
                    </div>
                );
                return;
            }

            // Bullet or dash like "- ..."
            const bulletMatch = trimmed.match(/^[-•]\s+(.*)$/u);
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
                    <div 
                        key={`bullet-${index}`} 
                        className="flex items-start pl-10 sm:pl-14 my-1.5 leading-relaxed text-left"
                        style={{ textAlign: 'left' }}
                    >
                        <span className="shrink-0 w-4 font-bold text-slate-700" style={{ textAlign: 'left' }}>-</span>
                        <div className="flex-1 text-slate-800 text-justify" style={{ textAlign: 'justify', textJustify: 'inter-cluster' }}>
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
                    <div 
                        key={`num-${index}`} 
                        className="flex items-start pl-8 sm:pl-10 my-1.5 leading-relaxed text-left"
                        style={{ textAlign: 'left' }}
                    >
                        <span className="shrink-0 font-bold text-slate-900 mr-2" style={{ minWidth: '24px', textAlign: 'left' }}>{num}.</span>
                        <div className="flex-1 text-slate-800 text-justify" style={{ textAlign: 'justify', textJustify: 'inter-cluster' }}>
                            {renderInlineFormattedText(rest)}
                        </div>
                    </div>
                );
                return;
            }

            // Sub-items like "1) ..."
            const itemParenMatch = trimmed.match(/^(\d+\))\s+(.+)$/u);
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
                            <div 
                                key={`itemp-${index}`} 
                                className="flex items-start pl-8 sm:pl-10 my-2 leading-relaxed text-left"
                                style={{ textAlign: 'left' }}
                            >
                                <span className="shrink-0 font-bold text-slate-900 mr-2" style={{ textAlign: 'left' }}>{numPart}</span>
                                <div className="flex-1 text-slate-800 text-justify" style={{ textAlign: 'justify', textJustify: 'inter-cluster' }}>
                                    <strong className="font-bold text-slate-900 mr-1">{label}</strong>
                                    <span>{renderInlineFormattedText(body)}</span>
                                </div>
                            </div>
                        );
                    } else {
                        elements.push(
                            <div 
                                key={`itemp-${index}`} 
                                className="mt-4 mb-2 pl-4 sm:pl-6 font-bold text-slate-900 text-left"
                                style={{ textAlign: 'left', textJustify: 'auto' }}
                            >
                                <span>{numPart} {label}</span>
                            </div>
                        );
                    }
                } else {
                    elements.push(
                        <div 
                            key={`itemp-${index}`} 
                            className="flex items-start pl-8 sm:pl-10 my-1.5 leading-relaxed text-left"
                            style={{ textAlign: 'left' }}
                        >
                            <span className="shrink-0 font-bold text-slate-900 mr-2" style={{ textAlign: 'left' }}>{numPart}</span>
                            <div className="flex-1 text-slate-800 text-justify" style={{ textAlign: 'justify', textJustify: 'inter-cluster' }}>
                                {renderInlineFormattedText(contentPart)}
                            </div>
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
                    text-align: left !important;
                    text-justify: none !important;
                }

                .academic-subheading {
                    text-align: left !important;
                    text-justify: none !important;
                    font-weight: bold !important;
                }

                .academic-subheading * {
                    text-align: left !important;
                    text-justify: none !important;
                }

                h1, h2, h3, h4 {
                    text-align: left !important;
                    text-justify: none !important;
                }

                .print-title {
                    text-align: center !important;
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

                {/* If full custom content is provided, display it directly with academic parsing */}
                {fullContent ? (
                    <div className="space-y-4 text-black">
                        {renderAcademicSection(fullContent, 'บทที่ 1')}
                    </div>
                ) : (
                    <div className="space-y-6 text-black leading-relaxed">
                        
                        {/* 1.1 ความเป็นมาและความสำคัญของปัญหา */}
                        <div className="print-break-inside-avoid">
                            <h3 className="print-heading text-black mb-2">
                                1.1 ความเป็นมาและความสำคัญของปัญหา
                            </h3>
                            <div>
                                {renderAcademicSection(
                                    safeString(sections.background) || safeString(project.background_rationale) || 'ไม่ได้ระบุความเป็นมาและความสำคัญของปัญหา',
                                    '1.1'
                                )}
                            </div>
                        </div>

                        {/* 1.2 วัตถุประสงค์ของโครงการ */}
                        <div className="print-break-inside-avoid">
                            <h3 className="print-heading text-black mb-2">
                                1.2 วัตถุประสงค์ของโครงการ
                            </h3>
                            <div className="space-y-1.5">
                                {sections.objectives ? (
                                    renderAcademicSection(safeString(sections.objectives), '1.2')
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
                        <div className="print-break-inside-avoid space-y-4">
                            <h3 className="print-heading text-black mb-1">
                                1.3 ขอบเขตของโครงการ
                            </h3>

                            {/* 1.3.1 ประชากรและกลุ่มเป้าหมาย */}
                            <div className="pl-2 sm:pl-4">
                                <h4 className="font-bold text-black mb-1">
                                    1.3.1 ขอบเขตด้านประชากรและกลุ่มเป้าหมาย
                                </h4>
                                <div>
                                    {renderAcademicSection(
                                        safeString(sections.scope_target) || (
                                            rawTargets.length > 0
                                                ? rawTargets.map(t => safeString(t)).filter(Boolean).join(', ')
                                                : 'นักเรียน นักศึกษา ครู และบุคลากรทางการศึกษาที่เกี่ยวข้อง'
                                        ),
                                        '1.3.1'
                                    )}
                                </div>
                            </div>

                            {/* 1.3.2 ด้านเนื้อหาและกิจกรรม */}
                            <div className="pl-2 sm:pl-4">
                                <h4 className="font-bold text-black mb-1">
                                    1.3.2 ขอบเขตด้านเนื้อหาและกิจกรรมการดำเนินงาน
                                </h4>
                                <div>
                                    {renderAcademicSection(
                                        safeString(sections.scope_content) || (
                                            rawActivities.length > 0
                                                ? rawActivities.map((a, i) => `${toArabicNumerals(i + 1)}. ${safeString(a)}`).join('\n')
                                                : 'ดำเนินงานตามกิจกรรมและขั้นตอนการดำเนินงานที่ระบุไว้ในแผนปฏิบัติการ'
                                        ),
                                        '1.3.2'
                                    )}
                                </div>
                            </div>

                            {/* 1.3.3 ด้านสถานที่และระยะเวลา */}
                            <div className="pl-2 sm:pl-4">
                                <h4 className="font-bold text-black mb-1">
                                    1.3.3 ขอบเขตด้านสถานที่และระยะเวลาดำเนินการ
                                </h4>
                                <div>
                                    {renderAcademicSection(
                                        safeString(sections.scope_location_time) || (
                                            `สถานที่ดำเนินโครงการ: ${project.location || 'วิทยาลัยสารพัดช่างน่าน'} ` +
                                            (project.start_date ? `ระยะเวลาตั้งแต่วันที่ ${toArabicNumerals(project.start_date)} ถึง ${toArabicNumerals(project.end_date || project.start_date)}` : '')
                                        ),
                                        '1.3.3'
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 1.4 ตัวชี้วัดและเป้าหมายความสำเร็จ */}
                        <div className="print-break-inside-avoid">
                            <h3 className="print-heading text-black mb-2">
                                1.4 ตัวชี้วัดและเป้าหมายความสำเร็จ
                            </h3>
                            <div className="space-y-2 pl-2 sm:pl-4">
                                <div className="flex items-start pl-6 sm:pl-8 my-1 text-justify leading-relaxed">
                                    <span className="font-bold shrink-0 w-28 sm:w-32">1.4.1 ตัวชี้วัดเชิงปริมาณ:</span>
                                    <span className="flex-1">
                                        {toArabicNumerals(safeString(sections.indicators_quantitative) || 
                                         safeString(project.indicators?.quantitative) || 'ผู้เข้าร่วมโครงการไม่น้อยกว่าร้อยละ 80 ของกลุ่มเป้าหมาย')}
                                    </span>
                                </div>
                                <div className="flex items-start pl-6 sm:pl-8 my-1 text-justify leading-relaxed">
                                    <span className="font-bold shrink-0 w-28 sm:w-32">1.4.2 ตัวชี้วัดเชิงคุณภาพ:</span>
                                    <span className="flex-1">
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
                                    renderAcademicSection(safeString(sections.benefits || sections.expected_benefits), '1.5')
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
                                <div>
                                    {renderAcademicSection(safeString(sections.definitions), '1.6')}
                                </div>
                            </div>
                        )}

                    </div>
                )}

            </div>
        </div>
    );
}
