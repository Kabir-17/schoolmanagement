import { Types, Document } from 'mongoose';

export interface IEvent {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  location?: string;
  type: 'exam' | 'holiday' | 'meeting' | 'event' | 'assignment';
  schoolId: Types.ObjectId;
  createdBy: Types.ObjectId;
  targetAudience: {
    roles: ('admin' | 'teacher' | 'student' | 'parent')[];
    grades?: number[];
    sections?: string[];
    specificUsers?: Types.ObjectId[];
  };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEventDocument extends IEvent, Document {
  _id: Types.ObjectId;
}

export interface IEventFilters {
  schoolId?: Types.ObjectId;
  type?: string;
  date?: {
    $gte?: Date;
    $lte?: Date;
  };
  isActive?: boolean;
  'targetAudience.roles'?: { $in: string[] };
  'targetAudience.grades'?: { $in: number[] };
  'targetAudience.sections'?: { $in: string[] };
}