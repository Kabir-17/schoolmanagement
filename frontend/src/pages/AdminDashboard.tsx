import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { adminApi } from "../services/admin.api";
import MobileNavigation from "../components/layout/MobileNavigation";
import StudentList, {
  StudentListRef,
} from "../components/admin/student/StudentList";
import StudentForm from "../components/admin/student/StudentForm";
import TeacherList, { TeacherListRef } from "../components/admin/TeacherList";
import SubjectManagement from "../components/admin/SubjectManagement";
import ScheduleManagement from "../components/admin/ScheduleManagement";
import AcademicCalendar from "../components/admin/AcademicCalendar";
import TeacherDetailView from "../components/admin/TeacherDetailView";
import AdminDisciplinaryActionsManager from "../components/admin/AdminDisciplinaryActionsManager";
import SchoolSettings from "../components/admin/SchoolSettings";
import AccountantManagement from "../components/admin/accountant/AccountantManagement";
import FinancialDashboard from "../components/admin/FinancialDashboard";
import FeeStructureManagement from "../components/admin/FeeStructureManagement";
import AutoAttendApiKeyManager from "../components/admin/AutoAttendApiKeyManager";
import AutoAttendEventsViewer from "../components/admin/AutoAttendEventsViewer";
import AdminAssessments from "../components/admin/AdminAssessments";
import AttendanceSmsSettings from "../components/admin/AttendanceSmsSettings";
import AbsenceSmsMonitor from "../components/admin/AbsenceSmsMonitor";

import MinimalTeacherForm from "../components/admin/teacher/MinimalTeacherForm";

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/students", label: "Students" },
    { href: "/admin/teachers", label: "Teachers" },
    { href: "/admin/accountants", label: "Accountants" },
    { href: "/admin/subjects", label: "Subjects" },
    { href: "/admin/schedules", label: "Schedules" },
    { href: "/admin/disciplinary-actions", label: "Disciplinary Actions" },
    { href: "/admin/calendar", label: "Calendar" },
    { href: "/admin/financial", label: "Financial" },
    { href: "/admin/assessments", label: "Assessments" },
    { href: "/admin/attendance/camera-events", label: "📹 Camera Events" },
    { href: "/admin/settings", label: "School Settings" },
    { href: "/admin/settings/autoattend-api", label: "🔑 Auto-Attend API" },
    { href: "/admin/settings/absence-sms", label: "Absence SMS" },
    { href: "/admin/attendance/absence-sms", label: "Absence SMS Monitor" },
    {
      href: "/admin/settings/autoattend-api/events",
      label: "📊 Auto-Attend Events",
    },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboard();

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        console.error("Dashboard API returned success: false", response.data);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <MobileNavigation
        title="Admin Dashboard"
        subtitle={`Welcome back, ${user?.username}`}
        navItems={navItems}
        onLogout={handleLogout}
        primaryColor="blue"
      />

      <main className="max-w-7xl text-lg xl:text-xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route
            path="/"
            element={<AdminHome dashboardData={dashboardData} />}
          />
          <Route
            path="/students"
            element={<StudentManagement onDataChange={loadDashboardData} />}
          />
          <Route path="/teachers" element={<TeacherManagement />} />
          <Route path="/accountants" element={<AccountantManagement />} />
          <Route path="/subjects" element={<SubjectManagementPage />} />
          <Route path="/schedules" element={<ScheduleManagementPage />} />
          <Route
            path="/disciplinary-actions"
            element={<AdminDisciplinaryActionsManager />}
          />
          <Route path="/calendar" element={<CalendarManagementPage />} />
          <Route path="/financial" element={<FinancialDashboard />} />
          <Route path="/assessments" element={<AdminAssessments />} />
          <Route
            path="/attendance/camera-events"
            element={<AutoAttendEventsViewerPage />}
          />
          <Route path="/settings" element={<SchoolSettingsPage />} />
          <Route
            path="/settings/fee-structures"
            element={<FeeStructureManagement />}
          />
          <Route
            path="/settings/autoattend-api"
            element={<AutoAttendApiKeyManagerPage />}
          />
          <Route
            path="/settings/autoattend-api/events"
            element={<AutoAttendEventsViewerPage />}
          />
          <Route
            path="/settings/absence-sms"
            element={<AttendanceSmsSettings />}
          />
          <Route
            path="/attendance/absence-sms"
            element={<AbsenceSmsMonitor />}
          />
        </Routes>
      </main>
    </div>
  );
};

// Admin Home Component
const AdminHome: React.FC<{ dashboardData: any }> = ({ dashboardData }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Header with Role Guidance */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 sm:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              School Management Center
            </h1>
            <p className="text-blue-100 text-sm sm:text-base mb-3">
              Manage your school's students, teachers, schedules, and academic
              activities
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-white/20 px-2 py-1 rounded-full">
                👥 Manage Students
              </span>
              <span className="bg-white/20 px-2 py-1 rounded-full">
                👨‍🏫 Manage Teachers
              </span>
              <span className="bg-white/20 px-2 py-1 rounded-full">
                📚 Academic Planning
              </span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center text-sm">
              <svg
                className="w-5 h-5 mr-2"
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
              <span>School Administrator</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
          School Overview
        </h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="p-2 sm:p-3 bg-blue-200 rounded-lg mb-2 sm:mb-0 w-fit">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="sm:ml-3">
                <p className="text-xs sm:text-sm text-gray-600">Students</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {dashboardData?.totalStudents || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
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
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.totalTeachers || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
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
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Subjects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.totalSubjects || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
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
              <div className="ml-4">
                <p className="text-sm text-gray-500">Active Classes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.activeClasses || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Upcoming Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.upcomingEvents || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Flow Visualization for Admin */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            School Setup Workflow
          </h3>
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Step 1: Teachers */}
            <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border-2 border-green-200 hover:border-green-300 transition-colors">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Add Teachers
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  Teaching staff first
                </p>
                <div className="mt-2 text-xs text-green-600 font-medium">
                  Foundation Setup
                </div>
              </div>
            </div>

            <div className="text-gray-400">
              <svg
                className="w-6 h-6 rotate-90 lg:rotate-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>

            {/* Step 2: Subjects */}
            <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border-2 border-yellow-200 hover:border-yellow-300 transition-colors">
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Create Subjects
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  Curriculum structure
                </p>
                <div className="mt-2 text-xs text-yellow-600 font-medium">
                  Academic Framework
                </div>
              </div>
            </div>

            <div className="text-gray-400">
              <svg
                className="w-6 h-6 rotate-90 lg:rotate-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>

            {/* Step 3: Students */}
            <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border-2 border-blue-200 hover:border-blue-300 transition-colors">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Enroll Students
                </h4>
                <p className="text-xs text-gray-600 mt-1">Student admissions</p>
                <div className="mt-2 text-xs text-blue-600 font-medium">
                  Student Body
                </div>
              </div>
            </div>

            <div className="text-gray-400">
              <svg
                className="w-6 h-6 rotate-90 lg:rotate-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>

            {/* Step 4: Schedules */}
            <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border-2 border-purple-200 hover:border-purple-300 transition-colors">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold">4</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Create Schedules
                </h4>
                <p className="text-xs text-gray-600 mt-1">Class timetables</p>
                <div className="mt-2 text-xs text-purple-600 font-medium">
                  Operations Ready
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 text-center">
              <strong>Tip:</strong> Follow this order for smooth school setup.
              Teachers can start managing once schedules are created!
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Primary Actions
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Link to="/admin/students" state={{ openAddForm: true }}>
              <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 w-full text-white p-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95">
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Add Student
                </div>
              </button>
            </Link>
            <Link to="/admin/teachers" state={{ openAddForm: true }}>
              <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 w-full text-white p-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95">
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 mb-2"
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
                  Add Teacher
                </div>
              </button>
            </Link>
            <Link to="/admin/schedules">
              <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 w-full text-white p-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95">
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 mb-2"
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
                  Schedules
                </div>
              </button>
            </Link>
            <Link to="/admin/disciplinary-actions">
              <button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 w-full text-white p-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95">
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  Discipline
                </div>
              </button>
            </Link>
            <Link to="/admin/calendar">
              <button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 w-full text-white p-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95">
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Calendar
                </div>
              </button>
            </Link>
          </div>
        </div>

        {/* Upcoming Events Section */}
        {dashboardData?.upcomingEventsDetails &&
          dashboardData.upcomingEventsDetails.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Upcoming Events
              </h3>
              <div className="space-y-4">
                {dashboardData.upcomingEventsDetails
                  .slice(0, 5)
                  .map((event: any, index: number) => (
                    <div
                      key={event._id || index}
                      className="border-l-4 border-blue-500 pl-4 py-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {event.eventTitle || event.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {event.eventDescription || event.description}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <span>
                              {new Date(event.startDate).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                            {event.venue && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{event.venue}</span>
                              </>
                            )}
                            <span className="mx-2">•</span>
                            <span className="capitalize">
                              {event.eventType || event.type}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            event.priority === "high" ||
                            event.priority === "urgent"
                              ? "bg-red-100 text-red-800"
                              : event.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {event.priority || "medium"}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="mt-4 text-center">
                <Link to="/admin/calendar">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View All Events →
                  </button>
                </Link>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

// Placeholder components for other routes
const StudentManagement: React.FC<{ onDataChange?: () => void }> = ({
  onDataChange,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const studentListRef = useRef<StudentListRef>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openAddForm) {
      setShowForm(true);
      // Clear the state to prevent reopening on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCreateStudent = () => {
    setSelectedStudent(null);
    setShowForm(true);
  };

  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedStudent(null);
  };

  const handleSaveStudent = async () => {
    // After student is saved successfully in StudentForm, just close the form
    // The StudentList will be refreshed when needed
  };

  const handleStudentCreated = (student: any) => {
    // Add the student optimistically to the list
    if (studentListRef.current) {
      studentListRef.current.addStudentOptimistically(student);
    }
    // Refresh dashboard data to update stats
    if (onDataChange) {
      onDataChange();
    }
  };

  const handleStudentUpdated = (student: any) => {
    // Update the student optimistically in the list
    if (studentListRef.current) {
      studentListRef.current.updateStudentOptimistically(student);
    }
    // Refresh dashboard data to update stats
    if (onDataChange) {
      onDataChange();
    }
  };

  const handleStudentDeleted = (_studentId: string) => {
    // Remove the student optimistically from the list
    // Note: removeStudentOptimistically is not implemented yet
    // if (studentListRef.current) {
    //   studentListRef.current.removeStudentOptimistically(_studentId);
    // }
    // Refresh dashboard data to update stats
    if (onDataChange) {
      onDataChange();
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <StudentList
        ref={studentListRef}
        onCreateStudent={handleCreateStudent}
        onEditStudent={handleEditStudent}
        onStudentCreated={handleStudentCreated}
        onStudentUpdated={handleStudentUpdated}
        onStudentDeleted={handleStudentDeleted}
      />

      <StudentForm
        student={selectedStudent}
        isOpen={showForm}
        onClose={handleFormClose}
        onSave={handleSaveStudent}
      />
    </div>
  );
};

const TeacherManagement: React.FC = () => {
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [viewTeacher, setViewTeacher] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const teacherListRef = useRef<TeacherListRef>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openAddForm) {
      setShowForm(true);
      // Clear the state to prevent reopening on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCreateTeacher = () => {
    setSelectedTeacher(null);
    setShowForm(true);
  };

  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setShowForm(true);
  };

  const handleViewTeacher = (teacher: any) => {
    setViewTeacher(teacher);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedTeacher(null);
  };

  const handleSaveTeacher = async (teacherData: any) => {
    try {
      if (selectedTeacher?.id) {
        teacherListRef.current?.updateTeacherOptimistically(teacherData);
      } else {
        teacherListRef.current?.addTeacherOptimistically(teacherData);
      }
    } catch (error) {
      console.error("Failed to handle teacher save:", error);
    }
  };

  const handleTeacherCreated = (_teacher: any) => {};

  const handleTeacherUpdated = (_teacher: any) => {};

  const handleTeacherDeleted = (_teacherId: string) => {};

  return (
    <div className="px-4 sm:px-0">
      <TeacherList
        ref={teacherListRef}
        onCreateTeacher={handleCreateTeacher}
        onEditTeacher={handleEditTeacher}
        onViewTeacher={handleViewTeacher}
        onTeacherCreated={handleTeacherCreated}
        onTeacherUpdated={handleTeacherUpdated}
        onTeacherDeleted={handleTeacherDeleted}
      />

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
            {/* Floating Close Button */}
            <button
              onClick={handleFormClose}
              className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            <MinimalTeacherForm
              onBack={handleFormClose}
              onSave={handleSaveTeacher}
              teacher={selectedTeacher}
            />
          </div>
        </div>
      )}

      {viewTeacher && (
        <TeacherDetailView
          teacher={viewTeacher}
          onClose={() => setViewTeacher(null)}
          onEdit={(teacher) => {
            setViewTeacher(null);
            handleEditTeacher(teacher);
          }}
        />
      )}
    </div>
  );
};

const SubjectManagementPage: React.FC = () => (
  <div className="px-4 sm:px-0">
    <SubjectManagement />
  </div>
);

const ScheduleManagementPage: React.FC = () => (
  <div className="px-4 sm:px-0">
    <ScheduleManagement />
  </div>
);

const CalendarManagementPage: React.FC = () => (
  <div className="px-4 sm:px-0">
    <AcademicCalendar />
  </div>
);

const SchoolSettingsPage: React.FC = () => (
  <div className="px-4 sm:px-0">
    <SchoolSettings />
  </div>
);

const AutoAttendEventsViewerPage: React.FC = () => (
  <div className="px-4 sm:px-0">
    <AutoAttendEventsViewer />
  </div>
);

const AutoAttendApiKeyManagerPage: React.FC = () => (
  <div className="px-4 sm:px-0">
    <AutoAttendApiKeyManager />
  </div>
);

export default AdminDashboard;
