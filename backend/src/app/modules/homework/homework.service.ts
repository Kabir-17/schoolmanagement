import { Types } from 'mongoose';
import { Homework, HomeworkSubmission } from './homework.model';
import {
  ICreateHomeworkRequest,
  IUpdateHomeworkRequest,
  ISubmitHomeworkRequest,
  IHomeworkResponse,
  IHomeworkSubmissionResponse,
  IHomeworkFilters,
  IHomeworkCalendar,
  IHomeworkAnalytics,
  IHomeworkSubmissionStats,
  IHomeworkDocument,
  IHomeworkSubmissionDocument,
} from './homework.interface';
import { AppError } from '../../errors/AppError';
import { Student } from '../student/student.model';
import { Teacher } from '../teacher/teacher.model';
import { Subject } from '../subject/subject.model';
import { School } from '../school/school.model';
import { 
     //validatePhotoUpload,
     uploadToCloudinary } from '../../utils/cloudinaryUtils';

class HomeworkService {
  // Create homework
  async createHomework(data: ICreateHomeworkRequest, teacherId: string, attachments?: Express.Multer.File[]): Promise<IHomeworkResponse> {
    // Verify teacher has permission to create homework for this school
    const teacher = await Teacher.findById(data.teacherId).populate('schoolId');
    if (!teacher || teacher.id !== teacherId) {
      throw new AppError(403, 'Not authorized to create homework for this teacher');
    }

    // Verify subject exists and teacher teaches it
    const subject = await Subject.findById(data.subjectId);
    if (!subject) {
      throw new AppError(404, 'Subject not found');
    }

    // Upload attachments to Cloudinary if provided
    let attachmentUrls: string[] = [];
    if (attachments && attachments.length > 0) {
      // Validate file count
      if (attachments.length > 5) {
        throw new AppError(400, 'Maximum 5 attachments allowed per homework');
      }

      try {
        for (const file of attachments) {
          const uploadResult = await uploadToCloudinary(file.buffer, {
            folder: 'homework-attachments',
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true,
          });
          attachmentUrls.push(uploadResult.secure_url);
        }
      } catch (error) {
        throw new AppError(500, 'Failed to upload attachments');
      }
    }

    // Create homework
    const homeworkData = {
      ...data,
      schoolId: new Types.ObjectId(data.schoolId),
      teacherId: new Types.ObjectId(data.teacherId),
      subjectId: new Types.ObjectId(data.subjectId),
      classId: data.classId ? new Types.ObjectId(data.classId) : undefined,
      assignedDate: new Date(data.assignedDate),
      dueDate: new Date(data.dueDate),
      attachments: attachmentUrls,
      isPublished: false, // Default to unpublished
    };

    const homework = await Homework.create(homeworkData);
    return this.formatHomeworkResponse(homework);
  }

  // Get homework by ID
  async getHomeworkById(id: string, userId: string, userRole: string): Promise<IHomeworkResponse> {
    const homework = await Homework.findById(id)
      .populate('teacherId', 'userId teacherId')
      .populate('subjectId', 'name code')
      .populate('schoolId', 'name');

    if (!homework) {
      throw new AppError(404, 'Homework not found');
    }

    // Check permissions based on role
    if (userRole === 'teacher') {
      const teacher = await Teacher.findOne({ userId });
      if (!teacher || homework.teacherId.toString() !== teacher._id.toString()) {
        throw new AppError(403, 'Not authorized to view this homework');
      }
    } else if (userRole === 'student') {
      const student = await Student.findOne({ userId });
      if (!student || homework.schoolId.toString() !== student.schoolId.toString() ||
          homework.grade !== student.grade || 
          (homework.section && homework.section !== student.section)) {
        throw new AppError(403, 'Not authorized to view this homework');
      }
    }

    const formattedHomework = this.formatHomeworkResponse(homework);

    // Add submission stats for teachers
    if (userRole === 'teacher') {
      formattedHomework.submissionStats = await homework.getSubmissionStats();
    }

    // Add student's submission if student is viewing
    if (userRole === 'student') {
      const student = await Student.findOne({ userId });
      if (student) {
        const submission = await HomeworkSubmission.findOne({
          homeworkId: homework._id,
          studentId: student._id,
        });
        if (submission) {
          formattedHomework.mySubmission = this.formatSubmissionResponse(submission);
        }
      }
    }

    return formattedHomework;
  }

  // Update homework
  async updateHomework(
    id: string,
    data: IUpdateHomeworkRequest,
    userId: string,
    newAttachments?: Express.Multer.File[]
  ): Promise<IHomeworkResponse> {
    const homework = await Homework.findById(id);
    if (!homework) {
      throw new AppError(404, 'Homework not found');
    }

    // Verify teacher owns this homework
    const teacher = await Teacher.findOne({ userId });
    if (!teacher || homework.teacherId.toString() !== teacher._id.toString()) {
      throw new AppError(403, 'Not authorized to update this homework');
    }

    // Don't allow updating if submissions exist and homework is published
    if (homework.isPublished) {
      const submissionCount = await HomeworkSubmission.countDocuments({ homeworkId: id });
      if (submissionCount > 0 && (data.totalMarks || data.passingMarks || data.dueDate)) {
        throw new AppError(400, 'Cannot update critical fields when submissions exist');
      }
    }

    // Upload new attachments if provided
    let newAttachmentUrls: string[] = [];
    if (newAttachments && newAttachments.length > 0) {
      try {
        for (const file of newAttachments) {
          const uploadResult = await uploadToCloudinary(file.buffer, {
            folder: 'homework-attachments',
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true,
          });
          newAttachmentUrls.push(uploadResult.secure_url);
        }
        
        // Add new attachments to existing ones
        const existingAttachments = homework.attachments || [];
        data.attachments = [...existingAttachments, ...newAttachmentUrls];
      } catch (error) {
        throw new AppError(500, 'Failed to upload attachments');
      }
    }

    // Update homework
    const updateData = { ...data };
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate) as any;
    }

    const updatedHomework = await Homework.findByIdAndUpdate(id, updateData, { new: true })
      .populate('teacherId', 'userId teacherId')
      .populate('subjectId', 'name code')
      .populate('schoolId', 'name');

    if (!updatedHomework) {
      throw new AppError(404, 'Homework not found after update');
    }

    return this.formatHomeworkResponse(updatedHomework);
  }

  // Delete homework
  async deleteHomework(id: string, userId: string): Promise<void> {
    const homework = await Homework.findById(id);
    if (!homework) {
      throw new AppError(404, 'Homework not found');
    }

    // Verify teacher owns this homework
    const teacher = await Teacher.findOne({ userId });
    if (!teacher || homework.teacherId.toString() !== teacher._id.toString()) {
      throw new AppError(403, 'Not authorized to delete this homework');
    }

    // Check if submissions exist
    const submissionCount = await HomeworkSubmission.countDocuments({ homeworkId: id });
    if (submissionCount > 0) {
      throw new AppError(400, 'Cannot delete homework with existing submissions');
    }

    await Homework.findByIdAndDelete(id);
  }

  // Publish homework
  async publishHomework(id: string, userId: string): Promise<IHomeworkResponse> {
    const homework = await Homework.findById(id);
    if (!homework) {
      throw new AppError(404, 'Homework not found');
    }

    // Verify teacher owns this homework
    const teacher = await Teacher.findOne({ userId });
    if (!teacher || homework.teacherId.toString() !== teacher._id.toString()) {
      throw new AppError(403, 'Not authorized to publish this homework');
    }

    homework.isPublished = true;
    await homework.save();

    const updatedHomework = await Homework.findById(id)
      .populate('teacherId', 'userId teacherId')
      .populate('subjectId', 'name code')
      .populate('schoolId', 'name');

    return this.formatHomeworkResponse(updatedHomework!);
  }

  // Get homework for teacher
  async getHomeworkForTeacher(teacherId: string, filters?: IHomeworkFilters): Promise<IHomeworkResponse[]> {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new AppError(404, 'Teacher not found');
    }

    const homework = await Homework.findByTeacher(teacherId);
    
    // Sort by createdAt/updatedAt (newest first) as requested
    const sortedHomework = homework.sort((a, b) => {
      const aDate = a.updatedAt || a.createdAt || new Date(0);
      const bDate = b.updatedAt || b.createdAt || new Date(0);
      return bDate.getTime() - aDate.getTime();
    });
    
    return sortedHomework.map(hw => this.formatHomeworkResponse(hw));
  }

  // Get homework for student
  async getHomeworkForStudent(studentId: string, filters?: IHomeworkFilters): Promise<IHomeworkResponse[]> {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    const homework = await Homework.findByStudent(studentId);
    
    // Add submission status for each homework
    const homeworkWithSubmissions = await Promise.all(
      homework.map(async (hw) => {
        const formatted = this.formatHomeworkResponse(hw);
        const submission = await HomeworkSubmission.findOne({
          homeworkId: hw._id,
          studentId: student._id,
        });
        if (submission) {
          formatted.mySubmission = this.formatSubmissionResponse(submission);
        }
        return formatted;
      })
    );

    return homeworkWithSubmissions;
  }

  // Get homework for class
  async getHomeworkForClass(
    schoolId: string,
    grade: number,
    section?: string,
    filters?: IHomeworkFilters
  ): Promise<IHomeworkResponse[]> {
    const homework = await Homework.findByClass(schoolId, grade, section);
    return homework.map(hw => this.formatHomeworkResponse(hw));
  }

  // Submit homework
  async submitHomework(data: ISubmitHomeworkRequest, userId: string): Promise<IHomeworkSubmissionResponse> {
    // Verify student
    const student = await Student.findOne({ userId });
    if (!student || student._id.toString() !== data.studentId) {
      throw new AppError(403, 'Not authorized to submit homework for this student');
    }

    // Verify homework exists
    const homework = await Homework.findById(data.homeworkId);
    if (!homework) {
      throw new AppError(404, 'Homework not found');
    }

    // Check if homework is published and can be submitted
    if (!homework.canSubmit()) {
      throw new AppError(400, 'Homework cannot be submitted at this time');
    }

    // Check if submission already exists
    const existingSubmission = await HomeworkSubmission.findOne({
      homeworkId: data.homeworkId,
      studentId: data.studentId,
    });

    if (existingSubmission) {
      throw new AppError(400, 'Homework already submitted');
    }

    // Validate group members for group work
    if (homework.isGroupWork && data.groupMembers) {
      if (data.groupMembers.length > homework.maxGroupSize!) {
        throw new AppError(400, `Group size cannot exceed ${homework.maxGroupSize} members`);
      }

      // Verify all group members are in same class
      const groupMembers = await Student.find({
        _id: { $in: data.groupMembers },
        schoolId: student.schoolId,
        grade: student.grade,
        section: student.section,
        isActive: true,
      });

      if (groupMembers.length !== data.groupMembers.length) {
        throw new AppError(400, 'All group members must be from the same class');
      }
    }

    // Create submission
    const submissionData = {
      homeworkId: new Types.ObjectId(data.homeworkId),
      studentId: new Types.ObjectId(data.studentId),
      groupMembers: data.groupMembers?.map(id => new Types.ObjectId(id)),
      submissionText: data.submissionText,
      attachments: data.attachments,
      submittedAt: new Date(),
    };

    const submission = await HomeworkSubmission.create(submissionData);
    return this.formatSubmissionResponse(submission);
  }

  // Grade homework submission
  async gradeHomeworkSubmission(
    submissionId: string,
    marksObtained: number,
    feedback?: string,
    teacherComments?: string,
    userId?: string
  ): Promise<IHomeworkSubmissionResponse> {
    const submission = await HomeworkSubmission.findById(submissionId)
      .populate('homeworkId')
      .populate('studentId');

    if (!submission) {
      throw new AppError(404, 'Homework submission not found');
    }

    const homework = submission.homeworkId as any;

    // Verify teacher can grade this submission
    if (userId) {
      const teacher = await Teacher.findOne({ userId });
      if (!teacher || homework.teacherId.toString() !== teacher._id.toString()) {
        throw new AppError(403, 'Not authorized to grade this submission');
      }
      submission.gradedBy = teacher.userId as any;
    }

    // Validate marks
    if (marksObtained > homework.totalMarks) {
      throw new AppError(400, 'Marks obtained cannot exceed total marks');
    }

    // Update submission
    submission.marksObtained = marksObtained;
    submission.feedback = feedback;
    submission.teacherComments = teacherComments;
    submission.status = 'graded';
    submission.gradedAt = new Date();

    await submission.save();

    return this.formatSubmissionResponse(submission);
  }

  // Get homework submissions for teacher
  async getHomeworkSubmissions(homeworkId: string, userId: string): Promise<IHomeworkSubmissionResponse[]> {
    // Verify homework exists and teacher owns it
    const homework = await Homework.findById(homeworkId);
    if (!homework) {
      throw new AppError(404, 'Homework not found');
    }

    const teacher = await Teacher.findOne({ userId });
    if (!teacher || homework.teacherId.toString() !== teacher._id.toString()) {
      throw new AppError(403, 'Not authorized to view submissions for this homework');
    }

    const submissions = await HomeworkSubmission.find({ homeworkId })
      .populate('studentId', 'userId studentId rollNumber')
      .populate('groupMembers', 'userId studentId rollNumber')
      .sort({ submittedAt: -1 });

    return submissions.map(submission => this.formatSubmissionResponse(submission));
  }

  // Get homework calendar
  async getHomeworkCalendar(
    schoolId: string,
    startDate: string,
    endDate: string,
    grade?: number,
    section?: string
  ): Promise<IHomeworkCalendar> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get homework in date range
    const query: any = {
      schoolId,
      isPublished: true,
      dueDate: { $gte: start, $lte: end },
    };

    if (grade) query.grade = grade;
    if (section) query.section = section;

    const homework = await Homework.find(query)
      .populate('teacherId', 'userId teacherId')
      .populate('subjectId', 'name code')
      .sort({ dueDate: 1 });

    // Group homework by date
    const homeworkByDate: { [key: string]: IHomeworkResponse[] } = {};
    
    homework.forEach(hw => {
      const dateKey = hw.dueDate.toISOString().split('T')[0];
      if (!homeworkByDate[dateKey]) {
        homeworkByDate[dateKey] = [];
      }
      homeworkByDate[dateKey].push(this.formatHomeworkResponse(hw));
    });

    // Convert to calendar format
    const calendarData: Array<{ date: Date; homework: IHomeworkResponse[] }> = [];
    Object.entries(homeworkByDate).forEach(([date, homeworkList]) => {
      calendarData.push({
        date: new Date(date),
        homework: homeworkList,
      });
    });

    // Generate summary statistics
    const totalHomework = homework.length;
    const now = new Date();
    
    const overdueCount = homework.filter(hw => hw.dueDate < now).length;
    const dueTodayCount = homework.filter(hw => hw.isDueToday()).length;
    const upcomingCount = homework.filter(hw => hw.dueDate > now).length;

    const byPriority = this.groupBy(homework, 'priority');
    const byType = this.groupBy(homework, 'homeworkType');

    return {
      startDate: start,
      endDate: end,
      grade,
      section,
      homework: calendarData,
      summary: {
        totalHomework,
        overdueCount,
        dueTodayCount,
        upcomingCount,
        byPriority: Object.entries(byPriority).map(([priority, count]) => ({ priority, count })),
        bySubject: [], // Would need to populate subject data
        byType: Object.entries(byType).map(([homeworkType, count]) => ({ homeworkType, count })),
      },
    };
  }

  // Request revision
  async requestRevision(submissionId: string, reason: string, userId: string): Promise<IHomeworkSubmissionResponse> {
    const submission = await HomeworkSubmission.findById(submissionId)
      .populate('homeworkId')
      .populate('studentId');

    if (!submission) {
      throw new AppError(404, 'Homework submission not found');
    }

    // Verify teacher can request revision
    const homework = submission.homeworkId as any;
    const teacher = await Teacher.findOne({ userId });
    if (!teacher || homework.teacherId.toString() !== teacher._id.toString()) {
      throw new AppError(403, 'Not authorized to request revision for this submission');
    }

    // Update revision status
    submission.revision = {
      requested: true,
      requestedAt: new Date(),
      reason,
      completed: false,
    };
    submission.status = 'returned';

    await submission.save();

    return this.formatSubmissionResponse(submission);
  }

  // Helper method to format homework response
  private formatHomeworkResponse(homework: IHomeworkDocument): IHomeworkResponse {
    const formatted = homework.toJSON() as any;
    
    // Add populated data if available
    if (homework.schoolId && typeof homework.schoolId === 'object') {
      formatted.school = {
        id: homework.schoolId._id.toString(),
        name: (homework.schoolId as any).name,
      };
    }

    if (homework.teacherId && typeof homework.teacherId === 'object') {
      const teacher = homework.teacherId as any;
      formatted.teacher = {
        id: teacher._id.toString(),
        userId: teacher.userId?.toString(),
        teacherId: teacher.teacherId,
        fullName: teacher.userId ? `${teacher.userId.firstName} ${teacher.userId.lastName}` : 'Unknown Teacher',
      };
    }

    if (homework.subjectId && typeof homework.subjectId === 'object') {
      const subject = homework.subjectId as any;
      formatted.subject = {
        id: subject._id.toString(),
        name: subject.name,
        code: subject.code,
      };
    }

    return formatted;
  }

  // Helper method to format submission response
  private formatSubmissionResponse(submission: IHomeworkSubmissionDocument): IHomeworkSubmissionResponse {
    const formatted = submission.toJSON() as any;

    // Add populated data if available
    if (submission.studentId && typeof submission.studentId === 'object') {
      const student = submission.studentId as any;
      formatted.student = {
        id: student._id.toString(),
        userId: student.userId?.toString(),
        studentId: student.studentId,
        fullName: student.userId ? `${student.userId.firstName} ${student.userId.lastName}` : 'Unknown Student',
        rollNumber: student.rollNumber,
      };
    }

    if (submission.groupMembers && submission.groupMembers.length > 0) {
      formatted.groupMemberDetails = submission.groupMembers
        .filter((member: any) => typeof member === 'object')
        .map((member: any) => ({
          id: member._id.toString(),
          fullName: member.userId ? `${member.userId.firstName} ${member.userId.lastName}` : 'Unknown Student',
          rollNumber: member.rollNumber,
        }));
    }

    return formatted;
  }

  // Helper method to group data
  private groupBy(array: any[], key: string): { [key: string]: number } {
    return array.reduce((result, item) => {
      const group = item[key];
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }
}

export const homeworkService = new HomeworkService();