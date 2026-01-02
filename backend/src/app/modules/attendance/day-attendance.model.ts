import { Schema, model, Types } from 'mongoose';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import config from '../../config';
import {
  DayAttendanceAutoParams,
  DayAttendanceTeacherParams,
  DayAttendanceStatus,
  IStudentDayAttendanceDocument,
  IStudentDayAttendanceModel,
} from './day-attendance.interface';
import { Student } from '../student/student.model';

const STATUSES: DayAttendanceStatus[] = ['present', 'absent', 'late', 'excused', 'pending'];

const historySchema = new Schema(
  {
    status: {
      type: String,
      enum: STATUSES,
      required: true,
    },
    source: {
      type: String,
      enum: ['auto', 'teacher', 'finalizer'],
      required: true,
    },
    markedAt: {
      type: Date,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const studentDayAttendanceSchema = new Schema<IStudentDayAttendanceDocument, IStudentDayAttendanceModel>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    studentCode: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    autoStatus: {
      type: String,
      enum: STATUSES,
    },
    autoMarkedAt: {
      type: Date,
    },
    autoEventId: {
      type: String,
    },
    teacherStatus: {
      type: String,
      enum: STATUSES,
    },
    teacherMarkedAt: {
      type: Date,
    },
    teacherMarkedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    teacherOverride: {
      type: Boolean,
      default: false,
    },
    finalStatus: {
      type: String,
      enum: STATUSES,
      default: 'pending',
      index: true,
    },
    finalSource: {
      type: String,
      enum: ['auto', 'teacher', 'finalizer'],
      default: 'auto',
    },
    finalized: {
      type: Boolean,
      default: false,
      index: true,
    },
    finalizedAt: {
      type: Date,
    },
    history: {
      type: [historySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ✅ FIX: Add compound index for performance optimization
// This index is used for queries like: find({ schoolId, dateKey, studentId: { $in: [...] } })
studentDayAttendanceSchema.index({
  schoolId: 1,
  dateKey: 1,
  studentId: 1
});

function normaliseDateKey(
  date: Date | string,
  timezone: string = config.school_timezone || 'UTC'
): { date: Date; dateKey: string } {
  const raw = typeof date === 'string' ? new Date(date) : new Date(date.getTime());

  if (Number.isNaN(raw.getTime())) {
    throw new Error('Cannot normalise invalid date');
  }

  const dateKey = formatInTimeZone(raw, timezone, 'yyyy-MM-dd');
  const utcStartOfDay = fromZonedTime(`${dateKey}T00:00:00`, timezone);
  return { date: utcStartOfDay, dateKey };
}

studentDayAttendanceSchema.statics.markFromAuto = async function (
  params: DayAttendanceAutoParams
) {
  const { schoolId, studentId, eventId, capturedAt, dateKey } = params;

  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const historyEntry = {
    status: 'present' as DayAttendanceStatus,
    source: 'auto' as const,
    markedAt: capturedAt,
    metadata: { eventId },
  };

  const existing = await this.findOne({ schoolId, studentId, dateKey });
  if (!existing) {
    return this.create({
      schoolId,
      studentId,
      studentCode: params.studentCode,
      date,
      dateKey,
      autoStatus: 'present',
      autoMarkedAt: capturedAt,
      autoEventId: eventId,
      teacherOverride: false,
      finalStatus: 'present',
      finalSource: 'auto',
      finalized: false,
      history: [historyEntry],
    });
  }

  existing.autoStatus = 'present';
  existing.autoMarkedAt = capturedAt;
  existing.autoEventId = eventId;
  if (!existing.studentCode) {
    existing.studentCode = params.studentCode;
  }
  existing.history.push(historyEntry);

  if (!existing.teacherOverride) {
    existing.finalStatus = 'present';
    existing.finalSource = 'auto';
    existing.finalized = false;
    existing.finalizedAt = undefined;
  } else {
    // ✅ FIX: Log that we received a camera event but teacher already overrode
    console.warn(
      `[StudentDayAttendance] Ignoring auto-attend event for student ${params.studentCode} ` +
      `on ${dateKey} - teacher override already in place ` +
      `(teacher: ${existing.teacherStatus}, auto: present)`
    );
  }

  await existing.save();
  return existing;
};

studentDayAttendanceSchema.statics.markFromTeacher = async function (
  params: DayAttendanceTeacherParams
) {
  const { schoolId, studentId, teacherId, status, date, dateKey } = params;
  const timezone = params.timezone || config.school_timezone || 'UTC';
  const { date: normalizedDate, dateKey: normalizedKey } = normaliseDateKey(date, timezone);
  const effectiveKey = dateKey || normalizedKey;
  const matchingDate = dateKey ? fromZonedTime(`${dateKey}T00:00:00`, timezone) : normalizedDate;

  const historyEntry = {
    status,
    source: 'teacher' as const,
    markedAt: new Date(),
    metadata: { teacherId },
  };

  const doc = await this.findOne({ schoolId, studentId, dateKey: effectiveKey });
  if (!doc) {
    return this.create({
      schoolId,
      studentId,
      studentCode: params.studentCode || '',
      date: matchingDate,
      dateKey: effectiveKey,
      teacherStatus: status,
      teacherMarkedAt: new Date(),
      teacherMarkedBy: teacherId,
      teacherOverride: true,
      finalStatus: status,
      finalSource: 'teacher',
      finalized: false,
      history: [historyEntry],
    });
  }

  if (params.studentCode && !doc.studentCode) {
    doc.studentCode = params.studentCode;
  }
  doc.teacherStatus = status;
  doc.teacherMarkedAt = new Date();
  doc.teacherMarkedBy = teacherId;
  doc.teacherOverride = true;
  doc.finalStatus = status;
  doc.finalSource = 'teacher';
  doc.finalized = false;
  doc.finalizedAt = undefined;
  doc.history.push(historyEntry);

  await doc.save();
  return doc;
};

studentDayAttendanceSchema.statics.finalizeForDate = async function (
  schoolId: Types.ObjectId,
  date: Date,
  dateKey: string,
  finalizeTime: string,
  timezone: string = config.school_timezone || 'UTC'
) {
  const now = new Date();

  const fallbackFinalize = config.auto_attend_finalization_time || '17:00';
  const timeString = finalizeTime || fallbackFinalize;
  let finalizationMoment = fromZonedTime(`${dateKey}T00:00:00`, timezone);
  if (timeString.includes(':')) {
    const [hourStr, minuteStr] = timeString.split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);

    if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
      finalizationMoment = fromZonedTime(
        `${dateKey}T${hourStr.padStart(2, '0')}:${minuteStr.padStart(2, '0')}:00`,
        timezone
      );
    }
  }

  if (now < finalizationMoment) {
    return;
  }

  // ✅ FIX: Check if any records need finalization (early return optimization)
  const needsFinalization = await this.countDocuments({
    schoolId,
    dateKey,
    finalized: { $ne: true },
  });

  if (needsFinalization === 0) {
    // All records already finalized, no work needed
    return;
  }

  const existingRecords = await this.find({ schoolId, dateKey }).select('studentId teacherOverride finalStatus');
  const existingMap = new Map<string, Types.ObjectId>();
  existingRecords.forEach((record) => existingMap.set(record.studentId.toString(), record.studentId));

  const students = await Student.find({ schoolId, isActive: true }).select('_id studentId');
  const nowIso = now;

  const bulkInserts: any[] = [];
  students.forEach((student) => {
    if (!existingMap.has(student._id.toString())) {
      bulkInserts.push({
        schoolId,
        studentId: student._id,
        studentCode: student.studentId,
        date,
        dateKey,
        teacherOverride: false,
        autoStatus: 'pending',
        finalStatus: 'absent',
        finalSource: 'finalizer',
        finalized: true,
        finalizedAt: nowIso,
        history: [
          {
            status: 'absent',
            source: 'finalizer',
            markedAt: nowIso,
          },
        ],
      });
    }
  });

  if (bulkInserts.length > 0) {
    await this.insertMany(bulkInserts, { ordered: false });
    // ✅ FIX: Log newly created absent records
    console.log(
      `[StudentDayAttendance] Created ${bulkInserts.length} new absent records ` +
      `for ${dateKey} (school: ${schoolId})`
    );
  }

  const updateResult = await this.updateMany(
    {
      schoolId,
      dateKey,
      teacherOverride: { $ne: true },
      finalized: { $ne: true },
      finalStatus: { $nin: ['present', 'late', 'excused'] },
    },
    {
      $set: {
        finalStatus: 'absent',
        finalSource: 'finalizer',
        finalized: true,
        finalizedAt: nowIso,
      },
      $push: {
        history: {
          status: 'absent',
          source: 'finalizer',
          markedAt: nowIso,
        },
      },
    }
  );

  // ✅ FIX: Log finalization audit trail
  if (updateResult.modifiedCount > 0) {
    console.log(
      `[StudentDayAttendance] Finalized ${updateResult.modifiedCount} students ` +
      `as absent for ${dateKey} (school: ${schoolId})`
    );
  }
};

studentDayAttendanceSchema.statics.getStatusMap = async function (
  schoolId: Types.ObjectId,
  dateKeys: string[]
) {
  if (!dateKeys.length) {
    return new Map();
  }

  const docs = await this.find({ schoolId, dateKey: { $in: dateKeys } });
  const map = new Map<string, IStudentDayAttendanceDocument>();
  docs.forEach((doc) => {
    map.set(`${doc.studentId.toString()}-${doc.dateKey}`, doc);
    if (doc.studentCode) {
      map.set(`${doc.studentCode}-${doc.dateKey}`, doc);
    }
  });
  return map;
};

export const StudentDayAttendance = model<IStudentDayAttendanceDocument, IStudentDayAttendanceModel>(
  'StudentDayAttendance',
  studentDayAttendanceSchema
);

export { normaliseDateKey };
