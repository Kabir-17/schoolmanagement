import { Schema, model } from 'mongoose';
import {
  ISubject,
  ISubjectDocument,
  ISubjectMethods,
  ISubjectModel,
} from './subject.interface';

const subjectSchema = new Schema<ISubjectDocument, ISubjectModel, ISubjectMethods>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: [100, 'Subject name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      trim: true,
      uppercase: true,
      maxlength: [10, 'Subject code cannot exceed 10 characters'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    grades: {
      type: [Number],
      required: [true, 'At least one grade is required'],
      validate: {
        validator: function (grades: number[]) {
          return grades.length > 0 && grades.every(grade => grade >= 1 && grade <= 12);
        },
        message: 'At least one grade must be specified, and all grades must be between 1 and 12',
      },
      index: true,
    },
    isCore: {
      type: Boolean,
      default: true,
      index: true,
    },
    credits: {
      type: Number,
      min: [0, 'Credits cannot be negative'],
      max: [10, 'Credits cannot exceed 10'],
    },
    teachers: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Teacher',
        }
      ],
      default: [],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Instance methods
subjectSchema.methods.getTeacherCount = function (): number {
  return this.teachers.length;
};

subjectSchema.methods.isOfferedInGrade = function (grade: number): boolean {
  return this.grades.includes(grade);
};

// Static methods
subjectSchema.statics.findBySchool = function (schoolId: string): Promise<ISubjectDocument[]> {
  return this.find({ schoolId, isActive: true })
    .populate('schoolId', 'name')
    .populate('teachers', 'teacherId designation userId')
    .sort({ isCore: -1, name: 1 });
};

subjectSchema.statics.findByGrade = function (schoolId: string, grade: number): Promise<ISubjectDocument[]> {
  return this.find({ schoolId, grades: grade, isActive: true })
    .populate('teachers', 'teacherId designation userId')
    .sort({ isCore: -1, name: 1 });
};

subjectSchema.statics.findByTeacher = function (teacherId: string): Promise<ISubjectDocument[]> {
  return this.find({ teachers: teacherId, isActive: true })
    .populate('schoolId', 'name')
    .sort({ isCore: -1, name: 1 });
};

// Indexes
subjectSchema.index({ schoolId: 1, code: 1 }, { unique: true });
subjectSchema.index({ schoolId: 1, isCore: 1 });
subjectSchema.index({ schoolId: 1, grades: 1 });

// Ensure virtual fields are serialized
subjectSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    // delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const Subject = model<ISubjectDocument, ISubjectModel>('Subject', subjectSchema);