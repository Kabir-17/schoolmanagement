import { z } from 'zod';

// Create homework validation schema
const createHomeworkValidation = z.object({
  body: z.object({
    schoolId: z.string({
      required_error: 'School ID is required',
      invalid_type_error: 'School ID must be a string',
    }),
    teacherId: z.string({
      required_error: 'Teacher ID is required',
      invalid_type_error: 'Teacher ID must be a string',
    }),
    subjectId: z.string({
      required_error: 'Subject ID is required',
      invalid_type_error: 'Subject ID must be a string',
    }),
    classId: z.string().optional(),
    grade: z.number({
      required_error: 'Grade is required',
      invalid_type_error: 'Grade must be a number',
    })
      .min(1, 'Grade must be at least 1')
      .max(12, 'Grade cannot exceed 12'),
    section: z.string()
      .optional()
      .refine(
        (val) => !val || /^[A-Z]$/.test(val),
        'Section must be a single uppercase letter'
      ),
    title: z.string({
      required_error: 'Title is required',
      invalid_type_error: 'Title must be a string',
    })
      .trim()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title cannot exceed 200 characters'),
    description: z.string({
      required_error: 'Description is required',
      invalid_type_error: 'Description must be a string',
    })
      .trim()
      .min(1, 'Description cannot be empty')
      .max(2000, 'Description cannot exceed 2000 characters'),
    instructions: z.string()
      .trim()
      .max(2000, 'Instructions cannot exceed 2000 characters')
      .optional(),
    homeworkType: z.enum(['assignment', 'project', 'reading', 'practice', 'research', 'presentation', 'other'], {
      required_error: 'Homework type is required',
      invalid_type_error: 'Homework type must be one of the valid options',
    }),
    priority: z.enum(['low', 'medium', 'high', 'urgent'], {
      invalid_type_error: 'Priority must be one of the valid options',
    }).default('medium'),
    assignedDate: z.string({
      required_error: 'Assigned date is required',
    }).datetime('Invalid assigned date format'),
    dueDate: z.string({
      required_error: 'Due date is required',
    }).datetime('Invalid due date format'),
    estimatedDuration: z.number({
      required_error: 'Estimated duration is required',
      invalid_type_error: 'Estimated duration must be a number',
    })
      .min(15, 'Estimated duration must be at least 15 minutes')
      .max(1440, 'Estimated duration cannot exceed 24 hours (1440 minutes)'),
    totalMarks: z.number({
      required_error: 'Total marks is required',
      invalid_type_error: 'Total marks must be a number',
    })
      .min(1, 'Total marks must be at least 1')
      .max(1000, 'Total marks cannot exceed 1000'),
    passingMarks: z.number({
      required_error: 'Passing marks is required',
      invalid_type_error: 'Passing marks must be a number',
    })
      .min(0, 'Passing marks cannot be negative'),
    submissionType: z.enum(['text', 'file', 'both', 'none'], {
      required_error: 'Submission type is required',
      invalid_type_error: 'Submission type must be one of the valid options',
    }),
    allowLateSubmission: z.boolean().default(true),
    latePenalty: z.number()
      .min(0, 'Late penalty cannot be negative')
      .max(100, 'Late penalty cannot exceed 100%')
      .optional(),
    maxLateDays: z.preprocess(
      (val) => val === '' || val === null || val === undefined ? undefined : Number(val),
      z.number()
        .min(1, 'Max late days must be at least 1')
        .max(30, 'Max late days cannot exceed 30')
        .optional()
    ),
    isGroupWork: z.boolean().default(false),
    maxGroupSize: z.number()
      .min(2, 'Max group size must be at least 2')
      .max(10, 'Max group size cannot exceed 10')
      .optional(),
    rubric: z.array(z.object({
      criteria: z.string()
        .trim()
        .min(1, 'Rubric criteria cannot be empty')
        .max(200, 'Criteria cannot exceed 200 characters'),
      maxPoints: z.number()
        .min(0, 'Maximum points cannot be negative'),
      description: z.string()
        .trim()
        .max(500, 'Description cannot exceed 500 characters')
        .optional(),
    }))
      .max(20, 'Cannot have more than 20 rubric criteria')
      .optional(),
    tags: z.array(z.string().trim())
      .max(10, 'Cannot have more than 10 tags')
      .optional(),
  })
    .refine(
      (data) => new Date(data.dueDate) > new Date(data.assignedDate),
      {
        message: 'Due date must be after assigned date',
        path: ['dueDate'],
      }
    )
    .refine(
      (data) => data.passingMarks <= data.totalMarks,
      {
        message: 'Passing marks cannot exceed total marks',
        path: ['passingMarks'],
      }
    )
    .refine(
      (data) => !data.isGroupWork || data.maxGroupSize !== undefined,
      {
        message: 'Max group size is required for group work',
        path: ['maxGroupSize'],
      }
    )
    .refine(
      (data) => {
        if (data.rubric && data.rubric.length > 0) {
          const totalRubricPoints = data.rubric.reduce((sum, criteria) => sum + criteria.maxPoints, 0);
          return Math.abs(totalRubricPoints - data.totalMarks) < 0.01;
        }
        return true;
      },
      {
        message: 'Rubric total points must equal total marks',
        path: ['rubric'],
      }
    ),
});

// Update homework validation schema
const updateHomeworkValidation = z.object({
  body: z.object({
    title: z.string()
      .trim()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title cannot exceed 200 characters')
      .optional(),
    description: z.string()
      .trim()
      .min(1, 'Description cannot be empty')
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional(),
    instructions: z.string()
      .trim()
      .max(2000, 'Instructions cannot exceed 2000 characters')
      .optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dueDate: z.string().datetime('Invalid due date format').optional(),
    estimatedDuration: z.number()
      .min(15, 'Estimated duration must be at least 15 minutes')
      .max(1440, 'Estimated duration cannot exceed 24 hours (1440 minutes)')
      .optional(),
    totalMarks: z.number()
      .min(1, 'Total marks must be at least 1')
      .max(1000, 'Total marks cannot exceed 1000')
      .optional(),
    passingMarks: z.number()
      .min(0, 'Passing marks cannot be negative')
      .optional(),
    allowLateSubmission: z.boolean().optional(),
    latePenalty: z.number()
      .min(0, 'Late penalty cannot be negative')
      .max(100, 'Late penalty cannot exceed 100%')
      .optional(),
    maxLateDays: z.preprocess(
      (val) => val === '' || val === null || val === undefined ? undefined : Number(val),
      z.number()
        .min(1, 'Max late days must be at least 1')
        .max(30, 'Max late days cannot exceed 30')
        .optional()
    ),
    isGroupWork: z.boolean().optional(),
    maxGroupSize: z.number()
      .min(2, 'Max group size must be at least 2')
      .max(10, 'Max group size cannot exceed 10')
      .optional(),
    rubric: z.array(z.object({
      criteria: z.string()
        .trim()
        .min(1, 'Rubric criteria cannot be empty')
        .max(200, 'Criteria cannot exceed 200 characters'),
      maxPoints: z.number()
        .min(0, 'Maximum points cannot be negative'),
      description: z.string()
        .trim()
        .max(500, 'Description cannot exceed 500 characters')
        .optional(),
    }))
      .max(20, 'Cannot have more than 20 rubric criteria')
      .optional(),
    tags: z.array(z.string().trim())
      .max(10, 'Cannot have more than 10 tags')
      .optional(),
    isPublished: z.boolean().optional(),
  })
    .refine(
      (data) => {
        if (data.passingMarks !== undefined && data.totalMarks !== undefined) {
          return data.passingMarks <= data.totalMarks;
        }
        return true;
      },
      {
        message: 'Passing marks cannot exceed total marks',
        path: ['passingMarks'],
      }
    )
    .refine(
      (data) => {
        if (data.rubric && data.rubric.length > 0 && data.totalMarks !== undefined) {
          const totalRubricPoints = data.rubric.reduce((sum, criteria) => sum + criteria.maxPoints, 0);
          return Math.abs(totalRubricPoints - data.totalMarks) < 0.01;
        }
        return true;
      },
      {
        message: 'Rubric total points must equal total marks',
        path: ['rubric'],
      }
    ),
});

// Submit homework validation schema
const submitHomeworkValidation = z.object({
  body: z.object({
    homeworkId: z.string({
      required_error: 'Homework ID is required',
    }),
    studentId: z.string({
      required_error: 'Student ID is required',
    }),
    groupMembers: z.array(z.string()).optional(),
    submissionText: z.string()
      .trim()
      .max(5000, 'Submission text cannot exceed 5000 characters')
      .optional(),
    attachments: z.array(z.string())
      .max(10, 'Cannot have more than 10 attachments')
      .optional(),
  }),
});

// Grade homework validation schema
const gradeHomeworkValidation = z.object({
  body: z.object({
    submissionId: z.string({
      required_error: 'Submission ID is required',
    }),
    marksObtained: z.number({
      required_error: 'Marks obtained is required',
      invalid_type_error: 'Marks obtained must be a number',
    })
      .min(0, 'Marks obtained cannot be negative'),
    feedback: z.string()
      .trim()
      .max(2000, 'Feedback cannot exceed 2000 characters')
      .optional(),
    teacherComments: z.string()
      .trim()
      .max(1000, 'Teacher comments cannot exceed 1000 characters')
      .optional(),
  }),
});

// Get homework by student validation
const getHomeworkByStudentValidation = z.object({
  params: z.object({
    studentId: z.string({
      required_error: 'Student ID is required',
    }),
  }),
});

// Get homework by class validation
const getHomeworkByClassValidation = z.object({
  params: z.object({
    schoolId: z.string({
      required_error: 'School ID is required',
    }),
    grade: z.string().transform((val) => parseInt(val))
      .refine((val) => val >= 1 && val <= 12, 'Grade must be between 1 and 12'),
  }),
  query: z.object({
    section: z.string()
      .refine(
        (val) => !val || /^[A-Z]$/.test(val),
        'Section must be a single uppercase letter'
      )
      .optional(),
    status: z.enum(['upcoming', 'overdue', 'today', 'all']).default('all'),
    subject: z.string().optional(),
    homeworkType: z.enum(['assignment', 'project', 'reading', 'practice', 'research', 'presentation', 'other']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    page: z.string().transform((val) => parseInt(val)).optional(),
    limit: z.string().transform((val) => parseInt(val)).optional(),
  }).optional(),
});

// Get homework calendar validation
const getHomeworkCalendarValidation = z.object({
  params: z.object({
    schoolId: z.string({
      required_error: 'School ID is required',
    }),
  }),
  query: z.object({
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format'),
    grade: z.string().transform((val) => parseInt(val))
      .refine((val) => val >= 1 && val <= 12, 'Grade must be between 1 and 12')
      .optional(),
    section: z.string()
      .refine(
        (val) => !val || /^[A-Z]$/.test(val),
        'Section must be a single uppercase letter'
      )
      .optional(),
  }),
});

// Get homework analytics validation
const getHomeworkAnalyticsValidation = z.object({
  params: z.object({
    schoolId: z.string({
      required_error: 'School ID is required',
    }),
  }),
  query: z.object({
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
    grade: z.string().transform((val) => parseInt(val))
      .refine((val) => val >= 1 && val <= 12, 'Grade must be between 1 and 12')
      .optional(),
    section: z.string()
      .refine(
        (val) => !val || /^[A-Z]$/.test(val),
        'Section must be a single uppercase letter'
      )
      .optional(),
    teacherId: z.string().optional(),
    subjectId: z.string().optional(),
  }).optional(),
});

// Request revision validation
const requestRevisionValidation = z.object({
  body: z.object({
    submissionId: z.string({
      required_error: 'Submission ID is required',
    }),
    reason: z.string({
      required_error: 'Revision reason is required',
    })
      .trim()
      .min(1, 'Revision reason cannot be empty')
      .max(500, 'Revision reason cannot exceed 500 characters'),
  }),
});

// Common parameter validations
const homeworkIdParamValidation = z.object({
  params: z.object({
    id: z.string({
      required_error: 'Homework ID is required',
    }),
  }),
});

const submissionIdParamValidation = z.object({
  params: z.object({
    id: z.string({
      required_error: 'Submission ID is required',
    }),
  }),
});

export const HomeworkValidation = {
  createHomeworkValidation,
  updateHomeworkValidation,
  submitHomeworkValidation,
  gradeHomeworkValidation,
  getHomeworkByStudentValidation,
  getHomeworkByClassValidation,
  getHomeworkCalendarValidation,
  getHomeworkAnalyticsValidation,
  requestRevisionValidation,
  homeworkIdParamValidation,
  submissionIdParamValidation,
};