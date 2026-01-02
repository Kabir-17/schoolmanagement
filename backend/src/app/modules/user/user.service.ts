import httpStatus from 'http-status';
import { Types } from 'mongoose';
import { AppError } from '../../errors/AppError';
import { School } from '../school/school.model';
import { User } from './user.model';
import { generateAccessToken, getTokenExpiration } from '../../utils/jwtUtils';
import {
  ICreateUserRequest,
  IUpdateUserRequest,
  IChangePasswordRequest,
  IUserResponse,
  IUserDocument,
  ILoginRequest,
  ILoginResponse,
  UserRole,
} from './user.interface';
import config from '../../config';

// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
};

class UserService {
  async createUser(userData: ICreateUserRequest): Promise<IUserResponse> {
    try {
      // For non-superadmin users, verify school exists
      if (userData.role !== 'superadmin') {
        if (!userData.schoolId) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            'School ID is required for non-superadmin users'
          );
        }

        const school = await School.findById(userData.schoolId);
        if (!school) {
          throw new AppError(httpStatus.NOT_FOUND, 'School not found');
        }

        if (school.status !== 'active') {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            'Cannot create user for inactive school'
          );
        }
      }

      // Check if username already exists
      const existingUser = await User.findOne({ username: userData.username });
      if (existingUser) {
        throw new AppError(
          httpStatus.CONFLICT,
          `Username '${userData.username}' is already taken`
        );
      }

      // Create user
      const newUser = await User.create({
        ...userData,
        passwordHash: userData.password,
      });

      // Populate school data if applicable
      if (newUser.schoolId) {
        await newUser.populate('schoolId', 'name status');
      }

      return this.formatUserResponse(newUser);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to create user: ${getErrorMessage(error)}`
      );
    }
  }

  async getUsers(queryParams: {
    page: number;
    limit: number;
    schoolId?: string;
    role?: string;
    isActive?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
  }): Promise<{
    users: IUserResponse[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    try {
      const { page, limit, schoolId, role, isActive, search, sortBy, sortOrder } = queryParams;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};

      if (schoolId) {
        query.schoolId = schoolId;
      }

      if (role && role !== 'all') {
        query.role = role;
      }

      if (isActive && isActive !== 'all') {
        query.isActive = isActive === 'true';
      }

      if (search) {
        query.$or = [
          { firstName: { $regex: new RegExp(search, 'i') } },
          { lastName: { $regex: new RegExp(search, 'i') } },
          { username: { $regex: new RegExp(search, 'i') } },
          { email: { $regex: new RegExp(search, 'i') } },
        ];
      }

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute queries
      const [users, totalCount] = await Promise.all([
        User.find(query)
          .populate('schoolId', 'name status')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        users: users.map((user: IUserDocument) => this.formatUserResponse(user)),
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch users: ${getErrorMessage(error)}`
      );
    }
  }

  async getUserById(id: string): Promise<IUserResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid user ID format');
      }

      const user = await User.findById(id).populate('schoolId', 'name status').lean();

      if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
      }

      return this.formatUserResponse(user);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch user: ${getErrorMessage(error)}`
      );
    }
  }

  async updateUser(id: string, updateData: IUpdateUserRequest): Promise<IUserResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid user ID format');
      }

      const user = await User.findById(id);
      if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('schoolId', 'name status').lean();

      return this.formatUserResponse(updatedUser!);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to update user: ${getErrorMessage(error)}`
      );
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid user ID format');
      }

      const user = await User.findById(id);
      if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
      }

      // The pre-delete middleware in the model will handle validation
      await user.deleteOne();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to delete user: ${getErrorMessage(error)}`
      );
    }
  }

  async changePassword(
    id: string,
    passwordData: IChangePasswordRequest
  ): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid user ID format');
      }

      const user = await User.findById(id).select('+passwordHash');
      if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.validatePassword(passwordData.currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Current password is incorrect');
      }

      // Update password
      await user.updatePassword(passwordData.newPassword);
      // Mark first login as complete if this was a first login
      if (user.isFirstLogin) {
        await user.markFirstLoginComplete();
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to change password: ${getErrorMessage(error)}`
      );
    }
  }

  async forcePasswordChange(
    id: string,
    newPassword: string
  ): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid user ID format');
      }

      const user = await User.findById(id);
      if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
      }

      // Update password and mark first login as complete
      await user.updatePassword(newPassword);
      await user.markFirstLoginComplete();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to change password: ${getErrorMessage(error)}`
      );
    }
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid user ID format');
      }

      const user = await User.findById(id);
      if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
      }

      // Update password (admin reset, no current password verification needed)
      await user.updatePassword(newPassword);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to reset password: ${getErrorMessage(error)}`
      );
    }
  }

  async login(loginData: ILoginRequest): Promise<ILoginResponse> {
    try {
      // Handle superadmin login
      if (loginData.username === config.superadmin_username &&
          loginData.password === config.superadmin_password) {

        // Create/update superadmin user if doesn't exist
        let superadmin = await User.findOne({ username: config.superadmin_username });

        if (!superadmin) {
          superadmin = await User.create({
            username: config.superadmin_username,
            passwordHash: config.superadmin_password,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'superadmin',
            isActive: true,
          });
        }

        await superadmin.updateLastLogin();

        const accessToken = generateAccessToken(superadmin);
        const tokenExpires = getTokenExpiration();

        return {
          user: this.formatUserResponse(superadmin),
          accessToken,
          tokenExpires,
        };
      }

      // Handle regular user login
      const user = await User.findByUsername(loginData.username);
      if (!user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid username or password');
      }

      if (!user.isActive) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'User account is disabled');
      }

      const isPasswordValid = await user.validatePassword(loginData.password);
      if (!isPasswordValid) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid username or password');
      }

      // Check school status for non-superadmin users
      if (user.schoolId) {
        const school = await School.findById(user.schoolId);
        if (!school || school.status !== 'active') {
          throw new AppError(httpStatus.UNAUTHORIZED, 'School is inactive');
        }
      }

      await user.updateLastLogin();
      await user.populate('schoolId', 'name status');

      const accessToken = generateAccessToken(user);
      const tokenExpires = getTokenExpiration();

      return {
        user: this.formatUserResponse(user),
        accessToken,
        tokenExpires,
        requiresPasswordChange: user.isFirstLogin, // Add this flag
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to login: ${getErrorMessage(error)}`
      );
    }
  }

  async getUsersBySchool(schoolId: string): Promise<IUserResponse[]> {
    try {
      if (!Types.ObjectId.isValid(schoolId)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid school ID format');
      }

      const users = await User.findBySchool(schoolId);
      return users.map((user: IUserDocument) => this.formatUserResponse(user));
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch users by school: ${getErrorMessage(error)}`
      );
    }
  }

  async getUsersByRole(role: UserRole): Promise<IUserResponse[]> {
    try {
      const users = await User.findByRole(role);
      return users.map((user: IUserDocument) => this.formatUserResponse(user));
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch users by role: ${getErrorMessage(error)}`
      );
    }
  }

  private formatUserResponse(user: any): IUserResponse {
    return {
      id: user._id?.toString() || user.id,
      schoolId: user.schoolId?._id?.toString() || user.schoolId?.toString(),
      role: user.role,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      isFirstLogin: user.isFirstLogin,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      school: user.schoolId?.name ? {
        id: user.schoolId._id?.toString() || user.schoolId.id,
        name: user.schoolId.name,
      } : undefined,
    };
  }
}

export const userService = new UserService();