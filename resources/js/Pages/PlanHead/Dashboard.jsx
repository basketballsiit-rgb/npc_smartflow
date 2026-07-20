import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ stats, fundingSources, approvalQueue, advancePayments }) {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold leading-tight text-gray-800 dark:text-gray-100 font-sans">
                    Planning & Budget Controller Workspace
                </h2>
            }
        >
            <Head title="Planning Head Dashboard" />

            <div className="py-8 font-sans">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* Budget Overview Cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                        {/* Total Allocated */}
                        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Allocated Budget</dt>
                            <dd className="mt-2 text-3xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(stats.total_allocated)}</dd>
                        </div>
                        {/* Total Encumbered */}
                        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Encumbered (Locked)</dt>
                            <dd className="mt-2 text-3xl font-black text-amber-500">{formatCurrency(stats.total_encumbered)}</dd>
                        </div>
                        {/* Total Spent */}
                        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Spent Actual</dt>
                            <dd className="mt-2 text-3xl font-black text-emerald-500">{formatCurrency(stats.total_spent)}</dd>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-8">
                        {/* Funding Sources Progress */}
                        <div className="lg:col-span-1 overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Funding Channels</h3>
                            <div className="space-y-6">
                                {fundingSources.map((source) => {
                                    const percent = source.total_allocated > 0 
                                        ? Math.min(100, Math.round((source.total_spent / source.total_allocated) * 100)) 
                                        : 0;

                                    return (
                                        <div key={source.id} className="space-y-2">
                                            <div className="flex justify-between text-sm font-semibold">
                                                <span className="text-gray-800 dark:text-gray-200">{source.code}</span>
                                                <span className="text-gray-500 dark:text-gray-400">{percent}% Spent</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                                                <div 
                                                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                                <span>Allocated: {formatCurrency(source.total_allocated)}</span>
                                                <span>Spent: {formatCurrency(source.total_spent)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Proposal Approval Queue */}
                        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Proposal Review Queue</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Project proposals waiting for Step 3 budget validation and strategic approval.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30">
                                            <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Title</th>
                                            <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Proposer</th>
                                            <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Estimated Budget</th>
                                            <th className="relative py-3.5 pl-3 pr-6 text-right">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {approvalQueue.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    No pending proposals awaiting your approval.
                                                </td>
                                            </tr>
                                        ) : (
                                            approvalQueue.map((project) => (
                                                <tr key={project.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                                        {project.title}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {project.user?.name} ({project.department?.code})
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                                        {formatCurrency(project.estimated_budget)}
                                                    </td>
                                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                                                        <Link 
                                                            href="#"
                                                            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                                                        >
                                                            Evaluate & Approve
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Advance Payment Clearing Queue */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advance Payments Status Roster</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Audit advance budget requests and clear invoice payments once documents are vetted.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30">
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Project</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Department</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Proposer</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Allocated</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Spent Actual</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Clearing Status</th>
                                        <th className="relative py-3.5 pl-3 pr-6 text-right">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {advancePayments.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                                No advance payment projects registered in the system.
                                            </td>
                                        </tr>
                                    ) : (
                                        advancePayments.map((budget) => (
                                            <tr key={budget.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                                    {budget.project?.title}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {budget.project?.department?.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {budget.project?.user?.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(budget.allocated_amount)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {formatCurrency(budget.spent_amount)}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    {budget.advance_cleared_at ? (
                                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400">Cleared</span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400">Uncleared</span>
                                                    )}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                                                    {!budget.advance_cleared_at && (
                                                        <button 
                                                            className="text-emerald-600 hover:text-emerald-950 dark:text-emerald-400"
                                                            onClick={() => alert('Clearing advance payment process stub')}
                                                        >
                                                            Mark Cleared
                                                        </button>
                                                    )}
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
