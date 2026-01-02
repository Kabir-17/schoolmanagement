import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  UserCheck,
  TrendingUp,
  Bell,
  MessageSquareWarning,
} from "lucide-react";
import { toast } from "sonner";
import { teacherApi } from "../services/teacher.api";
import TeacherAttendanceManagement from "../components/teacher/TeacherAttendanceManagement";
import TeacherHomeworkManagement from "../components/teacher/TeacherHomeworkManagement";
import TeacherDisciplinaryWarnings from "../components/teacher/TeacherDisciplinaryWarnings";
import TeacherExamGrading from "../components/teacher/TeacherExamGrading";
import TeacherScheduleView from "../components/teacher/TeacherScheduleView";

interface DashboardData {
  teacher: {
    name: string;
    email: string;
    subjects: string[];
    classes: Array<{
      grade: string;
      section: string;
      subject: string;
      studentsCount: number;
    }>;
  };
  stats: {
    totalStudents: number;
    classesToday: number;
    pendingAttendance: number;
    homeworkAssigned: number;
    examsPending: number;
    warningsIssued: number;
  };
  todaySchedule: Array<{
    id: string;
    startTime: string;
    endTime: string;
    subject: string;
    grade: string;
    section: string;
    room: string;
    isActive: boolean;
    attendanceMarked: boolean;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

const TeacherDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'homework' | 'discipline' | 'grading' | 'schedule'>('dashboard');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await teacherApi.getTeacherDashboard();
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to load dashboard data:", error);
      toast.error(error.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'attendance': return <UserCheck className="h-4 w-4" />;
      case 'homework': return <BookOpen className="h-4 w-4" />;
      case 'grading': return <GraduationCap className="h-4 w-4" />;
      case 'warning': return <MessageSquareWarning className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  if (activeTab !== 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
              {[
                { key: 'dashboard', label: 'Dashboard', icon: <TrendingUp className="h-4 w-4" /> },
                { key: 'attendance', label: 'Attendance', icon: <UserCheck className="h-4 w-4" /> },
                { key: 'homework', label: 'Homework', icon: <BookOpen className="h-4 w-4" /> },
                { key: 'discipline', label: 'Discipline', icon: <MessageSquareWarning className="h-4 w-4" /> },
                { key: 'grading', label: 'Grading', icon: <GraduationCap className="h-4 w-4" /> },
                { key: 'schedule', label: 'Schedule', icon: <Calendar className="h-4 w-4" /> },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  variant={activeTab === tab.key ? 'default' : 'ghost'}
                  className={`flex items-center px-4 py-2 ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.icon}
                  <span className="ml-2">{tab.label}</span>
                </Button>
              ))}
            </nav>
          </div>

          {activeTab === 'attendance' && <TeacherAttendanceManagement />}
          {activeTab === 'homework' && <TeacherHomeworkManagement />}
          {activeTab === 'discipline' && <TeacherDisciplinaryWarnings />}
          {activeTab === 'grading' && <TeacherExamGrading />}
          {activeTab === 'schedule' && <TeacherScheduleView />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: <TrendingUp className="h-4 w-4" /> },
              { key: 'attendance', label: 'Attendance', icon: <UserCheck className="h-4 w-4" /> },
              { key: 'homework', label: 'Homework', icon: <BookOpen className="h-4 w-4" /> },
              { key: 'discipline', label: 'Discipline', icon: <MessageSquareWarning className="h-4 w-4" /> },
              { key: 'grading', label: 'Grading', icon: <GraduationCap className="h-4 w-4" /> },
              { key: 'schedule', label: 'Schedule', icon: <Calendar className="h-4 w-4" /> },
            ].map((tab) => (
              <Button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                variant={activeTab === tab.key ? 'default' : 'ghost'}
                className={`flex items-center px-4 py-2 ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </Button>
            ))}
          </nav>
        </div>

        {/* Welcome Section */}
        {dashboardData && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {dashboardData.teacher.name}!
            </h1>
            <p className="text-blue-100 mb-4">
              Here's your teaching dashboard overview for today
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                {dashboardData.teacher.subjects.join(', ')}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {dashboardData.teacher.classes.length} Classes
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {dashboardData.stats.classesToday} Periods Today
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Clock className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading dashboard...</p>
              </div>
            </CardContent>
          </Card>
        ) : dashboardData ? (
          <>
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData.stats.totalStudents}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Classes Today</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData.stats.classesToday}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <UserCheck className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Pending Attendance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData.stats.pendingAttendance}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Homework Assigned</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData.stats.homeworkAssigned}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-indigo-50 border-indigo-200">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <GraduationCap className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Exams Pending</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData.stats.examsPending}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <MessageSquareWarning className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Warnings Issued</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData.stats.warningsIssued}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule & Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Today's Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.todaySchedule.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.todaySchedule.map((period) => (
                        <div
                          key={period.id}
                          className={`p-3 border rounded-lg ${
                            period.isActive
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {period.subject}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Grade {period.grade} - {period.section} • Room {period.room}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatTime(period.startTime)} - {formatTime(period.endTime)}
                              </p>
                              <div className="flex items-center justify-end mt-1">
                                {period.isActive && (
                                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded mr-2">
                                    Active
                                  </span>
                                )}
                                {!period.attendanceMarked && (
                                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                                    Mark Attendance
                                  </span>
                                )}
                                {period.attendanceMarked && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No classes scheduled for today</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                          <div className="p-1 bg-blue-100 rounded-lg mt-1">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                              {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <Button
                    onClick={() => setActiveTab('attendance')}
                    className="h-24 flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserCheck className="h-6 w-6 mb-2" />
                    <span>Mark Attendance</span>
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab('homework')}
                    className="h-24 flex flex-col items-center justify-center bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <BookOpen className="h-6 w-6 mb-2" />
                    <span>Assign Homework</span>
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab('discipline')}
                    className="h-24 flex flex-col items-center justify-center bg-red-600 hover:bg-red-700 text-white"
                  >
                    <MessageSquareWarning className="h-6 w-6 mb-2" />
                    <span>Issue Warning</span>
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab('grading')}
                    className="h-24 flex flex-col items-center justify-center bg-green-600 hover:bg-green-700 text-white"
                  >
                    <GraduationCap className="h-6 w-6 mb-2" />
                    <span>Grade Exams</span>
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab('schedule')}
                    className="h-24 flex flex-col items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Calendar className="h-6 w-6 mb-2" />
                    <span>View Schedule</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load dashboard</h3>
                <p className="text-gray-600 mb-4">
                  There was an error loading your dashboard data.
                </p>
                <Button onClick={loadDashboardData}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;