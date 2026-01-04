import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Copy, Eye, EyeOff, User, Lock, Mail, Phone } from "lucide-react";
import { showToast } from "../../utils/toast";

interface CredentialsData {
  student: {
    id: string;
    username: string;
    password: string;
    email?: string;
    phone?: string;
  };
  parent: {
    id: string;
    username: string;
    password: string;
    email?: string;
    phone?: string;
  };
}

import { Input } from "../ui/Input";

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: CredentialsData | null;
  studentName: string;
  parentName: string;
  onUpdateCredentials?: (type: 'student' | 'parent', field: 'password' | 'username', value: string) => void;
  onSaveCredentials?: () => void;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  isOpen,
  onClose,
  credentials,
  studentName,
  parentName,
  onUpdateCredentials,
  onSaveCredentials,
}) => {
  const [showStudentPassword, setShowStudentPassword] = React.useState(false);
  const [showParentPassword, setShowParentPassword] = React.useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast.success(`${label} copied to clipboard!`);
    });
  };

  const downloadCredentials = () => {
    if (!credentials) return;

    const content = `
STUDENT MANAGEMENT SYSTEM - LOGIN CREDENTIALS
============================================

STUDENT ACCOUNT (${studentName})
--------------------------------
Student ID: ${credentials.student.id}
Username: ${credentials.student.username}
Password: ${credentials.student.password}
${credentials.student.email ? `Email: ${credentials.student.email}` : ""}
${credentials.student.phone ? `Phone: ${credentials.student.phone}` : ""}

PARENT ACCOUNT (${parentName})
------------------------------
Parent ID: ${credentials.parent.id}
Username: ${credentials.parent.username}
Password: ${credentials.parent.password}
${credentials.parent.email ? `Email: ${credentials.parent.email}` : ""}
${credentials.parent.phone ? `Phone: ${credentials.parent.phone}` : ""}

IMPORTANT NOTES:
- Please save these credentials securely
- Change passwords on first login for security
- Contact admin if you face any login issues
- Keep this information confidential

Generated on: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${studentName.replace(/\s+/g, "_")}_credentials.txt`;
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
            <User className="h-5 w-5" />
            Account Credentials Generated
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Student and parent accounts have been created successfully. Please
            save these credentials securely.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {/* Student Credentials */}
          <Card className="p-0">
            <CardHeader className="p-0 pt-0">
              <CardTitle className="text-sm ">
                Student Account - {studentName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Student ID</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-100 p-2 rounded border">
                      {credentials.student.id}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(credentials.student.id, "Student ID")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={credentials.student.username}
                      onChange={(e) => {
                        if (onUpdateCredentials) {
                          onUpdateCredentials('student', 'username', e.target.value);
                        }
                      }}
                      className="flex-1 bg-white p-2 rounded border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          credentials.student.username,
                          "Username"
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type={showStudentPassword ? "text" : "password"}
                      value={credentials.student.password}
                      readOnly={false}  // Make input editable
                      onChange={(e) => {
                        // Logic to update password in state
                        if (onUpdateCredentials) {
                          onUpdateCredentials('student', 'password', e.target.value);
                        }
                      }}
                      className="flex-1 bg-white p-2 rounded border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowStudentPassword(!showStudentPassword)
                      }
                    >
                      {showStudentPassword ? (
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
                          credentials.student.password,
                          "Password"
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {(credentials.student.email || credentials.student.phone) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                  {credentials.student.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{credentials.student.email}</span>
                    </div>
                  )}
                  {credentials.student.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{credentials.student.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parent Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-green-600">
                Parent Account - {parentName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Parent ID</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-100 p-2 rounded border">
                      {credentials.parent.id}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(credentials.parent.id, "Parent ID")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={credentials.parent.username}
                      onChange={(e) => {
                        if (onUpdateCredentials) {
                          onUpdateCredentials('parent', 'username', e.target.value);
                        }
                      }}
                      className="flex-1 bg-white p-2 rounded border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(credentials.parent.username, "Username")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type={showParentPassword ? "text" : "password"}
                      value={credentials.parent.password}
                      readOnly={false}
                      onChange={(e) => {
                        if (onUpdateCredentials) {
                          onUpdateCredentials('parent', 'password', e.target.value);
                        }
                      }}
                      className="flex-1 bg-white p-2 rounded border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowParentPassword(!showParentPassword)}
                    >
                      {showParentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(credentials.parent.password, "Password")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {(credentials.parent.email || credentials.parent.phone) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                  {credentials.parent.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{credentials.parent.email}</span>
                    </div>
                  )}
                  {credentials.parent.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{credentials.parent.phone}</span>
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
                <Lock className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-orange-800">
                    Important Security Notice
                  </h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>
                      • Please save these credentials in a secure location
                    </li>
                    <li>• Recommend changing passwords on first login</li>
                    <li>
                      • Do not share credentials with unauthorized persons
                    </li>
                    <li>• Contact admin if you face any login issues</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t bg-white flex-shrink-0">
          <Button
            onClick={() => {
              if (onSaveCredentials) onSaveCredentials();
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Changes
          </Button>
          <Button onClick={downloadCredentials} className="flex-1" variant="outline">
            Download Credentials
          </Button>
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog >
  );
};
