import { z } from 'zod';

const createUserValidationSchema = z.object({
  body: z.object({
    schoolId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid school ID format')
      .optional(),
    role: z.enum(['admin', 'teacher', 'student', 'parent', 'accountant'], {
      errorMap: () => ({ message: 'Role must be one of: admin, teacher, student, parent, accountant' }),
    }),
    username: z
      .string({
        required_error: 'Username is required',
      })
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(/^[a-z0-9_.-]+$/, 'Username can only contain lowercase letters, numbers, dots, hyphens, and underscores')
      .toLowerCase(),
    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password cannot exceed 50 characters'),
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
  }),
});

const updateUserValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'User ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
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
      .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
      .optional(),
    isActive: z
      .boolean()
      .optional(),
  }),
});

const getUserValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'User ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
});

const deleteUserValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'User ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
});

const getUsersValidationSchema = z.object({
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
    role: z
      .enum(['superadmin', 'admin', 'teacher', 'student', 'parent', 'accountant', 'all'], {
        errorMap: () => ({ message: 'Role must be one of: superadmin, admin, teacher, student, parent, accountant, all' }),
      })
      .optional(),
    isActive: z
      .enum(['true', 'false', 'all'], {
        errorMap: () => ({ message: 'isActive must be true, false, or all' }),
      })
      .optional(),
    search: z
      .string()
      .min(1, 'Search term must be at least 1 character')
      .max(50, 'Search term cannot exceed 50 characters')
      .optional(),
    sortBy: z
      .enum(['firstName', 'lastName', 'username', 'role', 'createdAt', 'lastLogin'], {
        errorMap: () => ({ message: 'Sort by must be firstName, lastName, username, role, createdAt, or lastLogin' }),
      })
      .optional()
      .default('firstName'),
    sortOrder: z
      .enum(['asc', 'desc'], {
        errorMap: () => ({ message: 'Sort order must be asc or desc' }),
      })
      .optional()
      .default('asc'),
  }),
});

const changePasswordValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'User ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
  body: z.object({
    currentPassword: z
      .string({
        required_error: 'Current password is required',
      })
      .min(1, 'Current password is required'),
    newPassword: z
      .string({
        required_error: 'New password is required',
      })
      .min(6, 'New password must be at least 6 characters')
      .max(50, 'New password cannot exceed 50 characters'),
  }),
});

const resetPasswordValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'User ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
  body: z.object({
    newPassword: z
      .string({
        required_error: 'New password is required',
      })
      .min(6, 'New password must be at least 6 characters')
      .max(50, 'New password cannot exceed 50 characters'),
  }),
});

const loginValidationSchema = z.object({
  body: z.object({
    username: z
      .string({
        required_error: 'Username is required',
      })
      .min(1, 'Username is required')
      .toLowerCase(),
    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(1, 'Password is required'),
  }),
});

export {
  createUserValidationSchema,
  updateUserValidationSchema,
  getUserValidationSchema,
  deleteUserValidationSchema,
  getUsersValidationSchema,
  changePasswordValidationSchema,
  resetPasswordValidationSchema,
  loginValidationSchema,
};