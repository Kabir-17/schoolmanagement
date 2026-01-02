import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { eventService } from './event.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Student } from '../student/student.model';
import { Teacher } from '../teacher/teacher.model';

const createEvent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  const eventData = req.body;

  // Add school ID from user context (for non-superadmin users)
  if (user!.role !== 'superadmin' && user!.schoolId && user!.schoolId !== 'system') {
    eventData.schoolId = user!.schoolId;
  } else if (user!.role === 'superadmin' && !eventData.schoolId) {
    // For superadmin, require schoolId in request body or use a default school
    // Let's get the first school as default for superadmin
    const { School } = await import('../school/school.model');
    const defaultSchool = await School.findOne({ status: 'active' });
    if (defaultSchool) {
      eventData.schoolId = defaultSchool._id;
    }
  }

  const result = await eventService.createEvent(eventData, new Types.ObjectId(user!.id));

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Event created successfully',
    data: result
  });
});

const getEvents = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  let userGrade: number | undefined;
  let userSection: string | undefined;

  // Get user-specific context based on role
  if (user!.role === 'student') {
    const student = await Student.findOne({ userId: user!.id });
    userGrade = student?.grade;
    userSection = student?.section;
  } else if (user!.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: user!.id });
    // For teachers, use the first grade/section they teach if they're class teachers
    userGrade = teacher?.grades?.[0];
    userSection = teacher?.sections?.[0];
  }
  
  const result = await eventService.getEvents(
    new Types.ObjectId(user!.schoolId!),
    user!.role,
    userGrade,
    userSection,
    req.query
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Events fetched successfully',
    data: result
  });
});

const getTodaysEvents = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  let userGrade: number | undefined;
  let userSection: string | undefined;

  // Get user-specific context based on role
  if (user!.role === 'student') {
    const student = await Student.findOne({ userId: user!.id });
    userGrade = student?.grade;
    userSection = student?.section;
  } else if (user!.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: user!.id });
    // For teachers, use the first grade/section they teach if they're class teachers
    userGrade = teacher?.grades?.[0];
    userSection = teacher?.sections?.[0];
  }

  const result = await eventService.getTodaysEvents(
    new Types.ObjectId(user!.schoolId!), 
    user!.role, 
    userGrade, 
    userSection
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Today's events fetched successfully",
    data: result
  });
});

const getUpcomingEvents = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  let userGrade: number | undefined;
  let userSection: string | undefined;
  const limit = parseInt(req.query.limit as string) || 5;

  // Get user-specific context based on role
  if (user!.role === 'student') {
    const student = await Student.findOne({ userId: user!.id });
    userGrade = student?.grade;
    userSection = student?.section;
  } else if (user!.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: user!.id });
    // For teachers, use the first grade/section they teach if they're class teachers
    userGrade = teacher?.grades?.[0];
    userSection = teacher?.sections?.[0];
  }

  const result = await eventService.getUpcomingEvents(
    new Types.ObjectId(user!.schoolId!), 
    user!.role, 
    userGrade, 
    userSection, 
    limit
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Upcoming events fetched successfully',
    data: result
  });
});

const getEventById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  const result = await eventService.getEventById(id, new Types.ObjectId(user!.schoolId!));

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Event fetched successfully',
    data: result
  });
});

const updateEvent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;
  const updateData = req.body;

  const result = await eventService.updateEvent(
    id, 
    updateData, 
    new Types.ObjectId(user!.schoolId!), 
    new Types.ObjectId(user!.id)
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Event updated successfully',
    data: result
  });
});

const deleteEvent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  await eventService.deleteEvent(
    id, 
    new Types.ObjectId(user!.schoolId!), 
    new Types.ObjectId(user!.id)
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Event deleted successfully',
    data: null
  });
});

export const eventController = {
  createEvent,
  getEvents,
  getTodaysEvents,
  getUpcomingEvents,
  getEventById,
  updateEvent,
  deleteEvent
};