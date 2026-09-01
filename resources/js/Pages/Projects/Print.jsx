import { Head } from '@inertiajs/react';

export default function Print({ project, strategyCategories = [] }) {
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
        { step_name: '๑. เสนอโครงการเพื่อขออนุมัติ', q1: false, q2: false, q3: true, q4: false, target_count: '๑ โครงการ', location_name: 'วช.น่าน', budget_operating: 0 },
        { step_name: '๒. ขออนุมัติดำเนินโครงการ', q1: false, q2: false, q3: true, q4: false, target_count: '๕๐ คน', location_name: 'วช.น่าน', budget_operating: 0 },
        { step_name: '๓. ดำเนินโครงการประเมินผล', q1: false, q2: false, q3: true, q4: false, target_count: '๕๐ คน', location_name: 'วช.น่าน', budget_operating: project.estimated_budget },
        { step_name: '๔. สรุปผลและประเมินผล', q1: false, q2: false, q3: false, q4: true, target_count: '๑ เล่ม', location_name: 'วช.น่าน', budget_operating: 0 },
    ];

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0">
            <Head>
                <title>{`แบบเสนอโครงการ - ${project.title}`}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />
            </Head>

            {/* Custom Embedded CSS for TH Sarabun Font */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
                
                .font-sarabun {
                    font-family: 'TH Sarabun PSK', 'TH Sarabun Chula', 'THSarabunNew', 'Sarabun', sans-serif !important;
                }

                @media print {
                    body {
                        font-family: 'TH Sarabun PSK', 'TH Sarabun Chula', 'THSarabunNew', 'Sarabun', sans-serif !important;
                        font-size: 15pt !important;
                        color: #000 !important;
                    }
                    .print-sarabun-text {
                        font-family: 'TH Sarabun PSK', 'TH Sarabun Chula', 'THSarabunNew', 'Sarabun', sans-serif !important;
                    }
                }
            `}</style>

            {/* Top Action Bar (Hidden when printing) */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden font-sans">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">📄 แบบเสนอโครงการฉบับทางการ (Official TH Sarabun Document View)</h3>
                    <p className="text-xs text-slate-600">แสดงผลและสั่งพิมพ์ด้วยแบบอักษร TH Sarabun และตัวเลขไทยทั้งหมด ดึงข้อมูลยุทธศาสตร์พันธกิจจากเช็คลิสต์อัตโนมัติ</p>
                </div>
                <div className="flex gap-x-3">
                    <button
                        onClick={() => window.close()}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                        ปิดหน้าต่าง
                    </button>
                    <button
                        onClick={handlePrint}
                        className="rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:scale-105 transition-all"
                    >
                        🖨️ พิมพ์เอกสาร (ตัวเลขไทย) / PDF
                    </button>
                </div>
            </div>

            {/* Printable Document Paper A4 Styled with TH Sarabun Font & Thai Numerals */}
            <div className="font-sarabun max-w-4xl mx-auto bg-white p-8 md:p-14 shadow-lg border border-slate-200 rounded-lg print:shadow-none print:border-none print:p-0 print:max-w-none text-slate-900 leading-relaxed text-base">
                
                {/* Official Header */}
                <div className="text-center font-bold mb-8 space-y-1 font-sarabun">
                    <h1 className="text-xl font-bold text-slate-900">โครงการ/กิจกรรม ตาม พ.ร.บ. งบประมาณ ประจำปีงบประมาณ พ.ศ. {toThaiNumerals(project.academic_year)}</h1>
                    <div className="border-b-2 border-slate-900 w-64 mx-auto my-2"></div>
                    <h2 className="text-lg font-bold text-slate-900">
                        {project.department?.name || 'งานส่งเสริมธุรกิจและการเป็นผู้ประกอบการ ฝ่ายยุทธศาสตร์และแผนงาน'} วิทยาลัยสารพัดช่างน่าน
                    </h2>
                </div>

                {/* Section 1: Title & Responsible Person */}
                <div className="space-y-5 font-sarabun">
                    <div>
                        <p className="font-bold text-base sm:text-lg text-slate-900">
                            ๑. ชื่อโครงการ: <span className="font-semibold text-slate-900">{toThaiNumerals(project.title)}</span>
                        </p>
                        <div className="pl-6 pt-1.5 space-y-1 text-base text-slate-900">
                            <p><span className="font-bold">ผู้รับผิดชอบโครงการ ชื่อ-สกุล :</span> {toThaiNumerals(project.responsible_person || project.user?.name || 'นางสาวฉัตรนภา ถิ่นมีกุล')}</p>
                            <p><span className="font-bold">ตำแหน่ง :</span> {toThaiNumerals(project.position || 'หัวหน้างานส่งเสริมธุรกิจและการเป็นผู้ประกอบการ')}</p>
                            <p><span className="font-bold">โทรศัพท์เคลื่อนที่ :</span> {toThaiNumerals(project.phone || '๐๘๐-๖๐๔๔๔๕๐')} &nbsp;&nbsp;&nbsp;&nbsp; <span className="font-bold">E-mail :</span> {project.email || project.user?.email || 'Newchatnapa16@npc.ac.th'}</p>
                        </div>
                    </div>

                    {/* Section 2: Project Characteristics & Dynamic Checklist Strategy Alignment */}
                    <div>
                        <p className="font-bold text-base sm:text-lg text-slate-900">๒. ลักษณะโครงการ</p>
                        <div className="pl-6 pt-1.5 text-base text-slate-900 space-y-2">
                            <div>
                                <p className="font-semibold">๒.๑ สอดคล้องกับแผนพัฒนาการจัดการศึกษาของสถานศึกษา (พ.ศ. ๒๕๖๘-๒๕๗๐) วิทยาลัยสารพัดช่างน่าน</p>
                                <p className="pl-6 pt-0.5"><span className="font-bold">- พันธกิจที่ ๑</span> {toThaiNumerals(project.mission || 'ผลิตและพัฒนากำลังคนด้านวิชาชีพให้มีคุณภาพตามมาตรฐานการอาชีวศึกษา')}</p>
                                <p className="pl-6 pt-0.5"><span className="font-bold">- เป้าประสงค์</span> {toThaiNumerals(project.goal || 'ผู้เรียนและผู้สำเร็จการศึกษามีความรู้ ทักษะ การประยุกต์ใช้และมีคุณธรรม จริยธรรม ตามมาตรฐานวิชาชีพ')}</p>
                                <p className="pl-6 pt-0.5"><span className="font-bold">- กลยุทธ์ที่ ๑</span> {toThaiNumerals(project.strategy_tactic || 'ส่งเสริมด้านวิชาการ คุณธรรม จริยธรรม และค่านิยมที่ดีงามในวิชาชีพ')}</p>
                            </div>

                            {/* Dynamic Strategy Checklist Render */}
                            {strategyCategories && strategyCategories.length > 0 && (
                                <div className="pt-1 space-y-2">
                                    <p className="font-semibold">๒.๒ สอดคล้องกับยุทธศาสตร์ นโยบาย และมาตรฐานการอาชีวศึกษา (ตามรายการเช็คลิสต์):</p>
                                    <div className="pl-6 space-y-2">
                                        {strategyCategories.map((cat, catIdx) => {
                                            const selectedItems = getSelectedCategoryItems(cat);
                                            return (
                                                <div key={cat.id} className="space-y-0.5">
                                                    <p className="font-bold text-slate-900">
                                                        ๒.๒.{toThaiNumerals(catIdx + 1)} {toThaiNumerals(cat.name)}
                                                    </p>
                                                    {selectedItems.map((item, itemIdx) => (
                                                        <p key={item.id || itemIdx} className="pl-6 text-slate-800">
                                                            <span className="font-bold text-purple-950 pr-1">[✓]</span> {toThaiNumerals(item.name || item.title)}
                                                        </p>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Background Rationale */}
                    <div>
                        <p className="font-bold text-base sm:text-lg text-slate-900">๓. ความสำคัญของโครงการ/ หลักการและเหตุผล</p>
                        <p className="pl-6 pt-1.5 text-base text-slate-900 leading-relaxed whitespace-pre-line text-justify">
                            {toThaiNumerals(project.background_rationale)}
                        </p>
                    </div>

                    {/* Section 4: Objectives */}
                    <div>
                        <p className="font-bold text-base sm:text-lg text-slate-900">๔. วัตถุประสงค์ของโครงการ:</p>
                        <div className="pl-6 pt-1.5 text-base text-slate-900 space-y-1">
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
                        <p className="font-bold text-base sm:text-lg text-slate-900">๕. ผลผลิตโครงการ (Output)</p>
                        <div className="pl-6 pt-1.5 text-base text-slate-900 space-y-1">
                            {outputs.length > 0 ? (
                                outputs.map((op, i) => <p key={i}>๕.{toThaiNumerals(i + 1)} {toThaiNumerals(op)}</p>)
                            ) : (
                                <>
                                    <p>๕.๑ สถานศึกษาสังกัดสำนักงานคณะกรรมการการอาชีวศึกษาในจังหวัดที่มีศูนย์บ่มเพาะผู้ประกอบการอาชีวศึกษา จำนวน ๔ แห่ง ได้รับการประเมินผลการดำเนินงานครบถ้วนตามหลักเกณฑ์ที่กำหนด</p>
                                    <p>๕.๒ ได้สถานศึกษาที่มีผลการดำเนินงานดีเด่น เพื่อเป็นตัวแทนจังหวัดเข้ารับการประเมินในระดับภาค</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Section 6: Outcomes */}
                    <div>
                        <p className="font-bold text-base sm:text-lg text-slate-900">๖. ผลลัพธ์โครงการ (Outcome)</p>
                        <div className="pl-6 pt-1.5 text-base text-slate-900 space-y-1">
                            {outcomes.length > 0 ? (
                                outcomes.map((oc, i) => <p key={i}>๖.{toThaiNumerals(i + 1)} {toThaiNumerals(oc)}</p>)
                            ) : (
                                <>
                                    <p>๖.๑ สถานศึกษามีระบบบริหารจัดการศูนย์บ่มเพาะผู้ประกอบการอาชีวศึกษาที่มีประสิทธิภาพ สอดคล้องกับมาตรฐานและเกณฑ์การประเมินของสำนักงานคณะกรรมการการอาชี�                    {/* Section 10: Indicators Table & Detailed Expenses by Activity */}
                    <div className="pt-4 page-break-inside-avoid">
                        <p className="font-bold text-base sm:text-lg text-slate-900 mb-2.5">๑๐. ตัวชี้วัดเป้าหมายโครงการ</p>
                        <table className="w-full border-collapse border border-slate-900 text-sm sm:text-base font-sarabun">
                            <thead>
                                <tr className="bg-slate-50 text-center font-bold border-b border-slate-900 text-base">
                                    <th className="border-r border-slate-900 p-2 w-32">ประเภทตัวชี้วัด</th>
                                    <th className="border-r border-slate-900 p-2">ตัวชี้วัด</th>
                                    <th className="p-2 w-32 text-center">หน่วยนับ / จำนวนเงิน</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Quantitative */}
                                <tr className="border-b border-slate-900">
                                    <td className="border-r border-slate-900 p-2.5 font-bold align-top">เชิงปริมาณ</td>
                                    <td className="border-r border-slate-900 p-2.5 space-y-1">
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
                                    <td className="p-2.5 text-center align-top font-bold">
                                        {toThaiNumerals(project.indicators?.quantitative?.unit || (Array.isArray(project.targets?.quantitative) ? `${project.targets.quantitative.length} รายการ` : '๑๐๐%'))}
                                    </td>
                                </tr>

                                {/* Qualitative */}
                                <tr className="border-b border-slate-900">
                                    <td className="border-r border-slate-900 p-2.5 font-bold align-top">เชิงคุณภาพ</td>
                                    <td className="border-r border-slate-900 p-2.5 space-y-1">
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
                                    <td className="p-2.5 text-center align-top font-bold">
                                        {toThaiNumerals(project.indicators?.qualitative?.unit || 'ร้อยละ ๙๐')}
                                    </td>
                                </tr>

                                {/* Time */}
                                <tr className="border-b border-slate-900">
                                    <td className="border-r border-slate-900 p-2.5 font-bold align-top">เชิงเวลา</td>
                                    <td className="border-r border-slate-900 p-2.5 space-y-1">
                                        {project.indicators?.time?.text ? (
                                            toThaiNumerals(project.indicators.time.text).split('\n').map((line, idx) => (
                                                <p key={idx}>{line}</p>
                                            ))
                                        ) : (
                                            <p>ดำเนินโครงการแล้วเสร็จตามระยะเวลาและปฏิทินปฏิบัติงาน ประจำปีงบประมาณ พ.ศ. {toThaiNumerals(project.academic_year || 2569)}</p>
                                        )}
                                    </td>
                                    <td className="p-2.5 text-center align-top font-bold">
                                        {toThaiNumerals(project.indicators?.time?.unit || '๑ ปีการศึกษา')}
                                    </td>
                                </tr>

                                {/* Cost with Multi-Activity Breakdown */}
                                <tr>
                                    <td className="border-r border-slate-900 p-2.5 font-bold align-top">เชิงค่าใช้จ่าย</td>
                                    <td className="border-r border-slate-900 p-2.5 space-y-3">
                                        <p className="font-bold text-slate-900">
                                            {toThaiNumerals(project.indicators?.cost?.text || `ประมาณการค่าใช้จ่ายในการดำเนินโครงการ${project.title || ''}`)}
                                        </p>

                                        {Array.isArray(project.activities) && project.activities.length > 0 ? (
                                            <div className="space-y-3 pl-1">
                                                {project.activities.map((act, aIdx) => {
                                                    const loanItems = Array.isArray(act.loan_items) ? act.loan_items : [];
                                                    const procItems = Array.isArray(act.procurement_items) ? act.procurement_items : [];
                                                    const actLoanSum = loanItems.reduce((acc, it) => acc + (parseFloat(it.total_price) || ((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0))), 0);
                                                    const actProcSum = procItems.reduce((acc, it) => acc + (parseFloat(it.total_price) || ((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0))), 0);
                                                    const actTotal = actLoanSum + actProcSum;

                                                    return (
                                                        <div key={aIdx} className="border-l-2 border-slate-400 pl-3 py-1 space-y-1.5 bg-slate-50/50 p-2 rounded">
                                                            <p className="font-bold text-slate-900">
                                                                {toThaiNumerals(act.name || `กิจกรรมที่ ${aIdx + 1}`)}
                                                            </p>
                                                            {act.location && <p className="text-xs text-slate-700 pl-2">สถานที่: {toThaiNumerals(act.location)}</p>}
                                                            
                                                            {/* Loan Items */}
                                                            {loanItems.length > 0 && (
                                                                <div className="pl-3 space-y-0.5">
                                                                    <p className="font-bold text-xs text-amber-900 underline">หมวดสัญญายืมเงิน (ดำเนินกิจกรรม):</p>
                                                                    {loanItems.map((item, lIdx) => {
                                                                        const itemTotal = parseFloat(item.total_price) || ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0));
                                                                        return (
                                                                            <div key={lIdx} className="flex justify-between text-xs pl-2">
                                                                                <span>- {toThaiNumerals(item.description)} ({toThaiNumerals(item.quantity)} {toThaiNumerals(item.unit)} x {formatCurrencyThai(item.unit_price)} บ.)</span>
                                                                                <span className="font-bold shrink-0 ml-2">{formatCurrencyThai(itemTotal)} บาท</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            {/* Procurement Items */}
                                                            {procItems.length > 0 && (
                                                                <div className="pl-3 space-y-0.5 pt-1">
                                                                    <p className="font-bold text-xs text-indigo-900 underline">หมวดจัดซื้อจัดจ้างพัสดุ:</p>
                                                                    {procItems.map((item, pIdx) => {
                                                                        const itemTotal = parseFloat(item.total_price) || ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0));
                                                                        return (
                                                                            <div key={pIdx} className="flex justify-between text-xs pl-2">
                                                                                <span>- {toThaiNumerals(item.description)} ({toThaiNumerals(item.quantity)} {toThaiNumerals(item.unit)} x {formatCurrencyThai(item.unit_price)} บ.)</span>
                                                                                <span className="font-bold shrink-0 ml-2">{formatCurrencyThai(itemTotal)} บาท</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-300">
                                                                <span>รวมเงินกิจกรรมที่ {toThaiNumerals(aIdx + 1)}</span>
                                                                <span>{formatCurrencyThai(actTotal)} บาท</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : Array.isArray(project.procurement?.items) && project.procurement.items.length > 0 ? (
                                            <div className="pl-3 space-y-1">
                                                {project.procurement.items.map((item, pIdx) => (
                                                    <div key={pIdx} className="flex justify-between text-xs">
                                                        <span>{toThaiNumerals(pIdx + 1)}. {toThaiNumerals(item.description)} ({toThaiNumerals(item.quantity)} {toThaiNumerals(item.unit)} x {formatCurrencyThai(item.unit_price)} บ.)</span>
                                                        <span className="font-bold shrink-0 ml-2">{formatCurrencyThai(item.total_price)} บาท</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}

                                        <p className="font-bold text-right pt-2 text-base">รวมงบประมาณทั้งสิ้นทั้งโครงการ</p>
                                    </td>
                                    <td className="p-2.5 text-right align-bottom font-bold">
                                        <p className="pt-2 border-t border-slate-900 text-base font-bold text-slate-900">
                                            {formatCurrencyThai(project.estimated_budget)} บาท
                                        </p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Section 11: Action Plan & Budget Table */}
                    <div className="pt-5 page-break-inside-avoid">
                        <p className="font-bold text-base sm:text-lg text-slate-900 mb-2.5">๑๑. สรุปขั้นตอน/วิธีดำเนินการและเงินที่ใช้</p>
                        <table className="w-full border-collapse border border-slate-900 text-xs sm:text-sm font-sarabun text-center">
                            <thead>
                                <tr className="bg-slate-50 font-bold border-b border-slate-900 text-xs sm:text-sm">
                                    <th rowSpan="2" className="border-r border-slate-900 p-2 text-left">ขั้นตอน/<br />วิธีดำเนิน</th>
                                    <th colSpan="4" className="border-r border-slate-900 p-1">ดำเนินการ<br />ในไตรมาส (✓)</th>
                                    <th rowSpan="2" className="border-r border-slate-900 p-1.5 w-16">เป้าหมาย</th>
                                    <th rowSpan="2" className="border-r border-slate-900 p-1.5 w-20">พื้นที่<br />ดำเนินการ</th>
                                    <th colSpan="4" className="p-1">หมวดเงิน<br />(ระบุจำนวนเงิน:บาท)</th>
                                </tr>
                                <tr className="bg-slate-50 font-bold border-b border-slate-900 text-xs">
                                    <th className="border-r border-slate-900 p-1 w-6">๑</th>
                                    <th className="border-r border-slate-900 p-1 w-6">๒</th>
                                    <th className="border-r border-slate-900 p-1 w-6">๓</th>
                                    <th className="border-r border-slate-900 p-1 w-6">๔</th>
                                    <th className="border-r border-slate-900 p-1 w-16">งบดำเนินงาน</th>
                                    <th className="border-r border-slate-900 p-1 w-14">งบลงทุน</th>
                                    <th className="border-r border-slate-900 p-1 w-14">งบเฉพาะฯ</th>
                                    <th className="p-1 w-14">งบอุดหนุน</th>
                                </tr>
                            </thead>
                            <tbody>
                                {defaultActionPlan.map((row, idx) => (
                                    <tr key={idx} className="border-b border-slate-900">
                                        <td className="border-r border-slate-900 p-2 text-left font-medium">{toThaiNumerals(row.step_name)}</td>
                                        <td className="border-r border-slate-900 p-1 font-bold">{row.q1 ? '✓' : ''}</td>
                                        <td className="border-r border-slate-900 p-1 font-bold">{row.q2 ? '✓' : ''}</td>
                                        <td className="border-r border-slate-900 p-1 font-bold">{row.q3 ? '✓' : ''}</td>
                                        <td className="border-r border-slate-900 p-1 font-bold">{row.q4 ? '✓' : ''}</td>
                                        <td className="border-r border-slate-900 p-1 font-bold">{toThaiNumerals(row.target_count || '-')}</td>
                                        <td className="border-r border-slate-900 p-1 font-bold">{toThaiNumerals(row.location_name || 'วช.น่าน')}</td>
                                        <td className="border-r border-slate-900 p-1 text-right font-bold">{row.budget_operating > 0 ? formatCurrencyThai(row.budget_operating) : ''}</td>
                                        <td className="border-r border-slate-900 p-1"></td>
                                        <td className="border-r border-slate-900 p-1"></td>
                                        <td className="p-1"></td>
                                    </tr>
                                ))}
                                <tr className="font-bold border-b border-slate-900 bg-slate-50 text-sm">
                                    <td colSpan="7" className="border-r border-slate-900 p-2 text-right">รวมเงิน</td>
                                    <td className="border-r border-slate-900 p-2 text-right font-bold">{formatCurrencyThai(project.estimated_budget)}</td>
                                    <td className="border-r border-slate-900 p-2"></td>
                                    <td className="border-r border-slate-900 p-2"></td>
                                    <td className="p-2"></td>
                                </tr>
                                <tr className="font-bold bg-slate-100 text-sm sm:text-base">
                                    <td colSpan="7" className="border-r border-slate-900 p-2.5 text-right">งบประมาณรวมทั้งโครงการ</td>
                                    <td colSpan="4" className="p-2.5 text-center font-bold">{formatCurrencyThai(project.estimated_budget)} บาท</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Section 12: Approvers Block */}
                    <div className="pt-8 page-break-inside-avoid font-sarabun">
                        <p className="font-bold text-base sm:text-lg text-slate-900 mb-5">๑๒. ผู้เห็นชอบและผู้อนุมัติโครงการ{toThaiNumerals(project.title)}</p>
                        
                        <div className="space-y-8 text-sm sm:text-base">
                            {/* Row 1: Proposer & Head of Department */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                {/* Signature 1 */}
                                <div className="flex justify-center">
                                    <table className="border-collapse font-sarabun text-center">
                                        <tbody>
                                            <tr>
                                                <td className="text-right whitespace-nowrap pr-0.5">ลงชื่อ</td>
                                                <td className="text-center whitespace-nowrap">..............................................</td>
                                                <td className="text-left whitespace-nowrap pl-0.5">ผู้เสนอโครงการ</td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center font-bold whitespace-nowrap pt-1">
                                                    ({toThaiNumerals(project.responsible_person || project.user?.name || 'นางสาวฉัตรนภา ถิ่นมีกุล')})
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center text-xs sm:text-sm leading-snug pt-0.5 font-normal max-w-[210px]">
                                                    {toThaiNumerals(project.position || 'หัวหน้างานส่งเสริมธุรกิจและการเป็นผู้ประกอบการ')}
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center text-xs pt-1 font-normal text-slate-700 whitespace-nowrap">
                                                    วันที่ ....... เดือน ............................ พ.ศ. ...............
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Signature 2: Head of Department */}
                                <div className="flex justify-center">
                                    <table className="border-collapse font-sarabun text-center">
                                        <tbody>
                                            <tr>
                                                <td className="text-right whitespace-nowrap pr-0.5">ลงชื่อ</td>
                                                <td className="text-center whitespace-nowrap">..............................................</td>
                                                <td className="text-left whitespace-nowrap pl-0.5">ผู้เห็นชอบโครงการ</td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center font-bold whitespace-nowrap pt-1">
                                                    (......................................................)
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center text-xs sm:text-sm leading-snug pt-0.5 font-normal max-w-[210px]">
                                                    {toThaiNumerals(project.department?.name ? `หัวหน้า${project.department.name}` : 'หัวหน้าแผนกวิชา / หัวหน้างาน')}
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center text-xs pt-1 font-normal text-slate-700 whitespace-nowrap">
                                                    วันที่ ....... เดือน ............................ พ.ศ. ...............
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Row 2: Planning Head & Deputy Director */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                {/* Signature 3: Head of Planning */}
                                <div className="flex justify-center">
                                    <table className="border-collapse font-sarabun text-center">
                                        <tbody>
                                            <tr>
                                                <td className="text-right whitespace-nowrap pr-0.5">ลงชื่อ</td>
                                                <td className="text-center whitespace-nowrap">..............................................</td>
                                                <td className="text-left whitespace-nowrap pl-0.5">ผู้เห็นชอบโครงการ</td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center font-bold whitespace-nowrap pt-1">
                                                    (นายนิพนธ์ ร่องพืช)
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center text-xs sm:text-sm leading-snug pt-0.5 font-normal max-w-[210px]">
                                                    หัวหน้างานแผนงานและความร่วมมือ
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center text-xs pt-1 font-normal text-slate-700 whitespace-nowrap">
                                                    วันที่ ....... เดือน ............................ พ.ศ. ...............
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Signature 4: Deputy Director */}
                                <div className="flex justify-center">
                                    <table className="border-collapse font-sarabun text-center">
                                        <tbody>
                                            <tr>
                                                <td className="text-right whitespace-nowrap pr-0.5">ลงชื่อ</td>
                                                <td className="text-center whitespace-nowrap">..............................................</td>
                                                <td className="text-left whitespace-nowrap pl-0.5">ผู้เห็นชอบโครงการ</td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center font-bold whitespace-nowrap pt-1">
                                                    (นายจักรพงศ์ พรหมสกุลปัญญา)
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center text-xs sm:text-sm leading-snug pt-0.5 font-normal max-w-[210px]">
                                                    รองผู้อำนวยการฝ่ายแผนงานและความร่วมมือ
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center text-xs pt-1 font-normal text-slate-700 whitespace-nowrap">
                                                    วันที่ ....... เดือน ............................ พ.ศ. ...............
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Row 3: Final Director Approval */}
                            <div className="pt-2 flex justify-center">
                                <table className="border-collapse font-sarabun text-center">
                                    <tbody>
                                        <tr>
                                            <td className="text-right whitespace-nowrap pr-0.5">ลงชื่อ</td>
                                            <td className="text-center whitespace-nowrap">..............................................</td>
                                            <td className="text-left whitespace-nowrap pl-0.5">ผู้อนุมัติโครงการ</td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td className="text-center font-bold text-base sm:text-lg whitespace-nowrap pt-1">
                                                (นายกเชษฐ์ กิ่งชนะ)
                                            </td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td className="text-center text-sm font-semibold leading-snug pt-0.5">
                                                ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน
                                            </td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td className="text-center text-xs pt-1 font-normal text-slate-700 whitespace-nowrap">
                                                วันที่ ....... เดือน ............................ พ.ศ. ...............
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}......</td>
                                                <td className="text-left whitespace-nowrap pl-0.5">ผู้เห็นชอบโครงการ</td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center font-bold whitespace-nowrap pt-1">
                                                    (นายนิพนธ์ ร่องพืช)
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center text-xs sm:text-sm leading-snug pt-0.5 font-normal max-w-[210px]">
                                                    รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center text-xs pt-1 font-normal text-slate-700 whitespace-nowrap">
                                                    วันที่ ....... เดือน ............................ พ.ศ. ...............
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Signature 4 */}
                                <div className="flex justify-center">
                                    <table className="border-collapse font-sarabun text-center">
                                        <tbody>
                                            <tr>
                                                <td className="text-right whitespace-nowrap pr-0.5">ลงชื่อ</td>
                                                <td className="text-center whitespace-nowrap">..............................................</td>
                                                <td className="text-left whitespace-nowrap pl-0.5">ผู้เห็นชอบโครงการ</td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center font-bold whitespace-nowrap pt-1">
                                                    (นายจักรพงศ์ พรหมสกุลปัญญา)
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center text-xs sm:text-sm leading-snug pt-0.5 font-normal max-w-[210px]">
                                                    รองผู้อำนวยการฝ่ายบริหารทรัพยากร
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td className="text-center text-xs pt-1 font-normal text-slate-700 whitespace-nowrap">
                                                    วันที่ ....... เดือน ............................ พ.ศ. ...............
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Row 3: Final Director Approval */}
                            <div className="pt-2 flex justify-center">
                                <table className="border-collapse font-sarabun text-center">
                                    <tbody>
                                        <tr>
                                            <td className="text-right whitespace-nowrap pr-0.5">ลงชื่อ</td>
                                            <td className="text-center whitespace-nowrap">..............................................</td>
                                            <td className="text-left whitespace-nowrap pl-0.5">ผู้อนุมัติโครงการ</td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td className="text-center font-bold text-base sm:text-lg whitespace-nowrap pt-1">
                                                (นายกเชษฐ์ กิ่งชนะ)
                                            </td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td className="text-center text-sm font-semibold leading-snug pt-0.5">
                                                ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน
                                            </td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td className="text-center text-xs pt-1 font-normal text-slate-700 whitespace-nowrap">
                                                วันที่ ....... เดือน ............................ พ.ศ. ...............
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
