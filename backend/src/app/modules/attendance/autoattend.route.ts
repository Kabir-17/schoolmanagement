import express from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { authenticate } from "../../middlewares/auth";
import { autoAttendEventValidationSchema } from "./attendance.validation";
import {
  processAutoAttendEvent,
  getAttendanceEvents,
  getAttendanceEventStats,
  updateAttendanceEventStatus,
  getReconciliationReport,
  getAttendanceSuggestions,
} from "./autoattend.controller";

const router = express.Router();

// Get attendance event statistics (must be before /events to avoid param collision)
router.get("/events/stats", authenticate, getAttendanceEventStats);

// Get all attendance events for the school
router.get("/events", authenticate, getAttendanceEvents);

// Update event status (review, ignore, supersede)
router.patch("/events/:eventId", authenticate, updateAttendanceEventStatus);

// Get reconciliation report (camera events vs teacher marks)
router.get("/reconcile", authenticate, getReconciliationReport);

// Get attendance suggestions from camera events
router.get("/suggest", authenticate, getAttendanceSuggestions);


router.post(
  "/:schoolSlug/events",
  express.json(), // ensure JSON body parsing
  validateRequest(autoAttendEventValidationSchema),
  processAutoAttendEvent
);

export const autoAttendRoutes = router;
