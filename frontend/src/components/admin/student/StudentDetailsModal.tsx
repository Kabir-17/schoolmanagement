import React, { useState } from "react";
import { X, Key } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CredentialsModal } from "../CredentialsModal";
import { studentApi } from "@/services/student.api";

interface Student {
  id: string;
  studentId: string;
  grade: number;
  section: string;
  rollNumber: number;
  bloodGroup?: string;
  dob?: string;
  admissionDate?: string;
  isActive: boolean;
  age?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
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
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    occupation?: string;
    relationship?: string;
  };
  photos?: Array<{
    id: string;
    photoPath: string;
    photoNumber: number;
    filename: string;
    size: number;
    createdAt: string;
  }>;
  photoCount?: number;
  createdAt: string;
  updatedAt?: string;
}

  interface CredentialUser {
    _id: string;
    email: string;
    phone?: string;
  }

  interface Credential {
    role: "student" | "parent";
    userId?: CredentialUser;
    initialUsername?: string;
    initialPassword?: string;
  }

interface StudentDetailsModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  if (!isOpen || !student) return null;

  const handleShowCredentials = async () => {
    try {
      setLoadingCredentials(true);
      const response = await studentApi.getCredentials(student.id);

      if (response.data.success) {
        setCredentials(response.data.data);
        setShowCredentials(true);
      }
    } catch (error) {
      console.error("Error fetching credentials:", error);
      // You could add a toast notification here
      alert("Failed to fetch credentials. Please try again.");
    } finally {
      setLoadingCredentials(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  // Example mapping for CredentialsModal
  const studentCred = credentials?.find((c: Credential) => c.role === "student");
  const parentCred: Credential | undefined = (credentials as Credential[])?.find((c) => c.role === "parent");

  const credentialsData = {
    student: {
      id: studentCred?.userId?._id ?? "",
      username: studentCred?.initialUsername ?? "",
      password: studentCred?.initialPassword ?? "",
      email: studentCred?.userId?.email ?? "",
      phone: studentCred?.userId?.phone ?? "",
    },
    parent: {
      id: parentCred?.userId?._id ?? "",
      username: parentCred?.initialUsername ?? "",
      password: parentCred?.initialPassword ?? "",
      email: parentCred?.userId?.email ?? "",
      phone: parentCred?.userId?.phone ?? "",
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-blue-600">
                {student.user?.firstName?.[0]}
                {student.user?.lastName?.[0]}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {student.user?.fullName || "Unknown Student"}
              </h2>
              <p className="text-sm text-gray-500">
                Student ID: {student.studentId}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Personal Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Full Name:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.user?.fullName || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Username:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.user?.username || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Email:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.user?.email || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Phone:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.user?.phone || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Date of Birth:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(student.dob)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Age:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.age || "N/A"} years
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Blood Group:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.bloodGroup || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status:</span>
                  {getStatusBadge(student.isActive)}
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Academic Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">School:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.school?.name || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Grade:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.grade}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Section:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.section}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Roll Number:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.rollNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Admission Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(student.admissionDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Created:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(student.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Address Information */}
            {student.address && (
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Address Information
                </h3>
                <div className="space-y-3">
                  {student.address.street && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Street:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {student.address.street}
                      </span>
                    </div>
                  )}
                  {student.address.city && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">City:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {student.address.city}
                      </span>
                    </div>
                  )}
                  {student.address.state && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">State:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {student.address.state}
                      </span>
                    </div>
                  )}
                  {student.address.country && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Country:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {student.address.country}
                      </span>
                    </div>
                  )}
                  {student.address.postalCode && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">
                        Postal Code:
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {student.address.postalCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Parent Information */}
          {student.parent && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Parent/Guardian Information
              </h3>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <span className="text-sm text-gray-500">Full Name:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.parent.fullName || "N/A"}
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-sm text-gray-500">Relationship:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.parent.relationship || "N/A"}
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-sm text-gray-500">Email:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.parent.email || "N/A"}
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-sm text-gray-500">Phone:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.parent.phone || "N/A"}
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-sm text-gray-500">Address:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.parent.address || "N/A"}
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-sm text-gray-500">Occupation:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {student.parent.occupation || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Photos Section */}
          {student.photos && student.photos.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Student Photos ({student.photoCount || 0})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {student.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group overflow-hidden rounded-lg bg-white border border-gray-200"
                  >
                    <img
                      src={photo.photoPath}
                      alt={`Student photo ${photo.photoNumber}`}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (
                          e.target as HTMLImageElement
                        ).src = `https://via.placeholder.com/150x150?text=Photo+${photo.photoNumber}`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Photo {photo.photoNumber}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      #{photo.photoNumber}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Photos Message */}
          {(!student.photos || student.photos.length === 0) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Student Photos
              </h3>
              <div className="text-center py-6">
                <div className="text-gray-400 text-sm">
                  No photos uploaded for this student
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleShowCredentials}
            disabled={loadingCredentials}
            className="flex items-center space-x-2"
          >
            <Key className="h-4 w-4" />
            <span>
              {loadingCredentials ? "Loading..." : "Show Credentials"}
            </span>
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={showCredentials}
        onClose={() => setShowCredentials(false)}
        credentials={credentialsData}
        studentName={student.user?.fullName || "Unknown Student"}
        parentName={student.parent?.fullName || "Unknown Parent"}
      />
    </div>
  );
};

export default StudentDetailsModal;
