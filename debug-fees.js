const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFees() {
  try {
    console.log('=== FEES DEBUG SCRIPT ===\n');

    // Replace with your actual school code
    const schoolCode = 'commodo excepteur te'; // Replace with your school code

    console.log('Testing with School Code:', schoolCode);
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

    // 2. Find the most recently created student
    const student = await prisma.student.findFirst({
      where: { schoolId: school.id, isActive: true },
      include: { 
        user: true, 
        class: { 
          include: { 
            grade: true 
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!student) {
      console.log('❌ No students found');
      return;
    }

    console.log('✅ Most recent student found:');
    console.log('  ID:', student.id);
    console.log('  Name:', student.user.name);
    console.log('  Class ID:', student.classId);
    console.log('  Class Name:', student.class?.name);
    console.log('  Grade ID:', student.class?.gradeId);
    console.log('  Grade Name:', student.class?.grade?.name);
    console.log('  Created:', student.createdAt);
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

    // 4. Get all fee structures for this grade (without filters)
    const allFeeStructuresForGrade = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class?.gradeId,
        isActive: true
      }
    });

    console.log('=== ALL FEE STRUCTURES FOR GRADE ===');
    console.log('Grade ID:', student.class?.gradeId);
    console.log('Total fee structures for this grade:', allFeeStructuresForGrade.length);
    
    if (allFeeStructuresForGrade.length === 0) {
      console.log('❌ No fee structures found for this grade!');
      console.log('');
      
      // Check if there are any fee structures at all
      const allFeeStructures = await prisma.termlyFeeStructure.findMany({
        where: { schoolId: school.id }
      });
      console.log('Total fee structures in school:', allFeeStructures.length);
      console.log('All fee structures:', allFeeStructures.map(fs => ({
        id: fs.id,
        gradeId: fs.gradeId,
        term: fs.term,
        year: fs.year,
        academicYearId: fs.academicYearId,
        termId: fs.termId,
        totalAmount: fs.totalAmount
      })));
    } else {
      console.log('Fee structures found:');
      allFeeStructuresForGrade.forEach((fs, index) => {
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

    // 5. Test the actual query that the API uses
    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class?.gradeId,
        isActive: true,
        NOT: [
          { termId: null },
          { academicYearId: null }
        ],
        ...(currentYear?.id ? { academicYearId: currentYear.id } : {})
      }
    });

    console.log('=== FILTERED FEE STRUCTURES (API QUERY) ===');
    console.log('Found fee structures after filtering:', feeStructures.length);
    
    if (feeStructures.length === 0) {
      console.log('❌ No fee structures found after filtering!');
      console.log('This means the fee structures are missing academicYearId or termId values.');
    } else {
      console.log('✅ Fee structures found after filtering:');
      feeStructures.forEach((fs, index) => {
        console.log(`  ${index + 1}. ID: ${fs.id}`);
        console.log(`     Term: ${fs.term}`);
        console.log(`     Year: ${fs.year}`);
        console.log(`     Academic Year ID: ${fs.academicYearId}`);
        console.log(`     Term ID: ${fs.termId}`);
        console.log(`     Total Amount: ${fs.totalAmount}`);
        console.log('');
      });
    }

    // 6. Check academic years and terms
    console.log('=== ACADEMIC YEARS AND TERMS ===');
    const academicYears = await prisma.academicYear.findMany({
      where: { schoolId: school.id }
    });
    console.log('Academic Years:', academicYears.map(ay => ({
      id: ay.id,
      name: ay.name,
      isCurrent: ay.isCurrent
    })));

    const terms = await prisma.term.findMany({
      where: { academicYearId: { in: academicYears.map(ay => ay.id) } }
    });
    console.log('Terms:', terms.map(t => ({
      id: t.id,
      name: t.name,
      academicYearId: t.academicYearId,
      isCurrent: t.isCurrent
    })));

    console.log('\n=== SUMMARY ===');
    if (feeStructures.length === 0) {
      console.log('❌ ISSUE FOUND: No fee structures match the API query criteria');
      console.log('Possible causes:');
      console.log('1. Fee structures missing academicYearId or termId values');
      console.log('2. Fee structures created for wrong academic year');
      console.log('3. Fee structures created for wrong grade');
    } else {
      console.log('✅ Fee structures found - the issue might be in the frontend filtering');
    }

  } catch (error) {
    console.error('Error in debug script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFees(); 