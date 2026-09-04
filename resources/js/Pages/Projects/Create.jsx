import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Create({ 
    approvedProjects = [],
    otherProjects = [],
    strategyCategories = [], 
    iqaStrategies = [], 
    ovecStrategies = [], 
    nationalStrategies = [], 
    provincialStrategies = [], 
    departments = [] 
}) {
    const hasApprovedProjects = approvedProjects && approvedProjects.length > 0;
    const hasOtherProjects = otherProjects && otherProjects.length > 0;
    const { auth } = usePage().props;
    const isPlanOrAdmin = auth?.user?.is_admin || auth?.user?.role_id === 1 || auth?.user?.role_id === 3 || auth?.user?.role?.name?.includes('plan') || auth?.user?.role?.name?.includes('admin');

    const renderStatusBadge = (status, step) => {
        if (status === 'preliminary') {
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold whitespace-nowrap">🟡 รอจัดสรรงบ</span>;
        }
        if (status === 'budget_approved') {
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold whitespace-nowrap">🟢 จัดสรรงบแล้ว</span>;
        }
        if (status === 'approved' || step >= 6) {
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold whitespace-nowrap">✅ อนุมัติแล้ว</span>;
        }
        if (status === 'rejected') {
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-300 text-xs font-bold whitespace-nowrap">✕ ตีกลับแก้ไข</span>;
        }
        if (status === 'draft') {
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold whitespace-nowrap">📝 แบบร่าง</span>;
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold whitespace-nowrap">
                ⏳ รออนุมัติ (ขั้น {step || 1})
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black leading-tight text-purple-950 font-sans">
                            📝 จัดทำและติดตามข้อเสนอโครงการ (Project Proposals)
                        </h2>
                        <p className="text-xs text-slate-500 font-sans mt-0.5">
                            โครงการที่ผ่านการจัดสรรงบประมาณ พร้อมกรอกรายละเอียด และโครงการที่อยู่ระหว่างเสนออนุมัติ
                        </p>
                    </div>
                    <Link
                        href={route('dashboard')}
                        className="text-sm font-medium text-purple-600 hover:text-purple-800 transition"
                    >
                        ← ย้อนกลับหน้าศูนย์ควบคุม
                    </Link>
                </div>
            }
        >
            <Head title="จัดทำและติดตามข้อเสนอโครงการ" />

            <div className="max-w-6xl mx-auto py-6 space-y-8 font-sans px-4 sm:px-6">
                {/* Plan Staff & Admin Overview Banner */}
                {isPlanOrAdmin && (
                    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-4 sm:p-5 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border border-amber-300">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🏛️</span>
                                <h4 className="font-black text-sm sm:text-base">สำหรับเจ้าหน้าที่งานแผนงานและผู้ดูแลระบบ</h4>
                            </div>
                            <p className="text-xs text-amber-100">
                                หน้านี้แสดงเฉพาะการ์ดข้อเสนอโครงการ หากต้องการดู <strong>ตารางสรุปโครงการทั้งหมดของวิทยาลัย และยอดงบประมาณแยกตามฝ่าย</strong> สามารถคลิกดูได้ทันที
                            </p>
                        </div>
                        <Link
                            href={route('dashboard', { tab: 'all_projects' })}
                            className="px-4 py-2 bg-white text-orange-950 hover:bg-amber-50 font-black text-xs rounded-xl shadow-xs transition shrink-0 inline-flex items-center gap-1.5"
                        >
                            <span>📊</span> ดูสรุปโครงการทั้งวิทยาลัย (Table View) ➔
                        </Link>
                    </div>
                )}

                {/* Section 1: Projects ready for Full Proposal Input */}
                {hasApprovedProjects ? (
                    <div className="space-y-5">
                        <div className="bg-gradient-to-r from-purple-900 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-amber-300 text-xs font-bold">
                                    <span>✨</span> โครงการที่ได้รับจัดสรรงบประมาณ ({approvedProjects.length} โครงการ)
                                </div>
                                <h3 className="text-xl font-bold font-sans">เลือกโครงการที่ต้องการจัดทำรายละเอียดฉบับสมบูรณ์</h3>
                                <p className="text-xs text-purple-200">
                                    คลิกปุ่ม "📝 จัดทำรายละเอียดฉบับเต็ม" เพื่อเข้าไปกรอกวัตถุประสงค์ ตัวชี้วัด และยื่นขออนุมัติตามสายงาน 6 ขั้นตอน
                                </p>
                            </div>
                            <Link
                                href={route('projects.quick_create')}
                                className="px-4 py-2.5 bg-white text-purple-950 font-bold text-xs rounded-xl shadow hover:bg-purple-50 transition shrink-0 flex items-center gap-2"
                            >
                                <span>💡</span> เสนอโครงการเบื้องต้นเพิ่ม
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {approvedProjects.map((proj) => (
                                <div
                                    key={proj.id}
                                    className="bg-white rounded-2xl p-6 shadow-md border border-purple-100 hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                                                ปีงบประมาณ {proj.academic_year}
                                            </span>
                                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                                <span>🟢</span> จัดสรรงบแล้ว
                                            </span>
                                        </div>

                                        <h4 className="text-base font-bold text-slate-900 leading-snug font-sans">
                                            {proj.title}
                                        </h4>

                                        <div className="text-xs text-slate-500 space-y-1">
                                            <p>🏢 <strong>ฝ่าย/งาน:</strong> {proj.department?.name || '-'}</p>
                                            <p>👤 <strong>ผู้รับผิดชอบ:</strong> {proj.responsible_person || '-'}</p>
                                            {proj.funding_source && (
                                                <p>🏷️ <strong>แหล่งเงินทุน:</strong> <span className="font-semibold text-purple-900">{proj.funding_source.name}</span></p>
                                            )}
                                        </div>

                                        <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                                            <div>
                                                <span className="text-[11px] text-emerald-800 font-medium block">วงเงินที่ได้รับการจัดสรร</span>
                                                <span className="text-lg font-black text-emerald-900">
                                                    {Number(proj.allocated_budget || proj.estimated_budget || 0).toLocaleString()} <span className="text-xs font-normal">บาท</span>
                                                </span>
                                            </div>
                                            {proj.proposed_budget && Number(proj.proposed_budget) !== Number(proj.allocated_budget) && (
                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-500 block">จากที่ขอตั้งงบ</span>
                                                    <span className="text-xs text-slate-600 line-through">
                                                        {Number(proj.proposed_budget).toLocaleString()} บ.
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Link
                                        href={route('projects.edit', proj.id)}
                                        className="w-full py-3 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow hover:shadow-md transition flex items-center justify-center gap-2"
                                    >
                                        <span>📝</span> จัดทำรายละเอียดฉบับเต็ม (พร้อมใช้ AI ยกร่าง) →
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Notice Banner when there are no new projects awaiting full proposal input */
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl shrink-0 border border-purple-200">
                                📋
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-900">
                                    ไม่มีโครงการใหม่ที่รอจัดทำฉบับเต็ม (Draft)
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {hasOtherProjects 
                                        ? 'โครงการของท่านได้รับการกรอกข้อมูลและยื่นเสนออนุมัติ / ผ่านการอนุมัติเรียบร้อยแล้ว สามารถดูรายละเอียดด้านล่างได้เลยครับ'
                                        : 'หากต้องการเริ่มโครงการใหม่ สามารถยื่นขอตั้งงบประมาณเบื้องต้นได้ทันที'}
                                </p>
                            </div>
                        </div>

                        <Link
                            href={route('projects.quick_create')}
                            className="px-5 py-3 bg-gradient-to-r from-purple-700 to-indigo-600 text-white font-bold text-xs rounded-2xl shadow hover:shadow-md hover:scale-105 transition shrink-0 flex items-center gap-2"
                        >
                            <span>💡</span> เสนอโครงการเบื้องต้น (ขอตั้งงบ)
                        </Link>
                    </div>
                )}

                {/* Section 2: Other Active / Approved Projects */}
                {hasOtherProjects && (
                    <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <span>📁</span> รายการโครงการของท่าน (ที่ยื่นเสนอและผ่านการอนุมัติแล้ว)
                                </h3>
                                <p className="text-xs text-slate-500">
                                    สามารถกดดูแบบฟอร์มเอกสารทางการ พิมพ์ PDF หรือติดตามขั้นตอนการพิจารณาได้ทันที
                                </p>
                            </div>
                            <span className="text-xs font-bold px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                                {otherProjects.length} โครงการ
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {otherProjects.map((proj) => (
                                <div
                                    key={proj.id}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                                                ปีงบประมาณ {proj.academic_year}
                                            </span>
                                            {renderStatusBadge(proj.status, proj.current_approval_step)}
                                        </div>

                                        <h4 className="text-base font-bold text-slate-900 leading-snug font-sans">
                                            {proj.title}
                                        </h4>

                                        <div className="text-xs text-slate-500 space-y-1">
                                            <p>🏢 <strong>ฝ่าย/งาน:</strong> {proj.department?.name || '-'}</p>
                                            <p>👤 <strong>ผู้รับผิดชอบ:</strong> {proj.responsible_person || '-'}</p>
                                            {proj.funding_source && (
                                                <p>🏷️ <strong>แหล่งเงินทุน:</strong> <span className="font-semibold text-purple-900">{proj.funding_source.name}</span></p>
                                            )}
                                        </div>

                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                                            <div>
                                                <span className="text-[10px] text-slate-500 block">งบประมาณโครงการ</span>
                                                <span className="text-base font-black text-slate-900">
                                                    {Number(proj.allocated_budget || proj.estimated_budget || proj.proposed_budget || 0).toLocaleString()} <span className="text-xs font-normal">บาท</span>
                                                </span>
                                            </div>
                                            {proj.approved_at && (
                                                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                                    อนุมัติเมื่อ {new Date(proj.approved_at).toLocaleDateString('th-TH')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                                        <Link
                                            href={route('projects.show', proj.id)}
                                            className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs rounded-xl border border-purple-200 transition flex items-center justify-center gap-1.5"
                                        >
                                            <span>👁️</span> ดูรายละเอียด
                                        </Link>

                                        <Link
                                            href={route('projects.print', proj.id)}
                                            target="_blank"
                                            className="py-2.5 px-3 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                                        >
                                            <span>🖨️</span> พิมพ์ / PDF
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section 3: If truly no projects exist at all */}
                {!hasApprovedProjects && !hasOtherProjects && (
                    <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-purple-100 text-center space-y-6">
                        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-5xl shadow-inner border border-amber-200">
                            💡
                        </div>

                        <div className="space-y-3 max-w-xl mx-auto">
                            <h3 className="text-2xl font-black text-slate-800 font-sans">
                                เริ่มต้นเสนอโครงการของคุณ
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed font-sans">
                                ยื่น <strong className="text-purple-950">"เสนอโครงการเบื้องต้น (ขอตั้งงบ)"</strong> เพื่อรับการพิจารณาจัดสรรงบประมาณจากงานแผนงานก่อนเริ่มดำเนินการจัดทำโครงการฉบับเต็มครับ
                            </p>
                        </div>

                        <div className="flex justify-center pt-2">
                            <Link
                                href={route('projects.quick_create')}
                                className="px-6 py-3.5 bg-gradient-to-r from-purple-700 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <span>💡</span> ไปที่หน้าเสนอโครงการเบื้องต้น (ขอตั้งงบ)
                            </Link>
                        </div>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
