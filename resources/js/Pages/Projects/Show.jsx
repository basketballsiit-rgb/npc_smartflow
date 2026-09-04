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

    const handleGenerateAiTor = () => {
        const validItems = procurementItems.filter(item => item.description && item.description.trim() !== '');
        
        // Filter out loan/activity allowance items (ค่าตอบแทน, ค่าอาหาร, ค่าเดินทาง ฯลฯ)
        const isLoanExpense = (desc) => /ค่าตอบแทน|วิทยากร|ค่าอาหาร|อาหารกลางวัน|อาหารว่าง|เครื่องดื่ม|เดินทาง|พาหนะ|ยานพาหนะ|เบี้ยเลี้ยง|ที่พัก|สมนาคุณ|ค่าจ้างเหมาบริการบุคคล|เงินยืม/ui.test(desc);
        const actualProcurementItems = validItems.filter(item => !isLoanExpense(item.description));
        const loanCount = validItems.length - actualProcurementItems.length;

        const deptName = project.department?.name || 'ฝ่ายวิชาการ / สาขาวิชาการ';
        const projectTitle = project.title || '';

        let aiDraftedTor = '';

        if (actualProcurementItems.length > 0) {
            // Case: มีรายการพัสดุ/ครุภัณฑ์/วัสดุจริง
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
วิทยาลัยสารพัดช่างน่าน แผนกวิชา ${deptName} มีความประสงค์จัดหาวัสดุอุปกรณ์และพัสดุ เพื่อนำไปใช้สนับสนุนการจัดกิจกรรมและกระบวนการเรียนการสอนของโครงการ "${projectTitle}" ให้บรรลุวัตถุประสงค์และเกิดประสิทธิภาพสูงสุด

2. คุณลักษณะเฉพาะและขอบเขตงาน
พัสดุและรายการวัสดุที่จัดหาต้องเป็นของแท้ ของใหม่ ไม่เคยผ่านการใช้งานมาก่อน มีคุณภาพและมาตรฐานตามเกณฑ์สายอาชีวศึกษา โดยประกอบด้วยรายการพัสดุจัดซื้อจัดจ้างจำนวน ${actualProcurementItems.length} รายการ ดังนี้:
${itemsListText}
และพัสดุทั้งหมดต้องมีคุณสมบัติ คุณลักษณะเฉพาะ และมาตรฐานทางวิชาการที่ถูกต้องครบถ้วน พร้อมใช้งานได้ทันที

3. ระยะเวลาการส่งมอบและเงื่อนไขการส่งมอบ
ผู้จำหน่ายหรือผู้รับจ้างจะต้องส่งมอบพัสดุทั้งหมด ณ วิทยาลัยสารพัดช่างน่าน ภายในกำหนดเวลา 7 วัน นับถัดจากวันที่ได้รับใบสั่งซื้อสั่งจ้างจากทางวิทยาลัย

4. การตรวจรับพัสดุ
การตรวจรับจะดำเนินการโดยคณะกรรมการตรวจรับพัสดุที่วิทยาลัยแต่งตั้งขึ้น โดยต้องตรวจรับพัสดุให้ถูกต้อง ครบถ้วน ตรงตามเอกสารประมาณการ รายละเอียดคุณลักษณะเฉพาะ และใบเสนอซื้อเสนอจ้างทุกประการ`;

            setTorSpecifications(aiDraftedTor);

            Swal.fire({
                title: '✨ AI ร่าง TOR สำเร็จ!',
                html: `คัดกรองเฉพาะรายการพัสดุจัดซื้อจัดจ้าง <b>${actualProcurementItems.length} รายการ</b> มาบรรจุใน TOR ให้เรียบร้อยแล้ว` + 
                      (loanCount > 0 ? `<br><span class="text-xs text-amber-700 font-semibold">(คัดแยกรายการเงินยืมราชการ ${loanCount} รายการ เช่น ค่าตอบแทน/ค่าอาหาร/ค่าเดินทาง ออกจาก TOR ให้แล้ว)</span>` : ''),
                icon: 'success',
                confirmButtonColor: '#7c3aed',
                timer: 3500
            });
        } else {
            // Case: ทุกรายการเป็นเงินยืมทดรองราชการ (ค่าตอบแทน, ค่าอาหาร, ค่าเดินทาง)
            aiDraftedTor = `1. วัตถุประสงค์
วิทยาลัยสารพัดช่างน่าน แผนกวิชา ${deptName} มีความประสงค์ดำเนินกิจกรรมและจัดการเรียนการสอนตามโครงการ "${projectTitle}" ให้บรรลุวัตถุประสงค์และเกิดประสิทธิภาพสูงสุด

2. คุณลักษณะเฉพาะและขอบเขตงาน
โครงการนี้ดำเนินการจัดกิจกรรมโดยใช้งบประมาณในลักษณะการยืมเงินทดรองราชการ (แบบ กค.๑๐๑) เพื่อเป็นค่าใช้จ่ายในการดำเนินงาน (ค่าตอบแทนวิทยากร ค่าอาหารกลางวัน อาหารว่างและเครื่องดื่ม และค่าใช้จ่ายในการเดินทาง) ทั้งหมด โดยไม่มีรายการพัสดุหรือครุภัณฑ์ที่ต้องจัดซื้อจัดจ้างตามขอบเขตงาน (TOR) เพิ่มเติม

3. ระยะเวลาการส่งมอบและเงื่อนไขการส่งมอบ
ผู้ยืมเงินหรือผู้รับผิดชอบโครงการจะต้องดำเนินกิจกรรมให้แล้วเสร็จ และส่งใช้เงินยืมทดรองราชการพร้อมหลักฐานใบสำคัญคู่จ่ายให้แก่งานการเงิน วิทยาลัยสารพัดช่างน่าน ภายในกำหนด 30 วัน นับถัดจากวันเสร็จสิ้นโครงการ

4. การตรวจรับพัสดุ
การตรวจรับและตรวจสอบเอกสารหลักฐานการจ่ายเงินจะดำเนินการโดยคณะกรรมการและงานการเงินของวิทยาลัย โดยต้องมีความถูกต้องครบถ้วนตามระเบียบของทางราชการทุกประการ`;

            setTorSpecifications(aiDraftedTor);

            Swal.fire({
                title: '💡 ตรวจพบรายการเงินยืมราชการ',
                html: `รายการในโครงการเป็น <b>ค่าตอบแทน/ค่าอาหาร/ค่าพาหนะเดินทาง (สัญญายืมเงิน กค.๑๐๑)</b><br>AI ได้ยกเว้นรายการเงินยืมออกจากบัญชีพัสดุ และปรับข้อกำหนด TOR สำหรับโครงการยืมเงินจัดกิจกรรมให้เรียบร้อยแล้ว`,
                icon: 'info',
                confirmButtonColor: '#7c3aed'
            });
        }
    };

    const allocatedBudget = parseFloat(project.budget?.allocated_amount || project.estimated_budget || 0);
    const totalProcurementSum = procurementItems.reduce((acc, item) => acc + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)), 0);
    const isOverBudget = totalProcurementSum > (allocatedBudget + 0.01);
    const budgetDifference = Math.abs(allocatedBudget - totalProcurementSum);
    const isPlanApproved = ['approved', 'in_progress', 'evaluating', 'completed'].includes(project.status) || project.current_approval_step >= 6;
    const isProcStaffOrAdmin = Boolean(auth.user.is_admin || auth.user.role?.name === 'admin' || auth.user.role === 'admin' || auth.user.role?.name === 'procurement_head' || auth.user.role === 'procurement_head' || (auth.user.department && (auth.user.department.name?.includes('พัสดุ') || auth.user.department.code === 'PROC')) || auth.user.position?.includes('พัสดุ'));
    const [savingProcurement, setSavingProcurement] = useState(false);
    const [isEditingProcurement, setIsEditingProcurement] = useState(!project.procurement?.id);

    const handleSaveProcurement = (e) => {
        if (e) e.preventDefault();
        if (savingProcurement) return;

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

        setSavingProcurement(true);

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
                setSavingProcurement(false);
                setIsEditingProcurement(false);
                Swal.fire('บันทึกสำเร็จ!', 'บันทึกข้อมูลข้อกำหนด TOR และคำสั่งพัสดุเรียบร้อยแล้ว (ล็อกการบันทึกซ้ำ)', 'success');
            },
            onError: () => {
                setSavingProcurement(false);
            },
            onFinish: () => {
                setSavingProcurement(false);
            }
        });
    };

    const handleReceiveProcurement = () => {
        Swal.fire({
            title: '📥 งานพัสดุลงรับชุดจัดซื้อจัดจ้าง',
            html: `
                <div class="text-left text-xs text-slate-600 space-y-2 font-sans">
                    <p><strong>โครงการ:</strong> ${project.title}</p>
                    <p><strong>ผู้เสนอ:</strong> ${project.user?.name || '-'}</p>
                    <div class="pt-2">
                        <label class="block font-bold text-slate-800 mb-1">เลขที่ลงรับพัสดุ (ถ้ามี):</label>
                        <input id="swal-proc-number" class="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm" placeholder="เช่น พด. 012/2569" value="${project.procurement?.procurement_number || ''}">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-800 mb-1">วันที่ลงรับ:</label>
                        <input id="swal-proc-date" type="date" class="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '📥 ยืนยันลงรับเรื่อง',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#7c3aed',
            preConfirm: () => {
                return {
                    procurement_number: document.getElementById('swal-proc-number').value,
                    memo_date: document.getElementById('swal-proc-date').value,
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('procurements.receive', project.id), result.value, {
                    onSuccess: () => {
                        Swal.fire('สำเร็จ', 'งานพัสดุลงรับชุดจัดซื้อจัดจ้างเรียบร้อยแล้ว', 'success');
                    }
                });
            }
        });
    };

    const handleRollbackProcurement = (targetStatus) => {
        const isToPending = targetStatus === 'pending';
        const titleText = isToPending 
            ? '↩️ ยกเลิกการลงรับ / ส่งคืนผู้เสนอโครงการแก้ไข' 
            : '↩️ ยกเลิกการส่งการเงิน / ดึงกลับให้งานพัสดุแก้ไข';
        const descText = isToPending
            ? `ต้องการยกเลิกการลงรับเรื่องจัดซื้อจัดจ้างของโครงการ "${project.title}" และส่งคืนให้ผู้เสนอโครงการสามารถแก้ไขรายการพัสดุใช่หรือไม่?`
            : `ต้องการดึงเรื่องจัดซื้อจัดจ้างของโครงการ "${project.title}" กลับมาจากงานการเงิน เพื่อให้งานพัสดุตรวจสอบหรือแก้ไขข้อมูลใช่หรือไม่?`;

        Swal.fire({
            title: titleText,
            html: `
                <div class="text-left text-xs text-slate-600 space-y-2 font-sans">
                    <p>${descText}</p>
                    <div class="pt-2">
                        <label class="block font-bold text-slate-800 mb-1">เหตุผลในการยกเลิก/ส่งคืน (ระบุหรือไม่ก็ได้):</label>
                        <textarea id="swal-rollback-reason-show" class="w-full rounded-xl border border-rose-200 focus:ring-rose-500 focus:border-rose-500 px-3 py-2 text-xs" rows="2" placeholder="เช่น รายการพัสดุไม่ถูกต้อง, ขอปรับปรุงราคา/จำนวน..."></textarea>
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
                    reason: document.getElementById('swal-rollback-reason-show')?.value || ''
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('procurements.rollback', project.id), result.value, {
                    onSuccess: () => {
                        setIsEditingProcurement(true);
                        Swal.fire('สำเร็จ', isToPending ? 'ส่งคืนให้ผู้เสนอโครงการแก้ไขเรียบร้อยแล้ว' : 'ดึงเรื่องกลับมาให้งานพัสดุแก้ไขเรียบร้อยแล้ว', 'success');
                    }
                });
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
            case 'approved': return 'อนุมัติโครงการแล้ว (Approved)';
            case 'in_progress': return 'กำลังดำเนินโครงการ (In Progress)';
            case 'evaluating': return 'ประเมินผลความพึงพอใจด้วย AI (Evaluating)';
            case 'reporting': return 'สรุปเล่มรายงานผล (Reporting)';
            case 'completed': return 'ปิดโครงการสมบูรณ์ (Completed)';
            case 'cleared': return 'เคลียร์เงินยืมและปิดโครงการสมบูรณ์ (Cleared)';
            case 'budget_approved': return 'จัดสรรงบประมาณแล้ว (Budget Allocated)';
            case 'rejected': return 'ไม่อนุมัติ (Rejected)';
            case 'draft': return 'แบบร่างโครงการ (Draft)';
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

    const getApprovalStepNameAndRole = (stepNumber) => {
        switch (parseInt(stepNumber)) {
            case 1:
                return {
                    title: 'ขั้นตอนที่ ๑: ผู้เสนอโครงการ (ยื่นขออนุมัติ)',
                    role: 'ผู้เสนอโครงการ / ครูผู้รับผิดชอบ',
                    icon: '📝',
                };
            case 2:
                return {
                    title: 'ขั้นตอนที่ ๒: หัวหน้างาน / หัวหน้าแผนกวิชา',
                    role: 'หัวหน้างาน / หัวหน้าสาขาวิชา',
                    icon: '👔',
                };
            case 3:
                return {
                    title: 'ขั้นตอนที่ ๓: งานวางแผนและงบประมาณ',
                    role: 'หัวหน้างานวางแผนและงบประมาณ',
                    icon: '📊',
                };
            case 4:
                return {
                    title: 'ขั้นตอนที่ ๔: รองผู้อำนวยการฝ่ายที่เกี่ยวข้อง',
                    role: 'รองผู้อำนวยการฝ่ายที่เกี่ยวข้อง',
                    icon: '🎖️',
                };
            case 5:
                return {
                    title: 'ขั้นตอนที่ ๕: รองผู้อำนวยการฝ่ายแผนงานและความร่วมมือ',
                    role: 'รองผู้อำนวยการฝ่ายแผนงานฯ',
                    icon: '📑',
                };
            case 6:
                return {
                    title: 'ขั้นตอนที่ ๖: ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน',
                    role: 'ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน',
                    icon: '🏛️',
                };
            default:
                return {
                    title: `ขั้นตอนที่ ${stepNumber}`,
                    role: 'ผู้เกี่ยวข้องตามลำดับ',
                    icon: '⏳',
                };
        }
    };

    const getApprovalStepOfficerInfo = (step, status, procurement) => {
        if (status === 'budget_approved') {
            return {
                title: '🟢 ได้รับจัดสรรงบประมาณแล้ว — อยู่ที่: ผู้เสนอโครงการ (จัดทำรายละเอียดโครงการฉบับเต็ม)',
                desc: 'โครงการผ่านความเห็นชอบจัดสรรงบประมาณจากงานแผนงานแล้ว กรุณากรอกรายละเอียดโครงการฉบับเต็มในแท็บที่ 1 และกด "🚀 ยื่นขออนุมัติโครงการ" เพื่อเริ่มกระบวนการเสนออนุมัติ 6 ขั้นตอน',
                color: 'bg-emerald-50 border-emerald-300 text-emerald-950',
                icon: '📝',
                roleName: 'ผู้เสนอโครงการ (ครู/ผู้รับผิดชอบ)'
            };
        }
        if (status === 'preliminary') {
            return {
                title: '⏳ เสนอโครงการเบื้องต้น — อยู่ที่: คณะกรรมการกลั่นกรองงบประมาณ & งานแผนงาน',
                desc: 'โครงการอยู่ระหว่างรอคณะกรรมการและงานแผนงานพิจารณากำหนดกรอบวงเงินงบประมาณและแหล่งเงินทุน',
                color: 'bg-amber-50 border-amber-300 text-amber-950',
                icon: '💡',
                roleName: 'คณะกรรมการพิจารณางบประมาณ'
            };
        }
        if (status === 'approved') {
            const procStatus = procurement?.status || 'pending';
            if (procStatus === 'forwarded_to_finance') {
                return {
                    title: '💰 อยู่ที่: งานการเงิน (พัสดุส่งเรื่องเบิกจ่ายแล้ว — รอการเงินตรวจสอบสัญญายืมเงิน/เบิกจ่าย)',
                    desc: 'งานพัสดุได้ส่งชุดเอกสารจัดซื้อจัดจ้าง/สัญญายืมเงิน (กค. ๑๐๑) ไปยังงานการเงินแล้ว อยู่ระหว่างงานการเงินดำเนินการตรวจสอบหลักฐานและเบิกจ่ายงบประมาณ',
                    color: 'bg-emerald-50 border-emerald-300 text-emerald-950',
                    icon: '💰',
                    roleName: 'เจ้าหน้าที่งานการเงิน'
                };
            }
            if (procStatus === 'received' || procStatus === 'processing') {
                return {
                    title: `📦 อยู่ที่: งานพัสดุ (ลงรับแล้ว เลขที่ ${procurement?.procurement_number || '-'} — กำลังจัดซื้อจัดจ้าง)`,
                    desc: 'เจ้าหน้าที่งานพัสดุได้ลงรับเรื่องแล้ว อยู่ระหว่างการจัดทำเอกสารขอซื้อขอจ้าง/ออกใบสั่งซื้อสั่งจ้าง เมื่อตรวจเรียบร้อยจะส่งต่อไปยังงานการเงิน',
                    color: 'bg-blue-50 border-blue-300 text-blue-950',
                    icon: '📦',
                    roleName: 'เจ้าหน้าที่งานพัสดุ'
                };
            }
            return {
                title: '📦 อยู่ที่: งานพัสดุ (โครงการอนุมัติแล้ว — รอเจ้าหน้าที่พัสดุลงรับชุดจัดซื้อจัดจ้าง)',
                desc: 'โครงการผ่านการลงนามอนุมัติสมบูรณ์แล้ว ผู้ดำเนินโครงการและงานพัสดุสามารถจัดทำเอกสารจัดซื้อจัดจ้าง 4 ฉบับและสัญญายืมเงินในแท็บที่ 2 เพื่อให้พัสดุลงรับเรื่อง',
                color: 'bg-amber-50 border-amber-300 text-amber-950',
                icon: '📥',
                roleName: 'เจ้าหน้าที่งานพัสดุ'
            };
        }
        if (status === 'in_progress' || status === 'evaluating') {
            return {
                title: '⭐ อยู่ที่: ผู้รับผิดชอบโครงการ (ดำเนินกิจกรรม & ประเมินผลความพึงพอใจด้วย AI)',
                desc: 'โครงการอยู่ระหว่างดำเนินกิจกรรมและเปิดให้ผู้เข้าร่วมทำแบบประเมินความพึงพอใจในแท็บที่ 3',
                color: 'bg-purple-50 border-purple-200 text-purple-900',
                icon: '📊',
                roleName: 'ผู้รับผิดชอบโครงการ'
            };
        }
        if (status === 'reporting') {
            return {
                title: '📄 อยู่ที่: ผู้รับผิดชอบโครงการ (จัดทำรูปภาพ & รายงานผลฉบับสมบูรณ์)',
                desc: 'โครงการอยู่ระหว่างสรุปรูปภาพผลงาน กิจกรรม และจัดทำเล่มรายงานผลโครงการรวมเล่ม PDF สมบูรณ์ในแท็บที่ 4',
                color: 'bg-blue-50 border-blue-200 text-blue-900',
                icon: '📄',
                roleName: 'ผู้รับผิดชอบโครงการ'
            };
        }
        if (status === 'completed' || status === 'cleared') {
            return {
                title: '🎉 สิ้นสุดโครงการสมบูรณ์ — อยู่ที่: งานการเงิน & งานวางแผน (เคลียร์เงินยืม/ปิดโครงการ)',
                desc: 'ส่งเอกสารหลักฐานเคลียร์เงินทดรองราชการและรายงานผลโครงการฉบับสมบูรณ์เสร็จสิ้นครบถ้วน',
                color: 'bg-teal-50 border-teal-200 text-teal-900',
                icon: '🎉',
                roleName: 'งานการเงิน & งานวางแผน'
            };
        }
        if (status === 'rejected') {
            return {
                title: '✕ โครงการถูกส่งกลับแก้ไข — อยู่ที่: ผู้เสนอโครงการ',
                desc: 'โครงการถูกส่งกลับให้ผู้เสนอแก้ไขตามข้อเสนอแนะ กรุณาปรับปรุงข้อมูลแล้วกดปุ่ม "🚀 ยื่นขออนุมัติเพื่อดำเนินงานต่อ"',
                color: 'bg-rose-50 border-rose-200 text-rose-900',
                icon: '⚠️',
                roleName: 'ผู้เสนอโครงการ'
            };
        }
        if (status === 'draft') {
            return {
                title: '📝 อยู่ที่: ผู้เสนอโครงการ (กำลังร่างข้อเสนอโครงการ)',
                desc: 'โครงการอยู่ระหว่างการกรอกข้อมูลโดยครูผู้เสนอ เมื่อพร้อมแล้วให้กดปุ่ม "🚀 ยื่นขออนุมัติโครงการ (ส่งต่อขั้นที่ 2)" เพื่อส่งให้หัวหน้างานพิจารณา',
                color: 'bg-slate-50 border-slate-200 text-slate-800',
                icon: '📝',
                roleName: 'ผู้เสนอโครงการ'
            };
        }

        switch (step) {
            case 2:
                return {
                    title: '👔 ขั้นตอนที่ ๒: อยู่ที่ "หัวหน้างาน / หัวหน้าแผนกวิชา" (รอตรวจสอบและลงนาม)',
                    desc: `ระบบส่งเรื่องไปยัง หัวหน้างาน / หัวหน้าแผนกวิชา (${project.department?.name || 'ต้นสังกัด'}) เพื่อตรวจสอบความถูกต้องและลงนามเห็นชอบ`,
                    color: 'bg-blue-50 border-blue-300 text-blue-950',
                    icon: '👔',
                    roleName: `หัวหน้า${project.department?.name || 'งาน/แผนกวิชา'}`
                };
            case 3:
                return {
                    title: '📊 ขั้นตอนที่ ๓: อยู่ที่ "งานวางแผนและงบประมาณ" (รอตรวจสอบแผน & ล็อคงบประมาณ)',
                    desc: 'ระบบส่งเรื่องไปยัง เจ้าหน้าที่/หัวหน้างานวางแผนและงบประมาณ เพื่อตรวจสอบความสอดคล้องยุทธศาสตร์และผูกจัดสรรงบประมาณ',
                    color: 'bg-cyan-50 border-cyan-300 text-cyan-950',
                    icon: '📊',
                    roleName: 'หัวหน้างานวางแผนและงบประมาณ'
                };
            case 4:
                return {
                    title: '🎖️ ขั้นตอนที่ ๔: อยู่ที่ "รองผู้อำนวยการฝ่ายที่เกี่ยวข้อง" (รอพิจารณากลั่นกรอง)',
                    desc: `ระบบส่งเรื่องไปยัง รองผู้อำนวยการฝ่ายที่เกี่ยวข้อง (${project.department?.division || 'ฝ่ายต้นสังกัด'}) เพื่อพิจารณากลั่นกรองตามสายงานบังคับบัญชา`,
                    color: 'bg-indigo-50 border-indigo-300 text-indigo-950',
                    icon: '🎖️',
                    roleName: 'รองผู้อำนวยการฝ่ายที่เกี่ยวข้อง'
                };
            case 5:
                return {
                    title: '📑 ขั้นตอนที่ ๕: อยู่ที่ "รองผู้อำนวยการฝ่ายแผนงานและความร่วมมือ" (รอพิจารณา)',
                    desc: 'ระบบส่งเรื่องไปยัง รองผู้อำนวยการฝ่ายแผนงานและความร่วมมือ เพื่อพิจารณาความพร้อมด้านแผนงานและงบประมาณภาพรวมของวิทยาลัย',
                    color: 'bg-violet-50 border-violet-300 text-violet-950',
                    icon: '📑',
                    roleName: 'รองผู้อำนวยการฝ่ายแผนงานและความร่วมมือ'
                };
            case 6:
                return {
                    title: '🏛️ ขั้นตอนที่ ๖: อยู่ที่ "ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน" (รอลงนามอนุมัติโครงการ)',
                    desc: 'ระบบส่งเรื่องไปยัง ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน เพื่อลงนามอนุมัติโครงการฉบับสมบูรณ์ (หลังจากอนุมัติแล้ว จะเปิดให้เริ่มกระบวนการจัดซื้อจัดจ้าง/ยืมเงิน ในแท็บที่ 2)',
                    color: 'bg-purple-50 border-purple-300 text-purple-950',
                    icon: '🏛️',
                    roleName: 'ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน'
                };
            default:
                return {
                    title: `⏳ ขั้นตอนที่ ${step}: อยู่ระหว่างรอพิจารณาอนุมัติ`,
                    desc: 'ระบบกำลังดำเนินการส่งต่อตามสายงานอนุมัติราชการ',
                    color: 'bg-purple-50 border-purple-200 text-purple-900',
                    icon: '⏳',
                    roleName: `ผู้มีอำนาจลงนามขั้นตอนที่ ${step}`
                };
        }
    };

    const currentOfficerInfo = getApprovalStepOfficerInfo(project.current_approval_step, project.status, project.procurement);

    const getDocumentTrackingDetails = () => {
        const proc = project.procurement;
        const status = project.status;
        const procStatus = proc?.status || 'pending';

        // 1. Loan Agreement Tracking (สัญญายืมเงิน แบบ กค. ๑๐๑)
        let loanInfo = {
            location: 'ผู้เสนอโครงการ',
            holder: project.user?.name || 'ครูผู้รับผิดชอบโครงการ',
            statusText: '📝 รอการอนุมัติโครงการ',
            badgeClass: 'bg-slate-100 text-slate-700 border border-slate-300',
            actionDesc: 'สัญญายืมเงินจะเริ่มเดินเรื่องและมีผลบังคับใช้เมื่อโครงการได้รับการลงนามอนุมัติครบ ๖ ขั้นตอน',
        };

        if (status === 'approved') {
            if (procStatus === 'forwarded_to_finance') {
                loanInfo = {
                    location: 'ห้องงานการเงิน (อาคารอำนวยการ ชั้น ๑)',
                    holder: 'เจ้าหน้าที่งานการเงิน / หัวหน้างานการเงิน',
                    statusText: '⏳ อยู่ที่งานการเงิน (ตรวจสัญญา & เสนอลงนามอนุมัติยืม)',
                    badgeClass: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-black animate-pulse shadow-xs',
                    actionDesc: 'งานการเงินกำลังตรวจสอบเอกสารสัญญา กค.๑๐๑ และนำเสนอผู้มีอำนาจลงนามอนุมัติจ่ายเงินยืมทดรองราชการ',
                };
            } else if (procStatus === 'received' || procStatus === 'processing') {
                loanInfo = {
                    location: 'ห้องงานพัสดุ (โต๊ะลงรับพัสดุ)',
                    holder: 'เจ้าหน้าที่งานพัสดุผู้รับผิดชอบ',
                    statusText: '📦 อยู่ที่งานพัสดุ (ตรวจรายการวัสดุ/แผนเงินยืม)',
                    badgeClass: 'bg-blue-100 text-blue-900 border border-blue-300 font-bold',
                    actionDesc: 'งานพัสดุลงรับเรื่องแล้ว กำลังตรวจความสอดคล้องของรายการขอยืมเงินให้ตรงตามแผน ก่อนส่งต่อชุดเอกสารให้งานการเงิน',
                };
            } else {
                loanInfo = {
                    location: 'ผู้เสนอโครงการ ➔ ห้องงานพัสดุ',
                    holder: `${project.user?.name || 'ผู้เสนอโครงการ'} / งานพัสดุ`,
                    statusText: '🟡 รอพัสดุลงรับพร้อมชุดจัดซื้อจัดจ้าง',
                    badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
                    actionDesc: 'โครงการอนุมัติแล้ว ผู้เสนอจัดทำสัญญา กค.๑๐๑ ตอนที่ ๑ นำส่งพร้อมชุดเอกสารจัดซื้อจัดจ้างที่ห้องงานพัสดุ',
                };
            }
        } else if (status === 'in_progress' || status === 'evaluating') {
            loanInfo = {
                location: `อยู่ที่ผู้ยืม (${project.user?.name || 'ผู้รับผิดชอบโครงการ'})`,
                holder: project.user?.name || 'ผู้รับผิดชอบโครงการ',
                statusText: '⭐ ได้รับเงินยืมแล้ว (กำลังดำเนินกิจกรรม)',
                badgeClass: 'bg-purple-100 text-purple-950 border border-purple-300 font-bold',
                actionDesc: 'ผู้ยืมได้รับเงินยืมทดรองราชการเรียบร้อยแล้ว กรุณาจัดเก็บใบเสร็จรับเงิน/ใบสำคัญรับเงินทุกรายการเพื่อเตรียมส่งล้างหนี้เงินยืมตามกำหนด',
            };
        } else if (status === 'reporting') {
            loanInfo = {
                location: `อยู่ที่ผู้ยืม (${project.user?.name || 'ผู้รับผิดชอบโครงการ'}) ➔ งานการเงิน`,
                holder: project.user?.name || 'ผู้รับผิดชอบโครงการ',
                statusText: '⏳ เตรียมส่งหลักฐานเคลียร์เงินยืม',
                badgeClass: 'bg-blue-100 text-blue-950 border border-blue-300 font-bold',
                actionDesc: 'อยู่ระหว่างรวบรวมหลักฐานใบเสร็จและจัดทำเล่มรายงานผลโครงการ เพื่อนำไปส่งเคลียร์เงินยืมที่งานการเงิน',
            };
        } else if (status === 'completed' || status === 'cleared') {
            loanInfo = {
                location: 'ห้องงานการเงิน (แฟ้มทะเบียนคุมสัญญายืมเงิน)',
                holder: 'เจ้าหน้าที่งานการเงิน',
                statusText: '✅ เคลียร์เงินยืมและปิดสัญญาสมบูรณ์',
                badgeClass: 'bg-teal-100 text-teal-900 border border-teal-300 font-black',
                actionDesc: 'ส่งหลักฐานใบเสร็จครบถ้วน งานการเงินออกใบรับใบสำคัญและบันทึกปลดหนี้สัญญาเงินยืม กค.๑๐๑ เสร็จสิ้นสมบูรณ์',
            };
        }

        // 2. Procurement Package Tracking (ชุดเอกสารจัดซื้อจัดจ้าง ๔ ฉบับ & PO)
        let procInfo = {
            location: 'ผู้เสนอโครงการ',
            holder: project.user?.name || 'ครูผู้รับผิดชอบโครงการ',
            statusText: '📝 รอการอนุมัติโครงการ',
            badgeClass: 'bg-slate-100 text-slate-700 border border-slate-300',
            actionDesc: 'เอกสารขอซื้อขอจ้าง ๔ ฉบับ จะเปิดให้ดำเนินการในแท็บที่ ๒ เมื่อโครงการได้รับการอนุมัติ',
        };

        if (status === 'approved') {
            if (procStatus === 'forwarded_to_finance') {
                procInfo = {
                    location: 'ห้องงานการเงิน (โต๊ะตั้งเบิกงบประมาณ)',
                    holder: 'เจ้าหน้าที่งานการเงิน',
                    statusText: '💰 ส่งงานการเงินแล้ว (รอเบิกจ่ายงบ)',
                    badgeClass: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
                    actionDesc: 'งานพัสดุได้ลงรับ ตรวจสอบเอกสาร ๔ ฉบับครบถ้วน และส่งมอบให้งานการเงินตั้งเบิกแล้ว',
                };
            } else if (procStatus === 'received' || procStatus === 'processing') {
                procInfo = {
                    location: 'ห้องงานพัสดุ (อาคารอำนวยการ)',
                    holder: 'เจ้าหน้าที่งานพัสดุ',
                    statusText: `📦 อยู่ที่งานพัสดุ (ลงรับแล้ว: ${proc?.procurement_number || '-'})`,
                    badgeClass: 'bg-blue-100 text-blue-900 border border-blue-400 font-bold',
                    actionDesc: 'เจ้าหน้าที่พัสดุกำลังจัดทำเอกสารขอซื้อขอจ้าง/ใบสั่งซื้อสั่งจ้าง (PO) เมื่อครบถ้วนจะกดส่งต่อให้งานการเงิน',
                };
            } else {
                procInfo = {
                    location: 'ห้องงานพัสดุ (เคาน์เตอร์ลงรับ)',
                    holder: 'เจ้าหน้าที่งานพัสดุ',
                    statusText: '🟡 รอพัสดุลงรับชุดจัดซื้อจัดจ้าง',
                    badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
                    actionDesc: 'โครงการอนุมัติแล้ว รอเจ้าหน้าที่งานพัสดุลงรับชุดเอกสารในระบบและออกเลขที่พัสดุ PR',
                };
            }
        } else if (['in_progress', 'evaluating', 'reporting', 'completed'].includes(status)) {
            procInfo = {
                location: 'ห้องงานพัสดุ & ห้องงานการเงิน',
                holder: 'งานพัสดุ / คณะกรรมการตรวจรับพัสดุ',
                statusText: '📦 จัดซื้อจัดจ้างแล้วเสร็จ (รอ/ตรวจรับครบ)',
                badgeClass: 'bg-teal-50 text-teal-900 border border-teal-300 font-bold',
                actionDesc: 'กระบวนการจัดซื้อจัดจ้างเสร็จสิ้นแล้ว คณะกรรมการดำเนินการตรวจรับพัสดุตามระเบียบ',
            };
        }

        return { loanInfo, procInfo };
    };


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
                        {(project.status === 'draft' || project.status === 'rejected' || project.status === 'budget_approved') && (project.user_id === auth.user.id || auth.user.is_admin || auth.user.role?.name === 'admin' || auth.user.role === 'admin') && (
                            <button
                                onClick={handleWorkflowSubmit}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                title="ยื่นขออนุมัติโครงการเพื่อเริ่มกระบวนการพิจารณา 6 ขั้นตอน"
                            >
                                🚀 ยื่นขออนุมัติโครงการ (ส่งต่อขั้นที่ 2)
                            </button>
                        )}
                        {(auth.user.is_admin || auth.user.role?.name === 'admin' || auth.user.role === 'admin' || project.status === 'draft' || project.status === 'budget_approved' || project.status === 'rejected') && (
                            <Link
                                href={route('projects.edit', project.id)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-3.5 py-2 text-xs font-bold text-purple-950 shadow-md shadow-amber-400/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                                title="แก้ไขรายละเอียดโครงการฉบับเต็ม"
                            >
                                ✏️ จัดทำ/แก้ไขโครงการ
                            </Link>
                        )}
                        {(auth.user.is_admin || auth.user.role?.name === 'admin' || auth.user.role === 'admin' || project.status === 'draft' || project.status === 'preliminary') && (
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
                            <span className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black shadow-xs ${
                                project.status === 'approved' ? (
                                    project.procurement?.status === 'forwarded_to_finance' 
                                        ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 ring-2 ring-emerald-400/30'
                                        : project.procurement?.status === 'received'
                                        ? 'bg-blue-100 text-blue-950 border border-blue-300'
                                        : 'bg-amber-100 text-amber-950 border border-amber-300'
                                ) :
                                project.status === 'in_progress' ? 'bg-purple-100 text-purple-950 border border-purple-300 ring-2 ring-purple-400/20' :
                                project.status === 'evaluating' ? 'bg-indigo-100 text-indigo-950 border border-indigo-300 ring-2 ring-indigo-400/20' :
                                project.status === 'reporting' ? 'bg-blue-100 text-blue-950 border border-blue-300 ring-2 ring-blue-400/20' :
                                (project.status === 'completed' || project.status === 'cleared') ? 'bg-teal-100 text-teal-950 border border-teal-300 ring-2 ring-teal-400/20' :
                                project.status === 'draft' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                                project.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                'bg-amber-50 text-amber-900 border border-amber-300 ring-2 ring-amber-400/20'
                            }`}>
                                <span>{currentOfficerInfo.icon}</span>
                                <span>
                                    {project.status === 'approved' 
                                        ? (project.procurement?.status === 'forwarded_to_finance'
                                            ? 'สถานะ: อยู่ที่งานการเงิน (ส่งเรื่องเบิกจ่ายแล้ว)'
                                            : project.procurement?.status === 'received'
                                            ? `สถานะ: อยู่ที่งานพัสดุ (ลงรับแล้ว เลขที่ ${project.procurement.procurement_number || '-'})`
                                            : 'สถานะ: อยู่ที่งานพัสดุ (รอลงรับเรื่อง)')
                                        : (project.status === 'submitted' || project.status === 'pending_approval')
                                        ? `สถานะ: อยู่ที่ ${currentOfficerInfo.roleName} (ขั้นตอนที่ ${project.current_approval_step || 2}/6)`
                                        : project.status === 'in_progress'
                                        ? 'สถานะ: ดำเนินกิจกรรม & ใช้จ่ายเงินยืม (In Progress)'
                                        : project.status === 'evaluating'
                                        ? 'สถานะ: ประเมินผลความพึงพอใจด้วย AI (Evaluating)'
                                        : project.status === 'reporting'
                                        ? 'สถานะ: สรุปเล่มรายงานผลโครงการ (Reporting)'
                                        : (project.status === 'completed' || project.status === 'cleared')
                                        ? 'สถานะ: เคลียร์เงินยืมและปิดโครงการสมบูรณ์ (Completed)'
                                        : `สถานะ: ${getStatusBadgeText(project.status)}`
                                    }
                                </span>
                            </span>
                            {(project.status === 'draft' || project.status === 'rejected' || project.status === 'budget_approved') && (project.user_id === auth.user.id || auth.user.is_admin || auth.user.role?.name === 'admin' || auth.user.role === 'admin') && (
                                <button
                                    onClick={handleWorkflowSubmit}
                                    className="rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:scale-105 shadow-md shadow-emerald-600/25 transition-all whitespace-nowrap"
                                >
                                    🚀 ยื่นขออนุมัติโครงการ (ส่งต่อขั้นที่ 2)
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

                    {/* แสดงการแจ้งเตือนไปจัดซื้อจัดจ้าง เฉพาะเมื่อเพิ่งอนุมัติโครงการ และยังไม่ได้ส่งต่อการเงิน/ยังไม่เริ่มดำเนินงาน */}
                    {project.status === 'approved' && project.procurement?.status !== 'forwarded_to_finance' && project.procurement?.status !== 'completed' && (
                        <div className="mb-6 p-4 rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm font-sans">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl animate-bounce">📦</span>
                                <div>
                                    <h4 className="text-sm font-extrabold text-emerald-950">
                                        โครงการได้รับการอนุมัติแล้ว: พร้อมเข้าสู่กระบวนการจัดซื้อจัดจ้าง & ดำเนินการ (Do Phase)
                                    </h4>
                                    <p className="text-xs text-emerald-900 mt-0.5">
                                        ผู้เสนอโครงการและงานพัสดุสามารถจัดทำเอกสารจัดซื้อจัดจ้าง ๔ ฉบับ ทำสัญญายืมเงิน และออกคำสั่งแต่งตั้งกรรมการใน แท็บที่ ๒ ได้ทันที
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveTab('do')}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-black text-white shadow-md hover:scale-105 transition-all whitespace-nowrap shrink-0"
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
                            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                activeTab === 'do'
                                    ? 'border-purple-600 text-purple-900 bg-purple-50/40'
                                    : 'border-transparent text-slate-500 hover:text-purple-700'
                            }`}
                        >
                            <span>🛠️ แท็บที่ 2: การจัดซื้อจัดจ้าง & ดำเนินงาน (Do)</span>
                            {!isPlanApproved && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">🔒 รออนุมัติ</span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('check')}
                            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                activeTab === 'check'
                                    ? 'border-purple-600 text-purple-900 bg-purple-50/40'
                                    : 'border-transparent text-slate-500 hover:text-purple-700'
                            }`}
                        >
                            <span>📊 แท็บที่ 3: แบบสำรวจ & ประเมินผล (Check)</span>
                            {!isPlanApproved && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">🔒 รออนุมัติ</span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('act')}
                            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                activeTab === 'act'
                                    ? 'border-purple-600 text-purple-900 bg-purple-50/40'
                                    : 'border-transparent text-slate-500 hover:text-purple-700'
                            }`}
                        >
                            <span>🤖 แท็บที่ 4: รายงาน AI & ภาคผนวก (Act)</span>
                            {!isPlanApproved && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">🔒 รออนุมัติ</span>
                            )}
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

                                {/* Approval Workflow & Sign-off History Card */}
                                <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center border-b border-purple-100 pb-3">
                                        <h3 className="text-base font-black text-purple-950 flex items-center gap-1.5">
                                            <span>📜</span> ลำดับขั้นตอน & ประวัติการลงนาม
                                        </h3>
                                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                                            {isPlanApproved ? 'อนุมัติโครงการแล้ว' : `ขั้นที่ ${project.current_approval_step || 1} จาก 6`}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Completed approval logs */}
                                        {project.approvals && project.approvals.length > 0 ? (
                                            project.approvals
                                                .filter((log, index, self) => 
                                                    index === self.findIndex((t) => (
                                                        t.step_number === log.step_number && 
                                                        t.status === log.status && 
                                                        t.comments === log.comments
                                                    ))
                                                )
                                                .map((log) => {
                                                const isStep1Submission = log.step_number === 1 || 
                                                                          log.status === 'submitted' || 
                                                                          log.comments?.includes('ยื่นขออนุมัติ') || 
                                                                          log.comments?.includes('ยื่นเสนอ');
                                                const isApproved = log.status === 'approved' && !isStep1Submission;
                                                const isRejected = log.status === 'rejected';
                                                const isBudgetCommittee = log.step_number === 0 || 
                                                                          log.comments?.includes('มติคณะกรรมการ') || 
                                                                          log.comments?.includes('จัดสรรงบ') || 
                                                                          log.comments?.includes('Direct Allocation');
                                                const isProposalInitial = log.comments?.includes('เบื้องต้น') || 
                                                                          log.comments?.includes('Preliminary');

                                                const stepInfo = isProposalInitial ? {
                                                    title: 'เสนอโครงการเบื้องต้น',
                                                    role: 'ผู้เสนอโครงการ',
                                                    icon: '💡'
                                                } : isBudgetCommittee ? {
                                                    title: 'มติคณะกรรมการจัดสรรงบประมาณ',
                                                    role: 'คณะกรรมการจัดสรรงบฯ',
                                                    icon: '⚖️'
                                                } : getApprovalStepNameAndRole(log.step_number);

                                                return (
                                                    <div key={log.id} className="border-l-4 border-purple-500 pl-3 py-2 space-y-1 bg-purple-50/40 rounded-r-xl pr-2 border-slate-100">
                                                        <div className="flex justify-between items-start text-xs font-bold gap-2">
                                                            <span className="text-purple-950 flex items-center gap-1">
                                                                <span>{stepInfo.icon}</span>
                                                                <span>{stepInfo.title}</span>
                                                            </span>
                                                            <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${isApproved ? 'bg-emerald-100 text-emerald-800' : isRejected ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800'}`}>
                                                                {isApproved ? '✅ อนุมัติแล้ว' : isRejected ? '❌ ตีกลับแก้ไข' : '📝 ยื่นขออนุมัติ'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs text-slate-600">
                                                            <span className="text-slate-700">
                                                                <span className="font-semibold text-slate-900">ผู้ลงนาม:</span> {log.user?.name || '-'} {log.user?.position ? `(${log.user.position})` : ''}
                                                            </span>
                                                            {log.created_at && (
                                                                <span className="text-[11px] font-medium text-purple-700 shrink-0 ml-2">
                                                                    {new Date(log.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {log.comments && log.comments !== '-' && log.comments !== 'Approved' && (
                                                            <div className="text-[11px] text-slate-600 bg-white/90 p-1.5 rounded-lg border border-purple-100 mt-1">
                                                                💬 <strong>บันทึกความเห็น:</strong> {log.comments}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-xs text-slate-400">ยังไม่มีประวัติการพิจารณาอนุมัติ</p>
                                        )}

                                        {/* Current Pending Step in Workflow */}
                                        {(project.status === 'submitted' || project.status === 'pending_approval') && (
                                            <div className="border-l-4 border-amber-500 pl-3 py-2 space-y-1 bg-amber-50/70 rounded-r-xl pr-2 shadow-2xs animate-pulse">
                                                <div className="flex justify-between items-center text-xs font-bold">
                                                    <span className="text-amber-950 flex items-center gap-1.5">
                                                        <span>{getApprovalStepNameAndRole(project.current_approval_step || 2).icon}</span>
                                                        <span>{getApprovalStepNameAndRole(project.current_approval_step || 2).title}</span>
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 text-[10px] font-black">
                                                        ⏳ อยู่ระหว่างรอลงนาม
                                                    </span>
                                                </div>
                                                <div className="text-xs text-amber-900">
                                                    อยู่ที่: <strong>{getApprovalStepOfficerInfo(project.current_approval_step, project.status, project.procurement).roleName}</strong>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Procurement (Do) */}
                    {activeTab === 'do' && (
                        !isPlanApproved ? (
                            <div className="rounded-3xl border border-amber-200 bg-white p-8 sm:p-12 text-center space-y-5 font-sans shadow-sm">
                                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner border border-amber-200">
                                    🔒
                                </div>
                                <div className="space-y-2 max-w-lg mx-auto">
                                    <h3 className="text-xl font-bold text-slate-800">
                                        แท็บที่ ๒ ยังไม่เปิดให้ดำเนินการจัดซื้อจัดจ้าง (Do Phase)
                                    </h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        ตามระเบียบพัสดุและการเงินภาครัฐ โครงการจะต้องผ่านการพิจารณาอนุมัติตามสายงาน ๖ ขั้นตอนใน <strong>แท็บที่ ๑ (Plan)</strong> จนกระทั่งได้รับสถานะ <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg inline-block">✅ อนุมัติแล้ว</span> ก่อน จึงจะสามารถบันทึกข้อมูลพัสดุ ออกคำสั่งแต่งตั้งกรรมการ และพิมพ์เอกสารจัดซื้อจัดจ้าง ๔ ฉบับได้ครับ
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <button
                                        onClick={() => setActiveTab('plan')}
                                        className="px-6 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
                                    >
                                        ← กลับไปตรวจสอบและดำเนินการใน แท็บที่ ๑ (Plan)
                                    </button>
                                </div>
                            </div>
                        ) : (
                        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm space-y-6 font-sans">

                            {/* Procurement Intake & Status Box */}
                            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/5 via-indigo-900/10 to-purple-900/5 border border-purple-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold uppercase text-purple-950">📦 สถานะงานพัสดุ:</span>
                                        {project.procurement?.status === 'forwarded_to_finance' ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                <span>🟢</span> ตั้งเบิกส่งงานการเงินแล้ว
                                            </span>
                                        ) : project.procurement?.status === 'received' ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                                                <span>🔵</span> พัสดุลงรับเรื่องแล้ว {project.procurement.procurement_number ? `(${project.procurement.procurement_number})` : ''}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                                <span>🟡</span> รอพัสดุลงรับเรื่อง
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-600">
                                        {project.procurement?.status === 'forwarded_to_finance'
                                            ? 'งานพัสดุได้ดำเนินการจัดซื้อจัดจ้างและส่งเรื่องไปยังงานการเงินเพื่อดำเนินการเบิกจ่ายเรียบร้อยแล้ว'
                                            : project.procurement?.status === 'received'
                                            ? `งานพัสดุได้ลงรับชุดจัดซื้อจัดจ้างแล้ว เมื่อ ${project.procurement.memo_date ? new Date(project.procurement.memo_date).toLocaleDateString('th-TH') : 'วันนี้'} อยู่ระหว่างดำเนินการตั้งเบิก`
                                            : 'เมื่อผู้เสนอโครงการบันทึกข้อมูลพัสดุครบถ้วน เจ้าหน้าที่งานพัสดุสามารถกดลงรับชุดจัดซื้อจัดจ้างเพื่อดำเนินการต่อไป'}
                                    </p>
                                </div>

                                {/* Buttons for Procurement Staff / Admin */}
                                {(auth.user.is_admin || auth.user.role?.name === 'admin' || auth.user.role === 'admin' || auth.user.role?.name === 'procurement_head' || auth.user.role === 'procurement_head' || auth.user.position?.includes('พัสดุ')) && (
                                    <div className="flex flex-wrap gap-2 shrink-0">
                                        {project.procurement?.status !== 'received' && project.procurement?.status !== 'forwarded_to_finance' && (
                                            <button
                                                type="button"
                                                onClick={handleReceiveProcurement}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow transition active:scale-95 cursor-pointer"
                                            >
                                                <span>📥</span> พัสดุกดลงรับชุดจัดซื้อจัดจ้าง
                                            </button>
                                        )}
                                        {project.procurement?.status === 'received' && (
                                            <button
                                                type="button"
                                                onClick={handleForwardToFinance}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow transition active:scale-95 cursor-pointer"
                                            >
                                                <span>📤</span> ตั้งเบิกส่งงานการเงิน ➔
                                            </button>
                                        )}
                                        {project.procurement?.status === 'forwarded_to_finance' && (
                                            <button
                                                type="button"
                                                onClick={() => handleRollbackProcurement('received')}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs rounded-xl shadow-2xs hover:scale-105 active:scale-95 transition cursor-pointer"
                                                title="ยกเลิกการส่งการเงิน และดึงเรื่องกลับมาให้งานพัสดุแก้ไข (Admin/พัสดุ)"
                                            >
                                                <span>↩️</span> ยกเลิกส่งการเงิน (ดึงกลับให้พัสดุ)
                                            </button>
                                        )}
                                        {project.procurement?.status === 'received' && (
                                            <button
                                                type="button"
                                                onClick={() => handleRollbackProcurement('pending')}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs rounded-xl shadow-2xs hover:scale-105 active:scale-95 transition cursor-pointer"
                                                title="ยกเลิกการลงรับ และส่งคืนให้ผู้เสนอโครงการแก้ไขรายการพัสดุ"
                                            >
                                                <span>↩️</span> ยกเลิกการลงรับ (ส่งคืนผู้เสนอ)
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-purple-100 pb-4">
                                <div>
                                    <h3 className="text-lg font-black text-purple-950">🛠️ การจัดซื้อจัดจ้าง และคำสั่งแต่งตั้งกรรมการ (Do Phase)</h3>
                                    <p className="text-xs text-slate-600 mt-0.5">ระบุรายการวัสดุอุปกรณ์ แต่งตั้งคณะกรรมการพัสดุ และพิมพ์เอกสารจัดซื้อจัดจ้าง 4 ฉบับตามระเบียบ</p>
                                </div>
                                {project.procurement?.id && !isEditingProcurement ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-black shadow-2xs select-none">
                                            <span className="text-sm">🔒</span>
                                            <span>บันทึกส่งงานพัสดุแล้ว (ดูอย่างเดียว)</span>
                                        </div>
                                        {/* Only Procurement staff or Admin can unlock to edit after submission */}
                                        {isProcStaffOrAdmin && (
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingProcurement(true)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                                title="ปลดล็อคแก้ไขข้อมูลพัสดุ (เฉพาะเจ้าหน้าที่พัสดุและแอดมิน)"
                                            >
                                                <span>✏️</span>
                                                <span>แก้ไขข้อมูล (เฉพาะงานพัสดุ)</span>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-2">
                                        {project.procurement?.id && (
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingProcurement(false)}
                                                className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                            >
                                                ยกเลิกการแก้ไข
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={savingProcurement || isOverBudget}
                                            onClick={handleSaveProcurement}
                                            className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all whitespace-nowrap flex items-center gap-2 ${
                                                savingProcurement || isOverBudget
                                                    ? 'bg-purple-400 cursor-not-allowed opacity-75'
                                                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 shadow-purple-600/25 hover:scale-105 active:scale-95 cursor-pointer'
                                            }`}
                                        >
                                            {savingProcurement ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>กำลังบันทึกข้อมูล...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>💾</span>
                                                    <span>บันทึกข้อมูล & ออกคำสั่งพัสดุ</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                                    <span className="text-xs font-bold uppercase text-purple-800">แหล่งเงินงบประมาณ</span>
                                    <p className="text-base font-black text-purple-950 mt-1">{project.budget?.fundingSource?.name || 'ยังไม่ระบุแหล่งเงินทุน'}</p>
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

                            {/* Section 1: Procurement Items Table (Read-Only when submitted) */}
                            <div className="border border-purple-100 rounded-2xl p-5 bg-purple-50/20 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-extrabold text-purple-950">📦 รายการวัสดุอุปกรณ์ที่จะจัดซื้อจัดจ้าง (Procurement Items)</h4>
                                        {!isEditingProcurement && (
                                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                                🔒 ดูอย่างเดียว
                                            </span>
                                        )}
                                    </div>
                                    {isEditingProcurement && (
                                        <button
                                            type="button"
                                            onClick={() => setProcurementItems([...procurementItems, { description: '', quantity: 1, unit: 'รายการ', unit_price: 0 }])}
                                            className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-white px-3 py-1.5 rounded-lg border border-purple-200 shadow-2xs hover:bg-purple-50"
                                        >
                                            + เพิ่มรายการวัสดุ
                                        </button>
                                    )}
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse bg-white rounded-xl overflow-hidden border border-purple-100">
                                        <thead>
                                            <tr className="bg-purple-100/60 text-purple-950 text-xs font-bold uppercase">
                                                <th className="p-3 w-12 text-center">ลำดับ</th>
                                                <th className="p-3">รายการวัสดุ / อุปกรณ์</th>
                                                <th className="p-3 w-20 text-center">จำนวน</th>
                                                <th className="p-3 w-24 text-center">หน่วยนับ</th>
                                                <th className="p-3 w-32 text-right">ราคาต่อหน่วย</th>
                                                <th className="p-3 w-32 text-right">รวมเป็นเงิน</th>
                                                {isEditingProcurement && <th className="p-3 w-12 text-center"></th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-purple-100 text-xs">
                                            {procurementItems.map((item, idx) => {
                                                const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
                                                return (
                                                    <tr key={idx} className="hover:bg-purple-50/30">
                                                        <td className="p-3 font-bold text-slate-700 text-center">{idx + 1}</td>
                                                        <td className="p-3">
                                                            {isEditingProcurement ? (
                                                                <input
                                                                    type="text"
                                                                    value={item.description}
                                                                    onChange={(e) => {
                                                                        const updated = [...procurementItems];
                                                                        updated[idx].description = e.target.value;
                                                                        setProcurementItems(updated);
                                                                    }}
                                                                    placeholder="ชื่อรายการพัสดุ / รายละเอียดคุณลักษณะ..."
                                                                    className="w-full rounded-lg border-purple-200 text-xs focus:ring-purple-500 focus:border-purple-500"
                                                                />
                                                            ) : (
                                                                <span className="font-bold text-slate-900">{item.description || '-'}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            {isEditingProcurement ? (
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
                                                            ) : (
                                                                <span className="font-extrabold text-slate-800">{item.quantity}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            {isEditingProcurement ? (
                                                                <input
                                                                    type="text"
                                                                    value={item.unit}
                                                                    onChange={(e) => {
                                                                        const updated = [...procurementItems];
                                                                        updated[idx].unit = e.target.value;
                                                                        setProcurementItems(updated);
                                                                    }}
                                                                    placeholder="หน่วย เช่น ชุด/เครื่อง"
                                                                    className="w-full rounded-lg border-purple-200 text-xs text-center focus:ring-purple-500 focus:border-purple-500"
                                                                />
                                                            ) : (
                                                                <span className="text-slate-600 font-medium">{item.unit || '-'}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            {isEditingProcurement ? (
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
                                                            ) : (
                                                                <span className="font-bold text-emerald-700">{formatCurrency(item.unit_price)}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-right font-black text-purple-950">
                                                            {formatCurrency(itemTotal)}
                                                        </td>
                                                        {isEditingProcurement && (
                                                            <td className="p-2 text-center">
                                                                {procurementItems.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setProcurementItems(procurementItems.filter((_, i) => i !== idx))}
                                                                        className="text-rose-600 hover:text-rose-800 font-bold text-sm cursor-pointer"
                                                                        title="ลบรายการนี้"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                )}
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-purple-50/60 font-bold text-xs border-t-2 border-purple-200">
                                            <tr>
                                                <td colSpan={isEditingProcurement ? 5 : 4} className="p-3 text-right text-purple-950 font-black">
                                                    รวมงบประมาณจัดซื้อจัดจ้างทั้งสิ้น:
                                                </td>
                                                <td className={`p-3 text-right font-black text-sm ${isOverBudget ? 'text-rose-600' : 'text-purple-950'}`}>
                                                    {formatCurrency(totalProcurementSum)}
                                                </td>
                                                {isEditingProcurement && <td></td>}
                                            </tr>
                                            {isOverBudget && (
                                                <tr className="bg-rose-100/70 text-rose-950">
                                                    <td colSpan={isEditingProcurement ? 7 : 6} className="p-2.5 text-center text-xs font-black">
                                                        ⚠️ ยอดจัดซื้อเกินงบประมาณที่ได้รับจัดสรร ({formatCurrency(allocatedBudget)}) อยู่ {formatCurrency(budgetDifference)} - กรุณาปรับลดจำนวนหรือราคาลงให้พอดี
                                                    </td>
                                                </tr>
                                            )}
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Section 2: Committee Appointment Form (Visible ONLY to Procurement Staff & Admin) */}
                            {isProcStaffOrAdmin && (
                            <div className="border border-purple-100 rounded-2xl p-5 bg-purple-50/20 space-y-4">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-extrabold text-purple-950">👥 แต่งตั้งคณะกรรมการจัดซื้อจัดจ้าง และตรวจรับพัสดุ (Committees)</h4>
                                    {!isEditingProcurement && (
                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                            🔒 ดูอย่างเดียว
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Purchasing Committee */}
                                    <div className="bg-white p-4 rounded-xl border border-purple-100 space-y-3">
                                        <h5 className="text-xs font-bold text-purple-900 border-b border-purple-100 pb-1.5 flex items-center gap-1.5">
                                            <span>📋</span> 1. คณะกรรมการจัดซื้อ/จัดจ้าง
                                        </h5>
                                        {isEditingProcurement ? (
                                            <>
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
                                            </>
                                        ) : (
                                            <div className="space-y-2 text-xs">
                                                <div className="p-2 bg-purple-50/40 rounded-lg flex items-center justify-between">
                                                    <span className="text-slate-500">ประธานกรรมการ:</span>
                                                    <span className="font-extrabold text-purple-950">{allUsers.find(u => String(u.id) === String(purchasingChair))?.name || 'ไม่ระบุ'}</span>
                                                </div>
                                                <div className="p-2 bg-purple-50/40 rounded-lg flex items-center justify-between">
                                                    <span className="text-slate-500">กรรมการ (คนที่ 1):</span>
                                                    <span className="font-bold text-slate-800">{allUsers.find(u => String(u.id) === String(purchasingMember1))?.name || 'ไม่ระบุ'}</span>
                                                </div>
                                                <div className="p-2 bg-purple-50/40 rounded-lg flex items-center justify-between">
                                                    <span className="text-slate-500">กรรมการ (คนที่ 2):</span>
                                                    <span className="font-bold text-slate-800">{allUsers.find(u => String(u.id) === String(purchasingMember2))?.name || 'ไม่ระบุ'}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Inspection Committee */}
                                    <div className="bg-white p-4 rounded-xl border border-purple-100 space-y-3">
                                        <h5 className="text-xs font-bold text-emerald-900 border-b border-purple-100 pb-1.5 flex items-center gap-1.5">
                                            <span>🔍</span> 2. คณะกรรมการตรวจรับพัสดุ
                                        </h5>
                                        {isEditingProcurement ? (
                                            <>
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
                                            </>
                                        ) : (
                                            <div className="space-y-2 text-xs">
                                                <div className="p-2 bg-emerald-50/40 rounded-lg flex items-center justify-between">
                                                    <span className="text-slate-500">ประธานกรรมการ:</span>
                                                    <span className="font-extrabold text-emerald-950">{allUsers.find(u => String(u.id) === String(inspectionChair))?.name || 'ไม่ระบุ'}</span>
                                                </div>
                                                <div className="p-2 bg-emerald-50/40 rounded-lg flex items-center justify-between">
                                                    <span className="text-slate-500">กรรมการ (คนที่ 1):</span>
                                                    <span className="font-bold text-slate-800">{allUsers.find(u => String(u.id) === String(inspectionMember1))?.name || 'ไม่ระบุ'}</span>
                                                </div>
                                                <div className="p-2 bg-emerald-50/40 rounded-lg flex items-center justify-between">
                                                    <span className="text-slate-500">กรรมการ (คนที่ 2):</span>
                                                    <span className="font-bold text-slate-800">{allUsers.find(u => String(u.id) === String(inspectionMember2))?.name || 'ไม่ระบุ'}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            )}

                            {/* Section 3: TOR Specifications Text Editor */}
                            <div className="border border-purple-100 rounded-2xl p-5 bg-purple-50/20 space-y-3 font-sans">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <h4 className="text-sm font-extrabold text-purple-950 flex items-center gap-1.5">
                                        <span>📝</span> รายละเอียดข้อกำหนดขอบเขตงาน (TOR Specification Text)
                                    </h4>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={handleGenerateAiTor}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                            title="ให้ AI ดึงรายการจัดซื้อจัดจ้างด้านบนมาช่วยร่างข้อกำหนด TOR ให้ทันที"
                                        >
                                            <span className="text-amber-300">✨</span>
                                            <span>AI ช่วยร่าง TOR จากรายการพัสดุ</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTorSpecifications(defaultTorText)}
                                            className="text-[11px] font-bold text-purple-700 hover:underline px-2 py-1 rounded-lg hover:bg-purple-100/50 transition-colors"
                                        >
                                            🔄 รีเซ็ตเป็นค่าเริ่มต้น
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600">
                                    ผู้ดำเนินโครงการหรือเจ้าหน้าที่พัสดุสามารถกดปุ่ม <b className="text-purple-700">"✨ AI ช่วยร่าง TOR จากรายการพัสดุ"</b> เพื่อดึงรายการสิ่งของและจำนวนที่ระบุไว้ด้านบนมาใส่ในข้อกำหนดขอบเขตงาน (ข้อ 2) ให้อัตโนมัติ หรือแก้ไขข้อความได้ตามต้องการ
                                </p>
                                <textarea
                                    rows={10}
                                    value={torSpecifications}
                                    onChange={(e) => setTorSpecifications(e.target.value)}
                                    className="w-full rounded-xl border-purple-200 text-xs leading-relaxed focus:ring-purple-500 focus:border-purple-500 bg-white shadow-inner"
                                    placeholder="ระบุข้อกำหนดขอบเขตงาน (TOR Specifications)..."
                                ></textarea>
                            </div>

                            {/* Section 4: Dynamic Procurement & Loan Documents Download Cards */}
                            <div className="border-t border-purple-100 pt-4">
                                <h4 className="text-sm font-black text-purple-950 mb-3">📄 เอกสารจัดซื้อจัดจ้าง & สัญญายืมเงินราชการ (พิมพ์/สร้างอัตโนมัติ)</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    <a href={route('procurements.download_document', [project.id, 'loan_contract'])} target="_blank" className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-xl text-center shadow-2xs hover:shadow-md hover:scale-105 transition-all">
                                        <div className="text-lg mb-1">💵</div>
                                        <div className="text-xs font-bold text-amber-950">สัญญายืมเงิน</div>
                                        <div className="text-[10px] text-amber-700 font-medium">แบบ กค. ๑๐๑</div>
                                    </a>
                                    <a href={route('procurements.download_document', [project.id, 'memo'])} target="_blank" className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl text-center shadow-2xs hover:shadow-md hover:scale-105 transition-all">
                                        <div className="text-lg mb-1">📄</div>
                                        <div className="text-xs font-bold text-purple-900">1. บันทึกข้อความ</div>
                                        <div className="text-[10px] text-purple-600">ขออนุมัติจัดซื้อจัดจ้าง</div>
                                    </a>
                                    <a href={route('procurements.download_document', [project.id, 'request_form'])} target="_blank" className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl text-center shadow-2xs hover:shadow-md hover:scale-105 transition-all">
                                        <div className="text-lg mb-1">🛒</div>
                                        <div className="text-xs font-bold text-purple-900">2. รายงานขอซื้อ/ขอจ้าง</div>
                                        <div className="text-[10px] text-purple-600">แบบฟอร์ม 7 ส่วน + กรรมการ</div>
                                    </a>
                                    <a href={route('procurements.download_document', [project.id, 'estimation'])} target="_blank" className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl text-center shadow-2xs hover:shadow-md hover:scale-105 transition-all">
                                        <div className="text-lg mb-1">📊</div>
                                        <div className="text-xs font-bold text-purple-900">3. ประมาณการรายละเอียด</div>
                                        <div className="text-[10px] text-purple-600">ตารางประมาณการ/ราคากลาง</div>
                                    </a>
                                    <a href={route('procurements.download_document', [project.id, 'tor'])} target="_blank" className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl text-center shadow-2xs hover:shadow-md hover:scale-105 transition-all">
                                        <div className="text-lg mb-1">📜</div>
                                        <div className="text-xs font-bold text-purple-900">4. ขอบเขตงาน (TOR)</div>
                                        <div className="text-[10px] text-purple-600">คุณลักษณะเฉพาะ 10 ข้อ</div>
                                    </a>
                                </div>
                            </div>
                        </div>
                        )
                    )}

                    {/* Tab 3: Survey & Stats (Check) */}
                    {activeTab === 'check' && (
                        !isPlanApproved ? (
                            <div className="rounded-3xl border border-amber-200 bg-white p-8 sm:p-12 text-center space-y-5 font-sans shadow-sm">
                                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner border border-amber-200">
                                    🔒
                                </div>
                                <div className="space-y-2 max-w-lg mx-auto">
                                    <h3 className="text-xl font-bold text-slate-800">
                                        แท็บที่ ๓ ยังไม่เปิดให้ทำแบบประเมินผล (Check Phase)
                                    </h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        แบบสำรวจและประเมินผลความพึงพอใจจะเปิดให้ใช้งานเมื่อโครงการผ่านการพิจารณาอนุมัติใน <strong>แท็บที่ ๑ (Plan)</strong> และเริ่มดำเนินกิจกรรมเรียบร้อยแล้วครับ
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <button
                                        onClick={() => setActiveTab('plan')}
                                        className="px-6 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
                                    >
                                        ← กลับไปตรวจสอบและดำเนินการใน แท็บที่ ๑ (Plan)
                                    </button>
                                </div>
                            </div>
                        ) : (
                        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm space-y-6">

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
                        )
                    )}

                    {/* Tab 4: AI Report & Appendix (Act) */}
                    {activeTab === 'act' && (
                        !isPlanApproved ? (
                            <div className="rounded-3xl border border-amber-200 bg-white p-8 sm:p-12 text-center space-y-5 font-sans shadow-sm">
                                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner border border-amber-200">
                                    🔒
                                </div>
                                <div className="space-y-2 max-w-lg mx-auto">
                                    <h3 className="text-xl font-bold text-slate-800">
                                        แท็บที่ ๔ ยังไม่เปิดให้สรุปรายงาน AI (Act Phase)
                                    </h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        ระบบ AI จะประมวลผลเล่มรายงานผลโครงการ ๕ บทและภาคผนวกให้อัตโนมัติ เมื่อโครงการผ่านการอนุมัติใน <strong>แท็บที่ ๑ (Plan)</strong> และดำเนินกิจกรรมเรียบร้อยแล้วครับ
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <button
                                        onClick={() => setActiveTab('plan')}
                                        className="px-6 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
                                    >
                                        ← กลับไปตรวจสอบและดำเนินการใน แท็บที่ ๑ (Plan)
                                    </button>
                                </div>
                            </div>
                        ) : (
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
                        )
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
