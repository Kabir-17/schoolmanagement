import express from 'express';
import { authenticate, requireSchoolAdmin } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  getAbsenceSmsLogsController,
  getAbsenceSmsOverviewController,
  triggerAbsenceSmsDispatchController,
  sendAbsenceSmsTestController,
} from './absence-sms.controller';
import {
  getAbsenceSmsLogsValidationSchema,
  getAbsenceSmsOverviewValidationSchema,
  sendAbsenceSmsTestValidationSchema,
} from './absence-sms.validation';

const router = express.Router();

router.use(authenticate);
router.use(requireSchoolAdmin);

router.get(
  '/absence-sms/logs',
  validateRequest(getAbsenceSmsLogsValidationSchema),
  getAbsenceSmsLogsController
);

router.get(
  '/absence-sms/overview',
  validateRequest(getAbsenceSmsOverviewValidationSchema),
  getAbsenceSmsOverviewController
);

router.post('/absence-sms/trigger', triggerAbsenceSmsDispatchController);

router.post(
  '/absence-sms/test',
  validateRequest(sendAbsenceSmsTestValidationSchema),
  sendAbsenceSmsTestController
);

export const adminAbsenceSmsRoutes = router;
