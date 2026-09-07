import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage, router } from '@inertiajs/react';
import React, { useState } from 'react';
import Swal from 'sweetalert2';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    divisions = [],
    subDepartments = [],
    availableMajors = [],
    availableDuties = [],
    initialPositions = [],
    className = '',
}) {
    const user = usePage().props.auth.user;

    // ── 1. General Profile Form (Name & Email) ──
    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    // ── 2. Positions & Duties State ──
    const [positionsList, setPositionsList] = useState(() => {
        if (initialPositions && initialPositions.length > 0) {
            return initialPositions.map((p, idx) => ({
                id: p.id,
                department_id: p.department_id || divisions[0]?.id || 1,
                duty: p.duty || (p.position?.includes('หัวหน้า') ? 'หัวหน้างาน' : 'ครูผู้สอน'),
                sub_department_id: p.sub_department_id || null,
                major: p.major || '',
                position: p.position || '',
                is_primary: p.is_primary ?? (idx === 0),
            }));
        }
        return [
            {
                id: null,
                department_id: user.department_id || divisions[0]?.id || 1,
                duty: 'ครูผู้สอน',
                sub_department_id: null,
                major: 'สารสนเทศ',
                position: user.position || 'ครูผู้สอน',
                is_primary: true,
            },
        ];
    });

    const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null); // null = new, number = edit
    const [modalForm, setModalForm] = useState({
        id: null,
        department_id: divisions[0]?.id || 1,
        duty: 'ครูผู้สอน',
        sub_department_id: '',
        major: 'สารสนเทศ',
        is_primary: false,
    });
    const [isSavingPositions, setIsSavingPositions] = useState(false);

    // Helpers
    const getDivisionName = (deptId) => {
        const d = divisions.find((div) => div.id === Number(deptId));
        return d ? d.name : 'ไม่ได้ระบุฝ่าย';
    };

    const getSubDeptName = (subId) => {
        const s = subDepartments.find((sub) => sub.id === Number(subId));
        return s ? s.name : '';
    };

    // Available works under chosen division
    const getWorksForDivision = (deptId) => {
        return subDepartments.filter((sub) => sub.parent_id === Number(deptId));
    };

    // Open Modal to Add New Position
    const handleOpenAddModal = () => {
        const defaultDiv = divisions[0]?.id || 1;
        setEditingIndex(null);
        setModalForm({
            id: null,
            department_id: defaultDiv,
            duty: 'ครูผู้สอน',
            sub_department_id: '',
            major: availableMajors[0] || 'ช่างยนต์',
            is_primary: positionsList.length === 0,
        });
        setIsPositionModalOpen(true);
    };

    // Open Modal to Edit Existing Position
    const handleOpenEditModal = (index) => {
        const item = positionsList[index];
        setEditingIndex(index);
        setModalForm({
            id: item.id,
            department_id: item.department_id,
            duty: item.duty || 'ครูผู้สอน',
            sub_department_id: item.sub_department_id || '',
            major: item.major || (availableMajors[0] || 'ช่างยนต์'),
            is_primary: item.is_primary,
        });
        setIsPositionModalOpen(true);
    };

    // Modal Save Action
    const handleSaveModalItem = (e) => {
        e.preventDefault();

        const updated = [...positionsList];
        const itemData = {
            ...modalForm,
            department_id: Number(modalForm.department_id),
            sub_department_id: modalForm.sub_department_id ? Number(modalForm.sub_department_id) : null,
        };

        if (modalForm.is_primary) {
            // Uncheck other primaries
            updated.forEach((p) => {
                p.is_primary = false;
            });
        }

        if (editingIndex !== null) {
            updated[editingIndex] = itemData;
        } else {
            updated.push(itemData);
        }

        // Ensure at least one primary
        if (!updated.some((p) => p.is_primary) && updated.length > 0) {
            updated[0].is_primary = true;
        }

        setPositionsList(updated);
        setIsPositionModalOpen(false);
    };

    // Set item as primary
    const handleSetPrimary = (index) => {
        const updated = positionsList.map((p, idx) => ({
            ...p,
            is_primary: idx === index,
        }));
        setPositionsList(updated);
    };

    // Delete item
    const handleDeletePosition = (index) => {
        if (positionsList.length <= 1) {
            Swal.fire('แจ้งเตือน', 'ผู้ใช้งานต้องมีภาระงานอย่างน้อย 1 รายการ', 'info');
            return;
        }

        Swal.fire({
            title: 'ยืนยันลบภาระงานนี้?',
            text: 'ต้องการลบรายการภาระงานนี้ออกจากข้อมูลส่วนตัวหรือไม่?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonText: 'ยกเลิก',
            confirmButtonText: 'ลบภาระงาน',
        }).then((result) => {
            if (result.isConfirmed) {
                const wasPrimary = positionsList[index].is_primary;
                const updated = positionsList.filter((_, idx) => idx !== index);
                if (wasPrimary && updated.length > 0) {
                    updated[0].is_primary = true;
                }
                setPositionsList(updated);
            }
        });
    };

    // Submit all positions to backend
    const handleSaveAllPositions = () => {
        if (positionsList.length === 0) {
            Swal.fire('ข้อผิดพลาด', 'กรุณาระบุภาระงานอย่างน้อย 1 รายการ', 'error');
            return;
        }

        setIsSavingPositions(true);
        router.post(
            route('profile.positions.save'),
            { positions: positionsList },
            {
                preserveScroll: true,
                onFinish: () => setIsSavingPositions(false),
                onSuccess: () => {
                    Swal.fire({
                        title: 'สำเร็จ!',
                        text: 'บันทึกข้อมูลฝ่ายและภาระงานทั้งหมดเรียบร้อยแล้ว',
                        icon: 'success',
                        confirmButtonColor: '#7c3aed',
                    });
                },
                onError: (err) => {
                    const msg = Object.values(err)[0] || 'ไม่สามารถบันทึกข้อมูลภาระงานได้ กรุณาตรวจสอบความถูกต้อง';
                    Swal.fire({
                        title: 'เกิดข้อผิดพลาด',
                        text: String(msg),
                        icon: 'error',
                        confirmButtonColor: '#7c3aed',
                    });
                },
            }
        );
    };

    const getDutyBadgeColor = (duty) => {
        switch (duty) {
            case 'หัวหน้างาน':
                return 'bg-amber-100 text-amber-900 border-amber-300';
            case 'หัวหน้าสาขาวิชา':
                return 'bg-purple-100 text-purple-900 border-purple-300';
            case 'เจ้าหน้าที่':
                return 'bg-blue-100 text-blue-900 border-blue-300';
            case 'ครูผู้สอน':
                return 'bg-emerald-100 text-emerald-900 border-emerald-300';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <section className={`space-y-10 ${className}`}>
            {/* ── ส่วนที่ 1: ภาระงานและหน้าที่ความรับผิดชอบ (Multi-Duty Profile) ── */}
            <div>
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-purple-100 pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span>💼</span> ภาระงาน สังกัดฝ่าย และหน้าที่ความรับผิดชอบ
                        </h2>
                        <p className="mt-1 text-xs text-slate-600">
                            กำหนดฝ่ายที่สังกัด หน้าที่ (หัวหน้างาน/หัวหน้าสาขาวิชา/เจ้าหน้าที่/ครูผู้สอน) และงานหรือสาขาวิชา (ผู้ใช้ 1 ท่านมีได้มากกว่า 1 ภาระงาน)
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:scale-105"
                    >
                        + เพิ่มภาระงานใหม่
                    </button>
                </header>

                {/* รายการภาระงานทั้งหมด */}
                <div className="mt-6 space-y-3">
                    {positionsList.map((item, index) => {
                        const divisionName = getDivisionName(item.department_id);
                        const isMajorDuty = item.duty === 'หัวหน้าสาขาวิชา' || item.duty === 'ครูผู้สอน';
                        const subName = isMajorDuty
                            ? item.major ? `สาขาวิชา${item.major}` : 'ยังไม่ระบุสาขาวิชา'
                            : item.sub_department_id ? getSubDeptName(item.sub_department_id) : 'ยังไม่ระบุงาน';

                        return (
                            <div
                                key={index}
                                className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                                    item.is_primary
                                        ? 'bg-purple-50/60 border-purple-300 shadow-sm ring-1 ring-purple-400/30'
                                        : 'bg-white border-slate-200 hover:border-purple-200 shadow-2xs'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getDutyBadgeColor(
                                                    item.duty
                                                )}`}
                                            >
                                                {item.duty}
                                            </span>
                                            {item.is_primary && (
                                                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-600 text-white shadow-2xs">
                                                    ⭐ ภาระงานหลัก
                                                </span>
                                            )}
                                            <span className="text-sm font-bold text-slate-900">
                                                {subName}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-600 flex items-center gap-2">
                                            <span>🏛️ <strong>ฝ่าย:</strong> {divisionName}</span>
                                            <span className="text-slate-300">|</span>
                                            <span>📂 <strong>งาน/สาขา:</strong> {subName}</span>
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                        {!item.is_primary && (
                                            <button
                                                type="button"
                                                onClick={() => handleSetPrimary(index)}
                                                className="px-3 py-1.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-xs font-bold text-purple-700 transition"
                                                title="ตั้งให้เป็นตำแหน่งหลัก"
                                            >
                                                ⭐ ตั้งเป็นงานหลัก
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEditModal(index)}
                                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
                                        >
                                            ✏️ แก้ไข
                                        </button>
                                        {positionsList.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeletePosition(index)}
                                                className="p-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-xs font-bold text-rose-600 transition"
                                                title="ลบภาระงานนี้"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ปุ่มบันทึกการเปลี่ยนแปลงภาระงานทั้งหมด */}
                <div className="mt-5 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSaveAllPositions}
                        disabled={isSavingPositions}
                        className="inline-flex items-center gap-2 rounded-xl bg-purple-700 hover:bg-purple-800 px-6 py-2.5 text-sm font-bold text-white shadow hover:shadow-md transition-all hover:scale-105 disabled:opacity-50"
                    >
                        <span>💾</span>
                        {isSavingPositions ? 'กำลังบันทึกภาระงาน...' : 'บันทึกการเปลี่ยนแปลงภาระงานทั้งหมด'}
                    </button>
                </div>
            </div>

            {/* ── Modal สำหรับเพิ่ม/แก้ไขภาระงาน (Cascading Dropdown) ── */}
            {isPositionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-purple-100 space-y-5 animate-in fade-in zoom-in duration-150">
                        <div className="flex justify-between items-center border-b border-purple-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <span>💼</span>
                                {editingIndex !== null ? 'แก้ไขภาระงาน / หน้าที่' : 'เพิ่มภาระงานและหน้าที่ใหม่'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsPositionModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveModalItem} className="space-y-4 text-xs font-bold text-slate-700">
                            {/* 1. เลือกฝ่ายที่สังกัด */}
                            <div>
                                <label className="block mb-1.5 text-purple-950 font-bold">
                                    1. ฝ่ายที่สังกัด (Division) *
                                </label>
                                <select
                                    required
                                    value={modalForm.department_id}
                                    onChange={(e) => {
                                        const newDeptId = Number(e.target.value);
                                        const works = getWorksForDivision(newDeptId);
                                        setModalForm({
                                            ...modalForm,
                                            department_id: newDeptId,
                                            sub_department_id: works[0]?.id || '',
                                        });
                                    }}
                                    className="w-full rounded-xl border-purple-200 px-3.5 py-2.5 text-sm focus:border-purple-500 focus:ring-purple-500 font-medium"
                                >
                                    {divisions.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 2. เลือกหน้าที่ */}
                            <div>
                                <label className="block mb-1.5 text-purple-950 font-bold">
                                    2. หน้าที่ความรับผิดชอบ (Duty / Role) *
                                </label>
                                <select
                                    required
                                    value={modalForm.duty}
                                    onChange={(e) => {
                                        const newDuty = e.target.value;
                                        setModalForm({
                                            ...modalForm,
                                            duty: newDuty,
                                        });
                                    }}
                                    className="w-full rounded-xl border-purple-200 px-3.5 py-2.5 text-sm focus:border-purple-500 focus:ring-purple-500 font-medium"
                                >
                                    {(availableDuties.length > 0 ? availableDuties : ['หัวหน้างาน', 'หัวหน้าสาขาวิชา', 'เจ้าหน้าที่', 'ครูผู้สอน']).map((duty) => (
                                        <option key={duty} value={duty}>
                                            {duty}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. งาน หรือ สาขาวิชา (แสดงตามหน้าที่ที่เลือก) */}
                            {modalForm.duty === 'หัวหน้าสาขาวิชา' || modalForm.duty === 'ครูผู้สอน' ? (
                                <div>
                                    <label className="block mb-1.5 text-purple-950 font-bold flex items-center justify-between">
                                        <span>3. สาขาวิชา (Major) *</span>
                                        <span className="text-[11px] font-normal text-purple-600">
                                            (สำหรับ {modalForm.duty})
                                        </span>
                                    </label>
                                    <select
                                        required
                                        value={modalForm.major}
                                        onChange={(e) => setModalForm({ ...modalForm, major: e.target.value })}
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2.5 text-sm focus:border-purple-500 focus:ring-purple-500 font-medium"
                                    >
                                        {(availableMajors.length > 0
                                            ? availableMajors
                                            : [
                                                  'ช่างยนต์',
                                                  'สารสนเทศ',
                                                  'เทคนิคพื้นฐาน',
                                                  'อิเล็กทรอนิกส์',
                                                  'ไฟฟ้า',
                                                  'บัญชี',
                                                  'การตลาด',
                                                  'สามัญสัมพันธ์',
                                                  'ระยะสั้น',
                                              ]
                                        ).map((major) => (
                                            <option key={major} value={major}>
                                                สาขาวิชา{major}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block mb-1.5 text-purple-950 font-bold flex items-center justify-between">
                                        <span>3. งานตามฝ่ายที่เลือก (Work Section) *</span>
                                        <span className="text-[11px] font-normal text-amber-700">
                                            (สำหรับ {modalForm.duty})
                                        </span>
                                    </label>
                                    <select
                                        required
                                        value={modalForm.sub_department_id}
                                        onChange={(e) =>
                                            setModalForm({
                                                ...modalForm,
                                                sub_department_id: e.target.value ? Number(e.target.value) : '',
                                            })
                                        }
                                        className="w-full rounded-xl border-purple-200 px-3.5 py-2.5 text-sm focus:border-purple-500 focus:ring-purple-500 font-medium"
                                    >
                                        <option value="">-- เลือกกลุ่มงานในสังกัดฝ่ายนี้ --</option>
                                        {getWorksForDivision(modalForm.department_id).map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                    {getWorksForDivision(modalForm.department_id).length === 0 && (
                                        <p className="text-[11px] text-slate-500 mt-1">
                                            * ไม่พบงานย่อยในฝ่ายนี้ (ผู้ดูแลระบบสามารถเพิ่มงานย่อยได้ในหน้าแดชบอร์ด)
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* ตั้งเป็นภาระงานหลัก */}
                            <div className="flex items-center gap-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_primary_chk"
                                    checked={modalForm.is_primary}
                                    onChange={(e) => setModalForm({ ...modalForm, is_primary: e.target.checked })}
                                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                                />
                                <label htmlFor="is_primary_chk" className="text-xs text-slate-700 font-bold cursor-pointer">
                                    ⭐ กำหนดให้เป็นภาระงานหลักของท่าน (Primary Duty)
                                </label>
                            </div>

                            {/* Submit & Cancel Buttons */}
                            <div className="flex justify-end gap-x-3 pt-4 border-t border-purple-100">
                                <button
                                    type="button"
                                    onClick={() => setIsPositionModalOpen(false)}
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-700"
                                >
                                    บันทึกภาระงานนี้
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── ส่วนที่ 2: ข้อมูลส่วนตัวทั่วไป (ชื่อ-นามสกุล และ อีเมล) ── */}
            <div className="border-t border-slate-200 pt-8">
                <header>
                    <h2 className="text-lg font-bold text-slate-900">
                        👤 ข้อมูลผู้ใช้งานทั่วไป
                    </h2>
                    <p className="mt-1 text-xs text-slate-600">
                        อัปเดตชื่อ-นามสกุล และที่อยู่อีเมลสำหรับการเข้าสู่ระบบ
                    </p>
                </header>

                <form onSubmit={submit} className="mt-6 space-y-6 max-w-xl">
                    <div>
                        <InputLabel htmlFor="name" value="ชื่อ-นามสกุล *" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full text-sm font-semibold"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            isFocused
                            autoComplete="name"
                        />
                        <InputError className="mt-2" message={errors.name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value="อีเมล (Email) *" />
                        <TextInput
                            id="email"
                            type="email"
                            className="mt-1 block w-full text-sm"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                        />
                        <InputError className="mt-2" message={errors.email} />
                    </div>

                    {mustVerifyEmail && user.email_verified_at === null && (
                        <div>
                            <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                                อีเมลยังไม่ได้รับการยืนยัน
                                <Link
                                    href={route('verification.send')}
                                    method="post"
                                    as="button"
                                    className="ml-2 rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                                >
                                    คลิกเพื่อส่งลิงก์ยืนยันอีกครั้ง
                                </Link>
                            </p>
                            {status === 'verification-link-sent' && (
                                <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                                    ส่งลิงก์ยืนยันใหม่แล้ว
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <PrimaryButton disabled={processing}>บันทึกข้อมูลทั่วไป</PrimaryButton>
                        <Transition
                            show={recentlySuccessful}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <p className="text-sm text-gray-600 dark:text-gray-400">บันทึกแล้ว</p>
                        </Transition>
                    </div>
                </form>
            </div>
        </section>
    );
}
