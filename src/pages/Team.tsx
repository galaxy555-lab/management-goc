/**
 * Team GOC Management (Karyawan & Staff)
 * Complete CRUD, Granular Permission Matrix, Soft/Permanent Delete with Safeguards
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import {
  EmployeeWithRelations,
  Department,
  Position,
  Role,
  Permission,
  EmployeeStatus,
} from '../types/index.ts';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Shield,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Phone,
  Mail,
  Calendar,
  Building,
  Briefcase,
  X,
  UserCheck,
  UserX,
} from 'lucide-react';

export function Team() {
  const { session, isOwner, hasPermission } = useAuth();
  const [employees, setEmployees] = useState<EmployeeWithRelations[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [activeEmployee, setActiveEmployee] = useState<EmployeeWithRelations | null>(null);

  // Add Employee Form State
  const [addForm, setAddForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    department_id: '',
    position_id: '',
    manager_id: '',
    role_id: 'karyawan',
    join_date: new Date().toISOString().split('T')[0],
    status: 'ACTIVE' as EmployeeStatus,
    photo: '',
    notes: '',
  });

  // Edit Employee Form State
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    department_id: '',
    position_id: '',
    manager_id: '',
    join_date: '',
    status: 'ACTIVE' as EmployeeStatus,
    photo: '',
    notes: '',
    new_password: '',
  });

  // Access / Permission Modal State
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [grantedPerms, setGrantedPerms] = useState<string[]>([]);
  const [isOwnerTarget, setIsOwnerTarget] = useState(false);

  // Delete Modal State
  const [deleteType, setDeleteType] = useState<'soft' | 'permanent'>('soft');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);

  // Notifications / Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, deptRes, posRes, roleRes, permRes] = await Promise.all([
        apiRequest<EmployeeWithRelations[]>(`/api/employees?search=${search}&department=${selectedDept}&status=${selectedStatus}`),
        apiRequest<Department[]>('/api/departments'),
        apiRequest<Position[]>('/api/positions'),
        apiRequest<Role[]>('/api/roles'),
        apiRequest<Permission[]>('/api/permissions'),
      ]);

      setEmployees(empRes);
      setDepartments(deptRes);
      setPositions(posRes);
      setRoles(roleRes);
      setAllPermissions(permRes);

      if (deptRes.length > 0 && !addForm.department_id) {
        setAddForm(prev => ({
          ...prev,
          department_id: deptRes[0].id,
          position_id: posRes.find(p => p.department_id === deptRes[0].id)?.id || posRes[0]?.id || '',
        }));
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat data tim.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedDept, selectedStatus]);

  // Auto clear toast feedback after 4 seconds
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  // Handle Add Employee Submit (Section 11)
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiRequest('/api/employees', {
        method: 'POST',
        body: JSON.stringify(addForm),
      });

      setFeedback({ type: 'success', message: 'Karyawan dan akun login berhasil dibuat.' });
      setShowAddModal(false);
      // Reset form
      setAddForm({
        full_name: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        department_id: departments[0]?.id || '',
        position_id: positions[0]?.id || '',
        manager_id: '',
        role_id: 'karyawan',
        join_date: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        photo: '',
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (emp: EmployeeWithRelations) => {
    setActiveEmployee(emp);
    setEditForm({
      full_name: emp.full_name,
      email: emp.email,
      phone: emp.phone,
      department_id: emp.department_id,
      position_id: emp.position_id,
      manager_id: emp.manager_id || '',
      join_date: emp.join_date,
      status: emp.status,
      photo: emp.photo,
      notes: emp.notes,
      new_password: '',
    });
    setShowEditModal(true);
  };

  // Handle Edit Employee Submit (Section 12)
  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee) return;
    setActionLoading(true);
    try {
      await apiRequest(`/api/employees/${activeEmployee.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });

      setFeedback({ type: 'success', message: 'Data karyawan berhasil diperbarui.' });
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Access Permission Modal (Section 16)
  const openAccessModal = async (emp: EmployeeWithRelations) => {
    setActiveEmployee(emp);
    if (!emp.user) return;
    setTargetUserId(emp.user.id);
    setActionLoading(true);
    try {
      const res = await apiRequest<{
        userId: string;
        roleId: string;
        isOwner: boolean;
        effectivePermissions: string[];
      }>(`/api/users/${emp.user.id}/permissions`);

      setGrantedPerms(res.effectivePermissions);
      setIsOwnerTarget(res.isOwner);
      setShowAccessModal(true);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle specific permission checkbox
  const togglePermission = (permId: string) => {
    if (isOwnerTarget) return; // Owner always has all
    setGrantedPerms(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  // Save Permissions
  const handleSavePermissions = async () => {
    if (!targetUserId) return;
    setActionLoading(true);
    try {
      await apiRequest(`/api/users/${targetUserId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ grantedPermissions: grantedPerms }),
      });

      setFeedback({ type: 'success', message: 'Hak akses karyawan berhasil diperbarui.' });
      setShowAccessModal(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (emp: EmployeeWithRelations) => {
    setActiveEmployee(emp);
    setDeleteType('soft');
    setOwnerPassword('');
    setConfirmName('');
    setConfirmCheckbox(false);
    setShowDeleteModal(true);
  };

  // Handle Delete (Section 14: Soft or Permanent Delete with Super Admin protections)
  const handleDelete = async () => {
    if (!activeEmployee) return;
    setActionLoading(true);
    try {
      if (deleteType === 'soft') {
        await apiRequest(`/api/employees/${activeEmployee.id}`, {
          method: 'DELETE',
        });
        setFeedback({ type: 'success', message: `Karyawan ${activeEmployee.full_name} berhasil dinonaktifkan.` });
      } else {
        await apiRequest(`/api/employees/${activeEmployee.id}`, {
          method: 'DELETE',
          body: JSON.stringify({
            permanent: true,
            ownerPassword,
            confirmName,
          }),
        });
        setFeedback({ type: 'success', message: `Data karyawan ${activeEmployee.full_name} telah dihapus permanen.` });
      }
      setShowDeleteModal(false);
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Quick toggle status: Activate or Deactivate
  const handleQuickToggleStatus = async (emp: EmployeeWithRelations) => {
    const nextStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await apiRequest(`/api/employees/${emp.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setFeedback({
        type: 'success',
        message: `Status ${emp.full_name} diubah menjadi ${nextStatus}.`,
      });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Group permissions by module for clean rendering
  const permsByModule = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold shadow-lg flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-[#800020]" />
            <span>Team GOC (Karyawan)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Kelola data anggota tim Galaxy Orthodontic Center, status kepegawaian, dan hak akses.
          </p>
        </div>

        {hasPermission('team.create') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#800020] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#800020]/20 hover:bg-[#6A041C] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>+ Tambah Karyawan</span>
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama, nomor karyawan, atau email..."
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs pl-9 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-hidden"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:border-[#800020] outline-hidden"
          >
            <option value="ALL">Semua Divisi</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:border-[#800020] outline-hidden"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="RESIGNED">RESIGNED</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {/* Employees Table (Desktop) / Cards (Mobile) */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#800020] border-t-transparent mb-2" />
            <p>Memuat data tim GOC...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p className="text-sm font-bold text-gray-800">Belum ada data karyawan.</p>
            <p className="text-xs text-gray-400 mt-1">Gunakan tombol tambah karyawan untuk memulai.</p>
            {hasPermission('team.create') && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 rounded-xl bg-[#800020] px-4 py-2 text-xs font-bold text-white hover:bg-[#6A041C]"
              >
                + Tambah Karyawan Baru
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Karyawan</th>
                    <th className="px-4 py-3.5">Jabatan & Divisi</th>
                    <th className="px-4 py-3.5">Atasan Langsung</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Bergabung</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {employees.map(emp => {
                    const isSuperAdmin = emp.user?.role_id === 'owner';

                    return (
                      <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={emp.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={emp.full_name}
                              className="h-10 w-10 rounded-full object-cover border border-gray-200"
                            />
                            <div>
                              <p className="font-bold text-gray-900 leading-snug flex items-center gap-1.5">
                                <span>{emp.full_name}</span>
                                {isSuperAdmin && (
                                  <span className="rounded bg-[#FDF2F8] px-1.5 py-0.5 text-[9px] font-bold text-[#800020] border border-[#FBCFE8]">
                                    OWNER
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-gray-400 font-mono">{emp.employee_number}</p>
                              <p className="text-[11px] text-gray-500">{emp.phone}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-gray-800">{emp.position?.name || '-'}</p>
                          <span className="inline-block mt-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                            {emp.department?.name || '-'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="text-gray-700 font-medium">{emp.manager?.full_name || '-'}</p>
                          {emp.manager?.position_name && (
                            <p className="text-[10px] text-gray-400">{emp.manager.position_name}</p>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              emp.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : emp.status === 'INACTIVE'
                                ? 'bg-gray-100 text-gray-700 border border-gray-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${emp.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            {emp.status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-gray-500">
                          {emp.join_date}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Lihat Detail */}
                            <button
                              onClick={() => {
                                setActiveEmployee(emp);
                                setShowDetailModal(true);
                              }}
                              title="Lihat Detail Karyawan"
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Edit Karyawan */}
                            {hasPermission('team.edit') && (
                              <button
                                onClick={() => openEditModal(emp)}
                                title="Edit Data Karyawan"
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#800020] transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}

                            {/* Atur Akses (Granular Permissions) */}
                            {hasPermission('access.manage') && (
                              <button
                                onClick={() => openAccessModal(emp)}
                                title="Atur Hak Akses & Permission"
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-[#FDF2F8] hover:text-[#800020] transition-colors"
                              >
                                <Shield className="h-4 w-4" />
                              </button>
                            )}

                            {/* Quick Activate / Deactivate Toggle (Owner cannot be deactivated) */}
                            {hasPermission('team.activate') && !isSuperAdmin && (
                              <button
                                onClick={() => handleQuickToggleStatus(emp)}
                                title={emp.status === 'ACTIVE' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                                className={`rounded-lg p-1.5 transition-colors ${
                                  emp.status === 'ACTIVE'
                                    ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                    : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {emp.status === 'ACTIVE' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                              </button>
                            )}

                            {/* Delete (Soft / Permanent) */}
                            {hasPermission('team.delete') && !isSuperAdmin && (
                              <button
                                onClick={() => openDeleteModal(emp)}
                                title="Hapus Data Karyawan"
                                className="rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Section 32: Table transforms into cards on mobile) */}
            <div className="block md:hidden divide-y divide-gray-100 p-3 space-y-3">
              {employees.map(emp => {
                const isSuperAdmin = emp.user?.role_id === 'owner';

                return (
                  <div key={emp.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={emp.full_name}
                          className="h-11 w-11 rounded-full object-cover border border-gray-200"
                        />
                        <div>
                          <p className="font-bold text-gray-900 leading-tight flex items-center gap-1.5">
                            <span>{emp.full_name}</span>
                            {isSuperAdmin && (
                              <span className="rounded bg-[#FDF2F8] px-1 py-0.2 text-[8px] font-bold text-[#800020]">
                                OWNER
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">{emp.position?.name}</p>
                          <p className="text-[10px] text-gray-400">{emp.department?.name}</p>
                        </div>
                      </div>

                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          emp.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-500">
                      <span>Nomor: {emp.employee_number}</span>
                      <span>Atasan: {emp.manager?.full_name || '-'}</span>
                    </div>

                    {/* Action buttons on mobile */}
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-2">
                      <button
                        onClick={() => {
                          setActiveEmployee(emp);
                          setShowDetailModal(true);
                        }}
                        className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700"
                      >
                        Detail
                      </button>

                      {hasPermission('team.edit') && (
                        <button
                          onClick={() => openEditModal(emp)}
                          className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] font-semibold text-[#800020]"
                        >
                          Edit
                        </button>
                      )}

                      {hasPermission('access.manage') && (
                        <button
                          onClick={() => openAccessModal(emp)}
                          className="rounded-lg bg-[#FDF2F8] px-2.5 py-1.5 text-[11px] font-bold text-[#800020]"
                        >
                          Akses
                        </button>
                      )}

                      {hasPermission('team.delete') && !isSuperAdmin && (
                        <button
                          onClick={() => openDeleteModal(emp)}
                          className="rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-600"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. MODAL TAMBAH KARYAWAN (Section 11)                    */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDF2F8] text-[#800020]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Tambah Anggota Tim / Karyawan Baru</h3>
                  <p className="text-xs text-gray-500">Lengkapi data pribadi dan informasi akun sistem GOC</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={addForm.full_name}
                    onChange={e => setAddForm({ ...addForm, full_name: e.target.value })}
                    placeholder="Nama lengkap beserta gelar jika ada"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                {/* Divisi */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Divisi *</label>
                  <select
                    required
                    value={addForm.department_id}
                    onChange={e => setAddForm({ ...addForm, department_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Jabatan */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jabatan *</label>
                  <select
                    required
                    value={addForm.position_id}
                    onChange={e => setAddForm({ ...addForm, position_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  >
                    {positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Atasan Langsung */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Atasan Langsung (Manager)</label>
                  <select
                    value={addForm.manager_id}
                    onChange={e => setAddForm({ ...addForm, manager_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  >
                    <option value="">-- Pucuk Pimpinan / Tidak Ada Atasan --</option>
                    {employees.filter(e => e.status === 'ACTIVE').map(e => (
                      <option key={e.id} value={e.id}>{e.full_name} ({e.position?.name})</option>
                    ))}
                  </select>
                </div>

                {/* Username Login */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Username Login *</label>
                  <input
                    type="text"
                    required
                    value={addForm.username}
                    onChange={e => setAddForm({ ...addForm, username: e.target.value })}
                    placeholder="cth: siti.marfuah (unik)"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                {/* Password Akun */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Password Akun *</label>
                  <input
                    type="text"
                    required
                    value={addForm.password}
                    onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Aktif *</label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="email@galaxyortho.com"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                {/* Nomor WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="08123456789"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                {/* Tanggal Bergabung */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Bergabung</label>
                  <input
                    type="date"
                    required
                    value={addForm.join_date}
                    onChange={e => setAddForm({ ...addForm, join_date: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                {/* Status Karyawan */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status Kepegawaian</label>
                  <select
                    value={addForm.status}
                    onChange={e => setAddForm({ ...addForm, status: e.target.value as EmployeeStatus })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="RESIGNED">RESIGNED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              {/* Foto Profil URL */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Foto Profil (URL Gambar)</label>
                <input
                  type="url"
                  value={addForm.photo}
                  onChange={e => setAddForm({ ...addForm, photo: e.target.value })}
                  placeholder="https://... (opsional, akan menggunakan avatar bawaan jika kosong)"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={addForm.notes}
                  onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
                  placeholder="Catatan mengenai keahlian, jadwal, atau catatan internal"
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
                  disabled={actionLoading}
                  className="rounded-xl bg-[#800020] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] disabled:opacity-50"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MODAL EDIT KARYAWAN (Section 12)                      */}
      {/* ======================================================== */}
      {showEditModal && activeEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Edit Data: {activeEmployee.full_name}</h3>
              <button onClick={() => setShowEditModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditEmployee} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editForm.full_name}
                    onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Divisi</label>
                  <select
                    value={editForm.department_id}
                    onChange={e => setEditForm({ ...editForm, department_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jabatan</label>
                  <select
                    value={editForm.position_id}
                    onChange={e => setEditForm({ ...editForm, position_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  >
                    {positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Atasan Langsung</label>
                  <select
                    value={editForm.manager_id}
                    onChange={e => setEditForm({ ...editForm, manager_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  >
                    <option value="">-- Pucuk Pimpinan --</option>
                    {employees.filter(e => e.id !== activeEmployee.id).map(e => (
                      <option key={e.id} value={e.id}>{e.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status Karyawan</label>
                  <select
                    disabled={activeEmployee.user?.role_id === 'owner'}
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value as EmployeeStatus })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden disabled:bg-gray-100"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="RESIGNED">RESIGNED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Reset Password Akun (Opsional)</label>
                  <input
                    type="text"
                    value={editForm.new_password}
                    onChange={e => setEditForm({ ...editForm, new_password: e.target.value })}
                    placeholder="Kosongkan bila tidak diubah"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Foto Profil (URL)</label>
                <input
                  type="url"
                  value={editForm.photo}
                  onChange={e => setEditForm({ ...editForm, photo: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-[#800020] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] disabled:opacity-50"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODAL ATUR AKSES (Section 16: Granular Checkboxes)    */}
      {/* ======================================================== */}
      {showAccessModal && activeEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDF2F8] text-[#800020]">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Atur Hak Akses: {activeEmployee.full_name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Role Base: <span className="font-bold text-[#800020]">{activeEmployee.user?.role_name}</span> &bull; Centang permission yang diizinkan
                  </p>
                </div>
              </div>
              <button onClick={() => setShowAccessModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {isOwnerTarget ? (
              <div className="my-6 rounded-2xl bg-amber-50 p-4 text-xs text-amber-800 border border-amber-200">
                <p className="font-bold mb-1">Perhatian (Super Admin Rule):</p>
                <p>
                  User ini adalah <strong>Owner / Super Admin</strong>. Otoritas penuh sistem melekat secara permanen dan tidak dapat dikurangi.
                </p>
              </div>
            ) : (
              <div className="my-4 max-h-96 overflow-y-auto pr-2 space-y-4">
                {Object.entries(permsByModule).map(([moduleName, perms]) => (
                  <div key={moduleName} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#800020]" />
                      <span>Modul: {moduleName}</span>
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map(p => {
                        const isChecked = grantedPerms.includes(p.id);

                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-white border-[#800020]/40 shadow-2xs'
                                : 'bg-white/60 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(p.id)}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#800020] focus:ring-[#800020]"
                            />
                            <div>
                              <p className={`font-semibold ${isChecked ? 'text-[#800020]' : 'text-gray-700'}`}>
                                {p.name}
                              </p>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{p.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">
                Total Permission Aktif: <strong className="text-gray-900">{grantedPerms.length}</strong>
              </span>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAccessModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Tutup
                </button>
                {!isOwnerTarget && (
                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    disabled={actionLoading}
                    className="rounded-xl bg-[#800020] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] disabled:opacity-50"
                  >
                    {actionLoading ? 'Menyimpan...' : 'Simpan Hak Akses'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL DELETE (Section 14: Soft & Permanent Safeguard) */}
      {/* ======================================================== */}
      {showDeleteModal && activeEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Kelola Penghapusan Karyawan</h3>
                <p className="text-xs text-gray-500">{activeEmployee.full_name} ({activeEmployee.employee_number})</p>
              </div>
            </div>

            {/* Selection between Soft Delete and Permanent Delete */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setDeleteType('soft')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  deleteType === 'soft' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Soft Delete (Nonaktifkan)
              </button>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setDeleteType('permanent')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    deleteType === 'permanent' ? 'bg-red-600 text-white shadow-xs' : 'text-gray-500 hover:text-red-600'
                  }`}
                >
                  Hapus Permanen
                </button>
              )}
            </div>

            {deleteType === 'soft' ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600 border border-gray-200">
                  <p className="font-semibold text-gray-800 mb-1">Konsep Soft Delete:</p>
                  Karyawan akan berstatus nonaktif dan tidak dapat login ke sistem. Seluruh data historis tugas, jadwal, cuti, payroll, dan audit log tetap tersimpan utuh di database.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200">
                  <p className="font-bold mb-1">PERINGATAN PENGHAPUSAN PERMANEN:</p>
                  Data ini akan dihapus secara permanen dari basis data. Riwayat yang berkaitan dengan user tidak dapat dipulihkan.
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ketik Nama Karyawan: <span className="text-red-600 font-mono">{activeEmployee.full_name}</span>
                  </label>
                  <input
                    type="text"
                    value={confirmName}
                    onChange={e => setConfirmName(e.target.value)}
                    placeholder="Ketik persis nama di atas"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-red-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Konfirmasi Password Owner
                  </label>
                  <input
                    type="password"
                    value={ownerPassword}
                    onChange={e => setOwnerPassword(e.target.value)}
                    placeholder="Masukkan password akun Owner Anda"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-red-600 outline-hidden"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={confirmCheckbox}
                    onChange={e => setConfirmCheckbox(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                  />
                  <span className="text-[11px] text-gray-600 font-medium leading-tight">
                    Saya memahami bahwa aksi ini permanen dan tidak dapat dibatalkan.
                  </span>
                </label>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={
                  actionLoading ||
                  (deleteType === 'permanent' && (!confirmCheckbox || !ownerPassword || !confirmName))
                }
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition-all disabled:opacity-40 ${
                  deleteType === 'soft' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading
                  ? 'Memproses...'
                  : deleteType === 'soft'
                  ? 'Nonaktifkan Karyawan'
                  : 'Hapus Permanen Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL DETAIL KARYAWAN                                 */}
      {/* ======================================================== */}
      {showDetailModal && activeEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Profil Lengkap Karyawan</h3>
              <button onClick={() => setShowDetailModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={activeEmployee.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={activeEmployee.full_name}
                  className="h-16 w-16 rounded-2xl object-cover border-2 border-[#800020]/20"
                />
                <div>
                  <h4 className="text-base font-bold text-gray-900">{activeEmployee.full_name}</h4>
                  <p className="text-xs text-[#800020] font-semibold">{activeEmployee.position?.name}</p>
                  <p className="text-xs text-gray-500">{activeEmployee.department?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Nomor Karyawan</span>
                  <span className="font-semibold text-gray-900 font-mono">{activeEmployee.employee_number}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-bold text-emerald-600">{activeEmployee.status}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">WhatsApp / Telepon</span>
                  <span className="font-semibold text-gray-900">{activeEmployee.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Email</span>
                  <span className="font-semibold text-gray-900">{activeEmployee.email}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Atasan Langsung</span>
                  <span className="font-semibold text-gray-900">{activeEmployee.manager?.full_name || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Tanggal Bergabung</span>
                  <span className="font-semibold text-gray-900">{activeEmployee.join_date}</span>
                </div>
              </div>

              {activeEmployee.notes && (
                <div className="rounded-xl border border-gray-100 p-3 text-xs">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold mb-1">Catatan</span>
                  <p className="text-gray-700">{activeEmployee.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 text-right">
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
