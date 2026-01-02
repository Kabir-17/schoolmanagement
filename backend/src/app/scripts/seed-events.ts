import { Event } from '../modules/event/event.model';
import { School } from '../modules/school/school.model';
import { User } from '../modules/user/user.model';

export const seedEvents = async () => {
  try {
    console.log('🌱 Seeding events...');

    // Get the first school and admin user for seeding
    const school = await School.findOne();
    const adminUser = await User.findOne({ role: 'admin' });

    if (!school || !adminUser) {
      console.log('❌ No school or admin user found. Please create them first.');
      return;
    }

    // Clear existing events for this school
    await Event.deleteMany({ schoolId: school._id });

    const sampleEvents = [
      {
        title: 'Annual Sports Day',
        description: 'Annual sports competition for all grades. Includes track and field events, team sports, and award ceremony.',
        date: new Date(2025, 10, 15), // Nov 15, 2025
        time: '09:00',
        location: 'School Sports Ground',
        type: 'extracurricular',
        targetAudience: {
          roles: ['student', 'parent', 'teacher'],
          grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        },
        schoolId: school._id,
        createdBy: adminUser._id,
        isActive: true
      },
      {
        title: 'Mid-Term Examinations',
        description: 'Mid-term examinations for all grades. Students must arrive 30 minutes before exam time.',
        date: new Date(2025, 10, 20), // Nov 20, 2025
        time: '10:00',
        location: 'Examination Halls',
        type: 'exam',
        targetAudience: {
          roles: ['student', 'parent', 'teacher'],
          grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        },
        schoolId: school._id,
        createdBy: adminUser._id,
        isActive: true
      },
      {
        title: 'Parent-Teacher Meeting - Grade 6',
        description: 'Quarterly parent-teacher meeting to discuss student progress and upcoming academic plans.',
        date: new Date(2025, 10, 12), // Nov 12, 2025
        time: '14:00',
        location: 'Grade 6 Classrooms',
        type: 'meeting',
        targetAudience: {
          roles: ['parent', 'teacher'],
          grades: [6]
        },
        schoolId: school._id,
        createdBy: adminUser._id,
        isActive: true
      },
      {
        title: 'Winter Break Holiday',
        description: 'School will be closed for winter break. Classes will resume on January 5th.',
        date: new Date(2025, 11, 25), // Dec 25, 2025
        type: 'holiday',
        targetAudience: {
          roles: ['student', 'parent', 'teacher', 'admin']
        },
        schoolId: school._id,
        createdBy: adminUser._id,
        isActive: true
      },
      {
        title: 'Science Fair 2025',
        description: 'Annual science fair showcasing student projects and innovations. Open to all grades.',
        date: new Date(2025, 10, 8), // Nov 8, 2025
        time: '11:00',
        location: 'School Auditorium',
        type: 'academic',
        targetAudience: {
          roles: ['student', 'parent', 'teacher'],
          grades: [4, 5, 6, 7, 8, 9, 10, 11, 12]
        },
        schoolId: school._id,
        createdBy: adminUser._id,
        isActive: true
      },
      {
        title: 'Today\'s Assembly',
        description: 'Daily morning assembly with announcements and student presentations.',
        date: new Date(), // Today
        time: '08:30',
        location: 'School Assembly Hall',
        type: 'announcement',
        targetAudience: {
          roles: ['student', 'teacher'],
          grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        },
        schoolId: school._id,
        createdBy: adminUser._id,
        isActive: true
      },
      {
        title: 'Staff Meeting',
        description: 'Monthly staff meeting to discuss curriculum updates and administrative matters.',
        date: new Date(2025, 10, 5), // Nov 5, 2025
        time: '15:30',
        location: 'Staff Room',
        type: 'administrative',
        targetAudience: {
          roles: ['teacher', 'admin']
        },
        schoolId: school._id,
        createdBy: adminUser._id,
        isActive: true
      },
      {
        title: 'Library Reading Week',
        description: 'Special week dedicated to promoting reading habits among students. Various activities planned.',
        date: new Date(2025, 10, 18), // Nov 18, 2025
        time: '10:00',
        location: 'School Library',
        type: 'academic',
        targetAudience: {
          roles: ['student', 'teacher'],
          grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        },
        schoolId: school._id,
        createdBy: adminUser._id,
        isActive: true
      }
    ];

    // Insert events
    const createdEvents = await Event.insertMany(sampleEvents);
    
    console.log(`✅ Successfully seeded ${createdEvents.length} events for school: ${school.name}`);
    createdEvents.forEach(event => {
    });

  } catch (error) {
    console.error('❌ Error seeding events:', error);
  }
};