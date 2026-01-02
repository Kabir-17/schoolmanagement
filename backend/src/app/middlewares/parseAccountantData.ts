import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to parse JSON string fields from FormData for accountant creation
 */
export const parseAccountantData = (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountantData: any = { ...req.body };
    
    // Parse JSON string fields that were sent as FormData
    const jsonFields = [
      'experience',
      'qualifications',
      'address',
      'emergencyContact',
      'salary',
      'responsibilities',
      'certifications',
      'isActive'
    ];
    
    jsonFields.forEach(field => {
      if (accountantData[field] && typeof accountantData[field] === 'string') {
        try {
          accountantData[field] = JSON.parse(accountantData[field]);
        } catch (error) {
          console.error(`Failed to parse ${field}:`, error);
          // Keep the original value if parsing fails
        }
      }
    });
    
    // Handle special case for qualifications year - ensure numbers
    if (accountantData.qualifications && Array.isArray(accountantData.qualifications)) {
      accountantData.qualifications = accountantData.qualifications.map((qual: any) => ({
        ...qual,
        year: typeof qual.year === 'string' ? parseInt(qual.year, 10) : qual.year
      }));
    }
    
    // Handle special case for experience totalYears - ensure number
    if (accountantData.experience && typeof accountantData.experience.totalYears === 'string') {
      accountantData.experience.totalYears = parseInt(accountantData.experience.totalYears, 10);
    }
    
    // Handle special case for isActive boolean
    if (accountantData.isActive && typeof accountantData.isActive === 'string') {
      accountantData.isActive = accountantData.isActive === 'true';
    }
    
    // Handle special case for salary fields - ensure numbers
    if (accountantData.salary) {
      if (typeof accountantData.salary.basic === 'string') {
        accountantData.salary.basic = parseFloat(accountantData.salary.basic);
      }
      if (typeof accountantData.salary.allowances === 'string') {
        accountantData.salary.allowances = parseFloat(accountantData.salary.allowances);
      }
      if (typeof accountantData.salary.deductions === 'string') {
        accountantData.salary.deductions = parseFloat(accountantData.salary.deductions);
      }
    }
    
    req.body = accountantData;
    
    next();
  } catch (error) {
    console.error("Error in parseAccountantData middleware:", error);
    next(error);
  }
};
