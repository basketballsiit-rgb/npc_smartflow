import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const url = usePage().url || '';
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showingMobileMenu, setShowingMobileMenu] = useState(false);

    const userRoleName = user?.role?.name || (typeof user?.role === 'string' ? user.role : '');
    const isAdmin = user?.is_admin || userRoleName === 'admin';
    const isExecutive = user?.is_executive || userRoleName === 'executive' || isAdmin;
    const isPlanHead = user?.is_plan_head || userRoleName === 'plan_head' || isAdmin;
    const isProcurementHead = user?.is_procurement_head || userRoleName === 'procurement_head' || isAdmin;

    // Determine user role label for the top-right header display
    const getRoleLabel = () => {
        if (isAdmin) return 'ผู้ดูแลระบบ (Super Admin)';
        if (isExecutive) return 'ผู้บริหาร';
        if (isPlanHead) return 'หัวหน้างานแผนงาน';
        if (isProcurementHead) return 'หัวหน้างานพัสดุ';
        return 'ครูผู้เสนอโครงการ';
    };

    return (
        <div className="min-h-screen bg-slate-100/70 font-sans text-slate-800 flex flex-col">
            
            {/* 1. TOP NAVIGATION BAR WITH RICH LIGHTING, SHADOW, AND GLASSMORPHISM DIMENSION */}
            <nav className="bg-gradient-to-r from-white via-purple-50/60 to-white border-b border-purple-200/60 shadow-[0_4px_20px_-4px_rgba(126,34,206,0.15)] sticky top-0 z-50 backdrop-blur-md">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        
                        {/* Topbar Left: Hamburger + Logo + School Badge */}
                        <div className="flex items-center gap-x-3 sm:gap-x-4">
                            {/* Desktop Sidebar Toggle Button */}
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="hidden sm:inline-flex items-center justify-center p-2 rounded-xl text-purple-900 hover:bg-purple-100/60 transition-all focus:outline-none shadow-2xs border border-purple-100"
                                title="สลับการแสดงผลเมนูซ้าย"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>

                            {/* Mobile Sidebar Toggle Button */}
                            <button
                                onClick={() => setShowingMobileMenu(!showingMobileMenu)}
                                className="sm:hidden inline-flex items-center justify-center p-2 rounded-xl text-purple-900 hover:bg-purple-100/60 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>

                            {/* App Logo & Title */}
                            <Link href={route('dashboard')} className="flex items-center gap-x-2.5">
                                <img
                                    src="LogoNPC_PNG.png"
                                    alt="NPC Logo"
                                    className="h-10 w-auto drop-shadow-sm"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/build/assets/ApplicationLogo.png'; }}
                                />
                                <div className="flex flex-col">
                                    <span className="font-semibold text-purple-950 text-base leading-tight tracking-tight">
                                        NPC SMART FLOW
                                    </span>
                                    <span className="text-[10px] text-purple-600 font-normal uppercase tracking-wider">
                                        ระบบเสนออนุมัติโครงการ
                                    </span>
                                </div>
                            </Link>

                            {/* School Tag Badge (Normal Weight Font) */}
                            <div className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white text-xs font-normal px-3 py-1.5 rounded-xl shadow-xs border border-purple-700/50 ml-2">
                                <span>🏫</span>
                                <span>สถานศึกษา</span>
                            </div>
                        </div>

                        {/* Topbar Right: User Profile Info Block (Normal Font Weight) */}
                        <div className="flex items-center gap-x-3">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="flex items-center gap-x-3 p-1.5 px-3 rounded-2xl bg-white/80 border border-purple-100/80 shadow-2xs hover:bg-purple-50 hover:border-purple-200 transition-all focus:outline-none text-right"
                                    >
                                        {/* User Icon Circle with Soft Glow */}
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-100 to-violet-200 border border-purple-300 flex items-center justify-center text-purple-900 font-normal shadow-2xs text-base">
                                            👤
                                        </div>
                                        
                                        {/* Name & Role Text Lines in Normal/Medium Font */}
                                        <div className="hidden sm:flex flex-col text-right">
                                            <span className="text-sm font-medium text-purple-950 leading-tight">
                                                {user.department?.name ? `วิทยาลัยสารพัดช่างน่าน` : user.name}
                                            </span>
                                            <span className="text-xs text-purple-600 font-normal">
                                                {user.name} ({getRoleLabel()})
                                            </span>
                                        </div>

                                        <svg className="h-4 w-4 text-purple-700 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content align="right" width="48">
                                    <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                                        <p className="text-sm font-medium text-purple-950">{user.name}</p>
                                        <p className="text-xs text-slate-500 font-normal">{user.email}</p>
                                    </div>
                                    <Dropdown.Link href={route('profile.edit')} className="font-normal">
                                        ⚙️ ข้อมูลส่วนตัว (Profile)
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('projects.create')} className="font-normal">
                                        ➕ เสนอโครงการใหม่
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button" className="font-normal">
                                        🚪 ออกจากระบบ (Log Out)
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>

                    </div>
                </div>
            </nav>

            {/* MAIN CONTAINER: SIDEBAR + CONTENT AREA */}
            <div className="flex flex-1 relative">
                
                {/* 2. LEFT SIDEBAR (Sticky Fixed Position) */}
                <aside
                    className={`bg-gradient-to-b from-purple-950 via-purple-900 to-amber-700 text-white shadow-xl transition-all duration-300 z-40 flex flex-col justify-between sticky top-16 h-[calc(100vh-4rem)] shrink-0 ${
                        isSidebarOpen ? 'w-64' : 'w-0 sm:w-20 overflow-hidden'
                    } hidden sm:flex`}
                >
                    {/* Upper Navigation Menu List */}
                    <div className="p-3 space-y-2 font-sans overflow-y-auto max-h-[calc(100vh-8rem)]">
                        
                        {/* 0. MAIN DASHBOARD HOME ENTRY */}
                        <Link
                            href="/dashboard"
                            className={`flex items-center gap-x-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${
                                route().current('dashboard') && (!url.includes('tab=') || url.includes('tab=admin_users'))
                                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-purple-950 shadow-md font-bold'
                                    : 'text-white bg-white/10 hover:bg-white/20 font-medium'
                            }`}
                            title="ศูนย์ควบคุมหลัก"
                        >
                            <span className="text-base">📊</span>
                            {isSidebarOpen && <span>ศูนย์ควบคุมหลัก</span>}
                        </Link>
                        
                        {/* 1. ADMIN ROLE MENUS */}
                        {isAdmin && (
                            <div className="pt-2 space-y-1">
                                {isSidebarOpen ? (
                                    <div className="flex items-center gap-x-2 px-3 py-1.5 rounded-lg bg-black/30 text-amber-300 border-l-4 border-amber-400 text-xs font-bold uppercase tracking-wider shadow-2xs">
                                        <span>⚙️</span>
                                        <span>ผู้ดูแลระบบ (ADMIN)</span>
                                    </div>
                                ) : (
                                    <div className="h-px bg-white/20 my-1.5" />
                                )}

                                <div className="pl-2.5 border-l-2 border-amber-400/30 ml-2 space-y-1">
                                    <Link
                                        href={route('dashboard', { tab: 'admin_users' })}
                                        className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                            url.includes('tab=admin_users') || (!url.includes('tab=') && route().current('dashboard'))
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="จัดการผู้ใช้งานและสิทธิ์"
                                    >
                                        <span className="text-amber-300/80 font-mono text-[10px]">└─</span>
                                        <span className="text-sm">👤</span>
                                        {isSidebarOpen && <span>จัดการผู้ใช้ & สิทธิ์</span>}
                                    </Link>
                                    <Link
                                        href={route('dashboard', { tab: 'admin_strategies' })}
                                        className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                            url.includes('tab=admin_strategies')
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="จัดการยุทธศาสตร์ & IQA"
                                    >
                                        <span className="text-amber-300/80 font-mono text-[10px]">└─</span>
                                        <span className="text-sm">🎯</span>
                                        {isSidebarOpen && <span>จัดการยุทธศาสตร์</span>}
                                    </Link>
                                    <Link
                                        href={route('dashboard', { tab: 'admin_settings' })}
                                        className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                            url.includes('tab=admin_settings')
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="ตั้งค่าระบบ & ปีงบประมาณ/ปีการศึกษา"
                                    >
                                        <span className="text-amber-300/80 font-mono text-[10px]">└─</span>
                                        <span className="text-sm">🛠️</span>
                                        {isSidebarOpen && <span>ตั้งค่าระบบ & ปีงบประมาณ</span>}
                                    </Link>
                                    <Link
                                        href={route('dashboard', { tab: 'all_projects' })}
                                        className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                            url.includes('tab=all_projects')
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="ติดตามโครงการทั้งหมดในระบบ"
                                    >
                                        <span className="text-amber-300/80 font-mono text-[10px]">└─</span>
                                        <span className="text-sm">📁</span>
                                        {isSidebarOpen && <span>ติดตามโครงการทั้งหมด</span>}
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* 2. PROPOSAL / TEACHER MENUS */}
                        <div className="pt-2 space-y-1">
                            {isSidebarOpen ? (
                                <div className="flex items-center gap-x-2 px-3 py-1.5 rounded-lg bg-black/20 text-purple-100 border-l-4 border-purple-400 text-xs font-bold uppercase tracking-wider">
                                    <span>📝</span>
                                    <span>งานเสนอโครงการ</span>
                                </div>
                            ) : (
                                <div className="h-px bg-white/20 my-1.5" />
                            )}

                            <div className="pl-2.5 border-l-2 border-purple-400/30 ml-2 space-y-1">
                                <Link
                                    href={route('projects.create')}
                                    className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                        route().current('projects.create')
                                            ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                            : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                    }`}
                                    title="เสนอโครงการใหม่"
                                >
                                    <span className="text-purple-300/80 font-mono text-[10px]">└─</span>
                                    <span className="text-sm">➕</span>
                                    {isSidebarOpen && <span>เสนอโครงการใหม่</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'proposals' })}
                                    className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                        url.includes('tab=proposals')
                                            ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                            : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                    }`}
                                    title="เสนอโครงการของฉัน"
                                >
                                    <span className="text-purple-300/80 font-mono text-[10px]">└─</span>
                                    <span className="text-sm">📋</span>
                                    {isSidebarOpen && <span>โครงการของฉัน</span>}
                                </Link>
                            </div>
                        </div>

                        {/* 3. PLAN HEAD & BUDGET MENUS */}
                        {isPlanHead && (
                            <div className="pt-2 space-y-1">
                                {isSidebarOpen ? (
                                    <div className="flex items-center gap-x-2 px-3 py-1.5 rounded-lg bg-black/20 text-purple-100 border-l-4 border-amber-400 text-xs font-bold uppercase tracking-wider">
                                        <span>💰</span>
                                        <span>งานวางแผน & อนุมัติ</span>
                                    </div>
                                ) : (
                                    <div className="h-px bg-white/20 my-1.5" />
                                )}

                                <div className="pl-2.5 border-l-2 border-amber-400/30 ml-2 space-y-1">
                                    <Link
                                        href={route('dashboard', { tab: 'budgets' })}
                                        className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                            url.includes('tab=budgets')
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="งบประมาณสถานศึกษา"
                                    >
                                        <span className="text-amber-300/80 font-mono text-[10px]">└─</span>
                                        <span className="text-sm">💰</span>
                                        {isSidebarOpen && <span>งบประมาณสถานศึกษา</span>}
                                    </Link>
                                    <Link
                                        href={route('dashboard', { tab: 'reviews' })}
                                        className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                            url.includes('tab=reviews')
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="ตรวจสอบ & อนุมัติโครงการ"
                                    >
                                        <span className="text-amber-300/80 font-mono text-[10px]">└─</span>
                                        <span className="text-sm">🔍</span>
                                        {isSidebarOpen && <span>ตรวจสอบ & อนุมัติ</span>}
                                    </Link>
                                    <Link
                                        href={route('dashboard', { tab: 'clearings' })}
                                        className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                            url.includes('tab=clearings')
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="เคลียร์เงินยืมทดรอง"
                                    >
                                        <span className="text-amber-300/80 font-mono text-[10px]">└─</span>
                                        <span className="text-sm">🧾</span>
                                        {isSidebarOpen && <span>เคลียร์เงินยืมทดรอง</span>}
                                    </Link>
                                    <Link
                                        href={route('dashboard', { tab: 'all_projects' })}
                                        className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                            url.includes('tab=all_projects')
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="ติดตามโครงการทั้งหมดในระบบ"
                                    >
                                        <span className="text-amber-300/80 font-mono text-[10px]">└─</span>
                                        <span className="text-sm">📁</span>
                                        {isSidebarOpen && <span>ติดตามโครงการทั้งหมด</span>}
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* 4. PROCUREMENT MENUS */}
                        {isProcurementHead && (
                            <div className="pt-2 space-y-1">
                                {isSidebarOpen ? (
                                    <div className="flex items-center gap-x-2 px-3 py-1.5 rounded-lg bg-black/20 text-purple-100 border-l-4 border-purple-400 text-xs font-bold uppercase tracking-wider">
                                        <span>📦</span>
                                        <span>งานพัสดุ</span>
                                    </div>
                                ) : (
                                    <div className="h-px bg-white/20 my-1.5" />
                                )}

                                <div className="pl-2.5 border-l-2 border-purple-400/30 ml-2 space-y-1">
                                    <Link
                                        href={route('dashboard', { tab: 'procurement' })}
                                        className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                            url.includes('tab=procurement')
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="จัดซื้อจัดจ้าง & กรรมการ"
                                    >
                                        <span className="text-purple-300/80 font-mono text-[10px]">└─</span>
                                        <span className="text-sm">📦</span>
                                        {isSidebarOpen && <span>จัดซื้อจัดจ้าง & กรรมการ</span>}
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* 5. EXECUTIVE OVERVIEW MENUS */}
                        {isExecutive && (
                            <div className="pt-2 space-y-1">
                                {isSidebarOpen ? (
                                    <div className="flex items-center gap-x-2 px-3 py-1.5 rounded-lg bg-black/20 text-purple-100 border-l-4 border-purple-400 text-xs font-bold uppercase tracking-wider">
                                        <span>📈</span>
                                        <span>สถิติ & ผู้บริหาร</span>
                                    </div>
                                ) : (
                                    <div className="h-px bg-white/20 my-1.5" />
                                )}

                                <div className="pl-2.5 border-l-2 border-purple-400/30 ml-2 space-y-1">
                                    <Link
                                        href={route('dashboard', { tab: 'executive_overview' })}
                                        className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                            url.includes('tab=executive_overview')
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="ภาพรวม ๔ ฝ่ายหลัก"
                                    >
                                        <span className="text-purple-300/80 font-mono text-[10px]">└─</span>
                                        <span className="text-sm">📈</span>
                                        {isSidebarOpen && <span>ภาพรวม ๔ ฝ่ายหลัก</span>}
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* 6. SYSTEM PROFILE & LOGOUT */}
                        <div className="pt-3 border-t border-white/15 mt-3 space-y-1">
                            {isSidebarOpen && (
                                <div className="text-[11px] font-bold uppercase tracking-wider text-purple-200 px-3 opacity-80 mb-1">
                                    ⚙️ บัญชีผู้ใช้
                                </div>
                            )}
                            <Link
                                href={route('profile.edit')}
                                className={`flex items-center gap-x-3 px-3.5 py-2 rounded-xl transition-all text-xs font-normal ${
                                    route().current('profile.edit')
                                        ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                        : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                }`}
                                title="ผู้ใช้งานระบบ"
                            >
                                <span className="text-sm">👤</span>
                                {isSidebarOpen && <span>ข้อมูลส่วนตัว (Profile)</span>}
                            </Link>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="w-full flex items-center gap-x-3 px-3.5 py-2 rounded-xl text-purple-100 hover:bg-rose-500/40 hover:text-white transition-all text-xs font-normal"
                                title="ออกจากระบบ"
                            >
                                <span className="text-sm">🚪</span>
                                {isSidebarOpen && <span>ออกจากระบบ</span>}
                            </Link>
                        </div>
                    </div>

                    {/* Bottom Sidebar Footer */}
                    {isSidebarOpen && (
                        <div className="p-4 border-t border-white/15 bg-black/10">
                            <div className="flex items-center gap-x-2 text-xs font-normal text-white/90">
                                <span>🏫</span>
                                <span>วิทยาลัยสารพัดช่างน่าน</span>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Mobile Drawer Navigation */}
                {showingMobileMenu && (
                    <div className="sm:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex">
                        <div className="w-64 bg-gradient-to-b from-purple-950 via-purple-900 to-amber-700 text-white p-5 space-y-4 flex flex-col justify-between">
                            <div className="space-y-3 font-normal text-sm">
                                <div className="flex justify-between items-center border-b border-white/20 pb-3">
                                    <span className="font-medium text-sm">เมนูการใช้งาน</span>
                                    <button onClick={() => setShowingMobileMenu(false)} className="text-white text-lg">✕</button>
                                </div>
                                <Link href={route('dashboard')} className="flex items-center gap-2 p-2.5 rounded-xl font-medium bg-white/10">
                                    <span>📊</span> ศูนย์ควบคุมหลัก
                                </Link>
                                <Link href={route('projects.create')} className="flex items-center gap-2 p-2.5 rounded-xl font-normal hover:bg-white/10">
                                    <span>➕</span> เสนอโครงการใหม่
                                </Link>
                                <Link href={route('profile.edit')} className="flex items-center gap-2 p-2.5 rounded-xl font-normal hover:bg-white/10">
                                    <span>👤</span> ผู้ใช้งานระบบ
                                </Link>
                                <Link href={route('logout')} method="post" as="button" className="w-full flex items-center gap-2 p-2.5 rounded-xl font-normal text-rose-200">
                                    <span>🚪</span> ออกจากระบบ
                                </Link>
                            </div>
                            <div className="border-t border-white/20 pt-3 text-xs font-normal flex items-center gap-2">
                                <span>🏫</span> วิทยาลัยสารพัดช่างน่าน
                            </div>
                        </div>
                    </div>
                )}

                {/* MAIN CONTENT WRAPPER */}
                <div className="flex-1 flex flex-col min-w-0">
                    {header && (
                        <header className="bg-white/80 border-b border-purple-100 shadow-2xs backdrop-blur-xs">
                            <div className="mx-auto max-w-[100rem] px-4 py-4 sm:px-6 lg:px-8 overflow-x-auto whitespace-nowrap">
                                {header}
                            </div>
                        </header>
                    )}

                    <main className="flex-1 p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>

            </div>

        </div>
    );
}
