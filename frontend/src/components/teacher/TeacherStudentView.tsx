import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Users,
  Mail,
  Phone,
  User,
  BookOpen,
  AlertTriangle,
  Shield,
  Eye,
  MessageSquareWarning,
  BarChart3,
  Download,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { teacherApi } from "../../services/teacher.api";
// import { useAuth } from "../../context/AuthContext"; // TODO: Uncomment when implementing class teacher verification

interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  rollNumber: string;
  grade: number;
  section: string;
  admissionDate: string;
  bloodGroup: string;
  parentInfo: {
    name: string;
    email: string;
    phone: string;
  } | null;
  disciplinaryHistory: {
    totalActions: number;
    activeWarnings: number;
    totalPoints: number;
    redWarrants: number;
    lastActionDate: string | null;
    riskLevel: 'low' | 'medium' | 'high';
  };
  hasPhotos: boolean;
}

interface ClassStats {
  totalStudents: number;
  studentsWithDisciplinaryActions: number;
  studentsWithActiveWarnings: number;
  studentsWithRedWarrants: number;
  highRiskStudents: number;
  averageDisciplinaryPoints: number;
}

const TeacherStudentView: React.FC = () => {
  // const { user } = useAuth(); // TODO: Use for class teacher verification
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  // TODO: Implement class teacher verification
  // const [teacherInfo, setTeacherInfo] = useState<any>(null);
  // const [isClassTeacher, setIsClassTeacher] = useState(false);

  useEffect(() => {
    if (selectedGrade) {
      loadStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrade, selectedSection]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, searchTerm, riskFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      let endpoint = `/teachers/students/grade/${selectedGrade}`;
      if (selectedSection) {
        endpoint += `/section/${selectedSection}`;
      }
      
      const response = await teacherApi.get(endpoint);
      if (response.data.success) {
        const data = response.data.data;
        setStudents(data.students || []);
        setClassStats(data.stats);
        toast.success(`Loaded ${data.students?.length || 0} students`);
      }
    } catch (error: any) {
      console.error("Failed to load students:", error);
      toast.error(error.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRisk = !riskFilter || student.disciplinaryHistory.riskLevel === riskFilter;
      
      return matchesSearch && matchesRisk;
    });

    // Sort by risk level and then by name
    filtered.sort((a, b) => {
      const riskOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const riskDiff = riskOrder[b.disciplinaryHistory.riskLevel] - riskOrder[a.disciplinaryHistory.riskLevel];
      if (riskDiff !== 0) return riskDiff;
      return a.name.localeCompare(b.name);
    });

    setFilteredStudents(filtered);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-100 border-red-300';
      case 'medium': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'low': return 'text-green-600 bg-green-100 border-green-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const exportStudentData = () => {
    // Create CSV data
    const csvData = filteredStudents.map(student => ({
      'Student ID': student.studentId,
      'Name': student.name,
      'Roll Number': student.rollNumber,
      'Grade': student.grade,
      'Section': student.section,
      'Email': student.email,
      'Phone': student.phone,
      'Blood Group': student.bloodGroup,
      'Parent Name': student.parentInfo?.name || 'N/A',
      'Parent Email': student.parentInfo?.email || 'N/A',
      'Parent Phone': student.parentInfo?.phone || 'N/A',
      'Disciplinary Points': student.disciplinaryHistory.totalPoints,
      'Active Warnings': student.disciplinaryHistory.activeWarnings,
      'Red Warrants': student.disciplinaryHistory.redWarrants,
      'Risk Level': student.disciplinaryHistory.riskLevel.toUpperCase(),
    }));

    // Convert to CSV string
    const csvContent = [
      Object.keys(csvData[0] || {}),
      ...csvData.map(row => Object.values(row))
    ].map(row => row.join(',')).join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-grade-${selectedGrade}${selectedSection ? `-section-${selectedSection}` : ''}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Student data exported successfully');
  };

  if (selectedStudent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h2>
            <p className="text-gray-600">Grade {selectedStudent.grade} - Section {selectedStudent.section} | Roll: {selectedStudent.rollNumber}</p>
          </div>
          <Button
            onClick={() => setSelectedStudent(null)}
            variant="outline"
          >
            Back to List
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Student ID</label>
                  <p className="text-gray-900">{selectedStudent.studentId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Blood Group</label>
                  <p className="text-gray-900">{selectedStudent.bloodGroup}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedStudent.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{selectedStudent.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parent Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Parent Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedStudent.parentInfo ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Parent Name</label>
                    <p className="text-gray-900">{selectedStudent.parentInfo.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{selectedStudent.parentInfo.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{selectedStudent.parentInfo.phone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No parent information available</p>
              )}
            </CardContent>
          </Card>

          {/* Disciplinary History */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Disciplinary History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedStudent.disciplinaryHistory.totalActions}</p>
                  <p className="text-sm text-gray-600">Total Actions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{selectedStudent.disciplinaryHistory.activeWarnings}</p>
                  <p className="text-sm text-gray-600">Active Warnings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{selectedStudent.disciplinaryHistory.redWarrants}</p>
                  <p className="text-sm text-gray-600">Red Warrants</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{selectedStudent.disciplinaryHistory.totalPoints}</p>
                  <p className="text-sm text-gray-600">Total Points</p>
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getRiskLevelColor(selectedStudent.disciplinaryHistory.riskLevel)}`}>
                  Risk Level: {selectedStudent.disciplinaryHistory.riskLevel.toUpperCase()}
                </span>
              </div>

              {selectedStudent.disciplinaryHistory.lastActionDate && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Last Action: {new Date(selectedStudent.disciplinaryHistory.lastActionDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Student Management</h2>
          <p className="text-sm sm:text-base text-gray-600">View and manage students in your assigned grades</p>
        </div>
        {filteredStudents.length > 0 && (
          <Button onClick={exportStudentData} variant="outline" className="shrink-0 w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </div>

      {/* Grade and Section Selection */}
      <Card>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade *
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Grade</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                  <option key={grade} value={grade}>Grade {grade}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sections</option>
                {['A','B','C','D','E'].map(section => (
                  <option key={section} value={section}>Section {section}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Level Filter
              </label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Risk Levels</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Students
              </label>
              <Input
                placeholder="Search by name, roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Statistics */}
      {classStats && (
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="p-2 bg-blue-100 rounded-lg inline-block mb-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{classStats.totalStudents}</p>
              <p className="text-sm text-gray-600">Total Students</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="p-2 bg-orange-100 rounded-lg inline-block mb-2">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{classStats.studentsWithDisciplinaryActions}</p>
              <p className="text-sm text-gray-600">With Disciplinary Actions</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="p-2 bg-yellow-100 rounded-lg inline-block mb-2">
                <MessageSquareWarning className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{classStats.studentsWithActiveWarnings}</p>
              <p className="text-sm text-gray-600">Active Warnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="p-2 bg-red-100 rounded-lg inline-block mb-2">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{classStats.studentsWithRedWarrants}</p>
              <p className="text-sm text-gray-600">Red Warrants</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="p-2 bg-red-100 rounded-lg inline-block mb-2">
                <UserCheck className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{classStats.highRiskStudents}</p>
              <p className="text-sm text-gray-600">High Risk</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="p-2 bg-purple-100 rounded-lg inline-block mb-2">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{(classStats.averageDisciplinaryPoints || 0).toFixed(1)}</p>
              <p className="text-sm text-gray-600">Avg. Points</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Students List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading students...</p>
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedStudent(student)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-600">Roll: {student.rollNumber}</p>
                    <p className="text-sm text-gray-600">{student.studentId}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskLevelColor(student.disciplinaryHistory.riskLevel)}`}>
                    {student.disciplinaryHistory.riskLevel.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="truncate">{student.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{student.phone}</span>
                  </div>
                  {student.parentInfo && (
                    <div className="flex items-center text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      <span className="truncate">{student.parentInfo.name}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    <div>
                      <p className="font-medium text-gray-900">{student.disciplinaryHistory.totalActions}</p>
                      <p className="text-gray-600">Actions</p>
                    </div>
                    <div>
                      <p className="font-medium text-orange-600">{student.disciplinaryHistory.activeWarnings}</p>
                      <p className="text-gray-600">Warnings</p>
                    </div>
                    <div>
                      <p className="font-medium text-red-600">{student.disciplinaryHistory.redWarrants}</p>
                      <p className="text-gray-600">Red Warrants</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : selectedGrade ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">
                No students found for Grade {selectedGrade}{selectedSection ? ` - Section ${selectedSection}` : ''} matching your criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Grade</h3>
              <p className="text-gray-600">
                Please select a grade to view students.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherStudentView;