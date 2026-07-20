import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen flex">
            <Head title="เข้าสู่ระบบ | NPC SMART FLOW" />

            {/* ===== LEFT PANEL — Branding ===== */}
            <div
                className="hidden lg:flex lg:w-1/2 flex-col justify-between relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #3b0764 0%, #6d28d9 40%, #7c3aed 70%, #4c1d95 100%)',
                }}
            >
                {/* Decorative blobs */}
                <div
                    style={{
                        position: 'absolute', top: '-80px', left: '-80px',
                        width: '320px', height: '320px', borderRadius: '50%',
                        background: 'rgba(167,139,250,0.18)', filter: 'blur(0px)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute', bottom: '-100px', right: '-60px',
                        width: '380px', height: '380px', borderRadius: '50%',
                        background: 'rgba(196,181,253,0.13)', filter: 'blur(0px)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute', top: '45%', left: '60%',
                        width: '140px', height: '140px', borderRadius: '50%',
                        background: 'rgba(167,139,250,0.1)',
                    }}
                />

                {/* Top Logo */}
                <div className="relative z-10 p-10">
                    <div className="flex items-center gap-3">
                        <img
                            src="LogoNPC_PNG.png"
                            alt="NPC Logo"
                            className="h-12 w-12 object-contain drop-shadow-lg"
                        />
                        <div>
                            <p className="text-white font-bold text-lg leading-tight">NPC SMART FLOW</p>
                            <p className="text-purple-200 text-xs">ERP System</p>
                        </div>
                    </div>
                </div>

                {/* Center Content */}
                <div className="relative z-10 flex-1 flex flex-col justify-center px-12">
                    {/* Big Logo */}
                    <div className="flex justify-center mb-8">
                        <div
                            className="rounded-full flex items-center justify-center shadow-2xl overflow-hidden"
                            style={{
                                width: '160px', height: '160px',
                                background: 'rgba(255,255,255,0.12)',
                                border: '2px solid rgba(255,255,255,0.25)',
                                backdropFilter: 'blur(10px)',
                                padding: '8px',
                            }}
                        >
                            <img
                                src="LogoNPC_PNG.png"
                                alt="NPC Logo"
                                className="w-full h-full object-contain drop-shadow-xl"
                            />
                        </div>
                    </div>

                    <h1 className="text-white text-3xl font-bold text-center leading-snug mb-3">
                        วิทยาลัยสารพัดช่างน่าน
                    </h1>
                    <p className="text-purple-200 text-base text-center mb-2">Nan Polytechnic College</p>

                    <div
                        className="mx-auto my-6"
                        style={{
                            width: '60px', height: '3px',
                            background: 'linear-gradient(90deg,rgba(255,255,255,0.2),rgba(255,255,255,0.7),rgba(255,255,255,0.2))',
                            borderRadius: '9999px',
                        }}
                    />

                    <p className="text-purple-100 text-sm text-center leading-relaxed px-4">
                        ระบบบริหารจัดการโครงการและแผนงาน<br />
                        <span className="text-white font-semibold">NPC SMART FLOW</span> รองรับกระบวนการ PDCA<br />
                        ครบวงจรในที่เดียว
                    </p>
                </div>

                {/* Bottom */}
                <div className="relative z-10 p-10 text-center">
                    <p className="text-purple-300 text-xs">© 2026 NPC SMART FLOW ERP System</p>
                </div>
            </div>

            {/* ===== RIGHT PANEL — Login Form ===== */}
            <div
                className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12"
                style={{ background: '#faf8ff' }}
            >
                <div className="max-w-md w-full mx-auto">

                    {/* Mobile Logo (hidden on large screens) */}
                    <div className="flex justify-center mb-8 lg:hidden">
                        <img src="LogoNPC_PNG.png" alt="NPC Logo" className="h-16 w-16 object-contain" />
                    </div>

                    {/* Heading */}
                    <div className="mb-8">
                        <h2
                            className="text-3xl font-bold mb-2"
                            style={{ color: '#3b0764' }}
                        >
                            ยินดีต้อนรับ 👋
                        </h2>
                        <p className="text-slate-500 text-sm">
                            กรุณาเข้าสู่ระบบด้วยบัญชีของคุณ
                        </p>
                    </div>

                    {/* Status message */}
                    {status && (
                        <div className="mb-5 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                            {status}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={submit} className="space-y-5">

                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium mb-2"
                                style={{ color: '#4c1d95' }}
                            >
                                อีเมล / Email
                            </label>
                            <div className="relative">
                                <span
                                    className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-purple-400"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    autoFocus
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="กรอกอีเมลของคุณ"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                                    style={{
                                        border: errors.email ? '1.5px solid #ef4444' : '1.5px solid #ede9fe',
                                        background: '#ffffff',
                                        color: '#1e1b4b',
                                        boxShadow: '0 1px 4px rgba(109,40,217,0.06)',
                                    }}
                                    onFocus={e => {
                                        e.target.style.border = '1.5px solid #7c3aed';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.border = errors.email ? '1.5px solid #ef4444' : '1.5px solid #ede9fe';
                                        e.target.style.boxShadow = '0 1px 4px rgba(109,40,217,0.06)';
                                    }}
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1.5" />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium mb-2"
                                style={{ color: '#4c1d95' }}
                            >
                                รหัสผ่าน / Password
                            </label>
                            <div className="relative">
                                <span
                                    className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-purple-400"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="กรอกรหัสผ่านของคุณ"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                                    style={{
                                        border: errors.password ? '1.5px solid #ef4444' : '1.5px solid #ede9fe',
                                        background: '#ffffff',
                                        color: '#1e1b4b',
                                        boxShadow: '0 1px 4px rgba(109,40,217,0.06)',
                                    }}
                                    onFocus={e => {
                                        e.target.style.border = '1.5px solid #7c3aed';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.border = errors.password ? '1.5px solid #ef4444' : '1.5px solid #ede9fe';
                                        e.target.style.boxShadow = '0 1px 4px rgba(109,40,217,0.06)';
                                    }}
                                />
                            </div>
                            <InputError message={errors.password} className="mt-1.5" />
                        </div>

                        {/* Remember me + Forgot */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <span className="text-sm text-slate-500">จดจำฉันไว้</span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm font-medium transition-colors"
                                    style={{ color: '#7c3aed' }}
                                    onMouseEnter={e => e.target.style.color = '#4c1d95'}
                                    onMouseLeave={e => e.target.style.color = '#7c3aed'}
                                >
                                    ลืมรหัสผ่าน?
                                </Link>
                            )}
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                            style={{
                                background: processing
                                    ? 'linear-gradient(135deg,#a78bfa,#c4b5fd)'
                                    : 'linear-gradient(135deg,#6d28d9,#7c3aed)',
                                boxShadow: processing ? 'none' : '0 4px 16px rgba(109,40,217,0.35)',
                                cursor: processing ? 'not-allowed' : 'pointer',
                                transform: 'translateY(0)',
                            }}
                            onMouseEnter={e => {
                                if (!processing) {
                                    e.target.style.background = 'linear-gradient(135deg,#5b21b6,#6d28d9)';
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(109,40,217,0.45)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!processing) {
                                    e.target.style.background = 'linear-gradient(135deg,#6d28d9,#7c3aed)';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 16px rgba(109,40,217,0.35)';
                                }
                            }}
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    กำลังเข้าสู่ระบบ...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                        <polyline points="10 17 15 12 10 7" />
                                        <line x1="15" y1="12" x2="3" y2="12" />
                                    </svg>
                                    เข้าสู่ระบบ
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="mt-10 text-center text-xs text-slate-400">
                        © 2026 NPC SMART FLOW ERP System · วิทยาลัยสารพัดช่างน่าน
                    </p>
                </div>
            </div>
        </div>
    );
}
