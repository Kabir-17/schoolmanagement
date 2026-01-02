import express from "express";
import multer from "multer";
import {
  authenticate,
  requireSchoolAdmin,
  AuthenticatedRequest,
} from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { multerUpload } from "../../config/multer.config";
import { parseBody } from "../../middlewares/bodyParser";
import { parseTeacherData } from "../../middlewares/parseTeacherData";

// Create multer instance with memory storage
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 20,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Student imports
import {
  createStudentValidationSchema,
  getStudentsValidationSchema,
  getStudentValidationSchema,
  updateStudentValidationSchema,
  deleteStudentValidationSchema,
} from "../student/student.validation";
import { StudentController } from "../student/student.controller";

// Teacher imports
import {
  createTeacherValidationSchema,
  getTeachersValidationSchema,
  getTeacherValidationSchema,
  updateTeacherValidationSchema,
  deleteTeacherValidationSchema,
} from "../teacher/teacher.validation";
import { TeacherController } from "../teacher/teacher.controller";

// Credentials imports
import { CredentialsController } from "../user/userCredentials.controller";

// Subject imports
import {
  createSubjectValidationSchema,
  getSubjectsValidationSchema,
  getSubjectValidationSchema,
  updateSubjectValidationSchema,
  deleteSubjectValidationSchema,
} from "../subject/subject.validation";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} from "../subject/subject.controller";

// Schedule/Calendar imports (we'll create these)
import {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  createCalendarEvent,
  getAllCalendarEvents,
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
  getAdminDashboard,
} from "./admin.controller";
import {
  getAbsenceSmsLogsController,
  getAbsenceSmsOverviewController,
  triggerAbsenceSmsDispatchController,
  sendAbsenceSmsTestController,
} from "../attendance/absence-sms.controller";
import {
  getAbsenceSmsLogsValidationSchema,
  getAbsenceSmsOverviewValidationSchema,
  sendAbsenceSmsTestValidationSchema,
} from "../attendance/absence-sms.validation";
// import { getSchool } from "../school/school.controller";

const router = express.Router();

// Public lightweight export endpoints (used by external scripts)
// These endpoints accept admin username/password in the request body and
// return school / student data after verifying credentials.
import {
  listExportableSchools,
  exportStudentsForSchool,
} from "./admin.controller";
router.get("/export/schools", listExportableSchools);
router.post(
  "/export/schools/:schoolId/students",
  express.json(),
  exportStudentsForSchool
);

// All admin routes require authentication and admin permissions
router.use(authenticate);
router.use(requireSchoolAdmin);

// Dashboard endpoint
router.get("/dashboard", getAdminDashboard);

// Absence SMS monitoring routes
router.get(
  "/attendance/absence-sms/logs",
  validateRequest(getAbsenceSmsLogsValidationSchema),
  getAbsenceSmsLogsController
);
router.get(
  "/attendance/absence-sms/overview",
  validateRequest(getAbsenceSmsOverviewValidationSchema),
  getAbsenceSmsOverviewController
);
router.post(
  "/attendance/absence-sms/trigger",
  triggerAbsenceSmsDispatchController
);
router.post(
  "/attendance/absence-sms/test",
  validateRequest(sendAbsenceSmsTestValidationSchema),
  sendAbsenceSmsTestController
);
// router.get(
//   "/school/:id",
//   //validateRequest(getSchoolValidationSchema),
//   getSchool
// );

// Student management routes
router.post(
  "/students",
  memoryUpload.fields([{ name: "photos" }]),
  parseBody,
  validateRequest(createStudentValidationSchema),
  StudentController.createStudent
);

router.get(
  "/students",
  validateRequest(getStudentsValidationSchema),
  StudentController.getAllStudents
);
router.get(
  "/students/:id",
  validateRequest(getStudentValidationSchema),
  StudentController.getStudentById
);
router.put(
  "/students/:id",
  validateRequest(updateStudentValidationSchema),
  StudentController.updateStudent
);
router.delete(
  "/students/:id",
  validateRequest(deleteStudentValidationSchema),
  StudentController.deleteStudent
);

// Credentials management routes (admin/superadmin only)
router.get("/credentials", CredentialsController.getAllCredentials);
router.get(
  "/students/:studentId/credentials",
  CredentialsController.getStudentCredentials
);

// Teacher management routes
router.post(
  "/teachers",
  multerUpload.fields([{ name: "photo" }]),
  parseTeacherData,
  validateRequest(createTeacherValidationSchema),
  TeacherController.createTeacher
);
router.get(
  "/teachers",
  validateRequest(getTeachersValidationSchema),
  TeacherController.getAllTeachers
);
router.get(
  "/teachers/:id",
  validateRequest(getTeacherValidationSchema),
  TeacherController.getTeacherById
);
router.put(
  "/teachers/:id",
  validateRequest(updateTeacherValidationSchema),
  TeacherController.updateTeacher
);
router.delete(
  "/teachers/:id",
  validateRequest(deleteTeacherValidationSchema),
  TeacherController.deleteTeacher
);

// Subject management routes
router.post(
  "/subjects",
  validateRequest(createSubjectValidationSchema),
  createSubject
);
router.get(
  "/subjects",
  validateRequest(getSubjectsValidationSchema),
  getAllSubjects
);
router.get(
  "/subjects/:id",
  validateRequest(getSubjectValidationSchema),
  getSubjectById
);
router.put(
  "/subjects/:id",
  validateRequest(updateSubjectValidationSchema),
  updateSubject
);
router.delete(
  "/subjects/:id",
  validateRequest(deleteSubjectValidationSchema),
  deleteSubject
);

// Schedule management routes
router.post("/schedules", createSchedule);
router.get("/schedules", getAllSchedules);
router.get("/schedules/:id", getScheduleById);
router.put("/schedules/:id", updateSchedule);
router.delete("/schedules/:id", deleteSchedule);

// Calendar management routes
router.post(
  "/calendar",
  multerUpload.array("attachments", 5), // Allow up to 5 attachments
  parseBody,
  createCalendarEvent
);
router.get("/calendar", getAllCalendarEvents);
router.get("/calendar/:id", getCalendarEventById);
router.put(
  "/calendar/:id",
  multerUpload.array("attachments", 5), // Allow up to 5 attachments
  parseBody,
  updateCalendarEvent
);
router.delete("/calendar/:id", deleteCalendarEvent);

// Disciplinary Actions management routes
import {
  getAllDisciplinaryActions,
  resolveDisciplinaryAction,
  addDisciplinaryActionComment,
  getSchoolSettings,
  updateSchoolSettings,
  updateSectionCapacity,
  getSectionCapacityReport,
} from "./admin.controller";
import {
  resolveDisciplinaryActionValidationSchema,
  addDisciplinaryActionCommentValidationSchema,
} from "../teacher/teacher.validation";
import { getAttendanceApiInfo } from "../school/school.controller";

router.get("/disciplinary/actions", getAllDisciplinaryActions);
router.patch(
  "/disciplinary/actions/resolve/:actionId",
  validateRequest(resolveDisciplinaryActionValidationSchema),
  resolveDisciplinaryAction
);
router.post(
  "/disciplinary/actions/comment/:actionId",
  validateRequest(addDisciplinaryActionCommentValidationSchema),
  addDisciplinaryActionComment
);

// School Settings management routes
router.get("/school/settings", getSchoolSettings);
router.put("/school/settings", updateSchoolSettings);
router.put("/school/section-capacity", updateSectionCapacity);
router.get("/school/capacity-report", getSectionCapacityReport);
router.get('/school/attendance-api', getAttendanceApiInfo)

export const adminRoutes = router;
