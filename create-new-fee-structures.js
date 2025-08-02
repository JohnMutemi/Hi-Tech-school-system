const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createNewFeeStructures() {
  try {
    // Get the current academic year (2025)
    const currentYear = await prisma.academicYear.findFirst({
      where: { name: '2025', isCurrent: true }
    });

    if (!currentYear) {
      console.log('Current academic year (2025) not found');
      return;
    }

    // Get Grade 1
    const grade1 = await prisma.grade.findFirst({
      where: { name: 'Grade 1' }
    });

    if (!grade1) {
      console.log('Grade 1 not found');
      return;
    }

    // Get terms for 2025
    const terms = await prisma.term.findMany({
      where: { academicYearId: currentYear.id },
      orderBy: { name: 'asc' }
    });

    console.log('Creating new fee structures for Grade 1, 2025:');
    console.log('Academic Year ID:', currentYear.id);
    console.log('Grade ID:', grade1.id);
    console.log('Terms:', terms.map(t => t.name));

    // Create new fee structures with the amounts you want
    const newFeeStructures = [
      { term: 'Term 1', amount: 8000 },
      { term: 'Term 2', amount: 5000 },
      { term: 'Term 3', amount: 4000 }
    ];

    for (const feeStructure of newFeeStructures) {
      const term = terms.find(t => t.name === feeStructure.term);
      
      if (!term) {
        console.log(`Term ${feeStructure.term} not found`);
        continue;
      }

      // Create the fee structure
      const newFeeStructure = await prisma.termlyFeeStructure.create({
        data: {
          gradeId: grade1.id,
          term: feeStructure.term,
          year: 2025,
          academicYearId: currentYear.id,
          termId: term.id,
          totalAmount: feeStructure.amount,
          isActive: true
        }
      });

      console.log(`Created fee structure for ${feeStructure.term}: Amount ${feeStructure.amount}, ID: ${newFeeStructure.id}`);
    }

    console.log('\nNew fee structures created successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createNewFeeStructures(); 