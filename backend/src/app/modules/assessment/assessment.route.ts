import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserRole } from "../user/user.interface";
import { AssessmentController } from "./assessment.controller";
import {
  createAssessmentSchema,
  updateAssessmentSchema,
  submitResultsSchema,
  exportAssessmentSchema,
  teacherPerformanceQuerySchema,
  exportAllTeacherAssessmentsSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  adminExportAssessmentsSchema,
  adminUpdateAssessmentPreferenceSchema,
} from "./assessment.validation";

const router = Router();

// Teacher routes
router.get(
  "/teacher/assignments",
  authenticate,
  authorize(UserRole.TEACHER),
  AssessmentController.getTeacherAssignments
);

router.get(
  "/teacher",
  authenticate,
  authorize(UserRole.TEACHER),
  AssessmentController.listTeacherAssessments
);

router.get(
  "/teacher/performance",
  authenticate,
  authorize(UserRole.TEACHER),
  validateRequest(teacherPerformanceQuerySchema),
  AssessmentController.getTeacherPerformanceMatrix
);

router.get(
  "/teacher/export",
  authenticate,
  authorize(UserRole.TEACHER),
  validateRequest(exportAllTeacherAssessmentsSchema),
  AssessmentController.exportTeacherAssessments
);

router.post(
  "/",
  authenticate,
  authorize(UserRole.TEACHER),
  validateRequest(createAssessmentSchema),
  AssessmentController.createAssessment
);

// Categories
router.get(
  "/categories",
  authenticate,
  authorize(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN),
  AssessmentController.listCategories
);

router.post(
  "/categories",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
  validateRequest(categoryCreateSchema),
  AssessmentController.createCategory
);

router.patch(
  "/categories/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
  validateRequest(categoryUpdateSchema),
  AssessmentController.updateCategory
);

// Admin class overview routes
router.get(
  "/admin",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
  AssessmentController.listAdminAssessments
);

router.get(
  "/admin/export",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
  validateRequest(adminExportAssessmentsSchema),
  AssessmentController.exportAdminAssessments
);

router.get(
  "/admin/classes",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
  AssessmentController.getAdminClasses
);

router.patch(
  "/admin/:id/preferences",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
  validateRequest(adminUpdateAssessmentPreferenceSchema),
  AssessmentController.updateAdminAssessmentPreference
);

// Student & parent
router.get(
  "/student",
  authenticate,
  authorize(UserRole.STUDENT),
  AssessmentController.getStudentAssessments
);

router.get(
  "/student/:studentId",
  authenticate,
  authorize(
    UserRole.PARENT,
    UserRole.ADMIN,
    UserRole.SUPERADMIN,
    UserRole.TEACHER
  ),
  AssessmentController.getStudentAssessments
);

router.get(
  "/:id",
  authenticate,
  authorize(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN),
  AssessmentController.getAssessmentDetails
);

router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.TEACHER),
  validateRequest(updateAssessmentSchema),
  AssessmentController.updateAssessment
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.TEACHER),
  AssessmentController.deleteAssessment
);

router.post(
  "/:id/results",
  authenticate,
  authorize(UserRole.TEACHER),
  validateRequest(submitResultsSchema),
  AssessmentController.submitAssessmentResults
);

router.get(
  "/:id/export",
  authenticate,
  authorize(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN),
  validateRequest(exportAssessmentSchema),
  AssessmentController.exportAssessment
);

export const assessmentRoutes = router;
