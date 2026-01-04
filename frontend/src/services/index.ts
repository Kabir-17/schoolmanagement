// Centralized API service exports
import { authApi } from "./auth.api";
import { studentApi } from "./student.api";
import { teacherApi } from "./teacher.api";
import { adminApi } from "./admin.api";
import { superadminApi } from "./superadmin.api";
import { parentApi } from "./parent.api";
import { eventAPI } from "./event.api";
import { api } from "./api-base";
import accountantApi from "./accountant.api";
import feeApi from "./fee.api";
import { configApi } from "./config.api";
import assessmentApi from "./assessment.api";
import messagingApi from "./messaging.api";

export {
  authApi,
  studentApi,
  teacherApi,
  adminApi,
  superadminApi,
  parentApi,
  eventAPI,
  api,
  accountantApi,
  assessmentApi,
  messagingApi,
  configApi,
};
export type { ApiResponse } from "./api-base";

// Legacy compatibility - Re-export as apiService for existing components
export const apiService = {
  // Authentication
  login: authApi.login,
  logout: authApi.logout,
  verify: authApi.verify,
  forcePasswordChange: authApi.forcePasswordChange,

  // Superadmin routes
  superadmin: {
    getStats: superadminApi.getStats,
    getSystemStats: superadminApi.getSystemStats,
    createSchool: superadminApi.createSchool,
    getSchools: superadminApi.getSchools,
    getSchool: superadminApi.getSchool,
    updateSchool: superadminApi.updateSchool,
    deleteSchool: superadminApi.deleteSchool,
    updateSchoolStatus: superadminApi.updateSchoolStatus,
    getSchoolStats: superadminApi.getSchoolStats,
    getSchoolDetails: superadminApi.getSchoolDetails,
    assignAdmin: superadminApi.assignAdmin,
    getAdminCredentials: superadminApi.getAdminCredentials,
    resetAdminPassword: superadminApi.resetAdminPassword,
    resetPassword: superadminApi.resetAdminPassword,
    regenerateApiKey: superadminApi.regenerateApiKey,
    getSystemSettings: superadminApi.getSystemSettings,
    updateSystemSettings: superadminApi.updateSystemSettings,
    getAllSchools: superadminApi.getSchools,
    assignSchoolAdmin: superadminApi.assignAdmin,
    getOrangeSmsConfig: superadminApi.getOrangeSmsConfig,
    updateOrangeSmsConfig: superadminApi.updateOrangeSmsConfig,
    sendOrangeSmsTest: superadminApi.sendOrangeSmsTest,
  },

  // Admin routes
  admin: {
    getDashboard: adminApi.getDashboard,
    createStudent: (data: any) => {
      // Check if data is FormData
      if (data instanceof FormData) {
        return studentApi.createWithPhotos(data);
      }
      return studentApi.create(data);
    },
    getStudents: studentApi.getAll,
    updateStudent: studentApi.update,
    deleteStudent: studentApi.delete,
    createTeacher: teacherApi.create,
    getTeachers: teacherApi.getAll,
    updateTeacher: teacherApi.update,
    deleteTeacher: teacherApi.delete,
    createSubject: adminApi.createSubject,
    getSubjects: adminApi.getSubjects,
    updateSubject: adminApi.updateSubject,
    deleteSubject: adminApi.deleteSubject,
    createSchedule: adminApi.createSchedule,
    getSchedules: adminApi.getSchedules,
    updateSchedule: adminApi.updateSchedule,
    deleteSchedule: adminApi.deleteSchedule,
    clearClassSchedule: adminApi.clearClassSchedule,
    getAbsenceSmsLogs: adminApi.getAbsenceSmsLogs,
    getAbsenceSmsOverview: adminApi.getAbsenceSmsOverview,
    triggerAbsenceSmsRun: adminApi.triggerAbsenceSmsRun,
    sendAbsenceSmsTest: adminApi.sendAbsenceSmsTest,
    createCalendarEvent: adminApi.createCalendarEvent,
    getCalendarEvents: adminApi.getCalendarEvents,
    updateCalendarEvent: adminApi.updateCalendarEvent,
    deleteCalendarEvent: adminApi.deleteCalendarEvent,
  },

  // Teacher routes
  teacher: {
    getDashboard: teacherApi.getDashboard,
    getClasses: teacherApi.getClasses,
    getAttendance: teacherApi.getAttendance,
    markAttendance: teacherApi.markAttendance,
    updateAttendance: teacherApi.updateAttendance,
    getSchedule: teacherApi.getSchedule,
    createHomework: teacherApi.createHomework,
    getHomework: teacherApi.getHomework,
    createGrade: teacherApi.createGrade,
    getGrades: teacherApi.getGrades,
  },

  // Student routes
  student: {
    getDashboard: studentApi.getDashboard,
    getAttendance: studentApi.getAttendance,
    getGrades: studentApi.getGrades,
    getHomework: studentApi.getHomework,
    getSchedule: studentApi.getSchedule,
    getCalendar: studentApi.getCalendar,
    getProfile: studentApi.getProfile,
  },

  // Parent routes
  parent: {
    getDashboard: parentApi.getDashboard,
    getChildren: parentApi.getChildren,
    getChildAttendance: parentApi.getChildAttendance,
    getChildGrades: parentApi.getChildGrades,
    getChildHomework: parentApi.getChildHomework,
    getChildNotices: parentApi.getChildNotices,
  },

  // Accountant routes
  accountant: {
    getDashboard: accountantApi.getDashboard,
    searchStudent: accountantApi.searchStudent,
    getStudentFeeStatus: accountantApi.getStudentFeeStatus,
    validateFeeCollection: accountantApi.validateFeeCollection,
    collectFee: accountantApi.collectFee,
    getTransactions: accountantApi.getAccountantTransactions,
    getDailyCollectionSummary: accountantApi.getDailyCollectionSummary,
    getReceipt: accountantApi.getReceipt,
    getStudentsByGradeSection: accountantApi.getStudentsByGradeSection,
    getDefaulters: accountantApi.getDefaulters,
    getFinancialReports: accountantApi.getFinancialReports,
  },

  // Fee routes
  fee: {
    getStudentFeeStatusDetailed: feeApi.getStudentFeeStatusDetailed,
    collectOneTimeFee: feeApi.collectOneTimeFee,
    getParentChildrenFees: feeApi.getParentChildrenFees,
    createFeeStructure: feeApi.createFeeStructure,
    getFeeStructure: feeApi.getFeeStructure,
    getFeeStructures: feeApi.getFeeStructures,
    updateFeeStructure: feeApi.updateFeeStructure,
    deactivateFeeStructure: feeApi.deactivateFeeStructure,
    cloneFeeStructure: feeApi.cloneFeeStructure,
  },

  // Public configuration
  config: {
    getPublicConfig: configApi.getPublicConfig,
  },

  // Messaging
  messaging: {
    listContacts: messagingApi.listContacts,
    listThreads: messagingApi.listThreads,
    createThread: messagingApi.createThread,
    listMessages: messagingApi.listMessages,
    sendMessage: messagingApi.sendMessage,
  },
};

export default api;
