import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { classService } from './class.service';
import { AuthenticatedRequest } from '../../middlewares/auth';

const createClass = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const schoolId = req.user?.role === 'superadmin' 
    ? req.body.schoolId 
    : req.user?.schoolId?.toString();

  if (!schoolId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'School ID is required',
      data: null,
    });
  }

  const result = await classService.createClass(schoolId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Class created successfully',
    data: result,
  });
});

const getAllClasses = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const schoolId = req.user?.role === 'superadmin' 
    ? req.query.schoolId as string
    : req.user?.schoolId?.toString();

  if (!schoolId && req.user?.role !== 'superadmin') {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'School ID is required',
      data: null,
    });
  }

  const result = await classService.getClasses({
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20,
    schoolId,
    grade: req.query.grade ? parseInt(req.query.grade as string) : undefined,
    section: req.query.section as string,
    academicYear: req.query.academicYear as string,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    sortBy: (req.query.sortBy as string) || 'grade',
    sortOrder: (req.query.sortOrder as string) || 'asc',
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Classes retrieved successfully',
    data: result,
  });
});

const getClassById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await classService.getClassById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class retrieved successfully',
    data: result,
  });
});

const updateClass = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await classService.updateClass(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class updated successfully',
    data: result,
  });
});

const deleteClass = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await classService.deleteClass(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class deleted successfully',
    data: null,
  });
});

const getClassesByGrade = catchAsync(async (req: Request, res: Response) => {
  const { schoolId, grade } = req.params;
  const result = await classService.getClassesByGrade(schoolId, parseInt(grade));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Classes retrieved successfully',
    data: result,
  });
});

const getClassByGradeAndSection = catchAsync(async (req: Request, res: Response) => {
  const { schoolId, grade, section } = req.params;
  const result = await classService.getClassByGradeAndSection(
    schoolId, 
    parseInt(grade), 
    section
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result ? 'Class retrieved successfully' : 'Class not found',
    data: result,
  });
});

const getClassStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { schoolId } = req.params;
  
  // For non-superadmins, use their school ID
  const targetSchoolId = req.user?.role === 'superadmin' 
    ? schoolId 
    : req.user?.schoolId?.toString();

  if (!targetSchoolId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'School ID is required',
      data: null,
    });
  }

  const result = await classService.getClassStats(targetSchoolId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class statistics retrieved successfully',
    data: result,
  });
});

const checkCapacity = catchAsync(async (req: Request, res: Response) => {
  const { schoolId, grade } = req.params;
  const result = await classService.checkCapacity(schoolId, parseInt(grade));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Capacity check completed successfully',
    data: result,
  });
});

const createNewSectionIfNeeded = catchAsync(async (req: Request, res: Response) => {
  const { schoolId, grade } = req.params;
  const { academicYear, maxStudents } = req.body;
  
  const result = await classService.createNewSectionIfNeeded(
    schoolId,
    parseInt(grade),
    academicYear,
    maxStudents
  );

  if (result) {
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'New section created successfully',
      data: result,
    });
  } else {
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'New section not needed - sufficient capacity exists',
      data: null,
    });
  }
});

export const ClassController = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassesByGrade,
  getClassByGradeAndSection,
  getClassStats,
  checkCapacity,
  createNewSectionIfNeeded,
};