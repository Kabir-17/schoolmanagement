import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to parse JSON string fields from FormData for teacher creation
 */
export const parseTeacherData = (req: Request, res: Response, next: NextFunction) => {
  try {
    // console.log("=== parseTeacherData: Input body ===", req.body);
    
    const teacherData: any = { ...req.body };
    
    // Parse JSON string fields that were sent as FormData
    const jsonFields = ['subjects', 'grades', 'sections', 'experience', 'qualifications', 'address', 'emergencyContact', 'salary', 'isClassTeacher', 'isActive', 'classTeacherFor'];
    
    jsonFields.forEach(field => {
      if (teacherData[field] && typeof teacherData[field] === 'string') {
        try {
          teacherData[field] = JSON.parse(teacherData[field]);
        } catch (error) {
          console.error(`Failed to parse ${field}:`, error);
          // Keep the original value if parsing fails
        }
      }
    });
    
    // Handle special case for grades array - ensure numbers
    if (teacherData.grades && Array.isArray(teacherData.grades)) {
      teacherData.grades = teacherData.grades.map((grade: any) => {
        return typeof grade === 'string' ? parseInt(grade, 10) : grade;
      });
    }
    
    // Handle special case for qualifications year - ensure numbers
    if (teacherData.qualifications && Array.isArray(teacherData.qualifications)) {
      teacherData.qualifications = teacherData.qualifications.map((qual: any) => ({
        ...qual,
        year: typeof qual.year === 'string' ? parseInt(qual.year, 10) : qual.year
      }));
    }
    
    // Handle special case for isClassTeacher boolean
    if (teacherData.isClassTeacher && typeof teacherData.isClassTeacher === 'string') {
      teacherData.isClassTeacher = teacherData.isClassTeacher === 'true';
    }
    
    // Handle special case for isActive boolean
    if (teacherData.isActive && typeof teacherData.isActive === 'string') {
      teacherData.isActive = teacherData.isActive === 'true';
    }
    
    req.body = teacherData;
    // console.log("=== parseTeacherData: Final body ===", req.body);
    
    next();
  } catch (error) {
    console.error("Error in parseTeacherData middleware:", error);
    next(error);
  }
};