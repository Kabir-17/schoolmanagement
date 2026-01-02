import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "../../../context/AuthContext";
import { adminApi } from "../../../services/admin.api";
import { teacherApi } from "../../../services/teacher.api";

interface MinimalTeacherFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  designation: string;
  bloodGroup: string;
  dob: string;
  joinDate?: string;
  subjects: string[];
  grades: number[];
  sections: string[];
  experience: {
    totalYears: number;
    previousSchools: any[];
  };
  qualifications: Array<{
    degree: string;
    institution: string;
    year: number;
    specialization?: string;
  }>;
  address: {
    street?: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  salary: {
    basic: number;
    allowances: number;
    deductions: number;
  };
  isClassTeacher: boolean;
  classTeacherFor?: {
    grade: number;
    section: string;
  };
  isActive: boolean;
}

const DESIGNATIONS = [
  'Principal', 'Vice Principal', 'Head Teacher', 'Senior Teacher', 'Teacher',
  'Assistant Teacher', 'Subject Coordinator', 'Sports Teacher', 'Music Teacher',
  'Art Teacher', 'Librarian', 'Lab Assistant'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface MinimalTeacherFormProps {
  onBack?: () => void;
  onSave?: (teacher: any) => void;
  teacher?: any; // For editing existing teacher
}

const MinimalTeacherForm: React.FC<MinimalTeacherFormProps> = ({ onBack, onSave, teacher }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableSubjects, setAvailableSubjects] = useState<Array<{_id: string, name: string}>>([]);
  const [schoolData, setSchoolData] = useState<any>(null);

  const [formData, setFormData] = useState<MinimalTeacherFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    designation: "Teacher",
    bloodGroup: "O+",
    dob: "",
    joinDate: "",
    subjects: [],
    grades: [],
    sections: [],
    experience: {
      totalYears: 0,
      previousSchools: [],
    },
    qualifications: [{
      degree: "",
      institution: "",
      year: new Date().getFullYear(),
      specialization: "",
    }],
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Bangladesh",
    },
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
      email: "",
    },
    salary: {
      basic: 0,
      allowances: 0,
      deductions: 0,
    },
    isClassTeacher: false,
    isActive: true,
  });

  // Populate form data when editing a teacher
  useEffect(() => {
    if (teacher) {
      setFormData({
        firstName: teacher.userId?.firstName || "",
        lastName: teacher.userId?.lastName || "",
        email: teacher.userId?.email || "",
        phone: teacher.userId?.phone || "",
        designation: teacher.designation || "Teacher",
        bloodGroup: teacher.bloodGroup || "O+",
        dob: teacher.dob || "",
        joinDate: teacher.joinDate || "",
        subjects: teacher.subjects || [],
        grades: teacher.grades || [],
        sections: teacher.sections || [],
        experience: {
          totalYears: teacher.experience?.totalYears || 0,
          previousSchools: teacher.experience?.previousSchools || [],
        },
        qualifications: teacher.qualifications || [{
          degree: "",
          institution: "",
          year: new Date().getFullYear(),
          specialization: "",
        }],
        address: {
          street: teacher.address?.street || "",
          city: teacher.address?.city || "",
          state: teacher.address?.state || "",
          zipCode: teacher.address?.zipCode || "",
          country: teacher.address?.country || "Bangladesh",
        },
        emergencyContact: {
          name: teacher.emergencyContact?.name || "",
          relationship: teacher.emergencyContact?.relationship || "",
          phone: teacher.emergencyContact?.phone || "",
          email: teacher.emergencyContact?.email || "",
        },
        salary: {
          basic: teacher.salary?.basic || 0,
          allowances: teacher.salary?.allowances || 0,
          deductions: teacher.salary?.deductions || 0,
        },
        isClassTeacher: teacher.isClassTeacher || false,
        isActive: teacher.isActive !== undefined ? teacher.isActive : true,
      });
    }
  }, [teacher]);

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

    const fetchSchoolData = async () => {
      try {
        const response = await adminApi.getSchoolSettings();
        if (response.data.success) {
          setSchoolData(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch school data:', error);
        toast.error('Failed to load school settings');
      }
    };

    fetchSubjects();
    fetchSchoolData();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleNestedChange = (parent: keyof MinimalTeacherFormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (formData.subjects.length === 0) newErrors.subjects = "At least one subject must be selected";
    if (formData.grades.length === 0) newErrors.grades = "At least one grade must be selected";
    if (formData.sections.length === 0) newErrors.sections = "At least one section must be selected";
    if (!formData.address.city.trim()) newErrors['address.city'] = "City is required";
    if (!formData.address.state.trim()) newErrors['address.state'] = "State is required";
    if (!formData.address.zipCode.trim()) newErrors['address.zipCode'] = "Zip code is required";
    if (!formData.qualifications[0].degree.trim()) newErrors['qualification.degree'] = "Degree is required";
    if (!formData.qualifications[0].institution.trim()) newErrors['qualification.institution'] = "Institution is required";
    if (!formData.emergencyContact.name.trim()) newErrors['emergency.name'] = "Emergency contact name is required";
    if (!formData.emergencyContact.relationship.trim()) newErrors['emergency.relationship'] = "Emergency contact relationship is required";
    if (!formData.emergencyContact.phone.trim()) newErrors['emergency.phone'] = "Emergency contact phone is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    if (!user?.schoolId) {
      toast.error("School ID not found. Please login again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const isEditing = !!teacher;
      
      // Prepare teacher data for API call
      const teacherData = {
        schoolId: user.schoolId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        designation: formData.designation,
        bloodGroup: formData.bloodGroup,
        dob: formData.dob,
        joinDate: formData.joinDate || undefined,
        subjects: formData.subjects,
        grades: formData.grades,
        sections: formData.sections,
        experience: formData.experience,
        qualifications: formData.qualifications,
        address: {
          ...formData.address,
          country: formData.address.country || "Bangladesh", // Ensure country is always a string
        },
        emergencyContact: formData.emergencyContact,
        salary: formData.salary,
        isClassTeacher: formData.isClassTeacher,
        classTeacherFor: formData.isClassTeacher ? formData.classTeacherFor : undefined,
        isActive: formData.isActive,
      };

      let result;
      
      if (isEditing) {
        // Update existing teacher
        result = await teacherApi.update(teacher.id, teacherData);
      } else {
        // Create new teacher
        result = await teacherApi.create(teacherData);
      }

      if (result.data.success) {
        // Only set credentials for new teachers
        if (!isEditing && result.data.data.credentials) {
          setCredentials(result.data.data.credentials);
        }
        
        const successMessage = isEditing ? "Teacher updated successfully!" : "Teacher created successfully!";
        toast.success(successMessage);
        
        if (onSave) {
          onSave(result.data.data);
        }
      } else {
        const errorMessage = isEditing ? "Failed to update teacher" : "Failed to create teacher";
        throw new Error(result.data.message || errorMessage);
      }
    } catch (error: any) {
      console.error("Failed to save teacher:", error);
      
      let errorMessage = "Failed to save teacher. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Handle validation errors
      if (error.response?.status === 400 && error.response?.data?.errors) {
        // const validationErrors = error.response.data.errors;
        errorMessage = "Please check the form for validation errors.";
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If credentials are shown, display them
  if (credentials) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white">
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
      </div>
    );
  }

  return (
    <div className="w-full max-w-none p-6 bg-white">
      <div className="flex items-center justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{teacher ? "Edit Teacher" : "Add New Teacher"}</h1>
          <p className="text-gray-600 truncate">Fill out the required information to create a new teacher account</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack} className="ml-4 flex-shrink-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6 max-w-none">
        {/* Basic Information */}
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter first name"
              />
              {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter last name"
              />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => handleChange("dob", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Designation *</label>
              <select
                value={formData.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DESIGNATIONS.map((designation) => (
                  <option key={designation} value={designation}>{designation}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group *</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => handleChange("bloodGroup", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="teacher@school.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Join Date</label>
              <input
                type="date"
                value={formData.joinDate || ""}
                onChange={(e) => handleChange("joinDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Teaching Details */}
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Teaching Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subjects *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {availableSubjects.length === 0 ? (
                  <p className="text-sm text-gray-500 col-span-full">Loading subjects...</p>
                ) : (
                  availableSubjects.map((subject) => (
                    <label key={subject._id} className="flex items-center p-2 bg-white rounded border hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleChange("subjects", [...formData.subjects, subject.name]);
                          } else {
                            handleChange("subjects", formData.subjects.filter(s => s !== subject.name));
                          }
                        }}
                        className="mr-2 flex-shrink-0"
                      />
                      <span className="text-sm truncate">{subject.name}</span>
                    </label>
                  ))
                )}
              </div>
              {errors.subjects && <p className="text-red-500 text-sm mt-1">{errors.subjects}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Grades *</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {(schoolData?.settings?.grades || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).map((grade: number) => (
                  <label key={grade} className="flex items-center p-2 bg-white rounded border hover:bg-gray-50">
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
                      className="mr-2 flex-shrink-0"
                    />
                    <span className="text-sm font-medium">Grade {grade}</span>
                  </label>
                ))}
              </div>
              {errors.grades && <p className="text-red-500 text-sm mt-1">{errors.grades}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Sections</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {(schoolData?.settings?.sections || ['A', 'B', 'C', 'D']).map((section: string) => (
                  <label key={section} className="flex items-center p-2 bg-white rounded border hover:bg-gray-50">
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
                      className="mr-2 flex-shrink-0"
                    />
                    <span className="text-sm font-medium">Section {section}</span>
                  </label>
                ))}
              </div>
              {errors.sections && <p className="text-red-500 text-sm mt-1">{errors.sections}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Total Years) *</label>
              <input
                type="number"
                min="0"
                max="45"
                value={formData.experience.totalYears}
                onChange={(e) => handleNestedChange("experience", "totalYears", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Qualification */}
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Qualification</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Degree *</label>
              <input
                type="text"
                value={formData.qualifications[0].degree}
                onChange={(e) => {
                  const newQuals = [...formData.qualifications];
                  newQuals[0].degree = e.target.value;
                  handleChange("qualifications", newQuals);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Bachelor of Education"
              />
              {errors['qualification.degree'] && <p className="text-red-500 text-sm mt-1">{errors['qualification.degree']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Institution *</label>
              <input
                type="text"
                value={formData.qualifications[0].institution}
                onChange={(e) => {
                  const newQuals = [...formData.qualifications];
                  newQuals[0].institution = e.target.value;
                  handleChange("qualifications", newQuals);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., University of Dhaka"
              />
              {errors['qualification.institution'] && <p className="text-red-500 text-sm mt-1">{errors['qualification.institution']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input
                type="number"
                min="1980"
                max={new Date().getFullYear()}
                value={formData.qualifications[0].year}
                onChange={(e) => {
                  const newQuals = [...formData.qualifications];
                  newQuals[0].year = parseInt(e.target.value) || new Date().getFullYear();
                  handleChange("qualifications", newQuals);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => handleNestedChange("address", "city", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter city"
              />
              {errors['address.city'] && <p className="text-red-500 text-sm mt-1">{errors['address.city']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
              <input
                type="text"
                value={formData.address.state}
                onChange={(e) => handleNestedChange("address", "state", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter state/province"
              />
              {errors['address.state'] && <p className="text-red-500 text-sm mt-1">{errors['address.state']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code *</label>
              <input
                type="text"
                value={formData.address.zipCode}
                onChange={(e) => handleNestedChange("address", "zipCode", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter zip code"
              />
              {errors['address.zipCode'] && <p className="text-red-500 text-sm mt-1">{errors['address.zipCode']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
              <input
                type="text"
                value={formData.address.street || ""}
                onChange={(e) => handleNestedChange("address", "street", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter street address"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                value={formData.emergencyContact.name}
                onChange={(e) => handleNestedChange("emergencyContact", "name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Emergency contact name"
              />
              {errors['emergency.name'] && <p className="text-red-500 text-sm mt-1">{errors['emergency.name']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Relationship *</label>
              <input
                type="text"
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleNestedChange("emergencyContact", "relationship", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Spouse, Parent, Sibling"
              />
              {errors['emergency.relationship'] && <p className="text-red-500 text-sm mt-1">{errors['emergency.relationship']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <input
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleNestedChange("emergencyContact", "phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Emergency contact phone"
              />
              {errors['emergency.phone'] && <p className="text-red-500 text-sm mt-1">{errors['emergency.phone']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.emergencyContact.email || ""}
                onChange={(e) => handleNestedChange("emergencyContact", "email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Emergency contact email"
              />
            </div>
          </div>
        </div>

        {/* Salary Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Salary Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Basic Salary</label>
              <input
                type="number"
                value={formData.salary.basic}
                onChange={(e) => handleNestedChange("salary", "basic", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Basic salary amount"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Allowances</label>
              <input
                type="number"
                value={formData.salary.allowances}
                onChange={(e) => handleNestedChange("salary", "allowances", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Total allowances"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deductions</label>
              <input
                type="number"
                value={formData.salary.deductions}
                onChange={(e) => handleNestedChange("salary", "deductions", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Total deductions"
                min="0"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-700">
              <strong>Net Salary:</strong> {" "}
              <span className="font-semibold text-blue-600">
                {(formData.salary.basic + formData.salary.allowances - formData.salary.deductions).toLocaleString()}
              </span>
            </p>
          </div>
        </div>

        {/* Status & Class Teacher Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Status & Additional Roles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Status */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active Teacher (can login and access system)
              </label>
            </div>

            {/* Class Teacher Status */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isClassTeacher"
                checked={formData.isClassTeacher}
                onChange={(e) => handleChange("isClassTeacher", e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="isClassTeacher" className="text-sm font-medium text-gray-700">
                Class Teacher
              </label>
            </div>
          </div>

          {/* Class Teacher Assignment (conditional) */}
          {formData.isClassTeacher && (
            <div className="mt-4 p-4 border-l-4 border-blue-500 bg-blue-50">
              <h4 className="text-md font-medium text-blue-800 mb-3">Class Teacher Assignment</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade *</label>
                  <select
                    value={formData.classTeacherFor?.grade || ""}
                    onChange={(e) => handleNestedChange("classTeacherFor", "grade", parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Grade</option>
                    {(schoolData?.settings?.grades || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).map((grade: number) => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section *</label>
                  <select
                    value={formData.classTeacherFor?.section || ""}
                    onChange={(e) => handleNestedChange("classTeacherFor", "section", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Section</option>
                    {(schoolData?.settings?.sections || ['A', 'B', 'C', 'D']).map((section: string) => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t">
          <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting 
              ? (teacher ? "Updating..." : "Creating...") 
              : (teacher ? "Update Teacher" : "Create Teacher")
            }
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MinimalTeacherForm;