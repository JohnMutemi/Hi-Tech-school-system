const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFeesAPI() {
  try {
    console.log('=== TESTING FEES API ===\n');

    const schoolCode = 'commodo excepteur te';
    const studentId = '260ab42f-2705-4b65-a799-b8e0b8d0feed';

    console.log('Testing with:');
    console.log('School Code:', schoolCode);
    console.log('Student ID:', studentId);
    console.log('');

    // 1. Find the school
    const school = await prisma.school.findUnique({ 
      where: { code: schoolCode } 
    });
    
    if (!school) {
      console.log('❌ School not found');
      return;
    }
    console.log('✅ School found:', school.name);
    console.log('');

    // 2. Find the student
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: school.id, isActive: true },
      include: { 
        user: true, 
        class: { 
          include: { 
            grade: true 
          } 
        } 
      }
    });

    if (!student) {
      console.log('❌ Student not found');
      return;
    }

    console.log('✅ Student found:');
    console.log('  Name:', student.user.name);
    console.log('  Class ID:', student.classId);
    console.log('  Class Name:', student.class?.name);
    console.log('  Grade ID:', student.class?.gradeId);
    console.log('  Grade Name:', student.class?.grade?.name);
    console.log('');

    // 3. Get current academic year
    const currentYear = await prisma.academicYear.findFirst({
      where: { schoolId: school.id, isCurrent: true },
    });

    console.log('Current Academic Year:');
    console.log('  ID:', currentYear?.id);
    console.log('  Name:', currentYear?.name);
    console.log('  Is Current:', currentYear?.isCurrent);
    console.log('');

    // 4. Test the exact query from the API
    console.log('=== TESTING API QUERY ===');
    
    // Get all fee structures for this grade (simplified approach)
    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class?.gradeId,
        isActive: true
      }
    });

    console.log(`Found ${feeStructures.length} fee structures for grade ${student.class?.gradeId}`);
    
    if (feeStructures.length > 0) {
      console.log('Fee structures found:');
      feeStructures.forEach((fs, index) => {
        console.log(`  ${index + 1}. ID: ${fs.id}`);
        console.log(`     Grade ID: ${fs.gradeId}`);
        console.log(`     Term: ${fs.term}`);
        console.log(`     Year: ${fs.year}`);
        console.log(`     Academic Year ID: ${fs.academicYearId}`);
        console.log(`     Term ID: ${fs.termId}`);
        console.log(`     Total Amount: ${fs.totalAmount}`);
        console.log(`     Is Active: ${fs.isActive}`);
        console.log('');
      });
    }

    // 5. Test the filtering logic
    if (currentYear && feeStructures.length > 0) {
      const filteredFeeStructures = feeStructures.filter(fs => fs.academicYearId === currentYear.id);
      console.log(`Filtered to ${filteredFeeStructures.length} fee structures for current academic year`);
      
      if (filteredFeeStructures.length > 0) {
        console.log('Filtered fee structures:');
        filteredFeeStructures.forEach((fs, index) => {
          console.log(`  ${index + 1}. Term: ${fs.term}, Amount: ${fs.totalAmount}`);
        });
      }
    }

    // 6. Test the final result that would be returned
    console.log('\n=== FINAL RESULT ===');
    if (feeStructures.length === 0) {
      console.log('❌ No fee structures found - this is why the API returns empty results');
    } else {
      console.log('✅ Fee structures found - the API should return data');
      console.log('If the API is still returning empty results, there might be an issue with the join date filtering or other logic');
    }

  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFeesAPI(); 