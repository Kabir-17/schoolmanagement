import { startSession, Types } from "mongoose";
import httpStatus from "http-status";
import { AppError } from "../../errors/AppError";
import { Schedule } from "./schedule.model";
import {
  ICreateScheduleRequest,
  ICreateSchedulePeriod,
  IUpdateScheduleRequest,
  IScheduleFilters,
  IWeeklySchedule,
  ITeacherWorkload,
  IScheduleStats,
  IScheduleDocument,
} from "./schedule.interface";
import { School } from "../school/school.model";
import { Subject } from "../subject/subject.model";
import { Teacher } from "../teacher/teacher.model";
import { Class } from "../class/class.model";

const VALID_DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type DayOfWeek = (typeof VALID_DAYS)[number];

const toMinutes = (time: string): number => {
  if (!time) {
    return NaN;
  }

  const [hour, minute] = time.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return NaN;
  }

  return hour * 60 + minute;
};

const intervalsOverlap = (
  startA: number,
  endA: number,
  startB: number,
  endB: number
) => startA < endB && startB < endA;

const normalizeSchedulePeriods = (
  periods: ICreateSchedulePeriod[]
): ICreateSchedulePeriod[] => {
  if (!periods || periods.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "At least one period is required"
    );
  }

  const normalized: ICreateSchedulePeriod[] = [];
  const timeSlots: Array<{ start: number; end: number; periodNumber: number }> =
    [];
  const teacherSlots = new Map<
    string,
    Array<{ start: number; end: number; periodNumber: number }>
  >();

  for (const period of periods) {
    const startMinutes = toMinutes(period.startTime);
    const endMinutes = toMinutes(period.endTime);

    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid start or end time for period ${period.periodNumber}`
      );
    }

    if (endMinutes <= startMinutes) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `End time must be after start time for period ${period.periodNumber}`
      );
    }

    for (const slot of timeSlots) {
      if (intervalsOverlap(startMinutes, endMinutes, slot.start, slot.end)) {
        throw new AppError(
          httpStatus.CONFLICT,
          `Period ${period.periodNumber} overlaps with period ${slot.periodNumber}`
        );
      }
    }

    timeSlots.push({
      start: startMinutes,
      end: endMinutes,
      periodNumber: period.periodNumber,
    });

    if (period.isBreak) {
      const breakType = period.breakType || "short";
      const duration = period.breakDuration ?? endMinutes - startMinutes;

      if (duration < 5 || duration > 60) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Break duration for period ${period.periodNumber} must be between 5 and 60 minutes`
        );
      }

      normalized.push({
        periodNumber: period.periodNumber,
        startTime: period.startTime,
        endTime: period.endTime,
        isBreak: true,
        breakType,
        breakDuration: duration,
      });

      continue;
    }

    if (!period.subjectId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Subject is required for period ${period.periodNumber}`
      );
    }

    if (!period.teacherId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Teacher is required for period ${period.periodNumber}`
      );
    }

    const teacherId = period.teacherId.toString();
    const teacherPeriodSlots =
      teacherSlots.get(teacherId) ?? [];

    for (const slot of teacherPeriodSlots) {
      if (intervalsOverlap(startMinutes, endMinutes, slot.start, slot.end)) {
        throw new AppError(
          httpStatus.CONFLICT,
          `Teacher is double-booked within this schedule (period ${period.periodNumber} overlaps with period ${slot.periodNumber})`
        );
      }
    }

    teacherPeriodSlots.push({
      start: startMinutes,
      end: endMinutes,
      periodNumber: period.periodNumber,
    });
    teacherSlots.set(teacherId, teacherPeriodSlots);

    normalized.push({
      periodNumber: period.periodNumber,
      subjectId: period.subjectId,
      teacherId: period.teacherId,
      roomNumber: period.roomNumber,
      startTime: period.startTime,
      endTime: period.endTime,
      isBreak: false,
    });
  }

  return normalized.sort((a, b) => a.periodNumber - b.periodNumber);
};

const createSchedule = async (
  scheduleData: ICreateScheduleRequest
): Promise<IScheduleDocument[]> => {
  const session = await startSession();

  try {
    session.startTransaction();

    if (!scheduleData.schoolId) {
      throw new AppError(httpStatus.BAD_REQUEST, "School ID is required");
    }

    let schoolObjectId: Types.ObjectId;
    try {
      schoolObjectId = new Types.ObjectId(scheduleData.schoolId);
    } catch {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid school ID format");
    }

    const gradeValue = Number(scheduleData.grade);
    if (Number.isNaN(gradeValue)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Grade must be a number");
    }

    const sectionValue = (scheduleData.section || "").toUpperCase();

    const normalizedPeriods = normalizeSchedulePeriods(scheduleData.periods);

    const school = await School.findById(schoolObjectId).session(session);

    if (!school) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        `School not found with ID: ${scheduleData.schoolId}`
      );
    }

    if (!school.isActive) {
      throw new AppError(httpStatus.BAD_REQUEST, "School is not active");
    }

    let classDoc = await Class.findOne({
      schoolId: scheduleData.schoolId,
      grade: gradeValue,
      section: sectionValue,
      academicYear: scheduleData.academicYear,
    }).session(session);

    if (!classDoc) {
      classDoc = new Class({
        schoolId: scheduleData.schoolId,
        grade: gradeValue,
        section: sectionValue,
        className: `Grade ${gradeValue} - Section ${sectionValue}`,
        academicYear: scheduleData.academicYear,
        maxStudents: school.settings?.maxStudentsPerSection || 40,
        isActive: true,
      });
      await classDoc.save({ session });
    }

    const subjectIds = normalizedPeriods
      .filter((period) => !period.isBreak && period.subjectId)
      .map((period) => period.subjectId as string);

    if (subjectIds.length > 0) {
      const subjects = await Subject.find({
        _id: { $in: subjectIds },
      }).session(session);

      if (subjects.length !== subjectIds.length) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          "One or more subjects not found"
        );
      }
    }

    const teacherIds = normalizedPeriods
      .filter((period) => !period.isBreak && period.teacherId)
      .map((period) => period.teacherId as string);

    const teacherNameLookup = new Map<string, string>();

    if (teacherIds.length > 0) {
      const teachers = await Teacher.find({ _id: { $in: teacherIds } })
        .populate("userId", "firstName lastName")
        .session(session);

      if (teachers.length !== teacherIds.length) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          "One or more teachers not found"
        );
      }

      teachers.forEach((teacher) => {
        const firstName = (teacher.userId as any)?.firstName || "";
        const lastName = (teacher.userId as any)?.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        teacherNameLookup.set(
          teacher._id.toString(),
          fullName || teacher.teacherId || "Selected teacher"
        );
      });
    }

    const requestedDaysRaw = [
      ...(scheduleData.applyToDays ?? []),
      scheduleData.dayOfWeek,
    ];

    const uniqueDays = Array.from(
      new Set(
        requestedDaysRaw
          .filter(Boolean)
          .map((day) => day.toLowerCase() as DayOfWeek)
      )
    );

    if (uniqueDays.length === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "At least one day of week must be specified"
      );
    }

    for (const day of uniqueDays) {
      if (!VALID_DAYS.includes(day)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Invalid day provided: ${day}`
        );
      }
    }

    const createdScheduleIds: Types.ObjectId[] = [];

    for (const day of uniqueDays) {
      const existingSchedule = await Schedule.findOne({
        schoolId: schoolObjectId,
        grade: gradeValue,
        section: sectionValue,
        dayOfWeek: day,
        academicYear: scheduleData.academicYear,
        isActive: true,
      }).session(session);

      if (existingSchedule) {
        throw new AppError(
          httpStatus.CONFLICT,
          `Schedule already exists for Grade ${gradeValue} Section ${sectionValue} on ${day}`
        );
      }

      for (const period of normalizedPeriods) {
        if (!period.isBreak && period.teacherId) {
          const hasConflict = await Schedule.checkTeacherConflict(
            period.teacherId.toString(),
            day,
            period.periodNumber,
            period.startTime,
            period.endTime
          );

          if (hasConflict) {
            const teacherName =
              teacherNameLookup.get(period.teacherId.toString()) ||
              "Selected teacher";
            const capitalisedDay =
              day.charAt(0).toUpperCase() + day.slice(1);
            throw new AppError(
              httpStatus.CONFLICT,
              `${teacherName} already has a class between ${period.startTime} and ${period.endTime} on ${capitalisedDay}`
            );
          }
        }
      }

      const schedulePayload = {
        schoolId: scheduleData.schoolId,
        classId: classDoc._id,
        grade: gradeValue,
        section: sectionValue,
        academicYear: scheduleData.academicYear,
        dayOfWeek: day,
        periods: normalizedPeriods.map((period) => ({
          ...period,
        })),
      };

      const newSchedule = new Schedule(schedulePayload);
      await newSchedule.save({ session });
      createdScheduleIds.push(newSchedule._id);
    }

    await session.commitTransaction();

    const schedules = await Schedule.find({
      _id: { $in: createdScheduleIds },
    })
      .populate("schoolId", "name")
      .populate("periods.subjectId", "name code")
      .populate({
        path: "periods.teacherId",
        select: "userId teacherId",
        populate: {
          path: "userId",
          select: "firstName lastName",
        },
      });

    const orderMap = new Map<string, number>();
    createdScheduleIds.forEach((id, index) =>
      orderMap.set(id.toString(), index)
    );

    schedules.sort(
      (a, b) =>
        (orderMap.get(a._id.toString()) ?? 0) -
        (orderMap.get(b._id.toString()) ?? 0)
    );

    return schedules;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const clearSchedulesForClass = async (
  schoolId: string | undefined,
  grade: number,
  section: string,
  dayOfWeek?: string
): Promise<number> => {
  if (!schoolId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "School ID is required to clear schedules"
    );
  }

  const gradeValue = Number(grade);
  if (Number.isNaN(gradeValue)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Grade must be a valid number"
    );
  }

  const normalizedSection = (section || "").toUpperCase();
  if (!normalizedSection) {
    throw new AppError(httpStatus.BAD_REQUEST, "Section is required");
  }

  const filter: Record<string, unknown> = {
    schoolId: new Types.ObjectId(schoolId),
    grade: gradeValue,
    section: normalizedSection,
  };

  if (dayOfWeek) {
    const normalizedDay = dayOfWeek.toLowerCase();
    if (!VALID_DAYS.includes(normalizedDay as DayOfWeek)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid dayOfWeek provided. Expected one of: ${VALID_DAYS.join(", ")}`
      );
    }
    filter.dayOfWeek = normalizedDay;
  }

  const result = await Schedule.deleteMany(filter);
  return result.deletedCount ?? 0;
};

const getAllSchedules = async (
  filters: IScheduleFilters,
  pagination: { page: number; limit: number }
) => {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const query: any = {};

  if (filters.schoolId) query.schoolId = filters.schoolId;
  if (filters.grade) query.grade = filters.grade;
  if (filters.section) query.section = filters.section;
  if (filters.dayOfWeek) query.dayOfWeek = filters.dayOfWeek;
  if (filters.academicYear) query.academicYear = filters.academicYear;
  if (filters.isActive !== undefined) query.isActive = filters.isActive;

  if (filters.teacherId) {
    query["periods.teacherId"] = filters.teacherId;
  }

  if (filters.subjectId) {
    query["periods.subjectId"] = filters.subjectId;
  }

  const [schedules, totalCount] = await Promise.all([
    Schedule.find(query)
      .populate("schoolId", "name")
      .populate("periods.subjectId", "name code")
      .populate({
        path: "periods.teacherId",
        select: "userId teacherId",
        populate: {
          path: "userId",
          select: "firstName lastName",
        },
      })
      .sort({ grade: 1, section: 1, dayOfWeek: 1 })
      .skip(skip)
      .limit(limit),
    Schedule.countDocuments(query),
  ]);

  return {
    schedules,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
  };
};

const getScheduleById = async (
  scheduleId: string
): Promise<IScheduleDocument> => {
  const schedule = await Schedule.findById(scheduleId)
    .populate("schoolId", "name")
    .populate("periods.subjectId", "name code")
    .populate({
      path: "periods.teacherId",
      select: "userId teacherId",
      populate: {
        path: "userId",
        select: "firstName lastName",
      },
    });

  if (!schedule) {
    throw new AppError(httpStatus.NOT_FOUND, "Schedule not found");
  }

  return schedule;
};

const updateSchedule = async (
  scheduleId: string,
  updateData: IUpdateScheduleRequest,
  userSchoolId?: string
): Promise<IScheduleDocument> => {
  const session = await startSession();

  try {
    session.startTransaction();

    // Build query to include school validation if userSchoolId provided
    const query: any = { _id: scheduleId };
    if (userSchoolId) {
      query.schoolId = userSchoolId;
    }

    const schedule = await Schedule.findOne(query).session(session);
    if (!schedule) {
      throw new AppError(httpStatus.NOT_FOUND, "Schedule not found or access denied");
    }

    if (updateData.periods) {
      const normalizedPeriods = normalizeSchedulePeriods(updateData.periods);

      const subjectIds = normalizedPeriods
        .filter((period) => !period.isBreak && period.subjectId)
        .map((period) => period.subjectId as string);

      if (subjectIds.length > 0) {
        const subjects = await Subject.find({
          _id: { $in: subjectIds },
          schoolId: schedule.schoolId,
        }).session(session);

        if (subjects.length !== subjectIds.length) {
          throw new AppError(
            httpStatus.NOT_FOUND,
            "One or more subjects not found in this school"
          );
        }
      }

      const teacherIds = normalizedPeriods
        .filter((period) => !period.isBreak && period.teacherId)
        .map((period) => period.teacherId as string);

      const teacherNameLookup = new Map<string, string>();

      if (teacherIds.length > 0) {
        const teachers = await Teacher.find({
          _id: { $in: teacherIds },
          schoolId: schedule.schoolId,
        })
          .populate("userId", "firstName lastName")
          .session(session);

        if (teachers.length !== teacherIds.length) {
          throw new AppError(
            httpStatus.NOT_FOUND,
            "One or more teachers not found in this school"
          );
        }

        teachers.forEach((teacher) => {
          const firstName = (teacher.userId as any)?.firstName || "";
          const lastName = (teacher.userId as any)?.lastName || "";
          const fullName = `${firstName} ${lastName}`.trim();
          teacherNameLookup.set(
            teacher._id.toString(),
            fullName || teacher.teacherId || "Selected teacher"
          );
        });
      }

      for (const period of normalizedPeriods) {
        if (!period.isBreak && period.teacherId) {
          const hasConflict = await Schedule.checkTeacherConflict(
            period.teacherId.toString(),
            schedule.dayOfWeek,
            period.periodNumber,
            period.startTime,
            period.endTime,
            scheduleId
          );

          if (hasConflict) {
            const teacherName =
              teacherNameLookup.get(period.teacherId.toString()) ||
              "Selected teacher";
            throw new AppError(
              httpStatus.CONFLICT,
              `${teacherName} already has a class between ${period.startTime} and ${period.endTime} on ${schedule.dayOfWeek}`
            );
          }
        }
      }

      schedule.periods = normalizedPeriods as any;
    }

    if (typeof updateData.isActive === "boolean") {
      schedule.isActive = updateData.isActive;
    }

    await schedule.save({ session });

    await session.commitTransaction();

    const result = await Schedule.findById(scheduleId)
      .populate("schoolId", "name")
      .populate("periods.subjectId", "name code")
      .populate({
        path: "periods.teacherId",
        select: "userId teacherId",
        populate: {
          path: "userId",
          select: "firstName lastName",
        },
      });

    if (!result) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to retrieve updated schedule"
      );
    }

    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const deleteSchedule = async (scheduleId: string, userSchoolId?: string): Promise<void> => {
  // Build query to include school validation if userSchoolId provided
  const query: any = { _id: scheduleId };
  if (userSchoolId) {
    query.schoolId = userSchoolId;
  }

  const schedule = await Schedule.findOne(query);
  if (!schedule) {
    throw new AppError(httpStatus.NOT_FOUND, "Schedule not found or access denied");
  }

  // Soft delete by setting isActive to false
  schedule.isActive = false;
  await schedule.save();
};

const getWeeklySchedule = async (
  schoolId: string,
  grade: number,
  section: string
): Promise<IWeeklySchedule> => {
  const school = await School.findById(schoolId);
  if (!school) {
    throw new AppError(httpStatus.NOT_FOUND, "School not found");
  }

  return await Schedule.generateWeeklySchedule(schoolId, grade, section);
};

const getTeacherSchedule = async (
  teacherId: string
): Promise<ITeacherWorkload> => {
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    throw new AppError(httpStatus.NOT_FOUND, "Teacher not found");
  }

  return await Schedule.getTeacherWorkload(teacherId);
};

const assignSubstituteTeacher = async (
  scheduleId: string,
  periodNumber: number,
  substituteTeacherId: string,
  startDate: Date,
  endDate?: Date,
  reason?: string
): Promise<IScheduleDocument> => {
  const session = await startSession();

  try {
    session.startTransaction();

    const schedule = await Schedule.findById(scheduleId).session(session);
    if (!schedule) {
      throw new AppError(httpStatus.NOT_FOUND, "Schedule not found");
    }

    const teacher = await Teacher.findById(substituteTeacherId).session(
      session
    );
    if (!teacher) {
      throw new AppError(httpStatus.NOT_FOUND, "Substitute teacher not found");
    }

    const period = schedule.periods.find(
      (p) => p.periodNumber === periodNumber
    );
    if (!period) {
      throw new AppError(httpStatus.NOT_FOUND, "Period not found");
    }

    if (period.isBreak) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot assign substitute teacher to break period"
      );
    }

    // Check if substitute teacher has conflicts
    const hasConflict = await Schedule.checkTeacherConflict(
      substituteTeacherId,
      schedule.dayOfWeek,
      periodNumber,
      period.startTime,
      period.endTime,
      scheduleId
    );

    if (hasConflict) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Substitute teacher has a conflict between ${period.startTime} and ${period.endTime} on ${schedule.dayOfWeek}`
      );
    }

    // Update the period with substitute teacher info
    period.teacherId = substituteTeacherId as any;

    await schedule.save({ session });
    await session.commitTransaction();

    const result = await Schedule.findById(scheduleId)
      .populate("schoolId", "name")
      .populate("periods.subjectId", "name code")
      .populate({
        path: "periods.teacherId",
        select: "userId teacherId",
        populate: {
          path: "userId",
          select: "firstName lastName",
        },
      });

    if (!result) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to retrieve schedule with substitute teacher"
      );
    }

    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getScheduleStats = async (schoolId: string): Promise<IScheduleStats> => {
  const school = await School.findById(schoolId);
  if (!school) {
    throw new AppError(httpStatus.NOT_FOUND, "School not found");
  }

  const [
    totalSchedules,
    activeSchedules,
    gradeStats,
    dayStats,
    teacherSchedules,
    subjectSchedules,
  ] = await Promise.all([
    Schedule.countDocuments({ schoolId }),
    Schedule.countDocuments({ schoolId, isActive: true }),
    Schedule.aggregate([
      { $match: { schoolId: schoolId as any } },
      {
        $group: {
          _id: "$grade",
          scheduleCount: { $sum: 1 },
          sections: { $addToSet: "$section" },
        },
      },
      {
        $project: {
          grade: "$_id",
          scheduleCount: 1,
          sectionsCount: { $size: "$sections" },
        },
      },
      { $sort: { grade: 1 } },
    ]),
    Schedule.aggregate([
      { $match: { schoolId: schoolId as any } },
      { $group: { _id: "$dayOfWeek", scheduleCount: { $sum: 1 } } },
      { $project: { dayOfWeek: "$_id", scheduleCount: 1 } },
    ]),
    Schedule.aggregate([
      { $match: { schoolId: schoolId as any, isActive: true } },
      { $unwind: "$periods" },
      { $match: { "periods.isBreak": { $ne: true } } },
      {
        $group: {
          _id: "$periods.teacherId",
          totalPeriods: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "teachers",
          localField: "_id",
          foreignField: "_id",
          as: "teacher",
        },
      },
      { $unwind: "$teacher" },
      {
        $lookup: {
          from: "users",
          localField: "teacher.userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          teacherId: "$_id",
          teacherName: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          totalPeriods: 1,
          utilizationPercentage: {
            $multiply: [{ $divide: ["$totalPeriods", 30] }, 100],
          },
        },
      },
      { $sort: { totalPeriods: -1 } },
    ]),
    Schedule.aggregate([
      { $match: { schoolId: schoolId as any, isActive: true } },
      { $unwind: "$periods" },
      { $match: { "periods.isBreak": { $ne: true } } },
      {
        $group: {
          _id: "$periods.subjectId",
          totalPeriods: { $sum: 1 },
          classes: { $addToSet: { grade: "$grade", section: "$section" } },
        },
      },
      {
        $lookup: {
          from: "subjects",
          localField: "_id",
          foreignField: "_id",
          as: "subject",
        },
      },
      { $unwind: "$subject" },
      {
        $project: {
          subjectId: "$_id",
          subjectName: "$subject.name",
          totalPeriods: 1,
          classesCount: { $size: "$classes" },
        },
      },
      { $sort: { totalPeriods: -1 } },
    ]),
  ]);

  return {
    totalSchedules,
    activeSchedules,
    byGrade: gradeStats,
    byDayOfWeek: dayStats,
    teacherUtilization: teacherSchedules,
    subjectDistribution: subjectSchedules,
  };
};

const bulkCreateSchedules = async (
  schedulesData: ICreateScheduleRequest[]
): Promise<IScheduleDocument[]> => {
  const session = await startSession();

  try {
    session.startTransaction();

    // Validate all schools exist
    const schoolIds = [...new Set(schedulesData.map((s) => s.schoolId))];
    const schools = await School.find({ _id: { $in: schoolIds } }).session(
      session
    );
    if (schools.length !== schoolIds.length) {
      throw new AppError(httpStatus.NOT_FOUND, "One or more schools not found");
    }

    // Check for conflicts
    for (const scheduleData of schedulesData) {
      const existingSchedule = await Schedule.findOne({
        schoolId: scheduleData.schoolId,
        grade: scheduleData.grade,
        section: scheduleData.section,
        dayOfWeek: scheduleData.dayOfWeek,
        academicYear: scheduleData.academicYear,
        isActive: true,
      }).session(session);

      if (existingSchedule) {
        throw new AppError(
          httpStatus.CONFLICT,
          `Schedule already exists for Grade ${scheduleData.grade} Section ${scheduleData.section} on ${scheduleData.dayOfWeek}`
        );
      }
    }

    const schedules = await Schedule.insertMany(schedulesData, { session });
    await session.commitTransaction();

    return schedules;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const ScheduleService = {
  createSchedule,
  clearSchedulesForClass,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  getWeeklySchedule,
  getTeacherSchedule,
  assignSubstituteTeacher,
  getScheduleStats,
  bulkCreateSchedules,
};
