import { Document, Types } from "mongoose";

/**
 * Raw attendance event from Auto-Attend camera system
 */
export interface IAttendanceEvent {
  schoolId: Types.ObjectId;
  eventId: string; // unique identifier from Auto-Attend (timestamp + descriptor)
  descriptor: string; // student@firstName@age@grade@section@bloodGroup@studentId
  studentId: string; // SMS studentId (e.g., STU1001 or SCH001-STU-202507-0001)
  firstName: string;
  age: string;
  grade: string;
  section: string;
  bloodGroup: string;
  capturedAt: Date; // when camera detected the student
  capturedDate: string; // YYYY-MM-DD for quick filtering
  capturedTime: string; // HH:MM:SS for quick filtering
  payload: IAutoAttendEventPayload; // full original payload from Auto-Attend
  source: IAutoAttendSource; // source app metadata
  status: "captured" | "reviewed" | "superseded" | "ignored"; // event lifecycle
  test: boolean; // if true, test/dry-run event (no persistence or processing)
  processedAt?: Date; // when event was reconciled with teacher attendance
  processedBy?: Types.ObjectId; // teacher/admin who reviewed
  notes?: string; // admin notes on reconciliation
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAttendanceEventDocument extends IAttendanceEvent, Document {
  _id: Types.ObjectId;
}

/**
 * Auto-Attend request payload structure
 */
export interface IAutoAttendEventPayload {
  event: {
    eventId: string;
    descriptor: string;
    studentId: string;
    firstName: string;
    age: string;
    grade: string;
    section: string;
    bloodGroup: string;
    capturedAt: string; // ISO-8601 timestamp
    capturedDate: string; // YYYY-MM-DD
    capturedTime: string; // HH:MM:SS
  };
  source: IAutoAttendSource;
  test: boolean;
}

export interface IAutoAttendSource {
  app: string; // 'AutoAttend'
  version: string; // '1.0.0'
  deviceId?: string; // 'AUTOATTEND-12AB34'
}

/**
 * Request sent by Auto-Attend desktop application
 */
export interface IAutoAttendRequest {
  event: {
    eventId: string;
    descriptor: string;
    studentId: string;
    firstName: string;
    age: string;
    grade: string;
    section: string;
    bloodGroup: string;
    capturedAt: string;
    capturedDate: string;
    capturedTime: string;
  };
  source: {
    app: string;
    version: string;
    deviceId?: string;
  };
  test?: boolean;
}

/**
 * Response returned to Auto-Attend
 */
export interface IAutoAttendResponse {
  success: boolean;
  processed: boolean;
  message: string;
  eventId: string;
  timestamp?: string;
}

/**
 * Filters for querying attendance events
 */
export interface IAttendanceEventFilters {
  schoolId?: string;
  studentId?: string;
  status?: "captured" | "reviewed" | "superseded" | "ignored";
  startDate?: Date;
  endDate?: Date;
  grade?: string;
  section?: string;
  test?: boolean;
}

/**
 * Event statistics for dashboard
 */
export interface IAttendanceEventStats {
  totalEvents: number;
  capturedEvents: number;
  reviewedEvents: number;
  supersededEvents: number;
  ignoredEvents: number;
  eventsToday: number;
  eventsByGrade: Array<{
    grade: string;
    count: number;
  }>;
  eventsByStatus: Array<{
    status: string;
    count: number;
  }>;
  recentEvents: IAttendanceEventDocument[];
}
