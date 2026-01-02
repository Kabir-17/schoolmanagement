import { z } from 'zod';

export const getAbsenceSmsLogsValidationSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'sent', 'failed']).optional(),
    date: z
      .string()
      .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, 'Date must be in YYYY-MM-DD format')
      .optional(),
    page: z
      .string()
      .regex(/^\d+$/u, 'Page must be a positive integer')
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/u, 'Limit must be a positive integer')
      .optional(),
    messageQuery: z.string().trim().min(1).max(120).optional(),
    schoolId: z.string().optional(),
  }),
});

export const getAbsenceSmsOverviewValidationSchema = z.object({
  query: z.object({
    date: z
      .string()
      .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, 'Date must be in YYYY-MM-DD format')
      .optional(),
    schoolId: z.string().optional(),
  }),
});

export const sendAbsenceSmsTestValidationSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string()
      .trim()
      .regex(/^[+]?\d{6,20}$/u, 'Phone number must include country code and digits only'),
    studentName: z.string().trim().max(120).optional(),
    schoolName: z.string().trim().max(120).optional(),
    message: z.string().trim().max(500).optional(),
    senderName: z
      .string()
      .trim()
      .max(11, 'Sender name must be 11 characters or fewer')
      .optional(),
  }),
});
