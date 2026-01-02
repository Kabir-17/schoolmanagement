import httpStatus from "http-status";
import { Types, startSession } from "mongoose";
import path from "path";
import config from "../../config";
import { AppError } from "../../errors/AppError";
import { FileUtils } from "../../utils/fileUtils";
import { CredentialGenerator } from "../../utils/credentialGenerator";
import { School } from "../school/school.model";
import { User } from "../user/user.model";
import { Accountant, AccountantPhoto } from "./accountant.model";
import {
  ICreateAccountantRequest,
  IUpdateAccountantRequest,
  IAccountantResponse,
  IAccountantPhotoResponse,
  IAccountantStats,
} from "./accountant.interface";

class AccountantService {
  async createAccountant(
    accountantData: ICreateAccountantRequest,
    files?: Express.Multer.File[]
  ): Promise<IAccountantResponse> {
    const session = await startSession();
    session.startTransaction();

    try {
      // Verify school exists and is active
      const school = await School.findById(new Types.ObjectId(accountantData.schoolId));
      if (!school) {
        throw new AppError(httpStatus.NOT_FOUND, "School not found");
      }

      if (school.status !== "active") {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Cannot create accountant for inactive school"
        );
      }

      // Generate accountant ID and employee ID
      const joiningYear = accountantData.joinDate
        ? new Date(accountantData.joinDate).getFullYear()
        : new Date().getFullYear();

      const { accountantId, employeeId } =
        await CredentialGenerator.generateUniqueAccountantId(
          joiningYear,
          accountantData.schoolId,
          accountantData.designation
        );

      // Generate secure credentials
      const credentials = await CredentialGenerator.generateAccountantCredentials(
        accountantData.firstName,
        accountantData.lastName,
        accountantId
      );

      // Create user account for accountant
      const newUser = await User.create(
        [
          {
            schoolId: new Types.ObjectId(accountantData.schoolId),
            role: "accountant",
            username: credentials.username,
            passwordHash: credentials.hashedPassword,
            displayPassword: credentials.password,
            firstName: accountantData.firstName,
            lastName: accountantData.lastName,
            email: accountantData.email,
            phone: accountantData.phone,
            isActive: accountantData.isActive !== false,
            requiresPasswordChange: credentials.requiresPasswordChange,
          },
        ],
        { session }
      );

      // Process experience data
      const experienceData = {
        totalYears: accountantData.experience.totalYears,
        previousOrganizations:
          accountantData.experience.previousOrganizations?.map((org) => ({
            ...org,
            fromDate: new Date(org.fromDate),
            toDate: new Date(org.toDate),
          })) || [],
      };

      // Create accountant record
      const newAccountant = await Accountant.create(
        [
          {
            userId: newUser[0]._id,
            schoolId: new Types.ObjectId(accountantData.schoolId),
            accountantId,
            employeeId: employeeId,
            department: accountantData.department,
            designation: accountantData.designation,
            bloodGroup: accountantData.bloodGroup,
            dob: new Date(accountantData.dob),
            joinDate: accountantData.joinDate
              ? new Date(accountantData.joinDate)
              : new Date(),
            qualifications: accountantData.qualifications,
            experience: experienceData,
            address: accountantData.address,
            emergencyContact: accountantData.emergencyContact,
            salary: accountantData.salary
              ? {
                  ...accountantData.salary,
                  netSalary:
                    (accountantData.salary.basic || 0) +
                    (accountantData.salary.allowances || 0) -
                    (accountantData.salary.deductions || 0),
                }
              : undefined,
            responsibilities: accountantData.responsibilities || [],
            certifications: accountantData.certifications || [],
            isActive: accountantData.isActive !== false,
          },
        ],
        { session }
      );

      // Create photo folder structure
      const age =
        new Date().getFullYear() - new Date(accountantData.dob).getFullYear();
      const joinDate = new Date(accountantData.joinDate || Date.now())
        .toISOString()
        .split("T")[0];

      let folderPath: string | null = null;
      try {
        folderPath = await FileUtils.createAccountantPhotoFolder(school.name, {
          firstName: accountantData.firstName,
          age,
          bloodGroup: accountantData.bloodGroup,
          joinDate,
          accountantId,
        });
      } catch (error) {
        console.warn("Failed to create photo folder:", error);
      }

      // Handle photo uploads if provided
      const photoResponses: IAccountantPhotoResponse[] = [];
      if (files && files.length > 0 && folderPath) {
        try {
          // Validate all files first
          for (const file of files) {
            const validation = FileUtils.validateImageFile(file);
            if (!validation.isValid) {
              throw new AppError(httpStatus.BAD_REQUEST, validation.error!);
            }
          }

          // Check photo count limit
          if (files.length > config.max_photos_per_student) {
            throw new AppError(
              httpStatus.BAD_REQUEST,
              `Cannot upload more than ${config.max_photos_per_student} photos`
            );
          }

          // Get available photo numbers
          const availableNumbers = await FileUtils.getAvailablePhotoNumbers(
            folderPath
          );

          if (files.length > availableNumbers.length) {
            throw new AppError(
              httpStatus.BAD_REQUEST,
              `Only ${availableNumbers.length} photo slots available`
            );
          }

          // Upload photos
          const uploadPromises = files.map(async (file, index) => {
            const photoNumber = availableNumbers[index];
            const photoResult = await FileUtils.savePhotoWithNumber(
              file,
              folderPath!,
              photoNumber
            );

            const photoDoc = await AccountantPhoto.create(
              [
                {
                  accountantId: newAccountant[0]._id,
                  schoolId: new Types.ObjectId(accountantData.schoolId),
                  photoPath: photoResult.relativePath,
                  photoNumber,
                  filename: photoResult.filename,
                  originalName: file.originalname,
                  mimetype: file.mimetype,
                  size: file.size,
                },
              ],
              { session }
            );

            return {
              id: photoDoc[0]._id.toString(),
              photoPath: photoDoc[0].photoPath,
              photoNumber: photoDoc[0].photoNumber,
              filename: photoDoc[0].filename,
              size: photoDoc[0].size,
              createdAt: photoDoc[0].createdAt!,
            };
          });

          const uploadedPhotos = await Promise.all(uploadPromises);
          photoResponses.push(...uploadedPhotos);
        } catch (error) {
          console.error("Photo upload failed:", error);
        }
      }

      // Commit transaction
      await session.commitTransaction();

      // Populate and return
      await newAccountant[0].populate([
        { path: "userId", select: "firstName lastName username email phone" },
        { path: "schoolId", select: "name" },
      ]);

      const response = await this.formatAccountantResponse(newAccountant[0]);
      if (photoResponses.length > 0) {
        response.photos = photoResponses;
        response.photoCount = photoResponses.length;
      }

      // Add generated credentials to response
      (response as any).credentials = {
        username: credentials.username,
        password: credentials.password,
        accountantId: accountantId,
        message: "Please save these credentials. Default password should be changed on first login.",
      };

      return response;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAccountants(filters: any): Promise<{
    accountants: IAccountantResponse[];
    totalCount: number;
    currentPage: number;
  }> {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const query: any = { schoolId: new Types.ObjectId(filters.schoolId) };

    if (filters.department) {
      query.department = filters.department;
    }

    if (filters.designation) {
      query.designation = filters.designation;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === "true";
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, "i");
      query.$or = [
        { accountantId: searchRegex },
        { employeeId: searchRegex },
      ];
    }

    const sortField = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder === "asc" ? 1 : -1;

    const [accountants, totalCount] = await Promise.all([
      Accountant.find(query)
        .populate("userId", "firstName lastName username email phone")
        .populate("schoolId", "name")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Accountant.countDocuments(query),
    ]);

    const accountantResponses = await Promise.all(
      accountants.map((accountant) => this.formatAccountantResponse(accountant as any))
    );

    return {
      accountants: accountantResponses,
      totalCount,
      currentPage: page,
    };
  }

  async getAccountantById(id: string): Promise<IAccountantResponse> {
    const accountant = await Accountant.findById(id)
      .populate("userId", "firstName lastName username email phone")
      .populate("schoolId", "name");

    if (!accountant) {
      throw new AppError(httpStatus.NOT_FOUND, "Accountant not found");
    }

    return this.formatAccountantResponse(accountant);
  }

  async updateAccountant(
    id: string,
    updateData: IUpdateAccountantRequest
  ): Promise<IAccountantResponse> {
    const session = await startSession();
    session.startTransaction();

    try {
      const accountant = await Accountant.findById(id).session(session);

      if (!accountant) {
        throw new AppError(httpStatus.NOT_FOUND, "Accountant not found");
      }

      // Update user data if changed
      if (
        updateData.firstName ||
        updateData.lastName ||
        updateData.email ||
        updateData.phone
      ) {
        await User.findByIdAndUpdate(
          accountant.userId,
          {
            $set: {
              firstName: updateData.firstName,
              lastName: updateData.lastName,
              email: updateData.email,
              phone: updateData.phone,
            },
          },
          { session }
        );
      }

      // Process experience data if provided
      let experienceData;
      if (updateData.experience) {
        experienceData = {
          totalYears: updateData.experience.totalYears,
          previousOrganizations:
            updateData.experience.previousOrganizations?.map((org) => ({
              ...org,
              fromDate: new Date(org.fromDate),
              toDate: new Date(org.toDate),
            })) || [],
        };
      }

      // Update accountant data
      const updateFields: any = {};
      if (updateData.department) updateFields.department = updateData.department;
      if (updateData.designation) updateFields.designation = updateData.designation;
      if (updateData.bloodGroup) updateFields.bloodGroup = updateData.bloodGroup;
      if (updateData.dob) updateFields.dob = new Date(updateData.dob);
      if (updateData.joinDate) updateFields.joinDate = new Date(updateData.joinDate);
      if (updateData.employeeId) updateFields.employeeId = updateData.employeeId;
      if (updateData.qualifications) updateFields.qualifications = updateData.qualifications;
      if (experienceData) updateFields.experience = experienceData;
      if (updateData.address) updateFields.address = updateData.address;
      if (updateData.emergencyContact)
        updateFields.emergencyContact = updateData.emergencyContact;
      if (updateData.responsibilities)
        updateFields.responsibilities = updateData.responsibilities;
      if (updateData.certifications)
        updateFields.certifications = updateData.certifications;
      if (updateData.isActive !== undefined)
        updateFields.isActive = updateData.isActive;

      if (updateData.salary) {
        updateFields.salary = {
          ...updateData.salary,
          netSalary:
            (updateData.salary.basic || 0) +
            (updateData.salary.allowances || 0) -
            (updateData.salary.deductions || 0),
        };
      }

      const updatedAccountant = await Accountant.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, session }
      )
        .populate("userId", "firstName lastName username email phone")
        .populate("schoolId", "name");

      await session.commitTransaction();

      return this.formatAccountantResponse(updatedAccountant!);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async deleteAccountant(id: string): Promise<void> {
    const session = await startSession();
    session.startTransaction();

    try {
      const accountant = await Accountant.findById(id).session(session);

      if (!accountant) {
        throw new AppError(httpStatus.NOT_FOUND, "Accountant not found");
      }

      // Delete accountant photos
      await AccountantPhoto.deleteMany(
        { accountantId: accountant._id },
        { session }
      );

      // Delete accountant record
      await Accountant.findByIdAndDelete(id, { session });

      // Soft delete user account
      await User.findByIdAndUpdate(
        accountant.userId,
        { $set: { isActive: false } },
        { session }
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAccountantStats(schoolId: string): Promise<IAccountantStats> {
    const accountants = await Accountant.find({ schoolId });

    const stats: IAccountantStats = {
      totalAccountants: accountants.length,
      activeAccountants: accountants.filter((a) => a.isActive).length,
      byDepartment: [],
      byDesignation: [],
      byExperience: [],
      recentJoining: 0,
    };

    // Group by department
    const departmentMap = new Map<string, number>();
    accountants.forEach((accountant) => {
      const count = departmentMap.get(accountant.department) || 0;
      departmentMap.set(accountant.department, count + 1);
    });
    stats.byDepartment = Array.from(departmentMap.entries()).map(
      ([department, count]) => ({ department, count })
    );

    // Group by designation
    const designationMap = new Map<string, number>();
    accountants.forEach((accountant) => {
      const count = designationMap.get(accountant.designation) || 0;
      designationMap.set(accountant.designation, count + 1);
    });
    stats.byDesignation = Array.from(designationMap.entries()).map(
      ([designation, count]) => ({ designation, count })
    );

    // Group by experience
    const experienceRanges = [
      { range: "0-2 years", min: 0, max: 2, count: 0 },
      { range: "3-5 years", min: 3, max: 5, count: 0 },
      { range: "6-10 years", min: 6, max: 10, count: 0 },
      { range: "10+ years", min: 11, max: 100, count: 0 },
    ];

    accountants.forEach((accountant) => {
      const years = accountant.experience.totalYears;
      const range = experienceRanges.find(
        (r) => years >= r.min && years <= r.max
      );
      if (range) range.count++;
    });

    stats.byExperience = experienceRanges.map((r) => ({
      experienceRange: r.range,
      count: r.count,
    }));

    // Recent joining (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    stats.recentJoining = accountants.filter(
      (a) => new Date(a.joinDate) >= thirtyDaysAgo
    ).length;

    return stats;
  }

  private async formatAccountantResponse(
    accountant: any
  ): Promise<IAccountantResponse> {
    const user = accountant.userId;
    const school = accountant.schoolId;

    return {
      id: accountant._id.toString(),
      userId: user?._id?.toString() || accountant.userId.toString(),
      schoolId: school?._id?.toString() || accountant.schoolId.toString(),
      accountantId: accountant.accountantId,
      employeeId: accountant.employeeId,
      department: accountant.department,
      designation: accountant.designation,
      bloodGroup: accountant.bloodGroup,
      dob: accountant.dob,
      joinDate: accountant.joinDate,
      qualifications: accountant.qualifications,
      experience: accountant.experience,
      address: accountant.address,
      emergencyContact: accountant.emergencyContact,
      salary: accountant.salary,
      responsibilities: accountant.responsibilities || [],
      certifications: accountant.certifications || [],
      isActive: accountant.isActive,
      age: accountant.getAgeInYears
        ? accountant.getAgeInYears()
        : new Date().getFullYear() -
          new Date(accountant.dob).getFullYear(),
      totalExperience: accountant.experience.totalYears,
      createdAt: accountant.createdAt,
      updatedAt: accountant.updatedAt,
      user: user
        ? {
            id: user._id.toString(),
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`,
            email: user.email,
            phone: user.phone,
          }
        : undefined,
      school: school
        ? {
            id: school._id.toString(),
            name: school.name,
          }
        : undefined,
      photoCount: 0,
    };
  }
}

export const accountantService = new AccountantService();
