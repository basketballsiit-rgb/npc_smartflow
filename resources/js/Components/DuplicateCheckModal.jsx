import React from 'react';

export default function DuplicateCheckModal({ isOpen, onClose, result, onConfirmProceed }) {
    if (!isOpen || !result) return null;

    const { has_duplicate, similarity_score, risk_level, matched_project_title, analysis, recommendation } = result;

    const getRiskColor = (level) => {
        switch (level) {
            case 'high':
                return {
                    badge: 'bg-rose-100 text-rose-800 border-rose-300',
                    header: 'from-rose-700 to-red-800',
                    icon: '🚨',
                    label: 'ความเสี่ยงสูง (มีโอกาสซ้ำซ้อนสูง)'
                };
            case 'medium':
                return {
                    badge: 'bg-amber-100 text-amber-800 border-amber-300',
                    header: 'from-amber-600 to-orange-700',
                    icon: '⚠️',
                    label: 'ความเสี่ยงปานกลาง (มีเนื้อหาใกล้เคียง)'
                };
            default:
                return {
                    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    header: 'from-emerald-600 to-teal-700',
                    icon: '✅',
                    label: 'ความเสี่ยงต่ำ / มีความเป็นเอกเทศ'
                };
        }
    };

    const riskInfo = getRiskColor(risk_level);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden space-y-0">
                {/* Header */}
                <div className={`bg-gradient-to-r ${riskInfo.header} px-6 py-4 text-white flex justify-between items-center`}>
                    <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{riskInfo.icon}</span>
                        <div>
                            <h3 className="text-base font-black">AI ตรวจสอบความซ้ำซ้อนของโครงการ</h3>
                            <p className="text-xs text-white/80">Semantic Duplicate & Scope Detection</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 text-xs">
                    {/* Score Bar */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                        <div>
                            <span className="text-[11px] font-bold text-slate-500 block">ดัชนีความคล้ายคลึง (Similarity Score)</span>
                            <span className="text-2xl font-black text-slate-900">{similarity_score}%</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${riskInfo.badge}`}>
                            {riskInfo.label}
                        </span>
                    </div>

                    {/* Matched Project */}
                    {matched_project_title && (
                        <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-1">
                            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                                โครงการเดิมในระบบที่ตรวจพบว่าคล้ายคลึง:
                            </span>
                            <p className="text-xs font-bold text-purple-950">
                                📌 {matched_project_title}
                            </p>
                        </div>
                    )}

                    {/* AI Analysis */}
                    <div className="space-y-1.5">
                        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>🔍</span> ผลการวิเคราะห์เชิงความหมาย (Semantic Analysis)
                        </h4>
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed text-[11px]">
                            {analysis}
                        </div>
                    </div>

                    {/* Committee Recommendation */}
                    <div className="space-y-1.5">
                        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>💡</span> ข้อเสนอแนะสำหรับคณะกรรมการและผู้เสนอโครงการ
                        </h4>
                        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 leading-relaxed text-[11px]">
                            {recommendation}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                    >
                        ปรับแก้ข้อมูลโครงการ
                    </button>
                    {onConfirmProceed && (
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onConfirmProceed();
                            }}
                            className="rounded-xl bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 text-xs font-bold transition shadow-xs"
                        >
                            ยืนยันดำเนินการต่อ
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
