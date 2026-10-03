/**
 * API Router for GOC Team Management
 * Express Endpoints with Granular Authorization & Validation
 */

import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import {
  db,
  verifyPassword,
  hashPassword,
  ALL_PERMISSIONS,
} from './db.ts';
import {
  createSession,
  removeSession,
  buildAuthSession,
  calculateUserPermissions,
  AuthenticatedRequest,
  requireAuth,
  requirePermission,
  requireOwner,
} from './auth.ts';
import {
  Employee,
  User,
  Task,
  Schedule,
  LeaveRequest,
  PayrollRecord,
  Announcement,
  OrganizationNode,
  EmployeeStatus,
  ForumChannel,
  ForumMessage,
  VideoMeeting,
} from '../types/index.ts';

const api = Router();

// ==========================================
// 1. AUTHENTICATION & SESSION ENDPOINTS
// ==========================================

api.post('/auth/login', (req, res) => {
  const { username, password, rememberMe } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username/Email dan Password wajib diisi.' });
  }

  const data = db.getData();
  const cleanUsername = String(username).trim().toLowerCase();

  // Find user by username or email
  const user = data.users.find(
    u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanUsername
  );

  if (!user) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  // Check account status
  if (user.status !== 'ACTIVE') {
    return res.status(403).json({
      error: `Akun Anda berstatus ${user.status}. Anda tidak dapat login. Silakan hubungi Owner/Super Admin.`,
    });
  }

  // Verify password
  const isValid = verifyPassword(password, user.password_hash, user.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  // Update last login
  user.last_login = new Date().toISOString();
  db.persist();

  // Create session
  const session = createSession(user);
  const authSession = buildAuthSession(user, session.token);

  // Audit log
  db.logAudit({
    userId: user.id,
    userName: authSession.user.full_name,
    action: 'USER_LOGIN',
    module: 'auth',
    targetType: 'user',
    targetId: user.id,
    description: `User ${user.username} (${authSession.user.full_name}) berhasil login.`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.json({
    message: 'Login berhasil.',
    session: authSession,
  });
});

api.post('/auth/register', (req, res) => {
  const { full_name, email, username, password, phone, department_id, position_id } = req.body;
  if (!full_name || !email || !username || !password) {
    return res.status(400).json({ error: 'Nama Lengkap, Email, Username, dan Password wajib diisi.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanUsername = String(username).trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');

  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username minimal 3 karakter (huruf, angka, titik, strip).' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter.' });
  }

  const data = db.getData();
  if (data.users.some(u => u.username.toLowerCase() === cleanUsername)) {
    return res.status(400).json({ error: `Username "${cleanUsername}" sudah digunakan. Silakan pilih username lain.` });
  }
  if (data.users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: `Email "${cleanEmail}" sudah terdaftar. Silakan login atau gunakan email lain.` });
  }

  const now = new Date().toISOString();
  const empId = `emp-${Date.now().toString(36)}`;
  const userId = `user-${Date.now().toString(36)}`;
  const empNumber = `GOC-${String(data.employees.length + 1).padStart(3, '0')}`;

  const passHash = hashPassword(password);

  const newUser: User = {
    id: userId,
    username: cleanUsername,
    email: cleanEmail,
    password_hash: passHash.hash,
    salt: passHash.salt,
    role_id: 'karyawan',
    employee_id: empId,
    status: 'ACTIVE',
    must_change_password: false,
    last_login: now,
    created_at: now,
    updated_at: now,
  };

  const newEmployee: Employee = {
    id: empId,
    user_id: userId,
    employee_number: empNumber,
    full_name: String(full_name).trim(),
    email: cleanEmail,
    phone: phone ? String(phone).trim() : '',
    department_id: department_id || (data.departments[0]?.id || 'dept-adm'),
    position_id: position_id || (data.positions[0]?.id || 'pos-fo'),
    manager_id: 'emp-002', // Default reporting to PJ Klinik drg. Ervina
    join_date: now.split('T')[0],
    exit_date: null,
    status: 'ACTIVE',
    photo: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    notes: 'Pendaftaran mandiri akun tim GOC.',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  data.users.push(newUser);
  data.employees.push(newEmployee);

  // Add to all-team forum channel
  const allTeamChan = data.forum_channels.find(c => c.id === 'channel-all-team');
  if (allTeamChan && !allTeamChan.member_ids.includes(userId)) {
    allTeamChan.member_ids.push(userId);
  }

  db.persist();

  // Create session
  const session = createSession(newUser);
  const authSession = buildAuthSession(newUser, session.token);

  // Audit log
  db.logAudit({
    userId: newUser.id,
    userName: newEmployee.full_name,
    action: 'USER_REGISTER',
    module: 'auth',
    targetType: 'user',
    targetId: newUser.id,
    description: `Pendaftaran akun baru: ${newUser.username} (${newEmployee.full_name}).`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  // Send Notification to Owner
  db.sendNotification({
    userId: 'user-001',
    title: 'Pendaftaran Akun Baru',
    message: `${newEmployee.full_name} (${cleanUsername}) baru saja mendaftar akun di GOC Team Management.`,
    type: 'SYSTEM',
    priority: 'NORMAL',
    link: '/team',
  });

  return res.status(201).json({
    message: 'Pendaftaran akun berhasil!',
    session: authSession,
  });
});

api.post('/auth/google', (req, res) => {
  const { email, name, picture, googleId } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Data email Google wajib disertakan.' });
  }

  const data = db.getData();
  const cleanEmail = String(email).trim().toLowerCase();
  let user = data.users.find(u => u.email.toLowerCase() === cleanEmail);
  const now = new Date().toISOString();

  if (user) {
    // Existing user: check status
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        error: `Akun Google Anda (${cleanEmail}) berstatus ${user.status}. Silakan hubungi Administrator.`,
      });
    }

    user.last_login = now;
    const emp = data.employees.find(e => e.id === user?.employee_id);
    if (emp && picture && (!emp.photo || emp.photo.includes('unsplash'))) {
      emp.photo = picture;
    }
    db.persist();

    const session = createSession(user);
    const authSession = buildAuthSession(user, session.token);

    db.logAudit({
      userId: user.id,
      userName: authSession.user.full_name,
      action: 'GOOGLE_LOGIN',
      module: 'auth',
      targetType: 'user',
      targetId: user.id,
      description: `User login menggunakan Google SSO (${cleanEmail}).`,
      ip: (req.headers['x-forwarded-for'] as string) || req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    return res.json({
      message: 'Login Google berhasil.',
      session: authSession,
    });
  } else {
    // New user via Google SSO: Auto-register
    const empId = `emp-${Date.now().toString(36)}`;
    const userId = `user-${Date.now().toString(36)}`;
    const empNumber = `GOC-${String(data.employees.length + 1).padStart(3, '0')}`;

    let baseUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9._-]/g, '');
    if (baseUsername.length < 3) baseUsername = `user_${baseUsername}`;
    let finalUsername = baseUsername;
    let counter = 1;
    while (data.users.some(u => u.username.toLowerCase() === finalUsername.toLowerCase())) {
      finalUsername = `${baseUsername}${counter++}`;
    }

    const passHash = hashPassword(crypto.randomBytes(16).toString('hex'));

    const newUser: User = {
      id: userId,
      username: finalUsername,
      email: cleanEmail,
      password_hash: passHash.hash,
      salt: passHash.salt,
      role_id: 'karyawan',
      employee_id: empId,
      status: 'ACTIVE',
      must_change_password: false,
      last_login: now,
      created_at: now,
      updated_at: now,
    };

    const newEmployee: Employee = {
      id: empId,
      user_id: userId,
      employee_number: empNumber,
      full_name: name || baseUsername,
      email: cleanEmail,
      phone: '',
      department_id: data.departments[0]?.id || 'dept-adm',
      position_id: data.positions[0]?.id || 'pos-fo',
      manager_id: 'emp-002',
      join_date: now.split('T')[0],
      exit_date: null,
      status: 'ACTIVE',
      photo: picture || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      notes: 'Pendaftaran otomatis via Google Sign-In.',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    data.users.push(newUser);
    data.employees.push(newEmployee);

    const allTeamChan = data.forum_channels.find(c => c.id === 'channel-all-team');
    if (allTeamChan && !allTeamChan.member_ids.includes(userId)) {
      allTeamChan.member_ids.push(userId);
    }

    db.persist();

    const session = createSession(newUser);
    const authSession = buildAuthSession(newUser, session.token);

    db.logAudit({
      userId: newUser.id,
      userName: newEmployee.full_name,
      action: 'GOOGLE_REGISTER',
      module: 'auth',
      targetType: 'user',
      targetId: newUser.id,
      description: `Akun baru terdaftar otomatis melalui Google SSO (${cleanEmail}).`,
      ip: (req.headers['x-forwarded-for'] as string) || req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    db.sendNotification({
      userId: 'user-001',
      title: 'Pendaftaran Akun Baru (Google)',
      message: `${newEmployee.full_name} (${cleanEmail}) baru saja mendaftar via Google Sign-In.`,
      type: 'SYSTEM',
      priority: 'NORMAL',
      link: '/team',
    });

    return res.status(201).json({
      message: 'Pendaftaran dan login via Google berhasil!',
      session: authSession,
    });
  }
});

api.post('/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.sessionToken) {
    removeSession(req.sessionToken);
  }

  if (req.user && req.employee) {
    db.logAudit({
      userId: req.user.id,
      userName: req.employee.full_name,
      action: 'USER_LOGOUT',
      module: 'auth',
      targetType: 'user',
      targetId: req.user.id,
      description: `User ${req.user.username} telah logout.`,
      ip: (req.headers['x-forwarded-for'] as string) || req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
  }

  return res.json({ message: 'Logout berhasil.' });
});

api.get('/auth/me', (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  let user = req.user;
  let token = req.sessionToken;

  if (!user) {
    user =
      data.users.find(u => u.role_id === 'owner' && u.status === 'ACTIVE') ||
      data.users.find(u => u.status === 'ACTIVE') ||
      data.users[0];
    if (user) {
      const s = createSession(user);
      token = s.token;
    }
  }

  if (!user) {
    return res.status(500).json({ error: 'Tidak ada data pengguna di database.' });
  }

  if (user.must_change_password) {
    user.must_change_password = false;
    db.persist();
  }

  const authSession = buildAuthSession(user, token || 'direct-access-token');
  return res.json({ session: authSession });
});

api.post('/auth/switch-account', (req: AuthenticatedRequest, res) => {
  const { userId } = req.body;
  const data = db.getData();
  const targetUser = data.users.find(
    u => u.id === userId || u.username.toLowerCase() === String(userId).toLowerCase()
  );

  if (!targetUser) {
    return res.status(404).json({ error: 'Akun tim tidak ditemukan.' });
  }

  const s = createSession(targetUser);
  const authSession = buildAuthSession(targetUser, s.token);

  db.logAudit({
    userId: targetUser.id,
    userName: authSession.user.full_name,
    action: 'SWITCH_ACCOUNT',
    module: 'auth',
    targetType: 'user',
    targetId: targetUser.id,
    description: `Beralih ke akun ${authSession.user.full_name} (${targetUser.username}).`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.json({
    message: `Beralih ke profil ${authSession.user.full_name}`,
    session: authSession,
  });
});

api.post('/auth/change-password', requireAuth, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Password saat ini dan password baru wajib diisi.' });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
  }

  const user = req.user!;
  const isValid = verifyPassword(currentPassword, user.password_hash, user.salt);
  if (!isValid) {
    return res.status(400).json({ error: 'Password saat ini salah.' });
  }

  const { hash, salt } = hashPassword(newPassword);
  user.password_hash = hash;
  user.salt = salt;
  user.must_change_password = false;
  user.updated_at = new Date().toISOString();
  db.persist();

  db.logAudit({
    userId: user.id,
    userName: req.employee?.full_name || user.username,
    action: 'CHANGE_PASSWORD',
    module: 'auth',
    targetType: 'user',
    targetId: user.id,
    description: `User ${user.username} mengubah password.`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.json({ message: 'Password berhasil diperbarui.' });
});

api.post('/auth/forgot-password', (req, res) => {
  const { emailOrUsername } = req.body;
  if (!emailOrUsername) {
    return res.status(400).json({ error: 'Email atau username wajib diisi.' });
  }

  const clean = String(emailOrUsername).trim().toLowerCase();
  const data = db.getData();
  const user = data.users.find(u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean);

  if (user) {
    // Notify Owner
    const ownerUser = data.users.find(u => u.role_id === 'owner');
    if (ownerUser) {
      db.sendNotification({
        userId: ownerUser.id,
        title: 'Permintaan Reset Password',
        message: `Karyawan (${user.username}) meminta bantuan reset password.`,
        type: 'SYSTEM',
        link: '/team',
      });
    }
  }

  return res.json({
    message: 'Jika akun terdaftar, permintaan reset password telah diteruskan kepada Administrator/Owner GOC.'
  });
});

// ==========================================
// 2. DASHBOARD METRICS & STATS
// ==========================================

api.get('/dashboard/stats', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const userId = req.user!.id;
  const empId = req.user!.employee_id;
  const isOwnerOrPJ = req.user!.role_id === 'owner' || req.user!.role_id === 'pj_klinik';

  // Overall stats
  const totalEmployees = data.employees.filter(e => !e.deleted_at).length;
  const activeEmployees = data.employees.filter(e => !e.deleted_at && e.status === 'ACTIVE').length;
  const inactiveEmployees = data.employees.filter(e => !e.deleted_at && e.status !== 'ACTIVE').length;

  const pendingLeave = data.leave_requests.filter(l => l.status === 'PENDING' && l.type === 'CUTI').length;
  const pendingPermission = data.leave_requests.filter(l => l.status === 'PENDING' && l.type !== 'CUTI').length;

  const activeTasks = data.tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS' || t.status === 'REVIEW').length;
  const completedTasks = data.tasks.filter(t => t.status === 'DONE').length;

  const activeAnnouncements = data.announcements.filter(a => a.status === 'PUBLISHED').length;

  // Personal stats for logged in employee
  const myTasks = data.tasks.filter(t => t.assigned_to === empId);
  const myActiveTasks = myTasks.filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED').length;
  const myLeaveRequests = data.leave_requests.filter(l => l.employee_id === empId);

  // Recent audit activities (visible for Owner / PJ or filtered)
  const recentActivities = isOwnerOrPJ
    ? data.audit_logs.slice(0, 10)
    : data.audit_logs.filter(a => a.user_id === userId).slice(0, 5);

  return res.json({
    stats: {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      pendingLeave,
      pendingPermission,
      activeTasks,
      completedTasks,
      activeAnnouncements,
    },
    personal: {
      myTotalTasks: myTasks.length,
      myActiveTasks,
      myLeaveTotal: myLeaveRequests.length,
    },
    recentActivities,
  });
});

// ==========================================
// 3. TEAM GOC (EMPLOYEES) CRUD & ACCESS
// ==========================================

api.get('/employees', requirePermission('team.view'), (req, res) => {
  const { search, department, position, status, includeDeleted } = req.query;
  const data = db.getData();

  let list = data.employees;

  // Filter soft deleted unless explicitly requested
  if (includeDeleted !== 'true') {
    list = list.filter(e => !e.deleted_at);
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(e =>
      e.full_name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.phone.includes(q) ||
      e.employee_number.toLowerCase().includes(q)
    );
  }

  if (department && department !== 'ALL') {
    list = list.filter(e => e.department_id === department);
  }

  if (position && position !== 'ALL') {
    list = list.filter(e => e.position_id === position);
  }

  if (status && status !== 'ALL') {
    list = list.filter(e => e.status === status);
  }

  // Populate relations
  const enriched = list.map(emp => {
    const dept = data.departments.find(d => d.id === emp.department_id);
    const pos = data.positions.find(p => p.id === emp.position_id);
    const mgr = emp.manager_id ? data.employees.find(m => m.id === emp.manager_id) : null;
    const usr = data.users.find(u => u.id === emp.user_id);
    const role = usr ? data.roles.find(r => r.id === usr.role_id) : undefined;

    return {
      ...emp,
      department: dept,
      position: pos,
      manager: mgr ? { id: mgr.id, full_name: mgr.full_name, position_name: data.positions.find(p => p.id === mgr.position_id)?.name } : null,
      user: usr ? {
        id: usr.id,
        username: usr.username,
        role_id: usr.role_id,
        role_name: role ? role.name : usr.role_id,
        status: usr.status,
      } : undefined,
    };
  });

  return res.json(enriched);
});

api.get('/employees/:id', requirePermission('team.view'), (req, res) => {
  const data = db.getData();
  const emp = data.employees.find(e => e.id === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: 'Karyawan tidak ditemukan.' });
  }

  const dept = data.departments.find(d => d.id === emp.department_id);
  const pos = data.positions.find(p => p.id === emp.position_id);
  const mgr = emp.manager_id ? data.employees.find(m => m.id === emp.manager_id) : null;
  const usr = data.users.find(u => u.id === emp.user_id);
  const role = usr ? data.roles.find(r => r.id === usr.role_id) : undefined;

  return res.json({
    ...emp,
    department: dept,
    position: pos,
    manager: mgr ? { id: mgr.id, full_name: mgr.full_name, position_name: data.positions.find(p => p.id === mgr.position_id)?.name } : null,
    user: usr ? {
      id: usr.id,
      username: usr.username,
      role_id: usr.role_id,
      role_name: role ? role.name : usr.role_id,
      status: usr.status,
    } : undefined,
  });
});

api.post('/employees', requirePermission('team.create'), (req: AuthenticatedRequest, res) => {
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
    notes,
  } = req.body;

  // Validation
  if (!full_name || !username || !email || !password || !department_id || !position_id) {
    return res.status(400).json({ error: 'Nama lengkap, username, email, password, divisi, dan jabatan wajib diisi.' });
  }

  const data = db.getData();
  const cleanUsername = String(username).trim().toLowerCase();
  const cleanEmail = String(email).trim().toLowerCase();

  // Check unique username & email
  if (data.users.some(u => u.username.toLowerCase() === cleanUsername)) {
    return res.status(400).json({ error: 'Username sudah digunakan. Pilih username lain.' });
  }
  if (data.users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: 'Email sudah terdaftar pada sistem.' });
  }

  const now = new Date().toISOString();
  const empId = `emp-${Date.now().toString(36)}`;
  const userId = `user-${Date.now().toString(36)}`;
  const empNumber = `GOC-${String(data.employees.length + 1).padStart(3, '0')}`;

  const { hash, salt } = hashPassword(password);

  const newUser: User = {
    id: userId,
    username: cleanUsername,
    email: cleanEmail,
    password_hash: hash,
    salt,
    role_id: role_id || 'karyawan',
    employee_id: empId,
    status: (status as EmployeeStatus) || 'ACTIVE',
    must_change_password: false,
    last_login: null,
    created_at: now,
    updated_at: now,
  };

  const newEmp: Employee = {
    id: empId,
    user_id: userId,
    employee_number: empNumber,
    full_name: String(full_name).trim(),
    email: cleanEmail,
    phone: phone ? String(phone).trim() : '',
    department_id,
    position_id,
    manager_id: manager_id || null,
    join_date: join_date || now.split('T')[0],
    exit_date: null,
    status: (status as EmployeeStatus) || 'ACTIVE',
    photo: photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    notes: notes || '',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  data.users.push(newUser);
  data.employees.push(newEmp);
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.employee?.full_name || req.user!.username,
    action: 'CREATE_EMPLOYEE',
    module: 'team',
    targetType: 'employee',
    targetId: empId,
    description: `Menambahkan karyawan baru: ${newEmp.full_name} (${newEmp.employee_number}) divisi ${department_id}.`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.status(201).json({
    message: 'Data karyawan berhasil ditambahkan.',
    employee: newEmp,
  });
});

api.put('/employees/:id', requirePermission('team.edit'), (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const emp = data.employees.find(e => e.id === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: 'Karyawan tidak ditemukan.' });
  }

  const user = data.users.find(u => u.id === emp.user_id);
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
    new_password,
  } = req.body;

  // Protect Owner: Owner status cannot be set to INACTIVE/RESIGNED/SUSPENDED
  if (user && user.role_id === 'owner' && status && status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Akun Owner/Super Admin tidak boleh dinonaktifkan.' });
  }

  const now = new Date().toISOString();

  if (full_name) emp.full_name = String(full_name).trim();
  if (phone !== undefined) emp.phone = String(phone).trim();
  if (department_id) emp.department_id = department_id;
  if (position_id) emp.position_id = position_id;
  if (manager_id !== undefined) emp.manager_id = manager_id;
  if (join_date) emp.join_date = join_date;
  if (photo !== undefined) emp.photo = photo;
  if (notes !== undefined) emp.notes = notes;

  if (email && email !== emp.email) {
    const cleanEmail = String(email).trim().toLowerCase();
    if (data.users.some(u => u.id !== user?.id && u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'Email sudah digunakan oleh user lain.' });
    }
    emp.email = cleanEmail;
    if (user) user.email = cleanEmail;
  }

  if (status && status !== emp.status) {
    emp.status = status as EmployeeStatus;
    if (user) user.status = status as EmployeeStatus;
    if (status === 'RESIGNED') {
      emp.exit_date = now.split('T')[0];
    }
  }

  // Safe password reset by Owner
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
    userId: req.user!.id,
    userName: req.employee?.full_name || req.user!.username,
    action: 'UPDATE_EMPLOYEE',
    module: 'team',
    targetType: 'employee',
    targetId: emp.id,
    description: `Memperbarui data karyawan ${emp.full_name}.`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.json({
    message: 'Data karyawan berhasil diperbarui.',
    employee: emp,
  });
});

api.patch('/employees/:id/status', requirePermission('team.activate'), (req: AuthenticatedRequest, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status wajib ditentukan.' });
  }

  const data = db.getData();
  const emp = data.employees.find(e => e.id === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: 'Karyawan tidak ditemukan.' });
  }

  const user = data.users.find(u => u.id === emp.user_id);
  if (user && user.role_id === 'owner') {
    return res.status(400).json({ error: 'Status Owner/Super Admin tidak dapat diubah.' });
  }

  const now = new Date().toISOString();
  emp.status = status as EmployeeStatus;
  if (status === 'RESIGNED') {
    emp.exit_date = now.split('T')[0];
  }
  if (user) {
    user.status = status as EmployeeStatus;
    user.updated_at = now;
  }
  emp.updated_at = now;
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.employee?.full_name || req.user!.username,
    action: status === 'ACTIVE' ? 'ACTIVATE_EMPLOYEE' : 'DEACTIVATE_EMPLOYEE',
    module: 'team',
    targetType: 'employee',
    targetId: emp.id,
    description: `Mengubah status karyawan ${emp.full_name} menjadi ${status}.`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.json({
    message: `Status karyawan berhasil diubah menjadi ${status}.`,
    employee: emp,
  });
});

api.delete('/employees/:id', requirePermission('team.delete'), (req: AuthenticatedRequest, res) => {
  const { permanent, ownerPassword, confirmName } = req.body;
  const data = db.getData();
  const emp = data.employees.find(e => e.id === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: 'Karyawan tidak ditemukan.' });
  }

  const user = data.users.find(u => u.id === emp.user_id);
  // Owner protection
  if (user && user.role_id === 'owner') {
    return res.status(403).json({ error: 'Akun Owner/Super Admin tidak dapat dihapus!' });
  }

  const now = new Date().toISOString();

  // If permanent delete requested
  if (permanent === true || permanent === 'true') {
    // Only owner can permanently delete
    if (req.user!.role_id !== 'owner') {
      return res.status(403).json({ error: 'Penghapusan permanen hanya diizinkan oleh Owner.' });
    }

    if (!ownerPassword || !confirmName) {
      return res.status(400).json({
        error: 'Untuk menghapus permanen, Anda wajib memasukkan password Owner dan nama lengkap karyawan.'
      });
    }

    // Verify Owner password
    const isOwnerPassValid = verifyPassword(ownerPassword, req.user!.password_hash, req.user!.salt);
    if (!isOwnerPassValid) {
      return res.status(400).json({ error: 'Password Owner salah. Penghapusan dibatalkan.' });
    }

    if (confirmName.trim().toLowerCase() !== emp.full_name.trim().toLowerCase()) {
      return res.status(400).json({ error: 'Nama konfirmasi tidak cocok dengan nama karyawan.' });
    }

    // Permanently remove
    data.employees = data.employees.filter(e => e.id !== emp.id);
    if (user) {
      data.users = data.users.filter(u => u.id !== user.id);
      data.user_permissions = data.user_permissions.filter(up => up.user_id !== user.id);
    }
    db.persist();

    db.logAudit({
      userId: req.user!.id,
      userName: req.employee?.full_name || req.user!.username,
      action: 'PERMANENT_DELETE_EMPLOYEE',
      module: 'team',
      targetType: 'employee',
      targetId: emp.id,
      description: `Menghapus PERMANEN karyawan: ${emp.full_name} (${emp.employee_number}).`,
      ip: (req.headers['x-forwarded-for'] as string) || req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    return res.json({ message: `Data karyawan ${emp.full_name} telah dihapus permanen.` });
  }

  // Soft delete (default)
  emp.deleted_at = now;
  emp.status = 'INACTIVE';
  if (user) {
    user.status = 'INACTIVE';
    user.updated_at = now;
  }
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.employee?.full_name || req.user!.username,
    action: 'SOFT_DELETE_EMPLOYEE',
    module: 'team',
    targetType: 'employee',
    targetId: emp.id,
    description: `Menonaktifkan / Soft Delete karyawan ${emp.full_name}. Data historis tetap tersimpan.`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.json({
    message: `Karyawan ${emp.full_name} berhasil dinonaktifkan (soft delete).`,
  });
});

// ==========================================
// 4. ORGANIZATION HIERARCHY
// ==========================================

api.get('/organization', requirePermission('organization.view'), (req, res) => {
  const data = db.getData();
  const activeEmps = data.employees.filter(e => !e.deleted_at && e.status === 'ACTIVE');

  // Find Root (Owner)
  const owner = activeEmps.find(e => {
    const usr = data.users.find(u => u.id === e.user_id);
    return usr?.role_id === 'owner' || e.manager_id === null;
  });

  if (!owner) {
    return res.json([]);
  }

  function buildNode(emp: Employee): OrganizationNode {
    const pos = data.positions.find(p => p.id === emp.position_id);
    const dept = data.departments.find(d => d.id === emp.department_id);
    const usr = data.users.find(u => u.id === emp.user_id);

    const directReports = activeEmps.filter(e => e.manager_id === emp.id);

    return {
      id: emp.id,
      full_name: emp.full_name,
      position_name: pos ? pos.name : '-',
      department_name: dept ? dept.name : '-',
      photo: emp.photo,
      phone: emp.phone,
      email: emp.email,
      role_id: usr ? usr.role_id : 'karyawan',
      children: directReports.map(report => buildNode(report)),
    };
  }

  const tree = [buildNode(owner)];
  return res.json(tree);
});

// ==========================================
// 5. MASTER DATA: DEPARTMENTS & POSITIONS
// ==========================================

api.get('/departments', requireAuth, (req, res) => {
  const data = db.getData();
  return res.json(data.departments);
});

api.post('/departments', requireOwner, (req: AuthenticatedRequest, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama divisi wajib diisi.' });

  const data = db.getData();
  const now = new Date().toISOString();
  const newDept = {
    id: `dept-${Date.now().toString(36)}`,
    name: String(name).trim(),
    description: description || '',
    status: 'ACTIVE' as const,
    created_at: now,
    updated_at: now,
  };
  data.departments.push(newDept);
  db.persist();

  return res.status(201).json(newDept);
});

api.put('/departments/:id', requireOwner, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const dept = data.departments.find(d => d.id === req.params.id);
  if (!dept) return res.status(404).json({ error: 'Divisi tidak ditemukan.' });

  const { name, description, status } = req.body;
  if (name) dept.name = name;
  if (description !== undefined) dept.description = description;
  if (status) dept.status = status;
  dept.updated_at = new Date().toISOString();
  db.persist();

  return res.json(dept);
});

api.get('/positions', requireAuth, (req, res) => {
  const data = db.getData();
  return res.json(data.positions);
});

api.post('/positions', requireOwner, (req: AuthenticatedRequest, res) => {
  const { name, department_id, description } = req.body;
  if (!name || !department_id) return res.status(400).json({ error: 'Nama jabatan dan divisi wajib diisi.' });

  const data = db.getData();
  const now = new Date().toISOString();
  const newPos = {
    id: `pos-${Date.now().toString(36)}`,
    name: String(name).trim(),
    department_id,
    description: description || '',
    status: 'ACTIVE' as const,
    created_at: now,
    updated_at: now,
  };
  data.positions.push(newPos);
  db.persist();

  return res.status(201).json(newPos);
});

api.get('/roles', requireAuth, (req, res) => {
  const data = db.getData();
  return res.json(data.roles);
});

// ==========================================
// 6. PERMISSIONS & ACCESS CONTROL MANAGEMENT
// ==========================================

api.get('/permissions', requireAuth, (req, res) => {
  return res.json(ALL_PERMISSIONS);
});

api.get('/users/:id/permissions', requirePermission('access.manage'), (req, res) => {
  const data = db.getData();
  const user = data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });

  const effectivePermissions = calculateUserPermissions(user.id);
  const userOverrides = data.user_permissions.filter(up => up.user_id === user.id);
  const rolePermissions = data.role_permissions
    .filter(rp => rp.role_id === user.role_id)
    .map(rp => rp.permission_id);

  return res.json({
    userId: user.id,
    roleId: user.role_id,
    isOwner: user.role_id === 'owner',
    effectivePermissions,
    rolePermissions,
    customOverrides: userOverrides,
  });
});

api.put('/users/:id/permissions', requirePermission('access.manage'), (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const targetUser = data.users.find(u => u.id === req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'User tidak ditemukan.' });

  // Super Admin rule: Owner cannot lose Super Admin permissions
  if (targetUser.role_id === 'owner') {
    return res.status(400).json({
      error: 'Owner / Super Admin memiliki seluruh hak akses secara permanen dan tidak dapat dikurangi.',
    });
  }

  const { grantedPermissions } = req.body; // array of permission IDs that should be granted
  if (!Array.isArray(grantedPermissions)) {
    return res.status(400).json({ error: 'Format data permissions tidak valid.' });
  }

  // Remove existing overrides for this user
  data.user_permissions = data.user_permissions.filter(up => up.user_id !== targetUser.id);

  // Get base permissions from role
  const rolePerms = data.role_permissions
    .filter(rp => rp.role_id === targetUser.role_id)
    .map(rp => rp.permission_id);

  const rolePermSet = new Set(rolePerms);
  const requestedSet = new Set(grantedPermissions);

  // Add explicit ALLOW for permissions not in role but in granted
  grantedPermissions.forEach(pId => {
    if (!rolePermSet.has(pId)) {
      data.user_permissions.push({
        id: `up-${targetUser.id}-${pId}`,
        user_id: targetUser.id,
        permission_id: pId,
        allowed: true,
      });
    }
  });

  // Add explicit DENY for permissions in role but NOT in granted
  rolePerms.forEach(pId => {
    if (!requestedSet.has(pId)) {
      data.user_permissions.push({
        id: `up-${targetUser.id}-${pId}`,
        user_id: targetUser.id,
        permission_id: pId,
        allowed: false,
      });
    }
  });

  db.persist();

  const targetEmp = data.employees.find(e => e.id === targetUser.employee_id);
  db.logAudit({
    userId: req.user!.id,
    userName: req.employee?.full_name || req.user!.username,
    action: 'CHANGE_PERMISSION',
    module: 'access',
    targetType: 'user',
    targetId: targetUser.id,
    description: `Memperbarui hak akses custom untuk ${targetEmp?.full_name || targetUser.username} (${grantedPermissions.length} permissions aktif).`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  // Notify target user
  db.sendNotification({
    userId: targetUser.id,
    title: 'Hak Akses Diperbarui',
    message: 'Hak akses akun Anda telah disesuaikan oleh administrator.',
    type: 'ACCESS',
  });

  return res.json({
    message: 'Hak akses berhasil disimpan.',
    effectivePermissions: calculateUserPermissions(targetUser.id),
  });
});

// ==========================================
// 7. TASKS MANAGEMENT
// ==========================================

api.get('/tasks', requirePermission('task.view'), (req: AuthenticatedRequest, res) => {
  const { status, priority, assignee } = req.query;
  const data = db.getData();

  let list = data.tasks;

  // If normal employee without management permission, can view tasks assigned to them or created by them
  const canManageAll = req.permissions?.includes('task.edit') || req.user?.role_id === 'owner';
  if (!canManageAll) {
    list = list.filter(t => t.assigned_to === req.user?.employee_id || t.created_by === req.user?.id);
  }

  if (status && status !== 'ALL') {
    list = list.filter(t => t.status === status);
  }
  if (priority && priority !== 'ALL') {
    list = list.filter(t => t.priority === priority);
  }
  if (assignee && assignee !== 'ALL') {
    list = list.filter(t => t.assigned_to === assignee);
  }

  const enriched = list.map(t => {
    const assignedEmp = data.employees.find(e => e.id === t.assigned_to);
    const creatorUser = data.users.find(u => u.id === t.created_by);
    const creatorEmp = creatorUser ? data.employees.find(e => e.id === creatorUser.employee_id) : null;
    const commentsCount = data.task_comments.filter(c => c.task_id === t.id).length;

    return {
      ...t,
      assignee_name: assignedEmp ? assignedEmp.full_name : 'Belum ditugaskan',
      assignee_photo: assignedEmp ? assignedEmp.photo : '',
      creator_name: creatorEmp ? creatorEmp.full_name : (creatorUser ? creatorUser.username : 'Sistem'),
      comments_count: commentsCount,
    };
  });

  return res.json(enriched);
});

api.post('/tasks', requirePermission('task.create'), (req: AuthenticatedRequest, res) => {
  const { title, description, assigned_to, priority, deadline, attachment_name } = req.body;
  if (!title || !assigned_to || !deadline) {
    return res.status(400).json({ error: 'Judul tugas, penerima tugas (assignee), dan deadline wajib diisi.' });
  }

  const data = db.getData();
  const now = new Date().toISOString();
  const newTask: Task = {
    id: `task-${Date.now().toString(36)}`,
    title: String(title).trim(),
    description: description || '',
    assigned_to,
    created_by: req.user!.id,
    priority: priority || 'MEDIUM',
    deadline,
    status: 'TODO',
    attachment_name: attachment_name || null,
    created_at: now,
    updated_at: now,
  };

  data.tasks.unshift(newTask);
  db.persist();

  // Notify assignee
  const assignedEmp = data.employees.find(e => e.id === assigned_to);
  if (assignedEmp) {
    db.sendNotification({
      userId: assignedEmp.user_id,
      title: 'Tugas Baru Diterima',
      message: `Anda ditugaskan tugas baru: "${newTask.title}" (Batas Waktu: ${newTask.deadline})`,
      type: 'TASK',
      priority: newTask.priority === 'URGENT' ? 'URGENT' : newTask.priority === 'HIGH' ? 'HIGH' : 'NORMAL',
      link: '/tasks',
      metadata: { taskId: newTask.id, dueDate: newTask.deadline },
    });
  }

  db.logAudit({
    userId: req.user!.id,
    userName: req.employee?.full_name || req.user!.username,
    action: 'CREATE_TASK',
    module: 'task',
    targetType: 'task',
    targetId: newTask.id,
    description: `Membuat tugas baru: "${newTask.title}" untuk ${assignedEmp?.full_name || assigned_to}.`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.status(201).json(newTask);
});

api.put('/tasks/:id', requirePermission('task.update'), (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const task = data.tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Tugas tidak ditemukan.' });

  const isAssignee = task.assigned_to === req.user?.employee_id;
  const canEditDetails = req.permissions?.includes('task.edit') || req.user?.role_id === 'owner' || task.created_by === req.user?.id;

  const { title, description, assigned_to, priority, deadline, status, attachment_name } = req.body;
  const now = new Date().toISOString();

  // If user can only update status (karyawan)
  if (!canEditDetails && isAssignee) {
    if (status) task.status = status;
    task.updated_at = now;
    db.persist();
    return res.json(task);
  }

  if (canEditDetails) {
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assigned_to) task.assigned_to = assigned_to;
    if (priority) task.priority = priority;
    if (deadline) task.deadline = deadline;
    if (status) task.status = status;
    if (attachment_name !== undefined) task.attachment_name = attachment_name;
    task.updated_at = now;
    db.persist();
    return res.json(task);
  }

  return res.status(403).json({ error: 'Anda tidak mempunyai hak untuk mengubah tugas ini.' });
});

api.delete('/tasks/:id', requirePermission('task.delete'), (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const idx = data.tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Tugas tidak ditemukan.' });

  const deleted = data.tasks.splice(idx, 1)[0];
  data.task_comments = data.task_comments.filter(c => c.task_id !== req.params.id);
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.employee?.full_name || req.user!.username,
    action: 'DELETE_TASK',
    module: 'task',
    targetType: 'task',
    targetId: deleted.id,
    description: `Menghapus tugas: "${deleted.title}".`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.json({ message: 'Tugas berhasil dihapus.' });
});

api.get('/tasks/:id/comments', requirePermission('task.view'), (req, res) => {
  const data = db.getData();
  const comments = data.task_comments.filter(c => c.task_id === req.params.id);
  return res.json(comments);
});

api.post('/tasks/:id/comments', requirePermission('task.view'), (req: AuthenticatedRequest, res) => {
  const { comment } = req.body;
  if (!comment || !String(comment).trim()) {
    return res.status(400).json({ error: 'Komentar tidak boleh kosong.' });
  }

  const data = db.getData();
  const newComment = {
    id: `tc-${Date.now().toString(36)}`,
    task_id: req.params.id,
    user_id: req.user!.id,
    user_name: req.employee?.full_name || req.user!.username,
    comment: String(comment).trim(),
    created_at: new Date().toISOString(),
  };

  data.task_comments.push(newComment);
  db.persist();

  return res.status(201).json(newComment);
});

// ==========================================
// 8. SCHEDULES & CALENDAR
// ==========================================

api.get('/schedules', requirePermission('schedule.view'), (req, res) => {
  const { month, year, type } = req.query;
  const data = db.getData();

  let list = data.schedules;
  if (type && type !== 'ALL') {
    list = list.filter(s => s.type === type);
  }

  const enriched = list.map(s => {
    const assignedStaff = data.employees.filter(e => s.user_ids.includes(e.id)).map(e => ({
      id: e.id,
      name: e.full_name,
      photo: e.photo,
    }));
    return {
      ...s,
      assignedStaff,
    };
  });

  return res.json(enriched);
});

api.post('/schedules', requirePermission('schedule.create'), (req: AuthenticatedRequest, res) => {
  const { title, type, start_date, end_date, start_time, end_time, user_ids, notes } = req.body;
  if (!title || !start_date || !type) {
    return res.status(400).json({ error: 'Judul, tipe jadwal, dan tanggal mulai wajib diisi.' });
  }

  const data = db.getData();
  const newSchedule: Schedule = {
    id: `sch-${Date.now().toString(36)}`,
    title: String(title).trim(),
    type: type || 'SHIFT',
    start_date,
    end_date: end_date || start_date,
    start_time: start_time || '08:00',
    end_time: end_time || '17:00',
    user_ids: Array.isArray(user_ids) ? user_ids : [],
    notes: notes || '',
    created_by: req.user!.id,
    created_at: new Date().toISOString(),
  };

  data.schedules.unshift(newSchedule);
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.employee?.full_name || req.user!.username,
    action: 'CREATE_SCHEDULE',
    module: 'schedule',
    targetType: 'schedule',
    targetId: newSchedule.id,
    description: `Membuat jadwal ${newSchedule.type}: "${newSchedule.title}" tanggal ${newSchedule.start_date}.`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.status(201).json(newSchedule);
});

api.delete('/schedules/:id', requirePermission('schedule.delete'), (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const idx = data.schedules.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });

  const deleted = data.schedules.splice(idx, 1)[0];
  db.persist();

  return res.json({ message: 'Jadwal berhasil dihapus.' });
});

// ==========================================
// 9. LEAVE & PERMISSIONS (CUTI & IZIN)
// ==========================================

api.get('/leave', requirePermission('leave.view'), (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const canApprove = req.permissions?.includes('leave.approve') || req.user?.role_id === 'owner';

  let list = data.leave_requests;
  // If cannot approve, only see own leaves
  if (!canApprove) {
    list = list.filter(l => l.employee_id === req.user?.employee_id);
  }

  const enriched = list.map(l => {
    const emp = data.employees.find(e => e.id === l.employee_id);
    const approver = l.approved_by ? data.users.find(u => u.id === l.approved_by) : null;
    const approverEmp = approver ? data.employees.find(e => e.id === approver.employee_id) : null;

    return {
      ...l,
      employee_name: emp ? emp.full_name : 'Karyawan',
      employee_photo: emp ? emp.photo : '',
      department_name: emp ? data.departments.find(d => d.id === emp.department_id)?.name : '-',
      approver_name: approverEmp ? approverEmp.full_name : (approver ? approver.username : null),
    };
  });

  return res.json(enriched);
});

api.post('/leave', requirePermission('leave.create'), (req: AuthenticatedRequest, res) => {
  const { type, start_date, end_date, total_days, reason, attachment_name } = req.body;
  if (!type || !start_date || !end_date || !reason) {
    return res.status(400).json({ error: 'Jenis pengajuan, tanggal mulai, tanggal selesai, dan alasan wajib diisi.' });
  }

  const data = db.getData();
  const now = new Date().toISOString();
  const newLeave: LeaveRequest = {
    id: `leave-${Date.now().toString(36)}`,
    employee_id: req.user!.employee_id,
    type,
    start_date,
    end_date,
    total_days: Number(total_days) || 1,
    reason: String(reason).trim(),
    attachment_name: attachment_name || null,
    status: 'PENDING',
    approved_by: null,
    approval_notes: null,
    created_at: now,
    updated_at: now,
  };

  data.leave_requests.unshift(newLeave);
  db.persist();

  // Notify Owner & PJ Klinik
  const leaders = data.users.filter(u => u.role_id === 'owner' || u.role_id === 'pj_klinik');
  leaders.forEach(leader => {
    db.sendNotification({
      userId: leader.id,
      title: 'Pengajuan Cuti / Izin Baru',
      message: `${req.employee?.full_name || 'Karyawan'} mengajukan ${type} (${newLeave.start_date} s/d ${newLeave.end_date}).`,
      type: 'LEAVE',
      link: '/leave',
    });
  });

  db.logAudit({
    userId: req.user!.id,
    userName: req.employee?.full_name || req.user!.username,
    action: 'SUBMIT_LEAVE',
    module: 'leave',
    targetType: 'leave_request',
    targetId: newLeave.id,
    description: `Mengajukan ${type} selama ${newLeave.total_days} hari (${newLeave.start_date} s/d ${newLeave.end_date}). Alasan: ${newLeave.reason}.`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.status(201).json(newLeave);
});

api.put('/leave/:id/approve', requirePermission('leave.approve'), (req: AuthenticatedRequest, res) => {
  const { notes } = req.body;
  const data = db.getData();
  const leave = data.leave_requests.find(l => l.id === req.params.id);
  if (!leave) return res.status(404).json({ error: 'Pengajuan cuti tidak ditemukan.' });

  leave.status = 'APPROVED';
  leave.approved_by = req.user!.id;
  leave.approval_notes = notes || 'Disetujui.';
  leave.updated_at = new Date().toISOString();
  db.persist();

  // Notify employee
  const emp = data.employees.find(e => e.id === leave.employee_id);
  if (emp) {
    db.sendNotification({
      userId: emp.user_id,
      title: 'Pengajuan Cuti Disetujui',
      message: `Pengajuan ${leave.type} Anda tanggal ${leave.start_date} telah DISETUJUI.`,
      type: 'LEAVE',
      link: '/leave',
    });
  }

  db.logAudit({
    userId: req.user!.id,
    userName: req.employee?.full_name || req.user!.username,
    action: 'APPROVE_LEAVE',
    module: 'leave',
    targetType: 'leave_request',
    targetId: leave.id,
    description: `Menyetujui pengajuan ${leave.type} untuk ${emp?.full_name}. Catatan: ${leave.approval_notes}`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.json({ message: 'Pengajuan cuti berhasil disetujui.', leave });
});

api.put('/leave/:id/reject', requirePermission('leave.reject'), (req: AuthenticatedRequest, res) => {
  const { notes } = req.body;
  if (!notes) return res.status(400).json({ error: 'Alasan penolakan wajib dicantumkan.' });

  const data = db.getData();
  const leave = data.leave_requests.find(l => l.id === req.params.id);
  if (!leave) return res.status(404).json({ error: 'Pengajuan cuti tidak ditemukan.' });

  leave.status = 'REJECTED';
  leave.approved_by = req.user!.id;
  leave.approval_notes = notes;
  leave.updated_at = new Date().toISOString();
  db.persist();

  // Notify employee
  const emp = data.employees.find(e => e.id === leave.employee_id);
  if (emp) {
    db.sendNotification({
      userId: emp.user_id,
      title: 'Pengajuan Cuti Ditolak',
      message: `Pengajuan ${leave.type} Anda ditolak. Alasan: ${notes}`,
      type: 'LEAVE',
      link: '/leave',
    });
  }

  db.logAudit({
    userId: req.user!.id,
    userName: req.employee?.full_name || req.user!.username,
    action: 'REJECT_LEAVE',
    module: 'leave',
    targetType: 'leave_request',
    targetId: leave.id,
    description: `Menolak pengajuan ${leave.type} untuk ${emp?.full_name}. Alasan: ${notes}`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.json({ message: 'Pengajuan cuti ditolak.', leave });
});

// ==========================================
// 10. PAYROLL MANAGEMENT (HIGH SECURITY)
// ==========================================

api.get('/payroll', requirePermission('payroll.view'), (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const isOwner = req.user?.role_id === 'owner';

  // Privacy Rule:
  // Data payroll Owner harus dapat dibuat sebagai data terbatas / private.
  // Jangan tampilkan payroll kepada karyawan lain.
  let list = data.payroll;
  if (!isOwner) {
    // Hide private payroll (e.g. Owner salary) from non-owners even if they have payroll.view!
    list = list.filter(p => !p.is_private);
  }

  const enriched = list.map(p => {
    const emp = data.employees.find(e => e.id === p.employee_id);
    const dept = emp ? data.departments.find(d => d.id === emp.department_id) : null;
    const pos = emp ? data.positions.find(pos => pos.id === emp.position_id) : null;

    return {
      ...p,
      employee_name: emp ? emp.full_name : 'Karyawan',
      employee_number: emp ? emp.employee_number : '-',
      department_name: dept ? dept.name : '-',
      position_name: pos ? pos.name : '-',
    };
  });

  return res.json(enriched);
});

api.post('/payroll', requirePermission('payroll.create'), (req: AuthenticatedRequest, res) => {
  const { employee_id, period, base_salary, allowance, bonus, deduction, notes, is_private } = req.body;
  if (!employee_id || !period || base_salary === undefined) {
    return res.status(400).json({ error: 'Karyawan, periode, dan gaji pokok wajib diisi.' });
  }

  const base = Number(base_salary) || 0;
  const allow = Number(allowance) || 0;
  const bon = Number(bonus) || 0;
  const ded = Number(deduction) || 0;
  const total = base + allow + bon - ded;

  const data = db.getData();
  const now = new Date().toISOString();

  // If this employee is owner, auto mark private
  const targetEmp = data.employees.find(e => e.id === employee_id);
  const targetUser = targetEmp ? data.users.find(u => u.id === targetEmp.user_id) : null;
  const shouldBePrivate = targetUser?.role_id === 'owner' ? true : Boolean(is_private);

  const newPayroll: PayrollRecord = {
    id: `pay-${Date.now().toString(36)}`,
    employee_id,
    period,
    base_salary: base,
    allowance: allow,
    bonus: bon,
    deduction: ded,
    total_salary: total,
    payment_status: 'DRAFT',
    payment_date: null,
    notes: notes || '',
    is_private: shouldBePrivate,
    created_by: req.user!.id,
    created_at: now,
    updated_at: now,
  };

  data.payroll.unshift(newPayroll);
  db.persist();

  // Send notification to employee
  if (targetUser && targetUser.id !== req.user!.id) {
    db.sendNotification({
      userId: targetUser.id,
      title: 'Pembaruan Payroll',
      message: `Slip gaji Anda periode ${newPayroll.period} telah diterbitkan dengan status ${newPayroll.payment_status}. Total Net: Rp ${newPayroll.total_salary.toLocaleString('id-ID')}.`,
      type: 'PAYROLL',
      priority: 'NORMAL',
      link: '/payroll',
      metadata: { payrollId: newPayroll.id, amount: newPayroll.total_salary, status: newPayroll.payment_status },
    });
  }

  db.logAudit({
    userId: req.user!.id,
    userName: req.employee?.full_name || req.user!.username,
    action: 'CREATE_PAYROLL',
    module: 'payroll',
    targetType: 'payroll',
    targetId: newPayroll.id,
    description: `Membuat data slip gaji periode ${period} untuk ${targetEmp?.full_name}. Total: Rp ${total.toLocaleString('id-ID')}.`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.status(201).json(newPayroll);
});

api.put('/payroll/:id', requirePermission('payroll.edit'), (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const payroll = data.payroll.find(p => p.id === req.params.id);
  if (!payroll) return res.status(404).json({ error: 'Data payroll tidak ditemukan.' });

  // If payroll is private and caller is not owner
  if (payroll.is_private && req.user?.role_id !== 'owner') {
    return res.status(403).json({ error: 'Data payroll ini bersifat rahasia dan hanya dapat diubah oleh Owner.' });
  }

  const { base_salary, allowance, bonus, deduction, payment_status, payment_date, notes } = req.body;
  if (base_salary !== undefined) payroll.base_salary = Number(base_salary);
  if (allowance !== undefined) payroll.allowance = Number(allowance);
  if (bonus !== undefined) payroll.bonus = Number(bonus);
  if (deduction !== undefined) payroll.deduction = Number(deduction);
  payroll.total_salary = payroll.base_salary + payroll.allowance + payroll.bonus - payroll.deduction;

  const previousStatus = payroll.payment_status;
  if (payment_status) payroll.payment_status = payment_status;
  if (payment_date !== undefined) payroll.payment_date = payment_date;
  if (notes !== undefined) payroll.notes = notes;
  payroll.updated_at = new Date().toISOString();
  db.persist();

  const emp = data.employees.find(e => e.id === payroll.employee_id);
  const targetUser = emp ? data.users.find(u => u.id === emp.user_id) : null;

  // Send notification on payroll update to employee
  if (targetUser && targetUser.id !== req.user!.id) {
    const isPaid = payroll.payment_status === 'PAID';
    db.sendNotification({
      userId: targetUser.id,
      title: isPaid ? 'Gaji Telah Ditransfer (PAID)' : 'Pembaruan Status Payroll',
      message: `Status gaji Anda periode ${payroll.period} sebesar Rp ${payroll.total_salary.toLocaleString('id-ID')} ${
        isPaid
          ? 'telah berhasil DIBAYARKAN / DITRANSFER (PAID).'
          : `diperbarui menjadi ${payroll.payment_status}.`
      }`,
      type: 'PAYROLL',
      priority: isPaid ? 'HIGH' : 'NORMAL',
      link: '/payroll',
      metadata: { payrollId: payroll.id, amount: payroll.total_salary, status: payroll.payment_status },
    });
  }

  db.logAudit({
    userId: req.user!.id,
    userName: req.employee?.full_name || req.user!.username,
    action: 'UPDATE_PAYROLL',
    module: 'payroll',
    targetType: 'payroll',
    targetId: payroll.id,
    description: `Memperbarui payroll periode ${payroll.period} untuk ${emp?.full_name}. Status: ${payroll.payment_status}.`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.json({ message: 'Data payroll berhasil diperbarui.', payroll });
});

api.delete('/payroll/:id', requirePermission('payroll.delete'), (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const idx = data.payroll.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Data payroll tidak ditemukan.' });

  const p = data.payroll[idx];
  if (p.is_private && req.user?.role_id !== 'owner') {
    return res.status(403).json({ error: 'Data payroll privat hanya dapat dihapus oleh Owner.' });
  }

  data.payroll.splice(idx, 1);
  db.persist();

  return res.json({ message: 'Data payroll berhasil dihapus.' });
});

// ==========================================
// 11. REPORTS & EXPORT
// ==========================================

api.get('/reports', requirePermission('report.view'), (req, res) => {
  const { type, department, status, startDate, endDate } = req.query;
  const data = db.getData();

  const totalEmployees = data.employees.filter(e => !e.deleted_at).length;
  const employeesByDept = data.departments.map(d => ({
    department: d.name,
    count: data.employees.filter(e => !e.deleted_at && e.department_id === d.id).length,
  }));

  const leaveSummary = {
    total: data.leave_requests.length,
    approved: data.leave_requests.filter(l => l.status === 'APPROVED').length,
    pending: data.leave_requests.filter(l => l.status === 'PENDING').length,
    rejected: data.leave_requests.filter(l => l.status === 'REJECTED').length,
  };

  const taskSummary = {
    total: data.tasks.length,
    done: data.tasks.filter(t => t.status === 'DONE').length,
    in_progress: data.tasks.filter(t => t.status === 'IN_PROGRESS').length,
    todo: data.tasks.filter(t => t.status === 'TODO').length,
  };

  const payrollSummary = {
    totalPayrollPaid: data.payroll
      .filter(p => p.payment_status === 'PAID')
      .reduce((acc, curr) => acc + curr.total_salary, 0),
    totalPayrollDraft: data.payroll
      .filter(p => p.payment_status !== 'PAID')
      .reduce((acc, curr) => acc + curr.total_salary, 0),
  };

  return res.json({
    totalEmployees,
    employeesByDept,
    leaveSummary,
    taskSummary,
    payrollSummary,
  });
});

// ==========================================
// 12. ANNOUNCEMENTS
// ==========================================

api.get('/announcements', requirePermission('announcement.view'), (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const userDept = req.employee?.department_id;
  const userEmpId = req.user?.employee_id;
  const isManager = req.user?.role_id === 'owner' || req.user?.role_id === 'pj_klinik';

  let list = data.announcements;

  // Filter based on target if not manager
  if (!isManager) {
    list = list.filter(a =>
      a.status === 'PUBLISHED' &&
      (a.target_type === 'ALL' ||
        (a.target_type === 'DEPARTMENT' && a.target_id === userDept) ||
        (a.target_type === 'EMPLOYEE' && a.target_id === userEmpId))
    );
  }

  return res.json(list);
});

api.post('/announcements', requirePermission('announcement.create'), (req: AuthenticatedRequest, res) => {
  const { title, content, target_type, target_id, status } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Judul dan isi pengumuman wajib diisi.' });
  }

  const data = db.getData();
  const now = new Date().toISOString();
  const newAnc: Announcement = {
    id: `anc-${Date.now().toString(36)}`,
    title: String(title).trim(),
    content: String(content).trim(),
    target_type: target_type || 'ALL',
    target_id: target_id || null,
    publish_date: now.split('T')[0],
    status: status || 'PUBLISHED',
    author_id: req.user!.id,
    author_name: req.employee?.full_name || req.user!.username,
    created_at: now,
    updated_at: now,
  };

  data.announcements.unshift(newAnc);
  db.persist();

  // Send notifications to audience
  const recipients = data.users.filter(u => u.id !== req.user!.id && u.status === 'ACTIVE');
  recipients.forEach(r => {
    db.sendNotification({
      userId: r.id,
      title: 'Pengumuman Baru Klinik',
      message: newAnc.title,
      type: 'ANNOUNCEMENT',
      link: '/announcements',
    });
  });

  return res.status(201).json(newAnc);
});

api.delete('/announcements/:id', requirePermission('announcement.delete'), (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const idx = data.announcements.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Pengumuman tidak ditemukan.' });

  data.announcements.splice(idx, 1);
  db.persist();

  return res.json({ message: 'Pengumuman berhasil dihapus.' });
});

// ==========================================
// 13. AUDIT LOGS
// ==========================================

api.get('/audit-logs', requirePermission('audit.view'), (req, res) => {
  const { module, action, search } = req.query;
  const data = db.getData();

  let list = data.audit_logs;
  if (module && module !== 'ALL') {
    list = list.filter(l => l.module === module);
  }
  if (action && action !== 'ALL') {
    list = list.filter(l => l.action === action);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(l =>
      l.user_name.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q)
    );
  }

  return res.json(list.slice(0, 100));
});

// ==========================================
// 14. CENTRALIZED NOTIFICATION SYSTEM
// ==========================================

// Automated deadline reminder generator
function checkAndGenerateDeadlineReminders() {
  const data = db.getData();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const todayTime = new Date(todayStr).getTime();

  const activeTasks = data.tasks.filter(
    t => t.status === 'TODO' || t.status === 'IN_PROGRESS' || t.status === 'REVIEW'
  );

  for (const task of activeTasks) {
    if (!task.assigned_to || !task.deadline) continue;
    const emp = data.employees.find(e => e.id === task.assigned_to);
    if (!emp || !emp.user_id) continue;

    const deadlineTime = new Date(task.deadline).getTime();
    const diffDays = Math.ceil((deadlineTime - todayTime) / (1000 * 60 * 60 * 24));

    // Send reminder if task deadline is within 3 days or overdue
    if (diffDays <= 3) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const alreadySent = data.notifications.some(
        n =>
          n.user_id === emp.user_id &&
          n.type === 'DEADLINE' &&
          n.metadata?.taskId === task.id &&
          n.created_at > oneDayAgo
      );

      if (!alreadySent) {
        let dueText = '';
        let priority: 'NORMAL' | 'HIGH' | 'URGENT' = 'HIGH';
        if (diffDays < 0) {
          dueText = `telah melewati batas waktu ${Math.abs(diffDays)} hari yang lalu`;
          priority = 'URGENT';
        } else if (diffDays === 0) {
          dueText = 'jatuh tempo HARI INI';
          priority = 'URGENT';
        } else if (diffDays === 1) {
          dueText = 'jatuh tempo BESOK';
          priority = 'HIGH';
        } else {
          dueText = `jatuh tempo dalam ${diffDays} hari (${task.deadline})`;
          priority = 'HIGH';
        }

        db.sendNotification({
          userId: emp.user_id,
          title: 'Peringatan Deadline Tugas',
          message: `Tugas "${task.title}" ${dueText}. Segera periksa dan perbarui status pengerjaan Anda.`,
          type: 'DEADLINE',
          priority,
          link: '/tasks',
          metadata: { taskId: task.id, dueDate: task.deadline },
        });
      }
    }
  }
}

api.get('/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  // Check and create deadline reminders dynamically
  checkAndGenerateDeadlineReminders();

  const { type, unreadOnly } = req.query;
  const data = db.getData();
  const userId = req.user!.id;

  let userNotifs = data.notifications.filter(n => n.user_id === userId);

  // Stats calculation
  const totalCount = userNotifs.length;
  const unreadCount = userNotifs.filter(n => !n.read).length;
  const taskCount = userNotifs.filter(n => n.type === 'TASK').length;
  const deadlineCount = userNotifs.filter(n => n.type === 'DEADLINE').length;
  const leaveCount = userNotifs.filter(n => n.type === 'LEAVE').length;
  const payrollCount = userNotifs.filter(n => n.type === 'PAYROLL').length;

  if (type && type !== 'ALL') {
    userNotifs = userNotifs.filter(n => n.type === type);
  }
  if (unreadOnly === 'true') {
    userNotifs = userNotifs.filter(n => !n.read);
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
      payroll: payrollCount,
    },
  });
});

api.post('/notifications/check-deadlines', requireAuth, (req: AuthenticatedRequest, res) => {
  checkAndGenerateDeadlineReminders();
  return res.json({ success: true, message: 'Pengecekan deadline selesai dijalankan.' });
});

api.patch('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const notif = data.notifications.find(n => n.id === req.params.id && n.user_id === req.user!.id);
  if (notif) {
    notif.read = true;
    db.persist();
  }
  return res.json({ success: true });
});

api.patch('/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  data.notifications.forEach(n => {
    if (n.user_id === req.user!.id) {
      n.read = true;
    }
  });
  db.persist();
  return res.json({ success: true });
});

api.delete('/notifications/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const idx = data.notifications.findIndex(n => n.id === req.params.id && n.user_id === req.user!.id);
  if (idx !== -1) {
    data.notifications.splice(idx, 1);
    db.persist();
  }
  return res.json({ success: true, message: 'Notifikasi berhasil dihapus.' });
});

api.delete('/notifications/clear-all', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  data.notifications = data.notifications.filter(
    n => !(n.user_id === req.user!.id && n.read)
  );
  db.persist();
  return res.json({ success: true, message: 'Semua notifikasi yang telah dibaca berhasil dibersihkan.' });
});

// ==========================================
// 15. SETTINGS
// ==========================================

api.get('/settings', requireAuth, (req, res) => {
  const data = db.getData();
  return res.json(data.settings);
});

api.put('/settings', requirePermission('settings.edit'), (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const { clinic_name, app_name, timezone, date_format, allow_notifications, session_timeout_minutes, require_strong_password } = req.body;

  if (clinic_name) data.settings.clinic_name = clinic_name;
  if (app_name) data.settings.app_name = app_name;
  if (timezone) data.settings.timezone = timezone;
  if (date_format) data.settings.date_format = date_format;
  if (allow_notifications !== undefined) data.settings.allow_notifications = Boolean(allow_notifications);
  if (session_timeout_minutes) data.settings.session_timeout_minutes = Number(session_timeout_minutes);
  if (require_strong_password !== undefined) data.settings.require_strong_password = Boolean(require_strong_password);
  data.settings.updated_at = new Date().toISOString();

  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.employee?.full_name || req.user!.username,
    action: 'UPDATE_SETTINGS',
    module: 'settings',
    targetType: 'settings',
    description: 'Memperbarui konfigurasi sistem dan klinik.',
    ip: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'] as string,
  });

  return res.json({ message: 'Pengaturan berhasil diperbarui.', settings: data.settings });
});

// ==========================================
// 15.B DATABASE MANAGEMENT & MULTI-DEVICE SYNC
// ==========================================

api.get('/database/info', requireAuth, (req, res) => {
  const stats = db.getDbStats();
  return res.json(stats);
});

api.get('/database/backup', requireOwner, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const dateStr = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="goc_database_backup_${dateStr}.json"`);
  return res.send(JSON.stringify(data, null, 2));
});

api.post('/database/restore', requireOwner, (req: AuthenticatedRequest, res) => {
  const incomingData = req.body;
  if (!incomingData || typeof incomingData !== 'object') {
    return res.status(400).json({ error: 'File data database tidak valid.' });
  }

  try {
    db.replaceData(incomingData);

    db.logAudit({
      userId: req.user!.id,
      userName: req.employee?.full_name || req.user!.username,
      action: 'RESTORE_DATABASE',
      module: 'system',
      targetType: 'database',
      description: 'Memulihkan cadangan database pusat dari file JSON.',
      ip: (req.headers['x-forwarded-for'] as string) || req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    return res.json({
      message: 'Database berhasil dipulihkan dari cadangan.',
      stats: db.getDbStats(),
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Gagal memulihkan database.' });
  }
});

api.post('/database/reset', requireOwner, (req: AuthenticatedRequest, res) => {
  try {
    db.resetToSeed();

    db.logAudit({
      userId: req.user!.id,
      userName: req.employee?.full_name || req.user!.username,
      action: 'RESET_DATABASE',
      module: 'system',
      targetType: 'database',
      description: 'Mereset database pusat ke data default klinik GOC.',
      ip: (req.headers['x-forwarded-for'] as string) || req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    return res.json({
      message: 'Database berhasil di-reset ke konfigurasi awal klinik GOC.',
      stats: db.getDbStats(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal mereset database.' });
  }
});

// ==========================================
// 16. FORUM DISKUSI TIM & AI AGENT HELPER
// ==========================================

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

function getSmartFallbackSolution(prompt: string, channelName?: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('steril') || p.includes('autoclave') || p.includes('alat') || p.includes('tray')) {
    return `💡 **Solusi SOP Sterilisasi Orthodonti GOC**:
1. **Pembersihan Awal**: Bilas instrumen (pliers, bracket tweezers, explorer) dengan larutan enzymatic cleaner ultrasonik selama 10 menit.
2. **Pengeringan & Pengepakan**: Keringkan sempurna dengan kain mikrofiber steril, masukkan ke dalam sterilization pouch dengan indikator strip kimia.
3. **Autoclave Cycle**: Jalankan siklus autoclave pada suhu 121°C (tekanan 15 psi) selama 30 menit atau 134°C selama 15 menit.
4. **Pencatatan Logbook**: Catat tanggal, nomor batch, suhu puncak, dan paraf perawat gigi penanggung jawab di buku kontrol harian GOC.`;
  }

  if (p.includes('komplain') || p.includes('pasien') || p.includes('antre') || p.includes('tunggu')) {
    return `💡 **Panduan Service Recovery & Komunikasi Pasien GOC**:
1. **Dengarkan & Validasi**: Sampaikan permohonan maaf atas waktu tunggu dengan tulus: *"Mohon maaf Bapak/Ibu [Nama], kami memahami kenyamanan dan waktu Anda sangat berharga. Saat ini dokter sedang menyelesaikan penanganan presisi pada pasien sebelumnya."*
2. **Kenyamanan Lounge**: Tawarkan air mineral higienis, update perkiraan waktu mulai tindakan (misal: 10 menit lagi), dan sediakan Wi-Fi / majalah edukasi orthodonti.
3. **Catatan SIM-Klinik**: Beri tanda prioritas untuk kunjungan kontrol berikutnya agar pasien dipanggil tepat waktu tanpa hambatan.`;
  }

  if (p.includes('kawat') || p.includes('bracket') || p.includes('lepas') || p.includes('sakit') || p.includes('nyeri')) {
    return `💡 **Protokol Penanganan Darurat Orthodonti Pasien GOC**:
1. **Bracket Lepas (Debonded)**: Jika bracket masih menempel pada archwire, oleskan dental wax. Jadwalkan perbaikan re-bonding dalam 1-2 hari kerja.
2. **Ujung Kawat Menusuk**: Gunakan cotton roll atau dental wax sebagai pelindung darurat. Di klinik, potong ujung distal wire menggunakan distal end cutter steril dengan safety catch.
3. **Rasa Sakit Pasca Aktivasi**: Normal selama 48-72 jam pertama. Anjurkan makanan lunak dan konsumsi analgesik (paracetamol/ibuprofen) sesuai anjuran dokter Ervina.`;
  }

  if (p.includes('promo') || p.includes('iklan') || p.includes('marketing') || p.includes('konten') || p.includes('reels')) {
    return `💡 **Ide Konten & Campaign Digital Marketing GOC**:
1. **Hook Reels/TikTok**: *"Pernah merasa kawat gigi nusuk pipi? Jangan panik, ini pertolongan pertama dari dokter gigi GOC!"* atau *"Bedanya Behel Konvensional vs Aligner Transparan untuk Usia Dewasa"*.
2. **Call-to-Action (CTA)**: Arahkan ke link bio WhatsApp Administrasi dengan kalimat ramah: *"Konsultasi senyum rapi dan estetik bersama dokter spesialis orthodonti GOC klik link di bio ya!"*
3. **Follow-up Leads**: Pastikan admin merespons leads WhatsApp dalam waktu maksimal 5 menit dengan greeting hangat dan informasi ketersediaan slot reservasi.`;
  }

  return `💡 **Rekomendasi Solusi Tim GOC**:
Terima kasih atas diskusinya rekan-rekan. Terkait topik "${prompt.slice(0, 80)}", berikut langkah taktis yang dapat diterapkan:
1. **Langkah Taktis**: Koordinasikan dengan Penanggung Jawab Klinik (drg. Ervina) atau Pimpinan (Pak Hendri) jika memerlukan persetujuan kebijakan.
2. **Tindakan Lintas Divisi**: Bagi tugas secara spesifik antara front office administrasi, perawat gigi, dan tim penunjang agar eksekusi cepat dan terukur.
3. **Dokumentasi**: Catat hasil keputusan diskusi di forum ini atau buatkan Task di menu Tugas GOC agar deadline dan progresnya terpantau rapi.`;
}

async function generateAiSolution(prompt: string, contextHistory: string = '', channelName?: string): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    return getSmartFallbackSolution(prompt, channelName);
  }

  try {
    const systemInstruction = `Anda adalah GOC AI Assistant — konsultan cerdas, ramah, dan solutif untuk Galaxy Orthodontic Center (GOC).
Pimpinan klinik: Hendri Kurniawan, ST., MMSI (Owner & Super Admin) dan drg. Ervina Dewiyanti, Sp.Ort., FICD (Penanggung Jawab Klinik).
Klinik memiliki 4 divisi utama: Administrasi (Front Office & Reservasi), Finance (Keuangan & Payroll), Digital Marketing (Kampanye & Leads Pasien), dan Perawat Gigi (Asistensi Medis & Sterilisasi Autoclave).
Tugas Anda:
1. Memberikan solusi praktis, panduan SOP klinis & operasional klinik gigi orthodonti.
2. Membantu merumuskan draf komunikasi ramah pasien, penanganan komplain, atau efisiensi alur kerja tim.
3. Memberikan ide-ide kreatif dan terstruktur dalam Bahasa Indonesia yang profesional, ramah, dan solutif.
4. Format respon dengan rapi menggunakan markdown (tebal, bullet points).`;

    const contents = contextHistory
      ? `Riwayat Diskusi Terakhir di Channel "${channelName || 'Forum GOC'}":\n${contextHistory}\n\nPertanyaan / Kebutuhan Solusi Tim:\n${prompt}`
      : prompt;

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || getSmartFallbackSolution(prompt, channelName);
  } catch (err) {
    console.error('Gemini API call failed, falling back to smart contextual response:', err);
    return getSmartFallbackSolution(prompt, channelName);
  }
}

// 1. Get Accessible Channels
api.get('/forum/channels', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const userId = req.user!.id;
  const isOwner = req.user?.role_id === 'owner';

  // Filter channels where user is member or channel is ALL_TEAM (or user is Owner)
  const userChannels = data.forum_channels.filter(c => {
    if (isOwner) return true;
    if (c.type === 'ALL_TEAM') return true;
    return c.member_ids && c.member_ids.includes(userId);
  });

  // Calculate unread count for each channel
  const enriched = userChannels.map(c => {
    const channelMsgs = data.forum_messages.filter(m => m.channel_id === c.id);
    const unreadCount = channelMsgs.filter(m => !m.read_by || !m.read_by.includes(userId)).length;
    return {
      ...c,
      unread_count: unreadCount,
      messages_count: channelMsgs.length,
    };
  });

  return res.json(enriched);
});

// 2. Create Channel
api.post('/forum/channels', requireAuth, (req: AuthenticatedRequest, res) => {
  const { name, description, type, department_id, member_ids, ai_enabled } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nama channel/forum wajib diisi.' });
  }

  const data = db.getData();
  const now = new Date().toISOString();
  const channelType = type || 'PRIVATE_INVITED';

  let finalMembers: string[] = Array.isArray(member_ids) ? [...member_ids] : [];
  if (!finalMembers.includes(req.user!.id)) {
    finalMembers.push(req.user!.id);
  }

  if (channelType === 'ALL_TEAM') {
    finalMembers = data.users.map(u => u.id);
  } else if (channelType === 'DEPARTMENT' && department_id) {
    const deptEmployees = data.employees.filter(e => e.department_id === department_id);
    const deptUserIds = deptEmployees.map(e => e.user_id).filter(Boolean);
    finalMembers = Array.from(new Set([...finalMembers, ...deptUserIds, req.user!.id]));
  }

  const dept = department_id ? data.departments.find(d => d.id === department_id) : null;

  const newChannel: ForumChannel = {
    id: `chan-${Date.now().toString(36)}`,
    name: name.startsWith('#') || channelType !== 'ALL_TEAM' ? name : `#${name.toLowerCase().replace(/\s+/g, '-')}`,
    description: description || '',
    type: channelType,
    department_id: department_id || null,
    department_name: dept ? dept.name : null,
    member_ids: finalMembers,
    created_by: req.user!.id,
    ai_enabled: ai_enabled !== undefined ? Boolean(ai_enabled) : true,
    ai_persona: 'Konsultan Operasional & Klinis GOC',
    last_message_at: now,
    last_message_preview: 'Channel diskusi dibuat.',
    unread_count: 0,
    created_at: now,
    updated_at: now,
  };

  data.forum_channels.unshift(newChannel);

  // Initial welcome message
  const welcomeMsg: ForumMessage = {
    id: `msg-${Date.now().toString(36)}`,
    channel_id: newChannel.id,
    sender_id: req.user!.id,
    sender_name: req.employee?.full_name || req.user!.username,
    sender_role: req.user!.role_id === 'owner' ? 'Owner / Super Admin' : (req.employee?.position_id || 'Staff'),
    sender_avatar: req.employee?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    is_ai: false,
    content: `Channel diskusi "${newChannel.name}" telah dibuat. Selamat berkoordinasi!`,
    read_by: [req.user!.id],
    created_at: now,
  };

  data.forum_messages.push(welcomeMsg);
  db.persist();

  return res.status(201).json(newChannel);
});

// 3. Update Channel (Settings, Toggle AI Agent, Add Members)
api.put('/forum/channels/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const channel = data.forum_channels.find(c => c.id === req.params.id);
  if (!channel) return res.status(404).json({ error: 'Channel forum tidak ditemukan.' });

  const isOwner = req.user?.role_id === 'owner';
  const isCreator = channel.created_by === req.user!.id;
  if (!isOwner && !isCreator && !req.permissions?.includes('forum.create')) {
    return res.status(403).json({ error: 'Hanya pembuat channel atau Super Admin yang dapat mengubah pengaturan channel.' });
  }

  const { name, description, ai_enabled, member_ids } = req.body;
  if (name !== undefined) channel.name = name;
  if (description !== undefined) channel.description = description;
  if (ai_enabled !== undefined) channel.ai_enabled = Boolean(ai_enabled);
  if (Array.isArray(member_ids)) {
    channel.member_ids = Array.from(new Set([...member_ids, req.user!.id]));
  }
  channel.updated_at = new Date().toISOString();

  db.persist();
  return res.json(channel);
});

// 4. Get Channel Messages
api.get('/forum/channels/:id/messages', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const channel = data.forum_channels.find(c => c.id === req.params.id);
  if (!channel) return res.status(404).json({ error: 'Channel forum tidak ditemukan.' });

  const isOwner = req.user?.role_id === 'owner';
  if (!isOwner && channel.type !== 'ALL_TEAM' && !channel.member_ids?.includes(req.user!.id)) {
    return res.status(403).json({ error: 'Anda bukan anggota dari channel diskusi ini.' });
  }

  const msgs = data.forum_messages
    .filter(m => m.channel_id === channel.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return res.json(msgs);
});

// 5. Send Message to Channel
api.post('/forum/channels/:id/messages', requireAuth, async (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const channel = data.forum_channels.find(c => c.id === req.params.id);
  if (!channel) return res.status(404).json({ error: 'Channel forum tidak ditemukan.' });

  const isOwner = req.user?.role_id === 'owner';
  if (!isOwner && channel.type !== 'ALL_TEAM' && !channel.member_ids?.includes(req.user!.id)) {
    return res.status(403).json({ error: 'Anda bukan anggota dari channel diskusi ini.' });
  }

  const { content, attachment_url, attachment_name, attachment_type, trigger_ai } = req.body;
  if (!content && !attachment_url) {
    return res.status(400).json({ error: 'Isi pesan atau lampiran tidak boleh kosong.' });
  }

  const now = new Date().toISOString();
  const user = req.user!;
  const emp = req.employee;

  const newMsg: ForumMessage = {
    id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    channel_id: channel.id,
    sender_id: user.id,
    sender_name: emp?.full_name || user.username,
    sender_role: user.role_id === 'owner' ? 'Owner / Super Admin' : (emp ? data.positions.find(p => p.id === emp.position_id)?.name || 'Karyawan' : 'User'),
    sender_avatar: emp?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    is_ai: false,
    content: String(content || '').trim(),
    attachment_url: attachment_url || null,
    attachment_name: attachment_name || null,
    attachment_type: attachment_type || null,
    reactions: {},
    read_by: [user.id],
    created_at: now,
  };

  data.forum_messages.push(newMsg);
  channel.last_message_at = now;
  channel.last_message_preview = `${newMsg.sender_name.split(' ')[0]}: ${newMsg.content.slice(0, 60)}`;
  db.persist();

  // Check if AI Agent should generate a solution
  const shouldTriggerAi =
    channel.ai_enabled &&
    (trigger_ai === true ||
      newMsg.content.toLowerCase().includes('@ai') ||
      newMsg.content.toLowerCase().includes('/ai') ||
      newMsg.content.toLowerCase().includes('solusi ai') ||
      newMsg.content.toLowerCase().includes('minta solusi'));

  let aiMessage: ForumMessage | null = null;
  if (shouldTriggerAi) {
    // Collect recent messages for context
    const recentMsgs = data.forum_messages
      .filter(m => m.channel_id === channel.id)
      .slice(-6)
      .map(m => `${m.sender_name} (${m.sender_role}): ${m.content}`)
      .join('\n');

    const cleanPrompt = newMsg.content.replace(/@ai|\/ai/gi, '').trim() || 'Mohon berikan analisis dan solusi terbaik untuk diskusi ini.';
    const aiSolution = await generateAiSolution(cleanPrompt, recentMsgs, channel.name);

    aiMessage = {
      id: `msg-ai-${Date.now().toString(36)}`,
      channel_id: channel.id,
      sender_id: 'goc-ai-agent',
      sender_name: 'GOC AI Assistant',
      sender_role: 'Konsultan AI Klinis & Solusi',
      sender_avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      is_ai: true,
      content: aiSolution,
      reactions: {},
      read_by: [user.id],
      created_at: new Date().toISOString(),
    };

    data.forum_messages.push(aiMessage);
    channel.last_message_at = aiMessage.created_at;
    channel.last_message_preview = `GOC AI: ${aiMessage.content.slice(0, 60)}`;
    db.persist();
  }

  return res.status(201).json({
    message: newMsg,
    aiMessage,
  });
});

// 6. Direct Request AI Solution for a Channel
api.post('/forum/channels/:id/ai-assist', requireAuth, async (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const channel = data.forum_channels.find(c => c.id === req.params.id);
  if (!channel) return res.status(404).json({ error: 'Channel forum tidak ditemukan.' });

  const { prompt } = req.body;
  const recentMsgs = data.forum_messages
    .filter(m => m.channel_id === channel.id)
    .slice(-8)
    .map(m => `${m.sender_name}: ${m.content}`)
    .join('\n');

  const userPrompt = prompt || 'Rangkum kendala dalam diskusi di atas dan berikan rekomendasi solusi konkrit untuk tim GOC.';
  const aiSolution = await generateAiSolution(userPrompt, recentMsgs, channel.name);

  const aiMessage: ForumMessage = {
    id: `msg-ai-${Date.now().toString(36)}`,
    channel_id: channel.id,
    sender_id: 'goc-ai-agent',
    sender_name: 'GOC AI Assistant',
    sender_role: 'Konsultan AI Klinis & Solusi',
    sender_avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    is_ai: true,
    content: aiSolution,
    reactions: {},
    read_by: [req.user!.id],
    created_at: new Date().toISOString(),
  };

  data.forum_messages.push(aiMessage);
  channel.last_message_at = aiMessage.created_at;
  channel.last_message_preview = `GOC AI: ${aiMessage.content.slice(0, 60)}`;
  db.persist();

  return res.json({ aiMessage });
});

// 7. Mark Channel Messages as Read
api.patch('/forum/channels/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const userId = req.user!.id;
  let countUpdated = 0;

  data.forum_messages.forEach(m => {
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

// 8. React to Message
api.post('/forum/messages/:id/react', requireAuth, (req: AuthenticatedRequest, res) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Emoji wajib dikirim.' });

  const data = db.getData();
  const msg = data.forum_messages.find(m => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: 'Pesan tidak ditemukan.' });

  if (!msg.reactions) msg.reactions = {};
  if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

  const userId = req.user!.id;
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

// ==========================================
// 17. VIDEO MEETINGS (RUANG MEETING VIRTUAL)
// ==========================================

// 1. Get Meetings List
api.get('/meetings', requireAuth, (req, res) => {
  const data = db.getData();
  const sorted = [...data.video_meetings].sort((a, b) => {
    if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
    if (b.status === 'LIVE' && a.status !== 'LIVE') return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return res.json(sorted);
});

// 2. Create Video Meeting Room
api.post('/meetings', requireAuth, (req: AuthenticatedRequest, res) => {
  const { title, description, channel_id, scheduled_start, status } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Judul meeting wajib diisi.' });
  }

  const data = db.getData();
  const now = new Date().toISOString();
  const roomCode = `GOC-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  const newMeeting: VideoMeeting = {
    id: `meet-${Date.now().toString(36)}`,
    title: String(title).trim(),
    description: description || '',
    host_id: req.user!.id,
    host_name: req.employee?.full_name || req.user!.username,
    channel_id: channel_id || null,
    status: status || 'LIVE',
    scheduled_start: scheduled_start || now,
    started_at: status === 'LIVE' ? now : undefined,
    participant_ids: [req.user!.id],
    invited_ids: data.users.map(u => u.id),
    room_code: roomCode,
    created_at: now,
  };

  data.video_meetings.unshift(newMeeting);
  db.persist();

  // If tied to a channel, post an invite message to that channel!
  if (channel_id) {
    const channel = data.forum_channels.find(c => c.id === channel_id);
    if (channel) {
      data.forum_messages.push({
        id: `msg-${Date.now().toString(36)}`,
        channel_id: channel.id,
        sender_id: req.user!.id,
        sender_name: req.employee?.full_name || req.user!.username,
        sender_role: req.user!.role_id === 'owner' ? 'Owner / Super Admin' : 'Host Meeting',
        sender_avatar: req.employee?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        is_ai: false,
        content: `📹 **Ruang Video Meeting Dimulai:** "${newMeeting.title}"\nKode Ruang: **${newMeeting.room_code}**\nSilakan bergabung melalui tab Video Meeting.`,
        read_by: [req.user!.id],
        created_at: now,
      });
      channel.last_message_at = now;
      channel.last_message_preview = `Video Meeting: ${newMeeting.title}`;
      db.persist();
    }
  }

  return res.status(201).json(newMeeting);
});

// 3. Update Meeting (Join/Leave/End)
api.put('/meetings/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const meeting = data.video_meetings.find(m => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Ruang meeting tidak ditemukan.' });

  const { status, action } = req.body;
  const userId = req.user!.id;

  if (action === 'join') {
    if (!meeting.participant_ids.includes(userId)) {
      meeting.participant_ids.push(userId);
    }
    if (meeting.status === 'SCHEDULED') {
      meeting.status = 'LIVE';
      meeting.started_at = new Date().toISOString();
    }
  } else if (action === 'leave') {
    meeting.participant_ids = meeting.participant_ids.filter(id => id !== userId);
  } else if (status) {
    meeting.status = status;
    if (status === 'ENDED') {
      meeting.ended_at = new Date().toISOString();
      meeting.participant_ids = [];
    }
  }

  db.persist();
  return res.json(meeting);
});

// 4. Meeting AI Summary & Action Items
api.post('/meetings/:id/ai-summary', requireAuth, async (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const meeting = data.video_meetings.find(m => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Ruang meeting tidak ditemukan.' });

  const prompt = `Buatkan notulensi ringkas, poin keputusan utama, dan daftar aksi (action items) untuk video meeting klinik:
Judul: ${meeting.title}
Deskripsi: ${meeting.description || '-'}
Host: ${meeting.host_name}
Peserta: Seluruh tim GOC (Dokter Spesialis Orthodonti, Manajemen, Front Office, Finance, Marketing, Perawat Gigi).`;

  const summary = await generateAiSolution(prompt);
  return res.json({ summary });
});

export default api;
