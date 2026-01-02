import express from 'express';
import { HomeworkController } from './homework.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { HomeworkValidation } from './homework.validation';
import { uploadHomeworkAttachments } from '../../middlewares/fileUpload';
import { parseHomeworkFormData } from '../../middlewares/parseFormData';
import { addTeacherContext } from '../../middlewares/addTeacherContext';

const router = express.Router();

// Teacher routes - require teacher authentication
router.post(
  '/create',
  authenticate,
  authorize('teacher'),
  uploadHomeworkAttachments, // Allow up to 5 attachments
  parseHomeworkFormData, // Parse FormData to proper types
  addTeacherContext, // Add teacher and school context before validation
  validateRequest(HomeworkValidation.createHomeworkValidation),
  HomeworkController.createHomework
);

router.patch(
  '/:id',
  authenticate,
  authorize('teacher'),
  uploadHomeworkAttachments, // Allow up to 5 attachments for updates
  parseHomeworkFormData, // Parse FormData to proper types
  addTeacherContext, // Add teacher and school context before validation
  validateRequest(HomeworkValidation.homeworkIdParamValidation),
  validateRequest(HomeworkValidation.updateHomeworkValidation),
  HomeworkController.updateHomework
);

router.delete(
  '/:id',
  authenticate,
  authorize('teacher'),
  validateRequest(HomeworkValidation.homeworkIdParamValidation),
  HomeworkController.deleteHomework
);

router.patch(
  '/:id/publish',
  authenticate,
  authorize('teacher'),
  validateRequest(HomeworkValidation.homeworkIdParamValidation),
  HomeworkController.publishHomework
);

router.get(
  '/teacher/my-homework',
  authenticate,
  authorize('teacher'),
  HomeworkController.getHomeworkForTeacher
);

router.get(
  '/:id/submissions',
  authenticate,
  authorize('teacher'),
  validateRequest(HomeworkValidation.homeworkIdParamValidation),
  HomeworkController.getHomeworkSubmissions
);

router.post(
  '/grade',
  authenticate,
  authorize('teacher'),
  validateRequest(HomeworkValidation.gradeHomeworkValidation),
  HomeworkController.gradeHomeworkSubmission
);

router.post(
  '/request-revision',
  authenticate,
  authorize('teacher'),
  validateRequest(HomeworkValidation.requestRevisionValidation),
  HomeworkController.requestRevision
);

// Student routes - require student authentication
router.get(
  '/student/my-homework',
  authenticate,
  authorize('student'),
  HomeworkController.getHomeworkForStudent
);

router.post(
  '/submit',
  authenticate,
  authorize('student'),
  validateRequest(HomeworkValidation.submitHomeworkValidation),
  HomeworkController.submitHomework
);

// General authenticated routes
router.get(
  '/stats',
  authenticate,
  authorize('teacher', 'student'),
  HomeworkController.getHomeworkStats
);

router.get(
  '/:id',
  authenticate,
  authorize('teacher', 'student', 'admin', 'parent'),
  validateRequest(HomeworkValidation.homeworkIdParamValidation),
  HomeworkController.getHomeworkById
);

// Admin/Teacher routes for class management
router.get(
  '/class/:schoolId/:grade',
  authenticate,
  authorize('teacher', 'admin', 'superadmin'),
  validateRequest(HomeworkValidation.getHomeworkByClassValidation),
  HomeworkController.getHomeworkForClass
);

// Calendar and analytics routes
router.get(
  '/calendar/:schoolId',
  authenticate,
  authorize('teacher', 'admin', 'student', 'parent'),
  validateRequest(HomeworkValidation.getHomeworkCalendarValidation),
  HomeworkController.getHomeworkCalendar
);

// Student-specific routes for admin/teacher view
router.get(
  '/student/:studentId',
  authenticate,
  authorize('teacher', 'admin', 'parent'),
  validateRequest(HomeworkValidation.getHomeworkByStudentValidation),
  HomeworkController.getHomeworkByStudent
);

// School-level overview routes
router.get(
  '/school/:schoolId/upcoming',
  authenticate,
  authorize('teacher', 'admin', 'superadmin'),
  HomeworkController.getUpcomingHomework
);

router.get(
  '/school/:schoolId/overdue',
  authenticate,
  authorize('teacher', 'admin', 'superadmin'),
  HomeworkController.getOverdueHomework
);

export const homeworkRoutes = router;