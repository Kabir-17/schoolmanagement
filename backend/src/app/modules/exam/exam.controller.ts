import { Request, Response } from 'express';
import { examService } from './exam.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { AppError } from '../../errors/AppError';
import { AuthenticatedRequest } from '../../middlewares/auth';

// Create exam
const createExam = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  
  if (!user || !['teacher', 'admin', 'superadmin'].includes(user.role)) {
    throw new AppError(403, 'Only teachers and admins can create exams');
  }

  const exam = await examService.createExam(req.body, user.id);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Exam created successfully',
    data: exam,
  });
});

// Get exam by ID
const getExamById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  if (!user) {
    throw new AppError(401, 'Authentication required');
  }

  const exam = await examService.getExamById(id, user.id, user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exam retrieved successfully',
    data: exam,
  });
});

// Update exam
const updateExam = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  if (!user || !['teacher', 'admin', 'superadmin'].includes(user.role)) {
    throw new AppError(403, 'Only teachers and admins can update exams');
  }

  const exam = await examService.updateExam(id, req.body, user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exam updated successfully',
    data: exam,
  });
});

// Delete exam
const deleteExam = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  if (!user || !['teacher', 'admin', 'superadmin'].includes(user.role)) {
    throw new AppError(403, 'Only teachers and admins can delete exams');
  }

  await examService.deleteExam(id, user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exam deleted successfully',
    data: null,
  });
});

// Publish exam
const publishExam = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  if (!user || !['teacher', 'admin', 'superadmin'].includes(user.role)) {
    throw new AppError(403, 'Only teachers and admins can publish exams');
  }

  const exam = await examService.publishExam(id, user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exam published successfully',
    data: exam,
  });
});

// Get exams for teacher
const getExamsForTeacher = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;

  if (!user || !['teacher', 'admin', 'superadmin'].includes(user.role)) {
    throw new AppError(403, 'Only teachers and admins can access this endpoint');
  }

  // For teachers, get their own exams; for admins, get all exams or specific teacher's exams
  // We need to find the teacher record from the userId since it's not directly in user object
  const { Teacher } = require('../teacher/teacher.model');
  let teacherId;
  
  if (user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: user.id });
    if (!teacher) {
      throw new AppError(404, 'Teacher record not found');
    }
    teacherId = teacher._id.toString();
  } else if (['admin', 'superadmin'].includes(user.role) && req.query.teacherId) {
    teacherId = req.query.teacherId as string;
  }

  if (!teacherId) {
    throw new AppError(400, 'Teacher ID is required');
  }

  const exams = await examService.getExamsForTeacher(teacherId, req.query as any);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Teacher exams retrieved successfully',
    data: exams,
  });
});

// Get exams for student
const getExamsForStudent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;

  if (!user || !['student', 'parent', 'teacher', 'admin'].includes(user.role)) {
    throw new AppError(403, 'Access denied');
  }

  const { Student } = require('../student/student.model');
  let studentId;
  
  if (user.role === 'student') {
    const student = await Student.findOne({ userId: user.id });
    if (!student) {
      throw new AppError(404, 'Student record not found');
    }
    studentId = student._id.toString();
  } else if (['parent', 'teacher', 'admin', 'superadmin'].includes(user.role) && req.query.studentId) {
    studentId = req.query.studentId as string;
  }

  if (!studentId) {
    throw new AppError(400, 'Student ID is required');
  }

  const exams = await examService.getExamsForStudent(studentId, req.query as any);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Student exams retrieved successfully',
    data: exams,
  });
});

// Get exams for class
const getExamsForClass = catchAsync(async (req: Request, res: Response) => {
  const { schoolId, grade } = req.params;
  const { section } = req.query;

  const exams = await examService.getExamsForClass(
    schoolId,
    parseInt(grade),
    section as string,
    req.query as any
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Class exams retrieved successfully',
    data: exams,
  });
});

// Get exam schedule
const getExamSchedule = catchAsync(async (req: Request, res: Response) => {
  const { schoolId, grade } = req.params;
  const { section, startDate, endDate } = req.query;

  const schedule = await examService.getExamSchedule(
    schoolId,
    parseInt(grade),
    section as string,
    startDate as string,
    endDate as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exam schedule retrieved successfully',
    data: schedule,
  });
});

// Submit exam results
const submitExamResults = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;

  if (!user || !['teacher', 'admin', 'superadmin'].includes(user.role)) {
    throw new AppError(403, 'Only teachers and admins can submit exam results');
  }

  const results = await examService.submitExamResults(req.body, user.id);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Exam results submitted successfully',
    data: results,
  });
});

// Publish exam results
const publishExamResults = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  if (!user || !['teacher', 'admin', 'superadmin'].includes(user.role)) {
    throw new AppError(403, 'Only teachers and admins can publish exam results');
  }

  const exam = await examService.publishExamResults(id, user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exam results published successfully',
    data: exam,
  });
});

// Get exam results
const getExamResults = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { examId } = req.params;
  const { user } = req;

  if (!user) {
    throw new AppError(401, 'Authentication required');
  }

  const results = await examService.getExamResults(examId, user.id, user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exam results retrieved successfully',
    data: results,
  });
});

// Get exam statistics
const getExamStatistics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { examId } = req.params;
  const { user } = req;

  if (!user || !['teacher', 'admin', 'superadmin'].includes(user.role)) {
    throw new AppError(403, 'Only teachers and admins can view exam statistics');
  }

  const stats = await examService.getExamStatistics(examId, user.id, user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exam statistics retrieved successfully',
    data: stats,
  });
});

// Get upcoming exams
const getUpcomingExams = catchAsync(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { days = '30' } = req.query;

  const exams = await examService.getUpcomingExams(schoolId, parseInt(days as string));

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Upcoming exams retrieved successfully',
    data: exams,
  });
});

// Get exam calendar
const getExamCalendar = catchAsync(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new AppError(400, 'Start date and end date are required');
  }

  const calendar = await examService.getExamCalendar(
    schoolId,
    startDate as string,
    endDate as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exam calendar retrieved successfully',
    data: calendar,
  });
});

// Get exam dashboard stats
const getExamDashboardStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;

  if (!user) {
    throw new AppError(401, 'Authentication required');
  }

  let stats: any = {};

  if (['teacher', 'admin', 'superadmin'].includes(user.role)) {
    // Get teacher's exam statistics
    const { Teacher } = require('../teacher/teacher.model');
    let teacherId;
    
    if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: user.id });
      if (teacher) {
        teacherId = teacher._id.toString();
      }
    } else if (req.query.teacherId) {
      teacherId = req.query.teacherId;
    }
    
    if (teacherId) {
      const exams = await examService.getExamsForTeacher(teacherId as string);
      
      stats = {
        totalExams: exams.length,
        upcomingExams: exams.filter(exam => exam.status === 'upcoming').length,
        ongoingExams: exams.filter(exam => exam.status === 'ongoing').length,
        completedExams: exams.filter(exam => exam.status === 'completed').length,
        publishedExams: exams.filter(exam => exam.isPublished).length,
        resultsPublished: exams.filter(exam => exam.resultsPublished).length,
        byExamType: {
          'unit-test': exams.filter(exam => exam.examType === 'unit-test').length,
          'mid-term': exams.filter(exam => exam.examType === 'mid-term').length,
          'final': exams.filter(exam => exam.examType === 'final').length,
          'quarterly': exams.filter(exam => exam.examType === 'quarterly').length,
          'half-yearly': exams.filter(exam => exam.examType === 'half-yearly').length,
          'annual': exams.filter(exam => exam.examType === 'annual').length,
          'entrance': exams.filter(exam => exam.examType === 'entrance').length,
          'mock': exams.filter(exam => exam.examType === 'mock').length,
        },
      };
    }
  } else if (user.role === 'student') {
    // Get student's exam statistics
    const { Student } = require('../student/student.model');
    let studentId;
    
    if (user.role === 'student') {
      const student = await Student.findOne({ userId: user.id });
      if (student) {
        studentId = student._id.toString();
      }
    }
    
    if (studentId) {
      const exams = await examService.getExamsForStudent(studentId);
      
      const upcomingExams = exams.filter(exam => exam.status === 'upcoming');
      const completedExams = exams.filter(exam => exam.status === 'completed');
      const resultsAvailable = exams.filter(exam => exam.resultsPublished);

      stats = {
        totalExams: exams.length,
        upcomingExams: upcomingExams.length,
        completedExams: completedExams.length,
        resultsAvailable: resultsAvailable.length,
        nextExam: upcomingExams.length > 0 ? upcomingExams
          .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())[0] : null,
        recentResults: resultsAvailable
          .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime())
          .slice(0, 5),
        examTypes: exams.reduce((acc, exam) => {
          acc[exam.examType] = (acc[exam.examType] || 0) + 1;
          return acc;
        }, {} as any),
      };
    }
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exam dashboard statistics retrieved successfully',
    data: stats,
  });
});

// Get student exam results (for parent/admin view)
const getStudentExamResults = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;

  // This would get all exam results for a specific student
  // Implementation would involve getting student's exams and their results
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Student exam results retrieved successfully',
    data: [], // Placeholder
  });
});

export const ExamController = {
  createExam,
  getExamById,
  updateExam,
  deleteExam,
  publishExam,
  getExamsForTeacher,
  getExamsForStudent,
  getExamsForClass,
  getExamSchedule,
  submitExamResults,
  publishExamResults,
  getExamResults,
  getExamStatistics,
  getUpcomingExams,
  getExamCalendar,
  getExamDashboardStats,
  getStudentExamResults,
};