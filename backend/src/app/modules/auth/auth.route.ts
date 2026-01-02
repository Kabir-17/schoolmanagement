import express from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { authenticate } from '../../middlewares/auth';
import {
  loginValidationSchema,
} from '../user/user.validation';
import {
  login,
  logout,
  forcePasswordChange,
  verify,
} from '../user/user.controller';

const router = express.Router();

// Authentication routes
router.post(
  '/login',
  validateRequest(loginValidationSchema),
  login
);

router.post(
  '/logout',
  logout
);

router.post(
  '/force-password-change',
  authenticate,
  forcePasswordChange
);

router.get(
  '/verify',
  authenticate,
  verify
);

export const authRoutes = router;