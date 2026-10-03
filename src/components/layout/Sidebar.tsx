/**
 * Dynamic Permission-Based Sidebar for GOC Team Management
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  Calendar,
  CheckSquare,
  Palmtree,
  Wallet,
  BarChart3,
  Megaphone,
  History,
  Settings,
  User,
  LogOut,
  X,
  MessageSquare,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  permission?: string;
  badge?: string;
}

export function Sidebar({ currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  const { session, hasPermission, logout, isOwner } = useAuth();

  // Defined all possible sidebar navigation items with their required permission
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      permission: 'dashboard.view',
    },
    {
      id: 'forum',
      label: 'Forum & Meeting',
      icon: MessageSquare,
      permission: 'forum.view',
      badge: 'Live',
    },
    {
      id: 'organization',
      label: 'Organisasi',
      icon: Building2,
      permission: 'organization.view',
    },
    {
      id: 'team',
      label: 'Team GOC',
      icon: Users,
      permission: 'team.view',
    },
    {
      id: 'access',
      label: 'Hak Akses',
      icon: ShieldCheck,
      permission: 'access.manage',
    },
    {
      id: 'schedules',
      label: 'Jadwal',
      icon: Calendar,
      permission: 'schedule.view',
    },
    {
      id: 'tasks',
      label: 'Tugas',
      icon: CheckSquare,
      permission: 'task.view',
    },
    {
      id: 'leave',
      label: 'Cuti & Izin',
      icon: Palmtree,
      permission: 'leave.view',
    },
    {
      id: 'payroll',
      label: 'Payroll',
      icon: Wallet,
      permission: 'payroll.view',
    },
    {
      id: 'reports',
      label: 'Laporan',
      icon: BarChart3,
      permission: 'report.view',
    },
    {
      id: 'announcements',
      label: 'Pengumuman',
      icon: Megaphone,
      permission: 'announcement.view',
    },
    {
      id: 'audit-log',
      label: 'Audit Log',
      icon: History,
      permission: 'audit.view',
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: Settings,
      permission: 'settings.view',
    },
    {
      id: 'profile',
      label: 'Profil Saya',
      icon: User,
      permission: 'profile.view',
    },
  ];

  // Dynamic filter: ONLY show menu items that user has permission to view
  const visibleMenus = menuItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-[#E2E8F0] bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="flex h-16 items-center justify-between px-5 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#800020] text-white shadow-xs">
                <span className="font-extrabold text-sm tracking-widest">GOC</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-[#800020] tracking-tight">GOC MANAGEMENT</span>
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Internal Team System</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden focus:outline-hidden"
              aria-label="Tutup Menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3">
            <p className="px-3 pt-2 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Menu Utama
            </p>
            <nav className="space-y-1">
              {visibleMenus.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#800020] text-white shadow-sm shadow-[#800020]/20'
                        : 'text-gray-600 hover:bg-[#FDF2F8] hover:text-[#800020]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#800020]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive ? 'bg-white text-[#800020]' : 'bg-[#FDF2F8] text-[#800020]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Card & Logout Bottom */}
        <div className="p-3 border-t border-[#E2E8F0] bg-gray-50/50">
          <div className="flex items-center gap-3 rounded-xl p-2 bg-white border border-gray-100 shadow-2xs">
            <img
              src={session?.user.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={session?.user.full_name}
              className="h-9 w-9 rounded-full object-cover border border-[#800020]/20"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800 truncate">{session?.user.full_name}</p>
              <p className="text-[10px] text-gray-500 truncate">{session?.user.position_name}</p>
            </div>
            <button
              onClick={() => logout()}
              title="Keluar"
              className="rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-hidden"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 text-center">
            <p className="text-[10px] text-gray-400 font-medium">Galaxy Orthodontic Center &copy; 2026</p>
          </div>
        </div>
      </aside>
    </>
  );
}
