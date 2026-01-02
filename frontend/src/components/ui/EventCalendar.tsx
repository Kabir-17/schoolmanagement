import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { eventAPI, IEvent } from '../../services/event.api';
import { useAuth } from '../../context/AuthContext';

interface Event {
  id: string;
  title: string;
  date: Date;
  time?: string;
  location?: string;
  type: 'academic' | 'extracurricular' | 'administrative' | 'holiday' | 'exam' | 'meeting' | 'announcement' | 'other';
  description?: string;
}

interface EventCalendarProps {
  onEventClick?: (event: Event) => void;
  className?: string;
}

const EventCalendar: React.FC<EventCalendarProps> = ({ onEventClick, className = '' }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [todaysEvents, setTodaysEvents] = useState<Event[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Convert API event to local event format
  const convertApiEvent = (apiEvent: IEvent): Event => ({
    id: apiEvent._id || '',
    title: apiEvent.title,
    date: new Date(apiEvent.date),
    time: apiEvent.time,
    location: apiEvent.location,
    type: apiEvent.type,
    description: apiEvent.description
  });

  // Fetch events for current month
  useEffect(() => {
    // Don't fetch events if user is not authenticated
    if (authLoading || !user) {
      setLoading(false);
      if (!authLoading && !user) {
        setError('Please log in to view events');
      }
      return;
    }

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await eventAPI.getEvents({ limit: 100 });
        
        if (response.success && response.data) {
          // Handle paginated response structure
          const apiEvents = response.data.events || [];
          const convertedEvents = apiEvents.map(convertApiEvent);
          setEvents(convertedEvents);
        } else {
          // No events is not an error
          setEvents([]);
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Please log in to view events');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view events');
        } else if (err.response?.status === 404) {
          // No events found is not an error
          setEvents([]);
        } else {
          setError('Unable to load events. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentMonth, user, authLoading]);

  // Fetch today's events separately for better performance
  useEffect(() => {
    // Don't fetch if user is not authenticated
    if (authLoading || !user) {
      return;
    }

    const fetchTodaysEvents = async () => {
      try {
        const response = await eventAPI.getTodaysEvents();
        if (response.success && response.data) {
          const convertedEvents = response.data.map(convertApiEvent);
          setTodaysEvents(convertedEvents);
        }
      } catch (err) {
        // Use filtered events from current month as fallback
        const today = new Date();
        const todayEvents = events.filter(event => isSameDay(event.date, today));
        setTodaysEvents(todayEvents);
      }
    };

    // Only fetch today's events if we're viewing current month
    const isCurrentMonth = isSameMonth(currentMonth, new Date());
    if (isCurrentMonth) {
      fetchTodaysEvents();
    } else {
      // Filter today's events from current events
      const today = new Date();
      const todayEvents = events.filter(event => isSameDay(event.date, today));
      setTodaysEvents(todayEvents);
    }
  }, [currentMonth, events, user, authLoading]);

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'exam': return 'bg-red-100 text-red-800 border-red-200';
      case 'holiday': return 'bg-green-100 text-green-800 border-green-200';
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'academic': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'extracurricular': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'administrative': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'announcement': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'other': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading events...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Events */}
      {!loading && !error && todaysEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
              Today's Events ({format(new Date(), 'MMM dd, yyyy')})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysEvents.map(event => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getEventTypeColor(event.type)}`}
                  onClick={() => onEventClick?.(event)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm opacity-80 mt-1">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm opacity-70">
                        {event.time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-medium uppercase px-2 py-1 rounded bg-white/50">
                      {event.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Today's Events Message */}
      {!loading && !error && todaysEvents.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
              Today's Events ({format(new Date(), 'MMM dd, yyyy')})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-gray-500">
              No events scheduled for today.
            </div>
          </CardContent>
        </Card>
      )}

     

      {/* Calendar */}
      {!loading && !error && (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600 border-b">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {monthDays.map(date => {
              const dayEvents = getEventsForDate(date);
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isTodayDate = isToday(date);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              
              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-[100px] p-1 border cursor-pointer hover:bg-gray-50 transition-colors ${
                    !isCurrentMonth ? 'text-gray-400 bg-gray-50/50' : ''
                  } ${isTodayDate ? 'bg-blue-50 border-blue-200' : ''} ${
                    isSelected ? 'ring-2 ring-blue-400' : ''
                  }`}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className={`text-sm font-semibold mb-1 ${isTodayDate ? 'text-blue-600' : ''}`}>
                    {format(date, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded truncate cursor-pointer ${getEventTypeColor(event.type)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Selected Date Events */}
      {!loading && !error && selectedDate && getEventsForDate(selectedDate).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Events for {format(selectedDate, 'MMM dd, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map(event => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getEventTypeColor(event.type)}`}
                  onClick={() => onEventClick?.(event)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm opacity-80 mt-1">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm opacity-70">
                        {event.time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-medium uppercase px-2 py-1 rounded bg-white/50">
                      {event.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventCalendar;