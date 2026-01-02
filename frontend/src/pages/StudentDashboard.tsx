import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiService } from "@/services";
import MobileNavigation from "../components/layout/MobileNavigation";
import StudentProfile from "../components/student/StudentProfile";
import AttendanceView from "../components/student/AttendanceView";
import GradeView from "../components/student/GradeView";
import HomeworkView from "../components/student/HomeworkView";
import ScheduleView from "../components/student/ScheduleView";
import StudentDisciplinaryActions from "../components/student/StudentDisciplinaryActions";
import EventCalendar from '../components/ui/EventCalendar';
import MessagingCenter from "../components/messaging/MessagingCenter";

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.student.getDashboard();
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const navigationItems = [
    { label: "Dashboard", href: "/student" },
    { label: "My Profile", href: "/student/profile" },
    { label: "My Attendance", href: "/student/attendance" },
    { label: "My Grades", href: "/student/grades" },
    { label: "Homework", href: "/student/homework" },
    { label: "Class Schedule", href: "/student/schedule" },
    { label: "Calendar", href: "/student/calendar" },
    { label: "Red Warrants", href: "/student/disciplinary" },
    { label: "Messages", href: "/student/messages" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <MobileNavigation
        title="Student Dashboard"
        subtitle={`Welcome back, ${user?.fullName}`}
        navItems={navigationItems}
        onLogout={handleLogout}
        primaryColor="indigo"
      />

      <main className="pt-4 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route
              path="/"
              element={<StudentHome dashboardData={dashboardData} />}
            />
            <Route path="/profile" element={<StudentProfile />} />
            <Route path="/attendance" element={<AttendanceView />} />
            <Route path="/grades" element={<GradeView />} />
            <Route path="/homework" element={<HomeworkView />} />
            <Route path="/schedule" element={<ScheduleView />} />
            <Route path="/calendar" element={
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">School Calendar</h1>
                <EventCalendar
                  onEventClick={(_event) => {
                    // Handle event click - could show a modal with event details  
                  }}
                />
              </div>
            } />
            <Route path="/disciplinary" element={<StudentDisciplinaryActions />} />
            <Route
              path="/messages"
              element={
                <div className="p-4 sm:p-6">
                  <MessagingCenter
                    title="Messages"
                    subtitle="Connect with your teachers and guardians"
                  />
                </div>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const StudentHome: React.FC<{ dashboardData: any }> = ({ dashboardData }) => {
  return (
    <div className="space-y-6">
      {/* Welcome Header with Role Guidance */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 sm:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Student Portal</h1>
            <p className="text-indigo-100 text-sm sm:text-base mb-3">
              Track your academic progress, view assignments, and stay organized
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-white/20 px-2 py-1 rounded-full">📚 View Grades</span>
              <span className="bg-white/20 px-2 py-1 rounded-full">📝 Complete Homework</span>
              <span className="bg-white/20 px-2 py-1 rounded-full">📅 Check Schedule</span>
              <span className="bg-white/20 px-2 py-1 rounded-full">📊 Track Attendance</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center text-sm">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              <span>Student</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
          My Academic Overview
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow-sm p-4 sm:p-6 border border-green-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-200 rounded-lg">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-green-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-green-700 font-medium">
                  Attendance
                </p>
                <p className="text-lg sm:text-2xl font-bold text-green-900">
                  {dashboardData?.attendancePercentage || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-sm p-4 sm:p-6 border border-blue-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-200 rounded-lg">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-blue-700 font-medium">
                  Overall Grade
                </p>
                <p className="text-lg sm:text-2xl font-bold text-blue-900">
                  {dashboardData?.overallGrade || "A"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg shadow-sm p-4 sm:p-6 border border-yellow-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-200 rounded-lg">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-yellow-700 font-medium">
                  Pending Homework
                </p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-900">
                  {dashboardData?.pendingHomework || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow-sm p-4 sm:p-6 border border-purple-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-200 rounded-lg">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3a4 4 0 118 0v4m-4 12v-4m0 0a7 7 0 01-7-7V8a1 1 0 011-1h12a1 1 0 011 1v1a7 7 0 01-7 7z"
                  />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-purple-700 font-medium">
                  Today's Classes
                </p>
                <p className="text-lg sm:text-2xl font-bold text-purple-900">
                  {dashboardData?.todayClasses || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Status Card */}
        <FeeStatusCard />

        {/* Daily Learning Guide */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Your Learning Journey
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-200">
              <div className="text-center">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 12v-4m0 0a7 7 0 01-7-7V8a1 1 0 011-1h12a1 1 0 011 1v1a7 7 0 01-7 7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Check Schedule</h4>
                <p className="text-xs text-gray-600 mt-1">Today's classes</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-200">
              <div className="text-center">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Complete Homework</h4>
                <p className="text-xs text-gray-600 mt-1">Stay on track</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-200">
              <div className="text-center">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Review Grades</h4>
                <p className="text-xs text-gray-600 mt-1">Track progress</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-200">
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Check Attendance</h4>
                <p className="text-xs text-gray-600 mt-1">Monitor presence</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-sm text-indigo-800 text-center">
              <strong>Study Tip:</strong> Check your schedule first, complete homework early, and review grades regularly!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Recent Grades
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {dashboardData?.recentGrades
                ?.slice(0, 5)
                .map((grade: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {grade.subject}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600 ml-2">
                      {grade.grade}
                    </span>
                  </div>
                )) || (
                <div className="text-center py-4">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <p className="text-gray-500 text-sm">
                    No recent grades available.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Grades will appear here once your teacher starts grading
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Upcoming Assignments
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {dashboardData?.upcomingAssignments
                ?.slice(0, 5)
                .map((assignment: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border hover:border-yellow-200 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="mb-1 sm:mb-0 flex items-center">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {assignment.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {assignment.subject}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-red-600 font-medium">
                        {assignment.dueDate}
                      </span>
                    </div>
                  </div>
                )) || (
                <div className="text-center py-4">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 text-sm">
                    No upcoming assignments.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Your teachers will assign homework here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Calendar Preview */}
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 12v-4m0 0a7 7 0 01-7-7V8a1 1 0 011-1h12a1 1 0 011 1v1a7 7 0 01-7 7z" />
                </svg>
                Today's Events
              </h3>
              <a 
                href="/student/calendar" 
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View Full Calendar →
              </a>
            </div>
            <EventCalendar
              onEventClick={(_event) => {
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Fee Status Component
const FeeStatusCard: React.FC = () => {
  const [feeStatus, setFeeStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeeStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFeeStatus = async () => {
    try {
      setLoading(true);
      // First get student dashboard to get studentId
      const dashboardResponse = await apiService.student.getDashboard();
      if (!dashboardResponse.data.success) {
        console.error("Failed to load dashboard");
        return;
      }

      const studentData = dashboardResponse.data.data;
      const studentId = studentData?.student?.studentId || studentData?.studentId;
      
      if (!studentId) {
        console.error("Student ID not found in dashboard data");
        return;
      }

      const response = await apiService.fee.getStudentFeeStatusDetailed(studentId);
      if (response.data) {
        setFeeStatus(response.data);
      }
    } catch (error) {
      console.error("Failed to load fee status:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!feeStatus || !feeStatus.hasFeeRecord) {
    return null;
  }

  const admissionRemaining = feeStatus.admissionFeeAmount - feeStatus.admissionFeePaid;

  return (
    <div className="mb-6">
      {/* Admission Fee Pending Alert */}
      {feeStatus.admissionPending && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-orange-800">
                Admission Fee Pending
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>
                  You have a pending admission fee of{" "}
                  <strong>{formatCurrency(admissionRemaining)}</strong> remaining.
                </p>
                <p className="mt-1 text-xs">
                  Please contact the accounts office to complete your payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fee Status Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Fee Status
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              feeStatus.status === "paid"
                ? "bg-green-100 text-green-800"
                : feeStatus.status === "partial"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {feeStatus.status === "paid"
              ? "All Paid"
              : feeStatus.status === "partial"
              ? "Partially Paid"
              : "Pending"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-600 mb-1">Total Fee</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(feeStatus.totalFeeAmount)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-600 mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(feeStatus.totalPaidAmount)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-600 mb-1">Due</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(feeStatus.totalDueAmount)}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Monthly Dues</p>
                <p className="text-lg font-bold text-blue-900">
                  {formatCurrency(feeStatus.monthlyDues)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {feeStatus.pendingMonths} month(s) pending
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3a4 4 0 118 0v4m-4 12v-4m0 0a7 7 0 01-7-7V8a1 1 0 011-1h12a1 1 0 011 1v1a7 7 0 01-7 7z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">One-Time Fees</p>
                <p className="text-lg font-bold text-orange-900">
                  {formatCurrency(feeStatus.oneTimeDues)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {feeStatus.admissionPending ? "Admission pending" : "All paid"}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Next Due Payment */}
        {feeStatus.nextDue && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">
                  Next Payment Due:{" "}
                  <span className="font-bold">
                    {formatCurrency(feeStatus.nextDue.amount)}
                  </span>
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Due Date: {new Date(feeStatus.nextDue.dueDate).toLocaleDateString()}
                  {feeStatus.nextDue.isOverdue && (
                    <span className="ml-2 text-red-600 font-semibold">(OVERDUE)</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {feeStatus.recentTransactions && feeStatus.recentTransactions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Recent Payments
            </h4>
            <div className="space-y-2">
              {feeStatus.recentTransactions.slice(0, 3).map((txn: any) => (
                <div
                  key={txn._id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border text-sm"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(txn.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(txn.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">{txn.paymentMethod}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
