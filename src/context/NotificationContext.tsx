/**
 * Centralized Notification Context for GOC Team Management
 * Handles Real-time polling, alert badges, category filtering, and toast popups
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { AppNotification } from '../types/index.ts';
import { apiRequest } from '../lib/api.ts';
import { useAuth } from './AuthContext.tsx';

export interface NotificationCounts {
  all: number;
  unread: number;
  task: number;
  deadline: number;
  leave: number;
  payroll: number;
}

interface NotificationResponse {
  notifications: AppNotification[];
  unreadCount: number;
  counts: NotificationCounts;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  counts: NotificationCounts;
  loading: boolean;
  activeFilter: 'ALL' | 'TASK' | 'DEADLINE' | 'LEAVE' | 'PAYROLL';
  setActiveFilter: (filter: 'ALL' | 'TASK' | 'DEADLINE' | 'LEAVE' | 'PAYROLL') => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string, link?: string | null) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearReadNotifications: () => Promise<void>;
  checkDeadlines: () => Promise<void>;
  toasts: AppNotification[];
  dismissToast: (id: string) => void;
  showCenterModal: boolean;
  setShowCenterModal: (show: boolean) => void;
}

const defaultCounts: NotificationCounts = {
  all: 0,
  unread: 0,
  task: 0,
  deadline: 0,
  leave: 0,
  payroll: 0,
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [counts, setCounts] = useState<NotificationCounts>(defaultCounts);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TASK' | 'DEADLINE' | 'LEAVE' | 'PAYROLL'>('ALL');
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [showCenterModal, setShowCenterModal] = useState<boolean>(false);

  // Store known IDs in a ref to prevent infinite re-render loops
  const lastKnownIdsRef = useRef<Set<string>>(new Set());
  const initialFetchDoneRef = useRef(false);

  const token = session?.token;

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const typeParam = activeFilter !== 'ALL' ? `?type=${activeFilter}` : '';
      const res = await apiRequest<NotificationResponse>(`/api/notifications${typeParam}`);

      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
      setCounts(res.counts);

      // Detect brand new notifications to show toast alert popup only after initial load
      if (initialFetchDoneRef.current && lastKnownIdsRef.current.size > 0) {
        const newArrivals = res.notifications.filter(
          n => !n.read && !lastKnownIdsRef.current.has(n.id)
        );
        if (newArrivals.length > 0) {
          setToasts(prev => [...newArrivals, ...prev].slice(0, 3));
        }
      }

      lastKnownIdsRef.current = new Set(res.notifications.map(n => n.id));
      initialFetchDoneRef.current = true;
    } catch {
      // Ignore background poll errors
    }
  }, [token, activeFilter]);

  // Initial fetch and 15s polling
  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setCounts(defaultCounts);
      lastKnownIdsRef.current = new Set();
      initialFetchDoneRef.current = false;
      return;
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [token, fetchNotifications]);

  const markAsRead = useCallback(async (id: string, link?: string | null) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      setCounts(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
      }));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiRequest('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      setCounts(prev => ({ ...prev, unread: 0 }));
      setToasts([]);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await apiRequest(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  }, [fetchNotifications]);

  const clearReadNotifications = useCallback(async () => {
    try {
      await apiRequest('/api/notifications/clear-all', { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => !n.read));
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  }, [fetchNotifications]);

  const checkDeadlines = useCallback(async () => {
    try {
      await apiRequest('/api/notifications/check-deadlines', { method: 'POST' });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  }, [fetchNotifications]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        counts,
        loading,
        activeFilter,
        setActiveFilter,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearReadNotifications,
        checkDeadlines,
        toasts,
        dismissToast,
        showCenterModal,
        setShowCenterModal,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
