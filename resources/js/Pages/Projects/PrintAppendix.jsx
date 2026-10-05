import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';

export default function PrintAppendix({ project }) {
    const [fontSizePreset, setFontSizePreset] = useState('normal');
    const [activeCoverModal, setActiveCoverModal] = useState(null); // 'front' | 'back' | null

    const appendices = project?.appendices || [];
    const photos = project?.photos || [];
    const survey = project?.survey;
    const procurement = project?.procurement;
    const approvals = project?.approvals || [];

    // Group appendices by category
    const byCategory = (cat) => appendices.filter(a => a.category === cat);
    const approvedProposalDoc = byCategory('approved_proposal')[0];
    const memoDocs = byCategory('memo_request');
    const procurementDocs = byCategory('procurement_loan');
    const surveyDocs = byCategory('evaluation_survey');
    const orderDocs = byCategory('official_order');
    const scheduleDocs = byCategory('schedule');
    const speechDocs = byCategory('speech');
    const certDocs = byCategory('certificate_sample');
    const otherDocs = byCategory('others');
    const frontCoverDoc = byCategory('front_cover')[0];
    const backCoverDoc = byCategory('back_cover')[0];

    // Standardize numerals to Arabic
    const toArabicNumerals = (val) => {
        if (val === null || val === undefined) return '';
        const map = { '๐':'0', '๑':'1', '๒':'2', '๓':'3', '๔':'4', '๕':'5', '๖':'6', '๗':'7', '๘':'8', '๙':'9' };
        return String(val).replace(/[๐-๙]/g, (digit) => map[digit] || digit);
    };

    const handlePrint = () => {
        window.print();
    };

    const fontStyles = {
        compact: { docSize: '14px', lineHeight: '1.6', titleSize: '20px', headingSize: '16px' },
        normal: { docSize: '15px', lineHeight: '1.68', titleSize: '22px', headingSize: '17px' },
        large: { docSize: '16.5px', lineHeight: '1.75', titleSize: '24px', headingSize: '18px' },
    }[fontSizePreset];

    // Survey evaluation URL & QR code
    const evaluationUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/surveys/${project?.id}/evaluate`
        : `/surveys/${project?.id}/evaluate`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(evaluationUrl)}`;

    // Group photos 2 per page for strict page budget
    const photoPairs = [];
    for (let i = 0; i < photos.length; i += 2) {
        photoPairs.push(photos.slice(i, i + 2));
    }

    // Export to Word
    const exportToWord = () => {
        const content = document.getElementById('printable-appendix-doc');
        if (!content) return;

        const clone = content.cloneNode(true);

        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office'
                  xmlns:w='urn:schemas-microsoft-com:office:word'
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>ภาคผนวก - ${project?.title || 'โครงการ'}</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 3.81cm 2.54cm 2.54cm 3.81cm;
                    }
                    body {
                        font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', 'Angsana New', sans-serif;
                        font-size: 16pt;
                        line-height: 1.5;
                        color: #000;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                    .photo-container {
                        text-align: center;
                        margin-bottom: 20pt;
                    }
                    .photo-container img {
                        max-width: 520px;
                        max-height: 340px;
                        border: 1px solid #ccc;
                    }
                    .caption {
                        font-size: 14pt;
                        font-weight: bold;
                        text-align: center;
                        margin-top: 5pt;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10pt 0;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 6pt;
                        font-size: 14pt;
                    }
                </style>
            </head>
            <body>
                ${clone.innerHTML}
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ภาคผนวก_${project?.title || 'โครงการ'}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900">
            <Head title={`ภาคผนวก - ${project?.title || 'โครงการ'}`} />

            {/* Print Header Controls (Hidden during printing) */}
            <header
                role="region"
                aria-label="แผงควบคุมการพิมพ์ภาคผนวก"
                className="no-print max-w-5xl mx-auto mb-6 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4 sticky top-4 z-40"
            >
                <div className="flex items-center gap-3">
                    <Link
                        href={route('dashboard', { tab: 'appendix' })}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition flex items-center gap-2 text-xs font-bold"
                        title="กลับสู่ศูนย์ควบคุมระบบ"
                    >
                        <span>⬅️ กลับสู่ระบบ</span>
                    </Link>
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            เอกสารราชการ • สอศ.
                        </span>
                        <h1 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
                            ภาคผนวก (Appendix): {project?.title || 'เอกสารโครงการ'}
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Cover Preview Buttons */}
                    {frontCoverDoc && (
                        <button
                            type="button"
                            onClick={() => setActiveCoverModal('front')}
                            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            title="ดูปกหน้าที่แนบไว้"
                        >
                            <span>📘 ดูปกหน้า</span>
                        </button>
                    )}
                    {backCoverDoc && (
                        <button
                            type="button"
                            onClick={() => setActiveCoverModal('back')}
                            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            title="ดูปกหลังที่แนบไว้"
                        >
                            <span>📙 ดูปกหลัง</span>
                        </button>
                    )}

                    {/* Font Size Presets */}
                    <div className="hidden sm:inline-flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setFontSizePreset('compact')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                fontSizePreset === 'compact' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            เล็ก (14px)
                        </button>
                        <button
                            type="button"
                            onClick={() => setFontSizePreset('normal')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                fontSizePreset === 'normal' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            ปกติ (15px)
                        </button>
                        <button
                            type="button"
                            onClick={() => setFontSizePreset('large')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                fontSizePreset === 'large' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            ใหญ่ (16.5px)
                        </button>
                    </div>

                    {/* Export Word Button */}
                    <button
                        type="button"
                        onClick={exportToWord}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                        <span>📄 ดาวน์โหลด Word</span>
                    </button>

                    {/* Print Button */}
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
                    >
                        <span>🖨️ สั่งพิมพ์ A4</span>
                    </button>
                </div>
            </header>

            {/* Printable Document A4 Canvas */}
            <main
                id="printable-appendix-doc"
                className="max-w-4xl mx-auto bg-white p-8 sm:p-14 md:p-16 shadow-lg border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none text-slate-900"
                style={{
                    fontFamily: "'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', sans-serif",
                    fontSize: fontStyles.docSize,
                    lineHeight: fontStyles.lineHeight,
                }}
            >
                {/* ========================================================
                    PAGE 1: แผ่นคั่นภาคผนวก (Appendix Section Title Page)
                   ======================================================== */}
                <div className="min-h-[750px] flex flex-col items-center justify-center text-center p-8 page-break">
                    <div className="space-y-4">
                        <h1
                            className="font-black text-slate-900 tracking-wider"
                            style={{ fontSize: '36px' }}
                        >
                            ภาคผนวก
                        </h1>
                        <p className="text-xl text-slate-700 font-bold">
                            (APPENDIX)
                        </p>
                        <div className="w-24 h-1 bg-purple-700 mx-auto rounded-full mt-4 print:bg-black"></div>
                        <p className="text-base text-slate-600 pt-8 max-w-xl mx-auto">
                            โครงการ: {project?.title || 'เอกสารสรุปผลการดำเนินโครงการ'}
                        </p>
                        <p className="text-sm text-slate-500">
                            {project?.department?.name || 'สถานศึกษา'} • ประจำปีงบประมาณ พ.ศ. {toArabicNumerals(project?.academic_year || '2567')}
                        </p>
                    </div>
                </div>

                {/* ========================================================
                    SECTION 1: ภาคผนวก ก - เอกสารโครงการที่อนุมัติ & บันทึกข้อความ
                   ======================================================== */}
                <div className="page-break pt-8">
                    <div className="text-center mb-6">
                        <h2 className="font-black text-slate-900" style={{ fontSize: fontStyles.titleSize }}>
                            ภาคผนวก ก
                        </h2>
                        <h3 className="font-bold text-slate-800" style={{ fontSize: fontStyles.headingSize }}>
                            เอกสารแบบเสนอโครงการที่ได้รับอนุมัติ และบันทึกข้อความขอดำเนินโครงการ
                        </h3>
                    </div>

                    {/* Official Proposal Summary Box */}
                    <div className="border border-slate-300 rounded-xl p-5 mb-6 bg-slate-50/50 print:bg-white">
                        <h4 className="font-bold text-slate-900 mb-3 border-b pb-2 text-base flex items-center justify-between">
                            <span>1. ข้อมูลการอนุมัติแบบเสนอโครงการ (ฉบับเต็ม)</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                อนุมัติอย่างเป็นทางการ
                            </span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <p><strong className="text-slate-800">ชื่อโครงการ:</strong> {project?.title}</p>
                            <p><strong className="text-slate-800">ปีการศึกษา:</strong> {toArabicNumerals(project?.academic_year)}</p>
                            <p><strong className="text-slate-800">ผู้รับผิดชอบ:</strong> {project?.responsible_person || project?.user?.name}</p>
                            <p><strong className="text-slate-800">หน่วยงาน/แผนก:</strong> {project?.department?.name}</p>
                            <p><strong className="text-slate-800">งบประมาณที่จัดสรร:</strong> {new Intl.NumberFormat('th-TH').format(project?.allocated_budget || project?.approved_budget || 0)} บาท</p>
                            <p><strong className="text-slate-800">แหล่งงบประมาณ:</strong> {project?.funding_source?.name || 'งบประมาณสถานศึกษา'}</p>
                            {project?.digital_seal_hash && (
                                <p className="col-span-1 sm:col-span-2 text-xs text-slate-600 break-all">
                                    <strong className="text-slate-800">รหัสยืนยันตราประทับดิจิทัล:</strong> {project.digital_seal_hash}
                                </p>
                            )}
                        </div>

                        {/* Approvers list */}
                        {approvals.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-slate-200">
                                <p className="font-bold text-xs text-slate-700 mb-2">ลำดับการพิจารณาและลงนามอนุมัติ:</p>
                                <div className="space-y-1.5 text-xs text-slate-600">
                                    {approvals.map((app, idx) => (
                                        <div key={app.id || idx} className="flex items-center justify-between">
                                            <span>
                                                {toArabicNumerals(idx + 1)}. {app.user_name || app.user?.name} ({app.user_position || app.user?.position || 'ผู้มีอำนาจลงนาม'})
                                            </span>
                                            <span className="font-bold text-emerald-700">✓ อนุมัติแล้ว ({app.date || app.created_at})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Uploaded Signed Proposal or Memo Documents */}
                    {approvedProposalDoc && (
                        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 mb-4 print:border-slate-300">
                            <p className="font-bold text-sm text-purple-950 mb-1">
                                📎 เอกสารแนบ: {approvedProposalDoc.title}
                            </p>
                            <p className="text-xs text-slate-500">
                                ไฟล์เอกสาร: {approvedProposalDoc.file_type?.toUpperCase()} ({Math.round(approvedProposalDoc.file_size / 1024)} KB)
                            </p>
                        </div>
                    )}

                    {memoDocs.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-bold text-slate-900 mb-2 text-sm">2. บันทึกข้อความขอดำเนินโครงการ</h4>
                            <div className="space-y-2">
                                {memoDocs.map(doc => (
                                    <div key={doc.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                                        <p className="font-bold text-sm text-slate-800">📄 {doc.title}</p>
                                        {doc.caption && <p className="text-xs text-slate-600 mt-0.5">{doc.caption}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {orderDocs.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-bold text-slate-900 mb-2 text-sm">3. คำสั่งแต่งตั้งคณะกรรมการดำเนินงานโครงการ</h4>
                            <div className="space-y-2">
                                {orderDocs.map(doc => (
                                    <div key={doc.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                                        <p className="font-bold text-sm text-slate-800">📜 {doc.title}</p>
                                        {doc.caption && <p className="text-xs text-slate-600 mt-0.5">{doc.caption}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ========================================================
                    SECTION 2: ภาคผนวก ข - แบบประเมินของโครงการ (QR CODE & LINK)
                   ======================================================== */}
                <div className="page-break pt-8">
                    <div className="text-center mb-6">
                        <h2 className="font-black text-slate-900" style={{ fontSize: fontStyles.titleSize }}>
                            ภาคผนวก ข
                        </h2>
                        <h3 className="font-bold text-slate-800" style={{ fontSize: fontStyles.headingSize }}>
                            แบบประเมินความพึงพอใจต่อการดำเนินงานโครงการ
                        </h3>
                    </div>

                    <div className="border border-slate-300 rounded-2xl p-8 bg-slate-50/30 print:bg-white text-center max-w-xl mx-auto my-6">
                        <h4 className="font-black text-slate-900 text-base mb-2">
                            แบบประเมินความพึงพอใจระบบออนไลน์ (Online Survey)
                        </h4>
                        <p className="text-sm text-slate-600 mb-6">
                            สแกน QR Code เพื่อเข้าทำแบบประเมินความพึงพอใจโครงการ "{project?.title}"
                        </p>

                        {/* Crisp QR Code */}
                        <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border border-slate-200 mb-4 print:shadow-none">
                            <img
                                src={qrCodeUrl}
                                alt="QR Code แบบประเมินความพึงพอใจโครงการ"
                                className="w-52 h-52 object-contain mx-auto"
                            />
                        </div>

                        {/* URL Link Displayed Clearly Below as Requested */}
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-xs font-bold text-slate-700 mb-1">
                                หรือเข้าทำแบบประเมินผ่านลิงก์เว็บไซต์:
                            </p>
                            <p className="text-xs font-mono text-purple-700 underline break-all font-bold">
                                {evaluationUrl}
                            </p>
                        </div>
                    </div>

                    {surveyDocs.length > 0 && (
                        <div className="mt-6">
                            <h4 className="font-bold text-slate-900 mb-2 text-sm">เอกสารแบบสอบถามประกอบเพิ่มเติม:</h4>
                            <div className="space-y-2">
                                {surveyDocs.map(doc => (
                                    <div key={doc.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                                        <p className="font-bold text-sm text-slate-800">📋 {doc.title}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ========================================================
                    SECTION 3: ภาคผนวก ค - เอกสารชุดจัดซื้อจัดจ้าง / สัญญายืมเงิน
                   ======================================================== */}
                <div className="page-break pt-8">
                    <div className="text-center mb-6">
                        <h2 className="font-black text-slate-900" style={{ fontSize: fontStyles.titleSize }}>
                            ภาคผนวก ค
                        </h2>
                        <h3 className="font-bold text-slate-800" style={{ fontSize: fontStyles.headingSize }}>
                            เอกสารการเงิน ชุดขอซื้อขอจ้าง และสัญญายืมเงิน
                        </h3>
                    </div>

                    {/* Procurement & Budget Summary from System */}
                    <div className="border border-slate-300 rounded-xl p-5 mb-6 bg-slate-50/50 print:bg-white">
                        <h4 className="font-bold text-slate-900 mb-3 border-b pb-2 text-base">
                            ข้อมูลสรุปการจัดซื้อจัดจ้างและการเบิกจ่ายงบประมาณ (ดึงจากระบบ)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <p><strong className="text-slate-800">ประเภทงบประมาณ:</strong> {project?.budget?.funding_source?.name || 'งบประมาณตามแผนปฏิบัติการ'}</p>
                            <p><strong className="text-slate-800">วงเงินที่ได้รับจัดสรร:</strong> {new Intl.NumberFormat('th-TH').format(project?.allocated_budget || 0)} บาท</p>
                            <p><strong className="text-slate-800">สถานะชุดจัดซื้อ:</strong> {procurement ? 'มีรายการขอซื้อขอจ้างในระบบ' : 'เบิกจ่ายตามระเบียบพัสดุ'}</p>
                            <p><strong className="text-slate-800">จำนวนรายการพัสดุ:</strong> {toArabicNumerals(procurement?.items?.length || 0)} รายการ</p>
                        </div>

                        {procurement?.items && procurement.items.length > 0 && (
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-xs border border-slate-300">
                                    <thead>
                                        <tr className="bg-slate-100 font-bold text-slate-800">
                                            <th className="border p-2 text-center w-12">ลำดับ</th>
                                            <th className="border p-2 text-left">รายการ</th>
                                            <th className="border p-2 text-center w-20">จำนวน</th>
                                            <th className="border p-2 text-center w-20">หน่วยนับ</th>
                                            <th className="border p-2 text-right w-28">ราคาต่อหน่วย</th>
                                            <th className="border p-2 text-right w-32">จำนวนเงิน (บาท)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {procurement.items.map((it, idx) => (
                                            <tr key={it.id || idx}>
                                                <td className="border p-1.5 text-center">{toArabicNumerals(idx + 1)}</td>
                                                <td className="border p-1.5">{it.description}</td>
                                                <td className="border p-1.5 text-center">{toArabicNumerals(it.quantity)}</td>
                                                <td className="border p-1.5 text-center">{it.unit}</td>
                                                <td className="border p-1.5 text-right">{new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(it.unit_price)}</td>
                                                <td className="border p-1.5 text-right">{new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(it.total_price)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {procurementDocs.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-bold text-slate-900 mb-2 text-sm">เอกสารหลักฐานทางการเงินที่แนบเพิ่มเติม:</h4>
                            <div className="space-y-2">
                                {procurementDocs.map(doc => (
                                    <div key={doc.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                                        <p className="font-bold text-sm text-slate-800">💼 {doc.title}</p>
                                        {doc.caption && <p className="text-xs text-slate-600 mt-0.5">{doc.caption}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ========================================================
                    SECTION 4: ภาคผนวก ง - ภาพกิจกรรมการดำเนินโครงการ
                    (จัดวางหน้าละ 2 ภาพ พร้อมคำบรรยายใต้ภาพอย่างชัดเจน)
                   ======================================================== */}
                <div className="page-break pt-8">
                    <div className="text-center mb-6">
                        <h2 className="font-black text-slate-900" style={{ fontSize: fontStyles.titleSize }}>
                            ภาคผนวก ง
                        </h2>
                        <h3 className="font-bold text-slate-800" style={{ fontSize: fontStyles.headingSize }}>
                            ภาพกิจกรรมการดำเนินงานโครงการ
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            (รวมทั้งสิ้น {toArabicNumerals(photos.length)} ภาพ • จัดวางหน้าละ 2 ภาพ เพื่อความคมชัดตามมาตรฐานรายงาน)
                        </p>
                    </div>

                    {photos.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl my-8">
                            <span className="text-3xl block mb-2">📸</span>
                            <p className="text-slate-500 font-bold">ยังไม่มีการอัพโหลดภาพกิจกรรม</p>
                            <p className="text-xs text-slate-400 mt-1">
                                ท่านสามารถอัพโหลดภาพกิจกรรมอย่างน้อย 6 ภาพได้ที่แท็บภาคผนวกในระบบ
                            </p>
                        </div>
                    ) : (
                        photoPairs.map((pair, pageIdx) => (
                            <div
                                key={`photo-page-${pageIdx}`}
                                className={pageIdx > 0 ? 'page-break pt-8' : ''}
                            >
                                <div className="space-y-8">
                                    {pair.map((photo, pIdx) => {
                                        const globalIndex = pageIdx * 2 + pIdx + 1;
                                        return (
                                            <div
                                                key={photo.id || globalIndex}
                                                className="photo-container flex flex-col items-center justify-center text-center p-2"
                                            >
                                                {/* Image Frame - Large, Crisp, 2 per page */}
                                                <div className="w-full max-w-[560px] h-[310px] bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-300 shadow-sm flex items-center justify-center print:shadow-none print:border-slate-400">
                                                    <img
                                                        src={photo.photo_url || `/storage/${photo.photo_path}`}
                                                        alt={photo.caption || `ภาพกิจกรรมที่ ${globalIndex}`}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                </div>
                                                {/* Caption Under Photo */}
                                                <p className="caption mt-2.5 font-bold text-slate-800 text-sm max-w-lg leading-relaxed">
                                                    {photo.caption
                                                        ? (photo.caption.startsWith('ภาพที่') ? photo.caption : `ภาพที่ ${toArabicNumerals(globalIndex)}: ${photo.caption}`)
                                                        : `ภาพที่ ${toArabicNumerals(globalIndex)}: กิจกรรมการดำเนินโครงการ ${project?.title}`}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ========================================================
                    SECTION 5: ภาคผนวก จ - กำหนดการ คำกล่าว เกียรติบัตร & อื่น ๆ
                   ======================================================== */}
                <div className="page-break pt-8">
                    <div className="text-center mb-6">
                        <h2 className="font-black text-slate-900" style={{ fontSize: fontStyles.titleSize }}>
                            ภาคผนวก จ
                        </h2>
                        <h3 className="font-bold text-slate-800" style={{ fontSize: fontStyles.headingSize }}>
                            กำหนดการ คำกล่าว เกียรติบัตร และเอกสารหลักฐานอื่น ๆ
                        </h3>
                    </div>

                    <div className="space-y-6">
                        {/* Schedule */}
                        {scheduleDocs.length > 0 && (
                            <div className="p-4 rounded-xl border border-slate-200 bg-white">
                                <h4 className="font-bold text-slate-900 mb-2 text-sm">📅 กำหนดการดำเนินโครงการ</h4>
                                <div className="space-y-1.5">
                                    {scheduleDocs.map(doc => (
                                        <p key={doc.id} className="text-xs text-slate-700">
                                            • {doc.title} {doc.caption && `(${doc.caption})`}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Speeches */}
                        {speechDocs.length > 0 && (
                            <div className="p-4 rounded-xl border border-slate-200 bg-white">
                                <h4 className="font-bold text-slate-900 mb-2 text-sm">🎤 คำกล่าวพิธีเปิด / พิธีปิด</h4>
                                <div className="space-y-1.5">
                                    {speechDocs.map(doc => (
                                        <p key={doc.id} className="text-xs text-slate-700">
                                            • {doc.title} {doc.caption && `(${doc.caption})`}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Certificates */}
                        {certDocs.length > 0 && (
                            <div className="p-4 rounded-xl border border-slate-200 bg-white">
                                <h4 className="font-bold text-slate-900 mb-2 text-sm">🏆 ตัวอย่างเกียรติบัตร</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                    {certDocs.map(doc => (
                                        <div key={doc.id} className="border border-slate-200 rounded-lg p-2 text-center">
                                            {doc.file_type && ['jpg','jpeg','png','webp'].includes(doc.file_type) ? (
                                                <img
                                                    src={doc.file_url}
                                                    alt={doc.title}
                                                    className="w-full h-36 object-contain rounded mb-1 bg-slate-50"
                                                />
                                            ) : (
                                                <span className="text-2xl block my-2">📄</span>
                                            )}
                                            <p className="text-xs font-bold text-slate-800">{doc.title}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Other Documents */}
                        {otherDocs.length > 0 && (
                            <div className="p-4 rounded-xl border border-slate-200 bg-white">
                                <h4 className="font-bold text-slate-900 mb-2 text-sm">📁 เอกสารและหลักฐานอื่น ๆ</h4>
                                <div className="space-y-1.5">
                                    {otherDocs.map(doc => (
                                        <p key={doc.id} className="text-xs text-slate-700">
                                            • {doc.title} {doc.caption && `(${doc.caption})`}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal to Preview Front / Back Covers */}
            {activeCoverModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print">
                    <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                            <h3 className="font-bold text-slate-900 text-base">
                                {activeCoverModal === 'front' ? '📘 ปกหน้ารายงานโครงการ' : '📙 ปกหลังรายงานโครงการ'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActiveCoverModal(null)}
                                className="text-slate-400 hover:text-slate-600 font-bold p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="py-4 flex-1 overflow-y-auto text-center">
                            {activeCoverModal === 'front' && frontCoverDoc && (
                                frontCoverDoc.file_type && ['jpg','jpeg','png','webp'].includes(frontCoverDoc.file_type) ? (
                                    <img
                                        src={frontCoverDoc.file_url}
                                        alt="ปกหน้า"
                                        className="max-h-[60vh] mx-auto rounded-lg shadow-sm border"
                                    />
                                ) : (
                                    <div className="p-8 bg-slate-50 rounded-xl">
                                        <p className="font-bold text-slate-700 mb-2">ไฟล์เอกสารปกหน้า: {frontCoverDoc.title}</p>
                                        <a
                                            href={frontCoverDoc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold inline-block"
                                        >
                                            เปิดดูไฟล์ PDF ปกหน้า
                                        </a>
                                    </div>
                                )
                            )}

                            {activeCoverModal === 'back' && backCoverDoc && (
                                backCoverDoc.file_type && ['jpg','jpeg','png','webp'].includes(backCoverDoc.file_type) ? (
                                    <img
                                        src={backCoverDoc.file_url}
                                        alt="ปกหลัง"
                                        className="max-h-[60vh] mx-auto rounded-lg shadow-sm border"
                                    />
                                ) : (
                                    <div className="p-8 bg-slate-50 rounded-xl">
                                        <p className="font-bold text-slate-700 mb-2">ไฟล์เอกสารปกหลัง: {backCoverDoc.title}</p>
                                        <a
                                            href={backCoverDoc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold inline-block"
                                        >
                                            เปิดดูไฟล์ PDF ปกหลัง
                                        </a>
                                    </div>
                                )
                            )}
                        </div>

                        <div className="pt-3 border-t border-slate-200 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setActiveCoverModal(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
