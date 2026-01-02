import mongoose from "mongoose";
import FeeStructure from "../src/app/modules/fee/feeStructure.model";

const MONGODB_URI = "mongodb://127.0.0.1:27017/sms";

async function deleteAllStructures() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const result = await FeeStructure.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} fee structures\n`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

deleteAllStructures();
