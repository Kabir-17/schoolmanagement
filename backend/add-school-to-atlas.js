/**
 * Script to add Greenwood High School to MongoDB Atlas
 * Run with: node add-school-to-atlas.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const schoolData = {
  name: 'Greenwood High School',
  slug: 'greenwood-high',
  schoolId: 'greenwood-high',
  apiKey: 'c532d439903ff4f4dec10e26010c99e5d4c73ea0d0768650d605806d68862908',
  isActive: true,
  settings: {
    timezone: 'America/New_York',
    autoAttendFinalizationTime: '23:59'
  },
  address: {
    street: '123 Education Lane',
    city: 'Greenwood',
    state: 'NY',
    country: 'USA',
    postalCode: '10001'
  },
  contactInfo: {
    email: 'admin@greenwood-high.edu',
    phone: '+1-555-0100'
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

async function addSchool() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const School = mongoose.model('School', new mongoose.Schema({}, { strict: false }), 'schools');

    // Check if school already exists
    const existing = await School.findOne({ slug: 'greenwood-high' });
    if (existing) {
      console.log('⚠️  School already exists in Atlas!');
      console.log('   Name:', existing.name);
      console.log('   Slug:', existing.slug);
      console.log('   API Key:', existing.apiKey ? `${existing.apiKey.substring(0, 10)}...` : 'MISSING');

      // Update API key if missing
      if (!existing.apiKey) {
        console.log('\n📝 Updating school with API key...');
        existing.apiKey = schoolData.apiKey;
        existing.settings = schoolData.settings;
        await existing.save();
        console.log('✅ School updated with API key');
      }
    } else {
      console.log('📝 Creating new school in Atlas...');
      const school = await School.create(schoolData);
      console.log('✅ School created successfully!');
      console.log('   ID:', school._id);
      console.log('   Name:', school.name);
      console.log('   Slug:', school.slug);
    }

    console.log('\n✅ Done! You can now test the auto-attend app.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addSchool();
