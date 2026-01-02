import { Document, Types, Model } from "mongoose";

export interface ITeacher {
  userId: Types.ObjectId;
  schoolId: Types.ObjectId;
  teacherId: string; // Auto-generated unique ID (e.g., SCH001-TCH-2025-001)
  employeeId?: string; // Custom employee ID
  subjects: string[]; // Subjects the teacher teaches
  grades: number[]; // Grades the teacher handles
  sections: string[]; // Sections assigned to the teacher
  designation: string; // Head Teacher, Assistant Teacher, etc.
  bloodGroup: string;
  dob: Date;
  joinDate: Date;
  qualifications: {
    degree: string;
    institution: string;
    year: number;
    specialization?: string;
  }[];
  experience: {
    totalYears: number;
    previousSchools?: {
      schoolName: string;
      position: string;
      duration: string;
      fromDate: Date;
      toDate: Date;
    }[];
  };
  address: {
    street?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  salary?: {
    basic: number;
    allowances?: number;
    deductions?: number;
    netSalary: number;
  };
  isClassTeacher: boolean; // Is this teacher a class teacher for any section?
  classTeacherFor?: {
    grade: number;
    section: string;
  };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITeacherDocument extends ITeacher, Document {
  _id: Types.ObjectId;
}

export interface ITeacherPhoto {
  teacherId: Types.ObjectId;
  schoolId: Types.ObjectId;
  photoPath: string;
  photoNumber: number; // 1-20
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  createdAt?: Date;
}

export interface ITeacherPhotoDocument extends ITeacherPhoto, Document {
  _id: Types.ObjectId;
}

export interface ITeacherMethods {
  generateTeacherId(): string;
  getAgeInYears(): number;
  getFullName(): string;
  getFolderPath(): string; // For face recognition folder structure
  canUploadMorePhotos(): Promise<boolean>;
  getTotalExperience(): number;
  getNetSalary(): number;
}

export interface ITeacherModel extends Model<ITeacherDocument> {
  findBySchool(schoolId: string): Promise<ITeacherDocument[]>;
  findBySubject(schoolId: string, subject: string): Promise<ITeacherDocument[]>;
  findByGrade(schoolId: string, grade: number): Promise<ITeacherDocument[]>;
  findClassTeachers(schoolId: string): Promise<ITeacherDocument[]>;
  findByTeacherId(teacherId: string): Promise<ITeacherDocument | null>;
  generateNextTeacherId(schoolId: string, year?: number): Promise<string>;
}

// Request/Response interfaces
export interface ICreateTeacherRequest {
  schoolId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  subjects: string[];
  grades: number[];
  sections: string[];
  designation: string;
  bloodGroup: string;
  dob: string; // ISO date string
  joinDate?: string; // ISO date string, defaults to today
  qualifications: {
    degree: string;
    institution: string;
    year: number;
    specialization?: string;
  }[];
  experience: {
    totalYears: number;
    previousSchools?: {
      schoolName: string;
      position: string;
      duration: string;
      fromDate: string;
      toDate: string;
    }[];
  };
  address: {
    street?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  salary?: {
    basic: number;
    allowances?: number;
    deductions?: number;
  };
  isClassTeacher?: boolean;
  classTeacherFor?: {
    grade: number;
    section: string;
  };
  isActive?: boolean;
}

export interface IUpdateTeacherRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dob?: string;
  joinDate?: string;
  employeeId?: string;
  subjects?: string[];
  grades?: number[];
  sections?: string[];
  designation?: string;
  bloodGroup?: string;
  qualifications?: {
    degree: string;
    institution: string;
    year: number;
    specialization?: string;
  }[];
  experience?: {
    totalYears: number;
    previousSchools?: {
      schoolName: string;
      position: string;
      duration: string;
      fromDate: string;
      toDate: string;
    }[];
  };
  address?: {
    street?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  salary?: {
    basic: number;
    allowances?: number;
    deductions?: number;
    netSalary?: number;
  };
  isClassTeacher?: boolean;
  classTeacherFor?: {
    grade: number;
    section: string;
  };
  isActive?: boolean;
}

export interface ITeacherResponse {
  id: string;
  userId: string;
  schoolId: string;
  teacherId: string;
  employeeId?: string;
  subjects: string[];
  grades: number[];
  sections: string[];
  designation: string;
  bloodGroup: string;
  dob: Date;
  joinDate: Date;
  qualifications: {
    degree: string;
    institution: string;
    year: number;
    specialization?: string;
  }[];
  experience: {
    totalYears: number;
    previousSchools?: {
      schoolName: string;
      position: string;
      duration: string;
      fromDate: Date;
      toDate: Date;
    }[];
  };
  address: {
    street?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  salary?: {
    basic: number;
    allowances?: number;
    deductions?: number;
    netSalary: number;
  };
  isClassTeacher: boolean;
  classTeacherFor?: {
    grade: number;
    section: string;
  };
  isActive: boolean;
  age: number;
  totalExperience: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email?: string;
    phone?: string;
  };
  school?: {
    id: string;
    name: string;
  };
  photos?: ITeacherPhotoResponse[];
  photoCount: number;
  credentials?: {
    username: string;
    password: string;
    message: string;
  };
}

export interface ITeacherPhotoResponse {
  id: string;
  photoPath: string;
  photoNumber: number;
  filename: string;
  size: number;
  createdAt: Date;
}

export interface ITeacherStats {
  totalTeachers: number;
  activeTeachers: number;
  classTeachers: number;
  byDesignation: Array<{
    designation: string;
    count: number;
  }>;
  bySubject: Array<{
    subject: string;
    count: number;
  }>;
  byExperience: Array<{
    experienceRange: string;
    count: number;
  }>;
  recentJoining: number; // Last 30 days
}
