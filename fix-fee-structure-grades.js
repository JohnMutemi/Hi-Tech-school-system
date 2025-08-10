const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixFeeStructureGrades() {
  try {
    console.log('🔧 Fixing fee structure grade IDs...');
    
    const school = await prisma.school.findFirst({
      where: { code: 'dis8651' }
    });
    
    if (!school) {
      console.log('❌ School not found');
      return;
    }
    
    console.log(`✅ School: ${school.name} (${school.code})`);
    
    // Get school-specific grades
    const schoolGrades = await prisma.grade.findMany({
      where: { schoolId: school.id }
    });
    
    console.log(`📚 School-specific grades:`);
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
    
    // Get current fee structures
    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: { schoolId: school.id },
      include: { grade: true }
    });
    
    console.log(`\n💰 Current fee structures:`);
    feeStructures.forEach(fee => {
      console.log(`   - ${fee.term} ${fee.year}: ${fee.totalAmount} (Grade: ${fee.grade?.name}, ID: ${fee.gradeId})`);
    });
    
    // Update fee structures to use school-specific grade IDs
    console.log('\n🔄 Updating fee structures...');
    
    for (const fee of feeStructures) {
      const currentGrade = fee.grade;
      if (currentGrade && currentGrade.schoolId === null) {
        // This is a platform-level grade, find the corresponding school-specific grade
        const schoolGrade = schoolGrades.find(g => g.name === currentGrade.name);
        
        if (schoolGrade) {
          console.log(`   📝 Updating ${fee.term} ${fee.year} from ${currentGrade.id} to ${schoolGrade.id}`);
          
          await prisma.termlyFeeStructure.update({
            where: { id: fee.id },
            data: { gradeId: schoolGrade.id }
          });
          
          console.log(`   ✅ Updated successfully`);
        } else {
          console.log(`   ⚠️  No school-specific grade found for ${currentGrade.name}`);
        }
      } else {
        console.log(`   ✅ ${fee.term} ${fee.year} already uses school-specific grade`);
      }
    }
    
    // Verify the updates
    console.log('\n🧪 Verifying updates...');
    
    const updatedFeeStructures = await prisma.termlyFeeStructure.findMany({
      where: { schoolId: school.id },
      include: { grade: true }
    });
    
    console.log(`💰 Updated fee structures:`);
    updatedFeeStructures.forEach(fee => {
      console.log(`   - ${fee.term} ${fee.year}: ${fee.totalAmount} (Grade: ${fee.grade?.name}, ID: ${fee.gradeId})`);
    });
    
    // Test with the student's grade
    console.log('\n🧪 Testing with student grade...');
    
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
    
    if (student && student.class) {
      console.log(`👤 Student: ${student.user.name}`);
      console.log(`   - Class Grade: ${student.class.grade?.name}`);
      console.log(`   - Class Grade ID: ${student.class.gradeId}`);
      
      // Test fee structure fetching
      const matchingFeeStructures = await prisma.termlyFeeStructure.findMany({
        where: {
          schoolId: school.id,
          gradeId: student.class.gradeId,
          isActive: true
        },
        include: { grade: true }
      });
      
      console.log(`   📊 Found ${matchingFeeStructures.length} matching fee structures:`);
      matchingFeeStructures.forEach(fee => {
        console.log(`      - ${fee.term} ${fee.year}: ${fee.totalAmount}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixFeeStructureGrades(); 