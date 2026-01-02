import { Types } from 'mongoose';
import { User } from '../user/user.model';
import { Teacher } from './teacher.model';
import { AppError } from '../../errors/AppError';
import httpStatus from 'http-status';

interface TeacherCredentials {
  teacherId: string;
  username: string;
  password: string;
  temporaryPassword: boolean;
}

interface CredentialsResponse {
  credentials: TeacherCredentials;
  message: string;
}

export class TeacherCredentialsService {
  /**
   * Generate auto credentials for teacher
   */
  static async generateTeacherCredentials(
    teacherId: string,
    firstName: string,
    lastName: string
  ): Promise<TeacherCredentials> {
    // Generate username from teacherId (remove hyphens and make lowercase)
    const username = teacherId.replace(/-/g, '').toLowerCase();
    
    // Use teacherId as temporary password
    const password = teacherId;
    
    return {
      teacherId,
      username,
      password,
      temporaryPassword: true
    };
  }

  /**
   * Save teacher credentials to a storage (could be file, database, etc.)
   * This allows admin to retrieve credentials later
   */
  static async saveTeacherCredentials(
    schoolId: string,
    credentials: TeacherCredentials
  ): Promise<void> {
    try {
      // Here you could save to a separate credentials collection
      // or create a temporary storage mechanism
      
      // For now, we'll add a note in the user record that password needs to be changed
      await User.findOneAndUpdate(
        { username: credentials.username },
        { 
          $set: { 
            passwordChangeRequired: true,
            credentialsGenerated: true,
            credentialsGeneratedAt: new Date()
          }
        }
      );
    } catch (error) {
      console.error('Failed to save teacher credentials:', error);
      // Don't throw error as this is not critical for teacher creation
    }
  }

  /**
   * Get saved credentials for a teacher
   */
  static async getTeacherCredentials(teacherId: string): Promise<CredentialsResponse | null> {
    try {
      const teacher = await Teacher.findOne({ teacherId })
        .populate('userId', 'username firstName lastName displayPassword credentialsGenerated passwordChangeRequired');

      if (!teacher || !teacher.userId) {
        return null;
      }

      const user = teacher.userId as any;
      
      // Always return credentials for admin view, even if not flagged as generated
      return {
        credentials: {
          teacherId,
          username: user.username,
          password: user.displayPassword || teacherId, // Use displayPassword if available
          temporaryPassword: user.passwordChangeRequired !== false
        },
        message: user.credentialsGenerated 
          ? 'These are auto-generated credentials. Teacher should change password on first login.'
          : 'Default credentials based on Teacher ID. Password may have been changed by teacher.'
      };
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to retrieve teacher credentials'
      );
    }
  }

  /**
   * Reset teacher password to default (teacherId)
   */
  static async resetTeacherPassword(teacherId: string): Promise<CredentialsResponse> {
    try {
      const teacher = await Teacher.findOne({ teacherId })
        .populate('userId', 'username displayPassword');

      if (!teacher || !teacher.userId) {
        throw new AppError(httpStatus.NOT_FOUND, 'Teacher not found');
      }

      const user = teacher.userId as any;
      const newPassword = user.displayPassword || teacherId;

      // Reset password to original credentials
      await User.findByIdAndUpdate(teacher.userId, {
        $set: {
          passwordHash: newPassword, // Will be hashed by pre-save middleware
          passwordChangeRequired: true,
          passwordResetAt: new Date()
        }
      });

      return {
        credentials: {
          teacherId,
          username: user.username,
          password: newPassword,
          temporaryPassword: true
        },
        message: 'Password has been reset to the original credentials. Teacher should change password on first login.'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to reset teacher password'
      );
    }
  }

  /**
   * Get all teachers credentials for a school (admin use)
   */
  static async getSchoolTeachersCredentials(schoolId: string): Promise<TeacherCredentials[]> {
    try {
      const teachers = await Teacher.find({ schoolId })
        .populate('userId', 'username firstName lastName credentialsGenerated')
        .select('teacherId userId');

      return teachers
        .filter(teacher => teacher.userId && (teacher.userId as any).credentialsGenerated)
        .map(teacher => {
          const user = teacher.userId as any;
          return {
            teacherId: teacher.teacherId,
            username: user.username,
            password: teacher.teacherId, // Default password
            temporaryPassword: true
          };
        });
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to retrieve school teachers credentials'
      );
    }
  }
}