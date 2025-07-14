const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addBursar() {
  try {
    // Get the first school (or specify a school code)
    const school = await prisma.school.findFirst();
    
    if (!school) {
      console.error('No school found. Please create a school first.');
      return;
    }

    console.log(`Adding bursar to school: ${school.name} (${school.code})`);

    // Check if bursar already exists
    const existingBursar = await prisma.user.findFirst({
      where: {
        schoolId: school.id,
        role: 'bursar',
      },
    });

    if (existingBursar) {
      console.log('Bursar already exists:', existingBursar.email);
      return;
    }

    // Hash the default bursar password
    const hashedPassword = await bcrypt.hash('bursar123', 12);

    // Create bursar user
    const bursar = await prisma.user.create({
      data: {
        name: 'School Bursar',
        email: 'bursar@school.com',
        password: hashedPassword,
        role: 'bursar',
        schoolId: school.id,
        isActive: true,
        phone: '+254700000000',
      },
    });

    console.log('✅ Bursar created successfully!');
    console.log('📧 Email:', bursar.email);
    console.log('🔑 Password: bursar123');
    console.log('🏫 School:', school.name);
    console.log('🔗 Login URL:', `http://localhost:3000/schools/${school.code}/bursar/login`);

  } catch (error) {
    console.error('❌ Error creating bursar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addBursar(); 