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
  Heart,
  Shield,
  DollarSign,
  Clock,
  Building,
  UserCheck,
  UserX,
  Edit,
  Key,
  FileText,
  Award,
} from "lucide-react";
import AccountantCredentialsManager from "./AccountantCredentialsManager";

interface Accountant {
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
    previousCompanies?: {
      companyName: string;
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
  };
  responsibilities?: string[];
  certifications?: string[];
  isActive: boolean;
  age?: number;
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
}

interface AccountantDetailViewProps {
  accountant: Accountant;
  onClose: () => void;
  onEdit?: (accountant: Accountant) => void;
}

const AccountantDetailView: React.FC<AccountantDetailViewProps> = ({
  accountant,
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
    return accountant.user?.fullName || `${accountant.user?.firstName || "Unknown"} ${accountant.user?.lastName || "Accountant"}`;
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

  const calculateNetSalary = () => {
    if (!accountant.salary) return 0;
    return (
      (accountant.salary.basic || 0) +
      (accountant.salary.allowances || 0) -
      (accountant.salary.deductions || 0)
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {accountant.user?.firstName?.[0] || "A"}
                  {accountant.user?.lastName?.[0] || "C"}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">{getFullName()}</h1>
                <p className="text-indigo-100 text-lg">
                  {accountant.designation || "Accountant"}
                </p>
                <div className="mt-2">{getStatusBadge(accountant.isActive)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onEdit && (
                <Button
                  onClick={() => onEdit(accountant)}
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
                  <User className="w-5 h-5 mr-2 text-indigo-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Accountant ID
                    </label>
                    <p className="text-gray-900 font-mono">
                      {accountant.accountantId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Employee ID
                    </label>
                    <p className="text-gray-900 font-mono">
                      {accountant.employeeId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Username
                    </label>
                    <p className="text-gray-900 font-mono">
                      {accountant.user?.username || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Date of Birth
                    </label>
                    <p className="text-gray-900">
                      {accountant.dob ? formatDate(accountant.dob) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Age
                    </label>
                    <p className="text-gray-900">{accountant.age || "N/A"} years</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Blood Group
                    </label>
                    <p className="text-gray-900 flex items-center">
                      <Heart className="w-4 h-4 mr-1 text-red-500" />
                      {accountant.bloodGroup || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Join Date
                    </label>
                    <p className="text-gray-900">
                      {accountant.joinDate ? formatDate(accountant.joinDate) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Department
                    </label>
                    <p className="text-gray-900">
                      {accountant.department || "N/A"}
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
                    {accountant.user?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Phone
                  </label>
                  <p className="text-gray-900">
                    {accountant.user?.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Address
                  </label>
                  <p className="text-gray-900">
                    {accountant.address
                      ? `${accountant.address.street || ""} ${
                          accountant.address.city
                        }, ${accountant.address.state} ${
                          accountant.address.zipCode
                        }, ${accountant.address.country}`.trim()
                      : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    {accountant.experience?.totalYears || accountant.totalExperience || 0} years
                  </p>
                </div>
                {accountant.experience?.previousCompanies &&
                  accountant.experience.previousCompanies.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">
                        Previous Experience
                      </label>
                      <div className="space-y-3">
                        {accountant.experience.previousCompanies.map((exp, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 p-3 rounded-lg border"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Building className="w-4 h-4 text-gray-600" />
                              <span className="font-medium text-gray-900">
                                {exp.companyName}
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

            {/* Responsibilities */}
            {accountant.responsibilities && accountant.responsibilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Responsibilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {accountant.responsibilities.map((resp, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span className="text-gray-900">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Qualifications and Certifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Qualifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2 text-indigo-600" />
                  Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {accountant.qualifications && accountant.qualifications.length > 0 ? (
                  <div className="space-y-3">
                    {accountant.qualifications.map((qual, index) => (
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

            {/* Certifications */}
            {accountant.certifications && accountant.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2 text-purple-600" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {accountant.certifications.map((cert, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-900">{cert}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

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
                    {accountant.emergencyContact?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Relationship
                  </label>
                  <p className="text-gray-900">
                    {accountant.emergencyContact?.relationship || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <p className="text-gray-900">
                    {accountant.emergencyContact?.phone || "N/A"}
                  </p>
                </div>
                {accountant.emergencyContact?.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Email
                    </label>
                    <p className="text-gray-900">
                      {accountant.emergencyContact.email}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Salary Information */}
            {accountant.salary && (
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
                        {formatCurrency(accountant.salary.basic)}
                      </p>
                    </div>
                    {accountant.salary.allowances && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Allowances
                        </label>
                        <p className="text-green-600 font-semibold">
                          {formatCurrency(accountant.salary.allowances)}
                        </p>
                      </div>
                    )}
                    {accountant.salary.deductions && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Deductions
                        </label>
                        <p className="text-red-600 font-semibold">
                          -{formatCurrency(accountant.salary.deductions)}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Net Salary
                      </label>
                      <p className="text-gray-900 font-bold text-lg">
                        {formatCurrency(calculateNetSalary())}
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
                    {accountant.user?.username || "Not available"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Access Status
                  </label>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      accountant.isActive ? "bg-green-500" : "bg-red-500"
                    }`}></div>
                    <span className={`text-sm font-medium ${
                      accountant.isActive ? "text-green-700" : "text-red-700"
                    }`}>
                      {accountant.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-900">
                      Manage Accountant Login Credentials
                    </p>
                    <p className="text-xs text-indigo-700 mt-1">
                      View, copy, or reset accountant login credentials
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowCredentials(true)}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
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
                    {formatDate(accountant.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500">Last Updated</label>
                  <p className="text-gray-900">
                    {formatDate(accountant.updatedAt)}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500">School</label>
                  <p className="text-gray-900">
                    {accountant.school?.name || "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Credentials Manager Modal */}
      {showCredentials && (
        <AccountantCredentialsManager
          accountant={{
            accountantId: accountant.accountantId || accountant.id,
            user: accountant.user,
          }}
          onClose={() => setShowCredentials(false)}
        />
      )}
    </div>
  );
};

export default AccountantDetailView;
