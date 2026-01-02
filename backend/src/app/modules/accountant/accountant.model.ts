import { Schema, model } from 'mongoose';
import config from '../../config';
import {
  IAccountant,
  IAccountantDocument,
  IAccountantMethods,
  IAccountantModel,
  IAccountantPhoto,
  IAccountantPhotoDocument,
} from './accountant.interface';

// Accountant Photo schema
const accountantPhotoSchema = new Schema<IAccountantPhotoDocument>(
  {
    accountantId: {
      type: Schema.Types.ObjectId,
      ref: 'Accountant',
      required: [true, 'Accountant ID is required'],
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

// Accountant schema definition
const accountantSchema = new Schema<IAccountantDocument, IAccountantModel, IAccountantMethods>(
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
    accountantId: {
      type: String,
      required: [true, 'Accountant ID is required'],
      unique: true,
      trim: true,
      match: [/^(SCH\d{3,4}-ACC-\d{4}-\d{3}|ACC-\d{4}-\d{3})$/, 'Accountant ID must follow format SCH001-ACC-YYYY-XXX or ACC-YYYY-XXX'],
      index: true,
    },
    employeeId: {
      type: String,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: {
        values: [
          'Finance',
          'Payroll',
          'Accounts Payable',
          'Accounts Receivable',
          'Budget Management',
          'Financial Reporting',
          'Audit',
          'Tax',
          'General Accounting',
        ],
        message: 'Invalid department',
      },
      index: true,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      enum: {
        values: [
          'Chief Financial Officer',
          'Finance Manager',
          'Chief Accountant',
          'Senior Accountant',
          'Accountant',
          'Junior Accountant',
          'Accounts Assistant',
          'Payroll Officer',
          'Financial Analyst',
          'Auditor',
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
        message: 'Accountant age must be between 21 and 65 years',
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
      previousOrganizations: {
        type: [
          {
            organizationName: {
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
    responsibilities: {
      type: [String],
      default: [],
    },
    certifications: {
      type: [String],
      default: [],
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
accountantSchema.methods.generateAccountantId = function (): string {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 900) + 100; // 3-digit random number
  return `ACC-${year}-${sequence}`;
};

accountantSchema.methods.getAgeInYears = function (): number {
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

accountantSchema.methods.getFullName = function (): string {
  // Type assertion to handle both ObjectId and populated User
  const userId = this.userId as any;
  return `${userId?.firstName || ''} ${userId?.lastName || ''}`.trim();
};

accountantSchema.methods.getFolderPath = function (): string {
  // Format: accountant@firstname@age@bloodgroup@joindate@accountantID
  const userId = this.userId as any || {};
  const age = this.getAgeInYears();
  const joinDate = this.joinDate.toISOString().split('T')[0];

  return `accountant@${userId.firstName || 'unknown'}@${age}@${this.bloodGroup}@${joinDate}@${this.accountantId}`;
};

accountantSchema.methods.canUploadMorePhotos = async function (): Promise<boolean> {
  const photoCount = await AccountantPhoto.countDocuments({ accountantId: this._id });
  return photoCount < config.max_photos_per_student; // Using same limit
};

accountantSchema.methods.getTotalExperience = function (): number {
  return this.experience.totalYears;
};

accountantSchema.methods.getNetSalary = function (): number {
  if (!this.salary) return 0;
  const basic = this.salary.basic || 0;
  const allowances = this.salary.allowances || 0;
  const deductions = this.salary.deductions || 0;
  return basic + allowances - deductions;
};

// Static methods
accountantSchema.statics.findBySchool = function (schoolId: string): Promise<IAccountantDocument[]> {
  return this.find({ schoolId, isActive: true })
    .populate('userId', 'firstName lastName username email phone')
    .populate('schoolId', 'name')
    .sort({ joinDate: -1 });
};

accountantSchema.statics.findByDepartment = function (
  schoolId: string,
  department: string
): Promise<IAccountantDocument[]> {
  return this.find({ schoolId, department, isActive: true })
    .populate('userId', 'firstName lastName username email phone')
    .sort({ designation: 1, joinDate: -1 });
};

accountantSchema.statics.findByAccountantId = function (accountantId: string): Promise<IAccountantDocument | null> {
  return this.findOne({ accountantId })
    .populate('userId', 'firstName lastName username email phone')
    .populate('schoolId', 'name');
};

accountantSchema.statics.generateNextAccountantId = async function (
  schoolId: string,
  year: number = new Date().getFullYear()
): Promise<string> {
  const prefix = `ACC-${year}-`;

  // Find the highest sequence number for this school and year
  const lastAccountant = await this.findOne({
    schoolId,
    accountantId: { $regex: `^${prefix}` }
  }).sort({ accountantId: -1 });

  let nextSequence = 1;
  if (lastAccountant) {
    const lastSequence = parseInt(lastAccountant.accountantId.split('-')[2]);
    nextSequence = lastSequence + 1;
  }

  const sequenceStr = nextSequence.toString().padStart(3, '0');
  return `${prefix}${sequenceStr}`;
};

// Indexes for performance
accountantSchema.index({ schoolId: 1, isActive: 1 });
accountantSchema.index({ schoolId: 1, department: 1 });
accountantSchema.index({ joinDate: -1 });
accountantSchema.index({ designation: 1 });

// AccountantPhoto indexes
accountantPhotoSchema.index({ accountantId: 1, photoNumber: 1 }, { unique: true });
accountantPhotoSchema.index({ schoolId: 1 });

// Pre-save middleware for Accountant
accountantSchema.pre('save', async function (next) {
  // Generate accountant ID if not provided
  if (this.isNew && !this.accountantId) {
    this.accountantId = await (this.constructor as IAccountantModel).generateNextAccountantId(
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

  next();
});

// Pre-delete middleware
accountantSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  // Delete associated photos when accountant is deleted
  await AccountantPhoto.deleteMany({ accountantId: this._id });
  next();
});

// Virtual for photos
accountantSchema.virtual('photos', {
  ref: 'AccountantPhoto',
  localField: '_id',
  foreignField: 'accountantId',
  options: { sort: { photoNumber: 1 } },
});

// Virtual for photo count
accountantSchema.virtual('photoCount', {
  ref: 'AccountantPhoto',
  localField: '_id',
  foreignField: 'accountantId',
  count: true,
});

// Ensure virtual fields are serialized
accountantSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

accountantSchema.set('toObject', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

accountantPhotoSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

// Export the models
export const Accountant = model<IAccountantDocument, IAccountantModel>('Accountant', accountantSchema);
export const AccountantPhoto = model<IAccountantPhotoDocument>('AccountantPhoto', accountantPhotoSchema);
