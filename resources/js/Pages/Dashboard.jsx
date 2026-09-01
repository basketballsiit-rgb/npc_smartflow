import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function Dashboard({ 
    role, 
    teacherData, 
    planHeadData, 
    procurementData, 
    executiveData,
    adminData,
    allProjectsMaster = [],
    allRoles = [],
    allDepartments = [],
    systemSettings = [],
    routinePlans = [],
    allUsers = [],
    centralAllocations = [],
    currentTab
}) {
    const { auth, flash } = usePage().props;

    // Routine budgets states
    const [editingRoutinePlan, setEditingRoutinePlan] = useState(null);
    const [selectedRoutinePlanForProc, setSelectedRoutinePlanForProc] = useState(null);
    const [viewingRoutineHistoryPlan, setViewingRoutineHistoryPlan] = useState(null);

    // Form for Creating / Editing Budget Plan
    const { data: routinePlanData, setData: setRoutinePlanData, post: postRoutinePlan, put: putRoutinePlan, reset: resetRoutinePlan, errors: routinePlanErrors } = useForm({
        fiscal_year: systemSettings.find(s => s.key === 'current_fiscal_year')?.value || '2569',
        department_id: allDepartments[0]?.id || '',
        title: '',
        allocated_amount: '',
        funding_source_id: '',
        report_category: '',
    });

    // Form for Direct Procurement request
    const [routineProcItems, setRoutineProcItems] = useState([
        { description: '', quantity: 1, unit: 'ชิ้น', unit_price: 0 }
    ]);
    const { data: routineProcData, setData: setRoutineProcData, post: postRoutineProc, reset: resetRoutineProc, errors: routineProcErrors } = useForm({
        procurement_id: null,
        memo_subject: '',
        tor_specifications: '',
        purchasing_chair: '',
        purchasing_member1: '',
        purchasing_member2: '',
        inspection_chair: '',
        inspection_member1: '',
        inspection_member2: '',
        items: []
    });

    // Central allocations states
    const [editingCentralAllocation, setEditingCentralAllocation] = useState(null);

    // Form for Central Allocation
    const { data: centralAllocationData, setData: setCentralAllocationData, post: postCentralAllocation, put: putCentralAllocation, reset: resetCentralAllocation, errors: centralAllocationErrors } = useForm({
        fiscal_year: systemSettings.find(s => s.key === 'current_fiscal_year')?.value || '2569',
        document_number: '',
        title: '',
        funding_source_id: '',
        amount: '',
        description: '',
    });

    // Direct Project Add & Allocate Modal (Admin & Planning Staff only)
    const [isDirectAllocateModalOpen, setIsDirectAllocateModalOpen] = useState(false);
    const { 
        data: directAllocateForm, 
        setData: setDirectAllocateForm, 
        post: postDirectAllocate, 
        reset: resetDirectAllocate, 
        processing: directAllocateProcessing, 
        errors: directAllocateErrors 
    } = useForm({
        title: '',
        academic_year: systemSettings.find(s => s.key === 'current_fiscal_year')?.value || '2569',
        department_id: allDepartments[0]?.id || '',
        proposed_budget: '',
        allocated_budget: '',
        funding_source_id: planHeadData?.fundingSources?.[0]?.id || '',
        report_category: '6.1',
        responsible_person: '',
        committee_comment: 'จัดสรรงบประมาณโดยตรงผ่านงานแผนงาน',
    });

    // Committee Allocation Modal
    const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
    const [selectedProjectForAllocation, setSelectedProjectForAllocation] = useState(null);
    const { 
        data: committeeForm, 
        setData: setCommitteeForm, 
        post: postCommitteeAllocation, 
        reset: resetCommitteeAllocation, 
        processing: committeeProcessing, 
        errors: committeeErrors 
    } = useForm({
        action: 'approve',
        allocated_budget: '',
        funding_source_id: planHeadData?.fundingSources?.[0]?.id || '',
        report_category: '6.1',
        committee_comment: 'คณะกรรมการอนุมัติจัดสรรงบประมาณเรียบร้อยแล้ว',
    });

    // Quick Preliminary Proposal Modal for Teachers / Proposers
    const [isQuickProposalModalOpen, setIsQuickProposalModalOpen] = useState(false);
    const {
        data: quickProposalForm,
        setData: setQuickProposalForm,
        post: postQuickProposal,
        reset: resetQuickProposal,
        processing: quickProposalProcessing,
        errors: quickProposalErrors
    } = useForm({
        title: '',
        academic_year: systemSettings.find(s => s.key === 'current_fiscal_year')?.value || '2569',
        proposed_budget: '',
        department_id: auth.user.department_id || (allDepartments[0]?.id || ''),
        responsible_person: auth.user.name || '',
        position: auth.user.position || 'ครูผู้สอน',
        phone: '',
        email: auth.user.email || '',
        background_rationale: '',
    });

    const isPlanStaff = auth.user.is_admin || role === 'admin' || role === 'plan_head' || auth.user.role?.name === 'plan_head' || auth.user.role?.name === 'admin' || (auth.user.department && (auth.user.department.name?.includes('แผน') || auth.user.department.code === 'PLAN'));

    useEffect(() => {
        if (flash?.error) {
            Swal.fire('ไม่สามารถดำเนินการได้', flash.error, 'error');
        }
        if (flash?.success) {
            Swal.fire('สำเร็จ', flash.success, 'success');
        }
    }, [flash]);

    const getDefaultTab = () => {
        if (currentTab) return currentTab;
        if (role === 'admin') return 'admin_users';
        if (role === 'teacher') return 'proposals';
        if (role === 'plan_head') return 'budgets';
        if (role === 'procurement_head') return 'procurement';
        if (role === 'executive') return 'executive_overview';
        return 'proposals';
    };

    const [activeTab, setActiveTab] = useState(getDefaultTab());

    // All Projects Master Tracking Filter States
    const [projectSearch, setProjectSearch] = useState('');
    const [projectStatusFilter, setProjectStatusFilter] = useState('all');
    const [projectYearFilter, setProjectYearFilter] = useState('all');
    const [projectDeptFilter, setProjectDeptFilter] = useState('all');

    useEffect(() => {
        if (currentTab) {
            setActiveTab(currentTab);
        }
    }, [currentTab]);

    // Admin User Modal State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        password: '',
        role_id: allRoles[0]?.id || 2,
        department_id: allDepartments[0]?.id || 1,
        position: '',
        is_active: true,
    });

    // Admin Settings State
    const initialSettingsObj = {};
    (systemSettings || []).forEach(s => {
        initialSettingsObj[s.key] = s.type === 'boolean' ? (s.value === 'true') : s.value;
    });
    const [settingsForm, setSettingsForm] = useState(initialSettingsObj);

    const getRoleTitle = (r) => {
        switch (r) {
            case 'admin': return 'ผู้ดูแลระบบสูงสุด (System Administrator)';
            case 'teacher': return 'อาจารย์ผู้เสนอโครงการ';
            case 'plan_head': return 'หัวหน้างานวางแผนและงบประมาณ';
            case 'procurement_head': return 'หัวหน้างานพัสดุ';
            case 'executive': return 'ผู้บริหาร / ผู้อำนวยการ';
            default: return r.toUpperCase();
        }
    };

    const openDirectAllocateModal = () => {
        resetDirectAllocate();
        setDirectAllocateForm({
            title: '',
            academic_year: systemSettings.find(s => s.key === 'current_fiscal_year')?.value || '2569',
            department_id: allDepartments[0]?.id || '',
            proposed_budget: '',
            allocated_budget: '',
            funding_source_id: planHeadData?.fundingSources?.[0]?.id || (planHeadData?.fundingChannelProgress?.[0]?.id || '1'),
            report_category: '6.1',
            responsible_person: '',
            committee_comment: 'จัดสรรงบประมาณโดยตรงผ่านงานแผนงาน',
        });
        setIsDirectAllocateModalOpen(true);
    };

    const handleDirectAllocateSubmit = (e) => {
        e.preventDefault();
        postDirectAllocate(route('projects.direct_allocate_store'), {
            onSuccess: () => {
                setIsDirectAllocateModalOpen(false);
                resetDirectAllocate();
                Swal.fire({
                    title: '🎉 เพิ่มโครงการและจัดสรรงบสำเร็จ!',
                    text: 'บันทึกโครงการและส่งยอดเข้างบประมาณและรายงานแผนปฏิบัติราชการเรียบร้อยแล้ว',
                    icon: 'success',
                    confirmButtonColor: '#7c3aed',
                });
            }
        });
    };

    const openCommitteeModal = (p) => {
        setSelectedProjectForAllocation(p);
        const defaultSource = p.funding_source_id || (p.budget?.funding_source_id || planHeadData?.fundingSources?.[0]?.id || '1');
        let defaultCat = p.report_category;
        if (!defaultCat) {
            if (p.department?.name?.includes('วิชาการ')) defaultCat = '6.1';
            else if (p.department?.name?.includes('พัฒนากิจการ') || p.department?.name?.includes('นักเรียน')) defaultCat = '6.2';
            else if (p.department?.name?.includes('บริหาร') || p.department?.name?.includes('พัสดุ') || p.department?.name?.includes('ทรัพยากร')) defaultCat = '6.3';
            else if (p.department?.name?.includes('แผน')) defaultCat = '6.4';
            else defaultCat = '6.1';
        }
        setCommitteeForm({
            action: 'approve',
            allocated_budget: p.allocated_budget || p.proposed_budget || p.estimated_budget || '',
            funding_source_id: defaultSource,
            report_category: defaultCat,
            committee_comment: p.committee_comment || 'คณะกรรมการอนุมัติจัดสรรงบประมาณเรียบร้อยแล้ว',
        });
        setIsCommitteeModalOpen(true);
    };

    const handleCommitteeSubmit = (e) => {
        e.preventDefault();
        if (!selectedProjectForAllocation) return;
        postCommitteeAllocation(route('projects.committee_allocate', selectedProjectForAllocation.id), {
            onSuccess: () => {
                setIsCommitteeModalOpen(false);
                setSelectedProjectForAllocation(null);
                Swal.fire({
                    title: '🎉 บันทึกมติจัดสรรงบประมาณสำเร็จ!',
                    text: 'ปรับปรุงสถานะและงบประมาณโครงการเรียบร้อยแล้ว',
                    icon: 'success',
                    confirmButtonColor: '#7c3aed',
                });
            }
        });
    };

    const openQuickProposalModal = () => {
        resetQuickProposal();
        setQuickProposalForm({
            title: '',
            academic_year: systemSettings.find(s => s.key === 'current_fiscal_year')?.value || '2569',
            proposed_budget: '',
            department_id: auth.user.department_id || (allDepartments[0]?.id || ''),
            responsible_person: auth.user.name || '',
            position: auth.user.position || 'ครูผู้สอน',
            phone: '',
            email: auth.user.email || '',
            background_rationale: '',
        });
        setIsQuickProposalModalOpen(true);
    };

    const handleQuickProposalSubmit = (e) => {
        e.preventDefault();
        postQuickProposal(route('projects.preliminary_store'), {
            onSuccess: () => {
                setIsQuickProposalModalOpen(false);
                resetQuickProposal();
                Swal.fire({
                    title: '🎉 เสนอโครงการสำเร็จ!',
                    text: 'บันทึกคำของบประมาณโครงการเบื้องต้นเรียบร้อยแล้ว รอการพิจารณาจัดสรรงบจากงานแผนงาน/คณะกรรมการ',
                    icon: 'success',
                    confirmButtonColor: '#7c3aed',
                });
            }
        });
    };

    const renderProjectProgressBar = (status, step) => {
        let percent = 0;
        let colorClass = 'from-slate-400 to-slate-500';
        let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
        let stepText = `ร่างโครงการ (Draft)`;

        if (status === 'preliminary') {
            percent = 5;
            colorClass = 'from-amber-400 to-amber-500';
            badgeColor = 'bg-amber-50 text-amber-900 border-amber-300';
            stepText = '🟡 เสนอตั้งงบ (รอจัดสรร)';
        } else if (status === 'budget_approved') {
            percent = 50;
            colorClass = 'from-emerald-400 to-teal-500';
            badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
            stepText = '🟢 อนุมัติงบแล้ว (พร้อมทำฉบับเต็ม)';
        } else if (status === 'budget_rejected') {
            percent = 0;
            colorClass = 'from-rose-500 to-rose-600';
            badgeColor = 'bg-rose-50 text-rose-800 border-rose-300';
            stepText = '❌ ไม่อนุมัติงบ (ยุติ)';
        } else if (status === 'approved' || step >= 6) {
            percent = 100;
            colorClass = 'from-emerald-400 via-emerald-500 to-teal-600';
            badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
            stepText = '✅ อนุมัติสมบูรณ์ (100%)';
        } else if (status === 'rejected') {
            percent = 0;
            colorClass = 'from-rose-500 to-red-600';
            badgeColor = 'bg-rose-50 text-rose-800 border-rose-300';
            stepText = '✕ ตีกลับแก้ไข';
        } else if (status === 'draft') {
            percent = 10;
            colorClass = 'from-slate-300 to-slate-400';
            badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
            stepText = '📝 แบบร่าง';
        } else {
            const currentStep = step || 1;
            percent = Math.round((currentStep / 6) * 100);
            if (currentStep === 1) {
                colorClass = 'from-purple-500 to-purple-600';
                badgeColor = 'bg-purple-50 text-purple-800 border-purple-300';
                stepText = 'ขั้นที่ 1: 📝 เสนอโครงการ (16%)';
            } else if (currentStep === 2) {
                colorClass = 'from-blue-500 to-indigo-600';
                badgeColor = 'bg-blue-50 text-blue-800 border-blue-300';
                stepText = 'ขั้นที่ 2: 👤 หัวหน้าแผนก (33%)';
            } else if (currentStep === 3) {
                colorClass = 'from-cyan-500 to-blue-600';
                badgeColor = 'bg-cyan-50 text-cyan-800 border-cyan-300';
                stepText = 'ขั้นที่ 3: 💰 งานวางแผน (50%)';
            } else if (currentStep === 4) {
                colorClass = 'from-violet-500 to-purple-600';
                badgeColor = 'bg-violet-50 text-violet-800 border-violet-300';
                stepText = 'ขั้นที่ 4: 📦 งานพัสดุ (66%)';
            } else if (currentStep === 5) {
                colorClass = 'from-amber-400 to-yellow-500';
                badgeColor = 'bg-amber-50 text-amber-900 border-amber-300';
                stepText = 'ขั้นที่ 5: 🏢 รองผู้อำนวยการ (83%)';
            }
        }

        return (
            <div className="w-full min-w-[160px] space-y-1.5 font-sans">
                <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className={`px-2 py-0.5 rounded-md border ${badgeColor} shadow-2xs`}>
                        {stepText}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">{percent}%</span>
                </div>
                {/* 6-Step Visual Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200 shadow-inner">
                    <div
                        className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
        );
    };

    const getStatusBadge = (status, step) => renderProjectProgressBar(status, step);

    // User Modal Open Handlers
    const openCreateUserModal = () => {
        setEditingUser(null);
        setUserForm({
            name: '',
            email: '',
            password: '',
            role_id: allRoles[0]?.id || 2,
            department_id: allDepartments[0]?.id || 1,
            position: 'ครูผู้สอน',
            is_active: true,
        });
        setIsUserModalOpen(true);
    };

    const openEditUserModal = (u) => {
        setEditingUser(u);
        setUserForm({
            name: u.name,
            email: u.email,
            password: '',
            role_id: u.role_id,
            department_id: u.department_id,
            position: u.position || '',
            is_active: u.is_active,
        });
        setIsUserModalOpen(true);
    };

    const handleSaveUserSubmit = (e) => {
        e.preventDefault();
        if (editingUser) {
            router.put(route('admin.users.update', editingUser.id), userForm, {
                onSuccess: () => {
                    setIsUserModalOpen(false);
                    Swal.fire({
                        title: 'อัปเดตผู้ใช้งานเรียบร้อย!',
                        text: `อัปเดตข้อมูลผู้ใช้ ${userForm.name} สำเร็จ`,
                        icon: 'success',
                        confirmButtonColor: '#7c3aed',
                    });
                },
            });
        } else {
            router.post(route('admin.users.store'), userForm, {
                onSuccess: () => {
                    setIsUserModalOpen(false);
                    Swal.fire({
                        title: 'เพิ่มผู้ใช้งานใหม่เรียบร้อย!',
                        text: `สร้างบัญชีสำหรับ ${userForm.name} สำเร็จ`,
                        icon: 'success',
                        confirmButtonColor: '#7c3aed',
                    });
                },
            });
        }
    };

    const handleToggleUserStatus = (u) => {
        Swal.fire({
            title: u.is_active ? 'ยืนยันการระงับสิทธิ์?' : 'ยืนยันการเปิดใช้งาน?',
            text: u.is_active ? `ต้องการระงับการใช้งานของ ${u.name} หรือไม่?` : `ต้องการเปิดสิทธิ์การใช้งานให้ ${u.name} หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: u.is_active ? '#e11d48' : '#10b981',
            cancelButtonText: 'ยกเลิก',
            confirmButtonText: u.is_active ? 'ระงับการใช้งาน' : 'เปิดใช้งาน',
        }).then((result) => {
            if (result.isConfirmed) {
                router.patch(route('admin.users.toggle', u.id), {}, {
                    onSuccess: () => {
                        Swal.fire('สำเร็จ!', 'อัปเดตสถานะสิทธิ์การใช้งานเรียบร้อยแล้ว', 'success');
                    },
                });
            }
        });
    };

    const handleDeleteUser = (u) => {
        Swal.fire({
            title: 'ยืนยันลบบัญชีผู้ใช้?',
            text: `ต้องการลบบัญชีผู้ใช้ ${u.name} ออกจากระบบอย่างถาวรหรือไม่?`,
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonText: 'ยกเลิก',
            confirmButtonText: 'ลบบัญชีผู้ใช้',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.users.delete', u.id), {
                    onSuccess: () => {
                        Swal.fire('ลบสำเร็จ!', 'ลบบัญชีผู้ใช้เรียบร้อยแล้ว', 'success');
                    },
                });
            }
        });
    };

    const handleSaveSettingsSubmit = (e) => {
        e.preventDefault();
        router.post(route('admin.settings.update'), { settings: settingsForm }, {
            onSuccess: () => {
                Swal.fire({
                    title: 'บันทึกการตั้งค่าเรียบร้อย!',
                    text: 'อัปเดตการตั้งค่าระบบและปีการศึกษาสำเร็จแล้ว',
                    icon: 'success',
                    confirmButtonColor: '#7c3aed',
                });
            },
        });
    };

    // Department Management Handlers
    const handleAddMainDivision = () => {
        Swal.fire({
            title: '🏛️ เพิ่มฝ่ายหลักใหม่',
            input: 'text',
            inputLabel: 'ชื่อฝ่ายหลัก *',
            inputPlaceholder: 'เช่น ฝ่ายบริหารจัดการ...',
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            inputValidator: (value) => {
                if (!value) return 'กรุณาระบุชื่อฝ่ายหลัก';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.departments.store'), { name: result.value, parent_id: null }, {
                    onSuccess: () => Swal.fire('สำเร็จ', 'เพิ่มฝ่ายหลักใหม่เรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleAddSubDepartment = (parentDept) => {
        Swal.fire({
            title: `➕ เพิ่มงานย่อย / แผนกวิชาในสังกัด`,
            html: `
                <div className="text-left space-y-2">
                    <p className="text-xs text-purple-700 font-bold">สังกัดฝ่ายหลัก: ${parentDept.name}</p>
                </div>
            `,
            input: 'text',
            inputLabel: 'ชื่อกลุ่มงานย่อย หรือ สาขาวิชา *',
            inputPlaceholder: 'เช่น งานสารบรรณ, สาขาวิชาการบัญชี...',
            showCancelButton: true,
            confirmButtonText: 'บันทึกงานย่อย',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            inputValidator: (value) => {
                if (!value) return 'กรุณาระบุชื่อกลุ่มงานย่อยหรือสาขาวิชา';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.departments.store'), {
                    name: result.value,
                    parent_id: parentDept.id
                }, {
                    onSuccess: () => Swal.fire('สำเร็จ', `เพิ่มงานย่อยใน ${parentDept.name} เรียบร้อยแล้ว`, 'success')
                });
            }
        });
    };

    const handleEditDepartment = (dept) => {
        Swal.fire({
            title: '✏️ แก้ไขข้อมูลฝ่าย / สังกัดแผนก',
            input: 'text',
            inputValue: dept.name,
            inputLabel: 'ชื่อฝ่าย หรือ สังกัดแผนกวิชา *',
            showCancelButton: true,
            confirmButtonText: 'บันทึกการแก้ไข',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            inputValidator: (value) => {
                if (!value) return 'กรุณาระบุชื่อฝ่ายหรือสังกัดแผนก';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(route('admin.departments.update', dept.id), { name: result.value }, {
                    onSuccess: () => Swal.fire('สำเร็จ', 'อัปเดตข้อมูลฝ่าย/สังกัดแผนกเรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleDeleteDepartment = (dept) => {
        Swal.fire({
            title: 'ยืนยันการลบฝ่าย/สังกัดแผนก?',
            text: `ต้องการลบ "${dept.name}" หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: '🗑️ ยืนยันลบข้อมูล',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.departments.delete', dept.id), {
                    onSuccess: () => Swal.fire('ลบสำเร็จ', 'ลบข้อมูลฝ่าย/สังกัดแผนกเรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    // Strategy Handlers
    const handleAddIqaStrategy = () => {
        Swal.fire({
            title: '➕ เพิ่มยุทธศาสตร์ประกันคุณภาพ (IQA)',
            input: 'text',
            inputLabel: 'ชื่อยุทธศาสตร์ IQA',
            inputPlaceholder: 'เช่น IQA 6: การยกระดับนวัตกรรมประกันคุณภาพ...',
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            inputValidator: (value) => {
                if (!value) return 'กรุณาระบุชื่อยุทธศาสตร์';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.iqa.store'), { name: result.value }, {
                    onSuccess: () => Swal.fire('สำเร็จ', 'เพิ่มยุทธศาสตร์ IQA เรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleEditIqaStrategy = (strat) => {
        Swal.fire({
            title: '✏️ แก้ไขยุทธศาสตร์ IQA',
            input: 'text',
            inputValue: strat.name,
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            inputValidator: (value) => {
                if (!value) return 'กรุณาระบุชื่อยุทธศาสตร์';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(route('admin.iqa.update', strat.id), { name: result.value }, {
                    onSuccess: () => Swal.fire('สำเร็จ', 'อัปเดตยุทธศาสตร์ IQA เรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleDeleteIqaStrategy = (strat) => {
        Swal.fire({
            title: 'ยืนยันการลบยุทธศาสตร์ IQA?',
            text: `ต้องการลบ "${strat.name}" หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonText: 'ยกเลิก',
            confirmButtonText: 'ลบข้อมูล'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.iqa.delete', strat.id), {
                    onSuccess: () => Swal.fire('ลบสำเร็จ', 'ลบยุทธศาสตร์ IQA เรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleAddOvecStrategy = () => {
        Swal.fire({
            title: '➕ เพิ่มยุทธศาสตร์ สอศ. (OVEC)',
            input: 'text',
            inputLabel: 'ชื่อยุทธศาสตร์ สอศ.',
            inputPlaceholder: 'เช่น OVEC 6: การเสริมสร้างศักยภาพผู้เรียนยุตดิจิทัล...',
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            inputValidator: (value) => {
                if (!value) return 'กรุณาระบุชื่อยุทธศาสตร์';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.ovec.store'), { name: result.value }, {
                    onSuccess: () => Swal.fire('สำเร็จ', 'เพิ่มยุทธศาสตร์ สอศ. เรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleEditOvecStrategy = (strat) => {
        Swal.fire({
            title: '✏️ แก้ไขยุทธศาสตร์ สอศ.',
            input: 'text',
            inputValue: strat.name,
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            inputValidator: (value) => {
                if (!value) return 'กรุณาระบุชื่อยุทธศาสตร์';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(route('admin.ovec.update', strat.id), { name: result.value }, {
                    onSuccess: () => Swal.fire('สำเร็จ', 'อัปเดตยุทธศาสตร์ สอศ. เรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleDeleteOvecStrategy = (strat) => {
        Swal.fire({
            title: 'ยืนยันการลบยุทธศาสตร์ สอศ.?',
            text: `ต้องการลบ "${strat.name}" หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonText: 'ยกเลิก',
            confirmButtonText: 'ลบข้อมูล'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.ovec.delete', strat.id), {
                    onSuccess: () => Swal.fire('ลบสำเร็จ', 'ลบยุทธศาสตร์ สอศ. เรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    // National Strategy Handlers
    const handleAddNationalStrategy = () => {
        Swal.fire({
            title: '➕ เพิ่มยุทธศาสตร์ชาติ 20 ปี',
            input: 'text',
            inputLabel: 'ชื่อยุทธศาสตร์ชาติ',
            inputPlaceholder: 'เช่น ยุทธศาสตร์ชาติ ด้านการสร้างโอกาสและความเสมอภาคทางสังคม',
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            inputValidator: (value) => {
                if (!value) return 'กรุณาระบุชื่อยุทธศาสตร์';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.national.store'), { name: result.value }, {
                    onSuccess: () => Swal.fire('สำเร็จ', 'เพิ่มยุทธศาสตร์ชาติเรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleEditNationalStrategy = (strat) => {
        Swal.fire({
            title: '✏️ แก้ไขยุทธศาสตร์ชาติ',
            input: 'text',
            inputValue: strat.name,
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            inputValidator: (value) => {
                if (!value) return 'กรุณาระบุชื่อยุทธศาสตร์';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(route('admin.national.update', strat.id), { name: result.value }, {
                    onSuccess: () => Swal.fire('สำเร็จ', 'อัปเดตยุทธศาสตร์ชาติเรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleDeleteNationalStrategy = (strat) => {
        Swal.fire({
            title: 'ยืนยันการลบยุทธศาสตร์ชาติ?',
            text: `ต้องการลบ "${strat.name}" หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonText: 'ยกเลิก',
            confirmButtonText: 'ลบข้อมูล'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.national.delete', strat.id), {
                    onSuccess: () => Swal.fire('ลบสำเร็จ', 'ลบยุทธศาสตร์ชาติเรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    // Provincial Strategy Handlers
    const handleAddProvincialStrategy = () => {
        Swal.fire({
            title: '➕ เพิ่มยุทธศาสตร์การพัฒนาจังหวัด',
            input: 'text',
            inputLabel: 'ชื่อยุทธศาสตร์จังหวัด',
            inputPlaceholder: 'เช่น ยุทธศาสตร์จังหวัดน่าน ด้านการส่งเสริมเกษตรปลอดภัย...',
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            inputValidator: (value) => {
                if (!value) return 'กรุณาระบุชื่อยุทธศาสตร์';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.provincial.store'), { name: result.value }, {
                    onSuccess: () => Swal.fire('สำเร็จ', 'เพิ่มยุทธศาสตร์จังหวัดเรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleEditProvincialStrategy = (strat) => {
        Swal.fire({
            title: '✏️ แก้ไขยุทธศาสตร์จังหวัด',
            input: 'text',
            inputValue: strat.name,
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            inputValidator: (value) => {
                if (!value) return 'กรุณาระบุชื่อยุทธศาสตร์';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(route('admin.provincial.update', strat.id), { name: result.value }, {
                    onSuccess: () => Swal.fire('สำเร็จ', 'อัปเดตยุทธศาสตร์จังหวัดเรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleDeleteProvincialStrategy = (strat) => {
        Swal.fire({
            title: 'ยืนยันการลบยุทธศาสตร์จังหวัด?',
            text: `ต้องการลบ "${strat.name}" หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonText: 'ยกเลิก',
            confirmButtonText: 'ลบข้อมูล'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.provincial.delete', strat.id), {
                    onSuccess: () => Swal.fire('ลบสำเร็จ', 'ลบยุทธศาสตร์จังหวัดเรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleResubmitProject = (project) => {
        Swal.fire({
            title: '🚀 ยื่นเสนอขออนุมัติเพื่อดำเนินงานต่อ?',
            text: `ต้องการยื่นเสนอขออนุมัติโครงการ "${project.title}" ให้คณะกรรมการและฝ่ายบริหารอนุมัติต่อไปหรือไม่?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: '🚀 ยืนยันยื่นเสนอขออนุมัติ',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('projects.submit', project.id), {}, {
                    onSuccess: () => Swal.fire('สำเร็จ!', 'ยื่นเสนอขออนุมัติโครงการเพื่อดำเนินงานต่อเรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleAdminApproveProject = (project, mode) => {
        const title = mode === 'full' 
            ? `👑 อนุมัติรวดเดียวสมบูรณ์ทั้ง 6 ขั้นตอนสำหรับ "${project.title}"?`
            : `⚡ อนุมัติขั้นตอนที่ ${project.current_approval_step || 1} ทันทีสำหรับ "${project.title}"?`;

        Swal.fire({
            title: title,
            text: mode === 'full' 
                ? 'ระบบจะอนุมัติโครงการนี้จนเสร็จสิ้นสมบูรณ์ (Approved) และผูกงบประมาณอัตโนมัติ'
                : 'ระบบจะอนุมัติผ่านขั้นตอนปัจจุบันและส่งต่อเข้าสู่ขั้นตอนอนุมัติถัดไปทันที',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: mode === 'full' ? '#10b981' : '#f59e0b',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ยืนยันอนุมัติ',
            cancelButtonText: 'ยกเลิก',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('projects.admin_approve', project.id), { mode: mode }, {
                    onSuccess: () => Swal.fire('สำเร็จ!', 'การอนุมัติลัดโดยผู้ดูแลระบบเสร็จสิ้นเรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleDeleteProject = (project) => {
        Swal.fire({
            title: 'ยืนยันการลบโครงการ?',
            text: `ต้องการลบโครงการ "${project.title}" หรือไม่? ข้อมูลที่ลบจะไม่สามารถกู้คืนได้`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: '🗑️ ยืนยันลบโครงการ',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('projects.destroy', project.id), {
                    onSuccess: () => Swal.fire('ลบสำเร็จ', 'ลบโครงการเรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    // 0. Admin Component Rendering (User Management)
    const renderAdminUsersTab = () => {
        if (!adminData) return null;
        return (
            <div className="space-y-6">
                {/* Admin Stat Overview */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600">ผู้ใช้งานทั้งหมด</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">{adminData.stats.totalUsers} คน</p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">สิทธิ์ปกติ (Active)</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">{adminData.stats.activeUsers} คน</p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-600">ระงับการใช้งาน</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">{adminData.stats.suspendedUsers} คน</p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">ฝ่าย / แผนกวิชา</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">{adminData.stats.totalDepartments} ฝ่าย</p>
                    </div>
                </div>

                {/* Users Table Header */}
                <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
                    <div className="border-b border-purple-100 bg-purple-50/50 px-6 py-4 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">จัดการบุคลากร ผู้ใช้งาน และสิทธิ์ระบบ</h3>
                            <p className="text-xs text-slate-600">กำหนดชื่อ ตำแหน่งงาน สิทธิ์การใช้งาน และสถานะเปิด/ปิดสิทธิ์</p>
                        </div>
                        <button
                            onClick={openCreateUserModal}
                            className="inline-flex items-center rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-purple-700 transition-all hover:scale-105"
                        >
                            + เพิ่มผู้ใช้งานใหม่
                        </button>
                    </div>

                    <div className="w-full overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                                <tr className="border-b border-purple-100 bg-purple-50/50 text-xs font-bold uppercase text-purple-900 whitespace-nowrap">
                                    <th className="px-6 py-3.5 whitespace-nowrap">ชื่อ - นามสกุล</th>
                                    <th className="px-6 py-3.5 whitespace-nowrap">อีเมล (Email)</th>
                                    <th className="px-6 py-3.5 text-center whitespace-nowrap">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-100 text-sm">
                                {adminData.users.map((u) => (
                                    <tr key={u.id} className="hover:bg-purple-50/20 whitespace-nowrap">
                                        <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{u.name}</td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-xs whitespace-nowrap">{u.email}</td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => openEditUserModal(u)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs border border-purple-200 hover:scale-105 whitespace-nowrap"
                                                    title="คลิกเพื่อเปิดดูและแก้ไขข้อมูลย่อยทั้งหมด (สังกัด, ตำแหน่ง, สิทธิ์)"
                                                >
                                                    ✏️ แก้ไขข้อมูล
                                                </button>
                                                <button
                                                    onClick={() => handleToggleUserStatus(u)}
                                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all border text-xs shadow-2xs hover:scale-110 active:scale-95 ${
                                                        u.is_active 
                                                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300' 
                                                            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300'
                                                    }`}
                                                    title={u.is_active ? 'ระงับการใช้งาน' : 'เปิดใช้งาน'}
                                                >
                                                    {u.is_active ? '🚫' : '⚡'}
                                                </button>
                                                {u.id !== auth.user.id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(u)}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 transition-all border border-rose-200 text-xs shadow-2xs hover:scale-110 active:scale-95"
                                                        title="ลบผู้ใช้งาน"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Department & Division Management Table */}
                <div className="space-y-6 mt-8">
                    <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-purple-100 shadow-sm">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">จัดการโครงสร้าง ๔ ฝ่ายหลัก และงานย่อยในสังกัด</h3>
                            <p className="text-xs text-slate-600">ตั้งค่าชื่อฝ่ายหลัก และเพิ่ม/แก้ไขกลุ่มงานย่อย สาขาวิชาในสังกัด เพื่อใช้เลือกในข้อมูลบุคลากรและโครงการ</p>
                        </div>
                        <button
                            onClick={handleAddMainDivision}
                            className="inline-flex items-center rounded-xl bg-purple-900 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-purple-950 transition-all hover:scale-105"
                        >
                            + เพิ่มฝ่ายหลักใหม่
                        </button>
                    </div>

                    {allDepartments.filter(d => !d.parent_id).map((mainDept, idx) => {
                        const subDepts = allDepartments.filter(d => d.parent_id === mainDept.id);
                        const totalUsersInMain = adminData.users.filter(u => u.department_id === mainDept.id || subDepts.some(s => s.id === u.department_id)).length;

                        return (
                            <div key={mainDept.id} className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
                                {/* Main Division Bar */}
                                <div className="border-b border-purple-100 bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-950 px-6 py-3.5 flex justify-between items-center text-white">
                                    <div className="flex items-center gap-x-3">
                                        <span className="text-lg">🏛️</span>
                                        <div>
                                            <h4 className="font-bold text-base">{idx + 1}. {mainDept.name}</h4>
                                            <p className="text-xs text-purple-200">บุคลากรในสังกัดรวม: {totalUsersInMain} คน | งานย่อย: {subDepts.length} งาน</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleAddSubDepartment(mainDept)}
                                            className="inline-flex items-center gap-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-purple-950 px-3 py-1.5 text-xs font-bold transition-all shadow-xs"
                                        >
                                            + เพิ่มงานย่อยในฝ่ายนี้
                                        </button>
                                        <button
                                            onClick={() => handleEditDepartment(mainDept)}
                                            className="inline-flex items-center gap-1 rounded-xl bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 text-xs font-bold transition-all border border-white/30"
                                        >
                                            ✏️ แก้ไขชื่อฝ่าย
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDepartment(mainDept)}
                                            className="inline-flex items-center gap-1 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white px-3 py-1.5 text-xs font-bold transition-all"
                                        >
                                            🗑️ ลบฝ่าย
                                        </button>
                                    </div>
                                </div>

                                {/* Sub-departments Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-purple-100 bg-purple-50/40 text-xs font-bold uppercase text-purple-900">
                                                <th className="px-6 py-2.5 w-16">ลำดับ</th>
                                                <th className="px-6 py-2.5">กลุ่มงานย่อย / สาขาวิชาในสังกัด</th>
                                                <th className="px-6 py-2.5">จำนวนบุคลากร</th>
                                                <th className="px-6 py-2.5 text-right">การจัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-purple-100 text-sm">
                                            {subDepts.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-4 text-center text-xs text-slate-400">
                                                        ยังไม่มีงานย่อยในฝ่ายนี้ (คลิกปุ่ม "+ เพิ่มงานย่อยในฝ่ายนี้" เพื่อเริ่มเพิ่มงานย่อย)
                                                    </td>
                                                </tr>
                                            ) : (
                                                subDepts.map((sub, sIdx) => (
                                                    <tr key={sub.id} className="hover:bg-purple-50/20">
                                                        <td className="px-6 py-3 font-bold text-slate-400 text-xs">{idx + 1}.{sIdx + 1}</td>
                                                        <td className="px-6 py-3 font-medium text-slate-900 flex items-center gap-2">
                                                            <span className="text-purple-400 font-mono">└─</span>
                                                            <span>{sub.name}</span>
                                                        </td>
                                                        <td className="px-6 py-3 text-slate-700 font-semibold">
                                                            {adminData.users.filter(u => u.department_id === sub.id).length} คน
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleEditDepartment(sub)}
                                                                    className="inline-flex items-center gap-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 px-2.5 py-1 text-xs font-bold border border-purple-200"
                                                                >
                                                                    ✏️ แก้ไข
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteDepartment(sub)}
                                                                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1 text-xs font-bold border border-rose-200"
                                                                >
                                                                    🗑️ ลบ
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* User Modal */}
                {isUserModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-purple-100 space-y-5">
                            <div className="flex justify-between items-center border-b border-purple-100 pb-3">
                                <h3 className="text-lg font-bold text-slate-900">
                                    {editingUser ? `✏️ แก้ไขข้อมูลผู้ใช้: ${editingUser.name}` : '➕ เพิ่มผู้ใช้งานใหม่เข้าสู่ระบบ'}
                                </h3>
                                <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                            </div>

                            <form onSubmit={handleSaveUserSubmit} className="space-y-4 text-xs font-bold text-slate-700">
                                <div>
                                    <label className="block mb-1">ชื่อ - นามสกุล *</label>
                                    <input
                                        type="text"
                                        required
                                        value={userForm.name}
                                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                        placeholder="เช่น นายสมชาย สายใจ"
                                    />
                                </div>

                                <div>
                                    <label className="block mb-1">อีเมล (Email) *</label>
                                    <input
                                        type="email"
                                        required
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                        placeholder="example@smartflow.local"
                                    />
                                </div>

                                <div>
                                    <label className="block mb-1">รหัสผ่าน {editingUser && '(ระบุหากต้องการเปลี่ยน)'} *</label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        value={userForm.password}
                                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-1">สิทธิ์การใช้งาน (Role) *</label>
                                        <select
                                            value={userForm.role_id}
                                            onChange={(e) => setUserForm({ ...userForm, role_id: Number(e.target.value) })}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                        >
                                            {allRoles.map(r => (
                                                <option key={r.id} value={r.id}>{r.display_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block mb-1">ฝ่าย / สังกัดแผนก *</label>
                                        <select
                                            value={userForm.department_id}
                                            onChange={(e) => setUserForm({ ...userForm, department_id: Number(e.target.value) })}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                        >
                                            {allDepartments.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block mb-1">ตำแหน่งงาน (Position)</label>
                                    <input
                                        type="text"
                                        value={userForm.position}
                                        onChange={(e) => setUserForm({ ...userForm, position: e.target.value })}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                        placeholder="เช่น ครู ชำนาญการ, หัวหน้างานวางแผน"
                                    />
                                </div>

                                <div className="flex items-center gap-x-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="is_active_chk"
                                        checked={userForm.is_active}
                                        onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                                        className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                                    />
                                    <label htmlFor="is_active_chk" className="text-sm cursor-pointer">เปิดสิทธิ์การใช้งานในระบบ (Active)</label>
                                </div>

                                <div className="flex justify-end gap-x-3 pt-4 border-t border-purple-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsUserModalOpen(false)}
                                        className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        className="rounded-xl bg-purple-600 px-6 py-2 text-sm font-bold text-white shadow-md hover:bg-purple-700"
                                    >
                                        บันทึกข้อมูลผู้ใช้
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // 0. Admin System Settings Component
    const renderAdminSettingsTab = () => {
        return (
            <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm p-6">
                    <div className="border-b border-purple-100 pb-4 mb-6">
                        <h3 className="text-lg font-bold text-slate-900">🛠️ การตั้งค่าระบบ สารสนเทศ และพารามิเตอร์</h3>
                        <p className="text-xs text-slate-600">กำหนดข้อมูลสถานศึกษา ปีงบประมาณ ปีการศึกษา ประกาศข่าวสาร และเปิด/ปิดฟีเจอร์การทำงานของระบบ</p>
                    </div>

                    <form onSubmit={handleSaveSettingsSubmit} className="space-y-6">
                        {/* General Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-purple-900 border-l-4 border-purple-600 pl-3">ข้อมูลสถานศึกษา</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อสถานศึกษา (ภาษาไทย)</label>
                                    <input
                                        type="text"
                                        value={settingsForm.college_name_th || ''}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, college_name_th: e.target.value })}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อสถานศึกษา (ภาษาอังกฤษ)</label>
                                    <input
                                        type="text"
                                        value={settingsForm.college_name_en || ''}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, college_name_en: e.target.value })}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Academic & Fiscal Year Config */}
                        <div className="space-y-4 border-t border-purple-100 pt-6">
                            <h4 className="text-sm font-bold text-purple-900 border-l-4 border-purple-600 pl-3">การตั้งค่าปีงบประมาณ ไตรมาส ปีการศึกษา และภาคเรียน</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">ปีงบประมาณปัจจุบัน (Fiscal Year)</label>
                                    <input
                                        type="text"
                                        value={settingsForm.current_fiscal_year || settingsForm.current_academic_year || '2569'}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, current_fiscal_year: e.target.value })}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500 font-semibold text-purple-950"
                                        placeholder="เช่น 2569"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">ไตรมาสงบประมาณ (Current Quarter)</label>
                                    <select
                                        value={settingsForm.current_quarter || 'auto'}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, current_quarter: e.target.value })}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500 font-semibold text-purple-950"
                                    >
                                        <option value="auto">⚡ ปรับอัตโนมัติตามเดือนปัจจุบัน (Auto Detect)</option>
                                        <option value="1">ไตรมาสที่ 1 (ต.ค. - ธ.ค.)</option>
                                        <option value="2">ไตรมาสที่ 2 (ม.ค. - มี.ค.)</option>
                                        <option value="3">ไตรมาสที่ 3 (เม.ย. - มิ.ย.)</option>
                                        <option value="4">ไตรมาสที่ 4 (ก.ค. - ก.ย.)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">ปีการศึกษาปัจจุบัน (Academic Year)</label>
                                    <input
                                        type="text"
                                        value={settingsForm.current_academic_year || ''}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, current_academic_year: e.target.value })}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500 font-semibold text-purple-950"
                                        placeholder="เช่น 2569"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">ภาคเรียนปัจจุบัน (Current Semester)</label>
                                    <select
                                        value={settingsForm.current_semester || '1'}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, current_semester: e.target.value })}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500 font-semibold text-purple-950"
                                    >
                                        <option value="1">ภาคเรียนที่ 1</option>
                                        <option value="2">ภาคเรียนที่ 2</option>
                                        <option value="3">ภาคเรียนที่ 3 (ฤดูร้อน)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Fiscal Quarters Standard Info Card */}
                            <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 space-y-3">
                                <span className="font-bold text-purple-900 block text-xs flex items-center gap-1.5">
                                    <span>🏛️</span> รอบระยะเวลาไตรมาสงบประมาณแผ่นดิน (Fiscal Quarters Reference Guide):
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div className="bg-white p-3 rounded-xl border border-purple-200/80 shadow-2xs">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-extrabold text-purple-950 text-xs">ไตรมาสที่ 1 (Q1)</span>
                                            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-md font-bold">ต.ค. - ธ.ค.</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 font-medium">ตุลาคม – ธันวาคม</p>
                                        <p className="text-[10px] text-slate-500 mt-1">อนุมัติโครงการ & จัดสรรงบประมาณ</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-blue-200/80 shadow-2xs">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-extrabold text-blue-950 text-xs">ไตรมาสที่ 2 (Q2)</span>
                                            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md font-bold">ม.ค. - มี.ค.</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 font-medium">มกราคม – มีนาคม</p>
                                        <p className="text-[10px] text-slate-500 mt-1">เริ่มจัดซื้อจัดจ้าง & ดำเนินงาน</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-extrabold text-amber-950 text-xs">ไตรมาสที่ 3 (Q3)</span>
                                            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md font-bold">เม.ย. - มิ.ย.</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 font-medium">เมษายน – มิถุนายน</p>
                                        <p className="text-[10px] text-slate-500 mt-1">ดำเนินโครงการ & ติดตามประเมินผล</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-2xs">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-extrabold text-emerald-950 text-xs">ไตรมาสที่ 4 (Q4)</span>
                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">ก.ค. - ก.ย.</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 font-medium">กรกฎาคม – กันยายน</p>
                                        <p className="text-[10px] text-slate-500 mt-1">เบิกจ่ายงบประมาณ & สรุปผล</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Announcement */}
                        <div className="space-y-4 border-t border-purple-100 pt-6">
                            <h4 className="text-sm font-bold text-purple-900 border-l-4 border-purple-600 pl-3">ประกาศข่าวสารประจำวัน</h4>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">ข้อความประกาศแจ้งเตือนหน้าระบบ</label>
                                <textarea
                                    rows="3"
                                    value={settingsForm.system_announcement || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, system_announcement: e.target.value })}
                                    className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                ></textarea>
                            </div>
                        </div>

                        {/* Feature Toggles */}
                        <div className="space-y-4 border-t border-purple-100 pt-6">
                            <h4 className="text-sm font-bold text-purple-900 border-l-4 border-purple-600 pl-3">สวิตช์ควบคุมฟีเจอร์</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center justify-between rounded-xl bg-purple-50/50 p-4 border border-purple-100">
                                    <div>
                                        <span className="text-sm font-bold text-slate-900 block">เปิดรับข้อเสนอโครงการใหม่</span>
                                        <span className="text-xs text-slate-500">อนุญาตให้อาจารย์สร้างและส่งข้อเสนอโครงการใหม่</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settingsForm.allow_new_projects === true || settingsForm.allow_new_projects === 'true'}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, allow_new_projects: e.target.checked })}
                                        className="h-5 w-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-xl bg-purple-50/50 p-4 border border-purple-100">
                                    <div>
                                        <span className="text-sm font-bold text-slate-900 block">เปิดใช้งาน AI Gemini</span>
                                        <span className="text-xs text-slate-500">เปิดระบบประมวลผลคำแนะนำพัฒนาโครงการอัตโนมัติ</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settingsForm.enable_ai_recommendations === true || settingsForm.enable_ai_recommendations === 'true'}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, enable_ai_recommendations: e.target.checked })}
                                        className="h-5 w-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-purple-100 flex justify-end">
                            <button
                                type="submit"
                                className="rounded-xl bg-purple-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all hover:scale-105"
                            >
                                💾 บันทึกการตั้งค่าระบบทั้งหมด
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // Dynamic Strategy Category Handlers
    const handleAddCategory = () => {
        Swal.fire({
            title: '➕ เพิ่มหมวดหมู่อยุทธศาสตร์ใหม่',
            html: `
                <div className="space-y-3 text-left">
                    <label className="block text-xs font-bold text-slate-700">ชื่อหมวดหมู่อยุทธศาสตร์ *</label>
                    <input id="swal-cat-name" class="swal2-input text-sm" placeholder="เช่น ยุทธศาสตร์กระทรวงศึกษาธิการ / SDGs" style="margin: 0; width: 100%;">
                    <label className="block text-xs font-bold text-slate-700 mt-2">คำอธิบายเพิ่มเติม</label>
                    <input id="swal-cat-desc" class="swal2-input text-sm" placeholder="เช่น ตัวเลือกสอดคล้องเป้าหมาย..." style="margin: 0; width: 100%;">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'บันทึกหมวดใหม่',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            preConfirm: () => {
                const name = document.getElementById('swal-cat-name').value;
                const desc = document.getElementById('swal-cat-desc').value;
                if (!name) {
                    Swal.showValidationMessage('กรุณาระบุชื่อหมวดหมู่อยุทธศาสตร์');
                    return false;
                }
                return { name, description: desc };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.categories.store'), result.value, {
                    onSuccess: () => Swal.fire('สำเร็จ', 'เพิ่มหมวดหมู่อยุทธศาสตร์ใหม่เรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleEditCategory = (cat) => {
        Swal.fire({
            title: '✏️ แก้ไขหมวดหมู่อยุทธศาสตร์',
            html: `
                <div className="space-y-3 text-left">
                    <label className="block text-xs font-bold text-slate-700">ชื่อหมวดหมู่อยุทธศาสตร์ *</label>
                    <input id="swal-edit-cat-name" class="swal2-input text-sm" value="${cat.name}" placeholder="ชื่อหมวดหมู่อยุทธศาสตร์" style="margin: 0; width: 100%;">
                    <label className="block text-xs font-bold text-slate-700 mt-2">คำอธิบายเพิ่มเติม</label>
                    <input id="swal-edit-cat-desc" class="swal2-input text-sm" value="${cat.description || ''}" placeholder="คำอธิบายเพิ่มเติม" style="margin: 0; width: 100%;">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'บันทึกการแก้ไข',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            preConfirm: () => {
                const name = document.getElementById('swal-edit-cat-name').value;
                const desc = document.getElementById('swal-edit-cat-desc').value;
                if (!name) {
                    Swal.showValidationMessage('กรุณาระบุชื่อหมวดหมู่อยุทธศาสตร์');
                    return false;
                }
                return { name, description: desc };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(route('admin.categories.update', cat.id), result.value, {
                    onSuccess: () => Swal.fire('สำเร็จ', 'อัปเดตชื่อหมวดหมู่เรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleToggleCategoryActive = (cat) => {
        const actionText = cat.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน';
        Swal.fire({
            title: `ยืนยันการ${actionText}หมวดหมู่?`,
            text: `ต้องการ${actionText} "${cat.name}" หรือไม่? ${cat.is_active ? '(หมวดที่ปิดใช้งานจะไม่ปรากฏในแบบเสนอโครงการ)' : '(หมวดที่เปิดใช้งานจะไปแสดงในแบบเสนอโครงการให้เลือกทันที)'}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: cat.is_active ? '#e11d48' : '#16a34a',
            cancelButtonText: 'ยกเลิก',
            confirmButtonText: actionText,
        }).then((result) => {
            if (result.isConfirmed) {
                router.patch(route('admin.categories.toggle', cat.id), {}, {
                    onSuccess: () => Swal.fire('สำเร็จ', `เปลี่ยนสถานะเป็น${actionText}เรียบร้อยแล้ว`, 'success')
                });
            }
        });
    };

    const handleDeleteCategory = (cat) => {
        Swal.fire({
            title: 'ยืนยันการลบหมวดหมู่อยุทธศาสตร์?',
            text: `ต้องการลบหมวดหมู่ "${cat.name}" และหัวข้อย่อยทั้งหมดหรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonText: 'ยกเลิก',
            confirmButtonText: 'ลบหมวดหมู่'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.categories.delete', cat.id), {
                    onSuccess: () => Swal.fire('ลบสำเร็จ', 'ลบหมวดหมู่อยุทธศาสตร์เรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleAddStrategyItem = (catId) => {
        Swal.fire({
            title: '➕ เพิ่มตัวเลือกยุทธศาสตร์',
            input: 'text',
            inputPlaceholder: 'ระบุหัวข้อยุทธศาสตร์ย่อย...',
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            inputValidator: (value) => {
                if (!value) return 'กรุณาระบุหัวข้อยุทธศาสตร์';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.items.store'), {
                    strategy_category_id: catId,
                    name: result.value,
                }, {
                    onSuccess: () => Swal.fire('สำเร็จ', 'เพิ่มตัวเลือกยุทธศาสตร์เรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleEditStrategyItem = (item) => {
        Swal.fire({
            title: '✏️ แก้ไขตัวเลือกยุทธศาสตร์',
            input: 'text',
            inputValue: item.name,
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            inputValidator: (value) => {
                if (!value) return 'กรุณาระบุหัวข้อยุทธศาสตร์';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(route('admin.items.update', item.id), { name: result.value }, {
                    onSuccess: () => Swal.fire('สำเร็จ', 'อัปเดตตัวเลือกยุทธศาสตร์เรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const handleDeleteStrategyItem = (item) => {
        Swal.fire({
            title: 'ยืนยันการลบยุทธศาสตร์?',
            text: `ต้องการลบ "${item.name}" หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonText: 'ยกเลิก',
            confirmButtonText: 'ลบข้อมูล'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.items.delete', item.id), {
                    onSuccess: () => Swal.fire('ลบสำเร็จ', 'ลบตัวเลือกยุทธศาสตร์เรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    // 0. Admin Strategy Management Component
    const renderAdminStrategiesTab = () => {
        if (!adminData) return null;
        const categories = adminData.strategyCategories || [];

        return (
            <div className="space-y-6 font-sans">
                {/* Header Action Bar */}
                <div className="flex justify-between items-center bg-purple-50/70 p-4 rounded-2xl border border-purple-100">
                    <div>
                        <h3 className="text-base font-bold text-purple-950">🎯 ระบบบริหารจัดการหมวดหมู่อยุทธศาสตร์การพัฒนา</h3>
                        <p className="text-xs text-slate-600">สามารถเพิ่มหมวดหมู่ใหม่ แก้ไขชื่อ เปิด/ปิดการใช้งาน หรือลบหมวดหมู่ยุทธศาสตร์ได้อย่างอิสระ</p>
                    </div>
                    <button
                        onClick={handleAddCategory}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:scale-105 transition-all"
                    >
                        ➕ เพิ่มหมวดหมู่อยุทธศาสตร์ใหม่
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categories.map((cat, catIdx) => (
                        <div key={cat.id} className={`overflow-hidden rounded-2xl border transition-all ${
                            cat.is_active
                                ? 'border-purple-100 bg-white shadow-sm'
                                : 'border-slate-200 bg-slate-50/70 opacity-75'
                        }`}>
                            {/* Category Header */}
                            <div className="border-b border-purple-100 bg-purple-50/50 px-6 py-4 flex justify-between items-start gap-x-2">
                                <div>
                                    <div className="flex items-center gap-x-2">
                                        <h3 className="text-base font-bold text-slate-900">{catIdx + 1}. {cat.name}</h3>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            cat.is_active
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                                        }`}>
                                            {cat.is_active ? '🟢 เปิดใช้งาน' : '🔴 ปิดใช้งาน'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{cat.description || 'ตัวเลือกยุทธศาสตร์ประจำระบบ'}</p>
                                </div>
                                <div className="flex gap-x-1.5 flex-wrap justify-end">
                                    <button
                                        onClick={() => handleToggleCategoryActive(cat)}
                                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all ${
                                            cat.is_active
                                                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                        }`}
                                        title={cat.is_active ? 'คลิกเพื่อปิดใช้งานหมวดนี้' : 'คลิกเพื่อเปิดใช้งานหมวดนี้'}
                                    >
                                        {cat.is_active ? '🙈 ปิดใช้งาน' : '👁️ เปิดใช้งาน'}
                                    </button>
                                    <button
                                        onClick={() => handleEditCategory(cat)}
                                        className="rounded-lg bg-purple-50 px-2 py-1 text-[11px] font-bold text-purple-700 border border-purple-200 hover:bg-purple-100"
                                        title="แก้ไขชื่อหมวดหมู่"
                                    >
                                        ✏️ แก้ไข
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(cat)}
                                        className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 border border-rose-200 hover:bg-rose-100"
                                        title="ลบหมวดหมู่"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            {/* Category Items List */}
                            <div className="p-4 space-y-3">
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-xs font-bold text-purple-950">รายการตัวเลือกยุทธศาสตร์ ({cat.items?.length || 0} ข้อ)</span>
                                    <button
                                        onClick={() => handleAddStrategyItem(cat.id)}
                                        className="text-xs font-bold text-purple-700 hover:text-purple-900"
                                    >
                                        + เพิ่มตัวเลือกในหมวดนี้
                                    </button>
                                </div>

                                <ul className="divide-y divide-purple-100 text-xs font-semibold text-slate-800">
                                    {(cat.items || []).map((item, idx) => (
                                        <li key={item.id} className="py-2.5 flex justify-between items-center hover:bg-purple-50/20 px-2 rounded-lg">
                                            <div className="flex items-start gap-x-2 max-w-[75%]">
                                                <span className="font-bold text-purple-700">{idx + 1}.</span>
                                                <span>{item.name}</span>
                                            </div>
                                            <div className="flex gap-x-1.5 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleEditStrategyItem(item)}
                                                    className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-200 hover:bg-purple-100"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStrategyItem(item)}
                                                    className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200 hover:bg-rose-100"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                    {(!cat.items || cat.items.length === 0) && (
                                        <li className="py-4 text-center text-slate-400 text-xs font-normal">
                                            ยังไม่มีตัวเลือกยุทธศาสตร์ในหมวดนี้ (กด + เพิ่มตัวเลือกเพื่อเริ่มต้น)
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // 1. Teacher Component Rendering
    const renderProposalsTab = () => {
        if (!teacherData) {
            return (
                <div className="rounded-2xl border border-purple-100 bg-white p-8 text-center shadow-sm">
                    <p className="text-purple-900 font-bold text-base">กำลังโหลดข้อมูลโครงการ...</p>
                </div>
            );
        }
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600">จำนวนโครงการที่เสนอ</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">{teacherData.proposalsCount} โครงการ</p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">โครงการที่ผ่านอนุมัติงบ</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">{teacherData.approvedCount} โครงการ</p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">วงเงินงบประมาณรวม</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">
                            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(teacherData.totalBudget)}
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
                    <div className="border-b border-purple-100 bg-purple-50/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">รายการเสนอโครงการของฉัน</h3>
                            <p className="text-xs text-slate-600">ติดตามสถานะการพิจารณาจัดสรรงบประมาณ และกระบวนการอนุมัติ 6 ขั้นตอน</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {isPlanStaff && (
                                <button
                                    onClick={openDirectAllocateModal}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                                    title="สิทธิ์พิเศษสำหรับงานแผนงาน/Admin: เพิ่มโครงการและจัดสรรงบได้ทันที"
                                >
                                    <span>➕</span> เพิ่มโครงการ & จัดสรรงบทันที
                                </button>
                            )}
                            <Link
                                href={route('projects.quick_create')}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 hover:scale-105 active:scale-95 transition-all"
                            >
                                <span>💡</span> เสนอโครงการเบื้องต้น (ขอตั้งงบ)
                            </Link>
                            <Link
                                href={route('projects.create')}
                                className="inline-flex items-center rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition-colors"
                            >
                                + จัดทำข้อเสนอโครงการฉบับเต็ม
                            </Link>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-purple-100 bg-purple-50/30 text-xs font-bold uppercase text-purple-900">
                                    <th className="px-6 py-3.5">ชื่อโครงการ</th>
                                    <th className="px-6 py-3.5">ปีงบประมาณ</th>
                                    <th className="px-6 py-3.5">งบประมาณเสนอขอ / จัดสรรจริง</th>
                                    <th className="px-6 py-3.5">สถานะโครงการ</th>
                                    <th className="px-6 py-3.5 text-right">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-100 text-sm">
                                {teacherData.projects.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-500">
                                            ยังไม่มีรายการโครงการที่เสนอ ให้กดปุ่ม '💡 เสนอโครงการเบื้องต้น' ด้านบนเพื่อเริ่มเสนอคำของบประมาณ
                                        </td>
                                    </tr>
                                ) : (
                                    teacherData.projects.map((project) => {
                                        const fundingName = project.funding_source?.name || project.budget?.funding_source?.name || '';
                                        const hasAllocated = project.status === 'budget_approved' || project.status === 'approved' || project.allocated_budget > 0;
                                        
                                        return (
                                            <tr key={project.id} className="hover:bg-purple-50/20">
                                                <td className="px-6 py-4 font-bold text-slate-900">
                                                    <div>{project.title}</div>
                                                    {project.committee_comment && (
                                                        <div className="text-[11px] text-purple-700 mt-1 font-normal bg-purple-50 px-2 py-0.5 rounded border border-purple-100 inline-block">
                                                            💬 มติคณะกรรมการ: {project.committee_comment}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-semibold">{project.academic_year}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-purple-950">
                                                        {hasAllocated ? (
                                                            <div>
                                                                <span className="text-emerald-700 font-extrabold">
                                                                    {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(project.allocated_budget || project.estimated_budget)}
                                                                </span>
                                                                {fundingName && (
                                                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold ml-1.5">
                                                                        {fundingName}
                                                                    </span>
                                                                )}
                                                                <div className="text-[11px] text-slate-400 font-normal">
                                                                    (เสนอขอ: {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(project.proposed_budget || project.estimated_budget)})
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <span className="text-slate-800 font-bold">
                                                                    {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(project.proposed_budget || project.estimated_budget)}
                                                                </span>
                                                                <div className="text-[10px] text-amber-700 font-semibold">
                                                                    (รอการจัดสรรงบ)
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(project.status, project.current_approval_step)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                                        {/* 1. Preliminary Status (Waiting for budget allocation) */}
                                                        {project.status === 'preliminary' && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                                                                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                                                    ⏳ รอคณะกรรมการพิจารณาจัดสรรงบ
                                                                </span>
                                                                <button
                                                                    onClick={() => handleDeleteProject(project)}
                                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                                    title="ยกเลิกคำขอเสนอโครงการเบื้องต้น"
                                                                >
                                                                    🗑️ ลบคำขอ
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* 2. Budget Rejected Status */}
                                                        {project.status === 'budget_rejected' && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
                                                                    🔴 ไม่อนุมัติจัดสรรงบ
                                                                </span>
                                                                <button
                                                                    onClick={() => handleDeleteProject(project)}
                                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                                    title="ลบโครงการ"
                                                                >
                                                                    🗑️ ลบ
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* 3. Budget Approved Status - Prominent Start Full Proposal Button */}
                                                        {project.status === 'budget_approved' && (
                                                            <Link
                                                                href={route('projects.edit', project.id)}
                                                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-emerald-500/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0 animate-bounce-short"
                                                                title="จัดทำรายละเอียดโครงการฉบับสมบูรณ์"
                                                            >
                                                                📝 จัดทำรายละเอียดฉบับเต็ม →
                                                            </Link>
                                                        )}

                                                        {/* 4. Active Workflow Statuses (After budget allocation) */}
                                                        {project.status !== 'preliminary' && project.status !== 'budget_rejected' && (
                                                            <>
                                                                <Link
                                                                    href={route('projects.show', project.id)}
                                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/25 hover:shadow-lg hover:shadow-purple-600/35 hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                                    title="จัดการ / ดูรายละเอียด"
                                                                >
                                                                    👁️ จัดการ ➔
                                                                </Link>

                                                                {(project.status === 'draft' || project.status === 'rejected') && (
                                                                    <button
                                                                        onClick={() => handleResubmitProject(project)}
                                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                                        title="ยื่นเสนอขออนุมัติเพื่อดำเนินงานต่อ"
                                                                    >
                                                                        🚀 ยื่นขออนุมัติ
                                                                    </button>
                                                                )}

                                                                {(role === 'admin' || auth.user.is_admin || project.status === 'draft' || project.status === 'rejected') && (
                                                                    <Link
                                                                        href={route('projects.edit', project.id)}
                                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-3 py-2 text-xs font-bold text-purple-950 shadow-md shadow-amber-400/25 hover:shadow-lg hover:shadow-amber-400/35 hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                                        title="แก้ไขโครงการ"
                                                                    >
                                                                        ✏️ แก้ไข
                                                                    </Link>
                                                                )}

                                                                {(role === 'admin' || auth.user.is_admin || project.status === 'draft') && (
                                                                    <button
                                                                        onClick={() => handleDeleteProject(project)}
                                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/25 hover:shadow-lg hover:shadow-rose-600/35 hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                                        title="ลบโครงการ"
                                                                    >
                                                                        🗑️ ลบ
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // Central Allocation CRUD Actions
    const handleCentralAllocationSubmit = (e) => {
        e.preventDefault();
        
        // Ensure funding source is set
        const defaultSourceId = centralAllocationData.funding_source_id || planHeadData?.fundingSources?.[0]?.id || '';
        
        if (editingCentralAllocation) {
            router.put(route('admin.central_allocations.update', editingCentralAllocation.id), {
                ...centralAllocationData,
                funding_source_id: defaultSourceId
            }, {
                onSuccess: () => {
                    Swal.fire('สำเร็จ!', 'แก้ไขข้อมูลการจัดสรรจากส่วนกลางเรียบร้อยแล้ว', 'success');
                    setEditingCentralAllocation(null);
                    resetCentralAllocation();
                }
            });
        } else {
            router.post(route('admin.central_allocations.store'), {
                ...centralAllocationData,
                funding_source_id: defaultSourceId
            }, {
                onSuccess: () => {
                    Swal.fire('สำเร็จ!', 'บันทึกการจัดสรรงบประมาณจากส่วนกลางเรียบร้อยแล้ว', 'success');
                    resetCentralAllocation();
                }
            });
        }
    };

    const handleCentralAllocationDelete = (id) => {
        Swal.fire({
            title: 'ยืนยันการลบประวัติรับจัดสรร?',
            text: 'การลบจะไม่ส่งผลต่องบประมาณโครงการในระบบ แต่จะลดวงเงินรับจัดสรรส่วนกลางลงในการคำนวณแดชบอร์ด!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ใช่, ต้องการลบ!',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.central_allocations.destroy', id), {
                    onSuccess: () => {
                        Swal.fire('ลบแล้ว!', 'ลบประวัติรับจัดสรรจากส่วนกลางเรียบร้อยแล้ว', 'success');
                    }
                });
            }
        });
    };

    // Routine Budget Plan CRUD Actions
    const handleRoutinePlanSubmit = (e) => {
        e.preventDefault();
        if (editingRoutinePlan) {
            putRoutinePlan(route('admin.routine_budgets.update', editingRoutinePlan.id), {
                onSuccess: () => {
                    Swal.fire('สำเร็จ!', 'แก้ไขข้อมูลแผนงบประมาณเรียบร้อยแล้ว', 'success');
                    setEditingRoutinePlan(null);
                    resetRoutinePlan();
                }
            });
        } else {
            postRoutinePlan(route('admin.routine_budgets.store'), {
                onSuccess: () => {
                    Swal.fire('สำเร็จ!', 'เพิ่มแผนงบประมาณประจำปีเรียบร้อยแล้ว', 'success');
                    resetRoutinePlan();
                }
            });
        }
    };

    const handleRoutinePlanDelete = (id) => {
        Swal.fire({
            title: 'ยืนยันการลบแผนงบประมาณ?',
            text: 'การลบจะทำให้งบประมาณในระบบหายไป รวมถึงรายการจัดซื้อจัดจ้างที่ผูกกับงบนี้!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ใช่, ต้องการลบ!',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.routine_budgets.destroy', id), {
                    onSuccess: () => {
                        Swal.fire('ลบแล้ว!', 'ลบแผนงบประมาณออกจากระบบเรียบร้อยแล้ว', 'success');
                    }
                });
            }
        });
    };

    // Direct Procurement Items Actions
    const addRoutineProcItem = () => {
        setRoutineProcItems([...routineProcItems, { description: '', quantity: 1, unit: 'ชิ้น', unit_price: 0 }]);
    };

    const removeRoutineProcItem = (index) => {
        if (routineProcItems.length === 1) return;
        setRoutineProcItems(routineProcItems.filter((_, i) => i !== index));
    };

    const updateRoutineProcItem = (index, field, value) => {
        const updated = [...routineProcItems];
        updated[index][field] = value;
        setRoutineProcItems(updated);
    };

    const calculateRoutineProcTotal = () => {
        return routineProcItems.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)), 0);
    };

    const openRoutineProcurementModal = (plan) => {
        setSelectedRoutinePlanForProc(plan);
        setRoutineProcItems([{ description: '', quantity: 1, unit: 'ชิ้น', unit_price: 0 }]);
        setRoutineProcData({
            procurement_id: null,
            memo_subject: `ขออนุมัติจัดซื้อจัดจ้างวัสดุ/บริการ หมวด${plan.title} แผนก${plan.department?.name}`,
            tor_specifications: `รายละเอียดการกำหนดคุณลักษณะเฉพาะพัสดุ หมวด${plan.title}`,
            purchasing_chair: '',
            purchasing_member1: '',
            purchasing_member2: '',
            inspection_chair: '',
            inspection_member1: '',
            inspection_member2: '',
            items: []
        });
    };

    const openEditRoutineProcurementModal = (plan, proc) => {
        setSelectedRoutinePlanForProc(plan);
        setRoutineProcItems(proc.items.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            unit: item.unit,
            unit_price: parseFloat(item.unit_price)
        })));

        const pChair = proc.committees?.find(c => c.pivot.committee_type === 'purchasing' && c.pivot.role === 'chairperson')?.id || '';
        const pMembers = proc.committees?.filter(c => c.pivot.committee_type === 'purchasing' && c.pivot.role === 'member') || [];
        const iChair = proc.committees?.find(c => c.pivot.committee_type === 'inspection' && c.pivot.role === 'chairperson')?.id || '';
        const iMembers = proc.committees?.filter(c => c.pivot.committee_type === 'inspection' && c.pivot.role === 'member') || [];

        setRoutineProcData({
            procurement_id: proc.id,
            memo_subject: proc.memo_subject || '',
            tor_specifications: proc.tor_specifications || '',
            purchasing_chair: pChair,
            purchasing_member1: pMembers[0]?.id || '',
            purchasing_member2: pMembers[1]?.id || '',
            inspection_chair: iChair,
            inspection_member1: iMembers[0]?.id || '',
            inspection_member2: iMembers[1]?.id || '',
            items: []
        });
    };

    const handleRoutineProcurementSubmit = (e) => {
        e.preventDefault();
        const totalSum = calculateRoutineProcTotal();
        const remainingBudget = parseFloat(selectedRoutinePlanForProc.allocated_amount) - parseFloat(selectedRoutinePlanForProc.spent_amount);
        
        let oldTotal = 0;
        if (routineProcData.procurement_id) {
            const proc = selectedRoutinePlanForProc.procurements.find(p => p.id === routineProcData.procurement_id);
            if (proc) {
                oldTotal = proc.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0);
            }
        }

        if (totalSum > (remainingBudget + oldTotal)) {
            Swal.fire('ข้อผิดพลาด!', `ยอดรวมใบจัดซื้อ (${totalSum.toLocaleString()} บาท) เกินวงเงินงบประมาณคงเหลือ (${(remainingBudget + oldTotal).toLocaleString()} บาท)`, 'error');
            return;
        }

        const finalData = {
            ...routineProcData,
            items: routineProcItems
        };

        router.post(route('routine_procurements.save', selectedRoutinePlanForProc.id), finalData, {
            onSuccess: () => {
                Swal.fire('สำเร็จ!', 'บันทึกข้อมูลจัดซื้อจัดจ้าง และเบิกตัดแผนงบประมาณเรียบร้อยแล้ว', 'success');
                setSelectedRoutinePlanForProc(null);
                resetRoutineProc();
            },
            onError: (err) => {
                Swal.fire('ข้อผิดพลาด!', Object.values(err).join('\n'), 'error');
            }
        });
    };

    // 2. Plan Head Component Rendering
    const renderBudgetsTab = () => {
        if (!planHeadData) {
            return (
                <div className="rounded-2xl border border-purple-100 bg-white p-8 text-center shadow-sm font-sans">
                    <p className="text-purple-900 font-bold text-base">กำลังโหลดข้อมูลงบประมาณ...</p>
                </div>
            );
        }

        const routineAllocated = routinePlans.reduce((sum, p) => sum + parseFloat(p.allocated_amount || 0), 0);
        const routineSpent = routinePlans.reduce((sum, p) => sum + parseFloat(p.spent_amount || 0), 0);
        const routineRemaining = routineAllocated - routineSpent;

        const totalAllocatedAll = parseFloat(planHeadData.globalAllocated || 0) + routineAllocated;
        const totalSpentAll = parseFloat(planHeadData.globalSpent || 0) + routineSpent;
        const totalRemainingAll = totalAllocatedAll - totalSpentAll;

        const totalCentralReceived = centralAllocations.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
        const centralRemaining = totalCentralReceived - totalAllocatedAll;

        const isPlanHeadOrAdmin = role === 'admin' || role === 'plan_head' || auth.user.is_plan_head;

        return (
            <div className="space-y-8 font-sans">
                {/* 1. Global Combined Budget Header */}
                <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 p-6 md:p-8 text-white shadow-lg space-y-6">
                    <div>
                        <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            แดชบอร์ดสรุปและจัดสรรงบประมาณจริงจากส่วนกลาง
                        </span>
                        <h2 className="text-xl md:text-2xl font-black mt-2">สรุปงบจัดสรรจากต้นสังกัด เทียบแผนโครงการ & งบดำเนินงานประจำปี</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-white/10 pt-6">
                        <div className="bg-white/5 p-4 rounded-2xl">
                            <span className="text-purple-200 text-xs block">งบได้รับจัดสรรจริงจากต้นสังกัดรวม</span>
                            <span className="text-lg md:text-xl font-black text-amber-300 mt-1 block">
                                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totalCentralReceived)}
                            </span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl">
                            <span className="text-purple-200 text-xs block">งบที่นำไปจัดสรรลงแผนงานแล้ว</span>
                            <span className="text-lg md:text-xl font-black text-blue-300 mt-1 block">
                                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totalAllocatedAll)}
                            </span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl">
                            <span className="text-purple-200 text-xs block">งบต้นสังกัดคงเหลือ (รอจัดสรร)</span>
                            <span className={`text-lg md:text-xl font-black mt-1 block ${centralRemaining >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(centralRemaining)}
                            </span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl">
                            <span className="text-purple-200 text-xs block">เบิกจ่ายสะสมรวมจริง (Spent)</span>
                            <span className="text-lg md:text-xl font-black text-rose-300 mt-1 block">
                                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totalSpentAll)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Side-by-side comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Project Budgets Card */}
                    <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-extrabold text-gray-800 text-base">📁 งบแผนงานโครงการ (Project Budgets)</h3>
                            <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-bold">ตามเสนออนุมัติ</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center pt-2">
                            <div className="p-2 bg-gray-50 rounded-xl">
                                <span className="text-[10px] text-gray-500 block">จัดสรร</span>
                                <span className="text-xs font-bold text-gray-800">
                                    {new Intl.NumberFormat('th-TH').format(planHeadData.globalAllocated)}
                                </span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-xl">
                                <span className="text-[10px] text-gray-500 block">ผูกพัน</span>
                                <span className="text-xs font-bold text-amber-600">
                                    {new Intl.NumberFormat('th-TH').format(planHeadData.globalEncumbered)}
                                </span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-xl">
                                <span className="text-[10px] text-gray-500 block">เบิกจ่าย</span>
                                <span className="text-xs font-bold text-red-600">
                                    {new Intl.NumberFormat('th-TH').format(planHeadData.globalSpent)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between text-[11px] text-gray-500">
                                <span>อัตราการเบิกจ่ายโครงการ</span>
                                <span>
                                    {planHeadData.globalAllocated > 0 ? ((planHeadData.globalSpent / planHeadData.globalAllocated) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div 
                                    className="bg-purple-600 h-full rounded-full" 
                                    style={{ width: `${planHeadData.globalAllocated > 0 ? Math.min((planHeadData.globalSpent / planHeadData.globalAllocated) * 100, 100) : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Routine Budgets Card */}
                    <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-extrabold text-gray-800 text-base">📅 งบประจำฝ่าย/วัสดุฝึก (Routine Budgets)</h3>
                            <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">จัดสรรย่อยโดยตรง</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center pt-2">
                            <div className="p-2 bg-gray-50 rounded-xl">
                                <span className="text-[10px] text-gray-500 block">จัดสรร</span>
                                <span className="text-xs font-bold text-gray-800">
                                    {new Intl.NumberFormat('th-TH').format(routineAllocated)}
                                </span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-xl">
                                <span className="text-[10px] text-gray-500 block">เบิกจ่าย</span>
                                <span className="text-xs font-bold text-red-600">
                                    {new Intl.NumberFormat('th-TH').format(routineSpent)}
                                </span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-xl">
                                <span className="text-[10px] text-gray-500 block">คงเหลือ</span>
                                <span className="text-xs font-bold text-emerald-600">
                                    {new Intl.NumberFormat('th-TH').format(routineRemaining)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between text-[11px] text-gray-500">
                                <span>อัตราการเบิกจ่ายงบประจำ</span>
                                <span>
                                    {routineAllocated > 0 ? ((routineSpent / routineAllocated) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div 
                                    className="bg-amber-500 h-full rounded-full" 
                                    style={{ width: `${routineAllocated > 0 ? Math.min((routineSpent / routineAllocated) * 100, 100) : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2.5 Central Budget Allocations Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Creation / Edit Form (For plan_head and admin) */}
                    {isPlanHeadOrAdmin && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100/50 space-y-4 self-start">
                            <h3 className="font-extrabold text-gray-800 text-sm">
                                {editingCentralAllocation ? '✏️ แก้ไขบันทึกรับงบจากส่วนกลาง' : '📥 บันทึกรับงบจัดสรรจากต้นสังกัด/ส่วนกลาง'}
                            </h3>
                            <form onSubmit={handleCentralAllocationSubmit} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">ปีงบประมาณ</label>
                                    <input
                                        type="text"
                                        value={centralAllocationData.fiscal_year}
                                        onChange={e => setCentralAllocationData('fiscal_year', e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-2.5"
                                        placeholder="ตัวอย่าง 2569"
                                        disabled={editingCentralAllocation}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">เลขที่หนังสือสั่งการ / อ้างอิง</label>
                                    <input
                                        type="text"
                                        value={centralAllocationData.document_number}
                                        onChange={e => setCentralAllocationData('document_number', e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-2.5"
                                        placeholder="เช่น ศธ 0601/1234 หรือ อ้างอิงแผน"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">หมวดงบเงินทุนส่วนกลาง</label>
                                    <select
                                        value={centralAllocationData.funding_source_id}
                                        onChange={e => setCentralAllocationData('funding_source_id', e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-2.5"
                                    >
                                        <option value="">เลือกแหล่งเงินทุน...</option>
                                        {planHeadData?.fundingSources?.map(src => (
                                            <option key={src.id} value={src.id}>{src.name}</option>
                                        ))}
                                    </select>
                                    {centralAllocationErrors.funding_source_id && <span className="text-red-500 text-[10px]">{centralAllocationErrors.funding_source_id}</span>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">ชื่องาน/โครงการ/วัตถุประสงค์จากส่วนกลาง</label>
                                    <input
                                        type="text"
                                        value={centralAllocationData.title}
                                        onChange={e => setCentralAllocationData('title', e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-2.5"
                                        placeholder="เช่น งบอุดหนุนทั่วไปรายหัว หรือ งบจัดตั้งศูนย์วิชาชีพ"
                                    />
                                    {centralAllocationErrors.title && <span className="text-red-500 text-[10px]">{centralAllocationErrors.title}</span>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">จำนวนงบประมาณแจ้งจัดสรรจริง (บาท)</label>
                                    <input
                                        type="number"
                                        value={centralAllocationData.amount}
                                        onChange={e => setCentralAllocationData('amount', e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-2.5"
                                        placeholder="เช่น 100000"
                                    />
                                    {centralAllocationErrors.amount && <span className="text-red-500 text-[10px]">{centralAllocationErrors.amount}</span>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">รายละเอียดเพิ่มเติม / ภาระงานแนบ</label>
                                    <textarea
                                        value={centralAllocationData.description}
                                        onChange={e => setCentralAllocationData('description', e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-2.5"
                                        rows="2"
                                        placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับการเบิกจ่าย..."
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all"
                                    >
                                        {editingCentralAllocation ? '💾 บันทึกแก้ไข' : '📥 บันทึกรับงบ'}
                                    </button>
                                    {editingCentralAllocation && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingCentralAllocation(null);
                                                resetCentralAllocation();
                                            }}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-all"
                                        >
                                            ยกเลิก
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Central Budget List Table */}
                    <div className={`${isPlanHeadOrAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4`}>
                        <h3 className="font-extrabold text-gray-800 text-sm">📥 รายการประวัติรับจัดสรรงบประมาณจากต้นสังกัด/ส่วนกลาง</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-400 text-[11px] font-bold">
                                        <th className="py-2.5 px-2">ปี/หนังสือสั่งการ</th>
                                        <th className="py-2.5 px-2">วัตถุประสงค์ / โครงการส่วนกลาง</th>
                                        <th className="py-2.5 px-2 text-right">วงเงินรับจัดสรร</th>
                                        <th className="py-2.5 px-2 text-center">การจัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-[11px]">
                                    {centralAllocations.map((alloc) => {
                                        const amt = parseFloat(alloc.amount || 0);
                                        return (
                                            <tr key={alloc.id} className="hover:bg-gray-50/50">
                                                <td className="py-3 px-2">
                                                    <span className="font-bold text-gray-800 block">ปี {alloc.fiscal_year}</span>
                                                    <span className="text-[10px] text-gray-400">📄 {alloc.document_number || 'ไม่มีเลขที่หนังสือ'}</span>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className="font-bold text-gray-800 block">{alloc.title}</span>
                                                    <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                                                        💰 {alloc.funding_source?.name}
                                                    </span>
                                                    {alloc.description && <p className="text-[10px] text-gray-400 mt-1">{alloc.description}</p>}
                                                </td>
                                                <td className="py-3 px-2 text-right font-bold text-gray-800">{amt.toLocaleString()} บาท</td>
                                                <td className="py-3 px-2 text-center space-x-1 whitespace-nowrap">
                                                    {isPlanHeadOrAdmin && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingCentralAllocation(alloc);
                                                                    setCentralAllocationData({
                                                                        fiscal_year: alloc.fiscal_year,
                                                                        document_number: alloc.document_number || '',
                                                                        title: alloc.title,
                                                                        funding_source_id: alloc.funding_source_id,
                                                                        amount: alloc.amount,
                                                                        description: alloc.description || '',
                                                                    });
                                                                }}
                                                                className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold px-2 py-1.5 rounded-lg transition-all"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => handleCentralAllocationDelete(alloc.id)}
                                                                className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2 py-1.5 rounded-lg transition-all"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {centralAllocations.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="text-center py-6 text-gray-400">ยังไม่มีบันทึกรับงบจัดสรรจากส่วนกลางในระบบ</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 3. Interactive Section: Routine Budgets Management */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Creation / Edit Form (For plan_head and admin) */}
                    {isPlanHeadOrAdmin && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100/50 space-y-4 self-start">
                            <h3 className="font-extrabold text-gray-800 text-sm">
                                {editingRoutinePlan ? '✏️ แก้ไขแผนงบประมาณประจำปี' : '📅 สร้างแผนงบดำเนินงาน/ประจำปี'}
                            </h3>
                            <form onSubmit={handleRoutinePlanSubmit} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">ปีงบประมาณ</label>
                                    <input
                                        type="text"
                                        value={routinePlanData.fiscal_year}
                                        onChange={e => setRoutinePlanData('fiscal_year', e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-2.5"
                                        placeholder="ตัวอย่าง 2569"
                                        disabled={editingRoutinePlan}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">ฝ่ายงาน / แผนกวิชาที่จัดสรร</label>
                                    <select
                                        value={routinePlanData.department_id}
                                        onChange={e => setRoutinePlanData('department_id', e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-2.5"
                                        disabled={editingRoutinePlan}
                                    >
                                        {allDepartments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">ชื่อหมวดงบดำเนินงาน / งบประจำ</label>
                                    <input
                                        type="text"
                                        value={routinePlanData.title}
                                        onChange={e => setRoutinePlanData('title', e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-2.5"
                                        placeholder="เช่น ค่าจัดซื้อวัสดุสำนักงาน, ค่าซ่อมแซมครุภัณฑ์"
                                    />
                                    {routinePlanErrors.title && <span className="text-red-500 text-[10px]">{routinePlanErrors.title}</span>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">แหล่งเงินทุน</label>
                                    <select
                                        value={routinePlanData.funding_source_id}
                                        onChange={e => setRoutinePlanData('funding_source_id', e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-2.5"
                                    >
                                        <option value="">เลือกแหล่งเงินทุน...</option>
                                        {planHeadData?.fundingSources?.map(src => (
                                            <option key={src.id} value={src.id}>{src.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">หมวดรายจ่ายตามแผนปฏิบัติราชการ</label>
                                    <select
                                        value={routinePlanData.report_category}
                                        onChange={e => setRoutinePlanData('report_category', e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-2.5"
                                    >
                                        <option value="">เลือกหมวดรายจ่ายในรายงาน...</option>
                                        <optgroup label="1. งบบุคลากร">
                                            <option value="1.1">1.1 ครูอัตราจ้าง 6 อัตรา</option>
                                            <option value="1.2">1.2 ค่าสมทบประกันสังคมของครูอัตราจ้าง 9 อัตรา</option>
                                            <option value="1.3">1.3 เจ้าหน้าที่ 15 อัตรา</option>
                                            <option value="1.4">1.4 ค่าสมทบประกันสังคมของเจ้าหน้าที่ 16 อัตรา</option>
                                        </optgroup>
                                        <optgroup label="2. งบดำเนินงาน">
                                            <option value="2.1.1">2.1.1 จ้างเหมาบริการเจ้าหน้าที่</option>
                                            <option value="2.1.2">2.1.2 ค่าตอบแทนสอนเกินภาระงานครู</option>
                                            <option value="2.1.3">2.1.3 ค่าตอบแทนครูสอนระยะสั้นรายชั่วโมง 7 ราย</option>
                                            <option value="2.1.4">2.1.4 ค่าตอบแทนครูสอนระยะสั้นนอกเวลาราชการ</option>
                                            <option value="2.2.1">2.2.1 ค่าเดินทางไปราชการ</option>
                                            <option value="2.2.2">2.2.2 ค่าซ่อมแซมพาหนะและค่าขนส่ง</option>
                                            <option value="2.2.3">2.2.3 ค่าซ่อมแซมครุภัณฑ์</option>
                                            <option value="2.2.4">2.2.4 ค่าขยะและสิ่งปฏิกูล</option>
                                            <option value="2.2.5">2.2.5 ค่าโฆษณาและเผยแพร่</option>
                                        </optgroup>
                                        <optgroup label="3. ค่าวัสดุ">
                                            <option value="3.1">3.1 วัสดุงานอาคาร</option>
                                            <option value="3.2.1">3.2.1 วัสดุสำนักงาน - ฝ่ายวิชาการ</option>
                                            <option value="3.2.2">3.2.2 วัสดุสำนักงาน - ฝ่ายพัฒนากิจการนักเรียนนักศึกษา</option>
                                            <option value="3.2.3">3.2.3 วัสดุสำนักงาน - ฝ่ายบริหารทรัพยากร</option>
                                            <option value="3.2.4">3.2.4 วัสดุสำนักงาน - ฝ่ายแผนฯ</option>
                                            <option value="3.3">3.3 วัสดุเชื้อเพลิงและหล่อลื่น</option>
                                        </optgroup>
                                        <optgroup label="4. วัสดุการศึกษา">
                                            <option value="4.1">4.1 หลักสูตรวิชาชีพระยะสั้น</option>
                                            <option value="4.2">4.2 สาขาวิชาช่างยนต์</option>
                                            <option value="4.3">4.3 สาขาวิชาไฟฟ้ากำลัง</option>
                                            <option value="4.4">4.4 สาขาวิชาเทคนิคพื้นฐาน</option>
                                            <option value="4.5">4.5 สาขาวิชาอิเล็กทรอนิกส์</option>
                                            <option value="4.6">4.6 สาขาวิชาการบัญชี</option>
                                            <option value="4.7">4.7 สาขาวิชาการตลาด</option>
                                            <option value="4.8">4.8 สาขาวิชาเทคโนโลยีสารสนเทศฯ</option>
                                            <option value="4.9">4.9 แผนกสามัญสัมพันธ์</option>
                                        </optgroup>
                                        <optgroup label="5. ค่าสาธารณูปโภค">
                                            <option value="5.1">5.1 ค่าไฟฟ้า</option>
                                            <option value="5.2">5.2 ค่าน้ำประปา</option>
                                            <option value="5.3">5.3 ค่าโทรศัพท์</option>
                                            <option value="5.4">5.4 ค่าไปรษณีย์โทรเลข</option>
                                            <option value="5.5">5.5 ค่าบริการด้านสื่อสารโทรคมนาคม</option>
                                        </optgroup>
                                        <optgroup label="7. สำรองจ่าย">
                                            <option value="7.1">7.1 สำรองจ่าย</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">จำนวนงบประมาณจัดสรร (บาท)</label>
                                    <input
                                        type="number"
                                        value={routinePlanData.allocated_amount}
                                        onChange={e => setRoutinePlanData('allocated_amount', e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-2.5"
                                        placeholder="เช่น 50000"
                                    />
                                    {routinePlanErrors.allocated_amount && <span className="text-red-500 text-[10px]">{routinePlanErrors.allocated_amount}</span>}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all"
                                    >
                                        {editingRoutinePlan ? '💾 บันทึกการแก้ไข' : '➕ บันทึกตั้งงบ'}
                                    </button>
                                    {editingRoutinePlan && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingRoutinePlan(null);
                                                resetRoutinePlan();
                                            }}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-all"
                                        >
                                            ยกเลิก
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Routine Budgets List Table */}
                    <div className={`${isPlanHeadOrAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4`}>
                        <h3 className="font-extrabold text-gray-800 text-sm">📋 รายการแผนงบประมาณประจำปีทั้งหมดในระบบ</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-400 text-[11px] font-bold">
                                        <th className="py-2.5 px-2">หมวดงบประจำปี / สังกัด</th>
                                        <th className="py-2.5 px-2 text-right">จัดสรร</th>
                                        <th className="py-2.5 px-2 text-right">เบิกจ่าย</th>
                                        <th className="py-2.5 px-2 text-right">คงเหลือ</th>
                                        <th className="py-2.5 px-2 text-center">การจัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-[11px]">
                                    {routinePlans.map((plan) => {
                                        const alloc = parseFloat(plan.allocated_amount);
                                        const spent = parseFloat(plan.spent_amount);
                                        const rem = alloc - spent;
                                        return (
                                            <tr key={plan.id} className="hover:bg-gray-50/50">
                                                <td className="py-3 px-2">
                                                    <span className="font-bold text-gray-800 block">{plan.title}</span>
                                                    <span className="text-[10px] text-gray-400">🏫 {plan.department?.name} (ปี {plan.fiscal_year})</span>
                                                </td>
                                                <td className="py-3 px-2 text-right font-semibold text-gray-800">{alloc.toLocaleString()}</td>
                                                <td className="py-3 px-2 text-right text-red-500 font-semibold">{spent.toLocaleString()}</td>
                                                <td className="py-3 px-2 text-right text-emerald-600 font-bold">{rem.toLocaleString()}</td>
                                                <td className="py-3 px-2 text-center space-y-1 sm:space-y-0 sm:space-x-1 whitespace-nowrap">
                                                    <button
                                                        onClick={() => openRoutineProcurementModal(plan)}
                                                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-2.5 py-1.5 rounded-lg transition-all"
                                                    >
                                                        🛒 ขอซื้อตรง
                                                    </button>
                                                    {plan.procurements?.length > 0 && (
                                                        <button
                                                            onClick={() => setViewingRoutineHistoryPlan(plan)}
                                                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1.5 rounded-lg transition-all"
                                                        >
                                                            ประวัติ ({plan.procurements.length})
                                                        </button>
                                                    )}
                                                    {isPlanHeadOrAdmin && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingRoutinePlan(plan);
                                                                    setRoutinePlanData({
                                                                        fiscal_year: plan.fiscal_year,
                                                                        department_id: plan.department_id,
                                                                        title: plan.title,
                                                                        allocated_amount: plan.allocated_amount,
                                                                        funding_source_id: plan.funding_source_id || '',
                                                                        report_category: plan.report_category || '',
                                                                    });
                                                                }}
                                                                className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold px-2 py-1.5 rounded-lg transition-all"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => handleRoutinePlanDelete(plan.id)}
                                                                className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2 py-1.5 rounded-lg transition-all"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {routinePlans.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="text-center py-6 text-gray-400">ยังไม่มีงบดำเนินงานประจำปีใดๆ ในระบบ</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 4. Budget usage per department (Project-based) */}
                <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm space-y-6">
                    <h3 className="font-extrabold text-gray-800 text-base">🏫 ยอดใช้จ่ายงบประมาณสะสมรายฝ่าย/แผนก (งบดำเนินงาน)</h3>
                    
                    <div className="space-y-4">
                        {allDepartments.map((dept) => {
                            const deptRoutineAlloc = routinePlans
                                .filter(p => p.department_id === dept.id)
                                .reduce((sum, p) => sum + parseFloat(p.allocated_amount || 0), 0);
                            
                            const deptRoutineSpent = routinePlans
                                .filter(p => p.department_id === dept.id)
                                .reduce((sum, p) => sum + parseFloat(p.spent_amount || 0), 0);

                            const deptTotalAlloc = deptRoutineAlloc;
                            const deptTotalSpent = deptRoutineSpent;
                            const deptRemaining = deptTotalAlloc - deptTotalSpent;
                            const deptPercent = deptTotalAlloc > 0 ? (deptTotalSpent / deptTotalAlloc) * 100 : 0;

                            return (
                                <div key={dept.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100/50 space-y-2">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                                        <div>
                                            <span className="text-xs font-bold text-gray-800">{dept.name}</span>
                                        </div>
                                        <div className="text-right text-[11px]">
                                            <span className="text-gray-500">ใช้จ่ายงบประจำแล้ว: </span>
                                            <strong className="text-gray-900">{deptTotalSpent.toLocaleString()} / {deptTotalAlloc.toLocaleString()} บาท</strong>
                                            <span className="text-gray-400"> (คงเหลือ: {deptRemaining.toLocaleString()} บาท)</span>
                                        </div>
                                    </div>

                                    {deptTotalAlloc > 0 ? (
                                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all ${deptPercent > 80 ? 'bg-red-500' : deptPercent > 40 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                style={{ width: `${Math.min(deptPercent, 100)}%` }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-gray-400">ยังไม่มีงบดำเนินงานประจำปีจัดสรรให้ฝ่ายนี้</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 5. Funding sources breakdown cards */}
                <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-gray-800 text-base">💵 งบจำแนกตามช่องทางเงินทุน (โครงการ)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {planHeadData.fundingChannelProgress?.map((source) => (
                            <div key={source.id} className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100/50 space-y-2">
                                <span className="font-bold text-xs text-purple-900 block truncate">{source.name}</span>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-gray-500">
                                        <span>แผนเสนอขอ:</span>
                                        <span className="font-semibold text-gray-800">{parseFloat(source.allocated).toLocaleString()} บ.</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-500">
                                        <span>เบิกจ่ายจริง:</span>
                                        <span className="font-semibold text-red-600">{parseFloat(source.spent).toLocaleString()} บ.</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- Modals --- */}
                
                {/* 5.1 Viewing Routine History Modal */}
                {viewingRoutineHistoryPlan && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex justify-center items-center p-4">
                        <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl">
                            <div className="flex justify-between items-center border-b pb-4">
                                <div>
                                    <h3 className="font-extrabold text-gray-800 text-lg">📋 ประวัติขอจัดซื้อจัดจ้างย่อย (งบประจำปี)</h3>
                                    <p className="text-xs text-gray-400">หมวดงบ: {viewingRoutineHistoryPlan.title} ({viewingRoutineHistoryPlan.department?.name})</p>
                                </div>
                                <button
                                    onClick={() => setViewingRoutineHistoryPlan(null)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-black p-2 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                {viewingRoutineHistoryPlan.procurements?.map((proc) => {
                                    const total = proc.items?.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0) || 0;
                                    return (
                                        <div key={proc.id} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                <div>
                                                    <span className="bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded text-[10px]">
                                                        {proc.procurement_number}
                                                    </span>
                                                    <h4 className="font-bold text-gray-800 text-xs sm:text-sm mt-1">{proc.memo_subject}</h4>
                                                    <span className="text-[10px] text-gray-400 block sm:inline mt-1">
                                                        📅 ทำรายการเมื่อ: {new Date(proc.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-bold text-purple-900 block">
                                                        รวมสุทธิ: {total.toLocaleString()} บาท
                                                    </span>
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold inline-block mt-1">
                                                        เบิกจ่ายสำเร็จ
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Sub items list */}
                                            <div className="border-t border-dashed pt-3">
                                                <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-2">รายการพัสดุในเอกสาร:</h5>
                                                <ul className="space-y-1 text-xs text-gray-700 pl-4 list-disc">
                                                    {proc.items?.map((item, idx) => (
                                                        <li key={idx}>
                                                            {item.description} ({item.quantity.toLocaleString()} {item.unit} x {parseFloat(item.unit_price).toLocaleString()} บาท) = <strong>{parseFloat(item.total_price).toLocaleString()} บาท</strong>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Action links to download stubs */}
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                <a
                                                    href={route('routine_procurements.download_document', { procurement: proc.id, type: 'memo' })}
                                                    target="_blank"
                                                    className="bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all"
                                                >
                                                    📝 พิมพ์บันทึกข้อความ
                                                </a>
                                                <a
                                                    href={route('routine_procurements.download_document', { procurement: proc.id, type: 'request_form' })}
                                                    target="_blank"
                                                    className="bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all"
                                                >
                                                    📄 ใบขอซื้อ/จ้าง
                                                </a>
                                                <a
                                                    href={route('routine_procurements.download_document', { procurement: proc.id, type: 'estimation' })}
                                                    target="_blank"
                                                    className="bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all"
                                                >
                                                    📊 บัญชีแนบท้าย
                                                </a>
                                                <a
                                                    href={route('routine_procurements.download_document', { procurement: proc.id, type: 'tor' })}
                                                    target="_blank"
                                                    className="bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all"
                                                >
                                                    📋 TOR
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        setViewingRoutineHistoryPlan(null);
                                                        openEditRoutineProcurementModal(viewingRoutineHistoryPlan, proc);
                                                    }}
                                                    className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all ml-auto"
                                                >
                                                    ✏️ แก้ไขใบพัสดุนี้
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* 5.2 Creating Direct Routine Procurement Modal */}
                {selectedRoutinePlanForProc && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex justify-center items-center p-4">
                        <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
                            
                            <div className="flex justify-between items-center border-b pb-4">
                                <div>
                                    <h3 className="font-extrabold text-gray-800 text-lg">🛍️ ขอจัดซื้อจัดจ้าง (ตัดงบประมาณประจำปี)</h3>
                                    <p className="text-xs text-gray-400">
                                        หมวดงบ: {selectedRoutinePlanForProc.title} | วงเงินคงเหลือคงคลัง: <strong>{(parseFloat(selectedRoutinePlanForProc.allocated_amount) - parseFloat(selectedRoutinePlanForProc.spent_amount)).toLocaleString()} บาท</strong>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedRoutinePlanForProc(null)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-black p-2 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleRoutineProcurementSubmit} className="space-y-6 text-xs">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">หัวข้อบันทึกข้อความขอซื้อ/จ้าง</label>
                                        <input
                                            type="text"
                                            value={routineProcData.memo_subject}
                                            onChange={e => setRoutineProcData('memo_subject', e.target.value)}
                                            className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-2.5"
                                            placeholder="เช่น ขออนุมัติจัดซื้อวัสดุคอมพิวเตอร์และอุปกรณ์เสริมสำหรับสำนักงาน"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">ขอบเขตงานหรือรายละเอียด TOR</label>
                                        <textarea
                                            value={routineProcData.tor_specifications}
                                            onChange={e => setRoutineProcData('tor_specifications', e.target.value)}
                                            className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-2.5"
                                            rows="3"
                                            placeholder="คำอธิบายขอบเขตความต้องการ เช่น รายละเอียดคุณสมบัติสินค้าหรือผู้รับจ้าง..."
                                        />
                                    </div>
                                </div>

                                {/* Items Section */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-gray-800 text-[11px]">📦 รายการวัสดุ / สิ่งของที่จัดซื้อจัดจ้าง</h4>
                                        <button
                                            type="button"
                                            onClick={addRoutineProcItem}
                                            className="text-purple-600 hover:text-purple-800 text-[11px] font-bold"
                                        >
                                            ➕ เพิ่มรายการสินค้า
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {routineProcItems.map((item, idx) => (
                                            <div key={idx} className="flex flex-col sm:flex-row gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100 items-end">
                                                <div className="flex-1 w-full">
                                                    <label className="block text-[9px] text-gray-500 mb-1">รายการ/รายละเอียดพัสดุ</label>
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={e => updateRoutineProcItem(idx, 'description', e.target.value)}
                                                        className="w-full text-xs rounded-lg border-gray-200 p-2"
                                                        placeholder="เช่น กระดาษดับเบิ้ลเอ A4"
                                                        required
                                                    />
                                                </div>
                                                <div className="w-20">
                                                    <label className="block text-[9px] text-gray-500 mb-1">จำนวน</label>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={e => updateRoutineProcItem(idx, 'quantity', e.target.value)}
                                                        className="w-full text-xs rounded-lg border-gray-200 p-2"
                                                        min="0.01"
                                                        step="0.01"
                                                        required
                                                    />
                                                </div>
                                                <div className="w-20">
                                                    <label className="block text-[9px] text-gray-500 mb-1">หน่วยนับ</label>
                                                    <input
                                                        type="text"
                                                        value={item.unit}
                                                        onChange={e => updateRoutineProcItem(idx, 'unit', e.target.value)}
                                                        className="w-full text-xs rounded-lg border-gray-200 p-2"
                                                        placeholder="รีม/เครื่อง"
                                                        required
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="block text-[9px] text-gray-500 mb-1">ราคา/หน่วย (บาท)</label>
                                                    <input
                                                        type="number"
                                                        value={item.unit_price}
                                                        onChange={e => updateRoutineProcItem(idx, 'unit_price', e.target.value)}
                                                        className="w-full text-xs rounded-lg border-gray-200 p-2"
                                                        min="0"
                                                        step="0.01"
                                                        required
                                                    />
                                                </div>
                                                <div className="w-20 text-right py-2 text-[11px] font-bold text-gray-800">
                                                    {(item.quantity * item.unit_price).toLocaleString()} บ.
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRoutineProcItem(idx)}
                                                    className="bg-red-50 hover:bg-red-100 text-red-700 p-2 rounded-xl"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="text-right font-extrabold text-xs text-purple-900 bg-purple-50 p-3 rounded-2xl">
                                        รวมยอดรวมจัดซื้อจัดจ้างทั้งสิ้น: {calculateRoutineProcTotal().toLocaleString()} บาท
                                    </div>
                                </div>

                                {/* Committee Section */}
                                <div className="space-y-4 border-t pt-4">
                                    <h4 className="font-bold text-gray-800 text-[11px]">👥 แต่งตั้งคณะกรรมการพัสดุ</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Purchasing Committee */}
                                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 space-y-3">
                                            <h5 className="font-bold text-xs text-purple-900">👥 คณะกรรมการกำหนดราคากลาง/ซื้อจ้าง</h5>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 mb-1">ประธานกรรมการ</label>
                                                <select
                                                    value={routineProcData.purchasing_chair}
                                                    onChange={e => setRoutineProcData('purchasing_chair', e.target.value)}
                                                    className="w-full text-xs rounded-lg border-gray-200 p-2"
                                                >
                                                    <option value="">เลือกรายชื่อ...</option>
                                                    {allUsers.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.position})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 mb-1">กรรมการคนที่ 1</label>
                                                <select
                                                    value={routineProcData.purchasing_member1}
                                                    onChange={e => setRoutineProcData('purchasing_member1', e.target.value)}
                                                    className="w-full text-xs rounded-lg border-gray-200 p-2"
                                                >
                                                    <option value="">เลือกรายชื่อ...</option>
                                                    {allUsers.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.position})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 mb-1">กรรมการคนที่ 2</label>
                                                <select
                                                    value={routineProcData.purchasing_member2}
                                                    onChange={e => setRoutineProcData('purchasing_member2', e.target.value)}
                                                    className="w-full text-xs rounded-lg border-gray-200 p-2"
                                                >
                                                    <option value="">เลือกรายชื่อ...</option>
                                                    {allUsers.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.position})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Inspection Committee */}
                                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 space-y-3">
                                            <h5 className="font-bold text-xs text-amber-800">👥 คณะกรรมการตรวจรับพัสดุ</h5>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 mb-1">ประธานกรรมการตรวจรับ</label>
                                                <select
                                                    value={routineProcData.inspection_chair}
                                                    onChange={e => setRoutineProcData('inspection_chair', e.target.value)}
                                                    className="w-full text-xs rounded-lg border-gray-200 p-2"
                                                >
                                                    <option value="">เลือกรายชื่อ...</option>
                                                    {allUsers.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.position})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 mb-1">กรรมการคนที่ 1</label>
                                                <select
                                                    value={routineProcData.inspection_member1}
                                                    onChange={e => setRoutineProcData('inspection_member1', e.target.value)}
                                                    className="w-full text-xs rounded-lg border-gray-200 p-2"
                                                >
                                                    <option value="">เลือกรายชื่อ...</option>
                                                    {allUsers.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.position})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 mb-1">กรรมการคนที่ 2</label>
                                                <select
                                                    value={routineProcData.inspection_member2}
                                                    onChange={e => setRoutineProcData('inspection_member2', e.target.value)}
                                                    className="w-full text-xs rounded-lg border-gray-200 p-2"
                                                >
                                                    <option value="">เลือกรายชื่อ...</option>
                                                    {allUsers.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.position})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 border-t pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
                                    >
                                        💾 บันทึกจัดซื้อและตัดงบประมาณ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRoutinePlanForProc(null)}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-2.5 px-6 rounded-xl transition-all"
                                    >
                                        ยกเลิก
                                    </button>
                                </div>
                            </form>

                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderActionPlanReportTab = () => {
        const getColumnIndexBySourceName = (name) => {
            if (!name) return -1;
            const lowercaseName = name.toLowerCase();
            if (lowercaseName.includes('ปวช') || lowercaseName.includes('ป.ว.ช')) return 0;
            if (lowercaseName.includes('ปวส') || lowercaseName.includes('ป.ว.ส')) return 1;
            if (lowercaseName.includes('ระยะสั้น')) return 2;
            if (lowercaseName.includes('ทวิศึกษา')) return 3;
            if (lowercaseName.includes('จัดการ')) return 4;
            if (lowercaseName.includes('พัฒนา')) return 5;
            if (lowercaseName.includes('บกศ') || lowercaseName.includes('บ.ก.ศ') || lowercaseName.includes('บำรุงการศึกษา')) return 6;
            return -1;
        };

        const reportStructure = [
            { id: '1', title: '1. งบบุคลากร', isParent: true },
            { id: '1.1', title: '1.1 ครูอัตราจ้าง 6 อัตรา', parentId: '1' },
            { id: '1.2', title: '1.2 ค่าสมทบประกันสังคมของครูอัตราจ้าง 9 อัตรา', parentId: '1' },
            { id: '1.3', title: '1.3 เจ้าหน้าที่ 15 อัตรา', parentId: '1' },
            { id: '1.4', title: '1.4 ค่าสมทบประกันสังคมของเจ้าหน้าที่ 16 อัตรา', parentId: '1' },
            { id: '2', title: '2. งบดำเนินงาน', isParent: true },
            { id: '2.1', title: '2.1 ค่าตอบแทน', isSubParent: true, parentId: '2' },
            { id: '2.1.1', title: '2.1.1 จ้างเหมาบริการเจ้าหน้าที่', parentId: '2.1' },
            { id: '2.1.2', title: '2.1.2 ค่าตอบแทนสอนเกินภาระงานครู', parentId: '2.1' },
            { id: '2.1.3', title: '2.1.3 ค่าตอบแทนครูสอนระยะสั้นรายชั่วโมง 7 ราย', parentId: '2.1' },
            { id: '2.1.4', title: '2.1.4 ค่าตอบแทนครูสอนระยะสั้นนอกเวลาราชการ', parentId: '2.1' },
            { id: '2.2', title: '2.2 ค่าใช้สอย', isSubParent: true, parentId: '2' },
            { id: '2.2.1', title: '2.2.1 ค่าเดินทางไปราชการ', parentId: '2.2' },
            { id: '2.2.2', title: '2.2.2 ค่าซ่อมแซมพาหนะและค่าขนส่ง', parentId: '2.2' },
            { id: '2.2.3', title: '2.2.3 ค่าซ่อมแซมครุภัณฑ์', parentId: '2.2' },
            { id: '2.2.4', title: '2.2.4 ค่าขยะและสิ่งปฏิกูล', parentId: '2.2' },
            { id: '2.2.5', title: '2.2.5 ค่าโฆษณาและเผยแพร่', parentId: '2.2' },
            { id: '3', title: '3. ค่าวัสดุ', isParent: true },
            { id: '3.1', title: '3.1 วัสดุงานอาคาร', parentId: '3' },
            { id: '3.2', title: '3.2 วัสดุสำนักงาน', isSubParent: true, parentId: '3' },
            { id: '3.2.1', title: 'ฝ่ายวิชาการ', parentId: '3.2' },
            { id: '3.2.2', title: 'ฝ่ายพัฒนากิจการนักเรียนนักศึกษา', parentId: '3.2' },
            { id: '3.2.3', title: 'ฝ่ายบริหารทรัพยากร', parentId: '3.2' },
            { id: '3.2.4', title: 'ฝ่ายแผนฯ', parentId: '3.2' },
            { id: '3.3', title: '3.3 วัสดุเชื้อเพลิงและหล่อลื่น', parentId: '3' },
            { id: '4', title: '4. วัสดุการศึกษา', isParent: true },
            { id: '4.1', title: '4.1 หลักสูตรวิชาชีพระยะสั้น', parentId: '4' },
            { id: '4.2', title: '4.2 สาขาวิชาช่างยนต์', parentId: '4' },
            { id: '4.3', title: '4.3 สาขาวิชาไฟฟ้ากำลัง', parentId: '4' },
            { id: '4.4', title: '4.4 สาขาวิชาเทคนิคพื้นฐาน', parentId: '4' },
            { id: '4.5', title: '4.5 สาขาวิชาอิเล็กทรอนิกส์', parentId: '4' },
            { id: '4.6', title: '4.6 สาขาวิชาการบัญชี', parentId: '4' },
            { id: '4.7', title: '4.7 สาขาวิชาการตลาด', parentId: '4' },
            { id: '4.8', title: '4.8 สาขาวิชาเทคโนโลยีสารสนเทศฯ', parentId: '4' },
            { id: '4.9', title: '4.9 แผนกสามัญสัมพันธ์', parentId: '4' },
            { id: '5', title: '5. ค่าสาธารณูปโภค', isParent: true },
            { id: '5.1', title: '5.1 ค่าไฟฟ้า', parentId: '5' },
            { id: '5.2', title: '5.2 ค่าน้ำประปา', parentId: '5' },
            { id: '5.3', title: '5.3 ค่าโทรศัพท์', parentId: '5' },
            { id: '5.4', title: '5.4 ค่าไปรษณีย์โทรเลข', parentId: '5' },
            { id: '5.5', title: '5.5 ค่าบริการด้านสื่อสารโทรคมนาคม', parentId: '5' },
            { id: '6', title: '6. โครงการ', isParent: true },
            { id: '6.1', title: '6.1 โครงการฝ่ายวิชาการ', parentId: '6' },
            { id: '6.2', title: '6.2 โครงการฝ่ายพัฒนากิจการนักเรียน นักศึกษา', parentId: '6' },
            { id: '6.3', title: '6.3 โครงการฝ่ายบริหารทรัพยากร', parentId: '6' },
            { id: '6.4', title: '6.4 โครงการฝ่ายแผนงานและความร่วมมือ', parentId: '6' },
            { id: '7', title: '7. สำรองจ่าย', isParent: true },
            { id: '7.1', title: '7.1 สำรองจ่าย', parentId: '7' }
        ];

        // Initialize rowData mapping
        const rowData = {};
        reportStructure.forEach(item => {
            rowData[item.id] = {
                id: item.id,
                title: item.title,
                isParent: item.isParent,
                isSubParent: item.isSubParent,
                planBudget: 0,
                spentBySource: Array(7).fill(0),
            };
        });

        // 3. Populate Routine Budget Plans
        routinePlans.forEach(plan => {
            const cat = plan.report_category;
            if (!cat || !rowData[cat]) return;

            const alloc = parseFloat(plan.allocated_amount || 0);
            const spent = parseFloat(plan.spent_amount || 0);

            // Add to planned budget
            rowData[cat].planBudget += alloc;

            // Resolve funding source column
            const sourceName = plan.funding_source?.name;
            const colIdx = getColumnIndexBySourceName(sourceName);
            if (colIdx !== -1) {
                rowData[cat].spentBySource[colIdx] += spent;
            }
        });

        // 4. Populate Projects (Row 6.1 - 6.4)
        allProjectsMaster.forEach(p => {
            if (p.status !== 'approved' && p.status !== 'budget_approved') return;

            // Resolve report category based on explicit report_category or project's department
            let cat = p.report_category;
            if (!cat) {
                if (p.department_name?.includes('วิชาการ')) cat = '6.1';
                else if (p.department_name?.includes('พัฒนากิจการ') || p.department_name?.includes('นักเรียน')) cat = '6.2';
                else if (p.department_name?.includes('บริหาร') || p.department_name?.includes('พัสดุ') || p.department_name?.includes('บริหารทรัพยากร')) cat = '6.3';
                else if (p.department_name?.includes('วางแผน') || p.department_name?.includes('แผน')) cat = '6.4';
                else cat = '6.1'; // fallback
            }

            const alloc = parseFloat(p.allocated_amount || p.allocated_budget || 0);
            const spent = parseFloat(p.spent_amount || 0);

            if (rowData[cat]) {
                rowData[cat].planBudget += alloc;

                const colIdx = getColumnIndexBySourceName(p.funding_source_name);
                if (colIdx !== -1) {
                    rowData[cat].spentBySource[colIdx] += spent;
                }
            }
        });

        // 5. Aggregate Parent Rows
        const aggregate = (parentKey, childKeys) => {
            childKeys.forEach(k => {
                if (rowData[k]) {
                    rowData[parentKey].planBudget += rowData[k].planBudget;
                    for (let i = 0; i < 7; i++) {
                        rowData[parentKey].spentBySource[i] += rowData[k].spentBySource[i];
                    }
                }
            });
        };

        // Subparents first
        aggregate('2.1', ['2.1.1', '2.1.2', '2.1.3', '2.1.4']);
        aggregate('2.2', ['2.2.1', '2.2.2', '2.2.3', '2.2.4', '2.2.5']);
        aggregate('3.2', ['3.2.1', '3.2.2', '3.2.3', '3.2.4']);

        // Main parents
        aggregate('1', ['1.1', '1.2', '1.3', '1.4']);
        aggregate('2', ['2.1', '2.2']);
        aggregate('3', ['3.1', '3.2', '3.3']);
        aggregate('4', ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9']);
        aggregate('5', ['5.1', '5.2', '5.3', '5.4', '5.5']);
        aggregate('6', ['6.1', '6.2', '6.3', '6.4']);
        aggregate('7', ['7.1']);

        // 6. Calculate Top Summary Rows
        const transferBySource = Array(7).fill(0);
        centralAllocations.forEach(a => {
            const colIdx = getColumnIndexBySourceName(a.funding_source?.name);
            if (colIdx !== -1) {
                transferBySource[colIdx] += parseFloat(a.amount || 0);
            }
        });

        const estimateBySource = Array(7).fill(0);
        routinePlans.forEach(plan => {
            const colIdx = getColumnIndexBySourceName(plan.funding_source?.name);
            if (colIdx !== -1) {
                estimateBySource[colIdx] += parseFloat(plan.allocated_amount || 0);
            }
        });
        allProjectsMaster.forEach(p => {
            if (p.status !== 'approved' && p.status !== 'budget_approved') return;
            const colIdx = getColumnIndexBySourceName(p.funding_source_name);
            if (colIdx !== -1) {
                estimateBySource[colIdx] += parseFloat(p.allocated_amount || p.allocated_budget || 0);
            }
        });

        // 7. Calculate Grand Totals
        const grandPlanBudget = ['1', '2', '3', '4', '5', '6', '7'].reduce((sum, k) => sum + rowData[k].planBudget, 0);
        const grandSpentBySource = Array(7).fill(0);
        for (let i = 0; i < 7; i++) {
            grandSpentBySource[i] = ['1', '2', '3', '4', '5', '6', '7'].reduce((sum, k) => sum + rowData[k].spentBySource[i], 0);
        }

        const grandSpentTotal = grandSpentBySource.reduce((sum, val) => sum + val, 0);
        const grandRemainingPlan = grandPlanBudget - grandSpentTotal;

        // 8. Calculate Bottom Balances
        const cashBalanceBySource = Array(7).fill(0);
        for (let i = 0; i < 7; i++) {
            cashBalanceBySource[i] = transferBySource[i] - grandSpentBySource[i];
        }
        const totalCashBalance = transferBySource.reduce((sum, val) => sum + val, 0) - grandSpentTotal;

        const planBalanceBySource = Array(7).fill(0);
        for (let i = 0; i < 7; i++) {
            planBalanceBySource[i] = estimateBySource[i] - grandSpentBySource[i];
        }
        const totalPlanBalance = estimateBySource.reduce((sum, val) => sum + val, 0) - grandSpentTotal;

        return (
            <div className="space-y-6">
                <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                        body {
                            background: white !important;
                            color: black !important;
                        }
                        /* Hide sidebar, dashboard header, nav elements and non-printable items */
                        aside, nav, header, footer, .no-print, [role="navigation"], button {
                            display: none !important;
                        }
                        /* Ensure the printable area takes up full page width */
                        .print-area {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            border: none !important;
                            box-shadow: none !important;
                        }
                        table {
                            font-size: 8px !important;
                            width: 100% !important;
                        }
                        th, td {
                            padding: 4px 2px !important;
                        }
                    }
                `}} />
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6 print-area">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-800">📊 รายงานงบรายจ่ายแผนปฏิบัติราชการ</h2>
                            <p className="text-xs text-gray-500 mt-1">วิทยาลัยสารพัดช่างน่าน ปีงบประมาณ พ.ศ. 2569</p>
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 no-print"
                        >
                            🖨️ พิมพ์รายงาน / บันทึก PDF
                        </button>
                    </div>

                    <div className="overflow-x-auto border border-gray-200 rounded-2xl max-w-full">
                        <table className="w-full border-collapse text-xs text-gray-700 min-w-[1200px] table-fixed">
                            <thead>
                                <tr className="bg-gray-100 border-b border-gray-200 text-[11px] font-bold text-gray-900 text-center">
                                    <th rowSpan="2" className="py-4 px-3 text-left border-r border-gray-200 w-[280px]">รายการ</th>
                                    <th rowSpan="2" className="py-4 px-3 border-r border-gray-200 w-[110px]">ตั้งงบ</th>
                                    <th colSpan="3" className="py-2 border-b border-gray-200 border-r text-center font-bold">งบดำเนินงาน</th>
                                    <th rowSpan="2" className="py-4 px-2 border-r border-gray-200 w-[95px]">งบทวิศึกษา</th>
                                    <th rowSpan="2" className="py-4 px-2 border-r border-gray-200 w-[95px]">อุดหนุนเพื่อการจัดการฯ</th>
                                    <th rowSpan="2" className="py-4 px-2 border-r border-gray-200 w-[95px]">อุดหนุนพัฒนาฯ</th>
                                    <th rowSpan="2" className="py-4 px-2 border-r border-gray-200 w-[95px]">บกศ.</th>
                                    <th rowSpan="2" className="py-4 px-2 border-r border-gray-200 w-[110px]">รวมค่าใช้จ่าย</th>
                                    <th rowSpan="2" className="py-4 px-2 w-[110px]">คงเหลือตามแผนฯ</th>
                                </tr>
                                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-700 text-center">
                                    <th className="py-2 px-2 border-r border-gray-200 w-[90px]">ปวช.</th>
                                    <th className="py-2 px-2 border-r border-gray-200 w-[90px]">ปวส.</th>
                                    <th className="py-2 px-2 border-r border-gray-200 w-[95px]">ระยะสั้น</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* ประมาณการรับ */}
                                <tr className="bg-amber-50/50 border-b border-gray-200 font-bold text-[11px] text-gray-900">
                                    <td className="py-3 px-3 text-left border-r border-gray-200">ประมาณการรับ (ตามแผน)</td>
                                    <td className="py-3 px-2 text-right border-r border-gray-200">
                                        {estimateBySource.reduce((sum, v) => sum + v, 0).toLocaleString()}
                                    </td>
                                    {estimateBySource.map((val, idx) => (
                                        <td key={idx} className="py-3 px-2 text-right border-r border-gray-200">
                                            {val > 0 ? val.toLocaleString() : '-'}
                                        </td>
                                    ))}
                                    <td className="py-3 px-2 text-right border-r border-gray-200">
                                        {estimateBySource.reduce((sum, v) => sum + v, 0).toLocaleString()}
                                    </td>
                                    <td className="py-3 px-2 text-right">-</td>
                                </tr>

                                {/* ได้รับเงินโอนจริง */}
                                <tr className="bg-red-50/30 border-b border-gray-200 font-bold text-[11px] text-red-700">
                                    <td className="py-3 px-3 text-left border-r border-gray-200 text-red-700">ได้รับเงินโอนฯ จริง</td>
                                    <td className="py-3 px-2 text-right border-r border-gray-200">
                                        {transferBySource.reduce((sum, v) => sum + v, 0).toLocaleString()}
                                    </td>
                                    {transferBySource.map((val, idx) => (
                                        <td key={idx} className="py-3 px-2 text-right border-r border-gray-200">
                                            {val > 0 ? val.toLocaleString() : '-'}
                                        </td>
                                    ))}
                                    <td className="py-3 px-2 text-right border-r border-gray-200">
                                        {transferBySource.reduce((sum, v) => sum + v, 0).toLocaleString()}
                                    </td>
                                    <td className="py-3 px-2 text-right">-</td>
                                </tr>

                                {/* Content rows */}
                                {reportStructure.map(item => {
                                    const row = rowData[item.id];
                                    const totalSpent = row.spentBySource.reduce((sum, v) => sum + v, 0);
                                    const remaining = row.planBudget - totalSpent;
                                    
                                    let rowClass = "border-b border-gray-100 hover:bg-gray-50/50";
                                    let titleClass = "py-2 px-3 text-left border-r border-gray-200";
                                    if (row.isParent) {
                                        rowClass = "bg-gray-100/60 border-b border-gray-200 font-bold text-gray-900";
                                        titleClass = "py-2.5 px-3 text-left border-r border-gray-200";
                                    } else if (row.isSubParent) {
                                        rowClass = "bg-gray-50/50 border-b border-gray-200 font-bold text-gray-800";
                                        titleClass = "py-2 px-4 text-left border-r border-gray-200 pl-6";
                                    } else {
                                        titleClass = `py-2 px-3 text-left border-r border-gray-200 text-gray-600 ${row.id.split('.').length > 2 ? 'pl-8' : 'pl-6'}`;
                                    }

                                    return (
                                        <tr key={row.id} className={rowClass}>
                                            <td className={titleClass}>{row.title}</td>
                                            <td className="py-2 px-2 text-right border-r border-gray-200 font-medium">
                                                {row.planBudget > 0 ? row.planBudget.toLocaleString() : '-'}
                                            </td>
                                            {row.spentBySource.map((val, idx) => (
                                                <td key={idx} className="py-2 px-2 text-right border-r border-gray-200">
                                                    {val > 0 ? val.toLocaleString() : '-'}
                                                </td>
                                            ))}
                                            <td className="py-2 px-2 text-right border-r border-gray-200 font-bold text-gray-800">
                                                {totalSpent > 0 ? totalSpent.toLocaleString() : '-'}
                                            </td>
                                            <td className={`py-2 px-2 text-right font-bold ${remaining < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                                                {row.planBudget > 0 || totalSpent > 0 ? remaining.toLocaleString() : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* รวมค่าใช้จ่ายทั้งสิ้น */}
                                <tr className="bg-red-50/40 border-y-2 border-red-200 font-bold text-[11px] text-red-700">
                                    <td className="py-3 px-3 text-left border-r border-gray-200">รวมค่าใช้จ่ายทั้งสิ้น</td>
                                    <td className="py-3 px-2 text-right border-r border-gray-200">
                                        {grandPlanBudget.toLocaleString()}
                                    </td>
                                    {grandSpentBySource.map((val, idx) => (
                                        <td key={idx} className="py-3 px-2 text-right border-r border-gray-200">
                                            {val > 0 ? val.toLocaleString() : '-'}
                                        </td>
                                    ))}
                                    <td className="py-3 px-2 text-right border-r border-gray-200">
                                        {grandSpentTotal.toLocaleString()}
                                    </td>
                                    <td className={`py-3 px-2 text-right ${grandRemainingPlan < 0 ? 'text-red-700' : 'text-emerald-800'}`}>
                                        {grandRemainingPlan.toLocaleString()}
                                    </td>
                                </tr>

                                {/* คงเหลือเงินโอนจริง */}
                                <tr className="bg-blue-50/20 border-b border-gray-200 font-bold text-[11px] text-blue-900">
                                    <td className="py-3 px-3 text-left border-r border-gray-200">คงเหลือเงินโอนจริง (โอนจริง - จ่ายจริง)</td>
                                    <td className="py-3 px-2 text-right border-r border-gray-200">
                                        {totalCashBalance.toLocaleString()}
                                    </td>
                                    {cashBalanceBySource.map((val, idx) => (
                                        <td key={idx} className={`py-3 px-2 text-right border-r border-gray-200 ${val < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                                            {val.toLocaleString()}
                                        </td>
                                    ))}
                                    <td className="py-3 px-2 text-right border-r border-gray-200">
                                        {totalCashBalance.toLocaleString()}
                                    </td>
                                    <td className="py-3 px-2 text-right">-</td>
                                </tr>

                                {/* คงเหลือเงินตามแผนฯ */}
                                <tr className="bg-emerald-50/20 border-b border-gray-200 font-bold text-[11px] text-emerald-950">
                                    <td className="py-3 px-3 text-left border-r border-gray-200">คงเหลือเงินตามแผนฯ (ประมาณการ - จ่ายจริง)</td>
                                    <td className="py-3 px-2 text-right border-r border-gray-200">
                                        {totalPlanBalance.toLocaleString()}
                                    </td>
                                    {planBalanceBySource.map((val, idx) => (
                                        <td key={idx} className={`py-3 px-2 text-right border-r border-gray-200 ${val < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                                            {val.toLocaleString()}
                                        </td>
                                    ))}
                                    <td className="py-3 px-2 text-right border-r border-gray-200">
                                        {totalPlanBalance.toLocaleString()}
                                    </td>
                                    <td className="py-3 px-2 text-right font-black">
                                        {totalPlanBalance.toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderReviewsTab = () => {
        if (!planHeadData) {
            return (
                <div className="rounded-2xl border border-purple-100 bg-white p-8 text-center shadow-sm font-sans">
                    <p className="text-purple-900 font-bold text-base">กำลังโหลดคิวอนุมัติโครงการ...</p>
                </div>
            );
        }

        const prelimCount = planHeadData.preliminaryQueue?.filter(p => p.status === 'preliminary').length || 0;
        const allocCount = planHeadData.preliminaryQueue?.filter(p => p.status === 'budget_approved').length || 0;
        const rejectCount = planHeadData.preliminaryQueue?.filter(p => p.status === 'budget_rejected').length || 0;

        return (
            <div className="space-y-8 font-sans">
                {/* 1. Preliminary Budget Allocation Section */}
                <div className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
                    <div className="border-b border-amber-200 bg-gradient-to-r from-amber-500/15 via-purple-50 to-indigo-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">⚖️</span>
                                <h3 className="text-lg font-black text-purple-950">
                                    พิจารณาจัดสรรงบประมาณโครงการเบื้องต้น (Preliminary Budget Allocation)
                                </h3>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                                คณะกรรมการและงานแผนงานพิจารณากำหนดกรอบงบประมาณและแหล่งเงินทุน 7 หมวด เพื่อให้ผู้เสนอจัดทำรายละเอียดโครงการฉบับสมบูรณ์
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {isPlanStaff && (
                                <button
                                    onClick={openDirectAllocateModal}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                                    title="เพิ่มโครงการและระบุวงเงินจัดสรรโดยตรง"
                                >
                                    <span>➕</span> เพิ่มโครงการ & จัดสรรงบทันที
                                </button>
                            )}
                            <div className="flex gap-1.5 text-xs font-bold">
                                <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-xl border border-amber-300">
                                    รอจัดสรร: {prelimCount}
                                </span>
                                <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-xl border border-emerald-300">
                                    จัดสรรแล้ว: {allocCount}
                                </span>
                                <span className="bg-rose-100 text-rose-900 px-2.5 py-1 rounded-xl border border-rose-300">
                                    ไม่อนุมัติ: {rejectCount}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-amber-100 bg-amber-50/40 text-xs font-bold uppercase text-purple-950 whitespace-nowrap">
                                    <th className="px-6 py-3.5">ชื่อโครงการ</th>
                                    <th className="px-6 py-3.5">ฝ่ายงาน / ผู้เสนอ</th>
                                    <th className="px-6 py-3.5">งบประมาณเสนอขอ</th>
                                    <th className="px-6 py-3.5">วงเงินจัดสรรจริง & แหล่งเงิน</th>
                                    <th className="px-6 py-3.5 text-center">สถานะการพิจารณา</th>
                                    <th className="px-6 py-3.5 text-right">การพิจารณาจัดสรร</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100/60 text-sm">
                                {(!planHeadData.preliminaryQueue || planHeadData.preliminaryQueue.length === 0) ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-sm text-slate-500">
                                            ยังไม่มีรายการข้อเสนอโครงการเบื้องต้นในระบบ
                                        </td>
                                    </tr>
                                ) : (
                                    planHeadData.preliminaryQueue.map((p) => {
                                        const fundingName = p.funding_source?.name || p.budget?.funding_source?.name || 'ยังไม่ระบุ';
                                        return (
                                            <tr key={p.id} className="hover:bg-amber-50/20 transition-all">
                                                <td className="px-6 py-4 font-bold text-slate-900 max-w-xs">
                                                    <div>{p.title}</div>
                                                    <div className="text-[11px] text-slate-400 font-normal mt-0.5">ปีงบประมาณ: {p.academic_year}</div>
                                                    {p.committee_comment && (
                                                        <div className="text-[11px] text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 mt-1 inline-block">
                                                            💬 มติ: {p.committee_comment}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-800 text-xs">{p.department?.name || 'ฝ่ายงานทั่วไป'}</div>
                                                    <div className="text-[11px] text-purple-600 font-medium">{p.user?.name || 'ไม่ระบุชื่อ'}</div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-800 text-xs whitespace-nowrap">
                                                    {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(p.proposed_budget || p.estimated_budget)}
                                                </td>
                                                <td className="px-6 py-4 text-xs whitespace-nowrap">
                                                    {p.status === 'budget_approved' || p.allocated_budget > 0 ? (
                                                        <div>
                                                            <div className="font-extrabold text-emerald-700">
                                                                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(p.allocated_budget || p.estimated_budget)}
                                                            </div>
                                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold mt-0.5 inline-block">
                                                                {fundingName} ({p.report_category || '6.1'})
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 font-medium italic">- ยังไม่จัดสรร -</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    {p.status === 'budget_approved' && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                                                            ✅ อนุมัติจัดสรรงบแล้ว
                                                        </span>
                                                    )}
                                                    {p.status === 'budget_rejected' && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-300">
                                                            ❌ ไม่อนุมัติงบประมาณ
                                                        </span>
                                                    )}
                                                    {p.status === 'preliminary' && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300 animate-pulse">
                                                            🟡 รอการพิจารณาจัดสรร
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                                        <button
                                                            onClick={() => openCommitteeModal(p)}
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                            title="พิจารณาอนุมัติจัดสรรงบประมาณ หรือไม่อนุมัติ"
                                                        >
                                                            ⚖️ พิจารณาจัดสรรงบ
                                                        </button>
                                                        <Link
                                                            href={route('projects.show', p.id)}
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-100 px-2.5 py-2 text-xs font-bold text-purple-900 hover:bg-purple-200 transition-all shrink-0"
                                                            title="ดูรายละเอียด"
                                                        >
                                                            👁️
                                                        </Link>
                                                        {(role === 'admin' || auth.user.is_admin) && (
                                                            <button
                                                                onClick={() => handleDeleteProject(p)}
                                                                className="inline-flex items-center gap-1 rounded-xl bg-rose-100 px-2.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-200 transition-all shrink-0"
                                                                title="ลบข้อเสนอโครงการ"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. Full 6-Step Workflow Approval Queue */}
                <div className="overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm">
                    <div className="border-b border-purple-100 bg-purple-50/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                            <h3 className="text-lg font-black text-purple-950">📋 คิวตรวจสอบและอนุมัติโครงการตามสายงาน (6-Step Review Queue)</h3>
                            <p className="text-xs text-slate-600 mt-0.5">ตรวจสอบรายละเอียดข้อเสนอโครงการฉบับสมบูรณ์ และอนุมัติส่งต่อตามลำดับสายงาน 6 ขั้นตอน</p>
                        </div>
                        <div className="bg-purple-100/70 text-purple-900 px-3 py-1 rounded-xl text-xs font-bold border border-purple-200">
                            รออนุมัติในระบบ: {planHeadData.planHeadQueue?.length || 0} รายการ
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-purple-100 bg-purple-50/30 text-xs font-bold uppercase text-purple-900 whitespace-nowrap">
                                    <th className="px-6 py-3.5">ชื่อโครงการ</th>
                                    <th className="px-6 py-3.5">ผู้เสนอโครงการ / ฝ่ายงาน</th>
                                    <th className="px-6 py-3.5">งบประมาณโครงการ</th>
                                    <th className="px-6 py-3.5 text-center">สถานะและขั้นตอนอนุมัติ</th>
                                    <th className="px-6 py-3.5 text-right">การดำเนินการ (Full Control)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-100 text-sm">
                                {(!planHeadData.planHeadQueue || planHeadData.planHeadQueue.length === 0) ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-500">
                                            ไม่มีรายการโครงการรออนุมัติในคิวงานขณะนี้
                                        </td>
                                    </tr>
                                ) : (
                                    planHeadData.planHeadQueue.map((p) => (
                                        <tr key={p.id} className="hover:bg-purple-50/20 transition-all">
                                            <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate" title={p.title}>
                                                {p.title}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800 text-xs">{p.user?.name || 'ไม่ระบุชื่อ'}</div>
                                                <div className="text-[11px] text-purple-600 font-medium">{p.department?.name || 'ฝ่ายงานทั่วไป'}</div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-purple-700 text-xs whitespace-nowrap">
                                                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(p.estimated_budget)}
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                {renderProjectProgressBar(p.status, p.current_approval_step)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                                    <Link
                                                        href={route('projects.show', p.id)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                        title="ตรวจสอบและจัดการโครงการ"
                                                    >
                                                        🔍 ตรวจสอบ ➔
                                                    </Link>
                                                    {(p.status === 'draft' || p.status === 'rejected') && (
                                                        <button
                                                            onClick={() => handleResubmitProject(p)}
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                            title="ยื่นเสนอขออนุมัติเพื่อดำเนินงานต่อ"
                                                        >
                                                            🚀 ยื่นขออนุมัติ
                                                        </button>
                                                    )}
                                                    {(role === 'admin' || auth.user.is_admin) && p.status !== 'approved' && (
                                                        <button
                                                            onClick={() => handleAdminApproveProject(p, 'step')}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-2.5 py-2 text-xs font-extrabold text-purple-950 shadow-md hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                            title="อนุมัติข้ามขั้นตอนปัจจุบันทันที (Admin Step Override)"
                                                        >
                                                            ⚡ อนุมัติลัด
                                                        </button>
                                                    )}
                                                    {(role === 'admin' || auth.user.is_admin) && p.status !== 'approved' && (
                                                        <button
                                                            onClick={() => handleAdminApproveProject(p, 'full')}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 px-2.5 py-2 text-xs font-extrabold text-white shadow-md hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                            title="อนุมัติรวดเดียวสมบูรณ์ 6 ขั้นตอน (Admin Full 6-Step Override)"
                                                        >
                                                            👑 อนุมัติรวดเดียว
                                                        </button>
                                                    )}
                                                    {(role === 'admin' || auth.user.is_admin) && (
                                                        <Link
                                                            href={route('projects.edit', p.id)}
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-3 py-2 text-xs font-bold text-purple-950 shadow-md shadow-amber-400/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                            title="แก้ไขโครงการ"
                                                        >
                                                            ✏️ แก้ไข
                                                        </Link>
                                                    )}
                                                    {(role === 'admin' || auth.user.is_admin) && (
                                                        <button
                                                            onClick={() => handleDeleteProject(p)}
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                            title="ลบโครงการ"
                                                        >
                                                            🗑️ ลบ
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderClearingsTab = () => {
        if (!planHeadData) {
            return (
                <div className="rounded-2xl border border-purple-100 bg-white p-8 text-center shadow-sm font-sans">
                    <p className="text-purple-900 font-bold text-base">กำลังโหลดรายการเงินยืม...</p>
                </div>
            );
        }
        return (
            <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
                <div className="border-b border-purple-100 bg-purple-50/50 px-6 py-4">
                    <h3 className="text-lg font-bold text-slate-900">รายการค้างเคลียร์เงินยืมทดรองราชการ</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-purple-100 bg-purple-50/30 text-xs font-bold uppercase text-purple-900">
                                <th className="px-6 py-3.5">โครงการ</th>
                                <th className="px-6 py-3.5">ผู้ยืมเงิน</th>
                                <th className="px-6 py-3.5">จำนวนเงินยืม</th>
                                <th className="px-6 py-3.5">การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-100 text-sm">
                            {(!planHeadData.advancePayments || planHeadData.advancePayments.length === 0) ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-sm text-slate-500">
                                        ไม่มีรายการค้างเคลียร์เงินยืมทดรองในระบบ
                                    </td>
                                </tr>
                            ) : (
                                planHeadData.advancePayments.map((b) => (
                                    <tr key={b.id}>
                                        <td className="px-6 py-4 font-bold text-slate-900">{b.project?.title}</td>
                                        <td className="px-6 py-4 text-slate-600">{b.project?.user?.name}</td>
                                        <td className="px-6 py-4 font-bold text-amber-700">
                                            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(b.advance_amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={route('projects.show', b.project_id)}
                                                className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200"
                                            >
                                                🧾 บันทึกใบเสร็จเคลียร์เงิน
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // 3. Procurement Head Component Rendering
    const renderProcurementTab = () => {
        if (!procurementData) {
            return (
                <div className="rounded-2xl border border-purple-100 bg-white p-8 text-center shadow-sm font-sans">
                    <p className="text-purple-900 font-bold text-base">กำลังโหลดคิวงานจัดซื้อจัดจ้าง...</p>
                </div>
            );
        }
        return (
            <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
                <div className="border-b border-purple-100 bg-purple-50/50 px-6 py-4">
                    <h3 className="text-lg font-bold text-slate-900">คิวงานจัดซื้อจัดจ้าง & แต่งตั้งกรรมการ</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-purple-100 bg-purple-50/30 text-xs font-bold uppercase text-purple-900">
                                <th className="px-6 py-3.5">ชื่อโครงการ</th>
                                <th className="px-6 py-3.5">ฝ่าย/แผนก</th>
                                <th className="px-6 py-3.5">งบประมาณจัดซื้อ</th>
                                <th className="px-6 py-3.5">สถานะกรรมการ</th>
                                <th className="px-6 py-3.5">เอกสารพัสดุ 4 ฉบับ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-100 text-sm">
                            {(!procurementData.procurementQueue || procurementData.procurementQueue.length === 0) ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-500">
                                        ไม่มีรายการคิวงานจัดซื้อจัดจ้างในระบบขณะนี้
                                    </td>
                                </tr>
                            ) : (
                                procurementData.procurementQueue.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-6 py-4 font-bold text-slate-900">{p.title}</td>
                                        <td className="px-6 py-4 text-slate-600">{p.department?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 font-bold text-purple-700">
                                            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(p.estimated_budget || 0)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {p.procurement?.committees?.length > 0 ? (
                                                <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                                                    ✓ แต่งตั้งครบแล้ว ({p.procurement.committees.length} คน)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                                                    ⏳ รอแต่งตั้งกรรมการ
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={route('projects.show', p.id)}
                                                className="inline-flex items-center rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                                            >
                                                📦 จัดการพัสดุ ➔
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // 4. Executive Component Rendering
    const renderExecutiveOverviewTab = () => {
        if (!executiveData) {
            return (
                <div className="rounded-2xl border border-purple-100 bg-white p-8 text-center shadow-sm">
                    <p className="text-purple-900 font-bold text-base">กำลังโหลดข้อมูลภาพรวมผู้บริหาร...</p>
                </div>
            );
        }
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600">งบประมาณได้รับจัดสรรรวม</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">
                            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(executiveData.budgetSummary.total_allocated)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600">ผูกพันงบประมาณแล้ว</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">
                            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(executiveData.budgetSummary.total_encumbered)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">เบิกจ่ายจริงแล้ว</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">
                            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(executiveData.budgetSummary.total_spent)}
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
                    <div className="border-b border-purple-100 bg-purple-50/50 px-6 py-4">
                        <h3 className="text-lg font-bold text-slate-900">สรุปสถิติและงบประมาณจำแนกตาม ๔ ฝ่ายหลัก และงานย่อยในสังกัด</h3>
                        <p className="text-xs text-slate-600">บริหารจัดการครอบคลุม ฝ่ายบริหารทรัพยากร, ฝ่ายยุทธศาสตร์และแผนงาน, ฝ่ายวิชาการ และ ฝ่ายพัฒนากิจการนักเรียนนักศึกษา</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-purple-100 bg-purple-50/40 text-xs font-bold uppercase text-purple-900">
                                    <th className="px-6 py-3.5">ฝ่ายหลัก / งานย่อยในสังกัด</th>
                                    <th className="px-6 py-3.5">โครงการรวม</th>
                                    <th className="px-6 py-3.5">อนุมัติแล้ว</th>
                                    <th className="px-6 py-3.5">งบประมาณเสนอขอ</th>
                                    <th className="px-6 py-3.5">เบิกจ่ายจริงแล้ว</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-100 text-sm">
                                {(executiveData.divisionTreeMetrics || []).map((mainDiv) => (
                                    <div key={`main-group-${mainDiv.id}`} className="contents">
                                        {/* Main Division Header Row */}
                                        <tr className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-950 text-white font-bold">
                                            <td className="px-6 py-3.5 text-base flex items-center gap-2">
                                                <span>🏛️</span>
                                                <span>{mainDiv.name}</span>
                                            </td>
                                            <td className="px-6 py-3.5 font-bold">{mainDiv.total_projects} โครงการ</td>
                                            <td className="px-6 py-3.5 font-bold text-emerald-300">{mainDiv.approved_projects} โครงการ</td>
                                            <td className="px-6 py-3.5 font-bold">
                                                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(mainDiv.total_estimated_budget)}
                                            </td>
                                            <td className="px-6 py-3.5 font-bold text-emerald-200">
                                                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(mainDiv.total_spent_budget)}
                                            </td>
                                        </tr>

                                        {/* Sub-work units under this main division */}
                                        {mainDiv.children && mainDiv.children.map((sub) => (
                                            <tr key={`sub-${sub.id}`} className="hover:bg-purple-50/40 text-slate-800">
                                                <td className="px-6 py-3 pl-12 font-medium flex items-center gap-2">
                                                    <span className="text-purple-400 font-mono">└─</span>
                                                    <span>{sub.name}</span>
                                                </td>
                                                <td className="px-6 py-3 text-slate-700">{sub.total_projects} โครงการ</td>
                                                <td className="px-6 py-3 text-emerald-700 font-medium">{sub.approved_projects} โครงการ</td>
                                                <td className="px-6 py-3 font-medium text-slate-900">
                                                    {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(sub.total_estimated_budget)}
                                                </td>
                                                <td className="px-6 py-3 font-medium text-emerald-700">
                                                    {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(sub.total_spent_budget)}
                                                </td>
                                            </tr>
                                        ))}
                                    </div>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderExecutiveReportsTab = () => {
        if (!executiveData) {
            return (
                <div className="rounded-2xl border border-purple-100 bg-white p-8 text-center shadow-sm">
                    <p className="text-purple-900 font-bold text-base">กำลังโหลดรายงานผู้บริหาร...</p>
                </div>
            );
        }
        return (
            <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
                <div className="border-b border-purple-100 bg-purple-50/50 px-6 py-4">
                    <h3 className="text-lg font-bold text-slate-900">เล่มรายงานสรุปประเมินผลโครงการฉบับสมบูรณ์ (PDF Stitching)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-purple-100 bg-purple-50/30 text-xs font-bold uppercase text-purple-900">
                                <th className="px-6 py-3.5">ชื่อโครงการ</th>
                                <th className="px-6 py-3.5">ฝ่ายงาน</th>
                                <th className="px-6 py-3.5">ผลการประเมิน</th>
                                <th className="px-6 py-3.5">ผู้เข้าร่วม</th>
                                <th className="px-6 py-3.5">การดาวน์โหลด</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-100 text-sm">
                            {(!executiveData.completedProjects || executiveData.completedProjects.length === 0) ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-500">
                                        ไม่มีรายการเล่มรายงานสรุปประเมินผลโครงการฉบับสมบูรณ์ขณะนี้
                                    </td>
                                </tr>
                            ) : (
                                executiveData.completedProjects.map((project) => (
                                    <tr key={project.id}>
                                        <td className="px-6 py-4 font-bold text-slate-900">{project.title}</td>
                                        <td className="px-6 py-4 text-slate-600">{project.department}</td>
                                        <td className="px-6 py-4 font-bold text-emerald-600">ประเมินแล้ว</td>
                                        <td className="px-6 py-4 text-slate-600">{project.survey_responses_count} คน</td>
                                        <td className="px-6 py-4">
                                            <a 
                                                href={route('projects.download_report', project.id)}
                                                className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                            >
                                                📄 ดาวน์โหลดเล่มรายงาน PDF
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderAllProjectsTab = () => {
        if (!allProjectsMaster || allProjectsMaster.length === 0) {
            return (
                <div className="rounded-2xl border border-purple-100 bg-white p-12 text-center text-slate-500 shadow-sm font-sans">
                    <span className="text-4xl">📁</span>
                    <p className="mt-3 font-bold text-slate-700">ไม่พบรายการโครงการในระบบ</p>
                </div>
            );
        }

        const filteredProjects = allProjectsMaster.filter((p) => {
            const matchesSearch = (p.title || '').toLowerCase().includes((projectSearch || '').toLowerCase()) ||
                (p.proposer_name || '').toLowerCase().includes((projectSearch || '').toLowerCase()) ||
                (p.department_name || '').toLowerCase().includes((projectSearch || '').toLowerCase());
            
            const matchesStatus = projectStatusFilter === 'all' ? true :
                projectStatusFilter === 'approved' ? p.status === 'approved' :
                projectStatusFilter === 'rejected' ? p.status === 'rejected' :
                projectStatusFilter === 'draft' ? p.status === 'draft' :
                p.status === 'pending_approval';

            const matchesYear = projectYearFilter === 'all' || String(p.academic_year) === String(projectYearFilter);
            const matchesDept = projectDeptFilter === 'all' || String(p.department_id) === String(projectDeptFilter);

            return matchesSearch && matchesStatus && matchesYear && matchesDept;
        });

        const totalBudgetSum = filteredProjects.reduce((acc, curr) => acc + (curr.estimated_budget || 0), 0);
        const approvedCount = filteredProjects.filter(p => p.status === 'approved' || p.current_approval_step >= 6).length;
        const pendingCount = filteredProjects.filter(p => p.status === 'pending_approval').length;

        const step1Count = filteredProjects.filter(p => p.status === 'pending_approval' && p.current_approval_step === 1).length;
        const step2Count = filteredProjects.filter(p => p.status === 'pending_approval' && p.current_approval_step === 2).length;
        const step3Count = filteredProjects.filter(p => p.status === 'pending_approval' && p.current_approval_step === 3).length;
        const step4Count = filteredProjects.filter(p => p.status === 'pending_approval' && p.current_approval_step === 4).length;
        const step5Count = filteredProjects.filter(p => p.status === 'pending_approval' && p.current_approval_step === 5).length;

        const years = Array.from(new Set(allProjectsMaster.map(p => p.academic_year))).sort().reverse();

        return (
            <div className="space-y-6 font-sans">
                {/* Header Title */}
                <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-black text-purple-950">📋 ศูนย์ติดตามโครงการทั้งหมดในระบบ (Master Project Control)</h3>
                        <p className="text-xs text-slate-500 mt-1">ผู้ดูแลระบบและเจ้าหน้าที่งานวางแผนสามารถค้นหา กรอง และติดตามสถานะกระบวนการอนุมัติ 6 ขั้นตอนของทุกโครงการได้</p>
                    </div>
                    <div className="bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 text-xs font-bold text-purple-900">
                        รวมทั้งสิ้น: <span className="text-purple-700 text-sm font-black">{filteredProjects.length}</span> โครงการ
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                    <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600">โครงการทั้งหมด</span>
                        <p className="mt-2 text-2xl font-black text-slate-900">{filteredProjects.length} โครงการ</p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600">อยู่ระหว่างเสนออนุมัติ</span>
                        <p className="mt-2 text-2xl font-black text-amber-600">{pendingCount} โครงการ</p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">อนุมัติเรียบร้อย</span>
                        <p className="mt-2 text-2xl font-black text-emerald-600">{approvedCount} โครงการ</p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">งบประมาณเสนอขอรวม</span>
                        <p className="mt-2 text-2xl font-black text-purple-950">{new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totalBudgetSum)}</p>
                    </div>
                </div>

                {/* 6-Step Workflow Visual Distribution Graph Bar */}
                <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm space-y-3 font-sans">
                    <h4 className="text-sm font-black text-purple-950 flex items-center gap-2">
                        <span>📊</span> กราฟกระจายสถานะโครงการตามขั้นตอนการอนุมัติ (6-Step Workflow Graph)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center shadow-2xs">
                            <span className="text-[11px] font-bold text-purple-800 block">ขั้นที่ 1: เสนอโครงการ</span>
                            <span className="text-xl font-black text-purple-900">{step1Count}</span>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center shadow-2xs">
                            <span className="text-[11px] font-bold text-blue-800 block">ขั้นที่ 2: หัวหน้าแผนก</span>
                            <span className="text-xl font-black text-blue-900">{step2Count}</span>
                        </div>
                        <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 text-center shadow-2xs">
                            <span className="text-[11px] font-bold text-cyan-800 block">ขั้นที่ 3: งานวางแผน</span>
                            <span className="text-xl font-black text-cyan-900">{step3Count}</span>
                        </div>
                        <div className="p-3 bg-violet-50 rounded-xl border border-violet-200 text-center shadow-2xs">
                            <span className="text-[11px] font-bold text-violet-800 block">ขั้นที่ 4: งานพัสดุ</span>
                            <span className="text-xl font-black text-violet-900">{step4Count}</span>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center shadow-2xs">
                            <span className="text-[11px] font-bold text-amber-900 block">ขั้นที่ 5: รองผู้อำนวยการ</span>
                            <span className="text-xl font-black text-amber-950">{step5Count}</span>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center shadow-2xs">
                            <span className="text-[11px] font-bold text-emerald-800 block">ขั้นที่ 6: ผู้อำนวยการอนุมัติ</span>
                            <span className="text-xl font-black text-emerald-900">{approvedCount}</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">🔍 ค้นหาโครงการ / ผู้เสนอ</label>
                        <input
                            type="text"
                            value={projectSearch}
                            onChange={(e) => setProjectSearch(e.target.value)}
                            placeholder="พิมพ์ชื่อโครงการ หรือชื่อผู้เสนอ..."
                            className="w-full text-xs rounded-xl border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">📌 สถานะโครงการ</label>
                        <select
                            value={projectStatusFilter}
                            onChange={(e) => setProjectStatusFilter(e.target.value)}
                            className="w-full text-xs rounded-xl border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                        >
                            <option value="all">ทุกสถานะ (All Statuses)</option>
                            <option value="pending_approval">อยู่ระหว่างเสนออนุมัติ (Pending)</option>
                            <option value="approved">อนุมัติเรียบร้อย (Approved)</option>
                            <option value="rejected">ตีกลับแก้ไข (Rejected)</option>
                            <option value="draft">แบบร่างยังไม่ส่ง (Draft)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">🎓 ปีการศึกษา</label>
                        <select
                            value={projectYearFilter}
                            onChange={(e) => setProjectYearFilter(e.target.value)}
                            className="w-full text-xs rounded-xl border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                        >
                            <option value="all">ทุกปีการศึกษา</option>
                            {years.map(y => <option key={y} value={y}>ปีการศึกษา พ.ศ. {y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">🏫 ฝ่าย/แผนกวิชา</label>
                        <select
                            value={projectDeptFilter}
                            onChange={(e) => setProjectDeptFilter(e.target.value)}
                            className="w-full text-xs rounded-xl border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                        >
                            <option value="all">ทุกฝ่ายงาน/แผนกวิชา</option>
                            {allDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Master Table */}
                <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-purple-100 bg-purple-50/50 text-xs font-bold uppercase text-purple-900 whitespace-nowrap">
                                    <th className="px-6 py-3.5">ชื่อโครงการ</th>
                                    <th className="px-6 py-3.5">ผู้เสนอโครงการ / ฝ่ายงาน</th>
                                    <th className="px-6 py-3.5 text-center">ปีการศึกษา</th>
                                    <th className="px-6 py-3.5">งบเสนอขอ</th>
                                    <th className="px-6 py-3.5 text-center">สถานะปัจจุบัน</th>
                                    <th className="px-6 py-3.5 text-right">การดำเนินการ (CRUD)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-100 text-sm">
                                {filteredProjects.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-sm text-slate-500">
                                            ไม่พบข้อมูลโครงการตามเงื่อนไขที่ค้นหา
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProjects.map((p) => (
                                        <tr key={p.id} className="hover:bg-purple-50/20 transition-all">
                                            <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate" title={p.title}>
                                                {p.title}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800 text-xs">{p.proposer_name}</div>
                                                <div className="text-[11px] text-purple-600 font-medium">{p.department_name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-600 font-medium text-xs">
                                                {p.academic_year}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-purple-700 text-xs whitespace-nowrap">
                                                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(p.estimated_budget)}
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                {getStatusBadge(p.status, p.current_approval_step)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                                    <Link
                                                        href={route('projects.show', p.id)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                        title="ติดตาม / จัดการโครงการ"
                                                    >
                                                        👁️ จัดการ ➔
                                                    </Link>
                                                    {(p.status === 'draft' || p.status === 'rejected') && (
                                                        <button
                                                            onClick={() => handleResubmitProject(p)}
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                            title="ยื่นเสนอขออนุมัติเพื่อดำเนินงานต่อ"
                                                        >
                                                            🚀 ยื่นขออนุมัติ
                                                        </button>
                                                    )}
                                                    {(role === 'admin' || auth.user.is_admin) && p.status !== 'approved' && (
                                                        <button
                                                            onClick={() => handleAdminApproveProject(p, 'step')}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-2.5 py-2 text-xs font-extrabold text-purple-950 shadow-md hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                            title="อนุมัติข้ามขั้นตอนปัจจุบันทันที (Admin Step Override)"
                                                        >
                                                            ⚡ อนุมัติลัด
                                                        </button>
                                                    )}
                                                    {(role === 'admin' || auth.user.is_admin) && p.status !== 'approved' && (
                                                        <button
                                                            onClick={() => handleAdminApproveProject(p, 'full')}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 px-2.5 py-2 text-xs font-extrabold text-white shadow-md hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                            title="อนุมัติรวดเดียวสมบูรณ์ 6 ขั้นตอน (Admin Full 6-Step Override)"
                                                        >
                                                            👑 อนุมัติรวดเดียว
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={route('projects.edit', p.id)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-3 py-2 text-xs font-bold text-purple-950 shadow-md shadow-amber-400/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                        title="แก้ไขโครงการ"
                                                    >
                                                        ✏️ แก้ไข
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteProject(p)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                                        title="ลบโครงการ"
                                                    >
                                                        🗑️ ลบ
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold leading-tight text-purple-950 font-sans">
                    NPC SMART FLOW - ศูนย์ควบคุมระบบบริหารจัดการ
                </h2>
            }
        >
            <Head title="หน้าหลัก - ศูนย์ควบคุม" />

            <div className="py-8 font-sans">
                <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8">
                    
                    {/* Content Workspace Area (Full Width Clean Layout) */}
                    <div className="w-full">
                        {activeTab === 'admin_users' && renderAdminUsersTab()}
                        {activeTab === 'admin_strategies' && renderAdminStrategiesTab()}
                        {activeTab === 'admin_settings' && renderAdminSettingsTab()}
                        {activeTab === 'all_projects' && renderAllProjectsTab()}
                        {activeTab === 'proposals' && renderProposalsTab()}
                        {activeTab === 'budgets' && renderBudgetsTab()}
                        {activeTab === 'action_plan_report' && renderActionPlanReportTab()}
                        {activeTab === 'reviews' && renderReviewsTab()}
                        {activeTab === 'clearings' && renderClearingsTab()}
                        {activeTab === 'procurement' && renderProcurementTab()}
                        {activeTab === 'executive_overview' && renderExecutiveOverviewTab()}
                        {activeTab === 'executive_reports' && renderExecutiveReportsTab()}
                    </div>

                    {/* Direct Add & Allocate Modal (Admin & Planning Staff Only) */}
                    {isDirectAllocateModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-purple-100 my-8">
                                <div className="flex justify-between items-center border-b border-purple-100 pb-4 mb-6">
                                    <div>
                                        <h3 className="text-lg font-black text-purple-950 flex items-center gap-2">
                                            <span>➕</span> เพิ่มโครงการและจัดสรรงบประมาณทันที (Direct Allocate)
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            สิทธิ์เฉพาะผู้ดูแลระบบและเจ้าหน้าที่งานแผนงาน: สร้างโครงการและอนุมัติจัดสรรงบประมาณเข้างบและรายงานแผนปฏิบัติราชการทันที
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsDirectAllocateModalOpen(false)}
                                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <form onSubmit={handleDirectAllocateSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                                    <div>
                                        <label className="block mb-1 text-slate-800 font-bold">ชื่อโครงการ (Project Title) *</label>
                                        <input
                                            type="text"
                                            required
                                            value={directAllocateForm.title}
                                            onChange={(e) => setDirectAllocateForm({ ...directAllocateForm, title: e.target.value })}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2.5 text-sm font-bold text-purple-950 focus:border-purple-500 focus:ring-purple-500"
                                            placeholder="เช่น โครงการพัฒนาทักษะวิชาชีพสู่มาตรฐานสากล"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block mb-1 text-slate-800 font-bold">ปีงบประมาณ พ.ศ. *</label>
                                            <input
                                                type="number"
                                                required
                                                value={directAllocateForm.academic_year}
                                                onChange={(e) => setDirectAllocateForm({ ...directAllocateForm, academic_year: e.target.value })}
                                                className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs focus:border-purple-500 focus:ring-purple-500 font-bold"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block mb-1 text-slate-800 font-bold">ฝ่าย / งานที่รับผิดชอบโครงการ *</label>
                                            <select
                                                value={directAllocateForm.department_id}
                                                onChange={(e) => setDirectAllocateForm({ ...directAllocateForm, department_id: Number(e.target.value) })}
                                                className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs focus:border-purple-500 focus:ring-purple-500"
                                            >
                                                {allDepartments.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block mb-1 text-slate-800 font-bold">วงเงินงบประมาณเสนอขอ (บาท)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={directAllocateForm.proposed_budget}
                                                onChange={(e) => setDirectAllocateForm({ ...directAllocateForm, proposed_budget: e.target.value })}
                                                className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                                placeholder="50000.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-1 text-emerald-800 font-bold">วงเงินจัดสรรจริงที่อนุมัติ (บาท) *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                value={directAllocateForm.allocated_budget}
                                                onChange={(e) => setDirectAllocateForm({ ...directAllocateForm, allocated_budget: e.target.value })}
                                                className="w-full rounded-xl border-emerald-300 bg-emerald-50/40 px-3.5 py-2 text-xs font-extrabold text-emerald-950 focus:border-emerald-500 focus:ring-emerald-500"
                                                placeholder="45000.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block mb-1 text-purple-900 font-bold">แหล่งเงินทุน 7 หมวด *</label>
                                            <select
                                                value={directAllocateForm.funding_source_id}
                                                onChange={(e) => setDirectAllocateForm({ ...directAllocateForm, funding_source_id: Number(e.target.value) })}
                                                className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-purple-500"
                                            >
                                                {(planHeadData?.fundingSources || [
                                                    { id: 1, name: 'ปวช.' },
                                                    { id: 2, name: 'ปวส.' },
                                                    { id: 3, name: 'ระยะสั้น' },
                                                    { id: 4, name: 'งบทวิศึกษา' },
                                                    { id: 5, name: 'อุดหนุนเพื่อการจัดการฯ' },
                                                    { id: 6, name: 'อุดหนุนพัฒนาฯ' },
                                                    { id: 7, name: 'บกศ. (บำรุงการศึกษา)' },
                                                ]).map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block mb-1 text-purple-900 font-bold">หมวดรายงานแผนปฏิบัติราชการ (Section 6) *</label>
                                            <select
                                                value={directAllocateForm.report_category}
                                                onChange={(e) => setDirectAllocateForm({ ...directAllocateForm, report_category: e.target.value })}
                                                className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-purple-500"
                                            >
                                                <option value="6.1">6.1 โครงการฝ่ายวิชาการ</option>
                                                <option value="6.2">6.2 โครงการฝ่ายพัฒนากิจการนักเรียน นักศึกษา</option>
                                                <option value="6.3">6.3 โครงการฝ่ายบริหารทรัพยากร</option>
                                                <option value="6.4">6.4 โครงการฝ่ายแผนงานและความร่วมมือ</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block mb-1 text-slate-800 font-bold">ผู้รับผิดชอบโครงการ (ระบุชื่อ หรือเว้นว่างไว้)</label>
                                        <input
                                            type="text"
                                            value={directAllocateForm.responsible_person}
                                            onChange={(e) => setDirectAllocateForm({ ...directAllocateForm, responsible_person: e.target.value })}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                            placeholder="เช่น นายสมชาย ใจดี"
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-1 text-slate-800 font-bold">มติคณะกรรมการ / บันทึกเพิ่มเติม</label>
                                        <textarea
                                            rows={2}
                                            value={directAllocateForm.committee_comment}
                                            onChange={(e) => setDirectAllocateForm({ ...directAllocateForm, committee_comment: e.target.value })}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                            placeholder="มติที่ประชุมคณะกรรมการพิจารณางบประมาณ..."
                                        />
                                    </div>

                                    <div className="flex justify-end gap-x-3 pt-4 border-t border-purple-100">
                                        <button
                                            type="button"
                                            onClick={() => setIsDirectAllocateModalOpen(false)}
                                            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={directAllocateProcessing}
                                            className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-purple-700 px-6 py-2 text-xs font-bold text-white shadow-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            💾 บันทึกและจัดสรรงบทันที
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Committee Allocation Modal (Approve & Allocate or Reject) */}
                    {isCommitteeModalOpen && selectedProjectForAllocation && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-amber-200 my-8">
                                <div className="flex justify-between items-center border-b border-amber-100 pb-4 mb-5">
                                    <div>
                                        <h3 className="text-lg font-black text-purple-950 flex items-center gap-2">
                                            <span>⚖️</span> พิจารณาจัดสรรงบประมาณโครงการ (Committee Decision)
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            คณะกรรมการพิจารณาอนุมัติวงเงินงบประมาณ แหล่งเงินทุน หรือมีมติไม่อนุมัติโครงการ
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setIsCommitteeModalOpen(false); setSelectedProjectForAllocation(null); }}
                                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Project Context Card */}
                                <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 mb-5 space-y-1.5 text-xs">
                                    <div className="font-extrabold text-purple-950 text-sm">
                                        📌 {selectedProjectForAllocation.title}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 pt-1">
                                        <span>🏢 ฝ่าย: <strong className="text-slate-800">{selectedProjectForAllocation.department?.name || 'ไม่ระบุ'}</strong></span>
                                        <span>👤 ผู้เสนอ: <strong className="text-slate-800">{selectedProjectForAllocation.user?.name || selectedProjectForAllocation.responsible_person || 'ไม่ระบุ'}</strong></span>
                                        <span>📅 ปีงบประมาณ: <strong className="text-purple-900">{selectedProjectForAllocation.academic_year}</strong></span>
                                    </div>
                                    <div className="text-slate-700 pt-1">
                                        💰 วงเงินงบประมาณที่ขอเสนอ: <strong className="text-base text-purple-900 font-extrabold">{new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(selectedProjectForAllocation.proposed_budget || selectedProjectForAllocation.estimated_budget)}</strong>
                                    </div>
                                    {selectedProjectForAllocation.background_rationale && (
                                        <div className="text-[11px] text-slate-500 italic pt-1 border-t border-purple-100/80 mt-1">
                                            " {selectedProjectForAllocation.background_rationale} "
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleCommitteeSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                                    
                                    {/* Action Toggle */}
                                    <div>
                                        <label className="block mb-2 text-slate-900 font-bold text-xs">มติคณะกรรมการ (Decision) *</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setCommitteeForm({ ...committeeForm, action: 'approve' })}
                                                className={`flex items-center justify-center gap-2 rounded-2xl p-3 border-2 transition-all font-bold text-xs ${
                                                    committeeForm.action === 'approve'
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                                                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span>🟢</span> อนุมัติจัดสรรงบประมาณ (Approve)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCommitteeForm({ ...committeeForm, action: 'reject' })}
                                                className={`flex items-center justify-center gap-2 rounded-2xl p-3 border-2 transition-all font-bold text-xs ${
                                                    committeeForm.action === 'reject'
                                                        ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-sm'
                                                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span>🔴</span> ไม่อนุมัติงบประมาณ (Reject)
                                            </button>
                                        </div>
                                    </div>

                                    {committeeForm.action === 'approve' && (
                                        <div className="space-y-4 border-t border-purple-100 pt-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block mb-1 text-emerald-900 font-bold">
                                                        วงเงินจัดสรรจริงที่อนุมัติ (บาท) *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        required={committeeForm.action === 'approve'}
                                                        value={committeeForm.allocated_budget}
                                                        onChange={(e) => setCommitteeForm({ ...committeeForm, allocated_budget: e.target.value })}
                                                        className="w-full rounded-xl border-emerald-300 bg-emerald-50/40 px-3.5 py-2.5 text-sm font-black text-emerald-950 focus:border-emerald-500 focus:ring-emerald-500"
                                                        placeholder="วงเงินที่อนุมัติจริง (อาจเท่ากับหรือน้อยกว่าที่ขอได้)"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block mb-1 text-purple-900 font-bold">
                                                        แหล่งเงินทุน 7 หมวด *
                                                    </label>
                                                    <select
                                                        value={committeeForm.funding_source_id}
                                                        onChange={(e) => setCommitteeForm({ ...committeeForm, funding_source_id: Number(e.target.value) })}
                                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2.5 text-xs font-semibold focus:border-purple-500 focus:ring-purple-500"
                                                    >
                                                        {(planHeadData?.fundingSources || [
                                                            { id: 1, name: 'ปวช.' },
                                                            { id: 2, name: 'ปวส.' },
                                                            { id: 3, name: 'ระยะสั้น' },
                                                            { id: 4, name: 'งบทวิศึกษา' },
                                                            { id: 5, name: 'อุดหนุนเพื่อการจัดการฯ' },
                                                            { id: 6, name: 'อุดหนุนพัฒนาฯ' },
                                                            { id: 7, name: 'บกศ. (บำรุงการศึกษา)' },
                                                        ]).map(s => (
                                                            <option key={s.id} value={s.id}>{s.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block mb-1 text-purple-900 font-bold">
                                                    หมวดรายงานแผนปฏิบัติราชการ (Section 6) *
                                                </label>
                                                <select
                                                    value={committeeForm.report_category}
                                                    onChange={(e) => setCommitteeForm({ ...committeeForm, report_category: e.target.value })}
                                                    className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-purple-500"
                                                >
                                                    <option value="6.1">6.1 โครงการฝ่ายวิชาการ</option>
                                                    <option value="6.2">6.2 โครงการฝ่ายพัฒนากิจการนักเรียน นักศึกษา</option>
                                                    <option value="6.3">6.3 โครงการฝ่ายบริหารทรัพยากร</option>
                                                    <option value="6.4">6.4 โครงการฝ่ายแผนงานและความร่วมมือ</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block mb-1 text-slate-800 font-bold">
                                            {committeeForm.action === 'approve' ? 'มติ / ความเห็นคณะกรรมการ' : 'เหตุผลที่ไม่อนุมัติ (ระบุให้ชัดเจน) *'}
                                        </label>
                                        <textarea
                                            rows={3}
                                            required={committeeForm.action === 'reject'}
                                            value={committeeForm.committee_comment}
                                            onChange={(e) => setCommitteeForm({ ...committeeForm, committee_comment: e.target.value })}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs focus:border-purple-500 focus:ring-purple-500"
                                            placeholder={committeeForm.action === 'approve' ? 'บันทึกมติคณะกรรมการจัดสรรงบประมาณ...' : 'ระบุเหตุผลความจำเป็นที่ไม่อนุมัติโครงการ...'}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-x-3 pt-4 border-t border-purple-100">
                                        <button
                                            type="button"
                                            onClick={() => { setIsCommitteeModalOpen(false); setSelectedProjectForAllocation(null); }}
                                            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={committeeProcessing}
                                            className={`rounded-xl px-6 py-2 text-xs font-bold text-white shadow-md transition-all disabled:opacity-50 ${
                                                committeeForm.action === 'approve'
                                                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:scale-[1.02]'
                                                    : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:scale-[1.02]'
                                            }`}
                                        >
                                            {committeeForm.action === 'approve' ? '✅ บันทึกมติอนุมัติจัดสรรงบ' : '❌ บันทึกมติไม่อนุมัติงบ'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
