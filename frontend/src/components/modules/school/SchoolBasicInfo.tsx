import React from "react";
import { Building, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { School } from "./types";

interface SchoolBasicInfoProps {
  school: School;
}

const SchoolBasicInfo: React.FC<SchoolBasicInfoProps> = ({ school }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">School Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {school.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">School ID</p>
                <p className="text-gray-900">{school.schoolId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Established Year
                </p>
                <p className="text-gray-900">
                  {school.establishedYear || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Affiliation</p>
                <p className="text-gray-900">
                  {school.affiliation || "Not specified"}
                </p>
              </div>
            </div>
            {school.recognition && (
              <div>
                <p className="text-sm font-medium text-gray-500">Recognition</p>
                <p className="text-gray-900">{school.recognition}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Students</span>
                <span className="font-semibold text-blue-600">
                  {school.stats?.totalStudents || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Teachers</span>
                <span className="font-semibold text-green-600">
                  {school.stats?.totalTeachers || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Classes</span>
                <span className="font-semibold text-purple-600">
                  {school.stats?.totalClasses || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SchoolBasicInfo;
