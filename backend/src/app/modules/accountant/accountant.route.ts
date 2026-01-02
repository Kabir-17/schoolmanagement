import { Router } from "express";
import multer from "multer";
import { authenticate, authorize } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { parseAccountantData } from "../../middlewares/parseAccountantData";
import { UserRole } from "../user/user.interface";
import { AccountantController } from "./accountant.controller";
import {
  createAccountantValidationSchema,
  updateAccountantValidationSchema,
  getAccountantValidationSchema,
  deleteAccountantValidationSchema,
  getAccountantsValidationSchema,
  uploadPhotosValidationSchema,
  deletePhotoValidationSchema,
  getAccountantsByDepartmentSchema,
  getAccountantsStatsValidationSchema,
} from "./accountant.validation";

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

// Accountant CRUD routes
router.post(
  "/",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  upload.array("photos", 20), // Support up to 20 photos
  parseAccountantData, // Parse JSON strings from FormData
  validateRequest(createAccountantValidationSchema),
  AccountantController.createAccountant
);

router.get(
  "/",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(getAccountantsValidationSchema),
  AccountantController.getAllAccountants
);

router.get(
  "/stats/:schoolId",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(getAccountantsStatsValidationSchema),
  AccountantController.getAccountantStats
);

router.get(
  "/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(getAccountantValidationSchema),
  AccountantController.getAccountantById
);

router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(updateAccountantValidationSchema),
  AccountantController.updateAccountant
);

// Also support PUT method for compatibility
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(updateAccountantValidationSchema),
  AccountantController.updateAccountant
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  validateRequest(deleteAccountantValidationSchema),
  AccountantController.deleteAccountant
);

// Accountant credentials routes
router.get(
  "/:accountantId/credentials",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  AccountantController.getAccountantCredentials
);

router.post(
  "/:accountantId/credentials/reset",
  authenticate,
  authorize(UserRole.SUPERADMIN, UserRole.ADMIN),
  AccountantController.resetAccountantPassword
);

export const AccountantRoutes = router;
