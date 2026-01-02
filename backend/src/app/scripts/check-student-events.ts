import Database from '../DB';
import { Student } from '../modules/student/student.model';
import { Event } from '../modules/event/event.model';

async function checkStudentEvents() {
  try {
    await Database.connect();
    
    const student = await Student.findById('68de1e892ff4ba32259c78db');
    
    if (!student) {
      return;
    }
    
    
    const allEvents = await Event.find({ isActive: true });
    
    if (allEvents.length > 0) {
      allEvents.slice(0, 3).forEach(event => {
      });
    }
    
    // Check events matching student
    const studentEvents = await Event.find({
      isActive: true,
      'targetAudience.roles': { $in: ['student'] },
      $or: [
        { 'targetAudience.grades': { $in: [student.grade] } },
        { 'targetAudience.grades': { $exists: false } },
        { 'targetAudience.grades': { $size: 0 } }
      ]
    });
    
    studentEvents.forEach(event => {
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStudentEvents();