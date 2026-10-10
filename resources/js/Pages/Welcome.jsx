import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome({ publicStats, recentProjects, publicCalendarEvents = [] }) {
    const { auth, asset_url } = usePage().props;

    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedDivision, setSelectedDivision] = useState('all');
    const [calendarViewMode, setCalendarViewMode] = useState('month'); // 'month' | 'agenda'
    const [calendarSearch, setCalendarSearch] = useState('');
    const [activeEventModal, setActiveEventModal] = useState(null);
    const [selectedDayEventsModal, setSelectedDayEventsModal] = useState(null);

    const eventsList = publicCalendarEvents || [];

    const currentCalYear = calendarDate.getFullYear();
    const currentCalMonth = calendarDate.getMonth();
    const firstDayWeekday = new Date(currentCalYear, currentCalMonth, 1).getDay();
    const totalDaysInMonth = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();
    const thaiMonthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    // Filter events by selected division and search query
    const filteredEventsList = eventsList.filter((ev) => {
        if (selectedDivision !== 'all' && ev.division_key !== selectedDivision) {
            return false;
        }
        if (calendarSearch) {
            const query = calendarSearch.toLowerCase();
            const matchTitle = (ev.title || '').toLowerCase().includes(query);
            const matchDept = (ev.department || '').toLowerCase().includes(query);
            const matchProposer = (ev.proposer || '').toLowerCase().includes(query);
            const matchLocation = (ev.location || '').toLowerCase().includes(query);
            if (!matchTitle && !matchDept && !matchProposer && !matchLocation) return false;
        }
        return true;
    });

    const getEventsForDay = (dayNum) => {
        const formattedDay = `${currentCalYear}-${String(currentCalMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        return filteredEventsList.filter((ev) => {
            if (ev.start_date && ev.end_date) {
                if (formattedDay >= ev.start_date && formattedDay <= ev.end_date) return true;
            } else if (ev.start_date) {
                if (formattedDay === ev.start_date) return true;
            }
            if (Array.isArray(ev.sub_activities)) {
                const hasSub = ev.sub_activities.some((sub) => sub.date === formattedDay);
                if (hasSub) return true;
            }
            return false;
        });
    };

    // Styling helpers for 4 divisions
    const getDivisionStyle = (divKey) => {
        switch (divKey) {
            case 'resources':
                return {
                    borderLeft: 'border-l-amber-500',
                    cardBg: 'bg-amber-50/95 hover:bg-amber-100/90 text-amber-950 border-amber-200/90',
                    badge: 'bg-amber-100 text-amber-900 border-amber-300',
                    dot: 'bg-amber-500',
                    tagBg: 'bg-amber-200/80 text-amber-950',
                    headerBg: 'from-amber-500 to-orange-600',
                };
            case 'strategy':
                return {
                    borderLeft: 'border-l-purple-600',
                    cardBg: 'bg-purple-50/95 hover:bg-purple-100/90 text-purple-950 border-purple-200/90',
                    badge: 'bg-purple-100 text-purple-900 border-purple-300',
                    dot: 'bg-purple-600',
                    tagBg: 'bg-purple-200/80 text-purple-950',
                    headerBg: 'from-purple-600 to-indigo-700',
                };
            case 'student':
                return {
                    borderLeft: 'border-l-emerald-600',
                    cardBg: 'bg-emerald-50/95 hover:bg-emerald-100/90 text-emerald-950 border-emerald-200/90',
                    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                    dot: 'bg-emerald-600',
                    tagBg: 'bg-emerald-200/80 text-emerald-950',
                    headerBg: 'from-emerald-600 to-teal-600',
                };
            case 'academic':
            default:
                return {
                    borderLeft: 'border-l-blue-600',
                    cardBg: 'bg-blue-50/95 hover:bg-blue-100/90 text-blue-950 border-blue-200/90',
                    badge: 'bg-blue-100 text-blue-900 border-blue-300',
                    dot: 'bg-blue-600',
                    tagBg: 'bg-blue-200/80 text-blue-950',
                    headerBg: 'from-blue-600 to-cyan-600',
                };
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50/80 via-violet-50/40 to-slate-50 text-slate-800 font-sans selection:bg-purple-600 selection:text-white">
            <Head title="หน้าหลัก - NPC SMART FLOW วิทยาลัยสารพัดช่างน่าน" />

            {/* Top Navigation Bar - OVEC White Clean Theme */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-purple-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-x-3.5">
                        <img
                            src={`${asset_url || '/'}LogoNPC_PNG.png?v=100`}
                            alt="ตราสัญลักษณ์ วิทยาลัยสารพัดช่างน่าน"
                            className="h-12 w-12 object-contain hover:scale-105 transition-transform"
                        />
                        <div>
                            <span className="text-lg font-black tracking-tight text-purple-950 block leading-none">NPC SMART FLOW</span>
                            <span className="text-[11px] font-bold text-purple-700 tracking-wider">วิทยาลัยสารพัดช่างน่าน (Nan Polytechnic College)</span>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-x-8 text-sm font-bold text-slate-700">
                        <a href="#about" className="hover:text-purple-600 transition-colors">เกี่ยวกับระบบ</a>
                        <a href="#pdca" className="hover:text-purple-600 transition-colors">กระบวนการ PDCA</a>
                        <a href="#calendar" className="hover:text-purple-600 transition-colors font-extrabold text-purple-700">ปฏิทินปฏิบัติงาน</a>
                        <a href="#stats" className="hover:text-purple-600 transition-colors">สถิติภาพรวม</a>
                        <a href="#projects" className="hover:text-purple-600 transition-colors">โครงการที่อนุมัติ</a>
                    </nav>

                    <div className="flex items-center gap-x-4">
                        {auth?.user ? (
                            <Link
                                href={route('dashboard')}
                                className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 transition-all hover:scale-[1.02]"
                            >
                                เข้าสู่ศูนย์ควบคุมระบบ ➔
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:bg-purple-700 transition-all hover:scale-[1.02]"
                            >
                                🔑 เข้าสู่ระบบ (Login)
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section - OVEC Light Gradient */}
            <section id="about" className="relative pt-16 pb-20 px-6 overflow-hidden">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-purple-200/50 blur-[140px] rounded-full pointer-events-none"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                        ระบบวางแผน งบประมาณ <br />
                        <span className="bg-gradient-to-r from-purple-700 via-indigo-600 to-red-600 bg-clip-text text-transparent">
                            และประเมินผลโครงการดิจิทัล
                        </span>
                    </h1>
                    
                    <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                        ระบบ NPC SMART FLOW ของวิทยาลัยสารพัดช่างน่าน ออกแบบขึ้นเพื่อเพิ่มประสิทธิภาพการบริหารจัดการงานโครงการตามหลักประกันคุณภาพการศึกษา ยกระดับวงจร PDCA ให้เป็นดิจิทัลครบวงจร โปร่งใส ตรวจสอบได้ และประมวลผลด้วยปัญญาประดิษฐ์ (AI)
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href={route('login')}
                            className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-purple-500/30 hover:scale-[1.02] transition-all"
                        >
                            เข้าสู่ระบบใช้งาน (Login)
                        </Link>
                        <a
                            href="#pdca"
                            className="w-full sm:w-auto rounded-2xl border border-purple-200 bg-white/90 px-8 py-4 text-base font-bold text-purple-800 shadow-sm hover:bg-purple-50 transition-all"
                        >
                            เรียนรู้ระบบ PDCA 4 ขั้นตอน ➔
                        </a>
                    </div>
                </div>
            </section>

            {/* Public Live Stats Banner */}
            <section id="stats" className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="rounded-2xl border border-purple-100 bg-white/80 p-6 shadow-md shadow-purple-500/5 backdrop-blur-sm">
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">โครงการเสนอขอทั้งหมด</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">{publicStats?.totalProjects || 0} <span className="text-sm font-normal text-slate-500">โครงการ</span></p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white/80 p-6 shadow-md shadow-purple-500/5 backdrop-blur-sm">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">ผ่านการอนุมัติแล้ว</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">{publicStats?.approvedProjects || 0} <span className="text-sm font-normal text-slate-500">โครงการ</span></p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white/80 p-6 shadow-md shadow-purple-500/5 backdrop-blur-sm">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">วงเงินงบประมาณขับเคลื่อน</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">
                            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(publicStats?.totalBudget || 0)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white/80 p-6 shadow-md shadow-purple-500/5 backdrop-blur-sm">
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">ดัชนีความพึงพอใจเฉลี่ย</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">
                            {publicStats?.satisfactionRate > 0 ? `${publicStats.satisfactionRate}%` : '0%'} 
                            <span className="text-sm font-normal text-slate-500 ml-2">
                                {publicStats?.satisfactionRate > 0 ? 'ระดับดีเยี่ยม' : '(รอผลการประเมิน)'}
                            </span>
                        </p>
                    </div>
                </div>
            </section>

            {/* PDCA 4-Phase Architecture */}
            <section id="pdca" className="max-w-7xl mx-auto px-6 py-16 border-t border-purple-100">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 mb-3">สถาปัตยกรรม 4-Phase PDCA</h2>
                    <p className="text-sm text-slate-600">ควบคุมคุณภาพตามมาตรฐานประกันคุณภาพการศึกษาอาชีวศึกษา</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* PLAN */}
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all space-y-3">
                        <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-black text-lg">
                            P
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">1. PLAN (วางแผน)</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            อาจารย์สร้างข้อเสนอโครงการ กำหนดวัตถุประสงค์ ตัวชี้วัด และเชื่อมโยงยุทธศาสตร์สถานศึกษา (IQA / OVEC) พร้อมระบบอนุมัติดิจิทัล 6 ขั้นตอน
                        </p>
                    </div>

                    {/* DO */}
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all space-y-3">
                        <div className="h-12 w-12 rounded-xl bg-violet-100 text-violet-700 border border-violet-200 flex items-center justify-center font-black text-lg">
                            D
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">2. DO (ดำเนินงาน)</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            งานวางแผนทำการผูกพันงบประมาณอัตโนมัติ งานพัสดุแต่งตั้งคณะกรรมการจัดซื้อจัดจ้างและออกเอกสารพัสดุ 4 ฉบับล่วงหน้า (บันทึก, ใบเสนอซื้อ, ราคากลาง, TOR)
                        </p>
                    </div>

                    {/* CHECK */}
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all space-y-3">
                        <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-lg">
                            C
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">3. CHECK (ตรวจสอบ)</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            สร้าง QR Code แบบประเมินความพึงพอใจสำหรับผู้เข้าร่วมโครงการอัตโนมัติ รวบรวมข้อเสนอแนะและคำนวณค่าเฉลี่ยสถิติแบบเรียลไทม์
                        </p>
                    </div>

                    {/* ACT */}
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all space-y-3">
                        <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center font-black text-lg">
                            A
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">4. ACT (ปรับปรุง)</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            AI Gemini วิเคราะห์ข้อเสนอแนะเพื่อสร้างแนวทางปรับปรุงในอนาคต รวมเล่มรายงานสรุป PDF Stitching แนบรูปกิจกรรมและภาคผนวกฉบับสมบูรณ์
                        </p>
                    </div>
                </div>
            </section>

            {/* Section: Public Operation Calendar (ปฏิทินการปฏิบัติงานรวมสถานศึกษา - ไม่ต้องเข้าสู่ระบบ) */}
            <section id="calendar" className="max-w-7xl mx-auto px-6 py-16 border-t border-purple-100">
                {/* 1. Top Section Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-900 text-xs font-black border border-purple-200 shadow-2xs">
                            <span>📅</span> Institutional Operation & Project Activity Calendar
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                            ปฏิทินการปฏิบัติงานโครงการ (4 ฝ่าย)
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-medium">
                            กำหนดการและไทม์ไลน์การดำเนินกิจกรรม/โครงการตามแผนปฏิบัติราชการประจำปีของวิทยาลัยสารพัดช่างน่าน แยกตาม 4 ฝ่ายหลัก
                        </p>
                    </div>

                    {/* View Switcher & Month Navigation */}
                    <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                        {/* Month Navigator Buttons */}
                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
                            <button
                                type="button"
                                onClick={() => {
                                    const newD = new Date(calendarDate);
                                    newD.setMonth(newD.getMonth() - 1);
                                    setCalendarDate(newD);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
                                title="เดือนก่อนหน้า"
                            >
                                ◀
                            </button>
                            <button
                                type="button"
                                onClick={() => setCalendarDate(new Date())}
                                className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-black transition cursor-pointer"
                                title="กลับมาเดือนปัจจุบัน"
                            >
                                วันนี้
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const newD = new Date(calendarDate);
                                    newD.setMonth(newD.getMonth() + 1);
                                    setCalendarDate(newD);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
                                title="เดือนถัดไป"
                            >
                                ▶
                            </button>
                        </div>

                        {/* View Switcher (Month Grid vs Agenda List) */}
                        <div className="flex items-center rounded-2xl bg-white p-1 border border-slate-200 shadow-2xs text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setCalendarViewMode('month')}
                                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                                    calendarViewMode === 'month'
                                        ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-xs font-black'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <span>📅</span> ปฏิทินรายเดือน
                            </button>
                            <button
                                type="button"
                                onClick={() => setCalendarViewMode('agenda')}
                                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                                    calendarViewMode === 'agenda'
                                        ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-xs font-black'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <span>📋</span> กำหนดการทั้งหมด
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Division Filter Pills & Live Search Bar */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Overview (All) */}
                        <button
                            type="button"
                            onClick={() => setSelectedDivision('all')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                selectedDivision === 'all'
                                    ? 'bg-slate-900 text-white shadow-md font-black ring-2 ring-slate-900/30'
                                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                            }`}
                        >
                            <span>🏛️</span> ภาพรวมทั้งวิทยาลัย (4 ฝ่าย)
                            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                                {eventsList.length}
                            </span>
                        </button>

                        {/* Resources */}
                        <button
                            type="button"
                            onClick={() => setSelectedDivision('resources')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                selectedDivision === 'resources'
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25 font-black ring-2 ring-amber-400/40'
                                    : 'bg-white text-slate-700 hover:bg-amber-50/60 border border-slate-200'
                            }`}
                        >
                            <span>🏢</span> ฝ่ายบริหารทรัพยากร
                            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${selectedDivision === 'resources' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'}`}>
                                {eventsList.filter(e => e.division_key === 'resources').length}
                            </span>
                        </button>

                        {/* Strategy & Planning */}
                        <button
                            type="button"
                            onClick={() => setSelectedDivision('strategy')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                selectedDivision === 'strategy'
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-md shadow-purple-500/25 font-black ring-2 ring-purple-400/40'
                                    : 'bg-white text-slate-700 hover:bg-purple-50/60 border border-slate-200'
                            }`}
                        >
                            <span>📊</span> ฝ่ายยุทธศาสตร์และแผนงาน
                            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${selectedDivision === 'strategy' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-900'}`}>
                                {eventsList.filter(e => e.division_key === 'strategy').length}
                            </span>
                        </button>

                        {/* Student Affairs */}
                        <button
                            type="button"
                            onClick={() => setSelectedDivision('student')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                selectedDivision === 'student'
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-500/25 font-black ring-2 ring-emerald-400/40'
                                    : 'bg-white text-slate-700 hover:bg-emerald-50/60 border border-slate-200'
                            }`}
                        >
                            <span>🎓</span> ฝ่ายพัฒนากิจการนักเรียนฯ
                            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${selectedDivision === 'student' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
                                {eventsList.filter(e => e.division_key === 'student').length}
                            </span>
                        </button>

                        {/* Academic Affairs */}
                        <button
                            type="button"
                            onClick={() => setSelectedDivision('academic')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                selectedDivision === 'academic'
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/25 font-black ring-2 ring-blue-400/40'
                                    : 'bg-white text-slate-700 hover:bg-blue-50/60 border border-slate-200'
                            }`}
                        >
                            <span>📘</span> ฝ่ายวิชาการ
                            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${selectedDivision === 'academic' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-900'}`}>
                                {eventsList.filter(e => e.division_key === 'academic').length}
                            </span>
                        </button>
                    </div>

                    {/* Live Search Input */}
                    <div className="relative w-full lg:w-64">
                        <input
                            type="text"
                            value={calendarSearch}
                            onChange={(e) => setCalendarSearch(e.target.value)}
                            placeholder="🔍 ค้นหาโครงการ / กิจกรรม..."
                            className="w-full px-3 py-2 pl-9 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-2xs transition"
                        />
                        <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                        {calendarSearch && (
                            <button
                                type="button"
                                onClick={() => setCalendarSearch('')}
                                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 text-xs font-bold"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. Division Color Legend Bar (คำอธิบายสีสันของ 4 ฝ่าย) */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 p-3 mb-6 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="font-extrabold text-slate-600 flex items-center gap-1.5">
                        <span>🎨</span> รหัสสีแยกฝ่ายงาน:
                    </span>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-bold">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 border-l-4 border-l-amber-500">
                            <span>🏢</span> ฝ่ายบริหารทรัพยากร
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-950 border-l-4 border-l-purple-600">
                            <span>📊</span> ฝ่ายยุทธศาสตร์และแผนงาน
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 border-l-4 border-l-emerald-600">
                            <span>🎓</span> ฝ่ายพัฒนากิจการนักเรียนฯ
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-950 border-l-4 border-l-blue-600">
                            <span>📘</span> ฝ่ายวิชาการ
                        </div>
                    </div>
                </div>

                {/* 4. Month View Mode */}
                {calendarViewMode === 'month' && (
                    <div className="bg-white rounded-3xl border border-purple-100 shadow-xl p-5 sm:p-7 space-y-4 overflow-hidden">
                        {/* Month Title Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-2">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-purple-500/20">
                                    🗓️
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                                        {thaiMonthNames[currentCalMonth]} พ.ศ. {currentCalYear + 543}
                                    </h3>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                        แสดงข้อมูลกำหนดการกิจกรรมที่ได้รับการอนุมัติแล้วของวิทยาลัย
                                    </span>
                                </div>
                            </div>
                            <span className="text-xs text-purple-700 bg-purple-50 px-3 py-1 rounded-full font-bold border border-purple-100">
                                💡 คลิกที่รายการเพื่อดูรายละเอียดโครงการฉบับเต็ม
                            </span>
                        </div>

                        {/* Month Grid Table */}
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-slate-50">
                            {/* Days of Week Header */}
                            <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-black divide-x divide-slate-200">
                                <div className="py-2.5 bg-rose-50/80 text-rose-700">อาทิตย์</div>
                                <div className="py-2.5 bg-slate-100/90 text-slate-700">จันทร์</div>
                                <div className="py-2.5 bg-slate-100/90 text-slate-700">อังคาร</div>
                                <div className="py-2.5 bg-slate-100/90 text-slate-700">พุธ</div>
                                <div className="py-2.5 bg-slate-100/90 text-slate-700">พฤหัสบดี</div>
                                <div className="py-2.5 bg-slate-100/90 text-slate-700">ศุกร์</div>
                                <div className="py-2.5 bg-indigo-50/80 text-indigo-700">เสาร์</div>
                            </div>

                            {/* Calendar Days Cells */}
                            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-white">
                                {/* Leading Empty Days */}
                                {Array.from({ length: firstDayWeekday }).map((_, idx) => (
                                    <div key={`empty-${idx}`} className="min-h-[130px] sm:min-h-[145px] p-2 bg-slate-50/60" />
                                ))}

                                {/* Actual Month Days */}
                                {Array.from({ length: totalDaysInMonth }).map((_, dayIdx) => {
                                    const dayNum = dayIdx + 1;
                                    const dayEvs = getEventsForDay(dayNum);
                                    const formattedDay = `${currentCalYear}-${String(currentCalMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                    const isToday = new Date().getFullYear() === currentCalYear &&
                                                    new Date().getMonth() === currentCalMonth &&
                                                    new Date().getDate() === dayNum;

                                    return (
                                        <div
                                            key={`day-${dayNum}`}
                                            className={`min-h-[130px] sm:min-h-[145px] p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-150 hover:bg-purple-50/30 ${
                                                isToday 
                                                    ? 'bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 ring-2 ring-inset ring-amber-400 shadow-xs' 
                                                    : 'bg-white'
                                            }`}
                                        >
                                            {/* Cell Header (Day Number + Events Count) */}
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-xs font-black rounded-full w-6 h-6 flex items-center justify-center transition ${
                                                    isToday 
                                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs scale-105' 
                                                        : 'text-slate-800 hover:bg-slate-100'
                                                }`}>
                                                    {dayNum}
                                                </span>
                                                {dayEvs.length > 0 && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-extrabold shadow-2xs">
                                                        {dayEvs.length}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Events Container (High-Readability 2-Line Display) */}
                                            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[100px] scrollbar-thin">
                                                {dayEvs.slice(0, 2).map((ev, eIdx) => {
                                                    const style = getDivisionStyle(ev.division_key);
                                                    return (
                                                        <div
                                                            key={`${ev.id}-${eIdx}`}
                                                            onClick={() => setActiveEventModal(ev)}
                                                            className={`p-1.5 rounded-lg text-[11px] font-bold border border-l-4 shadow-2xs cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all leading-snug ${style.cardBg} ${style.borderLeft}`}
                                                            title={`${ev.title} (${ev.division_name})`}
                                                        >
                                                            {/* Micro header: Division Icon & Short Badge */}
                                                            <div className="flex items-center gap-1 mb-0.5">
                                                                <span className="text-[10px] shrink-0">{ev.division_icon}</span>
                                                                <span className={`text-[9px] font-black uppercase tracking-wider px-1 py-0.2 rounded ${style.tagBg}`}>
                                                                    {ev.division_name?.replace('ฝ่าย', '')}
                                                                </span>
                                                            </div>
                                                            {/* Event Title with 2-line clamp for effortless reading */}
                                                            <div className="line-clamp-2 text-slate-900 font-extrabold text-[11px] leading-tight">
                                                                {ev.title}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* More than 2 events on this day */}
                                                {dayEvs.length > 2 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedDayEventsModal({ day: dayNum, dateStr: formattedDay, events: dayEvs })}
                                                        className="text-[10px] font-black text-purple-800 bg-purple-100 hover:bg-purple-200 py-1 px-1.5 rounded-md block w-full text-center transition cursor-pointer shadow-2xs hover:scale-101"
                                                    >
                                                        +{dayEvs.length - 2} เพิ่มเติม (ดูทั้งหมด)
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. Agenda View Mode (รายการกำหนดการแบบละเอียด อ่านง่าย 100%) */}
                {calendarViewMode === 'agenda' && (
                    <div className="bg-white rounded-3xl border border-purple-100 shadow-xl p-6 sm:p-8 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-2">
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                                    <span>📋</span> กำหนดการปฏิบัติงานโครงการ ({filteredEventsList.length} รายการ)
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    แสดงรายละเอียดและกำหนดการจัดกิจกรรมแบบเรียงตามลำดับ อ่านง่าย ครบถ้วนทุกตัวอักษร
                                </p>
                            </div>
                            <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
                                {thaiMonthNames[currentCalMonth]} พ.ศ. {currentCalYear + 543}
                            </span>
                        </div>

                        {filteredEventsList.length === 0 ? (
                            <div className="p-16 text-center text-slate-400 space-y-2">
                                <span className="text-5xl block mb-2">📭</span>
                                <p className="font-extrabold text-slate-700 text-sm">ไม่พบโครงการตามเงื่อนไขที่ค้นหา</p>
                                <p className="text-xs text-slate-500">กรุณาเลือกฝ่ายงานอื่น หรือล้างคำค้นหาเพื่อดูข้อมูลทั้งหมด</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 space-y-2">
                                {filteredEventsList.map((ev, idx) => {
                                    const style = getDivisionStyle(ev.division_key);
                                    const dateText = ev.start_date
                                        ? `${new Date(ev.start_date).toLocaleDateString('th-TH', { dateStyle: 'long' })}${ev.end_date && ev.end_date !== ev.start_date ? ' ถึง ' + new Date(ev.end_date).toLocaleDateString('th-TH', { dateStyle: 'long' }) : ''}`
                                        : (ev.period_text || 'ตามแผนปฏิบัติการประจำปี');

                                    return (
                                        <div
                                            key={`agenda-${ev.id}-${idx}`}
                                            onClick={() => setActiveEventModal(ev)}
                                            className={`pt-4 pb-4 px-4 rounded-2xl transition cursor-pointer hover:bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-transparent hover:border-slate-200 border-l-4 ${style.borderLeft}`}
                                        >
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${style.badge}`}>
                                                        <span>{ev.division_icon}</span> {ev.division_name}
                                                    </span>
                                                    <span className="text-xs text-indigo-700 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                                        <span>📅</span> {dateText}
                                                    </span>
                                                </div>
                                                <h4 className="text-base font-black text-slate-900 hover:text-purple-700 transition">
                                                    {ev.title}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                                                    <span>🏢 แผนก: <strong className="text-slate-800">{ev.department}</strong></span>
                                                    <span>📍 สถานที่: <strong className="text-slate-800">{ev.location}</strong></span>
                                                    <span>👤 ผู้รับผิดชอบ: <strong className="text-slate-800">{ev.proposer}</strong></span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-400 block font-bold">งบประมาณโครงการ</span>
                                                    <span className="font-black text-slate-900 text-sm font-mono">
                                                        ฿{new Intl.NumberFormat('th-TH').format(ev.budget)}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveEventModal(ev);
                                                    }}
                                                    className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition cursor-pointer"
                                                >
                                                    ดูรายละเอียด ➔
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Event Detail Modal (Public) */}
            {activeEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-purple-100 space-y-4 my-8 animate-in fade-in zoom-in duration-150">
                        {/* Modal Header Banner */}
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                            <div className="space-y-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${activeEventModal.division_badge}`}>
                                    <span>{activeEventModal.division_icon}</span> {activeEventModal.division_name}
                                </span>
                                <h4 className="text-base font-black text-slate-900 pt-1 leading-snug">
                                    {activeEventModal.title}
                                </h4>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveEventModal(null)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body Info Cards */}
                        <div className="space-y-2.5 text-xs text-slate-700">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 shadow-2xs">
                                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                                    <span className="text-slate-500 font-bold">🏢 แผนก/ฝ่าย:</span>
                                    <span className="font-extrabold text-slate-900 text-right">{activeEventModal.department}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                                    <span className="text-slate-500 font-bold">📅 กำหนดการดำเนินงาน:</span>
                                    <span className="font-extrabold text-indigo-700 text-right">
                                        {activeEventModal.start_date 
                                            ? `${new Date(activeEventModal.start_date).toLocaleDateString('th-TH', { dateStyle: 'long' })}${activeEventModal.end_date && activeEventModal.end_date !== activeEventModal.start_date ? ' ถึง ' + new Date(activeEventModal.end_date).toLocaleDateString('th-TH', { dateStyle: 'long' }) : ''}`
                                            : (activeEventModal.period_text || 'ตามแผนปฏิบัติราชการ')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                                    <span className="text-slate-500 font-bold">📍 สถานที่ดำเนินการ:</span>
                                    <span className="font-extrabold text-slate-900 text-right">{activeEventModal.location}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                                    <span className="text-slate-500 font-bold">👤 ผู้รับผิดชอบโครงการ:</span>
                                    <span className="font-extrabold text-slate-900 text-right">{activeEventModal.proposer}</span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-slate-500 font-bold">💰 วงเงินงบประมาณ:</span>
                                    <span className="font-black text-emerald-700 text-right font-mono text-sm">
                                        ฿{new Intl.NumberFormat('th-TH').format(activeEventModal.budget)}
                                    </span>
                                </div>
                            </div>

                            {/* Sub Activities if present */}
                            {Array.isArray(activeEventModal.sub_activities) && activeEventModal.sub_activities.length > 0 && (
                                <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
                                    <span className="font-black text-purple-950 text-xs flex items-center gap-1">
                                        <span>🎯</span> กิจกรรมย่อยในโครงการ ({activeEventModal.sub_activities.length} กิจกรรม):
                                    </span>
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                        {activeEventModal.sub_activities.map((sub, sIdx) => (
                                            <div key={`sub-${sIdx}`} className="bg-white p-2 rounded-xl border border-purple-100 flex justify-between items-center text-xs">
                                                <div>
                                                    <span className="font-bold text-slate-900 block">{sub.name}</span>
                                                    <span className="text-[10px] text-slate-500">📍 {sub.location || activeEventModal.location}</span>
                                                </div>
                                                <span className="text-purple-700 font-bold font-mono text-[11px] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                                                    {new Date(sub.date).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setActiveEventModal(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                            >
                                ปิดหน้าต่าง
                            </button>
                            <Link
                                href={route('login')}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition cursor-pointer"
                            >
                                เข้าสู่ระบบเพื่อดูโครงการเต็ม ➔
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Day All-Events Modal (When clicking +X เพิ่มเติม on a day) */}
            {selectedDayEventsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-purple-100 space-y-4 my-8 animate-in fade-in zoom-in duration-150">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    <span>🗓️</span> กิจกรรมประจำวันที่ {selectedDayEventsModal.day} {thaiMonthNames[currentCalMonth]} พ.ศ. {currentCalYear + 543}
                                </h4>
                                <span className="text-xs text-slate-500">
                                    พบทั้งหมด {selectedDayEventsModal.events.length} กิจกรรม/โครงการ
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedDayEventsModal(null)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Event List */}
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {selectedDayEventsModal.events.map((ev, idx) => {
                                const style = getDivisionStyle(ev.division_key);
                                return (
                                    <div
                                        key={`day-modal-ev-${idx}`}
                                        onClick={() => {
                                            setSelectedDayEventsModal(null);
                                            setActiveEventModal(ev);
                                        }}
                                        className={`p-3 rounded-2xl border border-l-4 shadow-2xs cursor-pointer hover:shadow-md transition-all ${style.cardBg} ${style.borderLeft}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.badge}`}>
                                                <span>{ev.division_icon}</span> {ev.division_name}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono">
                                                ฿{new Intl.NumberFormat('th-TH').format(ev.budget)}
                                            </span>
                                        </div>
                                        <h5 className="font-extrabold text-slate-900 text-xs mb-1">
                                            {ev.title}
                                        </h5>
                                        <p className="text-[11px] text-slate-600">
                                            🏢 {ev.department} • 📍 {ev.location}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-2 flex justify-end border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setSelectedDayEventsModal(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="border-t border-purple-100 py-10 text-center text-xs text-slate-600 bg-white/80">
                <div className="flex justify-center items-center gap-x-2 mb-2">
                    <img src={`${asset_url || '/'}LogoNPC_PNG.png?v=100`} alt="ตราสัญลักษณ์ วิทยาลัยสารพัดช่างน่าน" className="h-8 w-8 object-contain" />
                    <p className="font-bold text-purple-950">วิทยาลัยสารพัดช่างน่าน (Nan Polytechnic College)</p>
                </div>
                <p>© 2026 NPC SMART FLOW ERP System. All rights reserved.</p>
            </footer>
        </div>
    );
}
