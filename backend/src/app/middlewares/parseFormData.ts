import { Request, Response, NextFunction } from 'express';
import { AppError } from "../errors/AppError";
import { catchAsync } from "../utils/catchAsync";

export const parseBody = catchAsync(async (req, res, next) => {
  if (!req.body.data) {
    throw new AppError(400, "Please provide data in the body under data key");
  }
  req.body = JSON.parse(req.body.data);

  next();
});

/**
 * Middleware to parse FormData fields to appropriate types
 * This is needed when using multipart/form-data with file uploads
 * where all form fields are received as strings
 */
export const parseHomeworkFormData = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body) {
      // Convert numeric fields from strings to numbers
      const numericFields = ['grade', 'estimatedDuration', 'totalMarks', 'passingMarks', 'latePenalty', 'maxLateDays', 'maxGroupSize'];
      
      numericFields.forEach(field => {
        if (req.body[field] !== undefined && req.body[field] !== '') {
          const value = parseFloat(req.body[field]);
          if (!isNaN(value)) {
            req.body[field] = value;
          }
        }
      });

      // Convert boolean fields from strings to booleans
      const booleanFields = ['allowLateSubmission', 'isGroupWork', 'isPublished'];
      
      booleanFields.forEach(field => {
        if (req.body[field] !== undefined) {
          if (typeof req.body[field] === 'string') {
            req.body[field] = req.body[field].toLowerCase() === 'true';
          }
        }
      });

      // Handle optional fields that might be empty strings
      const optionalFields = ['instructions', 'section', 'classId'];
      
      optionalFields.forEach(field => {
        if (req.body[field] === '') {
          req.body[field] = undefined;
        }
      });

      // Ensure required fields are not empty strings
      const requiredStringFields = ['title', 'description', 'subjectId', 'homeworkType', 'submissionType'];
      
      requiredStringFields.forEach(field => {
        if (req.body[field] === '') {
          req.body[field] = undefined;
        }
      });
    }

    next();
  } catch (error) {
    console.error('Error parsing FormData:', error);
    next(error);
  }
};
