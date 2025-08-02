const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFeeStructures() {
  try {
    const studentId = '260ab42f-2705-4b65-a799-b8e0b8d0feed'; // Replace with your student ID
    
    // Get student info
    const student = await prisma.student.findFirst({
      where: { id: studentId },
      include: {
        class: {
          include: {
            grade: true
          }
        }
      }
    });

    console.log('Student:', {
      id: student.id,
      name: student.user?.name,
      grade: student.class?.grade?.name,
      gradeId: student.class?.gradeId
    });

    // Get all fee structures for this grade
    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class?.gradeId,
        isActive: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    console.log(`\nFound ${feeStructures.length} fee structures for grade ${student.class?.grade?.name}:`);
    
    feeStructures.forEach((fs, index) => {
      console.log(`${index + 1}. ID: ${fs.id}`);
      console.log(`   Term: ${fs.term}`);
      console.log(`   Amount: ${fs.totalAmount}`);
      console.log(`   Year: ${fs.year}`);
      console.log(`   AcademicYearId: ${fs.academicYearId}`);
      console.log(`   Updated: ${fs.updatedAt}`);
      console.log('---');
    });

    // Check for the expected amounts (8000, 5000, 4000)
    const expectedAmounts = [8000, 5000, 4000];
    console.log('\nLooking for fee structures with expected amounts:');
    expectedAmounts.forEach(amount => {
      const found = feeStructures.filter(fs => fs.totalAmount === amount);
      console.log(`Amount ${amount}: Found ${found.length} fee structures`);
      found.forEach(fs => {
        console.log(`  - ID: ${fs.id}, Term: ${fs.term}, Year: ${fs.year}`);
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFeeStructures(); 