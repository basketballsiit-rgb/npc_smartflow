import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const { auth, asset_url } = usePage().props;
    const user = auth.user;
    const url = usePage().url || '';
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showingMobileMenu, setShowingMobileMenu] = useState(false);

    const sidebarScrollRef = useRef(null);

    // Restore scroll position on mount and whenever url changes (deferred to bypass Inertia resets)
    useEffect(() => {
        const savedScroll = sessionStorage.getItem('sidebar-scroll');
        if (savedScroll && sidebarScrollRef.current) {
            const timer = setTimeout(() => {
                if (sidebarScrollRef.current) {
                    sidebarScrollRef.current.scrollTop = parseInt(savedScroll, 10);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [url]);

    const handleSidebarScroll = (e) => {
        sessionStorage.setItem('sidebar-scroll', e.target.scrollTop);
    };

    const [citizenIdInput, setCitizenIdInput] = useState('');
    const [citizenIdError, setCitizenIdError] = useState('');
    const [isSavingCitizenId, setIsSavingCitizenId] = useState(false);
    const [showCitizenModal, setShowCitizenModal] = useState(() => {
        if (user && !user.citizen_id && !user.has_citizen_id) {
            const dismissed = sessionStorage.getItem('dismiss_citizen_modal');
            return !dismissed;
        }
        return false;
    });

    const formatCitizenId = (val) => {
        const clean = val.replace(/[^0-9]/g, '').slice(0, 13);
        let formatted = '';
        if (clean.length > 0) formatted += clean.substring(0, 1);
        if (clean.length > 1) formatted += '-' + clean.substring(1, 5);
        if (clean.length > 5) formatted += '-' + clean.substring(5, 10);
        if (clean.length > 10) formatted += '-' + clean.substring(10, 12);
        if (clean.length > 12) formatted += '-' + clean.substring(12, 13);
        return formatted;
    };

    const handleCitizenIdChange = (e) => {
        const formatted = formatCitizenId(e.target.value);
        setCitizenIdInput(formatted);
        setCitizenIdError('');
    };

    const handleSaveCitizenId = (e) => {
        e.preventDefault();
        const clean = citizenIdInput.replace(/[^0-9]/g, '');
        if (clean.length !== 13) {
            setCitizenIdError('กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก');
            return;
        }

        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(clean.charAt(i), 10) * (13 - i);
        }
        const checkDigit = (11 - (sum % 11)) % 10;
        if (checkDigit !== parseInt(clean.charAt(12), 10)) {
            setCitizenIdError('เลขประจำตัวประชาชน 13 หลักไม่ถูกต้องตามรูปแบบ กรุณาตรวจสอบอีกครั้ง');
            return;
        }

        setIsSavingCitizenId(true);
        import('@inertiajs/react').then(({ router }) => {
            router.post(route('profile.update_citizen_id'), {
                citizen_id: clean,
            }, {
                onSuccess: () => {
                    setIsSavingCitizenId(false);
                    setShowCitizenModal(false);
                },
                onError: (errs) => {
                    setIsSavingCitizenId(false);
                    setCitizenIdError(errs.citizen_id || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
                }
            });
        });
    };

    const userRoleName = user?.role?.name || (typeof user?.role === 'string' ? user.role : '');
    const isAdmin = user?.is_admin || userRoleName === 'admin';
    const isExecutive = user?.is_executive || userRoleName === 'executive' || isAdmin;
    const isPlanHead = user?.is_plan_head || userRoleName === 'plan_head' || isAdmin;
    const isProcurementHead = Boolean(user?.is_procurement_head || userRoleName === 'procurement_head' || isAdmin || (user?.department && (user.department.name?.includes('พัสดุ') || user.department.code === 'PROC')) || user?.position?.includes('พัสดุ'));

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
                                    src={`${asset_url || '/'}LogoNPC_PNG.png`}
                                    alt="NPC Logo"
                                    className="h-10 w-auto drop-shadow-sm"
                                    onError={(e) => { e.target.onerror = null; e.target.src = `${asset_url || '/'}build/assets/ApplicationLogo.png`; }}
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
                    <div
                        ref={sidebarScrollRef}
                        onScroll={handleSidebarScroll}
                        scroll-region="true"
                        data-inertia-scroll-region="true"
                        className="p-3 space-y-2 font-sans overflow-y-auto max-h-[calc(100vh-8rem)]"
                    >
                        
                        {/* 0. MAIN DASHBOARD HOME ENTRY */}
                        <Link
                            href={route('dashboard')}
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
                                    href={route('projects.quick_create')}
                                    className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                        route().current('projects.quick_create')
                                            ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                            : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                    }`}
                                    title="เสนอโครงการเบื้องต้น (ขอตั้งงบ)"
                                >
                                    <span className="text-purple-300/80 font-mono text-[10px]">└─</span>
                                    <span className="text-sm">💡</span>
                                    {isSidebarOpen && <span>เสนอโครงการเบื้องต้น (ขอตั้งงบ)</span>}
                                </Link>
                                <Link
                                    href={route('projects.create')}
                                    className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                        route().current('projects.create')
                                            ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                            : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                    }`}
                                    title="จัดทำข้อเสนอโครงการฉบับเต็ม"
                                >
                                    <span className="text-purple-300/80 font-mono text-[10px]">└─</span>
                                    <span className="text-sm">➕</span>
                                    {isSidebarOpen && <span>จัดทำโครงการฉบับเต็ม</span>}
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

                                
                                <Link
                                    href={route('admin.routine_budgets.index')}
                                    className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                        url.includes('routine-budgets') && !isPlanHead
                                            ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                            : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                    }`}
                                    title="งบดำเนินงานประจำปี & จัดซื้อจัดจ้างตรง"
                                >
                                    <span className="text-purple-300/80 font-mono text-[10px]">└─</span>
                                    <span className="text-sm">🗓️</span>
                                    {isSidebarOpen && <span>งบประจำปี & จัดซื้อตรง</span>}
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
                                        href={route('admin.routine_budgets.index')}
                                        className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                            url.includes('routine-budgets')
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="แผนงบดำเนินงานประจำปี & แดชบอร์ด"
                                    >
                                        <span className="text-amber-300/80 font-mono text-[10px]">└─</span>
                                        <span className="text-sm">📅</span>
                                        {isSidebarOpen && <span>งบประจำปี & แดชบอร์ด</span>}
                                    </Link>
                                    <Link
                                        href={route('dashboard', { tab: 'action_plan_report' })}
                                        className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                            url.includes('tab=action_plan_report')
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="รายงานงบรายจ่ายแผนปฏิบัติราชการ"
                                    >
                                        <span className="text-amber-300/80 font-mono text-[10px]">└─</span>
                                        <span className="text-sm">📊</span>
                                        {isSidebarOpen && <span>รายงานแผนปฏิบัติราชการ</span>}
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
                                            url.includes('tab=procurement') && !url.includes('tool=item_catalog')
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="จัดซื้อจัดจ้าง & กรรมการ"
                                    >
                                        <span className="text-purple-300/80 font-mono text-[10px]">└─</span>
                                        <span className="text-sm">📋</span>
                                        {isSidebarOpen && <span>จัดซื้อจัดจ้าง & กรรมการ</span>}
                                    </Link>

                                    <Link
                                        href={route('dashboard', { tab: 'document_tracking' })}
                                        className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                            url.includes('tab=document_tracking')
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="ติดตามเอกสารจัดซื้อจัดจ้างและสัญญายืมเงิน"
                                    >
                                        <span className="text-purple-300/80 font-mono text-[10px]">●</span>
                                        <span className="text-sm">📍</span>
                                        {isSidebarOpen && <span>ติดตามเอกสาร & สัญญายืมเงิน</span>}
                                    </Link>

                                    <Link
                                        href={route('dashboard', { tab: 'procurement', tool: 'item_catalog' })}
                                        className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                            url.includes('tool=item_catalog')
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="คลังวัสดุ & ราคากลาง"
                                    >
                                        <span className="text-purple-300/80 font-mono text-[10px]">└─</span>
                                        <span className="text-sm">📦</span>
                                        {isSidebarOpen && <span>คลังวัสดุ & ราคากลาง</span>}
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
                                    <Link
                                        href={route('dashboard', { tab: 'action_plan_report' })}
                                        className={`flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                                            url.includes('tab=action_plan_report')
                                                ? 'bg-white/25 text-white font-semibold shadow-xs border-r-4 border-amber-400'
                                                : 'text-purple-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title="รายงานงบรายจ่ายแผนปฏิบัติราชการ"
                                    >
                                        <span className="text-purple-300/80 font-mono text-[10px]">└─</span>
                                        <span className="text-sm">📊</span>
                                        {isSidebarOpen && <span>รายงานแผนปฏิบัติราชการ</span>}
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

            {/* FIRST-TIME CITIZEN ID REGISTRATION MODAL */}
            {showCitizenModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-purple-950/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl border border-purple-200 max-w-lg w-full overflow-hidden animate-scaleUp">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-6 text-white relative">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl mb-3 border border-white/20 shadow-inner">
                                🪪
                            </div>
                            <h3 className="text-lg font-black tracking-wide">
                                ยืนยันเลขประจำตัวประชาชน 13 หลัก
                            </h3>
                            <p className="text-xs text-purple-100/90 mt-1 leading-relaxed">
                                เพื่อใช้ประกอบการจัดทำคำสั่งแต่งตั้งคณะกรรมการตรวจรับพัสดุ และบันทึกข้อมูลในระบบจัดซื้อจัดจ้างภาครัฐ (e-GP)
                            </p>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSaveCitizenId} className="p-6 space-y-4">
                            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-100 flex items-start gap-3">
                                <span className="text-lg shrink-0">🛡️</span>
                                <div className="text-xs text-purple-900 space-y-1">
                                    <p className="font-bold">ระบบความปลอดภัยมาตรฐานภาครัฐ</p>
                                    <p className="text-[11px] text-purple-700/80 leading-relaxed">
                                        ข้อมูลเลขประจำตัวประชาชนของท่านจะถูก<b>เข้ารหัสความปลอดภัยระดับสูง (AES-256 Encrypted)</b> ในฐานข้อมูล ไม่สามารถเข้าถึงโดยตรงได้
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-black text-slate-700">
                                    เลขประจำตัวประชาชน 13 หลัก (ของ {user?.name}) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={citizenIdInput}
                                    onChange={handleCitizenIdChange}
                                    placeholder="X-XXXX-XXXXX-XX-X"
                                    maxLength={17}
                                    className="w-full text-center text-lg font-mono font-bold tracking-widest rounded-2xl border-2 border-purple-200 bg-slate-50/50 px-4 py-3 focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all text-purple-950 placeholder:text-slate-300 shadow-inner"
                                    autoFocus
                                />
                                {citizenIdError && (
                                    <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1">
                                        <span>⚠️</span> {citizenIdError}
                                    </p>
                                )}
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row gap-2">
                                <button
                                    type="submit"
                                    disabled={isSavingCitizenId}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-purple-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isSavingCitizenId ? (
                                        <>
                                            <span className="animate-spin">⏳</span> กำลังบันทึกข้อมูล...
                                        </>
                                    ) : (
                                        <>
                                            <span>💾</span> บันทึกและเข้ารหัสข้อมูล
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        sessionStorage.setItem('dismiss_citizen_modal', 'true');
                                        setShowCitizenModal(false);
                                    }}
                                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-xs transition active:scale-[0.98] cursor-pointer"
                                >
                                    ไว้ภายหลัง
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
