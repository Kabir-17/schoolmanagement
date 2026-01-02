import React, { useState } from "react";
import { Users, Eye, EyeOff, Copy, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { School } from "./types";
import { copyToClipboard } from "./utils";

interface SchoolAdminInfoProps {
  school: School;
  onResetPassword?: () => void;
}

const SchoolAdminInfo: React.FC<SchoolAdminInfoProps> = ({
  school,
  onResetPassword,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  if (!school.admin) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Administrator Credentials
          </div>
          {onResetPassword && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetPassword}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Password
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Full Name</p>
            <p className="text-gray-900">{school.admin.fullName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Username</p>
            <div className="flex items-center gap-2">
              <p className="text-gray-900 font-mono">{school.admin.username}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(school.admin!.username, "Username")
                }
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Password</p>
            <div className="flex items-center gap-2">
              <p className="text-gray-900 font-mono">
                {showPassword
                  ? school.admin.password || "No password available"
                  : "••••••••"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="h-6 w-6 p-0"
              >
                {showPassword ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </Button>
              {school.admin.password && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(school.admin!.password!, "Password")
                  }
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-gray-900">{school.admin.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Phone</p>
            <p className="text-gray-900">{school.admin.phone}</p>
          </div>
          {school.admin.lastLogin && (
            <div>
              <p className="text-sm font-medium text-gray-500">Last Login</p>
              <p className="text-gray-900 text-sm">
                {new Date(school.admin.lastLogin).toLocaleDateString()} at{" "}
                {new Date(school.admin.lastLogin).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SchoolAdminInfo;
