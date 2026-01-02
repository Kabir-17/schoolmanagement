import { z } from "zod";
import { FeeType, PaymentMethod, TransactionType, Month } from "./fee.interface";

/**
 * Fee Component Validation Schema
 */
export const feeComponentSchema = z.object({
  feeType: z.nativeEnum(FeeType, {
    errorMap: () => ({ message: "Invalid fee type" }),
  }),
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .min(0, "Amount must be non-negative"),
  description: z.string().trim().optional(),
  isMandatory: z.boolean().default(true),
  isOneTime: z.boolean().default(false),
});

/**
 * Create Fee Structure Validation Schema
 */
export const createFeeStructureSchema = z.object({
  body: z.object({
    school: z.string({
      required_error: "School ID is required",
    }).regex(/^[0-9a-fA-F]{24}$/, "Invalid school ID format"),
    grade: z.string({
      required_error: "Grade is required",
    }).trim().min(1, "Grade cannot be empty"),
    academicYear: z.string({
      required_error: "Academic year is required",
    }).regex(/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY"),
    feeComponents: z.array(feeComponentSchema)
      .min(1, "At least one fee component is required"),
    dueDate: z.number({
      required_error: "Due date is required",
    }).min(1, "Due date must be between 1 and 31")
      .max(31, "Due date must be between 1 and 31"),
    lateFeePercentage: z.number().min(0).max(100).default(0),
  }),
});

/**
 * Update Fee Structure Validation Schema
 */
export const updateFeeStructureSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid fee structure ID format"),
  }),
  body: z.object({
    feeComponents: z.array(feeComponentSchema).optional(),
    dueDate: z.number().min(1).max(31).optional(),
    lateFeePercentage: z.number().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * Get Fee Structure Validation Schema
 */
export const getFeeStructureSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid fee structure ID format"),
  }),
});

/**
 * Query Fee Structures Validation Schema
 */
export const queryFeeStructuresSchema = z.object({
  query: z.object({
    school: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid school ID format").optional(),
    grade: z.string().trim().optional(),
    academicYear: z.string().regex(/^\d{4}-\d{4}$/).optional(),
    isActive: z.enum(["true", "false"]).optional(),
  }),
});

/**
 * Create Student Fee Record Validation Schema
 */
export const createStudentFeeRecordSchema = z.object({
  body: z.object({
    studentId: z.string({
      required_error: "Student ID is required",
    }).regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format"),
    feeStructureId: z.string({
      required_error: "Fee structure ID is required",
    }).regex(/^[0-9a-fA-F]{24}$/, "Invalid fee structure ID format"),
    academicYear: z.string({
      required_error: "Academic year is required",
    }).regex(/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY"),
  }),
});

/**
 * Waive Fee Validation Schema
 */
export const waiveFeeSchema = z.object({
  body: z.object({
    studentId: z.string({
      required_error: "Student ID is required",
    }).regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format"),
    month: z.nativeEnum(Month, {
      errorMap: () => ({ message: "Invalid month" }),
    }),
    reason: z.string({
      required_error: "Reason is required",
    }).trim().min(10, "Reason must be at least 10 characters"),
  }),
});

/**
 * Batch Waive Fee Validation Schema
 */
export const batchWaiveFeeSchema = z.object({
  body: z.object({
    studentIds: z.array(
      z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format")
    ).min(1, "At least one student ID is required"),
    month: z.nativeEnum(Month, {
      errorMap: () => ({ message: "Invalid month" }),
    }),
    reason: z.string({
      required_error: "Reason is required",
    }).trim().min(10, "Reason must be at least 10 characters"),
  }),
});

/**
 * Get Financial Overview Validation Schema
 */
export const getFinancialOverviewSchema = z.object({
  query: z.object({
    school: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid school ID format").optional(),
    academicYear: z.string().regex(/^\d{4}-\d{4}$/).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

/**
 * Get Defaulters Validation Schema
 */
export const getDefaultersSchema = z.object({
  query: z.object({
    school: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid school ID format").optional(),
    grade: z.string().trim().optional(),
    minAmount: z.string().regex(/^\d+$/).transform(Number).optional(),
    minDays: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

/**
 * Cancel Transaction Validation Schema
 */
export const cancelTransactionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid transaction ID format"),
  }),
  body: z.object({
    reason: z.string({
      required_error: "Cancellation reason is required",
    }).trim().min(10, "Reason must be at least 10 characters"),
  }),
});

/**
 * Get Transactions Validation Schema
 */
export const getTransactionsSchema = z.object({
  query: z.object({
    school: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid school ID format").optional(),
    student: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format").optional(),
    collectedBy: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format").optional(),
    transactionType: z.nativeEnum(TransactionType).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.enum(["completed", "cancelled", "refunded"]).optional(),
  }),
});

export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;
export type UpdateFeeStructureInput = z.infer<typeof updateFeeStructureSchema>;
export type GetFeeStructureInput = z.infer<typeof getFeeStructureSchema>;
export type QueryFeeStructuresInput = z.infer<typeof queryFeeStructuresSchema>;
export type CreateStudentFeeRecordInput = z.infer<typeof createStudentFeeRecordSchema>;
export type WaiveFeeInput = z.infer<typeof waiveFeeSchema>;
export type BatchWaiveFeeInput = z.infer<typeof batchWaiveFeeSchema>;
export type GetFinancialOverviewInput = z.infer<typeof getFinancialOverviewSchema>;
export type GetDefaultersInput = z.infer<typeof getDefaultersSchema>;
export type CancelTransactionInput = z.infer<typeof cancelTransactionSchema>;
export type GetTransactionsInput = z.infer<typeof getTransactionsSchema>;
