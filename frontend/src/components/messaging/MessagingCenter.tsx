import React, { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  messagingApi,
  MessagingContact,
  MessagingConversation,
  MessagingMessage,
} from "@/services/messaging.api";

type ViewState = "threads" | "contacts";

interface MessagingCenterProps {
  title?: string;
  subtitle?: string;
}

interface DraftState {
  conversationId: string | null;
  body: string;
}

const MessagingCenter: React.FC<MessagingCenterProps> = ({
  title = "Messages",
  subtitle = "Stay connected with your school community",
}) => {
  const [view, setView] = useState<ViewState>("threads");
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);

  const [threads, setThreads] = useState<MessagingConversation[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessagingMessage[]>([]);
  const [messageCursor, setMessageCursor] = useState<string | undefined>();
  const [contacts, setContacts] = useState<MessagingContact[]>([]);
  const [selectedContactUserId, setSelectedContactUserId] = useState<string>("");
  const [selectedContactStudentId, setSelectedContactStudentId] = useState<string>("");

  const [draft, setDraft] = useState<DraftState>({ conversationId: null, body: "" });

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [threads, selectedThreadId]
  );

  const loadThreads = async () => {
    try {
      setLoadingThreads(true);
      const response = await messagingApi.listThreads();
      if (response.data.success) {
        const payload = response.data.data ?? [];
        setThreads(payload);
        if (payload.length && !selectedThreadId) {
          setSelectedThreadId(payload[0].id);
        }
      }
    } catch (error: any) {
      console.error("Failed to load threads", error);
      toast.error(
        error?.response?.data?.message || "Unable to load conversations"
      );
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await messagingApi.listContacts();
      if (response.data.success) {
        setContacts(response.data.data ?? []);
      }
    } catch (error: any) {
      console.error("Failed to load contacts", error);
      toast.error(
        error?.response?.data?.message || "Unable to load contacts list"
      );
    }
  };

  const loadMessages = async (conversationId: string, cursor?: string) => {
    try {
      setLoadingMessages(true);
      const response = await messagingApi.listMessages(conversationId, {
        cursor,
        limit: 50,
      });

      if (response.data.success) {
        const payload = response.data.data;
        if (payload) {
          if (cursor) {
            setMessages((prev) => [...payload.messages, ...prev]);
          } else {
            setMessages(payload.messages ?? []);
          }
          setMessageCursor(payload.nextCursor);
        }
      }
    } catch (error: any) {
      console.error("Failed to load messages", error);
      toast.error(error?.response?.data?.message || "Unable to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadThreads();
    loadContacts();
  }, []);

  useEffect(() => {
    if (selectedThreadId) {
      loadMessages(selectedThreadId);
      setDraft({ conversationId: selectedThreadId, body: "" });
    } else {
      setMessages([]);
    }
  }, [selectedThreadId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (selectedThreadId) {
        loadMessages(selectedThreadId);
      }
      loadThreads();
    }, 90_000);

    return () => window.clearInterval(interval);
  }, [selectedThreadId]);

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setView("threads");
  };

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.conversationId) {
      return;
    }
    const trimmed = draft.body.trim();
    if (!trimmed.length) {
      toast.error("Type a message to send");
      return;
    }

    try {
      setSendingMessage(true);
      const response = await messagingApi.sendMessage(
        draft.conversationId,
        trimmed
      );
      if (response.data.success) {
        const message = response.data.data!;
        setMessages((prev) => [...prev, message]);
        setDraft((prev) => ({ ...prev, body: "" }));
        await loadThreads();
      }
    } catch (error: any) {
      console.error("Failed to send message", error);
      toast.error(error?.response?.data?.message || "Unable to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStartConversation = async () => {
    if (!selectedContactUserId) {
      toast.error("Select a contact to message");
      return;
    }

    const contact = contacts.find(
      (item) => item.userId === selectedContactUserId
    );
    if (!contact) {
      toast.error("Contact not found");
      return;
    }

    let contextStudentId: string | undefined;
    if (contact.relatedStudents?.length) {
      const chosen =
        contact.relatedStudents.find(
          (student) => student.studentId === selectedContactStudentId
        ) ?? contact.relatedStudents[0];
      contextStudentId = chosen.studentId;
    }

    try {
      setCreatingThread(true);
      const response = await messagingApi.createThread({
        participantIds: [contact.userId],
        contextStudentId,
      });
      if (response.data.success) {
        const conversation = response.data.data!;
        await loadThreads();
        setSelectedThreadId(conversation.id);
        setView("threads");
        setSelectedContactUserId("");
        setSelectedContactStudentId("");
      }
    } catch (error: any) {
      console.error("Failed to start conversation", error);
      toast.error(
        error?.response?.data?.message || "Unable to start conversation"
      );
    } finally {
      setCreatingThread(false);
    }
  };

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.userId === selectedContactUserId),
    [contacts, selectedContactUserId]
  );

  return (
    <div className="bg-white shadow-sm rounded-xl border border-slate-200">
      <div className="border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("contacts")}
            className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              view === "contacts"
                ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            New Conversation
          </button>
          <button
            type="button"
            onClick={() => setView("threads")}
            className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              view === "threads"
                ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Conversation List
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-[320px,1fr] min-h-[480px]">
        <div className="border-r border-slate-100">
          {view === "contacts" ? (
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-700">
                  Select a contact
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  You can only message teachers, students, or parents linked to your classes.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {!contacts.length ? (
                  <div className="p-4 text-sm text-slate-500">
                    No contacts available yet.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {contacts.map((contact) => (
                      <li key={contact.userId}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedContactUserId(contact.userId);
                            setSelectedContactStudentId("");
                          }}
                          className={`w-full text-left px-4 py-3 transition ${
                            selectedContactUserId === contact.userId
                              ? "bg-indigo-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-900">
                              {contact.fullName}
                            </span>
                            <span className="text-xs uppercase tracking-wide text-slate-500">
                              {contact.role}
                            </span>
                          </div>
                          {contact.relatedStudents?.length ? (
                            <p className="mt-1 text-xs text-slate-500">
                              Linked student(s):{" "}
                              {contact.relatedStudents
                                .map((student) => student.studentName)
                                .join(", ")}
                            </p>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                {selectedContact &&
                  selectedContact.relatedStudents &&
                  selectedContact.relatedStudents.length > 1 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                        Choose student context
                      </label>
                      <select
                        value={selectedContactStudentId}
                        onChange={(event) =>
                          setSelectedContactStudentId(event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select student</option>
                        {selectedContact.relatedStudents.map((student) => (
                          <option key={student.studentId} value={student.studentId}>
                            {student.studentName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                <button
                  type="button"
                  onClick={handleStartConversation}
                  disabled={!selectedContactUserId || creatingThread}
                  className="w-full inline-flex justify-center items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingThread ? "Starting conversation..." : "Start conversation"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">
                  Conversations
                </p>
                <button
                  type="button"
                  onClick={loadThreads}
                  className="text-xs text-indigo-600 hover:text-indigo-500"
                >
                  Refresh
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingThreads ? (
                  <div className="p-4 text-sm text-slate-500">
                    Loading conversations…
                  </div>
                ) : !threads.length ? (
                  <div className="p-4 text-sm text-slate-500">
                    No conversations yet. Start a new one from the contacts tab.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {threads.map((thread) => (
                      <li key={thread.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectThread(thread.id)}
                          className={`w-full text-left px-4 py-3 transition ${
                            selectedThreadId === thread.id
                              ? "bg-indigo-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-900">
                              {thread.participants
                                .filter((participant) => !participant.isSelf)
                                .map((participant) => participant.fullName)
                                .join(", ") || "Conversation"}
                            </span>
                            <span className="text-xs text-slate-500">
                              {thread.lastMessageAt
                                ? formatDistanceToNow(
                                    new Date(thread.lastMessageAt),
                                    { addSuffix: true }
                                  )
                                : "No messages"}
                            </span>
                          </div>
                          {thread.contextStudent ? (
                            <p className="text-xs text-slate-500 mt-1">
                              Student: {thread.contextStudent.studentName}
                            </p>
                          ) : null}
                          <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                            {thread.lastMessagePreview || "No messages yet"}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col min-h-[480px]">
          {selectedThread ? (
            <>
              <div className="border-b border-slate-100 px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {selectedThread.participants
                        .filter((participant) => !participant.isSelf)
                        .map((participant) => participant.fullName)
                        .join(", ") || "Conversation"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedThread.contextStudent
                        ? `Student focus: ${selectedThread.contextStudent.studentName}`
                        : "General discussion"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadMessages(selectedThread.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-500"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-slate-50">
                {messageCursor ? (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => loadMessages(selectedThread.id, messageCursor)}
                      className="text-xs text-indigo-600 hover:text-indigo-500"
                    >
                      Load older messages
                    </button>
                  </div>
                ) : null}

                {loadingMessages ? (
                  <div className="text-sm text-slate-500">Loading messages…</div>
                ) : !messages.length ? (
                  <div className="text-sm text-slate-500">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = selectedThread.participants.some(
                      (participant) =>
                        participant.userId === message.senderId && participant.isSelf
                    );
                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                            isOwn
                              ? "bg-indigo-600 text-white rounded-tr-none"
                              : "bg-white text-slate-900 rounded-tl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {message.body}
                          </p>
                          <span
                            className={`mt-1 block text-xs ${
                              isOwn ? "text-indigo-100" : "text-slate-400"
                            }`}
                          >
                            {formatDistanceToNow(new Date(message.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-slate-100 px-6 py-4">
                <form onSubmit={handleSendMessage} className="space-y-3">
                  <textarea
                    rows={3}
                    value={draft.body}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        body: event.target.value,
                      }))
                    }
                    placeholder="Type your message..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Messages are retained for 30 days.
                    </span>
                    <button
                      type="submit"
                      disabled={sendingMessage || !draft.body.trim().length}
                      className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingMessage ? "Sending…" : "Send"}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <svg
                className="h-12 w-12 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7.5 8.25h9m-9 3h6m6.75 1.5c0 5.385-4.365 9.75-9.75 9.75S3.75 18.135 3.75 12.75 8.115 3 13.5 3h5.25a.75.75 0 01.75.75v5.25z"
                />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-slate-900">
                Select a conversation
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Choose an existing thread or start a new conversation from the contacts tab.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingCenter;
