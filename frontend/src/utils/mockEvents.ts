// Mock events data for testing the EventCalendar component
export const generateMockEvents = () => {
  const events = [];
  const today = new Date();
  
  // Today's events
  events.push({
    id: '1',
    title: 'Math Exam - Grade 10',
    date: new Date(today),
    time: '09:00 AM',
    location: 'Room 101',
    type: 'exam' as const,
    description: 'Final semester mathematics examination for Grade 10 students'
  });

  events.push({
    id: '2',
    title: 'Science Project Submission',
    date: new Date(today),
    time: '11:30 AM',
    location: 'Science Lab',
    type: 'assignment' as const,
    description: 'Deadline for Grade 9 science project submissions'
  });

  events.push({
    id: '3',
    title: 'Parent-Teacher Meeting',
    date: new Date(today),
    time: '02:00 PM',
    location: 'Main Hall',
    type: 'meeting' as const,
    description: 'Monthly parent-teacher conference for all grades'
  });

  // Tomorrow's events
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  events.push({
    id: '4',
    title: 'National Holiday',
    date: new Date(tomorrow),
    type: 'holiday' as const,
    description: 'Independence Day - School Closed'
  });

  // This week's events
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() + 3);
  
  events.push({
    id: '5',
    title: 'English Literature Quiz',
    date: new Date(thisWeek),
    time: '10:00 AM',
    location: 'Room 205',
    type: 'exam' as const,
    description: 'Weekly quiz for Grade 11 English Literature'
  });

  events.push({
    id: '6',
    title: 'Sports Day',
    date: new Date(thisWeek),
    time: '08:00 AM',
    location: 'School Ground',
    type: 'event' as const,
    description: 'Annual inter-house sports competition'
  });

  // Next week's events
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  events.push({
    id: '7',
    title: 'Chemistry Lab Practical',
    date: new Date(nextWeek),
    time: '01:00 PM',
    location: 'Chemistry Lab',
    type: 'exam' as const,
    description: 'Practical examination for Grade 12 Chemistry'
  });

  events.push({
    id: '8',
    title: 'Staff Meeting',
    date: new Date(nextWeek),
    time: '04:00 PM',
    location: 'Conference Room',
    type: 'meeting' as const,
    description: 'Monthly staff coordination meeting'
  });

  // More events for the month
  for (let i = 1; i <= 15; i++) {
    const eventDate = new Date(today);
    eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 30));
    
    const eventTypes: ('exam' | 'meeting' | 'event' | 'assignment')[] = ['exam', 'meeting', 'event', 'assignment'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    const eventTitles = {
      exam: ['Physics Test', 'History Quiz', 'Biology Practical', 'Math Assessment', 'Geography Exam'],
      meeting: ['Department Meeting', 'Principal Review', 'Grade Meeting', 'Curriculum Planning'],
      event: ['Art Exhibition', 'Music Concert', 'Drama Performance', 'Cultural Day', 'Science Fair'],
      assignment: ['Essay Submission', 'Project Deadline', 'Assignment Due', 'Report Submission']
    };
    
    const titles = eventTitles[eventType as keyof typeof eventTitles];
    const title = titles[Math.floor(Math.random() * titles.length)];
    
    events.push({
      id: `mock-${i + 10}`,
      title: `${title} - Grade ${5 + Math.floor(Math.random() * 8)}`,
      date: eventDate,
      time: `${9 + Math.floor(Math.random() * 6)}:${Math.random() > 0.5 ? '00' : '30'} ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
      location: `Room ${100 + Math.floor(Math.random() * 50)}`,
      type: eventType,
      description: `Scheduled ${eventType} for students`
    });
  }

  return events;
};

// Role-specific event filtering
export const filterEventsByRole = (events: any[], _role: string) => {
  // In a real app, events would have role-specific visibility
  // For now, we'll show all events to all roles
  // TODO: Implement role-based filtering when needed
  return events;
};

export const getTodaysEvents = (events: any[]) => {
  const today = new Date();
  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.toDateString() === today.toDateString();
  });
};