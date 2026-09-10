import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';

export default function PrintChapter2({ project }) {
    // Font size preset state: 'compact' (14px) | 'normal' (15px) | 'large' (16.5px) - Matches Print.jsx 1:1
    const [fontSizePreset, setFontSizePreset] = useState('normal');

    const sections = project?.chapter_2_sections || {};
    const fullContent = project?.chapter_2_content || '';

    // Convert Arabic digits to Thai digits
    const toThaiNumerals = (val) => {
        if (val === null || val === undefined) return '';
        const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        return String(val).replace(/[0-9]/g, (digit) => thaiDigits[parseInt(digit, 10)]);
    };

    const handlePrint = () => {
        window.print();
    };

    const fontStyles = {
        compact: { docSize: '14px', lineHeight: '1.45', titleSize: '18px', headingSize: '15px' },
        normal: { docSize: '15px', lineHeight: '1.5', titleSize: '20px', headingSize: '16px' },
        large: { docSize: '16.5px', lineHeight: '1.55', titleSize: '22px', headingSize: '17.5px' },
    }[fontSizePreset];

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900">
            <Head>
                <title>{`รายงานผลโครงการ บทที่ ๒ - ${project.title}`}</title>
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
                    text-indent: 2.5cm !important;
                }

                .thai-hanging-indent {
                    padding-left: 1.5cm !important;
                    text-indent: -1.5cm !important;
                }

                .print-doc-container {
                    font-size: var(--doc-font-size) !important;
                    line-height: var(--doc-line-height) !important;
                    box-sizing: border-box;
                }

                .print-title {
                    font-size: var(--title-font-size) !important;
                    font-weight: bold !important;
                }

                .print-heading {
                    font-size: var(--heading-font-size) !important;
                    font-weight: bold !important;
                }

                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 1in !important;
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
                        <span>📖</span> รายงานผลโครงการ: บทที่ ๒ เอกสารและงานวิจัยที่เกี่ยวข้อง
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        ระยะขอบทุกด้าน ๑ นิ้ว | ฟอนต์ TH Sarabun PSK ขนาดมาตรฐาน 1:1 กับแบบเสนอโครงการ
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
                        title="ดูแบบเสนอโครงการ / บทที่ ๑"
                    >
                        📄 พิมพ์แบบเสนอ (บทที่ ๑)
                    </a>

                    <Link
                        href={route('projects.show', project.id)}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                        ← กลับหน้าโครงการ
                    </Link>

                    <button
                        onClick={handlePrint}
                        className="rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-800 hover:to-indigo-800 transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <span>🖨️</span> สั่งพิมพ์ / บันทึกเป็น PDF
                    </button>
                </div>
            </div>

            {/* Document Container (A4 Portrait simulation on screen, 1in margins in print - Identical to Print.jsx) */}
            <div className="print-doc-container font-sarabun max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-md rounded-2xl print:p-0 print:m-0 print:shadow-none print:border-none print:rounded-none">
                
                {/* Chapter Heading */}
                <div className="text-center mb-8 pb-4 border-b border-slate-200 print:border-none">
                    <h2 className="print-title tracking-wide text-black mb-1">บทที่ ๒</h2>
                    <h1 className="print-title tracking-wide text-black">เอกสารและงานวิจัยที่เกี่ยวข้อง</h1>
                    <p className="text-sm md:text-base font-semibold text-slate-700 print:text-black mt-2">
                        โครงการ: {project.title}
                    </p>
                </div>

                {/* Content Render */}
                {sections && (sections.section_2_1 || sections.section_2_2 || sections.section_2_3) ? (
                    <div className="space-y-6 text-justify text-black leading-relaxed">
                        
                        {/* Intro */}
                        {sections.intro && (
                            <div className="thai-indent whitespace-pre-line text-justify leading-relaxed">
                                {sections.intro}
                            </div>
                        )}

                        {/* 2.1 */}
                        {sections.section_2_1 && (
                            <div className="pt-2">
                                <h3 className="print-heading mb-2 text-black">
                                    ๒.๑ แนวคิด หลักการ และทฤษฎีที่เกี่ยวข้อง
                                </h3>
                                <div className="whitespace-pre-line thai-indent text-justify leading-relaxed space-y-2">
                                    {sections.section_2_1.replace(/^[๒2]\.[๑1]\s*แนวคิด[^\n]*\n+/u, '')}
                                </div>
                            </div>
                        )}

                        {/* 2.2 OVEC Strategies & Policies */}
                        {sections.section_2_2 && (
                            <div className="pt-4">
                                <h3 className="print-heading mb-2 text-black">
                                    ๒.๒ ยุทธศาสตร์และนโยบายจุดเน้นของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ที่เกี่ยวข้อง
                                </h3>
                                <div className="whitespace-pre-line thai-indent text-justify leading-relaxed space-y-2">
                                    {sections.section_2_2.replace(/^[๒2]\.[๒2]\s*ยุทธศาสตร์[^\n]*\n+/u, '')}
                                </div>
                            </div>
                        )}

                        {/* 2.3 Related Literature & Research */}
                        {sections.section_2_3 && (
                            <div className="pt-4">
                                <h3 className="print-heading mb-2 text-black">
                                    ๒.๓ เอกสารและงานวิจัยที่เกี่ยวข้อง
                                </h3>
                                <div className="whitespace-pre-line thai-indent text-justify leading-relaxed space-y-2">
                                    {sections.section_2_3.replace(/^[๒2]\.[๓3]\s*เอกสาร[^\n]*\n+/u, '')}
                                </div>
                            </div>
                        )}

                        {/* References */}
                        {sections.references && (
                            <div className="pt-8 border-t border-slate-300 print:border-black print-break-inside-avoid">
                                <h3 className="print-heading mb-4 text-center text-black">
                                    เอกสารอ้างอิง
                                </h3>
                                <div className="space-y-3 leading-relaxed">
                                    {sections.references
                                        .replace(/^เอกสารอ้างอิง\s*\n+/u, '')
                                        .split(/\n+/)
                                        .filter(line => line.trim().length > 0)
                                        .map((refLine, idx) => (
                                            <p key={idx} className="thai-hanging-indent text-justify">
                                                {refLine.trim()}
                                            </p>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                ) : fullContent ? (
                    <div className="whitespace-pre-line text-justify text-black leading-relaxed space-y-4 thai-indent">
                        {fullContent}
                    </div>
                ) : (
                    <div className="p-8 bg-amber-50 rounded-2xl border border-amber-200 text-center font-sans print:hidden">
                        <p className="text-amber-800 font-bold">ยังไม่มีเนื้อหาบทที่ ๒ ในระบบ</p>
                        <p className="text-xs text-amber-600 mt-1">
                            กรุณากลับไปที่หน้ารายละเอียดโครงการ แท็บที่ ๔ (Act) และกดปุ่ม "✨ ให้ AI ช่วยค้นคว้าและร่างเนื้อหาบทที่ ๒"
                        </p>
                        <Link
                            href={route('projects.show', project.id)}
                            className="mt-4 inline-block px-4 py-2 bg-purple-700 text-white font-bold text-xs rounded-xl shadow"
                        >
                            กลับไปสร้างเนื้อหาบทที่ ๒
                        </Link>
                    </div>
                )}

            </div>
        </div>
    );
}
