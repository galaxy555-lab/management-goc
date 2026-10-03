/**
 * Centralized Notification Center Modal
 * Manage all alerts: New Tasks, Deadline Reminders, Leave Approvals, Payroll Updates
 */

import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { AppNotification } from '../../types/index.ts';
import {
  Bell,
  CheckSquare,
  AlertTriangle,
  Palmtree,
  Wallet,
  Megaphone,
  CheckCheck,
  Trash2,
  RefreshCw,
  Search,
  Calendar,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface NotificationCenterModalProps {
  onNavigate: (page: string) => void;
}

export function NotificationCenterModal({ onNavigate }: NotificationCenterModalProps) {
  const {
    notifications,
    unreadCount,
    counts,
    showCenterModal,
    setShowCenterModal,
    activeFilter,
    setActiveFilter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    checkDeadlines,
    loading,
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [checkingDeadlines, setCheckingDeadlines] = useState(false);

  if (!showCenterModal) return null;

  const handleCheckDeadlines = async () => {
    setCheckingDeadlines(true);
    await checkDeadlines();
    setCheckingDeadlines(false);
  };

  const filteredNotifs = notifications.filter(n => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK':
        return <CheckSquare className="h-5 w-5 text-blue-600" />;
      case 'DEADLINE':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'LEAVE':
        return <Palmtree className="h-5 w-5 text-emerald-600" />;
      case 'PAYROLL':
        return <Wallet className="h-5 w-5 text-[#800020]" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityTag = (priority?: string) => {
    if (priority === 'URGENT') {
      return (
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
          MENDESAK
        </span>
      );
    }
    if (priority === 'HIGH') {
      return (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
          PENTING
        </span>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="my-8 w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FDF2F8] text-[#800020] shadow-xs">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight flex items-center gap-2">
                <span>Pusat Notifikasi & Peringatan GOC</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#800020] px-2 py-0.5 text-[10px] font-extrabold text-white">
                    {unreadCount} Belum Dibaca
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500">
                Peringatan tugas baru, deadline, persetujuan cuti, dan pembaruan payroll
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCenterModal(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
          <button
            onClick={() => setActiveFilter('TASK')}
            className={`rounded-2xl p-3 border text-left transition-all ${
              activeFilter === 'TASK'
                ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400'
                : 'bg-gray-50 border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-600">Tugas Baru</span>
              <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <p className="text-lg font-black text-blue-700 mt-1">{counts.task}</p>
          </button>

          <button
            onClick={() => setActiveFilter('DEADLINE')}
            className={`rounded-2xl p-3 border text-left transition-all ${
              activeFilter === 'DEADLINE'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400'
                : 'bg-gray-50 border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-600">Deadline</span>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <p className="text-lg font-black text-amber-700 mt-1">{counts.deadline}</p>
          </button>

          <button
            onClick={() => setActiveFilter('LEAVE')}
            className={`rounded-2xl p-3 border text-left transition-all ${
              activeFilter === 'LEAVE'
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400'
                : 'bg-gray-50 border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-600">Cuti & Izin</span>
              <Palmtree className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <p className="text-lg font-black text-emerald-700 mt-1">{counts.leave}</p>
          </button>

          <button
            onClick={() => setActiveFilter('PAYROLL')}
            className={`rounded-2xl p-3 border text-left transition-all ${
              activeFilter === 'PAYROLL'
                ? 'bg-pink-50/70 border-pink-300 ring-2 ring-pink-400'
                : 'bg-gray-50 border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-600">Payroll</span>
              <Wallet className="h-3.5 w-3.5 text-[#800020]" />
            </div>
            <p className="text-lg font-black text-[#800020] mt-1">{counts.payroll}</p>
          </button>
        </div>

        {/* Action Controls & Search */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari notifikasi atau kata kunci..."
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs pl-9 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-hidden"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-[#800020] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua ({counts.all})
            </button>

            <button
              onClick={markAllAsRead}
              title="Tandai semua sudah dibaca"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5 text-[#800020]" />
              <span>Tandai Dibaca</span>
            </button>

            <button
              onClick={handleCheckDeadlines}
              disabled={checkingDeadlines}
              title="Periksa dan update peringatan deadline tugas"
              className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:text-[#800020] hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 ${checkingDeadlines ? 'animate-spin text-[#800020]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
          {filteredNotifs.length === 0 ? (
            <div className="py-16 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-3xl">
              <Bell className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="font-bold text-gray-700">Tidak ada notifikasi dalam kategori ini.</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Peringatan otomatis akan muncul saat ada pembaruan tugas, deadline, cuti, atau gaji.</p>
            </div>
          ) : (
            filteredNotifs.map(n => (
              <div
                key={n.id}
                className={`rounded-2xl p-3.5 border transition-all flex items-start gap-3.5 ${
                  !n.read
                    ? 'bg-[#FFF5F7] border-[#FBCFE8] shadow-2xs'
                    : 'bg-white border-gray-100 hover:bg-gray-50/60'
                }`}
              >
                <div className="shrink-0 mt-0.5 p-2 rounded-xl bg-white border border-gray-100 shadow-2xs">
                  {getNotificationIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {n.title}
                      </span>
                      {getPriorityTag(n.priority)}
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                      {new Date(n.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100/60">
                    {n.link ? (
                      <button
                        onClick={() => {
                          const clean = n.link?.replace('/', '') || 'dashboard';
                          markAsRead(n.id);
                          setShowCenterModal(false);
                          onNavigate(clean);
                        }}
                        className="text-[11px] font-bold text-[#800020] hover:underline flex items-center gap-1"
                      >
                        <span>Buka Detail Modul</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    ) : <span />}

                    <div className="flex items-center gap-1.5">
                      {!n.read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 px-2 py-0.5"
                        >
                          Tandai Dibaca
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded-lg"
                        title="Hapus Notifikasi"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={clearReadNotifications}
            className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 font-semibold"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Bersihkan yang Sudah Dibaca</span>
          </button>

          <button
            onClick={() => setShowCenterModal(false)}
            className="rounded-xl bg-gray-100 px-5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
