import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  CalendarX,
  Timer,
  Save,
  RefreshCw,
} from "lucide-react";
import { teacherApi } from "../../services/teacher.api";
import { showApiError, showToast } from "../../utils/toast";

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  isPresent: boolean | null;
  autoStatus?: string | null;
  autoMarkedAt?: string | null; // ✅ NEW: Camera detection timestamp
  finalStatus?: string | null;
  finalSource?: 'auto' | 'teacher' | 'finalizer' | null;
  teacherOverride?: boolean;
}

interface HolidayEvent {
  id: string;
  title?: string;
  date?: string;
}

interface Period {
  id: string;
  subject: string;
  grade: string;
  section: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  canMarkAttendance: boolean;
  // Add required IDs for API calls
  classId: string;
  subjectId: string;
  periodNumber: number;
  isHoliday?: boolean;
  holidayEvents?: HolidayEvent[];
  timeStatus?: string;
}

interface CurrentPeriod extends Period {
  students?: Student[];
}

const TeacherAttendanceManagement: React.FC = () => {
  const [currentPeriods, setCurrentPeriods] = useState<Period[]>([]);
  const [holidayPeriods, setHolidayPeriods] = useState<Period[]>([]);
  const [holidayNotice, setHolidayNotice] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<CurrentPeriod | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCurrentPeriods();
    // Refresh every minute to check for new periods
    const interval = setInterval(loadCurrentPeriods, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadCurrentPeriods = async () => {
    try {
      setLoading(true);
      const response = await teacherApi.getCurrentPeriods();
      if (response.data.success) {
        const payload = response.data.data || {};
        setCurrentPeriods(payload.currentPeriods || []);
        setHolidayPeriods(payload.holidayPeriods || []);
        setHolidayNotice(payload.holidayNotice || null);
      }
    } catch (error: any) {
      console.error("Failed to load current periods:", error);
      showApiError(error, "Unable to load your class periods");
    } finally {
      setLoading(false);
    }
  };

  const selectPeriodForAttendance = async (period: Period) => {
    if (!period.canMarkAttendance) {
      showToast.warning("Attendance can only be marked during the active period");
      return;
    }

    try {
      setLoading(true);
      const response = await teacherApi.getStudentsForAttendance(
        period.classId,
        period.subjectId,
        period.periodNumber
      );

      if (response.data.success) {
        const studentsData = response.data.data.students || [];
        const mappedStudents: Student[] = studentsData.map((student: any) => ({
          id: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
          autoStatus: student.autoStatus || null,
          autoMarkedAt: student.autoMarkedAt || null, // ✅ NEW: Include timestamp
          finalStatus: student.finalStatus || null,
          finalSource: student.finalSource || null,
          teacherOverride: student.teacherOverride || false,
          isPresent:
            student.currentStatus === 'present'
              ? true
              : student.currentStatus === 'absent'
              ? false
              : null,
        }));
        setStudents(mappedStudents);
        setSelectedPeriod({ ...period, students: mappedStudents });
      }
    } catch (error: any) {
      console.error("Failed to load students:", error);
      showApiError(error, "Unable to load student list for this class");
    } finally {
      setLoading(false);
    }
  };

  const markStudentAttendance = (studentId: string, isPresent: boolean) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId
          ? { ...student, isPresent }
          : student
      )
    );
  };

  const markAllPresent = () => {
    setStudents(prev =>
      prev.map(student => ({ ...student, isPresent: true }))
    );
  };

  const markAllAbsent = () => {
    setStudents(prev =>
      prev.map(student => ({ ...student, isPresent: false }))
    );
  };

  const submitAttendance = async () => {
    if (!selectedPeriod) return;

    const unmarkedStudents = students.filter(s => s.isPresent === null);
    if (unmarkedStudents.length > 0) {
      if (!confirm(`${unmarkedStudents.length} students are unmarked. Submit anyway?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      const attendanceData = {
        classId: selectedPeriod.classId,
        subjectId: selectedPeriod.subjectId,
        grade: parseInt(selectedPeriod.grade),
        section: selectedPeriod.section,
        date: new Date().toISOString().split('T')[0],
        period: selectedPeriod.periodNumber,
        students: students
          .filter(s => s.isPresent !== null)
          .map(s => ({
            studentId: s.id,
            status: s.isPresent ? "present" as const : "absent" as const,
          })),
      };

      const response = await teacherApi.markStudentAttendance(attendanceData);

      if (response.data.success) {
        showToast.success("Attendance marked successfully!");
        setSelectedPeriod(null);
        setStudents([]);
        loadCurrentPeriods(); // Refresh periods
      }
    } catch (error: any) {
      console.error("Failed to submit attendance:", error);
      showApiError(error, "Unable to save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ✅ NEW: Helper function to format timestamp
  const formatTime = (timestamp: string | null | undefined) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (selectedPeriod) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
            <p className="text-gray-600">
              {selectedPeriod.subject} - Grade {selectedPeriod.grade} - Section {selectedPeriod.section}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <Timer className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">
                {selectedPeriod.startTime} - {selectedPeriod.endTime}
              </span>
            </div>
            <Button
              onClick={() => setSelectedPeriod(null)}
              variant="outline"
            >
              Back to Periods
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button
                onClick={markAllPresent}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All Present
              </Button>
              <Button
                onClick={markAllAbsent}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Mark All Absent
              </Button>
              <div className="ml-auto">
                <Button
                  onClick={submitAttendance}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Submit Attendance
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Students ({students.length})</span>
              <span className="text-sm text-gray-500">Current Time: {getCurrentTime()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {student.rollNumber}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-500">Roll No: {student.rollNumber}</p>
                      <div className="flex space-x-2 mt-1">
                        {student.autoStatus === 'present' && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            📷 Camera detected{student.autoMarkedAt && ` at ${formatTime(student.autoMarkedAt)}`}
                          </span>
                        )}
                        {student.finalStatus && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            Final: {student.finalStatus.toUpperCase()} ({
                              student.finalSource === 'teacher'
                                ? 'Teacher'
                                : student.finalSource === 'finalizer'
                                ? 'Auto-finalized'
                                : 'Auto'
                            })
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => markStudentAttendance(student.id, true)}
                      className={`${
                        student.isPresent === true
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-green-100"
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Present
                    </Button>
                    <Button
                      onClick={() => markStudentAttendance(student.id, false)}
                      className={`${
                        student.isPresent === false
                          ? "bg-red-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-red-100"
                      }`}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Absent
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
          <p className="text-gray-600">Mark attendance for your current periods</p>
        </div>
        <Button onClick={loadCurrentPeriods} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Current Time */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-4">
            <Clock className="h-6 w-6 text-blue-600" />
            <div className="text-center">
              <p className="text-lg font-semibold text-blue-900">
                Current Time: {getCurrentTime()}
              </p>
              <p className="text-sm text-blue-700">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Periods */}
      {loading ? (
          <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading current periods...</p>
            </div>
          </CardContent>
        </Card>
      ) : currentPeriods.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {currentPeriods.map((period) => (
            <Card
              key={period.id}
              className={`cursor-pointer transition-all ${
                period.isActive
                  ? "border-green-500 bg-green-50"
                  : period.canMarkAttendance
                  ? "border-blue-500 bg-blue-50 hover:bg-blue-100"
                  : "border-gray-300 bg-gray-50"
              }`}
              onClick={() => selectPeriodForAttendance(period)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>{period.subject}</span>
                  {period.isActive && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    Grade {period.grade} - Section {period.section}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {period.startTime} - {period.endTime}
                  </div>
                  <div className="mt-3">
                    {period.canMarkAttendance ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Can mark attendance</span>
                      </div>
                    ) : period.isActive ? (
                      <div className="flex items-center text-blue-600">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        <span className="text-sm">Period in progress</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500">
                        <XCircle className="h-4 w-4 mr-2" />
                        <span className="text-sm">Attendance window closed</span>
                      </div>
                    )}
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
              {holidayNotice ? (
                <>
                  <CalendarX className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-orange-600 mb-2">School Holiday</h3>
                  <p className="text-gray-700 max-w-md mx-auto">{holidayNotice}</p>
                  {holidayPeriods.length > 0 && (
                    <div className="mt-4 text-sm text-gray-600 max-w-md mx-auto space-y-2">
                      {holidayPeriods.map((period) => (
                        <div
                          key={`${period.classId}-${period.periodNumber}`}
                          className="border border-orange-200 rounded-md px-3 py-2 bg-orange-50"
                        >
                          <div className="font-semibold text-orange-700">
                            Grade {period.grade} • Section {period.section}
                          </div>
                          <div className="text-orange-600 text-sm">
                            Period {period.periodNumber} · {period.startTime} - {period.endTime}
                          </div>
                          {period.holidayEvents && period.holidayEvents.length > 0 && (
                            <div className="text-xs text-orange-500 mt-1">
                              {period.holidayEvents
                                .map((event) => event.title || "Holiday")
                                .join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-4">
                    Attendance marking is disabled for holiday periods.
                  </p>
                </>
              ) : (
                <>
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Periods</h3>
                  <p className="text-gray-600">
                    No periods are currently active for attendance marking.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Periods will appear here during school hours when you can mark attendance.
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherAttendanceManagement;
