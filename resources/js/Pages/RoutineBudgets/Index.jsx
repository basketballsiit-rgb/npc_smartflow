import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function Index({ auth, routinePlans, departments, fundingSources = [], currentFiscalYear, allUsers, initialTab = 'dashboard' }) {
    const isPlanHead = auth.user.role?.name === 'admin' || auth.user.role?.name === 'plan_head' || auth.user.is_plan_head;
    
    // Check url search params as well
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const tabFromUrl = urlParams ? urlParams.get('tab') : null;

    const [activeTab, setActiveTab] = useState(tabFromUrl || initialTab || 'dashboard');
    const [editingPlan, setEditingPlan] = useState(null);
    const [selectedPlanForProcurement, setSelectedPlanForProcurement] = useState(null);
    const [viewingHistoryPlan, setViewingHistoryPlan] = useState(null);

    // Standard report categories matching the Action Plan Expenditure Report
    const REPORT_CATEGORIES = [
        {
            group: 'หมวด 1: งบบุคลากร',
            items: [
                { code: '1.1', name: '1.1 ครูอัตราจ้าง 6 อัตรา' },
                { code: '1.2', name: '1.2 ค่าสมทบประกันสังคมของครูอัตราจ้าง 9 อัตรา' },
                { code: '1.3', name: '1.3 เจ้าหน้าที่ 15 อัตรา' },
                { code: '1.4', name: '1.4 ค่าสมทบประกันสังคมของเจ้าหน้าที่ 16 อัตรา' },
            ]
        },
        {
            group: 'หมวด 2: งบดำเนินงาน',
            items: [
                { code: '2.1.1', name: '2.1.1 จ้างเหมาบริการเจ้าหน้าที่' },
                { code: '2.1.2', name: '2.1.2 ค่าตอบแทนสอนเกินภาระงานครู' },
                { code: '2.1.3', name: '2.1.3 ค่าตอบแทนครูสอนระยะสั้นรายชั่วโมง 7 ราย' },
                { code: '2.1.4', name: '2.1.4 ค่าตอบแทนครูสอนระยะสั้นนอกเวลาราชการ' },
                { code: '2.2.1', name: '2.2.1 ค่าเดินทางไปราชการ' },
                { code: '2.2.2', name: '2.2.2 ค่าซ่อมแซมพาหนะและค่าขนส่ง' },
                { code: '2.2.3', name: '2.2.3 ค่าซ่อมแซมครุภัณฑ์' },
                { code: '2.2.4', name: '2.2.4 ค่าขยะและสิ่งปฏิกูล' },
                { code: '2.2.5', name: '2.2.5 ค่าโฆษณาและเผยแพร่' },
            ]
        },
        {
            group: 'หมวด 3: ค่าวัสดุ',
            items: [
                { code: '3.1', name: '3.1 วัสดุงานอาคาร' },
                { code: '3.2.1', name: '3.2.1 วัสดุสำนักงาน - ฝ่ายวิชาการ' },
                { code: '3.2.2', name: '3.2.2 วัสดุสำนักงาน - ฝ่ายพัฒนากิจการนักเรียนนักศึกษา' },
                { code: '3.2.3', name: '3.2.3 วัสดุสำนักงาน - ฝ่ายบริหารทรัพยากร' },
                { code: '3.2.4', name: '3.2.4 วัสดุสำนักงาน - ฝ่ายแผนงานและความร่วมมือ' },
                { code: '3.3', name: '3.3 วัสดุเชื้อเพลิงและหล่อลื่น' },
            ]
        },
        {
            group: 'หมวด 4: ค่าวัสดุการศึกษา',
            items: [
                { code: '4.1', name: '4.1 หลักสูตรวิชาชีพระยะสั้น' },
                { code: '4.2', name: '4.2 สาขาวิชาช่างยนต์' },
                { code: '4.3', name: '4.3 สาขาวิชาไฟฟ้ากำลัง' },
                { code: '4.4', name: '4.4 สาขาวิชาเทคนิคพื้นฐาน' },
                { code: '4.5', name: '4.5 สาขาวิชาอิเล็กทรอนิกส์' },
                { code: '4.6', name: '4.6 สาขาวิชาการบัญชี' },
                { code: '4.7', name: '4.7 สาขาวิชาการตลาด' },
                { code: '4.8', name: '4.8 สาขาวิชาเทคโนโลยีสารสนเทศฯ' },
                { code: '4.9', name: '4.9 แผนกสามัญสัมพันธ์' },
            ]
        },
        {
            group: 'หมวด 5: ค่าสาธารณูปโภค',
            items: [
                { code: '5.1', name: '5.1 ค่าไฟฟ้า' },
                { code: '5.2', name: '5.2 ค่าน้ำประปา' },
                { code: '5.3', name: '5.3 ค่าโทรศัพท์' },
                { code: '5.4', name: '5.4 ค่าไปรษณีย์โทรเลข' },
                { code: '5.5', name: '5.5 ค่าบริการด้านสื่อสารโทรคมนาคม' },
            ]
        },
        {
            group: 'หมวด 7: สำรองจ่าย',
            items: [
                { code: '7.1', name: '7.1 สำรองจ่าย' },
            ]
        }
    ];

    // Form for Creating / Editing Budget Plan
    const { data: planData, setData: setPlanData, post: postPlan, put: putPlan, reset: resetPlan, errors: planErrors } = useForm({
        fiscal_year: currentFiscalYear || '',
        department_id: departments[0]?.id || '',
        title: '',
        allocated_amount: '',
        funding_source_id: fundingSources[0]?.id || '',
        report_category: '',
    });

    // Form for Direct Procurement request
    const [procurementItems, setProcurementItems] = useState([
        { description: '', quantity: 1, unit: 'ชิ้น', unit_price: 0 }
    ]);
    const { data: procData, setData: setProcData, post: postProc, reset: resetProc, errors: procErrors } = useForm({
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

    // Calculations
    const totalAllocated = routinePlans.reduce((sum, p) => sum + parseFloat(p.allocated_amount), 0);
    const totalSpent = routinePlans.reduce((sum, p) => sum + parseFloat(p.spent_amount), 0);
    const totalRemaining = totalAllocated - totalSpent;
    const totalPercent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    // Handle Budget Plan Submit
    const handlePlanSubmit = (e) => {
        e.preventDefault();
        if (editingPlan) {
            putPlan(route('admin.routine_budgets.update', editingPlan.id), {
                onSuccess: () => {
                    Swal.fire('สำเร็จ!', 'แก้ไขข้อมูลแผนงบประมาณเรียบร้อยแล้ว', 'success');
                    setEditingPlan(null);
                    resetPlan();
                }
            });
        } else {
            postPlan(route('admin.routine_budgets.store'), {
                onSuccess: () => {
                    Swal.fire('สำเร็จ!', 'เพิ่มแผนงบประมาณประจำปีเรียบร้อยแล้ว', 'success');
                    resetPlan();
                }
            });
        }
    };

    // Handle Delete Budget Plan
    const handlePlanDelete = (id) => {
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

    // Handle Items logic for Procurement Request
    const addProcurementItem = () => {
        setProcurementItems([...procurementItems, { description: '', quantity: 1, unit: 'ชิ้น', unit_price: 0 }]);
    };

    const removeProcurementItem = (index) => {
        if (procurementItems.length === 1) return;
        setProcurementItems(procurementItems.filter((_, i) => i !== index));
    };

    const updateProcurementItem = (index, field, value) => {
        const updated = [...procurementItems];
        updated[index][field] = value;
        setProcurementItems(updated);
    };

    const calculateProcurementTotal = () => {
        return procurementItems.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)), 0);
    };

    // Open Procurement Modal
    const openProcurementModal = (plan) => {
        setSelectedPlanForProcurement(plan);
        setProcurementItems([{ description: '', quantity: 1, unit: 'ชิ้น', unit_price: 0 }]);
        setProcData({
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

    // Open Edit Procurement Modal
    const openEditProcurementModal = (plan, proc) => {
        setSelectedPlanForProcurement(plan);
        setProcurementItems(proc.items.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            unit: item.unit,
            unit_price: parseFloat(item.unit_price)
        })));

        // Extract committees by type/role
        const pChair = proc.committees?.find(c => c.pivot.committee_type === 'purchasing' && c.pivot.role === 'chairperson')?.id || '';
        const pMembers = proc.committees?.filter(c => c.pivot.committee_type === 'purchasing' && c.pivot.role === 'member') || [];
        const iChair = proc.committees?.find(c => c.pivot.committee_type === 'inspection' && c.pivot.role === 'chairperson')?.id || '';
        const iMembers = proc.committees?.filter(c => c.pivot.committee_type === 'inspection' && c.pivot.role === 'member') || [];

        setProcData({
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

    // Submit Procurement Request
    const handleProcurementSubmit = (e) => {
        e.preventDefault();
        
        // Form validations
        const totalSum = calculateProcurementTotal();
        const remainingBudget = parseFloat(selectedPlanForProcurement.allocated_amount) - parseFloat(selectedPlanForProcurement.spent_amount);
        
        let oldTotal = 0;
        if (procData.procurement_id) {
            const proc = selectedPlanForProcurement.procurements.find(p => p.id === procData.procurement_id);
            if (proc) {
                oldTotal = proc.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0);
            }
        }

        if (totalSum > (remainingBudget + oldTotal)) {
            Swal.fire('ข้อผิดพลาด!', `ยอดรวมใบจัดซื้อ (${totalSum.toLocaleString()} บาท) เกินวงเงินงบประมาณคงเหลือ (${(remainingBudget + oldTotal).toLocaleString()} บาท)`, 'error');
            return;
        }

        // Prepare request
        const finalData = {
            ...procData,
            items: procurementItems
        };

        router.post(route('routine_procurements.save', selectedPlanForProcurement.id), finalData, {
            onSuccess: () => {
                Swal.fire('สำเร็จ!', 'บันทึกข้อมูลจัดซื้อจัดจ้าง และเบิกตัดแผนงบประมาณเรียบร้อยแล้ว', 'success');
                setSelectedPlanForProcurement(null);
                resetProc();
            },
            onError: (err) => {
                Swal.fire('ข้อผิดพลาด!', Object.values(err).join('\n'), 'error');
            }
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-white leading-tight">📅 แผนงบดำเนินงานประจำปี & จัดซื้อจัดจ้างตรง</h2>}
        >
            <Head title="แผนงบดำเนินงานประจำปี" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                
                {/* 1. Header Card with visual summary */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-800 to-indigo-900 text-white shadow-xl p-6 md:p-8">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute left-0 bottom-0 -translate-x-12 translate-y-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                ปีงบประมาณ {currentFiscalYear}
                            </span>
                            <h1 className="text-2xl md:text-3xl font-extrabold mt-2">แผนงบดำเนินงานประจำส่วนงาน</h1>
                            <p className="text-purple-200 text-xs md:text-sm mt-1">
                                จัดสรรแผนงบประมาณรายจ่ายประจำปี และสร้างบันทึกข้อความจัดซื้อจัดจ้างตรงโดยไม่ต้องมีโครงการ
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 bg-black/20 p-1 rounded-xl backdrop-blur-md">
                            {isPlanHead && (
                                <button
                                    onClick={() => setActiveTab('create_plan')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'create_plan' ? 'bg-white text-purple-900 shadow-xs' : 'text-purple-100 hover:bg-white/10'}`}
                                >
                                    📝 {editingPlan ? 'แก้ไขแผนงบ' : 'ลงแผนงบประจำปี'}
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-purple-900 shadow-xs' : 'text-purple-100 hover:bg-white/10'}`}
                            >
                                📊 แดชบอร์ด
                            </button>
                            <button
                                onClick={() => setActiveTab('plans')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'plans' ? 'bg-white text-purple-900 shadow-xs' : 'text-purple-100 hover:bg-white/10'}`}
                            >
                                📋 ตารางการจัดสรรงบ ({routinePlans.length})
                            </button>
                        </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-8 border-t border-white/10 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-white/5 p-4 rounded-2xl">
                            <span className="text-purple-200 text-xs block">งบจัดสรรทั้งหมด (Planned)</span>
                            <span className="text-xl md:text-2xl font-black text-amber-400 mt-1 block">
                                {totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-white">บาท</span>
                            </span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl">
                            <span className="text-purple-200 text-xs block">เบิกจ่ายสะสม (Actual Spent)</span>
                            <span className="text-xl md:text-2xl font-black text-red-400 mt-1 block">
                                {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-white">บาท</span>
                            </span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl">
                            <span className="text-purple-200 text-xs block">คงเหลือรวมแผนงาน (Remaining)</span>
                            <span className="text-xl md:text-2xl font-black text-emerald-400 mt-1 block">
                                {totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-white">บาท</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Active Tab Content */}
                {activeTab === 'dashboard' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left column: progress bars by department */}
                        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-extrabold text-gray-800 text-base">📊 สถานะการใช้จ่ายงบประจำปีรายหมวด</h3>
                                <span className="text-xs text-gray-400">เรียงตามวันที่สร้าง</span>
                            </div>

                            {routinePlans.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 text-sm">
                                    ยังไม่มีการกำหนดแผนงบดำเนินงานประจำปีในขณะนี้
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {routinePlans.map((plan) => {
                                        const allocated = parseFloat(plan.allocated_amount);
                                        const spent = parseFloat(plan.spent_amount);
                                        const remaining = allocated - spent;
                                        const percent = allocated > 0 ? (spent / allocated) * 100 : 0;
                                        return (
                                            <div key={plan.id} className="p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-50 border border-gray-100 transition-all space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-gray-800 text-sm">{plan.title}</h4>
                                                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full mt-1 inline-block">
                                                            🏫 {plan.department?.name}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-bold text-gray-800 block">
                                                            {spent.toLocaleString()} / {allocated.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">บาท</span>
                                                        </span>
                                                        <span className={`text-[10px] font-bold ${percent > 85 ? 'text-red-500' : percent > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                            เบิกจ่ายแล้ว {percent.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress bar container */}
                                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${percent > 85 ? 'bg-red-500' : percent > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                        style={{ width: `${Math.min(percent, 100)}%` }}
                                                    />
                                                </div>

                                                <div className="flex justify-between items-center pt-1 text-[11px] text-gray-500">
                                                    <span>เหลือคงเหลือสุทธิ: <strong className="text-emerald-600 font-bold">{remaining.toLocaleString()} บาท</strong></span>
                                                    <button
                                                        onClick={() => openProcurementModal(plan)}
                                                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-2.5 py-1 rounded-lg transition-all"
                                                    >
                                                        ➕ ขอจัดซื้อตรง
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Right column: fast guide & quick actions */}
                        <div className="space-y-6">
                            {/* Quick Instructions Card */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                                <h3 className="font-extrabold text-gray-800 text-base">ℹ️ คำชี้แจงการทำจัดซื้อตรง</h3>
                                <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
                                    <div className="flex gap-2 items-start">
                                        <span className="text-purple-600 font-extrabold">1.</span>
                                        <p>งานยุทธศาสตร์และแผนงานเป็นผู้กำหนดแผนและจัดสรรวงเงินรายจ่ายประจำปีให้แก่แผนกย่อย</p>
                                    </div>
                                    <div className="flex gap-2 items-start">
                                        <span className="text-purple-600 font-extrabold">2.</span>
                                        <p>เมื่อแผนกหรือสาขาวิชาต้องการใช้วงเงินจัดซื้อครุภัณฑ์หรือวัสดุ ให้กด <strong>"ขอจัดซื้อตรง"</strong> ในหมวดที่เกี่ยวข้อง</p>
                                    </div>
                                    <div className="flex gap-2 items-start">
                                        <span className="text-purple-600 font-extrabold">3.</span>
                                        <p>ระบบจะสร้างบันทึกข้อความและตัดยอดเงินในแผนทันที พร้อมออกเอกสารสิทธิ์จัดซื้อจัดจ้างตามระเบียบพัสดุ</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-xl text-[11px] text-purple-900 flex gap-2">
                                    <span>⚠️</span>
                                    <p>การจัดซื้อจัดจ้างตรงผ่านระบบนี้จะ<strong>ได้รับการอนุมัติโดยระบบวางแผนทันที</strong> เพราะสอดคล้องตามแผนปฏิบัติงานหลักล่วงหน้าแล้ว</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. TAB: ลงแผนงบประจำปี (Create / Edit Plan) */}
                {activeTab === 'create_plan' && isPlanHead && (
                    <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6 animate-in fade-in duration-200">
                        <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-extrabold text-gray-800 text-lg">
                                    {editingPlan ? '✏️ แก้ไขแผนงบดำเนินงานประจำปี' : '📝 ลงแผนงบดำเนินงานประจำปีใหม่'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    กำหนดวงเงินงบดำเนินงาน จัดสรรให้แผนก และเลือกหมวดงบที่ตรงกับรายงานงบรายจ่ายแผนปฏิบัติราชการ
                                </p>
                            </div>
                            {editingPlan && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingPlan(null);
                                        resetPlan();
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-xl transition"
                                >
                                    ยกเลิกการแก้ไข
                                </button>
                            )}
                        </div>

                        <form onSubmit={handlePlanSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        ปีงบประมาณ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={planData.fiscal_year}
                                        onChange={e => setPlanData('fiscal_year', e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-3 bg-gray-50"
                                        placeholder="ตัวอย่าง 2569"
                                    />
                                    {planErrors.fiscal_year && <span className="text-red-500 text-[10px]">{planErrors.fiscal_year}</span>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        แผนกงาน / สาขาวิชาที่จัดสรร <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={planData.department_id}
                                        onChange={e => setPlanData('department_id', e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-3"
                                    >
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                    {planErrors.department_id && <span className="text-red-500 text-[10px]">{planErrors.department_id}</span>}
                                </div>
                            </div>

                            {/* Funding Source Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        แหล่งเงิน / แหล่งงบประมาณ (คอลัมน์ในรายงาน) <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={planData.funding_source_id}
                                        onChange={e => setPlanData('funding_source_id', e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-3 font-semibold text-purple-900"
                                    >
                                        <option value="">-- เลือกแหล่งเงิน --</option>
                                        {fundingSources.map(source => (
                                            <option key={source.id} value={source.id}>
                                                {source.name} {source.budget_number ? `(${source.budget_number})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {planErrors.funding_source_id && <span className="text-red-500 text-[10px]">{planErrors.funding_source_id}</span>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        หมวดรายงานงบรายจ่าย (แถวในรายงาน) <span className="text-purple-600 font-bold">✨ เชื่อมตารางรายงาน</span>
                                    </label>
                                    <select
                                        value={planData.report_category}
                                        onChange={e => {
                                            const catCode = e.target.value;
                                            setPlanData(prev => {
                                                let autoTitle = prev.title;
                                                // If title is blank or user is selecting a template, suggest the name
                                                if (catCode) {
                                                    for (const group of REPORT_CATEGORIES) {
                                                        const found = group.items.find(it => it.code === catCode);
                                                        if (found && (!prev.title || prev.title === '')) {
                                                            autoTitle = found.name;
                                                        }
                                                    }
                                                }
                                                return {
                                                    ...prev,
                                                    report_category: catCode,
                                                    title: autoTitle
                                                };
                                            });
                                        }}
                                        className="w-full text-xs rounded-xl border-purple-200 bg-purple-50/40 focus:ring-purple-500 focus:border-purple-500 p-3"
                                    >
                                        <option value="">-- เลือกหมวดในตารางรายงาน หรือระบุเอง --</option>
                                        {REPORT_CATEGORIES.map(group => (
                                            <optgroup key={group.group} label={group.group}>
                                                {group.items.map(item => (
                                                    <option key={item.code} value={item.code}>
                                                        {item.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    <span className="text-[10px] text-gray-400 mt-1 block">เลือกล็อคหมวดเพื่อให้นำตัวเลขไปแสดงในรายงานงบรายจ่ายแผนปฏิบัติราชการโดยอัตโนมัติ</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    ชื่อหมวดงบประมาณประจำปี / รายการจัดสรร <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={planData.title}
                                    onChange={e => setPlanData('title', e.target.value)}
                                    className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-3"
                                    placeholder="เช่น ค่าจัดซื้อวัสดุสำนักงาน, ค่าซ่อมครุภัณฑ์, วัสดุการศึกษาแผนกช่างยนต์"
                                />
                                {planErrors.title && <span className="text-red-500 text-[10px]">{planErrors.title}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    จำนวนงบประมาณจัดสรร (บาท) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="any"
                                        value={planData.allocated_amount}
                                        onChange={e => setPlanData('allocated_amount', e.target.value)}
                                        className="w-full text-sm font-bold rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-3 pr-12 text-gray-800"
                                        placeholder="0.00"
                                    />
                                    <span className="absolute right-4 top-3.5 text-xs text-gray-400 font-bold">บาท</span>
                                </div>
                                {planErrors.allocated_amount && <span className="text-red-500 text-[10px]">{planErrors.allocated_amount}</span>}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm py-3.5 px-6 rounded-xl transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-2"
                                >
                                    <span>{editingPlan ? '💾 บันทึกการแก้ไขแผนงบ' : '➕ บันทึกแผนงบประมาณ'}</span>
                                </button>
                                {editingPlan && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingPlan(null);
                                            resetPlan();
                                            setActiveTab('plans');
                                        }}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-3.5 px-6 rounded-xl transition-all"
                                    >
                                        ยกเลิก
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {/* 3. TAB: ตารางแสดงการจัดสรรงบประจำปี (Table View) */}
                {activeTab === 'plans' && (
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6 animate-in fade-in duration-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="font-extrabold text-gray-800 text-lg">📋 ตารางแสดงการจัดสรรงบดำเนินงานประจำปี</h3>
                                <p className="text-xs text-gray-400 mt-0.5">รายการวงเงินงบดำเนินงานของแต่ละสาขาวิชา/แผนก พร้อมสถานะเบิกตัดจัดซื้อตรง</p>
                            </div>
                            {isPlanHead && (
                                <button
                                    onClick={() => {
                                        setEditingPlan(null);
                                        resetPlan();
                                        setActiveTab('create_plan');
                                    }}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow-xs flex items-center gap-1.5"
                                >
                                    <span>➕</span>
                                    <span>ลงแผนงบใหม่</span>
                                </button>
                            )}
                        </div>
                        
                        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[11px] font-bold">
                                        <th className="py-3.5 px-4">หมวดงบ / รายการ</th>
                                        <th className="py-3.5 px-3">แผนกงาน / สาขาวิชา</th>
                                        <th className="py-3.5 px-3">แหล่งเงิน (คอลัมน์)</th>
                                        <th className="py-3.5 px-3 text-right">งบจัดสรร</th>
                                        <th className="py-3.5 px-3 text-right">เบิกจ่ายสะสม</th>
                                        <th className="py-3.5 px-3 text-right">คงเหลือ</th>
                                        <th className="py-3.5 px-4 text-center">การจัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs">
                                    {routinePlans.map((plan) => {
                                        const allocated = parseFloat(plan.allocated_amount);
                                        const spent = parseFloat(plan.spent_amount);
                                        const remaining = allocated - spent;
                                        return (
                                            <tr key={plan.id} className="hover:bg-purple-50/20 transition">
                                                <td className="py-4 px-4">
                                                    <span className="font-bold text-gray-900 block text-xs">{plan.title}</span>
                                                    {plan.report_category && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded mt-1">
                                                            <span>หมวดรายงาน:</span> {plan.report_category}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-3 text-gray-600">
                                                    🏫 {plan.department?.name || '-'}
                                                </td>
                                                <td className="py-4 px-3">
                                                    <span className="text-[11px] font-medium text-purple-900 bg-purple-100/70 px-2 py-0.5 rounded-full">
                                                        {plan.funding_source?.name || 'ไม่ระบุ'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-3 text-right font-bold text-gray-900">
                                                    {allocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-4 px-3 text-right text-red-500 font-semibold">
                                                    {spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-4 px-3 text-right text-emerald-600 font-bold">
                                                    {remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1 flex-wrap">
                                                        <button
                                                            onClick={() => openProcurementModal(plan)}
                                                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-2.5 py-1.5 rounded-lg transition-all text-xs flex items-center gap-1"
                                                            title="ขอจัดซื้อตรง"
                                                        >
                                                            🛒 เบิกจัดซื้อ
                                                        </button>
                                                        
                                                        {plan.procurements?.length > 0 && (
                                                            <button
                                                                onClick={() => setViewingHistoryPlan(plan)}
                                                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1.5 rounded-lg transition-all text-xs"
                                                                title="ดูประวัติการเบิก"
                                                            >
                                                                📋 ({plan.procurements.length})
                                                            </button>
                                                        )}

                                                        {isPlanHead && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingPlan(plan);
                                                                        setPlanData({
                                                                            fiscal_year: plan.fiscal_year,
                                                                            department_id: plan.department_id,
                                                                            title: plan.title,
                                                                            allocated_amount: plan.allocated_amount,
                                                                            funding_source_id: plan.funding_source_id || '',
                                                                            report_category: plan.report_category || '',
                                                                        });
                                                                        setActiveTab('create_plan');
                                                                    }}
                                                                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold px-2 py-1.5 rounded-lg transition-all text-xs"
                                                                    title="แก้ไขแผนงบนี้"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    onClick={() => handlePlanDelete(plan.id)}
                                                                    className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2 py-1.5 rounded-lg transition-all text-xs"
                                                                    title="ลบแผนงบนี้"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {routinePlans.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="text-center py-10 text-gray-400">
                                                ยังไม่มีงบดำเนินงานใดถูกตั้งไว้ในแผนงานประจำปี
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. Modal for viewing Procurement History */}
                {viewingHistoryPlan && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex justify-center items-center p-4">
                        <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl">
                            <div className="flex justify-between items-center border-b pb-4">
                                <div>
                                    <h3 className="font-extrabold text-gray-800 text-lg">📋 ประวัติขอจัดซื้อจัดจ้างย่อย</h3>
                                    <p className="text-xs text-gray-400">หมวดงบ: {viewingHistoryPlan.title} ({viewingHistoryPlan.department?.name})</p>
                                </div>
                                <button
                                    onClick={() => setViewingHistoryPlan(null)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-black p-2 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                {viewingHistoryPlan.procurements?.map((proc) => {
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
                                                        setViewingHistoryPlan(null);
                                                        openEditProcurementModal(viewingHistoryPlan, proc);
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

                {/* 4. Modal for creating Direct Procurement Request */}
                {selectedPlanForProcurement && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex justify-center items-center p-4">
                        <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
                            
                            <div className="flex justify-between items-center border-b pb-4">
                                <div>
                                    <h3 className="font-extrabold text-gray-800 text-lg">🛍️ สร้างบันทึกจัดซื้อจัดจ้าง (งบแผนประจำปี)</h3>
                                    <p className="text-xs text-gray-400">
                                        หมวดเงิน: {selectedPlanForProcurement.title} | วงเงินคงเหลือคงคลัง: <strong>{(parseFloat(selectedPlanForProcurement.allocated_amount) - parseFloat(selectedPlanForProcurement.spent_amount)).toLocaleString()} บาท</strong>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedPlanForProcurement(null)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-black p-2 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleProcurementSubmit} className="space-y-6">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">หัวข้อบันทึกข้อความขอซื้อ/จ้าง</label>
                                        <input
                                            type="text"
                                            value={procData.memo_subject}
                                            onChange={e => setProcData('memo_subject', e.target.value)}
                                            className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-3"
                                            placeholder="เช่น ขออนุมัติจัดซื้อวัสดุคอมพิวเตอร์และอุปกรณ์เสริมสำหรับสำนักงาน"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">ขอบเขตงานหรือรายละเอียด TOR</label>
                                        <textarea
                                            value={procData.tor_specifications}
                                            onChange={e => setProcData('tor_specifications', e.target.value)}
                                            className="w-full text-xs rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 p-3"
                                            rows="3"
                                            placeholder="คำอธิบายขอบเขตความต้องการ เช่น รายละเอียดคุณสมบัติสินค้าหรือผู้รับจ้าง..."
                                        />
                                    </div>
                                </div>

                                {/* Items Section */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-gray-800 text-xs">📦 รายการวัสดุ / สิ่งของที่จัดซื้อจัดจ้าง</h4>
                                        <button
                                            type="button"
                                            onClick={addProcurementItem}
                                            className="text-purple-600 hover:text-purple-800 text-xs font-bold"
                                        >
                                            ➕ เพิ่มรายการสินค้า
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {procurementItems.map((item, idx) => (
                                            <div key={idx} className="flex flex-col sm:flex-row gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100 items-end">
                                                <div className="flex-1 w-full">
                                                    <label className="block text-[10px] text-gray-500 mb-1">รายการ/รายละเอียดพัสดุ</label>
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={e => updateProcurementItem(idx, 'description', e.target.value)}
                                                        className="w-full text-xs rounded-lg border-gray-200 p-2"
                                                        placeholder="เช่น กระดาษดับเบิ้ลเอ A4"
                                                        required
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="block text-[10px] text-gray-500 mb-1">จำนวน</label>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={e => updateProcurementItem(idx, 'quantity', e.target.value)}
                                                        className="w-full text-xs rounded-lg border-gray-200 p-2"
                                                        min="0.01"
                                                        step="0.01"
                                                        required
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="block text-[10px] text-gray-500 mb-1">หน่วยนับ</label>
                                                    <input
                                                        type="text"
                                                        value={item.unit}
                                                        onChange={e => updateProcurementItem(idx, 'unit', e.target.value)}
                                                        className="w-full text-xs rounded-lg border-gray-200 p-2"
                                                        placeholder="รีม/ชุด/เครื่อง"
                                                        required
                                                    />
                                                </div>
                                                <div className="w-28">
                                                    <label className="block text-[10px] text-gray-500 mb-1">ราคาต่อหน่วย (บาท)</label>
                                                    <input
                                                        type="number"
                                                        value={item.unit_price}
                                                        onChange={e => updateProcurementItem(idx, 'unit_price', e.target.value)}
                                                        className="w-full text-xs rounded-lg border-gray-200 p-2"
                                                        min="0"
                                                        step="0.01"
                                                        required
                                                    />
                                                </div>
                                                <div className="w-24 text-right py-2 text-xs font-bold text-gray-800">
                                                    {(item.quantity * item.unit_price).toLocaleString()} บ.
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeProcurementItem(idx)}
                                                    className="bg-red-50 hover:bg-red-100 text-red-700 p-2 rounded-xl"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="text-right font-extrabold text-sm text-purple-900 bg-purple-50 p-4 rounded-2xl">
                                        รวมยอดรวมจัดซื้อจัดจ้างทั้งสิ้น: {calculateProcurementTotal().toLocaleString()} บาท
                                    </div>
                                </div>

                                {/* Committee Section */}
                                <div className="space-y-4 border-t pt-4">
                                    <h4 className="font-bold text-gray-800 text-xs">👥 แต่งตั้งคณะกรรมการพัสดุ</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Purchasing Committee */}
                                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 space-y-3">
                                            <h5 className="font-bold text-xs text-purple-900">👥 คณะกรรมการกำหนดราคากลาง/ซื้อจ้าง</h5>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 mb-1">ประธานกรรมการ</label>
                                                <select
                                                    value={procData.purchasing_chair}
                                                    onChange={e => setProcData('purchasing_chair', e.target.value)}
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
                                                    value={procData.purchasing_member1}
                                                    onChange={e => setProcData('purchasing_member1', e.target.value)}
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
                                                    value={procData.purchasing_member2}
                                                    onChange={e => setProcData('purchasing_member2', e.target.value)}
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
                                                    value={procData.inspection_chair}
                                                    onChange={e => setProcData('inspection_chair', e.target.value)}
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
                                                    value={procData.inspection_member1}
                                                    onChange={e => setProcData('inspection_member1', e.target.value)}
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
                                                    value={procData.inspection_member2}
                                                    onChange={e => setProcData('inspection_member2', e.target.value)}
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
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all"
                                    >
                                        💾 บันทึกจัดซื้อและตัดงบประมาณ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPlanForProcurement(null)}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-3 px-6 rounded-xl transition-all"
                                    >
                                        ยกเลิก
                                    </button>
                                </div>
                            </form>

                        </div>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
