import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { Button } from "../../ui/Button";
import { Card, CardContent } from "../../ui/Card";
import { Copy, Eye, EyeOff, User, Lock, Mail, Phone, Briefcase } from "lucide-react";
import { showToast } from "../../../utils/toast";

interface AccountantCredentials {
  accountant: {
    id: string;
    username: string;
    password: string;
    email?: string;
    phone?: string;
  };
  employeeId: string;
}

interface AccountantCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: AccountantCredentials | null;
  accountantName: string;
}

export const AccountantCredentialsModal: React.FC<AccountantCredentialsModalProps> = ({
  isOpen,
  onClose,
  credentials,
  accountantName,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast.success(`${label} copied to clipboard!`);
    });
  };

  const downloadCredentials = () => {
    if (!credentials) return;

    const content = `
STUDENT MANAGEMENT SYSTEM - ACCOUNTANT LOGIN CREDENTIALS
========================================================

ACCOUNTANT ACCOUNT (${accountantName})
--------------------------------------
Accountant ID: ${credentials.accountant.id}
Employee ID: ${credentials.employeeId}
Username: ${credentials.accountant.username}
Password: ${credentials.accountant.password}
${credentials.accountant.email ? `Email: ${credentials.accountant.email}` : ""}
${credentials.accountant.phone ? `Phone: ${credentials.accountant.phone}` : ""}

IMPORTANT NOTES:
- Please save these credentials securely
- Change password on first login for security
- Contact admin if you face any login issues
- Keep this information confidential

Generated on: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${accountantName.replace(/\s+/g, "_")}_credentials.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast.success("Credentials downloaded successfully!");
  };

  if (!credentials) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            Accountant Account Created Successfully
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Accountant account has been created successfully. Please save these
            credentials securely.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {/* Accountant Credentials */}
          <Card className="border-indigo-200 bg-indigo-50">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-indigo-900">
                    {accountantName}
                  </h3>
                  <p className="text-sm text-indigo-700">Accountant</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-indigo-900">
                    Accountant ID
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white p-2 rounded border border-indigo-200 text-indigo-900 font-mono text-sm">
                      {credentials.accountant.id}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(credentials.accountant.id, "Accountant ID")
                      }
                      className="border-indigo-300 hover:bg-indigo-100"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-indigo-900">
                    Employee ID
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white p-2 rounded border border-indigo-200 text-indigo-900 font-mono text-sm">
                      {credentials.employeeId}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(credentials.employeeId, "Employee ID")
                      }
                      className="border-indigo-300 hover:bg-indigo-100"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-indigo-900">
                    Username
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white p-2 rounded border border-indigo-200 text-indigo-900 font-mono text-sm">
                      {credentials.accountant.username}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          credentials.accountant.username,
                          "Username"
                        )
                      }
                      className="border-indigo-300 hover:bg-indigo-100"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-indigo-900">
                    Password
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white p-2 rounded border border-indigo-200 text-indigo-900 font-mono text-sm">
                      {showPassword
                        ? credentials.accountant.password
                        : "••••••••••••"}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="border-indigo-300 hover:bg-indigo-100"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          credentials.accountant.password,
                          "Password"
                        )
                      }
                      className="border-indigo-300 hover:bg-indigo-100"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {(credentials.accountant.email || credentials.accountant.phone) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-indigo-200">
                  {credentials.accountant.email && (
                    <div className="flex items-center gap-2 text-sm text-indigo-800">
                      <Mail className="h-4 w-4" />
                      <span>{credentials.accountant.email}</span>
                    </div>
                  )}
                  {credentials.accountant.phone && (
                    <div className="flex items-center gap-2 text-sm text-indigo-800">
                      <Phone className="h-4 w-4" />
                      <span>{credentials.accountant.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-medium text-orange-800">
                    Important Security Notice
                  </h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>
                      • Please save these credentials in a secure location
                    </li>
                    <li>• User must change password on first login</li>
                    <li>
                      • Do not share credentials with unauthorized persons
                    </li>
                    <li>• Contact admin if you face any login issues</li>
                    <li>
                      • These credentials will NOT be shown again after closing
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t bg-white flex-shrink-0">
          <Button 
            onClick={downloadCredentials} 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            Download Credentials
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
