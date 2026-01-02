import { Document, Model, Types } from "mongoose";
import { UserRole } from "../user/user.interface";

export type MessagingContextType = "direct" | "student-thread";

export interface IConversationParticipant {
  userId: Types.ObjectId;
  role: UserRole;
  addedAt: Date;
}

export interface IConversation {
  schoolId: Types.ObjectId;
  participantIds: IConversationParticipant[];
  participantHash: string;
  contextType: MessagingContextType;
  contextStudentId?: Types.ObjectId | null;
  lastMessageAt?: Date | null;
  lastMessagePreview?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IConversationDocument extends IConversation, Document {
  id: string;
}

export interface IConversationModel
  extends Model<IConversationDocument> {}

export interface IMessage {
  conversationId: Types.ObjectId;
  schoolId: Types.ObjectId;
  senderId: Types.ObjectId;
  body: string;
  createdAt: Date;
}

export interface IMessageDocument extends IMessage, Document {
  id: string;
}

export interface IMessageModel extends Model<IMessageDocument> {}

export interface MessagingContactStudent {
  studentId: string;
  studentName: string;
}

export interface MessagingContact {
  userId: string;
  role: UserRole;
  fullName: string;
  relatedStudents: MessagingContactStudent[];
}

export interface ConversationParticipantSummary {
  userId: string;
  role: UserRole;
  fullName: string;
  isSelf: boolean;
}

export interface ConversationSummary {
  id: string;
  contextType: MessagingContextType;
  contextStudent?: {
    studentId: string;
    studentName: string;
  } | null;
  lastMessageAt?: Date | null;
  lastMessagePreview?: string | null;
  participants: ConversationParticipantSummary[];
}

export interface MessageSummary {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
}
