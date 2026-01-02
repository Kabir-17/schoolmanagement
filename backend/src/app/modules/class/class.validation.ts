import { z } from 'zod';

// Create class validation
export const createClassValidationSchema = z.object({
  body: z.object({
    grade: z
      .number({
        required_error: 'Grade is required',
      })
      .int('Grade must be an integer')
      .min(1, 'Grade must be at least 1')
      .max(12, 'Grade cannot exceed 12'),
    section: z
      .string()
      .regex(/^[A-Z]$/, 'Section must be a single uppercase letter')
      .optional(),
    maxStudents: z
      .number()
      .int('Max students must be an integer')
      .min(10, 'Maximum students must be at least 10')
      .max(60, 'Maximum students cannot exceed 60')
      .optional()
      .default(40),
    academicYear: z
      .string({
        required_error: 'Academic year is required',
      })
      .regex(/^\d{4}-\d{4}$/, 'Academic year must be in YYYY-YYYY format'),
    classTeacher: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid teacher ID format')
      .optional(),
    subjects: z
      .array(
        z
          .string()
          .regex(/^[0-9a-fA-F]{24}$/, 'Invalid subject ID format')
      )
      .optional(),
    absenceSmsSettings: z
      .object({
        enabled: z.boolean().optional(),
        sendAfterTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/, 'Send-after time must be in HH:MM format')
          .optional(),
      })
      .optional(),
  }),
});

// Update class validation
export const updateClassValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Class ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid class ID format'),
  }),
  body: z.object({
    maxStudents: z
      .number()
      .int('Max students must be an integer')
      .min(10, 'Maximum students must be at least 10')
      .max(60, 'Maximum students cannot exceed 60')
      .optional(),
    classTeacher: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid teacher ID format')
      .optional(),
    subjects: z
      .array(
        z
          .string()
          .regex(/^[0-9a-fA-F]{24}$/, 'Invalid subject ID format')
      )
      .optional(),
    isActive: z
      .boolean()
      .optional(),
    absenceSmsSettings: z
      .object({
        enabled: z.boolean().optional(),
        sendAfterTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/, 'Send-after time must be in HH:MM format')
          .optional(),
      })
      .optional(),
  }),
});

// Get class validation
export const getClassValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Class ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid class ID format'),
  }),
});

// Delete class validation
export const deleteClassValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Class ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid class ID format'),
  }),
});

// Get classes validation
export const getClassesValidationSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a positive number')
      .transform((val) => parseInt(val))
      .refine((val) => val > 0, 'Page must be greater than 0')
      .optional()
      .default('1'),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a positive number')
      .transform((val) => parseInt(val))
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
      .optional()
      .default('20'),
    schoolId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format')
      .optional(),
    grade: z
      .string()
      .regex(/^\d+$/, 'Grade must be a number')
      .transform((val) => parseInt(val))
      .refine((val) => val >= 1 && val <= 12, 'Grade must be between 1 and 12')
      .optional(),
    section: z
      .string()
      .regex(/^[A-Z]$/, 'Section must be a single uppercase letter')
      .optional(),
    academicYear: z
      .string()
      .regex(/^\d{4}-\d{4}$/, 'Academic year must be in YYYY-YYYY format')
      .optional(),
    isActive: z
      .string()
      .regex(/^(true|false)$/, 'isActive must be true or false')
      .transform((val) => val === 'true')
      .optional(),
    sortBy: z
      .string()
      .regex(/^[a-zA-Z0-9_]+$/, 'Invalid sort field')
      .optional()
      .default('grade'),
    sortOrder: z
      .enum(['asc', 'desc'], {
        errorMap: () => ({ message: 'Sort order must be asc or desc' }),
      })
      .optional()
      .default('asc'),
  }),
});

// Get classes by grade validation
export const getClassesByGradeValidationSchema = z.object({
  params: z.object({
    schoolId: z
      .string({
        required_error: 'School ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format'),
    grade: z
      .string({
        required_error: 'Grade is required',
      })
      .regex(/^\d+$/, 'Grade must be a number')
      .transform((val) => parseInt(val))
      .refine((val) => val >= 1 && val <= 12, 'Grade must be between 1 and 12'),
  }),
});

// Get class by grade and section validation
export const getClassByGradeAndSectionValidationSchema = z.object({
  params: z.object({
    schoolId: z
      .string({
        required_error: 'School ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format'),
    grade: z
      .string({
        required_error: 'Grade is required',
      })
      .regex(/^\d+$/, 'Grade must be a number')
      .transform((val) => parseInt(val))
      .refine((val) => val >= 1 && val <= 12, 'Grade must be between 1 and 12'),
    section: z
      .string({
        required_error: 'Section is required',
      })
      .regex(/^[A-Z]$/, 'Section must be a single uppercase letter'),
  }),
});

// Get class stats validation
export const getClassStatsValidationSchema = z.object({
  params: z.object({
    schoolId: z
      .string({
        required_error: 'School ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format'),
  }),
});

// Check capacity validation
export const checkCapacityValidationSchema = z.object({
  params: z.object({
    schoolId: z
      .string({
        required_error: 'School ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format'),
    grade: z
      .string({
        required_error: 'Grade is required',
      })
      .regex(/^\d+$/, 'Grade must be a number')
      .transform((val) => parseInt(val))
      .refine((val) => val >= 1 && val <= 12, 'Grade must be between 1 and 12'),
  }),
});

// Create new section validation
export const createNewSectionValidationSchema = z.object({
  params: z.object({
    schoolId: z
      .string({
        required_error: 'School ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format'),
    grade: z
      .string({
        required_error: 'Grade is required',
      })
      .regex(/^\d+$/, 'Grade must be a number')
      .transform((val) => parseInt(val))
      .refine((val) => val >= 1 && val <= 12, 'Grade must be between 1 and 12'),
  }),
  body: z.object({
    academicYear: z
      .string({
        required_error: 'Academic year is required',
      })
      .regex(/^\d{4}-\d{4}$/, 'Academic year must be in YYYY-YYYY format'),
    maxStudents: z
      .number()
      .int('Max students must be an integer')
      .min(10, 'Maximum students must be at least 10')
      .max(60, 'Maximum students cannot exceed 60')
      .optional()
      .default(40),
  }),
});

// Export all validation schemas (already exported above)
