import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';

export default function PrintChapter2({ project }) {
    const [fontSizePreset, setFontSizePreset] = useState('normal');

    const sections = project?.chapter_2_sections || {};
    const fullContent = project?.chapter_2_content || '';

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100 py-6 print:py-0 print:bg-white text-slate-900 font-serif">
            <Head title={`พิมพ์บทที่ ๒ - ${project.title}`} />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');

                :root {
                    --doc-font-size: ${fontSizePreset === 'compact' ? '14px' : fontSizePreset === 'large' ? '16.5px' : '15px'};
                    --doc-line-height: 1.65;
                }

                .sarabun-font {
                    font-family: 'TH Sarabun PSK', 'TH Sarabun Chula', 'THSarabunNew', 'Sarabun', sans-serif !important;
                }

                .print-doc-container {
                    font-size: var(--doc-font-size) !important;
                    line-height: var(--doc-line-height) !important;
                    box-sizing: border-box;
                }

                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 1in 0.8in 1in 1in !important;
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
                }
            `}</style>

            {/* Top Action Bar (Hidden when printing) */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden font-sans">
                <div>
                    <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span>📖</span> รายงานผลโครงการ: บทที่ ๒ เอกสารและงานวิจัยที่เกี่ยวข้อง
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        จัดรูปแบบหัวข้อ ๒.๑, ๒.๒ (ยุทธศาสตร์ สอศ.), ๒.๓ (งานวิจัยพร้อมแหล่งอ้างอิง) และบรรณานุกรมท้ายบท
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Font Size Preset Switcher */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                        <button
                            type="button"
                            onClick={() => setFontSizePreset('compact')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                                fontSizePreset === 'compact' ? 'bg-white shadow-xs text-purple-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            ก เล็ก
                        </button>
                        <button
                            type="button"
                            onClick={() => setFontSizePreset('normal')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                                fontSizePreset === 'normal' ? 'bg-white shadow-xs text-purple-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            ก ปกติ
                        </button>
                        <button
                            type="button"
                            onClick={() => setFontSizePreset('large')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                                fontSizePreset === 'large' ? 'bg-white shadow-xs text-purple-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            ก ใหญ่
                        </button>
                    </div>

                    <Link
                        href={route('projects.show', project.id)}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                        ← กลับหน้าโครงการ
                    </Link>
                    <button
                        onClick={handlePrint}
                        className="rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-800 hover:to-indigo-800 transition flex items-center gap-1.5"
                    >
                        <span>🖨️</span> สั่งพิมพ์ / บันทึกเป็น PDF
                    </button>
                </div>
            </div>

            {/* Document Container (A4 Portrait simulation on screen, 1in margins in print) */}
            <div className="print-doc-container sarabun-font max-w-4xl mx-auto bg-white p-12 md:p-16 shadow-lg print:shadow-none border border-slate-200 print:border-none rounded-2xl print:rounded-none">
                
                {/* Chapter Heading */}
                <div className="text-center mb-8">
                    <h2 className="text-xl md:text-2xl font-bold tracking-wide text-black mb-1">บทที่ ๒</h2>
                    <h1 className="text-xl md:text-2xl font-bold tracking-wide text-black">เอกสารและงานวิจัยที่เกี่ยวข้อง</h1>
                    <p className="text-sm md:text-base font-semibold text-slate-700 print:text-black mt-2">
                        โครงการ: {project.title}
                    </p>
                </div>

                {/* Content Render */}
                {sections && (sections.section_2_1 || sections.section_2_2 || sections.section_2_3) ? (
                    <div className="space-y-6 text-justify text-black leading-relaxed">
                        
                        {/* Intro */}
                        {sections.intro && (
                            <div className="whitespace-pre-line indent-8">
                                {sections.intro}
                            </div>
                        )}

                        {/* 2.1 */}
                        {sections.section_2_1 && (
                            <div className="pt-4">
                                <h3 className="text-lg md:text-xl font-bold mb-3">
                                    ๒.๑ แนวคิด หลักการ และทฤษฎีที่เกี่ยวข้อง
                                </h3>
                                <div className="whitespace-pre-line pl-4 space-y-3">
                                    {sections.section_2_1.replace(/^๒\.๑\s*แนวคิด[^\n]*\n+/u, '')}
                                </div>
                            </div>
                        )}

                        {/* 2.2 OVEC Strategies & Policies */}
                        {sections.section_2_2 && (
                            <div className="pt-4 print-break-inside-avoid">
                                <h3 className="text-lg md:text-xl font-bold mb-3">
                                    ๒.๒ ยุทธศาสตร์และนโยบายจุดเน้นของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ที่เกี่ยวข้อง
                                </h3>
                                <div className="whitespace-pre-line pl-4 space-y-3">
                                    {sections.section_2_2.replace(/^๒\.๒\s*ยุทธศาสตร์[^\n]*\n+/u, '')}
                                </div>
                            </div>
                        )}

                        {/* 2.3 Related Literature & Research */}
                        {sections.section_2_3 && (
                            <div className="pt-4 print-break-inside-avoid">
                                <h3 className="text-lg md:text-xl font-bold mb-3">
                                    ๒.๓ เอกสารและงานวิจัยที่เกี่ยวข้อง
                                </h3>
                                <div className="whitespace-pre-line pl-4 space-y-3">
                                    {sections.section_2_3.replace(/^๒\.๓\s*เอกสาร[^\n]*\n+/u, '')}
                                </div>
                            </div>
                        )}

                        {/* References */}
                        {sections.references && (
                            <div className="pt-8 border-t border-slate-300 print:border-black print-break-inside-avoid">
                                <h3 className="text-lg md:text-xl font-bold mb-4 text-center">
                                    เอกสารอ้างอิง
                                </h3>
                                <div className="whitespace-pre-line pl-8 -indent-8 space-y-2 text-sm md:text-base leading-relaxed">
                                    {sections.references.replace(/^เอกสารอ้างอิง\s*\n+/u, '')}
                                </div>
                            </div>
                        )}
                    </div>
                ) : fullContent ? (
                    <div className="whitespace-pre-line text-justify text-black leading-relaxed space-y-4">
                        {fullContent}
                    </div>
                ) : (
                    <div className="p-8 bg-amber-50 rounded-2xl border border-amber-200 text-center font-sans">
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
