const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugGradeMismatch() {
  try {
    console.log('🔍 Debugging grade ID mismatch...');
    
    const school = await prisma.school.findFirst({
      where: { code: 'dis8651' }
    });
    
    if (!school) {
      console.log('❌ School not found');
      return;
    }
    
    console.log(`✅ School: ${school.name} (${school.code})`);
    
    // Get all grades for this school
    const schoolGrades = await prisma.grade.findMany({
      where: { schoolId: school.id }
    });
    
    console.log(`\n📚 School-specific grades:`);
    schoolGrades.forEach(grade => {
      console.log(`   - ${grade.name}: ${grade.id}`);
    });
    
    // Get platform-level grades
    const platformGrades = await prisma.grade.findMany({
      where: { schoolId: null }
    });
    
    console.log(`\n🌐 Platform-level grades:`);
    platformGrades.forEach(grade => {
      console.log(`   - ${grade.name}: ${grade.id}`);
    });
    
    // Get the student's class
    const student = await prisma.student.findFirst({
      where: {
        schoolId: school.id,
        user: { name: 'Ipsa dolorum magnam' }
      },
      include: {
        class: {
          include: {
            grade: true
          }
        }
      }
    });
    
    if (student) {
      console.log(`\n👤 Student: ${student.user.name}`);
      console.log(`   - Class: ${student.class?.name}`);
      console.log(`   - Class Grade ID: ${student.class?.gradeId}`);
      console.log(`   - Class Grade Name: ${student.class?.grade?.name}`);
      
      // Check if this grade ID matches school-specific or platform-level
      const isSchoolSpecific = schoolGrades.some(g => g.id === student.class?.gradeId);
      const isPlatformLevel = platformGrades.some(g => g.id === student.class?.gradeId);
      
      console.log(`   - Is School Specific: ${isSchoolSpecific}`);
      console.log(`   - Is Platform Level: ${isPlatformLevel}`);
      
      // Find the corresponding school-specific grade
      const correspondingSchoolGrade = schoolGrades.find(g => g.name === student.class?.grade?.name);
      if (correspondingSchoolGrade) {
        console.log(`   - Corresponding School Grade ID: ${correspondingSchoolGrade.id}`);
      }
    }
    
    // Check fee structures
    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: { schoolId: school.id },
      include: { grade: true }
    });
    
    console.log(`\n💰 Fee Structures:`);
    feeStructures.forEach(fee => {
      console.log(`   - ${fee.term} ${fee.year}: ${fee.totalAmount} (Grade: ${fee.grade?.name}, ID: ${fee.gradeId})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugGradeMismatch(); 