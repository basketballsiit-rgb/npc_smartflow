import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';
import ProjectWorkflowStepper from '@/Components/ProjectWorkflowStepper';

export default function Create({ strategyCategories = [], iqaStrategies = [], ovecStrategies = [], nationalStrategies = [], provincialStrategies = [], departments = [] }) {
    const [generatingAi, setGeneratingAi] = useState(false);

    // Initialize dynamic strategy selections
    const initialSelections = {};
    strategyCategories.forEach(cat => {
        initialSelections[cat.id] = cat.items?.[0]?.id ? [cat.items[0].id] : [];
    });

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        academic_year: 2569,
        responsible_person: 'นางสาวฉัตรนภา ถิ่นมีกุล',
        position: 'หัวหน้างานส่งเสริมธุรกิจและการเป็นผู้ประกอบการ',
        phone: '080-6044450',
        email: 'Newchatnapa16@npc.ac.th',
        mission: 'ผลิตและพัฒนากำลังคนด้านวิชาชีพให้มีคุณภาพตามมาตรฐานการอาชีวศึกษา',
        goal: 'ผู้เรียนและผู้สำเร็จการศึกษามีความรู้ ทักษะ การประยุกต์ใช้และมีคุณธรรม จริยธรรม ตามมาตรฐานวิชาชีพ',
        strategy_tactic: 'ส่งเสริมด้านวิชาการ คุณธรรม จริยธรรม และค่านิยมที่ดีงามในวิชาชีพ',
        background_rationale: '',
        objectives: [''],
        outputs: [''],
        outcomes: [''],
        targets: {
            quantitative: [''],
            qualitative: [''],
        },
        location: 'ณ วิทยาลัยสารพัดช่างน่าน',
        expected_benefits: [''],
        strategy_selections: initialSelections,
        iqa_strategy_ids: iqaStrategies[0]?.id ? [iqaStrategies[0].id] : [],
        ovec_strategy_ids: ovecStrategies[0]?.id ? [ovecStrategies[0].id] : [],
        national_strategy_ids: nationalStrategies[0]?.id ? [nationalStrategies[0].id] : [],
        provincial_strategy_ids: provincialStrategies[0]?.id ? [provincialStrategies[0].id] : [],
        estimated_budget: '',
    });

    // One-Click AI Full Proposal Generator
    const handleGenerateFullProposalAi = async () => {
        if (!data.title.trim()) {
            Swal.fire('คำแนะนำ', 'กรุณาระบุชื่อโครงการก่อน เพื่อให้ AI ช่วยยกร่างเอกสารเสนอโครงการฉบับสมบูรณ์', 'info');
            return;
        }

        setGeneratingAi(true);
        try {
            const res = await axios.post(route('projects.generate_ai_content'), {
                type: 'full_proposal',
                title: data.title,
            });

            if (res.data?.success) {
                setData(prev => ({
                    ...prev,
                    background_rationale: res.data.background_rationale,
                    objectives: res.data.objectives,
                    outputs: res.data.outputs,
                    outcomes: res.data.outcomes,
                    targets: {
                        quantitative: res.data.quantitative,
                        qualitative: res.data.qualitative,
                    },
                    expected_benefits: res.data.expected_benefits,
                    action_plan: res.data.action_plan,
                }));
                Swal.fire('✨ AI ยกร่างโครงการสำเร็จ!', 'จัดพิมพ์เนื้อหาตามแบบฟอร์มมาตรฐานวิทยาลัยสารพัดช่างน่านครบถ้วนทุกหัวข้อแล้ว ท่านสามารถปรับแก้ไขเพิ่มเติมได้ตามต้องการ', 'success');
            }
        } catch (err) {
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้', 'error');
        } finally {
            setGeneratingAi(false);
        }
    };

    const handleGenerateAiRationale = async () => {
        if (!data.title.trim()) {
            Swal.fire('คำแนะนำ', 'กรุณาระบุชื่อโครงการก่อน ให้ AI ช่วยยกร่างหลักการและเหตุผล', 'info');
            return;
        }

        setGeneratingAi(true);
        try {
            const res = await axios.post(route('projects.generate_ai_content'), {
                type: 'rationale',
                title: data.title,
            });

            if (res.data?.success && res.data.content) {
                setData('background_rationale', res.data.content);
                Swal.fire('✨ AI จัดพิมพ์สำเร็จ!', 'ยกร่างหลักการและเหตุผลเรียบร้อยแล้ว', 'success');
            }
        } catch (err) {
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้', 'error');
        } finally {
            setGeneratingAi(false);
        }
    };

    // Helper for multi-string arrays
    const handleArrayChange = (field, index, value) => {
        const list = [...(data[field] || [])];
        list[index] = value;
        setData(field, list);
    };

    const addArrayItem = (field) => {
        setData(field, [...(data[field] || []), '']);
    };

    const removeArrayItem = (field, index) => {
        const list = [...(data[field] || [])];
        list.splice(index, 1);
        setData(field, list);
    };

    // Targets handlers
    const quantList = Array.isArray(data.targets.quantitative) ? data.targets.quantitative : [data.targets.quantitative || ''];
    const qualList = Array.isArray(data.targets.qualitative) ? data.targets.qualitative : [data.targets.qualitative || ''];

    const handleTargetChange = (type, index, value) => {
        const list = type === 'quant' ? [...quantList] : [...qualList];
        list[index] = value;
        setData('targets', {
            ...data.targets,
            [type === 'quant' ? 'quantitative' : 'qualitative']: list
        });
    };

    const addTargetItem = (type) => {
        const list = type === 'quant' ? quantList : qualList;
        setData('targets', {
            ...data.targets,
            [type === 'quant' ? 'quantitative' : 'qualitative']: [...list, '']
        });
    };

    const removeTargetItem = (type, index) => {
        const list = type === 'quant' ? [...quantList] : [...qualList];
        list.splice(index, 1);
        setData('targets', {
            ...data.targets,
            [type === 'quant' ? 'quantitative' : 'qualitative']: list
        });
    };

    // Dynamic Strategy Handler
    const toggleDynamicStrategy = (catId, itemId) => {
        const currentCatItems = data.strategy_selections[catId] || [];
        const updatedCatItems = currentCatItems.includes(itemId)
            ? currentCatItems.filter(id => id !== itemId)
            : [...currentCatItems, itemId];

        setData('strategy_selections', {
            ...data.strategy_selections,
            [catId]: updatedCatItems
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('projects.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black leading-tight text-purple-950 font-sans">
                            📋 เสนอโครงการใหม่ (Official Project Proposal)
                        </h2>
                        <p className="text-xs text-slate-500 font-sans mt-0.5">
                            ตรงตามแบบฟอร์มมาตรฐาน วิทยาลัยสารพัดช่างน่าน
                        </p>
                    </div>
                    <Link
                        href={route('dashboard')}
                        className="inline-flex items-center rounded-xl border border-purple-200 bg-white px-4 py-2 text-xs font-bold text-purple-800 shadow-xs hover:bg-purple-50 transition-all"
                    >
                        ← ย้อนกลับหน้าศูนย์ควบคุม
                    </Link>
                </div>
            }
        >
            <Head title="เสนอโครงการใหม่ - NPC SMART FLOW" />

            <div className="py-8 font-sans">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white p-8 shadow-sm">
                        
                        {/* Visual Workflow Stepper Bar */}
                        <ProjectWorkflowStepper currentStep={1} status="draft" />

                        {/* Top One-Click AI Assistant Banner */}
                        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 rounded-2xl p-5 text-white flex justify-between items-center mb-6 shadow-md">
                            <div>
                                <h3 className="text-base font-bold flex items-center gap-1.5">
                                    <span>🪄</span> ผู้ช่วย AI จัดพิมพ์แบบเสนอโครงการอัตโนมัติ
                                </h3>
                                <p className="text-xs text-purple-200 mt-1">
                                    พิมพ์ชื่อโครงการ แล้วกดปุ่มเพื่อให้ AI ยกร่างหลักการ เหตุผล วัตถุประสงค์ ผลผลิต ผลลัพธ์ และแผนดำเนินงานให้อัตโนมัติใน 1 คลิก!
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleGenerateFullProposalAi}
                                disabled={generatingAi}
                                className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-purple-950 shadow-md hover:bg-purple-50 hover:scale-105 transition-all whitespace-nowrap disabled:opacity-50"
                            >
                                {generatingAi ? '🪄 AI กำลังจัดพิมพ์...' : '✨ ให้ AI จัดพิมพ์ทั้งฉบับ'}
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 text-sm text-slate-800 font-sans">
                            
                            {/* 1. Title & Academic Year */}
                            <div className="space-y-4 bg-purple-50/30 p-5 rounded-2xl border border-purple-100">
                                <h4 className="text-sm font-bold text-purple-950 border-b border-purple-100 pb-2">๑. ข้อมูลเบื้องต้นโครงการ</h4>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        ชื่อโครงการ (Project Title) *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="w-full rounded-xl border-purple-200 px-4 py-2.5 text-sm font-bold text-purple-950 focus:border-purple-500 focus:ring-purple-500"
                                        placeholder="เช่น โครงการประเมินผลการดำเนินงานศูนย์บ่มเพาะผู้ประกอบการอาชีวศึกษา ระดับจังหวัด"
                                        required
                                    />
                                    {errors.title && <span className="text-xs text-rose-500 mt-1 block">{errors.title}</span>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">ปีงบประมาณ / ปีการศึกษา พ.ศ. *</label>
                                        <input
                                            type="number"
                                            value={data.academic_year}
                                            onChange={(e) => setData('academic_year', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">วงเงินงบประมาณเสนอขอ (บาท) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.estimated_budget}
                                            onChange={(e) => setData('estimated_budget', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm font-bold text-purple-900 focus:border-purple-500 focus:ring-purple-500"
                                            placeholder="3000.00"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">ผู้รับผิดชอบโครงการ (ชื่อ-สกุล)</label>
                                        <input
                                            type="text"
                                            value={data.responsible_person}
                                            onChange={(e) => setData('responsible_person', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">ตำแหน่งผู้รับผิดชอบ</label>
                                        <input
                                            type="text"
                                            value={data.position}
                                            onChange={(e) => setData('position', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">โทรศัพท์เคลื่อนที่</label>
                                        <input
                                            type="text"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 2. Characteristics & Strategic Goals */}
                            <div className="space-y-3 bg-purple-50/30 p-5 rounded-2xl border border-purple-100">
                                <h4 className="text-sm font-bold text-purple-950 border-b border-purple-100 pb-2">๒. ลักษณะโครงการและความสอดคล้อง</h4>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">พันธกิจที่ (สถานศึกษา)</label>
                                    <input
                                        type="text"
                                        value={data.mission}
                                        onChange={(e) => setData('mission', e.target.value)}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">เป้าประสงค์ (สถานศึกษา)</label>
                                    <input
                                        type="text"
                                        value={data.goal}
                                        onChange={(e) => setData('goal', e.target.value)}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">กลยุทธ์ที่ (สถานศึกษา)</label>
                                    <input
                                        type="text"
                                        value={data.strategy_tactic}
                                        onChange={(e) => setData('strategy_tactic', e.target.value)}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                    />
                                </div>
                            </div>

                            {/* 3. Background Rationale */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        ๓. ความสำคัญของโครงการ/ หลักการและเหตุผล *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateAiRationale}
                                        disabled={generatingAi}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 shadow-2xs transition-all disabled:opacity-50"
                                    >
                                        {generatingAi ? '🪄 AI กำลังจัดพิมพ์...' : '✨ ให้ AI ช่วยเขียนหลักการและเหตุผล'}
                                    </button>
                                </div>
                                <textarea
                                    rows={5}
                                    value={data.background_rationale}
                                    onChange={(e) => setData('background_rationale', e.target.value)}
                                    className="w-full rounded-xl border-purple-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-purple-500"
                                    placeholder="ระบุความสำคัญ สภาพปัญหา และความจำเป็น..."
                                    required
                                ></textarea>
                            </div>

                            {/* 4. Objectives */}
                            <div className="space-y-3 bg-purple-50/40 p-4 rounded-xl border border-purple-100">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-purple-950">
                                        ๔. วัตถุประสงค์ของโครงการ *
                                    </label>
                                    <span className="text-[11px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                                        {data.objectives.length} ข้อ
                                    </span>
                                </div>
                                {data.objectives.map((obj, index) => (
                                    <div key={index} className="flex gap-x-2 items-center">
                                        <span className="text-xs font-bold text-purple-700 w-8 text-right">๔.{index + 1}</span>
                                        <input
                                            type="text"
                                            value={obj}
                                            onChange={(e) => handleArrayChange('objectives', index, e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                            required
                                        />
                                        {data.objectives.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeArrayItem('objectives', index)}
                                                className="text-rose-500 hover:text-rose-700 font-bold px-2"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addArrayItem('objectives')}
                                    className="text-xs font-bold text-purple-700 hover:text-purple-900 pt-1 block"
                                >
                                    + เพิ่มวัตถุประสงค์อีกข้อ
                                </button>
                            </div>

                            {/* 5. Outputs & 6. Outcomes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Outputs */}
                                <div className="space-y-3 bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                                    <label className="block text-xs font-bold text-slate-800">
                                        ๕. ผลผลิตโครงการ (Output)
                                    </label>
                                    {(data.outputs || []).map((op, idx) => (
                                        <div key={idx} className="flex gap-x-2 items-center">
                                            <span className="text-xs font-bold text-slate-500 w-7">๕.{idx + 1}</span>
                                            <input
                                                type="text"
                                                value={op}
                                                onChange={(e) => handleArrayChange('outputs', idx, e.target.value)}
                                                className="w-full rounded-xl border-purple-200 px-3 py-1.5 text-xs"
                                            />
                                            {(data.outputs || []).length > 1 && (
                                                <button type="button" onClick={() => removeArrayItem('outputs', idx)} className="text-rose-500 font-bold">✕</button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addArrayItem('outputs')} className="text-xs font-bold text-purple-700 pt-1 block">+ เพิ่มผลผลิต</button>
                                </div>

                                {/* Outcomes */}
                                <div className="space-y-3 bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                                    <label className="block text-xs font-bold text-slate-800">
                                        ๖. ผลลัพธ์โครงการ (Outcome)
                                    </label>
                                    {(data.outcomes || []).map((oc, idx) => (
                                        <div key={idx} className="flex gap-x-2 items-center">
                                            <span className="text-xs font-bold text-slate-500 w-7">๖.{idx + 1}</span>
                                            <input
                                                type="text"
                                                value={oc}
                                                onChange={(e) => handleArrayChange('outcomes', idx, e.target.value)}
                                                className="w-full rounded-xl border-purple-200 px-3 py-1.5 text-xs"
                                            />
                                            {(data.outcomes || []).length > 1 && (
                                                <button type="button" onClick={() => removeArrayItem('outcomes', idx)} className="text-rose-500 font-bold">✕</button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addArrayItem('outcomes')} className="text-xs font-bold text-purple-700 pt-1 block">+ เพิ่มผลลัพธ์</button>
                                </div>
                            </div>

                            {/* 7. Target Groups & Location */}
                            <div className="space-y-4 bg-purple-50/30 p-5 rounded-2xl border border-purple-100">
                                <h4 className="text-sm font-bold text-purple-950 border-b border-purple-100 pb-2">๗. กลุ่มเป้าหมาย และ ๘. พื้นที่ดำเนินการ</h4>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-800 mb-2">๗.๑ เชิงปริมาณ *</label>
                                        {quantList.map((item, idx) => (
                                            <div key={idx} className="flex gap-x-2 items-center mb-2">
                                                <span className="text-xs font-bold text-slate-500 w-10">๗.๑.{idx + 1}</span>
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => handleTargetChange('quant', idx, e.target.value)}
                                                    className="w-full rounded-xl border-purple-200 px-3 py-1.5 text-xs"
                                                    required
                                                />
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => addTargetItem('quant')} className="text-xs font-bold text-purple-700 block">+ เพิ่มเป้าหมายเชิงปริมาณ</button>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-800 mb-2">๗.๒ เชิงคุณภาพ *</label>
                                        {qualList.map((item, idx) => (
                                            <div key={idx} className="flex gap-x-2 items-center mb-2">
                                                <span className="text-xs font-bold text-slate-500 w-10">๗.๒.{idx + 1}</span>
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => handleTargetChange('qual', idx, e.target.value)}
                                                    className="w-full rounded-xl border-purple-200 px-3 py-1.5 text-xs"
                                                    required
                                                />
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => addTargetItem('qual')} className="text-xs font-bold text-purple-700 block">+ เพิ่มเป้าหมายเชิงคุณภาพ</button>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">๘. พื้นที่ดำเนินการ</label>
                                    <input
                                        type="text"
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Strategy Alignments */}
                            <div className="space-y-6 pt-2">
                                <div className="border-b border-purple-100 pb-2">
                                    <h4 className="text-sm font-bold text-purple-950">ความสอดคล้องกับยุทธศาสตร์การพัฒนา (Strategic Alignments)</h4>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    {strategyCategories.map((cat, catIdx) => {
                                        const selectedIds = data.strategy_selections[cat.id] || [];
                                        return (
                                            <div key={cat.id} className="space-y-3 bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="block text-xs font-bold text-purple-950">
                                                        {catIdx + 1}. {cat.name}
                                                    </label>
                                                    <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                                                        เลือกแล้ว {selectedIds.length} ข้อ
                                                    </span>
                                                </div>
                                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                                    {(cat.items || []).map(item => {
                                                        const isChecked = selectedIds.includes(item.id);
                                                        return (
                                                            <label
                                                                key={item.id}
                                                                className={`flex items-start gap-x-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                                                                    isChecked
                                                                        ? 'bg-purple-100/80 border-purple-400 font-bold text-purple-950 shadow-2xs'
                                                                        : 'bg-white border-purple-100 text-slate-700 hover:bg-purple-50'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => toggleDynamicStrategy(cat.id, item.id)}
                                                                    className="mt-0.5 rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                                                                />
                                                                <span>{item.name}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
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
                                    💾 บันทึกแบบเสนอโครงการ
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
