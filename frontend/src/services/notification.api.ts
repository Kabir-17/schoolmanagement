import { api, ApiResponse } from "./api-base";

// Notification API service
export const notificationApi = {
  // Get notifications for the current user
  getMyNotifications: (params?: {
    type?: string;
    isRead?: boolean;
    limit?: number;
    page?: number;
  }) => api.get<ApiResponse>("/notifications", { params }),

  // Mark notification as read
  markAsRead: (id: string) => api.patch<ApiResponse>(`/notifications/${id}/read`),

  // Mark all notifications as read
  markAllAsRead: () => api.patch<ApiResponse>("/notifications/mark-all-read"),

  // Get unread count
  getUnreadCount: () => api.get<ApiResponse>("/notifications/unread-count"),

  // Delete notification
  delete: (id: string) => api.delete<ApiResponse>(`/notifications/${id}`),
};