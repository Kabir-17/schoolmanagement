import { Schema, model } from 'mongoose';
import {
  IHomework,
  IHomeworkDocument,
  IHomeworkMethods,
  IHomeworkModel,
  IHomeworkSubmission,
  IHomeworkSubmissionDocument,
  IHomeworkSubmissionStats,
  IHomeworkCalendar,
  IHomeworkAnalytics
} from './homework.interface';

// Rubric criteria subdocument schema
const rubricCriteriaSchema = new Schema(
  {
    criteria: {
      type: String,
      required: [true, 'Rubric criteria is required'],
      trim: true,
      maxlength: [200, 'Criteria cannot exceed 200 characters'],
    },
    maxPoints: {
      type: Number,
      required: [true, 'Maximum points is required'],
      min: [0, 'Maximum points cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  {
    _id: false,
  }
);

// Main homework schema
const homeworkSchema = new Schema<IHomeworkDocument, IHomeworkModel, IHomeworkMethods>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School ID is required'],
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher ID is required'],
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class', // Assuming a Class model exists
      index: true,
    },
    grade: {
      type: Number,
      required: [true, 'Grade is required'],
      min: [1, 'Grade must be at least 1'],
      max: [12, 'Grade cannot exceed 12'],
      index: true,
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]$/, 'Section must be a single uppercase letter'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [2000, 'Instructions cannot exceed 2000 characters'],
    },
    homeworkType: {
      type: String,
      required: [true, 'Homework type is required'],
      enum: {
        values: ['assignment', 'project', 'reading', 'practice', 'research', 'presentation', 'other'],
        message: 'Homework type must be one of: assignment, project, reading, practice, research, presentation, other',
      },
      index: true,
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: 'Priority must be one of: low, medium, high, urgent',
      },
      default: 'medium',
      index: true,
    },
    assignedDate: {
      type: Date,
      required: [true, 'Assigned date is required'],
      default: Date.now,
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      validate: {
        validator: function (this: IHomework, dueDate: Date) {
          return dueDate > this.assignedDate;
        },
        message: 'Due date must be after assigned date',
      },
      index: true,
    },
    estimatedDuration: {
      type: Number,
      required: [true, 'Estimated duration is required'],
      min: [15, 'Estimated duration must be at least 15 minutes'],
      max: [1440, 'Estimated duration cannot exceed 24 hours (1440 minutes)'],
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
      min: [1, 'Total marks must be at least 1'],
      max: [1000, 'Total marks cannot exceed 1000'],
    },
    passingMarks: {
      type: Number,
      required: [true, 'Passing marks is required'],
      min: [0, 'Passing marks cannot be negative'],
      validate: {
        validator: function (this: IHomework, passingMarks: number) {
          return passingMarks <= this.totalMarks;
        },
        message: 'Passing marks cannot exceed total marks',
      },
    },
    attachments: {
      type: [String],
      validate: {
        validator: function (attachments: string[]) {
          return attachments.length <= 10;
        },
        message: 'Cannot have more than 10 attachments',
      },
    },
    submissionType: {
      type: String,
      required: [true, 'Submission type is required'],
      enum: {
        values: ['text', 'file', 'both', 'none'],
        message: 'Submission type must be one of: text, file, both, none',
      },
    },
    allowLateSubmission: {
      type: Boolean,
      default: true,
    },
    latePenalty: {
      type: Number,
      min: [0, 'Late penalty cannot be negative'],
      max: [100, 'Late penalty cannot exceed 100%'],
      default: 10, // 10% per day
    },
    maxLateDays: {
      type: Number,
      min: [1, 'Max late days must be at least 1'],
      max: [30, 'Max late days cannot exceed 30'],
      default: 3,
    },
    isGroupWork: {
      type: Boolean,
      default: false,
    },
    maxGroupSize: {
      type: Number,
      min: [2, 'Max group size must be at least 2'],
      max: [10, 'Max group size cannot exceed 10'],
      required: function (this: IHomework) { return this.isGroupWork; },
    },
    rubric: {
      type: [rubricCriteriaSchema],
      validate: {
        validator: function (rubric: any[]) {
          return rubric.length <= 20;
        },
        message: 'Cannot have more than 20 rubric criteria',
      },
    },
    tags: {
      type: [String],
      validate: {
        validator: function (tags: string[]) {
          return tags.length <= 10;
        },
        message: 'Cannot have more than 10 tags',
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    reminderDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Homework submission schema
const homeworkSubmissionSchema = new Schema<IHomeworkSubmissionDocument>(
  {
    homeworkId: {
      type: Schema.Types.ObjectId,
      ref: 'Homework',
      required: [true, 'Homework ID is required'],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
      index: true,
    },
    groupMembers: [{
      type: Schema.Types.ObjectId,
      ref: 'Student',
    }],
    submissionText: {
      type: String,
      trim: true,
      maxlength: [5000, 'Submission text cannot exceed 5000 characters'],
    },
    attachments: {
      type: [String],
      validate: {
        validator: function (attachments: string[]) {
          return attachments.length <= 10;
        },
        message: 'Cannot have more than 10 attachments',
      },
    },
    submittedAt: {
      type: Date,
      required: [true, 'Submitted at time is required'],
      default: Date.now,
      index: true,
    },
    isLate: {
      type: Boolean,
      default: false,
      index: true,
    },
    daysLate: {
      type: Number,
      default: 0,
      min: [0, 'Days late cannot be negative'],
    },
    latePenalty: {
      type: Number,
      default: 0,
      min: [0, 'Late penalty cannot be negative'],
      max: [100, 'Late penalty cannot exceed 100%'],
    },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'returned', 'missing'],
      default: 'submitted',
      index: true,
    },
    marksObtained: {
      type: Number,
      min: [0, 'Marks obtained cannot be negative'],
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'],
    },
    percentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [2000, 'Feedback cannot exceed 2000 characters'],
    },
    teacherComments: {
      type: String,
      trim: true,
      maxlength: [1000, 'Teacher comments cannot exceed 1000 characters'],
    },
    gradedAt: {
      type: Date,
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    revision: {
      requested: {
        type: Boolean,
        default: false,
      },
      requestedAt: {
        type: Date,
      },
      reason: {
        type: String,
        trim: true,
        maxlength: [500, 'Revision reason cannot exceed 500 characters'],
      },
      completed: {
        type: Boolean,
        default: false,
      },
      completedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Instance methods for Homework
homeworkSchema.methods.isOverdue = function (): boolean {
  const now = new Date();
  return this.dueDate < now && this.isPublished;
};

homeworkSchema.methods.isDueToday = function (): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.dueDate >= today && this.dueDate < tomorrow;
};

homeworkSchema.methods.isDueTomorrow = function (): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  
  return this.dueDate >= tomorrow && this.dueDate < dayAfter;
};

homeworkSchema.methods.getDaysUntilDue = function (): number {
  const now = new Date();
  const timeDiff = this.dueDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return daysDiff;
};

homeworkSchema.methods.getDaysOverdue = function (): number {
  const now = new Date();
  if (this.dueDate >= now) return 0;
  
  const timeDiff = now.getTime() - this.dueDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  return daysDiff;
};

homeworkSchema.methods.getFormattedDueDate = function (): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return this.dueDate.toLocaleDateString('en-US', options);
};

homeworkSchema.methods.getEstimatedDurationHours = function (): number {
  return Math.round((this.estimatedDuration / 60) * 100) / 100;
};

homeworkSchema.methods.canSubmit = function (): boolean {
  if (!this.isPublished) return false;
  if (!this.allowLateSubmission && this.isOverdue()) return false;
  if (this.allowLateSubmission && this.maxLateDays) {
    const daysOverdue = this.getDaysOverdue();
    return daysOverdue <= this.maxLateDays;
  }
  return true;
};

homeworkSchema.methods.getLatePenaltyPercentage = function (submissionDate: Date): number {
  if (submissionDate <= this.dueDate) return 0;
  
  const timeDiff = submissionDate.getTime() - this.dueDate.getTime();
  const daysLate = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  const penalty = daysLate * (this.latePenalty || 0);
  return Math.min(penalty, 100); // Cap at 100%
};

homeworkSchema.methods.getEligibleStudents = async function (): Promise<any[]> {
  const Student = model('Student');
  const query: any = {
    schoolId: this.schoolId,
    grade: this.grade,
    isActive: true,
  };

  if (this.section) {
    query.section = this.section;
  }

  return await Student.find(query)
    .populate('userId', 'firstName lastName')
    .sort({ rollNumber: 1 });
};

homeworkSchema.methods.getSubmissionStats = async function (): Promise<IHomeworkSubmissionStats> {
  const HomeworkSubmission = model('HomeworkSubmission');
  const submissions = await HomeworkSubmission.find({ homeworkId: this._id });
  const eligibleStudents = await this.getEligibleStudents();

  const totalStudents = eligibleStudents.length;
  const submittedCount = submissions.length;
  const pendingCount = totalStudents - submittedCount;
  const lateCount = submissions.filter(s => s.isLate).length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;

  const gradedSubmissions = submissions.filter(s => s.marksObtained !== undefined);
  const averageScore = gradedSubmissions.length > 0
    ? gradedSubmissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / gradedSubmissions.length
    : 0;
  
  const scores = gradedSubmissions.map(s => s.percentage || 0);
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

  const onTimeSubmissions = submissions.filter(s => !s.isLate).length;
  const onTimePercentage = submittedCount > 0 ? (onTimeSubmissions / submittedCount) * 100 : 0;
  const submissionPercentage = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;

  // Grade distribution
  const gradeCount: { [key: string]: number } = {};
  submissions.forEach(s => {
    if (s.grade) {
      gradeCount[s.grade] = (gradeCount[s.grade] || 0) + 1;
    }
  });

  const gradeDistribution = Object.entries(gradeCount).map(([grade, count]) => ({
    grade,
    count,
    percentage: submittedCount > 0 ? Math.round((count / submittedCount) * 100) : 0
  }));

  return {
    totalStudents,
    submittedCount,
    pendingCount,
    lateCount,
    gradedCount,
    averageScore: Math.round(averageScore * 100) / 100,
    highestScore,
    lowestScore,
    onTimePercentage: Math.round(onTimePercentage * 100) / 100,
    submissionPercentage: Math.round(submissionPercentage * 100) / 100,
    gradeDistribution
  };
};

// Static methods for Homework
homeworkSchema.statics.findBySchool = function (schoolId: string): Promise<IHomeworkDocument[]> {
  return this.find({ schoolId })
    .populate('teacherId', 'userId teacherId')
    .populate('subjectId', 'name code')
    .sort({ dueDate: -1, assignedDate: -1 });
};

homeworkSchema.statics.findByTeacher = function (teacherId: string): Promise<IHomeworkDocument[]> {
  return this.find({ teacherId })
    .populate('subjectId', 'name code')
    .sort({ dueDate: -1, assignedDate: -1 });
};

homeworkSchema.statics.findBySubject = function (subjectId: string): Promise<IHomeworkDocument[]> {
  return this.find({ subjectId })
    .populate({
      path: 'teacherId',
      select: 'userId teacherId',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    })
    .sort({ dueDate: -1, assignedDate: -1 });
};

homeworkSchema.statics.findByClass = function (
  schoolId: string,
  grade: number,
  section?: string
): Promise<IHomeworkDocument[]> {
  const query: any = { schoolId, grade, isPublished: true };
  if (section) query.section = section;

  return this.find(query)
    .populate({
      path: 'teacherId',
      select: 'userId teacherId',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    })
    .populate('subjectId', 'name code')
    .sort({ dueDate: 1, priority: -1 });
};

homeworkSchema.statics.findByStudent = function (studentId: string): Promise<IHomeworkDocument[]> {
  // This would need to get student's grade/section first, then find homework for that class
  return model('Student').findById(studentId)
    .then(student => {
      if (!student) throw new Error('Student not found');
      
      const query: any = {
        schoolId: student.schoolId,
        grade: student.grade,
        isPublished: true
      };
      
      if (student.section) query.section = student.section;

      return this.find(query)
        .populate({
          path: 'teacherId',
          select: 'userId teacherId',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        })
        .populate('subjectId', 'name code')
        .sort({ dueDate: 1, priority: -1 });
    });
};

homeworkSchema.statics.findUpcoming = function (
  schoolId: string,
  days: number = 7
): Promise<IHomeworkDocument[]> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);

  return this.find({
    schoolId,
    isPublished: true,
    dueDate: { $gte: now, $lte: futureDate },
  })
    .populate({
      path: 'teacherId',
      select: 'userId teacherId',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    })
    .populate('subjectId', 'name code')
    .sort({ dueDate: 1, priority: -1 });
};

homeworkSchema.statics.findOverdue = function (schoolId: string): Promise<IHomeworkDocument[]> {
  const now = new Date();

  return this.find({
    schoolId,
    isPublished: true,
    dueDate: { $lt: now },
  })
    .populate({
      path: 'teacherId',
      select: 'userId teacherId',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    })
    .populate('subjectId', 'name code')
    .sort({ dueDate: -1 });
};

homeworkSchema.statics.findDueToday = function (schoolId: string): Promise<IHomeworkDocument[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    schoolId,
    isPublished: true,
    dueDate: { $gte: today, $lt: tomorrow },
  })
    .populate({
      path: 'teacherId',
      select: 'userId teacherId',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    })
    .populate('subjectId', 'name code')
    .sort({ dueDate: 1 });
};

// Indexes for performance
homeworkSchema.index({ schoolId: 1, dueDate: 1 });
homeworkSchema.index({ teacherId: 1, assignedDate: -1 });
homeworkSchema.index({ subjectId: 1, dueDate: 1 });
homeworkSchema.index({ grade: 1, section: 1, dueDate: 1 });
homeworkSchema.index({ isPublished: 1, dueDate: 1 });
homeworkSchema.index({ priority: 1, dueDate: 1 });

// Homework submission indexes
homeworkSubmissionSchema.index({ homeworkId: 1, studentId: 1 }, { unique: true });
homeworkSubmissionSchema.index({ studentId: 1, submittedAt: -1 });
homeworkSubmissionSchema.index({ status: 1 });
homeworkSubmissionSchema.index({ isLate: 1 });

// Pre-save middleware for Homework
homeworkSchema.pre('save', function (next) {
  // Validate rubric total points
  if (this.rubric && this.rubric.length > 0) {
    const totalRubricPoints = this.rubric.reduce((sum, criteria) => sum + criteria.maxPoints, 0);
    
    if (Math.abs(totalRubricPoints - this.totalMarks) > 0.01) {
      return next(new Error('Rubric total points must equal total marks'));
    }
  }

  next();
});

// Pre-save middleware for Homework Submission
homeworkSubmissionSchema.pre('save', async function (next) {
  // Get homework details to calculate late penalty
  const homework = await model('Homework').findById(this.homeworkId);
  if (homework) {
    // Check if submission is late
    if (this.submittedAt > homework.dueDate) {
      this.isLate = true;
      const timeDiff = this.submittedAt.getTime() - homework.dueDate.getTime();
      this.daysLate = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      this.latePenalty = homework.getLatePenaltyPercentage(this.submittedAt);
    }

    // Calculate percentage and grade if marks are provided
    if (this.marksObtained !== undefined) {
      let adjustedMarks = this.marksObtained;
      
      // Apply late penalty
      if (this.isLate && this.latePenalty > 0) {
        adjustedMarks = this.marksObtained * (1 - this.latePenalty / 100);
      }
      
      this.percentage = Math.round((adjustedMarks / homework.totalMarks) * 100);
      this.grade = getGradeFromPercentage(this.percentage);
    }
  }

  next();
});

// Helper function for grade calculation
function getGradeFromPercentage(percentage: number): string {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 65) return 'D';
  return 'F';
}

// Helper method for grade calculation
homeworkSubmissionSchema.methods.getGradeFromPercentage = function (percentage: number): string {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
};

// Transform for JSON output
homeworkSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    (ret as any).estimatedDurationHours = doc.getEstimatedDurationHours();
    (ret as any).isOverdue = doc.isOverdue();
    (ret as any).isDueToday = doc.isDueToday();
    (ret as any).isDueTomorrow = doc.isDueTomorrow();
    (ret as any).daysUntilDue = doc.getDaysUntilDue();
    (ret as any).daysOverdue = doc.getDaysOverdue();
    (ret as any).formattedDueDate = doc.getFormattedDueDate();
    (ret as any).canSubmit = doc.canSubmit();
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

homeworkSubmissionSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

// Export the models
export const Homework = model<IHomeworkDocument, IHomeworkModel>('Homework', homeworkSchema);
export const HomeworkSubmission = model<IHomeworkSubmissionDocument>('HomeworkSubmission', homeworkSubmissionSchema);