import { Head, usePage, Link } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { processSignatureImage } from '@/Components/SignaturePad';

function AutoTrimmedSignature({ src, className, style, alt = "ลายมือชื่อ" }) {
    const isValid = typeof src === 'string' && src.trim().length > 20 && src !== 'null' && src !== 'undefined';
    const [trimmedSrc, setTrimmedSrc] = useState(isValid ? src : null);

    useEffect(() => {
        if (!isValid) {
            setTrimmedSrc(null);
            return;
        }
        setTrimmedSrc(src);
        processSignatureImage(src, (result) => {
            if (result) setTrimmedSrc(result);
        });
    }, [src, isValid]);

    if (!isValid) return null;

    return (
        <img 
            src={trimmedSrc || src} 
            alt={alt} 
            className={className} 
            style={style} 
        />
    );
}

// Shared Utility Functions
const cleanPersonName = (name) => {
    if (!name) return '';
    let cleaned = String(name).replace(/\s*\([^)]*\)/g, '').trim();
    cleaned = cleaned.replace(/^\(+|\)+$/g, '').trim();
    return cleaned;
};

const toArabicNumerals = (val) => {
    if (val === null || val === undefined) return '';
    const thaiToArabic = {
        '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
        '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9'
    };
    return String(val).replace(/[๐-๙]/g, (ch) => thaiToArabic[ch] || ch);
};
const toThaiNumerals = toArabicNumerals;

const formatCurrencyThai = (value) => {
    const formatted = new Intl.NumberFormat('th-TH', { style: 'decimal', minimumFractionDigits: 0 }).format(value || 0);
    return toArabicNumerals(formatted);
};

const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const formatThaiSignatureDate = (dateStr) => {
    if (!dateStr) return 'วันที่ ........ เดือน .................... พ.ศ. ............';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'วันที่ ........ เดือน .................... พ.ศ. ............';
        const day = toThaiNumerals(date.getDate());
        const month = thaiMonths[date.getMonth()];
        const year = toThaiNumerals(date.getFullYear() + 543);
        return `วันที่ ${day} เดือน ${month} พ.ศ. ${year}`;
    } catch (e) {
        return 'วันที่ ........ เดือน .................... พ.ศ. ............';
    }
};

// Single Project Proposal Template Component (1:1 identical to Projects/Print.jsx)
function SingleProjectProposalDocument({
    project,
    strategyCategories = [],
    includeSignatures = true,
    printDateMode = 'uniform',
    customPrintDate = '',
    college_settings = {},
    departments_data = {},
    fontStyles = {},
}) {
    const formatProjectTitleForApproval = (title) => {
        if (!title) return '';
        let clean = title.trim();
        clean = clean.replace(/^(โครงการ|กิจกรรม)\s*/, '');
        return clean;
    };
    const formattedProjectTitle = formatProjectTitleForApproval(project.title);

    const getApprovalByStep = (step) => {
        return project.approvals?.find(a => a.step_number === step && (a.status === 'approved' || a.status === 'submitted'));
    };

    const cleanPositionText = (pos) => {
        if (!pos) return '';
        return pos.replace(/\s*\([^)]*ฝ่าย[^)]*\)/g, '').replace(/\s*\(ฝ่ายวิชาการ\)/g, '').trim();
    };

    const sig1 = getApprovalByStep(1);
    const sig2 = getApprovalByStep(2);
    const sig3 = getApprovalByStep(3);
    const sig4 = getApprovalByStep(4);
    const sig5 = getApprovalByStep(5);
    const sig6 = getApprovalByStep(6);

    const isFastTrackApproval = (sig) => {
        if (!sig) return false;
        if (sig.signature_type === 'fast_track' || sig.signature_type === 'admin') return true;
        if (sig.comments && (
            sig.comments.includes('รวดเดียว') || 
            sig.comments.includes('Fast-Track') || 
            sig.comments.includes('Super Override') ||
            sig.comments.includes('มติงานยุทธศาสตร์')
        )) return true;
        if (sig.step_number >= 2 && sig2?.user_id && sig3?.user_id && sig2.user_id === sig3.user_id && (sig2.user_id === sig5?.user_id || sig2.user_id === sig6?.user_id)) {
            return true;
        }
        return false;
    };

    const deptName = project.department?.name || '';
    const proposerPos = cleanPositionText(project.position || project.user?.position || '');
    const isHeadProposer = Boolean(
        (proposerPos && proposerPos.includes('หัวหน้า')) ||
        (project.proposer_duty && ['หัวหน้างาน', 'หัวหน้าสาขาวิชา', 'หัวหน้าแผนกวิชา'].includes(project.proposer_duty))
    );

    const getSelectedCategoryItems = (category) => {
        const selections = project.strategy_selections || {};
        const catSelections = selections[category.id] || selections[String(category.id)];
        if (Array.isArray(catSelections) && catSelections.length > 0) {
            return (category.items || []).filter(item => catSelections.includes(item.id) || catSelections.includes(String(item.id)));
        }
        if (category.code === 'IQA' && Array.isArray(project.iqa_strategy_ids)) {
            return (category.items || []).filter(item => project.iqa_strategy_ids.includes(item.id));
        }
        if (category.code === 'OVEC' && Array.isArray(project.ovec_strategy_ids)) {
            return (category.items || []).filter(item => project.ovec_strategy_ids.includes(item.id));
        }
        return [];
    };

    const resourceDeputySig = project.approvals?.find(a => 
        (a.status === 'approved' || a.status === 'submitted') && 
        a.step_number > 1 &&
        a.step_number !== 6 &&
        a.user_id !== project.user_id &&
        (
            a.user?.name?.includes('จักรพงศ์') ||
            a.acting_position_text?.includes('บริหารทรัพยากร') ||
            (a.user?.position?.includes('รองผู้อำนวยการ') && a.user?.position?.includes('บริหารทรัพยากร'))
        )
    );

    const getRelatedDeputyName = () => {
        if (sig4?.acting_signatory_name) {
            return toThaiNumerals(cleanPersonName(sig4.acting_signatory_name));
        }
        if (sig4?.user?.name && !isFastTrackApproval(sig4) && sig4.user_id !== project.user_id) {
            return toThaiNumerals(cleanPersonName(sig4.user.name));
        }
        if (project.department?.deputy_director_name) {
            return toThaiNumerals(cleanPersonName(project.department.deputy_director_name));
        }
        if (project.department?.parent?.deputy_director_name) {
            return toThaiNumerals(cleanPersonName(project.department.parent.deputy_director_name));
        }
        const parentName = project.department?.parent?.name || '';
        const curDeptName = project.department?.name || '';
        const combined = `${parentName} ${curDeptName}`;
        if (combined.includes('วิชาการ')) {
            return toThaiNumerals(cleanPersonName(college_settings?.academic_deputy_name || 'นายนิพนธ์ ร่องพืช'));
        }
        if (combined.includes('บริหารทรัพยากร')) {
            return toThaiNumerals(cleanPersonName(college_settings?.resource_deputy_name || 'นายจักรพงศ์ พรหมสกุลปัญญา'));
        }
        if (combined.includes('กิจการนักเรียน') || combined.includes('พัฒนากิจการ')) {
            return toThaiNumerals(cleanPersonName(college_settings?.student_affairs_deputy_name || 'นายวิทยา ปันโน'));
        }
        if (combined.includes('ยุทธศาสตร์') || combined.includes('แผนงาน')) {
            return getPlanDeputyName();
        }
        return '...............................................';
    };

    const getPlanDeputyName = () => {
        if (sig5?.acting_signatory_name) {
            return toThaiNumerals(cleanPersonName(sig5.acting_signatory_name));
        }
        if (sig5?.user?.name && !isFastTrackApproval(sig5) && sig5.user_id !== project.user_id) {
            return toThaiNumerals(cleanPersonName(sig5.user.name));
        }
        const planDept = departments_data?.divisions?.find(d => 
            d.name?.includes('ยุทธศาสตร์') || d.name?.includes('แผนงาน')
        );
        if (planDept?.deputy_director_name) {
            return toThaiNumerals(cleanPersonName(planDept.deputy_director_name));
        }
        if (college_settings?.plan_deputy_name) {
            return toThaiNumerals(cleanPersonName(college_settings.plan_deputy_name));
        }
        return toThaiNumerals('นายนิพนธ์ ร่องพืช');
    };

    const getPlanDeputyPosition = () => {
        if (!isFastTrackApproval(sig5) && sig5?.user_id !== project.user_id) {
            if (sig5?.acting_position_text) {
                return toThaiNumerals(sig5.acting_position_text);
            }
            if (sig5?.user?.position_level) {
                return toThaiNumerals(sig5.user.position_level);
            }
        }
        const planDept = departments_data?.divisions?.find(d => 
            d.name?.includes('ยุทธศาสตร์') || d.name?.includes('แผนงาน')
        );
        if (planDept?.deputy_director_position) {
            return toThaiNumerals(planDept.deputy_director_position);
        }
        if (college_settings?.plan_deputy_position) {
            return toThaiNumerals(college_settings.plan_deputy_position);
        }
        return 'รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน';
    };

    const getRelatedDeputyPosition = () => {
        if (!isFastTrackApproval(sig4) && sig4?.user_id !== project.user_id) {
            if (sig4?.acting_position_text) return toThaiNumerals(sig4.acting_position_text);
            if (sig4?.user?.position_level) return toThaiNumerals(sig4.user.position_level);
        }
        if (project.department?.deputy_director_position) return toThaiNumerals(project.department.deputy_director_position);
        if (project.department?.parent?.deputy_director_position) return toThaiNumerals(project.department.parent.deputy_director_position);
        const parentName = project.department?.parent?.name || '';
        const curDeptName = project.department?.name || '';
        if (parentName) {
            return toThaiNumerals(parentName.startsWith('ฝ่าย') ? `รองผู้อำนวยการ${parentName}` : `รองผู้อำนวยการฝ่าย${parentName}`);
        }
        if (curDeptName.startsWith('ฝ่าย')) {
            return toThaiNumerals(`รองผู้อำนวยการ${curDeptName}`);
        }
        return 'รองผู้อำนวยการฝ่ายที่เกี่ยวข้อง';
    };

    const getEffectiveDirectorSignature = () => {
        if (sig6?.signature_data && !isFastTrackApproval(sig6)) return sig6.signature_data;
        if (college_settings?.director_signature) return college_settings.director_signature;
        if (sig6?.user?.signature_data) return sig6.user.signature_data;
        if (sig6?.signature_data) return sig6.signature_data;
        return null;
    };

    const getEffectivePlanDeputySignature = () => {
        if (sig5?.signature_data && !isFastTrackApproval(sig5) && sig5.user_id !== project.user_id) return sig5.signature_data;
        if (college_settings?.plan_deputy_signature) return college_settings.plan_deputy_signature;
        if (sig5?.user?.signature_data && sig5.user_id !== project.user_id) return sig5.user.signature_data;
        if (sig5?.signature_data && sig5.user_id !== project.user_id) return sig5.signature_data;
        return null;
    };

    const getEffectiveResourceDeputySignature = () => {
        if (resourceDeputySig?.signature_data && !isFastTrackApproval(resourceDeputySig)) return resourceDeputySig.signature_data;
        if (college_settings?.resource_deputy_signature) return college_settings.resource_deputy_signature;
        if (resourceDeputySig?.user?.signature_data) return resourceDeputySig.user.signature_data;
        if (resourceDeputySig?.signature_data) return resourceDeputySig.signature_data;
        return null;
    };

    const getEffectiveRelatedDeputySignature = () => {
        if (sig4?.signature_data && !isFastTrackApproval(sig4) && sig4.user_id !== project.user_id) return sig4.signature_data;
        const parentName = project.department?.parent?.name || '';
        const curDeptName = project.department?.name || '';
        const combined = `${parentName} ${curDeptName}`;

        let preset = null;
        if (combined.includes('วิชาการ')) preset = college_settings?.academic_deputy_signature || null;
        else if (combined.includes('บริหารทรัพยากร')) preset = college_settings?.resource_deputy_signature || null;
        else if (combined.includes('กิจการนักเรียน') || combined.includes('พัฒนากิจการ')) preset = college_settings?.student_affairs_deputy_signature || null;
        else if (combined.includes('ยุทธศาสตร์') || combined.includes('แผนงาน')) preset = college_settings?.plan_deputy_signature || null;
        
        if (preset) return preset;
        if (sig4?.user?.signature_data && sig4.user_id !== project.user_id) return sig4.user.signature_data;
        if (sig4?.signature_data && sig4.user_id !== project.user_id) return sig4.signature_data;
        return null;
    };

    const getEffectivePlanHeadSignature = () => {
        if (sig3?.signature_data && !isFastTrackApproval(sig3)) return sig3.signature_data;
        if (college_settings?.plan_head_signature) return college_settings.plan_head_signature;
        if (sig3?.user?.signature_data) return sig3.user.signature_data;
        if (sig3?.signature_data) return sig3.signature_data;
        return null;
    };

    const getSigningDate = (stepSig, fallbackDate = null) => {
        if (!includeSignatures || printDateMode === 'blank') {
            return 'วันที่ ........ เดือน .................... พ.ศ. ............';
        }
        if (printDateMode === 'uniform') {
            return customPrintDate 
                ? formatThaiSignatureDate(customPrintDate) 
                : 'วันที่ ........ เดือน .................... พ.ศ. ............';
        }
        const actualDate = stepSig?.signed_at || fallbackDate;
        if (actualDate && !isFastTrackApproval(stepSig)) {
            return formatThaiSignatureDate(actualDate);
        }
        return 'วันที่ ........ เดือน .................... พ.ศ. ............';
    };

    const outputs = Array.isArray(project.outputs) ? project.outputs : [];
    const outcomes = Array.isArray(project.outcomes) ? project.outcomes : [];
    const expected_benefits = Array.isArray(project.expected_benefits) ? project.expected_benefits : [];

    const defaultActionPlan = [
        {
            step_name: 'ขั้นเตรียมการ (Plan) : ประชุมวางแผน แต่งตั้งคณะทำงาน และจัดเตรียมเอกสารวัสดุอุปกรณ์',
            q1: true, q2: false, q3: false, q4: false,
            target_count: '1 ครั้ง',
            location_name: project.location || 'วิทยาลัยสารพัดช่างน่าน',
            budget_operating: 0, budget_investment: 0, budget_other: 0, budget_subsidy: 0
        },
        {
            step_name: 'ขั้นดำเนินการ (Do) : ดำเนินกิจกรรมตามวัตถุประสงค์และแผนปฏิบัติการของโครงการ',
            q1: false, q2: true, q3: true, q4: false,
            target_count: 'ตามกลุ่มเป้าหมาย',
            location_name: project.location || 'วิทยาลัยสารพัดช่างน่าน',
            budget_operating: parseFloat(project.allocated_budget || project.estimated_budget || 0),
            budget_investment: 0, budget_other: 0, budget_subsidy: 0
        },
        {
            step_name: 'ขั้นตรวจสอบและประเมินผล (Check) : ประเมินผลความพึงพอใจและสรุปผลสัมฤทธิ์ตามตัวชี้วัด',
            q1: false, q2: false, q3: true, q4: true,
            target_count: 'ร้อยละ 100',
            location_name: project.location || 'วิทยาลัยสารพัดช่างน่าน',
            budget_operating: 0, budget_investment: 0, budget_other: 0, budget_subsidy: 0
        },
        {
            step_name: 'ขั้นสรุปและรายงานผล (Act) : จัดทำรูปเล่มรายงานผลโครงการ 5 บท และข้อเสนอแนะเพื่อพัฒนา',
            q1: false, q2: false, q3: false, q4: true,
            target_count: '1 เล่ม',
            location_name: project.location || 'วิทยาลัยสารพัดช่างน่าน',
            budget_operating: 0, budget_investment: 0, budget_other: 0, budget_subsidy: 0
        }
    ];

    const cleanedResponsiblePerson = cleanPersonName(project.responsible_person || project.user?.name || '-');

    return (
        <div className="single-project-proposal print-doc-container font-sarabun max-w-4xl mx-auto bg-white p-8 md:p-12 mb-8 shadow-sm border border-slate-200 rounded-lg print:shadow-none print:border-none print:p-0 print:mb-0 print:rounded-none print:max-w-none text-slate-900 leading-normal">
            {/* Header */}
            <div className="text-center font-bold mb-6 space-y-0.5 font-sarabun">
                <h1 className="text-lg md:text-xl font-bold text-slate-900">
                    โครงการ/กิจกรรม ตาม พ.ร.บ. งบประมาณ ประจำปีงบประมาณ พ.ศ. {toThaiNumerals(project.academic_year || 2569)}
                </h1>
                <div className="border-b-2 border-slate-900 w-56 mx-auto my-1.5"></div>
                <h2 className="text-base md:text-lg font-bold text-slate-900">
                    {project.department?.name || 'งานส่งเสริมธุรกิจและการเป็นผู้ประกอบการ ฝ่ายยุทธศาสตร์และแผนงาน'} วิทยาลัยสารพัดช่างน่าน
                </h2>
            </div>

            {/* Section 1-9: Official Text Content */}
            <div className="space-y-4 font-sarabun text-justify">
                {/* Section 1: Title & Responsible Person */}
                <div>
                    <p className="print-title font-bold text-slate-900">
                        1. ชื่อโครงการ: <span className="font-semibold text-slate-900">{toArabicNumerals(project.title)}</span>
                    </p>
                    <div className="pl-6 pt-1 space-y-0.5 text-slate-900 leading-relaxed">
                        <p><span className="font-bold">ผู้รับผิดชอบโครงการ ชื่อ-สกุล :</span> {toArabicNumerals(cleanedResponsiblePerson)}</p>
                        <p><span className="font-bold">ตำแหน่ง :</span> {toArabicNumerals(cleanPositionText(project.position || project.user?.position || (deptName ? (deptName.startsWith('ฝ่าย') ? `เจ้าหน้าที่งาน${deptName.replace(/^ฝ่าย/, '')}` : (deptName.startsWith('งาน') ? `เจ้าหน้าที่${deptName}` : `เจ้าหน้าที่${deptName}`)) : 'เจ้าหน้าที่ผู้รับผิดชอบโครงการ')))}</p>
                        <p><span className="font-bold">โทรศัพท์เคลื่อนที่ :</span> {toArabicNumerals(project.phone || project.user?.phone || '-')} &nbsp;&nbsp;&nbsp;&nbsp; <span className="font-bold">E-mail :</span> {project.email || project.user?.email || '-'}</p>
                    </div>
                </div>

                {/* Section 2: Characteristics & Strategic Alignment */}
                <div>
                    <p className="print-title font-bold text-slate-900">2. ลักษณะโครงการ</p>
                    <div className="pl-6 pt-1 text-slate-900 space-y-1.5 leading-relaxed">
                        <div>
                            <p className="font-semibold">2.1 สอดคล้องกับแผนพัฒนาการจัดการศึกษาของสถานศึกษา (พ.ศ. 2568-2570) วิทยาลัยสารพัดช่างน่าน</p>
                            <p className="pl-6 pt-0.5"><span className="font-bold">- พันธกิจที่ 1</span> {toArabicNumerals(project.mission || 'ผลิตและพัฒนากำลังคนด้านวิชาชีพให้มีคุณภาพตามมาตรฐานการอาชีวศึกษา')}</p>
                            <p className="pl-6 pt-0.5"><span className="font-bold">- เป้าประสงค์</span> {toArabicNumerals(project.goal || 'ผู้เรียนและผู้สำเร็จการศึกษามีความรู้ ทักษะ การประยุกต์ใช้และมีคุณธรรม จริยธรรม ตามมาตรฐานวิชาชีพ')}</p>
                            <p className="pl-6 pt-0.5"><span className="font-bold">- กลยุทธ์ที่ 1</span> {toArabicNumerals(project.strategy_tactic || 'ส่งเสริมด้านวิชาการ คุณธรรม จริยธรรม และค่านิยมที่ดีงามในวิชาชีพ')}</p>
                        </div>

                        {strategyCategories && strategyCategories.length > 0 && (
                            <div className="pt-0.5 space-y-1.5">
                                <p className="font-semibold">2.2 สอดคล้องกับยุทธศาสตร์ นโยบาย และมาตรฐานการอาชีวศึกษา:</p>
                                <div className="pl-6 space-y-1.5">
                                    {strategyCategories.map((cat, catIdx) => {
                                        const selectedItems = getSelectedCategoryItems(cat);
                                        return (
                                            <div key={cat.id} className="space-y-0.5">
                                                <p className="font-bold text-slate-900">
                                                    2.2.{toArabicNumerals(catIdx + 1)} {toArabicNumerals(cat.name)}
                                                </p>
                                                {selectedItems.map((item, itemIdx) => {
                                                    let itemName = (item.name || item.title || '').trim();
                                                    itemName = itemName.replace(/^\[.*?\]\s*/, '');
                                                    itemName = itemName.replace(/^(IQA|OVEC)\s*([0-9๑-๙]+)?\s*[:\.\-]?\s*/i, '');
                                                    const fullDisplayName = item.group_name ? `${item.group_name} : ${itemName}` : itemName;
                                                    return (
                                                        <p key={item.id || itemIdx} className="pl-6 text-slate-800">
                                                            <span className="font-bold pr-1">{toArabicNumerals(itemIdx + 1)})</span> {toArabicNumerals(fullDisplayName)}
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

                {/* Section 3: Background Rationale */}
                <div>
                    <p className="print-title font-bold text-slate-900">3. ความสำคัญของโครงการ/ หลักการและเหตุผล</p>
                    <div className="pt-1.5 text-slate-900 space-y-2 leading-relaxed text-justify">
                        {project.background_rationale ? (
                            project.background_rationale.split('\n\n').map((paragraph, pIdx) => {
                                const trimmed = paragraph.trim();
                                if (!trimmed) return null;
                                return (
                                    <p key={pIdx} className="thai-indent" style={{ textIndent: '2.5cm' }}>
                                        {toArabicNumerals(trimmed)}
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
                    <p className="print-title font-bold text-slate-900">4. วัตถุประสงค์ของโครงการ:</p>
                    <div className="pl-6 pt-1 text-slate-900 space-y-0.5 leading-relaxed">
                        {Array.isArray(project.objectives) && project.objectives.length > 0 ? (
                            project.objectives.map((obj, i) => (
                                <p key={i}>4.{toArabicNumerals(i + 1)} {toArabicNumerals(obj)}</p>
                            ))
                        ) : (
                            <p>4.1 {toArabicNumerals(project.objectives || '-')}</p>
                        )}
                    </div>
                </div>

                {/* Section 5: Outputs */}
                <div>
                    <p className="print-title font-bold text-slate-900">5. ผลผลิตโครงการ (Output)</p>
                    <div className="pl-6 pt-1 text-slate-900 space-y-0.5 leading-relaxed">
                        {outputs.length > 0 ? (
                            outputs.map((op, i) => <p key={i}>5.{toArabicNumerals(i + 1)} {toArabicNumerals(op)}</p>)
                        ) : (
                            <>
                                <p>5.1 ผู้เข้าร่วมโครงการได้รับการอบรมและพัฒนาสมรรถนะครบถ้วนตามหลักเกณฑ์ที่กำหนด</p>
                                <p>5.2 มีเอกสาร สื่อการเรียนรู้ หรือผลงานจากการดำเนินโครงการที่นำไปใช้ประโยชน์ได้จริง</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Section 6: Outcomes */}
                <div>
                    <p className="print-title font-bold text-slate-900">6. ผลลัพธ์โครงการ (Outcome)</p>
                    <div className="pl-6 pt-1 text-slate-900 space-y-0.5 leading-relaxed">
                        {outcomes.length > 0 ? (
                            outcomes.map((oc, i) => <p key={i}>6.{toArabicNumerals(i + 1)} {toArabicNumerals(oc)}</p>)
                        ) : (
                            <>
                                <p>6.1 ผู้เรียนและบุคลากรสามารถนำองค์ความรู้และทักษะจากโครงการไปประยุกต์ใช้ในการปฏิบัติงานจริงได้อย่างมีประสิทธิภาพ</p>
                                <p>6.2 สถานศึกษามีมาตรฐานการจัดการเรียนการสอนและการบริการวิชาชีพที่ได้รับการยอมรับ</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Section 7: Target Groups */}
                <div>
                    <p className="print-title font-bold text-slate-900">7. กลุ่มเป้าหมาย</p>
                    <div className="pl-6 pt-1 text-slate-900 space-y-1 leading-relaxed">
                        <p className="font-bold">7.1 เชิงปริมาณ</p>
                        {Array.isArray(project.targets?.quantitative) && project.targets.quantitative.length > 0 ? (
                            project.targets.quantitative.map((q, i) => <p key={i} className="pl-6">7.1.{toArabicNumerals(i + 1)} {toArabicNumerals(q)}</p>)
                        ) : (
                            <p className="pl-6">7.1.1 {toArabicNumerals(project.targets?.quantitative || '-')}</p>
                        )}
                        <p className="font-bold pt-0.5">7.2 เชิงคุณภาพ</p>
                        {Array.isArray(project.targets?.qualitative) && project.targets.qualitative.length > 0 ? (
                            project.targets.qualitative.map((q, i) => <p key={i} className="pl-6">7.2.{toArabicNumerals(i + 1)} {toArabicNumerals(q)}</p>)
                        ) : (
                            <p className="pl-6">7.2.1 {toArabicNumerals(project.targets?.qualitative || '-')}</p>
                        )}
                    </div>
                </div>

                {/* Section 8: Location */}
                <div>
                    <p className="print-title font-bold text-slate-900">8. พื้นที่ดำเนินการ : <span className="font-normal">{toArabicNumerals(project.location || 'ณ วิทยาลัยสารพัดช่างน่าน')}</span></p>
                </div>

                {/* Section 9: Expected Benefits */}
                <div>
                    <p className="print-title font-bold text-slate-900">9. ผลที่คาดว่าจะได้รับ</p>
                    <div className="pl-6 pt-1 text-slate-900 space-y-0.5 leading-relaxed">
                        {expected_benefits.length > 0 ? (
                            expected_benefits.map((eb, i) => <p key={i}>9.{toArabicNumerals(i + 1)} {toArabicNumerals(eb)}</p>)
                        ) : (
                            <>
                                <p>9.1 ผู้เข้าร่วมโครงการมีทักษะและสมรรถนะตรงตามมาตรฐานวิชาชีพและความต้องการของตลาดแรงงาน</p>
                                <p>9.2 สถานศึกษามีผลการดำเนินงานที่ตอบสนองต่อนโยบายของสำนักงานคณะกรรมการการอาชีวศึกษา</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Section 10: Indicators Table & Detailed Expenses */}
            <div className="pt-4 print-break-inside-avoid">
                <p className="print-title font-bold text-slate-900 mb-1.5">10. ตัวชี้วัดเป้าหมายโครงการ</p>
                <table className="print-table w-full border-collapse border border-slate-900 text-xs sm:text-sm font-sarabun">
                    <thead>
                        <tr className="bg-slate-50 text-center font-bold border-b border-slate-900">
                            <th className="border-r border-slate-900 p-1 w-28">ประเภทตัวชี้วัด</th>
                            <th className="border-r border-slate-900 p-1">ตัวชี้วัด</th>
                            <th className="p-1 w-32 text-center">หน่วยนับ / จำนวนเงิน</th>
                        </tr>
                    </thead>
                    <tbody>
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
                                    <p>{toArabicNumerals(project.targets?.quantitative || 'ผู้เข้าร่วมโครงการบรรลุตามเป้าหมายที่กำหนด คิดเป็นร้อยละ 100')}</p>
                                )}
                            </td>
                            <td className="p-1.5 text-center align-top font-bold">
                                {toArabicNumerals(project.indicators?.quantitative?.unit || (Array.isArray(project.targets?.quantitative) ? `${project.targets.quantitative.length} รายการ` : '100%'))}
                            </td>
                        </tr>

                        <tr className="border-b border-slate-900">
                            <td className="border-r border-slate-900 p-1.5 font-bold align-top">เชิงคุณภาพ</td>
                            <td className="border-r border-slate-900 p-1.5 space-y-0.5">
                                {project.indicators?.qualitative?.text ? (
                                    toArabicNumerals(project.indicators.qualitative.text).split('\n').map((line, idx) => (
                                        <p key={idx}>{line}</p>
                                    ))
                                ) : Array.isArray(project.targets?.qualitative) && project.targets.qualitative.length > 0 ? (
                                    project.targets.qualitative.map((t, idx) => (
                                        <p key={idx}>{toArabicNumerals(idx + 1)}. {toArabicNumerals(t)}</p>
                                    ))
                                ) : (
                                    <p>{toArabicNumerals(project.targets?.qualitative || 'ผู้เข้าร่วมมีความพึงพอใจต่อการดำเนินงานและได้รับความรู้ทักษะเพิ่มขึ้นในระดับดีมาก')}</p>
                                )}
                            </td>
                            <td className="p-1.5 text-center align-top font-bold">
                                {toArabicNumerals(project.indicators?.qualitative?.unit || 'ร้อยละ 90')}
                            </td>
                        </tr>

                        <tr className="border-b border-slate-900">
                            <td className="border-r border-slate-900 p-1.5 font-bold align-top">เชิงเวลา</td>
                            <td className="border-r border-slate-900 p-1.5 space-y-0.5">
                                {project.indicators?.time?.text ? (
                                    toArabicNumerals(project.indicators.time.text).split('\n').map((line, idx) => (
                                        <p key={idx}>{line}</p>
                                    ))
                                ) : (
                                    <p>ดำเนินโครงการแล้วเสร็จตามระยะเวลาและปฏิทินปฏิบัติงาน ประจำปีงบประมาณ พ.ศ. {toArabicNumerals(project.academic_year || 2569)}</p>
                                )}
                            </td>
                            <td className="p-1.5 text-center align-top font-bold">
                                {toArabicNumerals(project.indicators?.time?.unit || '1 ปีการศึกษา')}
                            </td>
                        </tr>

                        {/* Cost */}
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
                                                    {loanItems.length > 0 && (
                                                        <div className="pl-2 space-y-0.5 pt-0.5">
                                                            <p className="font-bold text-[11px] text-amber-900 underline">หมวดสัญญายืมเงิน:</p>
                                                            {loanItems.map((item, lIdx) => (
                                                                <div key={lIdx} className="flex justify-between text-[11px] pl-2 leading-tight">
                                                                    <span>- {toThaiNumerals(item.description)} ({toThaiNumerals(item.quantity)} {toThaiNumerals(item.unit)} x {formatCurrencyThai(item.unit_price)} บ.)</span>
                                                                    <span className="font-bold shrink-0 ml-2">{formatCurrencyThai(parseFloat(item.total_price) || ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)))} บาท</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {procItems.length > 0 && (
                                                        <div className="pl-2 space-y-0.5 pt-0.5">
                                                            <p className="font-bold text-[11px] text-indigo-900 underline">หมวดจัดซื้อจัดจ้างพัสดุ:</p>
                                                            {procItems.map((item, pIdx) => (
                                                                <div key={pIdx} className="flex justify-between text-[11px] pl-2 leading-tight">
                                                                    <span>- {toThaiNumerals(item.description)} ({toThaiNumerals(item.quantity)} {toThaiNumerals(item.unit)} x {formatCurrencyThai(item.unit_price)} บ.)</span>
                                                                    <span className="font-bold shrink-0 ml-2">{formatCurrencyThai(parseFloat(item.total_price) || ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)))} บาท</span>
                                                                </div>
                                                            ))}
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
                                ) : null}

                                <p className="font-bold text-right pt-1 text-sm sm:text-base">รวมงบประมาณทั้งสิ้นทั้งโครงการ</p>
                            </td>
                            <td className="p-1.5 text-right align-bottom font-bold">
                                <p className="pt-1 border-t-2 border-slate-900 text-sm sm:text-base font-bold text-slate-900">
                                    {formatCurrencyThai(project.allocated_budget || project.estimated_budget)} บาท
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Section 11: Action Plan & Budget Table */}
            <div className="pt-4 print-break-inside-avoid">
                <p className="print-title font-bold text-slate-900 mb-2">11. สรุปขั้นตอน/วิธีดำเนินการ และหมวดเงินที่ใช้</p>
                <table className="print-table w-full border-collapse border border-black text-xs font-sarabun text-center">
                    <thead>
                        <tr className="bg-slate-50 font-bold border-b border-black text-xs">
                            <th rowSpan="2" className="border border-black p-2 text-center w-[30%] font-bold">
                                ขั้นตอน/วิธีดำเนินการ
                            </th>
                            <th colSpan="4" className="border border-black p-1 text-center font-bold">
                                ดำเนินการ<br />ในไตรมาส<br />(✓)
                            </th>
                            <th rowSpan="2" className="border border-black p-1.5 text-center w-[16%] font-bold">
                                เป้าหมาย<br />
                                <span className="font-normal text-[11px] leading-tight block mt-0.5">(ใคร จำนวน ครั้ง เรื่อง)</span>
                            </th>
                            <th rowSpan="2" className="border border-black p-1.5 text-center w-[16%] font-bold">
                                พื้นที่ดำเนินการ<br />
                                <span className="font-normal text-[11px] leading-tight block mt-0.5">ระบุ ตำบล/อำเภอ</span>
                            </th>
                            <th colSpan="4" className="border border-black p-1 text-center font-bold">
                                หมวดเงิน<br />
                                <span className="font-normal text-[11px] block mt-0.5">(ระบุจำนวนเงิน : บาท)</span>
                            </th>
                        </tr>
                        <tr className="bg-slate-50 font-bold border-b border-black text-xs">
                            <th className="border border-black p-1 text-center font-bold w-6">1</th>
                            <th className="border border-black p-1 text-center font-bold w-6">2</th>
                            <th className="border border-black p-1 text-center font-bold w-6">3</th>
                            <th className="border border-black p-1 text-center font-bold w-6">4</th>
                            <th className="border border-black p-1 text-center font-bold w-16">งบดำเนินงาน</th>
                            <th className="border border-black p-1 text-center font-bold w-14">งบลงทุน</th>
                            <th className="border border-black p-1 text-center font-bold w-16">งบรายจ่ายอื่น</th>
                            <th className="border border-black p-1 text-center font-bold w-14">งบอุดหนุน</th>
                        </tr>
                    </thead>
                    <tbody>
                        {defaultActionPlan.map((row, idx) => (
                            <tr key={idx} className="border-b border-black">
                                <td className="border border-black p-2 text-left font-medium leading-relaxed align-top">
                                    {toThaiNumerals(row.step_name)}
                                </td>
                                <td className="border border-black p-0.5 text-center font-bold align-middle">
                                    {row.q1 ? '✓' : ''}
                                </td>
                                <td className="border border-black p-0.5 text-center font-bold align-middle">
                                    {row.q2 ? '✓' : ''}
                                </td>
                                <td className="border border-black p-0.5 text-center font-bold align-middle">
                                    {row.q3 ? '✓' : ''}
                                </td>
                                <td className="border border-black p-0.5 text-center font-bold align-middle">
                                    {row.q4 ? '✓' : ''}
                                </td>
                                <td className="border border-black p-1.5 text-center align-middle font-medium">
                                    {toThaiNumerals(row.target_count || '')}
                                </td>
                                <td className="border border-black p-1.5 text-center align-middle font-medium">
                                    {toThaiNumerals(row.location_name || '')}
                                </td>
                                <td className="border border-black p-1.5 text-right font-medium align-middle">
                                    {row.budget_operating > 0 ? formatCurrencyThai(row.budget_operating) : ''}
                                </td>
                                <td className="border border-black p-1.5 text-right font-medium align-middle">
                                    {row.budget_investment > 0 ? formatCurrencyThai(row.budget_investment) : ''}
                                </td>
                                <td className="border border-black p-1.5 text-right font-medium align-middle">
                                    {row.budget_other > 0 ? formatCurrencyThai(row.budget_other) : ''}
                                </td>
                                <td className="border border-black p-1.5 text-right font-medium align-middle">
                                    {row.budget_subsidy > 0 ? formatCurrencyThai(row.budget_subsidy) : ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Section 12: Approvals & Signatures (Exact same layout & styling as Projects/Print.jsx) */}
            <div className="pt-8 print-break-inside-avoid font-sarabun">
                <p className="print-title font-bold text-slate-900 mb-8 pl-[2.2rem] -indent-[2.2rem] leading-relaxed text-left" style={{ textWrap: 'pretty' }}>
                    12. การอนุมัติโครงการ{formattedProjectTitle ? toArabicNumerals(formattedProjectTitle) : '......................................................'}
                </p>

                <div className="space-y-8 font-sarabun" style={{ fontSize: 'var(--doc-font-size)', lineHeight: 'var(--doc-line-height)' }}>
                    {/* Row 1: ผู้เสนอโครงการ (ซ้าย) & ผู้เห็นชอบโครงการ: รองผู้อำนวยการฝ่ายที่เกี่ยวข้องกับงานดังกล่าว (ขวา) */}
                    <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6">
                        {/* ซ้าย: ผู้เสนอโครงการ */}
                        <div className="flex justify-center pl-2 sm:pl-4">
                            <div className="relative inline-flex flex-col items-center text-center font-sarabun">
                                <div className="relative flex items-center justify-center">
                                    <span className="absolute right-full mr-2 whitespace-nowrap font-normal bottom-0.5">
                                        ลงชื่อ
                                    </span>
                                    <div className="relative inline-flex flex-col items-center">
                                        {includeSignatures && (isFastTrackApproval(sig1) ? project.user?.signature_data : (sig1?.signature_data || project.user?.signature_data)) ? (
                                            <AutoTrimmedSignature 
                                                src={isFastTrackApproval(sig1) ? project.user?.signature_data : (sig1?.signature_data || project.user?.signature_data)} 
                                                alt="ลายมือชื่อ" 
                                                className="signature-img h-11 sm:h-12 max-w-[125px] sm:max-w-[140px] object-contain -mb-2 z-10" 
                                                style={{ mixBlendMode: 'multiply' }}
                                            />
                                        ) : (
                                            <div className="h-6"></div>
                                        )}
                                        <span className="border-b border-dotted border-slate-700 w-28 sm:w-32 inline-block mb-1"></span>
                                    </div>
                                    <span className="absolute left-full ml-2 whitespace-nowrap font-normal bottom-0.5">
                                        ผู้เสนอโครงการ
                                    </span>
                                </div>
                                <p className="font-bold pt-2 whitespace-nowrap">
                                    ({toThaiNumerals((!isFastTrackApproval(sig1) && sig1?.user?.name) ? cleanPersonName(sig1.user.name) : (cleanedResponsiblePerson || '...............................................'))})
                                </p>
                                <p className="leading-normal pt-0.5 font-normal max-w-[280px] text-slate-800">
                                    {project.position 
                                        ? toThaiNumerals(cleanPositionText(project.position)) 
                                        : (project.user?.position 
                                            ? toThaiNumerals(cleanPositionText(project.user.position)) 
                                            : (project.department?.name 
                                                ? toThaiNumerals(
                                                    cleanPositionText(
                                                        project.department.name.startsWith('ฝ่าย') 
                                                            ? `เจ้าหน้าที่งาน${project.department.name.replace(/^ฝ่าย/, '')}` 
                                                            : (project.department.name.startsWith('งาน') 
                                                                ? `เจ้าหน้าที่${project.department.name}` 
                                                                : `เจ้าหน้าที่${project.department.name}`)
                                                    )
                                                ) 
                                                : 'เจ้าหน้าที่ผู้เสนอโครงการ'))}
                                </p>
                                <p className="leading-normal pt-0.5 font-normal text-slate-700 whitespace-nowrap">
                                    {getSigningDate(sig1, sig1?.signed_at || project.created_at)}
                                </p>
                            </div>
                        </div>

                        {/* ขวา: ผู้เห็นชอบโครงการ (รองผู้อำนวยการฝ่ายที่เกี่ยวข้องกับงานดังกล่าว) */}
                        <div className="flex justify-center pr-4 sm:pr-8">
                            <div className="relative inline-flex flex-col items-center text-center font-sarabun">
                                <div className="relative flex items-center justify-center">
                                    <span className="absolute right-full mr-2 whitespace-nowrap font-normal bottom-0.5">
                                        ลงชื่อ
                                    </span>
                                    <div className="relative inline-flex flex-col items-center">
                                        {includeSignatures && getEffectiveRelatedDeputySignature() ? (
                                            <AutoTrimmedSignature 
                                                src={getEffectiveRelatedDeputySignature()} 
                                                alt="ลายมือชื่อ" 
                                                className="signature-img h-11 sm:h-12 max-w-[125px] sm:max-w-[140px] object-contain -mb-2 z-10" 
                                                style={{ mixBlendMode: 'multiply' }}
                                            />
                                        ) : (
                                            <div className="h-6"></div>
                                        )}
                                        <span className="border-b border-dotted border-slate-700 w-28 sm:w-32 inline-block mb-1"></span>
                                    </div>
                                    <span className="absolute left-full ml-2 whitespace-nowrap font-normal bottom-0.5">
                                        ผู้เห็นชอบโครงการ
                                    </span>
                                </div>
                                <p className="font-bold pt-2 whitespace-nowrap">
                                    ({getRelatedDeputyName()})
                                </p>
                                <p className="leading-normal pt-0.5 font-normal max-w-[280px] text-slate-800">
                                    {getRelatedDeputyPosition()}
                                </p>
                                <p className="leading-normal pt-0.5 font-normal text-slate-700 whitespace-nowrap">
                                    {getSigningDate(sig4)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: ผู้ตรวจสอบโครงการ: หัวหน้างานพัฒนายุทธศาสตร์ฯ (ซ้าย) & ผู้เห็นชอบโครงการ: รองผู้อำนวยการฝ่ายยุทธศาสตร์ฯ (ขวา) */}
                    <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6">
                        {/* ซ้าย: ผู้ตรวจสอบโครงการ (หัวหน้างานพัฒนายุทธศาสตร์ แผนงานและงบประมาณ) */}
                        <div className="flex justify-center pl-2 sm:pl-4">
                            <div className="relative inline-flex flex-col items-center text-center font-sarabun">
                                <div className="relative flex items-center justify-center">
                                    <span className="absolute right-full mr-2 whitespace-nowrap font-normal bottom-0.5">
                                        ลงชื่อ
                                    </span>
                                    <div className="relative inline-flex flex-col items-center">
                                        {includeSignatures && getEffectivePlanHeadSignature() ? (
                                            <AutoTrimmedSignature 
                                                src={getEffectivePlanHeadSignature()} 
                                                alt="ลายมือชื่อ" 
                                                className="signature-img h-11 sm:h-12 max-w-[125px] sm:max-w-[140px] object-contain -mb-2 z-10" 
                                                style={{ mixBlendMode: 'multiply' }}
                                            />
                                        ) : (
                                            <div className="h-6"></div>
                                        )}
                                        <span className="border-b border-dotted border-slate-700 w-28 sm:w-32 inline-block mb-1"></span>
                                    </div>
                                    <span className="absolute left-full ml-2 whitespace-nowrap font-normal bottom-0.5">
                                        ผู้ตรวจสอบโครงการ
                                    </span>
                                </div>
                                <p className="font-bold pt-2 whitespace-nowrap">
                                    ({!isFastTrackApproval(sig3) && sig3?.user?.name 
                                        ? toThaiNumerals(cleanPersonName(sig3.user.name)) 
                                        : toThaiNumerals(cleanPersonName(college_settings?.plan_head_name || 'นายพิพัฒน์ สีมา'))})
                                </p>
                                <p className="leading-normal pt-0.5 font-normal max-w-[280px] text-slate-800">
                                    {!isFastTrackApproval(sig3) && sig3?.acting_position_text
                                        ? toThaiNumerals(sig3.acting_position_text)
                                        : (!isFastTrackApproval(sig3) && sig3?.user?.position_level 
                                            ? toThaiNumerals(sig3.user.position_level) 
                                            : toThaiNumerals(college_settings?.plan_head_position || 'หัวหน้างานพัฒนายุทธศาสตร์ แผนงานและงบประมาณ'))}
                                </p>
                                <p className="leading-normal pt-0.5 font-normal text-slate-700 whitespace-nowrap">
                                    {getSigningDate(sig3)}
                                </p>
                            </div>
                        </div>

                        {/* ขวา: ผู้เห็นชอบโครงการ (รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน) */}
                        <div className="flex justify-center pr-4 sm:pr-8">
                            <div className="relative inline-flex flex-col items-center text-center font-sarabun">
                                <div className="relative flex items-center justify-center">
                                    <span className="absolute right-full mr-2 whitespace-nowrap font-normal bottom-0.5">
                                        ลงชื่อ
                                    </span>
                                    <div className="relative inline-flex flex-col items-center">
                                        {includeSignatures && getEffectivePlanDeputySignature() ? (
                                            <AutoTrimmedSignature 
                                                src={getEffectivePlanDeputySignature()} 
                                                alt="ลายมือชื่อ" 
                                                className="signature-img h-11 sm:h-12 max-w-[125px] sm:max-w-[140px] object-contain -mb-2 z-10" 
                                                style={{ mixBlendMode: 'multiply' }}
                                            />
                                        ) : (
                                            <div className="h-6"></div>
                                        )}
                                        <span className="border-b border-dotted border-slate-700 w-28 sm:w-32 inline-block mb-1"></span>
                                    </div>
                                    <span className="absolute left-full ml-2 whitespace-nowrap font-normal bottom-0.5">
                                        ผู้เห็นชอบโครงการ
                                    </span>
                                </div>
                                <p className="font-bold pt-2 whitespace-nowrap">
                                    ({getPlanDeputyName()})
                                </p>
                                <p className="leading-normal pt-0.5 font-normal max-w-[280px] text-slate-800">
                                    {getPlanDeputyPosition()}
                                </p>
                                <p className="leading-normal pt-0.5 font-normal text-slate-700 whitespace-nowrap">
                                    {getSigningDate(sig5)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Row 3: ผู้เห็นชอบโครงการ: รองผู้อำนวยการฝ่ายบริหารทรัพยากร (ตรงกลาง) */}
                    <div className="flex justify-center">
                        <div className="relative inline-flex flex-col items-center text-center font-sarabun">
                            <div className="relative flex items-center justify-center">
                                <span className="absolute right-full mr-2 whitespace-nowrap font-normal bottom-0.5">
                                    ลงชื่อ
                                </span>
                                <div className="relative inline-flex flex-col items-center">
                                    {includeSignatures && getEffectiveResourceDeputySignature() ? (
                                        <AutoTrimmedSignature 
                                            src={getEffectiveResourceDeputySignature()} 
                                            alt="ลายมือชื่อ" 
                                            className="signature-img h-11 sm:h-12 max-w-[125px] sm:max-w-[140px] object-contain -mb-2 z-10" 
                                            style={{ mixBlendMode: 'multiply' }}
                                        />
                                    ) : (
                                        <div className="h-6"></div>
                                    )}
                                    <span className="border-b border-dotted border-slate-700 w-32 sm:w-36 inline-block mb-1"></span>
                                </div>
                                <span className="absolute left-full ml-2 whitespace-nowrap font-normal bottom-0.5">
                                    ผู้เห็นชอบโครงการ
                                </span>
                            </div>
                            <p className="font-bold pt-2 whitespace-nowrap">
                                ({!isFastTrackApproval(resourceDeputySig) && resourceDeputySig?.user?.name 
                                    ? toThaiNumerals(cleanPersonName(resourceDeputySig.user.name)) 
                                    : toThaiNumerals(cleanPersonName(college_settings?.resource_deputy_name || 'นายจักรพงศ์ พรหมสกุลปัญญา'))})
                            </p>
                            <p className="leading-normal pt-0.5 font-normal max-w-[320px] text-slate-800">
                                {!isFastTrackApproval(resourceDeputySig) && resourceDeputySig?.acting_position_text
                                    ? toThaiNumerals(resourceDeputySig.acting_position_text)
                                    : (!isFastTrackApproval(resourceDeputySig) && resourceDeputySig?.user?.position_level 
                                        ? toThaiNumerals(resourceDeputySig.user.position_level) 
                                        : toThaiNumerals(college_settings?.resource_deputy_position || 'รองผู้อำนวยการฝ่ายบริหารทรัพยากร'))}
                            </p>
                            <p className="leading-normal pt-0.5 font-normal text-slate-700 whitespace-nowrap">
                                {getSigningDate(resourceDeputySig)}
                            </p>
                        </div>
                    </div>

                    {/* Row 4: ผู้อนุมัติโครงการ: ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน (ตรงกลาง) */}
                    <div className="flex justify-center">
                        <div className="relative inline-flex flex-col items-center text-center font-sarabun">
                            <div className="relative flex items-center justify-center">
                                <span className="absolute right-full mr-2 whitespace-nowrap font-normal bottom-0.5">
                                    ลงชื่อ
                                </span>
                                <div className="relative inline-flex flex-col items-center">
                                    {includeSignatures && getEffectiveDirectorSignature() ? (
                                        <AutoTrimmedSignature 
                                            src={getEffectiveDirectorSignature()} 
                                            alt="ลายมือชื่อ" 
                                            className="signature-img h-13 sm:h-14 max-w-[145px] sm:max-w-[160px] object-contain -mb-2.5 z-10" 
                                            style={{ mixBlendMode: 'multiply' }}
                                        />
                                    ) : (
                                        <div className="h-7"></div>
                                    )}
                                    <span className="border-b border-dotted border-slate-700 w-36 sm:w-40 inline-block mb-1"></span>
                                </div>
                                <span className="absolute left-full ml-2 whitespace-nowrap font-normal bottom-0.5">
                                    ผู้อนุมัติโครงการ
                                </span>
                            </div>
                            <p className="font-bold pt-2 whitespace-nowrap">
                                ({!isFastTrackApproval(sig6) && sig6?.user?.name 
                                    ? toThaiNumerals(cleanPersonName(sig6.user.name)) 
                                    : toThaiNumerals(cleanPersonName(college_settings?.director_name || 'นายกเชษฐ์ กิ่งชนะ'))})
                            </p>
                            <p className="leading-normal pt-0.5 font-normal max-w-[320px] text-slate-800">
                                {!isFastTrackApproval(sig6) && sig6?.acting_position_text
                                    ? toThaiNumerals(sig6.acting_position_text)
                                    : (!isFastTrackApproval(sig6) && sig6?.user?.position_level 
                                        ? toThaiNumerals(sig6.user.position_level) 
                                        : toThaiNumerals(college_settings?.director_position || 'ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน'))}
                            </p>
                            <p className="leading-normal pt-0.5 font-normal text-slate-700 whitespace-nowrap">
                                {getSigningDate(sig6)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main Batch Print View Page
export default function BatchPrint({
    groupedByDivision = [],
    strategyCategories = [],
    fiscalYear = '2569',
    divisionsList = [],
    initialDivisionFilter = 'all',
}) {
    const { college_settings, departments_data } = usePage().props;
    const [fontSizePreset, setFontSizePreset] = useState('normal');
    const [includeSignatures, setIncludeSignatures] = useState(true);
    const [selectedDivisionId, setSelectedDivisionId] = useState(initialDivisionFilter);
    const [showCoverPage, setShowCoverPage] = useState(true);
    const [showTableOfContents, setShowTableOfContents] = useState(true);

    const getInitialPrintSigningDate = () => {
        if (college_settings?.project_print_signing_date) {
            return college_settings.project_print_signing_date;
        }
        try {
            return new Date().toISOString().split('T')[0];
        } catch (e) {
            return '2026-10-21';
        }
    };

    const [printDateMode, setPrintDateMode] = useState(college_settings?.project_print_date_mode || 'uniform');
    const [customPrintDate, setCustomPrintDate] = useState(getInitialPrintSigningDate());

    const fontStyles = useMemo(() => {
        switch (fontSizePreset) {
            case 'compact':
                return { docSize: '14px', lineHeight: '1.4', tableSize: '11px', titleSize: '15px' };
            case 'large':
                return { docSize: '16.5px', lineHeight: '1.6', tableSize: '13px', titleSize: '17.5px' };
            case 'normal':
            default:
                return { docSize: '15px', lineHeight: '1.5', tableSize: '12px', titleSize: '16px' };
        }
    }, [fontSizePreset]);

    // Filter divisions
    const filteredDivisions = useMemo(() => {
        if (selectedDivisionId === 'all') {
            return groupedByDivision.filter(d => d.projects && d.projects.length > 0);
        }
        return groupedByDivision.filter(d => String(d.division_id) === String(selectedDivisionId));
    }, [groupedByDivision, selectedDivisionId]);

    // Grand totals
    const grandTotals = useMemo(() => {
        let projectsCount = 0;
        let proposedSum = 0;
        let allocatedSum = 0;

        filteredDivisions.forEach(div => {
            projectsCount += div.total_projects || 0;
            proposedSum += div.total_proposed_budget || 0;
            allocatedSum += div.total_allocated_budget || 0;
        });

        return { projectsCount, proposedSum, allocatedSum };
    }, [filteredDivisions]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0">
            <Head>
                <title>{`เล่มรวบรวมแบบเสนอโครงการ 4 ฝ่าย ประจำปีงบประมาณ พ.ศ. ${fiscalYear} - วิทยาลัยสารพัดช่างน่าน`}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />
            </Head>

            {/* Print Styling with TH Sarabun and Page Break Rules */}
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

                .signature-img {
                    mix-blend-mode: multiply !important;
                    background-color: transparent !important;
                    filter: contrast(1.1) brightness(1.02);
                }

                .page-break {
                    page-break-after: always !important;
                    break-after: page !important;
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
                    .no-print {
                        display: none !important;
                    }
                    .print-doc-container {
                        font-size: var(--doc-font-size) !important;
                        line-height: var(--doc-line-height) !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .single-project-proposal {
                        page-break-after: always !important;
                        break-after: page !important;
                        margin-bottom: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .print-break-inside-avoid {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }
            `}</style>

            {/* Top Interactive Controls Toolbar (Hidden when printing) */}
            <div className="no-print max-w-5xl mx-auto mb-6 bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200 font-sans space-y-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300">
                            <span>🏛️</span> เล่มรวมแบบเสนอโครงการ ประจำปีงบประมาณ พ.ศ. {fiscalYear}
                        </div>
                        <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
                            <span>📑</span> พิมพ์ / Export PDF เล่มรวมโครงการแยก 4 ฝ่าย
                        </h2>
                        <p className="text-xs text-slate-500">
                            รวบรวมโครงการทั้งหมดในระบบ เรียงลำดับแยกตามฝ่ายหลัก พร้อมลายเซ็นต์ดิจิทัลครบชุด สามารถสั่งพิมพ์หรือบันทึกเป็น PDF ไฟล์เดียวได้ทันที
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            href={route('dashboard', { tab: 'annual_budget_requests' })}
                            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                            ← กลับหน้าหลัก
                        </Link>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-700 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <span>🖨️</span>
                            <span>พิมพ์ / บันทึกเป็น PDF ทั้งเล่ม</span>
                        </button>
                    </div>
                </div>

                {/* Filter and Customization Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {/* Division Filter */}
                    <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">เลือกฝ่ายที่ต้องการพิมพ์:</label>
                        <select
                            value={selectedDivisionId}
                            onChange={(e) => setSelectedDivisionId(e.target.value)}
                            className="w-full rounded-xl border-slate-300 py-1.5 px-2.5 text-xs font-bold text-slate-800 bg-slate-50 focus:border-amber-500 focus:ring-amber-500"
                        >
                            <option value="all">🌟 รวมครบทุกฝ่าย ({grandTotals.projectsCount} โครงการ)</option>
                            {groupedByDivision.map((div) => (
                                <option key={div.division_id} value={div.division_id}>
                                    {div.division_name} ({div.total_projects} โครงการ)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Font Size Preset */}
                    <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">ขนาดตัวอักษร:</label>
                        <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setFontSizePreset('compact')}
                                className={`flex-1 py-1 rounded-lg font-bold text-center transition ${fontSizePreset === 'compact' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                กระทัดรัด
                            </button>
                            <button
                                type="button"
                                onClick={() => setFontSizePreset('normal')}
                                className={`flex-1 py-1 rounded-lg font-bold text-center transition ${fontSizePreset === 'normal' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                ปกติ
                            </button>
                            <button
                                type="button"
                                onClick={() => setFontSizePreset('large')}
                                className={`flex-1 py-1 rounded-lg font-bold text-center transition ${fontSizePreset === 'large' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                ใหญ่
                            </button>
                        </div>
                    </div>

                    {/* Digital Signatures Toggle */}
                    <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">การแสดงลายมือชื่อ:</label>
                        <button
                            type="button"
                            onClick={() => setIncludeSignatures(!includeSignatures)}
                            className={`w-full py-1.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                includeSignatures 
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                                    : 'bg-slate-100 border-slate-300 text-slate-600'
                            }`}
                        >
                            <span>{includeSignatures ? '✍️ แนบลายเซ็นต์ดิจิทัล' : '📄 เว้นว่าง (เซ็นสดด้วยปากกา)'}</span>
                        </button>
                    </div>

                    {/* Date Mode */}
                    <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">วันที่ลงนาม (ข้อ 12):</label>
                        <select
                            value={printDateMode}
                            onChange={(e) => setPrintDateMode(e.target.value)}
                            className="w-full rounded-xl border-slate-300 py-1.5 px-2.5 text-xs font-bold text-slate-800 bg-slate-50 focus:border-amber-500 focus:ring-amber-500"
                        >
                            <option value="uniform">📅 วันที่เดียวกันทั้งหมด</option>
                            <option value="step_date">⏱️ ตามเวลาอนุมัติจริง</option>
                            <option value="blank">⚪ จุดประเว้นว่าง (.........)</option>
                        </select>
                    </div>
                </div>

                {/* Additional Settings & Checkboxes */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer font-bold">
                            <input
                                type="checkbox"
                                checked={showCoverPage}
                                onChange={(e) => setShowCoverPage(e.target.checked)}
                                className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span>แสดงหน้าปกเล่ม (Cover Page)</span>
                        </label>

                        <label className="inline-flex items-center gap-2 cursor-pointer font-bold">
                            <input
                                type="checkbox"
                                checked={showTableOfContents}
                                onChange={(e) => setShowTableOfContents(e.target.checked)}
                                className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span>แสดงสารบัญ & สรุปภาพรวม 4 ฝ่าย</span>
                        </label>
                    </div>

                    {printDateMode === 'uniform' && (
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700">ระบุวันที่ลงนาม:</span>
                            <input
                                type="date"
                                value={customPrintDate}
                                onChange={(e) => setCustomPrintDate(e.target.value)}
                                className="rounded-xl border-slate-300 py-1 px-2.5 text-xs font-bold text-slate-900 bg-slate-50 focus:border-amber-500 focus:ring-amber-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN PRINTABLE BOOK CONTAINER */}
            <div className="max-w-4xl mx-auto">
                {/* 1. OFFICIAL COVER PAGE (หน้าปกเล่มรวมโครงการ) */}
                {showCoverPage && (
                    <div className="page-break font-sarabun bg-white p-12 md:p-16 mb-8 shadow-sm border border-slate-200 rounded-lg print:shadow-none print:border-none print:p-0 print:mb-0 min-h-[900px] flex flex-col justify-between items-center text-center">
                        <div className="pt-8">
                            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                <span className="text-6xl">🏛️</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight leading-snug">
                                เล่มรวบรวมแบบเสนอโครงการ
                            </h1>
                            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-2">
                                แผนปฏิบัติราชการ ประจำปีงบประมาณ พ.ศ. {toThaiNumerals(fiscalYear)}
                            </h2>
                            <div className="w-48 h-1 bg-slate-900 mx-auto my-4"></div>
                            <p className="text-base md:text-lg text-slate-700 font-medium">
                                จำแนกตาม ๔ ฝ่ายหลักของสถานศึกษา
                            </p>
                        </div>

                        {/* Middle Box: Division List Highlights */}
                        <div className="my-8 max-w-lg w-full border-2 border-slate-900 p-6 rounded-xl space-y-2 text-left text-base">
                            <p className="font-bold text-center border-b border-slate-400 pb-2 mb-3">
                                โครงการประกอบด้วย ๔ ฝ่ายหลัก
                            </p>
                            <p className="pl-4">๑. ฝ่ายบริหารทรัพยากร</p>
                            <p className="pl-4">๒. ฝ่ายวิชาการ</p>
                            <p className="pl-4">๓. ฝ่ายพัฒนากิจการนักเรียนนักศึกษา</p>
                            <p className="pl-4">๔. ฝ่ายยุทธศาสตร์และแผนงาน</p>
                            <div className="border-t border-slate-300 pt-2.5 mt-3 text-center font-bold text-slate-900">
                                รวมจำนวนโครงการทั้งสิ้น {toThaiNumerals(grandTotals.projectsCount)} โครงการ
                            </div>
                        </div>

                        {/* Footer Organization Details */}
                        <div className="pb-8 space-y-1 text-base text-slate-800">
                            <p className="font-bold">งานพัฒนายุทธศาสตร์ แผนงานและงบประมาณ ฝ่ายยุทธศาสตร์และแผนงาน</p>
                            <p className="font-bold">วิทยาลัยสารพัดช่างน่าน สถาบันการอาชีวศึกษาภาคเหนือ ๒</p>
                            <p>สำนักงานคณะกรรมการการอาชีวศึกษา กระทรวงศึกษาธิการ</p>
                        </div>
                    </div>
                )}

                {/* 2. TABLE OF CONTENTS & EXECUTIVE SUMMARY (สารบัญและสรุปภาพรวม 4 ฝ่าย) */}
                {showTableOfContents && (
                    <div className="page-break font-sarabun bg-white p-8 md:p-12 mb-8 shadow-sm border border-slate-200 rounded-lg print:shadow-none print:border-none print:p-0 print:mb-0">
                        <div className="text-center mb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                                สรุปภาพรวมและสารบัญเล่มแบบเสนอโครงการ
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">
                                ประจำปีงบประมาณ พ.ศ. {toThaiNumerals(fiscalYear)} วิทยาลัยสารพัดช่างน่าน
                            </p>
                            <div className="w-32 h-0.5 bg-slate-900 mx-auto my-2"></div>
                        </div>

                        {/* Division Summary Table */}
                        <div className="mb-6">
                            <p className="font-bold text-base mb-2">ตารางสรุปยอดงบประมาณจำแนกตาม ๔ ฝ่ายหลัก:</p>
                            <table className="w-full border-collapse border border-slate-900 text-xs sm:text-sm font-sarabun text-center">
                                <thead>
                                    <tr className="bg-slate-100 font-bold border-b border-slate-900">
                                        <th className="border border-slate-900 p-2 w-12">ลำดับ</th>
                                        <th className="border border-slate-900 p-2 text-left">ฝ่าย / ส่วนงาน</th>
                                        <th className="border border-slate-900 p-2 w-28">จำนวนโครงการ</th>
                                        <th className="border border-slate-900 p-2 w-36 text-right">งบประมาณเสนอขอ (บาท)</th>
                                        <th className="border border-slate-900 p-2 w-36 text-right">งบประมาณจัดสรรจริง (บาท)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDivisions.map((div, idx) => (
                                        <tr key={div.division_id} className="border-b border-slate-900">
                                            <td className="border border-slate-900 p-1.5">{toThaiNumerals(idx + 1)}</td>
                                            <td className="border border-slate-900 p-1.5 text-left font-bold">{toThaiNumerals(div.division_name)}</td>
                                            <td className="border border-slate-900 p-1.5 font-bold">{toThaiNumerals(div.total_projects)}</td>
                                            <td className="border border-slate-900 p-1.5 text-right font-medium">{formatCurrencyThai(div.total_proposed_budget)}</td>
                                            <td className="border border-slate-900 p-1.5 text-right font-bold text-purple-950">{formatCurrencyThai(div.total_allocated_budget)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                                        <td colSpan="2" className="border border-slate-900 p-2 text-center font-bold">รวมทั้งสิ้น</td>
                                        <td className="border border-slate-900 p-2 text-center font-black">{toThaiNumerals(grandTotals.projectsCount)}</td>
                                        <td className="border border-slate-900 p-2 text-right font-black">{formatCurrencyThai(grandTotals.proposedSum)}</td>
                                        <td className="border border-slate-900 p-2 text-right font-black text-purple-950">{formatCurrencyThai(grandTotals.allocatedSum)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Table of Contents Project List */}
                        <div className="space-y-4 pt-2">
                            <p className="font-bold text-base border-b border-slate-400 pb-1">
                                สารบัญรายชื่อโครงการ (แยกตามฝ่าย):
                            </p>
                            {filteredDivisions.map((div, dIdx) => (
                                <div key={div.division_id} className="space-y-1.5 pl-2">
                                    <p className="font-bold text-slate-900 text-sm sm:text-base">
                                        {toThaiNumerals(dIdx + 1)}. {toThaiNumerals(div.division_name)} ({toThaiNumerals(div.total_projects)} โครงการ)
                                    </p>
                                    <div className="pl-4 space-y-1 text-xs sm:text-sm text-slate-800">
                                        {div.projects?.map((proj, pIdx) => (
                                            <div key={proj.id} className="flex justify-between items-baseline border-b border-dotted border-slate-300 pb-0.5">
                                                <span className="truncate pr-2">
                                                    {toThaiNumerals(dIdx + 1)}.{toThaiNumerals(pIdx + 1)} {toArabicNumerals(proj.title)}
                                                    <span className="text-slate-500 text-[11px] pl-1.5">({toArabicNumerals(proj.responsible_person || proj.user?.name || '-')})</span>
                                                </span>
                                                <span className="shrink-0 font-bold text-slate-900">
                                                    {formatCurrencyThai(proj.allocated_budget || proj.estimated_budget)} บาท
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. ALL PROJECTS GROUPED BY DIVISION */}
                {filteredDivisions.map((division, divIdx) => (
                    <div key={division.division_id} className="division-section">
                        {/* Division Separator Cover in Print */}
                        <div className="page-break font-sarabun bg-white p-12 mb-8 shadow-sm border border-slate-200 rounded-lg print:shadow-none print:border-none print:p-0 print:mb-0 min-h-[600px] flex flex-col justify-center items-center text-center">
                            <span className="text-5xl mb-4 block">🏛️</span>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                                ฝ่ายที่ {toThaiNumerals(divIdx + 1)} : {toThaiNumerals(division.division_name)}
                            </h2>
                            <p className="text-base text-slate-600 mt-2">
                                วิทยาลัยสารพัดช่างน่าน ประจำปีงบประมาณ พ.ศ. {toThaiNumerals(fiscalYear)}
                            </p>
                            <div className="w-32 h-1 bg-slate-800 mx-auto my-4"></div>
                            <p className="text-base font-bold text-slate-800">
                                รวมทั้งสิ้น {toThaiNumerals(division.total_projects)} โครงการ
                            </p>
                            <p className="text-sm text-purple-900 font-bold mt-1">
                                ยอดงบประมาณจัดสรร: {formatCurrencyThai(division.total_allocated_budget)} บาท
                            </p>
                        </div>

                        {/* Each Project Proposal in this Division */}
                        {division.projects?.map((project) => (
                            <SingleProjectProposalDocument
                                key={project.id}
                                project={project}
                                strategyCategories={strategyCategories}
                                includeSignatures={includeSignatures}
                                printDateMode={printDateMode}
                                customPrintDate={customPrintDate}
                                college_settings={college_settings}
                                departments_data={departments_data}
                                fontStyles={fontStyles}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
