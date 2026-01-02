import { Schema, model } from "mongoose";
import { IUserCredentialsDocument } from "./userCredentials.interface";

// User Credentials schema for storing initial login credentials
const userCredentialsSchema = new Schema<IUserCredentialsDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School ID is required"],
      index: true,
    },
    initialUsername: {
      type: String,
      required: [true, "Initial username is required"],
      trim: true,
    },
    initialPassword: {
      type: String,
      required: [true, "Initial password is required"],
    },
    hasChangedPassword: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["student", "parent", "teacher"],
      required: [true, "Role is required"],
      index: true,
    },
    associatedStudentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      // Only required for parent credentials
      required: function (this: IUserCredentialsDocument) {
        return this.role === "parent";
      },
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessedAt: {
      type: Date,
    },
    // For audit purposes
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Issued by admin is required"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for better performance
userCredentialsSchema.index({ schoolId: 1, role: 1 });
userCredentialsSchema.index({ associatedStudentId: 1 });
userCredentialsSchema.index({ hasChangedPassword: 1 });

// Compound unique index to prevent duplicate parent credentials for the same student
// but allow same parent to have credentials for multiple students
userCredentialsSchema.index(
  { userId: 1, associatedStudentId: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { associatedStudentId: { $exists: true } }
  }
);

// Unique index for student credentials (students should have only one credential record)
userCredentialsSchema.index(
  { userId: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { role: "student" }
  }
);

// Transform output to exclude sensitive fields
userCredentialsSchema.set("toJSON", {
  transform: function (
    doc,
    ret: Record<string, any>,
    options: Record<string, any> & { includePassword?: boolean }
  ) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    // Only exclude initialPassword if not for admin/credential fetch
    if (!options || !options.includePassword) {
      delete ret.initialPassword;
    }
    return ret;
  },
});

export const UserCredentials = model<IUserCredentialsDocument>(
  "UserCredentials",
  userCredentialsSchema
);
