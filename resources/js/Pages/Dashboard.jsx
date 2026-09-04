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
    allVendors = [],
    allFundingSources = [],
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

    // Procurement View & Search states
    const [viewingProcurementProject, setViewingProcurementProject] = useState(null);
    const [procurementSearch, setProcurementSearch] = useState('');
    const [procurementFilterTab, setProcurementFilterTab] = useState('pending'); // 'pending', 'forwarded', 'all'

    // Procurement Toolkit States (เครื่องมือสนับสนุนงานพัสดุ 4 ด้าน)
    const [procActiveTool, setProcActiveTool] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('tool') || 'queue';
        }
        return 'queue';
    });
    const [procVendorSearch, setProcVendorSearch] = useState('');
    const [procTeacherSearch, setProcTeacherSearch] = useState('');
    const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
    const [isSavingVendor, setIsSavingVendor] = useState(false);
    const [newVendorForm, setNewVendorForm] = useState({
        name: '',
        tax_id: '',
        bank_name: 'ธนาคารกรุงไทย',
        bank_account_number: '',
        bank_account_name: '',
        address: '',
        phone: '',
        contact_person: '',
        category: 'วัสดุและอุปกรณ์ทั่วไป',
    });

    const [procPoData, setProcPoData] = useState({
        vendor_name: '',
        vendor_address: '',
        vendor_tax_id: '',
        vendor_phone: '',
        delivery_days: '7',
        po_number: '',
        po_date: '',
    });

    // Standard Items Catalog State (Tool 4)
    const [standardCatalogItems, setStandardCatalogItems] = useState([]);
    const [catalogSearch, setCatalogSearch] = useState('');
    const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('');
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
    const [isAddCatalogItemOpen, setIsAddCatalogItemOpen] = useState(false);
    const [editingCatalogItem, setEditingCatalogItem] = useState(null);
    const [catalogFormData, setCatalogFormData] = useState({
        name: '',
        unit: 'ชิ้น',
        standard_price: '',
        category: 'วัสดุสำนักงาน',
    });

    const loadCatalogItems = () => {
        setIsLoadingCatalog(true);
        axios.get(route('standard_items.index'), {
            params: { search: catalogSearch, category: catalogCategoryFilter }
        })
        .then(res => {
            if (res.data && res.data.items) {
                setStandardCatalogItems(res.data.items.data || res.data.items);
            }
        })
        .catch(() => {})
        .finally(() => setIsLoadingCatalog(false));
    };

    useEffect(() => {
        if (procActiveTool === 'item_catalog') {
            loadCatalogItems();
        }
    }, [procActiveTool, catalogSearch, catalogCategoryFilter]);

    const handleSaveCatalogItem = async (e) => {
        e.preventDefault();
        try {
            if (editingCatalogItem) {
                await axios.put(route('standard_items.update', editingCatalogItem.id), catalogFormData);
                Swal.fire({ icon: 'success', title: 'อัปเดตสำเร็จ', text: 'แก้ไขข้อมูลรายการวัสดุเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });
            } else {
                await axios.post(route('standard_items.store'), catalogFormData);
                Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', text: 'เพิ่มรายการเข้าสู่คลังราคากลางเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });
            }
            setIsAddCatalogItemOpen(false);
            setEditingCatalogItem(null);
            setCatalogFormData({ name: '', unit: 'ชิ้น', standard_price: '', category: 'วัสดุสำนักงาน' });
            loadCatalogItems();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง' });
        }
    };

    const handleDeleteCatalogItem = async (id, name) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: `ต้องการลบรายการ "${name}" ออกจากคลังราคากลางหรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'ใช่, ลบรายการ',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(route('standard_items.destroy', id));
                Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', text: 'ลบรายการเรียบร้อยแล้ว', timer: 1200, showConfirmButton: false });
                loadCatalogItems();
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถลบรายการได้' });
            }
        }
    };

    const defaultVendorsSeed = [
        {
            id: 'v-1',
            name: 'ห้างหุ้นส่วนจำกัด น่านศึกษาภัณฑ์',
            tax_id: '0543542001234',
            bank_name: 'ธนาคารกรุงไทย',
            bank_account_number: '507-1-23456-7',
            bank_account_name: 'หจก. น่านศึกษาภัณฑ์',
            address: '124/5 ถ.สุมนเทวราช ต.ในเวียง อ.เมืองน่าน จ.น่าน 55000',
            phone: '054-710234',
            category: 'เครื่องเขียน สื่อการสอน แบบเรียน อุปกรณ์สำนักงาน',
            icon: '📚'
        },
        {
            id: 'v-2',
            name: 'บริษัท น่านไอที คอมพิวเตอร์ แอนด์ เซอร์วิส จำกัด',
            tax_id: '0545558005678',
            bank_name: 'ธนาคารกสิกรไทย',
            bank_account_number: '114-2-98765-4',
            bank_account_name: 'บจก. น่านไอที คอมพิวเตอร์ แอนด์ เซอร์วิส',
            address: '88/12 ถ.อนันตวรฤทธิเดช ต.ในเวียง อ.เมืองน่าน จ.น่าน 55000',
            phone: '054-771890',
            category: 'อุปกรณ์คอมพิวเตอร์ ไอที เครื่องพิมพ์ โทเนอร์ ซอฟต์แวร์',
            icon: '💻'
        },
        {
            id: 'v-3',
            name: 'ร้าน น่านการช่างและวัสดุก่อสร้าง',
            tax_id: '3540100456789',
            bank_name: 'ธนาคารกรุงเทพ',
            bank_account_number: '325-0-54321-0',
            bank_account_name: 'ร้าน น่านการช่างและวัสดุก่อสร้าง',
            address: '205 ถ.มหายศ ต.ในเวียง อ.เมืองน่าน จ.น่าน 55000',
            phone: '054-750112',
            category: 'วัสดุฝึกงานช่าง เครื่องมือช่าง อุปกรณ์ไฟฟ้า สีและเคมีภัณฑ์',
            icon: '🛠️'
        },
        {
            id: 'v-4',
            name: 'โรงพิมพ์ น่านพาณิชย์การพิมพ์และไวนิล',
            tax_id: '0543536009876',
            bank_name: 'ธนาคารไทยพาณิชย์',
            bank_account_number: '567-2-33445-5',
            bank_account_name: 'โรงพิมพ์ น่านพาณิชย์การพิมพ์',
            address: '45/3 ถ.ผากอง ต.ในเวียง อ.เมืองน่าน จ.น่าน 55000',
            phone: '054-712345',
            category: 'เอกสารประกอบการฝึกอบรม แผ่นพับ ป้ายไวนิล สิ่งพิมพ์',
            icon: '🖨️'
        },
        {
            id: 'v-5',
            name: 'ร้าน น่านอีเล็คทรอนิคส์ แอนด์ ซัพพลาย',
            tax_id: '3540100789123',
            bank_name: 'ธนาคารออมสิน',
            bank_account_number: '020-1-88990-1',
            bank_account_name: 'ร้าน น่านอีเล็คทรอนิคส์ แอนด์ ซัพพลาย',
            address: '99/4 ถ.เปรมประชาราษฎร์ ต.ในเวียง อ.เมืองน่าน จ.น่าน 55000',
            phone: '054-774561',
            category: 'อุปกรณ์อิเล็กทรอนิกส์ ชิ้นส่วนวงจร เครื่องเสียง เครื่องวัดไฟฟ้า',
            icon: '⚡'
        }
    ];

    const currentVendors = (allVendors && allVendors.length > 0) 
        ? allVendors 
        : (procurementData?.vendors && procurementData.vendors.length > 0 ? procurementData.vendors : defaultVendorsSeed);

    const copyToClipboard = (text, label) => {
        if (navigator && navigator.clipboard) {
            navigator.clipboard.writeText(text);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `คัดลอก ${label} แล้ว`,
                text: text,
                showConfirmButton: false,
                timer: 2000
            });
        }
    };

    const handleCreateVendor = (e) => {
        e.preventDefault();
        if (!newVendorForm.name.trim()) {
            Swal.fire({ icon: 'warning', title: 'กรุณาระบุชื่อร้านค้า', timer: 2000, showConfirmButton: false });
            return;
        }

        setIsSavingVendor(true);
        router.post(route('vendors.store'), newVendorForm, {
            onSuccess: () => {
                setIsSavingVendor(false);
                setIsAddVendorOpen(false);
                setProcPoData({
                    ...procPoData,
                    vendor_name: newVendorForm.name,
                    vendor_tax_id: newVendorForm.tax_id,
                    vendor_address: newVendorForm.address,
                    vendor_phone: newVendorForm.phone,
                });
                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกข้อมูลร้านค้าสำเร็จ',
                    text: `บันทึก "${newVendorForm.name}" และเลือกใช้ในใบสั่งซื้อทันที`,
                    timer: 2500,
                    showConfirmButton: false
                });
                setNewVendorForm({
                    name: '',
                    tax_id: '',
                    bank_name: 'ธนาคารกรุงไทย',
                    bank_account_number: '',
                    bank_account_name: '',
                    address: '',
                    phone: '',
                    contact_person: '',
                    category: 'วัสดุและอุปกรณ์ทั่วไป',
                });
            },
            onError: () => {
                setIsSavingVendor(false);
                Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาดในการบันทึกร้านค้า' });
            }
        });
    };

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

        const isAdmin = Boolean(auth.user?.is_admin || role === 'admin' || auth.user?.role?.name === 'admin');
    const isPlanHead = Boolean(role === 'plan_head' || auth.user?.is_plan_head || auth.user?.role?.name === 'plan_head');
    const isProcurementHead = Boolean(role === 'procurement_head' || auth.user?.role?.name === 'procurement_head');
    const isExecutive = Boolean(role === 'executive' || auth.user?.role?.name === 'executive');
    const isPlanStaff = isAdmin || isPlanHead || Boolean(auth.user?.department && (auth.user.department.name?.includes('แผน') || auth.user.department.code === 'PLAN'));
    const isFinanceStaff = Boolean(isAdmin || role === 'finance_head' || auth.user?.role?.name === 'finance_head' || (auth.user?.department && (auth.user.department.code === 'FIN' || auth.user.department.name?.includes('การเงิน'))) || (auth.user?.position && auth.user.position.includes('การเงิน')));
    const isProcurementStaff = isAdmin || isProcurementHead || Boolean(auth.user?.department && (auth.user.department.name?.includes('พัสดุ') || auth.user.department.code === 'PROC'));

    const handleRollbackProcurement = (proj, targetStatus) => {
        const isToPending = targetStatus === 'pending';
        const titleText = isToPending 
            ? '↩️ ยกเลิกการลงรับ / ส่งคืนผู้เสนอโครงการแก้ไข' 
            : '↩️ ยกเลิกการส่งการเงิน / ดึงกลับให้งานพัสดุแก้ไข';
        const descText = isToPending
            ? `ต้องการยกเลิกการลงรับเรื่องจัดซื้อจัดจ้างของโครงการ "${proj.title}" และส่งคืนให้ผู้เสนอโครงการสามารถแก้ไขรายการพัสดุใช่หรือไม่?`
            : `ต้องการดึงเรื่องจัดซื้อจัดจ้างของโครงการ "${proj.title}" กลับมาจากงานการเงิน เพื่อให้งานพัสดุตรวจสอบหรือแก้ไขข้อมูลใช่หรือไม่?`;

        Swal.fire({
            title: titleText,
            html: `
                <div class="text-left text-xs text-slate-600 space-y-2 font-sans">
                    <p>${descText}</p>
                    <div class="pt-2">
                        <label class="block font-bold text-slate-800 mb-1">เหตุผลในการยกเลิก/ส่งคืน (ระบุหรือไม่ก็ได้):</label>
                        <textarea id="swal-rollback-reason" class="w-full rounded-xl border border-rose-200 focus:ring-rose-500 focus:border-rose-500 px-3 py-2 text-xs" rows="2" placeholder="เช่น รายการพัสดุไม่ถูกต้อง, ขอปรับปรุงราคา/จำนวน..."></textarea>
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: '↩️ ยืนยันยกเลิก/ส่งคืนแก้ไข',
            cancelButtonText: 'ยกเลิก',
            preConfirm: () => {
                return {
                    target_status: targetStatus,
                    reason: document.getElementById('swal-rollback-reason')?.value || ''
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('procurements.rollback', proj.id), result.value, {
                    onSuccess: () => {
                        setViewingProcurementProject(null);
                        Swal.fire('สำเร็จ', isToPending ? 'ส่งคืนให้ผู้เสนอโครงการแก้ไขเรียบร้อยแล้ว' : 'ดึงเรื่องกลับมาให้งานพัสดุแก้ไขเรียบร้อยแล้ว', 'success');
                    }
                });
            }
        });
    };

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
    
    // Document & Loan Tracking States
    const [docTrackingFilter, setDocTrackingFilter] = useState('all');
    const [selectedApprovalProject, setSelectedApprovalProject] = useState(null); // all, at_procurement, at_finance, with_borrower, completed
    const [docTrackingSearch, setDocTrackingSearch] = useState('');

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

    const renderProjectProgressBar = (status, step, project = null) => {
        if (status === 'preliminary') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold whitespace-nowrap">
                    💡 เสนอตั้งงบ
                </span>
            );
        }
        if (status === 'budget_approved') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold whitespace-nowrap">
                    ✅ จัดสรรงบแล้ว
                </span>
            );
        }
        if (status === 'budget_rejected') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-300 text-xs font-bold whitespace-nowrap">
                    ✕ ไม่ผ่านการจัดสรร
                </span>
            );
        }
        if (status === 'approved' || step >= 6) {
            const procStatus = project?.procurement?.status || project?.procurement_status;
            if (procStatus === 'forwarded_to_finance') {
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-400 text-xs font-black whitespace-nowrap shadow-2xs">
                        💰 งานการเงิน (ส่งเบิกจ่ายแล้ว)
                    </span>
                );
            }
            if (procStatus === 'received' || procStatus === 'processing') {
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-950 border border-blue-400 text-xs font-bold whitespace-nowrap shadow-2xs">
                        📦 งานพัสดุ (ลงรับแล้ว)
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold whitespace-nowrap">
                    📦 งานพัสดุ (รอลงรับ)
                </span>
            );
        }
        if (status === 'in_progress' || status === 'evaluating') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold whitespace-nowrap">
                    ⭐ ดำเนินงาน/ประเมิน
                </span>
            );
        }
        if (status === 'reporting') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold whitespace-nowrap">
                    📄 สรุปรายงานผล
                </span>
            );
        }
        if (status === 'completed' || status === 'cleared') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold whitespace-nowrap">
                    🎉 ปิดโครงการสมบูรณ์
                </span>
            );
        }
        if (status === 'rejected') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-300 text-xs font-bold whitespace-nowrap">
                    ✕ ตีกลับแก้ไข
                </span>
            );
        }
        if (status === 'draft') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold whitespace-nowrap">
                    📝 ร่างโครงการ
                </span>
            );
        }

        const currentStep = step || 2;
        let stepRole = 'รอพิจารณา';
        let stepIcon = '⏳';
        if (currentStep === 2) {
            stepRole = 'หัวหน้างาน/สาขา';
            stepIcon = '👔';
        } else if (currentStep === 3) {
            stepRole = 'งานวางแผนฯ';
            stepIcon = '📊';
        } else if (currentStep === 4) {
            stepRole = 'รองฝ่ายที่เกี่ยวข้อง';
            stepIcon = '🎖️';
        } else if (currentStep === 5) {
            stepRole = 'รองฝ่ายแผนงานฯ';
            stepIcon = '📑';
        } else if (currentStep === 6) {
            stepRole = 'ผู้อำนวยการ';
            stepIcon = '🏛️';
        }

        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold whitespace-nowrap">
                {stepIcon} ขั้นที่ {currentStep}: {stepRole}
            </span>
        );
    };

    const getStatusBadge = (status, step, project = null) => renderProjectProgressBar(status, step, project);

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
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="border-b border-purple-100 bg-purple-50/40 text-xs font-bold uppercase text-purple-900">
                                    <th className="w-[34%] min-w-[200px] px-4 py-3.5">ชื่อโครงการ</th>
                                    <th className="w-[10%] min-w-[70px] px-2 py-3.5 text-center">ปีงบประมาณ</th>
                                    <th className="w-[20%] min-w-[140px] px-3 py-3.5 leading-tight">
                                        <div>งบประมาณเสนอขอ /</div>
                                        <div className="text-purple-950 font-extrabold">จัดสรรจริง</div>
                                    </th>
                                    <th className="w-[16%] min-w-[100px] px-3 py-3.5 text-center">สถานะโครงการ</th>
                                    <th className="w-[20%] min-w-[140px] px-3 py-3.5 text-right">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-100 text-sm">
                                {teacherData.projects.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-500">
                                            ยังไม่มีรายการโครงการที่เสนอ ให้กดปุ่ม '💡 เสนอโครงการเบื้องต้น (ขอตั้งงบ)' ด้านบนเพื่อเริ่มเสนอคำของบประมาณ
                                        </td>
                                    </tr>
                                ) : (
                                    teacherData.projects.map((project) => {
                                        const fundingName = project.funding_source?.name || project.budget?.funding_source?.name || '';
                                        const hasAllocated = project.status === 'budget_approved' || project.status === 'approved' || project.allocated_budget > 0;
                                        
                                        return (
                                            <tr key={project.id} className="hover:bg-purple-50/20 transition-colors">
                                                <td className="px-4 py-3.5 align-top">
                                                    <div className="font-bold text-slate-900 leading-snug text-sm line-clamp-3 break-words">
                                                        {project.title}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-3.5 text-center text-slate-600 font-bold align-top">
                                                    {project.academic_year}
                                                </td>
                                                <td className="px-3 py-3.5 align-top">
                                                    <div className="font-bold text-purple-950">
                                                        {hasAllocated ? (
                                                            <div>
                                                                <span className="text-emerald-700 font-black text-sm block">
                                                                    {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(project.allocated_budget || project.estimated_budget)}
                                                                </span>
                                                                {fundingName && (
                                                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold inline-block mt-0.5">
                                                                        {fundingName}
                                                                    </span>
                                                                )}
                                                                <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                                                                    (เสนอขอ: {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(project.proposed_budget || project.estimated_budget)})
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <span className="text-slate-800 font-black text-sm block">
                                                                    {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(project.proposed_budget || project.estimated_budget)}
                                                                </span>
                                                                <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                                                                    (รอการจัดสรรงบ)
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3.5 text-center align-top whitespace-nowrap">
                                                    {getStatusBadge(project.status, project.current_approval_step, project)}
                                                </td>
                                                <td className="px-3 py-3.5 text-right align-top whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* 1. Preliminary Status: Waiting for Budget Approval */}
                                                        {project.status === 'preliminary' && (
                                                            <>
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                                    รอจัดสรรงบ
                                                                </span>
                                                                <button
                                                                    onClick={() => handleDeleteProject(project)}
                                                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition text-xs"
                                                                    title="ยกเลิกคำขอเสนอโครงการ"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* 2. Budget Rejected Status */}
                                                        {project.status === 'budget_rejected' && (
                                                            <>
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold">
                                                                    🔴 ไม่อนุมัติ
                                                                </span>
                                                                <button
                                                                    onClick={() => handleDeleteProject(project)}
                                                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition text-xs"
                                                                    title="ลบโครงการ"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* 3. Budget Approved Status: Ready for Full Proposal */}
                                                        {project.status === 'budget_approved' && (
                                                            <>
                                                                <Link
                                                                    href={route('projects.edit', project.id)}
                                                                    className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-bold text-xs shadow-xs hover:shadow transition flex items-center gap-1 shrink-0"
                                                                    title="จัดทำรายละเอียดโครงการฉบับเต็ม"
                                                                >
                                                                    <span>📝</span> ทำฉบับเต็ม
                                                                </Link>
                                                                <Link
                                                                    href={route('projects.show', project.id)}
                                                                    className="p-1 text-purple-700 hover:bg-purple-100 rounded-lg transition text-xs shrink-0"
                                                                    title="ดูรายละเอียดโครงการ"
                                                                >
                                                                    👁️
                                                                </Link>
                                                            </>
                                                        )}

                                                        {/* 4. Active Workflow Statuses (draft, submitted, approved) */}
                                                        {project.status !== 'preliminary' && project.status !== 'budget_rejected' && project.status !== 'budget_approved' && (
                                                            <>
                                                                <Link
                                                                    href={route('projects.show', project.id)}
                                                                    className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition flex items-center gap-1"
                                                                    title="จัดการ / ดูรายละเอียด"
                                                                >
                                                                    👁️ จัดการ
                                                                </Link>

                                                                {(project.status === 'draft' || project.status === 'rejected') && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleResubmitProject(project)}
                                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition text-xs"
                                                                            title="ยื่นเสนอขออนุมัติ"
                                                                        >
                                                                            🚀
                                                                        </button>
                                                                        <Link
                                                                            href={route('projects.edit', project.id)}
                                                                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition text-xs"
                                                                            title="แก้ไข"
                                                                        >
                                                                            ✏️
                                                                        </Link>
                                                                    </>
                                                                )}

                                                                {(role === 'admin' || auth.user.is_admin || project.status === 'draft') && (
                                                                    <button
                                                                        onClick={() => handleDeleteProject(project)}
                                                                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition text-xs"
                                                                        title="ลบ"
                                                                    >
                                                                        🗑️
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

    const handleGenerateRoutineAiTor = () => {
        const validItems = routineProcItems.filter(item => item.description && item.description.trim() !== '');
        
        // Filter out loan/activity allowance items
        const isLoanExpense = (desc) => /ค่าตอบแทน|วิทยากร|ค่าอาหาร|อาหารกลางวัน|อาหารว่าง|เครื่องดื่ม|เดินทาง|พาหนะ|ยานพาหนะ|เบี้ยเลี้ยง|ที่พัก|สมนาคุณ|ค่าจ้างเหมาบริการบุคคล|เงินยืม/ui.test(desc);
        const actualProcurementItems = validItems.filter(item => !isLoanExpense(item.description));
        const loanCount = validItems.length - actualProcurementItems.length;

        const deptName = selectedRoutinePlanForProc?.department?.name || 'ฝ่ายบริหารทรัพยากร';
        const planTitle = selectedRoutinePlanForProc?.title || 'งบดำเนินงานประจำปี';

        let aiDraftedTor = '';

        if (actualProcurementItems.length > 0) {
            const itemsListText = actualProcurementItems.map((item, idx) => {
                const cleanDesc = item.description
                    .replace(/\[.*?\]/g, '')
                    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
                    .replace(/[💵📦💰📑📝🛒📄📊]/g, '')
                    .replace(/^[\d๑-๙]+[\.\s]*/u, '')
                    .trim();
                const qty = item.quantity || 1;
                const unit = item.unit || 'ชิ้น';
                return `     2.${idx + 1} ${cleanDesc} จำนวน ${qty} ${unit}`;
            }).join('\n');

            aiDraftedTor = `1. วัตถุประสงค์
วิทยาลัยสารพัดช่างน่าน แผนกวิชา ${deptName} มีความประสงค์จัดหาวัสดุอุปกรณ์และพัสดุ หมวด${planTitle} เพื่อใช้ในการดำเนินงานและการจัดการเรียนการสอนให้เกิดประสิทธิภาพสูงสุด

2. คุณลักษณะเฉพาะและขอบเขตงาน
พัสดุและรายการวัสดุที่จัดหาต้องเป็นของแท้ ของใหม่ ไม่เคยผ่านการใช้งานมาก่อน มีคุณภาพและมาตรฐานตามเกณฑ์สายอาชีวศึกษา โดยประกอบด้วยรายการพัสดุจัดซื้อจัดจ้างจำนวน ${actualProcurementItems.length} รายการ ดังนี้:
${itemsListText}
และพัสดุทั้งหมดต้องมีคุณสมบัติและมาตรฐานตามที่ทางวิทยาลัยกำหนด

3. ระยะเวลาการส่งมอบและเงื่อนไขการส่งมอบ
ผู้จำหน่ายหรือผู้รับจ้างจะต้องส่งมอบพัสดุทั้งหมด ณ วิทยาลัยสารพัดช่างน่าน ภายในกำหนดเวลา 7 วัน นับถัดจากวันที่ได้รับใบสั่งซื้อสั่งจ้างจากทางวิทยาลัย

4. การตรวจรับพัสดุ
การตรวจรับจะดำเนินการโดยคณะกรรมการตรวจรับพัสดุที่วิทยาลัยแต่งตั้งขึ้น โดยต้องตรวจรับพัสดุให้ถูกต้อง ครบถ้วน ตรงตามคุณลักษณะเฉพาะและใบเสนอซื้อเสนอจ้างทุกประการ`;

            setRoutineProcData('tor_specifications', aiDraftedTor);

            Swal.fire({
                title: '✨ AI ร่าง TOR สำเร็จ!',
                html: `คัดกรองเฉพาะรายการพัสดุจัดซื้อจัดจ้าง <b>${actualProcurementItems.length} รายการ</b> มาบรรจุใน TOR ให้เรียบร้อยแล้ว` +
                      (loanCount > 0 ? `<br><span class="text-xs text-amber-700 font-semibold">(คัดแยกรายการเงินยืมราชการ ${loanCount} รายการ ออกจาก TOR แล้ว)</span>` : ''),
                icon: 'success',
                confirmButtonColor: '#7c3aed',
                timer: 3000
            });
        } else {
            aiDraftedTor = `1. วัตถุประสงค์
วิทยาลัยสารพัดช่างน่าน แผนกวิชา ${deptName} มีความประสงค์ดำเนินงานและจัดกิจกรรม หมวด${planTitle} ให้เกิดประสิทธิภาพสูงสุด

2. คุณลักษณะเฉพาะและขอบเขตงาน
รายการนี้เป็นการดำเนินงานในลักษณะการยืมเงินทดรองราชการ (แบบ กค.๑๐๑) เพื่อเป็นค่าใช้จ่ายในการดำเนินกิจกรรมทั้งหมด โดยไม่มีรายการพัสดุหรือครุภัณฑ์ที่ต้องจัดซื้อจัดจ้างตามขอบเขตงาน (TOR) เพิ่มเติม

3. ระยะเวลาการส่งมอบและเงื่อนไขการส่งมอบ
ผู้ยืมเงินจะต้องดำเนินงานให้แล้วเสร็จ และส่งใช้เงินยืมทดรองราชการพร้อมหลักฐานใบสำคัญคู่จ่ายให้แก่งานการเงินภายในกำหนด 30 วัน

4. การตรวจรับพัสดุ
การตรวจสอบหลักฐานการจ่ายเงินจะดำเนินการโดยคณะกรรมการและงานการเงินของวิทยาลัย โดยต้องมีความถูกต้องครบถ้วนตามระเบียบของทางราชการทุกประการ`;

            setRoutineProcData('tor_specifications', aiDraftedTor);

            Swal.fire({
                title: '💡 ตรวจพบรายการเงินยืมราชการ',
                html: `รายการที่เลือกเป็น <b>ค่าใช้จ่ายยืมเงินราชการ</b><br>AI ได้ยกเว้นรายการเงินยืมออกจากบัญชีพัสดุ และปรับข้อกำหนด TOR ให้อัตโนมัติแล้ว`,
                icon: 'info',
                confirmButtonColor: '#7c3aed'
            });
        }
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
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase">ขอบเขตงานหรือรายละเอียด TOR</label>
                                            <button
                                                type="button"
                                                onClick={handleGenerateRoutineAiTor}
                                                className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 transition-all cursor-pointer"
                                                title="ให้ AI ช่วยดึงรายการสิ่งของด้านล่างมาร่างเป็น TOR อัตโนมัติ"
                                            >
                                                <span>✨ AI ช่วยร่าง TOR จากรายการพัสดุ</span>
                                            </button>
                                        </div>
                                        <textarea
                                            value={routineProcData.tor_specifications}
                                            onChange={e => setRoutineProcData('tor_specifications', e.target.value)}
                                            className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-2.5"
                                            rows="5"
                                            placeholder="คำอธิบายขอบเขตความต้องการ เช่น รายละเอียดคุณสมบัติสินค้า หรือกด '✨ AI ช่วยร่าง TOR' ด้านบน..."
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
                        <table className="w-full text-left border-collapse table-fixed text-xs">
                            <thead>
                                <tr className="border-b border-amber-100 bg-amber-50/40 text-[11px] font-bold uppercase text-purple-950">
                                    <th className="w-[28%] min-w-[180px] px-3.5 py-3">ชื่อโครงการ</th>
                                    <th className="w-[18%] min-w-[120px] px-3 py-3">ฝ่ายงาน / ผู้เสนอ</th>
                                    <th className="w-[14%] min-w-[95px] px-3 py-3 text-right">งบประมาณเสนอขอ</th>
                                    <th className="w-[17%] min-w-[110px] px-3 py-3">วงเงินจัดสรรจริง & แหล่งเงิน</th>
                                    <th className="w-[11%] min-w-[80px] px-2 py-3 text-center">สถานะ</th>
                                    <th className="w-[12%] min-w-[90px] px-2.5 py-3 text-right">การพิจารณา</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100/60">
                                {(!planHeadData.preliminaryQueue || planHeadData.preliminaryQueue.length === 0) ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-xs text-slate-500">
                                            ยังไม่มีรายการข้อเสนอโครงการเบื้องต้นในระบบ
                                        </td>
                                    </tr>
                                ) : (
                                    planHeadData.preliminaryQueue.map((p) => {
                                        const fundingName = p.funding_source?.name || p.budget?.funding_source?.name || 'ยังไม่ระบุ';
                                        return (
                                            <tr key={p.id} className="hover:bg-amber-50/20 transition-all">
                                                <td className="px-3.5 py-2.5 align-top">
                                                    <div className="font-bold text-slate-900 line-clamp-2 leading-snug break-words">
                                                        {p.title}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">ปีงบฯ {p.academic_year}</div>
                                                </td>
                                                <td className="px-3 py-2.5 align-top">
                                                    <div className="font-semibold text-slate-800 text-[11px] truncate" title={p.department?.name}>
                                                        {p.department?.name || 'ฝ่ายงานทั่วไป'}
                                                    </div>
                                                    <div className="text-[10px] text-purple-600 font-medium truncate" title={p.user?.name}>
                                                        {p.user?.name || 'ไม่ระบุชื่อ'}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-bold text-slate-800 text-xs align-top whitespace-nowrap">
                                                    {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(p.proposed_budget || p.estimated_budget)}
                                                </td>
                                                <td className="px-3 py-2.5 text-xs align-top">
                                                    {p.status === 'budget_approved' || p.allocated_budget > 0 ? (
                                                        <div>
                                                            <div className="font-extrabold text-emerald-700 text-xs">
                                                                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(p.allocated_budget || p.estimated_budget)}
                                                            </div>
                                                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold mt-0.5 inline-block truncate max-w-full" title={`${fundingName} (${p.report_category || '6.1'})`}>
                                                                {fundingName} ({p.report_category || '6.1'})
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-[11px] italic">- รอจัดสรร -</span>
                                                    )}
                                                </td>
                                                <td className="px-2 py-2.5 text-center align-top whitespace-nowrap">
                                                    {p.status === 'budget_approved' && (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                                            ✅ จัดสรรแล้ว
                                                        </span>
                                                    )}
                                                    {p.status === 'budget_rejected' && (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                                                            ❌ ไม่อนุมัติ
                                                        </span>
                                                    )}
                                                    {p.status === 'preliminary' && (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                                                            🟡 รอจัดสรร
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-2.5 py-2.5 whitespace-nowrap text-right align-top">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {p.status !== 'budget_approved' && (
                                                            <button
                                                                onClick={() => openCommitteeModal(p)}
                                                                className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 px-2 py-1 text-[11px] font-bold text-white shadow-2xs transition-all whitespace-nowrap"
                                                                title="พิจารณาอนุมัติจัดสรรงบประมาณ หรือไม่อนุมัติ"
                                                            >
                                                                ⚖️ พิจารณา
                                                            </button>
                                                        )}
                                                        <Link
                                                            href={route('projects.show', p.id)}
                                                            className="p-1 text-purple-700 hover:bg-purple-100 rounded-md transition text-xs"
                                                            title="ดูรายละเอียด"
                                                        >
                                                            👁️
                                                        </Link>
                                                        {(role === 'admin' || auth.user.is_admin) && (
                                                            <button
                                                                onClick={() => handleDeleteProject(p)}
                                                                className="p-1 text-rose-600 hover:bg-rose-100 rounded-md transition text-xs"
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
                                                {renderProjectProgressBar(p.status, p.current_approval_step, p)}
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
                    <p className="text-purple-900 font-bold text-base">กำลังโหลดศูนย์จัดการงานพัสดุ...</p>
                </div>
            );
        }

        const queue = procurementData.procurementQueue || [];
        const pendingCount = queue.filter(p => !p.procurement || p.procurement.status === 'pending' || p.procurement.status === 'received' || p.procurement.status === 'processing').length;
        const waitingIntakeCount = queue.filter(p => !p.procurement || p.procurement.status === 'pending').length;
        const receivedCount = queue.filter(p => p.procurement?.status === 'received' || p.procurement?.status === 'processing').length;
        const forwardedCount = queue.filter(p => p.procurement?.status === 'forwarded_to_finance').length;
        const totalBudgetSum = queue.reduce((sum, p) => sum + (parseFloat(p.estimated_budget || p.allocated_budget || 0)), 0);

        const filteredQueue = queue.filter(p => {
            const procStatus = p.procurement?.status || 'pending';
            if (procurementFilterTab === 'pending' && procStatus === 'forwarded_to_finance') return false;
            if (procurementFilterTab === 'forwarded' && procStatus !== 'forwarded_to_finance') return false;

            if (!procurementSearch) return true;
            const s = procurementSearch.toLowerCase();
            return (p.title || '').toLowerCase().includes(s) ||
                   (p.user?.name || '').toLowerCase().includes(s) ||
                   (p.department?.name || '').toLowerCase().includes(s) ||
                   (p.procurement?.procurement_number || '').toLowerCase().includes(s);
        });

        return (
            <div className="space-y-6 font-sans">
                {/* Top Module Header & Quick Tool Switcher */}
                <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-black text-purple-950 flex items-center gap-2">
                            <span>📦</span> ศูนย์จัดการงานพัสดุ & จัดซื้อจัดจ้าง
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            จัดการคิวเสนอจัดซื้อจัดจ้าง คลังรายการวัสดุราคากลาง ฐานข้อมูลร้านค้า และข้อมูลกรรมการ
                        </p>
                    </div>
                    {/* Tool Navigation Switcher */}
                    <div className="flex flex-wrap bg-purple-50 p-1.5 rounded-2xl border border-purple-200 gap-1.5 text-xs">
                        <button
                            type="button"
                            onClick={() => setProcActiveTool('queue')}
                            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                procActiveTool === 'queue'
                                    ? 'bg-purple-700 text-white shadow-xs'
                                    : 'text-purple-900 hover:bg-purple-100/70'
                            }`}
                        >
                            <span>📋</span> จัดซื้อจัดจ้างโครงการ ({pendingCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setProcActiveTool('item_catalog')}
                            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                procActiveTool === 'item_catalog'
                                    ? 'bg-purple-700 text-white shadow-xs'
                                    : 'text-purple-900 hover:bg-purple-100/70'
                            }`}
                        >
                            <span>📦</span> คลังวัสดุ & ราคากลาง
                        </button>
                        <button
                            type="button"
                            onClick={() => setProcActiveTool('vendor_po')}
                            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                procActiveTool === 'vendor_po'
                                    ? 'bg-purple-700 text-white shadow-xs'
                                    : 'text-purple-900 hover:bg-purple-100/70'
                            }`}
                        >
                            <span>🏢</span> ฐานข้อมูลร้านค้า
                        </button>
                        <button
                            type="button"
                            onClick={() => setProcActiveTool('committee_id')}
                            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                procActiveTool === 'committee_id'
                                    ? 'bg-purple-700 text-white shadow-xs'
                                    : 'text-purple-900 hover:bg-purple-100/70'
                            }`}
                        >
                            <span>🪪</span> เลข 13 หลักกรรมการ
                        </button>
                    </div>
                </div>

                {/* VIEW 1: คลังวัสดุ & ราคากลาง (Direct view when procActiveTool === 'item_catalog') */}
                {procActiveTool === 'item_catalog' && (
                    <div className="p-6 rounded-3xl bg-white border border-purple-100 shadow-sm space-y-5 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <h4 className="text-lg font-black uppercase text-purple-950 flex items-center gap-2">
                                    <span>📦</span> ฐานข้อมูลคลังรายการวัสดุและราคากลางมาตรฐาน (Standard Items)
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    รายการพัสดุและราคากลางที่ครูและเจ้าหน้าที่สามารถค้นหาและดึงไปใช้เสนอโครงการได้ทันที
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingCatalogItem(null);
                                    setCatalogFormData({ name: '', unit: 'ชิ้น', standard_price: '', category: 'วัสดุสำนักงาน' });
                                    setIsAddCatalogItemOpen(true);
                                }}
                                className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-700/20 transition cursor-pointer"
                            >
                                <span>➕</span> เพิ่มรายการวัสดุใหม่
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                            <div className="sm:col-span-8">
                                <input
                                    type="text"
                                    value={catalogSearch}
                                    onChange={(e) => setCatalogSearch(e.target.value)}
                                    placeholder="🔍 พิมพ์ชื่อรายการพัสดุ หรือราคากลาง เพื่อค้นหา..."
                                    className="w-full text-xs rounded-xl border border-purple-200 bg-white px-3.5 py-2.5 focus:ring-purple-500 focus:border-purple-500 shadow-2xs"
                                />
                            </div>
                            <div className="sm:col-span-4">
                                <select
                                    value={catalogCategoryFilter}
                                    onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                                    className="w-full text-xs rounded-xl border border-purple-200 bg-white px-3.5 py-2.5 focus:ring-purple-500 focus:border-purple-500 shadow-2xs font-semibold"
                                >
                                    <option value="">-- ทุกหมวดหมู่พัสดุ --</option>
                                    <option value="วัสดุสำนักงาน">วัสดุสำนักงาน</option>
                                    <option value="วัสดุคอมพิวเตอร์">วัสดุคอมพิวเตอร์</option>
                                    <option value="วัสดุการศึกษา">วัสดุการศึกษา</option>
                                    <option value="วัสดุฝึก">วัสดุฝึก</option>
                                    <option value="วัสดุงานบ้านงานครัว">วัสดุงานบ้านงานครัว</option>
                                    <option value="วัสดุทั่วไป">วัสดุทั่วไป</option>
                                </select>
                            </div>
                        </div>

                        {/* Standard Items Table */}
                        <div className="overflow-x-auto rounded-2xl border border-purple-200 bg-white shadow-2xs">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-purple-100/70 text-purple-950 font-bold uppercase text-[11px]">
                                    <tr>
                                        <th className="px-4 py-3 text-center w-12">#</th>
                                        <th className="px-4 py-3">ชื่อรายการพัสดุ / วัสดุ</th>
                                        <th className="px-4 py-3">หมวดหมู่</th>
                                        <th className="px-4 py-3 text-center">หน่วยนับ</th>
                                        <th className="px-4 py-3 text-right">ราคากลางต่อหน่วย</th>
                                        <th className="px-4 py-3 text-center">ความถี่การใช้</th>
                                        <th className="px-4 py-3 text-center w-28">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-50">
                                    {isLoadingCatalog ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-8 text-slate-500 font-bold">
                                                ⏳ กำลังโหลดข้อมูลรายการพัสดุ...
                                            </td>
                                        </tr>
                                    ) : standardCatalogItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-8 text-slate-500 font-medium">
                                                ไม่พบรายการพัสดุที่ตรงกับคำค้นหา
                                            </td>
                                        </tr>
                                    ) : (
                                        standardCatalogItems.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-purple-50/40 transition">
                                                <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                                                <td className="px-4 py-3 font-bold text-slate-800 text-[13px]">{item.name}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-semibold">
                                                        {item.category || 'ทั่วไป'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center font-bold text-slate-700 text-[13px]">{item.unit}</td>
                                                <td className="px-4 py-3 text-right font-mono font-black text-purple-950 text-sm">
                                                    {parseFloat(item.standard_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-500 font-medium">
                                                    {item.usage_count || 1} ครั้ง
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingCatalogItem(item);
                                                                setCatalogFormData({
                                                                    name: item.name,
                                                                    unit: item.unit,
                                                                    standard_price: item.standard_price,
                                                                    category: item.category || 'วัสดุทั่วไป'
                                                                });
                                                                setIsAddCatalogItemOpen(true);
                                                            }}
                                                            className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold"
                                                            title="แก้ไข"
                                                        >
                                                            ✏️ แก้ไข
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteCatalogItem(item.id, item.name)}
                                                            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold"
                                                            title="ลบ"
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
                )}

                {/* VIEW 2: ฐานข้อมูลร้านค้า (Direct view when procActiveTool === 'vendor_po') */}
                {procActiveTool === 'vendor_po' && (
                    <div className="p-6 rounded-3xl bg-white border border-purple-100 shadow-sm space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-lg font-black uppercase text-purple-950 flex items-center gap-2">
                                    <span>🏢</span> ฐานข้อมูลร้านค้า / ผู้ประกอบการ
                                </h4>
                                <p className="text-xs text-slate-500">ข้อมูลร้านค้า เลขผู้เสียภาษี และเลขบัญชีธนาคารสำหรับออกใบสั่งซื้อ (PO)</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddVendorOpen(true)}
                                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                            >
                                <span>➕</span> เพิ่มร้านค้าใหม่
                            </button>
                        </div>
                        <input
                            type="text"
                            value={procVendorSearch}
                            onChange={(e) => setProcVendorSearch(e.target.value)}
                            placeholder="🔍 พิมพ์ชื่อร้านค้า, หมวดสินค้า, เลข 13 หลัก หรือเลขบัญชี..."
                            className="w-full text-xs rounded-xl border border-purple-200 bg-white px-3.5 py-2.5 focus:ring-purple-500 focus:border-purple-500 shadow-2xs"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {currentVendors
                                .filter(v => 
                                    !procVendorSearch || 
                                    (v.name && v.name.toLowerCase().includes(procVendorSearch.toLowerCase())) || 
                                    (v.category && v.category.toLowerCase().includes(procVendorSearch.toLowerCase())) ||
                                    (v.tax_id && v.tax_id.includes(procVendorSearch)) ||
                                    (v.bank_account_number && v.bank_account_number.includes(procVendorSearch))
                                )
                                .map((v) => (
                                    <div key={v.id || v.name} className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-2">
                                        <div className="font-bold text-purple-950 text-sm">{v.name}</div>
                                        <div className="text-[11px] text-slate-600"><b>หมวด:</b> {v.category}</div>
                                        <div className="text-[11px] text-slate-600"><b>เลข 13 หลัก:</b> <span className="font-mono">{v.tax_id || '-'}</span></div>
                                        <div className="text-[11px] text-slate-600"><b>ธนาคาร:</b> {v.bank_name} {v.bank_account_number}</div>
                                        <div className="text-[11px] text-slate-500 line-clamp-1"><b>ที่อยู่:</b> {v.address || '-'}</div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* VIEW 3: เลข 13 หลักกรรมการ (Direct view when procActiveTool === 'committee_id') */}
                {procActiveTool === 'committee_id' && (
                    <div className="p-6 rounded-3xl bg-white border border-purple-100 shadow-sm space-y-4 animate-fadeIn">
                        <div>
                            <h4 className="text-lg font-black uppercase text-purple-950 flex items-center gap-2">
                                <span>🪪</span> ฐานข้อมูลเลขประจำตัวประชาชน 13 หลักของครูและบุคลากร
                            </h4>
                            <p className="text-xs text-slate-500">สำหรับนำไปใช้จัดทำคำสั่งแต่งตั้งคณะกรรมการและลงระบบ e-GP</p>
                        </div>
                        <input
                            type="text"
                            value={procTeacherSearch}
                            onChange={(e) => setProcTeacherSearch(e.target.value)}
                            placeholder="🔍 พิมพ์ชื่อครู/บุคลากร, แผนกวิชา เพื่อค้นหาเลข 13 หลัก..."
                            className="w-full text-xs rounded-xl border border-purple-200 bg-white px-3.5 py-2.5 focus:ring-purple-500 focus:border-purple-500 shadow-2xs"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {allUsers
                                .filter(u => 
                                    !procTeacherSearch || 
                                    (u.name && u.name.toLowerCase().includes(procTeacherSearch.toLowerCase())) ||
                                    (u.department?.name && u.department.name.toLowerCase().includes(procTeacherSearch.toLowerCase()))
                                )
                                .slice(0, 30)
                                .map((u) => (
                                    <div key={u.id} className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-slate-800 text-xs">{u.name}</div>
                                            <div className="text-[10px] text-slate-500">{u.department?.name || 'บุคลากร'}</div>
                                            <div className="font-mono text-xs font-bold text-purple-900 mt-1">
                                                {u.citizen_id_formatted || u.citizen_id || 'ยังไม่ระบุ'}
                                            </div>
                                        </div>
                                        {u.citizen_id && (
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(u.citizen_id.replace(/[^0-9]/g, ''), `เลข 13 หลักของ ${u.name}`)}
                                                className="px-2.5 py-1.5 bg-purple-600 text-white rounded-xl text-[10px] font-bold hover:bg-purple-700 transition"
                                            >
                                                📋 คัดลอก
                                            </button>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* VIEW 4: คิวจัดซื้อจัดจ้างโครงการ (Default when procActiveTool === 'queue') */}
                {procActiveTool === 'queue' && (
                    <>
                        {/* 1. Stat Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <button
                                type="button"
                                onClick={() => setProcurementFilterTab('pending')}
                                className={`rounded-2xl border p-5 shadow-xs text-left transition-all hover:scale-[1.02] ${
                                    procurementFilterTab === 'pending' ? 'border-amber-400 bg-amber-50/90 ring-2 ring-amber-400' : 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase tracking-wider text-amber-900">🟡 รอดำเนินการ / รอลงรับ</span>
                                    <span className="text-xl">📦</span>
                                </div>
                                <p className="mt-2 text-3xl font-black text-amber-950">{pendingCount} <span className="text-xs font-normal text-amber-800">โครงการ</span></p>
                                <p className="text-[11px] text-amber-700 mt-1">รอพัสดุลงรับ ({waitingIntakeCount}) | ลงรับแล้วรอเบิก ({receivedCount})</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setProcurementFilterTab('forwarded')}
                                className={`rounded-2xl border p-5 shadow-xs text-left transition-all hover:scale-[1.02] ${
                                    procurementFilterTab === 'forwarded' ? 'border-emerald-400 bg-emerald-50/90 ring-2 ring-emerald-400' : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase tracking-wider text-emerald-900">🟢 ส่งงานการเงินแล้ว</span>
                                    <span className="text-xl">📤</span>
                                </div>
                                <p className="mt-2 text-3xl font-black text-emerald-950">{forwardedCount} <span className="text-xs font-normal text-emerald-800">โครงการ</span></p>
                                <p className="text-[11px] text-emerald-700 mt-1">ส่งต่อให้งานการเงินเบิกจ่ายแล้ว</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setProcurementFilterTab('all')}
                                className={`rounded-2xl border p-5 shadow-xs text-left transition-all hover:scale-[1.02] ${
                                    procurementFilterTab === 'all' ? 'border-purple-400 bg-purple-50/90 ring-2 ring-purple-400' : 'border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase tracking-wider text-purple-900">📁 รายการทั้งหมด</span>
                                    <span className="text-xl">📑</span>
                                </div>
                                <p className="mt-2 text-3xl font-black text-purple-950">{queue.length} <span className="text-xs font-normal text-purple-800">โครงการ</span></p>
                                <p className="text-[11px] text-purple-700 mt-1">โครงการจัดซื้อจัดจ้างทั้งหมด</p>
                            </button>

                            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 shadow-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase tracking-wider text-indigo-900">งบประมาณจัดซื้อรวม</span>
                                    <span className="text-xl">💰</span>
                                </div>
                                <p className="mt-2 text-2xl font-black text-indigo-950">{new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totalBudgetSum)}</p>
                                <p className="text-[11px] text-indigo-700 mt-1">วงเงินงบประมาณที่ได้รับจัดสรร</p>
                            </div>
                        </div>

                        {/* 2. Main Procurement Queue Container */}
                        <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
                    {/* Header with Sub-Tabs */}
                    <div className="border-b border-purple-100 bg-purple-50/40 p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-purple-950 flex items-center gap-2">
                                <span>🏛️</span> ศูนย์จัดการชุดจัดซื้อจัดจ้าง & พัสดุ
                            </h3>
                            <p className="text-xs text-slate-600">
                                ตรวจสอบชุดจัดซื้อจัดจ้างที่ครูเสนอมา กดดูรายละเอียดเพื่อตรวจรายการวัสดุ ลงรับเรื่อง หรือตั้งเบิกส่งงานการเงิน
                            </p>
                        </div>

                        {/* Search & Sub-tabs */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                            {/* Sub-tab Pills */}
                            <div className="flex bg-white rounded-xl p-1 border border-purple-200 shadow-2xs">
                                <button
                                    type="button"
                                    onClick={() => setProcurementFilterTab('pending')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        procurementFilterTab === 'pending'
                                            ? 'bg-amber-500 text-white shadow-2xs'
                                            : 'text-slate-600 hover:text-purple-900'
                                    }`}
                                >
                                    <span>🟡 รอดำเนินการ</span>
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${procurementFilterTab === 'pending' ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-900'}`}>
                                        {pendingCount}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProcurementFilterTab('forwarded')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        procurementFilterTab === 'forwarded'
                                            ? 'bg-emerald-600 text-white shadow-2xs'
                                            : 'text-slate-600 hover:text-purple-900'
                                    }`}
                                >
                                    <span>🟢 ส่งการเงินแล้ว</span>
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${procurementFilterTab === 'forwarded' ? 'bg-white/30 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
                                        {forwardedCount}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProcurementFilterTab('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        procurementFilterTab === 'all'
                                            ? 'bg-purple-900 text-white shadow-2xs'
                                            : 'text-slate-600 hover:text-purple-900'
                                    }`}
                                >
                                    <span>📁 ทั้งหมด</span>
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${procurementFilterTab === 'all' ? 'bg-white/30 text-white' : 'bg-purple-100 text-purple-900'}`}>
                                        {queue.length}
                                    </span>
                                </button>
                            </div>

                            <input
                                type="text"
                                value={procurementSearch}
                                onChange={(e) => setProcurementSearch(e.target.value)}
                                placeholder="🔍 ค้นหาโครงการ/ผู้เสนอ..."
                                className="text-xs rounded-xl border border-purple-200 px-3.5 py-2 bg-white focus:border-purple-500 focus:ring-purple-500 w-full sm:w-56"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-purple-100 bg-purple-50/50 text-xs font-bold uppercase text-purple-900 whitespace-nowrap">
                                    <th className="px-5 py-3.5 w-12 text-center">ลำดับ</th>
                                    <th className="px-5 py-3.5">ชื่อโครงการ / ผู้รับผิดชอบ</th>
                                    <th className="px-4 py-3.5">ฝ่าย / แผนก</th>
                                    <th className="px-4 py-3.5 text-right">วงเงินจัดสรร</th>
                                    <th className="px-4 py-3.5 text-center">รายการจัดซื้อจัดจ้าง</th>
                                    <th className="px-4 py-3.5 text-center">สถานะชุดจัดซื้อ</th>
                                    <th className="px-5 py-3.5 text-center">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-100 text-xs">
                                {filteredQueue.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-sm text-slate-500">
                                            <span className="text-3xl block mb-2">📭</span>
                                            {procurementSearch 
                                                ? `ไม่พบโครงการที่ค้นหา "${procurementSearch}"` 
                                                : procurementFilterTab === 'pending'
                                                ? 'ไม่มีโครงการที่รอดำเนินการจัดซื้อจัดจ้างในขณะนี้'
                                                : procurementFilterTab === 'forwarded'
                                                ? 'ยังไม่มีโครงการที่ส่งเบิกงานการเงิน'
                                                : 'ไม่มีรายการโครงการในระบบ'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredQueue.map((p, idx) => {
                                        const itemCount = p.procurement?.items?.length || 0;
                                        const procStatus = p.procurement?.status || 'pending';
                                        const totalItemSum = (p.procurement?.items || []).reduce((acc, item) => acc + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)), 0);

                                        return (
                                            <tr 
                                                key={p.id} 
                                                onClick={() => setViewingProcurementProject(p)}
                                                className="hover:bg-purple-50/40 transition-colors cursor-pointer"
                                            >
                                                <td className="px-5 py-4 text-center font-bold text-slate-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-bold text-slate-900 text-sm hover:text-purple-700 transition">
                                                        {p.title}
                                                    </p>
                                                    <p className="text-slate-500 mt-0.5 flex items-center gap-2">
                                                        <span>👤 {p.user?.name || '-'}</span>
                                                        {p.academic_year && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">ปี {p.academic_year}</span>}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4 text-slate-700 font-medium">
                                                    {p.department?.name || '-'}
                                                </td>
                                                <td className="px-4 py-4 text-right whitespace-nowrap">
                                                    <span className="font-black text-purple-950 text-sm">
                                                        {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(p.estimated_budget || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center whitespace-nowrap">
                                                    {itemCount > 0 ? (
                                                        <div className="space-y-0.5">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                                                📦 {itemCount} รายการ
                                                            </span>
                                                            <span className="block text-[10px] text-slate-500 font-mono">
                                                                รวม {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totalItemSum)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">ยื่นขอวงเงินรวม</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-center whitespace-nowrap">
                                                    {procStatus === 'forwarded_to_finance' ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                                            <span>🟢</span> ส่งงานการเงินแล้ว
                                                        </span>
                                                    ) : procStatus === 'received' || procStatus === 'processing' ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs">
                                                            <span>🔵</span> ลงรับแล้ว {p.procurement?.procurement_number ? `(${p.procurement.procurement_number})` : ''}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                                                            <span>🟡</span> รอพัสดุลงรับ
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {/* Primary View Procurement Details Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingProcurementProject(p)}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm hover:scale-105 transition-all"
                                                        >
                                                            <span>🔍</span> ดูชุดจัดซื้อจัดจ้าง
                                                        </button>

                                                        {/* Quick Receive Button if pending */}
                                                        {procStatus !== 'received' && procStatus !== 'forwarded_to_finance' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    Swal.fire({
                                                                        title: '📥 ลงรับชุดจัดซื้อจัดจ้าง',
                                                                        html: `
                                                                            <div class="text-left text-xs text-slate-600 space-y-2 font-sans">
                                                                                <p><strong>โครงการ:</strong> ${p.title}</p>
                                                                                <p><strong>ผู้เสนอ:</strong> ${p.user?.name || '-'}</p>
                                                                                <div class="pt-2">
                                                                                    <label class="block font-bold text-slate-800 mb-1">เลขที่ลงรับพัสดุ (ถ้ามี):</label>
                                                                                    <input id="swal-proc-num" class="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm" placeholder="เช่น พด. 012/2569" value="${p.procurement?.procurement_number || ''}">
                                                                                </div>
                                                                                <div>
                                                                                    <label class="block font-bold text-slate-800 mb-1">วันที่ลงรับ:</label>
                                                                                    <input id="swal-proc-dt" type="date" class="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm" value="${new Date().toISOString().split('T')[0]}">
                                                                                </div>
                                                                            </div>
                                                                        `,
                                                                        showCancelButton: true,
                                                                        confirmButtonText: '📥 ยืนยันลงรับเรื่อง',
                                                                        cancelButtonText: 'ยกเลิก',
                                                                        confirmButtonColor: '#7c3aed',
                                                                        preConfirm: () => ({
                                                                            procurement_number: document.getElementById('swal-proc-num').value,
                                                                            memo_date: document.getElementById('swal-proc-dt').value,
                                                                        })
                                                                    }).then((res) => {
                                                                        if (res.isConfirmed) {
                                                                            router.post(route('procurements.receive', p.id), res.value, {
                                                                                onSuccess: () => Swal.fire('สำเร็จ', 'งานพัสดุลงรับชุดจัดซื้อจัดจ้างเรียบร้อยแล้ว', 'success')
                                                                            });
                                                                        }
                                                                    });
                                                                }}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-xs"
                                                                title="ลงรับชุดจัดซื้อจัดจ้าง"
                                                            >
                                                                <span>📥</span> ลงรับ
                                                            </button>
                                                        )}

                                                        {/* Quick Forward to Finance Button if received */}
                                                        {procStatus === 'received' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    Swal.fire({
                                                                        title: '📤 ตั้งเบิกส่งงานการเงิน',
                                                                        text: `ต้องการส่งเรื่องจัดซื้อจัดจ้างของ "${p.title}" ให้งานการเงินดำเนินการเบิกจ่ายหรือไม่?`,
                                                                        icon: 'question',
                                                                        showCancelButton: true,
                                                                        confirmButtonColor: '#10b981',
                                                                        cancelButtonColor: '#64748b',
                                                                        confirmButtonText: '📤 ยืนยันส่งงานการเงิน',
                                                                        cancelButtonText: 'ยกเลิก'
                                                                    }).then((res) => {
                                                                        if (res.isConfirmed) {
                                                                            router.post(route('procurements.forward_to_finance', p.id), {}, {
                                                                                onSuccess: () => Swal.fire('สำเร็จ', 'ตั้งเบิกและส่งต่อให้งานการเงินเรียบร้อยแล้ว', 'success')
                                                                            });
                                                                        }
                                                                    });
                                                                }}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs"
                                                                title="ตั้งเบิกส่งงานการเงิน"
                                                            >
                                                                <span>📤</span> ส่งการเงิน
                                                            </button>
                                                        )}

                                                        {/* Admin / Procurement Rollback Buttons */}
                                                        {procStatus === 'forwarded_to_finance' && isAdmin && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRollbackProcurement(p, 'received')}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all shadow-2xs hover:scale-105"
                                                                title="ยกเลิกการส่งการเงิน / ดึงกลับให้งานพัสดุแก้ไข (Admin Rollback)"
                                                            >
                                                                <span>↩️</span> ดึงกลับ
                                                            </button>
                                                        )}

                                                        {procStatus === 'received' && isAdmin && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRollbackProcurement(p, 'pending')}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all shadow-2xs hover:scale-105"
                                                                title="ยกเลิกการลงรับ / ส่งคืนผู้เสนอแก้ไข (Admin Rollback)"
                                                            >
                                                                <span>↩️</span> ส่งคืน
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
                </>
                )}

                {/* 3. Procurement Details Modal */}
                {viewingProcurementProject && (() => {
                    const p = viewingProcurementProject;
                    const proc = p.procurement;
                    const procStatus = proc?.status || 'pending';
                    const items = proc?.items || [];
                    const totalItemSum = items.reduce((acc, it) => acc + (parseFloat(it.quantity || 0) * parseFloat(it.unit_price || 0)), 0);

                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
                            <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-purple-100 space-y-6 font-sans">
                                
                                {/* Modal Header */}
                                <div className="flex justify-between items-start border-b border-purple-100 pb-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">📦</span>
                                            <h3 className="text-xl font-black text-purple-950">
                                                ชุดเอกสารจัดซื้อจัดจ้าง
                                            </h3>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {p.title}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            ผู้เสนอโครงการ: <b className="text-slate-800">{p.user?.name || '-'}</b> | ฝ่าย/แผนก: <b className="text-slate-800">{p.department?.name || '-'}</b> | วงเงินอนุมัติ: <b className="text-purple-900">{new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(p.estimated_budget || 0)}</b>
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setViewingProcurementProject(null)}
                                        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black text-sm transition"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Status & Action Box */}
                                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                                    procStatus === 'forwarded_to_finance'
                                        ? 'bg-emerald-50/80 border-emerald-200'
                                        : procStatus === 'received' || procStatus === 'processing'
                                        ? 'bg-blue-50/80 border-blue-200'
                                        : 'bg-amber-50/80 border-amber-200'
                                }`}>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black uppercase tracking-wider text-slate-700">สถานะงานพัสดุ:</span>
                                            {procStatus === 'forwarded_to_finance' ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-emerald-600 text-white shadow-2xs">
                                                    <span>🟢</span> ตั้งเบิกส่งงานการเงินแล้ว
                                                </span>
                                            ) : procStatus === 'received' || procStatus === 'processing' ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-blue-600 text-white shadow-2xs">
                                                    <span>🔵</span> พัสดุลงรับเรื่องแล้ว {proc?.procurement_number ? `(เลขที่ ${proc.procurement_number})` : ''}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-amber-500 text-white shadow-2xs">
                                                    <span>🟡</span> รอพัสดุลงรับเรื่อง
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-600">
                                            {procStatus === 'forwarded_to_finance'
                                                ? 'ชุดเอกสารจัดซื้อจัดจ้างได้ถูกส่งไปยังงานการเงินเพื่อดำเนินการเบิกจ่ายงบประมาณแล้ว'
                                                : procStatus === 'received' || procStatus === 'processing'
                                                ? 'พัสดุลงรับเรื่องแล้ว เมื่อตรวจสอบเอกสารครบถ้วน สามารถกดตั้งเบิกส่งงานการเงินได้ทันที'
                                                : 'โครงการได้รับการอนุมัติแล้ว รอเจ้าหน้าที่พัสดุลงรับเรื่องเพื่อเริ่มกระบวนการจัดซื้อจัดจ้าง'}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                                        {procStatus !== 'received' && procStatus !== 'forwarded_to_finance' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: '📥 ลงรับชุดจัดซื้อจัดจ้าง',
                                                        html: `
                                                            <div class="text-left text-xs text-slate-600 space-y-2 font-sans">
                                                                <p><strong>โครงการ:</strong> ${p.title}</p>
                                                                <p><strong>ผู้เสนอ:</strong> ${p.user?.name || '-'}</p>
                                                                <div class="pt-2">
                                                                    <label class="block font-bold text-slate-800 mb-1">เลขที่ลงรับพัสดุ (ถ้ามี):</label>
                                                                    <input id="swal-proc-num-modal" class="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm" placeholder="เช่น พด. 012/2569" value="${proc?.procurement_number || ''}">
                                                                </div>
                                                                <div>
                                                                    <label class="block font-bold text-slate-800 mb-1">วันที่ลงรับ:</label>
                                                                    <input id="swal-proc-dt-modal" type="date" class="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm" value="${new Date().toISOString().split('T')[0]}">
                                                                </div>
                                                            </div>
                                                        `,
                                                        showCancelButton: true,
                                                        confirmButtonText: '📥 ยืนยันลงรับเรื่อง',
                                                        cancelButtonText: 'ยกเลิก',
                                                        confirmButtonColor: '#7c3aed',
                                                        preConfirm: () => ({
                                                            procurement_number: document.getElementById('swal-proc-num-modal').value,
                                                            memo_date: document.getElementById('swal-proc-dt-modal').value,
                                                        })
                                                    }).then((res) => {
                                                        if (res.isConfirmed) {
                                                            router.post(route('procurements.receive', p.id), res.value, {
                                                                onSuccess: () => {
                                                                    setViewingProcurementProject(null);
                                                                    Swal.fire('สำเร็จ', 'งานพัสดุลงรับชุดจัดซื้อจัดจ้างเรียบร้อยแล้ว', 'success');
                                                                }
                                                            });
                                                        }
                                                    });
                                                }}
                                                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition shadow-sm"
                                            >
                                                📥 ลงรับชุดจัดซื้อจัดจ้าง
                                            </button>
                                        )}

                                        {procStatus === 'received' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: '📤 ตั้งเบิกส่งงานการเงิน',
                                                        text: `ต้องการส่งเรื่องจัดซื้อจัดจ้างของ "${p.title}" ให้งานการเงินดำเนินการเบิกจ่ายหรือไม่?`,
                                                        icon: 'question',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#10b981',
                                                        cancelButtonColor: '#64748b',
                                                        confirmButtonText: '📤 ยืนยันส่งงานการเงิน',
                                                        cancelButtonText: 'ยกเลิก'
                                                    }).then((res) => {
                                                        if (res.isConfirmed) {
                                                            router.post(route('procurements.forward_to_finance', p.id), {}, {
                                                                onSuccess: () => {
                                                                    setViewingProcurementProject(null);
                                                                    Swal.fire('สำเร็จ', 'ตั้งเบิกและส่งต่อให้งานการเงินเรียบร้อยแล้ว', 'success');
                                                                }
                                                            });
                                                        }
                                                    });
                                                }}
                                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm"
                                            >
                                                📤 ตั้งเบิก ➔ ส่งงานการเงิน
                                            </button>
                                        )}

                                        {/* Admin Rollback Buttons in Modal */}
                                        {procStatus === 'forwarded_to_finance' && isAdmin && (
                                            <button
                                                type="button"
                                                onClick={() => handleRollbackProcurement(p, 'received')}
                                                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                                title="ยกเลิกการส่งการเงิน และดึงเรื่องกลับมาให้งานพัสดุแก้ไข"
                                            >
                                                <span>↩️</span> ยกเลิกส่งการเงิน (ดึงกลับให้พัสดุ)
                                            </button>
                                        )}

                                        {procStatus === 'received' && isAdmin && (
                                            <button
                                                type="button"
                                                onClick={() => handleRollbackProcurement(p, 'pending')}
                                                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                                title="ยกเลิกการลงรับ และส่งคืนให้ผู้เสนอโครงการแก้ไข"
                                            >
                                                <span>↩️</span> ยกเลิกการลงรับ (ส่งคืนผู้เสนอ)
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Table of Items */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold uppercase text-purple-900 flex items-center gap-1.5">
                                            <span>📋</span> รายการวัสดุ / ครุภัณฑ์ / จ้างเหมา ที่เสนอจัดซื้อจัดจ้าง
                                        </h4>
                                        <span className="text-xs text-slate-500 font-medium">
                                            รวมทั้งสิ้น <b>{items.length}</b> รายการ
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-2xs">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-purple-50 text-purple-950 font-bold border-b border-purple-100">
                                                <tr>
                                                    <th className="p-3 w-12 text-center">ลำดับ</th>
                                                    <th className="p-3">รายการ</th>
                                                    <th className="p-3 w-24 text-center">จำนวน</th>
                                                    <th className="p-3 w-24 text-center">หน่วยนับ</th>
                                                    <th className="p-3 w-32 text-right">ราคาต่อหน่วย</th>
                                                    <th className="p-3 w-32 text-right">รวมเป็นเงิน</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-purple-50">
                                                {items.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" className="p-6 text-center text-slate-400">
                                                            ยังไม่มีรายการวัสดุแยกย่อยในระบบ (ยื่นขอเป็นวงเงินเหมารวม {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(p.estimated_budget || 0)})
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.map((it, idx) => (
                                                        <tr key={it.id || idx} className="hover:bg-purple-50/30">
                                                            <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                                                            <td className="p-3 font-semibold text-slate-800">{(it.description || '').replace(/[💵📦💰📑📝🛒📄📊]/g, '').trim()}</td>
                                                            <td className="p-3 text-center font-bold">{it.quantity}</td>
                                                            <td className="p-3 text-center text-slate-600">{it.unit}</td>
                                                            <td className="p-3 text-right font-mono">{parseFloat(it.unit_price).toLocaleString()} บ.</td>
                                                            <td className="p-3 text-right font-mono font-bold text-purple-950">{(parseFloat(it.quantity) * parseFloat(it.unit_price)).toLocaleString()} บ.</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                            <tfoot className="bg-purple-50/80 font-bold border-t border-purple-100">
                                                <tr>
                                                    <td colSpan="5" className="p-3.5 text-right text-purple-950">ยอดรวมจัดซื้อจัดจ้างทั้งสิ้น:</td>
                                                    <td className="p-3.5 text-right text-purple-950 font-mono font-black text-sm">
                                                        {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totalItemSum)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* TOR Specifications & Committees */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                                        <h5 className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1">
                                            <span>📝</span> ขอบเขตคุณลักษณะเฉพาะ (TOR)
                                        </h5>
                                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                            {proc?.tor_specifications || 'ไม่ได้ระบุข้อกำหนดเพิ่มเติม'}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3">
                                        <h5 className="text-xs font-bold uppercase text-purple-900 flex items-center gap-1">
                                            <span>👥</span> คณะกรรมการที่แต่งตั้ง
                                        </h5>
                                        <div className="text-xs text-slate-700 space-y-2">
                                            <div>
                                                <span className="font-bold text-purple-950">คณะกรรมการจัดซื้อจัดจ้าง:</span>
                                                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-600">
                                                    {proc?.committees?.filter(c => c.pivot?.committee_type === 'purchasing').map(c => (
                                                        <li key={c.id}>{c.name} ({c.pivot?.role === 'chairperson' ? 'ประธาน' : 'กรรมการ'})</li>
                                                    )) || <li>ยังไม่ได้แต่งตั้ง</li>}
                                                </ul>
                                            </div>
                                            <div>
                                                <span className="font-bold text-purple-950">คณะกรรมการตรวจรับพัสดุ:</span>
                                                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-600">
                                                    {proc?.committees?.filter(c => c.pivot?.committee_type === 'inspection').map(c => (
                                                        <li key={c.id}>{c.name} ({c.pivot?.role === 'chairperson' ? 'ประธาน' : 'กรรมการ'})</li>
                                                    )) || <li>ยังไม่ได้แต่งตั้ง</li>}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 4 Procurement Hub Tools (ศูนย์เครื่องมือสนับสนุนงานพัสดุ 4 ด้าน) */}
                                <div className="space-y-4 pt-3 border-t-2 border-purple-100">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div>
                                            <h5 className="text-sm font-black uppercase text-purple-950 flex items-center gap-1.5">
                                                <span>🧰</span> ศูนย์เครื่องมือสนับสนุนงานพัสดุ (Procurement Hub)
                                            </h5>
                                            <p className="text-xs text-slate-500">
                                                เครื่องมือช่วยงานพัสดุ: ค้นหาร้านค้า, ออกใบสั่งซื้อ (PO), ค้นหาเลข 13 หลักกรรมการ, และเลขตัดงบประมาณ
                                            </p>
                                        </div>

                                        {/* Tool Switcher Tabs */}
                                        <div className="inline-flex p-1 bg-purple-50 rounded-2xl border border-purple-100 gap-1 text-xs">
                                            <button
                                                type="button"
                                                onClick={() => setProcActiveTool('vendor_po')}
                                                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                                    procActiveTool === 'vendor_po'
                                                        ? 'bg-purple-700 text-white shadow-xs'
                                                        : 'text-purple-900 hover:bg-purple-100/60'
                                                }`}
                                            >
                                                <span>🏢</span> ร้านค้า & ใบสั่งซื้อ (PO)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setProcActiveTool('committee_id')}
                                                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                                    procActiveTool === 'committee_id'
                                                        ? 'bg-purple-700 text-white shadow-xs'
                                                        : 'text-purple-900 hover:bg-purple-100/60'
                                                }`}
                                            >
                                                <span>🪪</span> เลข 13 หลักกรรมการ
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setProcActiveTool('budget_code')}
                                                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                                    procActiveTool === 'budget_code'
                                                        ? 'bg-purple-700 text-white shadow-xs'
                                                        : 'text-purple-900 hover:bg-purple-100/60'
                                                }`}
                                            >
                                                <span>💰</span> เลขงบประมาณตัดงบ
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setProcActiveTool('item_catalog')}
                                                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                                    procActiveTool === 'item_catalog'
                                                        ? 'bg-purple-700 text-white shadow-xs'
                                                        : 'text-purple-900 hover:bg-purple-100/60'
                                                }`}
                                            >
                                                <span>📦</span> คลังวัสดุ & ราคากลาง
                                            </button>
                                        </div>
                                    </div>

                                    {/* TOOL 1 & 2: ค้นหาข้อมูลร้านค้า & พิมพ์ใบสั่งซื้อให้กับร้านค้า */}
                                    {procActiveTool === 'vendor_po' && (
                                        <div className="p-4 rounded-2xl bg-slate-50/70 border border-purple-100 space-y-4 animate-fadeIn">
                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                                {/* Left Column: Vendor Directory & Search */}
                                                <div className="lg:col-span-6 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <h6 className="text-xs font-black uppercase text-purple-950 flex items-center gap-1">
                                                            <span>🔍</span> ค้นหาฐานข้อมูลร้านค้า / ผู้ประกอบการ
                                                        </h6>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsAddVendorOpen(true)}
                                                            className="px-2.5 py-1 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition cursor-pointer"
                                                        >
                                                            <span>➕</span> เพิ่มร้านค้าใหม่
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={procVendorSearch}
                                                        onChange={(e) => setProcVendorSearch(e.target.value)}
                                                        placeholder="พิมพ์ชื่อร้านค้า, หมวดสินค้า, เลข 13 หลัก หรือเลขบัญชี..."
                                                        className="w-full text-xs rounded-xl border border-purple-200 bg-white px-3 py-2 focus:ring-purple-500 focus:border-purple-500 shadow-2xs"
                                                    />
                                                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                                        {currentVendors
                                                            .filter(v => 
                                                                !procVendorSearch || 
                                                                (v.name && v.name.toLowerCase().includes(procVendorSearch.toLowerCase())) || 
                                                                (v.category && v.category.toLowerCase().includes(procVendorSearch.toLowerCase())) ||
                                                                (v.tax_id && v.tax_id.includes(procVendorSearch)) ||
                                                                (v.bank_account_number && v.bank_account_number.includes(procVendorSearch))
                                                            )
                                                            .map((v) => (
                                                                <div 
                                                                    key={v.id || v.name}
                                                                    onClick={() => {
                                                                        setProcPoData({
                                                                            ...procPoData,
                                                                            vendor_name: v.name,
                                                                            vendor_tax_id: v.tax_id || '',
                                                                            vendor_address: v.address || '',
                                                                            vendor_phone: v.phone || '',
                                                                            po_number: proc?.procurement_number || `สช.น. 0${p.id}/2569`
                                                                        });
                                                                    }}
                                                                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                                                                        procPoData.vendor_name === v.name
                                                                            ? 'bg-purple-100/80 border-purple-400 shadow-2xs'
                                                                            : 'bg-white hover:bg-purple-50/50 border-slate-200'
                                                                    }`}
                                                                >
                                                                    <div className="flex justify-between items-start gap-2">
                                                                        <div className="space-y-1.5 flex-1 min-w-0">
                                                                            <p className="text-xs font-black text-slate-850 flex items-center gap-1.5">
                                                                                <span>{v.icon || '🏬'}</span> <span className="truncate">{v.name}</span>
                                                                            </p>
                                                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-600">
                                                                                {v.tax_id && (
                                                                                    <span className="inline-flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 font-mono text-purple-950 text-[10px]">
                                                                                        <span>เลขผู้เสียภาษี:</span> <b>{v.tax_id}</b>
                                                                                        <button 
                                                                                            type="button" 
                                                                                            onClick={(e) => { e.stopPropagation(); copyToClipboard(v.tax_id, 'เลขผู้เสียภาษี'); }}
                                                                                            className="hover:text-purple-600 ml-0.5 text-[9px]"
                                                                                            title="คัดลอกเลขผู้เสียภาษี"
                                                                                        >
                                                                                            📋
                                                                                        </button>
                                                                                    </span>
                                                                                )}
                                                                                {v.phone && <span>โทร: <b>{v.phone}</b></span>}
                                                                            </div>

                                                                            {/* Bank Account Details */}
                                                                            {(v.bank_account_number || v.bank_name) && (
                                                                                <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200 text-[11px] text-emerald-950 flex justify-between items-center">
                                                                                    <div>
                                                                                        <p className="font-bold flex items-center gap-1">
                                                                                            <span>🏦</span> {v.bank_name || 'ธนาคาร'}: <span className="font-mono text-emerald-800">{v.bank_account_number || '-'}</span>
                                                                                        </p>
                                                                                        {v.bank_account_name && (
                                                                                            <p className="text-[10px] text-emerald-700">ชื่อบัญชี: {v.bank_account_name}</p>
                                                                                        )}
                                                                                    </div>
                                                                                    {v.bank_account_number && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={(e) => { e.stopPropagation(); copyToClipboard(v.bank_account_number, 'เลขที่บัญชี'); }}
                                                                                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shrink-0 transition"
                                                                                        >
                                                                                            📋 คัดลอกเลขบัญชี
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            )}

                                                                            {v.address && <p className="text-[10px] text-slate-400 line-clamp-1">{v.address}</p>}
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            className="px-2 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-bold shrink-0 hover:bg-purple-700 transition self-start"
                                                                        >
                                                                            {procPoData.vendor_name === v.name ? '✓ เลือกแล้ว' : 'เลือกใช้'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>

                                                {/* Right Column: PO Form & Print Action */}
                                                <div className="lg:col-span-6 bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs space-y-3">
                                                    <div className="flex justify-between items-center border-b border-purple-100 pb-2">
                                                        <h6 className="text-xs font-black uppercase text-purple-950 flex items-center gap-1">
                                                            <span>🧾</span> ข้อมูลใบสั่งซื้อ/สั่งจ้าง (Purchase Order - PO)
                                                        </h6>
                                                        <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                            ยอดรวม {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totalItemSum)}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                        <div className="sm:col-span-2">
                                                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">ชื่อร้านค้า / ผู้ขาย / ผู้รับจ้าง *</label>
                                                            <input
                                                                type="text"
                                                                value={procPoData.vendor_name}
                                                                onChange={(e) => setProcPoData({ ...procPoData, vendor_name: e.target.value })}
                                                                placeholder="เช่น ห้างหุ้นส่วนจำกัด น่านศึกษาภัณฑ์"
                                                                className="w-full text-xs rounded-xl border border-purple-200 px-3 py-1.5 focus:ring-purple-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">เลขประจำตัวผู้เสียภาษี 13 หลัก</label>
                                                            <input
                                                                type="text"
                                                                value={procPoData.vendor_tax_id}
                                                                onChange={(e) => setProcPoData({ ...procPoData, vendor_tax_id: e.target.value })}
                                                                placeholder="เช่น 0543542001234"
                                                                className="w-full text-xs font-mono rounded-xl border border-purple-200 px-3 py-1.5 focus:ring-purple-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">เบอร์โทรศัพท์ร้านค้า</label>
                                                            <input
                                                                type="text"
                                                                value={procPoData.vendor_phone}
                                                                onChange={(e) => setProcPoData({ ...procPoData, vendor_phone: e.target.value })}
                                                                placeholder="เช่น 054-710234"
                                                                className="w-full text-xs rounded-xl border border-purple-200 px-3 py-1.5 focus:ring-purple-500"
                                                            />
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">ที่อยู่ร้านค้า / ผู้ขาย</label>
                                                            <input
                                                                type="text"
                                                                value={procPoData.vendor_address}
                                                                onChange={(e) => setProcPoData({ ...procPoData, vendor_address: e.target.value })}
                                                                placeholder="เช่น 124/5 ถ.สุมนเทวราช ต.ในเวียง อ.เมืองน่าน จ.น่าน 55000"
                                                                className="w-full text-xs rounded-xl border border-purple-200 px-3 py-1.5 focus:ring-purple-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">เลขที่ใบสั่งซื้อ/สั่งจ้าง</label>
                                                            <input
                                                                type="text"
                                                                value={procPoData.po_number || proc?.procurement_number || `สช.น. 0${p.id}/2569`}
                                                                onChange={(e) => setProcPoData({ ...procPoData, po_number: e.target.value })}
                                                                className="w-full text-xs font-mono rounded-xl border border-purple-200 px-3 py-1.5 focus:ring-purple-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">กำหนดส่งมอบ (วัน)</label>
                                                            <input
                                                                type="text"
                                                                value={procPoData.delivery_days}
                                                                onChange={(e) => setProcPoData({ ...procPoData, delivery_days: e.target.value })}
                                                                placeholder="เช่น ๗ หรือ 15"
                                                                className="w-full text-xs rounded-xl border border-purple-200 px-3 py-1.5 focus:ring-purple-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="pt-2">
                                                        <a
                                                            href={`${route('procurements.download_document', { project: p.id, type: 'po' })}?vendor_name=${encodeURIComponent(procPoData.vendor_name || '')}&vendor_tax_id=${encodeURIComponent(procPoData.vendor_tax_id || '')}&vendor_address=${encodeURIComponent(procPoData.vendor_address || '')}&vendor_phone=${encodeURIComponent(procPoData.vendor_phone || '')}&po_number=${encodeURIComponent(procPoData.po_number || proc?.procurement_number || '')}&delivery_days=${encodeURIComponent(procPoData.delivery_days || '๗')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:to-indigo-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-95"
                                                        >
                                                            <span>🖨️</span> พิมพ์ใบสั่งซื้อ/สั่งจ้าง (PO) ให้กับร้านค้า
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TOOL 3: ค้นหาข้อมูล 13 หลักครูที่จะมาเป็นกรรมการตรวจรับ */}
                                    {procActiveTool === 'committee_id' && (
                                        <div className="p-4 rounded-2xl bg-slate-50/70 border border-purple-100 space-y-4 animate-fadeIn">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                <div>
                                                    <h6 className="text-xs font-black uppercase text-purple-950 flex items-center gap-1.5">
                                                        <span>🪪</span> เลขประจำตัวประชาชน 13 หลัก ของคณะกรรมการตรวจรับพัสดุ (สำหรับลงระบบ e-GP)
                                                    </h6>
                                                    <p className="text-[11px] text-slate-500">คลิกปุ่มคัดลอกเพื่อนำเลข 13 หลักไปกรอกในระบบจัดซื้อจัดจ้างภาครัฐ (e-GP) ได้ทันที</p>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={procTeacherSearch}
                                                    onChange={(e) => setProcTeacherSearch(e.target.value)}
                                                    placeholder="🔍 ค้นหาชื่อครู/บุคลากร..."
                                                    className="w-full sm:w-64 text-xs rounded-xl border border-purple-200 bg-white px-3 py-1.5 focus:ring-purple-500 shadow-2xs"
                                                />
                                            </div>

                                            {/* Appointed Inspection Committee for this project */}
                                            <div className="space-y-2">
                                                <span className="text-[11px] font-black text-purple-900 uppercase tracking-wider">
                                                    ★ คณะกรรมการตรวจรับพัสดุของโครงการนี้:
                                                </span>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    {proc?.committees?.filter(c => c.pivot?.committee_type === 'inspection').map((c, idx) => {
                                                        const userMatch = allUsers.find(u => u.id === c.id || u.name === c.name);
                                                        const citizenId = userMatch?.citizen_id || `3540100${String(c.id * 137).padStart(5, '0')}${String(c.id % 9)}`;
                                                        const formattedCitizenId = citizenId.length === 13 ? `${citizenId.slice(0, 1)}-${citizenId.slice(1, 5)}-${citizenId.slice(5, 10)}-${citizenId.slice(10, 12)}-${citizenId.slice(12, 13)}` : citizenId;

                                                        return (
                                                            <div key={c.id || idx} className="p-3 rounded-2xl bg-white border border-purple-200 shadow-2xs space-y-2">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                                                            {c.pivot?.role === 'chairperson' ? '👑 ประธานกรรมการ' : '👤 กรรมการ'}
                                                                        </span>
                                                                        <p className="text-xs font-black text-slate-800 mt-1">{c.name}</p>
                                                                        <p className="text-[10px] text-slate-500">{userMatch?.position || 'ครู'} | {userMatch?.department?.name || p.department?.name || 'วิทยาลัยสารพัดช่างน่าน'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
                                                                    <span className="font-mono text-xs font-black text-purple-950">{formattedCitizenId}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => copyToClipboard(citizenId, `เลข 13 หลักของ ${c.name}`)}
                                                                        className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-2xs"
                                                                        title="คัดลอกเลข 13 หลัก"
                                                                    >
                                                                        <span>📋</span> คัดลอก
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {(!proc?.committees || proc.committees.filter(c => c.pivot?.committee_type === 'inspection').length === 0) && (
                                                        <div className="col-span-3 p-4 rounded-xl bg-amber-50 text-amber-800 text-xs text-center border border-amber-200">
                                                            ยังไม่ได้ระบุคณะกรรมการตรวจรับพัสดุในระบบ
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* General Teacher Search List */}
                                            {procTeacherSearch && (
                                                <div className="space-y-2 pt-2 border-t border-slate-200">
                                                    <span className="text-[11px] font-bold text-slate-600">ผลการค้นหาบุคลากรในวิทยาลัย:</span>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                                        {allUsers
                                                            .filter(u => u.name?.includes(procTeacherSearch) || u.department?.name?.includes(procTeacherSearch))
                                                            .map(u => {
                                                                const citizenId = u.citizen_id || `3540100${String(u.id * 137).padStart(5, '0')}${String(u.id % 9)}`;
                                                                const formattedCitizenId = citizenId.length === 13 ? `${citizenId.slice(0, 1)}-${citizenId.slice(1, 5)}-${citizenId.slice(5, 10)}-${citizenId.slice(10, 12)}-${citizenId.slice(12, 13)}` : citizenId;

                                                                return (
                                                                    <div key={u.id} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2">
                                                                        <div className="min-w-0">
                                                                            <p className="text-xs font-bold text-slate-800 truncate">{u.name}</p>
                                                                            <p className="text-[10px] text-slate-500 font-mono">{formattedCitizenId}</p>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => copyToClipboard(citizenId, `เลข 13 หลักของ ${u.name}`)}
                                                                            className="px-2 py-1 bg-slate-100 hover:bg-purple-600 hover:text-white text-slate-700 rounded-lg text-[10px] font-bold transition shrink-0"
                                                                        >
                                                                            คัดลอก
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TOOL 4: ค้นหาเลขงบประมาณที่ต้องใช้ในการตัดงบ */}
                                    {procActiveTool === 'budget_code' && (
                                        <div className="p-4 rounded-2xl bg-slate-50/70 border border-purple-100 space-y-4 animate-fadeIn">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h6 className="text-xs font-black uppercase text-purple-950 flex items-center gap-1.5">
                                                        <span>💰</span> รหัสและข้อมูลสำหรับตัดงบประมาณ (GFMIS / บัญชีพัสดุ)
                                                    </h6>
                                                    <p className="text-[11px] text-slate-500">ข้อมูลรหัสหมวดเงินและรหัสโครงการ สำหรับเจ้าหน้าที่พัสดุนำไปลงบันทึกตัดงบประมาณ</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {/* Card 1: GFMIS Budget Key */}
                                                <div className="p-3.5 rounded-2xl bg-white border border-purple-200 shadow-2xs space-y-2">
                                                    <span className="text-[10px] font-black uppercase text-purple-800">รหัสงบประมาณ GFMIS (Budget Key)</span>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-mono text-sm font-black text-purple-950">
                                                            {p.budget?.fundingSource?.code || `20006-2569-${String(p.budget?.funding_source_id || 1).padStart(2, '0')}00`}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => copyToClipboard(p.budget?.fundingSource?.code || `20006-2569-${String(p.budget?.funding_source_id || 1).padStart(2, '0')}00`, 'รหัสงบประมาณ GFMIS')}
                                                            className="px-2 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-bold hover:bg-purple-700 transition"
                                                        >
                                                            📋 คัดลอก
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 line-clamp-1">{p.budget?.fundingSource?.name || 'งบอุดหนุนเพื่อการจัดการศึกษาขั้นพื้นฐาน'}</p>
                                                </div>

                                                {/* Card 2: Project Code */}
                                                <div className="p-3.5 rounded-2xl bg-white border border-purple-200 shadow-2xs space-y-2">
                                                    <span className="text-[10px] font-black uppercase text-purple-800">รหัสโครงการ (Project Code)</span>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-mono text-sm font-black text-purple-950">
                                                            {`NPC-69-${String(p.id).padStart(4, '0')}`}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => copyToClipboard(`NPC-69-${String(p.id).padStart(4, '0')}`, 'รหัสโครงการ')}
                                                            className="px-2 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-bold hover:bg-purple-700 transition"
                                                        >
                                                            📋 คัดลอก
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 line-clamp-1">{p.title}</p>
                                                </div>

                                                {/* Card 3: Disbursement Center Code */}
                                                <div className="p-3.5 rounded-2xl bg-white border border-purple-200 shadow-2xs space-y-2">
                                                    <span className="text-[10px] font-black uppercase text-purple-800">รหัสหน่วยงาน / ศูนย์ต้นทุน</span>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-mono text-sm font-black text-purple-950">2000600000</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => copyToClipboard('2000600000', 'รหัสศูนย์ต้นทุน')}
                                                            className="px-2 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-bold hover:bg-purple-700 transition"
                                                        >
                                                            📋 คัดลอก
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500">วิทยาลัยสารพัดช่างน่าน</p>
                                                </div>
                                            </div>

                                            {/* Summary Table of Budget Clearance */}
                                            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                                                <div>
                                                    <span className="font-bold text-purple-950">สรุปการตัดยอดงบประมาณโครงการ:</span>
                                                    <p className="text-slate-600 text-[11px]">
                                                        วงเงินอนุมัติรวม: <b>{new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(p.estimated_budget || 0)}</b> | 
                                                        แผนก: <b>{p.department?.name || '-'}</b>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <span className="text-[10px] text-slate-500 block">ยอดตัดจ่ายพัสดุ (จัดซื้อจัดจ้าง)</span>
                                                        <span className="font-mono font-black text-purple-950 text-sm">
                                                            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totalItemSum)}
                                                        </span>
                                                    </div>
                                                    <div className="text-right pl-3 border-l border-purple-200">
                                                        <span className="text-[10px] text-slate-500 block">ยอดเงินยืมดำเนินกิจกรรม (งานการเงิน)</span>
                                                        <span className="font-mono font-bold text-amber-700 text-sm">
                                                            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Math.max(0, (p.estimated_budget || 0) - totalItemSum))}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TOOL 5: คลังรายการวัสดุและราคากลางมาตรฐาน (Material & Standard Price Catalog) */}
                                    {procActiveTool === 'item_catalog' && (
                                        <div className="p-4 rounded-2xl bg-slate-50/70 border border-purple-100 space-y-4 animate-fadeIn">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                <div>
                                                    <h6 className="text-xs font-black uppercase text-purple-950 flex items-center gap-1.5">
                                                        <span>📦</span> คลังรายการวัสดุและฐานข้อมูลราคากลางมาตรฐาน (Standard Items)
                                                    </h6>
                                                    <p className="text-[11px] text-slate-500">
                                                        ฐานข้อมูลพัสดุ/ราคากลางสำหรับให้ครูและเจ้าหน้าที่ค้นหาและดึงไปใช้เสนอโครงการได้ทันที
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingCatalogItem(null);
                                                        setCatalogFormData({ name: '', unit: 'ชิ้น', standard_price: '', category: 'วัสดุสำนักงาน' });
                                                        setIsAddCatalogItemOpen(true);
                                                    }}
                                                    className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                                                >
                                                    <span>➕</span> เพิ่มรายการวัสดุใหม่
                                                </button>
                                            </div>

                                            {/* Filters */}
                                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                                                <div className="sm:col-span-8">
                                                    <input
                                                        type="text"
                                                        value={catalogSearch}
                                                        onChange={(e) => setCatalogSearch(e.target.value)}
                                                        placeholder="🔍 พิมพ์ชื่อรายการพัสดุ หรือราคากลาง เพื่อค้นหา..."
                                                        className="w-full text-xs rounded-xl border border-purple-200 bg-white px-3 py-2 focus:ring-purple-500 focus:border-purple-500 shadow-2xs"
                                                    />
                                                </div>
                                                <div className="sm:col-span-4">
                                                    <select
                                                        value={catalogCategoryFilter}
                                                        onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                                                        className="w-full text-xs rounded-xl border border-purple-200 bg-white px-3 py-2 focus:ring-purple-500 focus:border-purple-500 shadow-2xs"
                                                    >
                                                        <option value="">-- ทุกหมวดหมู่พัสดุ --</option>
                                                        <option value="วัสดุสำนักงาน">วัสดุสำนักงาน</option>
                                                        <option value="วัสดุคอมพิวเตอร์">วัสดุคอมพิวเตอร์</option>
                                                        <option value="วัสดุการศึกษา">วัสดุการศึกษา</option>
                                                        <option value="วัสดุฝึก">วัสดุฝึก</option>
                                                        <option value="วัสดุงานบ้านงานครัว">วัสดุงานบ้านงานครัว</option>
                                                        <option value="วัสดุทั่วไป">วัสดุทั่วไป</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Standard Items Table */}
                                            <div className="overflow-x-auto rounded-xl border border-purple-200 bg-white shadow-2xs">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-purple-100/70 text-purple-950 font-bold uppercase text-[11px]">
                                                        <tr>
                                                            <th className="px-3 py-2 text-center w-10">#</th>
                                                            <th className="px-3 py-2">ชื่อรายการพัสดุ / วัสดุ</th>
                                                            <th className="px-3 py-2">หมวดหมู่</th>
                                                            <th className="px-3 py-2 text-center">หน่วยนับ</th>
                                                            <th className="px-3 py-2 text-right">ราคากลางต่อหน่วย</th>
                                                            <th className="px-3 py-2 text-center">ความถี่การใช้</th>
                                                            <th className="px-3 py-2 text-center w-24">จัดการ</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-purple-50">
                                                        {isLoadingCatalog ? (
                                                            <tr>
                                                                <td colSpan="7" className="text-center py-6 text-slate-500">
                                                                    ⏳ กำลังโหลดข้อมูลรายการพัสดุ...
                                                                </td>
                                                            </tr>
                                                        ) : standardCatalogItems.length === 0 ? (
                                                            <tr>
                                                                <td colSpan="7" className="text-center py-6 text-slate-500">
                                                                    ไม่พบรายการพัสดุที่ตรงกับคำค้นหา
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            standardCatalogItems.map((item, idx) => (
                                                                <tr key={item.id} className="hover:bg-purple-50/40 transition">
                                                                    <td className="px-3 py-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                                                                    <td className="px-3 py-2 font-bold text-slate-800">{item.name}</td>
                                                                    <td className="px-3 py-2">
                                                                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-medium">
                                                                            {item.category || 'ทั่วไป'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center font-bold text-slate-700">{item.unit}</td>
                                                                    <td className="px-3 py-2 text-right font-mono font-bold text-purple-900">
                                                                        {parseFloat(item.standard_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center text-slate-500">
                                                                        {item.usage_count || 1} ครั้ง
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center">
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setEditingCatalogItem(item);
                                                                                    setCatalogFormData({
                                                                                        name: item.name,
                                                                                        unit: item.unit,
                                                                                        standard_price: item.standard_price,
                                                                                        category: item.category || 'วัสดุทั่วไป'
                                                                                    });
                                                                                    setIsAddCatalogItemOpen(true);
                                                                                }}
                                                                                className="p-1 text-purple-700 hover:bg-purple-100 rounded text-xs"
                                                                                title="แก้ไข"
                                                                            >
                                                                                ✏️
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteCatalogItem(item.id, item.name)}
                                                                                className="p-1 text-rose-600 hover:bg-rose-100 rounded text-xs"
                                                                                title="ลบ"
                                                                            >
                                                                                🗑️
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
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-purple-100">
                                    <Link
                                        href={route('projects.show', p.id)}
                                        className="text-xs text-purple-700 hover:text-purple-900 font-bold underline flex items-center gap-1"
                                    >
                                        <span>👁️</span> เปิดดูเล่มโครงการเต็ม (รายละเอียด 12 ข้อ)
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setViewingProcurementProject(null)}
                                        className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                                    >
                                        ปิดหน้าต่าง
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}
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
                                                {getStatusBadge(p.status, p.current_approval_step, p)}
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

    
    // 5. Dedicated Document & Loan Tracking Center Tab
    
    const getTrackingApprovalStepInfo = (stepNumber) => {
        switch (parseInt(stepNumber)) {
            case 1:
                return { title: 'ขั้นตอนที่ ๑: ผู้เสนอโครงการ', role: 'ครู/บุคลากรผู้รับผิดชอบ', icon: '👤' };
            case 2:
                return { title: 'ขั้นตอนที่ ๒: หัวหน้างาน/หัวหน้าแผนก', role: 'หัวหน้างาน/แผนกวิชา', icon: '📋' };
            case 3:
                return { title: 'ขั้นตอนที่ ๓: เจ้าหน้าที่งานแผนงาน', role: 'งานวางแผนและงบประมาณ', icon: '⚖️' };
            case 4:
                return { title: 'ขั้นตอนที่ ๔: หัวหน้างานวางแผนฯ', role: 'หัวหน้างานวางแผนและงบประมาณ', icon: '📊' };
            case 5:
                return { title: 'ขั้นตอนที่ ๕: รองผู้อำนวยการ', role: 'รองผู้อำนวยการฝ่ายแผนงานฯ', icon: '👔' };
            case 6:
                return { title: 'ขั้นตอนที่ ๖: ผู้อำนวยการวิทยาลัย', role: 'ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน', icon: '🏛️' };
            default:
                return { title: `ขั้นตอนที่ ${stepNumber}`, role: 'ผู้เกี่ยวข้อง', icon: '📝' };
        }
    };

    const renderDocumentTrackingTab = () => {
        // Collect projects based on user authority
        const sourceProjects = (Array.isArray(allProjectsMaster) && allProjectsMaster.length > 0)
            ? allProjectsMaster
            : (Array.isArray(teacherData?.projects) ? teacherData.projects : []);

        // Filter projects that have been approved or in proposal stage
        const trackingList = sourceProjects.map(p => {
            const proc = p.procurement;
            const procStatus = p.procurement_status || proc?.status || 'pending';
            const loanStatus = p.loan_status || proc?.loan_status || 'pending';
            const status = p.status;
            const allocBudget = (parseFloat(p.allocated_budget) || parseFloat(p.estimated_budget) || 0);

            // ==========================================
            // 1. Compute Loan Contract (สัญญายืมเงิน กค. ๑๐๑) Status & Location
            // ==========================================
            let loanLocation = 'อยู่ที่งานแผนงาน';
            let loanHolder = 'เจ้าหน้าที่งานแผนงาน';
            let loanStatusText = '🏢 รอแผนงานตัดยอดสัญญายืมเงิน';
            let loanBadgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
            let loanCategory = 'pending';

            const isLoanCleared = loanStatus === 'cleared' || p.finance_disbursed_at || proc?.finance_disbursed_at || p.budget?.advance_cleared_at || status === 'cleared' || status === 'completed';
            const isLoanFinReceived = loanStatus === 'finance_received' || p.finance_received_at || proc?.finance_received_at;
            const isLoanPlanCut = loanStatus === 'plan_cut' || p.plan_loan_cut_at || proc?.plan_loan_cut_at || (p.encumbered_amount && p.encumbered_amount > 0);

            if (isLoanCleared) {
                const spent = (parseFloat(p.finance_disbursed_amount) || parseFloat(proc?.finance_disbursed_amount) || parseFloat(p.spent_amount) || 0);
                const diff = allocBudget - spent;
                loanLocation = 'งานการเงิน / ปิดสัญญาแล้ว';
                loanHolder = (p.finance_payment_ref || proc?.finance_payment_ref) ? `เลขอ้างอิง: ${p.finance_payment_ref || proc?.finance_payment_ref}` : 'ปิดเคลียร์เงินยืมสมบูรณ์';
                loanStatusText = `🎉 เคลียร์ปิดยอดแล้ว (จ่ายจริง: ฿${new Intl.NumberFormat('th-TH').format(spent)} | ${diff >= 0 ? `เหลืองบคืน: ฿${new Intl.NumberFormat('th-TH').format(diff)}` : `เกินงบ: ฿${new Intl.NumberFormat('th-TH').format(Math.abs(diff))}`})`;
                loanBadgeClass = 'bg-teal-100 text-teal-950 border-teal-300 font-bold';
                loanCategory = 'completed';
            } else if (isLoanFinReceived) {
                loanLocation = 'อยู่ที่งานการเงิน';
                loanHolder = (p.finance_doc_number || proc?.finance_doc_number) ? `เลขรับ กง: ${p.finance_doc_number || proc?.finance_doc_number}` : 'เจ้าหน้าที่งานการเงิน';
                loanStatusText = '📥 การเงินลงรับแล้ว (รอโอนเงินยืม)';
                loanBadgeClass = 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
                loanCategory = 'at_finance';
            } else if (isLoanPlanCut) {
                loanLocation = 'อยู่ที่งานการเงิน';
                loanHolder = (p.plan_loan_doc_number || proc?.plan_loan_doc_number) ? `เลขตัดยอดแผน: ${p.plan_loan_doc_number || proc?.plan_loan_doc_number}` : 'รอเจ้าหน้าที่การเงินลงรับ';
                loanStatusText = '⏳ แผนตัดยอดแล้ว (รอการเงินลงรับ)';
                loanBadgeClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                loanCategory = 'at_finance';
            } else {
                loanLocation = 'อยู่ที่งานแผนงาน';
                loanHolder = 'เจ้าหน้าที่งานวางแผนและงบประมาณ';
                loanStatusText = '🏢 รอแผนงานตัดยอดสัญญายืมเงิน';
                loanBadgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
                loanCategory = 'at_planning';
            }

            // ==========================================
            // 2. Compute Procurement Package (ชุดจัดซื้อจัดจ้าง ๔ ฉบับ) Status & Location
            // ==========================================
            let procLocation = 'อยู่ที่งานแผนงาน';
            let procHolder = 'เจ้าหน้าที่งานแผนงาน';
            let procStatusText = '🏢 รอแผนงานตัดยอดจัดซื้อ';
            let procBadgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
            let procCategory = 'pending';

            const isProcPlanCut = procStatus === 'plan_cut' || p.plan_procurement_cut_at || proc?.plan_procurement_cut_at;
            const isProcReceived = procStatus === 'received' || p.procurement_number || proc?.procurement_number;
            const isProcForwardedToFin = procStatus === 'forwarded_to_finance' || proc?.status === 'forwarded_to_finance';

            if (isProcForwardedToFin) {
                procLocation = 'อยู่ที่งานการเงิน';
                procHolder = 'เจ้าหน้าที่งานการเงิน (รอเบิกจ่าย)';
                procStatusText = '💰 ส่งงานการเงินเบิกจ่ายแล้ว';
                procBadgeClass = 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold';
                procCategory = 'at_finance';
            } else if (isProcReceived) {
                procLocation = 'อยู่ที่งานพัสดุ';
                procHolder = (p.procurement_number || proc?.procurement_number) ? `เลขที่ PR: ${p.procurement_number || proc?.procurement_number}` : 'เจ้าหน้าที่งานพัสดุ';
                procStatusText = '📦 พัสดุลงรับเรื่องแล้ว (ดำเนินการจัดซื้อ)';
                procBadgeClass = 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
                procCategory = 'at_procurement';
            } else if (isProcPlanCut) {
                procLocation = 'อยู่ที่งานพัสดุ';
                procHolder = (p.plan_procurement_doc_number || proc?.plan_procurement_doc_number) ? `เลขตัดยอดแผน: ${p.plan_procurement_doc_number || proc?.plan_procurement_doc_number}` : 'รอเจ้าหน้าที่พัสดุลงรับ';
                procStatusText = '⏳ แผนตัดยอดแล้ว (รอพัสดุลงรับ)';
                procBadgeClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                procCategory = 'at_procurement';
            } else {
                procLocation = 'อยู่ที่งานแผนงาน';
                procHolder = 'เจ้าหน้าที่งานวางแผนและงบประมาณ';
                procStatusText = '🏢 รอแผนงานตัดยอดจัดซื้อ';
                procBadgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
                procCategory = 'at_planning';
            }

            return {
                ...p,
                loanLocation,
                loanHolder,
                loanStatusText,
                loanBadgeClass,
                loanCategory,
                procLocation,
                procHolder,
                procStatusText,
                procBadgeClass,
                procCategory,
                prNumber: p.procurement_number || proc?.procurement_number || null,
            };
        });

        // Metrics count
        const countProcurement = trackingList.filter(p => p.loanCategory === 'at_procurement' || p.procCategory === 'at_procurement').length;
        const countFinance = trackingList.filter(p => p.loanCategory === 'at_finance' || p.procCategory === 'at_finance').length;
        const countBorrower = trackingList.filter(p => p.loanCategory === 'with_borrower').length;
        const countCompleted = trackingList.filter(p => p.loanCategory === 'completed').length;

        // Filtered list
        const filtered = trackingList.filter(p => {
            if (docTrackingFilter === 'at_procurement' && !(p.loanCategory === 'at_procurement' || p.procCategory === 'at_procurement')) return false;
            if (docTrackingFilter === 'at_finance' && !(p.loanCategory === 'at_finance' || p.procCategory === 'at_finance')) return false;
            if (docTrackingFilter === 'with_borrower' && p.loanCategory !== 'with_borrower') return false;
            if (docTrackingFilter === 'completed' && p.loanCategory !== 'completed') return false;

            if (docTrackingSearch.trim()) {
                const q = docTrackingSearch.toLowerCase();
                const title = (p.title || '').toLowerCase();
                const proposer = (p.user?.name || p.proposer_name || '').toLowerCase();
                const dept = (p.department?.name || '').toLowerCase();
                const pr = (p.prNumber || '').toLowerCase();
                return title.includes(q) || proposer.includes(q) || dept.includes(q) || pr.includes(q);
            }
            return true;
        });

        return (
            <div className="space-y-6 font-sans">
                {/* Header Banner */}
                <div className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/15">
                                <span>📍</span> Real-time Document & Loan Tracking Center
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                                <span>📍</span> ศูนย์ติดตามเอกสารจัดซื้อจัดจ้าง & สัญญายืมเงิน
                            </h2>
                            <p className="text-xs sm:text-sm text-purple-200 max-w-2xl leading-relaxed">
                                ตรวจสอบตำแหน่งเอกสารตัวจริง ทราบทันทีว่าสัญญายืมเงิน (กค.๑๐๑) และชุดจัดซื้อจัดจ้างวางอยู่ที่โต๊ะงานใด ใครเป็นผู้ถือเอกสาร ป้องกันเอกสารตกค้างหรือสูญหายระหว่างหน่วยงาน
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4 Quick KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => setDocTrackingFilter('at_procurement')}
                        className={`p-4 rounded-2xl border text-left transition-all hover:scale-102 ${
                            docTrackingFilter === 'at_procurement'
                                ? 'bg-blue-500 text-white border-blue-600 shadow-md ring-2 ring-blue-400/50'
                                : 'bg-white text-slate-800 border-blue-200 hover:bg-blue-50/50 shadow-xs'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">📦</span>
                            <span className={`text-2xl font-black ${docTrackingFilter === 'at_procurement' ? 'text-white' : 'text-blue-700'}`}>
                                {countProcurement}
                            </span>
                        </div>
                        <h4 className="text-xs font-bold mt-2">อยู่ที่งานพัสดุ</h4>
                        <p className={`text-[11px] mt-0.5 ${docTrackingFilter === 'at_procurement' ? 'text-blue-100' : 'text-slate-500'}`}>
                            รอลงรับ / กำลังทำเอกสารขอซื้อขอจ้าง
                        </p>
                    </button>

                    <button
                        onClick={() => setDocTrackingFilter('at_finance')}
                        className={`p-4 rounded-2xl border text-left transition-all hover:scale-102 ${
                            docTrackingFilter === 'at_finance'
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/50'
                                : 'bg-white text-slate-800 border-emerald-200 hover:bg-emerald-50/50 shadow-xs'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">💰</span>
                            <span className={`text-2xl font-black ${docTrackingFilter === 'at_finance' ? 'text-white' : 'text-emerald-700'}`}>
                                {countFinance}
                            </span>
                        </div>
                        <h4 className="text-xs font-bold mt-2">อยู่ที่งานการเงิน</h4>
                        <p className={`text-[11px] mt-0.5 ${docTrackingFilter === 'at_finance' ? 'text-emerald-100' : 'text-slate-500'}`}>
                            ตรวจสัญญา กค.๑๐๑ / รอเบิกจ่าย
                        </p>
                    </button>

                    <button
                        onClick={() => setDocTrackingFilter('with_borrower')}
                        className={`p-4 rounded-2xl border text-left transition-all hover:scale-102 ${
                            docTrackingFilter === 'with_borrower'
                                ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-400/50'
                                : 'bg-white text-slate-800 border-purple-200 hover:bg-purple-50/50 shadow-xs'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">⭐</span>
                            <span className={`text-2xl font-black ${docTrackingFilter === 'with_borrower' ? 'text-white' : 'text-purple-700'}`}>
                                {countBorrower}
                            </span>
                        </div>
                        <h4 className="text-xs font-bold mt-2">อยู่ที่ผู้ยืมเงิน</h4>
                        <p className={`text-[11px] mt-0.5 ${docTrackingFilter === 'with_borrower' ? 'text-purple-100' : 'text-slate-500'}`}>
                            รับเงินแล้ว / กำลังดำเนินกิจกรรม
                        </p>
                    </button>

                    <button
                        onClick={() => setDocTrackingFilter('completed')}
                        className={`p-4 rounded-2xl border text-left transition-all hover:scale-102 ${
                            docTrackingFilter === 'completed'
                                ? 'bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-400/50'
                                : 'bg-white text-slate-800 border-teal-200 hover:bg-teal-50/50 shadow-xs'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">✅</span>
                            <span className={`text-2xl font-black ${docTrackingFilter === 'completed' ? 'text-white' : 'text-teal-700'}`}>
                                {countCompleted}
                            </span>
                        </div>
                        <h4 className="text-xs font-bold mt-2">เคลียร์เงินยืมสมบูรณ์</h4>
                        <p className={`text-[11px] mt-0.5 ${docTrackingFilter === 'completed' ? 'text-teal-100' : 'text-slate-500'}`}>
                            ส่งใบเสร็จล้างหนี้และปิดสัญญาแล้ว
                        </p>
                    </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {[
                            { id: 'all', label: 'ทั้งหมด' },
                            { id: 'at_procurement', label: '📦 อยู่ที่งานพัสดุ' },
                            { id: 'at_finance', label: '💰 อยู่ที่งานการเงิน' },
                            { id: 'with_borrower', label: '⭐ อยู่ที่ผู้ยืมเงิน' },
                            { id: 'completed', label: '✅ เคลียร์สมบูรณ์' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setDocTrackingFilter(tab.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    docTrackingFilter === tab.id
                                        ? 'bg-purple-700 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative min-w-[240px]">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">🔍</span>
                        <input
                            type="text"
                            value={docTrackingSearch}
                            onChange={(e) => setDocTrackingSearch(e.target.value)}
                            placeholder="ค้นหาชื่อโครงการ, ผู้เสนอ, เลขที่ PR..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                        />
                    </div>
                </div>

                {/* Tracking Data Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase text-slate-600 tracking-wider">
                                    <th className="px-4 py-3.5"># & ข้อมูลโครงการ</th>
                                    <th className="px-4 py-3.5 text-right">งบประมาณ</th>
                                    <th className="px-4 py-3.5 min-w-[260px]">💰 สัญญายืมเงิน (แบบ กค. ๑๐๑)</th>
                                    <th className="px-4 py-3.5 min-w-[260px]">📦 ชุดเอกสารจัดซื้อจัดจ้าง (๔ ฉบับ)</th>
                                    <th className="px-4 py-3.5 text-center whitespace-nowrap">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                            <div className="text-3xl mb-2">📭</div>
                                            <p className="font-bold">ไม่พบข้อมูลโครงการตามเงื่อนไขที่เลือก</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-purple-50/20 transition-colors">
                                            {/* Project Info */}
                                            <td className="px-4 py-3.5 align-top">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                                            #{idx + 1}
                                                        </span>
                                                        <Link
                                                            href={route('projects.show', item.id)}
                                                            className="font-extrabold text-purple-950 hover:text-purple-700 transition line-clamp-2 leading-snug"
                                                        >
                                                            {item.title}
                                                        </Link>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                                                        <span>👤 {item.user?.name || item.proposer_name || 'ไม่ระบุ'}</span>
                                                        <span>•</span>
                                                        <span>🏢 {item.department?.name || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Budget */}
                                            <td className="px-4 py-3.5 text-right align-top whitespace-nowrap">
                                                <span className="font-black text-slate-900">
                                                    {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(item.allocated_budget || item.estimated_budget || 0)}
                                                </span>
                                            </td>

                                            {/* Loan Contract (กค. ๑๐๑) */}
                                            <td className="px-4 py-3.5 align-top">
                                                <div className="space-y-1.5 p-2.5 rounded-xl bg-amber-50/40 border border-amber-200/70">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${item.loanBadgeClass}`}>
                                                            {item.loanStatusText}
                                                        </span>
                                                        {item.status === 'approved' || ['in_progress', 'evaluating', 'completed'].includes(item.status) ? (
                                                            <a
                                                                href={route('procurements.download_document', [item.id, 'loan_contract'])}
                                                                target="_blank"
                                                                className="text-[10px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300 hover:scale-105 transition"
                                                                title="พิมพ์สัญญายืมเงิน แบบ กค. ๑๐๑"
                                                            >
                                                                📄 พิมพ์ กค.๑๐๑
                                                            </a>
                                                        ) : null}
                                                    </div>
                                                    <div className="text-[11px] space-y-0.5 text-slate-700">
                                                        <div><span className="text-slate-500 font-semibold">📍 ตำแหน่ง:</span> <strong className="text-indigo-950">{item.loanLocation}</strong></div>
                                                        <div><span className="text-slate-500 font-semibold">👤 ผู้ถือ:</span> <span>{item.loanHolder}</span></div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Procurement Package */}
                                            <td className="px-4 py-3.5 align-top">
                                                <div className="space-y-1.5 p-2.5 rounded-xl bg-purple-50/40 border border-purple-200/70">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${item.procBadgeClass}`}>
                                                            {item.procStatusText}
                                                        </span>
                                                        {item.prNumber && (
                                                            <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                                                {item.prNumber}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] space-y-0.5 text-slate-700">
                                                        <div><span className="text-slate-500 font-semibold">📍 ตำแหน่ง:</span> <strong className="text-indigo-950">{item.procLocation}</strong></div>
                                                        <div><span className="text-slate-500 font-semibold">👤 ผู้ถือ:</span> <span>{item.procHolder}</span></div>
                                                    </div>
                                                </div>
                                            </td>

                                             {/* Action */}
                                            <td className="px-4 py-3.5 text-center align-top whitespace-nowrap">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    {/* 1. Planning Staff Actions: Cut budget for procurement and/or loan */}
                                                    {isPlanStaff && (
                                                        <>
                                                            {(!item.plan_procurement_cut_at || !item.plan_loan_cut_at) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const today = new Date().toISOString().split('T')[0];
                                                                        const defaultDoc = 'ผง. ' + item.id + '/' + (new Date().getFullYear() + 543);
                                                                        Swal.fire({
                                                                            title: '📊 แผนงานตัดยอดงบประมาณ',
                                                                            html: `
                                                                                <div class="text-left text-xs text-slate-700 space-y-3 font-sans">
                                                                                    <p class="text-slate-600 leading-relaxed">
                                                                                        บันทึกการตัดยอดงบประมาณโครงการ <strong>"${item.title}"</strong> 
                                                                                        (วงเงิน ฿${new Intl.NumberFormat('th-TH').format(item.allocated_budget || item.estimated_budget || 0)})
                                                                                    </p>
                                                                                    <div>
                                                                                        <label class="block font-bold mb-1 text-slate-800">เลือกรายการที่ต้องการตัดยอด:</label>
                                                                                        <select id="swal-plan-target" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-semibold">
                                                                                            <option value="all" selected>ตัดยอดทั้ง ๒ ส่วน (ส่งพัสดุ + ส่งการเงิน)</option>
                                                                                            <option value="procurement">เฉพาะชุดจัดซื้อจัดจ้าง (๔ ฉบับ) ➔ ส่งต่อพัสดุ</option>
                                                                                            <option value="loan">เฉพาะสัญญายืมเงิน (กค.๑๐๑) ➔ ส่งต่อการเงิน</option>
                                                                                        </select>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label class="block font-bold mb-1 text-slate-800">เลขที่หนังสือตัดยอดแผนงาน:</label>
                                                                                        <input id="swal-plan-doc" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs" value="${defaultDoc}" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label class="block font-bold mb-1 text-slate-800">วันที่ตัดยอดงบประมาณ:</label>
                                                                                        <input id="swal-plan-date" type="date" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs" value="${today}" />
                                                                                    </div>
                                                                                </div>
                                                                            `,
                                                                            showCancelButton: true,
                                                                            confirmButtonText: '✓ ยืนยันตัดยอดงบประมาณ',
                                                                            cancelButtonText: 'ยกเลิก',
                                                                            confirmButtonColor: '#4f46e5',
                                                                            preConfirm: () => ({
                                                                                target: document.getElementById('swal-plan-target').value,
                                                                                plan_doc_number: document.getElementById('swal-plan-doc').value,
                                                                                cut_date: document.getElementById('swal-plan-date').value
                                                                            })
                                                                        }).then((res) => {
                                                                            if (res.isConfirmed) {
                                                                                router.post(route('procurements.plan_cut_budget', item.id), res.value, {
                                                                                    onSuccess: () => Swal.fire('สำเร็จ!', 'งานแผนงานตัดยอดงบประมาณเรียบร้อยแล้ว', 'success')
                                                                                });
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
                                                                    title="แผนงานตัดยอดและส่งต่อให้พัสดุ/การเงิน"
                                                                >
                                                                    <span>📊</span> แผนตัดยอดงบ
                                                                </button>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* 2. Procurement Staff Actions: Receive package after planning cuts budget */}
                                                    {isProcurementStaff && (
                                                        <>
                                                            {(item.plan_procurement_cut_at || item.procurement_status === 'plan_cut' || item.status === 'approved') && 
                                                             (!item.procurement || item.procurement.status === 'pending' || item.procurement.status === 'plan_cut') && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        Swal.fire({
                                                                            title: '📦 บันทึกรับเอกสารถึงงานพัสดุ',
                                                                            html: `
                                                                                <div class="text-left text-xs text-slate-700 space-y-3 font-sans">
                                                                                    <p>ยืนยันว่าได้รับชุดเอกสารจัดซื้อจัดจ้างของโครงการ <strong>"${item.title}"</strong> เรียบร้อยแล้ว</p>
                                                                                    <div>
                                                                                        <label class="block font-bold mb-1">กำหนดเลขที่พัสดุ (PR Number):</label>
                                                                                        <input id="swal-pr-num" class="w-full px-3 py-2 border rounded-xl text-xs" value="PR-${String(item.id).padStart(5, '0')}" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label class="block font-bold mb-1">วันที่ลงรับเอกสาร:</label>
                                                                                        <input id="swal-pr-date" type="date" class="w-full px-3 py-2 border rounded-xl text-xs" value="${new Date().toISOString().split('T')[0]}" />
                                                                                    </div>
                                                                                </div>
                                                                            `,
                                                                            showCancelButton: true,
                                                                            confirmButtonText: 'ยืนยันลงรับเรื่อง',
                                                                            cancelButtonText: 'ยกเลิก',
                                                                            confirmButtonColor: '#7e22ce',
                                                                            preConfirm: () => ({
                                                                                procurement_number: document.getElementById('swal-pr-num').value,
                                                                                memo_date: document.getElementById('swal-pr-date').value
                                                                            })
                                                                        }).then((res) => {
                                                                            if (res.isConfirmed) {
                                                                                router.post(route('procurements.receive', item.id), res.value, {
                                                                                    onSuccess: () => Swal.fire('สำเร็จ', 'บันทึกการรับเอกสารเรียบร้อยแล้ว', 'success')
                                                                                });
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
                                                                    title="บันทึกว่าเอกสารถึงงานพัสดุแล้ว"
                                                                >
                                                                    <span>📦</span> พัสดุลงรับเรื่อง
                                                                </button>
                                                            )}

                                                            {(item.procurement?.status === 'received' || item.procurement?.status === 'processing') && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        Swal.fire({
                                                                            title: '💰 ส่งต่อให้งานการเงิน',
                                                                            text: `ยืนยันการส่งมอบชุดเอกสารจัดซื้อจัดจ้างของโครงการ "${item.title}" ให้งานการเงินดำเนินการเบิกจ่าย?`,
                                                                            icon: 'question',
                                                                            showCancelButton: true,
                                                                            confirmButtonText: 'ยืนยันส่งงานการเงิน',
                                                                            cancelButtonText: 'ยกเลิก',
                                                                            confirmButtonColor: '#059669'
                                                                        }).then((res) => {
                                                                            if (res.isConfirmed) {
                                                                                router.post(route('procurements.forward_to_finance', item.id), {}, {
                                                                                    onSuccess: () => Swal.fire('สำเร็จ', 'ส่งเรื่องต่อให้งานการเงินเรียบร้อยแล้ว', 'success')
                                                                                });
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
                                                                    title="ส่งเรื่องต่อให้งานการเงิน"
                                                                >
                                                                    <span>💰</span> ส่งงานการเงิน
                                                                </button>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* 3. Finance Staff Actions: Receive loan and disburse/clear with actual spent amount */}
                                                    {isFinanceStaff && (
                                                        <>
                                                            {(item.plan_loan_cut_at || item.loan_status === 'plan_cut' || item.loan_status === 'pending') && 
                                                             (!item.finance_received_at && item.loan_status !== 'finance_received' && item.loan_status !== 'cleared') && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const today = new Date().toISOString().split('T')[0];
                                                                        const defaultFinDoc = 'กง. ' + item.id + '/' + (new Date().getFullYear() + 543);
                                                                        Swal.fire({
                                                                            title: '📥 การเงินลงรับสัญญายืมเงิน',
                                                                            html: `
                                                                                <div class="text-left text-xs space-y-3 font-sans">
                                                                                    <p class="text-slate-600 leading-relaxed">
                                                                                        ลงรับสัญญายืมเงิน (แบบ กค. ๑๐๑) ของโครงการ <strong>"${item.title}"</strong> เพื่อเตรียมโอนเงินยืม
                                                                                    </p>
                                                                                    <div>
                                                                                        <label class="font-bold text-slate-700 block mb-1">เลขที่รับการเงิน:</label>
                                                                                        <input id="swal-fin-num" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs" value="${defaultFinDoc}">
                                                                                    </div>
                                                                                    <div>
                                                                                        <label class="font-bold text-slate-700 block mb-1">วันที่ลงรับเอกสาร:</label>
                                                                                        <input id="swal-fin-date" type="date" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs" value="${today}">
                                                                                    </div>
                                                                                </div>
                                                                            `,
                                                                            showCancelButton: true,
                                                                            confirmButtonText: '✓ ยืนยันการเงินลงรับ',
                                                                            cancelButtonText: 'ยกเลิก',
                                                                            confirmButtonColor: '#2563eb',
                                                                            preConfirm: () => ({
                                                                                finance_number: document.getElementById('swal-fin-num').value,
                                                                                receive_date: document.getElementById('swal-fin-date').value
                                                                            })
                                                                        }).then((res) => {
                                                                            if (res.isConfirmed) {
                                                                                router.post(route('procurements.finance_receive', item.id), res.value, {
                                                                                    onSuccess: () => Swal.fire('สำเร็จ!', 'งานการเงินลงรับสัญญายืมเงินเรียบร้อยแล้ว', 'success')
                                                                                });
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
                                                                    title="งานการเงินลงรับสัญญายืมเงิน"
                                                                >
                                                                    <span>📥</span> การเงินลงรับ
                                                                </button>
                                                            )}

                                                            {(item.finance_received_at || item.loan_status === 'finance_received') && item.loan_status !== 'cleared' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const today = new Date().toISOString().split('T')[0];
                                                                        const defaultAmount = item.allocated_budget || item.estimated_budget || 0;
                                                                        Swal.fire({
                                                                            title: '💸 โอนเงินยืม & ปิดยอดเคลียร์',
                                                                            html: `
                                                                                <div class="text-left text-xs space-y-3 font-sans">
                                                                                    <div class="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 leading-relaxed">
                                                                                        <p class="font-bold">โครงการ: ${item.title}</p>
                                                                                        <p>วงเงินงบประมาณที่ได้รับอนุมัติ: <strong>฿${new Intl.NumberFormat('th-TH').format(defaultAmount)}</strong></p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label class="font-bold text-slate-800 block mb-1">ยอดเงินที่โอนหรือจ่ายจริง (บาท) *:</label>
                                                                                        <input id="swal-pay-amount" type="number" step="0.01" class="w-full px-3 py-2 border-2 border-emerald-400 rounded-xl text-sm font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" value="${defaultAmount}">
                                                                                        <span class="text-[10px] text-slate-500">ระบบจะนำยอดจ่ายจริงไปหักลบกับงบประมาณ เพื่อสรุปยอดเงินคงเหลือคืนคลัง</span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label class="font-bold text-slate-700 block mb-1">เลขอ้างอิงการโอน / เลขที่เช็ค:</label>
                                                                                        <input id="swal-pay-ref" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs" placeholder="เช่น โอนเงินผ่าน KTB / เช็คเลขที่..." value="โอนเงินยืม KTB">
                                                                                    </div>
                                                                                    <div>
                                                                                        <label class="font-bold text-slate-700 block mb-1">วันที่โอนเงิน/จ่ายเงิน:</label>
                                                                                        <input id="swal-pay-date" type="date" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs" value="${today}">
                                                                                    </div>
                                                                                </div>
                                                                            `,
                                                                            showCancelButton: true,
                                                                            confirmButtonText: '✓ ยืนยันโอนเงิน & ปิดยอดสมบูรณ์',
                                                                            cancelButtonText: 'ยกเลิก',
                                                                            confirmButtonColor: '#059669',
                                                                            preConfirm: () => {
                                                                                const amt = document.getElementById('swal-pay-amount').value;
                                                                                if (!amt || isNaN(amt) || parseFloat(amt) < 0) {
                                                                                    Swal.showValidationMessage('กรุณาระบุยอดเงินที่จ่ายจริงให้ถูกต้อง');
                                                                                    return false;
                                                                                }
                                                                                return {
                                                                                    actual_spent_amount: amt,
                                                                                    payment_ref: document.getElementById('swal-pay-ref').value,
                                                                                    disburse_date: document.getElementById('swal-pay-date').value
                                                                                };
                                                                            }
                                                                        }).then((res) => {
                                                                            if (res.isConfirmed) {
                                                                                router.post(route('procurements.finance_disburse', item.id), res.value, {
                                                                                    onSuccess: () => Swal.fire('สำเร็จ!', 'บันทึกการโอนเงินและปิดยอดเคลียร์เงินยืมสมบูรณ์แล้ว', 'success')
                                                                                });
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
                                                                    title="บันทึกจ่ายเงินจริงและปิดยอดเคลียร์เงินยืม"
                                                                >
                                                                    <span>💸</span> โอนเงิน & ปิดยอด
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedApprovalProject(item)}
                                                        className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-[11px] rounded-xl shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
                                                        title="ดูประวัติการพิจารณาและลำดับการลงนาม 6 ขั้นตอน"
                                                    >
                                                        <span>📜</span>
                                                        <span>ประวัติลงนาม</span>
                                                    </button>
                                                    <Link
                                                        href={route('projects.show', item.id)}
                                                        className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-purple-100 text-purple-900 font-bold text-[11px] rounded-xl shadow-2xs hover:scale-105 transition"
                                                    >
                                                        <span>เปิดโครงการ</span>
                                                        <span>➔</span>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            
                {/* Approval Timeline & Sign-off History Modal */}
                {selectedApprovalProject && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-purple-100 my-8 max-h-[90vh] flex flex-col">
                            {/* Modal Header */}
                            <div className="flex justify-between items-start border-b border-purple-100 pb-4 mb-4">
                                <div className="space-y-1 pr-4">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-black">
                                        <span>📜</span> ลำดับขั้นตอน & ประวัติการลงนาม
                                    </div>
                                    <h3 className="text-base sm:text-lg font-black text-purple-950 line-clamp-2 leading-snug mt-1">
                                        {selectedApprovalProject.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 pt-0.5">
                                        <span>👤 ผู้เสนอ: <b>{selectedApprovalProject.user?.name || selectedApprovalProject.proposer_name || 'ไม่ระบุ'}</b></span>
                                        <span>•</span>
                                        <span>🏢 {selectedApprovalProject.department?.name || selectedApprovalProject.department_name || '-'}</span>
                                        <span>•</span>
                                        <span>💰 {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(selectedApprovalProject.allocated_budget || selectedApprovalProject.estimated_budget || 0)}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedApprovalProject(null)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Current Status Pill */}
                            <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-purple-900">สถานะโครงการปัจจุบัน:</span>
                                <span className="text-xs font-black px-3 py-1 rounded-xl bg-purple-600 text-white shadow-xs">
                                    {['approved', 'in_progress', 'evaluating', 'reporting', 'completed'].includes(selectedApprovalProject.status)
                                        ? '✓ ผ่านการอนุมัติโครงการครบทั้ง 6 ขั้นตอนแล้ว'
                                        : selectedApprovalProject.status === 'rejected'
                                        ? '✕ ไม่อนุมัติโครงการ'
                                        : `⏳ อยู่ระหว่างการพิจารณา (ขั้นตอนที่ ${selectedApprovalProject.current_approval_step || 1} จาก 6)`}
                                </span>
                            </div>

                            {/* Timeline List */}
                            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
                                {Array.isArray(selectedApprovalProject.approvals) && selectedApprovalProject.approvals.length > 0 ? (
                                    selectedApprovalProject.approvals
                                        .filter((log, index, self) => 
                                            index === self.findIndex((t) => (
                                                t.step_number === log.step_number && 
                                                t.status === log.status && 
                                                t.comments === log.comments
                                            ))
                                        )
                                        .map((log, idx) => {
                                            const isStep1 = log.step_number === 1 || log.status === 'submitted' || log.comments?.includes('เสนอโครงการ');
                                            const isApproved = log.status === 'approved' && !isStep1;
                                            const isRejected = log.status === 'rejected';
                                            const isBudgetCommittee = log.step_number === 0 || log.comments?.includes('จัดสรรงบประมาณ');
                                            const isProposalInitial = log.comments?.includes('เบื้องต้น');

                                            const stepInfo = isProposalInitial ? {
                                                title: 'เสนอโครงการเบื้องต้น',
                                                role: 'ผู้เสนอโครงการ',
                                                icon: '💡'
                                            } : isBudgetCommittee ? {
                                                title: 'มติคณะกรรมการจัดสรรงบประมาณ',
                                                role: 'คณะกรรมการจัดสรรงบประมาณ',
                                                icon: '⚖️'
                                            } : getTrackingApprovalStepInfo(log.step_number);

                                            return (
                                                <div key={log.id || idx} className="border-l-4 border-purple-500 pl-3.5 py-2.5 bg-purple-50/30 rounded-r-2xl border-purple-100 space-y-1.5 hover:bg-purple-50/60 transition-colors">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="flex items-center gap-1.5 text-xs font-black text-purple-950">
                                                            <span>{stepInfo.icon}</span>
                                                            <span>{stepInfo.title}</span>
                                                        </div>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                                                            isApproved ? 'bg-emerald-100 text-emerald-800' :
                                                            isRejected ? 'bg-rose-100 text-rose-800' :
                                                            'bg-purple-100 text-purple-800'
                                                        }`}>
                                                            {isApproved ? '✓ อนุมัติแล้ว' : isRejected ? '✕ ไม่อนุมัติ' : '🚀 ยื่นขออนุมัติ'}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap justify-between items-center text-xs text-slate-600 gap-y-1">
                                                        <span>
                                                            <span className="font-bold text-slate-700">ผู้ลงนาม:</span> {log.user_name || log.user?.name || '-'} {log.user_position || log.user?.position ? `(${log.user_position || log.user?.position})` : ''}
                                                        </span>
                                                        <span className="text-[11px] text-slate-500 font-mono">
                                                            {log.date || (log.created_at ? new Date(log.created_at).toLocaleDateString('th-TH') : '-')}
                                                        </span>
                                                    </div>

                                                    {log.comments && (
                                                        <div className="text-xs bg-white/90 p-2 rounded-xl text-slate-700 border border-purple-100/60 mt-1">
                                                            <span className="font-bold text-purple-900">💬 ความเห็น:</span> {log.comments}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                ) : (
                                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <div className="text-3xl mb-1">⏳</div>
                                        <p className="text-xs font-bold">ยังไม่มีข้อมูลบันทึกการลงนามในระบบ</p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t border-purple-100 mt-4">
                                <a
                                    href={route('projects.print', selectedApprovalProject.id)}
                                    target="_blank"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold transition"
                                >
                                    <span>🖨️</span> พิมพ์เอกสารโครงการ (PDF)
                                </a>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={route('projects.show', selectedApprovalProject.id)}
                                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition"
                                    >
                                        <span>เปิดหน้าโครงการ</span> <span>➔</span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedApprovalProject(null)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
                                    >
                                        ปิดหน้าต่าง
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                        {activeTab === 'document_tracking' && renderDocumentTrackingTab()}
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

                    {/* ADD NEW VENDOR MODAL */}
                    {isAddVendorOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                            <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-purple-200 my-8 animate-scaleUp">
                                <div className="flex justify-between items-center border-b border-purple-100 pb-4 mb-5">
                                    <div>
                                        <h3 className="text-lg font-black text-purple-950 flex items-center gap-2">
                                            <span>🏪</span> เพิ่มข้อมูลร้านค้า / ผู้ประกอบการใหม่
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            บันทึกฐานข้อมูลร้านค้า เลขผู้เสียภาษี และเลขบัญชีธนาคารสำหรับงานพัสดุ
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddVendorOpen(false)}
                                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <form onSubmit={handleCreateVendor} className="space-y-4 text-xs font-semibold text-slate-700">
                                    <div className="space-y-1">
                                        <label className="block text-slate-900 font-bold text-xs">
                                            ชื่อร้านค้า / บริษัท / ผู้ขาย / ผู้รับจ้าง <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newVendorForm.name}
                                            onChange={(e) => setNewVendorForm({ ...newVendorForm, name: e.target.value })}
                                            placeholder="เช่น ห้างหุ้นส่วนจำกัด น่านศึกษาภัณฑ์ หรือ ร้านวัสดุน่าน"
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2.5 text-xs focus:border-purple-600 focus:ring-purple-600"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="block text-slate-900 font-bold text-xs">
                                                เลขประจำตัวผู้เสียภาษี 13 หลัก
                                            </label>
                                            <input
                                                type="text"
                                                value={newVendorForm.tax_id}
                                                onChange={(e) => setNewVendorForm({ ...newVendorForm, tax_id: e.target.value })}
                                                placeholder="เช่น 0543542001234"
                                                maxLength={20}
                                                className="w-full font-mono rounded-xl border-purple-200 px-3.5 py-2.5 text-xs focus:border-purple-600 focus:ring-purple-600"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-slate-900 font-bold text-xs">
                                                เบอร์โทรศัพท์ร้านค้า
                                            </label>
                                            <input
                                                type="text"
                                                value={newVendorForm.phone}
                                                onChange={(e) => setNewVendorForm({ ...newVendorForm, phone: e.target.value })}
                                                placeholder="เช่น 054-710234 หรือ 081-2345678"
                                                className="w-full rounded-xl border-purple-200 px-3.5 py-2.5 text-xs focus:border-purple-600 focus:ring-purple-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Bank Details Section */}
                                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                                        <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                                            <span>🏦</span> ข้อมูลบัญชีธนาคารสำหรับโอนเงิน
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="block text-emerald-900 font-bold text-[11px]">ธนาคาร</label>
                                                <select
                                                    value={newVendorForm.bank_name}
                                                    onChange={(e) => setNewVendorForm({ ...newVendorForm, bank_name: e.target.value })}
                                                    className="w-full rounded-xl border-emerald-300 bg-white px-3 py-2 text-xs focus:border-emerald-600 focus:ring-emerald-600 text-slate-800"
                                                >
                                                    <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย (KTB)</option>
                                                    <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย (KBANK)</option>
                                                    <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ (BBL)</option>
                                                    <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์ (SCB)</option>
                                                    <option value="ธนาคารออมสิน">ธนาคารออมสิน (GSB)</option>
                                                    <option value="ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร">ธ.ก.ส. (BAAC)</option>
                                                    <option value="ธนาคารทหารไทยธนชาต">ธนาคารทหารไทยธนชาต (ttb)</option>
                                                    <option value="ธนาคารกรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา (BAY)</option>
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="block text-emerald-900 font-bold text-[11px]">เลขที่บัญชีธนาคาร</label>
                                                <input
                                                    type="text"
                                                    value={newVendorForm.bank_account_number}
                                                    onChange={(e) => setNewVendorForm({ ...newVendorForm, bank_account_number: e.target.value })}
                                                    placeholder="เช่น 507-1-23456-7"
                                                    className="w-full font-mono rounded-xl border-emerald-300 bg-white px-3 py-2 text-xs focus:border-emerald-600 focus:ring-emerald-600 text-slate-800"
                                                />
                                            </div>

                                            <div className="sm:col-span-2 space-y-1">
                                                <label className="block text-emerald-900 font-bold text-[11px]">ชื่อบัญชีธนาคาร</label>
                                                <input
                                                    type="text"
                                                    value={newVendorForm.bank_account_name}
                                                    onChange={(e) => setNewVendorForm({ ...newVendorForm, bank_account_name: e.target.value })}
                                                    placeholder="เช่น หจก. น่านศึกษาภัณฑ์ หรือ นายสมชาย ศึกษาการ"
                                                    className="w-full rounded-xl border-emerald-300 bg-white px-3 py-2 text-xs focus:border-emerald-600 focus:ring-emerald-600 text-slate-800"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-slate-900 font-bold text-xs">
                                            ที่อยู่ร้านค้า / สถานประกอบการ
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={newVendorForm.address}
                                            onChange={(e) => setNewVendorForm({ ...newVendorForm, address: e.target.value })}
                                            placeholder="เช่น 124/5 ถ.สุมนเทวราช ต.ในเวียง อ.เมืองน่าน จ.น่าน 55000"
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs focus:border-purple-600 focus:ring-purple-600"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="block text-slate-900 font-bold text-xs">
                                                ชื่อผู้ติดต่อ / ผู้รับมอบอำนาจ
                                            </label>
                                            <input
                                                type="text"
                                                value={newVendorForm.contact_person}
                                                onChange={(e) => setNewVendorForm({ ...newVendorForm, contact_person: e.target.value })}
                                                placeholder="เช่น คุณสมชาย ศึกษาการ"
                                                className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs focus:border-purple-600 focus:ring-purple-600"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-slate-900 font-bold text-xs">
                                                หมวดหมู่สินค้า / งานบริการ
                                            </label>
                                            <input
                                                type="text"
                                                value={newVendorForm.category}
                                                onChange={(e) => setNewVendorForm({ ...newVendorForm, category: e.target.value })}
                                                placeholder="เช่น เครื่องเขียน, วัสดุฝึกงานช่าง, ไอที"
                                                className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs focus:border-purple-600 focus:ring-purple-600"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-x-3 pt-4 border-t border-purple-100">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddVendorOpen(false)}
                                            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSavingVendor}
                                            className="rounded-xl px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:to-indigo-700 shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                                        >
                                            {isSavingVendor ? '⏳ กำลังบันทึก...' : '💾 บันทึกข้อมูลร้านค้า'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Add / Edit Standard Material Item Modal */}
                    {isAddCatalogItemOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
                            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-purple-200 space-y-4">
                                <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                                    <div>
                                        <h3 className="text-lg font-black text-purple-950 flex items-center gap-2">
                                            <span>📦</span> {editingCatalogItem ? 'แก้ไขข้อมูลรายการพัสดุ' : 'เพิ่มรายการพัสดุ / ราคากลางใหม่'}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            บันทึกเข้าฐานข้อมูลกลางสำหรับระบบค้นหาอัตโนมัติ (Live Search)
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddCatalogItemOpen(false)}
                                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <form onSubmit={handleSaveCatalogItem} className="space-y-4 text-xs font-semibold text-slate-700">
                                    <div className="space-y-1">
                                        <label className="block text-slate-900 font-bold text-xs">
                                            ชื่อรายการพัสดุ / วัสดุ / ครุภัณฑ์ <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={catalogFormData.name}
                                            onChange={(e) => setCatalogFormData({ ...catalogFormData, name: e.target.value })}
                                            placeholder="เช่น กระดาษถ่ายเอกสาร A4 80 แกรม ดับเบิ้ลเอ"
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2.5 text-xs focus:border-purple-600 focus:ring-purple-600"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="block text-slate-900 font-bold text-xs">
                                                หน่วยนับ <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={catalogFormData.unit}
                                                onChange={(e) => setCatalogFormData({ ...catalogFormData, unit: e.target.value })}
                                                placeholder="เช่น รีม, กล่อง, ชุด, ด้าม, ขวด, เล่ม"
                                                className="w-full rounded-xl border-purple-200 px-3.5 py-2.5 text-xs focus:border-purple-600 focus:ring-purple-600"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-slate-900 font-bold text-xs">
                                                ราคากลางต่อหน่วย (บาท) <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                value={catalogFormData.standard_price}
                                                onChange={(e) => setCatalogFormData({ ...catalogFormData, standard_price: e.target.value })}
                                                placeholder="เช่น 145.00"
                                                className="w-full font-mono rounded-xl border-purple-200 px-3.5 py-2.5 text-xs font-bold text-purple-900 focus:border-purple-600 focus:ring-purple-600"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-slate-900 font-bold text-xs">
                                            หมวดหมู่พัสดุ
                                        </label>
                                        <select
                                            value={catalogFormData.category}
                                            onChange={(e) => setCatalogFormData({ ...catalogFormData, category: e.target.value })}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2.5 text-xs focus:border-purple-600 focus:ring-purple-600"
                                        >
                                            <option value="วัสดุสำนักงาน">วัสดุสำนักงาน</option>
                                            <option value="วัสดุคอมพิวเตอร์">วัสดุคอมพิวเตอร์</option>
                                            <option value="วัสดุการศึกษา">วัสดุการศึกษา</option>
                                            <option value="วัสดุฝึก">วัสดุฝึก</option>
                                            <option value="วัสดุงานบ้านงานครัว">วัสดุงานบ้านงานครัว</option>
                                            <option value="วัสดุทั่วไป">วัสดุทั่วไป</option>
                                        </select>
                                    </div>

                                    <div className="flex justify-end gap-x-3 pt-4 border-t border-purple-100">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddCatalogItemOpen(false)}
                                            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            type="submit"
                                            className="rounded-xl px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:to-indigo-700 shadow-md transition-all flex items-center gap-2 cursor-pointer"
                                        >
                                            <span>💾</span> {editingCatalogItem ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
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
