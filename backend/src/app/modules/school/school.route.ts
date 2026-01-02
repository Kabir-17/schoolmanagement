import express from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { requireSuperadmin, requireSchoolAdmin } from "../../middlewares/auth";
import {
  createSchoolValidationSchema,
  updateSchoolValidationSchema,
  getSchoolValidationSchema,
  deleteSchoolValidationSchema,
  getSchoolsValidationSchema,
} from "./school.validation";
import {
  createSchool,
  getAllSchools,
  getSchool,
  updateSchool,
  deleteSchool,
  getSchoolStats,
  assignAdmin,
  updateSchoolStatus,
  regenerateApiKey,
  getSystemStats,
  getAttendanceApiInfo,
} from "./school.controller";

const router = express.Router();

// Root routes
router.post(
  "/",
  requireSuperadmin,
  validateRequest(createSchoolValidationSchema),
  createSchool
);

router.get(
  "/",
  requireSuperadmin,
  validateRequest(getSchoolsValidationSchema),
  getAllSchools
);

// Static routes (must come before /:id routes)
router.get("/system/stats", requireSuperadmin, getSystemStats);

// Parameterized routes (must come after static routes)
router.delete(
  "/:id",
  requireSuperadmin,
  validateRequest(deleteSchoolValidationSchema),
  deleteSchool
);

router.get(
  "/:id",
  requireSchoolAdmin,
  validateRequest(getSchoolValidationSchema),
  getSchool
);

router.put(
  "/:id",
  requireSchoolAdmin,
  validateRequest(updateSchoolValidationSchema),
  updateSchool
);

router.get("/:id/stats", requireSuperadmin, getSchoolStats);

router.post("/:id/assign-admin", requireSuperadmin, assignAdmin);

router.put("/:id/status", requireSuperadmin, updateSchoolStatus);

router.post("/:id/regenerate-api-key", requireSuperadmin, regenerateApiKey);

export const schoolRoutes = router;
