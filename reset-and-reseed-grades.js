const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetAndReseedGrades() {
  try {
    console.log('🔄 RESETTING AND RE-SEEDING GRADES');
    console.log('===================================\n');

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
    console.log('');

    // 2. Delete all existing classes
    console.log('🗑️ DELETING EXISTING CLASSES...');
    const deletedClasses = await prisma.class.deleteMany({
      where: {
        schoolId: school.id
      }
    });
    console.log(`✅ Deleted ${deletedClasses.count} existing classes`);
    console.log('');

    // 3. Delete all existing grades
    console.log('🗑️ DELETING EXISTING GRADES...');
    const deletedGrades = await prisma.grade.deleteMany({
      where: {
        schoolId: school.id
      }
    });
    console.log(`✅ Deleted ${deletedGrades.count} existing grades`);
    console.log('');

    // 4. Re-seed grades from Grade 1 to Grade 6
    console.log('🌱 RE-SEEDING GRADES (Grade 1 to Grade 6)...');
    const grades = [
      { name: 'Grade 1' },
      { name: 'Grade 2' },
      { name: 'Grade 3' },
      { name: 'Grade 4' },
      { name: 'Grade 5' },
      { name: 'Grade 6' }
    ];

    const createdGrades = [];

    for (const gradeData of grades) {
      try {
        const newGrade = await prisma.grade.create({
          data: {
            name: gradeData.name,
            schoolId: school.id,
            isAlumni: false
          }
        });

        createdGrades.push(newGrade);
        console.log(`✅ Created grade: ${newGrade.name} (ID: ${newGrade.id})`);
      } catch (error) {
        console.log(`❌ Failed to create grade ${gradeData.name}:`, error.message);
      }
    }

    console.log('');
    console.log(`🎉 Successfully created ${createdGrades.length} grades`);
    console.log('');

    // 5. Create sample classes for each grade
    console.log('🏫 CREATING SAMPLE CLASSES FOR EACH GRADE...');
    const createdClasses = [];

    for (const grade of createdGrades) {
      // Create 2-3 classes per grade (A, B, C)
      const classSuffixes = ['A', 'B', 'C'];
      
      for (const suffix of classSuffixes) {
        try {
          const newClass = await prisma.class.create({
            data: {
              name: `${grade.name}${suffix}`,
              schoolId: school.id,
              gradeId: grade.id,
              academicYear: '2025',
              isActive: true
            },
            include: {
              grade: true
            }
          });

          createdClasses.push(newClass);
          console.log(`✅ Created class: ${newClass.name} - Grade: ${newClass.grade?.name}`);
        } catch (error) {
          console.log(`❌ Failed to create class ${grade.name}${suffix}:`, error.message);
        }
      }
    }

    console.log('');
    console.log(`🎉 Successfully created ${createdClasses.length} classes`);
    console.log('');

    // 6. Show summary
    console.log('📊 SUMMARY:');
    console.log(`  Grades created: ${createdGrades.length}`);
    console.log(`  Classes created: ${createdClasses.length}`);
    console.log('');

    // 7. List all created grades and classes
    console.log('📋 ALL GRADES:');
    createdGrades.forEach((grade, index) => {
      console.log(`  ${index + 1}. ${grade.name} (ID: ${grade.id})`);
    });
    console.log('');

    console.log('📋 ALL CLASSES:');
    createdClasses.forEach((cls, index) => {
      console.log(`  ${index + 1}. ${cls.name} - Grade: ${cls.grade?.name} (ID: ${cls.id})`);
    });
    console.log('');

    // 8. Check students without classes
    const studentsWithoutClasses = await prisma.student.findMany({
      where: {
        schoolId: school.id,
        classId: null,
        isActive: true
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`👥 Students without classes: ${studentsWithoutClasses.length}`);
    if (studentsWithoutClasses.length > 0) {
      console.log('  These students can now be assigned to classes:');
      studentsWithoutClasses.forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.user?.name || 'N/A'} (ID: ${student.id})`);
        console.log(`     Admission: ${student.admissionNumber}`);
        console.log(`     Parent: ${student.parentName || 'N/A'} (${student.parentPhone || 'N/A'})`);
      });
      console.log('');
    }

    console.log('✅ RESET AND RE-SEED COMPLETE');
    console.log('');
    console.log('📝 NEXT STEPS:');
    console.log('1. Assign students to the appropriate classes');
    console.log('2. Test the parent dashboard to see if fees are now showing');
    console.log('3. Run the debug script to verify the setup');

  } catch (error) {
    console.error('❌ Error during reset and re-seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
resetAndReseedGrades(); 