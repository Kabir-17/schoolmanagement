import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const checkStudents = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("✅ Connected to database");

    const Student = mongoose.model(
      "Student",
      new mongoose.Schema({}, { strict: false })
    );
    
    const totalStudents = await Student.countDocuments();
    console.log(`\n📊 Total students in database: ${totalStudents}`);

    if (totalStudents > 0) {
      const students = await Student.find().limit(5);
      console.log("\n👥 Sample students:");
      students.forEach((student: any) => {
        console.log(`   - ${student.name} (${student.studentId}) - Grade: ${student.grade} - School: ${student.school}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkStudents();
