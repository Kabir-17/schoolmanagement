import { Schema, model } from 'mongoose';
import {
  IExam,
  IExamDocument,
  IExamMethods,
  IExamModel,
  IExamSchedule,
  IExamStats,
  IExamResult,
  IExamResultDocument
} from './exam.interface';

// Grading scale subdocument schema
const gradingScaleSchema = new Schema(
  {
    gradeA: {
      type: Number,
      required: [true, 'Grade A minimum marks is required'],
      min: [0, 'Grade A marks cannot be negative'],
      max: [100, 'Grade A marks cannot exceed 100'],
    },
    gradeB: {
      type: Number,
      required: [true, 'Grade B minimum marks is required'],
      min: [0, 'Grade B marks cannot be negative'],
      max: [100, 'Grade B marks cannot exceed 100'],
    },
    gradeC: {
      type: Number,
      required: [true, 'Grade C minimum marks is required'],
      min: [0, 'Grade C marks cannot be negative'],
      max: [100, 'Grade C marks cannot exceed 100'],
    },
    gradeD: {
      type: Number,
      required: [true, 'Grade D minimum marks is required'],
      min: [0, 'Grade D marks cannot be negative'],
      max: [100, 'Grade D marks cannot exceed 100'],
    },
    gradeF: {
      type: Number,
      required: [true, 'Grade F maximum marks is required'],
      min: [0, 'Grade F marks cannot be negative'],
      max: [100, 'Grade F marks cannot exceed 100'],
    },
  },
  {
    _id: false,
  }
);

// Main exam schema
const examSchema = new Schema<IExamDocument, IExamModel, IExamMethods>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School ID is required'],
      index: true,
    },
    examName: {
      type: String,
      required: [true, 'Exam name is required'],
      trim: true,
      maxlength: [200, 'Exam name cannot exceed 200 characters'],
      index: true,
    },
    examType: {
      type: String,
      required: [true, 'Exam type is required'],
      enum: {
        values: ['unit-test', 'mid-term', 'final', 'quarterly', 'half-yearly', 'annual', 'entrance', 'mock'],
        message: 'Exam type must be one of: unit-test, mid-term, final, quarterly, half-yearly, annual, entrance, mock',
      },
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      match: [/^\d{4}-\d{4}$/, 'Academic year must be in YYYY-YYYY format'],
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
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher ID is required'],
      index: true,
    },
    examDate: {
      type: Date,
      required: [true, 'Exam date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [15, 'Duration must be at least 15 minutes'],
      max: [480, 'Duration cannot exceed 8 hours (480 minutes)'],
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
        validator: function (this: IExam, passingMarks: number) {
          return passingMarks <= this.totalMarks;
        },
        message: 'Passing marks cannot exceed total marks',
      },
    },
    venue: {
      type: String,
      trim: true,
      maxlength: [200, 'Venue cannot exceed 200 characters'],
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [2000, 'Instructions cannot exceed 2000 characters'],
    },
    syllabus: {
      type: [String],
      validate: {
        validator: function (syllabus: string[]) {
          return syllabus.length <= 50;
        },
        message: 'Cannot have more than 50 syllabus topics',
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    resultsPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    gradingScale: {
      type: gradingScaleSchema,
    },
    weightage: {
      type: Number,
      min: [0, 'Weightage cannot be negative'],
      max: [100, 'Weightage cannot exceed 100'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
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

// Exam Result schema
const examResultSchema = new Schema<IExamResultDocument>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
      index: true,
    },
    marksObtained: {
      type: Number,
      required: function(this: IExamResult) { return !this.isAbsent; },
      min: [0, 'Marks obtained cannot be negative'],
    },
    percentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F', 'ABS'],
    },
    isPass: {
      type: Boolean,
      default: false,
    },
    isAbsent: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
    },
    checkedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    checkedAt: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Instance methods for Exam
examSchema.methods.getDurationInHours = function (): number {
  return this.duration / 60;
};

examSchema.methods.isUpcoming = function (): boolean {
  const now = new Date();
  const examDateTime = new Date(this.examDate);
  const [hours, minutes] = this.startTime.split(':').map(Number);
  examDateTime.setHours(hours, minutes);
  return examDateTime > now;
};

examSchema.methods.isOngoing = function (): boolean {
  const now = new Date();
  const examDate = new Date(this.examDate);
  
  const [startHours, startMinutes] = this.startTime.split(':').map(Number);
  const [endHours, endMinutes] = this.endTime.split(':').map(Number);
  
  const startTime = new Date(examDate);
  startTime.setHours(startHours, startMinutes);
  
  const endTime = new Date(examDate);
  endTime.setHours(endHours, endMinutes);
  
  return now >= startTime && now <= endTime;
};

examSchema.methods.isCompleted = function (): boolean {
  const now = new Date();
  const examDateTime = new Date(this.examDate);
  const [hours, minutes] = this.endTime.split(':').map(Number);
  examDateTime.setHours(hours, minutes);
  return examDateTime < now;
};

examSchema.methods.getFormattedTimeSlot = function (): string {
  return `${this.startTime} - ${this.endTime}`;
};

examSchema.methods.canPublishResults = function (): boolean {
  return this.isCompleted() && !this.resultsPublished;
};

examSchema.methods.getGradeFromMarks = function (marks: number): string {
  if (!this.gradingScale) {
    // Default grading
    if (marks >= 90) return 'A';
    if (marks >= 80) return 'B';
    if (marks >= 70) return 'C';
    if (marks >= 60) return 'D';
    return 'F';
  }

  const scale = this.gradingScale;
  if (marks >= scale.gradeA) return 'A';
  if (marks >= scale.gradeB) return 'B';
  if (marks >= scale.gradeC) return 'C';
  if (marks >= scale.gradeD) return 'D';
  return 'F';
};

examSchema.methods.getPercentage = function (marks: number): number {
  return Math.round((marks / this.totalMarks) * 100);
};

examSchema.methods.getEligibleStudents = async function (): Promise<any[]> {
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

// Static methods
examSchema.statics.findBySchool = function (schoolId: string): Promise<IExamDocument[]> {
  return this.find({ schoolId, isActive: true })
    .populate('subjectId', 'name code')
    .populate({
      path: 'teacherId',
      select: 'userId teacherId',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    })
    .populate('createdBy', 'firstName lastName')
    .sort({ examDate: -1, startTime: 1 });
};

examSchema.statics.findByClass = function (
  schoolId: string,
  grade: number,
  section?: string
): Promise<IExamDocument[]> {
  const query: any = { schoolId, grade, isActive: true };
  if (section) query.section = section;

  return this.find(query)
    .populate('subjectId', 'name code')
    .populate({
      path: 'teacherId',
      select: 'userId teacherId',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    })
    .sort({ examDate: 1, startTime: 1 });
};

examSchema.statics.findByTeacher = function (teacherId: string): Promise<IExamDocument[]> {
  return this.find({ teacherId, isActive: true })
    .populate('subjectId', 'name code')
    .sort({ examDate: -1, startTime: 1 });
};

examSchema.statics.findBySubject = function (subjectId: string): Promise<IExamDocument[]> {
  return this.find({ subjectId, isActive: true })
    .populate({
      path: 'teacherId',
      select: 'userId teacherId',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    })
    .sort({ examDate: -1, startTime: 1 });
};

examSchema.statics.findUpcoming = function (
  schoolId: string,
  days: number = 30
): Promise<IExamDocument[]> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);

  return this.find({
    schoolId,
    isActive: true,
    examDate: { $gte: now, $lte: futureDate },
  })
    .populate('subjectId', 'name code')
    .populate({
      path: 'teacherId',
      select: 'userId teacherId',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    })
    .sort({ examDate: 1, startTime: 1 });
};

examSchema.statics.findByDateRange = function (
  schoolId: string,
  startDate: Date,
  endDate: Date
): Promise<IExamDocument[]> {
  return this.find({
    schoolId,
    isActive: true,
    examDate: { $gte: startDate, $lte: endDate },
  })
    .populate('subjectId', 'name code')
    .populate({
      path: 'teacherId',
      select: 'userId teacherId',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    })
    .sort({ examDate: 1, startTime: 1 });
};

examSchema.statics.getExamSchedule = async function (
  schoolId: string,
  grade: number,
  section?: string,
  startDate?: Date,
  endDate?: Date
): Promise<IExamSchedule> {
  let exams = await this.findByClass(schoolId, grade, section);

  // Filter by date range if provided
  if (startDate && endDate) {
    exams = exams.filter(exam => 
      exam.examDate >= startDate && exam.examDate <= endDate
    );
  }

  const schedule: IExamSchedule = {
    grade,
    section,
    academicYear: exams[0]?.academicYear || '',
    exams: [],
    summary: {
      totalExams: exams.length,
      upcomingExams: 0,
      ongoingExams: 0,
      completedExams: 0,
      publishedExams: 0,
      byExamType: [],
      bySubject: [],
    },
    timeline: [],
  };

  // Group exams by date
  const examsByDate = new Map();
  const examTypeCount = new Map();
  const subjectCount = new Map();

  exams.forEach(exam => {
    const dateKey = exam.examDate.toDateString();
    
    if (!examsByDate.has(dateKey)) {
      examsByDate.set(dateKey, []);
    }
    examsByDate.get(dateKey).push(exam);

    // Count exam types
    examTypeCount.set(exam.examType, (examTypeCount.get(exam.examType) || 0) + 1);
    
    // Count subjects
    const subjectId = (exam.subjectId as any)?._id?.toString() || exam.subjectId.toString();
    const subjectName = (exam.subjectId as any)?.name || 'Unknown Subject';
    subjectCount.set(subjectId, {
      name: subjectName,
      count: (subjectCount.get(subjectId)?.count || 0) + 1
    });

    // Count by status
    if (exam.isUpcoming()) schedule.summary.upcomingExams++;
    else if (exam.isOngoing()) schedule.summary.ongoingExams++;
    else schedule.summary.completedExams++;

    if (exam.isPublished) schedule.summary.publishedExams++;
  });

  // Convert to arrays
  schedule.exams = Array.from(examsByDate.entries()).map(([date, exams]) => ({
    date: new Date(date),
    exams: exams
  }));

  schedule.summary.byExamType = Array.from(examTypeCount.entries()).map(([type, count]) => ({
    examType: type,
    count
  }));

  schedule.summary.bySubject = Array.from(subjectCount.entries()).map(([subjectId, data]) => ({
    subjectId,
    subjectName: data.name,
    count: data.count
  }));

  // Generate timeline
  const sortedDates = Array.from(examsByDate.keys()).sort();
  schedule.timeline = sortedDates.map(dateStr => {
    const date = new Date(dateStr);
    const dayExams = examsByDate.get(dateStr);
    
    return {
      date,
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
      exams: dayExams.map((exam: any) => ({
        examName: exam.examName,
        subject: exam.subjectId.name,
        timeSlot: exam.getFormattedTimeSlot(),
        venue: exam.venue,
        duration: exam.duration
      }))
    };
  });

  return schedule;
};

examSchema.statics.getExamStats = async function (
  schoolId: string,
  examId: string
): Promise<IExamStats> {
  const exam = await this.findById(examId).populate('subjectId', 'name');
  if (!exam) {
    throw new Error('Exam not found');
  }

  const ExamResult = model('ExamResult');
  const results = await ExamResult.find({ examId })
    .populate({
      path: 'studentId',
      select: 'userId rollNumber',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    });

  const eligibleStudents = await exam.getEligibleStudents();
  const totalStudents = eligibleStudents.length;
  
  const appearedStudents = results.filter(r => !r.isAbsent).length;
  const absentStudents = results.filter(r => r.isAbsent).length;
  const passedStudents = results.filter(r => r.isPass && !r.isAbsent).length;
  const failedStudents = appearedStudents - passedStudents;

  // Calculate averages
  const validResults = results.filter(r => !r.isAbsent && r.marksObtained !== undefined);
  const totalMarksScored = validResults.reduce((sum, r) => sum + r.marksObtained, 0);
  const averageMarks = validResults.length > 0 ? totalMarksScored / validResults.length : 0;
  const highestMarks = validResults.length > 0 ? Math.max(...validResults.map(r => r.marksObtained)) : 0;
  const lowestMarks = validResults.length > 0 ? Math.min(...validResults.map(r => r.marksObtained)) : 0;

  // Grade distribution
  const gradeCount = { A: 0, B: 0, C: 0, D: 0, F: 0, ABS: 0 };
  results.forEach(result => {
    if (result.grade && gradeCount.hasOwnProperty(result.grade)) {
      gradeCount[result.grade as keyof typeof gradeCount]++;
    }
  });

  const gradeDistribution = Object.entries(gradeCount).map(([grade, count]) => ({
    grade,
    count,
    percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
    marksRange: (this.constructor as IExamModel).getGradeRange(grade, exam.gradingScale, exam.totalMarks)
  }));

  // Marks distribution
  const marksRanges = ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-90', '91-100'];
  const marksDistribution = marksRanges.map(range => {
    const [min, max] = range.split('-').map(Number);
    const count = validResults.filter(r => {
      const percentage = (r.marksObtained / exam.totalMarks) * 100;
      return percentage >= min && percentage <= max;
    }).length;
    
    return {
      range,
      count,
      percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
    };
  });

  // Top performers
  const topPerformers = validResults
    .sort((a, b) => b.marksObtained - a.marksObtained)
    .slice(0, 10)
    .map(result => ({
      studentId: result.studentId._id.toString(),
      studentName: `${result.studentId.userId.firstName} ${result.studentId.userId.lastName}`,
      rollNumber: result.studentId.rollNumber || 0,
      marksObtained: result.marksObtained,
      percentage: Math.round((result.marksObtained / exam.totalMarks) * 100),
      grade: result.grade || 'N/A'
    }));

  return {
    examId,
    examName: exam.examName,
    totalStudents,
    appearedStudents,
    passedStudents,
    failedStudents,
    absentStudents,
    averageMarks: Math.round(averageMarks * 100) / 100,
    highestMarks,
    lowestMarks,
    passPercentage: totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0,
    attendancePercentage: totalStudents > 0 ? Math.round((appearedStudents / totalStudents) * 100) : 0,
    gradeDistribution,
    marksDistribution,
    topPerformers
  };
};

// Helper method for grade range
examSchema.statics.getGradeRange = function (grade: string, gradingScale: any, totalMarks: number): string {
  if (!gradingScale) {
    const ranges = { A: '90-100', B: '80-89', C: '70-79', D: '60-69', F: '0-59', ABS: 'Absent' };
    return ranges[grade as keyof typeof ranges] || 'N/A';
  }

  const scale = gradingScale;
  const ranges = {
    A: `${scale.gradeA}-100`,
    B: `${scale.gradeB}-${scale.gradeA - 1}`,
    C: `${scale.gradeC}-${scale.gradeB - 1}`,
    D: `${scale.gradeD}-${scale.gradeC - 1}`,
    F: `0-${scale.gradeD - 1}`,
    ABS: 'Absent'
  };
  
  return ranges[grade as keyof typeof ranges] || 'N/A';
};

// Indexes for performance
examSchema.index({ schoolId: 1, examDate: 1 });
examSchema.index({ schoolId: 1, grade: 1, section: 1 });
examSchema.index({ teacherId: 1, examDate: -1 });
examSchema.index({ subjectId: 1, examDate: -1 });
examSchema.index({ academicYear: 1, examType: 1 });
examSchema.index({ isPublished: 1, resultsPublished: 1 });

// Exam Result indexes
examResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });
examResultSchema.index({ studentId: 1 });
examResultSchema.index({ checkedBy: 1 });

// Pre-save validation for Exam
examSchema.pre('save', function (next) {
  // Calculate duration from start and end time
  const [startHours, startMinutes] = this.startTime.split(':').map(Number);
  const [endHours, endMinutes] = this.endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  let calculatedDuration = endTotalMinutes - startTotalMinutes;
  
  // Handle day overflow (e.g., starts at 23:30, ends at 01:30 next day)
  if (calculatedDuration < 0) {
    calculatedDuration += 24 * 60;
  }
  
  this.duration = calculatedDuration;

  // Validate grading scale if provided
  if (this.gradingScale) {
    const scale = this.gradingScale;
    if (scale.gradeA <= scale.gradeB || scale.gradeB <= scale.gradeC || 
        scale.gradeC <= scale.gradeD || scale.gradeD <= scale.gradeF) {
      return next(new Error('Grading scale must be in descending order (A > B > C > D > F)'));
    }
  }

  next();
});

// Pre-save validation for Exam Result
examResultSchema.pre('save', async function (next) {
  if (!this.isAbsent && this.marksObtained !== undefined) {
    // Get exam details to calculate percentage and grade
    const exam = await model('Exam').findById(this.examId);
    if (exam) {
      this.percentage = Math.round((this.marksObtained / exam.totalMarks) * 100);
      this.grade = exam.getGradeFromMarks(this.percentage);
      this.isPass = this.marksObtained >= exam.passingMarks;
    }
  } else if (this.isAbsent) {
    this.grade = 'ABS';
    this.isPass = false;
    this.percentage = 0;
    this.marksObtained = 0;
  }

  next();
});

// Transform for JSON output
examSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    (ret as any).durationHours = doc.getDurationInHours();
    (ret as any).timeSlot = doc.getFormattedTimeSlot();
    (ret as any).canPublishResults = doc.canPublishResults();
    
    if (doc.isUpcoming()) {
      (ret as any).status = 'upcoming';
    } else if (doc.isOngoing()) {
      (ret as any).status = 'ongoing';
    } else {
      (ret as any).status = 'completed';
    }
    
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

examResultSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

// Export the models
export const Exam = model<IExamDocument, IExamModel>('Exam', examSchema);
export const ExamResult = model<IExamResultDocument>('ExamResult', examResultSchema);