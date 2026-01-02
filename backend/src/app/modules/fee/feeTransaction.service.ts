import FeeTransaction from "./feeTransaction.model";
import StudentFeeRecord from "./studentFeeRecord.model";
import { TransactionType, TransactionStatus, PaymentMethod, PaymentStatus } from "./fee.interface";
import { AppError } from "../../errors/AppError";

/**
 * Fee Transaction Service
 * Handles transaction management and cancellations
 */
class FeeTransactionService {
  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string) {
    const transaction = await FeeTransaction.findById(id)
      .populate("student", "studentId firstName lastName grade")
      .populate("collectedBy", "name email")
      .populate("cancelledBy", "name email");

    if (!transaction) {
      throw new AppError(404, "Transaction not found");
    }

    return transaction;
  }

  /**
   * Get transactions with filters
   */
  async getTransactions(filters: {
    school?: string;
    student?: string;
    collectedBy?: string;
    transactionType?: TransactionType;
    status?: TransactionStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
  }) {
    const query: any = {};

    if (filters.school) query.school = filters.school;
    if (filters.student) query.student = filters.student;
    if (filters.collectedBy) query.collectedBy = filters.collectedBy;
    if (filters.transactionType) query.transactionType = filters.transactionType;
    if (filters.status) query.status = filters.status;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const transactions = await FeeTransaction.find(query)
      .populate("student", "studentId firstName lastName grade")
      .populate("collectedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50)
      .skip(filters.skip || 0);

    const total = await FeeTransaction.countDocuments(query);

    return {
      transactions,
      total,
      page: Math.floor((filters.skip || 0) / (filters.limit || 50)) + 1,
      pages: Math.ceil(total / (filters.limit || 50)),
    };
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction(
    transactionId: string,
    cancelledBy: string,
    reason: string
  ) {
    const transaction = await FeeTransaction.findById(transactionId);

    if (!transaction) {
      throw new AppError(404, "Transaction not found");
    }

    // Check if can be cancelled
    if (!transaction.canBeCancelled()) {
      throw new AppError(
        403,
        "Transaction cannot be cancelled after 24 hours. Please create a refund instead."
      );
    }

    // Cancel the transaction
    await transaction.cancel(cancelledBy, reason);

    // Reverse the payment in fee record
    const feeRecord = await StudentFeeRecord.findById(
      transaction.studentFeeRecord
    );

    if (feeRecord && transaction.month) {
      const monthlyPayment = feeRecord.monthlyPayments.find(
        (p: any) => p.month === transaction.month
      );

      if (monthlyPayment) {
        monthlyPayment.paidAmount -= transaction.amount;
        if (monthlyPayment.paidAmount < 0) monthlyPayment.paidAmount = 0;

        // Update status
        if (monthlyPayment.paidAmount === 0) {
          monthlyPayment.status = PaymentStatus.PENDING;
        } else if (monthlyPayment.paidAmount < monthlyPayment.dueAmount + (monthlyPayment.lateFee || 0)) {
          monthlyPayment.status = PaymentStatus.PARTIAL;
        }

        await feeRecord.save();
      }
    }

    return transaction;
  }

  /**
   * Create refund
   */
  async createRefund(data: {
    studentId: string;
    studentFeeRecordId: string;
    schoolId: string;
    amount: number;
    refundedBy: string;
    reason: string;
    auditInfo?: {
      ipAddress?: string;
      deviceInfo?: string;
    };
  }) {
    // Validate student fee record
    const feeRecord = await StudentFeeRecord.findById(data.studentFeeRecordId);

    if (!feeRecord) {
      throw new AppError(404, "Student fee record not found");
    }

    // Check if refund amount is valid
    if (data.amount > feeRecord.totalPaidAmount) {
      throw new AppError(
        400,
        `Refund amount (${data.amount}) cannot exceed total paid amount (${feeRecord.totalPaidAmount})`
      );
    }

    // Create refund transaction
    const transaction = await FeeTransaction.create({
      transactionId: `RFD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      student: data.studentId,
      studentFeeRecord: data.studentFeeRecordId,
      school: data.schoolId,
      transactionType: TransactionType.REFUND,
      amount: data.amount,
      collectedBy: data.refundedBy,
      remarks: data.reason,
      status: TransactionStatus.COMPLETED,
      auditLog: {
        ipAddress: data.auditInfo?.ipAddress,
        deviceInfo: data.auditInfo?.deviceInfo,
        timestamp: new Date(),
      },
    });

    // Update fee record (decrease paid amount)
    feeRecord.totalPaidAmount -= data.amount;
    feeRecord.totalDueAmount += data.amount;
    await feeRecord.save();

    return transaction;
  }

  /**
   * Get daily collection summary
   */
  async getDailyCollectionSummary(schoolId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return FeeTransaction.aggregate([
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
  }

  /**
   * Detect suspicious patterns
   */
  async detectSuspiciousPatterns(
    schoolId: string,
    collectorId: string,
    timeWindowHours: number = 1
  ) {
    return FeeTransaction.detectSuspiciousPatterns(
      schoolId,
      collectorId,
      timeWindowHours
    );
  }

  /**
   * Get receipt by transaction ID
   */
  async getReceiptByTransactionId(transactionId: string) {
    const transaction = await FeeTransaction.findById(transactionId)
      .populate("student", "studentId firstName lastName grade parentContact")
      .populate("collectedBy", "name email")
      .populate("school", "name schoolId address");

    if (!transaction) {
      throw new AppError(404, "Transaction not found");
    }

    if (transaction.transactionType !== TransactionType.PAYMENT) {
      throw new AppError(400, "Receipt is only available for payment transactions");
    }

    return transaction;
  }

  /**
   * Get receipt by receipt number
   */
  async getReceiptByReceiptNumber(receiptNumber: string) {
    const transaction = await FeeTransaction.findOne({ receiptNumber })
      .populate("student", "studentId firstName lastName grade parentContact")
      .populate("collectedBy", "name email")
      .populate("school", "name schoolId address");

    if (!transaction) {
      throw new AppError(404, "Receipt not found");
    }

    return transaction;
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStatistics(
    schoolId: string,
    startDate: Date,
    endDate: Date
  ) {
    const stats = await FeeTransaction.aggregate([
      {
        $match: {
          school: schoolId,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            type: "$transactionType",
            status: "$status",
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    return stats;
  }
}

export default new FeeTransactionService();
