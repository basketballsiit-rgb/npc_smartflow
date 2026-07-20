import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Stats({ project, totalResponses, averages, comments, actRecommendation, qrCodeUrl, evaluationUrl }) {
    const [copied, setCopied] = useState(false);
    const [generating, setGenerating] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(evaluationUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGenerateAi = () => {
        setGenerating(true);
        router.post(route('surveys.generate_ai', project.id), {}, {
            onFinish: () => setGenerating(false)
        });
    };

    const questions = [
        { label: 'Q1. กิจกรรมสอดคล้องกับวัตถุประสงค์โครงการ', val: averages.q1 },
        { label: 'Q2. ระยะเวลาการจัดกิจกรรมมีความเหมาะสม', val: averages.q2 },
        { label: 'Q3. การประสานงานและการอำนวยความสะดวก', val: averages.q3 },
        { label: 'Q4. เอกสารและสื่อประกอบกิจกรรม', val: averages.q4 },
        { label: 'Q5. ประโยชน์ที่ได้รับสามารถนำไปปรับใช้ได้จริง', val: averages.q5 },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between font-sans whitespace-nowrap flex-nowrap gap-4">
                    <h2 className="text-2xl font-bold leading-tight text-purple-950 dark:text-gray-100 whitespace-nowrap shrink-0">
                        📊 สรุปผลการประเมินความพึงพอใจโครงการ: {project.title}
                    </h2>
                    <Link
                        href={route('dashboard')}
                        className="inline-flex items-center rounded-xl border border-purple-200 bg-white px-4 py-2 text-sm font-bold text-purple-800 hover:bg-purple-50 transition-colors shadow-2xs whitespace-nowrap shrink-0"
                    >
                        ← ย้อนกลับหน้าศูนย์ควบคุม
                    </Link>
                </div>
            }
        >
            <Head title={`สรุปผลแบบประเมิน: ${project.title}`} />

            <div className="py-8 font-sans">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        
                        {/* Analytical breakdown */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Key Stats Summary */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600">จำนวนผู้ตอบแบบประเมินทั้งหมด</h4>
                                    <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{totalResponses} คน</p>
                                </div>
                                <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600">ระดับความพึงพอใจภาพรวม</h4>
                                    <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">{averages.satisfaction_percentage}%</p>
                                </div>
                            </div>

                            {/* Detailed Question breakdown */}
                            <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <h3 className="text-base font-bold text-purple-950 dark:text-white mb-6">สรุปผลคะแนนความพึงพอใจรายข้อ</h3>
                                <div className="space-y-6">
                                    {questions.map((q, idx) => {
                                        const percent = Math.round((q.val / 5) * 100);
                                        return (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex justify-between text-sm font-semibold">
                                                    <span className="text-slate-800 dark:text-gray-300">{q.label}</span>
                                                    <span className="text-purple-700 font-bold dark:text-purple-400">{q.val} / 5.0 ({percent}%)</span>
                                                </div>
                                                <div className="w-full bg-purple-50 rounded-full h-3 dark:bg-gray-700 overflow-hidden border border-purple-100">
                                                    <div 
                                                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-3 rounded-full transition-all duration-500" 
                                                        style={{ width: `${percent}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* AI Recommendations Section */}
                            <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                                    <h3 className="text-base font-bold text-purple-950 dark:text-white">ข้อเสนอแนะเชิงรุกและแนวทางการปรับปรุง (AI ACT Phase)</h3>
                                    <button
                                        onClick={handleGenerateAi}
                                        disabled={generating || totalResponses === 0}
                                        className="inline-flex items-center rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 disabled:opacity-50 transition-all"
                                    >
                                        {generating ? 'กำลังวิเคราะห์ด้วย Gemini AI...' : '🤖 วิเคราะห์ข้อมูลด้วย Gemini AI'}
                                    </button>
                                </div>

                                {actRecommendation ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-gray-300 bg-white p-5 rounded-xl border border-purple-100 dark:bg-gray-900 dark:border-gray-750 whitespace-pre-line leading-relaxed shadow-2xs">
                                        {actRecommendation}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500">ยังไม่มีข้อมูลข้อเสนอแนะ ให้กดปุ่ม "วิเคราะห์ข้อมูลด้วย Gemini AI" ด้านบนเพื่อประมวลผลประเมินผลโครงการ</p>
                                )}
                            </div>

                            {/* Suggestion log */}
                            <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <h3 className="text-base font-bold text-purple-950 dark:text-white mb-4">ข้อเสนอแนะเพิ่มเติมจากผู้ตอบแบบประเมิน</h3>
                                <div className="divide-y divide-purple-100 dark:divide-gray-700 space-y-4 max-h-80 overflow-y-auto">
                                    {comments.length === 0 ? (
                                        <p className="text-sm text-slate-500 py-4">ยังไม่มีข้อเสนอแนะเพิ่มเติมจากผู้ตอบแบบประเมิน</p>
                                    ) : (
                                        comments.map((sug, i) => (
                                            <div key={i} className="pt-4 first:pt-0">
                                                <p className="text-sm text-slate-700 dark:text-gray-300 italic">" {sug} "</p>
                                                <span className="block text-[10px] text-slate-400 mt-1">ผู้ตอบแบบประเมินคนที่ #{i + 1}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* QR Code and Share Links Panel */}
                        <div className="lg:col-span-1 space-y-6">
                            
                            <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 text-center">
                                <h3 className="text-base font-bold text-purple-950 dark:text-white mb-4">คิวอาร์โค้ดแบบประเมินความพึงพอใจ</h3>
                                
                                <div className="flex justify-center bg-purple-50/50 p-4 rounded-2xl border border-purple-100 dark:bg-gray-900 dark:border-gray-750 mb-4">
                                    <img 
                                        src={qrCodeUrl} 
                                        alt="คิวอาร์โค้ดแบบประเมิน"
                                        className="h-44 w-44 object-contain shadow-xs bg-white p-2 rounded-xl" 
                                    />
                                </div>
                                
                                <p className="text-xs text-slate-500 mb-4">สแกน คิวอาร์โค้ด (QR Code) ด้วยสมาร์ตโฟนเพื่อเข้าสู่แบบประเมินความพึงพอใจออนไลน์สำหรับผู้เข้าร่วมโครงการ</p>
                                
                                <div className="flex gap-x-2">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={evaluationUrl} 
                                        className="block w-full rounded-xl border-purple-200 bg-purple-50/30 text-xs shadow-2xs focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition-colors whitespace-nowrap"
                                    >
                                        {copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
                                    </button>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
