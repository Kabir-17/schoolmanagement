import React from "react";
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface BasicInfoProps {
  formData: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    employeeId?: string;
    designation: string;
    bloodGroup: string;
    dob: string;
    joinDate?: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

const DESIGNATIONS = [
  "Principal",
  "Vice Principal",
  "Head Teacher",
  "Senior Teacher",
  "Teacher",
  "Assistant Teacher",
  "Subject Coordinator",
  "Sports Teacher",
  "Music Teacher",
  "Art Teacher",
  "Librarian",
  "Lab Assistant",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BasicInfo: React.FC<BasicInfoProps> = ({
  formData,
  errors,
  onChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <Input
            value={formData.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            placeholder="Enter first name"
            className={errors.firstName ? "border-red-500" : ""}
          />
          {errors.firstName && (
            <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <Input
            value={formData.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            placeholder="Enter last name"
            className={errors.lastName ? "border-red-500" : ""}
          />
          {errors.lastName && (
            <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="Enter email address"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <Input
            value={formData.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee ID
          </label>
          <Input
            value={formData.employeeId}
            onChange={(e) => onChange("employeeId", e.target.value)}
            placeholder="Auto-generated on save"
            disabled
            className="bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            Will be auto-generated when teacher is created
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Designation *
          </label>
          <select
            value={formData.designation}
            onChange={(e) => onChange("designation", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select designation"
          >
            {DESIGNATIONS.map((designation) => (
              <option key={designation} value={designation}>
                {designation}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Blood Group *
          </label>
          <select
            value={formData.bloodGroup}
            onChange={(e) => onChange("bloodGroup", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select blood group"
          >
            {BLOOD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth *
          </label>
          <Input
            type="date"
            value={formData.dob}
            onChange={(e) => onChange("dob", e.target.value)}
            className={errors.dob ? "border-red-500" : ""}
          />
          {errors.dob && (
            <p className="text-red-500 text-xs mt-1">{errors.dob}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Join Date
          </label>
          <Input
            type="date"
            value={formData.joinDate}
            onChange={(e) => onChange("joinDate", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicInfo;
