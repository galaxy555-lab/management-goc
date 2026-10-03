/**
 * GOC Team Management Main Application
 * Galaxy Orthodontic Center
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { MobileNav } from './components/layout/MobileNav.tsx';
import { MustChangePasswordModal } from './components/modals/MustChangePasswordModal.tsx';
import { NotificationToastList } from './components/notifications/NotificationToastList.tsx';
import { NotificationCenterModal } from './components/notifications/NotificationCenterModal.tsx';

import { Login } from './pages/Login.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Forum } from './pages/Forum.tsx';
import { Organization } from './pages/Organization.tsx';
import { Team } from './pages/Team.tsx';
import { AccessControl } from './pages/AccessControl.tsx';
import { Tasks } from './pages/Tasks.tsx';
import { Schedules } from './pages/Schedules.tsx';
import { Leave } from './pages/Leave.tsx';
import { Payroll } from './pages/Payroll.tsx';
import { Reports } from './pages/Reports.tsx';
import { Announcements } from './pages/Announcements.tsx';
import { AuditLog } from './pages/AuditLog.tsx';
import { Profile } from './pages/Profile.tsx';
import { Settings } from './pages/Settings.tsx';

import { Lock, ArrowLeft } from 'lucide-react';

function AppContent() {
  const { session, loading, hasPermission } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#800020] text-white font-extrabold text-lg shadow-lg shadow-[#800020]/25 animate-pulse mb-3">
            GOC
          </div>
          <div className="h-4 w-4 mx-auto animate-spin rounded-full border-2 border-[#800020] border-t-transparent" />
          <p className="text-xs text-gray-500 font-semibold mt-2">Memuat Sistem GOC...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login Page
  if (!session) {
    return <Login />;
  }

  // Page Permission mapping
  const pagePermissions: Record<string, string> = {
    dashboard: 'dashboard.view',
    forum: 'forum.view',
    organization: 'organization.view',
    team: 'team.view',
    access: 'access.manage',
    schedules: 'schedule.view',
    tasks: 'task.view',
    leave: 'leave.view',
    payroll: 'payroll.view',
    reports: 'report.view',
    announcements: 'announcement.view',
    'audit-log': 'audit.view',
    settings: 'settings.view',
    profile: 'profile.view',
  };

  const requiredPerm = pagePermissions[currentPage];
  const isPermitted = !requiredPerm || hasPermission(requiredPerm);

  const renderPage = () => {
    if (!isPermitted) {
      return (
        <div className="rounded-3xl border border-red-100 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-3">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Akses Ditolak (403 Forbidden)</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            Anda tidak mempunyai hak akses yang cukup untuk membuka modul ini. Hubungi Owner / Administrator untuk meminta izin akses.
          </p>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#800020] px-4 py-2 text-xs font-bold text-white hover:bg-[#6A041C]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Dashboard</span>
          </button>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'forum':
        return <Forum />;
      case 'organization':
        return <Organization />;
      case 'team':
        return <Team />;
      case 'access':
        return <AccessControl />;
      case 'schedules':
        return <Schedules />;
      case 'tasks':
        return <Tasks />;
      case 'leave':
        return <Leave />;
      case 'payroll':
        return <Payroll />;
      case 'reports':
        return <Reports />;
      case 'announcements':
        return <Announcements />;
      case 'audit-log':
        return <AuditLog />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Sidebar Drawer */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main App Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNavigate={setCurrentPage}
          currentPage={currentPage}
        />

        <main className={`flex-1 overflow-y-auto ${currentPage === 'forum' ? 'p-1.5 sm:p-4 lg:p-6 pb-20 lg:pb-6' : 'p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8'}`}>
          {renderPage()}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      </div>

      {/* Forced Password Change Modal for First Login */}
      <MustChangePasswordModal />

      {/* Centralized Notification Real-time Alert Toasts & Full Modal */}
      <NotificationToastList onNavigate={setCurrentPage} />
      <NotificationCenterModal onNavigate={setCurrentPage} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
