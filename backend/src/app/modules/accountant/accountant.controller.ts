import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../errors/AppError";
import { accountantService } from "./accountant.service";
import {
  ICreateAccountantRequest,
  IUpdateAccountantRequest,
} from "./accountant.interface";
import { AccountantCredentialsService } from "./accountant.credentials.service";

const createAccountant = catchAsync(async (req: Request, res: Response) => {
  const accountantData: ICreateAccountantRequest = req.body;
  
  // Get admin user from auth middleware
  const adminUser = (req as any).user;
  if (!adminUser?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin user not found");
  }
  
  // Use MongoDB ObjectId for schoolId filtering
  const accountantDataWithSchoolId = {
    ...accountantData,
    schoolId: adminUser.schoolId,
  };
  
  const files = req.files as Express.Multer.File[];

  const result = await accountantService.createAccountant(accountantDataWithSchoolId, files);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Accountant created successfully",
    data: result,
  });
});

const getAllAccountants = catchAsync(async (req: Request, res: Response) => {
  const filters = req.query as any;
  
  // Get admin user from auth middleware
  const adminUser = (req as any).user;
  if (!adminUser?.schoolId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin user or school ID not found");
  }
  
  // Use MongoDB ObjectId for schoolId filtering and set defaults
  const filtersWithSchoolId = {
    page: Number(filters.page) || 1,
    limit: Number(filters.limit) || 20,
    sortBy: filters.sortBy || 'createdAt',
    sortOrder: filters.sortOrder || 'desc',
    ...filters,
    schoolId: adminUser.schoolId,
  };
  
  const result = await accountantService.getAccountants(filtersWithSchoolId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Accountants retrieved successfully",
    meta: {
      page: result.currentPage,
      limit: Number(filters.limit) || 20,
      total: result.totalCount,
    },
    data: result.accountants,
  });
});

const getAccountantById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await accountantService.getAccountantById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Accountant retrieved successfully",
    data: result,
  });
});

const updateAccountant = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: IUpdateAccountantRequest = req.body;
  const result = await accountantService.updateAccountant(id, updateData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Accountant updated successfully",
    data: result,
  });
});

const deleteAccountant = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await accountantService.deleteAccountant(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Accountant deleted successfully",
    data: null,
  });
});

const getAccountantStats = catchAsync(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const result = await accountantService.getAccountantStats(schoolId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Accountant statistics retrieved successfully",
    data: result,
  });
});

const getAccountantCredentials = catchAsync(async (req: Request, res: Response) => {
  const { accountantId } = req.params;
  const result = await AccountantCredentialsService.getAccountantCredentials(accountantId);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Accountant credentials not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Accountant credentials retrieved successfully",
    data: result,
  });
});

const resetAccountantPassword = catchAsync(async (req: Request, res: Response) => {
  const { accountantId } = req.params;
  const result = await AccountantCredentialsService.resetAccountantPassword(accountantId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Accountant password reset successfully",
    data: result,
  });
});

export const AccountantController = {
  createAccountant,
  getAllAccountants,
  getAccountantById,
  updateAccountant,
  deleteAccountant,
  getAccountantStats,
  getAccountantCredentials,
  resetAccountantPassword,
};
