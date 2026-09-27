import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

import React from 'react';

class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("SmartFlow ErrorBoundary caught an unhandled error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
                    <div className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-rose-200">
                        <div className="flex items-center gap-3 text-rose-600 mb-3">
                            <span className="text-3xl">⚠️</span>
                            <h2 className="text-xl font-bold">เกิดข้อผิดพลาดในการแสดงผลหน้าเว็บ</h2>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                            ระบบพบข้อผิดพลาดที่ไม่คาดคิดในขณะประมวลผลหน้าจอ ท่านสามารถกดรีเฟรชเพื่อโหลดข้อมูลใหม่อีกครั้ง
                        </p>
                        <div className="p-3 bg-rose-50 rounded-xl text-rose-900 font-mono text-xs overflow-auto max-h-40 mb-5 border border-rose-200">
                            {this.state.error?.toString() || 'Unknown runtime error'}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                            >
                                🔄 รีเฟรชหน้านี้
                            </button>
                            <button
                                onClick={() => window.location.href = '/npc_smartflow/dashboard'}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                            >
                                🏠 กลับหน้าหลัก
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <AppErrorBoundary>
                <App {...props} />
            </AppErrorBoundary>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
