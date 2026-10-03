import React from 'react';

export default function AdminDataVisualization({ adminData, allProjectsMaster = [] }) {
    if (!adminData || !adminData.stats) return null;

    const totalUsers = adminData.stats.totalUsers || 1;
    const syncedUsers = adminData.stats.syncedLineUsers || 0;
    const unsyncedUsers = Math.max(0, totalUsers - syncedUsers);
    const syncedPct = Math.round((syncedUsers / totalUsers) * 100);
    const unsyncedPct = 100 - syncedPct;

    // SVG Donut calculation (radius = 42, circumference = 2 * PI * 42 = 263.89)
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (syncedPct / 100) * circumference;

    // Compute active projects by 4 main divisions
    const mainDivisions = [
        { id: 1, name: 'ฝ่ายบริหารทรัพยากร', color: 'from-blue-500 to-indigo-600', textColor: 'text-blue-700', bgBadge: 'bg-blue-50' },
        { id: 2, name: 'ฝ่ายพัฒนากิจการนักเรียน นักศึกษา', color: 'from-amber-500 to-orange-600', textColor: 'text-amber-700', bgBadge: 'bg-amber-50' },
        { id: 3, name: 'ฝ่ายวิชาการ', color: 'from-emerald-500 to-teal-600', textColor: 'text-emerald-700', bgBadge: 'bg-emerald-50' },
        { id: 4, name: 'ฝ่ายแผนงานและความร่วมมือ', color: 'from-purple-500 to-violet-600', textColor: 'text-purple-700', bgBadge: 'bg-purple-50' },
    ];

    const projectsList = Array.isArray(allProjectsMaster) ? allProjectsMaster : [];
    const activeProjects = projectsList.filter(p => !['cancelled'].includes(p.status));
    const totalActiveProjects = activeProjects.length || 1;

    const divisionStats = mainDivisions.map(div => {
        const divProjects = activeProjects.filter(p => {
            const deptName = p.department?.name || p.department_name || '';
            const parentName = p.department?.parent?.name || '';
            return deptName.includes(div.name) || parentName.includes(div.name) || 
                   (div.id === 1 && (deptName.includes('บริหาร') || deptName.includes('การเงิน') || deptName.includes('พัสดุ'))) ||
                   (div.id === 2 && (deptName.includes('พัฒนากิจการ') || deptName.includes('กิจกรรม') || deptName.includes('แนะแนว'))) ||
                   (div.id === 3 && (deptName.includes('วิชาการ') || deptName.includes('แผนก') || deptName.includes('ช่าง') || deptName.includes('คอมพิวเตอร์'))) ||
                   (div.id === 4 && (deptName.includes('แผนงาน') || deptName.includes('ความร่วมมือ') || deptName.includes('วิจัย')));
        });

        const totalBudget = divProjects.reduce((sum, p) => sum + (parseFloat(p.allocated_budget) || parseFloat(p.estimated_budget) || 0), 0);
        const count = divProjects.length;
        const pct = Math.round((count / totalActiveProjects) * 100);

        return {
            ...div,
            count,
            totalBudget,
            pct,
        };
    });

    const maxCount = Math.max(...divisionStats.map(d => d.count), 1);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6">
            
            {/* 1. Left: Donut Chart (LINE Binding Ratio) */}
            <div className="lg:col-span-5 rounded-2xl border border-purple-100 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between border-b border-purple-50 pb-3 mb-4">
                        <div>
                            <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                                <span>📱</span> สัดส่วนบุคลากรผูก LINE Notification
                            </h4>
                            <p className="text-[11px] text-slate-500">
                                การแจ้งเตือนสถานะเอกสารและการอนุมัติโครงการแบบทันท่วงที
                            </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Live Sync
                        </span>
                    </div>

                    {/* Donut Chart Visual */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
                        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                {/* Background circle (Unsynced) */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    className="text-slate-100"
                                    strokeWidth="12"
                                    stroke="currentColor"
                                    fill="transparent"
                                />
                                {/* Progress circle (Synced) */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    className="text-emerald-500 transition-all duration-1000 ease-out"
                                    strokeWidth="12"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                />
                            </svg>
                            {/* Center percentage label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-black text-emerald-600 font-mono tracking-tight leading-none">
                                    {syncedPct}%
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 mt-1">
                                    ผูกแล้ว
                                </span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="space-y-2.5 w-full sm:w-auto">
                            <div className="flex items-center justify-between gap-4 p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                                    <span className="text-xs font-bold text-emerald-950">ผูก LINE แล้ว</span>
                                </div>
                                <span className="text-xs font-black text-emerald-700 font-mono">
                                    {syncedUsers} คน ({syncedPct}%)
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 p-2 rounded-xl bg-slate-50 border border-slate-200">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-slate-300 shrink-0"></span>
                                    <span className="text-xs font-medium text-slate-600">ยังไม่ผูก LINE</span>
                                </div>
                                <span className="text-xs font-black text-slate-700 font-mono">
                                    {unsyncedUsers} คน ({unsyncedPct}%)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-[10px] text-slate-400 text-center pt-3 border-t border-purple-50">
                    💡 ระบบซิงค์อัตโนมัติจาก Line User ID ในฐานข้อมูล npc_eleve เมื่อบุคลากรเข้าสู่ระบบ
                </div>
            </div>

            {/* 2. Right: Bar Chart (Project Volume across 4 Main Divisions) */}
            <div className="lg:col-span-7 rounded-2xl border border-purple-100 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between border-b border-purple-50 pb-3 mb-4">
                        <div>
                            <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                                <span>🏛️</span> ปริมาณโครงการและเอกสารแยกตาม 4 ฝ่ายหลัก
                            </h4>
                            <p className="text-[11px] text-slate-500">
                                แสดงสัดส่วนโครงการที่กำลังขับเคลื่อนในแต่ละฝ่าย เพื่อให้เห็นภาพรวมได้ใน 3 วินาที
                            </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold font-mono">
                            รวม {activeProjects.length} โครงการ
                        </span>
                    </div>

                    {/* Horizontal Bar Visuals */}
                    <div className="space-y-3.5 py-1">
                        {divisionStats.map((div) => {
                            const barWidthPct = Math.max(8, Math.round((div.count / maxCount) * 100));
                            return (
                                <div key={div.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate max-w-[240px] sm:max-w-none">
                                            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${div.color}`}></span>
                                            {div.name}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                                            <span className="font-bold text-slate-900">{div.count} โครงการ</span>
                                            <span className="text-slate-400">({div.pct}%)</span>
                                            <span className="text-slate-300 hidden sm:inline">•</span>
                                            <span className="text-slate-500 font-normal hidden sm:inline">
                                                ฿{new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(div.totalBudget)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${div.color} transition-all duration-700 ease-out`}
                                            style={{ width: `${barWidthPct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-purple-50 mt-4">
                    <span>⚡ สรุปงบประมาณรวมทั้งสถาบัน:</span>
                    <strong className="text-purple-950 font-bold font-mono">
                        ฿{new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
                            divisionStats.reduce((sum, d) => sum + d.totalBudget, 0)
                        )}
                    </strong>
                </div>
            </div>

        </div>
    );
}
