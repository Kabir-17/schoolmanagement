import { Types } from "mongoose";

/**
 * Fee Type Enum
 */
export enum FeeType {
  TUITION = "tuition",
  TRANSPORT = "transport",
  HOSTEL = "hostel",
  LIBRARY = "library",
  LAB = "lab",
  SPORTS = "sports",
  EXAM = "exam",
  ADMISSION = "admission",
  ANNUAL = "annual",
  OTHER = "other",
}

/**
 * Payment Status Enum
 */
export enum PaymentStatus {
  PENDING = "pending",
  PARTIAL = "partial",
  PAID = "paid",
  OVERDUE = "overdue",
  WAIVED = "waived",
}

/**
 * Payment Method Enum
 */
export enum PaymentMethod {
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
  CHEQUE = "cheque",
  ONLINE = "online",
}

/**
 * Transaction Type Enum
 */
export enum TransactionType {
  PAYMENT = "payment",
  REFUND = "refund",
  WAIVER = "waiver",
  PENALTY = "penalty",
}

/**
 * Transaction Status Enum
 */
export enum TransactionStatus {
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

/**
 * Month Enum
 */
export enum Month {
  JANUARY = 1,
  FEBRUARY = 2,
  MARCH = 3,
  APRIL = 4,
  MAY = 5,
  JUNE = 6,
  JULY = 7,
  AUGUST = 8,
  SEPTEMBER = 9,
  OCTOBER = 10,
  NOVEMBER = 11,
  DECEMBER = 12,
}

/**
 * Fee Structure Component
 */
export interface IFeeComponent {
  feeType: FeeType;
  amount: number;
  description?: string;
  isMandatory: boolean;
  isOneTime: boolean;
}

/**
 * Fee Structure Interface
 */
export interface IFeeStructure {
  _id?: Types.ObjectId;
  school: Types.ObjectId;
  grade: string;
  academicYear: string; // e.g., "2025-2026"
  feeComponents: IFeeComponent[];
  totalAmount: number; // Monthly fee total (excluding one-time fees)
  dueDate: number; // Day of month (1-31)
  lateFeePercentage: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  // Virtual properties
  totalMonthlyFee?: number; // Same as totalAmount
  totalOneTimeFee?: number; // Sum of one-time fees
  totalYearlyFee?: number; // (totalAmount × 12) + totalOneTimeFee
  // Methods
  deactivate(updatedBy: string): Promise<IFeeStructure>;
  canModify(): boolean;
}

/**
 * Monthly Payment Record
 */
export interface IMonthlyPayment {
  month: Month;
  dueAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  dueDate: Date;
  paidDate?: Date;
  lateFee?: number;
  waived?: boolean;
  waiverReason?: string;
  waiverBy?: Types.ObjectId;
  waiverDate?: Date;
}

/**
 * One-Time Fee Payment Record
 */
export interface IOneTimeFeePayment {
  feeType: FeeType; // e.g., ADMISSION, ANNUAL
  dueAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  dueDate: Date;
  paidDate?: Date;
  waived?: boolean;
  waiverReason?: string;
  waiverBy?: Types.ObjectId;
  waiverDate?: Date;
}

/**
 * Student Fee Record Interface
 */
export interface IStudentFeeRecord {
  _id?: Types.ObjectId;
  student: Types.ObjectId;
  school: Types.ObjectId;
  grade: string;
  academicYear: string;
  feeStructure: Types.ObjectId;
  totalFeeAmount: number;
  totalPaidAmount: number;
  totalDueAmount: number;
  monthlyPayments: IMonthlyPayment[];
  oneTimeFees?: IOneTimeFeePayment[]; // For admission, annual fees
  status: PaymentStatus;
  createdAt?: Date;
  updatedAt?: Date;
  // Methods
  recordPayment(month: Month, amount: number): Promise<IStudentFeeRecord>;
  applyLateFee(month: Month, lateFeePercentage: number): Promise<IStudentFeeRecord>;
  waiveFee(month: Month, reason: string, waivedBy: string): Promise<IStudentFeeRecord>;
  getOverdueMonths(): Month[];
}

/**
 * Fee Transaction Interface
 */
export interface IFeeTransaction {
  _id?: Types.ObjectId;
  transactionId: string; // Unique identifier
  student: Types.ObjectId;
  studentFeeRecord: Types.ObjectId;
  school: Types.ObjectId;
  transactionType: TransactionType;
  amount: number;
  paymentMethod?: PaymentMethod;
  month?: Month; // For payment transactions
  status: TransactionStatus;
  collectedBy: Types.ObjectId; // Accountant who collected
  remarks?: string;
  receiptNumber?: string;
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
  cancellationReason?: string;
  auditLog: {
    ipAddress?: string;
    deviceInfo?: string;
    timestamp: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
  // Methods
  cancel(cancelledBy: string, reason: string): Promise<IFeeTransaction>;
  canBeCancelled(): boolean;
}

/**
 * Fee Defaulter Interface
 */
export interface IFeeDefaulter {
  _id?: Types.ObjectId;
  student: Types.ObjectId;
  studentFeeRecord: Types.ObjectId;
  school: Types.ObjectId;
  grade: string;
  totalDueAmount: number;
  overdueMonths: Month[];
  daysSinceFirstDue: number;
  lastReminderDate?: Date;
  notificationCount: number;
  createdAt?: Date;
  updatedAt?: Date;
  // Methods
  recordReminder(): Promise<IFeeDefaulter>;
  isReminderDue(reminderIntervalDays: number): boolean;
}

/**
 * Fee Collection Request DTO
 */
export interface IFeeCollectionRequest {
  studentId: string;
  month: Month;
  amount: number;
  paymentMethod: PaymentMethod;
  remarks?: string;
  collectedBy: string; // Accountant ID
}

/**
 * Fee Structure Create Request DTO
 */
export interface IFeeStructureCreateRequest {
  school: string;
  grade: string;
  academicYear: string;
  feeComponents: IFeeComponent[];
  dueDate: number;
  lateFeePercentage: number;
  createdBy: string; // Admin ID
}

/**
 * Financial Overview Response DTO
 */
export interface IFinancialOverview {
  totalCollected: number;
  totalDue: number;
  totalWaived: number;
  totalDefaulters: number;
  monthlyBreakdown: {
    month: string;
    collected: number;
    due: number;
  }[];
  gradeWiseBreakdown: {
    grade: string;
    collected: number;
    due: number;
    studentCount: number;
  }[];
  recentTransactions: IFeeTransaction[];
}

/**
 * Student Fee Status Response DTO
 */
export interface IStudentFeeStatus {
  student: {
    _id: string;
    studentId: string;
    name: string;
    grade: string;
    rollNumber: string;
  };
  feeRecord: IStudentFeeRecord;
  upcomingDue?: {
    month: Month;
    amount: number;
    dueDate: Date;
  };
  recentTransactions: IFeeTransaction[];
}

/**
 * Transaction Cancellation Request DTO
 */
export interface ITransactionCancellationRequest {
  transactionId: string;
  reason: string;
  cancelledBy: string; // Admin ID
}

/**
 * Batch Fee Waiver Request DTO
 */
export interface IBatchFeeWaiverRequest {
  studentIds: string[];
  month: Month;
  reason: string;
  waivedBy: string; // Admin ID
}

/**
 * Fee Transaction Model with Statics
 */
export interface IFeeTransactionModel {
  detectSuspiciousPatterns(
    schoolId: string,
    collectorId: string,
    timeWindowHours: number
  ): Promise<{
    hasSuspiciousPattern: boolean;
    duplicates: any[];
    totalTransactions: number;
  }>;
  createPayment(data: any): Promise<IFeeTransaction>;
  createRefund(data: any): Promise<IFeeTransaction>;
  getDailyCollectionSummary(schoolId: string, date: Date): Promise<any>;
}

/**
 * Fee Defaulter Model with Statics
 */
export interface IFeeDefaulterModel {
  syncDefaultersForSchool(schoolId: string): Promise<void>;
  getCriticalDefaulters(schoolId: string, minAmount: number, minDays: number): Promise<IFeeDefaulter[]>;
  getDefaultersByGrade(schoolId: string, grade: string): Promise<IFeeDefaulter[]>;
}
