import mongoose from "mongoose";
import dotenv from "dotenv";
import FeeStructure from "../src/app/modules/fee/feeStructure.model";
import { FeeType } from "../src/app/modules/fee/fee.interface";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "";

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function testRadioButtonLogic() {
  console.log("\n🧪 Testing Radio Button Logic (Monthly vs One-Time)\n");

  try {
    const testSchoolId = new mongoose.Types.ObjectId();
    const testUserId = new mongoose.Types.ObjectId();

    // Clean up
    await FeeStructure.deleteMany({ grade: "Test Radio Grade" });

    console.log("📝 Test Case 1: Create with mixed monthly and one-time fees");
    console.log("   - Monthly: Tuition ₹1000, Transport ₹200");
    console.log("   - One-Time: Admission ₹5000, Annual ₹3000\n");

    const feeStructure1 = await FeeStructure.create({
      school: testSchoolId,
      grade: "Test Radio Grade",
      academicYear: "2025-2026",
      feeComponents: [
        {
          feeType: FeeType.TUITION,
          amount: 1000,
          description: "Monthly tuition",
          isMandatory: true,
          isOneTime: false, // MONTHLY
        },
        {
          feeType: FeeType.ADMISSION,
          amount: 5000,
          description: "One-time admission",
          isMandatory: true,
          isOneTime: true, // ONE-TIME
        },
        {
          feeType: FeeType.TRANSPORT,
          amount: 200,
          description: "Monthly transport",
          isMandatory: true,
          isOneTime: false, // MONTHLY
        },
        {
          feeType: FeeType.ANNUAL,
          amount: 3000,
          description: "Annual charges",
          isMandatory: true,
          isOneTime: true, // ONE-TIME
        },
      ],
      dueDate: 10,
      lateFeePercentage: 2,
      isActive: true,
      createdBy: testUserId,
    });

    const fs1 = await FeeStructure.findById(feeStructure1._id);
    
    console.log("✅ Fee structure created");
    console.log("\n📊 Saved Components:");
    fs1?.feeComponents.forEach((comp, idx) => {
      const type = comp.isOneTime ? "ONE-TIME ⚡" : "MONTHLY 📅";
      const color = comp.isOneTime ? "\x1b[33m" : "\x1b[34m"; // Yellow or Blue
      console.log(`   ${color}${idx + 1}. ${comp.feeType.toUpperCase()}: ₹${comp.amount} [${type}]\x1b[0m`);
    });

    console.log("\n🔍 Verifying Calculations:");
    const monthlyComponents = fs1?.feeComponents.filter(c => !c.isOneTime) || [];
    const oneTimeComponents = fs1?.feeComponents.filter(c => c.isOneTime) || [];
    
    const monthlyTotal = monthlyComponents.reduce((sum, c) => sum + c.amount, 0);
    const oneTimeTotal = oneTimeComponents.reduce((sum, c) => sum + c.amount, 0);
    
    console.log(`   Monthly Total: ₹${monthlyTotal} (${monthlyComponents.length} components)`);
    console.log(`   One-Time Total: ₹${oneTimeTotal} (${oneTimeComponents.length} components)`);
    console.log(`   Yearly Total: ₹${(monthlyTotal * 12) + oneTimeTotal}`);
    
    console.log(`\n   Database totalAmount: ₹${fs1?.totalAmount}`);
    console.log(`   Expected (monthly only): ₹${monthlyTotal}`);
    console.log(`   Match: ${fs1?.totalAmount === monthlyTotal ? '✅ YES' : '❌ NO'}`);

    // Test Case 2: Verify mutual exclusivity
    console.log("\n\n📝 Test Case 2: Verify no component is both monthly AND one-time");
    let hasBothIssue = false;
    fs1?.feeComponents.forEach((comp, idx) => {
      if (comp.isOneTime === undefined || comp.isOneTime === null) {
        console.log(`   ❌ Component ${idx + 1} (${comp.feeType}): isOneTime is undefined/null`);
        hasBothIssue = true;
      }
    });
    
    if (!hasBothIssue) {
      console.log("   ✅ All components have valid isOneTime boolean values");
    }

    // Test Case 3: Update existing component
    console.log("\n\n📝 Test Case 3: Toggle component from monthly to one-time");
    console.log("   Changing Transport from MONTHLY to ONE-TIME");
    
    const transportIdx = fs1?.feeComponents.findIndex(c => c.feeType === FeeType.TRANSPORT);
    if (transportIdx !== undefined && transportIdx !== -1 && fs1) {
      fs1.feeComponents[transportIdx].isOneTime = true;
      await fs1.save();
      
      const updated = await FeeStructure.findById(fs1._id);
      const newMonthlyTotal = updated?.feeComponents
        .filter(c => !c.isOneTime)
        .reduce((sum, c) => sum + c.amount, 0) || 0;
      
      console.log(`   Previous totalAmount: ₹1200 (1000 + 200)`);
      console.log(`   New totalAmount: ₹${updated?.totalAmount}`);
      console.log(`   Expected: ₹1000 (only tuition now)`);
      console.log(`   Match: ${updated?.totalAmount === 1000 ? '✅ YES' : '❌ NO'}`);
    }

    // Clean up
    await FeeStructure.deleteMany({ grade: "Test Radio Grade" });
    console.log("\n🧹 Test data cleaned up");

    console.log("\n" + "=".repeat(60));
    console.log("✅ ✅ ✅ RADIO BUTTON LOGIC TEST COMPLETE ✅ ✅ ✅");
    console.log("=".repeat(60));

  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
  }
}

async function main() {
  try {
    await connectDB();
    await testRadioButtonLogic();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

main();
