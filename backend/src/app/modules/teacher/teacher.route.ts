import { Router } from "express";
import multer from "multer";
import { authenticate, authorize } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { parseTeacherData } from "../../middlewares/parseTeacherData";
import { UserRole } from "../user/user.interface";
import { TeacherController } from "./teacher.controller";
import {
  createTeacherValidationSchema,
  updateTeacherValidationSchema,
  getTeacherValidationSchema,
  deleteTeacherValidationSchema,
  getTeachersValidationSchema,
  uploadPhotosValidationSchema,
  deletePhotoValidationSchema,
  getTeachersBySubjectSchema,
  getTeachersStatsValidationSchema,
  issuePunishmentValidationSchema,
  resolveDisciplinaryActionValidationSchema,
  addDisciplinaryActionCommentValidationSchema,
} from "./teacher.validation";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 20, // Maximum 20 files at once
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Teacher CRUD routes
router.post(
  "/",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  upload.array("photos", 20), // Support up to 20 photos
  parseTeacherData, // Parse JSON strings from FormData
  validateRequest(createTeacherValidationSchema),
  TeacherController.createTeacher
);

router.get(
  "/",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER),
  validateRequest(getTeachersValidationSchema),
  TeacherController.getAllTeachers
);

router.get(
  "/stats/:schoolId",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(getTeachersStatsValidationSchema),
  TeacherController.getTeacherStats
);

router.get(
  "/school/:schoolId/subject/:subject",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER),
  validateRequest(getTeachersBySubjectSchema),
  TeacherController.getTeachersBySubject
);

// Teacher Dashboard Routes (for logged-in teachers) - MUST come before /:id routes
router.get(
  "/dashboard",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.getDashboard
);

router.get(
  "/my-schedule",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.getMySchedule
);

router.get(
  "/my-classes",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.getMyClasses
);

router.get(
  "/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER),
  validateRequest(getTeacherValidationSchema),
  TeacherController.getTeacherById
);

router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(updateTeacherValidationSchema),
  TeacherController.updateTeacher
);

// Also support PUT method for compatibility
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(updateTeacherValidationSchema),
  TeacherController.updateTeacher
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(deleteTeacherValidationSchema),
  TeacherController.deleteTeacher
);

// Photo management routes
router.post(
  "/:id/photos",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  upload.array("photos"),
  validateRequest(uploadPhotosValidationSchema),
  TeacherController.uploadTeacherPhotos
);

router.get(
  "/:id/photos",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER),
  validateRequest(getTeacherValidationSchema),
  TeacherController.getTeacherPhotos
);

router.get(
  "/:id/photos/available-slots",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(getTeacherValidationSchema),
  TeacherController.getAvailablePhotoSlots
);

router.delete(
  "/:teacherId/photos/:photoId",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(deletePhotoValidationSchema),
  TeacherController.deleteTeacherPhoto
);

// Teacher credentials routes
router.get(
  "/:teacherId/credentials",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  TeacherController.getTeacherCredentials
);

router.post(
  "/:teacherId/credentials/reset",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  TeacherController.resetTeacherPassword
);

// Attendance Management Routes
router.get(
  "/attendance/periods",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.getCurrentPeriods
);

// Get students for current teacher's classes
router.get(
  "/attendance/my-students",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.getMyStudentsForAttendance
);

router.post(
  "/attendance/mark",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.markAttendance
);

router.get(
  "/attendance/students/:classId/:subjectId/:period",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.getStudentsForAttendance
);

// Homework Management Routes
router.post(
  "/homework/assign",
  authenticate,
  authorize(UserRole.TEACHER),
  upload.array("attachments", 5), // Allow up to 5 attachments
  TeacherController.assignHomework
);

router.get(
  "/homework/my-assignments",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.getMyHomeworkAssignments
);

// Disciplinary Actions Routes
router.post(
  "/discipline/warning",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.issueWarning
);

router.post(
  "/discipline/punishment",
  authenticate,
  authorize(UserRole.TEACHER),
  validateRequest(issuePunishmentValidationSchema),
  TeacherController.issuePunishment
);

router.post(
  "/discipline/red-warrant",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.issueRedWarrant
);

router.get(
  "/discipline/my-actions",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.getMyDisciplinaryActions
);

router.patch(
  "/discipline/resolve/:actionId",
  authenticate,
  authorize(UserRole.TEACHER, UserRole.ADMIN),
  validateRequest(resolveDisciplinaryActionValidationSchema),
  TeacherController.resolveDisciplinaryAction
);

router.post(
  "/discipline/comment/:actionId",
  authenticate,
  authorize(UserRole.TEACHER, UserRole.ADMIN),
  validateRequest(addDisciplinaryActionCommentValidationSchema),
  TeacherController.addDisciplinaryActionComment
);

// Student Management Routes
router.get(
  "/students/grade/:grade",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.getStudentsByGrade
);

router.get(
  "/students/grade/:grade/section/:section",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.getStudentsByGradeAndSection
);

// Get all students for this teacher (for discipline, etc.)
router.get(
  "/discipline/students",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.getTeacherStudents
);

// Grading Routes
router.get(
  "/grading/exams",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.getMyGradingTasks
);

// Alternative endpoint for grading tasks (frontend compatibility)
router.get(
  "/grading/tasks",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.getMyGradingTasks
);

router.get(
  "/grading/exam/:examId",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.getExamGradingDetails
);

router.get(
  "/grading/exam/:examId/item/:examItemId",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.getExamGradingDetailsWithItem
);

router.post(
  "/grading/submit",
  authenticate,
  authorize(UserRole.TEACHER),
  TeacherController.submitGrades
);

export const TeacherRoutes = router;
