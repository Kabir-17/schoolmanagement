import mongoose from "mongoose";
import dotenv from "dotenv";
import StudentFeeRecord from "../src/app/modules/fee/studentFeeRecord.model";
import FeeStructure from "../src/app/modules/fee/feeStructure.model";
import FeeTransaction from "../src/app/modules/fee/feeTransaction.model";
import FeeDefaulter from "../src/app/modules/fee/feeDefaulter.model";

// Import other models to ensure they're registered
import "../src/app/modules/school/school.model";
import "../src/app/modules/user/user.model";
import "../src/app/modules/student/student.model";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "";

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function fixFeeRecords() {
  console.log("\n🔧 Starting Fee Records Fix...\n");

  try {
    // Get all student fee records
    const feeRecords = await StudentFeeRecord.find({}).lean();
    console.log(`📊 Found ${feeRecords.length} student fee records to check`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const recordData of feeRecords) {
      try {
        // Get the actual mongoose document (not lean)
        const record = await StudentFeeRecord.findById(recordData._id);
        
        if (!record) {
          console.log(`⚠️  Skipping record ${recordData._id} - Record not found`);
          skippedCount++;
          continue;
        }
        
        // Get fee structure
        const feeStructure = await FeeStructure.findById(record.feeStructure);
        
        if (!feeStructure) {
          console.log(`⚠️  Skipping record ${record._id} - No fee structure found`);
          skippedCount++;
          continue;
        }

        // Calculate correct totals
        const monthlyFeePerMonth = feeStructure.totalAmount; // Already filtered to monthly-only
        const oneTimeFeeTotal = feeStructure.feeComponents
          .filter((c: any) => c.isOneTime)
          .reduce((sum: number, c: any) => sum + c.amount, 0);
        
        const correctTotalYearlyFee = (monthlyFeePerMonth * 12) + oneTimeFeeTotal;

        // Check if the record needs fixing
        if (record.totalFeeAmount !== correctTotalYearlyFee) {
          console.log(`\n🔍 Checking record for student: ${record.student}`);
          console.log(`   Current totalFeeAmount: ₹${record.totalFeeAmount}`);
          console.log(`   Correct totalFeeAmount: ₹${correctTotalYearlyFee}`);
          console.log(`   Monthly fee: ₹${monthlyFeePerMonth} × 12 = ₹${monthlyFeePerMonth * 12}`);
          console.log(`   One-time fees: ₹${oneTimeFeeTotal}`);

          // Recalculate totalDueAmount based on payments made
          const totalMonthlyPaid = record.monthlyPayments.reduce(
            (sum: number, p: any) => sum + p.paidAmount,
            0
          );
          const totalOneTimePaid = (record.oneTimeFees || []).reduce(
            (sum: number, f: any) => sum + f.paidAmount,
            0
          );
          const totalPaidAmount = totalMonthlyPaid + totalOneTimePaid;
          const totalDueAmount = Math.max(0, correctTotalYearlyFee - totalPaidAmount); // Ensure non-negative

          // Update the record
          record.totalFeeAmount = correctTotalYearlyFee;
          record.totalPaidAmount = totalPaidAmount;
          record.totalDueAmount = totalDueAmount;
          
          // If paid more than due (edge case), mark as fully paid
          if (totalPaidAmount >= correctTotalYearlyFee) {
            record.status = "paid" as any;
            console.log(`   ℹ️  Student has overpaid - marking as fully paid`);
          }

          // Make sure oneTimeFees array exists and has correct structure
          if (!record.oneTimeFees || record.oneTimeFees.length === 0) {
            const oneTimeFeesFromStructure = feeStructure.feeComponents
              .filter((c: any) => c.isOneTime)
              .map((c: any) => ({
                feeType: c.feeType,
                dueAmount: c.amount,
                paidAmount: 0,
                status: "pending",
                dueDate: new Date(), // Set to current date as default
              }));
            record.oneTimeFees = oneTimeFeesFromStructure as any;
            console.log(`   ✨ Added ${oneTimeFeesFromStructure.length} one-time fees to record`);
          }

          await record.save();
          console.log(`   ✅ Fixed record - New totalFeeAmount: ₹${record.totalFeeAmount}`);
          fixedCount++;
        } else {
          skippedCount++;
        }
      } catch (error: any) {
        console.error(`❌ Error fixing record ${recordData._id}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n=== FIX COMPLETE ===");
    console.log(`✅ Fixed: ${fixedCount} records`);
    console.log(`⏭️  Skipped (already correct): ${skippedCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);
  } catch (error: any) {
    console.error("❌ Fix failed:", error.message);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await fixFeeRecords();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

main();
