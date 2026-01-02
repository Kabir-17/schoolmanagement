import express from 'express';
import { ExamController } from './exam.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { ExamValidation } from './exam.validation';

const router = express.Router();

// Teacher/Admin routes - require teacher or admin authentication
router.post(
  '/create',
  authenticate,
  authorize('teacher', 'admin', 'superadmin'),
  validateRequest(ExamValidation.createExamValidation),
  ExamController.createExam
);

router.patch(
  '/:id',
  authenticate,
  authorize('teacher', 'admin', 'superadmin'),
  validateRequest(ExamValidation.examIdParamValidation),
  validateRequest(ExamValidation.updateExamValidation),
  ExamController.updateExam
);

router.delete(
  '/:id',
  authenticate,
  authorize('teacher', 'admin', 'superadmin'),
  validateRequest(ExamValidation.examIdParamValidation),
  ExamController.deleteExam
);

router.patch(
  '/:id/publish',
  authenticate,
  authorize('teacher', 'admin', 'superadmin'),
  validateRequest(ExamValidation.examIdParamValidation),
  ExamController.publishExam
);

router.patch(
  '/:id/publish-results',
  authenticate,
  authorize('teacher', 'admin', 'superadmin'),
  validateRequest(ExamValidation.examIdParamValidation),
  ExamController.publishExamResults
);

// Submit exam results
router.post(
  '/submit-results',
  authenticate,
  authorize('teacher', 'admin', 'superadmin'),
  validateRequest(ExamValidation.submitResultsValidation),
  ExamController.submitExamResults
);

// Get exams for teacher
router.get(
  '/teacher/my-exams',
  authenticate,
  authorize('teacher', 'admin', 'superadmin'),
  ExamController.getExamsForTeacher
);

// Get exams for student
router.get(
  '/student/my-exams',
  authenticate,
  authorize('student', 'parent', 'teacher', 'admin'),
  ExamController.getExamsForStudent
);

// Get exam results
router.get(
  '/:examId/results',
  authenticate,
  authorize('teacher', 'student', 'parent', 'admin', 'superadmin'),
  ExamController.getExamResults
);

// Get exam statistics
router.get(
  '/:examId/statistics',
  authenticate,
  authorize('teacher', 'admin', 'superadmin'),
  validateRequest(ExamValidation.getExamStatsValidation),
  ExamController.getExamStatistics
);

// Dashboard statistics
router.get(
  '/dashboard/stats',
  authenticate,
  authorize('teacher', 'student', 'admin', 'superadmin'),
  ExamController.getExamDashboardStats
);

// General authenticated routes
router.get(
  '/:id',
  authenticate,
  authorize('teacher', 'student', 'admin', 'parent', 'superadmin'),
  validateRequest(ExamValidation.examIdParamValidation),
  ExamController.getExamById
);

// Class and school management routes
router.get(
  '/class/:schoolId/:grade',
  authenticate,
  authorize('teacher', 'admin', 'student', 'parent', 'superadmin'),
  validateRequest(ExamValidation.getExamsByClassValidation),
  ExamController.getExamsForClass
);

// Exam schedule
router.get(
  '/schedule/:schoolId/:grade',
  authenticate,
  authorize('teacher', 'admin', 'student', 'parent', 'superadmin'),
  validateRequest(ExamValidation.getExamScheduleValidation),
  ExamController.getExamSchedule
);

// Calendar integration
router.get(
  '/calendar/:schoolId',
  authenticate,
  authorize('teacher', 'admin', 'student', 'parent', 'superadmin'),
  ExamController.getExamCalendar
);

// School-level overview routes
router.get(
  '/school/:schoolId/upcoming',
  authenticate,
  authorize('teacher', 'admin', 'superadmin'),
  ExamController.getUpcomingExams
);

// Student-specific routes for admin/teacher/parent view
router.get(
  '/student/:studentId/results',
  authenticate,
  authorize('teacher', 'admin', 'parent', 'superadmin'),
  validateRequest(ExamValidation.studentIdParamValidation),
  ExamController.getStudentExamResults
);

export const examRoutes = router;