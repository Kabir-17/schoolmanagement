import { api, ApiResponse } from "./api-base";

// Authentication API service
export const authApi = {
  // Authentication
  login: (username: string, password: string) =>
    api.post<ApiResponse>("/auth/login", { username, password }),

  logout: () => api.post<ApiResponse>("/auth/logout"),

  verify: () => api.get<ApiResponse>("/auth/verify"),

  // Password management
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => api.post<ApiResponse>("/auth/change-password", data),

  forcePasswordChange: (newPassword: string) =>
    api.post<ApiResponse>("/auth/force-password-change", { newPassword }),

  resetPassword: (data: { email: string }) =>
    api.post<ApiResponse>("/auth/reset-password", data),

  confirmResetPassword: (data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }) => api.post<ApiResponse>("/auth/confirm-reset-password", data),

  // Profile
  getProfile: () => api.get<ApiResponse>("/auth/profile"),

  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }) => api.put<ApiResponse>("/auth/profile", data),

  // Session management
  refreshToken: () => api.post<ApiResponse>("/auth/refresh"),

  validateSession: () => api.get<ApiResponse>("/auth/validate"),
};
