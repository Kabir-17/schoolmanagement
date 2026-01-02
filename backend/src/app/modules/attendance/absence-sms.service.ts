import { formatInTimeZone } from 'date-fns-tz';
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import config from '../../config';
import { AppError } from '../../errors/AppError';
import { Class } from '../class/class.model';
import { Student } from '../student/student.model';
import { Parent } from '../parent/parent.model';
import { School } from '../school/school.model';
import { AbsenceSmsLog } from './absence-sms-log.model';
import { StudentDayAttendance } from './day-attendance.model';
import { orangeSmsService } from '../orange-sms/orange-sms.service';
import { isHolidayForClassOnDate } from './holiday-utils';

interface TimeContext {
  dateKey: string;
  timeString: string;
  timezone: string;
}

class AttendanceAbsenceSmsService {
  private processing = false;
  private schoolNameCache = new Map<string, string>();

  async runScheduledDispatch(now: Date = new Date()): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      const classes = await Class.find({
        isActive: true,
        'absenceSmsSettings.enabled': true,
      })
        .select('grade section schoolId className absenceSmsSettings')
        .lean();

      if (!classes.length) {
        return;
      }

      const schoolIds = Array.from(
        new Set(classes.map((classDoc) => classDoc.schoolId.toString()))
      );

      const schools = await School.find({ _id: { $in: schoolIds } })
        .select('_id name settings.timezone')
        .lean();

      const timezoneMap = new Map<string, string>();
      schools.forEach((schoolDoc) => {
        const key = schoolDoc._id.toString();
        const tz = schoolDoc.settings?.timezone || config.school_timezone || 'UTC';
        timezoneMap.set(key, tz);

        if (schoolDoc.name) {
          this.schoolNameCache.set(key, schoolDoc.name);
        }
      });

      for (const classDoc of classes) {
        const schoolId = classDoc.schoolId.toString();
        const sendAfter =
          classDoc.absenceSmsSettings?.sendAfterTime || '11:00';
        const timezone = timezoneMap.get(schoolId) || config.school_timezone || 'UTC';
        const context = this.getTimeContext(now, timezone);

        if (!this.isTimeReached(sendAfter, context.timeString)) {
          continue;
        }

        const isHoliday = await isHolidayForClassOnDate({
          schoolId: classDoc.schoolId,
          dateKey: context.dateKey,
          timezone: context.timezone,
          grade: classDoc.grade,
          section: classDoc.section,
        });

        if (isHoliday) {
          continue;
        }

        await this.processClass(classDoc, context);
      }
    } finally {
      this.processing = false;
    }
  }

  private getTimeContext(now: Date, timezone: string): TimeContext {
    return {
      dateKey: formatInTimeZone(now, timezone, 'yyyy-MM-dd'),
      timeString: formatInTimeZone(now, timezone, 'HH:mm'),
      timezone,
    };
  }

  private isTimeReached(threshold: string, current: string): boolean {
    return this.timeToMinutes(current) >= this.timeToMinutes(threshold);
  }

  private timeToMinutes(time: string): number {
    const [hour, minute] = time.split(':').map((value) => parseInt(value, 10));
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return 0;
    }
    return hour * 60 + minute;
  }

  private async processClass(classDoc: any, context: TimeContext): Promise<void> {
    const studentDocs = await Student.find({
      schoolId: classDoc.schoolId,
      grade: classDoc.grade,
      section: classDoc.section,
      isActive: true,
    })
      .populate('userId', 'firstName lastName')
      .select('_id userId grade section schoolId studentId')
      .exec();

    if (!studentDocs.length) {
      return;
    }

    const studentIds = studentDocs.map((student) => student._id);
    const attendanceRecords = await StudentDayAttendance.find({
      schoolId: classDoc.schoolId,
      studentId: { $in: studentIds },
      dateKey: context.dateKey,
      finalStatus: 'absent',
      teacherStatus: 'absent',
      autoStatus: { $ne: 'present' },
    })
      .select('studentId')
      .lean();

    if (!attendanceRecords.length) {
      return;
    }

    const studentMap = new Map<string, typeof studentDocs[number]>();
    studentDocs.forEach((student) => {
      studentMap.set(student._id.toString(), student);
    });

    const parents = await Parent.find({
      schoolId: classDoc.schoolId,
      isActive: true,
      children: { $in: studentIds },
      'preferences.receiveAttendanceAlerts': true,
    })
      .populate('userId', 'firstName lastName phone')
      .select('children preferences userId')
      .exec();

    if (!parents.length) {
      return;
    }

    const parentUserIds = new Set<string>();
    const parentsByStudent = new Map<string, typeof parents>();

    parents.forEach((parentDoc) => {
      const parentUser: any = parentDoc.userId;
      const parentUserId = parentUser?._id?.toString();
      if (parentUserId) {
        parentUserIds.add(parentUserId);
      }

      parentDoc.children.forEach((childId) => {
        const key = childId.toString();
        if (!parentsByStudent.has(key)) {
          parentsByStudent.set(key, []);
        }
        parentsByStudent.get(key)!.push(parentDoc);
      });
    });

    if (!parentUserIds.size) {
      return;
    }

    const logDocs = await AbsenceSmsLog.find({
      studentId: { $in: studentIds },
      parentUserId: { $in: Array.from(parentUserIds).map((id) => new Types.ObjectId(id)) },
      dateKey: context.dateKey,
    })
      .select('studentId parentUserId status')
      .lean();

    const logMap = new Map<string, string>();
    logDocs.forEach((log) => {
      if (log.parentUserId) {
        const key = `${log.studentId.toString()}-${log.parentUserId.toString()}`;
        logMap.set(key, log.status);
      }
    });

    const schoolName = await this.getSchoolName(classDoc.schoolId.toString());

    for (const record of attendanceRecords) {
      const studentId = record.studentId.toString();
      const student = studentMap.get(studentId);
      if (!student) {
        continue;
      }

      const parentList = parentsByStudent.get(studentId);
      if (!parentList?.length) {
        console.info(
          `[AbsenceSMS] Skipping student ${studentId} on ${context.dateKey} - no active parents with attendance alerts`
        );
        continue;
      }

      for (const parent of parentList) {
        const parentUser: any = parent.userId;
        const parentUserId = parentUser?._id;
        if (!parentUserId) {
          console.warn(
            `[AbsenceSMS] Parent document missing user reference for student ${studentId}; skipping`
          );
          continue;
        }

        const logKey = `${studentId}-${parentUserId.toString()}`;
        if (logMap.get(logKey) === 'sent') {
          continue;
        }

        if (!this.canNotifyParent(parent)) {
          console.info(
            `[AbsenceSMS] Parent ${parentUserId.toString()} opted out of attendance SMS; skipping`
          );
          continue;
        }

        const phoneNumber = parentUser.phone;
        if (!phoneNumber) {
          console.warn(
            `[AbsenceSMS] Parent ${parentUserId.toString()} has no phone number on record; skipping`
          );
          continue;
        }

        const message = this.buildMessage({
          student,
          schoolName,
        });

        let sendStatus: 'sent' | 'failed' = 'failed';
        let resourceId: string | undefined;
        let errorMessage: string | undefined;

        try {
          const result = await orangeSmsService.sendSms({
            phoneNumber,
            message,
          });
          sendStatus = result.status;
          resourceId = result.resourceId;
          errorMessage = result.error;
        } catch (error) {
          if (error instanceof AppError) {
            throw error;
          }
          errorMessage = (error as Error).message;
        }

        await AbsenceSmsLog.findOneAndUpdate(
          {
            studentId: student._id,
            parentUserId,
            dateKey: context.dateKey,
          },
          {
            $set: {
              schoolId: student.schoolId,
              classId: classDoc._id,
              parentId: (parent as any)._id,
              message,
              status: sendStatus,
              providerMessageId: resourceId,
              errorMessage,
              lastAttemptAt: new Date(),
            },
            $inc: {
              attempts: 1,
            },
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          }
        ).exec();

        logMap.set(logKey, sendStatus);

        const studentUser: any = student.userId;
        const studentName = [studentUser?.firstName, studentUser?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || student.studentId;

        if (sendStatus === "sent") {
          console.log(
            `[AbsenceSMS] Sent absence alert to ${normalizedRecipientLog(phoneNumber)} for ${studentName} (studentId: ${student.studentId}) on ${context.dateKey}`
          );
        } else {
          console.warn(
            `[AbsenceSMS] Failed to send absence alert to ${normalizedRecipientLog(phoneNumber)} for ${studentName} (studentId: ${student.studentId}) - ${errorMessage ?? "unknown error"}`
          );
        }
      }
    }
  }

  private async getSchoolName(schoolId: string): Promise<string> {
    if (this.schoolNameCache.has(schoolId)) {
      return this.schoolNameCache.get(schoolId)!;
    }

    const school = await School.findById(schoolId).select('name').lean();
    const schoolName = school?.name || 'Votre école';
    this.schoolNameCache.set(schoolId, schoolName);
    return schoolName;
  }

  private canNotifyParent(parent: any): boolean {
    const preferences = parent.preferences || {};
    if (preferences.receiveAttendanceAlerts === false) {
      return false;
    }

    const method = preferences.communicationMethod || 'All';
    return method === 'All' || method === 'SMS';
  }

  private buildMessage({
    student,
    schoolName,
  }: {
    student: any;
    schoolName: string;
  }): string {
    const studentUser: any = student.userId;
    const studentName = [studentUser?.firstName, studentUser?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || 'votre enfant';

    return composeAbsenceMessage(studentName, schoolName);
  }
}

export const attendanceAbsenceSmsService = new AttendanceAbsenceSmsService();

function normalizedRecipientLog(phone: string): string {
  if (!phone) {
    return "<no-phone>";
  }
  return phone.replace(/\s+/g, "");
}

const composeAbsenceMessage = (studentName: string, schoolName: string) =>
  `Madame / Monsieur,
Votre enfant ${studentName} a été absent(e) aujourd’hui.
Merci de contacter l’école pour la justification.
Cordialement,
Direction ${schoolName}`;

type SmsLogStatus = 'pending' | 'sent' | 'failed';

interface ListAbsenceSmsLogsOptions {
  schoolId: string;
  status?: SmsLogStatus;
  date?: string;
  page?: number;
  limit?: number;
  messageQuery?: string;
}

export async function listAbsenceSmsLogs(options: ListAbsenceSmsLogsOptions) {
  const {
    schoolId,
    status,
    date,
    page = 1,
    limit = 20,
    messageQuery,
  } = options;

  let schoolObjectId: Types.ObjectId;
  try {
    schoolObjectId = new Types.ObjectId(schoolId);
  } catch {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid school ID');
  }

  const filter: Record<string, unknown> = {
    schoolId: schoolObjectId,
  };

  if (status) {
    filter.status = status;
  }

  if (date) {
    filter.dateKey = date;
  }

  if (messageQuery) {
    filter.message = { $regex: messageQuery, $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AbsenceSmsLog.find(filter)
      .sort({ lastAttemptAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'studentId',
        select: 'studentId grade section userId',
        populate: {
          path: 'userId',
          select: 'firstName lastName',
        },
      })
      .populate({
        path: 'parentUserId',
        select: 'firstName lastName phone',
      })
      .populate({
        path: 'parentId',
        select: 'parentId relationship',
      })
      .populate({
        path: 'classId',
        select: 'grade section className',
      })
      .lean(),
    AbsenceSmsLog.countDocuments(filter),
  ]);

  return {
    data: logs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getAbsenceSmsOverview(
  schoolId: string,
  date?: string
) {
  let schoolObjectId: Types.ObjectId;
  try {
    schoolObjectId = new Types.ObjectId(schoolId);
  } catch {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid school ID');
  }

  const schoolDoc = await School.findById(schoolObjectId)
    .select('_id name settings.timezone')
    .lean();

  const timezone = schoolDoc?.settings?.timezone || config.school_timezone || 'UTC';
  const now = new Date();
  const currentTime = formatInTimeZone(now, timezone, 'HH:mm');
  const currentMinutes = timeStringToMinutes(currentTime);
  const targetDateKey = date || formatInTimeZone(now, timezone, 'yyyy-MM-dd');

  const rawClasses = await Class.find({
    schoolId: schoolObjectId,
    isActive: true,
    'absenceSmsSettings.enabled': true,
  })
    .select('grade section className absenceSmsSettings')
    .lean();

  const holidayStatuses = await Promise.all(
    rawClasses.map(async (cls) => ({
      id: cls._id.toString(),
      isHoliday: await isHolidayForClassOnDate({
        schoolId: schoolObjectId,
        dateKey: targetDateKey,
        timezone,
        grade: cls.grade,
        section: cls.section,
      }),
    }))
  );

  const holidayMap = new Map<string, boolean>(
    holidayStatuses.map((item) => [item.id, item.isHoliday])
  );

  const classes = rawClasses.filter(
    (cls) => !holidayMap.get(cls._id.toString())
  );

  if (!classes.length) {
    return {
      dateKey: targetDateKey,
      timezone,
      currentTime,
      nextDispatchCheck: computeNextDispatchTime(now, timezone),
      totals: {
        pendingBeforeCutoff: 0,
        pendingAfterCutoff: 0,
        sentToday: 0,
        failedToday: 0,
      },
      classes: [],
      pending: [],
    };
  }

  const gradeSet = new Set<number>(classes.map((cls) => cls.grade));
  const sectionSet = new Set<string>(
    classes
      .map((cls) => cls.section)
      .filter((section): section is string => Boolean(section))
  );

  const studentQuery: any = {
    schoolId: schoolObjectId,
    isActive: true,
  };

  if (gradeSet.size) {
    studentQuery.grade = { $in: Array.from(gradeSet) };
  }

  if (sectionSet.size) {
    studentQuery.section = { $in: Array.from(sectionSet) };
  }

  const students = await Student.find(studentQuery)
    .select('_id grade section studentId userId')
    .populate('userId', 'firstName lastName')
    .lean();

  const studentsByClass = new Map<string, typeof students>();
  students.forEach((student) => {
    const key = `${student.grade}-${(student.section || '').toUpperCase()}`;
    if (!studentsByClass.has(key)) {
      studentsByClass.set(key, []);
    }
    studentsByClass.get(key)!.push(student);
  });

  const allStudentIds = students.map((student) => student._id);

  const attendanceRecords = await StudentDayAttendance.find({
    schoolId: schoolObjectId,
    studentId: { $in: allStudentIds },
    dateKey: targetDateKey,
  })
    .select('studentId teacherStatus finalStatus dateKey')
    .lean();

  const smsLogs = await AbsenceSmsLog.find({
    schoolId: schoolObjectId,
    dateKey: targetDateKey,
  })
    .populate({
      path: 'studentId',
      select: 'studentId grade section userId',
      populate: {
        path: 'userId',
        select: 'firstName lastName',
      },
    })
    .populate({ path: 'parentUserId', select: 'firstName lastName phone' })
    .populate({ path: 'parentId', select: 'parentId relationship' })
    .lean();

  const logsByStudent = new Map<string, typeof smsLogs>();
  smsLogs.forEach((log) => {
    const studentId = (log.studentId as any)?._id?.toString?.() || log.studentId?.toString?.();
    if (studentId) {
      if (!logsByStudent.has(studentId)) {
        logsByStudent.set(studentId, []);
      }
      logsByStudent.get(studentId)!.push(log);
    }
  });

  let totalPendingBefore = 0;
  let totalPendingAfter = 0;
  let totalSent = 0;
  let totalFailed = 0;

  const pendingSummaries: Array<{
    classKey: string;
    className: string;
    grade: number;
    section: string;
    sendAfterTime: string;
    pendingBeforeCutoff: number;
    pendingAfterCutoff: number;
    sentCount: number;
    failedCount: number;
  }> = [];

  const classesSummary = classes.map((cls) => {
    const classKey = `${cls.grade}-${(cls.section || '').toUpperCase()}`;
    const classStudents = studentsByClass.get(classKey) || [];
    const studentIdSet = new Set(
      classStudents.map((student) => student._id.toString())
    );

    const classAttendance = attendanceRecords.filter((record) =>
      studentIdSet.has(record.studentId.toString())
    );

    const absentRecords = classAttendance.filter(
      (record) => record.teacherStatus === 'absent' && record.finalStatus === 'absent'
    );

    const sendAfterTime = cls.absenceSmsSettings?.sendAfterTime || '11:00';
    const sendAfterMinutes = timeStringToMinutes(sendAfterTime);

    let pendingBeforeCutoff = 0;
    let pendingAfterCutoff = 0;
    let sentCount = 0;
    let failedCount = 0;

    const classLogs: Array<typeof smsLogs[number]> = [];

    classStudents.forEach((student) => {
      const studentLogs = logsByStudent.get(student._id.toString()) || [];
      if (studentLogs.length) {
        classLogs.push(...studentLogs);
      }
    });

    classLogs.forEach((log) => {
      if (log.status === 'sent') {
        sentCount += 1;
      } else if (log.status === 'failed') {
        failedCount += 1;
      }
    });

    absentRecords.forEach((record) => {
      const studentLogs = logsByStudent.get(record.studentId.toString()) || [];
      const hasSuccessfulLog = studentLogs.some((log) => log.status === 'sent');
      const hasAttempt = studentLogs.length > 0;

      if (hasSuccessfulLog) {
        return;
      }

      if (currentMinutes >= sendAfterMinutes) {
        pendingAfterCutoff += 1;
      } else if (!hasAttempt) {
        pendingBeforeCutoff += 1;
      }
    });

    totalPendingBefore += pendingBeforeCutoff;
    totalPendingAfter += pendingAfterCutoff;
    totalSent += sentCount;
    totalFailed += failedCount;

    if (pendingBeforeCutoff || pendingAfterCutoff) {
      pendingSummaries.push({
        classKey,
        className: cls.className || `Grade ${cls.grade} - Section ${cls.section}`,
        grade: cls.grade,
        section: cls.section,
        sendAfterTime,
        pendingBeforeCutoff,
        pendingAfterCutoff,
        sentCount,
        failedCount,
      });
    }

    return {
      classKey,
      grade: cls.grade,
      section: cls.section,
      className: cls.className || `Grade ${cls.grade} - Section ${cls.section}`,
      sendAfterTime,
      pendingBeforeCutoff,
      pendingAfterCutoff,
      sentCount,
      failedCount,
      totalAbsent: absentRecords.length,
    };
  });

  return {
    dateKey: targetDateKey,
    timezone,
    currentTime,
    nextDispatchCheck: computeNextDispatchTime(now, timezone),
    totals: {
      pendingBeforeCutoff: totalPendingBefore,
      pendingAfterCutoff: totalPendingAfter,
      sentToday: totalSent,
      failedToday: totalFailed,
    },
    classes: classesSummary,
    pending: pendingSummaries.sort((a, b) => timeStringToMinutes(a.sendAfterTime) - timeStringToMinutes(b.sendAfterTime)),
  };
}

export async function triggerAbsenceSmsRun() {
  await attendanceAbsenceSmsService.runScheduledDispatch();
  return {
    triggeredAt: new Date().toISOString(),
  };
}

export async function sendAbsenceSmsTest(params: {
  phoneNumber: string;
  studentName?: string;
  schoolName?: string;
  message?: string;
  senderName?: string;
}) {
  const {
    phoneNumber,
    studentName = 'votre enfant',
    schoolName = 'Votre école',
    message,
    senderName,
  } = params;

  const smsMessage = message ?? composeAbsenceMessage(studentName, schoolName);

  const result = await orangeSmsService.sendSms({
    phoneNumber,
    message: smsMessage,
    senderNameOverride: senderName,
  });

  return {
    status: result.status,
    resourceId: result.resourceId,
    error: result.error,
  };
}

function timeStringToMinutes(time: string): number {
  const [hourStr, minuteStr] = time.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return 0;
  }
  return hour * 60 + minute;
}

function getDispatchIntervalMinutes(): number {
  const candidate = Number(config.absence_sms_dispatch_interval_minutes);
  if (!Number.isFinite(candidate) || candidate <= 0) {
    return 5;
  }
  return Math.max(Math.floor(candidate), 1);
}

function computeNextDispatchTime(now: Date, timezone: string): string {
  const interval = getDispatchIntervalMinutes();
  const next = new Date(now.getTime());
  const remainder = next.getMinutes() % interval;
  const minutesToAdd = remainder === 0 ? interval : interval - remainder;
  next.setMinutes(next.getMinutes() + minutesToAdd, 0, 0);
  return formatInTimeZone(next, timezone, 'HH:mm');
}
