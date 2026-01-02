import React, { useState, useEffect, useCallback } from "react";
import { parentApi } from "../../services/parent.api";

interface ChildScheduleViewProps {
  selectedChild: any;
}

export const ChildScheduleView: React.FC<ChildScheduleViewProps> = ({
  selectedChild,
}) => {
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  const daysOfWeek = [
    { id: 0, name: "Sunday", short: "Sun" },
    { id: 1, name: "Monday", short: "Mon" },
    { id: 2, name: "Tuesday", short: "Tue" },
    { id: 3, name: "Wednesday", short: "Wed" },
    { id: 4, name: "Thursday", short: "Thu" },
    { id: 5, name: "Friday", short: "Fri" },
    { id: 6, name: "Saturday", short: "Sat" },
  ];

  const loadScheduleData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await parentApi.getChildSchedule(selectedChild.id);
      if (response.data.success) {
        setScheduleData(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load schedule data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedChild]);

  useEffect(() => {
    if (selectedChild) {
      loadScheduleData();
    }
  }, [selectedChild, loadScheduleData]);

  const getCurrentDaySchedule = () => {
    if (!scheduleData?.schedule) return [];
    return scheduleData.schedule.filter(
      (item: any) => item.dayOfWeek === selectedDay
    );
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const currentDaySchedule = getCurrentDaySchedule();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {selectedChild
                ? `${selectedChild.firstName}'s Schedule`
                : "Child Schedule"}
            </h1>
            <p className="text-green-100 text-sm sm:text-base">
              View class timetable, activities, and daily schedule
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
              <span>Class Timetable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Select Day
        </h2>
        <div className="grid grid-cols-7 gap-2 sm:gap-4">
          {daysOfWeek.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                selectedDay === day.id
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
              aria-label={`Select ${day.name}`}
            >
              <div className="text-center">
                <div className="text-xs sm:text-sm font-medium">
                  {day.short}
                </div>
                <div className="text-lg sm:text-xl font-bold mt-1">
                  {day.id === selectedDay ? "●" : "○"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            {daysOfWeek[selectedDay].name} Schedule
          </h3>
          <div className="text-sm text-gray-500">
            {currentDaySchedule.length}{" "}
            {currentDaySchedule.length === 1 ? "class" : "classes"}
          </div>
        </div>

        {currentDaySchedule.length > 0 ? (
          <div className="space-y-4">
            {currentDaySchedule
              .sort((a: any, b: any) => {
                if (!a.startTime || !b.startTime) return 0;
                return a.startTime.localeCompare(b.startTime);
              })
              .map((item: any, index: number) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                    <div className="flex-1 mb-3 sm:mb-0">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.subject}
                      </h4>
                      {item.teacher && (
                        <p className="text-sm text-gray-600 mb-1">
                          Teacher: {item.teacher}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {item.startTime && item.endTime && (
                          <span>
                            {formatTime(item.startTime)} -{" "}
                            {formatTime(item.endTime)}
                          </span>
                        )}
                        {item.room && <span>Room: {item.room}</span>}
                        {item.classType && (
                          <span className="capitalize">{item.classType}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {item.subject?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    </div>
                  </div>

                  {item.description && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {item.description}
                      </p>
                    </div>
                  )}

                  {item.materials && item.materials.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Required Materials:
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {item.materials.map(
                          (material: string, matIndex: number) => (
                            <span
                              key={matIndex}
                              className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                            >
                              {material}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {item.homework && (
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex items-start">
                        <svg
                          className="w-5 h-5 text-yellow-600 mr-2 mt-0.5"
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
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">
                            Homework
                          </h5>
                          <p className="text-sm text-gray-700 mt-1">
                            {item.homework}
                          </p>
                        </div>
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Classes Scheduled
            </h3>
            <p className="text-gray-500">
              No classes or activities scheduled for{" "}
              {daysOfWeek[selectedDay].name.toLowerCase()}.
            </p>
          </div>
        )}
      </div>

      {/* Weekly Overview */}
      {scheduleData?.weeklyStats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
            Weekly Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {scheduleData.weeklyStats.totalClasses || 0}
              </div>
              <div className="text-sm text-blue-700">Total Classes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {scheduleData.weeklyStats.uniqueSubjects || 0}
              </div>
              <div className="text-sm text-green-700">Subjects</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {scheduleData.weeklyStats.totalHours || 0}h
              </div>
              <div className="text-sm text-purple-700">Study Hours</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {scheduleData.weeklyStats.breakTime || 0}h
              </div>
              <div className="text-sm text-orange-700">Break Time</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
