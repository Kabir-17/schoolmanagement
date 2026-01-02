import mongoose from "mongoose";
import { Student } from "../src/app/modules/student/student.model";
import FeeStructure from "../src/app/modules/fee/feeStructure.model";

const MONGODB_URI = "mongodb://127.0.0.1:27017/sms";

async function listActualStudents() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all students
    const students = await Student.find()
      .populate('userId', 'firstName lastName')
      .limit(20)
      .lean();

    console.log(`📋 Total Students in Database: ${await Student.countDocuments()}\n`);

    if (students.length === 0) {
      console.log("❌ NO STUDENTS FOUND!");
      console.log("   You need to create students before using the accountant dashboard.\n");
    } else {
      console.log("✅ Students Found:\n");
      students.forEach((s: any, idx) => {
        const name = s.userId ? `${s.userId.firstName || ''} ${s.userId.lastName || ''}`.trim() : 'No Name';
        console.log(`${idx + 1}. _id: ${s._id}`);
        console.log(`   studentId: ${s.studentId}`);
        console.log(`   name: ${name}`);
        console.log(`   grade: ${s.grade}`);
        console.log(`   schoolId: ${s.schoolId}`);
        console.log("");
      });
    }

    // Get all fee structures
    const structures = await FeeStructure.find().sort({ createdAt: -1 });
    console.log(`\n📊 Total Fee Structures: ${structures.length}\n`);

    if (structures.length === 0) {
      console.log("❌ NO FEE STRUCTURES FOUND!");
      console.log("   Create fee structures in Admin Dashboard first.\n");
    } else {
      structures.forEach((s: any, idx) => {
        console.log(`${idx + 1}. Grade ${s.grade} - ${s.academicYear}`);
        console.log(`   _id: ${s._id}`);
        console.log(`   School: ${s.school}`);
        console.log(`   Active: ${s.isActive}`);
        console.log(`   Monthly: ₹${s.totalAmount}`);
        console.log(`   One-Time: ₹${s.totalOneTimeFee}`);
        console.log("");
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("📝 NEXT STEPS:");
    console.log("=".repeat(60));
    
    if (structures.length === 0) {
      console.log("1. Login as Admin");
      console.log("2. Navigate to Fee Structure Management");
      console.log("3. Create fee structures for each grade");
      console.log("4. Then students will have fee records automatically");
    }
    
    if (students.length > 0 && structures.length > 0) {
      console.log("✅ You have both students and fee structures!");
      console.log("   The accountant dashboard should work.");
      console.log(`   Try selecting student: ${students[0]._id}`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

listActualStudents();
