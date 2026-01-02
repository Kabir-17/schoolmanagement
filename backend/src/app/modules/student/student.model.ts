import { Schema, model } from "mongoose";
import config from "../../config";
import {
  IStudent,
  IStudentDocument,
  IStudentMethods,
  IStudentModel,
  IStudentPhoto,
  IStudentPhotoDocument,
} from "./student.interface";

// Student Photo schema
const studentPhotoSchema = new Schema<IStudentPhotoDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student ID is required"],
      index: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School ID is required"],
      index: true,
    },
    photoPath: {
      type: String,
      required: [true, "Photo path is required"],
    },
    photoNumber: {
      type: Number,
      required: [true, "Photo number is required"],
      min: [1, "Photo number must be at least 1"],
      max: [20, "Photo number cannot exceed 20"],
    },
    filename: {
      type: String,
      required: [true, "Filename is required"],
    },
    originalName: {
      type: String,
      required: [true, "Original filename is required"],
    },
    mimetype: {
      type: String,
      required: [true, "File mimetype is required"],
      validate: {
        validator: function (mimetype: string) {
          return ["image/jpeg", "image/jpg", "image/png"].includes(mimetype);
        },
        message: "Only JPEG and PNG images are allowed",
      },
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
      max: [
        config.max_file_size,
        `File size cannot exceed ${config.max_file_size} bytes`,
      ],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Student schema definition
const studentSchema = new Schema<
  IStudentDocument,
  IStudentModel,
  IStudentMethods
>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // References User model for login credentials
      required: [true, "User ID is required"],
      unique: true,
      index: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School ID is required"],
      index: true,
    },
    studentId: {
      type: String, // Auto-generated string ID (e.g., SCH001-STU-202507-0001) - NOT a reference
      required: [true, "Student ID is required"],
      unique: true,
      trim: true,
      match: [/^(SCH\d{3,4}-STU-\d{6}-\d{4}|\d{10})$/, "Student ID must follow format SCH001-STU-YYYYGG-RRRR or YYYYGGRRR"],
      index: true,
    },
    grade: {
      type: Number,
      required: [true, "Grade is required"],
      min: [1, "Grade must be at least 1"],
      max: [12, "Grade cannot exceed 12"],
      index: true,
    },
    section: {
      type: String,
      required: [true, "Section is required"],
      trim: true,
      uppercase: true,
      match: [/^[A-Z]$/, "Section must be a single uppercase letter"],
      index: true,
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: {
        values: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        message: "Invalid blood group",
      },
    },
    dob: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: function (dob: Date) {
          const today = new Date();
          const minAge = new Date(
            today.getFullYear() - 25,
            today.getMonth(),
            today.getDate()
          );
          const maxAge = new Date(
            today.getFullYear() - 3,
            today.getMonth(),
            today.getDate()
          );
          return dob >= minAge && dob <= maxAge;
        },
        message: "Student age must be between 3 and 25 years",
      },
    },
    admissionDate: {
      type: Date,
      required: [true, "Admission date is required"],
      default: Date.now,
    },
    admissionYear: {
      type: Number,
      required: [true, "Admission year is required"],
      min: [2000, "Admission year must be 2000 or later"],
      max: [
        new Date().getFullYear() + 1,
        "Admission year cannot be in the future",
      ],
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Parent",
      index: true,
    },
    rollNumber: {
      type: Number,
      min: [1, "Roll number must be at least 1"],
      // Removed max validation to allow flexible section capacity
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    address: {
      street: {
        type: String,
        trim: true,
        maxlength: [100, "Street address cannot exceed 100 characters"],
      },
      city: {
        type: String,
        trim: true,
        maxlength: [50, "City cannot exceed 50 characters"],
      },
      state: {
        type: String,
        trim: true,
        maxlength: [50, "State cannot exceed 50 characters"],
      },
      country: {
        type: String,
        trim: true,
        maxlength: [50, "Country cannot exceed 50 characters"],
      },
      postalCode: {
        type: String,
        trim: true,
        maxlength: [20, "Postal code cannot exceed 20 characters"],
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Instance methods
studentSchema.methods.generateStudentId = function (): string {
  const year = new Date().getFullYear();
  const grade = this.grade.toString().padStart(2, "0");
  const sequence = Math.floor(Math.random() * 900) + 100; // 3-digit random number
  return `${year}-${grade}-${sequence}`;
};

studentSchema.methods.getAgeInYears = function (): number {
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

studentSchema.methods.getFullName = function (): string {
  // Type assertion to handle both ObjectId and populated User
  const userId = this.userId as any;
  return `${userId?.firstName || ""} ${userId?.lastName || ""}`.trim();
};

studentSchema.methods.getFolderPath = function (): string {
  // Format: student@firstname@age@grade@section@bloodgroup@admitdate@studentID
  const userId = (this.userId as any) || {};
  const age = this.getAgeInYears();
  const admitDate = this.admissionDate.toISOString().split("T")[0];

  return `student@${userId.firstName || "unknown"}@${age}@${this.grade}@${
    this.section
  }@${this.bloodGroup}@${admitDate}@${this.studentId}`;
};

studentSchema.methods.canUploadMorePhotos =
  async function (): Promise<boolean> {
    const photoCount = await StudentPhoto.countDocuments({
      studentId: this._id,
    });
    return photoCount < config.max_photos_per_student;
  };

// Static methods
studentSchema.statics.findBySchool = function (
  schoolId: string
): Promise<IStudentDocument[]> {
  return this.find({ schoolId, isActive: true })
    .populate("userId", "firstName lastName username email phone")
    .populate("schoolId", "name")
    .populate("parentId")
    .sort({ grade: 1, section: 1, rollNumber: 1 });
};

studentSchema.statics.findByGradeAndSection = function (
  schoolId: string,
  grade: number,
  section: string
): Promise<IStudentDocument[]> {
  return this.find({ schoolId, grade, section, isActive: true })
    .populate("userId", "firstName lastName username email phone")
    .populate("schoolId", "_id name")
    .populate({
      path: "parentId",
      select: "_id userId occupation address relationship",
      populate: {
        path: "userId",
        select: "_id firstName lastName username email phone",
      },
    })
    .sort({ rollNumber: 1 });
};

studentSchema.statics.findByStudentId = function (
  studentId: string
): Promise<IStudentDocument | null> {
  return this.findOne({ studentId })
    .populate("userId", "firstName lastName username email phone")
    .populate("schoolId", "_id name")
    .populate({
      path: "parentId",
      select: "_id userId occupation address relationship",
      populate: {
        path: "userId",
        select: "_id firstName lastName username email phone",
      },
    });
};

studentSchema.statics.generateNextStudentId = async function (
  schoolId: string,
  grade: number,
  year: number = new Date().getFullYear()
): Promise<string> {
  const gradeStr = grade.toString().padStart(2, "0");
  const prefix = `${year}-${gradeStr}-`;

  // Find the highest sequence number for this school, grade, and year
  const lastStudent = await this.findOne({
    schoolId,
    studentId: { $regex: `^${prefix}` },
  }).sort({ studentId: -1 });

  let nextSequence = 1;
  if (lastStudent) {
    const lastSequence = parseInt(lastStudent.studentId.split("-")[2]);
    nextSequence = lastSequence + 1;
  }

  const sequenceStr = nextSequence.toString().padStart(3, "0");
  return `${prefix}${sequenceStr}`;
};

// Indexes for performance
studentSchema.index({ schoolId: 1, grade: 1, section: 1 });
studentSchema.index({ schoolId: 1, isActive: 1 });
studentSchema.index({ admissionDate: -1 });
studentSchema.index({ grade: 1, section: 1, rollNumber: 1 });

// StudentPhoto indexes
studentPhotoSchema.index({ studentId: 1, photoNumber: 1 }, { unique: true });
studentPhotoSchema.index({ schoolId: 1 });

// Pre-save middleware for Student
studentSchema.pre("save", async function (next) {
  // Generate student ID if not provided
  if (this.isNew && !this.studentId) {
    this.studentId = await (
      this.constructor as IStudentModel
    ).generateNextStudentId(this.schoolId.toString(), this.grade);
  }

  // Ensure section is uppercase
  if (this.isModified("section")) {
    this.section = this.section.toUpperCase();
  }

  next();
});

// Pre-delete middleware
studentSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    // Delete associated photos when student is deleted
    await StudentPhoto.deleteMany({ studentId: this._id });
    next();
  }
);

// Virtual for photos
studentSchema.virtual("photos", {
  ref: "StudentPhoto",
  localField: "_id",
  foreignField: "studentId",
  options: { sort: { photoNumber: 1 } },
});

// Virtual for photo count
studentSchema.virtual("photoCount", {
  ref: "StudentPhoto",
  localField: "_id",
  foreignField: "studentId",
  count: true,
});

// Ensure virtual fields are serialized
studentSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

studentSchema.set("toObject", {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

studentPhotoSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

// Export the models
export const Student = model<IStudentDocument, IStudentModel>(
  "Student",
  studentSchema
);
export const StudentPhoto = model<IStudentPhotoDocument>(
  "StudentPhoto",
  studentPhotoSchema
);
