import { Schema, model } from 'mongoose';
import {
  IOrangeSmsCredentialDocument,
  IOrangeSmsCredentialModel,
} from './orange-sms.interface';

const orangeSmsCredentialSchema = new Schema<IOrangeSmsCredentialDocument, IOrangeSmsCredentialModel>({
  clientId: {
    type: String,
    required: true,
  },
  clientSecret: {
    type: String,
    required: true,
    select: false,
  },
  senderAddress: {
    type: String,
  },
  senderName: {
    type: String,
  },
  countryCode: {
    type: String,
    default: '224',
  },
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  versionKey: false,
});

orangeSmsCredentialSchema.index({ updatedAt: -1 });

export const OrangeSmsCredential = model<IOrangeSmsCredentialDocument, IOrangeSmsCredentialModel>(
  'OrangeSmsCredential',
  orangeSmsCredentialSchema
);
