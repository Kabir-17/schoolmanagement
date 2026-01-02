import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { Subject } from "./subject.model";
import { AppError } from "../../errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/auth";
import mongoose from "mongoose";

export const createSubject = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const adminSchoolId = req.user?.schoolId;

    if (!adminSchoolId) {
      return next(new AppError(400, "School ID not found in user context"));
    }

    const subjectData = {
      ...req.body,
      schoolId: adminSchoolId,
      createdBy: req.user?.id,
    };

    const subject = await Subject.create(subjectData);

    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Subject created successfully",
      data: subject,
    });
  }
);

export const getAllSubjects = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const adminSchoolId = req.user?.schoolId;

    if (!adminSchoolId) {
      return next(new AppError(400, "School ID not found in user context"));
    }
    const subjects = await Subject.find({
      schoolId: adminSchoolId,
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Subjects retrieved successfully",
      data: subjects,
    });
  }
);

export const getSubjectById = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const adminSchoolId = req.user?.schoolId;

    // Validate ID parameter
    if (!id || id === "undefined" || id.trim() === "") {
      return next(new AppError(400, "Valid subject ID is required"));
    }

    // Validate if ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError(400, "Invalid subject ID format"));
    }

    const subject = await Subject.findOne({
      _id: id,
      schoolId: adminSchoolId,
    });

    if (!subject) {
      return next(new AppError(404, "Subject not found"));
    }

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Subject retrieved successfully",
      data: subject,
    });
  }
);

export const updateSubject = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const adminSchoolId = req.user?.schoolId;

    // Validate ID parameter
    if (!id || id === "undefined" || id.trim() === "") {
      return next(new AppError(400, "Valid subject ID is required"));
    }

    // Validate if ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError(400, "Invalid subject ID format"));
    }

    const subject = await Subject.findOneAndUpdate(
      { _id: id, schoolId: adminSchoolId },
      { ...req.body, updatedBy: req.user?.id },
      { new: true }
    );

    if (!subject) {
      return next(new AppError(404, "Subject not found"));
    }

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Subject updated successfully",
      data: subject,
    });
  }
);

export const getSubjectsByGrade = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { schoolId, grade } = req.params;
    const userRole = req.user?.role;
    const userSchoolId = req.user?.schoolId;

    // Check if user has access to this school
    if (userRole !== "SUPERADMIN" && userSchoolId !== schoolId) {
      return next(
        new AppError(403, "You don't have access to this school's subjects")
      );
    }

    const subjects = await Subject.find({
      schoolId: schoolId,
      grades: { $in: [parseInt(grade)] },
      
    }).sort({ createdAt: -1 });

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: `Subjects for grade ${grade} retrieved successfully`,
      data: subjects,
    });
  }
);

export const deleteSubject = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const adminSchoolId = req.user?.schoolId;

    // Validate ID parameter
    if (!id || id === "undefined" || id.trim() === "") {
      return next(new AppError(400, "Valid subject ID is required"));
    }

    // Validate if ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError(400, "Invalid subject ID format"));
    }

    const subject = await Subject.findOneAndUpdate(
      { _id: id, schoolId: adminSchoolId, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user?.id,
      },
      { new: true }
    );

    if (!subject) {
      return next(new AppError(404, "Subject not found"));
    }

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Subject deleted successfully",
      data: null,
    });
  }
);

export const SubjectController = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  getSubjectsByGrade,
  updateSubject,
  deleteSubject,
};
