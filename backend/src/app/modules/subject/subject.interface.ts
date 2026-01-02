import { Document, Types, Model } from 'mongoose';

export interface ISubject {
  schoolId: Types.ObjectId;
  name: string;
  code: string; // Subject code (e.g., MATH, ENG, SCI)
  description?: string;
  grades: number[]; // Grades where this subject is taught
  isCore: boolean; // Core subject vs elective
  credits?: number; // Credit points for the subject
  teachers: Types.ObjectId[]; // Teachers who can teach this subject
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISubjectDocument extends ISubject, Document {
  _id: Types.ObjectId;
}

export interface ISubjectMethods {
  getTeacherCount(): number;
  isOfferedInGrade(grade: number): boolean;
}

export interface ISubjectModel extends Model<ISubjectDocument> {
  findBySchool(schoolId: string): Promise<ISubjectDocument[]>;
  findByGrade(schoolId: string, grade: number): Promise<ISubjectDocument[]>;
  findByTeacher(teacherId: string): Promise<ISubjectDocument[]>;
}

export interface ICreateSubjectRequest {
  schoolId: string;
  name: string;
  code: string;
  description?: string;
  grades: number[];
  isCore: boolean;
  credits?: number;
  teachers?: string[];
}

export interface IUpdateSubjectRequest {
  name?: string;
  code?: string;
  description?: string;
  grades?: number[];
  isCore?: boolean;
  credits?: number;
  teachers?: string[];
  isActive?: boolean;
}

export interface ISubjectResponse {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  description?: string;
  grades: number[];
  isCore: boolean;
  credits?: number;
  teacherCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  teachers?: {
    id: string;
    teacherId: string;
    fullName: string;
    designation: string;
  }[];
  school?: {
    id: string;
    name: string;
  };
}