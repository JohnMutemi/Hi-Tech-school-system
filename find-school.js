const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findSchools() {
  try {
    console.log('=== FINDING SCHOOLS ===\n');

    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${schools.length} schools:`);
    schools.forEach((school, index) => {
      console.log(`${index + 1}. Name: ${school.name}`);
      console.log(`   Code: ${school.code}`);
      console.log(`   Active: ${school.isActive}`);
      console.log(`   Created: ${school.createdAt}`);
      console.log('');
    });

    if (schools.length === 0) {
      console.log('No schools found in database');
    }

  } catch (error) {
    console.error('Error finding schools:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findSchools(); 