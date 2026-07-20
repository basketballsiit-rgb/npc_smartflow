import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function Evaluate({ project }) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        rating_q1: 5,
        rating_q2: 5,
        rating_q3: 5,
        rating_q4: 5,
        rating_q5: 5,
        comments: '',
    });

    const { flash } = usePage().props;

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('surveys.submit_response', project.id), {
            onSuccess: () => {
                setIsSubmitted(true);
                reset('comments');
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

    const questions = [
        { key: 'rating_q1', label: '1. กิจกรรมสอดคล้องกับวัตถุประสงค์โครงการ (Activities met objectives)' },
        { key: 'rating_q2', label: '2. ระยะเวลาการจัดกิจกรรมมีความเหมาะสม (Appropriate duration)' },
        { key: 'rating_q3', label: '3. การประสานงานและการอำนวยความสะดวก (Facilities & coordination)' },
        { key: 'rating_q4', label: '4. เอกสารและสื่อประกอบกิจกรรม (Materials & documentation)' },
        { key: 'rating_q5', label: '5. ประโยชน์ที่ได้รับจากกิจกรรมสามารถนำไปปรับใช้ได้จริง (Useful & practical)' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <Head title={`ประเมินโครงการ: ${project.title}`} />
            
            <div className="max-w-2xl mx-auto">
                <div className="bg-white shadow-md border border-slate-200 rounded-3xl p-8 space-y-6">
                    
                    {/* Header */}
                    <div className="border-b border-purple-100 pb-6 text-center">
                        <span className="text-3xl mb-2 block">📋</span>
                        <h2 className="text-xl font-black text-purple-950">แบบประเมินความพึงพอใจโครงการ (Evaluation Survey)</h2>
                        <p className="mt-1.5 text-sm font-bold text-slate-800">โครงการ: <span className="text-purple-700">{project.title}</span></p>
                        <p className="text-xs text-slate-500 mt-1">ประจำปีการศึกษา {project.academic_year} | วิทยาลัยสารพัดช่างน่าน</p>
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
                                    ข้อมูลความคิดเห็นของท่านได้รับการบันทึกเข้าสู่ระบบเรียบร้อยแล้ว เพื่อนำไปประเมินผลและปรับปรุงการดำเนินงานโครงการของวิทยาลัยสารพัดช่างน่านให้มีประสิทธิภาพยิ่งขึ้น
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
                            
                            {/* Question List */}
                            <div className="space-y-6">
                                {questions.map((q) => (
                                    <div key={q.key} className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-900">
                                            {q.label}
                                        </label>
                                        <div className="flex items-center gap-x-4">
                                            {[1, 2, 3, 4, 5].map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setData(q.key, val)}
                                                    className={`h-10 w-10 rounded-xl text-sm font-black transition-all ${
                                                        data[q.key] === val
                                                            ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400 scale-105'
                                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                    }`}
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                            <span className="text-xs font-medium text-slate-500">
                                                ({data[q.key] === 5 ? 'ดีมาก / Very Good' : data[q.key] === 4 ? 'ดี / Good' : data[q.key] === 3 ? 'ปานกลาง / Fair' : data[q.key] === 2 ? 'น้อย / Unsatisfactory' : 'ปรับปรุง / Poor'})
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Comments */}
                            <div className="border-t border-purple-100 pt-6">
                                <label className="block text-sm font-bold text-slate-900">
                                    ข้อเสนอแนะเพิ่มเติม (Additional Suggestions)
                                </label>
                                <textarea
                                    rows={4}
                                    value={data.comments}
                                    onChange={(e) => setData('comments', e.target.value)}
                                    className="mt-2 block w-full rounded-xl border-purple-200 shadow-2xs focus:border-purple-500 focus:ring-purple-500 text-xs leading-relaxed"
                                    placeholder="ระบุข้อเสนอแนะเพื่อการปรับปรุงและพัฒนาโครงการครั้งต่อไป..."
                                ></textarea>
                                {errors.comments && <span className="text-xs text-rose-500 mt-1">{errors.comments}</span>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full inline-flex justify-center rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 py-3.5 px-4 text-sm font-black text-white shadow-md shadow-purple-600/25 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                            >
                                {processing ? '⌛ กำลังส่งข้อมูล...' : 'ส่งแบบประเมิน (Submit Evaluation)'}
                            </button>

                        </form>
                    )}
                    
                </div>
            </div>
        </div>
    );
}
