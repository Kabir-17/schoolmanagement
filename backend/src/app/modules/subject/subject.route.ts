import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserRole } from "../user/user.interface";
import { SubjectController } from "./subject.controller";
import {
  createSubjectValidationSchema,
  updateSubjectValidationSchema,
  getSubjectValidationSchema,
  deleteSubjectValidationSchema,
  getSubjectsValidationSchema,
} from "./subject.validation";

const router = Router();

// Subject CRUD routes
router.post(
  "/",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(createSubjectValidationSchema),
  SubjectController.createSubject
);

router.get(
  "/",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER),
  validateRequest(getSubjectsValidationSchema),
  SubjectController.getAllSubjects
);

router.get(
  "/school/:schoolId/grade/:grade",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER),
  SubjectController.getSubjectsByGrade
);

router.get(
  "/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER),
  validateRequest(getSubjectValidationSchema),
  SubjectController.getSubjectById
);

router.put(
  "/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(updateSubjectValidationSchema),
  SubjectController.updateSubject
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(deleteSubjectValidationSchema),
  SubjectController.deleteSubject
);

export const SubjectRoutes = router;
