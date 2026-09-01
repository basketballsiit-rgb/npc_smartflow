import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function QuickCreate({ auth, departments, currentFiscalYear }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        academic_year: currentFiscalYear || new Date().getFullYear() + 543,
        department_id: auth.user.department_id || (departments?.[0]?.id || ''),
        proposed_budget: '',
        responsible_person: auth.user.name || '',
        position: auth.user.position || 'ครูผู้สอน',
        phone: '',
        email: auth.user.email || '',
        background_rationale: '',
    });

    const isPlanStaff = auth.user.is_admin || (auth.user.role?.name === 'plan_head' || auth.user.role?.name === 'admin');

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('projects.preliminary_store'), {
            onSuccess: () => {
                Swal.fire({
                    title: '🎉 เสนอโครงการสำเร็จ!',
                    text: 'บันทึกคำของบประมาณโครงการเบื้องต้นเรียบร้อยแล้ว รอการพิจารณาจัดสรรงบจากงานแผนงาน/คณะกรรมการ',
                    icon: 'success',
                    confirmButtonColor: '#7c3aed',
                });
            },
            onError: (err) => {
                Swal.fire({
                    title: 'เกิดข้อผิดพลาด',
                    text: 'กรุณาตรวจสอบความถูกต้องของข้อมูลที่กรอก',
                    icon: 'error',
                    confirmButtonColor: '#7c3aed',
                });
            }
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold leading-tight text-purple-950 flex items-center gap-2">
                            <span>💡</span> เสนอคำของบประมาณโครงการเบื้องต้น (Preliminary Project Proposal)
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            เสนอชื่อโครงการและงบประมาณที่ต้องการใช้ประจำปี เพื่อให้คณะกรรมการ/งานแผนงานพิจารณากำหนดกรอบงบประมาณก่อนจัดทำรายละเอียดโครงการฉบับสมบูรณ์
                        </p>
                    </div>
                    <Link
                        href={route('dashboard')}
                        className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-xs font-bold text-purple-900 shadow-2xs hover:bg-purple-50 transition-colors"
                    >
                        ← ย้อนกลับหน้าศูนย์ควบคุม
                    </Link>
                </div>
            }
        >
            <Head title="เสนอโครงการเบื้องต้น - NPC SMART FLOW" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-3xl border border-purple-100 bg-white p-6 sm:p-8 shadow-sm">
                        
                        {/* Info Banner */}
                        <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-5 text-white shadow-md">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">📌</span>
                                <div>
                                    <h3 className="text-base font-bold">ขั้นตอนที่ 1: เสนอโครงการเพื่อขอรับการจัดสรรงบประมาณ</h3>
                                    <p className="text-xs text-purple-200 mt-0.5">
                                        กรอกเฉพาะชื่อโครงการและวงเงินงบประมาณที่ต้องการใช้ เมื่อคณะกรรมการอนุมัติจัดสรรงบประมาณแล้ว ท่านจึงจะเข้ามากรอกรายละเอียด วัตถุประสงค์ และแผนดำเนินงานในขั้นตอนถัดไป
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 text-sm text-slate-800">
                            
                            {/* Form Box */}
                            <div className="space-y-4 rounded-2xl border border-purple-100 bg-purple-50/30 p-5 sm:p-6">
                                <h4 className="text-sm font-bold text-purple-950 border-b border-purple-100 pb-2">
                                    1. ข้อมูลคำของบประมาณโครงการเบื้องต้น
                                </h4>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        ชื่อโครงการที่เสนอขอ (Project Title) *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="w-full rounded-xl border-purple-200 px-4 py-2.5 text-sm font-bold text-purple-950 focus:border-purple-500 focus:ring-purple-500"
                                        placeholder="เช่น โครงการพัฒนาทักษะวิชาชีพสู่มาตรฐานสากล ประจำปีงบประมาณ 2569"
                                        required
                                    />
                                    {errors.title && <span className="text-xs text-rose-500 mt-1 block">{errors.title}</span>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">ปีงบประมาณ พ.ศ. *</label>
                                        <input
                                            type="number"
                                            value={data.academic_year}
                                            onChange={(e) => setData('academic_year', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-purple-500 font-semibold text-purple-950"
                                            required
                                        />
                                        {errors.academic_year && <span className="text-xs text-rose-500 mt-1 block">{errors.academic_year}</span>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">วงเงินงบประมาณที่ขอเสนอ (บาท) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.proposed_budget}
                                            onChange={(e) => setData('proposed_budget', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-sm font-bold text-purple-900 focus:border-purple-500 focus:ring-purple-500"
                                            placeholder="50000.00"
                                            required
                                        />
                                        {errors.proposed_budget && <span className="text-xs text-rose-500 mt-1 block">{errors.proposed_budget}</span>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">ฝ่าย / งานที่เสนอโครงการ *</label>
                                        <select
                                            value={data.department_id}
                                            onChange={(e) => setData('department_id', e.target.value)}
                                            disabled={!isPlanStaff}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs font-medium focus:border-purple-500 focus:ring-purple-500 disabled:bg-slate-100"
                                        >
                                            {(departments || []).map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">ผู้รับผิดชอบโครงการ (ชื่อ-สกุล) *</label>
                                        <input
                                            type="text"
                                            value={data.responsible_person}
                                            onChange={(e) => setData('responsible_person', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">ตำแหน่ง</label>
                                        <input
                                            type="text"
                                            value={data.position}
                                            onChange={(e) => setData('position', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                                        <input
                                            type="text"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                            placeholder="08x-xxxxxxx"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">อีเมลติดต่อ</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        เหตุผลความจำเป็น / วัตถุประสงค์โดยย่อ
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={data.background_rationale}
                                        onChange={(e) => setData('background_rationale', e.target.value)}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2 text-xs"
                                        placeholder="ระบุเหตุผลความจำเป็นสั้นๆ เพื่อประกอบการพิจารณาจัดสรรงบประมาณ..."
                                    ></textarea>
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex justify-end gap-x-4 border-t border-purple-100 pt-6">
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    ยกเลิก
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-600/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                                >
                                    🚀 ยื่นเสนอโครงการเบื้องต้น
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
