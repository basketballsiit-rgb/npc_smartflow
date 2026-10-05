import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';
import { router } from '@inertiajs/react';

export default function PreliminaryManager({
    projects = [],
    activeProject = null,
    onSelectProject = () => {},
    onGoToChapter1 = () => {},
}) {
    const [activeSubTab, setActiveSubTab] = useState('executive_summary'); // 'executive_summary' | 'preface' | 'toc' | 'tables_figures'
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCalculatingPages, setIsCalculatingPages] = useState(false);
    const [pageBreakdown, setPageBreakdown] = useState(null);

    // Form state
    const [executiveSummary, setExecutiveSummary] = useState('');
    const [preface, setPreface] = useState('');
    const [signOffName, setSignOffName] = useState('');
    const [signOffDate, setSignOffDate] = useState('');
    const [tocItems, setTocItems] = useState([]);
    const [tableItems, setTableItems] = useState([]);
    const [figureItems, setFigureItems] = useState([]);

    // Auto-Calculate Pages based on actual chapter content length
    const handleCalculatePages = async () => {
        setIsCalculatingPages(true);
        try {
            const response = await axios.post(route('projects.preliminary.calculate_pages', activeProject.id), {
                executive_summary: executiveSummary,
                preface: preface,
            }, {
                headers: { 'Accept': 'application/json' }
            });

            if (response.data.success) {
                setTocItems(response.data.toc_items || []);
                setTableItems(response.data.table_items || []);
                setFigureItems(response.data.figure_items || []);
                setPageBreakdown(response.data.page_breakdown || null);

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: '🔄 คำนวณและปรับรันเลขหน้าตามเนื้อหาเอกสารจริงเรียบร้อยแล้ว',
                    showConfirmButton: false,
                    timer: 2500
                });
            }
        } catch (error) {
            console.error('Calculate pages error:', error);
            Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถคำนวณเลขหน้าได้',
                text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการคำนวณเลขหน้า',
            });
        } finally {
            setIsCalculatingPages(false);
        }
    };

    // Initialize state from activeProject
    useEffect(() => {
        if (!activeProject) return;

        const prelim = activeProject.preliminary_sections || {};
        setExecutiveSummary(prelim.executive_summary || '');
        setPreface(prelim.preface || '');
        setSignOffName(prelim.sign_off_name || `คณะผู้จัดทำ\nโครงการ "${activeProject.title || ''}"`);
        setSignOffDate(prelim.sign_off_date || 'ตุลาคม 2569');
        setTocItems(prelim.toc_items || []);
        setTableItems(prelim.table_items || []);
        setFigureItems(prelim.figure_items || []);
    }, [activeProject?.id]);

    if (!activeProject) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                <span className="text-4xl block mb-3">📑</span>
                <h3 className="text-lg font-bold text-slate-800">ไม่พบข้อมูลโครงการ</h3>
                <p className="text-sm text-slate-500 mt-1">กรุณาเลือกโครงการเพื่อจัดทำส่วนนำ (คำนำ สารบัญ บทสรุปผู้บริหาร)</p>
            </div>
        );
    }

    // AI Generate Preliminary Content
    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await axios.post(route('projects.preliminary.generate', activeProject.id), {}, {
                headers: { 'Accept': 'application/json' }
            });

            if (response.data.success && response.data.sections) {
                const s = response.data.sections;
                setExecutiveSummary(s.executive_summary || '');
                setPreface(s.preface || '');
                setSignOffName(s.sign_off_name || '');
                setSignOffDate(s.sign_off_date || '');
                setTocItems(s.toc_items || []);
                setTableItems(s.table_items || []);
                setFigureItems(s.figure_items || []);

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: '✨ AI สังเคราะห์เนื้อหาส่วนนำสำเร็จ',
                    showConfirmButton: false,
                    timer: 2000
                });
            }
        } catch (error) {
            console.error('Generate preliminary error:', error);
            Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถสร้างเนื้อหาได้',
                text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ AI กรุณาลองใหม่อีกครั้ง',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    // Save Preliminary Content
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                sections: {
                    executive_summary: executiveSummary,
                    preface: preface,
                    sign_off_name: signOffName,
                    sign_off_date: signOffDate,
                    toc_items: tocItems,
                    table_items: tableItems,
                    figure_items: figureItems,
                },
                full_content: `${executiveSummary}\n\n${preface}`
            };

            const response = await axios.post(route('projects.preliminary.save', activeProject.id), payload, {
                headers: { 'Accept': 'application/json' }
            });

            if (response.data.success) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: '💾 บันทึกข้อมูลส่วนนำเรียบร้อยแล้ว',
                    showConfirmButton: false,
                    timer: 2000
                });
                router.reload({ preserveScroll: true });
            }
        } catch (error) {
            console.error('Save preliminary error:', error);
            Swal.fire({
                icon: 'error',
                title: 'บันทึกไม่สำเร็จ',
                text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลส่วนนำ',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Banner / Workspace Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold mb-2">
                            <span>📑</span> เล่มรายงานโครงการ 5 บท • ส่วนนำ (Front Matter & Preliminary)
                        </div>
                        <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                            <span>ส่วนนำ: คำนำ สารบัญ & บทสรุปผู้บริหาร (AI ช่วยสังเคราะห์)</span>
                        </h2>
                        <p className="text-indigo-200 text-xs md:text-sm mt-1 max-w-3xl leading-relaxed">
                            จัดทำส่วนนำของเล่มรายงานตามแบบแผนวิชาการมาตรฐานอาชีวศึกษา (เลขหน้า ก, ข, ค, ...) 
                            สังเคราะห์บทสรุปผู้บริหารและคำนำด้วย AI อิงตามข้อมูลจริงจากบทที่ 1–5 พร้อมสร้างสารบัญอัตโนมัติ
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Project Selector */}
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 min-w-[280px]">
                            <label className="text-[11px] font-bold text-indigo-200 block mb-1">เลือกโครงการ:</label>
                            <select
                                value={activeProject.id}
                                onChange={(e) => onSelectProject(e.target.value)}
                                className="w-full bg-white text-slate-900 text-xs font-bold rounded-xl px-3 py-2 border-0 focus:ring-2 focus:ring-indigo-400"
                            >
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.code ? `[${p.code}] ` : ''}{p.title || p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Print Button */}
                        <a
                            href={route('projects.preliminary.print', activeProject.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg transition transform active:scale-95"
                            title="พิมพ์เฉพาะส่วนนำขนาด A4 เลขหน้า ก, ข, ค"
                        >
                            <span>🖨️</span>
                            <span>พิมพ์เอกสารส่วนนำ (A4)</span>
                        </a>
                    </div>
                </div>

                {/* Action Bar Inside Banner */}
                <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black shadow transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                    <span>AI กำลังประมวลผลบทสรุป & คำนำ...</span>
                                </>
                            ) : (
                                <>
                                    <span>✨</span>
                                    <span>AI สังเคราะห์ส่วนนำทั้งหมด (บทสรุป คำนำ สารบัญ)</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <span>💾</span>
                            <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลส่วนนำ'}</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onGoToChapter1}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white font-bold transition flex items-center gap-1.5"
                    >
                        <span>ต่อไปยัง บทที่ 1: บทนำ</span>
                        <span>👉</span>
                    </button>
                </div>
            </div>

            {/* Sub-Tabs Navigation */}
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200 flex flex-wrap gap-2 text-xs font-bold">
                <button
                    type="button"
                    onClick={() => setActiveSubTab('executive_summary')}
                    className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                        activeSubTab === 'executive_summary'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <span>📊</span>
                    <span>1. บทสรุปผู้บริหาร (Executive Summary)</span>
                    {executiveSummary && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">✓ มีเนื้อหา</span>}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSubTab('preface')}
                    className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                        activeSubTab === 'preface'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <span>📜</span>
                    <span>2. คำนำ (Preface / Foreword)</span>
                    {preface && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">✓ มีเนื้อหา</span>}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSubTab('toc')}
                    className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                        activeSubTab === 'toc'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <span>📑</span>
                    <span>3. สารบัญเนื้อหา (Table of Contents)</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{tocItems.length} หัวข้อ</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSubTab('tables_figures')}
                    className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                        activeSubTab === 'tables_figures'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <span>🖼️</span>
                    <span>4. สารบัญตาราง & สารบัญภาพ</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        ตาราง {tableItems.length} • ภาพ {figureItems.length}
                    </span>
                </button>
            </div>

            {/* TAB 1: บทสรุปผู้บริหาร (Executive Summary) */}
            {activeSubTab === 'executive_summary' && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold mb-1">
                                <span>📊 ส่วนนำ • หน้า ก</span>
                            </div>
                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                บทสรุปผู้บริหาร (Executive Summary)
                            </h3>
                            <p className="text-xs text-slate-500">
                                สรุปภาพรวมโครงการ วัตถุประสงค์ ผลสัมฤทธิ์เชิงปริมาณและคุณภาพ ความพึงพอใจ และข้อเสนอแนะเชิงนโยบาย
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center gap-1 self-start sm:self-auto"
                        >
                            <span>✨</span>
                            <span>{isGenerating ? 'กำลังสร้าง...' : 'AI สังเคราะห์บทสรุป'}</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                เนื้อหาบทสรุปผู้บริหาร (แก้ไขปรับปรุงได้):
                            </label>
                            <textarea
                                rows="14"
                                value={executiveSummary}
                                onChange={(e) => setExecutiveSummary(e.target.value)}
                                placeholder="กดปุ่ม 'AI สังเคราะห์ส่วนนำทั้งหมด' เพื่อให้ระบบประมวลผลวัตถุประสงค์ ผลดำเนินงาน และสถิติความพึงพอใจมาสรุปให้อัตโนมัติ หรือพิมพ์ข้อความด้วยตนเอง..."
                                className="w-full text-xs font-sans rounded-2xl border-slate-300 p-4 leading-relaxed focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs text-indigo-900 space-y-2">
                            <p className="font-bold flex items-center gap-1.5">
                                <span>💡</span>
                                <span>คำแนะนำเชิงมาตรฐานวิชาการ:</span>
                            </p>
                            <p className="text-slate-600 leading-relaxed">
                                บทสรุปผู้บริหารควรเขียนให้มีความกระชับ ครบถ้วน จบใน 1–2 หน้า A4 โดยระบุ วัตถุประสงค์, 
                                กลุ่มเป้าหมาย, ขั้นตอนการดำเนินงานตามวงจร PDCA, ตัวเลขสถิติความพึงพอใจ (X̄, S.D., %), 
                                ผลการเบิกจ่ายงบประมาณ และข้อเสนอแนะสำหรับการต่อยอด
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: คำนำ (Preface / Foreword) */}
            {activeSubTab === 'preface' && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold mb-1">
                                <span>📜 ส่วนนำ • หน้า ข</span>
                            </div>
                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                คำนำ (Preface / Foreword)
                            </h3>
                            <p className="text-xs text-slate-500">
                                แสดงความเป็นมา โครงสร้างรายงาน 5 บท และแสดงความขอบคุณผู้สนับสนุนและผู้เกี่ยวข้อง
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center gap-1 self-start sm:self-auto"
                        >
                            <span>✨</span>
                            <span>{isGenerating ? 'กำลังสร้าง...' : 'AI ร่างคำนำมาตรฐาน'}</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                เนื้อหาคำนำ (แก้ไขปรับปรุงได้):
                            </label>
                            <textarea
                                rows="10"
                                value={preface}
                                onChange={(e) => setPreface(e.target.value)}
                                placeholder="กดปุ่ม 'AI สังเคราะห์ส่วนนำทั้งหมด' เพื่อให้ระบบร่างคำนำที่สอดคล้องกับโครงการและหลักวิชาการ หรือพิมพ์ข้อความด้วยตนเอง..."
                                className="w-full text-xs font-sans rounded-2xl border-slate-300 p-4 leading-relaxed focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    ชื่อผู้ลงนามท้ายคำนำ:
                                </label>
                                <textarea
                                    rows="2"
                                    value={signOffName}
                                    onChange={(e) => setSignOffName(e.target.value)}
                                    placeholder="เช่น คณะผู้จัดทำ&#10;โครงการพัฒนาการจัดการศึกษา"
                                    className="w-full text-xs rounded-xl border-slate-300 p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    เดือนและปีที่จัดทำ:
                                </label>
                                <input
                                    type="text"
                                    value={signOffDate}
                                    onChange={(e) => setSignOffDate(e.target.value)}
                                    placeholder="เช่น ตุลาคม 2569"
                                    className="w-full text-xs rounded-xl border-slate-300 p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    ระบุเดือนและปี พ.ศ. ที่จัดพิมพ์เล่มรายงานฉบับสมบูรณ์
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: สารบัญเนื้อหา (Table of Contents) */}
            {activeSubTab === 'toc' && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold mb-1">
                                <span>📑 ส่วนนำ • หน้า ค</span>
                            </div>
                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                สารบัญเนื้อหา (Table of Contents)
                            </h3>
                            <p className="text-xs text-slate-500">
                                โครงสร้างหัวข้อหลักและหัวข้อย่อย บทที่ 1 ถึง บทที่ 5 และภาคผนวก พร้อมเลขหน้า
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCalculatePages}
                                disabled={isCalculatingPages}
                                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                                title="ดึงหัวข้อสำคัญให้ตรงกับทุกบท (บทที่ 1–5 และภาคผนวก) และคำนวณรันเลขหน้าตามเนื้อหาจริง"
                            >
                                <span>🔄</span>
                                <span>{isCalculatingPages ? 'กำลังคำนวณเลขหน้า...' : 'ซิงค์หัวข้อและคำนวณเลขหน้าจากเนื้อหาจริง'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition"
                            >
                                {isSaving ? 'กำลังบันทึก...' : '💾 บันทึก'}
                            </button>
                        </div>
                    </div>

                    {/* Informational Banner */}
                    <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-base">💡</span>
                            <div>
                                <span className="font-bold">ระบบคำนวณและรันเลขหน้าตามเนื้อหาจริง: </span>
                                <span className="text-emerald-800">รันต่อเนื่องตามความยาวของบทที่ 1–5, ตารางในบทที่ 4, และจัดวางภาพกิจกรรมหน้าละ 2 ภาพในภาคผนวก (สามารถคลิกแก้ไขตัวเลขในช่องตารางได้โดยตรง)</span>
                            </div>
                        </div>
                        {pageBreakdown && (
                            <span className="shrink-0 bg-white px-2.5 py-1 rounded-xl font-bold border border-emerald-200 text-emerald-800 text-[11px]">
                                ประมาณการทั้งเล่ม ~{pageBreakdown.total_pages} หน้า
                            </span>
                        )}
                    </div>

                    {tocItems.length === 0 ? (
                        <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                            <span className="text-3xl block mb-2">📑</span>
                            <p className="text-xs font-bold text-slate-700">ยังไม่มีข้อมูลสารบัญ</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 mb-4">
                                คลิกปุ่มด้านล่างเพื่อสร้างโครงสร้างสารบัญ 5 บทมาตรฐานอัตโนมัติ
                            </p>
                            <button
                                type="button"
                                onClick={handleGenerate}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow"
                            >
                                ✨ สร้างสารบัญมาตรฐานอัตโนมัติ
                            </button>
                        </div>
                    ) : (
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">หัวข้อ / รายการในเล่ม</th>
                                        <th className="px-4 py-3 w-28 text-right">หน้า</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {tocItems.map((item, idx) => (
                                        <tr key={idx} className={item.is_bold ? 'bg-slate-50/50 font-bold text-slate-900' : 'text-slate-700 hover:bg-slate-50/50'}>
                                            <td className="px-4 py-2.5">
                                                <input
                                                    type="text"
                                                    value={item.title}
                                                    onChange={(e) => {
                                                        const updated = [...tocItems];
                                                        updated[idx].title = e.target.value;
                                                        setTocItems(updated);
                                                    }}
                                                    className="w-full bg-transparent border-0 p-0 text-xs focus:ring-0 font-inherit"
                                                />
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                <input
                                                    type="text"
                                                    value={item.page}
                                                    onChange={(e) => {
                                                        const updated = [...tocItems];
                                                        updated[idx].page = e.target.value;
                                                        setTocItems(updated);
                                                    }}
                                                    className="w-16 bg-transparent border-0 p-0 text-xs text-right font-mono focus:ring-0 font-inherit"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 4: สารบัญตาราง & สารบัญภาพ */}
            {activeSubTab === 'tables_figures' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                                <span>📊</span> สารบัญตาราง & สารบัญภาพ
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                จัดการเลขหน้าตารางในบทที่ 4 และภาพกิจกรรมในภาคผนวก โดยอิงจากการคำนวณเนื้อหาจริง
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCalculatePages}
                                disabled={isCalculatingPages}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
                            >
                                {isCalculatingPages ? (
                                    <>
                                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                        </svg>
                                        กำลังคำนวณหน้าจริง...
                                    </>
                                ) : (
                                    <>
                                        <span>🔄</span> คำนวณเลขหน้าจากเนื้อหาจริง
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition"
                            >
                                {isSaving ? 'กำลังบันทึก...' : '💾 บันทึก'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-4 text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <span className="text-lg">💡</span>
                            <div>
                                <span className="font-bold">กติกาการคำนวณตำแหน่งหน้า: </span>
                                <span className="text-emerald-800">ตารางที่ 4-1 ถึง 4-5 อ้างอิงตามตำแหน่งข้อความจริงในบทที่ 4 ส่วนภาพกิจกรรมคำนวณตามสูตร 2 ภาพต่อหน้ากระดาษ A4 ในภาคผนวก</span>
                            </div>
                        </div>
                        {pageBreakdown && (
                            <span className="shrink-0 bg-white px-2.5 py-1 rounded-xl font-bold border border-emerald-200 text-emerald-800 text-[11px]">
                                ประมาณการทั้งเล่ม ~{pageBreakdown.total_pages} หน้า
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* สารบัญตาราง */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold mb-1">
                                        หน้า ง
                                    </span>
                                    <h4 className="font-bold text-slate-900 text-sm">สารบัญตาราง (List of Tables)</h4>
                                </div>
                                <span className="text-[11px] text-slate-400">{tableItems.length} ตาราง</span>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                                <table className="w-full">
                                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2 text-left">ตารางที่</th>
                                            <th className="px-3 py-2 text-right w-20">หน้า</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {tableItems.map((t, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={t.title}
                                                        onChange={(e) => {
                                                            const updated = [...tableItems];
                                                            updated[idx].title = e.target.value;
                                                            setTableItems(updated);
                                                        }}
                                                        className="w-full bg-transparent border-0 p-0 text-xs focus:ring-0 text-slate-800"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <input
                                                        type="text"
                                                        value={t.page}
                                                        onChange={(e) => {
                                                            const updated = [...tableItems];
                                                            updated[idx].page = e.target.value;
                                                            setTableItems(updated);
                                                        }}
                                                        className="w-14 bg-transparent border-0 p-0 text-right font-mono text-slate-600 focus:ring-0 text-xs ml-auto"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* สารบัญภาพ */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold mb-1">
                                        หน้า จ
                                    </span>
                                    <h4 className="font-bold text-slate-900 text-sm">สารบัญภาพ (List of Figures)</h4>
                                </div>
                                <span className="text-[11px] text-slate-400">{figureItems.length} ภาพ</span>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                                <table className="w-full">
                                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2 text-left">ภาพที่</th>
                                            <th className="px-3 py-2 text-right w-20">หน้า</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {figureItems.map((f, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={f.title}
                                                        onChange={(e) => {
                                                            const updated = [...figureItems];
                                                            updated[idx].title = e.target.value;
                                                            setFigureItems(updated);
                                                        }}
                                                        className="w-full bg-transparent border-0 p-0 text-xs focus:ring-0 text-slate-800 truncate"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <input
                                                        type="text"
                                                        value={f.page}
                                                        onChange={(e) => {
                                                            const updated = [...figureItems];
                                                            updated[idx].page = e.target.value;
                                                            setFigureItems(updated);
                                                        }}
                                                        className="w-14 bg-transparent border-0 p-0 text-right font-mono text-slate-600 focus:ring-0 text-xs ml-auto"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
