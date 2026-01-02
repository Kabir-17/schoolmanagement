import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Edit,
  Trash2,
  FileText,
  Upload,
  X,
  Filter,
  Search,
} from "lucide-react";
import { showToast } from "../../utils/toast";

interface AcademicEvent {
  _id: string;
  eventTitle: string;
  eventDescription?: string;
  eventType: "exam" | "holiday" | "event" | "meeting" | "activity" | "sports" | "cultural";
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  venue?: string;
  targetAudience: "all" | "specific";
  priority: "low" | "medium" | "high" | "urgent";
  color?: string;
  attachments?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const AcademicCalendarModern: React.FC = () => {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [formData, setFormData] = useState({
    eventTitle: "",
    eventDescription: "",
    eventType: "event",
    startDate: "",
    endDate: "",
    isAllDay: true,
    startTime: "",
    endTime: "",
    venue: "",
    targetAudience: "all",
    priority: "medium",
    color: "#3b82f6",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const filterEvents = useCallback(() => {
    let filtered = events.filter(event => {
      const matchesSearch = 
        event.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.eventDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === "all" || event.eventType === filterType;
      const matchesPriority = filterPriority === "all" || event.priority === filterPriority;
      
      return matchesSearch && matchesType && matchesPriority;
    });

    setFilteredEvents(filtered);
  }, [events, searchTerm, filterType, filterPriority]);

  useEffect(() => {
    filterEvents();
  }, [filterEvents]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/calendar", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.data || []);
      } else {
        showToast.error("Failed to fetch events");
      }
    } catch (error) {
      showToast.error("Error fetching events");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingEvent
        ? `/api/admin/calendar/${editingEvent._id}`
        : "/api/admin/calendar";

      const method = editingEvent ? "PUT" : "POST";

      const formDataToSend = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      // Add files
      selectedFiles.forEach((file) => {
        formDataToSend.append("attachments", file);
      });

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        showToast.success(
          editingEvent
            ? "Event updated successfully"
            : "Event created successfully"
        );
        setIsFormOpen(false);
        setEditingEvent(null);
        resetForm();
        fetchEvents();
      } else {
        const errorData = await response.json();
        showToast.error(errorData.message || "Failed to save event");
      }
    } catch (error) {
      showToast.error("Error saving event");
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/calendar/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        showToast.success("Event deleted successfully");
        fetchEvents();
      } else {
        showToast.error("Failed to delete event");
      }
    } catch (error) {
      showToast.error("Error deleting event");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      eventTitle: "",
      eventDescription: "",
      eventType: "event",
      startDate: "",
      endDate: "",
      isAllDay: true,
      startTime: "",
      endTime: "",
      venue: "",
      targetAudience: "all",
      priority: "medium",
      color: "#3b82f6",
    });
    setSelectedFiles([]);
  };

  const openEditForm = (event: AcademicEvent) => {
    setEditingEvent(event);
    setFormData({
      eventTitle: event.eventTitle,
      eventDescription: event.eventDescription || "",
      eventType: event.eventType,
      startDate: event.startDate.split("T")[0],
      endDate: event.endDate.split("T")[0],
      isAllDay: event.isAllDay,
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      venue: event.venue || "",
      targetAudience: event.targetAudience,
      priority: event.priority,
      color: event.color || "#3b82f6",
    });
    setIsFormOpen(true);
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "exam": return "📝";
      case "holiday": return "🏖️";
      case "meeting": return "👥";
      case "sports": return "⚽";
      case "cultural": return "🎭";
      case "activity": return "🎯";
      default: return "📅";
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      exam: "bg-red-50 text-red-600 border-red-200",
      holiday: "bg-green-50 text-green-600 border-green-200",
      event: "bg-blue-50 text-blue-600 border-blue-200",
      meeting: "bg-purple-50 text-purple-600 border-purple-200",
      activity: "bg-yellow-50 text-yellow-600 border-yellow-200",
      sports: "bg-orange-50 text-orange-600 border-orange-200",
      cultural: "bg-pink-50 text-pink-600 border-pink-200",
    };
    return colors[type as keyof typeof colors] || "bg-gray-50 text-gray-600 border-gray-200";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-gray-50 text-gray-600 border-gray-200",
      medium: "bg-yellow-50 text-yellow-600 border-yellow-200",
      high: "bg-orange-50 text-orange-600 border-orange-200",
      urgent: "bg-red-50 text-red-600 border-red-200",
    };
    return colors[priority as keyof typeof colors] || "bg-gray-50 text-gray-600 border-gray-200";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Academic Calendar
              </h1>
              <p className="text-gray-600 text-lg">
                Manage school events, exams, holidays, and important dates
              </p>
            </div>
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Event
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-12 px-4 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Types</option>
              <option value="exam">Exams</option>
              <option value="holiday">Holidays</option>
              <option value="meeting">Meetings</option>
              <option value="sports">Sports</option>
              <option value="cultural">Cultural</option>
              <option value="activity">Activities</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="h-12 px-4 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-xl px-4">
              <Filter className="w-4 h-4 mr-2" />
              {filteredEvents.length} of {events.length} events
            </div>
          </div>
        </div>

        {/* Event Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-semibold">
                    {editingEvent ? "Edit Event" : "Create New Event"}
                  </CardTitle>
                  <button
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingEvent(null);
                      resetForm();
                    }}
                    className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Event Title *
                      </label>
                      <Input
                        value={formData.eventTitle}
                        onChange={(e) =>
                          setFormData({ ...formData, eventTitle: e.target.value })
                        }
                        required
                        className="h-12 rounded-xl border-gray-200 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Event Type *
                      </label>
                      <select
                        value={formData.eventType}
                        onChange={(e) =>
                          setFormData({ ...formData, eventType: e.target.value })
                        }
                        className="w-full h-12 px-4 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
                      >
                        <option value="exam">📝 Exam</option>
                        <option value="holiday">🏖️ Holiday</option>
                        <option value="event">📅 Event</option>
                        <option value="meeting">👥 Meeting</option>
                        <option value="activity">🎯 Activity</option>
                        <option value="sports">⚽ Sports</option>
                        <option value="cultural">🎭 Cultural</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.eventDescription}
                      onChange={(e) =>
                        setFormData({ ...formData, eventDescription: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                      placeholder="Enter event description..."
                    />
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({ ...formData, startDate: e.target.value })
                        }
                        required
                        className="h-12 rounded-xl border-gray-200 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        End Date *
                      </label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                        required
                        className="h-12 rounded-xl border-gray-200 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isAllDay"
                      checked={formData.isAllDay}
                      onChange={(e) =>
                        setFormData({ ...formData, isAllDay: e.target.checked })
                      }
                      className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="isAllDay" className="text-sm font-semibold text-gray-700">
                      All Day Event
                    </label>
                  </div>

                  {!formData.isAllDay && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Time
                        </label>
                        <Input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) =>
                            setFormData({ ...formData, startTime: e.target.value })
                          }
                          className="h-12 rounded-xl border-gray-200 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          End Time
                        </label>
                        <Input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) =>
                            setFormData({ ...formData, endTime: e.target.value })
                          }
                          className="h-12 rounded-xl border-gray-200 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Venue
                      </label>
                      <Input
                        value={formData.venue}
                        onChange={(e) =>
                          setFormData({ ...formData, venue: e.target.value })
                        }
                        className="h-12 rounded-xl border-gray-200 focus:border-blue-500"
                        placeholder="Enter venue..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({ ...formData, priority: e.target.value })
                        }
                        className="w-full h-12 px-4 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Event Color
                      </label>
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        className="w-full h-12 border-gray-200 rounded-xl focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Attachments
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          Click to upload files or drag and drop
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          PDF, DOC, DOCX, JPG, PNG, TXT (Max 5 files)
                        </span>
                      </label>
                    </div>

                    {/* Selected Files */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-semibold text-gray-700">Selected Files:</p>
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                          >
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-700">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-4 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsFormOpen(false);
                        setEditingEvent(null);
                        resetForm();
                      }}
                      className="px-6 py-2 rounded-xl border-gray-200 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {loading ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchTerm || filterType !== "all" || filterPriority !== "all" 
                  ? "No events match your filters" 
                  : "No events found"
                }
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterType !== "all" || filterPriority !== "all" 
                  ? "Try adjusting your search or filter criteria" 
                  : "Create your first event to get started!"
                }
              </p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <Card
                key={event._id}
                className="group hover:shadow-2xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getEventTypeIcon(event.eventType)}</div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2">
                          {event.eventTitle}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.eventType)}`}>
                            {event.eventType}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(event.priority)}`}>
                            {event.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(event)}
                        className="h-8 w-8 p-0 rounded-lg border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(event._id)}
                        className="h-8 w-8 p-0 rounded-lg border-gray-200 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.eventDescription && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {event.eventDescription}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">
                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                      </span>
                    </div>
                    
                    {!event.isAllDay && event.startTime && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-green-500" />
                        <span>
                          {formatTime(event.startTime)} - {formatTime(event.endTime || "")}
                        </span>
                      </div>
                    )}
                    
                    {event.venue && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span>{event.venue}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span>
                        {event.targetAudience === "all" ? "All Students" : "Specific Groups"}
                      </span>
                    </div>
                    
                    {event.attachments && event.attachments.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <FileText className="w-4 h-4 text-orange-500" />
                        <span>{event.attachments.length} attachment(s)</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademicCalendarModern;