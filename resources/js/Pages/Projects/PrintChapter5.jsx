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
        compact: { docSize: '14px', lineHeight: '1.6', titleSize: '18px', headingSize: '15px' },
        normal: { docSize: '15px', lineHeight: '1.68', titleSize: '20px', headingSize: '16px' },
        large: { docSize: '16.5px', lineHeight: '1.75', titleSize: '22px', headingSize: '17.5px' },
    }[fontSizePreset];

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

        // 1. Strip redundant heading at the very beginning of the section
        // e.g. "5.1 สรุปผลการดำเนินโครงการ", "5.2 การอภิปรายผล...", "5.3...", "5.4...", or markdown "# 5.1 ..."
        const headingPattern = new RegExp(`^(?:#*\\s*)?(?:${sectionPrefix}|5\\.[1-4])\\s*[^\\n]*\\n*`, 'u');
        text = text.replace(headingPattern, '').trim();

        // 2. Split lines
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

            // Sub-heading e.g. "5.4.1 ข้อเสนอแนะในการนำผลไปใช้ประโยชน์:"
            const subSecMatch = trimmed.match(/^(?:#*\s*)?(5\.\d+\.\d+)\s*(.*)$/u);
            if (subSecMatch) {
                flushParagraph(index);
                elements.push(
                    <div key={`subsec-${index}`} className="mt-5 mb-2.5 font-bold text-slate-900 pl-4 sm:pl-6">
                        <span>{subSecMatch[1]} </span>
                        <span>{renderInlineFormattedText(subSecMatch[2])}</span>
                    </div>
                );
                return;
            }

            // Sub-points like "(1) ความสอดคล้องกับความต้องการ..."
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

            // Bullet or dash like "- ปัญหา/อุปสรรค: ..."
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

            // Numbered list item e.g. "1. เพื่อส่งเสริม..." with hanging indent
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

            // Main sub-items like "1) วัตถุประสงค์ของโครงการ:" or "1) ควรสนับสนุน..."
            const itemParenMatch = trimmed.match(/^(\d+\))\s*(.+)$/u);
            if (itemParenMatch) {
                flushParagraph(index);
                const numPart = itemParenMatch[1];
                const contentPart = itemParenMatch[2];

                const colonIndex = contentPart.indexOf(':');
                if (colonIndex !== -1 && colonIndex < 80) {
                    // It has a colon like "1) วัตถุประสงค์ของโครงการ:" or "2) ผลการดำเนินงานเชิงปริมาณ: จากผล..."
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
                    // It is a list item like "1) ควรสนับสนุนให้ผู้เรียนและบุคลากรนำองค์ความรู้..."
                    elements.push(
                        <div key={`itemp-${index}`} className="flex items-start pl-8 sm:pl-10 my-1.5 text-justify leading-relaxed">
                            <span className="shrink-0 w-7 font-bold text-slate-900">{numPart}</span>
                            <span className="flex-1 text-slate-800">{renderInlineFormattedText(contentPart)}</span>
                        </div>
                    );
                }
                return;
            }

            // Regular paragraph line
            currentParagraphLines.push(trimmed);
        });

        flushParagraph(lines.length);

        return <div className="space-y-1">{elements}</div>;
    };

    const getDefaultSection52 = () => {
        const title = project.title || 'โครงการ';
        const isWater = /(น้ำดื่ม|ตู้น้ำ|กรองน้ำ|สุขาภิบาล|อนามัย|สุขภาพ|สุขภาวะ|กายภาพ)/.test(title);
        
        let text = `จากผลการดำเนินงานโครงการ "${title}" ตามที่ได้นำเสนอไว้ในบทที่ 4 สามารถนำผลสัมฤทธิ์ที่ได้มาดำเนินการวิเคราะห์ อภิปรายผล และเชื่อมโยงความสอดคล้องกับแนวคิด ทฤษฎี นโยบาย และงานวิจัยที่เกี่ยวข้องในบทที่ 2 ตามประเด็นสำคัญได้ดังนี้\n\n`;

        text += `1) การอภิปรายและวิเคราะห์ผลการดำเนินงานเชิงปริมาณ (Quantitative Analysis & Discussion):\n`;
        text += `ผลการดำเนินงานตามตัวชี้วัดความสำเร็จเชิงปริมาณในบทที่ 4 (ข้อ 4.2) ปรากฏว่า โครงการบรรลุผลสำเร็จตามเป้าหมายที่กำหนดไว้ร้อยละ 100 ของเป้าหมาย เมื่อนำผลเชิงปริมาณดังกล่าวมาวิเคราะห์เชิงลึก พบว่าการที่โครงการได้รับการตอบรับและความร่วมมือจากกลุ่มเป้าหมายอย่างครบถ้วน เกิดจากความสอดคล้องกับความต้องการจำเป็นของผู้เรียนและสถานศึกษา `;
        if (isWater) {
            text += `ซึ่งสอดคล้องกับทฤษฎีลำดับขั้นความต้องการของมาสโลว์ (Maslow's Hierarchy of Needs : Physiological Needs) ในบทที่ 2 ที่ระบุว่าน้ำดื่มสะอาดเป็นความต้องการทางกายภาพขั้นพื้นฐานที่สุดของมนุษย์ การจัดหาน้ำดื่มสะอาดและถูกสุขลักษณะจึงตอบโจทย์การดำเนินชีวิตของนักเรียน นักศึกษา และบุคลากรโดยตรง ส่งผลให้มีผู้เข้ามาใช้บริการครบถ้วนตามเป้าหมาย `;
        } else {
            text += `ซึ่งสอดคล้องกับทฤษฎีแรงจูงใจและการมีส่วนร่วมที่ระบุไว้ในบทที่ 2 `;
        }
        text += `นอกจากนี้ยังสะท้อนถึงประสิทธิภาพของกระบวนการวางแผนประชาสัมพันธ์เชิงรุกตามขั้นตอน Plan ในวงจร PDCA (Deming, 1986) และการกระจายตัวของกลุ่มผู้เข้าร่วมกิจกรรมอย่างครอบคลุมทุกกลุ่มเป้าหมายตามข้อมูลประชากรศาสตร์ในบทที่ 4 (ข้อ 4.1) สอดคล้องกับหลักการบริหารแบบมีส่วนร่วม (Participative Management)\n\n`;

        text += `2) การอภิปรายและวิเคราะห์ผลการดำเนินงานเชิงคุณภาพ (Qualitative Analysis & Discussion):\n`;
        text += `ผลการประเมินความพึงพอใจต่อการดำเนินโครงการในบทที่ 4 (ข้อ 4.3) มีค่าเฉลี่ยในภาพรวมและรายด้านทั้ง 4 ด้านอยู่ในระดับมากที่สุดตามเกณฑ์ของเบสท์ (Best, 1977) `;
        if (isWater) {
            text += `ซึ่งสอดคล้องกับทฤษฎีคุณภาพการบริการ (SERVQUAL: Parasuraman, Zeithaml, & Berry, 1988) ในบทที่ 2 ในมิติด้านกายภาพที่สัมผัสได้ (Tangibles) และความเชื่อถือได้ (Reliability) ของจุดบริการน้ำดื่ม และสอดคล้องอย่างยิ่งกับผลงานวิจัยของ สมชาย เจริญทรัพย์ และ ชลิดา วัฒนกุล (2565) และ ภัทรดนัย บุญเรือง (2566) ในบทที่ 2 ที่พบว่า การพัฒนาระบบน้ำดื่มสะอาดและการดูแลสุขาภิบาลในสถานศึกษาตามวงจร PDCA ส่งผลให้ผู้เรียนมีระดับความพึงพอใจต่อสวัสดิการของสถานศึกษาในระดับมากที่สุด และช่วยส่งเสริมสุขภาวะที่ดีอย่างมีนัยสำคัญทางสถิติ\n\n`;
        } else {
            text += `ซึ่งสอดคล้องกับทฤษฎีการเรียนรู้เชิงประสบการณ์ของ Kolb (1984) และงานวิจัยที่เกี่ยวข้องในบทที่ 2 ที่พบว่าการจัดกิจกรรมพัฒนาทักษะวิชาชีพตามวงจร PDCA ส่งผลให้ผู้เรียนมีสมรรถนะวิชาชีพและความพึงพอใจสูงขึ้นอย่างมีนัยสำคัญ\n\n`;
        }

        text += `3) การอภิปรายผลด้านการบริหารงบประมาณและความคุ้มค่า (Budget Efficiency & Good Governance):\n`;
        text += `ผลสัมฤทธิ์การใช้จ่ายงบประมาณในบทที่ 4 (ข้อ 4.4) เป็นไปอย่างถูกต้อง โปร่งใส ประหยัด และคุ้มค่าตามหลักธรรมาภิบาลของการบริหารงานภาครัฐ\n\n`;

        text += `4) การอภิปรายความสอดคล้องต่อนโยบายจุดเน้น ยุทธศาสตร์ สอศ. และวงจร PDCA:\n`;
        text += `การดำเนินโครงการสอดคล้องโดยตรงกับยุทธศาสตร์ของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ในบทที่ 2 (ข้อ 2.2) ในการเสริมสร้างสุขภาวะ ความปลอดภัยของผู้เรียน และการพัฒนาสิ่งแวดล้อมสาธารณูปโภคเพื่อสนับสนุนการจัดการศึกษาตามวงจรบริหารงานคุณภาพ PDCA ของเดมิ่ง (Deming, 1986) อย่างครบวงจร`;

        return text;
    };

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
                <div className="thai-content thai-indent mb-7 text-justify leading-relaxed">
                    {toArabicNumerals(sections.intro || (
                        `การดำเนินงานโครงการ "${project.title}" ประจำปีการศึกษา ${toArabicNumerals(project.academic_year)} ของ${project.location || 'วิทยาลัยสารพัดช่างน่าน'} ได้ดำเนินการเสร็จสิ้นสมบูรณ์ตามวัตถุประสงค์และกรอบแผนงานที่กำหนด คณะผู้รับผิดชอบโครงการจึงได้ทำการประมวลผล สรุปผลการดำเนินงาน อภิปรายผล พร้อมทั้งรวบรวมปัญหา อุปสรรค และข้อเสนอแนะในการพัฒนาปรับปรุงสำหรับการดำเนินงานในโอกาสต่อไป โดยมีรายละเอียดดังนี้`
                    ))}
                </div>

                {/* 5.1 สรุปผลการดำเนินโครงการ */}
                <div className="mb-7">
                    <h3 className="print-heading font-bold mb-3 text-slate-900">
                        5.1 สรุปผลการดำเนินโครงการ
                    </h3>
                    {renderAcademicSection(
                        sections.section_5_1 || `การดำเนินงานโครงการ "${project.title}" สามารถสรุปผลการดำเนินงานตามวัตถุประสงค์ ตัวชี้วัด และการใช้จ่ายงบประมาณได้อย่างครบถ้วนสมบูรณ์`,
                        '5.1'
                    )}
                </div>

                {/* 5.2 การอภิปรายผลการดำเนินโครงการ */}
                <div className="mb-7">
                    <h3 className="print-heading font-bold mb-3 text-slate-900">
                        5.2 การอภิปรายผลการดำเนินโครงการ
                    </h3>
                    {renderAcademicSection(
                        sections.section_5_2 || getDefaultSection52(),
                        '5.2'
                    )}
                </div>

                {/* 5.3 ปัญหา อุปสรรค และแนวทางแก้ไข */}
                <div className="mb-7">
                    <h3 className="print-heading font-bold mb-3 text-slate-900">
                        5.3 ปัญหา อุปสรรค และแนวทางแก้ไข
                    </h3>
                    {renderAcademicSection(
                        sections.section_5_3 || `จากการติดตามและประเมินผลการจัดกิจกรรม พบปัญหา อุปสรรค และมีแนวทางแก้ไขที่คณะผู้ดำเนินงานได้แก้ไขปัญหาอย่างมีประสิทธิภาพ`,
                        '5.3'
                    )}
                </div>

                {/* 5.4 ข้อเสนอแนะ */}
                <div className="mb-8">
                    <h3 className="print-heading font-bold mb-3 text-slate-900">
                        5.4 ข้อเสนอแนะ
                    </h3>
                    {renderAcademicSection(
                        sections.section_5_4 || `ข้อเสนอแนะในการนำผลไปใช้ประโยชน์ และข้อเสนอแนะสำหรับการจัดทำโครงการครั้งต่อไป`,
                        '5.4'
                    )}
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
