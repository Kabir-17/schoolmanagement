import React from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { School } from "./types";

interface SchoolAcademicSessionProps {
  school: School;
}

const SchoolAcademicSession: React.FC<SchoolAcademicSessionProps> = ({
  school,
}) => {
  if (!school.currentSession) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Current Academic Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Session Name</p>
            <p className="text-gray-900">{school.currentSession.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Start Date</p>
            <p className="text-gray-900">
              {new Date(school.currentSession.startDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">End Date</p>
            <p className="text-gray-900">
              {new Date(school.currentSession.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchoolAcademicSession;
