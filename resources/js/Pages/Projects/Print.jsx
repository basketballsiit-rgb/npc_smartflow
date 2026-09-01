import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function Print({ project, strategyCategories = [] }) {
    // Font size preset state: 'compact' (14px) | 'normal' (15px) | 'large' (16.5px)
    const [fontSizePreset, setFontSizePreset] = useState('normal');

    // Utility to clean person name from parenthetical role tags like (อาจารย์ประจำสาขา), (Super Admin), etc.
    const cleanPersonName = (name) => {
        if (!name) return '';
        let cleaned = String(name).replace(/\s*\([^)]*\)/g, '').trim();
        cleaned = cleaned.replace(/^\(+|\)+$/g, '').trim();
        return cleaned;
    };

    // Utility to convert any Arabic digits in a string/number into Thai digits
    const toThaiNumerals = (val) => {
        if (val === null || val === undefined) return '';
        const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        return String(val).replace(/[0-9]/g, (digit) => thaiDigits[parseInt(digit, 10)]);
    };

    const formatCurrencyThai = (value) => {
        const formatted = new Intl.NumberFormat('th-TH', { style: 'decimal', minimumFractionDigits: 0 }).format(value || 0);
        return toThaiNumerals(formatted);
    };

    const handlePrint = () => {
        window.print();
    };

    // Helper to extract selected strategy items for each category
    const getSelectedCategoryItems = (cat) => {
        if (!cat || !cat.items || cat.items.length === 0) return [];
        
        const selectedIdsInCat = project.strategy_selections?.[cat.id] || [];
        if (Array.isArray(selectedIdsInCat) && selectedIdsInCat.length > 0) {
            const matches = cat.items.filter(item => selectedIdsInCat.includes(item.id));
            if (matches.length > 0) return matches;
        }

        const catName = (cat.name || '').toLowerCase();
        if (catName.includes('iqa') || catName.includes('คุณภาพ')) {
            const ids = project.iqa_strategy_ids || [];
            if (ids.length > 0) return cat.items.filter(item => ids.includes(item.id));
        }
        if (catName.includes('สอศ') || catName.includes('ovec')) {
            const ids = project.ovec_strategy_ids || [];
            if (ids.length > 0) return cat.items.filter(item => ids.includes(item.id));
        }
        if (catName.includes('ชาติ')) {
            const ids = project.national_strategy_ids || [];
            if (ids.length > 0) return cat.items.filter(item => ids.includes(item.id));
        }
        if (catName.includes('จังหวัด')) {
            const ids = project.provincial_strategy_ids || [];
            if (ids.length > 0) return cat.items.filter(item => ids.includes(item.id));
        }

        // Return top active item if no explicit selections found
        return cat.items.slice(0, 1);
    };

    const outputs = Array.isArray(project.outputs) ? project.outputs : [];
    const outcomes = Array.isArray(project.outcomes) ? project.outcomes : [];
    const expected_benefits = Array.isArray(project.expected_benefits) ? project.expected_benefits : [];
    const action_plan = Array.isArray(project.action_plan) ? project.action_plan : [];

    const defaultActionPlan = action_plan.length > 0 ? action_plan : [
        { step_name: '๑. เสนอโครงการเพื่อขออนุมัติ', q1: true, q2: false, q3: false, q4: false, target_count: '๑ โครงการ', location_name: 'วช.น่าน', budget_operating: 0 },
        { step_name: '๒. แต่งตั้งคณะทำงาน และเตรียมการดำเนินกิจกรรม', q1: false, q2: true, q3: false, q4: false, target_count: '๑ ครั้ง', location_name: 'วช.น่าน', budget_operating: 0 },
        { step_name: '๓. ดำเนินการจัดกิจกรรม/โครงการตามแผน', q1: false, q2: false, q3: true, q4: false, target_count: '๕๐ คน', location_name: 'วช.น่าน', budget_operating: project.estimated_budget || 0 },
        { step_name: '๔. สรุปผลและประเมินผลโครงการ', q1: false, q2: false, q3: false, q4: true, target_count: '๑ เล่ม', location_name: 'วช.น่าน', budget_operating: 0 },
    ];

    const fontStyles = {
        compact: { docSize: '14px', lineHeight: '1.4', tableSize: '12px', titleSize: '15px' },
        normal: { docSize: '15px', lineHeight: '1.45', tableSize: '13px', titleSize: '16px' },
        large: { docSize: '16.5px', lineHeight: '1.5', tableSize: '14px', titleSize: '17.5px' },
    }[fontSizePreset];

    const cleanedResponsiblePerson = cleanPersonName(project.responsible_person || project.user?.name || 'นางสาวฉัตรนภา ถิ่นมีกุล');

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0">
            <Head>
                <title>{`แบบเสนอโครงการ - ${project.title}`}</title>
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
                    --table-font-size: ${fontStyles.tableSize};
                    --title-font-size: ${fontStyles.titleSize};
                }

                .font-sarabun {
                    font-family: 'TH Sarabun PSK', 'TH Sarabun Chula', 'THSarabunNew', 'Sarabun', sans-serif !important;
                }

                .thai-indent {
                    text-indent: 2.5cm !important;
                }

                .print-doc-container {
                    font-size: var(--doc-font-size) !important;
                    line-height: var(--doc-line-height) !important;
                }

                .print-title {
                    font-size: var(--title-font-size) !important;
                    font-weight: bold !important;
                }

                .print-table {
                    font-size: var(--table-font-size) !important;
                    line-height: 1.25 !important;
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
                    .print-table {
                        font-size: var(--table-font-size) !important;
                        line-height: 1.2 !important;
                        width: 100% !important;
                    }
                    .print-table th, .print-table td {
                        padding: 3px 5px !important;
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
                        <span>📄</span> แบบเสนอโครงการฉบับทางการ (Official TH Sarabun View)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        ระยะขอบทุกด้าน ๑ นิ้ว | ขนาดฟอนต์ในการพิมพ์เท่ากับหน้ามุมมองที่กำลังดู 100%
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
                            มาตรฐาน
                        </button>
                        <button
                            type="button"
                            onClick={() => setFontSizePreset('large')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                                fontSizePreset === 'large' 
                                    ? 'bg-purple-600 text-white shadow-xs' 
                                    : 'text-slate-700 hover:bg-slate-200'
                            }`}
                            title="ขนาดใหญ่ (16.5px)"
                        >
                            ใหญ่
                        </button>
                    </div>

                    <button
                        onClick={() => window.close()}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                    >
                        ปิด
                    </button>
                    <button
                        onClick={handlePrint}
                        className="rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:scale-105 transition-all flex items-center gap-1.5"
                    >
                        <span>🖨️</span> พิมพ์ / บันทึก PDF
                    </button>
                </div>
            </div>

            {/* Printable Document Paper A4 Styled with TH Sarabun Font & Thai Numerals */}
            <div className="print-doc-container font-sarabun max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-lg border border-slate-200 rounded-lg print:shadow-none print:border-none print:p-0 print:max-w-none text-slate-900 leading-normal">
                
                {/* Official Header */}
                <div className="text-center font-bold mb-6 space-y-0.5 font-sarabun">
                    <h1 className="text-lg md:text-xl font-bold text-slate-900">
                        โครงการ/กิจกรรม ตาม พ.ร.บ. งบประมาณ ประจำปีงบประมาณ พ.ศ. {toThaiNumerals(project.academic_year)}
                    </h1>
                    <div className="border-b-2 border-slate-900 w-56 mx-auto my-1.5"></div>
                    <h2 className="text-base md:text-lg font-bold text-slate-900">
                        {project.department?.name || 'งานส่งเสริมธุรกิจและการเป็นผู้ประกอบการ ฝ่ายยุทธศาสตร์และแผนงาน'} วิทยาลัยสารพัดช่างน่าน
                    </h2>
                </div>

                {/* Section 1-9: Official Text Content */}
                <div className="space-y-4 font-sarabun">
                    
                    {/* Section 1: Title & Responsible Person */}
                    <div>
                        <p className="print-title font-bold text-slate-900">
                            ๑. ชื่อโครงการ: <span className="font-semibold text-slate-900">{toThaiNumerals(project.title)}</span>
                        </p>
                        <div className="pl-6 pt-1 space-y-0.5 text-slate-900 leading-relaxed">
                            <p><span className="font-bold">ผู้รับผิดชอบโครงการ ชื่อ-สกุล :</span> {toThaiNumerals(cleanedResponsiblePerson)}</p>
                            <p><span className="font-bold">ตำแหน่ง :</span> {toThaiNumerals(project.position || 'หัวหน้างานส่งเสริมธุรกิจและการเป็นผู้ประกอบการ')}</p>
                            <p><span className="font-bold">โทรศัพท์เคลื่อนที่ :</span> {toThaiNumerals(project.phone || '๐๘๐-๖๐๔๔๔๕๐')} &nbsp;&nbsp;&nbsp;&nbsp; <span className="font-bold">E-mail :</span> {project.email || project.user?.email || 'Newchatnapa16@npc.ac.th'}</p>
                        </div>
                    </div>

                    {/* Section 2: Project Characteristics & Clean Strategy Alignment (No Checkboxes, Numbered ๑) ๒) ๓)) */}
                    <div>
                        <p className="print-title font-bold text-slate-900">๒. ลักษณะโครงการ</p>
                        <div className="pl-6 pt-1 text-slate-900 space-y-1.5 leading-relaxed">
                            <div>
                                <p className="font-semibold">๒.๑ สอดคล้องกับแผนพัฒนาการจัดการศึกษาของสถานศึกษา (พ.ศ. ๒๕๖๘-๒๕๗๐) วิทยาลัยสารพัดช่างน่าน</p>
                                <p className="pl-6 pt-0.5"><span className="font-bold">- พันธกิจที่ ๑</span> {toThaiNumerals(project.mission || 'ผลิตและพัฒนากำลังคนด้านวิชาชีพให้มีคุณภาพตามมาตรฐานการอาชีวศึกษา')}</p>
                                <p className="pl-6 pt-0.5"><span className="font-bold">- เป้าประสงค์</span> {toThaiNumerals(project.goal || 'ผู้เรียนและผู้สำเร็จการศึกษามีความรู้ ทักษะ การประยุกต์ใช้และมีคุณธรรม จริยธรรม ตามมาตรฐานวิชาชีพ')}</p>
                                <p className="pl-6 pt-0.5"><span className="font-bold">- กลยุทธ์ที่ ๑</span> {toThaiNumerals(project.strategy_tactic || 'ส่งเสริมด้านวิชาการ คุณธรรม จริยธรรม และค่านิยมที่ดีงามในวิชาชีพ')}</p>
                            </div>

                            {/* Dynamic Strategy Checklist Render (Numbered ๑) ๒) ๓) without checkmarks & prefixes) */}
                            {strategyCategories && strategyCategories.length > 0 && (
                                <div className="pt-0.5 space-y-1.5">
                                    <p className="font-semibold">๒.๒ สอดคล้องกับยุทธศาสตร์ นโยบาย และมาตรฐานการอาชีวศึกษา:</p>
                                    <div className="pl-6 space-y-1.5">
                                        {strategyCategories.map((cat, catIdx) => {
                                            const selectedItems = getSelectedCategoryItems(cat);
                                            return (
                                                <div key={cat.id} className="space-y-0.5">
                                                    <p className="font-bold text-slate-900">
                                                        ๒.๒.{toThaiNumerals(catIdx + 1)} {toThaiNumerals(cat.name)}
                                                    </p>
                                                    {selectedItems.map((item, itemIdx) => {
                                                        let itemName = (item.name || item.title || '').trim();
                                                        // Remove bracketed checkboxes
                                                        itemName = itemName.replace(/^\[.*?\]\s*/, '');
                                                        // Remove IQA / OVEC prefix with numbers and colons
                                                        itemName = itemName.replace(/^(IQA|OVEC)\s*([0-9๑-๙]+)?\s*[:\.\-]?\s*/i, '');
                                                        return (
                                                            <p key={item.id || itemIdx} className="pl-6 text-slate-800">
                                                                <span className="font-bold pr-1">{toThaiNumerals(itemIdx + 1)})</span> {toThaiNumerals(itemName)}
                                                            </p>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Background Rationale (With 2.5cm Paragraph Indentation & Relaxed Line Spacing) */}
                    <div>
                        <p className="print-title font-bold text-slate-900">๓. ความสำคัญของโครงการ/ หลักการและเหตุผล</p>
                        <div className="pt-1.5 text-slate-900 space-y-2 leading-relaxed text-justify">
                            {project.background_rationale ? (
                                project.background_rationale.split('\n\n').map((paragraph, pIdx) => {
                                    const trimmed = paragraph.trim();
                                    if (!trimmed) return null;
                                    return (
                                        <p key={pIdx} className="thai-indent" style={{ textIndent: '2.5cm' }}>
                                            {toThaiNumerals(trimmed)}
                                        </p>
                                    );
                                })
                            ) : (
                                <p className="thai-indent" style={{ textIndent: '2.5cm' }}>-</p>
                            )}
                        </div>
                    </div>

                    {/* Section 4: Objectives */}
                    <div>
                        <p className="print-title font-bold text-slate-900">๔. วัตถุประสงค์ของโครงการ:</p>
                        <div className="pl-6 pt-1 text-slate-900 space-y-0.5 leading-relaxed">
                            {Array.isArray(project.objectives) && project.objectives.length > 0 ? (
                                project.objectives.map((obj, i) => (
                                    <p key={i}>๔.{toThaiNumerals(i + 1)} {toThaiNumerals(obj)}</p>
                                ))
                            ) : (
                                <p>๔.๑ {toThaiNumerals(project.objectives || '-')}</p>
                            )}
                        </div>
                    </div>

                    {/* Section 5: Outputs */}
                    <div>
                        <p className="print-title font-bold text-slate-900">๕. ผลผลิตโครงการ (Output)</p>
                        <div className="pl-6 pt-1 text-slate-900 space-y-0.5 leading-relaxed">
                            {outputs.length > 0 ? (
                                outputs.map((op, i) => <p key={i}>๕.{toThaiNumerals(i + 1)} {toThaiNumerals(op)}</p>)
                            ) : (
                                <>
                                    <p>๕.๑ ผู้เข้าร่วมโครงการได้รับการอบรมและพัฒนาสมรรถนะครบถ้วนตามหลักเกณฑ์ที่กำหนด</p>
                                    <p>๕.๒ มีเอกสาร สื่อการเรียนรู้ หรือผลงานจากการดำเนินโครงการที่นำไปใช้ประโยชน์ได้จริง</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Section 6: Outcomes */}
                    <div>
                        <p className="print-title font-bold text-slate-900">๖. ผลลัพธ์โครงการ (Outcome)</p>
                        <div className="pl-6 pt-1 text-slate-900 space-y-0.5 leading-relaxed">
                            {outcomes.length > 0 ? (
                                outcomes.map((oc, i) => <p key={i}>๖.{toThaiNumerals(i + 1)} {toThaiNumerals(oc)}</p>)
                            ) : (
                                <>
                                    <p>๖.๑ ผู้เรียนและบุคลากรสามารถนำองค์ความรู้และทักษะจากโครงการไปประยุกต์ใช้ในการปฏิบัติงานจริงได้อย่างมีประสิทธิภาพ</p>
                                    <p>๖.๒ สถานศึกษามีมาตรฐานการจัดการเรียนการสอนและการบริการวิชาชีพที่ได้รับการยอมรับ</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Section 7: Target Groups */}
                    <div>
                        <p className="print-title font-bold text-slate-900">๗. กลุ่มเป้าหมาย</p>
                        <div className="pl-6 pt-1 text-slate-900 space-y-1 leading-relaxed">
                            <p className="font-bold">๗.๑ เชิงปริมาณ</p>
                            {Array.isArray(project.targets?.quantitative) && project.targets.quantitative.length > 0 ? (
                                project.targets.quantitative.map((q, i) => <p key={i} className="pl-6">๗.๑.{toThaiNumerals(i + 1)} {toThaiNumerals(q)}</p>)
                            ) : (
                                <p className="pl-6">๗.๑.๑ {toThaiNumerals(project.targets?.quantitative || '-')}</p>
                            )}
                            <p className="font-bold pt-0.5">๗.๒ เชิงคุณภาพ</p>
                            {Array.isArray(project.targets?.qualitative) && project.targets.qualitative.length > 0 ? (
                                project.targets.qualitative.map((q, i) => <p key={i} className="pl-6">๗.๒.{toThaiNumerals(i + 1)} {toThaiNumerals(q)}</p>)
                            ) : (
                                <p className="pl-6">๗.๒.๑ {toThaiNumerals(project.targets?.qualitative || '-')}</p>
                            )}
                        </div>
                    </div>

                    {/* Section 8: Location */}
                    <div>
                        <p className="print-title font-bold text-slate-900">๘. พื้นที่ดำเนินการ : <span className="font-normal">{toThaiNumerals(project.location || 'ณ วิทยาลัยสารพัดช่างน่าน')}</span></p>
                    </div>

                    {/* Section 9: Expected Benefits */}
                    <div>
                        <p className="print-title font-bold text-slate-900">๙. ผลที่คาดว่าจะได้รับ</p>
                        <div className="pl-6 pt-1 text-slate-900 space-y-0.5 leading-relaxed">
                            {expected_benefits.length > 0 ? (
                                expected_benefits.map((eb, i) => <p key={i}>๙.{toThaiNumerals(i + 1)} {toThaiNumerals(eb)}</p>)
                            ) : (
                                <>
                                    <p>๙.๑ ผู้เข้าร่วมโครงการมีทักษะและสมรรถนะตรงตามมาตรฐานวิชาชีพและความต้องการของตลาดแรงงาน</p>
                                    <p>๙.๒ สถานศึกษามีผลการดำเนินงานที่ตอบสนองต่อนโยบายของสำนักงานคณะกรรมการการอาชีวศึกษา</p>
                                </>
                            )}
                        </div>
                    </div>

                </div>

                {/* Section 10: Indicators Table & Detailed Expenses */}
                <div className="pt-4 print-break-inside-avoid">
                    <p className="print-title font-bold text-slate-900 mb-1.5">๑๐. ตัวชี้วัดเป้าหมายโครงการ</p>
                    <table className="print-table w-full border-collapse border border-slate-900 text-xs sm:text-sm font-sarabun">
                        <thead>
                            <tr className="bg-slate-50 text-center font-bold border-b border-slate-900">
                                <th className="border-r border-slate-900 p-1 w-28">ประเภทตัวชี้วัด</th>
                                <th className="border-r border-slate-900 p-1">ตัวชี้วัด</th>
                                <th className="p-1 w-32 text-center">หน่วยนับ / จำนวนเงิน</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Quantitative */}
                            <tr className="border-b border-slate-900">
                                <td className="border-r border-slate-900 p-1.5 font-bold align-top">เชิงปริมาณ</td>
                                <td className="border-r border-slate-900 p-1.5 space-y-0.5">
                                    {project.indicators?.quantitative?.text ? (
                                        toThaiNumerals(project.indicators.quantitative.text).split('\n').map((line, idx) => (
                                            <p key={idx}>{line}</p>
                                        ))
                                    ) : Array.isArray(project.targets?.quantitative) && project.targets.quantitative.length > 0 ? (
                                        project.targets.quantitative.map((t, idx) => (
                                            <p key={idx}>{toThaiNumerals(idx + 1)}. {toThaiNumerals(t)}</p>
                                        ))
                                    ) : (
                                        <p>{toThaiNumerals(project.targets?.quantitative || 'ผู้เข้าร่วมโครงการบรรลุตามเป้าหมายที่กำหนด คิดเป็นร้อยละ ๑๐๐')}</p>
                                    )}
                                </td>
                                <td className="p-1.5 text-center align-top font-bold">
                                    {toThaiNumerals(project.indicators?.quantitative?.unit || (Array.isArray(project.targets?.quantitative) ? `${project.targets.quantitative.length} รายการ` : '๑๐๐%'))}
                                </td>
                            </tr>

                            {/* Qualitative */}
                            <tr className="border-b border-slate-900">
                                <td className="border-r border-slate-900 p-1.5 font-bold align-top">เชิงคุณภาพ</td>
                                <td className="border-r border-slate-900 p-1.5 space-y-0.5">
                                    {project.indicators?.qualitative?.text ? (
                                        toThaiNumerals(project.indicators.qualitative.text).split('\n').map((line, idx) => (
                                            <p key={idx}>{line}</p>
                                        ))
                                    ) : Array.isArray(project.targets?.qualitative) && project.targets.qualitative.length > 0 ? (
                                        project.targets.qualitative.map((t, idx) => (
                                            <p key={idx}>{toThaiNumerals(idx + 1)}. {toThaiNumerals(t)}</p>
                                        ))
                                    ) : (
                                        <p>{toThaiNumerals(project.targets?.qualitative || 'ผู้เข้าร่วมมีความพึงพอใจต่อการดำเนินงานและได้รับความรู้ทักษะเพิ่มขึ้นในระดับดีมาก')}</p>
                                    )}
                                </td>
                                <td className="p-1.5 text-center align-top font-bold">
                                    {toThaiNumerals(project.indicators?.qualitative?.unit || 'ร้อยละ ๙๐')}
                                </td>
                            </tr>

                            {/* Time */}
                            <tr className="border-b border-slate-900">
                                <td className="border-r border-slate-900 p-1.5 font-bold align-top">เชิงเวลา</td>
                                <td className="border-r border-slate-900 p-1.5 space-y-0.5">
                                    {project.indicators?.time?.text ? (
                                        toThaiNumerals(project.indicators.time.text).split('\n').map((line, idx) => (
                                            <p key={idx}>{line}</p>
                                        ))
                                    ) : (
                                        <p>ดำเนินโครงการแล้วเสร็จตามระยะเวลาและปฏิทินปฏิบัติงาน ประจำปีงบประมาณ พ.ศ. {toThaiNumerals(project.academic_year || 2569)}</p>
                                    )}
                                </td>
                                <td className="p-1.5 text-center align-top font-bold">
                                    {toThaiNumerals(project.indicators?.time?.unit || '๑ ปีการศึกษา')}
                                </td>
                            </tr>

                            {/* Cost with Multi-Activity Breakdown */}
                            <tr>
                                <td className="border-r border-slate-900 p-1.5 font-bold align-top">เชิงค่าใช้จ่าย</td>
                                <td className="border-r border-slate-900 p-1.5 space-y-1.5">
                                    <p className="font-bold text-slate-900">
                                        {toThaiNumerals(project.indicators?.cost?.text || `ประมาณการค่าใช้จ่ายในการดำเนินโครงการ${project.title || ''}`)}
                                    </p>

                                    {Array.isArray(project.activities) && project.activities.length > 0 ? (
                                        <div className="space-y-1.5 pl-1">
                                            {project.activities.map((act, aIdx) => {
                                                const loanItems = Array.isArray(act.loan_items) ? act.loan_items : [];
                                                const procItems = Array.isArray(act.procurement_items) ? act.procurement_items : [];
                                                const actLoanSum = loanItems.reduce((acc, it) => acc + (parseFloat(it.total_price) || ((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0))), 0);
                                                const actProcSum = procItems.reduce((acc, it) => acc + (parseFloat(it.total_price) || ((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0))), 0);
                                                const actTotal = actLoanSum + actProcSum;

                                                return (
                                                    <div key={aIdx} className="border-l-2 border-slate-400 pl-2 py-1 space-y-0.5 bg-slate-50/70 p-1 rounded">
                                                        <p className="font-bold text-slate-900">
                                                            {toThaiNumerals(act.name || `กิจกรรมที่ ${aIdx + 1}`)}
                                                        </p>
                                                        {act.location && <p className="text-[11px] text-slate-600 pl-2">สถานที่: {toThaiNumerals(act.location)}</p>}
                                                        
                                                        {/* Loan Items */}
                                                        {loanItems.length > 0 && (
                                                            <div className="pl-2 space-y-0.5 pt-0.5">
                                                                <p className="font-bold text-[11px] text-amber-900 underline">หมวดสัญญายืมเงิน (ดำเนินกิจกรรม):</p>
                                                                {loanItems.map((item, lIdx) => {
                                                                    const itemTotal = parseFloat(item.total_price) || ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0));
                                                                    return (
                                                                        <div key={lIdx} className="flex justify-between text-[11px] pl-2 leading-tight">
                                                                            <span>- {toThaiNumerals(item.description)} ({toThaiNumerals(item.quantity)} {toThaiNumerals(item.unit)} x {formatCurrencyThai(item.unit_price)} บ.)</span>
                                                                            <span className="font-bold shrink-0 ml-2">{formatCurrencyThai(itemTotal)} บาท</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Procurement Items */}
                                                        {procItems.length > 0 && (
                                                            <div className="pl-2 space-y-0.5 pt-0.5">
                                                                <p className="font-bold text-[11px] text-indigo-900 underline">หมวดจัดซื้อจัดจ้างพัสดุ:</p>
                                                                {procItems.map((item, pIdx) => {
                                                                    const itemTotal = parseFloat(item.total_price) || ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0));
                                                                    return (
                                                                        <div key={pIdx} className="flex justify-between text-[11px] pl-2 leading-tight">
                                                                            <span>- {toThaiNumerals(item.description)} ({toThaiNumerals(item.quantity)} {toThaiNumerals(item.unit)} x {formatCurrencyThai(item.unit_price)} บ.)</span>
                                                                            <span className="font-bold shrink-0 ml-2">{formatCurrencyThai(itemTotal)} บาท</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        <div className="flex justify-between text-[11px] font-bold pt-0.5 border-t border-slate-300">
                                                            <span>รวมเงินกิจกรรมที่ {toThaiNumerals(aIdx + 1)}</span>
                                                            <span className="text-purple-950 font-bold">{formatCurrencyThai(actTotal)} บาท</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : Array.isArray(project.procurement?.items) && project.procurement.items.length > 0 ? (
                                        <div className="pl-2 space-y-0.5">
                                            {project.procurement.items.map((item, pIdx) => (
                                                <div key={pIdx} className="flex justify-between text-[11px] leading-tight">
                                                    <span>{toThaiNumerals(pIdx + 1)}. {toThaiNumerals(item.description)} ({toThaiNumerals(item.quantity)} {toThaiNumerals(item.unit)} x {formatCurrencyThai(item.unit_price)} บ.)</span>
                                                    <span className="font-bold shrink-0 ml-2">{formatCurrencyThai(item.total_price)} บาท</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}

                                    <p className="font-bold text-right pt-1 text-sm sm:text-base">รวมงบประมาณทั้งสิ้นทั้งโครงการ</p>
                                </td>
                                <td className="p-1.5 text-right align-bottom font-bold">
                                    <p className="pt-1 border-t-2 border-slate-900 text-sm sm:text-base font-bold text-slate-900">
                                        {formatCurrencyThai(project.estimated_budget)} บาท
                                    </p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Section 11: Action Plan & Budget Table */}
                <div className="pt-4 print-break-inside-avoid">
                    <p className="print-title font-bold text-slate-900 mb-1.5">๑๑. สรุปขั้นตอน/วิธีดำเนินการและเงินที่ใช้</p>
                    <table className="print-table w-full border-collapse border border-slate-900 text-xs font-sarabun text-center">
                        <thead>
                            <tr className="bg-slate-50 font-bold border-b border-slate-900 text-xs">
                                <th rowSpan="2" className="border-r border-slate-900 p-1 text-left">ขั้นตอน/<br />วิธีดำเนิน</th>
                                <th colSpan="4" className="border-r border-slate-900 p-0.5">ดำเนินการ<br />ในไตรมาส (✓)</th>
                                <th rowSpan="2" className="border-r border-slate-900 p-1 w-14">เป้าหมาย</th>
                                <th rowSpan="2" className="border-r border-slate-900 p-1 w-16">พื้นที่<br />ดำเนินการ</th>
                                <th colSpan="4" className="p-0.5">หมวดเงิน<br />(ระบุจำนวนเงิน:บาท)</th>
                            </tr>
                            <tr className="bg-slate-50 font-bold border-b border-slate-900 text-xs">
                                <th className="border-r border-slate-900 p-0.5 w-5">๑</th>
                                <th className="border-r border-slate-900 p-0.5 w-5">๒</th>
                                <th className="border-r border-slate-900 p-0.5 w-5">๓</th>
                                <th className="border-r border-slate-900 p-0.5 w-5">๔</th>
                                <th className="border-r border-slate-900 p-1 w-14">งบดำเนินงาน</th>
                                <th className="border-r border-slate-900 p-1 w-12">งบลงทุน</th>
                                <th className="border-r border-slate-900 p-1 w-12">งบเฉพาะฯ</th>
                                <th className="p-1 w-12">งบอุดหนุน</th>
                            </tr>
                        </thead>
                        <tbody>
                            {defaultActionPlan.map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-900">
                                    <td className="border-r border-slate-900 p-1.5 text-left font-medium">{toThaiNumerals(row.step_name)}</td>
                                    <td className="border-r border-slate-900 p-0.5 font-bold">{row.q1 ? '✓' : ''}</td>
                                    <td className="border-r border-slate-900 p-0.5 font-bold">{row.q2 ? '✓' : ''}</td>
                                    <td className="border-r border-slate-900 p-0.5 font-bold">{row.q3 ? '✓' : ''}</td>
                                    <td className="border-r border-slate-900 p-0.5 font-bold">{row.q4 ? '✓' : ''}</td>
                                    <td className="border-r border-slate-900 p-1 font-bold">{toThaiNumerals(row.target_count || '-')}</td>
                                    <td className="border-r border-slate-900 p-1 font-bold">{toThaiNumerals(row.location_name || 'วช.น่าน')}</td>
                                    <td className="border-r border-slate-900 p-1 text-right font-bold">{row.budget_operating > 0 ? formatCurrencyThai(row.budget_operating) : ''}</td>
                                    <td className="border-r border-slate-900 p-1"></td>
                                    <td className="border-r border-slate-900 p-1"></td>
                                    <td className="p-1"></td>
                                </tr>
                            ))}
                            <tr className="font-bold border-b border-slate-900 bg-slate-50 text-xs">
                                <td colSpan="7" className="border-r border-slate-900 p-1 text-right">รวมเงิน</td>
                                <td className="border-r border-slate-900 p-1 text-right font-bold">{formatCurrencyThai(project.estimated_budget)}</td>
                                <td className="border-r border-slate-900 p-1"></td>
                                <td className="border-r border-slate-900 p-1"></td>
                                <td className="p-1"></td>
                            </tr>
                            <tr className="font-bold bg-slate-100 text-xs sm:text-sm">
                                <td colSpan="7" className="border-r border-slate-900 p-1.5 text-right">งบประมาณรวมทั้งโครงการ</td>
                                <td colSpan="4" className="p-1.5 text-center font-bold">{formatCurrencyThai(project.estimated_budget)} บาท</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Section 12: Approvers Block */}
                <div className="pt-6 print-break-inside-avoid font-sarabun">
                    <p className="print-title font-bold text-slate-900 mb-6">๑๒. ผู้เห็นชอบและผู้อนุมัติโครงการ{toThaiNumerals(project.title)}</p>
                    
                    <div className="space-y-8 text-xs sm:text-sm">
                        {/* Row 1: Proposer & Head of Department */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            {/* Signature 1: ผู้เสนอโครงการ */}
                            <div className="flex flex-col items-center text-center font-sarabun">
                                <div className="flex items-baseline justify-center w-full text-xs sm:text-[13px] whitespace-nowrap">
                                    <span className="shrink-0 mr-1 font-normal">ลงชื่อ</span>
                                    <span className="border-b border-dotted border-slate-700 w-28 sm:w-36 inline-block mb-1"></span>
                                    <span className="shrink-0 ml-1 font-normal">ผู้เสนอโครงการ</span>
                                </div>
                                <p className="font-bold pt-2 text-xs sm:text-[13px]">
                                    ({toThaiNumerals(cleanedResponsiblePerson)})
                                </p>
                                <p className="text-[11px] sm:text-[11.5px] leading-relaxed pt-0.5 font-normal max-w-[200px] text-slate-800">
                                    {toThaiNumerals(project.position || 'หัวหน้างานส่งเสริมธุรกิจและการเป็นผู้ประกอบการ')}
                                </p>
                                <p className="text-[11px] pt-1 font-normal text-slate-700 whitespace-nowrap">
                                    วันที่ ....... เดือน ............................ พ.ศ. ...............
                                </p>
                            </div>

                            {/* Signature 2: Head of Department */}
                            <div className="flex flex-col items-center text-center font-sarabun">
                                <div className="flex items-baseline justify-center w-full text-xs sm:text-[13px] whitespace-nowrap">
                                    <span className="shrink-0 mr-1 font-normal">ลงชื่อ</span>
                                    <span className="border-b border-dotted border-slate-700 w-28 sm:w-36 inline-block mb-1"></span>
                                    <span className="shrink-0 ml-1 font-normal">ผู้เห็นชอบโครงการ</span>
                                </div>
                                <p className="font-bold pt-2 text-xs sm:text-[13px]">
                                    (......................................................)
                                </p>
                                <p className="text-[11px] sm:text-[11.5px] leading-relaxed pt-0.5 font-normal max-w-[200px] text-slate-800">
                                    {toThaiNumerals(project.department?.name ? `หัวหน้า${project.department.name}` : 'หัวหน้าแผนกวิชา / หัวหน้างาน')}
                                </p>
                                <p className="text-[11px] pt-1 font-normal text-slate-700 whitespace-nowrap">
                                    วันที่ ....... เดือน ............................ พ.ศ. ...............
                                </p>
                            </div>
                        </div>

                        {/* Row 2: Planning Head & Deputy Director */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            {/* Signature 3: Head of Planning */}
                            <div className="flex flex-col items-center text-center font-sarabun">
                                <div className="flex items-baseline justify-center w-full text-xs sm:text-[13px] whitespace-nowrap">
                                    <span className="shrink-0 mr-1 font-normal">ลงชื่อ</span>
                                    <span className="border-b border-dotted border-slate-700 w-28 sm:w-36 inline-block mb-1"></span>
                                    <span className="shrink-0 ml-1 font-normal">ผู้เห็นชอบโครงการ</span>
                                </div>
                                <p className="font-bold pt-2 text-xs sm:text-[13px]">
                                    (นายนิพนธ์ ร่องพืช)
                                </p>
                                <p className="text-[11px] sm:text-[11.5px] leading-relaxed pt-0.5 font-normal max-w-[200px] text-slate-800">
                                    หัวหน้างานแผนงานและความร่วมมือ
                                </p>
                                <p className="text-[11px] pt-1 font-normal text-slate-700 whitespace-nowrap">
                                    วันที่ ....... เดือน ............................ พ.ศ. ...............
                                </p>
                            </div>

                            {/* Signature 4: Deputy Director */}
                            <div className="flex flex-col items-center text-center font-sarabun">
                                <div className="flex items-baseline justify-center w-full text-xs sm:text-[13px] whitespace-nowrap">
                                    <span className="shrink-0 mr-1 font-normal">ลงชื่อ</span>
                                    <span className="border-b border-dotted border-slate-700 w-28 sm:w-36 inline-block mb-1"></span>
                                    <span className="shrink-0 ml-1 font-normal">ผู้เห็นชอบโครงการ</span>
                                </div>
                                <p className="font-bold pt-2 text-xs sm:text-[13px]">
                                    (นายจักรพงศ์ พรหมสกุลปัญญา)
                                </p>
                                <p className="text-[11px] sm:text-[11.5px] leading-relaxed pt-0.5 font-normal max-w-[200px] text-slate-800">
                                    รองผู้อำนวยการฝ่ายแผนงานและความร่วมมือ
                                </p>
                                <p className="text-[11px] pt-1 font-normal text-slate-700 whitespace-nowrap">
                                    วันที่ ....... เดือน ............................ พ.ศ. ...............
                                </p>
                            </div>
                        </div>

                        {/* Row 3: Final Director Approval */}
                        <div className="pt-2 flex flex-col items-center text-center font-sarabun max-w-sm mx-auto">
                            <div className="flex items-baseline justify-center w-full text-xs sm:text-[13px] whitespace-nowrap">
                                <span className="shrink-0 mr-1.5 font-normal">ลงชื่อ</span>
                                <span className="border-b border-dotted border-slate-700 w-36 sm:w-44 inline-block mb-1"></span>
                                <span className="shrink-0 ml-1.5 font-normal">ผู้อนุมัติโครงการ</span>
                            </div>
                            <p className="font-bold text-sm sm:text-base pt-2">
                                (นายกเชษฐ์ กิ่งชนะ)
                            </p>
                            <p className="text-[12px] font-semibold leading-relaxed pt-0.5 text-slate-800">
                                ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน
                            </p>
                            <p className="text-[11px] pt-1 font-normal text-slate-700 whitespace-nowrap">
                                วันที่ ....... เดือน ............................ พ.ศ. ...............
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
