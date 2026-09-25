import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

export default function Dashboard({
    categories = [],
    stats = {},
    fiscalYears = [],
    departments = [],
    currentFiscalYear,
    canManageStrategies = false,
    filters = {}
}) {
    // Local filter state
    const [selectedFiscalYear, setSelectedFiscalYear] = useState(filters.fiscal_year || currentFiscalYear || 'all');
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department_id || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedCoverage, setSelectedCoverage] = useState(filters.coverage || 'all');
    const [activeCategoryTab, setActiveCategoryTab] = useState(filters.category_id || 'all');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const toArabic = (str) => {
        if (!str || typeof str !== 'string') return str;
        const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        return str.replace(/[๐-๙]/g, c => {
            const idx = thaiDigits.indexOf(c);
            return idx !== -1 ? String(idx) : c;
        });
    };

    // Chart display states
    const [showCharts, setShowCharts] = useState(true);
    const [chartMetric, setChartMetric] = useState('projects'); // 'projects' or 'budget'

    // Expanded accordion cards state: map of itemId -> boolean
    const [expandedItems, setExpandedItems] = useState(() => {
        // By default, expand items that have projects
        const initial = {};
        (categories || []).forEach(cat => {
            (cat.items || []).forEach(item => {
                if (item.projects_count > 0) {
                    initial[item.id] = true;
                }
            });
        });
        return initial;
    });

    const toggleItem = (itemId) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const expandAll = () => {
        const next = {};
        (categories || []).forEach(cat => {
            (cat.items || []).forEach(item => {
                next[item.id] = true;
            });
        });
        setExpandedItems(next);
    };

    const collapseAll = () => {
        setExpandedItems({});
    };

    // Apply filters via router visit
    const handleFilterChange = (newParams) => {
        const params = {
            fiscal_year: selectedFiscalYear,
            department_id: selectedDepartment,
            status: selectedStatus,
            coverage: selectedCoverage,
            search: searchTerm,
            category_id: activeCategoryTab,
            ...newParams,
        };

        // Remove empty or 'all' params
        const cleanParams = {};
        Object.keys(params).forEach(k => {
            if (params[k] && params[k] !== '') {
                cleanParams[k] = params[k];
            }
        });

        router.get(route('strategies.dashboard'), cleanParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleResetFilters = () => {
        setSelectedFiscalYear(currentFiscalYear || 'all');
        setSelectedDepartment('all');
        setSelectedStatus('all');
        setSelectedCoverage('all');
        setSearchTerm('');
        setActiveCategoryTab('all');

        router.get(route('strategies.dashboard'), {}, {
            preserveState: false,
            preserveScroll: true,
        });
    };

    // Filter categories shown based on active tab
    const displayedCategories = useMemo(() => {
        if (activeCategoryTab === 'all') {
            return categories;
        }
        return categories.filter(c => String(c.id) === String(activeCategoryTab));
    }, [categories, activeCategoryTab]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };

    // 1. Category Projects Doughnut Data
    const categoryProjectsChartData = useMemo(() => {
        const labels = categories.map(c => c.name);
        const data = categories.map(c => c.unique_projects_count);
        return {
            labels,
            datasets: [
                {
                    label: 'จำนวนโครงการ',
                    data,
                    backgroundColor: [
                        '#7c3aed',
                        '#0284c7',
                        '#059669',
                        '#d97706',
                        '#e11d48',
                        '#4f46e5',
                        '#0891b2',
                        '#ca8a04',
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                }
            ]
        };
    }, [categories]);

    // 2. Category Budget Doughnut Data
    const categoryBudgetChartData = useMemo(() => {
        const labels = categories.map(c => c.name);
        const data = categories.map(c => c.total_budget);
        return {
            labels,
            datasets: [
                {
                    label: 'งบประมาณ (บาท)',
                    data,
                    backgroundColor: [
                        '#8b5cf6',
                        '#38bdf8',
                        '#34d399',
                        '#fbbf24',
                        '#f43f5e',
                        '#6366f1',
                        '#22d3ee',
                        '#facc15',
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                }
            ]
        };
    }, [categories]);

    // 3. Strategic Coverage Gauge Data (Covered vs Uncovered)
    const coverageChartData = useMemo(() => {
        return {
            labels: ['ขับเคลื่อนแล้ว', 'ยังไม่มีโครงการ'],
            datasets: [
                {
                    data: [stats.covered_items || 0, stats.uncovered_items || 0],
                    backgroundColor: ['#10b981', '#e2e8f0'],
                    hoverBackgroundColor: ['#059669', '#cbd5e1'],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                }
            ]
        };
    }, [stats]);

    // 4. Target Items for Bar Chart
    const targetBarItems = useMemo(() => {
        const items = [];
        displayedCategories.forEach(cat => {
            (cat.items || []).forEach(it => {
                items.push({
                    id: it.id,
                    name: it.name,
                    code: it.code || `ข้อ ${it.order_index || it.id}`,
                    categoryName: cat.name,
                    projects_count: it.projects_count || 0,
                    total_budget: it.total_budget || 0,
                });
            });
        });
        return items;
    }, [displayedCategories]);

    // 5. Items Comparison Bar Chart Data
    const itemsBarChartData = useMemo(() => {
        const labels = targetBarItems.map(it => {
            if (it.code && it.code.trim() !== '') {
                return it.code;
            }
            return it.name.length > 20 ? it.name.substring(0, 18) + '...' : it.name;
        });

        const data = targetBarItems.map(it => chartMetric === 'projects' ? it.projects_count : it.total_budget);
        const bgColors = targetBarItems.map(it => it.projects_count > 0 ? (chartMetric === 'projects' ? '#7c3aed' : '#0284c7') : '#e2e8f0');

        return {
            labels,
            datasets: [
                {
                    label: chartMetric === 'projects' ? 'จำนวนโครงการ (โครงการ)' : 'งบประมาณรวม (บาท)',
                    data,
                    backgroundColor: bgColors,
                    borderRadius: 6,
                    maxBarThickness: 45,
                }
            ]
        };
    }, [targetBarItems, chartMetric]);

    // Chart Options
    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 10,
                    font: { family: 'Kanit', size: 10 },
                    padding: 8,
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const val = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                        return ` ${context.label}: ${val} โครงการ (${pct}%)`;
                    }
                }
            }
        },
        cutout: '68%',
    };

    const budgetDoughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 10,
                    font: { family: 'Kanit', size: 10 },
                    padding: 8,
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const val = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                        return ` ${context.label}: ฿${formatCurrency(val)} (${pct}%)`;
                    }
                }
            }
        },
        cutout: '68%',
    };

    const coverageDoughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 10,
                    font: { family: 'Kanit', size: 10 },
                    padding: 8,
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const val = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                        return ` ${context.label}: ${val} ประเด็น (${pct}%)`;
                    }
                }
            }
        },
        cutout: '68%',
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    title: (context) => {
                        const idx = context[0].dataIndex;
                        const item = targetBarItems[idx];
                        return item ? `[${item.categoryName}] ${item.name}` : '';
                    },
                    label: (context) => {
                        const val = context.raw || 0;
                        if (chartMetric === 'budget') {
                            return ` วงเงินงบประมาณ: ฿${formatCurrency(val)} บาท`;
                        }
                        return ` จำนวนโครงการ: ${val} โครงการ`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (val) => chartMetric === 'budget' ? `฿${formatCurrency(val)}` : val,
                    font: { family: 'Kanit', size: 10 }
                },
                grid: { color: '#f1f5f9' }
            },
            x: {
                ticks: {
                    font: { family: 'Kanit', size: 10 },
                    maxRotation: 45,
                    minRotation: 0,
                },
                grid: { display: false }
            }
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
            case 'completed':
            case 'budget_approved':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        อนุมัติแล้ว / จัดสรรงบแล้ว
                    </span>
                );
            case 'submitted':
            case 'pending_approval':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                        รอการพิจารณาอนุมัติ
                    </span>
                );
            case 'preliminary':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                        ข้อเสนอเบื้องต้น (รอจัดสรร)
                    </span>
                );
            case 'draft':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                        ร่างโครงการ
                    </span>
                );
            case 'rejected':
            case 'budget_rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        ส่งกลับแก้ไข / ไม่อนุมัติ
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        {status}
                    </span>
                );
        }
    };

    // Category style accents
    const getCategoryAccent = (code, index) => {
        const accents = [
            { bg: 'from-purple-600 to-indigo-700', border: 'border-purple-300', lightBg: 'bg-purple-50', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-800' },
            { bg: 'from-sky-600 to-blue-700', border: 'border-sky-300', lightBg: 'bg-sky-50', text: 'text-sky-900', badge: 'bg-sky-100 text-sky-800' },
            { bg: 'from-emerald-600 to-teal-700', border: 'border-emerald-300', lightBg: 'bg-emerald-50', text: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-800' },
            { bg: 'from-amber-600 to-orange-700', border: 'border-amber-300', lightBg: 'bg-amber-50', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-800' },
            { bg: 'from-rose-600 to-pink-700', border: 'border-rose-300', lightBg: 'bg-rose-50', text: 'text-rose-900', badge: 'bg-rose-100 text-rose-800' },
        ];
        return accents[index % accents.length];
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-extrabold text-xs">
                                Strategic Alignment Dashboard
                            </span>
                            <span className="text-xs text-slate-400 font-medium">ปีงบประมาณ พ.ศ. {selectedFiscalYear === 'all' ? 'ทั้งหมด' : selectedFiscalYear}</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
                            <span>🎯</span> แดชบอร์ดยุทธศาสตร์ & การเชื่อมโยงโครงการ
                        </h2>
                        <p className="text-xs text-slate-600 mt-0.5">
                            วิเคราะห์ภาพรวมการขับเคลื่อนยุทธศาสตร์สถานศึกษา กรองและตรวจสอบโครงการที่ตอบสนองในแต่ละประเด็นยุทธศาสตร์
                        </p>
                    </div>

                    <div className="flex items-center gap-2 print:hidden">
                        {canManageStrategies && (
                            <Link
                                href={`${route('dashboard')}?tab=admin_strategies`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold shadow-2xs transition"
                            >
                                <span>⚙️</span> จัดการ/เพิ่ม-ลดหัวข้อยุทธศาสตร์
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition"
                        >
                            <span>🖨️</span> พิมพ์รายงานสรุป
                        </button>
                        <Link
                            href={route('projects.quick_create')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold shadow-md shadow-purple-900/20 transition transform active:scale-95"
                        >
                            <span>➕</span> เสนอโครงการใหม่
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="แดชบอร์ดยุทธศาสตร์และการเชื่อมโยงโครงการ" />

            <div className="space-y-6 pb-12 font-kanit">

                {/* 1. TOP STATS OVERVIEW CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                    {/* Card 1: Total Categories */}
                    <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl shrink-0">
                            🏛️
                        </div>
                        <div>
                            <span className="block text-xs font-medium text-slate-500">หมวดยุทธศาสตร์</span>
                            <span className="text-xl md:text-2xl font-black text-slate-900">
                                {stats.total_categories || 0} <span className="text-xs font-normal text-slate-500">หมวด</span>
                            </span>
                            <span className="block text-[11px] text-purple-600 font-bold mt-0.5">ครอบคลุมทุกด้าน</span>
                        </div>
                    </div>

                    {/* Card 2: Total Items */}
                    <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-xs flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-2xl shrink-0">
                            📌
                        </div>
                        <div>
                            <span className="block text-xs font-medium text-slate-500">ประเด็นยุทธศาสตร์</span>
                            <span className="text-xl md:text-2xl font-black text-slate-900">
                                {stats.total_items || 0} <span className="text-xs font-normal text-slate-500">ประเด็น</span>
                            </span>
                            <span className="block text-[11px] text-sky-600 font-bold mt-0.5">ในระบบสถานศึกษา</span>
                        </div>
                    </div>

                    {/* Card 3: Covered Items Rate */}
                    <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl shrink-0">
                            🚀
                        </div>
                        <div className="w-full">
                            <span className="block text-xs font-medium text-slate-500">ขับเคลื่อนแล้ว</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl md:text-2xl font-black text-emerald-700">
                                    {stats.covered_items || 0}
                                </span>
                                <span className="text-xs text-slate-500 font-normal">/ {stats.total_items || 0} ประเด็น</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${stats.coverage_rate || 0}%` }}
                                ></div>
                            </div>
                            <span className="block text-[10px] text-slate-500 mt-1">ครอบคลุม {stats.coverage_rate || 0}% ของยุทธศาสตร์</span>
                        </div>
                    </div>

                    {/* Card 4: Linked Projects */}
                    <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl shrink-0">
                            📋
                        </div>
                        <div>
                            <span className="block text-xs font-medium text-slate-500">โครงการที่เชื่อมโยง</span>
                            <span className="text-xl md:text-2xl font-black text-amber-800">
                                {stats.total_linked_projects || 0} <span className="text-xs font-normal text-slate-500">โครงการ</span>
                            </span>
                            <span className="block text-[11px] text-amber-700 font-bold mt-0.5">
                                จาก {stats.total_projects_filtered || 0} โครงการทั้งหมด
                            </span>
                        </div>
                    </div>

                    {/* Card 5: Total Budget for Strategies */}
                    <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center text-2xl shrink-0">
                            💰
                        </div>
                        <div>
                            <span className="block text-xs font-medium text-purple-200">งบประมาณขับเคลื่อน</span>
                            <span className="text-xl md:text-2xl font-black text-amber-300">
                                ฿{formatCurrency(stats.total_budget || 0)}
                            </span>
                            <span className="block text-[11px] text-purple-200 mt-0.5">รวมทุกโครงการที่เชื่อมโยง</span>
                        </div>
                    </div>
                </div>

                {/* 2. FILTERS & SEARCH TOOLBAR */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs print:hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-base">🔍</span>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                ตัวกรองและการค้นหาข้อมูลยุทธศาสตร์
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={expandAll}
                                className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition"
                            >
                                ⊞ ขยายดูทุกข้อ
                            </button>
                            <button
                                type="button"
                                onClick={collapseAll}
                                className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                            >
                                ⊟ ย่อทั้งหมด
                            </button>
                            {(selectedFiscalYear !== currentFiscalYear || selectedDepartment !== 'all' || selectedStatus !== 'all' || selectedCoverage !== 'all' || searchTerm !== '' || activeCategoryTab !== 'all') && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                                >
                                    <span>✕</span> ล้างตัวกรอง
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                        {/* 1. Fiscal Year Filter */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                📅 ปีงบประมาณ (พ.ศ.)
                            </label>
                            <select
                                value={selectedFiscalYear}
                                onChange={(e) => {
                                    setSelectedFiscalYear(e.target.value);
                                    handleFilterChange({ fiscal_year: e.target.value });
                                }}
                                className="w-full rounded-xl border-slate-300 text-xs py-2 px-3 focus:ring-purple-500 focus:border-purple-500 bg-slate-50 font-medium"
                            >
                                <option value="all">ทุกปีงบประมาณ</option>
                                {fiscalYears.map(year => (
                                    <option key={year} value={year}>
                                        ปีงบประมาณ {year} {String(year) === String(currentFiscalYear) ? '(ปีปัจจุบัน)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Department Filter */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                🏢 ฝ่าย / หน่วยงาน
                            </label>
                            <select
                                value={selectedDepartment}
                                onChange={(e) => {
                                    setSelectedDepartment(e.target.value);
                                    handleFilterChange({ department_id: e.target.value });
                                }}
                                className="w-full rounded-xl border-slate-300 text-xs py-2 px-3 focus:ring-purple-500 focus:border-purple-500 bg-slate-50 font-medium"
                            >
                                <option value="all">ทุกฝ่าย / หน่วยงาน</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 3. Status Filter */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                🚦 สถานะโครงการ
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    handleFilterChange({ status: e.target.value });
                                }}
                                className="w-full rounded-xl border-slate-300 text-xs py-2 px-3 focus:ring-purple-500 focus:border-purple-500 bg-slate-50 font-medium"
                            >
                                <option value="all">ทุกสถานะโครงการ</option>
                                <option value="approved">เฉพาะอนุมัติแล้ว / จัดสรรงบแล้ว</option>
                                <option value="pending">เฉพาะรอพิจารณาอนุมัติ</option>
                                <option value="preliminary">เฉพาะคำขอเบื้องต้น</option>
                                <option value="draft">เฉพาะแบบร่าง</option>
                            </select>
                        </div>

                        {/* 4. Coverage Filter */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                🎯 การมีโครงการขับเคลื่อน
                            </label>
                            <select
                                value={selectedCoverage}
                                onChange={(e) => {
                                    setSelectedCoverage(e.target.value);
                                    handleFilterChange({ coverage: e.target.value });
                                }}
                                className="w-full rounded-xl border-slate-300 text-xs py-2 px-3 focus:ring-purple-500 focus:border-purple-500 bg-slate-50 font-medium"
                            >
                                <option value="all">แสดงยุทธศาสตร์ทุกข้อ</option>
                                <option value="covered">เฉพาะข้อที่มีโครงการขับเคลื่อน</option>
                                <option value="uncovered">เฉพาะข้อที่ยังไม่มีโครงการ (Gap Analysis)</option>
                            </select>
                        </div>

                        {/* 5. Keyword Search Filter */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                🔎 ค้นหาชื่อโครงการ / ผู้รับผิดชอบ
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleFilterChange({ search: searchTerm });
                                        }
                                    }}
                                    placeholder="พิมพ์คำค้นหาแล้วกด Enter..."
                                    className="w-full rounded-xl border-slate-300 text-xs py-2 pl-3 pr-8 focus:ring-purple-500 focus:border-purple-500 bg-slate-50"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm('');
                                            handleFilterChange({ search: '' });
                                        }}
                                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2.5 VISUAL STRATEGIC ANALYTICS & CHARTS PANEL */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-xs print:break-inside-avoid">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📊</span>
                            <div>
                                <h3 className="text-sm font-black text-slate-900">
                                    แผนภูมิและการวิเคราะห์เชิงภาพ (Visual Strategic Analytics)
                                </h3>
                                <p className="text-[11px] text-slate-500">
                                    สัดส่วนและเปรียบเทียบการขับเคลื่อนตามหมวดหมู่และประเด็นยุทธศาสตร์
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 print:hidden">
                            {/* Metric Selector for Bar Chart */}
                            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setChartMetric('projects')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                        chartMetric === 'projects'
                                            ? 'bg-purple-700 text-white shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    📋 โครงการ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setChartMetric('budget')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                        chartMetric === 'budget'
                                            ? 'bg-purple-700 text-white shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    💰 งบประมาณ
                                </button>
                            </div>

                            {/* Toggle Show/Hide Charts */}
                            <button
                                type="button"
                                onClick={() => setShowCharts(!showCharts)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                            >
                                {showCharts ? '▲ ซ่อนกราฟ' : '▼ แสดงกราฟ'}
                            </button>
                        </div>
                    </div>

                    {showCharts && (
                        <div className="pt-4 space-y-5 animate-in fade-in duration-200">
                            {/* Top 3 Doughnut / Breakdown Charts */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Chart 1: Projects by Category */}
                                <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200 flex flex-col">
                                    <div className="text-center mb-2">
                                        <h4 className="text-xs font-bold text-slate-800">
                                            สัดส่วนโครงการตามหมวดยุทธศาสตร์
                                        </h4>
                                        <span className="text-[10px] text-slate-400">แยกตามจำนวนโครงการที่เชื่อมโยง</span>
                                    </div>
                                    <div className="h-56 relative flex items-center justify-center">
                                        <Doughnut data={categoryProjectsChartData} options={doughnutOptions} />
                                    </div>
                                </div>

                                {/* Chart 2: Budget by Category */}
                                <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200 flex flex-col">
                                    <div className="text-center mb-2">
                                        <h4 className="text-xs font-bold text-slate-800">
                                            สัดส่วนงบประมาณตามหมวดยุทธศาสตร์
                                        </h4>
                                        <span className="text-[10px] text-slate-400">แยกตามวงเงินจัดสรร/ประมาณการ</span>
                                    </div>
                                    <div className="h-56 relative flex items-center justify-center">
                                        <Doughnut data={categoryBudgetChartData} options={budgetDoughnutOptions} />
                                    </div>
                                </div>

                                {/* Chart 3: Coverage Rate */}
                                <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200 flex flex-col">
                                    <div className="text-center mb-2">
                                        <h4 className="text-xs font-bold text-slate-800">
                                            ความครอบคลุมการขับเคลื่อนยุทธศาสตร์
                                        </h4>
                                        <span className="text-[10px] text-slate-400">
                                            ขับเคลื่อนแล้ว {stats.coverage_rate || 0}% ({stats.covered_items || 0}/{stats.total_items || 0} ประเด็น)
                                        </span>
                                    </div>
                                    <div className="h-56 relative flex items-center justify-center">
                                        <Doughnut data={coverageChartData} options={coverageDoughnutOptions} />
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Bar Chart: Item-Level Breakdown */}
                            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900">
                                            เปรียบเทียบ{chartMetric === 'projects' ? 'จำนวนโครงการ' : 'งบประมาณ'}ในแต่ละประเด็นยุทธศาสตร์
                                        </h4>
                                        <span className="text-[11px] text-slate-500">
                                            {activeCategoryTab === 'all'
                                                ? 'แสดงทุกประเด็นยุทธศาสตร์ในระบบ (แท่งสีเทาคือประเด็นที่ยังไม่มีโครงการ)'
                                                : `แสดงเฉพาะประเด็นในหมวด: ${displayedCategories[0]?.name || ''}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-64 sm:h-72 w-full">
                                    <Bar data={itemsBarChartData} options={barOptions} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. MAIN CATEGORY TABS ("แยกเป็นหัวข้อหลัก") */}
                <div className="print:hidden">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveCategoryTab('all');
                                handleFilterChange({ category_id: 'all' });
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all shadow-2xs ${
                                activeCategoryTab === 'all'
                                    ? 'bg-purple-900 text-white shadow-md shadow-purple-950/20 scale-[1.02]'
                                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            <span>🌟</span>
                            <span>ภาพรวมทุกยุทธศาสตร์</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeCategoryTab === 'all' ? 'bg-purple-800 text-purple-200' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {categories.length} หมวด
                            </span>
                        </button>

                        {categories.map((cat) => {
                            const isActive = String(activeCategoryTab) === String(cat.id);
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveCategoryTab(cat.id);
                                        handleFilterChange({ category_id: cat.id });
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all shadow-2xs ${
                                        isActive
                                            ? 'bg-gradient-to-r from-purple-800 to-indigo-800 text-white shadow-md shadow-purple-950/20 scale-[1.02]'
                                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                >
                                    <span>🚩</span>
                                    <span>{toArabic(cat.name)}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-700'
                                    }`}>
                                        {cat.unique_projects_count} โครงการ
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 4. STRATEGY CATEGORIES & ITEMS DETAILS ("มีแดชบอร์ด แยกเป็นรายละเอียด และมีจำนวนโครงการที่เกี่ยวข้อง") */}
                {displayedCategories.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                        <span className="text-4xl block mb-2">🔍</span>
                        <h4 className="text-base font-bold text-slate-800">ไม่พบข้อมูลยุทธศาสตร์หรือโครงการตามเงื่อนไขที่เลือก</h4>
                        <p className="text-xs text-slate-500 mt-1">กรุณาลองปรับเปลี่ยนตัวกรอง หรือกดปุ่ม "ล้างตัวกรอง" เพื่อดูข้อมูลทั้งหมด</p>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="mt-4 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-xs"
                        >
                            ล้างตัวกรองทั้งหมด
                        </button>
                    </div>
                ) : (
                    displayedCategories.map((category, catIndex) => {
                        const accent = getCategoryAccent(category.code, catIndex);
                        const items = category.items || [];
                        const groupedItems = [];
                        const groupMap = new Map();
                        items.forEach(item => {
                            const gName = (item.group_name || '').trim();
                            if (!groupMap.has(gName)) {
                                const groupObj = { name: gName, items: [], totalProjects: 0, totalBudget: 0 };
                                groupMap.set(gName, groupObj);
                                groupedItems.push(groupObj);
                            }
                            const grp = groupMap.get(gName);
                            grp.items.push(item);
                            grp.totalProjects += (item.projects_count || 0);
                            grp.totalBudget += (item.total_budget || 0);
                        });

                        return (
                            <div
                                key={category.id}
                                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
                            >
                                {/* Category Banner / Header */}
                                <div className={`p-4 md:p-5 bg-gradient-to-r ${accent.bg} text-white flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[11px] font-black uppercase tracking-wider">
                                                หมวดยุทธศาสตร์ที่ {catIndex + 1}
                                            </span>
                                            {category.code && (
                                                <span className="text-xs text-purple-200 font-mono">
                                                    [{category.code.toUpperCase()}]
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg md:text-xl font-black mt-1 flex items-center gap-2">
                                            <span>🚩</span> {toArabic(category.name)}
                                        </h3>
                                        {category.description && (
                                            <p className="text-xs text-purple-100/90 mt-1 max-w-3xl leading-relaxed">
                                                {toArabic(category.description)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Category Metrics Pill */}
                                    <div className="flex items-center gap-2 md:gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 shrink-0">
                                        <div className="text-center px-2">
                                            <span className="block text-[10px] uppercase tracking-wider text-purple-200">ประเด็นขับเคลื่อน</span>
                                            <span className="text-base font-black text-white">
                                                {category.covered_items_count} <span className="text-xs font-normal text-purple-200">/ {category.total_items_count}</span>
                                            </span>
                                        </div>
                                        <div className="w-px h-8 bg-white/20"></div>
                                        <div className="text-center px-2">
                                            <span className="block text-[10px] uppercase tracking-wider text-purple-200">โครงการทั้งหมด</span>
                                            <span className="text-base font-black text-amber-300">
                                                {category.unique_projects_count} <span className="text-xs font-normal text-purple-200">โครงการ</span>
                                            </span>
                                        </div>
                                        <div className="w-px h-8 bg-white/20"></div>
                                        <div className="text-center px-2">
                                            <span className="block text-[10px] uppercase tracking-wider text-purple-200">งบประมาณรวม</span>
                                            <span className="text-base font-black text-white">
                                                ฿{formatCurrency(category.total_budget)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Container */}
                                <div className="p-4 md:p-6 space-y-4 bg-slate-50/50">
                                    {items.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                                            <p className="text-xs">ไม่พบรายการยุทธศาสตร์ย่อยในหมวดนี้ที่ตรงกับเงื่อนไขการกรอง</p>
                                        </div>
                                    ) : (
                                        groupedItems.map((group, gIdx) => (
                                            <div key={gIdx} className="space-y-3">
                                                {group.name ? (
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-gradient-to-r from-purple-100/90 via-purple-50/60 to-white p-3 rounded-xl border border-purple-200 shadow-2xs mt-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base">📁</span>
                                                            <span className="font-extrabold text-sm text-purple-950">{toArabic(group.name)}</span>
                                                            <span className="text-[10px] bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                                                                {group.items.length} รายการย่อย
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 text-xs font-bold">
                                                            <span className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                                                                ขับเคลื่อน {group.totalProjects} โครงการ
                                                            </span>
                                                            <span className="text-purple-950 bg-white px-2.5 py-0.5 rounded-md border border-purple-200 font-mono">
                                                                ฿{formatCurrency(group.totalBudget)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    groupedItems.length > 1 ? (
                                                        <div className="text-xs font-bold text-slate-500 px-1 pt-1 flex items-center gap-1.5">
                                                            <span>📋</span> รายการทั่วไป (ไม่มีหัวข้อหลัก):
                                                        </div>
                                                    ) : null
                                                )}

                                                <div className={`space-y-3 ${group.name ? 'pl-2 sm:pl-3 border-l-2 border-purple-200/60' : ''}`}>
                                                    {group.items.map((item, itemIdx) => {
                                            const isExpanded = !!expandedItems[item.id];
                                            const hasProjects = item.projects_count > 0;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`rounded-xl border transition-all ${
                                                        hasProjects
                                                            ? 'border-slate-200 bg-white shadow-2xs hover:shadow-xs'
                                                            : 'border-slate-200 bg-white/70 opacity-90'
                                                    }`}
                                                >
                                                    {/* Strategy Item Header */}
                                                    <div
                                                        onClick={() => toggleItem(item.id)}
                                                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/80 transition rounded-xl"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                                                                hasProjects
                                                                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                                                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                                                            }`}>
                                                                {itemIdx + 1}
                                                            </div>

                                                            <div>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    {item.group_name && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                                                            <span>📁</span> {toArabic(item.group_name)}
                                                                        </span>
                                                                    )}
                                                                    <h4 className="text-sm font-bold text-slate-900">
                                                                        {toArabic(item.name)}
                                                                    </h4>
                                                                    {item.code && (
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                                                                            {item.code}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {item.description && (
                                                                    <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
                                                                        {toArabic(item.description)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Metrics & Expand Trigger */}
                                                        <div className="flex items-center justify-between md:justify-end gap-3 pl-11 md:pl-0 shrink-0">
                                                            {/* Project count badge */}
                                                            <div className="flex items-center gap-2">
                                                                {hasProjects ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                        {item.projects_count} โครงการ
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                                                        ⚪ ยังไม่มีโครงการ
                                                                    </span>
                                                                )}

                                                                {/* Total budget badge */}
                                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-900 border border-purple-200">
                                                                    <span>฿</span> {formatCurrency(item.total_budget)}
                                                                </span>
                                                            </div>

                                                            {/* Toggle button */}
                                                            <button
                                                                type="button"
                                                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition"
                                                            >
                                                                {isExpanded ? '▲' : '▼'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Strategy Item Project List (Expandable: "มีรายละเอียดของโครงการที่เกี่ยวข้องในแต่ละข้อมาให้ด้วย") */}
                                                    {isExpanded && (
                                                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 animate-in fade-in duration-200">
                                                            {hasProjects ? (
                                                                <div className="mt-2 space-y-2">
                                                                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1 mb-2">
                                                                        <span>รายชื่อโครงการที่ขับเคลื่อนยุทธศาสตร์ข้อนี้ ({(item.projects || []).length} โครงการ)</span>
                                                                        <span className="text-[11px] text-slate-400 font-normal">คลิกชื่อโครงการเพื่อเปิดดูรายละเอียดฉบับเต็ม</span>
                                                                    </div>

                                                                    {/* Desktop Table View */}
                                                                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white hidden sm:block">
                                                                        <table className="w-full text-left text-xs">
                                                                            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                                                                <tr>
                                                                                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                                                                                    <th className="py-2.5 px-3">ชื่อโครงการ</th>
                                                                                    <th className="py-2.5 px-3">ฝ่าย / หน่วยงาน</th>
                                                                                    <th className="py-2.5 px-3">ผู้รับผิดชอบ</th>
                                                                                    <th className="py-2.5 px-3 text-right">วงเงินงบประมาณ</th>
                                                                                    <th className="py-2.5 px-3 text-center">สถานะ</th>
                                                                                    <th className="py-2.5 px-3 text-center w-24">การจัดการ</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-slate-100">
                                                                                {(item.projects || []).map((proj, pIdx) => (
                                                                                    <tr key={proj.id} className="hover:bg-purple-50/40 transition">
                                                                                        <td className="py-3 px-3 text-center text-slate-400 font-medium">
                                                                                            {pIdx + 1}
                                                                                        </td>
                                                                                        <td className="py-3 px-3">
                                                                                            <Link
                                                                                                href={route('projects.show', proj.id)}
                                                                                                className="font-bold text-slate-900 hover:text-purple-700 hover:underline flex items-baseline gap-1.5"
                                                                                            >
                                                                                                <span>{proj.title}</span>
                                                                                            </Link>
                                                                                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                                                                                <span>{proj.project_code}</span>
                                                                                                <span>•</span>
                                                                                                <span>ปี พ.ศ. {proj.academic_year}</span>
                                                                                                <span>•</span>
                                                                                                <span>{proj.funding_source}</span>
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="py-3 px-3 text-slate-700 font-medium">
                                                                                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                                                                                                {proj.department_name}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="py-3 px-3 text-slate-700">
                                                                                            <div className="font-medium">{proj.responsible_person}</div>
                                                                                            {proj.position && (
                                                                                                <div className="text-[10px] text-slate-400">{proj.position}</div>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="py-3 px-3 text-right font-black text-slate-900">
                                                                                            ฿{formatCurrency(proj.budget_amount)}
                                                                                        </td>
                                                                                        <td className="py-3 px-3 text-center">
                                                                                            {getStatusBadge(proj.status)}
                                                                                        </td>
                                                                                        <td className="py-3 px-3 text-center">
                                                                                            <Link
                                                                                                href={route('projects.show', proj.id)}
                                                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] transition shadow-2xs"
                                                                                            >
                                                                                                <span>เปิดดู</span>
                                                                                                <span>↗</span>
                                                                                            </Link>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>

                                                                    {/* Mobile Card List View */}
                                                                    <div className="space-y-2 sm:hidden">
                                                                        {(item.projects || []).map((proj) => (
                                                                            <div key={proj.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                                                                                <div className="flex items-start justify-between gap-2">
                                                                                    <Link
                                                                                        href={route('projects.show', proj.id)}
                                                                                        className="font-bold text-xs text-slate-900 hover:text-purple-700 hover:underline leading-snug"
                                                                                    >
                                                                                        {proj.title}
                                                                                    </Link>
                                                                                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                                                                        #{proj.id}
                                                                                    </span>
                                                                                </div>

                                                                                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                                                                        {proj.department_name}
                                                                                    </span>
                                                                                    <span className="font-bold text-purple-900">
                                                                                        ฿{formatCurrency(proj.budget_amount)}
                                                                                    </span>
                                                                                </div>

                                                                                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                                                                    <span className="text-[11px] text-slate-500">
                                                                                        {proj.responsible_person}
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        {getStatusBadge(proj.status)}
                                                                                        <Link
                                                                                            href={route('projects.show', proj.id)}
                                                                                            className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[11px]"
                                                                                        >
                                                                                            ดู ↗
                                                                                        </Link>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="mt-2 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-center space-y-2">
                                                                    <p className="text-xs text-amber-900 font-medium">
                                                                        ⚠️ ยังไม่มีโครงการในระบบที่เชื่อมโยงกับยุทธศาสตร์ข้อนี้ ในเงื่อนไขตัวกรองปัจจุบัน
                                                                    </p>
                                                                    <p className="text-[11px] text-amber-700">
                                                                        คุณสามารถเสนอโครงการใหม่ หรือแก้ไขโครงการที่มีอยู่เพื่อเชื่อมโยงกับยุทธศาสตร์นี้ได้
                                                                    </p>
                                                                    <div className="pt-1">
                                                                        <Link
                                                                            href={route('projects.quick_create')}
                                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-2xs"
                                                                        >
                                                                            <span>➕</span> เสนอโครงการเพื่อขับเคลื่อนยุทธศาสตร์นี้
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                                </div>
                            </div>
                        );
                    })
                )}

            </div>
        </AuthenticatedLayout>
    );
}
