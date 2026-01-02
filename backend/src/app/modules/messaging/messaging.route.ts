import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import { UserRole } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createThreadSchema,
  listMessagesQuerySchema,
  listThreadsQuerySchema,
  newMessageSchema,
} from "./messaging.validation";
import { messagingController } from "./messaging.controller";

const router = Router();

router.use(
  authenticate,
  authorize(UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
);

router.get(
  "/contacts",
  messagingController.listContacts
);

router.get(
  "/threads",
  validateRequest(listThreadsQuerySchema),
  messagingController.listThreads
);

router.post(
  "/threads",
  validateRequest(createThreadSchema),
  messagingController.createThread
);

router.get(
  "/threads/:id/messages",
  validateRequest(listMessagesQuerySchema),
  messagingController.listMessages
);

router.post(
  "/threads/:id/messages",
  validateRequest(newMessageSchema),
  messagingController.sendMessage
);

export const messagingRoutes = router;
