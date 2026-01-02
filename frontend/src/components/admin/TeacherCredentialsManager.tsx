import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Key,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  RefreshCw,
  Shield,
  AlertTriangle,
  User,
  RotateCcw,
 
} from "lucide-react";
import { teacherApi } from "../../services/teacher.api";
import { toast } from "react-hot-toast";

interface TeacherCredentials {
  teacherId: string;
  username: string;
  password: string;
  temporaryPassword: boolean;
}

interface CredentialsResponse {
  credentials: TeacherCredentials;
  message: string;
}

interface TeacherCredentialsManagerProps {
  teacher: {
    teacherId: string;
    user?: {
      username?: string;
      fullName?: string;
      firstName?: string;
      lastName?: string;
    };
    firstName?: string;
    lastName?: string;
  };
  onClose?: () => void;
}

const TeacherCredentialsManager: React.FC<TeacherCredentialsManagerProps> = ({
  teacher,
  onClose,
}) => {
  const [credentials, setCredentials] = useState<CredentialsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const teacherName = 
    teacher.user?.fullName ||
    `${teacher.user?.firstName || teacher.firstName || "Unknown"} ${
      teacher.user?.lastName || teacher.lastName || "Teacher"
    }`;

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const response = await teacherApi.getCredentials(teacher.teacherId);
      
      if (response.data.success) {
        setCredentials(response.data.data);
      } else {
        toast.error("Failed to load teacher credentials");
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("No credentials found for this teacher");
      } else {
        toast.error(error.response?.data?.message || "Failed to load credentials");
      }
      console.error("Failed to load credentials:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!confirm("Are you sure you want to reset this teacher's password? The teacher will need to use the new credentials to login.")) {
      return;
    }

    try {
      setResetting(true);
      const response = await teacherApi.resetPassword(teacher.teacherId);
      
      if (response.data.success) {
        setCredentials(response.data.data);
        toast.success("Password reset successfully");
      } else {
        toast.error("Failed to reset password");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset password");
      console.error("Failed to reset password:", error);
    } finally {
      setResetting(false);
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const copyAllCredentials = async () => {
    if (!credentials) return;
    
    const credentialsText = `
Teacher Login Credentials
========================
Teacher ID: ${credentials.credentials.teacherId}
Username: ${credentials.credentials.username}
Password: ${credentials.credentials.password}
Temporary Password: ${credentials.credentials.temporaryPassword ? "Yes" : "No"}

Please keep these credentials safe and secure.
${credentials.message}
    `.trim();

    await copyToClipboard(credentialsText, "all credentials");
  };

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await teacherApi.getCredentials(teacher.teacherId);
        
        if (response.data.success) {
          setCredentials(response.data.data);
        } else {
          toast.error("Failed to load teacher credentials");
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error("No credentials found for this teacher");
        } else {
          toast.error(error.response?.data?.message || "Failed to load credentials");
        }
        console.error("Failed to load credentials:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [teacher.teacherId]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="relative">
        {/* Floating Close Button */}
        {/* {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        )} */}

        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
          <CardHeader className="text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
            <CardTitle className="flex items-center justify-center gap-2">
              <Key className="h-6 w-6" />
              Teacher Credentials
            </CardTitle>
            <p className="text-indigo-100 text-sm mt-2">
              Login credentials for {teacherName}
            </p>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading credentials...</p>
              </div>
            ) : credentials ? (
              <>
                {/* Teacher Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User className="h-4 w-4" />
                    Teacher Information
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{teacherName}</p>
                    <p className="text-sm text-gray-600">
                      ID: {teacher.teacherId}
                    </p>
                    {teacher.user?.username && (
                      <p className="text-sm text-gray-600">
                        Current Username: {teacher.user.username}
                      </p>
                    )}
                  </div>
                </div>

                {/* Credentials */}
                <div className="space-y-4">
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Username
                    </label>
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border-2 border-gray-200">
                      <span className="font-mono text-sm font-medium">
                        {credentials.credentials.username}
                      </span>
                      <Button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            credentials.credentials.username,
                            "username"
                          )
                        }
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        {copiedField === "username" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Password
                    </label>
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border-2 border-gray-200">
                      <span className="font-mono text-sm font-medium">
                        {showPassword
                          ? credentials.credentials.password
                          : "••••••••"}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              credentials.credentials.password,
                              "password"
                            )
                          }
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          {copiedField === "password" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Password Status */}
                  <div
                    className={`p-3 rounded-lg flex items-center gap-2 ${
                      credentials.credentials.temporaryPassword
                        ? "bg-orange-50 border border-orange-200"
                        : "bg-green-50 border border-green-200"
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        credentials.credentials.temporaryPassword
                          ? "bg-orange-500"
                          : "bg-green-500"
                      }`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${
                        credentials.credentials.temporaryPassword
                          ? "text-orange-700"
                          : "text-green-700"
                      }`}
                    >
                      {credentials.credentials.temporaryPassword
                        ? "Temporary Password - Requires Change"
                        : "Password Set"}
                    </span>
                  </div>
                </div>

                {/* Message */}
                {credentials.message && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-700">
                        {credentials.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={copyAllCredentials}
                    className="w-full"
                    variant="outline"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All Credentials
                  </Button>

                  <Button
                    onClick={resetPassword}
                    disabled={resetting}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    variant="default"
                  >
                    {resetting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Password
                      </>
                    )}
                  </Button>
                </div>

                {/* Security Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium mb-1">
                        ⚠️ Important Security Notice:
                      </p>
                      <ul className="space-y-1 text-xs">
                        <li>• Save these credentials in a secure location</li>
                        <li>• Share them securely with the teacher</li>
                        <li>
                          • Teacher should change password after first login
                        </li>
                        <li>• Monitor for unauthorized access</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No credentials found for this teacher.
                </p>
                <p className="text-sm text-gray-500">
                  Credentials are automatically generated when a teacher is
                  created.
                </p>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => loadCredentials()}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              {onClose && (
                <Button onClick={onClose} variant="outline" className="flex-1">
                  Close
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherCredentialsManager;