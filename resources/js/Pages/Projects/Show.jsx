import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import ProjectWorkflowStepper from '@/Components/ProjectWorkflowStepper';

export default function Show({ project, strategyCategories = [], fundingSources = [], allUsers = [], canApprove }) {
    const { auth } = usePage().props;
    const { data, setData, post, processing } = useForm({
        comments: '',
        funding_source_id: project.budget?.funding_source_id || (fundingSources[0]?.id || 1),
        allocated_amount: project.budget?.allocated_amount || project.estimated_budget || 0,
        is_advance_payment: project.budget?.is_advance_payment || false,
    });

    const [activeTab, setActiveTab] = useState('plan');
    const [appendixTitle, setAppendixTitle] = useState('');
    const [appendixFile, setAppendixFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Procurement Items & Committee Form State
    const [procurementItems, setProcurementItems] = useState(
        project.procurement?.items?.length > 0 
            ? project.procurement.items 
            : [{ description: `จัดซื้อวัสดุอุปกรณ์สำหรับดำเนินงานโครงการ ${project.title}`, quantity: 1, unit: 'งาน', unit_price: project.budget?.allocated_amount || project.estimated_budget }]
    );

    const [purchasingChair, setPurchasingChair] = useState(
        project.procurement?.committees?.find(c => c.pivot?.committee_type === 'purchasing' && c.pivot?.role === 'chairperson')?.id || (allUsers?.[0]?.id || '')
    );
    const [purchasingMember1, setPurchasingMember1] = useState(
        project.procurement?.committees?.filter(c => c.pivot?.committee_type === 'purchasing' && c.pivot?.role === 'member')?.[0]?.id || (allUsers?.[1]?.id || '')
    );
    const [purchasingMember2, setPurchasingMember2] = useState(
        project.procurement?.committees?.filter(c => c.pivot?.committee_type === 'purchasing' && c.pivot?.role === 'member')?.[1]?.id || (allUsers?.[2]?.id || '')
    );

    const [inspectionChair, setInspectionChair] = useState(
        project.procurement?.committees?.find(c => c.pivot?.committee_type === 'inspection' && c.pivot?.role === 'chairperson')?.id || (allUsers?.[1]?.id || '')
    );
    const [inspectionMember1, setInspectionMember1] = useState(
        project.procurement?.committees?.filter(c => c.pivot?.committee_type === 'inspection' && c.pivot?.role === 'member')?.[0]?.id || (allUsers?.[3]?.id || '')
    );
    const [inspectionMember2, setInspectionMember2] = useState(
        project.procurement?.committees?.filter(c => c.pivot?.committee_type === 'inspection' && c.pivot?.role === 'member')?.[1]?.id || (allUsers?.[4]?.id || '')
    );

    const defaultTorText = `1. วัตถุประสงค์\nวิทยาลัยสารพัดช่างน่าน แผนกวิชา ${project.department?.name || ''} มีความประสงค์จัดหาวัสดุอุปกรณ์พัสดุ เพื่อนำไปใช้สนับสนุนการจัดกิจกรรมและกระบวนการเรียนการสอนของโครงการ "${project.title}"\n\n2. คุณลักษณะเฉพาะและขอบเขตงาน\nพัสดุและรายการวัสดุที่จัดหาต้องมีคุณลักษณะที่เหมาะสมกับการใช้งานการเรียนการสอน ตามเกณฑ์มาตรฐานสายอาชีวศึกษา โดยประกอบด้วยรายการพัสดุระบุตามบัญชีเอกสารแนบเสนอซื้อเสนอจ้าง\n\n3. ระยะเวลาการส่งมอบและเงื่อนไขการส่งมอบ\nผู้จำหน่ายหรือผู้รับจ้างจะต้องส่งมอบพัสดุทั้งหมด ณ วิทยาลัยสารพัดช่างน่าน ภายในกำหนดเวลา 7 วัน นับถัดจากวันที่ได้รับใบสั่งซื้อสั่งจ้างจากทางวิทยาลัย\n\n4. การตรวจรับพัสดุ\nการตรวจรับจะดำเนินการโดยคณะกรรมการตรวจรับพัสดุที่วิทยาลัยแต่งตั้งขึ้น โดยต้องตรวจรับพัสดุให้ถูกต้องตรงตามเอกสารประมาณการและใบเสนอซื้อเสนอจ้างทุกประการ`;

    const [torSpecifications, setTorSpecifications] = useState(
        project.procurement?.tor_specifications || defaultTorText
    );

    const allocatedBudget = parseFloat(project.budget?.allocated_amount || project.estimated_budget || 0);
    const totalProcurementSum = procurementItems.reduce((acc, item) => acc + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)), 0);
    const isOverBudget = totalProcurementSum > (allocatedBudget + 0.01);
    const budgetDifference = Math.abs(allocatedBudget - totalProcurementSum);

    const handleSaveProcurement = (e) => {
        e.preventDefault();

        if (isOverBudget) {
            Swal.fire({
                title: '⚠️ ยอดรวมพัสดุเกินวงเงินอนุมัติ!',
                html: `ยอดรวมจัดซื้อจัดจ้าง <b>${formatCurrency(totalProcurementSum)}</b> เกินวงเงินงบประมาณที่ได้รับอนุมัติ <b>${formatCurrency(allocatedBudget)}</b> อยู่ <b style="color: #e11d48;">${formatCurrency(budgetDifference)}</b><br><br>กรุณาปรับลดราคาหรือจำนวนรายการวัสดุก่อนทำการบันทึกข้อมูล`,
                icon: 'error',
                confirmButtonText: 'ตกลง (ไปแก้ไข)',
                confirmButtonColor: '#e11d48'
            });
            return;
        }

        router.post(route('procurements.save', project.id), {
            purchasing_chair: purchasingChair,
            purchasing_member1: purchasingMember1,
            purchasing_member2: purchasingMember2,
            inspection_chair: inspectionChair,
            inspection_member1: inspectionMember1,
            inspection_member2: inspectionMember2,
            items: procurementItems,
            tor_specifications: torSpecifications,
        }, {
            onSuccess: () => {
                Swal.fire('บันทึกสำเร็จ!', 'บันทึกข้อมูลข้อกำหนด TOR และคำสั่งพัสดุเรียบร้อยแล้ว', 'success');
            }
        });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value || 0);
    };

    const handleApprove = (e) => {
        e.preventDefault();
        Swal.fire({
            title: 'ยืนยันการอนุมัติโครงการ?',
            text: `คุณต้องการอนุมัติโครงการในขั้นตอนที่ ${project.current_approval_step} หรือไม่?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            cancelButtonText: 'ยกเลิก',
            confirmButtonText: '✅ ยืนยันอนุมัติ',
        }).then((result) => {
            if (result.isConfirmed) {
                post(route('projects.approve', project.id), {
                    onSuccess: () => {
                        Swal.fire('อนุมัติเรียบร้อย!', 'โครงการได้รับการอนุมัติเรียบร้อยแล้ว', 'success');
                    }
                });
            }
        });
    };

    const handleReject = (e) => {
        e.preventDefault();
        if (!data.comments.trim()) {
            Swal.fire('ข้อผิดพลาด', 'กรุณาระบุข้อคิดเห็นหรือเหตุผลในการตีกลับแก้ไข', 'warning');
            return;
        }

        Swal.fire({
            title: 'ยืนยันการตีกลับแก้ไข?',
            text: 'โครงการจะถูกส่งกลับไปยังผู้เสนอเพื่อแก้ไขรายละเอียด',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonText: 'ยกเลิก',
            confirmButtonText: '❌ ยืนยันตีกลับ',
        }).then((result) => {
            if (result.isConfirmed) {
                post(route('projects.reject', project.id), {
                    onSuccess: () => {
                        Swal.fire('ตีกลับเรียบร้อย!', 'ส่งโครงการกลับไปแก้ไขเรียบร้อยแล้ว', 'info');
                    }
                });
            }
        });
    };

    const handleWorkflowSubmit = () => {
        Swal.fire({
            title: '🚀 ยื่นขออนุมัติเพื่อดำเนินงานโครงการต่อ?',
            text: 'ส่งเรื่องยื่นเสนอขออนุมัติโครงการนี้ให้คณะกรรมการและผู้บริหารอนุมัติเพื่อขอดำเนินงานและใช้งบประมาณต่อไป',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: '🚀 ยืนยันยื่นเสนอขออนุมัติ',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('projects.submit', project.id), {}, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'ยื่นเสนอขออนุมัติสำเร็จ!',
                            text: 'โครงการถูกส่งต่อเข้าสู่กระบวนการพิจารณาอนุมัติ 6 ขั้นตอนเพื่อดำเนินงานเรียบร้อยแล้ว',
                            icon: 'success',
                            confirmButtonColor: '#7c3aed',
                        });
                    }
                });
            }
        });
    };

    const handleUploadAppendix = (e) => {
        e.preventDefault();
        if (!appendixTitle || !appendixFile) {
            Swal.fire('ข้อผิดพลาด', 'กรุณาระบุชื่อเอกสารและเลือกไฟล์ PDF', 'warning');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('title', appendixTitle);
        formData.append('file', appendixFile);

        router.post(route('appendices.store', project.id), formData, {
            onFinish: () => setUploading(false),
            onSuccess: () => {
                setAppendixTitle('');
                setAppendixFile(null);
                Swal.fire('อัปโหลดสำเร็จ!', 'เพิ่มเอกสารแนบเรียบร้อยแล้ว', 'success');
            }
        });
    };

    const handleDeleteAppendix = (id) => {
        Swal.fire({
            title: 'ลบเอกสารแนบ?',
            text: 'การดำเนินการนี้ไม่สามารถยกเลิกได้',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonText: 'ยกเลิก',
            confirmButtonText: 'ยืนยันลบ',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('appendices.destroy', id), {
                    onSuccess: () => Swal.fire('ลบสำเร็จ!', 'ลบเอกสารแนบเรียบร้อยแล้ว', 'success')
                });
            }
        });
    };

    const getStatusBadgeText = (status) => {
        switch (status) {
            case 'approved': return 'อนุมัติเรียบร้อย (Approved)';
            case 'rejected': return 'ตีกลับแก้ไข (Rejected)';
            case 'draft': return 'ร่างเสนอโครงการ (Draft)';
            default: return 'รอการพิจารณาอนุมัติ (Pending)';
        }
    };

    const handleAdminApprove = (mode) => {
        const title = mode === 'full' 
            ? '👑 ยืนยันอนุมัติรวดเดียวสมบูรณ์ทั้ง 6 ขั้นตอน?'
            : `⚡ ยืนยันอนุมัติขั้นตอนที่ ${project.current_approval_step || 1} ทันที?`;

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
                    onSuccess: () => {
                        Swal.fire('สำเร็จ!', 'การอนุมัติลัดโดยผู้ดูแลระบบเสร็จสิ้นเรียบร้อยแล้ว', 'success');
                    }
                });
            }
        });
    };

    const handleDeleteProject = () => {
        Swal.fire({
            title: 'ยืนยันการลบโครงการเสนออนุมัติ?',
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
                    onSuccess: () => {
                        Swal.fire('ลบสำเร็จ', 'ลบโครงการเรียบร้อยแล้ว', 'success');
                        router.visit(route('dashboard'));
                    }
                });
            }
        });
    };

    const isAppendixUploaded = (keyword) => {
        if (!project.appendices || project.appendices.length === 0) return false;
        return project.appendices.some(app => app.title.toLowerCase().includes(keyword.toLowerCase()));
    };

    const recommendedDocs = [
        { id: 1, title: 'กำหนดการโครงการ', icon: '📄', keyword: 'กำหนดการ' },
        { id: 2, title: 'คำสั่งแต่งตั้งปฏิบัติหน้าที่', icon: '📋', keyword: 'คำสั่ง' },
        { id: 3, title: 'คำกล่าวรายงาน / กล่าวเปิด', icon: '🎤', keyword: 'คำกล่าว' },
        { id: 4, title: 'รายชื่อผู้เข้าร่วมโครงการ', icon: '👥', keyword: 'รายชื่อ' },
        { id: 5, title: 'หนังสือเชิญวิทยากร/หน่วยงาน', icon: '✉️', keyword: 'เชิญ' },
        { id: 6, title: 'สรุปผลการประเมินความพึงพอใจ', icon: '📊', keyword: 'ประเมิน' },
    ];

    const handleUpdateStatus = (newStatus, statusLabel) => {
        Swal.fire({
            title: `ยืนยันปรับสถานะโครงการ?`,
            text: `ต้องการเปลี่ยนสถานะการดำเนินงานโครงการเป็น "${statusLabel}" ใช่หรือไม่?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#7c3aed',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ยืนยันอัปเดตสถานะ',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('projects.update_status', project.id), {
                    status: newStatus
                }, {
                    onSuccess: () => {
                        Swal.fire('อัปเดตเรียบร้อย', `สถานะโครงการเปลี่ยนเป็น ${statusLabel} แล้ว`, 'success');
                    }
                });
            }
        });
    };

    const getApprovalStepOfficerInfo = (step, status) => {
        if (status === 'approved') {
            return {
                title: '🎓 อนุมัติสมบูรณ์แล้ว (Approved) — พร้อมจัดซื้อจัดจ้าง (ขั้นตอนที่ 3)',
                desc: 'โครงการผ่านการลงนามอนุมัติสมบูรณ์แล้ว ผู้ดำเนินโครงการสามารถกรอกข้อมูลพัสดุและจัดทำคำสั่งใน แท็บที่ 2 ได้ทันที',
                color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
                icon: '✅'
            };
        }
        if (status === 'in_progress') {
            return {
                title: '📦 อยู่ระหว่างดำเนินโครงการ / เบิกจ่ายเงิน (In Progress — ขั้นตอนที่ 4)',
                desc: 'โครงการอยู่ระหว่างการจัดหาพัสดุ ดำเนินกิจกรรม และเคลียร์เงินเบิกจ่าย',
                color: 'bg-blue-50 border-blue-200 text-blue-900',
                icon: '🔄'
            };
        }
        if (status === 'evaluating') {
            return {
                title: '⭐ อยู่ระหว่างประเมินผลโครงการ (Evaluating — ขั้นตอนที่ 5)',
                desc: 'กิจกรรมโครงการเสร็จสิ้นแล้ว อยู่ระหว่างสรุปแบบประเมินผลและการวิเคราะห์ AI ในแท็บที่ 3',
                color: 'bg-purple-50 border-purple-200 text-purple-900',
                icon: '📊'
            };
        }
        if (status === 'completed') {
            return {
                title: '🎉 โครงการเสร็จสมบูรณ์เรียบร้อยแล้ว (Completed — ขั้นตอนที่ 6)',
                desc: 'โครงการผ่านการสรุปและจัดทำรายงานผลเล่มรวม PDF สมบูรณ์เรียบร้อยแล้ว',
                color: 'bg-teal-50 border-teal-200 text-teal-900',
                icon: '🏆'
            };
        }
        if (status === 'rejected') {
            return {
                title: '✕ โครงการถูกส่งกลับแก้ไข (Returned for Revisions)',
                desc: 'โครงการถูกส่งกลับให้ผู้เสนอแก้ไขตามข้อเสนอแนะ กรุณาปรับปรุงข้อมูลแล้วกดปุ่ม "🚀 ยื่นขออนุมัติเพื่อดำเนินงานต่อ"',
                color: 'bg-rose-50 border-rose-200 text-rose-900',
                icon: '⚠️'
            };
        }
        if (status === 'draft') {
            return {
                title: '📝 อยู่ระหว่างการร่างโครงการ (Draft)',
                desc: 'โครงการอยู่ระหว่างการกรอกข้อมูลโดยครูผู้เสนอ กดปุ่ม "🚀 ยื่นขออนุมัติเพื่อดำเนินงานต่อ" เพื่อส่งให้คณะกรรมการพิจารณา',
                color: 'bg-slate-50 border-slate-200 text-slate-800',
                icon: '📝'
            };
        }

        switch (step) {
            case 2:
                return {
                    title: 'ขั้นที่ 2: รอการพิจารณาจาก "หัวหน้าแผนกวิชา / หัวหน้างาน"',
                    desc: 'ระบบส่งเรื่องไปยัง หัวหน้าแผนกวิชา/งาน เพื่อตรวจสอบความเหมาะสมเบื้องต้น',
                    color: 'bg-blue-50 border-blue-200 text-blue-900',
                    icon: '👤'
                };
            case 3:
                return {
                    title: 'ขั้นที่ 3: รอการพิจารณาจาก "งานวางแผนและงบประมาณ"',
                    desc: 'ระบบส่งเรื่องไปยัง เจ้าหน้าที่/หัวหน้างานวางแผน เพื่อตรวจสอบยุทธศาสตร์และผูกจัดสรรงบประมาณ',
                    color: 'bg-cyan-50 border-cyan-200 text-cyan-900',
                    icon: '💰'
                };
            case 4:
                return {
                    title: 'ขั้นที่ 4: รอการพิจารณาจาก "งานพัสดุ"',
                    desc: 'ระบบส่งเรื่องไปยัง เจ้าหน้าที่/หัวหน้างานพัสดุ เพื่อตรวจสอบรายการจัดซื้อจัดจ้างและคำสั่งแต่งตั้ง',
                    color: 'bg-violet-50 border-violet-200 text-violet-900',
                    icon: '📦'
                };
            case 5:
                return {
                    title: 'ขั้นที่ 5: รอการพิจารณาจาก "รองผู้อำนวยการฝ่าย"',
                    desc: 'ระบบส่งเรื่องไปยัง รองผู้อำนวยการกำกับดูแลฝ่าย เพื่อพิจารณาอนุมัติระดับบริหาร',
                    color: 'bg-amber-50 border-amber-200 text-amber-900',
                    icon: '🏢'
                };
            case 6:
                return {
                    title: 'ขั้นที่ 6: รอการลงนามอนุมัติจาก "ผู้อำนวยการวิทยาลัย"',
                    desc: 'ระบบส่งเรื่องไปยัง ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน เพื่อลงนามอนุมัติโครงการฉบับสมบูรณ์',
                    color: 'bg-purple-50 border-purple-200 text-purple-900',
                    icon: '🎓'
                };
            default:
                return {
                    title: 'อยู่ระหว่างเสนอขออนุมัติ',
                    desc: 'ระบบกำลังดำเนินการตามสายงานอนุมัติ',
                    color: 'bg-purple-50 border-purple-200 text-purple-900',
                    icon: '⏳'
                };
        }
    };

    const currentOfficerInfo = getApprovalStepOfficerInfo(project.current_approval_step, project.status);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between whitespace-nowrap flex-nowrap gap-4">
                    <div className="whitespace-nowrap shrink-0">
                        <h2 className="text-2xl font-black leading-tight text-purple-950 font-sans whitespace-nowrap">
                            📋 รายละเอียดโครงการ: {project.title}
                        </h2>
                        <p className="text-xs text-slate-500 font-sans mt-0.5 whitespace-nowrap">
                            ระบบติดตามและบริหารจัดการโครงการ วิทยาลัยสารพัดช่างน่าน
                        </p>
                    </div>
                    <div className="flex items-center gap-x-2.5 whitespace-nowrap flex-nowrap shrink-0">
                        {(project.status === 'draft' || project.status === 'rejected') && (project.user_id === auth.user.id || auth.user.is_admin || auth.user.role?.name === 'admin' || auth.user.role === 'admin') && (
                            <button
                                onClick={handleWorkflowSubmit}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                title="ยื่นขออนุมัติเพื่อดำเนินงานโครงการต่อ"
                            >
                                🚀 ยื่นขออนุมัติเพื่อดำเนินงานโครงการต่อ
                            </button>
                        )}
                        {(auth.user.is_admin || auth.user.role?.name === 'admin' || auth.user.role === 'admin' || project.status === 'draft') && (
                            <Link
                                href={route('projects.edit', project.id)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-3.5 py-2 text-xs font-bold text-purple-950 shadow-md shadow-amber-400/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                title="แก้ไขรายละเอียดโครงการ"
                            >
                                ✏️ แก้ไขโครงการ
                            </Link>
                        )}
                        {(auth.user.is_admin || auth.user.role?.name === 'admin' || auth.user.role === 'admin' || project.status === 'draft') && (
                            <button
                                onClick={handleDeleteProject}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                title="ลบโครงการนี้ออกจากระบบ"
                            >
                                🗑️ ลบโครงการ
                            </button>
                        )}
                        <a
                            href={route('projects.print', project.id)}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:scale-105 transition-all whitespace-nowrap shrink-0"
                        >
                            🖨️ พิมพ์เอกสารโครงการ (Print PDF)
                        </a>
                        <Link
                            href={route('dashboard')}
                            className="inline-flex items-center rounded-xl border border-purple-200 bg-white px-4 py-2 text-xs font-bold text-purple-800 shadow-xs hover:bg-purple-50 transition-all whitespace-nowrap shrink-0"
                        >
                            ← ย้อนกลับหน้าศูนย์ควบคุม
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`รายละเอียดโครงการ: ${project.title}`} />

            <div className="py-8 font-sans">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    
                    {/* Top Status Header */}
                    <div className="mb-6 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 uppercase tracking-wider">
                                {project.department?.name || 'ฝ่ายบริหารจัดการ / งานวางแผน'}
                            </span>
                            <h1 className="text-xl font-black text-purple-950 mt-2">{project.title}</h1>
                            <p className="text-xs text-slate-500 mt-1">
                                <span className="font-bold text-slate-700">ผู้เสนอโครงการ:</span> {project.user?.name} | <span className="font-bold text-slate-700">ปีการศึกษา พ.ศ.:</span> {project.academic_year} | <span className="font-bold text-purple-800">งบประมาณเสนอขอ:</span> {formatCurrency(project.estimated_budget)}
                            </p>
                        </div>
                        <div className="flex items-center gap-x-3">
                            <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-bold ${
                                project.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                project.status === 'draft' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                                project.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                                สถานะ: {getStatusBadgeText(project.status)} (ขั้นตอนที่ {project.current_approval_step}/6)
                            </span>
                            {(project.status === 'draft' || project.status === 'rejected') && (project.user_id === auth.user.id || auth.user.is_admin || auth.user.role?.name === 'admin' || auth.user.role === 'admin') && (
                                <button
                                    onClick={handleWorkflowSubmit}
                                    className="rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:scale-105 shadow-md shadow-emerald-600/25 transition-all whitespace-nowrap"
                                >
                                    🚀 ยื่นขออนุมัติเพื่อดำเนินงานโครงการต่อ
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Visual Workflow Stepper Bar */}
                    <ProjectWorkflowStepper currentStep={project.current_approval_step || 1} status={project.status} />

                    {/* Current Approval Officer Info Banner */}
                    <div className={`mb-6 p-4 rounded-2xl border ${currentOfficerInfo.color} flex items-center gap-3 font-sans shadow-2xs`}>
                        <span className="text-2xl">{currentOfficerInfo.icon}</span>
                        <div>
                            <h4 className="text-sm font-extrabold">{currentOfficerInfo.title}</h4>
                            <p className="text-xs opacity-90 mt-0.5">{currentOfficerInfo.desc}</p>
                        </div>
                    </div>

                    {project.current_approval_step === 4 && project.status === 'pending_approval' && (
                        <div className="mb-6 p-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm font-sans">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl animate-bounce">📦</span>
                                <div>
                                    <h4 className="text-sm font-extrabold text-amber-950">
                                        ข้อแนะนำสำหรับขั้นตอนที่ 4 (งานพัสดุ): รายการจัดซื้อจัดจ้าง & คำสั่งแต่งตั้งกรรมการ
                                    </h4>
                                    <p className="text-xs text-amber-900 mt-0.5">
                                        ในขั้นตอนนี้ เจ้าหน้าที่งานพัสดุและผู้เสนอโครงการสามารถจัดทำเอกสารจัดซื้อจัดจ้าง 4 ฉบับ และตรวจสอบคำสั่งแต่งตั้งคณะกรรมการจัดซื้อจัดจ้างใน แท็บที่ 2 (Do) ได้ทันที
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveTab('do')}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 px-4 py-2 text-xs font-black text-white shadow-md hover:scale-105 transition-all whitespace-nowrap shrink-0"
                            >
                                🛠️ ไปยัง แท็บที่ 2 (Do) จัดการพัสดุ ➔
                            </button>
                        </div>
                    )}

                    {/* 4-Tab Navigation Bar */}
                    <div className="flex border-b border-purple-100 mb-8 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('plan')}
                            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                                activeTab === 'plan'
                                    ? 'border-purple-600 text-purple-900 bg-purple-50/40'
                                    : 'border-transparent text-slate-500 hover:text-purple-700'
                            }`}
                        >
                            📋 แท็บที่ 1: รายละเอียดข้อเสนอโครงการ (Plan)
                        </button>
                        <button
                            onClick={() => setActiveTab('do')}
                            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                                activeTab === 'do'
                                    ? 'border-purple-600 text-purple-900 bg-purple-50/40'
                                    : 'border-transparent text-slate-500 hover:text-purple-700'
                            }`}
                        >
                            🛠️ แท็บที่ 2: การจัดซื้อจัดจ้าง & ดำเนินงาน (Do)
                        </button>
                        <button
                            onClick={() => setActiveTab('check')}
                            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                                activeTab === 'check'
                                    ? 'border-purple-600 text-purple-900 bg-purple-50/40'
                                    : 'border-transparent text-slate-500 hover:text-purple-700'
                            }`}
                        >
                            📊 แท็บที่ 3: แบบสำรวจ & ประเมินผล (Check)
                        </button>
                        <button
                            onClick={() => setActiveTab('act')}
                            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                                activeTab === 'act'
                                    ? 'border-purple-600 text-purple-900 bg-purple-50/40'
                                    : 'border-transparent text-slate-500 hover:text-purple-700'
                            }`}
                        >
                            🤖 แท็บที่ 4: รายงาน AI & ภาคผนวก (Act)
                        </button>
                    </div>

                    {/* Tab 1: Plan & Details */}
                    {activeTab === 'plan' && (
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm space-y-6">
                                    <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-100 flex justify-between items-center">
                                        <div>
                                            <h4 className="text-xs font-bold text-purple-950">📄 แบบเสนอโครงการฉบับทางการ (Official Proposal Document)</h4>
                                            <p className="text-[11px] text-slate-600 mt-0.5">เปิดดูแบบฟอร์มเอกสารเสนอโครงการฉบับทางการ พร้อมพิมพ์ออกทางเครื่องพิมพ์หรือบันทึก PDF</p>
                                        </div>
                                        <a
                                            href={route('projects.print', project.id)}
                                            target="_blank"
                                            className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-sm transition-all"
                                        >
                                            🖨️ ดูแบบเสนอโครงการ / พิมพ์ PDF
                                        </a>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">หลักการและเหตุผล (Background & Rationale)</h4>
                                        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{project.background_rationale}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">วัตถุประสงค์ของโครงการ (Objectives)</h4>
                                        <ul className="list-disc pl-5 text-sm text-slate-800 space-y-1">
                                            {project.objectives?.map((obj, i) => <li key={i}>{obj}</li>)}
                                        </ul>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-purple-100 pt-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">เป้าหมายเชิงปริมาณ (Quantitative Targets)</h4>
                                            <ul className="list-disc pl-4 text-xs font-semibold text-slate-800 space-y-1">
                                                {Array.isArray(project.targets?.quantitative)
                                                    ? project.targets.quantitative.map((q, i) => <li key={i}>{q}</li>)
                                                    : <li>{project.targets?.quantitative || '-'}</li>
                                                }
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">เป้าหมายเชิงคุณภาพ (Qualitative Targets)</h4>
                                            <ul className="list-disc pl-4 text-xs font-semibold text-slate-800 space-y-1">
                                                {Array.isArray(project.targets?.qualitative)
                                                    ? project.targets.qualitative.map((q, i) => <li key={i}>{q}</li>)
                                                    : <li>{project.targets?.qualitative || '-'}</li>
                                                }
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Dynamic Strategic Alignments */}
                                    <div className="border-t border-purple-100 pt-4 space-y-3">
                                        <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider">ความสอดคล้องกับยุทธศาสตร์การพัฒนา (Strategic Alignments)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {strategyCategories.map((cat, catIdx) => {
                                                const selections = project.strategy_selections?.[cat.id] || [];
                                                const selectedItems = (cat.items || []).filter(item => selections.includes(item.id));

                                                // Fallbacks for legacy fields if strategy_selections not present
                                                let fallbackItems = [];
                                                if (selections.length === 0) {
                                                    if (cat.code === 'iqa') fallbackItems = project.iqa_strategies?.length ? project.iqa_strategies : (project.iqa_strategy ? [project.iqa_strategy] : []);
                                                    else if (cat.code === 'ovec') fallbackItems = project.ovec_strategies?.length ? project.ovec_strategies : (project.ovec_strategy ? [project.ovec_strategy] : []);
                                                    else if (cat.code === 'national') fallbackItems = project.national_strategies || [];
                                                    else if (cat.code === 'provincial') fallbackItems = project.provincial_strategies || [];
                                                }

                                                const displayList = selectedItems.length > 0 ? selectedItems : fallbackItems;

                                                return (
                                                    <div key={cat.id} className="bg-purple-50/30 p-3 rounded-xl border border-purple-100">
                                                        <h5 className="text-xs font-bold text-slate-800 mb-1">
                                                            {catIdx + 1}. {cat.name}
                                                        </h5>
                                                        <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                                                            {displayList.map((item, i) => (
                                                                <li key={i}>{item.name}</li>
                                                            ))}
                                                            {displayList.length === 0 && <li className="list-none text-slate-400">-</li>}
                                                        </ul>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Approver Side Panel */}
                            <div className="lg:col-span-1 space-y-6">
                                {canApprove && (
                                    <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 shadow-sm">
                                        <h3 className="text-base font-bold text-rose-950 mb-3">⚡ การดำเนินการพิจารณาอนุมัติโครงการ</h3>
                                        <form className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-rose-900">ข้อคิดเห็น / หมายเหตุการพิจารณา</label>
                                                <textarea
                                                    rows={3}
                                                    value={data.comments}
                                                    onChange={(e) => setData('comments', e.target.value)}
                                                    className="mt-1 block w-full rounded-xl border-rose-200 shadow-2xs focus:border-rose-500 focus:ring-rose-500 text-xs"
                                                    placeholder="ระบุข้อคิดเห็น คำเสนอแนะ หรือเหตุผลการอนุมัติ/ตีกลับ..."
                                                ></textarea>
                                            </div>

                                            {project.current_approval_step === 3 && (
                                                <div className="bg-purple-100/70 p-3.5 rounded-xl border border-purple-200 space-y-3 font-sans my-2">
                                                    <div className="flex items-center gap-1.5 text-purple-950 font-extrabold text-xs">
                                                        <span>💰</span>
                                                        <span>จัดสรรเงินงบประมาณ (งานวางแผน)</span>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-purple-900 mb-1">หมวดแหล่งเงินงบประมาณ</label>
                                                        <select
                                                            value={data.funding_source_id}
                                                            onChange={(e) => setData('funding_source_id', e.target.value)}
                                                            className="w-full rounded-xl border-purple-200 text-xs font-medium focus:ring-purple-500 focus:border-purple-500"
                                                        >
                                                            {fundingSources.map((fs) => (
                                                                <option key={fs.id} value={fs.id}>
                                                                    {fs.name} (คงเหลือ {new Intl.NumberFormat('th-TH').format((fs.total_budget || 0) - (fs.encumbered_budget || 0))} บาท)
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-purple-900 mb-1">วงเงินอนุมัติจัดสรรจริง (บาท)</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={data.allocated_amount}
                                                            onChange={(e) => setData('allocated_amount', e.target.value)}
                                                            className="w-full rounded-xl border-purple-200 text-xs font-bold text-emerald-700 focus:ring-purple-500 focus:border-purple-500"
                                                        />
                                                        <p className="text-[11px] text-slate-500 mt-1">งบเสนอขอเดิม: {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(project.estimated_budget)}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={handleReject}
                                                    disabled={processing}
                                                    className="inline-flex justify-center items-center rounded-xl bg-rose-600 py-2.5 px-3 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition-all"
                                                >
                                                    ❌ ตีกลับแก้ไข
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleApprove}
                                                    disabled={processing}
                                                    className="inline-flex justify-center items-center rounded-xl bg-emerald-600 py-2.5 px-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all"
                                                >
                                                    ✅ อนุมัติส่งต่อ
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {(auth.user.is_admin || auth.user.role?.name === 'admin' || auth.user.role === 'admin') && project.status !== 'approved' && (
                                    <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-5 shadow-md space-y-3 font-sans">
                                        <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                                            <span>👑</span>
                                            <span>แผงควบคุมอนุมัติลัด (เฉพาะผู้ดูแลระบบ Admin)</span>
                                        </div>
                                        <p className="text-xs text-amber-900 leading-relaxed">
                                            ผู้ดูแลระบบสามารถกดอนุมัติข้ามขั้นตอนปัจจุบัน หรือกดอนุมัติรวดเดียวสมบูรณ์ทั้ง 6 ขั้นตอนเพื่อทดสอบระบบได้ทันที
                                        </p>
                                        <div className="flex flex-col gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => handleAdminApprove('step')}
                                                className="w-full inline-flex justify-center items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 py-2.5 px-3 text-xs font-extrabold text-white shadow-md hover:scale-105 active:scale-95 transition-all"
                                            >
                                                ⚡ อนุมัติขั้นที่ {project.current_approval_step || 1} ทันที (Admin Advance)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleAdminApprove('full')}
                                                className="w-full inline-flex justify-center items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 py-2.5 px-3 text-xs font-extrabold text-white shadow-md hover:scale-105 active:scale-95 transition-all"
                                            >
                                                👑 อนุมัติรวดเดียวสมบูรณ์ (Admin Full 6-Step)
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                                    <h3 className="text-base font-bold text-purple-950 mb-4">📜 ประวัติและบันทึกการอนุมัติโครงการ</h3>
                                    <div className="space-y-3">
                                        {(!project.approvals || project.approvals.length === 0) ? (
                                            <p className="text-xs text-slate-400">ยังไม่มีประวัติการพิจารณาอนุมัติ</p>
                                        ) : (
                                            project.approvals.map((log) => (
                                                <div key={log.id} className="border-l-2 border-purple-500 pl-3 py-1 space-y-1">
                                                    <div className="flex justify-between text-xs font-bold">
                                                        <span className="text-slate-900">{log.user?.name}</span>
                                                        <span className={log.status === 'approved' ? 'text-emerald-600' : 'text-rose-600'}>
                                                            {log.status === 'approved' ? '✅ อนุมัติแล้ว' : '❌ ตีกลับแก้ไข'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs text-slate-600">
                                                        <span>ขั้นตอนที่ {log.step_number}: {log.comments || '-'}</span>
                                                        {log.created_at && (
                                                            <span className="text-[11px] font-medium text-purple-600">
                                                                {new Date(log.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Procurement (Do) */}
                    {activeTab === 'do' && (
                        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm space-y-6 font-sans">
                            {/* PDCA Status Action Bar for Project Owner / Admin */}
                            {(project.user_id === auth.user.id || auth.user.is_admin || auth.user.role?.name === 'admin' || auth.user.role === 'admin') && (
                                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/5 via-indigo-900/10 to-purple-900/5 border border-blue-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div>
                                        <h4 className="text-xs font-black text-purple-950 uppercase flex items-center gap-1.5">
                                            <span>📌 สถานะดำเนินงานปัจจุบัน:</span>
                                            <span className="text-purple-700 bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
                                                {project.status === 'in_progress' ? 'กำลังดำเนินโครงการ & เบิกจ่าย (ขั้นตอนที่ 4)' : project.status === 'approved' ? 'อนุมัติสมบูรณ์ / จัดซื้อจัดจ้าง (ขั้นตอนที่ 3)' : project.status === 'evaluating' ? 'อยู่ระหว่างประเมินผล (ขั้นตอนที่ 5)' : project.status === 'completed' ? 'เสร็จสิ้นโครงการสมบูรณ์ (ขั้นตอนที่ 6)' : project.status}
                                            </span>
                                        </h4>
                                        <p className="text-xs text-slate-600 mt-1">ผู้ดำเนินโครงการสามารถอัปเดตสถานะโครงการตามวงจร PDCA เมื่อดำเนินกิจกรรมหรือเคลียร์เงินเรียบร้อย</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 shrink-0">
                                        {project.status === 'approved' && (
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateStatus('in_progress', 'กำลังดำเนินโครงการ/เบิกจ่าย (ขั้นตอนที่ 4)')}
                                                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 text-white font-bold text-xs shadow-md transition-all whitespace-nowrap"
                                            >
                                                🚀 เริ่มดำเนินโครงการ & เบิกจ่าย (ขั้นที่ 4) ➔
                                            </button>
                                        )}
                                        {(project.status === 'approved' || project.status === 'in_progress') && (
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateStatus('evaluating', 'ประเมินผลโครงการ (ขั้นตอนที่ 5)')}
                                                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 text-white font-bold text-xs shadow-md transition-all whitespace-nowrap"
                                            >
                                                ⭐ เข้าสู่การประเมินผล (ขั้นที่ 5) ➔
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-purple-100 pb-4">
                                <div>
                                    <h3 className="text-lg font-black text-purple-950">🛠️ การจัดซื้อจัดจ้าง และคำสั่งแต่งตั้งกรรมการ (Do Phase)</h3>
                                    <p className="text-xs text-slate-600 mt-0.5">ระบุรายการวัสดุอุปกรณ์ แต่งตั้งคณะกรรมการพัสดุ และพิมพ์เอกสารจัดซื้อจัดจ้าง 4 ฉบับตามระเบียบ</p>
                                </div>
                                <button
                                    onClick={handleSaveProcurement}
                                    className="rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/25 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                                >
                                    💾 บันทึกข้อมูล & ออกคำสั่งพัสดุ
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                                    <span className="text-xs font-bold uppercase text-purple-800">แหล่งเงินงบประมาณ</span>
                                    <p className="text-base font-black text-purple-950 mt-1">{project.budget?.fundingSource?.name || 'เงินรายได้สถานศึกษา (Revenue)'}</p>
                                </div>
                                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                                    <span className="text-xs font-bold uppercase text-emerald-800">วงเงินงบประมาณที่ได้รับการอนุมัติ</span>
                                    <p className="text-base font-black text-emerald-600 mt-1">{formatCurrency(allocatedBudget)}</p>
                                </div>
                                <div className={`p-4 rounded-xl border transition-all ${isOverBudget ? 'bg-rose-50 border-rose-200' : 'bg-indigo-50/50 border-indigo-100'}`}>
                                    <span className={`text-xs font-bold uppercase ${isOverBudget ? 'text-rose-800' : 'text-indigo-800'}`}>ยอดรวมจัดซื้อจัดจ้างทั้งสิ้น</span>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className={`text-base font-black ${isOverBudget ? 'text-rose-600' : 'text-indigo-950'}`}>{formatCurrency(totalProcurementSum)}</p>
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${isOverBudget ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-100 text-emerald-800'}`}>
                                            {isOverBudget ? `เกิน ${formatCurrency(budgetDifference)}` : `คงเหลือ ${formatCurrency(budgetDifference)}`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Over Budget Red Warning Banner */}
                            {isOverBudget && (
                                <div className="rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🚨</span>
                                        <div>
                                            <h4 className="text-xs font-black uppercase text-rose-100">เตือน: ยอดรวมพัสดุเกินวงเงินอนุมัติ!</h4>
                                            <p className="text-xs font-bold text-white mt-0.5">
                                                ยอดรวมจัดซื้อจัดจ้างทั้งหมด <b>{formatCurrency(totalProcurementSum)}</b> เกินวงเงินอนุมัติ (<b>{formatCurrency(allocatedBudget)}</b>) อยู่ <span className="underline font-black text-amber-200">{formatCurrency(budgetDifference)}</span> กรุณาปรับลดจำนวนหรือราคาต่อหน่วยพัสดุ
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => Swal.fire('คำแนะนำในการปรับลดงบประมาณ', `ขณะนี้ยอดรวมจัดซื้อจัดจ้างเกินกว่าวงเงินอนุมัติอยู่ ${formatCurrency(budgetDifference)}\n\nกรุณาแก้ไขคอลัมน์ "จำนวน" หรือ "ราคาต่อหน่วย" ในตารางด้านล่างให้รวมกันแล้วไม่เกิน ${formatCurrency(allocatedBudget)}`, 'info')}
                                        className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg whitespace-nowrap backdrop-blur-xs border border-white/30"
                                    >
                                        💡 วิธีแก้ไข
                                    </button>
                                </div>
                            )}

                            {/* Section 1: Procurement Items Table & Add Form */}
                            <div className="border border-purple-100 rounded-2xl p-5 bg-purple-50/20 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-extrabold text-purple-950">📦 รายการวัสดุอุปกรณ์ที่จะจัดซื้อจัดจ้าง (Procurement Items)</h4>
                                    <button
                                        type="button"
                                        onClick={() => setProcurementItems([...procurementItems, { description: '', quantity: 1, unit: 'รายการ', unit_price: 0 }])}
                                        className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-white px-3 py-1.5 rounded-lg border border-purple-200 shadow-2xs hover:bg-purple-50"
                                    >
                                        + เพิ่มรายการวัสดุ
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse bg-white rounded-xl overflow-hidden border border-purple-100">
                                        <thead>
                                            <tr className="bg-purple-100/60 text-purple-950 text-xs font-bold uppercase">
                                                <th className="p-3">ลำดับ</th>
                                                <th className="p-3">รายการวัสดุ / อุปกรณ์</th>
                                                <th className="p-3 w-20 text-center">จำนวน</th>
                                                <th className="p-3 w-24 text-center">หน่วยนับ</th>
                                                <th className="p-3 w-32 text-right">ราคาต่อหน่วย</th>
                                                <th className="p-3 w-32 text-right">รวมเป็นเงิน</th>
                                                <th className="p-3 w-12 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-purple-100 text-xs">
                                            {procurementItems.map((item, idx) => {
                                                const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
                                                return (
                                                    <tr key={idx} className="hover:bg-purple-50/30">
                                                        <td className="p-3 font-bold text-slate-700 text-center">{idx + 1}</td>
                                                        <td className="p-2">
                                                            <input
                                                                type="text"
                                                                value={item.description}
                                                                onChange={(e) => {
                                                                    const updated = [...procurementItems];
                                                                    updated[idx].description = e.target.value;
                                                                    setProcurementItems(updated);
                                                                }}
                                                                placeholder="ระบุชื่อวัสดุ / รายการจัดซื้อ..."
                                                                className="w-full rounded-lg border-purple-200 text-xs focus:ring-purple-500 focus:border-purple-500"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const updated = [...procurementItems];
                                                                    updated[idx].quantity = e.target.value;
                                                                    setProcurementItems(updated);
                                                                }}
                                                                className="w-full rounded-lg border-purple-200 text-xs text-center font-bold focus:ring-purple-500 focus:border-purple-500"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="text"
                                                                value={item.unit}
                                                                onChange={(e) => {
                                                                    const updated = [...procurementItems];
                                                                    updated[idx].unit = e.target.value;
                                                                    setProcurementItems(updated);
                                                                }}
                                                                placeholder="เช่น งาน/ชุด"
                                                                className="w-full rounded-lg border-purple-200 text-xs text-center focus:ring-purple-500 focus:border-purple-500"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.unit_price}
                                                                onChange={(e) => {
                                                                    const updated = [...procurementItems];
                                                                    updated[idx].unit_price = e.target.value;
                                                                    setProcurementItems(updated);
                                                                }}
                                                                className="w-full rounded-lg border-purple-200 text-xs text-right font-bold text-emerald-700 focus:ring-purple-500 focus:border-purple-500"
                                                            />
                                                        </td>
                                                        <td className="p-3 text-right font-bold text-purple-900">
                                                            {formatCurrency(itemTotal)}
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            {procurementItems.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setProcurementItems(procurementItems.filter((_, i) => i !== idx))}
                                                                    className="text-rose-600 hover:text-rose-800 font-bold text-sm"
                                                                    title="ลบรายการ"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-purple-50/60 font-bold text-xs border-t-2 border-purple-200">
                                            <tr>
                                                <td colSpan={5} className="p-3 text-right text-purple-950 font-black">
                                                    รวมงบประมาณจัดซื้อจัดจ้างทั้งสิ้น:
                                                </td>
                                                <td className={`p-3 text-right font-black text-sm ${isOverBudget ? 'text-rose-600' : 'text-purple-950'}`}>
                                                    {formatCurrency(totalProcurementSum)}
                                                </td>
                                                <td></td>
                                            </tr>
                                            {isOverBudget && (
                                                <tr className="bg-rose-100/70 text-rose-950">
                                                    <td colSpan={7} className="p-2.5 text-center text-xs font-black">
                                                        ⚠️ ยอดรวมพัสดุเกินวงเงินอนุมัติ ({formatCurrency(allocatedBudget)}) อยู่ {formatCurrency(budgetDifference)} — ระบบไม่อนุญาตให้บันทึกจนกว่าจะปรับลดราคาให้อยู่ในวงเงิน
                                                    </td>
                                                </tr>
                                            )}
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Section 2: Committee Appointment Form */}
                            <div className="border border-purple-100 rounded-2xl p-5 bg-purple-50/20 space-y-4">
                                <h4 className="text-sm font-extrabold text-purple-950">👥 แต่งตั้งคณะกรรมการจัดซื้อจัดจ้าง และตรวจรับพัสดุ (Committees)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Purchasing Committee */}
                                    <div className="bg-white p-4 rounded-xl border border-purple-100 space-y-3">
                                        <h5 className="text-xs font-bold text-purple-900 border-b border-purple-100 pb-1.5">1. คณะกรรมการจัดซื้อ/จัดจ้าง</h5>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">ประธานกรรมการจัดซื้อ</label>
                                            <select
                                                value={purchasingChair}
                                                onChange={(e) => setPurchasingChair(e.target.value)}
                                                className="w-full rounded-lg border-purple-200 text-xs focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">กรรมการจัดซื้อ (คนที่ 1)</label>
                                            <select
                                                value={purchasingMember1}
                                                onChange={(e) => setPurchasingMember1(e.target.value)}
                                                className="w-full rounded-lg border-purple-200 text-xs focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">กรรมการจัดซื้อ (คนที่ 2)</label>
                                            <select
                                                value={purchasingMember2}
                                                onChange={(e) => setPurchasingMember2(e.target.value)}
                                                className="w-full rounded-lg border-purple-200 text-xs focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Inspection Committee */}
                                    <div className="bg-white p-4 rounded-xl border border-purple-100 space-y-3">
                                        <h5 className="text-xs font-bold text-emerald-900 border-b border-purple-100 pb-1.5">2. คณะกรรมการตรวจรับพัสดุ</h5>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">ประธานกรรมการตรวจรับ</label>
                                            <select
                                                value={inspectionChair}
                                                onChange={(e) => setInspectionChair(e.target.value)}
                                                className="w-full rounded-lg border-purple-200 text-xs focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">กรรมการตรวจรับ (คนที่ 1)</label>
                                            <select
                                                value={inspectionMember1}
                                                onChange={(e) => setInspectionMember1(e.target.value)}
                                                className="w-full rounded-lg border-purple-200 text-xs focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">กรรมการตรวจรับ (คนที่ 2)</label>
                                            <select
                                                value={inspectionMember2}
                                                onChange={(e) => setInspectionMember2(e.target.value)}
                                                className="w-full rounded-lg border-purple-200 text-xs focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: TOR Specifications Text Editor */}
                            <div className="border border-purple-100 rounded-2xl p-5 bg-purple-50/20 space-y-3 font-sans">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-extrabold text-purple-950">📝 รายละเอียดข้อกำหนดขอบเขตงาน (TOR Specification Text)</h4>
                                    <button
                                        type="button"
                                        onClick={() => setTorSpecifications(defaultTorText)}
                                        className="text-[11px] font-bold text-purple-700 hover:underline"
                                    >
                                        🔄 รีเซ็ตเป็นค่าเริ่มต้น
                                    </button>
                                </div>
                                <p className="text-xs text-slate-600">
                                    ผู้ดำเนินโครงการหรือเจ้าหน้าที่พัสดุสามารถแก้ไขข้อความรายละเอียดขอบเขตงาน (TOR) วัตถุประสงค์ เงื่อนไขการส่งมอบ และการตรวจรับพัสดุได้ตามต้องการ
                                </p>
                                <textarea
                                    rows={8}
                                    value={torSpecifications}
                                    onChange={(e) => setTorSpecifications(e.target.value)}
                                    className="w-full rounded-xl border-purple-200 text-xs leading-relaxed focus:ring-purple-500 focus:border-purple-500 bg-white"
                                    placeholder="ระบุข้อกำหนดขอบเขตงาน (TOR Specifications)..."
                                ></textarea>
                            </div>

                            {/* Section 4: Dynamic Procurement Documents Download Cards */}
                            <div className="border-t border-purple-100 pt-4">
                                <h4 className="text-sm font-black text-purple-950 mb-3">📄 เอกสารจัดซื้อจัดจ้างตามระเบียบพัสดุ (พิมพ์/สร้างอัตโนมัติ)</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <a href={route('procurements.download_document', [project.id, 'memo'])} target="_blank" className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl text-center shadow-2xs hover:shadow-md hover:scale-105 transition-all">
                                        <div className="text-lg mb-1">📄</div>
                                        <div className="text-xs font-bold text-purple-900">1. บันทึกข้อความ</div>
                                        <div className="text-[10px] text-purple-600">ขออนุมัติจัดซื้อจัดจ้าง</div>
                                    </a>
                                    <a href={route('procurements.download_document', [project.id, 'request_form'])} target="_blank" className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl text-center shadow-2xs hover:shadow-md hover:scale-105 transition-all">
                                        <div className="text-lg mb-1">🛒</div>
                                        <div className="text-xs font-bold text-purple-900">2. ใบเสนอซื้อ/จ้าง</div>
                                        <div className="text-[10px] text-purple-600">รายการวัสดุพัสดุ</div>
                                    </a>
                                    <a href={route('procurements.download_document', [project.id, 'estimation'])} target="_blank" className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl text-center shadow-2xs hover:shadow-md hover:scale-105 transition-all">
                                        <div className="text-lg mb-1">📊</div>
                                        <div className="text-xs font-bold text-purple-900">3. ตารางราคากลาง</div>
                                        <div className="text-[10px] text-purple-600">คำนวณราคากลางอัตโนมัติ</div>
                                    </a>
                                    <a href={route('procurements.download_document', [project.id, 'tor'])} target="_blank" className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl text-center shadow-2xs hover:shadow-md hover:scale-105 transition-all">
                                        <div className="text-lg mb-1">📜</div>
                                        <div className="text-xs font-bold text-purple-900">4. TOR Specification</div>
                                        <div className="text-[10px] text-purple-600">ข้อกำหนดขอบเขตงาน</div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Survey & Stats (Check) */}
                    {activeTab === 'check' && (
                        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm space-y-6">
                            {(project.user_id === auth.user.id || auth.user.is_admin || auth.user.role?.name === 'admin' || auth.user.role === 'admin') && (
                                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/5 via-indigo-900/10 to-purple-900/5 border border-purple-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-sans">
                                    <div>
                                        <h4 className="text-xs font-black text-purple-950 uppercase flex items-center gap-1.5">
                                            <span>📌 สถานะดำเนินงานปัจจุบัน:</span>
                                            <span className="text-purple-700 bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
                                                {project.status === 'evaluating' ? 'อยู่ระหว่างประเมินผลโครงการ (ขั้นตอนที่ 5)' : project.status === 'completed' ? 'เสร็จสิ้นโครงการสมบูรณ์ (ขั้นตอนที่ 6)' : project.status}
                                            </span>
                                        </h4>
                                        <p className="text-xs text-slate-600 mt-1">เมื่อรวบรวมแบบประเมินและวิเคราะห์สรุปผลเสร็จสิ้น สามารถส่งเรื่องปิดโครงการเข้าสู่ขั้นตอนที่ 6 ได้</p>
                                    </div>
                                    {project.status !== 'completed' && (
                                        <button
                                            type="button"
                                            onClick={() => handleUpdateStatus('completed', 'เสร็จสิ้นโครงการสมบูรณ์ (ขั้นตอนที่ 6)')}
                                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:scale-105 text-white font-bold text-xs shadow-md transition-all whitespace-nowrap"
                                        >
                                            🎉 ปิดโครงการ & สรุปเล่มสมบูรณ์ (ขั้นที่ 6) ➔
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-purple-950">📊 การสำรวจความพึงพอใจ และดัชนีประเมินผลโครงการ (Check)</h3>
                                <Link 
                                    href={route('surveys.stats', project.id)}
                                    className="text-xs font-bold text-purple-700 hover:underline bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200"
                                >
                                    เปิดดูสถิติและรายงานผลฉบับเต็ม ➔
                                </Link>
                            </div>
                            <p className="text-xs text-slate-500">สร้าง QR Code และลิงก์แบบประเมินสำหรับสแกนตอบประเมินความพึงพอใจโครงการออนไลน์</p>
                        </div>
                    )}

                    {/* Tab 4: AI Report & Appendix (Act) */}
                    {activeTab === 'act' && (
                        <div className="space-y-6 font-sans">
                            {(project.user_id === auth.user.id || auth.user.is_admin || auth.user.role?.name === 'admin' || auth.user.role === 'admin') && project.status !== 'completed' && (
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/10 via-teal-900/10 to-emerald-900/5 border border-emerald-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
                                    <div>
                                        <h4 className="text-xs font-black text-emerald-950 uppercase">
                                            🏆 ปิดโครงการฉบับสมบูรณ์ (Complete Project Lifecycle)
                                        </h4>
                                        <p className="text-xs text-emerald-800 mt-0.5">กดปุ่มเพื่อปรับสถานะเป็น "เสร็จสิ้นโครงการสมบูรณ์ (Completed)" เมื่อแนบรูปภาพและหลักฐานครบถ้วนแล้ว</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateStatus('completed', 'เสร็จสิ้นโครงการสมบูรณ์ (ขั้นตอนที่ 6)')}
                                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:scale-105 text-white font-black text-xs shadow-md transition-all whitespace-nowrap"
                                    >
                                        ✅ ยืนยันปิดโครงการสมบูรณ์ (Completed)
                                    </button>
                                </div>
                            )}
                            {/* Download Stitched PDF */}
                            {project.status === 'approved' && (
                                <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg">
                                    <div>
                                        <h3 className="text-lg font-bold">ดาวน์โหลดรายงานผลโครงการฉบับสมบูรณ์ (PDF)</h3>
                                        <p className="text-xs text-purple-200 mt-1">ระบบรวมเล่มเสนอโครงการ งบประมาณ สถิติความพึงพอใจ รูปภาพ และภาคผนวกให้อัตโนมัติ</p>
                                    </div>
                                    <a
                                        href={route('projects.download_report', project.id)}
                                        className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-purple-950 shadow hover:bg-purple-50 transition-all"
                                    >
                                        📥 ดาวน์โหลดรายงานผลฉบับสมบูรณ์ (.pdf)
                                    </a>
                                </div>
                            )}

                            {/* Appendices Upload Card */}
                            <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm space-y-5 font-sans">
                                <div>
                                    <h3 className="text-base font-bold text-purple-950">📁 เอกสารแนบและภาคผนวก (PDF Attachments)</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">อัปโหลดเอกสารประกอบรายงานผลฉบับสมบูรณ์สำหรับรวมเล่ม PDF อัตโนมัติ</p>
                                </div>

                                {/* Auto-Generated Layout Info Banner */}
                                <div className="p-4 rounded-xl bg-gradient-to-r from-teal-900/10 via-emerald-900/10 to-teal-900/5 border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans shadow-2xs">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">📖</span>
                                        <div>
                                            <h4 className="text-xs font-black text-emerald-950 uppercase">
                                                ระบบสร้าง "หน้าปกฉบับทางการ", "คำนำ", และ "สารบัญ" ให้โดยอัตโนมัติ (Auto-Generated)
                                            </h4>
                                            <p className="text-xs text-emerald-800 mt-0.5">
                                                เมื่อรวมเล่มเสนอรายงานผล (PDF) ระบบจะดึงข้อมูลโครงการและจัดทำหน้าปก คำนำ และสารบัญให้อัตโนมัติ โดยท่านไม่ต้องสร้างหรือพิมพ์ไฟล์หน้าปกเอง
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-bold bg-emerald-600 text-white px-3 py-1 rounded-full shrink-0 shadow-2xs">
                                        ✓ มีในระบบอัตโนมัติ
                                    </span>
                                </div>

                                {/* Guidance Box: Recommended Files Checklist with Live Status */}
                                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-2">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                                        <h4 className="text-xs font-black text-purple-950 uppercase flex items-center gap-1.5">
                                            <span>💡 รายการเอกสารแนบที่แนะนำสำหรับการสรุปรายงานผลโครงการ:</span>
                                        </h4>
                                        <span className="text-[11px] font-extrabold text-purple-800 bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
                                            อัปโหลดแล้ว {recommendedDocs.filter(d => isAppendixUploaded(d.keyword)).length} / {recommendedDocs.length} รายการ
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-purple-900 pt-1">
                                        {recommendedDocs.map((doc) => {
                                            const uploaded = isAppendixUploaded(doc.keyword);
                                            return (
                                                <div
                                                    key={doc.id}
                                                    onClick={() => {
                                                        if (!uploaded) setAppendixTitle(doc.title);
                                                    }}
                                                    title={uploaded ? 'อัปโหลดเรียบร้อยแล้ว' : 'คลิกเพื่อเลือกชื่อเอกสารนี้'}
                                                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                                                        uploaded
                                                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-2xs'
                                                            : 'bg-white border-purple-100 text-purple-900 hover:border-purple-300 hover:shadow-2xs'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                        <span>{doc.icon}</span>
                                                        <span className="font-bold truncate">{doc.id}. {doc.title}</span>
                                                    </div>
                                                    {uploaded ? (
                                                        <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                                                            ✓ อัปโหลดแล้ว
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full shrink-0">
                                                            ⏳ รออัปโหลด
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {(project.user_id === auth.user.id || auth.user.is_admin || auth.user.role?.name === 'admin' || auth.user.role === 'admin') && (
                                    <form onSubmit={handleUploadAppendix} className="space-y-4 border-b border-purple-100 pb-6">
                                        {/* Quick Title Selection Chips */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">เลือกชื่อเอกสารด่วน (Quick Preset Titles):</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {[
                                                    'กำหนดการโครงการ',
                                                    'คำสั่งแต่งตั้งปฏิบัติหน้าที่',
                                                    'คำกล่าวรายงานเปิดโครงการ',
                                                    'รายชื่อผู้เข้าร่วมโครงการและลงทะเบียน',
                                                    'หนังสือเชิญวิทยากร',
                                                    'สรุปผลการประเมินความพึงพอใจ',
                                                ].map((titleOption) => (
                                                    <button
                                                        key={titleOption}
                                                        type="button"
                                                        onClick={() => setAppendixTitle(titleOption)}
                                                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                                            appendixTitle === titleOption
                                                                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs scale-105'
                                                                : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-50'
                                                        }`}
                                                    >
                                                        + {titleOption}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700">ชื่อเอกสารแนบ *</label>
                                                <input 
                                                    type="text" 
                                                    value={appendixTitle} 
                                                    onChange={(e) => setAppendixTitle(e.target.value)} 
                                                    className="mt-1 block w-full rounded-xl border-purple-200 text-xs focus:ring-purple-500 focus:border-purple-500 bg-white"
                                                    placeholder="เช่น คำกล่าวรายงาน / กำหนดการโครงการ"
                                                    required 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700">เลือกไฟล์ PDF *</label>
                                                <input 
                                                    type="file" 
                                                    accept=".pdf" 
                                                    onChange={(e) => setAppendixFile(e.target.files[0])} 
                                                    className="mt-1 block w-full text-xs text-slate-500"
                                                    required 
                                                />
                                            </div>
                                            <button 
                                                type="submit" 
                                                disabled={uploading}
                                                className="w-full inline-flex justify-center items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 py-2.5 px-4 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
                                            >
                                                {uploading ? '⌛ กำลังอัปโหลด...' : '📤 อัปโหลดเอกสารแนบ'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                <div className="space-y-2">
                                    {(!project.appendices || project.appendices.length === 0) ? (
                                        <p className="text-xs text-slate-400">ยังไม่มีเอกสารแนบภาคผนวก</p>
                                    ) : (
                                        project.appendices.map((app) => (
                                            <div key={app.id} className="flex justify-between items-center p-3 bg-purple-50/40 rounded-xl border border-purple-100">
                                                <div>
                                                    <span className="font-bold text-sm text-purple-950">{app.title}</span>
                                                    <span className="block text-[10px] text-slate-500">PDF | {Math.round(app.file_size / 1024)} KB</span>
                                                </div>
                                                <div className="flex gap-x-2">
                                                    <button onClick={() => handleDeleteAppendix(app.id)} className="text-xs font-bold text-rose-600 hover:underline">ลบ</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
