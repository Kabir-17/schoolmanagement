import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EventCalendar from "../../components/ui/EventCalendar";
import { apiService } from "@/services";

interface ParentHomeProps {
  dashboardData: any;
  selectedChild: any;
}

export const ParentHome: React.FC<ParentHomeProps> = ({
  dashboardData,
  selectedChild,
}) => {
  const navigate = useNavigate();

  const viewAttendance = () => navigate("/parent/attendance");
  const reviewHomework = () => navigate("/parent/homework");

  return (
    <div className="space-y-6">
      {/* Welcome Header with Role Guidance */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl shadow-lg p-6 sm:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Parent Portal
            </h1>
            <p className="text-pink-100 text-sm sm:text-base mb-3">
              Monitor your child's academic progress, attendance, and school
              activities
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-white/20 px-2 py-1 rounded-full">
                📊 Track Progress
              </span>
              <span className="bg-white/20 px-2 py-1 rounded-full">
                📅 Monitor Attendance
              </span>
              <span className="bg-white/20 px-2 py-1 rounded-full">
                📚 Review Homework
              </span>
              <span className="bg-white/20 px-2 py-1 rounded-full">
                💬 Stay Informed
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Active Parent</span>
            </div>
          </div>
        </div>
      </div>

      {selectedChild && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {selectedChild.firstName} {selectedChild.lastName}
              </h2>
              <p className="text-sm text-gray-600">
                Grade {selectedChild.grade} - Section {selectedChild.section} |
                Roll No: {selectedChild.rollNumber}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData?.stats?.totalChildren || 0}
              </div>
              <div className="text-xs text-gray-500">Total Children</div>
            </div>
          </div>
        </div>
      )}

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
                Attendance Alerts
              </p>
              <p className="text-lg sm:text-2xl font-bold text-green-900">
                {dashboardData?.stats?.totalAttendanceAlerts || 0}
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm text-blue-700 font-medium">
                Pending Homework
              </p>
              <p className="text-lg sm:text-2xl font-bold text-blue-900">
                {dashboardData?.stats?.totalPendingHomework || 0}
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
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm text-yellow-700 font-medium">
                Upcoming Events
              </p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-900">
                {dashboardData?.stats?.totalUpcomingEvents || 0}
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm text-purple-700 font-medium">
                School Notices
              </p>
              <p className="text-lg sm:text-2xl font-bold text-purple-900">
                {dashboardData?.stats?.totalNotices || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Children Fee Status */}
      <ChildrenFeeCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={viewAttendance}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-blue-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <div>
                  <div className="font-medium text-gray-900">
                    View Attendance Report
                  </div>
                  <div className="text-sm text-gray-500">
                    Check detailed attendance records
                  </div>
                </div>
              </div>
            </button>
            <button
              onClick={reviewHomework}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div>
                  <div className="font-medium text-gray-900">
                    Review Homework
                  </div>
                  <div className="text-sm text-gray-500">
                    Check submitted assignments
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {/** Render recent activity from dashboardData.recentActivity if available, otherwise fall back to static examples */}
            {(dashboardData?.recentActivity &&
            dashboardData.recentActivity.length > 0
              ? dashboardData.recentActivity : []
            //   : [
            //       {
            //         type: "homework",
            //         title: "Homework submitted for Mathematics",
            //         timeAgo: "2 hours ago",
            //         href: "/parent/homework",
            //       },
            //       {
            //         type: "attendance",
            //         title: "Present marked for all subjects",
            //         timeAgo: "1 day ago",
            //         href: "/parent/attendance",
            //       },
            //       {
            //         type: "notice",
            //         title: "Parent-Teacher meeting tomorrow",
            //         timeAgo: "3 days ago",
            //         href: "/parent/notices",
            //       },
            //     ]
            ).map((item: any, idx: number) => {
              // Normalize fields from possible server shapes
              const title =
                item.title || item.message || item.subject || "Activity";
              const timeAgo =
                item.timeAgo || item.relativeTime || item.createdAt || "";
              const href =
                item.href ||
                (item.type === "homework"
                  ? "/parent/homework"
                  : item.type === "attendance"
                  ? "/parent/attendance"
                  : "/parent/notices");

              const icon = (() => {
                switch (item.type) {
                  case "homework":
                    return (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-blue-600"
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
                    );
                  case "attendance":
                    return (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    );
                  case "notice":
                  default:
                    return (
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-yellow-600"
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
                      </div>
                    );
                }
              })();

              return (
                <button
                  key={idx}
                  onClick={() => navigate(href)}
                  className="flex items-start space-x-3 w-full text-left"
                >
                  <div className="flex-shrink-0">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500">{timeAgo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Events Calendar */}
      <div className="mt-8">
        <EventCalendar
          onEventClick={(_event) => {
            // Handle event click - could show a modal with event details
          }}
        />
      </div>
    </div>
  );
};

// Children Fee Cards Component
const ChildrenFeeCards: React.FC = () => {
  const [feeData, setFeeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildrenFees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadChildrenFees = async () => {
    try {
      setLoading(true);
      const response = await apiService.fee.getParentChildrenFees();
      if (response.data) {
        setFeeData(response.data);
      }
    } catch (error) {
      console.error("Failed to load children fee data:", error);
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
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!feeData || !feeData.children || feeData.children.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-6">
      {/* Total Summary Card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg border border-purple-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-purple-600"
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
            Total Fee Summary
          </h3>
          <span className="text-sm text-gray-600">
            {feeData.totalChildren} {feeData.totalChildren === 1 ? "Child" : "Children"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Total Due (All Children)</p>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(feeData.totalDueAmount)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Children with Pending Fees</p>
            <p className="text-3xl font-bold text-orange-600">
              {feeData.children.filter((child: any) => child.totalDue > 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* Individual Child Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Children Fee Status</h3>
        
        {feeData.children.map((child: any) => {
          const admissionRemaining = child.admissionFeeRemaining || 0;
          
          return (
            <div
              key={child._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Child Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {child.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Grade {child.grade} {child.section && ` - Section ${child.section}`} {child.rollNumber && `| Roll No: ${child.rollNumber}`}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      child.feeStatus === "paid"
                        ? "bg-green-100 text-green-800"
                        : child.feeStatus === "partial"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {child.feeStatus === "paid"
                      ? "All Paid"
                      : child.feeStatus === "partial"
                      ? "Partial"
                      : "Pending"}
                  </span>
                </div>
              </div>

              {/* Admission Fee Alert */}
              {child.admissionPending && (
                <div className="bg-orange-50 border-b border-orange-200 p-4">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5"
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
                    <div>
                      <p className="text-sm font-medium text-orange-800">
                        Admission Fee Pending
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        Total: {formatCurrency(child.admissionFee)} | Paid:{" "}
                        {formatCurrency(child.admissionFeePaid)} | Remaining:{" "}
                        <strong>{formatCurrency(admissionRemaining)}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fee Details */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Total Fees</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(child.totalFees)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Paid</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(child.totalPaid)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Due</p>
                    <p className="text-lg font-bold text-orange-600">
                      {formatCurrency(child.totalDue)}
                    </p>
                  </div>
                </div>

                {/* Next Due Payment */}
                {child.nextDue && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-yellow-600 mr-2"
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
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800">
                          Next Payment: {formatCurrency(child.nextDue.amount)}
                        </p>
                        <p className="text-xs text-yellow-700">
                          Due Date: {new Date(child.nextDue.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending Months Info */}
                {child.pendingMonths > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      <svg
                        className="w-4 h-4 inline mr-1 text-blue-500"
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
                      {child.pendingMonths} month(s) pending
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800">
              Need to make a payment?
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Please visit the school accounts office or contact the accountant to make fee payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};