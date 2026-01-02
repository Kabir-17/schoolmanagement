import React, { useState } from "react";
import { Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { School } from "./types";

interface SchoolApiConfigProps {
  school: School;
  onRegenerateApiKey: () => void;
}

const SchoolApiConfig: React.FC<SchoolApiConfigProps> = ({
  school,
  onRegenerateApiKey,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Configuration
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerateApiKey}
            className="text-xs"
          >
            Regenerate Key
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500">API Endpoint</p>
          <p className="text-gray-900 font-mono text-sm bg-gray-100 px-3 py-2 rounded">
            {school.apiEndpoint}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">API Key</p>
          <div className="flex items-center gap-2">
            <p className="text-gray-900 font-mono text-sm bg-gray-100 px-3 py-2 rounded flex-1">
              {showApiKey
                ? school.apiKey || "****-****-****-abcd"
                : "****-****-****-****"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? "Hide" : "Show"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchoolApiConfig;
