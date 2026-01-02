import httpStatus from "http-status";
import { Types } from "mongoose";
import { AppError } from "../../errors/AppError";
import { School } from "../school/school.model";
import { Student } from "../student/student.model";
import { User } from "../user/user.model";
import { Parent } from "./parent.model";
import {
  ICreateParentRequest,
  IUpdateParentRequest,
  IParentResponse,
  IParentStats,
} from "./parent.interface";
import { Attendance } from "../attendance/attendance.model";
import { Homework, HomeworkSubmission } from "../homework/homework.model";
import { AcademicCalendar } from "../academic-calendar/academic-calendar.model";
import { Notification } from "../notification/notification.model";
import { Schedule } from "../schedule/schedule.model";

class ParentService {
  async createParent(
    parentData: ICreateParentRequest
  ): Promise<IParentResponse> {
    try {
      // Verify school exists and is active
      const school = await School.findById(parentData.schoolId);
      if (!school) {
        throw new AppError(httpStatus.NOT_FOUND, "School not found");
      }

      // Verify children exist and belong to the same school
      const children = await Student.find({
        _id: { $in: parentData.children },
        schoolId: parentData.schoolId,
      });

      if (children.length !== parentData.children.length) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "One or more students not found in the specified school"
        );
      }

      // Generate parent ID
      const parentId = await Parent.generateNextParentId(parentData.schoolId);

      // Generate username from parent ID
      const username = parentId.replace(/-/g, "").toLowerCase();

      // Create user account for parent
      const newUser = await User.create({
        schoolId: parentData.schoolId,
        role: "parent",
        username,
        passwordHash: parentId, // Temporary password, same as parent ID
        firstName: parentData.firstName,
        lastName: parentData.lastName,
        email: parentData.email,
        phone: parentData.phone,
      });

      // Create parent record
      const newParent = await Parent.create({
        userId: newUser._id,
        schoolId: parentData.schoolId,
        parentId,
        children: parentData.children,
        relationship: parentData.relationship,
        occupation: parentData.occupation,
        qualification: parentData.qualification,
        monthlyIncome: parentData.monthlyIncome
          ? {
              ...parentData.monthlyIncome,
              currency: parentData.monthlyIncome.currency || "INR",
            }
          : undefined,
        address: {
          ...parentData.address,
          country: parentData.address.country,
        },
        emergencyContact: parentData.emergencyContact,
        preferences: {
          communicationMethod:
            parentData.preferences?.communicationMethod || "All",
          receiveNewsletters:
            parentData.preferences?.receiveNewsletters ?? true,
          receiveAttendanceAlerts:
            parentData.preferences?.receiveAttendanceAlerts ?? true,
          receiveExamResults:
            parentData.preferences?.receiveExamResults ?? true,
          receiveEventNotifications:
            parentData.preferences?.receiveEventNotifications ?? true,
        },
      });

      // Update students with parent reference
      await Student.updateMany(
        { _id: { $in: parentData.children } },
        { parentId: newParent._id }
      );

      // Populate and return
      await newParent.populate([
        { path: "userId", select: "firstName lastName username email phone" },
        { path: "schoolId", select: "name" },
        {
          path: "children",
          select: "studentId grade section rollNumber",
          populate: { path: "userId", select: "firstName lastName" },
        },
      ]);

      return this.formatParentResponse(newParent);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to create parent: ${(error as Error).message}`
      );
    }
  }

  async getParents(queryParams: {
    page: number;
    limit: number;
    schoolId?: string;
    relationship?: string;
    isActive?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
  }): Promise<{
    parents: IParentResponse[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    try {
      const {
        page,
        limit,
        schoolId,
        relationship,
        isActive,
        search,
        sortBy,
        sortOrder,
      } = queryParams;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};

      if (schoolId) {
        query.schoolId = schoolId;
      }

      if (relationship) {
        query.relationship = relationship;
      }

      if (isActive && isActive !== "all") {
        query.isActive = isActive === "true";
      }

      // Build search query for user fields
      let userQuery: any = {};
      if (search) {
        userQuery.$or = [
          { firstName: { $regex: new RegExp(search, "i") } },
          { lastName: { $regex: new RegExp(search, "i") } },
          { username: { $regex: new RegExp(search, "i") } },
        ];
      }

      // If we have user search criteria, find matching users first
      let userIds: Types.ObjectId[] = [];
      if (Object.keys(userQuery).length > 0) {
        const matchingUsers = await User.find(userQuery).select("_id");
        userIds = matchingUsers.map((user) => user._id);
        query.userId = { $in: userIds };
      }

      // Handle parent ID search separately
      if (search && !userQuery.$or) {
        query.$or = [{ parentId: { $regex: new RegExp(search, "i") } }];
      }

      // Build sort
      const sort: any = {};
      if (sortBy === "firstName" || sortBy === "lastName") {
        sort.relationship = 1;
        sort.createdAt = -1;
      } else {
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
      }

      // Execute queries
      const [parents, totalCount] = await Promise.all([
        Parent.find(query)
          .populate("userId", "firstName lastName username email phone")
          .populate("schoolId", "name")
          .populate("children", "studentId grade section rollNumber userId")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Parent.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        parents: parents.map((parent) => this.formatParentResponse(parent)),
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch parents: ${(error as Error).message}`
      );
    }
  }

  async getParentById(id: string): Promise<IParentResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid parent ID format");
      }

      const parent = await Parent.findById(id)
        .populate("userId", "firstName lastName username email phone")
        .populate("schoolId", "name")
        .populate("children", "studentId grade section rollNumber userId")
        .lean();

      if (!parent) {
        throw new AppError(httpStatus.NOT_FOUND, "Parent not found");
      }

      return this.formatParentResponse(parent);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch parent: ${(error as Error).message}`
      );
    }
  }

  async updateParent(
    id: string,
    updateData: IUpdateParentRequest
  ): Promise<IParentResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid parent ID format");
      }

      const parent = await Parent.findById(id);
      if (!parent) {
        throw new AppError(httpStatus.NOT_FOUND, "Parent not found");
      }

      // If children are being updated, verify they exist and belong to the same school
      if (updateData.children) {
        const children = await Student.find({
          _id: { $in: updateData.children },
          schoolId: parent.schoolId,
        });

        if (children.length !== updateData.children.length) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            "One or more students not found in the school"
          );
        }

        // Update old children to remove parent reference
        await Student.updateMany(
          { parentId: parent._id },
          { $unset: { parentId: 1 } }
        );

        // Update new children with parent reference
        await Student.updateMany(
          { _id: { $in: updateData.children } },
          { parentId: parent._id }
        );
      }

      const updatedParent = await Parent.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate("userId", "firstName lastName username email phone")
        .populate("schoolId", "name")
        .populate("children", "studentId grade section rollNumber userId")
        .lean();

      return this.formatParentResponse(updatedParent!);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to update parent: ${(error as Error).message}`
      );
    }
  }

  async deleteParent(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid parent ID format");
      }

      const parent = await Parent.findById(id);
      if (!parent) {
        throw new AppError(httpStatus.NOT_FOUND, "Parent not found");
      }

      // Remove parent reference from students
      await Student.updateMany(
        { parentId: parent._id },
        { $unset: { parentId: 1 } }
      );

      // Delete associated user account
      if (parent.userId) {
        await User.findByIdAndDelete(parent.userId);
      }

      await parent.deleteOne();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to delete parent: ${(error as Error).message}`
      );
    }
  }

  async getParentStats(schoolId: string): Promise<IParentStats> {
    try {
      if (!Types.ObjectId.isValid(schoolId)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid school ID format");
      }

      const [
        totalParents,
        activeParents,
        relationshipStats,
        communicationStats,
        childrenCountStats,
        recentRegistrations,
      ] = await Promise.all([
        Parent.countDocuments({ schoolId }),
        Parent.countDocuments({ schoolId, isActive: true }),
        Parent.aggregate([
          { $match: { schoolId: new Types.ObjectId(schoolId) } },
          { $group: { _id: "$relationship", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        Parent.aggregate([
          { $match: { schoolId: new Types.ObjectId(schoolId) } },
          {
            $group: {
              _id: "$preferences.communicationMethod",
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Parent.aggregate([
          { $match: { schoolId: new Types.ObjectId(schoolId) } },
          { $group: { _id: { $size: "$children" }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        Parent.countDocuments({
          schoolId,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }),
      ]);

      return {
        totalParents,
        activeParents,
        byRelationship: relationshipStats.map((stat) => ({
          relationship: stat._id,
          count: stat.count,
        })),
        byCommunicationPreference: communicationStats.map((stat) => ({
          method: stat._id,
          count: stat.count,
        })),
        byChildrenCount: childrenCountStats.map((stat) => ({
          childrenCount: stat._id,
          parentCount: stat.count,
        })),
        recentRegistrations,
      };
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch parent stats: ${(error as Error).message}`
      );
    }
  }

  private formatParentResponse(parent: any): IParentResponse {
    return {
      id: parent._id?.toString() || parent.id,
      userId: parent.userId?._id?.toString() || parent.userId?.toString(),
      schoolId: parent.schoolId?._id?.toString() || parent.schoolId?.toString(),
      parentId: parent.parentId,
      children:
        parent.children?.map((child: any) => ({
          id: child._id?.toString() || child.id,
          studentId: child.studentId,
          fullName:
            child.userId &&
            typeof child.userId === "object" &&
            child.userId !== null &&
            "firstName" in child.userId &&
            "lastName" in child.userId
              ? `${(child.userId as any).firstName} ${
                  (child.userId as any).lastName
                }`.trim()
              : "",
          grade: child.grade,
          section: child.section,
          rollNumber: child.rollNumber,
        })) || [],
      childrenCount: parent.children?.length || 0,
      relationship: parent.relationship,
      occupation: parent.occupation,
      qualification: parent.qualification,
      monthlyIncome: parent.monthlyIncome,
      address: parent.address,
      emergencyContact: parent.emergencyContact,
      preferences: parent.preferences || {
        communicationMethod: "All",
        receiveNewsletters: true,
        receiveAttendanceAlerts: true,
        receiveExamResults: true,
        receiveEventNotifications: true,
      },
      isActive: parent.isActive !== false,
      createdAt: parent.createdAt,
      updatedAt: parent.updatedAt,
      user: parent.userId
        ? {
            id: parent.userId._id?.toString() || parent.userId.id,
            username: parent.userId.username,
            firstName: parent.userId.firstName,
            lastName: parent.userId.lastName,
            fullName:
              `${parent.userId.firstName} ${parent.userId.lastName}`.trim(),
            email: parent.userId.email,
            phone: parent.userId.phone,
          }
        : undefined,
      school: parent.schoolId?.name
        ? {
            id: parent.schoolId._id?.toString() || parent.schoolId.id,
            name: parent.schoolId.name,
          }
        : undefined,
    };
  }

  async getChildDisciplinaryActions(userId: string) {
    try {
      // Find the parent by userId
      const parent = await Parent.findOne({ userId }).populate("children");
      if (!parent) {
        throw new AppError(httpStatus.NOT_FOUND, "Parent not found");
      }

      const { DisciplinaryAction } = await import(
        "../disciplinary/disciplinary.model"
      );

      // Get all red warrants for parent's children
      const actions = await DisciplinaryAction.find({
        studentId: { $in: parent.children },
        isRedWarrant: true,
      })
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

      // Get stats for all children combined (only red warrants)
      const stats = await DisciplinaryAction.getDisciplinaryStats(
        parent.schoolId.toString(),
        {
          studentId: { $in: parent.children },
          isRedWarrant: true,
        }
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

      return {
        actions: formattedActions,
        stats,
        childrenCount: parent.children.length,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to get child disciplinary actions: ${(error as Error).message}`
      );
    }
  }

  async getParentDashboard(parentUserId: string) {
    try {
      // Find the parent by userId
      const parent = await Parent.findOne({ userId: parentUserId })
        .populate("children", "studentId grade section rollNumber userId")
        .populate({
          path: "children",
          populate: {
            path: "userId",
            select: "firstName lastName",
          },
        });

      if (!parent) {
        throw new AppError(httpStatus.NOT_FOUND, "Parent not found");
      }

      const children = parent.children || [];

      // Initialize dashboard stats
      let totalAttendanceAlerts = 0;
      let totalPendingHomework = 0;
      let totalUpcomingEvents = 0;
      let totalNotices = 0;

      // Calculate attendance alerts (children with < 75% attendance this month)
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // Get once per parent (not per child) to avoid duplication
      totalUpcomingEvents = await AcademicCalendar.countDocuments({
        startDate: { $gte: new Date() },
        isActive: true,
        schoolId: parent.schoolId,
      });

      totalNotices = await Notification.countDocuments({
        schoolId: parent.schoolId,
        $or: [
          { recipientType: "parent" },
          { recipientType: "all" },
          { recipientId: parentUserId }
        ],
        isActive: true,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      });

      for (const child of children) {
        // Cast child to proper type since it's populated
        const studentChild = child as any;
        
        // Attendance calculation
        const attendanceRecords = await Attendance.aggregate([
          {
            $match: {
              "students.studentId": studentChild._id,
              date: { $gte: currentMonth, $lt: nextMonth },
            },
          },
          { $unwind: "$students" },
          { $match: { "students.studentId": studentChild._id } },
        ]);

        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(
          (record) => record.students.status === "present"
        ).length;
        const attendancePercentage =
          totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

        if (attendancePercentage < 75) {
          totalAttendanceAlerts++;
        }

        // Pending homework count for this child
        const pendingHomeworkCount = await Homework.countDocuments({
          grade: studentChild.grade,
          section: studentChild.section,
          isPublished: true,
          dueDate: { $gte: new Date() },
        });

        // Check which homework has been submitted by this child
        const submittedHomework = await HomeworkSubmission.countDocuments({
          studentId: studentChild._id,
        });

        // Approximate pending homework (not exact but gives an idea)
        const childPendingHomework = Math.max(0, pendingHomeworkCount - submittedHomework);
        totalPendingHomework += childPendingHomework;
      }

      const dashboardStats = {
        totalChildren: children.length,
        totalAttendanceAlerts,
        totalPendingHomework,
        totalUpcomingEvents,
        totalNotices,
      };

      return {
        parent: {
          id: parent._id,
          parentId: parent.parentId,
          fullName:
            parent.userId &&
            typeof parent.userId === "object" &&
            "firstName" in parent.userId &&
            "lastName" in parent.userId
              ? `${parent.userId.firstName} ${parent.userId.lastName}`.trim()
              : "",
          relationship: parent.relationship,
        },
        children: children.map((child: any) => ({
          id: child._id,
          studentId: child.studentId,
          firstName: child.userId?.firstName || "",
          lastName: child.userId?.lastName || "",
          fullName:
            child.userId &&
            typeof child.userId === "object" &&
            child.userId.firstName &&
            child.userId.lastName
              ? `${(child.userId as any).firstName} ${
                  (child.userId as any).lastName
                }`.trim()
              : "",
          grade: child.grade,
          section: child.section,
          rollNumber: child.rollNumber,
        })),
        stats: dashboardStats,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to get parent dashboard: ${(error as Error).message}`
      );
    }
  }

  async getParentChildren(parentUserId: string) {
    try {
      const parent = await Parent.findOne({ userId: parentUserId })
        .populate(
          "children",
          "studentId grade section rollNumber userId schoolId"
        )
        .populate({
          path: "children",
          populate: {
            path: "userId",
            select: "firstName lastName email phone",
          },
        })
        .populate({
          path: "children",
          populate: {
            path: "schoolId",
            select: "name",
          },
        });

      if (!parent) {
        throw new AppError(httpStatus.NOT_FOUND, "Parent not found");
      }

      return {
        children: parent.children.map((child: any) => ({
          id: child._id,
          studentId: child.studentId,
          fullName:
            child.userId &&
            typeof child.userId === "object" &&
            "firstName" in child.userId &&
            "lastName" in child.userId
              ? `${(child.userId as any).firstName} ${
                  (child.userId as any).lastName
                }`.trim()
              : "",
          firstName: child.userId?.firstName || "",
          lastName: child.userId?.lastName || "",
          email: child.userId?.email || "",
          phone: child.userId?.phone || "",
          grade: child.grade,
          section: child.section,
          rollNumber: child.rollNumber,
          school: child.schoolId?.name || "",
        })),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to get parent children: ${(error as Error).message}`
      );
    }
  }

  async getChildAttendance(
    parentUserId: string,
    childId: string,
    filters?: { month?: number; year?: number }
  ) {
    try {
      // Verify parent has access to this child
      const parent = await Parent.findOne({
        userId: parentUserId,
        children: childId,
      });
      if (!parent) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "Access denied to this child's data"
        );
      }

      const child = await Student.findById(childId).populate(
        "userId",
        "firstName lastName"
      );
      if (!child) {
        throw new AppError(httpStatus.NOT_FOUND, "Child not found");
      }

      // Default to current month/year if not provided
      const month = filters?.month || new Date().getMonth() + 1;
      const year = filters?.year || new Date().getFullYear();

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      const attendanceRecords = await Attendance.aggregate([
        {
          $match: {
            "students.studentId": child._id,
            date: { $gte: startDate, $lt: endDate },
          },
        },
        { $unwind: "$students" },
        { $match: { "students.studentId": child._id } },
        {
          $lookup: {
            from: "subjects",
            localField: "subjectId",
            foreignField: "_id",
            as: "subject",
          },
        },
        { $unwind: "$subject" },
        {
          $project: {
            date: 1,
            status: "$students.status",
            subject: "$subject.name",
            period: 1,
            markedAt: "$students.markedAt",
          },
        },
        { $sort: { date: -1, period: 1 } },
      ]);

      // Calculate monthly statistics
      const totalRecords = attendanceRecords.length;
      const presentCount = attendanceRecords.filter(
        (r) => r.status === "present"
      ).length;
      const absentCount = attendanceRecords.filter(
        (r) => r.status === "absent"
      ).length;
      const lateCount = attendanceRecords.filter(
        (r) => r.status === "late"
      ).length;

      return {
        child: {
          id: child._id,
          studentId: child.studentId,
          fullName: child.userId
            ? typeof child.userId === "object" &&
              "firstName" in child.userId &&
              "lastName" in child.userId
              ? `${(child.userId as any).firstName} ${
                  (child.userId as any).lastName
                }`.trim()
              : ""
            : "",
          grade: child.grade,
          section: child.section,
        },
        month,
        year,
        summary: {
          totalDays: totalRecords,
          presentDays: presentCount,
          absentDays: absentCount,
          lateDays: lateCount,
          attendancePercentage:
            totalRecords > 0
              ? Math.round((presentCount / totalRecords) * 100)
              : 0,
        },
        records: attendanceRecords,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to get child attendance: ${(error as Error).message}`
      );
    }
  }

  async getChildHomework(parentUserId: string, childId: string) {
    try {
      // Verify parent has access to this child
      const parent = await Parent.findOne({
        userId: parentUserId,
        children: childId,
      });
      if (!parent) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "Access denied to this child's data"
        );
      }

      const child = await Student.findById(childId).populate(
        "userId",
        "firstName lastName"
      );
      if (!child) {
        throw new AppError(httpStatus.NOT_FOUND, "Child not found");
      }

      // Get homework for the child's grade and section
      const homework = await Homework.find({
        grade: child.grade,
        section: child.section,
        isPublished: true,
      })
        .populate("teacherId", "userId teacherId")
        .populate({
          path: "teacherId",
          populate: {
            path: "userId",
            select: "firstName lastName",
          },
        })
        .populate("subjectId", "name code")
        .sort({ dueDate: 1, assignedDate: -1 })
        .lean();

      // Get submissions for this student
      const submissions = await HomeworkSubmission.find({
        studentId: child._id,
      }).lean();

      // Create a map of submissions by homework ID
      const submissionMap = new Map(
        submissions.map((sub: any) => [sub.homeworkId.toString(), sub])
      );

      // Combine homework with submission status
      const homeworkWithStatus = homework.map((hw: any) => {
        const submission = submissionMap.get(hw._id.toString());
        const teacherUser = hw.teacherId?.userId as any;

        return {
          homeworkId: hw._id,
          title: hw.title,
          description: hw.description,
          instructions: hw.instructions,
          subject: hw.subjectId?.name || "Unknown",
          subjectCode: hw.subjectId?.code || "",
          teacherName: teacherUser
            ? `${teacherUser.firstName} ${teacherUser.lastName}`.trim()
            : "Unknown",
          teacherId: hw.teacherId?._id,
          homeworkType: hw.homeworkType,
          priority: hw.priority,
          assignedDate: hw.assignedDate,
          dueDate: hw.dueDate,
          estimatedDuration: hw.estimatedDuration,
          totalMarks: hw.totalMarks,
          passingMarks: hw.passingMarks,
          submissionType: hw.submissionType,
          allowLateSubmission: hw.allowLateSubmission,
          latePenalty: hw.latePenalty,
          maxLateDays: hw.maxLateDays,
          isGroupWork: hw.isGroupWork,
          maxGroupSize: hw.maxGroupSize,
          rubric: hw.rubric || [],
          tags: hw.tags || [],
          status: submission?.status || "pending",
          submittedAt: submission?.submittedAt,
          marksObtained: submission?.marksObtained,
          grade: submission?.grade,
          feedback: submission?.feedback,
          attachments: hw.attachments || [],
          isLate: submission?.isLate || false,
          isOverdue: !submission && new Date(hw.dueDate) < new Date(),
          daysUntilDue: Math.ceil(
            (new Date(hw.dueDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        };
      });

      // Calculate statistics
      const totalHomework = homeworkWithStatus.length;
      const completedHomework = homeworkWithStatus.filter(
        (h) => h.status === "submitted" || h.status === "graded"
      ).length;
      const pendingHomework = homeworkWithStatus.filter(
        (h) => h.status === "pending"
      ).length;
      const overdueHomework = homeworkWithStatus.filter(
        (h) => h.isOverdue
      ).length;

      return {
        child: {
          id: child._id,
          studentId: child.studentId,
          fullName:
            child.userId &&
            typeof child.userId === "object" &&
            "firstName" in child.userId &&
            "lastName" in child.userId
              ? `${(child.userId as any).firstName} ${
                  (child.userId as any).lastName
                }`.trim()
              : "",
          grade: child.grade,
          section: child.section,
        },
        summary: {
          totalHomework,
          completedHomework,
          pendingHomework,
          overdueHomework,
          completionRate:
            totalHomework > 0
              ? Math.round((completedHomework / totalHomework) * 100)
              : 0,
        },
        homework: homeworkWithStatus,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to get child homework: ${(error as Error).message}`
      );
    }
  }

  async getChildSchedule(parentUserId: string, childId: string) {
    try {
      // Verify parent has access to this child
      const parent = await Parent.findOne({
        userId: parentUserId,
        children: childId,
      });
      if (!parent) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "Access denied to this child's data"
        );
      }

      const child = await Student.findById(childId).populate(
        "userId",
        "firstName lastName"
      );
      if (!child) {
        throw new AppError(httpStatus.NOT_FOUND, "Child not found");
      }

      const schedule = await Schedule.aggregate([
        {
          $match: {
            grade: child.grade,
            section: child.section,
            isActive: true,
          },
        },
        {
          $lookup: {
            from: "subjects",
            localField: "subjectId",
            foreignField: "_id",
            as: "subject",
          },
        },
        { $unwind: "$subject" },
        {
          $lookup: {
            from: "teachers",
            localField: "teacherId",
            foreignField: "_id",
            as: "teacher",
          },
        },
        { $unwind: "$teacher" },
        {
          $lookup: {
            from: "users",
            localField: "teacher.userId",
            foreignField: "_id",
            as: "teacherUser",
          },
        },
        { $unwind: "$teacherUser" },
        {
          $lookup: {
            from: "classes",
            localField: "classId",
            foreignField: "_id",
            as: "class",
          },
        },
        { $unwind: "$class" },
        {
          $project: {
            dayOfWeek: 1,
            period: 1,
            startTime: 1,
            endTime: 1,
            subject: "$subject.name",
            subjectId: "$subject._id",
            teacherName: "$teacherUser.fullName",
            teacherId: "$teacher._id",
            className: "$class.name",
            room: 1,
            isActive: 1,
          },
        },
        { $sort: { dayOfWeek: 1, period: 1 } },
      ]);

      // Group by day of week
      const daysOfWeek = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      const scheduleByDay = daysOfWeek.map((day) => ({
        day,
        periods: schedule
          .filter((s) => s.dayOfWeek === day)
          .sort((a, b) => a.period - b.period),
      }));

      return {
        child: {
          id: child._id,
          studentId: child.studentId,
          fullName:
            child.userId &&
            typeof child.userId === "object" &&
            "firstName" in child.userId &&
            "lastName" in child.userId
              ? `${(child.userId as any).firstName} ${
                  (child.userId as any).lastName
                }`.trim()
              : "",
          grade: child.grade,
          section: child.section,
        },
        scheduleByDay,
        totalPeriods: schedule.length,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to get child schedule: ${(error as Error).message}`
      );
    }
  }

  async getChildNotices(parentUserId: string, childId: string) {
    try {
      // Verify parent has access to this child
      const parent = await Parent.findOne({
        userId: parentUserId,
        children: childId,
      });
      if (!parent) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "Access denied to this child's data"
        );
      }

      // The recipientId in Notification is the USER ID, not parent ID
      // So we should query using parentUserId (which is the user's ObjectId)
      const notices = await Notification.find({
        $and: [
          {
            $or: [
              { recipientId: parentUserId }, // Notifications sent to this specific parent
              { recipientType: "parent" }, // General parent notifications
              { recipientType: "all" }, // General all-user notifications
            ],
          },
          { schoolId: parent.schoolId },
        ],
      })
        .populate("senderId", "firstName lastName")
        .sort({ createdAt: -1 })
        .limit(50);


      return {
        notices: notices.map((notice) => ({
          id: notice._id,
          title: notice.title,
          content: notice.message,
          type: notice.type,
          priority: notice.priority,
          targetAudience: notice.recipientType,
          createdAt: notice.createdAt,
          isRead: notice.isRead,
          createdBy:
            notice.senderId &&
            typeof notice.senderId === "object" &&
            "firstName" in notice.senderId &&
            "lastName" in notice.senderId
              ? `${(notice.senderId as any).firstName} ${
                  (notice.senderId as any).lastName
                }`.trim()
              : "System",
        })),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to get child notices: ${(error as Error).message}`
      );
    }
  }
}

export const parentService = new ParentService();
