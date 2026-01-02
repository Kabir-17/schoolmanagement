import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const getAdminId = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("✅ Connected to database");

    const User = mongoose.model(
      "User",
      new mongoose.Schema({}, { strict: false })
    );
    const admin = await User.findOne({ role: "admin" });

    if (admin) {
      const adminData = admin as any;
      console.log("\n📋 Admin ID:", adminData._id.toString());
      console.log("Admin Username:", adminData.username);
    } else {
      console.log("❌ No admin found in database");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

getAdminId();
