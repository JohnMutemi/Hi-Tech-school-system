const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugStudentGrade() {
  try {
    console.log('🔍 Debugging student grade assignments...');
    
    // Get all students for Dismas Primary School
    const school = await prisma.school.findFirst({
      where: { code: 'dis8651' }
    });
    
    if (!school) {
      console.log('❌ School not found');
      return;
    }
    
    console.log(`✅ Found school: ${school.name} (${school.code})`);
    
    // Get all students with their class and grade info
    const students = await prisma.student.findMany({
      where: {
        schoolId: school.id,
        isActive: true
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
    
    console.log(`\n📚 Found ${students.length} active students:`);
    
    students.forEach((student, index) => {
      console.log(`\n${index + 1}. Student: ${student.user.name}`);
      console.log(`   - ID: ${student.id}`);
      console.log(`   - Admission Number: ${student.admissionNumber}`);
      console.log(`   - Class: ${student.class?.name || 'No Class'}`);
      console.log(`   - Class ID: ${student.classId || 'No Class ID'}`);
      console.log(`   - Grade: ${student.class?.grade?.name || 'No Grade'}`);
      console.log(`   - Grade ID: ${student.class?.gradeId || 'No Grade ID'}`);
      console.log(`   - Academic Year: ${student.class?.academicYear || 'No Academic Year'}`);
    });
    
    // Check if any students are missing grade assignments
    const studentsWithoutGrade = students.filter(student => !student.class?.gradeId);
    if (studentsWithoutGrade.length > 0) {
      console.log(`\n⚠️  ${studentsWithoutGrade.length} students without grade assignments:`);
      studentsWithoutGrade.forEach(student => {
        console.log(`   - ${student.user.name} (${student.admissionNumber})`);
      });
    } else {
      console.log('\n✅ All students have grade assignments');
    }
    
    // Test fee structure fetching for each student
    console.log('\n🧪 Testing fee structure fetching for each student:');
    
    for (const student of students) {
      console.log(`\n📋 Testing for student: ${student.user.name}`);
      
      if (!student.class?.gradeId) {
        console.log('   ❌ No grade ID - cannot fetch fee structures');
        continue;
      }
      
      console.log(`   ✅ Grade ID: ${student.class.gradeId}`);
      console.log(`   ✅ Grade Name: ${student.class.grade?.name}`);
      
      // Test fetching fee structures for this grade
      const feeStructures = await prisma.termlyFeeStructure.findMany({
        where: {
          schoolId: school.id,
          gradeId: student.class.gradeId,
          isActive: true
        },
        include: {
          grade: true,
          academicYear: true,
          termRef: true
        }
      });
      
      console.log(`   📊 Found ${feeStructures.length} fee structures:`);
      feeStructures.forEach(fee => {
        console.log(`      - ${fee.term} ${fee.year}: ${fee.totalAmount} (${fee.grade?.name})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugStudentGrade(); 