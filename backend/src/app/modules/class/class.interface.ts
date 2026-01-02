import { Document, Types, Model } from 'mongoose';

export interface IClass {
  schoolId: Types.ObjectId;
  grade: number;
  section: string;
  className: string; // e.g., "Grade 7 - Section A"
  academicYear: string;
  maxStudents: number;
  currentStudents: number;
  classTeacher?: Types.ObjectId; // Primary class teacher
  subjects: Types.ObjectId[]; // Assigned subjects
  schedule?: Types.ObjectId; // Reference to schedule
  isActive: boolean;
  absenceSmsSettings?: IClassAbsenceSmsSettings;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IClassDocument extends IClass, Document, IClassMethods {
  _id: Types.ObjectId;
}

export interface IClassMethods {
  getClassName(): string;
  isFull(): boolean;
  canAddStudents(count?: number): boolean;
  getAvailableSeats(): number;
  getStudentCount(): Promise<number>;
  updateStudentCount(): Promise<void>;
  getNextSection(): string;
  addStudent(studentId: string): Promise<void>;
  removeStudent(studentId: string): Promise<void>;
}

export interface IClassModel extends Model<IClassDocument> {
  findBySchool(schoolId: string): Promise<IClassDocument[]>;
  findByGrade(schoolId: string, grade: number): Promise<IClassDocument[]>;
  findByAcademicYear(schoolId: string, academicYear: string): Promise<IClassDocument[]>;
  findByGradeAndSection(schoolId: string, grade: number, section: string): Promise<IClassDocument | null>;
  createClassWithAutoSection(schoolId: string, grade: number, maxStudents: number, academicYear: string): Promise<IClassDocument>;
  getClassStats(schoolId: string): Promise<IClassStats>;
  checkCapacityForGrade(schoolId: string, grade: number): Promise<ICapacityCheck>;
  createNewSectionIfNeeded(schoolId: string, grade: number, academicYear: string): Promise<IClassDocument | null>;
}

// Request/Response interfaces
export interface ICreateClassRequest {
  grade: number;
  section?: string; // Optional, will auto-generate if not provided
  maxStudents?: number;
  academicYear: string;
  classTeacher?: string;
  subjects?: string[];
  absenceSmsSettings?: Partial<IClassAbsenceSmsSettings>;
}

export interface IUpdateClassRequest {
  maxStudents?: number;
  classTeacher?: string;
  subjects?: string[];
  isActive?: boolean;
  absenceSmsSettings?: Partial<IClassAbsenceSmsSettings>;
}

export interface IClassResponse {
  id: string;
  schoolId: string;
  grade: number;
  section: string;
  className: string;
  academicYear: string;
  maxStudents: number;
  currentStudents: number;
  availableSeats: number;
  isFull: boolean;
  classTeacher?: {
    id: string;
    name: string;
    teacherId: string;
  };
  subjects: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  isActive: boolean;
  absenceSmsSettings: IClassAbsenceSmsSettings | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClassStats {
  totalClasses: number;
  activeClasses: number;
  totalCapacity: number;
  totalStudents: number;
  utilizationRate: number; // Percentage
  byGrade: Array<{
    grade: number;
    classes: number;
    capacity: number;
    students: number;
    sections: string[];
  }>;
  fullClasses: number;
  underutilizedClasses: Array<{
    id: string;
    className: string;
    capacity: number;
    students: number;
    utilizationRate: number;
  }>;
}

export interface ICapacityCheck {
  grade: number;
  totalCapacity: number;
  currentStudents: number;
  availableSeats: number;
  needsNewSection: boolean;
  existingSections: string[];
  nextAvailableSection: string;
}

// Section management
export interface ISectionRequest {
  schoolId: string;
  grade: number;
  academicYear: string;
}

export interface ISectionResponse {
  sections: string[];
  nextAvailable: string;
  canCreate: boolean;
}

export interface IClassAbsenceSmsSettings {
  enabled: boolean;
  sendAfterTime: string; // HH:mm (24h)
}
