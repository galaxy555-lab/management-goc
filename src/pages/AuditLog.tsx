/**
 * Audit Log Module for GOC Team Management
 * Complete System Audit Trail for Security & Accountability
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { AuditLog as AuditLogType } from '../types/index.ts';
import {
  History,
  Shield,
  Search,
  Filter,
  User,
  Clock,
  Terminal,
  Globe,
  Lock,
} from 'lucide-react';

export function AuditLog() {
  const { hasPermission, isOwner } = useAuth();
  const [logs, setLogs] = useState<AuditLogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const canViewAudit = hasPermission('audit.view') || isOwner;

  const fetchLogs = async () => {
    if (!canViewAudit) return;
    try {
      setLoading(true);
      const data = await apiRequest<AuditLogType[]>(
        `/api/audit-logs?module=${moduleFilter}&search=${search}`
      );
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter, search, canViewAudit]);

  if (!canViewAudit) {
    return (
      <div className="rounded-3xl border border-red-100 bg-white p-12 text-center shadow-xs">
        <Lock className="mx-auto h-12 w-12 text-red-500 mb-2" />
        <h2 className="text-base font-bold text-gray-900">Akses Dibatasi</h2>
        <p className="text-xs text-gray-500 mt-1">Anda tidak mempunyai izin untuk mengakses Audit Log sistem.</p>
      </div>
    );
  }

  const getActionBadgeColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('REJECT') || action.includes('DEACTIVATE')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (action.includes('CREATE') || action.includes('APPROVE') || action.includes('ACTIVATE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('PERMISSION') || action.includes('PASSWORD')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <History className="h-6 w-6 text-[#800020]" />
          <span>Rekam Jejak Aktivitas (Audit Log)</span>
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Pencatatan menyeluruh setiap aksi perubahan data, login akun, perizinan, dan mutasi SDM.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari user, aksi, atau rincian deskripsi..."
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs pl-9 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-hidden"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>

        <select
          value={moduleFilter}
          onChange={e => setModuleFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:border-[#800020] outline-hidden"
        >
          <option value="ALL">Semua Modul</option>
          <option value="auth">Autentikasi & Login</option>
          <option value="team">Team & Karyawan</option>
          <option value="access">Hak Akses & Permission</option>
          <option value="task">Tugas</option>
          <option value="leave">Cuti & Izin</option>
          <option value="payroll">Payroll</option>
          <option value="settings">Pengaturan</option>
        </select>
      </div>

      {/* Timeline List */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#800020] border-t-transparent mb-2" />
            <p>Memuat audit log...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">
            Tidak ada riwayat aktivitas yang cocok dengan filter.
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map(log => (
              <div
                key={log.id}
                className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${getActionBadgeColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-600">
                      Modul: {log.module}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      Target: {log.target_type} ({log.target_id || '-'})
                    </span>
                  </div>

                  <p className="font-semibold text-gray-900 leading-relaxed text-xs">
                    {log.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 pt-1">
                    <span className="flex items-center gap-1 font-bold text-gray-700">
                      <User className="h-3 w-3 text-gray-400" />
                      {log.user_name}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Globe className="h-3 w-3 text-gray-400" />
                      IP: {log.ip_address}
                    </span>
                  </div>
                </div>

                <div className="text-right sm:text-right text-[10px] text-gray-400 shrink-0 font-medium">
                  <p>{new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p>{new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
