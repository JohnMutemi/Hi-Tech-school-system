const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBulkPromotion() {
  console.log('🧪 Testing New Bulk Promotion System...\n');

  try {
    // Test 1: Check if schools exist
    console.log('📋 Test 1: Checking Schools...');
    const schools = await prisma.school.findMany({
      take: 1,
      include: {
        students: {
          include: {
            user: true,
            class: {
              include: {
                grade: true
              }
            }
          }
        },
        grades: true,
        classes: true
      }
    });

    if (schools.length === 0) {
      console.log('❌ No schools found. Please create a school first.');
      return;
    }

    const school = schools[0];
    console.log(`✅ Found school: ${school.name} (${school.code})`);
    console.log(`   - Students: ${school.students.length}`);
    console.log(`   - Grades: ${school.grades.length}`);
    console.log(`   - Classes: ${school.classes.length}`);

    // Test 2: Check if we have students in eligible grades
    console.log('\n📋 Test 2: Checking Eligible Students...');
    const eligibleGrades = ['1A', '2A', '3A', '4A', '5A', '6A'];
    
    const eligibleStudents = school.students.filter(student => 
      student.class && eligibleGrades.includes(student.class.grade.name)
    );

    console.log(`✅ Found ${eligibleStudents.length} students in eligible grades`);
    
    if (eligibleStudents.length > 0) {
      eligibleStudents.slice(0, 3).forEach(student => {
        console.log(`   - ${student.user.name} (${student.admissionNumber}) in ${student.class.grade.name}`);
      });
    }

    // Test 3: Test bulk promotion config API
    console.log('\n📋 Test 3: Testing Bulk Promotion Config API...');
    try {
      const configResponse = await fetch(`http://localhost:3000/api/schools/${school.code}/promotions/bulk/config`);
      if (configResponse.ok) {
        const configData = await configResponse.json();
        console.log('✅ Bulk promotion config API working');
        console.log(`   - Min Grade: ${configData.data.minGrade}%`);
        console.log(`   - Max Fee Balance: $${configData.data.maxFeeBalance}`);
        console.log(`   - Max Disciplinary Cases: ${configData.data.maxDisciplinaryCases}`);
      } else {
        console.log('❌ Bulk promotion config API failed');
      }
    } catch (error) {
      console.log('❌ Bulk promotion config API error:', error.message);
    }

    // Test 4: Test eligible students API
    console.log('\n📋 Test 4: Testing Eligible Students API...');
    try {
      const eligibleResponse = await fetch(
        `http://localhost:3000/api/schools/${school.code}/promotions/bulk/eligible?minGrade=50&maxFeeBalance=0&maxDisciplinaryCases=0`
      );
      if (eligibleResponse.ok) {
        const eligibleData = await eligibleResponse.json();
        console.log('✅ Eligible students API working');
        console.log(`   - Total students: ${eligibleData.data.length}`);
        console.log(`   - Eligible: ${eligibleData.data.filter(s => s.isEligible).length}`);
        console.log(`   - Ineligible: ${eligibleData.data.filter(s => !s.isEligible).length}`);
      } else {
        console.log('❌ Eligible students API failed');
      }
    } catch (error) {
      console.log('❌ Eligible students API error:', error.message);
    }

    // Test 5: Check database schema
    console.log('\n📋 Test 5: Checking Database Schema...');
    try {
      const bulkConfig = await prisma.bulkPromotionConfig.findFirst({
        where: { schoolId: school.id }
      });
      
      if (bulkConfig) {
        console.log('✅ BulkPromotionConfig table exists and has data');
        console.log(`   - Min Grade: ${bulkConfig.minGrade}%`);
        console.log(`   - Max Fee Balance: $${bulkConfig.maxFeeBalance}`);
        console.log(`   - Max Disciplinary Cases: ${bulkConfig.maxDisciplinaryCases}`);
      } else {
        console.log('⚠️  BulkPromotionConfig table exists but no data found');
      }
    } catch (error) {
      console.log('❌ BulkPromotionConfig table error:', error.message);
    }

    console.log('\n🎉 Bulk Promotion System Test Complete!');
    console.log('\nNext Steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Navigate to the school portal');
    console.log('3. Go to the Promotions tab');
    console.log('4. Configure promotion criteria');
    console.log('5. Review eligible students');
    console.log('6. Execute bulk promotion');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBulkPromotion(); 