import React, { useState, useEffect } from "react";
import { X, User, MapPin, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { studentApi } from "../../../services/student.api";
import { adminApi } from "../../../services/admin.api";
import { useAuth } from "../../../context/AuthContext";
import { showApiError, showToast } from "../../../utils/toast";
import { CredentialsModal } from "../CredentialsModal";

interface Student {
  address: any;
  id?: string;
  studentId?: string;
  grade: number;
  section?: string;
  rollNumber?: number;
  bloodGroup?: string;
  dob?: string;
  admissionDate?: string;
  isActive?: boolean;
  age?: number;
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  school?: {
    id: string;
    name: string;
  };
  parent?: {
    id: string;
    userId?: string;
    fullName: string;
    name?: string; // For form compatibility
    email?: string;
    phone?: string;
    address?: string;
    occupation?: string;
    relationship?: string;
  };
  photos?:
  | Array<{
    id: string;
    photoPath: string;
    photoNumber: number;
    filename: string;
    size: number;
    createdAt: string;
  }>
  | File[]; // Support both response and upload
  photoCount?: number;
  createdAt?: string;
  updatedAt?: string;

  // Form-specific fields for compatibility
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  schoolId?: string;
}

interface StudentFormProps {
  student?: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
}

const StudentForm: React.FC<StudentFormProps> = ({
  student,
  isOpen,
  onClose,
  onSave,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Student>({
    grade: 9,
    section: "A",
    dob: "",
    bloodGroup: "A+",
    isActive: true,
    admissionDate: new Date().toISOString().split("T")[0],
    schoolId: user?.schoolId || "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    user: undefined,
    parent: {
      id: "",
      userId: "",
      fullName: "",
      name: "",
      email: "",
      phone: "",
      address: "",
      occupation: "",
      relationship: "",
    },
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
    photos: [],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [schoolData, setSchoolData] = useState<any>(null);
  const [loadingSchool, setLoadingSchool] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [credentials, setCredentials] = useState<{
    student: {
      id: string;
      username: string;
      password: string;
      email?: string;
      phone?: string;
    };
    parent: {
      id: string;
      username: string;
      password: string;
      email?: string;
      phone?: string;
    };
  } | null>(null);

  // Load school data to get grade configuration
  useEffect(() => {
    const loadSchoolData = async () => {

      if (!user?.schoolId) {
        console.error('No schoolId found in user context');
        setLoadingSchool(false);
        return;
      }

      setLoadingSchool(true);
      try {
        const response = await adminApi.getSchoolSettings();
        if (response.data.success && response.data) {
          setSchoolData(response.data.data);
        }
      } catch (error) {
        console.error("Failed to load school data:", error);
      } finally {
        setLoadingSchool(false);
      }
    };

    if (isOpen) {
      loadSchoolData();
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (student) {
      setFormData({
        ...student,
        firstName: student.user?.firstName || student.firstName || "",
        lastName: student.user?.lastName || student.lastName || "",
        email: student.user?.email || student.email || "",
        phone: student.user?.phone || student.phone || "",
        // Ensure date format is correct for input
        dob: student.dob?.split("T")[0] || "",
        admissionDate: student.admissionDate?.split("T")[0] || "",
        // Map parent data properly with all available information
        parent: {
          id: student.parent?.id || "",
          userId: student.parent?.userId || "",
          fullName: student.parent?.fullName || "",
          name: student.parent?.fullName || student.parent?.name || "",
          email: student.parent?.email || "",
          phone: student.parent?.phone || "",
          address: student.parent?.address || "",
          occupation: student.parent?.occupation || "",
          relationship: student.parent?.relationship || "",
        },
        // Map student address properly - this was missing!
        address: {
          street: student.address?.street || "",
          city: student.address?.city || "",
          state: student.address?.state || "",
          country: student.address?.country || "",
          postalCode: student.address?.postalCode || "",
        },
        schoolId: student.schoolId || user?.schoolId || "",
        photos: [],
      });
    } else {
      // Creating new student - reset to default values
      setFormData({
        grade: 9,
        section: "A",
        dob: "",
        bloodGroup: "A+",
        isActive: true,
        admissionDate: new Date().toISOString().split("T")[0],
        schoolId: user?.schoolId || "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        user: undefined,
        parent: {
          id: "",
          userId: "",
          fullName: "",
          name: "",
          email: "",
          phone: "",
          address: "",
          occupation: "",
          relationship: "",
        },
        address: {
          street: "",
          city: "",
          state: "",
          country: "",
          postalCode: "",
        },
        photos: [],
      });
    }
    setErrors({});
    setSelectedPhotos([]);
    setPhotoPreview([]);
  }, [student, isOpen, user?.schoolId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName?.trim())
      newErrors.lastName = "Last name is required";
    // Email is optional, but if provided, should be valid
    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.grade || formData.grade < 1 || formData.grade > 12)
      newErrors.grade = "Valid grade is required";
    if (!formData.bloodGroup?.trim())
      newErrors.bloodGroup = "Blood group is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (!formData.admissionDate)
      newErrors.admissionDate = "Admission date is required";
    if (!formData.schoolId) newErrors.schoolId = "School ID is required";

    // Photos validation - photos are optional for form submission
    if (formData.photos && formData.photos.length > 8) {
      newErrors.photos = "Maximum 8 photos allowed";
    }
    // Note: Photos are optional - students can be created without photos and photos can be added later

    // Parent validation
    if (!formData.parent?.name?.trim())
      newErrors.parentName = "Parent name is required";
    // Parent email is optional, but if provided, should be valid
    if (formData.parent?.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent.email)) {
      newErrors.parentEmail = "Invalid parent email format";
    }
    // Parent phone is optional
    // if (!formData.parent?.phone?.trim())
    //   newErrors.parentPhone = "Parent phone is required";

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
      if (student?.id) {
        // Update existing student
        const updateData = {
          grade: formData.grade,
          section: formData.section || "A",
          bloodGroup: formData.bloodGroup!,
          dob: formData.dob,
          rollNumber: formData.rollNumber,
          isActive: formData.isActive ?? true,
          address: {
            street: formData.address?.street?.trim() || "",
            city: formData.address?.city?.trim() || "",
            state: formData.address?.state?.trim() || "",
            country: formData.address?.country?.trim() || "",
            postalCode: formData.address?.postalCode?.trim() || "",
          },
          parentInfo: {
            name: formData.parent?.name?.trim(),
            email: formData.parent?.email?.trim(),
            phone: formData.parent?.phone?.trim(),
            address: formData.parent?.address?.trim(),
            occupation: formData.parent?.occupation?.trim(),
            relationship: formData.parent?.relationship?.trim(),
          },
        };

        const response = await studentApi.update(student.id, updateData);

        if (response.data.success) {
          showToast.success("Student updated successfully!");
          onSave(response.data.data);
          onClose();
        }
      } else {
        // Create new student
        const formDataToSend = new FormData();

        // Validate required fields before sending
        if (!user?.schoolId) {
          throw new Error("School ID is missing");
        }
        if (!formData.firstName?.trim()) {
          throw new Error("First name is required");
        }
        if (!formData.lastName?.trim()) {
          throw new Error("Last name is required");
        }
        if (!formData.grade) {
          throw new Error("Grade is required");
        }
        if (!formData.bloodGroup) {
          throw new Error("Blood group is required");
        }
        if (!formData.dob) {
          throw new Error("Date of birth is required");
        }
        if (!formData.parent?.name?.trim()) {
          throw new Error("Parent name is required");
        }

        // Add student data - only add non-empty values
        formDataToSend.append("schoolId", user.schoolId);
        formDataToSend.append("firstName", formData.firstName.trim());
        formDataToSend.append("lastName", formData.lastName.trim());

        if (formData.email?.trim()) {
          formDataToSend.append("email", formData.email.trim());
        }
        if (formData.phone?.trim()) {
          formDataToSend.append("phone", formData.phone.trim());
        }

        formDataToSend.append("grade", formData.grade.toString());
        formDataToSend.append("section", formData.section?.trim() || "A");
        formDataToSend.append("bloodGroup", formData.bloodGroup);
        formDataToSend.append("dob", formData.dob);
        if (formData.admissionDate) {
          formDataToSend.append("admissionDate", formData.admissionDate);
        }

        // Add parent info
        formDataToSend.append("parentInfo[name]", formData.parent.name!.trim());

        if (formData.parent?.email?.trim()) {
          formDataToSend.append(
            "parentInfo[email]",
            formData.parent.email.trim()
          );
        }
        if (formData.parent?.phone?.trim()) {
          formDataToSend.append(
            "parentInfo[phone]",
            formData.parent.phone.trim()
          );
        }
        if (formData.parent?.address?.trim()) {
          formDataToSend.append(
            "parentInfo[address]",
            formData.parent.address.trim()
          );
        }
        if (formData.parent?.occupation?.trim()) {
          formDataToSend.append(
            "parentInfo[occupation]",
            formData.parent.occupation.trim()
          );
        }
        if (formData.parent?.relationship?.trim()) {
          formDataToSend.append(
            "parentInfo[relationship]",
            formData.parent.relationship.trim()
          );
        }

        // Add student address information
        if (formData.address?.street?.trim()) {
          formDataToSend.append("address[street]", formData.address.street.trim());
        }
        if (formData.address?.city?.trim()) {
          formDataToSend.append("address[city]", formData.address.city.trim());
        }
        if (formData.address?.state?.trim()) {
          formDataToSend.append("address[state]", formData.address.state.trim());
        }
        if (formData.address?.country?.trim()) {
          formDataToSend.append("address[country]", formData.address.country.trim());
        }
        if (formData.address?.postalCode?.trim()) {
          formDataToSend.append("address[postalCode]", formData.address.postalCode.trim());
        }

        // Add photos
        if (formData.photos && formData.photos.length > 0) {
          (formData.photos as File[]).forEach((photo) => {
            formDataToSend.append("photos", photo);
          });
        }

        // Submit the form
        const response = await studentApi.createWithPhotos(formDataToSend);

        if (response.data.success) {
          showToast.success(
            "Student created successfully with auto-generated credentials!"
          );

          if (response.data.data.credentials) {
            setCredentials(response.data.data.credentials);
          }

          onSave(response.data.data);
          onClose();
        }
      }
    } catch (error: any) {
      console.error("Failed to save student:", error);
      if (error.response?.data) {
        console.error("API Error Details:", error.response.data);
      }
      showApiError(
        error,
        `Failed to ${student?.id ? "update" : "create"} student`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("parent.")) {
      const parentField = field.replace("parent.", "");
      setFormData((prev) => ({
        ...prev,
        parent: {
          ...prev.parent,
          [parentField]: value,
          // Update both name and fullName for consistency
          ...(parentField === "name" && { fullName: value }),
        } as NonNullable<Student["parent"]>,
      }));
    } else if (field.startsWith("address.")) {
      const addressField = field.replace("address.", "");
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);

    // Validate file count
    if (selectedPhotos.length + newFiles.length > 8) {
      setErrors((prev) => ({ ...prev, photos: "Maximum 8 photos allowed" }));
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    const previews: string[] = [];

    newFiles.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          photos: "Only image files are allowed",
        }));
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB
        setErrors((prev) => ({
          ...prev,
          photos: "Each photo must be under 10MB",
        }));
        return;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          previews.push(e.target.result as string);
          if (previews.length === validFiles.length) {
            setPhotoPreview((prev) => [...prev, ...previews]);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    setSelectedPhotos((prev) => [...prev, ...validFiles]);
    setFormData((prev) => ({
      ...prev,
      photos: [...((prev.photos as File[]) || []), ...validFiles] as File[],
    }));

    // Clear any photo upload errors if photos become valid
    if (selectedPhotos.length + validFiles.length <= 8) {
      setErrors((prev) => ({ ...prev, photos: "" }));
    }
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreview((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      photos: (prev.photos?.filter((_, i) => i !== index) || []) as File[],
    }));

    // Update validation - photos are now optional
    if (selectedPhotos.length === 0) {
      // Clear any previous photo errors if no photos selected
      setErrors((prev) => ({ ...prev, photos: "" }));
    } else if (selectedPhotos.length > 8) {
      setErrors((prev) => ({
        ...prev,
        photos: "Maximum 8 photos allowed",
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {student ? "Edit Student" : "Add New Student"}
          </h2>
          <Button variant="outline" onClick={onClose} className="p-2">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.firstName || ""}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Enter first name"
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.lastName || ""}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Enter last name"
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <Input
                    value={formData.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.grade.toString()}
                    onValueChange={(value) =>
                      handleInputChange("grade", parseInt(value))
                    }
                  >
                    <SelectTrigger
                      className={`w-full ${errors.grade ? "border-red-500" : ""
                        }`}
                    >
                      <SelectValue placeholder="Select Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingSchool ? (
                        <SelectItem value="loading" disabled>
                          Loading grades...
                        </SelectItem>
                      ) : schoolData?.settings?.grades &&
                        schoolData.settings.grades.length > 0 ? (
                        schoolData.settings.grades
                          .filter((grade: number) => grade && grade > 0) // Filter out invalid grades
                          .map((grade: number) => (
                            <SelectItem key={grade} value={grade.toString()}>
                              Grade {grade}
                            </SelectItem>
                          ))
                      ) : (
                        // Fallback to default grades if school data not available
                        <>
                          <SelectItem value="9">Grade 9</SelectItem>
                          <SelectItem value="10">Grade 10</SelectItem>
                          <SelectItem value="11">Grade 11</SelectItem>
                          <SelectItem value="12">Grade 12</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.grade && (
                    <p className="text-red-500 text-sm mt-1">{errors.grade}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section
                  </label>
                  <Select
                    value={formData.section || ""}
                    onValueChange={(value) =>
                      handleInputChange("section", value)
                    }
                  >
                    <SelectTrigger
                      className={`w-full ${errors.section ? "border-red-500" : ""
                        }`}
                    >
                      <SelectValue placeholder="Select Section" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingSchool ? (
                        <SelectItem value="loading" disabled>
                          Loading sections...
                        </SelectItem>
                      ) : schoolData?.settings?.sections &&
                        schoolData.settings.sections.length > 0 ? (
                        schoolData.settings.sections
                          .filter((section: string) => section && section.trim()) // Filter out empty strings
                          .map((section: string) => (
                            <SelectItem key={section} value={section}>
                              Section {section}
                            </SelectItem>
                          ))
                      ) : (
                        // Fallback to default sections if school data not available
                        <>
                          <SelectItem value="A">Section A</SelectItem>
                          <SelectItem value="B">Section B</SelectItem>
                          <SelectItem value="C">Section C</SelectItem>
                          <SelectItem value="D">Section D</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.section && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.section}
                    </p>
                  )}
                </div>
              </div>

              {/* Photo Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Photos (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <div className="text-gray-400 mb-2">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      <span className="font-medium">
                        Click to upload photos
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG up to 10MB each (photos are optional)
                    </p>
                  </label>
                </div>

                {photoPreview.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {photoPreview.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {errors.photos && (
                  <p className="text-red-500 text-sm mt-1">{errors.photos}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <DatePicker
                    value={formData.dob || ""}
                    onChange={(date) => handleInputChange("dob", date)}
                    placeholder="Select date of birth"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Group
                  </label>
                  <Select
                    value={formData.bloodGroup || ""}
                    onValueChange={(value) =>
                      handleInputChange("bloodGroup", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Blood Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admission Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={formData.admissionDate || ""}
                    onChange={(date) =>
                      handleInputChange("admissionDate", date)
                    }
                    placeholder="Select admission date"
                    error={!!errors.admissionDate}
                  />
                  {errors.admissionDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.admissionDate}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parent Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Parent/Guardian Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.parent?.name || ""}
                    onChange={(e) =>
                      handleInputChange("parent.name", e.target.value)
                    }
                    placeholder="Enter parent/guardian name"
                    className={errors.parentName ? "border-red-500" : ""}
                  />
                  {errors.parentName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.parentName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={formData.parent?.email || ""}
                    onChange={(e) =>
                      handleInputChange("parent.email", e.target.value)
                    }
                    placeholder="Enter parent email"
                    className={errors.parentEmail ? "border-red-500" : ""}
                  />
                  {errors.parentEmail && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.parentEmail}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Phone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.parent?.phone || ""}
                    onChange={(e) =>
                      handleInputChange("parent.phone", e.target.value)
                    }
                    placeholder="Enter parent phone"
                    className={errors.parentPhone ? "border-red-500" : ""}
                  />
                  {errors.parentPhone && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.parentPhone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Address
                  </label>
                  <Input
                    value={formData.parent?.address || ""}
                    onChange={(e) =>
                      handleInputChange("parent.address", e.target.value)
                    }
                    placeholder="Enter parent address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Occupation
                  </label>
                  <Input
                    value={formData.parent?.occupation || ""}
                    onChange={(e) =>
                      handleInputChange("parent.occupation", e.target.value)
                    }
                    placeholder="Enter parent occupation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  <select
                    value={formData.parent?.relationship || ""}
                    onChange={(e) =>
                      handleInputChange("parent.relationship", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    aria-label="Parent relationship"
                  >
                    <option value="">Select relationship</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Grandfather">Grandfather</option>
                    <option value="Grandmother">Grandmother</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <Input
                  value={formData.address?.street || ""}
                  onChange={(e) =>
                    handleInputChange("address.street", e.target.value)
                  }
                  placeholder="Enter street address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <Input
                    value={formData.address?.city || ""}
                    onChange={(e) =>
                      handleInputChange("address.city", e.target.value)
                    }
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <Input
                    value={formData.address?.state || ""}
                    onChange={(e) =>
                      handleInputChange("address.state", e.target.value)
                    }
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <Input
                    value={formData.address?.country || ""}
                    onChange={(e) =>
                      handleInputChange("address.country", e.target.value)
                    }
                    placeholder="Enter country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <Input
                    value={formData.address?.postalCode || ""}
                    onChange={(e) =>
                      handleInputChange("address.postalCode", e.target.value)
                    }
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {student ? "Update Student" : "Add Student"}
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={!!credentials}
        onClose={() => setCredentials(null)}
        credentials={credentials}
        studentName={`${formData.firstName} ${formData.lastName}`}
        parentName={formData.parent?.name || ""}
      />
    </div>
  );
};

export default StudentForm;
