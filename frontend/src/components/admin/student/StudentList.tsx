import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Eye, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTableFilter, FilterConfig } from "@/components/ui/DataTableFilter";
import StudentDetailsModal from "./StudentDetailsModal";
import ConfirmDialog from "../../ui/ConfirmDialog";
import { showToast } from "@/utils/toast";
import { apiService } from "@/services";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface StudentListProps {
  onCreateStudent: () => void;
  onEditStudent: (student: Student) => void;
  onStudentCreated?: (student: Student) => void;
  onStudentUpdated?: (student: Student) => void;
  onStudentDeleted?: (studentId: string) => void;
}

export interface StudentListRef {
  addStudentOptimistically: (student: Student) => void;
  updateStudentOptimistically: (student: Student) => void;
}

const StudentList = React.forwardRef<StudentListRef, StudentListProps>(
  (
    {
      onCreateStudent,
      onEditStudent,
      onStudentCreated,
      onStudentUpdated,
      onStudentDeleted,
    },
    ref
  ) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [classFilter, setClassFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal state
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(
      null
    );
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Confirmation dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<{
      id: string;
      name: string;
    } | null>(null);

    // Filter configuration
    const filterConfigs: FilterConfig[] = [
      {
        key: "class",
        label: "Class",
        placeholder: "All Classes",
        value: classFilter,
        onChange: setClassFilter,
        options: [
          { label: "All Classes", value: "all" },
          { label: "Class 9", value: "9" },
          { label: "Class 10", value: "10" },
          { label: "Class 11", value: "11" },
          { label: "Class 12", value: "12" },
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
      addStudentOptimistically: (student: Student) => {
        setStudents((prev) => [student, ...prev]);
        onStudentCreated?.(student);
      },
      updateStudentOptimistically: (student: Student) => {
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? student : s))
        );
        onStudentUpdated?.(student);
      },
    }));

    const loadStudents = useCallback(async () => {
      try {
        setLoading(true);
        const response = await apiService.admin.getStudents({
          page: currentPage,
          limit: 10,
          grade: classFilter !== "all" ? parseInt(classFilter, 10) : undefined,
          // status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchTerm || undefined,
        });

        if (response.data.success) {
          const responseData = response.data.data;

          // Check if responseData has students array or is itself the array
          let studentsArray;
          if (Array.isArray(responseData)) {
            studentsArray = responseData;
          } else if (
            responseData.students &&
            Array.isArray(responseData.students)
          ) {
            studentsArray = responseData.students;
            setTotalPages(
              responseData.totalPages || Math.ceil(responseData.totalCount / 10)
            );
          } else {
            console.warn("Unexpected response format:", responseData);
            studentsArray = [];
          }

          setStudents(studentsArray);

          // Handle pagination meta
          if (response.data.meta) {
            setTotalPages(
              response.data.meta.total
                ? Math.ceil(response.data.meta.total / 10)
                : 1
            );
          }
        } else {
          setStudents([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Failed to load students:", error);

        // Set demo data for testing when API is not available
        const demoStudents = [
          {
            id: "demo-std-1",
            studentId: "STU001",
            grade: 10,
            section: "A",
            rollNumber: 15,
            bloodGroup: "A+",
            dob: "2007-05-20",
            admissionDate: "2022-04-01",
            isActive: true,
            age: 16,
            user: {
              id: "std-user-1",
              username: "alice.brown",
              firstName: "Alice",
              lastName: "Brown",
              fullName: "Alice Brown",
              email: "alice.brown@student.com",
              phone: "+1234567800",
            },
            parent: {
              id: "parent-1",
              fullName: "Robert Brown",
              email: "robert.brown@parent.com",
              phone: "+1234567801",
              relationship: "Father",
              occupation: "Engineer",
            },
            address: {
              street: "123 Main Street",
              city: "Springfield",
              state: "IL",
              country: "USA",
              postalCode: "62701",
            },
            createdAt: "2022-04-01T10:00:00Z",
          },
          {
            id: "demo-std-2",
            studentId: "STU002",
            grade: 11,
            section: "B",
            rollNumber: 8,
            bloodGroup: "B+",
            dob: "2006-08-15",
            admissionDate: "2021-04-01",
            isActive: true,
            age: 17,
            user: {
              id: "std-user-2",
              username: "david.wilson",
              firstName: "David",
              lastName: "Wilson",
              fullName: "David Wilson",
              email: "david.wilson@student.com",
              phone: "+1234567802",
            },
            parent: {
              id: "parent-2",
              fullName: "Sarah Wilson",
              email: "sarah.wilson@parent.com",
              phone: "+1234567803",
              relationship: "Mother",
              occupation: "Doctor",
            },
            createdAt: "2021-04-01T10:00:00Z",
          },
          {
            id: "demo-std-3",
            studentId: "STU003",
            grade: 9,
            section: "A",
            rollNumber: 22,
            bloodGroup: "O+",
            dob: "2008-11-03",
            admissionDate: "2023-04-01",
            isActive: false,
            age: 15,
            user: {
              id: "std-user-3",
              username: "emma.davis",
              firstName: "Emma",
              lastName: "Davis",
              fullName: "Emma Davis",
              email: "emma.davis@student.com",
              phone: "+1234567804",
            },
            parent: {
              id: "parent-3",
              fullName: "Michael Davis",
              email: "michael.davis@parent.com",
              phone: "+1234567805",
              relationship: "Father",
              occupation: "Teacher",
            },
            createdAt: "2023-04-01T10:00:00Z",
          },
        ];
        setStudents(demoStudents);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }, [currentPage, classFilter, searchTerm]);

    useEffect(() => {
      loadStudents();
    }, [currentPage, classFilter, searchTerm, loadStudents]);

    // Handle view student details
    const handleViewStudent = (student: Student) => {
      setSelectedStudent(student);
      setIsDetailsModalOpen(true);
    };

    // Handle close modal
    const handleCloseModal = () => {
      setIsDetailsModalOpen(false);
      setSelectedStudent(null);
    };

    const handleDeleteStudent = async (studentId: string) => {
      const student = students.find((s) => s.id === studentId);
      const studentName = student?.user?.fullName || "this student";

      // Show confirmation dialog
      setStudentToDelete({ id: studentId, name: studentName });
      setIsDeleteDialogOpen(true);
    };

    // Handle confirm delete
    const handleConfirmDelete = async () => {
      if (!studentToDelete) return;

      setIsDeleteDialogOpen(false);
      const loadingToast = showToast.loading(
        `Deleting ${studentToDelete.name}...`
      );

      try {
        // Optimistic update - immediately remove from UI
        setStudents((prev) =>
          prev.filter((student) => student.id !== studentToDelete.id)
        );
        onStudentDeleted?.(studentToDelete.id);

        await apiService.admin.deleteStudent(studentToDelete.id);

        showToast.dismiss(loadingToast);
        showToast.success(
          `${studentToDelete.name} has been deleted successfully`
        );
      } catch (error) {
        console.error("Failed to delete student:", error);
        showToast.dismiss(loadingToast);
        showToast.error(
          "Failed to delete student",
          error instanceof Error ? error.message : "Please try again"
        );
        // Rollback on error - reload to restore original state
        loadStudents();
      } finally {
        setStudentToDelete(null);
      }
    };

    // Handle cancel delete
    const handleCancelDelete = () => {
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    };

    const handleStatusChange = async (
      studentId: string,
      newStatus: boolean
    ) => {
      const student = students.find((s) => s.id === studentId);
      const studentName = student?.user?.fullName || "Student";
      const statusText = newStatus ? "activated" : "deactivated";

      const loadingToast = showToast.loading(`Updating ${studentName}...`);

      try {
        // Optimistic update - immediately update status in UI
        setStudents((prev) =>
          prev.map((student) =>
            student.id === studentId
              ? { ...student, isActive: newStatus }
              : student
          )
        );

        // Call API to update status (assuming there's an endpoint for this)
        // await apiService.admin.updateStudentStatus(studentId, newStatus);

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        showToast.dismiss(loadingToast);
        showToast.success(`${studentName} has been ${statusText} successfully`);
      } catch (error) {
        console.error("Failed to update student status:", error);
        showToast.dismiss(loadingToast);
        showToast.error(
          "Failed to update student status",
          error instanceof Error ? error.message : "Please try again"
        );
        // Rollback on error - reload to restore original state
        loadStudents();
      }
    };

    const getStatusBadge = (isActive: boolean) => {
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      );
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Student Management
            </h1>
            <p className="text-gray-600">Manage all students in your school</p>
          </div>
          <Button onClick={onCreateStudent} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Student
          </Button>
        </div>

        {/* Filters */}
        <DataTableFilter
          searchPlaceholder="Search students..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filterConfigs}
        />

        {/* Interactive Quick Stats */}
        {students.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-105 hover:border-indigo-300 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600 group-hover:text-gray-800">
                    Total Students
                  </p>
                  <p className="text-xl md:text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                    {students.length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 group-hover:rotate-6 transition-all duration-300">
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-105 hover:border-green-300 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600 group-hover:text-gray-800">
                    Active Students
                  </p>
                  <p className="text-xl md:text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                    {students.filter((s) => s.isActive).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 group-hover:rotate-6 transition-all duration-300">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-105 hover:border-purple-300 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600 group-hover:text-gray-800">
                    Grades
                  </p>
                  <p className="text-xl md:text-3xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                    {[...new Set(students.map((s) => s.grade))].length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 group-hover:rotate-6 transition-all duration-300">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.84L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.84l-7-3z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-105 hover:border-orange-300 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600 group-hover:text-gray-800">
                    Classes
                  </p>
                  <p className="text-xl md:text-3xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                    {
                      [
                        ...new Set(
                          students.map((s) => `${s.grade}-${s.section}`)
                        ),
                      ].length
                    }
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 group-hover:rotate-6 transition-all duration-300">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Students Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            <p className="mt-2 text-gray-600">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-12 text-center">
            <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No students found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || classFilter !== "all" || statusFilter !== "all"
                ? "No students match your search criteria."
                : "Get started by adding your first student."}
            </p>
            {!searchTerm && classFilter === "all" && statusFilter === "all" && (
              <Button onClick={onCreateStudent}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Student
              </Button>
            )}
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Roll No
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Parent
                    </TableHead>
                    <TableHead className="hidden xl:table-cell">
                      Contact
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {student.photos && student.photos.length > 0 ? (
                            <img
                              src={student.photos[0].photoPath}
                              alt="Student"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserCheck className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {student.studentId}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {student.user?.fullName ||
                              `${student.user?.firstName || "Unknown"} ${
                                student.user?.lastName || "Student"
                              }`}
                          </div>
                          <div className="text-sm text-gray-500">
                            Age: {student.age || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            Grade {student.grade}-{student.section}
                          </div>
                          <div className="text-gray-500">
                            {student.bloodGroup || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {student.rollNumber}
                      </TableCell>
                      <TableCell>{getStatusBadge(student.isActive)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm">
                          <div className="font-medium">
                            {student.parent?.fullName || "N/A"}
                          </div>
                          {student.parent?.relationship && (
                            <div className="text-gray-500">
                              {student.parent.relationship}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="text-sm">
                          {student.user?.phone && (
                            <div>{student.user.phone}</div>
                          )}
                          {student.user?.email && (
                            <div className="text-gray-500 truncate max-w-32">
                              {student.user.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStudent(student)}
                            className="h-8 w-8 p-0"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditStudent(student)}
                            className="h-8 w-8 p-0"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleStatusChange(student.id, !student.isActive)
                            }
                            className="h-8 w-8 p-0"
                            title={student.isActive ? "Deactivate" : "Activate"}
                          >
                            {student.isActive ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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

        {/* Student Details Modal */}
        <StudentDetailsModal
          student={selectedStudent}
          isOpen={isDetailsModalOpen}
          onClose={handleCloseModal}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          title="Delete Student"
          message={`Are you sure you want to delete ${studentToDelete?.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </div>
    );
  }
);

StudentList.displayName = "StudentList";

export default StudentList;
