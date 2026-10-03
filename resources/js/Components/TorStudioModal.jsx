import React, { useState } from 'react';

export default function TorStudioModal({ isOpen, onClose, onApplySpec, defaultItemName = '', defaultBudget = 0 }) {
    const [mode, setMode] = useState('draft'); // 'draft' | 'check'
    const [itemName, setItemName] = useState(defaultItemName);
    const [category, setCategory] = useState('ครุภัณฑ์การศึกษา');
    const [estimatedPrice, setEstimatedPrice] = useState(defaultBudget);
    const [requirements, setRequirements] = useState('');
    const [torTextToCheck, setTorTextToCheck] = useState('');

    const [loading, setLoading] = useState(false);
    const [draftedTor, setDraftedTor] = useState(null);
    const [complianceResult, setComplianceResult] = useState(null);

    if (!isOpen) return null;

    const handleDraftTor = async (e) => {
        e.preventDefault();
        setLoading(true);
        setDraftedTor(null);

        try {
            const res = await axios.post(route('procurements.ai.draft_tor'), {
                item_name: itemName,
                category: category,
                estimated_price: estimatedPrice,
                requirements: requirements.split('\n').filter(r => r.trim() !== '')
            });
            setDraftedTor(res.data);
        } catch (err) {
            console.error('Draft TOR error:', err);
            alert('เกิดข้อผิดพลาดในการเรียก AI ร่าง TOR กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckCompliance = async (e) => {
        e.preventDefault();
        setLoading(true);
        setComplianceResult(null);

        try {
            const res = await axios.post(route('procurements.ai.check_tor'), {
                tor_text: torTextToCheck
            });
            setComplianceResult(res.data);
        } catch (err) {
            console.error('Check compliance error:', err);
            alert('เกิดข้อผิดพลาดในการตรวจสอบสเปก กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    };

    const applyDraftToProcurement = () => {
        if (!draftedTor) return;
        const specSummary = draftedTor.specifications?.map(s => `${s.label}: ${s.details}`).join('\n') || '';
        const fullText = `${draftedTor.title}\n\nวัตถุประสงค์: ${draftedTor.purpose}\n\nรายละเอียดคุณลักษณะ:\n${specSummary}\n\nการรับประกัน: ${draftedTor.warranty}\nกำหนดส่งมอบ: ${draftedTor.delivery_days} วัน\nเกณฑ์ตรวจรับ: ${draftedTor.testing_and_acceptance}`;

        if (onApplySpec) {
            onApplySpec(fullText);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="text-2xl">🤖</span>
                        <div>
                            <h3 className="text-base font-black">
                                AI-Assisted TOR Studio & Compliance Checker
                            </h3>
                            <p className="text-[11px] text-purple-200/80">
                                ร่างและตรวจสอบคุณลักษณะเฉพาะ (TOR) ให้สอดคล้องกับระเบียบพัสดุภาครัฐ พ.ศ. 2560
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-300 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                {/* Sub-tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
                    <button
                        type="button"
                        onClick={() => setMode('draft')}
                        className={`pb-2.5 px-4 text-xs font-black border-b-2 transition ${
                            mode === 'draft'
                                ? 'border-purple-600 text-purple-950 bg-white rounded-t-xl shadow-2xs'
                                : 'border-transparent text-slate-500 hover:text-purple-700'
                        }`}
                    >
                        ✨ AI ช่วยร่างข้อกำหนด TOR
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('check')}
                        className={`pb-2.5 px-4 text-xs font-black border-b-2 transition ${
                            mode === 'check'
                                ? 'border-purple-600 text-purple-950 bg-white rounded-t-xl shadow-2xs'
                                : 'border-transparent text-slate-500 hover:text-purple-700'
                        }`}
                    >
                        🛡️ AI ตรวจสอบการล็อกสเปก (Anti-Lock-in Check)
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1">
                    {mode === 'draft' ? (
                        <div className="space-y-4">
                            <form onSubmit={handleDraftTor} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            ชื่อรายการพัสดุ / ครุภัณฑ์ *
                                        </label>
                                        <input
                                            type="text"
                                            value={itemName}
                                            onChange={(e) => setItemName(e.target.value)}
                                            placeholder="เช่น เครื่องทดสอบยานยนต์ไฟฟ้า, คอมพิวเตอร์ประมวลผลกราฟิก"
                                            className="w-full text-xs rounded-xl border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            หมวดหมู่พัสดุ
                                        </label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full text-xs rounded-xl border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                                        >
                                            <option value="ครุภัณฑ์การศึกษา">ครุภัณฑ์การศึกษา / ฝึกทักษะวิชาชีพ</option>
                                            <option value="ครุภัณฑ์คอมพิวเตอร์">ครุภัณฑ์คอมพิวเตอร์และเทคโนโลยี</option>
                                            <option value="ครุภัณฑ์โรงงาน/ช่างอุตสาหกรรม">ครุภัณฑ์โรงงาน / ช่างอุตสาหกรรม</option>
                                            <option value="วัสดุฝึกอบรมและสื่อการสอน">วัสดุฝึกอบรมและสื่อการสอน</option>
                                            <option value="งานจ้างเหมาบริการ/ปรับปรุง">งานจ้างเหมาบริการ / ปรับปรุงสถานที่</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            งบประมาณโดยประมาณ (บาท)
                                        </label>
                                        <input
                                            type="number"
                                            value={estimatedPrice}
                                            onChange={(e) => setEstimatedPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full text-xs rounded-xl border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            ความต้องการเฉพาะ / ฟังก์ชันการใช้งาน
                                        </label>
                                        <input
                                            type="text"
                                            value={requirements}
                                            onChange={(e) => setRequirements(e.target.value)}
                                            placeholder="เช่น รองรับไฟ 220V, มีใบรับรอง มอก., จอ 24 นิ้ว"
                                            className="w-full text-xs rounded-xl border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>

                                <div className="text-right">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-md transition disabled:opacity-50"
                                    >
                                        {loading ? '⌛ AI กำลังสังเคราะห์ TOR...' : '✨ ร่างข้อกำหนด TOR ด้วย AI'}
                                    </button>
                                </div>
                            </form>

                            {/* Draft Result */}
                            {draftedTor && (
                                <div className="mt-4 p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3 text-xs">
                                    <div className="flex items-center justify-between pb-2 border-b border-purple-200">
                                        <h4 className="font-black text-purple-950 text-sm">
                                            📋 {draftedTor.title}
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={applyDraftToProcurement}
                                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition"
                                        >
                                            ✓ นำเนื้อหานี้ไปใส่ในเอกสาร
                                        </button>
                                    </div>

                                    <div>
                                        <span className="font-bold text-slate-700">วัตถุประสงค์: </span>
                                        <span className="text-slate-800">{draftedTor.purpose}</span>
                                    </div>

                                    <div>
                                        <span className="font-bold text-slate-700 block mb-1">คุณลักษณะเฉพาะ (Specifications):</span>
                                        <div className="space-y-1.5 pl-2">
                                            {draftedTor.specifications?.map((s, idx) => (
                                                <div key={idx} className="p-2 bg-white rounded-lg border border-purple-100">
                                                    <span className="font-bold text-purple-900">{s.label}: </span>
                                                    <span className="text-slate-700">{s.details}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
                                        <div className="p-2 bg-white rounded-lg border border-purple-100">
                                            <span className="font-bold text-slate-700">การรับประกัน: </span>
                                            <span>{draftedTor.warranty}</span>
                                        </div>
                                        <div className="p-2 bg-white rounded-lg border border-purple-100">
                                            <span className="font-bold text-slate-700">ระยะเวลาส่งมอบ: </span>
                                            <span>{draftedTor.delivery_days} วัน</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Check Anti-Lock-in Mode */
                        <div className="space-y-4">
                            <form onSubmit={handleCheckCompliance} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        วางข้อความคุณลักษณะเฉพาะ (สเปกพัสดุ) ที่ต้องการตรวจสอบ:
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={torTextToCheck}
                                        onChange={(e) => setTorTextToCheck(e.target.value)}
                                        placeholder="วางข้อความสเปก เช่น คอมพิวเตอร์ CPU Intel Core i7 หรือยี่ห้อ Dell หรือข้อกำหนดทางเทคนิค..."
                                        className="w-full text-xs rounded-xl border-slate-200 focus:border-purple-500 focus:ring-purple-500 font-mono"
                                        required
                                    />
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-slate-500">
                                        * ระบบตรวจจับการระบุยี่ห้อโดยไม่มีคำว่า "หรือเทียบเท่า" และการกำหนดเงื่อนไขที่เอื้อเอกชน
                                    </span>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-md transition disabled:opacity-50"
                                    >
                                        {loading ? '⌛ AI กำลังตรวจความโปร่งใส...' : '🛡️ เริ่มตรวจสอบการล็อกสเปก'}
                                    </button>
                                </div>
                            </form>

                            {/* Compliance Result */}
                            {complianceResult && (
                                <div className={`mt-4 p-5 rounded-2xl border space-y-3 text-xs ${
                                    complianceResult.compliance_status === 'pass'
                                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                                        : complianceResult.compliance_status === 'warning'
                                        ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                                        : 'bg-rose-50/80 border-rose-300 text-rose-950'
                                }`}>
                                    <div className="flex items-center justify-between pb-2 border-b border-current/20">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">
                                                {complianceResult.compliance_status === 'pass' ? '✅' : complianceResult.compliance_status === 'warning' ? '⚠️' : '❌'}
                                            </span>
                                            <div>
                                                <h4 className="font-black text-sm">
                                                    คะแนนความโปร่งใส: {complianceResult.compliance_score}/100
                                                </h4>
                                                <p className="text-[11px] opacity-90">{complianceResult.summary}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-white/80 font-black text-[11px] shadow-2xs">
                                            {complianceResult.compliance_status === 'pass' ? 'สอดคล้องตามระเบียบ' : 'ต้องปรับปรุงข้อความ'}
                                        </span>
                                    </div>

                                    {complianceResult.identified_risks?.length > 0 && (
                                        <div>
                                            <span className="font-bold block mb-1">จุดเสี่ยงที่ตรวจพบ:</span>
                                            <ul className="list-disc list-inside space-y-1 pl-1">
                                                {complianceResult.identified_risks.map((risk, idx) => (
                                                    <li key={idx}>{risk}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {complianceResult.suggested_revisions?.length > 0 && (
                                        <div>
                                            <span className="font-bold block mb-1">ข้อเสนอแนะในการปรับปรุง:</span>
                                            <ul className="list-disc list-inside space-y-1 pl-1 opacity-90">
                                                {complianceResult.suggested_revisions.map((rev, idx) => (
                                                    <li key={idx}>{rev}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-right">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>
    );
}
