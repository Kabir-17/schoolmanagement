import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  BookOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
} from "lucide-react";
import { apiService } from "@/services";

interface HomeworkItem {
  homeworkId: string;
  title: string;
  description: string;
  subject: string;
  teacherName: string;
  assignedDate: string;
  dueDate: string;
  status: "pending" | "submitted" | "overdue" | "graded";
  submittedAt?: string;
  grade?: string;
  feedback?: string;
  attachments?: string[];
}

interface HomeworkData {
  summary: {
    totalHomework: number;
    completedHomework: number;
    pendingHomework: number;
    overdueHomework: number;
    completionRate: number;
  };
  homework: HomeworkItem[];
}

const HomeworkView: React.FC = () => {
  const [homeworkData, setHomeworkData] = useState<HomeworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "pending" | "completed" | "overdue"
  >("all");

  useEffect(() => {
    loadHomeworkData();
  }, []);

  const loadHomeworkData = async () => {
    try {
      setLoading(true);
      const response = await apiService.student.getHomework();
      if (response.data.success) {
        setHomeworkData(response.data.data);
      }
    } catch (err) {
      console.error("Failed to load homework data:", err);
      setError("Failed to load homework data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "submitted":
      case "graded":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "submitted":
      case "graded":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "overdue":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dueDate: string) => {
    return (
      new Date(dueDate) < new Date() &&
      new Date(dueDate).toDateString() !== new Date().toDateString()
    );
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `${diffDays} days remaining`;
  };

  const filteredHomework =
    homeworkData?.homework.filter((item) => {
      if (filter === "all") return true;
      if (filter === "pending") return item.status === "pending";
      if (filter === "completed")
        return ["submitted", "graded"].includes(item.status);
      if (filter === "overdue")
        return item.status === "pending" && isOverdue(item.dueDate);
      return true;
    }) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={loadHomeworkData}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!homeworkData) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-500 text-center">
            No homework data available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Homework
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {homeworkData.summary.totalHomework}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {homeworkData.summary.completedHomework}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {homeworkData.summary.pendingHomework}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {homeworkData.summary.overdueHomework}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({homeworkData.summary.totalHomework})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === "pending"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending ({homeworkData.summary.pendingHomework})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === "completed"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Completed ({homeworkData.summary.completedHomework})
            </button>
            <button
              onClick={() => setFilter("overdue")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === "overdue"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Overdue ({homeworkData.summary.overdueHomework})
            </button>
          </div>

          {/* Completion Rate Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Completion Rate
              </span>
              <span className="text-sm font-bold text-indigo-600">
                {homeworkData.summary.completionRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    homeworkData.summary.completionRate,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Homework List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Homework Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredHomework.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {item.teacherName}
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1" />
                        {item.subject}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Assigned: {formatDate(item.assignedDate)}
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-gray-700 text-sm mb-3">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {getStatusIcon(item.status)}
                    <span className="capitalize">{item.status}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      Due: {formatDate(item.dueDate)}
                    </span>
                    <span
                      className={`ml-2 ${
                        isOverdue(item.dueDate) && item.status === "pending"
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      ({getDaysRemaining(item.dueDate)})
                    </span>
                  </div>

                  {item.grade && (
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Grade</div>
                      <div className="text-lg font-bold text-indigo-600">
                        {item.grade}
                      </div>
                    </div>
                  )}
                </div>

                {item.feedback && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      Teacher Feedback:
                    </div>
                    <div className="text-sm text-gray-600">{item.feedback}</div>
                  </div>
                )}

                {item.submittedAt && (
                  <div className="mt-2 text-sm text-gray-500">
                    Submitted on {formatDate(item.submittedAt)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredHomework.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {filter === "all"
                  ? "No homework assignments found."
                  : `No ${filter} homework found.`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HomeworkView;
