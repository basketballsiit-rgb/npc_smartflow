import React from 'react';

export default function WorkloadAnalyzerModal({ isOpen, onClose, isLoading, analysis }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-purple-100 max-w-4xl w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
                
                {/* Header */}
                <div className="flex items-start justify-between border-b border-purple-100 pb-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200">
                            <span>🤖</span> AI Personnel Workload & Fairness Analytics
                        </div>
                        <h3 className="text-xl font-black text-slate-900">
                            วิเคราะห์การกระจายภาระงานบุคลากรเชิงลึก (AI Workload Analyzer)
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500">
                            ประเมินความสมดุลของบทบาทหน้าที่ โครงการที่ขับเคลื่อน และการจัดสรรงานอย่างเป็นธรรมตามระเบียบ สอศ.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                    {isLoading ? (
                        <div className="py-16 text-center space-y-4">
                            <div className="inline-block animate-spin text-4xl">⚡</div>
                            <p className="text-slate-700 font-bold text-base">กำลังให้ Gemini AI ประมวลผลและวิเคราะห์ภาระงานบุคลากร...</p>
                            <p className="text-xs text-slate-400">ระบบกำลังคำนวณจำนวนบทบาทหน้าที่ ความรับผิดชอบโครงการ และสัดส่วนภาระงานรายบุคคล</p>
                        </div>
                    ) : analysis ? (
                        <div className="space-y-6">
                            
                            {/* Score & Executive Summary Card */}
                            <div className="rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 text-white p-6 shadow-md border border-purple-800/50">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                    {/* Score Gauge */}
                                    <div className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-2xl border border-white/15 min-w-[130px] shrink-0">
                                        <span className="text-3xl font-black text-amber-300 font-mono">
                                            {analysis.workload_balance_score || 85}
                                        </span>
                                        <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wide mt-1">
                                            ดัชนีความสมดุล
                                        </span>
                                        <span className="text-[10px] text-emerald-300 font-medium">/ 100 คะแนน</span>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-amber-200 flex items-center gap-1.5">
                                            <span>📊</span> สรุปภาพรวมสำหรับผู้บริหาร (Executive Summary)
                                        </h4>
                                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                                            {analysis.executive_summary}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Two Columns: High Workload vs Capacity Available */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                
                                {/* 1. High Workload Alerts */}
                                <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 space-y-3">
                                    <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                                        <span>⚠️</span>
                                        <h4>บุคลากรที่มีภาระงานหนาแน่น (เฝ้าระวังคอขวด/หมดไฟ)</h4>
                                    </div>
                                    <div className="space-y-2.5">
                                        {(analysis.high_workload_alerts || []).length === 0 ? (
                                            <p className="text-xs text-slate-500 py-3 text-center">ไม่พบบุคลากรที่มีภาระงานเกินเกณฑ์มาตรฐาน</p>
                                        ) : (
                                            analysis.high_workload_alerts.map((item, idx) => (
                                                <div key={idx} className="rounded-xl border border-rose-200/80 bg-white p-3 space-y-1 shadow-2xs">
                                                    <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                                                        <span>👤 {item.name}</span>
                                                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px]">ภาระงานสูง</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-600">{item.reason}</p>
                                                    <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg mt-1 font-medium">
                                                        💡 แนะนำ: {item.recommendation}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* 2. Balanced / Capacity Available */}
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                                        <span>🌱</span>
                                        <h4>บุคลากรที่มีศักยภาพพร้อมรับบทบาทสนับสนุนเพิ่ม</h4>
                                    </div>
                                    <div className="space-y-2.5">
                                        {(analysis.balanced_capacity_personnel || []).length === 0 ? (
                                            <p className="text-xs text-slate-500 py-3 text-center">บุคลากรทุกท่านมีภาระงานตามเกณฑ์กำหนด</p>
                                        ) : (
                                            analysis.balanced_capacity_personnel.map((item, idx) => (
                                                <div key={idx} className="rounded-xl border border-emerald-200/80 bg-white p-3 space-y-1 shadow-2xs">
                                                    <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                                                        <span>👤 {item.name}</span>
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">มีศักยภาพว่าง</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-600">{item.status}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                            </div>

                            {/* Fairness Recommendations */}
                            {analysis.fairness_recommendations && analysis.fairness_recommendations.length > 0 && (
                                <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 space-y-2.5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                                        <span>🎯</span> คำแนะนำเชิงนโยบายเพื่อการกระจายงานอย่างเป็นธรรม (Fairness Actionables)
                                    </h4>
                                    <ul className="space-y-1.5 text-xs text-purple-950">
                                        {analysis.fairness_recommendations.map((rec, rIdx) => (
                                            <li key={rIdx} className="flex items-start gap-2">
                                                <span className="text-purple-600 font-bold">•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-3 border-t border-purple-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md transition"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>

            </div>
        </div>
    );
}
