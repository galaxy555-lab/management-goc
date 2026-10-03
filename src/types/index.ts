/**
 * Data Types & Schema for GOC Team Management
 * Galaxy Orthodontic Center
 */

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'RESIGNED' | 'SUSPENDED';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ScheduleType = 'SHIFT' | 'MEETING' | 'EVENT' | 'LIBUR' | 'JADWAL_KERJA';

export type LeaveType = 'CUTI' | 'IZIN' | 'SAKIT' | 'KEPERLUAN_PRIBADI';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type PayrollStatus = 'DRAFT' | 'PROCESS' | 'PAID';

export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'EXPIRED';
export type AnnouncementTarget = 'ALL' | 'DEPARTMENT' | 'EMPLOYEE';

export interface Department {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  name: string;
  department_id: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string; // 'owner' | 'pj_klinik' | 'karyawan'
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  allowed: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  salt: string;
  role_id: string;
  employee_id: string;
  status: EmployeeStatus;
  must_change_password: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  user_id: string;
  employee_number: string;
  full_name: string;
  email: string;
  phone: string;
  department_id: string;
  position_id: string;
  manager_id: string | null;
  join_date: string;
  exit_date: string | null;
  status: EmployeeStatus;
  photo: string;
  notes: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface EmployeeWithRelations extends Employee {
  department?: Department;
  position?: Position;
  manager?: {
    id: string;
    full_name: string;
    position_name?: string;
  } | null;
  user?: {
    id: string;
    username: string;
    role_id: string;
    role_name?: string;
    status: EmployeeStatus;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string; // employee_id
  created_by: string; // user_id
  priority: TaskPriority;
  deadline: string;
  status: TaskStatus;
  attachment_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  comment: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  title: string;
  type: ScheduleType;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  user_ids: string[];
  notes: string;
  created_by: string;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  attachment_name: string | null;
  status: LeaveStatus;
  approved_by: string | null;
  approval_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  period: string; // 'Oktober 2026'
  base_salary: number;
  allowance: number;
  bonus: number;
  deduction: number;
  total_salary: number;
  payment_status: PayrollStatus;
  payment_date: string | null;
  notes: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_type: AnnouncementTarget;
  target_id: string | null;
  publish_date: string;
  status: AnnouncementStatus;
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  module: string;
  target_type: string;
  target_id: string | null;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'TASK' | 'DEADLINE' | 'LEAVE' | 'PAYROLL' | 'ANNOUNCEMENT' | 'ACCESS' | 'SYSTEM';
  read: boolean;
  link: string | null;
  priority?: 'NORMAL' | 'HIGH' | 'URGENT';
  metadata?: {
    taskId?: string;
    leaveId?: string;
    payrollId?: string;
    dueDate?: string;
    amount?: number;
    status?: string;
  };
  created_at: string;
}

export interface AppSettings {
  id: string;
  clinic_name: string;
  app_name: string;
  logo_text: string;
  primary_color: string;
  timezone: string;
  date_format: string;
  allow_notifications: boolean;
  session_timeout_minutes: number;
  require_strong_password: boolean;
  updated_at: string;
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role_id: string;
    role_name: string;
    employee_id: string;
    full_name: string;
    position_name: string;
    department_name: string;
    department_id: string;
    photo: string;
    must_change_password: boolean;
  };
  permissions: string[];
}

export interface OrganizationNode {
  id: string;
  full_name: string;
  position_name: string;
  department_name: string;
  photo: string;
  phone: string;
  email: string;
  role_id: string;
  children?: OrganizationNode[];
}

export type ForumChannelType = 'ALL_TEAM' | 'DEPARTMENT' | 'PRIVATE_INVITED' | 'DIRECT';

export interface ForumChannel {
  id: string;
  name: string;
  description?: string;
  type: ForumChannelType;
  department_id?: string | null;
  department_name?: string | null;
  member_ids: string[]; // List of user IDs with access
  created_by: string;
  ai_enabled: boolean; // Agent AI helper active / inactive toggle
  ai_persona?: string;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count?: number; // Calculated per user
  created_at: string;
  updated_at: string;
}

export interface ForumMessage {
  id: string;
  channel_id: string;
  sender_id: string; // user_id or 'goc-ai-agent'
  sender_name: string;
  sender_role: string;
  sender_avatar: string;
  is_ai: boolean;
  content: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: 'image' | 'file' | null;
  reactions?: Record<string, string[]>; // emoji -> [user_id...]
  read_by: string[]; // list of user_ids who have read this message
  created_at: string;
}

export interface VideoMeeting {
  id: string;
  title: string;
  description?: string;
  host_id: string;
  host_name: string;
  channel_id?: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  scheduled_start?: string;
  started_at?: string;
  ended_at?: string;
  participant_ids: string[];
  invited_ids: string[];
  room_code: string;
  created_at: string;
}

