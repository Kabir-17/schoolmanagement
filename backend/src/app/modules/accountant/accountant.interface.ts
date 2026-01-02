import { Document, Types, Model } from "mongoose";

export interface IAccountant {
  userId: Types.ObjectId;
  schoolId: Types.ObjectId;
  accountantId: string; // Auto-generated unique ID (e.g., SCH001-ACC-2025-001)
  employeeId?: string; // Custom employee ID
  department: string; // Finance, Payroll, Accounts Payable, etc.
  designation: string; // Chief Accountant, Senior Accountant, etc.
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
    previousOrganizations?: {
      organizationName: string;
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
  responsibilities: string[]; // List of responsibilities
  certifications?: string[]; // Professional certifications (CA, CPA, etc.)
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAccountantDocument extends IAccountant, Document {
  _id: Types.ObjectId;
}

export interface IAccountantPhoto {
  accountantId: Types.ObjectId;
  schoolId: Types.ObjectId;
  photoPath: string;
  photoNumber: number; // 1-20
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  createdAt?: Date;
}

export interface IAccountantPhotoDocument extends IAccountantPhoto, Document {
  _id: Types.ObjectId;
}

export interface IAccountantMethods {
  generateAccountantId(): string;
  getAgeInYears(): number;
  getFullName(): string;
  getFolderPath(): string; // For face recognition folder structure
  canUploadMorePhotos(): Promise<boolean>;
  getTotalExperience(): number;
  getNetSalary(): number;
}

export interface IAccountantModel extends Model<IAccountantDocument> {
  findBySchool(schoolId: string): Promise<IAccountantDocument[]>;
  findByDepartment(schoolId: string, department: string): Promise<IAccountantDocument[]>;
  findByAccountantId(accountantId: string): Promise<IAccountantDocument | null>;
  generateNextAccountantId(schoolId: string, year?: number): Promise<string>;
}

// Request/Response interfaces
export interface ICreateAccountantRequest {
  schoolId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  department: string;
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
    previousOrganizations?: {
      organizationName: string;
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
  responsibilities?: string[];
  certifications?: string[];
  isActive?: boolean;
}

export interface IUpdateAccountantRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dob?: string;
  joinDate?: string;
  employeeId?: string;
  department?: string;
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
    previousOrganizations?: {
      organizationName: string;
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
  responsibilities?: string[];
  certifications?: string[];
  isActive?: boolean;
}

export interface IAccountantResponse {
  id: string;
  userId: string;
  schoolId: string;
  accountantId: string;
  employeeId?: string;
  department: string;
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
    previousOrganizations?: {
      organizationName: string;
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
  responsibilities: string[];
  certifications?: string[];
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
  photos?: IAccountantPhotoResponse[];
  photoCount: number;
  credentials?: {
    username: string;
    password: string;
    message: string;
  };
}

export interface IAccountantPhotoResponse {
  id: string;
  photoPath: string;
  photoNumber: number;
  filename: string;
  size: number;
  createdAt: Date;
}

export interface IAccountantStats {
  totalAccountants: number;
  activeAccountants: number;
  byDepartment: Array<{
    department: string;
    count: number;
  }>;
  byDesignation: Array<{
    designation: string;
    count: number;
  }>;
  byExperience: Array<{
    experienceRange: string;
    count: number;
  }>;
  recentJoining: number; // Last 30 days
}
