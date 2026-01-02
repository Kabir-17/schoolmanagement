import { api, ApiResponse } from "./api-base";

// Superadmin API service
export const superadminApi = {
  // Dashboard and stats
  getStats: () => api.get<ApiResponse>("/superadmin/stats"),
  getSystemStats: () => api.get<ApiResponse>("/superadmin/system/stats"),

  // School management
  createSchool: (data: {
    name: string;
    slug?: string;
    schoolId?: string;
    establishedYear?: number;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    contact: {
      phone: string;
      email: string;
      website?: string;
    };
    affiliation?: string;
    recognition?: string;
    settings?: {
      maxStudentsPerSection?: number;
      grades?: number[];
      sections?: string[];
      timezone?: string;
      language?: string;
      currency?: string;
    };
  }) => api.post<ApiResponse>("/superadmin/schools", data),

  getSchools: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get<ApiResponse>("/superadmin/schools", { params }),

  getSchool: (id: string) => api.get<ApiResponse>(`/superadmin/schools/${id}`),

  updateSchool: (
    id: string,
    data: {
      name?: string;
      establishedYear?: number;
      address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
      };
      contact?: {
        phone?: string;
        email?: string;
        website?: string;
      };
      affiliation?: string;
      recognition?: string;
      settings?: {
        maxStudentsPerSection?: number;
        grades?: number[];
        sections?: string[];
        timezone?: string;
        language?: string;
        currency?: string;
      };
    }
  ) => api.put<ApiResponse>(`/superadmin/schools/${id}`, data),

  deleteSchool: (id: string) =>
    api.delete<ApiResponse>(`/superadmin/schools/${id}`),

  updateSchoolStatus: (id: string, status: string) =>
    api.put<ApiResponse>(`/superadmin/schools/${id}/status`, { status }),

  // School details and monitoring
  getSchoolStats: (id: string) =>
    api.get<ApiResponse>(`/superadmin/schools/${id}/stats`),

  getSchoolDetails: (id: string) =>
    api.get<ApiResponse>(`/superadmin/schools/${id}/details`),

  // Admin management
  assignAdmin: (
    schoolId: string,
    adminData: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      password?: string;
    }
  ) =>
    api.post<ApiResponse>(`/superadmin/schools/${schoolId}/admin`, adminData),

  getAdminCredentials: (schoolId: string) =>
    api.get<ApiResponse>(`/superadmin/schools/${schoolId}/admin/credentials`),

  resetAdminPassword: (schoolId: string, newPassword?: string) =>
    api.post<ApiResponse>(
      `/superadmin/schools/${schoolId}/admin/reset-password`,
      { newPassword }
    ),

  // API management
  regenerateApiKey: (schoolId: string) =>
    api.post<ApiResponse>(`/superadmin/schools/${schoolId}/regenerate-api-key`),

  // System settings
  getSystemSettings: () => api.get<ApiResponse>("/superadmin/system/settings"),

  updateSystemSettings: (settings: {
    maintenanceMode?: boolean;
    registrationEnabled?: boolean;
    maxSchools?: number;
    systemName?: string;
    supportEmail?: string;
    features?: {
      faceRecognition?: boolean;
      smsNotifications?: boolean;
      emailNotifications?: boolean;
      parentPortal?: boolean;
      mobileApp?: boolean;
    };
  }) => api.put<ApiResponse>("/superadmin/system/settings", settings),

  // User management
  getAllUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    schoolId?: string;
    search?: string;
  }) => api.get<ApiResponse>("/superadmin/users", { params }),

  getUserById: (id: string) => api.get<ApiResponse>(`/superadmin/users/${id}`),

  updateUserStatus: (id: string, isActive: boolean) =>
    api.put<ApiResponse>(`/superadmin/users/${id}/status`, { isActive }),

  deleteUser: (id: string) =>
    api.delete<ApiResponse>(`/superadmin/users/${id}`),

  // System monitoring
  getSystemHealth: () => api.get<ApiResponse>("/superadmin/system/health"),

  getAuditLogs: (params?: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get<ApiResponse>("/superadmin/audit-logs", { params }),

  getOrangeSmsConfig: () => api.get<ApiResponse>("/superadmin/orange-sms"),

  updateOrangeSmsConfig: (data: {
    clientId?: string;
    clientSecret?: string;
    senderAddress?: string;
    senderName?: string;
    countryCode?: string;
  }) => api.put<ApiResponse>("/superadmin/orange-sms", data),

  sendOrangeSmsTest: (data: {
    phoneNumber: string;
    message: string;
    senderName?: string;
  }) => api.post<ApiResponse>("/superadmin/orange-sms/test", data),
};
