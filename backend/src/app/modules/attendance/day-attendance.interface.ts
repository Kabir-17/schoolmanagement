import { Document, Model, Types } from 'mongoose';

export type DayAttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'pending';

export interface IAttendanceHistoryEntry {
  status: DayAttendanceStatus;
  source: 'auto' | 'teacher' | 'finalizer';
  markedAt: Date;
  metadata?: Record<string, any>;
}

export interface IStudentDayAttendance {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  studentCode: string;
  date: Date;
  dateKey: string;
  autoStatus?: DayAttendanceStatus;
  autoMarkedAt?: Date;
  autoEventId?: string;
  teacherStatus?: DayAttendanceStatus;
  teacherMarkedAt?: Date;
  teacherMarkedBy?: Types.ObjectId;
  teacherOverride: boolean;
  finalStatus: DayAttendanceStatus;
  finalSource: 'auto' | 'teacher' | 'finalizer';
  finalized: boolean;
  finalizedAt?: Date;
  history: IAttendanceHistoryEntry[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStudentDayAttendanceDocument extends IStudentDayAttendance, Document {}

export interface DayAttendanceAutoParams {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  studentCode: string;
  eventId: string;
  capturedAt: Date;
  dateKey: string;
}

export interface DayAttendanceTeacherParams {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  studentCode?: string;
  teacherId: Types.ObjectId;
  status: DayAttendanceStatus;
  date: Date;
  dateKey: string;
  timezone?: string;
}

export interface IStudentDayAttendanceModel
  extends Model<IStudentDayAttendanceDocument> {
  markFromAuto(params: DayAttendanceAutoParams): Promise<IStudentDayAttendanceDocument | null>;
  markFromTeacher(params: DayAttendanceTeacherParams): Promise<IStudentDayAttendanceDocument>;
  finalizeForDate(
    schoolId: Types.ObjectId,
    date: Date,
    dateKey: string,
    finalizeTime: string,
    timezone?: string
  ): Promise<void>;
  getStatusMap(
    schoolId: Types.ObjectId,
    dateKeys: string[]
  ): Promise<Map<string, IStudentDayAttendanceDocument>>;
}
