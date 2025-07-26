const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSimplePromotion() {
  console.log('🧪 Testing Simple Promotion System...\n');

  try {
    // Test 1: Check if school exists
    const school = await prisma.school.findFirst();
    if (!school) {
      console.log('❌ No school found. Please create a school first.');
      return;
    }
    console.log(`✅ Found school: ${school.name} (${school.code})`);

    // Test 2: Check if academic year exists
    let academicYear = await prisma.academicYear.findFirst({
      where: { schoolId: school.id }
    });
    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          schoolId: school.id,
          name: '2025',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          isCurrent: true
        }
      });
      console.log(`✅ Created academic year: ${academicYear.name}`);
    } else {
      console.log(`✅ Found academic year: ${academicYear.name}`);
    }

    // Test 3: Check if grades exist
    const grades = ['1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', 'Grade 6', 'Alumni'];
    for (const gradeName of grades) {
      let grade = await prisma.grade.findFirst({
        where: { schoolId: school.id, name: gradeName }
      });
      if (!grade) {
        grade = await prisma.grade.create({
          data: {
            name: gradeName,
            schoolId: school.id,
            isAlumni: gradeName === 'Alumni'
          }
        });
        console.log(`✅ Created grade: ${grade.name}`);
      } else {
        console.log(`✅ Found grade: ${grade.name}`);
      }
    }

    // Test 4: Check if classes exist
    const classes = ['1A', '2A', '3A'];
    for (const className of classes) {
      let classRecord = await prisma.class.findFirst({
        where: { schoolId: school.id, name: className }
      });
      if (!classRecord) {
        const grade = await prisma.grade.findFirst({
          where: { schoolId: school.id, name: className }
        });
        classRecord = await prisma.class.create({
          data: {
            name: className,
            schoolId: school.id,
            academicYear: academicYear.name,
            gradeId: grade.id,
            isActive: true
          }
        });
        console.log(`✅ Created class: ${classRecord.name}`);
      } else {
        console.log(`✅ Found class: ${classRecord.name}`);
      }
    }

    // Test 5: Check if students exist
    const students = await prisma.student.findMany({
      where: { schoolId: school.id },
      include: { user: true, class: true }
    });
    console.log(`✅ Found ${students.length} students`);

    if (students.length === 0) {
      console.log('⚠️  No students found. Please create some students first.');
      return;
    }

    // Test 6: Check promotion criteria API
    console.log('\n📋 Testing Promotion Criteria API...');
    try {
      const criteriaResponse = await fetch(`http://localhost:3000/api/schools/${school.code}/promotions/criteria`);
      if (criteriaResponse.ok) {
        const criteriaData = await criteriaResponse.json();
        console.log('✅ Criteria API working:', criteriaData);
      } else {
        console.log('❌ Criteria API failed');
      }
    } catch (error) {
      console.log('⚠️  Criteria API test skipped (server may not be running)');
    }

    // Test 7: Check eligible students API
    console.log('\n👥 Testing Eligible Students API...');
    try {
      const eligibleResponse = await fetch(`http://localhost:3000/api/schools/${school.code}/promotions/eligible?maxFeeBalance=0&passMark=50&requireGrade=true`);
      if (eligibleResponse.ok) {
        const eligibleData = await eligibleResponse.json();
        console.log(`✅ Eligible students API working: ${eligibleData.students?.length || 0} students found`);
      } else {
        console.log('❌ Eligible students API failed');
      }
    } catch (error) {
      console.log('⚠️  Eligible students API test skipped (server may not be running)');
    }

    console.log('\n🎉 Simple Promotion System Test Complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Navigate to the promotions page');
    console.log('3. Set promotion criteria (max fee balance, pass mark, grade requirement)');
    console.log('4. Check eligible students');
    console.log('5. Execute bulk promotion');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSimplePromotion(); 