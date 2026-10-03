import React, { useState } from 'react';

export default function SmartBudgetRouterModal({ isOpen, onClose, onApplySource, projectTitle = '', projectObjectives = '', projectBudget = 0, projectItems = [] }) {
    const [title, setTitle] = useState(projectTitle);
    const [objectives, setObjectives] = useState(projectObjectives);
    const [budget, setBudget] = useState(projectBudget);
    const [loading, setLoading] = useState(false);
    const [recommendation, setRecommendation] = useState(null);

    if (!isOpen) return null;

    const handleAnalyze = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setRecommendation(null);

        try {
            const res = await axios.post(route('projects.ai.recommend_funding'), {
                title: title || 'โครงการ',
                objectives: typeof objectives === 'string' ? objectives : (Array.isArray(objectives) ? objectives.join(', ') : ''),
                items: projectItems,
                budget: parseFloat(budget) || 0
            });
            setRecommendation(res.data);
        } catch (err) {
            console.error('Smart budget routing error:', err);
            alert('เกิดข้อผิดพลาดในการวิเคราะห์แหล่งเงิน กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (!recommendation) return;
        if (onApplySource) {
            onApplySource(recommendation.recommended_source, recommendation);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="text-2xl">✨</span>
                        <div>
                            <h3 className="text-base font-black">
                                AI Smart Budget Routing (แนะนำแหล่งเงินงบประมาณ)
                            </h3>
                            <p className="text-[11px] text-purple-200/80">
                                วิเคราะห์ความสอดคล้องของโครงการและแนะนำแหล่งเงินตามระเบียบ สอศ.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-300 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                ชื่อโครงการที่ต้องการวิเคราะห์:
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-xs rounded-xl border-slate-200 focus:border-purple-500 focus:ring-purple-500 font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                วัตถุประสงค์ / กิจกรรมสำคัญ:
                            </label>
                            <textarea
                                rows={3}
                                value={typeof objectives === 'string' ? objectives : (Array.isArray(objectives) ? objectives.join('\n') : '')}
                                onChange={(e) => setObjectives(e.target.value)}
                                className="w-full text-xs rounded-xl border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                            />
                        </div>

                        <div className="flex justify-between items-center pt-1">
                            <span className="text-xs text-slate-500">
                                วงเงินงบประมาณ: <strong>{new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(budget || 0)}</strong>
                            </span>
                            <button
                                type="button"
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-md transition disabled:opacity-50"
                            >
                                {loading ? '⌛ กำลังวิเคราะห์ตามระเบียบ สอศ....' : '✨ ให้ AI แนะนำแหล่งเงิน'}
                            </button>
                        </div>
                    </div>

                    {/* Recommendation Card */}
                    {recommendation && (
                        <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-white border border-emerald-300 space-y-3 text-xs shadow-sm">
                            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">💡</span>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                                            แหล่งเงินงบประมาณที่แนะนำ (Recommended Funding Source)
                                        </div>
                                        <h4 className="text-base font-black text-emerald-950 mt-0.5">
                                            {recommendation.recommended_source}
                                        </h4>
                                    </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-black shrink-0">
                                    ความมั่นใจ {recommendation.confidence}%
                                </span>
                            </div>

                            <div className="space-y-1.5 text-slate-800">
                                <div>
                                    <strong className="text-slate-900">หมวดรายจ่าย: </strong>
                                    <span>{recommendation.category}</span>
                                </div>
                                <div>
                                    <strong className="text-slate-900">เหตุผลความสอดคล้อง: </strong>
                                    <span>{recommendation.reasoning}</span>
                                </div>
                                {recommendation.compliance_tips && (
                                    <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200 text-emerald-900">
                                        <strong className="text-emerald-950">📌 ข้อควรระวังตามระเบียบ: </strong>
                                        <span>{recommendation.compliance_tips}</span>
                                    </div>
                                )}
                                {recommendation.alternative_sources?.length > 0 && (
                                    <div className="text-slate-600 text-[11px]">
                                        <strong>แหล่งเงินทางเลือกอื่น: </strong>
                                        <span>{recommendation.alternative_sources.join(', ')}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 text-right">
                                <button
                                    type="button"
                                    onClick={handleApply}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition"
                                >
                                    ✓ นำแหล่งเงินนี้ไปใช้ในโครงการทันที
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-right">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    );
}
