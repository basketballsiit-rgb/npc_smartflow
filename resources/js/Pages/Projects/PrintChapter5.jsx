import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';

export default function PrintChapter5({ project, survey, surveyStats }) {
    // Font size preset state: 'compact' (14px) | 'normal' (15px) | 'large' (16.5px)
    const [fontSizePreset, setFontSizePreset] = useState('normal');

    const sections = project?.chapter_5_sections || {};
    const fullContent = project?.chapter_5_content || '';

    // Standardize all numerals to Arabic (0-9)
    const toArabicNumerals = (val) => {
        if (val === null || val === undefined) return '';
        const map = { '๐':'0', '๑':'1', '๒':'2', '๓':'3', '๔':'4', '๕':'5', '๖':'6', '๗':'7', '๘':'8', '๙':'9' };
        return String(val).replace(/[๐-๙]/g, (digit) => map[digit] || digit);
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
                <title>{`รายงานผลโครงการ บทที่ 5 - ${project.title}`}</title>
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
                        margin: 1in;
                    }
                    body {
                        background: #ffffff !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-doc-container {
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        min-height: auto !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                }
            `}</style>

            {/* Non-printing Control Bar */}
            <div className="no-print max-w-4xl mx-auto mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href={route('dashboard')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                    >
                        ← กลับหน้าศูนย์ควบคุม
                    </Link>
                    <span className="text-xs font-bold text-slate-800">
                        📄 พิมพ์รูปเล่มรายงาน บทที่ 5: สรุปผล อภิปรายผล และข้อเสนอแนะ
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                        {['compact', 'normal', 'large'].map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => setFontSizePreset(preset)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                                    fontSizePreset === preset
                                        ? 'bg-white text-purple-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {preset === 'compact' ? 'ก เล็ก' : preset === 'normal' ? 'ก ปานกลาง' : 'ก ใหญ่'}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                        <span>🖨️</span> พิมพ์เอกสาร A4 (Print)
                    </button>
                </div>
            </div>

            {/* Printable A4 Container */}
            <div className="print-doc-container font-sarabun mx-auto shadow-lg print:shadow-none border print:border-none border-slate-200">
                
                {/* Chapter Header */}
                <div className="text-center mb-8">
                    <h1 className="print-title mb-2">บทที่ 5</h1>
                    <h2 className="print-heading">สรุปผล อภิปรายผล และข้อเสนอแนะ</h2>
                </div>

                {/* Introductory Lead */}
                <div className="thai-content thai-indent mb-6">
                    {toArabicNumerals(sections.intro || (
                        `การดำเนินงานโครงการ "${project.title}" ประจำปีการศึกษา ${toArabicNumerals(project.academic_year)} ของ${project.location || 'วิทยาลัยสารพัดช่างน่าน'} ได้ดำเนินการเสร็จสิ้นสมบูรณ์ตามวัตถุประสงค์และกรอบแผนงานที่กำหนด คณะผู้รับผิดชอบโครงการจึงได้ทำการประมวลผล สรุปผลการดำเนินงาน อภิปรายผล พร้อมทั้งรวบรวมปัญหา อุปสรรค และข้อเสนอแนะในการพัฒนาปรับปรุงสำหรับการดำเนินงานในโอกาสต่อไป โดยมีรายละเอียดดังนี้`
                    ))}
                </div>

                {/* 5.1 สรุปผลการดำเนินโครงการ */}
                <div className="mb-6 space-y-2">
                    <h3 className="print-heading font-bold">
                        5.1 สรุปผลการดำเนินโครงการ
                    </h3>
                    <div className="thai-content thai-indent whitespace-pre-line leading-relaxed">
                        {toArabicNumerals(sections.section_5_1 || (
                            `การดำเนินงานโครงการ "${project.title}" สามารถสรุปผลการดำเนินงานตามวัตถุประสงค์ ตัวชี้วัด และการใช้จ่ายงบประมาณได้อย่างครบถ้วนสมบูรณ์`
                        ))}
                    </div>
                </div>

                {/* 5.2 การอภิปรายผลการดำเนินโครงการ */}
                <div className="mb-6 space-y-2">
                    <h3 className="print-heading font-bold">
                        5.2 การอภิปรายผลการดำเนินโครงการ
                    </h3>
                    <div className="thai-content thai-indent whitespace-pre-line leading-relaxed">
                        {toArabicNumerals(sections.section_5_2 || (
                            `จากผลการดำเนินโครงการ "${project.title}" สามารถนำมาอภิปรายผลตามกรอบวัตถุประสงค์และทฤษฎีที่เกี่ยวข้องในบทที่ 2 ได้อย่างสอดคล้อง`
                        ))}
                    </div>
                </div>

                {/* 5.3 ปัญหา อุปสรรค และแนวทางแก้ไข */}
                <div className="mb-6 space-y-2">
                    <h3 className="print-heading font-bold">
                        5.3 ปัญหา อุปสรรค และแนวทางแก้ไข
                    </h3>
                    <div className="thai-content thai-indent whitespace-pre-line leading-relaxed">
                        {toArabicNumerals(sections.section_5_3 || (
                            `จากการติดตามและประเมินผลการจัดกิจกรรม พบปัญหา อุปสรรค และมีแนวทางแก้ไขที่คณะผู้ดำเนินงานได้แก้ไขปัญหาอย่างมีประสิทธิภาพ`
                        ))}
                    </div>
                </div>

                {/* 5.4 ข้อเสนอแนะ */}
                <div className="mb-8 space-y-2">
                    <h3 className="print-heading font-bold">
                        5.4 ข้อเสนอแนะ
                    </h3>
                    <div className="thai-content thai-indent whitespace-pre-line leading-relaxed">
                        {toArabicNumerals(sections.section_5_4 || (
                            `ข้อเสนอแนะในการนำผลไปใช้ประโยชน์ และข้อเสนอแนะสำหรับการจัดทำโครงการครั้งต่อไป`
                        ))}
                    </div>
                </div>

                {/* Signature Block */}
                <div className="mt-12 pt-6 flex justify-end page-break-inside-avoid">
                    <div className="text-center w-72 space-y-1">
                        <p className="text-xs">ลงชื่อ........................................................</p>
                        <p className="text-xs font-bold">({project.user?.name || project.responsible_person || 'ผู้รับผิดชอบโครงการ'})</p>
                        <p className="text-xs text-slate-600">ผู้รับผิดชอบโครงการ</p>
                        <p className="text-xs text-slate-500 mt-2">วันที่ ..... เดือน .................... พ.ศ. ........</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
