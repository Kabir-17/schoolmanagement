import React from "react";
import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { School } from "./types";
import { usePublicConfig } from "@/hooks/usePublicConfig";

interface SchoolSettingsProps {
  school: School;
}

const SchoolSettings: React.FC<SchoolSettingsProps> = ({ school }) => {
  const { config: publicConfig } = usePublicConfig();
  const activeTimezone = publicConfig?.timezone || school.settings?.timezone;

  if (!school.settings) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          School Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Max Students per Section
            </p>
            <p className="text-gray-900">
              {school.settings.maxStudentsPerSection}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Timezone</p>
            <p className="text-gray-900">{activeTimezone}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Language</p>
            <p className="text-gray-900">{school.settings.language}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Currency</p>
            <p className="text-gray-900">{school.settings.currency}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Grades Offered</p>
            <p className="text-gray-900">{school.settings.grades.join(", ")}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Sections</p>
            <p className="text-gray-900">
              {school.settings.sections.join(", ")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchoolSettings;
