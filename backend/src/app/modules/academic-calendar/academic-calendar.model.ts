import { Schema, model } from 'mongoose';
import {
  IAcademicCalendar,
  IAcademicCalendarDocument,
  IAcademicCalendarMethods,
  IAcademicCalendarModel,
  IMonthlyCalendar
} from './academic-calendar.interface';

// Specific audience subdocument schema
const specificAudienceSchema = new Schema(
  {
    grades: {
      type: [Number],
      validate: {
        validator: function (grades: number[]) {
          return grades.every(grade => grade >= 1 && grade <= 12);
        },
        message: 'All grades must be between 1 and 12',
      },
    },
    sections: {
      type: [String],
      validate: {
        validator: function (sections: string[]) {
          return sections.every(section => /^[A-Z]$/.test(section));
        },
        message: 'All sections must be single uppercase letters',
      },
    },
    teacherIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
    }],
    studentIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Student',
    }],
  },
  {
    _id: false,
  }
);

// Recurrence pattern subdocument schema
const recurrencePatternSchema = new Schema(
  {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: [true, 'Recurrence frequency is required'],
    },
    interval: {
      type: Number,
      required: [true, 'Recurrence interval is required'],
      min: [1, 'Interval must be at least 1'],
      max: [365, 'Interval cannot exceed 365'],
    },
    daysOfWeek: {
      type: [Number],
      validate: {
        validator: function (days: number[]) {
          return days.every(day => day >= 0 && day <= 6);
        },
        message: 'Days of week must be between 0 (Sunday) and 6 (Saturday)',
      },
    },
    dayOfMonth: {
      type: Number,
      min: [1, 'Day of month must be at least 1'],
      max: [31, 'Day of month cannot exceed 31'],
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (this: any, endDate: Date) {
          return !endDate || endDate > this.parent().startDate;
        },
        message: 'Recurrence end date must be after event start date',
      },
    },
    occurrences: {
      type: Number,
      min: [1, 'Occurrences must be at least 1'],
      max: [365, 'Occurrences cannot exceed 365'],
    },
  },
  {
    _id: false,
  }
);

// Main academic calendar schema
const academicCalendarSchema = new Schema<IAcademicCalendarDocument, IAcademicCalendarModel, IAcademicCalendarMethods>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School ID is required'],
      index: true,
    },
    eventTitle: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Event title cannot exceed 200 characters'],
      index: true,
    },
    eventDescription: {
      type: String,
      trim: true,
      maxlength: [1000, 'Event description cannot exceed 1000 characters'],
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: ['holiday', 'exam', 'meeting', 'event', 'sports', 'cultural', 'parent-teacher', 'other'],
        message: 'Event type must be one of: holiday, exam, meeting, event, sports, cultural, parent-teacher, other',
      },
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (this: IAcademicCalendar, endDate: Date) {
          return endDate >= this.startDate;
        },
        message: 'End date must be after or equal to start date',
      },
      index: true,
    },
    isAllDay: {
      type: Boolean,
      default: true,
    },
    startTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'],
      required: function (this: IAcademicCalendar) { return !this.isAllDay; },
    },
    endTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'],
      required: function (this: IAcademicCalendar) { return !this.isAllDay; },
    },
    venue: {
      type: String,
      trim: true,
      maxlength: [200, 'Venue cannot exceed 200 characters'],
    },
    targetAudience: {
      type: String,
      required: [true, 'Target audience is required'],
      enum: {
        values: ['all', 'students', 'teachers', 'parents', 'staff', 'specific'],
        message: 'Target audience must be one of: all, students, teachers, parents, staff, specific',
      },
      index: true,
    },
    specificAudience: {
      type: specificAudienceSchema,
      required: function (this: IAcademicCalendar) { return this.targetAudience === 'specific'; },
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: 'Priority must be one of: low, medium, high, urgent',
      },
      default: 'medium',
      index: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      type: recurrencePatternSchema,
      required: function (this: IAcademicCalendar) { return this.isRecurring; },
    },
    color: {
      type: String,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color code'],
      default: '#3498db',
    },
    attachments: {
      type: [String],
      validate: {
        validator: function (attachments: string[]) {
          return attachments.length <= 10;
        },
        message: 'Cannot have more than 10 attachments',
      },
    },
    notificationSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    notificationDate: {
      type: Date,
    },
    reminderDays: {
      type: [Number],
      default: [7, 3, 1],
      validate: {
        validator: function (days: number[]) {
          return days.every(day => day > 0 && day <= 365) && days.length <= 10;
        },
        message: 'Reminder days must be between 1-365 and cannot exceed 10 reminders',
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Instance methods
academicCalendarSchema.methods.isUpcoming = function (): boolean {
  const now = new Date();
  return this.startDate > now;
};

academicCalendarSchema.methods.isOngoing = function (): boolean {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
};

academicCalendarSchema.methods.isPast = function (): boolean {
  const now = new Date();
  return this.endDate < now;
};

academicCalendarSchema.methods.getDuration = function (): number {
  const timeDiff = this.endDate.getTime() - this.startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Days
};

academicCalendarSchema.methods.getDaysUntilEvent = function (): number {
  const now = new Date();
  const eventDate = this.startDate;
  const timeDiff = eventDate.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

academicCalendarSchema.methods.isTargetedTo = function (
  userType: string,
  userId?: string,
  grade?: number,
  section?: string
): boolean {
  if (this.targetAudience === 'all') {
    return true;
  }

  if (this.targetAudience === userType) {
    return true;
  }

  if (this.targetAudience === 'specific' && this.specificAudience) {
    const audience = this.specificAudience;
    
    if (userType === 'student' && userId && audience.studentIds?.some(id => id.toString() === userId)) {
      return true;
    }
    
    if (userType === 'teacher' && userId && audience.teacherIds?.some(id => id.toString() === userId)) {
      return true;
    }
    
    if (grade && audience.grades?.includes(grade)) {
      return true;
    }
    
    if (section && audience.sections?.includes(section)) {
      return true;
    }
  }

  return false;
};

academicCalendarSchema.methods.getFormattedDateRange = function (): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  const startStr = this.startDate.toLocaleDateString('en-US', options);
  
  if (this.startDate.toDateString() === this.endDate.toDateString()) {
    return startStr;
  }
  
  const endStr = this.endDate.toLocaleDateString('en-US', options);
  return `${startStr} - ${endStr}`;
};

academicCalendarSchema.methods.needsReminder = function (days: number): boolean {
  return this.reminderDays.includes(days) && this.getDaysUntilEvent() === days;
};

// Static methods
academicCalendarSchema.statics.findBySchool = function (schoolId: string): Promise<IAcademicCalendarDocument[]> {
  return this.find({ schoolId, isActive: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ startDate: 1 });
};

academicCalendarSchema.statics.findUpcoming = function (
  schoolId: string,
  days: number = 30
): Promise<IAcademicCalendarDocument[]> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);

  return this.find({
    schoolId,
    isActive: true,
    startDate: { $gte: now, $lte: futureDate },
  })
    .populate('createdBy', 'firstName lastName')
    .sort({ startDate: 1 });
};

academicCalendarSchema.statics.findByDateRange = function (
  schoolId: string,
  startDate: Date,
  endDate: Date
): Promise<IAcademicCalendarDocument[]> {
  return this.find({
    schoolId,
    isActive: true,
    $or: [
      {
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      },
    ],
  })
    .populate('createdBy', 'firstName lastName')
    .sort({ startDate: 1 });
};

academicCalendarSchema.statics.findByEventType = function (
  schoolId: string,
  eventType: string
): Promise<IAcademicCalendarDocument[]> {
  return this.find({ schoolId, eventType, isActive: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ startDate: 1 });
};

academicCalendarSchema.statics.findForUser = function (
  schoolId: string,
  userType: string,
  userId?: string,
  grade?: number,
  section?: string
): Promise<IAcademicCalendarDocument[]> {
  const query: any = {
    schoolId,
    isActive: true,
    $or: [
      { targetAudience: 'all' },
      { targetAudience: userType },
    ],
  };

  // Add specific audience conditions
  if (userId || grade || section) {
    const specificConditions: any = {};
    
    if (userType === 'student' && userId) {
      specificConditions['specificAudience.studentIds'] = userId;
    }
    
    if (userType === 'teacher' && userId) {
      specificConditions['specificAudience.teacherIds'] = userId;
    }
    
    if (grade) {
      specificConditions['specificAudience.grades'] = grade;
    }
    
    if (section) {
      specificConditions['specificAudience.sections'] = section;
    }

    query.$or.push({
      targetAudience: 'specific',
      ...specificConditions,
    });
  }

  return this.find(query)
    .populate('createdBy', 'firstName lastName')
    .sort({ startDate: 1 });
};

academicCalendarSchema.statics.getMonthlyCalendar = async function (
  schoolId: string,
  year: number,
  month: number
): Promise<IMonthlyCalendar> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const events = await this.findByDateRange(schoolId, startDate, endDate);
  
  const monthlyCalendar: IMonthlyCalendar = {
    year,
    month,
    monthName: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' }),
    events: [],
    summary: {
      totalEvents: events.length,
      holidays: 0,
      exams: 0,
      meetings: 0,
      celebrations: 0,
      sports: 0,
      academic: 0,
      other: 0,
    },
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    daysInMonth: endDate.getDate(),
    startDayOfWeek: startDate.getDay(),
  };

  // Group events by date
  const eventsByDate = new Map();
  
  for (let day = 1; day <= monthlyCalendar.daysInMonth; day++) {
    eventsByDate.set(day, []);
  }

  events.forEach(event => {
    // Count by event type
    monthlyCalendar.summary[event.eventType as keyof typeof monthlyCalendar.summary]++;
    
    // Add event to appropriate dates
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    
    for (let day = 1; day <= monthlyCalendar.daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day);
      
      if (currentDate >= eventStart && currentDate <= eventEnd) {
        eventsByDate.get(day).push({
          id: event._id.toString(),
          eventTitle: event.eventTitle,
          eventType: event.eventType,
          color: event.color,
          isAllDay: event.isAllDay,
          startTime: event.startTime,
          endTime: event.endTime,
        });
      }
    }
  });

  // Convert map to array
  monthlyCalendar.events = Array.from(eventsByDate.entries()).map(([date, events]) => ({
    date,
    events,
  }));

  return monthlyCalendar;
};

academicCalendarSchema.statics.getHolidays = function (
  schoolId: string,
  startDate: Date,
  endDate: Date
): Promise<IAcademicCalendarDocument[]> {
  return this.find({
    schoolId,
    eventType: 'holiday',
    isActive: true,
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  }).sort({ startDate: 1 });
};

academicCalendarSchema.statics.getEventsNeedingReminders = function (): Promise<IAcademicCalendarDocument[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const maxReminderDays = new Date();
  maxReminderDays.setDate(today.getDate() + 30); // Check 30 days ahead

  return this.find({
    isActive: true,
    startDate: { $gte: today, $lte: maxReminderDays },
    notificationSent: false,
  }).populate('createdBy', 'firstName lastName');
};

// Indexes for performance
academicCalendarSchema.index({ schoolId: 1, startDate: 1 });
academicCalendarSchema.index({ schoolId: 1, eventType: 1 });
academicCalendarSchema.index({ schoolId: 1, targetAudience: 1 });
academicCalendarSchema.index({ startDate: 1, endDate: 1 });
academicCalendarSchema.index({ 'specificAudience.grades': 1 });
academicCalendarSchema.index({ 'specificAudience.sections': 1 });
academicCalendarSchema.index({ 'specificAudience.teacherIds': 1 });
academicCalendarSchema.index({ 'specificAudience.studentIds': 1 });
academicCalendarSchema.index({ notificationSent: 1, startDate: 1 });

// Pre-save validation
academicCalendarSchema.pre('save', function (next) {
  // Validate time fields for non-all-day events
  if (!this.isAllDay) {
    if (!this.startTime || !this.endTime) {
      return next(new Error('Start time and end time are required for non-all-day events'));
    }

    // Convert times to minutes for comparison
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // For same-day events, end time should be after start time
    if (this.startDate.toDateString() === this.endDate.toDateString() && endMinutes <= startMinutes) {
      return next(new Error('End time must be after start time for same-day events'));
    }
  }

  // Validate recurrence pattern
  if (this.isRecurring && this.recurrencePattern) {
    const pattern = this.recurrencePattern;
    
    if (pattern.frequency === 'weekly' && (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0)) {
      return next(new Error('Days of week are required for weekly recurrence'));
    }
    
    if (pattern.frequency === 'monthly' && !pattern.dayOfMonth) {
      return next(new Error('Day of month is required for monthly recurrence'));
    }
    
    if (!pattern.endDate && !pattern.occurrences) {
      return next(new Error('Either end date or number of occurrences is required for recurring events'));
    }
  }

  // Sort reminder days
  if (this.reminderDays && this.reminderDays.length > 0) {
    this.reminderDays.sort((a, b) => b - a); // Sort in descending order
  }

  next();
});

// Transform for JSON output
academicCalendarSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    (ret as any).duration = doc.getDuration();
    (ret as any).daysUntilEvent = doc.getDaysUntilEvent();
    (ret as any).formattedDateRange = doc.getFormattedDateRange();
    
    if (doc.isUpcoming()) {
      (ret as any).status = 'upcoming';
    } else if (doc.isOngoing()) {
      (ret as any).status = 'ongoing';
    } else {
      (ret as any).status = 'past';
    }
    
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

// Export the model
export const AcademicCalendar = model<IAcademicCalendarDocument, IAcademicCalendarModel>(
  'AcademicCalendar',
  academicCalendarSchema
);