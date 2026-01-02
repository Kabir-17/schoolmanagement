import apiClient from "./api-base";

// ============================================
// FEE STRUCTURE ENDPOINTS (Admin)
// ============================================

/**
 * Create a new fee structure
 */
export const createFeeStructure = async (data: {
  school: string;
  grade: string;
  academicYear: string;
  feeComponents: Array<{
    feeType: string;
    amount: number;
    description?: string;
    isMandatory: boolean;
    isOneTime: boolean;
  }>;
  dueDate: number;
  lateFeePercentage: number;
}) => {
  const response = await apiClient.post("/fees/structures", data);
  return response.data;
};

/**
 * Get fee structure by ID
 */
export const getFeeStructure = async (id: string) => {
  const response = await apiClient.get(`/fees/structures/${id}`);
  return response.data;
};

/**
 * Get all fee structures for a school
 */
export const getFeeStructures = async (params: {
  school: string;
  grade?: string;
  academicYear?: string;
  isActive?: boolean;
}) => {
  const response = await apiClient.get("/fees/structures", { params });
  return response.data;
};

/**
 * Update fee structure
 */
export const updateFeeStructure = async (
  id: string,
  data: {
    feeComponents?: Array<{
      feeType: string;
      amount: number;
      description?: string;
      isMandatory: boolean;
      isOneTime: boolean;
    }>;
    dueDate?: number;
    lateFeePercentage?: number;
  }
) => {
  const response = await apiClient.patch(`/fees/structures/${id}`, data);
  return response.data;
};

/**
 * Deactivate fee structure
 */
export const deactivateFeeStructure = async (id: string) => {
  const response = await apiClient.delete(`/fees/structures/${id}`);
  return response.data;
};

/**
 * Clone fee structure to new academic year
 */
export const cloneFeeStructure = async (id: string, targetAcademicYear: string) => {
  const response = await apiClient.post(`/fees/structures/${id}/clone`, {
    targetAcademicYear,
  });
  return response.data;
};

// ============================================
// FINANCIAL REPORTS ENDPOINTS (Admin)
// ============================================

/**
 * Get financial overview
 */
export const getFinancialOverview = async (params: {
  school: string;
  academicYear: string;
  startDate?: string;
  endDate?: string;
}) => {
  const response = await apiClient.get("/fees/financial-overview", { params });
  return response.data;
};

/**
 * Get defaulters report
 */
export const getDefaultersReport = async (params: {
  school: string;
  grade?: string;
  minAmount?: number;
  minDays?: number;
  limit?: number;
}) => {
  const response = await apiClient.get("/fees/defaulters", { params });
  return response.data;
};

/**
 * Get fee collection rate
 */
export const getFeeCollectionRate = async (params: {
  school: string;
  academicYear: string;
}) => {
  const response = await apiClient.get("/fees/collection-rate", { params });
  return response.data;
};

/**
 * Get transactions
 */
export const getTransactions = async (params: {
  school?: string;
  student?: string;
  collectedBy?: string;
  transactionType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const response = await apiClient.get("/fees/transactions", { params });
  return response.data;
};

/**
 * Cancel transaction
 */
export const cancelTransaction = async (id: string, reason: string) => {
  const response = await apiClient.post(`/fees/transactions/${id}/cancel`, {
    reason,
  });
  return response.data;
};

/**
 * Waive fee for a student
 */
export const waiveFee = async (data: {
  studentId: string;
  month: number;
  reason: string;
}) => {
  const response = await apiClient.post("/fees/waive", data);
  return response.data;
};

/**
 * Export transactions to CSV
 */
export const exportTransactions = async (params: {
  school: string;
  startDate: string;
  endDate: string;
}) => {
  const response = await apiClient.get("/fees/transactions/export", { params });
  return response.data;
};

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
 * Get student detailed fee status (including one-time fees)
 */
export const getStudentFeeStatusDetailed = async (studentId: string) => {
  const response = await apiClient.get(
    `/accountant-fees/student-fee-status/${studentId}`
  );
  return response.data;
};

/**
 * Collect one-time fee (admission, annual, etc.)
 */
export const collectOneTimeFee = async (data: {
  studentId: string;
  feeType: string;
  amount: number;
  paymentMethod: string;
  remarks?: string;
}) => {
  const response = await apiClient.post("/accountant-fees/collect-one-time", data);
  return response.data;
};

/**
 * Get parent's children fee status
 */
export const getParentChildrenFees = async () => {
  const response = await apiClient.get("/accountant-fees/parent-children-fees");
  return response.data;
};

// Export all functions
export default {
  // Fee Structure
  createFeeStructure,
  getFeeStructure,
  getFeeStructures,
  updateFeeStructure,
  deactivateFeeStructure,
  cloneFeeStructure,
  
  // Financial Reports
  getFinancialOverview,
  getDefaultersReport,
  getFeeCollectionRate,
  getTransactions,
  cancelTransaction,
  waiveFee,
  exportTransactions,
  
  // Accountant Fee Collection
  searchStudent,
  getStudentFeeStatus,
  validateFeeCollection,
  collectFee,
  getAccountantTransactions,
  getDailyCollectionSummary,
  getReceipt,
  getStudentFeeStatusDetailed,
  collectOneTimeFee,
  getParentChildrenFees,
};
