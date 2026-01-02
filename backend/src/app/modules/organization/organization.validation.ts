import { z } from 'zod';

const createOrganizationValidationSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Organization name is required',
      })
      .min(2, 'Organization name must be at least 2 characters')
      .max(100, 'Organization name cannot exceed 100 characters')
      .trim(),
    status: z
      .enum(['active', 'inactive'], {
        errorMap: () => ({ message: 'Status must be active or inactive' }),
      })
      .optional(),
  }),
});

const updateOrganizationValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Organization ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid organization ID format'),
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Organization name must be at least 2 characters')
      .max(100, 'Organization name cannot exceed 100 characters')
      .trim()
      .optional(),
    status: z
      .enum(['active', 'inactive', 'suspended'], {
        errorMap: () => ({ message: 'Status must be active, inactive, or suspended' }),
      })
      .optional(),
  }),
});

const getOrganizationValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Organization ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid organization ID format'),
  }),
});

const deleteOrganizationValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Organization ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid organization ID format'),
  }),
});

const getOrganizationsValidationSchema = z.object({
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

export {
  createOrganizationValidationSchema,
  updateOrganizationValidationSchema,
  getOrganizationValidationSchema,
  deleteOrganizationValidationSchema,
  getOrganizationsValidationSchema,
};