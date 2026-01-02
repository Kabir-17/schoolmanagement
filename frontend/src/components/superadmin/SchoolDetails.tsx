import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services";
import { School, SchoolDetailsProps, StatusBadge } from "../modules/school";
import SchoolBasicInfo from "../modules/school/SchoolBasicInfo";
import SchoolContactInfo from "../modules/school/SchoolContactInfo";
import SchoolAdminInfo from "../modules/school/SchoolAdminInfo";
import SchoolAcademicSession from "../modules/school/SchoolAcademicSession";
import SchoolSettings from "../modules/school/SchoolSettings";
import SchoolApiConfig from "../modules/school/SchoolApiConfig";
import SchoolStatusManagement from "../modules/school/SchoolStatusManagement";
import SchoolMetadata from "../modules/school/SchoolMetadata";

const SchoolDetails: React.FC<SchoolDetailsProps> = ({
  schoolId,
  isOpen,
  onClose,
}) => {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSchoolDetails = useCallback(async () => {
    try {
      setLoading(true);
      // Try to get detailed school info including admin credentials
      const [schoolResponse, credentialsResponse] = await Promise.allSettled([
        apiService.superadmin.getSchool(schoolId!),
        apiService.superadmin.getAdminCredentials(schoolId!),
      ]);

      let schoolData = null;
      if (
        schoolResponse.status === "fulfilled" &&
        schoolResponse.value.data.success
      ) {
        schoolData = schoolResponse.value.data.data;
      }

      // Add admin credentials if available
      if (
        credentialsResponse.status === "fulfilled" &&
        credentialsResponse.value.data.success
      ) {
        const credentials = credentialsResponse.value.data.data;
        if (schoolData && credentials) {
          schoolData.admin = {
            ...schoolData.admin,
            ...credentials,
          };
        }
      }

      if (schoolData) {
        setSchool(schoolData);
      } else {
        // Fallback demo data
        setSchool({
          id: schoolId!,
          name: "Green Valley High School",
          slug: "green-valley-high",
          schoolId: "SCH001",
          establishedYear: 1995,
          address: {
            street: "123 Main Street",
            city: "New York",
            state: "NY",
            country: "USA",
            postalCode: "10001",
          },
          contact: {
            phone: "+1-555-0123",
            email: "admin@greenvalley.edu",
            website: "https://greenvalley.edu",
          },
          status: "active",
          affiliation: "CBSE",
          recognition: "Government Recognized",
          admin: {
            id: "admin1",
            username: "greenvalley_admin",
            password: "GV@2024!Secure",
            fullName: "John Smith",
            email: "john.smith@greenvalley.edu",
            phone: "+1-555-0124",
            lastLogin: "2024-01-15T10:30:00Z",
          },
          apiKey: "gv_live_sk_1234567890abcdef",
          apiEndpoint: "https://api.sms.com/schools/green-valley-high",
          stats: {
            totalStudents: 850,
            totalTeachers: 45,
            totalParents: 650,
            totalClasses: 24,
            totalSubjects: 15,
            attendanceRate: 92.5,
            lastUpdated: "2024-01-15T15:30:00Z",
          },
          isActive: true,
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T15:30:00Z",
        });
      }
    } catch (error) {
      console.error("Failed to load school details:", error);
      toast.error("Failed to load school details");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId && isOpen) {
      loadSchoolDetails();
    }
  }, [schoolId, isOpen, loadSchoolDetails]);

  const handleResetPassword = async () => {
    if (
      !confirm(
        "Are you sure you want to reset the admin password? This will generate a new password."
      )
    ) {
      return;
    }

    try {
      await apiService.superadmin.resetAdminPassword(schoolId!);
      loadSchoolDetails(); // Reload to get the new password
      toast.success("Admin password reset successfully");
    } catch (error) {
      console.error("Failed to reset admin password:", error);
      toast.error("Failed to reset admin password");
    }
  };

  const handleRegenerateApiKey = async () => {
    try {
      await apiService.superadmin.regenerateApiKey(schoolId!);
      loadSchoolDetails(); // Reload to get the new API key
      toast.success("API key regenerated successfully");
    } catch (error) {
      console.error("Failed to regenerate API key:", error);
      toast.error("Failed to regenerate API key");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await apiService.superadmin.updateSchoolStatus(schoolId!, newStatus);
      loadSchoolDetails(); // Reload to get updated status
      toast.success("School status updated successfully");
    } catch (error) {
      console.error("Failed to update school status:", error);
      toast.error("Failed to update school status");
    }
  };

  if (!isOpen || !school) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              School Details
            </h2>
            <StatusBadge status={school.status} />
          </div>
          <div className="flex items-center gap-2">
            {/* <Button variant="outline" size="sm" onClick={() => onEdit(school)}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button> */}
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading school details...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <SchoolBasicInfo school={school} />

            {/* Address and Contact */}
            <SchoolContactInfo school={school} />

            {/* Administrator Information */}
            <SchoolAdminInfo
              school={school}
              onResetPassword={handleResetPassword}
            />

            {/* Academic Session */}
            <SchoolAcademicSession school={school} />

            {/* School Settings */}
            <SchoolSettings school={school} />

            {/* API Configuration */}
            <SchoolApiConfig
              school={school}
              onRegenerateApiKey={handleRegenerateApiKey}
            />

            {/* Status Management */}
            <SchoolStatusManagement
              school={school}
              onStatusChange={handleStatusChange}
            />

            {/* Metadata */}
            <SchoolMetadata school={school} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolDetails;
