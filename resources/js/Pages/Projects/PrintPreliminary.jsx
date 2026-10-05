import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';

export default function PrintPreliminary({ project }) {
    const [fontSizePreset, setFontSizePreset] = useState('normal');

    const prelim = project?.preliminary_sections || {};
    const executiveSummary = prelim.executive_summary || '';
    const preface = prelim.preface || '';
    const signOffName = prelim.sign_off_name || `คณะผู้จัดทำ\nโครงการ "${project?.title || ''}"`;
    const signOffDate = prelim.sign_off_date || 'ตุลาคม 2569';
    const tocItems = prelim.toc_items || [];
    const tableItems = prelim.table_items || [];
    const figureItems = prelim.figure_items || [];

    const handlePrint = () => {
        window.print();
    };

    const fontStyles = {
        compact: { docSize: '14px', lineHeight: '1.6', titleSize: '20px', headingSize: '16px' },
        normal: { docSize: '15px', lineHeight: '1.68', titleSize: '22px', headingSize: '17px' },
        large: { docSize: '16.5px', lineHeight: '1.75', titleSize: '24px', headingSize: '18px' },
    }[fontSizePreset];

    // Export to Word
    const exportToWord = () => {
        const content = document.getElementById('printable-preliminary-doc');
        if (!content) return;

        const clone = content.cloneNode(true);

        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office'
                  xmlns:w='urn:schemas-microsoft-com:office:word'
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>ส่วนนำ - ${project?.title || 'โครงการ'}</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 3.81cm 2.54cm 2.54cm 3.81cm;
                    }
                    body {
                        font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', 'Angsana New', sans-serif;
                        font-size: 16pt;
                        line-height: 1.5;
                        color: #000;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: bold; }
                    .indent { text-indent: 1.5cm; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15pt; }
                    th, td { padding: 4pt 6pt; font-size: 16pt; }
                    .dots { border-bottom: 1px dotted #666; }
                </style>
            </head>
            <body>
                ${clone.innerHTML}
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ส่วนนำ_บทสรุป_คำนำ_สารบัญ_${project?.code || project?.id}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 font-sans print:bg-white print:text-black print:min-h-0">
            <Head title={`ส่วนนำ (คำนำ สารบัญ บทสรุปผู้บริหาร) - ${project?.title || 'โครงการ'}`} />

            {/* Print Header Controls (Hidden on Print) */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm print:hidden">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('dashboard', { tab: 'proposals', chapter: 'preliminary' })}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                        >
                            <span>←</span>
                            <span>กลับหน้าส่วนนำ</span>
                        </Link>
                        <div>
                            <h1 className="text-base font-black text-slate-900 leading-tight">
                                เอกสารส่วนนำ (คำนำ สารบัญ บทสรุปผู้บริหาร)
                            </h1>
                            <p className="text-xs text-slate-500">
                                {project?.code ? `[${project.code}] ` : ''}{project?.title}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Font size preset switcher */}
                        <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs font-bold">
                            <span className="px-2 text-slate-500 text-[11px]">ขนาดอักษร:</span>
                            <button
                                type="button"
                                onClick={() => setFontSizePreset('compact')}
                                className={`px-2.5 py-1 rounded-lg transition ${fontSizePreset === 'compact' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                กะทัดรัด
                            </button>
                            <button
                                type="button"
                                onClick={() => setFontSizePreset('normal')}
                                className={`px-2.5 py-1 rounded-lg transition ${fontSizePreset === 'normal' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                มาตรฐาน
                            </button>
                            <button
                                type="button"
                                onClick={() => setFontSizePreset('large')}
                                className={`px-2.5 py-1 rounded-lg transition ${fontSizePreset === 'large' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                ตัวใหญ่
                            </button>
                        </div>

                        {/* Export to Word Button */}
                        <button
                            type="button"
                            onClick={exportToWord}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                        >
                            <span>📄</span>
                            <span>ส่งออก Word (.doc)</span>
                        </button>

                        {/* Print Button */}
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition flex items-center gap-2 transform active:scale-95"
                        >
                            <span>🖨️</span>
                            <span>พิมพ์เอกสาร (Print A4)</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Document Content */}
            <main className="max-w-[210mm] mx-auto my-8 print:my-0 print:max-w-none print:w-full">
                <article
                    id="printable-preliminary-doc"
                    className="bg-white rounded-3xl p-12 md:p-16 shadow-lg border border-slate-200 text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0"
                    style={{
                        fontFamily: "'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', 'Angsana New', sans-serif",
                        fontSize: fontStyles.docSize,
                        lineHeight: fontStyles.lineHeight,
                    }}
                >
                    {/* ========================================================
                        PAGE 1: บทสรุปผู้บริหาร (เลขหน้า ก)
                       ======================================================== */}
                    <section className="min-h-[297mm] print:min-h-0 flex flex-col justify-between">
                        <div>
                            {/* Page Header (ก) */}
                            <div className="text-right font-bold text-slate-500 mb-6 text-sm">
                                หน้า ก
                            </div>

                            <div className="text-center mb-8">
                                <h1 className="font-black text-slate-900 tracking-tight" style={{ fontSize: fontStyles.titleSize }}>
                                    บทสรุปผู้บริหาร
                                </h1>
                                <p className="font-bold text-slate-700 mt-1" style={{ fontSize: fontStyles.headingSize }}>
                                    โครงการ {project?.title}
                                </p>
                            </div>

                            <div className="space-y-4 text-justify whitespace-pre-line leading-relaxed">
                                {executiveSummary ? (
                                    executiveSummary.split('\n\n').map((paragraph, pIdx) => (
                                        <p key={pIdx} className="indent-8 text-slate-800">
                                            {paragraph.trim()}
                                        </p>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                                        ยังไม่มีเนื้อหาบทสรุปผู้บริหาร (กรุณาสร้างเนื้อหาในระบบ)
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ========================================================
                        PAGE 2: คำนำ (เลขหน้า ข)
                       ======================================================== */}
                    <div className="page-break pt-12" />
                    <section className="min-h-[297mm] print:min-h-0 flex flex-col justify-between">
                        <div>
                            {/* Page Header (ข) */}
                            <div className="text-right font-bold text-slate-500 mb-6 text-sm">
                                หน้า ข
                            </div>

                            <div className="text-center mb-8">
                                <h1 className="font-black text-slate-900 tracking-tight" style={{ fontSize: fontStyles.titleSize }}>
                                    คำนำ
                                </h1>
                            </div>

                            <div className="space-y-4 text-justify whitespace-pre-line leading-relaxed">
                                {preface ? (
                                    preface.split('\n\n').map((paragraph, pIdx) => (
                                        <p key={pIdx} className="indent-8 text-slate-800">
                                            {paragraph.trim()}
                                        </p>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                                        ยังไม่มีเนื้อหาคำนำ (กรุณาสร้างเนื้อหาในระบบ)
                                    </div>
                                )}
                            </div>

                            {/* Sign Off */}
                            <div className="mt-12 text-right pr-6 space-y-1">
                                <p className="font-bold whitespace-pre-line">{signOffName}</p>
                                <p className="text-slate-600">{signOffDate}</p>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================
                        PAGE 3: สารบัญเนื้อหา (เลขหน้า ค)
                       ======================================================== */}
                    <div className="page-break pt-12" />
                    <section className="min-h-[297mm] print:min-h-0">
                        {/* Page Header (ค) */}
                        <div className="text-right font-bold text-slate-500 mb-6 text-sm">
                            หน้า ค
                        </div>

                        <div className="text-center mb-6">
                            <h1 className="font-black text-slate-900 tracking-tight" style={{ fontSize: fontStyles.titleSize }}>
                                สารบัญ
                            </h1>
                        </div>

                        <div className="w-full">
                            <div className="flex justify-between font-bold border-b-2 border-slate-900 pb-1 mb-2">
                                <span>เรื่อง</span>
                                <span>หน้า</span>
                            </div>

                            <div className="space-y-1.5">
                                {tocItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-baseline justify-between ${item.is_bold ? 'font-bold text-slate-900 pt-1.5' : 'text-slate-800'}`}
                                    >
                                        <span className="truncate pr-4">{item.title}</span>
                                        <span className="font-mono text-right shrink-0">{item.page}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ========================================================
                        PAGE 4: สารบัญตาราง & สารบัญภาพ (เลขหน้า ง & จ)
                       ======================================================== */}
                    <div className="page-break pt-12" />
                    <section className="min-h-[297mm] print:min-h-0 space-y-10">
                        {/* สารบัญตาราง (หน้า ง) */}
                        <div>
                            <div className="text-right font-bold text-slate-500 mb-4 text-sm">
                                หน้า ง
                            </div>

                            <div className="text-center mb-6">
                                <h2 className="font-black text-slate-900 tracking-tight" style={{ fontSize: fontStyles.titleSize }}>
                                    สารบัญตาราง
                                </h2>
                            </div>

                            <div className="w-full">
                                <div className="flex justify-between font-bold border-b-2 border-slate-900 pb-1 mb-2">
                                    <span>ตารางที่</span>
                                    <span>หน้า</span>
                                </div>

                                <div className="space-y-1.5">
                                    {tableItems.map((t, idx) => (
                                        <div key={idx} className="flex items-baseline justify-between text-slate-800">
                                            <span className="pr-4">{t.title}</span>
                                            <span className="font-mono text-right shrink-0">{t.page}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* สารบัญภาพ (หน้า จ) */}
                        <div className="pt-8 border-t-2 border-dashed border-slate-200 print:border-none print:pt-0">
                            <div className="text-right font-bold text-slate-500 mb-4 text-sm">
                                หน้า จ
                            </div>

                            <div className="text-center mb-6">
                                <h2 className="font-black text-slate-900 tracking-tight" style={{ fontSize: fontStyles.titleSize }}>
                                    สารบัญภาพ
                                </h2>
                            </div>

                            <div className="w-full">
                                <div className="flex justify-between font-bold border-b-2 border-slate-900 pb-1 mb-2">
                                    <span>ภาพที่</span>
                                    <span>หน้า</span>
                                </div>

                                <div className="space-y-1.5">
                                    {figureItems.map((f, idx) => (
                                        <div key={idx} className="flex items-baseline justify-between text-slate-800">
                                            <span className="pr-4">{f.title}</span>
                                            <span className="font-mono text-right shrink-0">{f.page}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </article>
            </main>
        </div>
    );
}
