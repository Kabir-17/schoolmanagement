import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../errors/AppError";
import { UserCredentials } from "../user/userCredentials.model";
import { Types } from "mongoose";

const getStudentCredentials = catchAsync(
  async (req: Request, res: Response) => {
    const { studentId } = req.params;
    const adminUser = (req as any).user;

    // Verify admin permissions
    if (!adminUser || !["admin", "superadmin"].includes(adminUser.role)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Only admin and superadmin can view credentials"
      );
    }

    if (!Types.ObjectId.isValid(studentId)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid student ID format");
    }

    // Get credentials for student and their parent
    const credentials = await UserCredentials.find({
      $or: [
        {
          role: "student",
          userId: { $in: await getUserIdsByStudentId(studentId) },
        },
        { role: "parent", associatedStudentId: studentId },
      ],
    })
      .populate("userId", "firstName lastName username")
      .populate("issuedBy", "firstName lastName username")
      .sort({ role: 1 })
      .lean({ includePassword: true }); 

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Student credentials retrieved successfully",
      data: credentials,
    });
  }
);

const getAllCredentials = catchAsync(async (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const { schoolId, role, hasChangedPassword } = req.query;

  // Verify admin permissions
  if (!adminUser || !["admin", "superadmin"].includes(adminUser.role)) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only admin and superadmin can view credentials"
    );
  }

  // Build query
  const query: any = {};

  if (schoolId) {
    if (!Types.ObjectId.isValid(schoolId as string)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid school ID format");
    }
    query.schoolId = schoolId;
  } else if (adminUser.role === "admin") {
    // Admins can only see their own school's credentials
    query.schoolId = adminUser.schoolId;
  }

  if (role && ["student", "parent", "teacher"].includes(role as string)) {
    query.role = role;
  }

  if (hasChangedPassword !== undefined) {
    query.hasChangedPassword = hasChangedPassword === "true";
  }

  const credentials = await UserCredentials.find(query)
    .populate("userId", "firstName lastName username email")
    .populate("issuedBy", "firstName lastName username")
    .populate("associatedStudentId", "studentId")
    .sort({ createdAt: -1 })
    .limit(100) // Limit for performance
    .lean({ includePassword: true });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Credentials retrieved successfully",
    data: credentials,
  });
});

// Helper function to get user IDs associated with a student
async function getUserIdsByStudentId(
  studentId: string
): Promise<Types.ObjectId[]> {
  const { Student } = await import("../student/student.model");
  const student = await Student.findById(studentId).select("userId");
  return student ? [student.userId] : [];
}

export const CredentialsController = {
  getStudentCredentials,
  getAllCredentials,
};
