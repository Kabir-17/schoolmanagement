import express from "express";
import { authenticate, authorize, enforceSchoolIsolation } from "../../middlewares/auth";
import { UserRole } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { multerUpload } from "../../config/multer.config";
import { parseBody } from "../../middlewares/bodyParser";
import { AcademicCalendarController } from "./academic-calendar.controller";
import { AcademicCalendarValidation } from "./academic-calendar.validation";

const router = express.Router();

// Create calendar event (Admin/Superadmin only)
router.post(
  "/",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  enforceSchoolIsolation,
  multerUpload.array("attachments", 5), // Allow up to 5 attachments
  parseBody,
  validateRequest(
    AcademicCalendarValidation.createAcademicCalendarValidationSchema
  ),
  AcademicCalendarController.createCalendarEvent
);

// Get all calendar events (All authenticated users)
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
  AcademicCalendarController.getAllCalendarEvents
);

// Get calendar statistics (Admin/Superadmin only)
router.get(
  "/stats/:schoolId",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  AcademicCalendarController.getCalendarStats
);

// Get monthly calendar view
router.get(
  "/monthly/:schoolId/:year/:month",
  authenticate,
  authorize(
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.ACCOUNTANT
  ),
  AcademicCalendarController.getMonthlyCalendar
);

// Get upcoming events
router.get(
  "/upcoming/:schoolId",
  authenticate,
  authorize(
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.ACCOUNTANT
  ),
  AcademicCalendarController.getUpcomingEvents
);

// Create exam schedule (Admin/Superadmin only)
router.post(
  "/exam-schedule",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(
    AcademicCalendarValidation.createExamScheduleValidationSchema
  ),
  AcademicCalendarController.createExamSchedule
);

// Get specific calendar event
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
  AcademicCalendarController.getCalendarEventById
);

// Update calendar event (Admin/Superadmin only)
router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  enforceSchoolIsolation,
  multerUpload.array("attachments", 5), // Allow up to 5 attachments
  parseBody,
  validateRequest(
    AcademicCalendarValidation.updateAcademicCalendarValidationSchema
  ),
  AcademicCalendarController.updateCalendarEvent
);

// Delete calendar event (Admin/Superadmin only)
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  enforceSchoolIsolation,
  AcademicCalendarController.deleteCalendarEvent
);

export const AcademicCalendarRoutes = router;
