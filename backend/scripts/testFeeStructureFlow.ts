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

async function testFeeStructureFlow() {
  console.log("\n🧪 Testing One-Time Fee Structure Flow\n");

  try {
    // Create test school ID
    const testSchoolId = new mongoose.Types.ObjectId();
    const testUserId = new mongoose.Types.ObjectId();

    // Clean up any existing test data
    await FeeStructure.deleteMany({ grade: "Test Grade 10" });

    console.log("📝 Creating fee structure with:");
    console.log("   - Monthly: Tuition ₹220 + Transport ₹20 = ₹240");
    console.log("   - One-Time: Tuition ₹7,500");
    console.log("   - Expected Total Monthly: ₹240 (not ₹7,740!)");
    console.log("   - Expected Total Yearly: (₹240 × 12) + ₹7,500 = ₹10,380\n");

    // Create fee structure exactly as admin form would send it
    const feeStructure = await FeeStructure.create({
      school: testSchoolId,
      grade: "Test Grade 10",
      academicYear: "2025-2026",
      feeComponents: [
        {
          feeType: FeeType.TUITION,
          amount: 220,
          description: "Monthly tuition",
          isMandatory: true,
          isOneTime: false,
        },
        {
          feeType: FeeType.TUITION,
          amount: 7500,
          description: "One-time admission fee",
          isMandatory: true,
          isOneTime: true,
        },
        {
          feeType: FeeType.TRANSPORT,
          amount: 20,
          description: "Monthly transport",
          isMandatory: true,
          isOneTime: false,
        },
      ],
      dueDate: 10,
      lateFeePercentage: 2,
      isActive: true,
      createdBy: testUserId,
    });

    console.log("✅ Fee structure created with ID:", feeStructure._id);
    console.log("\n📊 Checking saved values:");
    console.log(`   totalAmount (should be ₹240): ₹${feeStructure.totalAmount}`);
    
    // Get virtual properties
    const feeStructureWithVirtuals = await FeeStructure.findById(feeStructure._id);
    const totalMonthly = (feeStructureWithVirtuals as any).totalMonthlyFee;
    const totalOneTime = (feeStructureWithVirtuals as any).totalOneTimeFee;
    const totalYearly = (feeStructureWithVirtuals as any).totalYearlyFee;

    console.log(`   totalMonthlyFee (virtual): ₹${totalMonthly}`);
    console.log(`   totalOneTimeFee (virtual): ₹${totalOneTime}`);
    console.log(`   totalYearlyFee (virtual): ₹${totalYearly}`);

    console.log("\n🔍 Verifying calculations:");
    const expectedMonthly = 240;
    const expectedOneTime = 7500;
    const expectedYearly = (240 * 12) + 7500; // 10,380

    const monthlyCorrect = feeStructure.totalAmount === expectedMonthly;
    const oneTimeCorrect = totalOneTime === expectedOneTime;
    const yearlyCorrect = totalYearly === expectedYearly;

    console.log(`   ✅ Monthly fee correct: ${monthlyCorrect} (${feeStructure.totalAmount} === ${expectedMonthly})`);
    console.log(`   ✅ One-time fee correct: ${oneTimeCorrect} (${totalOneTime} === ${expectedOneTime})`);
    console.log(`   ✅ Yearly fee correct: ${yearlyCorrect} (${totalYearly} === ${expectedYearly})`);

    if (monthlyCorrect && oneTimeCorrect && yearlyCorrect) {
      console.log("\n✅ ✅ ✅ ALL TESTS PASSED! ✅ ✅ ✅");
      console.log("The fee structure is being saved correctly!");
    } else {
      console.log("\n❌ ❌ ❌ TESTS FAILED! ❌ ❌ ❌");
      if (!monthlyCorrect) {
        console.log(`❌ Monthly fee wrong: got ₹${feeStructure.totalAmount}, expected ₹${expectedMonthly}`);
      }
      if (!oneTimeCorrect) {
        console.log(`❌ One-time fee wrong: got ₹${totalOneTime}, expected ₹${expectedOneTime}`);
      }
      if (!yearlyCorrect) {
        console.log(`❌ Yearly fee wrong: got ₹${totalYearly}, expected ₹${expectedYearly}`);
      }
    }

    console.log("\n📋 Fee Components Breakdown:");
    feeStructure.feeComponents.forEach((component, idx) => {
      console.log(`   ${idx + 1}. ${component.feeType}: ₹${component.amount} ${component.isOneTime ? '(ONE-TIME)' : '(MONTHLY)'}`);
    });

    // Clean up
    await FeeStructure.deleteMany({ grade: "Test Grade 10" });
    console.log("\n🧹 Test data cleaned up");

  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
  }
}

async function main() {
  try {
    await connectDB();
    await testFeeStructureFlow();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

main();
