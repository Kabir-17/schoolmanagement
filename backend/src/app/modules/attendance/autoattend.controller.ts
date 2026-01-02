import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { School } from "../school/school.model";
import { AttendanceEvent } from "./attendance-event.model";
import { Student } from "../student/student.model";
import {
  IAutoAttendRequest,
  IAttendanceEventFilters,
} from "./attendance-event.interface";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../errors/AppError";
import { sendResponse } from "../../utils/sendResponse";
import { AutoAttendReconciliationService } from "./autoattend-reconciliation.service";
import { StudentDayAttendance, normaliseDateKey } from "./day-attendance.model";
import { getSchoolDate } from "../../utils/dateUtils";
import config from "../../config";

export const processAutoAttendEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { schoolSlug } = req.params;
    const apiKey = req.headers["x-attendance-key"] as string;
    const payload: IAutoAttendRequest = req.body;
    const requestWithContext = req as Request & {
      school?: any;
      schoolContextId?: string;
    };

    // 1. Authenticate using school slug and API key
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        processed: false,
        message: "Missing X-Attendance-Key header",
        eventId: payload.event?.eventId || "unknown",
      });
    }

    // Build $or conditions carefully to avoid Mongoose ObjectId cast errors
    const orConditions: any[] = [
      { slug: schoolSlug },
      { schoolId: schoolSlug },
    ];
    if (mongoose.Types.ObjectId.isValid(schoolSlug)) {
      orConditions.push({ _id: schoolSlug });
    }

    let school = requestWithContext.school;

    if (
      !school ||
      school.apiKey !== apiKey ||
      !orConditions.some((condition) => {
        if (condition.slug) {
          return school.slug === condition.slug;
        }
        if (condition.schoolId) {
          return school.schoolId === condition.schoolId;
        }
        if (condition._id) {
          return school._id?.toString() === condition._id;
        }
        return false;
      })
    ) {
      school = await School.findOne({
        $or: orConditions,
        apiKey: apiKey,
      }).select("_id name slug schoolId apiKey isActive settings.autoAttendFinalizationTime settings.timezone");
    }

    if (!school) {
      return res.status(401).json({
        success: false,
        processed: false,
        message: "Invalid school or API key",
        eventId: payload.event?.eventId || "unknown",
      });
    }

    if (!school.isActive) {
      return res.status(403).json({
        success: false,
        processed: false,
        message: "School attendance API is disabled",
        eventId: payload.event?.eventId || "unknown",
      });
    }

    // 2. Validate payload (already validated by middleware, but double-check)
    if (!payload.event || !payload.event.eventId) {
      return res.status(400).json({
        success: false,
        processed: false,
        message: "Invalid event payload",
        eventId: "unknown",
      });
    }

    requestWithContext.school = school;
    requestWithContext.schoolContextId = school._id.toString();
    res.locals.school = school;
    res.locals.schoolId = school._id.toString();

    const { event, source, test } = payload;

    // 3. Handle test/dry-run events
    if (test === true) {
      return res.status(200).json({
        success: true,
        processed: false,
        message: "Test event acknowledged (not persisted)",
        eventId: event.eventId,
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Validate student exists in this school (check first)
    // This is advisory; we still persist the event even if student not found
    let studentExists = false;
    let studentDoc: any = null;
    try {
      studentDoc = await Student.findOne({
        schoolId: school._id,
        $or: [
          { studentId: event.studentId },
          { "userId.username": event.studentId }, // in case studentId is username
        ],
      }).select("_id studentId schoolId");
      studentExists = !!studentDoc;
    } catch (err) {
      console.warn("Failed to verify student existence:", err);
    }

    // 5. ✅ FIX: Use atomic upsert to prevent race condition
    try {
      const attendanceEvent = await AttendanceEvent.findOneAndUpdate(
        { eventId: event.eventId }, // Filter by unique eventId
        {
          $setOnInsert: {
            schoolId: school._id,
            eventId: event.eventId,
            descriptor: event.descriptor,
            studentId: event.studentId,
            firstName: event.firstName,
            age: event.age,
            grade: event.grade,
            section: event.section,
            bloodGroup: event.bloodGroup,
            capturedAt: new Date(event.capturedAt),
            capturedDate: event.capturedDate,
            capturedTime: event.capturedTime,
            payload: payload, // store full original payload
            source: source,
            status: "captured", // initial status
            test: test || false,
            createdAt: new Date(),
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(
        `[Auto-Attend] Event ${event.eventId} captured for school ${school.name} (${school.schoolId}), student ${event.studentId}, grade ${event.grade}${event.section}`
      );

      if (studentDoc) {
        // Use school-specific timezone for normalization
        const schoolTimezone =
          school.settings?.timezone || config.school_timezone || 'UTC';
        const { date: normalizedDate, dateKey } = getSchoolDate(
          new Date(event.capturedAt),
          schoolTimezone
        );

        await StudentDayAttendance.markFromAuto({
          schoolId: school._id,
          studentId: studentDoc._id,
          studentCode: studentDoc.studentId,
          eventId: event.eventId,
          capturedAt: new Date(event.capturedAt),
          dateKey: dateKey,
        });

        const finalizeTime =
          school.settings?.autoAttendFinalizationTime ||
          config.auto_attend_finalization_time;
        await StudentDayAttendance.finalizeForDate(
          school._id,
          normalizedDate,
          dateKey,
          finalizeTime,
          schoolTimezone
        );
      }

      return res.status(200).json({
        success: true,
        processed: true,
        message: studentExists
          ? "Attendance event queued"
          : "Attendance event queued (student not found in SMS)",
        eventId: event.eventId,
        timestamp: attendanceEvent.createdAt?.toISOString(),
      });
    } catch (error: any) {
      console.error("[Auto-Attend] Failed to persist event:", error);

      // Check for duplicate key error (race condition)
      if (error.code === 11000) {
        return res.status(409).json({
          success: true,
          processed: false,
          message: "Event already processed (duplicate detected)",
          eventId: event.eventId,
        });
      }

      return res.status(500).json({
        success: false,
        processed: false,
        message: "Internal server error while processing event",
        eventId: event.eventId,
      });
    }
  }
);

/**
 * Get attendance events for a school (admin/teacher use)
 * GET /api/attendance/events
 */
export const getAttendanceEvents = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const schoolId = (req as any).user?.schoolId;
    if (!schoolId) {
      return next(new AppError(403, "School ID not found in user context"));
    }
    const schoolObjectId = new mongoose.Types.ObjectId(schoolId);

    const schoolSettingsDoc = await School.findById(schoolObjectId).select(
      "settings.autoAttendFinalizationTime settings.timezone"
    );
    const finalizeTimeSetting =
      schoolSettingsDoc?.settings?.autoAttendFinalizationTime ||
      config.auto_attend_finalization_time;
    const schoolTimezone =
      schoolSettingsDoc?.settings?.timezone || config.school_timezone || "UTC";

    const {
      studentId,
      status,
      startDate,
      endDate,
      grade,
      section,
      test,
      page = "1",
      limit = "50",
    } = req.query;

    const filters: IAttendanceEventFilters = {
      schoolId: schoolId.toString(),
    };

    if (studentId) filters.studentId = studentId as string;
    if (status) filters.status = status as any;
    if (grade) filters.grade = grade as string;
    if (section) filters.section = section as string;
    if (test !== undefined) filters.test = test === "true";
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const query: any = { schoolId: schoolObjectId };

    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.status) query.status = filters.status;
    if (filters.grade) query.grade = filters.grade;
    if (filters.section) query.section = filters.section;
    if (filters.test !== undefined) query.test = filters.test;
    if (filters.startDate || filters.endDate) {
      query.capturedAt = {};
      if (filters.startDate) query.capturedAt.$gte = filters.startDate;
      if (filters.endDate) query.capturedAt.$lte = filters.endDate;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      AttendanceEvent.find(query)
        .sort({ capturedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AttendanceEvent.countDocuments(query),
    ]);

    const dateKeys = Array.from(
      new Set(events.map((event) => event.capturedDate).filter(Boolean))
    );

    await Promise.all(
      dateKeys.map((key) => {
        const { date } = normaliseDateKey(key, schoolTimezone);
        return StudentDayAttendance.finalizeForDate(
          schoolObjectId,
          date,
          key,
          finalizeTimeSetting,
          schoolTimezone
        );
      })
    );

    const statusMap = await StudentDayAttendance.getStatusMap(
      schoolObjectId,
      dateKeys
    );

    const eventsWithStatus = events.map((event) => {
      const mapKey = `${event.studentId}-${event.capturedDate}`;
      const dayAttendance = statusMap.get(mapKey);
      return {
        ...event,
        dayAttendance: dayAttendance
          ? {
              finalStatus: dayAttendance.finalStatus,
              finalSource: dayAttendance.finalSource,
              teacherStatus: dayAttendance.teacherStatus,
              autoStatus: dayAttendance.autoStatus,
              finalized: dayAttendance.finalized,
              teacherOverride: dayAttendance.teacherOverride,
              updatedAt: dayAttendance.updatedAt,
            }
          : null,
      };
    });

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Attendance events retrieved successfully",
      data: {
        events: eventsWithStatus,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  }
);

/**
 * Get attendance event statistics
 * GET /api/attendance/events/stats
 */
export const getAttendanceEventStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const schoolId = (req as any).user?.schoolId;
    if (!schoolId) {
      return next(new AppError(403, "School ID not found in user context"));
    }

    const { startDate, endDate } = req.query;

    // Build a match object for queries/aggregations.
    // Construct an ObjectId instance (must use `new` with recent mongoose versions)
    const schoolObjectId = new mongoose.Types.ObjectId(schoolId);

    // Ensure schoolId is an ObjectId so aggregation match works against stored documents.
    const match: any = { schoolId: schoolObjectId };

    // dateFilter is used by the fallback counting logic below. Keep it in sync with `match`.
    const dateFilter: any = { schoolId: schoolObjectId };

    // Allow filtering by capturedAt date range when provided
    if (startDate || endDate) {
      const capturedAtFilter: any = {};
      if (startDate) capturedAtFilter.$gte = new Date(startDate as string);
      if (endDate) capturedAtFilter.$lte = new Date(endDate as string);
      match.capturedAt = capturedAtFilter;
      dateFilter.capturedAt = capturedAtFilter;
    }

    const [totalEvents, statusCounts, gradeCounts, recentEvents] =
      await Promise.all([
        AttendanceEvent.countDocuments(match),
        AttendanceEvent.aggregate([
          { $match: match },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        AttendanceEvent.aggregate([
          { $match: match },
          { $group: { _id: "$grade", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        AttendanceEvent.find(match).sort({ capturedAt: -1 }).limit(10).lean(),
      ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const eventsToday = await AttendanceEvent.countDocuments({
      schoolId: schoolObjectId,
      capturedAt: { $gte: todayStart },
    });

    const statusMap: any = {};
    statusCounts.forEach((item: any) => {
      statusMap[item._id] = item.count;
    });

    // Fallback: if aggregation returned no groups (edge cases with pipeline or types),
    // compute counts per status explicitly so UI statistics remain accurate.
    if (
      Object.keys(statusMap).length === 0 &&
      recentEvents &&
      recentEvents.length > 0
    ) {
      const statuses = ["captured", "reviewed", "superseded", "ignored"];
      const counts = await Promise.all(
        statuses.map((s) =>
          AttendanceEvent.countDocuments({ ...dateFilter, status: s })
        )
      );
      statuses.forEach((s, idx) => {
        statusMap[s] = counts[idx];
      });
    }

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Attendance event statistics retrieved successfully",
      data: {
        totalEvents,
        capturedEvents: statusMap.captured || 0,
        reviewedEvents: statusMap.reviewed || 0,
        supersededEvents: statusMap.superseded || 0,
        ignoredEvents: statusMap.ignored || 0,
        eventsToday,
        eventsByGrade: gradeCounts.map((item: any) => ({
          grade: item._id,
          count: item.count,
        })),
        eventsByStatus: statusCounts.map((item: any) => ({
          status: item._id,
          count: item.count,
        })),
        recentEvents,
      },
    });
  }
);

/**
 * Update event status (review, ignore, supersede)
 * PATCH /api/attendance/events/:eventId
 */
export const updateAttendanceEventStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const { status, notes } = req.body;
    const userId = (req as any).user?.id;
    const schoolId = (req as any).user?.schoolId;

    if (!schoolId) {
      return next(new AppError(403, "School ID not found in user context"));
    }

    if (!["reviewed", "superseded", "ignored"].includes(status)) {
      return next(
        new AppError(
          400,
          "Invalid status. Must be reviewed, superseded, or ignored"
        )
      );
    }

    const event = await AttendanceEvent.findOne({
      eventId,
      schoolId,
    });

    if (!event) {
      return next(new AppError(404, "Attendance event not found"));
    }

    event.status = status;
    event.processedAt = new Date();
    event.processedBy = userId;
    if (notes) event.notes = notes;

    await event.save();

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: `Attendance event marked as ${status}`,
      data: event,
    });
  }
);

/**
 * Get reconciliation report for a specific date/period
 * Shows discrepancies between camera events and teacher marks
 * GET /api/attendance/reconcile
 */
export const getReconciliationReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const schoolId = (req as any).user?.schoolId;
    if (!schoolId) {
      return next(new AppError(403, "School ID not found in user context"));
    }

    const { date, grade, section, period } = req.query;

    if (!date || !grade || !section) {
      return next(new AppError(400, "date, grade, and section are required"));
    }

    const result =
      await AutoAttendReconciliationService.reconcileAttendanceForPeriod(
        schoolId.toString(),
        new Date(date as string),
        parseInt(grade as string, 10),
        section as string,
        period ? parseInt(period as string, 10) : undefined
      );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Reconciliation report generated successfully",
      data: result,
    });
  }
);

/**
 * Get attendance suggestions from camera events
 * Prefills attendance form with camera event data
 * GET /api/attendance/suggest
 */
export const getAttendanceSuggestions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const schoolId = (req as any).user?.schoolId;
    if (!schoolId) {
      return next(new AppError(403, "School ID not found in user context"));
    }

    const { date, grade, section } = req.query;

    if (!date || !grade || !section) {
      return next(new AppError(400, "date, grade, and section are required"));
    }

    const suggestions =
      await AutoAttendReconciliationService.suggestAttendanceFromCamera(
        schoolId.toString(),
        new Date(date as string),
        parseInt(grade as string, 10),
        section as string
      );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Attendance suggestions generated successfully",
      data: suggestions,
    });
  }
);
