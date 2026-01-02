import { Schema, model, Types } from 'mongoose';
import {
  ISchedule,
  IScheduleDocument,
  IScheduleMethods,
  IScheduleModel,
  ISchedulePeriod,
  IWeeklySchedule,
  ITeacherWorkload
} from './schedule.interface';

// Period subdocument schema
const schedulePeriodSchema = new Schema<ISchedulePeriod>(
  {
    periodNumber: {
      type: Number,
      required: [true, 'Period number is required'],
      min: [1, 'Period number must be at least 1'],
      max: [10, 'Period number cannot exceed 10'],
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: function(this: ISchedulePeriod) { return !this.isBreak; },
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: function(this: ISchedulePeriod) { return !this.isBreak; },
    },
    roomNumber: {
      type: String,
      trim: true,
      maxlength: [10, 'Room number cannot exceed 10 characters'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'],
      validate: {
        validator: function (this: ISchedulePeriod, value: string) {
          if (!this.startTime || !value) {
            return true;
          }

          const [startHour, startMinute] = this.startTime.split(':').map(Number);
          const [endHour, endMinute] = value.split(':').map(Number);

          if (
            Number.isNaN(startHour) ||
            Number.isNaN(startMinute) ||
            Number.isNaN(endHour) ||
            Number.isNaN(endMinute)
          ) {
            return false;
          }

          const startTotal = startHour * 60 + startMinute;
          const endTotal = endHour * 60 + endMinute;
          return endTotal > startTotal;
        },
        message: 'End time must be after start time',
      },
    },
    isBreak: {
      type: Boolean,
      default: false,
    },
    breakType: {
      type: String,
      enum: ['short', 'lunch', 'long'],
      required: function(this: ISchedulePeriod) { return this.isBreak; },
    },
    breakDuration: {
      type: Number,
      min: [5, 'Break duration must be at least 5 minutes'],
      max: [60, 'Break duration cannot exceed 60 minutes'],
      required: function(this: ISchedulePeriod) { return this.isBreak; },
    },
  },
  {
    _id: false,
  }
);

// Main schedule schema
const scheduleSchema = new Schema<IScheduleDocument, IScheduleModel, IScheduleMethods>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School ID is required'],
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class', // Assuming a Class model exists
      required: [true, 'Class ID is required'],
      index: true,
    },
    grade: {
      type: Number,
      required: [true, 'Grade is required'],
      min: [1, 'Grade must be at least 1'],
      max: [12, 'Grade cannot exceed 12'],
      index: true,
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true,
      uppercase: true,
      match: [/^[A-Z]$/, 'Section must be a single uppercase letter'],
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      match: [/^\d{4}-\d{4}$/, 'Academic year must be in YYYY-YYYY format'],
      index: true,
    },
    dayOfWeek: {
      type: String,
      required: [true, 'Day of week is required'],
      enum: {
        values: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        message: 'Day of week must be one of: sunday, monday, tuesday, wednesday, thursday, friday, saturday',
      },
      lowercase: true,
      index: true,
    },
    periods: {
      type: [schedulePeriodSchema],
      validate: {
        validator: function (periods: ISchedulePeriod[]) {
          // Check for duplicate period numbers
          const periodNumbers = periods.map(p => p.periodNumber);
          return new Set(periodNumbers).size === periodNumbers.length;
        },
        message: 'Duplicate period numbers are not allowed',
      },
      required: [true, 'At least one period is required'],
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
scheduleSchema.methods.getTotalPeriodsCount = function (): number {
  return this.periods.length;
};

scheduleSchema.methods.getPeriodByNumber = function (periodNumber: number): ISchedulePeriod | undefined {
  return this.periods.find(period => period.periodNumber === periodNumber);
};

scheduleSchema.methods.getPeriodsForTeacher = function (teacherId: string): ISchedulePeriod[] {
  return this.periods.filter(period => 
    !period.isBreak && period.teacherId && period.teacherId.toString() === teacherId
  );
};

scheduleSchema.methods.getPeriodsForSubject = function (subjectId: string): ISchedulePeriod[] {
  return this.periods.filter(period => 
    !period.isBreak && period.subjectId && period.subjectId.toString() === subjectId
  );
};

scheduleSchema.methods.hasConflict = function (teacherId: string, periodNumber: number): boolean {
  return this.periods.some(period => 
    !period.isBreak && 
    period.teacherId && 
    period.teacherId.toString() === teacherId && 
    period.periodNumber === periodNumber
  );
};

scheduleSchema.methods.getBreakPeriods = function (): ISchedulePeriod[] {
  return this.periods.filter(period => period.isBreak);
};

scheduleSchema.methods.getClassPeriods = function (): ISchedulePeriod[] {
  return this.periods.filter(period => !period.isBreak);
};

scheduleSchema.methods.calculateDuration = function (startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
};

// Helper function for static methods
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
}

// Static methods
scheduleSchema.statics.findBySchool = function (schoolId: string): Promise<IScheduleDocument[]> {
  return this.find({ schoolId, isActive: true })
    .populate('classId')
    .populate({
      path: 'periods.subjectId',
      select: 'name code'
    })
    .populate({
      path: 'periods.teacherId',
      select: 'userId teacherId',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    })
    .sort({ grade: 1, section: 1, dayOfWeek: 1 });
};

scheduleSchema.statics.findByClass = function (
  schoolId: string,
  grade: number,
  section: string
): Promise<IScheduleDocument[]> {
  return this.find({ schoolId, grade, section, isActive: true })
    .populate({
      path: 'periods.subjectId',
      select: 'name code'
    })
    .populate({
      path: 'periods.teacherId',
      select: 'userId teacherId',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    })
    .sort({ dayOfWeek: 1 });
};

scheduleSchema.statics.findByTeacher = function (teacherId: string): Promise<IScheduleDocument[]> {
  return this.find({ 
    'periods.teacherId': teacherId,
    isActive: true 
  })
    .populate('classId')
    .populate({
      path: 'periods.subjectId',
      select: 'name code'
    })
    .sort({ grade: 1, section: 1, dayOfWeek: 1 });
};

scheduleSchema.statics.findBySubject = function (subjectId: string): Promise<IScheduleDocument[]> {
  return this.find({ 
    'periods.subjectId': subjectId,
    isActive: true 
  })
    .populate('classId')
    .populate({
      path: 'periods.teacherId',
      select: 'userId teacherId',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    })
    .sort({ grade: 1, section: 1, dayOfWeek: 1 });
};

scheduleSchema.statics.checkTeacherConflict = async function (
  teacherId: string,
  dayOfWeek: string,
  _periodNumber: number,
  startTime: string,
  endTime: string,
  excludeScheduleId?: string
): Promise<boolean> {
  let teacherObjectId: Types.ObjectId;
  try {
    teacherObjectId = new Types.ObjectId(teacherId);
  } catch {
    return false;
  }

  const query: any = {
    dayOfWeek: dayOfWeek.toLowerCase(),
    isActive: true,
    periods: {
      $elemMatch: {
        teacherId: teacherObjectId,
        isBreak: { $ne: true },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      },
    },
  };

  if (excludeScheduleId) {
    query._id = { $ne: excludeScheduleId };
  }

  const conflictingSchedule = await this.findOne(query);
  return !!conflictingSchedule;
};

scheduleSchema.statics.generateWeeklySchedule = async function (
  schoolId: string,
  grade: number,
  section: string
): Promise<IWeeklySchedule> {
  const schedules = await this.findByClass(schoolId, grade, section);
  
  const weeklySchedule: IWeeklySchedule = {
    classInfo: {
      grade,
      section,
      className: `Grade ${grade} - Section ${section}`
    },
    academicYear: schedules[0]?.academicYear || '',
    schedule: {},
    teachers: [],
    subjects: [],
    stats: {
      totalPeriodsPerWeek: 0,
      classPeriods: 0,
      breakPeriods: 0,
      uniqueTeachers: 0,
      uniqueSubjects: 0
    }
  };

  const teacherMap = new Map();
  const subjectMap = new Map();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  days.forEach(day => {
    weeklySchedule.schedule[day] = [];
  });

  schedules.forEach(schedule => {
    const daySchedule = schedule.periods
      .sort((a, b) => a.periodNumber - b.periodNumber)
      .map(period => {
        const periodResponse = {
          periodNumber: period.periodNumber,
          startTime: period.startTime,
          endTime: period.endTime,
          duration: calculateDuration(period.startTime, period.endTime),
          isBreak: period.isBreak || false,
          breakType: period.breakType,
          roomNumber: period.roomNumber
        };

        if (!period.isBreak && period.subjectId && period.teacherId) {
          // Add subject info
          (periodResponse as any).subject = {
            id: (period.subjectId as any)?._id?.toString() || period.subjectId.toString(),
            name: (period.subjectId as any)?.name || 'Unknown Subject',
            code: (period.subjectId as any)?.code || 'N/A'
          };

          // Add teacher info
          (periodResponse as any).teacher = {
            id: (period.teacherId as any)?._id?.toString() || period.teacherId.toString(),
            userId: (period.teacherId as any)?.userId?._id?.toString() || 'Unknown',
            teacherId: (period.teacherId as any)?.teacherId || 'Unknown',
            fullName: `${(period.teacherId as any)?.userId?.firstName || 'Unknown'} ${(period.teacherId as any)?.userId?.lastName || 'Teacher'}`
          };

          // Track teachers and subjects
          const teacherId = (period.teacherId as any)?._id?.toString() || period.teacherId.toString();
          const subjectId = (period.subjectId as any)?._id?.toString() || period.subjectId.toString();

          if (!teacherMap.has(teacherId)) {
            teacherMap.set(teacherId, {
              id: teacherId,
              name: (periodResponse as any).teacher.fullName,
              subjects: new Set(),
              totalPeriods: 0
            });
          }
          teacherMap.get(teacherId)!.subjects.add((period.subjectId as any)?.name || 'Unknown Subject');
          teacherMap.get(teacherId)!.totalPeriods++;

          if (!subjectMap.has(subjectId)) {
            subjectMap.set(subjectId, {
              id: subjectId,
              name: (period.subjectId as any)?.name || 'Unknown Subject',
              code: (period.subjectId as any)?.code || 'N/A',
              totalPeriods: 0,
              teachers: new Set()
            });
          }
          subjectMap.get(subjectId)!.totalPeriods++;
          subjectMap.get(subjectId)!.teachers.add((periodResponse as any).teacher.fullName);

          weeklySchedule.stats.classPeriods++;
        } else if (period.isBreak) {
          weeklySchedule.stats.breakPeriods++;
        }

        weeklySchedule.stats.totalPeriodsPerWeek++;
        return periodResponse;
      });

    weeklySchedule.schedule[schedule.dayOfWeek] = daySchedule;
  });

  // Convert maps to arrays
  weeklySchedule.teachers = Array.from(teacherMap.values()).map(teacher => ({
    ...teacher,
    subjects: Array.from(teacher.subjects)
  }));

  weeklySchedule.subjects = Array.from(subjectMap.values()).map(subject => ({
    ...subject,
    teachers: Array.from(subject.teachers)
  }));

  weeklySchedule.stats.uniqueTeachers = weeklySchedule.teachers.length;
  weeklySchedule.stats.uniqueSubjects = weeklySchedule.subjects.length;

  return weeklySchedule;
};

scheduleSchema.statics.getTeacherWorkload = async function (teacherId: string): Promise<ITeacherWorkload> {
  const schedules = await this.findByTeacher(teacherId);
  
  const Teacher = model('Teacher');
  const teacher = await Teacher.findById(teacherId).populate('userId', 'firstName lastName');
  
  const workload: ITeacherWorkload = {
    teacherId,
    teacherName: teacher ? `${teacher.userId.firstName} ${teacher.userId.lastName}` : 'Unknown Teacher',
    totalPeriods: 0,
    periodsPerDay: {
      sunday: 0,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0
    },
    subjects: [],
    timeSlots: []
  };

  const subjectMap = new Map();

  schedules.forEach(schedule => {
    const teacherPeriods = schedule.getPeriodsForTeacher(teacherId);
    
    teacherPeriods.forEach((period: any) => {
      workload.totalPeriods++;
      workload.periodsPerDay[schedule.dayOfWeek]++;

      // Track subjects
      const subjectId = period.subjectId._id.toString();
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subjectId,
          subjectName: period.subjectId.name,
          periods: 0,
          classes: new Map()
        });
      }
      
      const subjectData = subjectMap.get(subjectId);
      subjectData.periods++;
      
      const classKey = `${schedule.grade}-${schedule.section}`;
      if (!subjectData.classes.has(classKey)) {
        subjectData.classes.set(classKey, {
          grade: schedule.grade,
          section: schedule.section,
          periods: 0
        });
      }
      subjectData.classes.get(classKey).periods++;

      // Add time slot
      workload.timeSlots.push({
        dayOfWeek: schedule.dayOfWeek,
        periodNumber: period.periodNumber,
        startTime: period.startTime,
        endTime: period.endTime,
        subject: period.subjectId.name,
        class: `${schedule.grade}${schedule.section}`,
        roomNumber: period.roomNumber
      });
    });
  });

  // Convert subjects map to array
  workload.subjects = Array.from(subjectMap.values()).map(subject => ({
    ...subject,
    classes: Array.from(subject.classes.values())
  }));

  // Sort time slots
  const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  workload.timeSlots.sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
    if (dayDiff !== 0) return dayDiff;
    return a.periodNumber - b.periodNumber;
  });

  return workload;
};

// Helper method to calculate period duration
scheduleSchema.statics.calculateDuration = function (startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
};

// Indexes for performance
scheduleSchema.index({ schoolId: 1, grade: 1, section: 1, dayOfWeek: 1 }, { unique: true });
scheduleSchema.index({ schoolId: 1, academicYear: 1 });
scheduleSchema.index({ 'periods.teacherId': 1, dayOfWeek: 1 });
scheduleSchema.index({ 'periods.subjectId': 1 });
scheduleSchema.index({ classId: 1, dayOfWeek: 1 });

// Pre-save validation
scheduleSchema.pre('save', async function (next) {
  // Check for teacher conflicts
  for (const period of this.periods) {
    if (!period.isBreak && period.teacherId) {
      const hasConflict = await (this.constructor as IScheduleModel).checkTeacherConflict(
        period.teacherId.toString(),
        this.dayOfWeek,
        period.periodNumber,
        period.startTime,
        period.endTime,
        this._id?.toString()
      );
      
      if (hasConflict) {
        throw new Error(`Teacher has a conflict on ${this.dayOfWeek} period ${period.periodNumber}`);
      }
    }
  }

  // Validate time sequence
  const sortedPeriods = this.periods
    .filter(p => !p.isBreak)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  for (let i = 1; i < sortedPeriods.length; i++) {
    const prevPeriod = sortedPeriods[i - 1];
    const currentPeriod = sortedPeriods[i];
    
    if (prevPeriod.endTime >= currentPeriod.startTime) {
      throw new Error(`Time conflict between periods ${prevPeriod.periodNumber} and ${currentPeriod.periodNumber}`);
    }
  }

  next();
});

// Transform for JSON output
scheduleSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    (ret as any).className = `Grade ${ret.grade} - Section ${ret.section}`;
    (ret as any).totalPeriods = doc.getTotalPeriodsCount();
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

// Export the model
export const Schedule = model<IScheduleDocument, IScheduleModel>('Schedule', scheduleSchema);
