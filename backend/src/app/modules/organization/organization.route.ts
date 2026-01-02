import express from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { authenticate, requireSuperadmin } from '../../middlewares/auth';
import {
  createOrganizationValidationSchema,
  updateOrganizationValidationSchema,
  getOrganizationValidationSchema,
  deleteOrganizationValidationSchema,
  getOrganizationsValidationSchema,
} from './organization.validation';
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getActiveOrganizations,
  getOrganizationStats,
} from './organization.controller';

const router = express.Router();

// Public routes (no authentication required)
router.get(
  '/active',
  getActiveOrganizations
);

// Protected routes (require superadmin access)
router.post(
  '/',
  authenticate,
  requireSuperadmin,
  validateRequest(createOrganizationValidationSchema),
  createOrganization
);

router.get(
  '/',
  authenticate,
  requireSuperadmin,
  validateRequest(getOrganizationsValidationSchema),
  getOrganizations
);

router.get(
  '/:id',
  authenticate,
  requireSuperadmin,
  validateRequest(getOrganizationValidationSchema),
  getOrganizationById
);

router.put(
  '/:id',
  authenticate,
  requireSuperadmin,
  validateRequest(updateOrganizationValidationSchema),
  updateOrganization
);

router.delete(
  '/:id',
  authenticate,
  requireSuperadmin,
  validateRequest(deleteOrganizationValidationSchema),
  deleteOrganization
);

router.get(
  '/:id/stats',
  authenticate,
  requireSuperadmin,
  validateRequest(getOrganizationValidationSchema),
  getOrganizationStats
);

export const organizationRoutes = router;