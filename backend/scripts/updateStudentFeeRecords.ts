import mongoose from "mongoose";
import StudentFeeRecord from "../src/app/modules/fee/studentFeeRecord.model";
import FeeStructure from "../src/app/modules/fee/feeStructure.model";

const MONGODB_URI = "mongodb://127.0.0.1:27017/sms";

// Generate monthly payments
function generateMonthlyPayments(
  monthlyAmount: number,
  dueDate: number,
  academicYear: string
): any[] {
  const [startYear] = academicYear.split("-");
  const months = [];

  // Academic year: April to March
  for (let i = 0; i < 12; i++) {
    const monthIndex = (3 + i) % 12; // Start from April (3)
    const year = monthIndex < 3 ? parseInt(startYear) + 1 : parseInt(startYear);

    const month = new Date(year, monthIndex, dueDate);

    months.push({
      month: i + 1,
      dueDate: month,
      dueAmount: monthlyAmount,
      paidAmount: 0,
      status: "pending",
      waived: false,
    });
  }

  return months;
}

async function updateStudentFeeRecords() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all student fee records
    const feeRecords = await StudentFeeRecord.find()
      .populate("feeStructure")
      .populate("student", "studentId grade");

    console.log(`📋 Found ${feeRecords.length} student fee records\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const record of feeRecords) {
      try {
        const student: any = record.student;
        const oldStructure: any = record.feeStructure;

        if (!student) {
          console.log(`⚠️  Skipping record with no student link`);
          skippedCount++;
          continue;
        }

        console.log(`\n📝 Processing: ${student.studentId} (Grade ${record.grade})`);

        // Find the LATEST active fee structure
        const latestStructure = await FeeStructure.findOne({
          school: record.school,
          grade: record.grade,
          academicYear: record.academicYear,
          isActive: true,
        }).sort({ createdAt: -1 });

        if (!latestStructure) {
          console.log(`   ⚠️  No active fee structure found - skipping`);
          skippedCount++;
          continue;
        }

        // Check if update is needed
        const needsUpdate =
          !oldStructure ||
          oldStructure._id.toString() !== latestStructure._id.toString();

        if (!needsUpdate) {
          console.log(`   ✅ Already using latest structure - skipping`);
          skippedCount++;
          continue;
        }

        console.log(`   🔄 Updating to new fee structure...`);
        console.log(`      Old Structure ID: ${oldStructure?._id || "None"}`);
        console.log(`      New Structure ID: ${latestStructure._id}`);

        // Calculate new totals
        const oneTimeFeeTotal = latestStructure.feeComponents
          .filter((c: any) => c.isOneTime)
          .reduce((sum: number, c: any) => sum + c.amount, 0);
        const totalYearlyFee =
          latestStructure.totalAmount * 12 + oneTimeFeeTotal;

        console.log(`\n      Old Values:`);
        console.log(`      - Total Fee: ₹${record.totalFeeAmount}`);
        console.log(`      - Monthly: ₹${record.monthlyPayments[0]?.dueAmount || 0}`);

        console.log(`\n      New Values:`);
        console.log(`      - Monthly Fee: ₹${latestStructure.totalAmount}`);
        console.log(`      - One-Time Fees: ₹${oneTimeFeeTotal}`);
        console.log(`      - Total Yearly: ₹${totalYearlyFee}`);

        // **IMPORTANT**: Keep track of already paid amounts
        const totalPaid = record.totalPaidAmount;
        const newTotalDue = Math.max(0, totalYearlyFee - totalPaid);

        // Generate new monthly payments
        const newMonthlyPayments = generateMonthlyPayments(
          latestStructure.totalAmount,
          latestStructure.dueDate,
          record.academicYear
        );

        // Preserve paid status for already paid months
        const paidMonths = record.monthlyPayments
          .filter((p: any) => p.status === "paid")
          .map((p: any) => p.month);

        newMonthlyPayments.forEach((payment) => {
          if (paidMonths.includes(payment.month)) {
            payment.status = "paid";
            payment.paidAmount = payment.dueAmount;
          }
        });

        // Generate new one-time fees
        const newOneTimeFees = latestStructure.feeComponents
          .filter((c: any) => c.isOneTime)
          .map((c: any) => {
            // Check if this one-time fee was already paid in old structure
            const oldFee = record.oneTimeFees?.find(
              (f: any) => f.feeType === c.feeType
            );
            if (oldFee && oldFee.status === "paid") {
              return {
                feeType: c.feeType,
                dueAmount: c.amount,
                paidAmount: c.amount,
                status: "paid",
              };
            }
            return {
              feeType: c.feeType,
              dueAmount: c.amount,
              paidAmount: 0,
              status: "pending",
            };
          });

        // Update the record
        await StudentFeeRecord.updateOne(
          { _id: record._id },
          {
            $set: {
              feeStructure: latestStructure._id,
              totalFeeAmount: totalYearlyFee,
              totalDueAmount: newTotalDue,
              monthlyPayments: newMonthlyPayments,
              oneTimeFees: newOneTimeFees,
              // Keep totalPaidAmount as is
            },
          }
        );

        console.log(`\n      ✅ Updated successfully!`);
        console.log(`      - Total Paid (preserved): ₹${totalPaid}`);
        console.log(`      - New Total Due: ₹${newTotalDue}`);
        updatedCount++;
      } catch (err) {
        console.error(`      ❌ Error updating record:`, err);
        errorCount++;
      }
    }

    console.log("\n\n" + "=".repeat(60));
    console.log("📊 UPDATE SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Records: ${feeRecords.length}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log("=".repeat(60));

    if (updatedCount > 0) {
      console.log(
        `\n✅ Successfully updated ${updatedCount} student fee record(s)!`
      );
      console.log(
        `\n🔍 Verify by checking accountant dashboard - should now show correct fees`
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

updateStudentFeeRecords();
