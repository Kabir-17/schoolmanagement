import { Types } from 'mongoose';
import { Attendance } from './attendance.model';
import { Student } from '../student/student.model';
import { Teacher } from '../teacher/teacher.model';
import { Subject } from '../subject/subject.model';
import { AppError } from '../../errors/AppError';
import { StudentDayAttendance, normaliseDateKey } from './day-attendance.model';
import { School } from '../school/school.model';
import config from '../../config';
import { 
  ICreateAttendanceRequest, 
  IUpdateAttendanceRequest,
  IAttendanceResponse,
  IAttendanceStats,
  IStudentAttendanceReport,
  IClassAttendanceRequest,
  IAttendanceFilters
} from './attendance.interface';

export class AttendanceService {
  /**
   * Mark attendance for a class
   */
  static async markAttendance(
    teacherId: string,
    attendanceData: ICreateAttendanceRequest
  ): Promise<IAttendanceResponse> {
    // Validate teacher exists and is active
    const teacher = await Teacher.findById(teacherId).populate('schoolId userId');
    if (!teacher || !teacher.isActive) {
      throw new AppError(404, 'Teacher not found or inactive');
    }

    // Validate subject exists and teacher is assigned to it
    const subject = await Subject.findById(attendanceData.subjectId);
    if (!subject) {
      throw new AppError(404, 'Subject not found');
    }

    // Check if teacher is assigned to this subject
    const isAssigned = subject.teachers.some(id => id.toString() === teacherId);
    if (!isAssigned) {
      throw new AppError(403, 'Teacher is not assigned to this subject');
    }

    const schoolTimezone =
      ((teacher.schoolId as any)?.settings?.timezone as string | undefined) ||
      config.school_timezone ||
      'UTC';

    const requestedDateInput = new Date(attendanceData.date);
    if (Number.isNaN(requestedDateInput.getTime())) {
      throw new AppError(400, 'Invalid attendance date');
    }

    const { date: requestedDate } = normaliseDateKey(requestedDateInput, schoolTimezone);
    const { date: today } = normaliseDateKey(new Date(), schoolTimezone);

    if (requestedDate.getTime() > today.getTime()) {
      throw new AppError(
        400,
        'Cannot mark attendance for future dates'
      );
    }

    // Optional: Also prevent too old dates (e.g., > 7 days ago)
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (requestedDate.getTime() < sevenDaysAgo.getTime()) {
      throw new AppError(
        400,
        'Cannot mark attendance for dates older than 7 days'
      );
    }

    // Mark attendance
    const attendanceRecord = await Attendance.markAttendance(
      teacherId,
      attendanceData.classId,
      attendanceData.subjectId,
      requestedDate,
      attendanceData.period,
      attendanceData.students
    );

    // Populate and return formatted response
    const populatedRecord = await Attendance.populate(attendanceRecord, [
      {
        path: 'students.studentId',
        select: 'userId studentId rollNumber',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      },
      {
        path: 'teacherId',
        select: 'userId teacherId',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      },
      {
        path: 'subjectId',
        select: 'name code'
      }
    ]);

    return this.formatAttendanceResponse(populatedRecord);
  }

  /**
   * Update existing attendance record for a specific student
   */
  static async updateAttendance(
    attendanceId: string,
    studentId: string,
    userId: string,
    updateData: IUpdateAttendanceRequest
  ): Promise<IAttendanceResponse> {
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      throw new AppError(404, 'Attendance record not found');
    }

    // Check if attendance can be modified
    if (!attendance.canBeModified()) {
      throw new AppError(403, 'Attendance record is locked and cannot be modified');
    }

    // Update the specific student's attendance
    if (updateData.status) {
      const success = attendance.updateStudentStatus(
        studentId,
        updateData.status,
        userId,
        updateData.modificationReason
      );
      
      if (!success) {
        throw new AppError(404, 'Student not found in this attendance record');
      }
    }

    await attendance.save();

    if (updateData.status) {
      const studentObjectId = new Types.ObjectId(studentId);
      const studentDoc = await Student.findById(studentObjectId).select('studentId');
      if (studentDoc) {
        const schoolDoc = await School.findById(attendance.schoolId).select(
          'settings.autoAttendFinalizationTime settings.timezone'
        );
        const schoolTimezone =
          schoolDoc?.settings?.timezone || config.school_timezone || 'UTC';

        const { date: normalizedDate, dateKey } = normaliseDateKey(
          attendance.date,
          schoolTimezone
        );
        await StudentDayAttendance.markFromTeacher({
          schoolId: attendance.schoolId as Types.ObjectId,
          studentId: studentObjectId,
          studentCode: studentDoc.studentId,
          teacherId: attendance.teacherId as Types.ObjectId,
          status: updateData.status,
          date: normalizedDate,
          dateKey,
          timezone: schoolTimezone,
        });

        const finalizeTime =
          schoolDoc?.settings?.autoAttendFinalizationTime ||
          config.auto_attend_finalization_time;
        await StudentDayAttendance.finalizeForDate(
          attendance.schoolId as Types.ObjectId,
          normalizedDate,
          dateKey,
          finalizeTime,
          schoolTimezone
        );
      }
    }

    // Populate and return
    await attendance.populate([
      {
        path: 'students.studentId',
        select: 'userId studentId rollNumber',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      },
      {
        path: 'teacherId',
        select: 'userId teacherId',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      },
      {
        path: 'subjectId',
        select: 'name code'
      }
    ]);

    return this.formatAttendanceResponse(attendance);
  }

  /**
   * Get attendance by ID
   */
  static async getAttendanceById(attendanceId: string): Promise<IAttendanceResponse> {
    const attendance = await Attendance.findById(attendanceId)
      .populate({
        path: 'studentId',
        select: 'userId studentId rollNumber',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      })
      .populate({
        path: 'teacherId',
        select: 'userId teacherId',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      })
      .populate('subjectId', 'name code');

    if (!attendance) {
      throw new AppError(404, 'Attendance record not found');
    }

    return this.formatAttendanceResponse(attendance);
  }

  /**
   * Get class attendance for a specific date/period
   */
  static async getClassAttendance(
    request: IClassAttendanceRequest
  ): Promise<IAttendanceResponse[]> {
    const attendanceRecords = await Attendance.getClassAttendance(
      request.schoolId, // Using as classId for now
      new Date(request.date),
      request.period
    );

    return this.formatAttendanceResponses(attendanceRecords);
  }

  /**
   * Get student attendance history
   */
  static async getStudentAttendance(
    studentId: string,
    startDate: Date,
    endDate: Date,
    subjectId?: string
  ): Promise<IAttendanceResponse[]> {
    let attendanceRecords = await Attendance.getStudentAttendance(
      studentId,
      startDate,
      endDate
    );

    // Filter by subject if provided
    if (subjectId) {
      attendanceRecords = attendanceRecords.filter(
        record => record.subjectId.toString() === subjectId
      );
    }

    return this.formatAttendanceResponses(attendanceRecords);
  }

  /**
   * Get attendance statistics
   */
  static async getAttendanceStats(
    schoolId: string,
    startDate: Date,
    endDate: Date,
    filters?: IAttendanceFilters
  ): Promise<IAttendanceStats> {
    return await Attendance.getAttendanceStats(schoolId, startDate, endDate);
  }

  /**
   * Generate student attendance report
   */
  static async generateStudentAttendanceReport(
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IStudentAttendanceReport> {
    const student = await Student.findById(studentId)
      .populate('userId', 'firstName lastName')
      .populate('schoolId', 'name');

    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    const attendanceRecords = await Attendance.getStudentAttendance(
      studentId,
      startDate,
      endDate
    );

    // Extract student-specific data from nested structure
    let totalClasses = 0;
    let presentClasses = 0;
    let absentClasses = 0;
    let lateClasses = 0;
    let excusedClasses = 0;

    const studentRecords: any[] = [];

    attendanceRecords.forEach(record => {
      const studentAttendance = record.students.find(
        s => s.studentId.toString() === studentId
      );
      
      if (studentAttendance) {
        totalClasses++;
        const status = studentAttendance.status;
        
        if (status === 'present' || status === 'late') presentClasses++;
        if (status === 'absent') absentClasses++;
        if (status === 'late') lateClasses++;
        if (status === 'excused') excusedClasses++;
        
        studentRecords.push({
          ...studentAttendance,
          subjectId: record.subjectId,
          date: record.date,
          period: record.period
        });
      }
    });

    // Calculate subject-wise attendance
    const subjectWiseAttendance = this.calculateSubjectWiseAttendance(studentRecords);
    
    // Calculate monthly trend
    const monthlyTrend = this.calculateMonthlyTrend(studentRecords);

    return {
      studentId,
      studentName: `${(student.userId as any).firstName} ${(student.userId as any).lastName}`,
      rollNumber: student.rollNumber || 0,
      grade: student.grade,
      section: student.section,
      totalClasses,
      presentClasses,
      absentClasses,
      lateClasses,
      excusedClasses,
      attendancePercentage: totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0,
      subjectWiseAttendance,
      monthlyTrend
    };
  }

  /**
   * Get attendance for multiple filters
   */
  static async getAttendanceByFilters(
    filters: IAttendanceFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    attendance: IAttendanceResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = {};

    // Apply filters
    if (filters.schoolId) query.schoolId = filters.schoolId;
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.teacherId) query.teacherId = filters.teacherId;
    if (filters.classId) query.classId = filters.classId;
    if (filters.subjectId) query.subjectId = filters.subjectId;
    if (filters.status) query.status = filters.status;
    if (filters.period) query.period = filters.period;

    if (filters.date) {
      query.date = filters.date;
    } else if (filters.startDate && filters.endDate) {
      query.date = { $gte: filters.startDate, $lte: filters.endDate };
    }

    const total = await Attendance.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const attendanceRecords = await Attendance.find(query)
      .populate({
        path: 'studentId',
        select: 'userId studentId rollNumber',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      })
      .populate({
        path: 'teacherId',
        select: 'userId teacherId',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      })
      .populate('subjectId', 'name code')
      .sort({ date: -1, period: 1 })
      .skip(skip)
      .limit(limit);

    return {
      attendance: this.formatAttendanceResponses(attendanceRecords),
      total,
      page,
      totalPages
    };
  }

  /**
   * Lock old attendance records
   */
  static async lockOldAttendance(): Promise<void> {
    await Attendance.lockOldAttendance();
  }

  /**
   * Format attendance record for response
   */
  private static formatAttendanceResponse(record: any): IAttendanceResponse {
    return {
      id: record._id.toString(),
      schoolId: record.schoolId.toString(),
      teacherId: record.teacherId._id.toString(),
      subjectId: record.subjectId._id.toString(),
      classId: record.classId.toString(),
      date: record.date,
      period: record.period,
      students: record.students.map((student: any) => ({
        studentId: student.studentId._id.toString(),
        status: student.status,
        markedAt: student.markedAt,
        modifiedAt: student.modifiedAt,
        modifiedBy: student.modifiedBy?.toString(),
        modificationReason: student.modificationReason,
        student: student.studentId ? {
          id: student.studentId._id.toString(),
          userId: student.studentId.userId._id.toString(),
          studentId: student.studentId.studentId,
          fullName: `${student.studentId.userId.firstName} ${student.studentId.userId.lastName}`,
          rollNumber: student.studentId.rollNumber || 0
        } : undefined,
      })),
      markedAt: record.markedAt,
      modifiedAt: record.modifiedAt,
      modifiedBy: record.modifiedBy?.toString(),
      isLocked: record.isLocked,
      canModify: record.canBeModified(),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      teacher: record.teacherId ? {
        id: record.teacherId._id.toString(),
        userId: record.teacherId.userId._id.toString(),
        teacherId: record.teacherId.teacherId,
        fullName: `${record.teacherId.userId.firstName} ${record.teacherId.userId.lastName}`
      } : undefined,
      subject: record.subjectId ? {
        id: record.subjectId._id.toString(),
        name: record.subjectId.name,
        code: record.subjectId.code
      } : undefined,
      class: undefined, // Will be populated if needed
      attendanceStats: record.getAttendanceStats()
    };
  }

  /**
   * Format attendance records array for response
   */
  private static formatAttendanceResponses(records: any[]): IAttendanceResponse[] {
    return records.map(record => this.formatAttendanceResponse(record));
  }

  /**
   * Calculate subject-wise attendance
   */
  private static calculateSubjectWiseAttendance(records: any[]): Array<{
    subjectId: string;
    subjectName: string;
    totalClasses: number;
    presentClasses: number;
    attendancePercentage: number;
  }> {
    const subjectMap = new Map();

    records.forEach(record => {
      const subjectId = record.subjectId._id.toString();
      const subjectName = record.subjectId.name;
      
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subjectId,
          subjectName,
          totalClasses: 0,
          presentClasses: 0
        });
      }

      const subjectData = subjectMap.get(subjectId);
      subjectData.totalClasses++;
      
      if (record.status === 'present' || record.status === 'late') {
        subjectData.presentClasses++;
      }
    });

    return Array.from(subjectMap.values()).map(subject => ({
      ...subject,
      attendancePercentage: subject.totalClasses > 0 
        ? Math.round((subject.presentClasses / subject.totalClasses) * 100)
        : 0
    }));
  }

  /**
   * Calculate monthly attendance trend
   */
  private static calculateMonthlyTrend(records: any[]): Array<{
    month: string;
    year: number;
    totalClasses: number;
    presentClasses: number;
    attendancePercentage: number;
  }> {
    const monthMap = new Map();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    records.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = monthNames[date.getMonth()];
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month: monthName,
          year: date.getFullYear(),
          totalClasses: 0,
          presentClasses: 0
        });
      }

      const monthData = monthMap.get(monthKey);
      monthData.totalClasses++;
      
      if (record.status === 'present' || record.status === 'late') {
        monthData.presentClasses++;
      }
    });

    return Array.from(monthMap.values())
      .map(month => ({
        ...month,
        attendancePercentage: month.totalClasses > 0 
          ? Math.round((month.presentClasses / month.totalClasses) * 100)
          : 0
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return monthNames.indexOf(b.month) - monthNames.indexOf(a.month);
      });
  }
}
