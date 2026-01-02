import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import config from '../config';

export class FileUtils {
  /**
   * Create directory structure if it doesn't exist
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Generate unique filename to prevent conflicts
   */
  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);

    return `${nameWithoutExt}_${timestamp}_${randomStr}${ext}`;
  }

  /**
   * Create face recognition folder structure for a student
   * Format: /storage/SchoolName/Students/student@firstname@age@grade@section@bloodgroup@admitdate@studentID/
   */
  static async createStudentPhotoFolder(
    schoolName: string,
    studentInfo: {
      firstName: string;
      age: number;
      grade: number;
      section: string;
      bloodGroup: string;
      admitDate: string;
      studentId: string;
    }
  ): Promise<string> {
    // Clean school name for folder path
    const cleanSchoolName = schoolName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');

    // Create folder name with required format
    const folderName = `student@${studentInfo.firstName}@${studentInfo.age}@${studentInfo.grade}@${studentInfo.section}@${studentInfo.bloodGroup}@${studentInfo.studentId}`;
    
    // Build full path
    const baseStoragePath = path.resolve(config.upload_path);
    const schoolPath = path.join(baseStoragePath, cleanSchoolName);
    const studentsPath = path.join(schoolPath, 'Students');
    const studentFolderPath = path.join(studentsPath, folderName);

    // Ensure directory exists
    await this.ensureDirectory(studentFolderPath);

    return studentFolderPath;
  }

  /**
   * Create face recognition folder structure for a teacher
   * Format: /storage/SchoolName/Teachers/teacher@firstname@age@bloodgroup@joindate@teacherID/
   */
  static async createTeacherPhotoFolder(
    schoolName: string,
    teacherInfo: {
      firstName: string;
      age: number;
      bloodGroup: string;
      joinDate: string;
      teacherId: string;
    }
  ): Promise<string> {
    // Clean school name for folder path
    const cleanSchoolName = schoolName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');

    // Create folder name with required format
    const folderName = `teacher@${teacherInfo.firstName}@${teacherInfo.age}@${teacherInfo.bloodGroup}@${teacherInfo.joinDate}@${teacherInfo.teacherId}`;

    // Build full path
    const baseStoragePath = path.resolve(config.upload_path);
    const schoolPath = path.join(baseStoragePath, cleanSchoolName);
    const teachersPath = path.join(schoolPath, 'Teachers');
    const teacherFolderPath = path.join(teachersPath, folderName);

    // Ensure directory exists
    await this.ensureDirectory(teacherFolderPath);

    return teacherFolderPath;
  }

  /**
   * Create photo folder for accountant with required naming structure
   */
  static async createAccountantPhotoFolder(
    schoolName: string,
    accountantInfo: {
      firstName: string;
      age: number;
      bloodGroup: string;
      joinDate: string;
      accountantId: string;
    }
  ): Promise<string> {
    // Clean school name for folder path
    const cleanSchoolName = schoolName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');

    // Create folder name with required format
    const folderName = `accountant@${accountantInfo.firstName}@${accountantInfo.age}@${accountantInfo.bloodGroup}@${accountantInfo.joinDate}@${accountantInfo.accountantId}`;

    // Build full path
    const baseStoragePath = path.resolve(config.upload_path);
    const schoolPath = path.join(baseStoragePath, cleanSchoolName);
    const accountantsPath = path.join(schoolPath, 'Accountants');
    const accountantFolderPath = path.join(accountantsPath, folderName);

    // Ensure directory exists
    await this.ensureDirectory(accountantFolderPath);

    return accountantFolderPath;
  }

  /**
   * Save uploaded file to specific directory with numbered naming
   */
  static async savePhotoWithNumber(
    file: Express.Multer.File,
    targetDirectory: string,
    photoNumber: number
  ): Promise<{
    filename: string;
    filepath: string;
    relativePath: string;
  }> {
    // Ensure directory exists
    await this.ensureDirectory(targetDirectory);

    // Generate filename with photo number
    const ext = path.extname(file.originalname);
    const filename = `${photoNumber}${ext}`;
    const filepath = path.join(targetDirectory, filename);

    // Save file
    await fs.writeFile(filepath, file.buffer);

    // Calculate relative path from storage root
    const baseStoragePath = path.resolve(config.upload_path);
    const relativePath = path.relative(baseStoragePath, filepath);

    return {
      filename,
      filepath,
      relativePath: relativePath.replace(/\\/g, '/'), // Normalize path separators
    };
  }

  /**
   * Delete file from filesystem
   */
  static async deleteFile(filepath: string): Promise<void> {
    try {
      await fs.unlink(filepath);
    } catch (error) {
      // File might not exist, which is fine for deletion
      console.warn(`Failed to delete file: ${filepath}`, error);
    }
  }

  /**
   * Delete entire folder and its contents
   */
  static async deleteFolder(folderPath: string): Promise<void> {
    try {
      await fs.rm(folderPath, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to delete folder: ${folderPath}`, error);
    }
  }

  /**
   * Validate image file
   */
  static validateImageFile(file: Express.Multer.File): {
    isValid: boolean;
    error?: string;
  } {
    // Check file size
    if (file.size > config.max_file_size) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${config.max_file_size} bytes`,
      };
    }

    // Check mimetype
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: 'Only JPEG and PNG images are allowed',
      };
    }

    // Check if file has content
    if (!file.buffer || file.buffer.length === 0) {
      return {
        isValid: false,
        error: 'File appears to be empty',
      };
    }

    return { isValid: true };
  }

  /**
   * Get file stats (size, type, etc.)
   */
  static async getFileStats(filepath: string): Promise<{
    exists: boolean;
    size?: number;
    isFile?: boolean;
    isDirectory?: boolean;
    mtime?: Date;
  }> {
    try {
      const stats = await fs.stat(filepath);
      return {
        exists: true,
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        mtime: stats.mtime,
      };
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Count files in a directory
   */
  static async countFilesInDirectory(dirPath: string): Promise<number> {
    try {
      const files = await fs.readdir(dirPath);
      let count = 0;

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          count++;
        }
      }

      return count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get available photo numbers for a student (1-20)
   */
  static async getAvailablePhotoNumbers(studentFolderPath: string): Promise<number[]> {
    const availableNumbers: number[] = [];

    for (let i = 1; i <= config.max_photos_per_student; i++) {
      const jpgPath = path.join(studentFolderPath, `${i}.jpg`);
      const pngPath = path.join(studentFolderPath, `${i}.png`);

      const jpgExists = await this.getFileStats(jpgPath);
      const pngExists = await this.getFileStats(pngPath);

      if (!jpgExists.exists && !pngExists.exists) {
        availableNumbers.push(i);
      }
    }

    return availableNumbers;
  }
}