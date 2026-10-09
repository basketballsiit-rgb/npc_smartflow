import React, { useState, useMemo, useRef } from 'react';
import { Link, router } from '@inertiajs/react';

export default function WorkflowKanbanBoard({ items = [], onOpenDocDetails, onOpenPlanCut }) {
    // Navigation & View States
    const [activeStage, setActiveStage] = useState('all'); // 'all' or stage id
    const [viewLayout, setViewLayout] = useState('kanban'); // 'kanban' or 'grid'
    const [hideEmpty, setHideEmpty] = useState(false); // toggle hiding 0-item columns
    const scrollContainerRef = useRef(null);

    const getSecureUrl = (rawUrl) => {
        if (!rawUrl) return '#';
        let url = rawUrl;
        if (typeof window !== 'undefined') {
            if (window.location.protocol === 'https:' && url.startsWith('http://')) {
                url = url.replace('http://', 'https://');
            }
            try {
                const currentOrigin = window.location.origin;
                const parsed = new URL(url, currentOrigin);
                if (parsed.hostname === 'localhost' || parsed.hostname !== window.location.hostname) {
                    const prefix = window.location.pathname.startsWith('/npc_smartflow') ? '/npc_smartflow' : '';
                    const cleanPath = parsed.pathname.startsWith('/npc_smartflow') ? parsed.pathname : `${prefix}${parsed.pathname}`;
                    url = currentOrigin + cleanPath + parsed.search + parsed.hash;
                } else if (window.location.pathname.startsWith('/npc_smartflow') && !parsed.pathname.startsWith('/npc_smartflow')) {
                    url = currentOrigin + '/npc_smartflow' + parsed.pathname + parsed.search + parsed.hash;
                }
            } catch (e) {
                // fallback
            }
        }
        return url;
    };

    const getSecureProjectShowUrl = (id) => {
        if (!id) return '#';
        try {
            return getSecureUrl(route('projects.show', id));
        } catch (e) {
            return `/npc_smartflow/projects/${id}`;
        }
    };

    const navigateToProject = (e, id) => {
        e.preventDefault();
        const url = getSecureProjectShowUrl(id);
        try {
            router.visit(url);
        } catch (err) {
            window.location.href = url;
        }
    };

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
                stepNum: '1',
                title: 'คำขอตั้งงบเบื้องต้น',
                shortTitle: 'ตั้งงบเบื้องต้น',
                subtitle: 'รอแผนงานจัดสรรงบ',
                icon: '💡',
                headerBg: 'bg-amber-50 border-amber-300 text-amber-950',
                badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
                activeTabBg: 'bg-amber-500 text-white shadow-md shadow-amber-500/25',
                items: []
            },
            {
                id: 'draft',
                stepNum: '2',
                title: 'แบบร่างโครงการ',
                shortTitle: 'แบบร่าง',
                subtitle: 'อยู่ระหว่างจัดทำฉบับเต็ม',
                icon: '✏️',
                headerBg: 'bg-slate-50 border-slate-300 text-slate-800',
                badgeBg: 'bg-slate-200 text-slate-800 border-slate-300',
                activeTabBg: 'bg-slate-700 text-white shadow-md shadow-slate-700/25',
                items: []
            },
            {
                id: 'line_approval',
                stepNum: '3',
                title: 'เสนอตามสายงาน',
                shortTitle: 'เสนอสายงาน',
                subtitle: 'ขั้นตอน 1-3 (แผนก/แผนงาน)',
                icon: '⏳',
                headerBg: 'bg-blue-50 border-blue-300 text-blue-950',
                badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
                activeTabBg: 'bg-blue-600 text-white shadow-md shadow-blue-600/25',
                items: []
            },
            {
                id: 'exec_approval',
                stepNum: '4',
                title: 'พิจารณาระดับบริหาร',
                shortTitle: 'ระดับบริหาร',
                subtitle: 'ขั้นตอน 4-6 (รอง ผอ./ผอ.)',
                icon: '🏛️',
                headerBg: 'bg-indigo-50 border-indigo-300 text-indigo-950',
                badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
                activeTabBg: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25',
                items: []
            },
            {
                id: 'in_action',
                stepNum: '5',
                title: 'พัสดุ & ยืมเงิน (Do)',
                shortTitle: 'พัสดุ & ยืมเงิน',
                subtitle: 'กำลังจัดซื้อ/ยืมเงิน/จัดกิจกรรม',
                icon: '📦',
                headerBg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
                badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                activeTabBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25',
                items: []
            },
            {
                id: 'completed',
                stepNum: '6',
                title: 'เสร็จสิ้นสมบูรณ์',
                shortTitle: 'เสร็จสิ้น',
                subtitle: 'ล้างหนี้/ปิดยอด & รายงาน 5 บท',
                icon: '✅',
                headerBg: 'bg-teal-50 border-teal-300 text-teal-950',
                badgeBg: 'bg-teal-100 text-teal-900 border-teal-300',
                activeTabBg: 'bg-teal-600 text-white shadow-md shadow-teal-600/25',
                items: []
            }
        ];

        items.forEach((item) => {
            const status = item.status;
            const step = parseInt(item.current_approval_step || 1, 10);

            if (item.isTravelLoan) {
                if (item.isLoanCleared) {
                    cols[5].items.push(item);
                } else {
                    cols[4].items.push(item);
                }
                return;
            }

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

    const totalBudget = useMemo(() => {
        return items.reduce((sum, it) => sum + (parseFloat(it.allocated_budget) || parseFloat(it.estimated_budget) || 0), 0);
    }, [items]);

    const emptyColumnsCount = useMemo(() => {
        return columns.filter(c => c.items.length === 0).length;
    }, [columns]);

    // Smooth horizontal scroll helpers
    const scrollBoard = (direction) => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = 330;
        scrollContainerRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    // Filter displayed columns in Kanban mode based on hideEmpty
    const displayedKanbanColumns = useMemo(() => {
        if (!hideEmpty) return columns;
        return columns.filter(c => c.items.length > 0);
    }, [columns, hideEmpty]);

    // Active single column if activeStage !== 'all'
    const activeSingleColumn = useMemo(() => {
        if (activeStage === 'all') return null;
        return columns.find(c => c.id === activeStage) || null;
    }, [columns, activeStage]);

    // Render single project card
    const renderCard = (item, colId) => {
        const aging = getAging(item.updated_at || item.created_at);
        const docNum = item.plan_loan_doc_number || item.plan_procurement_doc_number || item.unifiedDoc || null;
        const budget = parseFloat(item.allocated_budget) || parseFloat(item.estimated_budget) || 0;

        // Determine Current Holder
        let currentHolderText = 'ผู้เสนอโครงการ';
        let holderBg = 'bg-slate-100 text-slate-700 border-slate-200';

        if (item.isTravelLoan) {
            if (!item.isLoanPlanCut) {
                currentHolderText = 'งานแผนงาน (รอตัดยอดสัญญายืมเงิน)';
                holderBg = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
            } else if (item.isLoanCleared) {
                currentHolderText = 'เคลียร์ปิดยอดแล้ว (กค.101)';
                holderBg = 'bg-teal-100 text-teal-900 border-teal-300 font-bold';
            } else if (item.isLoanFinReceived) {
                currentHolderText = `${item.user?.name || 'ผู้ยืมเงิน'} (รับเงินยืมแล้ว)`;
                holderBg = 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
            } else {
                currentHolderText = 'งานการเงิน (รอโอนเงินยืม กค.101)';
                holderBg = 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
            }
        } else if (colId === 'preliminary') {
            currentHolderText = 'งานแผนงาน (พิจารณาคำขอ)';
            holderBg = 'bg-amber-100 text-amber-900 border-amber-300';
        } else if (colId === 'draft') {
            currentHolderText = `${item.user?.name || item.responsible_person || 'ผู้เสนอโครงการ'} (กำลังร่าง)`;
            holderBg = 'bg-slate-100 text-slate-800 border-slate-300';
        } else if (colId === 'line_approval') {
            const step = parseInt(item.current_approval_step || 1, 10);
            if (step === 1) currentHolderText = 'หัวหน้าแผนกวิชา / งาน (ลงนาม)';
            else if (step === 2) currentHolderText = 'หัวหน้างานที่เกี่ยวข้อง (ตรวจสอบ)';
            else currentHolderText = 'เจ้าหน้าที่งานแผนงาน (กลั่นกรอง)';
            holderBg = 'bg-blue-100 text-blue-900 border-blue-300';
        } else if (colId === 'exec_approval') {
            const step = parseInt(item.current_approval_step || 4, 10);
            if (step === 4) currentHolderText = 'หัวหน้างานแผนงานและงบประมาณ';
            else if (step === 5) currentHolderText = 'รองผู้อำนวยการฯ (พิจารณา)';
            else currentHolderText = 'ผู้อำนวยการวิทยาลัยฯ (อนุมัติ)';
            holderBg = 'bg-purple-100 text-purple-900 border-purple-300';
        } else if (colId === 'in_action') {
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
                    {item.isTravelLoan ? (
                        <div>
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200 text-[9px] font-bold">
                                    ✈️ กค.101 ไปราชการ
                                </span>
                                {item.destination && (
                                    <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                        {item.destination}
                                    </span>
                                )}
                            </div>
                            <span
                                className="font-black text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug block"
                                title={item.title}
                            >
                                {item.title}
                            </span>
                        </div>
                    ) : (
                        <a
                            href={getSecureProjectShowUrl(item.id)}
                            onClick={(e) => navigateToProject(e, item.id)}
                            className="font-black text-slate-900 hover:text-purple-700 text-xs sm:text-sm line-clamp-2 leading-snug transition-colors cursor-pointer block"
                            title={item.title}
                        >
                            {item.title}
                        </a>
                    )}
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
                        {item.isTravelLoan ? (
                            <>
                                {!item.isLoanPlanCut && (
                                    <button
                                        type="button"
                                        onClick={() => onOpenPlanCut && onOpenPlanCut(item.rawLoan)}
                                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-[11px] shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                                        title="แผนงานตัดยอดสัญญายืมเงิน กค.101"
                                    >
                                        <span>✂️ ตัดยอดงบ ➔</span>
                                    </button>
                                )}
                                {item.isLoanPlanCut && (
                                    <button
                                        type="button"
                                        onClick={() => onOpenPlanCut && onOpenPlanCut(item.rawLoan)}
                                        className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-[10px] transition cursor-pointer"
                                        title="ดู/แก้ไขข้อมูลตัดยอด"
                                    >
                                        ดูตัดยอด
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                {item.hasLoanComponent && item.loanAmount > 0 && (
                                    <a
                                        href={getSecureUrl(route('procurements.download_document', [item.id, 'loan_contract']))}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] transition"
                                        title="เปิดสัญญายืม กค. 101"
                                    >
                                        กค.101
                                    </a>
                                )}

                                <a
                                    href={getSecureProjectShowUrl(item.id)}
                                    onClick={(e) => navigateToProject(e, item.id)}
                                    className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] shadow-2xs transition inline-block cursor-pointer"
                                >
                                    ดูงาน ➔
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full font-sans space-y-4">
            {/* 1. Quick Stage Navigation Bar (Workflow Pipeline Filter) */}
            <div className="bg-white rounded-2xl border border-purple-100 p-2.5 shadow-xs space-y-2.5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-purple-50 pb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🗂️</span>
                        <div>
                            <span className="text-xs font-black text-purple-950 block">
                                เลือกดูตามขั้นตอน หรือสลับมุมมองให้พอดีหน้าจอ
                            </span>
                            <span className="text-[11px] text-slate-500">
                                คลิกขั้นตอนเพื่อดูแบบเต็มจอโดยไม่ต้องเลื่อนขวา หรือเลือกมุมมองการ์ดรวม
                            </span>
                        </div>
                    </div>

                    {/* View Controls & Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Layout Toggle: Columns vs Grid */}
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                            <button
                                type="button"
                                onClick={() => { setViewLayout('kanban'); setActiveStage('all'); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                    viewLayout === 'kanban' && activeStage === 'all'
                                        ? 'bg-purple-700 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="มุมมองคอลัมน์แนวนอน (Kanban Columns)"
                            >
                                <span>📋</span>
                                <span>คอลัมน์ (Kanban)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setViewLayout('grid'); setActiveStage('all'); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                    viewLayout === 'grid' && activeStage === 'all'
                                        ? 'bg-purple-700 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="มุมมองการ์ดรวมพอดีหน้าจอ ไม่ต้องเลื่อนขวา"
                            >
                                <span>📱</span>
                                <span>การ์ดพอดีจอ (Fit Screen)</span>
                            </button>
                        </div>

                        {/* Hide Empty Columns Toggle (Only in Kanban Mode) */}
                        {viewLayout === 'kanban' && activeStage === 'all' && (
                            <button
                                type="button"
                                onClick={() => setHideEmpty(!hideEmpty)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                    hideEmpty
                                        ? 'bg-amber-100 text-amber-950 border-amber-300 font-black'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                                title="ซ่อนขั้นตอนที่ไม่มีรายการ เพื่อให้คอลัมน์ที่เหลือกะทัดรัดพอดีหน้าจอ"
                            >
                                <span>{hideEmpty ? '👁️' : '👁️‍🗨️'}</span>
                                <span>{hideEmpty ? 'แสดงคอลัมน์ว่างทั้งหมด' : `ซ่อนขั้นตอนว่าง (${emptyColumnsCount})`}</span>
                            </button>
                        )}

                        {/* Smooth Scroll Navigation (Only in Kanban Mode) */}
                        {viewLayout === 'kanban' && activeStage === 'all' && (
                            <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => scrollBoard('left')}
                                    className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold shadow-2xs transition cursor-pointer"
                                    title="เลื่อนไปทางซ้าย"
                                >
                                    ◀
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollBoard('right')}
                                    className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold shadow-2xs transition cursor-pointer"
                                    title="เลื่อนไปทางขวา"
                                >
                                    ▶
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Horizontal Quick Stage Tabs Strip */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {/* All Stages Tab */}
                    <button
                        type="button"
                        onClick={() => setActiveStage('all')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                            activeStage === 'all'
                                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/25 scale-[1.02]'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        <span>🌐</span>
                        <span>ทุกขั้นตอน</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            activeStage === 'all' ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                        }`}>
                            {items.length}
                        </span>
                    </button>

                    {/* Step by Step Stage Tabs */}
                    {columns.map((col) => {
                        const isActive = activeStage === col.id;
                        const hasItems = col.items.length > 0;

                        return (
                            <button
                                key={col.id}
                                type="button"
                                onClick={() => setActiveStage(col.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                                    isActive
                                        ? `${col.activeTabBg} font-black scale-[1.02]`
                                        : hasItems
                                        ? 'bg-white text-slate-800 border-slate-200 hover:border-purple-300 hover:bg-purple-50/40'
                                        : 'bg-slate-50/70 text-slate-400 border-slate-200/80 hover:bg-slate-100'
                                }`}
                            >
                                <span>{col.icon}</span>
                                <span>{col.stepNum}. {col.shortTitle}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                    isActive
                                        ? 'bg-white/20 text-white'
                                        : hasItems
                                        ? 'bg-purple-100 text-purple-900'
                                        : 'bg-slate-200 text-slate-500'
                                }`}>
                                    {col.items.length}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. MAIN CONTENT AREA */}

            {/* CASE A: Single Focused Stage View (When user clicks a specific stage tab) */}
            {activeSingleColumn ? (
                <div className="space-y-4">
                    {/* Stage Header Banner */}
                    <div className={`p-4 sm:p-5 rounded-3xl border ${activeSingleColumn.headerBg} shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{activeSingleColumn.icon}</span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base sm:text-lg font-black tracking-tight">
                                        ขั้นตอนที่ {activeSingleColumn.stepNum}: {activeSingleColumn.title}
                                    </h3>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${activeSingleColumn.badgeBg}`}>
                                        {activeSingleColumn.items.length} รายการ
                                    </span>
                                </div>
                                <p className="text-xs opacity-80 mt-0.5">
                                    {activeSingleColumn.subtitle} • งบประมาณรวมในขั้นตอนนี้: <span className="font-bold font-mono">{formatCurrency(activeSingleColumn.items.reduce((sum, it) => sum + (parseFloat(it.allocated_budget) || parseFloat(it.estimated_budget) || 0), 0))}</span>
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setActiveStage('all')}
                            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition cursor-pointer"
                        >
                            <span>←</span>
                            <span>กลับไปดูทุกขั้นตอน</span>
                        </button>
                    </div>

                    {/* Responsive Grid of Cards (Fit Screen - No Horizontal Scroll!) */}
                    {activeSingleColumn.items.length === 0 ? (
                        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400 space-y-2">
                            <div className="text-4xl">📭</div>
                            <h4 className="text-sm font-bold text-slate-700">ไม่มีโครงการในขั้นตอนนี้</h4>
                            <p className="text-xs text-slate-500">
                                ขณะนี้ยังไม่มีเอกสารหรือโครงการที่ค้างอยู่ในขั้นตอน {activeSingleColumn.title}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {activeSingleColumn.items.map((item) => renderCard(item, activeSingleColumn.id))}
                        </div>
                    )}
                </div>
            ) : viewLayout === 'grid' ? (
                /* CASE B: Responsive Grid View for All Stages (Fit Screen Stacked Sections) */
                <div className="space-y-6">
                    {columns.map((col) => {
                        const colTotalBudget = col.items.reduce((sum, it) => sum + (parseFloat(it.allocated_budget) || parseFloat(it.estimated_budget) || 0), 0);
                        if (hideEmpty && col.items.length === 0) return null;

                        return (
                            <div key={col.id} className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 shadow-xs space-y-3.5">
                                {/* Section Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-2xl">{col.icon}</span>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                                                <span>ขั้นตอนที่ {col.stepNum}: {col.title}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-black border ${col.badgeBg}`}>
                                                    {col.items.length} รายการ
                                                </span>
                                            </h3>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{col.subtitle}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                        <span className="text-xs text-slate-500">งบประมาณ:</span>
                                        <span className="font-mono font-black text-xs text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                                            {formatCurrency(colTotalBudget)}
                                        </span>
                                    </div>
                                </div>

                                {/* Section Cards Grid */}
                                {col.items.length === 0 ? (
                                    <div className="py-6 text-center text-slate-400 text-xs">
                                        ไม่มีเอกสารในขั้นตอนนี้
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                                        {col.items.map((item) => renderCard(item, col.id))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* CASE C: Classic Horizontal Kanban Board with Smart Navigation & Auto-Fit Width */
                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto pb-6 pt-1 select-none min-h-[620px] scrollbar-thin scrollbar-thumb-purple-300 scroll-smooth"
                >
                    {displayedKanbanColumns.map((col) => {
                        const colTotalBudget = col.items.reduce((sum, it) => sum + (parseFloat(it.allocated_budget) || parseFloat(it.estimated_budget) || 0), 0);

                        return (
                            <div
                                key={col.id}
                                className="w-[300px] sm:w-[320px] shrink-0 flex flex-col rounded-3xl border border-slate-200 bg-slate-100/70 p-3 shadow-xs"
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
                                        col.items.map((item) => renderCard(item, col.id))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
