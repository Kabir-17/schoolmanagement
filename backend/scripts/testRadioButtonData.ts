import mongoose from "mongoose";
import FeeStructure from "../src/app/modules/fee/feeStructure.model";

const MONGODB_URI = "mongodb://127.0.0.1:27017/sms";

async function testRadioButtonDataSubmission() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find the most recent fee structure
    const latestStructure = await FeeStructure.findOne()
      .sort({ createdAt: -1 })
      .limit(1);

    if (!latestStructure) {
      console.log("❌ No fee structures found");
      return;
    }

    console.log("\n📋 Latest Fee Structure:");
    console.log(`   Grade: ${latestStructure.grade}`);
    console.log(`   Academic Year: ${latestStructure.academicYear}`);
    console.log(`   Created: ${latestStructure.createdAt}`);

    console.log("\n📊 Fee Components:");
    latestStructure.feeComponents.forEach((component, index) => {
      const type = component.isOneTime ? "ONE-TIME ⚡" : "MONTHLY 📅";
      const typeColor = component.isOneTime ? "\x1b[33m" : "\x1b[34m"; // Yellow or Blue
      const reset = "\x1b[0m";
      
      console.log(`   ${index + 1}. ${typeColor}${component.feeType.toUpperCase()}${reset}: ₹${component.amount} [${type}]`);
      console.log(`      isOneTime: ${component.isOneTime} (${typeof component.isOneTime})`);
      if (component.description) {
        console.log(`      Description: ${component.description}`);
      }
    });

    console.log("\n🔍 Verification:");
    
    // Check if any components have isOneTime === true
    const oneTimeComponents = latestStructure.feeComponents.filter(c => c.isOneTime === true);
    const monthlyComponents = latestStructure.feeComponents.filter(c => c.isOneTime === false);
    
    console.log(`   Monthly Components: ${monthlyComponents.length}`);
    console.log(`   One-Time Components: ${oneTimeComponents.length}`);

    console.log("\n💰 Calculated Totals:");
    console.log(`   Monthly Total (totalAmount): ₹${latestStructure.totalAmount}`);
    console.log(`   One-Time Total: ₹${latestStructure.totalOneTimeFee}`);
    console.log(`   Yearly Total: ₹${latestStructure.totalYearlyFee}`);

    console.log("\n🧮 Manual Calculation Check:");
    const manualMonthlyTotal = monthlyComponents.reduce((sum, c) => sum + c.amount, 0);
    const manualOneTimeTotal = oneTimeComponents.reduce((sum, c) => sum + c.amount, 0);
    const manualYearlyTotal = (manualMonthlyTotal * 12) + manualOneTimeTotal;

    console.log(`   Calculated Monthly: ₹${manualMonthlyTotal}`);
    console.log(`   Calculated One-Time: ₹${manualOneTimeTotal}`);
    console.log(`   Calculated Yearly: ₹${manualYearlyTotal}`);

    console.log("\n✅ Validation:");
    console.log(`   Monthly Match: ${latestStructure.totalAmount === manualMonthlyTotal ? "✅" : "❌"}`);
    console.log(`   One-Time Match: ${latestStructure.totalOneTimeFee === manualOneTimeTotal ? "✅" : "❌"}`);
    console.log(`   Yearly Match: ${latestStructure.totalYearlyFee === manualYearlyTotal ? "✅" : "❌"}`);

    // Check for boolean type correctness
    console.log("\n🔎 Type Checking:");
    let allBooleansCorrect = true;
    latestStructure.feeComponents.forEach((component, index) => {
      const isBoolean = typeof component.isOneTime === 'boolean';
      const status = isBoolean ? "✅" : "❌";
      console.log(`   Component ${index + 1}: isOneTime is ${typeof component.isOneTime} ${status}`);
      if (!isBoolean) {
        allBooleansCorrect = false;
      }
    });

    if (allBooleansCorrect) {
      console.log("\n✅ All isOneTime fields are proper booleans!");
    } else {
      console.log("\n❌ Some isOneTime fields are NOT booleans!");
    }

    // Test specific scenario: Check if one-time fees are NOT included in totalAmount
    if (oneTimeComponents.length > 0) {
      console.log("\n🎯 One-Time Fee Test:");
      const totalOfAllComponents = latestStructure.feeComponents.reduce((sum, c) => sum + c.amount, 0);
      const isCorrect = latestStructure.totalAmount < totalOfAllComponents;
      
      console.log(`   Total of ALL components: ₹${totalOfAllComponents}`);
      console.log(`   Database totalAmount: ₹${latestStructure.totalAmount}`);
      console.log(`   One-time fees EXCLUDED from totalAmount: ${isCorrect ? "✅ YES" : "❌ NO"}`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

testRadioButtonDataSubmission();
