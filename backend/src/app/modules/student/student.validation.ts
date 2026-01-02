import { z } from "zod";

const createStudentValidationSchema = z.object({
  body: z.object({
    schoolId: z
      .string({
        required_error: "School ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid school ID format"),
    firstName: z
      .string({
        required_error: "First name is required",
      })
      .min(1, "First name is required")
      .max(50, "First name cannot exceed 50 characters")
      .trim(),
    lastName: z
      .string({
        required_error: "Last name is required",
      })
      .min(1, "Last name is required")
      .max(50, "Last name cannot exceed 50 characters")
      .trim(),
    email: z.string().email("Invalid email format").toLowerCase().optional(),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format")
      .optional(),
    // Fix: Handle FormData string-to-number conversion for grade
    grade: z
      .string({
        required_error: "Grade is required",
      })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val), "Grade must be a valid number")
      .refine((val) => val >= 1 && val <= 12, "Grade must be between 1 and 12"),
    section: z
      .string()
      .default("A")
      .refine(
        (val) => /^[A-Z]$/.test(val),
        "Section must be a single uppercase letter"
      )
      .transform((val) => val.toUpperCase()),
    bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
      errorMap: () => ({ message: "Invalid blood group" }),
    }),
    dob: z
      .string({
        required_error: "Date of birth is required",
      })
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Date of birth must be in YYYY-MM-DD format"
      )
      .refine((date) => {
        const dob = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        return age >= 3 && age <= 25;
      }, "Student age must be between 3 and 25 years"),
    admissionDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Admission date must be in YYYY-MM-DD format"
      )
      .optional(),
    // Make auto-generated fields optional in validation
    admissionYear: z.number().optional(),
    studentId: z.string().optional(),
    rollNumber: z
      .number()
      .int("Roll number must be an integer")
      .min(1, "Roll number must be at least 1")
      .max(60, "Roll number cannot exceed 60")
      .optional(),
    address: z
      .object({
        street: z
          .string()
          .max(100, "Street address cannot exceed 100 characters")
          .trim()
          .optional(),
        city: z
          .string()
          .max(50, "City cannot exceed 50 characters")
          .trim()
          .optional(),
        state: z
          .string()
          .max(50, "State cannot exceed 50 characters")
          .trim()
          .optional(),
        country: z
          .string()
          .max(50, "Country cannot exceed 50 characters")
          .trim()
          .optional(),
        postalCode: z
          .string()
          .max(20, "Postal code cannot exceed 20 characters")
          .trim()
          .optional(),
      })
      .optional(),
    parentInfo: z.object({
      name: z
        .string()
        .min(1, "Parent name is required")
        .max(100, "Parent name cannot exceed 100 characters")
        .trim(),
      email: z
        .string()
        .email("Invalid parent email format")
        .toLowerCase()
        .optional(),
      phone: z
        .string()
        .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid parent phone number format")
        .optional(),
      address: z
        .string()
        .max(200, "Address cannot exceed 200 characters")
        .trim()
        .optional(),
      occupation: z
        .string()
        .max(100, "Occupation cannot exceed 100 characters")
        .trim()
        .optional(),
    }),
  }),
});

const updateStudentValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Student ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format"),
  }),
  body: z.object({
    grade: z
      .number()
      .int("Grade must be an integer")
      .min(1, "Grade must be at least 1")
      .max(12, "Grade cannot exceed 12")
      .optional(),
    section: z
      .string()
      .regex(/^[A-Z]$/, "Section must be a single uppercase letter")
      .transform((val) => val.toUpperCase())
      .optional(),
    bloodGroup: z
      .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
        errorMap: () => ({ message: "Invalid blood group" }),
      })
      .optional(),
    dob: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Date of birth must be in YYYY-MM-DD format"
      )
      .refine((date) => {
        const dob = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        return age >= 3 && age <= 25;
      }, "Student age must be between 3 and 25 years")
      .optional(),
    rollNumber: z
      .number()
      .int("Roll number must be an integer")
      .min(1, "Roll number must be at least 1")
      .max(60, "Roll number cannot exceed 60")
      .optional(),
    isActive: z.boolean().optional(),
    address: z
      .object({
        street: z
          .string()
          .max(100, "Street address cannot exceed 100 characters")
          .trim()
          .optional(),
        city: z
          .string()
          .max(50, "City cannot exceed 50 characters")
          .trim()
          .optional(),
        state: z
          .string()
          .max(50, "State cannot exceed 50 characters")
          .trim()
          .optional(),
        country: z
          .string()
          .max(50, "Country cannot exceed 50 characters")
          .trim()
          .optional(),
        postalCode: z
          .string()
          .max(20, "Postal code cannot exceed 20 characters")
          .trim()
          .optional(),
      })
      .optional(),
    parentInfo: z
      .object({
        name: z
          .string()
          .min(1, "Parent name is required")
          .max(100, "Parent name cannot exceed 100 characters")
          .trim()
          .optional(),
        email: z
          .string()
          .email("Invalid parent email format")
          .toLowerCase()
          .optional(),
        phone: z
          .string()
          .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid parent phone number format")
          .optional(),
        address: z
          .string()
          .max(200, "Address cannot exceed 200 characters")
          .trim()
          .optional(),
        occupation: z
          .string()
          .max(100, "Occupation cannot exceed 100 characters")
          .trim()
          .optional(),
      })
      .optional(),
  }),
});

const getStudentValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Student ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format"),
  }),
});

const deleteStudentValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Student ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format"),
  }),
});

const getStudentsValidationSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, "Page must be a positive number")
      .transform((val) => parseInt(val))
      .refine((val) => val > 0, "Page must be greater than 0")
      .optional()
      .default("1"),
    limit: z
      .string()
      .regex(/^\d+$/, "Limit must be a positive number")
      .transform((val) => parseInt(val))
      .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100")
      .optional()
      .default("20"),
    schoolId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid school ID format")
      .optional(),
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
    isActive: z
      .enum(["true", "false", "all"], {
        errorMap: () => ({ message: "isActive must be true, false, or all" }),
      })
      .optional(),
    search: z
      .string()
      .min(1, "Search term must be at least 1 character")
      .max(50, "Search term cannot exceed 50 characters")
      .optional(),
    sortBy: z
      .enum(
        [
          "firstName",
          "lastName",
          "studentId",
          "grade",
          "section",
          "admissionDate",
          "rollNumber",
        ],
        {
          errorMap: () => ({ message: "Invalid sort field" }),
        }
      )
      .optional()
      .default("grade"),
    sortOrder: z
      .enum(["asc", "desc"], {
        errorMap: () => ({ message: "Sort order must be asc or desc" }),
      })
      .optional()
      .default("asc"),
  }),
});

const uploadPhotosValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Student ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format"),
  }),
});

const deletePhotoValidationSchema = z.object({
  params: z.object({
    studentId: z
      .string({
        required_error: "Student ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID format"),
    photoId: z
      .string({
        required_error: "Photo ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid photo ID format"),
  }),
});

const getStudentsByGradeAndSectionSchema = z.object({
  params: z.object({
    schoolId: z
      .string({
        required_error: "School ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid school ID format"),
    grade: z
      .string({
        required_error: "Grade is required",
      })
      .regex(/^\d+$/, "Grade must be a number")
      .transform((val) => parseInt(val))
      .refine((val) => val >= 1 && val <= 12, "Grade must be between 1 and 12"),
    section: z
      .string({
        required_error: "Section is required",
      })
      .regex(/^[A-Z]$/, "Section must be a single uppercase letter"),
  }),
});

const getStudentStatsValidationSchema = z.object({
  params: z.object({
    schoolId: z
      .string({
        required_error: "School ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid school ID format"),
  }),
});

export {
  createStudentValidationSchema,
  updateStudentValidationSchema,
  getStudentValidationSchema,
  deleteStudentValidationSchema,
  getStudentsValidationSchema,
  uploadPhotosValidationSchema,
  deletePhotoValidationSchema,
  getStudentsByGradeAndSectionSchema,
  getStudentStatsValidationSchema,
};
