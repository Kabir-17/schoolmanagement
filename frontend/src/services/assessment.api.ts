import { api, ApiResponse } from "./api-base";

export const assessmentApi = {
  // Teacher operations
  getTeacherAssignments: () =>
    api.get<ApiResponse>("/assessments/teacher/assignments"),

  getTeacherAssessments: (params: {
    subjectId?: string;
    grade?: number;
    section?: string;
  }) => api.get<ApiResponse>("/assessments/teacher", { params }),

  getAssessmentDetails: (assessmentId: string) =>
    api.get<ApiResponse>(`/assessments/${assessmentId}`),

  createAssessment: (data: {
    subjectId: string;
    subjectName?: string;
    grade: number;
    section: string;
    examName: string;
    examDate: string;
    totalMarks: number;
    note?: string;
    categoryId?: string;
    categoryLabel?: string;
    academicYear?: string;
  }) => api.post<ApiResponse>("/assessments", data),

  updateAssessment: (assessmentId: string, data: Partial<{
    examName: string;
    examDate: string;
    totalMarks: number;
    note?: string | null;
    categoryId?: string | null;
    categoryLabel?: string | null;
    academicYear?: string;
  }>) => api.patch<ApiResponse>(`/assessments/${assessmentId}`, data),

  deleteAssessment: (assessmentId: string) =>
    api.delete<ApiResponse>(`/assessments/${assessmentId}`),

  submitAssessmentResults: (
    assessmentId: string,
    results: Array<{ studentId: string; marksObtained: number; remarks?: string }>
  ) =>
    api.post<ApiResponse>(`/assessments/${assessmentId}/results`, {
      results,
    }),

  exportAssessment: (assessmentId: string, format: "csv" | "xlsx" = "csv") =>
    api.get<Blob>(`/assessments/${assessmentId}/export`, {
      params: { format },
      responseType: "blob",
    }),

  getPerformanceMatrix: (params: {
    subjectId: string;
    grade: number;
    section: string;
  }) => api.get<ApiResponse>("/assessments/teacher/performance", { params }),

  exportTeacherAssessments: (params: {
    subjectId: string;
    grade: number;
    section: string;
    format?: "csv" | "xlsx";
  }) =>
    api.get<Blob>("/assessments/teacher/export", {
      params,
      responseType: "blob",
    }),

  getAdminClassCatalog: () => api.get<ApiResponse>("/assessments/admin/classes"),

  // Categories
  getCategories: () => api.get<ApiResponse>("/assessments/categories"),

  createCategory: (data: {
    name: string;
    description?: string;
    order?: number;
    isDefault?: boolean;
  }) => api.post<ApiResponse>("/assessments/categories", data),

  updateCategory: (categoryId: string, data: Partial<{
    name: string;
    description?: string;
    order?: number;
    isActive?: boolean;
    isDefault?: boolean;
  }>) => api.patch<ApiResponse>(`/assessments/categories/${categoryId}`, data),

  // Admin
  getAdminAssessments: (params: {
    grade?: number;
    section?: string;
    subjectId?: string;
    categoryId?: string;
    teacherId?: string;
    search?: string;
    includeHidden?: boolean;
    onlyFavorites?: boolean;
    fromDate?: string;
    toDate?: string;
    sortBy?: "examDate" | "averagePercentage" | "totalMarks" | "gradedCount" | "examName";
    sortDirection?: "asc" | "desc";
  }) => api.get<ApiResponse>("/assessments/admin", { params }),

  exportAdminAssessments: (params: {
    grade?: number;
    section?: string;
    subjectId?: string;
    categoryId?: string;
    teacherId?: string;
    search?: string;
    includeHidden?: boolean;
    onlyFavorites?: boolean;
    fromDate?: string;
    toDate?: string;
    sortBy?: "examDate" | "averagePercentage" | "totalMarks" | "gradedCount" | "examName";
    sortDirection?: "asc" | "desc";
    assessmentIds?: string[];
    format?: "csv" | "xlsx";
  }) =>
    api.get<Blob>("/assessments/admin/export", {
      params,
      responseType: "blob",
    }),

  updateAdminAssessmentPreference: (
    assessmentId: string,
    payload: { isFavorite?: boolean; isHidden?: boolean }
  ) =>
    api.patch<ApiResponse>(`/assessments/admin/${assessmentId}/preferences`, payload),

  // Student & parent
  getStudentAssessments: (studentId?: string) =>
    studentId
      ? api.get<ApiResponse>(`/assessments/student/${studentId}`)
      : api.get<ApiResponse>("/assessments/student"),
};

export default assessmentApi;
