import { Document, Types, Model } from 'mongoose';

export interface IGrade {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  teacherId: Types.ObjectId;
  subjectId: Types.ObjectId;
  academicYear: string; // e.g., "2024-2025"
  semester: 'first' | 'second' | 'annual';
  gradeType: 'assignment' | 'quiz' | 'test' | 'project' | 'homework' | 'participation' | 'exam' | 'final';
  title: string; // e.g., "Math Quiz 1", "History Project", "Final Exam"
  description?: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string; // A, B, C, D, F
  gpa?: number; // Grade Point Average (4.0 scale)
  weightage: number; // Weightage in final calculation (e.g., 20%)
  gradedDate: Date;
  dueDate?: Date; // For assignments/homework
  submittedDate?: Date; // When student submitted
  isLate?: boolean; // If submitted after due date
  feedback?: string; // Teacher's feedback
  rubric?: {
    criteria: string;
    maxPoints: number;
    earnedPoints: number;
    comments?: string;
  }[];
  isPublished: boolean; // Whether grade is visible to student/parent
  isExtraCredit: boolean;
  tags?: string[]; // Tags for categorization
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGradeDocument extends IGrade, Document, IGradeMethods {
  _id: Types.ObjectId;
}

export interface IGradeMethods {
  calculateGPA(): number;
  getLetterGrade(): string;
  isPassingGrade(): boolean;
  getDaysLate(): number;
  getFormattedGrade(): string;
  calculateWeightedScore(): number;
}

export interface IGradeModel extends Model<IGradeDocument> {
  findByStudent(studentId: string, academicYear?: string): Promise<IGradeDocument[]>;
  findBySubject(subjectId: string, academicYear?: string): Promise<IGradeDocument[]>;
  findByTeacher(teacherId: string, academicYear?: string): Promise<IGradeDocument[]>;
  findBySchool(schoolId: string, academicYear?: string): Promise<IGradeDocument[]>;
  getGradeFromPercentage(percentage: number): string;
  getGPAFromGrade(grade: string): number;
  calculateStudentGPA(studentId: string, academicYear: string, semester?: string): Promise<number>;
  calculateSubjectAverage(
    studentId: string,
    subjectId: string,
    academicYear: string,
    semester?: string
  ): Promise<ISubjectGrade>;
  getStudentReportCard(
    studentId: string,
    academicYear: string,
    semester?: string
  ): Promise<IReportCard>;
  getClassGradeStats(
    schoolId: string,
    grade: number,
    section: string,
    subjectId: string,
    academicYear: string
  ): Promise<IClassGradeStats>;
  getGradingAnalytics(
    schoolId: string,
    filters?: IGradeFilters
  ): Promise<IGradingAnalytics>;
}

export interface ICreateGradeRequest {
  studentId: string;
  teacherId: string;
  subjectId: string;
  academicYear: string;
  semester: 'first' | 'second' | 'annual';
  gradeType: 'assignment' | 'quiz' | 'test' | 'project' | 'homework' | 'participation' | 'exam' | 'final';
  title: string;
  description?: string;
  marksObtained: number;
  totalMarks: number;
  weightage: number;
  gradedDate: string; // ISO date string
  dueDate?: string;
  submittedDate?: string;
  feedback?: string;
  rubric?: {
    criteria: string;
    maxPoints: number;
    earnedPoints: number;
    comments?: string;
  }[];
  isExtraCredit?: boolean;
  tags?: string[];
}

export interface IUpdateGradeRequest {
  marksObtained?: number;
  totalMarks?: number;
  weightage?: number;
  feedback?: string;
  isPublished?: boolean;
  tags?: string[];
  rubric?: {
    criteria: string;
    maxPoints: number;
    earnedPoints: number;
    comments?: string;
  }[];
}

export interface IGradeResponse {
  id: string;
  schoolId: string;
  studentId: string;
  teacherId: string;
  subjectId: string;
  academicYear: string;
  semester: string;
  gradeType: string;
  title: string;
  description?: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  gpa?: number;
  weightage: number;
  gradedDate: Date;
  dueDate?: Date;
  submittedDate?: Date;
  isLate?: boolean;
  feedback?: string;
  rubric?: {
    criteria: string;
    maxPoints: number;
    earnedPoints: number;
    comments?: string;
  }[];
  isPublished: boolean;
  isExtraCredit: boolean;
  tags?: string[];
  daysLate: number;
  formattedGrade: string;
  weightedScore: number;
  createdAt: Date;
  updatedAt: Date;
  student?: {
    id: string;
    userId: string;
    studentId: string;
    fullName: string;
    rollNumber: number;
  };
  teacher?: {
    id: string;
    userId: string;
    teacherId: string;
    fullName: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface ISubjectGrade {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  totalMarks: number;
  totalObtained: number;
  percentage: number;
  grade: string;
  gpa: number;
  weightedAverage: number;
  gradeCount: number;
  assignments: {
    count: number;
    average: number;
  };
  quizzes: {
    count: number;
    average: number;
  };
  tests: {
    count: number;
    average: number;
  };
  exams: {
    count: number;
    average: number;
  };
  projects: {
    count: number;
    average: number;
  };
  participation: {
    count: number;
    average: number;
  };
  trend: Array<{
    date: Date;
    grade: string;
    percentage: number;
    title: string;
  }>;
}

export interface IReportCard {
  studentId: string;
  studentName: string;
  rollNumber: number;
  grade: number;
  section: string;
  academicYear: string;
  semester: string;
  generatedDate: Date;
  subjects: ISubjectGrade[];
  overallGPA: number;
  overallPercentage: number;
  overallGrade: string;
  totalCredits: number;
  classRank?: number;
  totalStudents?: number;
  attendance: {
    totalDays: number;
    presentDays: number;
    percentage: number;
  };
  disciplinaryRecords: number;
  teacherComments: Array<{
    subjectId: string;
    subjectName: string;
    teacherId: string;
    teacherName: string;
    comment: string;
  }>;
  parentSignature?: {
    signed: boolean;
    signedDate?: Date;
    comments?: string;
  };
  nextTermStarts?: Date;
  achievements?: string[];
}

export interface IClassGradeStats {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  academicYear: string;
  totalStudents: number;
  gradeDistribution: Array<{
    grade: string;
    count: number;
    percentage: number;
  }>;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  medianScore: number;
  standardDeviation: number;
  passingPercentage: number;
  topPerformers: Array<{
    studentId: string;
    studentName: string;
    rollNumber: number;
    percentage: number;
    grade: string;
  }>;
  strugglingStudents: Array<{
    studentId: string;
    studentName: string;
    rollNumber: number;
    percentage: number;
    grade: string;
  }>;
  gradeTypeBreakdown: Array<{
    gradeType: string;
    averageScore: number;
    count: number;
  }>;
}

export interface IGradingAnalytics {
  schoolId: string;
  academicYear: string;
  totalGrades: number;
  averageGPA: number;
  gradeDistribution: Array<{
    grade: string;
    count: number;
    percentage: number;
  }>;
  subjectPerformance: Array<{
    subjectId: string;
    subjectName: string;
    averagePercentage: number;
    totalStudents: number;
    gradeDistribution: Array<{
      grade: string;
      count: number;
    }>;
  }>;
  teacherPerformance: Array<{
    teacherId: string;
    teacherName: string;
    subjectsTeaching: string[];
    averageClassPercentage: number;
    totalGradesGiven: number;
  }>;
  gradeTypeAnalysis: Array<{
    gradeType: string;
    totalCount: number;
    averagePercentage: number;
    passPercentage: number;
  }>;
  trendsOverTime: Array<{
    month: string;
    year: number;
    averageGPA: number;
    totalGrades: number;
  }>;
  semesterComparison: {
    firstSemester: {
      averageGPA: number;
      totalGrades: number;
    };
    secondSemester: {
      averageGPA: number;
      totalGrades: number;
    };
    improvement: number; // Percentage improvement
  };
}

export interface IGradeFilters {
  schoolId?: string;
  studentId?: string;
  teacherId?: string;
  subjectId?: string;
  academicYear?: string;
  semester?: string;
  gradeType?: string;
  grade?: string;
  isPublished?: boolean;
  isExtraCredit?: boolean;
  startDate?: Date;
  endDate?: Date;
  minPercentage?: number;
  maxPercentage?: number;
  tags?: string[];
}

export interface IBulkGradeRequest {
  grades: Array<{
    studentId: string;
    marksObtained: number;
    submittedDate?: string;
    feedback?: string;
  }>;
  commonData: {
    teacherId: string;
    subjectId: string;
    academicYear: string;
    semester: 'first' | 'second' | 'annual';
    gradeType: string;
    title: string;
    description?: string;
    totalMarks: number;
    weightage: number;
    gradedDate: string;
    dueDate?: string;
  };
}

export interface IGradeHistory {
  studentId: string;
  subjectId: string;
  academicYear: string;
  grades: Array<{
    date: Date;
    gradeType: string;
    title: string;
    percentage: number;
    grade: string;
    trend: 'up' | 'down' | 'same';
  }>;
  progressSummary: {
    improvementPercentage: number;
    consistencyScore: number; // How consistent the grades are
    bestPerformingType: string; // Assignment type where student performs best
    needsImprovementType: string; // Assignment type needing improvement
  };
}

export interface IGradeNotification {
  studentId: string;
  parentIds: string[];
  gradeId: string;
  subject: string;
  gradeReceived: string;
  percentage: number;
  notificationType: 'grade-posted' | 'grade-updated' | 'low-grade-alert' | 'improvement-notice';
  sentAt?: Date;
}