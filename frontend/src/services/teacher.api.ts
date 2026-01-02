import { api, ApiResponse } from "./api-base";

// Teacher API service
export const teacherApi = {
  // Admin endpoints for teacher management
  getClasses: () => api.get<ApiResponse>("/teachers/my-classes"),
  create: (data: {
    schoolId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    employeeId?: string;
    subjects: string[];
    grades: number[];
    sections: string[];
    designation: string;
    bloodGroup: string;
    dob: string;
    joinDate?: string;
    qualifications: Array<{
      degree: string;
      institution: string;
      year: number;
      specialization?: string;
    }>;
    experience: {
      totalYears: number;
      previousSchools?: Array<{
        schoolName: string;
        position: string;
        duration: string;
        fromDate: string;
        toDate: string;
      }>;
    };
    address: {
      street?: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
      email?: string;
    };
    salary?: {
      basic: number;
      allowances?: number;
      deductions?: number;
    };
    isClassTeacher?: boolean;
    classTeacherFor?: {
      grade: number;
      section: string;
    };
    photos?: File[];
  }) => {
    const formData = new FormData();

    // Add all teacher data fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === "photos" && value) {
        // Handle photo files
        (value as File[]).forEach((file) => {
          formData.append("photos", file);
        });
      } else if (typeof value === "object" && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    return api.post<ApiResponse>("/teachers", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getAll: (params?: {
    page?: number;
    limit?: number;
    subject?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get<ApiResponse>("/teachers", { params }),

  getById: (id: string) => api.get<ApiResponse>(`/teachers/${id}`),

  update: (
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      employeeId?: string;
      subjects?: string[];
      grades?: number[];
      sections?: string[];
      designation?: string;
      bloodGroup?: string;
      dob?: string;
      joinDate?: string;
      qualifications?: Array<{
        degree: string;
        institution: string;
        year: number;
        specialization?: string;
      }>;
      experience?: {
        totalYears: number;
        previousSchools?: Array<{
          schoolName: string;
          position: string;
          duration: string;
          fromDate: string;
          toDate: string;
        }>;
      };
      address?: {
        street?: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
      };
      emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
        email?: string;
      };
      salary?: {
        basic: number;
        allowances?: number;
        deductions?: number;
      };
      isClassTeacher?: boolean;
      classTeacherFor?: {
        grade: number;
        section: string;
      };
      isActive?: boolean;
    }
  ) => api.patch<ApiResponse>(`/teachers/${id}`, data),

  // Full update with form data (for photo updates)
  updateWithFormData: (id: string, formData: FormData) => {
    return api.patch<ApiResponse>(`/teachers/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  delete: (id: string) => api.delete<ApiResponse>(`/teachers/${id}`),

  // Teacher dashboard endpoints
  getDashboard: () => api.get<ApiResponse>("/teachers/dashboard"),
  getMyClasses: () => api.get<ApiResponse>("/teachers/my-classes"),

  // Attendance management
  getAttendance: (classId: string) =>
    api.get<ApiResponse>(`/teacher/attendance/class/${classId}`),
  markAttendance: (data: {
    classId: string;
    date: string;
    students: Array<{
      studentId: string;
      status: "present" | "absent" | "late";
    }>;
  }) => api.post<ApiResponse>("/teacher/attendance", data),
  updateAttendance: (id: string, data: any) =>
    api.put<ApiResponse>(`/teacher/attendance/${id}`, data),

  // Schedule management
  getSchedule: () => api.get<ApiResponse>("/teacher/schedule"),

  // Homework management
  createHomework: (data: {
    classId: string;
    subjectId: string;
    title: string;
    description: string;
    dueDate: string;
    attachments?: File[];
  }) => api.post<ApiResponse>("/teacher/homework", data),
  getHomework: () => api.get<ApiResponse>("/teacher/homework"),

  // Grade management
  createGrade: (data: {
    studentId: string;
    subjectId: string;
    examType: string;
    marks: number;
    totalMarks: number;
    grade: string;
  }) => api.post<ApiResponse>("/teacher/grades", data),
  getGrades: () => api.get<ApiResponse>("/teacher/grades"),

  getStats: () => api.get<ApiResponse>("/teachers/stats"),

  // Photo management
  uploadPhotos: (teacherId: string, photos: File[]) => {
    const formData = new FormData();
    photos.forEach((photo) => {
      formData.append("photos", photo);
    });
    return api.post<ApiResponse>(
      `/teachers/${teacherId}/photos`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  getPhotos: (teacherId: string) =>
    api.get<ApiResponse>(`/teachers/${teacherId}/photos`),

  deletePhoto: (teacherId: string, photoId: string) =>
    api.delete<ApiResponse>(`/teachers/${teacherId}/photos/${photoId}`),

  getAvailablePhotoSlots: (teacherId: string) =>
    api.get<ApiResponse>(`/teachers/${teacherId}/photos/available-slots`),

  // Credentials management
  getCredentials: (teacherId: string) =>
    api.get<ApiResponse>(`/teachers/${teacherId}/credentials`),

  resetPassword: (teacherId: string) =>
    api.post<ApiResponse>(`/teachers/${teacherId}/credentials/reset`),

  // Teacher Dashboard APIs (for logged-in teachers)
  getTeacherDashboard: () => api.get<ApiResponse>("/teachers/dashboard"),
  
  getTeacherSchedule: (params?: { date?: string }) => 
    api.get<ApiResponse>("/teachers/my-schedule", { params }),
  
  getTeacherClasses: () => api.get<ApiResponse>("/teachers/my-classes"),

  // Attendance APIs
  getCurrentPeriods: () => api.get<ApiResponse>("/teachers/attendance/periods"),
  
  markStudentAttendance: (attendanceData: {
    classId: string;
    subjectId: string;
    grade: number;
    section: string;
    date: string;
    period: number;
    students: Array<{
      studentId: string;
      status: "present" | "absent" | "late" | "excused";
    }>;
  }) => api.post<ApiResponse>("/teachers/attendance/mark", attendanceData),

  // Get teacher's students for attendance (simplified)
  getMyStudentsForAttendance: () =>
    api.get<ApiResponse>("/teachers/attendance/my-students"),
  
  getStudentsForAttendance: (classId: string, subjectId: string, period: number) =>
    api.get<ApiResponse>(`/teachers/attendance/students/${classId}/${subjectId}/${period}`),

  // Homework APIs
  assignHomework: (formData: FormData) => {
    return api.post<ApiResponse>("/homework/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getMyHomeworkAssignments: (params?: {
    grade?: string;
    section?: string;
    subjectId?: string;
    isPublished?: boolean;
    priority?: string;
    homeworkType?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get<ApiResponse>("/homework/teacher/my-homework", { params }),

  assignNewHomework: (homeworkData: {
    title: string;
    description: string;
    grade: string;
    section: string;
    subject: string;
    dueDate: string;
    attachments?: File[];
  }) => {
    const formData = new FormData();
    Object.entries(homeworkData).forEach(([key, value]) => {
      if (key === "attachments" && value) {
        (value as File[]).forEach((file) => {
          formData.append("attachments", file);
        });
      } else if (value !== undefined) {
        formData.append(key, String(value));
      }
    });
    return api.post<ApiResponse>("/teachers/homework/assign", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getTeacherHomeworkAssignments: () => api.get<ApiResponse>("/teachers/homework/my-assignments"),

  updateHomework: (id: string, formData: FormData) => {
    return api.patch<ApiResponse>(`/homework/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteHomework: (id: string) => api.delete<ApiResponse>(`/homework/${id}`),

  publishHomework: (id: string) => api.patch<ApiResponse>(`/homework/${id}/publish`),

  getHomeworkById: (id: string) => api.get<ApiResponse>(`/homework/${id}`),

  getHomeworkSubmissions: (id: string) => api.get<ApiResponse>(`/homework/${id}/submissions`),

  gradeHomeworkSubmission: (data: {
    submissionId: string;
    marksObtained: number;
    feedback?: string;
    teacherComments?: string;
  }) => api.post<ApiResponse>("/homework/grade", data),

  // Disciplinary Actions APIs
  getTeacherStudents: () => api.get<ApiResponse>("/teachers/discipline/students"),
  
  issueWarning: (warningData: {
    studentIds: string[];
    warningType: string;
    severity: "low" | "medium" | "high";
    reason: string;
    description: string;
    notifyParents: boolean;
  }) => api.post<ApiResponse>("/teachers/discipline/warning", warningData),

  getIssuedWarnings: () => api.get<ApiResponse>("/teachers/discipline/warnings"),

  // Grading APIs
  getAssignedExams: () => api.get<ApiResponse>("/teachers/grading/exams"),
  
  getExamGradingDetails: (examId: string) => api.get<ApiResponse>(`/teachers/grading/exam/${examId}`),
  
  submitExamGrades: (gradesData: {
    examId: string;
    grades: Array<{
      studentId: string;
      obtainedMarks: number;
      percentage: number;
      grade: string;
      remarks?: string;
    }>;
  }) => api.post<ApiResponse>("/teachers/grading/submit", gradesData),
  
  submitStudentGrades: (gradesData: {
    examId: string;
    subject: string;
    grades: Array<{
      studentId: string;
      marks: number;
      grade: string;
    }>;
  }) => api.post<ApiResponse>("/teachers/grading/submit-legacy", gradesData),

  // Grading Tasks from Academic Calendar
  getMyGradingTasks: () => api.get<ApiResponse>("/teachers/grading/tasks"),
  
  // Enhanced grade submission with notifications
  submitGrades: (data: {
    examId: string;
    grades: Array<{
      studentId: string;
      obtainedMarks: number;
      percentage: number;
      grade: string;
      remarks?: string;
    }>;
    publishImmediately?: boolean;
  }) => api.post<ApiResponse>("/teachers/grading/submit-enhanced", data),
  
  // Publish grades to students and parents
  publishGrades: (examId: string) => api.post<ApiResponse>(`/teachers/grading/${examId}/publish`),
  
  // Disciplinary Actions
  getMyDisciplinaryActions: (filters?: {
    actionType?: string;
    severity?: string;
    status?: string;
    isRedWarrant?: boolean;
  }) => api.get<ApiResponse>("/teachers/discipline/my-actions", { params: filters }),
  
  resolveDisciplinaryAction: (actionId: string, data: { resolutionNotes: string }) =>
    api.patch<ApiResponse>(`/teachers/discipline/resolve/${actionId}`, data),
  
  addDisciplinaryActionComment: (actionId: string, data: { comment: string }) =>
    api.post<ApiResponse>(`/teachers/discipline/comment/${actionId}`, data),
  
  // Events
  getEvents: () => api.get<ApiResponse>("/teachers/events"),

  // Generic HTTP methods for flexibility
  get: (endpoint: string) => api.get<ApiResponse>(endpoint),
  post: (endpoint: string, data?: any) => api.post<ApiResponse>(endpoint, data),
};
