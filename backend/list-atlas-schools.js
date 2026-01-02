/**
 * List all schools in MongoDB Atlas
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function listSchools() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    const School = mongoose.model('School', new mongoose.Schema({}, { strict: false }), 'schools');

    const schools = await School.find({}).select('name slug schoolId apiKey isActive');

    console.log(`Found ${schools.length} schools:\n`);

    schools.forEach((school, index) => {
      console.log(`${index + 1}. ${school.name}`);
      console.log(`   Slug: ${school.slug}`);
      console.log(`   School ID: ${school.schoolId}`);
      console.log(`   API Key: ${school.apiKey ? `${school.apiKey.substring(0, 10)}...` : 'MISSING'}`);
      console.log(`   Active: ${school.isActive}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listSchools();
