import { Document, Model, Types } from 'mongoose';

export interface IOrangeSmsCredential {
  clientId: string;
  clientSecret: string;
  senderAddress?: string;
  senderName?: string;
  countryCode?: string;
  lastUpdatedBy?: Types.ObjectId;
  lastUpdatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrangeSmsCredentialDocument
  extends IOrangeSmsCredential,
    Document {
  _id: Types.ObjectId;
}

export interface IOrangeSmsCredentialModel
  extends Model<IOrangeSmsCredentialDocument> {}
