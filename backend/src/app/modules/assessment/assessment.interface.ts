import { Document, Model, Types } from "mongoose";

export interface IAssessment {
  schoolId: Types.ObjectId;
  classId?: Types.ObjectId;
  subjectId: Types.ObjectId;
  teacherId: Types.ObjectId;
  grade: number;
  section: string;
  examName: string;
  examTypeId?: Types.ObjectId | null;
  examTypeLabel?: string | null;
  examDate: Date;
  totalMarks: number;
  note?: string;
  academicYear?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  publishedAt?: Date;
  isArchived: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAssessmentDocument extends IAssessment, Document {
  id: string;
}

export interface IAssessmentModel extends Model<IAssessmentDocument> {}

export interface IAssessmentCategory {
  schoolId: Types.ObjectId;
  name: string;
  description?: string;
  order?: number;
  isDefault: boolean;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

export interface IAssessmentCategoryDocument
  extends IAssessmentCategory,
    Document {
  id: string;
}

export interface IAssessmentCategoryModel
  extends Model<IAssessmentCategoryDocument> {}

export interface IAssessmentResult {
  assessmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  marksObtained: number;
  percentage: number;
  grade: string;
  remarks?: string;
  gradedBy: Types.ObjectId;
  gradedAt: Date;
  updatedBy?: Types.ObjectId;
}

export interface IAssessmentResultDocument
  extends IAssessmentResult,
    Document {
  id: string;
}

export interface IAssessmentResultModel
  extends Model<IAssessmentResultDocument> {}

export interface IAssessmentAdminPreference {
  schoolId: Types.ObjectId;
  assessmentId: Types.ObjectId;
  adminUserId: Types.ObjectId;
  isFavorite: boolean;
  isHidden: boolean;
}

export interface IAssessmentAdminPreferenceDocument
  extends IAssessmentAdminPreference,
    Document {
  id: string;
}

export interface IAssessmentAdminPreferenceModel
  extends Model<IAssessmentAdminPreferenceDocument> {}

export interface ITeacherAssignment {
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  grade: number;
  section: string;
  classId?: string;
  className: string;
  studentsCount: number;
  scheduleDays: string[];
}

export interface IAssessmentSummary {
  assessmentId: string;
  examName: string;
  examTypeLabel?: string | null;
  examDate: Date;
  totalMarks: number;
  gradedCount: number;
  totalStudents: number;
  averagePercentage: number;
  highestPercentage: number;
  lowestPercentage: number;
}

export interface IStudentAssessmentRow {
  studentId: string;
  studentName: string;
  rollNumber?: number;
  results: Record<
    string,
    {
      marksObtained: number;
      percentage: number;
      grade: string;
      remarks?: string;
    }
  >;
  totals: {
    obtained: number;
    total: number;
    averagePercentage: number;
  };
}
