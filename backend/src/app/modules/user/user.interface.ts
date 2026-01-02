import { Document, Types, Model } from "mongoose";

export enum UserRole {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  TEACHER = "teacher",
  STUDENT = "student",
  PARENT = "parent",
  ACCOUNTANT = "accountant",
}

export interface IUser {
  schoolId: Types.ObjectId | null; // null for superadmin
  role: UserRole;
  username: string;
  passwordHash: string;
  displayPassword?: string; 
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  isFirstLogin: boolean; // Track if user needs to change password
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document, IUserMethods {
  _id: Types.ObjectId;
}

export interface IUserMethods {
  validatePassword(password: string): Promise<boolean>;
  updatePassword(newPassword: string): Promise<IUserDocument>;
  getFullName(): string;
  canAccessSchool(schoolId: string): boolean;
  updateLastLogin(): Promise<IUserDocument>;
  markFirstLoginComplete(): Promise<IUserDocument>;
}

export interface IUserModel extends Model<IUserDocument> {
  findByUsername(username: string): Promise<IUserDocument | null>;
  findBySchool(schoolId: string): Promise<IUserDocument[]>;
  findByRole(role: UserRole): Promise<IUserDocument[]>;
  findActiveUsers(): Promise<IUserDocument[]>;
}

// Request/Response interfaces
export interface ICreateUserRequest {
  schoolId?: string;
  role: UserRole;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface IUpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface IUserResponse {
  id: string;
  schoolId?: string;
  role: UserRole;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  isFirstLogin: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  school?: {
    id: string;
    name: string;
  };
}

export interface ILoginRequest {
  username: string;
  password: string;
}

export interface ILoginResponse {
  user: IUserResponse;
  accessToken: string;
  refreshToken?: string;
  tokenExpires: Date;
  requiresPasswordChange?: boolean; // Indicate if password change is required
}
