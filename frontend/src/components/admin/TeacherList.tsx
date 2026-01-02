import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Eye, UserCheck, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTableFilter, FilterConfig } from "@/components/ui/DataTableFilter";
import { apiService } from "@/services";

interface Teacher {
  id: string;
  userId: string;
  schoolId: string;
  teacherId: string;
  employeeId?: string;
  subjects: string[];
  grades: number[];
  sections: string[];
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
    previousSchools?: {
      schoolName: string;
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
  isClassTeacher: boolean;
  classTeacherFor?: {
    grade: number;
    section: string;
  };
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
  photos?: any[];
  photoCount: number;
  // Legacy fields for backward compatibility
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfJoining?: string;
  department?: string;
}

interface TeacherListProps {
  onCreateTeacher: () => void;
  onEditTeacher: (teacher: Teacher) => void;
  onViewTeacher: (teacher: Teacher) => void;
  onTeacherCreated?: (teacher: Teacher) => void;
  onTeacherUpdated?: (teacher: Teacher) => void;
  onTeacherDeleted?: (teacherId: string) => void;
}

export interface TeacherListRef {
  addTeacherOptimistically: (teacher: Teacher) => void;
  updateTeacherOptimistically: (teacher: Teacher) => void;
}

const TeacherList = React.forwardRef<TeacherListRef, TeacherListProps>(
  (
    {
      onCreateTeacher,
      onEditTeacher,
      onViewTeacher,
      onTeacherCreated,
      onTeacherUpdated,
      onTeacherDeleted,
    },
    ref
  ) => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");
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
          { label: "Mathematics", value: "Mathematics" },
          { label: "Science", value: "Science" },
          { label: "English", value: "English" },
          { label: "Social Studies", value: "Social Studies" },
          { label: "Languages", value: "Languages" },
          { label: "Arts", value: "Arts" },
          { label: "Physical Education", value: "Physical Education" },
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

    // Expose methods to parent component
    React.useImperativeHandle(ref, () => ({
      addTeacherOptimistically: (teacher: Teacher) => {
        setTeachers((prev) => [teacher, ...prev]);
        onTeacherCreated?.(teacher);
      },
      updateTeacherOptimistically: (teacher: Teacher) => {
        setTeachers((prev) =>
          prev.map((t) => (t.id === teacher.id ? teacher : t))
        );
        onTeacherUpdated?.(teacher);
      },
    }));

    const loadTeachers = useCallback(async () => {
      try {
        setLoading(true);
        const response = await apiService.admin.getTeachers({
          page: currentPage,
          limit: 10,
          // department: departmentFilter !== 'all' ? departmentFilter : undefined,
          // status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchTerm || undefined,
        });

        if (response.data.success) {
          const responseData = response.data.data;
          const teachersArray = Array.isArray(responseData.teachers) ? responseData.teachers : Array.isArray(responseData) ? responseData : [];
          
          setTeachers(teachersArray);
          setTotalPages(responseData.totalPages || 1);
        } else {
          setTeachers([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Failed to load teachers:", error);
        // Set demo data for testing when API is not available
        const demoTeachers: Teacher[] = [
          {
            id: "demo-1",
            userId: "user-1",
            schoolId: "school-1",
            teacherId: "TCH001",
            employeeId: "EMP001",
            subjects: ["Mathematics", "Physics"],
            grades: [9, 10],
            sections: ["A", "B"],
            designation: "Senior Teacher",
            bloodGroup: "A+",
            dob: "1985-06-15",
            joinDate: "2020-01-15",
            qualifications: [{
              degree: "M.Sc Mathematics",
              institution: "State University",
              year: 2008,
              specialization: "Applied Mathematics"
            }],
            experience: {
              totalYears: 12,
              previousSchools: []
            },
            address: {
              street: "123 Teacher Lane",
              city: "Springfield",
              state: "IL",
              zipCode: "62701",
              country: "USA"
            },
            emergencyContact: {
              name: "Jane Doe",
              relationship: "Spouse",
              phone: "+1234567899",
              email: "jane.doe@email.com"
            },
            salary: {
              basic: 50000,
              allowances: 5000,
              deductions: 2000,
              netSalary: 53000
            },
            isClassTeacher: true,
            classTeacherFor: {
              grade: 10,
              section: "A"
            },
            isActive: true,
            age: 39,
            totalExperience: 12,
            createdAt: "2020-01-15T10:00:00Z",
            updatedAt: "2024-01-15T10:00:00Z",
            user: {
              id: "user-1",
              username: "john.doe",
              firstName: "John",
              lastName: "Doe",
              fullName: "John Doe",
              email: "john.doe@school.com",
              phone: "+1234567890"
            },
            school: {
              id: "school-1",
              name: "Demo High School"
            },
            photos: [],
            photoCount: 0
          },
          {
            id: "demo-2",
            userId: "user-2",
            schoolId: "school-1",
            teacherId: "TCH002",
            employeeId: "EMP002",
            subjects: ["English", "Literature"],
            grades: [11, 12],
            sections: ["A"],
            designation: "Head of Department",
            bloodGroup: "B+",
            dob: "1982-03-22",
            joinDate: "2018-08-01",
            qualifications: [{
              degree: "M.A English",
              institution: "University College",
              year: 2005,
              specialization: "Modern Literature"
            }],
            experience: {
              totalYears: 15,
              previousSchools: [{
                schoolName: "City High School",
                position: "English Teacher",
                duration: "3 years",
                fromDate: "2015-06-01",
                toDate: "2018-07-31"
              }]
            },
            address: {
              street: "456 Education Ave",
              city: "Springfield",
              state: "IL",
              zipCode: "62702",
              country: "USA"
            },
            emergencyContact: {
              name: "Robert Smith",
              relationship: "Brother",
              phone: "+1234567898",
              email: "robert.smith@email.com"
            },
            isClassTeacher: false,
            isActive: true,
            age: 42,
            totalExperience: 15,
            createdAt: "2018-08-01T10:00:00Z",
            updatedAt: "2024-01-15T10:00:00Z",
            user: {
              id: "user-2",
              username: "jane.smith",
              firstName: "Jane",
              lastName: "Smith",
              fullName: "Jane Smith",
              email: "jane.smith@school.com",
              phone: "+1234567891"
            },
            school: {
              id: "school-1",
              name: "Demo High School"
            },
            photos: [],
            photoCount: 0
          },
          {
            id: "demo-3",
            userId: "user-3",
            schoolId: "school-1",
            teacherId: "TCH003",
            employeeId: "EMP003",
            subjects: ["Chemistry", "Biology"],
            grades: [9, 10, 11],
            sections: ["A", "B", "C"],
            designation: "Teacher",
            bloodGroup: "O+",
            dob: "1990-12-10",
            joinDate: "2021-06-01",
            qualifications: [{
              degree: "M.Sc Chemistry",
              institution: "Tech Institute",
              year: 2013,
              specialization: "Organic Chemistry"
            }],
            experience: {
              totalYears: 6,
              previousSchools: []
            },
            address: {
              street: "789 Science St",
              city: "Springfield",
              state: "IL",
              zipCode: "62703",
              country: "USA"
            },
            emergencyContact: {
              name: "Mary Johnson",
              relationship: "Mother",
              phone: "+1234567897"
            },
            isClassTeacher: false,
            isActive: false,
            age: 33,
            totalExperience: 6,
            createdAt: "2021-06-01T10:00:00Z",
            updatedAt: "2024-01-15T10:00:00Z",
            user: {
              id: "user-3",
              username: "mike.johnson",
              firstName: "Mike",
              lastName: "Johnson",
              fullName: "Mike Johnson",
              email: "mike.johnson@school.com",
              phone: "+1234567892"
            },
            school: {
              id: "school-1",
              name: "Demo High School"
            },
            photos: [],
            photoCount: 0
          }
        ];
        setTeachers(demoTeachers);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }, [currentPage, searchTerm]);

    useEffect(() => {
      loadTeachers();
    }, [loadTeachers]);

    const handleDeleteTeacher = async (teacherId: string) => {
      if (
        !confirm(
          "Are you sure you want to delete this teacher? This action cannot be undone."
        )
      ) {
        return;
      }

      try {
        // Optimistic update - immediately remove from UI
        setTeachers((prev) =>
          prev.filter((teacher) => teacher.id !== teacherId)
        );
        onTeacherDeleted?.(teacherId);

        await apiService.admin.deleteTeacher(teacherId);
      } catch (error) {
        console.error("Failed to delete teacher:", error);
        // Rollback on error - reload to restore original state
        loadTeachers();
      }
    };

    const handleStatusChange = async (
      teacherId: string,
      newStatus: boolean
    ) => {
      try {
        // Optimistic update - immediately update status in UI
        setTeachers((prev) =>
          prev.map((teacher) =>
            teacher.id === teacherId
              ? { ...teacher, isActive: newStatus }
              : teacher
          )
        );

        // Call API to update status (assuming there's an endpoint for this)
        // await apiService.admin.updateTeacherStatus(teacherId, newStatus);
      } catch (error) {
        console.error("Failed to update teacher status:", error);
        // Rollback on error - reload to restore original state
        loadTeachers();
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

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Teacher Management
            </h1>
            <p className="text-gray-600">Manage all teachers in your school</p>
          </div>
          <Button onClick={onCreateTeacher} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Teacher
          </Button>
        </div>

        {/* Filters */}
        <DataTableFilter
          searchPlaceholder="Search teachers..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filterConfigs}
        />

        {/* Quick Stats */}
        {teachers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-600 text-2xl font-bold">{teachers.length}</div>
              <div className="text-blue-800 text-sm font-medium">Total Teachers</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-600 text-2xl font-bold">
                {teachers.filter(t => t.isActive !== false).length}
              </div>
              <div className="text-green-800 text-sm font-medium">Active Teachers</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-purple-600 text-2xl font-bold">
                {teachers.filter(t => t.isClassTeacher).length}
              </div>
              <div className="text-purple-800 text-sm font-medium">Class Teachers</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="text-orange-600 text-2xl font-bold">
                {[...new Set(teachers.flatMap(t => t.subjects || []))].length}
              </div>
              <div className="text-orange-800 text-sm font-medium">Subjects Covered</div>
            </div>
          </div>
        )}

        {/* Teachers List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading teachers...</p>
          </div>
        ) : teachers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 pt-4">
              <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No teachers found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ||
                departmentFilter !== "all" ||
                statusFilter !== "all"
                  ? "No teachers match your search criteria."
                  : "Get started by adding your first teacher."}
              </p>
              {!searchTerm &&
                departmentFilter === "all" &&
                statusFilter === "all" && (
                  <Button onClick={onCreateTeacher}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Teacher
                  </Button>
                )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {teachers.map((teacher) => (
              <Card key={teacher.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between pt-4 md:pt-6 xl:pt-8">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                          <span className="text-xl font-bold text-white">
                            {(teacher.user?.firstName || teacher.firstName)?.[0] || 'T'}
                            {(teacher.user?.lastName || teacher.lastName)?.[0] || 'R'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {teacher.user?.fullName || `${teacher.user?.firstName || teacher.firstName || 'Unknown'} ${teacher.user?.lastName || teacher.lastName || 'Teacher'}`}
                          </h3>
                          {getStatusBadge(teacher.isActive ?? false)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Employee ID:</span>
                              <span className="text-gray-600">{teacher.employeeId || teacher.teacherId || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Designation:</span>
                              <span className="text-gray-600">{teacher.designation || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Department:</span>
                              <span className="text-gray-600">{teacher.department || 'General'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Joined:</span>
                              <span className="text-gray-600">
                                {(teacher.joinDate || teacher.dateOfJoining) ? new Date(teacher.joinDate || teacher.dateOfJoining!).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Email:</span>
                              <span className="text-gray-600 truncate">{teacher.user?.email || teacher.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Phone:</span>
                              <span className="text-gray-600">{teacher.user?.phone || teacher.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Blood Group:</span>
                              <span className="text-gray-600">{teacher.bloodGroup || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Class Teacher:</span>
                              <span className="text-gray-600">
                                {teacher.isClassTeacher ? 
                                  `${teacher.classTeacherFor?.grade || 'N/A'}-${teacher.classTeacherFor?.section || 'N/A'}` : 
                                  'No'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Subjects */}
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-700">Subjects:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(teacher.subjects || []).length > 0 ? (
                              teacher.subjects.map((subject, index) => (
                                <span
                                  key={index}
                                  className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium"
                                >
                                  {subject}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 text-sm">No subjects assigned</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Grades */}
                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-700">Teaching Grades:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(teacher.grades || []).length > 0 ? (
                              teacher.grades.map((grade, index) => (
                                <span
                                  key={index}
                                  className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium"
                                >
                                  Grade {grade}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 text-sm">No grades assigned</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-gray-100 sm:pl-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewTeacher(teacher)}
                        className="flex-1 sm:flex-none bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300 hover:scale-105 transition-all duration-200 justify-center"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        <span className="sm:hidden">View</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditTeacher(teacher)}
                        className="flex-1 sm:flex-none bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300 hover:scale-105 transition-all duration-200 justify-center"
                        title="Edit Teacher"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        <span className="sm:hidden">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(teacher.id, !(teacher.isActive ?? false))
                        }
                        className={`flex-1 sm:flex-none justify-center hover:scale-105 transition-all duration-200 ${
                          teacher.isActive ?? false
                            ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300"
                            : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300"
                        }`}
                        title={
                          (teacher.isActive ?? false)
                            ? "Deactivate Teacher"
                            : "Activate Teacher"
                        }
                      >
                        {(teacher.isActive ?? false) ? (
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
                        onClick={() => handleDeleteTeacher(teacher.id)}
                        className="p-2 text-red-600 hover:text-red-700"
                        title="Delete Teacher"
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
  }
);

TeacherList.displayName = "TeacherList";

export default TeacherList;
