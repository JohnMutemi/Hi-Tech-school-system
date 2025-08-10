const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCurrentYear() {
  try {
    console.log('=== FIXING CURRENT ACADEMIC YEAR ===\n');

    const schoolCode = 'commodo excepteur te';
    
    // Find the school
    const school = await prisma.school.findUnique({ 
      where: { code: schoolCode } 
    });
    
    if (!school) {
      console.log('❌ School not found');
      return;
    }
    console.log('✅ School found:', school.name);
    console.log('');

    // Get all academic years for this school
    const academicYears = await prisma.academicYear.findMany({
      where: { schoolId: school.id }
    });

    console.log('Current Academic Years:');
    academicYears.forEach(ay => {
      console.log(`  ${ay.name} (ID: ${ay.id}) - isCurrent: ${ay.isCurrent}`);
    });
    console.log('');

    // Set 2025 as current (since that's where your fee structures are)
    const year2025 = academicYears.find(ay => ay.name === '2025');
    
    if (year2025) {
      // First, set all academic years as not current
      await prisma.academicYear.updateMany({
        where: { schoolId: school.id },
        data: { isCurrent: false }
      });

      // Then set 2025 as current
      await prisma.academicYear.update({
        where: { id: year2025.id },
        data: { isCurrent: true }
      });

      console.log('✅ Set Academic Year 2025 as current');
    } else {
      console.log('❌ Academic Year 2025 not found');
    }

    // Verify the change
    const updatedYear = await prisma.academicYear.findFirst({
      where: { schoolId: school.id, isCurrent: true }
    });

    console.log('\nUpdated Current Academic Year:');
    console.log('  ID:', updatedYear?.id);
    console.log('  Name:', updatedYear?.name);
    console.log('  Is Current:', updatedYear?.isCurrent);

    console.log('\n✅ Fix completed! Now the fees should show up in the parent dashboard.');

  } catch (error) {
    console.error('Error fixing current year:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCurrentYear(); 