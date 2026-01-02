import mongoose from "mongoose";
import dotenv from "dotenv";
import StudentFeeRecord from "../src/app/modules/fee/studentFeeRecord.model";
import { Student } from "../src/app/modules/student/student.model";
import { FeeType, PaymentStatus } from "../src/app/modules/fee/fee.interface";

dotenv.config();

const seedAdmissionFees = async () => {
  try {
    console.log("🌱 Starting admission fee seeding...");

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("✅ Connected to database");

    // Find all fee records
    const feeRecords = await StudentFeeRecord.find();

    if (feeRecords.length === 0) {
      console.log("❌ No fee records found in database");
      process.exit(1);
    }

    console.log(`✅ Found ${feeRecords.length} fee records`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Add admission fee to each fee record
    for (const feeRecord of feeRecords) {
      const feeRecordData = feeRecord as any;
      
      // Get student details
      const student = await Student.findById(feeRecordData.student);
      if (!student) {
        console.log(`⚠️  Student not found for fee record ${feeRecordData._id}`);
        skippedCount++;
        continue;
      }
      
      const studentData = student as any;

      // Check if admission fee already exists
      const hasAdmissionFee = feeRecordData.oneTimeFees?.some(
        (fee: any) => fee.feeType === FeeType.ADMISSION
      );

      if (hasAdmissionFee) {
        console.log(`⏭️  ${studentData.name} already has admission fee, skipping`);
        skippedCount++;
        continue;
      }

      // Determine admission fee based on grade
      let admissionFeeAmount = 0;
      const grade = studentData.grade;

      if (["Nursery", "LKG", "UKG"].includes(grade)) {
        admissionFeeAmount = 5000;
      } else if (["1", "2", "3", "4", "5"].includes(grade)) {
        admissionFeeAmount = 8000;
      } else if (["6", "7", "8"].includes(grade)) {
        admissionFeeAmount = 10000;
      } else if (["9", "10"].includes(grade)) {
        admissionFeeAmount = 12000;
      } else {
        admissionFeeAmount = 15000; // 11th and 12th
      }

      // Add admission fee to oneTimeFees array
      if (!feeRecordData.oneTimeFees) {
        feeRecordData.oneTimeFees = [];
      }

      // Randomly decide if fee should be pending or partially paid
      const random = Math.random();
      let status = PaymentStatus.PENDING;
      let paidAmount = 0;

      if (random > 0.7) {
        // 30% chance - fully paid
        status = PaymentStatus.PAID;
        paidAmount = admissionFeeAmount;
      } else if (random > 0.4) {
        // 30% chance - partially paid
        status = PaymentStatus.PARTIAL;
        paidAmount = Math.floor(admissionFeeAmount / 2);
      }
      // 40% chance - pending (default)

      feeRecordData.oneTimeFees.push({
        feeType: FeeType.ADMISSION,
        dueAmount: admissionFeeAmount,
        paidAmount: paidAmount,
        status: status,
        dueDate: new Date("2024-04-15"), // April 15, 2024
        paidDate: paidAmount > 0 ? new Date("2024-04-20") : undefined,
        waived: false,
      });

      // Update total amounts
      feeRecordData.totalFeeAmount += admissionFeeAmount;
      feeRecordData.totalPaidAmount += paidAmount;
      feeRecordData.totalDueAmount += (admissionFeeAmount - paidAmount);

      // Update overall status
      if (feeRecordData.totalPaidAmount === 0) {
        feeRecordData.status = PaymentStatus.PENDING;
      } else if (feeRecordData.totalPaidAmount >= feeRecordData.totalFeeAmount) {
        feeRecordData.status = PaymentStatus.PAID;
      } else {
        feeRecordData.status = PaymentStatus.PARTIAL;
      }

      await feeRecordData.save();

      const statusEmoji = status === PaymentStatus.PAID ? "✅" : 
                         status === PaymentStatus.PARTIAL ? "⏳" : "⏸️";
      
      console.log(
        `${statusEmoji} ${studentData.name} (${studentData.studentId}): ` +
        `₹${admissionFeeAmount} admission fee - ${status.toUpperCase()} (Paid: ₹${paidAmount})`
      );
      updatedCount++;
    }

    console.log("\n📊 Seeding Summary:");
    console.log("================================");
    console.log(`✅ Updated: ${updatedCount} records`);
    console.log(`⏭️  Skipped: ${skippedCount} records`);
    console.log(`📝 Total: ${feeRecords.length} records processed`);
    console.log("\n✨ Seeding completed successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admission fees:", error);
    process.exit(1);
  }
};

// Run the seeder
seedAdmissionFees();
