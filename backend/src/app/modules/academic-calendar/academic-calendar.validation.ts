import { z } from "zod";

const createAcademicCalendarValidationSchema = z.object({
  body: z
    .object({
      title: z
        .string()
        .min(1, "Title is required")
        .max(200, "Title must be less than 200 characters"),
      description: z.string().optional(),
      eventType: z.enum(
        [
          "holiday",
          "exam",
          "meeting",
          "event",
          "sports",
          "cultural",
          "parent-teacher",
          "other",
        ],
        {
          required_error: "Event type is required",
        }
      ),
      startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Start date must be a valid date",
      }),
      endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "End date must be a valid date",
      }),
      isAllDay: z.boolean(),
      startTime: z
        .string()
        .optional()
        .refine(
          (time) => {
            if (!time) return true;
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
          },
          {
            message: "Start time must be in HH:MM format",
          }
        ),
      endTime: z
        .string()
        .optional()
        .refine(
          (time) => {
            if (!time) return true;
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
          },
          {
            message: "End time must be in HH:MM format",
          }
        ),
      location: z.string().optional(),
      organizerId: z.string().min(1, "Organizer ID is required"),
      schoolId: z.string().min(1, "School ID is required"),
      targetAudience: z.object({
        allSchool: z.boolean(),
        grades: z.array(z.string()).optional(),
        classes: z.array(z.string()).optional(),
        teachers: z.array(z.string()).optional(),
        students: z.array(z.string()).optional(),
        parents: z.array(z.string()).optional(),
      }),
      priority: z.enum(["low", "medium", "high"]),
      status: z.enum(["draft", "published", "cancelled"]),
      isRecurring: z.boolean(),
      recurrence: z
        .object({
          frequency: z
            .enum(["daily", "weekly", "monthly", "yearly"])
            .optional(),
          interval: z.number().min(1).optional(),
          endDate: z.string().optional(),
          occurrences: z.number().min(1).optional(),
        })
        .optional(),
      attachments: z
        .array(
          z.object({
            fileName: z.string(),
            filePath: z.string(),
            fileSize: z.number(),
            mimeType: z.string(),
          })
        )
        .optional(),
      metadata: z.record(z.any()).optional(),
    })
    .refine(
      (data) => {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        return startDate <= endDate;
      },
      {
        message: "End date must be after or equal to start date",
        path: ["endDate"],
      }
    )
    .refine(
      (data) => {
        if (!data.isAllDay && (!data.startTime || !data.endTime)) {
          return false;
        }
        return true;
      },
      {
        message:
          "Start time and end time are required when event is not all day",
        path: ["startTime"],
      }
    ),
});

const updateAcademicCalendarValidationSchema = z.object({
  body: z
    .object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      eventType: z
        .enum([
          "holiday",
          "exam",
          "meeting",
          "event",
          "sports",
          "cultural",
          "parent-teacher",
          "other",
        ])
        .optional(),
      startDate: z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), {
          message: "Start date must be a valid date",
        })
        .optional(),
      endDate: z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), {
          message: "End date must be a valid date",
        })
        .optional(),
      isAllDay: z.boolean().optional(),
      startTime: z
        .string()
        .optional()
        .refine(
          (time) => {
            if (!time) return true;
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
          },
          {
            message: "Start time must be in HH:MM format",
          }
        ),
      endTime: z
        .string()
        .optional()
        .refine(
          (time) => {
            if (!time) return true;
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
          },
          {
            message: "End time must be in HH:MM format",
          }
        ),
      location: z.string().optional(),
      targetAudience: z
        .object({
          allSchool: z.boolean(),
          grades: z.array(z.string()).optional(),
          classes: z.array(z.string()).optional(),
          teachers: z.array(z.string()).optional(),
          students: z.array(z.string()).optional(),
          parents: z.array(z.string()).optional(),
        })
        .optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      status: z.enum(["draft", "published", "cancelled"]).optional(),
      isRecurring: z.boolean().optional(),
      recurrence: z
        .object({
          frequency: z
            .enum(["daily", "weekly", "monthly", "yearly"])
            .optional(),
          interval: z.number().min(1).optional(),
          endDate: z.string().optional(),
          occurrences: z.number().min(1).optional(),
        })
        .optional(),
      attachments: z
        .array(
          z.object({
            fileName: z.string(),
            filePath: z.string(),
            fileSize: z.number(),
            mimeType: z.string(),
          })
        )
        .optional(),
      metadata: z.record(z.any()).optional(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          const startDate = new Date(data.startDate);
          const endDate = new Date(data.endDate);
          return startDate <= endDate;
        }
        return true;
      },
      {
        message: "End date must be after or equal to start date",
        path: ["endDate"],
      }
    ),
});

const createExamScheduleValidationSchema = z.object({
  body: z
    .object({
      title: z.string().min(1, "Exam title is required").max(200),
      description: z.string().optional(),
      examType: z.enum(
        [
          "midterm",
          "final",
          "unit",
          "monthly",
          "weekly",
          "quiz",
          "assignment",
          "practical",
          "oral",
          "other",
        ],
        {
          required_error: "Exam type is required",
        }
      ),
      schoolId: z.string().min(1, "School ID is required"),
      organizerId: z.string().min(1, "Organizer ID is required"),
      startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Start date must be a valid date",
      }),
      endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "End date must be a valid date",
      }),
      grades: z.array(z.string()).min(1, "At least one grade must be selected"),
      examSchedule: z
        .array(
          z.object({
            subjectId: z.string().min(1, "Subject ID is required"),
            subjectName: z.string().min(1, "Subject name is required"),
            date: z.string().refine((date) => !isNaN(Date.parse(date)), {
              message: "Exam date must be a valid date",
            }),
            startTime: z.string().refine(
              (time) => {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
              },
              {
                message: "Start time must be in HH:MM format",
              }
            ),
            endTime: z.string().refine(
              (time) => {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
              },
              {
                message: "End time must be in HH:MM format",
              }
            ),
            duration: z
              .number()
              .min(15, "Exam duration must be at least 15 minutes"),
            totalMarks: z.number().min(1, "Total marks must be at least 1"),
            room: z.string().optional(),
            supervisor: z.string().optional(),
          })
        )
        .min(1, "At least one exam must be scheduled"),
      instructions: z.array(z.string()).optional(),
      status: z.enum(["draft", "published", "cancelled"]),
    })
    .refine(
      (data) => {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        return startDate <= endDate;
      },
      {
        message: "End date must be after or equal to start date",
        path: ["endDate"],
      }
    )
    .refine(
      (data) => {
        // Validate that all exam dates are within the exam period
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        return data.examSchedule.every((exam) => {
          const examDate = new Date(exam.date);
          return examDate >= startDate && examDate <= endDate;
        });
      },
      {
        message: "All exam dates must be within the exam period",
        path: ["examSchedule"],
      }
    ),
});

export const AcademicCalendarValidation = {
  createAcademicCalendarValidationSchema,
  updateAcademicCalendarValidationSchema,
  createExamScheduleValidationSchema,
};
