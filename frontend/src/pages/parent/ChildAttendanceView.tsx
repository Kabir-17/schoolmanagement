import React, { useState, useEffect, useCallback } from "react";
import { parentApi } from "../../services/parent.api";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";

interface ChildAttendanceViewProps {
  selectedChild: any;
}

export const ChildAttendanceView: React.FC<ChildAttendanceViewProps> = ({
  selectedChild,
}) => {
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await parentApi.getChildAttendance(selectedChild.id, {
        month: selectedMonth,
        year: selectedYear,
      });
      if (response.data.success) {
        setAttendanceData(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load attendance data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedChild, selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedChild) {
      loadAttendanceData();
    }
  }, [selectedChild, selectedMonth, selectedYear, loadAttendanceData]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "present":
        return "bg-green-100 text-green-800 border-green-200";
      case "absent":
        return "bg-red-100 text-red-800 border-red-200";
      case "late":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "excused":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "present":
        return (
          <svg
            className="w-4 h-4"
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
        );
      case "absent":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "late":
        return (
          <svg
            className="w-4 h-4"
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
        );
      default:
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {selectedChild
                ? `${selectedChild.firstName}'s Attendance`
                : "Child Attendance"}
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Track daily attendance and monitor school attendance patterns
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Monthly View</span>
            </div>
          </div>
        </div>
      </div>

      {/* Month/Year Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Attendance Records
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3">
              <Select
                value={String(selectedMonth)}
                onValueChange={(val: string) => setSelectedMonth(parseInt(val))}
              >
                <SelectTrigger className="px-3 py-2 sm:px-2 sm:py-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm md:text-xs">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {new Date(0, i).toLocaleString("default", {
                          month: "long",
                        })}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                value={String(selectedYear)}
                onValueChange={(val: string) => setSelectedYear(parseInt(val))}
              >
                <SelectTrigger className="px-3 py-2 sm:px-2 sm:py-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm md:text-xs">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      {attendanceData?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                  Present Days
                </p>
                <p className="text-lg sm:text-2xl font-bold text-green-900">
                  {attendanceData.summary.presentDays || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg shadow-sm p-4 sm:p-6 border border-red-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-200 rounded-lg">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-red-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-red-700 font-medium">
                  Absent Days
                </p>
                <p className="text-lg sm:text-2xl font-bold text-red-900">
                  {attendanceData.summary.absentDays || 0}
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-yellow-700 font-medium">
                  Late Arrivals
                </p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-900">
                  {attendanceData.summary.lateDays || 0}
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-blue-700 font-medium">
                  Attendance %
                </p>
                <p className="text-lg sm:text-2xl font-bold text-blue-900">
                  {attendanceData.summary.attendancePercentage || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Calendar/List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
          Daily Attendance
        </h3>

        {attendanceData?.records && attendanceData.records.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {attendanceData.records.map((record: any, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getStatusColor(
                        record.status
                      )}`}
                    >
                      {getStatusIcon(record.status)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {record.status}
                      </p>
                    </div>
                  </div>
                </div>

                {record.checkInTime && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Check-in:</span>{" "}
                    {record.checkInTime}
                  </div>
                )}

                {record.checkOutTime && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Check-out:</span>{" "}
                    {record.checkOutTime}
                  </div>
                )}

                {record.notes && (
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <span className="font-medium">Note:</span> {record.notes}
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Attendance Records
            </h3>
            <p className="text-gray-500">
              No attendance data available for the selected month.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
