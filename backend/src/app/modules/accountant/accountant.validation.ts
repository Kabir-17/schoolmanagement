import { z } from 'zod';

const createAccountantValidationSchema = z.object({
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
    department: z
      .enum([
        'Finance',
        'Payroll',
        'Accounts Payable',
        'Accounts Receivable',
        'Budget Management',
        'Financial Reporting',
        'Audit',
        'Tax',
        'General Accounting',
      ], {
        errorMap: () => ({ message: 'Invalid department' }),
      }),
    designation: z
      .enum([
        'Chief Financial Officer',
        'Finance Manager',
        'Chief Accountant',
        'Senior Accountant',
        'Accountant',
        'Junior Accountant',
        'Accounts Assistant',
        'Payroll Officer',
        'Financial Analyst',
        'Auditor',
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
      }, 'Accountant age must be between 21 and 65 years'),
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
          .int()
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
        .number()
        .min(0, 'Experience cannot be negative')
        .max(45, 'Experience cannot exceed 45 years'),
      previousOrganizations: z
        .array(z.object({
          organizationName: z
            .string()
            .min(1, 'Organization name is required')
            .max(200, 'Organization name cannot exceed 200 characters')
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
        .regex(/^\d{5,6}$/, 'Invalid zip code format')
        .trim(),
      country: z
        .string()
        .min(1, 'Country is required')
        .max(100, 'Country cannot exceed 100 characters')
        .trim(),
    }),
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
    }),
    salary: z.object({
      basic: z
        .number()
        .min(0, 'Basic salary cannot be negative')
        .optional(),
      allowances: z
        .number()
        .min(0, 'Allowances cannot be negative')
        .optional(),
      deductions: z
        .number()
        .min(0, 'Deductions cannot be negative')
        .optional(),
    }).optional(),
    responsibilities: z
      .array(z.string().min(1, 'Responsibility cannot be empty'))
      .optional(),
    certifications: z
      .array(z.string().min(1, 'Certification cannot be empty'))
      .optional(),
    isActive: z
      .boolean()
      .optional()
      .default(true),
  }),
});

const updateAccountantValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Accountant ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid accountant ID format'),
  }),
  body: z.object({
    firstName: z
      .string()
      .min(1, 'First name cannot be empty')
      .max(50, 'First name cannot exceed 50 characters')
      .trim()
      .optional(),
    lastName: z
      .string()
      .min(1, 'Last name cannot be empty')
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
      .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
      .optional(),
    employeeId: z
      .string()
      .max(50, 'Employee ID cannot exceed 50 characters')
      .trim()
      .optional(),
    department: z
      .enum([
        'Finance',
        'Payroll',
        'Accounts Payable',
        'Accounts Receivable',
        'Budget Management',
        'Financial Reporting',
        'Audit',
        'Tax',
        'General Accounting',
      ])
      .optional(),
    designation: z
      .enum([
        'Chief Financial Officer',
        'Finance Manager',
        'Chief Accountant',
        'Senior Accountant',
        'Accountant',
        'Junior Accountant',
        'Accounts Assistant',
        'Payroll Officer',
        'Financial Analyst',
        'Auditor',
      ])
      .optional(),
    bloodGroup: z
      .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .optional(),
    dob: z
      .string()
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
      }, 'Accountant age must be between 21 and 65 years')
      .optional(),
    joinDate: z
      .string()
      .date('Invalid date format')
      .optional(),
    qualifications: z
      .array(z.object({
        degree: z.string().min(1).max(100).trim(),
        institution: z.string().min(1).max(200).trim(),
        year: z.number().int().min(1980).max(new Date().getFullYear()),
        specialization: z.string().max(100).trim().optional(),
      }))
      .min(1)
      .max(10)
      .optional(),
    experience: z.object({
      totalYears: z.number().min(0).max(45),
      previousOrganizations: z
        .array(z.object({
          organizationName: z.string().min(1).max(200).trim(),
          position: z.string().min(1).max(100).trim(),
          duration: z.string().min(1).max(50).trim(),
          fromDate: z.string().date(),
          toDate: z.string().date(),
        }))
        .optional(),
    }).optional(),
    address: z.object({
      street: z.string().max(200).trim().optional(),
      city: z.string().min(1).max(100).trim(),
      state: z.string().min(1).max(100).trim(),
      zipCode: z.string().regex(/^\d{5,6}$/).trim(),
      country: z.string().min(1).max(100).trim(),
    }).optional(),
    emergencyContact: z.object({
      name: z.string().min(1).max(100).trim(),
      relationship: z.string().min(1).max(50).trim(),
      phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/),
      email: z.string().email().toLowerCase().optional(),
    }).optional(),
    salary: z.object({
      basic: z.number().min(0).optional(),
      allowances: z.number().min(0).optional(),
      deductions: z.number().min(0).optional(),
    }).optional(),
    responsibilities: z.array(z.string().min(1)).optional(),
    certifications: z.array(z.string().min(1)).optional(),
    isActive: z.boolean().optional(),
  }),
});

const getAccountantValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Accountant ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid accountant ID format'),
  }),
});

const deleteAccountantValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Accountant ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid accountant ID format'),
  }),
});

const getAccountantsValidationSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});

const uploadPhotosValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Accountant ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid accountant ID format'),
  }),
});

const deletePhotoValidationSchema = z.object({
  params: z.object({
    accountantId: z
      .string({
        required_error: 'Accountant ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid accountant ID format'),
    photoId: z
      .string({
        required_error: 'Photo ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid photo ID format'),
  }),
});

const getAccountantsByDepartmentSchema = z.object({
  params: z.object({
    schoolId: z
      .string({
        required_error: 'School ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format'),
    department: z
      .string({
        required_error: 'Department is required',
      })
      .min(1, 'Department cannot be empty'),
  }),
});

const getAccountantsStatsValidationSchema = z.object({
  params: z.object({
    schoolId: z
      .string({
        required_error: 'School ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format'),
  }),
});

export {
  createAccountantValidationSchema,
  updateAccountantValidationSchema,
  getAccountantValidationSchema,
  deleteAccountantValidationSchema,
  getAccountantsValidationSchema,
  uploadPhotosValidationSchema,
  deletePhotoValidationSchema,
  getAccountantsByDepartmentSchema,
  getAccountantsStatsValidationSchema,
};
