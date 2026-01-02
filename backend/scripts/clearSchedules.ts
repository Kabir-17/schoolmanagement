import mongoose from "mongoose";
import config from "../src/app/config";
import { Schedule } from "../src/app/modules/schedule/schedule.model";

const schoolId = process.argv[2];

if (!schoolId) {
  console.error("Usage: ts-node scripts/clearSchedules.ts <schoolId>");
  process.exit(1);
}

async function main() {
  try {
    await mongoose.connect(config.mongodb_uri, {
      dbName: config.db_name,
    });

    const result = await Schedule.deleteMany({
      schoolId,
    });

    console.log(
      `Deleted ${result.deletedCount} schedules for school ${schoolId}`
    );
  } catch (error) {
    console.error("Failed to clear schedules:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
