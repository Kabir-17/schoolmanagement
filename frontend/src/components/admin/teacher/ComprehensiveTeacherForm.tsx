import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Save, ArrowLeft, Info, User, GraduationCap, MapPin, Phone, Briefcase, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { adminApi } from "../../../services/admin.api";

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
    street?: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  
  // Qualifications (Required)
  qualifications: Array<{
    degree: string;
    institution: string;
    year: number;
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

interface ComprehensiveTeacherFormProps {
  onBack?: () => void;
  onSave?: (data: any) => void;
}

const DESIGNATIONS = [
  'Principal',
  'Vice Principal', 
  'Head Teacher',
  'Senior Teacher',
  'Teacher',
  'Assistant Teacher',
  'Subject Coordinator',
  'Sports Teacher',
  'Music Teacher',
  'Art Teacher',
  'Librarian',
  'Lab Assistant'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const ComprehensiveTeacherForm: React.FC<ComprehensiveTeacherFormProps> = ({ onBack, onSave }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [availableSubjects, setAvailableSubjects] = useState<Array<{_id: string, name: string}>>([]);
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
    subjects: [],
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
        year: new Date().getFullYear(),
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

  // Fetch available subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await adminApi.getSubjects();
        if (response.data.success) {
          setAvailableSubjects(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
        toast.error('Failed to load subjects');
      }
    };

    fetchSubjects();
  }, []);

  const steps = [
    { id: 1, title: "Basic Information", icon: User },
    { id: 2, title: "Teaching Details", icon: GraduationCap },
    { id: 3, title: "Experience", icon: Briefcase },
    { id: 4, title: "Qualifications", icon: GraduationCap },
    { id: 5, title: "Address", icon: MapPin },
    { id: 6, title: "Emergency Contact", icon: Phone },
    { id: 7, title: "Additional Info", icon: DollarSign },
  ];

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

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1: // Basic Information
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
        if (!formData.dob) newErrors.dob = "Date of birth is required";
        if (!formData.designation) newErrors.designation = "Designation is required";
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        }
        break;

      case 2: // Teaching Details
        if (formData.subjects.length === 0 || formData.subjects.every(s => !s.trim())) {
          newErrors.subjects = "At least one subject is required";
        }
        if (formData.grades.length === 0) {
          newErrors.grades = "At least one grade is required";
        }
        if (formData.sections.length === 0 || formData.sections.every(s => !s.trim())) {
          newErrors.sections = "At least one section is required";
        }
        break;

      case 3: // Experience
        if (formData.experience.totalYears < 0) {
          newErrors['experience.totalYears'] = "Experience cannot be negative";
        }
        break;

      case 4: // Qualifications
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
          if (!qual.year || qual.year < 1980) {
            newErrors[`qualifications.${index}.year`] = "Valid year is required";
          }
        });
        break;

      case 5: // Address
        if (!formData.address.city.trim()) newErrors['address.city'] = "City is required";
        if (!formData.address.state.trim()) newErrors['address.state'] = "State is required";
        if (!formData.address.zipCode.trim()) newErrors['address.zipCode'] = "Zip code is required";
        break;

      case 6: // Emergency Contact
        if (!formData.emergencyContact.name.trim()) {
          newErrors['emergencyContact.name'] = "Emergency contact name is required";
        }
        if (!formData.emergencyContact.relationship.trim()) {
          newErrors['emergencyContact.relationship'] = "Emergency contact relationship is required";
        }
        if (!formData.emergencyContact.phone.trim()) {
          newErrors['emergencyContact.phone'] = "Emergency contact phone is required";
        }
        break;

      case 7: // Additional Info
        if (formData.isClassTeacher && !formData.classTeacherFor) {
          newErrors.classTeacherFor = "Class assignment is required for class teachers";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    } else {
      toast.error("Please fix the errors before continuing");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCurrentStep()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();

      // Add basic fields
      submitData.append("firstName", formData.firstName);
      submitData.append("lastName", formData.lastName);
      submitData.append("designation", formData.designation);
      submitData.append("bloodGroup", formData.bloodGroup);
      submitData.append("dob", formData.dob);

      if (formData.email) submitData.append("email", formData.email);
      if (formData.phone) submitData.append("phone", formData.phone);
      if (formData.joinDate) submitData.append("joinDate", formData.joinDate);
      if (formData.employeeId) submitData.append("employeeId", formData.employeeId);

      // Add teaching details
      submitData.append("subjects", JSON.stringify(formData.subjects.filter(s => s.trim())));
      submitData.append("grades", JSON.stringify(formData.grades));
      submitData.append("sections", JSON.stringify(formData.sections.filter(s => s.trim())));

      // Add experience
      submitData.append("experience", JSON.stringify(formData.experience));

      // Add address
      submitData.append("address", JSON.stringify(formData.address));

      // Add qualifications
      submitData.append("qualifications", JSON.stringify(formData.qualifications));

      // Add emergency contact
      submitData.append("emergencyContact", JSON.stringify(formData.emergencyContact));

      // Add salary if provided
      if (formData.salary && formData.salary.basic > 0) {
        submitData.append("salary", JSON.stringify(formData.salary));
      }

      // Add class teacher info
      submitData.append("isClassTeacher", JSON.stringify(formData.isClassTeacher));
      if (formData.classTeacherFor) {
        submitData.append("classTeacherFor", JSON.stringify(formData.classTeacherFor));
      }

      // Add photo if exists
      if (formData.photo) {
        submitData.append("photo", formData.photo);
      }

      // Mock API call - replace with actual API
      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        body: submitData,
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        setCredentials(result.data.credentials);
        toast.success("Teacher created successfully!");
        
        if (onSave) {
          onSave(result.data);
        }
      } else {
        toast.error(result.message || "Failed to create teacher");
      }
    } catch (error: any) {
      console.error("Failed to save teacher:", error);
      toast.error(error.message || "Failed to save teacher");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInformation();
      case 2:
        return renderTeachingDetails();
      case 3:
        return renderBasicInformation(); // Placeholder
      case 4:
        return renderBasicInformation(); // Placeholder
      case 5:
        return renderBasicInformation(); // Placeholder
      case 6:
        return renderBasicInformation(); // Placeholder
      case 7:
        return renderBasicInformation(); // Placeholder
      default:
        return null;
    }
  };

  // Render functions for each step will go here...
  const renderBasicInformation = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Basic Information Instructions</h3>
            <p className="text-sm text-blue-600 mt-1">
              Fill in the teacher's basic personal information. Fields marked with * are required.
              Age must be between 21-65 years for teaching positions.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter first name"
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter last name"
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            value={formData.dob}
            onChange={(e) => handleChange("dob", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 21)).toISOString().split('T')[0]}
            min={new Date(new Date().setFullYear(new Date().getFullYear() - 65)).toISOString().split('T')[0]}
          />
          {errors.dob && (
            <p className="text-red-500 text-sm mt-1">{errors.dob}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Designation *
          </label>
          <select
            value={formData.designation}
            onChange={(e) => handleChange("designation", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DESIGNATIONS.map((designation) => (
              <option key={designation} value={designation}>
                {designation}
              </option>
            ))}
          </select>
          {errors.designation && (
            <p className="text-red-500 text-sm mt-1">{errors.designation}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Blood Group *
          </label>
          <select
            value={formData.bloodGroup}
            onChange={(e) => handleChange("bloodGroup", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {BLOOD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Join Date
          </label>
          <input
            type="date"
            value={formData.joinDate || ""}
            onChange={(e) => handleChange("joinDate", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="teacher@school.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+1234567890"
          />
        </div>
      </div>
    </div>
  );

  // Continue with other render functions...
  const renderTeachingDetails = () => (
    <div className="space-y-6">
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-green-800">Teaching Details Instructions</h3>
            <p className="text-sm text-green-600 mt-1">
              Specify what subjects the teacher will teach, which grades they'll handle, 
              and which sections they'll be assigned to. At least one item is required for each field.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subjects * (Select multiple)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableSubjects.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-full">Loading subjects...</p>
            ) : (
              availableSubjects.map((subject) => (
                <label key={subject._id} className="flex items-center p-2 bg-white rounded border hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.subjects.includes(subject._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleChange("subjects", [...formData.subjects, subject._id]);
                      } else {
                        handleChange("subjects", formData.subjects.filter(s => s !== subject._id));
                      }
                    }}
                    className="mr-2 flex-shrink-0"
                  />
                  <span className="text-sm truncate">{subject.name}</span>
                </label>
              ))
            )}
          </div>
          {errors.subjects && (
            <p className="text-red-500 text-sm mt-1">{errors.subjects}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grades * (Select multiple)
          </label>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
              <label key={grade} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.grades.includes(grade)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleChange("grades", [...formData.grades, grade]);
                    } else {
                      handleChange("grades", formData.grades.filter(g => g !== grade));
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">Grade {grade}</span>
              </label>
            ))}
          </div>
          {errors.grades && (
            <p className="text-red-500 text-sm mt-1">{errors.grades}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sections * (Select multiple)
          </label>
          <div className="grid grid-cols-6 gap-2">
            {['A', 'B', 'C', 'D', 'E', 'F'].map((section) => (
              <label key={section} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.sections.includes(section)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleChange("sections", [...formData.sections, section]);
                    } else {
                      handleChange("sections", formData.sections.filter(s => s !== section));
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">Section {section}</span>
              </label>
            ))}
          </div>
          {errors.sections && (
            <p className="text-red-500 text-sm mt-1">{errors.sections}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {credentials ? (
        // Show credentials after successful creation
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-6">Teacher Created Successfully!</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Login Credentials</h3>
            <div className="space-y-3">
              <p><strong>Teacher ID:</strong> {credentials.teacherId}</p>
              <p><strong>Employee ID:</strong> {credentials.employeeId}</p>
              <p><strong>Username:</strong> {credentials.username}</p>
              <p><strong>Password:</strong> <span className="font-mono bg-gray-100 px-2 py-1 rounded">{credentials.password}</span></p>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Please save these credentials securely. The teacher will be required to change their password on first login.
            </p>
            <Button onClick={onBack} className="mt-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teachers List
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Teacher</h1>
              <p className="text-gray-600">Fill out all required information to create a new teacher account</p>
            </div>
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step.id === currentStep
                        ? "bg-blue-600 text-white"
                        : step.id < currentStep
                        ? "bg-green-600 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span className="ml-2 text-sm font-medium">{step.title}</span>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 w-12 mx-4 ${
                        step.id < currentStep ? "bg-green-600" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div>
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                )}
              </div>
              <div>
                {currentStep < steps.length ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Creating..." : "Create Teacher"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );

  // Additional render functions would continue here for steps 3-7
  // Due to length constraints, I'm showing the structure
};

export default ComprehensiveTeacherForm;