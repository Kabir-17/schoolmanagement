import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Eye, UserCheck, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTableFilter, FilterConfig } from "@/components/ui/DataTableFilter";
import { adminApi } from "@/services/admin.api";

export interface Accountant {
  id: string;
  userId: string;
  schoolId: string;
  accountantId: string;
  employeeId?: string;
  department: string;
  designation: string;
  bloodGroup: string;
  dob: string;
  joinDate: string;
  qualifications: {
    degree: string;
    institution: string;
    year: number;
    specialization?: string;
  }[];
  experience: {
    totalYears: number;
    previousOrganizations?: {
      organizationName: string;
      position: string;
      duration: string;
      fromDate: string;
      toDate: string;
    }[];
  };
  address: {
    street?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  salary?: {
    basic: number;
    allowances?: number;
    deductions?: number;
    netSalary: number;
  };
  responsibilities: string[];
  certifications?: string[];
  isActive: boolean;
  age: number;
  totalExperience: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email?: string;
    phone?: string;
  };
  school?: {
    id: string;
    name: string;
  };
  photoCount: number;
}

interface AccountantListProps {
  onCreateAccountant: () => void;
  onEditAccountant: (accountant: Accountant) => void;
  onViewAccountant: (accountant: Accountant) => void;
}

export const AccountantList: React.FC<AccountantListProps> = ({
  onCreateAccountant,
  onEditAccountant,
  onViewAccountant,
}) => {
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [designationFilter, setDesignationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: "department",
      label: "Department",
      placeholder: "All Departments",
      value: departmentFilter,
      onChange: setDepartmentFilter,
      options: [
        { label: "All Departments", value: "all" },
        { label: "Finance", value: "Finance" },
        { label: "Payroll", value: "Payroll" },
        { label: "Accounts Payable", value: "Accounts Payable" },
        { label: "Accounts Receivable", value: "Accounts Receivable" },
        { label: "Budget Management", value: "Budget Management" },
        { label: "Financial Reporting", value: "Financial Reporting" },
        { label: "Audit", value: "Audit" },
        { label: "Tax", value: "Tax" },
        { label: "General Accounting", value: "General Accounting" },
      ],
    },
    {
      key: "designation",
      label: "Designation",
      placeholder: "All Designations",
      value: designationFilter,
      onChange: setDesignationFilter,
      options: [
        { label: "All Designations", value: "all" },
        { label: "Chief Financial Officer", value: "Chief Financial Officer" },
        { label: "Finance Manager", value: "Finance Manager" },
        { label: "Chief Accountant", value: "Chief Accountant" },
        { label: "Senior Accountant", value: "Senior Accountant" },
        { label: "Accountant", value: "Accountant" },
        { label: "Junior Accountant", value: "Junior Accountant" },
        { label: "Accounts Assistant", value: "Accounts Assistant" },
        { label: "Payroll Officer", value: "Payroll Officer" },
        { label: "Financial Analyst", value: "Financial Analyst" },
        { label: "Auditor", value: "Auditor" },
      ],
    },
    {
      key: "status",
      label: "Status",
      placeholder: "All Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: "All Status", value: "all" },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ];

  const fetchAccountants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getAccountants({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        designation: designationFilter !== 'all' ? designationFilter : undefined,
        isActive: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
      });
      
      if (response.data.success) {
        const responseData = response.data.data;
        const accountantsArray = Array.isArray(responseData.accountants) ? responseData.accountants : Array.isArray(responseData) ? responseData : [];
        
        setAccountants(accountantsArray);
        setTotalPages(responseData.totalPages || 1);
      } else {
        setError("Failed to fetch accountants");
      }
    } catch (err: any) {
      console.error("Error fetching accountants:", err);
      setError(err.response?.data?.message || "Failed to fetch accountants");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, departmentFilter, designationFilter, statusFilter]);

  useEffect(() => {
    fetchAccountants();
  }, [fetchAccountants]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this accountant? This action cannot be undone.")) {
      return;
    }

    try {
      // Optimistic update - immediately remove from UI
      setAccountants((prev) => prev.filter((accountant) => accountant.id !== id));
      
      const response = await adminApi.deleteAccountant(id);
      if (!response.data.success) {
        // Rollback on error - reload to restore original state
        fetchAccountants();
      }
    } catch (err: any) {
      console.error("Error deleting accountant:", err);
      alert(err.response?.data?.message || "Failed to delete accountant");
      // Rollback on error - reload to restore original state
      fetchAccountants();
    }
  };

  const handleStatusChange = async (accountantId: string, newStatus: boolean) => {
    try {
      // Optimistic update - immediately update status in UI
      setAccountants((prev) =>
        prev.map((accountant) =>
          accountant.id === accountantId
            ? { ...accountant, isActive: newStatus }
            : accountant
        )
      );

      // Call API to update status (assuming there's an endpoint for this)
      // await adminApi.updateAccountantStatus(accountantId, newStatus);
    } catch (error) {
      console.error("Failed to update accountant status:", error);
      // Rollback on error - reload to restore original state
      fetchAccountants();
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {isActive ? (
          <>
            <UserCheck className="w-3 h-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <UserX className="w-3 h-3 mr-1" />
            Inactive
          </>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading accountants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <Button onClick={fetchAccountants} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Accountant Management
          </h1>
          <p className="text-gray-600">Manage all accountants in your school</p>
        </div>
        <Button onClick={onCreateAccountant} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Accountant
        </Button>
      </div>

      {/* Filters */}
      <DataTableFilter
        searchPlaceholder="Search accountants..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterConfigs}
      />

      {/* Quick Stats */}
      {accountants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="text-indigo-600 text-2xl font-bold">{accountants.length}</div>
            <div className="text-indigo-800 text-sm font-medium">Total Accountants</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-600 text-2xl font-bold">
              {accountants.filter(a => a.isActive !== false).length}
            </div>
            <div className="text-green-800 text-sm font-medium">Active Accountants</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-purple-600 text-2xl font-bold">
              {[...new Set(accountants.map(a => a.department))].length}
            </div>
            <div className="text-purple-800 text-sm font-medium">Departments</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-orange-600 text-2xl font-bold">
              {Math.round(accountants.reduce((sum, a) => sum + a.totalExperience, 0) / accountants.length)}
            </div>
            <div className="text-orange-800 text-sm font-medium">Avg. Experience (Years)</div>
          </div>
        </div>
      )}

      {/* Accountants List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading accountants...</p>
        </div>
      ) : accountants.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 pt-4">
            <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No accountants found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ||
              departmentFilter !== "all" ||
              designationFilter !== "all" ||
              statusFilter !== "all"
                ? "No accountants match your search criteria."
                : "Get started by adding your first accountant."}
            </p>
            {!searchTerm &&
              departmentFilter === "all" &&
              designationFilter === "all" &&
              statusFilter === "all" && (
                <Button onClick={onCreateAccountant}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Accountant
                </Button>
              )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {accountants.map((accountant) => (
            <Card key={accountant.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between pt-4 md:pt-6 xl:pt-8">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <span className="text-xl font-bold text-white">
                          {accountant.user?.firstName?.[0] || 'A'}
                          {accountant.user?.lastName?.[0] || 'C'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {accountant.user?.fullName || 'Unknown Accountant'}
                        </h3>
                        {getStatusBadge(accountant.isActive ?? false)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Employee ID:</span>
                            <span className="text-gray-600">{accountant.employeeId || accountant.accountantId || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Designation:</span>
                            <span className="text-gray-600">{accountant.designation || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Department:</span>
                            <span className="text-gray-600">{accountant.department || 'General'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Joined:</span>
                            <span className="text-gray-600">
                              {accountant.joinDate ? new Date(accountant.joinDate).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Email:</span>
                            <span className="text-gray-600 truncate">{accountant.user?.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Phone:</span>
                            <span className="text-gray-600">{accountant.user?.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Blood Group:</span>
                            <span className="text-gray-600">{accountant.bloodGroup || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Experience:</span>
                            <span className="text-gray-600">{accountant.totalExperience} years</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Responsibilities */}
                      {accountant.responsibilities && accountant.responsibilities.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-700">Responsibilities:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {accountant.responsibilities.slice(0, 5).map((responsibility, index) => (
                              <span
                                key={index}
                                className="bg-indigo-100 text-indigo-800 text-xs px-3 py-1 rounded-full font-medium"
                              >
                                {responsibility}
                              </span>
                            ))}
                            {accountant.responsibilities.length > 5 && (
                              <span className="text-gray-500 text-xs px-3 py-1">
                                +{accountant.responsibilities.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Certifications */}
                      {accountant.certifications && accountant.certifications.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-700">Certifications:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {accountant.certifications.slice(0, 3).map((cert, index) => (
                              <span
                                key={index}
                                className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium"
                              >
                                {cert}
                              </span>
                            ))}
                            {accountant.certifications.length > 3 && (
                              <span className="text-gray-500 text-xs px-2 py-1">
                                +{accountant.certifications.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-gray-100 sm:pl-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewAccountant(accountant)}
                      className="flex-1 sm:flex-none bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 hover:border-indigo-300 hover:scale-105 transition-all duration-200 justify-center"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      <span className="sm:hidden">View</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditAccountant(accountant)}
                      className="flex-1 sm:flex-none bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300 hover:scale-105 transition-all duration-200 justify-center"
                      title="Edit Accountant"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      <span className="sm:hidden">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleStatusChange(accountant.id, !(accountant.isActive ?? false))
                      }
                      className={`flex-1 sm:flex-none justify-center hover:scale-105 transition-all duration-200 ${
                        accountant.isActive ?? false
                          ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300"
                          : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300"
                      }`}
                      title={
                        (accountant.isActive ?? false)
                          ? "Deactivate Accountant"
                          : "Activate Accountant"
                      }
                    >
                      {(accountant.isActive ?? false) ? (
                        <>
                          <UserX className="w-4 h-4 mr-2" />
                          <span className="sm:hidden">Deactivate</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          <span className="sm:hidden">Activate</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(accountant.id)}
                      className="p-2 text-red-600 hover:text-red-700"
                      title="Delete Accountant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing page <span className="font-medium">{currentPage}</span>{" "}
              of <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantList;
