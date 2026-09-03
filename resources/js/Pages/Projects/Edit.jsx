import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';
import ProjectWorkflowStepper from '@/Components/ProjectWorkflowStepper';

export default function Edit({ project, strategyCategories = [], iqaStrategies = [], ovecStrategies = [], nationalStrategies = [], provincialStrategies = [], departments = [] }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const isPlanOrAdmin = user?.is_admin || 
                          user?.role?.name === 'admin' || 
                          user?.role === 'admin' || 
                          user?.role?.name === 'plan_head' || 
                          user?.role === 'plan_head' || 
                          user?.department?.code === 'PLAN' || 
                          (user?.department?.name && user.department.name.includes('แผน'));

    const isBudgetApproved = project.status === 'budget_approved' || project.status === 'approved' || (project.allocated_budget && project.allocated_budget > 0);
    const isTitleLocked = isBudgetApproved && !isPlanOrAdmin;

    const [generatingAi, setGeneratingAi] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialQuant = Array.isArray(project?.targets?.quantitative) && project.targets.quantitative.length > 0
        ? project.targets.quantitative
        : ['นักเรียน นักศึกษา และผู้เข้าร่วมโครงการ จำนวนไม่น้อยกว่า 50 คน', 'มีการจัดกิจกรรมและการดำเนินงานตามโครงการ จำนวน 1 โครงการ'];

    const initialQual = Array.isArray(project?.targets?.qualitative) && project.targets.qualitative.length > 0
        ? project.targets.qualitative
        : ['ผู้เข้าร่วมโครงการมีความรู้ ความเข้าใจ และทักษะเพิ่มขึ้นไม่น้อยกว่าร้อยละ 85', 'ผู้เข้าร่วมโครงการมีความพึงพอใจต่อภาพรวมของการจัดโครงการในระดับดีมาก (ร้อยละ 90 ขึ้นไป)'];

    const defaultOutputs = [
        `ผู้เข้าร่วมโครงการใน "${project?.title || 'โครงการ'}" ได้รับการฝึกอบรมและพัฒนาสมรรถนะครบถ้วนตามเกณฑ์ จำนวนไม่น้อยกว่า 50 คน`,
        'มีเอกสาร สื่อการเรียนรู้ หรือผลงานจากการดำเนินโครงการที่นำไปใช้ประโยชน์ได้จริงอย่างน้อย 1 รายการ'
    ];

    const defaultOutcomes = [
        `ผู้เรียนและบุคลากรสามารถนำองค์ความรู้และทักษะจากโครงการไปประยุกต์ใช้ในการปฏิบัติงานจริงได้อย่างมีประสิทธิภาพ`,
        'วิทยาลัยสารพัดช่างน่านมีมาตรฐานการจัดการเรียนการสอนและการบริการวิชาชีพที่ได้รับการยอมรับจากชุมชนและสถานประกอบการ'
    ];

    const defaultExpectedBenefits = [
        'ผู้เข้าร่วมโครงการมีทักษะและสมรรถนะตรงตามมาตรฐานวิชาชีพและความต้องการของตลาดแรงงานในยุคดิจิทัล',
        'สถานศึกษามีผลการดำเนินงานที่ตอบสนองต่อนโยบายของสำนักงานคณะกรรมการการอาชีวศึกษาและยุทธศาสตร์การพัฒนาจังหวัดน่าน',
        'สร้างภาพลักษณ์ที่ดีและเพิ่มความเชื่อมั่นให้กับผู้ปกครอง ชุมชน และสถานประกอบการในการจัดการศึกษาของวิทยาลัย'
    ];

    const defaultIndicators = {
        quantitative: {
            text: project?.indicators?.quantitative?.text || `ผู้เข้าร่วมโครงการใน "${project?.title || 'โครงการ'}" เข้าร่วมกิจกรรมครบถ้วนตามเกณฑ์ คิดเป็นร้อยละ 100`,
            unit: project?.indicators?.quantitative?.unit || '50 คน'
        },
        qualitative: {
            text: project?.indicators?.qualitative?.text || 'ผู้เข้าร่วมมีความพึงพอใจต่อการดำเนินงานและได้รับความรู้ทักษะเพิ่มขึ้นในระดับดีมาก',
            unit: project?.indicators?.qualitative?.unit || 'ร้อยละ 90'
        },
        time: {
            text: project?.indicators?.time?.text || 'ดำเนินการแล้วเสร็จตามระยะเวลาและปฏิทินปฏิบัติงานที่กำหนด',
            unit: project?.indicators?.time?.unit || '1 ภาคเรียน'
        },
        cost: {
            text: project?.indicators?.cost?.text || 'ค่าใช้จ่ายในการดำเนินโครงการเป็นไปตามวงเงินงบประมาณที่ได้รับจัดสรร',
            unit: project?.indicators?.cost?.unit || `${parseFloat(project?.estimated_budget || 0).toLocaleString()} บาท`
        }
    };

    const defaultActionPlan = [
        { step_name: '1. ประชุมวางแผน จัดทำและเสนอโครงการเพื่อขออนุมัติ', q1: true, q2: false, q3: false, q4: false, target_count: '1 โครงการ', location_name: 'วช.น่าน', budget_operating: 0 },
        { step_name: '2. แต่งตั้งคณะกรรมการ เตรียมการจัดซื้อจัดจ้างและประสานงาน', q1: false, q2: true, q3: false, q4: false, target_count: '1 ครั้ง', location_name: 'วช.น่าน', budget_operating: 0 },
        { step_name: '3. ดำเนินการจัดกิจกรรม/โครงการตามแผนที่กำหนด', q1: false, q2: false, q3: true, q4: false, target_count: '50 คน', location_name: 'วช.น่าน', budget_operating: project?.estimated_budget || 0 },
        { step_name: '4. สรุปผลการประเมินความพึงพอใจและจัดทำรายงานฉบับสมบูรณ์', q1: false, q2: false, q3: false, q4: true, target_count: '1 เล่ม', location_name: 'วช.น่าน', budget_operating: 0 },
    ];

    // Multi-Activity Default Structure
    const budgetAmount = parseFloat(project?.estimated_budget || 0);

    const defaultActivities = [
        {
            name: 'กิจกรรมที่ ๑ : อบรมเชิงปฏิบัติการพัฒนาทักษะวิชาชีพและการประยุกต์ใช้งาน',
            location: 'ณ วิทยาลัยสารพัดช่างน่าน',
            target_group: 'นักเรียน นักศึกษา และบุคลากร จำนวน 50 คน',
            loan_items: [
                { description: '๑. ค่าตอบแทนวิทยากรบรรยายและฝึกปฏิบัติการ (6 ชม. x 600 บาท)', quantity: 6, unit: 'ชั่วโมง', unit_price: 600, total_price: 3600 },
                { description: '๒. ค่าอาหารกลางวันสำหรับผู้เข้าร่วมโครงการ (50 คน x 80 บาท x 1 มื้อ)', quantity: 50, unit: 'คน', unit_price: 80, total_price: 4000 },
                { description: '๓. ค่าอาหารว่างและเครื่องดื่ม (50 คน x 35 บาท x 2 มื้อ)', quantity: 50, unit: 'คน', unit_price: 70, total_price: 3500 },
                { description: '๔. ค่าใช้จ่ายในการเดินทางไปราชการ / ค่าพาหนะ', quantity: 1, unit: 'งาน', unit_price: 0, total_price: 0 },
            ],
            procurement_items: [
                { description: '๑. ค่าวัสดุ อุปกรณ์ และเอกสารประกอบการฝึกอบรม', quantity: 1, unit: 'ชุด', unit_price: Math.max(0, budgetAmount - 11100), total_price: Math.max(0, budgetAmount - 11100) },
                { description: '๒. ค่าจ้างเหมาบริการจัดทำป้ายและสื่อประชาสัมพันธ์', quantity: 1, unit: 'งาน', unit_price: 0, total_price: 0 },
            ]
        }
    ];

    const initialActivities = Array.isArray(project?.activities) && project.activities.length > 0
        ? project.activities
        : defaultActivities;

    // Initialize dynamic strategy selections
    const initialSelections = project?.strategy_selections || {};
    strategyCategories.forEach(cat => {
        if (!initialSelections[cat.id]) {
            initialSelections[cat.id] = cat.items?.[0]?.id ? [cat.items[0].id] : [];
        }
    });

    const { data, setData, patch, processing, errors } = useForm({
        title: project?.title || '',
        academic_year: project?.academic_year || 2569,
        responsible_person: project?.responsible_person || project?.user?.name || '',
        position: project?.position || 'ครูผู้สอน / ผู้รับผิดชอบโครงการ',
        phone: project?.phone || '',
        email: project?.email || project?.user?.email || '',
        location: project?.location || 'ณ วิทยาลัยสารพัดช่างน่าน',
        mission: project?.mission || 'ผลิตและพัฒนากำลังคนด้านวิชาชีพให้มีคุณภาพตามมาตรฐานการอาชีวศึกษา',
        goal: project?.goal || 'ผู้เรียนและผู้สำเร็จการศึกษามีความรู้ ทักษะ การประยุกต์ใช้และมีคุณธรรม จริยธรรม ตามมาตรฐานวิชาชีพ',
        strategy_tactic: project?.strategy_tactic || 'ส่งเสริมด้านวิชาการ คุณธรรม จริยธรรม และค่านิยมที่ดีงามในวิชาชีพ',
        background_rationale: project?.background_rationale || '',
        objectives: project?.objectives && project.objectives.length > 0 ? project.objectives : [''],
        outputs: project?.outputs && project.outputs.length > 0 ? project.outputs : defaultOutputs,
        outcomes: project?.outcomes && project.outcomes.length > 0 ? project.outcomes : defaultOutcomes,
        targets: {
            quantitative: initialQuant,
            qualitative: initialQual,
        },
        expected_benefits: project?.expected_benefits && project.expected_benefits.length > 0 ? project.expected_benefits : defaultExpectedBenefits,
        indicators: project?.indicators || defaultIndicators,
        action_plan: project?.action_plan && project.action_plan.length > 0 ? project.action_plan : defaultActionPlan,
        activities: initialActivities,
        strategy_selections: initialSelections,
        iqa_strategy_ids: project?.iqa_strategy_ids || [],
        ovec_strategy_ids: project?.ovec_strategy_ids || [],
        national_strategy_ids: project?.national_strategy_ids || [],
        provincial_strategy_ids: project?.provincial_strategy_ids || [],
        estimated_budget: project?.estimated_budget || '',
    });

    // Multi-Activity Grand Totals & Remaining Balance Calculations
    const allocatedBudget = parseFloat(data.estimated_budget || 0);
    const totalLoanAllActivities = (data.activities || []).reduce((sum, act) => {
        return sum + (act.loan_items || []).reduce((lSum, item) => lSum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)), 0);
    }, 0);

    const totalProcurementAllActivities = (data.activities || []).reduce((sum, act) => {
        return sum + (act.procurement_items || []).reduce((pSum, item) => pSum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)), 0);
    }, 0);

    const grandTotalBudget = totalLoanAllActivities + totalProcurementAllActivities;
    const remainingBudget = allocatedBudget - grandTotalBudget;
    const usedPercentage = allocatedBudget > 0 ? ((grandTotalBudget / allocatedBudget) * 100).toFixed(1) : 0;

    // Universal AI Generator Handler
    const handleGenerateAi = async (type, successMessage) => {
        if (!data.title.trim()) {
            Swal.fire('คำแนะนำ', 'กรุณาระบุชื่อโครงการก่อน ให้ AI ช่วยประมวลผล', 'info');
            return;
        }

        setGeneratingAi(true);
        try {
            const res = await axios.post(route('projects.generate_ai_content'), {
                type: type,
                title: data.title,
                budget: data.estimated_budget,
            });

            if (res.data?.success) {
                if (type === 'rationale' && res.data.content) {
                    setData('background_rationale', res.data.content);
                } else if (type === 'objectives' && res.data.objectives) {
                    setData('objectives', res.data.objectives);
                } else if (type === 'targets') {
                    setData('targets', {
                        quantitative: res.data.quantitative || data.targets.quantitative,
                        qualitative: res.data.qualitative || data.targets.qualitative,
                    });
                } else if (type === 'outputs' && res.data.outputs) {
                    setData('outputs', res.data.outputs);
                } else if (type === 'outcomes' && res.data.outcomes) {
                    setData('outcomes', res.data.outcomes);
                } else if (type === 'expected_benefits' && res.data.expected_benefits) {
                    setData('expected_benefits', res.data.expected_benefits);
                } else if (type === 'action_plan' && res.data.action_plan) {
                    setData('action_plan', res.data.action_plan);
                } else if (type === 'indicators' && res.data.indicators) {
                    setData('indicators', res.data.indicators);
                } else if ((type === 'activities' || type === 'procurement_items') && res.data.activities) {
                    setData('activities', res.data.activities);
                }
                Swal.fire('✨ AI ประมวลผลสำเร็จ!', successMessage, 'success');
            }
        } catch (err) {
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้', 'error');
        } finally {
            setGeneratingAi(false);
        }
    };

    // Generic Multi-item Handlers
    const handleArrayChange = (field, index, value) => {
        const list = [...(data[field] || [])];
        list[index] = value;
        setData(field, list);
    };

    const addArrayItem = (field) => {
        setData(field, [...(data[field] || []), '']);
    };

    const removeArrayItem = (field, index) => {
        const list = [...(data[field] || [])];
        list.splice(index, 1);
        setData(field, list);
    };

    // Indicator handlers
    const handleIndicatorChange = (type, key, value) => {
        setData('indicators', {
            ...data.indicators,
            [type]: {
                ...(data.indicators?.[type] || {}),
                [key]: value
            }
        });
    };

    // Action Plan Handlers
    const handleActionPlanChange = (index, field, value) => {
        const plan = [...(data.action_plan || [])];
        plan[index] = { ...plan[index], [field]: value };
        setData('action_plan', plan);
    };

    const addActionPlanRow = () => {
        const nextIndex = (data.action_plan || []).length + 1;
        setData('action_plan', [
            ...(data.action_plan || []),
            {
                step_name: `${nextIndex}. ดำเนินกิจกรรมเพิ่มเติม`,
                q1: false,
                q2: false,
                q3: false,
                q4: false,
                target_count: '50 คน',
                location_name: 'วช.น่าน',
                budget_operating: 0
            }
        ]);
    };

    const removeActionPlanRow = (index) => {
        const plan = [...(data.action_plan || [])];
        plan.splice(index, 1);
        setData('action_plan', plan);
    };

    // Multi-Activity Handlers
    const handleActivityChange = (actIdx, field, value) => {
        const acts = [...(data.activities || [])];
        acts[actIdx] = { ...acts[actIdx], [field]: value };
        setData('activities', acts);
    };

    const addActivity = () => {
        const nextIdx = (data.activities || []).length + 1;
        setData('activities', [
            ...(data.activities || []),
            {
                name: `กิจกรรมที่ ${nextIdx} : ดำเนินกิจกรรมเพิ่มเติม`,
                location: 'ณ วิทยาลัยสารพัดช่างน่าน',
                target_group: 'นักเรียน นักศึกษา 50 คน',
                loan_items: [
                    { description: '๑. ค่าตอบแทนวิทยากร', quantity: 6, unit: 'ชั่วโมง', unit_price: 600, total_price: 3600 },
                    { description: '๒. ค่าอาหารกลางวัน', quantity: 50, unit: 'คน', unit_price: 80, total_price: 4000 },
                    { description: '๓. ค่าอาหารว่างและเครื่องดื่ม', quantity: 50, unit: 'คน', unit_price: 70, total_price: 3500 },
                ],
                procurement_items: [
                    { description: '๑. ค่าวัสดุ อุปกรณ์ดำเนินกิจกรรม', quantity: 1, unit: 'ชุด', unit_price: 0, total_price: 0 },
                ]
            }
        ]);
    };

    const removeActivity = (actIdx) => {
        const acts = [...(data.activities || [])];
        acts.splice(actIdx, 1);
        setData('activities', acts);
    };

    // Activity Item Handlers (Loan & Procurement)
    const handleActivityItemChange = (actIdx, type, itemIdx, field, value) => {
        const acts = [...(data.activities || [])];
        const items = [...(acts[actIdx][type] || [])];
        items[itemIdx] = { ...items[itemIdx], [field]: value };
        const qty = parseFloat(items[itemIdx].quantity) || 0;
        const price = parseFloat(items[itemIdx].unit_price) || 0;
        items[itemIdx].total_price = qty * price;
        acts[actIdx][type] = items;
        setData('activities', acts);
    };

    const addActivityItemRow = (actIdx, type) => {
        const acts = [...(data.activities || [])];
        acts[actIdx][type] = [
            ...(acts[actIdx][type] || []),
            { description: '', quantity: 1, unit: 'รายการ', unit_price: 0, total_price: 0 }
        ];
        setData('activities', acts);
    };

    const removeActivityItemRow = (actIdx, type, itemIdx) => {
        const acts = [...(data.activities || [])];
        const items = [...(acts[actIdx][type] || [])];
        items.splice(itemIdx, 1);
        acts[actIdx][type] = items;
        setData('activities', acts);
    };

    // Dynamic Strategy Handler
    const toggleDynamicStrategy = (catId, itemId) => {
        const currentCatItems = data.strategy_selections[catId] || [];
        const updatedCatItems = currentCatItems.includes(itemId)
            ? currentCatItems.filter(id => id !== itemId)
            : [...currentCatItems, itemId];

        setData('strategy_selections', {
            ...data.strategy_selections,
            [catId]: updatedCatItems
        });
    };

    // Standard Items Live Search & Autocomplete
    const [standardItemSuggestions, setStandardItemSuggestions] = useState([]);
    const [activeSuggestionKey, setActiveSuggestionKey] = useState(null);
    const [isSearchingItems, setIsSearchingItems] = useState(false);
    const [showQuickAddItemModal, setShowQuickAddItemModal] = useState(false);
    const [quickAddItemData, setQuickAddItemData] = useState({ name: '', unit: 'ชิ้น', standard_price: 0, category: 'วัสดุทั่วไป' });

    const handleItemDescriptionChange = (actIdx, pIdx, value) => {
        handleActivityItemChange(actIdx, 'procurement_items', pIdx, 'description', value);
        
        const key = `${actIdx}-${pIdx}`;
        setActiveSuggestionKey(key);

        if (!value || value.trim().length < 1) {
            setStandardItemSuggestions([]);
            return;
        }

        setIsSearchingItems(true);
        axios.get(route('standard_items.search'), { params: { q: value.trim() } })
            .then(res => {
                if (res.data && res.data.items) {
                    setStandardItemSuggestions(res.data.items);
                }
            })
            .catch(() => {})
            .finally(() => setIsSearchingItems(false));
    };

    const selectStandardItem = (actIdx, pIdx, item) => {
        const acts = [...(data.activities || [])];
        const pItems = [...(acts[actIdx].procurement_items || [])];
        pItems[pIdx] = {
            ...pItems[pIdx],
            description: item.name,
            unit: item.unit || 'ชิ้น',
            unit_price: parseFloat(item.standard_price) || 0,
            total_price: (parseFloat(pItems[pIdx].quantity) || 1) * (parseFloat(item.standard_price) || 0)
        };
        acts[actIdx].procurement_items = pItems;
        setData('activities', acts);
        setActiveSuggestionKey(null);
        setStandardItemSuggestions([]);
    };

    const handleSaveNewStandardItem = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(route('standard_items.store'), quickAddItemData);
            if (res.data && res.data.item) {
                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกสำเร็จ!',
                    text: `บันทึก "${res.data.item.name}" เข้าสู่คลังข้อมูลราคากลางเรียบร้อยแล้ว`,
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowQuickAddItemModal(false);
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกรายการได้ กรุณาตรวจสอบข้อมูล'
            });
        }
    };

    const prepareSubmitData = (submitApproval = false) => {
        // Flatten only actual procurement items (พัสดุ/วัสดุ/ครุภัณฑ์/จ้างทำของ) for procurement stage
        // Note: Loan items (ค่าตอบแทน, ค่าอาหาร, ค่าใช้จ่ายเดินทาง) are for Loan Contract (กค.๑๐๑) and go directly to Finance!
        const flattenedProcurementItems = [];
        (data.activities || []).forEach((act, actIdx) => {
            const actLabel = `[กิจกรรมที่ ${actIdx + 1}]`;
            (act.procurement_items || []).forEach(item => {
                if (item.description && item.description.trim() !== '') {
                    flattenedProcurementItems.push({
                        description: `${actLabel} ${item.description}`,
                        quantity: item.quantity,
                        unit: item.unit,
                        unit_price: item.unit_price,
                        total_price: item.total_price,
                    });
                }
            });
        });

        return {
            ...data,
            procurement_items: flattenedProcurementItems,
            submit_approval: submitApproval
        };
    };

    const handleSaveDraft = (e) => {
        if (e) e.preventDefault();
        router.patch(route('projects.update', project.id), prepareSubmitData(false), {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: '💾 บันทึกแบบร่างสำเร็จ!',
                    text: 'ระบบบันทึกข้อมูลเรียบร้อยแล้ว ท่านสามารถกรอกรายละเอียดเพิ่มเติมต่อได้ทันที',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    };

    const handleSaveAndSubmit = (e) => {
        if (e) e.preventDefault();
        Swal.fire({
            title: '🚀 ยื่นขออนุมัติโครงการ?',
            text: 'ระบบจะส่งเรื่องไปยัง "ขั้นตอนที่ 2: หัวหน้าแผนกวิชา/หัวหน้างาน" พร้อมแยกรายละเอียดสัญญายืมเงินและจัดซื้อจัดจ้างรายกิจกรรมให้อัตโนมัติ (และจะล็อคการแก้ไข)',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: '🚀 ยืนยันยื่นขออนุมัติ',
            cancelButtonText: 'ยกเลิก',
        }).then((result) => {
            if (result.isConfirmed) {
                setIsSubmitting(true);
                router.patch(route('projects.update', project.id), prepareSubmitData(true), {
                    onFinish: () => setIsSubmitting(false),
                    onError: () => setIsSubmitting(false),
                });
            }
        });
    };

    const handleSubmit = handleSaveDraft;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black leading-tight text-purple-950 font-sans">
                            📄 จัดทำ/แก้ไขแบบเสนอโครงการฉบับเต็ม (Full Proposal - ๑๔ หัวข้อ)
                        </h2>
                        <p className="text-xs text-slate-500 font-sans mt-0.5">
                            รองรับโครงการหลายกิจกรรมย่อย (Multi-Activity) พร้อมแยกสัญญายืมเงินและจัดซื้อจัดจ้าง
                        </p>
                    </div>
                    <div className="flex items-center gap-x-2">
                        <a
                            href={route('projects.print', project.id)}
                            target="_blank"
                            className="rounded-xl bg-purple-100 text-purple-800 border border-purple-200 px-4 py-2 text-xs font-bold hover:bg-purple-200 transition-all flex items-center gap-1.5"
                        >
                            🖨️ ดูตัวอย่างเอกสารฉบับพิมพ์
                        </a>
                        <Link
                            href={route('dashboard')}
                            className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-xs font-bold text-purple-800 shadow-xs hover:bg-purple-50 transition-all"
                        >
                            ← ศูนย์ควบคุม
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`จัดทำโครงการฉบับเต็ม: ${project?.title}`} />

            <div className="py-8 font-sans">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Stepper Bar */}
                    <ProjectWorkflowStepper currentStep={project.current_approval_step || 1} status={project.status} />

                    <div className="rounded-3xl border border-purple-100 bg-white p-6 md:p-8 shadow-sm">
                        {project.status === 'pending_approval' && !isPlanOrAdmin && (
                            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🔒</span>
                                    <div>
                                        <p className="font-black text-sm text-amber-950">โครงการนี้อยู่ระหว่างขั้นตอนการพิจารณาอนุมัติ (ขั้นตอนที่ {project.current_approval_step || 2})</p>
                                        <p className="font-normal text-[11px] text-amber-800 mt-0.5">ระบบล็อคการแก้ไขโครงการฉบับเต็มเรียบร้อยแล้ว หากต้องการปรับแก้กรุณาติดต่อหัวหน้างานแผนงานหรือผู้ดูแลระบบ</p>
                                    </div>
                                </div>
                                <Link href={route('projects.show', project.id)} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs shrink-0">
                                    ติดตามสถานะโครงการ ➔
                                </Link>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Section 1: ข้อมูลพื้นฐาน & ผู้รับผิดชอบโครงการ */}
                            <div className="space-y-4 bg-purple-50/20 p-5 rounded-2xl border border-purple-100">
                                <div className="border-b border-purple-100 pb-3 flex justify-between items-center">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block">ส่วนที่ ๑ : ข้อมูลทั่วไป & ผู้รับผิดชอบโครงการ</span>
                                        <h3 className="text-base font-bold text-purple-950">๑. ชื่อโครงการ & รายละเอียดผู้เสนอโครงการ</h3>
                                    </div>
                                    <span className="text-xs text-purple-700 font-bold bg-purple-100 px-3 py-1 rounded-full">
                                        ปีงบประมาณ พ.ศ. {data.academic_year}
                                    </span>
                                </div>

                                {/* Project Title */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-slate-700">
                                            ชื่อโครงการ (Project Title) *
                                        </label>
                                        {isTitleLocked ? (
                                            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                🔒 อนุมัติจัดสรรงบแล้ว (หากต้องการปรับแก้ชื่อกรุณาแจ้งงานแผนงาน/ผู้ดูแลระบบ)
                                            </span>
                                        ) : isBudgetApproved && isPlanOrAdmin ? (
                                            <span className="text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                👑 สิทธิ์งานแผนงาน/ผู้ดูแลระบบ: ปลดล็อคแก้ไขชื่อโครงการได้
                                            </span>
                                        ) : null}
                                    </div>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => !isTitleLocked && setData('title', e.target.value)}
                                        disabled={isTitleLocked}
                                        readOnly={isTitleLocked}
                                        className={`w-full rounded-xl px-4 py-2.5 text-sm transition ${
                                            isTitleLocked 
                                                ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed select-none font-bold shadow-inner' 
                                                : 'border-purple-200 focus:border-purple-500 focus:ring-purple-500'
                                        }`}
                                        required
                                    />
                                    {errors.title && <span className="text-xs text-rose-500 mt-1 block">{errors.title}</span>}
                                </div>

                                {/* Academic Year & Budget */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            ปีการศึกษา พ.ศ. (Academic Year) *
                                        </label>
                                        <input
                                            type="number"
                                            value={data.academic_year}
                                            onChange={(e) => setData('academic_year', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-purple-500"
                                            required
                                        />
                                        {errors.academic_year && <span className="text-xs text-rose-500 mt-1 block">{errors.academic_year}</span>}
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block text-xs font-bold text-slate-700">
                                                วงเงินงบประมาณที่ได้รับจัดสรร (บาท) *
                                            </label>
                                            {isTitleLocked ? (
                                                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                                                    🔒 วงเงินตามมติจัดสรร (แจ้งงานแผนงานหากต้องการปรับลด/เพิ่ม)
                                                </span>
                                            ) : isBudgetApproved && isPlanOrAdmin ? (
                                                <span className="text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-300 px-2 py-0.5 rounded-full">
                                                    👑 สิทธิ์งานแผนงาน: ปรับวงเงินงบประมาณได้
                                                </span>
                                            ) : null}
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.estimated_budget}
                                            onChange={(e) => !isTitleLocked && setData('estimated_budget', e.target.value)}
                                            disabled={isTitleLocked}
                                            readOnly={isTitleLocked}
                                            className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                                                isTitleLocked 
                                                    ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed select-none shadow-inner' 
                                                    : 'border-purple-200 text-purple-900 focus:border-purple-500 focus:ring-purple-500'
                                            }`}
                                            required
                                        />
                                        {errors.estimated_budget && <span className="text-xs text-rose-500 mt-1 block">{errors.estimated_budget}</span>}
                                    </div>
                                </div>

                                {/* Responsible Person & Position & Contact */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">ผู้รับผิดชอบโครงการ (ชื่อ-สกุล) *</label>
                                        <input
                                            type="text"
                                            value={data.responsible_person}
                                            onChange={(e) => setData('responsible_person', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-4 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                            placeholder="เช่น นายสมศักดิ์ ครูผู้สอน"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">ตำแหน่ง *</label>
                                        <input
                                            type="text"
                                            value={data.position}
                                            onChange={(e) => setData('position', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-4 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                            placeholder="เช่น ครู วิทยฐานะชำนาญการ"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">โทรศัพท์เคลื่อนที่</label>
                                        <input
                                            type="text"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-4 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                            placeholder="เช่น 081-2345678"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">E-mail</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-4 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                            placeholder="example@npc.ac.th"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: ลักษณะโครงการและความสอดคล้องกับยุทธศาสตร์ */}
                            <div className="space-y-6 bg-purple-50/20 p-5 rounded-2xl border border-purple-100">
                                <div className="border-b border-purple-100 pb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block">ส่วนที่ ๒ : ความสอดคล้องกับแผนพัฒนาสถานศึกษา & ยุทธศาสตร์</span>
                                    <h3 className="text-base font-bold text-purple-950">๒. ลักษณะโครงการตามแผนพัฒนาการจัดการศึกษา วิทยาลัยสารพัดช่างน่าน & เช็คลิสต์ยุทธศาสตร์ ๔ ด้าน</h3>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">๒.๑ พันธกิจที่สอดคล้อง (Mission)</label>
                                        <input
                                            type="text"
                                            value={data.mission}
                                            onChange={(e) => setData('mission', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-4 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                            placeholder="ระบุพันธกิจ..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">๒.๒ เป้าประสงค์ (Goal)</label>
                                            <input
                                                type="text"
                                                value={data.goal}
                                                onChange={(e) => setData('goal', e.target.value)}
                                                className="w-full rounded-xl border-purple-200 px-4 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                                placeholder="ระบุเป้าประสงค์..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">๒.๓ กลยุทธ์ (Tactic/Strategy)</label>
                                            <input
                                                type="text"
                                                value={data.strategy_tactic}
                                                onChange={(e) => setData('strategy_tactic', e.target.value)}
                                                className="w-full rounded-xl border-purple-200 px-4 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                                                placeholder="ระบุกลยุทธ์..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Strategy Checklists */}
                                <div className="pt-2">
                                    <h4 className="text-xs font-bold text-purple-900 mb-2">๒.๔ สอดคล้องกับยุทธศาสตร์ นโยบาย และมาตรฐานการอาชีวศึกษา (ติ๊กเลือกข้อที่เกี่ยวข้องได้มากกว่า 1 ข้อ):</h4>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {strategyCategories.map((cat, catIdx) => {
                                            const selectedIds = data.strategy_selections[cat.id] || [];
                                            return (
                                                <div key={cat.id} className="space-y-2 bg-white p-3.5 rounded-xl border border-purple-100">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <label className="block text-xs font-bold text-purple-950">
                                                            {catIdx + 1}. {cat.name}
                                                        </label>
                                                        <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                                                            เลือก {selectedIds.length} ข้อ
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                                        {(cat.items || []).map(item => {
                                                            const isChecked = selectedIds.includes(item.id);
                                                            return (
                                                                <label
                                                                    key={item.id}
                                                                    className={`flex items-start gap-x-2 p-2 rounded-lg border transition-all cursor-pointer text-xs ${
                                                                        isChecked
                                                                            ? 'bg-purple-100/80 border-purple-400 font-bold text-purple-950'
                                                                            : 'bg-slate-50/50 border-purple-50 text-slate-700 hover:bg-purple-50'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={() => toggleDynamicStrategy(cat.id, item.id)}
                                                                        className="mt-0.5 rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                                                                    />
                                                                    <span>{item.name}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Background Rationale */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        ๓. ความสำคัญของโครงการ / หลักการและเหตุผล (Background & Rationale) *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleGenerateAi('rationale', 'ยกร่างหลักการและเหตุผลตามมาตรฐานวิทยาลัยสารพัดช่างน่านเรียบร้อยแล้ว')}
                                        disabled={generatingAi}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 shadow-2xs transition-all disabled:opacity-50"
                                    >
                                        {generatingAi ? '🪄 AI กำลังจัดพิมพ์...' : '✨ ให้ AI ช่วยเขียนหลักการและเหตุผล'}
                                    </button>
                                </div>
                                <textarea
                                    rows={5}
                                    value={data.background_rationale}
                                    onChange={(e) => setData('background_rationale', e.target.value)}
                                    className="w-full rounded-xl border-purple-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-purple-500 leading-relaxed"
                                    placeholder="ระบุหลักการ เหตุผล และความเป็นมาของโครงการ..."
                                    required
                                ></textarea>
                                {errors.background_rationale && <span className="text-xs text-rose-500 mt-1 block">{errors.background_rationale}</span>}
                            </div>

                            {/* Section 4: Objectives */}
                            <div className="space-y-3 bg-purple-50/40 p-4 rounded-xl border border-purple-100">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-purple-950">
                                        ๔. วัตถุประสงค์ของโครงการ (Objectives) *
                                    </label>
                                    <div className="flex gap-x-2 items-center">
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateAi('objectives', 'ปรับปรุงชุดวัตถุประสงค์ให้ตรงตามเป้าหมายโครงการเรียบร้อยแล้ว')}
                                            disabled={generatingAi}
                                            className="text-xs font-bold text-purple-700 bg-white hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs"
                                        >
                                            ✨ ให้ AI ช่วยเขียนวัตถุประสงค์
                                        </button>
                                        <span className="text-[11px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                                            {(data.objectives || []).length} ข้อ
                                        </span>
                                    </div>
                                </div>
                                {(data.objectives || []).map((obj, index) => (
                                    <div key={index} className="flex gap-x-2 items-start">
                                        <span className="text-xs font-bold text-purple-700 w-6 text-right mt-2.5 shrink-0">{index + 1}.</span>
                                        <textarea
                                            rows={2}
                                            value={obj}
                                            onChange={(e) => handleArrayChange('objectives', index, e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500 resize-y leading-relaxed"
                                            placeholder="ระบุวัตถุประสงค์โครงการ..."
                                            required
                                        />
                                        {(data.objectives || []).length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeArrayItem('objectives', index)}
                                                className="text-rose-500 hover:text-rose-700 font-bold px-2 py-2 text-base mt-1 shrink-0"
                                                title="ลบข้อนี้"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addArrayItem('objectives')}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 pt-1"
                                >
                                    + เพิ่มวัตถุประสงค์อีกข้อ
                                </button>
                            </div>

                            {/* Section 5 & 6: ผลผลิต (Outputs) & ผลลัพธ์ (Outcomes) */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                {/* Outputs */}
                                <div className="space-y-3 bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-slate-800">
                                            ๕. ผลผลิตโครงการ (Outputs)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateAi('outputs', 'จัดทำข้อเสนอผลผลิตโครงการเรียบร้อยแล้ว')}
                                            className="text-[11px] font-bold text-purple-700 bg-white hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200"
                                        >
                                            ✨ AI เสนอผลผลิต
                                        </button>
                                    </div>
                                    {(data.outputs || []).map((item, idx) => (
                                        <div key={idx} className="flex gap-x-2 items-start">
                                            <span className="text-xs font-bold text-slate-500 w-5 mt-2.5 shrink-0">{idx + 1}.</span>
                                            <textarea
                                                rows={2}
                                                value={item}
                                                onChange={(e) => handleArrayChange('outputs', idx, e.target.value)}
                                                className="w-full rounded-xl border-purple-200 px-3 py-1.5 text-xs focus:border-purple-500 focus:ring-purple-500 resize-y leading-relaxed"
                                                placeholder="ระบุผลผลิต..."
                                            />
                                            {(data.outputs || []).length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeArrayItem('outputs', idx)}
                                                    className="text-rose-500 hover:text-rose-700 font-bold px-1 py-1 mt-1 shrink-0"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => addArrayItem('outputs')}
                                        className="text-xs font-bold text-purple-700 hover:text-purple-900 pt-1 block"
                                    >
                                        + เพิ่มผลผลิตอีกข้อ
                                    </button>
                                </div>

                                {/* Outcomes */}
                                <div className="space-y-3 bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-slate-800">
                                            ๖. ผลลัพธ์โครงการ (Outcomes)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateAi('outcomes', 'จัดทำข้อเสนอผลลัพธ์โครงการเรียบร้อยแล้ว')}
                                            className="text-[11px] font-bold text-purple-700 bg-white hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200"
                                        >
                                            ✨ AI เสนอผลลัพธ์
                                        </button>
                                    </div>
                                    {(data.outcomes || []).map((item, idx) => (
                                        <div key={idx} className="flex gap-x-2 items-start">
                                            <span className="text-xs font-bold text-slate-500 w-5 mt-2.5 shrink-0">{idx + 1}.</span>
                                            <textarea
                                                rows={2}
                                                value={item}
                                                onChange={(e) => handleArrayChange('outcomes', idx, e.target.value)}
                                                className="w-full rounded-xl border-purple-200 px-3 py-1.5 text-xs focus:border-purple-500 focus:ring-purple-500 resize-y leading-relaxed"
                                                placeholder="ระบุผลลัพธ์..."
                                            />
                                            {(data.outcomes || []).length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeArrayItem('outcomes', idx)}
                                                    className="text-rose-500 hover:text-rose-700 font-bold px-1 py-1 mt-1 shrink-0"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => addArrayItem('outcomes')}
                                        className="text-xs font-bold text-purple-700 hover:text-purple-900 pt-1 block"
                                    >
                                        + เพิ่มผลลัพธ์อีกข้อ
                                    </button>
                                </div>
                            </div>

                            {/* Section 7: กลุ่มเป้าหมายโครงการ (Target Groups) */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                {/* Quantitative Targets */}
                                <div className="space-y-3 bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-slate-800">
                                            ๗.๑ กลุ่มเป้าหมายเชิงปริมาณ (Quantitative) *
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateAi('targets', 'จัดทำเป้าหมายเชิงปริมาณและคุณภาพเรียบร้อยแล้ว')}
                                            className="text-[11px] font-bold text-purple-700 bg-white hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200"
                                        >
                                            ✨ AI เสนอเป้าหมาย
                                        </button>
                                    </div>
                                    {(data.targets.quantitative || []).map((item, idx) => (
                                        <div key={idx} className="flex gap-x-2 items-start">
                                            <span className="text-xs font-bold text-slate-500 w-5 mt-2.5 shrink-0">{idx + 1}.</span>
                                            <textarea
                                                rows={2}
                                                value={item}
                                                onChange={(e) => {
                                                    const list = [...(data.targets.quantitative || [])];
                                                    list[idx] = e.target.value;
                                                    setData('targets', { ...data.targets, quantitative: list });
                                                }}
                                                className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500 resize-y leading-relaxed"
                                                placeholder="เช่น ผู้เข้าร่วมโครงการจำนวน 50 คน..."
                                                required
                                            />
                                            {(data.targets.quantitative || []).length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const list = [...(data.targets.quantitative || [])];
                                                        list.splice(idx, 1);
                                                        setData('targets', { ...data.targets, quantitative: list });
                                                    }}
                                                    className="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-2 mt-1 shrink-0"
                                                    title="ลบข้อนี้"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData('targets', { ...data.targets, quantitative: [...(data.targets.quantitative || []), ''] });
                                        }}
                                        className="text-xs font-bold text-purple-700 hover:text-purple-900 pt-1 block"
                                    >
                                        + เพิ่มเป้าหมายเชิงปริมาณอีกข้อ
                                    </button>
                                </div>

                                {/* Qualitative Targets */}
                                <div className="space-y-3 bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-slate-800">
                                            ๗.๒ กลุ่มเป้าหมายเชิงคุณภาพ (Qualitative) *
                                        </label>
                                        <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                                            {(data.targets.qualitative || []).length} รายการ
                                        </span>
                                    </div>
                                    {(data.targets.qualitative || []).map((item, idx) => (
                                        <div key={idx} className="flex gap-x-2 items-start">
                                            <span className="text-xs font-bold text-slate-500 w-5 mt-2.5 shrink-0">{idx + 1}.</span>
                                            <textarea
                                                rows={2}
                                                value={item}
                                                onChange={(e) => {
                                                    const list = [...(data.targets.qualitative || [])];
                                                    list[idx] = e.target.value;
                                                    setData('targets', { ...data.targets, qualitative: list });
                                                }}
                                                className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500 resize-y leading-relaxed"
                                                placeholder="เช่น ผู้เข้าร่วมมีความพึงพอใจในระดับดีขึ้นไป..."
                                                required
                                            />
                                            {(data.targets.qualitative || []).length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const list = [...(data.targets.qualitative || [])];
                                                        list.splice(idx, 1);
                                                        setData('targets', { ...data.targets, qualitative: list });
                                                    }}
                                                    className="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-2 mt-1 shrink-0"
                                                    title="ลบข้อนี้"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData('targets', { ...data.targets, qualitative: [...(data.targets.qualitative || []), ''] });
                                        }}
                                        className="text-xs font-bold text-purple-700 hover:text-purple-900 pt-1 block"
                                    >
                                        + เพิ่มเป้าหมายเชิงคุณภาพอีกข้อ
                                    </button>
                                </div>
                            </div>

                            {/* Section 8: พื้นที่ดำเนินการ (Location) */}
                            <div className="space-y-3 bg-purple-50/20 p-4 rounded-xl border border-purple-100">
                                <div className="border-b border-purple-100 pb-2">
                                    <label className="block text-sm font-bold text-purple-950">
                                        ๘. พื้นที่ดำเนินการ / สถานที่จัดโครงการ (Location) *
                                    </label>
                                    <p className="text-xs text-slate-500">ระบุสถานที่จัดกิจกรรม ห้องปฏิบัติการ หรือหน่วยงานเป้าหมาย</p>
                                </div>
                                <input
                                    type="text"
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                    className="w-full rounded-xl border-purple-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-purple-500"
                                    placeholder="เช่น ณ หอประชุม วิทยาลัยสารพัดช่างน่าน หรือ อาคารปฏิบัติการ..."
                                    required
                                />
                            </div>

                            {/* Section 9: ผลที่คาดว่าจะได้รับ (Expected Benefits) */}
                            <div className="space-y-3 bg-purple-50/40 p-4 rounded-xl border border-purple-100">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-purple-950">
                                        ๙. ผลที่คาดว่าจะได้รับ (Expected Benefits)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleGenerateAi('expected_benefits', 'ยกร่างผลที่คาดว่าจะได้รับเรียบร้อยแล้ว')}
                                        disabled={generatingAi}
                                        className="text-xs font-bold text-purple-700 bg-white hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs"
                                    >
                                        ✨ ให้ AI ช่วยเสนอผลที่คาดว่าจะได้รับ
                                    </button>
                                </div>
                                {(data.expected_benefits || []).map((item, index) => (
                                    <div key={index} className="flex gap-x-2 items-start">
                                        <span className="text-xs font-bold text-purple-700 w-6 text-right mt-2.5 shrink-0">{index + 1}.</span>
                                        <textarea
                                            rows={2}
                                            value={item}
                                            onChange={(e) => handleArrayChange('expected_benefits', index, e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500 resize-y leading-relaxed"
                                            placeholder="ระบุผลประโยชน์ที่ผู้เรียนหรือสถานศึกษาจะได้รับ..."
                                        />
                                        {(data.expected_benefits || []).length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeArrayItem('expected_benefits', index)}
                                                className="text-rose-500 hover:text-rose-700 font-bold px-2 py-2 text-base mt-1 shrink-0"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addArrayItem('expected_benefits')}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 pt-1"
                                >
                                    + เพิ่มผลที่คาดว่าจะได้รับอีกข้อ
                                </button>
                            </div>

                            {/* Section 10: ตัวชี้วัดเป้าหมายโครงการ (KPI Table) */}
                            <div className="space-y-4 bg-purple-50/20 p-5 rounded-2xl border border-purple-100">
                                <div className="flex justify-between items-center border-b border-purple-100 pb-2">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block">ส่วนที่ ๔ : ตัวชี้วัดความสำเร็จ</span>
                                        <h3 className="text-base font-bold text-purple-950">๑๐. ตัวชี้วัดเป้าหมายโครงการ (KPI Indicators)</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleGenerateAi('indicators', 'ยกร่างตัวชี้วัด 4 มิติเรียบร้อยแล้ว')}
                                        className="text-xs font-bold text-purple-700 bg-white hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 shadow-2xs"
                                    >
                                        ✨ ให้ AI สร้างตัวชี้วัด ๔ มิติ
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {/* 10.1 ปริมาณ */}
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-purple-100 items-center">
                                        <span className="text-xs font-bold text-purple-950">๑๐.๑ เชิงปริมาณ</span>
                                        <input
                                            type="text"
                                            value={data.indicators?.quantitative?.text || ''}
                                            onChange={(e) => handleIndicatorChange('quantitative', 'text', e.target.value)}
                                            className="sm:col-span-2 rounded-lg border-purple-200 px-3 py-1.5 text-xs focus:border-purple-500"
                                            placeholder="ข้อความตัวชี้วัดเชิงปริมาณ..."
                                        />
                                        <input
                                            type="text"
                                            value={data.indicators?.quantitative?.unit || ''}
                                            onChange={(e) => handleIndicatorChange('quantitative', 'unit', e.target.value)}
                                            className="rounded-lg border-purple-200 px-3 py-1.5 text-xs focus:border-purple-500"
                                            placeholder="หน่วยนับ (เช่น ๕๐ คน / ๑ โครงการ)"
                                        />
                                    </div>

                                    {/* 10.2 คุณภาพ */}
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-purple-100 items-center">
                                        <span className="text-xs font-bold text-purple-950">๑๐.๒ เชิงคุณภาพ</span>
                                        <input
                                            type="text"
                                            value={data.indicators?.qualitative?.text || ''}
                                            onChange={(e) => handleIndicatorChange('qualitative', 'text', e.target.value)}
                                            className="sm:col-span-2 rounded-lg border-purple-200 px-3 py-1.5 text-xs focus:border-purple-500"
                                            placeholder="ข้อความตัวชี้วัดเชิงคุณภาพ..."
                                        />
                                        <input
                                            type="text"
                                            value={data.indicators?.qualitative?.unit || ''}
                                            onChange={(e) => handleIndicatorChange('qualitative', 'unit', e.target.value)}
                                            className="rounded-lg border-purple-200 px-3 py-1.5 text-xs focus:border-purple-500"
                                            placeholder="หน่วยนับ (เช่น ร้อยละ ๙๐)"
                                        />
                                    </div>

                                    {/* 10.3 เวลา */}
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-purple-100 items-center">
                                        <span className="text-xs font-bold text-purple-950">๑๐.๓ เชิงเวลา</span>
                                        <input
                                            type="text"
                                            value={data.indicators?.time?.text || ''}
                                            onChange={(e) => handleIndicatorChange('time', 'text', e.target.value)}
                                            className="sm:col-span-2 rounded-lg border-purple-200 px-3 py-1.5 text-xs focus:border-purple-500"
                                            placeholder="ข้อความตัวชี้วัดเชิงเวลา..."
                                        />
                                        <input
                                            type="text"
                                            value={data.indicators?.time?.unit || ''}
                                            onChange={(e) => handleIndicatorChange('time', 'unit', e.target.value)}
                                            className="rounded-lg border-purple-200 px-3 py-1.5 text-xs focus:border-purple-500"
                                            placeholder="หน่วยนับ (เช่น ๑ วัน / ๑ ภาคเรียน)"
                                        />
                                    </div>

                                    {/* 10.4 ค่าใช้จ่าย */}
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-purple-100 items-center">
                                        <span className="text-xs font-bold text-purple-950">๑๐.๔ เชิงค่าใช้จ่าย</span>
                                        <input
                                            type="text"
                                            value={data.indicators?.cost?.text || ''}
                                            onChange={(e) => handleIndicatorChange('cost', 'text', e.target.value)}
                                            className="sm:col-span-2 rounded-lg border-purple-200 px-3 py-1.5 text-xs focus:border-purple-500"
                                            placeholder="ข้อความตัวชี้วัดเชิงค่าใช้จ่าย..."
                                        />
                                        <input
                                            type="text"
                                            value={data.indicators?.cost?.unit || ''}
                                            onChange={(e) => handleIndicatorChange('cost', 'unit', e.target.value)}
                                            className="rounded-lg border-purple-200 px-3 py-1.5 text-xs focus:border-purple-500"
                                            placeholder="จำนวนเงิน (บาท)"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 11: ปฏิทินปฏิบัติงาน & แผนดำเนินงาน (Action Plan Table) */}
                            <div className="space-y-4 bg-purple-50/20 p-5 rounded-2xl border border-purple-100">
                                <div className="flex justify-between items-center border-b border-purple-100 pb-2">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block">ส่วนที่ ๕ : แผนการปฏิบัติงาน</span>
                                        <h3 className="text-base font-bold text-purple-950">๑๑. สรุปขั้นตอน/วิธีดำเนินการและปฏิทินปฏิบัติงาน (Action Plan)</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleGenerateAi('action_plan', 'สร้างปฏิทินปฏิบัติงาน 4 ขั้นตอนมาตรฐานเรียบร้อยแล้ว')}
                                        className="text-xs font-bold text-purple-700 bg-white hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 shadow-2xs"
                                    >
                                        ✨ ให้ AI สร้างปฏิทินปฏิบัติงาน
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-slate-800 border-collapse">
                                        <thead>
                                            <tr className="bg-purple-100/70 text-purple-950 font-bold border border-purple-200">
                                                <th className="p-2.5 text-left min-w-[220px]">กิจกรรม / ขั้นตอนการดำเนินงาน</th>
                                                <th className="p-2 text-center w-12">Q1<br/><span className="text-[10px] font-normal text-slate-500">ต.ค.-ธ.ค.</span></th>
                                                <th className="p-2 text-center w-12">Q2<br/><span className="text-[10px] font-normal text-slate-500">ม.ค.-มี.ค.</span></th>
                                                <th className="p-2 text-center w-12">Q3<br/><span className="text-[10px] font-normal text-slate-500">เม.ย.-มิ.ย.</span></th>
                                                <th className="p-2 text-center w-12">Q4<br/><span className="text-[10px] font-normal text-slate-500">ก.ค.-ก.ย.</span></th>
                                                <th className="p-2 text-left w-24">กลุ่มเป้าหมาย</th>
                                                <th className="p-2 text-left w-20">สถานที่</th>
                                                <th className="p-2 text-right w-28">งบประมาณ (บาท)</th>
                                                <th className="p-2 text-center w-8">ลบ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(data.action_plan || []).map((row, rIdx) => (
                                                <tr key={rIdx} className="border-b border-purple-100 hover:bg-purple-50/50">
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={row.step_name}
                                                            onChange={(e) => handleActionPlanChange(rIdx, 'step_name', e.target.value)}
                                                            className="w-full rounded-lg border-purple-200 px-2.5 py-1 text-xs focus:border-purple-500"
                                                        />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!row.q1}
                                                            onChange={(e) => handleActionPlanChange(rIdx, 'q1', e.target.checked)}
                                                            className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                                                        />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!row.q2}
                                                            onChange={(e) => handleActionPlanChange(rIdx, 'q2', e.target.checked)}
                                                            className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                                                        />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!row.q3}
                                                            onChange={(e) => handleActionPlanChange(rIdx, 'q3', e.target.checked)}
                                                            className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                                                        />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!row.q4}
                                                            onChange={(e) => handleActionPlanChange(rIdx, 'q4', e.target.checked)}
                                                            className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={row.target_count}
                                                            onChange={(e) => handleActionPlanChange(rIdx, 'target_count', e.target.value)}
                                                            className="w-full rounded-lg border-purple-200 px-2 py-1 text-xs"
                                                            placeholder="50 คน"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={row.location_name}
                                                            onChange={(e) => handleActionPlanChange(rIdx, 'location_name', e.target.value)}
                                                            className="w-full rounded-lg border-purple-200 px-2 py-1 text-xs"
                                                            placeholder="วช.น่าน"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            value={row.budget_operating}
                                                            onChange={(e) => handleActionPlanChange(rIdx, 'budget_operating', parseFloat(e.target.value) || 0)}
                                                            className="w-full rounded-lg border-purple-200 px-2 py-1 text-xs text-right font-bold"
                                                        />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeActionPlanRow(rIdx)}
                                                            className="text-rose-500 hover:text-rose-700 font-bold"
                                                        >
                                                            ✕
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button
                                    type="button"
                                    onClick={addActionPlanRow}
                                    className="text-xs font-bold text-purple-700 hover:text-purple-900 pt-1 block"
                                >
                                    + เพิ่มแถวกิจกรรมในปฏิทินปฏิบัติงาน
                                </button>
                            </div>

                            {/* Section 12: งบประมาณและรายละเอียดค่าใช้จ่าย (Multi-Activity & Split Loan/Procurement) */}
                            <div className="space-y-6 bg-purple-50/20 p-5 rounded-2xl border border-purple-100">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-purple-100 pb-3">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block">ส่วนที่ ๖ : งบประมาณ & กิจกรรมย่อย</span>
                                        <h3 className="text-base font-bold text-purple-950">๑๒. งบประมาณและรายละเอียดค่าใช้จ่าย (แยกตามกิจกรรม & สัญญายืมเงิน / จัดซื้อจัดจ้าง)</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateAi('activities', 'สร้างและกระจายงบประมาณ 2 กิจกรรมมาตรฐานเรียบร้อยแล้ว')}
                                            className="text-xs font-bold text-purple-700 bg-white hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 shadow-2xs transition-all flex items-center gap-1"
                                        >
                                            ✨ AI เสนอแผนหลายกิจกรรม
                                        </button>
                                        <button
                                            type="button"
                                            onClick={addActivity}
                                            className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs transition-all flex items-center gap-1"
                                        >
                                            ➕ เพิ่มกิจกรรมย่อย
                                        </button>
                                    </div>
                                </div>

                                {/* Grand Totals Summary Cards (4 Cards Grid - Perfectly Aligned) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                    {/* 1. วงเงินจัดสรร */}
                                    <div className="p-4 rounded-2xl bg-white border border-purple-100 flex flex-col justify-between shadow-2xs min-h-[105px]">
                                        <span className="text-[11px] font-bold text-slate-500 block truncate">🎯 วงเงินที่ได้รับจัดสรร</span>
                                        <p className="text-xl font-black text-purple-950 my-1 tracking-tight">{allocatedBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</p>
                                        <p className="text-[10px] text-purple-700 font-medium truncate">{project?.funding_source?.name || 'Revenue (เงินรายได้สถานศึกษา)'}</p>
                                    </div>

                                    {/* 2. รวมสัญญายืมเงิน */}
                                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between shadow-2xs min-h-[105px]">
                                        <span className="text-[11px] font-bold text-amber-900 block truncate">💵 รวมสัญญายืมเงิน</span>
                                        <p className="text-xl font-black text-amber-800 my-1 tracking-tight">{totalLoanAllActivities.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</p>
                                        <p className="text-[10px] text-amber-700 font-medium truncate">วิทยากร, อาหาร, เครื่องดื่ม, เดินทาง</p>
                                    </div>

                                    {/* 3. รวมจัดซื้อจัดจ้าง */}
                                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col justify-between shadow-2xs min-h-[105px]">
                                        <span className="text-[11px] font-bold text-indigo-900 block truncate">📦 รวมจัดซื้อจัดจ้าง</span>
                                        <p className="text-xl font-black text-indigo-800 my-1 tracking-tight">{totalProcurementAllActivities.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</p>
                                        <p className="text-[10px] text-indigo-700 font-medium truncate">ค่าวัสดุ และรายการจัดซื้ออื่น ๆ</p>
                                    </div>

                                    {/* 4. สถานะงบประมาณคงเหลือ (Remaining Balance) */}
                                    <div className={`p-4 rounded-2xl border flex flex-col justify-between shadow-2xs min-h-[105px] transition-all ${
                                        remainingBudget > 0 
                                            ? 'bg-emerald-50/80 border-emerald-300' 
                                            : remainingBudget === 0 
                                                ? 'bg-teal-50 border-teal-400' 
                                                : 'bg-rose-50 border-rose-300'
                                    }`}>
                                        <span className={`text-[11px] font-bold block truncate ${
                                            remainingBudget > 0 ? 'text-emerald-900' : remainingBudget === 0 ? 'text-teal-900' : 'text-rose-900'
                                        }`}>
                                            {remainingBudget > 0 ? '💰 จัดสรรได้อีก (งบคงเหลือ)' : remainingBudget === 0 ? '✅ จัดสรรครบถ้วนพอดี 100%' : '🚨 จัดสรรเกินงบประมาณ'}
                                        </span>
                                        <p className={`text-xl font-black my-1 tracking-tight ${
                                            remainingBudget > 0 ? 'text-emerald-700' : remainingBudget === 0 ? 'text-teal-800' : 'text-rose-700'
                                        }`}>
                                            {remainingBudget > 0 ? `+${remainingBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : remainingBudget === 0 ? '0.00' : `-${Math.abs(remainingBudget).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`} บาท
                                        </p>
                                        <p className={`text-[10px] font-bold truncate ${
                                            remainingBudget > 0 ? 'text-emerald-600' : remainingBudget === 0 ? 'text-teal-600' : 'text-rose-600'
                                        }`}>
                                            {remainingBudget > 0 ? `ใช้ไปแล้ว ${usedPercentage}% (ยังเหลืองบ)` : remainingBudget === 0 ? 'งบประมาณลงตัว 100% พอดี' : `ใช้เกินวงเงิน ${usedPercentage}% (กรุณาปรับลด)`}
                                        </p>
                                    </div>
                                </div>

                                {/* Live Visual Budget Progress Bar */}
                                <div className="bg-white p-4 rounded-2xl border border-purple-100 space-y-2 shadow-2xs">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-xs">
                                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                            <span>📊</span> สถานะการใช้จ่ายงบประมาณโครงการ:
                                            <span className="text-purple-950 font-black ml-1">
                                                {grandTotalBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })} / {allocatedBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท ({usedPercentage}%)
                                            </span>
                                        </span>
                                        <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                                            remainingBudget > 0 ? 'bg-emerald-100 text-emerald-800' :
                                            remainingBudget === 0 ? 'bg-teal-100 text-teal-800' :
                                            'bg-rose-100 text-rose-800'
                                        }`}>
                                            {remainingBudget > 0 ? `💰 คงเหลือให้จัดสรรอีก: +${remainingBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท` :
                                             remainingBudget === 0 ? '🎉 จัดสรรงบประมาณลงตัวครบ 100% พอดี' :
                                             `⚠️ จัดสรรเกินวงเงิน: -${Math.abs(remainingBudget).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`}
                                        </span>
                                    </div>

                                    {/* Progress Bar Track */}
                                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex border border-slate-200">
                                        <div 
                                            style={{ width: `${Math.min(100, allocatedBudget > 0 ? (totalLoanAllActivities / allocatedBudget) * 100 : 0)}%` }} 
                                            className="bg-amber-500 h-full transition-all duration-300"
                                            title={`สัญญายืมเงิน: ${totalLoanAllActivities.toLocaleString()} บาท`}
                                        />
                                        <div 
                                            style={{ width: `${Math.min(100, allocatedBudget > 0 ? (totalProcurementAllActivities / allocatedBudget) * 100 : 0)}%` }} 
                                            className="bg-indigo-600 h-full transition-all duration-300"
                                            title={`จัดซื้อจัดจ้าง: ${totalProcurementAllActivities.toLocaleString()} บาท`}
                                        />
                                    </div>

                                    <div className="flex flex-wrap justify-between items-center text-[11px] text-slate-600 pt-0.5">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1.5 font-bold text-amber-900">
                                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> 
                                                สัญญายืมเงิน: {totalLoanAllActivities.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท ({allocatedBudget > 0 ? ((totalLoanAllActivities / allocatedBudget) * 100).toFixed(1) : 0}%)
                                            </span>
                                            <span className="flex items-center gap-1.5 font-bold text-indigo-900">
                                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span> 
                                                จัดซื้อจัดจ้าง: {totalProcurementAllActivities.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท ({allocatedBudget > 0 ? ((totalProcurementAllActivities / allocatedBudget) * 100).toFixed(1) : 0}%)
                                            </span>
                                        </div>
                                        <span className="text-slate-500 font-medium">
                                            {data.activities?.length || 1} กิจกรรมย่อย
                                        </span>
                                    </div>
                                </div>

                                {grandTotalBudget > allocatedBudget && (
                                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2">
                                        <span>⚠️</span> ยอดรวมประมาณการทุกกิจกรรม ({grandTotalBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท) เกินวงเงินงบประมาณที่ได้รับจัดสรรอยู่ {(grandTotalBudget - allocatedBudget).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                                    </div>
                                )}

                                {/* Activities Loop */}
                                <div className="space-y-6">
                                    {(data.activities || []).map((act, actIdx) => {
                                        const actLoanSum = (act.loan_items || []).reduce((s, i) => s + ((parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0)), 0);
                                        const actProcSum = (act.procurement_items || []).reduce((s, i) => s + ((parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0)), 0);
                                        const actTotal = actLoanSum + actProcSum;
                                        const actPercentage = allocatedBudget > 0 ? ((actTotal / allocatedBudget) * 100).toFixed(1) : 0;

                                        return (
                                            <div key={actIdx} className="rounded-2xl border-2 border-purple-200 bg-white p-5 space-y-4 shadow-sm">
                                                {/* Activity Header */}
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-purple-100 pb-3 bg-purple-50/40 -mx-5 -mt-5 p-4 rounded-t-2xl">
                                                    <div className="flex-1 w-full">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-extrabold text-white bg-purple-800 px-2.5 py-0.5 rounded-full shrink-0">
                                                                กิจกรรมที่ {actIdx + 1}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={act.name}
                                                                onChange={(e) => handleActivityChange(actIdx, 'name', e.target.value)}
                                                                className="w-full font-bold text-sm text-purple-950 border-purple-200 rounded-lg px-2.5 py-1 focus:border-purple-500"
                                                                placeholder="ชื่อกิจกรรมย่อย..."
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                        <div className="text-right">
                                                            <div className="text-xs font-black text-purple-950 bg-white px-3 py-1 rounded-xl border border-purple-200 shadow-2xs inline-flex items-center gap-1.5">
                                                                <span>รวมกิจกรรมนี้:</span>
                                                                <span className="text-purple-700 font-black">{actTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
                                                                <span className="text-[10px] text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">({actPercentage}%)</span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                                                💵 ยืมเงิน {actLoanSum.toLocaleString()} บ. | 📦 จัดซื้อ {actProcSum.toLocaleString()} บ.
                                                            </div>
                                                        </div>
                                                        {(data.activities || []).length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeActivity(actIdx)}
                                                                className="text-rose-500 hover:text-rose-700 font-bold text-xs bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors ml-1"
                                                                title="ลบกิจกรรมย่อยนี้"
                                                            >
                                                                🗑️ ลบกิจกรรม
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Activity Location & Target */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">สถานที่จัดกิจกรรมนี้</label>
                                                        <input
                                                            type="text"
                                                            value={act.location || ''}
                                                            onChange={(e) => handleActivityChange(actIdx, 'location', e.target.value)}
                                                            className="w-full rounded-lg border-purple-200 px-3 py-1.5 text-xs"
                                                            placeholder="เช่น ณ หอประชุม วช.น่าน..."
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">กลุ่มเป้าหมายกิจกรรมนี้</label>
                                                        <input
                                                            type="text"
                                                            value={act.target_group || ''}
                                                            onChange={(e) => handleActivityChange(actIdx, 'target_group', e.target.value)}
                                                            className="w-full rounded-lg border-purple-200 px-3 py-1.5 text-xs"
                                                            placeholder="เช่น นักเรียน นักศึกษา 50 คน..."
                                                        />
                                                    </div>
                                                </div>

                                                {/* Loan Items for this Activity */}
                                                <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200 space-y-2.5">
                                                    <div className="flex justify-between items-center">
                                                        <h5 className="text-xs font-bold text-amber-950 flex items-center gap-1">
                                                            <span>💵</span> รายการสัญญายืมเงิน (แบบ กค. ๑๐๑) - กิจกรรมที่ {actIdx + 1}
                                                        </h5>
                                                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                                                            เงินยืม: {actLoanSum.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                                                        </span>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs text-slate-800 border-collapse">
                                                            <thead>
                                                                <tr className="bg-amber-100/60 text-amber-950 font-bold border-b border-amber-200">
                                                                    <th className="p-1.5 text-center w-8">#</th>
                                                                    <th className="p-1.5 text-left">รายการค่าใช้จ่ายเงินยืม</th>
                                                                    <th className="p-1.5 text-right w-16">จำนวน</th>
                                                                    <th className="p-1.5 text-left w-20">หน่วยนับ</th>
                                                                    <th className="p-1.5 text-right w-24">ราคา/หน่วย</th>
                                                                    <th className="p-1.5 text-right w-24">รวมเงิน</th>
                                                                    <th className="p-1.5 text-center w-8">ลบ</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(act.loan_items || []).map((item, lIdx) => (
                                                                    <tr key={lIdx} className="border-b border-amber-100/60 hover:bg-amber-50/50">
                                                                        <td className="p-1.5 text-center text-slate-500">{lIdx + 1}</td>
                                                                        <td className="p-1.5">
                                                                            <input
                                                                                type="text"
                                                                                value={item.description}
                                                                                onChange={(e) => handleActivityItemChange(actIdx, 'loan_items', lIdx, 'description', e.target.value)}
                                                                                className="w-full rounded border-amber-200 px-2 py-1 text-xs focus:border-amber-500"
                                                                                required
                                                                            />
                                                                        </td>
                                                                        <td className="p-1.5">
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={item.quantity}
                                                                                onChange={(e) => handleActivityItemChange(actIdx, 'loan_items', lIdx, 'quantity', parseFloat(e.target.value) || 0)}
                                                                                className="w-full rounded border-amber-200 px-2 py-1 text-xs text-right"
                                                                                required
                                                                            />
                                                                        </td>
                                                                        <td className="p-1.5">
                                                                            <input
                                                                                type="text"
                                                                                value={item.unit}
                                                                                onChange={(e) => handleActivityItemChange(actIdx, 'loan_items', lIdx, 'unit', e.target.value)}
                                                                                className="w-full rounded border-amber-200 px-2 py-1 text-xs"
                                                                                required
                                                                            />
                                                                        </td>
                                                                        <td className="p-1.5">
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={item.unit_price}
                                                                                onChange={(e) => handleActivityItemChange(actIdx, 'loan_items', lIdx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                                                className="w-full rounded border-amber-200 px-2 py-1 text-xs text-right font-bold"
                                                                                required
                                                                            />
                                                                        </td>
                                                                        <td className="p-1.5 text-right font-bold text-amber-900">
                                                                            {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                                        </td>
                                                                        <td className="p-1.5 text-center">
                                                                            {(act.loan_items || []).length > 1 && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeActivityItemRow(actIdx, 'loan_items', lIdx)}
                                                                                    className="text-rose-500 hover:text-rose-700 font-bold"
                                                                                >
                                                                                    ✕
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => addActivityItemRow(actIdx, 'loan_items')}
                                                        className="text-[11px] font-bold text-amber-800 hover:text-amber-950 pt-0.5 block"
                                                    >
                                                        + เพิ่มรายการสัญญายืมเงิน
                                                    </button>
                                                </div>

                                                {/* Procurement Items for this Activity */}
                                                <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-200 space-y-2.5">
                                                    <div className="flex flex-wrap justify-between items-center gap-1.5">
                                                        <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                                                            <span>📦</span> รายการจัดซื้อจัดจ้างพัสดุ - กิจกรรมที่ {actIdx + 1}
                                                        </h5>
                                                        <div className="flex items-center gap-2">
                                                            {remainingBudget > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const acts = [...(data.activities || [])];
                                                                        const pItems = [...(acts[actIdx].procurement_items || [])];
                                                                        if (pItems.length > 0) {
                                                                            const currentPrice = parseFloat(pItems[0].unit_price) || 0;
                                                                            const qty = parseFloat(pItems[0].quantity) || 1;
                                                                            pItems[0].unit_price = currentPrice + (remainingBudget / qty);
                                                                            pItems[0].total_price = qty * pItems[0].unit_price;
                                                                        } else {
                                                                            pItems.push({
                                                                                description: '๑. ค่าวัสดุ อุปกรณ์ดำเนินกิจกรรม',
                                                                                quantity: 1,
                                                                                unit: 'ชุด',
                                                                                unit_price: remainingBudget,
                                                                                total_price: remainingBudget,
                                                                            });
                                                                        }
                                                                        acts[actIdx].procurement_items = pItems;
                                                                        setData('activities', acts);
                                                                    }}
                                                                    className="text-[11px] font-bold text-indigo-800 bg-indigo-100/90 hover:bg-indigo-200 border border-indigo-300 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1"
                                                                    title="ดึงงบประมาณที่ยังคงเหลืออยู่มาเติมในรายการจัดซื้อของกิจกรรมนี้ให้ครบวงเงินพอดี"
                                                                >
                                                                    ⚡ ดึงยอดคงเหลือ (+{remainingBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บ.) เติมในกิจกรรมนี้
                                                                </button>
                                                            )}
                                                            <span className="text-[11px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md">
                                                                จัดซื้อ: {actProcSum.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs text-slate-800 border-collapse">
                                                            <thead>
                                                                <tr className="bg-indigo-100/60 text-indigo-950 font-bold border-b border-indigo-200">
                                                                    <th className="p-1.5 text-center w-8">#</th>
                                                                    <th className="p-1.5 text-left">รายการพัสดุ / จัดซื้อจัดจ้าง</th>
                                                                    <th className="p-1.5 text-right w-16">จำนวน</th>
                                                                    <th className="p-1.5 text-left w-20">หน่วยนับ</th>
                                                                    <th className="p-1.5 text-right w-24">ราคา/หน่วย</th>
                                                                    <th className="p-1.5 text-right w-24">รวมเงิน</th>
                                                                    <th className="p-1.5 text-center w-8">ลบ</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(act.procurement_items || []).map((item, pIdx) => (
                                                                    <tr key={pIdx} className="border-b border-indigo-100/60 hover:bg-indigo-50/50">
                                                                        <td className="p-1.5 text-center text-slate-500">{pIdx + 1}</td>
                                                                        <td className="p-1.5 relative">
                                                                            <div className="relative">
                                                                                <input
                                                                                    type="text"
                                                                                    value={item.description}
                                                                                    onChange={(e) => handleItemDescriptionChange(actIdx, pIdx, e.target.value)}
                                                                                    onFocus={() => {
                                                                                        if (item.description && item.description.trim().length > 0) {
                                                                                            handleItemDescriptionChange(actIdx, pIdx, item.description);
                                                                                        }
                                                                                    }}
                                                                                    placeholder="พิมพ์ชื่อพัสดุ (มีระบบค้นหาราคากลางอัตโนมัติ)..."
                                                                                    className="w-full rounded border-indigo-200 px-2 py-1 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                                                                                    required
                                                                                />
                                                                                {/* Autocomplete Suggestions Dropdown */}
                                                                                {activeSuggestionKey === `${actIdx}-${pIdx}` && standardItemSuggestions.length > 0 && (
                                                                                    <div className="absolute z-50 left-0 top-full mt-1 w-80 max-h-56 overflow-y-auto bg-white rounded-xl shadow-xl border border-indigo-200 py-1.5 text-xs animate-fadeIn">
                                                                                        <div className="px-2.5 py-1 text-[10px] font-bold text-indigo-900 bg-indigo-50 flex justify-between items-center border-b border-indigo-100">
                                                                                            <span>💡 เลือกจากฐานข้อมูลราคากลาง ({standardItemSuggestions.length} รายการ)</span>
                                                                                            <button 
                                                                                                type="button" 
                                                                                                onClick={() => setActiveSuggestionKey(null)}
                                                                                                className="text-slate-400 hover:text-slate-600 font-bold"
                                                                                            >
                                                                                                ✕
                                                                                            </button>
                                                                                        </div>
                                                                                        {standardItemSuggestions.map((sItem) => (
                                                                                            <div
                                                                                                key={sItem.id}
                                                                                                onClick={() => selectStandardItem(actIdx, pIdx, sItem)}
                                                                                                className="px-2.5 py-1.5 hover:bg-indigo-50 cursor-pointer transition flex items-center justify-between border-b border-slate-50 last:border-0"
                                                                                            >
                                                                                                <div className="pr-2">
                                                                                                    <div className="font-bold text-slate-800">{sItem.name}</div>
                                                                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                                                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">{sItem.category || 'ทั่วไป'}</span>
                                                                                                        <span>หน่วย: {sItem.unit}</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="text-right shrink-0">
                                                                                                    <span className="font-bold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                                                                                                        {parseFloat(sItem.standard_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บ.
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                        <div className="p-1.5 bg-slate-50 border-t border-slate-100 text-center">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setQuickAddItemData({
                                                                                                        name: item.description,
                                                                                                        unit: item.unit || 'ชิ้น',
                                                                                                        standard_price: item.unit_price || 0,
                                                                                                        category: 'วัสดุทั่วไป'
                                                                                                    });
                                                                                                    setShowQuickAddItemModal(true);
                                                                                                    setActiveSuggestionKey(null);
                                                                                                }}
                                                                                                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center justify-center gap-1 mx-auto"
                                                                                            >
                                                                                                <span>➕</span> บันทึก "{item.description || 'รายการนี้'}" เข้าราคากลางมาตรฐาน
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-1.5">
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={item.quantity}
                                                                                onChange={(e) => handleActivityItemChange(actIdx, 'procurement_items', pIdx, 'quantity', parseFloat(e.target.value) || 0)}
                                                                                className="w-full rounded border-indigo-200 px-2 py-1 text-xs text-right"
                                                                                required
                                                                            />
                                                                        </td>
                                                                        <td className="p-1.5">
                                                                            <input
                                                                                type="text"
                                                                                value={item.unit}
                                                                                onChange={(e) => handleActivityItemChange(actIdx, 'procurement_items', pIdx, 'unit', e.target.value)}
                                                                                className="w-full rounded border-indigo-200 px-2 py-1 text-xs"
                                                                                required
                                                                            />
                                                                        </td>
                                                                        <td className="p-1.5">
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={item.unit_price}
                                                                                onChange={(e) => handleActivityItemChange(actIdx, 'procurement_items', pIdx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                                                className="w-full rounded border-indigo-200 px-2 py-1 text-xs text-right font-bold text-indigo-900"
                                                                                required
                                                                            />
                                                                        </td>
                                                                        <td className="p-1.5 text-right font-bold text-indigo-900">
                                                                            {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                                        </td>
                                                                        <td className="p-1.5 text-center">
                                                                            {(act.procurement_items || []).length > 1 && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeActivityItemRow(actIdx, 'procurement_items', pIdx)}
                                                                                    className="text-rose-500 hover:text-rose-700 font-bold"
                                                                                >
                                                                                    ✕
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => addActivityItemRow(actIdx, 'procurement_items')}
                                                            className="text-[11px] font-bold text-indigo-800 hover:text-indigo-950 flex items-center gap-1"
                                                        >
                                                            <span>➕</span> เพิ่มรายการจัดซื้อจัดจ้าง
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setQuickAddItemData({ name: '', unit: 'ชิ้น', standard_price: 0, category: 'วัสดุทั่วไป' });
                                                                setShowQuickAddItemModal(true);
                                                            }}
                                                            className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1"
                                                        >
                                                            <span>📦</span> + เพิ่มรายการเข้าราคากลางมาตรฐาน
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={addActivity}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 px-4 py-2 text-xs font-bold shadow-2xs transition-all"
                                    >
                                        ➕ เพิ่มกิจกรรมย่อยอีก ๑ กิจกรรม
                                    </button>
                                </div>
                            </div>

                            {/* Section 13: ผู้รับผิดชอบโครงการ */}
                            <div className="space-y-4 bg-purple-50/20 p-5 rounded-2xl border border-purple-100">
                                <div className="border-b border-purple-100 pb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block">ส่วนที่ ๗ : ผู้รับผิดชอบ & การลงนามเสนอ</span>
                                    <h3 className="text-base font-bold text-purple-950">๑๓. ผู้รับผิดชอบโครงการ</h3>
                                </div>
                                <div className="max-w-md text-xs">
                                    <div className="p-4 rounded-xl bg-white border border-purple-100 space-y-1 shadow-2xs">
                                        <span className="font-bold text-purple-900 block text-xs">ผู้รับผิดชอบ / ผู้เสนอโครงการ:</span>
                                        <p className="text-slate-800 font-bold text-sm">{data.responsible_person || project?.user?.name}</p>
                                        <p className="text-slate-500 font-medium">{data.position}</p>
                                        {data.phone && <p className="text-slate-500">โทรศัพท์: {data.phone}</p>}
                                        {data.email && <p className="text-slate-500">อีเมล: {data.email}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Section 14: การติดตามและประเมินผลโครงการ */}
                            <div className="space-y-4 bg-purple-50/20 p-5 rounded-2xl border border-purple-100">
                                <div className="border-b border-purple-100 pb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block">ส่วนที่ ๘ : การประเมินผล</span>
                                    <h3 className="text-base font-bold text-purple-950">๑๔. การติดตามและประเมินผลโครงการ (Monitoring & Evaluation)</h3>
                                </div>
                                <div className="p-4 rounded-xl bg-white border border-purple-100 space-y-2 text-xs text-slate-700 leading-relaxed">
                                    <p><span className="font-bold text-purple-900">๑๔.๑ เครื่องมือที่ใช้ในการประเมิน:</span> แบบประเมินความพึงพอใจของผู้เข้าร่วมโครงการ, แบบบันทึกการสังเกตพฤติกรรม และแบบทดสอบประเมินสมรรถนะ</p>
                                    <p><span className="font-bold text-purple-900">๑๔.๒ วิธีการประเมิน:</span> ประเมินผลก่อนและหลังการจัดกิจกรรม รวบรวมข้อมูลทางสถิติ และจัดทำสรุปรายงานผลโครงการฉบับสมบูรณ์เสนอต่อผู้บริหารสถานศึกษา</p>
                                </div>
                            </div>

                            {/* Submit Action Buttons */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-purple-100 pt-6">
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors w-full sm:w-auto text-center"
                                >
                                    ← ยกเลิก / ย้อนกลับ
                                </Link>
                                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSaveDraft}
                                        disabled={processing || isSubmitting}
                                        className="rounded-xl border border-purple-300 bg-purple-50 px-5 py-2.5 text-sm font-bold text-purple-900 shadow-2xs hover:bg-purple-100 transition-all disabled:opacity-50"
                                    >
                                        💾 บันทึกแบบร่าง
                                    </button>
                                    {project.status === 'pending_approval' ? (
                                        <button
                                            type="button"
                                            disabled={true}
                                            className="rounded-xl bg-slate-200 border border-slate-300 px-6 py-2.5 text-sm font-bold text-slate-500 cursor-not-allowed flex items-center gap-2 shadow-inner"
                                        >
                                            <span>✅</span> ยื่นขออนุมัติแล้ว (อยู่ระหว่างขั้นตอนที่ 2: รอตรวจสอบ)
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleSaveAndSubmit}
                                            disabled={processing || isSubmitting}
                                            className={`rounded-xl px-6 py-2.5 text-sm font-extrabold transition-all flex items-center gap-2 shadow-md ${
                                                isSubmitting || processing
                                                    ? 'bg-slate-300 text-slate-500 border border-slate-400 cursor-not-allowed shadow-none'
                                                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-emerald-600/25 hover:scale-[1.02] active:scale-95'
                                            }`}
                                        >
                                            <span>{isSubmitting ? '⏳' : '🚀'}</span>
                                            {isSubmitting ? 'กำลังบันทึกและส่งเรื่องอนุมัติ...' : 'บันทึกและยื่นขออนุมัติโครงการ (ส่งต่อขั้นที่ 2) ➔'}
                                        </button>
                                    )}
                                </div>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
