import { Types } from "mongoose";
import { AttendanceEvent } from "./attendance-event.model";
import { Attendance } from "./attendance.model";
import { Student } from "../student/student.model";
import { School } from "../school/school.model";

/**
 * Auto-Attend Event Reconciliation Service
 * Merges camera-captured events with teacher manual attendance
 */
export class AutoAttendReconciliationService {
  /**
   * Get attendance events for a specific date/period with reconciliation data
   * Shows which students were captured by camera but not marked by teacher (and vice versa)
   */
  static async reconcileAttendanceForPeriod(
    schoolId: string,
    date: Date,
    grade: number,
    section: string,
    period?: number
  ): Promise<{
    manualAttendance: any[];
    cameraEvents: any[];
    discrepancies: Array<{
      studentId: string;
      firstName: string;
      issue: string;
      cameraStatus: string | null;
      teacherStatus: string | null;
      capturedAt?: Date;
      markedAt?: Date;
    }>;
    summary: {
      totalStudents: number;
      cameraDetections: number;
      teacherMarks: number;
      matched: number;
      onlyCameraDetected: number;
      onlyTeacherMarked: number;
      statusMismatches: number;
    };
  }> {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    // Get teacher manual attendance for this period
    const manualQuery: any = {
      schoolId: new Types.ObjectId(schoolId),
      date: { $gte: dateStart, $lte: dateEnd },
    };
    if (period) manualQuery.period = period;

    const manualAttendance = await Attendance.find(manualQuery)
      .populate({
        path: "students.studentId",
        select: "studentId userId",
        populate: {
          path: "userId",
          select: "firstName lastName",
        },
      })
      .lean();

    // Get camera events for this date/grade/section
    const capturedDateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const cameraEvents = await AttendanceEvent.find({
      schoolId: new Types.ObjectId(schoolId),
      capturedDate: capturedDateStr,
      grade: grade.toString(),
      section: section.toUpperCase(),
      test: false,
    })
      .sort({ capturedAt: 1 })
      .lean();

    // Build maps for comparison
    const teacherMap = new Map<string, { status: string; markedAt: Date }>();
    manualAttendance.forEach((record) => {
      record.students?.forEach((s: any) => {
        const sid = s.studentId?.studentId || s.studentId?._id?.toString();
        if (sid) {
          teacherMap.set(sid, {
            status: s.status,
            markedAt: s.markedAt || record.markedAt,
          });
        }
      });
    });

    const cameraMap = new Map<
      string,
      { capturedAt: Date; descriptor: string; firstName: string }
    >();
    cameraEvents.forEach((event) => {
      cameraMap.set(event.studentId, {
        capturedAt: event.capturedAt,
        descriptor: event.descriptor,
        firstName: event.firstName,
      });
    });

    // Find discrepancies
    const discrepancies: Array<{
      studentId: string;
      firstName: string;
      issue: string;
      cameraStatus: string | null;
      teacherStatus: string | null;
      capturedAt?: Date;
      markedAt?: Date;
    }> = [];

    // Students captured by camera but not marked by teacher
    cameraMap.forEach((cameraData, studentId) => {
      const teacherData = teacherMap.get(studentId);
      if (!teacherData) {
        discrepancies.push({
          studentId,
          firstName: cameraData.firstName,
          issue: "Camera detected but teacher did not mark attendance",
          cameraStatus: "present",
          teacherStatus: null,
          capturedAt: cameraData.capturedAt,
        });
      } else if (teacherData.status === "absent") {
        // Camera says present, teacher says absent
        discrepancies.push({
          studentId,
          firstName: cameraData.firstName,
          issue:
            "Status mismatch: camera detected presence but teacher marked absent",
          cameraStatus: "present",
          teacherStatus: teacherData.status,
          capturedAt: cameraData.capturedAt,
          markedAt: teacherData.markedAt,
        });
      }
    });

    // Students marked by teacher as absent but camera detected them
    teacherMap.forEach((teacherData, studentId) => {
      const cameraData = cameraMap.get(studentId);
      if (teacherData.status === "absent" && cameraData) {
        // already added above
      } else if (teacherData.status !== "absent" && !cameraData) {
        // Teacher marked present/late/excused but camera did not detect
        discrepancies.push({
          studentId,
          firstName: "Unknown", // we don't have firstName from teacher data in this context
          issue: `Teacher marked ${teacherData.status} but camera did not detect student`,
          cameraStatus: null,
          teacherStatus: teacherData.status,
          markedAt: teacherData.markedAt,
        });
      }
    });

    // Calculate summary
    const allStudentIds = new Set([...teacherMap.keys(), ...cameraMap.keys()]);
    const matched = [...allStudentIds].filter(
      (sid) => teacherMap.has(sid) && cameraMap.has(sid)
    ).length;
    const onlyCameraDetected = [...cameraMap.keys()].filter(
      (sid) => !teacherMap.has(sid)
    ).length;
    const onlyTeacherMarked = [...teacherMap.keys()].filter(
      (sid) => !cameraMap.has(sid)
    ).length;
    const statusMismatches = discrepancies.filter((d) =>
      d.issue.includes("mismatch")
    ).length;

    return {
      manualAttendance,
      cameraEvents,
      discrepancies,
      summary: {
        totalStudents: allStudentIds.size,
        cameraDetections: cameraMap.size,
        teacherMarks: teacherMap.size,
        matched,
        onlyCameraDetected,
        onlyTeacherMarked,
        statusMismatches,
      },
    };
  }

  /**
   * Get camera events for a student within a date range
   */
  static async getStudentCameraEvents(
    schoolId: string,
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const events = await AttendanceEvent.find({
      schoolId: new Types.ObjectId(schoolId),
      studentId,
      capturedDate: { $gte: startDateStr, $lte: endDateStr },
      test: false,
    })
      .sort({ capturedAt: 1 })
      .lean();

    return events;
  }

  /**
   * Auto-mark attendance based on camera events
   * (Optional helper - only if school chooses to auto-accept camera events)
   * Teacher attendance always takes precedence if it exists
   */
  static async autoMarkFromCameraEvents(
    schoolId: string,
    date: Date,
    grade: number,
    section: string,
    classId: string,
    subjectId: string,
    period: number
  ): Promise<{
    success: boolean;
    message: string;
    autoMarked: number;
    skipped: number;
  }> {
    // Check if teacher already marked attendance
    const existingAttendance = await Attendance.findOne({
      schoolId: new Types.ObjectId(schoolId),
      date,
      period,
      // Assuming classId represents grade+section
    });

    if (existingAttendance) {
      return {
        success: false,
        message:
          "Teacher has already marked attendance for this period. Camera events will not override.",
        autoMarked: 0,
        skipped: 0,
      };
    }

    // Get camera events for this date/grade/section
    const capturedDateStr = date.toISOString().split("T")[0];
    const cameraEvents = await AttendanceEvent.find({
      schoolId: new Types.ObjectId(schoolId),
      capturedDate: capturedDateStr,
      grade: grade.toString(),
      section: section.toUpperCase(),
      test: false,
      status: "captured", // only auto-mark uncaptured events
    }).lean();

    if (cameraEvents.length === 0) {
      return {
        success: false,
        message: "No camera events found for this period",
        autoMarked: 0,
        skipped: 0,
      };
    }

    // Get all students for this class
    const students = await Student.find({
      schoolId: new Types.ObjectId(schoolId),
      grade,
      section: section.toUpperCase(),
      isActive: true,
    })
      .select("_id studentId userId")
      .lean();

    const cameraStudentIds = new Set(cameraEvents.map((e) => e.studentId));
    const attendanceData = students.map((student) => ({
      studentId: student._id.toString(),
      status: cameraStudentIds.has(student.studentId) ? "present" : "absent",
    }));

    // This would require a "system" or "autoattend" teacher/user ID
    // For now, we skip auto-marking and just return suggestions
    // In production, you'd create attendance record here

    return {
      success: true,
      message: `Camera events processed. ${cameraEvents.length} students detected.`,
      autoMarked: 0, // not implemented - teacher must review
      skipped: students.length,
    };
  }

  /**
   * Pre-fill attendance form with camera event data
   * Returns suggested attendance based on camera events
   */
  static async suggestAttendanceFromCamera(
    schoolId: string,
    date: Date,
    grade: number,
    section: string
  ): Promise<
    Array<{
      studentId: string;
      suggestedStatus: "present" | "absent" | "late" | "excused";
      reason: string;
      capturedAt?: Date;
    }>
  > {
    const capturedDateStr = date.toISOString().split("T")[0];

    // Get all students for this class
    const students = await Student.find({
      schoolId: new Types.ObjectId(schoolId),
      grade,
      section: section.toUpperCase(),
      isActive: true,
    })
      .select("_id studentId userId")
      .populate("userId", "firstName lastName")
      .lean();

    // Get camera events for this date/grade/section
    const cameraEvents = await AttendanceEvent.find({
      schoolId: new Types.ObjectId(schoolId),
      capturedDate: capturedDateStr,
      grade: grade.toString(),
      section: section.toUpperCase(),
      test: false,
    }).lean();

    const cameraMap = new Map<string, Date>();
    cameraEvents.forEach((event) => {
      cameraMap.set(event.studentId, event.capturedAt);
    });

    // Build suggestions
    const suggestions = students.map((student) => {
      const capturedAt = cameraMap.get(student.studentId);
      if (capturedAt) {
        return {
          studentId: student._id.toString(),
          suggestedStatus: "present" as const,
          reason: "Detected by Auto-Attend camera",
          capturedAt,
        };
      } else {
        return {
          studentId: student._id.toString(),
          suggestedStatus: "absent" as const,
          reason: "Not detected by camera (teacher should verify)",
        };
      }
    });

    return suggestions;
  }
}
