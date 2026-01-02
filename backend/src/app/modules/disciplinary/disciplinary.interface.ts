import { Document, Types, Model } from 'mongoose';

// Base disciplinary action interface
export interface IDisciplinaryAction {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  teacherId: Types.ObjectId;
  actionType: 'warning' | 'punishment' | 'suspension' | 'detention' | 'red_warrant';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'behavior' | 'attendance' | 'academic' | 'discipline' | 'uniform' | 'other';
  title: string;
  description: string;
  reason: string;
  incidentDate: Date;
  issuedDate: Date;
  status: 'active' | 'acknowledged' | 'resolved' | 'appealed';
  actionTaken?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  parentNotified: boolean;
  parentNotificationDate?: Date;
  parentResponse?: string;
  studentAcknowledged: boolean;
  studentAcknowledgmentDate?: Date;
  studentResponse?: string;
  witnesses?: string[];
  evidenceAttachments?: string[];
  academicYear: string;
  term?: 'first' | 'second' | 'third' | 'annual';
  points?: number; // Disciplinary points system
  isAppealable: boolean;
  appealDeadline?: Date;
  resolvedDate?: Date;
  resolvedBy?: Types.ObjectId;
  resolutionNotes?: string;
  relatedIncidents?: Types.ObjectId[];
  isRedWarrant?: boolean; // Special flag for red warrant type messages
  warrantLevel?: 'yellow' | 'orange' | 'red'; // Escalation levels
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

export interface IDisciplinaryActionDocument extends IDisciplinaryAction, Document {
  id: string;
}

export interface IDisciplinaryActionMethods {
  escalate(): Promise<IDisciplinaryActionDocument>;
  acknowledge(acknowledgedBy: 'student' | 'parent', response?: string): Promise<IDisciplinaryActionDocument>;
  resolve(resolvedBy: Types.ObjectId, resolutionNotes: string): Promise<IDisciplinaryActionDocument>;
  isOverdue(): boolean;
  canAppeal(): boolean;
  getEscalationLevel(): string;
  notifyParents(): Promise<boolean>;
  notifyStudent(): Promise<boolean>;
  addFollowUp(followUpNotes: string): Promise<IDisciplinaryActionDocument>;
}

export interface IDisciplinaryActionModel extends Model<IDisciplinaryActionDocument> {
  findByStudent(studentId: string, filters?: any): Promise<IDisciplinaryActionDocument[]>;
  findByTeacher(teacherId: string, filters?: any): Promise<IDisciplinaryActionDocument[]>;
  findBySchool(schoolId: string, filters?: any): Promise<IDisciplinaryActionDocument[]>;
  getStudentDisciplinaryHistory(studentId: string): Promise<any>;
  getClassDisciplinaryStats(schoolId: string, grade: number, section?: string): Promise<any>;
  issueRedWarrant(data: ICreateRedWarrantRequest): Promise<IDisciplinaryActionDocument>;
  escalateWarning(actionId: string, escalationReason: string): Promise<IDisciplinaryActionDocument>;
  getDisciplinaryStats(schoolId: string, filters?: any): Promise<IDisciplinaryStats>;
  getOverdueActions(schoolId: string): Promise<IDisciplinaryActionDocument[]>;
  generateDisciplinaryReport(schoolId: string, filters: any): Promise<any>;
}

// Request interfaces
export interface ICreateDisciplinaryActionRequest {
  studentIds: string[];
  actionType: 'warning' | 'punishment' | 'suspension' | 'detention' | 'red_warrant';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'behavior' | 'attendance' | 'academic' | 'discipline' | 'uniform' | 'other';
  title: string;
  description: string;
  reason: string;
  incidentDate: string;
  actionTaken?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  notifyParents: boolean;
  isAppealable: boolean;
  appealDeadline?: string;
  witnesses?: string[];
  evidenceAttachments?: string[];
  points?: number;
  warrantLevel?: 'yellow' | 'orange' | 'red';
}

export interface ICreateRedWarrantRequest {
  studentIds: string[];
  title: string;
  description: string;
  reason: string;
  severity: 'high' | 'critical';
  category: string;
  incidentDate: string;
  actionTaken?: string;
  witnesses?: string[];
  evidenceAttachments?: string[];
  urgentNotification: boolean;
}

export interface IUpdateDisciplinaryActionRequest {
  actionTaken?: string;
  status?: 'active' | 'acknowledged' | 'resolved' | 'appealed';
  followUpDate?: string;
  resolutionNotes?: string;
  parentResponse?: string;
  studentResponse?: string;
  relatedIncidents?: string[];
}

// Response interfaces
export interface IDisciplinaryActionResponse {
  id: string;
  schoolId: string;
  actionType: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  reason: string;
  incidentDate: Date;
  issuedDate: Date;
  status: string;
  actionTaken?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  parentNotified: boolean;
  parentNotificationDate?: Date;
  studentAcknowledged: boolean;
  studentAcknowledgmentDate?: Date;
  points?: number;
  isRedWarrant?: boolean;
  warrantLevel?: string;
  canAppeal: boolean;
  isOverdue: boolean;
  escalationLevel: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    grade: number;
    section: string;
    studentId: string;
  };
  teacher: {
    id: string;
    name: string;
    teacherId: string;
    designation: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IDisciplinaryStats {
  totalActions: number;
  activeActions: number;
  resolvedActions: number;
  pendingAcknowledgment: number;
  overdueFollowUps: number;
  redWarrants: number;
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byCategory: {
    behavior: number;
    attendance: number;
    academic: number;
    discipline: number;
    uniform: number;
    other: number;
  };
  byGrade: Array<{
    grade: number;
    count: number;
  }>;
  recentTrends: Array<{
    date: string;
    count: number;
  }>;
}

// Punishment specific interfaces
export interface IPunishment {
  punishmentType: 'detention' | 'suspension' | 'community_service' | 'restriction' | 'counseling';
  duration?: number; // in days
  startDate: Date;
  endDate?: Date;
  details: string;
  location?: string;
  supervisor?: Types.ObjectId;
  conditions?: string[];
  isCompleted: boolean;
  completionDate?: Date;
  completionNotes?: string;
}

export interface IPunishmentDocument extends IPunishment, Document {
  disciplinaryActionId: Types.ObjectId;
}

// Red Warrant specific interface
export interface IRedWarrant {
  warrantNumber: string;
  urgencyLevel: 'high' | 'critical';
  immediateAction: boolean;
  parentMeetingRequired: boolean;
  parentMeetingDate?: Date;
  principalNotified: boolean;
  principalNotificationDate?: Date;
  escalationPath: string[];
  additionalAuthorities?: string[];
}

export interface IRedWarrantDocument extends IRedWarrant, Document {
  disciplinaryActionId: Types.ObjectId;
}