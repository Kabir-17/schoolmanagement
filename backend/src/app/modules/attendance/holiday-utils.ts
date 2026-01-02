import { Types } from 'mongoose';
import { fromZonedTime } from 'date-fns-tz';
import config from '../../config';
import { Event } from '../event/event.model';

export interface HolidayQueryOptions {
  schoolId: Types.ObjectId | string;
  dateKey: string;
  timezone?: string;
  grade?: number;
  section?: string;
}

const normalizeSection = (value?: string | null): string =>
  (value ?? '').trim().toUpperCase();

const appliesToClass = (event: any, grade?: number, section?: string): boolean => {
  const audience = event.targetAudience || {};

  const roles: string[] = Array.isArray(audience.roles) && audience.roles.length
    ? audience.roles
    : ['student', 'teacher', 'parent'];

  if (!roles.includes('student') && !roles.includes('teacher')) {
    return false;
  }

  const grades: number[] = Array.isArray(audience.grades)
    ? audience.grades
    : [];
  const sections: string[] = Array.isArray(audience.sections)
    ? audience.sections.map(normalizeSection).filter(Boolean)
    : [];

  const gradeMatches =
    grade === undefined ||
    grade === null ||
    grades.length === 0 ||
    grades.includes(grade);

  const sectionMatches =
    !section ||
    sections.length === 0 ||
    sections.includes(normalizeSection(section));

  if (!gradeMatches || !sectionMatches) {
    return false;
  }

  const specificUsers: Types.ObjectId[] = Array.isArray(audience.specificUsers)
    ? audience.specificUsers
    : [];

  if (specificUsers.length > 0) {
    return false;
  }

  return true;
};

export const findHolidayEventsForClass = async (
  options: HolidayQueryOptions
) => {
  const {
    schoolId,
    dateKey,
    timezone = config.school_timezone || 'UTC',
    grade,
    section,
  } = options;

  const startOfDayUtc = fromZonedTime(
    new Date(`${dateKey}T00:00:00`),
    timezone
  );
  const endOfDayUtc = fromZonedTime(
    new Date(`${dateKey}T23:59:59.999`),
    timezone
  );

  const events = await Event.find({
    schoolId: new Types.ObjectId(schoolId),
    isActive: true,
    type: 'holiday',
    date: {
      $gte: startOfDayUtc,
      $lte: endOfDayUtc,
    },
  })
    .select('targetAudience title date')
    .lean();

  return events.filter((event) => appliesToClass(event, grade, section));
};

export const isHolidayForClassOnDate = async (
  options: HolidayQueryOptions
): Promise<boolean> => {
  const holidays = await findHolidayEventsForClass(options);
  return holidays.length > 0;
};
