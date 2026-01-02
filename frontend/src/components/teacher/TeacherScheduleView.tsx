import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  Activity,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { teacherApi } from "../../services/teacher.api";

interface TeacherScheduleData {
  teacher: {
    id: string;
    teacherId: string;
    name: string;
    subjects: string[];
    grades: number[];
    sections: string[];
    designation: string;
    isClassTeacher: boolean;
    classTeacherFor?: {
      grade: number;
      section: string;
    };
  };
  weeklySchedule: {
    [key: string]: ScheduleEntry[];
  };
  todaySchedule: ScheduleEntry[];
  currentPeriod?: ScheduleEntry;
  nextPeriod?: ScheduleEntry;
  statistics: {
    totalPeriodsPerWeek: number;
    uniqueSubjects: number;
    uniqueClasses: number;
    averagePeriodsPerDay: number;
    busyDays: number;
  };
}

interface ScheduleEntry {
  scheduleId: string;
  grade: number;
  section: string;
  className: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  roomNumber?: string;
  venue?: string;
  duration: number;
}

const TeacherScheduleView: React.FC = () => {
  const [scheduleData, setScheduleData] = useState<TeacherScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'weekly' | 'today' | 'statistics'>('weekly');

  useEffect(() => {
    loadScheduleData();
    const interval = setInterval(loadScheduleData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      const response = await teacherApi.getTeacherSchedule();
      if (response.data.success) {
        setScheduleData(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to load schedule data:", error);
      toast.error("Failed to load schedule data");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Monday', short: 'Mon' },
    { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { key: 'thursday', label: 'Thursday', short: 'Thu' },
    { key: 'friday', label: 'Friday', short: 'Fri' },
    { key: 'saturday', label: 'Saturday', short: 'Sat' },
    { key: 'sunday', label: 'Sunday', short: 'Sun' },
  ];

  const getCurrentDayStatus = () => {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today.getDay()];
    return todayName;
  };

  const isCurrentPeriod = (period: ScheduleEntry) => {
    if (!scheduleData?.currentPeriod) return false;
    return scheduleData.currentPeriod.scheduleId === period.scheduleId && 
           scheduleData.currentPeriod.periodNumber === period.periodNumber;
  };

  const isNextPeriod = (period: ScheduleEntry) => {
    if (!scheduleData?.nextPeriod) return false;
    return scheduleData.nextPeriod.scheduleId === period.scheduleId && 
           scheduleData.nextPeriod.periodNumber === period.periodNumber;
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  if (!scheduleData) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Schedule</h2>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No schedule data available or failed to load.</p>
            <Button onClick={loadScheduleData} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">My Schedule</h2>
            <p className="text-gray-600">
              Welcome, {scheduleData.teacher.name} • {scheduleData.teacher.designation}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'today' ? 'default' : 'outline'}
              onClick={() => setViewMode('today')}
              size="sm"
            >
              <Clock className="w-4 h-4 mr-2" />
              Today
            </Button>
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'outline'}
              onClick={() => setViewMode('weekly')}
              size="sm"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Weekly
            </Button>
            <Button
              variant={viewMode === 'statistics' ? 'default' : 'outline'}
              onClick={() => setViewMode('statistics')}
              size="sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Stats
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Classes</p>
                <p className="text-2xl font-bold text-gray-900">{scheduleData.statistics.uniqueClasses}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Subjects</p>
                <p className="text-2xl font-bold text-gray-900">{scheduleData.statistics.uniqueSubjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Weekly Periods</p>
                <p className="text-2xl font-bold text-gray-900">{scheduleData.statistics.totalPeriodsPerWeek}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Avg/Day</p>
                <p className="text-2xl font-bold text-gray-900">{scheduleData.statistics.averagePeriodsPerDay}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Active Days</p>
                <p className="text-2xl font-bold text-gray-900">{scheduleData.statistics.busyDays}/6</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current/Next Period Alert */}
        {(scheduleData.currentPeriod || scheduleData.nextPeriod) && (
          <div className="grid gap-4 md:grid-cols-2">
            {scheduleData.currentPeriod && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Clock className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">Current Period:</span> {scheduleData.currentPeriod.subject.name} - {scheduleData.currentPeriod.className}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {formatTime(scheduleData.currentPeriod.startTime)} - {formatTime(scheduleData.currentPeriod.endTime)}
                      {scheduleData.currentPeriod.venue && ` • ${scheduleData.currentPeriod.venue}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {scheduleData.nextPeriod && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Clock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Next Period:</span> {scheduleData.nextPeriod.subject.name} - {scheduleData.nextPeriod.className}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {formatTime(scheduleData.nextPeriod.startTime)} - {formatTime(scheduleData.nextPeriod.endTime)}
                      {scheduleData.nextPeriod.venue && ` • ${scheduleData.nextPeriod.venue}`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white shadow rounded-lg">
          {viewMode === 'weekly' && (
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Schedule</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      {daysOfWeek.map((day) => (
                        <th
                          key={day.key}
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            getCurrentDayStatus() === day.key 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'text-gray-500'
                          }`}
                        >
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((periodNum) => (
                      <tr key={periodNum} className={getCurrentDayStatus() === 'monday' ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Period {periodNum}
                        </td>
                        {daysOfWeek.map((day) => {
                          const period = scheduleData.weeklySchedule[day.key]?.find(
                            (p) => p.periodNumber === periodNum
                          );

                          return (
                            <td
                              key={`${day.key}-${periodNum}`}
                              className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${
                                getCurrentDayStatus() === day.key ? 'bg-blue-50' : ''
                              } ${
                                period && isCurrentPeriod(period) ? 'bg-green-100 border border-green-300' : ''
                              } ${
                                period && isNextPeriod(period) ? 'bg-blue-100 border border-blue-300' : ''
                              }`}
                            >
                              {period ? (
                                <div className="space-y-1">
                                  <div className="font-medium text-gray-900">{period.subject.name}</div>
                                  <div className="text-xs text-gray-600">{period.className}</div>
                                  <div className="text-xs text-gray-500">
                                    {formatTime(period.startTime)} - {formatTime(period.endTime)}
                                  </div>
                                  {period.venue && (
                                    <div className="text-xs text-purple-600">{period.venue}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">Free</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'today' && (
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Schedule</h3>
              {scheduleData.todaySchedule.length > 0 ? (
                <div className="space-y-4">
                  {scheduleData.todaySchedule.map((period) => (
                    <div
                      key={`${period.scheduleId}-${period.periodNumber}`}
                      className={`p-4 rounded-lg border ${
                        isCurrentPeriod(period)
                          ? 'bg-green-50 border-green-200'
                          : isNextPeriod(period)
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            isCurrentPeriod(period)
                              ? 'bg-green-100'
                              : isNextPeriod(period)
                              ? 'bg-blue-100'
                              : 'bg-gray-100'
                          }`}>
                            <BookOpen className={`h-5 w-5 ${
                              isCurrentPeriod(period)
                                ? 'text-green-600'
                                : isNextPeriod(period)
                                ? 'text-blue-600'
                                : 'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{period.subject.name}</h4>
                            <p className="text-sm text-gray-600">{period.className}</p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span>Period {period.periodNumber}</span>
                              <span>{formatTime(period.startTime)} - {formatTime(period.endTime)}</span>
                              {period.venue && <span>{period.venue}</span>}
                            </div>
                          </div>
                        </div>
                        <div>
                          {isCurrentPeriod(period) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Current
                            </span>
                          )}
                          {isNextPeriod(period) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Next
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎉</div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Classes Today</h3>
                  <p className="text-gray-500">Enjoy your free day!</p>
                </div>
              )}
            </div>
          )}

          {viewMode === 'statistics' && (
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Teaching Statistics</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weekly Periods:</span>
                    <span className="font-semibold">{scheduleData.statistics.totalPeriodsPerWeek}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Per Day:</span>
                    <span className="font-semibold">{scheduleData.statistics.averagePeriodsPerDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Days:</span>
                    <span className="font-semibold">{scheduleData.statistics.busyDays}/6</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Subjects:</h4>
                    <div className="flex flex-wrap gap-1">
                      {scheduleData.teacher.subjects.map((subject) => (
                        <span
                          key={subject}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Grade Levels:</h4>
                    <div className="flex flex-wrap gap-1">
                      {scheduleData.teacher.grades.map((grade) => (
                        <span
                          key={grade}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          Grade {grade}
                        </span>
                      ))}
                    </div>
                  </div>

                  {scheduleData.teacher.isClassTeacher && scheduleData.teacher.classTeacherFor && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Class Teacher:</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Grade {scheduleData.teacher.classTeacherFor.grade} - Section {scheduleData.teacher.classTeacherFor.section}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherScheduleView;
