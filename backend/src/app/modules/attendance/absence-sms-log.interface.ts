import { Document, Model, Types } from 'mongoose';

export type AbsenceSmsStatus = 'pending' | 'sent' | 'failed';

export interface IAbsenceSmsLog {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  studentId: Types.ObjectId;
  parentId?: Types.ObjectId;
  parentUserId?: Types.ObjectId;
  dateKey: string; // YYYY-MM-DD
  message: string;
  status: AbsenceSmsStatus;
  providerMessageId?: string;
  errorMessage?: string;
  attempts: number;
  lastAttemptAt: Date;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAbsenceSmsLogDocument extends IAbsenceSmsLog, Document {
  _id: Types.ObjectId;
}

export interface IAbsenceSmsLogModel extends Model<IAbsenceSmsLogDocument> {}
