import { z } from "zod";

const createSchedulePeriodSchema = z
  .object({
    periodNumber: z
      .number()
      .min(1, "Period number must be at least 1")
      .max(10, "Period number cannot exceed 10"),
    subjectId: z.string().optional(),
    teacherId: z.string().optional(),
    roomNumber: z
      .string()
      .max(10, "Room number cannot exceed 10 characters")
      .optional(),
    startTime: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Start time must be in HH:MM format"
      ),
    endTime: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "End time must be in HH:MM format"
      ),
    isBreak: z.boolean().optional().default(false),
    breakType: z.enum(["short", "lunch", "long"]).optional(),
    breakDuration: z
      .number()
      .min(5, "Break duration must be at least 5 minutes")
      .max(60, "Break duration cannot exceed 60 minutes")
      .optional(),
  })
  .refine(
    (data) => {
      // If it's not a break, subjectId and teacherId are required
      if (!data.isBreak) {
        return data.subjectId && data.teacherId;
      }
      // If it's a break, breakType and breakDuration are required
      if (data.isBreak) {
        return data.breakType && data.breakDuration;
      }
      return true;
    },
    {
      message:
        "For class periods, subjectId and teacherId are required. For breaks, breakType and breakDuration are required",
    }
  )
  .refine(
    (data) => {
      // Validate time sequence
      const startTime = new Date(`2024-01-01T${data.startTime}:00`);
      const endTime = new Date(`2024-01-01T${data.endTime}:00`);
      return startTime < endTime;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

const createScheduleValidationSchema = z.object({
  body: z.object({
    schoolId: z.string().min(1, "School ID is required"),
    classId: z.string().optional(), // Made optional as it's handled automatically
    grade: z
      .number()
      .min(1, "Grade must be at least 1")
      .max(12, "Grade cannot exceed 12"),
    section: z
      .string()
      .min(1, "Section is required")
      .max(1, "Section must be a single character")
      .regex(/^[A-Z]$/, "Section must be an uppercase letter"),
    academicYear: z
      .string()
      .regex(/^\d{4}-\d{4}$/, "Academic year must be in YYYY-YYYY format"),
    dayOfWeek: z.enum(
      [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
      {
        required_error: "Day of week is required",
      }
    ),
    periods: z
      .array(createSchedulePeriodSchema)
      .min(1, "At least one period is required")
      .refine(
        (periods) => {
          // Check for duplicate period numbers
          const periodNumbers = periods.map((p) => p.periodNumber);
          return new Set(periodNumbers).size === periodNumbers.length;
        },
        {
          message: "Duplicate period numbers are not allowed",
        }
      ),
  }),
});

const updateScheduleValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Schedule ID is required"),
  }),
  body: z.object({
    periods: z
      .array(createSchedulePeriodSchema)
      .optional()
      .refine(
        (periods) => {
          if (!periods) return true;
          // Check for duplicate period numbers
          const periodNumbers = periods.map((p) => p.periodNumber);
          return new Set(periodNumbers).size === periodNumbers.length;
        },
        {
          message: "Duplicate period numbers are not allowed",
        }
      ),
    isActive: z.boolean().optional(),
  }),
});

const assignSubstituteTeacherValidationSchema = z.object({
  body: z
    .object({
      substituteTeacherId: z
        .string()
        .min(1, "Substitute teacher ID is required"),
      startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Start date must be a valid date",
      }),
      endDate: z
        .string()
        .optional()
        .refine(
          (date) => {
            if (!date) return true;
            return !isNaN(Date.parse(date));
          },
          {
            message: "End date must be a valid date",
          }
        ),
      reason: z
        .string()
        .max(500, "Reason cannot exceed 500 characters")
        .optional(),
    })
    .refine(
      (data) => {
        if (data.endDate) {
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

const bulkCreateScheduleValidationSchema = z.object({
  body: z.object({
    schedules: z
      .array(
        z.object({
          schoolId: z.string().min(1, "School ID is required"),
          classId: z.string().optional(), // Made optional as it's handled automatically
          grade: z
            .number()
            .min(1, "Grade must be at least 1")
            .max(12, "Grade cannot exceed 12"),
          section: z
            .string()
            .min(1, "Section is required")
            .max(1, "Section must be a single character")
            .regex(/^[A-Z]$/, "Section must be an uppercase letter"),
          academicYear: z
            .string()
            .regex(
              /^\d{4}-\d{4}$/,
              "Academic year must be in YYYY-YYYY format"
            ),
          dayOfWeek: z.enum([
            "monday",
            "sunday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ]),
          periods: z
            .array(createSchedulePeriodSchema)
            .min(1, "At least one period is required"),
        })
      )
      .min(1, "At least one schedule is required"),
  }),
});

const getSchedulesByClassValidationSchema = z.object({
  params: z.object({
    schoolId: z.string().min(1, "School ID is required"),
    grade: z.string().regex(/^\d+$/, "Grade must be a number"),
    section: z
      .string()
      .min(1, "Section is required")
      .max(1, "Section must be a single character"),
  }),
});

const getWeeklyScheduleValidationSchema = z.object({
  params: z.object({
    schoolId: z.string().min(1, "School ID is required"),
    grade: z.string().regex(/^\d+$/, "Grade must be a number"),
    section: z
      .string()
      .min(1, "Section is required")
      .max(1, "Section must be a single character"),
  }),
});

const getTeacherScheduleValidationSchema = z.object({
  params: z.object({
    teacherId: z.string().min(1, "Teacher ID is required"),
  }),
});

const getScheduleStatsValidationSchema = z.object({
  params: z.object({
    schoolId: z.string().min(1, "School ID is required"),
  }),
});

const getSubjectSchedulesValidationSchema = z.object({
  params: z.object({
    subjectId: z.string().min(1, "Subject ID is required"),
  }),
});

export const ScheduleValidation = {
  createScheduleValidationSchema,
  updateScheduleValidationSchema,
  assignSubstituteTeacherValidationSchema,
  bulkCreateScheduleValidationSchema,
  getSchedulesByClassValidationSchema,
  getWeeklyScheduleValidationSchema,
  getTeacherScheduleValidationSchema,
  getScheduleStatsValidationSchema,
  getSubjectSchedulesValidationSchema,
};
