/**
 * Organization Structure & Hierarchy View for GOC Team Management
 * Visual Interactive Tree (Owner -> PJ Klinik -> Divisi -> Karyawan)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { EmployeeWithRelations, Department } from '../types/index.ts';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  Users,
  Shield,
  Briefcase,
  ExternalLink,
  Crown,
  HeartHandshake,
} from 'lucide-react';

export function Organization() {
  const { isOwner } = useAuth();
  const [employees, setEmployees] = useState<EmployeeWithRelations[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'department'>('tree');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, deptRes] = await Promise.all([
        apiRequest<EmployeeWithRelations[]>('/api/employees?status=ACTIVE'),
        apiRequest<Department[]>('/api/departments'),
      ]);
      setEmployees(empRes);
      setDepartments(deptRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Find Owner (Root)
  const owner = employees.find(e => e.user?.role_id === 'owner' || !e.manager_id);
  // Find PJ Klinik (Direct under Owner)
  const pjKlinik = employees.find(e => e.user?.role_id === 'pj_klinik' || (owner && e.manager_id === owner.id));

  // Staff under PJ Klinik grouped by Department
  const staffByDept = departments.map(d => {
    const members = employees.filter(e => e.department_id === d.id && e.id !== owner?.id && e.id !== pjKlinik?.id);
    return {
      department: d,
      members,
    };
  }).filter(group => group.members.length > 0 || group.department.id !== 'dept-mgt');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-[#800020]" />
            <span>Struktur Organisasi GOC</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Bagan hirarki kepemimpinan, penanggung jawab klinik, dan koordinasi divisi kerja.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'tree' ? 'bg-white text-[#800020] shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Bagan Hirarki
          </button>
          <button
            onClick={() => setViewMode('department')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'department' ? 'bg-white text-[#800020] shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Per Divisi
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#800020] border-t-transparent mb-2" />
          <p>Memuat struktur organisasi...</p>
        </div>
      ) : viewMode === 'tree' ? (
        /* Visual Tree View (Section 4 & 19) */
        <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-10 shadow-xs flex flex-col items-center">
          {/* LEVEL 1: OWNER */}
          {owner && (
            <div className="flex flex-col items-center">
              <div className="relative group w-72 sm:w-80 rounded-2xl border-2 border-[#800020] bg-linear-to-b from-[#FDF2F4] to-white p-4 shadow-md text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-[#800020] px-3 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wider shadow-xs">
                  <Crown className="h-3 w-3" />
                  <span>Owner / Super Admin</span>
                </div>
                <img
                  src={owner.photo}
                  alt={owner.full_name}
                  className="mx-auto mt-2 h-16 w-16 rounded-full object-cover border-2 border-[#800020] shadow-xs"
                />
                <h3 className="mt-2 text-sm font-extrabold text-gray-900">{owner.full_name}</h3>
                <p className="text-xs font-semibold text-[#800020]">{owner.position?.name}</p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">{owner.employee_number}</p>

                <div className="mt-2.5 pt-2 border-t border-[#800020]/15 flex items-center justify-center gap-3 text-xs text-gray-600">
                  <a href={`https://wa.me/${owner.phone}`} target="_blank" rel="noreferrer" className="hover:text-[#800020] flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{owner.phone}</span>
                  </a>
                </div>
              </div>

              {/* Vertical Connector */}
              <div className="h-8 w-0.5 bg-[#800020]" />
              <div className="h-2 w-2 rounded-full bg-[#800020]" />
            </div>
          )}

          {/* LEVEL 2: PENANGGUNG JAWAB KLINIK */}
          {pjKlinik && (
            <div className="flex flex-col items-center mt-2">
              <div className="relative group w-72 sm:w-80 rounded-2xl border-2 border-pink-300 bg-linear-to-b from-[#FDF2F8] to-white p-4 shadow-sm text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-[#991D3C] px-3 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wider shadow-xs">
                  <HeartHandshake className="h-3 w-3" />
                  <span>Penanggung Jawab Klinik</span>
                </div>
                <img
                  src={pjKlinik.photo}
                  alt={pjKlinik.full_name}
                  className="mx-auto mt-2 h-14 w-14 rounded-full object-cover border-2 border-pink-400 shadow-xs"
                />
                <h3 className="mt-2 text-sm font-extrabold text-gray-900">{pjKlinik.full_name}</h3>
                <p className="text-xs font-semibold text-[#991D3C]">{pjKlinik.position?.name}</p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">{pjKlinik.employee_number}</p>

                <div className="mt-2.5 pt-2 border-t border-pink-100 flex items-center justify-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{pjKlinik.phone}</span>
                  </span>
                </div>
              </div>

              {/* Connector to Divisions */}
              <div className="h-8 w-0.5 bg-gray-300" />
            </div>
          )}

          {/* LEVEL 3: DIVISI & KARYAWAN */}
          <div className="w-full relative mt-2 pt-4 border-t-2 border-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {staffByDept.map(({ department, members }) => (
                <div key={department.id} className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 flex flex-col">
                  {/* Division Header */}
                  <div className="text-center pb-3 border-b border-gray-200 mb-3">
                    <span className="inline-block rounded-full bg-[#800020] px-3 py-1 text-[11px] font-bold text-white shadow-2xs">
                      {department.name}
                    </span>
                    <p className="text-[10px] text-gray-500 mt-1">{department.description}</p>
                  </div>

                  {/* Members Cards */}
                  <div className="space-y-2.5 flex-1">
                    {members.map(member => (
                      <div
                        key={member.id}
                        className="rounded-xl border border-gray-200/80 bg-white p-3 shadow-2xs hover:shadow-xs transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={member.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={member.full_name}
                            className="h-10 w-10 rounded-full object-cover border border-gray-200"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-gray-900 truncate">{member.full_name}</h4>
                            <p className="text-[11px] text-[#800020] font-semibold truncate">{member.position?.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{member.employee_number}</p>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                          <span>{member.phone || '-'}</span>
                          <span className="text-emerald-600 font-bold text-[10px]">{member.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Department Grouped Cards View */
        <div className="space-y-6">
          {departments.map(dept => {
            const members = employees.filter(e => e.department_id === dept.id);
            return (
              <div key={dept.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDF2F8] text-[#800020] font-bold text-xs">
                      {members.length}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{dept.name}</h3>
                      <p className="text-xs text-gray-500">{dept.description}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {members.map(member => (
                    <div key={member.id} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 flex items-center gap-3">
                      <img
                        src={member.photo}
                        alt={member.full_name}
                        className="h-11 w-11 rounded-full object-cover border border-gray-200"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{member.full_name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{member.position?.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{member.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
