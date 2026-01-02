import StudentFeeRecord from "./studentFeeRecord.model";
import FeeTransaction from "./feeTransaction.model";
import FeeDefaulter from "./feeDefaulter.model";
import { TransactionType, TransactionStatus, PaymentStatus, Month } from "./fee.interface";
import { model } from "mongoose";

const Student = model("Student");

/**
 * Fee Report Service
 * Handles financial reports and analytics
 */
class FeeReportService {
  /**
   * Get financial overview for admin dashboard
   */
  async getFinancialOverview(
    schoolId: string,
    academicYear: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const { Types } = require('mongoose');
    const schoolObjectId = new Types.ObjectId(schoolId);
    
    const dateFilter = startDate && endDate
      ? { createdAt: { $gte: startDate, $lte: endDate } }
      : {};

    // Total collected
    const collectedResult = await FeeTransaction.aggregate([
      {
        $match: {
          school: schoolObjectId,
          transactionType: TransactionType.PAYMENT,
          status: TransactionStatus.COMPLETED,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: "$amount" },
        },
      },
    ]);

    const totalCollected = collectedResult[0]?.totalCollected || 0;

    // Total due
    const dueResult = await StudentFeeRecord.aggregate([
      {
        $match: {
          school: schoolObjectId,
          academicYear,
        },
      },
      {
        $group: {
          _id: null,
          totalDue: { $sum: "$totalDueAmount" },
        },
      },
    ]);

    const totalDue = dueResult[0]?.totalDue || 0;

    // Total waived
    const waivedResult = await StudentFeeRecord.aggregate([
      {
        $match: {
          school: schoolObjectId,
          academicYear,
        },
      },
      {
        $unwind: "$monthlyPayments",
      },
      {
        $match: {
          "monthlyPayments.waived": true,
        },
      },
      {
        $group: {
          _id: null,
          totalWaived: { $sum: "$monthlyPayments.dueAmount" },
        },
      },
    ]);

    const totalWaived = waivedResult[0]?.totalWaived || 0;

    // Total defaulters
    const totalDefaulters = await FeeDefaulter.countDocuments({
      school: schoolObjectId,
    });

    // Monthly breakdown
    const monthlyBreakdown = await FeeTransaction.aggregate([
      {
        $match: {
          school: schoolObjectId,
          transactionType: TransactionType.PAYMENT,
          status: TransactionStatus.COMPLETED,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$month",
          collected: { $sum: "$amount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          month: "$_id",
          collected: 1,
          _id: 0,
        },
      },
    ]);

    // Grade-wise breakdown
    const gradeWiseBreakdown = await StudentFeeRecord.aggregate([
      {
        $match: {
          school: schoolObjectId,
          academicYear,
        },
      },
      {
        $group: {
          _id: "$grade",
          collected: { $sum: "$totalPaidAmount" },
          due: { $sum: "$totalDueAmount" },
          studentCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          grade: "$_id",
          collected: 1,
          due: 1,
          studentCount: 1,
          _id: 0,
        },
      },
    ]);

    // Recent transactions
    const recentTransactions = await FeeTransaction.find({
      school: schoolObjectId,
      ...dateFilter,
    })
      .populate("student", "studentId firstName lastName grade")
      .populate("collectedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate total expected revenue (total fees for all students)
    const expectedRevenueResult = await StudentFeeRecord.aggregate([
      {
        $match: {
          school: schoolObjectId,
          academicYear,
        },
      },
      {
        $group: {
          _id: null,
          totalExpected: { $sum: "$totalFeeAmount" },
        },
      },
    ]);

    const totalExpectedRevenue = expectedRevenueResult[0]?.totalExpected || 0;

    return {
      overview: {
        totalExpectedRevenue,
        totalCollected,
        totalDue,
        totalWaived,
        totalDefaulters,
        collectionPercentage: totalExpectedRevenue > 0 ? (totalCollected / totalExpectedRevenue) * 100 : 0,
      },
      monthlyBreakdown,
      gradeWiseBreakdown,
      recentTransactions,
    };
  }

  /**
   * Get defaulters report
   */
  async getDefaultersReport(
    schoolId: string,
    options?: {
      grade?: string;
      minAmount?: number;
      minDays?: number;
      limit?: number;
    }
  ) {
    // Sync defaulters first
    await FeeDefaulter.syncDefaultersForSchool(schoolId);

    const query: any = { school: schoolId };

    if (options?.grade) {
      query.grade = options.grade;
    }

    if (options?.minAmount) {
      query.totalDueAmount = { $gte: options.minAmount };
    }

    if (options?.minDays) {
      query.daysSinceFirstDue = { $gte: options.minDays };
    }

    const defaulters = await FeeDefaulter.find(query)
      .populate({
        path: "student",
        select: "studentId firstName lastName grade parentContact parentEmail",
      })
      .sort({ daysSinceFirstDue: -1, totalDueAmount: -1 })
      .limit(options?.limit || 50);

    // Get statistics
    const stats = await FeeDefaulter.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: null,
          totalDefaulters: { $sum: 1 },
          totalDueAmount: { $sum: "$totalDueAmount" },
          avgDaysSinceFirstDue: { $avg: "$daysSinceFirstDue" },
        },
      },
    ]);

    // Get critical defaulters
    const criticalDefaulters = await FeeDefaulter.find({
      ...query,
      $or: [
        { daysSinceFirstDue: { $gte: 60 } },
        { totalDueAmount: { $gte: 50000 } },
      ],
    }).countDocuments();

    return {
      defaulters,
      statistics: stats[0] || {
        totalDefaulters: 0,
        totalDueAmount: 0,
        avgDaysSinceFirstDue: 0,
      },
      criticalDefaulters,
    };
  }

  /**
   * Get collection report by collector
   */
  async getCollectionByCollector(
    schoolId: string,
    startDate: Date,
    endDate: Date
  ) {
    return FeeTransaction.aggregate([
      {
        $match: {
          school: schoolId,
          transactionType: TransactionType.PAYMENT,
          status: TransactionStatus.COMPLETED,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$collectedBy",
          totalAmount: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "collector",
        },
      },
      {
        $unwind: "$collector",
      },
      {
        $project: {
          collectorId: "$_id",
          collectorName: "$collector.name",
          collectorEmail: "$collector.email",
          totalAmount: 1,
          transactionCount: 1,
          _id: 0,
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);
  }

  /**
   * Get payment trends
   */
  async getPaymentTrends(
    schoolId: string,
    academicYear: string,
    groupBy: "month" | "week" | "day" = "month"
  ) {
    const dateGrouping =
      groupBy === "month"
        ? {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          }
        : groupBy === "week"
        ? {
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" },
          }
        : {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          };

    return FeeTransaction.aggregate([
      {
        $match: {
          school: schoolId,
          transactionType: TransactionType.PAYMENT,
          status: TransactionStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: dateGrouping,
          totalAmount: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);
  }

  /**
   * Get fee collection rate
   */
  async getFeeCollectionRate(schoolId: string, academicYear: string) {
    const feeRecords = await StudentFeeRecord.find({
      school: schoolId,
      academicYear,
    });

    const totalStudents = feeRecords.length;
    const totalExpected = feeRecords.reduce(
      (sum, record) => sum + record.totalFeeAmount,
      0
    );
    const totalCollected = feeRecords.reduce(
      (sum, record) => sum + record.totalPaidAmount,
      0
    );
    const totalDue = feeRecords.reduce(
      (sum, record) => sum + record.totalDueAmount,
      0
    );

    const collectionRate = totalExpected > 0
      ? (totalCollected / totalExpected) * 100
      : 0;

    // Status breakdown
    const statusBreakdown = {
      paid: feeRecords.filter((r) => r.status === PaymentStatus.PAID).length,
      partial: feeRecords.filter((r) => r.status === PaymentStatus.PARTIAL).length,
      pending: feeRecords.filter((r) => r.status === PaymentStatus.PENDING).length,
      overdue: feeRecords.filter((r) => r.status === PaymentStatus.OVERDUE).length,
    };

    return {
      totalStudents,
      totalExpected,
      totalCollected,
      totalDue,
      collectionRate: Math.round(collectionRate * 100) / 100,
      statusBreakdown,
    };
  }

  /**
   * Get monthly collection comparison
   */
  async getMonthlyCollectionComparison(
    schoolId: string,
    currentYear: string,
    previousYear: string
  ) {
    const getMonthlyData = async (year: string) => {
      return FeeTransaction.aggregate([
        {
          $match: {
            school: schoolId,
            transactionType: TransactionType.PAYMENT,
            status: TransactionStatus.COMPLETED,
          },
        },
        {
          $group: {
            _id: "$month",
            amount: { $sum: "$amount" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);
    };

    const [currentYearData, previousYearData] = await Promise.all([
      getMonthlyData(currentYear),
      getMonthlyData(previousYear),
    ]);

    return {
      currentYear: currentYearData,
      previousYear: previousYearData,
      comparison: currentYearData.map((current) => {
        const previous = previousYearData.find(
          (p) => p._id === current._id
        );
        const growth = previous
          ? ((current.amount - previous.amount) / previous.amount) * 100
          : 0;

        return {
          month: current._id,
          currentYearAmount: current.amount,
          previousYearAmount: previous?.amount || 0,
          growth: Math.round(growth * 100) / 100,
        };
      }),
    };
  }

  /**
   * Export transactions to CSV data
   */
  async exportTransactionsCSV(
    schoolId: string,
    startDate: Date,
    endDate: Date
  ) {
    const transactions = await FeeTransaction.find({
      school: schoolId,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .populate("student", "studentId firstName lastName grade")
      .populate("collectedBy", "name email")
      .sort({ createdAt: -1 });

    return transactions.map((t: any) => ({
      transactionId: t.transactionId,
      receiptNumber: t.receiptNumber || "",
      date: t.createdAt.toISOString().split("T")[0],
      studentId: t.student?.studentId || "",
      studentName: t.student
        ? `${t.student.firstName} ${t.student.lastName}`
        : "",
      grade: t.student?.grade || "",
      type: t.transactionType,
      amount: t.amount,
      paymentMethod: t.paymentMethod || "",
      collectedBy: t.collectedBy?.name || "",
      status: t.status,
      remarks: t.remarks || "",
    }));
  }
}

export default new FeeReportService();
