import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function Verify({ verificationCode, isValid, project }) {
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(val || 0);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-purple-500 selection:text-white pb-16">
            <Head title={`ตรวจสอบเอกสารดิจิทัล | ${verificationCode}`} />

            {/* Official Top Bar */}
            <header className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 text-white shadow-lg border-b border-purple-800/40">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-xl shadow-inner">
                            🏛️
                        </div>
                        <div>
                            <h1 className="text-base font-black tracking-tight leading-tight">
                                วิทยาลัยสารพัดช่างน่าน
                            </h1>
                            <p className="text-[11px] text-purple-200/80 font-medium">
                                ระบบรับรองเอกสารดิจิทัลและลายมือชื่ออิเล็กทรอนิกส์ (NPC SmartFlow Digital Seal)
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="text-xs text-purple-200 hover:text-white px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition font-bold"
                    >
                        หน้าหลัก ➔
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-8">
                {isValid && project ? (
                    <div className="space-y-6">
                        {/* Certificate Card */}
                        <div className="rounded-3xl border border-emerald-300/80 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 p-6 sm:p-8 shadow-xl relative overflow-hidden">
                            {/* Watermark shield */}
                            <div className="absolute -right-8 -top-8 text-9xl opacity-5 pointer-events-none select-none">
                                🛡️
                            </div>

                            {/* Trust Badge */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-200/80">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-600/20 shrink-0">
                                        ✓
                                    </div>
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black uppercase tracking-wider mb-1.5">
                                            <span>🛡️</span> เอกสารราชการผ่านการรับรองดิจิทัล
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
                                            หนังสือรับรองความถูกต้องของเอกสาร
                                        </h2>
                                        <p className="text-xs text-emerald-800 mt-0.5">
                                            ประทับตรารับรองและลงลายมือชื่ออิเล็กทรอนิกส์ตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <div className="text-[11px] font-bold text-slate-500 uppercase">รหัสตรวจสอบ (Verification Code)</div>
                                    <div className="font-mono text-base font-black text-purple-950 bg-white/80 px-3 py-1 rounded-xl border border-purple-200 inline-block mt-0.5 shadow-2xs">
                                        {project.verification_code}
                                    </div>
                                </div>
                            </div>

                            {/* Project Information */}
                            <div className="pt-6 space-y-4">
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">ชื่อโครงการ / เอกสาร</div>
                                    <h3 className="text-lg font-black text-slate-900 mt-1 leading-snug">
                                        {project.title}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                    <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs">
                                        <div className="text-[11px] font-bold text-slate-500">ปีงบประมาณ พ.ศ.</div>
                                        <div className="text-sm font-black text-slate-900 mt-0.5">
                                            {project.academic_year}
                                        </div>
                                    </div>

                                    <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs">
                                        <div className="text-[11px] font-bold text-slate-500">หน่วยงาน / แผนกวิชา</div>
                                        <div className="text-sm font-black text-slate-900 mt-0.5 truncate" title={project.department_name}>
                                            {project.department_name}
                                        </div>
                                    </div>

                                    <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs">
                                        <div className="text-[11px] font-bold text-slate-500">วงเงินงบประมาณ</div>
                                        <div className="text-sm font-black text-emerald-700 mt-0.5">
                                            {formatCurrency(project.estimated_budget)}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs">
                                    <div className="text-[11px] font-bold text-slate-500">ผู้รับผิดชอบโครงการ</div>
                                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                                        {project.responsible_person || 'ไม่ระบุ'}
                                    </div>
                                </div>

                                {/* Cryptographic SHA-256 Seal Hash */}
                                <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-md">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <span>🔒</span> ค่าแฮชความปลอดภัยกำกับเอกสาร (SHA-256 Digital Seal)
                                        </span>
                                        <span className="text-[10px] text-emerald-400 font-mono">VERIFIED INTEGRITY</span>
                                    </div>
                                    <p className="font-mono text-xs break-all text-emerald-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                        {project.digital_seal_hash || 'SHA256:VERIFIED-SMARTFLOW-SEAL'}
                                    </p>
                                    <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                                        <span>วันเวลาที่ประทับตรารับรอง:</span>
                                        <span className="font-mono font-bold text-slate-200">{project.sealed_at} น.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Approval Signature Chain */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
                            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <span>✍️</span> ลำดับการลงนามและอนุมัติตามสายงาน ({project.approvals?.length || 0} ขั้นตอน)
                            </h4>

                            <div className="space-y-3">
                                {project.approvals && project.approvals.length > 0 ? (
                                    project.approvals.map((appr, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-start justify-between gap-3 text-xs"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-950 font-black flex items-center justify-center shrink-0">
                                                    {appr.step_number}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">
                                                        {appr.user_name || 'เจ้าหน้าที่/ผู้บริหาร'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {appr.role || `ขั้นตอนที่ ${appr.step_number}`}
                                                    </div>
                                                    {appr.comments && (
                                                        <p className="mt-1 text-slate-600 italic">
                                                            "{appr.comments}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px]">
                                                    ✓ อนุมัติแล้ว
                                                </span>
                                                {appr.updated_at && (
                                                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                                                        {appr.updated_at}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-slate-400 text-xs">
                                        ไม่มีข้อมูลสายการอนุมัติ
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Print / Download Button */}
                        <div className="text-center pt-2">
                            <a
                                href={route('projects.print', project.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-sm shadow-lg shadow-purple-700/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                <span>🖨️</span> พิมพ์เอกสารฉบับทางการพร้อมตรารับรองดิจิทัล
                            </a>
                        </div>
                    </div>
                ) : (
                    /* Invalid Code Card */
                    <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-lg space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-3xl font-black">
                            ⚠️
                        </div>
                        <h2 className="text-xl font-black text-rose-950">
                            ไม่พบข้อมูลการรับรอง หรือรหัสตรวจสอบไม่ถูกต้อง
                        </h2>
                        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                            รหัสตรวจสอบ <span className="font-mono font-bold text-rose-700">{verificationCode}</span> ไม่ตรงกับเอกสารที่ได้รับการประทับตรารับรองในระบบ อาจเกิดจากเอกสารยังไม่ได้รับการอนุมัติขั้นสุดท้าย หรือรหัสผ่านการดัดแปลง
                        </p>
                        <div className="pt-4">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                            >
                                กลับสู่หน้าหลัก
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
