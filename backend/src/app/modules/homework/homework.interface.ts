import { Document, Types, Model } from 'mongoose';

export interface IHomework {
  schoolId: Types.ObjectId;
  teacherId: Types.ObjectId;
  subjectId: Types.ObjectId;
  classId?: Types.ObjectId; 
  grade: number;
  section?: string; // If not specified, applies to all sections of the grade
  title: string;
  description: string;
  instructions?: string;
  homeworkType: 'assignment' | 'project' | 'reading' | 'practice' | 'research' | 'presentation' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedDate: Date;
  dueDate: Date;
  estimatedDuration: number; // Duration in minutes
  totalMarks: number;
  passingMarks: number;
  attachments?: string[]; // File paths for reference materials
  submissionType: 'text' | 'file' | 'both' | 'none'; // Type of submission expected
  allowLateSubmission: boolean;
  latePenalty?: number; // Percentage penalty per day late
  maxLateDays?: number; // Maximum days late submission is allowed
  isGroupWork: boolean;
  maxGroupSize?: number;
  rubric?: {
    criteria: string;
    maxPoints: number;
    description?: string;
  }[];
  tags?: string[]; // Tags for categorization
  isPublished: boolean; // Whether homework is visible to students
  reminderSent: boolean; // Whether due date reminder was sent
  reminderDate?: Date; // When reminder was sent
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHomeworkDocument extends IHomework, Document, IHomeworkMethods {
  _id: Types.ObjectId;
}

export interface IHomeworkMethods {
  isOverdue(): boolean;
  isDueToday(): boolean;
  isDueTomorrow(): boolean;
  getDaysUntilDue(): number;
  getDaysOverdue(): number;
  getFormattedDueDate(): string;
  getEstimatedDurationHours(): number;
  canSubmit(): boolean;
  getLatePenaltyPercentage(submissionDate: Date): number;
  getEligibleStudents(): Promise<any[]>;
  getSubmissionStats(): Promise<IHomeworkSubmissionStats>;
}

export interface IHomeworkModel extends Model<IHomeworkDocument> {
  findBySchool(schoolId: string): Promise<IHomeworkDocument[]>;
  findByTeacher(teacherId: string): Promise<IHomeworkDocument[]>;
  findBySubject(subjectId: string): Promise<IHomeworkDocument[]>;
  findByClass(schoolId: string, grade: number, section?: string): Promise<IHomeworkDocument[]>;
  findByStudent(studentId: string): Promise<IHomeworkDocument[]>;
  findUpcoming(schoolId: string, days?: number): Promise<IHomeworkDocument[]>;
  findOverdue(schoolId: string): Promise<IHomeworkDocument[]>;
  findDueToday(schoolId: string): Promise<IHomeworkDocument[]>;
  getHomeworkCalendar(
    schoolId: string,
    startDate: Date,
    endDate: Date,
    grade?: number,
    section?: string
  ): Promise<IHomeworkCalendar>;
  getHomeworkStats(schoolId: string, filters?: IHomeworkFilters): Promise<IHomeworkAnalytics>;
}

export interface IHomeworkSubmission {
  homeworkId: Types.ObjectId;
  studentId: Types.ObjectId;
  groupMembers?: Types.ObjectId[]; // For group assignments
  submissionText?: string;
  attachments?: string[]; // File paths for submitted files
  submittedAt: Date;
  isLate: boolean;
  daysLate: number;
  latePenalty: number; // Percentage penalty applied
  status: 'submitted' | 'graded' | 'returned' | 'missing';
  marksObtained?: number;
  grade?: string;
  percentage?: number;
  feedback?: string;
  teacherComments?: string;
  gradedAt?: Date;
  gradedBy?: Types.ObjectId; // Teacher who graded
  revision?: {
    requested: boolean;
    requestedAt?: Date;
    reason?: string;
    completed?: boolean;
    completedAt?: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHomeworkSubmissionDocument extends IHomeworkSubmission, Document {
  _id: Types.ObjectId;
}

export interface ICreateHomeworkRequest {
  schoolId: string;
  teacherId: string;
  subjectId: string;
  classId?: string;
  grade: number;
  section?: string;
  title: string;
  description: string;
  instructions?: string;
  homeworkType: 'assignment' | 'project' | 'reading' | 'practice' | 'research' | 'presentation' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedDate: string; // ISO date string
  dueDate: string; // ISO date string
  estimatedDuration: number;
  totalMarks: number;
  passingMarks: number;
  submissionType: 'text' | 'file' | 'both' | 'none';
  allowLateSubmission: boolean;
  latePenalty?: number;
  maxLateDays?: number;
  isGroupWork: boolean;
  maxGroupSize?: number;
  rubric?: {
    criteria: string;
    maxPoints: number;
    description?: string;
  }[];
  tags?: string[];
}

export interface IUpdateHomeworkRequest {
  title?: string;
  description?: string;
  instructions?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  estimatedDuration?: number;
  totalMarks?: number;
  passingMarks?: number;
  attachments?: string[];
  allowLateSubmission?: boolean;
  latePenalty?: number;
  maxLateDays?: number;
  isGroupWork?: boolean;
  maxGroupSize?: number;
  rubric?: {
    criteria: string;
    maxPoints: number;
    description?: string;
  }[];
  tags?: string[];
  isPublished?: boolean;
}

export interface ISubmitHomeworkRequest {
  homeworkId: string;
  studentId: string;
  groupMembers?: string[];
  submissionText?: string;
  attachments?: string[];
}

export interface IHomeworkResponse {
  id: string;
  schoolId: string;
  teacherId: string;
  subjectId: string;
  classId?: string;
  grade: number;
  section?: string;
  title: string;
  description: string;
  instructions?: string;
  homeworkType: string;
  priority: string;
  assignedDate: Date;
  dueDate: Date;
  estimatedDuration: number;
  estimatedDurationHours: number;
  totalMarks: number;
  passingMarks: number;
  attachments?: string[];
  submissionType: string;
  allowLateSubmission: boolean;
  latePenalty?: number;
  maxLateDays?: number;
  isGroupWork: boolean;
  maxGroupSize?: number;
  rubric?: {
    criteria: string;
    maxPoints: number;
    description?: string;
  }[];
  tags?: string[];
  isPublished: boolean;
  reminderSent: boolean;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueTomorrow: boolean;
  daysUntilDue: number;
  daysOverdue: number;
  formattedDueDate: string;
  canSubmit: boolean;
  createdAt: Date;
  updatedAt: Date;
  school?: {
    id: string;
    name: string;
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
  submissionStats?: IHomeworkSubmissionStats;
  mySubmission?: IHomeworkSubmissionResponse; // For student view
}

export interface IHomeworkSubmissionResponse {
  id: string;
  homeworkId: string;
  studentId: string;
  groupMembers?: string[];
  submissionText?: string;
  attachments?: string[];
  submittedAt: Date;
  isLate: boolean;
  daysLate: number;
  latePenalty: number;
  status: string;
  marksObtained?: number;
  grade?: string;
  percentage?: number;
  feedback?: string;
  teacherComments?: string;
  gradedAt?: Date;
  revision?: {
    requested: boolean;
    requestedAt?: Date;
    reason?: string;
    completed?: boolean;
    completedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  student?: {
    id: string;
    userId: string;
    studentId: string;
    fullName: string;
    rollNumber: number;
  };
  groupMemberDetails?: Array<{
    id: string;
    fullName: string;
    rollNumber: number;
  }>;
}

export interface IHomeworkSubmissionStats {
  totalStudents: number;
  submittedCount: number;
  pendingCount: number;
  lateCount: number;
  gradedCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  onTimePercentage: number;
  submissionPercentage: number;
  gradeDistribution: Array<{
    grade: string;
    count: number;
    percentage: number;
  }>;
}

export interface IHomeworkCalendar {
  startDate: Date;
  endDate: Date;
  grade?: number;
  section?: string;
  homework: Array<{
    date: Date;
    homework: IHomeworkResponse[];
  }>;
  summary: {
    totalHomework: number;
    overdueCount: number;
    dueTodayCount: number;
    upcomingCount: number;
    byPriority: Array<{
      priority: string;
      count: number;
    }>;
    bySubject: Array<{
      subjectId: string;
      subjectName: string;
      count: number;
    }>;
    byType: Array<{
      homeworkType: string;
      count: number;
    }>;
  };
}

export interface IHomeworkAnalytics {
  schoolId: string;
  totalHomework: number;
  totalSubmissions: number;
  averageSubmissionRate: number;
  averageScore: number;
  overduePercentage: number;
  byGrade: Array<{
    grade: number;
    homeworkCount: number;
    submissionRate: number;
    averageScore: number;
  }>;
  bySubject: Array<{
    subjectId: string;
    subjectName: string;
    homeworkCount: number;
    averageScore: number;
    submissionRate: number;
  }>;
  byTeacher: Array<{
    teacherId: string;
    teacherName: string;
    homeworkAssigned: number;
    averageScore: number;
    submissionRate: number;
  }>;
  byHomeworkType: Array<{
    homeworkType: string;
    count: number;
    averageScore: number;
    submissionRate: number;
  }>;
  trendsOverTime: Array<{
    month: string;
    year: number;
    homeworkCount: number;
    submissionRate: number;
    averageScore: number;
  }>;
  topPerformingStudents: Array<{
    studentId: string;
    studentName: string;
    grade: number;
    section: string;
    submissionRate: number;
    averageScore: number;
    homeworkCompleted: number;
  }>;
}

export interface IHomeworkFilters {
  schoolId?: string;
  teacherId?: string;
  subjectId?: string;
  grade?: number;
  section?: string;
  homeworkType?: string;
  priority?: string;
  isPublished?: boolean;
  isOverdue?: boolean;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
}

export interface IHomeworkNotification {
  homeworkId: string;
  title: string;
  subject: string;
  dueDate: Date;
  priority: string;
  recipients: Array<{
    userId: string;
    userType: 'student' | 'parent';
    notificationType: 'assigned' | 'due-reminder' | 'overdue' | 'graded';
  }>;
  sentAt?: Date;
}

export interface IHomeworkReport {
  studentId: string;
  studentName: string;
  grade: number;
  section: string;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  totalHomework: number;
  submittedHomework: number;
  lateSubmissions: number;
  missedHomework: number;
  submissionRate: number;
  averageScore: number;
  subjectWisePerformance: Array<{
    subjectId: string;
    subjectName: string;
    totalHomework: number;
    submitted: number;
    averageScore: number;
    submissionRate: number;
  }>;
  strengths: string[];
  improvementAreas: string[];
  teacherRecommendations: string[];
}