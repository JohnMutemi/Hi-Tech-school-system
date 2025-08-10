const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateNewFeeStructures() {
  try {
    // Get Grade 1
    const grade1 = await prisma.grade.findFirst({
      where: { name: 'Grade 1' }
    });

    if (!grade1) {
      console.log('Grade 1 not found');
      return;
    }

    // Find the new fee structures with amounts 8000, 5000, 4000
    const newFeeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: grade1.id,
        year: 2025,
        totalAmount: {
          in: [8000, 5000, 4000]
        }
      }
    });

    console.log(`Found ${newFeeStructures.length} new fee structures to update:`);
    newFeeStructures.forEach(fs => {
      console.log(`- ID: ${fs.id}, Term: ${fs.term}, Amount: ${fs.totalAmount}`);
    });

    // Update each one with current timestamp
    for (const fs of newFeeStructures) {
      await prisma.termlyFeeStructure.update({
        where: { id: fs.id },
        data: {
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated fee structure ${fs.id} (${fs.term}: ${fs.totalAmount})`);
    }

    console.log('\nAll new fee structures updated successfully!');
    console.log('Now refresh the parent dashboard to see the correct amounts.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateNewFeeStructures(); 