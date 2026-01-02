import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { Student } from "../src/app/modules/student/student.model";
import { School } from "../src/app/modules/school/school.model";
import FeeStructure from "../src/app/modules/fee/feeStructure.model";
import StudentFeeRecord from "../src/app/modules/fee/studentFeeRecord.model";
import FeeTransaction from "../src/app/modules/fee/feeTransaction.model";
import { PaymentStatus, Month, PaymentMethod, TransactionStatus } from "../src/app/modules/fee/fee.interface";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://localhost:27017/school_management";

async function seedStudentFeeRecords() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get school
    const school = await School.findOne();
    if (!school) {
      console.error("❌ No school found. Please create a school first.");
      process.exit(1);
    }
    console.log(`✅ Found school: ${school.name} (ID: ${school._id})`);

    // Get current academic year
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    console.log(`📅 Academic Year: ${academicYear}`);

    // Get all students - try both school field and schoolId
    let students = await Student.find({ schoolId: school._id }).limit(20);
    if (students.length === 0) {
      students = await Student.find({ school: school._id }).limit(20);
    }
    
    if (students.length === 0) {
      // Try to find any students
      const anyStudents = await Student.find().limit(5);
      console.log(`Found ${anyStudents.length} students in total`);
      if (anyStudents.length > 0) {
        console.log("Sample student:", anyStudents[0]);
      }
      console.error("❌ No students found for this school. Please create students first.");
      console.error(`School ID: ${school._id}`);
      process.exit(1);
    }
    console.log(`✅ Found ${students.length} students`);

    // Delete existing fee records for this academic year
    await StudentFeeRecord.deleteMany({ school: school._id, academicYear });
    await FeeTransaction.deleteMany({ school: school._id, academicYear });
    console.log("🗑️  Cleared existing fee records and transactions");

    let recordsCreated = 0;
    let transactionsCreated = 0;

    for (const student of students) {
      try {
        // Get fee structure for this student's grade
        const feeStructure = await FeeStructure.findOne({
          school: school._id,
          grade: student.grade,
          academicYear,
          isActive: true,
        });

        if (!feeStructure) {
          console.log(`⚠️  No fee structure found for Grade ${student.grade}, skipping student ${student.studentId}`);
          continue;
        }

        // Calculate monthly fee (excluding one-time fees)
        const totalMonthlyFee = feeStructure.totalAmount; // This already excludes one-time fees
        
        // Calculate one-time fees separately
        const oneTimeFees = feeStructure.feeComponents
          .filter((c: any) => c.isOneTime)
          .map((c: any) => ({
            feeType: c.feeType,
            dueAmount: c.amount,
            paidAmount: 0, // For seed data, assume not paid yet
            status: PaymentStatus.PENDING,
          }));
        
        const oneTimeFeeTotal = feeStructure.feeComponents
          .filter((c: any) => c.isOneTime)
          .reduce((sum: number, c: any) => sum + c.amount, 0);

        // Create monthly payments (all 12 months)
        const monthlyPayments = [];
        const currentMonth = new Date().getMonth() + 1; // 1-12

        for (let month = 1; month <= 12; month++) {
          const dueDate = new Date(currentYear, month - 1, feeStructure.dueDate);
          
          // Determine payment status based on current month
          let status = PaymentStatus.PENDING;
          let paidAmount = 0;
          let paidDate = undefined;
          let lateFee = 0;

          if (month < currentMonth) {
            // Past months - randomly make some paid, some overdue
            const randomStatus = Math.random();
            if (randomStatus < 0.7) {
              // 70% paid
              status = PaymentStatus.PAID;
              paidAmount = totalMonthlyFee;
              paidDate = new Date(currentYear, month - 1, feeStructure.dueDate + Math.floor(Math.random() * 10));
            } else if (randomStatus < 0.85) {
              // 15% partial
              status = PaymentStatus.PARTIAL;
              paidAmount = Math.floor(totalMonthlyFee * (0.3 + Math.random() * 0.4));
              paidDate = new Date(currentYear, month - 1, feeStructure.dueDate + Math.floor(Math.random() * 10));
              lateFee = Math.floor(totalMonthlyFee * (feeStructure.lateFeePercentage / 100));
            } else {
              // 15% overdue
              status = PaymentStatus.OVERDUE;
              paidAmount = 0;
              lateFee = Math.floor(totalMonthlyFee * (feeStructure.lateFeePercentage / 100));
            }
          } else if (month === currentMonth) {
            // Current month - randomly assign
            const randomStatus = Math.random();
            if (randomStatus < 0.3) {
              status = PaymentStatus.PAID;
              paidAmount = totalMonthlyFee;
              paidDate = new Date();
            } else if (randomStatus < 0.5) {
              status = PaymentStatus.PARTIAL;
              paidAmount = Math.floor(totalMonthlyFee * (0.3 + Math.random() * 0.4));
              paidDate = new Date();
            } else {
              status = PaymentStatus.PENDING;
            }
          } else {
            // Future months - all pending
            status = PaymentStatus.PENDING;
          }

          monthlyPayments.push({
            month,
            dueAmount: totalMonthlyFee,
            paidAmount,
            status,
            dueDate,
            paidDate,
            lateFee,
            waived: false,
          });
        }

        // Calculate totals
        const totalMonthlyPaid = monthlyPayments.reduce((sum, mp) => sum + mp.paidAmount, 0);
        const totalOneTimePaid = oneTimeFees.reduce((sum, f) => sum + f.paidAmount, 0);
        const totalPaidAmount = totalMonthlyPaid + totalOneTimePaid;
        
        // Total yearly fee = (monthly × 12) + one-time fees
        const totalYearlyFee = (totalMonthlyFee * 12) + oneTimeFeeTotal;
        const totalDueAmount = totalYearlyFee - totalPaidAmount;
        const totalLateFee = monthlyPayments.reduce((sum, mp) => sum + mp.lateFee, 0);

        // Create student fee record
        const feeRecord = await StudentFeeRecord.create({
          student: student._id,
          school: school._id,
          grade: student.grade,
          academicYear,
          feeStructure: feeStructure._id,
          totalFeeAmount: totalYearlyFee, // Now includes one-time fees correctly
          totalPaidAmount,
          totalDueAmount,
          monthlyPayments,
          oneTimeFees, // Add one-time fees array
          nextDueMonth: monthlyPayments.find(mp => mp.status === PaymentStatus.PENDING)?.month || null,
          overdueFees: monthlyPayments.filter(mp => mp.status === PaymentStatus.OVERDUE).length,
          totalLateFee,
        });

        recordsCreated++;

        // Create transactions for paid and partial payments
        for (const payment of monthlyPayments) {
          if (payment.paidAmount > 0) {
            const receiptNumber = `RCP${currentYear}${String(payment.month).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
            
            const transaction = await FeeTransaction.create({
              student: student._id,
              school: school._id,
              academicYear,
              feeStructure: feeStructure._id,
              amount: payment.paidAmount,
              lateFee: payment.lateFee,
              totalAmount: payment.paidAmount + payment.lateFee,
              paymentMethod: [PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER, PaymentMethod.ONLINE][Math.floor(Math.random() * 3)],
              transactionNumber: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
              receiptNumber,
              status: TransactionStatus.COMPLETED,
              month: payment.month,
              createdBy: school.adminUserId,
            });

            transactionsCreated++;
          }
        }

        const studentData = await Student.findById(student._id).populate('userId', 'firstName lastName');
        const studentName = studentData?.userId ? `${(studentData.userId as any).firstName} ${(studentData.userId as any).lastName}` : 'Unknown';
        console.log(`✅ Created fee record for ${studentName} (${student.studentId}) - Grade ${student.grade}`);
      } catch (error) {
        console.error(`❌ Error creating fee record for student ${student.studentId}:`, error);
      }
    }

    console.log("\n=== SEEDING COMPLETE ===");
    console.log(`✅ Created ${recordsCreated} student fee records`);
    console.log(`✅ Created ${transactionsCreated} fee transactions`);
    console.log(`📊 Academic Year: ${academicYear}`);
    console.log(`🏫 School: ${school.name}`);

    // Display summary statistics
    const totalRecords = await StudentFeeRecord.countDocuments({ school: school._id, academicYear });
    const totalTransactions = await FeeTransaction.countDocuments({ school: school._id, academicYear });
    const totalRevenue = await FeeTransaction.aggregate([
      { $match: { school: school._id, academicYear, status: TransactionStatus.COMPLETED } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    console.log("\n=== SUMMARY ===");
    console.log(`📋 Total Fee Records: ${totalRecords}`);
    console.log(`💰 Total Transactions: ${totalTransactions}`);
    console.log(`💵 Total Revenue Collected: ₹${totalRevenue[0]?.total?.toLocaleString('en-IN') || 0}`);

  } catch (error) {
    console.error("❌ Error seeding student fee records:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the seeding
seedStudentFeeRecords();
