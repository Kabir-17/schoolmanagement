import { Document, Types, Model } from "mongoose";

export interface ISchedule {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId; // Grade + Section combination
  grade: number;
  section: string;
  academicYear: string; // e.g., "2024-2025"
  dayOfWeek:
    | "sunday"
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday";
  periods: ISchedulePeriod[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISchedulePeriod {
  periodNumber: number; // 1-8
  subjectId?: Types.ObjectId; // Optional for break periods
  teacherId?: Types.ObjectId; // Optional for break periods
  roomNumber?: string;
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "09:45"
  isBreak?: boolean;
  breakType?: "short" | "lunch" | "long";
  breakDuration?: number; // minutes
}

export interface IScheduleDocument
  extends ISchedule,
    Document,
    IScheduleMethods {
  _id: Types.ObjectId;
}

export interface IScheduleMethods {
  getTotalPeriodsCount(): number;
  getPeriodByNumber(periodNumber: number): ISchedulePeriod | undefined;
  getPeriodsForTeacher(teacherId: string): ISchedulePeriod[];
  getPeriodsForSubject(subjectId: string): ISchedulePeriod[];
  hasConflict(teacherId: string, periodNumber: number): boolean;
  getBreakPeriods(): ISchedulePeriod[];
  getClassPeriods(): ISchedulePeriod[];
}

export interface IScheduleModel extends Model<IScheduleDocument> {
  findBySchool(schoolId: string): Promise<IScheduleDocument[]>;
  findByClass(
    schoolId: string,
    grade: number,
    section: string
  ): Promise<IScheduleDocument[]>;
  findByTeacher(teacherId: string): Promise<IScheduleDocument[]>;
  findBySubject(subjectId: string): Promise<IScheduleDocument[]>;
  checkTeacherConflict(
    teacherId: string,
    dayOfWeek: string,
    periodNumber: number,
    startTime: string,
    endTime: string,
    excludeScheduleId?: string
  ): Promise<boolean>;
  generateWeeklySchedule(
    schoolId: string,
    grade: number,
    section: string
  ): Promise<IWeeklySchedule>;
  getTeacherWorkload(teacherId: string): Promise<ITeacherWorkload>;
}

export interface ICreateScheduleRequest {
  schoolId: string;
  classId?: string; // Optional as it's handled automatically by the service
  grade: number;
  section: string;
  academicYear: string;
  dayOfWeek:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday";
  applyToDays?: Array<
    | "sunday"
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
  >;
  periods: ICreateSchedulePeriod[];
}

export interface ICreateSchedulePeriod {
  periodNumber: number;
  subjectId?: string; // Optional for break periods
  teacherId?: string; // Optional for break periods
  roomNumber?: string;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
  breakType?: "short" | "lunch" | "long";
  breakDuration?: number;
}

export interface IUpdateScheduleRequest {
  periods?: ICreateSchedulePeriod[];
  isActive?: boolean;
}

export interface IScheduleResponse {
  id: string;
  schoolId: string;
  classId: string;
  grade: number;
  section: string;
  className: string;
  academicYear: string;
  dayOfWeek: string;
  periods: ISchedulePeriodResponse[];
  isActive: boolean;
  totalPeriods: number;
  createdAt: Date;
  updatedAt: Date;
  school?: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    name: string;
    grade: number;
    section: string;
  };
}

export interface ISchedulePeriodResponse {
  periodNumber: number;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  isBreak: boolean;
  breakType?: string;
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
  roomNumber?: string;
}

export interface IWeeklySchedule {
  classInfo: {
    grade: number;
    section: string;
    className: string;
  };
  academicYear: string;
  schedule: {
    [key: string]: ISchedulePeriodResponse[]; // monday, tuesday, etc.
  };
  teachers: Array<{
    id: string;
    name: string;
    subjects: string[];
    totalPeriods: number;
  }>;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    totalPeriods: number;
    teachers: string[];
  }>;
  stats: {
    totalPeriodsPerWeek: number;
    classPeriods: number;
    breakPeriods: number;
    uniqueTeachers: number;
    uniqueSubjects: number;
  };
}

export interface ITeacherWorkload {
  teacherId: string;
  teacherName: string;
  totalPeriods: number;
  periodsPerDay: {
    sunday: number;
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
  };
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    periods: number;
    classes: Array<{
      grade: number;
      section: string;
      periods: number;
    }>;
  }>;
  timeSlots: Array<{
    dayOfWeek: string;
    periodNumber: number;
    startTime: string;
    endTime: string;
    subject: string;
    class: string;
    roomNumber?: string;
  }>;
}

export interface IScheduleStats {
  totalSchedules: number;
  activeSchedules: number;
  byGrade: Array<{
    grade: number;
    scheduleCount: number;
    sectionsCount: number;
  }>;
  byDayOfWeek: Array<{
    dayOfWeek: string;
    scheduleCount: number;
  }>;
  teacherUtilization: Array<{
    teacherId: string;
    teacherName: string;
    totalPeriods: number;
    utilizationPercentage: number;
  }>;
  subjectDistribution: Array<{
    subjectId: string;
    subjectName: string;
    totalPeriods: number;
    classesCount: number;
  }>;
}

export interface IScheduleFilters {
  schoolId?: string;
  grade?: number;
  section?: string;
  dayOfWeek?: string;
  teacherId?: string;
  subjectId?: string;
  academicYear?: string;
  isActive?: boolean;
}

export interface ITimeSlot {
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  breakType?: "short" | "lunch" | "long";
}

export interface ISchoolTimeTable {
  schoolId: string;
  schoolName: string;
  periods: ITimeSlot[];
  workingDays: string[];
  academicYear: string;
  isActive: boolean;
}
