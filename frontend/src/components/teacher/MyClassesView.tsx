import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  Users,
  RefreshCw,
  AlertCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { teacherApi } from "../../services/teacher.api";

interface Schedule {
  _id: string;
  dayOfWeek: string;
  grade: string;
  section: string;
  academicYear: string;
  periods: SchedulePeriod[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SchedulePeriod {
  periodNumber: number;
  subject?: {
    _id: string;
    name: string;
    code: string;
  };
  subjectId?: {
    _id: string;
    name: string;
    code: string;
  };
  teacher?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  teacherId?: {
    _id: string;
    userId: {
      firstName: string;
      lastName: string;
    };
  };
  startTime: string;
  endTime: string;
  venue?: string;
  roomNumber?: string;
  isBreak: boolean;
  breakType?: "short" | "lunch" | "long";
  breakDuration?: number;
}

interface ClassSummary {
  classKey: string;
  grade: string;
  section: string;
  schedules: Schedule[];
  totalPeriods: number;
  subjects: string[];
  days: string[];
}

const MyClassesView: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadTeacherSchedules();
  }, []);

  const loadTeacherSchedules = async () => {
    try {
      setLoading(true);
      const response = await teacherApi.getTeacherSchedule();
      if (response.data.success) {
        // Convert the weeklySchedule format to our schedules array format
        const { weeklySchedule } = response.data.data;
        const convertedSchedules: Schedule[] = [];
        
        Object.entries(weeklySchedule).forEach(([dayOfWeek, periods]) => {
          if (Array.isArray(periods) && periods.length > 0) {
            // Group periods by class (grade-section)
            const classPeriods = periods.reduce((acc: any, period: any) => {
              const classKey = `${period.grade}-${period.section}`;
              if (!acc[classKey]) {
                acc[classKey] = {
                  _id: period.scheduleId,
                  dayOfWeek,
                  grade: period.grade.toString(),
                  section: period.section,
                  academicYear: "2024-2025", // Default value
                  periods: [],
                  isActive: true,
                  createdAt: "",
                  updatedAt: ""
                };
              }
              acc[classKey].periods.push({
                periodNumber: period.periodNumber,
                subject: period.subject,
                startTime: period.startTime,
                endTime: period.endTime,
                venue: period.venue,
                isBreak: false,
              });
              return acc;
            }, {});
            
            // Add all class schedules for this day
            Object.values(classPeriods).forEach((schedule: any) => {
              // Sort periods by period number
              schedule.periods.sort((a: any, b: any) => a.periodNumber - b.periodNumber);
              convertedSchedules.push(schedule);
            });
          }
        });
        
        setSchedules(convertedSchedules);
      }
    } catch (error: any) {
      console.error("Failed to load teacher schedules:", error);
      toast.error("Failed to load class schedules");
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSubjectName = (period: SchedulePeriod): string => {
    return period.subject?.name || period.subjectId?.name || "Unknown Subject";
  };

  const getVenue = (period: SchedulePeriod): string => {
    return period.venue || period.roomNumber || "";
  };

  const groupSchedulesByClass = (): ClassSummary[] => {
    const grouped: { [key: string]: Schedule[] } = {};
    
    schedules.forEach((schedule) => {
      const key = `${schedule.grade}-${schedule.section}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(schedule);
    });

    return Object.entries(grouped).map(([classKey, classSchedules]) => {
      const [grade, section] = classKey.split('-');
      const totalPeriods = classSchedules.reduce((sum, schedule) => 
        sum + schedule.periods.filter(p => !p.isBreak).length, 0);
      
      const subjects = Array.from(new Set(
        classSchedules.flatMap(schedule => 
          schedule.periods
            .filter(p => !p.isBreak)
            .map(p => getSubjectName(p))
        )
      ));

      const days = classSchedules.map(s => s.dayOfWeek).sort();

      return {
        classKey,
        grade,
        section,
        schedules: classSchedules,
        totalPeriods,
        subjects,
        days
      };
    });
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your classes...</p>
        </div>
      </div>
    );
  }

  const classSummaries = groupSchedulesByClass();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">My Classes</h2>
            <p className="text-gray-600">
              Classes you teach - {classSummaries.length} classes total
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              size="sm"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Grid View
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              size="sm"
            >
              <Users className="w-4 h-4 mr-2" />
              List View
            </Button>
            <Button
              variant="outline"
              onClick={loadTeacherSchedules}
              size="sm"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Classes Display */}
        {classSummaries.length > 0 ? (
          <div className="space-y-8">
            {viewMode === 'grid' ? (
              // Grid View - Weekly Schedule Tables (like admin)
              <div className="space-y-8">
                {classSummaries.map((classInfo) => (
                  <Card key={classInfo.classKey} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                      <CardTitle className="text-xl font-semibold">
                        📚 Class {classInfo.grade}-{classInfo.section} - Weekly Schedule
                      </CardTitle>
                      <div className="flex items-center gap-4 text-green-100">
                        <span>{classInfo.totalPeriods} periods/week</span>
                        <span>{classInfo.subjects.length} subjects</span>
                        <span>{classInfo.days.length} active days</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="overflow-x-auto rounded-lg shadow-inner">
                        <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-green-50">
                              <th className="border border-gray-200 p-4 text-left font-semibold text-gray-700">
                                Time
                              </th>
                              {daysOfWeek.map((day) => (
                                <th
                                  key={day.value}
                                  className="border border-gray-200 p-4 text-left font-semibold text-gray-700"
                                >
                                  {day.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((periodNum) => (
                              <tr key={periodNum} className="hover:bg-green-50/50 transition-colors">
                                <td className="border border-gray-200 p-4 font-medium bg-gradient-to-r from-gray-50 to-green-50 text-gray-700">
                                  Period {periodNum}
                                </td>
                                {daysOfWeek.map((day) => {
                                  const daySchedule = classInfo.schedules.find(
                                    (s) => s.dayOfWeek === day.value
                                  );
                                  const period = daySchedule?.periods.find(
                                    (p) => p.periodNumber === periodNum
                                  );

                                  return (
                                    <td
                                      key={`${day.value}-${periodNum}`}
                                      className="border border-gray-200 p-4"
                                    >
                                      {period ? (
                                        <div className="text-sm space-y-1">
                                          <div className="font-semibold text-gray-800">
                                            {period.isBreak
                                              ? "🕐 Break"
                                              : `📚 ${getSubjectName(period)}`}
                                          </div>
                                          <div className="text-gray-500 text-xs">
                                            ⏰ {formatTime(period.startTime)} -{" "}
                                            {formatTime(period.endTime)}
                                          </div>
                                          {getVenue(period) && (
                                            <div className="text-purple-600 text-xs font-medium">
                                              📍 {getVenue(period)}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-gray-400 text-sm text-center">
                                          -
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Class Info */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-2">Subjects You Teach</h4>
                          <div className="flex flex-wrap gap-2">
                            {classInfo.subjects.map((subject, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">Active Days</h4>
                          <div className="flex flex-wrap gap-2">
                            {classInfo.days.map((day, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize"
                              >
                                {day}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-purple-800 mb-2">Class Stats</h4>
                          <div className="text-sm text-purple-700">
                            <p>{classInfo.totalPeriods} total periods per week</p>
                            <p>{Math.round(classInfo.totalPeriods / classInfo.days.length)} avg periods per day</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // List View - Compact class cards
              <div className="grid gap-6 md:grid-cols-2">
                {classSummaries.map((classInfo) => (
                  <Card key={classInfo.classKey} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                      <CardTitle className="text-lg">
                        Class {classInfo.grade}-{classInfo.section}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-green-600">{classInfo.totalPeriods}</div>
                            <div className="text-xs text-gray-500">Periods/Week</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{classInfo.subjects.length}</div>
                            <div className="text-xs text-gray-500">Subjects</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600">{classInfo.days.length}</div>
                            <div className="text-xs text-gray-500">Active Days</div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Your Subjects:</h4>
                          <div className="flex flex-wrap gap-1">
                            {classInfo.subjects.map((subject, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Users className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
              <p className="text-gray-600 mb-4">
                You haven't been assigned to any classes yet. Please contact your administrator.
              </p>
              <Button onClick={loadTeacherSchedules} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyClassesView;
