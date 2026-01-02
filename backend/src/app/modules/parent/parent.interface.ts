import { Document, Types, Model } from 'mongoose';

export interface IParent {
  userId: Types.ObjectId;
  schoolId: Types.ObjectId;
  parentId: string; // Auto-generated unique ID (e.g., SCH001-PAR-2025-001)
  children: Types.ObjectId[]; // References to Student documents
  relationship: 'Father' | 'Mother' | 'Guardian' | 'Step Parent' | 'Foster Parent' | 'Grandparent' | 'Other';
  occupation?: string;
  qualification?: string;
  monthlyIncome?: {
    amount: number;
    currency: string;
  };
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  preferences: {
    communicationMethod: 'Email' | 'SMS' | 'Phone Call' | 'All';
    receiveNewsletters: boolean;
    receiveAttendanceAlerts: boolean;
    receiveExamResults: boolean;
    receiveEventNotifications: boolean;
  };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IParentDocument extends IParent, Document {
  _id: Types.ObjectId;
}

export interface IParentMethods {
  generateParentId(): string;
  getFullName(): string;
  getChildrenCount(): Promise<number>;
  canReceiveNotifications(): boolean;
  isGuardianOf(studentId: string): boolean;
}

export interface IParentModel extends Model<IParentDocument> {
  findBySchool(schoolId: string): Promise<IParentDocument[]>;
  findByStudent(studentId: string): Promise<IParentDocument[]>;
  findByParentId(parentId: string): Promise<IParentDocument | null>;
  generateNextParentId(schoolId: string, year?: number, session?: any): Promise<string>;
}

// Request/Response interfaces
export interface ICreateParentRequest {
  schoolId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  children: string[]; // Student IDs
  relationship: 'Father' | 'Mother' | 'Guardian' | 'Step Parent' | 'Foster Parent' | 'Grandparent' | 'Other';
  occupation?: string;
  qualification?: string;
  monthlyIncome?: {
    amount: number;
    currency?: string;
  };
  address: {
    street?: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  preferences?: {
    communicationMethod?: 'Email' | 'SMS' | 'Phone Call' | 'All';
    receiveNewsletters?: boolean;
    receiveAttendanceAlerts?: boolean;
    receiveExamResults?: boolean;
    receiveEventNotifications?: boolean;
  };
}

export interface IUpdateParentRequest {
  children?: string[];
  relationship?: 'Father' | 'Mother' | 'Guardian' | 'Step Parent' | 'Foster Parent' | 'Grandparent' | 'Other';
  occupation?: string;
  qualification?: string;
  monthlyIncome?: {
    amount: number;
    currency?: string;
  };
  address?: {
    street?: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  preferences?: {
    communicationMethod?: 'Email' | 'SMS' | 'Phone Call' | 'All';
    receiveNewsletters?: boolean;
    receiveAttendanceAlerts?: boolean;
    receiveExamResults?: boolean;
    receiveEventNotifications?: boolean;
  };
  isActive?: boolean;
}

export interface IParentResponse {
  id: string;
  userId: string;
  schoolId: string;
  parentId: string;
  children: {
    id: string;
    studentId: string;
    fullName: string;
    grade: number;
    section: string;
    rollNumber?: number;
  }[];
  childrenCount: number;
  relationship: string;
  occupation?: string;
  qualification?: string;
  monthlyIncome?: {
    amount: number;
    currency: string;
  };
  address: {
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
  preferences: {
    communicationMethod: string;
    receiveNewsletters: boolean;
    receiveAttendanceAlerts: boolean;
    receiveExamResults: boolean;
    receiveEventNotifications: boolean;
  };
  isActive: boolean;
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
}

export interface IParentStats {
  totalParents: number;
  activeParents: number;
  byRelationship: Array<{
    relationship: string;
    count: number;
  }>;
  byCommunicationPreference: Array<{
    method: string;
    count: number;
  }>;
  byChildrenCount: Array<{
    childrenCount: number;
    parentCount: number;
  }>;
  recentRegistrations: number; // Last 30 days
}

export interface IAddChildRequest {
  studentId: string;
}

export interface IRemoveChildRequest {
  studentId: string;
}