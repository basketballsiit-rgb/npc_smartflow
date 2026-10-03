import React from 'react';
import { Link } from '@inertiajs/react';

export default function PendingTasksWidget({ allProjectsMaster = [], user, onOpenProject }) {
    const projects = Array.isArray(allProjectsMaster) ? allProjectsMaster : [];

    // Filter projects that need approval or review
    const pendingProjects = projects.filter(p => {
        return ['submitted', 'pending_approval', 'preliminary'].includes(p.status);
    }).slice(0, 4);

    if (pendingProjects.length === 0) {
        return (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <span className="text-xl">✅</span>
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                            ไม่มีงานค้างรอการอนุมัติ (All Tasks Cleared)
                        </h4>
                        <p className="text-[11px] text-emerald-700">
                            เอกสารและโครงการทั้งหมดได้รับการลงนามหรือส่งต่อเข้าสู่กระบวนการถัดไปเรียบร้อยแล้ว
                        </p>
                    </div>
                </div>
                <Link
                    href={route('dashboard', { tab: 'reviews' })}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs hover:bg-emerald-50 transition"
                >
                    ดูคิวงานทั้งหมด ➔
                </Link>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-white p-4 sm:p-5 shadow-xs mb-5 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                    <span className="text-lg animate-bounce">🔔</span>
                    <div>
                        <h4 className="text-sm font-black text-amber-950 flex items-center gap-2">
                            <span>งานที่รอการพิจารณา & ลงนามอนุมัติ (Actionable Queue)</span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-mono font-bold">
                                {pendingProjects.length} รายการเร่งด่วน
                            </span>
                        </h4>
                        <p className="text-[11px] text-amber-800">
                            โครงการและคำขอที่อยู่ในคิวลงนามอนุมัติตามสายงานหรือจัดสรรงบประมาณ
                        </p>
                    </div>
                </div>
                <Link
                    href={route('dashboard', { tab: 'reviews' })}
                    className="text-xs font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300 transition shrink-0"
                >
                    เปิดคิวลงนามอนุมัติทั้งหมด ({projects.filter(p => ['submitted', 'pending_approval', 'preliminary'].includes(p.status)).length}) ➔
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {pendingProjects.map((p) => (
                    <Link
                        key={p.id}
                        href={route('projects.show', p.id)}
                        className="rounded-xl border border-amber-200/90 bg-white p-3 space-y-1.5 hover:shadow-md hover:border-amber-400 transition-all group cursor-pointer"
                    >
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono font-bold text-amber-800 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">
                                {p.status === 'preliminary' ? '💡 ขอตั้งงบ' : `ขั้นตอนที่ ${p.current_approval_step || 2}`}
                            </span>
                            <span className="text-slate-400 font-mono">#{p.id}</span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 line-clamp-2 leading-snug">
                            {p.title}
                        </h5>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                            <span className="truncate max-w-[100px]">👤 {p.user?.name || p.proposer_name || 'ผู้เสนอ'}</span>
                            <span className="font-bold text-purple-900 font-mono">
                                ฿{new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(parseFloat(p.allocated_budget || p.estimated_budget || 0))}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
