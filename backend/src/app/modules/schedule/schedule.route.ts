import express from "express";
import { authenticate, authorize, enforceSchoolIsolation } from "../../middlewares/auth";
import { UserRole } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { ScheduleController } from "./schedule.controller";
import { ScheduleValidation } from "./schedule.validation";

const router = express.Router();

// Create single schedule (Admin/Superadmin only)
router.post(
  "/",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  enforceSchoolIsolation,
  validateRequest(ScheduleValidation.createScheduleValidationSchema),
  ScheduleController.createSchedule
);

// Bulk create schedules (Admin/Superadmin only)
router.post(
  "/bulk",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  enforceSchoolIsolation,
  validateRequest(ScheduleValidation.bulkCreateScheduleValidationSchema),
  ScheduleController.bulkCreateSchedules
);

// Get all schedules with filters (All authenticated users)
router.get(
  "/",
  authenticate,
  authorize(
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.ACCOUNTANT
  ),
  enforceSchoolIsolation,
  ScheduleController.getAllSchedules
);

// Get school schedule overview (Admin/Superadmin/Teacher)
router.get(
  "/school/:schoolId/overview",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER),
  ScheduleController.getSchoolScheduleOverview
);

// Get schedule statistics (Admin/Superadmin only)
router.get(
  "/stats/:schoolId",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  ScheduleController.getScheduleStats
);

// Get weekly schedule for a class (All authenticated users)
router.get(
  "/weekly/:schoolId/:grade/:section",
  authenticate,
  authorize(
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.ACCOUNTANT
  ),
  ScheduleController.getWeeklySchedule
);

// Get schedules by class (All authenticated users)
router.get(
  "/class/:schoolId/:grade/:section",
  authenticate,
  authorize(
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.ACCOUNTANT
  ),
  ScheduleController.getSchedulesByClass
);

router.delete(
  "/class/:grade/:section",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  enforceSchoolIsolation,
  ScheduleController.clearClassSchedule
);

// Get teacher's schedule and workload (All authenticated users)
router.get(
  "/teacher/:teacherId",
  authenticate,
  authorize(
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.ACCOUNTANT
  ),
  ScheduleController.getTeacherSchedule
);

// Get schedules by teacher (All authenticated users)
router.get(
  "/teacher/:teacherId/schedules",
  authenticate,
  authorize(
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.ACCOUNTANT
  ),
  ScheduleController.getSchedulesByTeacher
);

// Get schedules by subject (All authenticated users)
router.get(
  "/subject/:subjectId",
  authenticate,
  authorize(
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.ACCOUNTANT
  ),
  ScheduleController.getSchedulesBySubject
);

// Assign substitute teacher (Admin/Superadmin only)
router.patch(
  "/:scheduleId/substitute/:periodNumber",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(ScheduleValidation.assignSubstituteTeacherValidationSchema),
  ScheduleController.assignSubstituteTeacher
);

// Get specific schedule by ID (All authenticated users)
router.get(
  "/:id",
  authenticate,
  authorize(
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.ACCOUNTANT
  ),
  ScheduleController.getScheduleById
);

// Update schedule (Admin/Superadmin only)
router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  enforceSchoolIsolation,
  validateRequest(ScheduleValidation.updateScheduleValidationSchema),
  ScheduleController.updateSchedule
);

// Delete schedule (Admin/Superadmin only)
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  enforceSchoolIsolation,
  ScheduleController.deleteSchedule
);

export const ScheduleRoutes = router;
