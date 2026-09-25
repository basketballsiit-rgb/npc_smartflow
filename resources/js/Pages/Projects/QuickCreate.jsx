import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import Swal from 'sweetalert2';
import axios from 'axios';

export default function QuickCreate({ 
    auth, 
    departments, 
    currentFiscalYear, 
    strategyCategories = [], 
    iqaStrategies = [], 
    ovecStrategies = [], 
    nationalStrategies = [], 
    provincialStrategies = [] 
}) {
    const allPositions = auth.user.all_positions || [];
    const defaultPosition = allPositions.find(p => p.is_primary) || allPositions[0] || null;

    const toArabic = (str) => {
        if (!str || typeof str !== 'string') return str;
        const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        return str.replace(/[๐-๙]/g, c => {
            const idx = thaiDigits.indexOf(c);
            return idx !== -1 ? String(idx) : c;
        });
    };

    // Initialize initial selections for dynamic strategy categories
    const initialSelections = {};
    strategyCategories.forEach(cat => {
        initialSelections[cat.id] = [];
    });

    const [generatingAi, setGeneratingAi] = useState(false);
    const [activeTabSection, setActiveTabSection] = useState('all'); // 'all' or active accordion section

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        academic_year: currentFiscalYear || new Date().getFullYear() + 543,
        user_position_id: defaultPosition ? defaultPosition.id : '',
        department_id: defaultPosition 
            ? (defaultPosition.sub_department_id || defaultPosition.department_id || auth.user.department_id || '')
            : (auth.user.department_id || (departments?.[0]?.id || '')),
        proposed_budget: '',
        responsible_person: auth.user.name || '',
        position: defaultPosition ? defaultPosition.formatted_title : (auth.user.position || 'ครูผู้สอน'),
        phone: '',
        email: auth.user.email || '',
        background_rationale: '',

        // Optional Detailed Fields
        objectives: [''],
        targets: {
            quantitative: [''],
            qualitative: ['']
        },
        indicators: {
            quantitative: { text: '', unit: '' },
            qualitative: { text: '', unit: '' },
            time: { text: '', unit: '' },
            cost: { text: '', unit: '' }
        },
        strategy_selections: initialSelections,
        iqa_strategy_ids: [],
        ovec_strategy_ids: [],
        national_strategy_ids: [],
        provincial_strategy_ids: [],
    });

    const isPlanStaff = auth.user.is_admin || (auth.user.role?.name === 'plan_head' || auth.user.role?.name === 'admin');

    const handlePositionChange = (posId) => {
        const selected = allPositions.find(p => String(p.id) === String(posId));
        if (selected) {
            setData(prev => ({
                ...prev,
                user_position_id: selected.id,
                department_id: selected.sub_department_id || selected.department_id || prev.department_id,
                position: selected.formatted_title || selected.position || prev.position,
            }));
        } else {
            setData(prev => ({
                ...prev,
                user_position_id: '',
            }));
        }
    };

    // Objectives Array Handler
    const handleObjectiveChange = (index, value) => {
        const updated = [...data.objectives];
        updated[index] = value;
        setData('objectives', updated);
    };

    const addObjective = () => {
        setData('objectives', [...data.objectives, '']);
    };

    const removeObjective = (index) => {
        if (data.objectives.length <= 1) return;
        const updated = data.objectives.filter((_, i) => i !== index);
        setData('objectives', updated);
    };

    // Targets Handlers
    const handleTargetChange = (type, index, value) => {
        const updatedList = [...(data.targets[type] || [])];
        updatedList[index] = value;
        setData('targets', {
            ...data.targets,
            [type]: updatedList
        });
    };

    const addTarget = (type) => {
        setData('targets', {
            ...data.targets,
            [type]: [...(data.targets[type] || []), '']
        });
    };

    const removeTarget = (type, index) => {
        if ((data.targets[type] || []).length <= 1) return;
        const updatedList = (data.targets[type] || []).filter((_, i) => i !== index);
        setData('targets', {
            ...data.targets,
            [type]: updatedList
        });
    };

    // Indicator Handlers
    const handleIndicatorChange = (type, key, value) => {
        setData('indicators', {
            ...data.indicators,
            [type]: {
                ...(data.indicators?.[type] || {}),
                [key]: value
            }
        });
    };

    // Strategy Selection Handlers
    const handleCategoryItemToggle = (catId, itemId) => {
        const currentSelections = data.strategy_selections[catId] || [];
        const isSelected = currentSelections.includes(itemId);
        let updated;
        if (isSelected) {
            updated = currentSelections.filter(id => id !== itemId);
        } else {
            updated = [...currentSelections, itemId];
        }
        setData('strategy_selections', {
            ...data.strategy_selections,
            [catId]: updated
        });
    };

    const handleStrategyArrayToggle = (field, id) => {
        const current = data[field] || [];
        const isSelected = current.includes(id);
        if (isSelected) {
            setData(field, current.filter(item => item !== id));
        } else {
            setData(field, [...current, id]);
        }
    };

    // AI Generator Handler for Quick Proposal
    const handleGenerateAiQuick = async (type) => {
        if (!data.title.trim()) {
            Swal.fire('คำแนะนำ', 'กรุณาระบุชื่อโครงการก่อน ให้ AI ช่วยประมวลผล', 'info');
            return;
        }

        setGeneratingAi(true);
        try {
            const res = await axios.post(route('projects.generate_ai_content'), {
                type: type,
                title: data.title,
                budget: data.proposed_budget,
            });

            if (res.data?.success) {
                if (type === 'rationale' && res.data.content) {
                    setData('background_rationale', res.data.content);
                } else if (type === 'objectives' && res.data.objectives) {
                    setData('objectives', res.data.objectives);
                } else if (type === 'targets') {
                    setData('targets', {
                        quantitative: res.data.quantitative || data.targets.quantitative,
                        qualitative: res.data.qualitative || data.targets.qualitative,
                    });
                } else if (type === 'indicators' && res.data.indicators) {
                    setData('indicators', res.data.indicators);
                }
                Swal.fire({
                    title: '✨ AI ประมวลผลสำเร็จ!',
                    text: 'ระบบได้เติมข้อมูลร่างให้อัตโนมัติ สามารถแก้ไขเพิ่มเติมได้ตามต้องการ',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        } catch (err) {
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้', 'error');
        } finally {
            setGeneratingAi(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('projects.preliminary_store'), {
            onSuccess: () => {
                Swal.fire({
                    title: '🎉 เสนอโครงการสำเร็จ!',
                    text: 'บันทึกคำของบประมาณโครงการเบื้องต้นเรียบร้อยแล้ว เมื่อคณะกรรมการอนุมัติจัดสรรงบ ข้อมูลทั้งหมดจะถูกดึงเข้าเล่มโครงการฉบับเต็มโดยอัตโนมัติ',
                    icon: 'success',
                    confirmButtonColor: '#7c3aed',
                });
            },
            onError: (err) => {
                Swal.fire({
                    title: 'เกิดข้อผิดพลาด',
                    text: 'กรุณาตรวจสอบความถูกต้องของข้อมูลที่กรอก',
                    icon: 'error',
                    confirmButtonColor: '#7c3aed',
                });
            }
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold leading-tight text-purple-950 flex items-center gap-2">
                            <span>💡</span> เสนอคำของบประมาณโครงการเบื้องต้น (Preliminary Project Proposal)
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            เสนอชื่อโครงการ วัตถุประสงค์ เป้าหมาย และยุทธศาสตร์ที่เกี่ยวข้องเพื่อขออนุมัติงบประมาณก่อนจัดทำรายละเอียดเล่มเต็ม
                        </p>
                    </div>
                    <Link
                        href={route('dashboard')}
                        className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-xs font-bold text-purple-900 shadow-2xs hover:bg-purple-50 transition-colors"
                    >
                        ← ย้อนกลับหน้าศูนย์ควบคุม
                    </Link>
                </div>
            }
        >
            <Head title="เสนอโครงการเบื้องต้น - NPC SMART FLOW" />

            <div className="py-8">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-3xl border border-purple-100 bg-white p-6 sm:p-8 shadow-sm">
                        
                        {/* Info Banner */}
                        <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-5 text-white shadow-md">
                            <div className="flex items-start sm:items-center gap-3">
                                <span className="text-3xl">📌</span>
                                <div>
                                    <h3 className="text-base font-bold">ขั้นตอนที่ 1: เสนอโครงการเพื่อขอรับการจัดสรรงบประมาณ</h3>
                                    <p className="text-xs text-purple-200 mt-0.5">
                                        กรอกข้อมูลชื่อโครงการ วงเงิน วัตถุประสงค์ และเลือกยุทธศาสตร์ที่เกี่ยวข้องเบื้องต้น เมื่อคณะกรรมการอนุมัติงบประมาณแล้ว ข้อมูลทั้งหมดจะถูกดึงเข้าสู่การทำเล่มโครงการแบบเต็มรูปแบบทันทีโดยไม่ต้องพิมพ์ซ้ำ
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 text-sm text-slate-800">
                            
                            {/* Section 1: Basic Info */}
                            <div className="space-y-4 rounded-2xl border border-purple-100 bg-purple-50/30 p-5 sm:p-6">
                                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                                    <h4 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                                        <span>๑.</span> ข้อมูลคำของบประมาณโครงการเบื้องต้น (บังคับ)
                                    </h4>
                                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                                        จำเป็นต้องระบุ
                                    </span>
                                </div>

                                {/* Role / Capacity Selection */}
                                {allPositions.length > 1 ? (
                                    <div className="rounded-2xl border-2 border-purple-300 bg-white p-4 shadow-xs">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-bold text-purple-950 flex items-center gap-1.5">
                                                <span>🎯</span> เสนอโครงการในนาม / ภาระงานหน้าที่ (Capacity / Role) *
                                            </label>
                                            <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                                                มี {allPositions.length} ภาระงานในสังกัด
                                            </span>
                                        </div>
                                        <select
                                            value={data.user_position_id}
                                            onChange={(e) => handlePositionChange(e.target.value)}
                                            className="w-full rounded-xl border-purple-300 bg-purple-50/40 px-3.5 py-2.5 text-xs font-bold text-purple-950 focus:border-purple-600 focus:ring-purple-600 shadow-xs"
                                            required
                                        >
                                            {allPositions.map((pos) => (
                                                <option key={pos.id} value={pos.id}>
                                                    {pos.formatted_title} {pos.is_primary ? '★ (ภาระงานหลัก)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-purple-600 mt-1.5 flex items-center gap-1">
                                            <span>ℹ️</span> ระบบจะผูกฝ่าย/งาน และกำหนดขั้นตอนการอนุมัติตามภาระงานหน้าที่ที่ท่านเลือกเสนอโครงการ
                                        </p>
                                    </div>
                                ) : allPositions.length === 1 ? (
                                    <div className="rounded-xl border border-purple-200 bg-purple-100/50 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                                        <div>
                                            <span className="text-slate-500 font-medium">เสนอโครงการในนามภาระงาน: </span>
                                            <span className="font-bold text-purple-950">{allPositions[0].formatted_title}</span>
                                        </div>
                                        <span className="text-[11px] font-semibold text-purple-700 bg-purple-200/60 px-2.5 py-0.5 rounded-md w-fit">
                                            ฝ่าย: {allPositions[0].department_name || '-'}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between">
                                        <span>⚠️ ท่านยังไม่ได้ระบุภาระงานและฝ่ายที่สังกัดในข้อมูลส่วนตัว</span>
                                        <Link href={route('profile.edit')} className="font-bold underline text-amber-800 hover:text-amber-950">
                                            ตั้งค่าข้อมูลส่วนตัว →
                                        </Link>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        ชื่อโครงการที่เสนอขอ (Project Title) *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="w-full rounded-xl border-purple-200 px-4 py-2.5 text-sm font-bold text-purple-950 focus:border-purple-500 focus:ring-purple-500"
                                        placeholder="เช่น โครงการพัฒนาทักษะวิชาชีพสู่มาตรฐานสากล ประจำปีงบประมาณ 2569"
                                        required
                                    />
                                    {errors.title && <span className="text-xs text-rose-500 mt-1 block">{errors.title}</span>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">ปีงบประมาณ พ.ศ. *</label>
                                        <input
                                            type="number"
                                            value={data.academic_year}
                                            onChange={(e) => setData('academic_year', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500 font-semibold text-purple-950"
                                            required
                                        />
                                        {errors.academic_year && <span className="text-xs text-rose-500 mt-1 block">{errors.academic_year}</span>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">วงเงินงบประมาณที่ขอเสนอ (บาท) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.proposed_budget}
                                            onChange={(e) => setData('proposed_budget', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm font-bold text-purple-900 focus:border-purple-500 focus:ring-purple-500"
                                            placeholder="50000.00"
                                            required
                                        />
                                        {errors.proposed_budget && <span className="text-xs text-rose-500 mt-1 block">{errors.proposed_budget}</span>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">ฝ่าย / งานที่เสนอโครงการ *</label>
                                        <select
                                            value={data.department_id}
                                            onChange={(e) => setData('department_id', e.target.value)}
                                            disabled={!isPlanStaff}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs font-medium focus:border-purple-500 focus:ring-purple-500 disabled:bg-slate-100"
                                        >
                                            {(departments || []).map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">ผู้รับผิดชอบโครงการ (ชื่อ-สกุล) *</label>
                                        <input
                                            type="text"
                                            value={data.responsible_person}
                                            onChange={(e) => setData('responsible_person', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">ตำแหน่ง</label>
                                        <input
                                            type="text"
                                            value={data.position}
                                            onChange={(e) => setData('position', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                        />
                                    </div>

                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-bold text-slate-700">
                                            เหตุผลความจำเป็น / หลักการและเหตุผลโดยย่อ
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateAiQuick('rationale')}
                                            disabled={generatingAi}
                                            className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 px-2.5 py-0.5 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50"
                                        >
                                            <span>✨</span> {generatingAi ? 'กำลังสร้าง...' : 'AI ช่วยร่างเหตุผล'}
                                        </button>
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={data.background_rationale}
                                        onChange={(e) => setData('background_rationale', e.target.value)}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                        placeholder="ระบุเหตุผลความจำเป็นสั้นๆ เพื่อประกอบการพิจารณาจัดสรรงบประมาณ..."
                                    ></textarea>
                                </div>
                            </div>

                            {/* Section 2: Objectives & Targets */}
                            <div className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2">
                                    <div>
                                        <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                                            <span>๒.</span> วัตถุประสงค์ และเป้าหมายโครงการ (ระบุเบื้องต้น)
                                        </h4>
                                        <p className="text-[11px] text-slate-500">ข้อมูลส่วนนี้จะนำไปประกอบการพิจารณา และดึงเข้าเล่มเต็มเมื่อได้รับการอนุมัติ</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateAiQuick('objectives')}
                                            disabled={generatingAi}
                                            className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50"
                                        >
                                            <span>✨</span> AI ร่างวัตถุประสงค์
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateAiQuick('targets')}
                                            disabled={generatingAi}
                                            className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50"
                                        >
                                            <span>✨</span> AI ร่างเป้าหมาย
                                        </button>
                                    </div>
                                </div>

                                {/* Objectives Input List */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-indigo-950">
                                        วัตถุประสงค์โครงการ (Objectives)
                                    </label>
                                    {data.objectives.map((obj, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-indigo-700 w-6 text-center">{idx + 1}.</span>
                                            <input
                                                type="text"
                                                value={obj}
                                                onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                                                placeholder={`เช่น เพื่อพัฒนาทักษะวิชาชีพของนักเรียนนักศึกษา... (${idx + 1})`}
                                                className="flex-1 rounded-xl border-indigo-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                            {data.objectives.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeObjective(idx)}
                                                    className="rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 px-2.5 py-2 text-xs font-bold transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addObjective}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-1"
                                    >
                                        <span>➕</span> เพิ่มข้อวัตถุประสงค์
                                    </button>
                                </div>

                                {/* Targets Input List */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    {/* Quantitative Targets */}
                                    <div className="space-y-2 rounded-xl border border-indigo-100 bg-white p-3.5">
                                        <label className="block text-xs font-bold text-indigo-950">
                                            เป้าหมายเชิงปริมาณ (Quantitative Targets)
                                        </label>
                                        {(data.targets.quantitative || []).map((t, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5">
                                                <input
                                                    type="text"
                                                    value={t}
                                                    onChange={(e) => handleTargetChange('quantitative', idx, e.target.value)}
                                                    placeholder="เช่น ผู้เข้าร่วมโครงการไม่น้อยกว่า 50 คน"
                                                    className="flex-1 rounded-lg border-indigo-200 px-3 py-1.5 text-xs"
                                                />
                                                {(data.targets.quantitative || []).length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTarget('quantitative', idx)}
                                                        className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1.5"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addTarget('quantitative')}
                                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                        >
                                            <span>➕</span> เพิ่มเป้าหมายเชิงปริมาณ
                                        </button>
                                    </div>

                                    {/* Qualitative Targets */}
                                    <div className="space-y-2 rounded-xl border border-indigo-100 bg-white p-3.5">
                                        <label className="block text-xs font-bold text-indigo-950">
                                            เป้าหมายเชิงคุณภาพ (Qualitative Targets)
                                        </label>
                                        {(data.targets.qualitative || []).map((t, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5">
                                                <input
                                                    type="text"
                                                    value={t}
                                                    onChange={(e) => handleTargetChange('qualitative', idx, e.target.value)}
                                                    placeholder="เช่น มีความพึงพอใจในระดับดีมาก (ร้อยละ 85 ขึ้นไป)"
                                                    className="flex-1 rounded-lg border-indigo-200 px-3 py-1.5 text-xs"
                                                />
                                                {(data.targets.qualitative || []).length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTarget('qualitative', idx)}
                                                        className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1.5"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addTarget('qualitative')}
                                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                        >
                                            <span>➕</span> เพิ่มเป้าหมายเชิงคุณภาพ
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Strategic Alignment */}
                            <div className="space-y-4 rounded-2xl border border-sky-100 bg-sky-50/30 p-5 sm:p-6">
                                <div className="border-b border-sky-100 pb-2">
                                    <h4 className="text-sm font-bold text-sky-950 flex items-center gap-2">
                                        <span>๓.</span> การเชื่อมโยงยุทธศาสตร์และนโยบายสถานศึกษา (เลือกตอบสอดคล้อง)
                                    </h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        เลือกยุทธศาสตร์ที่งานแผนงานได้กรอกไว้ในระบบที่โครงการนี้ตอบสนอง เพื่อนำไปประมวลผลสรุปภาพรวมสถานศึกษา
                                    </p>
                                </div>

                                {/* Dynamic Strategy Categories */}
                                {strategyCategories && strategyCategories.length > 0 ? (
                                    <div className="space-y-4">
                                         {strategyCategories.map(cat => {
                                             const groupedItems = [];
                                             const groupMap = new Map();
                                             (cat.items || []).forEach(item => {
                                                 const gName = (item.group_name || '').trim();
                                                 if (!groupMap.has(gName)) {
                                                     const groupObj = { name: gName, items: [] };
                                                     groupMap.set(gName, groupObj);
                                                     groupedItems.push(groupObj);
                                                 }
                                                 groupMap.get(gName).items.push(item);
                                             });

                                             return (
                                                 <div key={cat.id} className="rounded-xl border border-sky-200 bg-white p-4 shadow-2xs space-y-3">
                                                     <div>
                                                         <h5 className="text-xs font-bold text-sky-950 flex items-center gap-2">
                                                             <span>🚩</span> {toArabic(cat.name)}
                                                         </h5>
                                                         {cat.description && (
                                                             <p className="text-[11px] text-slate-500 mt-0.5">{toArabic(cat.description)}</p>
                                                         )}
                                                     </div>

                                                     <div className="space-y-3">
                                                         {groupedItems.map((group, gIdx) => (
                                                             <div key={gIdx} className="space-y-1.5">
                                                                 {group.name ? (
                                                                     <div className="text-xs font-bold text-sky-900 bg-sky-50 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-sky-100">
                                                                         <span>📂</span>
                                                                         <span>{toArabic(group.name)}</span>
                                                                     </div>
                                                                 ) : null}
                                                                 <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${group.name ? 'pl-2' : ''}`}>
                                                                     {group.items.map(item => {
                                                                         const isSelected = (data.strategy_selections[cat.id] || []).includes(item.id);
                                                                         return (
                                                                             <label
                                                                                 key={item.id}
                                                                                 className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                                                                     isSelected
                                                                                         ? 'border-sky-500 bg-sky-50 text-sky-950 font-bold shadow-2xs'
                                                                                         : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                                                                                 }`}
                                                                             >
                                                                                 <input
                                                                                     type="checkbox"
                                                                                     checked={isSelected}
                                                                                     onChange={() => handleCategoryItemToggle(cat.id, item.id)}
                                                                                     className="mt-0.5 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
                                                                                 />
                                                                                 <span>{toArabic(item.name)}</span>
                                                                             </label>
                                                                         );
                                                                     })}
                                                                 </div>
                                                             </div>
                                                         ))}
                                                     </div>
                                                 </div>
                                             );
                                         })}
                                    </div>
                                ) : (
                                    /* Fallback Pre-defined Strategies if Dynamic Categories Empty */
                                    <div className="space-y-4">
                                        {/* IQA Strategies */}
                                        {iqaStrategies.length > 0 && (
                                            <div className="rounded-xl border border-sky-200 bg-white p-4">
                                                <h5 className="text-xs font-bold text-sky-950 mb-2">ยุทธศาสตร์ประกันคุณภาพ (IQA)</h5>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {iqaStrategies.map(strat => {
                                                        const isSelected = (data.iqa_strategy_ids || []).includes(strat.id);
                                                        return (
                                                            <label key={strat.id} className="flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer hover:bg-sky-50">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => handleStrategyArrayToggle('iqa_strategy_ids', strat.id)}
                                                                    className="rounded text-sky-600"
                                                                />
                                                                <span>{strat.name}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* OVEC Strategies */}
                                        {ovecStrategies.length > 0 && (
                                            <div className="rounded-xl border border-sky-200 bg-white p-4">
                                                <h5 className="text-xs font-bold text-sky-950 mb-2">ยุทธศาสตร์ สอศ. (OVEC)</h5>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {ovecStrategies.map(strat => {
                                                        const isSelected = (data.ovec_strategy_ids || []).includes(strat.id);
                                                        return (
                                                            <label key={strat.id} className="flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer hover:bg-sky-50">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => handleStrategyArrayToggle('ovec_strategy_ids', strat.id)}
                                                                    className="rounded text-sky-600"
                                                                />
                                                                <span>{strat.name}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Section 4: Indicators (Optional) */}
                            <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 sm:p-6">
                                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                                    <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                                        <span>๔.</span> ตัวชี้วัดความสำเร็จ (KPIs) (ทางเลือก)
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => handleGenerateAiQuick('indicators')}
                                        disabled={generatingAi}
                                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-0.5 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <span>✨</span> {generatingAi ? 'กำลังสร้าง...' : 'AI ช่วยร่างตัวชี้วัด'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-emerald-950 mb-1">
                                            ตัวชี้วัดเชิงปริมาณ
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={data.indicators.quantitative?.text || ''}
                                                onChange={(e) => handleIndicatorChange('quantitative', 'text', e.target.value)}
                                                placeholder="เช่น ผู้เข้าร่วมครบตามเกณฑ์"
                                                className="flex-1 rounded-xl border-emerald-200 px-3 py-2 text-xs"
                                            />
                                            <input
                                                type="text"
                                                value={data.indicators.quantitative?.unit || ''}
                                                onChange={(e) => handleIndicatorChange('quantitative', 'unit', e.target.value)}
                                                placeholder="50 คน"
                                                className="w-24 rounded-xl border-emerald-200 px-3 py-2 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-emerald-950 mb-1">
                                            ตัวชี้วัดเชิงคุณภาพ
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={data.indicators.qualitative?.text || ''}
                                                onChange={(e) => handleIndicatorChange('qualitative', 'text', e.target.value)}
                                                placeholder="เช่น มีความพึงพอใจระดับดีมาก"
                                                className="flex-1 rounded-xl border-emerald-200 px-3 py-2 text-xs"
                                            />
                                            <input
                                                type="text"
                                                value={data.indicators.qualitative?.unit || ''}
                                                onChange={(e) => handleIndicatorChange('qualitative', 'unit', e.target.value)}
                                                placeholder="ร้อยละ 85"
                                                className="w-24 rounded-xl border-emerald-200 px-3 py-2 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex justify-end gap-x-4 border-t border-purple-100 pt-6">
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    ยกเลิก
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-600/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                                >
                                    🚀 ยื่นเสนอโครงการเบื้องต้น
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
