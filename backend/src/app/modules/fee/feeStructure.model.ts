import { Schema, model } from "mongoose";
import { IFeeStructure, FeeType } from "./fee.interface";

const feeComponentSchema = new Schema(
  {
    feeType: {
      type: String,
      enum: Object.values(FeeType),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be non-negative"],
    },
    description: {
      type: String,
      trim: true,
    },
    isMandatory: {
      type: Boolean,
      default: true,
    },
    isOneTime: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const feeStructureSchema = new Schema<IFeeStructure>(
  {
    school: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School is required"],
      index: true,
    },
    grade: {
      type: String,
      required: [true, "Grade is required"],
      trim: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
      match: [/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY"],
      index: true,
    },
    feeComponents: {
      type: [feeComponentSchema],
      validate: {
        validator: function (v: any[]) {
          return v && v.length > 0;
        },
        message: "At least one fee component is required",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Total amount must be non-negative"],
    },
    dueDate: {
      type: Number,
      required: [true, "Due date is required"],
      default: 10,
      min: [1, "Due date must be between 1 and 31"],
      max: [31, "Due date must be between 1 and 31"],
    },
    lateFeePercentage: {
      type: Number,
      default: 0,
      min: [0, "Late fee percentage must be non-negative"],
      max: [100, "Late fee percentage cannot exceed 100%"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for uniqueness
feeStructureSchema.index(
  { school: 1, grade: 1, academicYear: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

// Virtual properties for fee calculations
feeStructureSchema.virtual("totalMonthlyFee").get(function () {
  return this.totalAmount;
});

feeStructureSchema.virtual("totalOneTimeFee").get(function () {
  if (!this.feeComponents || this.feeComponents.length === 0) return 0;
  return this.feeComponents
    .filter(component => component.isOneTime)
    .reduce((sum, component) => sum + component.amount, 0);
});

feeStructureSchema.virtual("totalYearlyFee").get(function () {
  const monthlyTotal = this.totalAmount || 0;
  const oneTimeTotal = this.feeComponents
    ? this.feeComponents
        .filter(component => component.isOneTime)
        .reduce((sum, component) => sum + component.amount, 0)
    : 0;
  return (monthlyTotal * 12) + oneTimeTotal;
});

// Pre-save middleware to calculate total amount (monthly fees only)
feeStructureSchema.pre("save", function (next) {
  if (this.feeComponents && this.feeComponents.length > 0) {
    // totalAmount should only include monthly fees, not one-time fees
    this.totalAmount = this.feeComponents
      .filter(component => !component.isOneTime)
      .reduce((sum, component) => sum + component.amount, 0);
  }
  next();
});

// Static method to find active fee structure
feeStructureSchema.statics.findActiveFeeStructure = async function (
  schoolId: string,
  grade: string,
  academicYear: string
) {
  return this.findOne({
    school: schoolId,
    grade,
    academicYear,
    isActive: true,
  });
};

// Static method to get all grades with fee structure for a school
feeStructureSchema.statics.getGradesWithFeeStructure = async function (
  schoolId: string,
  academicYear: string
) {
  return this.distinct("grade", {
    school: schoolId,
    academicYear,
    isActive: true,
  });
};

// Method to deactivate fee structure
feeStructureSchema.methods.deactivate = async function (updatedBy: string) {
  this.isActive = false;
  this.updatedBy = updatedBy;
  return this.save();
};

// Method to check if fee structure can be modified
feeStructureSchema.methods.canModify = function (): boolean {
  // Fee structure can be modified only if it's not yet active
  // or if no students have paid yet
  return this.isActive === false;
};

const FeeStructure = model<IFeeStructure>(
  "FeeStructure",
  feeStructureSchema
);

export default FeeStructure;
