'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, X, Calendar, FileText, Info } from 'lucide-react';

export default function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: 'notif-1',
      category: 'APPLICATION_UPDATES',
      title: 'Application Status Verified',
      message: 'Your application REF-2026-9901 for Post-Matric Scholarship has been verified.',
      is_read: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'notif-2',
      category: 'DEADLINES',
      title: 'Application Deadline Approaching',
      message: 'PM-KISAN 16th Installment e-KYC submission deadline is in 5 days.',
      is_read: false,
      created_at: new Date().toISOString()
    }
  ]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await fetch(`http://localhost:8000/api/v1/notifications/${id}/read`, { method: 'PUT' });
    } catch (e) {
      console.error('Failed to mark read', e);
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out Drawer / Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-800 text-sm">Notifications ({unreadCount} unread)</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">No notifications</div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 hover:bg-slate-50 transition flex items-start space-x-3 ${
                    item.is_read ? 'opacity-60' : 'bg-indigo-50/20'
                  }`}
                >
                  <div className="mt-0.5">
                    {item.category === 'DEADLINES' && <Calendar className="w-4 h-4 text-amber-600" />}
                    {item.category === 'APPLICATION_UPDATES' && <FileText className="w-4 h-4 text-indigo-600" />}
                    {item.category !== 'DEADLINES' && item.category !== 'APPLICATION_UPDATES' && (
                      <Info className="w-4 h-4 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{item.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {!item.is_read && (
                    <button
                      onClick={() => markRead(item.id)}
                      className="text-indigo-600 hover:text-indigo-800 p-1"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
