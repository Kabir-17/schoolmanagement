import { Types } from "mongoose";
import httpStatus from "http-status";
import ExcelJS from "exceljs";
import {
  Assessment,
  AssessmentCategory,
  AssessmentResult,
  AssessmentAdminPreference,
} from "./assessment.model";
import {
  ITeacherAssignment,
  IAssessmentSummary,
  IStudentAssessmentRow,
  IAssessment,
} from "./assessment.interface";
import { AppError } from "../../errors/AppError";
import { Teacher } from "../teacher/teacher.model";
import { Schedule } from "../schedule/schedule.model";
import { Student } from "../student/student.model";
import { Subject } from "../subject/subject.model";
import { Class } from "../class/class.model";
import { Parent } from "../parent/parent.model";

type AuthUser = {
  id: string;
  role: string;
  schoolId?: string;
};

interface CreateAssessmentPayload {
  subjectId: string;
  subjectName?: string;
  grade: number;
  section: string;
  examName: string;
  examDate: string;
  totalMarks: number;
  note?: string;
  categoryId?: string;
  categoryLabel?: string;
  academicYear?: string;
}

interface UpdateAssessmentPayload {
  examName?: string;
  examDate?: string;
  totalMarks?: number;
  note?: string | null;
  categoryId?: string | null;
  categoryLabel?: string | null;
  academicYear?: string;
}

interface TeacherAssessmentFilters {
  subjectId?: string;
  grade?: number;
  section?: string;
  includeStats?: boolean;
}

interface TeacherPerformanceFilters {
  subjectId: string;
  grade: number;
  section: string;
}

interface AdminAssessmentFilters {
  schoolId: string;
  grade?: number;
  section?: string;
  subjectId?: string;
  includeStats?: boolean;
  searchTerm?: string;
  includeHidden?: boolean;
  onlyFavorites?: boolean;
  categoryId?: string;
  teacherId?: string;
  sortBy?:
    | "examDate"
    | "averagePercentage"
    | "totalMarks"
    | "gradedCount"
    | "examName";
  sortDirection?: "asc" | "desc";
  fromDate?: Date;
  toDate?: Date;
  assessmentIds?: string[];
}

interface AdminAssessmentListItem {
  id: string;
  examName: string;
  examTypeLabel?: string | null;
  examDate?: Date | null;
  totalMarks: number;
  grade: number;
  section: string;
  subject: {
    id: string;
    name: string;
    code?: string;
  };
  teacher?: {
    id: string;
    name?: string;
  };
  category?: {
    id?: string;
    name?: string | null;
  };
  gradedCount: number;
  averagePercentage: number;
  highestPercentage: number;
  lowestPercentage: number;
  isFavorite: boolean;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AdminAssessmentSubjectGroup {
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  totalAssessments: number;
  visibleAssessments: number;
  hiddenCount: number;
  favoritesCount: number;
  averagePercentage: number;
  latestExamDate?: Date | null;
  assessments: AdminAssessmentListItem[];
}

interface AdminAssessmentOverview {
  totalAssessments: number;
  visibleAssessments: number;
  hiddenCount: number;
  favoritesCount: number;
  averagePercentage: number;
  lastUpdatedAt?: Date | null;
}

interface AdminAssessmentFilterOptions {
  subjects: Array<{ id: string; name: string; code?: string }>;
  categories: Array<{ id: string; name: string }>;
  teachers: Array<{ id: string; name: string }>;
}

interface AdminAssessmentResponse {
  overview: AdminAssessmentOverview;
  subjectGroups: AdminAssessmentSubjectGroup[];
  filters: AdminAssessmentFilterOptions;
}

interface ExportOptions {
  format: "csv" | "xlsx";
  filename: string;
}

class AssessmentService {
  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private normalizeObjectId(value: any, context: string): Types.ObjectId {
    if (!value) {
      throw new AppError(httpStatus.BAD_REQUEST, `${context} is required`);
    }
    if (value instanceof Types.ObjectId) {
      return value;
    }
    if (typeof value === "string" && Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    if (value._id) {
      return this.normalizeObjectId(value._id, context);
    }
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `${context} must be a valid identifier`
    );
  }

  private async resolveSubjectObjectId(
    schoolId: Types.ObjectId,
    identifier?: string
  ): Promise<Types.ObjectId | null> {
    if (!identifier) {
      return null;
    }

    if (Types.ObjectId.isValid(identifier)) {
      return new Types.ObjectId(identifier);
    }

    const subject = await Subject.findOne({
      schoolId,
      name: { $regex: new RegExp(`^${this.escapeRegex(identifier)}$`, "i") },
    }).select("_id");

    return subject ? (subject._id as Types.ObjectId) : null;
  }

  private getGradeLetter(percentage: number): string {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";
    return "F";
  }

  private buildEmptyAdminAssessmentResponse(): AdminAssessmentResponse {
    return {
      overview: {
        totalAssessments: 0,
        visibleAssessments: 0,
        hiddenCount: 0,
        favoritesCount: 0,
        averagePercentage: 0,
        lastUpdatedAt: undefined,
      },
      subjectGroups: [],
      filters: {
        subjects: [],
        categories: [],
        teachers: [],
      },
    };
  }

  private async resolveTeacher(userId: string) {
    const teacher = await Teacher.findOne({ userId })
      .populate("schoolId", "name");

    if (!teacher) {
      throw new AppError(httpStatus.NOT_FOUND, "Teacher profile not found");
    }

    return teacher;
  }

  private async ensureTeacherAssignment(
    teacherId: Types.ObjectId,
    schoolId: Types.ObjectId,
    subjectId: Types.ObjectId | null,
    grade: number,
    section: string,
    subjectKey?: string,
    canonicalSubjectName?: string,
    canonicalSubjectCode?: string,
    assignmentTeacherId?: Types.ObjectId
  ) {
    if (
      assignmentTeacherId &&
      assignmentTeacherId.toString() !== teacherId.toString()
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Access denied. You are not the assigned teacher for this assessment"
      );
    }

    const schedule = await Schedule.findOne({
      schoolId,
      grade,
      section,
      isActive: true,
      "periods.teacherId": teacherId,
    }).populate({
      path: "periods.subjectId",
      select: "name code",
    });

    if (!schedule) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not assigned to this class and subject combination"
      );
    }

    const normalizedCandidates = [
      subjectKey,
      canonicalSubjectName,
      canonicalSubjectCode,
    ]
      .filter(Boolean)
      .map((value) => value!.toLowerCase().trim());

    const hasMatch = schedule.periods.some((period: any) => {
      if (period.isBreak) return false;
      if (!period.teacherId) return false;
      if (period.teacherId.toString() !== teacherId.toString()) return false;

      const rawSubject = period.subjectId;
      if (!rawSubject) return false;

      if (subjectId) {
        if (rawSubject instanceof Types.ObjectId) {
          if (rawSubject.equals(subjectId)) return true;
        } else if (typeof rawSubject === "string") {
          if (rawSubject === subjectId.toString()) return true;
        } else if (rawSubject._id) {
          const embeddedId = this.normalizeObjectId(
            rawSubject._id,
            "Subject"
          );
          if (embeddedId.equals(subjectId)) return true;
        }
      }

      if (normalizedCandidates.length === 0) return false;

      const namesToCheck: string[] = [];
      if (typeof rawSubject === "string") {
        namesToCheck.push(rawSubject);
      } else if (rawSubject?.name) {
        namesToCheck.push(rawSubject.name);
      }
      if (rawSubject?.code) {
        namesToCheck.push(rawSubject.code);
      }

      return namesToCheck.some(
        (candidate) =>
          normalizedCandidates.includes(candidate?.toLowerCase().trim())
      );
    });

    if (!hasMatch) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not assigned to this class and subject combination"
      );
    }
  }

  private async getStudentCountMap(
    schoolId: Types.ObjectId,
    combos: Array<{ grade: number; section: string }>
  ) {
    const map = new Map<string, number>();

    await Promise.all(
      combos.map(async ({ grade, section }) => {
        const key = `${grade}-${section}`;
        if (!map.has(key)) {
          const count = await Student.countDocuments({
            schoolId,
            grade,
            section,
            isActive: true,
          });
          map.set(key, count);
        }
      })
    );

    return map;
  }

  private async ensureStudentBelongsToClass(
    schoolId: Types.ObjectId,
    grade: number,
    section: string,
    studentId: Types.ObjectId
  ) {
    const exists = await Student.exists({
      _id: studentId,
      schoolId,
      grade,
      section,
      isActive: true,
    });

    if (!exists) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "One or more students are not part of this class"
      );
    }
  }

  async getTeacherAssignments(userId: string): Promise<ITeacherAssignment[]> {
    const teacher = await this.resolveTeacher(userId);

    if (!teacher.schoolId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Teacher is not linked to a school"
      );
    }

    const teacherSchoolId = this.normalizeObjectId(
      teacher.schoolId,
      "School"
    );

    const schedules = await Schedule.findByTeacher(teacher._id.toString());
    const assignmentMap = new Map<string, ITeacherAssignment>();

    for (const schedule of schedules) {
      for (const period of schedule.periods) {
        if (
          period.isBreak ||
          !period.teacherId ||
          period.teacherId.toString() !== teacher._id.toString()
        ) {
          continue;
        }

        if (!period.subjectId) {
          continue;
        }

        const subjectDoc = period.subjectId as any;
        let resolvedSubjectId: Types.ObjectId | null = null;
        let subjectName: string | undefined =
          subjectDoc?.name || (typeof period.subjectId === "string" ? period.subjectId : undefined);
        let subjectCode: string | undefined = subjectDoc?.code;

        const rawSubjectIdValue =
          subjectDoc?._id?.toString?.() ?? period.subjectId?.toString?.();

        if (rawSubjectIdValue && Types.ObjectId.isValid(rawSubjectIdValue)) {
          resolvedSubjectId = new Types.ObjectId(rawSubjectIdValue);
        }

        if (!resolvedSubjectId && subjectName) {
          const fallback = await Subject.findOne({
            schoolId: teacherSchoolId,
            name: subjectName,
          }).select("name code");
          if (fallback) {
            resolvedSubjectId = fallback._id;
            subjectName = fallback.name;
            subjectCode = fallback.code;
          }
        }

        if (!resolvedSubjectId && typeof period.subjectId === "string") {
          const fallback = await Subject.findOne({
            schoolId: teacher.schoolId,
            name: period.subjectId,
          }).select("name code");
          if (fallback) {
            resolvedSubjectId = fallback._id;
            subjectName = fallback.name;
            subjectCode = fallback.code;
          }
        }

        if (!resolvedSubjectId) {
          continue;
        }

        if (!subjectName || !subjectCode) {
          const resolvedDoc = await Subject.findById(resolvedSubjectId).select(
            "name code"
          );
          if (resolvedDoc) {
            subjectName = subjectName || resolvedDoc.name;
            subjectCode = subjectCode || resolvedDoc.code;
          }
        }

        const subjectIdStr = resolvedSubjectId.toString();
        const key = `${schedule.grade}-${schedule.section}-${subjectIdStr}`;

        if (!assignmentMap.has(key)) {
          assignmentMap.set(key, {
            subjectId: subjectIdStr,
            subjectName: subjectName || "Subject",
            subjectCode,
            grade: schedule.grade,
            section: schedule.section,
            classId: schedule.classId?.toString(),
            className: `Grade ${schedule.grade} - Section ${schedule.section}`,
            studentsCount: 0,
            scheduleDays: [schedule.dayOfWeek],
          });
        } else {
          const assignment = assignmentMap.get(key)!;
          if (!assignment.scheduleDays.includes(schedule.dayOfWeek)) {
            assignment.scheduleDays.push(schedule.dayOfWeek);
          }
        }
      }
    }

    const combos = Array.from(assignmentMap.values()).map((item) => ({
      grade: item.grade,
      section: item.section,
    }));

    const countMap = await this.getStudentCountMap(teacherSchoolId, combos);

    assignmentMap.forEach((assignment) => {
      const comboKey = `${assignment.grade}-${assignment.section}`;
      assignment.studentsCount = countMap.get(comboKey) || 0;
      assignment.scheduleDays.sort();
    });

    return Array.from(assignmentMap.values()).sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      return (a.subjectName || "").localeCompare(b.subjectName || "");
    });
  }

  async createAssessment(user: AuthUser, payload: CreateAssessmentPayload) {
    if (!user.schoolId) {
      throw new AppError(httpStatus.BAD_REQUEST, "School context missing");
    }

    const teacher = await this.resolveTeacher(user.id);
    const schoolId = this.normalizeObjectId(teacher.schoolId, "School");

    let examTypeId: Types.ObjectId | undefined;
    let examTypeLabel: string | undefined;

    const classDoc = await Class.findOne({
      schoolId,
      grade: payload.grade,
      section: payload.section,
      isActive: true,
    }).select("_id academicYear");

    const subjectLookupKey = payload.subjectName?.trim() || payload.subjectId;

    let subjectDoc: any = null;
    if (Types.ObjectId.isValid(payload.subjectId)) {
      subjectDoc = await Subject.findOne({
        _id: new Types.ObjectId(payload.subjectId),
        schoolId,
      }).select("name code");
    }

    const lookupNames = [subjectLookupKey, payload.subjectId].filter(Boolean) as string[];

    if (!subjectDoc && lookupNames.length > 0) {
      for (const name of lookupNames) {
        subjectDoc = await Subject.findOne({
          schoolId,
          name: { $regex: new RegExp(`^${this.escapeRegex(name)}$`, "i") },
        }).select("name code");
        if (subjectDoc) {
          break;
        }
      }
    }

    let subjectObjectId: Types.ObjectId | null = null;
    if (subjectDoc) {
      subjectObjectId = subjectDoc._id as Types.ObjectId;
    }

    if (!subjectDoc) {
      const subjectName = subjectLookupKey || "Subject";
      const baseCode = subjectName
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || `SUBJ_${payload.grade}`;
      const subjectCode = baseCode.length > 0 ? baseCode : `SUBJ_${payload.grade}`;
      const newSubject = await Subject.create({
        schoolId,
        name: subjectName,
        code: subjectCode,
        grades: [payload.grade],
        isCore: false,
        teachers: [teacher._id],
      });
      subjectDoc = newSubject;
      subjectObjectId = newSubject._id as Types.ObjectId;
    }

    if (!subjectObjectId) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to resolve subject"
      );
    }

    if (user.role === "teacher") {
      await this.ensureTeacherAssignment(
        teacher._id,
        schoolId,
        subjectObjectId,
        payload.grade,
        payload.section,
        subjectLookupKey,
        subjectDoc?.name,
        subjectDoc?.code,
        teacher._id
      );
    }

    if (payload.categoryId) {
      const category = await AssessmentCategory.findOne({
        _id: payload.categoryId,
        schoolId,
        isActive: true,
      });

      if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, "Assessment type not found");
      }

      examTypeId = category._id as Types.ObjectId;
      examTypeLabel = category.name;
    } else if (payload.categoryLabel) {
      examTypeLabel = payload.categoryLabel.trim();
    }

    const examTypeObjectId: Types.ObjectId | null = examTypeId ?? null;

    const assessmentPayload: IAssessment = {
      schoolId,
      subjectId: subjectObjectId,
      teacherId: new Types.ObjectId(teacher._id.toString()),
      grade: payload.grade,
      section: payload.section,
      examName: payload.examName.trim(),
      examTypeId: examTypeObjectId,
      examTypeLabel: examTypeLabel || null,
      examDate: new Date(payload.examDate),
      totalMarks: payload.totalMarks,
      note: payload.note?.trim(),
      academicYear: payload.academicYear || classDoc?.academicYear,
      createdBy: new Types.ObjectId(user.id),
      updatedBy: new Types.ObjectId(user.id),
      isArchived: false,
    };

    if (classDoc?._id) {
      assessmentPayload.classId = new Types.ObjectId(classDoc._id.toString());
    }

    const assessment = await Assessment.create(assessmentPayload);

    return assessment;
  }

  async listTeacherAssessments(
    user: AuthUser,
    filters: TeacherAssessmentFilters
  ) {
    if (!user.schoolId) {
      throw new AppError(httpStatus.BAD_REQUEST, "School context missing");
    }

    const teacher = await this.resolveTeacher(user.id);
    const teacherSchoolId = this.normalizeObjectId(teacher.schoolId, "School");
    const query: any = {
      teacherId: teacher._id,
      isArchived: false,
    };

    if (filters.subjectId) {
      const resolvedSubjectId = await this.resolveSubjectObjectId(
        teacherSchoolId,
        filters.subjectId
      );
      if (resolvedSubjectId) {
        query.subjectId = resolvedSubjectId;
      }
    }
    if (filters.grade) {
      query.grade = filters.grade;
    }
    if (filters.section) {
      query.section = filters.section;
    }

    const assessments = await Assessment.find(query)
      .sort({ examDate: -1 })
      .lean();

    if (assessments.length === 0) {
      return {
        assessments: [],
        stats: {
          totalAssessments: 0,
          totalStudentsEvaluated: 0,
          averagePercentage: 0,
        },
      };
    }

    const assessmentIds = assessments.map((assessment) => assessment._id);

    const resultStats = await AssessmentResult.aggregate([
      { $match: { assessmentId: { $in: assessmentIds } } },
      {
        $group: {
          _id: "$assessmentId",
          gradedCount: { $sum: 1 },
          averagePercentage: { $avg: "$percentage" },
          highestPercentage: { $max: "$percentage" },
          lowestPercentage: { $min: "$percentage" },
        },
      },
    ]);

    const statsMap = new Map<string, any>();
    resultStats.forEach((stat) => {
      statsMap.set(stat._id.toString(), stat);
    });

    const combos = Array.from(
      new Set(
        assessments.map(
          (assessment) => `${assessment.grade}-${assessment.section}`
        )
      )
    ).map((key) => {
      const [grade, section] = key.split("-");
      return { grade: Number.parseInt(grade, 10), section };
    });

    const studentCountMap = await this.getStudentCountMap(
      teacher.schoolId as Types.ObjectId,
      combos
    );

    const summaries: IAssessmentSummary[] = assessments.map((assessment) => {
      const stat = statsMap.get(assessment._id.toString());
      const comboKey = `${assessment.grade}-${assessment.section}`;
      const totalStudents = studentCountMap.get(comboKey) || 0;

      return {
        assessmentId: assessment._id.toString(),
        examName: assessment.examName,
        examTypeLabel: assessment.examTypeLabel,
        examDate: assessment.examDate,
        totalMarks: assessment.totalMarks,
        gradedCount: stat?.gradedCount || 0,
        totalStudents,
        averagePercentage: stat?.averagePercentage
          ? Math.round(stat.averagePercentage * 10) / 10
          : 0,
        highestPercentage: stat?.highestPercentage || 0,
        lowestPercentage:
          stat?.lowestPercentage !== undefined && stat.lowestPercentage !== null
            ? stat.lowestPercentage
            : 0,
      };
    });

    const aggregateAverage =
      summaries.length > 0
        ? Math.round(
            (summaries.reduce(
              (sum, item) => sum + (item.averagePercentage || 0),
              0
            ) /
              summaries.length) *
              10
          ) / 10
        : 0;

    const totalStudentsEvaluated = summaries.reduce(
      (sum, item) => sum + item.gradedCount,
      0
    );

    return {
      assessments: summaries,
      stats: {
        totalAssessments: summaries.length,
        totalStudentsEvaluated,
        averagePercentage: aggregateAverage,
      },
    };
  }

  async getAssessmentDetails(user: AuthUser, assessmentId: string) {
    const assessment = await Assessment.findById(assessmentId)
      .populate("subjectId", "name code")
      .populate({
        path: "teacherId",
        populate: { path: "userId", select: "firstName lastName" },
      })
      .lean();

    if (!assessment) {
      throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
    }

    if (user.role === "teacher") {
      const teacher = await this.resolveTeacher(user.id);
      const assessmentTeacherId = this.normalizeObjectId(
        (assessment.teacherId as any)?._id || assessment.teacherId,
        "Teacher"
      );

      if (assessmentTeacherId.toString() !== teacher._id.toString()) {
        throw new AppError(httpStatus.FORBIDDEN, "Access denied");
      }
    } else if (user.role === "admin" || user.role === "superadmin") {
      if (
        user.schoolId &&
        assessment.schoolId.toString() !== user.schoolId.toString()
      ) {
        throw new AppError(httpStatus.FORBIDDEN, "Access denied");
      }
    } else {
      throw new AppError(httpStatus.FORBIDDEN, "Access denied");
    }

    const students = await Student.find({
      schoolId: assessment.schoolId,
      grade: assessment.grade,
      section: assessment.section,
      isActive: true,
    })
      .select("studentId rollNumber userId")
      .populate({ path: "userId", select: "firstName lastName" })
      .sort({ rollNumber: 1, studentId: 1 })
      .lean();

    const results = await AssessmentResult.find({
      assessmentId: assessment._id,
    })
      .select("studentId marksObtained percentage grade remarks")
      .lean();

    const resultMap = new Map<string, any>();
    results.forEach((result) => {
      resultMap.set(result.studentId.toString(), result);
    });

    const rows = students.map((student: any) => {
      const result = resultMap.get(student._id.toString());
      const profile = student.userId || {};
      const studentName = `${profile.firstName || ""} ${
        profile.lastName || ""
      }`.trim() || student.studentId;
      return {
        studentId: student._id.toString(),
        studentCode: student.studentId,
        studentName,
        rollNumber: student.rollNumber,
        marksObtained: result?.marksObtained ?? null,
        percentage: result?.percentage ?? null,
        grade: result?.grade ?? null,
        remarks: result?.remarks ?? "",
      };
    });

    return {
      assessment: {
        id: assessment._id.toString(),
        examName: assessment.examName,
        examTypeLabel: assessment.examTypeLabel,
        examDate: assessment.examDate,
        totalMarks: assessment.totalMarks,
        note: assessment.note,
        grade: assessment.grade,
        section: assessment.section,
        subject: assessment.subjectId,
        teacher: assessment.teacherId,
        academicYear: assessment.academicYear,
      },
      students: rows,
    };
  }

  async updateAssessment(
    user: AuthUser,
    assessmentId: string,
    updates: UpdateAssessmentPayload
  ) {
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
    }

    if (user.role === "teacher") {
      const teacher = await this.resolveTeacher(user.id);
      if (assessment.teacherId.toString() !== teacher._id.toString()) {
        throw new AppError(httpStatus.FORBIDDEN, "Access denied");
      }
    } else if (user.role === "admin" || user.role === "superadmin") {
      if (
        user.schoolId &&
        assessment.schoolId.toString() !== user.schoolId.toString()
      ) {
        throw new AppError(httpStatus.FORBIDDEN, "Access denied");
      }
    } else {
      throw new AppError(httpStatus.FORBIDDEN, "Access denied");
    }

    if (updates.examName !== undefined) {
      assessment.examName = updates.examName.trim();
    }

    if (updates.examDate) {
      assessment.examDate = new Date(updates.examDate);
    }

    if (updates.totalMarks !== undefined) {
      assessment.totalMarks = updates.totalMarks;
    }

    if (updates.note !== undefined) {
      assessment.note = updates.note?.trim() || undefined;
    }

    if (updates.academicYear !== undefined) {
      assessment.academicYear = updates.academicYear;
    }

    if (updates.categoryId) {
      const category = await AssessmentCategory.findOne({
        _id: updates.categoryId,
        schoolId: assessment.schoolId,
        isActive: true,
      });

      if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, "Assessment type not found");
      }

      assessment.examTypeId = category._id as Types.ObjectId;
      assessment.examTypeLabel = category.name;
    } else if (updates.categoryId === null) {
      assessment.examTypeId = undefined;
      assessment.examTypeLabel = updates.categoryLabel?.trim() || null;
    } else if (updates.categoryLabel !== undefined) {
      assessment.examTypeId = undefined;
      assessment.examTypeLabel = updates.categoryLabel
        ? updates.categoryLabel.trim()
        : null;
    }

    assessment.updatedBy = new Types.ObjectId(user.id);

    await assessment.save();

    return assessment;
  }

  async deleteAssessment(user: AuthUser, assessmentId: string) {
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
    }

    if (user.role === "teacher") {
      const teacher = await this.resolveTeacher(user.id);
      if (assessment.teacherId.toString() !== teacher._id.toString()) {
        throw new AppError(httpStatus.FORBIDDEN, "Access denied");
      }
    } else if (user.role === "admin" || user.role === "superadmin") {
      if (
        user.schoolId &&
        assessment.schoolId.toString() !== user.schoolId.toString()
      ) {
        throw new AppError(httpStatus.FORBIDDEN, "Access denied");
      }
    } else {
      throw new AppError(httpStatus.FORBIDDEN, "Access denied");
    }

    assessment.isArchived = true;
    await assessment.save();

    return { success: true };
  }

  async saveAssessmentResults(
    user: AuthUser,
    assessmentId: string,
    results: Array<{ studentId: string; marksObtained: number; remarks?: string }>
  ) {
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
    }

    if (user.role === "teacher") {
      const teacher = await this.resolveTeacher(user.id);
      if (assessment.teacherId.toString() !== teacher._id.toString()) {
        throw new AppError(httpStatus.FORBIDDEN, "Access denied");
      }
    } else if (user.role === "admin" || user.role === "superadmin") {
      if (
        user.schoolId &&
        assessment.schoolId.toString() !== user.schoolId.toString()
      ) {
        throw new AppError(httpStatus.FORBIDDEN, "Access denied");
      }
    } else {
      throw new AppError(httpStatus.FORBIDDEN, "Access denied");
    }

    const totalMarks = assessment.totalMarks;

    for (const result of results) {
      if (result.marksObtained > totalMarks) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Marks for a student cannot exceed total marks (${totalMarks})`
        );
      }

      await this.ensureStudentBelongsToClass(
        assessment.schoolId as Types.ObjectId,
        assessment.grade,
        assessment.section,
        new Types.ObjectId(result.studentId)
      );

      const percentage =
        totalMarks > 0 ? (result.marksObtained / totalMarks) * 100 : 0;
      const grade = this.getGradeLetter(percentage);

      await AssessmentResult.findOneAndUpdate(
        {
          assessmentId: assessment._id,
          studentId: result.studentId,
        },
        {
          assessmentId: assessment._id,
          studentId: result.studentId,
          marksObtained: result.marksObtained,
          percentage: Math.round(percentage * 100) / 100,
          grade,
          remarks: result.remarks,
          gradedBy: new Types.ObjectId(user.id),
          gradedAt: new Date(),
          updatedBy: new Types.ObjectId(user.id),
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    const gradedCount = await AssessmentResult.countDocuments({
      assessmentId: assessment._id,
    });

    return {
      gradedCount,
      totalStudents: await Student.countDocuments({
        schoolId: assessment.schoolId,
        grade: assessment.grade,
        section: assessment.section,
        isActive: true,
      }),
    };
  }

  private buildCsv(headers: string[], rows: Array<Array<string | number>>) {
    const allRows = [headers, ...rows];
    return allRows.map((row) =>
      row
        .map((cell) => {
          const value = cell !== undefined && cell !== null ? String(cell) : "";
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ).join("\n");
  }

  private async buildWorkbook(
    sheetName: string,
    headers: string[],
    rows: Array<Array<string | number>>
  ) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.addRow(headers);
    rows.forEach((row) => worksheet.addRow(row));
    worksheet.getRow(1).font = { bold: true };
    const columns = worksheet.columns ?? [];
    columns.forEach((column: any) => {
      if (!column) return;
      let maxLength = 10;
      column.eachCell?.({ includeEmpty: true }, (cell: any) => {
        const cellLength = cell.value ? cell.value.toString().length : 0;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = maxLength + 2;
    });
    return workbook.xlsx.writeBuffer();
  }

  async exportAssessment(
    user: AuthUser,
    assessmentId: string,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    const details = await this.getAssessmentDetails(user, assessmentId);

    const headers = [
      "Roll",
      "Student ID",
      "Student Name",
      "Marks Obtained",
      "Total Marks",
      "Percentage",
      "Grade",
      "Remarks",
    ];

    const rows = details.students.map((student) => [
      student.rollNumber ?? "",
      student.studentCode,
      student.studentName,
      student.marksObtained ?? "",
      details.assessment.totalMarks,
      student.percentage ?? "",
      student.grade ?? "",
      student.remarks ?? "",
    ]);

    if (options.format === "csv") {
      const csv = this.buildCsv(headers, rows);
      return {
        buffer: Buffer.from(csv, "utf-8"),
        filename: `${options.filename}.csv`,
        mimeType: "text/csv",
      };
    }

    const buffer = await this.buildWorkbook(
      "Assessment Results",
      headers,
      rows
    );
    return {
      buffer: Buffer.from(buffer),
      filename: `${options.filename}.xlsx`,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  async getTeacherPerformanceMatrix(
    user: AuthUser,
    filters: TeacherPerformanceFilters
  ) {
    const teacher = await this.resolveTeacher(user.id);
    const schoolId = this.normalizeObjectId(teacher.schoolId, "School");

    const subjectObjectId = await this.resolveSubjectObjectId(
      schoolId,
      filters.subjectId
    );

    const subjectLookupKey = filters.subjectId;

    await this.ensureTeacherAssignment(
      teacher._id,
      schoolId,
      subjectObjectId,
      filters.grade,
      filters.section,
      subjectLookupKey
    );

    if (!subjectObjectId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Subject is not available for performance analysis"
      );
    }

    const assessments = await Assessment.find({
      teacherId: teacher._id,
      subjectId: subjectObjectId,
      grade: filters.grade,
      section: filters.section,
      isArchived: false,
    })
      .sort({ examDate: 1 })
      .lean();

    const assessmentIds = assessments.map((assessment) => assessment._id);

    const results = await AssessmentResult.find({
      assessmentId: { $in: assessmentIds },
    })
      .select("assessmentId studentId marksObtained percentage grade remarks")
      .lean();

    const resultsByAssessment = new Map<string, Array<any>>();
    results.forEach((result) => {
      const key = result.assessmentId.toString();
      if (!resultsByAssessment.has(key)) {
        resultsByAssessment.set(key, []);
      }
      resultsByAssessment.get(key)!.push(result);
    });

    const students = await Student.find({
      schoolId: teacher.schoolId,
      grade: filters.grade,
      section: filters.section,
      isActive: true,
    })
      .select("studentId rollNumber userId")
      .populate({ path: "userId", select: "firstName lastName" })
      .sort({ rollNumber: 1, studentId: 1 })
      .lean();

    const studentRows: IStudentAssessmentRow[] = students.map((student: any) => ({
      studentId: student._id.toString(),
      studentName:
        `${student.userId?.firstName || ""} ${
          student.userId?.lastName || ""
        }`.trim() || student.studentId,
      rollNumber: student.rollNumber,
      results: {},
      totals: { obtained: 0, total: 0, averagePercentage: 0 },
    }));

    const studentRowMap = new Map<string, IStudentAssessmentRow>();
    studentRows.forEach((row) => studentRowMap.set(row.studentId, row));

    assessments.forEach((assessment) => {
      const assessmentResults =
        resultsByAssessment.get(assessment._id.toString()) || [];
      assessmentResults.forEach((result) => {
        const row = studentRowMap.get(result.studentId.toString());
        if (!row) return;
        row.results[assessment._id.toString()] = {
          marksObtained: result.marksObtained,
          percentage: result.percentage,
          grade: result.grade,
          remarks: result.remarks,
        };
        row.totals.obtained += result.marksObtained;
        row.totals.total += assessment.totalMarks;
      });
      studentRows.forEach((row) => {
        if (row.totals.total > 0) {
          row.totals.averagePercentage = Math.round(
            (row.totals.obtained / row.totals.total) * 1000
          ) / 10;
        }
      });
    });

    const assessmentStats = assessments.map((assessment) => {
      const assessmentResults =
        resultsByAssessment.get(assessment._id.toString()) || [];

      const average =
        assessmentResults.length > 0
          ? Math.round(
              (assessmentResults.reduce(
                (sum, result) => sum + result.percentage,
                0
              ) /
                assessmentResults.length) *
                10
            ) / 10
          : 0;

      return {
        id: assessment._id.toString(),
        examName: assessment.examName,
        examTypeLabel: assessment.examTypeLabel,
        examDate: assessment.examDate,
        totalMarks: assessment.totalMarks,
        gradedCount: assessmentResults.length,
        averagePercentage: average,
      };
    });

    return {
      assessments: assessmentStats,
      students: studentRows,
    };
  }

  async exportTeacherAssessments(
    user: AuthUser,
    filters: TeacherPerformanceFilters,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    const matrix = await this.getTeacherPerformanceMatrix(user, filters);

    const headers = [
      "Roll",
      "Student",
      ...matrix.assessments.map(
        (assessment) =>
          `${assessment.examName} (${new Date(
            assessment.examDate
          ).toLocaleDateString()})`
      ),
      "Total Obtained",
      "Total Marks",
      "Average %",
    ];

    const rows = matrix.students.map((student) => {
      const assessmentCells = matrix.assessments.map((assessment) => {
        const result = student.results[assessment.id];
        return result
          ? `${result.marksObtained}/${assessment.totalMarks} (${result.percentage}%)`
          : "";
      });

      return [
        student.rollNumber ?? "",
        student.studentName,
        ...assessmentCells,
        student.totals.obtained,
        student.totals.total,
        student.totals.averagePercentage,
      ];
    });

    const filename = `assessment-summary-grade${filters.grade}${filters.section}-${filters.subjectId}`;

    if (options.format === "csv") {
      const csv = this.buildCsv(headers, rows);
      return {
        buffer: Buffer.from(csv, "utf-8"),
        filename: `${filename}.csv`,
        mimeType: "text/csv",
      };
    }

    const buffer = await this.buildWorkbook("Assessments", headers, rows);
    return {
      buffer: Buffer.from(buffer),
      filename: `${filename}.xlsx`,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  async exportAdminAssessments(
    user: AuthUser,
    filters: AdminAssessmentFilters & { format: "csv" | "xlsx" }
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    if (!user.schoolId) {
      throw new AppError(httpStatus.BAD_REQUEST, "School context missing");
    }

    const includeHidden = Boolean(filters.includeHidden);
    const onlyFavorites = Boolean(filters.onlyFavorites);

    const adminView = await this.listAdminAssessments(user, {
      schoolId: filters.schoolId,
      grade: filters.grade,
      section: filters.section,
      subjectId: filters.subjectId,
      categoryId: filters.categoryId,
      teacherId: filters.teacherId,
      includeHidden,
      onlyFavorites,
      searchTerm: filters.searchTerm,
      sortBy: filters.sortBy,
      sortDirection: filters.sortDirection,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    });

    const allVisibleAssessmentIds = adminView.subjectGroups.flatMap((group) =>
      group.assessments.map((assessment) => assessment.id)
    );

    if (allVisibleAssessmentIds.length === 0) {
      const headers = [
        "Grade",
        "Section",
        "Subject",
        "Exam",
        "Exam Type",
        "Date",
        "Roll",
        "Student ID",
        "Student Name",
        "Marks Obtained",
        "Total Marks",
        "Percentage",
        "Grade",
      ];

      if (filters.format === "csv") {
        const csv = this.buildCsv(headers, []);
        return {
          buffer: Buffer.from(csv, "utf-8"),
          filename: "class-assessments-empty.csv",
          mimeType: "text/csv",
        };
      }

      const buffer = await this.buildWorkbook("Class Assessments", headers, []);
      return {
        buffer: Buffer.from(buffer),
        filename: "class-assessments-empty.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }

    const selectionSet = filters.assessmentIds
      ? new Set(filters.assessmentIds.map((id) => id.toString()))
      : null;

    const assessmentIdsToExport = selectionSet
      ? allVisibleAssessmentIds.filter((id) => selectionSet.has(id))
      : allVisibleAssessmentIds;

    if (assessmentIdsToExport.length === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No assessments matched the selected export criteria"
      );
    }

    const schoolObjectId = this.normalizeObjectId(filters.schoolId, "School");
    const assessmentObjectIds = assessmentIdsToExport.map(
      (id) => new Types.ObjectId(id)
    );

    const assessmentOrder = new Map<string, number>();
    assessmentIdsToExport.forEach((id, index) =>
      assessmentOrder.set(id, index)
    );

    const assessmentMetaMap = new Map<
      string,
      {
        subjectName: string;
        subjectCode?: string;
        examTypeLabel?: string | null;
        grade: number;
        section: string;
        examDate?: Date | null;
        totalMarks: number;
      }
    >();

    adminView.subjectGroups.forEach((group) => {
      group.assessments.forEach((assessment) => {
        assessmentMetaMap.set(assessment.id, {
          subjectName: group.subjectName,
          subjectCode: group.subjectCode,
          examTypeLabel: assessment.examTypeLabel,
          grade: assessment.grade,
          section: assessment.section,
          examDate: assessment.examDate ? new Date(assessment.examDate) : null,
          totalMarks: assessment.totalMarks,
        });
      });
    });

    const data = await Assessment.aggregate([
      {
        $match: {
          schoolId: schoolObjectId,
          isArchived: false,
          _id: { $in: assessmentObjectIds },
        },
      },
      {
        $addFields: {
          exportOrder: {
            $indexOfArray: [assessmentObjectIds, "$_id"],
          },
        },
      },
      {
        $lookup: {
          from: "assessmentresults",
          localField: "_id",
          foreignField: "assessmentId",
          as: "results",
        },
      },
      {
        $unwind: {
          path: "$results",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "results.studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: {
          path: "$student",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "student.userId",
          foreignField: "_id",
          as: "studentUser",
        },
      },
      {
        $unwind: {
          path: "$studentUser",
          preserveNullAndEmptyArrays: true,
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
      {
        $unwind: {
          path: "$subject",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          assessmentId: "$_id",
          exportOrder: 1,
          grade: 1,
          section: 1,
          examName: 1,
          examTypeLabel: 1,
          examDate: 1,
          totalMarks: 1,
          subjectName: "$subject.name",
          subjectCode: "$subject.code",
          studentId: "$student.studentId",
          rollNumber: "$student.rollNumber",
          studentName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$studentUser.firstName", ""] },
                  " ",
                  { $ifNull: ["$studentUser.lastName", ""] },
                ],
              },
            },
          },
          marksObtained: "$results.marksObtained",
          percentage: "$results.percentage",
          gradeLetter: "$results.grade",
        },
      },
      {
        $sort: {
          exportOrder: 1,
          examDate: 1,
          studentName: 1,
          studentId: 1,
        },
      },
    ]);

    const headers = [
      "Grade",
      "Section",
      "Subject",
      "Exam",
      "Exam Type",
      "Date",
      "Roll",
      "Student ID",
      "Student Name",
      "Marks Obtained",
      "Total Marks",
      "Percentage",
      "Grade",
    ];

    const rows = data.map((entry) => {
      const assessmentId = entry.assessmentId.toString();
      const meta = assessmentMetaMap.get(assessmentId);

      const subjectName =
        meta?.subjectName ||
        entry.subjectName ||
        adminView.subjectGroups.find((group) =>
          group.assessments.some((assessment) => assessment.id === assessmentId)
        )?.subjectName ||
        "Subject";

      const subjectCode =
        meta?.subjectCode ||
        entry.subjectCode ||
        adminView.subjectGroups.find((group) =>
          group.assessments.some((assessment) => assessment.id === assessmentId)
        )?.subjectCode;

      const examType =
        meta?.examTypeLabel !== undefined
          ? meta.examTypeLabel || ""
          : entry.examTypeLabel || "";

      const grade = meta?.grade ?? entry.grade;
      const section = meta?.section ?? entry.section;
      const totalMarks = meta?.totalMarks ?? entry.totalMarks ?? "";

      const examDate =
        meta?.examDate ?? (entry.examDate ? new Date(entry.examDate) : null);

      const studentName =
        entry.studentName && entry.studentName.trim().length > 0
          ? entry.studentName.trim()
          : "";

      return [
        grade,
        section,
        `${subjectName}${subjectCode ? ` (${subjectCode})` : ""}`,
        entry.examName,
        examType,
        examDate ? examDate.toLocaleDateString() : "",
        entry.rollNumber ?? "",
        entry.studentId ?? "",
        studentName,
        entry.marksObtained ?? "",
        totalMarks,
        entry.percentage ?? "",
        entry.gradeLetter ?? "",
      ];
    });

    const filenameParts = [
      "class-assessments",
      filters.grade ? `grade${filters.grade}` : null,
      filters.section ? `section${filters.section}` : null,
    ].filter(Boolean);

    const filename = filenameParts.join("-");

    if (filters.format === "csv") {
      const csv = this.buildCsv(headers, rows);
      return {
        buffer: Buffer.from(csv, "utf-8"),
        filename: `${filename}.csv`,
        mimeType: "text/csv",
      };
    }

    const buffer = await this.buildWorkbook("Class Assessments", headers, rows);
    return {
      buffer: Buffer.from(buffer),
      filename: `${filename}.xlsx`,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  async listCategories(user: AuthUser) {
    if (!user.schoolId) {
      throw new AppError(httpStatus.BAD_REQUEST, "School context missing");
    }

    const query: any = {
      schoolId: user.schoolId,
    };

    if (user.role === "teacher") {
      query.isActive = true;
    }

    const categories = await AssessmentCategory.find(query)
      .sort({ order: 1, name: 1 })
      .lean();

    return categories.map((category) => ({
      id: category._id.toString(),
      name: category.name,
      description: category.description,
      order: category.order,
      isDefault: category.isDefault,
      isActive: category.isActive,
    }));
  }

  async createCategory(user: AuthUser, payload: any) {
    if (!user.schoolId) {
      throw new AppError(httpStatus.BAD_REQUEST, "School context missing");
    }

    if (user.role !== "admin" && user.role !== "superadmin") {
      throw new AppError(httpStatus.FORBIDDEN, "Access denied");
    }

    const schoolObjectId = new Types.ObjectId(user.schoolId.toString());

    const existing = await AssessmentCategory.findOne({
      schoolId: schoolObjectId,
      name: payload.name.trim(),
    });

    if (existing) {
      throw new AppError(
        httpStatus.CONFLICT,
        "An assessment type with this name already exists"
      );
    }

    const category = await AssessmentCategory.create({
      schoolId: schoolObjectId,
      name: payload.name.trim(),
      description: payload.description?.trim(),
      order: payload.order ?? 0,
      isDefault: payload.isDefault ?? false,
      isActive: true,
      createdBy: new Types.ObjectId(user.id),
      updatedBy: new Types.ObjectId(user.id),
    });

    return category;
  }

  async updateCategory(user: AuthUser, categoryId: string, payload: any) {
    if (!user.schoolId) {
      throw new AppError(httpStatus.BAD_REQUEST, "School context missing");
    }

    if (user.role !== "admin" && user.role !== "superadmin") {
      throw new AppError(httpStatus.FORBIDDEN, "Access denied");
    }

    const schoolObjectId = new Types.ObjectId(user.schoolId.toString());

    const category = await AssessmentCategory.findOne({
      _id: categoryId,
      schoolId: schoolObjectId,
    });

    if (!category) {
      throw new AppError(httpStatus.NOT_FOUND, "Assessment type not found");
    }

    if (payload.name && payload.name.trim() !== category.name) {
      const exists = await AssessmentCategory.findOne({
        schoolId: schoolObjectId,
        name: payload.name.trim(),
        _id: { $ne: categoryId },
      });

      if (exists) {
        throw new AppError(
          httpStatus.CONFLICT,
          "Another assessment type already uses this name"
        );
      }

      category.name = payload.name.trim();
    }

    if (payload.description !== undefined) {
      category.description = payload.description?.trim();
    }

    if (payload.order !== undefined) {
      category.order = payload.order;
    }

    if (payload.isActive !== undefined) {
      category.isActive = payload.isActive;
    }

    if (payload.isDefault !== undefined) {
      category.isDefault = payload.isDefault;
    }

    category.updatedBy = new Types.ObjectId(user.id);

    await category.save();

    return category;
  }

  async listAdminAssessments(
    user: AuthUser,
    filters: AdminAssessmentFilters
  ): Promise<AdminAssessmentResponse> {
    if (!user.schoolId) {
      throw new AppError(httpStatus.BAD_REQUEST, "School context missing");
    }

    if (user.role !== "admin" && user.role !== "superadmin") {
      throw new AppError(httpStatus.FORBIDDEN, "Access denied");
    }

    const schoolObjectId = new Types.ObjectId(filters.schoolId);

    const query: Record<string, any> = {
      schoolId: schoolObjectId,
      isArchived: false,
    };

    if (filters.grade) {
      query.grade = filters.grade;
    }

    if (filters.section) {
      query.section = filters.section;
    }

    let fromDate =
      filters.fromDate && !Number.isNaN(filters.fromDate.getTime())
        ? new Date(filters.fromDate)
        : undefined;

    let toDate =
      filters.toDate && !Number.isNaN(filters.toDate.getTime())
        ? new Date(filters.toDate)
        : undefined;

    if (fromDate && toDate && fromDate > toDate) {
      const temp = fromDate;
      fromDate = toDate;
      toDate = temp;
    }

    if (fromDate) {
      fromDate.setHours(0, 0, 0, 0);
    }

    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }

    if (fromDate || toDate) {
      query.examDate = {};
      if (fromDate) {
        query.examDate.$gte = fromDate;
      }
      if (toDate) {
        query.examDate.$lte = toDate;
      }
    }

    if (filters.subjectId) {
      const resolvedSubjectId = await this.resolveSubjectObjectId(
        schoolObjectId,
        filters.subjectId
      );
      if (!resolvedSubjectId) {
        return this.buildEmptyAdminAssessmentResponse();
      }
      query.subjectId = resolvedSubjectId;
    }

    if (filters.categoryId) {
      let categoryObjectId: Types.ObjectId | null = null;
      if (Types.ObjectId.isValid(filters.categoryId)) {
        categoryObjectId = new Types.ObjectId(filters.categoryId);
      } else {
        const category = await AssessmentCategory.findOne({
          schoolId: schoolObjectId,
          name: {
            $regex: new RegExp(
              `^${this.escapeRegex(filters.categoryId)}$`,
              "i"
            ),
          },
        })
          .select("_id")
          .lean();
        categoryObjectId = category ? (category._id as Types.ObjectId) : null;
      }

      if (!categoryObjectId) {
        return this.buildEmptyAdminAssessmentResponse();
      }

      query.examTypeId = categoryObjectId;
    }

    if (filters.teacherId) {
      if (!Types.ObjectId.isValid(filters.teacherId)) {
        return this.buildEmptyAdminAssessmentResponse();
      }
      query.teacherId = new Types.ObjectId(filters.teacherId);
    }

    const assessments = await Assessment.find(query)
      .populate("subjectId", "name code")
      .populate({
        path: "teacherId",
        populate: { path: "userId", select: "firstName lastName" },
      })
      .populate("examTypeId", "name")
      .populate("classId", "className")
      .sort({ examDate: -1, createdAt: -1 })
      .lean();

    if (assessments.length === 0) {
      return this.buildEmptyAdminAssessmentResponse();
    }

    const assessmentIds = assessments.map((assessment) => assessment._id);

    const resultStats = await AssessmentResult.aggregate([
      { $match: { assessmentId: { $in: assessmentIds } } },
      {
        $group: {
          _id: "$assessmentId",
          gradedCount: { $sum: 1 },
          averagePercentage: { $avg: "$percentage" },
          highestPercentage: { $max: "$percentage" },
          lowestPercentage: { $min: "$percentage" },
        },
      },
    ]);

    const statsMap = new Map<string, any>();
    resultStats.forEach((stat) => {
      statsMap.set(stat._id.toString(), stat);
    });

    const adminUserId = new Types.ObjectId(user.id);
    const preferences = await AssessmentAdminPreference.find({
      adminUserId,
      assessmentId: { $in: assessmentIds },
    })
      .select("assessmentId isFavorite isHidden")
      .lean();

    const preferenceMap = new Map<
      string,
      { isFavorite: boolean; isHidden: boolean }
    >();
    preferences.forEach((preference) => {
      preferenceMap.set(preference.assessmentId.toString(), {
        isFavorite: preference.isFavorite,
        isHidden: preference.isHidden,
      });
    });

    type EnrichedAssessment = {
      id: string;
      examName: string;
      examTypeLabel?: string | null;
      examDate?: Date | null;
      totalMarks: number;
      grade: number;
      section: string;
      subjectId: string;
      subjectName: string;
      subjectCode?: string;
      teacherId?: string;
      teacherName?: string;
      categoryId?: string;
      categoryName?: string | null;
      className?: string;
      gradedCount: number;
      averagePercentage: number;
      highestPercentage: number;
      lowestPercentage: number;
      isFavorite: boolean;
      isHidden: boolean;
      createdAt: Date;
      updatedAt: Date;
    };

    const enrichedAssessments: EnrichedAssessment[] = assessments.map(
      (assessment) => {
        const subjectDoc = assessment.subjectId as {
          _id?: Types.ObjectId | string;
          name?: string;
          code?: string;
        };

        const teacherDoc = assessment.teacherId as {
          _id?: Types.ObjectId | string;
          userId?: {
            _id?: Types.ObjectId | string;
            firstName?: string;
            lastName?: string;
          };
        };

        const categoryDoc = assessment.examTypeId as {
          _id?: Types.ObjectId | string;
          name?: string;
        } | null;

        const classDoc = assessment.classId as {
          _id?: Types.ObjectId | string;
          className?: string;
        } | null;

        const assessmentIdString = assessment._id.toString();

        const stats = statsMap.get(assessmentIdString) || {};
        const preference = preferenceMap.get(assessmentIdString) || {
          isFavorite: false,
          isHidden: false,
        };

        const subjectId =
          (subjectDoc?._id && subjectDoc._id.toString()) ||
          (assessment.subjectId instanceof Types.ObjectId
            ? assessment.subjectId.toString()
            : typeof assessment.subjectId === "string"
            ? assessment.subjectId
            : `subject-${assessmentIdString}`);

        const subjectName =
          subjectDoc?.name ||
          (typeof assessment.subjectId === "string"
            ? assessment.subjectId
            : "Unassigned Subject");

        const subjectCode = subjectDoc?.code;

        const teacherId =
          teacherDoc?._id && Types.ObjectId.isValid(teacherDoc._id)
            ? teacherDoc._id.toString()
            : undefined;

        const teacherName = teacherDoc?.userId
          ? `${teacherDoc.userId.firstName || ""} ${
              teacherDoc.userId.lastName || ""
            }`.trim()
          : undefined;

        const categoryId =
          categoryDoc?._id && Types.ObjectId.isValid(categoryDoc._id)
            ? categoryDoc._id.toString()
            : undefined;

        const categoryName =
          categoryDoc?.name || assessment.examTypeLabel || null;

        const examDate = assessment.examDate
          ? new Date(assessment.examDate)
          : null;

        const createdAt = assessment.createdAt
          ? new Date(assessment.createdAt)
          : examDate || new Date();

        const updatedAt = assessment.updatedAt
          ? new Date(assessment.updatedAt)
          : createdAt;

        const averagePercentage =
          typeof stats.averagePercentage === "number"
            ? stats.averagePercentage
            : 0;

        const highestPercentage =
          typeof stats.highestPercentage === "number"
            ? stats.highestPercentage
            : 0;

        const lowestPercentage =
          typeof stats.lowestPercentage === "number"
            ? stats.lowestPercentage
            : 0;

        return {
          id: assessmentIdString,
          examName: assessment.examName,
          examTypeLabel: assessment.examTypeLabel,
          examDate,
          totalMarks: assessment.totalMarks,
          grade: assessment.grade,
          section: assessment.section,
          subjectId,
          subjectName,
          subjectCode,
          teacherId,
          teacherName,
          categoryId,
          categoryName,
          className: classDoc?.className || undefined,
          gradedCount: stats.gradedCount ?? 0,
          averagePercentage,
          highestPercentage,
          lowestPercentage,
          isFavorite: preference.isFavorite,
          isHidden: preference.isHidden,
          createdAt,
          updatedAt,
        };
      }
    );

    const subjectOptions = new Map<
      string,
      { id: string; name: string; code?: string }
    >();
    const categoryOptions = new Map<string, { id: string; name: string }>();
    const teacherOptions = new Map<string, { id: string; name: string }>();

    interface SubjectBaseStats {
      total: number;
      hiddenCount: number;
      favoriteCount: number;
      latestExamDate?: Date | null;
      name: string;
      code?: string;
    }

    const subjectBaseStats = new Map<string, SubjectBaseStats>();
    let overallHiddenCount = 0;
    let overallFavoriteCount = 0;

    enrichedAssessments.forEach((item) => {
      subjectOptions.set(item.subjectId, {
        id: item.subjectId,
        name: item.subjectName,
        code: item.subjectCode,
      });

      if (item.categoryId || item.categoryName) {
        const categoryKey = item.categoryId || item.categoryName || "";
        if (categoryKey) {
          categoryOptions.set(categoryKey, {
            id: item.categoryId || categoryKey,
            name: item.categoryName || "Uncategorized",
          });
        }
      }

      if (item.teacherId) {
        teacherOptions.set(item.teacherId, {
          id: item.teacherId,
          name: item.teacherName || "Unnamed Teacher",
        });
      }

      if (!subjectBaseStats.has(item.subjectId)) {
        subjectBaseStats.set(item.subjectId, {
          total: 0,
          hiddenCount: 0,
          favoriteCount: 0,
          latestExamDate: item.examDate,
          name: item.subjectName,
          code: item.subjectCode,
        });
      }

      const baseStat = subjectBaseStats.get(item.subjectId)!;
      baseStat.total += 1;
      if (item.isHidden) {
        baseStat.hiddenCount += 1;
        overallHiddenCount += 1;
      }
      if (item.isFavorite) {
        baseStat.favoriteCount += 1;
        overallFavoriteCount += 1;
      }

      if (
        item.examDate &&
        (!baseStat.latestExamDate ||
          item.examDate > (baseStat.latestExamDate || item.examDate))
      ) {
        baseStat.latestExamDate = item.examDate;
      }
    });

    const includeHidden = Boolean(filters.includeHidden);
    const onlyFavorites = Boolean(filters.onlyFavorites);
    const searchTerm = filters.searchTerm
      ? filters.searchTerm.toLowerCase().trim()
      : "";
    const hasSearch = searchTerm.length > 0;

    const sortBy = (
      filters.sortBy as
        | "examDate"
        | "averagePercentage"
        | "totalMarks"
        | "gradedCount"
        | "examName"
        | undefined
    ) ?? "examDate";
    const sortDirection: "asc" | "desc" =
      filters.sortDirection === "asc" || filters.sortDirection === "desc"
        ? filters.sortDirection
        : "desc";
    const sortMultiplier = sortDirection === "asc" ? 1 : -1;

    const compareAssessments = (
      a: AdminAssessmentListItem,
      b: AdminAssessmentListItem
    ) => {
      switch (sortBy) {
        case "averagePercentage":
          return (
            sortMultiplier *
            ((a.averagePercentage || 0) - (b.averagePercentage || 0))
          );
        case "totalMarks":
          return sortMultiplier * (a.totalMarks - b.totalMarks);
        case "gradedCount":
          return sortMultiplier * (a.gradedCount - b.gradedCount);
        case "examName":
          return sortMultiplier * a.examName.localeCompare(b.examName);
        case "examDate":
        default: {
          const aTime = a.examDate ? new Date(a.examDate).getTime() : 0;
          const bTime = b.examDate ? new Date(b.examDate).getTime() : 0;
          return sortMultiplier * (aTime - bTime);
        }
      }
    };

    const subjectGroupsAccumulator = new Map<
      string,
      { group: AdminAssessmentSubjectGroup; percentageSum: number }
    >();

    let visibleTotal = 0;
    let visiblePercentageSum = 0;
    let lastUpdatedAt: Date | undefined;

    enrichedAssessments.forEach((item) => {
      if (onlyFavorites && !item.isFavorite) {
        return;
      }

      const haystack = [
        item.examName,
        item.examTypeLabel || "",
        item.subjectName,
        item.subjectCode || "",
        item.teacherName || "",
        item.categoryName || "",
      ]
        .join(" ")
        .toLowerCase();

      if (hasSearch && !haystack.includes(searchTerm)) {
        return;
      }

      if (!includeHidden && item.isHidden) {
        return;
      }

      const baseStat = subjectBaseStats.get(item.subjectId);

      if (!subjectGroupsAccumulator.has(item.subjectId)) {
        subjectGroupsAccumulator.set(item.subjectId, {
          group: {
            subjectId: item.subjectId,
            subjectName: baseStat?.name || item.subjectName,
            subjectCode: baseStat?.code || item.subjectCode,
            totalAssessments: baseStat?.total ?? 0,
            visibleAssessments: 0,
            hiddenCount: baseStat?.hiddenCount ?? 0,
            favoritesCount: baseStat?.favoriteCount ?? 0,
            averagePercentage: 0,
            latestExamDate: baseStat?.latestExamDate ?? item.examDate ?? null,
            assessments: [],
          },
          percentageSum: 0,
        });
      }

      const accumulator = subjectGroupsAccumulator.get(item.subjectId)!;

      const listItem: AdminAssessmentListItem = {
        id: item.id,
        examName: item.examName,
        examTypeLabel: item.examTypeLabel,
        examDate: item.examDate ?? null,
        totalMarks: item.totalMarks,
        grade: item.grade,
        section: item.section,
        subject: {
          id: item.subjectId,
          name: item.subjectName,
          code: item.subjectCode,
        },
        teacher: item.teacherId
          ? { id: item.teacherId, name: item.teacherName }
          : undefined,
        category:
          item.categoryId || item.categoryName
            ? {
                id: item.categoryId,
                name: item.categoryName || undefined,
              }
            : undefined,
        gradedCount: item.gradedCount,
        averagePercentage: Math.round(item.averagePercentage * 10) / 10,
        highestPercentage: Math.round(item.highestPercentage * 10) / 10,
        lowestPercentage: Math.round(item.lowestPercentage * 10) / 10,
        isFavorite: item.isFavorite,
        isHidden: item.isHidden,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };

      accumulator.group.assessments.push(listItem);
      accumulator.group.visibleAssessments += 1;
      accumulator.percentageSum += item.averagePercentage;

      if (
        !accumulator.group.latestExamDate ||
        (item.examDate &&
          (!accumulator.group.latestExamDate ||
            item.examDate > accumulator.group.latestExamDate))
      ) {
        accumulator.group.latestExamDate =
          item.examDate ?? accumulator.group.latestExamDate ?? null;
      }

      visibleTotal += 1;
      visiblePercentageSum += item.averagePercentage;

      if (!lastUpdatedAt || item.updatedAt > lastUpdatedAt) {
        lastUpdatedAt = item.updatedAt;
      }
    });

    const subjectGroups = Array.from(subjectGroupsAccumulator.values())
      .map(({ group, percentageSum }) => {
        if (group.visibleAssessments > 0) {
          group.averagePercentage =
            Math.round((percentageSum / group.visibleAssessments) * 10) / 10;
        } else {
          group.averagePercentage = 0;
        }

        group.assessments.sort(compareAssessments);
        return group;
      })
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

    const overview: AdminAssessmentOverview = {
      totalAssessments: enrichedAssessments.length,
      visibleAssessments: visibleTotal,
      hiddenCount: overallHiddenCount,
      favoritesCount: overallFavoriteCount,
      averagePercentage:
        visibleTotal > 0
          ? Math.round((visiblePercentageSum / visibleTotal) * 10) / 10
          : 0,
      lastUpdatedAt,
    };

    return {
      overview,
      subjectGroups,
      filters: {
        subjects: Array.from(subjectOptions.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
        categories: Array.from(categoryOptions.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
        teachers: Array.from(teacherOptions.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      },
    };
  }

  async getStudentOverview(studentId: Types.ObjectId) {
    const assessments = await AssessmentResult.aggregate([
      { $match: { studentId } },
      {
        $lookup: {
          from: "assessments",
          localField: "assessmentId",
          foreignField: "_id",
          as: "assessment",
        },
      },
      { $unwind: "$assessment" },
      {
        $lookup: {
          from: "subjects",
          localField: "assessment.subjectId",
          foreignField: "_id",
          as: "subject",
        },
      },
      { $unwind: "$subject" },
      {
        $lookup: {
          from: "teachers",
          localField: "assessment.teacherId",
          foreignField: "_id",
          as: "teacher",
        },
      },
      { $unwind: { path: "$teacher", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "teacher.userId",
          foreignField: "_id",
          as: "teacherUser",
        },
      },
      { $unwind: { path: "$teacherUser", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          assessmentId: "$assessment._id",
          examName: "$assessment.examName",
          examTypeLabel: "$assessment.examTypeLabel",
          examDate: "$assessment.examDate",
          totalMarks: "$assessment.totalMarks",
          subjectId: "$subject._id",
          subjectName: "$subject.name",
          marksObtained: "$marksObtained",
          percentage: "$percentage",
          grade: "$grade",
          remarks: "$remarks",
          teacherName: {
            $concat: [
              { $ifNull: ["$teacherUser.firstName", ""] },
              " ",
              { $ifNull: ["$teacherUser.lastName", ""] },
            ],
          },
        },
      },
      { $sort: { examDate: -1 } },
    ]);

    const subjectMap = new Map<
      string,
      {
        subjectName: string;
        exams: Array<any>;
        totals: { obtained: number; total: number };
      }
    >();

    assessments.forEach((item) => {
      const key = item.subjectId.toString();
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          subjectName: item.subjectName,
          exams: [],
          totals: { obtained: 0, total: 0 },
        });
      }
      const subjectEntry = subjectMap.get(key)!;
      subjectEntry.exams.push({
        assessmentId: item.assessmentId.toString(),
        examName: item.examName,
        examTypeLabel: item.examTypeLabel,
        examDate: item.examDate,
        marksObtained: item.marksObtained,
        totalMarks: item.totalMarks,
        percentage: item.percentage,
        grade: item.grade,
        remarks: item.remarks,
        teacherName: item.teacherName?.trim(),
      });

      subjectEntry.totals.obtained += item.marksObtained;
      subjectEntry.totals.total += item.totalMarks;
    });

    const subjects = Array.from(subjectMap.entries()).map(
      ([subjectId, value]) => ({
        subjectId,
        subjectName: value.subjectName,
        assessments: value.exams,
        totals: {
          obtained: value.totals.obtained,
          total: value.totals.total,
          averagePercentage:
            value.totals.total > 0
              ? Math.round((value.totals.obtained / value.totals.total) * 1000) /
                10
              : 0,
        },
      })
    );

    const overall = {
      totalAssessments: assessments.length,
      averagePercentage:
        assessments.length > 0
          ? Math.round(
              (assessments.reduce(
                (sum, item) => sum + item.percentage,
                0
              ) /
                assessments.length) *
                10
            ) / 10
          : 0,
      highestPercentage:
        assessments.length > 0
          ? Math.max(...assessments.map((item) => item.percentage))
          : 0,
      lowestPercentage:
        assessments.length > 0
          ? Math.min(...assessments.map((item) => item.percentage))
          : 0,
    };

    return {
      overall,
      subjects,
      recent: assessments.slice(0, 10),
    };
  }

  async getStudentAssessments(user: AuthUser, studentId?: string) {
    if (user.role === "student") {
      const student = await Student.findOne({ userId: user.id });
      if (!student) {
        throw new AppError(httpStatus.NOT_FOUND, "Student profile not found");
      }
      return this.getStudentOverview(student._id);
    }

    if (user.role === "parent") {
      if (!studentId) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Student identifier is required"
        );
      }
      const student = await Student.findById(studentId);
      if (!student) {
        throw new AppError(httpStatus.NOT_FOUND, "Student not found");
      }

      const parentProfile = await Parent.findOne({ userId: user.id }).select(
        "children"
      );
      if (!parentProfile) {
        throw new AppError(httpStatus.NOT_FOUND, "Parent profile not found");
      }
      const isChild = parentProfile.children.some(
        (childId) => childId.toString() === student._id.toString()
      );
      if (!isChild) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You are not authorized to view this student's results"
        );
      }

      return this.getStudentOverview(student._id);
    }

    if (
      user.role === "admin" ||
      user.role === "superadmin" ||
      user.role === "teacher"
    ) {
      if (!studentId) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Student identifier is required"
        );
      }
      const student = await Student.findById(studentId);
      if (!student) {
        throw new AppError(httpStatus.NOT_FOUND, "Student not found");
      }

       if (user.role === "teacher") {
        const teacher = await this.resolveTeacher(user.id);
        const hasAccess = await Schedule.exists({
          schoolId: teacher.schoolId,
          grade: student.grade,
          section: student.section,
          isActive: true,
          "periods.teacherId": teacher._id,
        });

        if (!hasAccess) {
          throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not assigned to this student's class"
          );
        }
      }
      return this.getStudentOverview(student._id);
    }

    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  async updateAdminAssessmentPreference(
    user: AuthUser,
    assessmentId: string,
    payload: { isFavorite?: boolean; isHidden?: boolean }
  ) {
    if (!user.schoolId) {
      throw new AppError(httpStatus.BAD_REQUEST, "School context missing");
    }

    if (user.role !== "admin" && user.role !== "superadmin") {
      throw new AppError(httpStatus.FORBIDDEN, "Access denied");
    }

    const assessmentObjectId = this.normalizeObjectId(
      assessmentId,
      "Assessment"
    );

    const assessment = await Assessment.findOne({
      _id: assessmentObjectId,
      schoolId: new Types.ObjectId(user.schoolId),
      isArchived: false,
    })
      .select("_id schoolId")
      .lean();

    if (!assessment) {
      throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
    }

    const adminUserId = new Types.ObjectId(user.id);

    const updateFields: Record<string, boolean> = {};
    if (payload.isFavorite !== undefined) {
      updateFields.isFavorite = payload.isFavorite;
    }
    if (payload.isHidden !== undefined) {
      updateFields.isHidden = payload.isHidden;
    }

    let preferenceDoc = await AssessmentAdminPreference.findOne({
      adminUserId,
      assessmentId: assessmentObjectId,
    });

    if (!preferenceDoc) {
      preferenceDoc = await AssessmentAdminPreference.create({
        adminUserId,
        assessmentId: assessmentObjectId,
        schoolId: new Types.ObjectId(user.schoolId),
        isFavorite: updateFields.isFavorite ?? false,
        isHidden: updateFields.isHidden ?? false,
      });
    } else {
      if (updateFields.isFavorite !== undefined) {
        preferenceDoc.isFavorite = updateFields.isFavorite;
      }
      if (updateFields.isHidden !== undefined) {
        preferenceDoc.isHidden = updateFields.isHidden;
      }

      if (!preferenceDoc.isFavorite && !preferenceDoc.isHidden) {
        await AssessmentAdminPreference.deleteOne({
          adminUserId,
          assessmentId: assessmentObjectId,
        });

        return {
          assessmentId: assessmentObjectId.toString(),
          isFavorite: false,
          isHidden: false,
        };
      }

      await preferenceDoc.save();
    }

    return {
      assessmentId: preferenceDoc.assessmentId.toString(),
      isFavorite: preferenceDoc.isFavorite,
      isHidden: preferenceDoc.isHidden,
    };
  }

  async getAdminClassCatalog(user: AuthUser) {
    if (!user.schoolId) {
      throw new AppError(httpStatus.BAD_REQUEST, "School context missing");
    }

    if (user.role !== "admin" && user.role !== "superadmin") {
      throw new AppError(httpStatus.FORBIDDEN, "Access denied");
    }

    const classes = await Class.find({
      schoolId: user.schoolId,
      isActive: true,
    })
      .select("grade section className subjects")
      .populate("subjects", "name code")
      .lean();

    return classes
      .map((cls: any) => ({
        grade: cls.grade,
        section: cls.section,
        className: cls.className || `Grade ${cls.grade} - Section ${cls.section}`,
        subjects: (cls.subjects || []).map((subject: any) => ({
          id: subject._id?.toString?.() || "",
          name: subject.name,
        })),
      }))
      .sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade;
        return a.section.localeCompare(b.section);
      });
  }
}

export const assessmentService = new AssessmentService();
