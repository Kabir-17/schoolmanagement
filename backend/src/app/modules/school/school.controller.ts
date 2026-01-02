import httpStatus from "http-status";
import { Request, Response } from "express";
import { Types } from "mongoose";
import { catchAsync } from "../../utils/catchAsync";
import { schoolService } from "./school.service";
import { School } from "./school.model";
import { sendResponse } from "../../utils/sendResponse";
import { AuthenticatedRequest } from "../../middlewares/auth";

const createSchool = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    // Use the modern school creation method
    const result = await schoolService.createSchoolModern(
      req.body,
      new Types.ObjectId(req.user?.id)
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "School created successfully",
      data: {
        school: result.school,
        adminCredentials: result.credentials,
      },
    });
  }
);

const getAllSchools = catchAsync(async (req: Request, res: Response) => {
  const result = await schoolService.getAllSchools(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Schools retrieved successfully",
    data: result,
  });
});

const getSchool = catchAsync(async (req: Request, res: Response) => {
  const result = await schoolService.getSchoolById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "School retrieved successfully",
    data: result,
  });
});

const updateSchool = catchAsync(async (req: Request, res: Response) => {
  const result = await schoolService.updateSchool(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "School updated successfully",
    data: result,
  });
});

const deleteSchool = catchAsync(async (req: Request, res: Response) => {
  await schoolService.deleteSchool(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "School deleted successfully",
    data: null,
  });
});

const getSchoolStats = catchAsync(async (req: Request, res: Response) => {
  const result = await schoolService.getSchoolStats(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "School statistics retrieved successfully",
    data: result,
  });
});

const assignAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await schoolService.assignAdmin(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin assigned successfully",
    data: result,
  });
});

const updateSchoolStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await schoolService.updateSchoolStatus(
    req.params.id,
    req.body.status,
    req.body.updatedBy || new Types.ObjectId() // Temporary fallback
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "School status updated successfully",
    data: result,
  });
});

const regenerateApiKey = catchAsync(async (req: Request, res: Response) => {
  const result = await schoolService.regenerateApiKey(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "API key regenerated successfully",
    data: result,
  });
});

const getSystemStats = catchAsync(async (req: Request, res: Response) => {
  const result = await schoolService.getSystemStats();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "System statistics retrieved successfully",
    data: result,
  });
});

const getAdminCredentials = catchAsync(async (req: Request, res: Response) => {
  const result = await schoolService.getAdminCredentials(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin credentials retrieved successfully",
    data: result,
  });
});

const resetAdminPassword = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await schoolService.resetAdminPassword(
      req.params.id,
      req.body.newPassword,
      new Types.ObjectId(req.user?.id)
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Admin password reset successfully",
      data: result,
    });
  }
);

const getAttendanceApiInfo = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    // Determine target school id/slug from authenticated user or params
    const requestedSchoolIdentifier = req.user?.schoolId || req.params.id;

    // Get formatted response for the UI (this hides sensitive fields)
    const school = await schoolService.getSchoolById(requestedSchoolIdentifier);

    // Also fetch the raw school document so we can read apiKey when authorized
    const rawSchool = await School.findOne({
      $or: [
        { slug: requestedSchoolIdentifier },
        { schoolId: requestedSchoolIdentifier },
        { _id: requestedSchoolIdentifier },
      ],
    })
      .select("apiKey schoolId slug apiEndpoint")
      .lean();

    console.log(rawSchool);
    let apiKeyToReturn: string | undefined = undefined;
    try {
      const requesterIsSuperadmin = req.user?.role === "superadmin";
      const requesterSchoolId = req.user?.schoolId;
      //-- @ts-ignore
      const schoolMatchesRequester =
        !!requesterSchoolId &&
        (requesterSchoolId === school.schoolId ||
          requesterSchoolId === (school as any).id ||
          requesterSchoolId === (school as any)._id?.toString());

      if (requesterIsSuperadmin || schoolMatchesRequester) {
        apiKeyToReturn = (rawSchool as any)?.apiKey;
      }
    } catch (e) {
      // In case of unexpected shape, don't expose the key
      apiKeyToReturn = undefined;
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Attendance API information retrieved successfully",
      data: {
        schoolId: school.schoolId,
        schoolSlug: school.slug,
        apiEndpoint: school.apiEndpoint,
        apiKey: apiKeyToReturn,
        instructions: {
          endpoint: `POST ${school.apiEndpoint}/events`,
          authentication: "Include X-Attendance-Key header with your API key",
          documentation: "/api/docs/attendance-integration",
        },
      },
    });
  }
);

export {
  createSchool,
  getAllSchools,
  getSchool,
  updateSchool,
  deleteSchool,
  getSchoolStats,
  assignAdmin,
  updateSchoolStatus,
  regenerateApiKey,
  getSystemStats,
  getAdminCredentials,
  resetAdminPassword,
  getAttendanceApiInfo,
};
