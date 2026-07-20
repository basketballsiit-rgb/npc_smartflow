import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const StatusBadge = ({ status }) => {
    const configs = {
        draft: { text: 'แบบร่าง', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
        submitted: { text: 'ยื่นเสนอแล้ว', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
        pending_approval: { text: 'รออนุมัติ', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
        approved: { text: 'อนุมัติแล้ว', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
        rejected: { text: 'ตีกลับ/ปฏิเสธ', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' },
    };
    const config = configs[status] ?? { text: status, color: 'bg-gray-100 text-gray-800' };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
            {config.text}
        </span>
    );
};

export default function Dashboard({ departmentMetrics, budgetSummary, completedProjects, departmentProjects = [] }) {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold leading-tight text-gray-800 dark:text-gray-100 font-sans">
                    Executive Intelligence Command
                </h2>
            }
        >
            <Head title="Executive Dashboard" />

            <div className="py-8 font-sans">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* Overall KPI summaries */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Institution Total Budget</h4>
                            <p className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(budgetSummary.total_allocated)}</p>
                        </div>
                        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Encumbered Reservation</h4>
                            <p className="mt-2 text-2xl font-black text-amber-500">{formatCurrency(budgetSummary.total_encumbered)}</p>
                        </div>
                        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Actual Outlay spent</h4>
                            <p className="mt-2 text-2xl font-black text-emerald-500">{formatCurrency(budgetSummary.total_spent)}</p>
                        </div>
                    </div>

                    {/* Departmental Metrics Cards */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Divisional Breakdown</h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        {departmentMetrics.map((dept) => {
                            const percent = dept.total_estimated_budget > 0 
                                ? Math.min(100, Math.round((dept.total_spent_budget / dept.total_estimated_budget) * 100))
                                : 0;

                            return (
                                <div key={dept.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">{dept.name}</h4>
                                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-400">{dept.code}</span>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm border-b border-gray-100 dark:border-gray-700 pb-3 mb-3">
                                        <div>
                                            <span className="block text-xs text-gray-400">Projects</span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{dept.total_projects} ({dept.approved_projects} Appr.)</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-gray-400">Budget Limit</span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{new Intl.NumberFormat('th-TH', { notation: 'compact' }).format(dept.total_estimated_budget)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold text-gray-500">
                                            <span>Spent Utilization</span>
                                            <span>{percent}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                                            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                                        </div>
                                        <span className="block text-[11px] text-gray-400 mt-1">Spent: {formatCurrency(dept.total_spent_budget)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 🆕 Section: ติดตามการเสนอขอโครงการในฝ่ายที่รับผิดชอบ */}
                    <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50 flex justify-between items-center flex-wrap gap-2">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">แผนงานและคำขอโครงการของฝ่ายที่รับผิดชอบ</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">ติดตามโครงการทุกสถานะภายใต้ฝ่ายกำกับดูแล เพื่อเตรียมการประชุมวางแผนและพิจารณางบประมาณ</p>
                            </div>
                            <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold">
                                {departmentProjects.length} โครงการทั้งหมด
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30">
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">ชื่อโครงการ</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">แผนก/งาน</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">ผู้รับผิดชอบ</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200 text-right">งบประมาณเสนอขอ</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200 text-center">สถานะ</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">วันที่ยื่นเรื่อง</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {departmentProjects.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                                ยังไม่มีการยื่นเสนอโครงการใดๆ ในฝ่ายงานของคุณในขณะนี้
                                            </td>
                                        </tr>
                                    ) : (
                                        departmentProjects.map((project) => (
                                            <tr key={project.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                                    {project.title}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {project.department}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {project.proposer}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white text-right">
                                                    {formatCurrency(project.estimated_budget)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-center">
                                                    <StatusBadge status={project.status} />
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {project.created_at}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Final PDF Reports */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Completed Evaluation Reports</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Approved projects with finished survey feedback. Access and audit stitched evaluation documents.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30">
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Project</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Division</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Proposer</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Actual Outlay</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Surveys Gathered</th>
                                        <th className="relative py-3.5 pl-3 pr-6 text-right">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {completedProjects.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                                No completed projects ready for evaluation reports.
                                            </td>
                                        </tr>
                                    ) : (
                                        completedProjects.map((project) => (
                                            <tr key={project.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                                    {project.title}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {project.department}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {project.proposer}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(project.spent_budget)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {project.survey_responses_count} respondents
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                                                    <button 
                                                        className="inline-flex items-center rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100 transition-colors"
                                                        onClick={() => alert('Generating full stitched PDF for ' + project.title)}
                                                    >
                                                        Download Final PDF
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
