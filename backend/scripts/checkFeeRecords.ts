import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const checkFeeRecords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("✅ Connected to database");

    const StudentFeeRecord = mongoose.model(
      "StudentFeeRecord",
      new mongoose.Schema({}, { strict: false })
    );
    
    const totalRecords = await StudentFeeRecord.countDocuments();
    console.log(`\n📊 Total fee records in database: ${totalRecords}`);

    if (totalRecords > 0) {
      const records = await StudentFeeRecord.find().limit(3);
      console.log("\n💰 Sample fee records:");
      records.forEach((record: any) => {
        console.log(`\n   Student ID: ${record.student}`);
        console.log(`   Academic Year: ${record.academicYear}`);
        console.log(`   Total Fee: ₹${record.totalFeeAmount}`);
        console.log(`   Total Paid: ₹${record.totalPaidAmount}`);
        console.log(`   Total Due: ₹${record.totalDueAmount}`);
        console.log(`   One-Time Fees: ${record.oneTimeFees?.length || 0}`);
        if (record.oneTimeFees && record.oneTimeFees.length > 0) {
          record.oneTimeFees.forEach((fee: any) => {
            console.log(`      - ${fee.feeType}: ₹${fee.dueAmount} (${fee.status})`);
          });
        }
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkFeeRecords();
