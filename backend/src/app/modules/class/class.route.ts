import express from 'express';
import { authenticate, requireSchoolAdmin, requireSuperadmin } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createClassValidationSchema,
  updateClassValidationSchema,
  getClassValidationSchema,
  deleteClassValidationSchema,
  getClassesValidationSchema,
  getClassesByGradeValidationSchema,
  getClassByGradeAndSectionValidationSchema,
  getClassStatsValidationSchema,
  checkCapacityValidationSchema,
  createNewSectionValidationSchema,
} from './class.validation';
import { ClassController } from './class.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin and Superadmin routes
router.post(
  '/',
  requireSchoolAdmin,
  validateRequest(createClassValidationSchema),
  ClassController.createClass
);

router.get(
  '/',
  requireSchoolAdmin,
  validateRequest(getClassesValidationSchema),
  ClassController.getAllClasses
);

router.get(
  '/school/:schoolId/stats',
  requireSchoolAdmin,
  validateRequest(getClassStatsValidationSchema),
  ClassController.getClassStats
);

router.get(
  '/school/:schoolId/grade/:grade',
  requireSchoolAdmin,
  validateRequest(getClassesByGradeValidationSchema),
  ClassController.getClassesByGrade
);

router.get(
  '/school/:schoolId/grade/:grade/section/:section',
  requireSchoolAdmin,
  validateRequest(getClassByGradeAndSectionValidationSchema),
  ClassController.getClassByGradeAndSection
);

router.get(
  '/school/:schoolId/grade/:grade/capacity',
  requireSchoolAdmin,
  validateRequest(checkCapacityValidationSchema),
  ClassController.checkCapacity
);

router.post(
  '/school/:schoolId/grade/:grade/new-section',
  requireSchoolAdmin,
  validateRequest(createNewSectionValidationSchema),
  ClassController.createNewSectionIfNeeded
);

router.get(
  '/:id',
  requireSchoolAdmin,
  validateRequest(getClassValidationSchema),
  ClassController.getClassById
);

router.put(
  '/:id',
  requireSchoolAdmin,
  validateRequest(updateClassValidationSchema),
  ClassController.updateClass
);

router.delete(
  '/:id',
  requireSchoolAdmin,
  validateRequest(deleteClassValidationSchema),
  ClassController.deleteClass
);

export const classRoutes = router;