import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function RoleDelegationSection({ delegationsGiven = [], delegationsReceived = [], allCollegeUsers = [] }) {
    const [isCreating, setIsCreating] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        delegate_user_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        acting_position: '',
        reason: 'ไปราชการ',
        order_number: '',
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('role_delegations.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setIsCreating(false);
                Swal.fire({
                    title: 'บันทึกสำเร็จ!',
                    text: 'บันทึกคำสั่งมอบอำนาจรักษาการแทนเรียบร้อยแล้ว ระบบจะส่งต่องานไปยังผู้รักษาการโดยอัตโนมัติ',
                    icon: 'success',
                    confirmButtonColor: '#7c3aed',
                });
            },
            onError: (errs) => {
                const msg = Object.values(errs).flat().join('<br/>') || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
                Swal.fire({
                    title: 'ข้อผิดพลาด',
                    html: msg,
                    icon: 'error',
                });
            }
        });
    };

    const handleToggle = (id) => {
        router.post(route('role_delegations.toggle', id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: 'สำเร็จ',
                    text: 'อัปเดตสถานะคำสั่งมอบอำนาจเรียบร้อยแล้ว',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'ยืนยันการลบคำสั่ง?',
            text: 'คุณต้องการลบคำสั่งมอบอำนาจรักษาการนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ใช่, ลบคำสั่ง',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('role_delegations.destroy', id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: 'ลบเรียบร้อย',
                            text: 'ลบคำสั่งมอบอำนาจรักษาการแทนเรียบร้อยแล้ว',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false,
                        });
                    }
                });
            }
        });
    };

    const formatThaiDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const isEffectiveNow = (delegation) => {
        if (!delegation.is_active) return false;
        const now = new Date().toISOString().split('T')[0];
        const start = delegation.start_date ? delegation.start_date.split('T')[0] : '';
        const end = delegation.end_date ? delegation.end_date.split('T')[0] : '';
        return now >= start && now <= end;
    };

    return (
        <section className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-purple-950 flex items-center gap-2">
                        <span>🏛️</span> ระบบรักษาการแทน / มอบอำนาจ (Acting & Delegation Role)
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        เมื่อหัวหน้างานหรือรองผู้อำนวยการไปราชการ สามารถตั้งค่า "ผู้รักษาการแทน" ในช่วงเวลานั้นได้ ระบบจะส่งคิวงานไปให้ผู้รักษาการลงนามแทนได้ทันที พร้อมประทับข้อความใต้ลายเซ็นอัตโนมัติว่า "รักษาการในตำแหน่ง..." โดยไม่ต้องแก้โครงสร้างองค์กรหลัก
                    </p>
                </div>
                {!isCreating && (
                    <button
                        type="button"
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md hover:scale-102 transition-all cursor-pointer shrink-0"
                    >
                        <span>➕</span> มอบอำนาจรักษาการแทน
                    </button>
                )}
            </header>

            {/* Form Create Delegation */}
            {isCreating && (
                <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 shadow-sm animate-fade-in">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-purple-200/80">
                        <h3 className="font-bold text-sm text-purple-950 flex items-center gap-2">
                            <span>✍️</span> บันทึกคำสั่งตั้งผู้รักษาการแทน / มอบอำนาจ
                        </h3>
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-bold"
                        >
                            ✕ ปิด
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Delegate User Select */}
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">
                                    ผู้รับมอบอำนาจ / ผู้รักษาการแทน <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    value={data.delegate_user_id}
                                    onChange={(e) => setData('delegate_user_id', e.target.value)}
                                    className="w-full text-xs rounded-xl border-purple-200 focus:border-purple-500 focus:ring-purple-500 bg-white"
                                >
                                    <option value="">-- เลือกบุคลากรผู้รับมอบอำนาจ --</option>
                                    {allCollegeUsers.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} ({u.position_level || u.position || 'บุคลากร'})
                                        </option>
                                    ))}
                                </select>
                                {errors.delegate_user_id && <p className="text-[11px] text-rose-500 mt-1">{errors.delegate_user_id}</p>}
                            </div>

                            {/* Acting Position Text */}
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">
                                    ตำแหน่งรักษาการแทน (ประทับใต้ลายเซ็น)
                                </label>
                                <input
                                    type="text"
                                    value={data.acting_position}
                                    onChange={(e) => setData('acting_position', e.target.value)}
                                    placeholder="เว้นว่างไว้เพื่อให้ระบบกำหนดอัตโนมัติตามตำแหน่งของท่าน"
                                    className="w-full text-xs rounded-xl border-purple-200 focus:border-purple-500 focus:ring-purple-500 bg-white"
                                />
                                <p className="text-[10px] text-slate-400 mt-0.5">เช่น รักษาการในตำแหน่งผู้อำนวยการวิทยาลัยสารพัดช่างน่าน</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Start Date */}
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">
                                    วันที่เริ่มมีผล <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={data.start_date}
                                    onChange={(e) => setData('start_date', e.target.value)}
                                    className="w-full text-xs rounded-xl border-purple-200 focus:border-purple-500 focus:ring-purple-500 bg-white"
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">
                                    วันที่สิ้นสุดผล <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={data.end_date}
                                    onChange={(e) => setData('end_date', e.target.value)}
                                    className="w-full text-xs rounded-xl border-purple-200 focus:border-purple-500 focus:ring-purple-500 bg-white"
                                />
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">
                                    เหตุผลความจำเป็น
                                </label>
                                <input
                                    type="text"
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    placeholder="เช่น ไปราชการ, ลาพักผ่อน"
                                    className="w-full text-xs rounded-xl border-purple-200 focus:border-purple-500 focus:ring-purple-500 bg-white"
                                />
                            </div>

                            {/* Order Number */}
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">
                                    เลขที่คำสั่งแต่งตั้ง (ถ้ามี)
                                </label>
                                <input
                                    type="text"
                                    value={data.order_number}
                                    onChange={(e) => setData('order_number', e.target.value)}
                                    placeholder="เช่น คำสั่งที่ 123/2569"
                                    className="w-full text-xs rounded-xl border-purple-200 focus:border-purple-500 focus:ring-purple-500 bg-white"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                                หมายเหตุเพิ่มเติม
                            </label>
                            <textarea
                                rows={2}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="บันทึกข้อความหรือเงื่อนไขเพิ่มเติม (ถ้ามี)"
                                className="w-full text-xs rounded-xl border-purple-200 focus:border-purple-500 focus:ring-purple-500 bg-white"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <span>💾</span> {processing ? 'กำลังบันทึก...' : 'บันทึกคำสั่งมอบอำนาจ'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List 1: คำสั่งมอบอำนาจที่ฉันสร้าง (ฉันมอบให้ผู้อื่น) */}
            <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <span>📤</span> คำสั่งมอบอำนาจที่ท่านตั้งขึ้น (Delegations Given)
                </h3>

                {delegationsGiven.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-purple-200 text-center text-xs text-slate-400 bg-purple-50/20">
                        ยังไม่มีคำสั่งมอบอำนาจรักษาการแทนที่ท่านตั้งขึ้น
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-purple-100">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-purple-50/70 text-purple-950 font-bold border-b border-purple-100">
                                <tr>
                                    <th className="px-4 py-2.5">ผู้รักษาการแทน</th>
                                    <th className="px-4 py-2.5">ตำแหน่งรักษาการ (ประทับตรา)</th>
                                    <th className="px-4 py-2.5">ช่วงเวลาที่มีผล</th>
                                    <th className="px-4 py-2.5">เหตุผล / เลขที่คำสั่ง</th>
                                    <th className="px-4 py-2.5 text-center">สถานะ</th>
                                    <th className="px-4 py-2.5 text-right">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-50">
                                {delegationsGiven.map((item) => {
                                    const effective = isEffectiveNow(item);
                                    return (
                                        <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                                            <td className="px-4 py-3 font-bold text-slate-900">
                                                {item.delegate_user?.name || `User #${item.delegate_user_id}`}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-purple-900">
                                                {item.acting_position || '-'}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-slate-600">
                                                {formatThaiDate(item.start_date)} - {formatThaiDate(item.end_date)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                <div>{item.reason || 'ไปราชการ'}</div>
                                                {item.order_number && (
                                                    <div className="text-[10px] text-slate-400">คำสั่ง: {item.order_number}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {effective ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        ● กำลังมีผล
                                                    </span>
                                                ) : item.is_active ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                        รอกำหนดเวลา
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                        ปิดใช้งาน
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggle(item.id)}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                                                        item.is_active
                                                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                                    }`}
                                                >
                                                    {item.is_active ? 'ระงับ' : 'เปิดใช้งาน'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item.id)}
                                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                                                >
                                                    ลบ
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* List 2: คำสั่งมอบอำนาจที่ฉันได้รับมอบหมาย (ผู้อื่นมอบให้ฉันรักษาการแทน) */}
            <div className="space-y-3 pt-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <span>📥</span> ภาระหน้าที่รักษาการแทนที่ได้รับมอบหมาย (Delegations Received)
                </h3>

                {delegationsReceived.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-purple-200 text-center text-xs text-slate-400 bg-purple-50/20">
                        ท่านยังไม่ได้รับมอบหมายให้รักษาการแทนจากผู้บริหารหรือหัวหน้างานท่านใด
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-purple-100">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-purple-50/70 text-purple-950 font-bold border-b border-purple-100">
                                <tr>
                                    <th className="px-4 py-2.5">ผู้มอบอำนาจ</th>
                                    <th className="px-4 py-2.5">หน้าที่ / ตำแหน่งรักษาการแทน</th>
                                    <th className="px-4 py-2.5">ช่วงเวลาที่ปฏิบัติหน้าที่แทน</th>
                                    <th className="px-4 py-2.5">เหตุผลความจำเป็น</th>
                                    <th className="px-4 py-2.5 text-center">สถานะสิทธิ์</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-50">
                                {delegationsReceived.map((item) => {
                                    const effective = isEffectiveNow(item);
                                    return (
                                        <tr key={item.id} className={`${effective ? 'bg-amber-50/40 font-medium' : 'hover:bg-purple-50/30'}`}>
                                            <td className="px-4 py-3 font-bold text-slate-900">
                                                {item.principal_user?.name || `User #${item.user_id}`}
                                                <div className="text-[10px] text-slate-400">{item.principal_user?.position || ''}</div>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-purple-950">
                                                {item.acting_position || '-'}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-slate-600">
                                                {formatThaiDate(item.start_date)} - {formatThaiDate(item.end_date)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                <div>{item.reason || 'ไปราชการ'}</div>
                                                {item.order_number && (
                                                    <div className="text-[10px] text-slate-400">คำสั่ง: {item.order_number}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {effective ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-2xs">
                                                        ✓ มีอำนาจลงนามแทนขณะนี้
                                                    </span>
                                                ) : item.is_active ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                        ยังไม่ถึงกำหนดเวลา
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                                        คำสั่งถูกระงับ
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}
