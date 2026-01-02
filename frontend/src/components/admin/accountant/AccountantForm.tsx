import React, { useState, useEffect } from "react";
import { Save, Upload, X, Camera, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "../../../context/AuthContext";
import { showApiError, showToast } from "../../../utils/toast";
import { adminApi } from "../../../services/admin.api";
import { AccountantCredentialsModal } from "./AccountantCredentialsModal";

interface AccountantFormData {
  // Basic Information (Required)
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  designation: string;
  department: string;
  bloodGroup: string;
  dob: string;
  joinDate?: string;

  // Experience (Required)
  experience: {
    totalYears: number;
    previousCompanies: Array<{
      companyName: string;
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

  // Responsibilities (Optional)
  responsibilities?: string[];

  // Certifications (Optional)
  certifications?: Array<{
    name: string;
    issuedBy: string;
    issuedDate: string;
    expiryDate?: string;
  }>;

  // Photos (3-10 required)
  photos: File[];
}

interface Credentials {
  accountant: {
    id: string;
    username: string;
    password: string;
    email?: string;
    phone?: string;
  };
  employeeId: string;
}

interface AccountantFormProps {
  accountant?: any; // Accountant to edit
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const AccountantForm: React.FC<AccountantFormProps> = ({ accountant, isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const isEditMode = !!accountant;

  const [formData, setFormData] = useState<AccountantFormData>({
    // Basic Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employeeId: "",
    designation: "Accountant",
    department: "Finance",
    bloodGroup: "O+",
    dob: "",
    joinDate: "",

    // Experience
    experience: {
      totalYears: 0,
      previousCompanies: [],
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

    // Responsibilities (optional)
    responsibilities: [""],

    // Certifications (optional)
    certifications: [],

    // Photos (3-10 required)
    photos: [],
  });

  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  // Initialize form with accountant data if editing
  useEffect(() => {
    if (accountant) {
      setFormData({
        firstName: accountant.user?.firstName || "",
        lastName: accountant.user?.lastName || "",
        email: accountant.user?.email || "",
        phone: accountant.user?.phone || "",
        employeeId: accountant.employeeId || "",
        designation: accountant.designation || "Accountant",
        department: accountant.department || "Finance",
        bloodGroup: accountant.bloodGroup || "O+",
        dob: accountant.dob ? accountant.dob.split("T")[0] : "",
        joinDate: accountant.joinDate ? accountant.joinDate.split("T")[0] : "",
        experience: {
          totalYears: accountant.experience?.totalYears || 0,
          previousCompanies: Array.isArray(accountant.experience?.previousCompanies) 
            ? accountant.experience.previousCompanies 
            : [],
        },
        address: accountant.address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "Bangladesh",
        },
        qualifications: Array.isArray(accountant.qualifications) && accountant.qualifications.length > 0
          ? accountant.qualifications
          : [
              {
                degree: "",
                institution: "",
                year: new Date().getFullYear().toString(),
                specialization: "",
              },
            ],
        emergencyContact: accountant.emergencyContact || {
          name: "",
          relationship: "",
          phone: "",
          email: "",
        },
        salary: accountant.salary || {
          basic: 0,
          allowances: 0,
          deductions: 0,
        },
        responsibilities: Array.isArray(accountant.responsibilities) && accountant.responsibilities.length > 0
          ? accountant.responsibilities
          : [""],
        certifications: Array.isArray(accountant.certifications) 
          ? accountant.certifications 
          : [],
        photos: [], // Photos handled separately in edit mode
      });
    }
  }, [accountant]);

  if (!isOpen) return null;

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

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof AccountantFormData] as any),
        [field]: value,
      },
    }));

    // Clear error
    const errorKey = `${parent}.${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: "",
      }));
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const currentPhotoCount = formData.photos.length;

    // Validate total count
    if (currentPhotoCount + newFiles.length > 10) {
      showToast.error("Maximum 10 photos allowed");
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    newFiles.forEach((file) => {
      // Check file type
      if (!file.type.startsWith("image/")) {
        showToast.error(`${file.name} is not an image file`);
        return;
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        showToast.error(`${file.name} exceeds 10MB limit`);
        return;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          if (newPreviews.length === validFiles.length) {
            setPhotoPreviewUrls((prev) => [...prev, ...newPreviews]);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...validFiles],
      }));

      // Clear photo error if we now have enough photos
      if (currentPhotoCount + validFiles.length >= 3) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.photos;
          return newErrors;
        });
      }
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    setPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));

    // Add error if photos drop below minimum
    if (formData.photos.length - 1 < 3) {
      setErrors((prev) => ({
        ...prev,
        photos: "At least 3 photos are required",
      }));
    }
  };

  const addQualification = () => {
    setFormData((prev) => ({
      ...prev,
      qualifications: [
        ...prev.qualifications,
        {
          degree: "",
          institution: "",
          year: new Date().getFullYear().toString(),
          specialization: "",
        },
      ],
    }));
  };

  const removeQualification = (index: number) => {
    if (formData.qualifications.length > 1) {
      setFormData((prev) => ({
        ...prev,
        qualifications: prev.qualifications.filter((_, i) => i !== index),
      }));
    }
  };

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: {
        ...prev.experience,
        previousCompanies: [
          ...prev.experience.previousCompanies,
          {
            companyName: "",
            position: "",
            duration: "",
            fromDate: "",
            toDate: "",
          },
        ],
      },
    }));
  };

  const removeExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experience: {
        ...prev.experience,
        previousCompanies: prev.experience.previousCompanies.filter(
          (_, i) => i !== index
        ),
      },
    }));
  };

  // Responsibilities and certifications management functions (for future use)
  // const addResponsibility = () => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     responsibilities: [...(prev.responsibilities || []), ""],
  //   }));
  // };

  // const removeResponsibility = (index: number) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     responsibilities: (prev.responsibilities || []).filter((_, i) => i !== index),
  //   }));
  // };

  // const addCertification = () => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     certifications: [
  //       ...(prev.certifications || []),
  //       {
  //         name: "",
  //         issuedBy: "",
  //         issuedDate: "",
  //         expiryDate: "",
  //       },
  //     ],
  //   }));
  // };

  // const removeCertification = (index: number) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     certifications: (prev.certifications || []).filter((_, i) => i !== index),
  //   }));
  // };

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
    if (!formData.department.trim()) {
      newErrors.department = "Department is required";
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Photo validation (3-10 required only for new accountants)
    if (!isEditMode) {
      if (formData.photos.length < 3) {
        newErrors.photos = "At least 3 photos are required";
      } else if (formData.photos.length > 10) {
        newErrors.photos = "Maximum 10 photos allowed";
      }
    } else {
      // In edit mode, photos are optional but if provided, must be valid
      if (formData.photos.length > 10) {
        newErrors.photos = "Maximum 10 photos allowed";
      }
    }

    // Experience validation
    if (formData.experience.totalYears < 0) {
      newErrors["experience.totalYears"] = "Experience cannot be negative";
    }

    // Address validation
    if (!formData.address.city.trim()) {
      newErrors["address.city"] = "City is required";
    }
    if (!formData.address.state.trim()) {
      newErrors["address.state"] = "State is required";
    }
    if (!formData.address.zipCode.trim()) {
      newErrors["address.zipCode"] = "Zip code is required";
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
      newErrors["emergencyContact.name"] = "Emergency contact name is required";
    }
    if (!formData.emergencyContact.relationship.trim()) {
      newErrors["emergencyContact.relationship"] =
        "Emergency contact relationship is required";
    }
    if (!formData.emergencyContact.phone.trim()) {
      newErrors["emergencyContact.phone"] = "Emergency contact phone is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast.error("Please fix all errors before submitting");
      // Show specific error about photos if that's the issue
      if (errors.photos) {
        showToast.error(errors.photos);
      }
      return;
    }

    // Check if user has schoolId
    if (!user?.schoolId) {
      showToast.error("School ID not found. Please login again.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && accountant?.id) {
        // Update existing accountant
        const updateData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          designation: formData.designation,
          department: formData.department,
          bloodGroup: formData.bloodGroup,
          dob: formData.dob,
          joinDate: formData.joinDate,
          experience: formData.experience,
          address: formData.address,
          qualifications: formData.qualifications,
          emergencyContact: formData.emergencyContact,
          salary: formData.salary,
          responsibilities: formData.responsibilities?.filter((r) => r.trim()),
          certifications: formData.certifications,
        };

        const response = await adminApi.updateAccountant(accountant.id, updateData);

        if (response.data.success) {
          showToast.success("Accountant updated successfully!");
          onSave();
          onClose();
        }
      } else {
        // Create new accountant
        // Create FormData for file upload (similar to teacher form)
        const submitData = new FormData();

        // Add schoolId from authenticated user
        submitData.append("schoolId", user.schoolId);

      // Add basic fields (all required by backend)
      submitData.append("firstName", formData.firstName);
      submitData.append("lastName", formData.lastName);
      submitData.append("designation", formData.designation);
      submitData.append("department", formData.department);
      submitData.append("bloodGroup", formData.bloodGroup);
      submitData.append("dob", formData.dob);

      // Add optional basic fields
      if (formData.email) submitData.append("email", formData.email);
      if (formData.phone) submitData.append("phone", formData.phone);
      if (formData.joinDate) submitData.append("joinDate", formData.joinDate);
      if (formData.employeeId) submitData.append("employeeId", formData.employeeId);

      // Add experience (required)
      submitData.append("experience", JSON.stringify(formData.experience));

      // Add address (required)
      submitData.append("address", JSON.stringify(formData.address));

      // Add qualifications (required)
      submitData.append("qualifications", JSON.stringify(formData.qualifications));

      // Add emergency contact (required)
      submitData.append(
        "emergencyContact",
        JSON.stringify(formData.emergencyContact)
      );

      // Add salary (optional)
      if (formData.salary && formData.salary.basic > 0) {
        submitData.append("salary", JSON.stringify(formData.salary));
      }

      // Add responsibilities (optional)
      if (formData.responsibilities && formData.responsibilities.some((r) => r.trim())) {
        submitData.append(
          "responsibilities",
          JSON.stringify(formData.responsibilities.filter((r) => r.trim()))
        );
      }

      // Add certifications (optional)
      if (formData.certifications && formData.certifications.length > 0) {
        submitData.append("certifications", JSON.stringify(formData.certifications));
      }

        // Add photos (3-10 required)
        formData.photos.forEach((photo) => {
          submitData.append("photos", photo);
        });

        // Make API call to create accountant
        const response = await adminApi.createAccountant(submitData);

        // Show success and credentials
        showToast.success("Accountant created successfully!");
        
        if (response.data?.data?.credentials) {
          const creds = response.data.data.credentials;
          // Transform to match CredentialsModal format
          setCredentials({
            accountant: {
              id: creds.accountantId || "",
              username: creds.username || "",
              password: creds.password || "", // Password should be here
              email: formData.email,
              phone: formData.phone,
            },
            employeeId: creds.employeeId || response.data.data.employeeId || "",
          });
        }

        // Call success callback
        onSave();

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          employeeId: "",
          designation: "Accountant",
          department: "Finance",
          bloodGroup: "O+",
          dob: "",
          joinDate: "",
          experience: {
            totalYears: 0,
            previousCompanies: [],
          },
          address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "Bangladesh",
          },
          qualifications: [
            {
              degree: "",
              institution: "",
              year: new Date().getFullYear().toString(),
              specialization: "",
            },
          ],
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
          responsibilities: [""],
          certifications: [],
          photos: [],
        });
        setPhotoPreviewUrls([]);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} accountant:`, error);
      showApiError(error, `Failed to ${isEditMode ? 'update' : 'create'} accountant`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white w-full h-full sm:h-auto sm:rounded-lg sm:shadow-xl sm:w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl sm:my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white sm:rounded-t-lg z-10 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                {isEditMode ? "Edit Accountant" : "Add New Accountant"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 hidden sm:block">
                {isEditMode 
                  ? "Update accountant profile information"
                  : "Create a new accountant profile with credentials"
                }
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onClose} size="sm" className="flex-shrink-0 ml-2">
            <X className="w-4 h-4" />
          </Button>
        </div>

          {/* Form Content - Scrollable */}
          <form onSubmit={handleSubmit} className="flex flex-col h-[calc(100vh-80px)] sm:h-auto sm:max-h-[calc(90vh-80px)]">
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
            {/* Basic Information */}
            <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
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
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        placeholder="Enter last name"
                        className={errors.lastName ? "border-red-500" : ""}
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
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
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Designation <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.designation}
                        onValueChange={(value) => handleChange("designation", value)}
                      >
                        <SelectTrigger
                          className={errors.designation ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Select Designation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Accountant">Accountant</SelectItem>
                          <SelectItem value="Senior Accountant">
                            Senior Accountant
                          </SelectItem>
                          <SelectItem value="Junior Accountant">
                            Junior Accountant
                          </SelectItem>
                          <SelectItem value="Accounts Manager">
                            Accounts Manager
                          </SelectItem>
                          <SelectItem value="Finance Officer">
                            Finance Officer
                          </SelectItem>
                          <SelectItem value="Auditor">Auditor</SelectItem>
                          <SelectItem value="Tax Consultant">
                            Tax Consultant
                          </SelectItem>
                          <SelectItem value="Payroll Specialist">
                            Payroll Specialist
                          </SelectItem>
                          <SelectItem value="Budget Analyst">
                            Budget Analyst
                          </SelectItem>
                          <SelectItem value="Chief Financial Officer">
                            Chief Financial Officer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.designation && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.designation}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => handleChange("department", value)}
                      >
                        <SelectTrigger
                          className={errors.department ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Accounts">Accounts</SelectItem>
                          <SelectItem value="Administration">
                            Administration
                          </SelectItem>
                          <SelectItem value="Audit">Audit</SelectItem>
                          <SelectItem value="Payroll">Payroll</SelectItem>
                          <SelectItem value="Budget">Budget</SelectItem>
                          <SelectItem value="Treasury">Treasury</SelectItem>
                          <SelectItem value="Tax">Tax</SelectItem>
                          <SelectItem value="Management">Management</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.department && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.department}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Group <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.bloodGroup}
                        onValueChange={(value) => handleChange("bloodGroup", value)}
                      >
                        <SelectTrigger>
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => handleChange("dob", e.target.value)}
                        className={errors.dob ? "border-red-500" : ""}
                      />
                      {errors.dob && (
                        <p className="text-red-500 text-sm mt-1">{errors.dob}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Join Date
                      </label>
                      <Input
                        type="date"
                        value={formData.joinDate}
                        onChange={(e) => handleChange("joinDate", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Address Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <Input
                      value={formData.address.street}
                      onChange={(e) =>
                        handleNestedChange("address", "street", e.target.value)
                      }
                      placeholder="Enter street address"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.address.city}
                        onChange={(e) =>
                          handleNestedChange("address", "city", e.target.value)
                        }
                        placeholder="Enter city"
                        className={errors["address.city"] ? "border-red-500" : ""}
                      />
                      {errors["address.city"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors["address.city"]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.address.state}
                        onChange={(e) =>
                          handleNestedChange("address", "state", e.target.value)
                        }
                        placeholder="Enter state"
                        className={errors["address.state"] ? "border-red-500" : ""}
                      />
                      {errors["address.state"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors["address.state"]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zip Code <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.address.zipCode}
                        onChange={(e) =>
                          handleNestedChange("address", "zipCode", e.target.value)
                        }
                        placeholder="Enter zip code"
                        className={errors["address.zipCode"] ? "border-red-500" : ""}
                      />
                      {errors["address.zipCode"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors["address.zipCode"]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <Input
                        value={formData.address.country}
                        onChange={(e) =>
                          handleNestedChange("address", "country", e.target.value)
                        }
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Qualifications */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg">Educational Qualifications</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addQualification}
                      size="sm"
                    >
                      Add Qualification
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.qualifications.map((qual, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">
                          Qualification {index + 1}
                        </h4>
                        {formData.qualifications.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeQualification(index)}
                            size="sm"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Degree <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={qual.degree}
                            onChange={(e) => {
                              const newQuals = [...formData.qualifications];
                              newQuals[index].degree = e.target.value;
                              handleChange("qualifications", newQuals);
                            }}
                            placeholder="e.g., B.Com, MBA"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Institution <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={qual.institution}
                            onChange={(e) => {
                              const newQuals = [...formData.qualifications];
                              newQuals[index].institution = e.target.value;
                              handleChange("qualifications", newQuals);
                            }}
                            placeholder="University/College name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Year <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="number"
                            value={qual.year}
                            onChange={(e) => {
                              const newQuals = [...formData.qualifications];
                              newQuals[index].year = e.target.value;
                              handleChange("qualifications", newQuals);
                            }}
                            placeholder="Graduation year"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Specialization
                          </label>
                          <Input
                            value={qual.specialization}
                            onChange={(e) => {
                              const newQuals = [...formData.qualifications];
                              newQuals[index].specialization = e.target.value;
                              handleChange("qualifications", newQuals);
                            }}
                            placeholder="Area of specialization"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.emergencyContact.name}
                        onChange={(e) =>
                          handleNestedChange(
                            "emergencyContact",
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="Emergency contact name"
                        className={
                          errors["emergencyContact.name"] ? "border-red-500" : ""
                        }
                      />
                      {errors["emergencyContact.name"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors["emergencyContact.name"]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relationship <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.emergencyContact.relationship}
                        onChange={(e) =>
                          handleNestedChange(
                            "emergencyContact",
                            "relationship",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Spouse, Parent"
                        className={
                          errors["emergencyContact.relationship"]
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {errors["emergencyContact.relationship"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors["emergencyContact.relationship"]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.emergencyContact.phone}
                        onChange={(e) =>
                          handleNestedChange(
                            "emergencyContact",
                            "phone",
                            e.target.value
                          )
                        }
                        placeholder="Emergency contact phone"
                        className={
                          errors["emergencyContact.phone"] ? "border-red-500" : ""
                        }
                      />
                      {errors["emergencyContact.phone"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors["emergencyContact.phone"]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={formData.emergencyContact.email}
                        onChange={(e) =>
                          handleNestedChange(
                            "emergencyContact",
                            "email",
                            e.target.value
                          )
                        }
                        placeholder="Emergency contact email"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              
            {/*  Photos */}
            <div className="space-y-6">
              {/* Photo Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Photos (3-10 Required)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isEditMode && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> In edit mode, photo uploads are optional. 
                          Existing photos are preserved. Upload new photos to add to the collection.
                        </p>
                      </div>
                    )}
                    
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
                        <Upload className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 text-center">
                          <span className="font-medium">Click to upload</span> or
                          drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 10MB each
                        </p>
                        <p className="text-xs font-medium text-blue-600 mt-2">
                          {isEditMode 
                            ? `${formData.photos.length} new photo(s) to upload`
                            : `${formData.photos.length}/10 photos uploaded`
                          }
                        </p>
                      </label>
                    </div>

                    {errors.photos && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm font-medium">
                          {errors.photos}
                        </p>
                      </div>
                    )}

                    {photoPreviewUrls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {photoPreviewUrls.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                              {index + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">
                        Photo Guidelines:
                      </h4>
                      <ul className="text-xs text-blue-700 space-y-1">
                        {!isEditMode && <li>• Upload 3-10 professional photos</li>}
                        {isEditMode && <li>• Photos are optional in edit mode</li>}
                        <li>• Use clear, well-lit images</li>
                        <li>• Each photo must be under 10MB</li>
                        <li>• Accepted formats: JPG, PNG, GIF</li>
                        <li>• Photos will be stored securely in Cloudinary</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

              {/* Experience */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Work Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Years of Experience
                    </label>
                    <Input
                      type="number"
                      value={formData.experience.totalYears}
                      onChange={(e) =>
                        handleNestedChange(
                          "experience",
                          "totalYears",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="Total years"
                      min="0"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">
                      Previous Companies
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addExperience}
                      size="sm"
                    >
                      Add Experience
                    </Button>
                  </div>

                  {formData.experience.previousCompanies.map((exp, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-gray-700">
                          Experience {index + 1}
                        </h5>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeExperience(index)}
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company Name
                          </label>
                          <Input
                            value={exp.companyName}
                            onChange={(e) => {
                              const newExp = [
                                ...formData.experience.previousCompanies,
                              ];
                              newExp[index].companyName = e.target.value;
                              handleNestedChange(
                                "experience",
                                "previousCompanies",
                                newExp
                              );
                            }}
                            placeholder="Company name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Position
                          </label>
                          <Input
                            value={exp.position}
                            onChange={(e) => {
                              const newExp = [
                                ...formData.experience.previousCompanies,
                              ];
                              newExp[index].position = e.target.value;
                              handleNestedChange(
                                "experience",
                                "previousCompanies",
                                newExp
                              );
                            }}
                            placeholder="Job position"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            From Date
                          </label>
                          <Input
                            type="date"
                            value={exp.fromDate}
                            onChange={(e) => {
                              const newExp = [
                                ...formData.experience.previousCompanies,
                              ];
                              newExp[index].fromDate = e.target.value;
                              handleNestedChange(
                                "experience",
                                "previousCompanies",
                                newExp
                              );
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            To Date
                          </label>
                          <Input
                            type="date"
                            value={exp.toDate}
                            onChange={(e) => {
                              const newExp = [
                                ...formData.experience.previousCompanies,
                              ];
                              newExp[index].toDate = e.target.value;
                              handleNestedChange(
                                "experience",
                                "previousCompanies",
                                newExp
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Salary (Optional) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Salary Information (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Basic Salary
                      </label>
                      <Input
                        type="number"
                        value={formData.salary?.basic}
                        onChange={(e) =>
                          handleNestedChange(
                            "salary",
                            "basic",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="Basic salary"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allowances
                      </label>
                      <Input
                        type="number"
                        value={formData.salary?.allowances}
                        onChange={(e) =>
                          handleNestedChange(
                            "salary",
                            "allowances",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="Allowances"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deductions
                      </label>
                      <Input
                        type="number"
                        value={formData.salary?.deductions}
                        onChange={(e) =>
                          handleNestedChange(
                            "salary",
                            "deductions",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="Deductions"
                        min="0"
                      />
                    </div>
                  </div>

                  {formData.salary && formData.salary.basic > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        Net Salary:{" "}
                        {(
                          (formData.salary.basic || 0) +
                          (formData.salary.allowances || 0) -
                          (formData.salary.deductions || 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Form Actions - Fixed at bottom */}
            <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 p-3 sm:p-4 md:p-6 border-t bg-white">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Save className="h-4 w-4" />
                <span className="truncate">
                  {isSubmitting 
                    ? (isEditMode ? "Updating..." : "Creating...")
                    : (isEditMode ? "Update Accountant" : "Create Accountant")
                  }
                </span>
              </Button>
            </div>
          </form>
        </div>

        {/* Progress Indicator */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div>
                  <p className="font-medium text-sm sm:text-base">
                    {isEditMode ? "Updating accountant profile..." : "Creating accountant profile..."}
                  </p>
                  {!isEditMode && formData.photos.length > 0 && (
                    <p className="text-xs sm:text-sm text-gray-500">
                      Uploading photos to Cloudinary
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Credentials Modal */}
        <AccountantCredentialsModal
          isOpen={!!credentials}
          onClose={() => {
            setCredentials(null);
            onClose();
          }}
          credentials={credentials}
          accountantName={`${formData.firstName} ${formData.lastName}`}
        />
    </div>
  );
};

export default AccountantForm;
