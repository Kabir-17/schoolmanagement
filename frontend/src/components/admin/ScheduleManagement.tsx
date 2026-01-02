import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "../../services/admin.api";
import { useAuth } from "../../context/AuthContext";

interface Schedule {
  _id?: string;  // MongoDB default
  id?: string;   // API response format
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
}

interface Period {
  periodNumber: number;
  subject?: {
    _id: string;
    name: string;
    code: string;
  };
  teacher?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      fullName: string;
    };
  };
  startTime: string;
  endTime: string;
  venue?: string;
  isBreak: boolean;
  breakType?: "short" | "lunch" | "long";
}

const ScheduleManagement: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState({
    dayOfWeek: "monday",
    grade: "",
    section: "",
    academicYear: (() => {
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${currentYear + 1}`;
    })(),
    periods: [] as Period[],
  });
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [applyToEntireWeek, setApplyToEntireWeek] = useState(false);
  const [copyToDays, setCopyToDays] = useState<string[]>([]);

  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];

  // Calculate duration in minutes from start and end time
  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 15; // Default duration
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
      return 15; // Default duration for invalid times
    }
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    const duration = endTotalMinutes - startTotalMinutes;
    
    // Ensure positive duration
    return duration > 0 ? duration : 15;
  };

  const toMinutes = (time: string) => {
    if (!time) return NaN;
    const [hour, minute] = time.split(":").map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return NaN;
    }
    return hour * 60 + minute;
  };

  const validatePeriodsBeforeSubmit = (periods: Period[]): string | null => {
    if (!periods || periods.length === 0) {
      return "Please add at least one period before saving the schedule.";
    }

    const timeSlots: Array<{ start: number; end: number; periodNumber: number }> = [];
    const teacherSlots = new Map<
      string,
      Array<{ start: number; end: number; periodNumber: number; teacherName: string }>
    >();

    for (const period of periods) {
      if (!period.startTime || !period.endTime) {
        return `Start and end time are required for period ${period.periodNumber}.`;
      }

      const startMinutes = toMinutes(period.startTime);
      const endMinutes = toMinutes(period.endTime);

      if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
        return `Invalid time format for period ${period.periodNumber}.`;
      }

      if (endMinutes <= startMinutes) {
        return `End time must be after start time for period ${period.periodNumber}.`;
      }

      for (const slot of timeSlots) {
        if (startMinutes < slot.end && slot.start < endMinutes) {
          return `Period ${period.periodNumber} overlaps with period ${slot.periodNumber}.`;
        }
      }

      timeSlots.push({ start: startMinutes, end: endMinutes, periodNumber: period.periodNumber });

      if (period.isBreak) {
        if (!period.breakType) {
          return `Please select a break type for period ${period.periodNumber}.`;
        }
        continue;
      }

      if (!period.subject?._id) {
        return `Please select a subject for period ${period.periodNumber}.`;
      }

      if (!period.teacher?.id) {
        return `Please assign a teacher for period ${period.periodNumber}.`;
      }

      const teacherName =
        period.teacher.user.fullName ||
        `${period.teacher.user.firstName} ${period.teacher.user.lastName}`.trim();

      const teacherId = period.teacher.id;
      const existingSlots = teacherSlots.get(teacherId) ?? [];
      for (const slot of existingSlots) {
        if (startMinutes < slot.end && slot.start < endMinutes) {
          return `Teacher ${teacherName} is double-booked within this schedule (period ${period.periodNumber} overlaps with period ${slot.periodNumber}).`;
        }
      }

      existingSlots.push({
        start: startMinutes,
        end: endMinutes,
        periodNumber: period.periodNumber,
        teacherName,
      });
      teacherSlots.set(teacherId, existingSlots);
    }

    return null;
  };

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getSchedules({ limit: 100 });
      const schedulesData = response.data.data || [];
      setSchedules(schedulesData);
    } catch (error) {
      toast.error("Error fetching schedules");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      if (!user) {
        console.warn('⚠️ No user context - cannot fetch subjects');
        return;
      }

      const response = await adminApi.getSubjects();
      const subjectsArray = response.data.data || [];
      setSubjects(subjectsArray);
    } catch (error: any) {
      console.error("❌ Error fetching subjects:", error);
      toast.error("Failed to fetch subjects");
    }
  }, [user]);

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await adminApi.getTeachers();
      setTeachers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  }, []);

  const fetchSchoolData = useCallback(async () => {
    try {
      const response = await adminApi.getSchoolSettings();
      if (response.data.success) {
        setSchoolData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching school data:", error);
    }
  }, []);

  // Fetch data when user context changes
  useEffect(() => {
    fetchSchedules();
    fetchSubjects();
    fetchTeachers();
    fetchSchoolData();
  }, [user, fetchSchedules, fetchSubjects, fetchTeachers, fetchSchoolData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validatePeriodsBeforeSubmit(formData.periods);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);

    try {
      const applyDays =
        !editingSchedule && applyToEntireWeek
          ? daysOfWeek.map((day) => day.value)
          : undefined;

      const transformedFormData = {
        schoolId: user?.schoolId || "",
        grade: parseInt(formData.grade),
        section: formData.section.toUpperCase(),
        academicYear: formData.academicYear.includes("-")
          ? formData.academicYear
          : `${formData.academicYear}-${parseInt(formData.academicYear) + 1}`,
        dayOfWeek: formData.dayOfWeek,
        periods: formData.periods.map((period) => {
          const duration = calculateDuration(period.startTime, period.endTime);

          return period.isBreak
            ? {
                periodNumber: period.periodNumber,
                startTime: period.startTime,
                endTime: period.endTime,
                isBreak: true,
                breakType: period.breakType || "short",
                breakDuration: duration,
              }
            : {
                periodNumber: period.periodNumber,
                subjectId: period.subject?._id,
                teacherId: period.teacher?.id,
                roomNumber: period.venue,
                startTime: period.startTime,
                endTime: period.endTime,
                isBreak: false,
              };
        }),
        ...(applyDays ? { applyToDays: applyDays } : {}),
      };

      if (editingSchedule) {
        const scheduleId = editingSchedule._id || editingSchedule.id;
        if (!scheduleId) {
          throw new Error("Schedule ID is missing. Cannot update schedule.");
        }
        await adminApi.updateSchedule(scheduleId, transformedFormData);
        toast.success("Schedule updated successfully");
      } else {
        const response = await adminApi.createSchedule(transformedFormData);
        const createdCount = Array.isArray(response.data?.data)
          ? response.data.data.length
          : 1;
        toast.success(
          createdCount > 1
            ? `Schedule applied to ${createdCount} days`
            : "Schedule created successfully"
        );
      }

      setIsFormOpen(false);
      setEditingSchedule(null);
      setApplyToEntireWeek(false);
      setCopyToDays([]);
      resetForm();
      fetchSchedules();
    } catch (error: any) {
      console.error("Schedule creation error:", error);
      if (error.response?.data?.message) {
        toast.error(`Validation Error: ${error.response.data.message}`);
      } else {
        toast.error("Error saving schedule");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!window.confirm("Are you sure you want to delete this schedule?"))
      return;

    setLoading(true);
    try {
      await adminApi.deleteSchedule(scheduleId);
      toast.success("Schedule deleted successfully");
      fetchSchedules();
    } catch (error) {
      toast.error("Error deleting schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleClearClassSchedule = async (
    grade: string | number,
    section: string,
    dayOfWeek?: string
  ) => {
    const readableDay = dayOfWeek
      ? daysOfWeek.find((day) => day.value === dayOfWeek)?.label || dayOfWeek
      : "entire week";

    if (
      !window.confirm(
        `Are you sure you want to clear the ${readableDay} schedule for Grade ${grade} Section ${section}?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await adminApi.clearClassSchedule(Number(grade), section, dayOfWeek ? { dayOfWeek } : undefined);
      toast.success(
        dayOfWeek
          ? `Cleared ${readableDay} schedule for Grade ${grade} Section ${section}`
          : `Cleared weekly schedule for Grade ${grade} Section ${section}`
      );
      fetchSchedules();
    } catch (error: any) {
      console.error("Error clearing schedules:", error);
      const message =
        error?.response?.data?.message ||
        "Failed to clear the selected schedules. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCopyDay = (day: string) => {
    setCopyToDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleApplyCopyDays = async () => {
    const selectedDays = copyToDays.filter((day) => day !== formData.dayOfWeek);
    if (selectedDays.length === 0) {
      toast.error("Select at least one additional day to copy this schedule.");
      return;
    }

    const validationError = validatePeriodsBeforeSubmit(formData.periods);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const payloadForDay = (day: string) => ({
        schoolId: user?.schoolId || "",
        grade: parseInt(formData.grade),
        section: formData.section.toUpperCase(),
        academicYear: formData.academicYear.includes("-")
          ? formData.academicYear
          : `${formData.academicYear}-${parseInt(formData.academicYear) + 1}`,
        dayOfWeek: day,
        periods: formData.periods.map((period) =>
          period.isBreak
            ? {
                periodNumber: period.periodNumber,
                startTime: period.startTime,
                endTime: period.endTime,
                isBreak: true,
                breakType: period.breakType || "short",
                breakDuration: calculateDuration(
                  period.startTime,
                  period.endTime
                ),
              }
            : {
                periodNumber: period.periodNumber,
                subjectId: period.subject?._id,
                teacherId: period.teacher?.id,
                roomNumber: period.venue,
                startTime: period.startTime,
                endTime: period.endTime,
                isBreak: false,
              }
        ),
      });

      await Promise.all(
        selectedDays.map((day) => adminApi.createSchedule(payloadForDay(day)))
      );

      toast.success(
        selectedDays.length === 1
          ? `Schedule copied to ${selectedDays[0]}`
          : `Schedule copied to ${selectedDays.length} days`
      );
      setCopyToDays([]);
      fetchSchedules();
    } catch (error: any) {
      if (error.response?.data?.message) {
        toast.error(`Copy failed: ${error.response.data.message}`);
      } else {
        toast.error("Failed to copy schedule to other days");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const currentYear = new Date().getFullYear();
    setFormData({
      dayOfWeek: "monday",
      grade: "",
      section: "",
      academicYear: `${currentYear}-${currentYear + 1}`,
      periods: [],
    });
    setApplyToEntireWeek(false);
    setCopyToDays([]);
  };

  const addPeriod = () => {
    const newPeriod: Period = {
      periodNumber: formData.periods.length + 1,
      startTime: "09:00",
      endTime: "09:45",
      isBreak: false,
    };
    setFormData({
      ...formData,
      periods: [...formData.periods, newPeriod],
    });
  };

  const updatePeriod = (index: number, updatedPeriod: Partial<Period>) => {
    
    const updatedPeriods = formData.periods.map((period, i) =>
      i === index ? { ...period, ...updatedPeriod } : period
    );
    
    setFormData({ ...formData, periods: updatedPeriods });
  };

  const removePeriod = (index: number) => {
    const updatedPeriods = formData.periods
      .filter((_, i) => i !== index)
      .map((period, i) => ({ ...period, periodNumber: i + 1 }));
    setFormData({ ...formData, periods: updatedPeriods });
  };

  const openEditForm = (schedule: Schedule) => {
    
    setApplyToEntireWeek(false);
    setCopyToDays([]);
    setEditingSchedule(schedule);
    setFormData({
      dayOfWeek: schedule.dayOfWeek,
      grade: schedule.grade,
      section: schedule.section,
      academicYear: schedule.academicYear,
      periods: schedule.periods.map((period) => {
        
        // Handle subject mapping
        let mappedSubject;
        if (period.subject) {
          mappedSubject = {
            _id: period.subject._id || (period.subject as any).id,
            name: period.subject.name,
            code: period.subject.code,
          };
        } else if ((period as any).subjectId) {
          mappedSubject = {
            _id: (period as any).subjectId._id || (period as any).subjectId,
            name: (period as any).subjectId.name || 'Unknown Subject',
            code: (period as any).subjectId.code || 'UNK',
          };
        }

        // Handle teacher mapping - try multiple possible structures
        let mappedTeacher;
        if (period.teacher) {
          // Direct teacher object
          mappedTeacher = {
            id: period.teacher._id || (period.teacher as any).id,
            user: {
              firstName: period.teacher.firstName || (period.teacher as any).user?.firstName,
              lastName: period.teacher.lastName || (period.teacher as any).user?.lastName,
              fullName: (period.teacher as any).fullName || 
                       `${period.teacher.firstName || (period.teacher as any).user?.firstName || ''} ${period.teacher.lastName || (period.teacher as any).user?.lastName || ''}`.trim(),
            },
          };
        } else if ((period as any).teacherId) {
          // Teacher ID reference
          const teacherData = (period as any).teacherId;
          mappedTeacher = {
            id: teacherData._id || teacherData.id || teacherData,
            user: {
              firstName: teacherData.firstName || teacherData.user?.firstName || teacherData.userId?.firstName || '',
              lastName: teacherData.lastName || teacherData.user?.lastName || teacherData.userId?.lastName || '',
              fullName: teacherData.fullName || 
                       `${teacherData.firstName || teacherData.user?.firstName || teacherData.userId?.firstName || ''} ${teacherData.lastName || teacherData.user?.lastName || teacherData.userId?.lastName || ''}`.trim(),
            },
          };
        }

        const mappedPeriod = {
          ...period,
          subject: mappedSubject,
          teacher: mappedTeacher,
          venue: period.venue || period.roomNumber || "",
          breakType: period.breakType,
        };

        return mappedPeriod;
      }),
    });
    setIsFormOpen(true);
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const groupSchedulesByClass = () => {
    const grouped: { [key: string]: Schedule[] } = {};
    schedules.forEach((schedule) => {
      const key = `${schedule.grade}-${schedule.section}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(schedule);
    });
    const dayRank = new Map(daysOfWeek.map((day, index) => [day.value, index]));
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => {
        const rankA = dayRank.get(a.dayOfWeek) ?? 99;
        const rankB = dayRank.get(b.dayOfWeek) ?? 99;
        return rankA - rankB;
      });
    });
    return grouped;
  };

  // Helper functions to safely extract data
  const getSubjectName = (period: SchedulePeriod) => {
    if (period.subject?.name) return period.subject.name;
    if ((period as any).subjectId?.name) return (period as any).subjectId.name;
    return "Free";
  };

  const getTeacherName = (period: SchedulePeriod) => {
    if (period.teacher?.firstName && period.teacher?.lastName) {
      return `${period.teacher.firstName} ${period.teacher.lastName}`;
    }
    if ((period as any).teacherId?.userId?.firstName && (period as any).teacherId?.userId?.lastName) {
      return `${(period as any).teacherId.userId.firstName} ${(period as any).teacherId.userId.lastName}`;
    }
    return null;
  };

  const getVenue = (period: SchedulePeriod) => {
    return period.venue || period.roomNumber || null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Schedule Management
            </h1>
            <p className="text-gray-600 text-lg">Manage class timetables and periods</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => window.open('/admin/subjects', '_blank')}
              className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Manage Subjects
            </Button>
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="bg-white border-gray-200 hover:bg-gray-50 shadow-sm"
            >
              {viewMode === "grid" ? "List View" : "Grid View"}
            </Button>
            <Button 
              onClick={() => {
                setEditingSchedule(null);
                resetForm();
                setIsFormOpen(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Schedule
            </Button>
          </div>
        </div>

      {/* Schedule Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-semibold flex items-center gap-3">
                    <Calendar className="w-6 h-6" />
                    {editingSchedule ? "Edit Schedule" : "Create New Schedule"}
                  </CardTitle>
                  <p className="text-blue-100 mt-1">
                    {editingSchedule ? "Modify the schedule details below" : "Set up a new class schedule with periods and subjects"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingSchedule(null);
                    resetForm();
                  }}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Schedule Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Schedule Information</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Day of Week*
                    </label>
                    <Select
                      value={formData.dayOfWeek}
                      onValueChange={(value) =>
                        setFormData({ ...formData, dayOfWeek: value })
                      }
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg">
                        <SelectValue placeholder="Select Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Grade*
                    </label>
                    <Select
                      value={formData.grade}
                      onValueChange={(value) =>
                        setFormData({ ...formData, grade: value })
                      }
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg">
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {schoolData?.settings?.grades?.length > 0 ? (
                          schoolData.settings.grades.map((grade: number) => (
                            <SelectItem key={grade} value={grade.toString()}>
                              Grade {grade}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>
                            {schoolData ? "No grades configured" : "Loading grades..."}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Section*
                    </label>
                    <Select
                      value={formData.section}
                      onValueChange={(value) =>
                        setFormData({ ...formData, section: value })
                      }
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg">
                        <SelectValue placeholder="Select Section" />
                      </SelectTrigger>
                      <SelectContent>
                        {schoolData?.settings?.sections?.length > 0 ? (
                          schoolData.settings.sections.map((section: string) => (
                            <SelectItem key={section} value={section}>
                              Section {section}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>
                            {schoolData ? "No sections configured" : "Loading sections..."}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Academic Year*
                    </label>
                    <Select
                      value={formData.academicYear}
                      onValueChange={(value) =>
                        setFormData({ ...formData, academicYear: value })
                      }
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg">
                        <SelectValue placeholder="Select Academic Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const currentYear = new Date().getFullYear();
                          const years = [];
                          for (let i = currentYear - 1; i <= currentYear + 2; i++) {
                            const yearRange = `${i}-${i + 1}`;
                            years.push(
                              <SelectItem key={`year-${yearRange}`} value={yearRange}>
                                {yearRange}
                              </SelectItem>
                            );
                          }
                          return years;
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  {!editingSchedule && (
                    <div className="sm:col-span-2 lg:col-span-4 flex items-start gap-3 bg-blue-50/60 border border-blue-100 rounded-lg p-4">
                      <input
                        id="apply-entire-week"
                        type="checkbox"
                        className="mt-1 h-5 w-5 rounded border-blue-200 text-blue-600 focus:ring-blue-500"
                        checked={applyToEntireWeek}
                        onChange={(event) => setApplyToEntireWeek(event.target.checked)}
                      />
                      <div>
                        <label
                          htmlFor="apply-entire-week"
                          className="block text-sm font-semibold text-blue-900"
                        >
                          Apply this routine to the entire week
                        </label>
                        <p className="text-sm text-blue-700 mt-1">
                          Duplicates this day's periods to every school day (Monday–Sunday). Clear other days first to avoid conflicts.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                </div>

                {editingSchedule && (
                  <div className="border border-blue-100 bg-blue-50/60 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <h4 className="text-sm font-semibold text-blue-900">
                        Copy this routine to additional days
                      </h4>
                    </div>
                    <p className="text-sm text-blue-700">
                      Select one or more days to create matching schedules after you finish editing this one.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {daysOfWeek
                        .filter((day) => day.value !== formData.dayOfWeek)
                        .map((day) => (
                          <label
                            key={`copy-${day.value}`}
                            className="flex items-center gap-2 bg-white border border-blue-100 rounded-md px-3 py-2 text-sm text-blue-800 hover:border-blue-300 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-blue-200 text-blue-600 focus:ring-blue-500"
                              checked={copyToDays.includes(day.value)}
                              onChange={() => toggleCopyDay(day.value)}
                            />
                            <span>{day.label}</span>
                          </label>
                        ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyCopyDays}
                      disabled={loading || copyToDays.length === 0}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                    >
                      Apply to selected days
                    </Button>
                  </div>
                )}

                {/* Periods Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-800">Class Periods</h3>
                    </div>
                    <Button 
                      type="button" 
                      onClick={addPeriod} 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Period
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {formData.periods.map((period, index) => (
                      <div key={`period-${period.periodNumber}-${index}`} className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 hover:border-blue-300 p-6 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-lg text-gray-800">
                            Period {period.periodNumber}
                          </h4>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <input
                                aria-label="Break"
                                type="checkbox"
                                checked={period.isBreak}
                                onChange={(e) =>
                                  updatePeriod(index, {
                                    isBreak: e.target.checked,
                                  })
                                }
                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <label className="text-sm font-medium text-gray-700">Break Period</label>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removePeriod(index)}
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* First Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              Start Time*
                            </label>
                            <Input
                              type="time"
                              value={period.startTime}
                              onChange={(e) =>
                                updatePeriod(index, {
                                  startTime: e.target.value,
                                })
                              }
                              className="border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              End Time*
                            </label>
                            <Input
                              type="time"
                              value={period.endTime}
                              onChange={(e) =>
                                updatePeriod(index, { endTime: e.target.value })
                              }
                              className="border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg"
                              required
                            />
                          </div>
                          
                          {/* Only show subject and venue for non-break periods */}
                          {!period.isBreak && (
                            <>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Subject
                                </label>
                                <div className="flex gap-2">
                                  <Select
                                    value={period.subject?._id || ""}
                                    onValueChange={(value) => {
                                      const subject = subjects.find(
                                        (s: any) => s._id === value
                                      );
                                      updatePeriod(index, { subject });
                                    }}
                                  >
                                    <SelectTrigger className="flex-1 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg">
                                      <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {subjects && Array.isArray(subjects) && subjects.length > 0 ? (
                                        subjects.map((subject: any) => (
                                          <SelectItem
                                            key={subject._id}
                                            value={subject._id}
                                          >
                                            {subject.name} ({subject.code})
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <SelectItem value="no-subjects" disabled>
                                          No subjects available - Please add subjects first
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchSubjects}
                                    title="Refresh subjects"
                                    className="border-2 border-gray-200 hover:border-blue-300"
                                  >
                                    🔄
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Venue
                                </label>
                                <Input
                                  value={period.venue || ""}
                                  onChange={(e) =>
                                    updatePeriod(index, { venue: e.target.value })
                                  }
                                  placeholder="Room/Hall"
                                  className="border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg"
                                />
                              </div>
                            </>
                          )}
                        </div>

                        {/* Second Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Only show teacher for non-break periods */}
                          {!period.isBreak && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                Teacher
                              </label>
                              <Select
                                value={period.teacher?.id || ""}
                                onValueChange={(value) => {
                                  const teacher = teachers.find(
                                    (t: any) => t.id === value
                                  );
                                  updatePeriod(index, { teacher });
                                }}
                              >
                                <SelectTrigger className="border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg">
                                  <SelectValue placeholder="Select Teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                  {teachers.map((teacher: any) => (
                                    <SelectItem
                                      key={teacher._id || teacher.id}
                                      value={teacher._id || teacher.id}
                                    >
                                      {teacher.user.firstName}{" "}
                                      {teacher.user.lastName}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          )}
                          
                          {/* Break-specific fields */}
                          {period.isBreak && (
                            <>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Break Type*
                                </label>
                                <Select
                                  value={period.breakType || "short"}
                                  onValueChange={(
                                    value: "short" | "lunch" | "long"
                                  ) => updatePeriod(index, { breakType: value })}
                                >
                                  <SelectTrigger className="border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg">
                                    <SelectValue placeholder="Select Break Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="short">
                                      Short Break
                                    </SelectItem>
                                    <SelectItem value="lunch">
                                      Lunch Break
                                    </SelectItem>
                                    <SelectItem value="long">
                                      Long Break
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      !formData.grade ||
                      !formData.section ||
                      formData.periods.length === 0
                    }
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading
                      ? "Saving..."
                      : editingSchedule
                      ? "Update Schedule"
                      : "Create Schedule"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingSchedule(null);
                      resetForm();
                    }}
                    className="px-8 py-3 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-all"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedules Display */}
      <div className="space-y-8">
        {viewMode === "grid" ? (
          <div className="space-y-8">
            {Object.entries(groupSchedulesByClass()).map(
              ([classKey, classSchedules]) => {
                const [classGrade, classSection] = classKey.split("-");
                return (
                  <Card key={classKey} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="text-xl font-semibold">
                          Class {classKey} - Weekly Schedule
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClearClassSchedule(Number(classGrade), classSection)}
                          className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Reset Weekly Schedule
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                    <div className="overflow-x-auto rounded-lg shadow-inner">
                      <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
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
                          {/* Generate time slots based on periods */}
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((periodNum) => (
                            <tr key={periodNum} className="hover:bg-blue-50/50 transition-colors">
                              <td className="border border-gray-200 p-4 font-medium bg-gradient-to-r from-gray-50 to-blue-50 text-gray-700">
                                Period {periodNum}
                              </td>
                              {daysOfWeek.map((day) => {
                                const daySchedule = classSchedules.find(
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
                                        {!period.isBreak && getTeacherName(period) && (
                                          <div className="text-blue-600 font-medium">
                                            👨‍🏫 {getTeacherName(period)}
                                          </div>
                                        )}
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
                    <div className="flex flex-wrap gap-3 mt-6">
                      {classSchedules.map((schedule) => (
                        <div
                          key={
                            schedule._id ||
                            schedule.id ||
                            `edit-${schedule.grade}-${schedule.section}-${schedule.dayOfWeek}`
                          }
                          className="flex gap-2"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditForm(schedule)}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 shadow-sm"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit{" "}
                            {daysOfWeek.find(
                              (d) => d.value === schedule.dayOfWeek
                            )?.label || schedule.dayOfWeek}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleClearClassSchedule(
                                schedule.grade,
                                schedule.section,
                                schedule.dayOfWeek
                              )
                            }
                            className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 shadow-sm"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Clear Day
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                );
              }
            )}
          </div>
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold">All Schedules</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading schedules...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule._id || schedule.id || `schedule-${schedule.grade}-${schedule.section}-${schedule.dayOfWeek}`}
                      className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-xl hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-lg text-gray-800">
                            📚 Class {schedule.grade}-{schedule.section} -{" "}
                            {daysOfWeek.find(
                              (d) => d.value === schedule.dayOfWeek
                            )?.label || schedule.dayOfWeek}
                          </h3>
                          <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                            {schedule.periods.length} periods
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span>Academic Year: {schedule.academicYear}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-green-500" />
                            <span>
                              {schedule.periods.length > 0 &&
                                `${formatTime(
                                  schedule.periods[0].startTime
                                )} - ${formatTime(
                                  schedule.periods[schedule.periods.length - 1]
                                    .endTime
                                )}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleClearClassSchedule(
                              schedule.grade,
                              schedule.section
                            )
                          }
                          className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Reset Week
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditForm(schedule)}
                          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 shadow-sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const scheduleId = schedule._id || schedule.id;
                            if (scheduleId) handleDelete(scheduleId);
                          }}
                          className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {schedules.length === 0 && (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">📅</div>
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No schedules found</h3>
                      <p className="text-gray-500 mb-6">Create your first schedule to get started!</p>
                      <Button
                        onClick={() => {
                          setEditingSchedule(null);
                          resetForm();
                          setIsFormOpen(true);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Schedule
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
};

export default ScheduleManagement;
