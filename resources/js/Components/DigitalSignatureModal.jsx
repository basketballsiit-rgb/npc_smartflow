import React, { useState, useRef, useEffect } from 'react';
import SignaturePad from '@/Components/SignaturePad';
import { usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function DigitalSignatureModal({
    isOpen,
    onClose,
    onConfirm,
    stepNumber = 1,
    stepTitle = '',
    projectTitle = '',
    defaultComments = '',
    fundingSources = [],
    allocatedAmount = '',
    fundingSourceId = '',
    processing = false,
}) {
    const { auth } = usePage().props;
    const user = auth?.user || {};
    const hasStoredSignature = Boolean(user.has_signature && user.signature_data);

    const [activeTab, setActiveTab] = useState(hasStoredSignature ? 'stored' : 'live');
    const [liveSignatureData, setLiveSignatureData] = useState(null);
    const [uploadSignatureData, setUploadSignatureData] = useState(null);
    const [uploadFileName, setUploadFileName] = useState('');
    const [saveToProfile, setSaveToProfile] = useState(false);
    const [comments, setComments] = useState(defaultComments || '');

    // For Step 3 planning budget
    const [selectedFundingId, setSelectedFundingId] = useState(fundingSourceId || (fundingSources?.[0]?.id || ''));
    const [selectedAllocatedAmount, setSelectedAllocatedAmount] = useState(allocatedAmount || '');

    const padRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(hasStoredSignature ? 'stored' : 'live');
            setComments(defaultComments || '');
            setSaveToProfile(false);
            setLiveSignatureData(null);
            setUploadSignatureData(null);
            setUploadFileName('');
            if (padRef.current) {
                padRef.current.clear();
            }
        }
    }, [isOpen, hasStoredSignature, defaultComments]);

    if (!isOpen) return null;

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Swal.fire('รูปแบบไฟล์ไม่ถูกต้อง', 'กรุณาอัปโหลดไฟล์รูปภาพ เช่น PNG หรือ JPG', 'warning');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            Swal.fire('ไฟล์มีขนาดใหญ่เกินไป', 'ขนาดไฟล์สูงสุดไม่เกิน 2MB', 'warning');
            return;
        }

        setUploadFileName(file.name);
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
            setUploadSignatureData(uploadEvent.target?.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = () => {
        let finalSignature = null;
        let finalType = activeTab;

        if (activeTab === 'stored') {
            if (!hasStoredSignature) {
                Swal.fire('ไม่พบลายเซ็นประจำตัว', 'กรุณาเลือกเซ็นสดผ่านหน้าจอ หรืออัปโหลดไฟล์รูปภาพลายเซ็น', 'warning');
                return;
            }
            finalSignature = user.signature_data;
        } else if (activeTab === 'live') {
            const dataUrl = padRef.current?.toDataURL();
            if (!dataUrl || padRef.current?.isEmpty()) {
                Swal.fire('กรุณาลงลายมือชื่อ', 'กรุณาวาดลายมือชื่อของท่านบนช่องเซ็นสดก่อนยืนยัน', 'warning');
                return;
            }
            finalSignature = dataUrl;
        } else if (activeTab === 'upload') {
            if (!uploadSignatureData) {
                Swal.fire('กรุณาเลือกไฟล์', 'กรุณาเลือกไฟล์รูปภาพลายเซ็นของท่านก่อนยืนยัน', 'warning');
                return;
            }
            finalSignature = uploadSignatureData;
        }

        onConfirm({
            signature_data: finalSignature,
            signature_type: finalType,
            save_to_profile: saveToProfile,
            comments: comments,
            funding_source_id: selectedFundingId,
            allocated_amount: selectedAllocatedAmount,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden my-auto max-h-[95vh] flex flex-col font-sans">
                
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-5 text-white flex items-start justify-between relative shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shadow-inner">
                            ✍️
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/40 text-[11px] font-bold text-purple-200 uppercase tracking-wider mb-1">
                                <span>🔒</span>
                                <span>ระบบลงนามอิเล็กทรอนิกส์ (ขั้นตอนที่ {stepNumber})</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black leading-tight text-white">
                                {stepTitle || `การลงนามอนุมัติขั้นตอนที่ ${stepNumber}`}
                            </h3>
                            <p className="text-xs text-purple-200 mt-0.5 line-clamp-1 max-w-md">
                                โครงการ: {projectTitle}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
                    >
                        ✕
                    </button>
                </div>

                {/* Signer Identity Bar */}
                <div className="bg-purple-50/70 border-b border-purple-100 px-6 py-2.5 flex items-center justify-between text-xs text-purple-950 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-bold">ผู้ลงนาม:</span>
                        <span>{user.name}</span>
                        <span className="text-purple-600">({user.position || user.role_display || 'เจ้าหน้าที่'})</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-[11px] text-purple-600">
                        <span>🛡️ ตรวจสอบสิทธิ์ตัวตนเรียบร้อย</span>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1">
                    
                    {/* 3 Signing Modes Navigation Tabs */}
                    <div className="flex rounded-2xl bg-slate-100 p-1 gap-1 border border-slate-200/80">
                        <button
                            type="button"
                            onClick={() => setActiveTab('stored')}
                            className={`flex-1 py-2 px-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'stored'
                                    ? 'bg-white text-purple-900 shadow-sm border border-purple-200'
                                    : 'text-slate-600 hover:text-purple-900'
                            }`}
                        >
                            <span>🔐</span>
                            <span>ลายเซ็นประจำตัว</span>
                            {hasStoredSignature && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('live')}
                            className={`flex-1 py-2 px-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'live'
                                    ? 'bg-white text-purple-900 shadow-sm border border-purple-200'
                                    : 'text-slate-600 hover:text-purple-900'
                            }`}
                        >
                            <span>📱</span>
                            <span>เซ็นสด (iPad/มือถือ)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('upload')}
                            className={`flex-1 py-2 px-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'upload'
                                    ? 'bg-white text-purple-900 shadow-sm border border-purple-200'
                                    : 'text-slate-600 hover:text-purple-900'
                            }`}
                        >
                            <span>📁</span>
                            <span>อัปโหลดรูปภาพ</span>
                        </button>
                    </div>

                    {/* Tab 1: Stored Encrypted Signature */}
                    {activeTab === 'stored' && (
                        <div className="space-y-3">
                            {hasStoredSignature ? (
                                <div className="rounded-2xl border-2 border-emerald-300 bg-linear-to-br from-emerald-50/50 via-teal-50/30 to-purple-50/30 p-5 space-y-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-base">🛡️</span>
                                            <div>
                                                <h4 className="text-xs font-extrabold text-emerald-950">
                                                    ลายมือชื่อประจำตัวที่เข้ารหัสความปลอดภัย (AES-256)
                                                </h4>
                                                <p className="text-[11px] text-emerald-800">
                                                    ผู้เป็นเจ้าของบัญชี ({user.name}) เท่านั้นที่สามารถกดใช้เพื่อลงนามได้
                                                </p>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                                            พร้อมใช้งาน (1-Click)
                                        </span>
                                    </div>

                                    {/* Preview Box */}
                                    <div className="h-32 bg-white rounded-xl border border-emerald-200 p-2 flex items-center justify-center shadow-inner relative overflow-hidden">
                                        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>
                                        <img 
                                            src={user.signature_data} 
                                            alt="Saved Signature" 
                                            className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                                        />
                                        <div className="absolute bottom-1 right-2 text-[9px] text-slate-400 font-mono">
                                            Verified Signature • {user.name}
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                                        💡 <b>สะดวกรวดเร็ว:</b> เพียงกดปุ่ม "ยืนยันการลงนาม" ด้านล่าง ระบบจะประทับลายมือชื่อพร้อมเวลาและรหัส Hash ป้องกันการแก้ไขให้อัตโนมัติทันที
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-6 text-center space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto text-xl">
                                        🖋️
                                    </div>
                                    <h4 className="text-sm font-bold text-purple-950">ยังไม่มีลายมือชื่อประจำตัวในระบบ</h4>
                                    <p className="text-xs text-purple-800 max-w-sm mx-auto leading-relaxed">
                                        คุณสามารถเลือกแท็บ <b>"เซ็นสด (iPad/มือถือ)"</b> หรือ <b>"อัปโหลดรูปภาพ"</b> แล้วติ๊กเลือก <i>บันทึกเป็นลายเซ็นประจำตัว</i> เพื่อให้ระบบจำไว้ใช้ในครั้งต่อไปได้ทันที
                                    </p>
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('live')}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-sm hover:bg-purple-700 transition-all"
                                        >
                                            📱 สลับไปเซ็นสดผ่านหน้าจอ ➜
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Live Screen Drawing */}
                    {activeTab === 'live' && (
                        <div className="space-y-3">
                            <SignaturePad 
                                ref={padRef} 
                                height={200}
                                strokeColor="#0f172a"
                                strokeWidth={2.8}
                                onChange={(data) => setLiveSignatureData(data)}
                            />

                            {/* Checkbox to save to profile */}
                            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={saveToProfile}
                                    onChange={(e) => setSaveToProfile(e.target.checked)}
                                    className="rounded border-purple-300 text-purple-600 shadow-2xs focus:ring-purple-500"
                                />
                                <span className="text-xs font-medium text-purple-950">
                                    💾 บันทึกลายมือชื่อนี้เป็น <b>ลายเซ็นประจำตัวของฉัน</b> เพื่อความสะดวกในการใช้งานครั้งต่อไป (เข้ารหัสความปลอดภัย)
                                </span>
                            </label>
                        </div>
                    )}

                    {/* Tab 3: Upload Image File */}
                    {activeTab === 'upload' && (
                        <div className="space-y-3">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 hover:bg-purple-50/70 p-6 text-center cursor-pointer transition-all space-y-2"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="image/png, image/jpeg, image/jpg"
                                    className="hidden"
                                />
                                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto text-xl">
                                    🖼️
                                </div>
                                <h4 className="text-xs font-bold text-purple-950">
                                    {uploadFileName ? `ไฟล์ที่เลือก: ${uploadFileName}` : 'คลิกเพื่อเลือกไฟล์รูปภาพลายเซ็น (PNG หรือ JPG)'}
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                    แนะนำใช้ไฟล์รูปภาพลายเซ็นที่มีพื้นหลังโปร่งใส (Transparent PNG) ความละเอียดชัดเจน ขนาดไม่เกิน 2MB
                                </p>
                            </div>

                            {uploadSignatureData && (
                                <div className="h-28 bg-white rounded-xl border border-purple-200 p-2 flex items-center justify-center shadow-inner relative">
                                    <img 
                                        src={uploadSignatureData} 
                                        alt="Uploaded Signature" 
                                        className="max-h-full max-w-full object-contain"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setUploadSignatureData(null); setUploadFileName(''); }}
                                        className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-200"
                                    >
                                        ลบไฟล์
                                    </button>
                                </div>
                            )}

                            {/* Checkbox to save to profile */}
                            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={saveToProfile}
                                    onChange={(e) => setSaveToProfile(e.target.checked)}
                                    className="rounded border-purple-300 text-purple-600 shadow-2xs focus:ring-purple-500"
                                />
                                <span className="text-xs font-medium text-purple-950">
                                    💾 บันทึกลายมือชื่อนี้เป็น <b>ลายเซ็นประจำตัวของฉัน</b> เพื่อความสะดวกในการใช้งานครั้งต่อไป (เข้ารหัสความปลอดภัย)
                                </span>
                            </label>
                        </div>
                    )}

                    {/* Step 3 Extra Fields: Budget Allocation for Planning Department */}
                    {stepNumber === 3 && fundingSources && fundingSources.length > 0 && (
                        <div className="bg-purple-100/70 p-4 rounded-2xl border border-purple-200 space-y-3 font-sans">
                            <div className="flex items-center gap-2 text-purple-950 font-extrabold text-xs">
                                <span>💰</span>
                                <span>จัดสรรงบประมาณโครงการ (งานแผนงาน)</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-purple-900 mb-1">หมวดแหล่งเงินงบประมาณ</label>
                                    <select
                                        value={selectedFundingId}
                                        onChange={(e) => setSelectedFundingId(e.target.value)}
                                        className="w-full rounded-xl border-purple-200 text-xs font-medium focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        {fundingSources.map((fs) => {
                                            const displayName = (fs.name?.includes('สถานศึกษา') || fs.name?.includes('Revenue') || fs.name?.includes('บำรุงการศึกษา') || fs.name?.includes('บกศ')) ? 'บกศ.' : fs.name;
                                            return (
                                                <option key={fs.id} value={fs.id}>
                                                    {displayName} (คงเหลือ {new Intl.NumberFormat('th-TH').format((fs.total_budget || 0) - (fs.encumbered_budget || 0))} บาท)
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-purple-900 mb-1">วงเงินอนุมัติจัดสรรจริง (บาท)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={selectedAllocatedAmount}
                                        onChange={(e) => setSelectedAllocatedAmount(e.target.value)}
                                        className="w-full rounded-xl border-purple-200 text-xs font-bold text-emerald-700 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Comments & Directive Notes */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            💬 ข้อคิดเห็น / คำสั่งการพิจารณา (ระบุเพิ่มเติมได้)
                        </label>
                        <textarea
                            rows={2}
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="ระบุข้อคิดเห็น คำสั่งการ หรือความเห็นชอบโครงการ..."
                            className="w-full rounded-xl border-slate-200 shadow-2xs text-xs focus:ring-purple-500 focus:border-purple-500"
                        ></textarea>
                    </div>

                    {/* Legal Digital Integrity Seal */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center gap-3 text-[11px] text-slate-600">
                        <span className="text-xl">📜</span>
                        <div className="leading-relaxed">
                            ระบบจะประทับตราเวลาดิจิทัล (Digital Timestamp) พร้อมบันทึก IP Address และรหัสยืนยันความถูกต้อง (Verification Hash) เพื่อป้องกันการปลอมแปลงเอกสารตาม พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์
                        </div>
                    </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all shadow-2xs"
                    >
                        ยกเลิก
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white text-xs font-extrabold shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                    >
                        <span>✍️</span>
                        <span>{processing ? 'กำลังบันทึกการลงนาม...' : 'ยืนยันการลงนามอิเล็กทรอนิกส์'}</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
