import React, { useState } from 'react';
import { Link } from '@inertiajs/react';

export default function AuditTrailSection({ project }) {
    const [expandedDiffs, setExpandedDiffs] = useState({});
    const [copiedCode, setCopiedCode] = useState(false);

    const auditLogs = project.audit_logs || project.auditLogs || [];

    const toggleDiff = (id) => {
        setExpandedDiffs((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const copyVerificationCode = () => {
        if (!project.verification_code) return;
        navigator.clipboard.writeText(project.verification_code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const getActionBadge = (action, stepNumber) => {
        switch (action) {
            case 'CREATED':
                return { label: 'สร้างร่างโครงการ', color: 'bg-slate-100 text-slate-800 border-slate-300', icon: '📝' };
            case 'CREATED_PRELIMINARY':
                return { label: 'ยื่นคำขอตั้งงบเบื้องต้น', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: '💡' };
            case 'APPROVE_STEP':
                return { label: `อนุมัติขั้นตอนที่ ${stepNumber || ''}`, color: 'bg-blue-100 text-blue-900 border-blue-300 font-bold', icon: '✍️' };
            case 'REJECT_STEP':
                return { label: `ส่งกลับแก้ไข (ขั้นตอนที่ ${stepNumber || ''})`, color: 'bg-rose-100 text-rose-800 border-rose-300 font-bold', icon: '↩️' };
            case 'SEALED':
                return { label: 'ประทับตรารับรองดิจิทัล (Sealed)', color: 'bg-emerald-100 text-emerald-950 border-emerald-400 font-black', icon: '🛡️' };
            case 'STATUS_CHANGED':
                return { label: 'เปลี่ยนสถานะโครงการ', color: 'bg-purple-100 text-purple-900 border-purple-300 font-bold', icon: '🔄' };
            case 'MODIFIED_AFTER_APPROVAL':
                return { label: 'แก้ไขข้อมูลหลังผ่านการอนุมัติ', color: 'bg-amber-100 text-amber-900 border-amber-400 font-black', icon: '⚠️' };
            case 'UPDATED':
                return { label: 'แก้ไขข้อมูลโครงการ', color: 'bg-slate-100 text-slate-700 border-slate-300', icon: '✏️' };
            default:
                return { label: action, color: 'bg-slate-100 text-slate-800 border-slate-200', icon: '📌' };
        }
    };

    const formatDiffValue = (val) => {
        if (val === null || val === undefined) return '<ว่าง>';
        if (typeof val === 'object') {
            try {
                return JSON.stringify(val, null, 2);
            } catch (e) {
                return String(val);
            }
        }
        return String(val);
    };

    const hasPostApprovalModifications = auditLogs.some((l) => l.action === 'MODIFIED_AFTER_APPROVAL');

    return (
        <div className="space-y-6 font-sans">
            {/* 1. Digital Signature & Verification Certificate Card */}
            <div className={`rounded-3xl border p-6 sm:p-7 shadow-sm transition-all ${
                project.sealed_at 
                    ? 'border-emerald-300 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 shadow-emerald-600/5' 
                    : 'border-slate-200 bg-white'
            }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div className="flex items-start gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0 ${
                            project.sealed_at 
                                ? 'bg-emerald-600 text-white shadow-emerald-700/20' 
                                : 'bg-slate-100 text-slate-400'
                        }`}>
                            {project.sealed_at ? '🛡️' : '🔒'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-black text-slate-900">
                                    ใบรับรองและตรารับรองเอกสารดิจิทัล (Digital Signature & PDF Sealing)
                                </h3>
                                {project.sealed_at ? (
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-black">
                                        ✓ ประทับตราสมบูรณ์
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold">
                                        รออนุมัติครบ 6 ขั้นตอน
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                มาตรฐานการรับรองเอกสารอิเล็กทรอนิกส์ วิทยาลัยสารพัดช่างน่าน พร้อมตรวจสอบย้อนกลับได้ทุกขั้นตอน
                            </p>
                        </div>
                    </div>

                    {project.sealed_at && project.verification_code && (
                        <div className="flex items-center gap-2 shrink-0">
                            <a
                                href={`/verify/${project.verification_code}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition"
                            >
                                <span>🌐</span> ตรวจสอบสาธารณะ
                            </a>
                            <a
                                href={route('projects.print', project.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs shadow-2xs transition"
                            >
                                <span>🖨️</span> พิมพ์เอกสารรับรอง
                            </a>
                        </div>
                    )}
                </div>

                {project.sealed_at ? (
                    <div className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200 shadow-2xs space-y-2">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                รหัสตรวจสอบเอกสาร (Verification Code)
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-base font-black text-purple-950 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200">
                                    {project.verification_code}
                                </span>
                                <button
                                    type="button"
                                    onClick={copyVerificationCode}
                                    className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                                >
                                    {copiedCode ? '✓ คัดลอกแล้ว' : '📋 คัดลอกรหัส'}
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                บุคคลภายนอกสามารถตรวจสอบความถูกต้องของเอกสารนี้ได้ที่ <code>/verify/{project.verification_code}</code>
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 shadow-2xs space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                                <span>🔒 ค่าแฮชดิจิทัล (SHA-256 Seal)</span>
                                <span className="text-[10px] text-emerald-400 font-mono">SEALED AT {project.sealed_at}</span>
                            </div>
                            <p className="font-mono text-[11px] break-all text-emerald-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                                {project.digital_seal_hash || 'SHA256:VERIFIED'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="pt-4 text-xs text-slate-500 flex items-center gap-2">
                        <span>💡</span>
                        <span>ระบบจะสร้างรหัสตรวจสอบ (Verification Code) ค่าแฮชดิจิทัล SHA-256 และประทับตรารับรองเอกสารอัตโนมัติ เมื่อโครงการผ่านการพิจารณาอนุมัติครบขั้นตอนที่ 6 (ผู้อำนวยการฯ) เรียบร้อยแล้ว</span>
                    </div>
                )}
            </div>

            {/* 2. Audit Trail Warning Banner if modified after approval */}
            {hasPostApprovalModifications && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3 shadow-xs">
                    <span className="text-2xl shrink-0">⚠️</span>
                    <div className="space-y-0.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                            ตรวจพบการแก้ไขข้อมูลหลังจากที่โครงการได้รับการอนุมัติตามสายงาน
                        </h4>
                        <p className="text-xs text-amber-800 leading-relaxed">
                            ระบบบันทึกประวัติการเปลี่ยนแปลง (Revision History) พร้อมค่าข้อมูลเดิมและค่าข้อมูลใหม่ทุกจุด เพื่อความโปร่งใสและพร้อมรับการตรวจสอบจากหน่วยงานภายนอก (สตง. / ป.ป.ช. / สอศ.)
                        </p>
                    </div>
                </div>
            )}

            {/* 3. System Audit Log Timeline */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                        <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <span>📜</span> ประวัติการเปลี่ยนแปลงและการอนุมัติทั้งหมด (Data Audit Trail)
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                            บันทึกเหตุการณ์อัตโนมัติ {auditLogs.length} รายการ
                        </p>
                    </div>
                </div>

                {auditLogs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 space-y-2">
                        <div className="text-3xl">📭</div>
                        <p className="text-xs font-bold">ยังไม่มีบันทึกประวัติการเปลี่ยนแปลงในระบบ</p>
                    </div>
                ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                        {auditLogs.map((log) => {
                            const badge = getActionBadge(log.action, log.step_number);
                            const hasDiff = log.new_values && Object.keys(log.new_values).length > 0;
                            const isExpanded = !!expandedDiffs[log.id];

                            return (
                                <div key={log.id} className="relative group">
                                    {/* Timeline indicator node */}
                                    <div className="absolute -left-[27px] top-1 w-5 h-5 rounded-full bg-white border-2 border-purple-600 flex items-center justify-center text-[10px] shadow-xs">
                                        <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                                    </div>

                                    {/* Log card */}
                                    <div className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
                                        log.action === 'MODIFIED_AFTER_APPROVAL'
                                            ? 'border-amber-300 bg-amber-50/40'
                                            : log.action === 'SEALED'
                                            ? 'border-emerald-300 bg-emerald-50/30'
                                            : 'border-slate-100 bg-slate-50/70 hover:bg-slate-50'
                                    }`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] ${badge.color}`}>
                                                    <span>{badge.icon}</span>
                                                    <span>{badge.label}</span>
                                                </span>
                                                <span className="font-bold text-slate-900">
                                                    {log.user?.name || 'ระบบอัตโนมัติ'}
                                                </span>
                                                {log.user?.role && (
                                                    <span className="text-slate-500 text-[11px]">
                                                        ({log.user.role})
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
                                                <span>{log.created_at ? new Date(log.created_at).toLocaleString('th-TH') : ''}</span>
                                                {log.ip_address && (
                                                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                                                        IP: {log.ip_address}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {log.notes && (
                                            <p className="text-slate-700 italic">
                                                "{log.notes}"
                                            </p>
                                        )}

                                        {/* Diff Table Viewer (if fields were updated) */}
                                        {hasDiff && (
                                            <div className="pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleDiff(log.id)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900"
                                                >
                                                    <span>{isExpanded ? '▼ ซ่อนรายละเอียดการเปลี่ยนแปลง' : '▶ ดูรายละเอียดค่าที่เปลี่ยนแปลง (Diff View)'}</span>
                                                    <span className="text-[10px] text-slate-400">({Object.keys(log.new_values).length} ฟิลด์)</span>
                                                </button>

                                                {isExpanded && (
                                                    <div className="mt-2 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                                                        <table className="w-full text-left border-collapse text-[11px]">
                                                            <thead>
                                                                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                                                                    <th className="px-3 py-1.5 w-1/4">รายการข้อมูล</th>
                                                                    <th className="px-3 py-1.5 w-3/8 text-rose-800">ค่าเดิมก่อนแก้ไข</th>
                                                                    <th className="px-3 py-1.5 w-3/8 text-emerald-800">ค่าใหม่หลังแก้ไข</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {Object.keys(log.new_values).map((key) => (
                                                                    <tr key={key} className="hover:bg-slate-50/50">
                                                                        <td className="px-3 py-2 font-mono font-bold text-slate-700 align-top">
                                                                            {key}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-rose-700 bg-rose-50/30 font-mono break-all align-top">
                                                                            {formatDiffValue(log.old_values?.[key])}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-emerald-800 bg-emerald-50/30 font-mono break-all align-top font-bold">
                                                                            {formatDiffValue(log.new_values[key])}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
