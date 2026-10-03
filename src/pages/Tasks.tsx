/**
 * Task Management Module for GOC Team Management
 * Kanban Board & List View, Comments Thread, Priority & Status Workflow
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { Task, TaskPriority, TaskStatus, EmployeeWithRelations, TaskComment } from '../types/index.ts';
import {
  CheckSquare,
  Plus,
  Filter,
  Clock,
  Calendar,
  AlertCircle,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  Trash2,
  Edit,
  Send,
  X,
  User,
} from 'lucide-react';

interface EnrichedTask extends Task {
  assignee_name?: string;
  assignee_photo?: string;
  creator_name?: string;
  comments_count?: number;
}

export function Tasks() {
  const { session, hasPermission, isOwner } = useAuth();
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTask, setActiveTask] = useState<EnrichedTask | null>(null);

  // Form State
  const [addForm, setAddForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'MEDIUM' as TaskPriority,
    deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    attachment_name: '',
  });

  // Comments State
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const [tRes, empRes] = await Promise.all([
        apiRequest<EnrichedTask[]>(`/api/tasks?status=${statusFilter}&priority=${priorityFilter}`),
        apiRequest<EmployeeWithRelations[]>('/api/employees?status=ACTIVE'),
      ]);
      setTasks(tRes);
      setEmployees(empRes);
      if (empRes.length > 0 && !addForm.assigned_to) {
        setAddForm(prev => ({ ...prev, assigned_to: empRes[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const fetchComments = async (taskId: string) => {
    try {
      const data = await apiRequest<TaskComment[]>(`/api/tasks/${taskId}/comments`);
      setComments(data);
    } catch {
      // Ignore
    }
  };

  const handleOpenDetail = (task: EnrichedTask) => {
    setActiveTask(task);
    fetchComments(task.id);
    setShowDetailModal(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(addForm),
      });
      setShowAddModal(false);
      setAddForm({
        title: '',
        description: '',
        assigned_to: employees[0]?.id || '',
        priority: 'MEDIUM',
        deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        attachment_name: '',
      });
      fetchTasks();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (activeTask && activeTask.id === taskId) {
        setActiveTask({ ...activeTask, status: newStatus });
      }
      fetchTasks();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return;
    try {
      await apiRequest(`/api/tasks/${taskId}`, { method: 'DELETE' });
      setShowDetailModal(false);
      fetchTasks();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !newComment.trim()) return;
    setCommentLoading(true);
    try {
      const created = await apiRequest<TaskComment>(`/api/tasks/${activeTask.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment: newComment }),
      });
      setComments(prev => [...prev, created]);
      setNewComment('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  const KANBAN_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'TODO', label: 'Belum Dikerjakan (TODO)', color: 'bg-gray-100 text-gray-700' },
    { id: 'IN_PROGRESS', label: 'Sedang Dikerjakan', color: 'bg-blue-50 text-blue-700' },
    { id: 'REVIEW', label: 'Menunggu Review', color: 'bg-purple-50 text-purple-700' },
    { id: 'DONE', label: 'Selesai (DONE)', color: 'bg-emerald-50 text-emerald-700' },
  ];

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'URGENT':
        return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">URGENT</span>;
      case 'HIGH':
        return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">HIGH</span>;
      case 'MEDIUM':
        return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">MEDIUM</span>;
      case 'LOW':
        return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-600">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <CheckSquare className="h-6 w-6 text-[#800020]" />
            <span>Manajemen Tugas & Proyek</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor progres kerja, delegasikan tanggung jawab klinis, dan koordinasi tim.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'kanban' ? 'bg-white text-[#800020] shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Kanban
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

          {hasPermission('task.create') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#800020] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>+ Buat Tugas</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-2.5">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-hidden"
        >
          <option value="ALL">Semua Status</option>
          <option value="TODO">TODO</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="REVIEW">REVIEW</option>
          <option value="DONE">DONE</option>
        </select>

        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-hidden"
        >
          <option value="ALL">Semua Prioritas</option>
          <option value="URGENT">URGENT</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>
      </div>

      {/* Main Content: Kanban or List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#800020] border-t-transparent mb-2" />
          <p>Memuat daftar tugas...</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);

            return (
              <div key={col.id} className="rounded-3xl border border-gray-200/80 bg-gray-50/50 p-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
                  <span className={`rounded-xl px-2.5 py-1 text-xs font-bold ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-xs font-bold text-gray-400">{colTasks.length}</span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
                  {colTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                      Kosong
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => handleOpenDetail(task)}
                        className="cursor-pointer rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs hover:shadow-md hover:border-[#800020]/30 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          {getPriorityBadge(task.priority)}
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3" />
                            {task.deadline}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">
                          {task.title}
                        </h4>

                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <img
                              src={task.assignee_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={task.assignee_name}
                              className="h-6 w-6 rounded-full object-cover border border-gray-200"
                            />
                            <span className="text-[11px] font-semibold text-gray-700 truncate max-w-[100px]">
                              {task.assignee_name}
                            </span>
                          </div>

                          {task.comments_count ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400">
                              <MessageSquare className="h-3 w-3" />
                              {task.comments_count}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-3xl border border-gray-100 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Tugas</th>
                  <th className="px-4 py-3">Ditugaskan Kepada</th>
                  <th className="px-4 py-3">Prioritas</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900">{t.title}</p>
                      <p className="text-[11px] text-gray-500 line-clamp-1">{t.description}</p>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-gray-800">
                      {t.assignee_name}
                    </td>
                    <td className="px-4 py-3.5">
                      {getPriorityBadge(t.priority)}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 font-medium">
                      {t.deadline}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-700">
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenDetail(t)}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-[#800020] hover:bg-[#FDF2F8]"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL BUAT TUGAS BARU                                    */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Buat Tugas Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Judul Tugas *</label>
                <input
                  type="text"
                  required
                  value={addForm.title}
                  onChange={e => setAddForm({ ...addForm, title: e.target.value })}
                  placeholder="Ringkasan tugas atau instruksi kerja"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi & Rincian</label>
                <textarea
                  rows={3}
                  value={addForm.description}
                  onChange={e => setAddForm({ ...addForm, description: e.target.value })}
                  placeholder="Detail pelaksanaan, target pengerjaan, dsb."
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Penerima Tugas (Assignee) *</label>
                  <select
                    required
                    value={addForm.assigned_to}
                    onChange={e => setAddForm({ ...addForm, assigned_to: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.full_name} ({e.position?.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tingkat Prioritas</label>
                  <select
                    value={addForm.priority}
                    onChange={e => setAddForm({ ...addForm, priority: e.target.value as TaskPriority })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Batas Waktu (Deadline) *</label>
                  <input
                    type="date"
                    required
                    value={addForm.deadline}
                    onChange={e => setAddForm({ ...addForm, deadline: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Lampiran File (Nama File)</label>
                  <input
                    type="text"
                    value={addForm.attachment_name}
                    onChange={e => setAddForm({ ...addForm, attachment_name: e.target.value })}
                    placeholder="cth: SOP_sterilisasi.pdf"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>
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
                  Simpan & Tugaskan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETAIL TUGAS & KOMENTAR DISKUSI                    */}
      {/* ======================================================== */}
      {showDetailModal && activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-xl rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  {getPriorityBadge(activeTask.priority)}
                  <span className="text-xs text-gray-400">Deadline: {activeTask.deadline}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 leading-snug">{activeTask.title}</h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Deskripsi Tugas</p>
                <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  {activeTask.description || 'Tidak ada keterangan rincian.'}
                </p>
              </div>

              {/* Status Updater */}
              <div className="rounded-2xl border border-gray-100 p-3 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-gray-800">Status Saat Ini: </span>
                  <span className="text-xs font-extrabold text-[#800020] ml-1">{activeTask.status}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as TaskStatus[]).map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(activeTask.id, st)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                        activeTask.status === st
                          ? 'bg-[#800020] text-white shadow-xs'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diskusi Komentar */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-[#800020]" />
                  <span>Diskusi & Catatan ({comments.length})</span>
                </p>

                <div className="max-h-48 overflow-y-auto space-y-2 mb-3 pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-gray-400 py-3 text-center italic">Belum ada komentar.</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="rounded-xl bg-gray-50 p-2.5 text-xs border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-900">{c.user_name}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-700">{c.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Tulis tanggapan atau catatan progres..."
                    className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="rounded-xl bg-[#800020] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#6A041C] disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {hasPermission('task.delete') ? (
                <button
                  type="button"
                  onClick={() => handleDeleteTask(activeTask.id)}
                  className="rounded-xl px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus Tugas</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200"
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
