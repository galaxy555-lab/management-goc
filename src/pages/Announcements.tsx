/**
 * Announcements Module for GOC Team Management
 * Broadcasts, Department Targets, and Internal Notifications
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { Announcement, AnnouncementTarget, Department } from '../types/index.ts';
import {
  Megaphone,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  X,
} from 'lucide-react';

export function Announcements() {
  const { session, hasPermission } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    content: '',
    target_type: 'ALL' as AnnouncementTarget,
    target_id: '',
  });

  const canCreate = hasPermission('announcement.create');
  const canDelete = hasPermission('announcement.delete');

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const [ancRes, deptRes] = await Promise.all([
        apiRequest<Announcement[]>('/api/announcements'),
        apiRequest<Department[]>('/api/departments'),
      ]);
      setAnnouncements(ancRes);
      setDepartments(deptRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/announcements', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowAddModal(false);
      setForm({ title: '', content: '', target_type: 'ALL', target_id: '' });
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pengumuman ini?')) return;
    try {
      await apiRequest(`/api/announcements/${id}`, { method: 'DELETE' });
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Megaphone className="h-6 w-6 text-[#800020]" />
            <span>Pengumuman Internal Klinik</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Siaran informasi resmi, protokol medis, dan agenda internal Galaxy Orthodontic Center.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#800020] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>+ Buat Pengumuman</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#800020] border-t-transparent mb-2" />
          <p>Memuat pengumuman...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-16 text-center shadow-xs">
          <Megaphone className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-800">Belum ada pengumuman.</p>
          <p className="text-xs text-gray-400 mt-1">Pengumuman penting klinik akan ditampilkan di sini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(anc => (
            <div key={anc.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#FDF2F8] text-[#800020] px-2.5 py-0.5 text-[10px] font-bold border border-[#FBCFE8]">
                      {anc.target_type === 'ALL' ? 'Semua Divisi' : `Target: ${anc.target_type}`}
                    </span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                      <Calendar className="h-3 w-3" />
                      {anc.publish_date}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900">{anc.title}</h3>
                </div>

                {canDelete && (
                  <button
                    onClick={() => handleDelete(anc.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-700 leading-relaxed bg-gray-50/60 p-4 rounded-2xl border border-gray-100 whitespace-pre-line">
                {anc.content}
              </p>

              <div className="flex items-center justify-between pt-2 text-[11px] text-gray-400 border-t border-gray-100">
                <span>Diterbitkan oleh: <strong className="text-gray-700">{anc.author_name}</strong></span>
                <span className="text-emerald-600 font-bold">Status: {anc.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL BUAT PENGUMUMAN */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Buat Pengumuman Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Judul Pengumuman *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Judul pengumuman singkat dan padat"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Audiens</label>
                <select
                  value={form.target_type}
                  onChange={e => setForm({ ...form, target_type: e.target.value as AnnouncementTarget })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                >
                  <option value="ALL">Semua Karyawan (Seluruh Divisi)</option>
                  <option value="DEPARTMENT">Divisi Tertentu</option>
                </select>
              </div>

              {form.target_type === 'DEPARTMENT' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Divisi</label>
                  <select
                    value={form.target_id}
                    onChange={e => setForm({ ...form, target_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  >
                    <option value="">Pilih Divisi Target</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Isi Pesan Pengumuman *</label>
                <textarea
                  rows={4}
                  required
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Tuliskan detail pengumuman secara lengkap..."
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#800020] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6A041C]"
                >
                  Publikasikan Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
