import mongoose from "mongoose";
import FeeStructure from "../src/app/modules/fee/feeStructure.model";

const MONGODB_URI = "mongodb://127.0.0.1:27017/sms";

async function listAllStructures() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const structures = await FeeStructure.find().sort({ createdAt: -1 });
    
    console.log(`📋 Total Fee Structures: ${structures.length}\n`);

    structures.forEach((structure, index) => {
      console.log(`${index + 1}. Grade ${structure.grade} - ${structure.academicYear}`);
      console.log(`   ID: ${structure._id}`);
      console.log(`   Active: ${structure.isActive}`);
      console.log(`   Created: ${structure.createdAt}`);
      console.log(`   Components: ${structure.feeComponents.length}`);
      
      structure.feeComponents.forEach((comp) => {
        const type = comp.isOneTime ? "ONE-TIME" : "MONTHLY";
        console.log(`      - ${comp.feeType}: ₹${comp.amount} [${type}]`);
      });
      
      console.log(`   Monthly Total: ₹${structure.totalAmount}`);
      console.log(`   One-Time Total: ₹${structure.totalOneTimeFee}`);
      console.log(`   Yearly Total: ₹${structure.totalYearlyFee}`);
      console.log("");
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

listAllStructures();
