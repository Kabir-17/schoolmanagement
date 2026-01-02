import { Request, Response, NextFunction } from 'express';
import { Teacher } from '../modules/teacher/teacher.model';
import { AppError } from '../errors/AppError';
import { AuthenticatedRequest } from './auth';

/**
 * Middleware to add teacher and school context to request body
 * This runs after authentication but before validation
 */
export const addTeacherContext = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    
    if (!user || user.role !== 'teacher') {
      throw new AppError(403, 'Only teachers can access this resource');
    }

    // Get teacher info from user id
    const teacher = await Teacher.findOne({ userId: user.id }).populate('schoolId');
    if (!teacher) {
      throw new AppError(404, 'Teacher not found');
    }

    // Add required fields to request body for validation
    req.body.teacherId = teacher._id.toString();
    req.body.schoolId = teacher.schoolId._id.toString();

    // Store teacher info for later use in controller
    req.teacher = teacher;

    next();
  } catch (error) {
    next(error);
  }
};