import React, { useState, useEffect, useCallback } from "react";
import { parentApi } from "../../services/parent.api";

interface ChildHomeworkViewProps {
  selectedChild: any;
}

export const ChildHomeworkView: React.FC<ChildHomeworkViewProps> = ({
  selectedChild,
}) => {
  const [homeworkData, setHomeworkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadHomeworkData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await parentApi.getChildHomework(selectedChild.id);
      if (response.data.success) {
        setHomeworkData(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load homework data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedChild]);

  useEffect(() => {
    if (selectedChild) {
      loadHomeworkData();
    }
  }, [selectedChild, loadHomeworkData]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "graded":
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "submitted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "graded":
      case "completed":
        return "✓";
      case "pending":
        return "⏱";
      case "overdue":
        return "⚠";
      case "submitted":
        return "📤";
      default:
        return "📝";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getHomeworkTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "assignment":
        return "bg-blue-100 text-blue-800";
      case "project":
        return "bg-purple-100 text-purple-800";
      case "reading":
        return "bg-indigo-100 text-indigo-800";
      case "practice":
        return "bg-cyan-100 text-cyan-800";
      case "research":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredHomework = homeworkData?.homework?.filter((hw: any) => {
    if (filterStatus === "all") return true;
    return hw.status?.toLowerCase() === filterStatus.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {selectedChild?.firstName
                ? `${selectedChild.firstName}'s Homework`
                : "Child Homework"}
            </h1>
            <p className="text-purple-100 text-sm sm:text-base">
              Monitor assignments, track progress, and stay updated on homework
              submissions
            </p>
          </div>
          <div className="mt-4 sm:mt-0 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
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
              <span>Homework Tracker</span>
            </div>
          </div>
        </div>
      </div>

      {/* Homework Summary */}
      {homeworkData?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-4 border border-blue-200">
            <div className="flex flex-col">
              <p className="text-xs text-blue-700 font-medium mb-1">Total</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900">
                {homeworkData.summary.totalHomework || 0}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-4 border border-green-200">
            <div className="flex flex-col">
              <p className="text-xs text-green-700 font-medium mb-1">
                Completed
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900">
                {homeworkData.summary.completedHomework || 0}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-sm p-4 border border-yellow-200">
            <div className="flex flex-col">
              <p className="text-xs text-yellow-700 font-medium mb-1">
                Pending
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-900">
                {homeworkData.summary.pendingHomework || 0}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-sm p-4 border border-red-200">
            <div className="flex flex-col">
              <p className="text-xs text-red-700 font-medium mb-1">Overdue</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-900">
                {homeworkData.summary.overdueHomework || 0}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm p-4 border border-purple-200">
            <div className="flex flex-col">
              <p className="text-xs text-purple-700 font-medium mb-1">
                Completion
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900">
                {homeworkData.summary.completionRate || 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {["all", "pending", "submitted", "graded", "overdue"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Homework List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
          Assignments ({filteredHomework?.length || 0})
        </h3>

        {filteredHomework && filteredHomework.length > 0 ? (
          <div className="space-y-4">
            {filteredHomework.map((assignment: any, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div className="flex-1 mb-3 sm:mb-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {assignment.title}
                      </h4>
                      {/* Priority Badge */}
                      {assignment.priority && (
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                            assignment.priority
                          )}`}
                        >
                          {assignment.priority.toUpperCase()}
                        </span>
                      )}
                      {/* Homework Type Badge */}
                      {assignment.homeworkType && (
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHomeworkTypeColor(
                            assignment.homeworkType
                          )}`}
                        >
                          {assignment.homeworkType}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {assignment.subject}
                      {assignment.subjectCode && ` (${assignment.subjectCode})`}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
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
                        Assigned:{" "}
                        {new Date(assignment.assignedDate).toLocaleDateString()}
                      </span>
                      <span
                        className={`flex items-center font-medium ${
                          assignment.isOverdue
                            ? "text-red-600"
                            : assignment.daysUntilDue <= 2
                            ? "text-orange-600"
                            : ""
                        }`}
                      >
                        <svg
                          className="w-4 h-4 mr-1"
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
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        {assignment.daysUntilDue >= 0 &&
                          !assignment.isOverdue && (
                            <span className="ml-1">
                              ({assignment.daysUntilDue} days left)
                            </span>
                          )}
                        {assignment.isOverdue && (
                          <span className="ml-1 text-red-600 font-bold">
                            (OVERDUE)
                          </span>
                        )}
                      </span>
                      {assignment.teacherName && (
                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          {assignment.teacherName}
                        </span>
                      )}
                    </div>
                    {/* Additional Info */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                      {assignment.estimatedDuration && (
                        <span className="flex items-center">
                          ⏱️ {assignment.estimatedDuration} mins
                        </span>
                      )}
                      <span>📊 {assignment.totalMarks} marks</span>
                      {assignment.passingMarks && (
                        <span>✅ Pass: {assignment.passingMarks}</span>
                      )}
                      {assignment.isGroupWork && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                          👥 Group Work (Max {assignment.maxGroupSize})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        assignment.status
                      )}`}
                    >
                      <span className="mr-1">
                        {getStatusIcon(assignment.status)}
                      </span>
                      {assignment.status}
                    </span>
                  </div>
                </div>

                {assignment.description && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      Description:
                    </h5>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {assignment.description}
                    </p>
                  </div>
                )}

                {assignment.instructions && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      Instructions:
                    </h5>
                    <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      {assignment.instructions}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {assignment.tags && assignment.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {assignment.tags.map((tag: string, tagIndex: number) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Late Submission Info */}
                {assignment.allowLateSubmission && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Late submission allowed (up to {assignment.maxLateDays}{" "}
                      days with {assignment.latePenalty}% penalty per day)
                    </p>
                  </div>
                )}

                {assignment.attachments &&
                  assignment.attachments.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Attachments:
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {assignment.attachments.map(
                          (attachment: any, attIndex: number) => (
                            <a
                              key={attIndex}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              {attachment.name || `Attachment ${attIndex + 1}`}
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Submission Information */}
                {(assignment.submittedAt ||
                  assignment.marksObtained !== undefined ||
                  assignment.grade ||
                  assignment.feedback) && (
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      Submission:
                    </h5>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        {assignment.submittedAt && (
                          <span className="text-sm font-medium text-green-800">
                            Submitted on{" "}
                            {new Date(
                              assignment.submittedAt
                            ).toLocaleDateString()}
                            {assignment.isLate && (
                              <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                                Late Submission
                              </span>
                            )}
                          </span>
                        )}
                        {(assignment.marksObtained !== undefined ||
                          assignment.grade) && (
                          <span className="text-sm font-bold text-green-700">
                            {assignment.marksObtained !== undefined &&
                              `Score: ${assignment.marksObtained}/${assignment.totalMarks}`}
                            {assignment.grade && ` (${assignment.grade})`}
                          </span>
                        )}
                      </div>
                      {assignment.feedback && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-green-800 mb-1">
                            Teacher's Feedback:
                          </p>
                          <p className="text-sm text-green-700 bg-white p-2 rounded">
                            {assignment.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {assignment.status === "pending" && assignment.isOverdue && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-red-600 mr-2"
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
                      <span className="text-sm text-red-800 font-medium">
                        This assignment is overdue! Please contact the teacher.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Homework Assignments
            </h3>
            <p className="text-gray-500">
              {filterStatus === "all"
                ? "No homework assignments available at this time."
                : `No ${filterStatus} homework assignments found.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
