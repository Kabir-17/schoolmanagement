import mongoose from "mongoose";
import { Student } from "../src/app/modules/student/student.model";
import FeeStructure from "../src/app/modules/fee/feeStructure.model";

const MONGODB_URI = "mongodb://127.0.0.1:27017/sms";

async function diagnoseStudent() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const targetIds = [
      "68e2a10f557e83b5b6dac0c3",
      "68e2b33172364458c06c645e"
    ];

    console.log("🔍 Checking target student IDs from error...\n");

    for (const id of targetIds) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Checking ID: ${id}`);
      console.log("=".repeat(60));

      try {
        const student: any = await Student.findById(id)
          .populate('userId', 'firstName lastName email')
          .lean();

        if (!student) {
          console.log("❌ Student NOT FOUND in database");
          continue;
        }

        console.log("✅ Student FOUND:");
        console.log(`   _id: ${student._id}`);
        console.log(`   studentId: ${student.studentId}`);
        console.log(`   grade: ${student.grade}`);
        console.log(`   schoolId: ${student.schoolId}`);
        console.log(`   userId: ${student.userId?._id || "Not populated"}`);
        console.log(`   name: ${student.userId?.firstName || "?"} ${student.userId?.lastName || "?"}`);

        // Check if fee structure exists for this grade
        const feeStructure = await FeeStructure.findOne({
          school: student.schoolId,
          grade: student.grade.toString(),
          academicYear: "2025-2026",
          isActive: true,
        }).sort({ createdAt: -1 });

        if (!feeStructure) {
          console.log(`\n❌ NO FEE STRUCTURE found for:`);
          console.log(`   School: ${student.schoolId}`);
          console.log(`   Grade: ${student.grade}`);
          console.log(`   Year: 2025-2026`);
          console.log(`\n⚠️  This is why the API returns 404!`);
          console.log(`   Solution: Create a fee structure for Grade ${student.grade}`);
        } else {
          console.log(`\n✅ Fee structure EXISTS:`);
          console.log(`   Structure ID: ${feeStructure._id}`);
          console.log(`   Grade: ${(feeStructure as any).grade}`);
          console.log(`   Monthly Fee: ₹${(feeStructure as any).totalAmount}`);
          console.log(`   One-Time Fees: ₹${(feeStructure as any).totalOneTimeFee}`);
        }

      } catch (err) {
        console.log(`❌ Error checking student: ${err}`);
      }
    }

    // List all available fee structures
    console.log(`\n\n${"=".repeat(60)}`);
    console.log("📋 ALL FEE STRUCTURES IN DATABASE");
    console.log("=".repeat(60));

    const structures = await FeeStructure.find({ isActive: true }).sort({ createdAt: -1 });
    
    if (structures.length === 0) {
      console.log("❌ NO FEE STRUCTURES FOUND!");
      console.log("   You need to create fee structures for each grade.");
    } else {
      structures.forEach((s: any) => {
        console.log(`\n✅ Grade ${s.grade} - ${s.academicYear}`);
        console.log(`   School: ${s.school}`);
        console.log(`   Monthly: ₹${s.totalAmount}`);
        console.log(`   One-Time: ₹${s.totalOneTimeFee}`);
        console.log(`   Created: ${s.createdAt}`);
      });
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

diagnoseStudent();
