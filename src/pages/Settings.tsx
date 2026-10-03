/**
 * Settings & Configuration Module for GOC Team Management
 * Owner-accessible clinic settings, timezone, security policies
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
  Bell,
  Save,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export function Settings() {
  const { hasPermission, isOwner } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

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

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await apiRequest<{ message: string; settings: AppSettings }>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSettings(res.settings);
      setFeedback('Pengaturan sistem berhasil disimpan.');
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="h-6 w-6 text-[#800020]" />
          <span>Pengaturan Sistem & Klinik</span>
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Konfigurasi identitas klinik, zona waktu Asia/Jakarta, kebijakan sesi, dan notifikasi.
        </p>
      </div>

      {feedback && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#800020] border-t-transparent mb-2" />
          <p>Memuat pengaturan...</p>
        </div>
      ) : settings ? (
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
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:border-[#800020] outline-hidden disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Aplikasi</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={settings.app_name}
                  onChange={e => setSettings({ ...settings, app_name: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:border-[#800020] outline-hidden disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Localization & Time */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#800020]" />
              <span>Zona Waktu & Tanggal</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Zona Waktu Default</label>
                <input
                  type="text"
                  disabled
                  value={settings.timezone}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs bg-gray-100 text-gray-700"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Waktu Indonesia Barat (WIB)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Format Tanggal</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={settings.date_format}
                  onChange={e => setSettings({ ...settings, date_format: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:border-[#800020] outline-hidden disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Security & Sessions */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#800020]" />
              <span>Kebijakan Keamanan & Sesi</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-800">Batas Waktu Sesi Aktif (Timeout)</p>
                  <p className="text-[11px] text-gray-500">Sesi user otomatis logout setelah periode inaktif</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="15"
                    max="1440"
                    disabled={!canEdit}
                    value={settings.session_timeout_minutes}
                    onChange={e => setSettings({ ...settings, session_timeout_minutes: parseInt(e.target.value) || 120 })}
                    className="w-20 rounded-xl border border-gray-300 px-3 py-1.5 text-xs text-center font-bold focus:border-[#800020] outline-hidden disabled:bg-gray-100"
                  />
                  <span className="text-xs text-gray-500 font-medium">Menit</span>
                </div>
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
                className="rounded-xl bg-[#800020] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] transition-all disabled:opacity-50 flex items-center gap-2 ml-auto"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
              </button>
            </div>
          )}
        </form>
      ) : null}
    </div>
  );
}
