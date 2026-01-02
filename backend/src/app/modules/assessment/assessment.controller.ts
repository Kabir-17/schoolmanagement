import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { assessmentService } from "./assessment.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

const adminSortFields = [
  "examDate",
  "averagePercentage",
  "totalMarks",
  "gradedCount",
  "examName",
] as const;

type AdminSortField = (typeof adminSortFields)[number];

const resolveAdminSortField = (
  value: unknown
): AdminSortField | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  return (adminSortFields as readonly string[]).includes(value)
    ? (value as AdminSortField)
    : undefined;
};

const getTeacherAssignments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const assignments = await assessmentService.getTeacherAssignments(req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Teacher assignments retrieved successfully",
    data: assignments,
  });
});

const createAssessment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const assessment = await assessmentService.createAssessment(req.user!, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Assessment created successfully",
    data: assessment,
  });
});

const listTeacherAssessments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const payload = await assessmentService.listTeacherAssessments(req.user!, {
    subjectId: req.query.subjectId as string | undefined,
    grade: req.query.grade ? Number.parseInt(req.query.grade as string, 10) : undefined,
    section: req.query.section as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assessments retrieved successfully",
    data: payload,
  });
});

const getAssessmentDetails = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const details = await assessmentService.getAssessmentDetails(req.user!, req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assessment details retrieved successfully",
    data: details,
  });
});

const updateAssessment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const updated = await assessmentService.updateAssessment(req.user!, req.params.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assessment updated successfully",
    data: updated,
  });
});

const deleteAssessment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  await assessmentService.deleteAssessment(req.user!, req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assessment archived successfully",
    data: null,
  });
});

const submitAssessmentResults = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const summary = await assessmentService.saveAssessmentResults(
    req.user!,
    req.params.id,
    req.body.results
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assessment results saved successfully",
    data: summary,
  });
});

const exportAssessment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const format = (req.query.format as string | undefined) === "xlsx" ? "xlsx" : "csv";
  const file = await assessmentService.exportAssessment(req.user!, req.params.id, {
    format,
    filename: `assessment-${req.params.id}`,
  });

  res.setHeader("Content-Disposition", `attachment; filename=${file.filename}`);
  res.type(file.mimeType);
  res.send(file.buffer);
});

const exportTeacherAssessments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const format = (req.query.format as string | undefined) === "xlsx" ? "xlsx" : "csv";
  const subjectId = req.query.subjectId as string;
  const grade = Number.parseInt(req.query.grade as string, 10);
  const section = req.query.section as string;

  const file = await assessmentService.exportTeacherAssessments(
    req.user!,
    { subjectId, grade, section },
    { format, filename: `assessment-summary-${grade}${section}` }
  );

  res.setHeader("Content-Disposition", `attachment; filename=${file.filename}`);
  res.type(file.mimeType);
  res.send(file.buffer);
});

const getTeacherPerformanceMatrix = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const matrix = await assessmentService.getTeacherPerformanceMatrix(req.user!, {
    subjectId: req.query.subjectId as string,
    grade: Number.parseInt(req.query.grade as string, 10),
    section: req.query.section as string,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Performance matrix generated successfully",
    data: matrix,
  });
});

const listCategories = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const categories = await assessmentService.listCategories(req.user!);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assessment types retrieved successfully",
    data: categories,
  });
});

const createCategory = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const category = await assessmentService.createCategory(req.user!, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Assessment type created successfully",
    data: category,
  });
});

const updateCategory = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const category = await assessmentService.updateCategory(req.user!, req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assessment type updated successfully",
    data: category,
  });
});

const listAdminAssessments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const sortBy = resolveAdminSortField(req.query.sortBy);
  const assessments = await assessmentService.listAdminAssessments(req.user!, {
    schoolId: req.user!.schoolId!,
    grade: req.query.grade ? Number.parseInt(req.query.grade as string, 10) : undefined,
    section: req.query.section as string | undefined,
    subjectId: req.query.subjectId as string | undefined,
    searchTerm: req.query.search as string | undefined,
    includeHidden:
      typeof req.query.includeHidden === "boolean"
        ? (req.query.includeHidden as boolean)
        : req.query.includeHidden === "true",
    onlyFavorites:
      typeof req.query.onlyFavorites === "boolean"
        ? (req.query.onlyFavorites as boolean)
        : req.query.onlyFavorites === "true",
    categoryId: req.query.categoryId as string | undefined,
    teacherId: req.query.teacherId as string | undefined,
    sortBy,
    sortDirection:
      req.query.sortDirection === "asc" || req.query.sortDirection === "desc"
        ? (req.query.sortDirection as "asc" | "desc")
        : undefined,
    fromDate:
      req.query.fromDate instanceof Date
        ? (req.query.fromDate as Date)
        : req.query.fromDate
        ? new Date(req.query.fromDate as string)
        : undefined,
    toDate:
      req.query.toDate instanceof Date
        ? (req.query.toDate as Date)
        : req.query.toDate
        ? new Date(req.query.toDate as string)
        : undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Class assessments retrieved successfully",
    data: assessments,
  });
});

const exportAdminAssessments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const format = (req.query.format as string | undefined) === "xlsx" ? "xlsx" : "csv";
  const sortBy = resolveAdminSortField(req.query.sortBy);
  const file = await assessmentService.exportAdminAssessments(req.user!, {
    schoolId: req.user!.schoolId!,
    grade: req.query.grade ? Number.parseInt(req.query.grade as string, 10) : undefined,
    section: req.query.section as string | undefined,
    subjectId: req.query.subjectId as string | undefined,
    categoryId: req.query.categoryId as string | undefined,
    teacherId: req.query.teacherId as string | undefined,
    searchTerm: req.query.search as string | undefined,
    includeHidden:
      typeof req.query.includeHidden === "boolean"
        ? (req.query.includeHidden as boolean)
        : req.query.includeHidden === "true",
    onlyFavorites:
      typeof req.query.onlyFavorites === "boolean"
        ? (req.query.onlyFavorites as boolean)
        : req.query.onlyFavorites === "true",
    sortBy,
    sortDirection:
      req.query.sortDirection === "asc" || req.query.sortDirection === "desc"
        ? (req.query.sortDirection as "asc" | "desc")
        : undefined,
    fromDate:
      req.query.fromDate instanceof Date
        ? (req.query.fromDate as Date)
        : req.query.fromDate
        ? new Date(req.query.fromDate as string)
        : undefined,
    toDate:
      req.query.toDate instanceof Date
        ? (req.query.toDate as Date)
        : req.query.toDate
        ? new Date(req.query.toDate as string)
        : undefined,
    assessmentIds: Array.isArray(req.query.assessmentIds)
      ? (req.query.assessmentIds as string[])
      : req.query.assessmentIds
      ? (
          (req.query.assessmentIds as unknown as string)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      : undefined,
    format,
  });

  res.setHeader("Content-Disposition", `attachment; filename=${file.filename}`);
  res.type(file.mimeType);
  res.send(file.buffer);
});

const updateAdminAssessmentPreference = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const preference = await assessmentService.updateAdminAssessmentPreference(
    req.user!,
    req.params.id,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assessment preference updated successfully",
    data: preference,
  });
});

const getAdminClasses = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const classes = await assessmentService.getAdminClassCatalog(req.user!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Class catalog retrieved successfully",
    data: classes,
  });
});

const getStudentAssessments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const data = await assessmentService.getStudentAssessments(req.user!, req.params.studentId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student assessments retrieved successfully",
    data,
  });
});

export const AssessmentController = {
  getTeacherAssignments,
  createAssessment,
  listTeacherAssessments,
  getAssessmentDetails,
  updateAssessment,
  deleteAssessment,
  submitAssessmentResults,
  exportAssessment,
  exportTeacherAssessments,
  getTeacherPerformanceMatrix,
  listCategories,
  createCategory,
  updateCategory,
  listAdminAssessments,
  exportAdminAssessments,
  updateAdminAssessmentPreference,
  getStudentAssessments,
  getAdminClasses,
};
