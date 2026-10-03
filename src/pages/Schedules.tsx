/**
 * Schedule & Calendar Module for GOC Team Management
 * Shifts, Meetings, Clinic Events, and Holidays
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { Schedule, ScheduleType, EmployeeWithRelations } from '../types/index.ts';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2,
  X,
} from 'lucide-react';

interface EnrichedSchedule extends Schedule {
  assignedStaff?: { id: string; name: string; photo: string }[];
}

export function Schedules() {
  const { hasPermission } = useAuth();
  const [schedules, setSchedules] = useState<EnrichedSchedule[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // October 2026
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    type: 'SHIFT' as ScheduleType,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    start_time: '08:30',
    end_time: '16:30',
    user_ids: [] as string[],
    notes: '',
  });

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const [schRes, empRes] = await Promise.all([
        apiRequest<EnrichedSchedule[]>(`/api/schedules?type=${typeFilter}`),
        apiRequest<EmployeeWithRelations[]>('/api/employees?status=ACTIVE'),
      ]);
      setSchedules(schRes);
      setEmployees(empRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [typeFilter]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/schedules', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowAddModal(false);
      setForm({
        title: '',
        type: 'SHIFT',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        start_time: '08:30',
        end_time: '16:30',
        user_ids: [],
        notes: '',
      });
      fetchSchedules();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Hapus jadwal ini?')) return;
    try {
      await apiRequest(`/api/schedules/${id}`, { method: 'DELETE' });
      fetchSchedules();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleUserSelection = (empId: string) => {
    setForm(prev => ({
      ...prev,
      user_ids: prev.user_ids.includes(empId)
        ? prev.user_ids.filter(id => id !== empId)
        : [...prev.user_ids, empId],
    }));
  };

  // Calendar generation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getTypeBadge = (type: ScheduleType) => {
    switch (type) {
      case 'SHIFT':
        return <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[9px] font-bold">Shift Kerja</span>;
      case 'MEETING':
        return <span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-[9px] font-bold">Meeting</span>;
      case 'LIBUR':
        return <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[9px] font-bold">Libur Klinik</span>;
      case 'EVENT':
        return <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[9px] font-bold">Event</span>;
      default:
        return <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-[9px] font-bold">Jadwal</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="h-6 w-6 text-[#800020]" />
            <span>Jadwal & Agenda Klinik</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Jadwal shift kerja poli orthodonti, rapat tim, libur operasional, dan agenda dokter.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'calendar' ? 'bg-white text-[#800020] shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Kalender
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white text-[#800020] shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Daftar List
            </button>
          </div>

          {hasPermission('schedule.create') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#800020] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>+ Buat Jadwal</span>
            </button>
          )}
        </div>
      </div>

      {/* View: Calendar Grid or List */}
      {viewMode === 'calendar' ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-xs overflow-hidden">
          {/* Calendar Month Navigation Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h2 className="text-base font-extrabold text-gray-900 capitalize">{monthName}</h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevMonth}
                className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={nextMonth}
                className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="min-w-[580px]">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 uppercase py-2">
                <div>Min</div>
                <div>Sen</div>
                <div>Sel</div>
                <div>Rab</div>
                <div>Kam</div>
                <div>Jum</div>
                <div>Sab</div>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1.5 text-xs">
                {/* Empty slots before day 1 */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-24 rounded-2xl bg-gray-50/40 p-1" />
                ))}

                {/* Days in Month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const daySchedules = schedules.filter(s => s.start_date === dateString);

                  return (
                    <div
                      key={`day-${dayNum}`}
                      className="min-h-24 rounded-2xl border border-gray-100 bg-white p-2 hover:border-[#800020]/30 transition-all flex flex-col justify-between"
                    >
                      <span className="font-bold text-gray-700 text-[11px]">{dayNum}</span>

                      <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-16">
                        {daySchedules.map(sch => (
                          <div
                            key={sch.id}
                            className={`rounded-lg p-1 text-[9px] font-semibold truncate ${
                              sch.type === 'SHIFT'
                                ? 'bg-blue-50 text-blue-800'
                                : sch.type === 'LIBUR'
                                ? 'bg-red-50 text-red-800'
                                : 'bg-purple-50 text-purple-800'
                            }`}
                            title={`${sch.title} (${sch.start_time} - ${sch.end_time})`}
                          >
                            {sch.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {schedules.map(sch => (
            <div
              key={sch.id}
              className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getTypeBadge(sch.type)}
                  <span className="text-xs text-gray-400 font-medium">
                    {sch.start_date} {sch.end_date !== sch.start_date ? `s/d ${sch.end_date}` : ''} &bull; {sch.start_time} - {sch.end_time} WIB
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900">{sch.title}</h3>
                {sch.notes && <p className="text-xs text-gray-500">{sch.notes}</p>}

                {sch.assignedStaff && sch.assignedStaff.length > 0 && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Petugas:</span>
                    <div className="flex -space-x-1.5">
                      {sch.assignedStaff.map(staff => (
                        <img
                          key={staff.id}
                          src={staff.photo}
                          alt={staff.name}
                          title={staff.name}
                          className="h-6 w-6 rounded-full object-cover border border-white"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {hasPermission('schedule.delete') && (
                <button
                  onClick={() => handleDeleteSchedule(sch.id)}
                  className="rounded-lg p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors self-end sm:self-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TAMBAH JADWAL                                      */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Buat Jadwal / Shift Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Jadwal / Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="cth: Shift Pagi Poli Orthodonti"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Jadwal</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as ScheduleType })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  >
                    <option value="SHIFT">Shift Kerja</option>
                    <option value="MEETING">Meeting Tim</option>
                    <option value="LIBUR">Libur Operasional</option>
                    <option value="EVENT">Event / Acara</option>
                    <option value="JADWAL_KERJA">Jadwal Kerja Reguler</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value, end_date: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={e => setForm({ ...form, start_time: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={e => setForm({ ...form, end_time: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>
              </div>

              {/* Assign Staff Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Petugas / Anggota yang Bertugas:</label>
                <div className="max-h-36 overflow-y-auto rounded-xl border border-gray-200 p-2 space-y-1">
                  {employees.map(e => {
                    const isChecked = form.user_ids.includes(e.id);
                    return (
                      <label key={e.id} className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleUserSelection(e.id)}
                          className="h-3.5 w-3.5 rounded text-[#800020] focus:ring-[#800020]"
                        />
                        <span className="font-semibold text-gray-800">{e.full_name}</span>
                        <span className="text-[10px] text-gray-400">({e.position?.name})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan / Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Instruksi khusus, lokasi ruang, dsb."
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
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
