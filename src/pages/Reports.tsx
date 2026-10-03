/**
 * Reports & Analytics Module for GOC Team Management
 * Comprehensive Reports with CSV Export & Filters
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { Department, EmployeeWithRelations } from '../types/index.ts';
import {
  BarChart3,
  Download,
  Filter,
  FileSpreadsheet,
  Users,
  CheckSquare,
  Palmtree,
  Wallet,
  Calendar,
} from 'lucide-react';

export function Reports() {
  const { hasPermission, isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState<'karyawan' | 'tugas' | 'cuti' | 'payroll'>('karyawan');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithRelations[]>([]);
  const [reportSummary, setReportSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [sumRes, deptRes, empRes] = await Promise.all([
        apiRequest('/api/reports'),
        apiRequest<Department[]>('/api/departments'),
        apiRequest<EmployeeWithRelations[]>('/api/employees'),
      ]);
      setReportSummary(sumRes);
      setDepartments(deptRes);
      setEmployees(empRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = `laporan_goc_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'karyawan') {
      csvContent += 'No,Nomor Karyawan,Nama Lengkap,Divisi,Jabatan,Email,Telepon,Status,Tanggal Bergabung\n';
      employees.forEach((emp, i) => {
        csvContent += `"${i + 1}","${emp.employee_number}","${emp.full_name}","${emp.department?.name || ''}","${emp.position?.name || ''}","${emp.email}","${emp.phone}","${emp.status}","${emp.join_date}"\n`;
      });
    } else {
      csvContent += 'Modul,Keterangan,Nilai\n';
      csvContent += `"Karyawan","Total Terdaftar","${reportSummary?.totalEmployees || 0}"\n`;
      csvContent += `"Tugas","Selesai","${reportSummary?.taskSummary?.done || 0}"\n`;
      csvContent += `"Cuti","Disetujui","${reportSummary?.leaveSummary?.approved || 0}"\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-[#800020]" />
            <span>Pusat Laporan & Analitik</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Unduh rekapitulasi data SDM, produktivitas tugas, absensi cuti, dan pengeluaran klinik.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 rounded-xl bg-[#800020] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] transition-all"
        >
          <Download className="h-4 w-4" />
          <span>Export ke CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {[
          { id: 'karyawan', label: 'Laporan Karyawan', icon: Users },
          { id: 'tugas', label: 'Laporan Tugas & Produktivitas', icon: CheckSquare },
          { id: 'cuti', label: 'Laporan Cuti & Izin', icon: Palmtree },
          { id: 'payroll', label: 'Laporan Penggajian', icon: Wallet },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#800020] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-gray-500">Total Anggota Tim</span>
          <p className="mt-2 text-3xl font-black text-gray-900">{reportSummary?.totalEmployees || 0}</p>
          <p className="text-[11px] text-gray-400 mt-1">Karyawan aktif & nonaktif</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-gray-500">Penyelesaian Tugas</span>
          <p className="mt-2 text-3xl font-black text-teal-600">{reportSummary?.taskSummary?.done || 0}</p>
          <p className="text-[11px] text-gray-400 mt-1">Dari {reportSummary?.taskSummary?.total || 0} tugas terbit</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-gray-500">Pengajuan Cuti Disetujui</span>
          <p className="mt-2 text-3xl font-black text-emerald-600">{reportSummary?.leaveSummary?.approved || 0}</p>
          <p className="text-[11px] text-gray-400 mt-1">{reportSummary?.leaveSummary?.pending || 0} masih pending</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-gray-500">Total Payroll Terbayar</span>
          <p className="mt-2 text-xl font-black text-[#800020]">
            Rp {(reportSummary?.payrollSummary?.totalPayrollPaid || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Kompensasi staf bulan ini</p>
        </div>
      </div>

      {/* Distribution by Department */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Distribusi Karyawan per Divisi</h3>
        <div className="space-y-3">
          {reportSummary?.employeesByDept?.map((d: any) => (
            <div key={d.department} className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>{d.department}</span>
                <span>{d.count} Karyawan</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-[#800020] rounded-full transition-all"
                  style={{
                    width: `${reportSummary.totalEmployees ? (d.count / reportSummary.totalEmployees) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
