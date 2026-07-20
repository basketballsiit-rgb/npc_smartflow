import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome({ publicStats, recentProjects }) {
    const { auth } = usePage().props;

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50/80 via-violet-50/40 to-slate-50 text-slate-800 font-sans selection:bg-purple-600 selection:text-white">
            <Head title="หน้าหลัก - NPC SMART FLOW วิทยาลัยสารพัดช่างน่าน" />

            {/* Top Navigation Bar - OVEC White Clean Theme */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-purple-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-x-3.5">
                        <img
                            src="/LogoNPC_PNG.png?v=100"
                            alt="ตราสัญลักษณ์ วิทยาลัยสารพัดช่างน่าน"
                            className="h-12 w-12 object-contain hover:scale-105 transition-transform"
                        />
                        <div>
                            <span className="text-lg font-black tracking-tight text-purple-950 block leading-none">NPC SMART FLOW</span>
                            <span className="text-[11px] font-bold text-purple-700 tracking-wider">วิทยาลัยสารพัดช่างน่าน (Nan Polytechnic College)</span>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-x-8 text-sm font-bold text-slate-700">
                        <a href="#about" className="hover:text-purple-600 transition-colors">เกี่ยวกับระบบ</a>
                        <a href="#pdca" className="hover:text-purple-600 transition-colors">กระบวนการ PDCA</a>
                        <a href="#stats" className="hover:text-purple-600 transition-colors">สถิติภาพรวม</a>
                        <a href="#projects" className="hover:text-purple-600 transition-colors">โครงการที่อนุมัติ</a>
                    </nav>

                    <div className="flex items-center gap-x-4">
                        {auth?.user ? (
                            <Link
                                href={route('dashboard')}
                                className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 transition-all hover:scale-[1.02]"
                            >
                                เข้าสู่ศูนย์ควบคุมระบบ ➔
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:bg-purple-700 transition-all hover:scale-[1.02]"
                            >
                                🔑 เข้าสู่ระบบ (Login)
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section - OVEC Light Gradient */}
            <section id="about" className="relative pt-16 pb-20 px-6 overflow-hidden">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-purple-200/50 blur-[140px] rounded-full pointer-events-none"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    {/* College Official Seal Badge */}
                    <div className="mb-6 flex flex-col items-center justify-center">
                        <div className="relative p-2 rounded-full bg-white/80 border border-purple-200 shadow-xl shadow-purple-500/10 backdrop-blur-md">
                            <img
                                src="/LogoNPC_PNG.png?v=100"
                                alt="ตราสัญลักษณ์ วิทยาลัยสารพัดช่างน่าน"
                                className="h-36 w-36 object-contain"
                            />
                        </div>
                        <span className="inline-flex items-center gap-x-2 rounded-full bg-purple-100/80 px-4 py-1.5 text-xs font-bold text-purple-900 border border-purple-200 mt-4 shadow-sm">
                            🏛️ สถาบันการอาชีวศึกษา - วิทยาลัยสารพัดช่างน่าน
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                        ระบบวางแผน งบประมาณ <br />
                        <span className="bg-gradient-to-r from-purple-700 via-indigo-600 to-red-600 bg-clip-text text-transparent">
                            และประเมินผลโครงการดิจิทัล
                        </span>
                    </h1>
                    
                    <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                        ระบบ NPC SMART FLOW ของวิทยาลัยสารพัดช่างน่าน ออกแบบขึ้นเพื่อเพิ่มประสิทธิภาพการบริหารจัดการงานโครงการตามหลักประกันคุณภาพการศึกษา ยกระดับวงจร PDCA ให้เป็นดิจิทัลครบวงจร โปร่งใส ตรวจสอบได้ และประมวลผลด้วยปัญญาประดิษฐ์ (AI)
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href={route('login')}
                            className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-purple-500/30 hover:scale-[1.02] transition-all"
                        >
                            เข้าสู่ระบบใช้งาน (Login)
                        </Link>
                        <a
                            href="#pdca"
                            className="w-full sm:w-auto rounded-2xl border border-purple-200 bg-white/90 px-8 py-4 text-base font-bold text-purple-800 shadow-sm hover:bg-purple-50 transition-all"
                        >
                            เรียนรู้ระบบ PDCA 4 ขั้นตอน ➔
                        </a>
                    </div>
                </div>
            </section>

            {/* Public Live Stats Banner */}
            <section id="stats" className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="rounded-2xl border border-purple-100 bg-white/80 p-6 shadow-md shadow-purple-500/5 backdrop-blur-sm">
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">โครงการเสนอขอทั้งหมด</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">{publicStats?.totalProjects || 0} <span className="text-sm font-normal text-slate-500">โครงการ</span></p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white/80 p-6 shadow-md shadow-purple-500/5 backdrop-blur-sm">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">ผ่านการอนุมัติแล้ว</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">{publicStats?.approvedProjects || 0} <span className="text-sm font-normal text-slate-500">โครงการ</span></p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white/80 p-6 shadow-md shadow-purple-500/5 backdrop-blur-sm">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">วงเงินงบประมาณขับเคลื่อน</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">
                            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(publicStats?.totalBudget || 0)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white/80 p-6 shadow-md shadow-purple-500/5 backdrop-blur-sm">
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">ดัชนีความพึงพอใจเฉลี่ย</span>
                        <p className="mt-2 text-3xl font-black text-slate-900">{publicStats?.satisfactionRate || 96.5}% <span className="text-sm font-normal text-slate-500">ระดับดีเยี่ยม</span></p>
                    </div>
                </div>
            </section>

            {/* PDCA 4-Phase Architecture */}
            <section id="pdca" className="max-w-7xl mx-auto px-6 py-16 border-t border-purple-100">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 mb-3">สถาปัตยกรรม 4-Phase PDCA</h2>
                    <p className="text-sm text-slate-600">ควบคุมคุณภาพตามมาตรฐานประกันคุณภาพการศึกษาอาชีวศึกษา</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* PLAN */}
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all space-y-3">
                        <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-black text-lg">
                            P
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">1. PLAN (วางแผน)</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            อาจารย์สร้างข้อเสนอโครงการ กำหนดวัตถุประสงค์ ตัวชี้วัด และเชื่อมโยงยุทธศาสตร์สถานศึกษา (IQA / OVEC) พร้อมระบบอนุมัติดิจิทัล 6 ขั้นตอน
                        </p>
                    </div>

                    {/* DO */}
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all space-y-3">
                        <div className="h-12 w-12 rounded-xl bg-violet-100 text-violet-700 border border-violet-200 flex items-center justify-center font-black text-lg">
                            D
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">2. DO (ดำเนินงาน)</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            งานวางแผนทำการผูกพันงบประมาณอัตโนมัติ งานพัสดุแต่งตั้งคณะกรรมการจัดซื้อจัดจ้างและออกเอกสารพัสดุ 4 ฉบับล่วงหน้า (บันทึก, ใบเสนอซื้อ, ราคากลาง, TOR)
                        </p>
                    </div>

                    {/* CHECK */}
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all space-y-3">
                        <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-lg">
                            C
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">3. CHECK (ตรวจสอบ)</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            สร้าง QR Code แบบประเมินความพึงพอใจสำหรับผู้เข้าร่วมโครงการอัตโนมัติ รวบรวมข้อเสนอแนะและคำนวณค่าเฉลี่ยสถิติแบบเรียลไทม์
                        </p>
                    </div>

                    {/* ACT */}
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all space-y-3">
                        <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center font-black text-lg">
                            A
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">4. ACT (ปรับปรุง)</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            AI Gemini วิเคราะห์ข้อเสนอแนะเพื่อสร้างแนวทางปรับปรุงในอนาคต รวมเล่มรายงานสรุป PDF Stitching แนบรูปกิจกรรมและภาคผนวกฉบับสมบูรณ์
                        </p>
                    </div>
                </div>
            </section>

            {/* Public Catalog of Recent Approved Projects */}
            <section id="projects" className="max-w-7xl mx-auto px-6 py-16 border-t border-purple-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">โครงการที่ได้รับอนุมัติล่าสุด</h2>
                        <p className="text-xs text-slate-600 mt-1">แสดงรายการโครงการสาธารณะของวิทยาลัยสารพัดช่างน่าน</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {!recentProjects || recentProjects.length === 0 ? (
                        <div className="col-span-full py-10 text-center text-xs text-slate-500">
                            ยังไม่มีรายการโครงการที่ผ่านการอนุมัติแสดงในระบบ
                        </div>
                    ) : (
                        recentProjects.map((project) => (
                            <div key={project.id} className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                <div className="space-y-3">
                                    <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                        ✓ ผ่านการอนุมัติ
                                    </span>
                                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{project.title}</h4>
                                    <p className="text-xs text-slate-600">{project.department}</p>
                                </div>
                                <div className="border-t border-purple-100 pt-3 mt-4 flex justify-between items-center text-xs">
                                    <span className="text-slate-500">ปีการศึกษา {project.academic_year}</span>
                                    <span className="font-bold text-purple-700">{new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(project.budget)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-purple-100 py-10 text-center text-xs text-slate-600 bg-white/80">
                <div className="flex justify-center items-center gap-x-2 mb-2">
                    <img src="/LogoNPC_PNG.png?v=100" alt="ตราสัญลักษณ์ วิทยาลัยสารพัดช่างน่าน" className="h-8 w-8 object-contain" />
                    <p className="font-bold text-purple-950">วิทยาลัยสารพัดช่างน่าน (Nan Polytechnic College)</p>
                </div>
                <p>© 2026 NPC SMART FLOW ERP System. All rights reserved.</p>
            </footer>
        </div>
    );
}
