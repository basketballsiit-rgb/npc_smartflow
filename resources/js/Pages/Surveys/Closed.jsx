import { Head, Link } from '@inertiajs/react';

export default function Closed({ project_title, message }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <Head title="ยังไม่เปิดให้ตอบแบบประเมิน" />
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-md rounded-2xl border border-slate-200 sm:px-10 text-center">
                    <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                        🔒
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">ยังไม่เปิดให้ตอบแบบประเมิน</h3>
                    <p className="text-sm font-bold text-purple-900 mb-4">{project_title}</p>
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs leading-relaxed mb-6 font-medium">
                        {message}
                    </div>
                    <Link
                        href="/"
                        className="inline-flex justify-center rounded-xl bg-purple-600 py-2.5 px-5 text-xs font-bold text-white shadow hover:bg-purple-700 transition-all"
                    >
                        🏠 กลับสู่หน้าหลัก
                    </Link>
                </div>
            </div>
        </div>
    );
}
