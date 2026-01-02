import { Schema, model } from 'mongoose';
import config from '../../config';
import {
  ITeacher,
  ITeacherDocument,
  ITeacherMethods,
  ITeacherModel,
  ITeacherPhoto,
  ITeacherPhotoDocument,
} from './teacher.interface';

// Teacher Photo schema
const teacherPhotoSchema = new Schema<ITeacherPhotoDocument>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher ID is required'],
      index: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School ID is required'],
      index: true,
    },
    photoPath: {
      type: String,
      required: [true, 'Photo path is required'],
    },
    photoNumber: {
      type: Number,
      required: [true, 'Photo number is required'],
      min: [1, 'Photo number must be at least 1'],
      max: [20, 'Photo number cannot exceed 20'],
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
    },
    originalName: {
      type: String,
      required: [true, 'Original filename is required'],
    },
    mimetype: {
      type: String,
      required: [true, 'File mimetype is required'],
      validate: {
        validator: function (mimetype: string) {
          return ['image/jpeg', 'image/jpg', 'image/png'].includes(mimetype);
        },
        message: 'Only JPEG and PNG images are allowed',
      },
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      max: [config.max_file_size, `File size cannot exceed ${config.max_file_size} bytes`],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Teacher schema definition
const teacherSchema = new Schema<ITeacherDocument, ITeacherModel, ITeacherMethods>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School ID is required'],
      index: true,
    },
    teacherId: {
      type: String,
      required: [true, 'Teacher ID is required'],
      unique: true,
      trim: true,
      match: [/^(SCH\d{3,4}-TCH-\d{4}-\d{3}|TCH-\d{4}-\d{3})$/, 'Teacher ID must follow format SCH001-TCH-YYYY-XXX or TCH-YYYY-XXX'],
      index: true,
    },
    employeeId: {
      type: String,
      trim: true,
      index: true,
    },
    subjects: {
      type: [String],
      required: [true, 'At least one subject is required'],
      validate: {
        validator: function (subjects: string[]) {
          return subjects.length > 0;
        },
        message: 'At least one subject must be specified',
      },
    },
    grades: {
      type: [Number],
      required: [true, 'At least one grade is required'],
      validate: {
        validator: function (grades: number[]) {
          return grades.length > 0 && grades.every(grade => grade >= 1 && grade <= 12);
        },
        message: 'At least one grade must be specified, and all grades must be between 1 and 12',
      },
      index: true,
    },
    sections: {
      type: [String],
      required: [true, 'At least one section is required'],
      validate: {
        validator: function (sections: string[]) {
          return sections.length > 0 && sections.every(section => /^[A-Z]$/.test(section));
        },
        message: 'At least one section must be specified, and all sections must be single uppercase letters',
      },
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      enum: {
        values: [
          'Principal',
          'Vice Principal',
          'Head Teacher',
          'Senior Teacher',
          'Teacher',
          'Assistant Teacher',
          'Subject Coordinator',
          'Sports Teacher',
          'Music Teacher',
          'Art Teacher',
          'Librarian',
          'Lab Assistant',
        ],
        message: 'Invalid designation',
      },
      index: true,
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: {
        values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        message: 'Invalid blood group',
      },
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required'],
      validate: {
        validator: function (dob: Date) {
          const today = new Date();
          const minAge = new Date(today.getFullYear() - 65, today.getMonth(), today.getDate());
          const maxAge = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate());
          return dob >= minAge && dob <= maxAge;
        },
        message: 'Teacher age must be between 21 and 65 years',
      },
    },
    joinDate: {
      type: Date,
      required: [true, 'Join date is required'],
      default: Date.now,
    },
    qualifications: {
      type: [
        {
          degree: {
            type: String,
            required: [true, 'Degree is required'],
            trim: true,
          },
          institution: {
            type: String,
            required: [true, 'Institution is required'],
            trim: true,
          },
          year: {
            type: Number,
            required: [true, 'Year is required'],
            min: [1980, 'Year must be after 1980'],
            max: [new Date().getFullYear(), 'Year cannot be in the future'],
          },
          specialization: {
            type: String,
            trim: true,
          },
        },
      ],
      required: [true, 'At least one qualification is required'],
      validate: {
        validator: function (qualifications: any[]) {
          return qualifications.length > 0;
        },
        message: 'At least one qualification must be provided',
      },
    },
    experience: {
      totalYears: {
        type: Number,
        required: [true, 'Total years of experience is required'],
        min: [0, 'Experience cannot be negative'],
        max: [45, 'Experience cannot exceed 45 years'],
      },
      previousSchools: {
        type: [
          {
            schoolName: {
              type: String,
              required: true,
              trim: true,
            },
            position: {
              type: String,
              required: true,
              trim: true,
            },
            duration: {
              type: String,
              required: true,
              trim: true,
            },
            fromDate: {
              type: Date,
              required: true,
            },
            toDate: {
              type: Date,
              required: true,
            },
          },
        ],
        default: [],
      },
    },
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
      },
      zipCode: {
        type: String,
        required: [true, 'Zip code is required'],
        trim: true,
        match: [/^\d{5,6}$/, 'Invalid zip code format'],
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
      },
    },
    emergencyContact: {
      name: {
        type: String,
        required: [true, 'Emergency contact name is required'],
        trim: true,
      },
      relationship: {
        type: String,
        required: [true, 'Emergency contact relationship is required'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Emergency contact phone is required'],
        match: [/^\+?[\d\s\-\(\)]+$/, 'Invalid emergency contact phone format'],
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid emergency contact email format'],
      },
    },
    salary: {
      basic: {
        type: Number,
        min: [0, 'Basic salary cannot be negative'],
      },
      allowances: {
        type: Number,
        default: 0,
        min: [0, 'Allowances cannot be negative'],
      },
      deductions: {
        type: Number,
        default: 0,
        min: [0, 'Deductions cannot be negative'],
      },
      netSalary: {
        type: Number,
        min: [0, 'Net salary cannot be negative'],
      },
    },
    isClassTeacher: {
      type: Boolean,
      default: false,
      index: true,
    },
    classTeacherFor: {
      grade: {
        type: Number,
        min: [1, 'Grade must be at least 1'],
        max: [12, 'Grade cannot exceed 12'],
      },
      section: {
        type: String,
        match: [/^[A-Z]$/, 'Section must be a single uppercase letter'],
      },
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
teacherSchema.methods.generateTeacherId = function (): string {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 900) + 100; // 3-digit random number
  return `TCH-${year}-${sequence}`;
};

teacherSchema.methods.getAgeInYears = function (): number {
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

teacherSchema.methods.getFullName = function (): string {
  // Type assertion to handle both ObjectId and populated User
  const userId = this.userId as any;
  return `${userId?.firstName || ''} ${userId?.lastName || ''}`.trim();
};

teacherSchema.methods.getFolderPath = function (): string {
  // Format: teacher@firstname@age@bloodgroup@joindate@teacherID
  const userId = this.userId as any || {};
  const age = this.getAgeInYears();
  const joinDate = this.joinDate.toISOString().split('T')[0];

  return `teacher@${userId.firstName || 'unknown'}@${age}@${this.bloodGroup}@${joinDate}@${this.teacherId}`;
};

teacherSchema.methods.canUploadMorePhotos = async function (): Promise<boolean> {
  const photoCount = await TeacherPhoto.countDocuments({ teacherId: this._id });
  return photoCount < config.max_photos_per_student; // Using same limit as students
};

teacherSchema.methods.getTotalExperience = function (): number {
  return this.experience.totalYears;
};

teacherSchema.methods.getNetSalary = function (): number {
  if (!this.salary) return 0;
  const basic = this.salary.basic || 0;
  const allowances = this.salary.allowances || 0;
  const deductions = this.salary.deductions || 0;
  return basic + allowances - deductions;
};

// Static methods
teacherSchema.statics.findBySchool = function (schoolId: string): Promise<ITeacherDocument[]> {
  return this.find({ schoolId, isActive: true })
    .populate('userId', 'firstName lastName username email phone')
    .populate('schoolId', 'name')
    .sort({ joinDate: -1 });
};

teacherSchema.statics.findBySubject = function (
  schoolId: string,
  subject: string
): Promise<ITeacherDocument[]> {
  return this.find({ schoolId, subjects: subject, isActive: true })
    .populate('userId', 'firstName lastName username email phone')
    .sort({ designation: 1, joinDate: -1 });
};

teacherSchema.statics.findByGrade = function (
  schoolId: string,
  grade: number
): Promise<ITeacherDocument[]> {
  return this.find({ schoolId, grades: grade, isActive: true })
    .populate('userId', 'firstName lastName username email phone')
    .sort({ designation: 1, joinDate: -1 });
};

teacherSchema.statics.findClassTeachers = function (schoolId: string): Promise<ITeacherDocument[]> {
  return this.find({ schoolId, isClassTeacher: true, isActive: true })
    .populate('userId', 'firstName lastName username email phone')
    .sort({ 'classTeacherFor.grade': 1, 'classTeacherFor.section': 1 });
};

teacherSchema.statics.findByTeacherId = function (teacherId: string): Promise<ITeacherDocument | null> {
  return this.findOne({ teacherId })
    .populate('userId', 'firstName lastName username email phone')
    .populate('schoolId', 'name');
};

teacherSchema.statics.generateNextTeacherId = async function (
  schoolId: string,
  year: number = new Date().getFullYear()
): Promise<string> {
  const prefix = `TCH-${year}-`;

  // Find the highest sequence number for this school and year
  const lastTeacher = await this.findOne({
    schoolId,
    teacherId: { $regex: `^${prefix}` }
  }).sort({ teacherId: -1 });

  let nextSequence = 1;
  if (lastTeacher) {
    const lastSequence = parseInt(lastTeacher.teacherId.split('-')[2]);
    nextSequence = lastSequence + 1;
  }

  const sequenceStr = nextSequence.toString().padStart(3, '0');
  return `${prefix}${sequenceStr}`;
};

// Indexes for performance
teacherSchema.index({ schoolId: 1, isActive: 1 });
teacherSchema.index({ schoolId: 1, subjects: 1 });
teacherSchema.index({ schoolId: 1, grades: 1 });
teacherSchema.index({ schoolId: 1, isClassTeacher: 1 });
teacherSchema.index({ joinDate: -1 });
teacherSchema.index({ designation: 1 });

// TeacherPhoto indexes
teacherPhotoSchema.index({ teacherId: 1, photoNumber: 1 }, { unique: true });
teacherPhotoSchema.index({ schoolId: 1 });

// Pre-save middleware for Teacher
teacherSchema.pre('save', async function (next) {
  // Generate teacher ID if not provided
  if (this.isNew && !this.teacherId) {
    this.teacherId = await (this.constructor as ITeacherModel).generateNextTeacherId(
      this.schoolId.toString()
    );
  }

  // Calculate net salary if salary is provided
  if (this.salary) {
    const basic = this.salary.basic || 0;
    const allowances = this.salary.allowances || 0;
    const deductions = this.salary.deductions || 0;
    this.salary.netSalary = basic + allowances - deductions;
  }

  // Validate class teacher assignment
  if (this.isClassTeacher && this.classTeacherFor) {
    // Check if another teacher is already assigned to this class
    const existingClassTeacher = await (this.constructor as any).findOne({
      _id: { $ne: this._id },
      schoolId: this.schoolId,
      isClassTeacher: true,
      'classTeacherFor.grade': this.classTeacherFor.grade,
      'classTeacherFor.section': this.classTeacherFor.section,
    });

    if (existingClassTeacher) {
      const error = new Error(`Class teacher already assigned for Grade ${this.classTeacherFor.grade} Section ${this.classTeacherFor.section}`);
      return next(error);
    }
  }

  // Clear class teacher assignment if isClassTeacher is false
  if (!this.isClassTeacher) {
    this.classTeacherFor = undefined;
  }

  next();
});

// Pre-delete middleware
teacherSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  // Delete associated photos when teacher is deleted
  await TeacherPhoto.deleteMany({ teacherId: this._id });
  next();
});

// Virtual for photos
teacherSchema.virtual('photos', {
  ref: 'TeacherPhoto',
  localField: '_id',
  foreignField: 'teacherId',
  options: { sort: { photoNumber: 1 } },
});

// Virtual for photo count
teacherSchema.virtual('photoCount', {
  ref: 'TeacherPhoto',
  localField: '_id',
  foreignField: 'teacherId',
  count: true,
});

// Ensure virtual fields are serialized
teacherSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

teacherSchema.set('toObject', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

teacherPhotoSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

// Export the models
export const Teacher = model<ITeacherDocument, ITeacherModel>('Teacher', teacherSchema);
export const TeacherPhoto = model<ITeacherPhotoDocument>('TeacherPhoto', teacherPhotoSchema);