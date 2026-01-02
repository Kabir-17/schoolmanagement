import React, { useState, useEffect } from "react";
import api from "../../services/api-base";

interface AutoAttendEvent {
  _id: string;
  eventId: string;
  studentId: string;
  firstName: string;
  grade: string;
  section: string;
  bloodGroup: string;
  capturedAt: string;
  capturedDate: string;
  capturedTime: string;
  status: "captured" | "reviewed" | "superseded" | "ignored";
  test: boolean;
  notes?: string;
  createdAt: string;
  dayAttendance?: {
    finalStatus?: "present" | "absent" | "late" | "excused";
    finalSource?: "teacher" | "auto" | "finalizer";
    autoStatus?: "present" | "absent" | "late" | "excused";
  };
}

interface EventsResponse {
  events: AutoAttendEvent[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface StatsResponse {
  totalEvents: number;
  capturedEvents: number;
  reviewedEvents: number;
  supersededEvents: number;
  ignoredEvents: number;
  eventsToday: number;
  eventsByGrade: Array<{ grade: string; count: number }>;
  eventsByStatus: Array<{ status: string; count: number }>;
  recentEvents: AutoAttendEvent[];
}

const AutoAttendEventsViewer: React.FC = () => {
  const [events, setEvents] = useState<AutoAttendEvent[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [page, filterGrade, filterSection, filterStatus, filterDate]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 20 };
      if (filterGrade) params.grade = filterGrade;
      if (filterSection) params.section = filterSection;
      if (filterStatus) params.status = filterStatus;
      if (filterDate) params.startDate = filterDate;

      const response = await api.get<{ data: EventsResponse }>(
        "/attendance/events",
        { params }
      );
      setEvents(response.data.data.events);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get<{ data: StatsResponse }>(
        "/attendance/events/stats"
      );
      setStats(response.data.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const updateEventStatus = async (
    eventId: string,
    status: "reviewed" | "superseded" | "ignored",
    notes?: string
  ) => {
    try {
      await api.patch(`/attendance/events/${eventId}`, {
        status,
        notes,
      });
      fetchEvents();
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update event status");
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "captured":
        return "bg-blue-100 text-blue-800";
      case "reviewed":
        return "bg-green-100 text-green-800";
      case "superseded":
        return "bg-yellow-100 text-yellow-800";
      case "ignored":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFinalStatusBadgeColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "late":
        return "bg-yellow-100 text-yellow-800";
      case "excused":
        return "bg-purple-100 text-purple-800";
      case "absent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Auto-Attend Camera Events</h1>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Events</div>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <div className="text-sm text-blue-600">Captured (New)</div>
            <div className="text-2xl font-bold text-blue-800">
              {stats.capturedEvents}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-sm text-green-600">Reviewed</div>
            <div className="text-2xl font-bold text-green-800">
              {stats.reviewedEvents}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg shadow">
            <div className="text-sm text-purple-600">Today</div>
            <div className="text-2xl font-bold text-purple-800">
              {stats.eventsToday}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade
            </label>
            <input
              type="text"
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              placeholder="e.g., 10"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <input
              type="text"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              placeholder="e.g., A"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select aria-label="filter status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="captured">Captured</option>
              <option value="reviewed">Reviewed</option>
              <option value="superseded">Superseded</option>
              <option value="ignored">Ignored</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input aria-label="date"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => {
              setFilterGrade("");
              setFilterSection("");
              setFilterStatus("");
              setFilterDate("");
              setPage(1);
            }}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Grade/Section
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Captured At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Final Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No events found
                </td>
              </tr>
            ) : (
              events.map((event) => {
                const finalStatus = event.dayAttendance?.finalStatus;
                const autoStatus = event.dayAttendance?.autoStatus;
                const finalSource = event.dayAttendance?.finalSource;

                return (
                  <tr key={event._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {event.firstName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {event.studentId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Grade {event.grade} - {event.section}
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.bloodGroup}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {event.capturedDate}
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.capturedTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {finalStatus ? (
                        <div>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getFinalStatusBadgeColor(
                              finalStatus
                            )}`}
                          >
                            {finalStatus.toUpperCase()}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {finalSource === "teacher"
                              ? "Marked by teacher"
                              : finalSource === "finalizer"
                              ? "Auto-finalized"
                              : "Auto-detected"}
                          </div>
                        </div>
                      ) : autoStatus ? (
                        <div>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getFinalStatusBadgeColor(
                              autoStatus
                            )}`}
                          >
                            {`Auto: ${autoStatus.toUpperCase()}`}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            Awaiting confirmation
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                          event.status
                        )}`}
                      >
                        {event.status}
                      </span>
                      {event.test && (
                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          TEST
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {event.status === "captured" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              updateEventStatus(event.eventId, "reviewed")
                            }
                            className="text-green-600 hover:text-green-900"
                          >
                            ✓ Review
                          </button>
                          <button
                            onClick={() =>
                              updateEventStatus(event.eventId, "ignored")
                            }
                            className="text-gray-600 hover:text-gray-900"
                          >
                            ✗ Ignore
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoAttendEventsViewer;
