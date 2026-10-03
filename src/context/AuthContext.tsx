/**
 * Authentication Context for GOC Team Management
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthSession } from '../types/index.ts';
import { apiRequest, getStoredSession, getStoredToken, saveSession, clearSession } from '../lib/api.ts';

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: {
    full_name: string;
    email: string;
    username: string;
    password: string;
    phone?: string;
    department_id?: string;
  }) => Promise<void>;
  loginWithGoogle: (googleData: {
    email: string;
    name: string;
    picture?: string;
    googleId?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permissionId: string) => boolean;
  hasAnyPermission: (permissionIds: string[]) => boolean;
  isOwner: boolean;
  refreshSession: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSession = async () => {
    const token = getStoredToken();
    if (!token) {
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest<{ session: AuthSession }>('/api/auth/me');
      if (res && res.session) {
        setSession(res.session);
        saveSession(res.session);
      } else {
        clearSession();
        setSession(null);
      }
    } catch {
      clearSession();
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();

    const handleUnauthorized = () => {
      setSession(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean = true) => {
    const res = await apiRequest<{ message: string; session: AuthSession }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, rememberMe }),
    });

    if (!res || !res.session) {
      throw new Error('Gagal mendapatkan sesi login dari server.');
    }

    setSession(res.session);
    saveSession(res.session);
  };

  const register = async (data: {
    full_name: string;
    email: string;
    username: string;
    password: string;
    phone?: string;
    department_id?: string;
  }) => {
    const res = await apiRequest<{ message: string; session: AuthSession }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!res || !res.session) {
      throw new Error('Gagal mendaftarkan akun baru.');
    }

    setSession(res.session);
    saveSession(res.session);
  };

  const loginWithGoogle = async (googleData: {
    email: string;
    name: string;
    picture?: string;
    googleId?: string;
  }) => {
    const res = await apiRequest<{ message: string; session: AuthSession }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData),
    });

    if (!res || !res.session) {
      throw new Error('Gagal login dengan akun Google.');
    }

    setSession(res.session);
    saveSession(res.session);
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      clearSession();
      setSession(null);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (session) {
      const updated = {
        ...session,
        user: {
          ...session.user,
          must_change_password: false,
        },
      };
      setSession(updated);
      saveSession(updated);
    }
  };

  const hasPermission = (permissionId: string): boolean => {
    if (!session) return false;
    if (session.user.role_id === 'owner') return true;
    return session.permissions.includes(permissionId);
  };

  const hasAnyPermission = (permissionIds: string[]): boolean => {
    if (!session) return false;
    if (session.user.role_id === 'owner') return true;
    return permissionIds.some(id => session.permissions.includes(id));
  };

  const isOwner = session?.user.role_id === 'owner';

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        hasPermission,
        hasAnyPermission,
        isOwner,
        refreshSession,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
