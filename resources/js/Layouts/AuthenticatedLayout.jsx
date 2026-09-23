import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function AuthenticatedLayout({ header, children }) {
    const { auth, asset_url } = usePage().props;
    const user = auth.user;
    const url = usePage().url || '';
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebar-open');
        return saved !== null ? saved === 'true' : true;
    });

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => {
            const next = !prev;
            localStorage.setItem('sidebar-open', String(next));
            return next;
        });
    };
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

    const allClosedSections = {
        proposal: false,
        five_chapters: false,
        procurement_loan: false,
        procurement_hub: false,
        finance_hub: false,
        plan_hub: false,
        executive_hub: false,
        admin_console: false,
    };

    const getActiveSectionForUrl = (currentUrl) => {
        if (!currentUrl) return null;
        if (currentUrl.includes('chapter=') || currentUrl.includes('filter=reporting') || currentUrl.includes('chapter-2')) {
            return 'five_chapters';
        }
        if (currentUrl.includes('tab=admin_') || (currentUrl.includes('tab=all_projects') && isAdmin)) {
            return 'admin_console';
        }
        if (currentUrl.includes('tab=executive_overview') || (isExecutive && (currentUrl.includes('tab=annual_budget_requests') || currentUrl.includes('tab=budgets')))) {
            return 'executive_hub';
        }
        if (currentUrl.includes('tab=annual_budget_requests') || currentUrl.includes('tab=budgets') || (currentUrl.includes('tab=reviews') && isPlanStaff) || (isPlanStaff && currentUrl.includes('routine-budgets')) || currentUrl.includes('tab=action_plan_report')) {
            return 'plan_hub';
        }
        if (currentUrl.includes('tab=procurement') || (currentUrl.includes('vendors') && isProcurementStaff)) {
            return 'procurement_hub';
        }
        if (currentUrl.includes('tab=central_budgets') || (currentUrl.includes('tab=clearings') && isFinanceStaff)) {
            return 'finance_hub';
        }
        if (currentUrl.includes('routine-budgets') || (currentUrl.includes('tab=clearings') && !isFinanceStaff)) {
            return 'procurement_loan';
        }
        if (currentUrl.includes('tab=proposals') || currentUrl.includes('tab=document_tracking') || currentUrl.includes('tab=reviews') || (typeof route !== 'undefined' && (route().current('projects.quick_create') || route().current('projects.create')))) {
            return 'proposal';
        }
        return null;
    };

    // Collapsible Sidebar Sections State (Strict Accordion: Open ONLY 1 section at a time)
    const [openSections, setOpenSections] = useState(() => {
        const saved = localStorage.getItem('sidebar-open-sections-v3');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        const initialActive = getActiveSectionForUrl(url || '');
        return initialActive ? { ...allClosedSections, [initialActive]: true } : { ...allClosedSections, proposal: true };
    });

    const toggleSection = (sectionKey) => {
        setOpenSections(prev => {
            const isCurrentlyOpen = prev[sectionKey];
            // Accordion mode: collapse if currently open, else expand ONLY the clicked section
            const next = isCurrentlyOpen
                ? { ...allClosedSections }
                : { ...allClosedSections, [sectionKey]: true };
            localStorage.setItem('sidebar-open-sections-v3', JSON.stringify(next));
            return next;
        });
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
        setCitizenIdError('');

        axios.post(route('profile.update_citizen_id'), {
            citizen_id: clean,
        }, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        })
        .then(() => {
            setIsSavingCitizenId(false);
            setShowCitizenModal(false);
            sessionStorage.setItem('dismiss_citizen_modal', 'true');
            // Reload user data so top bar and state update immediately
            router.reload({ preserveScroll: true });
        })
        .catch((error) => {
            setIsSavingCitizenId(false);
            const msg = error.response?.data?.errors?.citizen_id 
                || error.response?.data?.message 
                || (error.message ? `เกิดข้อผิดพลาด: ${error.message}` : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
            setCitizenIdError(String(msg));
        });
    };

    const userRoleName = user?.role?.name || (typeof user?.role === 'string' ? user.role : '');
    const isAdmin = Boolean(user?.is_admin || userRoleName === 'admin');
    const isExecutive = Boolean(user?.is_executive || userRoleName === 'executive' || isAdmin);
    const isPlanHead = Boolean(user?.is_plan_head || userRoleName === 'plan_head' || isAdmin);
    const isPlanStaff = Boolean(user?.is_plan_staff || isPlanHead || (user?.department && (user.department.name?.includes('แผน') || user.department.code === 'PLAN')) || user?.position?.includes('แผน'));
    const isProcurementStaff = Boolean(user?.is_procurement_staff || user?.is_procurement_head || userRoleName === 'procurement_head' || isAdmin || (user?.department && (user.department.name?.includes('พัสดุ') || user.department.code === 'PROC')) || user?.position?.includes('พัสดุ'));
    const isFinanceStaff = Boolean(user?.is_finance_staff || userRoleName === 'finance_head' || userRoleName === 'finance_staff' || isAdmin || (user?.department && (user.department.name?.includes('การเงิน') || user.department.code === 'FIN')) || user?.position?.includes('การเงิน'));

    // Determine user role label for the top-right header display
    const getRoleLabel = () => {
        if (isAdmin) return 'ผู้ดูแลระบบ (Super Admin)';
        if (isExecutive) return 'ผู้บริหาร';
        if (isPlanHead || isPlanStaff) return 'งานแผนงานและงบประมาณ';
        if (isProcurementStaff) return 'เจ้าหน้าที่งานพัสดุ';
        if (isFinanceStaff) return 'เจ้าหน้าที่งานการเงิน';
        return 'ครูผู้เสนอโครงการ';
    };

    // Auto-open ONLY the section that contains the currently active URL/page
    useEffect(() => {
        const activeKey = getActiveSectionForUrl(url);
        if (activeKey) {
            const next = { ...allClosedSections, [activeKey]: true };
            setOpenSections(next);
            localStorage.setItem('sidebar-open-sections-v3', JSON.stringify(next));
        }
    }, [url]);

    const getSubLinkClass = (isActive) =>
        `flex items-center gap-x-2 px-3 py-2 rounded-xl text-xs transition-all ${
            isActive
                ? 'bg-gradient-to-r from-white via-purple-50 to-white text-purple-950 font-black shadow-lg shadow-purple-950/20 ring-2 ring-purple-300 scale-[1.02]'
                : 'text-purple-100 hover:bg-white/10 hover:text-white font-normal'
        }`;

    const getPrefixClass = (isActive, defaultColor = 'text-purple-300/80') =>
        `${isActive ? 'text-purple-950 font-bold' : defaultColor} font-mono text-[10px]`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-white font-sans text-slate-800 flex flex-col">
            
            {/* 1. TOP NAVIGATION BAR WITH RICH LIGHTING, SHADOW, AND GLASSMORPHISM DIMENSION */}
            <nav className="bg-gradient-to-r from-white via-purple-50/70 to-white border-b border-purple-200/70 shadow-[0_4px_25px_-5px_rgba(147,51,234,0.12)] sticky top-0 z-50 backdrop-blur-md">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        
                        {/* Topbar Left: Hamburger + Logo + School Badge */}
                        <div className="flex items-center gap-x-3 sm:gap-x-4">
                            {/* Desktop Sidebar Toggle Button */}
                            <button
                                type="button"
                                onClick={toggleSidebar}
                                className={`hidden sm:inline-flex items-center justify-center p-2 rounded-xl transition-all focus:outline-none shadow-2xs border cursor-pointer ${
                                    !isSidebarOpen 
                                        ? 'bg-gradient-to-r from-purple-100 to-purple-200 border-purple-300 text-purple-950 ring-2 ring-purple-400 hover:from-purple-200 hover:to-purple-300' 
                                        : 'text-purple-900 hover:bg-purple-100/60 border-purple-100'
                                }`}
                                title={isSidebarOpen ? "คลิกเพื่อซ่อนแถบเมนูซ้าย" : "คลิกเพื่อแสดงแถบเมนูซ้าย"}
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
                    className={`bg-gradient-to-b from-purple-950 via-purple-900 to-purple-950 border-r border-purple-800/50 text-white shadow-xl transition-all duration-300 z-40 flex flex-col justify-between sticky top-16 h-[calc(100vh-4rem)] shrink-0 ${
                        isSidebarOpen ? 'w-64 opacity-100' : 'w-0 overflow-hidden opacity-0 pointer-events-none p-0 m-0 border-0'
                    } hidden sm:flex`}
                >
                    {/* Upper Navigation Menu List */}
                    <div
                        ref={sidebarScrollRef}
                        onScroll={handleSidebarScroll}
                        scroll-region="true"
                        data-inertia-scroll-region="true"
                        className="p-3 space-y-2 font-kanit overflow-y-auto max-h-[calc(100vh-8rem)]"
                    >
                        
                        {/* 0. MAIN DASHBOARD HOME ENTRY */}
                        <Link
                            href={route('dashboard')}
                            className={`flex items-center gap-x-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${
                                route().current('dashboard') && (!url.includes('tab=') || url.includes('tab=admin_users'))
                                    ? 'bg-gradient-to-r from-white via-purple-50 to-white text-purple-950 shadow-lg shadow-purple-950/20 font-black ring-2 ring-purple-300 scale-[1.02]'
                                    : 'text-white bg-white/10 hover:bg-white/20 font-medium'
                            }`}
                            title="ศูนย์ควบคุมหลัก"
                        >
                            <span className="text-base">📊</span>
                            {isSidebarOpen && <span>ศูนย์ควบคุมหลัก</span>}
                        </Link>
                        
                        {/* 1. PROJECT LIFECYCLE MENUS (สำหรับผู้เสนอโครงการ ครู และผู้ลงนามทุกฝ่าย) */}
                        {(!isFinanceStaff || isAdmin || isPlanStaff) && (
                        <div className="pt-2 space-y-1">
                            {isSidebarOpen ? (
                                <button
                                    type="button"
                                    onClick={() => toggleSection('proposal')}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-purple-900/70 via-purple-800/50 to-transparent text-purple-100 border-l-4 border-amber-400 text-xs font-black uppercase tracking-wider hover:from-purple-800/80 hover:to-purple-900/40 transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-x-2">
                                        <span>📝</span>
                                        <span>๑. งานเสนอ & วงจรโครงการ</span>
                                    </div>
                                    <span className="text-[11px] text-purple-300">{openSections.proposal ? '▼' : '▶'}</span>
                                </button>
                            ) : (
                                <div className="h-px bg-white/20 my-1.5" />
                            )}

                            {(!isSidebarOpen || openSections.proposal) && (
                            <div className="pl-2.5 border-l-2 border-purple-400/30 ml-2 space-y-1 animate-in fade-in duration-150">
                                <Link
                                    href={route('projects.quick_create')}
                                    className={getSubLinkClass(route().current('projects.quick_create'))}
                                    title="เสนอโครงการเบื้องต้น (ขอตั้งงบ)"
                                >
                                    <span className={getPrefixClass(route().current('projects.quick_create'))}>└─</span>
                                    <span className="text-sm">💡</span>
                                    {isSidebarOpen && <span>เสนอโครงการเบื้องต้น (ขอตั้งงบ)</span>}
                                </Link>
                                <Link
                                    href={route('projects.create')}
                                    className={getSubLinkClass(route().current('projects.create'))}
                                    title="จัดทำข้อเสนอโครงการฉบับเต็ม"
                                >
                                    <span className={getPrefixClass(route().current('projects.create'))}>└─</span>
                                    <span className="text-sm">➕</span>
                                    {isSidebarOpen && <span>จัดทำโครงการฉบับเต็ม</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'proposals' })}
                                    className={getSubLinkClass(url.includes('tab=proposals') && !url.includes('filter=report'))}
                                    title="โครงการของฉัน (ดำเนินโครงการ & ประเมิน)"
                                >
                                    <span className={getPrefixClass(url.includes('tab=proposals') && !url.includes('filter=report'))}>└─</span>
                                    <span className="text-sm">📋</span>
                                    {isSidebarOpen && <span>โครงการของฉัน & ประเมิน</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'reviews' })}
                                    className={getSubLinkClass(url.includes('tab=reviews'))}
                                    title="คิวลงนามอนุมัติของผู้เกี่ยวข้อง"
                                >
                                    <span className={getPrefixClass(url.includes('tab=reviews'))}>└─</span>
                                    <span className="text-sm">✍️</span>
                                    {isSidebarOpen && <span>คิวลงนามอนุมัติ (ผู้เกี่ยวข้อง)</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'proposals', filter: 'reporting' })}
                                    className={getSubLinkClass(url.includes('filter=reporting'))}
                                    title="สรุปและจัดทำรูปเล่มโครงการ ๕ บท"
                                >
                                    <span className={getPrefixClass(url.includes('filter=reporting'))}>└─</span>
                                    <span className="text-sm">📖</span>
                                    {isSidebarOpen && <span>สรุป & เล่มโครงการ ๕ บท</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'document_tracking' })}
                                    className={getSubLinkClass(url.includes('tab=document_tracking'))}
                                    title="ติดตามเอกสารและสถานะโครงการ"
                                >
                                    <span className={getPrefixClass(url.includes('tab=document_tracking'))}>●</span>
                                    <span className="text-sm">📍</span>
                                    {isSidebarOpen && <span>ติดตามเอกสารและโครงการ</span>}
                                </Link>
                            </div>
                            )}
                        </div>
                        )}

                        {/* ๒. 5-CHAPTER PROJECT DOCUMENTATION (การจัดทำเอกสารรายงานโครงการ ๕ บท) */}
                        {(!isFinanceStaff || isAdmin || isPlanStaff) && (
                        <div className="pt-2 space-y-1">
                            {isSidebarOpen ? (
                                <button
                                    type="button"
                                    onClick={() => toggleSection('five_chapters')}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-purple-900/70 via-purple-800/50 to-transparent text-purple-100 border-l-4 border-emerald-400 text-xs font-black uppercase tracking-wider hover:from-purple-800/80 hover:to-purple-900/40 transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-x-2">
                                        <span>📖</span>
                                        <span>๒. เอกสารรายงานโครงการ (๕ บท)</span>
                                    </div>
                                    <span className="text-[11px] text-purple-300">{openSections.five_chapters ? '▼' : '▶'}</span>
                                </button>
                            ) : (
                                <div className="h-px bg-white/20 my-1.5" />
                            )}

                            {(!isSidebarOpen || openSections.five_chapters) && (
                            <div className="pl-2.5 border-l-2 border-emerald-400/30 ml-2 space-y-1 animate-in fade-in duration-150">
                                <Link
                                    href={route('dashboard', { tab: 'proposals', chapter: 1 })}
                                    className={getSubLinkClass(url.includes('chapter=1'))}
                                    title="บทที่ ๑: บทนำ & ข้อเสนอโครงการ"
                                >
                                    <span className={getPrefixClass(url.includes('chapter=1'), 'text-emerald-300')}>└─</span>
                                    <span className="text-sm">📘</span>
                                    {isSidebarOpen && <span>บทที่ ๑: บทนำ & ข้อมูลโครงการ</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'proposals', chapter: 2 })}
                                    className={getSubLinkClass(url.includes('chapter=2') || url.includes('chapter-2'))}
                                    title="บทที่ ๒: เอกสารและงานวิจัยที่เกี่ยวข้อง (AI สังเคราะห์)"
                                >
                                    <span className={getPrefixClass(url.includes('chapter=2') || url.includes('chapter-2'), 'text-emerald-300')}>└─</span>
                                    <span className="text-sm">📗</span>
                                    {isSidebarOpen && <span>บทที่ ๒: งานวิจัย & นโยบาย (AI)</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'proposals', chapter: 3 })}
                                    className={getSubLinkClass(url.includes('chapter=3'))}
                                    title="บทที่ ๓: วิธีดำเนินงาน & จัดซื้อจัดจ้าง (Do Phase)"
                                >
                                    <span className={getPrefixClass(url.includes('chapter=3'), 'text-emerald-300')}>└─</span>
                                    <span className="text-sm">📙</span>
                                    {isSidebarOpen && <span>บทที่ ๓: วิธีดำเนินงาน & พัสดุ</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'proposals', chapter: 4 })}
                                    className={getSubLinkClass(url.includes('chapter=4'))}
                                    title="บทที่ ๔: ผลการดำเนินงาน & ประเมินผล (Check Phase)"
                                >
                                    <span className={getPrefixClass(url.includes('chapter=4'), 'text-emerald-300')}>└─</span>
                                    <span className="text-sm">📕</span>
                                    {isSidebarOpen && <span>บทที่ ๔: ผลดำเนินงาน & ประเมิน</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'proposals', filter: 'reporting', chapter: 5 })}
                                    className={getSubLinkClass(url.includes('chapter=5') || (url.includes('filter=reporting') && !url.includes('chapter=')))}
                                    title="บทที่ ๕: สรุปผล อภิปรายผล & พิมพ์รูปเล่ม (Act Phase)"
                                >
                                    <span className={getPrefixClass(url.includes('chapter=5') || (url.includes('filter=reporting') && !url.includes('chapter=')), 'text-emerald-300')}>└─</span>
                                    <span className="text-sm">📓</span>
                                    {isSidebarOpen && <span>บทที่ ๕: สรุปผล & พิมพ์เล่ม ๕ บท</span>}
                                </Link>
                            </div>
                            )}
                        </div>
                        )}

                        {/* 3. PROCUREMENT & LOAN (สำหรับผู้ขอซื้อ/ยืมเงิน ครู และสาขาวิชา) */}
                        {(!isFinanceStaff || isAdmin || isPlanStaff) && (
                        <div className="pt-2 space-y-1">
                            {isSidebarOpen ? (
                                <button
                                    type="button"
                                    onClick={() => toggleSection('procurement_loan')}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-transparent text-purple-100 border-l-4 border-sky-400 text-xs font-black uppercase tracking-wider hover:from-purple-800/70 hover:to-purple-900/30 transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-x-2">
                                        <span>💼</span>
                                        <span>๓. จัดซื้อจัดจ้าง & สัญญายืมเงิน</span>
                                    </div>
                                    <span className="text-[11px] text-purple-300">{openSections.procurement_loan ? '▼' : '▶'}</span>
                                </button>
                            ) : (
                                <div className="h-px bg-white/20 my-1.5" />
                            )}

                            {(!isSidebarOpen || openSections.procurement_loan) && (
                            <div className="pl-2.5 border-l-2 border-purple-400/30 ml-2 space-y-1 animate-in fade-in duration-150">
                                <Link
                                    href={route('dashboard', { tab: 'proposals' })}
                                    className={getSubLinkClass(false)}
                                    title="จัดทำชุดจัดซื้อจัดจ้าง ๔ ฉบับจากโครงการ"
                                >
                                    <span className={getPrefixClass(false)}>└─</span>
                                    <span className="text-sm">📑</span>
                                    {isSidebarOpen && <span>จัดทำชุดจัดซื้อจัดจ้าง (๔ ฉบับ)</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'clearings' })}
                                    className={getSubLinkClass(url.includes('tab=clearings') && !url.includes('action='))}
                                    title="สัญญายืมเงิน กค.๑๐๑ / ยืมเงินไปราชการ"
                                >
                                    <span className={getPrefixClass(url.includes('tab=clearings') && !url.includes('action='))}>└─</span>
                                    <span className="text-sm">📝</span>
                                    {isSidebarOpen && <span>สัญญายืมเงิน กค.๑๐๑ / ไปราชการ</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'clearings', action: 'new' })}
                                    className={getSubLinkClass(url.includes('action=new'))}
                                    title="ส่งใบเสร็จเคลียร์เงินยืม / ขอเบิกชดเชย"
                                >
                                    <span className={getPrefixClass(url.includes('action=new'))}>└─</span>
                                    <span className="text-sm">🧾</span>
                                    {isSidebarOpen && <span>ส่งใบเสร็จเคลียร์เงินยืม / เบิกจ่าย</span>}
                                </Link>
                                <Link
                                    href={route('admin.routine_budgets.index')}
                                    className={getSubLinkClass(url.includes('routine-budgets') && !isPlanStaff && !isFinanceStaff)}
                                    title="งบดำเนินงานประจำปี & จัดซื้อจัดจ้างตรง"
                                >
                                    <span className={getPrefixClass(url.includes('routine-budgets') && !isPlanStaff && !isFinanceStaff)}>└─</span>
                                    <span className="text-sm">🗓️</span>
                                    {isSidebarOpen && <span>งบดำเนินงานประจำปี & จัดซื้อตรง</span>}
                                </Link>
                            </div>
                            )}
                        </div>
                        )}

                        {/* 4. PROCUREMENT HUB (เฉพาะเจ้าหน้าที่งานพัสดุ และ Admin) */}
                        {(isProcurementStaff || isAdmin) && (
                        <div className="pt-2 space-y-1">
                            {isSidebarOpen ? (
                                <button
                                    type="button"
                                    onClick={() => toggleSection('procurement_hub')}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-blue-900/80 via-indigo-900/60 to-purple-900/40 text-blue-200 border-l-4 border-blue-400 text-xs font-black uppercase tracking-wider hover:from-blue-800 hover:to-indigo-800 transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-x-2">
                                        <span>📦</span>
                                        <span>๔. ศูนย์งานพัสดุ (Procurement)</span>
                                    </div>
                                    <span className="text-[11px] text-blue-300">{openSections.procurement_hub ? '▼' : '▶'}</span>
                                </button>
                            ) : (
                                <div className="h-px bg-white/20 my-1.5" />
                            )}

                            {(!isSidebarOpen || openSections.procurement_hub) && (
                            <div className="pl-2.5 border-l-2 border-blue-400/30 ml-2 space-y-1 animate-in fade-in duration-150">
                                <Link
                                    href={route('dashboard', { tab: 'procurement' })}
                                    className={getSubLinkClass(url.includes('tab=procurement') && !url.includes('tool=item_catalog'))}
                                    title="คิวลงรับจัดซื้อจัดจ้าง & แต่งตั้งกรรมการ"
                                >
                                    <span className={getPrefixClass(url.includes('tab=procurement') && !url.includes('tool=item_catalog'), 'text-blue-300')}>└─</span>
                                    <span className="text-sm">📋</span>
                                    {isSidebarOpen && <span>คิวลงรับจัดซื้อ & แต่งตั้งกรรมการ</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'document_tracking' })}
                                    className={getSubLinkClass(url.includes('tab=document_tracking'))}
                                    title="ติดตามเอกสารจัดซื้อจัดจ้าง & ส่งต่อการเงิน"
                                >
                                    <span className={getPrefixClass(url.includes('tab=document_tracking'), 'text-blue-300')}>●</span>
                                    <span className="text-sm">📍</span>
                                    {isSidebarOpen && <span>ติดตามเอกสารพัสดุ & ส่งการเงิน</span>}
                                </Link>
                                <Link
                                    href={route('vendors.index')}
                                    className={getSubLinkClass(url.includes('vendors'))}
                                    title="ทะเบียนร้านค้า / ผู้ประกอบการคู่ค้า"
                                >
                                    <span className={getPrefixClass(url.includes('vendors'), 'text-blue-300')}>└─</span>
                                    <span className="text-sm">🏪</span>
                                    {isSidebarOpen && <span>ทะเบียนร้านค้า / ผู้ประกอบการ</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'procurement', tool: 'item_catalog' })}
                                    className={getSubLinkClass(url.includes('tool=item_catalog'))}
                                    title="คลังวัสดุ & บัญชีราคากลาง"
                                >
                                    <span className={getPrefixClass(url.includes('tool=item_catalog'), 'text-blue-300')}>└─</span>
                                    <span className="text-sm">📦</span>
                                    {isSidebarOpen && <span>คลังพัสดุ & ราคากลาง</span>}
                                </Link>
                            </div>
                            )}
                        </div>
                        )}

                        {/* 5. FINANCE HUB (เฉพาะเจ้าหน้าที่งานการเงิน และ Admin) */}
                        {(isFinanceStaff || isAdmin) && (
                        <div className="pt-2 space-y-1">
                            {isSidebarOpen ? (
                                <button
                                    type="button"
                                    onClick={() => toggleSection('finance_hub')}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-900/80 via-teal-900/60 to-purple-900/40 text-emerald-200 border-l-4 border-emerald-400 text-xs font-black uppercase tracking-wider hover:from-emerald-800 hover:to-teal-800 transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-x-2">
                                        <span>💳</span>
                                        <span>๕. ศูนย์งานการเงิน (Finance)</span>
                                    </div>
                                    <span className="text-[11px] text-emerald-300">{openSections.finance_hub ? '▼' : '▶'}</span>
                                </button>
                            ) : (
                                <div className="h-px bg-white/20 my-1.5" />
                            )}

                            {(!isSidebarOpen || openSections.finance_hub) && (
                            <div className="pl-2.5 border-l-2 border-emerald-400/30 ml-2 space-y-1 animate-in fade-in duration-150">
                                <Link
                                    href={route('dashboard', { tab: 'central_budgets' })}
                                    className={getSubLinkClass(url.includes('tab=central_budgets'))}
                                    title="หมวดหมู่งบประมาณ & ยอดแจ้งจัดสรรจากส่วนกลาง"
                                >
                                    <span className={getPrefixClass(url.includes('tab=central_budgets'), 'text-emerald-300')}>●</span>
                                    <span className="text-sm">🏛️</span>
                                    {isSidebarOpen && <span>หมวดหมู่งบ & จัดสรรส่วนกลาง</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'document_tracking' })}
                                    className={getSubLinkClass(url.includes('tab=document_tracking'))}
                                    title="คิวตรวจจ่ายและโอนเงินยืม กค.๑๐๑ / จัดซื้อ"
                                >
                                    <span className={getPrefixClass(url.includes('tab=document_tracking'), 'text-emerald-300')}>●</span>
                                    <span className="text-sm">💵</span>
                                    {isSidebarOpen && <span>คิวตรวจจ่ายโอนเงินยืม (กค.๑๐๑)</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'clearings' })}
                                    className={getSubLinkClass(url.includes('tab=clearings'))}
                                    title="คิวตรวจรับใบเสร็จและล้างหนี้เงินยืมทดรอง"
                                >
                                    <span className={getPrefixClass(url.includes('tab=clearings'), 'text-emerald-300')}>└─</span>
                                    <span className="text-sm">🧾</span>
                                    {isSidebarOpen && <span>คิวตรวจรับใบเสร็จ & ล้างหนี้เงินยืม</span>}
                                </Link>
                                <Link
                                    href={route('admin.routine_budgets.index')}
                                    className={getSubLinkClass(url.includes('routine-budgets'))}
                                    title="งบประจำปี & ลงรับ/โอนเงินยืมจัดซื้อตรง"
                                >
                                    <span className={getPrefixClass(url.includes('routine-budgets'), 'text-emerald-300')}>└─</span>
                                    <span className="text-sm">🗓️</span>
                                    {isSidebarOpen && <span>งบประจำปี & โอนเงินยืมจัดซื้อ</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'all_projects' })}
                                    className={getSubLinkClass(url.includes('tab=all_projects'))}
                                    title="สรุปโครงการทั้งหมดของวิทยาลัย"
                                >
                                    <span className={getPrefixClass(url.includes('tab=all_projects'), 'text-emerald-300')}>└─</span>
                                    <span className="text-sm">📁</span>
                                    {isSidebarOpen && <span>สรุปโครงการทั้งหมดของวิทยาลัย</span>}
                                </Link>
                            </div>
                            )}
                        </div>
                        )}

                        {/* 6. PLANNING HUB (เฉพาะเจ้าหน้าที่งานแผนงานและงบประมาณ และ Admin) */}
                        {(isPlanStaff || isAdmin) && (
                        <div className="pt-2 space-y-1">
                            {isSidebarOpen ? (
                                <button
                                    type="button"
                                    onClick={() => toggleSection('plan_hub')}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-amber-900/80 via-orange-900/60 to-purple-900/40 text-amber-200 border-l-4 border-amber-400 text-xs font-black uppercase tracking-wider hover:from-amber-800 hover:to-orange-800 transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-x-2">
                                        <span>📊</span>
                                        <span>๖. งานแผนและงบประมาณ</span>
                                    </div>
                                    <span className="text-[11px] text-amber-300">{openSections.plan_hub ? '▼' : '▶'}</span>
                                </button>
                            ) : (
                                <div className="h-px bg-white/20 my-1.5" />
                            )}

                            {(!isSidebarOpen || openSections.plan_hub) && (
                            <div className="pl-2.5 border-l-2 border-amber-400/30 ml-2 space-y-1 animate-in fade-in duration-150">
                                <Link
                                    href={route('dashboard', { tab: 'annual_budget_requests' })}
                                    className={getSubLinkClass(url.includes('tab=annual_budget_requests'))}
                                    title="ภาพรวมคำของบประมาณประจำปี แยก ๔ ฝ่าย พร้อมพิจารณาอนุมัติจัดสรร"
                                >
                                    <span className={getPrefixClass(url.includes('tab=annual_budget_requests'), 'text-amber-300')}>●</span>
                                    <span className="text-sm">📊</span>
                                    {isSidebarOpen && <span className="font-black text-amber-300">ภาพรวมคำของบแยก ๔ ฝ่าย</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'budgets' })}
                                    className={getSubLinkClass(url.includes('tab=budgets'))}
                                    title="งบประมาณสถานศึกษา & ประมาณการใช้จ่าย"
                                >
                                    <span className={getPrefixClass(url.includes('tab=budgets'), 'text-amber-300')}>└─</span>
                                    <span className="text-sm">💰</span>
                                    {isSidebarOpen && <span>งบสถานศึกษา & ประมาณการใช้จ่าย</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'reviews' })}
                                    className={getSubLinkClass(url.includes('tab=reviews'))}
                                    title="ตรวจสอบแผน & พิจารณาอนุมัติโครงการ (ขั้น ๓)"
                                >
                                    <span className={getPrefixClass(url.includes('tab=reviews'), 'text-amber-300')}>└─</span>
                                    <span className="text-sm">🔍</span>
                                    {isSidebarOpen && <span>ตรวจสอบแผน & อนุมัติ (ขั้น ๓)</span>}
                                </Link>
                                <Link
                                    href={`${route('admin.routine_budgets.index')}?tab=create_plan`}
                                    className={getSubLinkClass(url.includes('routine-budgets') && url.includes('tab=create_plan'))}
                                    title="จัดทำและลงแผนงบดำเนินงานประจำปี (สร้าง/แก้ไข)"
                                >
                                    <span className={getPrefixClass(url.includes('routine-budgets') && url.includes('tab=create_plan'), 'text-amber-300')}>└─</span>
                                    <span className="text-sm">📝</span>
                                    {isSidebarOpen && <span>ลงแผนงบดำเนินงานประจำปี</span>}
                                </Link>
                                <Link
                                    href={route('admin.routine_budgets.index')}
                                    className={getSubLinkClass(url.includes('routine-budgets') && !url.includes('tab=create_plan'))}
                                    title="ตารางแสดงการจัดสรรงบดำเนินงานประจำปีและแดชบอร์ด"
                                >
                                    <span className={getPrefixClass(url.includes('routine-budgets') && !url.includes('tab=create_plan'), 'text-amber-300')}>└─</span>
                                    <span className="text-sm">📋</span>
                                    {isSidebarOpen && <span>ตารางจัดสรรงบประจำปี</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'document_tracking' })}
                                    className={getSubLinkClass(url.includes('tab=document_tracking'))}
                                    title="ทะเบียนตัดยอดงบ ผง. (จัดซื้อจัดจ้าง / สัญญายืมเงิน)"
                                >
                                    <span className={getPrefixClass(url.includes('tab=document_tracking'), 'text-amber-300')}>●</span>
                                    <span className="text-sm">📑</span>
                                    {isSidebarOpen && <span>ตัดยอดงบ ผง. (จัดซื้อ/ยืมเงิน)</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'action_plan_report' })}
                                    className={getSubLinkClass(url.includes('tab=action_plan_report'))}
                                    title="รายงานงบรายจ่ายแผนปฏิบัติราชการ"
                                >
                                    <span className={getPrefixClass(url.includes('tab=action_plan_report'), 'text-amber-300')}>└─</span>
                                    <span className="text-sm">📊</span>
                                    {isSidebarOpen && <span>รายงานแผนปฏิบัติราชการ</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'all_projects' })}
                                    className={getSubLinkClass(url.includes('tab=all_projects'))}
                                    title="สรุปโครงการทั้งหมดของวิทยาลัย"
                                >
                                    <span className={getPrefixClass(url.includes('tab=all_projects'), 'text-amber-300')}>└─</span>
                                    <span className="text-sm">🏛️</span>
                                    {isSidebarOpen && <span>สรุปโครงการทั้งหมดของวิทยาลัย</span>}
                                </Link>
                            </div>
                            )}
                        </div>
                        )}

                        {/* 7. EXECUTIVE HUB (สำหรับ ผอ., รอง ผอ. ๔ ฝ่าย และ Admin) */}
                        {(isExecutive || isAdmin) && (
                        <div className="pt-2 space-y-1">
                            {isSidebarOpen ? (
                                <button
                                    type="button"
                                    onClick={() => toggleSection('executive_hub')}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-violet-900/80 via-purple-900/60 to-fuchsia-900/40 text-violet-200 border-l-4 border-violet-400 text-xs font-black uppercase tracking-wider hover:from-violet-800 hover:to-purple-800 transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-x-2">
                                        <span>🏛️</span>
                                        <span>๗. ผู้บริหาร (Executive)</span>
                                    </div>
                                    <span className="text-[11px] text-violet-300">{openSections.executive_hub ? '▼' : '▶'}</span>
                                </button>
                            ) : (
                                <div className="h-px bg-white/20 my-1.5" />
                            )}

                            {(!isSidebarOpen || openSections.executive_hub) && (
                            <div className="pl-2.5 border-l-2 border-violet-400/30 ml-2 space-y-1 animate-in fade-in duration-150">
                                <Link
                                    href={route('dashboard', { tab: 'executive_overview' })}
                                    className={getSubLinkClass(url.includes('tab=executive_overview'))}
                                    title="ภาพรวมผลงานและงบประมาณ ๔ ฝ่ายหลัก"
                                >
                                    <span className={getPrefixClass(url.includes('tab=executive_overview'), 'text-violet-300')}>└─</span>
                                    <span className="text-sm">📈</span>
                                    {isSidebarOpen && <span>ภาพรวมผลงาน & งบ ๔ ฝ่าย</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'annual_budget_requests' })}
                                    className={getSubLinkClass(url.includes('tab=annual_budget_requests'))}
                                    title="คำของบประมาณ ๔ ฝ่าย & พิจารณาอนุมัติ"
                                >
                                    <span className={getPrefixClass(url.includes('tab=annual_budget_requests'), 'text-violet-300')}>●</span>
                                    <span className="text-sm">📊</span>
                                    {isSidebarOpen && <span>คำของบประมาณ ๔ ฝ่าย</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'budgets' })}
                                    className={getSubLinkClass(url.includes('tab=budgets'))}
                                    title="ประมาณการรายจ่ายสถานศึกษา ๔ มิติ"
                                >
                                    <span className={getPrefixClass(url.includes('tab=budgets'), 'text-violet-300')}>└─</span>
                                    <span className="text-sm">💰</span>
                                    {isSidebarOpen && <span>ประมาณการรายจ่าย ๔ มิติ</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'action_plan_report' })}
                                    className={getSubLinkClass(url.includes('tab=action_plan_report'))}
                                    title="รายงานงบรายจ่ายตามแผนปฏิบัติราชการ"
                                >
                                    <span className={getPrefixClass(url.includes('tab=action_plan_report'), 'text-violet-300')}>└─</span>
                                    <span className="text-sm">📊</span>
                                    {isSidebarOpen && <span>รายงานแผนปฏิบัติราชการ</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'reviews' })}
                                    className={getSubLinkClass(url.includes('tab=reviews'))}
                                    title="คิวลงนามอนุมัติของผู้บริหาร (ขั้น ๔-๖)"
                                >
                                    <span className={getPrefixClass(url.includes('tab=reviews'), 'text-violet-300')}>└─</span>
                                    <span className="text-sm">✍️</span>
                                    {isSidebarOpen && <span>คิวลงนามอนุมัติ (ขั้น ๔-๖)</span>}
                                </Link>
                            </div>
                            )}
                        </div>
                        )}

                        {/* 8. ADMIN CONSOLE (เฉพาะ Super Admin) */}
                        {isAdmin && (
                        <div className="pt-2 space-y-1">
                            {isSidebarOpen ? (
                                <button
                                    type="button"
                                    onClick={() => toggleSection('admin_console')}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-red-950/80 via-rose-900/60 to-purple-900/40 text-rose-200 border-l-4 border-rose-500 text-xs font-black uppercase tracking-wider hover:from-rose-900 hover:to-purple-900 transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-x-2">
                                        <span>⚙️</span>
                                        <span>๘. ผู้ดูแลระบบ (Admin)</span>
                                    </div>
                                    <span className="text-[11px] text-rose-300">{openSections.admin_console ? '▼' : '▶'}</span>
                                </button>
                            ) : (
                                <div className="h-px bg-white/20 my-1.5" />
                            )}

                            {(!isSidebarOpen || openSections.admin_console) && (
                            <div className="pl-2.5 border-l-2 border-rose-500/30 ml-2 space-y-1 animate-in fade-in duration-150">
                                <Link
                                    href={route('dashboard', { tab: 'admin_users' })}
                                    className={getSubLinkClass(url.includes('tab=admin_users') || (!url.includes('tab=') && route().current('dashboard') && isAdmin))}
                                    title="จัดการผู้ใช้งานและสิทธิ์ & ซิงค์ LINE ID"
                                >
                                    <span className={getPrefixClass(url.includes('tab=admin_users') || (!url.includes('tab=') && route().current('dashboard') && isAdmin), 'text-rose-300')}>└─</span>
                                    <span className="text-sm">👤</span>
                                    {isSidebarOpen && <span>จัดการผู้ใช้ & สิทธิ์ & LINE</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'admin_strategies' })}
                                    className={getSubLinkClass(url.includes('tab=admin_strategies'))}
                                    title="จัดการยุทธศาสตร์ & นโยบาย สอศ. & IQA"
                                >
                                    <span className={getPrefixClass(url.includes('tab=admin_strategies'), 'text-rose-300')}>└─</span>
                                    <span className="text-sm">🎯</span>
                                    {isSidebarOpen && <span>จัดการยุทธศาสตร์ & นโยบาย</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'admin_settings' })}
                                    className={getSubLinkClass(url.includes('tab=admin_settings'))}
                                    title="ตั้งค่าระบบ & เลขที่เอกสารอัตโนมัติ"
                                >
                                    <span className={getPrefixClass(url.includes('tab=admin_settings'), 'text-rose-300')}>└─</span>
                                    <span className="text-sm">🛠️</span>
                                    {isSidebarOpen && <span>ตั้งค่าระบบ & เลขที่เอกสาร</span>}
                                </Link>
                                <Link
                                    href={route('dashboard', { tab: 'all_projects' })}
                                    className={getSubLinkClass(url.includes('tab=all_projects'))}
                                    title="สรุปโครงการทั้งหมดของวิทยาลัย"
                                >
                                    <span className={getPrefixClass(url.includes('tab=all_projects'), 'text-rose-300')}>└─</span>
                                    <span className="text-sm">🏛️</span>
                                    {isSidebarOpen && <span>สรุปโครงการทั้งหมด</span>}
                                </Link>
                            </div>
                            )}
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
                                className={`flex items-center gap-x-3 px-3.5 py-2 rounded-xl transition-all text-xs ${
                                    route().current('profile.edit')
                                        ? 'bg-gradient-to-r from-white via-purple-50 to-white text-purple-950 font-black shadow-lg shadow-purple-950/20 ring-2 ring-purple-300 scale-[1.02]'
                                        : 'text-purple-100 hover:bg-white/10 hover:text-white font-normal'
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
                        <div className="p-3 border-t border-white/15 bg-black/10 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-x-2 text-xs font-normal text-white/90 truncate">
                                <span>🏫</span>
                                <span className="truncate">วิทยาลัยสารพัดช่างน่าน</span>
                            </div>
                            <button
                                type="button"
                                onClick={toggleSidebar}
                                className="p-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition text-[11px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                                title="คลิกเพื่อซ่อนแถบเมนูซ้าย"
                            >
                                <span>◀</span>
                                <span>ซ่อนเมนู</span>
                            </button>
                        </div>
                    )}
                </aside>

                {/* Floating button to restore sidebar if hidden */}
                {!isSidebarOpen && (
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        className="hidden sm:flex fixed left-3 top-20 z-30 items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/90 hover:bg-purple-900 text-purple-300 hover:text-white border border-purple-400/40 shadow-xl text-xs font-bold transition-all hover:scale-105 backdrop-blur-md cursor-pointer animate-in fade-in"
                        title="คลิกเพื่อแสดงแถบเมนูด้านซ้าย"
                    >
                        <span>▶</span>
                        <span>แสดงเมนู</span>
                    </button>
                )}

                {/* Mobile Drawer Navigation */}
                {showingMobileMenu && (
                    <div className="sm:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
                        <div className="w-72 bg-gradient-to-b from-purple-950 via-purple-900 to-purple-950 text-white p-4 space-y-3 flex flex-col justify-between border-r border-purple-800/50 overflow-y-auto max-h-screen">
                            <div className="space-y-3 font-normal text-xs">
                                <div className="flex justify-between items-center border-b border-white/20 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">📋</span>
                                        <span className="font-bold text-sm">เมนูระบบ SmartFlow</span>
                                    </div>
                                    <button onClick={() => setShowingMobileMenu(false)} className="text-white text-lg p-1">✕</button>
                                </div>

                                <Link href={route('dashboard')} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2.5 rounded-xl font-bold bg-white/10 text-white">
                                    <span>📊</span> ศูนย์ควบคุมหลัก
                                </Link>

                                {/* 1. วงจรชีวิตโครงการ */}
                                {(!isFinanceStaff || isAdmin || isPlanStaff) && (
                                    <div className="space-y-1 pt-1 border-t border-white/10">
                                        <div className="text-[10px] font-bold text-amber-300 uppercase px-2">๑. งานเสนอ & วงจรโครงการ</div>
                                        <Link href={route('projects.quick_create')} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>💡</span> เสนอโครงการเบื้องต้น
                                        </Link>
                                        <Link href={route('projects.create')} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>➕</span> จัดทำโครงการฉบับเต็ม
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'proposals' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>📋</span> โครงการของฉัน & ประเมิน
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'reviews' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>✍️</span> คิวลงนามอนุมัติ
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'document_tracking' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>📍</span> ติดตามเอกสารและโครงการ
                                        </Link>
                                    </div>
                                )}

                                {/* ๒. รายงานโครงการ ๕ บท */}
                                {(!isFinanceStaff || isAdmin || isPlanStaff) && (
                                    <div className="space-y-1 pt-1 border-t border-white/10">
                                        <div className="text-[10px] font-bold text-emerald-300 uppercase px-2">๒. รายงานโครงการ ๕ บท</div>
                                        <Link href={route('dashboard', { tab: 'proposals', chapter: 1 })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>📘</span> บทที่ ๑: บทนำ & ข้อมูลโครงการ
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'proposals', chapter: 2 })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>📗</span> บทที่ ๒: งานวิจัย & นโยบาย (AI)
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'proposals', chapter: 3 })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>📙</span> บทที่ ๓: วิธีดำเนินงาน & พัสดุ
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'proposals', chapter: 4 })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>📕</span> บทที่ ๔: ผลดำเนินงาน & ประเมิน
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'proposals', filter: 'reporting', chapter: 5 })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>📓</span> บทที่ ๕: สรุปผล & พิมพ์เล่ม ๕ บท
                                        </Link>
                                    </div>
                                )}

                                {/* 3. จัดซื้อ & สัญญายืมเงิน */}
                                {(!isFinanceStaff || isAdmin || isPlanStaff) && (
                                    <div className="space-y-1 pt-1 border-t border-white/10">
                                        <div className="text-[10px] font-bold text-sky-300 uppercase px-2">๓. จัดซื้อจัดจ้าง & สัญญายืมเงิน</div>
                                        <Link href={route('dashboard', { tab: 'clearings' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>📝</span> สัญญายืมเงิน กค.๑๐๑
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'clearings', action: 'new' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>🧾</span> ส่งใบเสร็จเคลียร์เงินยืม
                                        </Link>
                                        <Link href={route('admin.routine_budgets.index')} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>🗓️</span> งบดำเนินงานประจำปี
                                        </Link>
                                    </div>
                                )}

                                {/* 4. พัสดุ */}
                                {(isProcurementStaff || isAdmin) && (
                                    <div className="space-y-1 pt-1 border-t border-white/10">
                                        <div className="text-[10px] font-bold text-blue-300 uppercase px-2">๔. งานพัสดุ</div>
                                        <Link href={route('dashboard', { tab: 'procurement' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>📋</span> คิวลงรับจัดซื้อ & กรรมการ
                                        </Link>
                                        <Link href={route('vendors.index')} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>🏪</span> ทะเบียนร้านค้า
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'procurement', tool: 'item_catalog' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>📦</span> คลังพัสดุ & ราคากลาง
                                        </Link>
                                    </div>
                                )}

                                {/* 5. การเงิน */}
                                {(isFinanceStaff || isAdmin) && (
                                    <div className="space-y-1 pt-1 border-t border-white/10">
                                        <div className="text-[10px] font-bold text-emerald-300 uppercase px-2">๕. งานการเงิน</div>
                                        <Link href={route('dashboard', { tab: 'central_budgets' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>🏛️</span> จัดสรรงบส่วนกลาง
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'clearings' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>🧾</span> คิวตรวจรับใบเสร็จล้างหนี้
                                        </Link>
                                    </div>
                                )}

                                {/* 6. แผนงาน */}
                                {(isPlanStaff || isAdmin) && (
                                    <div className="space-y-1 pt-1 border-t border-white/10">
                                        <div className="text-[10px] font-bold text-amber-300 uppercase px-2">๖. งานแผนและงบประมาณ</div>
                                        <Link href={route('dashboard', { tab: 'annual_budget_requests' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-amber-300 font-bold">
                                            <span>📊</span> ภาพรวมคำของบแยก ๔ ฝ่าย
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'budgets' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>💰</span> งบสถานศึกษา & ประมาณการ
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'reviews' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>🔍</span> ตรวจสอบแผน (ขั้น ๓)
                                        </Link>
                                        <Link href={route('admin.routine_budgets.index')} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>📋</span> ตารางจัดสรรงบประจำปี
                                        </Link>
                                    </div>
                                )}

                                {/* 7. ผู้บริหาร */}
                                {(isExecutive || isAdmin) && (
                                    <div className="space-y-1 pt-1 border-t border-white/10">
                                        <div className="text-[10px] font-bold text-violet-300 uppercase px-2">๗. ผู้บริหารสถานศึกษา</div>
                                        <Link href={route('dashboard', { tab: 'executive_overview' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>📈</span> ภาพรวม ๔ ฝ่าย
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'annual_budget_requests' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>📊</span> คำของบประมาณ ๔ ฝ่าย
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'reviews' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>✍️</span> คิวลงนามอนุมัติ (ขั้น ๔-๖)
                                        </Link>
                                    </div>
                                )}

                                {/* 8. Admin */}
                                {isAdmin && (
                                    <div className="space-y-1 pt-1 border-t border-white/10">
                                        <div className="text-[10px] font-bold text-rose-300 uppercase px-2">๘. ผู้ดูแลระบบ</div>
                                        <Link href={route('dashboard', { tab: 'admin_users' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>👤</span> จัดการผู้ใช้ & สิทธิ์
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'admin_strategies' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>🎯</span> จัดการยุทธศาสตร์
                                        </Link>
                                        <Link href={route('dashboard', { tab: 'admin_settings' })} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                            <span>🛠️</span> ตั้งค่าระบบ
                                        </Link>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-white/20">
                                    <Link href={route('profile.edit')} onClick={() => setShowingMobileMenu(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                                        <span>👤</span> ข้อมูลส่วนตัว
                                    </Link>
                                    <Link href={route('logout')} method="post" as="button" className="w-full flex items-center gap-2 p-2 rounded-lg text-rose-300 hover:bg-rose-500/20">
                                        <span>🚪</span> ออกจากระบบ
                                    </Link>
                                </div>
                            </div>
                            <div className="border-t border-white/20 pt-2 text-[11px] font-normal flex items-center gap-2 opacity-80">
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
