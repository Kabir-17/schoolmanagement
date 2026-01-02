import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  AlertTriangle,
  Plus,
  Users,
  Send,
  X,
  Clock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  MessageSquareWarning,
  UserX,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { teacherApi } from "../../services/teacher.api";

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  grade: string;
  section: string;
  warningCount?: number;
}

interface WarningType {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  color: string;
  icon: React.ReactNode;
}

interface DisciplinaryAction {
  id: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  grade: string;
  section: string;
  warningType: string;
  severity: 'low' | 'medium' | 'high';
  reason: string;
  description: string;
  date: string;
  status: 'active' | 'acknowledged' | 'resolved';
  parentNotified: boolean;
}

const TeacherDisciplinaryWarnings: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [warnings, setWarnings] = useState<DisciplinaryAction[]>([]);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    warningType: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
    reason: '',
    description: '',
    notifyParents: true,
  });

  const warningTypes: WarningType[] = [
    {
      id: 'behavior',
      name: 'Behavioral Issue',
      description: 'Disruptive behavior in class',
      severity: 'medium',
      color: 'text-orange-600 bg-orange-50',
      icon: <UserX className="h-4 w-4" />
    },
    {
      id: 'attendance',
      name: 'Poor Attendance',
      description: 'Excessive absences or tardiness',
      severity: 'medium',
      color: 'text-yellow-600 bg-yellow-50',
      icon: <Clock className="h-4 w-4" />
    },
    {
      id: 'academic',
      name: 'Academic Negligence',
      description: 'Not completing assignments or poor performance',
      severity: 'low',
      color: 'text-blue-600 bg-blue-50',
      icon: <Shield className="h-4 w-4" />
    },
    {
      id: 'discipline',
      name: 'Serious Misconduct',
      description: 'Fighting, cheating, or serious rule violations',
      severity: 'high',
      color: 'text-red-600 bg-red-50',
      icon: <ShieldAlert className="h-4 w-4" />
    },
    {
      id: 'homework',
      name: 'Homework Issues',
      description: 'Consistently not submitting homework',
      severity: 'low',
      color: 'text-purple-600 bg-purple-50',
      icon: <MessageSquareWarning className="h-4 w-4" />
    },
  ];

  useEffect(() => {
    loadStudents();
    loadWarnings();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await teacherApi.getTeacherStudents();
      if (response.data.success) {
        setStudents(response.data.data.students || []);
      }
    } catch (error: any) {
      console.error("Failed to load students:", error);
      toast.error(error.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const loadWarnings = async () => {
    try {
      const response = await teacherApi.getIssuedWarnings();
      if (response.data.success) {
        setWarnings(response.data.data.warnings || []);
      }
    } catch (error: any) {
      console.error("Failed to load warnings:", error);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    const filteredStudentIds = filteredStudents.map(s => s.id);
    setSelectedStudents(prev =>
      prev.length === filteredStudentIds.length ? [] : filteredStudentIds
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.name === 'notifyParents') {
      setFormData({
        ...formData,
        [e.target.name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    if (!formData.warningType || !formData.reason.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const warningData = {
        studentIds: selectedStudents,
        warningType: formData.warningType,
        severity: formData.severity,
        reason: formData.reason,
        description: formData.description,
        notifyParents: formData.notifyParents,
      };

      const response = await teacherApi.issueWarning(warningData);

      if (response.data.success) {
        toast.success(`Warning issued to ${selectedStudents.length} student(s)!`);
        setShowIssueForm(false);
        setSelectedStudents([]);
        setFormData({
          warningType: '',
          severity: 'medium',
          reason: '',
          description: '',
          notifyParents: true,
        });
        loadWarnings();
      }
    } catch (error: any) {
      console.error("Failed to issue warning:", error);
      toast.error(error.response?.data?.message || "Failed to issue warning");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-50';
      case 'acknowledged': return 'text-orange-600 bg-orange-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (showIssueForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Issue Warning</h2>
            <p className="text-gray-600">Send disciplinary warnings to students and parents</p>
          </div>
          <Button
            onClick={() => setShowIssueForm(false)}
            variant="outline"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Student Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Select Students ({selectedStudents.length} selected)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleSelectAll}
                  size="sm"
                  variant="outline"
                >
                  {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedStudents.includes(student.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleStudentSelect(student.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">
                          Roll: {student.rollNumber} | Grade {student.grade} - {student.section}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {student.warningCount && student.warningCount > 0 && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded mr-2">
                            {student.warningCount} warning(s)
                          </span>
                        )}
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleStudentSelect(student.id)}
                          className="h-4 w-4 text-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Warning Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Warning Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warning Type *
                  </label>
                  <div className="space-y-2">
                    {warningTypes.map((type) => (
                      <label
                        key={type.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.warningType === type.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="warningType"
                          value={type.id}
                          checked={formData.warningType === type.id}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-2 rounded-lg mr-3 ${type.color}`}>
                          {type.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{type.name}</p>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity Level *
                  </label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low - Minor issue</option>
                    <option value="medium">Medium - Moderate concern</option>
                    <option value="high">High - Serious matter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Brief) *
                  </label>
                  <Input
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="e.g., Disruptive behavior during Math class"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide more details about the incident..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="notifyParents"
                    checked={formData.notifyParents}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Notify parents via email and SMS
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={loading || selectedStudents.length === 0}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Issuing Warning...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Issue Warning to {selectedStudents.length} Student(s)
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Disciplinary Warnings</h2>
          <p className="text-gray-600">Manage student discipline and warnings</p>
        </div>
        <Button
          onClick={() => setShowIssueForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Issue Warning
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Warnings</p>
                <p className="text-2xl font-bold text-gray-900">{warnings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ShieldAlert className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {warnings.filter(w => w.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageSquareWarning className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Acknowledged</p>
                <p className="text-2xl font-bold text-gray-900">
                  {warnings.filter(w => w.status === 'acknowledged').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {warnings.filter(w => w.status === 'resolved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings List */}
      {warnings.length > 0 ? (
        <div className="space-y-4">
          {warnings.map((warning) => (
            <Card key={warning.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {warning.studentName}
                      </h3>
                      <span className="text-sm text-gray-600">
                        Roll: {warning.studentRoll}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(warning.severity)}`}>
                        {warning.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(warning.status)}`}>
                        {warning.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-gray-900 font-medium mb-1">{warning.reason}</p>
                    {warning.description && (
                      <p className="text-gray-600 mb-3">{warning.description}</p>
                    )}

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Grade {warning.grade} - Section {warning.section}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(warning.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <MessageSquareWarning className="h-4 w-4 mr-1" />
                        {warning.warningType}
                      </div>
                      {warning.parentNotified && (
                        <div className="flex items-center text-green-600">
                          <Send className="h-4 w-4 mr-1" />
                          Parents Notified
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <ShieldCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Warnings Issued</h3>
              <p className="text-gray-600">
                You haven't issued any disciplinary warnings yet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherDisciplinaryWarnings;