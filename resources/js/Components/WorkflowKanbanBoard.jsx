import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';

export default function WorkflowKanbanBoard({ items = [], onOpenDocDetails }) {
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(val || 0);
    };

    // Calculate aging days from updated_at or created_at
    const getAging = (dateStr) => {
        if (!dateStr) return { days: 0, text: 'วันนี้', color: 'text-slate-500 bg-slate-100' };
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (days === 0) return { days: 0, text: 'วันนี้', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
        if (days <= 3) return { days, text: `${days} วันที่แล้ว`, color: 'text-blue-700 bg-blue-50 border-blue-200' };
        if (days <= 7) return { days, text: `${days} วัน (ปกติ)`, color: 'text-amber-800 bg-amber-50 border-amber-200' };
        return { days, text: `⚠️ ค้าง ${days} วัน`, color: 'text-rose-800 bg-rose-50 border-rose-300 font-bold animate-pulse' };
    };

    // Categorize items into 6 Kanban stages
    const columns = useMemo(() => {
        const cols = [
            {
                id: 'preliminary',
                title: 'คำขอตั้งงบเบื้องต้น',
                subtitle: 'รอแผนงานจัดสรรงบ',
                icon: '💡',
                headerBg: 'bg-amber-50 border-amber-300 text-amber-950',
                badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
                items: []
            },
            {
                id: 'draft',
                title: 'แบบร่างโครงการ',
                subtitle: 'อยู่ระหว่างจัดทำฉบับเต็ม',
                icon: '✏️',
                headerBg: 'bg-slate-50 border-slate-300 text-slate-800',
                badgeBg: 'bg-slate-200 text-slate-800 border-slate-300',
                items: []
            },
            {
                id: 'line_approval',
                title: 'เสนอตามสายงาน',
                subtitle: 'ขั้นตอน 1-3 (แผนก/แผนงาน)',
                icon: '⏳',
                headerBg: 'bg-blue-50 border-blue-300 text-blue-950',
                badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
                items: []
            },
            {
                id: 'exec_approval',
                title: 'พิจารณาระดับบริหาร',
                subtitle: 'ขั้นตอน 4-6 (รอง ผอ./ผอ.)',
                icon: '🏛️',
                headerBg: 'bg-indigo-50 border-indigo-300 text-indigo-950',
                badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
                items: []
            },
            {
                id: 'in_action',
                title: 'พัสดุ & ยืมเงิน (Do)',
                subtitle: 'กำลังจัดซื้อ/ยืมเงิน/จัดกิจกรรม',
                icon: '📦',
                headerBg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
                badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                items: []
            },
            {
                id: 'completed',
                title: 'เสร็จสิ้นสมบูรณ์',
                subtitle: 'ล้างหนี้/ปิดยอด & รายงาน 5 บท',
                icon: '✅',
                headerBg: 'bg-teal-50 border-teal-300 text-teal-950',
                badgeBg: 'bg-teal-100 text-teal-900 border-teal-300',
                items: []
            }
        ];

        items.forEach((item) => {
            const status = item.status;
            const step = parseInt(item.current_approval_step || 1, 10);

            if (status === 'preliminary') {
                cols[0].items.push(item);
            } else if (status === 'draft' || status === 'budget_approved') {
                cols[1].items.push(item);
            } else if (status === 'completed' || item.isAllFinCompleted) {
                cols[5].items.push(item);
            } else if (['approved', 'in_progress', 'evaluating'].includes(status)) {
                cols[4].items.push(item);
            } else if (step >= 4 && step <= 6) {
                cols[3].items.push(item);
            } else {
                cols[2].items.push(item);
            }
        });

        return cols;
    }, [items]);

    return (
        <div className="w-full font-sans">
            {/* Kanban Columns Horizontal Container */}
            <div className="flex gap-4 overflow-x-auto pb-6 pt-1 select-none min-h-[620px] scrollbar-thin scrollbar-thumb-purple-300">
                {columns.map((col) => {
                    const colTotalBudget = col.items.reduce((sum, it) => sum + (parseFloat(it.allocated_budget) || parseFloat(it.estimated_budget) || 0), 0);

                    return (
                        <div
                            key={col.id}
                            className="w-[320px] sm:w-[340px] shrink-0 flex flex-col rounded-3xl border border-slate-200 bg-slate-100/70 p-3 shadow-xs"
                        >
                            {/* Column Header */}
                            <div className={`p-3.5 rounded-2xl border ${col.headerBg} shadow-2xs mb-3 space-y-1.5`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{col.icon}</span>
                                        <h3 className="text-sm font-black tracking-tight">{col.title}</h3>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-black border ${col.badgeBg}`}>
                                        {col.items.length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] opacity-80 pt-0.5">
                                    <span>{col.subtitle}</span>
                                    <span className="font-bold font-mono">{formatCurrency(colTotalBudget)}</span>
                                </div>
                            </div>

                            {/* Column Cards Container */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                                {col.items.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 space-y-1">
                                        <div className="text-2xl opacity-60">📭</div>
                                        <p className="text-xs font-medium">ไม่มีเอกสารในขั้นตอนนี้</p>
                                    </div>
                                ) : (
                                    col.items.map((item) => {
                                        const aging = getAging(item.updated_at || item.created_at);
                                        const docNum = item.plan_loan_doc_number || item.plan_procurement_doc_number || item.unifiedDoc || null;
                                        const budget = parseFloat(item.allocated_budget) || parseFloat(item.estimated_budget) || 0;

                                        // Determine Current Holder
                                        let currentHolderText = 'ผู้เสนอโครงการ';
                                        let holderBg = 'bg-slate-100 text-slate-700 border-slate-200';

                                        if (col.id === 'preliminary') {
                                            currentHolderText = 'งานแผนงาน (พิจารณาคำขอ)';
                                            holderBg = 'bg-amber-100 text-amber-900 border-amber-300';
                                        } else if (col.id === 'draft') {
                                            currentHolderText = `${item.user?.name || item.responsible_person || 'ผู้เสนอโครงการ'} (กำลังร่าง)`;
                                            holderBg = 'bg-slate-100 text-slate-800 border-slate-300';
                                        } else if (col.id === 'line_approval') {
                                            const step = parseInt(item.current_approval_step || 1, 10);
                                            if (step === 1) currentHolderText = 'หัวหน้าแผนกวิชา / งาน (ลงนาม)';
                                            else if (step === 2) currentHolderText = 'หัวหน้างานที่เกี่ยวข้อง (ตรวจสอบ)';
                                            else currentHolderText = 'เจ้าหน้าที่งานแผนงาน (กลั่นกรอง)';
                                            holderBg = 'bg-blue-100 text-blue-900 border-blue-300';
                                        } else if (col.id === 'exec_approval') {
                                            const step = parseInt(item.current_approval_step || 4, 10);
                                            if (step === 4) currentHolderText = 'หัวหน้างานแผนงานและงบประมาณ';
                                            else if (step === 5) currentHolderText = 'รองผู้อำนวยการฯ (พิจารณา)';
                                            else currentHolderText = 'ผู้อำนวยการวิทยาลัยฯ (อนุมัติ)';
                                            holderBg = 'bg-purple-100 text-purple-900 border-purple-300';
                                        } else if (col.id === 'in_action') {
                                            if (item.loanLocation && item.loanLocation.includes('การเงิน')) {
                                                currentHolderText = 'งานการเงิน (รอโอนเงินยืม)';
                                                holderBg = 'bg-emerald-100 text-emerald-900 border-emerald-300';
                                            } else if (item.procLocation && item.procLocation.includes('พัสดุ')) {
                                                currentHolderText = 'งานพัสดุ (ดำเนินการจัดซื้อ)';
                                                holderBg = 'bg-teal-100 text-teal-900 border-teal-300';
                                            } else if (item.loanLocation && item.loanLocation.includes('ผู้ยืมเงิน')) {
                                                currentHolderText = `${item.user?.name || 'ผู้ยืมเงิน'} (กำลังจัดกิจกรรม)`;
                                                holderBg = 'bg-indigo-100 text-indigo-900 border-indigo-300';
                                            } else {
                                                currentHolderText = item.procHolder || item.loanHolder || 'งานพัสดุ / การเงิน';
                                                holderBg = 'bg-emerald-100 text-emerald-900 border-emerald-300';
                                            }
                                        } else {
                                            currentHolderText = 'ปิดยอดสมบูรณ์ (งานแผนงาน/การเงิน)';
                                            holderBg = 'bg-teal-100 text-teal-900 border-teal-300';
                                        }

                                        return (
                                            <div
                                                key={item.id}
                                                className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-purple-300 transition-all duration-200 flex flex-col justify-between gap-3 text-xs"
                                            >
                                                {/* Card Top: Doc Number & Aging */}
                                                <div className="flex items-center justify-between gap-2">
                                                    {docNum ? (
                                                        <span className="font-mono font-bold text-[11px] text-purple-950 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 truncate max-w-[170px]" title={docNum}>
                                                            {docNum}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            #{item.id}
                                                        </span>
                                                    )}

                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${aging.color}`}>
                                                        {aging.text}
                                                    </span>
                                                </div>

                                                {/* Card Title */}
                                                <div>
                                                    <Link
                                                        href={route('projects.show', item.id)}
                                                        className="font-black text-slate-900 hover:text-purple-700 text-xs sm:text-sm line-clamp-2 leading-snug transition-colors"
                                                        title={item.title}
                                                    >
                                                        {item.title}
                                                    </Link>
                                                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                                                        <span>👤 {item.user?.name || item.responsible_person || 'ผู้เสนอ'}</span>
                                                        {item.department?.name && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="truncate max-w-[130px]" title={item.department.name}>
                                                                    🏢 {item.department.name}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Current Document Location / Holder Highlight Box */}
                                                <div className={`p-2 rounded-xl border ${holderBg} text-[11px] font-bold flex items-center gap-1.5 shadow-2xs`}>
                                                    <span className="text-sm shrink-0">📍</span>
                                                    <div className="truncate">
                                                        <span className="text-[10px] font-medium block uppercase tracking-wide opacity-80">ตำแหน่งเอกสารปัจจุบัน:</span>
                                                        <span className="truncate block font-black">{currentHolderText}</span>
                                                    </div>
                                                </div>

                                                {/* Budget & Actions Bar */}
                                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 block">งบประมาณ</span>
                                                        <span className="font-mono font-black text-slate-900 text-xs">
                                                            {formatCurrency(budget)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        {item.hasLoanComponent && item.loanAmount > 0 && (
                                                            <a
                                                                href={route('procurements.download_document', [item.id, 'loan_contract'])}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] transition"
                                                                title="เปิดสัญญายืม กค. 101"
                                                            >
                                                                กค.101
                                                            </a>
                                                        )}

                                                        <Link
                                                            href={route('projects.show', item.id)}
                                                            className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] shadow-2xs transition"
                                                        >
                                                            ดูงาน ➔
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
