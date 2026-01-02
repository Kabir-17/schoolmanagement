import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '@/services';
import MobileNavigation from '../components/layout/MobileNavigation';
import TeacherScheduleView from '../components/teacher/TeacherScheduleView';
import MyClassesView from '../components/teacher/MyClassesView';
import TeacherHomeworkView from '../components/teacher/TeacherHomeworkView';
import TeacherAttendanceView from '../components/teacher/TeacherAttendanceView';
import TeacherExamGrading from '../components/teacher/TeacherExamGrading';
import TeacherPunishmentSystem from '../components/teacher/TeacherPunishmentSystem';
import DisciplinaryActionsManager from '../components/teacher/DisciplinaryActionsManager';
import TeacherStudentView from '../components/teacher/TeacherStudentView';
import EventCalendar from '../components/ui/EventCalendar';
import MessagingCenter from '../components/messaging/MessagingCenter';

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { href: '/teacher', label: 'Dashboard' },
    { href: '/teacher/classes', label: 'Classes' },
    { href: '/teacher/attendance', label: 'Attendance' },
    { href: '/teacher/homework', label: 'Homework' },
    { href: '/teacher/grades', label: 'Grading' },
    { href: '/teacher/students', label: 'Students' },
    { href: '/teacher/discipline', label: 'Issue Discipline' },
    { href: '/teacher/disciplinary-actions', label: 'Manage Actions' },
    { href: '/teacher/schedule', label: 'Schedule' },
    { href: '/teacher/calendar', label: 'Calendar' },
    { href: '/teacher/messages', label: 'Messages' },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.teacher.getDashboard();
      if (response.data.success) {
        setDashboardData(response.data.data);
       
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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
        title="Teacher Dashboard"
        subtitle={`Welcome back, ${user?.fullName}`}
        navItems={navItems}
        onLogout={handleLogout}
        primaryColor="green"
      />

      <main className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<TeacherHome dashboardData={dashboardData} />} />
          <Route path="/classes" element={<MyClassesView />} />
          <Route path="/attendance" element={<TeacherAttendanceView />} />
          <Route path="/homework" element={<TeacherHomeworkView />} />
          <Route path="/grades" element={<TeacherExamGrading />} />
          <Route path="/students" element={<TeacherStudentView />} />
          <Route path="/discipline" element={<TeacherPunishmentSystem />} />
          <Route path="/disciplinary-actions" element={<DisciplinaryActionsManager />} />
          <Route path="/schedule" element={<TeacherScheduleView />} />
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
          <Route
            path="/messages"
            element={
              <div className="p-4 sm:p-6">
                <MessagingCenter
                  title="Messages"
                  subtitle="Message students and parents assigned to your classes"
                />
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

const TeacherHome: React.FC<{ dashboardData: any }> = ({ dashboardData }) => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Header with Role Guidance */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 sm:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Teaching Dashboard</h1>
            <p className="text-green-100 text-sm sm:text-base mb-3">
              Manage your classes, track student progress, and handle academic activities
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-white/20 px-2 py-1 rounded-full">📚 Teach Classes</span>
              <span className="bg-white/20 px-2 py-1 rounded-full">📊 Grade Students</span>
              <span className="bg-white/20 px-2 py-1 rounded-full">📝 Assign Homework</span>
              <span className="bg-white/20 px-2 py-1 rounded-full">📋 Track Attendance</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center text-sm">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Teacher</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Teaching Overview</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="p-2 sm:p-3 bg-green-200 rounded-lg mb-2 sm:mb-0 w-fit">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="sm:ml-3">
                <p className="text-xs sm:text-sm text-gray-600">Classes</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{dashboardData?.totalClasses || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="p-2 sm:p-3 bg-blue-200 rounded-lg mb-2 sm:mb-0 w-fit">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="sm:ml-3">
                <p className="text-xs sm:text-sm text-gray-600">Students</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{dashboardData?.totalStudents || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="p-2 sm:p-3 bg-yellow-200 rounded-lg mb-2 sm:mb-0 w-fit">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="sm:ml-3">
                <p className="text-xs sm:text-sm text-gray-600">Homework</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{dashboardData?.pendingHomework || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="p-2 sm:p-3 bg-purple-200 rounded-lg mb-2 sm:mb-0 w-fit">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="sm:ml-3">
                <p className="text-xs sm:text-sm text-gray-600">Today</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{dashboardData?.todayClasses || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Teaching Workflow Guide */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Daily Teaching Workflow
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Check Schedule</h4>
                <p className="text-xs text-gray-600 mt-1">View today's classes</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
              <div className="text-center">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Take Attendance</h4>
                <p className="text-xs text-gray-600 mt-1">Mark present/absent</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
              <div className="text-center">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Grade Work</h4>
                <p className="text-xs text-gray-600 mt-1">Evaluate assignments</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Assign Homework</h4>
                <p className="text-xs text-gray-600 mt-1">Set student tasks</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 text-center">
              <strong>Pro Tip:</strong> Start with attendance, then focus on teaching. Grade work during planning periods!
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link 
              to="/teacher/attendance"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-3 sm:p-4 rounded-lg text-center font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm sm:text-base">Attendance</div>
              </div>
            </Link>
            <Link 
              to="/teacher/grades"
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white p-3 sm:p-4 rounded-lg text-center font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <div className="text-sm sm:text-base">Grading</div>
              </div>
            </Link>
            <Link 
              to="/teacher/homework"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 sm:p-4 rounded-lg text-center font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <div className="text-sm sm:text-base">Homework</div>
              </div>
            </Link>
            <Link 
              to="/teacher/discipline"
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 sm:p-4 rounded-lg text-center font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm sm:text-base">Discipline</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Events Calendar */}
        <div className="mt-6">
          <EventCalendar
            onEventClick={(_event) => {
              // Handle event click - could show a modal with event details
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
