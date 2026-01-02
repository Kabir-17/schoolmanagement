import { z } from 'zod';

// Create exam validation schema
const createExamValidation = z.object({
  body: z.object({
    schoolId: z.string({
      required_error: 'School ID is required',
      invalid_type_error: 'School ID must be a string',
    }),
    examName: z.string({
      required_error: 'Exam name is required',
      invalid_type_error: 'Exam name must be a string',
    })
      .trim()
      .min(1, 'Exam name cannot be empty')
      .max(200, 'Exam name cannot exceed 200 characters'),
    examType: z.enum(['unit-test', 'mid-term', 'final', 'quarterly', 'half-yearly', 'annual', 'entrance', 'mock'], {
      required_error: 'Exam type is required',
      invalid_type_error: 'Exam type must be one of the valid options',
    }),
    academicYear: z.string({
      required_error: 'Academic year is required',
    })
      .regex(/^\d{4}-\d{4}$/, 'Academic year must be in YYYY-YYYY format'),
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
    subjectId: z.string({
      required_error: 'Subject ID is required',
      invalid_type_error: 'Subject ID must be a string',
    }),
    teacherId: z.string({
      required_error: 'Teacher ID is required',
      invalid_type_error: 'Teacher ID must be a string',
    }),
    examDate: z.string({
      required_error: 'Exam date is required',
    }).datetime('Invalid exam date format'),
    startTime: z.string({
      required_error: 'Start time is required',
    })
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'),
    endTime: z.string({
      required_error: 'End time is required',
    })
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'),
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
    venue: z.string()
      .trim()
      .max(200, 'Venue cannot exceed 200 characters')
      .optional(),
    instructions: z.string()
      .trim()
      .max(2000, 'Instructions cannot exceed 2000 characters')
      .optional(),
    syllabus: z.array(z.string().trim())
      .max(50, 'Cannot have more than 50 syllabus topics')
      .optional(),
    gradingScale: z.object({
      gradeA: z.number()
        .min(0, 'Grade A marks cannot be negative')
        .max(100, 'Grade A marks cannot exceed 100'),
      gradeB: z.number()
        .min(0, 'Grade B marks cannot be negative')
        .max(100, 'Grade B marks cannot exceed 100'),
      gradeC: z.number()
        .min(0, 'Grade C marks cannot be negative')
        .max(100, 'Grade C marks cannot exceed 100'),
      gradeD: z.number()
        .min(0, 'Grade D marks cannot be negative')
        .max(100, 'Grade D marks cannot exceed 100'),
      gradeF: z.number()
        .min(0, 'Grade F marks cannot be negative')
        .max(100, 'Grade F marks cannot exceed 100'),
    })
      .optional()
      .refine(
        (scale) => {
          if (!scale) return true;
          return scale.gradeA > scale.gradeB && 
                 scale.gradeB > scale.gradeC && 
                 scale.gradeC > scale.gradeD && 
                 scale.gradeD > scale.gradeF;
        },
        {
          message: 'Grading scale must be in descending order (A > B > C > D > F)',
        }
      ),
    weightage: z.number()
      .min(0, 'Weightage cannot be negative')
      .max(100, 'Weightage cannot exceed 100')
      .optional(),
  })
    .refine(
      (data) => data.passingMarks <= data.totalMarks,
      {
        message: 'Passing marks cannot exceed total marks',
        path: ['passingMarks'],
      }
    )
    .refine(
      (data) => {
        const [startHours, startMinutes] = data.startTime.split(':').map(Number);
        const [endHours, endMinutes] = data.endTime.split(':').map(Number);
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;
        return endTotalMinutes > startTotalMinutes || endTotalMinutes + (24 * 60) > startTotalMinutes;
      },
      {
        message: 'End time must be after start time',
        path: ['endTime'],
      }
    ),
});

// Update exam validation schema
const updateExamValidation = z.object({
  body: z.object({
    examName: z.string()
      .trim()
      .min(1, 'Exam name cannot be empty')
      .max(200, 'Exam name cannot exceed 200 characters')
      .optional(),
    examDate: z.string().datetime('Invalid exam date format').optional(),
    startTime: z.string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format')
      .optional(),
    endTime: z.string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format')
      .optional(),
    totalMarks: z.number()
      .min(1, 'Total marks must be at least 1')
      .max(1000, 'Total marks cannot exceed 1000')
      .optional(),
    passingMarks: z.number()
      .min(0, 'Passing marks cannot be negative')
      .optional(),
    venue: z.string()
      .trim()
      .max(200, 'Venue cannot exceed 200 characters')
      .optional(),
    instructions: z.string()
      .trim()
      .max(2000, 'Instructions cannot exceed 2000 characters')
      .optional(),
    syllabus: z.array(z.string().trim())
      .max(50, 'Cannot have more than 50 syllabus topics')
      .optional(),
    isPublished: z.boolean().optional(),
    resultsPublished: z.boolean().optional(),
    gradingScale: z.object({
      gradeA: z.number().min(0).max(100),
      gradeB: z.number().min(0).max(100),
      gradeC: z.number().min(0).max(100),
      gradeD: z.number().min(0).max(100),
      gradeF: z.number().min(0).max(100),
    })
      .optional()
      .refine(
        (scale) => {
          if (!scale) return true;
          return scale.gradeA > scale.gradeB && 
                 scale.gradeB > scale.gradeC && 
                 scale.gradeC > scale.gradeD && 
                 scale.gradeD > scale.gradeF;
        },
        {
          message: 'Grading scale must be in descending order (A > B > C > D > F)',
        }
      ),
    weightage: z.number()
      .min(0, 'Weightage cannot be negative')
      .max(100, 'Weightage cannot exceed 100')
      .optional(),
    isActive: z.boolean().optional(),
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
        if (data.startTime && data.endTime) {
          const [startHours, startMinutes] = data.startTime.split(':').map(Number);
          const [endHours, endMinutes] = data.endTime.split(':').map(Number);
          const startTotalMinutes = startHours * 60 + startMinutes;
          const endTotalMinutes = endHours * 60 + endMinutes;
          return endTotalMinutes > startTotalMinutes || endTotalMinutes + (24 * 60) > startTotalMinutes;
        }
        return true;
      },
      {
        message: 'End time must be after start time',
        path: ['endTime'],
      }
    ),
});

// Submit results validation schema
const submitResultsValidation = z.object({
  body: z.object({
    examId: z.string({
      required_error: 'Exam ID is required',
    }),
    results: z.array(z.object({
      studentId: z.string({
        required_error: 'Student ID is required',
      }),
      marksObtained: z.number({
        invalid_type_error: 'Marks obtained must be a number',
      })
        .min(0, 'Marks obtained cannot be negative')
        .optional(),
      isAbsent: z.boolean().default(false),
      remarks: z.string()
        .trim()
        .max(500, 'Remarks cannot exceed 500 characters')
        .optional(),
    }))
      .min(1, 'At least one result is required')
      .max(100, 'Cannot submit more than 100 results at once'),
  }),
});

// Get exams by class validation
const getExamsByClassValidation = z.object({
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
    examType: z.enum(['unit-test', 'mid-term', 'final', 'quarterly', 'half-yearly', 'annual', 'entrance', 'mock']).optional(),
    subject: z.string().optional(),
    academicYear: z.string()
      .regex(/^\d{4}-\d{4}$/, 'Academic year must be in YYYY-YYYY format')
      .optional(),
    status: z.enum(['upcoming', 'ongoing', 'completed', 'all']).default('all'),
    isPublished: z.string().transform((val) => val === 'true').optional(),
    resultsPublished: z.string().transform((val) => val === 'true').optional(),
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
    page: z.string().transform((val) => parseInt(val)).optional(),
    limit: z.string().transform((val) => parseInt(val)).optional(),
  }).optional(),
});

// Get exam schedule validation
const getExamScheduleValidation = z.object({
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
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
    examType: z.enum(['unit-test', 'mid-term', 'final', 'quarterly', 'half-yearly', 'annual', 'entrance', 'mock']).optional(),
  }).optional(),
});

// Get exam statistics validation
const getExamStatsValidation = z.object({
  params: z.object({
    examId: z.string({
      required_error: 'Exam ID is required',
    }),
  }),
});

// Get exam results validation
const getExamResultsValidation = z.object({
  params: z.object({
    examId: z.string({
      required_error: 'Exam ID is required',
    }),
  }),
  query: z.object({
    studentId: z.string().optional(),
    grade: z.enum(['A', 'B', 'C', 'D', 'F', 'ABS']).optional(),
    isPass: z.string().transform((val) => val === 'true').optional(),
    isAbsent: z.string().transform((val) => val === 'true').optional(),
    sortBy: z.enum(['marksObtained', 'percentage', 'studentName']).default('marksObtained'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.string().transform((val) => parseInt(val)).optional(),
    limit: z.string().transform((val) => parseInt(val)).optional(),
  }).optional(),
});

// Common parameter validations
const examIdParamValidation = z.object({
  params: z.object({
    id: z.string({
      required_error: 'Exam ID is required',
    }),
  }),
});

const studentIdParamValidation = z.object({
  params: z.object({
    studentId: z.string({
      required_error: 'Student ID is required',
    }),
  }),
});

const teacherIdParamValidation = z.object({
  params: z.object({
    teacherId: z.string({
      required_error: 'Teacher ID is required',
    }),
  }),
});

const subjectIdParamValidation = z.object({
  params: z.object({
    subjectId: z.string({
      required_error: 'Subject ID is required',
    }),
  }),
});

export const ExamValidation = {
  createExamValidation,
  updateExamValidation,
  submitResultsValidation,
  getExamsByClassValidation,
  getExamScheduleValidation,
  getExamStatsValidation,
  getExamResultsValidation,
  examIdParamValidation,
  studentIdParamValidation,
  teacherIdParamValidation,
  subjectIdParamValidation,
};