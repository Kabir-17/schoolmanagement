import { z } from "zod";

const objectId = z
  .string()
  .min(1, "Identifier is required")
  .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid Mongo ObjectId");

export const listThreadsQuerySchema = z.object({
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((value) => (value ? Number.parseInt(value, 10) : undefined))
      .refine(
        (value) => value === undefined || (Number.isInteger(value) && value > 0 && value <= 100),
        "limit must be between 1 and 100"
      )
      .optional(),
  }),
});

export const createThreadSchema = z.object({
  body: z.object({
    participantIds: z
      .array(objectId)
      .min(1, "At least one participant is required"),
    contextStudentId: objectId.optional(),
  }),
});

export const newMessageSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    body: z
      .string()
      .trim()
      .min(1, "Message cannot be empty")
      .max(2000, "Message is too long"),
  }),
});

export const listMessagesQuerySchema = z.object({
  params: z.object({
    id: objectId,
  }),
  query: z.object({
    cursor: z
      .string()
      .datetime()
      .optional(),
    limit: z
      .string()
      .optional()
      .transform((value) => (value ? Number.parseInt(value, 10) : undefined))
      .refine(
        (value) => value === undefined || (Number.isInteger(value) && value > 0 && value <= 100),
        "limit must be between 1 and 100"
      )
      .optional(),
  }),
});

export const listContactsQuerySchema = z.object({
  query: z.object({
    includeParents: z
      .string()
      .transform((value) => value === "true")
      .optional(),
  }),
});
