import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import Swal from 'sweetalert2';

// Helper to parse multi-line text from main project into selectable items
const splitProjectLines = (text) => {
    if (!text || typeof text !== 'string') return [];
    return text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
};

// Replace "โครงการ" with "กิจกรรม" when pulling template text from main project
const adaptTextForActivity = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/โครงการ/g, 'กิจกรรม');
};

export default function ProjectActivitiesWorkspace({
    project,
    allocatedBudget = 0,
    allUsers = [],
    allDepartments = [],
    currentUserId = null,
    isProcStaffOrAdmin = false,
    canAddActivities = false,
    formatCurrency,
}) {
    // Normalize activities from project.activities JSON
    const activities = useMemo(() => {
        const raw = Array.isArray(project.activities) ? project.activities : [];
        return raw.map((act, idx) => ({
            ...act,
            id: act.id || `act_legacy_${idx + 1}`,
            name: act.name || `กิจกรรมที่ ${idx + 1}`,
            budget: parseFloat(act.budget || 0),
            disbursement_type: act.disbursement_type || 'both',
            assigned_user_ids: Array.isArray(act.assigned_user_ids)
                ? act.assigned_user_ids.map((id) => Number(id))
                : [],
        }));
    }, [project.activities]);

    // Extract selectable lines from Main Project for Objectives, Expected Benefits, Targets, Indicators
    const mainProjectObjectives = useMemo(() => splitProjectLines(project.objectives), [project.objectives]);
    const mainProjectBenefits = useMemo(() => splitProjectLines(project.expected_benefits), [project.expected_benefits]);
    const mainProjectTargets = useMemo(() => splitProjectLines(project.targets), [project.targets]);
    const mainProjectIndicators = useMemo(() => splitProjectLines(project.indicators), [project.indicators]);

    // All procurement & loan sets belonging to this project
    const allSets = useMemo(() => {
        const raw = Array.isArray(project.procurements) ? project.procurements : [];
        return raw.map((s) => {
            const itemsSum = (s.items || []).reduce(
                (acc, it) => acc + (parseFloat(it.total_price) || (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0)),
                0
            );
            return {
                ...s,
                set_type: s.set_type || 'procurement',
                total_amount: itemsSum,
            };
        });
    }, [project.procurements]);

    // Compute project-level totals & remaining balance
    const totalUsedAcrossAllSets = useMemo(
        () => allSets.reduce((sum, s) => sum + s.total_amount, 0),
        [allSets]
    );
    const totalAllocatedToActivities = useMemo(
        () => activities.reduce((sum, a) => sum + (parseFloat(a.budget) || 0), 0),
        [activities]
    );
    const projectRemainingBudget = allocatedBudget - totalUsedAcrossAllSets;
    const isProjectOverBudget = projectRemainingBudget < -0.01;
    const usedPercent = allocatedBudget > 0 ? Math.min(100, Math.round((totalUsedAcrossAllSets / allocatedBudget) * 100)) : 0;

    // Group sets by activity
    const getSetsForActivity = (act) => {
        return allSets.filter(
            (s) =>
                (s.activity_id && String(s.activity_id) === String(act.id)) ||
                (!s.activity_id && s.activity_name && s.activity_name.trim() === act.name.trim())
        );
    };

    const unlinkedSets = useMemo(() => {
        const linkedIds = new Set();
        activities.forEach((act) => {
            getSetsForActivity(act).forEach((s) => linkedIds.add(s.id));
        });
        return allSets.filter((s) => !linkedIds.has(s.id));
    }, [activities, allSets]);

    // Expandable details state per activity
    const [expandedActivityIds, setExpandedActivityIds] = useState({});
    const toggleActivityDetails = (actId) => {
        setExpandedActivityIds((prev) => ({ ...prev, [actId]: !prev[actId] }));
    };

    // --- Modal 1: Add / Edit Sub-Activity (Form mirrors Main Project, using "กิจกรรม") ---
    const [activityModalOpen, setActivityModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);
    const [savingActivity, setSavingActivity] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [actForm, setActForm] = useState({
        name: '',
        background_rationale: '',
        objectives: '',
        targets: '',
        target_group: '',
        indicators: '',
        expected_benefits: '',
        description: '',
        location: '',
        start_date: '',
        end_date: '',
        operation_period_text: '',
        responsible_person: '',
        assigned_user_ids: [],
        budget: '',
        disbursement_type: 'both',
    });

    const openAddActivityModal = () => {
        setEditingActivity(null);
        setUserSearchTerm('');
        setActForm({
            name: '',
            background_rationale: '',
            objectives: '',
            targets: '',
            target_group: '',
            indicators: '',
            expected_benefits: '',
            description: '',
            location: '',
            start_date: '',
            end_date: '',
            operation_period_text: '',
            responsible_person: '',
            assigned_user_ids: [],
            budget: '',
            disbursement_type: 'both',
        });
        setActivityModalOpen(true);
    };

    const openEditActivityModal = (act) => {
        setEditingActivity(act);
        setUserSearchTerm('');
        setActForm({
            name: act.name || '',
            background_rationale: act.background_rationale || '',
            objectives: act.objectives || '',
            targets: act.targets || '',
            target_group: act.target_group || '',
            indicators: act.indicators || '',
            expected_benefits: act.expected_benefits || '',
            description: act.description || '',
            location: act.location || '',
            start_date: act.start_date ? String(act.start_date).slice(0, 10) : '',
            end_date: act.end_date ? String(act.end_date).slice(0, 10) : '',
            operation_period_text: act.operation_period_text || '',
            responsible_person: act.responsible_person || '',
            assigned_user_ids: Array.isArray(act.assigned_user_ids) ? act.assigned_user_ids.map(Number) : [],
            budget: act.budget > 0 ? String(act.budget) : '',
            disbursement_type: act.disbursement_type || 'both',
        });
        setActivityModalOpen(true);
    };

    // Helper: append a selected line from main project into an activity textarea field
    const appendLineToField = (fieldKey, rawLine) => {
        const adapted = adaptTextForActivity(rawLine);
        setActForm((prev) => {
            const current = (prev[fieldKey] || '').trim();
            if (current.includes(adapted)) return prev;
            return {
                ...prev,
                [fieldKey]: current ? `${current}\n${adapted}` : adapted,
            };
        });
    };

    const pullWholeFieldFromProject = (fieldKey, projectFieldValue) => {
        if (!projectFieldValue) return;
        setActForm((prev) => ({
            ...prev,
            [fieldKey]: adaptTextForActivity(projectFieldValue),
        }));
    };

    const toggleAssignedUser = (userId) => {
        const numId = Number(userId);
        setActForm((prev) => {
            const exists = prev.assigned_user_ids.includes(numId);
            const nextIds = exists
                ? prev.assigned_user_ids.filter((id) => id !== numId)
                : [...prev.assigned_user_ids, numId];
            // Automatically sync responsible_person with the first selected assigned user when adding
            const firstUser = nextIds.length > 0 ? allUsers.find((u) => Number(u.id) === nextIds[0]) : null;
            return {
                ...prev,
                assigned_user_ids: nextIds,
                responsible_person: !editingActivity ? (firstUser?.name || '') : (prev.responsible_person || firstUser?.name || ''),
            };
        });
    };

    const filteredUsersForPicker = useMemo(() => {
        const q = userSearchTerm.trim().toLowerCase();
        if (!q) return allUsers.slice(0, 30);
        return allUsers
            .filter(
                (u) =>
                    (u.name || '').toLowerCase().includes(q) ||
                    (u.email || '').toLowerCase().includes(q)
            )
            .slice(0, 30);
    }, [allUsers, userSearchTerm]);

    const otherActivitiesBudget = useMemo(() => {
        if (!editingActivity) return totalAllocatedToActivities;
        return activities
            .filter((a) => String(a.id) !== String(editingActivity.id))
            .reduce((sum, a) => sum + (parseFloat(a.budget) || 0), 0);
    }, [activities, editingActivity, totalAllocatedToActivities]);

    const maxBudgetForActivity = Math.max(0, allocatedBudget - otherActivitiesBudget);
    const actFormBudgetNum = parseFloat(actForm.budget) || 0;
    const isActBudgetOver = actFormBudgetNum > 0 && allocatedBudget > 0 && actFormBudgetNum > maxBudgetForActivity + 0.01;

    const handleSaveActivity = (e) => {
        e.preventDefault();
        if (savingActivity) return;
        if (!actForm.name.trim()) {
            Swal.fire('กรุณากรอกชื่อกิจกรรม', 'กรุณาระบุชื่อกิจกรรม', 'warning');
            return;
        }
        if (!editingActivity && actForm.assigned_user_ids.length === 0) {
            Swal.fire('กรุณาเลือกผู้รับผิดชอบกิจกรรม', 'กรุณาเลือกผู้รับผิดชอบ / ผู้เกี่ยวข้องอย่างน้อย 1 คน เพื่อรับการแจ้งเตือนและเข้ามากรอกรายละเอียดกิจกรรม', 'warning');
            return;
        }
        if (isActBudgetOver) {
            Swal.fire(
                'วงเงินกิจกรรมเกินกรอบโครงการหลัก!',
                `วงเงินคงเหลือสำหรับจัดสรรให้กิจกรรมนี้คือ ${formatCurrency(maxBudgetForActivity)} (จากวงเงินโครงการหลัก ${formatCurrency(allocatedBudget)})`,
                'error'
            );
            return;
        }

        setSavingActivity(true);
        const payload = {
            ...actForm,
            budget: actForm.budget === '' ? 0 : parseFloat(actForm.budget),
        };

        if (editingActivity) {
            router.put(route('projects.activities.update', [project.id, editingActivity.id]), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setActivityModalOpen(false);
                    Swal.fire('บันทึกสำเร็จ!', 'อัปเดตรายละเอียดกิจกรรมเรียบร้อยแล้ว', 'success');
                },
                onFinish: () => setSavingActivity(false),
            });
        } else {
            router.post(route('projects.activities.store', project.id), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setActivityModalOpen(false);
                    Swal.fire(
                        'เพิ่มกิจกรรมสำเร็จ!',
                        actForm.assigned_user_ids.length > 0
                            ? 'เพิ่มกิจกรรมเข้าสู่ระบบและส่งแจ้งเตือนไปยังผู้รับผิดชอบกิจกรรมที่กำหนดเรียบร้อยแล้ว'
                            : 'เพิ่มกิจกรรมเข้าสู่โครงการเรียบร้อยแล้ว สามารถสร้างชุดจัดซื้อจัดจ้างหรือสัญญายืมเงินได้ทันที',
                        'success'
                    );
                },
                onFinish: () => setSavingActivity(false),
            });
        }
    };

    const handleDeleteActivity = (act) => {
        Swal.fire({
            title: 'ยืนยันการลบกิจกรรม?',
            text: `ต้องการลบกิจกรรม "${act.name}" ออกจากโครงการนี้ใช่หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ลบกิจกรรม',
            cancelButtonText: 'ยกเลิก',
        }).then((res) => {
            if (res.isConfirmed) {
                router.delete(route('projects.activities.destroy', [project.id, act.id]), {
                    preserveScroll: true,
                });
            }
        });
    };

    // --- Modal 2: Create / Edit Procurement Set or Loan Set ---
    const [setModalOpen, setSetModalOpen] = useState(false);
    const [editingSet, setEditingSet] = useState(null);
    const [savingSet, setSavingSet] = useState(false);
    const [setForm, setSetForm] = useState({
        set_type: 'procurement',
        activity_id: '',
        activity_name: '',
        set_name: '',
        department_id: project.department_id || '',
        tor_specifications: '',
        items: [{ description: '', quantity: 1, unit: 'รายการ', unit_price: 0 }],
    });

    const openCreateSetModal = (act, type = 'procurement') => {
        setEditingSet(null);
        const existingForAct = act ? getSetsForActivity(act).filter((s) => s.set_type === type).length : 0;
        const defaultName =
            type === 'loan'
                ? `สัญญายืมเงิน${act ? ` - ${act.name}` : ''} (ชุดที่ ${existingForAct + 1})`
                : `จัดซื้อวัสดุ/จ้างเหมา${act ? ` - ${act.name}` : ''} (ชุดที่ ${existingForAct + 1})`;

        setSetForm({
            set_type: type,
            activity_id: act ? act.id : '',
            activity_name: act ? act.name : '',
            set_name: defaultName,
            department_id: project.department_id || '',
            tor_specifications:
                type === 'procurement'
                    ? `1. วัตถุประสงค์\nเพื่อจัดหาวัสดุอุปกรณ์สนับสนุนการดำเนินงานกิจกรรม "${act ? act.name : project.title}" ภายใต้โครงการ "${project.title}"\n\n2. ระยะเวลาส่งมอบ\nภายใน 7 วัน นับถัดจากวันที่ได้รับใบสั่งซื้อสั่งจ้าง`
                    : '',
            items: [
                {
                    description:
                        type === 'loan'
                            ? 'ค่าอาหารกลางวัน / ค่าตอบแทนวิทยากร / ค่าใช้จ่ายจัดกิจกรรม'
                            : '',
                    quantity: 1,
                    unit: type === 'loan' ? 'รายการ' : 'ชุด',
                    unit_price: 0,
                },
            ],
        });
        setSetModalOpen(true);
    };

    const openEditSetModal = (setObj) => {
        setEditingSet(setObj);
        setSetForm({
            set_type: setObj.set_type || 'procurement',
            activity_id: setObj.activity_id || '',
            activity_name: setObj.activity_name || '',
            set_name: setObj.set_name || '',
            department_id: setObj.department_id || project.department_id || '',
            tor_specifications: setObj.tor_specifications || '',
            items:
                setObj.items && setObj.items.length > 0
                    ? setObj.items.map((it) => ({
                          description: it.description || '',
                          quantity: it.quantity || 1,
                          unit: it.unit || 'รายการ',
                          unit_price: it.unit_price || 0,
                      }))
                    : [{ description: '', quantity: 1, unit: 'รายการ', unit_price: 0 }],
        });
        setSetModalOpen(true);
    };

    const currentSetTotal = useMemo(
        () =>
            setForm.items.reduce(
                (sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0),
                0
            ),
        [setForm.items]
    );

    const maxAllowedByProject = useMemo(() => {
        const otherSum = editingSet
            ? allSets.filter((s) => s.id !== editingSet.id).reduce((sum, s) => sum + s.total_amount, 0)
            : totalUsedAcrossAllSets;
        return Math.max(0, allocatedBudget - otherSum);
    }, [allSets, editingSet, totalUsedAcrossAllSets, allocatedBudget]);

    const maxAllowedByActivity = useMemo(() => {
        if (!setForm.activity_id) return null;
        const act = activities.find((a) => String(a.id) === String(setForm.activity_id));
        if (!act || !(act.budget > 0)) return null;
        const otherActSum = getSetsForActivity(act)
            .filter((s) => !editingSet || s.id !== editingSet.id)
            .reduce((sum, s) => sum + s.total_amount, 0);
        return Math.max(0, act.budget - otherActSum);
    }, [setForm.activity_id, activities, allSets, editingSet]);

    const effectiveMaxForSet =
        maxAllowedByActivity !== null ? Math.min(maxAllowedByProject, maxAllowedByActivity) : maxAllowedByProject;
    const isSetOverBudget = allocatedBudget > 0 && currentSetTotal > effectiveMaxForSet + 0.01;

    const handleSaveSet = (e) => {
        e.preventDefault();
        if (savingSet) return;
        if (!setForm.set_name.trim()) {
            Swal.fire('กรุณาระบุชื่อชุดเอกสาร', 'กรุณากรอกชื่อชุดจัดซื้อจัดจ้างหรือสัญญายืมเงิน', 'warning');
            return;
        }
        const validItems = setForm.items.filter((i) => i.description && i.description.trim() !== '');
        if (validItems.length === 0) {
            Swal.fire('กรุณาระบุรายการ', 'กรุณากรอกรายการอย่างน้อย 1 รายการ', 'warning');
            return;
        }
        if (isSetOverBudget) {
            Swal.fire(
                'ยอดเงินเกินงบประมาณคงเหลือ!',
                `ยอดรวมชุดนี้ (${formatCurrency(currentSetTotal)}) เกินวงเงินคงเหลือที่อนุญาต (${formatCurrency(effectiveMaxForSet)}) กรุณาปรับลดจำนวนหรือราคาต่อหน่วย`,
                'error'
            );
            return;
        }

        setSavingSet(true);
        const payload = { ...setForm, items: validItems };

        if (editingSet) {
            router.post(route('procurements.update_set', editingSet.id), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setSetModalOpen(false);
                    Swal.fire('อัปเดตสำเร็จ!', 'บันทึกการแก้ไขชุดเอกสารเรียบร้อยแล้ว', 'success');
                },
                onFinish: () => setSavingSet(false),
            });
        } else {
            router.post(route('procurements.create_set', project.id), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setSetModalOpen(false);
                    Swal.fire(
                        'สร้างชุดเอกสารสำเร็จ!',
                        setForm.set_type === 'loan'
                            ? 'สร้างชุดสัญญายืมเงิน (กค. 101) เรียบร้อยแล้ว สามารถพิมพ์สัญญาแยกตามกิจกรรมได้ทันที'
                            : 'สร้างชุดจัดซื้อจัดจ้างเรียบร้อยแล้ว ระบบได้ส่งแจ้งเตือนไปยังเจ้าหน้าที่/หัวหน้างานพัสดุเพื่อแต่งตั้งคณะกรรมการแล้ว',
                        'success'
                    );
                },
                onFinish: () => setSavingSet(false),
            });
        }
    };

    const handleDeleteSet = (setObj) => {
        Swal.fire({
            title: 'ยืนยันการลบชุดเอกสาร?',
            text: `ต้องการลบ "${setObj.set_name || setObj.procurement_number}" วงเงิน ${formatCurrency(setObj.total_amount)} หรือไม่? (วงเงินจะถูกคืนกลับสู่งบประมาณคงเหลือของโครงการ)`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ลบชุดเอกสาร',
            cancelButtonText: 'ยกเลิก',
        }).then((res) => {
            if (res.isConfirmed) {
                router.delete(route('procurements.delete_set', setObj.id), {
                    preserveScroll: true,
                });
            }
        });
    };

    // --- Modal 3: Committee Appointment (Procurement Staff / Head / Admin ONLY) ---
    const [committeeModalOpen, setCommitteeModalOpen] = useState(false);
    const [committeeTargetSet, setCommitteeTargetSet] = useState(null);
    const [savingCommittee, setSavingCommittee] = useState(false);
    const [commForm, setCommForm] = useState({
        purchasing_chair: '',
        purchasing_member1: '',
        purchasing_member2: '',
        inspection_chair: '',
        inspection_member1: '',
        inspection_member2: '',
    });

    const openCommitteeModal = (setObj) => {
        if (!isProcStaffOrAdmin) return;
        const comms = setObj.committees || [];
        const pChair = comms.find((c) => c.pivot?.committee_type === 'purchasing' && c.pivot?.role === 'chairperson')?.id || '';
        const pMembers = comms.filter((c) => c.pivot?.committee_type === 'purchasing' && c.pivot?.role === 'member');
        const iChair = comms.find((c) => c.pivot?.committee_type === 'inspection' && c.pivot?.role === 'chairperson')?.id || '';
        const iMembers = comms.filter((c) => c.pivot?.committee_type === 'inspection' && c.pivot?.role === 'member');

        setCommitteeTargetSet(setObj);
        setCommForm({
            purchasing_chair: pChair,
            purchasing_member1: pMembers[0]?.id || '',
            purchasing_member2: pMembers[1]?.id || '',
            inspection_chair: iChair,
            inspection_member1: iMembers[0]?.id || '',
            inspection_member2: iMembers[1]?.id || '',
        });
        setCommitteeModalOpen(true);
    };

    const handleSaveCommittees = (e) => {
        e.preventDefault();
        if (!committeeTargetSet || savingCommittee) return;
        setSavingCommittee(true);
        router.post(route('procurements.assign_set_committees', committeeTargetSet.id), commForm, {
            preserveScroll: true,
            onSuccess: () => {
                setCommitteeModalOpen(false);
                Swal.fire('แต่งตั้งคณะกรรมการสำเร็จ!', 'บันทึกรายชื่อคณะกรรมการจัดซื้อจัดจ้างและตรวจรับพัสดุเรียบร้อยแล้ว', 'success');
            },
            onFinish: () => setSavingCommittee(false),
        });
    };

    const renderStatusBadge = (setObj) => {
        const st = setObj.status || 'pending';
        if (st === 'completed') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">✅ เบิกจ่ายแล้ว</span>;
        if (st === 'finance_received') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">🏦 การเงินรับเรื่องแล้ว</span>;
        if (st === 'forwarded_to_finance') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">📤 ส่งการเงินแล้ว</span>;
        if (st === 'received') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">📦 พัสดุลงรับแล้ว</span>;
        if (st === 'plan_cut') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">✂️ ตัดยอด ผง. แล้ว</span>;
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">⏳ รอดำเนินการ</span>;
    };

    const renderSetCard = (setObj, canEditThisSet = false) => {
        const isLoan = setObj.set_type === 'loan';
        const comms = setObj.committees || [];
        const hasCommittees = comms.length > 0;
        const pChair = comms.find((c) => c.pivot?.committee_type === 'purchasing' && c.pivot?.role === 'chairperson');
        const pMembers = comms.filter((c) => c.pivot?.committee_type === 'purchasing' && c.pivot?.role === 'member');
        const iChair = comms.find((c) => c.pivot?.committee_type === 'inspection' && c.pivot?.role === 'chairperson');
        const iMembers = comms.filter((c) => c.pivot?.committee_type === 'inspection' && c.pivot?.role === 'member');
        const isLocked = ['forwarded_to_finance', 'finance_received', 'completed'].includes(setObj.status);

        return (
            <div
                key={setObj.id}
                className={`rounded-xl border p-4 space-y-3 transition-all ${
                    isLoan
                        ? 'bg-amber-50/40 border-amber-200/80'
                        : 'bg-white border-purple-200/80 shadow-2xs'
                }`}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-black ${
                                isLoan ? 'bg-amber-200 text-amber-950' : 'bg-purple-100 text-purple-900'
                            }`}
                        >
                            {isLoan ? '💵 สัญญายืมเงิน (กค. 101)' : '🛒 ชุดจัดซื้อจัดจ้าง'}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-500">
                            {setObj.procurement_number || `#${setObj.id}`}
                        </span>
                        <h6 className="text-sm font-extrabold text-slate-900">
                            {setObj.set_name || 'ชุดเอกสารกิจกรรม'}
                        </h6>
                        {renderStatusBadge(setObj)}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${isLoan ? 'text-amber-800' : 'text-purple-900'}`}>
                            {formatCurrency(setObj.total_amount)}
                        </span>
                        {canEditThisSet && !isLocked && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => openEditSetModal(setObj)}
                                    className="px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                                    title="แก้ไขชุดเอกสาร"
                                >
                                    ✏️ แก้ไข
                                </button>
                                {!['received', 'forwarded_to_finance', 'finance_received', 'completed'].includes(setObj.status) && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteSet(setObj)}
                                        className="px-2 py-1 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer"
                                        title="ลบชุดเอกสาร"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Items Preview */}
                {setObj.items && setObj.items.length > 0 && (
                    <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/70">
                        <div className="space-y-1">
                            {setObj.items.map((it, idx) => (
                                <div key={it.id || idx} className="flex items-center justify-between text-xs text-slate-700">
                                    <span>
                                        {idx + 1}. <strong className="text-slate-900">{it.description}</strong>{' '}
                                        <span className="text-slate-500">
                                            ({it.quantity} {it.unit} × {formatCurrency(it.unit_price)})
                                        </span>
                                    </span>
                                    <span className="font-bold text-slate-800 whitespace-nowrap ml-2">
                                        {formatCurrency(it.total_price || (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Committee Appointment Status & Action (Procurement sets only) */}
                {!isLoan && (
                    <div className={`rounded-lg p-3 border text-xs ${hasCommittees ? 'bg-purple-50/50 border-purple-200' : 'bg-amber-50/70 border-amber-300'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-purple-950">👥 คณะกรรมการจัดซื้อจัดจ้างและตรวจรับพัสดุ:</span>
                                {hasCommittees ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        ✓ แต่งตั้งแล้ว
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-950">
                                        ⏳ รอเจ้าหน้าที่งานพัสดุกำหนดรายชื่อ
                                    </span>
                                )}
                                {!isProcStaffOrAdmin && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                                        🔒 กำหนดโดยงานพัสดุเท่านั้น
                                    </span>
                                )}
                            </div>
                            {isProcStaffOrAdmin && (
                                <button
                                    type="button"
                                    onClick={() => openCommitteeModal(setObj)}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-extrabold bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition cursor-pointer whitespace-nowrap"
                                >
                                    👥 {hasCommittees ? 'แก้ไขคณะกรรมการ (สิทธิ์งานพัสดุ)' : 'แต่งตั้งคณะกรรมการ (สิทธิ์งานพัสดุ)'}
                                </button>
                            )}
                        </div>
                        {hasCommittees && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-purple-200/70 text-[11px]">
                                <div>
                                    <span className="font-bold text-purple-900 block">📋 กก.จัดซื้อ/จัดจ้าง:</span>
                                    <span className="text-slate-700">
                                        ประธาน: <b>{pChair?.name || '-'}</b>
                                        {pMembers.length > 0 && ` | กก.: ${pMembers.map((m) => m.name).join(', ')}`}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-bold text-emerald-900 block">🔍 กก.ตรวจรับพัสดุ:</span>
                                    <span className="text-slate-700">
                                        ประธาน: <b>{iChair?.name || '-'}</b>
                                        {iMembers.length > 0 && ` | กก.: ${iMembers.map((m) => m.name).join(', ')}`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Document Print Links */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {isLoan ? (
                        <a
                            href={route('procurements.download_set_document', [setObj.id, 'loan_contract'])}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition"
                        >
                            <span>🖨️</span> พิมพ์สัญญายืมเงิน (กค. 101)
                        </a>
                    ) : (
                        <>
                            <a
                                href={route('procurements.download_set_document', [setObj.id, 'memo'])}
                                target="_blank"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-[11px] font-bold rounded-lg transition"
                            >
                                📄 บันทึกข้อความ
                            </a>
                            <a
                                href={route('procurements.download_set_document', [setObj.id, 'request_form'])}
                                target="_blank"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-[11px] font-bold rounded-lg transition"
                            >
                                📑 ใบขอซื้อ/จ้าง
                            </a>
                            <a
                                href={route('procurements.download_set_document', [setObj.id, 'estimation'])}
                                target="_blank"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-[11px] font-bold rounded-lg transition"
                            >
                                📊 ตารางประมาณการ
                            </a>
                            <a
                                href={route('procurements.download_set_document', [setObj.id, 'tor'])}
                                target="_blank"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-[11px] font-bold rounded-lg transition"
                            >
                                📝 ขอบเขตงาน (TOR)
                            </a>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/40 rounded-2xl p-5 space-y-5 shadow-sm">
            {/* Section Header + Add Activity Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-4">
                <div>
                    <h4 className="text-base font-black text-indigo-950 flex items-center gap-2">
                        <span>🎯</span> กิจกรรมย่อยและการจัดซื้อจัดจ้าง / สัญญายืมเงิน แยกตามกิจกรรม
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                        เจ้าของโครงการ เจ้าหน้าที่งานแผน หัวหน้างานแผน และผู้ดูแลระบบ สามารถเพิ่มกิจกรรมและมอบหมายผู้เกี่ยวข้องรับผิดชอบแต่ละกิจกรรมได้ พร้อมแจ้งเตือนอัตโนมัติ
                    </p>
                </div>
                {canAddActivities && (
                    <button
                        type="button"
                        onClick={openAddActivityModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-extrabold rounded-xl shadow-md hover:scale-[1.02] active:scale-95 transition cursor-pointer whitespace-nowrap"
                    >
                        <span>➕</span> เพิ่มกิจกรรมย่อย
                    </button>
                )}
            </div>

            {/* Project-Wide Real-Time Budget Control Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-emerald-800 block">💰 งบประมาณโครงการหลักที่ได้รับจัดสรร</span>
                    <p className="text-lg font-black text-emerald-700 mt-0.5">{formatCurrency(allocatedBudget)}</p>
                    <span className="text-[10px] text-slate-500">
                        {project.budgets && project.budgets.length > 1
                            ? `รวมพหุแหล่งเงินทุน (${project.budgets.length} หมวด)`
                            : 'วงเงินอนุมัติสูงสุดห้ามใช้เกิน'}
                    </span>
                </div>
                <div className="bg-white rounded-xl p-3.5 border border-indigo-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-indigo-800 block">📑 ยอดใช้ไปรวมทุกกิจกรรม ({allSets.length} ชุด)</span>
                    <p className="text-lg font-black text-indigo-900 mt-0.5">{formatCurrency(totalUsedAcrossAllSets)}</p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                            className={`h-1.5 rounded-full transition-all ${isProjectOverBudget ? 'bg-rose-600' : 'bg-indigo-600'}`}
                            style={{ width: `${usedPercent}%` }}
                        />
                    </div>
                </div>
                <div className={`rounded-xl p-3.5 border shadow-2xs ${isProjectOverBudget ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50/70 border-emerald-300'}`}>
                    <span className={`text-[11px] font-bold block ${isProjectOverBudget ? 'text-rose-800' : 'text-emerald-900'}`}>
                        {isProjectOverBudget ? '🚨 เกินวงเงินจัดสรร!' : '✅ งบประมาณคงเหลือสุทธิของโครงการ'}
                    </span>
                    <p className={`text-lg font-black mt-0.5 ${isProjectOverBudget ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {formatCurrency(Math.abs(projectRemainingBudget))}
                    </p>
                    <span className="text-[10px] text-slate-600">
                        {isProjectOverBudget
                            ? 'กรุณาปรับลดยอดชุดจัดซื้อจัดจ้าง/ยืมเงินให้ไม่เกินวงเงินจัดสรร'
                            : `ใช้ไปแล้ว ${usedPercent}% ของงบที่ได้รับจัดสรร`}
                    </span>
                </div>
            </div>

            {/* Activities List */}
            {activities.length === 0 ? (
                <div className="bg-white/90 border border-dashed border-indigo-300 rounded-xl p-6 text-center space-y-2">
                    <div className="text-3xl">📋</div>
                    <h5 className="text-sm font-extrabold text-slate-800">ยังไม่มีกิจกรรมย่อยในโครงการนี้</h5>
                    <p className="text-xs text-slate-500 max-w-lg mx-auto">
                        เจ้าของโครงการ งานแผน หรือผู้ดูแลระบบ สามารถเพิ่มกิจกรรมย่อย กำหนดรายละเอียดและผู้รับผิดชอบกิจกรรม แล้วแยกชุดจัดซื้อจัดจ้าง/สัญญายืมเงินตามแต่ละกิจกรรมได้ทันที
                    </p>
                    {canAddActivities && (
                        <button
                            type="button"
                            onClick={openAddActivityModal}
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                        >
                            <span>➕</span> เพิ่มกิจกรรมย่อยแรกของโครงการ
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {activities.map((act, idx) => {
                        const actSets = getSetsForActivity(act);
                        const actUsed = actSets.reduce((sum, s) => sum + s.total_amount, 0);
                        const actCap = act.budget > 0 ? act.budget : null;
                        const actRemaining = actCap !== null ? actCap - actUsed : projectRemainingBudget;
                        const isAssignedToMe = currentUserId && act.assigned_user_ids.includes(Number(currentUserId));
                        const canEditThisActivity = Boolean(canAddActivities || isAssignedToMe);
                        const canManageSetsForActivity = Boolean(canAddActivities || isAssignedToMe || isProcStaffOrAdmin);
                        const assignedUsers = allUsers.filter((u) => act.assigned_user_ids.includes(Number(u.id)));
                        const isExpanded = Boolean(expandedActivityIds[act.id]);
                        const hasRichDetails = Boolean(
                            act.background_rationale || act.objectives || act.targets || act.indicators || act.expected_benefits || act.description
                        );

                        return (
                            <div key={act.id} className="bg-white rounded-2xl border border-indigo-200/90 shadow-xs overflow-hidden">
                                {/* Activity Header */}
                                <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-white px-5 py-4 border-b border-indigo-100">
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-indigo-600 text-white">
                                                    กิจกรรมที่ {idx + 1}
                                                </span>
                                                <h5 className="text-sm font-black text-indigo-950">{act.name}</h5>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                                    {act.disbursement_type === 'loan'
                                                        ? '💵 เน้นยืมเงิน กค. 101'
                                                        : act.disbursement_type === 'procurement'
                                                        ? '🛒 เน้นจัดซื้อจัดจ้าง'
                                                        : '🛒💵 จัดซื้อ + ยืมเงิน'}
                                                </span>
                                                {isAssignedToMe && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                        ✨ คุณรับผิดชอบกิจกรรมนี้
                                                    </span>
                                                )}
                                                {!hasRichDetails && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                                        ⏳ รอผู้รับผิดชอบกิจกรรมกรอกรายละเอียด
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600 pt-0.5">
                                                {act.responsible_person && <span>👤 ผู้รับผิดชอบหลัก: <b>{act.responsible_person}</b></span>}
                                                {act.target_group && <span>🎯 กลุ่มเป้าหมาย: <b>{act.target_group}</b></span>}
                                                {act.location && <span>📍 สถานที่: <b>{act.location}</b></span>}
                                                {(act.operation_period_text || act.start_date || act.end_date) && (
                                                    <span>
                                                        📅 ประมาณการวันเวลา:{' '}
                                                        <b>
                                                            {act.operation_period_text
                                                                ? act.operation_period_text
                                                                : `${act.start_date || '-'} ถึง ${act.end_date || '-'}`}
                                                        </b>
                                                    </span>
                                                )}
                                            </div>

                                            {/* Assigned team members chips */}
                                            {assignedUsers.length > 0 && (
                                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                    <span className="text-[11px] font-bold text-indigo-900">👥 ผู้เกี่ยวข้องรับผิดชอบกิจกรรม:</span>
                                                    {assignedUsers.map((u) => (
                                                        <span
                                                            key={u.id}
                                                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200"
                                                        >
                                                            {u.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Toggle Full Activity Details */}
                                            {hasRichDetails && (
                                                <div className="pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleActivityDetails(act.id)}
                                                        className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                                                    >
                                                        {isExpanded ? '▲ ซ่อนรายละเอียดกิจกรรม' : '▼ ดูรายละเอียดกิจกรรม (หลักการฯ / วัตถุประสงค์ / ตัวชี้วัด / ผลลัพธ์)'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Activity Budget Summary Pill + Actions */}
                                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                                            <div className="flex flex-wrap items-center gap-2 text-xs bg-white px-3 py-1.5 rounded-xl border border-indigo-200">
                                                <span className="text-slate-500">
                                                    {actCap !== null ? `กรอบกิจกรรม: ` : `งบร่วมโครงการ: `}
                                                    <b className="text-slate-800">{actCap !== null ? formatCurrency(actCap) : formatCurrency(allocatedBudget)}</b>
                                                </span>
                                                <span className="text-slate-300">|</span>
                                                <span className="text-indigo-700">
                                                    ใช้ไป: <b>{formatCurrency(actUsed)}</b>
                                                </span>
                                                <span className="text-slate-300">|</span>
                                                <span className={actRemaining < -0.01 ? 'text-rose-600 font-black' : 'text-emerald-700 font-black'}>
                                                    คงเหลือ: {formatCurrency(Math.max(0, actRemaining))}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <a
                                                    href={route('projects.activities.memo', [project.id, act.id])}
                                                    target="_blank"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-extrabold rounded-lg shadow-2xs transition cursor-pointer"
                                                    title="พิมพ์ครบชุด: บันทึกข้อความขออนุญาต + โครงการหลักที่มีลายเซ็นต์ + รายละเอียดกิจกรรม"
                                                >
                                                    <span>🖨️</span> พิมพ์ชุดขออนุญาตกิจกรรม (AI)
                                                </a>
                                                {canManageSetsForActivity && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => openCreateSetModal(act, 'procurement')}
                                                            disabled={projectRemainingBudget <= 0.01}
                                                            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-[11px] font-bold rounded-lg shadow-2xs transition cursor-pointer"
                                                        >
                                                            ➕ ชุดจัดซื้อจัดจ้าง
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openCreateSetModal(act, 'loan')}
                                                            disabled={projectRemainingBudget <= 0.01}
                                                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-[11px] font-bold rounded-lg shadow-2xs transition cursor-pointer"
                                                        >
                                                            💵 สัญญายืมเงิน (กค. 101)
                                                        </button>
                                                    </>
                                                )}
                                                {canEditThisActivity && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditActivityModal(act)}
                                                        className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px] font-bold rounded-lg cursor-pointer"
                                                        title="กรอก/แก้ไขรายละเอียดกิจกรรม"
                                                    >
                                                        📝 กรอก/แก้ไขรายละเอียดกิจกรรม
                                                    </button>
                                                )}
                                                {canAddActivities && actSets.length === 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteActivity(act)}
                                                        className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold rounded-lg cursor-pointer"
                                                        title="ลบกิจกรรม"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Collapsible Rich Activity Details */}
                                    {isExpanded && hasRichDetails && (
                                        <div className="mt-3 pt-3 border-t border-indigo-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                            {act.background_rationale && (
                                                <div className="bg-white/90 p-3 rounded-xl border border-indigo-100">
                                                    <span className="font-extrabold text-indigo-900 block mb-1">📌 หลักการและเหตุผลของกิจกรรม</span>
                                                    <p className="text-slate-700 whitespace-pre-line">{act.background_rationale}</p>
                                                </div>
                                            )}
                                            {act.objectives && (
                                                <div className="bg-white/90 p-3 rounded-xl border border-indigo-100">
                                                    <span className="font-extrabold text-indigo-900 block mb-1">🎯 วัตถุประสงค์ของกิจกรรม</span>
                                                    <p className="text-slate-700 whitespace-pre-line">{act.objectives}</p>
                                                </div>
                                            )}
                                            {act.targets && (
                                                <div className="bg-white/90 p-3 rounded-xl border border-indigo-100">
                                                    <span className="font-extrabold text-indigo-900 block mb-1">📊 เป้าหมายของกิจกรรม</span>
                                                    <p className="text-slate-700 whitespace-pre-line">{act.targets}</p>
                                                </div>
                                            )}
                                            {act.indicators && (
                                                <div className="bg-white/90 p-3 rounded-xl border border-indigo-100">
                                                    <span className="font-extrabold text-indigo-900 block mb-1">📈 ตัวชี้วัดความสำเร็จของกิจกรรม</span>
                                                    <p className="text-slate-700 whitespace-pre-line">{act.indicators}</p>
                                                </div>
                                            )}
                                            {act.expected_benefits && (
                                                <div className="bg-white/90 p-3 rounded-xl border border-indigo-100">
                                                    <span className="font-extrabold text-emerald-900 block mb-1">✨ ผลลัพธ์ / ผลที่คาดว่าจะได้รับของกิจกรรม</span>
                                                    <p className="text-slate-700 whitespace-pre-line">{act.expected_benefits}</p>
                                                </div>
                                            )}
                                            {act.description && (
                                                <div className="bg-white/90 p-3 rounded-xl border border-indigo-100">
                                                    <span className="font-extrabold text-indigo-900 block mb-1">📝 ขั้นตอนและรายละเอียดการดำเนินกิจกรรม</span>
                                                    <p className="text-slate-700 whitespace-pre-line">{act.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Sets belonging to this Activity */}
                                <div className="p-4 space-y-3 bg-slate-50/40">
                                    {actSets.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic text-center py-2">
                                            ยังไม่มีชุดจัดซื้อจัดจ้างหรือสัญญายืมเงินในกิจกรรมนี้ — กดปุ่ม "➕ ชุดจัดซื้อจัดจ้าง" หรือ "💵 สัญญายืมเงิน (กค. 101)" ด้านบนเพื่อเริ่มต้น
                                        </p>
                                    ) : (
                                        actSets.map((setObj) => renderSetCard(setObj, canManageSetsForActivity))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Any Legacy / General Sets not linked to a specific activity */}
            {unlinkedSets.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                    <h5 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                        <span>📦</span> ชุดจัดซื้อจัดจ้าง / สัญญายืมเงินทั่วไปของโครงการหลัก ({unlinkedSets.length} ชุด)
                    </h5>
                    <div className="space-y-2.5">
                        {unlinkedSets.map((setObj) => renderSetCard(setObj, Boolean(canAddActivities || isProcStaffOrAdmin)))}
                    </div>
                </div>
            )}

            {/* MODAL 1: Add Activity (Quick: Name + Assignee ONLY) OR Edit Activity (Full Form for Responsible Person) */}
            {activityModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className={`bg-white rounded-2xl shadow-2xl border border-indigo-200 w-full overflow-hidden my-6 ${editingActivity ? 'max-w-3xl' : 'max-w-xl'}`}>
                        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 px-5 py-4 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black">
                                    {editingActivity ? '📝 แบบฟอร์มกรอก/แก้ไขรายละเอียดกิจกรรม' : '➕ เพิ่มกิจกรรมใหม่และมอบหมายผู้รับผิดชอบ'}
                                </h3>
                                <p className="text-[11px] text-indigo-100">
                                    {editingActivity
                                        ? `งบโครงการหลัก: ${formatCurrency(allocatedBudget)} | คงเหลือสำหรับจัดสรรกรอบกิจกรรม: ${formatCurrency(maxBudgetForActivity)}`
                                        : 'ระบุเพียงชื่อกิจกรรมและเลือกผู้รับผิดชอบ ระบบจะแจ้งเตือนให้ผู้รับผิดชอบเข้ามากรอกรายละเอียดและจัดทำเอกสารต่อเอง'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActivityModalOpen(false)}
                                className="text-white/80 hover:text-white text-xl font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveActivity} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                            {/* 1. ชื่อกิจกรรม */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                                    1. ชื่อกิจกรรม: <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={actForm.name}
                                    onChange={(e) => setActForm({ ...actForm, name: e.target.value })}
                                    placeholder="เช่น การพัฒนาทักษะและสมรรถนะวิชาชีพกำลังคน หลักสูตรวิชาชีพระยะสั้น รายวิชา (รำไทย)"
                                    className="w-full rounded-xl border-slate-300 text-xs font-semibold focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>

                            {/* 2. ผู้เกี่ยวข้องรับผิดชอบกิจกรรม + แจ้งเตือน */}
                            <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 space-y-2.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <label className="text-xs font-extrabold text-indigo-950">
                                        2. ผู้รับผิดชอบ / ผู้เกี่ยวข้องดำเนินกิจกรรม (ระบบแจ้งเตือนอัตโนมัติ): {!editingActivity && <span className="text-rose-500">*</span>}
                                    </label>
                                    {!canAddActivities && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                                            🔒 กำหนดโดยเจ้าของโครงการ / งานแผน
                                        </span>
                                    )}
                                </div>

                                {/* Selected Users Chips */}
                                {actForm.assigned_user_ids.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {actForm.assigned_user_ids.map((uid) => {
                                            const u = allUsers.find((usr) => Number(usr.id) === Number(uid));
                                            if (!u) return null;
                                            return (
                                                <span
                                                    key={uid}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-600 text-white shadow-2xs"
                                                >
                                                    <span>👤 {u.name}</span>
                                                    {canAddActivities && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleAssignedUser(uid)}
                                                            className="hover:text-amber-200 font-black cursor-pointer"
                                                            title="นำออก"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </span>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-slate-500 italic">ยังไม่ได้เลือกผู้รับผิดชอบกิจกรรม (ค้นหาและติ๊กเลือกด้านล่าง)</p>
                                )}

                                {canAddActivities && (
                                    <div className="space-y-1.5">
                                        <input
                                            type="text"
                                            value={userSearchTerm}
                                            onChange={(e) => setUserSearchTerm(e.target.value)}
                                            placeholder="🔍 พิมพ์ชื่อบุคลากรเพื่อค้นหาและเลือกผู้รับผิดชอบกิจกรรม..."
                                            className="w-full rounded-lg border-indigo-200 text-xs bg-white focus:ring-indigo-500"
                                        />
                                        <div className="max-h-36 overflow-y-auto bg-white border border-indigo-100 rounded-lg divide-y divide-slate-100">
                                            {filteredUsersForPicker.map((u) => {
                                                const checked = actForm.assigned_user_ids.includes(Number(u.id));
                                                return (
                                                    <label
                                                        key={u.id}
                                                        className={`flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer hover:bg-indigo-50/70 ${
                                                            checked ? 'bg-indigo-50 font-bold text-indigo-900' : 'text-slate-700'
                                                        }`}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleAssignedUser(u.id)}
                                                                className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <span>{u.name}</span>
                                                        </span>
                                                        {checked && <span className="text-[10px] text-emerald-700 font-bold">✓ เลือกแล้ว</span>}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[10px] text-indigo-800">
                                            🔔 เมื่อบันทึก ระบบจะแจ้งเตือนไปยังผู้รับผิดชอบที่เลือก เพื่อให้เข้ามากรอกรายละเอียดกิจกรรม จัดทำชุดจัดซื้อจัดจ้าง/สัญญายืมเงิน และพิมพ์ชุดเอกสารขออนุญาตได้ด้วยตนเอง
                                        </p>
                                    </div>
                                )}

                                {editingActivity && (
                                    <div className="pt-1">
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">ชื่อผู้รับผิดชอบกิจกรรมหลัก (สำหรับแสดงในเอกสาร):</label>
                                        <input
                                            type="text"
                                            value={actForm.responsible_person}
                                            onChange={(e) => setActForm({ ...actForm, responsible_person: e.target.value })}
                                            placeholder="ชื่อ-สกุล ผู้รับผิดชอบกิจกรรม"
                                            className="w-full rounded-lg border-slate-300 text-xs bg-white focus:ring-indigo-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Optional Budget Cap when adding (compact) */}
                            {!editingActivity && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        กรอบวงเงินกิจกรรม (บาท) <span className="text-slate-400 font-normal">(ไม่บังคับ — เว้นว่างเพื่อให้ตัดจากงบโครงการหลัก {formatCurrency(maxBudgetForActivity)})</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={actForm.budget}
                                        onChange={(e) => setActForm({ ...actForm, budget: e.target.value })}
                                        placeholder={`สูงสุดไม่เกิน ${maxBudgetForActivity.toLocaleString('th-TH')} บาท`}
                                        className={`w-full rounded-xl text-xs font-black ${
                                            isActBudgetOver
                                                ? 'border-rose-500 bg-rose-50 text-rose-700 focus:ring-rose-500'
                                                : 'border-emerald-300 text-emerald-800 focus:ring-emerald-500'
                                        }`}
                                    />
                                    {isActBudgetOver && (
                                        <p className="text-[11px] font-bold text-rose-600 mt-1">
                                            ⚠️ เกินงบคงเหลือโครงการ ({formatCurrency(maxBudgetForActivity)})
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Full Activity Details Fields — ONLY shown when editing/filling in activity details */}
                            {editingActivity && (
                            <>
                            {/* 3. งบประมาณและรูปแบบการเบิกจ่ายของกิจกรรม */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-800 mb-1">
                                        3. กรอบวงเงินงบประมาณของกิจกรรม (บาท)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        disabled={!canAddActivities}
                                        value={actForm.budget}
                                        onChange={(e) => setActForm({ ...actForm, budget: e.target.value })}
                                        placeholder={`สูงสุดไม่เกิน ${maxBudgetForActivity.toLocaleString('th-TH')} (เว้นว่างเพื่อใช้จากกองกลาง)`}
                                        className={`w-full rounded-xl text-xs font-black disabled:bg-slate-100 ${
                                            isActBudgetOver
                                                ? 'border-rose-500 bg-rose-50 text-rose-700 focus:ring-rose-500'
                                                : 'border-emerald-300 text-emerald-800 focus:ring-emerald-500'
                                        }`}
                                    />
                                    {isActBudgetOver && (
                                        <p className="text-[11px] font-bold text-rose-600 mt-1">
                                            ⚠️ เกินงบคงเหลือโครงการ ({formatCurrency(maxBudgetForActivity)})
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-800 mb-1">รูปแบบการเบิกจ่ายของกิจกรรม:</label>
                                    <select
                                        value={actForm.disbursement_type}
                                        onChange={(e) => setActForm({ ...actForm, disbursement_type: e.target.value })}
                                        className="w-full rounded-xl border-slate-300 text-xs font-semibold focus:ring-indigo-500"
                                    >
                                        <option value="both">🛒💵 ทั้งจัดซื้อจัดจ้าง และสัญญายืมเงิน (กค. 101)</option>
                                        <option value="procurement">🛒 จัดซื้อจัดจ้างพัสดุ/จ้างเหมา</option>
                                        <option value="loan">💵 สัญญายืมเงินทดรองราชการ (กค. 101)</option>
                                    </select>
                                </div>
                            </div>

                            {/* 4. ประมาณการวันเวลา และสถานที่ดำเนินกิจกรรม (แยกอิสระตามกิจกรรม) */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                                <span className="text-xs font-extrabold text-slate-800 block">
                                    4. ประมาณการวันเวลา และสถานที่ดำเนินกิจกรรม (กำหนดแยกตามกิจกรรมได้อิสระ):
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">วันที่เริ่มกิจกรรม:</label>
                                        <input
                                            type="date"
                                            value={actForm.start_date}
                                            onChange={(e) => setActForm({ ...actForm, start_date: e.target.value })}
                                            className="w-full rounded-lg border-slate-300 text-xs bg-white focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">วันที่สิ้นสุดกิจกรรม:</label>
                                        <input
                                            type="date"
                                            value={actForm.end_date}
                                            onChange={(e) => setActForm({ ...actForm, end_date: e.target.value })}
                                            className="w-full rounded-lg border-slate-300 text-xs bg-white focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">ประมาณการวัน/เวลา (ข้อความ):</label>
                                        <input
                                            type="text"
                                            value={actForm.operation_period_text}
                                            onChange={(e) => setActForm({ ...actForm, operation_period_text: e.target.value })}
                                            placeholder="เช่น 15-17 ธ.ค. 69 (08.30-16.30 น.)"
                                            className="w-full rounded-lg border-slate-300 text-xs bg-white focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">สถานที่ดำเนินกิจกรรม:</label>
                                        <input
                                            type="text"
                                            value={actForm.location}
                                            onChange={(e) => setActForm({ ...actForm, location: e.target.value })}
                                            placeholder="เช่น ห้องประชุม วิทยาลัยสารพัดช่างน่าน"
                                            className="w-full rounded-lg border-slate-300 text-xs bg-white focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">กลุ่มเป้าหมาย / จำนวนผู้เข้าร่วมกิจกรรม:</label>
                                        <input
                                            type="text"
                                            value={actForm.target_group}
                                            onChange={(e) => setActForm({ ...actForm, target_group: e.target.value })}
                                            placeholder="เช่น นักเรียน นักศึกษา 50 คน"
                                            className="w-full rounded-lg border-slate-300 text-xs bg-white focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 5. หลักการและเหตุผลของกิจกรรม */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-extrabold text-slate-800">5. หลักการและเหตุผลของกิจกรรม:</label>
                                    {project.background_rationale && (
                                        <button
                                            type="button"
                                            onClick={() => pullWholeFieldFromProject('background_rationale', project.background_rationale)}
                                            className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md cursor-pointer"
                                        >
                                            📥 ดึงจากโครงการหลัก
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    rows="2"
                                    value={actForm.background_rationale}
                                    onChange={(e) => setActForm({ ...actForm, background_rationale: e.target.value })}
                                    placeholder="ระบุหลักการและเหตุผลของการจัดกิจกรรมนี้..."
                                    className="w-full rounded-xl border-slate-300 text-xs focus:ring-indigo-500"
                                />
                            </div>

                            {/* 6. วัตถุประสงค์ของกิจกรรม (เลือกดึงทีละข้อจากโครงการหลักได้) */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-extrabold text-slate-800">6. วัตถุประสงค์ของกิจกรรม:</label>
                                    {project.objectives && (
                                        <button
                                            type="button"
                                            onClick={() => pullWholeFieldFromProject('objectives', project.objectives)}
                                            className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md cursor-pointer"
                                        >
                                            📥 ดึงวัตถุประสงค์ทั้งหมดจากโครงการหลัก
                                        </button>
                                    )}
                                </div>
                                {mainProjectObjectives.length > 0 && (
                                    <div className="bg-indigo-50/40 border border-indigo-100 rounded-lg p-2 space-y-1">
                                        <span className="text-[10px] font-bold text-indigo-800 block">
                                            คลิกเพื่อเลือกวัตถุประสงค์จากโครงการหลักมาใช้ในกิจกรรมนี้:
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {mainProjectObjectives.map((line, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => appendLineToField('objectives', line)}
                                                    className="text-left px-2 py-1 rounded-md text-[10px] font-semibold bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition cursor-pointer"
                                                    title="คลิกเพื่อเพิ่มเข้าในวัตถุประสงค์ของกิจกรรม"
                                                >
                                                    ➕ {line.length > 85 ? `${line.slice(0, 85)}...` : line}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <textarea
                                    rows="3"
                                    value={actForm.objectives}
                                    onChange={(e) => setActForm({ ...actForm, objectives: e.target.value })}
                                    placeholder="ระบุวัตถุประสงค์ของกิจกรรม (หรือคลิกเลือกจากโครงการหลักด้านบน)..."
                                    className="w-full rounded-xl border-slate-300 text-xs focus:ring-indigo-500"
                                />
                            </div>

                            {/* 7. เป้าหมายและตัวชี้วัดความสำเร็จของกิจกรรม */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-extrabold text-slate-800">7. เป้าหมายของกิจกรรม:</label>
                                        {project.targets && (
                                            <button
                                                type="button"
                                                onClick={() => pullWholeFieldFromProject('targets', project.targets)}
                                                className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md cursor-pointer"
                                            >
                                                📥 ดึงจากโครงการหลัก
                                            </button>
                                        )}
                                    </div>
                                    {mainProjectTargets.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {mainProjectTargets.slice(0, 4).map((line, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => appendLineToField('targets', line)}
                                                    className="text-left px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 cursor-pointer"
                                                >
                                                    ➕ {line.length > 45 ? `${line.slice(0, 45)}...` : line}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <textarea
                                        rows="2"
                                        value={actForm.targets}
                                        onChange={(e) => setActForm({ ...actForm, targets: e.target.value })}
                                        placeholder="เป้าหมายเชิงปริมาณ / เชิงคุณภาพของกิจกรรม..."
                                        className="w-full rounded-xl border-slate-300 text-xs focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-extrabold text-slate-800">8. ตัวชี้วัดความสำเร็จของกิจกรรม:</label>
                                        {project.indicators && (
                                            <button
                                                type="button"
                                                onClick={() => pullWholeFieldFromProject('indicators', project.indicators)}
                                                className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md cursor-pointer"
                                            >
                                                📥 ดึงจากโครงการหลัก
                                            </button>
                                        )}
                                    </div>
                                    {mainProjectIndicators.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {mainProjectIndicators.slice(0, 4).map((line, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => appendLineToField('indicators', line)}
                                                    className="text-left px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 cursor-pointer"
                                                >
                                                    ➕ {line.length > 45 ? `${line.slice(0, 45)}...` : line}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <textarea
                                        rows="2"
                                        value={actForm.indicators}
                                        onChange={(e) => setActForm({ ...actForm, indicators: e.target.value })}
                                        placeholder="เช่น ผู้เข้าร่วมกิจกรรมมีความพึงพอใจไม่น้อยกว่าร้อยละ 80..."
                                        className="w-full rounded-xl border-slate-300 text-xs focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* 9. ผลลัพธ์ / ผลที่คาดว่าจะได้รับของกิจกรรม (เลือกดึงทีละข้อจากโครงการหลักได้) */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-extrabold text-slate-800">9. ผลลัพธ์ / ผลที่คาดว่าจะได้รับของกิจกรรม:</label>
                                    {project.expected_benefits && (
                                        <button
                                            type="button"
                                            onClick={() => pullWholeFieldFromProject('expected_benefits', project.expected_benefits)}
                                            className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md cursor-pointer"
                                        >
                                            📥 ดึงผลลัพธ์ทั้งหมดจากโครงการหลัก
                                        </button>
                                    )}
                                </div>
                                {mainProjectBenefits.length > 0 && (
                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-2 space-y-1">
                                        <span className="text-[10px] font-bold text-emerald-900 block">
                                            คลิกเพื่อเลือกผลลัพธ์จากโครงการหลักมาใช้ในกิจกรรมนี้:
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {mainProjectBenefits.map((line, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => appendLineToField('expected_benefits', line)}
                                                    className="text-left px-2 py-1 rounded-md text-[10px] font-semibold bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-200 transition cursor-pointer"
                                                >
                                                    ➕ {line.length > 85 ? `${line.slice(0, 85)}...` : line}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <textarea
                                    rows="2"
                                    value={actForm.expected_benefits}
                                    onChange={(e) => setActForm({ ...actForm, expected_benefits: e.target.value })}
                                    placeholder="ระบุผลลัพธ์หรือผลที่คาดว่าจะได้รับจากการจัดกิจกรรมนี้..."
                                    className="w-full rounded-xl border-slate-300 text-xs focus:ring-indigo-500"
                                />
                            </div>

                            {/* 10. ขั้นตอนและรายละเอียดการดำเนินกิจกรรม */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-800 mb-1">10. ขั้นตอนและรายละเอียดการดำเนินกิจกรรม:</label>
                                <textarea
                                    rows="2"
                                    value={actForm.description}
                                    onChange={(e) => setActForm({ ...actForm, description: e.target.value })}
                                    placeholder="อธิบายขั้นตอน วิธีการ หรือขอบเขตการดำเนินกิจกรรม..."
                                    className="w-full rounded-xl border-slate-300 text-xs focus:ring-indigo-500"
                                />
                            </div>
                            </>
                            )}

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setActivityModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingActivity || isActBudgetOver}
                                    className="px-5 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md cursor-pointer"
                                >
                                    {savingActivity ? 'กำลังบันทึก...' : editingActivity ? '💾 บันทึกรายละเอียดกิจกรรม' : '➕ บันทึกและแจ้งเตือนผู้รับผิดชอบกิจกรรม'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: Create / Edit Procurement Set or Loan Set */}
            {setModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl border border-purple-200 w-full max-w-3xl overflow-hidden my-8">
                        <div
                            className={`px-5 py-4 text-white flex items-center justify-between ${
                                setForm.set_type === 'loan'
                                    ? 'bg-gradient-to-r from-amber-600 to-orange-600'
                                    : 'bg-gradient-to-r from-purple-700 to-indigo-700'
                            }`}
                        >
                            <div>
                                <h3 className="text-base font-black">
                                    {setForm.set_type === 'loan'
                                        ? editingSet ? '✏️ แก้ไขชุดสัญญายืมเงิน (กค. 101)' : '💵 สร้างชุดสัญญายืมเงิน (กค. 101) ตามกิจกรรม'
                                        : editingSet ? '✏️ แก้ไขชุดจัดซื้อจัดจ้าง' : '🛒 สร้างชุดจัดซื้อจัดจ้างตามกิจกรรม'}
                                </h3>
                                <p className="text-[11px] text-white/90">
                                    กิจกรรม: <b>{setForm.activity_name || project.title}</b> | วงเงินคงเหลือที่ตัดได้สูงสุด:{' '}
                                    <b>{formatCurrency(effectiveMaxForSet)}</b>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSetModalOpen(false)}
                                className="text-white/80 hover:text-white text-xl font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveSet} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1">
                                        ชื่อชุดเอกสาร: <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={setForm.set_name}
                                        onChange={(e) => setSetForm({ ...setForm, set_name: e.target.value })}
                                        className="w-full rounded-xl border-slate-300 text-xs font-semibold focus:ring-purple-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1">แผนกวิชา / งานที่ดำเนินการ:</label>
                                    <select
                                        value={setForm.department_id}
                                        onChange={(e) => setSetForm({ ...setForm, department_id: e.target.value })}
                                        className="w-full rounded-xl border-slate-300 text-xs font-semibold focus:ring-purple-500"
                                    >
                                        <option value="">-- ใช้แผนก/งานเดียวกับโครงการหลัก --</option>
                                        {allDepartments.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-extrabold text-slate-800">
                                        {setForm.set_type === 'loan' ? '💵 รายการค่าใช้จ่ายในสัญญายืมเงิน:' : '📦 รายการวัสดุอุปกรณ์ที่จะจัดซื้อจัดจ้าง:'}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSetForm({
                                                ...setForm,
                                                items: [
                                                    ...setForm.items,
                                                    { description: '', quantity: 1, unit: setForm.set_type === 'loan' ? 'รายการ' : 'ชุด', unit_price: 0 },
                                                ],
                                            })
                                        }
                                        className="px-2.5 py-1 text-[11px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg cursor-pointer"
                                    >
                                        + เพิ่มรายการ
                                    </button>
                                </div>

                                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-xs border-collapse">
                                        <thead className="bg-slate-100 text-slate-700 font-bold">
                                            <tr>
                                                <th className="p-2 text-center w-10">#</th>
                                                <th className="p-2 text-left">รายการ</th>
                                                <th className="p-2 text-center w-20">จำนวน</th>
                                                <th className="p-2 text-center w-24">หน่วยนับ</th>
                                                <th className="p-2 text-right w-28">ราคา/หน่วย</th>
                                                <th className="p-2 text-right w-28">รวม (บาท)</th>
                                                <th className="p-2 w-8"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {setForm.items.map((it, idx) => {
                                                const rowTotal = (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0);
                                                return (
                                                    <tr key={idx}>
                                                        <td className="p-2 text-center font-bold text-slate-500">{idx + 1}</td>
                                                        <td className="p-1.5">
                                                            <input
                                                                type="text"
                                                                value={it.description}
                                                                onChange={(e) => {
                                                                    const next = [...setForm.items];
                                                                    next[idx].description = e.target.value;
                                                                    setSetForm({ ...setForm, items: next });
                                                                }}
                                                                placeholder={setForm.set_type === 'loan' ? 'เช่น ค่าตอบแทนวิทยากร / ค่าอาหารกลางวัน' : 'ชื่อวัสดุ/อุปกรณ์...'}
                                                                className="w-full rounded-lg border-slate-300 text-xs"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="p-1.5">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0.01"
                                                                value={it.quantity}
                                                                onChange={(e) => {
                                                                    const next = [...setForm.items];
                                                                    next[idx].quantity = e.target.value;
                                                                    setSetForm({ ...setForm, items: next });
                                                                }}
                                                                className="w-full rounded-lg border-slate-300 text-xs text-center font-bold"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="p-1.5">
                                                            <input
                                                                type="text"
                                                                value={it.unit}
                                                                onChange={(e) => {
                                                                    const next = [...setForm.items];
                                                                    next[idx].unit = e.target.value;
                                                                    setSetForm({ ...setForm, items: next });
                                                                }}
                                                                className="w-full rounded-lg border-slate-300 text-xs text-center"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="p-1.5">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={it.unit_price}
                                                                onChange={(e) => {
                                                                    const next = [...setForm.items];
                                                                    next[idx].unit_price = e.target.value;
                                                                    setSetForm({ ...setForm, items: next });
                                                                }}
                                                                className="w-full rounded-lg border-slate-300 text-xs text-right font-bold text-emerald-700"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="p-2 text-right font-black text-slate-900">
                                                            {formatCurrency(rowTotal)}
                                                        </td>
                                                        <td className="p-1.5 text-center">
                                                            {setForm.items.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setSetForm({
                                                                            ...setForm,
                                                                            items: setForm.items.filter((_, i) => i !== idx),
                                                                        })
                                                                    }
                                                                    className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-black">
                                            <tr>
                                                <td colSpan="5" className="p-2.5 text-right text-slate-700">
                                                    รวมวงเงินชุดนี้ทั้งสิ้น:
                                                </td>
                                                <td className={`p-2.5 text-right text-sm ${isSetOverBudget ? 'text-rose-600' : 'text-emerald-700'}`}>
                                                    {formatCurrency(currentSetTotal)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                <div
                                    className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                        isSetOverBudget
                                            ? 'bg-rose-50 border-rose-300 text-rose-800'
                                            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                    }`}
                                >
                                    <span className="font-bold">
                                        {isSetOverBudget
                                            ? `🚨 เกินงบประมาณคงเหลืออยู่ ${formatCurrency(currentSetTotal - effectiveMaxForSet)} — ห้ามเกินวงเงินจัดสรร!`
                                            : `✅ อยู่ในวงเงินที่ได้รับจัดสรร (คงเหลือหลังตัดชุดนี้: ${formatCurrency(Math.max(0, effectiveMaxForSet - currentSetTotal))})`}
                                    </span>
                                    <span className="text-[11px] font-semibold">
                                        งบคงเหลือที่ตัดได้: {formatCurrency(effectiveMaxForSet)}
                                    </span>
                                </div>
                            </div>

                            {setForm.set_type === 'procurement' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-800 mb-1">ขอบเขตงาน / คุณลักษณะเฉพาะ (TOR):</label>
                                        <textarea
                                            rows="3"
                                            value={setForm.tor_specifications}
                                            onChange={(e) => setSetForm({ ...setForm, tor_specifications: e.target.value })}
                                            className="w-full rounded-xl border-slate-300 text-xs focus:ring-purple-500"
                                        />
                                    </div>
                                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-[11px] text-purple-900 flex items-center gap-2">
                                        <span>🔔</span>
                                        <span>
                                            <b>หมายเหตุคณะกรรมการ:</b> เมื่อบันทึกชุดจัดซื้อจัดจ้างนี้แล้ว ระบบจะส่งแจ้งเตือนไปยัง <b>เจ้าหน้าที่/หัวหน้างานพัสดุ</b> เพื่อเป็นผู้กำหนดรายชื่อคณะกรรมการจัดซื้อจัดจ้างและคณะกรรมการตรวจรับพัสดุโดยอัตโนมัติ
                                        </span>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSetModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingSet || isSetOverBudget}
                                    className={`px-5 py-2 rounded-xl text-xs font-extrabold text-white shadow-md disabled:opacity-50 cursor-pointer ${
                                        setForm.set_type === 'loan'
                                            ? 'bg-amber-600 hover:bg-amber-700'
                                            : 'bg-purple-700 hover:bg-purple-800'
                                    }`}
                                >
                                    {savingSet ? 'กำลังบันทึก...' : editingSet ? '💾 บันทึกการแก้ไข' : '✅ บันทึกชุดเอกสาร'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: Committee Appointment (Procurement Staff / Head / Admin ONLY) */}
            {committeeModalOpen && isProcStaffOrAdmin && committeeTargetSet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl border border-purple-200 w-full max-w-2xl overflow-hidden my-8">
                        <div className="bg-gradient-to-r from-purple-800 to-indigo-800 px-5 py-4 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black">👥 แต่งตั้งคณะกรรมการจัดซื้อจัดจ้าง และตรวจรับพัสดุ</h3>
                                <p className="text-[11px] text-purple-100">
                                    ชุดเอกสาร: <b>{committeeTargetSet.set_name || committeeTargetSet.procurement_number}</b> ({formatCurrency(committeeTargetSet.total_amount)}) • สิทธิ์เฉพาะงานพัสดุ
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCommitteeModalOpen(false)}
                                className="text-white/80 hover:text-white text-xl font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveCommittees} className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-200 space-y-3">
                                    <h4 className="text-xs font-black text-purple-900 border-b border-purple-200 pb-1.5">
                                        📋 1. คณะกรรมการจัดซื้อ/จัดจ้าง
                                    </h4>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">ประธานกรรมการจัดซื้อ</label>
                                        <select
                                            value={commForm.purchasing_chair}
                                            onChange={(e) => setCommForm({ ...commForm, purchasing_chair: e.target.value })}
                                            className="w-full rounded-lg border-purple-200 text-xs"
                                        >
                                            <option value="">-- เลือกบุคลากร --</option>
                                            {allUsers.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">กรรมการจัดซื้อ (คนที่ 1)</label>
                                        <select
                                            value={commForm.purchasing_member1}
                                            onChange={(e) => setCommForm({ ...commForm, purchasing_member1: e.target.value })}
                                            className="w-full rounded-lg border-purple-200 text-xs"
                                        >
                                            <option value="">-- เลือกบุคลากร --</option>
                                            {allUsers.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">กรรมการจัดซื้อ (คนที่ 2)</label>
                                        <select
                                            value={commForm.purchasing_member2}
                                            onChange={(e) => setCommForm({ ...commForm, purchasing_member2: e.target.value })}
                                            className="w-full rounded-lg border-purple-200 text-xs"
                                        >
                                            <option value="">-- เลือกบุคลากร --</option>
                                            {allUsers.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200 space-y-3">
                                    <h4 className="text-xs font-black text-emerald-900 border-b border-emerald-200 pb-1.5">
                                        🔍 2. คณะกรรมการตรวจรับพัสดุ
                                    </h4>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">ประธานกรรมการตรวจรับ</label>
                                        <select
                                            value={commForm.inspection_chair}
                                            onChange={(e) => setCommForm({ ...commForm, inspection_chair: e.target.value })}
                                            className="w-full rounded-lg border-emerald-200 text-xs"
                                        >
                                            <option value="">-- เลือกบุคลากร --</option>
                                            {allUsers.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">กรรมการตรวจรับ (คนที่ 1)</label>
                                        <select
                                            value={commForm.inspection_member1}
                                            onChange={(e) => setCommForm({ ...commForm, inspection_member1: e.target.value })}
                                            className="w-full rounded-lg border-emerald-200 text-xs"
                                        >
                                            <option value="">-- เลือกบุคลากร --</option>
                                            {allUsers.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">กรรมการตรวจรับ (คนที่ 2)</label>
                                        <select
                                            value={commForm.inspection_member2}
                                            onChange={(e) => setCommForm({ ...commForm, inspection_member2: e.target.value })}
                                            className="w-full rounded-lg border-emerald-200 text-xs"
                                        >
                                            <option value="">-- เลือกบุคลากร --</option>
                                            {allUsers.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setCommitteeModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingCommittee}
                                    className="px-5 py-2 rounded-xl text-xs font-extrabold bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white shadow-md cursor-pointer"
                                >
                                    {savingCommittee ? 'กำลังบันทึก...' : '💾 บันทึกคำสั่งแต่งตั้งคณะกรรมการ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
