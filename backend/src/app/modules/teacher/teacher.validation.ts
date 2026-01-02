import { z } from 'zod';

const createTeacherValidationSchema = z.object({
  body: z.object({
    schoolId: z
      .string({
        required_error: 'School ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format'),
    firstName: z
      .string({
        required_error: 'First name is required',
      })
      .min(1, 'First name is required')
      .max(50, 'First name cannot exceed 50 characters')
      .trim(),
    lastName: z
      .string({
        required_error: 'Last name is required',
      })
      .min(1, 'Last name is required')
      .max(50, 'Last name cannot exceed 50 characters')
      .trim(),
    email: z
      .string()
      .email('Invalid email format')
      .toLowerCase()
      .optional(),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
      .optional(),
    employeeId: z
      .string()
      .max(50, 'Employee ID cannot exceed 50 characters')
      .trim()
      .optional(),
    subjects: z
      .array(z.string().min(1, 'Subject cannot be empty'))
      .min(1, 'At least one subject is required')
      .max(10, 'Cannot teach more than 10 subjects'),
    grades: z
      .array(z.number().int().min(1, 'Grade must be at least 1').max(12, 'Grade cannot exceed 12'))
      .min(1, 'At least one grade is required')
      .max(12, 'Cannot handle more than 12 grades'),
    sections: z
      .array(z.string().regex(/^[A-Z]$/, 'Section must be a single uppercase letter'))
      .min(1, 'At least one section is required'),
    designation: z
      .enum([
        'Principal',
        'Vice Principal',
        'Head Teacher',
        'Senior Teacher',
        'Teacher',
        'Assistant Teacher',
        'Subject Coordinator',
        'Sports Teacher',
        'Music Teacher',
        'Art Teacher',
        'Librarian',
        'Lab Assistant',
      ], {
        errorMap: () => ({ message: 'Invalid designation' }),
      }),
    bloodGroup: z
      .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
        errorMap: () => ({ message: 'Invalid blood group' }),
      }),
    dob: z
      .string({
        required_error: 'Date of birth is required',
      })
      .date('Invalid date format')
      .refine((date) => {
        const dob = new Date(date);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        return age >= 21 && age <= 65;
      }, 'Teacher age must be between 21 and 65 years'),
    joinDate: z
      .string()
      .optional()
      .refine((date) => !date || date.length === 0 || /^\d{4}-\d{2}-\d{2}$/.test(date), 'Invalid date format'),
    qualifications: z
      .array(z.object({
        degree: z
          .string()
          .min(1, 'Degree is required')
          .max(100, 'Degree cannot exceed 100 characters')
          .trim(),
        institution: z
          .string()
          .min(1, 'Institution is required')
          .max(200, 'Institution cannot exceed 200 characters')
          .trim(),
        year: z
          .number()
          .int('Year must be an integer')
          .min(1980, 'Year must be after 1980')
          .max(new Date().getFullYear(), 'Year cannot be in the future'),
        specialization: z
          .string()
          .max(100, 'Specialization cannot exceed 100 characters')
          .trim()
          .optional(),
      }))
      .min(1, 'At least one qualification is required')
      .max(10, 'Cannot have more than 10 qualifications'),
    experience: z.object({
      totalYears: z
        .number({
          required_error: 'Total years of experience is required',
        })
        .min(0, 'Experience cannot be negative')
        .max(45, 'Experience cannot exceed 45 years'),
      previousSchools: z
        .array(z.object({
          schoolName: z
            .string()
            .min(1, 'School name is required')
            .max(200, 'School name cannot exceed 200 characters')
            .trim(),
          position: z
            .string()
            .min(1, 'Position is required')
            .max(100, 'Position cannot exceed 100 characters')
            .trim(),
          duration: z
            .string()
            .min(1, 'Duration is required')
            .max(50, 'Duration cannot exceed 50 characters')
            .trim(),
          fromDate: z
            .string()
            .date('Invalid from date format'),
          toDate: z
            .string()
            .date('Invalid to date format'),
        }))
        .optional(),
    }),
    address: z.object({
      street: z
        .string()
        .max(200, 'Street cannot exceed 200 characters')
        .trim()
        .optional(),
      city: z
        .string({
          required_error: 'City is required',
        })
        .min(1, 'City is required')
        .max(100, 'City cannot exceed 100 characters')
        .trim(),
      state: z
        .string({
          required_error: 'State is required',
        })
        .min(1, 'State is required')
        .max(100, 'State cannot exceed 100 characters')
        .trim(),
      zipCode: z
        .string({
          required_error: 'Zip code is required',
        })
        .min(1, 'Zip code is required')
        .max(20, 'Zip code cannot exceed 20 characters')
        .trim(),
      country: z
        .string()
        .max(100, 'Country cannot exceed 100 characters')
        .trim()
    }),
    emergencyContact: z.object({
      name: z
        .string({
          required_error: 'Emergency contact name is required',
        })
        .min(1, 'Emergency contact name is required')
        .max(100, 'Emergency contact name cannot exceed 100 characters')
        .trim(),
      relationship: z
        .string({
          required_error: 'Emergency contact relationship is required',
        })
        .min(1, 'Emergency contact relationship is required')
        .max(50, 'Emergency contact relationship cannot exceed 50 characters')
        .trim(),
      phone: z
        .string({
          required_error: 'Emergency contact phone is required',
        })
        .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid emergency contact phone format'),
      email: z
        .string()
        .email('Invalid emergency contact email format')
        .toLowerCase()
        .optional(),
    }),
    salary: z.object({
      basic: z
        .number()
        .min(0, 'Basic salary cannot be negative')
        .optional(),
      allowances: z
        .number()
        .min(0, 'Allowances cannot be negative')
        .default(0)
        .optional(),
      deductions: z
        .number()
        .min(0, 'Deductions cannot be negative')
        .default(0)
        .optional(),
    }).optional(),
    isClassTeacher: z
      .boolean()
      .default(false)
      .optional(),
    classTeacherFor: z.object({
      grade: z
        .number()
        .int('Grade must be an integer')
        .min(1, 'Grade must be at least 1')
        .max(12, 'Grade cannot exceed 12'),
      section: z
        .string()
        .regex(/^[A-Z]$/, 'Section must be a single uppercase letter'),
    }).optional(),
    isActive: z
      .boolean()
      .default(true)
      .optional(),
  }).refine((data) => {
    // If isClassTeacher is true, classTeacherFor must be provided
    if (data.isClassTeacher && !data.classTeacherFor) {
      return false;
    }
    return true;
  }, {
    message: 'Class teacher assignment details are required when isClassTeacher is true',
    path: ['classTeacherFor'],
  }),
});

const updateTeacherValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Teacher ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid teacher ID format'),
  }),
  body: z.object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name cannot exceed 50 characters')
      .trim()
      .optional(),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name cannot exceed 50 characters')
      .trim()
      .optional(),
    email: z
      .string()
      .email('Invalid email format')
      .toLowerCase()
      .optional(),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format')
      .optional(),
    dob: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional(),
    joinDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional(),
    employeeId: z
      .string()
      .max(50, 'Employee ID cannot exceed 50 characters')
      .trim()
      .optional(),
    subjects: z
      .array(z.string().min(1, 'Subject cannot be empty'))
      .min(1, 'At least one subject is required')
      .max(10, 'Cannot teach more than 10 subjects')
      .optional(),
    grades: z
      .array(z.number().int().min(1, 'Grade must be at least 1').max(12, 'Grade cannot exceed 12'))
      .min(1, 'At least one grade is required')
      .max(12, 'Cannot handle more than 12 grades')
      .optional(),
    sections: z
      .array(z.string().regex(/^[A-Z]$/, 'Section must be a single uppercase letter'))
      .min(1, 'At least one section is required')
      .optional(),
    designation: z
      .enum([
        'Principal',
        'Vice Principal',
        'Head Teacher',
        'Senior Teacher',
        'Teacher',
        'Assistant Teacher',
        'Subject Coordinator',
        'Sports Teacher',
        'Music Teacher',
        'Art Teacher',
        'Librarian',
        'Lab Assistant',
      ])
      .optional(),
    bloodGroup: z
      .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .optional(),
    qualifications: z
      .array(z.object({
        degree: z
          .string()
          .min(1, 'Degree is required')
          .max(100, 'Degree cannot exceed 100 characters')
          .trim(),
        institution: z
          .string()
          .min(1, 'Institution is required')
          .max(200, 'Institution cannot exceed 200 characters')
          .trim(),
        year: z
          .number()
          .int('Year must be an integer')
          .min(1980, 'Year must be after 1980')
          .max(new Date().getFullYear(), 'Year cannot be in the future'),
        specialization: z
          .string()
          .max(100, 'Specialization cannot exceed 100 characters')
          .trim()
          .optional(),
      }))
      .max(10, 'Cannot have more than 10 qualifications')
      .optional(),
    experience: z.object({
      totalYears: z
        .number()
        .int('Total years must be an integer')
        .min(0, 'Total years cannot be negative')
        .max(50, 'Total years cannot exceed 50'),
      previousSchools: z
        .array(z.object({
          schoolName: z
            .string()
            .min(1, 'School name is required')
            .max(200, 'School name cannot exceed 200 characters')
            .trim(),
          position: z
            .string()
            .min(1, 'Position is required')
            .max(100, 'Position cannot exceed 100 characters')
            .trim(),
          duration: z
            .string()
            .min(1, 'Duration is required')
            .max(50, 'Duration cannot exceed 50 characters')
            .trim(),
          fromDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
          toDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
        }))
        .optional(),
    }).optional(),
    address: z.object({
      street: z
        .string()
        .max(200, 'Street cannot exceed 200 characters')
        .trim()
        .optional(),
      city: z
        .string()
        .min(1, 'City is required')
        .max(100, 'City cannot exceed 100 characters')
        .trim(),
      state: z
        .string()
        .min(1, 'State is required')
        .max(100, 'State cannot exceed 100 characters')
        .trim(),
      zipCode: z
        .string()
        .regex(/^\d{5,6}$/, 'Invalid zip code format'),
      country: z
        .string()
        .max(100, 'Country cannot exceed 100 characters')
        .trim(),
    }).optional(),
    emergencyContact: z.object({
      name: z
        .string()
        .min(1, 'Emergency contact name is required')
        .max(100, 'Emergency contact name cannot exceed 100 characters')
        .trim(),
      relationship: z
        .string()
        .min(1, 'Emergency contact relationship is required')
        .max(50, 'Emergency contact relationship cannot exceed 50 characters')
        .trim(),
      phone: z
        .string()
        .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid emergency contact phone format'),
      email: z
        .string()
        .email('Invalid emergency contact email format')
        .toLowerCase()
        .optional(),
    }).optional(),
    salary: z.object({
      basic: z
        .number()
        .min(0, 'Basic salary cannot be negative'),
      allowances: z
        .number()
        .min(0, 'Allowances cannot be negative')
        .default(0)
        .optional(),
      deductions: z
        .number()
        .min(0, 'Deductions cannot be negative')
        .default(0)
        .optional(),
    }).optional(),
    isClassTeacher: z
      .boolean()
      .optional(),
    classTeacherFor: z.object({
      grade: z
        .number()
        .int('Grade must be an integer')
        .min(1, 'Grade must be at least 1')
        .max(12, 'Grade cannot exceed 12'),
      section: z
        .string()
        .regex(/^[A-Z]$/, 'Section must be a single uppercase letter'),
    }).optional(),
    isActive: z
      .boolean()
      .optional(),
  }),
});

const getTeacherValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Teacher ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid teacher ID format'),
  }),
});

const deleteTeacherValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Teacher ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid teacher ID format'),
  }),
});

const getTeachersValidationSchema = z.object({
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
    subject: z
      .string()
      .min(1, 'Subject cannot be empty')
      .optional(),
    grade: z
      .string()
      .regex(/^\d+$/, 'Grade must be a number')
      .transform((val) => parseInt(val))
      .refine((val) => val >= 1 && val <= 12, 'Grade must be between 1 and 12')
      .optional(),
    designation: z
      .enum([
        'Principal',
        'Vice Principal',
        'Head Teacher',
        'Senior Teacher',
        'Teacher',
        'Assistant Teacher',
        'Subject Coordinator',
        'Sports Teacher',
        'Music Teacher',
        'Art Teacher',
        'Librarian',
        'Lab Assistant',
      ])
      .optional(),
    isActive: z
      .enum(['true', 'false', 'all'], {
        errorMap: () => ({ message: 'isActive must be true, false, or all' }),
      })
      .optional(),
    isClassTeacher: z
      .enum(['true', 'false'], {
        errorMap: () => ({ message: 'isClassTeacher must be true or false' }),
      })
      .optional(),
    search: z
      .string()
      .min(1, 'Search term must be at least 1 character')
      .max(50, 'Search term cannot exceed 50 characters')
      .optional(),
    sortBy: z
      .enum(['firstName', 'lastName', 'teacherId', 'designation', 'joinDate', 'experience.totalYears'], {
        errorMap: () => ({ message: 'Invalid sort field' }),
      })
      .optional()
      .default('joinDate'),
    sortOrder: z
      .enum(['asc', 'desc'], {
        errorMap: () => ({ message: 'Sort order must be asc or desc' }),
      })
      .optional()
      .default('desc'),
  }),
});

const uploadPhotosValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Teacher ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid teacher ID format'),
  }),
});

const deletePhotoValidationSchema = z.object({
  params: z.object({
    teacherId: z
      .string({
        required_error: 'Teacher ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid teacher ID format'),
    photoId: z
      .string({
        required_error: 'Photo ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid photo ID format'),
  }),
});

const getTeachersBySubjectSchema = z.object({
  params: z.object({
    schoolId: z
      .string({
        required_error: 'School ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format'),
    subject: z
      .string({
        required_error: 'Subject is required',
      })
      .min(1, 'Subject cannot be empty'),
  }),
});

const getTeachersStatsValidationSchema = z.object({
  params: z.object({
    schoolId: z
      .string({
        required_error: 'School ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format'),
  }),
});

const issuePunishmentValidationSchema = z.object({
  body: z.object({
    studentIds: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID format'))
      .min(1, 'At least one student ID is required')
      .max(50, 'Cannot issue punishment to more than 50 students at once'),
    punishmentType: z
      .string({
        required_error: 'Punishment type is required',
      })
      .min(1, 'Punishment type cannot be empty'),
    severity: z
      .enum(['low', 'medium', 'high', 'critical'], {
        required_error: 'Severity is required',
        invalid_type_error: 'Severity must be one of: low, medium, high, critical',
      }),
    category: z
      .enum(['behavior', 'attendance', 'academic', 'discipline', 'uniform', 'other'], {
        required_error: 'Category is required',
        invalid_type_error: 'Category must be one of: behavior, attendance, academic, discipline, uniform, other',
      }),
    title: z
      .string({
        required_error: 'Title is required',
      })
      .min(1, 'Title cannot be empty')
      .max(200, 'Title cannot exceed 200 characters')
      .trim(),
    description: z
      .string({
        required_error: 'Description is required',
      })
      .min(1, 'Description cannot be empty')
      .max(2000, 'Description cannot exceed 2000 characters')
      .trim(),
    reason: z
      .string({
        required_error: 'Reason is required',
      })
      .min(1, 'Reason cannot be empty')
      .max(500, 'Reason cannot exceed 500 characters')
      .trim(),
    actionTaken: z
      .string()
      .max(1000, 'Action taken cannot exceed 1000 characters')
      .trim()
      .optional(),
    incidentDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Incident date must be in YYYY-MM-DD format')
      .optional(),
    witnesses: z
      .array(z.string().min(1, 'Witness name cannot be empty'))
      .max(10, 'Cannot have more than 10 witnesses')
      .optional()
      .default([]),
    urgentNotification: z.boolean().optional().default(false),
    followUpRequired: z.boolean().optional().default(true),
    isAppealable: z.boolean().optional().default(true),
    appealDeadline: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Appeal deadline must be in YYYY-MM-DD format')
      .optional(),
  }),
});

const resolveDisciplinaryActionValidationSchema = z.object({
  params: z.object({
    actionId: z.string().min(1, 'Action ID is required'),
  }),
  body: z.object({
    resolutionNotes: z
      .string({
        required_error: 'Resolution notes are required',
      })
      .min(1, 'Resolution notes cannot be empty')
      .max(1000, 'Resolution notes cannot exceed 1000 characters')
      .trim(),
  }),
});

const addDisciplinaryActionCommentValidationSchema = z.object({
  params: z.object({
    actionId: z.string().min(1, 'Action ID is required'),
  }),
  body: z.object({
    comment: z
      .string({
        required_error: 'Comment is required',
      })
      .min(1, 'Comment cannot be empty')
      .max(1000, 'Comment cannot exceed 1000 characters')
      .trim(),
  }),
});

export {
  createTeacherValidationSchema,
  updateTeacherValidationSchema,
  getTeacherValidationSchema,
  deleteTeacherValidationSchema,
  getTeachersValidationSchema,
  uploadPhotosValidationSchema,
  deletePhotoValidationSchema,
  getTeachersBySubjectSchema,
  getTeachersStatsValidationSchema,
  issuePunishmentValidationSchema,
  resolveDisciplinaryActionValidationSchema,
  addDisciplinaryActionCommentValidationSchema,
};