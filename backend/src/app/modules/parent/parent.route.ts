import express from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import { UserRole } from "../user/user.interface";
import { ParentController } from "./parent.controller";

const router = express.Router();

// Parent dashboard route
router.get(
  "/dashboard",
  authenticate,
  authorize(UserRole.PARENT),
  ParentController.getParentDashboard
);

// Parent children route
router.get(
  "/children",
  authenticate,
  authorize(UserRole.PARENT),
  ParentController.getParentChildren
);

// Child attendance route
router.get(
  "/children/:childId/attendance",
  authenticate,
  authorize(UserRole.PARENT),
  ParentController.getChildAttendance
);

// Child homework route
router.get(
  "/children/:childId/homework",
  authenticate,
  authorize(UserRole.PARENT),
  ParentController.getChildHomework
);

router.get(
  "/children/:childId/grades",
  authenticate,
  authorize(UserRole.PARENT),
  ParentController.getChildGrades
);

// Child schedule route
router.get(
  "/children/:childId/schedule",
  authenticate,
  authorize(UserRole.PARENT),
  ParentController.getChildSchedule
);

// Child notices route
router.get(
  "/children/:childId/notices",
  authenticate,
  authorize(UserRole.PARENT),
  ParentController.getChildNotices
);

// Parent disciplinary actions route
router.get(
  "/disciplinary/actions",
  authenticate,
  authorize(UserRole.PARENT),
  ParentController.getChildDisciplinaryActions
);

export const parentRoutes = router;
