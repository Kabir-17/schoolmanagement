// ============================================
// ENUMS
// ============================================

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

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  PARTIAL = "partial",
  WAIVED = "waived",
  OVERDUE = "overdue",
}

export enum PaymentMethod {
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
  CHEQUE = "cheque",
  ONLINE = "online",
}

export enum TransactionType {
  PAYMENT = "payment",
  REFUND = "refund",
  WAIVER = "waiver",
  PENALTY = "penalty",
}

export enum TransactionStatus {
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

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

export enum DefaulterSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// ============================================
// INTERFACES
// ============================================

export interface FeeComponent {
  feeType: FeeType;
  amount: number;
  description?: string;
  isMandatory: boolean;
  isOneTime: boolean;
}

export interface FeeStructure {
  _id: string;
  school: string;
  grade: string;
  academicYear: string;
  feeComponents: FeeComponent[];
  totalAmount: number; // Monthly fee total (excluding one-time fees)
  totalMonthlyFee: number; // Same as totalAmount
  totalOneTimeFee: number; // Sum of one-time fees
  totalYearlyFee: number; // (totalMonthlyFee × 12) + totalOneTimeFee
  dueDate: number;
  lateFeePercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyPayment {
  month: Month;
  dueDate: Date;
  status: PaymentStatus;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  lateFee: number;
  paymentDate?: Date;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  remarks?: string;
}

export interface StudentFeeRecord {
  _id: string;
  school: string;
  student: {
    _id: string;
    studentId: string;
    fullName: string;
  };
  feeStructure: string;
  academicYear: string;
  monthlyPayments: MonthlyPayment[];
  totalExpected: number;
  totalPaid: number;
  totalRemaining: number;
  totalLateFees: number;
  overallStatus: PaymentStatus;
  lastPaymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeTransaction {
  _id: string;
  school: string;
  student: {
    _id: string;
    studentId: string;
    fullName: string;
  };
  academicYear: string;
  transactionType: TransactionType;
  status: TransactionStatus;
  amount: number;
  month?: Month;
  paymentMethod?: PaymentMethod;
  receiptNumber: string;
  collectedBy: {
    _id: string;
    username: string;
  };
  remarks?: string;
  metadata: {
    ipAddress: string;
    deviceInfo: string;
  };
  cancellationReason?: string;
  cancelledAt?: Date;
  relatedTransaction?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeDefaulter {
  _id: string;
  school: string;
  student: {
    _id: string;
    studentId: string;
    fullName: string;
    grade: string;
    contact?: string;
  };
  academicYear: string;
  overdueMonths: Month[];
  totalOverdueAmount: number;
  totalLateFees: number;
  daysSinceFirstOverdue: number;
  severity: DefaulterSeverity;
  lastReminderDate?: Date;
  reminderCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface CreateFeeStructureRequest {
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
}

export interface UpdateFeeStructureRequest {
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

export interface CollectFeeRequest {
  studentId: string;
  month: number;
  amount: number;
  paymentMethod: string;
  remarks?: string;
}

export interface ValidateFeeCollectionRequest {
  studentId: string;
  month: number;
  amount: number;
}

export interface ValidateFeeCollectionResponse {
  canProceed: boolean;
  warnings: string[];
  studentFeeRecord: StudentFeeRecord;
}

export interface WaiveFeeRequest {
  studentId: string;
  month: number;
  reason: string;
}

export interface FinancialOverview {
  overview: {
    totalExpectedRevenue: number;
    totalCollected: number;
    totalPending: number;
    totalOverdue: number;
    collectionRate: number;
  };
  monthlyBreakdown: Array<{
    month: number;
    expected: number;
    collected: number;
    pending: number;
  }>;
  gradeWiseBreakdown: Array<{
    grade: string;
    totalStudents: number;
    expectedRevenue: number;
    collected: number;
    collectionRate: number;
  }>;
  recentTransactions: FeeTransaction[];
  defaultersSummary: {
    totalDefaulters: number;
    totalOverdueAmount: number;
    criticalDefaulters: number;
  };
  comparisonWithLastYear?: {
    lastYearCollection: number;
    currentYearCollection: number;
    growthPercentage: number;
  };
}

export interface DefaultersReport {
  defaulters: FeeDefaulter[];
  summary: {
    totalDefaulters: number;
    totalOverdueAmount: number;
    averageOverdueAmount: number;
    bySeverity: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
}

export interface CollectionRateReport {
  overall: {
    totalExpected: number;
    totalCollected: number;
    collectionRate: number;
  };
  gradeWise: Array<{
    grade: string;
    totalStudents: number;
    expectedRevenue: number;
    collectedRevenue: number;
    collectionRate: number;
  }>;
  trend: Array<{
    month: number;
    collectionRate: number;
  }>;
}

export interface DailyCollectionSummary {
  date: string;
  totalCollections: number;
  totalAmount: number;
  byPaymentMethod: Record<string, { count: number; amount: number }>;
  byGrade: Record<string, { count: number; amount: number }>;
  transactions: FeeTransaction[];
}

export interface Receipt {
  transaction: FeeTransaction;
  student: {
    studentId: string;
    fullName: string;
    grade: string;
    fatherName?: string;
    contact?: string;
  };
  school: {
    name: string;
    address?: string;
    contact?: string;
  };
  feeDetails: {
    month: string;
    academicYear: string;
    amount: number;
    lateFee?: number;
  };
}

// ============================================
// UTILITY TYPES
// ============================================

export interface FeeStructureFilters {
  school?: string;
  grade?: string;
  academicYear?: string;
  isActive?: boolean;
}

export interface TransactionFilters {
  school?: string;
  student?: string;
  collectedBy?: string;
  transactionType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface DefaulterFilters {
  school?: string;
  grade?: string;
  minAmount?: number;
  minDays?: number;
  limit?: number;
}
