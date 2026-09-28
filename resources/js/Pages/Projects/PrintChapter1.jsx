import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';

export default function PrintChapter1({ project }) {
    const [fontSizePreset, setFontSizePreset] = useState('normal');

    const sections = project?.chapter_1_sections || {};
    const fullContent = project?.chapter_1_content || '';

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

    // Helper to format objectives array
    const rawObjectives = Array.isArray(project.objectives) ? project.objectives : (project.objectives ? [project.objectives] : []);
    const rawBenefits = Array.isArray(project.expected_benefits) ? project.expected_benefits : (project.expected_benefits ? [project.expected_benefits] : []);
    const rawTargets = Array.isArray(project.targets) ? project.targets : (project.targets ? [project.targets] : []);
    const rawActivities = Array.isArray(project.activities) ? project.activities : [];

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900">
            <Head>
                <title>{`รายงานผลโครงการ บทที่ ๑ - ${project.title}`}</title>
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

            {/* Top Action Bar (Hidden when printing) */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden font-sans">
                <div>
                    <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span>📘</span> รายงานผลโครงการ: บทที่ ๑ บทนำ (Introduction)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        ระยะขอบทุกด้าน ๑ นิ้ว | ฟอนต์ TH Sarabun PSK ขนาดมาตรฐาน 1:1 กับรายงาน ๕ บท
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
                        onClick={handlePrint}
                        className="rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-800 hover:to-indigo-800 transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <span>🖨️</span> สั่งพิมพ์ / บันทึกเป็น PDF
                    </button>
                </div>
            </div>

            {/* Document Container */}
            <div className="print-doc-container font-sarabun max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-md rounded-2xl print:p-0 print:m-0 print:shadow-none print:border-none print:rounded-none">
                
                {/* Chapter Heading */}
                <div className="text-center mb-8 pb-4 border-b border-slate-200 print:border-none">
                    <h2 className="print-title tracking-wide text-black mb-1">บทที่ ๑</h2>
                    <h1 className="print-title tracking-wide text-black">บทนำ</h1>
                    <p className="text-sm md:text-base font-semibold text-slate-700 print:text-black mt-2">
                        โครงการ: {project.title}
                    </p>
                    <p className="text-xs md:text-sm text-slate-500 print:text-black">
                        ประจำปีงบประมาณ พ.ศ. {toThaiNumerals(project.academic_year || new Date().getFullYear() + 543)}
                    </p>
                </div>

                {/* If full custom content is provided, display it directly */}
                {fullContent ? (
                    <div className="space-y-6 text-black whitespace-pre-wrap leading-relaxed text-justify">
                        {fullContent}
                    </div>
                ) : (
                    <div className="space-y-6 text-black leading-relaxed">
                        
                        {/* 1.1 ความเป็นมาและความสำคัญของปัญหา */}
                        <div className="print-break-inside-avoid">
                            <h3 className="print-heading text-black mb-2">
                                ๑.๑ ความเป็นมาและความสำคัญของปัญหา
                            </h3>
                            <div className="text-justify thai-indent whitespace-pre-wrap">
                                {sections.background || project.background_rationale || 'ไม่ได้ระบุความเป็นมาและความสำคัญของปัญหา'}
                            </div>
                        </div>

                        {/* 1.2 วัตถุประสงค์ของโครงการ */}
                        <div className="print-break-inside-avoid">
                            <h3 className="print-heading text-black mb-2">
                                ๑.๒ วัตถุประสงค์ของโครงการ
                            </h3>
                            <div className="space-y-1 pl-6">
                                {sections.objectives ? (
                                    <div className="whitespace-pre-wrap">{sections.objectives}</div>
                                ) : rawObjectives.length > 0 ? (
                                    rawObjectives.map((obj, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <span className="font-bold shrink-0">๑.๒.{toThaiNumerals(idx + 1)}</span>
                                            <span>{typeof obj === 'string' ? obj : obj.title || obj.name || ''}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div>ไม่ได้ระบุวัตถุประสงค์โครงการ</div>
                                )}
                            </div>
                        </div>

                        {/* 1.3 ขอบเขตของโครงการ */}
                        <div className="print-break-inside-avoid space-y-3">
                            <h3 className="print-heading text-black mb-1">
                                ๑.๓ ขอบเขตของโครงการ
                            </h3>

                            {/* 1.3.1 ประชากรและกลุ่มเป้าหมาย */}
                            <div className="pl-4">
                                <h4 className="font-bold text-black mb-1">
                                    ๑.๓.๑ ขอบเขตด้านประชากรและกลุ่มเป้าหมาย
                                </h4>
                                <div className="thai-indent whitespace-pre-wrap">
                                    {sections.scope_target || (
                                        rawTargets.length > 0
                                            ? rawTargets.map(t => typeof t === 'string' ? t : (t.description || t.title || '')).join(', ')
                                            : 'นักเรียน นักศึกษา ครู และบุคลากรทางการศึกษาที่เกี่ยวข้อง'
                                    )}
                                </div>
                            </div>

                            {/* 1.3.2 ด้านเนื้อหาและกิจกรรม */}
                            <div className="pl-4">
                                <h4 className="font-bold text-black mb-1">
                                    ๑.๓.๒ ขอบเขตด้านเนื้อหาและกิจกรรมการดำเนินงาน
                                </h4>
                                <div className="thai-indent whitespace-pre-wrap">
                                    {sections.scope_content || (
                                        rawActivities.length > 0
                                            ? rawActivities.map((a, i) => `${toThaiNumerals(i + 1)}. ${a.name || a.title || 'กิจกรรม'}`).join('\n')
                                            : 'ดำเนินงานตามกิจกรรมและขั้นตอนการดำเนินงานที่ระบุไว้ในแผนปฏิบัติการ'
                                    )}
                                </div>
                            </div>

                            {/* 1.3.3 ด้านสถานที่และระยะเวลา */}
                            <div className="pl-4">
                                <h4 className="font-bold text-black mb-1">
                                    ๑.๓.๓ ขอบเขตด้านสถานที่และระยะเวลาดำเนินการ
                                </h4>
                                <div className="thai-indent">
                                    {sections.scope_location_time || (
                                        `สถานที่ดำเนินโครงการ: ${project.location || 'วิทยาลัยสารพัดช่างน่าน'} ` +
                                        (project.start_date ? `ระยะเวลาตั้งแต่วันที่ ${toThaiNumerals(project.start_date)} ถึง ${toThaiNumerals(project.end_date || project.start_date)}` : '')
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 1.4 ตัวชี้วัดและเป้าหมายความสำเร็จ */}
                        <div className="print-break-inside-avoid">
                            <h3 className="print-heading text-black mb-2">
                                ๑.๔ ตัวชี้วัดและเป้าหมายความสำเร็จ
                            </h3>
                            <div className="space-y-2 pl-4">
                                <div>
                                    <span className="font-bold">๑.๔.๑ ตัวชี้วัดเชิงปริมาณ: </span>
                                    <span>
                                        {sections.indicators_quantitative || 
                                         (project.indicators?.quantitative || 'ผู้เข้าร่วมโครงการไม่น้อยกว่าร้อยละ ๘๐ ของกลุ่มเป้าหมาย')}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-bold">๑.๔.๒ ตัวชี้วัดเชิงคุณภาพ: </span>
                                    <span>
                                        {sections.indicators_qualitative || 
                                         (project.indicators?.qualitative || 'ผู้เข้าร่วมโครงการมีความพึงพอใจในระดับดีขึ้นไป (ค่าเฉลี่ย ๓.๕๑ ขึ้นไป)')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 1.5 ประโยชน์ที่คาดว่าจะได้รับ */}
                        <div className="print-break-inside-avoid">
                            <h3 className="print-heading text-black mb-2">
                                ๑.๕ ประโยชน์ที่คาดว่าจะได้รับ
                            </h3>
                            <div className="space-y-1 pl-6">
                                {sections.benefits || sections.expected_benefits ? (
                                    <div className="whitespace-pre-wrap">{sections.benefits || sections.expected_benefits}</div>
                                ) : rawBenefits.length > 0 ? (
                                    rawBenefits.map((b, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <span className="font-bold shrink-0">๑.๕.{toThaiNumerals(idx + 1)}</span>
                                            <span>{typeof b === 'string' ? b : b.title || b.name || ''}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div>การดำเนินงานบรรลุผลสำเร็จตามเป้าหมายและเกิดประโยชน์ต่อผู้เรียนและสถานศึกษา</div>
                                )}
                            </div>
                        </div>

                        {/* 1.6 นิยามศัพท์เฉพาะ (ถ้ามี) */}
                        {sections.definitions && (
                            <div className="print-break-inside-avoid">
                                <h3 className="print-heading text-black mb-2">
                                    ๑.๖ นิยามศัพท์เฉพาะ
                                </h3>
                                <div className="text-justify thai-indent whitespace-pre-wrap">
                                    {sections.definitions}
                                </div>
                            </div>
                        )}

                    </div>
                )}

            </div>
        </div>
    );
}
