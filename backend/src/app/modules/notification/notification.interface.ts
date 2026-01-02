import { Document, Types, Model } from 'mongoose';

export interface INotification {
  schoolId: Types.ObjectId;
  recipientId: Types.ObjectId; // User ID of recipient
  recipientType: 'parent' | 'student' | 'teacher' | 'admin';
  senderId: Types.ObjectId; // User ID of sender
  senderType: 'teacher' | 'admin' | 'system';
  type: 'attendance_alert' | 'homework_assigned' | 'grade_published' | 'announcement' | 'warning' | 'disciplinary_warning' | 'red_warrant' | 'punishment_issued';
  title: string;
  message: string;
  data?: any; // Additional data related to the notification
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: Date;
  relatedEntityId?: Types.ObjectId;
  relatedEntityType?: string;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotificationDocument extends INotification, Document, INotificationMethods {
  _id: Types.ObjectId;
}

export interface INotificationMethods {
  markAsRead(): Promise<void>;
  getTimeAgo(): string;
}

export interface INotificationModel extends Model<INotificationDocument> {
  createAttendanceAlert(data: {
    studentId: string;
    teacherId: string;
    subjectName: string;
    className: string;
    date: Date;
    period: number;
  }): Promise<INotificationDocument[]>;
  
  createHomeworkAlert(data: {
    studentIds: string[];
    teacherId: string;
    homeworkTitle: string;
    dueDate: Date;
    subjectName: string;
  }): Promise<INotificationDocument[]>;

  getUnreadCount(userId: string): Promise<number>;
  
  markAllAsRead(userId: string): Promise<void>;
}

export interface ICreateNotificationRequest {
  recipientId: string;
  recipientType: 'parent' | 'student' | 'teacher' | 'admin';
  type: 'attendance_alert' | 'homework_assigned' | 'grade_published' | 'announcement' | 'warning';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface INotificationResponse {
  id: string;
  recipientId: string;
  recipientType: string;
  senderId: string;
  senderType: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority: string;
  isRead: boolean;
  readAt?: Date;
  timeAgo: string;
  createdAt: Date;
  updatedAt: Date;
  sender?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface INotificationStats {
  total: number;
  unread: number;
  byType: Array<{
    type: string;
    count: number;
  }>;
  byPriority: Array<{
    priority: string;
    count: number;
  }>;
}