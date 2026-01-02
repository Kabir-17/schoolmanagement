import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { organizationService } from './organization.service';

const createOrganization = catchAsync(async (req: Request, res: Response) => {
  const organization = await organizationService.createOrganization(req.body);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Organization created successfully',
    data: organization,
  });
});

const getOrganizations = catchAsync(async (req: Request, res: Response) => {
  const result = await organizationService.getOrganizations(req.query as any);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Organizations fetched successfully',
    data: result.organizations,
    pagination: {
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    },
  });
});

const getOrganizationById = catchAsync(async (req: Request, res: Response) => {
  const organization = await organizationService.getOrganizationById(req.params.id);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Organization fetched successfully',
    data: organization,
  });
});

const updateOrganization = catchAsync(async (req: Request, res: Response) => {
  const organization = await organizationService.updateOrganization(req.params.id, req.body);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Organization updated successfully',
    data: organization,
  });
});

const deleteOrganization = catchAsync(async (req: Request, res: Response) => {
  await organizationService.deleteOrganization(req.params.id);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Organization deleted successfully',
    data: null,
  });
});

const getActiveOrganizations = catchAsync(async (req: Request, res: Response) => {
  const organizations = await organizationService.getActiveOrganizations();

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Active organizations fetched successfully',
    data: organizations,
  });
});

const getOrganizationStats = catchAsync(async (req: Request, res: Response) => {
  const result = await organizationService.getOrganizationStats(req.params.id);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Organization statistics fetched successfully',
    data: result,
  });
});

export {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getActiveOrganizations,
  getOrganizationStats,
};