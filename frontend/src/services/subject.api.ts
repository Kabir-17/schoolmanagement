import { api, ApiResponse } from "./api-base";

// Subject API service
export const subjectApi = {
  // Get all subjects for the school
  getAll: (params?: {
    grade?: number;
    isActive?: boolean;
    isCore?: boolean;
  }) => api.get<ApiResponse>("/subjects", { params }),

  // Get subjects by grade
  getByGrade: (schoolId: string, grade: number) => 
    api.get<ApiResponse>(`/subjects/school/${schoolId}/grade/${grade}`),

  // Get subject by ID
  getById: (id: string) => api.get<ApiResponse>(`/subjects/${id}`),

  // Create subject (admin only)
  create: (data: {
    name: string;
    code: string;
    description?: string;
    grades: number[];
    isCore: boolean;
    credits?: number;
    teachers?: string[];
  }) => api.post<ApiResponse>("/subjects", data),

  // Update subject (admin only)
  update: (id: string, data: {
    name?: string;
    code?: string;
    description?: string;
    grades?: number[];
    isCore?: boolean;
    credits?: number;
    teachers?: string[];
    isActive?: boolean;
  }) => api.put<ApiResponse>(`/subjects/${id}`, data),

  // Delete subject (admin only)
  delete: (id: string) => api.delete<ApiResponse>(`/subjects/${id}`),
};