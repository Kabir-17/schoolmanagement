import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Student } from "../modules/student/student.model";
import { Teacher } from "../modules/teacher/teacher.model";
import { User } from "../modules/user/user.model";
// Accountant model will be dynamically imported to avoid circular dependencies

export interface GeneratedCredentials {
  username: string;
  password: string;
  hashedPassword: string;
  requiresPasswordChange: boolean;
}

export interface StudentIdComponents {
  admissionYear: number;
  grade: string;
  rollNumber: number;
  schoolCode?: string; // Optional for backward compatibility
}

export interface TeacherIdComponents {
  joiningYear: number;
  sequenceNumber: number;
  schoolCode?: string; // Optional for backward compatibility
}

export class CredentialGenerator {
  /**
   * Calculate age from date of birth
   */
  static calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Generate a unique student ID based on admission year, grade, and roll number
   * Format: SCH001-STU-YYYYGG-RRRR (e.g., SCH001-STU-202507-0001 for Grade 7 student)
   * Sequential logic: Students in same grade get consecutive roll numbers
   */
  static async generateUniqueStudentId(
    admissionYear: number,
    grade: string,
    schoolId: string
  ): Promise<{ studentId: string; rollNumber: number }> {
    // Get school information for school code prefix
    const School = (await import('../modules/school/school.model')).School;
    const school = await School.findById(schoolId);
    if (!school) {
      throw new Error('School not found');
    }
    const schoolCode = school.schoolId || 'SCH001'; // Default fallback
    
    // Convert grade to 2-digit number (pad with zero if needed)
    const gradeNumber = grade.toString().padStart(2, "0");

    // Use aggregation to get the next roll number atomically with a more robust query
    const result = await Student.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId),
          admissionYear,
          grade: parseInt(grade), // Ensure grade matching is consistent
          $or: [
            { isDeleted: { $exists: false } },
            { isDeleted: false }
          ]
        },
      },
      {
        $group: {
          _id: null,
          maxRollNumber: { $max: "$rollNumber" },
          count: { $sum: 1 },
          existingRollNumbers: { $push: "$rollNumber" }
        },
      },
    ]);

    let nextRoll = 1;
    let existingRolls: number[] = [];
    
    if (result.length > 0) {
      existingRolls = result[0].existingRollNumbers || [];
      nextRoll = (result[0].maxRollNumber || 0) + 1;
      
      // Find the first available roll number in case of gaps
      for (let i = 1; i <= nextRoll; i++) {
        if (!existingRolls.includes(i)) {
          nextRoll = i;
          break;
        }
      }
    }

    // Try multiple roll numbers to find an available one
    let attempts = 0;
    const maxAttempts = 20; // Check up to 20 consecutive numbers
    
    while (attempts < maxAttempts) {
      const candidateRoll = nextRoll + attempts;
      
      // Format roll number as 4-digit string (0001, 0002, etc.)
      const rollNumberStr = candidateRoll.toString().padStart(4, "0");
      const candidateStudentId = `${schoolCode}-STU-${admissionYear}${gradeNumber}-${rollNumberStr}`;

      // Check uniqueness in both Student and User collections
      const [existingStudent, existingUser] = await Promise.all([
        Student.findOne({
          studentId: candidateStudentId,
          schoolId,
          $or: [
            { isDeleted: { $exists: false } },
            { isDeleted: false }
          ]
        }),
        User.findOne({
          username: { $in: [
            this.generateStudentUsername(candidateStudentId), 
            this.generateParentUsername(candidateStudentId)
          ] },
          $or: [
            { isDeleted: { $exists: false } },
            { isDeleted: false }
          ]
        })
      ]);

      if (!existingStudent && !existingUser) {
        return { studentId: candidateStudentId, rollNumber: candidateRoll };
      }

      attempts++;
    }

    // If we still can't find a unique ID, use timestamp-based approach
    const timestamp = Date.now().toString().slice(-4);
    const timestampRoll = parseInt(timestamp.slice(-2)) + nextRoll;
    const timestampRollStr = timestampRoll.toString().padStart(4, "0");
    const fallbackStudentId = `${schoolCode}-STU-${admissionYear}${gradeNumber}-${timestampRollStr}`;

    return { studentId: fallbackStudentId, rollNumber: timestampRoll };
  }

  /**
   * Validate student ID format
   */
  static validateStudentIdFormat(studentId: string): boolean {
    // Updated to support both old (YYYYGGRRR) and new (SCH001-STU-YYYYGG-RRRR) formats
    const newFormatRegex = /^SCH\d{3,4}-STU-\d{6}-\d{4}$/; // SCH001-STU-YYYYGG-RRRR format
    const oldFormatRegex = /^\d{10}$/; // YYYYGGRRR format (10 digits) - legacy
    return newFormatRegex.test(studentId) || oldFormatRegex.test(studentId);
  }

  /**
   * Parse student ID components
   */
  static parseStudentId(studentId: string): StudentIdComponents {
    if (!this.validateStudentIdFormat(studentId)) {
      throw new Error(
        "Invalid student ID format. Expected: SCH001-STU-YYYYGG-RRRR or YYYYGGRRR"
      );
    }

    // Handle both new and legacy formats
    if (studentId.includes('SCH') && studentId.includes('STU')) {
      // New format: SCH001-STU-YYYYGG-RRRR
      const parts = studentId.split('-');
      const yearGrade = parts[2]; // YYYYGG
      return {
        admissionYear: parseInt(yearGrade.substring(0, 4)),
        grade: yearGrade.substring(4, 6),
        rollNumber: parseInt(parts[3]),
        schoolCode: parts[0]
      };
    } else {
      // Legacy format: YYYYGGRRR
      return {
        admissionYear: parseInt(studentId.substring(0, 4)),
        grade: studentId.substring(4, 6),
        rollNumber: parseInt(studentId.substring(6, 10)),
      };
    }
  }

  /**
   * Generate a secure random password
   */
  static generatePassword(length: number = 8): string {
    const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
    const numberChars = "0123456789";
    const specialChars = "!@#$%&*";

    const allChars =
      uppercaseChars + lowercaseChars + numberChars + specialChars;

    let password = "";

    // Ensure at least one character from each category
    password +=
      uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
    password +=
      lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
    password += numberChars[Math.floor(Math.random() * numberChars.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to randomize positions
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }

  /**
   * Generate username from student ID - optimized for 30 char limit
   * Format: stuSCH001STU202507001 (removes hyphens and shortens prefix)
   */
  static generateStudentUsername(studentId: string): string {
    // Remove hyphens and create compact username: stuSCH001STU202507001
    const compactId = studentId.replace(/-/g, '');
    let username = `stu${compactId}`.toLowerCase();
    
    // Ensure username doesn't exceed 30 characters
    if (username.length > 30) {
      // If still too long, truncate from the end
      username = username.substring(0, 30);
    }
    
    return username;
  }

  /**
   * Generate parent username from student ID - optimized for 30 char limit  
   * Format: parSCH001STU202507001 (removes hyphens and shortens prefix)
   */
  static generateParentUsername(studentId: string): string {
    // Remove hyphens and create compact username: parSCH001STU202507001
    const compactId = studentId.replace(/-/g, '');
    let username = `par${compactId}`.toLowerCase();
    
    // Ensure username doesn't exceed 30 characters
    if (username.length > 30) {
      // If still too long, truncate from the end
      username = username.substring(0, 30);
    }
    
    return username;
  }

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Generate complete credentials for a student
   */
  static async generateStudentCredentials(
    studentId: string
  ): Promise<GeneratedCredentials> {
    const username = this.generateStudentUsername(studentId);
    const password = this.generatePassword();
    const hashedPassword = await this.hashPassword(password);

    return {
      username,
      password,
      hashedPassword,
      requiresPasswordChange: true,
    };
  }

  /**
   * Generate complete credentials for a parent
   */
  static async generateParentCredentials(
    studentId: string
  ): Promise<GeneratedCredentials> {
    const username = this.generateParentUsername(studentId);
    const password = this.generatePassword();
    const hashedPassword = await this.hashPassword(password);

    return {
      username,
      password,
      hashedPassword,
      requiresPasswordChange: true,
    };
  }

  /**
   * Generate credentials for both student and parent using student ID
   */
  static async generateBothCredentials(studentId: string): Promise<{
    student: GeneratedCredentials;
    parent: GeneratedCredentials;
  }> {
    const studentCredentials = await this.generateStudentCredentials(studentId);
    const parentCredentials = await this.generateParentCredentials(studentId);

    return {
      student: studentCredentials,
      parent: parentCredentials,
    };
  }

  /**
   * Generate secure credentials for teacher
   */
  static async generateTeacherCredentials(
    firstName: string,
    lastName: string,
    teacherId: string
  ): Promise<GeneratedCredentials> {
    // Generate username from teacher ID (remove dashes, lowercase)
    const baseUsername = teacherId.replace(/-/g, "").toLowerCase();

    // Ensure username uniqueness
    let username = baseUsername;
    let counter = 1;

    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Generate secure password (teacher ID + random suffix for initial login)
    const randomSuffix = crypto.randomBytes(2).toString("hex").toUpperCase();
    const password = `${teacherId}-${randomSuffix}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    return {
      username,
      password,
      hashedPassword,
      requiresPasswordChange: true,
    };
  }

  /**
   * Check if usernames are available
   */
  static async checkUsernameAvailability(
    usernames: string[]
  ): Promise<boolean> {
    const existingUsers = await User.find({
      username: { $in: usernames },
      isActive: true,
    });

    return existingUsers.length === 0;
  }

  /**
   * Generate complete student registration data including ID and credentials
   */
  static async generateStudentRegistration(
    admissionYear: number,
    grade: string,
    schoolId: string
  ): Promise<{
    studentId: string;
    rollNumber: number;
    credentials: {
      student: GeneratedCredentials;
      parent: GeneratedCredentials;
    };
  }> {
    let attempts = 0;
    const maxAttempts = 10; // Increased attempts
    let lastError: any = null;

    while (attempts < maxAttempts) {
      try {
        attempts++;

        // Generate unique student ID - each attempt gets a fresh ID
        const { studentId, rollNumber } = await this.generateUniqueStudentId(
          admissionYear,
          grade,
          schoolId
        );

        // Generate credentials based on student ID (no modifications)
        const credentials = await this.generateBothCredentials(studentId);

        // Verify usernames are available
        const usernames = [
          credentials.student.username,
          credentials.parent.username,
        ];
        
        const available = await this.checkUsernameAvailability(usernames);

        if (available) {
          return {
            studentId,
            rollNumber,
            credentials,
          };
        }
        
        // If not available, wait before retry with exponential backoff
        const waitTime = Math.min(1000, 100 * Math.pow(2, attempts - 1)) + Math.random() * 100;
        await new Promise(resolve => setTimeout(resolve, waitTime));

      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempts} failed:`, error);
        
        if (attempts === maxAttempts) {
          throw error;
        }
        
        // Wait before retry with exponential backoff
        const waitTime = Math.min(2000, 200 * Math.pow(2, attempts - 1)) + Math.random() * 200;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // If we've exhausted all attempts, throw a descriptive error
    const timestamp = new Date().toISOString();
    const errorMessage = lastError 
      ? `Failed to generate unique credentials after ${maxAttempts} attempts. Last error: ${lastError.message} (${timestamp})`
      : `Failed to generate unique credentials after ${maxAttempts} attempts. Please try again. (${timestamp})`;
    
    throw new Error(errorMessage);
  }

  /**
   * Generate a unique teacher ID and employee ID based on joining year and sequence
   * Format: SCH001-TCH-YYYY-XXX for teacherId and SCH001-EMP-YYYY-XXX for employeeId
   * Sequential logic: Earlier registered teachers get lower sequence numbers
   */
  static async generateUniqueTeacherId(
    joiningYear: number,
    schoolId: string,
    designation?: string
  ): Promise<{
    teacherId: string;
    employeeId: string;
    sequenceNumber: number;
  }> {
    // Get school information for school code prefix
    const School = (await import('../modules/school/school.model')).School;
    const school = await School.findById(schoolId);
    if (!school) {
      throw new Error('School not found');
    }
    const schoolCode = school.schoolId || 'SCH001'; // Default fallback
    
    // Find all existing teachers for this year and school, ordered by registration time
    const existingTeachers = await Teacher.find({
      schoolId,
      joinDate: {
        $gte: new Date(joiningYear, 0, 1),
        $lt: new Date(joiningYear + 1, 0, 1),
      },
      isActive: true,
    })
      .sort({ createdAt: 1 }) // Sort by creation time for sequential order
      .exec();

    let nextSequence = 1;

    if (existingTeachers.length > 0) {
      // For better sequencing, group by similar roles first
      let designationGroup: any[] = [];
      let otherTeachers: any[] = [];

      if (designation) {
        // Separate teachers by designation similarity for contextual grouping
        const seniorRoles = ["Principal", "Vice Principal", "Head Teacher"];
        const teachingRoles = [
          "Senior Teacher",
          "Teacher",
          "Assistant Teacher",
        ];
        const specialRoles = [
          "Subject Coordinator",
          "Sports Teacher",
          "Music Teacher",
          "Art Teacher",
        ];
        const supportRoles = ["Librarian", "Lab Assistant"];

        const getCurrentGroup = (des: string) => {
          if (seniorRoles.includes(des)) return "senior";
          if (teachingRoles.includes(des)) return "teaching";
          if (specialRoles.includes(des)) return "special";
          if (supportRoles.includes(des)) return "support";
          return "other";
        };

        const currentGroup = getCurrentGroup(designation);

        designationGroup = existingTeachers.filter(
          (t) => getCurrentGroup(t.designation) === currentGroup
        );
        otherTeachers = existingTeachers.filter(
          (t) => getCurrentGroup(t.designation) !== currentGroup
        );
      }

      // Extract sequence numbers from all existing teacher IDs
      const allSequences = existingTeachers
        .map((teacher) => {
          // Updated regex pattern to match school-prefixed format: SCH001-TCH-2024-001
          const match = teacher.teacherId.match(new RegExp(`${schoolCode}-TCH-\\d{4}-(\\d{3})`));
          return match ? parseInt(match[1]) : 0;
        })
        .filter((seq) => seq > 0);

      if (allSequences.length > 0) {
        nextSequence = Math.max(...allSequences) + 1;
      }

      // For contextual grouping: if same designation group exists,
      // try to place new teacher close to similar roles
      if (designationGroup.length > 0 && designation) {
        const groupSequences = designationGroup
          .map((teacher) => {
            // Updated regex pattern to match school-prefixed format
            const match = teacher.teacherId.match(new RegExp(`${schoolCode}-TCH-\\d{4}-(\\d{3})`));
            return match ? parseInt(match[1]) : 0;
          })
          .filter((seq) => seq > 0);

        if (groupSequences.length > 0) {
          const maxGroupSeq = Math.max(...groupSequences);
          // Try to assign next sequence after the group
          const candidateSequence = maxGroupSeq + 1;

          // Check if this sequence is available
          const sequenceExists = allSequences.includes(candidateSequence);
          if (!sequenceExists) {
            nextSequence = candidateSequence;
          }
        }
      }
    }

    // Format sequence as 3-digit string (001, 002, etc.)
    const sequenceStr = nextSequence.toString().padStart(3, "0");
    const teacherId = `${schoolCode}-TCH-${joiningYear}-${sequenceStr}`;
    const employeeId = `${schoolCode}-EMP-${joiningYear}-${sequenceStr}`;

    // Double-check uniqueness
    const existingWithId = await Teacher.findOne({
      $or: [{ teacherId }, { employeeId }],
      schoolId,
      isActive: true,
    });

    if (existingWithId) {
      // If somehow this ID exists, recursively try the next number
      return this.generateUniqueTeacherId(joiningYear, schoolId, designation);
    }

    return { teacherId, employeeId, sequenceNumber: nextSequence };
  }

  /**
   * Generate unique accountant ID (similar to teacher ID generation)
   */
  static async generateUniqueAccountantId(
    joiningYear: number,
    schoolId: string,
    designation?: string
  ): Promise<{
    accountantId: string;
    employeeId: string;
    sequenceNumber: number;
  }> {
    // Get school information for school code prefix
    const School = (await import('../modules/school/school.model')).School;
    const school = await School.findById(schoolId);
    if (!school) {
      throw new Error('School not found');
    }
    const schoolCode = school.schoolId || 'SCH001';
    
    // Import Accountant model dynamically to avoid circular dependency
    const { Accountant } = await import('../modules/accountant/accountant.model');
    
    // Find all existing accountants for this year and school
    const existingAccountants = await Accountant.find({
      schoolId,
      joinDate: {
        $gte: new Date(joiningYear, 0, 1),
        $lt: new Date(joiningYear + 1, 0, 1),
      },
      isActive: true,
    })
      .sort({ createdAt: 1 })
      .exec();

    let nextSequence = 1;

    if (existingAccountants.length > 0) {
      const allSequences = existingAccountants
        .map((accountant) => {
          const match = accountant.accountantId.match(new RegExp(`${schoolCode}-ACC-\\d{4}-(\\d{3})`));
          return match ? parseInt(match[1]) : 0;
        })
        .filter((seq) => seq > 0);

      if (allSequences.length > 0) {
        nextSequence = Math.max(...allSequences) + 1;
      }
    }

    const sequenceStr = nextSequence.toString().padStart(3, "0");
    const accountantId = `${schoolCode}-ACC-${joiningYear}-${sequenceStr}`;
    const employeeId = `${schoolCode}-EMP-ACC-${joiningYear}-${sequenceStr}`;

    // Double-check uniqueness
    const existingWithId = await Accountant.findOne({
      $or: [{ accountantId }, { employeeId }],
      schoolId,
      isActive: true,
    });

    if (existingWithId) {
      return this.generateUniqueAccountantId(joiningYear, schoolId, designation);
    }

    return { accountantId, employeeId, sequenceNumber: nextSequence };
  }

  /**
   * Generate accountant credentials (similar to teacher credentials)
   */
  static async generateAccountantCredentials(
    firstName: string,
    lastName: string,
    accountantId: string
  ): Promise<GeneratedCredentials> {
    // Generate username from accountant ID (remove dashes, lowercase)
    const baseUsername = accountantId.replace(/-/g, "").toLowerCase();

    // Ensure username uniqueness
    let username = baseUsername;
    let counter = 1;

    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Generate secure password (accountant ID + random suffix for initial login)
    const randomSuffix = crypto.randomBytes(2).toString("hex").toUpperCase();
    const password = `${accountantId}-${randomSuffix}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    return {
      username,
      password,
      hashedPassword,
      requiresPasswordChange: true,
    };
  }

  /**
   * Validate teacher ID format
   */
  static validateTeacherIdFormat(teacherId: string): boolean {
    // Updated to support both old (TCH-YYYY-XXX) and new (SCH001-TCH-YYYY-XXX) formats
    const newFormatRegex = /^SCH\d{3,4}-TCH-\d{4}-\d{3}$/; // SCH001-TCH-YYYY-XXX format
    const oldFormatRegex = /^TCH-\d{4}-\d{3}$/; // TCH-YYYY-XXX format (legacy)
    return newFormatRegex.test(teacherId) || oldFormatRegex.test(teacherId);
  }

  /**
   * Parse teacher ID components
   */
  static parseTeacherId(teacherId: string): TeacherIdComponents {
    if (!this.validateTeacherIdFormat(teacherId)) {
      throw new Error("Invalid teacher ID format. Expected: SCH001-TCH-YYYY-XXX or TCH-YYYY-XXX");
    }

    // Handle both new and legacy formats
    if (teacherId.includes('SCH')) {
      // New format: SCH001-TCH-YYYY-XXX
      const parts = teacherId.split('-');
      return {
        joiningYear: parseInt(parts[2]), // Year is at index 2
        sequenceNumber: parseInt(parts[3]), // Sequence is at index 3
        schoolCode: parts[0] // School code is at index 0
      };
    } else {
      // Legacy format: TCH-YYYY-XXX
      return {
        joiningYear: parseInt(teacherId.substring(4, 8)),
        sequenceNumber: parseInt(teacherId.substring(9, 12))
      };
    }
  }

  /**
   * Generate a unique parent ID based on registration year and sequence
   * Format: SCH001-PAR-YYYY-XXX for parentId
   * Sequential logic: Earlier registered parents get lower sequence numbers
   */
  static async generateUniqueParentId(
    registrationYear: number,
    schoolId: string
  ): Promise<{
    parentId: string;
    sequenceNumber: number;
  }> {
    // Get school information for school code prefix
    const School = (await import('../modules/school/school.model')).School;
    const school = await School.findById(schoolId);
    if (!school) {
      throw new Error('School not found');
    }
    const schoolCode = school.schoolId || 'SCH001'; // Default fallback
    
    // Find all existing parents for this year and school, ordered by registration time
    const Parent = (await import('../modules/parent/parent.model')).Parent;
    const existingParents = await Parent.find({
      schoolId,
      createdAt: {
        $gte: new Date(registrationYear, 0, 1),
        $lt: new Date(registrationYear + 1, 0, 1),
      },
      isActive: true,
    })
      .sort({ createdAt: 1 }) // Sort by creation time for sequential order
      .exec();

    let nextSequence = 1;

    if (existingParents.length > 0) {
      // Extract sequence numbers from all existing parent IDs
      const allSequences = existingParents
        .map((parent) => {
          // Updated regex pattern to match school-prefixed format: SCH001-PAR-2024-001
          const match = parent.parentId.match(new RegExp(`${schoolCode}-PAR-\\d{4}-(\\d{3})`));
          return match ? parseInt(match[1]) : 0;
        })
        .filter((seq) => seq > 0);

      if (allSequences.length > 0) {
        nextSequence = Math.max(...allSequences) + 1;
      }
    }

    // Format sequence as 3-digit string (001, 002, etc.)
    const sequenceStr = nextSequence.toString().padStart(3, "0");
    const parentId = `${schoolCode}-PAR-${registrationYear}-${sequenceStr}`;

    // Double-check uniqueness
    const existingWithId = await Parent.findOne({
      parentId,
      schoolId,
      isActive: true,
    });

    if (existingWithId) {
      // If somehow this ID exists, recursively try the next number
      return this.generateUniqueParentId(registrationYear, schoolId);
    }

    return { parentId, sequenceNumber: nextSequence };
  }

  /**
   * Generate a unique admin ID based on school
   * Format: SCH001-ADM-001 for adminId
   */
  static async generateUniqueAdminId(
    schoolId: string
  ): Promise<{
    adminId: string;
    sequenceNumber: number;
  }> {
    // Get school information for school code prefix
    const School = (await import('../modules/school/school.model')).School;
    const school = await School.findById(schoolId);
    if (!school) {
      throw new Error('School not found');
    }
    const schoolCode = school.schoolId || 'SCH001'; // Default fallback
    
    // Find all existing admins for this school
    const User = (await import('../modules/user/user.model')).User;
    const existingAdmins = await User.find({
      schoolId,
      role: 'admin',
      isActive: true,
    })
      .sort({ createdAt: 1 }) // Sort by creation time for sequential order
      .exec();

    let nextSequence = 1;

    if (existingAdmins.length > 0) {
      // Since admins don't have a separate adminId field, we'll use a simple counter
      nextSequence = existingAdmins.length + 1;
    }

    // Format sequence as 3-digit string (001, 002, etc.)
    const sequenceStr = nextSequence.toString().padStart(3, "0");
    const adminId = `${schoolCode}-ADM-${sequenceStr}`;

    return { adminId, sequenceNumber: nextSequence };
  }

  /**
   * Format teacher credentials for display
   */
  static formatTeacherCredentials(
    teacherName: string,
    credentials: GeneratedCredentials
  ): CredentialDisplay {
    return {
      type: "teacher" as const,
      name: teacherName,
      username: credentials.username,
      password: credentials.password,
      message: `Login credentials for ${teacherName}. First-time login will require password change.`,
    };
  }
}

/**
 * Calculate age from date of birth - standalone function
 */
export const calculateAge = (dob: Date): number => {
  return CredentialGenerator.calculateAge(dob);
};

/**
 * Format credentials for display to admin
 */
export interface CredentialDisplay {
  type: "student" | "parent" | "teacher";
  name: string;
  username: string;
  password: string;
  message: string;
}

export class CredentialFormatter {
  static formatStudentCredentials(
    studentName: string,
    credentials: GeneratedCredentials
  ): CredentialDisplay {
    return {
      type: "student",
      name: studentName,
      username: credentials.username,
      password: credentials.password,
      message: `Login credentials for student ${studentName}. First-time login will require password change.`,
    };
  }

  static formatParentCredentials(
    parentName: string,
    studentName: string,
    credentials: GeneratedCredentials
  ): CredentialDisplay {
    return {
      type: "parent",
      name: parentName,
      username: credentials.username,
      password: credentials.password,
      message: `Login credentials for ${parentName} (parent of ${studentName}). First-time login will require password change.`,
    };
  }

  static formatBothCredentials(
    studentName: string,
    parentName: string,
    studentCredentials: GeneratedCredentials,
    parentCredentials: GeneratedCredentials
  ): {
    student: CredentialDisplay;
    parent: CredentialDisplay;
  } {
    return {
      student: this.formatStudentCredentials(studentName, studentCredentials),
      parent: this.formatParentCredentials(
        parentName,
        studentName,
        parentCredentials
      ),
    };
  }
}
