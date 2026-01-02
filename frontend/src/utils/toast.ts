import { toast } from "sonner";

// Toast utility functions
export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 6000,
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 5000,
    });
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  dismiss: (toastId?: string | number) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  },
};

// Field name mappings for user-friendly display
const FIELD_NAME_MAPPING: Record<string, string> = {
  // User fields
  firstName: "First Name",
  lastName: "Last Name", 
  email: "Email Address",
  phone: "Phone Number",
  username: "Username",
  password: "Password",
  
  // Student fields
  grade: "Grade",
  section: "Section", 
  bloodGroup: "Blood Group",
  dob: "Date of Birth",
  admissionDate: "Admission Date",
  rollNumber: "Roll Number",
  studentId: "Student ID",
  
  // Parent fields
  "parentInfo.name": "Parent Name",
  "parentInfo.email": "Parent Email",
  "parentInfo.phone": "Parent Phone",
  "parentInfo.address": "Parent Address",
  "parentInfo.occupation": "Parent Occupation",
  "parentInfo.relationship": "Relationship to Student",
  
  // Address fields
  "address.street": "Street Address",
  "address.city": "City",
  "address.state": "State/Province", 
  "address.country": "Country",
  "address.postalCode": "Postal Code",
  
  // Teacher fields
  subjects: "Teaching Subjects",
  grades: "Teaching Grades",
  sections: "Teaching Sections",
  designation: "Job Title",
  joinDate: "Join Date",
  employeeId: "Employee ID",
  qualifications: "Educational Qualifications",
  experience: "Work Experience",
  
  // Accountant fields
  department: "Department",
  responsibilities: "Job Responsibilities",
  certifications: "Professional Certifications",
  salary: "Salary Information",
  
  // Photo fields
  photos: "Photos",
  photo: "Photo",
  
  // School fields
  schoolId: "School",
  schoolName: "School Name",
  
  // Attendance fields
  classId: "Class",
  subjectId: "Subject",
  period: "Period",
  status: "Attendance Status",
  
  // Common validation fields
  name: "Name",
  title: "Title",
  description: "Description",
  date: "Date",
  time: "Time",
};

// Helper function to get user-friendly field name
const getFriendlyFieldName = (path: string): string => {
  return FIELD_NAME_MAPPING[path] || path.split('.').pop()?.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) || path;
};

// Helper function to get user-friendly error message
const getFriendlyErrorMessage = (path: string, message: string): string => {
  const fieldName = getFriendlyFieldName(path);
  
  // Common validation patterns and their user-friendly versions
  if (message.includes("required") || message.includes("must be provided")) {
    return `${fieldName} is required`;
  }
  
  if (message.includes("valid email")) {
    return `Please enter a valid email address`;
  }
  
  if (message.includes("phone") && message.includes("valid")) {
    return `Please enter a valid phone number (e.g. +1234567890)`;
  }
  
  if (message.includes("must be at least") && message.includes("characters")) {
    const match = message.match(/(\d+)/);
    const minLength = match ? match[1] : "required";
    return `${fieldName} must be at least ${minLength} characters long`;
  }
  
  if (message.includes("cannot exceed") && message.includes("character")) {
    const match = message.match(/(\d+)/);
    const maxLength = match ? match[1] : "allowed";
    return `${fieldName} cannot be longer than ${maxLength} characters`;
  }
  
  if (message.includes("must be a number") || message.includes("Cast to Number failed")) {
    return `${fieldName} must be a valid number`;
  }
  
  if (message.includes("Cast to Date failed") || message.includes("valid date")) {
    return `Please enter a valid date for ${fieldName}`;
  }
  
  if (message.includes("duplicate") || message.includes("already exists")) {
    return `This ${fieldName.toLowerCase()} is already in use. Please choose a different one`;
  }
  
  if (message.includes("invalid") && path === "grade") {
    return `Please select a valid grade level (1-12)`;
  }
  
  if (message.includes("invalid") && path === "bloodGroup") {
    return `Please select a valid blood group (A+, A-, B+, B-, AB+, AB-, O+, O-)`;
  }
  
  if (path === "dob" && message.includes("future")) {
    return `Date of birth cannot be in the future`;
  }
  
  if (path === "admissionDate" && message.includes("future")) {
    return `Admission date cannot be in the future`;
  }
  
  if (path === "email" && message.includes("format")) {
    return `Please enter a valid email address (e.g. user@example.com)`;
  }
  
  if (path.includes("password") && message.includes("weak")) {
    return `Password must contain at least 8 characters including uppercase, lowercase, and numbers`;
  }
  
  if (path === "rollNumber" && message.includes("duplicate")) {
    return `This roll number is already assigned to another student in this class`;
  }
  
  if (path === "employeeId" && message.includes("duplicate")) {
    return `This employee ID is already in use`;
  }
  
  // Photo-specific validation messages
  if (path === "photos" || path === "photo") {
    if (message.includes("required")) {
      return `Please upload at least 3 photos (3-10 photos required)`;
    }
    if (message.includes("minimum") || message.includes("at least 3")) {
      return `Please upload at least 3 photos`;
    }
    if (message.includes("maximum") || message.includes("more than 10") || message.includes("exceeds")) {
      return `Maximum 10 photos allowed`;
    }
    if (message.includes("size") || message.includes("10MB")) {
      return `Each photo must be under 10MB`;
    }
    if (message.includes("format") || message.includes("type")) {
      return `Only image files (JPG, PNG, GIF) are allowed`;
    }
  }
  
  // Default: Use field name + cleaned message
  const cleanMessage = message
    .replace(/Path `.*?` /, '')
    .replace(/`.*?`/, fieldName)
    .replace(/\bthis\b/gi, fieldName);
    
  return cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1);
};

// Helper function to extract error message from API response
export const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.errorSources?.length > 0) {
    // Handle validation errors
    const firstError = error.response.data.errorSources[0];
    return getFriendlyErrorMessage(firstError.path, firstError.message);
  }

  if (error?.message) {
    return error.message;
  }

  return "An unexpected error occurred";
};

// Helper function to show API error with proper formatting
export const showApiError = (
  error: any,
  defaultMessage = "Operation failed"
) => {
  console.error("API Error:", error); // Keep for debugging
  
  if (error?.response?.data?.errorSources?.length > 0) {
    const errors = error.response.data.errorSources;
    
    if (errors.length === 1) {
      // Single validation error
      const friendlyMessage = getFriendlyErrorMessage(errors[0].path, errors[0].message);
      showToast.error(friendlyMessage);
    } else {
      // Multiple validation errors - show each individually
      showToast.error("Please check the following:");
      
      // Show each error with a slight delay to make them readable
      errors.forEach((err: any, index: number) => {
        const friendlyMessage = getFriendlyErrorMessage(err.path, err.message);
        setTimeout(() => {
          showToast.error(friendlyMessage);
        }, 100 * (index + 1)); // 100ms delay between each toast
      });
    }
  } else {
    // Non-validation error
    const message = getErrorMessage(error);
    showToast.error(message || defaultMessage);
  }
};

export default showToast;
