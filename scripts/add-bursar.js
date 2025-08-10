const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function addBursar() {
  try {
    console.log('🏫 Adding bursar user...');

    // Find the first school (you can modify this to target a specific school)
    const school = await prisma.school.findFirst();
    
    if (!school) {
      console.error('❌ No school found. Please create a school first.');
      return;
    }

    console.log(`📍 Found school: ${school.name} (${school.code})`);

    // Check if bursar already exists
    const existingBursar = await prisma.user.findFirst({
      where: {
        email: 'bursar@school.com',
        schoolId: school.id,
        role: 'bursar'
      }
    });

    if (existingBursar) {
      console.log('ℹ️  Bursar user already exists for this school.');
      console.log(`📧 Email: ${existingBursar.email}`);
      console.log(`🔑 Password: bursar123 (default)`);
      console.log(`🌐 Login URL: http://localhost:3000/schools/${school.code}/bursar/login`);
      return;
    }

    // Hash the default password
    const hashedPassword = await bcrypt.hash('bursar123', 10);

    // Create bursar user
    const bursar = await prisma.user.create({
      data: {
        name: 'School Bursar',
        email: 'bursar@school.com',
        password: hashedPassword,
        role: 'bursar',
        schoolId: school.id,
      }
    });

    console.log('✅ Bursar user created successfully!');
    console.log(`👤 Name: ${bursar.name}`);
    console.log(`📧 Email: ${bursar.email}`);
    console.log(`🔑 Password: bursar123 (default - change after first login)`);
    console.log(`🏫 School: ${school.name} (${school.code})`);
    console.log(`🌐 Login URL: http://localhost:3000/schools/${school.code}/bursar/login`);
    
  } catch (error) {
    console.error('❌ Error creating bursar user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addBursar();


