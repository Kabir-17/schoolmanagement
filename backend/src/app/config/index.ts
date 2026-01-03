import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  // Server configuration
  node_env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database configuration
  mongodb_uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management',
  db_name: process.env.DB_NAME || 'school_management',

  // JWT configuration
  jwt_secret: process.env.JWT_SECRET || 'school-management-fallback-secret',
  jwt_expires_in: process.env.JWT_EXPIRES_IN || '8h',

  // File upload configuration
  max_file_size: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  upload_path: process.env.UPLOAD_PATH || '../storage',

  // Rate limiting configuration
  rate_limit_window_ms: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  rate_limit_max_requests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  // Email configuration (optional)
  email_host: process.env.EMAIL_HOST,
  email_port: parseInt(process.env.EMAIL_PORT || '587'),
  email_user: process.env.EMAIL_USER,
  email_pass: process.env.EMAIL_PASS,

  // Cloudinary configuration (optional)
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  cloudinary_upload_timeout: parseInt(process.env.CLOUDINARY_UPLOAD_TIMEOUT || "120000"),
  cloudinary_upload_retries: parseInt(process.env.CLOUDINARY_UPLOAD_RETRIES || "3"),
  cloudinary_upload_concurrency: parseInt(process.env.CLOUDINARY_UPLOAD_CONCURRENCY || "3"),

  // Default superadmin credentials
  superadmin_username: process.env.SUPERADMIN_USERNAME || 'superadmin',
  superadmin_password: process.env.SUPERADMIN_PASSWORD || 'super123',
  superadmin_email: process.env.SUPERADMIN_EMAIL || 'superadmin@schoolmanagement.com',

  // Application constants
  default_page_size: 20,
  max_page_size: 100,
  min_password_length: 6,
  max_photos_per_student: 20,
  max_photos_per_teacher: parseInt(process.env.MAX_PHOTOS_PER_TEACHER || '20'),
  min_photos_per_student: 5,

  // API Configuration
  api_key: process.env.API_KEY || 'school-management-api-key-2025',
  allowed_origins: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
  temp_upload_path: process.env.TEMP_UPLOAD_PATH || './temp',
  max_periods_per_day: parseInt(process.env.MAX_PERIODS_PER_DAY || '8'),
  attendance_lock_after_days: parseInt(process.env.ATTENDANCE_LOCK_AFTER_DAYS || '7'),

  // File constraints
  allowed_image_formats: ['jpg', 'jpeg', 'png'],
  allowed_document_formats: ['pdf', 'doc', 'docx'],

  // School settings
  default_grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  default_sections: ['A', 'B', 'C', 'D'],
  max_students_per_section: 200, // Set to reasonable default, actual capacity managed per school

  // Attendance settings
  attendance_grace_period_minutes: 15,
  max_attendance_edit_hours: 24,
  auto_attend_finalization_time: process.env.AUTO_ATTEND_FINALIZATION_TIME || '17:00',

  // Academic year settings
  academic_year_start_month: 4, // April
  academic_year_end_month: 3,   // March

  // Timezone configuration for multi-school support
  // Each school can operate in its own timezone
  school_timezone: process.env.SCHOOL_TIMEZONE || 'UTC',
  default_timezone: 'Asia/Kolkata', // Legacy - kept for backward compatibility

  // Messaging settings
  messaging_enabled: process.env.MESSAGING_ENABLED !== 'false',
  messaging_ttl_days: parseInt(process.env.MESSAGING_TTL_DAYS || '30'),
  messaging_max_body_length: parseInt(process.env.MESSAGING_MAX_BODY_LENGTH || '2000'),
  messaging_max_participants: parseInt(process.env.MESSAGING_MAX_PARTICIPANTS || '10'),

  // Scheduler intervals
  absence_sms_dispatch_interval_minutes: parseInt(
    process.env.ABSENCE_SMS_DISPATCH_INTERVAL_MINUTES || '5'
  ),
};
