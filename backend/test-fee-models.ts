import mongoose from "mongoose";
import dotenv from "dotenv";
import FeeStructure from "./src/app/modules/fee/feeStructure.model";
import StudentFeeRecord from "./src/app/modules/fee/studentFeeRecord.model";
import FeeTransaction from "./src/app/modules/fee/feeTransaction.model";
import FeeDefaulter from "./src/app/modules/fee/feeDefaulter.model";
import { FeeType, Month, PaymentMethod, TransactionType } from "./src/app/modules/fee/fee.interface";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || "";

// Test data IDs (you can replace these with actual IDs from your database)
const TEST_SCHOOL_ID = new mongoose.Types.ObjectId();
const TEST_STUDENT_ID = new mongoose.Types.ObjectId();
const TEST_USER_ID = new mongoose.Types.ObjectId();

async function connectDB() {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function testFeeStructureModel() {
  console.log("\n🧪 Testing FeeStructure Model...");
  
  try {
    // Create a fee structure
    const feeStructure = await FeeStructure.create({
      school: TEST_SCHOOL_ID,
      grade: "Grade 1",
      academicYear: "2025-2026",
      feeComponents: [
        {
          feeType: FeeType.TUITION,
          amount: 10000,
          description: "Monthly tuition fee",
          isMandatory: true,
        },
        {
          feeType: FeeType.TRANSPORT,
          amount: 2000,
          description: "Bus transportation",
          isMandatory: false,
        },
      ],
      totalAmount: 12000, // Will be auto-calculated if pre-save middleware runs
      dueDate: 10,
      lateFeePercentage: 5,
      isActive: true,
      createdBy: TEST_USER_ID,
    });

    console.log("✅ Fee structure created:", feeStructure._id);
    console.log("   Total amount (auto-calculated):", feeStructure.totalAmount);

    // Test finding active fee structure
    const foundStructure = await FeeStructure.findOne({
      school: TEST_SCHOOL_ID,
      grade: "Grade 1",
      academicYear: "2025-2026",
      isActive: true,
    });

    console.log("✅ Found active fee structure:", foundStructure?._id);

    // Test deactivation
    await feeStructure.deactivate(TEST_USER_ID.toString());
    console.log("✅ Fee structure deactivated");

    return feeStructure._id;
  } catch (error: any) {
    console.error("❌ FeeStructure test failed:", error.message);
    throw error;
  }
}

async function testStudentFeeRecordModel(feeStructureId: mongoose.Types.ObjectId) {
  console.log("\n🧪 Testing StudentFeeRecord Model...");
  
  try {
    // Create student fee record
    const feeRecord = await StudentFeeRecord.create({
      student: TEST_STUDENT_ID,
      school: TEST_SCHOOL_ID,
      grade: "Grade 1",
      academicYear: "2025-2026",
      feeStructure: feeStructureId,
      totalFeeAmount: 144000, // 12000 per month * 12
      totalPaidAmount: 0,
      totalDueAmount: 144000,
      monthlyPayments: Array.from({ length: 12 }, (_, i) => ({
        month: ((Month.APRIL + i - 1) % 12) + 1,
        dueAmount: 12000,
        paidAmount: 0,
        status: "pending",
        dueDate: new Date(2025, (Month.APRIL + i - 1) % 12, 10),
        lateFee: 0,
        waived: false,
      })),
      status: "pending",
    });

    console.log("✅ Student fee record created:", feeRecord._id);
    console.log("   Total fee amount:", feeRecord.totalFeeAmount);
    console.log("   Monthly payments count:", feeRecord.monthlyPayments.length);

    // Test recording payment
    await feeRecord.recordPayment(Month.APRIL, 12000);
    console.log("✅ Payment recorded for April");
    console.log("   Total paid amount:", feeRecord.totalPaidAmount);
    console.log("   Total due amount:", feeRecord.totalDueAmount);
    console.log("   Status:", feeRecord.status);

    // Test applying late fee
    await feeRecord.applyLateFee(Month.MAY, 5);
    console.log("✅ Late fee applied for May");

    // Test waiving fee
    await feeRecord.waiveFee(Month.JUNE, "Financial hardship", TEST_USER_ID.toString());
    console.log("✅ Fee waived for June");

    // Test getting overdue months
    const overdueMonths = feeRecord.getOverdueMonths();
    console.log("✅ Overdue months:", overdueMonths);

    return feeRecord._id;
  } catch (error: any) {
    console.error("❌ StudentFeeRecord test failed:", error.message);
    throw error;
  }
}

async function testFeeTransactionModel(feeRecordId: mongoose.Types.ObjectId) {
  console.log("\n🧪 Testing FeeTransaction Model...");
  
  try {
    // Create payment transaction
    const transaction = await FeeTransaction.create({
      transactionId: `TXN-TEST-${Date.now()}`, // Temporary, will be auto-generated
      student: TEST_STUDENT_ID,
      studentFeeRecord: feeRecordId,
      school: TEST_SCHOOL_ID,
      transactionType: TransactionType.PAYMENT,
      amount: 12000,
      paymentMethod: PaymentMethod.CASH,
      month: Month.APRIL,
      collectedBy: TEST_USER_ID,
      remarks: "Test payment",
      status: "completed",
      auditLog: {
        ipAddress: "192.168.1.1",
        deviceInfo: "Test Device",
        timestamp: new Date(),
      },
    });

    console.log("✅ Transaction created:", transaction._id);
    console.log("   Transaction ID:", transaction.transactionId);
    console.log("   Receipt Number:", transaction.receiptNumber);

    // Test canBeCancelled
    const canCancel = transaction.canBeCancelled();
    console.log("✅ Can be cancelled:", canCancel);

    // Test getting transactions by date range
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const transactions = await FeeTransaction.find({
      school: TEST_SCHOOL_ID,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    console.log("✅ Found", transactions.length, "transactions today");

    // Test daily collection summary
    const summary = await FeeTransaction.aggregate([
      {
        $match: {
          school: TEST_SCHOOL_ID,
          transactionType: TransactionType.PAYMENT,
          status: "completed",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("✅ Daily collection summary:", summary);

    return transaction._id;
  } catch (error: any) {
    console.error("❌ FeeTransaction test failed:", error.message);
    throw error;
  }
}

async function testFeeDefaulterModel(feeRecordId: mongoose.Types.ObjectId) {
  console.log("\n🧪 Testing FeeDefaulter Model...");
  
  try {
    // Create fee defaulter
    const defaulter = await FeeDefaulter.create({
      student: TEST_STUDENT_ID,
      studentFeeRecord: feeRecordId,
      school: TEST_SCHOOL_ID,
      grade: "Grade 1",
      totalDueAmount: 36000,
      overdueMonths: [Month.JULY, Month.AUGUST, Month.SEPTEMBER],
      daysSinceFirstDue: 45,
      notificationCount: 0,
    });

    console.log("✅ Fee defaulter created:", defaulter._id);
    console.log("   Total due amount:", defaulter.totalDueAmount);
    console.log("   Overdue months:", defaulter.overdueMonths);
    console.log("   Days since first due:", defaulter.daysSinceFirstDue);

    // Test reminder tracking
    const needsReminder = defaulter.isReminderDue(7);
    console.log("✅ Needs reminder:", needsReminder);

    if (needsReminder) {
      await defaulter.recordReminder();
      console.log("✅ Reminder recorded");
      console.log("   Notification count:", defaulter.notificationCount);
    }

    // Test severity level (virtual field)
    const severity = (defaulter as any).severityLevel;
    console.log("✅ Severity level:", severity);

    // Test getting defaulters by grade
    const gradeDefaulters = await FeeDefaulter.aggregate([
      {
        $match: { school: TEST_SCHOOL_ID },
      },
      {
        $group: {
          _id: "$grade",
          count: { $sum: 1 },
          totalDue: { $sum: "$totalDueAmount" },
        },
      },
    ]);

    console.log("✅ Defaulters by grade:", gradeDefaulters);

    return defaulter._id;
  } catch (error: any) {
    console.error("❌ FeeDefaulter test failed:", error.message);
    throw error;
  }
}

async function cleanup() {
  console.log("\n🧹 Cleaning up test data...");
  
  try {
    await FeeStructure.deleteMany({ school: TEST_SCHOOL_ID });
    await StudentFeeRecord.deleteMany({ school: TEST_SCHOOL_ID });
    await FeeTransaction.deleteMany({ school: TEST_SCHOOL_ID });
    await FeeDefaulter.deleteMany({ school: TEST_SCHOOL_ID });
    
    console.log("✅ Test data cleaned up");
  } catch (error: any) {
    console.error("❌ Cleanup failed:", error.message);
  }
}

async function runAllTests() {
  console.log("🚀 Starting Fee Management System Model Tests\n");
  console.log("Test School ID:", TEST_SCHOOL_ID);
  console.log("Test Student ID:", TEST_STUDENT_ID);
  console.log("Test User ID:", TEST_USER_ID);
  
  try {
    await connectDB();
    
    const feeStructureId = await testFeeStructureModel();
    const feeRecordId = await testStudentFeeRecordModel(feeStructureId);
    await testFeeTransactionModel(feeRecordId);
    await testFeeDefaulterModel(feeRecordId);
    
    console.log("\n✅ All tests passed successfully!");
    
    await cleanup();
    
  } catch (error: any) {
    console.error("\n❌ Tests failed:", error.message);
    await cleanup();
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

// Run tests
runAllTests();
