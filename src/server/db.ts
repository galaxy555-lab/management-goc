/**
 * Relational In-Memory & Persistent Storage Engine for GOC Team Management
 * Galaxy Orthodontic Center
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  Department,
  Position,
  Role,
  Permission,
  RolePermission,
  UserPermission,
  User,
  Employee,
  Task,
  TaskComment,
  Schedule,
  LeaveRequest,
  PayrollRecord,
  Announcement,
  AuditLog,
  AppNotification,
  AppSettings,
  EmployeeStatus,
  ForumChannel,
  ForumMessage,
  VideoMeeting,
} from '../types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'goc_database.json');

export interface DatabaseSchema {
  departments: Department[];
  positions: Position[];
  roles: Role[];
  permissions: Permission[];
  role_permissions: RolePermission[];
  user_permissions: UserPermission[];
  users: User[];
  employees: Employee[];
  tasks: Task[];
  task_comments: TaskComment[];
  schedules: Schedule[];
  leave_requests: LeaveRequest[];
  payroll: PayrollRecord[];
  announcements: Announcement[];
  audit_logs: AuditLog[];
  notifications: AppNotification[];
  settings: AppSettings;
  forum_channels: ForumChannel[];
  forum_messages: ForumMessage[];
  video_meetings: VideoMeeting[];
}

// Password hashing utility using PBKDF2
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const chosenSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, chosenSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: chosenSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return check === hash;
}

export const ALL_PERMISSIONS: Permission[] = [
  { id: 'dashboard.view', name: 'Lihat Dashboard', module: 'dashboard', action: 'view', description: 'Melihat ringkasan statistik dan aktivitas' },
  { id: 'organization.view', name: 'Lihat Organisasi', module: 'organization', action: 'view', description: 'Melihat bagan struktur organisasi' },
  { id: 'team.view', name: 'Lihat Team GOC', module: 'team', action: 'view', description: 'Melihat daftar seluruh anggota tim dan karyawan' },
  { id: 'team.create', name: 'Tambah Karyawan', module: 'team', action: 'create', description: 'Menambahkan anggota tim/karyawan baru' },
  { id: 'team.edit', name: 'Ubah Data Karyawan', module: 'team', action: 'edit', description: 'Memperbarui informasi data karyawan' },
  { id: 'team.activate', name: 'Aktifkan Karyawan', module: 'team', action: 'activate', description: 'Mengaktifkan status akun karyawan' },
  { id: 'team.deactivate', name: 'Nonaktifkan Karyawan', module: 'team', action: 'deactivate', description: 'Menonaktifkan status akun karyawan' },
  { id: 'team.delete', name: 'Hapus Karyawan', module: 'team', action: 'delete', description: 'Menghapus permanen data karyawan' },
  { id: 'access.manage', name: 'Atur Hak Akses', module: 'access', action: 'manage', description: 'Mengelola hak akses dan permission user' },
  { id: 'schedule.view', name: 'Lihat Jadwal', module: 'schedule', action: 'view', description: 'Melihat jadwal kerja, shift, dan agenda klinik' },
  { id: 'schedule.create', name: 'Buat Jadwal', module: 'schedule', action: 'create', description: 'Membuat jadwal baru atau jadwal shift' },
  { id: 'schedule.edit', name: 'Ubah Jadwal', module: 'schedule', action: 'edit', description: 'Mengubah jadwal kerja dan kalender' },
  { id: 'schedule.delete', name: 'Hapus Jadwal', module: 'schedule', action: 'delete', description: 'Menghapus jadwal yang telah dibuat' },
  { id: 'task.view', name: 'Lihat Tugas', module: 'task', action: 'view', description: 'Melihat daftar tugas' },
  { id: 'task.create', name: 'Buat Tugas Baru', module: 'task', action: 'create', description: 'Membuat dan menetapkan tugas baru' },
  { id: 'task.edit', name: 'Ubah Tugas', module: 'task', action: 'edit', description: 'Mengubah detail tugas orang lain' },
  { id: 'task.update', name: 'Perbarui Status Tugas', module: 'task', action: 'update', description: 'Memperbarui progress dan status tugas sendiri' },
  { id: 'task.delete', name: 'Hapus Tugas', module: 'task', action: 'delete', description: 'Menghapus tugas dari sistem' },
  { id: 'leave.view', name: 'Lihat Cuti & Izin', module: 'leave', action: 'view', description: 'Melihat riwayat pengajuan cuti dan izin' },
  { id: 'leave.create', name: 'Ajukan Cuti & Izin', module: 'leave', action: 'create', description: 'Membuat pengajuan cuti/izin/sakit' },
  { id: 'leave.approve', name: 'Setujui Pengajuan Cuti', module: 'leave', action: 'approve', description: 'Menyetujui permohonan cuti dan izin' },
  { id: 'leave.reject', name: 'Tolak Pengajuan Cuti', module: 'leave', action: 'reject', description: 'Menolak permohonan cuti dan izin' },
  { id: 'payroll.view', name: 'Lihat Payroll', module: 'payroll', action: 'view', description: 'Melihat rincian penggajian dan slip gaji' },
  { id: 'payroll.create', name: 'Buat Data Payroll', module: 'payroll', action: 'create', description: 'Membuat data gaji karyawan' },
  { id: 'payroll.edit', name: 'Ubah Data Payroll', module: 'payroll', action: 'edit', description: 'Memperbarui nominal dan status penggajian' },
  { id: 'payroll.delete', name: 'Hapus Data Payroll', module: 'payroll', action: 'delete', description: 'Menghapus data penggajian' },
  { id: 'report.view', name: 'Lihat Laporan', module: 'report', action: 'view', description: 'Melihat laporan karyawan, absensi, cuti, tugas' },
  { id: 'report.export', name: 'Export Laporan', module: 'report', action: 'export', description: 'Mengunduh laporan ke file CSV / Excel' },
  { id: 'announcement.view', name: 'Lihat Pengumuman', module: 'announcement', action: 'view', description: 'Membaca pengumuman internal' },
  { id: 'announcement.create', name: 'Buat Pengumuman', module: 'announcement', action: 'create', description: 'Membuat dan mempublikasikan pengumuman' },
  { id: 'announcement.edit', name: 'Ubah Pengumuman', module: 'announcement', action: 'edit', description: 'Mengubah dan menghapus pengumuman' },
  { id: 'announcement.delete', name: 'Hapus Pengumuman', module: 'announcement', action: 'delete', description: 'Menghapus pengumuman internal' },
  { id: 'audit.view', name: 'Lihat Audit Log', module: 'audit', action: 'view', description: 'Melihat rekam jejak aktivitas sistem' },
  { id: 'settings.view', name: 'Lihat Pengaturan', module: 'settings', action: 'view', description: 'Melihat konfigurasi sistem' },
  { id: 'settings.edit', name: 'Ubah Pengaturan', module: 'settings', action: 'edit', description: 'Mengubah pengaturan klinik dan keamanan' },
  { id: 'profile.view', name: 'Lihat Profil', module: 'profile', action: 'view', description: 'Melihat data profil diri sendiri' },
  { id: 'profile.edit', name: 'Ubah Profil', module: 'profile', action: 'edit', description: 'Memperbarui kontak dan informasi pribadi' },
  { id: 'forum.view', name: 'Lihat Forum & Diskusi', module: 'forum', action: 'view', description: 'Melihat dan berpartisipasi dalam forum diskusi tim' },
  { id: 'forum.create', name: 'Buat Channel Diskusi', module: 'forum', action: 'create', description: 'Membuat channel forum baru atau percakapan privat' },
  { id: 'meeting.host', name: 'Host Video Meeting', module: 'meeting', action: 'host', description: 'Membuat dan memimpin ruang video meeting virtual' },
];

function generateSeedData(): DatabaseSchema {
  const now = new Date().toISOString();

  const departments: Department[] = [
    { id: 'dept-mgt', name: 'Manajemen', description: 'Pimpinan & Penanggung Jawab Klinik', status: 'ACTIVE', created_at: now, updated_at: now },
    { id: 'dept-adm', name: 'Administrasi', description: 'Front Office & Administrasi Pasien', status: 'ACTIVE', created_at: now, updated_at: now },
    { id: 'dept-fin', name: 'Finance', description: 'Keuangan & Penggajian', status: 'ACTIVE', created_at: now, updated_at: now },
    { id: 'dept-mkt', name: 'Digital Marketing', description: 'Pemasaran Digital, Media Sosial, & Branding', status: 'ACTIVE', created_at: now, updated_at: now },
    { id: 'dept-prw', name: 'Perawat Gigi', description: 'Asistensi Dokter Gigi & Pelayanan Medis', status: 'ACTIVE', created_at: now, updated_at: now },
  ];

  const positions: Position[] = [
    { id: 'pos-owner', name: 'Owner / Super Admin', department_id: 'dept-mgt', description: 'Pemilik & Pimpinan Tertinggi GOC', status: 'ACTIVE', created_at: now, updated_at: now },
    { id: 'pos-pj', name: 'Penanggung Jawab Klinik', department_id: 'dept-mgt', description: 'Penanggung Jawab Medis & Operasional Klinik', status: 'ACTIVE', created_at: now, updated_at: now },
    { id: 'pos-adm', name: 'Staff Administrasi', department_id: 'dept-adm', description: 'Petugas Administrasi & Pelayanan Pasien', status: 'ACTIVE', created_at: now, updated_at: now },
    { id: 'pos-fin', name: 'Staff Finance', department_id: 'dept-fin', description: 'Petugas Keuangan & Pembukuan', status: 'ACTIVE', created_at: now, updated_at: now },
    { id: 'pos-mkt', name: 'Digital Marketer', department_id: 'dept-mkt', description: 'Spesialis Pemasaran & Konten Digital', status: 'ACTIVE', created_at: now, updated_at: now },
    { id: 'pos-prw', name: 'Perawat Gigi', department_id: 'dept-prw', description: 'Asisten Dokter Gigi & Sterilisasi Alat', status: 'ACTIVE', created_at: now, updated_at: now },
  ];

  const roles: Role[] = [
    { id: 'owner', name: 'Owner / Super Admin', description: 'Akses penuh terhadap seluruh sistem dan pengaturan GOC', created_at: now, updated_at: now },
    { id: 'pj_klinik', name: 'Penanggung Jawab Klinik', description: 'Pengawasan operasional klinik, persetujuan cuti, tugas tim', created_at: now, updated_at: now },
    { id: 'karyawan', name: 'Karyawan', description: 'Anggota tim pelaksana GOC', created_at: now, updated_at: now },
  ];

  // Role permissions
  const role_permissions: RolePermission[] = [];
  
  // Owner has ALL permissions
  ALL_PERMISSIONS.forEach(p => {
    role_permissions.push({
      id: `rp-owner-${p.id}`,
      role_id: 'owner',
      permission_id: p.id,
    });
  });

  // PJ Klinik default permissions
  const pjPermissions = [
    'dashboard.view', 'organization.view', 'team.view', 'schedule.view', 'schedule.create', 'schedule.edit',
    'task.view', 'task.create', 'task.edit', 'task.update', 'leave.view', 'leave.approve', 'leave.reject',
    'announcement.view', 'announcement.create', 'report.view', 'profile.view', 'profile.edit'
  ];
  pjPermissions.forEach(pId => {
    role_permissions.push({
      id: `rp-pj-${pId}`,
      role_id: 'pj_klinik',
      permission_id: pId,
    });
  });

  // Karyawan default permissions
  const karyawanPermissions = [
    'dashboard.view', 'profile.view', 'profile.edit', 'schedule.view', 'task.view', 'task.update',
    'leave.view', 'leave.create', 'announcement.view'
  ];
  karyawanPermissions.forEach(pId => {
    role_permissions.push({
      id: `rp-karyawan-${pId}`,
      role_id: 'karyawan',
      permission_id: pId,
    });
  });

  // Generate Employees & Users
  // Passwords:
  // Owner default: GocOwner2026!
  // Staff default: GocPass2026!
  const ownerPass = hashPassword('GocOwner2026!');
  const staffPass = hashPassword('GocPass2026!');

  const rawStaff = [
    {
      empId: 'emp-001',
      userId: 'user-001',
      empNumber: 'GOC-001',
      name: 'Hendri Kurniawan, ST., MMSI',
      username: 'hendri.kurniawan',
      email: 'hendri.kurniawan@galaxyortho.com',
      phone: '081288880001',
      deptId: 'dept-mgt',
      posId: 'pos-owner',
      roleId: 'owner',
      managerId: null,
      joinDate: '2020-01-01',
      pass: ownerPass,
      mustChange: true, // Master prompt: Paksa Owner mengganti password setelah login pertama
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      notes: 'Owner & Founder Galaxy Orthodontic Center. Memiliki hak akses penuh sistem.',
    },
    {
      empId: 'emp-002',
      userId: 'user-002',
      empNumber: 'GOC-002',
      name: 'drg. Ervina Dewiyanti, Sp.Ort., FICD',
      username: 'ervina.dewiyanti',
      email: 'ervina.dewiyanti@galaxyortho.com',
      phone: '081288880002',
      deptId: 'dept-mgt',
      posId: 'pos-pj',
      roleId: 'pj_klinik',
      managerId: 'emp-001',
      joinDate: '2020-06-01',
      pass: staffPass,
      mustChange: false,
      photo: 'https://images.unsplash.com/photo-1594824813576-96b63d91cf37?w=150&auto=format&fit=crop&q=80',
      notes: 'Penanggung Jawab Medis & Kepala Operasional Klinik.',
    },
    {
      empId: 'emp-003',
      userId: 'user-003',
      empNumber: 'GOC-003',
      name: 'Mareta Ismi Kurnia',
      username: 'mareta.ismi',
      email: 'mareta.ismi@galaxyortho.com',
      phone: '081288880003',
      deptId: 'dept-adm',
      posId: 'pos-adm',
      roleId: 'karyawan',
      managerId: 'emp-002',
      joinDate: '2021-03-15',
      pass: staffPass,
      mustChange: false,
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      notes: 'Staff Administrasi Front Office & Rekam Medis Pasien.',
    },
    {
      empId: 'emp-004',
      userId: 'user-004',
      empNumber: 'GOC-004',
      name: 'Yanti Rosalina',
      username: 'yanti.rosalina',
      email: 'yanti.rosalina@galaxyortho.com',
      phone: '081288880004',
      deptId: 'dept-adm',
      posId: 'pos-adm',
      roleId: 'karyawan',
      managerId: 'emp-002',
      joinDate: '2021-08-01',
      pass: staffPass,
      mustChange: false,
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      notes: 'Staff Administrasi Registrasi & Reservasi Jadwal Pasien.',
    },
    {
      empId: 'emp-005',
      userId: 'user-005',
      empNumber: 'GOC-005',
      name: 'Weli Apriyani',
      username: 'weli.apriyani',
      email: 'weli.apriyani@galaxyortho.com',
      phone: '081288880005',
      deptId: 'dept-fin',
      posId: 'pos-fin',
      roleId: 'karyawan',
      managerId: 'emp-002',
      joinDate: '2022-01-10',
      pass: staffPass,
      mustChange: false,
      photo: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
      notes: 'Staff Finance & Accounting. Mengelola keuangan dan payroll klinik.',
    },
    {
      empId: 'emp-006',
      userId: 'user-006',
      empNumber: 'GOC-006',
      name: 'Muhammad Ridwan Hadjriyanto',
      username: 'ridwan.hadjriyanto',
      email: 'digitalmarketinggoc510@gmail.com', // Matched to user runtime email!
      phone: '081288880006',
      deptId: 'dept-mkt',
      posId: 'pos-mkt',
      roleId: 'karyawan',
      managerId: 'emp-002',
      joinDate: '2022-05-15',
      pass: staffPass,
      mustChange: false,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      notes: 'Digital Marketing & Social Media Strategist Galaxy Orthodontic Center.',
    },
    {
      empId: 'emp-007',
      userId: 'user-007',
      empNumber: 'GOC-007',
      name: 'Adelia Suci',
      username: 'adelia.suci',
      email: 'adelia.suci@galaxyortho.com',
      phone: '081288880007',
      deptId: 'dept-prw',
      posId: 'pos-prw',
      roleId: 'karyawan',
      managerId: 'emp-002',
      joinDate: '2022-09-01',
      pass: staffPass,
      mustChange: false,
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      notes: 'Perawat Gigi Asistensi Orthodonti & Sterilisasi Instrumen Medis.',
    },
    {
      empId: 'emp-008',
      userId: 'user-008',
      empNumber: 'GOC-008',
      name: 'Siti Marfuah',
      username: 'siti.marfuah',
      email: 'siti.marfuah@galaxyortho.com',
      phone: '081288880008',
      deptId: 'dept-prw',
      posId: 'pos-prw',
      roleId: 'karyawan',
      managerId: 'emp-002',
      joinDate: '2023-02-01',
      pass: staffPass,
      mustChange: false,
      photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      notes: 'Perawat Gigi Klinis & Manajemen Inventaris Dental.',
    },
  ];

  const users: User[] = [];
  const employees: Employee[] = [];
  const user_permissions: UserPermission[] = [];

  rawStaff.forEach(s => {
    users.push({
      id: s.userId,
      username: s.username,
      email: s.email,
      password_hash: s.pass.hash,
      salt: s.pass.salt,
      role_id: s.roleId,
      employee_id: s.empId,
      status: 'ACTIVE',
      must_change_password: s.mustChange,
      last_login: null,
      created_at: now,
      updated_at: now,
    });

    employees.push({
      id: s.empId,
      user_id: s.userId,
      employee_number: s.empNumber,
      full_name: s.name,
      email: s.email,
      phone: s.phone,
      department_id: s.deptId,
      position_id: s.posId,
      manager_id: s.managerId,
      join_date: s.joinDate,
      exit_date: null,
      status: 'ACTIVE',
      photo: s.photo,
      notes: s.notes,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });
  });

  // Weli Apriyani (Finance) receives custom permission to view & manage payroll!
  user_permissions.push(
    { id: 'up-weli-payroll-view', user_id: 'user-005', permission_id: 'payroll.view', allowed: true },
    { id: 'up-weli-payroll-create', user_id: 'user-005', permission_id: 'payroll.create', allowed: true },
    { id: 'up-weli-payroll-edit', user_id: 'user-005', permission_id: 'payroll.edit', allowed: true },
    { id: 'up-weli-report-view', user_id: 'user-005', permission_id: 'report.view', allowed: true },
  );

  // Initial Tasks
  const tasks: Task[] = [
    {
      id: 'task-001',
      title: 'Audit & Kalibrasi Instrumen Orthodonti Ruang 1 & 2',
      description: 'Lakukan pemeriksaan sterilitas dan kelengkapan pliers, bracket kit, dan light curing unit.',
      assigned_to: 'emp-007', // Adelia Suci
      created_by: 'user-002', // drg. Ervina
      priority: 'HIGH',
      deadline: '2026-10-15',
      status: 'IN_PROGRESS',
      attachment_name: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'task-002',
      title: 'Penyusunan Konten Edukasi Invisalign & Behel Transparan',
      description: 'Buat 5 draft carousel Instagram & video edukasi TikTok tentang pemeliharaan behel.',
      assigned_to: 'emp-006', // Ridwan Hadjriyanto
      created_by: 'user-001', // Hendri Kurniawan
      priority: 'MEDIUM',
      deadline: '2026-10-12',
      status: 'TODO',
      attachment_name: 'brief_campaign_okt.pdf',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'task-003',
      title: 'Rekonsiliasi Pembayaran Asuransi & Rekam Medis Pasien',
      description: 'Verifikasi klaim asuransi bulan September dan update status rekam medis pada sistem SIM-Klinik.',
      assigned_to: 'emp-003', // Mareta Ismi
      created_by: 'user-002', // drg. Ervina
      priority: 'URGENT',
      deadline: '2026-10-08',
      status: 'TODO',
      attachment_name: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'task-004',
      title: 'Penyiapan Laporan Penggajian & Insentif Periode September',
      description: 'Hitung kehadiran shift lembur dan insentif asistensi tindakan bedah minor.',
      assigned_to: 'emp-005', // Weli Apriyani
      created_by: 'user-001', // Hendri Kurniawan
      priority: 'HIGH',
      deadline: '2026-10-05',
      status: 'DONE',
      attachment_name: null,
      created_at: now,
      updated_at: now,
    }
  ];

  const task_comments: TaskComment[] = [
    {
      id: 'tc-001',
      task_id: 'task-001',
      user_id: 'user-007',
      user_name: 'Adelia Suci',
      comment: 'Ruang 1 sudah selesai dikalibrasi, lanjut pengerjaan alat di Ruang 2 sore ini Dok.',
      created_at: now,
    },
    {
      id: 'tc-002',
      task_id: 'task-004',
      user_id: 'user-005',
      user_name: 'Weli Apriyani',
      comment: 'Draft penggajian sudah selesai diverifikasi dan siap ditinjau oleh Pak Hendri.',
      created_at: now,
    }
  ];

  // Schedules
  const schedules: Schedule[] = [
    {
      id: 'sch-001',
      title: 'Shift Pagi Poli Orthodonti (08:30 - 16:30)',
      type: 'SHIFT',
      start_date: '2026-10-05',
      end_date: '2026-10-05',
      start_time: '08:30',
      end_time: '16:30',
      user_ids: ['emp-003', 'emp-007'],
      notes: 'Pelayanan poli behel dan konsultasi cetak gigi.',
      created_by: 'user-002',
      created_at: now,
    },
    {
      id: 'sch-002',
      title: 'Shift Siang / Sore Poli Orthodonti (13:00 - 21:00)',
      type: 'SHIFT',
      start_date: '2026-10-05',
      end_date: '2026-10-05',
      start_time: '13:00',
      end_time: '21:00',
      user_ids: ['emp-004', 'emp-008'],
      notes: 'Penanganan pasien kontrol berkala kawat gigi.',
      created_by: 'user-002',
      created_at: now,
    },
    {
      id: 'sch-003',
      title: 'Rapat Evaluasi Mutu & Pelayanan Bulanan GOC',
      type: 'MEETING',
      start_date: '2026-10-10',
      end_date: '2026-10-10',
      start_time: '16:30',
      end_time: '18:00',
      user_ids: ['emp-001', 'emp-002', 'emp-003', 'emp-004', 'emp-005', 'emp-006', 'emp-007', 'emp-008'],
      notes: 'Evaluasi kepuasan pasien dan koordinasi promo Dies Natalis GOC.',
      created_by: 'user-001',
      created_at: now,
    },
    {
      id: 'sch-004',
      title: 'Libur Operasional Klinik (Pembersihan Menyeluruh & Sterilisasi)',
      type: 'LIBUR',
      start_date: '2026-10-18',
      end_date: '2026-10-18',
      start_time: '00:00',
      end_time: '23:59',
      user_ids: [],
      notes: 'Klinik tutup untuk fumigasi dan sterilisasi total.',
      created_by: 'user-001',
      created_at: now,
    }
  ];

  // Leave requests
  const leave_requests: LeaveRequest[] = [
    {
      id: 'leave-001',
      employee_id: 'emp-008', // Siti Marfuah
      type: 'CUTI',
      start_date: '2026-10-20',
      end_date: '2026-10-22',
      total_days: 3,
      reason: 'Keperluan keluarga di luar kota.',
      attachment_name: null,
      status: 'PENDING',
      approved_by: null,
      approval_notes: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'leave-002',
      employee_id: 'emp-004', // Yanti Rosalina
      type: 'SAKIT',
      start_date: '2026-09-25',
      end_date: '2026-09-26',
      total_days: 2,
      reason: 'Demam dan flu, istirahat dokter.',
      attachment_name: 'surat_dokter_yanti.jpg',
      status: 'APPROVED',
      approved_by: 'user-002',
      approval_notes: 'Disetujui. Lekas pulih.',
      created_at: now,
      updated_at: now,
    }
  ];

  // Payroll
  const payroll: PayrollRecord[] = [
    {
      id: 'pay-001',
      employee_id: 'emp-001', // Hendri Kurniawan (Owner - marked private)
      period: 'Oktober 2026',
      base_salary: 25000000,
      allowance: 5000000,
      bonus: 10000000,
      deduction: 0,
      total_salary: 40000000,
      payment_status: 'PAID',
      payment_date: '2026-10-01',
      notes: 'Dividen pimpinan & kompensasi operasional.',
      is_private: true,
      created_by: 'user-001',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'pay-002',
      employee_id: 'emp-002', // drg. Ervina
      period: 'Oktober 2026',
      base_salary: 15000000,
      allowance: 3000000,
      bonus: 4500000,
      deduction: 0,
      total_salary: 22500000,
      payment_status: 'PROCESS',
      payment_date: null,
      notes: 'Honorarium PJ Klinik & jasa medis orthodonti.',
      is_private: false,
      created_by: 'user-005',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'pay-003',
      employee_id: 'emp-003', // Mareta Ismi
      period: 'Oktober 2026',
      base_salary: 5000000,
      allowance: 1000000,
      bonus: 500000,
      deduction: 0,
      total_salary: 6500000,
      payment_status: 'DRAFT',
      payment_date: null,
      notes: 'Gaji pokok, uang makan, dan insentif layanan prima.',
      is_private: false,
      created_by: 'user-005',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'pay-004',
      employee_id: 'emp-005', // Weli Apriyani
      period: 'Oktober 2026',
      base_salary: 5200000,
      allowance: 1000000,
      bonus: 400000,
      deduction: 0,
      total_salary: 6600000,
      payment_status: 'DRAFT',
      payment_date: null,
      notes: 'Gaji pokok dan tunjangan keuangan.',
      is_private: false,
      created_by: 'user-005',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'pay-005',
      employee_id: 'emp-006', // Ridwan Hadjriyanto
      period: 'Oktober 2026',
      base_salary: 5500000,
      allowance: 1200000,
      bonus: 800000,
      deduction: 0,
      total_salary: 7500000,
      payment_status: 'DRAFT',
      payment_date: null,
      notes: 'Gaji pokok dan bonus performa digital leads.',
      is_private: false,
      created_by: 'user-005',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'pay-006',
      employee_id: 'emp-007', // Adelia Suci
      period: 'Oktober 2026',
      base_salary: 4800000,
      allowance: 900000,
      bonus: 600000,
      deduction: 0,
      total_salary: 6300000,
      payment_status: 'DRAFT',
      payment_date: null,
      notes: 'Gaji perawat gigi dan insentif tindakan asistensi.',
      is_private: false,
      created_by: 'user-005',
      created_at: now,
      updated_at: now,
    },
  ];

  // Announcements
  const announcements: Announcement[] = [
    {
      id: 'anc-001',
      title: 'Pemberitahuan: Prosedur Standar Baru Sterilisasi Alat Orthodonti',
      content: 'Kepada seluruh tim medis dan perawat gigi, mohon menerapkan protokol pencatatan logbook suhu autoclave dan desinfeksi permukaan kursi dental setiap pergantian pasien.',
      target_type: 'ALL',
      target_id: null,
      publish_date: '2026-10-01',
      status: 'PUBLISHED',
      author_id: 'user-002',
      author_name: 'drg. Ervina Dewiyanti, Sp.Ort., FICD',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'anc-002',
      title: 'Jadwal Rapat Kerja & Briefing Promo Bulan Ini',
      content: 'Pertemuan koordinasi seluruh divisi akan diadakan hari Sabtu pukul 16:30 WIB di Ruang Diskusi GOC. Dimohon hadir tepat waktu.',
      target_type: 'ALL',
      target_id: null,
      publish_date: '2026-10-02',
      status: 'PUBLISHED',
      author_id: 'user-001',
      author_name: 'Hendri Kurniawan, ST., MMSI',
      created_at: now,
      updated_at: now,
    }
  ];

  // Audit Logs
  const audit_logs: AuditLog[] = [
    {
      id: 'audit-001',
      user_id: 'user-001',
      user_name: 'Hendri Kurniawan, ST., MMSI',
      action: 'SYSTEM_INITIALIZATION',
      module: 'system',
      target_type: 'database',
      target_id: 'goc_database',
      description: 'Inisialisasi sistem GOC Team Management dengan struktur organisasi awal.',
      ip_address: '127.0.0.1',
      user_agent: 'GOC-Server-Init',
      created_at: now,
    },
    {
      id: 'audit-002',
      user_id: 'user-001',
      user_name: 'Hendri Kurniawan, ST., MMSI',
      action: 'CREATE_EMPLOYEE',
      module: 'team',
      target_type: 'employee',
      target_id: 'emp-002',
      description: 'Menambahkan drg. Ervina Dewiyanti sebagai Penanggung Jawab Klinik.',
      ip_address: '127.0.0.1',
      user_agent: 'GOC-Server-Init',
      created_at: now,
    },
    {
      id: 'audit-003',
      user_id: 'user-001',
      user_name: 'Hendri Kurniawan, ST., MMSI',
      action: 'CHANGE_PERMISSION',
      module: 'access',
      target_type: 'user',
      target_id: 'user-005',
      description: 'Memberikan permission khusus payroll.view dan payroll.create kepada Weli Apriyani.',
      ip_address: '127.0.0.1',
      user_agent: 'GOC-Server-Init',
      created_at: now,
    }
  ];

  // Notifications covering all requested alert categories
  const notifications: AppNotification[] = [
    {
      id: 'notif-001',
      user_id: 'user-001',
      title: 'Pengajuan Cuti Baru',
      message: 'Siti Marfuah mengajukan cuti 3 hari (20 - 22 Oktober 2026). Menunggu persetujuan.',
      type: 'LEAVE',
      priority: 'HIGH',
      read: false,
      link: '/leave',
      metadata: { leaveId: 'leave-001', status: 'PENDING' },
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-002',
      user_id: 'user-001',
      title: 'Pembaruan Payroll',
      message: 'Dividen & kompensasi operasional periode Oktober 2026 telah diproses dan berstatus PAID.',
      type: 'PAYROLL',
      priority: 'NORMAL',
      read: false,
      link: '/payroll',
      metadata: { amount: 40000000, status: 'PAID' },
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-003',
      user_id: 'user-001',
      title: 'Peringatan Deadline Tugas',
      message: 'Tugas "Rekonsiliasi Pembayaran Asuransi" oleh Mareta Ismi mendekati batas waktu (08 Okt 2026).',
      type: 'DEADLINE',
      priority: 'URGENT',
      read: false,
      link: '/tasks',
      metadata: { taskId: 'task-003', dueDate: '2026-10-08' },
      created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-004',
      user_id: 'user-006',
      title: 'Peringatan Deadline Tugas',
      message: 'Tugas "Penyusunan Konten Edukasi Invisalign & Behel Transparan" jatuh tempo tanggal 12 Okt 2026.',
      type: 'DEADLINE',
      priority: 'HIGH',
      read: false,
      link: '/tasks',
      metadata: { taskId: 'task-002', dueDate: '2026-10-12' },
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-005',
      user_id: 'user-006',
      title: 'Tugas Baru Diterima',
      message: 'Pak Hendri Kurniawan menugaskan Anda: Penyusunan Konten Edukasi Invisalign & Behel Transparan.',
      type: 'TASK',
      priority: 'NORMAL',
      read: false,
      link: '/tasks',
      metadata: { taskId: 'task-002' },
      created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-006',
      user_id: 'user-006',
      title: 'Pembaruan Payroll',
      message: 'Slip gaji periode Oktober 2026 telah dibuat oleh bagian Finance. Total Net: Rp 7.500.000.',
      type: 'PAYROLL',
      priority: 'NORMAL',
      read: true,
      link: '/payroll',
      metadata: { amount: 7500000, status: 'DRAFT' },
      created_at: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-007',
      user_id: 'user-007',
      title: 'Tugas Baru Diberikan',
      message: 'drg. Ervina memberikan tugas: Audit & Kalibrasi Instrumen Orthodonti Ruang 1 & 2.',
      type: 'TASK',
      priority: 'HIGH',
      read: false,
      link: '/tasks',
      metadata: { taskId: 'task-001' },
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-008',
      user_id: 'user-004',
      title: 'Pengajuan Cuti Disetujui',
      message: 'Pengajuan izin sakit Anda tanggal 25-26 September 2026 telah DISETUJUI oleh drg. Ervina Dewiyanti.',
      type: 'LEAVE',
      priority: 'NORMAL',
      read: false,
      link: '/leave',
      metadata: { leaveId: 'leave-002', status: 'APPROVED' },
      created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    }
  ];

  const settings: AppSettings = {
    id: 'settings-default',
    clinic_name: 'Galaxy Orthodontic Center (GOC)',
    app_name: 'GOC Team Management',
    logo_text: 'GOC',
    primary_color: '#800020',
    timezone: 'Asia/Jakarta',
    date_format: 'DD/MM/YYYY',
    allow_notifications: true,
    session_timeout_minutes: 120,
    require_strong_password: true,
    updated_at: now,
  };

  // Forum Channels
  const allUserIds = ['user-001', 'user-002', 'user-003', 'user-004', 'user-005', 'user-006', 'user-007', 'user-008'];

  const forum_channels: ForumChannel[] = [
    {
      id: 'channel-all-team',
      name: 'Semua Tim GOC (All Team)',
      description: 'Forum diskusi umum untuk koordinasi seluruh divisi dan pengumuman cepat operasional klinik.',
      type: 'ALL_TEAM',
      department_id: null,
      department_name: 'Seluruh Divisi',
      member_ids: allUserIds,
      created_by: 'user-001',
      ai_enabled: true,
      ai_persona: 'Konsultan Operasional & Klinis GOC',
      last_message_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      last_message_preview: 'GOC AI Assistant: Tips operasional menjaga kepuasan pasien orthodonti...',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'channel-dept-adm',
      name: 'Divisi Administrasi & Front Office',
      description: 'Diskusi rekam medis, antrean pasien, konfirmasi jadwal orthodonti, dan pendaftaran.',
      type: 'DEPARTMENT',
      department_id: 'dept-adm',
      department_name: 'Administrasi',
      member_ids: ['user-001', 'user-002', 'user-003', 'user-004'],
      created_by: 'user-002',
      ai_enabled: true,
      last_message_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      last_message_preview: 'Mareta: Rekam medis pasien behel sesi sore sudah diverifikasi.',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'channel-dept-fin',
      name: 'Divisi Finance & Accounting',
      description: 'Diskusi privat keuangan, klaim reimbursement, dan verifikasi payroll klinik.',
      type: 'DEPARTMENT',
      department_id: 'dept-fin',
      department_name: 'Finance',
      member_ids: ['user-001', 'user-002', 'user-005'],
      created_by: 'user-001',
      ai_enabled: true,
      last_message_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      last_message_preview: 'Weli: Laporan rekonsiliasi kas operasional minggu ini siap ditinjau.',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'channel-dept-mkt',
      name: 'Divisi Digital Marketing & Leads',
      description: 'Strategi konten edukasi behel, iklan Instagram Ads, dan follow-up calon pasien.',
      type: 'DEPARTMENT',
      department_id: 'dept-mkt',
      department_name: 'Digital Marketing',
      member_ids: ['user-001', 'user-006'],
      created_by: 'user-001',
      ai_enabled: true,
      last_message_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      last_message_preview: 'M. Ridwan: Campaign promo behel transparan mengalami kenaikan CTR 28%.',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'channel-dept-prw',
      name: 'Divisi Perawat Gigi & Sterilisasi',
      description: 'Checklist autoclave, kalibrasi instrumen orthodonti, dan asistensi dokter gigi.',
      type: 'DEPARTMENT',
      department_id: 'dept-prw',
      department_name: 'Perawat Gigi',
      member_ids: ['user-001', 'user-002', 'user-007', 'user-008'],
      created_by: 'user-002',
      ai_enabled: true,
      last_message_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
      last_message_preview: 'Adelia: Tray instrumen bracket bonding untuk Ruang 1 sudah steril 100%.',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'channel-vip-ortho',
      name: 'Kasus Khusus Orthodonti & VIP (Invited)',
      description: 'Ruang privat terbatas untuk studi kasus ortodonti kompleks, analisis aligner, dan pasien VIP.',
      type: 'PRIVATE_INVITED',
      department_id: null,
      department_name: 'Privat Khusus',
      member_ids: ['user-001', 'user-002', 'user-007'],
      created_by: 'user-002',
      ai_enabled: true,
      last_message_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      last_message_preview: 'drg. Ervina: Rencana ekstraksi premolar untuk pasien Ny. Sarah sudah difinalisasi.',
      created_at: now,
      updated_at: now,
    }
  ];

  // Forum Messages
  const forum_messages: ForumMessage[] = [
    {
      id: 'msg-001',
      channel_id: 'channel-all-team',
      sender_id: 'user-001',
      sender_name: 'Hendri Kurniawan, ST., MMSI',
      sender_role: 'Owner / Super Admin',
      sender_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      is_ai: false,
      content: 'Selamat pagi seluruh tim GOC! Forum diskusi terpusat ini telah aktif. Silakan gunakan untuk koordinasi lintas divisi, diskusi kasus klinis, dan koordinasi operasional.',
      read_by: ['user-001', 'user-002', 'user-003'],
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-002',
      channel_id: 'channel-all-team',
      sender_id: 'user-002',
      sender_name: 'drg. Ervina Dewiyanti, Sp.Ort., FICD',
      sender_role: 'Penanggung Jawab Klinik',
      sender_avatar: 'https://images.unsplash.com/photo-1594824813576-96b63d91cf37?w=150&auto=format&fit=crop&q=80',
      is_ai: false,
      content: 'Terima kasih Pak Hendri. Mohon perhatian rekan-rekan perawat dan adm, hari ini jadwal pasien pasang behel dan kontrol cukup padat. Pastikan kelengkapan tray siap 15 menit sebelum pasien tiba.',
      read_by: ['user-001', 'user-002', 'user-003'],
      created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-003',
      channel_id: 'channel-all-team',
      sender_id: 'user-007',
      sender_name: 'Adelia Suci',
      sender_role: 'Perawat Gigi',
      sender_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      is_ai: false,
      content: 'Baik Dokter Ervina! Tray instrumen bracket kit, buccal tube, dan etsa-bonding sudah kami siapkan di dental unit 1 dan 2.',
      read_by: ['user-001', 'user-002'],
      created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-004',
      channel_id: 'channel-all-team',
      sender_id: 'goc-ai-agent',
      sender_name: 'GOC AI Assistant',
      sender_role: 'Konsultan AI Klinis & Solusi',
      sender_avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      is_ai: true,
      content: '💡 **Tips Operasional GOC**: Untuk menjaga kepuasan pasien orthodonti pada sesi padat:\n1. Berikan wax ortodontik gratis & instruksi tertulis jika ada bracket yang menggesek pipi.\n2. Siapkan ice pack jika pasien mengalami rasa pegal setelah aktivasi archwire.\n3. Jangan ragu bertanya atau menyebut @AI jika memerlukan solusi kendala klinis/operasional!',
      read_by: ['user-001'],
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-vip-001',
      channel_id: 'channel-vip-ortho',
      sender_id: 'user-002',
      sender_name: 'drg. Ervina Dewiyanti, Sp.Ort., FICD',
      sender_role: 'Penanggung Jawab Klinik',
      sender_avatar: 'https://images.unsplash.com/photo-1594824813576-96b63d91cf37?w=150&auto=format&fit=crop&q=80',
      is_ai: false,
      content: 'Pak Hendri & Adelia, untuk kasus crowding berat pasien Ny. Sarah, kita akan gunakan self-ligating bracket Damon dengan ekspansi lengkung bertahap. Mohon siapkan archwire CuNiTi 0.014.',
      read_by: ['user-001', 'user-002'],
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    }
  ];

  // Video Meetings
  const video_meetings: VideoMeeting[] = [
    {
      id: 'meet-001',
      title: 'Koordinasi Operasional & Pasien VIP Mingguan',
      description: 'Evaluasi jadwal pasien orthodonti, ketersediaan inventaris aligner, dan koordinasi dokter & staf.',
      host_id: 'user-002',
      host_name: 'drg. Ervina Dewiyanti, Sp.Ort., FICD',
      channel_id: 'channel-all-team',
      status: 'LIVE',
      scheduled_start: now,
      started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      participant_ids: ['user-001', 'user-002', 'user-007'],
      invited_ids: allUserIds,
      room_code: 'GOC-VIP-2026',
      created_at: now,
    },
    {
      id: 'meet-002',
      title: 'Briefing Pagi: SOP Pelayanan Prima & Sterilisasi',
      description: 'Review protokol kebersihan dental unit dan keramahan front office dalam menyambut pasien baru.',
      host_id: 'user-001',
      host_name: 'Hendri Kurniawan, ST., MMSI',
      channel_id: 'channel-all-team',
      status: 'SCHEDULED',
      scheduled_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      participant_ids: [],
      invited_ids: allUserIds,
      room_code: 'GOC-SOP-BRF',
      created_at: now,
    }
  ];

  return {
    departments,
    positions,
    roles,
    permissions: ALL_PERMISSIONS,
    role_permissions,
    user_permissions,
    users,
    employees,
    tasks,
    task_comments,
    schedules,
    leave_requests,
    payroll,
    announcements,
    audit_logs,
    notifications,
    settings,
    forum_channels,
    forum_messages,
    video_meetings,
  };
}

class Database {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.employees) {
          if (!parsed.forum_channels) {
            const seed = generateSeedData();
            parsed.forum_channels = seed.forum_channels;
            parsed.forum_messages = seed.forum_messages;
            parsed.video_meetings = seed.video_meetings;
            this.saveDataSync(parsed);
          }
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error loading database file, generating seed data:', err);
    }
    const seed = generateSeedData();
    this.saveDataSync(seed);
    return seed;
  }

  private saveDataSync(dataToSave: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DATA_FILE);
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  public persist() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveDataSync(this.data);
    }, 200);
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  // Audit Log helper
  public logAudit(entry: {
    userId: string;
    userName: string;
    action: string;
    module: string;
    targetType: string;
    targetId?: string | null;
    description: string;
    ip?: string;
    userAgent?: string;
  }) {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: entry.userId,
      user_name: entry.userName,
      action: entry.action,
      module: entry.module,
      target_type: entry.targetType,
      target_id: entry.targetId || null,
      description: entry.description,
      ip_address: entry.ip || '127.0.0.1',
      user_agent: entry.userAgent || 'Web Browser',
      created_at: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(log);
    // Keep max 500 logs in memory
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 500);
    }
    this.persist();
  }

  // Notification helper
  public sendNotification(entry: {
    userId: string;
    title: string;
    message: string;
    type: AppNotification['type'];
    priority?: AppNotification['priority'];
    metadata?: AppNotification['metadata'];
    link?: string | null;
  }) {
    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: entry.userId,
      title: entry.title,
      message: entry.message,
      type: entry.type,
      priority: entry.priority || 'NORMAL',
      metadata: entry.metadata || {},
      read: false,
      link: entry.link || null,
      created_at: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.persist();
  }
}

export const db = new Database();
