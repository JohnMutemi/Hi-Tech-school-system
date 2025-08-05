const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testParentAPI() {
  try {
    console.log('🔍 Testing Parent API and Fee Structure fetching...');
    
    const school = await prisma.school.findFirst({
      where: { code: 'dis8651' }
    });
    
    if (!school) {
      console.log('❌ School not found');
      return;
    }
    
    console.log(`✅ School: ${school.name} (${school.code})`);
    
    // Get the student and their parent
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
        },
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
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
    console.log(`   - Grade: ${student.class?.grade?.name || 'No Grade'}`);
    console.log(`   - Grade ID: ${student.class?.gradeId || 'No Grade ID'}`);
    console.log(`   - Parent: ${student.parent?.name || 'No Parent'}`);
    
    // Simulate what the parent session API would return
    const parentData = {
      parent: student.parent,
      students: [{
        id: student.id,
        name: student.user.name,
        gradeId: student.class?.gradeId,
        gradeName: student.class?.grade?.name,
        className: student.class?.name
      }]
    };
    
    console.log('\n📋 Parent Session Data:');
    console.log(JSON.stringify(parentData, null, 2));
    
    // Test fee structure fetching with gradeName
    const currentYear = new Date().getFullYear();
    const gradeName = student.class?.grade?.name;
    
    console.log(`\n💰 Testing Fee Structure API with:`);
    console.log(`   - Grade Name: ${gradeName}`);
    console.log(`   - Year: ${currentYear}`);
    
    // Test for each term
    const terms = ['Term 1', 'Term 2', 'Term 3'];
    
    for (const term of terms) {
      console.log(`\n📚 Testing ${term} ${currentYear}:`);
      
      const feeStructures = await prisma.termlyFeeStructure.findMany({
        where: {
          schoolId: school.id,
          term: term,
          year: currentYear,
          grade: {
            name: gradeName,
            schoolId: school.id
          },
          isActive: true
        },
        include: {
          grade: true
        }
      });
      
      console.log(`   Found ${feeStructures.length} fee structures`);
      feeStructures.forEach(fee => {
        console.log(`   - ${fee.term} ${fee.year}: ${fee.totalAmount} (${fee.grade?.name})`);
      });
    }
    
    // Test the exact query that the parent dashboard would use
    console.log(`\n🔍 Testing exact parent dashboard query:`);
    
    const allFeeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        schoolId: school.id,
        grade: {
          name: gradeName,
          schoolId: school.id
        },
        isActive: true
      },
      include: {
        grade: true
      }
    });
    
    console.log(`   Total active fee structures for ${gradeName}: ${allFeeStructures.length}`);
    allFeeStructures.forEach(fee => {
      console.log(`   - ${fee.term} ${fee.year}: ${fee.totalAmount} (${fee.grade?.name})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testParentAPI(); 