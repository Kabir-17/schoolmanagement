import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import {sendResponse} from "../../utils/sendResponse";
import feeCollectionService from "./feeCollection.service";

/**
 * Accountant Fee Controller
 * Handles fee collection operations by accountants
 */

/**
 * Search student by student ID
 */
export const searchStudent = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.query;
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    throw new Error("School ID is required");
  }

  const student = await feeCollectionService.searchStudent(
    studentId as string,
    schoolId
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Student found successfully",
    data: student,
  });
});

/**
 * Get student fee status
 */
export const getStudentFeeStatus = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { academicYear } = req.query;
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    throw new Error("School ID is required");
  }

  const status = await feeCollectionService.getStudentFeeStatus(
    studentId,
    schoolId,
    academicYear as string
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Student fee status retrieved successfully",
    data: status,
  });
});

/**
 * Validate fee collection
 */
export const validateFeeCollection = catchAsync(async (req: Request, res: Response) => {
  const { studentId, month, amount, includeLateFee } = req.body;
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    throw new Error("School ID is required");
  }

  const validation = await feeCollectionService.validateFeeCollection(
    studentId,
    schoolId,
    month,
    amount,
    includeLateFee || false
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Fee collection validated",
    data: validation,
  });
});

/**
 * Collect fee
 */
export const collectFee = catchAsync(async (req: Request, res: Response) => {
  const { studentId, month, amount, paymentMethod, remarks, includeLateFee } = req.body;
  const schoolId = req.user?.schoolId;
  const collectedBy = req.user?.id;

  if (!schoolId || !collectedBy) {
    throw new Error("School ID and Collector ID are required");
  }

  // Get audit information
  const auditInfo = {
    ipAddress: req.ip || req.socket.remoteAddress,
    deviceInfo: req.headers["user-agent"],
  };

  const result = await feeCollectionService.collectFee({
    studentId,
    schoolId,
    month,
    amount,
    paymentMethod,
    collectedBy,
    remarks,
    includeLateFee: includeLateFee || false,
    auditInfo,
  });

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Fee collected successfully",
    data: result,
  });
});

/**
 * Get accountant's transactions
 */
export const getAccountantTransactions = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const accountantId = req.user?.id;
  const schoolId = req.user?.schoolId;

  if (!accountantId || !schoolId) {
    throw new Error("Accountant ID and School ID are required");
  }

  const start = startDate ? new Date(startDate as string) : new Date();
  start.setHours(0, 0, 0, 0);

  const end = endDate ? new Date(endDate as string) : new Date();
  end.setHours(23, 59, 59, 999);

  const transactions = await feeCollectionService.getAccountantTransactions(
    accountantId,
    schoolId,
    start,
    end
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Transactions retrieved successfully",
    data: transactions,
  });
});

/**
 * Get daily collection summary
 */
export const getDailyCollectionSummary = catchAsync(async (req: Request, res: Response) => {
  const { date } = req.query;
  const accountantId = req.user?.id;
  const schoolId = req.user?.schoolId;

  if (!accountantId || !schoolId) {
    throw new Error("Accountant ID and School ID are required");
  }

  const targetDate = date ? new Date(date as string) : new Date();

  const summary = await feeCollectionService.getDailyCollectionSummary(
    accountantId,
    schoolId,
    targetDate
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Daily collection summary retrieved successfully",
    data: summary,
  });
});

/**
 * Get receipt by transaction ID
 */
export const getReceipt = catchAsync(async (req: Request, res: Response) => {
  const { transactionId } = req.params;
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    throw new Error("School ID is required");
  }

  const receipt = await feeCollectionService.getStudentFeeStatus(
    transactionId,
    schoolId
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Receipt retrieved successfully",
    data: receipt,
  });
});

/**
 * Get accountant dashboard data
 */
export const getDashboard = catchAsync(async (req: Request, res: Response) => {
  const accountantId = req.user?.id;
  const schoolId = req.user?.schoolId;

  if (!accountantId || !schoolId) {
    throw new Error("Accountant ID and School ID are required");
  }

  const dashboardData = await feeCollectionService.getAccountantDashboard(
    accountantId,
    schoolId
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Dashboard data retrieved successfully",
    data: dashboardData,
  });
});

/**
 * Get all students by grade and section for fee collection
 */
export const getStudentsByGradeSection = catchAsync(async (req: Request, res: Response) => {
  const { grade, section } = req.query;
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    throw new Error("School ID is required");
  }

  const students = await feeCollectionService.getStudentsByGradeSection(
    schoolId,
    grade ? Number(grade) : undefined,
    section as string
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Students retrieved successfully",
    data: students,
  });
});

/**
 * Get defaulters list
 */
export const getDefaulters = catchAsync(async (req: Request, res: Response) => {
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    throw new Error("School ID is required");
  }

  const defaulters = await feeCollectionService.getDefaulters(schoolId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Defaulters retrieved successfully",
    data: defaulters,
  });
});

/**
 * Get financial reports (daily, weekly, monthly, yearly)
 */
export const getFinancialReports = catchAsync(async (req: Request, res: Response) => {
  const { reportType, startDate, endDate } = req.query;
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    throw new Error("School ID is required");
  }

  const reports = await feeCollectionService.getFinancialReports(
    schoolId,
    reportType as string || 'monthly',
    startDate as string,
    endDate as string
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Financial reports retrieved successfully",
    data: reports,
  });
});

/**
 * Collect one-time fee (admission, annual, etc.)
 */
export const collectOneTimeFee = catchAsync(async (req: Request, res: Response) => {
  const { studentId, feeType, amount, paymentMethod, remarks } = req.body;
  const schoolId = req.user?.schoolId;
  const collectedBy = req.user?.id;

  if (!schoolId || !collectedBy) {
    throw new Error("School ID and Collector ID are required");
  }

  // Get audit information
  const auditInfo = {
    ipAddress: req.ip || req.socket.remoteAddress,
    deviceInfo: req.headers["user-agent"],
  };

  const result = await feeCollectionService.collectOneTimeFee({
    studentId,
    schoolId,
    feeType,
    amount,
    paymentMethod,
    collectedBy,
    remarks,
    auditInfo,
  });

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: `${feeType} fee collected successfully`,
    data: result,
  });
});

/**
 * Get student fee status (detailed)
 */
export const getStudentFeeStatusDetailed = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    throw new Error("School ID is required");
  }

  const feeStatus = await feeCollectionService.getStudentFeeStatusDetailed(
    studentId,
    schoolId
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Student fee status retrieved successfully",
    data: feeStatus,
  });
});

/**
 * Get parent's children fee status
 */
export const getParentChildrenFeeStatus = catchAsync(async (req: Request, res: Response) => {
  const parentId = req.user?.id;
  const schoolId = req.user?.schoolId;

  if (!parentId || !schoolId) {
    throw new Error("Parent ID and School ID are required");
  }

  const childrenFees = await feeCollectionService.getParentChildrenFeeStatus(
    parentId,
    schoolId
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Children fee status retrieved successfully",
    data: childrenFees,
  });
});

