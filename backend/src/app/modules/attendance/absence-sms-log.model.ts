import { Schema, model } from 'mongoose';
import {
  IAbsenceSmsLogDocument,
  IAbsenceSmsLogModel,
} from './absence-sms-log.interface';

const absenceSmsLogSchema = new Schema<IAbsenceSmsLogDocument, IAbsenceSmsLogModel>({
  schoolId: {
    type: Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true,
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true,
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true,
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Parent',
  },
  parentUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  dateKey: {
    type: String,
    required: true,
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
    index: true,
  },
  providerMessageId: {
    type: String,
  },
  errorMessage: {
    type: String,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  lastAttemptAt: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
  versionKey: false,
});

absenceSmsLogSchema.index(
  { studentId: 1, parentUserId: 1, dateKey: 1 },
  { unique: true, sparse: true }
);

export const AbsenceSmsLog = model<IAbsenceSmsLogDocument, IAbsenceSmsLogModel>(
  'AbsenceSmsLog',
  absenceSmsLogSchema
);
