import express from "express";
import * as feeController from "./fee.controller";
import { authenticate, authorize } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createFeeStructureSchema,
  updateFeeStructureSchema,
  getFeeStructureSchema,
  queryFeeStructuresSchema,
  waiveFeeSchema,
  getFinancialOverviewSchema,
  getDefaultersSchema,
  cancelTransactionSchema,
  getTransactionsSchema,
} from "./fee.validation";

const router = express.Router();

// Fee Structure Management (Admin only)
router.post(
  "/structures",
  authenticate,
  authorize("admin"),
  validateRequest(createFeeStructureSchema),
  feeController.createFeeStructure
);

router.get(
  "/structures/:id",
  authenticate,
  authorize("admin"),
  validateRequest(getFeeStructureSchema),
  feeController.getFeeStructure
);

router.get(
  "/structures",
  authenticate,
  authorize("admin"),
  validateRequest(queryFeeStructuresSchema),
  feeController.getFeeStructures
);

router.patch(
  "/structures/:id",
  authenticate,
  authorize("admin"),
  validateRequest(updateFeeStructureSchema),
  feeController.updateFeeStructure
);

router.delete(
  "/structures/:id",
  authenticate,
  authorize("admin"),
  validateRequest(getFeeStructureSchema),
  feeController.deactivateFeeStructure
);

router.post(
  "/structures/:id/clone",
  authenticate,
  authorize("admin"),
  validateRequest(getFeeStructureSchema),
  feeController.cloneFeeStructure
);

// Financial Reports (Admin only)
router.get(
  "/financial-overview",
  authenticate,
  authorize("admin"),
  validateRequest(getFinancialOverviewSchema),
  feeController.getFinancialOverview
);

router.get(
  "/defaulters",
  authenticate,
  authorize("admin"),
  validateRequest(getDefaultersSchema),
  feeController.getDefaultersReport
);

router.get(
  "/collection-rate",
  authenticate,
  authorize("admin"),
  feeController.getFeeCollectionRate
);

// Transaction Management (Admin only)
router.get(
  "/transactions",
  authenticate,
  authorize("admin"),
  validateRequest(getTransactionsSchema),
  feeController.getTransactions
);

router.post(
  "/transactions/:id/cancel",
  authenticate,
  authorize("admin"),
  validateRequest(cancelTransactionSchema),
  feeController.cancelTransaction
);

router.get(
  "/transactions/export",
  authenticate,
  authorize("admin"),
  feeController.exportTransactions
);

// Fee Waiver (Admin only)
router.post(
  "/waive",
  authenticate,
  authorize("admin"),
  validateRequest(waiveFeeSchema),
  feeController.waiveFee
);

export default router;
