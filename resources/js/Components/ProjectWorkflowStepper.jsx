import React from 'react';

export default function ProjectWorkflowStepper({ currentStep = 1, status = 'draft' }) {
    const steps = [
        {
            number: 1,
            title: 'เสนอโครงการ',
            subtitle: 'ร่างข้อเสนอ & วัตถุประสงค์',
            icon: '📝',
        },
        {
            number: 2,
            title: 'ตรวจสอบ & อนุมัติ',
            subtitle: 'งานวางแผน & ผู้อำนวยการ',
            icon: '🔍',
        },
        {
            number: 3,
            title: 'จัดซื้อจัดจ้าง & พัสดุ',
            subtitle: 'แต่งตั้งกรรมการ & คำสั่ง',
            icon: '📦',
        },
        {
            number: 4,
            title: 'เคลียร์เงินยืม & เบิกจ่าย',
            subtitle: 'ส่งเอกสารเคลียร์ทดรอง',
            icon: '🧾',
        },
        {
            number: 5,
            title: 'ประเมินผลโครงการ',
            subtitle: 'แบบสำรวจ & วิเคราะห์ AI',
            icon: '⭐',
        },
        {
            number: 6,
            title: 'รายงานผลฉบับสมบูรณ์',
            subtitle: 'รูปภาพ & รวมเล่ม PDF',
            icon: '📄',
        },
    ];

    // Determine active step index based on status or prop
    let activeIndex = 0;
    if (status === 'draft') activeIndex = 0;
    else if (status === 'submitted' || status === 'pending_approval') activeIndex = 1;
    else if (status === 'approved') activeIndex = 2; // Step 3: Procurement
    else if (status === 'in_progress') activeIndex = 3; // Step 4: Execution / Clearing
    else if (status === 'evaluating') activeIndex = 4; // Step 5: Survey & Check
    else if (status === 'completed') activeIndex = 5; // Step 6: Final Stitched PDF Report
    else activeIndex = Math.max(0, Math.min(5, (currentStep || 1) - 1));

    return (
        <div className="w-full bg-gradient-to-r from-purple-900/5 via-violet-900/10 to-purple-900/5 p-5 rounded-2xl border border-purple-100 shadow-2xs mb-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-purple-200/60">
                <div className="flex items-center gap-x-2">
                    <span className="flex h-3 w-3 rounded-full bg-purple-600 animate-ping"></span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950">
                        ลำดับขั้นตอนการดำเนินโครงการ (PDCA Lifecycle Workflow)
                    </h4>
                </div>
                <span className="text-xs font-extrabold text-purple-700 bg-white px-3 py-1 rounded-full border border-purple-200 shadow-2xs">
                    ขั้นตอนที่ {activeIndex + 1} จาก {steps.length}
                </span>
            </div>

            {/* Stepper Grid Container */}
            <div className="relative">
                {/* Connector Line Background */}
                <div className="absolute top-5 left-6 right-6 hidden md:block h-1 bg-purple-200/80 rounded-full -z-0"></div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 relative z-10">
                    {steps.map((step, index) => {
                        const isCompleted = index < activeIndex;
                        const isCurrent = index === activeIndex;

                        return (
                            <div
                                key={step.number}
                                className={`flex flex-col items-center text-center p-2.5 rounded-xl transition-all ${
                                    isCurrent
                                        ? 'bg-white shadow-md border border-purple-300 ring-2 ring-purple-500/20 translate-y-[-2px]'
                                        : isCompleted
                                        ? 'bg-purple-50/60 border border-purple-100'
                                        : 'bg-slate-50/50 opacity-65 border border-slate-100'
                                }`}
                            >
                                {/* Circle Node */}
                                <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mb-2 transition-all ${
                                        isCurrent
                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white ring-4 ring-purple-200 animate-pulse'
                                            : isCompleted
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-200 text-slate-600'
                                    }`}
                                >
                                    {isCompleted ? '✓' : step.number}
                                </div>

                                {/* Step Title */}
                                <span
                                    className={`text-xs font-bold block leading-tight ${
                                        isCurrent
                                            ? 'text-purple-950 font-black'
                                            : isCompleted
                                            ? 'text-purple-900'
                                            : 'text-slate-500'
                                    }`}
                                >
                                    {step.title}
                                </span>

                                {/* Step Subtitle */}
                                <span className="text-[10px] text-slate-500 mt-1 block hidden sm:block">
                                    {step.subtitle}
                                </span>

                                {/* Status Tag */}
                                <span
                                    className={`mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                        isCurrent
                                            ? 'bg-purple-600 text-white shadow-2xs'
                                            : isCompleted
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    {isCurrent
                                        ? 'กำลังรวบรวม'
                                        : isCompleted
                                        ? 'เสร็จสิ้น'
                                        : 'รอเรียงลำดับ'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
