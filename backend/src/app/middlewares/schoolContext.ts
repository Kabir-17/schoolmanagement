import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync";
import { School } from "../modules/school/school.model";

/**
 * Attach school context to the request so downstream middlewares (rate limiting,
 * metrics) can operate per school for both JWT and API-key based flows.
 *
 * - For authenticated users, relies on `req.user.schoolId`
 * - For auto-attend ingestion requests, resolves the school via slug/API key
 */
export const attachSchoolContext = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const requestWithContext = req as Request & {
      user?: { schoolId?: string };
      school?: typeof School.prototype;
      schoolContextId?: string;
    };

    let schoolId = requestWithContext.user?.schoolId;

    if (!schoolId) {
      const attendanceMatch = req.path?.match(/^\/attendance\/([^/]+)/);
      const apiKeyHeader = req.headers["x-attendance-key"];

      if (attendanceMatch && typeof apiKeyHeader === "string") {
        const identifier = decodeURIComponent(attendanceMatch[1]);

        const orConditions: any[] = [{ slug: identifier }, { schoolId: identifier }];
        if (mongoose.Types.ObjectId.isValid(identifier)) {
          orConditions.push({ _id: identifier });
        }

        const school = await School.findOne({
          $or: orConditions,
          apiKey: apiKeyHeader,
        }).select("_id name slug schoolId apiKey isActive settings.timezone");

        if (school) {
          requestWithContext.school = school;
          schoolId = school._id.toString();
          res.locals.school = school;
          res.locals.schoolId = schoolId;
        }
      }
    }

    if (schoolId) {
      requestWithContext.schoolContextId = schoolId;
      if (!res.locals.schoolId) {
        res.locals.schoolId = schoolId;
      }
    }

    next();
  }
);
