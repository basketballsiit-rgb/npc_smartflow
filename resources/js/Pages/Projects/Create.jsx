import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Create({ 
    approvedProjects = [],
    strategyCategories = [], 
    iqaStrategies = [], 
    ovecStrategies = [], 
    nationalStrategies = [], 
    provincialStrategies = [], 
    departments = [] 
}) {
    // If there are no budget-approved projects
    if (!approvedProjects || approvedProjects.length === 0) {
        return (
            <AuthenticatedLayout
                header={
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black leading-tight text-purple-950 font-sans">
                                📝 จัดทำข้อเสนอโครงการฉบับเต็ม (Full Proposal)
                            </h2>
                            <p className="text-xs text-slate-500 font-sans mt-0.5">
                                ขั้นตอนการกรอกรายละเอียด วัตถุประสงค์ และแผนดำเนินงานโครงการที่ได้รับการจัดสรรงบประมาณ
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
                <Head title="จัดทำข้อเสนอโครงการฉบับเต็ม" />

                <div className="max-w-4xl mx-auto py-12 px-4 font-sans">
                    <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-purple-100 text-center space-y-6">
                        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-5xl shadow-inner border border-amber-200">
                            🔒
                        </div>

                        <div className="space-y-3 max-w-xl mx-auto">
                            <h3 className="text-2xl font-black text-slate-800 font-sans">
                                ยังไม่มีโครงการที่ผ่านการอนุมัติจัดสรรงบประมาณ
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed font-sans">
                                ตามขั้นตอนการบริหารงบประมาณประจำปีของวิทยาลัยสารพัดช่างน่าน โครงการจะต้องผ่านการยื่น <strong className="text-purple-950">"เสนอโครงการเบื้องต้น (ขอตั้งงบ)"</strong> และได้รับความเห็นชอบจัดสรรงบประมาณจากงานแผนงาน/คณะกรรมการก่อน จึงจะสามารถเข้ามากรอกรายละเอียดโครงการฉบับเต็มได้ครับ
                            </p>
                        </div>

                        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 text-left max-w-lg mx-auto space-y-2">
                            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                                <span>💡</span> ขั้นตอนการดำเนินการ:
                            </h4>
                            <ol className="text-xs text-amber-800 space-y-2 list-decimal list-inside leading-relaxed font-sans">
                                <li>ยื่นเสนอชื่อโครงการและวงเงินที่ขอรับจัดสรรที่เมนู <span className="font-semibold text-purple-950">"💡 เสนอโครงการเบื้องต้น (ขอตั้งงบ)"</span></li>
                                <li>งานแผนงานและคณะกรรมการพิจารณาจัดสรรงบประมาณและแหล่งเงินทุน</li>
                                <li>เมื่อโครงการได้รับสถานะ <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">🟢 จัดสรรงบแล้ว</span> จึงจะสามารถเข้ามากรอกรายละเอียดฉบับเต็มได้ทันที</li>
                            </ol>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                            <Link
                                href={route('projects.quick_create')}
                                className="px-6 py-3.5 bg-gradient-to-r from-purple-700 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <span>💡</span> ไปที่หน้าเสนอโครงการเบื้องต้น (ขอตั้งงบ)
                            </Link>
                            <Link
                                href={route('dashboard', { tab: 'proposals' })}
                                className="px-6 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <span>📋</span> ตรวจสอบสถานะโครงการของฉัน
                            </Link>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    // If user has budget-approved projects, show the Project Selector List
    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black leading-tight text-purple-950 font-sans">
                            📝 เลือกโครงการที่ได้รับจัดสรรงบประมาณเพื่อจัดทำรายละเอียดฉบับเต็ม
                        </h2>
                        <p className="text-xs text-slate-500 font-sans mt-0.5">
                            โครงการที่ผ่านการพิจารณาจัดสรรงบประมาณจากงานแผนงานและคณะกรรมการเรียบร้อยแล้ว
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
            <Head title="เลือกโครงการเพื่อจัดทำรายละเอียดฉบับเต็ม" />

            <div className="max-w-6xl mx-auto py-6 space-y-6 font-sans">
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
        </AuthenticatedLayout>
    );
}
