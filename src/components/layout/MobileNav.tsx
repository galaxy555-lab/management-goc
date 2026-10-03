/**
 * Mobile Bottom Navigation for GOC Team Management
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { LayoutDashboard, CheckSquare, Calendar, Palmtree, Menu, MessageSquare } from 'lucide-react';

interface MobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenSidebar: () => void;
}

export function MobileNav({ currentPage, onNavigate, onOpenSidebar }: MobileNavProps) {
  const { hasPermission } = useAuth();
  const { counts, unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-[#E2E8F0] bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-lg lg:hidden">
      <button
        onClick={() => onNavigate('dashboard')}
        className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 p-1 text-[10px] font-semibold transition-colors ${
          currentPage === 'dashboard' ? 'text-[#800020]' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <LayoutDashboard className="h-5 w-5" />
        <span>Dashboard</span>
      </button>

      {hasPermission('forum.view') && (
        <button
          onClick={() => onNavigate('forum')}
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 p-1 text-[10px] font-semibold transition-colors ${
            currentPage === 'forum' ? 'text-[#800020]' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <div className="relative">
            <MessageSquare className="h-5 w-5" />
          </div>
          <span>Forum</span>
        </button>
      )}

      {hasPermission('task.view') && (
        <button
          onClick={() => onNavigate('tasks')}
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 p-1 text-[10px] font-semibold transition-colors ${
            currentPage === 'tasks' ? 'text-[#800020]' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <div className="relative">
            <CheckSquare className="h-5 w-5" />
            {(counts.task + counts.deadline) > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#800020] px-1 text-[8px] font-extrabold text-white">
                {(counts.task + counts.deadline) > 9 ? '9+' : (counts.task + counts.deadline)}
              </span>
            )}
          </div>
          <span>Tugas</span>
        </button>
      )}

      {hasPermission('schedule.view') && (
        <button
          onClick={() => onNavigate('schedules')}
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 p-1 text-[10px] font-semibold transition-colors ${
            currentPage === 'schedules' ? 'text-[#800020]' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span>Jadwal</span>
        </button>
      )}

      {hasPermission('leave.view') && (
        <button
          onClick={() => onNavigate('leave')}
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 p-1 text-[10px] font-semibold transition-colors ${
            currentPage === 'leave' ? 'text-[#800020]' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <div className="relative">
            <Palmtree className="h-5 w-5" />
            {counts.leave > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[8px] font-extrabold text-white">
                {counts.leave > 9 ? '9+' : counts.leave}
              </span>
            )}
          </div>
          <span>Cuti</span>
        </button>
      )}

      <button
        onClick={onOpenSidebar}
        className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 p-1 text-[10px] font-semibold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <div className="relative">
          <Menu className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-[#800020]" />
          )}
        </div>
        <span>Menu</span>
      </button>
    </nav>
  );
}
