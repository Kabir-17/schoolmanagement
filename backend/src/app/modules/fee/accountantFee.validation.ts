import { z } from "zod";
import { PaymentMethod, Month } from "./fee.interface";

/**
 * Search Student for Fee Collection Validation Schema
 */
export const searchStudentSchema = z.object({
  query: z.object({
    studentId: z.string({
      required_error: "Student ID is required",
    }).trim().min(1, "Student ID cannot be empty"),
  }),
});

/**
 * Get Student Fee Status Validation Schema
 */
export const getStudentFeeStatusSchema = z.object({
  params: z.object({
    studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format"),
  }),
  query: z.object({
    academicYear: z.string().regex(/^\d{4}-\d{4}$/).optional(),
  }),
});

/**
 * Collect Fee Validation Schema
 */
export const collectFeeSchema = z.object({
  body: z.object({
    studentId: z.string({
      required_error: "Student ID is required",
    }).regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format"),
    month: z.nativeEnum(Month, {
      errorMap: () => ({ message: "Invalid month" }),
    }),
    amount: z.number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    }).positive("Amount must be greater than 0"),
    paymentMethod: z.nativeEnum(PaymentMethod, {
      errorMap: () => ({ message: "Invalid payment method" }),
    }),
    remarks: z.string().trim().max(500, "Remarks cannot exceed 500 characters").optional(),
    includeLateFee: z.boolean().optional(),
  }),
});

/**
 * Validate Fee Collection (Pre-confirmation) Validation Schema
 */
export const validateFeeCollectionSchema = z.object({
  body: z.object({
    studentId: z.string({
      required_error: "Student ID is required",
    }).regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format"),
    month: z.nativeEnum(Month, {
      errorMap: () => ({ message: "Invalid month" }),
    }),
    amount: z.number({
      required_error: "Amount is required",
    }).positive("Amount must be greater than 0"),
    includeLateFee: z.boolean().optional(),
  }),
});

/**
 * Get Accountant Transactions Validation Schema
 */
export const getAccountantTransactionsSchema = z.object({
  query: z.object({
    date: z.string().datetime().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.enum(["completed", "cancelled"]).optional(),
  }),
});

/**
 * Get Daily Collection Summary Validation Schema
 */
export const getDailyCollectionSummarySchema = z.object({
  query: z.object({
    date: z.string().datetime().optional(),
  }),
});

/**
 * Request Transaction Cancellation Validation Schema
 */
export const requestTransactionCancellationSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid transaction ID format"),
  }),
  body: z.object({
    reason: z.string({
      required_error: "Reason is required",
    }).trim().min(10, "Reason must be at least 10 characters")
      .max(500, "Reason cannot exceed 500 characters"),
  }),
});

/**
 * Generate Receipt Validation Schema
 */
export const generateReceiptSchema = z.object({
  params: z.object({
    transactionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid transaction ID format"),
  }),
});

/**
 * Get Receipt Validation Schema
 */
export const getReceiptSchema = z.object({
  params: z.object({
    receiptNumber: z.string({
      required_error: "Receipt number is required",
    }).trim().min(1, "Receipt number cannot be empty"),
  }),
});

/**
 * Batch Collect Fee Validation Schema (for multiple months)
 */
export const batchCollectFeeSchema = z.object({
  body: z.object({
    studentId: z.string({
      required_error: "Student ID is required",
    }).regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format"),
    payments: z.array(
      z.object({
        month: z.nativeEnum(Month),
        amount: z.number().positive(),
      })
    ).min(1, "At least one payment is required"),
    paymentMethod: z.nativeEnum(PaymentMethod),
    remarks: z.string().trim().max(500).optional(),
  }),
});

export type SearchStudentInput = z.infer<typeof searchStudentSchema>;
export type GetStudentFeeStatusInput = z.infer<typeof getStudentFeeStatusSchema>;
export type CollectFeeInput = z.infer<typeof collectFeeSchema>;
export type ValidateFeeCollectionInput = z.infer<typeof validateFeeCollectionSchema>;
export type GetAccountantTransactionsInput = z.infer<typeof getAccountantTransactionsSchema>;
export type GetDailyCollectionSummaryInput = z.infer<typeof getDailyCollectionSummarySchema>;
export type RequestTransactionCancellationInput = z.infer<typeof requestTransactionCancellationSchema>;
export type GenerateReceiptInput = z.infer<typeof generateReceiptSchema>;
export type GetReceiptInput = z.infer<typeof getReceiptSchema>;
export type BatchCollectFeeInput = z.infer<typeof batchCollectFeeSchema>;
