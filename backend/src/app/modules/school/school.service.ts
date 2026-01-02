import httpStatus from "http-status";
import { Types } from "mongoose";
import { AppError } from "../../errors/AppError";
import { Organization } from "../organization/organization.model";
import { User } from "../user/user.model";
import { UserRole } from "../user/user.interface";
import { School } from "./school.model";
import {
  ICreateSchoolRequest,
  IUpdateSchoolRequest,
  ISchoolResponse,
  ISchoolDocument,
  ISchoolCredentials,
  ISchoolStatsResponse,
  SchoolStatus,
} from "./school.interface";

class SchoolService {
  async createSchool(
    schoolData: ICreateSchoolRequest & { createdBy: string }
  ): Promise<{ school: ISchoolResponse; credentials: ISchoolCredentials }> {
    try {
      // Verify organization exists and is active (only if orgId is provided)
      if (schoolData.orgId) {
        const organization = await Organization.findById(schoolData.orgId);
        if (!organization) {
          throw new AppError(httpStatus.NOT_FOUND, "Organization not found");
        }

        if (organization.status !== "active") {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot create school for inactive organization"
          );
        }
      }

      // Check if school with same name already exists
      const existingSchool = await School.findOne({
        name: { $regex: new RegExp(`^${schoolData.name}$`, "i") },
      });

      if (existingSchool) {
        throw new AppError(
          httpStatus.CONFLICT,
          `School with name '${schoolData.name}' already exists`
        );
      }

      // Generate school slug and ID first
      const slug = schoolData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-");
      const schoolIdCounter = await School.countDocuments();
      const schoolId = `SCH${String(schoolIdCounter + 1).padStart(3, "0")}`;

      // Create the school first with temporary adminUserId
      const tempObjectId = new Types.ObjectId();
      const newSchool = await School.create({
        ...schoolData,
        slug,
        schoolId,
        adminUserId: tempObjectId, // Temporary ID
        currentSession: {
          ...schoolData.currentSession,
          isActive: true,
        },
        academicSessions: [
          {
            ...schoolData.currentSession,
            isActive: true,
          },
        ],
        apiEndpoint: `/api/schools/${schoolId}`,
        apiKey: this.generateApiKey(),
        isActive: true,
        status: "active",
      });

      // Now create the admin user with the school ID
      const adminUser = await User.create({
        role: "admin",
        username: schoolData.adminDetails.username,
        passwordHash: schoolData.adminDetails.password, // This will be hashed by the User model
        displayPassword: schoolData.adminDetails.password, // Store plain text for superadmin viewing
        firstName: schoolData.adminDetails.firstName,
        lastName: schoolData.adminDetails.lastName,
        email: schoolData.adminDetails.email,
        phone: schoolData.adminDetails.phone,
        isActive: true,
        schoolId: newSchool._id,
      });

      // Update the school with the real admin user ID
      await School.findByIdAndUpdate(newSchool._id, {
        adminUserId: adminUser._id,
      });

      return {
        school: this.formatSchoolResponse(newSchool),
        credentials: {
          username: schoolData.adminDetails.username,
          password: schoolData.adminDetails.password,
          tempPassword: schoolData.adminDetails.password,
          apiKey: newSchool.apiKey,
          apiEndpoint: newSchool.apiEndpoint,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to create school: ${(error as Error).message}`
      );
    }
  }

  private generateApiKey(): string {
    return (
      "sk_" +
      Math.random().toString(36).substr(2, 9) +
      "_" +
      Date.now().toString(36)
    );
  }

  async getSchools(queryParams: {
    page: number;
    limit: number;
    orgId?: string;
    status?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
  }): Promise<{
    schools: ISchoolResponse[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    try {
      const { page, limit, orgId, status, search, sortBy, sortOrder } =
        queryParams;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};

      if (orgId) {
        query.orgId = orgId;
      }

      if (status && status !== "all") {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { name: { $regex: new RegExp(search, "i") } },
          { address: { $regex: new RegExp(search, "i") } },
        ];
      }

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Execute queries
      const [schools, totalCount] = await Promise.all([
        School.find(query)
          .populate("orgId", "name status")
          .populate("studentsCount")
          .populate("teachersCount")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        School.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        schools: schools.map((school) => this.formatSchoolResponse(school)),
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch schools: ${(error as Error).message}`
      );
    }
  }

  async getSchoolById(id: string): Promise<ISchoolResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid school ID format");
      }

      const school = await School.findById(id)
        .populate("orgId", "name status")
        .populate("studentsCount")
        .populate("teachersCount")
        .lean();

      if (!school) {
        throw new AppError(httpStatus.NOT_FOUND, "School not found");
      }

      return this.formatSchoolResponse(school);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch school: ${(error as Error).message}`
      );
    }
  }

  async updateSchool(
    id: string,
    updateData: IUpdateSchoolRequest
  ): Promise<ISchoolResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid school ID format");
      }

      // Check if school exists
      const school = await School.findById(id);
      if (!school) {
        throw new AppError(httpStatus.NOT_FOUND, "School not found");
      }

      // If updating name, check for duplicates in the same organization
      if (updateData.name && updateData.name !== school.name) {
        const existingSchool = await School.findOne({
          name: { $regex: new RegExp(`^${updateData.name}$`, "i") },
          orgId: school.orgId,
          _id: { $ne: id },
        });

        if (existingSchool) {
          throw new AppError(
            httpStatus.CONFLICT,
            `School with name '${updateData.name}' already exists in this organization`
          );
        }
      }

      const updatedSchool = await School.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate("orgId", "name status")
        .populate("studentsCount")
        .populate("teachersCount")
        .lean();

      return this.formatSchoolResponse(updatedSchool!);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to update school: ${(error as Error).message}`
      );
    }
  }

  async deleteSchool(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid school ID format");
      }

      const school = await School.findById(id);
      if (!school) {
        throw new AppError(httpStatus.NOT_FOUND, "School not found");
      }

      // The pre-delete middleware in the model will check for dependent data
      await school.deleteOne();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to delete school: ${(error as Error).message}`
      );
    }
  }

  async getSchoolsByOrganization(orgId: string): Promise<ISchoolResponse[]> {
    try {
      if (!Types.ObjectId.isValid(orgId)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Invalid organization ID format"
        );
      }

      const schools = await School.findByOrganization(orgId);
      return schools.map((school: ISchoolDocument) =>
        this.formatSchoolResponse(school)
      );
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch schools by organization: ${(error as Error).message}`
      );
    }
  }

  async validateAdminCredentials(
    username: string,
    password: string
  ): Promise<ISchoolDocument | null> {
    try {
      // This method is deprecated - use User model authentication instead
      return null;
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to validate admin credentials: ${(error as Error).message}`
      );
    }
  }

  private formatSchoolResponse(school: any): ISchoolResponse {
    return {
      id: school._id?.toString() || school.id,
      name: school.name,
      slug: school.slug,
      schoolId: school.schoolId,
      establishedYear: school.establishedYear,
      address: school.address,
      contact: school.contact,
      status: school.status,
      affiliation: school.affiliation,
      recognition: school.recognition,
      settings: school.settings,
      currentSession: school.currentSession,
      apiEndpoint: school.apiEndpoint,
      logo: school.logo,
      images: school.images,
      isActive: school.isActive,
      stats: school.stats,
      createdAt: school.createdAt,
      updatedAt: school.updatedAt,
      admin: school.adminUserId?.name
        ? {
            id: school.adminUserId._id?.toString() || school.adminUserId.id,
            username: school.adminUserId.username,
            fullName: `${school.adminUserId.firstName} ${school.adminUserId.lastName}`,
            email: school.adminUserId.email,
            phone: school.adminUserId.phone,
          }
        : undefined,
      // Legacy support - remove adminUsername reference
      orgId: school.orgId?.toString(),
      studentsCount: school.studentsCount || school.stats?.totalStudents || 0,
      teachersCount: school.teachersCount || school.stats?.totalTeachers || 0,
      organization: school.orgId?.name
        ? {
            id: school.orgId._id?.toString() || school.orgId.id,
            name: school.orgId.name,
          }
        : undefined,
    };
  }

  // === SUPERADMIN SPECIFIC METHODS ===

  /**
   * Create a new school (modernized version for superadmin)
   */
  async createSchoolModern(
    schoolData: ICreateSchoolRequest,
    createdBy: Types.ObjectId
  ): Promise<{ school: ISchoolResponse; credentials: ISchoolCredentials }> {
    try {
      // Generate unique identifiers first
      const schoolId = await School.generateUniqueSchoolId();
      const slug = await School.generateUniqueSlug(schoolData.name);

      // Create school first with a temporary adminUserId
      const tempObjectId = new Types.ObjectId();

      const schoolCreateData: any = {
        name: schoolData.name,
        slug,
        schoolId,
        establishedYear: schoolData.establishedYear,
        address: schoolData.address,
        contact: schoolData.contact,
        affiliation: schoolData.affiliation,
        recognition: schoolData.recognition,
        adminUserId: tempObjectId, // Temporary ID
        settings: schoolData.settings || {},
        status: SchoolStatus.PENDING_APPROVAL,
        logo: schoolData.logo,
        isActive: true,
        createdBy,
      };

      // Only add currentSession if it exists
      if (schoolData.currentSession) {
        schoolCreateData.currentSession = {
          ...schoolData.currentSession,
          isActive: true,
        };
      }

      const newSchool = new School(schoolCreateData);



      await newSchool.save();

      // Now create admin user with the school ID
      const adminUser = new User({
        role: "admin",
        username: schoolData.adminDetails.username,
        passwordHash: schoolData.adminDetails.password,
        displayPassword: schoolData.adminDetails.password, // Store plain text for superadmin viewing
        firstName: schoolData.adminDetails.firstName,
        lastName: schoolData.adminDetails.lastName,
        email: schoolData.adminDetails.email,
        phone: schoolData.adminDetails.phone,
        isActive: true,
        schoolId: newSchool._id, // Now we have the school ID
      });

      await adminUser.save();

      // Update school with the real admin user ID
      newSchool.adminUserId = adminUser._id;
      await newSchool.save();

      // Generate API credentials
      const apiEndpoint = newSchool.generateApiEndpoint();
      const apiKey = newSchool.generateApiKey();

      newSchool.apiEndpoint = apiEndpoint;
      newSchool.apiKey = apiKey;
      await newSchool.save();

      const credentials: ISchoolCredentials = {
        username: adminUser.username,
        password: schoolData.adminDetails.password,
        tempPassword: schoolData.adminDetails.password,
        apiKey,
        apiEndpoint,
      };

      return {
        school: this.formatSchoolResponse(
          await newSchool.populate("adminUserId")
        ),
        credentials,
      };
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to create school: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get all schools for superadmin dashboard
   */
  async getAllSchools(queryParams: {
    page?: number;
    limit?: number;
    status?: SchoolStatus;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{
    schools: ISchoolResponse[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = queryParams;

      const skip = (page - 1) * limit;
      const query: any = {};

      if (status) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { name: { $regex: new RegExp(search, "i") } },
          { schoolId: { $regex: new RegExp(search, "i") } },
          { "address.city": { $regex: new RegExp(search, "i") } },
          { affiliation: { $regex: new RegExp(search, "i") } },
        ];
      }

      const sort: any = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      const [schools, totalCount] = await Promise.all([
        School.find(query)
          .populate("adminUserId", "username firstName lastName email phone")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        School.countDocuments(query),
      ]);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        schools: schools.map((school) => this.formatSchoolResponse(school)),
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch schools: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get school statistics for performance monitoring
   */
  async getSchoolStats(schoolId: string): Promise<ISchoolStatsResponse> {
    try {
      if (!Types.ObjectId.isValid(schoolId)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid school ID format");
      }

      const school = await School.findById(schoolId).populate(
        "adminUserId",
        "firstName lastName"
      );
      if (!school) {
        throw new AppError(httpStatus.NOT_FOUND, "School not found");
      }

      // Update stats
      await school.updateStats();

      return {
        schoolId: school.schoolId,
        schoolName: school.name,
        totalStudents: school.stats?.totalStudents || 0,
        totalTeachers: school.stats?.totalTeachers || 0,
        totalParents: school.stats?.totalParents || 0,
        totalClasses: school.stats?.totalClasses || 0,
        totalSubjects: school.stats?.totalSubjects || 0,
        attendanceRate: school.stats?.attendanceRate || 0,
        enrollmentTrend: [], // TODO: Implement enrollment trend calculation
        gradeDistribution: [], // TODO: Implement grade distribution calculation
        lastUpdated: school.stats?.lastUpdated || new Date(),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to get school stats: ${(error as Error).message}`
      );
    }
  }

  /**
   * Assign new administrator to a school
   */
  async assignAdmin(
    schoolId: string,
    adminData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      username: string;
      password: string;
    }
  ): Promise<ISchoolResponse> {
    try {
      if (!Types.ObjectId.isValid(schoolId)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid school ID format");
      }

      const school = await School.findById(schoolId);
      if (!school) {
        throw new AppError(httpStatus.NOT_FOUND, "School not found");
      }

      // Check if username already exists
      const existingUser = await User.findOne({ username: adminData.username });
      if (existingUser) {
        throw new AppError(httpStatus.CONFLICT, "Username already exists");
      }

      // Create new admin user
      const newAdmin = new User({
        role: "admin",
        schoolId: school._id,
        username: adminData.username,
        passwordHash: adminData.password,
        displayPassword: adminData.password, // Store plain text for superadmin viewing
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        email: adminData.email,
        phone: adminData.phone,
        isActive: true,
      });

      await newAdmin.save();

      // Update old admin to inactive if exists
      if (school.adminUserId) {
        await User.findByIdAndUpdate(school.adminUserId, { isActive: false });
      }

      // Update school with new admin
      school.adminUserId = newAdmin._id;
      await school.save();

      return this.formatSchoolResponse(await school.populate("adminUserId"));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to assign admin: ${(error as Error).message}`
      );
    }
  }

  /**
   * Update school status (approve, suspend, etc.)
   */
  async updateSchoolStatus(
    schoolId: string,
    status: SchoolStatus,
    updatedBy: Types.ObjectId
  ): Promise<ISchoolResponse> {
    try {
      if (!Types.ObjectId.isValid(schoolId)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid school ID format");
      }

      const school = await School.findByIdAndUpdate(
        schoolId,
        {
          status,
          lastModifiedBy: updatedBy,
          isActive: status === SchoolStatus.ACTIVE,
        },
        { new: true, runValidators: true }
      ).populate("adminUserId", "username firstName lastName email phone");

      if (!school) {
        throw new AppError(httpStatus.NOT_FOUND, "School not found");
      }

      return this.formatSchoolResponse(school);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to update school status: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get system-wide statistics
   */
  async getSystemStats(): Promise<{
    totalSchools: number;
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    activeSchools: number;
    pendingSchools: number;
    suspendedSchools: number;
    recentActivity: {
      schoolsCreated: number;
      studentsEnrolled: number;
      teachersAdded: number;
    };
  }> {
    try {
      // Import the required models
      const { Student } = await import('../student/student.model');
      const { Teacher } = await import('../teacher/teacher.model');
      const { User } = await import('../user/user.model');

      const [
        totalSchools,
        activeSchools,
        pendingSchools,
        suspendedSchools,
        totalStudents,
        totalTeachers,
        totalParents,
      ] = await Promise.all([
        School.countDocuments({ isActive: true }),
        School.countDocuments({ status: SchoolStatus.ACTIVE }),
        School.countDocuments({ status: SchoolStatus.PENDING_APPROVAL }),
        School.countDocuments({ status: SchoolStatus.SUSPENDED }),
        Student.countDocuments({ isActive: true }),
        Teacher.countDocuments({ isActive: true }),
        User.countDocuments({ role: UserRole.PARENT, isActive: true }),
      ]);

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [recentSchools, recentStudents, recentTeachers] = await Promise.all([
        School.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Student.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Teacher.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      ]);

      return {
        totalSchools,
        totalStudents,
        totalTeachers,
        totalParents,
        activeSchools,
        pendingSchools,
        suspendedSchools,
        recentActivity: {
          schoolsCreated: recentSchools,
          studentsEnrolled: recentStudents,
          teachersAdded: recentTeachers,
        },
      };
    } catch (error) {
      // If Student or Teacher models don't exist yet, return basic stats
      console.warn('Some models not available, returning basic stats:', (error as Error).message);
      
      const [
        totalSchools,
        activeSchools,
        pendingSchools,
        suspendedSchools,
      ] = await Promise.all([
        School.countDocuments({ isActive: true }),
        School.countDocuments({ status: SchoolStatus.ACTIVE }),
        School.countDocuments({ status: SchoolStatus.PENDING_APPROVAL }),
        School.countDocuments({ status: SchoolStatus.SUSPENDED }),
      ]);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSchools = await School.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

      return {
        totalSchools,
        totalStudents: 0,
        totalTeachers: 0,
        totalParents: 0,
        activeSchools,
        pendingSchools,
        suspendedSchools,
        recentActivity: {
          schoolsCreated: recentSchools,
          studentsEnrolled: 0,
          teachersAdded: 0,
        },
      };
    }
  }

  /**
   * Generate new API key for school
   */
  async regenerateApiKey(
    schoolId: string
  ): Promise<{ apiKey: string; apiEndpoint: string }> {
    try {
      if (!Types.ObjectId.isValid(schoolId)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid school ID format");
      }

      const school = await School.findById(schoolId);
      if (!school) {
        throw new AppError(httpStatus.NOT_FOUND, "School not found");
      }

      const newApiKey = await school.regenerateApiKey();

      return {
        apiKey: newApiKey,
        apiEndpoint: school.apiEndpoint,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to regenerate API key: ${(error as Error).message}`
      );
    }
  }

  async getAdminCredentials(schoolId: string): Promise<{
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone?: string;
    lastLogin?: string;
  }> {
    try {
      if (!Types.ObjectId.isValid(schoolId)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid school ID format");
      }

      const school = await School.findById(schoolId).populate({
        path: "adminUserId",
        select:
          "username firstName lastName email phone lastLogin displayPassword",
      });

      if (!school) {
        throw new AppError(httpStatus.NOT_FOUND, "School not found");
      }

      if (!school.adminUserId) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          "Admin not assigned to this school"
        );
      }

      const admin = school.adminUserId as any; // Populated admin user

      return {
        username: admin.username,
        password: admin.displayPassword || "********", // Show actual password for superadmin
        fullName: admin.fullName || `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
        phone: admin.phone,
        lastLogin: admin.lastLogin?.toISOString(),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to get admin credentials: ${(error as Error).message}`
      );
    }
  }

  async resetAdminPassword(
    schoolId: string,
    newPassword?: string,
    updatedBy?: Types.ObjectId
  ): Promise<{
    username: string;
    newPassword: string;
    fullName: string;
    email: string;
  }> {
    try {
      if (!Types.ObjectId.isValid(schoolId)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid school ID format");
      }

      const school = await School.findById(schoolId).populate({
        path: "adminUserId",
        select: "username firstName lastName email passwordHash",
      });

      if (!school) {
        throw new AppError(httpStatus.NOT_FOUND, "School not found");
      }

      if (!school.adminUserId) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          "Admin not assigned to this school"
        );
      }

      const admin = school.adminUserId as any; // Populated admin user

      // Generate new password if not provided
      const passwordToSet = newPassword || this.generateSecurePassword();

      // Update the admin's password using the User model method
      const userToUpdate = await User.findById(admin._id);
      if (!userToUpdate) {
        throw new AppError(httpStatus.NOT_FOUND, "Admin user not found");
      }

      // Update both hashed password and display password
      await userToUpdate.updatePassword(passwordToSet);
      userToUpdate.displayPassword = passwordToSet; // Store plain text for superadmin viewing
      await userToUpdate.save();

      return {
        username: admin.username,
        newPassword: passwordToSet,
        fullName: admin.fullName || `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to reset admin password: ${(error as Error).message}`
      );
    }
  }

  private generateSecurePassword(): string {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";

    // Ensure at least one character from each category
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // digit
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // special char

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");
  }
}

export const schoolService = new SchoolService();
