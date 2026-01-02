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
  RotateCcw,
  Briefcase,
} from "lucide-react";
import { adminApi } from "../../../services/admin.api";
import { toast } from "react-hot-toast";

interface AccountantCredentials {
  accountantId: string;
  username: string;
  password: string;
  temporaryPassword: boolean;
}

interface CredentialsResponse {
  credentials: AccountantCredentials;
  message: string;
}

interface AccountantCredentialsManagerProps {
  accountant: {
    accountantId: string;
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

const AccountantCredentialsManager: React.FC<AccountantCredentialsManagerProps> = ({
  accountant,
  onClose,
}) => {
  const [credentials, setCredentials] = useState<CredentialsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const accountantName = 
    accountant.user?.fullName ||
    `${accountant.user?.firstName || accountant.firstName || "Unknown"} ${
      accountant.user?.lastName || accountant.lastName || "Accountant"
    }`;

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAccountantCredentials(accountant.accountantId);
      
      if (response.data.success) {
        setCredentials(response.data.data);
      } else {
        toast.error("Failed to load accountant credentials");
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("No credentials found for this accountant");
      } else {
        toast.error(error.response?.data?.message || "Failed to load credentials");
      }
      console.error("Failed to load credentials:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!confirm("Are you sure you want to reset this accountant's password? The accountant will need to use the new credentials to login.")) {
      return;
    }

    try {
      setResetting(true);
      const response = await adminApi.resetAccountantPassword(accountant.accountantId);
      
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
Accountant Login Credentials
============================
Accountant ID: ${credentials.credentials.accountantId}
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
        const response = await adminApi.getAccountantCredentials(accountant.accountantId);
        
        if (response.data.success) {
          setCredentials(response.data.data);
        } else {
          toast.error("Failed to load accountant credentials");
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error("No credentials found for this accountant");
        } else {
          toast.error(error.response?.data?.message || "Failed to load credentials");
        }
        console.error("Failed to load credentials:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [accountant.accountantId]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="relative">
        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
          <CardHeader className="text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
            <CardTitle className="flex items-center justify-center gap-2">
              <Key className="h-6 w-6" />
              Accountant Credentials
            </CardTitle>
            <p className="text-indigo-100 text-sm mt-2">
              Login credentials for {accountantName}
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
                {/* Accountant Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Briefcase className="h-4 w-4" />
                    Accountant Information
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{accountantName}</p>
                    <p className="text-sm text-gray-600">
                      ID: {accountant.accountantId}
                    </p>
                    {accountant.user?.username && (
                      <p className="text-sm text-gray-600">
                        Current Username: {accountant.user.username}
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
                        <li>• Share them securely with the accountant</li>
                        <li>
                          • Accountant should change password after first login
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
                  No credentials found for this accountant.
                </p>
                <p className="text-sm text-gray-500">
                  Credentials are automatically generated when an accountant is
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

export default AccountantCredentialsManager;
