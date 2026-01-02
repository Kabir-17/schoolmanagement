import { z } from "zod";

// Auto-Attend event validation schema
const autoAttendEventValidationSchema = z.object({
  body: z.object({
    event: z.object({
      eventId: z
        .string({
          required_error: "Event ID is required",
        })
        .min(1, "Event ID cannot be empty"),
      descriptor: z
        .string({
          required_error: "Descriptor is required",
        })
        .regex(
          /^student@[^@]+@\d+@\d+@[A-Z]+@[A-Z\+\-]+@[\w\-]+$/,
          "Descriptor must follow format: student@firstName@age@grade@section@bloodGroup@studentId"
        ),
      studentId: z
        .string({
          required_error: "Student ID is required",
        })
        .min(1, "Student ID cannot be empty"),
      firstName: z
        .string({
          required_error: "First name is required",
        })
        .min(1, "First name cannot be empty"),
      age: z.string({
        required_error: "Age is required",
      }),
      grade: z.string({
        required_error: "Grade is required",
      }),
      section: z
        .string({
          required_error: "Section is required",
        })
        .regex(/^[A-Z]+$/, "Section must be uppercase letters"),
      bloodGroup: z.string({
        required_error: "Blood group is required",
      }),
      capturedAt: z
        .string({
          required_error: "Captured timestamp is required",
        })
        .refine(
          (val) => {
            // Accept any valid ISO-8601 datetime format (with or without timezone)
            const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
            return iso8601Regex.test(val) && !isNaN(Date.parse(val));
          },
          "Captured timestamp must be a valid ISO-8601 datetime"
        ),
      capturedDate: z
        .string({
          required_error: "Captured date is required",
        })
        .regex(
          /^\d{4}-\d{2}-\d{2}$/,
          "Captured date must be in YYYY-MM-DD format"
        ),
      capturedTime: z
        .string({
          required_error: "Captured time is required",
        })
        .regex(
          /^\d{2}:\d{2}:\d{2}$/,
          "Captured time must be in HH:MM:SS format"
        ),
    }),
    source: z.object({
      app: z
        .string({
          required_error: "Source app name is required",
        })
        .min(1, "Source app name cannot be empty"),
      version: z
        .string({
          required_error: "Source app version is required",
        })
        .min(1, "Source app version cannot be empty"),
      deviceId: z.string().optional(),
    }),
    test: z.boolean().optional().default(false),
  }),
});

const createAttendanceValidationSchema = z.object({
  body: z.object({
    classId: z
      .string({
        required_error: "Class ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid class ID format"),
    subjectId: z
      .string({
        required_error: "Subject ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid subject ID format"),
    date: z
      .string({
        required_error: "Date is required",
      })
      .datetime("Invalid date format")
      .refine((date) => {
        const attendanceDate = new Date(date);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);
        return attendanceDate <= tomorrow;
      }, "Cannot mark attendance for dates beyond tomorrow"),
    period: z
      .number({
        required_error: "Period is required",
      })
      .int("Period must be an integer")
      .min(1, "Period must be at least 1")
      .max(8, "Period cannot exceed 8"),
    students: z
      .array(
        z.object({
          studentId: z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format"),
          status: z.enum(["present", "absent", "late", "excused"], {
            errorMap: () => ({
              message: "Status must be present, absent, late, or excused",
            }),
          }),
        })
      )
      .min(1, "At least one student attendance record is required")
      .max(60, "Cannot mark attendance for more than 60 students at once"),
  }),
});

const updateAttendanceValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Attendance ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid attendance ID format"),
  }),
  body: z.object({
    status: z
      .enum(["present", "absent", "late", "excused"], {
        errorMap: () => ({
          message: "Status must be present, absent, late, or excused",
        }),
      })
      .optional(),
    modificationReason: z
      .string()
      .max(200, "Modification reason cannot exceed 200 characters")
      .optional(),
  }),
});

const getAttendanceValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Attendance ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid attendance ID format"),
  }),
});

const getClassAttendanceValidationSchema = z.object({
  query: z.object({
    classId: z
      .string({
        required_error: "Class ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid class ID format"),
    date: z
      .string({
        required_error: "Date is required",
      })
      .datetime("Invalid date format"),
    period: z
      .string()
      .regex(/^\d+$/, "Period must be a number")
      .transform((val) => parseInt(val))
      .refine((val) => val >= 1 && val <= 8, "Period must be between 1 and 8")
      .optional(),
  }),
});

const getStudentAttendanceValidationSchema = z.object({
  params: z.object({
    studentId: z
      .string({
        required_error: "Student ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format"),
  }),
  query: z
    .object({
      startDate: z
        .string({
          required_error: "Start date is required",
        })
        .datetime("Invalid start date format"),
      endDate: z
        .string({
          required_error: "End date is required",
        })
        .datetime("Invalid end date format"),
      subjectId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid subject ID format")
        .optional(),
    })
    .refine(
      (data) => {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end >= start;
      },
      {
        message: "End date must be after start date",
        path: ["endDate"],
      }
    ),
});

const getAttendanceStatsValidationSchema = z.object({
  params: z.object({
    schoolId: z
      .string({
        required_error: "School ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid school ID format"),
  }),
  query: z
    .object({
      startDate: z
        .string({
          required_error: "Start date is required",
        })
        .datetime("Invalid start date format"),
      endDate: z
        .string({
          required_error: "End date is required",
        })
        .datetime("Invalid end date format"),
      grade: z
        .string()
        .regex(/^\d+$/, "Grade must be a number")
        .transform((val) => parseInt(val))
        .refine(
          (val) => val >= 1 && val <= 12,
          "Grade must be between 1 and 12"
        )
        .optional(),
      section: z
        .string()
        .regex(/^[A-Z]$/, "Section must be a single uppercase letter")
        .optional(),
    })
    .refine(
      (data) => {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        const maxDays = 365;
        const daysDiff =
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        return end >= start && daysDiff <= maxDays;
      },
      {
        message:
          "Date range cannot exceed 365 days and end date must be after start date",
        path: ["endDate"],
      }
    ),
});

const markBulkAttendanceValidationSchema = z.object({
  body: z.object({
    classId: z
      .string({
        required_error: "Class ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid class ID format"),
    subjectId: z
      .string({
        required_error: "Subject ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid subject ID format"),
    date: z
      .string({
        required_error: "Date is required",
      })
      .datetime("Invalid date format"),
    periods: z
      .array(
        z.object({
          period: z
            .number()
            .int("Period must be an integer")
            .min(1, "Period must be at least 1")
            .max(8, "Period cannot exceed 8"),
          students: z
            .array(
              z.object({
                studentId: z
                  .string()
                  .regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format"),
                status: z.enum(["present", "absent", "late", "excused"]),
              })
            )
            .min(1, "At least one student attendance record is required"),
        })
      )
      .min(1, "At least one period is required")
      .max(8, "Cannot mark attendance for more than 8 periods"),
  }),
});

const getAttendanceReportValidationSchema = z.object({
  params: z.object({
    schoolId: z
      .string({
        required_error: "School ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid school ID format"),
  }),
  query: z.object({
    startDate: z
      .string({
        required_error: "Start date is required",
      })
      .datetime("Invalid start date format"),
    endDate: z
      .string({
        required_error: "End date is required",
      })
      .datetime("Invalid end date format"),
    grade: z
      .string()
      .regex(/^\d+$/, "Grade must be a number")
      .transform((val) => parseInt(val))
      .refine((val) => val >= 1 && val <= 12, "Grade must be between 1 and 12")
      .optional(),
    section: z
      .string()
      .regex(/^[A-Z]$/, "Section must be a single uppercase letter")
      .optional(),
    studentId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format")
      .optional(),
    format: z
      .enum(["json", "csv", "pdf"], {
        errorMap: () => ({ message: "Format must be json, csv, or pdf" }),
      })
      .optional()
      .default("json"),
    minAttendance: z
      .string()
      .regex(/^\d+$/, "Minimum attendance must be a number")
      .transform((val) => parseInt(val))
      .refine(
        (val) => val >= 0 && val <= 100,
        "Minimum attendance must be between 0 and 100"
      )
      .optional(),
  }),
});

export {
  autoAttendEventValidationSchema,
  createAttendanceValidationSchema,
  updateAttendanceValidationSchema,
  getAttendanceValidationSchema,
  getClassAttendanceValidationSchema,
  getStudentAttendanceValidationSchema,
  getAttendanceStatsValidationSchema,
  markBulkAttendanceValidationSchema,
  getAttendanceReportValidationSchema,
};
