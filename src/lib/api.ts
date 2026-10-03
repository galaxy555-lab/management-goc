/**
 * Client-Side API Helper for GOC Team Management
 */

import { AuthSession } from '../types/index.ts';

const TOKEN_KEY = 'goc_auth_token';
const SESSION_KEY = 'goc_auth_session';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let data: any = null;
  if (isJson) {
    data = await response.json().catch(() => null);
  } else {
    // If not JSON (e.g. 404 HTML page or index.html from misconfigured rewrite)
    const text = await response.text().catch(() => '');
    if (!response.ok) {
      throw new Error(`Server error (${response.status}): Endpoint API tidak ditemukan atau backend belum berjalan.`);
    }
    // If 200 OK but HTML, server is serving index.html instead of executing API
    throw new Error('Server mengembalikan respon non-JSON. Pastikan backend server Node.js aktif di hosting Anda.');
  }

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    if (response.status === 401) {
      clearSession();
      // Only reload if we aren't already on login
      if (window.location.pathname !== '/login') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    throw new Error(errorMsg);
  }

  if (data === null || data === undefined) {
    throw new Error('Respon data kosong dari server.');
  }

  return data as T;
}
