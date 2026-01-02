import { Schema, model } from "mongoose";
import config from "../../config";
import {
  IConversationDocument,
  IConversationModel,
  IMessageDocument,
  IMessageModel,
  MessagingContextType,
} from "./messaging.interface";
import { UserRole } from "../user/user.interface";

const messagingTtlDays = Math.max(config.messaging_ttl_days || 30, 1);
const messagingTtlSeconds = messagingTtlDays * 24 * 60 * 60;

const conversationParticipantSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const conversationSchema = new Schema<IConversationDocument, IConversationModel>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    participantIds: {
      type: [conversationParticipantSchema],
      validate: {
        validator: function (value: unknown[]) {
          return Array.isArray(value) && value.length >= 2;
        },
        message: "A conversation must have at least two participants",
      },
      required: true,
    },
    participantHash: {
      type: String,
      required: true,
      index: true,
    },
    contextType: {
      type: String,
      enum: ["direct", "student-thread"] satisfies MessagingContextType[],
      default: "direct",
      index: true,
    },
    contextStudentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      index: true,
    },
    lastMessageAt: {
      type: Date,
      index: true,
    },
    lastMessagePreview: {
      type: String,
      maxlength: 200,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index(
  {
    schoolId: 1,
    participantHash: 1,
    contextType: 1,
    contextStudentId: 1,
  },
  { unique: false }
);

conversationSchema.index({
  schoolId: 1,
  "participantIds.userId": 1,
  lastMessageAt: -1,
});

const messageSchema = new Schema<IMessageDocument, IMessageModel>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "MessagingConversation",
      required: true,
      index: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: config.messaging_max_body_length || 2000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: messagingTtlSeconds });

export const Conversation = model<IConversationDocument, IConversationModel>(
  "MessagingConversation",
  conversationSchema
);

export const Message = model<IMessageDocument, IMessageModel>(
  "MessagingMessage",
  messageSchema
);
