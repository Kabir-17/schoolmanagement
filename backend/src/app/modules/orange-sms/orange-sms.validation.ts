import { z } from 'zod';

export const updateOrangeSmsValidationSchema = z.object({
  body: z
    .object({
      clientId: z.string().trim().min(1, 'Client ID cannot be empty').optional(),
      clientSecret: z
        .string()
        .trim()
        .min(8, 'Client secret must be at least 8 characters')
        .optional(),
      senderAddress: z
        .string()
        .trim()
        .regex(/^\+?\d+$/, 'Sender address must contain digits and optional leading +')
        .optional(),
      senderName: z
        .string()
        .trim()
        .max(11, 'Sender name must be 11 characters or fewer')
        .optional(),
      countryCode: z
        .string()
        .trim()
        .regex(/^\d{1,4}$/, 'Country code must be numeric')
        .optional(),
    })
    .refine(
      (data) =>
        Object.values(data).some((value) => value !== undefined && value !== null),
      {
        message: 'At least one field must be provided to update Orange SMS configuration',
        path: [],
      }
    ),
});

export const sendOrangeSmsTestValidationSchema = z.object({
  body: z
    .object({
      phoneNumber: z
        .string()
        .trim()
        .regex(/^[+]?\d{6,20}$/u, 'Phone number must include country code and digits only'),
      message: z.string().trim().min(1, 'Message is required').max(500),
      senderName: z.string().trim().max(11).optional(),
      clientId: z.string().trim().optional(),
      clientSecret: z.string().trim().optional(),
    })
    .superRefine((data, ctx) => {
      if ((data.clientId && !data.clientSecret) || (!data.clientId && data.clientSecret)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Both clientId and clientSecret are required when testing with overrides',
        });
      }
    }),
});
