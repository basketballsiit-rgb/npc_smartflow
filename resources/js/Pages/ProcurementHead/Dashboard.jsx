import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function Dashboard({ procurementQueue, users }) {
    const [selectedProject, setSelectedProject] = useState(null);
    const [committees, setCommittees] = useState({
        purchasingChair: '',
        purchasingMembers: ['', ''],
        inspectionChair: '',
        inspectionMembers: ['', ''],
    });

    const handleAssignClick = (project) => {
        setSelectedProject(project);
        // Pre-populate if project already has committees
        const currentComm = project.procurement?.committees || [];
        const pChair = currentComm.find(c => c.pivot.committee_type === 'purchasing' && c.pivot.role === 'chairperson')?.id || '';
        const pMems = currentComm.filter(c => c.pivot.committee_type === 'purchasing' && c.pivot.role === 'member').map(c => c.id);
        const iChair = currentComm.find(c => c.pivot.committee_type === 'inspection' && c.pivot.role === 'chairperson')?.id || '';
        const iMems = currentComm.filter(c => c.pivot.committee_type === 'inspection' && c.pivot.role === 'member').map(c => c.id);

        setCommittees({
            purchasingChair: pChair,
            purchasingMembers: [pMems[0] || '', pMems[1] || ''],
            inspectionChair: iChair,
            inspectionMembers: [iMems[0] || '', iMems[1] || ''],
        });
    };

    const handleSaveCommittees = (e) => {
        e.preventDefault();
        alert('Appointing committees for project: ' + selectedProject.title + '\n(Logic will be fully integrated in Step 5)');
        setSelectedProject(null);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold leading-tight text-gray-800 dark:text-gray-100 font-sans">
                    Procurement Queue & Committees
                </h2>
            }
        >
            <Head title="Procurement Dashboard" />

            <div className="py-8 font-sans">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        
                        {/* Queue List */}
                        <div className={`lg:col-span-${selectedProject ? '2' : '3'} overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 transition-all duration-300`}>
                            <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Purchasing Pipeline</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Approved school projects awaiting committee appointments and procurement workflows.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30">
                                            <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Project</th>
                                            <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Proposer</th>
                                            <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Budget</th>
                                            <th className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">Committees Status</th>
                                            <th className="relative py-3.5 pl-3 pr-6 text-right">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {procurementQueue.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    No approved projects currently ready for procurement.
                                                </td>
                                            </tr>
                                        ) : (
                                            procurementQueue.map((project) => {
                                                const hasPurchasing = project.procurement?.committees?.some(c => c.pivot.committee_type === 'purchasing') || false;
                                                const hasInspection = project.procurement?.committees?.some(c => c.pivot.committee_type === 'inspection') || false;

                                                return (
                                                    <tr key={project.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                                            {project.title}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            {project.user?.name}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                                            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(project.estimated_budget)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <div className="flex flex-col gap-y-1">
                                                                <span className={`inline-flex items-center w-fit rounded-md px-2 py-0.5 text-xs font-semibold ${hasPurchasing ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                                                                    Purchasing: {hasPurchasing ? 'Assigned' : 'Missing'}
                                                                </span>
                                                                <span className={`inline-flex items-center w-fit rounded-md px-2 py-0.5 text-xs font-semibold ${hasInspection ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                                                                    Inspection: {hasInspection ? 'Assigned' : 'Missing'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => handleAssignClick(project)}
                                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                                                            >
                                                                Setup Committees
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Committee Selection Panel */}
                        {selectedProject && (
                            <div className="lg:col-span-1 overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Assign Committees</h3>
                                    <button 
                                        onClick={() => setSelectedProject(null)} 
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mb-4">Project: <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedProject.title}</span></p>

                                <form onSubmit={handleSaveCommittees} className="space-y-6">
                                    {/* 1. Purchasing Committee */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">1. Purchasing Committee</h4>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Chairperson</label>
                                            <select 
                                                value={committees.purchasingChair}
                                                onChange={(e) => setCommittees({...committees, purchasingChair: e.target.value})}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                                required
                                            >
                                                <option value="">Select User...</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department_name})</option>)}
                                            </select>
                                        </div>
                                        {[0, 1].map((idx) => (
                                            <div key={idx}>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Member {idx + 1}</label>
                                                <select 
                                                    value={committees.purchasingMembers[idx]}
                                                    onChange={(e) => {
                                                        const m = [...committees.purchasingMembers];
                                                        m[idx] = e.target.value;
                                                        setCommittees({...committees, purchasingMembers: m});
                                                    }}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                                    required
                                                >
                                                    <option value="">Select User...</option>
                                                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department_name})</option>)}
                                                </select>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 2. Inspection Committee */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">2. Inspection Committee</h4>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Chairperson</label>
                                            <select 
                                                value={committees.inspectionChair}
                                                onChange={(e) => setCommittees({...committees, inspectionChair: e.target.value})}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                                required
                                            >
                                                <option value="">Select User...</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department_name})</option>)}
                                            </select>
                                        </div>
                                        {[0, 1].map((idx) => (
                                            <div key={idx}>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Member {idx + 1}</label>
                                                <select 
                                                    value={committees.inspectionMembers[idx]}
                                                    onChange={(e) => {
                                                        const m = [...committees.inspectionMembers];
                                                        m[idx] = e.target.value;
                                                        setCommittees({...committees, inspectionMembers: m});
                                                    }}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                                    required
                                                >
                                                    <option value="">Select User...</option>
                                                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department_name})</option>)}
                                                </select>
                                            </div>
                                        ))}
                                    </div>

                                    <button 
                                        type="submit"
                                        className="w-full inline-flex justify-center rounded-lg bg-indigo-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                                    >
                                        Appoint Committee Roster
                                    </button>
                                </form>
                            </div>
                        )}

                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
