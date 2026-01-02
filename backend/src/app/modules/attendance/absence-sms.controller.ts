import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { AuthenticatedRequest } from '../../middlewares/auth';
import {
  getAbsenceSmsOverview,
  listAbsenceSmsLogs,
  triggerAbsenceSmsRun,
  sendAbsenceSmsTest,
} from './absence-sms.service';
import { AppError } from '../../errors/AppError';

export const getAbsenceSmsLogsController = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const effectiveSchoolId =
      (req.query.schoolId as string) || req.user?.schoolId?.toString();

    if (!effectiveSchoolId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'School context is required to fetch SMS logs'
      );
    }

    const result = await listAbsenceSmsLogs({
      schoolId: effectiveSchoolId,
      status: req.query.status as any,
      date: req.query.date as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      messageQuery: req.query.messageQuery as string | undefined,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Absence SMS logs retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }
);

export const getAbsenceSmsOverviewController = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const effectiveSchoolId =
      (req.query.schoolId as string) || req.user?.schoolId?.toString();

    if (!effectiveSchoolId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'School context is required to load the SMS overview'
      );
    }

    const overview = await getAbsenceSmsOverview(
      effectiveSchoolId,
      req.query.date as string | undefined
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Absence SMS overview retrieved successfully',
      data: overview,
    });
  }
);

export const triggerAbsenceSmsDispatchController = catchAsync(
  async (_req: AuthenticatedRequest, res: Response) => {
    const result = await triggerAbsenceSmsRun();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Absence SMS dispatcher triggered successfully',
      data: result,
    });
  }
);

export const sendAbsenceSmsTestController = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await sendAbsenceSmsTest(req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        result.status === 'sent'
          ? 'Test SMS sent successfully'
          : 'Failed to send test SMS',
      data: result,
    });
  }
);
