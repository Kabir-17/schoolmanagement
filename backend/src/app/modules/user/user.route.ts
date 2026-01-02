import express from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  requireSuperadmin,
  requireSchoolAdmin,
  authenticate
} from '../../middlewares/auth';
import {
  createUserValidationSchema,
  updateUserValidationSchema,
  getUserValidationSchema,
  deleteUserValidationSchema,
  getUsersValidationSchema,
  changePasswordValidationSchema,
  resetPasswordValidationSchema,
} from './user.validation';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
  resetPassword,
  getCurrentUser,
  getUsersBySchool,
  getUsersByRole,
} from './user.controller';

const router = express.Router();

// Protected routes requiring authentication
router.get(
  '/me',
  authenticate, // Any authenticated user can access their own profile
  getCurrentUser
);

router.put(
  '/:id/change-password',
  authenticate, // Users can change their own password
  validateRequest(changePasswordValidationSchema),
  changePassword
);

// School-specific user routes
router.get(
  '/school/:schoolId',
  requireSchoolAdmin,
  getUsersBySchool
);

router.get(
  '/role/:role',
  requireSchoolAdmin,
  getUsersByRole
);

// Admin and Superadmin routes
router.post(
  '/',
  requireSchoolAdmin,
  validateRequest(createUserValidationSchema),
  createUser
);

router.get(
  '/',
  requireSchoolAdmin,
  validateRequest(getUsersValidationSchema),
  getUsers
);

router.get(
  '/:id',
  requireSchoolAdmin,
  validateRequest(getUserValidationSchema),
  getUserById
);

router.put(
  '/:id',
  requireSchoolAdmin,
  validateRequest(updateUserValidationSchema),
  updateUser
);

router.delete(
  '/:id',
  requireSchoolAdmin,
  validateRequest(deleteUserValidationSchema),
  deleteUser
);

// Password reset (admin only)
router.put(
  '/:id/reset-password',
  requireSchoolAdmin,
  validateRequest(resetPasswordValidationSchema),
  resetPassword
);

export const userRoutes = router;