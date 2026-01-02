import { Document, Types, Model } from 'mongoose';

export interface IOrganization {
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrganizationDocument extends IOrganization, Document {
  _id: Types.ObjectId;
}

export interface IOrganizationMethods {
  isActive(): boolean;
  deactivate(): Promise<IOrganizationDocument>;
  activate(): Promise<IOrganizationDocument>;
}

export interface IOrganizationModel extends Model<IOrganizationDocument> {
  findByStatus(status: string): Promise<IOrganizationDocument[]>;
  findActiveOrganizations(): Promise<IOrganizationDocument[]>;
}

// Request/Response interfaces
export interface ICreateOrganizationRequest {
  name: string;
  status?: 'active' | 'inactive';
}

export interface IUpdateOrganizationRequest {
  name?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface IOrganizationResponse {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  schoolsCount?: number;
}