import { Request, Response } from 'express';
import { homeworkService } from './homework.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { AppError } from '../../errors/AppError';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { Teacher } from '../teacher/teacher.model';
import { Student } from '../student/student.model';

// Create homework
const createHomework = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user, teacher } = req;
  
  if (!user || user.role !== 'teacher' || !teacher) {
    throw new AppError(403, 'Only teachers can create homework');
  }

  // Teacher info is already available from addTeacherContext middleware
  // and teacherId/schoolId are already added to req.body

  // Handle file uploads if any
  const files = req.files as Express.Multer.File[] | undefined;

  const homework = await homeworkService.createHomework(req.body, teacher._id.toString(), files);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Homework created successfully',
    data: homework,
  });
});

// Get homework by ID
const getHomeworkById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  if (!user) {
    throw new AppError(401, 'Authentication required');
  }

  const homework = await homeworkService.getHomeworkById(id, user.id, user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Homework retrieved successfully',
    data: homework,
  });
});

// Update homework
const updateHomework = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { user, teacher } = req;

  if (!user || user.role !== 'teacher' || !teacher) {
    throw new AppError(403, 'Only teachers can update homework');
  }

  // Teacher info is already available from addTeacherContext middleware
  // and teacherId/schoolId are already added to req.body if needed

  // Handle file uploads if any
  const files = req.files as Express.Multer.File[] | undefined;

  const homework = await homeworkService.updateHomework(id, req.body, user.id, files);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Homework updated successfully',
    data: homework,
  });
});

// Delete homework
const deleteHomework = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  if (!user || user.role !== 'teacher') {
    throw new AppError(403, 'Only teachers can delete homework');
  }

  await homeworkService.deleteHomework(id, user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Homework deleted successfully',
    data: null,
  });
});

// Publish homework
const publishHomework = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  if (!user || user.role !== 'teacher') {
    throw new AppError(403, 'Only teachers can publish homework');
  }

  const homework = await homeworkService.publishHomework(id, user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Homework published successfully',
    data: homework,
  });
});

// Get homework for teacher
const getHomeworkForTeacher = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;

  if (!user || user.role !== 'teacher') {
    throw new AppError(403, 'Only teachers can access this endpoint');
  }

  // Get teacher info from user id
  const teacher = await Teacher.findOne({ userId: user.id });
  if (!teacher) {
    throw new AppError(404, 'Teacher not found');
  }

  const homework = await homeworkService.getHomeworkForTeacher(teacher._id.toString(), req.query as any);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Teacher homework retrieved successfully',
    data: homework,
  });
});

// Get homework for student
const getHomeworkForStudent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;

  if (!user || user.role !== 'student') {
    throw new AppError(403, 'Only students can access this endpoint');
  }

  // Get student info from user id
  const student = await Student.findOne({ userId: user.id });
  if (!student) {
    throw new AppError(404, 'Student not found');
  }

  const homework = await homeworkService.getHomeworkForStudent(student._id.toString(), req.query as any);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Student homework retrieved successfully',
    data: homework,
  });
});

// Get homework for class
const getHomeworkForClass = catchAsync(async (req: Request, res: Response) => {
  const { schoolId, grade } = req.params;
  const { section } = req.query;

  const homework = await homeworkService.getHomeworkForClass(
    schoolId,
    parseInt(grade),
    section as string,
    req.query as any
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Class homework retrieved successfully',
    data: homework,
  });
});

// Submit homework
const submitHomework = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;

  if (!user || user.role !== 'student') {
    throw new AppError(403, 'Only students can submit homework');
  }

  // Get student info from user id
  const student = await Student.findOne({ userId: user.id });
  if (!student) {
    throw new AppError(404, 'Student not found');
  }

  // Ensure student is submitting for themselves
  req.body.studentId = student._id.toString();

  const submission = await homeworkService.submitHomework(req.body, user.id);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Homework submitted successfully',
    data: submission,
  });
});

// Grade homework submission
const gradeHomeworkSubmission = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  const { submissionId, marksObtained, feedback, teacherComments } = req.body;

  if (!user || user.role !== 'teacher') {
    throw new AppError(403, 'Only teachers can grade homework');
  }

  const gradedSubmission = await homeworkService.gradeHomeworkSubmission(
    submissionId,
    marksObtained,
    feedback,
    teacherComments,
    user.id
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Homework graded successfully',
    data: gradedSubmission,
  });
});

// Get homework submissions
const getHomeworkSubmissions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  if (!user || user.role !== 'teacher') {
    throw new AppError(403, 'Only teachers can view homework submissions');
  }

  const submissions = await homeworkService.getHomeworkSubmissions(id, user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Homework submissions retrieved successfully',
    data: submissions,
  });
});

// Get homework calendar
const getHomeworkCalendar = catchAsync(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { startDate, endDate, grade, section } = req.query;

  if (!startDate || !endDate) {
    throw new AppError(400, 'Start date and end date are required');
  }

  const calendar = await homeworkService.getHomeworkCalendar(
    schoolId,
    startDate as string,
    endDate as string,
    grade ? parseInt(grade as string) : undefined,
    section as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Homework calendar retrieved successfully',
    data: calendar,
  });
});

// Request revision
const requestRevision = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  const { submissionId, reason } = req.body;

  if (!user || user.role !== 'teacher') {
    throw new AppError(403, 'Only teachers can request revisions');
  }

  const submission = await homeworkService.requestRevision(submissionId, reason, user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Revision requested successfully',
    data: submission,
  });
});

// Get homework statistics for dashboard
const getHomeworkStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;

  if (!user) {
    throw new AppError(401, 'Authentication required');
  }

  let stats: any = {};

  if (user.role === 'teacher') {
    // Get teacher info from user id
    const teacher = await Teacher.findOne({ userId: user.id });
    if (!teacher) {
      throw new AppError(404, 'Teacher not found');
    }

    // Get teacher's homework statistics
    const homework = await homeworkService.getHomeworkForTeacher(teacher._id.toString());
    
    stats = {
      totalHomework: homework.length,
      publishedHomework: homework.filter(hw => hw.isPublished).length,
      draftHomework: homework.filter(hw => !hw.isPublished).length,
      overdueHomework: homework.filter(hw => hw.isOverdue).length,
      dueTodayHomework: homework.filter(hw => hw.isDueToday).length,
      upcomingHomework: homework.filter(hw => hw.daysUntilDue > 0 && hw.daysUntilDue <= 7).length,
      byPriority: {
        urgent: homework.filter(hw => hw.priority === 'urgent').length,
        high: homework.filter(hw => hw.priority === 'high').length,
        medium: homework.filter(hw => hw.priority === 'medium').length,
        low: homework.filter(hw => hw.priority === 'low').length,
      },
      byType: {
        assignment: homework.filter(hw => hw.homeworkType === 'assignment').length,
        project: homework.filter(hw => hw.homeworkType === 'project').length,
        reading: homework.filter(hw => hw.homeworkType === 'reading').length,
        practice: homework.filter(hw => hw.homeworkType === 'practice').length,
        research: homework.filter(hw => hw.homeworkType === 'research').length,
        presentation: homework.filter(hw => hw.homeworkType === 'presentation').length,
        other: homework.filter(hw => hw.homeworkType === 'other').length,
      },
    };
  } else if (user.role === 'student') {
    // Get student info from user id
    const student = await Student.findOne({ userId: user.id });
    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    // Get student's homework statistics
    const homework = await homeworkService.getHomeworkForStudent(student._id.toString());
    
    const submittedHomework = homework.filter(hw => hw.mySubmission);
    const gradedHomework = submittedHomework.filter(hw => hw.mySubmission?.status === 'graded');
    const pendingHomework = homework.filter(hw => !hw.mySubmission);
    const overdueHomework = homework.filter(hw => hw.isOverdue && !hw.mySubmission);

    stats = {
      totalHomework: homework.length,
      submittedHomework: submittedHomework.length,
      gradedHomework: gradedHomework.length,
      pendingHomework: pendingHomework.length,
      overdueHomework: overdueHomework.length,
      dueTodayHomework: homework.filter(hw => hw.isDueToday && !hw.mySubmission).length,
      upcomingHomework: homework.filter(hw => hw.daysUntilDue > 0 && hw.daysUntilDue <= 7 && !hw.mySubmission).length,
      averageGrade: gradedHomework.length > 0 
        ? gradedHomework.reduce((sum, hw) => sum + (hw.mySubmission?.percentage || 0), 0) / gradedHomework.length 
        : 0,
      submissionRate: homework.length > 0 ? (submittedHomework.length / homework.length) * 100 : 0,
      onTimeSubmissions: submittedHomework.filter(hw => !hw.mySubmission?.isLate).length,
      lateSubmissions: submittedHomework.filter(hw => hw.mySubmission?.isLate).length,
    };
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Homework statistics retrieved successfully',
    data: stats,
  });
});

// Get homework by student (for admin/teacher view)
const getHomeworkByStudent = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;

  const homework = await homeworkService.getHomeworkForStudent(studentId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Student homework retrieved successfully',
    data: homework,
  });
});

// Get upcoming homework
const getUpcomingHomework = catchAsync(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { days = '7' } = req.query;

  // This would be a method in the service to get upcoming homework
  // For now, using the existing method with filters
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Upcoming homework retrieved successfully',
    data: [], // Placeholder
  });
});

// Get overdue homework
const getOverdueHomework = catchAsync(async (req: Request, res: Response) => {
  const { schoolId } = req.params;

  // This would be a method in the service to get overdue homework
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Overdue homework retrieved successfully',
    data: [], // Placeholder
  });
});

export const HomeworkController = {
  createHomework,
  getHomeworkById,
  updateHomework,
  deleteHomework,
  publishHomework,
  getHomeworkForTeacher,
  getHomeworkForStudent,
  getHomeworkForClass,
  submitHomework,
  gradeHomeworkSubmission,
  getHomeworkSubmissions,
  getHomeworkCalendar,
  requestRevision,
  getHomeworkStats,
  getHomeworkByStudent,
  getUpcomingHomework,
  getOverdueHomework,
};