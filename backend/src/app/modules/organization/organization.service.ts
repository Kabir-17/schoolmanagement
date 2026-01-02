import httpStatus from 'http-status';
import { Types } from 'mongoose';
import { AppError } from '../../errors/AppError';
import { Organization } from './organization.model';
import {
  ICreateOrganizationRequest,
  IUpdateOrganizationRequest,
  IOrganizationResponse,
  IOrganizationDocument,
} from './organization.interface';

// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return getErrorMessage(error);
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
};

class OrganizationService {
  async createOrganization(
    organizationData: ICreateOrganizationRequest
  ): Promise<IOrganizationResponse> {
    try {
      // Check if organization with same name already exists
      const existingOrganization = await Organization.findOne({
        name: { $regex: new RegExp(`^${organizationData.name}$`, 'i') },
      });

      if (existingOrganization) {
        throw new AppError(
          httpStatus.CONFLICT,
          `Organization with name '${organizationData.name}' already exists`
        );
      }

      const newOrganization = await Organization.create(organizationData);

      return this.formatOrganizationResponse(newOrganization);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to create organization: ${getErrorMessage(error)}`
      );
    }
  }

  async getOrganizations(queryParams: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
  }): Promise<{
    organizations: IOrganizationResponse[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    try {
      const { page, limit, status, search, sortBy, sortOrder } = queryParams;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};

      if (status && status !== 'all') {
        query.status = status;
      }

      if (search) {
        query.name = { $regex: new RegExp(search, 'i') };
      }

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute queries
      const [organizations, totalCount] = await Promise.all([
        Organization.find(query)
          .populate('schoolsCount')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Organization.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        organizations: organizations.map(org => this.formatOrganizationResponse(org)),
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch organizations: ${getErrorMessage(error)}`
      );
    }
  }

  async getOrganizationById(id: string): Promise<IOrganizationResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid organization ID format');
      }

      const organization = await Organization.findById(id).populate('schoolsCount').lean();

      if (!organization) {
        throw new AppError(httpStatus.NOT_FOUND, 'Organization not found');
      }

      return this.formatOrganizationResponse(organization);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch organization: ${getErrorMessage(error)}`
      );
    }
  }

  async updateOrganization(
    id: string,
    updateData: IUpdateOrganizationRequest
  ): Promise<IOrganizationResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid organization ID format');
      }

      // Check if organization exists
      const organization = await Organization.findById(id);
      if (!organization) {
        throw new AppError(httpStatus.NOT_FOUND, 'Organization not found');
      }

      // If updating name, check for duplicates
      if (updateData.name && updateData.name !== organization.name) {
        const existingOrganization = await Organization.findOne({
          name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
          _id: { $ne: id },
        });

        if (existingOrganization) {
          throw new AppError(
            httpStatus.CONFLICT,
            `Organization with name '${updateData.name}' already exists`
          );
        }
      }

      const updatedOrganization = await Organization.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('schoolsCount').lean();

      return this.formatOrganizationResponse(updatedOrganization!);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to update organization: ${getErrorMessage(error)}`
      );
    }
  }

  async deleteOrganization(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid organization ID format');
      }

      const organization = await Organization.findById(id);
      if (!organization) {
        throw new AppError(httpStatus.NOT_FOUND, 'Organization not found');
      }

      // The pre-delete middleware in the model will check for dependent schools
      await organization.deleteOne();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to delete organization: ${getErrorMessage(error)}`
      );
    }
  }

  async getActiveOrganizations(): Promise<IOrganizationResponse[]> {
    try {
      const organizations = await Organization.findActiveOrganizations();
      return organizations.map(org => this.formatOrganizationResponse(org));
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch active organizations: ${getErrorMessage(error)}`
      );
    }
  }

  async getOrganizationStats(id: string): Promise<{
    organization: IOrganizationResponse;
    stats: {
      totalSchools: number;
      activeSchools: number;
      totalStudents: number;
      totalTeachers: number;
    };
  }> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid organization ID format');
      }

      const organization = await Organization.findById(id).lean();
      if (!organization) {
        throw new AppError(httpStatus.NOT_FOUND, 'Organization not found');
      }

      // These stats would require School model to be implemented
      // For now, returning placeholder values
      const stats = {
        totalSchools: 0,
        activeSchools: 0,
        totalStudents: 0,
        totalTeachers: 0,
      };

      return {
        organization: this.formatOrganizationResponse(organization),
        stats,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch organization stats: ${getErrorMessage(error)}`
      );
    }
  }

  private formatOrganizationResponse(organization: any): IOrganizationResponse {
    return {
      id: organization._id?.toString() || organization.id,
      name: organization.name,
      status: organization.status,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      schoolsCount: organization.schoolsCount || 0,
    };
  }
}

export const organizationService = new OrganizationService();