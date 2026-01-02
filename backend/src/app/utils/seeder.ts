import { User } from '../modules/user/user.model';
import { UserRole } from '../modules/user/user.interface';
import { School } from '../modules/school/school.model';
import { SchoolStatus } from '../modules/school/school.interface';
import { Subject } from '../modules/subject/subject.model';
import { seedEvents } from '../scripts/seed-events';
import config from '../config';

/**
 * Seeds sample subjects for testing
 */
export async function seedSampleSubjects(schoolId?: string): Promise<void> {
  try {
    console.log('🌱 Checking for existing subjects...');

    if (!schoolId) {
      console.log('⚠️  No school ID provided, skipping subject seeding');
      return;
    }

    // Check if subjects already exist for this school
    const existingSubjects = await Subject.findOne({ schoolId });

    if (existingSubjects) {
      console.log('✅ Subjects already exist for this school');
      return;
    }

    console.log('🌱 Creating sample subjects...');

    const sampleSubjects = [
      {
        schoolId,
        name: 'Mathematics',
        code: 'MATH',
        description: 'Core mathematics curriculum',
        grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        isCore: true,
        credits: 4,
        teachers: [],
        isActive: true,
      },
      {
        schoolId,
        name: 'English Language Arts',
        code: 'ELA',
        description: 'English language and literature',
        grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        isCore: true,
        credits: 4,
        teachers: [],
        isActive: true,
      },
      {
        schoolId,
        name: 'Science',
        code: 'SCI',
        description: 'General science curriculum',
        grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        isCore: true,
        credits: 3,
        teachers: [],
        isActive: true,
      },
      {
        schoolId,
        name: 'Social Studies',
        code: 'SS',
        description: 'History and social sciences',
        grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        isCore: true,
        credits: 3,
        teachers: [],
        isActive: true,
      },
      {
        schoolId,
        name: 'Physical Education',
        code: 'PE',
        description: 'Physical education and health',
        grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        isCore: false,
        credits: 2,
        teachers: [],
        isActive: true,
      },
      {
        schoolId,
        name: 'Art',
        code: 'ART',
        description: 'Visual arts and creative expression',
        grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        isCore: false,
        credits: 1,
        teachers: [],
        isActive: true,
      },
    ];

    const subjects = await Subject.insertMany(sampleSubjects);

    console.log('✅ Sample subjects created successfully:');
    subjects.forEach(subject => {
    });

  } catch (error) {
    console.error('❌ Error seeding sample subjects:', error);
    throw error;
  }
}

/**
 * Seeds a superadmin user if none exists
 */
export async function seedSuperadmin(): Promise<void> {
  try {
    console.log('🌱 Checking for existing superadmin...');

    // Check if superadmin already exists
    const existingSuperadmin = await User.findOne({ role: UserRole.SUPERADMIN });

    if (existingSuperadmin) {
      console.log('✅ Superadmin already exists:', existingSuperadmin.username);
      return;
    }

    console.log('🌱 Creating initial superadmin user...');

    // Create default superadmin
    const superadminData = {
      schoolId: null, // Superadmin is not associated with any school
      role: UserRole.SUPERADMIN,
      username: config.superadmin_username || 'superadmin',
      passwordHash: config.superadmin_password || 'superadmin123', // Will be hashed by pre-save hook
      firstName: 'Super',
      lastName: 'Administrator',
      email: config.superadmin_email || 'superadmin@schoolmanagement.com',
      phone: '+1234567890',
      isActive: true,
    };

    const superadmin = await User.create(superadminData);

    console.log('✅ Superadmin created successfully:');
    console.log('⚠️  Please change the default password after first login!');

  } catch (error) {
    console.error('❌ Error seeding superadmin:', error);
    throw error;
  }
}

/**
 * Seeds initial data for the application
 */
export async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Starting database seeding...');

    // Seed superadmin
    await seedSuperadmin();

    // Seed sample events
    await seedEvents();

    // Future: Add other seeding operations here
    // - Default school settings
    // - Default academic configurations
    // - etc.

    console.log('✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

/**
 * Validates that essential users exist and are properly configured
 */
export async function validateSeeding(): Promise<boolean> {
  try {
    const superadmin = await User.findOne({ role: UserRole.SUPERADMIN });
    
    if (!superadmin) {
      console.error('❌ Validation failed: No superadmin user found');
      return false;
    }

    if (!superadmin.isActive) {
      console.error('❌ Validation failed: Superadmin user is not active');
      return false;
    }

    console.log('✅ Seeding validation passed');
    return true;

  } catch (error) {
    console.error('❌ Error validating seeding:', error);
    return false;
  }
}