import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ projects, stats }) {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">Approved</span>;
            case 'rejected':
                return <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20">Rejected</span>;
            case 'submitted':
            case 'pending_approval':
                return <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">Pending Approval</span>;
            default:
                return <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20">Draft</span>;
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold leading-tight text-gray-800 dark:text-gray-100 font-sans">
                        Teacher Project Hub
                    </h2>
                    <Link
                        href="#"
                        className="inline-flex items-center gap-x-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 transform hover:scale-[1.02]"
                    >
                        + Create Project Proposal
                    </Link>
                </div>
            }
        >
            <Head title="Teacher Dashboard" />

            <div className="py-8 font-sans">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
                        
                        {/* Total Projects */}
                        <div className="overflow-hidden rounded-xl bg-white p-5 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                            <dt className="truncate text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Proposed</dt>
                            <dd className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{stats.total}</dd>
                        </div>

                        {/* Draft */}
                        <div className="overflow-hidden rounded-xl bg-white p-5 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                            <dt className="truncate text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Draft Status</dt>
                            <dd className="mt-2 text-3xl font-bold tracking-tight text-gray-500 dark:text-gray-300">{stats.draft}</dd>
                        </div>

                        {/* Pending */}
                        <div className="overflow-hidden rounded-xl bg-white p-5 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                            <dt className="truncate text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Awaiting Review</dt>
                            <dd className="mt-2 text-3xl font-bold tracking-tight text-amber-500">{stats.pending}</dd>
                        </div>

                        {/* Approved */}
                        <div className="overflow-hidden rounded-xl bg-white p-5 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                            <dt className="truncate text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Approved Projects</dt>
                            <dd className="mt-2 text-3xl font-bold tracking-tight text-emerald-500">{stats.approved}</dd>
                        </div>

                        {/* Budget */}
                        <div className="overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 p-5 shadow-sm border border-indigo-100 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700 transition-all duration-200 hover:shadow-md col-span-1 sm:col-span-2 lg:col-span-1">
                            <dt className="truncate text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Total Budget</dt>
                            <dd className="mt-2 text-2xl font-black tracking-tight text-indigo-900 dark:text-white">{formatCurrency(stats.total_budget)}</dd>
                        </div>

                    </div>

                    {/* Projects Table */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
                            <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">Your Project Catalog</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">A complete roster of all project proposals submitted under your department.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30">
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Project Title</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Department</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Academic Year</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Est. Budget</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Status</th>
                                        <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Approval Step</th>
                                        <th className="relative py-3.5 pl-3 pr-6 sm:pr-0">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {projects.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                                No project proposals found. Click "+ Create Project Proposal" to begin.
                                            </td>
                                        </tr>
                                    ) : (
                                        projects.map((project) => (
                                            <tr key={project.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors duration-150">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                                    {project.title}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {project.department?.name || 'N/A'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {project.academic_year}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(project.estimated_budget)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    {getStatusBadge(project.status)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {project.status === 'approved' ? (
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Completed</span>
                                                    ) : project.status === 'rejected' ? (
                                                        <span className="text-rose-600 dark:text-rose-400 font-medium">Halted</span>
                                                    ) : (
                                                        <span>Step {project.current_approval_step} of 6</span>
                                                    )}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium sm:pr-0">
                                                    <div className="flex justify-end gap-x-3 pr-6">
                                                        <Link href="#" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">View</Link>
                                                        {project.status === 'draft' && (
                                                            <Link href="#" className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300">Edit</Link>
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
            </div>
        </AuthenticatedLayout>
    );
}
