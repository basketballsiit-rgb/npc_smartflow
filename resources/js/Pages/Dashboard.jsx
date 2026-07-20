import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
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
    currentTab
}) {
    const { auth } = usePage().props;

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
    systemSettings.forEach(s => {
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

    const renderProjectProgressBar = (status, step) => {
        let percent = 0;
        let colorClass = 'from-slate-400 to-slate-500';
        let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
        let stepText = `ร่างโครงการ (Draft)`;

        if (status === 'approved' || step >= 6) {
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

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-purple-100 bg-purple-50/30 text-xs font-bold uppercase text-purple-900 whitespace-nowrap">
                                    <th className="px-6 py-3.5 whitespace-nowrap">ชื่อ - นามสกุล</th>
                                    <th className="px-6 py-3.5 whitespace-nowrap">อีเมล (Email)</th>
                                    <th className="px-6 py-3.5 whitespace-nowrap">สังกัด / ฝ่ายงาน</th>
                                    <th className="px-6 py-3.5 whitespace-nowrap">ตำแหน่งงาน (Position)</th>
                                    <th className="px-6 py-3.5 whitespace-nowrap">สิทธิ์ระบบ (Role)</th>
                                    <th className="px-6 py-3.5 whitespace-nowrap">สถานะ</th>
                                    <th className="px-6 py-3.5 whitespace-nowrap">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-100 text-sm">
                                {adminData.users.map((u) => (
                                    <tr key={u.id} className="hover:bg-purple-50/20 whitespace-nowrap">
                                        <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{u.name}</td>
                                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{u.email}</td>
                                        <td className="px-6 py-4 text-slate-700 whitespace-nowrap">{u.department_name}</td>
                                        <td className="px-6 py-4 font-semibold text-purple-900 whitespace-nowrap">{u.position}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center rounded-md bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800 border border-purple-200">
                                                {u.role_display}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {u.is_active ? (
                                                <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                                                    ✓ เปิดใช้งาน
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-md bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 border border-rose-200">
                                                    ✕ ถูกระงับ
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => openEditUserModal(u)}
                                                    className="inline-flex items-center gap-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1.5 text-xs font-bold transition-all shadow-xs border border-purple-200"
                                                >
                                                    ✏️ แก้ไข
                                                </button>
                                                <button
                                                    onClick={() => handleToggleUserStatus(u)}
                                                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-xs border ${u.is_active ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300'}`}
                                                >
                                                    {u.is_active ? '🚫 สลับระงับ' : '⚡ เปิดใช้งาน'}
                                                </button>
                                                {u.id !== auth.user.id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(u)}
                                                        className="inline-flex items-center gap-1 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 px-3 py-1.5 text-xs font-bold transition-all shadow-xs border border-rose-200"
                                                    >
                                                        🗑️ ลบ
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
                        <p className="text-xs text-slate-600">กำหนดข้อมูลสถานศึกษา ปีการศึกษา ประกาศข่าวสาร และเปิด/ปิดฟีเจอร์การทำงานของระบบ</p>
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

                        {/* Academic Config */}
                        <div className="space-y-4 border-t border-purple-100 pt-6">
                            <h4 className="text-sm font-bold text-purple-900 border-l-4 border-purple-600 pl-3">การตั้งค่าปีการศึกษาและภาคเรียน</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">ปีการศึกษาปัจจุบัน (Academic Year)</label>
                                    <input
                                        type="text"
                                        value={settingsForm.current_academic_year || ''}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, current_academic_year: e.target.value })}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
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
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">โครงการที่ผ่านอนุมัติ</span>
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
                    <div className="border-b border-purple-100 bg-purple-50/50 px-6 py-4 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">รายการเสนอโครงการของฉัน</h3>
                            <p className="text-xs text-slate-600">ติดตามสถานะกระบวนการพิจารณาอนุมัติ 6 ขั้นตอน</p>
                        </div>
                        <Link
                            href={route('projects.create')}
                            className="inline-flex items-center rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-purple-700 transition-colors"
                        >
                            + เสนอโครงการใหม่
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-purple-100 bg-purple-50/30 text-xs font-bold uppercase text-purple-900">
                                    <th className="px-6 py-3.5">ชื่อโครงการ</th>
                                    <th className="px-6 py-3.5">ปีการศึกษา</th>
                                    <th className="px-6 py-3.5">งบประมาณเสนอขอ</th>
                                    <th className="px-6 py-3.5">สถานะการอนุมัติ</th>
                                    <th className="px-6 py-3.5">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-100 text-sm">
                                {teacherData.projects.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-500">
                                            ยังไม่มีรายการโครงการที่เสนอ ให้กดปุ่ม '+ เสนอโครงการใหม่' ด้านบนเพื่อเริ่มสร้างโครงการ
                                        </td>
                                    </tr>
                                ) : (
                                    teacherData.projects.map((project) => (
                                        <tr key={project.id} className="hover:bg-purple-50/20">
                                            <td className="px-6 py-4 font-bold text-slate-900">{project.title}</td>
                                            <td className="px-6 py-4 text-slate-600">{project.academic_year}</td>
                                            <td className="px-6 py-4 font-bold text-purple-700">
                                                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(project.estimated_budget)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(project.status, project.current_approval_step)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2 whitespace-nowrap">
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

    // 2. Plan Head Component Rendering
    const renderBudgetsTab = () => {
        if (!planHeadData) return null;
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600">งบประมาณได้รับจัดสรรรวม</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">
                            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(planHeadData.globalAllocated)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600">ผูกพันงบประมาณแล้ว</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">
                            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(planHeadData.globalEncumbered)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">เบิกจ่ายจริงแล้ว</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">
                            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(planHeadData.globalSpent)}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const renderReviewsTab = () => {
        if (!planHeadData) return null;
        return (
            <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm font-sans">
                <div className="border-b border-purple-100 bg-purple-50/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <h3 className="text-lg font-black text-purple-950">📋 คิวตรวจสอบและอนุมัติโครงการทั้งหมด (Approval Review Queue)</h3>
                        <p className="text-xs text-slate-600 mt-0.5">ตรวจสอบรายละเอียดข้อเสนอโครงการ จัดสรรงบประมาณ และอนุมัติส่งต่อตามลำดับสายงาน 6 ขั้นตอน</p>
                    </div>
                    <div className="bg-purple-100/70 text-purple-900 px-3 py-1 rounded-xl text-xs font-bold border border-purple-200">
                        รออนุมัติในระบบ: {planHeadData.planHeadQueue.length} รายการ
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-purple-100 bg-purple-50/30 text-xs font-bold uppercase text-purple-900 whitespace-nowrap">
                                <th className="px-6 py-3.5">ชื่อโครงการ</th>
                                <th className="px-6 py-3.5">ผู้เสนอโครงการ / ฝ่ายงาน</th>
                                <th className="px-6 py-3.5">งบประมาณเสนอขอ</th>
                                <th className="px-6 py-3.5 text-center">สถานะและขั้นตอนอนุมัติ</th>
                                <th className="px-6 py-3.5 text-right">การดำเนินการ (Full Control)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-100 text-sm">
                            {planHeadData.planHeadQueue.length === 0 ? (
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
        );
    };

    const renderClearingsTab = () => {
        if (!planHeadData) return null;
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
                            {planHeadData.advancePayments.length === 0 ? (
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
        if (!procurementData) return null;
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
                            {procurementData.procurementQueue.map((p) => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4 font-bold text-slate-900">{p.title}</td>
                                    <td className="px-6 py-4 text-slate-600">{p.department?.name}</td>
                                    <td className="px-6 py-4 font-bold text-purple-700">
                                        {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(p.estimated_budget)}
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
                            ))}
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
                            {executiveData.completedProjects.map((project) => (
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
                            ))}
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
            const matchesSearch = p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
                p.proposer_name.toLowerCase().includes(projectSearch.toLowerCase()) ||
                p.department_name.toLowerCase().includes(projectSearch.toLowerCase());
            
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
                        {activeTab === 'reviews' && renderReviewsTab()}
                        {activeTab === 'clearings' && renderClearingsTab()}
                        {activeTab === 'procurement' && renderProcurementTab()}
                        {activeTab === 'executive_overview' && renderExecutiveOverviewTab()}
                        {activeTab === 'executive_reports' && renderExecutiveReportsTab()}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
