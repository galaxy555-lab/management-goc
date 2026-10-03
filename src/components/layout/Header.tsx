/**
 * Application Header for GOC Team Management
 * Centralized Notification Bell with Category Tabs & Badges
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import {
  Bell,
  Search,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Shield,
  KeyRound,
  CheckCheck,
  Building2,
  CheckSquare,
  AlertTriangle,
  Palmtree,
  Wallet,
  ArrowRight,
  ExternalLink,
  Trash2,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Header({ onToggleSidebar, onNavigate, currentPage }: HeaderProps) {
  const { session, logout, isOwner } = useAuth();
  const {
    notifications,
    unreadCount,
    counts,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    activeFilter,
    setActiveFilter,
    setShowCenterModal,
  } = useNotifications();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayedNotifs = notifications.filter(n => {
    if (activeFilter !== 'ALL' && n.type !== activeFilter) return false;
    if (unreadOnly && n.read) return false;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK':
        return <CheckSquare className="h-4 w-4 text-blue-600" />;
      case 'DEADLINE':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'LEAVE':
        return <Palmtree className="h-4 w-4 text-emerald-600" />;
      case 'PAYROLL':
        return <Wallet className="h-4 w-4 text-[#800020]" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = (id: string, link?: string | null) => {
    markAsRead(id);
    if (link) {
      const cleanPage = link.replace('/', '');
      onNavigate(cleanPage);
      setShowNotifMenu(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E2E8F0] bg-white px-4 sm:px-6 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden focus:outline-hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#800020] text-white shadow-xs">
            <span className="font-extrabold text-sm tracking-wider">GOC</span>
          </div>
          <div>
            <h1 className="text-xs sm:text-base font-bold leading-tight text-gray-900 flex items-center gap-1.5">
              <span>GOC Team</span>
              <span className="hidden sm:inline">Management</span>
              {isOwner && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-[#FDF2F8] text-[#800020] border border-[#FBCFE8]">
                  SUPER ADMIN
                </span>
              )}
            </h1>
            <p className="text-[11px] text-gray-500 hidden md:block">Galaxy Orthodontic Center</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Centralized Notifications Bell with Badge Count */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className={`relative rounded-xl p-2 transition-all focus:outline-hidden ${
              showNotifMenu
                ? 'bg-[#FDF2F8] text-[#800020]'
                : 'text-gray-600 hover:bg-gray-100 hover:text-[#800020]'
            }`}
            aria-label="Pemberitahuan & Peringatan"
          >
            <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-[#800020]' : ''}`} />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#800020] text-[9px] font-extrabold text-white shadow-xs border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#800020] animate-ping opacity-40 pointer-events-none" />
              </>
            )}
          </button>

          {/* Centralized Dropdown Menu */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 rounded-2xl border border-gray-100 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Dropdown Header */}
              <div className="p-3.5 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">Pemberitahuan</span>
                    {unreadCount > 0 ? (
                      <span className="rounded-full bg-[#FDF2F8] px-2 py-0.5 text-[11px] font-extrabold text-[#800020] border border-[#FBCFE8]">
                        {unreadCount} baru
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                        Semua terbaca
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-[#800020] hover:underline flex items-center gap-1 font-semibold"
                        title="Tandai semua dibaca"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        <span>Tandai dibaca</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Filter Pills (Tasks, Deadlines, Leave, Payroll) */}
                <div className="flex gap-1 overflow-x-auto mt-2.5 pt-2 border-t border-gray-100 text-[10px] font-bold scrollbar-none">
                  <button
                    onClick={() => setActiveFilter('ALL')}
                    className={`px-2 py-1 rounded-lg shrink-0 transition-colors ${
                      activeFilter === 'ALL'
                        ? 'bg-[#800020] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Semua ({counts.all})
                  </button>

                  <button
                    onClick={() => setActiveFilter('TASK')}
                    className={`px-2 py-1 rounded-lg shrink-0 transition-colors flex items-center gap-1 ${
                      activeFilter === 'TASK'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <CheckSquare className="h-3 w-3" />
                    <span>Tugas ({counts.task})</span>
                  </button>

                  <button
                    onClick={() => setActiveFilter('DEADLINE')}
                    className={`px-2 py-1 rounded-lg shrink-0 transition-colors flex items-center gap-1 ${
                      activeFilter === 'DEADLINE'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    <span>Deadline ({counts.deadline})</span>
                  </button>

                  <button
                    onClick={() => setActiveFilter('LEAVE')}
                    className={`px-2 py-1 rounded-lg shrink-0 transition-colors flex items-center gap-1 ${
                      activeFilter === 'LEAVE'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <Palmtree className="h-3 w-3" />
                    <span>Cuti ({counts.leave})</span>
                  </button>

                  <button
                    onClick={() => setActiveFilter('PAYROLL')}
                    className={`px-2 py-1 rounded-lg shrink-0 transition-colors flex items-center gap-1 ${
                      activeFilter === 'PAYROLL'
                        ? 'bg-pink-600 text-white'
                        : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                    }`}
                  >
                    <Wallet className="h-3 w-3" />
                    <span>Payroll ({counts.payroll})</span>
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 p-1">
                {displayedNotifs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    <Bell className="mx-auto h-6 w-6 text-gray-300 mb-1" />
                    <p>Tidak ada notifikasi dalam kategori ini.</p>
                  </div>
                ) : (
                  displayedNotifs.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n.id, n.link)}
                      className={`group cursor-pointer rounded-xl p-2.5 transition-all flex items-start gap-2.5 ${
                        !n.read
                          ? 'bg-[#FFF5F7] hover:bg-[#FDE8ED]'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-white border border-gray-100 shadow-2xs">
                        {getNotificationIcon(n.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs ${!n.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>

                        <div className="flex items-center justify-between pt-1 text-[10px] text-[#800020] font-semibold">
                          <span className="flex items-center gap-1 group-hover:underline">
                            Buka Detail
                            <ArrowRight className="h-2.5 w-2.5" />
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                            className="text-gray-400 hover:text-red-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Hapus"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Dropdown Footer: Link to Full Modal */}
              <div className="p-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowNotifMenu(false);
                    setShowCenterModal(true);
                  }}
                  className="text-xs font-bold text-[#800020] hover:underline flex items-center gap-1 w-full justify-center py-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Lihat Semua di Pusat Notifikasi</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 rounded-full p-1 sm:px-2.5 sm:py-1 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors focus:outline-hidden"
          >
            <img
              src={session?.user.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={session?.user.full_name}
              className="h-8 w-8 rounded-full object-cover border border-[#800020]/20"
            />
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-gray-800 leading-tight">
                {session?.user.full_name}
              </p>
              <p className="text-[11px] text-gray-500 font-medium">
                {session?.user.position_name}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-100 bg-white p-2 shadow-xl z-50">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900">{session?.user.full_name}</p>
                <p className="text-[11px] text-gray-500 truncate">{session?.user.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FDF2F8] text-[#800020]">
                    {session?.user.role_name}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {session?.user.department_name}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setShowUserMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-[#FDF2F8] hover:text-[#800020] transition-colors"
                >
                  <UserIcon className="h-4 w-4" />
                  Profil Saya
                </button>

                <button
                  onClick={() => {
                    onNavigate('profile');
                    setShowUserMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-[#FDF2F8] hover:text-[#800020] transition-colors"
                >
                  <KeyRound className="h-4 w-4" />
                  Ganti Password
                </button>
              </div>

              <div className="pt-1 border-t border-gray-100">
                <button
                  onClick={() => logout()}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar (Logout)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

