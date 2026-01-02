import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  Clock,
  BookOpen,
  Settings,
} from "lucide-react";
import AcademicCalendarModern from "./AcademicCalendarModern";
import ScheduleManagement from "./ScheduleManagement";
import SubjectManagement from "./SubjectManagement";

type ActiveTab = "dashboard" | "calendar" | "schedule" | "subjects";

const AdminCalendarDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "calendar":
        return <AcademicCalendarModern />;
      case "schedule":
        return <ScheduleManagement />;
      case "subjects":
        return <SubjectManagement />;
      default:
        return (
          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">
                Academic Management Dashboard
              </h1>
              <p className="text-gray-600">
                Manage calendar events, schedules, and subjects
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Upcoming Events
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                    +2 from last week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Schedules
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45</div>
                  <p className="text-xs text-muted-foreground">
                    Across all grades
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Subjects
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">28</div>
                  <p className="text-xs text-muted-foreground">
                    +3 new this term
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => setActiveTab("calendar")}
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    variant="outline"
                  >
                    <Calendar className="h-8 w-8" />
                    <span>Manage Calendar Events</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("schedule")}
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    variant="outline"
                  >
                    <Clock className="h-8 w-8" />
                    <span>Create Schedules</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("subjects")}
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    variant="outline"
                  >
                    <BookOpen className="h-8 w-8" />
                    <span>Manage Subjects</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 border rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">New exam scheduled</p>
                      <p className="text-sm text-gray-600">
                        Mathematics final exam for Grade 10
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">2 hours ago</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 border rounded-lg">
                    <Clock className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">Schedule updated</p>
                      <p className="text-sm text-gray-600">
                        Grade 9-A Monday timetable modified
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">4 hours ago</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 border rounded-lg">
                    <BookOpen className="h-5 w-5 text-purple-500" />
                    <div className="flex-1">
                      <p className="font-medium">New subject added</p>
                      <p className="text-sm text-gray-600">
                        Computer Science for Grade 11
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">1 day ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant={activeTab === "dashboard" ? "default" : "outline"}
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant={activeTab === "calendar" ? "default" : "outline"}
            onClick={() => setActiveTab("calendar")}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Academic Calendar
          </Button>
          <Button
            variant={activeTab === "schedule" ? "default" : "outline"}
            onClick={() => setActiveTab("schedule")}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Schedule Management
          </Button>
          <Button
            variant={activeTab === "subjects" ? "default" : "outline"}
            onClick={() => setActiveTab("subjects")}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Subject Management
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">{renderContent()}</div>
    </div>
  );
};

export default AdminCalendarDashboard;
