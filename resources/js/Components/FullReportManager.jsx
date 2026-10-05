import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';
import { router } from '@inertiajs/react';

export default function FullReportManager({
    projects = [],
    activeProject = null,
    onSelectProject = () => {},
    onGoToChapter = () => {},
}) {
    const [isSavingStatus, setIsSavingStatus] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [compiledBy, setCompiledBy] = useState('');
    const [compiledDate, setCompiledDate] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!activeProject) return;

        const meta = activeProject.full_report_metadata || {};
        setIsCompleted(Boolean(activeProject.full_report_completed_at || meta.is_completed));
        setCompiledBy(meta.compiled_by || activeProject.responsible_person || '');
        setCompiledDate(meta.compiled_date || 'ตุลาคม 2569');
        setNotes(meta.notes || '');
    }, [activeProject?.id]);

    if (!activeProject) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm font-sans">
                <span className="text-4xl block mb-3">📚</span>
                <h3 className="text-lg font-bold text-slate-800">ไม่พบข้อมูลโครงการ</h3>
                <p className="text-sm text-slate-500 mt-1">กรุณาเลือกโครงการเพื่อจัดทำรวมรูปเล่มฉบับสมบูรณ์</p>
            </div>
        );
    }

    // Readiness checks for the 10 components
    const hasFrontCover = Boolean(activeProject.appendices?.some(a => a.category === 'front_cover'));
    const hasPrelim = Boolean(activeProject.preliminary_sections?.executive_summary || activeProject.preliminary_sections?.preface);
    const hasCh1 = Boolean(activeProject.chapter_1_content || activeProject.chapter_1_sections?.section_1_1 || activeProject.background_rationale);
    const hasCh2 = Boolean(activeProject.chapter_2_content || activeProject.chapter_2_sections?.section_2_1);
    const hasCh3 = Boolean(activeProject.chapter_3_content || activeProject.chapter_3_sections?.section_3_1);
    const hasCh4 = Boolean(activeProject.chapter_4_content || activeProject.chapter_4_sections?.section_4_1 || activeProject.survey);
    const hasCh5 = Boolean(activeProject.chapter_5_content || activeProject.chapter_5_sections?.section_5_1);
    const hasReferences = Boolean(activeProject.chapter_2_sections?.references || true); // Has default standard citations
    const photoCount = activeProject.photos?.length || 0;
    const appendixDocCount = activeProject.appendices?.length || 0;
    const hasBackCover = Boolean(activeProject.appendices?.some(a => a.category === 'back_cover'));

    const bookSteps = [
        {
            num: 1,
            title: 'ปกหน้า (Front Cover)',
            desc: hasFrontCover ? 'มีไฟล์รูปภาพปกหน้าที่อัพโหลดไว้แล้ว' : 'ใช้รูปแบบปกหน้าทางการมาตรฐาน สอศ. พร้อมตราสัญลักษณ์',
            isReady: true,
            badge: hasFrontCover ? 'กำหนดเอง' : 'มาตรฐาน สอศ.',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            linkTab: 'appendix',
            linkLabel: 'จัดการไฟล์ปก'
        },
        {
            num: 2,
            title: 'ส่วนนำ (Preliminary)',
            desc: hasPrelim ? 'บทสรุปผู้บริหาร, คำนำ, สารบัญ, สารบัญตาราง & ภาพ' : 'พร้อมดึงข้อมูลจากโครงการเพื่อจัดทำ',
            isReady: hasPrelim,
            badge: hasPrelim ? 'พร้อมแล้ว' : 'รอข้อมูล',
            badgeColor: hasPrelim ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
            linkTab: 'preliminary',
            linkLabel: 'แก้ไขส่วนนำ'
        },
        {
            num: 3,
            title: 'บทที่ 1: บทนำ',
            desc: 'ความเป็นมา, วัตถุประสงค์, เป้าหมาย, ขอบเขต และงบประมาณ',
            isReady: hasCh1,
            badge: hasCh1 ? 'พร้อมแล้ว' : 'รอข้อมูล',
            badgeColor: hasCh1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
            linkTab: 'chapter_1',
            linkLabel: 'แก้ไขบทที่ 1'
        },
        {
            num: 4,
            title: 'บทที่ 2: เอกสารและงานวิจัยที่เกี่ยวข้อง',
            desc: 'แนวคิด ทฤษฎี นโยบาย สอศ. และงานวิจัยที่เกี่ยวข้อง',
            isReady: hasCh2,
            badge: hasCh2 ? 'พร้อมแล้ว' : 'รอข้อมูล',
            badgeColor: hasCh2 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
            linkTab: 'chapter_2',
            linkLabel: 'แก้ไขบทที่ 2'
        },
        {
            num: 5,
            title: 'บทที่ 3: วิธีดำเนินการโครงการ',
            desc: 'วงจร PDCA, กลุ่มตัวอย่าง, เครื่องมือประเมิน และสถิติ',
            isReady: hasCh3,
            badge: hasCh3 ? 'พร้อมแล้ว' : 'รอข้อมูล',
            badgeColor: hasCh3 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
            linkTab: 'chapter_3',
            linkLabel: 'แก้ไขบทที่ 3'
        },
        {
            num: 6,
            title: 'บทที่ 4: ผลการดำเนินงาน & การวิเคราะห์',
            desc: 'ตารางกลุ่มผู้ตอบ (4-1), ตัวชี้วัด (4-2), ความพึงพอใจ 4 ด้าน (4-3, 4-4), งบประมาณ (4-5)',
            isReady: hasCh4,
            badge: hasCh4 ? 'พร้อมแล้ว' : 'รอข้อมูล',
            badgeColor: hasCh4 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
            linkTab: 'chapter_4',
            linkLabel: 'แก้ไขบทที่ 4'
        },
        {
            num: 7,
            title: 'บทที่ 5: สรุปผล อภิปรายผล & ข้อเสนอแนะ',
            desc: 'สรุปผลสัมฤทธิ์, อภิปรายผล, ปัญหาอุปสรรค และข้อเสนอแนะพัฒนา',
            isReady: hasCh5,
            badge: hasCh5 ? 'พร้อมแล้ว' : 'รอข้อมูล',
            badgeColor: hasCh5 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
            linkTab: 'chapter_5',
            linkLabel: 'แก้ไขบทที่ 5'
        },
        {
            num: 8,
            title: 'บรรณานุกรม (References)',
            desc: 'รายการเอกสารและแหล่งอ้างอิงวิชาการจัดเรียงตามลำดับอักษร',
            isReady: true,
            badge: 'พร้อมแล้ว',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            linkTab: 'chapter_2',
            linkLabel: 'ดูอ้างอิง'
        },
        {
            num: 9,
            title: 'ภาคผนวก (Appendices)',
            desc: `โครงการอนุมัติ, QR Code แบบสอบถาม, พัสดุ, ภาพถ่ายกิจกรรม (${photoCount} ภาพ), และเอกสารแนบ (${appendixDocCount} ไฟล์)`,
            isReady: true,
            badge: photoCount > 0 ? `${photoCount} ภาพ` : 'พร้อมแผ่นคั่น',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            linkTab: 'appendix',
            linkLabel: 'จัดการภาคผนวก'
        },
        {
            num: 10,
            title: 'ปกหลัง (Back Cover)',
            desc: hasBackCover ? 'มีไฟล์รูปภาพปกหลังที่อัพโหลดไว้แล้ว' : 'รูปแบบปกหลังทางการของสถานศึกษา พร้อมข้อมูลติดต่อ',
            isReady: true,
            badge: hasBackCover ? 'กำหนดเอง' : 'มาตรฐาน สอศ.',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            linkTab: 'appendix',
            linkLabel: 'จัดการไฟล์ปก'
        },
    ];

    const completedCount = bookSteps.filter(s => s.isReady).length;
    const progressPercent = Math.round((completedCount / bookSteps.length) * 100);

    // Save Status
    const handleSaveStatus = async () => {
        setIsSavingStatus(true);
        try {
            const response = await axios.post(route('projects.full_report.save_status', activeProject.id), {
                is_completed: isCompleted,
                compiled_by: compiledBy,
                compiled_date: compiledDate,
                notes: notes,
            }, {
                headers: { 'Accept': 'application/json' }
            });

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกสำเร็จ',
                    text: 'บันทึกสถานะการจัดทำเล่มรายงานสมบูรณ์เรียบร้อยแล้ว',
                    timer: 2000,
                    showConfirmButton: false,
                });
                router.reload({ preserveScroll: true });
            }
        } catch (error) {
            console.error('Save status error:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้',
            });
        } finally {
            setIsSavingStatus(false);
        }
    };

    return (
        <div className="space-y-6 font-sans">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                                📚 รวมรูปเล่มฉบับสมบูรณ์ (Full Book Compilation)
                            </span>
                            {activeProject.full_report_completed_at && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/30 text-green-200 border border-green-400/40 flex items-center gap-1">
                                    <span>✓</span> ปิดเล่มสมบูรณ์แล้ว
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                            จัดทำและดาวน์โหลดเล่มรายงานโครงการฉบับสมบูรณ์
                        </h2>
                        <p className="text-emerald-200/80 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                            ระบบรวบรวมเนื้อหาทั้งหมดตั้งแต่ ปกหน้า → ส่วนนำ → บทที่ 1-5 → บรรณานุกรม → ภาคผนวก → ปกหลัง จัดเรียงตามลำดับมาตรฐานงานวิชาการของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                        <a
                            href={route('projects.full_report.print', activeProject.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <span>🖨️</span>
                            <span>เปิดดู & สั่งพิมพ์เล่ม (Print/PDF)</span>
                        </a>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 flex-1">
                        <span className="text-emerald-200 font-semibold whitespace-nowrap">
                            ความพร้อมของเนื้อหา ({completedCount}/{bookSteps.length} ส่วน):
                        </span>
                        <div className="w-full max-w-md bg-white/10 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-emerald-400 to-teal-300 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        <span className="text-emerald-300 font-bold font-mono">{progressPercent}%</span>
                    </div>

                    {activeProject.full_report_completed_at && (
                        <div className="text-emerald-300 text-xs">
                            บันทึกปิดเล่มเมื่อ: {new Date(activeProject.full_report_completed_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.
                        </div>
                    )}
                </div>
            </div>

            {/* Project Selector (If multiple projects) */}
            {projects.length > 1 && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-sm font-semibold">โครงการที่เลือก:</span>
                        <select
                            value={activeProject.id}
                            onChange={(e) => onSelectProject(Number(e.target.value))}
                            className="bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.code ? `[${p.code}] ` : ''}{p.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="text-xs text-slate-500 font-mono">
                        รหัสโครงการ: {activeProject.code || '-'} | ปีงบประมาณ: {activeProject.academic_year || '2569'}
                    </div>
                </div>
            )}

            {/* 10 Parts Flow / Structure Overview */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            โครงสร้างและลำดับการจัดเรียงรูปเล่ม (Book Sequence Order)
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            แสดงสถานะความพร้อมและรายละเอียดของแต่ละส่วนตามลำดับจริงในรูปเล่ม
                        </p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">10 ส่วนประกอบหลัก</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bookSteps.map((step) => (
                        <div
                            key={step.num}
                            className={`p-4 rounded-2xl border transition hover:shadow-md flex items-start gap-4 ${
                                step.isReady ? 'border-slate-200 bg-white' : 'border-amber-200 bg-amber-50/30'
                            }`}
                        >
                            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center shrink-0 border border-slate-200">
                                {step.num}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <h4 className="text-sm font-bold text-slate-900 truncate">
                                        {step.title}
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${step.badgeColor} shrink-0`}>
                                        {step.badge}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                    {step.desc}
                                </p>
                            </div>

                            {step.linkTab && (
                                <button
                                    type="button"
                                    onClick={() => onGoToChapter(step.linkTab)}
                                    className="text-xs text-purple-700 hover:text-purple-900 font-bold hover:underline shrink-0 self-center"
                                >
                                    {step.linkLabel} →
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Metadata & Status Recording Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            บันทึกการปิดเล่มรายงานและข้อมูลสรุปในระบบ
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            บันทึกข้อมูลผู้รวบรวมเล่ม วันที่ปิดเล่ม และยืนยันความสมบูรณ์เพื่อจัดเก็บไว้ในฐานข้อมูลโครงการ
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            ผู้จัดทำ / ผู้รวบรวมรูปเล่ม (Compiled By)
                        </label>
                        <input
                            type="text"
                            value={compiledBy}
                            onChange={(e) => setCompiledBy(e.target.value)}
                            placeholder="ระบุชื่อผู้รวบรวม เช่น นายสมชาย ใจดี"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            เดือน/ปี ที่จัดทำเล่ม (Compiled Date)
                        </label>
                        <input
                            type="text"
                            value={compiledDate}
                            onChange={(e) => setCompiledDate(e.target.value)}
                            placeholder="เช่น ตุลาคม 2569"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            หมายเหตุหรือข้อความบันทึกเพิ่มเติม
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="เช่น จัดพิมพ์จำนวน 5 เล่ม มอบงานแผนงาน 2 เล่ม และแผนกวิชา 3 เล่ม..."
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={(e) => setIsCompleted(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                        />
                        <span className="text-sm font-bold text-slate-800">
                            ยืนยันว่าการจัดทำรูปเล่มรายงานฉบับสมบูรณ์นี้เสร็จสิ้นเรียบร้อยแล้ว
                        </span>
                    </label>

                    <button
                        type="button"
                        onClick={handleSaveStatus}
                        disabled={isSavingStatus}
                        className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                    >
                        {isSavingStatus ? (
                            <>
                                <span className="animate-spin text-sm">⏳</span>
                                <span>กำลังบันทึก...</span>
                            </>
                        ) : (
                            <>
                                <span>💾</span>
                                <span>บันทึกข้อมูลการจัดทำรูปเล่ม</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
