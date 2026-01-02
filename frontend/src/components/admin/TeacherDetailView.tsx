import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  BookOpen,
  Heart,
  Shield,
  DollarSign,
  Clock,
  Building,
  UserCheck,
  UserX,
  Edit,
  Key,
} from "lucide-react";
import TeacherCredentialsManager from "./TeacherCredentialsManager";

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

interface TeacherDetailViewProps {
  teacher: Teacher;
  onClose: () => void;
  onEdit?: (teacher: Teacher) => void;
}

const TeacherDetailView: React.FC<TeacherDetailViewProps> = ({
  teacher,
  onClose,
  onEdit,
}) => {
  const [showCredentials, setShowCredentials] = useState(false);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getFullName = () => {
    return (
      teacher.user?.fullName ||
      `${teacher.user?.firstName || teacher.firstName || "Unknown"} ${
        teacher.user?.lastName || teacher.lastName || "Teacher"
      }`
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isActive
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {isActive ? (
          <>
            <UserCheck className="w-4 h-4 mr-1" />
            Active
          </>
        ) : (
          <>
            <UserX className="w-4 h-4 mr-1" />
            Inactive
          </>
        )}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Floating Close Button */}
        {/* <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button> */}

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {(teacher.user?.firstName || teacher.firstName)?.[0] || "T"}
                  {(teacher.user?.lastName || teacher.lastName)?.[0] || "R"}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">{getFullName()}</h1>
                <p className="text-blue-100 text-lg">
                  {teacher.designation || "Teacher"}
                </p>
                <div className="mt-2">{getStatusBadge(teacher.isActive)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onEdit && (
                <Button
                  onClick={() => onEdit(teacher)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button
                onClick={() => setShowCredentials(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border"
              >
                <Key className="w-4 h-4 mr-2" />
                Credentials
              </Button>
              <Button
                onClick={onClose}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Employee ID
                    </label>
                    <p className="text-gray-900">
                      {teacher.employeeId || teacher.teacherId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Username
                    </label>
                    <p className="text-gray-900">
                      {teacher.user?.username || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Date of Birth
                    </label>
                    <p className="text-gray-900">
                      {teacher.dob ? formatDate(teacher.dob) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Age
                    </label>
                    <p className="text-gray-900">{teacher.age || "N/A"} years</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Blood Group
                    </label>
                    <p className="text-gray-900 flex items-center">
                      <Heart className="w-4 h-4 mr-1 text-red-500" />
                      {teacher.bloodGroup || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Join Date
                    </label>
                    <p className="text-gray-900">
                      {(teacher.joinDate || teacher.dateOfJoining)
                        ? formatDate(teacher.joinDate || teacher.dateOfJoining!)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-green-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </label>
                  <p className="text-gray-900">
                    {teacher.user?.email || teacher.email || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Phone
                  </label>
                  <p className="text-gray-900">
                    {teacher.user?.phone || teacher.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Address
                  </label>
                  <p className="text-gray-900">
                    {teacher.address
                      ? `${teacher.address.street || ""} ${
                          teacher.address.city
                        }, ${teacher.address.state} ${
                          teacher.address.zipCode
                        }, ${teacher.address.country}`.trim()
                      : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Teaching Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                  Teaching Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Subjects
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(teacher.subjects || []).length > 0 ? (
                      teacher.subjects.map((subject, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium"
                        >
                          {subject}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No subjects assigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Teaching Grades
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(teacher.grades || []).length > 0 ? (
                      teacher.grades.map((grade, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded font-medium"
                        >
                          Grade {grade}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No grades assigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Sections
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(teacher.sections || []).length > 0 ? (
                      teacher.sections.map((section, index) => (
                        <span
                          key={index}
                          className="bg-orange-100 text-orange-800 text-sm px-2 py-1 rounded font-medium"
                        >
                          Section {section}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No sections assigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Class Teacher
                  </label>
                  <p className="text-gray-900">
                    {teacher.isClassTeacher
                      ? `Grade ${teacher.classTeacherFor?.grade || "N/A"} - Section ${
                          teacher.classTeacherFor?.section || "N/A"
                        }`
                      : "Not a class teacher"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-orange-600" />
                  Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Total Experience
                  </label>
                  <p className="text-gray-900 flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-blue-500" />
                    {teacher.experience?.totalYears || teacher.totalExperience || 0} years
                  </p>
                </div>
                {teacher.experience?.previousSchools &&
                  teacher.experience.previousSchools.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">
                        Previous Experience
                      </label>
                      <div className="space-y-3">
                        {teacher.experience.previousSchools.map((exp, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 p-3 rounded-lg border"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Building className="w-4 h-4 text-gray-600" />
                              <span className="font-medium text-gray-900">
                                {exp.schoolName}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {exp.position} • {exp.duration}
                            </p>
                            <p className="text-xs text-gray-500">
                              {exp.fromDate} - {exp.toDate}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Qualifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-indigo-600" />
                Qualifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.qualifications && teacher.qualifications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teacher.qualifications.map((qual, index) => (
                    <div
                      key={index}
                      className="bg-indigo-50 p-4 rounded-lg border border-indigo-200"
                    >
                      <h4 className="font-semibold text-indigo-900">
                        {qual.degree}
                      </h4>
                      <p className="text-indigo-700">{qual.institution}</p>
                      <p className="text-sm text-indigo-600">
                        Year: {qual.year}
                      </p>
                      {qual.specialization && (
                        <p className="text-sm text-indigo-600">
                          Specialization: {qual.specialization}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No qualifications recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact & Salary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-red-600" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Name
                  </label>
                  <p className="text-gray-900">
                    {teacher.emergencyContact?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Relationship
                  </label>
                  <p className="text-gray-900">
                    {teacher.emergencyContact?.relationship || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <p className="text-gray-900">
                    {teacher.emergencyContact?.phone || "N/A"}
                  </p>
                </div>
                {teacher.emergencyContact?.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Email
                    </label>
                    <p className="text-gray-900">
                      {teacher.emergencyContact.email}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Salary Information */}
            {teacher.salary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    Salary Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Basic Salary
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {formatCurrency(teacher.salary.basic)}
                      </p>
                    </div>
                    {teacher.salary.allowances && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Allowances
                        </label>
                        <p className="text-green-600 font-semibold">
                          {formatCurrency(teacher.salary.allowances)}
                        </p>
                      </div>
                    )}
                    {teacher.salary.deductions && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Deductions
                        </label>
                        <p className="text-red-600 font-semibold">
                          -{formatCurrency(teacher.salary.deductions)}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Net Salary
                      </label>
                      <p className="text-gray-900 font-bold text-lg">
                        {formatCurrency(teacher.salary.netSalary)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Login Credentials Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2 text-indigo-600" />
                Login Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Username
                  </label>
                  <p className="text-gray-900 font-mono">
                    {teacher.user?.username || "Not available"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Access Status
                  </label>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      teacher.isActive ? "bg-green-500" : "bg-red-500"
                    }`}></div>
                    <span className={`text-sm font-medium ${
                      teacher.isActive ? "text-green-700" : "text-red-700"
                    }`}>
                      {teacher.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Manage Teacher Login Credentials
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      View, copy, or reset teacher login credentials
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowCredentials(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Key className="w-4 h-4 mr-1" />
                    View Credentials
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                Record Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="text-gray-500">Created</label>
                  <p className="text-gray-900">
                    {formatDate(teacher.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500">Last Updated</label>
                  <p className="text-gray-900">
                    {formatDate(teacher.updatedAt)}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500">School</label>
                  <p className="text-gray-900">
                    {teacher.school?.name || "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Credentials Manager Modal */}
      {showCredentials && (
        <TeacherCredentialsManager
          teacher={{
            teacherId: teacher.teacherId || teacher.id,
            user: teacher.user,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
          }}
          onClose={() => setShowCredentials(false)}
        />
      )}
    </div>
  );
};

export default TeacherDetailView;