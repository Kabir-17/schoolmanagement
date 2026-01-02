import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/Card";
import { Button } from "../../ui/Button";
import { School } from "./types";
import { StatusBadge } from "./StatusBadge";

interface SchoolStatusManagementProps {
  school: School;
  onStatusChange: (newStatus: string) => void;
}

const SchoolStatusManagement: React.FC<SchoolStatusManagementProps> = ({
  school,
  onStatusChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Management</CardTitle>
        <CardDescription>Change the status of this school</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Current Status:</span>
          <StatusBadge status={school.status} />
          <div className="ml-4 flex gap-2">
            {school.status !== "active" && (
              <Button
                size="sm"
                onClick={() => onStatusChange("active")}
                className="bg-green-600 hover:bg-green-700"
              >
                Activate
              </Button>
            )}
            {school.status !== "suspended" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange("suspended")}
                className="text-red-600 hover:bg-red-50"
              >
                Suspend
              </Button>
            )}
            {school.status !== "inactive" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange("inactive")}
                className="text-gray-600 hover:bg-gray-50"
              >
                Deactivate
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchoolStatusManagement;
