import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';
import ProjectWorkflowStepper from '@/Components/ProjectWorkflowStepper';

export default function Edit({ project, strategyCategories = [], iqaStrategies = [], ovecStrategies = [], nationalStrategies = [], provincialStrategies = [], departments = [] }) {
    const [generatingAi, setGeneratingAi] = useState(false);

    const initialQuant = Array.isArray(project?.targets?.quantitative)
        ? project.targets.quantitative
        : [project?.targets?.quantitative || ''];

    const initialQual = Array.isArray(project?.targets?.qualitative)
        ? project.targets.qualitative
        : [project?.targets?.qualitative || ''];

    // Initialize dynamic strategy selections
    const initialSelections = project?.strategy_selections || {};
    strategyCategories.forEach(cat => {
        if (!initialSelections[cat.id]) {
            initialSelections[cat.id] = cat.items?.[0]?.id ? [cat.items[0].id] : [];
        }
    });

    const { data, setData, patch, processing, errors } = useForm({
        title: project?.title || '',
        academic_year: project?.academic_year || 2569,
        background_rationale: project?.background_rationale || '',
        objectives: project?.objectives || [''],
        targets: {
            quantitative: initialQuant,
            qualitative: initialQual,
        },
        strategy_selections: initialSelections,
        iqa_strategy_ids: project?.iqa_strategy_ids || [],
        ovec_strategy_ids: project?.ovec_strategy_ids || [],
        national_strategy_ids: project?.national_strategy_ids || [],
        provincial_strategy_ids: project?.provincial_strategy_ids || [],
        estimated_budget: project?.estimated_budget || '',
    });

    // AI Generator Handlers
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
                Swal.fire('✨ AI จัดพิมพ์สำเร็จ!', 'ยกร่างหลักการและเหตุผลตามมาตรฐานวิทยาลัยสารพัดช่างน่านเรียบร้อยแล้ว', 'success');
            }
        } catch (err) {
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้', 'error');
        } finally {
            setGeneratingAi(false);
        }
    };

    const handleGenerateAiObjectives = async () => {
        if (!data.title.trim()) {
            Swal.fire('คำแนะนำ', 'กรุณาระบุชื่อโครงการก่อน ให้ AI ช่วยเสนอวัตถุประสงค์', 'info');
            return;
        }

        try {
            const res = await axios.post(route('projects.generate_ai_content'), {
                type: 'objectives',
                title: data.title,
            });

            if (res.data?.success && res.data.objectives) {
                setData('objectives', res.data.objectives);
                Swal.fire('✨ AI เสนอวัตถุประสงค์สำเร็จ!', 'ปรับปรุงชุดวัตถุประสงค์ให้ตรงตามเป้าหมายโครงการเรียบร้อยแล้ว', 'success');
            }
        } catch (err) {
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้', 'error');
        }
    };

    // Objectives handlers
    const handleObjectiveChange = (index, value) => {
        const list = [...data.objectives];
        list[index] = value;
        setData('objectives', list);
    };

    const addObjectiveField = () => {
        setData('objectives', [...data.objectives, '']);
    };

    const removeObjectiveField = (index) => {
        const list = [...data.objectives];
        list.splice(index, 1);
        setData('objectives', list);
    };

    // Quantitative Target handlers
    const quantList = Array.isArray(data.targets.quantitative)
        ? data.targets.quantitative
        : [data.targets.quantitative || ''];

    const handleQuantTargetChange = (index, value) => {
        const list = [...quantList];
        list[index] = value;
        setData('targets', { ...data.targets, quantitative: list });
    };

    const addQuantTarget = () => {
        setData('targets', { ...data.targets, quantitative: [...quantList, ''] });
    };

    const removeQuantTarget = (index) => {
        const list = [...quantList];
        list.splice(index, 1);
        setData('targets', { ...data.targets, quantitative: list });
    };

    // Qualitative Target handlers
    const qualList = Array.isArray(data.targets.qualitative)
        ? data.targets.qualitative
        : [data.targets.qualitative || ''];

    const handleQualTargetChange = (index, value) => {
        const list = [...qualList];
        list[index] = value;
        setData('targets', { ...data.targets, qualitative: list });
    };

    const addQualTarget = () => {
        setData('targets', { ...data.targets, qualitative: [...qualList, ''] });
    };

    const removeQualTarget = (index) => {
        const list = [...qualList];
        list.splice(index, 1);
        setData('targets', { ...data.targets, qualitative: list });
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
        patch(route('projects.update', project.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black leading-tight text-purple-950 font-sans">
                            ✏️ แก้ไขแบบเสนอโครงการ (Edit Project Proposal)
                        </h2>
                        <p className="text-xs text-slate-500 font-sans mt-0.5">
                            ปรับปรุงรายละเอียดข้อเสนอโครงการ วิทยาลัยสารพัดช่างน่าน
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
            <Head title="แก้ไขโครงการ - NPC SMART FLOW" />

            <div className="py-8 font-sans">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white p-8 shadow-sm">
                        
                        {/* Visual Workflow Stepper Bar */}
                        <ProjectWorkflowStepper currentStep={project?.current_approval_step || 1} status={project?.status || 'draft'} />

                        <form onSubmit={handleSubmit} className="space-y-6 text-sm text-slate-800 font-sans">
                            
                            {/* Form Header */}
                            <div className="border-b border-purple-100 pb-4 mb-6 flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block">แก้ไขรายละเอียดโครงการ</span>
                                    <h3 className="text-lg font-bold text-purple-950">{project?.title}</h3>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    ชื่อโครงการ (Project Title) *
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="w-full rounded-xl border-purple-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-purple-500"
                                    required
                                />
                                {errors.title && <span className="text-xs text-rose-500 mt-1 block">{errors.title}</span>}
                            </div>

                            {/* Academic Year & Estimated Budget */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        ปีการศึกษา พ.ศ. (Academic Year) *
                                    </label>
                                    <input
                                        type="number"
                                        value={data.academic_year}
                                        onChange={(e) => setData('academic_year', e.target.value)}
                                        className="w-full rounded-xl border-purple-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-purple-500"
                                        required
                                    />
                                    {errors.academic_year && <span className="text-xs text-rose-500 mt-1 block">{errors.academic_year}</span>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        วงเงินงบประมาณเสนอขอ (บาท) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.estimated_budget}
                                        onChange={(e) => setData('estimated_budget', e.target.value)}
                                        className="w-full rounded-xl border-purple-200 px-4 py-2.5 text-sm font-bold text-purple-900 focus:border-purple-500 focus:ring-purple-500"
                                        required
                                    />
                                    {errors.estimated_budget && <span className="text-xs text-rose-500 mt-1 block">{errors.estimated_budget}</span>}
                                </div>
                            </div>

                            {/* Background Rationale (With AI Assistant Button) */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        หลักการและเหตุผล (Background & Rationale) *
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
                                    required
                                ></textarea>
                                {errors.background_rationale && <span className="text-xs text-rose-500 mt-1 block">{errors.background_rationale}</span>}
                            </div>

                            {/* Objectives (Multiple Items with AI Generator) */}
                            <div className="space-y-3 bg-purple-50/40 p-4 rounded-xl border border-purple-100">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-purple-950">
                                        วัตถุประสงค์ของโครงการ (Objectives) *
                                    </label>
                                    <div className="flex gap-x-2 items-center">
                                        <button
                                            type="button"
                                            onClick={handleGenerateAiObjectives}
                                            className="text-xs font-bold text-purple-700 bg-white hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200"
                                        >
                                            ✨ ให้ AI ช่วยเขียนวัตถุประสงค์
                                        </button>
                                        <span className="text-[11px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                                            {data.objectives.length} ข้อ
                                        </span>
                                    </div>
                                </div>
                                {data.objectives.map((obj, index) => (
                                    <div key={index} className="flex gap-x-2 items-center">
                                        <span className="text-xs font-bold text-purple-700 w-6 text-right">{index + 1}.</span>
                                        <input
                                            type="text"
                                            value={obj}
                                            onChange={(e) => handleObjectiveChange(index, e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                            required
                                        />
                                        {data.objectives.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeObjectiveField(index)}
                                                className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 text-base"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addObjectiveField}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 pt-1"
                                >
                                    + เพิ่มวัตถุประสงค์อีกข้อ
                                </button>
                            </div>

                            {/* Targets (Multiple Items) */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                {/* Quantitative Targets */}
                                <div className="space-y-3 bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-slate-800">
                                            เป้าหมายเชิงปริมาณ (Quantitative Target) *
                                        </label>
                                        <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                                            {quantList.length} รายการ
                                        </span>
                                    </div>
                                    {quantList.map((item, idx) => (
                                        <div key={idx} className="flex gap-x-2 items-center">
                                            <span className="text-xs font-bold text-slate-500 w-5">{idx + 1}.</span>
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={(e) => handleQuantTargetChange(idx, e.target.value)}
                                                className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                                required
                                            />
                                            {quantList.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeQuantTarget(idx)}
                                                    className="text-rose-500 hover:text-rose-700 font-bold px-1.5"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addQuantTarget}
                                        className="text-xs font-bold text-purple-700 hover:text-purple-900 pt-1 block"
                                    >
                                        + เพิ่มเป้าหมายเชิงปริมาณอีกข้อ
                                    </button>
                                </div>

                                {/* Qualitative Targets */}
                                <div className="space-y-3 bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-slate-800">
                                            เป้าหมายเชิงคุณภาพ (Qualitative Target) *
                                        </label>
                                        <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                                            {qualList.length} รายการ
                                        </span>
                                    </div>
                                    {qualList.map((item, idx) => (
                                        <div key={idx} className="flex gap-x-2 items-center">
                                            <span className="text-xs font-bold text-slate-500 w-5">{idx + 1}.</span>
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={(e) => handleQualTargetChange(idx, e.target.value)}
                                                className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                                required
                                            />
                                            {qualList.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeQualTarget(idx)}
                                                    className="text-rose-500 hover:text-rose-700 font-bold px-1.5"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addQualTarget}
                                        className="text-xs font-bold text-purple-700 hover:text-purple-900 pt-1 block"
                                    >
                                        + เพิ่มเป้าหมายเชิงคุณภาพอีกข้อ
                                    </button>
                                </div>
                            </div>

                            {/* Strategic Alignments (Fully Dynamic Categories Multi-Select) */}
                            <div className="space-y-6 pt-2">
                                <div className="border-b border-purple-100 pb-2">
                                    <h4 className="text-sm font-bold text-purple-950">ความสอดคล้องกับยุทธศาสตร์การพัฒนา (Strategic Alignments)</h4>
                                    <p className="text-xs text-slate-500">สามารถคลิกเลือกติ๊กถูกยุทธศาสตร์ที่เกี่ยวข้องได้มากกว่า 1 ข้อในแต่ละหมวดหมู่</p>
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
                                                    {(!cat.items || cat.items.length === 0) && (
                                                        <span className="text-xs text-slate-400 block italic">ยังไม่มีตัวเลือกยุทธศาสตร์ในหมวดนี้</span>
                                                    )}
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
                                    💾 บันทึกการแก้ไขโครงการ
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
