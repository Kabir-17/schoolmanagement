import { z } from "zod";

export const createSubjectValidationSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: "Subject name is required",
      })
      .min(2, "Subject name must be at least 2 characters"),
    code: z
      .string({
        required_error: "Subject code is required",
      })
      .min(2, "Subject code must be at least 2 characters"),
    description: z.string().optional(),
    grades: z
      .array(z.number().min(1).max(12))
      .min(1, "At least one grade is required"),
    isCore: z.boolean().optional().default(true),
    credits: z.number().min(1).max(10).optional().default(1),
    isActive: z.boolean().optional().default(true),
  }),
});

export const getSubjectsValidationSchema = z.object({
  query: z
    .object({
      grade: z.string().optional(),
      isActive: z.string().optional(),
      search: z.string().optional(),
    })
    .optional(),
});

export const getSubjectValidationSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: "Subject ID is required",
    }),
  }),
});

export const updateSubjectValidationSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: "Subject ID is required",
    }),
  }),
  body: z.object({
    name: z
      .string()
      .min(2, "Subject name must be at least 2 characters")
      .optional(),
    code: z
      .string()
      .min(2, "Subject code must be at least 2 characters")
      .optional(),
    description: z.string().optional(),
    grades: z
      .array(z.number().min(1).max(12))
      .min(1, "At least one grade is required")
      .optional(),
    isCore: z.boolean().optional(),
    credits: z.number().min(1).max(10).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const deleteSubjectValidationSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: "Subject ID is required",
    }),
  }),
});
