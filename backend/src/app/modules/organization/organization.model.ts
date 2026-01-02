import { Schema, model } from 'mongoose';
import {
  IOrganization,
  IOrganizationDocument,
  IOrganizationMethods,
  IOrganizationModel,
} from './organization.interface';

// Organization schema definition
const organizationSchema = new Schema<IOrganizationDocument, IOrganizationModel, IOrganizationMethods>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'suspended'],
        message: 'Status must be active, inactive, or suspended',
      },
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Instance methods
organizationSchema.methods.isActive = function (): boolean {
  return this.status === 'active';
};

organizationSchema.methods.deactivate = function (): Promise<IOrganizationDocument> {
  this.status = 'inactive';
  return this.save();
};

organizationSchema.methods.activate = function (): Promise<IOrganizationDocument> {
  this.status = 'active';
  return this.save();
};

// Static methods
organizationSchema.statics.findByStatus = function (status: string): Promise<IOrganizationDocument[]> {
  return this.find({ status }).sort({ createdAt: -1 });
};

organizationSchema.statics.findActiveOrganizations = function (): Promise<IOrganizationDocument[]> {
  return this.find({ status: 'active' }).sort({ name: 1 });
};

// Indexes for performance
organizationSchema.index({ name: 1, status: 1 });
organizationSchema.index({ createdAt: -1 });

// Pre-save middleware for validation
organizationSchema.pre('save', function (next) {
  // Convert name to title case for consistency
  if (this.name) {
    this.name = this.name.trim().replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
  next();
});

// Pre-delete middleware to check for dependent schools
organizationSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const School = model('School');
  const schoolCount = await School.countDocuments({ orgId: this._id });

  if (schoolCount > 0) {
    const error = new Error(`Cannot delete organization. ${schoolCount} schools are associated with it.`);
    return next(error);
  }

  next();
});

// Virtual for schools count (will be populated when needed)
organizationSchema.virtual('schoolsCount', {
  ref: 'School',
  localField: '_id',
  foreignField: 'orgId',
  count: true,
});

// Ensure virtual fields are serialized
organizationSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

organizationSchema.set('toObject', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

// Export the model
export const Organization = model<IOrganizationDocument, IOrganizationModel>(
  'Organization',
  organizationSchema
);