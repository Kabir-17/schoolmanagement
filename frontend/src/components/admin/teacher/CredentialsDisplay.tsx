import React from "react";
import { Key, Copy, Eye, EyeOff, CheckCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Credentials {
  username: string;
  password: string;
  teacherId: string;
  employeeId: string;
}

interface CredentialsDisplayProps {
  credentials: Credentials | null;
  onClose?: () => void;
}

const CredentialsDisplay: React.FC<CredentialsDisplayProps> = ({
  credentials,
  onClose,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!credentials) return null;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const copyAllCredentials = async () => {
    const credentialsText = `
Teacher Login Credentials
========================
Teacher ID: ${credentials.teacherId}
Employee ID: ${credentials.employeeId}
Username: ${credentials.username}
Password: ${credentials.password}

Please keep these credentials safe and secure.
The teacher will use the username and password to login to the system.
    `.trim();

    await copyToClipboard(credentialsText, "all");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="relative">
        {/* Floating Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Teacher Created Successfully!
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Save these credentials safely. The teacher will need them to login.
            </p>
          </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Key className="h-5 w-5 text-yellow-600" />
              <h3 className="font-medium text-yellow-800">Login Credentials</h3>
            </div>

            <div className="space-y-3">
              {/* Teacher ID */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Teacher ID
                </label>
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="font-mono text-sm">
                    {credentials.teacherId}
                  </span>
                  <Button
                    type="button"
                    onClick={() =>
                      copyToClipboard(credentials.teacherId, "teacherId")
                    }
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    {copiedField === "teacherId" ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Employee ID */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Employee ID
                </label>
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="font-mono text-sm">
                    {credentials.employeeId}
                  </span>
                  <Button
                    type="button"
                    onClick={() =>
                      copyToClipboard(credentials.employeeId, "employeeId")
                    }
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    {copiedField === "employeeId" ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Username
                </label>
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="font-mono text-sm">
                    {credentials.username}
                  </span>
                  <Button
                    type="button"
                    onClick={() =>
                      copyToClipboard(credentials.username, "username")
                    }
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    {copiedField === "username" ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Password
                </label>
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="font-mono text-sm">
                    {showPassword ? credentials.password : "••••••••"}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      {showPassword ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={() =>
                        copyToClipboard(credentials.password, "password")
                      }
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      {copiedField === "password" ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={copyAllCredentials}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              {copiedField === "all" ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Copied All Credentials!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy All Credentials
                </>
              )}
            </Button>

            {onClose && (
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            )}
          </div>

          {/* Security Notice */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p className="font-medium mb-1">⚠️ Important Security Notice:</p>
            <ul className="space-y-1">
              <li>• Save these credentials in a secure location</li>
              <li>• Share them securely with the teacher</li>
              <li>
                • The teacher should change the password after first login
              </li>
              <li>• These credentials won't be shown again</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default CredentialsDisplay;
