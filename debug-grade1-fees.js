const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugGrade1Fees() {
  try {
    console.log('🔍 DEBUGGING GRADE 1 FEES STRUCTURE');
    console.log('=====================================\n');

    // 1. Find the school
    const schoolCode = 'commodo excepteur te';
    const school = await prisma.school.findFirst({
      where: { code: schoolCode }
    });

    if (!school) {
      console.log('❌ School not found');
      return;
    }

    console.log(`🏫 School: ${school.name} (ID: ${school.id})`);
    console.log(`📧 Email: hedyhywi@mailinator.com`);
    console.log('');

    // 2. Find Grade 1
    const grade1 = await prisma.grade.findFirst({
      where: {
        schoolId: school.id,
        name: { contains: '1' } // This will match "Grade 1", "1", etc.
      }
    });

    if (!grade1) {
      console.log('❌ Grade 1 not found');
      console.log('Available grades:');
      const allGrades = await prisma.grade.findMany({
        where: { schoolId: school.id },
        orderBy: { name: 'asc' }
      });
      allGrades.forEach(g => console.log(`  - ${g.name} (ID: ${g.id})`));
      return;
    }

    console.log(`📚 Grade 1 found: ${grade1.name} (ID: ${grade1.id})`);
    console.log('');

    // 3. Find all classes in Grade 1
    const grade1Classes = await prisma.class.findMany({
      where: {
        gradeId: grade1.id,
        isActive: true
      },
      include: {
        grade: true,
        teacher: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`🏫 Grade 1 Classes (${grade1Classes.length}):`);
    grade1Classes.forEach((cls, index) => {
      console.log(`  ${index + 1}. ${cls.name} (ID: ${cls.id})`);
      console.log(`     Teacher: ${cls.teacher?.name || 'Not Assigned'} (${cls.teacher?.email || 'N/A'})`);
      console.log(`     Academic Year: ${cls.academicYear}`);
      console.log(`     Active: ${cls.isActive}`);
      console.log('');
    });

    // 4. Find all students in Grade 1 classes
    const grade1Students = await prisma.student.findMany({
      where: {
        classId: { in: grade1Classes.map(c => c.id) },
        isActive: true
      },
      include: {
        class: {
          include: {
            grade: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`👥 Grade 1 Students (${grade1Students.length}):`);
    grade1Students.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.user?.name || 'N/A'} (ID: ${student.id})`);
      console.log(`     Admission: ${student.admissionNumber}`);
      console.log(`     Class: ${student.class?.name || 'Not Assigned'}`);
      console.log(`     Grade: ${student.class?.grade?.name || 'N/A'}`);
      console.log(`     Parent: ${student.parentName || 'N/A'} (${student.parentPhone || 'N/A'})`);
      console.log('');
    });

    // Also check all students in the school to see if any are in Grade 1 classes
    console.log(`🔍 CHECKING ALL STUDENTS FOR GRADE 1 CLASSES:`);
    const allStudents = await prisma.student.findMany({
      where: {
        schoolId: school.id,
        isActive: true
      },
      include: {
        class: {
          include: {
            grade: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    const studentsInGrade1Classes = allStudents.filter(student => 
      student.class?.grade?.name?.includes('1') || 
      student.class?.name?.includes('1')
    );

    console.log(`  Students in Grade 1 classes (by name matching): ${studentsInGrade1Classes.length}`);
    studentsInGrade1Classes.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.user?.name || 'N/A'} (ID: ${student.id})`);
      console.log(`     Admission: ${student.admissionNumber}`);
      console.log(`     Class: ${student.class?.name || 'Not Assigned'}`);
      console.log(`     Grade: ${student.class?.grade?.name || 'N/A'}`);
      console.log(`     Parent: ${student.parentName || 'N/A'} (${student.parentPhone || 'N/A'})`);
      console.log('');
    });

    // 5. Find current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: {
        schoolId: school.id,
        isCurrent: true
      }
    });

    console.log(`📅 Current Academic Year:`);
    if (currentAcademicYear) {
      console.log(`  ${currentAcademicYear.name} (ID: ${currentAcademicYear.id})`);
      console.log(`  Start: ${currentAcademicYear.startDate}`);
      console.log(`  End: ${currentAcademicYear.endDate}`);
    } else {
      console.log('  ❌ No current academic year found');
    }
    console.log('');

    // 6. Find current term
    const currentTerm = await prisma.term.findFirst({
      where: {
        academicYearId: currentAcademicYear?.id,
        isCurrent: true
      }
    });

    console.log(`📚 Current Term:`);
    if (currentTerm) {
      console.log(`  ${currentTerm.name} (ID: ${currentTerm.id})`);
      console.log(`  Start: ${currentTerm.startDate}`);
      console.log(`  End: ${currentTerm.endDate}`);
    } else {
      console.log('  ❌ No current term found');
    }
    console.log('');

    // 7. Find fee structures for Grade 1
    const grade1FeeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: grade1.id,
        isActive: true
      },
      include: {
        grade: true,
        academicYear: true,
        termRef: true
      },
      orderBy: [
        { year: 'desc' },
        { term: 'asc' }
      ]
    });

    console.log(`💰 Grade 1 Fee Structures (${grade1FeeStructures.length}):`);
    grade1FeeStructures.forEach((fee, index) => {
      console.log(`  ${index + 1}. ${fee.term || 'N/A'} ${fee.year || 'N/A'} (ID: ${fee.id})`);
      console.log(`     Amount: KES ${fee.totalAmount?.toLocaleString() || '0'}`);
      console.log(`     Grade: ${fee.grade?.name || 'N/A'}`);
      console.log(`     Academic Year ID: ${fee.academicYearId || 'N/A'}`);
      console.log(`     Term ID: ${fee.termId || 'N/A'}`);
      console.log(`     Active: ${fee.isActive}`);
      console.log(`     Breakdown:`, fee.breakdown);
      console.log('');
    });

    // 8. Test fee calculation for first student
    if (grade1Students.length > 0) {
      const testStudent = grade1Students[0];
      console.log(`🧪 TESTING FEE CALCULATION FOR: ${testStudent.user?.name}`);
      console.log('==================================================');

      // Get student's fee data
      const studentFees = await prisma.payment.findMany({
        where: { studentId: testStudent.id },
        orderBy: { paymentDate: 'asc' },
        include: {
          academicYear: true,
          term: true
        }
      });

      console.log(`📊 Student Payments (${studentFees.length}):`);
      studentFees.forEach((payment, index) => {
        console.log(`  ${index + 1}. KES ${payment.amount?.toLocaleString() || '0'}`);
        console.log(`     Date: ${payment.paymentDate}`);
        console.log(`     Description: ${payment.description || 'N/A'}`);
        console.log(`     Academic Year: ${payment.academicYear?.name || 'N/A'}`);
        console.log(`     Term: ${payment.term?.name || 'N/A'}`);
        console.log(`     Receipt: ${payment.receiptNumber || 'N/A'}`);
        console.log('');
      });

      // Calculate outstanding fees
      const applicableFeeStructures = grade1FeeStructures.filter(fs => {
        // Check if student joined before this fee structure
        if (testStudent.joinedAcademicYearId && fs.academicYearId) {
          return fs.academicYearId >= testStudent.joinedAcademicYearId;
        }
        return true;
      });

      console.log(`📋 Applicable Fee Structures (${applicableFeeStructures.length}):`);
      applicableFeeStructures.forEach((fs, index) => {
        console.log(`  ${index + 1}. ${fs.term} ${fs.year} - KES ${fs.totalAmount?.toLocaleString() || '0'}`);
      });
      console.log('');

      // Calculate total charges and payments
      const totalCharges = applicableFeeStructures.reduce((sum, fs) => sum + (fs.totalAmount || 0), 0);
      const totalPayments = studentFees.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const outstanding = totalCharges - totalPayments;

      console.log(`💰 FEE SUMMARY:`);
      console.log(`  Total Charges: KES ${totalCharges.toLocaleString()}`);
      console.log(`  Total Payments: KES ${totalPayments.toLocaleString()}`);
      console.log(`  Outstanding: KES ${outstanding.toLocaleString()}`);
      console.log('');

      // 9. Test API endpoint simulation
      console.log(`🌐 API ENDPOINT SIMULATION:`);
      console.log(`  GET /api/schools/${schoolCode}/students/${testStudent.id}/fees`);
      console.log(`  Expected Response Structure:`);
      console.log(`  {
        student: { id, name, admissionNumber, gradeName, className },
        termBalances: [
          { termId, academicYearId, term, year, totalAmount, balance }
        ],
        academicYearOutstanding: ${outstanding},
        outstanding: ${outstanding},
        arrears: 0,
        paymentHistory: [...]
      }`);
      console.log('');
    }

    // 10. Check for any data inconsistencies
    console.log(`🔍 DATA CONSISTENCY CHECK:`);
    
    // Check students without classes
    const studentsWithoutClasses = await prisma.student.findMany({
      where: {
        schoolId: school.id,
        classId: null,
        isActive: true
      }
    });
    console.log(`  Students without classes: ${studentsWithoutClasses.length}`);

    // Check all classes in the school
    const allClasses = await prisma.class.findMany({
      where: {
        schoolId: school.id
      },
      include: {
        grade: true
      }
    });
    console.log(`  Total classes in school: ${allClasses.length}`);
    allClasses.forEach((cls, index) => {
      console.log(`    ${index + 1}. ${cls.name} - Grade: ${cls.grade?.name || 'Not Assigned'}`);
    });

    // Check all fee structures in the school
    const allFeeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        schoolId: school.id
      },
      include: {
        grade: true
      }
    });
    console.log(`  Total fee structures in school: ${allFeeStructures.length}`);
    allFeeStructures.forEach((fee, index) => {
      console.log(`    ${index + 1}. ${fee.term} ${fee.year} - Grade: ${fee.grade?.name || 'Not Assigned'} - Amount: KES ${fee.totalAmount?.toLocaleString() || '0'}`);
    });

    console.log('');
    console.log('✅ DEBUG COMPLETE');

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug function
debugGrade1Fees(); 