import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ScheduleService } from "./schedule.service";
import { AppError } from "../../errors/AppError";
import {
  ICreateScheduleRequest,
  IUpdateScheduleRequest,
  IScheduleFilters,
} from "./schedule.interface";

const createSchedule = catchAsync(async (req: Request, res: Response) => {
  const scheduleData: ICreateScheduleRequest = req.body;
  const schedules = await ScheduleService.createSchedule(scheduleData);

  const createdCount = schedules.length;

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message:
      createdCount > 1
        ? `${createdCount} schedules created successfully`
        : "Schedule created successfully",
    data: schedules,
  });
});

const getAllSchedules = catchAsync(async (req: Request, res: Response) => {
  const filters: IScheduleFilters = req.query as any;
  const pagination = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
  };

  const result = await ScheduleService.getAllSchedules(filters, pagination);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Schedules retrieved successfully",
    meta: {
      page: result.currentPage,
      limit: pagination.limit,
      total: result.totalCount,
    },
    data: result.schedules,
  });
});

const getScheduleById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ScheduleService.getScheduleById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Schedule retrieved successfully",
    data: result,
  });
});

const updateSchedule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: IUpdateScheduleRequest = req.body;
  
  // Get schoolId from authenticated user (set by enforceSchoolIsolation middleware)
  const userSchoolId = (req as any).user?.role === 'superadmin' ? undefined : (req as any).user?.schoolId;
  
  const result = await ScheduleService.updateSchedule(id, updateData, userSchoolId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Schedule updated successfully",
    data: result,
  });
});

const deleteSchedule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Get schoolId from authenticated user (set by enforceSchoolIsolation middleware)
  const userSchoolId = (req as any).user?.role === 'superadmin' ? undefined : (req as any).user?.schoolId;
  
  await ScheduleService.deleteSchedule(id, userSchoolId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Schedule deleted successfully",
    data: null,
  });
});

const clearClassSchedule = catchAsync(async (req: Request, res: Response) => {
  const { grade, section } = req.params;
  const dayOfWeek = (req.query.dayOfWeek as string | undefined)?.toLowerCase();
  const user = (req as any).user;

  let effectiveSchoolId: string | undefined = req.query.schoolId as string | undefined;

  if (user?.role !== "superadmin") {
    effectiveSchoolId = user?.schoolId?.toString?.();
  }

  if (user?.role === "superadmin" && !effectiveSchoolId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Superadmin must provide schoolId query parameter to clear a class schedule"
    );
  }

  const deletedCount = await ScheduleService.clearSchedulesForClass(
    effectiveSchoolId,
    Number(grade),
    section,
    dayOfWeek
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      deletedCount > 0
        ? `Cleared ${deletedCount} schedule${deletedCount === 1 ? "" : "s"} for Grade ${grade} Section ${section}${dayOfWeek ? ` on ${dayOfWeek}` : ""}`
        : "No schedules found to clear",
    data: {
      deletedCount,
    },
  });
});

const getWeeklySchedule = catchAsync(async (req: Request, res: Response) => {
  const { schoolId, grade, section } = req.params;
  const result = await ScheduleService.getWeeklySchedule(
    schoolId,
    Number(grade),
    section
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Weekly schedule retrieved successfully",
    data: result,
  });
});

const getTeacherSchedule = catchAsync(async (req: Request, res: Response) => {
  const { teacherId } = req.params;
  const result = await ScheduleService.getTeacherSchedule(teacherId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Teacher schedule retrieved successfully",
    data: result,
  });
});

const assignSubstituteTeacher = catchAsync(
  async (req: Request, res: Response) => {
    const { scheduleId, periodNumber } = req.params;
    const { substituteTeacherId, startDate, endDate, reason } = req.body;

    const result = await ScheduleService.assignSubstituteTeacher(
      scheduleId,
      Number(periodNumber),
      substituteTeacherId,
      new Date(startDate),
      endDate ? new Date(endDate) : undefined,
      reason
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Substitute teacher assigned successfully",
      data: result,
    });
  }
);

const getScheduleStats = catchAsync(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const result = await ScheduleService.getScheduleStats(schoolId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Schedule statistics retrieved successfully",
    data: result,
  });
});

const bulkCreateSchedules = catchAsync(async (req: Request, res: Response) => {
  const schedulesData: ICreateScheduleRequest[] = req.body.schedules;
  const result = await ScheduleService.bulkCreateSchedules(schedulesData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: `${result.length} schedules created successfully`,
    data: result,
  });
});

const getSchedulesByClass = catchAsync(async (req: Request, res: Response) => {
  const { schoolId, grade, section } = req.params;
  const filters: IScheduleFilters = {
    schoolId,
    grade: Number(grade),
    section,
    ...req.query,
  };

  const pagination = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
  };

  const result = await ScheduleService.getAllSchedules(filters, pagination);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Class schedules retrieved successfully",
    meta: {
      page: result.currentPage,
      limit: pagination.limit,
      total: result.totalCount,
    },
    data: result.schedules,
  });
});

const getSchedulesByTeacher = catchAsync(
  async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const filters: IScheduleFilters = {
      teacherId,
      ...req.query,
    };

    const pagination = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    };

    const result = await ScheduleService.getAllSchedules(filters, pagination);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Teacher schedules retrieved successfully",
      meta: {
        page: result.currentPage,
        limit: pagination.limit,
        total: result.totalCount,
      },
      data: result.schedules,
    });
  }
);

const getSchedulesBySubject = catchAsync(
  async (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const filters: IScheduleFilters = {
      subjectId,
      ...req.query,
    };

    const pagination = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    };

    const result = await ScheduleService.getAllSchedules(filters, pagination);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subject schedules retrieved successfully",
      meta: {
        page: result.currentPage,
        limit: pagination.limit,
        total: result.totalCount,
      },
      data: result.schedules,
    });
  }
);

const getSchoolScheduleOverview = catchAsync(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params;
    const { academicYear } = req.query;

    const filters: IScheduleFilters = {
      schoolId,
      academicYear: academicYear as string,
      isActive: true,
    };

    const [schedules, stats] = await Promise.all([
      ScheduleService.getAllSchedules(filters, { page: 1, limit: 1000 }),
      ScheduleService.getScheduleStats(schoolId),
    ]);

    // Group schedules by grade and section
    const groupedSchedules = schedules.schedules.reduce(
      (acc: any, schedule: any) => {
        const key = `${schedule.grade}-${schedule.section}`;
        if (!acc[key]) {
          acc[key] = {
            grade: schedule.grade,
            section: schedule.section,
            className: `Grade ${schedule.grade} - Section ${schedule.section}`,
            days: {},
          };
        }
        acc[key].days[schedule.dayOfWeek] = schedule;
        return acc;
      },
      {}
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "School schedule overview retrieved successfully",
      data: {
        overview: Object.values(groupedSchedules),
        statistics: stats,
        totalClasses: Object.keys(groupedSchedules).length,
        totalSchedules: schedules.totalCount,
      },
    });
  }
);

export const ScheduleController = {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  clearClassSchedule,
  getWeeklySchedule,
  getTeacherSchedule,
  assignSubstituteTeacher,
  getScheduleStats,
  bulkCreateSchedules,
  getSchedulesByClass,
  getSchedulesByTeacher,
  getSchedulesBySubject,
  getSchoolScheduleOverview,
};
