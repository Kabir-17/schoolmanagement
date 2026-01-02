import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("✅ Connected to database");

    const User = mongoose.model(
      "User",
      new mongoose.Schema({}, { strict: false })
    );
    
    const users = await User.find({ role: { $in: ["accountant", "parent", "student"] } });
    console.log(`\n📊 Found ${users.length} users:\n`);
    
    users.forEach((user: any) => {
      console.log(`Role: ${user.role}`);
      console.log(`Email: ${user.email || user.username}`);
      console.log(`Username: ${user.username}`);
      console.log(`---`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkUsers();
