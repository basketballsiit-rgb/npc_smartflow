import React, { useState, useRef } from 'react';
import SignaturePad from '@/Components/SignaturePad';
import { usePage, router } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function UpdateSignatureForm({ className = '' }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};
    const [currentSignature, setCurrentSignature] = useState(user.signature_data || null);
    const [activeTab, setActiveTab] = useState('live');
    const [uploadSignatureData, setUploadSignatureData] = useState(null);
    const [uploadFileName, setUploadFileName] = useState('');
    const [saving, setSaving] = useState(false);

    const padRef = useRef(null);
    const fileInputRef = useRef(null);

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

    const handleSave = async () => {
        let finalData = null;
        if (activeTab === 'live') {
            const dataUrl = padRef.current?.toDataURL();
            if (!dataUrl || padRef.current?.isEmpty()) {
                Swal.fire('กรุณาลงลายมือชื่อ', 'กรุณาวาดลายมือชื่อของท่านบนช่องเซ็นสดก่อนบันทึก', 'warning');
                return;
            }
            finalData = dataUrl;
        } else if (activeTab === 'upload') {
            if (!uploadSignatureData) {
                Swal.fire('กรุณาเลือกไฟล์', 'กรุณาเลือกไฟล์รูปภาพลายเซ็นก่อนบันทึก', 'warning');
                return;
            }
            finalData = uploadSignatureData;
        }

        try {
            setSaving(true);
            const res = await axios.post(route('profile.update_signature'), {
                signature_data: finalData,
            });

            if (res.data.success) {
                setCurrentSignature(finalData);
                Swal.fire({
                    title: '💾 บันทึกลายมือชื่อสำเร็จ!',
                    text: 'ลายมือชื่อของคุณได้รับการเข้ารหัสความปลอดภัยในระบบเรียบร้อยแล้ว พร้อมใช้งานในทุกขั้นตอนการอนุมัติ',
                    icon: 'success',
                    confirmButtonColor: '#7c3aed',
                });
                router.reload({ only: ['auth'] });
            }
        } catch (err) {
            console.error('Error saving signature:', err);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกลายมือชื่อได้ กรุณาลองใหม่อีกครั้ง', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        Swal.fire({
            title: 'ยืนยันลบลายมือชื่อประจำตัว?',
            text: 'ระบบจะลบข้อมูลลายเซ็นที่บันทึกไว้ ท่านจะต้องวาดหรืออัปโหลดใหม่ในครั้งต่อไป',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: '🗑️ ยืนยันลบ',
            cancelButtonText: 'ยกเลิก',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setSaving(true);
                    await axios.delete(route('profile.destroy_signature'));
                    setCurrentSignature(null);
                    setUploadSignatureData(null);
                    setUploadFileName('');
                    if (padRef.current) padRef.current.clear();
                    Swal.fire('ลบเรียบร้อย', 'ลบลายมือชื่อประจำตัวเรียบร้อยแล้ว', 'success');
                    router.reload({ only: ['auth'] });
                } catch (err) {
                    console.error('Error deleting signature:', err);
                    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบลายมือชื่อได้', 'error');
                } finally {
                    setSaving(false);
                }
            }
        });
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-lg font-extrabold text-purple-950 flex items-center gap-2">
                        <span>🔐</span>
                        <span>ลายมือชื่ออิเล็กทรอนิกส์ประจำตัว (Digital Signature)</span>
                    </h2>
                    <p className="mt-1 text-xs text-slate-600 max-w-2xl leading-relaxed">
                        บันทึกและเข้ารหัสลายมือชื่อของคุณ (AES-256) เพื่อใช้ในการลงนามอนุมัติโครงการ 6 ขั้นตอน และเอกสารต่างๆ ผ่านมือถือ ไอแพด หรือคอมพิวเตอร์ได้สะดวกรวดเร็วเพียง 1-Click โดยมีเพียงคุณผู้เป็นเจ้าของบัญชีเท่านั้นที่กดใช้ได้
                    </p>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-[11px] font-bold text-purple-900 shrink-0 w-fit">
                    <span>🛡️</span>
                    <span>เข้ารหัสความปลอดภัยระดับฐานข้อมูล</span>
                </div>
            </header>

            {/* Current Signature Display */}
            {currentSignature ? (
                <div className="rounded-2xl border-2 border-emerald-300 bg-linear-to-br from-emerald-50/50 via-teal-50/30 to-purple-50/30 p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-base">✅</span>
                            <div>
                                <h4 className="text-xs font-extrabold text-emerald-950">
                                    ลายมือชื่อประจำตัวปัจจุบัน (พร้อมใช้งาน 1-Click)
                                </h4>
                                <p className="text-[11px] text-emerald-800">
                                    เจ้าของลายมือชื่อ: {user.name} ({user.position || user.role_display || 'บุคลากร'})
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={saving}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-rose-600 text-xs font-bold border border-rose-200 hover:bg-rose-50 transition-all shadow-2xs"
                        >
                            🗑️ ลบลายเซ็น
                        </button>
                    </div>

                    <div className="h-32 bg-white rounded-xl border border-emerald-200 p-2 flex items-center justify-center shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>
                        <img 
                            src={currentSignature} 
                            alt="Current Signature" 
                            className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                        />
                        <div className="absolute bottom-1 right-2 text-[9px] text-slate-400 font-mono">
                            Verified Encrypted Signature • {user.name}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 flex items-center gap-3 text-xs text-amber-950">
                    <span className="text-xl">⚠️</span>
                    <div>
                        <p className="font-bold">ท่านยังไม่ได้บันทึกลายมือชื่อประจำตัว</p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                            กรุณาวาดลายมือชื่อสดผ่านหน้าจอ หรืออัปโหลดรูปภาพลายเซ็นด้านล่าง แล้วกดบันทึกข้อมูล
                        </p>
                    </div>
                </div>
            )}

            {/* Set / Change Signature Form */}
            <div className="rounded-2xl border border-purple-100 bg-slate-50/50 p-5 space-y-4">
                <h4 className="text-xs font-extrabold text-purple-950">
                    {currentSignature ? '🔄 ต้องการเปลี่ยนแปลงลายมือชื่อใหม่' : '✍️ บันทึกลายมือชื่อใหม่'}
                </h4>

                {/* Tabs */}
                <div className="flex rounded-2xl bg-slate-200/80 p-1 gap-1 border border-slate-300/80 max-w-md">
                    <button
                        type="button"
                        onClick={() => setActiveTab('live')}
                        className={`flex-1 py-1.5 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'live'
                                ? 'bg-white text-purple-900 shadow-sm border border-purple-200'
                                : 'text-slate-600 hover:text-purple-900'
                        }`}
                    >
                        <span>📱</span>
                        <span>เซ็นสด (iPad/มือถือ/เมาส์)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-1.5 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'upload'
                                ? 'bg-white text-purple-900 shadow-sm border border-purple-200'
                                : 'text-slate-600 hover:text-purple-900'
                        }`}
                    >
                        <span>📁</span>
                        <span>อัปโหลดรูปภาพ</span>
                    </button>
                </div>

                {/* Tab 1: Live Drawing */}
                {activeTab === 'live' && (
                    <div className="space-y-2 max-w-xl">
                        <SignaturePad 
                            ref={padRef} 
                            height={180}
                            strokeColor="#0f172a"
                            strokeWidth={2.8}
                        />
                    </div>
                )}

                {/* Tab 2: Upload */}
                {activeTab === 'upload' && (
                    <div className="space-y-3 max-w-xl">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-2xl border-2 border-dashed border-purple-200 bg-white hover:bg-purple-50/50 p-6 text-center cursor-pointer transition-all space-y-2 shadow-2xs"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/png, image/jpeg, image/jpg"
                                className="hidden"
                            />
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto text-lg">
                                🖼️
                            </div>
                            <h4 className="text-xs font-bold text-purple-950">
                                {uploadFileName ? `ไฟล์ที่เลือก: ${uploadFileName}` : 'คลิกเพื่อเลือกไฟล์รูปภาพลายเซ็น (PNG หรือ JPG)'}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                                แนะนำภาพพื้นหลังโปร่งใส (Transparent PNG) เพื่อความสวยงามเมื่อประทับลงบนเอกสาร
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
                    </div>
                )}

                {/* Save Button */}
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        <span>💾</span>
                        <span>{saving ? 'กำลังบันทึกลายเซ็น...' : 'บันทึกลายมือชื่อประจำตัว (เข้ารหัสความปลอดภัย)'}</span>
                    </button>
                </div>
            </div>
        </section>
    );
}
