import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function Evaluate({ project, survey }) {
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Dynamic questions from backend survey or fallback
    const rawQuestions = Array.isArray(survey?.questions) && survey.questions.length > 0
        ? survey.questions
        : [
            { id: 1, category: 'ด้านกระบวนการจัดกิจกรรม (Process)', question: 'กิจกรรมสอดคล้องกับวัตถุประสงค์และเป้าหมายของโครงการ' },
            { id: 2, category: 'ด้านเนื้อหาและการถ่ายทอดความรู้ (Content)', question: 'เนื้อหาสาระ วิทยากร และรูปแบบการให้ความรู้มีความเหมาะสม ชัดเจน' },
            { id: 3, category: 'ด้านระยะเวลาและสิ่งอำนวยความสะดวก (Facilities)', question: 'ระยะเวลา สถานที่ สื่อโสตทัศนูปกรณ์ และการประสานงานมีความพร้อม' },
            { id: 4, category: 'ด้านประโยชน์และการนำไปใช้ (Outcomes)', question: 'ความรู้และทักษะที่ได้รับสามารถนำไปประยุกต์ใช้ในการปฏิบัติงานหรือการเรียนรู้ได้จริง' },
            { id: 5, category: 'ด้านความพึงพอใจในภาพรวม (Overall)', question: 'ความพึงพอใจในภาพรวมต่อการจัดกิจกรรมและการดำเนินโครงการ' },
        ];

    // Initial ratings map
    const initialRatings = {};
    rawQuestions.forEach((q, idx) => {
        initialRatings[q.id || (idx + 1)] = 5;
    });

    const { data, setData, post, processing, reset, errors } = useForm({
        ratings: initialRatings,
        respondent_name: '',
        respondent_type: 'student',
        gender: 'male',
        education_level: 'voc_cert',
        comments: '',
    });

    const { flash } = usePage().props;

    const handleRatingChange = (qId, val) => {
        setData('ratings', {
            ...data.ratings,
            [qId]: val
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('surveys.submit_response', project.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitted(true);
                reset('comments', 'respondent_name');
                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกสำเร็จ!',
                    text: 'ขอบคุณที่ร่วมตอบแบบประเมินความพึงพอใจโครงการ',
                    confirmButtonColor: '#7c3aed',
                    confirmButtonText: 'ตกลง'
                });
            }
        });
    };

    const ratingLevels = [
        { val: 5, label: 'ดีมาก / มากที่สุด', short: 'ดีมาก', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
        { val: 4, label: 'ดี', short: 'ดี', color: 'bg-teal-600 hover:bg-teal-700 text-white' },
        { val: 3, label: 'ปานกลาง', short: 'ปานกลาง', color: 'bg-amber-500 hover:bg-amber-600 text-white' },
        { val: 2, label: 'น้อย / พอใช้', short: 'น้อย', color: 'bg-orange-500 hover:bg-orange-600 text-white' },
        { val: 1, label: 'น้อยที่สุด / ปรับปรุง', short: 'ปรับปรุง', color: 'bg-rose-500 hover:bg-rose-600 text-white' },
    ];

    // Standardize all numerals to Arabic numerals
    const toArabicNumerals = (num) => {
        if (num === null || num === undefined) return '';
        const thaiToArabic = {
            '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
            '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9'
        };
        return String(num).replace(/[๐-๙]/g, (ch) => thaiToArabic[ch] || ch);
    };
    const toThaiNumerals = toArabicNumerals;

    return (
        <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
            <Head title={`ประเมินโครงการ: ${project.title}`} />
            
            <div className="max-w-2xl mx-auto">
                <div className="bg-white shadow-xl border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-6">
                    
                    {/* Header Banner */}
                    <div className="border-b border-purple-100 pb-6 text-center">
                        <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
                            📋
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                            NPC Smart Evaluation System
                        </span>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                            {survey?.title || 'แบบประเมินความพึงพอใจโครงการ'}
                        </h1>
                        <p className="mt-2 text-sm font-bold text-purple-900">
                            โครงการ: <span className="underline decoration-purple-300">{project.title}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            ประจำปีการศึกษา {project.academic_year} | วิทยาลัยสารพัดช่างน่าน
                        </p>
                    </div>

                    {isSubmitted || flash?.message ? (
                        <div className="py-8 text-center space-y-6 animate-fade-in">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner animate-bounce">
                                ✓
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">
                                    บันทึกผลการประเมินเรียบร้อยแล้ว!
                                </h3>
                                <p className="text-sm font-bold text-purple-900 mt-1">
                                    {project.title}
                                </p>
                            </div>
                            <div className="bg-emerald-50/90 border border-emerald-200 text-emerald-900 p-5 rounded-2xl text-xs leading-relaxed max-w-lg mx-auto shadow-2xs">
                                <p className="font-bold text-sm text-emerald-950">🎉 ขอบพระคุณอย่างยิ่งสำหรับความร่วมมือในการตอบแบบประเมิน</p>
                                <p className="text-xs text-emerald-800 mt-1.5">
                                    ข้อมูลการประเมินของท่านได้รับการบันทึกเข้าสู่ฐานข้อมูลระบบบริหารจัดการโครงการ เพื่อนำไปประมวลผลทางสถิติและสังเคราะห์รายงานผลบทที่ 4 ต่อไป
                                </p>
                            </div>
                            <div className="pt-2 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSubmitted(false);
                                        reset();
                                    }}
                                    className="inline-flex justify-center items-center gap-1.5 rounded-xl bg-purple-600 py-3 px-6 text-xs font-bold text-white shadow-md hover:bg-purple-700 hover:scale-105 active:scale-95 transition-all"
                                >
                                    📝 ตอบแบบประเมินฉบับใหม่
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Part 1: Demographic Information */}
                            <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-4 shadow-2xs">
                                <div className="border-b border-purple-200/80 pb-2">
                                    <h2 className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
                                        <span>👤</span> ตอนที่ 1: ข้อมูลทั่วไปของผู้ตอบแบบประเมิน (General Information)
                                    </h2>
                                    <p className="text-[11px] text-purple-800 mt-0.5">
                                        โปรดเลือกข้อมูลสถานะ เพศ และระดับการศึกษาของท่านตามความเป็นจริง
                                    </p>
                                </div>

                                {/* 1.1 สถานะผู้ตอบ */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-purple-950">
                                        1. สถานะของผู้ตอบแบบประเมิน
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                            { key: 'student', label: 'นักเรียน/นักศึกษา' },
                                            { key: 'teacher', label: 'ครู/อาจารย์' },
                                            { key: 'staff', label: 'บุคลากร/เจ้าหน้าที่' },
                                            { key: 'public', label: 'ประชาชน/ผู้ปกครอง' },
                                        ].map((type) => (
                                            <button
                                                key={type.key}
                                                type="button"
                                                onClick={() => setData('respondent_type', type.key)}
                                                className={`py-2 px-3 rounded-xl text-xs font-bold transition text-center border ${
                                                    data.respondent_type === type.key
                                                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-1 ring-purple-300'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-100/50'
                                                }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 1.2 เพศ */}
                                <div className="space-y-2 pt-2 border-t border-purple-100">
                                    <label className="block text-xs font-bold text-purple-950">
                                        2. เพศ
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: 'male', label: '👨 ชาย' },
                                            { key: 'female', label: '👩 หญิง' },
                                        ].map((item) => (
                                            <button
                                                key={item.key}
                                                type="button"
                                                onClick={() => setData('gender', item.key)}
                                                className={`py-2 px-3 rounded-xl text-xs font-bold transition text-center border ${
                                                    data.gender === item.key
                                                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-1 ring-purple-300'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-100/50'
                                                }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 1.3 ระดับการศึกษา */}
                                <div className="space-y-2 pt-2 border-t border-purple-100">
                                    <label className="block text-xs font-bold text-purple-950">
                                        3. ระดับการศึกษา
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {[
                                            { key: 'voc_cert', label: 'ปวช.' },
                                            { key: 'high_voc_cert', label: 'ปวส.' },
                                            { key: 'bachelor', label: 'ป.ตรี' },
                                            { key: 'master', label: 'ป.โท' },
                                            { key: 'doctorate', label: 'ป.เอก' },
                                            { key: 'other', label: 'อื่นๆ' },
                                        ].map((edu) => (
                                            <button
                                                key={edu.key}
                                                type="button"
                                                onClick={() => setData('education_level', edu.key)}
                                                className={`py-2 px-3 rounded-xl text-xs font-bold transition text-center border ${
                                                    data.education_level === edu.key
                                                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-1 ring-purple-300'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-100/50'
                                                }`}
                                            >
                                                {edu.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            {/* Question List */}
                            <div className="space-y-5">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                        <span>📊</span> ตอนที่ 2: ความพึงพอใจต่อการดำเนินโครงการ
                                    </h2>
                                    <span className="text-[11px] text-slate-500">
                                        เกณฑ์ให้คะแนน 5 ระดับ (5 = มากที่สุด ถึง 1 = ปรับปรุง)
                                    </span>
                                </div>

                                {rawQuestions.map((q, index) => {
                                    const qId = q.id || (index + 1);
                                    const currentScore = data.ratings[qId] ?? 5;
                                    const levelObj = ratingLevels.find((l) => l.val === currentScore);

                                    return (
                                        <div
                                            key={qId}
                                            className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-purple-200 transition space-y-3"
                                        >
                                            <div className="space-y-1">
                                                {q.category && (
                                                    <span className="inline-block text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                                                        {q.category}
                                                    </span>
                                                )}
                                                <label className="block text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                                    {toArabicNumerals(index + 1)}. {q.question}
                                                </label>
                                            </div>

                                            {/* Rating Buttons */}
                                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                                {[5, 4, 3, 2, 1].map((val) => {
                                                    const isSelected = currentScore === val;
                                                    return (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => handleRatingChange(qId, val)}
                                                            className={`flex-1 sm:flex-none min-w-[54px] py-2 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 border ${
                                                                isSelected
                                                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-300 scale-105'
                                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            <span className="text-sm font-black">{toArabicNumerals(val)}</span>
                                                            <span className="text-[10px] opacity-80">
                                                                {val === 5 ? 'มากที่สุด' : val === 4 ? 'มาก' : val === 3 ? 'ปานกลาง' : val === 2 ? 'น้อย' : 'ปรับปรุง'}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div className="text-right text-[11px] font-medium text-purple-900 pt-0.5">
                                                ระดับคะแนนที่เลือก: <span className="font-bold">{levelObj?.label}</span> ({toArabicNumerals(currentScore)} / 5)
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Comments */}
                            <div className="border-t border-purple-100 pt-5 space-y-2">
                                <label className="block text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>💬</span> ตอนที่ 3: ข้อเสนอแนะเพิ่มเติมเพื่อการปรับปรุงและพัฒนา (Suggestions)
                                </label>
                                <textarea
                                    rows={4}
                                    value={data.comments}
                                    onChange={(e) => setData('comments', e.target.value)}
                                    className="block w-full rounded-2xl border-slate-300 focus:border-purple-500 focus:ring-purple-500 text-xs sm:text-sm leading-relaxed"
                                    placeholder="ระบุข้อเสนอแนะเพิ่มเติม สิ่งที่ประทับใจ หรือข้อควรปรับปรุงสำหรับการจัดโครงการในครั้งต่อไป..."
                                />
                                {errors.comments && <span className="text-xs text-rose-500 mt-1">{errors.comments}</span>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full inline-flex justify-center items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 py-3.5 px-6 text-sm font-black text-white shadow-lg shadow-purple-600/30 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>กำลังส่งข้อมูล...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>🚀</span>
                                        <span>ส่งแบบประเมินโครงการ (Submit Evaluation)</span>
                                    </>
                                )}
                            </button>

                        </form>
                    )}
                    
                </div>
            </div>
        </div>
    );
}
