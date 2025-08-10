const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixStudentClass() {
  try {
    console.log('🔧 Fixing student class grade assignment...');
    
    const school = await prisma.school.findFirst({
      where: { code: 'dis8651' }
    });
    
    if (!school) {
      console.log('❌ School not found');
      return;
    }
    
    console.log(`✅ School: ${school.name} (${school.code})`);
    
    // Get the student
    const student = await prisma.student.findFirst({
      where: {
        schoolId: school.id,
        user: { name: 'Ipsa dolorum magnam' }
      },
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
    
    console.log(`👤 Student: ${student.user.name}`);
    console.log(`   - Class: ${student.class?.name || 'No Class'}`);
    console.log(`   - Current Grade: ${student.class?.grade?.name || 'No Grade'}`);
    console.log(`   - Current Grade ID: ${student.class?.gradeId || 'No Grade ID'}`);
    
    if (!student.class) {
      console.log('❌ Student has no class assigned');
      return;
    }
    
    // Get school-specific Grade 1
    const schoolGrade1 = await prisma.grade.findFirst({
      where: {
        schoolId: school.id,
        name: 'Grade 1'
      }
    });
    
    if (!schoolGrade1) {
      console.log('❌ School-specific Grade 1 not found');
      return;
    }
    
    console.log(`📚 School-specific Grade 1: ${schoolGrade1.name} (ID: ${schoolGrade1.id})`);
    
    // Update the class to use school-specific grade
    await prisma.class.update({
      where: { id: student.class.id },
      data: { gradeId: schoolGrade1.id }
    });
    
    console.log(`✅ Updated class to use school-specific Grade 1`);
    
    // Verify the update
    const updatedStudent = await prisma.student.findFirst({
      where: {
        schoolId: school.id,
        user: { name: 'Ipsa dolorum magnam' }
      },
      include: {
        user: true,
        class: {
          include: {
            grade: true
          }
        }
      }
    });
    
    if (updatedStudent && updatedStudent.class) {
      console.log(`\n✅ Verification:`);
      console.log(`   - Student: ${updatedStudent.user.name}`);
      console.log(`   - Class: ${updatedStudent.class.name}`);
      console.log(`   - Grade: ${updatedStudent.class.grade?.name}`);
      console.log(`   - Grade ID: ${updatedStudent.class.gradeId}`);
      
      // Test fee structure fetching
      const feeStructures = await prisma.termlyFeeStructure.findMany({
        where: {
          schoolId: school.id,
          gradeId: updatedStudent.class.gradeId,
          isActive: true
        },
        include: { grade: true }
      });
      
      console.log(`\n💰 Fee structures for this student's grade:`);
      console.log(`   Found ${feeStructures.length} fee structures`);
      feeStructures.forEach(fee => {
        console.log(`   - ${fee.term} ${fee.year}: ${fee.totalAmount} (${fee.grade?.name})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixStudentClass(); 