const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSchoolGrades() {
  try {
    console.log('🔧 Fixing school-specific grades...');
    
    const school = await prisma.school.findFirst({
      where: { code: 'dis8651' }
    });
    
    if (!school) {
      console.log('❌ School not found');
      return;
    }
    
    console.log(`✅ School: ${school.name} (${school.code})`);
    
    // Check existing school-specific grades
    const existingGrades = await prisma.grade.findMany({
      where: { schoolId: school.id }
    });
    
    console.log(`📚 Existing school-specific grades: ${existingGrades.length}`);
    existingGrades.forEach(grade => {
      console.log(`   - ${grade.name}: ${grade.id}`);
    });
    
    if (existingGrades.length === 0) {
      console.log('\n➕ Creating school-specific grades...');
      
      // Create school-specific grades (Grade 1 to Grade 6)
      const gradeNames = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
      
      for (const gradeName of gradeNames) {
        const newGrade = await prisma.grade.create({
          data: {
            name: gradeName,
            schoolId: school.id,
            isAlumni: false
          }
        });
        
        console.log(`   ✅ Created: ${gradeName} (ID: ${newGrade.id})`);
      }
      
      console.log('\n🎉 School-specific grades created successfully!');
    } else {
      console.log('\n✅ School-specific grades already exist');
    }
    
    // Now check the student's class and update it to use school-specific grade
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
      console.log(`\n👤 Student: ${student.user.name}`);
      console.log(`   - Current Class: ${student.class.name}`);
      console.log(`   - Current Grade: ${student.class.grade?.name}`);
      console.log(`   - Current Grade ID: ${student.class.gradeId}`);
      
      // Find the corresponding school-specific grade
      const schoolGrade = await prisma.grade.findFirst({
        where: {
          schoolId: school.id,
          name: student.class.grade?.name || 'Grade 1'
        }
      });
      
      if (schoolGrade) {
        console.log(`   - School Grade ID: ${schoolGrade.id}`);
        
        // Update the class to use school-specific grade
        await prisma.class.update({
          where: { id: student.class.id },
          data: { gradeId: schoolGrade.id }
        });
        
        console.log(`   ✅ Updated class to use school-specific grade`);
      }
    }
    
    // Verify fee structures now work
    console.log('\n🧪 Testing fee structure fetching...');
    
    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: { schoolId: school.id },
      include: { grade: true }
    });
    
    console.log(`💰 Found ${feeStructures.length} fee structures:`);
    feeStructures.forEach(fee => {
      console.log(`   - ${fee.term} ${fee.year}: ${fee.totalAmount} (Grade: ${fee.grade?.name}, ID: ${fee.gradeId})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSchoolGrades(); 