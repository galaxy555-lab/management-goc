/**
 * Floating Toast Alerts for Real-time Notifications
 * Displays instant alerts for new tasks, deadline warnings, leave approvals, and payroll updates
 */

import React, { useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext.tsx';
import {
  CheckSquare,
  AlertTriangle,
  Palmtree,
  Wallet,
  Megaphone,
  Bell,
  X,
  ArrowRight,
} from 'lucide-react';

interface NotificationToastListProps {
  onNavigate: (page: string) => void;
}

export function NotificationToastList({ onNavigate }: NotificationToastListProps) {
  const { toasts, dismissToast, markAsRead } = useNotifications();

  // Auto dismiss after 7 seconds
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        dismissToast(toasts[toasts.length - 1].id);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

  const getAlertIcon = (type: string, priority?: string) => {
    switch (type) {
      case 'TASK':
        return <CheckSquare className="h-5 w-5 text-blue-600" />;
      case 'DEADLINE':
        return <AlertTriangle className="h-5 w-5 text-amber-600 animate-bounce" />;
      case 'LEAVE':
        return <Palmtree className="h-5 w-5 text-emerald-600" />;
      case 'PAYROLL':
        return <Wallet className="h-5 w-5 text-[#800020]" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAlertBorder = (type: string, priority?: string) => {
    if (priority === 'URGENT' || type === 'DEADLINE') {
      return 'border-amber-400 bg-amber-50/90 shadow-amber-200/50';
    }
    if (type === 'PAYROLL') {
      return 'border-pink-300 bg-pink-50/90 shadow-pink-200/50';
    }
    if (type === 'LEAVE') {
      return 'border-emerald-300 bg-emerald-50/90 shadow-emerald-200/50';
    }
    return 'border-blue-300 bg-blue-50/90 shadow-blue-200/50';
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${getAlertBorder(
            toast.type,
            toast.priority
          )}`}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">{getAlertIcon(toast.type, toast.priority)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-gray-900 leading-tight">
                  {toast.title}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">Baru Saja</span>
              </div>

              <p className="text-xs text-gray-700 mt-1 leading-snug line-clamp-2">
                {toast.message}
              </p>

              {toast.link && (
                <button
                  onClick={() => {
                    const clean = toast.link?.replace('/', '') || 'dashboard';
                    markAsRead(toast.id);
                    dismissToast(toast.id);
                    onNavigate(clean);
                  }}
                  className="mt-2 text-[11px] font-bold text-[#800020] hover:underline flex items-center gap-1"
                >
                  <span>Buka Informasi</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-gray-400 hover:text-gray-700 p-0.5 rounded-lg"
              aria-label="Tutup Notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
