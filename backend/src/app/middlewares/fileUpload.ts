import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { FileUtils } from '../utils/fileUtils';
import config from '../config';

// File filter for different file types
const createFileFilter = (allowedTypes: string[], allowedExtensions?: string[]) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check MIME type
    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    // Check file extension as backup
    if (allowedExtensions) {
      const fileExt = path.extname(file.originalname).toLowerCase();
      if (allowedExtensions.includes(fileExt)) {
        return cb(null, true);
      }
    }

    cb(new AppError(400, `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
  };
};

// Image file filter
const imageFilter = createFileFilter(
  ['image/jpeg', 'image/jpg', 'image/png'],
  ['.jpg', '.jpeg', '.png']
);

// Document file filter
const documentFilter = createFileFilter(
  ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.pdf', '.doc', '.docx']
);

// General file filter (images + documents)
const generalFilter = createFileFilter(
  [
    'image/jpeg', 'image/jpg', 'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx']
);

// Memory storage configuration
const memoryStorage = multer.memoryStorage();

// Disk storage configuration (for temporary storage)
const diskStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, config.temp_upload_path);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueName = FileUtils.generateUniqueFilename(file.originalname);
    cb(null, uniqueName);
  },
});

/**
 * Student Photo Upload Middleware
 * Handles multiple photo uploads for students (up to 20 photos)
 */
export const uploadStudentPhotos = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: config.max_file_size, // Max file size per photo
    files: config.max_photos_per_student, // Max 20 photos
  },
}).array('photos', config.max_photos_per_student);

/**
 * Teacher Photo Upload Middleware
 * Handles multiple photo uploads for teachers (up to 20 photos)
 */
export const uploadTeacherPhotos = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: config.max_file_size,
    files: config.max_photos_per_teacher || config.max_photos_per_student,
  },
}).array('photos', config.max_photos_per_teacher || config.max_photos_per_student);

/**
 * Single Photo Upload Middleware
 * For profile photos or single image uploads
 */
export const uploadSinglePhoto = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: config.max_file_size,
    files: 1,
  },
}).single('photo');

/**
 * Document Upload Middleware
 * For uploading documents (assignments, homework, etc.)
 */
export const uploadDocuments = multer({
  storage: memoryStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: config.max_file_size,
    files: 10, // Max 10 documents
  },
}).array('documents', 10);

/**
 * General File Upload Middleware
 * For mixed file types (images + documents)
 */
export const uploadMixedFiles = multer({
  storage: memoryStorage,
  fileFilter: generalFilter,
  limits: {
    fileSize: config.max_file_size,
    files: 15, // Max 15 files
  },
}).array('files', 15);

/**
 * Homework Attachment Upload
 * For homework submissions with attachments
 */
export const uploadHomeworkAttachments = multer({
  storage: memoryStorage,
  fileFilter: generalFilter,
  limits: {
    fileSize: config.max_file_size,
    files: 5, // Max 5 attachments per homework
  },
}).array('attachments', 5);

/**
 * Assignment Material Upload
 * For teachers uploading assignment materials
 */
export const uploadAssignmentMaterials = multer({
  storage: memoryStorage,
  fileFilter: generalFilter,
  limits: {
    fileSize: config.max_file_size,
    files: 10, // Max 10 materials per assignment
  },
}).array('materials', 10);

/**
 * File Validation Middleware
 * Validates uploaded files after multer processing
 */
export const validateUploadedFiles = (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    return next(new AppError(400, 'No files uploaded'));
  }

  // Validate each file
  for (const file of files) {
    const validation = FileUtils.validateImageFile(file);
    if (!validation.isValid) {
      return next(new AppError(400, validation.error!));
    }
  }

  next();
};

/**
 * Optional File Validation Middleware
 * Validates files only if they exist (for optional uploads)
 */
export const validateOptionalFiles = (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    return next(); // No files to validate
  }

  // Validate each file
  for (const file of files) {
    const validation = FileUtils.validateImageFile(file);
    if (!validation.isValid) {
      return next(new AppError(400, validation.error!));
    }
  }

  next();
};

/**
 * Student Photo Count Validation
 * Ensures student doesn't exceed photo limit
 */
export const validateStudentPhotoCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    const studentId = req.params.id || req.body.studentId;

    if (!studentId) {
      return next(new AppError(400, 'Student ID is required'));
    }

    if (!files || files.length === 0) {
      return next(new AppError(400, 'No photos uploaded'));
    }

    // Check existing photo count
    const Student = require('../modules/student/student.model').Student;
    const student = await Student.findById(studentId);
    
    if (!student) {
      return next(new AppError(404, 'Student not found'));
    }

    // Check if student can upload more photos
    const canUpload = await student.canUploadMorePhotos();
    if (!canUpload) {
      return next(new AppError(
        400,
        `Student has reached maximum photo limit of ${config.max_photos_per_student}`
      ));
    }

    // Get current photo count
    const StudentPhoto = require('../modules/student/student.model').StudentPhoto;
    const currentPhotoCount = await StudentPhoto.countDocuments({ studentId });
    const remainingSlots = config.max_photos_per_student - currentPhotoCount;

    if (files.length > remainingSlots) {
      return next(new AppError(
        400,
        `Can only upload ${remainingSlots} more photos. Student has ${currentPhotoCount}/${config.max_photos_per_student} photos.`
      ));
    }

    next();
  } catch (error) {
    next(new AppError(500, 'Error validating photo count'));
  }
};

/**
 * File Size Validation Middleware
 * Additional validation for file sizes
 */
export const validateFileSize = (maxSize: number = config.max_file_size) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as Express.Multer.File[];
    
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.size > maxSize) {
          return next(new AppError(
            400,
            `File ${file.originalname} exceeds maximum size of ${Math.round(maxSize / (1024 * 1024))}MB`
          ));
        }
      }
    }

    next();
  };
};

/**
 * File Extension Validation
 */
export const validateFileExtensions = (allowedExtensions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as Express.Multer.File[];
    
    if (files && files.length > 0) {
      for (const file of files) {
        const fileExt = path.extname(file.originalname).toLowerCase();
        
        if (!allowedExtensions.includes(fileExt)) {
          return next(new AppError(
            400, 
            `File ${file.originalname} has invalid extension. Allowed: ${allowedExtensions.join(', ')}`
          ));
        }
      }
    }

    next();
  };
};

/**
 * Clean Filename Middleware
 * Sanitizes uploaded filenames
 */
export const sanitizeFilenames = (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[];
  
  if (files && files.length > 0) {
    files.forEach(file => {
      // Remove special characters and spaces from filename
      file.originalname = file.originalname
        .replace(/[^a-zA-Z0-9.\-_]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
    });
  }

  next();
};

/**
 * Multer Error Handler
 * Handles specific multer errors
 */
export const handleMulterError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size is ${Math.round(config.max_file_size / (1024 * 1024))}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields in upload';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      // MISSING_FIELD_NAME is not a valid MulterError code
      default:
        message = 'File upload error: ' + error.message;
        break;
    }

    return next(new AppError(400, message));
  }

  next(error);
};

/**
 * Create Dynamic Upload Middleware
 * Factory function for creating custom upload configurations
 */
export const createUploadMiddleware = (options: {
  fieldName: string;
  maxFiles?: number;
  fileTypes?: string[];
  maxSize?: number;
  storage?: 'memory' | 'disk';
}) => {
  const {
    fieldName,
    maxFiles = 1,
    fileTypes = ['image/jpeg', 'image/jpg', 'image/png'],
    maxSize = config.max_file_size,
    storage = 'memory'
  } = options;

  const fileFilter = createFileFilter(fileTypes);
  const storageConfig = storage === 'memory' ? memoryStorage : diskStorage;

  return multer({
    storage: storageConfig,
    fileFilter,
    limits: {
      fileSize: maxSize,
      files: maxFiles,
    },
  })[maxFiles === 1 ? 'single' : 'array'](fieldName, maxFiles);
};

// Export all middleware functions
export default {
  uploadStudentPhotos,
  uploadTeacherPhotos,
  uploadSinglePhoto,
  uploadDocuments,
  uploadMixedFiles,
  uploadHomeworkAttachments,
  uploadAssignmentMaterials,
  validateUploadedFiles,
  validateOptionalFiles,
  validateStudentPhotoCount,
  validateFileSize,
  validateFileExtensions,
  sanitizeFilenames,
  handleMulterError,
  createUploadMiddleware,
};