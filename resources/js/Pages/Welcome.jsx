import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome({ publicStats, recentProjects, publicCalendarEvents = [] }) {
    const { auth, asset_url } = usePage().props;

    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedDivision, setSelectedDivision] = useState('all');
    const [activeEventModal, setActiveEventModal] = useState(null);

    const eventsList = publicCalendarEvents || [];

    const currentCalYear = calendarDate.getFullYear();
    const currentCalMonth = calendarDate.getMonth();
    const firstDayWeekday = new Date(currentCalYear, currentCalMonth, 1).getDay();
    const totalDaysInMonth = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();
    const thaiMonthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const getEventsForDay = (dayNum) => {
        const formattedDay = `${currentCalYear}-${String(currentCalMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        return eventsList.filter((ev) => {
            if (selectedDivision !== 'all' && ev.division_key !== selectedDivision) {
                return false;
            }
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200">
                            <span>📅</span> Nan Polytechnic College Operation Calendar
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                            ปฏิทินการปฏิบัติงานโครงการ (4 ฝ่าย)
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                            กำหนดการและไทม์ไลน์การดำเนินกิจกรรม/โครงการตามแผนปฏิบัติราชการประจำปีของวิทยาลัยสารพัดช่างน่าน
                        </p>
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                            type="button"
                            onClick={() => {
                                const newD = new Date(calendarDate);
                                newD.setMonth(newD.getMonth() - 1);
                                setCalendarDate(newD);
                            }}
                            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition cursor-pointer"
                        >
                            ◀ เดือนก่อนหน้า
                        </button>
                        <button
                            type="button"
                            onClick={() => setCalendarDate(new Date())}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 transition cursor-pointer"
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
                            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition cursor-pointer"
                        >
                            เดือนถัดไป ▶
                        </button>
                    </div>
                </div>

                {/* Division Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <button
                        type="button"
                        onClick={() => setSelectedDivision('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedDivision === 'all'
                                ? 'bg-purple-900 text-white shadow-sm font-black'
                                : 'bg-white text-slate-700 hover:bg-purple-50 border border-slate-200'
                        }`}
                    >
                        <span>🏛️</span> ภาพรวมทั้งวิทยาลัย (4 ฝ่าย)
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                            {eventsList.length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedDivision('resources')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedDivision === 'resources'
                                ? 'bg-amber-600 text-white shadow-sm font-black'
                                : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
                        }`}
                    >
                        <span>🏢</span> ฝ่ายบริหารทรัพยากร
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedDivision('strategy')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedDivision === 'strategy'
                                ? 'bg-purple-700 text-white shadow-sm font-black'
                                : 'bg-white text-slate-700 hover:bg-purple-50 border border-slate-200'
                        }`}
                    >
                        <span>📊</span> ฝ่ายแผนงานและความร่วมมือ
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedDivision('student')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedDivision === 'student'
                                ? 'bg-emerald-600 text-white shadow-sm font-black'
                                : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
                        }`}
                    >
                        <span>🎓</span> ฝ่ายพัฒนากิจการนักเรียนฯ
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedDivision('academic')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedDivision === 'academic'
                                ? 'bg-blue-600 text-white shadow-sm font-black'
                                : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                        }`}
                    >
                        <span>📘</span> ฝ่ายวิชาการ
                    </button>
                </div>

                {/* Current Month Header Card */}
                <div className="bg-white rounded-3xl border border-purple-100 shadow-md p-6 space-y-4 overflow-hidden">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                            <span>🗓️</span> {thaiMonthNames[currentCalMonth]} พ.ศ. {currentCalYear + 543}
                        </h3>
                        <span className="text-xs text-slate-500 font-medium">
                            คลิกที่รายการกิจกรรมเพื่อดูข้อมูลและสถานที่จัดโครงการ
                        </span>
                    </div>

                    {/* Month Grid */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center text-xs font-bold text-slate-700 py-2.5">
                            <span className="text-rose-600">อาทิตย์</span>
                            <span>จันทร์</span>
                            <span>อังคาร</span>
                            <span>พุธ</span>
                            <span>พฤหัสบดี</span>
                            <span>ศุกร์</span>
                            <span className="text-indigo-600">เสาร์</span>
                        </div>
                        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
                            {Array.from({ length: firstDayWeekday }).map((_, idx) => (
                                <div key={`empty-${idx}`} className="min-h-[100px] p-2 bg-slate-50/50" />
                            ))}
                            {Array.from({ length: totalDaysInMonth }).map((_, dayIdx) => {
                                const dayNum = dayIdx + 1;
                                const dayEvs = getEventsForDay(dayNum);
                                const isToday = new Date().getFullYear() === currentCalYear &&
                                                new Date().getMonth() === currentCalMonth &&
                                                new Date().getDate() === dayNum;

                                return (
                                    <div
                                        key={`day-${dayNum}`}
                                        className={`min-h-[105px] p-2 flex flex-col justify-between transition hover:bg-purple-50/20 ${
                                            isToday ? 'bg-amber-50/70 ring-2 ring-inset ring-amber-400' : 'bg-white'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`text-xs font-black rounded-full w-5 h-5 flex items-center justify-center ${
                                                isToday ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-700'
                                            }`}>
                                                {dayNum}
                                            </span>
                                            {dayEvs.length > 0 && (
                                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-900 font-bold">
                                                    {dayEvs.length}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[75px]">
                                            {dayEvs.slice(0, 2).map((ev, eIdx) => (
                                                <div
                                                    key={`${ev.id}-${eIdx}`}
                                                    onClick={() => setActiveEventModal(ev)}
                                                    className={`p-1 rounded-md text-[10px] font-bold border truncate cursor-pointer hover:scale-102 transition ${ev.division_badge}`}
                                                    title={`${ev.title} (${ev.division_name})`}
                                                >
                                                    <span className="mr-0.5">{ev.division_icon}</span>
                                                    <span>{ev.title}</span>
                                                </div>
                                            ))}
                                            {dayEvs.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveEventModal(dayEvs[0])}
                                                    className="text-[9px] font-bold text-purple-700 block w-full text-center hover:underline"
                                                >
                                                    +{dayEvs.length - 2} เพิ่มเติม
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Event Detail Modal (Public) */}
            {activeEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-purple-100 space-y-4 my-8 animate-in fade-in zoom-in duration-150">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                            <div className="space-y-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${activeEventModal.division_badge}`}>
                                    {activeEventModal.division_name}
                                </span>
                                <h4 className="text-base font-black text-slate-900 pt-1 leading-snug">
                                    {activeEventModal.title}
                                </h4>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveEventModal(null)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-2 text-xs text-slate-700">
                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">🏢 แผนก/ฝ่าย:</span>
                                    <span className="font-bold text-slate-900">{activeEventModal.department}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">📅 กำหนดการดำเนินงาน:</span>
                                    <span className="font-bold text-indigo-700">
                                        {activeEventModal.start_date 
                                            ? `${new Date(activeEventModal.start_date).toLocaleDateString('th-TH', { dateStyle: 'long' })}${activeEventModal.end_date && activeEventModal.end_date !== activeEventModal.start_date ? ' ถึง ' + new Date(activeEventModal.end_date).toLocaleDateString('th-TH', { dateStyle: 'long' }) : ''}`
                                            : (activeEventModal.period_text || 'ตามแผนปฏิบัติราชการ')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">📍 สถานที่ดำเนินการ:</span>
                                    <span className="font-bold text-slate-900">{activeEventModal.location}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">👤 ผู้รับผิดชอบโครงการ:</span>
                                    <span className="font-bold text-slate-900">{activeEventModal.proposer}</span>
                                </div>
                            </div>
                        </div>

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
                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                            >
                                เข้าสู่ระบบเพื่อดูโครงการเต็ม ➔
                            </Link>
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
