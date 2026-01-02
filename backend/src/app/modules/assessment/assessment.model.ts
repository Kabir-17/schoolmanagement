import { Schema, model } from "mongoose";
import {
  IAssessmentDocument,
  IAssessmentModel,
  IAssessmentCategoryDocument,
  IAssessmentCategoryModel,
  IAssessmentResultDocument,
  IAssessmentResultModel,
  IAssessmentAdminPreferenceDocument,
  IAssessmentAdminPreferenceModel,
} from "./assessment.interface";

const assessmentSchema = new Schema<IAssessmentDocument, IAssessmentModel>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    grade: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      index: true,
    },
    section: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z]$/,
      index: true,
    },
    examName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    examTypeId: {
      type: Schema.Types.ObjectId,
      ref: "AssessmentCategory",
      index: true,
    },
    examTypeLabel: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    examDate: {
      type: Date,
      required: true,
      index: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    academicYear: {
      type: String,
      trim: true,
      match: /^\d{4}-\d{4}$/,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    publishedAt: {
      type: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

assessmentSchema.index(
  {
    schoolId: 1,
    grade: 1,
    section: 1,
    subjectId: 1,
    examDate: -1,
  },
  {
    name: "assessment_scope_index",
  }
);

const assessmentCategorySchema = new Schema<
  IAssessmentCategoryDocument,
  IAssessmentCategoryModel
>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    order: {
      type: Number,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

assessmentCategorySchema.index(
  { schoolId: 1, name: 1 },
  { unique: true, name: "unique_category_per_school" }
);

const assessmentResultSchema = new Schema<
  IAssessmentResultDocument,
  IAssessmentResultModel
>(
  {
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gradedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

assessmentResultSchema.index(
  { assessmentId: 1, studentId: 1 },
  { unique: true, name: "unique_result_per_student_assessment" }
);

const assessmentAdminPreferenceSchema = new Schema<
  IAssessmentAdminPreferenceDocument,
  IAssessmentAdminPreferenceModel
>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
      index: true,
    },
    adminUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

assessmentAdminPreferenceSchema.index(
  { adminUserId: 1, assessmentId: 1 },
  {
    unique: true,
    name: "unique_admin_preference_per_assessment",
  }
);

export const Assessment = model<IAssessmentDocument, IAssessmentModel>(
  "Assessment",
  assessmentSchema
);

export const AssessmentCategory = model<
  IAssessmentCategoryDocument,
  IAssessmentCategoryModel
>("AssessmentCategory", assessmentCategorySchema);

export const AssessmentResult = model<
  IAssessmentResultDocument,
  IAssessmentResultModel
>("AssessmentResult", assessmentResultSchema);

export const AssessmentAdminPreference = model<
  IAssessmentAdminPreferenceDocument,
  IAssessmentAdminPreferenceModel
>("AssessmentAdminPreference", assessmentAdminPreferenceSchema);
