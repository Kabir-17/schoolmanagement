import { Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { orangeSmsService } from './orange-sms.service';
import { AuthenticatedRequest } from '../../middlewares/auth';

export const getOrangeSmsConfig = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const config = await orangeSmsService.getDisplayConfig();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: config.hasCredentials
        ? 'Orange SMS configuration retrieved successfully'
        : 'Orange SMS is not yet configured',
      data: config,
    });
  }
);

export const updateOrangeSmsConfig = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const config = await orangeSmsService.updateConfig(req.body, req.user?.id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Orange SMS configuration updated successfully',
      data: config,
    });
  }
);

export const sendOrangeSmsTest = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { phoneNumber, message, senderName, clientId, clientSecret } = req.body;

    const overrideCredentials =
      clientId && clientSecret ? { clientId, clientSecret } : undefined;

    const result = await orangeSmsService.sendSms(
      {
        phoneNumber,
        message,
        senderNameOverride: senderName,
      },
      overrideCredentials
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message:
        result.status === 'sent'
          ? 'Test SMS sent successfully'
          : 'Failed to send test SMS',
      data: result,
    });
  }
);
