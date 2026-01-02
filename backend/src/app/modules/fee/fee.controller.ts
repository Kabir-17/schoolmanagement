import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../errors/AppError";
import feeStructureService from "./feeStructure.service";
import feeReportService from "./feeReport.service";
import StudentFeeRecord from "./studentFeeRecord.model";
import FeeTransaction from "./feeTransaction.model";
import feeTransactionService from "./feeTransaction.service";

/**
 * Fee Controller - Admin endpoints
 * Handles fee structure management and financial overview
 */

/**
 * Create fee structure
 */
export const createFeeStructure = catchAsync(async (req: Request, res: Response) => {
  const { school, grade, academicYear, feeComponents, dueDate, lateFeePercentage } = req.body;
  const createdBy = req.user?.id;

  if (!createdBy) {
    throw new AppError(401, "User not authenticated");
  }

  const feeStructure = await feeStructureService.createFeeStructure({
    school,
    grade,
    academicYear,
    feeComponents,
    dueDate,
    lateFeePercentage,
    createdBy,
  });

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Fee structure created successfully",
    data: feeStructure,
  });
});

/**
 * Get fee structure by ID
 */
export const getFeeStructure = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const feeStructure = await feeStructureService.getFeeStructureById(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Fee structure retrieved successfully",
    data: feeStructure,
  });
});

/**
 * Get all fee structures for school
 */
export const getFeeStructures = catchAsync(async (req: Request, res: Response) => {
  const { school, grade, academicYear, isActive } = req.query;

  const feeStructures = await feeStructureService.getFeeStructuresBySchool(
    school as string,
    {
      grade: grade as string,
      academicYear: academicYear as string,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
    }
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Fee structures retrieved successfully",
    data: feeStructures,
  });
});

/**
 * Update fee structure
 */
export const updateFeeStructure = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { feeComponents, dueDate, lateFeePercentage } = req.body;
  const updatedBy = req.user?.id;

  if (!updatedBy) {
    throw new AppError(401, "User not authenticated");
  }

  const feeStructure = await feeStructureService.updateFeeStructure(id, {
    feeComponents,
    dueDate,
    lateFeePercentage,
    updatedBy,
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Fee structure updated successfully",
    data: feeStructure,
  });
});

/**
 * Deactivate fee structure
 */
export const deactivateFeeStructure = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedBy = req.user?.id;

  if (!updatedBy) {
    throw new AppError(401, "User not authenticated");
  }

  const feeStructure = await feeStructureService.deactivateFeeStructure(id, updatedBy);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Fee structure deactivated successfully",
    data: feeStructure,
  });
});

/**
 * Clone fee structure to new academic year
 */
export const cloneFeeStructure = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { targetAcademicYear } = req.body;
  const createdBy = req.user?.id;

  if (!createdBy) {
    throw new AppError(401, "User not authenticated");
  }

  const feeStructure = await feeStructureService.cloneFeeStructure(
    id,
    targetAcademicYear,
    createdBy
  );

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Fee structure cloned successfully",
    data: feeStructure,
  });
});

/**
 * Get financial overview
 */
export const getFinancialOverview = catchAsync(async (req: Request, res: Response) => {
  const { school, academicYear, startDate, endDate } = req.query;

  const overview = await feeReportService.getFinancialOverview(
    school as string,
    academicYear as string,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Financial overview retrieved successfully",
    data: overview,
  });
});

/**
 * Get defaulters report
 */
export const getDefaultersReport = catchAsync(async (req: Request, res: Response) => {
  const { school, grade, minAmount, minDays, limit } = req.query;

  const report = await feeReportService.getDefaultersReport(school as string, {
    grade: grade as string,
    minAmount: minAmount ? parseInt(minAmount as string) : undefined,
    minDays: minDays ? parseInt(minDays as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Defaulters report retrieved successfully",
    data: report,
  });
});

/**
 * Get transactions
 */
export const getTransactions = catchAsync(async (req: Request, res: Response) => {
  const { school, student, collectedBy, transactionType, status, startDate, endDate } = req.query;

  const result = await feeTransactionService.getTransactions({
    school: school as string,
    student: student as string,
    collectedBy: collectedBy as string,
    transactionType: transactionType as any,
    status: status as any,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Transactions retrieved successfully",
    data: result,
  });
});

/**
 * Cancel transaction
 */
export const cancelTransaction = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const cancelledBy = req.user?.id;

  if (!cancelledBy) {
    throw new AppError(401, "User not authenticated");
  }

  const transaction = await feeTransactionService.cancelTransaction(id, cancelledBy, reason);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Transaction cancelled successfully",
    data: transaction,
  });
});

/**
 * Waive fee
 */
export const waiveFee = catchAsync(async (req: Request, res: Response) => {
  const { studentId, month, reason } = req.body;
  const waivedBy = req.user?.id;

  if (!waivedBy) {
    throw new AppError(401, "User not authenticated");
  }

  // Get current academic year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const academicYear = currentMonth >= 4 
    ? `${currentYear}-${currentYear + 1}` 
    : `${currentYear - 1}-${currentYear}`;

  const feeRecord = await StudentFeeRecord.findOne({
    student: studentId,
    academicYear,
  });

  if (!feeRecord) {
    return sendResponse(res, {
      success: false,
      statusCode: 404,
      message: "Student fee record not found",
      data: null,
    });
  }

  if (!waivedBy) {
    throw new AppError(401, "User not authenticated");
  }

  await feeRecord.waiveFee(month, reason, waivedBy);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Fee waived successfully",
    data: feeRecord,
  });
});

/**
 * Get fee collection rate
 */
export const getFeeCollectionRate = catchAsync(async (req: Request, res: Response) => {
  const { school, academicYear } = req.query;

  const rate = await feeReportService.getFeeCollectionRate(
    school as string,
    academicYear as string
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Fee collection rate retrieved successfully",
    data: rate,
  });
});

/**
 * Export transactions
 */
export const exportTransactions = catchAsync(async (req: Request, res: Response) => {
  const { school, startDate, endDate } = req.query;

  const csvData = await feeReportService.exportTransactionsCSV(
    school as string,
    new Date(startDate as string),
    new Date(endDate as string)
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Transactions exported successfully",
    data: csvData,
  });
});
