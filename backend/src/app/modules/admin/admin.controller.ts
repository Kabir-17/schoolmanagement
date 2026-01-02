import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { Student } from "../student/student.model";
import { Teacher } from "../teacher/teacher.model";
import { Subject } from "../subject/subject.model";
import { Schedule } from "../schedule/schedule.model";
import { AcademicCalendar } from "../academic-calendar/academic-calendar.model";
import { AppError } from "../../errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { School } from "../school/school.model";
import { User } from "../user/user.model";

// Dashboard controller
export const getAdminDashboard = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const adminSchoolId = req.user?.schoolId;

    if (!adminSchoolId) {
      return next(new AppError(400, "School ID not found in user context"));
    }

    // Convert schoolId to ObjectId for proper querying
    const schoolObjectId = new mongoose.Types.ObjectId(adminSchoolId);

    // Fetch dashboard statistics for admin's school
    const [
      totalStudents,
      totalTeachers,
      totalSubjects,
      totalSchedules,
      upcomingEvents,
    ] = await Promise.all([
      Student.countDocuments({ schoolId: schoolObjectId, isActive: true }),
      Teacher.countDocuments({ schoolId: schoolObjectId, isActive: true }),
      Subject.countDocuments({ schoolId: schoolObjectId, isActive: true }),
      Schedule.countDocuments({
        schoolId: schoolObjectId,
        isActive: true,
      }).catch(() => 0), // Return 0 if Schedule model doesn't exist or has issues
      AcademicCalendar.find({
        schoolId: schoolObjectId,
        isActive: true,
        startDate: { $gte: new Date() },
      })
        .sort({ startDate: 1 })
        .limit(5)
        .catch(() => []), // Return empty array if model doesn't exist or has issues
    ]);

    const dashboardData = {
      totalStudents,
      totalTeachers,
      totalSubjects,
      activeClasses: totalSchedules, // Map totalSchedules to activeClasses for frontend consistency
      upcomingEvents: upcomingEvents.length,
      upcomingEventsDetails: upcomingEvents,
    };

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Admin dashboard data retrieved successfully",
      data: dashboardData,
    });
  }
);

// Schedule controllers
export const createSchedule = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const adminSchoolId = req.user?.schoolId;

    if (!adminSchoolId) {
      return next(new AppError(400, "School ID not found in user context"));
    }

    const scheduleData = {
      ...req.body,
      schoolId: adminSchoolId,
      createdBy: req.user?.id,
    };

    const schedule = await Schedule.create(scheduleData);
    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate("subjectId")
      .populate("teacherId")
      .populate("classId");

    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Schedule created successfully",
      data: populatedSchedule,
    });
  }
);

export const getAllSchedules = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const adminSchoolId = req.user?.schoolId;

    if (!adminSchoolId) {
      return next(new AppError(400, "School ID not found in user context"));
    }

    const schedules = await Schedule.find({
      schoolId: adminSchoolId,
      isDeleted: false,
    })
      .populate("subjectId")
      .populate("teacherId")
      .populate("classId")
      .sort({ createdAt: -1 });

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Schedules retrieved successfully",
      data: schedules,
    });
  }
);

export const getScheduleById = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const adminSchoolId = req.user?.schoolId;

    const schedule = await Schedule.findOne({
      _id: id,
      schoolId: adminSchoolId,
      isDeleted: false,
    })
      .populate("subjectId")
      .populate("teacherId")
      .populate("classId");

    if (!schedule) {
      return next(new AppError(404, "Schedule not found"));
    }

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Schedule retrieved successfully",
      data: schedule,
    });
  }
);

export const updateSchedule = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const adminSchoolId = req.user?.schoolId;

    const schedule = await Schedule.findOneAndUpdate(
      { _id: id, schoolId: adminSchoolId, isDeleted: false },
      { ...req.body, updatedBy: req.user?.id },
      { new: true }
    )
      .populate("subjectId")
      .populate("teacherId")
      .populate("classId");

    if (!schedule) {
      return next(new AppError(404, "Schedule not found"));
    }

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Schedule updated successfully",
      data: schedule,
    });
  }
);

export const deleteSchedule = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const adminSchoolId = req.user?.schoolId;

    const schedule = await Schedule.findOneAndUpdate(
      { _id: id, schoolId: adminSchoolId, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user?.id,
      },
      { new: true }
    );

    if (!schedule) {
      return next(new AppError(404, "Schedule not found"));
    }

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Schedule deleted successfully",
      data: null,
    });
  }
);

// Calendar controllers
export const createCalendarEvent = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const adminSchoolId = req.user?.schoolId;

    if (!adminSchoolId) {
      return next(new AppError(400, "School ID not found in user context"));
    }

    const eventData = {
      ...req.body,
      schoolId: adminSchoolId,
      createdBy: req.user?.id,
    };

    // Handle file attachments
    if (req.files && Array.isArray(req.files)) {
      eventData.attachments = req.files.map((file: any) => file.path);
    }

    const event = await AcademicCalendar.create(eventData);

    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Calendar event created successfully",
      data: event,
    });
  }
);

export const getAllCalendarEvents = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const adminSchoolId = req.user?.schoolId;

    if (!adminSchoolId) {
      return next(new AppError(400, "School ID not found in user context"));
    }

    const events = await AcademicCalendar.find({
      schoolId: adminSchoolId,
      isDeleted: false,
    }).sort({ startDate: 1 });

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Calendar events retrieved successfully",
      data: events,
    });
  }
);

export const getCalendarEventById = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const adminSchoolId = req.user?.schoolId;

    const event = await AcademicCalendar.findOne({
      _id: id,
      schoolId: adminSchoolId,
      isDeleted: false,
    });

    if (!event) {
      return next(new AppError(404, "Calendar event not found"));
    }

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Calendar event retrieved successfully",
      data: event,
    });
  }
);

export const updateCalendarEvent = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const adminSchoolId = req.user?.schoolId;

    const event = await AcademicCalendar.findOneAndUpdate(
      { _id: id, schoolId: adminSchoolId, isDeleted: false },
      { ...req.body, updatedBy: req.user?.id },
      { new: true }
    );

    if (!event) {
      return next(new AppError(404, "Calendar event not found"));
    }

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Calendar event updated successfully",
      data: event,
    });
  }
);

export const deleteCalendarEvent = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const adminSchoolId = req.user?.schoolId;

    const event = await AcademicCalendar.findOneAndUpdate(
      { _id: id, schoolId: adminSchoolId, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user?.id,
      },
      { new: true }
    );

    if (!event) {
      return next(new AppError(404, "Calendar event not found"));
    }

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Calendar event deleted successfully",
      data: null,
    });
  }
);

// Disciplinary Actions Controllers
export const getAllDisciplinaryActions = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const adminSchoolId = req.user?.schoolId;

    if (!adminSchoolId) {
      return next(new AppError(400, "School ID not found in user context"));
    }

    try {
      const { DisciplinaryAction } = await import(
        "../disciplinary/disciplinary.model"
      );

      const { actionType, severity, status, isRedWarrant } = req.query;

      const query: any = {
        schoolId: new mongoose.Types.ObjectId(adminSchoolId),
      };

      // Apply filters
      if (actionType) query.actionType = actionType;
      if (severity) query.severity = severity;
      if (status) query.status = status;
      if (isRedWarrant !== undefined)
        query.isRedWarrant = isRedWarrant === "true";

      const actions = await DisciplinaryAction.find(query)
        .populate({
          path: "studentId",
          select: "userId rollNumber grade section",
          populate: {
            path: "userId",
            select: "firstName lastName",
          },
        })
        .populate({
          path: "teacherId",
          select: "userId",
          populate: {
            path: "userId",
            select: "firstName lastName",
          },
        })
        .sort({ issuedDate: -1 });

      // Get stats for all disciplinary actions in the school
      const stats = await DisciplinaryAction.getDisciplinaryStats(
        adminSchoolId
      );

      const formattedActions = actions.map((action: any) => {
        const student = action.studentId as any;
        const teacher = action.teacherId as any;
        const studentUser = student?.userId as any;
        const teacherUser = teacher?.userId as any;

        return {
          id: action._id,
          studentName: studentUser
            ? `${studentUser.firstName} ${studentUser.lastName}`
            : "N/A",
          studentRoll: student?.rollNumber || "N/A",
          grade: student?.grade || "N/A",
          section: student?.section || "N/A",
          teacherName: teacherUser
            ? `${teacherUser.firstName} ${teacherUser.lastName}`
            : "N/A",
          actionType: action.actionType,
          severity: action.severity,
          category: action.category,
          title: action.title,
          description: action.description,
          reason: action.reason,
          status: action.status,
          issuedDate: action.issuedDate,
          isRedWarrant: action.isRedWarrant,
          warrantLevel: action.warrantLevel,
          parentNotified: action.parentNotified,
          studentAcknowledged: action.studentAcknowledged,
          followUpRequired: action.followUpRequired,
          followUpDate: action.followUpDate,
          resolutionNotes: action.resolutionNotes,
          canAppeal: action.canAppeal ? action.canAppeal() : false,
          isOverdue: action.isOverdue ? action.isOverdue() : false,
        };
      });

      sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Disciplinary actions retrieved successfully",
        data: {
          actions: formattedActions,
          stats,
        },
      });
    } catch (error) {
      return next(
        new AppError(
          500,
          `Failed to get disciplinary actions: ${(error as Error).message}`
        )
      );
    }
  }
);

export const resolveDisciplinaryAction = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { actionId } = req.params;
    const { resolutionNotes } = req.body;
    const adminSchoolId = req.user?.schoolId;

    if (!adminSchoolId) {
      return next(new AppError(400, "School ID not found in user context"));
    }

    try {
      const { DisciplinaryAction } = await import(
        "../disciplinary/disciplinary.model"
      );

      // Find the action and verify it belongs to admin's school
      const action = await DisciplinaryAction.findOne({
        _id: actionId,
        schoolId: new mongoose.Types.ObjectId(adminSchoolId),
      });

      if (!action) {
        return next(new AppError(404, "Disciplinary action not found"));
      }

      if (action.status === "resolved") {
        return next(
          new AppError(400, "Disciplinary action is already resolved")
        );
      }

      // Update the action
      action.status = "resolved";
      action.resolutionNotes = resolutionNotes;
      action.resolvedDate = new Date();
      action.resolvedBy = new mongoose.Types.ObjectId(req.user?.id);

      await action.save();

      sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Disciplinary action resolved successfully",
        data: {
          id: action._id,
          status: action.status,
          resolutionNotes: action.resolutionNotes,
          resolvedDate: action.resolvedDate,
        },
      });
    } catch (error) {
      return next(
        new AppError(
          500,
          `Failed to resolve disciplinary action: ${(error as Error).message}`
        )
      );
    }
  }
);

export const addDisciplinaryActionComment = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { actionId } = req.params;
    const { comment } = req.body;
    const adminSchoolId = req.user?.schoolId;

    if (!adminSchoolId) {
      return next(new AppError(400, "School ID not found in user context"));
    }

    try {
      const { DisciplinaryAction } = await import(
        "../disciplinary/disciplinary.model"
      );

      // Find the action and verify it belongs to admin's school
      const action = await DisciplinaryAction.findOne({
        _id: actionId,
        schoolId: new mongoose.Types.ObjectId(adminSchoolId),
      });

      if (!action) {
        return next(new AppError(404, "Disciplinary action not found"));
      }

      // Add comment to follow-up notes
      const timestamp = new Date().toISOString();
      const adminName = req.user?.username || "Admin";
      const commentText = `\n\n[${timestamp}] Admin Comment by ${adminName}:\n${comment}`;

      action.resolutionNotes = (action.resolutionNotes || "") + commentText;
      await action.save();

      sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Comment added successfully",
        data: {
          id: action._id,
          comment: commentText,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      return next(
        new AppError(500, `Failed to add comment: ${(error as Error).message}`)
      );
    }
  }
);

// School Settings Controllers
export const getSchoolSettings = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const adminSchoolId = req.user?.schoolId;

    if (!adminSchoolId) {
      return next(new AppError(400, "School ID not found in user context"));
    }

    const school = await School.findById(adminSchoolId)
      .populate("adminUserId", "username firstName lastName email phone")
      .populate("createdBy", "username firstName lastName");

    if (!school) {
      return next(new AppError(404, "School not found"));
    }

    // Get school data - sectionCapacity is already an object
    const schoolData = school.toObject();

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "School settings retrieved successfully",
      data: schoolData,
    });
  }
);

export const updateSchoolSettings = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const adminSchoolId = req.user?.schoolId;

    if (!adminSchoolId) {
      return next(new AppError(400, "School ID not found in user context"));
    }

    const school = await School.findById(adminSchoolId);
    if (!school) {
      return next(new AppError(404, "School not found"));
    }

    // Update basic information
    const {
      name,
      establishedYear,
      address,
      contact,
      affiliation,
      recognition,
      settings,
    } = req.body;

    if (name) school.name = name;
    if (establishedYear) school.establishedYear = establishedYear;
    if (address) school.address = { ...school.address, ...address };
    if (contact) school.contact = { ...school.contact, ...contact };
    if (affiliation) school.affiliation = affiliation;
    if (recognition) school.recognition = recognition;

    // Update settings
    if (settings) {
      school.settings = { ...school.settings, ...settings };

      // Handle section capacity if provided
      if (settings.sectionCapacity) {
        school.settings.sectionCapacity = settings.sectionCapacity;
      }
    }

    school.lastModifiedBy = new mongoose.Types.ObjectId(req.user?.id);
    await school.save();

    // Get updated school data
    const schoolData = school.toObject();

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "School settings updated successfully",
      data: schoolData,
    });
  }
);

export const updateSectionCapacity = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const adminSchoolId = req.user?.schoolId;
    const { grade, section, maxStudents } = req.body;

    if (!adminSchoolId) {
      return next(new AppError(400, "School ID not found in user context"));
    }

    const school = await School.findById(adminSchoolId);
    if (!school) {
      return next(new AppError(404, "School not found"));
    }

    // Validate grade and section are offered by the school
    if (!school.getGradesOffered().includes(grade)) {
      return next(
        new AppError(400, `Grade ${grade} is not offered by this school`)
      );
    }

    if (!school.getSectionsForGrade(grade).includes(section)) {
      return next(
        new AppError(
          400,
          `Section ${section} is not available for Grade ${grade}`
        )
      );
    }

    // Update section capacity
    await school.setSectionCapacity(grade, section, maxStudents);

    const updatedCapacity = school.getSectionCapacity(grade, section);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Section capacity updated successfully",
      data: {
        grade,
        section,
        capacity: updatedCapacity,
      },
    });
  }
);

export const getSectionCapacityReport = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const adminSchoolId = req.user?.schoolId;

    if (!adminSchoolId) {
      return next(new AppError(400, "School ID not found in user context"));
    }

    const school = await School.findById(adminSchoolId);
    if (!school) {
      return next(new AppError(404, "School not found"));
    }

    // Get actual student counts from Student collection
    const studentCounts = await Student.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(adminSchoolId),
          isActive: true,
        },
      },
      {
        $group: {
          _id: {
            grade: "$grade",
            section: "$section",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Build capacity report
    const capacityReport: any[] = [];
    const grades = school.getGradesOffered();
    const sections = school.settings?.sections || [];

    grades.forEach((grade) => {
      sections.forEach((section) => {
        const capacity = school.getSectionCapacity(grade, section);
        const actualCount =
          studentCounts.find(
            (sc) => sc._id.grade === grade && sc._id.section === section
          )?.count || 0;

        // Update current student count if different
        if (capacity.currentStudents !== actualCount) {
          school.settings!.sectionCapacity![`${grade}-${section}`] = {
            maxStudents: capacity.maxStudents,
            currentStudents: actualCount,
          };
        }

        const utilizationPercent =
          capacity.maxStudents > 0
            ? (actualCount / capacity.maxStudents) * 100
            : 0;

        capacityReport.push({
          grade,
          section,
          maxCapacity: capacity.maxStudents,
          currentStudents: actualCount,
          availableSpots: Math.max(0, capacity.maxStudents - actualCount),
          utilizationPercent: Math.round(utilizationPercent * 100) / 100,
          status:
            utilizationPercent > 90
              ? "full"
              : utilizationPercent > 75
              ? "high"
              : "available",
        });
      });
    });

    // Save updated counts
    await school.save();

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Section capacity report generated successfully",
      data: {
        report: capacityReport,
        summary: {
          totalSections: capacityReport.length,
          fullSections: capacityReport.filter((r) => r.status === "full")
            .length,
          highUtilizationSections: capacityReport.filter(
            (r) => r.status === "high"
          ).length,
          availableSections: capacityReport.filter(
            (r) => r.status === "available"
          ).length,
          totalCapacity: capacityReport.reduce(
            (sum, r) => sum + r.maxCapacity,
            0
          ),
          totalStudents: capacityReport.reduce(
            (sum, r) => sum + r.currentStudents,
            0
          ),
          totalAvailableSpots: capacityReport.reduce(
            (sum, r) => sum + r.availableSpots,
            0
          ),
        },
      },
    });
  }
);

// --- Export endpoints (lightweight, used by external scripts) ---
// Note: these endpoints are intentionally lightweight and perform explicit
// credential checks for the supplied admin username/password. They are
// placed here to allow external scripts (outside the server) to fetch
// student lists and photo URLs for a given school after verifying an
// admin account. Use with care and consider adding rate-limiting/APIs keys
// in production.

export const listExportableSchools = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const schools = await School.find({ isActive: true })
      .select("_id name schoolId")
      .sort({ name: 1 })
      .lean();

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Exportable schools retrieved",
      data: schools,
    });
  }
);

export const exportStudentsForSchool = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { schoolId } = req.params;
    const { username, password } = req.body as {
      username?: string;
      password?: string;
    };
    console.log(username, password);
    console.log(schoolId);
    if (!schoolId) {
      return next(new AppError(400, "schoolId is required"));
    }

    if (!username || !password) {
      return next(
        new AppError(400, "username and password are required in request body")
      );
    }

    // Find user and validate credentials
    const user = await User.findOne({
      username: username.toLowerCase(),
    }).select("+passwordHash +schoolId +role");
    if (!user) {
      return next(new AppError(401, "Invalid credentials"));
    }

    const valid = await user.validatePassword(password);
    if (!valid) {
      return next(new AppError(401, "Invalid credentials"));
    }
    console.log("User authenticated:", user);
    // Ensure user is admin for the requested school (or superadmin)
    // if (user.role !== "admin" && user.role !== "superadmin") {
    //   return next(new AppError(403, "User is not an admin"));
    // }

    // if (user.role !== "superadmin") {
    //   if (!user.schoolId || user.schoolId.toString() !== schoolId.toString()) {
    //     return next(
    //       new AppError(
    //         403,
    //         "Admin user does not belong to the requested school"
    //       )
    //     );
    //   }
    // }

    // Resolve schoolId: accept either a MongoDB ObjectId (the school's _id)
    // or the external schoolId string like "SCH0017" returned by the schools list.
    let resolvedSchoolObjectId: any = schoolId;
    if (!mongoose.isValidObjectId(schoolId)) {
      // try to look up by external schoolId field
      const schoolDoc = await School.findOne({ schoolId: schoolId }).select(
        "_id"
      );
      if (!schoolDoc) {
        return next(new AppError(404, "School not found"));
      }
      resolvedSchoolObjectId = schoolDoc._id;
    } else {
      resolvedSchoolObjectId = new mongoose.Types.ObjectId(schoolId);
    }

    // Fetch students and include photos and basic user info
    const students = await Student.find({ schoolId: resolvedSchoolObjectId })
      .populate("userId", "firstName lastName")
      .populate("photos")
      .lean();

    // Simplify response shape to include only necessary fields for export
    const payload = students.map((s: any) => ({
      id: s._id,
      studentId: s.studentId,
      grade: s.grade,
      section: s.section,
      firstName: s.userId?.firstName || null,
      lastName: s.userId?.lastName || null,
      dob: s.dob,
      photos: (s.photos || []).map((p: any) => ({
        id: p._id,
        photoNumber: p.photoNumber,
        photoPath: p.photoPath,
        filename: p.filename,
        originalName: p.originalName,
      })),
    }));

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: `Students for school ${schoolId} exported successfully`,
      data: payload,
    });
  }
);
