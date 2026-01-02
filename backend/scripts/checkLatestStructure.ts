import mongoose from "mongoose";
import FeeStructure from "../src/app/modules/fee/feeStructure.model";

const MONGODB_URI = "mongodb://127.0.0.1:27017/sms";

async function checkLatestStructure() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const structure = await FeeStructure.findOne({ grade: "9" })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!structure) {
      console.log("❌ No Grade 9 fee structure found");
      return;
    }

    console.log("📋 Grade 9 Fee Structure");
    console.log("   Academic Year:", structure.academicYear);
    console.log("   Created:", structure.createdAt);
    console.log("");

    console.log("📊 Fee Components:");
    structure.feeComponents.forEach((comp, i) => {
      console.log(`   ${i + 1}. ${comp.feeType}: ₹${comp.amount}`);
      console.log(`      isOneTime: ${comp.isOneTime} (${typeof comp.isOneTime})`);
    });
    console.log("");

    console.log("💰 Totals:");
    console.log(`   totalAmount: ₹${structure.totalAmount}`);
    console.log(`   totalMonthlyFee: ₹${structure.totalMonthlyFee}`);
    console.log(`   totalOneTimeFee: ₹${structure.totalOneTimeFee}`);
    console.log(`   totalYearlyFee: ₹${structure.totalYearlyFee}`);
    console.log("");

    // Manual calculation
    const monthlyOnly = structure.feeComponents
      .filter((c) => c.isOneTime === false)
      .reduce((sum, c) => sum + c.amount, 0);
    
    const oneTimeOnly = structure.feeComponents
      .filter((c) => c.isOneTime === true)
      .reduce((sum, c) => sum + c.amount, 0);

    console.log("🧮 Expected Calculations:");
    console.log(`   Monthly (false only): ₹${monthlyOnly}`);
    console.log(`   One-Time (true only): ₹${oneTimeOnly}`);
    console.log(`   Yearly: ₹${(monthlyOnly * 12) + oneTimeOnly}`);
    console.log("");

    console.log("✅ Validation:");
    console.log(`   totalAmount === ${monthlyOnly}? ${structure.totalAmount === monthlyOnly ? "✅ YES" : "❌ NO"}`);
    console.log(`   totalOneTimeFee === ${oneTimeOnly}? ${structure.totalOneTimeFee === oneTimeOnly ? "✅ YES" : "❌ NO"}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkLatestStructure();
