import { z } from "zod";

const objectId = z
  .string({ required_error: "ID is required" })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid identifier");

const sectionSchema = z
  .string({ required_error: "Section is required" })
  .regex(/^[A-Z]$/, "Section must be a single uppercase letter");

export const createAssessmentSchema = z.object({
  body: z.object({
    subjectId: z.string({ required_error: "Subject identifier is required" }).min(1),
    subjectName: z.string().max(100).optional(),
    grade: z.number().int().min(1).max(12),
    section: sectionSchema,
    examName: z
      .string({ required_error: "Exam name is required" })
      .min(1)
      .max(150),
    examDate: z
      .string({ required_error: "Exam date is required" })
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "Invalid exam date",
      }),
    totalMarks: z
      .number({ required_error: "Total marks is required" })
      .positive()
      .max(1000),
    note: z.string().max(1000).optional(),
    categoryId: objectId.optional(),
    categoryLabel: z.string().max(100).optional(),
    academicYear: z.string().regex(/^\d{4}-\d{4}$/).optional(),
  }),
});

export const updateAssessmentSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      examName: z.string().min(1).max(150).optional(),
      examDate: z
        .string()
        .refine((value) => !Number.isNaN(Date.parse(value)), {
          message: "Invalid exam date",
        })
        .optional(),
      totalMarks: z.number().positive().max(1000).optional(),
      note: z.string().max(1000).optional(),
      categoryId: objectId.nullable().optional(),
      categoryLabel: z.string().max(100).nullable().optional(),
      academicYear: z.string().regex(/^\d{4}-\d{4}$/).optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field must be provided"
    ),
});

export const submitResultsSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    results: z
      .array(
        z.object({
          studentId: objectId,
          marksObtained: z.number().min(0),
          remarks: z.string().max(500).optional(),
        })
      )
      .min(1, "At least one result is required"),
    publish: z.boolean().optional(),
  }),
});

export const teacherAssessmentsQuerySchema = z.object({
  query: z.object({
    subjectId: z.string().min(1).optional(),
    grade: z
      .string()
      .regex(/^\d+$/)
      .transform((value) => Number.parseInt(value, 10))
      .optional(),
    section: sectionSchema.optional(),
    includeStats: z
      .string()
      .transform((value) => value === "true")
      .optional(),
  }),
});

export const teacherPerformanceQuerySchema = z.object({
  query: z.object({
    subjectId: z.string().min(1),
    grade: z
      .string()
      .regex(/^\d+$/)
      .transform((value) => Number.parseInt(value, 10)),
    section: sectionSchema,
  }),
});

export const exportAssessmentSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  query: z.object({
    format: z.enum(["csv", "xlsx"]).default("csv"),
  }),
});

export const exportAllTeacherAssessmentsSchema = z.object({
  query: z.object({
    subjectId: z.string().min(1).optional(),
    grade: z
      .string()
      .regex(/^\d+$/)
      .transform((value) => Number.parseInt(value, 10))
      .optional(),
    section: sectionSchema.optional(),
    format: z.enum(["csv", "xlsx"]).default("csv"),
  }),
});

export const adminClassAssessmentsQuerySchema = z.object({
  query: z.object({
    schoolId: objectId.optional(),
    grade: z
      .string()
      .regex(/^\d+$/)
      .transform((value) => Number.parseInt(value, 10))
      .optional(),
    section: sectionSchema.optional(),
    subjectId: z.string().min(1).optional(),
    search: z.string().trim().min(1).optional(),
    includeStats: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((value) =>
        typeof value === "boolean" ? value : value === "true"
      )
      .optional(),
    includeHidden: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((value) =>
        typeof value === "boolean" ? value : value === "true"
      )
      .optional(),
    onlyFavorites: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((value) =>
        typeof value === "boolean" ? value : value === "true"
      )
      .optional(),
    categoryId: z.string().min(1).optional(),
    teacherId: z.string().min(1).optional(),
    sortBy: z
      .enum(["examDate", "averagePercentage", "totalMarks", "gradedCount", "examName"])
      .optional(),
    sortDirection: z.enum(["asc", "desc"]).optional(),
    fromDate: z
      .union([
        z.date(),
        z
          .string()
          .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date")
          .transform((value) => new Date(value)),
      ])
      .optional(),
    toDate: z
      .union([
        z.date(),
        z
          .string()
          .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date")
          .transform((value) => new Date(value)),
      ])
      .optional(),
  }),
});

export const adminExportAssessmentsSchema = z.object({
  query: adminClassAssessmentsQuerySchema.shape.query.extend({
    format: z.enum(["csv", "xlsx"]).default("csv"),
    assessmentIds: z
      .union([
        z.array(objectId),
        z
          .string()
          .min(1)
          .transform((value) =>
            value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
              .map((item) => objectId.parse(item))
          ),
      ])
      .optional(),
  }),
});

export const adminUpdateAssessmentPreferenceSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      isFavorite: z.boolean().optional(),
      isHidden: z.boolean().optional(),
    })
    .refine(
      (data) =>
        data.isFavorite !== undefined || data.isHidden !== undefined,
      "Provide at least one flag to update"
    ),
});

export const categoryCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    description: z.string().max(200).optional(),
    order: z.number().int().min(0).optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const categoryUpdateSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      name: z.string().min(2).max(80).optional(),
      description: z.string().max(200).optional(),
      order: z.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field must be provided"
    ),
});

export const studentAssessmentQuerySchema = z.object({
  params: z.object({
    studentId: objectId.optional(),
  }),
});
