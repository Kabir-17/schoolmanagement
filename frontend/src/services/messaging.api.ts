import { api, ApiResponse } from "./api-base";

export interface MessagingContact {
  userId: string;
  role: string;
  fullName: string;
  relatedStudents: Array<{
    studentId: string;
    studentName: string;
  }>;
}

export interface MessagingConversation {
  id: string;
  contextType: "direct" | "student-thread";
  contextStudent?: {
    studentId: string;
    studentName: string;
  } | null;
  lastMessageAt?: string;
  lastMessagePreview?: string | null;
  participants: Array<{
    userId: string;
    role: string;
    fullName: string;
    isSelf: boolean;
  }>;
}

export interface MessagingMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export const messagingApi = {
  listContacts: () =>
    api.get<ApiResponse<MessagingContact[]>>("/messaging/contacts"),

  listThreads: () =>
    api.get<ApiResponse<MessagingConversation[]>>("/messaging/threads"),

  createThread: (payload: {
    participantIds: string[];
    contextStudentId?: string | null;
  }) =>
    api.post<ApiResponse<MessagingConversation>>(
      "/messaging/threads",
      payload
    ),

  listMessages: (conversationId: string, params?: { cursor?: string; limit?: number }) =>
    api.get<ApiResponse<{ messages: MessagingMessage[]; nextCursor?: string }>>(
      `/messaging/threads/${conversationId}/messages`,
      { params }
    ),

  sendMessage: (conversationId: string, body: string) =>
    api.post<ApiResponse<MessagingMessage>>(
      `/messaging/threads/${conversationId}/messages`,
      { body }
    ),
};

export default messagingApi;
