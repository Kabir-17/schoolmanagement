import { Document, Types, Model } from 'mongoose';

export enum SchoolStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval'
}

export interface ISchoolAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ISchoolContact {
  phone?: string;
  email: string;
  website?: string;
  fax?: string;
}

export interface ISchoolSettings {
  maxStudentsPerSection: number;
  grades: number[]; // Grades offered (1-12)
  sections: string[]; // Available sections (A, B, C, etc.)
  academicYearStart: number; // Month (1-12)
  academicYearEnd: number; // Month (1-12)
  attendanceGracePeriod: number; // Minutes
  maxPeriodsPerDay: number;
  timezone: string;
  language: string;
  currency: string;
  attendanceLockAfterDays: number;
  maxAttendanceEditHours: number;
  autoAttendFinalizationTime: string;
  // Section capacity tracking - format: "grade-section" => { maxStudents, currentStudents }
  sectionCapacity?: {
    [key: string]: {
      maxStudents: number;
      currentStudents: number;
    };
  };
}

export interface IAcademicSession {
  name: string; // e.g., "2024-25"
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isDefault?: boolean;
}

export interface ISchool {
  // Legacy field - keeping for backward compatibility but not required for new schools
  orgId?: Types.ObjectId;
  
  // Basic Information
  name: string;
  slug: string; // URL-friendly version of name
  schoolId: string; // Unique identifier (e.g., "SCH001")
  establishedYear?: number;
  
  // Contact Information
  address: ISchoolAddress;
  contact: ISchoolContact;
  
  // Administrative
  status: SchoolStatus;
  adminUserId: Types.ObjectId; // Reference to admin user in User collection
  
  // Educational Details
  affiliation?: string; // e.g., "CBSE", "ICSE", "State Board"
  recognition?: string; // Government recognition details
  
  // Settings
  settings: ISchoolSettings;
  
  // Academic Sessions
  currentSession?: IAcademicSession;
  academicSessions: IAcademicSession[];
  
  // API Configuration for face recognition app
  apiEndpoint: string; // Dynamic API endpoint for this school
  apiKey: string; // Unique API key for face recognition app
  
  // Media
  logo?: string; // URL to school logo
  images?: string[]; // Additional school images
  
  // Metadata
  isActive: boolean;
  createdBy: Types.ObjectId; // Super admin who created this school
  lastModifiedBy?: Types.ObjectId;
  
  // Statistics (cached for performance)
  stats?: {
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    totalClasses: number;
    totalSubjects: number;
    attendanceRate: number;
    lastUpdated: Date;
  };
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISchoolDocument extends ISchool, Document, ISchoolMethods {
  _id: Types.ObjectId;
}

export interface ISchoolMethods {
  // Enhanced methods
  generateApiEndpoint(): string;
  generateApiKey(): string;
  regenerateApiKey(): Promise<string>;
  updateStats(): Promise<ISchoolDocument>;
  isCurrentlyActive(): boolean;
  getCurrentAcademicSession(): IAcademicSession | null;
  createNewAcademicSession(session: Omit<IAcademicSession, 'isActive'>): Promise<ISchoolDocument>;
  setActiveAcademicSession(sessionName: string): Promise<ISchoolDocument>;
  getGradesOffered(): number[];
  getSectionsForGrade(grade: number): string[];
  canEnrollStudents(): boolean;
  getMaxStudentsForGrade(grade: number): number;
  createGoogleDriveFolder(): Promise<string>;
  // Section capacity management
  getSectionCapacity(grade: number, section: string): { maxStudents: number; currentStudents: number };
  setSectionCapacity(grade: number, section: string, maxStudents: number): Promise<ISchoolDocument>;
  updateCurrentStudentCount(grade: number, section: string, increment?: number): Promise<ISchoolDocument>;
  canEnrollInSection(grade: number, section: string): boolean;
  getAvailableSectionsForGrade(grade: number): string[];
  initializeSectionCapacity(): Promise<ISchoolDocument>;
}

export interface ISchoolModel extends Model<ISchoolDocument> {
  // Enhanced methods
  findBySlug(slug: string): Promise<ISchoolDocument | null>;
  findBySchoolId(schoolId: string): Promise<ISchoolDocument | null>;
  findByAdmin(adminId: string): Promise<ISchoolDocument | null>;
  findByStatus(status: SchoolStatus): Promise<ISchoolDocument[]>;
  findByApiKey(apiKey: string): Promise<ISchoolDocument | null>;
  findByOrganization(orgId: string): Promise<ISchoolDocument[]>;
  generateUniqueSchoolId(): Promise<string>;
  generateUniqueSlug(name: string): Promise<string>;
  search(query: string): Promise<ISchoolDocument[]>;
}

// Request/Response interfaces
export interface ICreateSchoolRequest {
  name: string;
  establishedYear?: number;
  address: ISchoolAddress;
  contact: ISchoolContact;
  affiliation?: string;
  recognition?: string;
  adminDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    username: string;
    password: string;
  };
  currentSession?: Omit<IAcademicSession, 'isActive'>;
  settings?: Partial<ISchoolSettings>;
  logo?: string;
  
  // Legacy support
  orgId?: string; // Optional for backward compatibility
}

export interface IUpdateSchoolRequest {
  name?: string;
  establishedYear?: number;
  address?: Partial<ISchoolAddress>;
  contact?: Partial<ISchoolContact>;
  affiliation?: string;
  recognition?: string;
  settings?: Partial<ISchoolSettings>;
  status?: SchoolStatus;
  logo?: string;
  images?: string[];
}

export interface ISchoolResponse {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  schoolId: string;
  establishedYear?: number;
  address: ISchoolAddress;
  contact: ISchoolContact;
  status: SchoolStatus;
  affiliation?: string;
  recognition?: string;
  settings: ISchoolSettings;
  currentSession?: IAcademicSession;
  apiEndpoint: string;
  logo?: string;
  images?: string[];
  isActive: boolean;
  stats?: {
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    totalClasses: number;
    totalSubjects: number;
    attendanceRate: number;
    lastUpdated: Date;
  };
  admin?: {
    id: string;
    username: string;
    fullName: string;
    email: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Legacy fields for backward compatibility
  orgId?: string;
  studentsCount?: number;
  teachersCount?: number;
  organization?: {
    id: string;
    name: string;
  };
}

export interface ISchoolStatsResponse {
  schoolId: string;
  schoolName: string;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClasses: number;
  totalSubjects: number;
  attendanceRate: number;
  enrollmentTrend: {
    month: string;
    students: number;
  }[];
  gradeDistribution: {
    grade: number;
    count: number;
  }[];
  lastUpdated: Date;
}

export interface ISchoolCredentials {
  username: string;
  password: string;
  tempPassword: string;
  apiKey: string;
  apiEndpoint: string;
}
