import { Document, Types, Model } from 'mongoose';

export interface IExam {
  schoolId: Types.ObjectId;
  examName: string;
  examType: 'unit-test' | 'mid-term' | 'final' | 'quarterly' | 'half-yearly' | 'annual' | 'entrance' | 'mock';
  academicYear: string; // e.g., "2024-2025"
  grade: number;
  section?: string; // Optional, if exam is for all sections of a grade
  subjectId: Types.ObjectId;
  teacherId: Types.ObjectId; // Teacher conducting the exam
  examDate: Date;
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "12:00"
  duration: number; // Duration in minutes
  totalMarks: number;
  passingMarks: number;
  venue?: string; // Exam hall or classroom
  instructions?: string;
  syllabus?: string[]; // Syllabus topics covered
  isPublished: boolean; // Whether exam is published to students
  resultsPublished: boolean; // Whether results are published
  gradingScale?: {
    gradeA: number; // Marks for A grade (e.g., 90-100)
    gradeB: number; // Marks for B grade (e.g., 80-89)
    gradeC: number; // Marks for C grade (e.g., 70-79)
    gradeD: number; // Marks for D grade (e.g., 60-69)
    gradeF: number; // Marks for F grade (below 60)
  };
  weightage?: number; // Weightage in final calculation (e.g., 20%)
  createdBy: Types.ObjectId; // User who created the exam
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IExamDocument extends IExam, Document, IExamMethods {
  _id: Types.ObjectId;
}

export interface IExamMethods {
  getDurationInHours(): number;
  isUpcoming(): boolean;
  isOngoing(): boolean;
  isCompleted(): boolean;
  getFormattedTimeSlot(): string;
  canPublishResults(): boolean;
  getGradeFromMarks(marks: number): string;
  getPercentage(marks: number): number;
  getEligibleStudents(): Promise<any[]>;
}

export interface IExamModel extends Model<IExamDocument> {
  findBySchool(schoolId: string): Promise<IExamDocument[]>;
  findByClass(schoolId: string, grade: number, section?: string): Promise<IExamDocument[]>;
  findByTeacher(teacherId: string): Promise<IExamDocument[]>;
  findBySubject(subjectId: string): Promise<IExamDocument[]>;
  findUpcoming(schoolId: string, days?: number): Promise<IExamDocument[]>;
  findByDateRange(schoolId: string, startDate: Date, endDate: Date): Promise<IExamDocument[]>;
  getGradeRange(grade: string, gradingScale: any, totalMarks: number): string;
  getExamSchedule(
    schoolId: string,
    grade: number,
    section?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<IExamSchedule>;
  getExamStats(schoolId: string, examId: string): Promise<IExamStats>;
}

export interface ICreateExamRequest {
  schoolId: string;
  examName: string;
  examType: 'unit-test' | 'mid-term' | 'final' | 'quarterly' | 'half-yearly' | 'annual' | 'entrance' | 'mock';
  academicYear: string;
  grade: number;
  section?: string;
  subjectId: string;
  teacherId: string;
  examDate: string; // ISO date string
  startTime: string;
  endTime: string;
  totalMarks: number;
  passingMarks: number;
  venue?: string;
  instructions?: string;
  syllabus?: string[];
  gradingScale?: {
    gradeA: number;
    gradeB: number;
    gradeC: number;
    gradeD: number;
    gradeF: number;
  };
  weightage?: number;
}

export interface IUpdateExamRequest {
  examName?: string;
  examDate?: string;
  startTime?: string;
  endTime?: string;
  totalMarks?: number;
  passingMarks?: number;
  venue?: string;
  instructions?: string;
  syllabus?: string[];
  isPublished?: boolean;
  resultsPublished?: boolean;
  gradingScale?: {
    gradeA: number;
    gradeB: number;
    gradeC: number;
    gradeD: number;
    gradeF: number;
  };
  weightage?: number;
  isActive?: boolean;
}

export interface IExamResponse {
  id: string;
  schoolId: string;
  examName: string;
  examType: string;
  academicYear: string;
  grade: number;
  section?: string;
  examDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  durationHours: number;
  totalMarks: number;
  passingMarks: number;
  venue?: string;
  instructions?: string;
  syllabus?: string[];
  isPublished: boolean;
  resultsPublished: boolean;
  gradingScale?: {
    gradeA: number;
    gradeB: number;
    gradeC: number;
    gradeD: number;
    gradeF: number;
  };
  weightage?: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  timeSlot: string;
  canPublishResults: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  school?: {
    id: string;
    name: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  teacher?: {
    id: string;
    userId: string;
    teacherId: string;
    fullName: string;
  };
  createdBy?: {
    id: string;
    fullName: string;
  };
  studentCount?: number;
  submissionCount?: number;
}

export interface IExamSchedule {
  grade: number;
  section?: string;
  academicYear: string;
  exams: Array<{
    date: Date;
    exams: IExamResponse[];
  }>;
  summary: {
    totalExams: number;
    upcomingExams: number;
    ongoingExams: number;
    completedExams: number;
    publishedExams: number;
    byExamType: Array<{
      examType: string;
      count: number;
    }>;
    bySubject: Array<{
      subjectId: string;
      subjectName: string;
      count: number;
    }>;
  };
  timeline: Array<{
    date: Date;
    dayOfWeek: string;
    exams: Array<{
      examName: string;
      subject: string;
      timeSlot: string;
      venue?: string;
      duration: number;
    }>;
  }>;
}

export interface IExamStats {
  examId: string;
  examName: string;
  totalStudents: number;
  appearedStudents: number;
  passedStudents: number;
  failedStudents: number;
  absentStudents: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  passPercentage: number;
  attendancePercentage: number;
  gradeDistribution: Array<{
    grade: string;
    count: number;
    percentage: number;
    marksRange: string;
  }>;
  marksDistribution: Array<{
    range: string; // e.g., "0-10", "11-20", etc.
    count: number;
    percentage: number;
  }>;
  topPerformers: Array<{
    studentId: string;
    studentName: string;
    rollNumber: number;
    marksObtained: number;
    percentage: number;
    grade: string;
  }>;
}

export interface IExamResult {
  examId: Types.ObjectId;
  studentId: Types.ObjectId;
  marksObtained: number;
  percentage: number;
  grade: string;
  isPass: boolean;
  isAbsent: boolean;
  submittedAt?: Date;
  checkedBy?: Types.ObjectId; // Teacher who checked
  checkedAt?: Date;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IExamResultDocument extends IExamResult, Document {
  _id: Types.ObjectId;
}

export interface ISubmitResultRequest {
  examId: string;
  results: Array<{
    studentId: string;
    marksObtained: number;
    isAbsent?: boolean;
    remarks?: string;
  }>;
}

export interface IExamFilters {
  schoolId?: string;
  grade?: number;
  section?: string;
  examType?: string;
  subjectId?: string;
  teacherId?: string;
  academicYear?: string;
  isPublished?: boolean;
  resultsPublished?: boolean;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

export interface IExamNotification {
  examId: string;
  examName: string;
  examDate: Date;
  subject: string;
  grade: number;
  section?: string;
  recipients: Array<{
    userId: string;
    userType: 'student' | 'parent' | 'teacher';
    notificationType: 'exam-scheduled' | 'exam-reminder' | 'results-published';
  }>;
  sentAt?: Date;
}

export interface IExamTimetable {
  schoolId: string;
  grade: number;
  section?: string;
  academicYear: string;
  examType: string;
  startDate: Date;
  endDate: Date;
  exams: Array<{
    date: Date;
    dayOfWeek: string;
    timeSlot: string;
    subject: string;
    venue?: string;
    duration: number;
    totalMarks: number;
  }>;
  instructions: string[];
  contactInfo: {
    examController: string;
    phone: string;
    email: string;
  };
}