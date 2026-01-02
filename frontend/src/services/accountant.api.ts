/**
 * Accountant API Service
 * Handles all accountant-specific API calls for fee collection
 */

import apiClient from "./api-base";

// ============================================
// ACCOUNTANT FEE COLLECTION ENDPOINTS
// ============================================

/**
 * Search student by student ID
 */
export const searchStudent = async (studentId: string) => {
  const response = await apiClient.get("/accountant-fees/students/search", {
    params: { studentId },
  });
  return response.data;
};

/**
 * Get student fee status
 */
export const getStudentFeeStatus = async (
  studentId: string,
  academicYear?: string
) => {
  const response = await apiClient.get(
    `/accountant-fees/students/${studentId}/fee-status`,
    {
      params: academicYear ? { academicYear } : undefined,
    }
  );
  return response.data;
};

/**
 * Validate fee collection before processing
 */
export const validateFeeCollection = async (data: {
  studentId: string;
  month: number;
  amount: number;
  includeLateFee?: boolean;
}) => {
  const response = await apiClient.post("/accountant-fees/validate", data);
  return response.data;
};

/**
 * Collect fee payment
 */
export const collectFee = async (data: {
  studentId: string;
  month: number;
  amount: number;
  paymentMethod: string;
  remarks?: string;
  includeLateFee?: boolean;
}) => {
  const response = await apiClient.post("/accountant-fees/collect", data);
  return response.data;
};

/**
 * Get accountant's transactions
 */
export const getAccountantTransactions = async (params?: {
  startDate?: string;
  endDate?: string;
  status?: string;
}) => {
  const response = await apiClient.get("/accountant-fees/transactions", {
    params,
  });
  return response.data;
};

/**
 * Get daily collection summary
 */
export const getDailyCollectionSummary = async (date?: string) => {
  const response = await apiClient.get("/accountant-fees/daily-summary", {
    params: date ? { date } : undefined,
  });
  return response.data;
};

/**
 * Get receipt by transaction ID
 */
export const getReceipt = async (transactionId: string) => {
  const response = await apiClient.get(
    `/accountant-fees/receipt/${transactionId}`
  );
  return response.data;
};

/**
 * Get accountant dashboard data
 */
export const getDashboard = async () => {
  const response = await apiClient.get("/accountant-fees/dashboard");
  return response.data;
};

/**
 * Get students by grade and section
 */
export const getStudentsByGradeSection = async (params?: {
  grade?: number;
  section?: string;
}) => {
  const response = await apiClient.get("/accountant-fees/students", {
    params,
  });
  return response.data;
};

/**
 * Get defaulters list
 */
export const getDefaulters = async () => {
  const response = await apiClient.get("/accountant-fees/defaulters");
  return response.data;
};

/**
 * Get financial reports
 */
export const getFinancialReports = async (params?: {
  reportType?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const response = await apiClient.get("/accountant-fees/reports", {
    params,
  });
  return response.data;
};

// Export all functions as default
export default {
  searchStudent,
  getStudentFeeStatus,
  validateFeeCollection,
  collectFee,
  getAccountantTransactions,
  getDailyCollectionSummary,
  getReceipt,
  getDashboard,
  getStudentsByGradeSection,
  getDefaulters,
  getFinancialReports,
};
