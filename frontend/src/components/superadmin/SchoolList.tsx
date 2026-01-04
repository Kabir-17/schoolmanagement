import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Building,
  ChevronDown,
  Check,
  X,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTableFilter, FilterConfig } from "@/components/ui/DataTableFilter";
import { apiService } from "@/services";

interface School {
  id: string;
  name: string;
  slug: string;
  schoolId: string;
  establishedYear?: number;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  status: "active" | "inactive" | "suspended" | "pending_approval";
  affiliation?: string;
  stats?: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
  };
  admin?: {
    id: string;
    username: string;
    fullName: string;
    email: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface SchoolListProps {
  onCreateSchool: () => void;
  onEditSchool: (school: School) => void;
  onViewSchool: (school: School) => void;
  refreshTrigger?: number; // Add this to trigger refresh from parent
}

const SchoolList: React.FC<SchoolListProps> = ({
  onCreateSchool,
  onEditSchool,
  onViewSchool,
  refreshTrigger,
}) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: "status",
      label: "Status",
      placeholder: "All Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: "All Status", value: "all" },
        { label: "Active", value: "active" },
        { label: "Pending", value: "pending_approval" },
        { label: "Suspended", value: "suspended" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ];

  const loadSchools = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.superadmin.getSchools({
        page: currentPage,
        limit: 10,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchTerm || undefined,
      });

      if (response.data.success) {
        const responseData = response.data.data;
        // Ensure schools is always an array
        setSchools(
          Array.isArray(responseData.schools) ? responseData.schools : []
        );
        setTotalPages(responseData.totalPages || 1);
      } else {
        // Handle unsuccessful response
        setSchools([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to load schools:", error);
      // Set demo data
      setSchools([
        {
          id: "1",
          name: "Green Valley High School",
          slug: "green-valley-high",
          schoolId: "SCH001",
          establishedYear: 1995,
          address: {
            street: "123 Main St",
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
          stats: {
            totalStudents: 850,
            totalTeachers: 45,
            totalClasses: 24,
          },
          admin: {
            id: "admin1",
            username: "gv_admin",
            fullName: "John Smith",
            email: "john.smith@greenvalley.edu",
          },
          isActive: true,
          createdAt: "2024-01-15T10:00:00Z",
        },
        {
          id: "2",
          name: "Sunshine Elementary",
          slug: "sunshine-elementary",
          schoolId: "SCH002",
          establishedYear: 2001,
          address: {
            street: "456 Oak Ave",
            city: "Los Angeles",
            state: "CA",
            country: "USA",
            postalCode: "90001",
          },
          contact: {
            phone: "+1-555-0456",
            email: "admin@sunshine.edu",
          },
          status: "pending_approval",
          affiliation: "State Board",
          stats: {
            totalStudents: 320,
            totalTeachers: 18,
            totalClasses: 12,
          },
          admin: {
            id: "admin2",
            username: "sun_admin",
            fullName: "Sarah Johnson",
            email: "sarah.johnson@sunshine.edu",
          },
          isActive: true,
          createdAt: "2024-02-20T14:30:00Z",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  useEffect(() => {
    loadSchools();
  }, [loadSchools, refreshTrigger]);

  const handleStatusChange = async (schoolId: string, newStatus: string) => {
    try {
      setUpdatingStatus(schoolId);
      await apiService.superadmin.updateSchoolStatus(schoolId, newStatus);
      loadSchools();
    } catch (error) {
      console.error("Failed to update school status:", error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteSchool = async (schoolId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this school? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await apiService.superadmin.deleteSchool(schoolId);
      loadSchools();
    } catch (error) {
      console.error("Failed to delete school:", error);
    }
  };

  // Status component with dropdown for quick actions
  const StatusDropdown: React.FC<{ school: School }> = ({ school }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isUpdating = updatingStatus === school.id;

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen]);

    const getStatusConfig = (status: string) => {
      switch (status) {
        case "active":
          return {
            icon: Check,
            color: "text-green-700",
            bg: "bg-green-100",
            border: "border-green-200",
            label: "Active",
          };
        case "pending_approval":
          return {
            icon: Clock,
            color: "text-amber-700",
            bg: "bg-amber-100",
            border: "border-amber-200",
            label: "Pending",
          };
        case "suspended":
          return {
            icon: AlertTriangle,
            color: "text-red-700",
            bg: "bg-red-100",
            border: "border-red-200",
            label: "Suspended",
          };
        case "inactive":
          return {
            icon: X,
            color: "text-gray-700",
            bg: "bg-gray-100",
            border: "border-gray-200",
            label: "Inactive",
          };
        default:
          return {
            icon: Clock,
            color: "text-gray-700",
            bg: "bg-gray-100",
            border: "border-gray-200",
            label: status,
          };
      }
    };

    const statusConfig = getStatusConfig(school.status);
    const StatusIcon = statusConfig.icon;

    const statusOptions = [
      {
        value: "active",
        label: "Active",
        icon: Check,
        color: "text-green-600",
      },
      {
        value: "pending_approval",
        label: "Pending Approval",
        icon: Clock,
        color: "text-amber-600",
      },
      {
        value: "suspended",
        label: "Suspended",
        icon: AlertTriangle,
        color: "text-red-600",
      },
      { value: "inactive", label: "Inactive", icon: X, color: "text-gray-600" },
    ];

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isUpdating}
          className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
            border transition-all duration-200 hover:shadow-sm
            ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}
            ${isUpdating
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-opacity-80 cursor-pointer"
            }
          `}
        >
          {isUpdating ? (
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <StatusIcon className="w-3 h-3" />
          )}
          <span>{statusConfig.label}</span>
          <ChevronDown
            className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""
              }`}
          />
        </button>

        {isOpen && !isUpdating && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="py-1">
              {statusOptions.map((option) => {
                const OptionIcon = option.icon;
                const isCurrentStatus = option.value === school.status;

                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (!isCurrentStatus) {
                        handleStatusChange(school.id, option.value);
                      }
                      setIsOpen(false);
                    }}
                    disabled={isCurrentStatus}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 text-sm text-left
                      transition-colors
                      ${isCurrentStatus
                        ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                        : "hover:bg-gray-50 text-gray-700 cursor-pointer"
                      }
                    `}
                  >
                    <OptionIcon
                      className={`w-4 h-4 ${isCurrentStatus ? "text-gray-400" : option.color
                        }`}
                    />
                    <span>{option.label}</span>
                    {isCurrentStatus && (
                      <span className="ml-auto text-xs text-gray-400">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            EDUNETGN
          </h1>
          <p className="text-gray-600">Manage all schools in the system</p>
        </div>
        <Button onClick={onCreateSchool} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New School
        </Button>
      </div>

      {/* Filters */}
      <DataTableFilter
        searchPlaceholder="Search schools..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterConfigs}
      />
      {/* Schools Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading schools...</p>
        </div>
      ) : schools.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No schools found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== "all"
                ? "No schools match your search criteria."
                : "Get started by creating your first school."}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button
                onClick={onCreateSchool}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add New School
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2 px-3 font-medium text-gray-900 text-sm">
                    School Name
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-900 text-sm">
                    School ID
                  </th>
                  <th className="text-center py-2 px-3 font-medium text-gray-900 text-sm">
                    Status
                  </th>
                  <th className="text-center py-2 px-3 font-medium text-gray-900 text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school) => (
                  <tr
                    key={school.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-2 px-3">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">
                          {school.name}
                        </h3>
                        {school.affiliation && (
                          <p className="text-xs text-blue-600">
                            {school.affiliation}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-sm text-gray-600">
                        {school.schoolId}
                      </span>
                      {school.establishedYear && (
                        <p className="text-xs text-gray-400">
                          Est. {school.establishedYear}
                        </p>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex justify-center">
                        <StatusDropdown school={school} />
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewSchool(school)}
                          className="h-7 w-7 p-0"
                          title="View Details & Admin Credentials"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditSchool(school)}
                          className="h-7 w-7 p-0"
                          title="Edit School"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSchool(school.id)}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete School"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default SchoolList;
