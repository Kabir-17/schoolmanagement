import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Calendar, Clock, User, MapPin, BookOpen } from "lucide-react";
import { apiService } from "@/services";

interface ScheduleItem {
  dayOfWeek: string;
  period: number;
  startTime: string;
  endTime: string;
  subject: string;
  subjectId: string;
  teacherName: string;
  teacherId: string;
  className: string;
  room: string;
  isActive: boolean;
}

interface ScheduleData {
  grade: number;
  section: string;
  scheduleByDay: Array<{
    day: string;
    periods: ScheduleItem[];
  }>;
  totalPeriods: number;
}

const ScheduleView: React.FC = () => {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("monday");

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      const response = await apiService.student.getSchedule();
      if (response.data.success) {
        setScheduleData(response.data.data);
        // Set current day as selected if it has classes
        const today = new Date().toLocaleString("en-US", {
          weekday: "long",
        }).toLowerCase();
        const todaySchedule: {
          day: string;
          periods: ScheduleItem[];
        } | undefined = response.data.data.scheduleByDay.find(
          (day: { day: string; periods: ScheduleItem[] }) => day.day === today
        );
        if (todaySchedule && todaySchedule.periods.length > 0) {
          setSelectedDay(today);
        }
      }
    } catch (err) {
      console.error("Failed to load schedule data:", err);
      setError("Failed to load schedule data");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDayColor = (day: string) => {
    const today = new Date().toLocaleString("en-US", { weekday: "long" }).toLowerCase();
    if (day === today) return "bg-indigo-600 text-white";
    if (day === selectedDay)
      return "bg-indigo-100 text-indigo-800 border-indigo-300";
    return "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";
  };

  const getCurrentPeriod = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const today = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

    const todaySchedule = scheduleData?.scheduleByDay.find(
      (day) => day.day === today
    );
    if (!todaySchedule) return null;

    for (const period of todaySchedule.periods) {
      const [startHour, startMin] = period.startTime.split(":").map(Number);
      const [endHour, endMin] = period.endTime.split(":").map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      if (currentTime >= startTime && currentTime <= endTime) {
        return period;
      }
    }
    return null;
  };

  const getNextPeriod = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const today = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

    const todaySchedule = scheduleData?.scheduleByDay.find(
      (day) => day.day === today
    );
    if (!todaySchedule) return null;

    for (const period of todaySchedule.periods) {
      const [startHour, startMin] = period.startTime.split(":").map(Number);
      const startTime = startHour * 60 + startMin;

      if (startTime > currentTime) {
        return period;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
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
              onClick={loadScheduleData}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!scheduleData) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-500 text-center">
            No schedule data available.
          </p>
        </div>
      </div>
    );
  }

  const currentPeriod = getCurrentPeriod();
  const nextPeriod = getNextPeriod();
  const selectedDaySchedule = scheduleData.scheduleByDay.find(
    (day) => day.day === selectedDay
  );

  return (
    <div className="space-y-6">
      {/* Class Info and Current Period */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Grade & Section
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  Grade {scheduleData.grade} - {scheduleData.section}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Periods
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {scheduleData.totalPeriods}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Current Period
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {currentPeriod
                    ? `${currentPeriod.subject} (${formatTime(
                        currentPeriod.startTime
                      )} - ${formatTime(currentPeriod.endTime)})`
                    : "No class now"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Period Alert */}
      {nextPeriod && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Next Period</p>
                <p className="text-sm text-gray-600">
                  {nextPeriod.subject} with {nextPeriod.teacherName} at{" "}
                  {formatTime(nextPeriod.startTime)} in {nextPeriod.room}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 gap-2">
            {scheduleData.scheduleByDay.map((daySchedule) => (
              <button
                key={daySchedule.day}
                onClick={() => setSelectedDay(daySchedule.day)}
                className={`p-3 border rounded-lg text-center font-medium transition-colors ${getDayColor(
                  daySchedule.day
                )}`}
              >
                <div className="text-sm capitalize">{daySchedule.day}</div>
                <div className="text-xs mt-1">
                  {daySchedule.periods.length} period
                  {daySchedule.periods.length !== 1 ? "s" : ""}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}{" "}
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDaySchedule && selectedDaySchedule.periods.length > 0 ? (
            <div className="space-y-3">
              {selectedDaySchedule.periods.map((period, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
                      <span className="text-lg font-bold text-indigo-600">
                        {period.period}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {period.subject}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {period.teacherName}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {period.room}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatTime(period.startTime)} -{" "}
                      {formatTime(period.endTime)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {period.className}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No classes scheduled for {selectedDay}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduleData.scheduleByDay.map((daySchedule) => (
              <div key={daySchedule.day} className="p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900 capitalize mb-2">
                  {daySchedule.day}
                </h3>
                <div className="space-y-1">
                  {daySchedule.periods.slice(0, 3).map((period, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-600 flex justify-between"
                    >
                      <span>
                        P{period.period}: {period.subject}
                      </span>
                      <span className="text-xs">
                        {formatTime(period.startTime)}
                      </span>
                    </div>
                  ))}
                  {daySchedule.periods.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{daySchedule.periods.length - 3} more periods
                    </div>
                  )}
                  {daySchedule.periods.length === 0 && (
                    <div className="text-sm text-gray-500">No classes</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleView;
