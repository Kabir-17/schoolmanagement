import { Schema, model } from 'mongoose';
import { IEvent, IEventDocument } from './event.interface';

const eventSchema = new Schema<IEventDocument>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  type: {
    type: String,
    required: true,
    enum: ['academic', 'extracurricular', 'administrative', 'holiday', 'exam', 'meeting', 'announcement', 'other']
  },
  schoolId: {
    type: Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  targetAudience: {
    roles: {
      type: [String],
      enum: ['admin', 'teacher', 'student', 'parent'],
      required: true,
      default: ['student', 'teacher', 'parent']
    },
    grades: {
      type: [Number],
      min: 1,
      max: 12
    },
    sections: {
      type: [String]
    },
    specificUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
eventSchema.index({ schoolId: 1, date: 1 });
eventSchema.index({ schoolId: 1, type: 1 });
eventSchema.index({ date: 1, isActive: 1 });
eventSchema.index({ 'targetAudience.roles': 1 });

// Virtual for ID
eventSchema.virtual('id').get(function() {
  return this._id?.toHexString();
});

eventSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  }
});

export const Event = model<IEventDocument>('Event', eventSchema);