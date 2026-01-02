import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { academicCalendarService } from "./academic-calendar.service";
import {
  ICreateAcademicCalendarRequest,
  IUpdateAcademicCalendarRequest,
  ICreateExamScheduleRequest,
} from "./academic-calendar.interface";

const createCalendarEvent = catchAsync(async (req: Request, res: Response) => {
  const eventData: ICreateAcademicCalendarRequest = req.body;
  
  // Handle file attachments
  if (req.files && Array.isArray(req.files)) {
    eventData.attachments = req.files.map((file: any) => ({
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
    }));
  }
  
  const result = await academicCalendarService.createCalendarEvent(eventData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Calendar event created successfully",
    data: result,
  });
});

const getAllCalendarEvents = catchAsync(async (req: Request, res: Response) => {
  const filters = req.query as any;
  const result = await academicCalendarService.getCalendarEvents(filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Calendar events retrieved successfully",
    meta: {
      page: result.currentPage,
      limit: Number(filters.limit) || 20,
      total: result.totalCount,
    },
    data: result.events,
  });
});

const getCalendarEventById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await academicCalendarService.getCalendarEventById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Calendar event retrieved successfully",
    data: result,
  });
});

const updateCalendarEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: IUpdateAcademicCalendarRequest = req.body;
  
  // Handle file attachments
  if (req.files && Array.isArray(req.files)) {
    updateData.attachments = req.files.map((file: any) => ({
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
    }));
  }
  
  const result = await academicCalendarService.updateCalendarEvent(
    id,
    updateData
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Calendar event updated successfully",
    data: result,
  });
});

const deleteCalendarEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await academicCalendarService.deleteCalendarEvent(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Calendar event deleted successfully",
    data: null,
  });
});

const getCalendarStats = catchAsync(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const result = await academicCalendarService.getCalendarStats(schoolId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Calendar statistics retrieved successfully",
    data: result,
  });
});

const createExamSchedule = catchAsync(async (req: Request, res: Response) => {
  const examData: ICreateExamScheduleRequest = req.body;
  const result = await academicCalendarService.createExamSchedule(examData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Exam schedule created successfully",
    data: result,
  });
});

const getMonthlyCalendar = catchAsync(async (req: Request, res: Response) => {
  const { schoolId, year, month } = req.params;

  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0);

  const result = await academicCalendarService.getCalendarEvents({
    page: 1,
    limit: 1000,
    schoolId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    sortBy: "startDate",
    sortOrder: "asc",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Monthly calendar retrieved successfully",
    data: {
      events: result.events,
      month: parseInt(month),
      year: parseInt(year),
      totalEvents: result.totalCount,
    },
  });
});

const getUpcomingEvents = catchAsync(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { days = 7 } = req.query;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + parseInt(days as string));

  const result = await academicCalendarService.getCalendarEvents({
    page: 1,
    limit: 100,
    schoolId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    sortBy: "startDate",
    sortOrder: "asc",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Upcoming events retrieved successfully",
    data: result.events,
  });
});

export const AcademicCalendarController = {
  createCalendarEvent,
  getAllCalendarEvents,
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarStats,
  createExamSchedule,
  getMonthlyCalendar,
  getUpcomingEvents,
};
