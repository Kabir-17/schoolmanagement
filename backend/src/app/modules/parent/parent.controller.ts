import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../errors/AppError";
import { parentService } from "./parent.service";
import { assessmentService } from "../assessment/assessment.service";

const getChildDisciplinaryActions = catchAsync(
  async (req: Request, res: Response) => {
    const parentUserId = (req as any).user?.id;
    if (!parentUserId) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Parent user not found");
    }

    const disciplinaryData = await parentService.getChildDisciplinaryActions(
      parentUserId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Child disciplinary actions retrieved successfully",
      data: disciplinaryData,
    });
  }
);

const getParentDashboard = catchAsync(async (req: Request, res: Response) => {
  const parentUserId = (req as any).user?.id;
  if (!parentUserId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Parent user not found");
  }

  const dashboardData = await parentService.getParentDashboard(parentUserId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Parent dashboard retrieved successfully",
    data: dashboardData,
  });
});

const getParentChildren = catchAsync(async (req: Request, res: Response) => {
  const parentUserId = (req as any).user?.id;
  if (!parentUserId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Parent user not found");
  }

  const childrenData = await parentService.getParentChildren(parentUserId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Parent children retrieved successfully",
    data: childrenData,
  });
});

const getChildAttendance = catchAsync(async (req: Request, res: Response) => {
  const parentUserId = (req as any).user?.id;
  const { childId } = req.params;
  const filters = req.query;

  if (!parentUserId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Parent user not found");
  }

  const attendanceData = await parentService.getChildAttendance(
    parentUserId,
    childId,
    filters
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Child attendance retrieved successfully",
    data: attendanceData,
  });
});

const getChildHomework = catchAsync(async (req: Request, res: Response) => {
  const parentUserId = (req as any).user?.id;
  const { childId } = req.params;

  if (!parentUserId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Parent user not found");
  }

  const homeworkData = await parentService.getChildHomework(
    parentUserId,
    childId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Child homework retrieved successfully",
    data: homeworkData,
  });
});

const getChildGrades = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { childId } = req.params;

  if (!user?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Parent user not found");
  }

  const gradeData = await assessmentService.getStudentAssessments(user, childId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Child assessment records retrieved successfully",
    data: gradeData,
  });
});

const getChildSchedule = catchAsync(async (req: Request, res: Response) => {
  const parentUserId = (req as any).user?.id;
  const { childId } = req.params;

  if (!parentUserId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Parent user not found");
  }

  const scheduleData = await parentService.getChildSchedule(
    parentUserId,
    childId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Child schedule retrieved successfully",
    data: scheduleData,
  });
});

const getChildNotices = catchAsync(async (req: Request, res: Response) => {
  const parentUserId = (req as any).user?.id;
  const { childId } = req.params;

  if (!parentUserId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Parent user not found");
  }

  const noticesData = await parentService.getChildNotices(
    parentUserId,
    childId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Child notices retrieved successfully",
    data: noticesData,
  });
});

export const ParentController = {
  getChildDisciplinaryActions,
  getParentDashboard,
  getParentChildren,
  getChildAttendance,
  getChildHomework,
  getChildGrades,
  getChildSchedule,
  getChildNotices,
};
