import { Schema, model } from "mongoose";
import {
  IFeeTransaction,
  TransactionType,
  PaymentMethod,
  TransactionStatus,
  Month,
} from "./fee.interface";
import crypto from "crypto";

const feeTransactionSchema = new Schema<IFeeTransaction>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
      index: true,
    },
    studentFeeRecord: {
      type: Schema.Types.ObjectId,
      ref: "StudentFeeRecord",
      required: [true, "Student fee record is required"],
      index: true,
    },
    school: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School is required"],
      index: true,
    },
    transactionType: {
      type: String,
      enum: Object.values(TransactionType),
      required: [true, "Transaction type is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be non-negative"],
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
    },
    month: {
      type: Number,
      enum: Object.values(Month).filter((v) => typeof v === "number"),
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.COMPLETED,
      index: true,
    },
    collectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Collector is required"],
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    receiptNumber: {
      type: String,
      trim: true,
      index: true,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    auditLog: {
      ipAddress: {
        type: String,
        trim: true,
      },
      deviceInfo: {
        type: String,
        trim: true,
      },
      timestamp: {
        type: Date,
        required: true,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for quick lookups
feeTransactionSchema.index({ school: 1, createdAt: -1 });
feeTransactionSchema.index({ student: 1, createdAt: -1 });
feeTransactionSchema.index({ collectedBy: 1, createdAt: -1 });

// Pre-save middleware to generate transaction ID and receipt number
feeTransactionSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Generate unique transaction ID
    if (!this.transactionId) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const randomStr = crypto.randomBytes(4).toString("hex").toUpperCase();
      this.transactionId = `TXN-${timestamp}-${randomStr}`;
    }

    // Generate receipt number for payment transactions
    if (
      this.transactionType === TransactionType.PAYMENT &&
      !this.receiptNumber
    ) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const randomNum = crypto.randomBytes(3).toString("hex").toUpperCase();
      this.receiptNumber = `RCP-${year}${month}-${randomNum}`;
    }
  }
  next();
});

// Static method to create payment transaction
feeTransactionSchema.statics.createPayment = async function (
  studentId: string,
  studentFeeRecordId: string,
  schoolId: string,
  amount: number,
  month: Month,
  paymentMethod: PaymentMethod,
  collectedBy: string,
  remarks?: string,
  auditInfo?: {
    ipAddress?: string;
    deviceInfo?: string;
  }
) {
  return this.create({
    student: studentId,
    studentFeeRecord: studentFeeRecordId,
    school: schoolId,
    transactionType: TransactionType.PAYMENT,
    amount,
    month,
    paymentMethod,
    collectedBy,
    remarks,
    status: TransactionStatus.COMPLETED,
    auditLog: {
      ipAddress: auditInfo?.ipAddress,
      deviceInfo: auditInfo?.deviceInfo,
      timestamp: new Date(),
    },
  });
};

// Static method to create refund transaction
feeTransactionSchema.statics.createRefund = async function (
  studentId: string,
  studentFeeRecordId: string,
  schoolId: string,
  amount: number,
  refundedBy: string,
  reason: string,
  auditInfo?: {
    ipAddress?: string;
    deviceInfo?: string;
  }
) {
  return this.create({
    student: studentId,
    studentFeeRecord: studentFeeRecordId,
    school: schoolId,
    transactionType: TransactionType.REFUND,
    amount,
    collectedBy: refundedBy,
    remarks: reason,
    status: TransactionStatus.COMPLETED,
    auditLog: {
      ipAddress: auditInfo?.ipAddress,
      deviceInfo: auditInfo?.deviceInfo,
      timestamp: new Date(),
    },
  });
};

// Method to cancel transaction
feeTransactionSchema.methods.cancel = async function (
  cancelledBy: string,
  reason: string
) {
  if (this.status === TransactionStatus.CANCELLED) {
    throw new Error("Transaction is already cancelled");
  }

  if (this.status === TransactionStatus.REFUNDED) {
    throw new Error("Cannot cancel a refunded transaction");
  }

  // Check if cancellation is allowed (within 24 hours)
  const hoursSinceTransaction =
    (Date.now() - this.createdAt!.getTime()) / (1000 * 60 * 60);
  if (hoursSinceTransaction > 24) {
    throw new Error(
      "Cannot cancel transaction after 24 hours. Please create a refund instead."
    );
  }

  this.status = TransactionStatus.CANCELLED;
  this.cancelledBy = cancelledBy as any;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;

  return this.save();
};

// Method to check if transaction can be cancelled
feeTransactionSchema.methods.canBeCancelled = function (): boolean {
  if (
    this.status === TransactionStatus.CANCELLED ||
    this.status === TransactionStatus.REFUNDED
  ) {
    return false;
  }

  const hoursSinceTransaction =
    (Date.now() - this.createdAt!.getTime()) / (1000 * 60 * 60);
  return hoursSinceTransaction <= 24;
};

// Static method to get transactions by date range
feeTransactionSchema.statics.getTransactionsByDateRange = async function (
  schoolId: string,
  startDate: Date,
  endDate: Date,
  options?: {
    transactionType?: TransactionType;
    status?: TransactionStatus;
    collectedBy?: string;
  }
) {
  const query: any = {
    school: schoolId,
    createdAt: { $gte: startDate, $lte: endDate },
  };

  if (options?.transactionType) {
    query.transactionType = options.transactionType;
  }

  if (options?.status) {
    query.status = options.status;
  }

  if (options?.collectedBy) {
    query.collectedBy = options.collectedBy;
  }

  return this.find(query)
    .populate("student", "studentId firstName lastName")
    .populate("collectedBy", "name email")
    .sort({ createdAt: -1 });
};

// Static method to get daily collection summary
feeTransactionSchema.statics.getDailyCollectionSummary = async function (
  schoolId: string,
  date: Date
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        school: schoolId,
        transactionType: TransactionType.PAYMENT,
        status: TransactionStatus.COMPLETED,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: {
          collectedBy: "$collectedBy",
          paymentMethod: "$paymentMethod",
        },
        totalAmount: { $sum: "$amount" },
        transactionCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.collectedBy",
        foreignField: "_id",
        as: "collector",
      },
    },
    {
      $unwind: "$collector",
    },
    {
      $project: {
        collectedBy: "$collector.name",
        paymentMethod: "$_id.paymentMethod",
        totalAmount: 1,
        transactionCount: 1,
      },
    },
  ]);
};

// Static method to detect suspicious patterns
feeTransactionSchema.statics.detectSuspiciousPatterns = async function (
  schoolId: string,
  collectorId: string,
  timeWindowHours: number = 1
) {
  const cutoffTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

  // Check for duplicate amounts in short time
  const recentTransactions = await this.find({
    school: schoolId,
    collectedBy: collectorId,
    status: TransactionStatus.COMPLETED,
    createdAt: { $gte: cutoffTime },
  });

  const duplicates: any[] = [];
  const amountMap = new Map<number, any[]>();

  recentTransactions.forEach((txn: any) => {
    const key = txn.amount;
    if (!amountMap.has(key)) {
      amountMap.set(key, []);
    }
    amountMap.get(key)!.push(txn);
  });

  amountMap.forEach((txns, amount) => {
    if (txns.length > 1) {
      duplicates.push({
        amount,
        count: txns.length,
        transactions: txns,
      });
    }
  });

  return {
    hasSuspiciousPattern: duplicates.length > 0,
    duplicates,
    totalTransactions: recentTransactions.length,
  };
};

import { Model } from "mongoose";
import { IFeeTransactionModel } from "./fee.interface";

const FeeTransaction = model<IFeeTransaction, Model<IFeeTransaction> & IFeeTransactionModel>(
  "FeeTransaction",
  feeTransactionSchema
);

export default FeeTransaction;
