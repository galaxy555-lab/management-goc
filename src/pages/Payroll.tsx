/**
 * Payroll Management Module for GOC Team Management
 * High Security: Strict Permissions, Privacy for Owner, Slip Gaji Generator
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { PayrollRecord, PayrollStatus, EmployeeWithRelations } from '../types/index.ts';
import {
  Wallet,
  Plus,
  Printer,
  ShieldCheck,
  Lock,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit,
  X,
  FileCheck,
} from 'lucide-react';

interface EnrichedPayroll extends PayrollRecord {
  employee_name?: string;
  employee_number?: string;
  department_name?: string;
  position_name?: string;
}

export function Payroll() {
  const { session, hasPermission, isOwner } = useAuth();
  const [payrolls, setPayrolls] = useState<EnrichedPayroll[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('Oktober 2026');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<EnrichedPayroll | null>(null);

  // Form State
  const [form, setForm] = useState({
    employee_id: '',
    period: 'Oktober 2026',
    base_salary: 5000000,
    allowance: 1000000,
    bonus: 500000,
    deduction: 0,
    notes: '',
    is_private: false,
  });

  const [submitting, setSubmitting] = useState(false);

  // Access check
  const canViewPayroll = hasPermission('payroll.view') || isOwner;
  const canManagePayroll = hasPermission('payroll.create') || isOwner;

  const fetchPayrollData = async () => {
    if (!canViewPayroll) return;
    try {
      setLoading(true);
      const [payRes, empRes] = await Promise.all([
        apiRequest<EnrichedPayroll[]>('/api/payroll'),
        apiRequest<EmployeeWithRelations[]>('/api/employees?status=ACTIVE'),
      ]);
      setPayrolls(payRes);
      setEmployees(empRes);
      if (empRes.length > 0 && !form.employee_id) {
        setForm(prev => ({ ...prev, employee_id: empRes[0].id }));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [canViewPayroll]);

  if (!canViewPayroll) {
    return (
      <div className="rounded-3xl border border-red-100 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-3">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Akses Terbatas: Data Payroll Rahasia</h2>
        <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
          Halaman penggajian (payroll) bersifat rahasia dan hanya dapat diakses oleh Owner atau staff Finance yang memiliki izin khusus.
        </p>
      </div>
    );
  }

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest('/api/payroll', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowAddModal(false);
      fetchPayrollData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (payrollId: string, status: PayrollStatus) => {
    try {
      await apiRequest(`/api/payroll/${payrollId}`, {
        method: 'PUT',
        body: JSON.stringify({
          payment_status: status,
          payment_date: status === 'PAID' ? new Date().toISOString().split('T')[0] : null,
        }),
      });
      fetchPayrollData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePayroll = async (id: string) => {
    if (!confirm('Hapus data payroll ini?')) return;
    try {
      await apiRequest(`/api/payroll/${id}`, { method: 'DELETE' });
      fetchPayrollData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalCalculated = form.base_salary + form.allowance + form.bonus - form.deduction;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Wallet className="h-6 w-6 text-[#800020]" />
            <span>Manajemen Penggajian (Payroll)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Kelola rincian gaji pokok, tunjangan, insentif lembur, dan slip gaji internal tim GOC.
          </p>
        </div>

        {canManagePayroll && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#800020] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>+ Buat Slip Payroll</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold text-gray-500">Total Pengeluaran Gaji (PAID)</span>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            Rp {payrolls.filter(p => p.payment_status === 'PAID').reduce((acc, c) => acc + c.total_salary, 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Telah ditransfer ke rekening tim</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold text-gray-500">Gaji Dalam Proses (PROCESS / DRAFT)</span>
          <p className="mt-2 text-2xl font-black text-amber-600">
            Rp {payrolls.filter(p => p.payment_status !== 'PAID').reduce((acc, c) => acc + c.total_salary, 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Menunggu approval & pembayaran</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold text-gray-500">Total Slip Tercatat</span>
          <p className="mt-2 text-2xl font-black text-gray-800">{payrolls.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Semua data penggajian</p>
        </div>
      </div>

      {/* List Table */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#800020] border-t-transparent mb-2" />
            <p>Memuat data payroll...</p>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="py-16 text-center">
            <Wallet className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p className="text-sm font-bold text-gray-800">Belum ada slip gaji.</p>
            <p className="text-xs text-gray-400 mt-1">Buat slip gaji pertama untuk periode aktif.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Karyawan & Divisi</th>
                    <th className="px-4 py-3.5">Periode</th>
                    <th className="px-4 py-3.5">Gaji Pokok</th>
                    <th className="px-4 py-3.5">Tunjangan & Bonus</th>
                    <th className="px-4 py-3.5">Total Gaji Net</th>
                    <th className="px-4 py-3.5">Status Pembayaran</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payrolls.map(pay => (
                    <tr key={pay.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{pay.employee_name}</span>
                          {pay.is_private && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.2 text-[9px] font-bold text-gray-600 border border-gray-200">
                              PRIVATE
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">{pay.position_name} &bull; {pay.department_name}</p>
                      </td>

                      <td className="px-4 py-3.5 font-medium text-gray-700">
                        {pay.period}
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-gray-900 font-mono">
                        Rp {pay.base_salary.toLocaleString('id-ID')}
                      </td>

                      <td className="px-4 py-3.5 text-gray-600 font-mono">
                        + Rp {(pay.allowance + pay.bonus).toLocaleString('id-ID')}
                        {pay.deduction > 0 && <span className="text-red-500 ml-1">(- Rp {pay.deduction.toLocaleString('id-ID')})</span>}
                      </td>

                      <td className="px-4 py-3.5 font-extrabold text-[#800020] font-mono text-sm">
                        Rp {pay.total_salary.toLocaleString('id-ID')}
                      </td>

                      <td className="px-4 py-3.5">
                        <select
                          disabled={!canManagePayroll}
                          value={pay.payment_status}
                          onChange={e => handleUpdateStatus(pay.id, e.target.value as PayrollStatus)}
                          className={`rounded-lg px-2 py-1 text-[10px] font-bold outline-hidden ${
                            pay.payment_status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : pay.payment_status === 'PROCESS'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="PROCESS">PROCESS</option>
                          <option value="PAID">PAID (LUNAS)</option>
                        </select>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedSlip(pay);
                              setShowSlipModal(true);
                            }}
                            title="Cetak / Preview Slip Gaji"
                            className="rounded-lg bg-gray-100 p-1.5 text-gray-600 hover:text-[#800020] hover:bg-[#FDF2F8]"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {canManagePayroll && (
                            <button
                              onClick={() => handleDeletePayroll(pay.id)}
                              title="Hapus Slip"
                              className="rounded-lg bg-gray-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden p-3 space-y-3">
              {payrolls.map(pay => (
                <div key={pay.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                        <span>{pay.employee_name}</span>
                        {pay.is_private && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.2 text-[9px] font-bold text-gray-600">
                            PRIVAT
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {pay.position_name} &bull; {pay.department_name}
                      </p>
                    </div>

                    <select
                      disabled={!canManagePayroll}
                      value={pay.payment_status}
                      onChange={e => handleUpdateStatus(pay.id, e.target.value as PayrollStatus)}
                      className={`rounded-lg px-2 py-1 text-[10px] font-bold outline-hidden ${
                        pay.payment_status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : pay.payment_status === 'PROCESS'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PROCESS">PROCESS</option>
                      <option value="PAID">PAID</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-gray-50/80 rounded-xl">
                    <span className="text-[11px] text-gray-500 font-medium">Periode: {pay.period}</span>
                    <span className="text-xs font-black text-[#800020] font-mono">
                      Rp {pay.total_salary.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="text-[10px] text-gray-500 space-y-0.5 font-mono px-1">
                    <div className="flex justify-between">
                      <span>Gaji Pokok:</span>
                      <span>Rp {pay.base_salary.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Tunjangan & Bonus:</span>
                      <span>+ Rp {(pay.allowance + pay.bonus).toLocaleString('id-ID')}</span>
                    </div>
                    {pay.deduction > 0 && (
                      <div className="flex justify-between text-red-500">
                        <span>Potongan:</span>
                        <span>- Rp {pay.deduction.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedSlip(pay);
                        setShowSlipModal(true);
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-pink-50 border border-pink-200 px-3 py-1.5 text-xs font-bold text-[#800020] hover:bg-pink-100"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Cetak / Slip</span>
                    </button>

                    {canManagePayroll && (
                      <button
                        onClick={() => handleDeletePayroll(pay.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL BUAT SLIP PAYROLL BARU                             */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Buat Slip Gaji / Payroll</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayroll} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Karyawan *</label>
                  <select
                    required
                    value={form.employee_id}
                    onChange={e => setForm({ ...form, employee_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.full_name} ({e.position?.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Periode Gaji *</label>
                  <input
                    type="text"
                    required
                    value={form.period}
                    onChange={e => setForm({ ...form, period: e.target.value })}
                    placeholder="cth: Oktober 2026"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Gaji Pokok (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.base_salary}
                    onChange={e => setForm({ ...form, base_salary: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tunjangan Operasional (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.allowance}
                    onChange={e => setForm({ ...form, allowance: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Bonus / Insentif (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.bonus}
                    onChange={e => setForm({ ...form, bonus: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Potongan / Kasbon (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.deduction}
                    onChange={e => setForm({ ...form, deduction: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-[#FDF2F8] p-3 text-xs flex items-center justify-between border border-[#FBCFE8]">
                <span className="font-bold text-[#800020]">Total Gaji Net:</span>
                <span className="text-base font-black text-[#800020]">
                  Rp {totalCalculated.toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Keterangan lembur, tunjangan kehadiran, dsb."
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
                  disabled={submitting}
                  className="rounded-xl bg-[#800020] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Slip Gaji'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PREVIEW SLIP GAJI (PRINTABLE MEDICAL SLIP)         */}
      {/* ======================================================== */}
      {showSlipModal && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-200">
            {/* Printable Slip Paper Styling */}
            <div className="border-b-2 border-dashed border-gray-300 pb-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#800020] text-white text-xs font-extrabold">
                  GOC
                </div>
                <h3 className="text-sm font-black text-gray-900 tracking-tight">GALAXY ORTHODONTIC CENTER</h3>
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Slip Pembayaran Gaji Karyawan</p>
              <p className="text-xs font-bold text-[#800020] mt-1">{selectedSlip.period}</p>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Nama Penerima:</span>
                <span className="font-bold text-gray-900">{selectedSlip.employee_name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Nomor Karyawan:</span>
                <span className="font-mono text-gray-900 font-semibold">{selectedSlip.employee_number}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Jabatan & Divisi:</span>
                <span className="text-gray-900 font-semibold">{selectedSlip.position_name} ({selectedSlip.department_name})</span>
              </div>

              <div className="pt-2 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gaji Pokok:</span>
                  <span>Rp {selectedSlip.base_salary.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tunjangan Operasional:</span>
                  <span>Rp {selectedSlip.allowance.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bonus & Insentif:</span>
                  <span>Rp {selectedSlip.bonus.toLocaleString('id-ID')}</span>
                </div>
                {selectedSlip.deduction > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Potongan:</span>
                    <span>- Rp {selectedSlip.deduction.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t-2 border-gray-900 flex justify-between font-extrabold text-sm text-[#800020]">
                <span>TOTAL DITERIMA (NET):</span>
                <span>Rp {selectedSlip.total_salary.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between text-[11px] text-gray-500 pt-1">
                <span>Status Pembayaran:</span>
                <span className="font-bold text-emerald-600">{selectedSlip.payment_status}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Slip</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSlipModal(false)}
                className="rounded-xl bg-[#800020] px-4 py-2 text-xs font-bold text-white hover:bg-[#6A041C]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
