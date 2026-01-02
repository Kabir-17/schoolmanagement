import httpStatus from 'http-status';
import { Types } from 'mongoose';
import { AppError } from '../../errors/AppError';
import { Class } from './class.model';
import { School } from '../school/school.model';
import { Student } from '../student/student.model';
import {
  ICreateClassRequest,
  IUpdateClassRequest,
  IClassResponse,
  IClassStats,
  ICapacityCheck,
  IClassAbsenceSmsSettings,
} from './class.interface';

class ClassService {
  /**
   * Create a new class
   */
  async createClass(
    schoolId: string,
    classData: ICreateClassRequest
  ): Promise<IClassResponse> {
    try {
      if (!Types.ObjectId.isValid(schoolId)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid school ID format');
      }

      // Verify school exists
      const school = await School.findById(schoolId);
      if (!school) {
        throw new AppError(httpStatus.NOT_FOUND, 'School not found');
      }

      // Check if class already exists for this grade and section
      if (classData.section) {
        const existingClass = await Class.findByGradeAndSection(
          schoolId,
          classData.grade,
          classData.section
        );
        if (existingClass) {
          throw new AppError(
            httpStatus.CONFLICT,
            `Class already exists for Grade ${classData.grade} Section ${classData.section}`
          );
        }
      }

      let newClass;
      
      if (classData.section) {
        // Create class with specified section
        const absenceSettings = this.normalizeAbsenceSmsSettingsForCreate(
          classData.absenceSmsSettings
        );

        const classPayload: any = {
          schoolId,
          grade: classData.grade,
          section: classData.section.toUpperCase(),
          className: `Grade ${classData.grade} - Section ${classData.section.toUpperCase()}`,
          academicYear: classData.academicYear,
          maxStudents: classData.maxStudents || school.settings?.maxStudentsPerSection || 40,
          classTeacher: classData.classTeacher ? new Types.ObjectId(classData.classTeacher) : undefined,
          subjects: classData.subjects?.map(id => new Types.ObjectId(id)) || [],
        };

        if (absenceSettings) {
          classPayload.absenceSmsSettings = absenceSettings;
        }

        newClass = new Class(classPayload);
        
        await newClass.save();
      } else {
        // Auto-create class with next available section
        newClass = await Class.createClassWithAutoSection(
          schoolId,
          classData.grade,
          classData.maxStudents || school.settings?.maxStudentsPerSection || 40,
          classData.academicYear
        );
        
        // Add additional data if provided
        if (classData.classTeacher) {
          newClass.classTeacher = new Types.ObjectId(classData.classTeacher);
        }
        if (classData.subjects && classData.subjects.length > 0) {
          newClass.subjects = classData.subjects.map(id => new Types.ObjectId(id));
        }
        
        const absenceSettings = this.normalizeAbsenceSmsSettingsForCreate(
          classData.absenceSmsSettings
        );
        if (absenceSettings) {
          newClass.absenceSmsSettings = absenceSettings;
        }
        await newClass.save();
      }

      // Populate the new class with related data
      const populatedClass = await Class.findById(newClass._id)
        .populate('classTeacher', 'teacherId userId')
        .populate({
          path: 'classTeacher',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        })
        .populate('subjects', 'name code');

      return this.formatClassResponse(populatedClass!);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to create class: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all classes with pagination and filtering
   */
  async getClasses(queryParams: {
    page: number;
    limit: number;
    schoolId?: string;
    grade?: number;
    section?: string;
    academicYear?: string;
    isActive?: boolean;
    sortBy: string;
    sortOrder: string;
  }): Promise<{
    classes: IClassResponse[];
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
        grade,
        section,
        academicYear,
        isActive,
        sortBy,
        sortOrder,
      } = queryParams;

      // Build query
      const query: any = {};
      if (schoolId) {
        if (!Types.ObjectId.isValid(schoolId)) {
          throw new AppError(httpStatus.BAD_REQUEST, 'Invalid school ID format');
        }
        query.schoolId = schoolId;
      }
      if (grade !== undefined) query.grade = grade;
      if (section) query.section = section.toUpperCase();
      if (academicYear) query.academicYear = academicYear;
      if (isActive !== undefined) query.isActive = isActive;

      // Build sort options
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      if (sortBy !== 'grade') sortOptions.grade = 1; // Secondary sort by grade
      if (sortBy !== 'section') sortOptions.section = 1; // Tertiary sort by section

      const totalCount = await Class.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;

      const classes = await Class.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('classTeacher', 'teacherId userId')
        .populate({
          path: 'classTeacher',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        })
        .populate('subjects', 'name code');

      return {
        classes: classes.map(cls => this.formatClassResponse(cls)),
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch classes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get class by ID
   */
  async getClassById(id: string): Promise<IClassResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid class ID format');
      }

      const classDoc = await Class.findById(id)
        .populate('classTeacher', 'teacherId userId')
        .populate({
          path: 'classTeacher',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        })
        .populate('subjects', 'name code');

      if (!classDoc) {
        throw new AppError(httpStatus.NOT_FOUND, 'Class not found');
      }

      return this.formatClassResponse(classDoc);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch class: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update class
   */
  async updateClass(id: string, updateData: IUpdateClassRequest): Promise<IClassResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid class ID format');
      }

      const classDoc = await Class.findById(id);
      if (!classDoc) {
        throw new AppError(httpStatus.NOT_FOUND, 'Class not found');
      }

      // Check if maxStudents is being reduced below current student count
      if (updateData.maxStudents !== undefined && updateData.maxStudents < classDoc.currentStudents) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Cannot reduce maximum students to ${updateData.maxStudents} as there are currently ${classDoc.currentStudents} students enrolled`
        );
      }

      // Update fields
      if (updateData.maxStudents !== undefined) classDoc.maxStudents = updateData.maxStudents;
      if (updateData.classTeacher !== undefined) {
        classDoc.classTeacher = updateData.classTeacher ? new Types.ObjectId(updateData.classTeacher) : undefined;
      }
      if (updateData.subjects !== undefined) {
        classDoc.subjects = updateData.subjects.map(id => new Types.ObjectId(id));
      }
      if (updateData.isActive !== undefined) classDoc.isActive = updateData.isActive;
      if (updateData.absenceSmsSettings !== undefined) {
        const updatedSettings = this.normalizeAbsenceSmsSettingsForUpdate(updateData.absenceSmsSettings);
        if (!classDoc.absenceSmsSettings) {
          classDoc.absenceSmsSettings = {
            enabled: false,
            sendAfterTime: '11:00',
          };
        }
        if (updatedSettings) {
          if (updatedSettings.enabled !== undefined) {
            classDoc.absenceSmsSettings.enabled = updatedSettings.enabled;
          }
          if (updatedSettings.sendAfterTime !== undefined) {
            classDoc.absenceSmsSettings.sendAfterTime = updatedSettings.sendAfterTime;
          }
        }
      }

      await classDoc.save();

      // Return updated class with populated data
      const updatedClass = await Class.findById(id)
        .populate('classTeacher', 'teacherId userId')
        .populate({
          path: 'classTeacher',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        })
        .populate('subjects', 'name code');

      return this.formatClassResponse(updatedClass!);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to update class: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete class (soft delete)
   */
  async deleteClass(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid class ID format');
      }

      const classDoc = await Class.findById(id);
      if (!classDoc) {
        throw new AppError(httpStatus.NOT_FOUND, 'Class not found');
      }

      // Check if class has enrolled students
      if (classDoc.currentStudents > 0) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Cannot delete class with ${classDoc.currentStudents} enrolled students. Please transfer students first.`
        );
      }

      // Soft delete
      classDoc.isActive = false;
      await classDoc.save();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to delete class: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get classes by grade
   */
  async getClassesByGrade(schoolId: string, grade: number): Promise<IClassResponse[]> {
    try {
      if (!Types.ObjectId.isValid(schoolId)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid school ID format');
      }

      const classes = await Class.findByGrade(schoolId, grade);
      return classes.map(cls => this.formatClassResponse(cls));
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch classes by grade: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get class by grade and section
   */
  async getClassByGradeAndSection(
    schoolId: string,
    grade: number,
    section: string
  ): Promise<IClassResponse | null> {
    try {
      if (!Types.ObjectId.isValid(schoolId)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid school ID format');
      }

      const classDoc = await Class.findByGradeAndSection(schoolId, grade, section);
      return classDoc ? this.formatClassResponse(classDoc) : null;
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch class by grade and section: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get class statistics
   */
  async getClassStats(schoolId: string): Promise<IClassStats> {
    try {
      if (!Types.ObjectId.isValid(schoolId)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid school ID format');
      }

      return await Class.getClassStats(schoolId);
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch class statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check capacity for grade
   */
  async checkCapacity(schoolId: string, grade: number): Promise<ICapacityCheck> {
    try {
      if (!Types.ObjectId.isValid(schoolId)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid school ID format');
      }

      return await Class.checkCapacityForGrade(schoolId, grade);
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to check capacity: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create new section if needed
   */
  async createNewSectionIfNeeded(
    schoolId: string,
    grade: number,
    academicYear: string,
    maxStudents?: number
  ): Promise<IClassResponse | null> {
    try {
      if (!Types.ObjectId.isValid(schoolId)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid school ID format');
      }

      const newClass = await Class.createNewSectionIfNeeded(schoolId, grade, academicYear);
      
      if (newClass) {
        // Update maxStudents if provided
        if (maxStudents) {
          newClass.maxStudents = maxStudents;
          await newClass.save();
        }

        // Populate and return
        const populatedClass = await Class.findById(newClass._id)
          .populate('classTeacher', 'teacherId userId')
          .populate({
            path: 'classTeacher',
            populate: {
              path: 'userId',
              select: 'firstName lastName'
            }
          })
          .populate('subjects', 'name code');

        return this.formatClassResponse(populatedClass!);
      }

      return null;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to create new section: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Format class response
   */
  private formatClassResponse(classDoc: any): IClassResponse {
    const absenceSettings = classDoc.absenceSmsSettings
      ? {
          enabled: Boolean(classDoc.absenceSmsSettings.enabled),
          sendAfterTime: classDoc.absenceSmsSettings.sendAfterTime || '11:00',
        }
      : {
          enabled: false,
          sendAfterTime: '11:00',
        };

    return {
      id: classDoc._id.toString(),
      schoolId: classDoc.schoolId.toString(),
      grade: classDoc.grade,
      section: classDoc.section,
      className: classDoc.className,
      academicYear: classDoc.academicYear,
      maxStudents: classDoc.maxStudents,
      currentStudents: classDoc.currentStudents,
      availableSeats: classDoc.getAvailableSeats(),
      isFull: classDoc.isFull(),
      classTeacher: classDoc.classTeacher ? {
        id: classDoc.classTeacher._id.toString(),
        name: classDoc.classTeacher.userId 
          ? `${classDoc.classTeacher.userId.firstName} ${classDoc.classTeacher.userId.lastName}`
          : 'Unknown Teacher',
        teacherId: classDoc.classTeacher.teacherId,
      } : undefined,
      subjects: classDoc.subjects ? classDoc.subjects.map((subject: any) => ({
        id: subject._id.toString(),
        name: subject.name,
        code: subject.code,
      })) : [],
      isActive: classDoc.isActive,
      absenceSmsSettings: absenceSettings,
      createdAt: classDoc.createdAt,
      updatedAt: classDoc.updatedAt,
    };
  }

  /**
   * Normalize absence SMS settings input for creation
   */
  private normalizeAbsenceSmsSettingsForCreate(
    settings?: Partial<IClassAbsenceSmsSettings>
  ): IClassAbsenceSmsSettings | undefined {
    if (!settings) {
      return undefined;
    }

    const normalizedSendTime = settings.sendAfterTime ?? '11:00';

    if (!/^\d{2}:\d{2}$/.test(normalizedSendTime)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Send-after time must be provided in HH:MM format (24-hour clock)'
      );
    }

    return {
      enabled: settings.enabled ?? false,
      sendAfterTime: normalizedSendTime,
    };
  }

  /**
   * Normalize absence SMS settings input for updates
   */
  private normalizeAbsenceSmsSettingsForUpdate(
    settings?: Partial<IClassAbsenceSmsSettings>
  ): Partial<IClassAbsenceSmsSettings> | undefined {
    if (!settings) {
      return undefined;
    }

    const result: Partial<IClassAbsenceSmsSettings> = {};

    if (settings.enabled !== undefined) {
      result.enabled = settings.enabled;
    }

    if (settings.sendAfterTime !== undefined) {
      if (!/^\d{2}:\d{2}$/.test(settings.sendAfterTime)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Send-after time must be provided in HH:MM format (24-hour clock)'
        );
      }
      result.sendAfterTime = settings.sendAfterTime;
    }

    return Object.keys(result).length ? result : undefined;
  }
}

export const classService = new ClassService();
