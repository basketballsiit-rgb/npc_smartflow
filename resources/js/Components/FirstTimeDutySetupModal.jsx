import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function FirstTimeDutySetupModal({
    isOpen,
    onClose,
    user,
    departmentsData = {},
}) {
    if (!isOpen) return null;

    const divisions = departmentsData.divisions || [];
    const subDepartments = departmentsData.sub_departments || [];
    const availableMajors = departmentsData.available_majors || [
        'ช่างยนต์',
        'สารสนเทศ',
        'เทคนิคพื้นฐาน',
        'อิเล็กทรอนิกส์',
        'ไฟฟ้า',
        'บัญชี',
        'การตลาด',
        'สามัญสัมพันธ์',
        'ระยะสั้น',
    ];
    const availableDuties = departmentsData.available_duties || [
        'หัวหน้างาน',
        'หัวหน้าสาขาวิชา',
        'เจ้าหน้าที่',
        'ครูผู้สอน',
    ];

    // List of positions added by user
    const [positionsList, setPositionsList] = useState(() => {
        if (user?.all_positions && user.all_positions.length > 0) {
            return user.all_positions.map((p, idx) => ({
                id: p.id || null,
                department_id: p.department_id || divisions[0]?.id || 1,
                duty: p.duty || 'ครูผู้สอน',
                sub_department_id: p.sub_department_id || null,
                major: p.major || '',
                is_primary: p.is_primary ?? (idx === 0),
            }));
        }
        return [];
    });

    // Form state for adding/editing a duty
    const [currentForm, setCurrentForm] = useState({
        department_id: divisions[0]?.id || 1,
        duty: 'ครูผู้สอน',
        sub_department_id: '',
        major: availableMajors[0] || 'ช่างยนต์',
        is_primary: true,
    });

    const [editingIndex, setEditingIndex] = useState(null); // null = new, number = editing
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // Available sub-departments for currently selected division in form
    const currentWorks = subDepartments.filter(
        (sub) => sub.parent_id === Number(currentForm.department_id)
    );

    // Helpers to get display text
    const getDivisionName = (deptId) => {
        const d = divisions.find((div) => div.id === Number(deptId));
        return d ? d.name : 'ไม่ได้ระบุฝ่าย';
    };

    const getSubDeptName = (subId) => {
        const s = subDepartments.find((sub) => sub.id === Number(subId));
        return s ? s.name : '';
    };

    const formatDutySummary = (pos) => {
        const divName = getDivisionName(pos.department_id);
        const duty = pos.duty || '';
        if (duty === 'หัวหน้าสาขาวิชา' || duty === 'ครูผู้สอน') {
            const major = pos.major || getSubDeptName(pos.sub_department_id) || 'ไม่ระบุสาขา';
            return {
                title: `${duty} - สาขาวิชา${major}`,
                division: divName,
            };
        }
        const workName = getSubDeptName(pos.sub_department_id);
        return {
            title: workName ? `${duty}${workName}` : duty,
            division: divName,
        };
    };

    // When division changes, adjust duty or sub_department_id if needed
    const handleDivisionChange = (newDeptId) => {
        const deptIdNum = Number(newDeptId);
        const works = subDepartments.filter((sub) => sub.parent_id === deptIdNum);
        
        let newDuty = currentForm.duty;
        let newMajor = currentForm.major;
        let newSubDeptId = works[0]?.id || '';

        // If academic division (id=2), default duty can be ครูผู้สอน or existing
        if (deptIdNum === 2 && !newDuty) {
            newDuty = 'ครูผู้สอน';
        }

        setCurrentForm((prev) => ({
            ...prev,
            department_id: deptIdNum,
            duty: newDuty,
            sub_department_id: newSubDeptId,
            major: newMajor,
        }));
        setFormError('');
    };

    // When duty changes, adjust fields
    const handleDutyChange = (newDuty) => {
        let deptId = currentForm.department_id;
        // If head of major or teacher, academic division is parent id 2
        if ((newDuty === 'หัวหน้าสาขาวิชา' || newDuty === 'ครูผู้สอน') && deptId !== 2) {
            const acadDept = divisions.find((d) => d.name.includes('วิชาการ') || d.id === 2);
            if (acadDept) deptId = acadDept.id;
        }

        const works = subDepartments.filter((sub) => sub.parent_id === Number(deptId));
        setCurrentForm((prev) => ({
            ...prev,
            department_id: deptId,
            duty: newDuty,
            sub_department_id: works[0]?.id || '',
            major: prev.major || availableMajors[0] || 'ช่างยนต์',
        }));
        setFormError('');
    };

    // Add or Update duty in the list
    const handleAddOrUpdateDuty = (e) => {
        e.preventDefault();
        setFormError('');

        const isAcademicDuty = currentForm.duty === 'หัวหน้าสาขาวิชา' || currentForm.duty === 'ครูผู้สอน';
        if (isAcademicDuty && !currentForm.major) {
            setFormError('กรุณาเลือกสาขาวิชา');
            return;
        }
        if (!isAcademicDuty && !currentForm.sub_department_id) {
            setFormError('กรุณาเลือกงานที่สังกัด');
            return;
        }

        const itemData = {
            id: currentForm.id || null,
            department_id: Number(currentForm.department_id),
            duty: currentForm.duty,
            sub_department_id: currentForm.sub_department_id ? Number(currentForm.sub_department_id) : null,
            major: currentForm.major || null,
            is_primary: Boolean(currentForm.is_primary),
        };

        let updated = [...positionsList];

        if (itemData.is_primary) {
            // Uncheck any other primary
            updated = updated.map((p) => ({ ...p, is_primary: false }));
        }

        if (editingIndex !== null) {
            updated[editingIndex] = itemData;
        } else {
            updated.push(itemData);
        }

        // Ensure at least one duty is primary
        if (!updated.some((p) => p.is_primary) && updated.length > 0) {
            updated[0].is_primary = true;
        }

        setPositionsList(updated);
        setEditingIndex(null);

        // Reset form for next item
        setCurrentForm({
            department_id: divisions[0]?.id || 1,
            duty: 'เจ้าหน้าที่',
            sub_department_id: '',
            major: availableMajors[0] || 'ช่างยนต์',
            is_primary: false,
        });
    };

    // Edit an existing position in list
    const handleEditItem = (index) => {
        const item = positionsList[index];
        setEditingIndex(index);
        setCurrentForm({
            id: item.id || null,
            department_id: item.department_id,
            duty: item.duty,
            sub_department_id: item.sub_department_id || '',
            major: item.major || (availableMajors[0] || 'ช่างยนต์'),
            is_primary: item.is_primary,
        });
        setFormError('');
    };

    // Cancel edit
    const handleCancelEdit = () => {
        setEditingIndex(null);
        setCurrentForm({
            department_id: divisions[0]?.id || 1,
            duty: 'ครูผู้สอน',
            sub_department_id: '',
            major: availableMajors[0] || 'ช่างยนต์',
            is_primary: positionsList.length === 0,
        });
        setFormError('');
    };

    // Delete a position from list
    const handleDeleteItem = (index) => {
        const wasPrimary = positionsList[index].is_primary;
        const updated = positionsList.filter((_, idx) => idx !== index);
        if (wasPrimary && updated.length > 0) {
            updated[0].is_primary = true;
        }
        setPositionsList(updated);
        if (editingIndex === index) {
            handleCancelEdit();
        }
    };

    // Set an item as primary
    const handleSetPrimary = (index) => {
        const updated = positionsList.map((p, idx) => ({
            ...p,
            is_primary: idx === index,
        }));
        setPositionsList(updated);
    };

    // Submit all positions to backend
    const handleSaveAll = () => {
        if (positionsList.length === 0) {
            Swal.fire({
                title: 'กรุณาระบุหน้าที่และงาน',
                text: 'กรุณากดเพิ่มหน้าที่/งานอย่างน้อย 1 รายการก่อนบันทึกข้อมูล',
                icon: 'warning',
                confirmButtonColor: '#7c3aed',
                confirmButtonText: 'ตกลง',
            });
            return;
        }

        setIsSaving(true);
        axios.post(route('profile.positions.save'), {
            positions: positionsList,
        }, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        })
        .then(() => {
            setIsSaving(false);
            sessionStorage.setItem('dismiss_duty_modal', 'true');
            Swal.fire({
                title: 'บันทึกสำเร็จ!',
                text: 'บันทึกข้อมูลหน้าที่และฝ่าย/งานเรียบร้อยแล้ว ระบบจะอัปเดตสิทธิ์การใช้งานของท่านทันที',
                icon: 'success',
                confirmButtonColor: '#7c3aed',
                confirmButtonText: 'เข้าสู่ระบบ',
            }).then(() => {
                onClose();
                router.reload({ preserveScroll: true });
            });
        })
        .catch((err) => {
            setIsSaving(false);
            const msg = err.response?.data?.message 
                || (err.response?.data?.errors ? Object.values(err.response.data.errors)[0] : null)
                || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบความถูกต้อง';
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: String(msg),
                icon: 'error',
                confirmButtonColor: '#7c3aed',
            });
        });
    };

    const handleDismiss = () => {
        sessionStorage.setItem('dismiss_duty_modal', 'true');
        onClose();
    };

    const isAcademicDuty = currentForm.duty === 'หัวหน้าสาขาวิชา' || currentForm.duty === 'ครูผู้สอน';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-purple-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-purple-200 max-w-2xl w-full overflow-hidden animate-scaleUp my-8 max-h-[92vh] flex flex-col">
                
                {/* 1. Modal Header */}
                <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 p-6 text-white relative shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl border border-white/20 shadow-inner shrink-0">
                            🏢
                        </div>
                        <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-purple-950 text-[10px] font-black tracking-wide uppercase shadow-sm mb-1">
                                กำหนดข้อมูลครั้งแรก
                            </span>
                            <h3 className="text-lg font-black tracking-wide">
                                กำหนดหน้าที่และงานที่รับผิดชอบในสถานศึกษา
                            </h3>
                            <p className="text-xs text-purple-100/90 mt-0.5 leading-relaxed">
                                สวัสดีคุณ <b>{user?.name}</b> กรุณาระบุหน้าที่และงานที่สังกัด เพื่อสิทธิ์การใช้งานและเส้นทางการอนุมัติที่ถูกต้อง
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Modal Body (Scrollable) */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    
                    {/* Notice alert */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200/80 flex items-start gap-3 shadow-xs">
                        <span className="text-xl shrink-0 mt-0.5">💡</span>
                        <div className="text-xs text-purple-950 leading-relaxed space-y-1">
                            <p className="font-black text-purple-900">
                                รองรับผู้ปฏิบัติงานที่มีมากกว่า 1 หน้าที่/งาน
                            </p>
                            <p className="text-purple-800/90 text-[11px]">
                                หากท่านมีหลายภาระงาน (เช่น เป็นทั้งครูผู้สอน และเป็นหัวหน้างาน หรือเจ้าหน้าที่งานอื่น) สามารถเพิ่มหน้าที่ได้มากกว่า 1 รายการ และเลือกระบุหน้าที่หลักได้
                            </p>
                        </div>
                    </div>

                    {/* Section A: Current List of Duties */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <span>📋 รายการหน้าที่และงานของท่าน</span>
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                                    {positionsList.length} รายการ
                                </span>
                            </h4>
                            {positionsList.length > 0 && !editingIndex && (
                                <span className="text-[11px] text-slate-400 font-medium">
                                    คลิก ⭐ เพื่อเปลี่ยนหน้าที่หลัก
                                </span>
                            )}
                        </div>

                        {positionsList.length === 0 ? (
                            <div className="border-2 border-dashed border-purple-200 rounded-2xl p-6 text-center bg-purple-50/30">
                                <span className="text-3xl block mb-2">📌</span>
                                <p className="text-xs font-bold text-purple-950">
                                    ยังไม่มีรายการหน้าที่ที่ระบุ
                                </p>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    กรุณาเลือกฝ่ายและหน้าที่ในแบบฟอร์มด้านล่าง แล้วกดปุ่ม <b>"+ เพิ่มหน้าที่นี้"</b>
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {positionsList.map((pos, idx) => {
                                    const summary = formatDutySummary(pos);
                                    const isItemEditing = editingIndex === idx;

                                    return (
                                        <div
                                            key={idx}
                                            className={`rounded-2xl p-3.5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                                pos.is_primary
                                                    ? 'bg-gradient-to-r from-amber-50/70 via-purple-50/40 to-white border-amber-300 shadow-sm'
                                                    : 'bg-white border-slate-200 hover:border-purple-200'
                                            } ${isItemEditing ? 'ring-2 ring-purple-600 bg-purple-50/60' : ''}`}
                                        >
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetPrimary(idx)}
                                                    title={pos.is_primary ? 'หน้าที่หลัก' : 'คลิกเพื่อตั้งเป็นหน้าที่หลัก'}
                                                    className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 transition-transform active:scale-90 ${
                                                        pos.is_primary
                                                            ? 'bg-amber-400 text-purple-950 shadow-sm ring-2 ring-amber-200'
                                                            : 'bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-600'
                                                    }`}
                                                >
                                                    {pos.is_primary ? '★' : '☆'}
                                                </button>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-black text-xs text-purple-950">
                                                            {summary.title}
                                                        </span>
                                                        {pos.is_primary && (
                                                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-black text-[10px] border border-amber-300 flex items-center gap-1">
                                                                <span>⭐</span> หน้าที่หลัก
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                                        สังกัด: <span className="font-semibold text-purple-900">{summary.division}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                                {!pos.is_primary && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetPrimary(idx)}
                                                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 text-[11px] font-bold transition"
                                                    >
                                                        ตั้งเป็นหลัก
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditItem(idx)}
                                                    className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold transition"
                                                >
                                                    แก้ไข
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteItem(idx)}
                                                    className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold transition"
                                                >
                                                    ลบ
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Section B: Add / Edit Form */}
                    <form
                        onSubmit={handleAddOrUpdateDuty}
                        className="bg-purple-50/60 border border-purple-200/90 rounded-2xl p-4 space-y-3.5 shadow-inner"
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                                <span>{editingIndex !== null ? '✏️ แก้ไขหน้าที่' : '➕ เพิ่มหน้าที่ / ภาระงาน'}</span>
                                {editingIndex !== null && (
                                    <span className="text-[10px] text-purple-600 font-normal">
                                        (ลำดับที่ {editingIndex + 1})
                                    </span>
                                )}
                            </h4>
                            {editingIndex !== null && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="text-[11px] text-rose-600 hover:underline font-bold"
                                >
                                    ยกเลิกการแก้ไข
                                </button>
                            )}
                        </div>

                        {/* Row 1: Division & Duty */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-black text-slate-700 mb-1">
                                    1. ฝ่ายหลักที่สังกัด <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={currentForm.department_id}
                                    onChange={(e) => handleDivisionChange(e.target.value)}
                                    className="w-full text-xs rounded-xl border-purple-200 bg-white font-medium text-slate-800 focus:border-purple-600 focus:ring-purple-200 py-2"
                                >
                                    {divisions.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-slate-700 mb-1">
                                    2. หน้าที่ความรับผิดชอบ <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={currentForm.duty}
                                    onChange={(e) => handleDutyChange(e.target.value)}
                                    className="w-full text-xs rounded-xl border-purple-200 bg-white font-medium text-slate-800 focus:border-purple-600 focus:ring-purple-200 py-2"
                                >
                                    {availableDuties.map((duty) => (
                                        <option key={duty} value={duty}>
                                            {duty}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Major (if academic duty) or Sub-Department (if work duty) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {isAcademicDuty ? (
                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-black text-purple-900 mb-1">
                                        3. สาขาวิชาที่สอนหรือรับผิดชอบ <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={currentForm.major}
                                        onChange={(e) => setCurrentForm({ ...currentForm, major: e.target.value })}
                                        className="w-full text-xs rounded-xl border-purple-200 bg-white font-medium text-slate-800 focus:border-purple-600 focus:ring-purple-200 py-2"
                                    >
                                        {availableMajors.map((m) => (
                                            <option key={m} value={m}>
                                                สาขาวิชา{m}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-black text-purple-900 mb-1">
                                        3. งานที่สังกัด (ภายใต้ {getDivisionName(currentForm.department_id)}) <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={currentForm.sub_department_id}
                                        onChange={(e) => setCurrentForm({ ...currentForm, sub_department_id: e.target.value })}
                                        className="w-full text-xs rounded-xl border-purple-200 bg-white font-medium text-slate-800 focus:border-purple-600 focus:ring-purple-200 py-2"
                                    >
                                        <option value="">-- เลือกงานที่สังกัด --</option>
                                        {currentWorks.map((w) => (
                                            <option key={w.id} value={w.id}>
                                                {w.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Row 3: Primary checkbox & Add button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={Boolean(currentForm.is_primary)}
                                    onChange={(e) => setCurrentForm({ ...currentForm, is_primary: e.target.checked })}
                                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-xs font-bold text-slate-700">
                                    ⭐ กำหนดให้หน้าที่นี้เป็น "หน้าที่หลัก"
                                </span>
                            </label>

                            <button
                                type="submit"
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-200 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer self-stretch sm:self-auto"
                            >
                                {editingIndex !== null ? (
                                    <>
                                        <span>💾</span> อัปเดตหน้าที่นี้
                                    </>
                                ) : (
                                    <>
                                        <span>➕</span> เพิ่มหน้าที่นี้ลงในรายการ
                                    </>
                                )}
                            </button>
                        </div>

                        {formError && (
                            <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1">
                                <span>⚠️</span> {formError}
                            </p>
                        )}
                    </form>
                </div>

                {/* 3. Modal Footer */}
                <div className="p-4 sm:p-6 bg-slate-50 border-t border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <p className="text-[11px] text-slate-500 text-center sm:text-left">
                        * ท่านสามารถเปลี่ยนแปลงหน้าที่ได้ตลอดเวลาที่เมนู <b>"โปรไฟล์ส่วนตัว"</b>
                    </p>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={handleDismiss}
                            disabled={isSaving}
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                            ข้ามไปก่อน
                        </button>

                        <button
                            type="button"
                            onClick={handleSaveAll}
                            disabled={isSaving || positionsList.length === 0}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-200 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <span className="animate-spin">⏳</span> กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <span>💾</span> บันทึกหน้าที่และเริ่มใช้งาน ({positionsList.length})
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
