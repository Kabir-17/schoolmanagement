import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  AlertTriangle,
  Users,
  X,
  Clock,
  ShieldAlert,
  ShieldCheck,
  FileText,
  AlertOctagon,
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
  disciplinaryHistory?: {
    totalActions: number;
    activeWarnings: number;
    totalPoints: number;
    redWarrants: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

interface PunishmentType {
  id: string;
  name: string;
  description: string;
  severity: 'high' | 'critical';
  color: string;
  icon: React.ReactNode;
  warrantLevel: 'red';
}

const TeacherPunishmentSystem: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showPunishmentForm, setShowPunishmentForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [stats, setStats] = useState({
    redWarrants: 0,
    pendingFollowUps: 0,
    resolved: 0,
  });
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    punishmentType: '',
    severity: 'high' as 'high' | 'critical',
    category: 'discipline',
    title: '',
    description: '',
    reason: '',
    actionTaken: '',
    incidentDate: new Date().toISOString().split('T')[0],
    witnesses: [] as string[],
    urgentNotification: true,
  });

  const punishmentTypes: PunishmentType[] = [
    {
      id: 'major_misconduct',
      name: 'Major Misconduct',
      description: 'Serious behavioral violations requiring immediate action',
      severity: 'critical',
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: <AlertOctagon className="h-5 w-5" />,
      warrantLevel: 'red'
    },
    {
      id: 'violence',
      name: 'Violence/Fighting',
      description: 'Physical altercations or threatening behavior',
      severity: 'critical',
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: <ShieldAlert className="h-5 w-5" />,
      warrantLevel: 'red'
    },
    {
      id: 'cheating',
      name: 'Academic Dishonesty',
      description: 'Cheating, plagiarism, or exam fraud',
      severity: 'high',
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      icon: <FileText className="h-5 w-5" />,
      warrantLevel: 'red'
    },
    {
      id: 'property_damage',
      name: 'Property Damage',
      description: 'Vandalism or destruction of school property',
      severity: 'high',
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: <AlertTriangle className="h-5 w-5" />,
      warrantLevel: 'red'
    },
    {
      id: 'substance_abuse',
      name: 'Substance Related',
      description: 'Possession or use of prohibited substances',
      severity: 'critical',
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: <ShieldAlert className="h-5 w-5" />,
      warrantLevel: 'red'
    },
  ];

  useEffect(() => {
    loadDisciplinaryStats();
    if (selectedGrade) {
      loadStudentsByGrade();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrade, selectedSection]);

  const loadDisciplinaryStats = async () => {
    try {
      // Temporarily remove the isRedWarrant filter to get all actions
      const response = await teacherApi.getMyDisciplinaryActions({});
      
      if (response.data.success) {
        const data = response.data.data;
        
        if (data.stats) {
          const newStats = {
            redWarrants: data.stats.redWarrants || 0,
            pendingFollowUps: data.stats.overdueFollowUps || 0,
            resolved: data.stats.resolvedActions || 0,
          };
          setStats(newStats);
        }
        
        // Get recent actions (filter for red warrants in frontend)
        if (data.actions) {
          const redWarrantActions = data.actions.filter((action: any) => action.isRedWarrant);
          setRecentActions(redWarrantActions.slice(0, 5)); // Get latest 5
        }
      } else {
        toast.error('Failed to load stats: API response not successful');
      }
    } catch (error: any) {
      console.error("Failed to load disciplinary stats:", error);
      
      // Show different messages based on error type
      if (error.response?.status === 401) {
        toast.error('Please log in to view disciplinary statistics');
      } else {
        toast.error(`Failed to load stats: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const loadStudentsByGrade = async () => {
    try {
      setLoading(true);
      let endpoint = `/teachers/students/grade/${selectedGrade}`;
      if (selectedSection) {
        endpoint += `/section/${selectedSection}`;
      }
      
      const response = await teacherApi.get(endpoint);
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

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    setLoading(true);
    try {
      const punishmentData = {
        studentIds: selectedStudents,
        ...formData,
        actionType: 'red_warrant',
        warrantLevel: 'red',
        followUpRequired: true,
        isAppealable: true,
        appealDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };

      const response = await teacherApi.post('/teachers/discipline/punishment', punishmentData);

      if (response.data.success) {
        toast.success(`Red warrant issued to ${selectedStudents.length} student(s)!`, {
          description: "Parents and administration have been notified immediately.",
          duration: 5000,
        });
        setShowPunishmentForm(false);
        setSelectedStudents([]);
        setFormData({
          punishmentType: '',
          severity: 'high',
          category: 'discipline',
          title: '',
          description: '',
          reason: '',
          actionTaken: '',
          incidentDate: new Date().toISOString().split('T')[0],
          witnesses: [],
          urgentNotification: true,
        });
        
        // Refresh stats after issuing new warrant
        loadDisciplinaryStats();
      }
    } catch (error: any) {
      console.error("Failed to issue punishment:", error);
      toast.error(error.response?.data?.message || "Failed to issue punishment");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskLevelColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-100 border-red-300';
      case 'medium': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'low': return 'text-green-600 bg-green-100 border-green-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  if (showPunishmentForm) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900">Issue Red Warrant</h2>
            <p className="text-sm sm:text-base text-red-700">Issue serious disciplinary actions with immediate notification</p>
          </div>
          <Button
            onClick={() => setShowPunishmentForm(false)}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 shrink-0 w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
          {/* Student Selection */}
          <Card className="border-red-200">
            <CardHeader className="bg-red-50 rounded-t-xl">
              <CardTitle className="flex items-center text-red-900 text-lg sm:text-xl">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                Select Students ({selectedStudents.length} selected)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Grade and Section Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade *
                  </label>
                  <select aria-label='Select Grade'
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
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
                  <select  aria-label='Select Section'
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">All Sections</option>
                    {['A','B','C','D','E'].map(section => (
                      <option key={section} value={section}>Section {section}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-sm"
                />
              </div>

              <div className="h-64 sm:h-80 overflow-y-auto space-y-2">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`p-4 sm:p-5 lg:p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedStudents.includes(student.id)
                        ? 'border-red-500 bg-red-50 shadow-md'
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                    onClick={() => handleStudentSelect(student.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-base sm:text-lg text-gray-900 mb-1">{student.name}</p>
                        <p className="text-sm sm:text-base text-gray-600">
                          Roll: {student.rollNumber} | Grade {student.grade} - {student.section}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {student.disciplinaryHistory && (
                          <div className="text-xs sm:text-sm space-y-1">
                            <div className={`px-2 py-1 rounded-lg border text-xs sm:text-sm font-medium ${getRiskLevelColor(student.disciplinaryHistory.riskLevel)}`}>
                              Risk: {student.disciplinaryHistory.riskLevel?.toUpperCase()}
                            </div>
                            {student.disciplinaryHistory.redWarrants > 0 && (
                              <div className="text-red-600 text-xs sm:text-sm font-semibold">
                                {student.disciplinaryHistory.redWarrants} Red Warrants
                              </div>
                            )}
                          </div>
                        )}
                        <input aria-label='Select Student'
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleStudentSelect(student.id)}
                          className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Punishment Form */}
          <Card className="border-red-200">
            <CardHeader className="bg-red-50 rounded-t-xl">
              <CardTitle className="flex items-center text-red-900 text-xl sm:text-2xl lg:text-3xl">
                <AlertOctagon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 mr-3" />
                Red Warrant Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 lg:p-10">
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                <div>
                  <label className="block text-sm sm:text-base lg:text-lg font-semibold text-gray-700 mb-4">
                    Violation Type *
                  </label>
                  <div className="space-y-3 sm:space-y-4">
                    {punishmentTypes.map((type) => (
                      <label
                        key={type.id}
                        className={`flex items-center p-4 sm:p-5 lg:p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                          formData.punishmentType === type.id
                            ? `${type.color} border-current shadow-md`
                            : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="punishmentType"
                          value={type.id}
                          checked={formData.punishmentType === type.id}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${type.color.split(' ')[1]} ${type.color.split(' ')[0]}`}>
                            {type.icon}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{type.name}</p>
                            <p className="text-sm text-gray-600">{type.description}</p>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                              type.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {type.severity.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (Brief Summary) *
                  </label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Physical altercation during lunch break"
                    required
                    className="border-red-200 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Provide detailed description of the incident, circumstances, and evidence..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Disciplinary Action *
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Explain the specific reason why this disciplinary action is necessary..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Immediate Action Taken *
                  </label>
                  <textarea
                    name="actionTaken"
                    value={formData.actionTaken}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Describe immediate actions taken (separation, confiscation, medical attention, etc.)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incident Date *
                  </label>
                  <Input
                    type="date"
                    name="incidentDate"
                    value={formData.incidentDate}
                    onChange={handleInputChange}
                    required
                    className="border-red-200 focus:ring-red-500"
                  />
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <p className="font-semibold">Warning:</p>
                      <p>This will immediately notify:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Student and parents via SMS and email</li>
                        <li>Principal and vice-principal</li>
                        <li>Academic coordinator</li>
                        <li>School administration</li>
                      </ul>
                      <p className="mt-2">Parent meeting may be required within 48 hours.</p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || selectedStudents.length === 0 || !formData.punishmentType}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Issuing Red Warrant...
                    </>
                  ) : (
                    <>
                      <AlertOctagon className="h-4 w-4 mr-2" />
                      Issue Red Warrant to {selectedStudents.length} Student(s)
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Serious Disciplinary Actions</h2>
          <p className="text-sm sm:text-base text-gray-600">Issue red warrants for major violations requiring immediate intervention</p>
        </div>
        <Button
          onClick={() => setShowPunishmentForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white shrink-0 w-full sm:w-auto"
        >
          <AlertOctagon className="h-4 w-4 mr-2" />
          Issue Red Warrant
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-red-200">
          <CardContent>
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
                <AlertOctagon className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-500">Red Warrants Issued</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.redWarrants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent>
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-500">Pending Follow-up</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.pendingFollowUps}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent>
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-500">Resolved</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Red Warrants</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActions.length > 0 ? (
            <div className="space-y-3">
              {recentActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="text-sm text-gray-600">{action.studentName} - {action.studentRoll}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(action.issuedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      action.status === 'active' ? 'bg-red-100 text-red-800' :
                      action.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {action.status.toUpperCase()}
                    </span>
                    {action.severity === 'critical' && (
                      <span className="px-2 py-1 bg-red-200 text-red-800 rounded-full text-xs font-medium">
                        CRITICAL
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No red warrants issued yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherPunishmentSystem;