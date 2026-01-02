import FeeStructure from "./feeStructure.model";
import { IFeeStructure, IFeeComponent } from "./fee.interface";
import { Types } from "mongoose";
import { AppError } from "../../errors/AppError";

/**
 * Fee Structure Service
 * Handles all business logic for fee structure management
 */
class FeeStructureService {
  /**
   * Create a new fee structure
   */
  async createFeeStructure(data: {
    school: string;
    grade: string;
    academicYear: string;
    feeComponents: IFeeComponent[];
    dueDate: number;
    lateFeePercentage: number;
    createdBy: string;
  }): Promise<IFeeStructure> {
    // Check if active fee structure already exists
    const existingStructure = await FeeStructure.findOne({
      school: data.school,
      grade: data.grade,
      academicYear: data.academicYear,
      isActive: true,
    });

    if (existingStructure) {
      throw new AppError(
        409,
        `Active fee structure already exists for ${data.grade} in ${data.academicYear}`
      );
    }

    // Don't manually calculate totalAmount - let pre-save hook handle it
    // The hook will filter out one-time fees and calculate monthly total only

    // Create fee structure
    const feeStructure = await FeeStructure.create({
      ...data,
      isActive: true,
    });

    return feeStructure;
  }

  /**
   * Get fee structure by ID
   */
  async getFeeStructureById(id: string): Promise<IFeeStructure> {
    const feeStructure = await FeeStructure.findById(id).populate(
      "school",
      "name schoolId"
    );

    if (!feeStructure) {
      throw new AppError(404, "Fee structure not found");
    }

    return feeStructure;
  }

  /**
   * Get active fee structure for a grade
   */
  async getActiveFeeStructure(
    schoolId: string,
    grade: string,
    academicYear: string
  ): Promise<IFeeStructure | null> {
    const feeStructure = await FeeStructure.findOne({
      school: schoolId,
      grade,
      academicYear,
      isActive: true,
    });

    return feeStructure;
  }

  /**
   * Get all fee structures for a school
   */
  async getFeeStructuresBySchool(
    schoolId: string,
    filters?: {
      grade?: string;
      academicYear?: string;
      isActive?: boolean;
    }
  ): Promise<IFeeStructure[]> {
    const query: any = { school: schoolId };

    if (filters?.grade) {
      query.grade = filters.grade;
    }

    if (filters?.academicYear) {
      query.academicYear = filters.academicYear;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const feeStructures = await FeeStructure.find(query).sort({
      academicYear: -1,
      grade: 1,
    });

    return feeStructures;
  }

  /**
   * Update fee structure
   */
  async updateFeeStructure(
    id: string,
    data: {
      feeComponents?: IFeeComponent[];
      dueDate?: number;
      lateFeePercentage?: number;
      updatedBy: string;
    }
  ): Promise<IFeeStructure> {
    const feeStructure = await FeeStructure.findById(id);

    if (!feeStructure) {
      throw new AppError(404, "Fee structure not found");
    }

    // Check if fee structure can be modified
    if (!feeStructure.canModify()) {
      throw new AppError(
        403,
        "Cannot modify fee structure that is already in use"
      );
    }

    // Update fields
    if (data.feeComponents) {
      feeStructure.feeComponents = data.feeComponents;
    }

    if (data.dueDate) {
      feeStructure.dueDate = data.dueDate;
    }

    if (data.lateFeePercentage !== undefined) {
      feeStructure.lateFeePercentage = data.lateFeePercentage;
    }

    feeStructure.updatedBy = data.updatedBy as any;

    await feeStructure.save();

    return feeStructure;
  }

  /**
   * Deactivate fee structure
   */
  async deactivateFeeStructure(
    id: string,
    updatedBy: string
  ): Promise<IFeeStructure> {
    const feeStructure = await FeeStructure.findById(id);

    if (!feeStructure) {
      throw new AppError(404, "Fee structure not found");
    }

    if (!feeStructure.isActive) {
      throw new AppError(400, "Fee structure is already inactive");
    }

    await feeStructure.deactivate(updatedBy);

    return feeStructure;
  }

  /**
   * Get grades with fee structure for an academic year
   */
  async getGradesWithFeeStructure(
    schoolId: string,
    academicYear: string
  ): Promise<string[]> {
    return FeeStructure.distinct("grade", {
      school: schoolId,
      academicYear,
      isActive: true,
    });
  }

  /**
   * Clone fee structure to new academic year
   */
  async cloneFeeStructure(
    sourceId: string,
    targetAcademicYear: string,
    createdBy: string
  ): Promise<IFeeStructure> {
    const sourceFeeStructure = await FeeStructure.findById(sourceId);

    if (!sourceFeeStructure) {
      throw new AppError(404, "Source fee structure not found");
    }

    // Check if target fee structure already exists
    const existingTarget = await FeeStructure.findOne({
      school: sourceFeeStructure.school,
      grade: sourceFeeStructure.grade,
      academicYear: targetAcademicYear,
      isActive: true,
    });

    if (existingTarget) {
      throw new AppError(
        409,
        `Fee structure already exists for ${sourceFeeStructure.grade} in ${targetAcademicYear}`
      );
    }

    // Create cloned fee structure
    const clonedFeeStructure = await FeeStructure.create({
      school: sourceFeeStructure.school,
      grade: sourceFeeStructure.grade,
      academicYear: targetAcademicYear,
      feeComponents: sourceFeeStructure.feeComponents,
      totalAmount: sourceFeeStructure.totalAmount,
      dueDate: sourceFeeStructure.dueDate,
      lateFeePercentage: sourceFeeStructure.lateFeePercentage,
      isActive: true,
      createdBy,
    });

    return clonedFeeStructure;
  }

  /**
   * Bulk create fee structures for multiple grades
   */
  async bulkCreateFeeStructures(data: {
    school: string;
    academicYear: string;
    grades: Array<{
      grade: string;
      feeComponents: IFeeComponent[];
      dueDate: number;
      lateFeePercentage: number;
    }>;
    createdBy: string;
  }): Promise<IFeeStructure[]> {
    const createdStructures: IFeeStructure[] = [];
    const errors: string[] = [];

    for (const gradeData of data.grades) {
      try {
        const feeStructure = await this.createFeeStructure({
          school: data.school,
          grade: gradeData.grade,
          academicYear: data.academicYear,
          feeComponents: gradeData.feeComponents,
          dueDate: gradeData.dueDate,
          lateFeePercentage: gradeData.lateFeePercentage,
          createdBy: data.createdBy,
        });

        createdStructures.push(feeStructure);
      } catch (error: any) {
        errors.push(
          `${gradeData.grade}: ${error.message || "Failed to create"}`
        );
      }
    }

    if (errors.length > 0 && createdStructures.length === 0) {
      throw new AppError(400, `Failed to create fee structures: ${errors.join(", ")}`);
    }

    return createdStructures;
  }
}

export default new FeeStructureService();
