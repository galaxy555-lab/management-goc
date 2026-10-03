/**
 * Dashboard View for GOC Team Management
 * Role-aware: Full statistics and hierarchy for Owner/PJ, tailored overview for Staff
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { apiRequest } from '../lib/api.ts';
import {
  Users,
  UserCheck,
  UserX,
  Palmtree,
  Clock,
  CheckCircle2,
  Megaphone,
  Activity,
  ArrowRight,
  PlusCircle,
  Calendar,
  Building2,
  ShieldCheck,
  Sparkles,
  Bell,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  pendingLeave: number;
  pendingPermission: number;
  activeTasks: number;
  completedTasks: number;
  activeAnnouncements: number;
}

interface PersonalStats {
  myTotalTasks: number;
  myActiveTasks: number;
  myLeaveTotal: number;
}

interface ActivityLog {
  id: string;
  user_name: string;
  action: string;
  module: string;
  description: string;
  created_at: string;
}

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { session, isOwner, hasPermission } = useAuth();
  const { unreadCount, counts, setShowCenterModal } = useNotifications();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [personal, setPersonal] = useState<PersonalStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await apiRequest<{
        stats: DashboardStats;
        personal: PersonalStats;
        recentActivities: ActivityLog[];
      }>('/api/dashboard/stats');
      setStats(res.stats);
      setPersonal(res.personal);
      setActivities(res.recentActivities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const isManagement = isOwner || session?.user.role_id === 'pj_klinik';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#800020] via-[#991D3C] to-[#6A041C] p-6 sm:p-8 text-white shadow-lg shadow-[#800020]/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-pink-100 backdrop-blur-xs mb-2">
              <Sparkles className="h-3.5 w-3.5 text-pink-200" />
              <span>Galaxy Orthodontic Center (GOC)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Selamat Datang, {session?.user.full_name}
            </h1>
            <p className="text-xs sm:text-sm text-pink-100 mt-1 max-w-xl">
              {isOwner
                ? 'Panel Kendali Super Admin & Pemilik. Anda memiliki otoritas penuh terhadap tata kelola organisasi, payroll, dan audit sistem.'
                : `Anda login sebagai ${session?.user.position_name} (${session?.user.department_name}).`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {hasPermission('task.create') && (
              <button
                onClick={() => onNavigate('tasks')}
                className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#800020] shadow-sm hover:bg-pink-50 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                <span>+ Buat Tugas</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('forum')}
              className="flex items-center gap-1.5 rounded-xl bg-pink-100/95 text-[#800020] px-3.5 py-2 text-xs font-bold hover:bg-white transition-colors shadow-xs"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Forum & Meeting</span>
            </button>

            {hasPermission('team.create') && (
              <button
                onClick={() => onNavigate('team')}
                className="flex items-center gap-1.5 rounded-xl bg-white/20 border border-white/30 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/30 transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>+ Tambah Tim</span>
              </button>
            )}

            {hasPermission('leave.create') && !isManagement && (
              <button
                onClick={() => onNavigate('leave')}
                className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#800020] shadow-sm hover:bg-pink-50 transition-colors"
              >
                <Palmtree className="h-4 w-4" />
                <span>+ Ajukan Cuti/Izin</span>
              </button>
            )}
          </div>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute -right-8 -bottom-8 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-32 -top-12 h-36 w-36 rounded-full bg-pink-500/10 blur-xl" />
      </div>

      {/* Centralized Notification Alert Banner */}
      {unreadCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Bell className="h-4 w-4 animate-bounce" />
            </div>
            <div>
              <p className="font-bold text-gray-900 flex items-center gap-2">
                <span>Pemberitahuan & Peringatan Sistem</span>
                <span className="rounded-full bg-[#800020] px-2 py-0.5 text-[10px] font-extrabold text-white">
                  {unreadCount} Baru
                </span>
              </p>
              <p className="text-gray-600 mt-0.5">
                Ada {counts.task} tugas baru, {counts.deadline} batas waktu (deadline), {counts.leave} pengajuan/persetujuan cuti, dan {counts.payroll} pembaruan payroll.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCenterModal(true)}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#800020] px-3.5 py-2 font-bold text-white hover:bg-[#6A041C] shadow-xs text-xs"
          >
            <span>Buka Pusat Notifikasi</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 8 Stats Metrics Cards (Section 7) */}
      {isManagement ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Total Karyawan</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDF2F8] text-[#800020]">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-gray-900">{stats?.totalEmployees || 0}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Seluruh tim terdaftar</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Karyawan Aktif</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-600">{stats?.activeEmployees || 0}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Status ACTIVE</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Karyawan Nonaktif</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <UserX className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-gray-700">{stats?.inactiveEmployees || 0}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Resigned / Suspended</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Pengajuan Cuti</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Palmtree className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-amber-600">{stats?.pendingLeave || 0}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Menunggu approval</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Pengajuan Izin</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-blue-600">{stats?.pendingPermission || 0}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Sakit & urusan pribadi</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Tugas Aktif</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-purple-600">{stats?.activeTasks || 0}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">TODO / In Progress / Review</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Tugas Selesai</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-teal-600">{stats?.completedTasks || 0}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Status DONE</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Pengumuman Aktif</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Megaphone className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-rose-600">{stats?.activeAnnouncements || 0}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Broadcast internal</p>
          </div>
        </div>
      ) : (
        /* Karyawan Personal Metric Cards */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Tugas Aktif Saya</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF2F8] text-[#800020]">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-[#800020]">{personal?.myActiveTasks || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Perlu ditindaklanjuti</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Total Tugas Ditugaskan</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-teal-600">{personal?.myTotalTasks || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Total riwayat tugas</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Riwayat Pengajuan Cuti/Izin</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Palmtree className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-amber-600">{personal?.myLeaveTotal || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Pengajuan tahun ini</p>
          </div>
        </div>
      )}

      {/* Middle Section: Visual Organization Tree + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Organization Summary (Section 7: Owner ↓ PJ Klinik ↓ Divisi ↓ Karyawan) */}
        <div className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#800020]" />
                <span>Bagan Hirarki Organisasi GOC</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Visual struktur kepemimpinan & divisi kerja</p>
            </div>
            {hasPermission('organization.view') && (
              <button
                onClick={() => onNavigate('organization')}
                className="text-xs font-bold text-[#800020] hover:underline flex items-center gap-1"
              >
                <span>Lihat Lengkap</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Simple Clean Organizational Tree Widget */}
          <div className="py-6 flex flex-col items-center">
            {/* Level 1: Owner */}
            <div className="rounded-2xl border border-[#800020]/20 bg-[#FDF2F4] p-3 text-center shadow-xs w-64">
              <span className="rounded-full bg-[#800020] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                Owner / Super Admin
              </span>
              <p className="text-xs font-extrabold text-gray-900 mt-1.5">Hendri Kurniawan, ST., MMSI</p>
              <p className="text-[10px] text-gray-500">Pimpinan Tertinggi & Pemilik GOC</p>
            </div>

            {/* Connector */}
            <div className="h-6 w-0.5 bg-gray-300" />

            {/* Level 2: PJ Klinik */}
            <div className="rounded-2xl border border-pink-200 bg-pink-50/60 p-3 text-center shadow-xs w-64">
              <span className="rounded-full bg-[#991D3C] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                Penanggung Jawab Klinik
              </span>
              <p className="text-xs font-extrabold text-gray-900 mt-1.5">drg. Ervina Dewiyanti, Sp.Ort., FICD</p>
              <p className="text-[10px] text-gray-500">Kepala Medis & Operasional</p>
            </div>

            {/* Connector */}
            <div className="h-6 w-0.5 bg-gray-300" />

            {/* Level 3: 4 Divisi */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-center">
                <p className="text-[11px] font-bold text-gray-900">Administrasi</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Mareta & Yanti</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-center">
                <p className="text-[11px] font-bold text-gray-900">Finance</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Weli Apriyani</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-center">
                <p className="text-[11px] font-bold text-gray-900">Digital Marketing</p>
                <p className="text-[10px] text-gray-500 mt-0.5">M. Ridwan H.</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-center">
                <p className="text-[11px] font-bold text-gray-900">Perawat Gigi</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Adelia & Siti M.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed (Section 7) */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#800020]" />
              <span>Aktivitas Terbaru</span>
            </h2>
            {hasPermission('audit.view') && (
              <button
                onClick={() => onNavigate('audit-log')}
                className="text-xs font-bold text-[#800020] hover:underline"
              >
                Semua
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3.5 max-h-96 overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Belum ada riwayat aktivitas terbaru.</p>
            ) : (
              activities.map(act => (
                <div key={act.id} className="relative flex items-start gap-3 text-xs">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[#800020] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 leading-snug">{act.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                      <span>{act.user_name}</span>
                      <span>&bull;</span>
                      <span>{new Date(act.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
