// server.ts
import express from "express";
import path2 from "node:path";
import fs2 from "node:fs";
import { fileURLToPath } from "node:url";

// src/server/api.ts
import { Router } from "express";
import crypto3 from "node:crypto";
import { GoogleGenAI } from "@google/genai";

// src/server/db.ts
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
var DATA_DIR = path.resolve(process.cwd(), "data");
var DATA_FILE = path.join(DATA_DIR, "goc_database.json");
function hashPassword(password, salt) {
  const chosenSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, chosenSalt, 1e4, 64, "sha512").toString("hex");
  return { hash, salt: chosenSalt };
}
function verifyPassword(password, hash, salt) {
  const check = crypto.pbkdf2Sync(password, salt, 1e4, 64, "sha512").toString("hex");
  return check === hash;
}
var ALL_PERMISSIONS = [
  { id: "dashboard.view", name: "Lihat Dashboard", module: "dashboard", action: "view", description: "Melihat ringkasan statistik dan aktivitas" },
  { id: "organization.view", name: "Lihat Organisasi", module: "organization", action: "view", description: "Melihat bagan struktur organisasi" },
  { id: "team.view", name: "Lihat Team GOC", module: "team", action: "view", description: "Melihat daftar seluruh anggota tim dan karyawan" },
  { id: "team.create", name: "Tambah Karyawan", module: "team", action: "create", description: "Menambahkan anggota tim/karyawan baru" },
  { id: "team.edit", name: "Ubah Data Karyawan", module: "team", action: "edit", description: "Memperbarui informasi data karyawan" },
  { id: "team.activate", name: "Aktifkan Karyawan", module: "team", action: "activate", description: "Mengaktifkan status akun karyawan" },
  { id: "team.deactivate", name: "Nonaktifkan Karyawan", module: "team", action: "deactivate", description: "Menonaktifkan status akun karyawan" },
  { id: "team.delete", name: "Hapus Karyawan", module: "team", action: "delete", description: "Menghapus permanen data karyawan" },
  { id: "access.manage", name: "Atur Hak Akses", module: "access", action: "manage", description: "Mengelola hak akses dan permission user" },
  { id: "schedule.view", name: "Lihat Jadwal", module: "schedule", action: "view", description: "Melihat jadwal kerja, shift, dan agenda klinik" },
  { id: "schedule.create", name: "Buat Jadwal", module: "schedule", action: "create", description: "Membuat jadwal baru atau jadwal shift" },
  { id: "schedule.edit", name: "Ubah Jadwal", module: "schedule", action: "edit", description: "Mengubah jadwal kerja dan kalender" },
  { id: "schedule.delete", name: "Hapus Jadwal", module: "schedule", action: "delete", description: "Menghapus jadwal yang telah dibuat" },
  { id: "task.view", name: "Lihat Tugas", module: "task", action: "view", description: "Melihat daftar tugas" },
  { id: "task.create", name: "Buat Tugas Baru", module: "task", action: "create", description: "Membuat dan menetapkan tugas baru" },
  { id: "task.edit", name: "Ubah Tugas", module: "task", action: "edit", description: "Mengubah detail tugas orang lain" },
  { id: "task.update", name: "Perbarui Status Tugas", module: "task", action: "update", description: "Memperbarui progress dan status tugas sendiri" },
  { id: "task.delete", name: "Hapus Tugas", module: "task", action: "delete", description: "Menghapus tugas dari sistem" },
  { id: "leave.view", name: "Lihat Cuti & Izin", module: "leave", action: "view", description: "Melihat riwayat pengajuan cuti dan izin" },
  { id: "leave.create", name: "Ajukan Cuti & Izin", module: "leave", action: "create", description: "Membuat pengajuan cuti/izin/sakit" },
  { id: "leave.approve", name: "Setujui Pengajuan Cuti", module: "leave", action: "approve", description: "Menyetujui permohonan cuti dan izin" },
  { id: "leave.reject", name: "Tolak Pengajuan Cuti", module: "leave", action: "reject", description: "Menolak permohonan cuti dan izin" },
  { id: "payroll.view", name: "Lihat Payroll", module: "payroll", action: "view", description: "Melihat rincian penggajian dan slip gaji" },
  { id: "payroll.create", name: "Buat Data Payroll", module: "payroll", action: "create", description: "Membuat data gaji karyawan" },
  { id: "payroll.edit", name: "Ubah Data Payroll", module: "payroll", action: "edit", description: "Memperbarui nominal dan status penggajian" },
  { id: "payroll.delete", name: "Hapus Data Payroll", module: "payroll", action: "delete", description: "Menghapus data penggajian" },
  { id: "report.view", name: "Lihat Laporan", module: "report", action: "view", description: "Melihat laporan karyawan, absensi, cuti, tugas" },
  { id: "report.export", name: "Export Laporan", module: "report", action: "export", description: "Mengunduh laporan ke file CSV / Excel" },
  { id: "announcement.view", name: "Lihat Pengumuman", module: "announcement", action: "view", description: "Membaca pengumuman internal" },
  { id: "announcement.create", name: "Buat Pengumuman", module: "announcement", action: "create", description: "Membuat dan mempublikasikan pengumuman" },
  { id: "announcement.edit", name: "Ubah Pengumuman", module: "announcement", action: "edit", description: "Mengubah dan menghapus pengumuman" },
  { id: "announcement.delete", name: "Hapus Pengumuman", module: "announcement", action: "delete", description: "Menghapus pengumuman internal" },
  { id: "audit.view", name: "Lihat Audit Log", module: "audit", action: "view", description: "Melihat rekam jejak aktivitas sistem" },
  { id: "settings.view", name: "Lihat Pengaturan", module: "settings", action: "view", description: "Melihat konfigurasi sistem" },
  { id: "settings.edit", name: "Ubah Pengaturan", module: "settings", action: "edit", description: "Mengubah pengaturan klinik dan keamanan" },
  { id: "profile.view", name: "Lihat Profil", module: "profile", action: "view", description: "Melihat data profil diri sendiri" },
  { id: "profile.edit", name: "Ubah Profil", module: "profile", action: "edit", description: "Memperbarui kontak dan informasi pribadi" },
  { id: "forum.view", name: "Lihat Forum & Diskusi", module: "forum", action: "view", description: "Melihat dan berpartisipasi dalam forum diskusi tim" },
  { id: "forum.create", name: "Buat Channel Diskusi", module: "forum", action: "create", description: "Membuat channel forum baru atau percakapan privat" },
  { id: "meeting.host", name: "Host Video Meeting", module: "meeting", action: "host", description: "Membuat dan memimpin ruang video meeting virtual" }
];
function generateSeedData() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const departments = [
    { id: "dept-mgt", name: "Manajemen", description: "Pimpinan & Penanggung Jawab Klinik", status: "ACTIVE", created_at: now, updated_at: now },
    { id: "dept-adm", name: "Administrasi", description: "Front Office & Administrasi Pasien", status: "ACTIVE", created_at: now, updated_at: now },
    { id: "dept-fin", name: "Finance", description: "Keuangan & Penggajian", status: "ACTIVE", created_at: now, updated_at: now },
    { id: "dept-mkt", name: "Digital Marketing", description: "Pemasaran Digital, Media Sosial, & Branding", status: "ACTIVE", created_at: now, updated_at: now },
    { id: "dept-prw", name: "Perawat Gigi", description: "Asistensi Dokter Gigi & Pelayanan Medis", status: "ACTIVE", created_at: now, updated_at: now }
  ];
  const positions = [
    { id: "pos-owner", name: "Owner / Super Admin", department_id: "dept-mgt", description: "Pemilik & Pimpinan Tertinggi GOC", status: "ACTIVE", created_at: now, updated_at: now },
    { id: "pos-pj", name: "Penanggung Jawab Klinik", department_id: "dept-mgt", description: "Penanggung Jawab Medis & Operasional Klinik", status: "ACTIVE", created_at: now, updated_at: now },
    { id: "pos-adm", name: "Staff Administrasi", department_id: "dept-adm", description: "Petugas Administrasi & Pelayanan Pasien", status: "ACTIVE", created_at: now, updated_at: now },
    { id: "pos-fin", name: "Staff Finance", department_id: "dept-fin", description: "Petugas Keuangan & Pembukuan", status: "ACTIVE", created_at: now, updated_at: now },
    { id: "pos-mkt", name: "Digital Marketer", department_id: "dept-mkt", description: "Spesialis Pemasaran & Konten Digital", status: "ACTIVE", created_at: now, updated_at: now },
    { id: "pos-prw", name: "Perawat Gigi", department_id: "dept-prw", description: "Asisten Dokter Gigi & Sterilisasi Alat", status: "ACTIVE", created_at: now, updated_at: now }
  ];
  const roles = [
    { id: "owner", name: "Owner / Super Admin", description: "Akses penuh terhadap seluruh sistem dan pengaturan GOC", created_at: now, updated_at: now },
    { id: "pj_klinik", name: "Penanggung Jawab Klinik", description: "Pengawasan operasional klinik, persetujuan cuti, tugas tim", created_at: now, updated_at: now },
    { id: "karyawan", name: "Karyawan", description: "Anggota tim pelaksana GOC", created_at: now, updated_at: now }
  ];
  const role_permissions = [];
  ALL_PERMISSIONS.forEach((p) => {
    role_permissions.push({
      id: `rp-owner-${p.id}`,
      role_id: "owner",
      permission_id: p.id
    });
  });
  const pjPermissions = [
    "dashboard.view",
    "organization.view",
    "team.view",
    "schedule.view",
    "schedule.create",
    "schedule.edit",
    "task.view",
    "task.create",
    "task.edit",
    "task.update",
    "leave.view",
    "leave.approve",
    "leave.reject",
    "announcement.view",
    "announcement.create",
    "report.view",
    "profile.view",
    "profile.edit"
  ];
  pjPermissions.forEach((pId) => {
    role_permissions.push({
      id: `rp-pj-${pId}`,
      role_id: "pj_klinik",
      permission_id: pId
    });
  });
  const karyawanPermissions = [
    "dashboard.view",
    "profile.view",
    "profile.edit",
    "schedule.view",
    "task.view",
    "task.update",
    "leave.view",
    "leave.create",
    "announcement.view"
  ];
  karyawanPermissions.forEach((pId) => {
    role_permissions.push({
      id: `rp-karyawan-${pId}`,
      role_id: "karyawan",
      permission_id: pId
    });
  });
  const ownerPass = hashPassword("GocOwner2026!");
  const staffPass = hashPassword("GocPass2026!");
  const rawStaff = [
    {
      empId: "emp-001",
      userId: "user-001",
      empNumber: "GOC-001",
      name: "Hendri Kurniawan, ST., MMSI",
      username: "hendri.kurniawan",
      email: "hendri.kurniawan@galaxyortho.com",
      phone: "081288880001",
      deptId: "dept-mgt",
      posId: "pos-owner",
      roleId: "owner",
      managerId: null,
      joinDate: "2020-01-01",
      pass: ownerPass,
      mustChange: false,
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      notes: "Owner & Founder Galaxy Orthodontic Center. Memiliki hak akses penuh sistem."
    },
    {
      empId: "emp-002",
      userId: "user-002",
      empNumber: "GOC-002",
      name: "drg. Ervina Dewiyanti, Sp.Ort., FICD",
      username: "ervina.dewiyanti",
      email: "ervina.dewiyanti@galaxyortho.com",
      phone: "081288880002",
      deptId: "dept-mgt",
      posId: "pos-pj",
      roleId: "pj_klinik",
      managerId: "emp-001",
      joinDate: "2020-06-01",
      pass: staffPass,
      mustChange: false,
      photo: "https://images.unsplash.com/photo-1594824813576-96b63d91cf37?w=150&auto=format&fit=crop&q=80",
      notes: "Penanggung Jawab Medis & Kepala Operasional Klinik."
    },
    {
      empId: "emp-003",
      userId: "user-003",
      empNumber: "GOC-003",
      name: "Mareta Ismi Kurnia",
      username: "mareta.ismi",
      email: "mareta.ismi@galaxyortho.com",
      phone: "081288880003",
      deptId: "dept-adm",
      posId: "pos-adm",
      roleId: "karyawan",
      managerId: "emp-002",
      joinDate: "2021-03-15",
      pass: staffPass,
      mustChange: false,
      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      notes: "Staff Administrasi Front Office & Rekam Medis Pasien."
    },
    {
      empId: "emp-004",
      userId: "user-004",
      empNumber: "GOC-004",
      name: "Yanti Rosalina",
      username: "yanti.rosalina",
      email: "yanti.rosalina@galaxyortho.com",
      phone: "081288880004",
      deptId: "dept-adm",
      posId: "pos-adm",
      roleId: "karyawan",
      managerId: "emp-002",
      joinDate: "2021-08-01",
      pass: staffPass,
      mustChange: false,
      photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      notes: "Staff Administrasi Registrasi & Reservasi Jadwal Pasien."
    },
    {
      empId: "emp-005",
      userId: "user-005",
      empNumber: "GOC-005",
      name: "Weli Apriyani",
      username: "weli.apriyani",
      email: "weli.apriyani@galaxyortho.com",
      phone: "081288880005",
      deptId: "dept-fin",
      posId: "pos-fin",
      roleId: "karyawan",
      managerId: "emp-002",
      joinDate: "2022-01-10",
      pass: staffPass,
      mustChange: false,
      photo: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
      notes: "Staff Finance & Accounting. Mengelola keuangan dan payroll klinik."
    },
    {
      empId: "emp-006",
      userId: "user-006",
      empNumber: "GOC-006",
      name: "Muhammad Ridwan Hadjriyanto",
      username: "ridwan.hadjriyanto",
      email: "digitalmarketinggoc510@gmail.com",
      // Matched to user runtime email!
      phone: "081288880006",
      deptId: "dept-mkt",
      posId: "pos-mkt",
      roleId: "karyawan",
      managerId: "emp-002",
      joinDate: "2022-05-15",
      pass: staffPass,
      mustChange: false,
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      notes: "Digital Marketing & Social Media Strategist Galaxy Orthodontic Center."
    },
    {
      empId: "emp-007",
      userId: "user-007",
      empNumber: "GOC-007",
      name: "Adelia Suci",
      username: "adelia.suci",
      email: "adelia.suci@galaxyortho.com",
      phone: "081288880007",
      deptId: "dept-prw",
      posId: "pos-prw",
      roleId: "karyawan",
      managerId: "emp-002",
      joinDate: "2022-09-01",
      pass: staffPass,
      mustChange: false,
      photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      notes: "Perawat Gigi Asistensi Orthodonti & Sterilisasi Instrumen Medis."
    },
    {
      empId: "emp-008",
      userId: "user-008",
      empNumber: "GOC-008",
      name: "Siti Marfuah",
      username: "siti.marfuah",
      email: "siti.marfuah@galaxyortho.com",
      phone: "081288880008",
      deptId: "dept-prw",
      posId: "pos-prw",
      roleId: "karyawan",
      managerId: "emp-002",
      joinDate: "2023-02-01",
      pass: staffPass,
      mustChange: false,
      photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
      notes: "Perawat Gigi Klinis & Manajemen Inventaris Dental."
    }
  ];
  const users = [];
  const employees = [];
  const user_permissions = [];
  rawStaff.forEach((s) => {
    users.push({
      id: s.userId,
      username: s.username,
      email: s.email,
      password_hash: s.pass.hash,
      salt: s.pass.salt,
      role_id: s.roleId,
      employee_id: s.empId,
      status: "ACTIVE",
      must_change_password: s.mustChange,
      last_login: null,
      created_at: now,
      updated_at: now
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
      status: "ACTIVE",
      photo: s.photo,
      notes: s.notes,
      created_at: now,
      updated_at: now,
      deleted_at: null
    });
  });
  user_permissions.push(
    { id: "up-weli-payroll-view", user_id: "user-005", permission_id: "payroll.view", allowed: true },
    { id: "up-weli-payroll-create", user_id: "user-005", permission_id: "payroll.create", allowed: true },
    { id: "up-weli-payroll-edit", user_id: "user-005", permission_id: "payroll.edit", allowed: true },
    { id: "up-weli-report-view", user_id: "user-005", permission_id: "report.view", allowed: true }
  );
  const tasks = [
    {
      id: "task-001",
      title: "Audit & Kalibrasi Instrumen Orthodonti Ruang 1 & 2",
      description: "Lakukan pemeriksaan sterilitas dan kelengkapan pliers, bracket kit, dan light curing unit.",
      assigned_to: "emp-007",
      // Adelia Suci
      created_by: "user-002",
      // drg. Ervina
      priority: "HIGH",
      deadline: "2026-10-15",
      status: "IN_PROGRESS",
      attachment_name: null,
      created_at: now,
      updated_at: now
    },
    {
      id: "task-002",
      title: "Penyusunan Konten Edukasi Invisalign & Behel Transparan",
      description: "Buat 5 draft carousel Instagram & video edukasi TikTok tentang pemeliharaan behel.",
      assigned_to: "emp-006",
      // Ridwan Hadjriyanto
      created_by: "user-001",
      // Hendri Kurniawan
      priority: "MEDIUM",
      deadline: "2026-10-12",
      status: "TODO",
      attachment_name: "brief_campaign_okt.pdf",
      created_at: now,
      updated_at: now
    },
    {
      id: "task-003",
      title: "Rekonsiliasi Pembayaran Asuransi & Rekam Medis Pasien",
      description: "Verifikasi klaim asuransi bulan September dan update status rekam medis pada sistem SIM-Klinik.",
      assigned_to: "emp-003",
      // Mareta Ismi
      created_by: "user-002",
      // drg. Ervina
      priority: "URGENT",
      deadline: "2026-10-08",
      status: "TODO",
      attachment_name: null,
      created_at: now,
      updated_at: now
    },
    {
      id: "task-004",
      title: "Penyiapan Laporan Penggajian & Insentif Periode September",
      description: "Hitung kehadiran shift lembur dan insentif asistensi tindakan bedah minor.",
      assigned_to: "emp-005",
      // Weli Apriyani
      created_by: "user-001",
      // Hendri Kurniawan
      priority: "HIGH",
      deadline: "2026-10-05",
      status: "DONE",
      attachment_name: null,
      created_at: now,
      updated_at: now
    }
  ];
  const task_comments = [
    {
      id: "tc-001",
      task_id: "task-001",
      user_id: "user-007",
      user_name: "Adelia Suci",
      comment: "Ruang 1 sudah selesai dikalibrasi, lanjut pengerjaan alat di Ruang 2 sore ini Dok.",
      created_at: now
    },
    {
      id: "tc-002",
      task_id: "task-004",
      user_id: "user-005",
      user_name: "Weli Apriyani",
      comment: "Draft penggajian sudah selesai diverifikasi dan siap ditinjau oleh Pak Hendri.",
      created_at: now
    }
  ];
  const schedules = [
    {
      id: "sch-001",
      title: "Shift Pagi Poli Orthodonti (08:30 - 16:30)",
      type: "SHIFT",
      start_date: "2026-10-05",
      end_date: "2026-10-05",
      start_time: "08:30",
      end_time: "16:30",
      user_ids: ["emp-003", "emp-007"],
      notes: "Pelayanan poli behel dan konsultasi cetak gigi.",
      created_by: "user-002",
      created_at: now
    },
    {
      id: "sch-002",
      title: "Shift Siang / Sore Poli Orthodonti (13:00 - 21:00)",
      type: "SHIFT",
      start_date: "2026-10-05",
      end_date: "2026-10-05",
      start_time: "13:00",
      end_time: "21:00",
      user_ids: ["emp-004", "emp-008"],
      notes: "Penanganan pasien kontrol berkala kawat gigi.",
      created_by: "user-002",
      created_at: now
    },
    {
      id: "sch-003",
      title: "Rapat Evaluasi Mutu & Pelayanan Bulanan GOC",
      type: "MEETING",
      start_date: "2026-10-10",
      end_date: "2026-10-10",
      start_time: "16:30",
      end_time: "18:00",
      user_ids: ["emp-001", "emp-002", "emp-003", "emp-004", "emp-005", "emp-006", "emp-007", "emp-008"],
      notes: "Evaluasi kepuasan pasien dan koordinasi promo Dies Natalis GOC.",
      created_by: "user-001",
      created_at: now
    },
    {
      id: "sch-004",
      title: "Libur Operasional Klinik (Pembersihan Menyeluruh & Sterilisasi)",
      type: "LIBUR",
      start_date: "2026-10-18",
      end_date: "2026-10-18",
      start_time: "00:00",
      end_time: "23:59",
      user_ids: [],
      notes: "Klinik tutup untuk fumigasi dan sterilisasi total.",
      created_by: "user-001",
      created_at: now
    }
  ];
  const leave_requests = [
    {
      id: "leave-001",
      employee_id: "emp-008",
      // Siti Marfuah
      type: "CUTI",
      start_date: "2026-10-20",
      end_date: "2026-10-22",
      total_days: 3,
      reason: "Keperluan keluarga di luar kota.",
      attachment_name: null,
      status: "PENDING",
      approved_by: null,
      approval_notes: null,
      created_at: now,
      updated_at: now
    },
    {
      id: "leave-002",
      employee_id: "emp-004",
      // Yanti Rosalina
      type: "SAKIT",
      start_date: "2026-09-25",
      end_date: "2026-09-26",
      total_days: 2,
      reason: "Demam dan flu, istirahat dokter.",
      attachment_name: "surat_dokter_yanti.jpg",
      status: "APPROVED",
      approved_by: "user-002",
      approval_notes: "Disetujui. Lekas pulih.",
      created_at: now,
      updated_at: now
    }
  ];
  const payroll = [
    {
      id: "pay-001",
      employee_id: "emp-001",
      // Hendri Kurniawan (Owner - marked private)
      period: "Oktober 2026",
      base_salary: 25e6,
      allowance: 5e6,
      bonus: 1e7,
      deduction: 0,
      total_salary: 4e7,
      payment_status: "PAID",
      payment_date: "2026-10-01",
      notes: "Dividen pimpinan & kompensasi operasional.",
      is_private: true,
      created_by: "user-001",
      created_at: now,
      updated_at: now
    },
    {
      id: "pay-002",
      employee_id: "emp-002",
      // drg. Ervina
      period: "Oktober 2026",
      base_salary: 15e6,
      allowance: 3e6,
      bonus: 45e5,
      deduction: 0,
      total_salary: 225e5,
      payment_status: "PROCESS",
      payment_date: null,
      notes: "Honorarium PJ Klinik & jasa medis orthodonti.",
      is_private: false,
      created_by: "user-005",
      created_at: now,
      updated_at: now
    },
    {
      id: "pay-003",
      employee_id: "emp-003",
      // Mareta Ismi
      period: "Oktober 2026",
      base_salary: 5e6,
      allowance: 1e6,
      bonus: 5e5,
      deduction: 0,
      total_salary: 65e5,
      payment_status: "DRAFT",
      payment_date: null,
      notes: "Gaji pokok, uang makan, dan insentif layanan prima.",
      is_private: false,
      created_by: "user-005",
      created_at: now,
      updated_at: now
    },
    {
      id: "pay-004",
      employee_id: "emp-005",
      // Weli Apriyani
      period: "Oktober 2026",
      base_salary: 52e5,
      allowance: 1e6,
      bonus: 4e5,
      deduction: 0,
      total_salary: 66e5,
      payment_status: "DRAFT",
      payment_date: null,
      notes: "Gaji pokok dan tunjangan keuangan.",
      is_private: false,
      created_by: "user-005",
      created_at: now,
      updated_at: now
    },
    {
      id: "pay-005",
      employee_id: "emp-006",
      // Ridwan Hadjriyanto
      period: "Oktober 2026",
      base_salary: 55e5,
      allowance: 12e5,
      bonus: 8e5,
      deduction: 0,
      total_salary: 75e5,
      payment_status: "DRAFT",
      payment_date: null,
      notes: "Gaji pokok dan bonus performa digital leads.",
      is_private: false,
      created_by: "user-005",
      created_at: now,
      updated_at: now
    },
    {
      id: "pay-006",
      employee_id: "emp-007",
      // Adelia Suci
      period: "Oktober 2026",
      base_salary: 48e5,
      allowance: 9e5,
      bonus: 6e5,
      deduction: 0,
      total_salary: 63e5,
      payment_status: "DRAFT",
      payment_date: null,
      notes: "Gaji perawat gigi dan insentif tindakan asistensi.",
      is_private: false,
      created_by: "user-005",
      created_at: now,
      updated_at: now
    }
  ];
  const announcements = [
    {
      id: "anc-001",
      title: "Pemberitahuan: Prosedur Standar Baru Sterilisasi Alat Orthodonti",
      content: "Kepada seluruh tim medis dan perawat gigi, mohon menerapkan protokol pencatatan logbook suhu autoclave dan desinfeksi permukaan kursi dental setiap pergantian pasien.",
      target_type: "ALL",
      target_id: null,
      publish_date: "2026-10-01",
      status: "PUBLISHED",
      author_id: "user-002",
      author_name: "drg. Ervina Dewiyanti, Sp.Ort., FICD",
      created_at: now,
      updated_at: now
    },
    {
      id: "anc-002",
      title: "Jadwal Rapat Kerja & Briefing Promo Bulan Ini",
      content: "Pertemuan koordinasi seluruh divisi akan diadakan hari Sabtu pukul 16:30 WIB di Ruang Diskusi GOC. Dimohon hadir tepat waktu.",
      target_type: "ALL",
      target_id: null,
      publish_date: "2026-10-02",
      status: "PUBLISHED",
      author_id: "user-001",
      author_name: "Hendri Kurniawan, ST., MMSI",
      created_at: now,
      updated_at: now
    }
  ];
  const audit_logs = [
    {
      id: "audit-001",
      user_id: "user-001",
      user_name: "Hendri Kurniawan, ST., MMSI",
      action: "SYSTEM_INITIALIZATION",
      module: "system",
      target_type: "database",
      target_id: "goc_database",
      description: "Inisialisasi sistem GOC Team Management dengan struktur organisasi awal.",
      ip_address: "127.0.0.1",
      user_agent: "GOC-Server-Init",
      created_at: now
    },
    {
      id: "audit-002",
      user_id: "user-001",
      user_name: "Hendri Kurniawan, ST., MMSI",
      action: "CREATE_EMPLOYEE",
      module: "team",
      target_type: "employee",
      target_id: "emp-002",
      description: "Menambahkan drg. Ervina Dewiyanti sebagai Penanggung Jawab Klinik.",
      ip_address: "127.0.0.1",
      user_agent: "GOC-Server-Init",
      created_at: now
    },
    {
      id: "audit-003",
      user_id: "user-001",
      user_name: "Hendri Kurniawan, ST., MMSI",
      action: "CHANGE_PERMISSION",
      module: "access",
      target_type: "user",
      target_id: "user-005",
      description: "Memberikan permission khusus payroll.view dan payroll.create kepada Weli Apriyani.",
      ip_address: "127.0.0.1",
      user_agent: "GOC-Server-Init",
      created_at: now
    }
  ];
  const notifications = [
    {
      id: "notif-001",
      user_id: "user-001",
      title: "Pengajuan Cuti Baru",
      message: "Siti Marfuah mengajukan cuti 3 hari (20 - 22 Oktober 2026). Menunggu persetujuan.",
      type: "LEAVE",
      priority: "HIGH",
      read: false,
      link: "/leave",
      metadata: { leaveId: "leave-001", status: "PENDING" },
      created_at: new Date(Date.now() - 15 * 60 * 1e3).toISOString()
    },
    {
      id: "notif-002",
      user_id: "user-001",
      title: "Pembaruan Payroll",
      message: "Dividen & kompensasi operasional periode Oktober 2026 telah diproses dan berstatus PAID.",
      type: "PAYROLL",
      priority: "NORMAL",
      read: false,
      link: "/payroll",
      metadata: { amount: 4e7, status: "PAID" },
      created_at: new Date(Date.now() - 45 * 60 * 1e3).toISOString()
    },
    {
      id: "notif-003",
      user_id: "user-001",
      title: "Peringatan Deadline Tugas",
      message: 'Tugas "Rekonsiliasi Pembayaran Asuransi" oleh Mareta Ismi mendekati batas waktu (08 Okt 2026).',
      type: "DEADLINE",
      priority: "URGENT",
      read: false,
      link: "/tasks",
      metadata: { taskId: "task-003", dueDate: "2026-10-08" },
      created_at: new Date(Date.now() - 90 * 60 * 1e3).toISOString()
    },
    {
      id: "notif-004",
      user_id: "user-006",
      title: "Peringatan Deadline Tugas",
      message: 'Tugas "Penyusunan Konten Edukasi Invisalign & Behel Transparan" jatuh tempo tanggal 12 Okt 2026.',
      type: "DEADLINE",
      priority: "HIGH",
      read: false,
      link: "/tasks",
      metadata: { taskId: "task-002", dueDate: "2026-10-12" },
      created_at: new Date(Date.now() - 30 * 60 * 1e3).toISOString()
    },
    {
      id: "notif-005",
      user_id: "user-006",
      title: "Tugas Baru Diterima",
      message: "Pak Hendri Kurniawan menugaskan Anda: Penyusunan Konten Edukasi Invisalign & Behel Transparan.",
      type: "TASK",
      priority: "NORMAL",
      read: false,
      link: "/tasks",
      metadata: { taskId: "task-002" },
      created_at: new Date(Date.now() - 120 * 60 * 1e3).toISOString()
    },
    {
      id: "notif-006",
      user_id: "user-006",
      title: "Pembaruan Payroll",
      message: "Slip gaji periode Oktober 2026 telah dibuat oleh bagian Finance. Total Net: Rp 7.500.000.",
      type: "PAYROLL",
      priority: "NORMAL",
      read: true,
      link: "/payroll",
      metadata: { amount: 75e5, status: "DRAFT" },
      created_at: new Date(Date.now() - 240 * 60 * 1e3).toISOString()
    },
    {
      id: "notif-007",
      user_id: "user-007",
      title: "Tugas Baru Diberikan",
      message: "drg. Ervina memberikan tugas: Audit & Kalibrasi Instrumen Orthodonti Ruang 1 & 2.",
      type: "TASK",
      priority: "HIGH",
      read: false,
      link: "/tasks",
      metadata: { taskId: "task-001" },
      created_at: new Date(Date.now() - 60 * 60 * 1e3).toISOString()
    },
    {
      id: "notif-008",
      user_id: "user-004",
      title: "Pengajuan Cuti Disetujui",
      message: "Pengajuan izin sakit Anda tanggal 25-26 September 2026 telah DISETUJUI oleh drg. Ervina Dewiyanti.",
      type: "LEAVE",
      priority: "NORMAL",
      read: false,
      link: "/leave",
      metadata: { leaveId: "leave-002", status: "APPROVED" },
      created_at: new Date(Date.now() - 180 * 60 * 1e3).toISOString()
    }
  ];
  const settings = {
    id: "settings-default",
    clinic_name: "Galaxy Orthodontic Center (GOC)",
    app_name: "GOC Team Management",
    logo_text: "GOC",
    primary_color: "#800020",
    timezone: "Asia/Jakarta",
    date_format: "DD/MM/YYYY",
    allow_notifications: true,
    session_timeout_minutes: 120,
    require_strong_password: true,
    updated_at: now
  };
  const allUserIds = ["user-001", "user-002", "user-003", "user-004", "user-005", "user-006", "user-007", "user-008"];
  const forum_channels = [
    {
      id: "channel-all-team",
      name: "Semua Tim GOC (All Team)",
      description: "Forum diskusi umum untuk koordinasi seluruh divisi dan pengumuman cepat operasional klinik.",
      type: "ALL_TEAM",
      department_id: null,
      department_name: "Seluruh Divisi",
      member_ids: allUserIds,
      created_by: "user-001",
      ai_enabled: true,
      ai_persona: "Konsultan Operasional & Klinis GOC",
      last_message_at: new Date(Date.now() - 5 * 60 * 1e3).toISOString(),
      last_message_preview: "GOC AI Assistant: Tips operasional menjaga kepuasan pasien orthodonti...",
      created_at: now,
      updated_at: now
    },
    {
      id: "channel-dept-adm",
      name: "Divisi Administrasi & Front Office",
      description: "Diskusi rekam medis, antrean pasien, konfirmasi jadwal orthodonti, dan pendaftaran.",
      type: "DEPARTMENT",
      department_id: "dept-adm",
      department_name: "Administrasi",
      member_ids: ["user-001", "user-002", "user-003", "user-004"],
      created_by: "user-002",
      ai_enabled: true,
      last_message_at: new Date(Date.now() - 25 * 60 * 1e3).toISOString(),
      last_message_preview: "Mareta: Rekam medis pasien behel sesi sore sudah diverifikasi.",
      created_at: now,
      updated_at: now
    },
    {
      id: "channel-dept-fin",
      name: "Divisi Finance & Accounting",
      description: "Diskusi privat keuangan, klaim reimbursement, dan verifikasi payroll klinik.",
      type: "DEPARTMENT",
      department_id: "dept-fin",
      department_name: "Finance",
      member_ids: ["user-001", "user-002", "user-005"],
      created_by: "user-001",
      ai_enabled: true,
      last_message_at: new Date(Date.now() - 50 * 60 * 1e3).toISOString(),
      last_message_preview: "Weli: Laporan rekonsiliasi kas operasional minggu ini siap ditinjau.",
      created_at: now,
      updated_at: now
    },
    {
      id: "channel-dept-mkt",
      name: "Divisi Digital Marketing & Leads",
      description: "Strategi konten edukasi behel, iklan Instagram Ads, dan follow-up calon pasien.",
      type: "DEPARTMENT",
      department_id: "dept-mkt",
      department_name: "Digital Marketing",
      member_ids: ["user-001", "user-006"],
      created_by: "user-001",
      ai_enabled: true,
      last_message_at: new Date(Date.now() - 90 * 60 * 1e3).toISOString(),
      last_message_preview: "M. Ridwan: Campaign promo behel transparan mengalami kenaikan CTR 28%.",
      created_at: now,
      updated_at: now
    },
    {
      id: "channel-dept-prw",
      name: "Divisi Perawat Gigi & Sterilisasi",
      description: "Checklist autoclave, kalibrasi instrumen orthodonti, dan asistensi dokter gigi.",
      type: "DEPARTMENT",
      department_id: "dept-prw",
      department_name: "Perawat Gigi",
      member_ids: ["user-001", "user-002", "user-007", "user-008"],
      created_by: "user-002",
      ai_enabled: true,
      last_message_at: new Date(Date.now() - 110 * 60 * 1e3).toISOString(),
      last_message_preview: "Adelia: Tray instrumen bracket bonding untuk Ruang 1 sudah steril 100%.",
      created_at: now,
      updated_at: now
    },
    {
      id: "channel-vip-ortho",
      name: "Kasus Khusus Orthodonti & VIP (Invited)",
      description: "Ruang privat terbatas untuk studi kasus ortodonti kompleks, analisis aligner, dan pasien VIP.",
      type: "PRIVATE_INVITED",
      department_id: null,
      department_name: "Privat Khusus",
      member_ids: ["user-001", "user-002", "user-007"],
      created_by: "user-002",
      ai_enabled: true,
      last_message_at: new Date(Date.now() - 15 * 60 * 1e3).toISOString(),
      last_message_preview: "drg. Ervina: Rencana ekstraksi premolar untuk pasien Ny. Sarah sudah difinalisasi.",
      created_at: now,
      updated_at: now
    }
  ];
  const forum_messages = [
    {
      id: "msg-001",
      channel_id: "channel-all-team",
      sender_id: "user-001",
      sender_name: "Hendri Kurniawan, ST., MMSI",
      sender_role: "Owner / Super Admin",
      sender_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      is_ai: false,
      content: "Selamat pagi seluruh tim GOC! Forum diskusi terpusat ini telah aktif. Silakan gunakan untuk koordinasi lintas divisi, diskusi kasus klinis, dan koordinasi operasional.",
      read_by: ["user-001", "user-002", "user-003"],
      created_at: new Date(Date.now() - 60 * 60 * 1e3).toISOString()
    },
    {
      id: "msg-002",
      channel_id: "channel-all-team",
      sender_id: "user-002",
      sender_name: "drg. Ervina Dewiyanti, Sp.Ort., FICD",
      sender_role: "Penanggung Jawab Klinik",
      sender_avatar: "https://images.unsplash.com/photo-1594824813576-96b63d91cf37?w=150&auto=format&fit=crop&q=80",
      is_ai: false,
      content: "Terima kasih Pak Hendri. Mohon perhatian rekan-rekan perawat dan adm, hari ini jadwal pasien pasang behel dan kontrol cukup padat. Pastikan kelengkapan tray siap 15 menit sebelum pasien tiba.",
      read_by: ["user-001", "user-002", "user-003"],
      created_at: new Date(Date.now() - 40 * 60 * 1e3).toISOString()
    },
    {
      id: "msg-003",
      channel_id: "channel-all-team",
      sender_id: "user-007",
      sender_name: "Adelia Suci",
      sender_role: "Perawat Gigi",
      sender_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      is_ai: false,
      content: "Baik Dokter Ervina! Tray instrumen bracket kit, buccal tube, dan etsa-bonding sudah kami siapkan di dental unit 1 dan 2.",
      read_by: ["user-001", "user-002"],
      created_at: new Date(Date.now() - 20 * 60 * 1e3).toISOString()
    },
    {
      id: "msg-004",
      channel_id: "channel-all-team",
      sender_id: "goc-ai-agent",
      sender_name: "GOC AI Assistant",
      sender_role: "Konsultan AI Klinis & Solusi",
      sender_avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
      is_ai: true,
      content: "\u{1F4A1} **Tips Operasional GOC**: Untuk menjaga kepuasan pasien orthodonti pada sesi padat:\n1. Berikan wax ortodontik gratis & instruksi tertulis jika ada bracket yang menggesek pipi.\n2. Siapkan ice pack jika pasien mengalami rasa pegal setelah aktivasi archwire.\n3. Jangan ragu bertanya atau menyebut @AI jika memerlukan solusi kendala klinis/operasional!",
      read_by: ["user-001"],
      created_at: new Date(Date.now() - 5 * 60 * 1e3).toISOString()
    },
    {
      id: "msg-vip-001",
      channel_id: "channel-vip-ortho",
      sender_id: "user-002",
      sender_name: "drg. Ervina Dewiyanti, Sp.Ort., FICD",
      sender_role: "Penanggung Jawab Klinik",
      sender_avatar: "https://images.unsplash.com/photo-1594824813576-96b63d91cf37?w=150&auto=format&fit=crop&q=80",
      is_ai: false,
      content: "Pak Hendri & Adelia, untuk kasus crowding berat pasien Ny. Sarah, kita akan gunakan self-ligating bracket Damon dengan ekspansi lengkung bertahap. Mohon siapkan archwire CuNiTi 0.014.",
      read_by: ["user-001", "user-002"],
      created_at: new Date(Date.now() - 15 * 60 * 1e3).toISOString()
    }
  ];
  const video_meetings = [
    {
      id: "meet-001",
      title: "Koordinasi Operasional & Pasien VIP Mingguan",
      description: "Evaluasi jadwal pasien orthodonti, ketersediaan inventaris aligner, dan koordinasi dokter & staf.",
      host_id: "user-002",
      host_name: "drg. Ervina Dewiyanti, Sp.Ort., FICD",
      channel_id: "channel-all-team",
      status: "LIVE",
      scheduled_start: now,
      started_at: new Date(Date.now() - 15 * 60 * 1e3).toISOString(),
      participant_ids: ["user-001", "user-002", "user-007"],
      invited_ids: allUserIds,
      room_code: "GOC-VIP-2026",
      created_at: now
    },
    {
      id: "meet-002",
      title: "Briefing Pagi: SOP Pelayanan Prima & Sterilisasi",
      description: "Review protokol kebersihan dental unit dan keramahan front office dalam menyambut pasien baru.",
      host_id: "user-001",
      host_name: "Hendri Kurniawan, ST., MMSI",
      channel_id: "channel-all-team",
      status: "SCHEDULED",
      scheduled_start: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString(),
      participant_ids: [],
      invited_ids: allUserIds,
      room_code: "GOC-SOP-BRF",
      created_at: now
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
    video_meetings
  };
}
var Database = class {
  constructor() {
    this.saveTimeout = null;
    this.data = this.loadData();
  }
  loadData() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.employees) {
          if (!parsed.forum_channels) {
            const seed2 = generateSeedData();
            parsed.forum_channels = seed2.forum_channels;
            parsed.forum_messages = seed2.forum_messages;
            parsed.video_meetings = seed2.video_meetings;
            this.saveDataSync(parsed);
          }
          return parsed;
        }
      }
    } catch (err) {
      console.error("Error loading database file, generating seed data:", err);
    }
    const seed = generateSeedData();
    this.saveDataSync(seed);
    return seed;
  }
  saveDataSync(dataToSave) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(dataToSave, null, 2), "utf-8");
      fs.renameSync(tmpFile, DATA_FILE);
    } catch (err) {
      console.error("Error persisting database:", err);
    }
  }
  persist() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveDataSync(this.data);
    }, 200);
  }
  getData() {
    return this.data;
  }
  getDbStats() {
    let sizeBytes = 0;
    try {
      if (fs.existsSync(DATA_FILE)) {
        const stat = fs.statSync(DATA_FILE);
        sizeBytes = stat.size;
      }
    } catch {
    }
    return {
      storage_type: "Hostinger Node.js Central File Database (JSON Relational Engine)",
      database_file: DATA_FILE,
      size_bytes: sizeBytes,
      size_formatted: `${(sizeBytes / 1024).toFixed(1)} KB`,
      total_users: this.data.users?.length || 0,
      total_employees: this.data.employees?.length || 0,
      total_tasks: this.data.tasks?.length || 0,
      total_schedules: this.data.schedules?.length || 0,
      total_leave_requests: this.data.leave_requests?.length || 0,
      total_payroll_records: this.data.payroll?.length || 0,
      total_forum_messages: this.data.forum_messages?.length || 0,
      total_video_meetings: this.data.video_meetings?.length || 0,
      total_audit_logs: this.data.audit_logs?.length || 0,
      total_notifications: this.data.notifications?.length || 0,
      last_sync: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  replaceData(newData) {
    if (!newData || !Array.isArray(newData.users) || !Array.isArray(newData.employees)) {
      throw new Error("Format database JSON tidak valid. Memerlukan tabel users dan employees.");
    }
    this.data = newData;
    this.saveDataSync(this.data);
    return true;
  }
  resetToSeed() {
    const fresh = generateSeedData();
    this.data = fresh;
    this.saveDataSync(this.data);
    return this.data;
  }
  // Audit Log helper
  logAudit(entry) {
    const log = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: entry.userId,
      user_name: entry.userName,
      action: entry.action,
      module: entry.module,
      target_type: entry.targetType,
      target_id: entry.targetId || null,
      description: entry.description,
      ip_address: entry.ip || "127.0.0.1",
      user_agent: entry.userAgent || "Web Browser",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.audit_logs.unshift(log);
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 500);
    }
    this.persist();
  }
  // Notification helper
  sendNotification(entry) {
    const notif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: entry.userId,
      title: entry.title,
      message: entry.message,
      type: entry.type,
      priority: entry.priority || "NORMAL",
      metadata: entry.metadata || {},
      read: false,
      link: entry.link || null,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.notifications.unshift(notif);
    this.persist();
  }
};
var db = new Database();

// src/server/auth.ts
import crypto2 from "node:crypto";
var sessions = /* @__PURE__ */ new Map();
function createSession(user) {
  const token = crypto2.randomBytes(32).toString("hex");
  const sessionSettings = db.getData().settings;
  const timeoutMs = (sessionSettings.session_timeout_minutes || 120) * 60 * 1e3;
  const session = {
    token,
    userId: user.id,
    employeeId: user.employee_id,
    roleId: user.role_id,
    expiresAt: Date.now() + timeoutMs
  };
  sessions.set(token, session);
  return session;
}
function removeSession(token) {
  sessions.delete(token);
}
function getSession(token) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}
function calculateUserPermissions(userId) {
  const data = db.getData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) return [];
  if (user.role_id === "owner") {
    return ALL_PERMISSIONS.map((p) => p.id);
  }
  const rolePerms = data.role_permissions.filter((rp) => rp.role_id === user.role_id).map((rp) => rp.permission_id);
  const permSet = new Set(rolePerms);
  const userOverrides = data.user_permissions.filter((up) => up.user_id === userId);
  userOverrides.forEach((uo) => {
    if (uo.allowed) {
      permSet.add(uo.permission_id);
    } else {
      permSet.delete(uo.permission_id);
    }
  });
  return Array.from(permSet);
}
function buildAuthSession(user, token) {
  const data = db.getData();
  const employee = data.employees.find((e) => e.id === user.employee_id);
  const department = employee ? data.departments.find((d) => d.id === employee.department_id) : void 0;
  const position = employee ? data.positions.find((p) => p.id === employee.position_id) : void 0;
  const role = data.roles.find((r) => r.id === user.role_id);
  const permissions = calculateUserPermissions(user.id);
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: role ? role.name : user.role_id,
      employee_id: user.employee_id,
      full_name: employee ? employee.full_name : user.username,
      position_name: position ? position.name : "-",
      department_name: department ? department.name : "-",
      department_id: department ? department.id : "",
      photo: employee ? employee.photo : "",
      must_change_password: false
    },
    permissions
  };
}
function authMiddleware(req, res, next) {
  const data = db.getData();
  const authHeader = req.headers.authorization;
  let user;
  let token;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split("Bearer ")[1].trim();
    const session = getSession(token);
    if (session) {
      user = data.users.find((u) => u.id === session.userId);
    }
  }
  if (!user || user.status !== "ACTIVE") {
    user = data.users.find((u) => u.role_id === "owner" && u.status === "ACTIVE") || data.users.find((u) => u.status === "ACTIVE") || data.users[0];
    if (user) {
      const autoSession = createSession(user);
      token = autoSession.token;
    }
  }
  if (user) {
    const employee = data.employees.find((e) => e.id === user.employee_id);
    req.user = user;
    req.employee = employee;
    req.permissions = calculateUserPermissions(user.id);
    req.sessionToken = token;
  }
  next();
}
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "Autentikasi diperlukan. Silakan login terlebih dahulu.",
      code: "UNAUTHENTICATED"
    });
  }
  next();
}
function requirePermission(permissionId) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Autentikasi diperlukan. Silakan login terlebih dahulu.",
        code: "UNAUTHENTICATED"
      });
    }
    if (req.user.role_id === "owner") {
      return next();
    }
    const perms = req.permissions || [];
    if (!perms.includes(permissionId)) {
      return res.status(403).json({
        error: "Anda tidak mempunyai akses ke halaman atau aksi ini.",
        code: "FORBIDDEN",
        requiredPermission: permissionId
      });
    }
    next();
  };
}
function requireOwner(req, res, next) {
  if (!req.user || req.user.role_id !== "owner") {
    return res.status(403).json({
      error: "Akses khusus Owner / Super Admin.",
      code: "FORBIDDEN_OWNER_ONLY"
    });
  }
  next();
}

// src/server/api.ts
var api = Router();
api.post("/auth/login", (req, res) => {
  const { username, password, rememberMe } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username/Email dan Password wajib diisi." });
  }
  const data = db.getData();
  const cleanUsername = String(username).trim().toLowerCase();
  const user = data.users.find(
    (u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanUsername
  );
  if (!user) {
    return res.status(401).json({ error: "Username atau password salah." });
  }
  if (user.status !== "ACTIVE") {
    return res.status(403).json({
      error: `Akun Anda berstatus ${user.status}. Anda tidak dapat login. Silakan hubungi Owner/Super Admin.`
    });
  }
  const isValid = verifyPassword(password, user.password_hash, user.salt);
  if (!isValid) {
    return res.status(401).json({ error: "Username atau password salah." });
  }
  user.last_login = (/* @__PURE__ */ new Date()).toISOString();
  db.persist();
  const session = createSession(user);
  const authSession = buildAuthSession(user, session.token);
  db.logAudit({
    userId: user.id,
    userName: authSession.user.full_name,
    action: "USER_LOGIN",
    module: "auth",
    targetType: "user",
    targetId: user.id,
    description: `User ${user.username} (${authSession.user.full_name}) berhasil login.`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.json({
    message: "Login berhasil.",
    session: authSession
  });
});
api.post("/auth/register", (req, res) => {
  const { full_name, email, username, password, phone, department_id, position_id } = req.body;
  if (!full_name || !email || !username || !password) {
    return res.status(400).json({ error: "Nama Lengkap, Email, Username, dan Password wajib diisi." });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanUsername = String(username).trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: "Username minimal 3 karakter (huruf, angka, titik, strip)." });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password minimal 6 karakter." });
  }
  const data = db.getData();
  if (data.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return res.status(400).json({ error: `Username "${cleanUsername}" sudah digunakan. Silakan pilih username lain.` });
  }
  if (data.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: `Email "${cleanEmail}" sudah terdaftar. Silakan login atau gunakan email lain.` });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const empId = `emp-${Date.now().toString(36)}`;
  const userId = `user-${Date.now().toString(36)}`;
  const empNumber = `GOC-${String(data.employees.length + 1).padStart(3, "0")}`;
  const passHash = hashPassword(password);
  const newUser = {
    id: userId,
    username: cleanUsername,
    email: cleanEmail,
    password_hash: passHash.hash,
    salt: passHash.salt,
    role_id: "karyawan",
    employee_id: empId,
    status: "ACTIVE",
    must_change_password: false,
    last_login: now,
    created_at: now,
    updated_at: now
  };
  const newEmployee = {
    id: empId,
    user_id: userId,
    employee_number: empNumber,
    full_name: String(full_name).trim(),
    email: cleanEmail,
    phone: phone ? String(phone).trim() : "",
    department_id: department_id || (data.departments[0]?.id || "dept-adm"),
    position_id: position_id || (data.positions[0]?.id || "pos-fo"),
    manager_id: "emp-002",
    // Default reporting to PJ Klinik drg. Ervina
    join_date: now.split("T")[0],
    exit_date: null,
    status: "ACTIVE",
    photo: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    notes: "Pendaftaran mandiri akun tim GOC.",
    created_at: now,
    updated_at: now,
    deleted_at: null
  };
  data.users.push(newUser);
  data.employees.push(newEmployee);
  const allTeamChan = data.forum_channels.find((c) => c.id === "channel-all-team");
  if (allTeamChan && !allTeamChan.member_ids.includes(userId)) {
    allTeamChan.member_ids.push(userId);
  }
  db.persist();
  const session = createSession(newUser);
  const authSession = buildAuthSession(newUser, session.token);
  db.logAudit({
    userId: newUser.id,
    userName: newEmployee.full_name,
    action: "USER_REGISTER",
    module: "auth",
    targetType: "user",
    targetId: newUser.id,
    description: `Pendaftaran akun baru: ${newUser.username} (${newEmployee.full_name}).`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  db.sendNotification({
    userId: "user-001",
    title: "Pendaftaran Akun Baru",
    message: `${newEmployee.full_name} (${cleanUsername}) baru saja mendaftar akun di GOC Team Management.`,
    type: "SYSTEM",
    priority: "NORMAL",
    link: "/team"
  });
  return res.status(201).json({
    message: "Pendaftaran akun berhasil!",
    session: authSession
  });
});
api.post("/auth/google", (req, res) => {
  const { email, name, picture, googleId } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Data email Google wajib disertakan." });
  }
  const data = db.getData();
  const cleanEmail = String(email).trim().toLowerCase();
  let user = data.users.find((u) => u.email.toLowerCase() === cleanEmail);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (user) {
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        error: `Akun Google Anda (${cleanEmail}) berstatus ${user.status}. Silakan hubungi Administrator.`
      });
    }
    user.last_login = now;
    const emp = data.employees.find((e) => e.id === user?.employee_id);
    if (emp && picture && (!emp.photo || emp.photo.includes("unsplash"))) {
      emp.photo = picture;
    }
    db.persist();
    const session = createSession(user);
    const authSession = buildAuthSession(user, session.token);
    db.logAudit({
      userId: user.id,
      userName: authSession.user.full_name,
      action: "GOOGLE_LOGIN",
      module: "auth",
      targetType: "user",
      targetId: user.id,
      description: `User login menggunakan Google SSO (${cleanEmail}).`,
      ip: req.headers["x-forwarded-for"] || req.ip,
      userAgent: req.headers["user-agent"]
    });
    return res.json({
      message: "Login Google berhasil.",
      session: authSession
    });
  } else {
    const empId = `emp-${Date.now().toString(36)}`;
    const userId = `user-${Date.now().toString(36)}`;
    const empNumber = `GOC-${String(data.employees.length + 1).padStart(3, "0")}`;
    let baseUsername = cleanEmail.split("@")[0].replace(/[^a-z0-9._-]/g, "");
    if (baseUsername.length < 3) baseUsername = `user_${baseUsername}`;
    let finalUsername = baseUsername;
    let counter = 1;
    while (data.users.some((u) => u.username.toLowerCase() === finalUsername.toLowerCase())) {
      finalUsername = `${baseUsername}${counter++}`;
    }
    const passHash = hashPassword(crypto3.randomBytes(16).toString("hex"));
    const newUser = {
      id: userId,
      username: finalUsername,
      email: cleanEmail,
      password_hash: passHash.hash,
      salt: passHash.salt,
      role_id: "karyawan",
      employee_id: empId,
      status: "ACTIVE",
      must_change_password: false,
      last_login: now,
      created_at: now,
      updated_at: now
    };
    const newEmployee = {
      id: empId,
      user_id: userId,
      employee_number: empNumber,
      full_name: name || baseUsername,
      email: cleanEmail,
      phone: "",
      department_id: data.departments[0]?.id || "dept-adm",
      position_id: data.positions[0]?.id || "pos-fo",
      manager_id: "emp-002",
      join_date: now.split("T")[0],
      exit_date: null,
      status: "ACTIVE",
      photo: picture || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      notes: "Pendaftaran otomatis via Google Sign-In.",
      created_at: now,
      updated_at: now,
      deleted_at: null
    };
    data.users.push(newUser);
    data.employees.push(newEmployee);
    const allTeamChan = data.forum_channels.find((c) => c.id === "channel-all-team");
    if (allTeamChan && !allTeamChan.member_ids.includes(userId)) {
      allTeamChan.member_ids.push(userId);
    }
    db.persist();
    const session = createSession(newUser);
    const authSession = buildAuthSession(newUser, session.token);
    db.logAudit({
      userId: newUser.id,
      userName: newEmployee.full_name,
      action: "GOOGLE_REGISTER",
      module: "auth",
      targetType: "user",
      targetId: newUser.id,
      description: `Akun baru terdaftar otomatis melalui Google SSO (${cleanEmail}).`,
      ip: req.headers["x-forwarded-for"] || req.ip,
      userAgent: req.headers["user-agent"]
    });
    db.sendNotification({
      userId: "user-001",
      title: "Pendaftaran Akun Baru (Google)",
      message: `${newEmployee.full_name} (${cleanEmail}) baru saja mendaftar via Google Sign-In.`,
      type: "SYSTEM",
      priority: "NORMAL",
      link: "/team"
    });
    return res.status(201).json({
      message: "Pendaftaran dan login via Google berhasil!",
      session: authSession
    });
  }
});
api.post("/auth/logout", requireAuth, (req, res) => {
  if (req.sessionToken) {
    removeSession(req.sessionToken);
  }
  if (req.user && req.employee) {
    db.logAudit({
      userId: req.user.id,
      userName: req.employee.full_name,
      action: "USER_LOGOUT",
      module: "auth",
      targetType: "user",
      targetId: req.user.id,
      description: `User ${req.user.username} telah logout.`,
      ip: req.headers["x-forwarded-for"] || req.ip,
      userAgent: req.headers["user-agent"]
    });
  }
  return res.json({ message: "Logout berhasil." });
});
api.get("/auth/me", (req, res) => {
  const data = db.getData();
  let user = req.user;
  let token = req.sessionToken;
  if (!user) {
    user = data.users.find((u) => u.role_id === "owner" && u.status === "ACTIVE") || data.users.find((u) => u.status === "ACTIVE") || data.users[0];
    if (user) {
      const s = createSession(user);
      token = s.token;
    }
  }
  if (!user) {
    return res.status(500).json({ error: "Tidak ada data pengguna di database." });
  }
  if (user.must_change_password) {
    user.must_change_password = false;
    db.persist();
  }
  const authSession = buildAuthSession(user, token || "direct-access-token");
  return res.json({ session: authSession });
});
api.post("/auth/switch-account", (req, res) => {
  const { userId } = req.body;
  const data = db.getData();
  const targetUser = data.users.find(
    (u) => u.id === userId || u.username.toLowerCase() === String(userId).toLowerCase()
  );
  if (!targetUser) {
    return res.status(404).json({ error: "Akun tim tidak ditemukan." });
  }
  const s = createSession(targetUser);
  const authSession = buildAuthSession(targetUser, s.token);
  db.logAudit({
    userId: targetUser.id,
    userName: authSession.user.full_name,
    action: "SWITCH_ACCOUNT",
    module: "auth",
    targetType: "user",
    targetId: targetUser.id,
    description: `Beralih ke akun ${authSession.user.full_name} (${targetUser.username}).`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.json({
    message: `Beralih ke profil ${authSession.user.full_name}`,
    session: authSession
  });
});
api.post("/auth/change-password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Password saat ini dan password baru wajib diisi." });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: "Password baru minimal 6 karakter." });
  }
  const user = req.user;
  const isValid = verifyPassword(currentPassword, user.password_hash, user.salt);
  if (!isValid) {
    return res.status(400).json({ error: "Password saat ini salah." });
  }
  const { hash, salt } = hashPassword(newPassword);
  user.password_hash = hash;
  user.salt = salt;
  user.must_change_password = false;
  user.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  db.persist();
  db.logAudit({
    userId: user.id,
    userName: req.employee?.full_name || user.username,
    action: "CHANGE_PASSWORD",
    module: "auth",
    targetType: "user",
    targetId: user.id,
    description: `User ${user.username} mengubah password.`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.json({ message: "Password berhasil diperbarui." });
});
api.post("/auth/forgot-password", (req, res) => {
  const { emailOrUsername } = req.body;
  if (!emailOrUsername) {
    return res.status(400).json({ error: "Email atau username wajib diisi." });
  }
  const clean = String(emailOrUsername).trim().toLowerCase();
  const data = db.getData();
  const user = data.users.find((u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean);
  if (user) {
    const ownerUser = data.users.find((u) => u.role_id === "owner");
    if (ownerUser) {
      db.sendNotification({
        userId: ownerUser.id,
        title: "Permintaan Reset Password",
        message: `Karyawan (${user.username}) meminta bantuan reset password.`,
        type: "SYSTEM",
        link: "/team"
      });
    }
  }
  return res.json({
    message: "Jika akun terdaftar, permintaan reset password telah diteruskan kepada Administrator/Owner GOC."
  });
});
api.get("/dashboard/stats", requireAuth, (req, res) => {
  const data = db.getData();
  const userId = req.user.id;
  const empId = req.user.employee_id;
  const isOwnerOrPJ = req.user.role_id === "owner" || req.user.role_id === "pj_klinik";
  const totalEmployees = data.employees.filter((e) => !e.deleted_at).length;
  const activeEmployees = data.employees.filter((e) => !e.deleted_at && e.status === "ACTIVE").length;
  const inactiveEmployees = data.employees.filter((e) => !e.deleted_at && e.status !== "ACTIVE").length;
  const pendingLeave = data.leave_requests.filter((l) => l.status === "PENDING" && l.type === "CUTI").length;
  const pendingPermission = data.leave_requests.filter((l) => l.status === "PENDING" && l.type !== "CUTI").length;
  const activeTasks = data.tasks.filter((t) => t.status === "TODO" || t.status === "IN_PROGRESS" || t.status === "REVIEW").length;
  const completedTasks = data.tasks.filter((t) => t.status === "DONE").length;
  const activeAnnouncements = data.announcements.filter((a) => a.status === "PUBLISHED").length;
  const myTasks = data.tasks.filter((t) => t.assigned_to === empId);
  const myActiveTasks = myTasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED").length;
  const myLeaveRequests = data.leave_requests.filter((l) => l.employee_id === empId);
  const recentActivities = isOwnerOrPJ ? data.audit_logs.slice(0, 10) : data.audit_logs.filter((a) => a.user_id === userId).slice(0, 5);
  return res.json({
    stats: {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      pendingLeave,
      pendingPermission,
      activeTasks,
      completedTasks,
      activeAnnouncements
    },
    personal: {
      myTotalTasks: myTasks.length,
      myActiveTasks,
      myLeaveTotal: myLeaveRequests.length
    },
    recentActivities
  });
});
api.get("/employees", requirePermission("team.view"), (req, res) => {
  const { search, department, position, status, includeDeleted } = req.query;
  const data = db.getData();
  let list = data.employees;
  if (includeDeleted !== "true") {
    list = list.filter((e) => !e.deleted_at);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (e) => e.full_name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.phone.includes(q) || e.employee_number.toLowerCase().includes(q)
    );
  }
  if (department && department !== "ALL") {
    list = list.filter((e) => e.department_id === department);
  }
  if (position && position !== "ALL") {
    list = list.filter((e) => e.position_id === position);
  }
  if (status && status !== "ALL") {
    list = list.filter((e) => e.status === status);
  }
  const enriched = list.map((emp) => {
    const dept = data.departments.find((d) => d.id === emp.department_id);
    const pos = data.positions.find((p) => p.id === emp.position_id);
    const mgr = emp.manager_id ? data.employees.find((m) => m.id === emp.manager_id) : null;
    const usr = data.users.find((u) => u.id === emp.user_id);
    const role = usr ? data.roles.find((r) => r.id === usr.role_id) : void 0;
    return {
      ...emp,
      department: dept,
      position: pos,
      manager: mgr ? { id: mgr.id, full_name: mgr.full_name, position_name: data.positions.find((p) => p.id === mgr.position_id)?.name } : null,
      user: usr ? {
        id: usr.id,
        username: usr.username,
        role_id: usr.role_id,
        role_name: role ? role.name : usr.role_id,
        status: usr.status
      } : void 0
    };
  });
  return res.json(enriched);
});
api.get("/employees/:id", requirePermission("team.view"), (req, res) => {
  const data = db.getData();
  const emp = data.employees.find((e) => e.id === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: "Karyawan tidak ditemukan." });
  }
  const dept = data.departments.find((d) => d.id === emp.department_id);
  const pos = data.positions.find((p) => p.id === emp.position_id);
  const mgr = emp.manager_id ? data.employees.find((m) => m.id === emp.manager_id) : null;
  const usr = data.users.find((u) => u.id === emp.user_id);
  const role = usr ? data.roles.find((r) => r.id === usr.role_id) : void 0;
  return res.json({
    ...emp,
    department: dept,
    position: pos,
    manager: mgr ? { id: mgr.id, full_name: mgr.full_name, position_name: data.positions.find((p) => p.id === mgr.position_id)?.name } : null,
    user: usr ? {
      id: usr.id,
      username: usr.username,
      role_id: usr.role_id,
      role_name: role ? role.name : usr.role_id,
      status: usr.status
    } : void 0
  });
});
api.post("/employees", requirePermission("team.create"), (req, res) => {
  const {
    full_name,
    username,
    email,
    password,
    phone,
    department_id,
    position_id,
    manager_id,
    role_id,
    join_date,
    status,
    photo,
    notes
  } = req.body;
  if (!full_name || !username || !email || !password || !department_id || !position_id) {
    return res.status(400).json({ error: "Nama lengkap, username, email, password, divisi, dan jabatan wajib diisi." });
  }
  const data = db.getData();
  const cleanUsername = String(username).trim().toLowerCase();
  const cleanEmail = String(email).trim().toLowerCase();
  if (data.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return res.status(400).json({ error: "Username sudah digunakan. Pilih username lain." });
  }
  if (data.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: "Email sudah terdaftar pada sistem." });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const empId = `emp-${Date.now().toString(36)}`;
  const userId = `user-${Date.now().toString(36)}`;
  const empNumber = `GOC-${String(data.employees.length + 1).padStart(3, "0")}`;
  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: userId,
    username: cleanUsername,
    email: cleanEmail,
    password_hash: hash,
    salt,
    role_id: role_id || "karyawan",
    employee_id: empId,
    status: status || "ACTIVE",
    must_change_password: false,
    last_login: null,
    created_at: now,
    updated_at: now
  };
  const newEmp = {
    id: empId,
    user_id: userId,
    employee_number: empNumber,
    full_name: String(full_name).trim(),
    email: cleanEmail,
    phone: phone ? String(phone).trim() : "",
    department_id,
    position_id,
    manager_id: manager_id || null,
    join_date: join_date || now.split("T")[0],
    exit_date: null,
    status: status || "ACTIVE",
    photo: photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    notes: notes || "",
    created_at: now,
    updated_at: now,
    deleted_at: null
  };
  data.users.push(newUser);
  data.employees.push(newEmp);
  db.persist();
  db.logAudit({
    userId: req.user.id,
    userName: req.employee?.full_name || req.user.username,
    action: "CREATE_EMPLOYEE",
    module: "team",
    targetType: "employee",
    targetId: empId,
    description: `Menambahkan karyawan baru: ${newEmp.full_name} (${newEmp.employee_number}) divisi ${department_id}.`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.status(201).json({
    message: "Data karyawan berhasil ditambahkan.",
    employee: newEmp
  });
});
api.put("/employees/:id", requirePermission("team.edit"), (req, res) => {
  const data = db.getData();
  const emp = data.employees.find((e) => e.id === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: "Karyawan tidak ditemukan." });
  }
  const user = data.users.find((u) => u.id === emp.user_id);
  const {
    full_name,
    email,
    phone,
    department_id,
    position_id,
    manager_id,
    join_date,
    status,
    photo,
    notes,
    new_password
  } = req.body;
  if (user && user.role_id === "owner" && status && status !== "ACTIVE") {
    return res.status(400).json({ error: "Akun Owner/Super Admin tidak boleh dinonaktifkan." });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (full_name) emp.full_name = String(full_name).trim();
  if (phone !== void 0) emp.phone = String(phone).trim();
  if (department_id) emp.department_id = department_id;
  if (position_id) emp.position_id = position_id;
  if (manager_id !== void 0) emp.manager_id = manager_id;
  if (join_date) emp.join_date = join_date;
  if (photo !== void 0) emp.photo = photo;
  if (notes !== void 0) emp.notes = notes;
  if (email && email !== emp.email) {
    const cleanEmail = String(email).trim().toLowerCase();
    if (data.users.some((u) => u.id !== user?.id && u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: "Email sudah digunakan oleh user lain." });
    }
    emp.email = cleanEmail;
    if (user) user.email = cleanEmail;
  }
  if (status && status !== emp.status) {
    emp.status = status;
    if (user) user.status = status;
    if (status === "RESIGNED") {
      emp.exit_date = now.split("T")[0];
    }
  }
  if (new_password && String(new_password).length >= 6 && user) {
    const { hash, salt } = hashPassword(new_password);
    user.password_hash = hash;
    user.salt = salt;
    user.must_change_password = false;
  }
  emp.updated_at = now;
  if (user) user.updated_at = now;
  db.persist();
  db.logAudit({
    userId: req.user.id,
    userName: req.employee?.full_name || req.user.username,
    action: "UPDATE_EMPLOYEE",
    module: "team",
    targetType: "employee",
    targetId: emp.id,
    description: `Memperbarui data karyawan ${emp.full_name}.`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.json({
    message: "Data karyawan berhasil diperbarui.",
    employee: emp
  });
});
api.patch("/employees/:id/status", requirePermission("team.activate"), (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: "Status wajib ditentukan." });
  }
  const data = db.getData();
  const emp = data.employees.find((e) => e.id === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: "Karyawan tidak ditemukan." });
  }
  const user = data.users.find((u) => u.id === emp.user_id);
  if (user && user.role_id === "owner") {
    return res.status(400).json({ error: "Status Owner/Super Admin tidak dapat diubah." });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  emp.status = status;
  if (status === "RESIGNED") {
    emp.exit_date = now.split("T")[0];
  }
  if (user) {
    user.status = status;
    user.updated_at = now;
  }
  emp.updated_at = now;
  db.persist();
  db.logAudit({
    userId: req.user.id,
    userName: req.employee?.full_name || req.user.username,
    action: status === "ACTIVE" ? "ACTIVATE_EMPLOYEE" : "DEACTIVATE_EMPLOYEE",
    module: "team",
    targetType: "employee",
    targetId: emp.id,
    description: `Mengubah status karyawan ${emp.full_name} menjadi ${status}.`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.json({
    message: `Status karyawan berhasil diubah menjadi ${status}.`,
    employee: emp
  });
});
api.delete("/employees/:id", requirePermission("team.delete"), (req, res) => {
  const { permanent, ownerPassword, confirmName } = req.body;
  const data = db.getData();
  const emp = data.employees.find((e) => e.id === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: "Karyawan tidak ditemukan." });
  }
  const user = data.users.find((u) => u.id === emp.user_id);
  if (user && user.role_id === "owner") {
    return res.status(403).json({ error: "Akun Owner/Super Admin tidak dapat dihapus!" });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (permanent === true || permanent === "true") {
    if (req.user.role_id !== "owner") {
      return res.status(403).json({ error: "Penghapusan permanen hanya diizinkan oleh Owner." });
    }
    if (!ownerPassword || !confirmName) {
      return res.status(400).json({
        error: "Untuk menghapus permanen, Anda wajib memasukkan password Owner dan nama lengkap karyawan."
      });
    }
    const isOwnerPassValid = verifyPassword(ownerPassword, req.user.password_hash, req.user.salt);
    if (!isOwnerPassValid) {
      return res.status(400).json({ error: "Password Owner salah. Penghapusan dibatalkan." });
    }
    if (confirmName.trim().toLowerCase() !== emp.full_name.trim().toLowerCase()) {
      return res.status(400).json({ error: "Nama konfirmasi tidak cocok dengan nama karyawan." });
    }
    data.employees = data.employees.filter((e) => e.id !== emp.id);
    if (user) {
      data.users = data.users.filter((u) => u.id !== user.id);
      data.user_permissions = data.user_permissions.filter((up) => up.user_id !== user.id);
    }
    db.persist();
    db.logAudit({
      userId: req.user.id,
      userName: req.employee?.full_name || req.user.username,
      action: "PERMANENT_DELETE_EMPLOYEE",
      module: "team",
      targetType: "employee",
      targetId: emp.id,
      description: `Menghapus PERMANEN karyawan: ${emp.full_name} (${emp.employee_number}).`,
      ip: req.headers["x-forwarded-for"] || req.ip,
      userAgent: req.headers["user-agent"]
    });
    return res.json({ message: `Data karyawan ${emp.full_name} telah dihapus permanen.` });
  }
  emp.deleted_at = now;
  emp.status = "INACTIVE";
  if (user) {
    user.status = "INACTIVE";
    user.updated_at = now;
  }
  db.persist();
  db.logAudit({
    userId: req.user.id,
    userName: req.employee?.full_name || req.user.username,
    action: "SOFT_DELETE_EMPLOYEE",
    module: "team",
    targetType: "employee",
    targetId: emp.id,
    description: `Menonaktifkan / Soft Delete karyawan ${emp.full_name}. Data historis tetap tersimpan.`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.json({
    message: `Karyawan ${emp.full_name} berhasil dinonaktifkan (soft delete).`
  });
});
api.get("/organization", requirePermission("organization.view"), (req, res) => {
  const data = db.getData();
  const activeEmps = data.employees.filter((e) => !e.deleted_at && e.status === "ACTIVE");
  const owner = activeEmps.find((e) => {
    const usr = data.users.find((u) => u.id === e.user_id);
    return usr?.role_id === "owner" || e.manager_id === null;
  });
  if (!owner) {
    return res.json([]);
  }
  function buildNode(emp) {
    const pos = data.positions.find((p) => p.id === emp.position_id);
    const dept = data.departments.find((d) => d.id === emp.department_id);
    const usr = data.users.find((u) => u.id === emp.user_id);
    const directReports = activeEmps.filter((e) => e.manager_id === emp.id);
    return {
      id: emp.id,
      full_name: emp.full_name,
      position_name: pos ? pos.name : "-",
      department_name: dept ? dept.name : "-",
      photo: emp.photo,
      phone: emp.phone,
      email: emp.email,
      role_id: usr ? usr.role_id : "karyawan",
      children: directReports.map((report) => buildNode(report))
    };
  }
  const tree = [buildNode(owner)];
  return res.json(tree);
});
api.get("/departments", requireAuth, (req, res) => {
  const data = db.getData();
  return res.json(data.departments);
});
api.post("/departments", requireOwner, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Nama divisi wajib diisi." });
  const data = db.getData();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newDept = {
    id: `dept-${Date.now().toString(36)}`,
    name: String(name).trim(),
    description: description || "",
    status: "ACTIVE",
    created_at: now,
    updated_at: now
  };
  data.departments.push(newDept);
  db.persist();
  return res.status(201).json(newDept);
});
api.put("/departments/:id", requireOwner, (req, res) => {
  const data = db.getData();
  const dept = data.departments.find((d) => d.id === req.params.id);
  if (!dept) return res.status(404).json({ error: "Divisi tidak ditemukan." });
  const { name, description, status } = req.body;
  if (name) dept.name = name;
  if (description !== void 0) dept.description = description;
  if (status) dept.status = status;
  dept.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  db.persist();
  return res.json(dept);
});
api.get("/positions", requireAuth, (req, res) => {
  const data = db.getData();
  return res.json(data.positions);
});
api.post("/positions", requireOwner, (req, res) => {
  const { name, department_id, description } = req.body;
  if (!name || !department_id) return res.status(400).json({ error: "Nama jabatan dan divisi wajib diisi." });
  const data = db.getData();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newPos = {
    id: `pos-${Date.now().toString(36)}`,
    name: String(name).trim(),
    department_id,
    description: description || "",
    status: "ACTIVE",
    created_at: now,
    updated_at: now
  };
  data.positions.push(newPos);
  db.persist();
  return res.status(201).json(newPos);
});
api.get("/roles", requireAuth, (req, res) => {
  const data = db.getData();
  return res.json(data.roles);
});
api.get("/permissions", requireAuth, (req, res) => {
  return res.json(ALL_PERMISSIONS);
});
api.get("/users/:id/permissions", requirePermission("access.manage"), (req, res) => {
  const data = db.getData();
  const user = data.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User tidak ditemukan." });
  const effectivePermissions = calculateUserPermissions(user.id);
  const userOverrides = data.user_permissions.filter((up) => up.user_id === user.id);
  const rolePermissions = data.role_permissions.filter((rp) => rp.role_id === user.role_id).map((rp) => rp.permission_id);
  return res.json({
    userId: user.id,
    roleId: user.role_id,
    isOwner: user.role_id === "owner",
    effectivePermissions,
    rolePermissions,
    customOverrides: userOverrides
  });
});
api.put("/users/:id/permissions", requirePermission("access.manage"), (req, res) => {
  const data = db.getData();
  const targetUser = data.users.find((u) => u.id === req.params.id);
  if (!targetUser) return res.status(404).json({ error: "User tidak ditemukan." });
  if (targetUser.role_id === "owner") {
    return res.status(400).json({
      error: "Owner / Super Admin memiliki seluruh hak akses secara permanen dan tidak dapat dikurangi."
    });
  }
  const { grantedPermissions } = req.body;
  if (!Array.isArray(grantedPermissions)) {
    return res.status(400).json({ error: "Format data permissions tidak valid." });
  }
  data.user_permissions = data.user_permissions.filter((up) => up.user_id !== targetUser.id);
  const rolePerms = data.role_permissions.filter((rp) => rp.role_id === targetUser.role_id).map((rp) => rp.permission_id);
  const rolePermSet = new Set(rolePerms);
  const requestedSet = new Set(grantedPermissions);
  grantedPermissions.forEach((pId) => {
    if (!rolePermSet.has(pId)) {
      data.user_permissions.push({
        id: `up-${targetUser.id}-${pId}`,
        user_id: targetUser.id,
        permission_id: pId,
        allowed: true
      });
    }
  });
  rolePerms.forEach((pId) => {
    if (!requestedSet.has(pId)) {
      data.user_permissions.push({
        id: `up-${targetUser.id}-${pId}`,
        user_id: targetUser.id,
        permission_id: pId,
        allowed: false
      });
    }
  });
  db.persist();
  const targetEmp = data.employees.find((e) => e.id === targetUser.employee_id);
  db.logAudit({
    userId: req.user.id,
    userName: req.employee?.full_name || req.user.username,
    action: "CHANGE_PERMISSION",
    module: "access",
    targetType: "user",
    targetId: targetUser.id,
    description: `Memperbarui hak akses custom untuk ${targetEmp?.full_name || targetUser.username} (${grantedPermissions.length} permissions aktif).`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  db.sendNotification({
    userId: targetUser.id,
    title: "Hak Akses Diperbarui",
    message: "Hak akses akun Anda telah disesuaikan oleh administrator.",
    type: "ACCESS"
  });
  return res.json({
    message: "Hak akses berhasil disimpan.",
    effectivePermissions: calculateUserPermissions(targetUser.id)
  });
});
api.get("/tasks", requirePermission("task.view"), (req, res) => {
  const { status, priority, assignee } = req.query;
  const data = db.getData();
  let list = data.tasks;
  const canManageAll = req.permissions?.includes("task.edit") || req.user?.role_id === "owner";
  if (!canManageAll) {
    list = list.filter((t) => t.assigned_to === req.user?.employee_id || t.created_by === req.user?.id);
  }
  if (status && status !== "ALL") {
    list = list.filter((t) => t.status === status);
  }
  if (priority && priority !== "ALL") {
    list = list.filter((t) => t.priority === priority);
  }
  if (assignee && assignee !== "ALL") {
    list = list.filter((t) => t.assigned_to === assignee);
  }
  const enriched = list.map((t) => {
    const assignedEmp = data.employees.find((e) => e.id === t.assigned_to);
    const creatorUser = data.users.find((u) => u.id === t.created_by);
    const creatorEmp = creatorUser ? data.employees.find((e) => e.id === creatorUser.employee_id) : null;
    const commentsCount = data.task_comments.filter((c) => c.task_id === t.id).length;
    return {
      ...t,
      assignee_name: assignedEmp ? assignedEmp.full_name : "Belum ditugaskan",
      assignee_photo: assignedEmp ? assignedEmp.photo : "",
      creator_name: creatorEmp ? creatorEmp.full_name : creatorUser ? creatorUser.username : "Sistem",
      comments_count: commentsCount
    };
  });
  return res.json(enriched);
});
api.post("/tasks", requirePermission("task.create"), (req, res) => {
  const { title, description, assigned_to, priority, deadline, attachment_name } = req.body;
  if (!title || !assigned_to || !deadline) {
    return res.status(400).json({ error: "Judul tugas, penerima tugas (assignee), dan deadline wajib diisi." });
  }
  const data = db.getData();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newTask = {
    id: `task-${Date.now().toString(36)}`,
    title: String(title).trim(),
    description: description || "",
    assigned_to,
    created_by: req.user.id,
    priority: priority || "MEDIUM",
    deadline,
    status: "TODO",
    attachment_name: attachment_name || null,
    created_at: now,
    updated_at: now
  };
  data.tasks.unshift(newTask);
  db.persist();
  const assignedEmp = data.employees.find((e) => e.id === assigned_to);
  if (assignedEmp) {
    db.sendNotification({
      userId: assignedEmp.user_id,
      title: "Tugas Baru Diterima",
      message: `Anda ditugaskan tugas baru: "${newTask.title}" (Batas Waktu: ${newTask.deadline})`,
      type: "TASK",
      priority: newTask.priority === "URGENT" ? "URGENT" : newTask.priority === "HIGH" ? "HIGH" : "NORMAL",
      link: "/tasks",
      metadata: { taskId: newTask.id, dueDate: newTask.deadline }
    });
  }
  db.logAudit({
    userId: req.user.id,
    userName: req.employee?.full_name || req.user.username,
    action: "CREATE_TASK",
    module: "task",
    targetType: "task",
    targetId: newTask.id,
    description: `Membuat tugas baru: "${newTask.title}" untuk ${assignedEmp?.full_name || assigned_to}.`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.status(201).json(newTask);
});
api.put("/tasks/:id", requirePermission("task.update"), (req, res) => {
  const data = db.getData();
  const task = data.tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Tugas tidak ditemukan." });
  const isAssignee = task.assigned_to === req.user?.employee_id;
  const canEditDetails = req.permissions?.includes("task.edit") || req.user?.role_id === "owner" || task.created_by === req.user?.id;
  const { title, description, assigned_to, priority, deadline, status, attachment_name } = req.body;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (!canEditDetails && isAssignee) {
    if (status) task.status = status;
    task.updated_at = now;
    db.persist();
    return res.json(task);
  }
  if (canEditDetails) {
    if (title) task.title = title;
    if (description !== void 0) task.description = description;
    if (assigned_to) task.assigned_to = assigned_to;
    if (priority) task.priority = priority;
    if (deadline) task.deadline = deadline;
    if (status) task.status = status;
    if (attachment_name !== void 0) task.attachment_name = attachment_name;
    task.updated_at = now;
    db.persist();
    return res.json(task);
  }
  return res.status(403).json({ error: "Anda tidak mempunyai hak untuk mengubah tugas ini." });
});
api.delete("/tasks/:id", requirePermission("task.delete"), (req, res) => {
  const data = db.getData();
  const idx = data.tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Tugas tidak ditemukan." });
  const deleted = data.tasks.splice(idx, 1)[0];
  data.task_comments = data.task_comments.filter((c) => c.task_id !== req.params.id);
  db.persist();
  db.logAudit({
    userId: req.user.id,
    userName: req.employee?.full_name || req.user.username,
    action: "DELETE_TASK",
    module: "task",
    targetType: "task",
    targetId: deleted.id,
    description: `Menghapus tugas: "${deleted.title}".`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.json({ message: "Tugas berhasil dihapus." });
});
api.get("/tasks/:id/comments", requirePermission("task.view"), (req, res) => {
  const data = db.getData();
  const comments = data.task_comments.filter((c) => c.task_id === req.params.id);
  return res.json(comments);
});
api.post("/tasks/:id/comments", requirePermission("task.view"), (req, res) => {
  const { comment } = req.body;
  if (!comment || !String(comment).trim()) {
    return res.status(400).json({ error: "Komentar tidak boleh kosong." });
  }
  const data = db.getData();
  const newComment = {
    id: `tc-${Date.now().toString(36)}`,
    task_id: req.params.id,
    user_id: req.user.id,
    user_name: req.employee?.full_name || req.user.username,
    comment: String(comment).trim(),
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  data.task_comments.push(newComment);
  db.persist();
  return res.status(201).json(newComment);
});
api.get("/schedules", requirePermission("schedule.view"), (req, res) => {
  const { month, year, type } = req.query;
  const data = db.getData();
  let list = data.schedules;
  if (type && type !== "ALL") {
    list = list.filter((s) => s.type === type);
  }
  const enriched = list.map((s) => {
    const assignedStaff = data.employees.filter((e) => s.user_ids.includes(e.id)).map((e) => ({
      id: e.id,
      name: e.full_name,
      photo: e.photo
    }));
    return {
      ...s,
      assignedStaff
    };
  });
  return res.json(enriched);
});
api.post("/schedules", requirePermission("schedule.create"), (req, res) => {
  const { title, type, start_date, end_date, start_time, end_time, user_ids, notes } = req.body;
  if (!title || !start_date || !type) {
    return res.status(400).json({ error: "Judul, tipe jadwal, dan tanggal mulai wajib diisi." });
  }
  const data = db.getData();
  const newSchedule = {
    id: `sch-${Date.now().toString(36)}`,
    title: String(title).trim(),
    type: type || "SHIFT",
    start_date,
    end_date: end_date || start_date,
    start_time: start_time || "08:00",
    end_time: end_time || "17:00",
    user_ids: Array.isArray(user_ids) ? user_ids : [],
    notes: notes || "",
    created_by: req.user.id,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  data.schedules.unshift(newSchedule);
  db.persist();
  db.logAudit({
    userId: req.user.id,
    userName: req.employee?.full_name || req.user.username,
    action: "CREATE_SCHEDULE",
    module: "schedule",
    targetType: "schedule",
    targetId: newSchedule.id,
    description: `Membuat jadwal ${newSchedule.type}: "${newSchedule.title}" tanggal ${newSchedule.start_date}.`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.status(201).json(newSchedule);
});
api.delete("/schedules/:id", requirePermission("schedule.delete"), (req, res) => {
  const data = db.getData();
  const idx = data.schedules.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Jadwal tidak ditemukan." });
  const deleted = data.schedules.splice(idx, 1)[0];
  db.persist();
  return res.json({ message: "Jadwal berhasil dihapus." });
});
api.get("/leave", requirePermission("leave.view"), (req, res) => {
  const data = db.getData();
  const canApprove = req.permissions?.includes("leave.approve") || req.user?.role_id === "owner";
  let list = data.leave_requests;
  if (!canApprove) {
    list = list.filter((l) => l.employee_id === req.user?.employee_id);
  }
  const enriched = list.map((l) => {
    const emp = data.employees.find((e) => e.id === l.employee_id);
    const approver = l.approved_by ? data.users.find((u) => u.id === l.approved_by) : null;
    const approverEmp = approver ? data.employees.find((e) => e.id === approver.employee_id) : null;
    return {
      ...l,
      employee_name: emp ? emp.full_name : "Karyawan",
      employee_photo: emp ? emp.photo : "",
      department_name: emp ? data.departments.find((d) => d.id === emp.department_id)?.name : "-",
      approver_name: approverEmp ? approverEmp.full_name : approver ? approver.username : null
    };
  });
  return res.json(enriched);
});
api.post("/leave", requirePermission("leave.create"), (req, res) => {
  const { type, start_date, end_date, total_days, reason, attachment_name } = req.body;
  if (!type || !start_date || !end_date || !reason) {
    return res.status(400).json({ error: "Jenis pengajuan, tanggal mulai, tanggal selesai, dan alasan wajib diisi." });
  }
  const data = db.getData();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newLeave = {
    id: `leave-${Date.now().toString(36)}`,
    employee_id: req.user.employee_id,
    type,
    start_date,
    end_date,
    total_days: Number(total_days) || 1,
    reason: String(reason).trim(),
    attachment_name: attachment_name || null,
    status: "PENDING",
    approved_by: null,
    approval_notes: null,
    created_at: now,
    updated_at: now
  };
  data.leave_requests.unshift(newLeave);
  db.persist();
  const leaders = data.users.filter((u) => u.role_id === "owner" || u.role_id === "pj_klinik");
  leaders.forEach((leader) => {
    db.sendNotification({
      userId: leader.id,
      title: "Pengajuan Cuti / Izin Baru",
      message: `${req.employee?.full_name || "Karyawan"} mengajukan ${type} (${newLeave.start_date} s/d ${newLeave.end_date}).`,
      type: "LEAVE",
      link: "/leave"
    });
  });
  db.logAudit({
    userId: req.user.id,
    userName: req.employee?.full_name || req.user.username,
    action: "SUBMIT_LEAVE",
    module: "leave",
    targetType: "leave_request",
    targetId: newLeave.id,
    description: `Mengajukan ${type} selama ${newLeave.total_days} hari (${newLeave.start_date} s/d ${newLeave.end_date}). Alasan: ${newLeave.reason}.`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.status(201).json(newLeave);
});
api.put("/leave/:id/approve", requirePermission("leave.approve"), (req, res) => {
  const { notes } = req.body;
  const data = db.getData();
  const leave = data.leave_requests.find((l) => l.id === req.params.id);
  if (!leave) return res.status(404).json({ error: "Pengajuan cuti tidak ditemukan." });
  leave.status = "APPROVED";
  leave.approved_by = req.user.id;
  leave.approval_notes = notes || "Disetujui.";
  leave.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  db.persist();
  const emp = data.employees.find((e) => e.id === leave.employee_id);
  if (emp) {
    db.sendNotification({
      userId: emp.user_id,
      title: "Pengajuan Cuti Disetujui",
      message: `Pengajuan ${leave.type} Anda tanggal ${leave.start_date} telah DISETUJUI.`,
      type: "LEAVE",
      link: "/leave"
    });
  }
  db.logAudit({
    userId: req.user.id,
    userName: req.employee?.full_name || req.user.username,
    action: "APPROVE_LEAVE",
    module: "leave",
    targetType: "leave_request",
    targetId: leave.id,
    description: `Menyetujui pengajuan ${leave.type} untuk ${emp?.full_name}. Catatan: ${leave.approval_notes}`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.json({ message: "Pengajuan cuti berhasil disetujui.", leave });
});
api.put("/leave/:id/reject", requirePermission("leave.reject"), (req, res) => {
  const { notes } = req.body;
  if (!notes) return res.status(400).json({ error: "Alasan penolakan wajib dicantumkan." });
  const data = db.getData();
  const leave = data.leave_requests.find((l) => l.id === req.params.id);
  if (!leave) return res.status(404).json({ error: "Pengajuan cuti tidak ditemukan." });
  leave.status = "REJECTED";
  leave.approved_by = req.user.id;
  leave.approval_notes = notes;
  leave.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  db.persist();
  const emp = data.employees.find((e) => e.id === leave.employee_id);
  if (emp) {
    db.sendNotification({
      userId: emp.user_id,
      title: "Pengajuan Cuti Ditolak",
      message: `Pengajuan ${leave.type} Anda ditolak. Alasan: ${notes}`,
      type: "LEAVE",
      link: "/leave"
    });
  }
  db.logAudit({
    userId: req.user.id,
    userName: req.employee?.full_name || req.user.username,
    action: "REJECT_LEAVE",
    module: "leave",
    targetType: "leave_request",
    targetId: leave.id,
    description: `Menolak pengajuan ${leave.type} untuk ${emp?.full_name}. Alasan: ${notes}`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.json({ message: "Pengajuan cuti ditolak.", leave });
});
api.get("/payroll", requirePermission("payroll.view"), (req, res) => {
  const data = db.getData();
  const isOwner = req.user?.role_id === "owner";
  let list = data.payroll;
  if (!isOwner) {
    list = list.filter((p) => !p.is_private);
  }
  const enriched = list.map((p) => {
    const emp = data.employees.find((e) => e.id === p.employee_id);
    const dept = emp ? data.departments.find((d) => d.id === emp.department_id) : null;
    const pos = emp ? data.positions.find((pos2) => pos2.id === emp.position_id) : null;
    return {
      ...p,
      employee_name: emp ? emp.full_name : "Karyawan",
      employee_number: emp ? emp.employee_number : "-",
      department_name: dept ? dept.name : "-",
      position_name: pos ? pos.name : "-"
    };
  });
  return res.json(enriched);
});
api.post("/payroll", requirePermission("payroll.create"), (req, res) => {
  const { employee_id, period, base_salary, allowance, bonus, deduction, notes, is_private } = req.body;
  if (!employee_id || !period || base_salary === void 0) {
    return res.status(400).json({ error: "Karyawan, periode, dan gaji pokok wajib diisi." });
  }
  const base = Number(base_salary) || 0;
  const allow = Number(allowance) || 0;
  const bon = Number(bonus) || 0;
  const ded = Number(deduction) || 0;
  const total = base + allow + bon - ded;
  const data = db.getData();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const targetEmp = data.employees.find((e) => e.id === employee_id);
  const targetUser = targetEmp ? data.users.find((u) => u.id === targetEmp.user_id) : null;
  const shouldBePrivate = targetUser?.role_id === "owner" ? true : Boolean(is_private);
  const newPayroll = {
    id: `pay-${Date.now().toString(36)}`,
    employee_id,
    period,
    base_salary: base,
    allowance: allow,
    bonus: bon,
    deduction: ded,
    total_salary: total,
    payment_status: "DRAFT",
    payment_date: null,
    notes: notes || "",
    is_private: shouldBePrivate,
    created_by: req.user.id,
    created_at: now,
    updated_at: now
  };
  data.payroll.unshift(newPayroll);
  db.persist();
  if (targetUser && targetUser.id !== req.user.id) {
    db.sendNotification({
      userId: targetUser.id,
      title: "Pembaruan Payroll",
      message: `Slip gaji Anda periode ${newPayroll.period} telah diterbitkan dengan status ${newPayroll.payment_status}. Total Net: Rp ${newPayroll.total_salary.toLocaleString("id-ID")}.`,
      type: "PAYROLL",
      priority: "NORMAL",
      link: "/payroll",
      metadata: { payrollId: newPayroll.id, amount: newPayroll.total_salary, status: newPayroll.payment_status }
    });
  }
  db.logAudit({
    userId: req.user.id,
    userName: req.employee?.full_name || req.user.username,
    action: "CREATE_PAYROLL",
    module: "payroll",
    targetType: "payroll",
    targetId: newPayroll.id,
    description: `Membuat data slip gaji periode ${period} untuk ${targetEmp?.full_name}. Total: Rp ${total.toLocaleString("id-ID")}.`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.status(201).json(newPayroll);
});
api.put("/payroll/:id", requirePermission("payroll.edit"), (req, res) => {
  const data = db.getData();
  const payroll = data.payroll.find((p) => p.id === req.params.id);
  if (!payroll) return res.status(404).json({ error: "Data payroll tidak ditemukan." });
  if (payroll.is_private && req.user?.role_id !== "owner") {
    return res.status(403).json({ error: "Data payroll ini bersifat rahasia dan hanya dapat diubah oleh Owner." });
  }
  const { base_salary, allowance, bonus, deduction, payment_status, payment_date, notes } = req.body;
  if (base_salary !== void 0) payroll.base_salary = Number(base_salary);
  if (allowance !== void 0) payroll.allowance = Number(allowance);
  if (bonus !== void 0) payroll.bonus = Number(bonus);
  if (deduction !== void 0) payroll.deduction = Number(deduction);
  payroll.total_salary = payroll.base_salary + payroll.allowance + payroll.bonus - payroll.deduction;
  const previousStatus = payroll.payment_status;
  if (payment_status) payroll.payment_status = payment_status;
  if (payment_date !== void 0) payroll.payment_date = payment_date;
  if (notes !== void 0) payroll.notes = notes;
  payroll.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  db.persist();
  const emp = data.employees.find((e) => e.id === payroll.employee_id);
  const targetUser = emp ? data.users.find((u) => u.id === emp.user_id) : null;
  if (targetUser && targetUser.id !== req.user.id) {
    const isPaid = payroll.payment_status === "PAID";
    db.sendNotification({
      userId: targetUser.id,
      title: isPaid ? "Gaji Telah Ditransfer (PAID)" : "Pembaruan Status Payroll",
      message: `Status gaji Anda periode ${payroll.period} sebesar Rp ${payroll.total_salary.toLocaleString("id-ID")} ${isPaid ? "telah berhasil DIBAYARKAN / DITRANSFER (PAID)." : `diperbarui menjadi ${payroll.payment_status}.`}`,
      type: "PAYROLL",
      priority: isPaid ? "HIGH" : "NORMAL",
      link: "/payroll",
      metadata: { payrollId: payroll.id, amount: payroll.total_salary, status: payroll.payment_status }
    });
  }
  db.logAudit({
    userId: req.user.id,
    userName: req.employee?.full_name || req.user.username,
    action: "UPDATE_PAYROLL",
    module: "payroll",
    targetType: "payroll",
    targetId: payroll.id,
    description: `Memperbarui payroll periode ${payroll.period} untuk ${emp?.full_name}. Status: ${payroll.payment_status}.`,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.json({ message: "Data payroll berhasil diperbarui.", payroll });
});
api.delete("/payroll/:id", requirePermission("payroll.delete"), (req, res) => {
  const data = db.getData();
  const idx = data.payroll.findIndex((p2) => p2.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Data payroll tidak ditemukan." });
  const p = data.payroll[idx];
  if (p.is_private && req.user?.role_id !== "owner") {
    return res.status(403).json({ error: "Data payroll privat hanya dapat dihapus oleh Owner." });
  }
  data.payroll.splice(idx, 1);
  db.persist();
  return res.json({ message: "Data payroll berhasil dihapus." });
});
api.get("/reports", requirePermission("report.view"), (req, res) => {
  const { type, department, status, startDate, endDate } = req.query;
  const data = db.getData();
  const totalEmployees = data.employees.filter((e) => !e.deleted_at).length;
  const employeesByDept = data.departments.map((d) => ({
    department: d.name,
    count: data.employees.filter((e) => !e.deleted_at && e.department_id === d.id).length
  }));
  const leaveSummary = {
    total: data.leave_requests.length,
    approved: data.leave_requests.filter((l) => l.status === "APPROVED").length,
    pending: data.leave_requests.filter((l) => l.status === "PENDING").length,
    rejected: data.leave_requests.filter((l) => l.status === "REJECTED").length
  };
  const taskSummary = {
    total: data.tasks.length,
    done: data.tasks.filter((t) => t.status === "DONE").length,
    in_progress: data.tasks.filter((t) => t.status === "IN_PROGRESS").length,
    todo: data.tasks.filter((t) => t.status === "TODO").length
  };
  const payrollSummary = {
    totalPayrollPaid: data.payroll.filter((p) => p.payment_status === "PAID").reduce((acc, curr) => acc + curr.total_salary, 0),
    totalPayrollDraft: data.payroll.filter((p) => p.payment_status !== "PAID").reduce((acc, curr) => acc + curr.total_salary, 0)
  };
  return res.json({
    totalEmployees,
    employeesByDept,
    leaveSummary,
    taskSummary,
    payrollSummary
  });
});
api.get("/announcements", requirePermission("announcement.view"), (req, res) => {
  const data = db.getData();
  const userDept = req.employee?.department_id;
  const userEmpId = req.user?.employee_id;
  const isManager = req.user?.role_id === "owner" || req.user?.role_id === "pj_klinik";
  let list = data.announcements;
  if (!isManager) {
    list = list.filter(
      (a) => a.status === "PUBLISHED" && (a.target_type === "ALL" || a.target_type === "DEPARTMENT" && a.target_id === userDept || a.target_type === "EMPLOYEE" && a.target_id === userEmpId)
    );
  }
  return res.json(list);
});
api.post("/announcements", requirePermission("announcement.create"), (req, res) => {
  const { title, content, target_type, target_id, status } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Judul dan isi pengumuman wajib diisi." });
  }
  const data = db.getData();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newAnc = {
    id: `anc-${Date.now().toString(36)}`,
    title: String(title).trim(),
    content: String(content).trim(),
    target_type: target_type || "ALL",
    target_id: target_id || null,
    publish_date: now.split("T")[0],
    status: status || "PUBLISHED",
    author_id: req.user.id,
    author_name: req.employee?.full_name || req.user.username,
    created_at: now,
    updated_at: now
  };
  data.announcements.unshift(newAnc);
  db.persist();
  const recipients = data.users.filter((u) => u.id !== req.user.id && u.status === "ACTIVE");
  recipients.forEach((r) => {
    db.sendNotification({
      userId: r.id,
      title: "Pengumuman Baru Klinik",
      message: newAnc.title,
      type: "ANNOUNCEMENT",
      link: "/announcements"
    });
  });
  return res.status(201).json(newAnc);
});
api.delete("/announcements/:id", requirePermission("announcement.delete"), (req, res) => {
  const data = db.getData();
  const idx = data.announcements.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Pengumuman tidak ditemukan." });
  data.announcements.splice(idx, 1);
  db.persist();
  return res.json({ message: "Pengumuman berhasil dihapus." });
});
api.get("/audit-logs", requirePermission("audit.view"), (req, res) => {
  const { module, action, search } = req.query;
  const data = db.getData();
  let list = data.audit_logs;
  if (module && module !== "ALL") {
    list = list.filter((l) => l.module === module);
  }
  if (action && action !== "ALL") {
    list = list.filter((l) => l.action === action);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (l) => l.user_name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.action.toLowerCase().includes(q)
    );
  }
  return res.json(list.slice(0, 100));
});
function checkAndGenerateDeadlineReminders() {
  const data = db.getData();
  const now = /* @__PURE__ */ new Date();
  const todayStr = now.toISOString().split("T")[0];
  const todayTime = new Date(todayStr).getTime();
  const activeTasks = data.tasks.filter(
    (t) => t.status === "TODO" || t.status === "IN_PROGRESS" || t.status === "REVIEW"
  );
  for (const task of activeTasks) {
    if (!task.assigned_to || !task.deadline) continue;
    const emp = data.employees.find((e) => e.id === task.assigned_to);
    if (!emp || !emp.user_id) continue;
    const deadlineTime = new Date(task.deadline).getTime();
    const diffDays = Math.ceil((deadlineTime - todayTime) / (1e3 * 60 * 60 * 24));
    if (diffDays <= 3) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString();
      const alreadySent = data.notifications.some(
        (n) => n.user_id === emp.user_id && n.type === "DEADLINE" && n.metadata?.taskId === task.id && n.created_at > oneDayAgo
      );
      if (!alreadySent) {
        let dueText = "";
        let priority = "HIGH";
        if (diffDays < 0) {
          dueText = `telah melewati batas waktu ${Math.abs(diffDays)} hari yang lalu`;
          priority = "URGENT";
        } else if (diffDays === 0) {
          dueText = "jatuh tempo HARI INI";
          priority = "URGENT";
        } else if (diffDays === 1) {
          dueText = "jatuh tempo BESOK";
          priority = "HIGH";
        } else {
          dueText = `jatuh tempo dalam ${diffDays} hari (${task.deadline})`;
          priority = "HIGH";
        }
        db.sendNotification({
          userId: emp.user_id,
          title: "Peringatan Deadline Tugas",
          message: `Tugas "${task.title}" ${dueText}. Segera periksa dan perbarui status pengerjaan Anda.`,
          type: "DEADLINE",
          priority,
          link: "/tasks",
          metadata: { taskId: task.id, dueDate: task.deadline }
        });
      }
    }
  }
}
api.get("/notifications", requireAuth, (req, res) => {
  checkAndGenerateDeadlineReminders();
  const { type, unreadOnly } = req.query;
  const data = db.getData();
  const userId = req.user.id;
  let userNotifs = data.notifications.filter((n) => n.user_id === userId);
  const totalCount = userNotifs.length;
  const unreadCount = userNotifs.filter((n) => !n.read).length;
  const taskCount = userNotifs.filter((n) => n.type === "TASK").length;
  const deadlineCount = userNotifs.filter((n) => n.type === "DEADLINE").length;
  const leaveCount = userNotifs.filter((n) => n.type === "LEAVE").length;
  const payrollCount = userNotifs.filter((n) => n.type === "PAYROLL").length;
  if (type && type !== "ALL") {
    userNotifs = userNotifs.filter((n) => n.type === type);
  }
  if (unreadOnly === "true") {
    userNotifs = userNotifs.filter((n) => !n.read);
  }
  return res.json({
    notifications: userNotifs,
    unreadCount,
    counts: {
      all: totalCount,
      unread: unreadCount,
      task: taskCount,
      deadline: deadlineCount,
      leave: leaveCount,
      payroll: payrollCount
    }
  });
});
api.post("/notifications/check-deadlines", requireAuth, (req, res) => {
  checkAndGenerateDeadlineReminders();
  return res.json({ success: true, message: "Pengecekan deadline selesai dijalankan." });
});
api.patch("/notifications/:id/read", requireAuth, (req, res) => {
  const data = db.getData();
  const notif = data.notifications.find((n) => n.id === req.params.id && n.user_id === req.user.id);
  if (notif) {
    notif.read = true;
    db.persist();
  }
  return res.json({ success: true });
});
api.patch("/notifications/read-all", requireAuth, (req, res) => {
  const data = db.getData();
  data.notifications.forEach((n) => {
    if (n.user_id === req.user.id) {
      n.read = true;
    }
  });
  db.persist();
  return res.json({ success: true });
});
api.delete("/notifications/:id", requireAuth, (req, res) => {
  const data = db.getData();
  const idx = data.notifications.findIndex((n) => n.id === req.params.id && n.user_id === req.user.id);
  if (idx !== -1) {
    data.notifications.splice(idx, 1);
    db.persist();
  }
  return res.json({ success: true, message: "Notifikasi berhasil dihapus." });
});
api.delete("/notifications/clear-all", requireAuth, (req, res) => {
  const data = db.getData();
  data.notifications = data.notifications.filter(
    (n) => !(n.user_id === req.user.id && n.read)
  );
  db.persist();
  return res.json({ success: true, message: "Semua notifikasi yang telah dibaca berhasil dibersihkan." });
});
api.get("/settings", requireAuth, (req, res) => {
  const data = db.getData();
  return res.json(data.settings);
});
api.put("/settings", requirePermission("settings.edit"), (req, res) => {
  const data = db.getData();
  const { clinic_name, app_name, timezone, date_format, allow_notifications, session_timeout_minutes, require_strong_password } = req.body;
  if (clinic_name) data.settings.clinic_name = clinic_name;
  if (app_name) data.settings.app_name = app_name;
  if (timezone) data.settings.timezone = timezone;
  if (date_format) data.settings.date_format = date_format;
  if (allow_notifications !== void 0) data.settings.allow_notifications = Boolean(allow_notifications);
  if (session_timeout_minutes) data.settings.session_timeout_minutes = Number(session_timeout_minutes);
  if (require_strong_password !== void 0) data.settings.require_strong_password = Boolean(require_strong_password);
  data.settings.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  db.persist();
  db.logAudit({
    userId: req.user.id,
    userName: req.employee?.full_name || req.user.username,
    action: "UPDATE_SETTINGS",
    module: "settings",
    targetType: "settings",
    description: "Memperbarui konfigurasi sistem dan klinik.",
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.json({ message: "Pengaturan berhasil diperbarui.", settings: data.settings });
});
api.get("/database/info", requireAuth, (req, res) => {
  const stats = db.getDbStats();
  return res.json(stats);
});
api.get("/database/backup", requireOwner, (req, res) => {
  const data = db.getData();
  const dateStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="goc_database_backup_${dateStr}.json"`);
  return res.send(JSON.stringify(data, null, 2));
});
api.post("/database/restore", requireOwner, (req, res) => {
  const incomingData = req.body;
  if (!incomingData || typeof incomingData !== "object") {
    return res.status(400).json({ error: "File data database tidak valid." });
  }
  try {
    db.replaceData(incomingData);
    db.logAudit({
      userId: req.user.id,
      userName: req.employee?.full_name || req.user.username,
      action: "RESTORE_DATABASE",
      module: "system",
      targetType: "database",
      description: "Memulihkan cadangan database pusat dari file JSON.",
      ip: req.headers["x-forwarded-for"] || req.ip,
      userAgent: req.headers["user-agent"]
    });
    return res.json({
      message: "Database berhasil dipulihkan dari cadangan.",
      stats: db.getDbStats()
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Gagal memulihkan database." });
  }
});
api.post("/database/reset", requireOwner, (req, res) => {
  try {
    db.resetToSeed();
    db.logAudit({
      userId: req.user.id,
      userName: req.employee?.full_name || req.user.username,
      action: "RESET_DATABASE",
      module: "system",
      targetType: "database",
      description: "Mereset database pusat ke data default klinik GOC.",
      ip: req.headers["x-forwarded-for"] || req.ip,
      userAgent: req.headers["user-agent"]
    });
    return res.json({
      message: "Database berhasil di-reset ke konfigurasi awal klinik GOC.",
      stats: db.getDbStats()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Gagal mereset database." });
  }
});
var geminiClient = null;
function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return geminiClient;
}
function getSmartFallbackSolution(prompt, channelName) {
  const p = prompt.toLowerCase();
  if (p.includes("steril") || p.includes("autoclave") || p.includes("alat") || p.includes("tray")) {
    return `\u{1F4A1} **Solusi SOP Sterilisasi Orthodonti GOC**:
1. **Pembersihan Awal**: Bilas instrumen (pliers, bracket tweezers, explorer) dengan larutan enzymatic cleaner ultrasonik selama 10 menit.
2. **Pengeringan & Pengepakan**: Keringkan sempurna dengan kain mikrofiber steril, masukkan ke dalam sterilization pouch dengan indikator strip kimia.
3. **Autoclave Cycle**: Jalankan siklus autoclave pada suhu 121\xB0C (tekanan 15 psi) selama 30 menit atau 134\xB0C selama 15 menit.
4. **Pencatatan Logbook**: Catat tanggal, nomor batch, suhu puncak, dan paraf perawat gigi penanggung jawab di buku kontrol harian GOC.`;
  }
  if (p.includes("komplain") || p.includes("pasien") || p.includes("antre") || p.includes("tunggu")) {
    return `\u{1F4A1} **Panduan Service Recovery & Komunikasi Pasien GOC**:
1. **Dengarkan & Validasi**: Sampaikan permohonan maaf atas waktu tunggu dengan tulus: *"Mohon maaf Bapak/Ibu [Nama], kami memahami kenyamanan dan waktu Anda sangat berharga. Saat ini dokter sedang menyelesaikan penanganan presisi pada pasien sebelumnya."*
2. **Kenyamanan Lounge**: Tawarkan air mineral higienis, update perkiraan waktu mulai tindakan (misal: 10 menit lagi), dan sediakan Wi-Fi / majalah edukasi orthodonti.
3. **Catatan SIM-Klinik**: Beri tanda prioritas untuk kunjungan kontrol berikutnya agar pasien dipanggil tepat waktu tanpa hambatan.`;
  }
  if (p.includes("kawat") || p.includes("bracket") || p.includes("lepas") || p.includes("sakit") || p.includes("nyeri")) {
    return `\u{1F4A1} **Protokol Penanganan Darurat Orthodonti Pasien GOC**:
1. **Bracket Lepas (Debonded)**: Jika bracket masih menempel pada archwire, oleskan dental wax. Jadwalkan perbaikan re-bonding dalam 1-2 hari kerja.
2. **Ujung Kawat Menusuk**: Gunakan cotton roll atau dental wax sebagai pelindung darurat. Di klinik, potong ujung distal wire menggunakan distal end cutter steril dengan safety catch.
3. **Rasa Sakit Pasca Aktivasi**: Normal selama 48-72 jam pertama. Anjurkan makanan lunak dan konsumsi analgesik (paracetamol/ibuprofen) sesuai anjuran dokter Ervina.`;
  }
  if (p.includes("promo") || p.includes("iklan") || p.includes("marketing") || p.includes("konten") || p.includes("reels")) {
    return `\u{1F4A1} **Ide Konten & Campaign Digital Marketing GOC**:
1. **Hook Reels/TikTok**: *"Pernah merasa kawat gigi nusuk pipi? Jangan panik, ini pertolongan pertama dari dokter gigi GOC!"* atau *"Bedanya Behel Konvensional vs Aligner Transparan untuk Usia Dewasa"*.
2. **Call-to-Action (CTA)**: Arahkan ke link bio WhatsApp Administrasi dengan kalimat ramah: *"Konsultasi senyum rapi dan estetik bersama dokter spesialis orthodonti GOC klik link di bio ya!"*
3. **Follow-up Leads**: Pastikan admin merespons leads WhatsApp dalam waktu maksimal 5 menit dengan greeting hangat dan informasi ketersediaan slot reservasi.`;
  }
  return `\u{1F4A1} **Rekomendasi Solusi Tim GOC**:
Terima kasih atas diskusinya rekan-rekan. Terkait topik "${prompt.slice(0, 80)}", berikut langkah taktis yang dapat diterapkan:
1. **Langkah Taktis**: Koordinasikan dengan Penanggung Jawab Klinik (drg. Ervina) atau Pimpinan (Pak Hendri) jika memerlukan persetujuan kebijakan.
2. **Tindakan Lintas Divisi**: Bagi tugas secara spesifik antara front office administrasi, perawat gigi, dan tim penunjang agar eksekusi cepat dan terukur.
3. **Dokumentasi**: Catat hasil keputusan diskusi di forum ini atau buatkan Task di menu Tugas GOC agar deadline dan progresnya terpantau rapi.`;
}
async function generateAiSolution(prompt, contextHistory = "", channelName) {
  const client = getGeminiClient();
  if (!client) {
    return getSmartFallbackSolution(prompt, channelName);
  }
  try {
    const systemInstruction = `Anda adalah GOC AI Assistant \u2014 konsultan cerdas, ramah, dan solutif untuk Galaxy Orthodontic Center (GOC).
Pimpinan klinik: Hendri Kurniawan, ST., MMSI (Owner & Super Admin) dan drg. Ervina Dewiyanti, Sp.Ort., FICD (Penanggung Jawab Klinik).
Klinik memiliki 4 divisi utama: Administrasi (Front Office & Reservasi), Finance (Keuangan & Payroll), Digital Marketing (Kampanye & Leads Pasien), dan Perawat Gigi (Asistensi Medis & Sterilisasi Autoclave).
Tugas Anda:
1. Memberikan solusi praktis, panduan SOP klinis & operasional klinik gigi orthodonti.
2. Membantu merumuskan draf komunikasi ramah pasien, penanganan komplain, atau efisiensi alur kerja tim.
3. Memberikan ide-ide kreatif dan terstruktur dalam Bahasa Indonesia yang profesional, ramah, dan solutif.
4. Format respon dengan rapi menggunakan markdown (tebal, bullet points).`;
    const contents = contextHistory ? `Riwayat Diskusi Terakhir di Channel "${channelName || "Forum GOC"}":
${contextHistory}

Pertanyaan / Kebutuhan Solusi Tim:
${prompt}` : prompt;
    const response = await client.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    return response.text || getSmartFallbackSolution(prompt, channelName);
  } catch (err) {
    console.error("Gemini API call failed, falling back to smart contextual response:", err);
    return getSmartFallbackSolution(prompt, channelName);
  }
}
api.get("/forum/channels", requireAuth, (req, res) => {
  const data = db.getData();
  const userId = req.user.id;
  const isOwner = req.user?.role_id === "owner";
  const userChannels = data.forum_channels.filter((c) => {
    if (isOwner) return true;
    if (c.type === "ALL_TEAM") return true;
    return c.member_ids && c.member_ids.includes(userId);
  });
  const enriched = userChannels.map((c) => {
    const channelMsgs = data.forum_messages.filter((m) => m.channel_id === c.id);
    const unreadCount = channelMsgs.filter((m) => !m.read_by || !m.read_by.includes(userId)).length;
    return {
      ...c,
      unread_count: unreadCount,
      messages_count: channelMsgs.length
    };
  });
  return res.json(enriched);
});
api.post("/forum/channels", requireAuth, (req, res) => {
  const { name, description, type, department_id, member_ids, ai_enabled } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Nama channel/forum wajib diisi." });
  }
  const data = db.getData();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const channelType = type || "PRIVATE_INVITED";
  let finalMembers = Array.isArray(member_ids) ? [...member_ids] : [];
  if (!finalMembers.includes(req.user.id)) {
    finalMembers.push(req.user.id);
  }
  if (channelType === "ALL_TEAM") {
    finalMembers = data.users.map((u) => u.id);
  } else if (channelType === "DEPARTMENT" && department_id) {
    const deptEmployees = data.employees.filter((e) => e.department_id === department_id);
    const deptUserIds = deptEmployees.map((e) => e.user_id).filter(Boolean);
    finalMembers = Array.from(/* @__PURE__ */ new Set([...finalMembers, ...deptUserIds, req.user.id]));
  }
  const dept = department_id ? data.departments.find((d) => d.id === department_id) : null;
  const newChannel = {
    id: `chan-${Date.now().toString(36)}`,
    name: name.startsWith("#") || channelType !== "ALL_TEAM" ? name : `#${name.toLowerCase().replace(/\s+/g, "-")}`,
    description: description || "",
    type: channelType,
    department_id: department_id || null,
    department_name: dept ? dept.name : null,
    member_ids: finalMembers,
    created_by: req.user.id,
    ai_enabled: ai_enabled !== void 0 ? Boolean(ai_enabled) : true,
    ai_persona: "Konsultan Operasional & Klinis GOC",
    last_message_at: now,
    last_message_preview: "Channel diskusi dibuat.",
    unread_count: 0,
    created_at: now,
    updated_at: now
  };
  data.forum_channels.unshift(newChannel);
  const welcomeMsg = {
    id: `msg-${Date.now().toString(36)}`,
    channel_id: newChannel.id,
    sender_id: req.user.id,
    sender_name: req.employee?.full_name || req.user.username,
    sender_role: req.user.role_id === "owner" ? "Owner / Super Admin" : req.employee?.position_id || "Staff",
    sender_avatar: req.employee?.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    is_ai: false,
    content: `Channel diskusi "${newChannel.name}" telah dibuat. Selamat berkoordinasi!`,
    read_by: [req.user.id],
    created_at: now
  };
  data.forum_messages.push(welcomeMsg);
  db.persist();
  return res.status(201).json(newChannel);
});
api.put("/forum/channels/:id", requireAuth, (req, res) => {
  const data = db.getData();
  const channel = data.forum_channels.find((c) => c.id === req.params.id);
  if (!channel) return res.status(404).json({ error: "Channel forum tidak ditemukan." });
  const isOwner = req.user?.role_id === "owner";
  const isCreator = channel.created_by === req.user.id;
  if (!isOwner && !isCreator && !req.permissions?.includes("forum.create")) {
    return res.status(403).json({ error: "Hanya pembuat channel atau Super Admin yang dapat mengubah pengaturan channel." });
  }
  const { name, description, ai_enabled, member_ids } = req.body;
  if (name !== void 0) channel.name = name;
  if (description !== void 0) channel.description = description;
  if (ai_enabled !== void 0) channel.ai_enabled = Boolean(ai_enabled);
  if (Array.isArray(member_ids)) {
    channel.member_ids = Array.from(/* @__PURE__ */ new Set([...member_ids, req.user.id]));
  }
  channel.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  db.persist();
  return res.json(channel);
});
api.get("/forum/channels/:id/messages", requireAuth, (req, res) => {
  const data = db.getData();
  const channel = data.forum_channels.find((c) => c.id === req.params.id);
  if (!channel) return res.status(404).json({ error: "Channel forum tidak ditemukan." });
  const isOwner = req.user?.role_id === "owner";
  if (!isOwner && channel.type !== "ALL_TEAM" && !channel.member_ids?.includes(req.user.id)) {
    return res.status(403).json({ error: "Anda bukan anggota dari channel diskusi ini." });
  }
  const msgs = data.forum_messages.filter((m) => m.channel_id === channel.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return res.json(msgs);
});
api.post("/forum/channels/:id/messages", requireAuth, async (req, res) => {
  const data = db.getData();
  const channel = data.forum_channels.find((c) => c.id === req.params.id);
  if (!channel) return res.status(404).json({ error: "Channel forum tidak ditemukan." });
  const isOwner = req.user?.role_id === "owner";
  if (!isOwner && channel.type !== "ALL_TEAM" && !channel.member_ids?.includes(req.user.id)) {
    return res.status(403).json({ error: "Anda bukan anggota dari channel diskusi ini." });
  }
  const { content, attachment_url, attachment_name, attachment_type, trigger_ai } = req.body;
  if (!content && !attachment_url) {
    return res.status(400).json({ error: "Isi pesan atau lampiran tidak boleh kosong." });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const user = req.user;
  const emp = req.employee;
  const newMsg = {
    id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    channel_id: channel.id,
    sender_id: user.id,
    sender_name: emp?.full_name || user.username,
    sender_role: user.role_id === "owner" ? "Owner / Super Admin" : emp ? data.positions.find((p) => p.id === emp.position_id)?.name || "Karyawan" : "User",
    sender_avatar: emp?.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    is_ai: false,
    content: String(content || "").trim(),
    attachment_url: attachment_url || null,
    attachment_name: attachment_name || null,
    attachment_type: attachment_type || null,
    reactions: {},
    read_by: [user.id],
    created_at: now
  };
  data.forum_messages.push(newMsg);
  channel.last_message_at = now;
  channel.last_message_preview = `${newMsg.sender_name.split(" ")[0]}: ${newMsg.content.slice(0, 60)}`;
  db.persist();
  const shouldTriggerAi = channel.ai_enabled && (trigger_ai === true || newMsg.content.toLowerCase().includes("@ai") || newMsg.content.toLowerCase().includes("/ai") || newMsg.content.toLowerCase().includes("solusi ai") || newMsg.content.toLowerCase().includes("minta solusi"));
  let aiMessage = null;
  if (shouldTriggerAi) {
    const recentMsgs = data.forum_messages.filter((m) => m.channel_id === channel.id).slice(-6).map((m) => `${m.sender_name} (${m.sender_role}): ${m.content}`).join("\n");
    const cleanPrompt = newMsg.content.replace(/@ai|\/ai/gi, "").trim() || "Mohon berikan analisis dan solusi terbaik untuk diskusi ini.";
    const aiSolution = await generateAiSolution(cleanPrompt, recentMsgs, channel.name);
    aiMessage = {
      id: `msg-ai-${Date.now().toString(36)}`,
      channel_id: channel.id,
      sender_id: "goc-ai-agent",
      sender_name: "GOC AI Assistant",
      sender_role: "Konsultan AI Klinis & Solusi",
      sender_avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
      is_ai: true,
      content: aiSolution,
      reactions: {},
      read_by: [user.id],
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    data.forum_messages.push(aiMessage);
    channel.last_message_at = aiMessage.created_at;
    channel.last_message_preview = `GOC AI: ${aiMessage.content.slice(0, 60)}`;
    db.persist();
  }
  return res.status(201).json({
    message: newMsg,
    aiMessage
  });
});
api.post("/forum/channels/:id/ai-assist", requireAuth, async (req, res) => {
  const data = db.getData();
  const channel = data.forum_channels.find((c) => c.id === req.params.id);
  if (!channel) return res.status(404).json({ error: "Channel forum tidak ditemukan." });
  const { prompt } = req.body;
  const recentMsgs = data.forum_messages.filter((m) => m.channel_id === channel.id).slice(-8).map((m) => `${m.sender_name}: ${m.content}`).join("\n");
  const userPrompt = prompt || "Rangkum kendala dalam diskusi di atas dan berikan rekomendasi solusi konkrit untuk tim GOC.";
  const aiSolution = await generateAiSolution(userPrompt, recentMsgs, channel.name);
  const aiMessage = {
    id: `msg-ai-${Date.now().toString(36)}`,
    channel_id: channel.id,
    sender_id: "goc-ai-agent",
    sender_name: "GOC AI Assistant",
    sender_role: "Konsultan AI Klinis & Solusi",
    sender_avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    is_ai: true,
    content: aiSolution,
    reactions: {},
    read_by: [req.user.id],
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  data.forum_messages.push(aiMessage);
  channel.last_message_at = aiMessage.created_at;
  channel.last_message_preview = `GOC AI: ${aiMessage.content.slice(0, 60)}`;
  db.persist();
  return res.json({ aiMessage });
});
api.patch("/forum/channels/:id/read", requireAuth, (req, res) => {
  const data = db.getData();
  const userId = req.user.id;
  let countUpdated = 0;
  data.forum_messages.forEach((m) => {
    if (m.channel_id === req.params.id) {
      if (!m.read_by) m.read_by = [];
      if (!m.read_by.includes(userId)) {
        m.read_by.push(userId);
        countUpdated++;
      }
    }
  });
  if (countUpdated > 0) {
    db.persist();
  }
  return res.json({ success: true, countUpdated });
});
api.post("/forum/messages/:id/react", requireAuth, (req, res) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: "Emoji wajib dikirim." });
  const data = db.getData();
  const msg = data.forum_messages.find((m) => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: "Pesan tidak ditemukan." });
  if (!msg.reactions) msg.reactions = {};
  if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
  const userId = req.user.id;
  const idx = msg.reactions[emoji].indexOf(userId);
  if (idx !== -1) {
    msg.reactions[emoji].splice(idx, 1);
    if (msg.reactions[emoji].length === 0) {
      delete msg.reactions[emoji];
    }
  } else {
    msg.reactions[emoji].push(userId);
  }
  db.persist();
  return res.json({ reactions: msg.reactions });
});
api.get("/meetings", requireAuth, (req, res) => {
  const data = db.getData();
  const sorted = [...data.video_meetings].sort((a, b) => {
    if (a.status === "LIVE" && b.status !== "LIVE") return -1;
    if (b.status === "LIVE" && a.status !== "LIVE") return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return res.json(sorted);
});
api.post("/meetings", requireAuth, (req, res) => {
  const { title, description, channel_id, scheduled_start, status } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Judul meeting wajib diisi." });
  }
  const data = db.getData();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const roomCode = `GOC-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const newMeeting = {
    id: `meet-${Date.now().toString(36)}`,
    title: String(title).trim(),
    description: description || "",
    host_id: req.user.id,
    host_name: req.employee?.full_name || req.user.username,
    channel_id: channel_id || null,
    status: status || "LIVE",
    scheduled_start: scheduled_start || now,
    started_at: status === "LIVE" ? now : void 0,
    participant_ids: [req.user.id],
    invited_ids: data.users.map((u) => u.id),
    room_code: roomCode,
    created_at: now
  };
  data.video_meetings.unshift(newMeeting);
  db.persist();
  if (channel_id) {
    const channel = data.forum_channels.find((c) => c.id === channel_id);
    if (channel) {
      data.forum_messages.push({
        id: `msg-${Date.now().toString(36)}`,
        channel_id: channel.id,
        sender_id: req.user.id,
        sender_name: req.employee?.full_name || req.user.username,
        sender_role: req.user.role_id === "owner" ? "Owner / Super Admin" : "Host Meeting",
        sender_avatar: req.employee?.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        is_ai: false,
        content: `\u{1F4F9} **Ruang Video Meeting Dimulai:** "${newMeeting.title}"
Kode Ruang: **${newMeeting.room_code}**
Silakan bergabung melalui tab Video Meeting.`,
        read_by: [req.user.id],
        created_at: now
      });
      channel.last_message_at = now;
      channel.last_message_preview = `Video Meeting: ${newMeeting.title}`;
      db.persist();
    }
  }
  return res.status(201).json(newMeeting);
});
api.put("/meetings/:id", requireAuth, (req, res) => {
  const data = db.getData();
  const meeting = data.video_meetings.find((m) => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: "Ruang meeting tidak ditemukan." });
  const { status, action } = req.body;
  const userId = req.user.id;
  if (action === "join") {
    if (!meeting.participant_ids.includes(userId)) {
      meeting.participant_ids.push(userId);
    }
    if (meeting.status === "SCHEDULED") {
      meeting.status = "LIVE";
      meeting.started_at = (/* @__PURE__ */ new Date()).toISOString();
    }
  } else if (action === "leave") {
    meeting.participant_ids = meeting.participant_ids.filter((id) => id !== userId);
  } else if (status) {
    meeting.status = status;
    if (status === "ENDED") {
      meeting.ended_at = (/* @__PURE__ */ new Date()).toISOString();
      meeting.participant_ids = [];
    }
  }
  db.persist();
  return res.json(meeting);
});
api.post("/meetings/:id/ai-summary", requireAuth, async (req, res) => {
  const data = db.getData();
  const meeting = data.video_meetings.find((m) => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: "Ruang meeting tidak ditemukan." });
  const prompt = `Buatkan notulensi ringkas, poin keputusan utama, dan daftar aksi (action items) untuk video meeting klinik:
Judul: ${meeting.title}
Deskripsi: ${meeting.description || "-"}
Host: ${meeting.host_name}
Peserta: Seluruh tim GOC (Dokter Spesialis Orthodonti, Manajemen, Front Office, Finance, Marketing, Perawat Gigi).`;
  const summary = await generateAiSolution(prompt);
  return res.json({ summary });
});
var api_default = api;

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);
  const distPath = path2.resolve(__dirname, "dist");
  const hasDist = fs2.existsSync(path2.resolve(distPath, "index.html"));
  const isProd = process.env.NODE_ENV === "production" || hasDist && process.env.NODE_ENV !== "development";
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(authMiddleware);
  app.use("/api", api_default);
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "GOC Team Management" });
  });
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path2.resolve(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} GOC Team Management server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
