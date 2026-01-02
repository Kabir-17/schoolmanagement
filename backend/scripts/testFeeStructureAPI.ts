import axios from "axios";

const BASE_URL = "http://localhost:5000/api/fees";

async function testCreateViaAPI() {
  try {
    console.log("🔐 Logging in...\n");

    // Login to get auth token
    const loginResponse = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        username: "admin",
        password: "admin123",
      }
    );

    const cookies = loginResponse.headers["set-cookie"];
    console.log("✅ Logged in successfully\n");

    console.log("📝 Creating fee structure via API...\n");

    const feeStructureData = {
      school: "68de0f0c68cb342474ac8bff",
      grade: "9",
      academicYear: "2025-2026",
      feeComponents: [
        {
          feeType: "tuition",
          amount: 100,
          description: "",
          isMandatory: true,
          isOneTime: false,
        },
        {
          feeType: "admission",
          amount: 500,
          description: "",
          isMandatory: true,
          isOneTime: true,
        },
      ],
      dueDate: 10,
      lateFeePercentage: 2,
    };

    console.log("📊 Request Data:");
    console.log("   Component 1: tuition ₹100 [Monthly]");
    console.log("   Component 2: admission ₹500 [One-Time]");
    console.log("");

    const response = await axios.post(
      `${BASE_URL}/structures`,
      feeStructureData,
      {
        headers: {
          Cookie: cookies?.join("; ") || "",
        },
      }
    );

    console.log("✅ Fee Structure Created!\n");

    const structure = response.data.data;

    console.log("💰 Response Data:");
    console.log(`   totalAmount: ₹${structure.totalAmount}`);
    console.log(`   totalMonthlyFee: ₹${structure.totalMonthlyFee}`);
    console.log(`   totalOneTimeFee: ₹${structure.totalOneTimeFee}`);
    console.log(`   totalYearlyFee: ₹${structure.totalYearlyFee}`);
    console.log("");

    console.log("🎯 Expected:");
    console.log("   totalAmount: ₹100");
    console.log("   totalOneTimeFee: ₹500");
    console.log("   totalYearlyFee: ₹1700 (100 × 12 + 500)");
    console.log("");

    console.log("✅ Validation:");
    const isCorrect =
      structure.totalAmount === 100 &&
      structure.totalOneTimeFee === 500 &&
      structure.totalYearlyFee === 1700;

    if (isCorrect) {
      console.log("   🎉 ALL CORRECT!");
    } else {
      console.log("   ❌ INCORRECT!");
      if (structure.totalAmount !== 100) {
        console.log(
          `   - totalAmount is ₹${structure.totalAmount} but should be ₹100`
        );
      }
      if (structure.totalOneTimeFee !== 500) {
        console.log(
          `   - totalOneTimeFee is ₹${structure.totalOneTimeFee} but should be ₹500`
        );
      }
      if (structure.totalYearlyFee !== 1700) {
        console.log(
          `   - totalYearlyFee is ₹${structure.totalYearlyFee} but should be ₹1700`
        );
      }
    }
  } catch (error: any) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

testCreateViaAPI();
