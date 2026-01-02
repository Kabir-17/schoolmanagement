import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiService } from "@/services";
import { toast } from "sonner";
import { RefreshCw, Send, AlertTriangle, Clock, Loader2 } from "lucide-react";

const configFallbackTimezone = "UTC";

type SmsLogStatus = "pending" | "sent" | "failed";

interface SmsLogEntry {
  _id: string;
  message: string;
  status: SmsLogStatus;
  attempts: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  providerMessageId?: string;
  dateKey: string;
  studentId?: {
    _id: string;
    studentId: string;
    grade: number;
    section: string;
    userId?: {
      firstName?: string;
      lastName?: string;
    };
  };
  parentUserId?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  parentId?: {
    parentId?: string;
    relationship?: string;
  };
  classId?: {
    grade: number;
    section: string;
    className?: string;
  };
}

interface SmsOverview {
  dateKey: string;
  timezone: string;
  currentTime: string;
  nextDispatchCheck: string;
  totals: {
    pendingBeforeCutoff: number;
    pendingAfterCutoff: number;
    sentToday: number;
    failedToday: number;
  };
  classes: Array<{
    classKey: string;
    grade: number;
    section: string;
    className: string;
    sendAfterTime: string;
    pendingBeforeCutoff: number;
    pendingAfterCutoff: number;
    sentCount: number;
    failedCount: number;
    totalAbsent: number;
  }>;
  pending: Array<{
    classKey: string;
    className: string;
    grade: number;
    section: string;
    sendAfterTime: string;
    pendingBeforeCutoff: number;
    pendingAfterCutoff: number;
    sentCount: number;
    failedCount: number;
  }>;
}

interface LogsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusStyles: Record<SmsLogStatus, string> = {
  sent: "bg-green-100 text-green-700 border-green-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
};

const statusLabels: Record<SmsLogStatus, string> = {
  sent: "Sent",
  failed: "Failed",
  pending: "Pending",
};

const defaultDate = () => new Date().toISOString().slice(0, 10);

const AbsenceSmsMonitor: React.FC = () => {
  const [logs, setLogs] = useState<SmsLogEntry[]>([]);
  const [logsMeta, setLogsMeta] = useState<LogsMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [overview, setOverview] = useState<SmsOverview | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [triggeringDispatch, setTriggeringDispatch] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const [filters, setFilters] = useState({
    status: "all" as "all" | SmsLogStatus,
    date: defaultDate(),
    messageQuery: "",
    page: 1,
  });

  const [testForm, setTestForm] = useState({
    phoneNumber: "",
    studentName: "",
    schoolName: "",
    message: "",
    senderName: "",
  });

  const fetchLogs = async (pageOverride?: number) => {
    try {
      setLoadingLogs(true);
      const response = await apiService.admin.getAbsenceSmsLogs({
        status: filters.status === "all" ? undefined : filters.status,
        date: filters.date,
        page: pageOverride ?? filters.page,
        limit: logsMeta.limit,
        messageQuery: filters.messageQuery || undefined,
      });

      if (response.data.success) {
        setLogs(response.data.data || []);
        const meta = (response.data.meta || {}) as Partial<LogsMeta>;
        setLogsMeta({
          page: meta.page ?? (pageOverride ?? filters.page),
          limit: meta.limit ?? logsMeta.limit,
          total: meta.total ?? logsMeta.total,
          totalPages: meta.totalPages ?? logsMeta.totalPages,
        });
      } else {
        toast.error("Failed to load SMS logs");
      }
    } catch (error) {
      console.error("Failed to load SMS logs", error);
      toast.error("Failed to load SMS logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const response = await apiService.admin.getAbsenceSmsOverview({
        date: filters.date,
      });
      if (response.data.success) {
        setOverview(response.data.data);
      } else {
        toast.error("Failed to load SMS overview");
      }
    } catch (error) {
      console.error("Failed to load SMS overview", error);
      toast.error("Failed to load SMS overview");
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [filters.date]);

  useEffect(() => {
    fetchLogs();
  }, [filters.date, filters.status, filters.messageQuery]);

  const handleRefresh = () => {
    fetchOverview();
    fetchLogs(filters.page);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    fetchLogs(page);
  };

  const handleTriggerDispatch = async () => {
    try {
      setTriggeringDispatch(true);
      await apiService.admin.triggerAbsenceSmsRun();
      toast.success("Dispatch triggered. Refresh to view new activity.");
      fetchOverview();
      fetchLogs(filters.page);
    } catch (error) {
      console.error("Failed to trigger dispatcher", error);
      toast.error("Failed to trigger SMS dispatcher");
    } finally {
      setTriggeringDispatch(false);
    }
  };

  const handleTestSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!testForm.phoneNumber) {
      toast.error("Phone number is required for a test SMS");
      return;
    }

    try {
      setSendingTest(true);
      const payload = {
        phoneNumber: testForm.phoneNumber,
        studentName: testForm.studentName || undefined,
        schoolName: testForm.schoolName || undefined,
        message: testForm.message || undefined,
        senderName: testForm.senderName || undefined,
      };
      const response = await apiService.admin.sendAbsenceSmsTest(payload);
      if (response.data.success && response.data.data?.status === "sent") {
        toast.success("Test SMS sent successfully");
      } else {
        toast.error(
          response.data.data?.error || "Test SMS failed to send"
        );
      }
    } catch (error: any) {
      console.error("Failed to send test SMS", error);
      const message = error?.response?.data?.message || "Failed to send test SMS";
      toast.error(message);
    } finally {
      setSendingTest(false);
    }
  };

  const statusFilterOptions = useMemo(
    () => [
      { value: "all", label: "All statuses" },
      { value: "sent", label: "Sent" },
      { value: "failed", label: "Failed" },
      { value: "pending", label: "Pending" },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Absence SMS Monitor</h1>
          <p className="text-gray-600">
            Track automated absence notifications, troubleshoot failures, and run tests.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={handleTriggerDispatch} disabled={triggeringDispatch}>
            {triggeringDispatch ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" /> Force Dispatch
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Summary</CardTitle>
          <CardDescription>
            Timezone: {overview?.timezone || configFallbackTimezone} — Current time {overview?.currentTime || "--:--"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingOverview ? (
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading summary...
            </div>
          ) : overview ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SummaryCard
                title="Sent today"
                value={overview.totals.sentToday}
                tone="success"
              />
              <SummaryCard
                title="Failed today"
                value={overview.totals.failedToday}
                tone="danger"
              />
              <SummaryCard
                title="Queued (before cutoff)"
                value={overview.totals.pendingBeforeCutoff}
                tone="info"
              />
              <SummaryCard
                title="Past cutoff - needs action"
                value={overview.totals.pendingAfterCutoff}
                tone="warning"
                highlight
              />
            </div>
          ) : (
            <p className="text-gray-500">No SMS data available for the selected date.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pending Alerts</CardTitle>
            <CardDescription>
              Classes still awaiting parent notifications today. Next scheduler check {overview?.nextDispatchCheck || "--:--"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOverview ? (
              <div className="flex items-center gap-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading pending classes...
              </div>
            ) : overview && overview.pending.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 font-medium text-gray-600">Class</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Send after</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Queued</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Late</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Sent</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Failed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.pending.map((entry) => (
                      <tr key={entry.classKey} className="border-b last:border-none">
                        <td className="px-4 py-2 font-medium text-gray-800">
                          {entry.className}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{entry.sendAfterTime}</td>
                        <td className="px-4 py-2 text-blue-600 font-semibold">
                          {entry.pendingBeforeCutoff}
                        </td>
                        <td className="px-4 py-2 text-amber-600 font-semibold">
                          {entry.pendingAfterCutoff}
                        </td>
                        <td className="px-4 py-2 text-green-600">{entry.sentCount}</td>
                        <td className="px-4 py-2 text-red-600">{entry.failedCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No pending alerts right now.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send Test SMS</CardTitle>
            <CardDescription>
              Validate Orange credentials by sending a sample notification to your own number.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTestSend} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone number (with country code)
                </label>
                <Input
                  value={testForm.phoneNumber}
                  onChange={(event) =>
                    setTestForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
                  }
                  placeholder="e.g., +224628686315"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Student name (optional)
                  </label>
                  <Input
                    value={testForm.studentName}
                    onChange={(event) =>
                      setTestForm((prev) => ({ ...prev, studentName: event.target.value }))
                    }
                    placeholder="Student name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    School name (optional)
                  </label>
                  <Input
                    value={testForm.schoolName}
                    onChange={(event) =>
                      setTestForm((prev) => ({ ...prev, schoolName: event.target.value }))
                    }
                    placeholder="School name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Custom message (optional)
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring focus:border-blue-300"
                  rows={4}
                  value={testForm.message}
                  onChange={(event) =>
                    setTestForm((prev) => ({ ...prev, message: event.target.value }))
                  }
                  placeholder="Leave blank to use the standard absence template"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sender name (optional, max 11 chars)
                </label>
                <Input
                  value={testForm.senderName}
                  onChange={(event) =>
                    setTestForm((prev) => ({ ...prev, senderName: event.target.value }))
                  }
                  maxLength={11}
                  placeholder="Custom sender"
                />
              </div>
              <Button type="submit" disabled={sendingTest} className="w-full">
                {sendingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Send test SMS
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SMS Activity Log</CardTitle>
          <CardDescription>
            Detailed record of every parent notification attempt for the selected date.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <Input
                  type="date"
                  value={filters.date}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, date: event.target.value || defaultDate() }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, status: value as typeof prev.status }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusFilterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Message / keyword
                </label>
                <Input
                  value={filters.messageQuery}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, messageQuery: event.target.value, page: 1 }))
                  }
                  placeholder="Search message content"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setFilters({ status: "all", date: defaultDate(), messageQuery: "", page: 1 })}>
                Reset
              </Button>
              <Button variant="outline" onClick={() => fetchLogs(filters.page)}>
                <RefreshCw className="w-4 h-4 mr-2" /> Apply
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Parent</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Attempts</th>
                  <th className="px-4 py-3 font-medium">Last attempt</th>
                  <th className="px-4 py-3 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading logs...
                    </td>
                  </tr>
                ) : logs.length ? (
                  logs.map((log) => (
                    <tr key={log._id} className="border-b last:border-none">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${statusStyles[log.status]}`}>
                          {log.status === "failed" ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : log.status === "sent" ? (
                            <Send className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {statusLabels[log.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatStudentName(log)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatClassLabel(log)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex flex-col">
                          <span>{formatParentName(log)}</span>
                          {log.parentUserId?.phone && (
                            <span className="text-xs text-gray-500">{log.parentUserId.phone}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                        {log.message}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.attempts}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {log.lastAttemptAt
                          ? new Date(log.lastAttemptAt).toLocaleString()
                          : "--"}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        {log.errorMessage || ""}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      No logs found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {logsMeta.page} of {logsMeta.totalPages} · {logsMeta.total} records
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, logsMeta.page - 1))}
                disabled={logsMeta.page <= 1 || loadingLogs}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(logsMeta.totalPages, logsMeta.page + 1))}
                disabled={logsMeta.page >= logsMeta.totalPages || loadingLogs}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SummaryCard: React.FC<{
  title: string;
  value: number;
  tone?: "success" | "danger" | "warning" | "info";
  highlight?: boolean;
}> = ({ title, value, tone = "info", highlight = false }) => {
  const toneClasses: Record<string, string> = {
    success: "bg-green-50 border-green-200 text-green-700",
    danger: "bg-red-50 border-red-200 text-red-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };

  return (
    <div
      className={`border rounded-lg p-4 ${toneClasses[tone]} ${
        highlight ? "shadow-md" : ""
      }`}
    >
      <div className="text-sm font-medium uppercase tracking-wide text-gray-600">
        {title}
      </div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
};

const formatStudentName = (log: SmsLogEntry) => {
  const student = log.studentId;
  if (!student) return "Unknown student";
  const nameParts = [
    student.userId?.firstName,
    student.userId?.lastName,
  ].filter(Boolean);
  if (nameParts.length) {
    return nameParts.join(" ");
  }
  return student.studentId || "Unknown student";
};

const formatClassLabel = (log: SmsLogEntry) => {
  if (log.classId?.className) {
    return log.classId.className;
  }
  if (log.studentId) {
    return `Grade ${log.studentId.grade}-${log.studentId.section}`;
  }
  return "";
};

const formatParentName = (log: SmsLogEntry) => {
  const parentUser = log.parentUserId;
  if (parentUser?.firstName || parentUser?.lastName) {
    return `${parentUser.firstName || ""} ${parentUser.lastName || ""}`.trim();
  }
  if (log.parentId?.parentId) {
    return log.parentId.parentId;
  }
  return "Parent";
};

export default AbsenceSmsMonitor;
