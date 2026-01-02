import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { School } from "./types";

interface SchoolMetadataProps {
  school: School;
}

const SchoolMetadata: React.FC<SchoolMetadataProps> = ({ school }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Created</p>
            <p className="text-gray-900">
              {new Date(school.createdAt).toLocaleDateString()} at{" "}
              {new Date(school.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Last Updated</p>
            <p className="text-gray-900">
              {new Date(school.updatedAt).toLocaleDateString()} at{" "}
              {new Date(school.updatedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchoolMetadata;
