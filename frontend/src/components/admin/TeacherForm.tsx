import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  User,
  Upload,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { teacherApi } from "@/services/teacher.api";
import toast from "@/utils/toast";

interface Qualification {
  degree: string;
  institution: string;
  year: number;
  specialization?: string;
}

interface PreviousSchool {
  schoolName: string;
  position: string;
  duration: string;
  fromDate: string;
  toDate: string;
}

interface Address {
  street?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

interface Salary {
  basic: number;
  allowances?: number;
  deductions?: number;
}

interface Teacher {
  id?: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  subjects: string[];
  grades: number[];
  sections: string[];
  designation: string;
  bloodGroup: string;
  dob: string;
  joinDate?: string;
  qualifications: Qualification[];
  experience: {
    totalYears: number;
    previousSchools?: PreviousSchool[];
  };
  address: Address;
  emergencyContact: EmergencyContact;
  salary?: Salary;
  isClassTeacher?: boolean;
  classTeacherFor?: {
    grade: number;
    section: string;
  };
  photos?: File[];
  photoCount?: number;
}

interface TeacherFormProps {
  teacher?: Teacher | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (teacher: Teacher) => void;
}

const DESIGNATIONS = [
  "Principal",
  "Vice Principal",
  "Head Teacher",
  "Senior Teacher",
  "Teacher",
  "Assistant Teacher",
  "Subject Coordinator",
  "Sports Teacher",
  "Music Teacher",
  "Art Teacher",
  "Librarian",
  "Lab Assistant",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SECTIONS = ["A", "B", "C", "D", "E", "F"];
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const TeacherForm: React.FC<TeacherFormProps> = ({
  teacher,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Teacher>({
    schoolId: "675f61b88d39b6a5a21b1b29", // Default school ID
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employeeId: "",
    subjects: [""],
    grades: [],
    sections: [],
    designation: "Teacher",
    bloodGroup: "A+",
    dob: "",
    joinDate: new Date().toISOString().split("T")[0],
    qualifications: [
      {
        degree: "",
        institution: "",
        year: new Date().getFullYear(),
        specialization: "",
      },
    ],
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
    photos: [],
  });

  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (teacher) {
      // Properly populate form data for editing
      setFormData({
        ...teacher,
        dob: teacher.dob?.split("T")[0] || "",
        joinDate: teacher.joinDate?.split("T")[0] || "",
        subjects: teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects : [""],
        grades: teacher.grades || [],
        sections: teacher.sections || [],
        qualifications: teacher.qualifications && teacher.qualifications.length > 0 
          ? teacher.qualifications 
          : [{
              degree: "",
              institution: "",
              year: new Date().getFullYear(),
              specialization: "",
            }],
        experience: teacher.experience || {
          totalYears: 0,
          previousSchools: [],
        },
        address: teacher.address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "Bangladesh",
        },
        emergencyContact: teacher.emergencyContact || {
          name: "",
          relationship: "",
          phone: "",
          email: "",
        },
        salary: teacher.salary || {
          basic: 0,
          allowances: 0,
          deductions: 0,
        },
        photos: [],
      });
    } else {
      setFormData({
        schoolId: "675f61b88d39b6a5a21b1b29",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        employeeId: "",
        subjects: [""],
        grades: [],
        sections: [],
        designation: "Teacher",
        bloodGroup: "A+",
        dob: "",
        joinDate: new Date().toISOString().split("T")[0],
        qualifications: [
          {
            degree: "",
            institution: "",
            year: new Date().getFullYear(),
            specialization: "",
          },
        ],
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
        photos: [],
      });
    }
    setSelectedPhotos([]);
    setErrors({});
  }, [teacher, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (!formData.designation)
      newErrors.designation = "Designation is required";
    if (!formData.bloodGroup) newErrors.bloodGroup = "Blood group is required";

    // Check if at least one qualification is provided
    if (formData.qualifications.every((q) => !q.degree.trim())) {
      newErrors.qualifications = "At least one qualification is required";
    }

    // Check if at least one subject is provided
    if (formData.subjects.every((s) => !s.trim())) {
      newErrors.subjects = "At least one subject is required";
    }

    // Check if at least one grade is selected
    if (formData.grades.length === 0) {
      newErrors.grades = "At least one grade is required";
    }

    // Check if at least one section is selected
    if (formData.sections.length === 0) {
      newErrors.sections = "At least one section is required";
    }

    // Address validation
    if (!formData.address.city.trim())
      newErrors.addressCity = "City is required";
    if (!formData.address.state.trim())
      newErrors.addressState = "State is required";
    if (!formData.address.country.trim())
      newErrors.addressCountry = "Country is required";

    // Emergency contact validation
    if (!formData.emergencyContact.name.trim())
      newErrors.emergencyName = "Emergency contact name is required";
    if (!formData.emergencyContact.phone.trim())
      newErrors.emergencyPhone = "Emergency contact phone is required";
    if (!formData.emergencyContact.relationship.trim())
      newErrors.emergencyRelationship =
        "Emergency contact relationship is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Clean up arrays by removing empty strings
      const cleanedFormData = {
        ...formData,
        subjects: formData.subjects.filter((s) => s.trim()),
        qualifications: formData.qualifications.filter((q) => q.degree.trim()),
        photos: selectedPhotos,
      };

      if (teacher?.id) {
        // Update existing teacher
        const updateData = {
          firstName: cleanedFormData.firstName,
          lastName: cleanedFormData.lastName,
          email: cleanedFormData.email,
          phone: cleanedFormData.phone,
          employeeId: cleanedFormData.employeeId,
          subjects: cleanedFormData.subjects,
          grades: cleanedFormData.grades,
          sections: cleanedFormData.sections,
          designation: cleanedFormData.designation,
          bloodGroup: cleanedFormData.bloodGroup,
          dob: cleanedFormData.dob,
          joinDate: cleanedFormData.joinDate,
          qualifications: cleanedFormData.qualifications,
          experience: cleanedFormData.experience,
          address: cleanedFormData.address,
          emergencyContact: cleanedFormData.emergencyContact,
          salary: cleanedFormData.salary,
          isClassTeacher: cleanedFormData.isClassTeacher,
          classTeacherFor: cleanedFormData.classTeacherFor,
        };

        const response = await teacherApi.update(teacher.id, updateData);
        if (response.data.success) {
          toast.success("Teacher updated successfully!");
          onSave({ ...cleanedFormData, id: teacher.id, ...response.data.data });
          onClose();
        }
      } else {
        // Create new teacher
        const response = await teacherApi.create(cleanedFormData);
        if (response.data.success) {
          toast.success("Teacher created successfully!");
          onSave({ ...cleanedFormData, ...response.data.data });
          onClose();
        }
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
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const keys = field.split(".");
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else {
        const [parent, child] = keys;
        return {
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [child]: value,
          },
        };
      }
    });
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev as any)[field].map((item: string, i: number) =>
        i === index ? value : item
      ),
    }));
  };

  const addArrayItem = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev as any)[field], ""],
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev as any)[field].filter((_: any, i: number) => i !== index),
    }));
  };

  const handleQualificationChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.map((qual, i) =>
        i === index ? { ...qual, [field]: value } : qual
      ),
    }));
  };



  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });

    if (selectedPhotos.length + validFiles.length > 20) {
      toast.error("Maximum 20 photos allowed");
      return;
    }

    setSelectedPhotos((prev) => [...prev, ...validFiles]);
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCheckboxChange = (
    field: string,
    value: any,
    checked: boolean
  ) => {
    setFormData((prev) => {
      const currentArray = (prev as any)[field] as any[];
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] };
      } else {
        return {
          ...prev,
          [field]: currentArray.filter((item) => item !== value),
        };
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {teacher ? "Edit Teacher" : "Add New Teacher"}
            {loading && (
              <span className="ml-2 text-sm text-blue-600">
                {teacher ? "Updating..." : "Creating..."}
              </span>
            )}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Enter first name"
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Enter last name"
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID
                  </label>
                  <Input
                    value={formData.employeeId}
                    onChange={(e) =>
                      handleInputChange("employeeId", e.target.value)
                    }
                    placeholder="Enter employee ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation *
                  </label>
                  <select aria-label="Designation"
                    value={formData.designation}
                    onChange={(e) =>
                      handleInputChange("designation", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DESIGNATIONS.map((designation) => (
                      <option key={designation} value={designation}>
                        {designation}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Group *
                  </label>
                  <select aria-label="Blood Group"
                    value={formData.bloodGroup}
                    onChange={(e) =>
                      handleInputChange("bloodGroup", e.target.value)
                    }
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <Input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleInputChange("dob", e.target.value)}
                    className={errors.dob ? "border-red-500" : ""}
                  />
                  {errors.dob && (
                    <p className="text-red-500 text-xs mt-1">{errors.dob}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Join Date
                  </label>
                  <Input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) =>
                      handleInputChange("joinDate", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Photo Upload */}
            {!teacher && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Teacher Photos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Photos (Max 20 photos, 10MB each)
                    </label>
                    <input title="Upload Photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {selectedPhotos.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Selected Photos ({selectedPhotos.length}/20):
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {selectedPhotos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <button aria-label="Remove Photo"
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* A simplified version - basic fields only for now */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subjects *
                  </label>
                  {formData.subjects.map((subject, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={subject}
                        onChange={(e) =>
                          handleArrayChange("subjects", index, e.target.value)
                        }
                        placeholder="Enter subject name"
                        className="flex-1"
                      />
                      {formData.subjects.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem("subjects", index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem("subjects")}
                  >
                    Add Subject
                  </Button>
                  {errors.subjects && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.subjects}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grades * (Select at least one)
                    </label>
                    <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                      {GRADES.map((grade) => (
                        <label
                          key={grade}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={formData.grades.includes(grade)}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "grades",
                                grade,
                                e.target.checked
                              )
                            }
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{grade}</span>
                        </label>
                      ))}
                    </div>
                    {errors.grades && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.grades}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sections * (Select at least one)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {SECTIONS.map((section) => (
                        <label
                          key={section}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={formData.sections.includes(section)}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "sections",
                                section,
                                e.target.checked
                              )
                            }
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{section}</span>
                        </label>
                      ))}
                    </div>
                    {errors.sections && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.sections}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Basic Qualification *
                  </label>
                  <Input
                    value={formData.qualifications[0]?.degree || ""}
                    onChange={(e) =>
                      handleQualificationChange(0, "degree", e.target.value)
                    }
                    placeholder="e.g., Bachelor of Science in Mathematics"
                    className={errors.qualifications ? "border-red-500" : ""}
                  />
                  {errors.qualifications && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.qualifications}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Institution *
                    </label>
                    <Input
                      value={formData.qualifications[0]?.institution || ""}
                      onChange={(e) =>
                        handleQualificationChange(
                          0,
                          "institution",
                          e.target.value
                        )
                      }
                      placeholder="University/College name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Graduation Year *
                    </label>
                    <Input
                      type="number"
                      value={formData.qualifications[0]?.year || ""}
                      onChange={(e) =>
                        handleQualificationChange(
                          0,
                          "year",
                          parseInt(e.target.value)
                        )
                      }
                      min="1980"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <Input
                      value={formData.address.city}
                      onChange={(e) =>
                        handleInputChange("address.city", e.target.value)
                      }
                      placeholder="Enter city"
                      className={errors.addressCity ? "border-red-500" : ""}
                    />
                    {errors.addressCity && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.addressCity}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <Input
                      value={formData.address.state}
                      onChange={(e) =>
                        handleInputChange("address.state", e.target.value)
                      }
                      placeholder="Enter state/division"
                      className={errors.addressState ? "border-red-500" : ""}
                    />
                    {errors.addressState && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.addressState}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact Name *
                  </label>
                  <Input
                    value={formData.emergencyContact.name}
                    onChange={(e) =>
                      handleInputChange("emergencyContact.name", e.target.value)
                    }
                    placeholder="Enter emergency contact name"
                    className={errors.emergencyName ? "border-red-500" : ""}
                  />
                  {errors.emergencyName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.emergencyName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship *
                    </label>
                    <Input
                      value={formData.emergencyContact.relationship}
                      onChange={(e) =>
                        handleInputChange(
                          "emergencyContact.relationship",
                          e.target.value
                        )
                      }
                      placeholder="e.g., Spouse, Parent"
                      className={
                        errors.emergencyRelationship ? "border-red-500" : ""
                      }
                    />
                    {errors.emergencyRelationship && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.emergencyRelationship}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emergency Phone *
                    </label>
                    <Input
                      value={formData.emergencyContact.phone}
                      onChange={(e) =>
                        handleInputChange(
                          "emergencyContact.phone",
                          e.target.value
                        )
                      }
                      placeholder="Enter emergency contact phone"
                      className={errors.emergencyPhone ? "border-red-500" : ""}
                    />
                    {errors.emergencyPhone && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.emergencyPhone}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        <div className="flex justify-end gap-2 p-6 border-t bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4" />
            {loading
              ? (teacher ? "Updating..." : "Creating...")
              : teacher
              ? "Update Teacher"
              : "Create Teacher"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeacherForm;