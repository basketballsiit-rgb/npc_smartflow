import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';

export default function PrintChapter4({ project, survey, surveyStats }) {
    // Font size preset state: 'compact' (14px) | 'normal' (15px) | 'large' (16.5px)
    const [fontSizePreset, setFontSizePreset] = useState('normal');

    const sections = project?.chapter_4_sections || {};
    const fullContent = project?.chapter_4_content || '';

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

    const exportToWord = (filename = 'รายงานผลโครงการ_บทที่_4') => {
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
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        margin-top: 12pt;
                        margin-bottom: 12pt;
                        font-size: 14pt;
                    }
                    th, td {
                        border: 1px solid #333333;
                        padding: 5pt;
                        vertical-align: top;
                    }
                    th {
                        background-color: #f2f2f2;
                        font-weight: bold;
                        text-align: center;
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

    const questionsStats = surveyStats?.questionsStats || [];
    const dimensionStats = surveyStats?.dimensionStats || {};
    const demographicStats = surveyStats?.demographicStats || {};
    const chapter1Comparison = surveyStats?.chapter1Comparison || null;
    const totalResponses = surveyStats?.totalResponses || 0;

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900">
            <Head>
                <title>{`รายงานผลโครงการ บทที่ 4 - ${project.title}`}</title>
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
                        📄 พิมพ์รูปเล่มรายงาน บทที่ 4: ผลการดำเนินงานโครงการ
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
                        onClick={() => exportToWord(`รายงานผลโครงการ_บทที่_4_${project.title || ''}`)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        title="ดาวน์โหลดเนื้อหาบทที่ 4 เป็นไฟล์ Microsoft Word (.doc)"
                    >
                        <span>📥</span> ดาวน์โหลด Word (.doc)
                    </button>

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
                    <h1 className="print-title mb-2">บทที่ 4</h1>
                    <h2 className="print-heading">ผลการดำเนินงานโครงการ</h2>
                </div>

                {/* Introductory Lead */}
                <div className="thai-content thai-indent mb-6">
                    {toArabicNumerals(`การดำเนินงานโครงการ "${project.title}" ประจำปีการศึกษา ${toArabicNumerals(project.academic_year)} ของ${project.location || 'วิทยาลัยสารพัดช่างน่าน'} ได้ดำเนินการเสร็จสิ้นเรียบร้อยตามวัตถุประสงค์และกรอบแผนงานที่กำหนด คณะทำงานขอเสนอรายงานผลการวิเคราะห์ข้อมูลและผลสัมฤทธิ์ของการดำเนินโครงการตามวงจรบริหารงานคุณภาพ PDCA ดังมีรายละเอียดตามลำดับต่อไปนี้`)}
                </div>

                {/* 4.1 ผลการวิเคราะห์ข้อมูลทั่วไป */}
                <div className="mb-6 space-y-3">
                    <h3 className="print-heading font-bold">
                        4.1 ผลการวิเคราะห์ข้อมูลทั่วไปของผู้ตอบแบบประเมิน
                    </h3>
                    <div className="thai-content thai-indent whitespace-pre-line leading-relaxed">
                        {toArabicNumerals(sections.section_4_1 || (
                            `การนำเสนอข้อมูลทั่วไปของผู้ตอบแบบประเมินความพึงพอใจโครงการ "${project.title}" ได้ดำเนินการรวบรวมข้อมูลจากกลุ่มตัวอย่างและผู้เข้าร่วมโครงการทั้งหมดจำนวน ${toArabicNumerals(totalResponses)} คน โดยจำแนกตามเพศ ระดับการศึกษา และสถานะของผู้ตอบแบบประเมิน ดังแสดงในตารางที่ 4.0`
                        ))}
                    </div>

                    {/* Table 4.0 Demographics */}
                    {totalResponses > 0 && demographicStats && (
                        <div className="my-4">
                            <p className="text-center font-bold text-xs mb-2">
                                ตารางที่ 4.0 จำนวนและร้อยละของข้อมูลทั่วไปของผู้ตอบแบบประเมิน (N = {toArabicNumerals(totalResponses)})
                            </p>
                            <table className="w-full text-xs border-collapse border border-slate-800">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-900 border-b border-slate-800 font-bold">
                                        <th className="border border-slate-800 py-1.5 px-3 text-left w-1/2">ข้อมูลทั่วไป (Demographic Profile)</th>
                                        <th className="border border-slate-800 py-1.5 px-3 text-center w-1/4">จำนวน (คน)</th>
                                        <th className="border border-slate-800 py-1.5 px-3 text-center w-1/4">ร้อยละ (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-slate-50 font-bold border border-slate-800">
                                        <td colSpan={3} className="py-1 px-3 border border-slate-800">1. เพศ (Gender)</td>
                                    </tr>
                                    {demographicStats.gender?.map(g => (
                                        <tr key={g.key} className="border border-slate-800">
                                            <td className="py-1 px-3 pl-8 border border-slate-800">{g.label}</td>
                                            <td className="py-1 px-3 text-center border border-slate-800">{toArabicNumerals(g.count)}</td>
                                            <td className="py-1 px-3 text-center border border-slate-800">{toArabicNumerals(Number(g.percentage || 0).toFixed(1))}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50 font-bold border border-slate-800">
                                        <td colSpan={3} className="py-1 px-3 border border-slate-800">2. ระดับการศึกษา (Education Level)</td>
                                    </tr>
                                    {demographicStats.education_level?.map(edu => (
                                        <tr key={edu.key} className="border border-slate-800">
                                            <td className="py-1 px-3 pl-8 border border-slate-800">{edu.label}</td>
                                            <td className="py-1 px-3 text-center border border-slate-800">{toArabicNumerals(edu.count)}</td>
                                            <td className="py-1 px-3 text-center border border-slate-800">{toArabicNumerals(Number(edu.percentage || 0).toFixed(1))}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50 font-bold border border-slate-800">
                                        <td colSpan={3} className="py-1 px-3 border border-slate-800">3. สถานะของผู้ตอบแบบประเมิน (Respondent Status)</td>
                                    </tr>
                                    {demographicStats.respondent_type?.map(rt => (
                                        <tr key={rt.key} className="border border-slate-800">
                                            <td className="py-1 px-3 pl-8 border border-slate-800">{rt.label}</td>
                                            <td className="py-1 px-3 text-center border border-slate-800">{toArabicNumerals(rt.count)}</td>
                                            <td className="py-1 px-3 text-center border border-slate-800">{toArabicNumerals(Number(rt.percentage || 0).toFixed(1))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 4.2 ผลการดำเนินงานตามตัวชี้วัดเชิงปริมาณ */}
                <div className="mb-6 space-y-3">
                    <h3 className="print-heading font-bold">
                        4.2 ผลการดำเนินงานตามตัวชี้วัดความสำเร็จเชิงปริมาณ
                    </h3>
                    <div className="thai-content thai-indent whitespace-pre-line leading-relaxed">
                        {toArabicNumerals(sections.section_4_2 || (
                            `โครงการได้กำหนดเป้าหมายเชิงปริมาณในบทที่ 1 โดยมุ่งเน้นให้กลุ่มเป้าหมายเข้าร่วมกิจกรรมไม่น้อยกว่าที่กำหนด จากผลการดำเนินงานปรากฏว่ามีผู้เข้าร่วมกิจกรรมทั้งสิ้น ${toArabicNumerals(totalResponses)} คน คิดเป็นร้อยละ 100.0 ซึ่งถือว่าบรรลุเป้าหมายเชิงปริมาณตามแผนงานที่กำหนดไว้อย่างครบถ้วน`
                        ))}
                    </div>
                </div>

                {/* 4.3 ผลการประเมินความพึงพอใจเชิงคุณภาพ */}
                <div className="mb-6 space-y-3">
                    <h3 className="print-heading font-bold">
                        4.3 ผลการประเมินความพึงพอใจเชิงคุณภาพต่อการดำเนินโครงการ
                    </h3>
                    <div className="thai-content thai-indent whitespace-pre-line leading-relaxed">
                        {toArabicNumerals(sections.section_4_3 || (
                            `ผลการวิเคราะห์ระดับความพึงพอใจของผู้เข้าร่วมโครงการที่มีต่อโครงการ "${project.title}" จำแนกตามกรอบการประเมิน 4 ด้าน และภาพรวมทั้งโครงการตามเกณฑ์ของ Best (1977) พบว่า ในภาพรวมผู้เข้าร่วมโครงการมีความพึงพอใจอยู่ในระดับ${surveyStats?.overallLevel || 'มากที่สุด'} (X̄ = ${toArabicNumerals(Number(surveyStats?.overallMean || 0).toFixed(2))}, S.D. = ${toArabicNumerals(Number(surveyStats?.overallSd || 0).toFixed(2))}) ดังแสดงในตารางที่ 4.1`
                        ))}
                    </div>

                    {/* Table 4.1 Satisfaction Table */}
                    {questionsStats.length > 0 && (
                        <div className="my-4">
                            <p className="text-center font-bold text-xs mb-2">
                                ตารางที่ 4.1 ค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน และระดับความพึงพอใจต่อการดำเนินโครงการ (จำแนกรายด้าน 4 ด้าน)
                            </p>
                            <table className="w-full text-xs border-collapse border border-slate-800">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-900 border-b border-slate-800 font-bold">
                                        <th className="border border-slate-800 py-1.5 px-2 text-center w-10">ที่</th>
                                        <th className="border border-slate-800 py-1.5 px-3 text-left">รายการประเมิน</th>
                                        <th className="border border-slate-800 py-1.5 px-2 text-center w-16">ค่าเฉลี่ย (x̄)</th>
                                        <th className="border border-slate-800 py-1.5 px-2 text-center w-16">S.D.</th>
                                        <th className="border border-slate-800 py-1.5 px-3 text-center w-28">ระดับความพึงพอใจ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4].map((dimNum) => {
                                        const dimQuestions = questionsStats.filter(q => q.dimension === dimNum);
                                        const dimSummary = dimensionStats?.[dimNum];
                                        if (dimQuestions.length === 0) return null;

                                        return (
                                            <React.Fragment key={dimNum}>
                                                <tr className="bg-slate-100/70 font-bold border border-slate-800">
                                                    <td colSpan={5} className="py-1 px-3 border border-slate-800">
                                                        {dimSummary?.title ? toArabicNumerals(dimSummary.title) : `ด้านที่ ${dimNum}`}
                                                    </td>
                                                </tr>
                                                {dimQuestions.map((q, idx) => (
                                                    <tr key={q.id || idx} className="border border-slate-800">
                                                        <td className="py-1 px-2 text-center border border-slate-800 font-bold">
                                                            {toArabicNumerals(q.id || idx + 1)}
                                                        </td>
                                                        <td className="py-1 px-3 pl-6 border border-slate-800">
                                                            {toArabicNumerals(q.question)}
                                                        </td>
                                                        <td className="py-1 px-2 text-center border border-slate-800 font-bold">
                                                            {toArabicNumerals(Number(q.mean || 0).toFixed(2))}
                                                        </td>
                                                        <td className="py-1 px-2 text-center border border-slate-800">
                                                            {toArabicNumerals(Number(q.sd || 0).toFixed(2))}
                                                        </td>
                                                        <td className="py-1 px-3 text-center border border-slate-800">
                                                            {q.level || 'มากที่สุด'}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {dimSummary && (
                                                    <tr className="bg-slate-50 font-bold border border-slate-800">
                                                        <td colSpan={2} className="py-1 px-3 text-right italic border border-slate-800">
                                                            รวมเฉลี่ยด้านที่ {dimNum}
                                                        </td>
                                                        <td className="py-1 px-2 text-center font-bold border border-slate-800">
                                                            {toArabicNumerals(Number(dimSummary.mean || 0).toFixed(2))}
                                                        </td>
                                                        <td className="py-1 px-2 text-center border border-slate-800">
                                                            {toArabicNumerals(Number(dimSummary.sd || 0).toFixed(2))}
                                                        </td>
                                                        <td className="py-1 px-3 text-center border border-slate-800 font-bold">
                                                            {dimSummary.level}
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}

                                    {/* Overall Row */}
                                    <tr className="bg-slate-200 font-bold border-t-2 border-slate-800">
                                        <td colSpan={2} className="py-1.5 px-3 text-right border border-slate-800">
                                            รวมเฉลี่ยภาพรวมทั้งโครงการ
                                        </td>
                                        <td className="py-1.5 px-2 text-center font-bold border border-slate-800">
                                            {toArabicNumerals(Number(surveyStats?.overallMean || 0).toFixed(2))}
                                        </td>
                                        <td className="py-1.5 px-2 text-center border border-slate-800">
                                            {toArabicNumerals(Number(surveyStats?.overallSd || 0).toFixed(2))}
                                        </td>
                                        <td className="py-1.5 px-3 text-center font-bold border border-slate-800">
                                            {surveyStats?.overallLevel || 'มากที่สุด'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 4.4 ผลสัมฤทธิ์ในการใช้จ่ายงบประมาณ */}
                <div className="mb-6 space-y-3">
                    <h3 className="print-heading font-bold">
                        4.4 ผลสัมฤทธิ์ในการใช้จ่ายงบประมาณเทียบกับแผนงาน
                    </h3>
                    <div className="thai-content thai-indent whitespace-pre-line leading-relaxed">
                        {toArabicNumerals(sections.section_4_4 || (
                            `โครงการได้รับการจัดสรรงบประมาณดำเนินงานตามแผนปฏิบัติการประจำปีงบประมาณ พ.ศ. ${toArabicNumerals(project.academic_year)} การเบิกจ่ายงบประมาณเป็นไปตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 อย่างถูกต้อง โปร่งใส ประหยัด และเกิดความคุ้มค่าสูงสุด`
                        ))}
                    </div>
                </div>

                {/* 4.5 การสังเคราะห์ผลลัพธ์ย้อนกลับสู่บทที่ 1 */}
                {chapter1Comparison && (
                    <div className="mb-6 space-y-3">
                        <h3 className="print-heading font-bold">
                            4.5 การสังเคราะห์ผลการประเมินเปรียบเทียบกับเป้าหมายตามบทที่ 1
                        </h3>
                        <div className="thai-content space-y-2">
                            <p className="thai-indent">
                                <strong>1) ด้านการตอบโจทย์วัตถุประสงค์ของโครงการ:</strong> {toArabicNumerals(chapter1Comparison.objectiveFulfillment?.summary)}
                            </p>
                            <p className="thai-indent">
                                <strong>2) ด้านการตอบโจทย์ประโยชน์ที่คาดว่าจะได้รับ:</strong> {toArabicNumerals(chapter1Comparison.benefitRealization?.summary)}
                            </p>
                            <p className="thai-indent">
                                <strong>3) ด้านการตอบโจทย์ตัวชี้วัดความสำเร็จ (KPIs):</strong> {toArabicNumerals(chapter1Comparison.kpiAchievement?.summary)}
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
