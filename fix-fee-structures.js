const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixFeeStructures() {
  try {
    console.log('=== FIXING FEE STRUCTURES ===\n');

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

    // Get current academic year
    const currentYear = await prisma.academicYear.findFirst({
      where: { schoolId: school.id, isCurrent: true },
    });

    if (!currentYear) {
      console.log('❌ No current academic year found');
      return;
    }

    console.log('Current Academic Year:');
    console.log('  ID:', currentYear.id);
    console.log('  Name:', currentYear.name);
    console.log('');

    // Get all fee structures for this school
    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: { schoolId: school.id }
    });

    console.log(`Found ${feeStructures.length} fee structures to update`);
    console.log('');

    // Update each fee structure to use the current academic year
    let updatedCount = 0;
    for (const fs of feeStructures) {
      if (fs.academicYearId !== currentYear.id) {
        console.log(`Updating fee structure ${fs.id}:`);
        console.log(`  Old academicYearId: ${fs.academicYearId}`);
        console.log(`  New academicYearId: ${currentYear.id}`);
        console.log(`  Term: ${fs.term}, Amount: ${fs.totalAmount}`);
        
        await prisma.termlyFeeStructure.update({
          where: { id: fs.id },
          data: { 
            academicYearId: currentYear.id,
            updatedAt: new Date()
          }
        });
        
        updatedCount++;
        console.log('  ✅ Updated');
        console.log('');
      }
    }

    console.log(`✅ Updated ${updatedCount} fee structures to use current academic year`);
    console.log('');

    // Verify the changes
    const updatedFeeStructures = await prisma.termlyFeeStructure.findMany({
      where: { 
        schoolId: school.id,
        academicYearId: currentYear.id
      }
    });

    console.log('Fee structures now using current academic year:');
    updatedFeeStructures.forEach((fs, index) => {
      console.log(`  ${index + 1}. ID: ${fs.id}`);
      console.log(`     Term: ${fs.term}`);
      console.log(`     Academic Year ID: ${fs.academicYearId}`);
      console.log(`     Total Amount: ${fs.totalAmount}`);
      console.log('');
    });

    console.log('✅ Fix completed! Now the fees should show up in the parent dashboard.');

  } catch (error) {
    console.error('Error fixing fee structures:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixFeeStructures(); 