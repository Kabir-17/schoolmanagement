import { Schema, model } from "mongoose";
import {
  IAttendanceEvent,
  IAttendanceEventDocument,
  IAutoAttendSource,
} from "./attendance-event.interface";

// Source metadata sub-schema
const autoAttendSourceSchema = new Schema<IAutoAttendSource>(
  {
    app: {
      type: String,
      required: [true, "Source app name is required"],
      trim: true,
    },
    version: {
      type: String,
      required: [true, "Source app version is required"],
      trim: true,
    },
    deviceId: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

// Main attendance event schema
const attendanceEventSchema = new Schema<IAttendanceEventDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School ID is required"],
      index: true,
    },
    eventId: {
      type: String,
      required: [true, "Event ID is required"],
      unique: true, // ensures idempotency
      trim: true,
      index: true,
    },
    descriptor: {
      type: String,
      required: [true, "Descriptor is required"],
      trim: true,
      index: true,
      validate: {
        validator: function (descriptor: string) {
          // Validate format: student@firstName@age@grade@section@bloodGroup@studentId
          return /^student@[^@]+@\d+@\d+@[A-Z]+@[A-Z\+\-]+@[\w\-]+$/.test(
            descriptor
          );
        },
        message:
          "Descriptor must follow format: student@firstName@age@grade@section@bloodGroup@studentId",
      },
    },
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    age: {
      type: String,
      required: [true, "Age is required"],
      trim: true,
    },
    grade: {
      type: String,
      required: [true, "Grade is required"],
      trim: true,
      index: true,
    },
    section: {
      type: String,
      required: [true, "Section is required"],
      trim: true,
      uppercase: true,
      index: true,
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      trim: true,
      uppercase: true,
    },
    capturedAt: {
      type: Date,
      required: [true, "Captured timestamp is required"],
      index: true,
    },
    capturedDate: {
      type: String,
      required: [true, "Captured date is required"],
      trim: true,
      index: true,
      validate: {
        validator: function (date: string) {
          return /^\d{4}-\d{2}-\d{2}$/.test(date);
        },
        message: "Captured date must be in YYYY-MM-DD format",
      },
    },
    capturedTime: {
      type: String,
      required: [true, "Captured time is required"],
      trim: true,
      validate: {
        validator: function (time: string) {
          return /^\d{2}:\d{2}:\d{2}$/.test(time);
        },
        message: "Captured time must be in HH:MM:SS format",
      },
    },
    payload: {
      type: Schema.Types.Mixed,
      required: [true, "Original payload is required"],
    },
    source: {
      type: autoAttendSourceSchema,
      required: [true, "Source information is required"],
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: {
        values: ["captured", "reviewed", "superseded", "ignored"],
        message: "Status must be captured, reviewed, superseded, or ignored",
      },
      default: "captured",
      index: true,
    },
    test: {
      type: Boolean,
      default: false,
      index: true,
    },
    processedAt: {
      type: Date,
      index: true,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for performance
attendanceEventSchema.index({ schoolId: 1, capturedDate: 1 });
attendanceEventSchema.index({ schoolId: 1, studentId: 1, capturedDate: 1 });
attendanceEventSchema.index({ schoolId: 1, status: 1, createdAt: -1 });
attendanceEventSchema.index({ eventId: 1 }, { unique: true });

// Export the model
export const AttendanceEvent = model<IAttendanceEventDocument>(
  "AttendanceEvent",
  attendanceEventSchema
);
