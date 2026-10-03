/**
 * Authentication & Permission Security Layer for GOC Team Management
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { db, ALL_PERMISSIONS } from './db.ts';
import { User, Employee, Role, AuthSession } from '../types/index.ts';

export interface ActiveSession {
  token: string;
  userId: string;
  employeeId: string;
  roleId: string;
  expiresAt: number;
}

const sessions = new Map<string, ActiveSession>();

export function createSession(user: User): ActiveSession {
  const token = crypto.randomBytes(32).toString('hex');
  const sessionSettings = db.getData().settings;
  const timeoutMs = (sessionSettings.session_timeout_minutes || 120) * 60 * 1000;

  const session: ActiveSession = {
    token,
    userId: user.id,
    employeeId: user.employee_id,
    roleId: user.role_id,
    expiresAt: Date.now() + timeoutMs,
  };

  sessions.set(token, session);
  return session;
}

export function removeSession(token: string) {
  sessions.delete(token);
}

export function getSession(token?: string): ActiveSession | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

/**
 * Calculates effective permissions for a user:
 * 1. Owner always has 100% of all system permissions.
 * 2. Role-based permissions from role_permissions.
 * 3. User-specific overrides from user_permissions (allowed: true/false).
 */
export function calculateUserPermissions(userId: string): string[] {
  const data = db.getData();
  const user = data.users.find(u => u.id === userId);
  if (!user) return [];

  // Super Admin / Owner has all permissions unconditionally
  if (user.role_id === 'owner') {
    return ALL_PERMISSIONS.map(p => p.id);
  }

  // Get base permissions from role
  const rolePerms = data.role_permissions
    .filter(rp => rp.role_id === user.role_id)
    .map(rp => rp.permission_id);

  const permSet = new Set<string>(rolePerms);

  // Apply user-specific custom permissions overrides
  const userOverrides = data.user_permissions.filter(up => up.user_id === userId);
  userOverrides.forEach(uo => {
    if (uo.allowed) {
      permSet.add(uo.permission_id);
    } else {
      permSet.delete(uo.permission_id);
    }
  });

  return Array.from(permSet);
}

export function buildAuthSession(user: User, token: string): AuthSession {
  const data = db.getData();
  const employee = data.employees.find(e => e.id === user.employee_id);
  const department = employee ? data.departments.find(d => d.id === employee.department_id) : undefined;
  const position = employee ? data.positions.find(p => p.id === employee.position_id) : undefined;
  const role = data.roles.find(r => r.id === user.role_id);
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
      position_name: position ? position.name : '-',
      department_name: department ? department.name : '-',
      department_id: department ? department.id : '',
      photo: employee ? employee.photo : '',
      must_change_password: user.must_change_password,
    },
    permissions,
  };
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  employee?: Employee;
  permissions?: string[];
  sessionToken?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1].trim();
  const session = getSession(token);
  if (!session) {
    return next();
  }

  const data = db.getData();
  const user = data.users.find(u => u.id === session.userId);
  if (!user || user.status !== 'ACTIVE') {
    sessions.delete(token);
    return next();
  }

  const employee = data.employees.find(e => e.id === user.employee_id);
  req.user = user;
  req.employee = employee;
  req.permissions = calculateUserPermissions(user.id);
  req.sessionToken = token;

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Autentikasi diperlukan. Silakan login terlebih dahulu.',
      code: 'UNAUTHENTICATED'
    });
  }
  next();
}

export function requirePermission(permissionId: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Autentikasi diperlukan. Silakan login terlebih dahulu.',
        code: 'UNAUTHENTICATED'
      });
    }

    if (req.user.role_id === 'owner') {
      return next();
    }

    const perms = req.permissions || [];
    if (!perms.includes(permissionId)) {
      return res.status(403).json({
        error: 'Anda tidak mempunyai akses ke halaman atau aksi ini.',
        code: 'FORBIDDEN',
        requiredPermission: permissionId,
      });
    }

    next();
  };
}

export function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role_id !== 'owner') {
    return res.status(403).json({
      error: 'Akses khusus Owner / Super Admin.',
      code: 'FORBIDDEN_OWNER_ONLY'
    });
  }
  next();
}
