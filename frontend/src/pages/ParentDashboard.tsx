import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { parentApi } from "../services/parent.api";
import MobileNavigation from "../components/layout/MobileNavigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { NoticesView } from "./parent/NoticesView";
import { ParentHome } from "./parent/ParentHome";
import { ChildAttendanceView } from "./parent/ChildAttendanceView";
import { ChildHomeworkView } from "./parent/ChildHomeworkView";
import { ChildScheduleView } from "./parent/ChildScheduleView";
import ChildGradesView from "./parent/ChildGradesView";
import ParentDisciplinaryActions from "@/components/parent/ParentDisciplinaryActions";
import EventCalendar from "../components/ui/EventCalendar";
import MessagingCenter from "../components/messaging/MessagingCenter";

const ParentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, childrenResponse] = await Promise.all([
        parentApi.getDashboard(),
        parentApi.getChildren(),
      ]);

      if (dashboardResponse.data.success) {
        setDashboardData(dashboardResponse.data.data);
      }

      if (childrenResponse.data.success) {
        setChildren(childrenResponse.data.data.children || []);
        if (childrenResponse.data.data.children?.length > 0) {
          setSelectedChild(childrenResponse.data.data.children[0]);
        }
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
    { label: "Dashboard", href: "/parent" },
    { label: "Attendance", href: "/parent/attendance" },
    { label: "Grades", href: "/parent/grades" },
    // { label: 'Grades', href: '/parent/grades' },
    { label: "Homework", href: "/parent/homework" },
    { label: "Schedule", href: "/parent/schedule" },
    { label: "Calendar", href: "/parent/calendar" },
    { label: "Notices", href: "/parent/notices" },
    { label: "Messages", href: "/parent/messages" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <MobileNavigation
        title="Parent Dashboard"
        subtitle={`Welcome back, ${user?.fullName}`}
        navItems={navigationItems}
        onLogout={handleLogout}
        primaryColor="pink"
      />

      {/* Child Selection */}
      {children.length > 1 && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <label
              htmlFor="child-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Child:
            </label>
            <div>
              <Select
                value={selectedChild?.id || ""}
                onValueChange={(val: string) => {
                  const child = children.find((c) => c.id === val);
                  setSelectedChild(child);
                }}
              >
                {/* smaller trigger on desktop: reduce padding + font-size at md+ */}
                <SelectTrigger className="w-full sm:w-auto px-3 py-2 sm:px-2 sm:py-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm md:text-xs">
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.firstName} {child.lastName} - Grade {child.grade}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <main className="pt-4 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route
              path="/"
              element={
                <ParentHome
                  dashboardData={dashboardData}
                  selectedChild={selectedChild}
                />
              }
            />
            <Route
              path="/attendance"
              element={<ChildAttendanceView selectedChild={selectedChild} />}
            />
            <Route
              path="/grades"
              element={<ChildGradesView selectedChild={selectedChild} />}
            />
            <Route
              path="/homework"
              element={<ChildHomeworkView selectedChild={selectedChild} />}
            />
            <Route
              path="/schedule"
              element={<ChildScheduleView selectedChild={selectedChild} />}
            />
            <Route
              path="/calendar"
              element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">School Calendar</h1>
                  <EventCalendar
                    onEventClick={(_event) => {
                      // Handle event click - could show a modal with event details
                    }}
                  />
                </div>
              }
            />
            <Route
              path="/notices"
              element={<NoticesView selectedChild={selectedChild} />}
            />
            <Route
              path="/disciplinary"
              element={<ParentDisciplinaryActions />}
            />
            <Route
              path="/messages"
              element={
                <div className="p-4 sm:p-6">
                  <MessagingCenter
                    title="Messages"
                    subtitle="Coordinate with teachers connected to your children"
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

export default ParentDashboard;
