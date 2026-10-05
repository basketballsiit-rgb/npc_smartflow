import React, { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import axios from 'axios';

export default function AppendixManager({
    projects = [],
    activeProject = null,
    onSelectProject = () => {},
    onProjectUpdated = () => {},
}) {
    const [uploadingCategory, setUploadingCategory] = useState(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [editingCaptionId, setEditingCaptionId] = useState(null);
    const [editingCaptionText, setEditingCaptionText] = useState('');
    const [isSavingCaption, setIsSavingCaption] = useState(false);
    const [activeCoverPreview, setActiveCoverPreview] = useState(null); // { type: 'front' | 'back', url: string, title: string }
    const [otherFileForm, setOtherFileForm] = useState({ title: '', caption: '' });
    const [showOtherModal, setShowOtherModal] = useState(false);
    const [copiedSurveyLink, setCopiedSurveyLink] = useState(false);

    const fileInputRefs = useRef({});

    if (!activeProject) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                <span className="text-4xl block mb-3">📁</span>
                <h3 className="text-lg font-bold text-slate-800">ไม่พบข้อมูลโครงการ</h3>
                <p className="text-sm text-slate-500 mt-1">กรุณาเลือกโครงการจากรายการเพื่อจัดการเอกสารภาคผนวก</p>
            </div>
        );
    }

    const appendices = activeProject.appendices || [];
    const photos = activeProject.photos || [];
    const survey = activeProject.survey;
    const procurement = activeProject.procurement;
    const approvals = activeProject.approvals || [];

    // Helper to get appendices by category
    const getByCategory = (cat) => appendices.filter(a => a.category === cat);
    const singleFileMap = {
        approved_proposal: getByCategory('approved_proposal')[0],
        memo_request: getByCategory('memo_request')[0],
        procurement_loan: getByCategory('procurement_loan')[0],
        evaluation_survey: getByCategory('evaluation_survey')[0],
        official_order: getByCategory('official_order')[0],
        schedule: getByCategory('schedule')[0],
        speech: getByCategory('speech')[0],
        certificate_sample: getByCategory('certificate_sample')[0],
        front_cover: getByCategory('front_cover')[0],
        back_cover: getByCategory('back_cover')[0],
    };
    const otherDocs = getByCategory('others');

    // Survey URL & QR Code
    const evaluationUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/surveys/${activeProject.id}/evaluate`
        : `/surveys/${activeProject.id}/evaluate`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(evaluationUrl)}`;

    const copySurveyLink = () => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(evaluationUrl);
            setCopiedSurveyLink(true);
            setTimeout(() => setCopiedSurveyLink(false), 2500);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'คัดลอกลิงก์แบบประเมินเรียบร้อยแล้ว',
                showConfirmButton: false,
                timer: 2000
            });
        }
    };

    // Handle File Upload for Categories (Max 10MB)
    const handleFileUpload = async (category, title, file, caption = null) => {
        if (!file) return;

        // Size check: 10MB = 10 * 1024 * 1024 bytes
        if (file.size > 10 * 1024 * 1024) {
            Swal.fire({
                icon: 'error',
                title: 'ขนาดไฟล์เกินกำหนด',
                text: 'ขนาดไฟล์ต้องไม่เกิน 10 MB (ไฟล์ที่เลือกขนาด ' + (file.size / (1024 * 1024)).toFixed(2) + ' MB)',
                confirmButtonText: 'ตกลง'
            });
            return;
        }

        const formData = new FormData();
        formData.append('category', category);
        formData.append('title', title);
        formData.append('file', file);
        if (caption) formData.append('caption', caption);

        setUploadingCategory(category);

        try {
            const response = await axios.post(route('appendices.store', activeProject.id), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                }
            });

            if (response.data.success) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: response.data.message || 'อัพโหลดไฟล์สำเร็จ',
                    showConfirmButton: false,
                    timer: 2000
                });
                router.reload({ preserveScroll: true });
            }
        } catch (error) {
            console.error('Upload error:', error);
            const msg = error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพโหลด กรุณาตรวจสอบขนาดไฟล์ไม่เกิน 10MB';
            Swal.fire({
                icon: 'error',
                title: 'อัพโหลดไม่สำเร็จ',
                text: msg,
                confirmButtonText: 'ตกลง'
            });
        } finally {
            setUploadingCategory(null);
            if (fileInputRefs.current[category]) {
                fileInputRefs.current[category].value = '';
            }
        }
    };

    // Handle Delete Appendix
    const handleDeleteAppendix = (appendixId, title) => {
        Swal.fire({
            title: `ยืนยันการลบไฟล์?`,
            text: `ต้องการลบ "${title}" หรือไม่? ข้อมูลจะไม่สามารถกู้คืนได้`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ลบไฟล์',
            cancelButtonText: 'ยกเลิก'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await axios.delete(route('appendices.destroy', appendixId), {
                        headers: { 'Accept': 'application/json' }
                    });
                    if (response.data.success) {
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: 'ลบไฟล์เรียบร้อยแล้ว',
                            showConfirmButton: false,
                            timer: 2000
                        });
                        router.reload({ preserveScroll: true });
                    }
                } catch (err) {
                    Swal.fire({
                        icon: 'error',
                        title: 'ลบไม่สำเร็จ',
                        text: err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบไฟล์',
                    });
                }
            }
        });
    };

    // Handle Upload Photos (supports multiple or single, max 10MB each)
    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Check file sizes
        for (const f of files) {
            if (f.size > 10 * 1024 * 1024) {
                Swal.fire({
                    icon: 'error',
                    title: 'ขนาดภาพเกินกำหนด',
                    text: `ภาพ "${f.name}" มีขนาดเกิน 10 MB กรุณาเลือกภาพที่ขนาดเล็กลง`,
                });
                return;
            }
        }

        setIsUploadingPhoto(true);

        try {
            let successCount = 0;
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                const formData = new FormData();
                formData.append('photo', f);
                formData.append('caption', `ภาพกิจกรรมโครงการ ${activeProject.title || ''} (${photos.length + i + 1})`);
                formData.append('sort_order', photos.length + i + 1);

                await axios.post(route('appendices.store_photo', activeProject.id), formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Accept': 'application/json'
                    }
                });
                successCount++;
            }

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `อัพโหลดภาพกิจกรรมสำเร็จ ${successCount} ภาพ`,
                showConfirmButton: false,
                timer: 2500
            });
            router.reload({ preserveScroll: true });
        } catch (error) {
            console.error('Photo upload error:', error);
            Swal.fire({
                icon: 'error',
                title: 'อัพโหลดภาพไม่สำเร็จ',
                text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพโหลดภาพกิจกรรม',
            });
        } finally {
            setIsUploadingPhoto(false);
            if (fileInputRefs.current['activity_photos']) {
                fileInputRefs.current['activity_photos'].value = '';
            }
        }
    };

    // Update Photo Caption
    const handleSavePhotoCaption = async (photoId) => {
        setIsSavingCaption(true);
        try {
            await axios.post(route('appendices.update_photo_caption', photoId), {
                caption: editingCaptionText
            }, {
                headers: { 'Accept': 'application/json' }
            });

            setEditingCaptionId(null);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'บันทึกคำบรรยายภาพสำเร็จ',
                showConfirmButton: false,
                timer: 1500
            });
            router.reload({ preserveScroll: true });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'บันทึกไม่สำเร็จ',
                text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกคำบรรยายภาพ',
            });
        } finally {
            setIsSavingCaption(false);
        }
    };

    // Delete Photo
    const handleDeletePhoto = (photoId) => {
        Swal.fire({
            title: 'ยืนยันการลบภาพกิจกรรม?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ลบภาพ',
            cancelButtonText: 'ยกเลิก'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(route('appendices.destroy_photo', photoId), {
                        headers: { 'Accept': 'application/json' }
                    });
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'ลบภาพกิจกรรมเรียบร้อยแล้ว',
                        showConfirmButton: false,
                        timer: 1500
                    });
                    router.reload({ preserveScroll: true });
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'ลบไม่สำเร็จ',
                        text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบภาพ',
                    });
                }
            }
        });
    };

    // Submit Other Document Form
    const handleAddOtherDocument = async (e) => {
        e.preventDefault();
        const file = fileInputRefs.current['other_file']?.files[0];
        if (!file) {
            Swal.fire({ icon: 'warning', title: 'กรุณาเลือกไฟล์แนบ' });
            return;
        }
        if (!otherFileForm.title.trim()) {
            Swal.fire({ icon: 'warning', title: 'กรุณากรอกชื่อเอกสาร' });
            return;
        }

        await handleFileUpload('others', otherFileForm.title, file, otherFileForm.caption);
        setShowOtherModal(false);
        setOtherFileForm({ title: '', caption: '' });
    };

    // Calculate Summary Completeness
    const completedRequired = [
        singleFileMap.approved_proposal || approvals.length > 0,
        singleFileMap.memo_request,
        singleFileMap.procurement_loan || procurement,
        true, // Survey QR Code always ready
        singleFileMap.official_order,
        singleFileMap.schedule,
        singleFileMap.speech,
        singleFileMap.certificate_sample,
        photos.length >= 6,
    ].filter(Boolean).length;

    return (
        <div className="space-y-6">
            {/* Top Banner / Workspace Header */}
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-200 text-xs font-bold mb-2">
                            <span>📎</span> ส่วนประกอบเล่มรายงาน • ภาคผนวก (Appendix & Attachments)
                        </div>
                        <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                            <span>ภาคผนวก: รวบรวมเอกสารแนบ ภาพกิจกรรม และหลักฐานประกอบเล่ม</span>
                        </h2>
                        <p className="text-teal-200 text-xs md:text-sm mt-1 max-w-3xl leading-relaxed">
                            จัดการเอกสารแนบ 12 รายการตามมาตรฐานอาชีวศึกษา เรียงต่อกันเพื่อจัดพิมพ์เล่มรายงานโครงการ 
                            พร้อมระบบอัพโหลดไฟล์ (ไม่เกิน 10 MB ต่อไฟล์) และแยกเก็บปกหน้า-ปกหลังสำหรับการรวมเล่ม
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Project Selector */}
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 min-w-[280px]">
                            <label className="text-[11px] font-bold text-teal-200 block mb-1">เลือกโครงการ:</label>
                            <select
                                value={activeProject.id}
                                onChange={(e) => onSelectProject(e.target.value)}
                                className="w-full bg-white text-slate-900 text-xs font-bold rounded-xl px-3 py-2 border-0 focus:ring-2 focus:ring-teal-400"
                            >
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.code ? `[${p.code}] ` : ''}{p.title || p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Print Appendix Button */}
                        <a
                            href={route('projects.appendix.print', activeProject.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg transition transform active:scale-95"
                            title="เปิดหน้าต่างพิมพ์ภาคผนวกขนาด A4"
                        >
                            <span>🖨️</span>
                            <span>พิมพ์ภาคผนวก (A4)</span>
                        </a>

                        {/* Go to Full Book Compilation */}
                        <a
                            href={route('dashboard', { tab: 'full_report' })}
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg transition transform active:scale-95"
                            title="ไปยังหน้ารวมรูปเล่มรายงานฉบับสมบูรณ์ (Full Book)"
                        >
                            <span>📚</span>
                            <span>รวมเล่มสมบูรณ์</span>
                        </a>
                    </div>
                </div>

                {/* Progress Indicators Bar */}
                <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                        <span className="text-white/60 block text-[11px]">สถานะเอกสารจำเป็น</span>
                        <span className="font-bold text-sm text-emerald-300">
                            {completedRequired} / 9 หมวดหลัก
                        </span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                        <span className="text-white/60 block text-[11px]">ภาพกิจกรรมโครงการ</span>
                        <span className={`font-bold text-sm ${photos.length >= 6 ? 'text-emerald-300' : 'text-amber-300'}`}>
                            {photos.length} / 6 ภาพ {photos.length >= 6 ? '✓ ครบเกณฑ์' : '(ขาดอีก ' + (6 - photos.length) + ')'}
                        </span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                        <span className="text-white/60 block text-[11px]">เอกสารอื่น ๆ เพิ่มเติม</span>
                        <span className="font-bold text-sm text-sky-300">
                            {otherDocs.length} ไฟล์
                        </span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                        <span className="text-white/60 block text-[11px]">ปกหน้า & ปกหลัง</span>
                        <span className="font-bold text-sm text-purple-300">
                            {singleFileMap.front_cover ? '✓ ปกหน้า ' : '✕ ปกหน้า '} • {singleFileMap.back_cover ? '✓ ปกหลัง' : '✕ ปกหลัง'}
                        </span>
                    </div>
                </div>
            </div>

            {/* SECTIONS 1 - 8: Official Documentation Sequence (เรียงต่อกันตามข้อ 1 - 8) */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold mb-1">
                            <span>📄 เอกสารหลักฐานประกอบเล่ม (ลำดับที่ 1 - 8)</span>
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-slate-900">
                            เอกสารการอนุมัติ คำสั่ง และแบบประเมินโครงการ
                        </h3>
                        <p className="text-xs text-slate-500">
                            อัพโหลดหรือเชื่อมโยงข้อมูลจากระบบ เพื่อจัดเรียงพิมพ์เป็นเอกสารภาคผนวกตามลำดับ
                        </p>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        ขนาดไฟล์ไม่เกิน 10 MB ต่อไฟล์ (PDF, JPG, PNG)
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 1. เอกสารโครงการแบบอนุมัติที่มีลายเซ็นต์แล้ว */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-xs font-black flex items-center justify-center">1</span>
                                    <h4 className="font-bold text-slate-900 text-sm">
                                        เอกสารโครงการแบบอนุมัติที่มีลายเซ็นต์แล้ว
                                    </h4>
                                </div>
                                {(singleFileMap.approved_proposal || approvals.length > 0) && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        ✓ มีเอกสารแล้ว
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                นำมาจากระบบหน้าโครงการฉบับเต็ม หรืออัพโหลดไฟล์ PDF สแกนที่มีลายเซ็นจริง
                            </p>

                            {/* System Status info */}
                            <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">ข้อมูลจากระบบ:</span>
                                    <a
                                        href={route('projects.print', activeProject.id)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-teal-700 font-bold hover:underline flex items-center gap-1"
                                    >
                                        <span>📑 ดูโครงการฉบับเต็มพร้อมลายเซ็น</span>
                                        <span>↗</span>
                                    </a>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                    <span>สถานะการอนุมัติ:</span>
                                    <span className="font-bold text-slate-700">
                                        {activeProject.status_label || activeProject.status || 'รออนุมัติ'} ({approvals.length} ลายมือชื่อ)
                                    </span>
                                </div>
                            </div>

                            {/* Uploaded File View */}
                            {singleFileMap.approved_proposal && (
                                <div className="mt-2.5 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                        <span>📎</span>
                                        <a
                                            href={singleFileMap.approved_proposal.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-emerald-900 hover:underline truncate"
                                        >
                                            {singleFileMap.approved_proposal.title}
                                        </a>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteAppendix(singleFileMap.approved_proposal.id, singleFileMap.approved_proposal.title)}
                                        className="text-rose-600 hover:text-rose-800 p-1 font-bold text-xs"
                                        title="ลบไฟล์"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Upload Button */}
                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">อัพโหลดไฟล์แทนที่ (สูงสุด 10MB)</span>
                            <div>
                                <input
                                    type="file"
                                    ref={(el) => (fileInputRefs.current['approved_proposal'] = el)}
                                    onChange={(e) => handleFileUpload('approved_proposal', 'เอกสารโครงการฉบับอนุมัติ (ลายเซ็นต์)', e.target.files[0])}
                                    accept=".pdf,image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    disabled={uploadingCategory === 'approved_proposal'}
                                    onClick={() => fileInputRefs.current['approved_proposal']?.click()}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <span>📤</span>
                                    <span>{uploadingCategory === 'approved_proposal' ? 'กำลังอัพโหลด...' : 'อัพโหลด PDF/ภาพ'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 2. บันทึกข้อความขอดำเนินโครงการ */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-xs font-black flex items-center justify-center">2</span>
                                    <h4 className="font-bold text-slate-900 text-sm">
                                        บันทึกข้อความขอดำเนินโครงการ
                                    </h4>
                                </div>
                                {singleFileMap.memo_request && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        ✓ มีเอกสารแล้ว
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                บันทึกข้อความเสนอขออนุมัติดำเนินโครงการต่อผู้อำนวยการวิทยาลัย
                            </p>

                            {singleFileMap.memo_request ? (
                                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                        <span>📑</span>
                                        <a
                                            href={singleFileMap.memo_request.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-emerald-900 hover:underline truncate"
                                        >
                                            {singleFileMap.memo_request.title}
                                        </a>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteAppendix(singleFileMap.memo_request.id, singleFileMap.memo_request.title)}
                                        className="text-rose-600 hover:text-rose-800 p-1 font-bold text-xs"
                                        title="ลบไฟล์"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-3 p-3 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                                    ยังไม่ได้อัพโหลดบันทึกข้อความ
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">รองรับ PDF, JPG, PNG (สูงสุด 10MB)</span>
                            <div>
                                <input
                                    type="file"
                                    ref={(el) => (fileInputRefs.current['memo_request'] = el)}
                                    onChange={(e) => handleFileUpload('memo_request', 'บันทึกข้อความขอดำเนินโครงการ', e.target.files[0])}
                                    accept=".pdf,image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    disabled={uploadingCategory === 'memo_request'}
                                    onClick={() => fileInputRefs.current['memo_request']?.click()}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <span>📤</span>
                                    <span>{uploadingCategory === 'memo_request' ? 'กำลังอัพโหลด...' : 'อัพโหลดไฟล์'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 3. เอกสารชุดจัดซื้อจัดจ้าง / สัญญายืมเงิน */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-xs font-black flex items-center justify-center">3</span>
                                    <h4 className="font-bold text-slate-900 text-sm">
                                        เอกสารชุดจัดซื้อจัดจ้าง / สัญญายืมเงิน
                                    </h4>
                                </div>
                                {(singleFileMap.procurement_loan || procurement) && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        ✓ พร้อมใช้งาน
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                ดึงข้อมูลชุดขอซื้อขอจ้างและสัญญายืมเงินจากระบบ หรืออัพโหลดเอกสารประกอบเพิ่มเติม
                            </p>

                            {/* System Procurement Summary */}
                            <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">ข้อมูลการจัดซื้อในระบบ:</span>
                                    <span className="font-bold text-slate-800">
                                        {procurement ? (procurement.status || 'ดำเนินการแล้ว') : 'ยังไม่มีข้อมูลการจัดซื้อ'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                    <span>งบประมาณที่ได้รับจัดสรร:</span>
                                    <span className="font-bold text-teal-700">
                                        {Number(activeProject.budget_amount || 0).toLocaleString()} บาท
                                    </span>
                                </div>
                            </div>

                            {singleFileMap.procurement_loan && (
                                <div className="mt-2.5 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                        <span>💼</span>
                                        <a
                                            href={singleFileMap.procurement_loan.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-emerald-900 hover:underline truncate"
                                        >
                                            {singleFileMap.procurement_loan.title}
                                        </a>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteAppendix(singleFileMap.procurement_loan.id, singleFileMap.procurement_loan.title)}
                                        className="text-rose-600 hover:text-rose-800 p-1 font-bold text-xs"
                                        title="ลบไฟล์"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">แนบเอกสารเพิ่มเติม (สูงสุด 10MB)</span>
                            <div>
                                <input
                                    type="file"
                                    ref={(el) => (fileInputRefs.current['procurement_loan'] = el)}
                                    onChange={(e) => handleFileUpload('procurement_loan', 'เอกสารจัดซื้อจัดจ้าง/สัญญายืมเงิน', e.target.files[0])}
                                    accept=".pdf,image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    disabled={uploadingCategory === 'procurement_loan'}
                                    onClick={() => fileInputRefs.current['procurement_loan']?.click()}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <span>📤</span>
                                    <span>{uploadingCategory === 'procurement_loan' ? 'กำลังอัพโหลด...' : 'อัพโหลดไฟล์'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 4. แบบประเมินของโครงการ (QR Code + Link) */}
                    <div className="p-5 rounded-2xl border border-teal-200 bg-teal-50/40 hover:bg-teal-50/70 transition flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-xs font-black flex items-center justify-center">4</span>
                                    <h4 className="font-bold text-teal-950 text-sm">
                                        แบบประเมินของโครงการ (QR CODE & Link)
                                    </h4>
                                </div>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-200 text-teal-900">
                                    ระบบอัตโนมัติ
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-2">
                                ภาพ QR Code พร้อมแสดงลิงก์ด้านล่างเพื่อผู้เข้าร่วมประเมินความพึงพอใจ
                            </p>

                            {/* QR Code Container & Link Preview */}
                            <div className="mt-3 p-3 bg-white rounded-xl border border-teal-200 flex flex-col sm:flex-row items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                                    <img
                                        src={qrCodeUrl}
                                        alt="QR Code แบบประเมิน"
                                        className="w-20 h-20 object-contain"
                                    />
                                </div>
                                <div className="space-y-1.5 w-full min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-700">ลิงก์แบบประเมิน:</span>
                                        <button
                                            type="button"
                                            onClick={copySurveyLink}
                                            className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                                        >
                                            <span>{copiedSurveyLink ? '✓ คัดลอกแล้ว' : '📋 คัดลอกลิงก์'}</span>
                                        </button>
                                    </div>
                                    <p className="text-[11px] font-mono text-teal-800 bg-teal-50/70 p-1.5 rounded border border-teal-100 truncate">
                                        {evaluationUrl}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={evaluationUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                                        >
                                            <span>เปิดหน้าแบบประเมิน</span>
                                            <span>↗</span>
                                        </a>
                                        <span className="text-slate-300">•</span>
                                        <a
                                            href={qrCodeUrl}
                                            download={`qrcode-survey-${activeProject.id}.png`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] font-bold text-slate-600 hover:underline"
                                        >
                                            ดาวน์โหลด QR Code
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {singleFileMap.evaluation_survey && (
                                <div className="mt-2.5 p-2 bg-white rounded-xl border border-teal-200 flex items-center justify-between text-xs">
                                    <span className="truncate text-teal-900 font-bold">📄 {singleFileMap.evaluation_survey.title}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteAppendix(singleFileMap.evaluation_survey.id, singleFileMap.evaluation_survey.title)}
                                        className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-teal-200/70 flex items-center justify-between">
                            <span className="text-[11px] text-teal-800 font-medium">แนบแบบสอบถามฉบับกระดาษ (สูงสุด 10MB)</span>
                            <div>
                                <input
                                    type="file"
                                    ref={(el) => (fileInputRefs.current['evaluation_survey'] = el)}
                                    onChange={(e) => handleFileUpload('evaluation_survey', 'แบบสอบถามประเมินความพึงพอใจ', e.target.files[0])}
                                    accept=".pdf,image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    disabled={uploadingCategory === 'evaluation_survey'}
                                    onClick={() => fileInputRefs.current['evaluation_survey']?.click()}
                                    className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <span>📤</span>
                                    <span>{uploadingCategory === 'evaluation_survey' ? 'กำลังอัพโหลด...' : 'อัพโหลดแบบฟอร์ม'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 5. คำสั่งดำเนินงานโครงการ */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-xs font-black flex items-center justify-center">5</span>
                                    <h4 className="font-bold text-slate-900 text-sm">
                                        คำสั่งดำเนินงานโครงการ
                                    </h4>
                                </div>
                                {singleFileMap.official_order && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        ✓ มีเอกสารแล้ว
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                คำสั่งแต่งตั้งคณะกรรมการดำเนินงานโครงการจากสถานศึกษา
                            </p>

                            {singleFileMap.official_order ? (
                                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                        <span>📜</span>
                                        <a
                                            href={singleFileMap.official_order.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-emerald-900 hover:underline truncate"
                                        >
                                            {singleFileMap.official_order.title}
                                        </a>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteAppendix(singleFileMap.official_order.id, singleFileMap.official_order.title)}
                                        className="text-rose-600 hover:text-rose-800 p-1 font-bold text-xs"
                                        title="ลบไฟล์"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-3 p-3 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                                    ยังไม่ได้อัพโหลดคำสั่งดำเนินโครงการ
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">รองรับ PDF, JPG, PNG (สูงสุด 10MB)</span>
                            <div>
                                <input
                                    type="file"
                                    ref={(el) => (fileInputRefs.current['official_order'] = el)}
                                    onChange={(e) => handleFileUpload('official_order', 'คำสั่งดำเนินงานโครงการ', e.target.files[0])}
                                    accept=".pdf,image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    disabled={uploadingCategory === 'official_order'}
                                    onClick={() => fileInputRefs.current['official_order']?.click()}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <span>📤</span>
                                    <span>{uploadingCategory === 'official_order' ? 'กำลังอัพโหลด...' : 'อัพโหลดไฟล์'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 6. กำหนดการดำเนินงานโครงการ */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-xs font-black flex items-center justify-center">6</span>
                                    <h4 className="font-bold text-slate-900 text-sm">
                                        กำหนดการดำเนินงานโครงการ
                                    </h4>
                                </div>
                                {singleFileMap.schedule && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        ✓ มีเอกสารแล้ว
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                กำหนดการจัดกิจกรรม รายละเอียดเวลา และวิทยากร
                            </p>

                            {singleFileMap.schedule ? (
                                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                        <span>📅</span>
                                        <a
                                            href={singleFileMap.schedule.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-emerald-900 hover:underline truncate"
                                        >
                                            {singleFileMap.schedule.title}
                                        </a>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteAppendix(singleFileMap.schedule.id, singleFileMap.schedule.title)}
                                        className="text-rose-600 hover:text-rose-800 p-1 font-bold text-xs"
                                        title="ลบไฟล์"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-3 p-3 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                                    ยังไม่ได้อัพโหลดกำหนดการ
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">รองรับ PDF, JPG, PNG (สูงสุด 10MB)</span>
                            <div>
                                <input
                                    type="file"
                                    ref={(el) => (fileInputRefs.current['schedule'] = el)}
                                    onChange={(e) => handleFileUpload('schedule', 'กำหนดการดำเนินงานโครงการ', e.target.files[0])}
                                    accept=".pdf,image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    disabled={uploadingCategory === 'schedule'}
                                    onClick={() => fileInputRefs.current['schedule']?.click()}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <span>📤</span>
                                    <span>{uploadingCategory === 'schedule' ? 'กำลังอัพโหลด...' : 'อัพโหลดไฟล์'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 7. คำกล่าวพิธีเปิด/พิธีปิด */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-xs font-black flex items-center justify-center">7</span>
                                    <h4 className="font-bold text-slate-900 text-sm">
                                        คำกล่าวพิธีเปิด / พิธีปิด
                                    </h4>
                                </div>
                                {singleFileMap.speech && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        ✓ มีเอกสารแล้ว
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                คำกล่าวรายงานของผู้จัด และคำกล่าวเปิดหรือปิดงานของประธาน
                            </p>

                            {singleFileMap.speech ? (
                                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                        <span>🎤</span>
                                        <a
                                            href={singleFileMap.speech.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-emerald-900 hover:underline truncate"
                                        >
                                            {singleFileMap.speech.title}
                                        </a>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteAppendix(singleFileMap.speech.id, singleFileMap.speech.title)}
                                        className="text-rose-600 hover:text-rose-800 p-1 font-bold text-xs"
                                        title="ลบไฟล์"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-3 p-3 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                                    ยังไม่ได้อัพโหลดบทคำกล่าว
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">รองรับ PDF, JPG, PNG (สูงสุด 10MB)</span>
                            <div>
                                <input
                                    type="file"
                                    ref={(el) => (fileInputRefs.current['speech'] = el)}
                                    onChange={(e) => handleFileUpload('speech', 'คำกล่าวพิธีเปิดและปิดโครงการ', e.target.files[0])}
                                    accept=".pdf,image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    disabled={uploadingCategory === 'speech'}
                                    onClick={() => fileInputRefs.current['speech']?.click()}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <span>📤</span>
                                    <span>{uploadingCategory === 'speech' ? 'กำลังอัพโหลด...' : 'อัพโหลดไฟล์'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 8. ภาพตัวอย่างเกียรติบัตร */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-xs font-black flex items-center justify-center">8</span>
                                    <h4 className="font-bold text-slate-900 text-sm">
                                        ภาพตัวอย่างเกียรติบัตร
                                    </h4>
                                </div>
                                {singleFileMap.certificate_sample && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        ✓ มีเอกสารแล้ว
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                ภาพตัวอย่างเกียรติบัตรมอบให้ผู้เข้าร่วมโครงการหรือวิทยากร
                            </p>

                            {singleFileMap.certificate_sample ? (
                                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                        <span>🎖️</span>
                                        <a
                                            href={singleFileMap.certificate_sample.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-emerald-900 hover:underline truncate"
                                        >
                                            {singleFileMap.certificate_sample.title}
                                        </a>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteAppendix(singleFileMap.certificate_sample.id, singleFileMap.certificate_sample.title)}
                                        className="text-rose-600 hover:text-rose-800 p-1 font-bold text-xs"
                                        title="ลบไฟล์"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-3 p-3 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                                    ยังไม่ได้อัพโหลดตัวอย่างเกียรติบัตร
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">รองรับ PDF, JPG, PNG (สูงสุด 10MB)</span>
                            <div>
                                <input
                                    type="file"
                                    ref={(el) => (fileInputRefs.current['certificate_sample'] = el)}
                                    onChange={(e) => handleFileUpload('certificate_sample', 'ตัวอย่างเกียรติบัตรโครงการ', e.target.files[0])}
                                    accept=".pdf,image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    disabled={uploadingCategory === 'certificate_sample'}
                                    onClick={() => fileInputRefs.current['certificate_sample']?.click()}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <span>📤</span>
                                    <span>{uploadingCategory === 'certificate_sample' ? 'กำลังอัพโหลด...' : 'อัพโหลดไฟล์'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 9: ภาพกิจกรรม อย่างน้อย 6 ภาพ จัดหน้าละ 2 ภาพ */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-xs font-black flex items-center justify-center">9</span>
                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                ภาพกิจกรรมโครงการ (อย่างน้อย 6 ภาพ • จัดวางหน้าละ 2 ภาพ)
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500">
                            จัดแสดงภาพขนาดใหญ่คมชัด หน้าละ 2 ภาพพร้อมคำบรรยายภาพใต้รูป เพื่อพิมพ์รายงานมาตรฐาน
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${photos.length >= 6 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                            {photos.length >= 6 ? `✓ ครบตามเกณฑ์ (${photos.length} ภาพ)` : `⚠️ ขาดอีก ${6 - photos.length} ภาพ (ปัจจุบันมี ${photos.length}/6)`}
                        </span>

                        <input
                            type="file"
                            multiple
                            ref={(el) => (fileInputRefs.current['activity_photos'] = el)}
                            onChange={handlePhotoUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            type="button"
                            disabled={isUploadingPhoto}
                            onClick={() => fileInputRefs.current['activity_photos']?.click()}
                            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <span>📷</span>
                            <span>{isUploadingPhoto ? 'กำลังอัพโหลดภาพ...' : '+ อัพโหลดภาพกิจกรรม'}</span>
                        </button>
                    </div>
                </div>

                {/* Photo Grid Preview by 2-per-page logic */}
                {photos.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="text-4xl block mb-2">📸</span>
                        <h4 className="font-bold text-slate-700 text-sm">ยังไม่มีภาพกิจกรรมในโครงการนี้</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                            คลิกที่ปุ่ม "+ อัพโหลดภาพกิจกรรม" ด้านบนเพื่อเพิ่มรูปภาพอย่างน้อย 6 ภาพ (ระบบรองรับการเลือกหลายรูปพร้อมกัน ไฟล์ละไม่เกิน 10MB)
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Information banner */}
                        <div className="p-3 bg-teal-50/70 rounded-2xl border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <span>💡</span>
                                <span>ภาพจะถูกจัดเรียงในเอกสารพิมพ์ <strong>หน้าละ 2 ภาพ</strong> รวมทั้งหมด <strong>{Math.ceil(photos.length / 2)} หน้า</strong> พิมพ์คมชัดพร้อมคำบรรยาย</span>
                            </span>
                            <span className="text-[11px] text-teal-700 font-mono">ทั้งหมด {photos.length} ภาพ</span>
                        </div>

                        {/* List / Pairs of photos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {photos.map((photo, idx) => (
                                <div key={photo.id || idx} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
                                    <div className="relative h-48 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
                                        <img
                                            src={photo.photo_url || `/storage/${photo.photo_path}`}
                                            alt={photo.caption || `ภาพที่ ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                                            ภาพที่ {idx + 1} (หน้า {Math.floor(idx / 2) + 1})
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePhoto(photo.id)}
                                            className="absolute top-2 right-2 w-7 h-7 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-xs shadow transition"
                                            title="ลบภาพนี้"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Caption & Editor */}
                                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                                        {editingCaptionId === photo.id ? (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={editingCaptionText}
                                                    onChange={(e) => setEditingCaptionText(e.target.value)}
                                                    placeholder="กรอกคำบรรยายภาพ..."
                                                    className="w-full text-xs rounded-xl border-slate-300 p-2 focus:ring-teal-500 focus:border-teal-500"
                                                    autoFocus
                                                />
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingCaptionId(null)}
                                                        className="px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-100 rounded-lg"
                                                    >
                                                        ยกเลิก
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isSavingCaption}
                                                        onClick={() => handleSavePhotoCaption(photo.id)}
                                                        className="px-3 py-1 bg-teal-600 text-white text-[11px] font-bold rounded-lg hover:bg-teal-700 disabled:opacity-50"
                                                    >
                                                        {isSavingCaption ? 'บันทึก...' : 'บันทึก'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-xs text-slate-700 font-medium line-clamp-2">
                                                    {photo.caption || <span className="text-slate-400 italic">ไม่มีคำบรรยายภาพ</span>}
                                                </p>
                                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                                    <span className="text-[10px] text-slate-400">ขนาดมาตรฐานหน้าละ 2 ภาพ</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingCaptionId(photo.id);
                                                            setEditingCaptionText(photo.caption || '');
                                                        }}
                                                        className="text-[11px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                                                    >
                                                        <span>✏️</span>
                                                        <span>แก้ไขคำบรรยาย</span>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* SECTION 10: อื่น ๆ (เพิ่มได้ไม่จำกัด) */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-xs font-black flex items-center justify-center">10</span>
                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                เอกสารและหลักฐานอื่น ๆ (เพิ่มได้ไม่จำกัด)
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500">
                            แนบเอกสารที่เกี่ยวข้องเพิ่มเติม เช่น ใบลงทะเบียน บันทึกผลงาน แบบทดสอบ ฯลฯ
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowOtherModal(true)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                    >
                        <span>➕</span>
                        <span>เพิ่มเอกสารอื่น ๆ</span>
                    </button>
                </div>

                {otherDocs.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="text-3xl block mb-2">📑</span>
                        <p className="text-slate-500 text-xs font-bold">ยังไม่มีเอกสารอื่น ๆ เพิ่มเติม</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">ท่านสามารถกด "+ เพิ่มเอกสารอื่น ๆ" เพื่ออัพโหลดไฟล์แนบเพิ่มเติมได้ตามต้องการ</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {otherDocs.map((doc, idx) => (
                            <div key={doc.id || idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="text-base">📎</span>
                                            <h4 className="font-bold text-slate-900 text-xs truncate" title={doc.title}>
                                                {doc.title}
                                            </h4>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteAppendix(doc.id, doc.title)}
                                            className="text-rose-600 hover:text-rose-800 p-1 text-xs font-bold"
                                            title="ลบเอกสารนี้"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    {doc.caption && (
                                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{doc.caption}</p>
                                    )}
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                                    <span className="text-slate-400 uppercase">{doc.file_type || 'ไฟล์แนบ'}</span>
                                    <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-teal-700 hover:underline flex items-center gap-1"
                                    >
                                        <span>เปิดดูไฟล์</span>
                                        <span>↗</span>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTIONS 11 & 12: ปกหน้า & ปกหลัง สำหรับการรวมเล่ม (แยกออกมาจากการพิมพ์ต่อกัน) */}
            <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-white rounded-3xl p-6 md:p-8 shadow-sm border border-purple-200 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-100">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold mb-1">
                            <span>📕 ส่วนประกอบเล่มสมบูรณ์ (หมวด 11 - 12)</span>
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-purple-950 flex items-center gap-2">
                            <span>ปกหน้า และ ปกหลัง สำหรับการรวมเล่มรายงาน</span>
                        </h3>
                        <p className="text-xs text-purple-700 max-w-2xl">
                            อัพโหลดไฟล์ปกหน้าและปกหลังที่จัดทำไว้แล้วเพื่อใช้ในการรวมเล่มฉบับสมบูรณ์ 
                            (ไฟล์นี้จะถูกเก็บไว้ใช้รวมเล่ม และจะไม่ถูกนำไปเรียงปนกับหน้าเนื้อหาภาคผนวกภายใน)
                        </p>
                    </div>

                    <span className="text-xs text-purple-800 bg-purple-150 px-3 py-1.5 rounded-xl border border-purple-200">
                        ขนาดไฟล์ไม่เกิน 10 MB ต่อไฟล์
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 11. ปกหน้า (Front Cover) */}
                    <div className="p-5 rounded-2xl border border-purple-200 bg-white shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-purple-700 text-white text-xs font-black flex items-center justify-center">11</span>
                                    <h4 className="font-bold text-purple-950 text-sm">
                                        ปกหน้ารายงานโครงการ (Front Cover)
                                    </h4>
                                </div>
                                {singleFileMap.front_cover ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        ✓ อัพโหลดแล้ว
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                        รออัพโหลด
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                ไฟล์อาร์ตเวิร์คปกหน้า สำหรับนำไปใช้เข้าเล่มรายงานฉบับสมบูรณ์
                            </p>

                            {singleFileMap.front_cover ? (
                                <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2 truncate text-xs">
                                        <span>🖼️</span>
                                        <a
                                            href={singleFileMap.front_cover.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-purple-900 hover:underline truncate"
                                        >
                                            {singleFileMap.front_cover.title}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveCoverPreview({
                                                type: 'front',
                                                url: singleFileMap.front_cover.file_url,
                                                title: 'ปกหน้ารายงานโครงการ'
                                            })}
                                            className="px-2 py-1 text-[11px] bg-purple-200 hover:bg-purple-300 text-purple-900 rounded font-bold"
                                        >
                                            ดูตัวอย่าง
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteAppendix(singleFileMap.front_cover.id, singleFileMap.front_cover.title)}
                                            className="text-rose-600 hover:text-rose-800 p-1 text-xs font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                                    ยังไม่มีไฟล์ปกหน้า
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">รองรับ PDF, JPG, PNG (สูงสุด 10MB)</span>
                            <div>
                                <input
                                    type="file"
                                    ref={(el) => (fileInputRefs.current['front_cover'] = el)}
                                    onChange={(e) => handleFileUpload('front_cover', 'ปกหน้ารายงานโครงการ', e.target.files[0])}
                                    accept=".pdf,image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    disabled={uploadingCategory === 'front_cover'}
                                    onClick={() => fileInputRefs.current['front_cover']?.click()}
                                    className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <span>📤</span>
                                    <span>{uploadingCategory === 'front_cover' ? 'กำลังอัพโหลด...' : 'อัพโหลดปกหน้า'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 12. ปกหลัง (Back Cover) */}
                    <div className="p-5 rounded-2xl border border-purple-200 bg-white shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-purple-700 text-white text-xs font-black flex items-center justify-center">12</span>
                                    <h4 className="font-bold text-purple-950 text-sm">
                                        ปกหลังรายงานโครงการ (Back Cover)
                                    </h4>
                                </div>
                                {singleFileMap.back_cover ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        ✓ อัพโหลดแล้ว
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                        รออัพโหลด
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                ไฟล์อาร์ตเวิร์คปกหลัง สำหรับนำไปใช้เข้าเล่มรายงานฉบับสมบูรณ์
                            </p>

                            {singleFileMap.back_cover ? (
                                <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2 truncate text-xs">
                                        <span>🖼️</span>
                                        <a
                                            href={singleFileMap.back_cover.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-purple-900 hover:underline truncate"
                                        >
                                            {singleFileMap.back_cover.title}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveCoverPreview({
                                                type: 'back',
                                                url: singleFileMap.back_cover.file_url,
                                                title: 'ปกหลังรายงานโครงการ'
                                            })}
                                            className="px-2 py-1 text-[11px] bg-purple-200 hover:bg-purple-300 text-purple-900 rounded font-bold"
                                        >
                                            ดูตัวอย่าง
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteAppendix(singleFileMap.back_cover.id, singleFileMap.back_cover.title)}
                                            className="text-rose-600 hover:text-rose-800 p-1 text-xs font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                                    ยังไม่มีไฟล์ปกหลัง
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">รองรับ PDF, JPG, PNG (สูงสุด 10MB)</span>
                            <div>
                                <input
                                    type="file"
                                    ref={(el) => (fileInputRefs.current['back_cover'] = el)}
                                    onChange={(e) => handleFileUpload('back_cover', 'ปกหลังรายงานโครงการ', e.target.files[0])}
                                    accept=".pdf,image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    disabled={uploadingCategory === 'back_cover'}
                                    onClick={() => fileInputRefs.current['back_cover']?.click()}
                                    className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <span>📤</span>
                                    <span>{uploadingCategory === 'back_cover' ? 'กำลังอัพโหลด...' : 'อัพโหลดปกหลัง'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Add Other Document */}
            {showOtherModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <span>➕</span> เพิ่มเอกสารแนบอื่น ๆ ในภาคผนวก
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowOtherModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAddOtherDocument} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    ชื่อเอกสาร <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={otherFileForm.title}
                                    onChange={(e) => setOtherFileForm({ ...otherFileForm, title: e.target.value })}
                                    placeholder="เช่น รายชื่อผู้ลงทะเบียน, ผลงานของผู้เรียน, เอกสารสรุป ฯลฯ"
                                    className="w-full text-xs rounded-xl border-slate-300 p-2.5 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    คำอธิบายเพิ่มเติม (ไม่บังคับ)
                                </label>
                                <textarea
                                    rows="2"
                                    value={otherFileForm.caption}
                                    onChange={(e) => setOtherFileForm({ ...otherFileForm, caption: e.target.value })}
                                    placeholder="รายละเอียดสั้น ๆ เกี่ยวกับเอกสารนี้..."
                                    className="w-full text-xs rounded-xl border-slate-300 p-2.5 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    เลือกไฟล์ (PDF หรือรูปภาพ ขนาดไม่เกิน 10MB) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    required
                                    ref={(el) => (fileInputRefs.current['other_file'] = el)}
                                    accept=".pdf,image/*"
                                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowOtherModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploadingCategory === 'others'}
                                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <span>💾</span>
                                    <span>{uploadingCategory === 'others' ? 'กำลังบันทึก...' : 'อัพโหลดเอกสาร'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Cover Preview */}
            {activeCoverPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <span>🖼️</span> {activeCoverPreview.title}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActiveCoverPreview(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-50 rounded-2xl my-3">
                            {activeCoverPreview.url?.endsWith('.pdf') ? (
                                <iframe
                                    src={activeCoverPreview.url}
                                    title={activeCoverPreview.title}
                                    className="w-full h-[500px] border-0 rounded-xl"
                                />
                            ) : (
                                <img
                                    src={activeCoverPreview.url}
                                    alt={activeCoverPreview.title}
                                    className="max-w-full max-h-[500px] object-contain rounded-xl shadow"
                                />
                            )}
                        </div>

                        <div className="pt-2 flex items-center justify-end">
                            <a
                                href={activeCoverPreview.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-800"
                            >
                                เปิดไฟล์เต็มในแท็บใหม่ ↗
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
