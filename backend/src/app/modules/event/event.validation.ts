import { z } from 'zod';

const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
    time: z.string().optional(),
    location: z.string().max(200, 'Location cannot exceed 200 characters').optional(),
    type: z.enum(['academic', 'extracurricular', 'administrative', 'holiday', 'exam', 'meeting', 'announcement', 'other'], {
      errorMap: () => ({ message: 'Type must be one of: academic, extracurricular, administrative, holiday, exam, meeting, announcement, other' })
    }),
    targetAudience: z.object({
      roles: z.array(z.enum(['admin', 'teacher', 'student', 'parent'])).min(1, 'At least one role must be selected'),
      grades: z.array(z.number().min(1).max(12)).optional(),
      sections: z.array(z.string()).optional(),
      specific: z.array(z.string()).optional()
    }),
    isActive: z.boolean().optional().default(true)
  })
});

const updateEventSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters').optional(),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format').optional(),
    time: z.string().optional(),
    location: z.string().max(200, 'Location cannot exceed 200 characters').optional(),
    type: z.enum(['academic', 'extracurricular', 'administrative', 'holiday', 'exam', 'meeting', 'announcement', 'other']).optional(),
    targetAudience: z.object({
      roles: z.array(z.enum(['admin', 'teacher', 'student', 'parent'])).min(1, 'At least one role must be selected'),
      grades: z.array(z.number().min(1).max(12)).optional(),
      sections: z.array(z.string()).optional(),
      specific: z.array(z.string()).optional()
    }).optional(),
    isActive: z.boolean().optional()
  })
});

const getEventsSchema = z.object({
  query: z.object({
    type: z.enum(['academic', 'extracurricular', 'administrative', 'holiday', 'exam', 'meeting', 'announcement', 'other']).optional(),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date format').optional(),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date format').optional(),
    grade: z.string().transform((val) => parseInt(val)).refine((val) => val >= 1 && val <= 12, 'Grade must be between 1 and 12').optional(),
    section: z.string().optional(),
    page: z.string().transform((val) => parseInt(val)).refine((val) => val > 0, 'Page must be greater than 0').optional().default('1'),
    limit: z.string().transform((val) => parseInt(val)).refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100').optional().default('20'),
    isActive: z.string().transform((val) => val === 'true').optional()
  })
});

const getEventByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Event ID is required')
  })
});

export const eventValidation = {
  createEventSchema,
  updateEventSchema,
  getEventsSchema,
  getEventByIdSchema
};