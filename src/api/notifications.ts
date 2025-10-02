import { apiClient } from './base';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  status: 'sent' | 'read' | 'unread';
  createdAt: string;
  sentAt?: string;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: Array<{
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
  }>;
  pagination?: { limit: number; offset: number; hasMore: boolean };
}

export const getUserNotifications = (params?: { limit?: number; offset?: number }) =>
  apiClient.get<NotificationsResponse>('/api/user/notifications/last-4-weeks', { params });

export const getNotificationById = (id: number) =>
  apiClient.get<{ success: boolean; notification: NotificationItem }>(`/api/user/notifications/${id}`);

export const markNotificationRead = (id: number) =>
  apiClient.put<{ success: boolean }>(`/api/user/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  apiClient.put<{ success: boolean }>(`/api/user/notifications/read-all`);

export const getNotificationsStats = () =>
  apiClient.get<{ success: boolean; total: number; unread: number }>(`/api/user/notifications/stats`);
