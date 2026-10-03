/**
 * Dedicated Access Control & Role Management Page
 * Galaxy Orthodontic Center
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { Permission, Role, EmployeeWithRelations } from '../types/index.ts';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  Search,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Shield,
  X,
} from 'lucide-react';

export function AccessControl() {
  const { isOwner } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<EmployeeWithRelations | null>(null);
  const [userPerms, setUserPerms] = useState<string[]>([]);
  const [isOwnerTarget, setIsOwnerTarget] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roleRes, permRes, empRes] = await Promise.all([
        apiRequest<Role[]>('/api/roles'),
        apiRequest<Permission[]>('/api/permissions'),
        apiRequest<EmployeeWithRelations[]>('/api/employees?status=ACTIVE'),
      ]);
      setRoles(roleRes);
      setPermissions(permRes);
      setEmployees(empRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectEmployee = async (emp: EmployeeWithRelations) => {
    if (!emp.user) return;
    setSelectedUser(emp);
    try {
      const res = await apiRequest<{
        userId: string;
        isOwner: boolean;
        effectivePermissions: string[];
      }>(`/api/users/${emp.user.id}/permissions`);
      setUserPerms(res.effectivePermissions);
      setIsOwnerTarget(res.isOwner);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const togglePermission = (permId: string) => {
    if (isOwnerTarget) return;
    setUserPerms(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSave = async () => {
    if (!selectedUser?.user) return;
    setSaving(true);
    try {
      await apiRequest(`/api/users/${selectedUser.user.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ grantedPermissions: userPerms }),
      });
      setFeedback(`Hak akses ${selectedUser.full_name} berhasil disimpan!`);
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const permsByModule = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-[#800020]" />
          <span>Manajemen Hak Akses & Permission</span>
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Role-Based Access Control (RBAC) dengan konfigurasi permission granular per individu user tim GOC.
        </p>
      </div>

      {feedback && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Roles Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map(r => (
          <div key={r.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                r.id === 'owner' ? 'bg-[#FDF2F8] text-[#800020]' : 'bg-gray-100 text-gray-800'
              }`}>
                {r.name}
              </span>
              <Shield className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-600 mt-2">{r.description}</p>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span>Status: Aktif</span>
              <span className="font-semibold text-gray-700">
                {employees.filter(e => e.user?.role_id === r.id).length} Karyawan
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Workspace: Select Employee on Left, Granular Permissions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Employee List */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Pilih Karyawan untuk Konfigurasi:
          </h2>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {employees.map(emp => {
              const isSelected = selectedUser?.id === emp.id;
              const isEmpOwner = emp.user?.role_id === 'owner';

              return (
                <button
                  key={emp.id}
                  onClick={() => selectEmployee(emp)}
                  className={`w-full text-left rounded-2xl p-3 border transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'border-[#800020] bg-[#FDF2F8] shadow-xs'
                      : 'border-gray-100 bg-white hover:border-gray-300'
                  }`}
                >
                  <img
                    src={emp.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={emp.full_name}
                    className="h-10 w-10 rounded-full object-cover border border-gray-200"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate flex items-center gap-1.5">
                      <span>{emp.full_name}</span>
                      {isEmpOwner && (
                        <span className="rounded bg-[#800020] text-white px-1 py-0.2 text-[8px] font-bold">
                          OWNER
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">{emp.position?.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{emp.user?.username}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Permission Matrix */}
        <div className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-6 shadow-xs">
          {selectedUser ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedUser.photo}
                    alt={selectedUser.full_name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-[#800020]/20"
                  />
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 leading-tight">
                      Hak Akses: {selectedUser.full_name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Role Bawaan: <strong className="text-[#800020]">{selectedUser.user?.role_name}</strong>
                    </p>
                  </div>
                </div>

                {!isOwnerTarget && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-[#800020] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] disabled:opacity-50"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Hak Akses'}
                  </button>
                )}
              </div>

              {isOwnerTarget ? (
                <div className="my-6 rounded-2xl bg-amber-50 p-4 text-xs text-amber-800 border border-amber-200">
                  <p className="font-bold mb-1">Super Admin / Owner:</p>
                  Seluruh modul dan permission sistem terbuka otomatis dan tidak dapat dikurangi.
                </div>
              ) : (
                <div className="mt-4 space-y-4 max-h-[520px] overflow-y-auto pr-2">
                  {Object.entries(permsByModule).map(([mod, perms]) => (
                    <div key={mod} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3.5">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#800020]" />
                        <span>Modul {mod}</span>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map(p => {
                          const isChecked = userPerms.includes(p.id);

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
            </div>
          ) : (
            <div className="py-24 text-center text-gray-400">
              <ShieldCheck className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-700">Pilih Karyawan</p>
              <p className="text-xs text-gray-400 mt-1">
                Pilih salah satu karyawan di panel kiri untuk melihat dan menyesuaikan izin khusus mereka.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
