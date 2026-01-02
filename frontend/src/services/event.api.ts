import { api, ApiResponse } from './api-base';

// Event interfaces
export interface IEvent {
  _id?: string;
  title: string;
  description: string;
  type: 'academic' | 'extracurricular' | 'administrative' | 'holiday' | 'exam' | 'meeting' | 'announcement' | 'other';
  date: string; // ISO date string
  time?: string; // HH:MM format
  location?: string;
  targetAudience: {
    roles: ('admin' | 'teacher' | 'student' | 'parent')[];
    grades?: number[];
    sections?: string[];
    specific?: string[]; // specific user IDs
  };
  isActive: boolean;
  schoolId?: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface EventFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
  grade?: number;
  section?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

class EventAPI {
  private baseURL = '/events';

  // Get all events with optional filtering
  async getEvents(filters?: EventFilters): Promise<ApiResponse<{
    events: IEvent[];
    total: number;
    page: number;
    limit: number;
  }>> {
    const response = await api.get(this.baseURL, { params: filters });
    return response.data;
  }

  // Get today's events
  async getTodaysEvents(): Promise<ApiResponse<IEvent[]>> {
    const response = await api.get(`${this.baseURL}/today`);
    return response.data;
  }

  // Get upcoming events
  async getUpcomingEvents(limit?: number): Promise<ApiResponse<IEvent[]>> {
    const response = await api.get(`${this.baseURL}/upcoming`, { 
      params: { limit } 
    });
    return response.data;
  }

  // Get event by ID
  async getEventById(id: string): Promise<ApiResponse<IEvent>> {
    const response = await api.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  // Create new event (admin/teacher only)
  async createEvent(eventData: Omit<IEvent, '_id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<IEvent>> {
    const response = await api.post(this.baseURL, eventData);
    return response.data;
  }

  // Update event (admin/teacher only)
  async updateEvent(id: string, eventData: Partial<IEvent>): Promise<ApiResponse<IEvent>> {
    const response = await api.put(`${this.baseURL}/${id}`, eventData);
    return response.data;
  }

  // Delete event (admin/teacher only)
  async deleteEvent(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`${this.baseURL}/${id}`);
    return response.data;
  }

  // Get events for calendar view (month-based filtering)
  async getCalendarEvents(year: number, month: number): Promise<ApiResponse<{
    events: IEvent[];
    total: number;
    page: number;
    limit: number;
  }>> {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    
    return this.getEvents({
      startDate,
      endDate,
      limit: 100 // Get more events for calendar view
    });
  }
}

export const eventAPI = new EventAPI();