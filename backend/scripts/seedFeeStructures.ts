import mongoose from "mongoose";
import dotenv from "dotenv";
import FeeStructure from "../src/app/modules/fee/feeStructure.model";
import { FeeType } from "../src/app/modules/fee/fee.interface";

dotenv.config();

const seedFeeStructures = async () => {
  try {
    console.log("🌱 Starting fee structure seeding...");

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("✅ Connected to database");

    // School ID and Admin ID from database
    const schoolId = "68cb934a38220ab17e8d62b9";
    const adminId = "68cb2016cb9f21be42020ce0";

    // Clear existing fee structures for this school
    await FeeStructure.deleteMany({ school: schoolId });
    console.log("🗑️  Cleared existing fee structures");

    // Define fee structures for different grades
    const grades = [
      "Nursery",
      "LKG",
      "UKG",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
    ];

    const academicYear = "2024-2025";

    // Create fee structures for each grade
    const feeStructures = [];

    for (const grade of grades) {
      let baseTuitionFee = 0;

      // Different fee structures based on grade
      if (["Nursery", "LKG", "UKG"].includes(grade)) {
        // Pre-primary classes
        baseTuitionFee = 3000;
      } else if (["1", "2", "3", "4", "5"].includes(grade)) {
        // Primary classes
        baseTuitionFee = 4000;
      } else if (["6", "7", "8"].includes(grade)) {
        // Middle school
        baseTuitionFee = 5000;
      } else if (["9", "10"].includes(grade)) {
        // High school
        baseTuitionFee = 6000;
      } else {
        // Senior secondary (11, 12)
        baseTuitionFee = 7000;
      }

      const feeComponents = [
        {
          feeType: FeeType.TUITION,
          amount: baseTuitionFee,
          description: "Monthly tuition fee",
          isMandatory: true,
        },
        {
          feeType: FeeType.LIBRARY,
          amount: 200,
          description: "Library maintenance and books",
          isMandatory: true,
        },
        {
          feeType: FeeType.SPORTS,
          amount: 300,
          description: "Sports activities and equipment",
          isMandatory: true,
        },
      ];

      // Add examination fee for higher classes
      if (!["Nursery", "LKG", "UKG"].includes(grade)) {
        feeComponents.push({
          feeType: FeeType.EXAM,
          amount: 500,
          description: "Examination and assessment",
          isMandatory: true,
        });
      }

      // Add laboratory fee for science students (6-12)
      if (["6", "7", "8", "9", "10", "11", "12"].includes(grade)) {
        feeComponents.push({
          feeType: FeeType.LAB,
          amount: 600,
          description: "Science laboratory facilities",
          isMandatory: true,
        });
      }

      // Calculate total amount
      const totalAmount = feeComponents.reduce((sum, component) => sum + component.amount, 0);

      const feeStructure = new FeeStructure({
        school: schoolId,
        grade: grade,
        academicYear: academicYear,
        feeComponents: feeComponents,
        totalAmount: totalAmount,
        dueDate: 10, // 10th of every month
        lateFeePercentage: 2, // 2% late fee
        isActive: true,
        createdBy: adminId,
      });

      feeStructures.push(feeStructure);
    }

    // Save all fee structures individually (to trigger pre-save hooks)
    for (const structure of feeStructures) {
      await structure.save();
    }
    console.log(`✅ Created ${feeStructures.length} fee structures`);

    // Display summary
    console.log("\n📊 Fee Structure Summary:");
    console.log("================================");
    for (const structure of feeStructures) {
      const monthlyTotal = (structure as any).totalAmount || 0;
      const yearlyTotal = monthlyTotal * 12;
      console.log(
        `Grade ${structure.grade}: ₹${monthlyTotal}/month | ₹${yearlyTotal}/year`
      );
    }

    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding fee structures:", error);
    process.exit(1);
  }
};

// Run the seeder
seedFeeStructures();
