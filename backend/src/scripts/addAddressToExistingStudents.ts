import mongoose from "mongoose";
import config from "../app/config";
import { Student } from "../app/modules/student/student.model";

const addAddressToExistingStudents = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.mongodb_uri as string);

    // Find all students without address or with empty address fields
    const studentsWithoutAddress = await Student.find({
      $or: [
        { address: { $exists: false } },
        { address: null },
        { "address.street": { $exists: false } },
        { "address.city": { $exists: false } },
        { "address.street": "" },
        { "address.city": "" },
        { "address.street": { $in: ["", null] } },
        { "address.city": { $in: ["", null] } },
      ],
    });


    // Always update students with default address data
    const result = await Student.updateMany(
      {
        $or: [
          { address: { $exists: false } },
          { address: null },
          { "address.street": { $exists: false } },
          { "address.city": { $exists: false } },
          { "address.street": "" },
          { "address.city": "" },
          { "address.street": { $in: ["", null] } },
          { "address.city": { $in: ["", null] } },
        ],
      },
      {
        $set: {
          address: {
            street: "123 Main Street, Dhanmondi",
            city: "Dhaka",
            state: "Dhaka Division",
            country: "Bangladesh",
            postalCode: "1205",
          },
        },
      }
    );


    // Verify the update
    const allStudents = await Student.find({}, { studentId: 1, address: 1 });
    allStudents.slice(0, 3).forEach((student) => {
    });
  } catch (error) {
    console.error("Error updating students:", error);
  } finally {
    await mongoose.connection.close();
  }
};

// Run the script if called directly
if (require.main === module) {
  addAddressToExistingStudents();
}

export default addAddressToExistingStudents;
