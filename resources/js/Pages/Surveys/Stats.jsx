import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import axios from 'axios';

export default function Stats({ project, totalResponses, detailedStats, comments, actRecommendation, evaluationUrl }) {
    const [generating, setGenerating] = useState(false);
    const [analyzingSentiment, setAnalyzingSentiment] = useState(false);
    const [sentimentData, setSentimentData] = useState(null);

    const handleGenerateAi = () => {
        setGenerating(true);
        router.post(route('surveys.generate_ai', project.id), {}, {
            onFinish: () => setGenerating(false)
        });
    };

    const handleAnalyzeSentiment = async () => {
        setAnalyzingSentiment(true);
        try {
            const res = await axios.post(route('surveys.ai_sentiment', project.id));
            setSentimentData(res.data);
        } catch (err) {
            console.error('Sentiment analysis error:', err);
            alert('เกิดข้อผิดพลาดในการวิเคราะห์ความรู้สึก กรุณาลองใหม่อีกครั้ง');
        } finally {
            setAnalyzingSentiment(false);
        }
    };

    // Standardize all numerals to Arabic numerals
    const toArabicNumerals = (num) => {
        if (num === null || num === undefined) return '';
        const thaiToArabic = {
            '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
            '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9'
        };
        return String(num).replace(/[๐-๙]/g, (ch) => thaiToArabic[ch] || ch);
    };
    const toThaiNumerals = toArabicNumerals;

    const dimensionStats = detailedStats?.dimensionStats || {};
    const questionsStats = detailedStats?.questionsStats || [];
    const demographicStats = detailedStats?.demographicStats || null;
    const chapter1Comparison = detailedStats?.chapter1Comparison || null;
    const overallMean = Number(detailedStats?.overallMean || 0);
    const overallSd = Number(detailedStats?.overallSd || 0);
    const overallPercentage = Number(detailedStats?.overallPercentage || 0);
    const overallLevel = detailedStats?.overallLevel || 'ยังไม่มีข้อมูล';

    const dimensionMetadata = [
        {
            dim: 1,
            title: 'ด้านที่ 1: ด้านกระบวนการและขั้นตอนการดำเนินงาน (Process / Plan & Do)',
            shortTitle: 'ด้านที่ 1 กระบวนการและขั้นตอน (Process)',
            icon: '⚙️',
            barColor: 'from-blue-500 to-indigo-600',
            badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        },
        {
            dim: 2,
            title: 'ด้านที่ 2: ด้านปัจจัยนำเข้าและการอำนวยความสะดวก (Input)',
            shortTitle: 'ด้านที่ 2 ปัจจัยนำเข้าและสิ่งอำนวยความสะดวก (Input)',
            icon: '🏢',
            barColor: 'from-purple-500 to-indigo-600',
            badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        },
        {
            dim: 3,
            title: 'ด้านที่ 3: ด้านผลผลิตและผลลัพธ์โดยตรง (Output / Objective)',
            shortTitle: 'ด้านที่ 3 ผลผลิตและวัตถุประสงค์โครงการ (Output)',
            icon: '🎯',
            barColor: 'from-emerald-500 to-teal-600',
            badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        },
        {
            dim: 4,
            title: 'ด้านที่ 4: ด้านประโยชน์และการนำไปใช้ประโยชน์ (Outcome / Impact)',
            shortTitle: 'ด้านที่ 4 ประโยชน์และผลกระทบเชิงบวก (Outcome / KPIs)',
            icon: '🌟',
            barColor: 'from-amber-500 to-orange-600',
            badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        },
    ];

    const getLevelBadgeClass = (score) => {
        if (score >= 4.50) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (score >= 3.50) return 'bg-teal-100 text-teal-800 border-teal-200';
        if (score >= 2.50) return 'bg-amber-100 text-amber-800 border-amber-200';
        if (score >= 1.50) return 'bg-orange-100 text-orange-800 border-orange-200';
        return 'bg-rose-100 text-rose-800 border-rose-200';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between font-sans gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold mb-1">
                            <span>📊 รายงานวิเคราะห์สถิติผลการประเมินเชิงลึก 4 ด้าน (PDCA Check & Act)</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black leading-tight text-purple-950 dark:text-gray-100">
                            โครงการ: {project.title}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            ประจำปีการศึกษา {toArabicNumerals(project.academic_year)} | วิทยาลัยสารพัดช่างน่าน
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('dashboard')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-xs font-bold text-purple-800 hover:bg-purple-50 transition-colors shadow-2xs whitespace-nowrap"
                        >
                            <span>←</span>
                            <span>กลับสู่ศูนย์ควบคุม (Dashboard)</span>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`วิเคราะห์สถิติประเมินผลโครงการ: ${project.title}`} />

            <div className="py-8 font-sans">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">

                    {/* 1. ภาพรวมตัวชี้วัดสำคัญ (Key Statistical Indicators) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 text-center">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 block">ผู้ตอบแบบประเมินทั้งหมด (N)</span>
                            <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                                {toArabicNumerals(totalResponses)} <span className="text-xs font-medium text-slate-500">คน</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 text-center">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">ค่าเฉลี่ยภาพรวมทั้งโครงการ (x̄)</span>
                            <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                {toArabicNumerals(overallMean.toFixed(2))}
                                <span className="text-xs font-semibold text-slate-400"> / 5.00</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 text-center">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 block">ส่วนเบี่ยงเบนมาตรฐาน (S.D.)</span>
                            <div className="mt-2 text-3xl font-black text-teal-600 dark:text-teal-400">
                                {toArabicNumerals(overallSd.toFixed(2))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 text-center">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">ระดับความพึงพอใจภาพรวม</span>
                            <div className="mt-2 text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 truncate">
                                {overallLevel}
                            </div>
                            <span className="text-[10px] text-amber-700 block mt-0.5">
                                (ร้อยละ {toArabicNumerals(overallPercentage.toFixed(1))}%)
                            </span>
                        </div>
                    </div>

                    {/* 2. การวิเคราะห์ผลการประเมินจำแนกรายด้าน 4 ด้าน (Dimension Breakdown) */}
                    <div className="rounded-3xl border border-purple-100 bg-white p-6 sm:p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-gray-700 gap-2">
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-purple-950 dark:text-white flex items-center gap-2">
                                    <span>📊</span> สรุปผลการประเมินจำแนกรายด้าน 4 ด้าน (Standard 4 Dimensions)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    วิเคราะห์คะแนนเฉลี่ย (x̄), ส่วนเบี่ยงเบนมาตรฐาน (S.D.) และระดับความพึงพอใจตามเกณฑ์มาตรฐาน Best (1977)
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {dimensionMetadata.map((dimMeta) => {
                                const stat = dimensionStats[dimMeta.dim] || { mean: 0, sd: 0, percentage: 0, level: 'ยังไม่มีข้อมูล' };
                                const pct = Number(stat.percentage || 0);
                                const mean = Number(stat.mean || 0);
                                const sd = Number(stat.sd || 0);

                                return (
                                    <div 
                                        key={dimMeta.dim}
                                        className="p-5 rounded-2xl bg-slate-50/70 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-700 space-y-3 hover:border-purple-200 transition"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2">
                                                <span className="text-2xl">{dimMeta.icon}</span>
                                                <div>
                                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                                        {dimMeta.title}
                                                    </h4>
                                                    <span className="text-[11px] text-slate-500">
                                                        {dimMeta.dim === 1 && 'การประชาสัมพันธ์, ขั้นตอน, เวลา, การอำนวยความสะดวก'}
                                                        {dimMeta.dim === 2 && 'สถานที่, วัสดุอุปกรณ์/สื่อ, อาหารสวัสดิการ, วิทยากร'}
                                                        {dimMeta.dim === 3 && 'ความรู้ความเข้าใจ, ทักษะปฏิบัติ, ความสำเร็จตามเป้าหมาย'}
                                                        {dimMeta.dim === 4 && 'การประยุกต์ใช้, ประโยชน์ต่อการเรียน/งาน, ความคุ้มค่าต่อเนื่อง'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${getLevelBadgeClass(mean)}`}>
                                                {stat.level || 'ปานกลาง'}
                                            </span>
                                        </div>

                                        {/* Progress Bar & Value */}
                                        <div className="space-y-1.5 pt-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-purple-950 dark:text-purple-300">
                                                    คะแนนเฉลี่ย: {toArabicNumerals(mean.toFixed(2))} / 5.00 (S.D. = {toArabicNumerals(sd.toFixed(2))})
                                                </span>
                                                <span className="text-slate-600 dark:text-slate-400">
                                                    {toArabicNumerals(pct.toFixed(1))}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                                <div 
                                                    className={`h-3 rounded-full bg-gradient-to-r ${dimMeta.barColor} transition-all duration-500`}
                                                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. ผลคะแนนความพึงพอใจจำแนกรายข้อ (Dynamic Question Breakdown) */}
                    <div className="rounded-3xl border border-purple-100 bg-white p-6 sm:p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-gray-700 gap-2">
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-purple-950 dark:text-white flex items-center gap-2">
                                    <span>📝</span> ผลคะแนนความพึงพอใจจำแนกรายข้อ ({toArabicNumerals(questionsStats.length)} ข้อคำถาม)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    ข้อคำถามประเมินความพึงพอใจของโครงการ พร้อมแสดงค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน และร้อยละ
                                </p>
                            </div>
                        </div>

                        {questionsStats.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">ยังไม่มีข้อมูลผลการประเมิน</p>
                        ) : (
                            <div className="space-y-6">
                                {[1, 2, 3, 4].map((dNum) => {
                                    const dQuestions = questionsStats.filter(q => q.dimension === dNum);
                                    if (dQuestions.length === 0) return null;
                                    const meta = dimensionMetadata.find(m => m.dim === dNum);

                                    return (
                                        <div key={dNum} className="space-y-3">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50/70 rounded-xl border border-purple-100 text-xs font-bold text-purple-950">
                                                <span>{meta?.icon}</span>
                                                <span>{meta?.title}</span>
                                            </div>

                                            <div className="space-y-3 pl-2 sm:pl-4">
                                                {dQuestions.map((q, idx) => {
                                                    const mean = Number(q.mean || 0);
                                                    const pct = Number(q.percentage || 0);
                                                    const sd = Number(q.sd || 0);

                                                    return (
                                                        <div key={q.id || idx} className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-purple-50/40 border border-slate-200/80 transition space-y-2">
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                                                <span className="text-xs font-bold text-slate-900 leading-snug">
                                                                    {toArabicNumerals(q.id || idx + 1)}. {q.question}
                                                                </span>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <span className="text-xs font-black text-purple-950">
                                                                        {toArabicNumerals(mean.toFixed(2))} / 5.00
                                                                    </span>
                                                                    <span className="text-[11px] text-slate-500">
                                                                        (S.D. = {toArabicNumerals(sd.toFixed(2))})
                                                                    </span>
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLevelBadgeClass(mean)}`}>
                                                                        {q.level || 'ปานกลาง'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                                <div 
                                                                    className={`h-2 rounded-full bg-gradient-to-r ${meta?.barColor || 'from-purple-500 to-indigo-600'} transition-all duration-500`}
                                                                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 4. การวิเคราะห์ผลการประเมินย้อนกลับไปยังบทที่ 1 (Design Alignment) */}
                    {chapter1Comparison && (
                        <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-slate-50 p-6 sm:p-8 shadow-sm space-y-4">
                            <div className="border-b border-indigo-100 pb-2">
                                <h3 className="text-base sm:text-lg font-black text-indigo-950 flex items-center gap-2">
                                    <span>🎯</span> การวิเคราะห์เปรียบเทียบผลลัพธ์ย้อนกลับสู่บทที่ 1 (Objective & KPI Alignment)
                                </h3>
                                <p className="text-xs text-indigo-800 mt-0.5">
                                    รายงานสรุปความสำเร็จเทียบกับวัตถุประสงค์ ประโยชน์ที่คาดว่าจะได้รับ และตัวชี้วัดความสำเร็จของโครงการ
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                {/* Objective Card */}
                                <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-indigo-950">1. ตอบโจทย์วัตถุประสงค์</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLevelBadgeClass(chapter1Comparison.objectiveFulfillment?.mean || 0)}`}>
                                            {chapter1Comparison.objectiveFulfillment?.level}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black text-indigo-950">
                                        x̄ = {toArabicNumerals(Number(chapter1Comparison.objectiveFulfillment?.mean || 0).toFixed(2))}
                                        <span className="text-xs text-slate-500 font-medium"> (S.D. {toArabicNumerals(Number(chapter1Comparison.objectiveFulfillment?.sd || 0).toFixed(2))})</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        {chapter1Comparison.objectiveFulfillment?.summary}
                                    </p>
                                </div>

                                {/* Benefit Card */}
                                <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-indigo-950">2. ตอบโจทย์ประโยชน์ที่ได้รับ</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLevelBadgeClass(chapter1Comparison.benefitRealization?.mean || 0)}`}>
                                            {chapter1Comparison.benefitRealization?.level}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black text-indigo-950">
                                        x̄ = {toArabicNumerals(Number(chapter1Comparison.benefitRealization?.mean || 0).toFixed(2))}
                                        <span className="text-xs text-slate-500 font-medium"> (S.D. {toArabicNumerals(Number(chapter1Comparison.benefitRealization?.sd || 0).toFixed(2))})</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        {chapter1Comparison.benefitRealization?.summary}
                                    </p>
                                </div>

                                {/* KPI Card */}
                                <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-indigo-950">3. ตัวชี้วัดความสำเร็จ (KPIs)</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                            chapter1Comparison.kpiAchievement?.isPassed
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                                        }`}>
                                            {chapter1Comparison.kpiAchievement?.isPassed ? '✓ ผ่านเกณฑ์ตัวชี้วัด' : 'ปรับปรุง'}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black text-indigo-950">
                                        {toArabicNumerals(Number(chapter1Comparison.kpiAchievement?.overallPercentage || 0).toFixed(1))}%
                                        <span className="text-xs text-slate-500 font-medium"> (เกณฑ์ ≥ ร้อยละ 80.0)</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        {chapter1Comparison.kpiAchievement?.summary}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 5. ข้อมูลทั่วไปของผู้ตอบแบบประเมิน (Demographic Information) */}
                    {demographicStats && totalResponses > 0 && (
                        <div className="rounded-3xl border border-purple-100 bg-white p-6 sm:p-8 shadow-sm space-y-4">
                            <div className="border-b border-slate-100 pb-2">
                                <h3 className="text-base sm:text-lg font-black text-purple-950 flex items-center gap-2">
                                    <span>👤</span> ข้อมูลทั่วไปของผู้ตอบแบบประเมิน (Demographic Profile)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    ข้อมูลผู้ตอบแบบประเมินจำแนกตามเพศ ระดับการศึกษา และสถานะ
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                {/* Gender */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                                    <span className="text-xs font-bold text-purple-950 block">1. เพศ (Gender)</span>
                                    <div className="space-y-1.5 text-xs">
                                        {demographicStats.gender?.map(g => (
                                            <div key={g.key} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                                                <span className="font-medium text-slate-700">{g.label}</span>
                                                <span className="font-bold text-purple-950">
                                                    {toArabicNumerals(g.count)} คน ({toArabicNumerals(Number(g.percentage || 0).toFixed(1))}%)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Education */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                                    <span className="text-xs font-bold text-purple-950 block">2. ระดับการศึกษา (Education Level)</span>
                                    <div className="space-y-1.5 text-xs">
                                        {demographicStats.education_level?.map(edu => (
                                            <div key={edu.key} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                                                <span className="font-medium text-slate-700">{edu.label}</span>
                                                <span className="font-bold text-purple-950">
                                                    {toArabicNumerals(edu.count)} คน ({toArabicNumerals(Number(edu.percentage || 0).toFixed(1))}%)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Respondent Status */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                                    <span className="text-xs font-bold text-purple-950 block">3. สถานะของผู้ตอบ (Respondent Status)</span>
                                    <div className="space-y-1.5 text-xs">
                                        {demographicStats.respondent_type?.map(rt => (
                                            <div key={rt.key} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                                                <span className="font-medium text-slate-700">{rt.label}</span>
                                                <span className="font-bold text-purple-950">
                                                    {toArabicNumerals(rt.count)} คน ({toArabicNumerals(Number(rt.percentage || 0).toFixed(1))}%)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 6. ข้อเสนอแนะเชิงรุกและแนวทางการปรับปรุง (AI ACT Phase) */}
                    <div className="rounded-3xl border border-purple-200 bg-purple-50/40 p-6 sm:p-8 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-purple-100 gap-3">
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-purple-950 flex items-center gap-2">
                                    <span>🤖</span> ข้อเสนอแนะเชิงรุกและแนวทางการปรับปรุงด้วย Gemini AI (AI ACT Phase)
                                </h3>
                                <p className="text-xs text-purple-900 mt-0.5">
                                    ประมวลผลการวิเคราะห์ข้อมูลความพึงพอใจ 4 ด้าน และข้อเสนอแนะเพื่อนำไปจัดทำแผนปรับปรุงในบทที่ 5 (Act Phase)
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleGenerateAi}
                                disabled={generating || totalResponses === 0}
                                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 disabled:opacity-50 transition-all shrink-0"
                            >
                                {generating ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>กำลังวิเคราะห์ด้วย Gemini AI...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>⚡</span>
                                        <span>ประมวลผลข้อเสนอแนะด้วย Gemini AI</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {actRecommendation ? (
                            <div className="prose prose-sm max-w-none text-slate-800 bg-white p-6 rounded-2xl border border-purple-200 whitespace-pre-line leading-relaxed shadow-2xs font-sans text-xs sm:text-sm">
                                {actRecommendation}
                            </div>
                        ) : (
                            <div className="bg-white p-6 rounded-2xl border border-dashed border-purple-200 text-center py-8">
                                <span className="text-3xl block mb-2">💡</span>
                                <p className="text-xs text-slate-600 font-bold">
                                    ยังไม่มีข้อมูลข้อเสนอแนะ AI สำหรับรอบนี้
                                </p>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    กดปุ่ม "ประมวลผลข้อเสนอแนะด้วย Gemini AI" ด้านบน เพื่อให้ AI สังเคราะห์ข้อเสนอแนะเชิงพัฒนาสำหรับจัดทำบทที่ 5 ต่อไป
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 7. ข้อเสนอแนะเพิ่มเติมและการวิเคราะห์ความรู้สึก (AI Sentiment & Qualitative Analytics) */}
                    <div className="rounded-3xl border border-purple-100 bg-white p-6 sm:p-8 shadow-sm space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-purple-950 flex items-center gap-2">
                                    <span>💬</span> ข้อเสนอแนะเพิ่มเติมจากผู้ตอบแบบประเมิน ({toArabicNumerals(comments?.length || 0)} รายการ)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    รวบรวมข้อคิดเห็นเชิงคุณภาพจากผู้เข้าร่วมโครงการ
                                </p>
                            </div>

                            {comments && comments.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleAnalyzeSentiment}
                                    disabled={analyzingSentiment}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:to-indigo-700 text-white font-black text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                                >
                                    {analyzingSentiment ? '⌛ AI กำลังวิเคราะห์ความรู้สึก...' : '✨ AI วิเคราะห์ความรู้สึก (Sentiment Analysis)'}
                                </button>
                            )}
                        </div>

                        {/* AI Sentiment Analysis Card */}
                        {sentimentData && (
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-purple-50/60 to-white border border-indigo-200 space-y-4 text-xs">
                                <div className="flex items-center justify-between pb-2 border-b border-indigo-200">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">🤖</span>
                                        <h4 className="font-black text-indigo-950 text-sm">
                                            ผลการวิเคราะห์ความรู้สึกและข้อเสนอแนะเชิงลึก (AI Sentiment Analytics)
                                        </h4>
                                    </div>
                                    <span className="text-[11px] text-indigo-700 font-bold">
                                        ประมวลผลจาก {comments.length} ข้อความ
                                    </span>
                                </div>

                                {/* Sentiment Distribution Bars */}
                                {sentimentData.sentiment_distribution && (
                                    <div className="space-y-1.5">
                                        <div className="text-[11px] font-bold text-slate-600">สัดส่วนความรู้สึกของผู้ตอบแบบสอบถาม (Sentiment Ratio):</div>
                                        <div className="w-full h-4 rounded-full bg-slate-200 overflow-hidden flex">
                                            <div
                                                style={{ width: `${sentimentData.sentiment_distribution.positive_pct}%` }}
                                                className="bg-emerald-500 h-full text-[9px] text-white font-bold flex items-center justify-center"
                                                title={`เชิงบวก / ชื่นชม: ${sentimentData.sentiment_distribution.positive_pct}%`}
                                            >
                                                {sentimentData.sentiment_distribution.positive_pct > 10 ? `${sentimentData.sentiment_distribution.positive_pct}%` : ''}
                                            </div>
                                            <div
                                                style={{ width: `${sentimentData.sentiment_distribution.neutral_pct}%` }}
                                                className="bg-slate-400 h-full text-[9px] text-white font-bold flex items-center justify-center"
                                                title={`เป็นกลาง / ทั่วไป: ${sentimentData.sentiment_distribution.neutral_pct}%`}
                                            >
                                                {sentimentData.sentiment_distribution.neutral_pct > 10 ? `${sentimentData.sentiment_distribution.neutral_pct}%` : ''}
                                            </div>
                                            <div
                                                style={{ width: `${sentimentData.sentiment_distribution.negative_pct}%` }}
                                                className="bg-amber-500 h-full text-[9px] text-white font-bold flex items-center justify-center"
                                                title={`ข้อเสนอแนะเพื่อการพัฒนา: ${sentimentData.sentiment_distribution.negative_pct}%`}
                                            >
                                                {sentimentData.sentiment_distribution.negative_pct > 10 ? `${sentimentData.sentiment_distribution.negative_pct}%` : ''}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> เชิงบวก/ประทับใจ ({sentimentData.sentiment_distribution.positive_pct}%)</span>
                                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span> เป็นกลาง ({sentimentData.sentiment_distribution.neutral_pct}%)</span>
                                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> ข้อเสนอแนะเชิงพัฒนา ({sentimentData.sentiment_distribution.negative_pct}%)</span>
                                        </div>
                                    </div>
                                )}

                                {/* Executive Qualitative Summary */}
                                {sentimentData.executive_summary && (
                                    <div className="p-3.5 rounded-xl bg-white border border-indigo-100 text-slate-800 leading-relaxed shadow-2xs">
                                        <strong className="text-indigo-950 block mb-1">📝 สรุปข้อคิดเห็นเชิงคุณภาพสำหรับรายงาน บทที่ 4 และ 5:</strong>
                                        <p>{sentimentData.executive_summary}</p>
                                    </div>
                                )}

                                {/* Key Themes */}
                                {sentimentData.key_themes?.length > 0 && (
                                    <div>
                                        <strong className="text-slate-900 block mb-1.5">🎯 ประเด็นหลักที่ผู้เข้าร่วมกล่าวถึง (Key Themes):</strong>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {sentimentData.key_themes.map((theme, idx) => (
                                                <div key={idx} className="p-2.5 rounded-xl bg-white border border-purple-100 text-[11px]">
                                                    <div className="flex items-center justify-between font-bold text-purple-950">
                                                        <span>{theme.theme}</span>
                                                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px]">{theme.count} ความเห็น</span>
                                                    </div>
                                                    {theme.sample && (
                                                        <p className="text-slate-500 italic mt-1">"{theme.sample}"</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {(!comments || comments.length === 0) ? (
                            <p className="text-xs text-slate-400 py-6 text-center italic">
                                ยังไม่มีข้อเสนอแนะเพิ่มเติมจากผู้ตอบแบบประเมิน
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                                 {comments.map((sug, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                                        <p className="text-xs text-slate-800 italic leading-relaxed">
                                            "{sug}"
                                        </p>
                                        <span className="block text-[10px] font-bold text-purple-700">
                                            ผู้ตอบแบบประเมินคนที่ #{toArabicNumerals(i + 1)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
