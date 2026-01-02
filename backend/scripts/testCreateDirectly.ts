import mongoose from "mongoose";
import FeeStructure from "../src/app/modules/fee/feeStructure.model";

const MONGODB_URI = "mongodb://127.0.0.1:27017/sms";

async function testCreateStructure() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Create test structure matching your form data
    const testData = {
      school: new mongoose.Types.ObjectId("68de0f0c68cb342474ac8bff"),
      grade: "9",
      academicYear: "2025-2026",
      createdBy: new mongoose.Types.ObjectId("68de0f0c68cb342474ac8bff"),
      feeComponents: [
        {
          feeType: "tuition",
          amount: 200,
          description: "",
          isMandatory: true,
          isOneTime: false,
        },
        {
          feeType: "tuition",
          amount: 1200,
          description: "",
          isMandatory: true,
          isOneTime: true,
        },
      ],
      dueDate: 10,
      lateFeePercentage: 2,
    };

    console.log("📝 Creating fee structure...");
    console.log("   Grade:", testData.grade);
    console.log("   Year:", testData.academicYear);
    console.log("   Component 1: Tuition ₹200 (Monthly)");
    console.log("   Component 2: Tuition ₹1200 (One-Time)");
    console.log("");

    const structure = await FeeStructure.create(testData);

    console.log("✅ Structure Created!");
    console.log("");

    console.log("💰 Database Values (after pre-save hook):");
    console.log(`   totalAmount: ₹${structure.totalAmount}`);
    console.log(`   totalMonthlyFee: ₹${structure.totalMonthlyFee}`);
    console.log(`   totalOneTimeFee: ₹${structure.totalOneTimeFee}`);
    console.log(`   totalYearlyFee: ₹${structure.totalYearlyFee}`);
    console.log("");

    console.log("🎯 Expected Values:");
    console.log("   totalAmount: ₹200 (monthly only)");
    console.log("   totalOneTimeFee: ₹1200 (one-time only)");
    console.log("   totalYearlyFee: ₹3600 (200 × 12 + 1200)");
    console.log("");

    console.log("✅ Validation:");
    const isCorrect = structure.totalAmount === 200 && 
                      structure.totalOneTimeFee === 1200 && 
                      structure.totalYearlyFee === 3600;
    
    if (isCorrect) {
      console.log("   🎉 ALL CORRECT! One-time fees are properly excluded!");
    } else {
      console.log("   ❌ INCORRECT! One-time fees are being included in monthly total!");
      console.log("");
      console.log("   Issues:");
      if (structure.totalAmount !== 200) {
        console.log(`   - totalAmount is ₹${structure.totalAmount} but should be ₹200`);
      }
      if (structure.totalOneTimeFee !== 1200) {
        console.log(`   - totalOneTimeFee is ₹${structure.totalOneTimeFee} but should be ₹1200`);
      }
      if (structure.totalYearlyFee !== 3600) {
        console.log(`   - totalYearlyFee is ₹${structure.totalYearlyFee} but should be ₹3600`);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

testCreateStructure();
