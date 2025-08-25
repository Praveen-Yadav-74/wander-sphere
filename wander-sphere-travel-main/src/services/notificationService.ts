import { apiRequest, cachedApiRequest } from '@/utils/api';
import { endpoints, buildUrl, getAuthHeaderSync, ApiResponse, PaginatedResponse } from '@/config/api';
import { CacheKeys, CacheTTL } from '@/services/cacheService';

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'trip_update' | 'trip_invite' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    unreadCount: number;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

class NotificationService {
  // Get notifications with pagination and filtering
  async getNotifications(
    page: number = 1,
    limit: number = 20,
    type?: string,
    read?: boolean
  ): Promise<NotificationResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (type) params.append('type', type);
    if (read !== undefined) params.append('read', read.toString());

    const cacheKey = CacheKeys.notifications(`current_${params.toString()}`);
    const response = await cachedApiRequest(`${endpoints.notifications.list}?${params.toString()}`, cacheKey, {
      ttl: CacheTTL.SHORT,
      headers: getAuthHeaderSync()
    });
    return response as NotificationResponse;
  }

  // Get unread notification count
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await cachedApiRequest(`${endpoints.notifications.list}/unread-count`, 'notifications_unread_count', {
      ttl: CacheTTL.SHORT,
      headers: getAuthHeaderSync()
    });
    return response as UnreadCountResponse;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest(endpoints.notifications.markRead(notificationId), {
      method: 'PUT',
      headers: getAuthHeaderSync()
    });
    return response as { success: boolean; message: string };
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest(endpoints.notifications.markAllRead, {
      method: 'PUT',
      headers: getAuthHeaderSync()
    });
    return response as { success: boolean; message: string };
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest(endpoints.notifications.delete(notificationId), {
      method: 'DELETE',
      headers: getAuthHeaderSync()
    });
    return response as { success: boolean; message: string };
  }

  // Delete all notifications
  async deleteAllNotifications(): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest(endpoints.notifications.list, {
      method: 'DELETE',
      headers: getAuthHeaderSync()
    });
    return response as { success: boolean; message: string };
  }

  // Create test notification (development only)
  async createTestNotification(
    type: string,
    title: string,
    message: string,
    data?: any
  ): Promise<{ success: boolean; message: string; data: { notification: Notification } }> {
    const response = await apiRequest(`${endpoints.notifications.list}/test`, {
      method: 'POST',
      headers: {
        ...getAuthHeaderSync(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        title,
        message,
        data,
      })
    });
    return response as { success: boolean; message: string; data: { notification: Notification } };
  }
}

export const notificationService = new NotificationService();