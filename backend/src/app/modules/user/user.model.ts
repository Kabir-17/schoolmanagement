import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import {
  IUser,
  IUserDocument,
  IUserMethods,
  IUserModel,
  UserRole,
} from "./user.interface";

// User schema definition
const userSchema = new Schema<IUserDocument, IUserModel, IUserMethods>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: function (this: IUserDocument) {
        return this.role !== "superadmin";
      },
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: Object.values(UserRole),
      index: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minLength: [3, "Username must be at least 3 characters"],
      maxLength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-z0-9_.-]+$/,
        "Username can only contain lowercase letters, numbers, dots, hyphens, and underscores",
      ],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Don't include in queries by default
    },
    displayPassword: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (email: string) {
          return !email || /^\S+@\S+\.\S+$/.test(email);
        },
        message: "Invalid email format",
      },
      index: { sparse: true }, // Allow multiple null values
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (phone: string) {
          return !phone || /^\+?[\d\s\-\(\)]+$/.test(phone);
        },
        message: "Invalid phone number format",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Instance methods
userSchema.methods.validatePassword = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.updatePassword = async function (
  newPassword: string
): Promise<IUserDocument> {
  this.passwordHash = await bcrypt.hash(newPassword, 12);
  return await this.save();
};

userSchema.methods.getFullName = function (): string {
  return `${this.firstName} ${this.lastName}`.trim();
};

userSchema.methods.canAccessSchool = function (schoolId: string): boolean {
  if (this.role === "superadmin") return true;
  return this.schoolId?.toString() === schoolId;
};

userSchema.methods.updateLastLogin = function (): Promise<IUserDocument> {
  this.lastLogin = new Date();
  return this.save();
};

userSchema.methods.markFirstLoginComplete =
  async function (): Promise<IUserDocument> {
    this.isFirstLogin = false;
    this.lastLogin = new Date();
    return await this.save();
  };

// Static methods
userSchema.statics.findByUsername = function (
  username: string
): Promise<IUserDocument | null> {
  return this.findOne({ username: username.toLowerCase() }).select(
    "+passwordHash"
  );
};

userSchema.statics.findBySchool = function (
  schoolId: string
): Promise<IUserDocument[]> {
  return this.find({ schoolId, isActive: true })
    .populate("schoolId", "name status")
    .sort({ firstName: 1, lastName: 1 });
};

userSchema.statics.findByRole = function (
  role: UserRole
): Promise<IUserDocument[]> {
  return this.find({ role, isActive: true })
    .populate("schoolId", "name status")
    .sort({ firstName: 1, lastName: 1 });
};

userSchema.statics.findActiveUsers = function (): Promise<IUserDocument[]> {
  return this.find({ isActive: true })
    .populate("schoolId", "name status")
    .sort({ role: 1, firstName: 1, lastName: 1 });
};

// Indexes for performance
userSchema.index({ schoolId: 1, role: 1 });
userSchema.index({ schoolId: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ email: 1 }, { sparse: true });

// Pre-save middleware
userSchema.pre("save", async function (next) {
  // Hash password if it's being modified and not already hashed
  if (
    this.isModified("passwordHash") &&
    !this.passwordHash.startsWith("$2a$")
  ) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }

  // Normalize names (title case)
  if (this.isModified("firstName")) {
    this.firstName = this.firstName
      .trim()
      .replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
  }

  if (this.isModified("lastName")) {
    this.lastName = this.lastName
      .trim()
      .replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
  }

  // Ensure username is lowercase
  if (this.isModified("username")) {
    this.username = this.username.toLowerCase();
  }

  // Validate superadmin constraints
  if (this.role === "superadmin" && this.schoolId) {
    const error = new Error(
      "Superadmin users cannot be associated with a school"
    );
    return next(error);
  }

  // Validate non-superadmin constraints
  if (this.role !== "superadmin" && !this.schoolId) {
    const error = new Error(
      "Non-superadmin users must be associated with a school"
    );
    return next(error);
  }

  next();
});

// Pre-delete middleware
userSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    // Check for dependent data based on role (will be implemented when other models are created)
    // For now, just prevent deletion of superadmin users
    if (this.role === "superadmin") {
      const error = new Error("Superadmin users cannot be deleted");
      return next(error);
    }

    next();
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return this.getFullName();
});

// Ensure virtual fields are serialized
userSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    delete (ret as any).passwordHash; // Never expose password hash
    return ret;
  },
});

userSchema.set("toObject", {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    delete (ret as any).passwordHash; // Never expose password hash
    return ret;
  },
});

// Export the model
export const User = model<IUserDocument, IUserModel>("User", userSchema);
