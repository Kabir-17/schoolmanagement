import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const getSchoolId = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("✅ Connected to database");

    const School = mongoose.model(
      "School",
      new mongoose.Schema({}, { strict: false })
    );
    const school = await School.findOne();

    if (school) {
      const schoolData = school as any;
      console.log("\n📋 School ID:", schoolData._id.toString());
      console.log("School Name:", schoolData.schoolName || schoolData.name);
    } else {
      console.log("❌ No school found in database");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

getSchoolId();
