import express from "express";
import { authenticate, requireSuperadmin } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
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
  getAdminCredentials,
  resetAdminPassword,
} from "../school/school.controller";
import {
  createSchoolValidationSchema,
  getSchoolsValidationSchema,
  getSchoolValidationSchema,
  updateSchoolValidationSchema,
  deleteSchoolValidationSchema,
} from "../school/school.validation";
import {
  getOrangeSmsConfig,
  updateOrangeSmsConfig,
  sendOrangeSmsTest,
} from "../orange-sms/orange-sms.controller";
import {
  updateOrangeSmsValidationSchema,
  sendOrangeSmsTestValidationSchema,
} from "../orange-sms/orange-sms.validation";

const router = express.Router();

// All superadmin routes require authentication first, then superadmin authorization
router.use(authenticate);
router.use(requireSuperadmin);

// School management routes
router.post(
  "/schools",
  validateRequest(createSchoolValidationSchema),
  createSchool
);
router.get(
  "/schools",
  validateRequest(getSchoolsValidationSchema),
  getAllSchools
);
router.get(
  "/schools/:id",
  validateRequest(getSchoolValidationSchema),
  getSchool
);
router.put(
  "/schools/:id",
  validateRequest(updateSchoolValidationSchema),
  updateSchool
);
router.delete(
  "/schools/:id",
  validateRequest(deleteSchoolValidationSchema),
  deleteSchool
);
router.get("/schools/:id/stats", getSchoolStats);
router.post("/schools/:id/assign-admin", assignAdmin);
router.put("/schools/:id/status", updateSchoolStatus);
router.post("/schools/:id/regenerate-api-key", regenerateApiKey);

// Admin credential management
router.get("/schools/:id/admin/credentials", getAdminCredentials);
router.post("/schools/:id/admin/reset-password", resetAdminPassword);

// System-wide endpoints
router.get("/stats", getSystemStats);
router.get("/system/stats", getSystemStats);
router.get("/orange-sms", getOrangeSmsConfig);
router.put(
  "/orange-sms",
  validateRequest(updateOrangeSmsValidationSchema),
  updateOrangeSmsConfig
);
router.post(
  "/orange-sms/test",
  validateRequest(sendOrangeSmsTestValidationSchema),
  sendOrangeSmsTest
);

// router.get('/system/settings', (req, res) => {
//   res.json({
//     success: true,
//     message: 'System settings retrieved successfully',
//     data: {
//       general: {
//         siteName: 'School Management System',
//         siteUrl: 'http://localhost:3000',
//         timezone: 'America/New_York',
//         language: 'English',
//         currency: 'USD',
//         dateFormat: 'MM/DD/YYYY',
//         timeFormat: '12-hour',
//       },
//       // Add other default settings as needed
//     }
//   });
// });

router.put("/system/settings", (req, res) => {
  res.json({
    success: true,
    message: "System settings updated successfully",
    data: req.body,
  });
});

export const superadminRoutes = router;
