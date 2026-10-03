/**
 * Settings & Configuration Module for GOC Team Management
 * Owner-accessible clinic settings, timezone, security policies, and Hostinger multi-computer database
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { AppSettings } from '../types/index.ts';
import {
  Settings as SettingsIcon,
  Building,
  Shield,
  Clock,
  Save,
  CheckCircle2,
  Database,
  Server,
  Laptop,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface DbStats {
  storage_type: string;
  database_file: string;
  size_bytes: number;
  size_formatted: string;
  total_users: number;
  total_employees: number;
  total_tasks: number;
  total_schedules: number;
  total_leave_requests: number;
  total_payroll_records: number;
  total_forum_messages: number;
  total_video_meetings: number;
  total_audit_logs: number;
  total_notifications: number;
  last_sync: string;
}

export function Settings() {
  const { hasPermission, isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'database'>('general');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const canEdit = hasPermission('settings.edit') || isOwner;

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<AppSettings>('/api/settings');
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDbStats = async () => {
    try {
      setLoadingStats(true);
      const stats = await apiRequest<DbStats>('/api/database/info');
      setDbStats(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchDbStats();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await apiRequest<{ message: string; settings: AppSettings }>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSettings(res.settings);
      setFeedback('Pengaturan sistem berhasil disimpan.');
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const token = localStorage.getItem('goc_auth_token');
      const res = await fetch('/api/database/backup', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok) throw new Error('Gagal mengunduh backup database');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goc_database_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setFeedback('File backup database JSON berhasil diunduh ke komputer Anda.');
      setTimeout(() => setFeedback(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengunduh backup.');
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('PERINGATAN: Memulihkan database akan mengganti seluruh data yang ada saat ini dengan data dari file backup. Lanjutkan?')) {
      e.target.value = '';
      return;
    }

    setRestoring(true);
    setErrorMsg('');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await apiRequest<{ message: string; stats: DbStats }>('/api/database/restore', {
        method: 'POST',
        body: JSON.stringify(parsed),
      });
      setDbStats(res.stats);
      setFeedback('Database berhasil dipulihkan dari file backup!');
      setTimeout(() => setFeedback(''), 6000);
      fetchSettings();
    } catch (err: any) {
      setErrorMsg(err.message || 'File database tidak valid atau gagal dipulihkan.');
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="h-6 w-6 text-[#800020]" />
          <span>Pengaturan Sistem & Database Pusat</span>
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Konfigurasi identitas klinik, keamanan, database pusat di Hostinger, dan sinkronisasi multi-komputer.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'general'
              ? 'border-[#800020] text-[#800020]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>Identitas & Kebijakan Klinik</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('database')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'database'
              ? 'border-[#800020] text-[#800020]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          <span>Database & Koneksi Multi-Komputer</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
            Online
          </span>
        </button>
      </div>

      {feedback && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs font-bold text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeTab === 'database' ? (
        <div className="space-y-6">
          {/* Multi-PC Architecture Overview */}
          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-gray-50 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Server className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">Database Pusat GOC Aktif (Hostinger Node.js)</h3>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 animate-pulse">
                      ● Sinkron Terhubung
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 max-w-2xl leading-relaxed">
                    Data disimpan secara terpusat di server Hostinger. Ketika <strong>Komputer 1</strong> (misal: Meja Resepsionis / Front Office) mengubah data pasien atau membuat tugas, <strong>Komputer 2</strong> (Ruang Praktik Dokter) dan <strong>Komputer Pimpinan</strong> akan otomatis mengakses dan menampilkan data yang persis sama.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={fetchDbStats}
                disabled={loadingStats}
                className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#800020] ${loadingStats ? 'animate-spin' : ''}`} />
                <span>Perbarui Info</span>
              </button>
            </div>

            {/* Architecture diagram cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5 pt-5 border-t border-emerald-100">
              <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 mb-1">
                  <Laptop className="h-4 w-4 text-[#800020]" />
                  <span>Komputer 1 (Admin/Kasir)</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">
                  Membuka browser ke alamat URL domain Hostinger. Input data jadwal, cuti, dan tugas langsung tersimpan di server.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 mb-1">
                  <Server className="h-4 w-4 text-emerald-600" />
                  <span>Server Hostinger Node.js</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">
                  Menjalankan <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-[10px]">server.js</code> yang mengelola database JSON persisten di folder <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-[10px]">data/</code>.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 mb-1">
                  <Laptop className="h-4 w-4 text-indigo-600" />
                  <span>Komputer 2, 3 & HP</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">
                  Membuka URL domain yang sama dengan akun masing-masing. Langsung melihat data yang baru diinput dari Komputer 1.
                </p>
              </div>
            </div>
          </div>

          {/* Database Statistics */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="h-4 w-4 text-[#800020]" />
              <span>Statistik & Ringkasan Data Database</span>
            </h3>

            {dbStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Pengguna & Akun</p>
                  <p className="text-xl font-black text-gray-900 mt-1">{dbStats.total_users}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{dbStats.total_employees} data karyawan klinik</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tugas & Progress</p>
                  <p className="text-xl font-black text-indigo-600 mt-1">{dbStats.total_tasks}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Tugas tim & kanban</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Jadwal & Shift</p>
                  <p className="text-xl font-black text-emerald-600 mt-1">{dbStats.total_schedules}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{dbStats.total_leave_requests} permohonan cuti</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ukuran Database</p>
                  <p className="text-xl font-black text-[#800020] mt-1">{dbStats.size_formatted}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{dbStats.total_forum_messages} pesan forum</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Memuat statistik database...</p>
            )}
          </div>

          {/* Backup & Restore Tools */}
          {isOwner && (
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#800020]" />
                <span>Backup & Pemulihan Database (Owner Super Admin)</span>
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Anda dapat mencadangkan seluruh data klinik (karyawan, hak akses, jadwal, tugas, cuti, penggajian, dan forum) ke dalam satu file JSON, atau memulihkan data tersebut kapan saja.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="rounded-xl bg-[#800020] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#6A041C] transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Unduh Backup Database (.json)</span>
                </button>

                <label className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-2xs cursor-pointer">
                  <Upload className="h-4 w-4 text-emerald-600" />
                  <span>{restoring ? 'Memulihkan...' : 'Pulihkan dari File Backup (.json)'}</span>
                  <input
                    type="file"
                    accept=".json"
                    disabled={restoring}
                    onChange={handleRestoreFile}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step-by-Step Guide to Hostinger Deployment */}
          <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-amber-700" />
              <span>Panduan Menjalankan di Hostinger Node.js & Multi-Komputer</span>
            </h3>
            <div className="text-xs text-amber-950 space-y-2 leading-relaxed">
              <p><strong>1. Mengapa data sama di Komputer 1 dan Komputer 2?</strong></p>
              <p className="text-amber-800">
                Karena aplikasi ini berjalan di web server Hostinger. Data tidak disimpan di hard disk komputer lokal masing-masing staf, melainkan di database server Hostinger (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono">data/goc_database.json</code>). Begitu Komputer 1 menginput data, Komputer 2 yang membuka web otomatis membaca data yang sama.
              </p>
              <p className="pt-1"><strong>2. Cara Setup di Menu "Setup Node.js App" Hostinger:</strong></p>
              <ul className="list-disc pl-5 space-y-1 text-amber-800">
                <li><strong>Node.js Version</strong>: Pilih <strong>v18.x</strong> atau <strong>v20.x</strong>.</li>
                <li><strong>Application Mode</strong>: Pilih <strong>Production</strong>.</li>
                <li><strong>Application Root</strong>: Masukkan folder aplikasi Anda (misal: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">public_html</code>).</li>
                <li><strong>Application Startup File</strong>: Tulis <strong><code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">server.js</code></strong> (file ini sudah otomatis dibundel dan siap dijalankan langsung oleh Node.js Hostinger).</li>
                <li>Jalankan perintah build jika via Terminal: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">npm install && npm run build</code> lalu klik <strong>START APPLICATION</strong>.</li>
              </ul>
              <p className="pt-1"><strong>3. Cara Menggunakan di Berbagai Komputer:</strong></p>
              <p className="text-amber-800">
                Buka browser di Komputer 1, Komputer 2, atau tablet kasir menuju alamat domain Anda (contoh: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">https://goc-klinik.com</code>). Login menggunakan username/password karyawan masing-masing.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* General Settings Tab */
        settings && (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Clinic Identity */}
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Building className="h-4 w-4 text-[#800020]" />
                <span>Identitas & Informasi Klinik</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Klinik</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={settings.clinic_name}
                    onChange={e => setSettings({ ...settings, clinic_name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:border-[#800020] focus:outline-hidden disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Aplikasi</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={settings.app_name}
                    onChange={e => setSettings({ ...settings, app_name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:border-[#800020] focus:outline-hidden disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Regional & Timezone */}
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#800020]" />
                <span>Zona Waktu & Format Tanggal</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Zona Waktu</label>
                  <select
                    disabled={!canEdit}
                    value={settings.timezone}
                    onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:border-[#800020] focus:outline-hidden disabled:bg-gray-50"
                  >
                    <option value="Asia/Jakarta">Asia/Jakarta (WIB - UTC+7)</option>
                    <option value="Asia/Makassar">Asia/Makassar (WITA - UTC+8)</option>
                    <option value="Asia/Jayapura">Asia/Jayapura (WIT - UTC+9)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Format Tanggal</label>
                  <select
                    disabled={!canEdit}
                    value={settings.date_format}
                    onChange={e => setSettings({ ...settings, date_format: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:border-[#800020] focus:outline-hidden disabled:bg-gray-50"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Contoh: 15/10/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (Contoh: 2026-10-15)</option>
                    <option value="D MMMM YYYY">D MMMM YYYY (Contoh: 15 Oktober 2026)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security & Sessions */}
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#800020]" />
                <span>Kebijakan Keamanan & Sesi Pengguna</span>
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-800">Durasi Timeout Sesi</p>
                    <p className="text-[11px] text-gray-500">Otomatis logout jika tidak ada aktivitas (menit)</p>
                  </div>
                  <input
                    type="number"
                    min="15"
                    max="1440"
                    disabled={!canEdit}
                    value={settings.session_timeout_minutes}
                    onChange={e => setSettings({ ...settings, session_timeout_minutes: Number(e.target.value) })}
                    className="w-20 rounded-xl border border-gray-200 p-2 text-xs text-center font-bold focus:border-[#800020] focus:outline-hidden disabled:bg-gray-100"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-800">Wajibkan Kata Sandi Kuat</p>
                    <p className="text-[11px] text-gray-500">Memeriksa panjang minimal dan kombinasi karakter</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={settings.require_strong_password}
                      onChange={e => setSettings({ ...settings, require_strong_password: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#800020]" />
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-800">Pemberitahuan & Notifikasi Sistem</p>
                    <p className="text-[11px] text-gray-500">Aktifkan lonceng pemberitahuan penugasan & cuti</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={settings.allow_notifications}
                      onChange={e => setSettings({ ...settings, allow_notifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#800020]" />
                  </label>
                </div>
              </div>
            </div>

            {canEdit && (
              <div className="text-right">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#800020] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] transition-all disabled:opacity-50 flex items-center gap-2 ml-auto cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
                </button>
              </div>
            )}
          </form>
        )
      )}
    </div>
  );
}
