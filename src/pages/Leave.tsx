/**
 * Leave & Permission (Cuti & Izin) Module for GOC Team Management
 * Submission form, Approval / Rejection Workflow with Notes
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { LeaveRequest, LeaveType, LeaveStatus } from '../types/index.ts';
import {
  Palmtree,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  User,
  X,
  MessageSquare,
} from 'lucide-react';

interface EnrichedLeave extends LeaveRequest {
  employee_name?: string;
  employee_photo?: string;
  department_name?: string;
  approver_name?: string | null;
}

export function Leave() {
  const { session, hasPermission, isOwner } = useAuth();
  const [leaves, setLeaves] = useState<EnrichedLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<EnrichedLeave | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    type: 'CUTI' as LeaveType,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    total_days: 1,
    reason: '',
    attachment_name: '',
  });

  const canApprove = hasPermission('leave.approve') || isOwner;

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<EnrichedLeave[]>('/api/leave');
      setLeaves(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest('/api/leave', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowApplyModal(false);
      setForm({
        type: 'CUTI',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        total_days: 1,
        reason: '',
        attachment_name: '',
      });
      fetchLeaves();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openApproveReject = (leave: EnrichedLeave, type: 'APPROVE' | 'REJECT') => {
    setSelectedLeave(leave);
    setActionType(type);
    setApprovalNotes(type === 'APPROVE' ? 'Disetujui.' : '');
    setShowActionModal(true);
  };

  const handleProcessAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;

    if (actionType === 'REJECT' && !approvalNotes.trim()) {
      alert('Alasan penolakan wajib dicantumkan.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = actionType === 'APPROVE'
        ? `/api/leave/${selectedLeave.id}/approve`
        : `/api/leave/${selectedLeave.id}/reject`;

      await apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify({ notes: approvalNotes }),
      });

      setShowActionModal(false);
      fetchLeaves();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLeaves = leaves.filter(l => {
    if (statusFilter === 'ALL') return true;
    return l.status === statusFilter;
  });

  const getStatusBadge = (st: LeaveStatus) => {
    switch (st) {
      case 'APPROVED':
        return <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">DISETUJUI</span>;
      case 'REJECTED':
        return <span className="rounded-full bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 text-[10px] font-bold">DITOLAK</span>;
      case 'PENDING':
        return <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold">MENUNGGU</span>;
      case 'CANCELLED':
        return <span className="rounded-full bg-gray-100 text-gray-600 px-2.5 py-0.5 text-[10px] font-bold">DIBATALKAN</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Palmtree className="h-6 w-6 text-[#800020]" />
            <span>Pengajuan Cuti & Izin Kerja</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Pengajuan cuti tahunan, izin darurat, sakit, dan persetujuan oleh Penanggung Jawab / Owner.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {hasPermission('leave.create') && (
            <button
              onClick={() => setShowApplyModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#800020] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>+ Ajukan Cuti/Izin</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === st
                ? 'bg-[#800020] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {st === 'ALL' ? 'Semua Status' : st}
          </button>
        ))}
      </div>

      {/* List Table */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#800020] border-t-transparent mb-2" />
            <p>Memuat data cuti & izin...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-16 text-center">
            <Palmtree className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p className="text-sm font-bold text-gray-800">Belum ada data pengajuan cuti.</p>
            <p className="text-xs text-gray-400 mt-1">Gunakan tombol ajukan cuti untuk mengirim permohonan baru.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Karyawan</th>
                    <th className="px-4 py-3.5">Jenis</th>
                    <th className="px-4 py-3.5">Periode & Durasi</th>
                    <th className="px-4 py-3.5">Alasan</th>
                    <th className="px-4 py-3.5">Status & Catatan</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeaves.map(leave => (
                    <tr key={leave.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={leave.employee_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={leave.employee_name}
                            className="h-9 w-9 rounded-full object-cover border border-gray-200"
                          />
                          <div>
                            <p className="font-bold text-gray-900 leading-snug">{leave.employee_name}</p>
                            <p className="text-[10px] text-gray-400">{leave.department_name}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-gray-800">
                        <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px]">
                          {leave.type}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-gray-800">{leave.start_date} s/d {leave.end_date}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{leave.total_days} Hari Kerja</p>
                      </td>

                      <td className="px-4 py-3.5 text-gray-600 max-w-xs">
                        <p className="line-clamp-2 leading-relaxed">{leave.reason}</p>
                        {leave.attachment_name && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#800020] font-semibold mt-1">
                            <FileText className="h-3 w-3" />
                            <span>{leave.attachment_name}</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {getStatusBadge(leave.status)}
                        {leave.approval_notes && (
                          <p className="text-[10px] text-gray-500 mt-1 italic">
                            "{leave.approval_notes}" {leave.approver_name && `(${leave.approver_name})`}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {canApprove && leave.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openApproveReject(leave, 'APPROVE')}
                              className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => openApproveReject(leave, 'REJECT')}
                              className="rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 transition-colors"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">Selesai diproses</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden p-3 space-y-3">
              {filteredLeaves.map(leave => (
                <div key={leave.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={leave.employee_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={leave.employee_name}
                        className="h-10 w-10 rounded-full object-cover border border-gray-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-900 truncate">{leave.employee_name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{leave.department_name}</p>
                      </div>
                    </div>
                    {getStatusBadge(leave.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-50">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                      {leave.type}
                    </span>
                    <span className="text-[11px] font-bold text-[#800020]">
                      {leave.total_days} Hari Kerja
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-600 space-y-1">
                    <p className="font-medium text-gray-800">
                      📅 {leave.start_date} s/d {leave.end_date}
                    </p>
                    <p className="line-clamp-2 leading-relaxed bg-gray-50/70 p-2 rounded-xl border border-gray-100">
                      {leave.reason}
                    </p>
                    {leave.attachment_name && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#800020] font-semibold">
                        <FileText className="h-3 w-3" />
                        <span>{leave.attachment_name}</span>
                      </span>
                    )}
                    {leave.approval_notes && (
                      <p className="text-[10px] text-gray-500 italic">
                        Catatan: "{leave.approval_notes}" {leave.approver_name && `(${leave.approver_name})`}
                      </p>
                    )}
                  </div>

                  {canApprove && leave.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => openApproveReject(leave, 'REJECT')}
                        className="flex-1 py-1.5 rounded-xl bg-red-50 text-[11px] font-bold text-red-700 hover:bg-red-100 text-center transition-colors"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => openApproveReject(leave, 'APPROVE')}
                        className="flex-1 py-1.5 rounded-xl bg-emerald-600 text-[11px] font-bold text-white hover:bg-emerald-700 text-center transition-colors shadow-xs"
                      >
                        Setujui
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL PENGAJUAN CUTI & IZIN                              */}
      {/* ======================================================== */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Form Pengajuan Cuti / Izin</h3>
              <button onClick={() => setShowApplyModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApply} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Pengajuan *</label>
                <select
                  required
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as LeaveType })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                >
                  <option value="CUTI">Cuti Tahunan</option>
                  <option value="IZIN">Izin Tidak Masuk</option>
                  <option value="SAKIT">Sakit (Dengan/Tanpa Surat Dokter)</option>
                  <option value="KEPERLUAN_PRIBADI">Keperluan Pribadi / Keluarga</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Mulai *</label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Selesai *</label>
                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Total Hari Kerja</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.total_days}
                    onChange={e => setForm({ ...form, total_days: parseInt(e.target.value) || 1 })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lampiran (Opsional)</label>
                  <input
                    type="text"
                    value={form.attachment_name}
                    onChange={e => setForm({ ...form, attachment_name: e.target.value })}
                    placeholder="cth: surat_dokter.pdf"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alasan Pengajuan *</label>
                <textarea
                  rows={3}
                  required
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="Jelaskan keperluan cuti/izin secara lengkap"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#800020] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] disabled:opacity-50"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL APPROVE / REJECT                                   */}
      {/* ======================================================== */}
      {showActionModal && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {actionType === 'APPROVE' ? 'Setujui Pengajuan Cuti' : 'Tolak Pengajuan Cuti'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Karyawan: <strong>{selectedLeave.employee_name}</strong> ({selectedLeave.total_days} hari, {selectedLeave.start_date})
            </p>

            <form onSubmit={handleProcessAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Catatan Persetujuan / Alasan Penolakan {actionType === 'REJECT' && '*'}
                </label>
                <textarea
                  rows={3}
                  required={actionType === 'REJECT'}
                  value={approvalNotes}
                  onChange={e => setApprovalNotes(e.target.value)}
                  placeholder={actionType === 'APPROVE' ? 'Catatan tambahan (opsional)' : 'Tuliskan alasan penolakan...'}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50 ${
                    actionType === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'Memproses...' : actionType === 'APPROVE' ? 'Setujui Sekarang' : 'Tolak Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
