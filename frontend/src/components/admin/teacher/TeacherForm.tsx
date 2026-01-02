import React, { useState } from "react";
import { Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "../../../context/AuthContext";
import { showApiError, showToast } from "../../../utils/toast";
import BasicInfo from "./BasicInfo";
import AddressInfo from "./AddressInfo";
import QualificationsInfo from "./QualificationsInfo";
import PhotoUpload from "./PhotoUpload";
import CredentialsDisplay from "./CredentialsDisplay";

interface TeacherFormData {
  // Basic Information (Required)
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  designation: string;
  bloodGroup: string;
  dob: string;
  joinDate?: string;
  
  // Teaching Details (Required)
  subjects: string[];
  grades: number[];
  sections: string[];
  
  // Experience (Required)
  experience: {
    totalYears: number;
    previousSchools: Array<{
      schoolName: string;
      position: string;
      duration: string;
      fromDate: string;
      toDate: string;
    }>;
  };
  
  // Address (Required)
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Qualifications (Required)
  qualifications: Array<{
    degree: string;
    institution: string;
    year: string;
    specialization?: string;
  }>;
  
  // Emergency Contact (Required)
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  
  // Salary (Optional)
  salary?: {
    basic: number;
    allowances?: number;
    deductions?: number;
  };
  
  // Class Teacher Assignment (Optional)
  isClassTeacher: boolean;
  classTeacherFor?: {
    grade: number;
    section: string;
  };
  
  // Photo
  photo?: File | null;
  photoPreview?: string;
}

interface Credentials {
  username: string;
  password: string;
  teacherId: string;
  employeeId: string;
}

interface TeacherFormProps {
  onBack?: () => void;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<TeacherFormData>({
    // Basic Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employeeId: "",
    designation: "Teacher",
    bloodGroup: "O+",
    dob: "",
    joinDate: "",
    
    // Teaching Details
    subjects: [""],
    grades: [1],
    sections: ["A"],
    
    // Experience
    experience: {
      totalYears: 0,
      previousSchools: [],
    },
    
    // Address
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Bangladesh",
    },
    
    // Qualifications (at least one required)
    qualifications: [
      {
        degree: "",
        institution: "",
        year: new Date().getFullYear().toString(),
        specialization: "",
      },
    ],
    
    // Emergency Contact
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
      email: "",
    },
    
    // Salary (optional)
    salary: {
      basic: 0,
      allowances: 0,
      deductions: 0,
    },
    
    // Class Teacher Assignment
    isClassTeacher: false,
    classTeacherFor: undefined,
    
    // Photo
    photo: null,
    photoPreview: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic info validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    }
    if (!formData.designation.trim()) {
      newErrors.designation = "Designation is required";
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Teaching details validation
    if (formData.subjects.length === 0 || formData.subjects.every(s => !s.trim())) {
      newErrors.subjects = "At least one subject is required";
    }
    if (formData.grades.length === 0) {
      newErrors.grades = "At least one grade is required";
    }
    if (formData.sections.length === 0 || formData.sections.every(s => !s.trim())) {
      newErrors.sections = "At least one section is required";
    }

    // Experience validation
    if (formData.experience.totalYears < 0) {
      newErrors['experience.totalYears'] = "Experience cannot be negative";
    }

    // Address validation
    if (!formData.address.city.trim()) {
      newErrors['address.city'] = "City is required";
    }
    if (!formData.address.state.trim()) {
      newErrors['address.state'] = "State is required";
    }
    if (!formData.address.zipCode.trim()) {
      newErrors['address.zipCode'] = "Zip code is required";
    }

    // Qualifications validation
    if (formData.qualifications.length === 0) {
      newErrors.qualifications = "At least one qualification is required";
    }
    formData.qualifications.forEach((qual, index) => {
      if (!qual.degree.trim()) {
        newErrors[`qualifications.${index}.degree`] = "Degree is required";
      }
      if (!qual.institution.trim()) {
        newErrors[`qualifications.${index}.institution`] = "Institution is required";
      }
      if (!qual.year || parseInt(qual.year) < 1980) {
        newErrors[`qualifications.${index}.year`] = "Valid year is required";
      }
    });

    // Emergency contact validation
    if (!formData.emergencyContact.name.trim()) {
      newErrors['emergencyContact.name'] = "Emergency contact name is required";
    }
    if (!formData.emergencyContact.relationship.trim()) {
      newErrors['emergencyContact.relationship'] = "Emergency contact relationship is required";
    }
    if (!formData.emergencyContact.phone.trim()) {
      newErrors['emergencyContact.phone'] = "Emergency contact phone is required";
    }

    // Class teacher validation
    if (formData.isClassTeacher && !formData.classTeacherFor) {
      newErrors.classTeacherFor = "Class assignment is required for class teachers";
    }

    // Subjects validation
    formData.subjects.forEach((subject, index) => {
      if (!subject.trim()) {
        newErrors[`subjects.${index}`] = "Subject name is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast.error("Please fix the errors before submitting");
      return;
    }

    // Check if user has schoolId
    if (!user?.schoolId) {
      showToast.error("School ID not found. Please login again.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();

      // Add schoolId from authenticated user
      submitData.append("schoolId", user.schoolId);

      // Add basic fields (all required by backend)
      submitData.append("firstName", formData.firstName);
      submitData.append("lastName", formData.lastName);
      submitData.append("designation", formData.designation);
      submitData.append("bloodGroup", formData.bloodGroup);
      submitData.append("dob", formData.dob);

      // Add optional basic fields
      if (formData.email) submitData.append("email", formData.email);
      if (formData.phone) submitData.append("phone", formData.phone);
      if (formData.joinDate) submitData.append("joinDate", formData.joinDate);
      if (formData.employeeId) submitData.append("employeeId", formData.employeeId);

      // Add teaching details (required)
      submitData.append("subjects", JSON.stringify(formData.subjects.filter(s => s.trim())));
      submitData.append("grades", JSON.stringify(formData.grades));
      submitData.append("sections", JSON.stringify(formData.sections.filter(s => s.trim())));

      // Add experience (required)
      submitData.append("experience", JSON.stringify(formData.experience));

      // Add address (required)
      submitData.append("address", JSON.stringify(formData.address));

      // Add qualifications (required)
      submitData.append("qualifications", JSON.stringify(formData.qualifications));

      // Add emergency contact (required)
      submitData.append("emergencyContact", JSON.stringify(formData.emergencyContact));

      // Add salary (optional)
      if (formData.salary && formData.salary.basic > 0) {
        submitData.append("salary", JSON.stringify(formData.salary));
      }

      // Add class teacher info (optional)
      submitData.append("isClassTeacher", JSON.stringify(formData.isClassTeacher));
      if (formData.classTeacherFor) {
        submitData.append("classTeacherFor", JSON.stringify(formData.classTeacherFor));
      }

      // Add photo if exists
      if (formData.photo) {
        submitData.append("photo", formData.photo);
      }

      // Make API call to create teacher (with proper auth)
      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        body: submitData,
        credentials: "include", // Include authentication cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create teacher");
      }

      const result = await response.json();

      // Show success and credentials
      showToast.success("Teacher created successfully!");
      setCredentials(result.credentials);

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        employeeId: "",
        designation: "Teacher",
        bloodGroup: "O+",
        dob: "",
        joinDate: "",
        subjects: [],
        grades: [1],
        sections: ["A"],
        experience: {
          totalYears: 0,
          previousSchools: [],
        },
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "Bangladesh",
        },
        qualifications: [{
          degree: "",
          institution: "",
          year: new Date().getFullYear().toString(),
          specialization: "",
        }],
        emergencyContact: {
          name: "",
          relationship: "",
          phone: "",
          email: "",
        },
        isClassTeacher: false,
        photo: null,
        photoPreview: "",
      });
    } catch (error) {
      console.error("Error creating teacher:", error);
      showApiError(error, "Failed to create teacher");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Add New Teacher
              </h1>
              <p className="text-gray-600">
                Create a new teacher profile with credentials
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <BasicInfo
                formData={formData}
                errors={errors}
                onChange={handleChange}
              />

              <AddressInfo
                formData={formData}
                errors={errors}
                onChange={handleChange}
              />

              <QualificationsInfo
                formData={formData}
                errors={errors}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-6">
              <PhotoUpload
                formData={formData}
                errors={errors}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Creating Teacher..." : "Create Teacher"}
            </Button>
          </div>
        </form>

        {/* Progress Indicator */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p>Creating teacher profile...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Credentials Display Modal */}
      {credentials && (
        <CredentialsDisplay
          credentials={credentials}
          onClose={() => setCredentials(null)}
        />
      )}
    </>
  );
};

export default TeacherForm;
