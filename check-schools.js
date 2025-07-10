const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSchools() {
  try {
    console.log('Checking schools in database...');
    
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        email: true,
        isActive: true
      }
    });
    
    console.log(`Found ${schools.length} schools:`);
    schools.forEach(school => {
      console.log(`- ${school.name} (${school.code}) - ${school.isActive ? 'Active' : 'Inactive'}`);
    });
    
    // Check if CAS3642 exists
    const casSchool = await prisma.school.findUnique({
      where: { code: 'CAS3642' }
    });
    
    if (casSchool) {
      console.log('\n✅ School CAS3642 exists in database');
    } else {
      console.log('\n❌ School CAS3642 does not exist in database');
    }
    
  } catch (error) {
    console.error('Error checking schools:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchools(); 