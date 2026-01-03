import { z } from 'zod';

// Address validation schema
const addressValidationSchema = z.object({
  street: z.string().min(1, 'Street is required').max(200, 'Street cannot exceed 200 characters'),
  city: z.string().min(1, 'City is required').max(100, 'City cannot exceed 100 characters'),
  state: z.string().min(1, 'State is required').max(100, 'State cannot exceed 100 characters'),
  country: z.string().min(1, 'Country is required').max(100, 'Country cannot exceed 100 characters'),
  postalCode: z.string().min(1, 'Postal code is required').max(20, 'Postal code cannot exceed 20 characters'),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional()
});

// Contact validation schema
const contactValidationSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').toLowerCase(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('').transform(() => undefined)),
  fax: z.string().optional()
});

// Admin details validation schema
const adminDetailsValidationSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name cannot exceed 50 characters'),
  email: z.string().email('Invalid email format').toLowerCase(),
  phone: z.string().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username cannot exceed 50 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password cannot exceed 100 characters')
});

// Current session validation schema
const currentSessionValidationSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format')
});

const settingsValidationSchema = z.object({
  maxStudentsPerSection: z
    .number()
    .min(1, 'Maximum students per section must be at least 1')
    .optional(),
  grades: z
    .array(z.number().min(1).max(13))
    .min(1, 'At least one grade must be specified')
    .optional(),
  sections: z
    .array(z.string().regex(/^[A-Z]$/, 'Sections must be uppercase letters'))
    .min(1, 'At least one section must be specified')
    .optional(),
  academicYearStart: z
    .number()
    .min(1, 'Academic year start month must be between 1 and 12')
    .max(12, 'Academic year start month must be between 1 and 12')
    .optional(),
  academicYearEnd: z
    .number()
    .min(1, 'Academic year end month must be between 1 and 12')
    .max(12, 'Academic year end month must be between 1 and 12')
    .optional(),
  attendanceGracePeriod: z
    .number()
    .min(0, 'Attendance grace period cannot be negative')
    .max(60, 'Attendance grace period cannot exceed 60 minutes')
    .optional(),
});

const createSchoolValidationSchema = z.object({
  body: z.object({
    orgId: z
      .string({
        required_error: 'Organization ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid organization ID format')
      .optional(), // Make optional for backward compatibility
    name: z
      .string({
        required_error: 'School name is required',
      })
      .min(2, 'School name must be at least 2 characters')
      .max(100, 'School name cannot exceed 100 characters')
      .trim(),
    establishedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
    address: addressValidationSchema,
    contact: contactValidationSchema,
    adminDetails: adminDetailsValidationSchema,
    affiliation: z.string().max(100, 'Affiliation cannot exceed 100 characters').optional(),
    recognition: z.string().max(200, 'Recognition cannot exceed 200 characters').optional(),
    logo: z.string().url('Invalid logo URL').optional(),
  }),
});

const updateSchoolValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'School ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format'),
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'School name must be at least 2 characters')
      .max(100, 'School name cannot exceed 100 characters')
      .trim()
      .optional(),
    establishedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
    address: addressValidationSchema.optional(),
    contact: contactValidationSchema.optional(),
    affiliation: z.string().max(100, 'Affiliation cannot exceed 100 characters').optional(),
    recognition: z.string().max(200, 'Recognition cannot exceed 200 characters').optional(),
    logo: z.string().url('Invalid logo URL').optional(),
    status: z
      .enum(['active', 'inactive', 'suspended'], {
        errorMap: () => ({ message: 'Status must be active, inactive, or suspended' }),
      })
      .optional(),
    settings: settingsValidationSchema.optional(),
  }),
});

const getSchoolValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'School ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format'),
  }),
});

const deleteSchoolValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'School ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format'),
  }),
});

const getSchoolsValidationSchema = z.object({
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
    orgId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid organization ID format')
      .optional(),
    status: z
      .enum(['active', 'inactive', 'suspended', 'all'], {
        errorMap: () => ({ message: 'Status must be active, inactive, suspended, or all' }),
      })
      .optional(),
    search: z
      .string()
      .min(1, 'Search term must be at least 1 character')
      .max(50, 'Search term cannot exceed 50 characters')
      .optional(),
    sortBy: z
      .enum(['name', 'createdAt', 'updatedAt'], {
        errorMap: () => ({ message: 'Sort by must be name, createdAt, or updatedAt' }),
      })
      .optional()
      .default('name'),
    sortOrder: z
      .enum(['asc', 'desc'], {
        errorMap: () => ({ message: 'Sort order must be asc or desc' }),
      })
      .optional()
      .default('asc'),
  }),
});

const resetAdminPasswordValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'School ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format'),
  }),
  body: z.object({
    newPassword: z
      .string({
        required_error: 'New password is required',
      })
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password cannot exceed 50 characters'),
  }),
});

export {
  createSchoolValidationSchema,
  updateSchoolValidationSchema,
  getSchoolValidationSchema,
  deleteSchoolValidationSchema,
  getSchoolsValidationSchema,
  resetAdminPasswordValidationSchema,
};