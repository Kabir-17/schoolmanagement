import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Calendar,
  BookOpen,
  AlertTriangle,
  Clock,
  GraduationCap,
} from "lucide-react";
import { eventAPI, IEvent } from "@/services/event.api";
import { useAuth } from "../../context/AuthContext";

interface CalendarEvent {
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate: string;
  color: string;
  applicableTo?: string[];
}

interface CalendarData {
  events: CalendarEvent[];
  summary: {
    totalEvents: number;
    holidays: number;
    exams: number;
    homework: number;
  };
}

const CalendarView: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filter, setFilter] = useState<
    "all" | "holidays" | "exams" | "homework"
  >("all");

  useEffect(() => {
    loadCalendarData();
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCalendarData = async () => {
    // Don't load if user is not authenticated
    if (authLoading || !user) {
      setLoading(false);
      if (!authLoading && !user) {
        setError('Please log in to view calendar events');
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await eventAPI.getEvents({ limit: 100 });
      if (response.success && response.data) {
        const events = 'events' in response.data ? response.data.events : [];
        
        // Convert IEvent to CalendarEvent format
        const convertedEvents = events.map((event: IEvent) => ({
          title: event.title,
          description: event.description || '',
          eventType: event.type,
          startDate: event.date,
          endDate: event.date,
          color: getEventColor({ eventType: event.type } as CalendarEvent),
          applicableTo: event.targetAudience.roles
        }));

        // Create summary  
        const summary = {
          totalEvents: convertedEvents.length,
          holidays: convertedEvents.filter(e => e.eventType === 'holiday').length,
          exams: convertedEvents.filter(e => e.eventType === 'exam').length,
          homework: convertedEvents.filter(e => e.eventType === 'academic' || e.eventType === 'announcement').length,
        };

        setCalendarData({ events: convertedEvents, summary });
      } else {
        setError("Failed to load calendar data: " + (response.message || "Unknown error"));
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Please log in to view calendar events");
      } else if (err.response?.status === 403) {
        setError("You don't have permission to view calendar events");
      } else {
        setError("Unable to load calendar events. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (event: CalendarEvent) => {
    if (event.eventType === "holiday")
      return <AlertTriangle className="w-4 h-4" />;
    if (event.eventType === "exam")
      return <GraduationCap className="w-4 h-4" />;
    if (event.eventType === "homework") return <BookOpen className="w-4 h-4" />;
    return <Calendar className="w-4 h-4" />;
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.eventType === "holiday")
      return "bg-red-100 text-red-800 border-red-200";
    if (event.eventType === "exam")
      return "bg-blue-100 text-blue-800 border-blue-200";
    if (event.eventType === "homework")
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    if (!calendarData) return [];

    return calendarData.events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);

      // Check if the date falls within the event range
      const isInRange = date >= eventStart && date <= eventEnd;

      // Apply filter
      let matchesFilter = true;
      if (filter === "holidays") matchesFilter = event.eventType === "holiday";
      else if (filter === "exams") matchesFilter = event.eventType === "exam";
      else if (filter === "homework")
        matchesFilter = event.eventType === "homework";

      return isInRange && matchesFilter;
    });
  };

  const filteredEvents = (calendarData?.events || []).filter((event) => {
    if (filter === "all") return true;
    if (filter === "holidays") return event.eventType === "holiday";
    if (filter === "exams") return event.eventType === "exam";
    if (filter === "homework") return event.eventType === "homework";
    return true;
  });

  const upcomingEvents = filteredEvents
    .filter((event) => new Date(event.startDate) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    .slice(0, 5);

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
              onClick={loadCalendarData}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!calendarData) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-500 text-center">
            No calendar data available.
          </p>
        </div>
      </div>
    );
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDayOfMonth = getFirstDayOfMonth(selectedYear, selectedMonth);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Events
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {calendarData?.summary?.totalEvents || 0}
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
                <p className="text-sm font-medium text-gray-600">Holidays</p>
                <p className="text-2xl font-bold text-red-600">
                  {calendarData?.summary?.holidays || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Exams</p>
                <p className="text-2xl font-bold text-blue-600">
                  {calendarData?.summary?.exams || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Homework</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {calendarData?.summary?.homework || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Events ({calendarData.summary.totalEvents})
            </button>
            <button
              onClick={() => setFilter("holidays")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === "holidays"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Holidays ({calendarData?.summary?.holidays || 0})
            </button>
            <button
              onClick={() => setFilter("exams")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === "exams"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Exams ({calendarData?.summary?.exams || 0})
            </button>
            <button
              onClick={() => setFilter("homework")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === "homework"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Homework ({calendarData?.summary?.homework || 0})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              {monthNames[selectedMonth]} {selectedYear}
            </CardTitle>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (selectedMonth === 0) {
                    setSelectedMonth(11);
                    setSelectedYear(selectedYear - 1);
                  } else {
                    setSelectedMonth(selectedMonth - 1);
                  }
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  if (selectedMonth === 11) {
                    setSelectedMonth(0);
                    setSelectedYear(selectedYear + 1);
                  } else {
                    setSelectedMonth(selectedMonth + 1);
                  }
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                Next
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-2 text-center font-medium text-gray-700 bg-gray-100"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} className="p-2 bg-gray-50"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, day) => {
              const date = new Date(selectedYear, selectedMonth, day + 1);
              const eventsForDay = getEventsForDate(date);
              const isCurrentDay = isToday(date);
              const isPastDay = isPast(date);

              return (
                <div
                  key={day}
                  className={`p-2 min-h-[80px] border border-gray-200 ${
                    isCurrentDay ? "bg-indigo-50 border-indigo-300" : "bg-white"
                  } ${isPastDay ? "opacity-60" : ""}`}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isCurrentDay
                        ? "text-indigo-600"
                        : isPastDay
                        ? "text-gray-400"
                        : "text-gray-900"
                    }`}
                  >
                    {day + 1}
                  </div>
                  <div className="space-y-1">
                    {eventsForDay.slice(0, 2).map((event, index) => (
                      <div
                        key={index}
                        className={`text-xs p-1 rounded truncate ${getEventColor(
                          event
                        )}`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {eventsForDay.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{eventsForDay.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg"
              >
                <div className={`p-2 rounded-lg ${getEventColor(event)}`}>
                  {getEventIcon(event)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {event.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{formatDate(event.startDate)}</span>
                    {event.startDate !== event.endDate && (
                      <span>to {formatDate(event.endDate)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {upcomingEvents.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming events found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;
