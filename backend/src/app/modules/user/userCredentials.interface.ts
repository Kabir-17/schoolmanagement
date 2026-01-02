import { Document, Types } from "mongoose";

export interface IUserCredentials {
  userId: Types.ObjectId;
  schoolId: Types.ObjectId;
  initialUsername: string;
  initialPassword: string;
  hasChangedPassword: boolean;
  role: "student" | "parent" | "teacher";
  associatedStudentId?: Types.ObjectId; // Required for parent credentials
  issuedAt: Date;
  lastAccessedAt?: Date;
  issuedBy: Types.ObjectId; // Admin who issued the credentials
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserCredentialsDocument extends IUserCredentials, Document {
  _id: Types.ObjectId;
}

export interface ICredentialsResponse {
  id: string;
  userId: string;
  initialUsername: string;
  hasChangedPassword: boolean;
  role: "student" | "parent" | "teacher";
  associatedStudentId?: string;
  issuedAt: Date;
  lastAccessedAt?: Date;
  issuedBy: string;
}
