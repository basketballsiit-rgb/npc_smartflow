import React from 'react';

export default function ConsistencyAuditModal({ isOpen, onClose, auditResult, isLoading }) {
    if (!isOpen) return null;

    const score = auditResult?.score ?? 0;
    const status = auditResult?.status || 'needs_improvement';
    const summary = auditResult?.summary || '';
    const checks = auditResult?.checks || [];
    const recommendations = auditResult?.recommendations || [];

    const getScoreBadge = () => {
        if (score >= 80) {
            return {
                bg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
                ring: 'ring-emerald-500 text-emerald-600',
                icon: '🌟',
                label: 'สอดคล้องดีเยี่ยม (Excellent Alignment)',
                chip: 'bg-emerald-100 text-emerald-800'
            };
        } else if (score >= 60) {
            return {
                bg: 'bg-amber-50 border-amber-300 text-amber-950',
                ring: 'ring-amber-500 text-amber-600',
                icon: '⚖️',
                label: 'สอดคล้องปานกลาง (Good Alignment)',
                chip: 'bg-amber-100 text-amber-800'
            };
        }
        return {
            bg: 'bg-rose-50 border-rose-300 text-rose-950',
            ring: 'ring-rose-500 text-rose-600',
            icon: '⚠️',
            label: 'ควรปรับปรุงแก้ไข (Needs Improvement)',
            chip: 'bg-rose-100 text-rose-800'
        };
    };

    const badge = getScoreBadge();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-purple-200 my-8 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-purple-100 pb-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-md shadow-purple-500/20">
                            ✨
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-purple-950 flex items-center gap-2">
                                AI Consistency Auditor (ตรวจสอบความสอดคล้องเชิงตรรกะ)
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                ตรวจสอบความเชื่อมโยง วัตถุประสงค์ ↔ ตัวชี้วัด ๔ มิติ ↔ แผนงาน ↔ หมวดงบประมาณ
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer transition"
                    >
                        ✕
                    </button>
                </div>

                {isLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-14 h-14 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                        <div>
                            <p className="font-bold text-sm text-purple-950">AI กำลังวิเคราะห์ความสอดคล้องของโครงการ...</p>
                            <p className="text-xs text-slate-500 mt-1">กำลังเทียบเคียงวัตถุประสงค์ ตัวชี้วัด กลุ่มเป้าหมาย ปฏิทินไตรมาส และหมวดเงิน</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Score Banner */}
                        <div className={`p-4 sm:p-5 rounded-2xl border-2 ${badge.bg} flex flex-col sm:flex-row items-center gap-4`}>
                            <div className="w-20 h-20 shrink-0 rounded-full border-4 border-white shadow-md bg-white flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-purple-950">{score}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">/ 100</span>
                            </div>
                            <div className="text-center sm:text-left space-y-1">
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <span className="text-base">{badge.icon}</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${badge.chip}`}>
                                        {badge.label}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-slate-700 leading-relaxed pt-1">
                                    {summary}
                                </p>
                            </div>
                        </div>

                        {/* 4 Dimension Checks */}
                        <div className="space-y-3">
                            <h4 className="font-extrabold text-xs text-purple-950 uppercase tracking-wider">
                                📋 ผลการตรวจสอบ 4 มิติหลัก (4-Dimension Checks)
                            </h4>
                            <div className="grid grid-cols-1 gap-2.5">
                                {checks.map((chk, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition ${
                                            chk.status === 'pass'
                                                ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                                                : chk.status === 'warning'
                                                ? 'bg-amber-50/40 border-amber-200 text-amber-950'
                                                : 'bg-rose-50/40 border-rose-200 text-rose-950'
                                        }`}
                                    >
                                        <span className="text-base shrink-0 mt-0.5">
                                            {chk.status === 'pass' ? '✅' : chk.status === 'warning' ? '⚠️' : '❌'}
                                        </span>
                                        <div className="space-y-0.5 flex-1">
                                            <div className="font-black flex items-center justify-between">
                                                <span>{chk.name}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                    chk.status === 'pass' ? 'bg-emerald-100 text-emerald-800' : chk.status === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {chk.status === 'pass' ? 'ผ่านเกณฑ์' : chk.status === 'warning' ? 'ข้อสังเกต' : 'ต้องแก้ไข'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-normal leading-relaxed opacity-90">
                                                {chk.detail}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recommendations */}
                        {recommendations.length > 0 && (
                            <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 space-y-2">
                                <h4 className="font-extrabold text-xs text-purple-950 flex items-center gap-1.5">
                                    <span>💡</span> ข้อเสนอแนะเชิงลึกเพื่อความสมบูรณ์ของเอกสาร (AI Recommendations):
                                </h4>
                                <ul className="space-y-1.5 pl-2 text-xs text-purple-900">
                                    {recommendations.map((rec, rIdx) => (
                                        <li key={rIdx} className="flex items-start gap-2">
                                            <span className="text-purple-600 font-bold shrink-0 mt-0.5">•</span>
                                            <span className="leading-relaxed">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm transition hover:scale-102 cursor-pointer"
                            >
                                เข้าใจแล้ว / ปิดหน้าต่างนี้
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
