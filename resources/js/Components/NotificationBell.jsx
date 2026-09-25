import React, { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(route('notifications.index'));
            if (res.data) {
                setNotifications(res.data.notifications || []);
                setUnreadCount(res.data.unread_count || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for live updates
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            setIsLoading(true);
            await axios.post(route('notifications.mark_all_read'));
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error('Error marking all as read:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            try {
                await axios.post(route('notifications.read', notif.id));
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            } catch (err) {
                console.error('Error marking as read:', err);
            }
        }
        setIsOpen(false);
        if (notif.action_url) {
            router.visit(notif.action_url);
        }
    };

    const getColorClasses = (color) => {
        switch (color) {
            case 'amber':
                return 'bg-amber-100 text-amber-800 border-amber-300 ring-amber-400';
            case 'emerald':
                return 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-emerald-400';
            case 'rose':
                return 'bg-rose-100 text-rose-800 border-rose-300 ring-rose-400';
            case 'blue':
                return 'bg-blue-100 text-blue-800 border-blue-300 ring-blue-400';
            case 'purple':
            default:
                return 'bg-purple-100 text-purple-800 border-purple-300 ring-purple-400';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`relative inline-flex items-center justify-center p-2.5 rounded-2xl transition-all duration-200 focus:outline-none cursor-pointer border ${
                    isOpen || unreadCount > 0
                        ? 'bg-gradient-to-r from-purple-100 via-indigo-50 to-purple-100 border-purple-300 text-purple-950 shadow-sm ring-2 ring-purple-400/40'
                        : 'bg-white hover:bg-purple-50/70 border-purple-100 text-purple-900 shadow-2xs hover:border-purple-200'
                }`}
                title="การแจ้งเตือนงานและคิวอนุมัติ"
            >
                {/* Bell SVG */}
                <svg 
                    className={`w-5 h-5 transition-transform duration-300 ${unreadCount > 0 ? 'animate-bounce' : 'group-hover:rotate-12'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                    />
                </svg>

                {/* Pulsing Badge if unread */}
                {unreadCount > 0 && (
                    <>
                        <span className="absolute -top-1 -right-1 flex h-5 w-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-[10px] shadow-md ring-2 ring-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </span>
                    </>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white shadow-2xl border border-purple-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-4 text-white flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🔔</span>
                            <div>
                                <h3 className="text-sm font-extrabold leading-tight">การแจ้งเตือนงาน</h3>
                                <p className="text-[11px] text-purple-200">คิวงานตามลำดับสายงานและบทบาทหน้าที่</p>
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllRead}
                                disabled={isLoading}
                                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 hover:underline cursor-pointer bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-xl transition"
                            >
                                ✓ อ่านแล้วทั้งหมด
                            </button>
                        )}
                    </div>

                    {/* Unread Pill Summary */}
                    <div className="px-4 py-2 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-semibold">
                            {unreadCount > 0 ? (
                                <span className="text-purple-950 font-bold">
                                    มี <span className="text-rose-600 font-black">{unreadCount}</span> รายการที่รอการปฏิบัติงาน
                                </span>
                            ) : (
                                <span className="text-emerald-700 font-bold">✓ งานทั้งหมดเป็นปัจจุบันแล้ว</span>
                            )}
                        </span>
                        <span className="text-[10px] text-slate-400">อัปเดตอัตโนมัติ</span>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-purple-50/80">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center space-y-2">
                                <span className="text-3xl block">🎉</span>
                                <p className="text-xs font-bold text-purple-950">ยังไม่มีการแจ้งเตือนในขณะนี้</p>
                                <p className="text-[11px] text-slate-500">
                                    เมื่อมีเอกสารหรือโครงการส่งมาถึงขั้นตอนของท่าน ระบบจะแจ้งเตือนที่นี่ทันที
                                </p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-3.5 transition-all cursor-pointer flex gap-3 items-start ${
                                        notif.is_read
                                            ? 'bg-white hover:bg-purple-50/40 text-slate-700'
                                            : 'bg-purple-50/40 hover:bg-purple-100/50 text-slate-900 border-l-4 border-l-purple-600'
                                    }`}
                                >
                                    {/* Icon Badge */}
                                    <div className={`shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center text-base border shadow-2xs ${getColorClasses(notif.color)}`}>
                                        {notif.icon || '🔔'}
                                    </div>

                                    {/* Body */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <h4 className={`text-xs truncate ${notif.is_read ? 'font-semibold text-slate-800' : 'font-black text-purple-950'}`}>
                                                {notif.title}
                                            </h4>
                                            {!notif.is_read && (
                                                <span className="shrink-0 w-2 h-2 rounded-full bg-rose-500"></span>
                                            )}
                                        </div>
                                        {notif.message && (
                                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                                {notif.message}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-slate-400">
                                            <span>🕒 {notif.created_at}</span>
                                            {notif.action_url && (
                                                <span className="font-bold text-purple-700 hover:text-purple-900 flex items-center gap-0.5 group">
                                                    ไปยังหน้างาน <span className="transition-transform group-hover:translate-x-0.5">➜</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-4 py-2.5 border-t border-purple-100 text-center">
                        <span className="text-[10px] text-slate-500 font-medium">
                            🔔 แจ้งเตือนสเตปอนุมัติ 6 ขั้นตอน & สัญญายืมเงินตัดยอดงบประมาณ
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
