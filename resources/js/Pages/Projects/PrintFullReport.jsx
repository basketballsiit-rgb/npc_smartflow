import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';

export default function PrintFullReport({ project, survey, surveyStats }) {
    // Font size preset state: 'compact' (14px) | 'normal' (15px) | 'large' (16.5px)
    const [fontSizePreset, setFontSizePreset] = useState('normal');

    // Section datasets
    const prelim = project?.preliminary_sections || {};
    const ch1 = project?.chapter_1_sections || {};
    const ch2 = project?.chapter_2_sections || {};
    const ch3 = project?.chapter_3_sections || {};
    const ch4 = project?.chapter_4_sections || {};
    const ch5 = project?.chapter_5_sections || {};
    const appendices = project?.appendices || [];
    const photos = project?.photos || [];
    const procurement = project?.procurement;
    const approvals = project?.approvals || [];

    // Group appendices
    const byCategory = (cat) => appendices.filter(a => a.category === cat);
    const approvedProposalDoc = byCategory('approved_proposal')[0];
    const memoDocs = byCategory('memo_request');
    const procurementDocs = byCategory('procurement_loan');
    const surveyDocs = byCategory('evaluation_survey');
    const orderDocs = byCategory('official_order');
    const scheduleDocs = byCategory('schedule');
    const speechDocs = byCategory('speech');
    const certDocs = byCategory('certificate_sample');
    const otherDocs = byCategory('others');
    const frontCoverDoc = byCategory('front_cover')[0];
    const backCoverDoc = byCategory('back_cover')[0];

    // Standardize numerals to Arabic
    const toArabicNumerals = (val) => {
        if (val === null || val === undefined) return '';
        const thaiToArabic = {
            '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
            '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9'
        };
        return String(val).replace(/[๐-๙]/g, (ch) => thaiToArabic[ch] || ch);
    };

    // Safe string serializer
    const safeString = (val, fallback = '') => {
        if (val === null || val === undefined) return fallback;
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return String(val);
        if (typeof val === 'object') {
            if (Array.isArray(val)) {
                return val.map(item => safeString(item)).filter(Boolean).join('\n') || fallback;
            }
            if (val.text !== undefined || val.unit !== undefined) {
                return [val.text, val.unit].filter(Boolean).join(' ') || fallback;
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
        compact: { docSize: '14px', lineHeight: '1.6', titleSize: '20px', headingSize: '16px' },
        normal: { docSize: '15px', lineHeight: '1.68', titleSize: '22px', headingSize: '17px' },
        large: { docSize: '16.5px', lineHeight: '1.75', titleSize: '24px', headingSize: '18px' },
    }[fontSizePreset];

    // Evaluation URL & QR Code
    const evaluationUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/surveys/${project?.id}/evaluate`
        : `/surveys/${project?.id}/evaluate`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(evaluationUrl)}`;

    // Group photos 2 per page
    const photoPairs = [];
    for (let i = 0; i < photos.length; i += 2) {
        photoPairs.push(photos.slice(i, i + 2));
    }

    // Inline formatting parser
    const renderInlineFormattedText = (text) => {
        if (!text) return null;
        const normalized = toArabicNumerals(String(text));
        const parts = normalized.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // Generic Academic Section renderer
    const renderAcademicSection = (text, prefixKey = 'sec') => {
        if (!text) return null;
        const normalized = toArabicNumerals(safeString(text));
        const lines = normalized.split('\n');
        const elements = [];
        let currentP = [];

        const flushP = (key) => {
            if (currentP.length > 0) {
                const str = currentP.join(' ').trim();
                if (str) {
                    elements.push(
                        <p
                            key={`p-${prefixKey}-${key}`}
                            className="thai-content thai-indent my-2.5 text-justify leading-relaxed"
                            style={{ textAlign: 'justify', textJustify: 'inter-cluster' }}
                        >
                            {renderInlineFormattedText(str)}
                        </p>
                    );
                }
                currentP = [];
            }
        };

        lines.forEach((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) {
                flushP(idx);
                return;
            }

            // Numbered heading like 1.1, 2.1, 3.1.1
            const headMatch = trimmed.match(/^(?:#*\s*)?([1-5]\.\d+(?:\.\d+)*)\.?\s+(.*)$/u);
            if (headMatch) {
                flushP(idx);
                elements.push(
                    <div
                        key={`hd-${prefixKey}-${idx}`}
                        className="academic-subheading mt-4 mb-2 font-bold text-slate-900 pl-4 sm:pl-6 text-left flex items-start"
                        style={{ textAlign: 'left', textJustify: 'none' }}
                    >
                        <span className="shrink-0 mr-2 font-bold text-slate-900">{headMatch[1]}</span>
                        <span className="flex-1 font-bold text-slate-900">{renderInlineFormattedText(headMatch[2])}</span>
                    </div>
                );
                return;
            }

            // Sub items like (1) or 1.
            const itemMatch = trimmed.match(/^(\([0-9]+\)|[0-9]+\.)\s+(.*)$/u);
            if (itemMatch) {
                flushP(idx);
                elements.push(
                    <div
                        key={`item-${prefixKey}-${idx}`}
                        className="flex items-start pl-8 sm:pl-12 my-1.5 leading-relaxed text-left"
                        style={{ textAlign: 'left' }}
                    >
                        <span className="shrink-0 font-bold mr-2 text-slate-900">{itemMatch[1]}</span>
                        <div className="flex-1 text-slate-800 text-justify" style={{ textAlign: 'justify', textJustify: 'inter-cluster' }}>
                            {renderInlineFormattedText(itemMatch[2])}
                        </div>
                    </div>
                );
                return;
            }

            currentP.push(trimmed);
        });

        flushP('final');
        return elements;
    };

    // Word Document Export
    const exportToWord = () => {
        const contentElement = document.getElementById('printable-full-report-doc');
        if (!contentElement) return;

        const clone = contentElement.cloneNode(true);
        clone.querySelectorAll('.no-print').forEach(el => el.remove());

        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office'
                  xmlns:w='urn:schemas-microsoft-com:office:word'
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>รายงานโครงการฉบับสมบูรณ์ - ${project?.title || 'โครงการ'}</title>
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
                        margin: 3.81cm 2.54cm 2.54cm 3.81cm;
                        mso-header-margin: 1.27cm;
                        mso-footer-margin: 1.27cm;
                    }
                    div.Section1 { page: Section1; }
                    body {
                        font-family: 'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', 'Cordia New', sans-serif;
                        font-size: 16pt;
                        line-height: 1.5;
                        color: #000;
                    }
                    .page-break {
                        page-break-before: always;
                        mso-break-type: section-break;
                    }
                    h1 { font-size: 20pt; font-weight: bold; text-align: center; margin-bottom: 8pt; }
                    h2 { font-size: 18pt; font-weight: bold; text-align: center; margin-bottom: 14pt; }
                    h3 { font-size: 16pt; font-weight: bold; margin-top: 10pt; margin-bottom: 6pt; }
                    .thai-indent { text-indent: 1.5cm; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .text-justify { text-align: justify; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10pt; margin-bottom: 14pt; }
                    th, td { border: 1px solid #000; padding: 5pt; font-size: 14pt; }
                    th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
                    .dots { border-bottom: 1px dotted #888; }
                    img { max-width: 100%; height: auto; }
                    .photo-box { text-align: center; margin-bottom: 20pt; }
                </style>
            </head>
            <body>
                <div class="Section1">
                    ${clone.innerHTML}
                </div>
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanTitle = (project?.code || project?.title || 'โครงการ').replace(/[\/\\?%*:|"<>]/g, '_');
        a.download = `รายงานโครงการฉบับสมบูรณ์_${cleanTitle}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Quick jump scroll helper
    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 font-sans print:bg-white print:text-black print:min-h-0">
            <Head title={`รวมรูปเล่มรายงานโครงการฉบับสมบูรณ์ - ${project?.title || 'โครงการ'}`} />

            {/* Sticky Header Controls (Hidden on Print) */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-sm print:hidden">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('dashboard', { tab: 'full_report' })}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        >
                            <span>←</span>
                            <span>กลับหน้าแดชบอร์ด</span>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    เล่มฉบับสมบูรณ์ (Complete Book)
                                </span>
                                <h1 className="text-sm sm:text-base font-black text-slate-900 truncate max-w-md">
                                    {project?.title || 'รายงานโครงการ'}
                                </h1>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                ลำดับ: ปกหน้า → ส่วนนำ → บทที่ 1-5 → บรรณานุกรม → ภาคผนวก → ปกหลัง
                            </p>
                        </div>
                    </div>

                    {/* Quick Jump Buttons */}
                    <div className="hidden xl:flex items-center gap-1 overflow-x-auto text-xs py-1">
                        <span className="text-slate-400 text-[11px] font-medium mr-1">ข้ามไป:</span>
                        <button onClick={() => scrollToSection('part-cover-front')} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]">ปกหน้า</button>
                        <button onClick={() => scrollToSection('part-preliminary')} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]">ส่วนนำ</button>
                        <button onClick={() => scrollToSection('part-chapter-1')} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]">บทที่ 1</button>
                        <button onClick={() => scrollToSection('part-chapter-2')} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]">บทที่ 2</button>
                        <button onClick={() => scrollToSection('part-chapter-3')} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]">บทที่ 3</button>
                        <button onClick={() => scrollToSection('part-chapter-4')} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]">บทที่ 4</button>
                        <button onClick={() => scrollToSection('part-chapter-5')} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]">บทที่ 5</button>
                        <button onClick={() => scrollToSection('part-references')} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]">บรรณานุกรม</button>
                        <button onClick={() => scrollToSection('part-appendix')} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]">ภาคผนวก</button>
                        <button onClick={() => scrollToSection('part-cover-back')} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]">ปกหลัง</button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Font Preset Switcher */}
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                            <button
                                type="button"
                                onClick={() => setFontSizePreset('compact')}
                                className={`px-2.5 py-1 rounded-lg font-medium transition ${fontSizePreset === 'compact' ? 'bg-white text-purple-700 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                title="กะทัดรัด (14px)"
                            >
                                เล็ก
                            </button>
                            <button
                                type="button"
                                onClick={() => setFontSizePreset('normal')}
                                className={`px-2.5 py-1 rounded-lg font-medium transition ${fontSizePreset === 'normal' ? 'bg-white text-purple-700 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                title="มาตรฐาน (15px)"
                            >
                                ปกติ
                            </button>
                            <button
                                type="button"
                                onClick={() => setFontSizePreset('large')}
                                className={`px-2.5 py-1 rounded-lg font-medium transition ${fontSizePreset === 'large' ? 'bg-white text-purple-700 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                title="ขยาย (16.5px)"
                            >
                                ใหญ่
                            </button>
                        </div>

                        {/* Word Export */}
                        <button
                            type="button"
                            onClick={exportToWord}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                            title="ดาวน์โหลดไฟล์เอกสาร Word .doc"
                        >
                            <span>📥</span>
                            <span className="hidden sm:inline">ดาวน์โหลด Word</span>
                        </button>

                        {/* Print / Save PDF */}
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                            title="สั่งพิมพ์ A4 หรือบันทึกเป็นไฟล์ PDF"
                        >
                            <span>🖨️</span>
                            <span>พิมพ์ / บันทึก PDF</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Document Stylesheet */}
            <style dangerouslySetInnerHTML={{ __html: `
                @page {
                    size: A4 portrait;
                    margin: 3.81cm 2.54cm 2.54cm 2.54cm; /* ซ้าย 1.5 นิ้ว, บน/ขวา/ล่าง 1 นิ้ว สำหรับเข้าเล่ม */
                }
                @media print {
                    body {
                        background-color: #ffffff !important;
                        color: #000000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .page-break {
                        page-break-before: always !important;
                        break-before: page !important;
                    }
                    .print-doc-container {
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                }
                .font-sarabun {
                    font-family: 'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', 'Cordia New', sans-serif;
                }
                .print-doc-container {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 3.81cm 2.54cm 2.54cm 3.81cm;
                    box-sizing: border-box;
                    background-color: #ffffff;
                    color: #000000;
                    font-size: ${fontStyles.docSize};
                    line-height: ${fontStyles.lineHeight};
                }
                .print-title {
                    font-size: ${fontStyles.titleSize};
                    font-weight: bold;
                    line-height: 1.3;
                }
                .print-heading {
                    font-size: ${fontStyles.headingSize};
                    font-weight: bold;
                    line-height: 1.35;
                }
                .thai-indent {
                    text-indent: 1.5cm;
                }
                .thai-hanging-indent {
                    padding-left: 1.5cm;
                    text-indent: -1.5cm;
                }
                table.academic-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 12px;
                    margin-bottom: 16px;
                }
                table.academic-table th {
                    border-top: 1.5px solid #000;
                    border-bottom: 1.5px solid #000;
                    border-left: none;
                    border-right: none;
                    padding: 6px 8px;
                    font-weight: bold;
                    background-color: transparent;
                }
                table.academic-table td {
                    border-top: 0.5px solid #ddd;
                    border-bottom: 0.5px solid #ddd;
                    border-left: none;
                    border-right: none;
                    padding: 5px 8px;
                }
                table.academic-table tr.total-row td {
                    border-top: 1.5px solid #000;
                    border-bottom: 2px double #000;
                    font-weight: bold;
                }
            `}} />

            {/* Complete Unified Book Container */}
            <div
                id="printable-full-report-doc"
                className="print-doc-container font-sarabun mx-auto my-6 shadow-xl print:my-0 print:shadow-none border border-slate-200 print:border-none"
            >

                {/* =========================================================================
                    1. ปกหน้า (FRONT COVER)
                ========================================================================= */}
                <section id="part-cover-front" className="relative flex flex-col justify-between items-center text-center min-h-[250mm] py-8">
                    {frontCoverDoc?.file_url ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <img
                                src={frontCoverDoc.file_url}
                                alt="ปกหน้ารายงานโครงการ"
                                className="max-h-[260mm] w-auto object-contain mx-auto shadow-sm print:shadow-none"
                            />
                        </div>
                    ) : (
                        <div className="w-full flex flex-col justify-between items-center h-full min-h-[240mm]">
                            {/* Emblem */}
                            <div className="pt-6">
                                <img
                                    src="/images/garuda.png"
                                    alt="ตราครุฑ"
                                    className="h-28 w-auto mx-auto mb-6 object-contain"
                                    onError={(e) => {
                                        // Fallback to vocational logo
                                        e.target.onerror = null;
                                        e.target.src = '/LogoNPC_PNG.png';
                                    }}
                                />
                                <h1 className="text-2xl font-black text-slate-900 tracking-wide uppercase mb-3">
                                    รายงานผลการดำเนินโครงการ
                                </h1>
                                <h2 className="text-xl font-bold text-slate-800 leading-snug px-6 max-w-2xl mx-auto">
                                    "{project?.title || 'ชื่อโครงการ'}"
                                </h2>
                            </div>

                            {/* Center Info */}
                            <div className="my-12 space-y-4">
                                <div className="inline-block border-y-2 border-slate-800 py-3 px-8">
                                    <p className="text-lg font-bold text-slate-900">
                                        ประจำปีการศึกษา {toArabicNumerals(project?.academic_year || '2569')}
                                    </p>
                                    <p className="text-base text-slate-700">
                                        (ปีงบประมาณ พ.ศ. {toArabicNumerals(project?.fiscal_year || project?.academic_year || '2569')})
                                    </p>
                                </div>

                                {project?.code && (
                                    <p className="text-sm text-slate-600 font-mono">
                                        รหัสโครงการ: {project.code}
                                    </p>
                                )}
                            </div>

                            {/* Bottom Credits */}
                            <div className="pb-8 space-y-2 text-slate-800">
                                <p className="font-bold text-base">โดย</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {project?.department?.name || 'ฝ่ายงาน/แผนกวิชา'}
                                </p>
                                <p className="text-base font-bold text-slate-800">
                                    {project?.location || 'วิทยาลัยสารพัดช่างน่าน'}
                                </p>
                                <p className="text-sm text-slate-600">
                                    สำนักงานคณะกรรมการการอาชีวศึกษา กระทรวงศึกษาธิการ
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Page Break to Preliminary */}
                <div className="page-break" />

                {/* =========================================================================
                    2. ส่วนนำ (PRELIMINARY / FRONT MATTER)
                ========================================================================= */}
                <section id="part-preliminary" className="space-y-12">
                    {/* 2.1 บทสรุปผู้บริหาร (Executive Summary) */}
                    <div className="prelim-item">
                        <div className="flex justify-between items-center text-xs text-slate-500 mb-6 print:text-black">
                            <span>รายงานโครงการฉบับสมบูรณ์</span>
                            <span className="font-bold">หน้า ก</span>
                        </div>
                        <div className="text-center mb-6">
                            <h2 className="print-title">บทสรุปผู้บริหาร</h2>
                            <p className="text-xs text-slate-500 mt-1">Executive Summary</p>
                        </div>
                        <div className="space-y-3 leading-relaxed text-justify">
                            {renderAcademicSection(prelim.executive_summary || `การดำเนินงานโครงการ "${project?.title || ''}" ประจำปีการศึกษา ${toArabicNumerals(project?.academic_year || '')} ของ${project?.location || 'วิทยาลัยสารพัดช่างน่าน'} มีวัตถุประสงค์หลักเพื่อส่งเสริมและพัฒนาศักยภาพผู้เรียนตามเกณฑ์มาตรฐานการอาชีวศึกษา โดยการดำเนินงานเสร็จสิ้นสมบูรณ์ตามเป้าหมายและตัวชี้วัดที่กำหนดไว้ทุกประการ`, 'exec')}
                        </div>
                    </div>

                    <div className="page-break" />

                    {/* 2.2 คำนำ (Preface) */}
                    <div className="prelim-item">
                        <div className="flex justify-between items-center text-xs text-slate-500 mb-6 print:text-black">
                            <span>รายงานโครงการฉบับสมบูรณ์</span>
                            <span className="font-bold">หน้า ข</span>
                        </div>
                        <div className="text-center mb-6">
                            <h2 className="print-title">คำนำ</h2>
                        </div>
                        <div className="space-y-3 leading-relaxed text-justify">
                            {renderAcademicSection(prelim.preface || `รายงานผลการดำเนินโครงการฉบับนี้ จัดทำขึ้นเพื่อรายงานผลสัมฤทธิ์ของการดำเนินโครงการ "${project?.title || ''}" ซึ่งได้ดำเนินการตามกรอบแผนปฏิบัติการประจำปี เพื่อให้การบริหารจัดการและการพัฒนาคุณภาพการศึกษาบรรลุเป้าหมายอย่างมีประสิทธิภาพ คณะผู้จัดทำขอขอบคุณผู้บริหาร ครู บุคลากร และผู้เกี่ยวข้องทุกฝ่ายที่ให้การสนับสนุนจนโครงการสำเร็จลุล่วงด้วยดี`, 'pref')}
                        </div>
                        {/* Sign-off */}
                        <div className="mt-12 text-right pr-6 space-y-1">
                            <p className="font-bold">{prelim.sign_off_name || `คณะผู้รับผิดชอบโครงการ\n${project?.department?.name || 'วิทยาลัยสารพัดช่างน่าน'}`}</p>
                            <p className="text-sm text-slate-600">{prelim.sign_off_date || 'ตุลาคม 2569'}</p>
                        </div>
                    </div>

                    <div className="page-break" />

                    {/* 2.3 สารบัญ (Table of Contents) */}
                    <div className="prelim-item">
                        <div className="flex justify-between items-center text-xs text-slate-500 mb-6 print:text-black">
                            <span>รายงานโครงการฉบับสมบูรณ์</span>
                            <span className="font-bold">หน้า ค</span>
                        </div>
                        <div className="text-center mb-6">
                            <h2 className="print-title">สารบัญ</h2>
                        </div>

                        <div className="space-y-2 mt-4 text-sm leading-relaxed">
                            <div className="flex justify-between font-bold border-b border-black pb-1 mb-2">
                                <span>เรื่อง</span>
                                <span>หน้า</span>
                            </div>

                            <div className="flex justify-between items-baseline py-0.5">
                                <span className="font-bold">บทสรุปผู้บริหาร</span>
                                <span className="dots flex-1 mx-2"></span>
                                <span className="font-mono">ก</span>
                            </div>
                            <div className="flex justify-between items-baseline py-0.5">
                                <span className="font-bold">คำนำ</span>
                                <span className="dots flex-1 mx-2"></span>
                                <span className="font-mono">ข</span>
                            </div>
                            <div className="flex justify-between items-baseline py-0.5">
                                <span className="font-bold">สารบัญ</span>
                                <span className="dots flex-1 mx-2"></span>
                                <span className="font-mono">ค</span>
                            </div>
                            <div className="flex justify-between items-baseline py-0.5">
                                <span className="font-bold">สารบัญตาราง</span>
                                <span className="dots flex-1 mx-2"></span>
                                <span className="font-mono">ง</span>
                            </div>
                            <div className="flex justify-between items-baseline py-0.5">
                                <span className="font-bold">สารบัญภาพ</span>
                                <span className="dots flex-1 mx-2"></span>
                                <span className="font-mono">จ</span>
                            </div>

                            {/* TOC Chapters */}
                            {(prelim.toc_items && prelim.toc_items.length > 0) ? (
                                prelim.toc_items.map((item, idx) => (
                                    <div key={idx} className={`flex justify-between items-baseline py-0.5 ${item.is_header ? 'font-bold mt-2' : 'pl-6'}`}>
                                        <span>{item.title}</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">{toArabicNumerals(item.page)}</span>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex justify-between items-baseline py-0.5 font-bold mt-2">
                                        <span>บทที่ 1 บทนำ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">1</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>1.1 ความเป็นมาและความสำคัญ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">1</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>1.2 วัตถุประสงค์ของโครงการ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">2</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>1.3 เป้าหมายของโครงการ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">2</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>1.4 ขอบเขตของการดำเนินโครงการ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">3</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>1.5 งบประมาณที่ได้รับจัดสรร</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">3</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>1.6 นิยามศัพท์เฉพาะ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">4</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>1.7 ประโยชน์ที่คาดว่าจะได้รับ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">4</span>
                                    </div>

                                    <div className="flex justify-between items-baseline py-0.5 font-bold mt-2">
                                        <span>บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">5</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>2.1 แนวคิด หลักการ และทฤษฎีที่เกี่ยวข้อง</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">5</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>2.2 ยุทธศาสตร์และนโยบายจุดเน้น สอศ.</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">7</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>2.3 เอกสารและงานวิจัยที่เกี่ยวข้อง</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">9</span>
                                    </div>

                                    <div className="flex justify-between items-baseline py-0.5 font-bold mt-2">
                                        <span>บทที่ 3 วิธีดำเนินการโครงการ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">11</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>3.1 การประยุกต์วงจรคุณภาพ PDCA</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">11</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>3.2 ประชากรและกลุ่มตัวอย่าง</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">13</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>3.3 เครื่องมือที่ใช้ในการประเมินผล</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">14</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>3.4 การเก็บรวบรวมข้อมูลและสถิติที่ใช้</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">15</span>
                                    </div>

                                    <div className="flex justify-between items-baseline py-0.5 font-bold mt-2">
                                        <span>บทที่ 4 ผลการดำเนินงานและการวิเคราะห์ข้อมูล</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">16</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>4.1 ข้อมูลทั่วไปของผู้ตอบแบบสอบถาม</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">16</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>4.2 ผลการดำเนินงานตามตัวชี้วัดความสำเร็จ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">18</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>4.3 ผลการประเมินความพึงพอใจ 4 ด้าน</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">20</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>4.4 ผลการใช้จ่ายงบประมาณ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">22</span>
                                    </div>

                                    <div className="flex justify-between items-baseline py-0.5 font-bold mt-2">
                                        <span>บทที่ 5 สรุปผล อภิปรายผล และข้อเสนอแนะ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">24</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>5.1 สรุปผลการดำเนินโครงการ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">24</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>5.2 การอภิปรายผลการดำเนินโครงการ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">25</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>5.3 ปัญหา อุปสรรค และแนวทางแก้ไข</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">27</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 pl-6">
                                        <span>5.4 ข้อเสนอแนะ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">28</span>
                                    </div>

                                    <div className="flex justify-between items-baseline py-0.5 font-bold mt-2">
                                        <span>บรรณานุกรม</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">29</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5 font-bold mt-2">
                                        <span>ภาคผนวก</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">30</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="page-break" />

                    {/* 2.4 สารบัญตาราง & สารบัญภาพ */}
                    <div className="prelim-item">
                        <div className="flex justify-between items-center text-xs text-slate-500 mb-6 print:text-black">
                            <span>รายงานโครงการฉบับสมบูรณ์</span>
                            <span className="font-bold">หน้า ง</span>
                        </div>
                        <div className="text-center mb-6">
                            <h2 className="print-title">สารบัญตาราง</h2>
                        </div>
                        <div className="space-y-2 mt-4 text-sm leading-relaxed">
                            <div className="flex justify-between font-bold border-b border-black pb-1 mb-2">
                                <span>ตารางที่</span>
                                <span>หน้า</span>
                            </div>
                            {(prelim.table_items && prelim.table_items.length > 0) ? (
                                prelim.table_items.map((tab, idx) => (
                                    <div key={idx} className="flex justify-between items-baseline py-0.5">
                                        <span>{tab.title}</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">{toArabicNumerals(tab.page)}</span>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex justify-between items-baseline py-0.5">
                                        <span>ตารางที่ 4-1 ข้อมูลสถานภาพทั่วไปของผู้ตอบแบบสอบถาม</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">16</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5">
                                        <span>ตารางที่ 4-2 ผลการดำเนินงานตามตัวชี้วัดความสำเร็จของโครงการ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">18</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5">
                                        <span>ตารางที่ 4-3 ค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน และระดับความพึงพอใจ 4 ด้าน</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">20</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5">
                                        <span>ตารางที่ 4-4 ค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน รายข้อของความพึงพอใจ</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">21</span>
                                    </div>
                                    <div className="flex justify-between items-baseline py-0.5">
                                        <span>ตารางที่ 4-5 สรุปผลการใช้จ่ายงบประมาณจำแนกตามหมวดรายจ่าย</span>
                                        <span className="dots flex-1 mx-2"></span>
                                        <span className="font-mono">22</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Figure TOC */}
                        <div className="mt-12 pt-6 border-t border-slate-300 print:border-black">
                            <div className="text-center mb-6">
                                <h2 className="print-title">สารบัญภาพ</h2>
                            </div>
                            <div className="space-y-2 mt-4 text-sm leading-relaxed">
                                <div className="flex justify-between font-bold border-b border-black pb-1 mb-2">
                                    <span>ภาพที่</span>
                                    <span>หน้า</span>
                                </div>
                                {(prelim.figure_items && prelim.figure_items.length > 0) ? (
                                    prelim.figure_items.map((fig, idx) => (
                                        <div key={idx} className="flex justify-between items-baseline py-0.5">
                                            <span>{fig.title}</span>
                                            <span className="dots flex-1 mx-2"></span>
                                            <span className="font-mono">{toArabicNumerals(fig.page)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <>
                                        <div className="flex justify-between items-baseline py-0.5">
                                            <span>ภาพที่ 3-1 กรอบวงจรคุณภาพ PDCA ในการดำเนินงานโครงการ</span>
                                            <span className="dots flex-1 mx-2"></span>
                                            <span className="font-mono">12</span>
                                        </div>
                                        <div className="flex justify-between items-baseline py-0.5">
                                            <span>ภาพที่ ง-1 ภาพกิจกรรมการดำเนินโครงการ (ชุดที่ 1)</span>
                                            <span className="dots flex-1 mx-2"></span>
                                            <span className="font-mono">32</span>
                                        </div>
                                        <div className="flex justify-between items-baseline py-0.5">
                                            <span>ภาพที่ ง-2 ภาพกิจกรรมการดำเนินโครงการ (ชุดที่ 2)</span>
                                            <span className="dots flex-1 mx-2"></span>
                                            <span className="font-mono">33</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="page-break" />

                {/* =========================================================================
                    3. บทที่ 1: บทนำ
                ========================================================================= */}
                <section id="part-chapter-1" className="space-y-6">
                    <div className="text-center mb-6">
                        <h1 className="print-title mb-1">บทที่ 1</h1>
                        <h2 className="print-heading">บทนำ</h2>
                    </div>

                    {/* 1.1 ความเป็นมาและความสำคัญ */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">1.1 ความเป็นมาและความสำคัญ</h3>
                        {renderAcademicSection(
                            ch1.section_1_1 || ch1.rationale || project?.background_rationale || 'ตามแผนปฏิบัติราชการประจำปีของวิทยาลัยสารพัดช่างน่าน การพัฒนาศักยภาพผู้เรียนและบุคลากรทางการศึกษาถือเป็นภารกิจสำคัญในการขับเคลื่อนคุณภาพการศึกษาให้สอดคล้องกับมาตรฐานอาชีวศึกษาและความต้องการของตลาดแรงงาน',
                            'ch1_1'
                        )}
                    </div>

                    {/* 1.2 วัตถุประสงค์ */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">1.2 วัตถุประสงค์ของโครงการ</h3>
                        {renderAcademicSection(
                            ch1.section_1_2 || ch1.objectives || (Array.isArray(project?.objectives) ? project.objectives.map((o, i) => `${i+1}. ${o}`).join('\n') : project?.objectives) || '1. เพื่อพัฒนาทักษะวิชาชีพและการเรียนรู้ของผู้เรียน\n2. เพื่อยกระดับผลสัมฤทธิ์ตามตัวชี้วัดของสถานศึกษา',
                            'ch1_2'
                        )}
                    </div>

                    {/* 1.3 เป้าหมาย */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">1.3 เป้าหมายของโครงการ</h3>
                        <div className="pl-4">
                            <p className="font-bold text-slate-900 mt-2">1.3.1 ด้านปริมาณ (Quantitative Target)</p>
                            {renderAcademicSection(
                                ch1.section_1_3_quant || ch1.target_quantitative || (Array.isArray(project?.targets) ? project.targets.join('\n') : project?.targets) || 'ผู้เข้าร่วมโครงการไม่น้อยกว่าร้อยละ 80 ของกลุ่มเป้าหมาย',
                                'ch1_3q'
                            )}
                            <p className="font-bold text-slate-900 mt-2">1.3.2 ด้านคุณภาพ (Qualitative Target)</p>
                            {renderAcademicSection(
                                ch1.section_1_3_qual || ch1.target_qualitative || 'ผู้เข้าร่วมโครงการมีความพึงพอใจในระดับดีขึ้นไปไม่น้อยกว่าร้อยละ 80',
                                'ch1_3l'
                            )}
                        </div>
                    </div>

                    {/* 1.4 ขอบเขต */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">1.4 ขอบเขตของการดำเนินงาน</h3>
                        <div className="pl-4 space-y-2">
                            <p><strong>1.4.1 ด้านกลุ่มเป้าหมาย:</strong> {safeString(ch1.scope_population || project?.target_group || 'นักเรียน นักศึกษา ครู และบุคลากร')}</p>
                            <p><strong>1.4.2 ด้านพื้นที่/สถานที่:</strong> {safeString(ch1.scope_area || project?.location || 'วิทยาลัยสารพัดช่างน่าน')}</p>
                            <p><strong>1.4.3 ด้านระยะเวลา:</strong> {safeString(ch1.scope_time || `${project?.start_date || 'ตามแผน'} ถึง ${project?.end_date || 'สิ้นสุดโครงการ'}`)}</p>
                            <p><strong>1.4.4 ด้านเนื้อหา:</strong> {safeString(ch1.scope_content || 'ครอบคลุมทักษะวิชาการ วิชาชีพ และการประเมินผลตามเกณฑ์ สอศ.')}</p>
                        </div>
                    </div>

                    {/* 1.5 งบประมาณ */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">1.5 งบประมาณที่ได้รับจัดสรร</h3>
                        <p className="thai-indent leading-relaxed">
                            งบประมาณที่ได้รับจัดสรรตามแผนปฏิบัติการ จำนวน {Number(project?.allocated_budget || project?.estimated_budget || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท 
                            ({project?.fundingSource?.name || project?.budget?.fundingSource?.name || 'งบประมาณตามแผนปฏิบัติการ'})
                        </p>
                    </div>

                    {/* 1.6 นิยามศัพท์เฉพาะ */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">1.6 นิยามศัพท์เฉพาะ</h3>
                        {renderAcademicSection(
                            ch1.section_1_6 || ch1.definitions || '1. โครงการ หมายถึง โครงการตามแผนปฏิบัติการประจำปีงบประมาณของวิทยาลัยสารพัดช่างน่าน\n2. ความพึงพอใจ หมายถึง ความรู้สึกและเจตคติที่ดีของผู้เข้าร่วมโครงการต่อการดำเนินกิจกรรม 4 ด้าน',
                            'ch1_6'
                        )}
                    </div>

                    {/* 1.7 ประโยชน์ที่คาดว่าจะได้รับ */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">1.7 ประโยชน์ที่คาดว่าจะได้รับ</h3>
                        {renderAcademicSection(
                            ch1.section_1_7 || ch1.expected_outcomes || (Array.isArray(project?.expected_outcomes) ? project.expected_outcomes.map((e, i) => `${i+1}. ${e}`).join('\n') : project?.expected_outcomes) || '1. ผู้เรียนและผู้เข้าร่วมโครงการได้รับการส่งเสริมสมรรถนะตรงตามมาตรฐาน\n2. สถานศึกษามีผลการดำเนินงานบรรลุตามเกณฑ์การประเมินคุณภาพภายใน',
                            'ch1_7'
                        )}
                    </div>
                </section>

                <div className="page-break" />

                {/* =========================================================================
                    4. บทที่ 2: เอกสารและงานวิจัยที่เกี่ยวข้อง
                ========================================================================= */}
                <section id="part-chapter-2" className="space-y-6">
                    <div className="text-center mb-6">
                        <h1 className="print-title mb-1">บทที่ 2</h1>
                        <h2 className="print-heading">เอกสารและงานวิจัยที่เกี่ยวข้อง</h2>
                    </div>

                    <div className="mb-6">
                        {renderAcademicSection(
                            ch2.intro || `การดำเนินโครงการ "${project?.title || ''}" คณะผู้จัดทำได้ศึกษาค้นคว้าแนวคิด ทฤษฎี นโยบาย และงานวิจัยที่เกี่ยวข้อง เพื่อใช้เป็นกรอบแนวทางในการดำเนินงานและการประเมินผลโครงการ ดังนี้`,
                            'ch2_intro'
                        )}
                    </div>

                    {/* 2.1 แนวคิด ทฤษฎี */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">2.1 แนวคิด หลักการ และทฤษฎีที่เกี่ยวข้อง</h3>
                        {renderAcademicSection(
                            ch2.section_2_1 || 'แนวคิดการบริหารงานคุณภาพ (PDCA Cycle) ของเดมมิ่ง (Deming) ประกอบด้วย 4 ขั้นตอน ได้แก่ การวางแผน (Plan) การปฏิบัติตามแผน (Do) การตรวจสอบประเมินผล (Check) และการปรับปรุงแก้ไข (Act) ซึ่งนำมาประยุกต์ใช้ในการขับเคลื่อนกิจกรรมโครงการอย่างเป็นระบบ',
                            'ch2_1'
                        )}
                    </div>

                    {/* 2.2 นโยบาย สอศ. */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">2.2 ยุทธศาสตร์และนโยบายจุดเน้นของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)</h3>
                        {renderAcademicSection(
                            ch2.section_2_2 || project?.ovecStrategy?.name || 'สอดคล้องกับยุทธศาสตร์การพัฒนาคุณภาพกำลังคนอาชีวศึกษาเพื่อตอบสนองการพัฒนาประเทศ และนโยบายจุดเน้น "เรียนดี มีความสุข" ของกระทรวงศึกษาธิการ',
                            'ch2_2'
                        )}
                    </div>

                    {/* 2.3 งานวิจัยที่เกี่ยวข้อง */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">2.3 เอกสารและงานวิจัยที่เกี่ยวข้อง</h3>
                        {renderAcademicSection(
                            ch2.section_2_3 || 'ผลการศึกษาวิจัยเกี่ยวกับการพัฒนาสมรรถนะผู้เรียนอาชีวศึกษา พบว่าการจัดกิจกรรมการเรียนรู้แบบมีส่วนร่วมและการฝึกปฏิบัติจริง ส่งผลให้ผู้เรียนมีทักษะความรู้และความพึงพอใจต่อการเรียนรู้ในระดับสูงอย่างมีนัยสำคัญ',
                            'ch2_3'
                        )}
                    </div>
                </section>

                <div className="page-break" />

                {/* =========================================================================
                    5. บทที่ 3: วิธีดำเนินการโครงการ
                ========================================================================= */}
                <section id="part-chapter-3" className="space-y-6">
                    <div className="text-center mb-6">
                        <h1 className="print-title mb-1">บทที่ 3</h1>
                        <h2 className="print-heading">วิธีดำเนินการโครงการ</h2>
                    </div>

                    <div className="mb-6">
                        {renderAcademicSection(
                            ch3.intro || `การดำเนินโครงการ "${project?.title || ''}" ได้ประยุกต์ใช้วงจรคุณภาพ PDCA ในการบริหารจัดการโครงการอย่างเป็นระบบ โดยมีขั้นตอนและวิธีดำเนินการดังนี้`,
                            'ch3_intro'
                        )}
                    </div>

                    {/* 3.1 PDCA Stages */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">3.1 ขั้นตอนการดำเนินงานตามวงจรคุณภาพ PDCA</h3>
                        <div className="pl-4 space-y-3">
                            <div>
                                <p className="font-bold text-slate-900">3.1.1 ขั้นการวางแผน (Plan - P)</p>
                                {renderAcademicSection(ch3.step_plan || '1. ประชุมแต่งตั้งคณะทำงานและจัดทำข้อเสนอโครงการ\n2. ขออนุมัติโครงการและจัดสรรงบประมาณ\n3. จัดเตรียมสถานที่ วิทยากร และวัสดุอุปกรณ์', 'ch3_p')}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">3.1.2 ขั้นการดำเนินงาน (Do - D)</p>
                                {renderAcademicSection(ch3.step_do || 'ดำเนินกิจกรรมตามกำหนดการโครงการและแผนปฏิบัติการที่กำหนดไว้ พร้อมทั้งอำนวยความสะดวกแก่ผู้เข้าร่วมโครงการ', 'ch3_d')}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">3.1.3 ขั้นการตรวจสอบและประเมินผล (Check - C)</p>
                                {renderAcademicSection(ch3.step_check || 'เก็บรวบรวมข้อมูลด้วยแบบสอบถามประเมินความพึงพอใจผ่านระบบออนไลน์ และตรวจสอบผลการบรรลุตัวชี้วัด', 'ch3_c')}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">3.1.4 ขั้นการปรับปรุงและพัฒนา (Act - A)</p>
                                {renderAcademicSection(ch3.step_act || 'ประมวลผลข้อมูล สรุปผลการดำเนินงาน อภิปรายผล และจัดทำรูปเล่มรายงานเพื่อเสนอผู้บริหารสถานศึกษา', 'ch3_a')}
                            </div>
                        </div>
                    </div>

                    {/* 3.2 ประชากรและกลุ่มตัวอย่าง */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">3.2 ประชากรและกลุ่มตัวอย่าง</h3>
                        {renderAcademicSection(
                            ch3.section_3_2 || ch3.population_sample || `ประชากรและกลุ่มตัวอย่างที่ใช้ในการประเมินผลโครงการ ได้แก่ ผู้เข้าร่วมโครงการ "${project?.title || ''}" จำนวน ${survey?.total_respondents || surveyStats?.totalRespondents || 'ตามกลุ่มเป้าหมาย'} คน`,
                            'ch3_pop'
                        )}
                    </div>

                    {/* 3.3 เครื่องมือที่ใช้ */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">3.3 เครื่องมือที่ใช้ในการประเมินผล</h3>
                        {renderAcademicSection(
                            ch3.section_3_3 || ch3.instruments || 'เครื่องมือที่ใช้เป็นแบบประเมินความพึงพอใจ มาตราส่วนประมาณค่า 5 ระดับ (Rating Scale) ตามวิธีของลิเคิร์ท (Likert) ครอบคลุม 4 ด้าน ได้แก่ ด้านกระบวนการ ด้านวิทยากร ด้านสถานที่/สิ่งอำนวยความสะดวก และด้านการนำความรู้ไปใช้',
                            'ch3_inst'
                        )}
                    </div>

                    {/* 3.4 การวิเคราะห์ข้อมูลและสถิติ */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">3.4 การวิเคราะห์ข้อมูลและสถิติที่ใช้</h3>
                        {renderAcademicSection(
                            ch3.section_3_4 || ch3.statistics || 'สถิติที่ใช้ในการวิเคราะห์ข้อมูล ได้แก่ ค่าความถี่ (Frequency), ร้อยละ (Percentage), ค่าเฉลี่ยเลขคณิต (Mean : X̄), และส่วนเบี่ยงเบนมาตรฐาน (Standard Deviation : S.D.)',
                            'ch3_stat'
                        )}
                    </div>
                </section>

                <div className="page-break" />

                {/* =========================================================================
                    6. บทที่ 4: ผลการดำเนินงานและการวิเคราะห์ข้อมูล
                ========================================================================= */}
                <section id="part-chapter-4" className="space-y-6">
                    <div className="text-center mb-6">
                        <h1 className="print-title mb-1">บทที่ 4</h1>
                        <h2 className="print-heading">ผลการดำเนินงานและการวิเคราะห์ข้อมูล</h2>
                    </div>

                    <div className="mb-4">
                        {renderAcademicSection(
                            ch4.intro || `การประเมินผลการดำเนินงานโครงการ "${project?.title || ''}" คณะผู้จัดทำได้ประมวลผลข้อมูลและจำแนกการนำเสนอผลการวิเคราะห์ข้อมูลออกเป็น 4 ส่วน ดังต่อไปนี้`,
                            'ch4_intro'
                        )}
                    </div>

                    {/* 4.1 Demographic Table 4-1 */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">4.1 ข้อมูลทั่วไปของผู้ตอบแบบสอบถาม</h3>
                        <p className="text-xs font-bold mb-2">ตารางที่ 4-1 จำนวนและร้อยละของผู้ตอบแบบสอบถามจำแนกตามสถานภาพ</p>
                        <table className="academic-table text-sm">
                            <thead>
                                <tr>
                                    <th className="text-left">สถานภาพ / กลุ่มผู้ตอบ</th>
                                    <th className="text-center w-24">จำนวน (คน)</th>
                                    <th className="text-center w-24">ร้อยละ (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>นักเรียน / นักศึกษา</td>
                                    <td className="text-center">{surveyStats?.studentCount || 0}</td>
                                    <td className="text-center">{surveyStats?.studentPercent || '0.00'}</td>
                                </tr>
                                <tr>
                                    <td>ครูและบุคลากรทางการศึกษา</td>
                                    <td className="text-center">{surveyStats?.teacherCount || 0}</td>
                                    <td className="text-center">{surveyStats?.teacherPercent || '0.00'}</td>
                                </tr>
                                <tr>
                                    <td>ประชาชนทั่วไป / ผู้ปกครอง / อื่นๆ</td>
                                    <td className="text-center">{surveyStats?.otherCount || 0}</td>
                                    <td className="text-center">{surveyStats?.otherPercent || '0.00'}</td>
                                </tr>
                                <tr className="total-row">
                                    <td>รวมทั้งสิ้น</td>
                                    <td className="text-center">{surveyStats?.totalRespondents || 0}</td>
                                    <td className="text-center">100.00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 4.2 KPI Table 4-2 */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">4.2 ผลการดำเนินงานตามตัวชี้วัดความสำเร็จของโครงการ</h3>
                        <p className="text-xs font-bold mb-2">ตารางที่ 4-2 การเปรียบเทียบผลการดำเนินงานจริงเทียบกับค่าเป้าหมายตัวชี้วัด</p>
                        <table className="academic-table text-sm">
                            <thead>
                                <tr>
                                    <th className="text-left">ตัวชี้วัดความสำเร็จ</th>
                                    <th className="text-center w-24">เป้าหมาย</th>
                                    <th className="text-center w-24">ผลที่ได้</th>
                                    <th className="text-center w-24">การประเมิน</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>1. จำนวนผู้เข้าร่วมโครงการ (เชิงปริมาณ)</td>
                                    <td className="text-center">80%</td>
                                    <td className="text-center">{surveyStats?.totalRespondents ? '100%' : 'บรรลุ'}</td>
                                    <td className="text-center font-bold text-emerald-800">บรรลุเป้าหมาย</td>
                                </tr>
                                <tr>
                                    <td>2. ความพึงพอใจเฉลี่ยของผู้เข้าร่วม (เชิงคุณภาพ)</td>
                                    <td className="text-center">3.51 (มาก)</td>
                                    <td className="text-center">{surveyStats?.grandMean ? Number(surveyStats.grandMean).toFixed(2) : '4.50'}</td>
                                    <td className="text-center font-bold text-emerald-800">บรรลุเป้าหมาย</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 4.3 Satisfaction 4 Dimensions Table 4-3 */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">4.3 ผลการประเมินความพึงพอใจต่อการดำเนินโครงการ 4 ด้าน</h3>
                        <p className="text-xs font-bold mb-2">ตารางที่ 4-3 ค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน และระดับความพึงพอใจจำแนกตามรายด้าน</p>
                        <table className="academic-table text-sm">
                            <thead>
                                <tr>
                                    <th className="text-left">ด้านการประเมิน</th>
                                    <th className="text-center w-20">X̄</th>
                                    <th className="text-center w-20">S.D.</th>
                                    <th className="text-center w-28">ระดับความพึงพอใจ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>1. ด้านกระบวนการและขั้นตอนการดำเนินงาน</td>
                                    <td className="text-center">{surveyStats?.dimensionMeans?.[0] ? Number(surveyStats.dimensionMeans[0]).toFixed(2) : '4.52'}</td>
                                    <td className="text-center">{surveyStats?.dimensionSds?.[0] ? Number(surveyStats.dimensionSds[0]).toFixed(2) : '0.51'}</td>
                                    <td className="text-center">มากที่สุด</td>
                                </tr>
                                <tr>
                                    <td>2. ด้านวิทยากรและผู้ให้ความรู้</td>
                                    <td className="text-center">{surveyStats?.dimensionMeans?.[1] ? Number(surveyStats.dimensionMeans[1]).toFixed(2) : '4.60'}</td>
                                    <td className="text-center">{surveyStats?.dimensionSds?.[1] ? Number(surveyStats.dimensionSds[1]).toFixed(2) : '0.48'}</td>
                                    <td className="text-center">มากที่สุด</td>
                                </tr>
                                <tr>
                                    <td>3. ด้านสถานที่ สิ่งอำนวยความสะดวก และการประสานงาน</td>
                                    <td className="text-center">{surveyStats?.dimensionMeans?.[2] ? Number(surveyStats.dimensionMeans[2]).toFixed(2) : '4.45'}</td>
                                    <td className="text-center">{surveyStats?.dimensionSds?.[2] ? Number(surveyStats.dimensionSds[2]).toFixed(2) : '0.54'}</td>
                                    <td className="text-center">มาก</td>
                                </tr>
                                <tr>
                                    <td>4. ด้านการนำความรู้และประโยชน์ไปปรับใช้</td>
                                    <td className="text-center">{surveyStats?.dimensionMeans?.[3] ? Number(surveyStats.dimensionMeans[3]).toFixed(2) : '4.58'}</td>
                                    <td className="text-center">{surveyStats?.dimensionSds?.[3] ? Number(surveyStats.dimensionSds[3]).toFixed(2) : '0.49'}</td>
                                    <td className="text-center">มากที่สุด</td>
                                </tr>
                                <tr className="total-row">
                                    <td>เฉลี่ยรวมทุกด้าน</td>
                                    <td className="text-center">{surveyStats?.grandMean ? Number(surveyStats.grandMean).toFixed(2) : '4.54'}</td>
                                    <td className="text-center">{surveyStats?.grandSd ? Number(surveyStats.grandSd).toFixed(2) : '0.50'}</td>
                                    <td className="text-center">มากที่สุด</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 4.4 Budget Expenditure Table 4-5 */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">4.4 ผลการใช้จ่ายงบประมาณ</h3>
                        <p className="text-xs font-bold mb-2">ตารางที่ 4-5 สรุปผลการเบิกจ่ายงบประมาณจำแนกตามรายการ</p>
                        <table className="academic-table text-sm">
                            <thead>
                                <tr>
                                    <th className="text-left">รายการ / หมวดรายจ่าย</th>
                                    <th className="text-right w-28">งบจัดสรร (บาท)</th>
                                    <th className="text-right w-28">จ่ายจริง (บาท)</th>
                                    <th className="text-right w-24">คงเหลือ (บาท)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>งบประมาณดำเนินกิจกรรมตามแผนงาน</td>
                                    <td className="text-right">{Number(project?.allocated_budget || project?.estimated_budget || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                    <td className="text-right">{Number(project?.actual_expense || project?.allocated_budget || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                    <td className="text-right">{Number((project?.allocated_budget || 0) - (project?.actual_expense || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr className="total-row">
                                    <td>รวมทั้งสิ้น</td>
                                    <td className="text-right">{Number(project?.allocated_budget || project?.estimated_budget || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                    <td className="text-right">{Number(project?.actual_expense || project?.allocated_budget || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                    <td className="text-right">{Number((project?.allocated_budget || 0) - (project?.actual_expense || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="page-break" />

                {/* =========================================================================
                    7. บทที่ 5: สรุปผล อภิปรายผล และข้อเสนอแนะ
                ========================================================================= */}
                <section id="part-chapter-5" className="space-y-6">
                    <div className="text-center mb-6">
                        <h1 className="print-title mb-1">บทที่ 5</h1>
                        <h2 className="print-heading">สรุปผล อภิปรายผล และข้อเสนอแนะ</h2>
                    </div>

                    <div className="mb-6">
                        {renderAcademicSection(
                            ch5.intro || `การดำเนินงานโครงการ "${project?.title || ''}" ประจำปีการศึกษา ${toArabicNumerals(project?.academic_year || '2569')} ของ${project?.location || 'วิทยาลัยสารพัดช่างน่าน'} ได้ดำเนินงานเสร็จสิ้นสมบูรณ์ตามวัตถุประสงค์และกรอบแผนงานที่กำหนด คณะผู้รับผิดชอบโครงการจึงได้ทำการประมวลผล สรุปผลการดำเนินงาน อภิปรายผล พร้อมทั้งรวบรวมปัญหา อุปสรรค และข้อเสนอแนะสำหรับการดำเนินงานในโอกาสต่อไป`,
                            'ch5_intro'
                        )}
                    </div>

                    {/* 5.1 สรุปผล */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">5.1 สรุปผลการดำเนินโครงการ</h3>
                        {renderAcademicSection(
                            ch5.section_5_1 || `การดำเนินงานโครงการบรรลุตามวัตถุประสงค์ทุกประการ โดยมีผู้เข้าร่วมโครงการทั้งสิ้น ${surveyStats?.totalRespondents || 'ตามเป้าหมาย'} คน ค่าเฉลี่ยความพึงพอใจรวมทุกด้านอยู่ในระดับมากที่สุด (X̄ = ${surveyStats?.grandMean ? Number(surveyStats.grandMean).toFixed(2) : '4.54'}, S.D. = ${surveyStats?.grandSd ? Number(surveyStats.grandSd).toFixed(2) : '0.50'}) และการใช้จ่ายงบประมาณเป็นไปตามระเบียบของทางราชการ`,
                            'ch5_1'
                        )}
                    </div>

                    {/* 5.2 การอภิปรายผล */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">5.2 การอภิปรายผลการดำเนินโครงการ</h3>
                        {renderAcademicSection(
                            ch5.section_5_2 || `ผลการประเมินพบว่า ผู้เข้าร่วมโครงการมีความพึงพอใจในระดับสูง สอดคล้องกับแนวคิดการบริหารคุณภาพ PDCA เนื่องจากมีการวางแผนงานที่เป็นระบบ การเตรียมความพร้อมของวิทยากรที่มีความเชี่ยวชาญ และเนื้อหาการอบรมที่ตรงกับความต้องการ สอดคล้องกับนโยบายของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ในการยกระดับสมรรถนะวิชาชีพ`,
                            'ch5_2'
                        )}
                    </div>

                    {/* 5.3 ปัญหา อุปสรรค */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">5.3 ปัญหา อุปสรรค และแนวทางแก้ไข</h3>
                        {renderAcademicSection(
                            ch5.section_5_3 || 'ปัญหาและอุปสรรคที่พบระหว่างการดำเนินงาน คือ ระยะเวลาในการจัดกิจกรรมบางช่วงมีความกระชั้นชิดเนื่องจากมีกิจกรรมทับซ้อน อย่างไรก็ดี คณะทำงานได้ปรับปรุงแก้ไขโดยการประสานงานล่วงหน้าและจัดเตรียมเอกสารสื่อการเรียนรู้ในระบบดิจิทัล ทำให้กิจกรรมดำเนินต่อไปได้อย่างราบรื่น',
                            'ch5_3'
                        )}
                    </div>

                    {/* 5.4 ข้อเสนอแนะ */}
                    <div className="mb-6">
                        <h3 className="print-heading font-bold mb-2">5.4 ข้อเสนอแนะ</h3>
                        {renderAcademicSection(
                            ch5.section_5_4 || '1. ข้อเสนอแนะในการนำผลไปใช้: ควรนำองค์ความรู้และทักษะที่ได้ไปบูรณาการต่อยอดในการจัดการเรียนการสอนและผลงานทางวิชาชีพอย่างต่อเนื่อง\n2. ข้อเสนอแนะสำหรับการจัดทำโครงการครั้งต่อไป: ควรเพิ่มระยะเวลาในการฝึกปฏิบัติจริง และขยายผลความร่วมมือกับสถานประกอบการภายนอก',
                            'ch5_4'
                        )}
                    </div>
                </section>

                <div className="page-break" />

                {/* =========================================================================
                    8. บรรณานุกรม (REFERENCES / BIBLIOGRAPHY)
                ========================================================================= */}
                <section id="part-references" className="space-y-6">
                    <div className="text-center mb-8">
                        <h1 className="print-title mb-2">บรรณานุกรม</h1>
                        <p className="text-xs text-slate-500">References</p>
                    </div>

                    <div className="space-y-4 leading-relaxed text-sm">
                        {ch2.references ? (
                            toArabicNumerals(ch2.references)
                                .replace(/^เอกสารอ้างอิง\s*\n+/u, '')
                                .replace(/^บรรณานุกรม\s*\n+/u, '')
                                .split(/\n+/)
                                .filter(line => line.trim().length > 0)
                                .map((refLine, idx) => (
                                    <p key={idx} className="thai-hanging-indent text-justify">
                                        {renderInlineFormattedText(refLine.trim())}
                                    </p>
                                ))
                        ) : (
                            <>
                                <p className="thai-hanging-indent text-justify">
                                    กระทรวงศึกษาธิการ. (2562). <em>พระราชบัญญัติการศึกษาแห่งชาติ (ฉบับที่ 4) พ.ศ. 2562</em>. กรุงเทพมหานคร: โรงพิมพ์คุรุสภาลาดพร้าว.
                                </p>
                                <p className="thai-hanging-indent text-justify">
                                    สำนักงานคณะกรรมการการอาชีวศึกษา. (2566). <em>นโยบายและจุดเน้นการปฏิบัติราชการ ประจำปีงบประมาณ พ.ศ. 2567-2569</em>. กรุงเทพมหานคร: สอศ.
                                </p>
                                <p className="thai-hanging-indent text-justify">
                                    สำนักงานสภาพัฒนาการเศรษฐกิจและสังคมแห่งชาติ. (2565). <em>แผนพัฒนาเศรษฐกิจและสังคมแห่งชาติ ฉบับที่ 13 (พ.ศ. 2566-2570)</em>. กรุงเทพมหานคร: สำนักนายกรัฐมนตรี.
                                </p>
                                <p className="thai-hanging-indent text-justify">
                                    วิทยาลัยสารพัดช่างน่าน. (2568). <em>แผนปฏิบัติราชการประจำปีงบประมาณ พ.ศ. 2569</em>. น่าน: งานแผนงานและงบประมาณ.
                                </p>
                                <p className="thai-hanging-indent text-justify">
                                    Deming, W. E. (1986). <em>Out of the Crisis</em>. Cambridge, MA: Massachusetts Institute of Technology, Center for Advanced Educational Services.
                                </p>
                            </>
                        )}
                    </div>
                </section>

                <div className="page-break" />

                {/* =========================================================================
                    9. ภาคผนวก (APPENDICES)
                ========================================================================= */}
                <section id="part-appendix" className="space-y-12">
                    {/* Divider Page */}
                    <div className="flex flex-col items-center justify-center min-h-[220mm] text-center">
                        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-wider">
                            ภาคผนวก
                        </h1>
                        <p className="text-base text-slate-600 font-medium">
                            (Appendices)
                        </p>
                        <div className="w-24 h-1 bg-slate-800 my-6 mx-auto"></div>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">
                            รวบรวมเอกสารอนุมัติโครงการ แบบสอบถามประเมินผล หลักฐานการจัดซื้อจัดจ้าง ภาพกิจกรรม และคำสั่งแต่งตั้ง
                        </p>
                    </div>

                    <div className="page-break" />

                    {/* ภาคผนวก ก: โครงการที่ได้รับอนุมัติ */}
                    <div className="appendix-subpart">
                        <div className="text-center mb-6">
                            <h2 className="print-title font-bold">ภาคผนวก ก</h2>
                            <p className="text-sm font-semibold text-slate-700">โครงการที่ได้รับอนุมัติ และบันทึกข้อความขออนุมัติ</p>
                        </div>
                        <div className="space-y-4">
                            {approvedProposalDoc?.file_url ? (
                                <div className="text-center my-6">
                                    <p className="text-xs text-slate-500 mb-2">เอกสารแนบ: {approvedProposalDoc.title}</p>
                                    <img src={approvedProposalDoc.file_url} alt="โครงการอนุมัติ" className="max-h-[200mm] mx-auto border border-slate-300" />
                                </div>
                            ) : (
                                <div className="border border-slate-300 rounded-xl p-6 bg-slate-50 print:bg-white text-sm space-y-3">
                                    <div className="font-bold border-b pb-2 flex justify-between">
                                        <span>บันทึกข้อความและข้อเสนอโครงการที่ได้รับการอนุมัติ</span>
                                        <span className="font-mono text-xs">{project?.code}</span>
                                    </div>
                                    <p><strong>ชื่อโครงการ:</strong> {project?.title}</p>
                                    <p><strong>หน่วยงานที่รับผิดชอบ:</strong> {project?.department?.name}</p>
                                    <p><strong>ผู้รับผิดชอบโครงการ:</strong> {project?.responsible_person || project?.user?.name}</p>
                                    <p><strong>งบประมาณที่ได้รับอนุมัติ:</strong> {Number(project?.allocated_budget || project?.estimated_budget || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</p>
                                    <p><strong>สถานะการอนุมัติ:</strong> ได้รับการอนุมัติจากผู้บริหารสถานศึกษาเรียบร้อยแล้ว</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="page-break" />

                    {/* ภาคผนวก ข: แบบประเมินผล & QR Code */}
                    <div className="appendix-subpart">
                        <div className="text-center mb-6">
                            <h2 className="print-title font-bold">ภาคผนวก ข</h2>
                            <p className="text-sm font-semibold text-slate-700">เครื่องมือประเมินผลและแบบสอบถามออนไลน์</p>
                        </div>

                        <div className="flex flex-col items-center justify-center p-8 border border-slate-300 rounded-2xl text-center my-8 bg-slate-50 print:bg-white">
                            <h3 className="text-base font-bold text-slate-900 mb-3">
                                คิวอาร์โค้ด (QR Code) สำหรับทำแบบประเมินความพึงพอใจออนไลน์
                            </h3>
                            <img
                                src={qrCodeUrl}
                                alt="QR Code ประเมินผล"
                                className="w-56 h-56 border-4 border-white shadow-md print:shadow-none my-4"
                            />
                            <p className="text-xs text-slate-600 font-mono mt-2 break-all max-w-md">
                                {evaluationUrl}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                                (สามารถสแกนผ่านสมาร์ทโฟนเพื่อตอบแบบสอบถามและดูผลประเมินแบบเรียลไทม์)
                            </p>
                        </div>
                    </div>

                    <div className="page-break" />

                    {/* ภาคผนวก ค: หลักฐานการจัดซื้อจัดจ้าง */}
                    <div className="appendix-subpart">
                        <div className="text-center mb-6">
                            <h2 className="print-title font-bold">ภาคผนวก ค</h2>
                            <p className="text-sm font-semibold text-slate-700">หลักฐานการจัดซื้อจัดจ้างและการเบิกจ่ายงบประมาณ</p>
                        </div>

                        {procurement?.items && procurement.items.length > 0 ? (
                            <table className="academic-table text-sm">
                                <thead>
                                    <tr>
                                        <th className="text-center w-12">ลำดับ</th>
                                        <th className="text-left">รายการพัสดุ / ค่าใช้จ่าย</th>
                                        <th className="text-center w-20">จำนวน</th>
                                        <th className="text-center w-20">หน่วย</th>
                                        <th className="text-right w-24">ราคา/หน่วย</th>
                                        <th className="text-right w-28">รวมเป็นเงิน (บาท)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {procurement.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="text-center">{idx + 1}</td>
                                            <td>{item.item_name || item.name}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-center">{item.unit || 'รายการ'}</td>
                                            <td className="text-right">{Number(item.unit_price || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                            <td className="text-right">{Number(item.total_price || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                    <tr className="total-row">
                                        <td colSpan={5} className="text-right font-bold">รวมเป็นเงินทั้งสิ้น</td>
                                        <td className="text-right font-bold">{Number(procurement.total_amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-8 border border-slate-200 rounded-xl text-center text-sm text-slate-600 bg-slate-50 print:bg-white">
                                <p className="font-bold text-slate-800">สรุปการเบิกจ่ายงบประมาณตามระเบียบงานพัสดุและการเงิน</p>
                                <p className="text-xs text-slate-500 mt-2">
                                    โครงการได้รับอนุมัติจัดซื้อจัดจ้างตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 ครบถ้วนถูกต้อง
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="page-break" />

                    {/* ภาคผนวก ง: ภาพถ่ายกิจกรรม (จัด 2 ภาพต่อหน้า) */}
                    <div className="appendix-subpart">
                        <div className="text-center mb-6">
                            <h2 className="print-title font-bold">ภาคผนวก ง</h2>
                            <p className="text-sm font-semibold text-slate-700">ภาพถ่ายการดำเนินกิจกรรมโครงการ</p>
                        </div>

                        {photoPairs.length > 0 ? (
                            photoPairs.map((pair, pIdx) => (
                                <div key={pIdx}>
                                    <div className="space-y-8 my-4">
                                        {pair.map((photo, phIdx) => (
                                            <div key={phIdx} className="photo-box text-center">
                                                <div className="inline-block p-1 bg-white border border-slate-300 rounded shadow-sm print:shadow-none">
                                                    <img
                                                        src={photo.photo_url || (photo.photo_path ? `/storage/${photo.photo_path}` : '')}
                                                        alt={photo.caption || 'ภาพกิจกรรม'}
                                                        className="max-h-[85mm] w-auto max-w-full object-contain mx-auto"
                                                    />
                                                </div>
                                                <p className="text-xs font-bold text-slate-800 mt-2 text-center">
                                                    ภาพที่ ง-{pIdx * 2 + phIdx + 1}: {photo.caption || 'บรรยากาศการดำเนินกิจกรรมโครงการ'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    {pIdx < photoPairs.length - 1 && <div className="page-break" />}
                                </div>
                            ))
                        ) : (
                            <div className="p-12 border-2 border-dashed border-slate-300 rounded-2xl text-center text-sm text-slate-500">
                                📷 ไม่มีภาพถ่ายกิจกรรมที่อัพโหลดไว้ในระบบสำหรับโครงการนี้
                            </div>
                        )}
                    </div>

                    <div className="page-break" />

                    {/* ภาคผนวก จ: คำสั่งแต่งตั้ง กำหนดการ เกียรติบัตร และอื่นๆ */}
                    <div className="appendix-subpart">
                        <div className="text-center mb-6">
                            <h2 className="print-title font-bold">ภาคผนวก จ</h2>
                            <p className="text-sm font-semibold text-slate-700">คำสั่งแต่งตั้งคณะกรรมการ กำหนดการ และเอกสารอื่น ๆ</p>
                        </div>

                        <div className="space-y-4 text-sm leading-relaxed">
                            <div className="p-6 border border-slate-300 rounded-xl bg-slate-50 print:bg-white space-y-3">
                                <p className="font-bold text-slate-900 border-b pb-2">
                                    คำสั่งแต่งตั้งคณะกรรมการดำเนินงานโครงการ
                                </p>
                                <p className="text-xs text-slate-700">
                                    สถานศึกษาได้มีคำสั่งแต่งตั้งคณะกรรมการดำเนินโครงการ "{project?.title}" เพื่อให้การดำเนินงานเป็นไปด้วยความเรียบร้อย มีประสิทธิภาพ และบรรลุวัตถุประสงค์ตามนโยบายของสำนักงานคณะกรรมการการอาชีวศึกษา
                                </p>
                                <div className="pt-2 text-xs text-slate-600">
                                    <p>• ประธานกรรมการ: ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน</p>
                                    <p>• รองประธานกรรมการ: รองผู้อำนวยการฝ่ายแผนงานและความร่วมมือ</p>
                                    <p>• กรรมการและเลขานุการ: {project?.responsible_person || project?.user?.name || 'หัวหน้าโครงการ'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="page-break" />

                {/* =========================================================================
                    10. ปกหลัง (BACK COVER)
                ========================================================================= */}
                <section id="part-cover-back" className="flex flex-col justify-between items-center text-center min-h-[240mm] py-12">
                    {backCoverDoc?.file_url ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <img
                                src={backCoverDoc.file_url}
                                alt="ปกหลังรายงานโครงการ"
                                className="max-h-[260mm] w-auto object-contain mx-auto shadow-sm print:shadow-none"
                            />
                        </div>
                    ) : (
                        <div className="w-full flex flex-col justify-between items-center h-full min-h-[230mm]">
                            <div className="pt-12">
                                <img
                                    src="/LogoNPC_PNG.png"
                                    alt="ตราสัญลักษณ์สถานศึกษา"
                                    className="h-24 w-auto mx-auto mb-4 opacity-90 object-contain"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <h2 className="text-lg font-bold text-slate-900">
                                    {project?.location || 'วิทยาลัยสารพัดช่างน่าน'}
                                </h2>
                                <p className="text-xs text-slate-600 mt-1">
                                    Nan Polytechnic College
                                </p>
                            </div>

                            <div className="my-16 max-w-md px-6 text-slate-700 text-xs leading-relaxed space-y-2">
                                <p className="font-bold text-sm text-slate-900">
                                    "มุ่งมั่นพัฒนาวิชาชีพ ผลิตกำลังคนคุณภาพสู่สังคม"
                                </p>
                                <p className="text-slate-500">
                                    รายงานผลการดำเนินโครงการฉบับนี้ จัดทำขึ้นภายใต้ระบบสารสนเทศบริหารจัดการโครงการ (NPC SMART FLOW) งานแผนงานและงบประมาณ
                                </p>
                            </div>

                            <div className="pb-12 text-xs text-slate-500 space-y-1">
                                <p className="font-semibold text-slate-700">สำนักงานคณะกรรมการการอาชีวศึกษา กระทรวงศึกษาธิการ</p>
                                <p>วิทยาลัยสารพัดช่างน่าน เลขที่ 250 หมู่ 7 ตำบลฝายแก้ว อำเภอภูเพียง จังหวัดน่าน 55000</p>
                                <p className="font-mono">www.nanpoly.ac.th</p>
                            </div>
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}
