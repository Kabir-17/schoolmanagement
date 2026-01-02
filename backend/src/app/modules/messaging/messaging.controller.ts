import { Request, Response } from "express";
import httpStatus from "http-status";
import { messagingService } from "./messaging.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AuthenticatedRequest } from "../../middlewares/auth";

const listContacts = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const contacts = await messagingService.listContacts(req.user!);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Available contacts retrieved successfully",
      data: contacts,
    });
  }
);

const listThreads = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const threads = await messagingService.listConversations(req.user!);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Conversations retrieved successfully",
      data: threads,
    });
  }
);

const createThread = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const conversation = await messagingService.createConversation(
      req.user!,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Conversation created successfully",
      data: conversation,
    });
  }
);

const listMessages = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const cursor =
      typeof req.query.cursor === "string"
        ? new Date(req.query.cursor)
        : undefined;
    const limit =
      typeof req.query.limit === "string"
        ? Number.parseInt(req.query.limit, 10)
        : undefined;

    const payload = await messagingService.listMessages(
      req.user!,
      req.params.id,
      {
        cursor: cursor && !Number.isNaN(cursor.getTime()) ? cursor : undefined,
        limit,
      }
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Messages retrieved successfully",
      data: payload,
    });
  }
);

const sendMessage = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const message = await messagingService.sendMessage(
      req.user!,
      req.params.id,
      req.body.body
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  }
);

export const messagingController = {
  listContacts,
  listThreads,
  createThread,
  listMessages,
  sendMessage,
};
