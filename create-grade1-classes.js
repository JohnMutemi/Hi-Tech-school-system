const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createGrade1Classes() {
  try {
    console.log('🏫 CREATING GRADE 1 CLASSES');
    console.log('============================\n');

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

    // 2. Find Grade 1
    const grade1 = await prisma.grade.findFirst({
      where: {
        schoolId: school.id,
        name: { contains: '1' }
      }
    });

    if (!grade1) {
      console.log('❌ Grade 1 not found');
      return;
    }

    console.log(`📚 Grade 1 found: ${grade1.name} (ID: ${grade1.id})`);
    console.log('');

    // 3. Check existing classes
    const existingClasses = await prisma.class.findMany({
      where: {
        schoolId: school.id
      },
      include: {
        grade: true
      }
    });

    console.log(`📋 Existing Classes (${existingClasses.length}):`);
    existingClasses.forEach((cls, index) => {
      console.log(`  ${index + 1}. ${cls.name} - Grade: ${cls.grade?.name || 'Not Assigned'}`);
    });
    console.log('');

    // 4. Check if Grade 1 classes already exist
    const existingGrade1Classes = existingClasses.filter(cls => 
      cls.gradeId === grade1.id || 
      cls.name.toLowerCase().includes('grade 1') ||
      cls.name.toLowerCase().includes('1a') ||
      cls.name.toLowerCase().includes('1b')
    );

    if (existingGrade1Classes.length > 0) {
      console.log(`✅ Grade 1 classes already exist (${existingGrade1Classes.length}):`);
      existingGrade1Classes.forEach((cls, index) => {
        console.log(`  ${index + 1}. ${cls.name} - Grade: ${cls.grade?.name || 'Not Assigned'}`);
      });
      console.log('');
    } else {
      console.log('❌ No Grade 1 classes found. Creating them...');
      console.log('');

      // 5. Create Grade 1 classes
      const grade1Classes = [
        { name: 'Grade 1A', academicYear: '2025' },
        { name: 'Grade 1B', academicYear: '2025' },
        { name: 'Grade 1C', academicYear: '2025' }
      ];

      const createdClasses = [];

      for (const classData of grade1Classes) {
        try {
          const newClass = await prisma.class.create({
            data: {
              name: classData.name,
              schoolId: school.id,
              gradeId: grade1.id,
              academicYear: classData.academicYear,
              isActive: true
            },
            include: {
              grade: true
            }
          });

          createdClasses.push(newClass);
          console.log(`✅ Created class: ${newClass.name} - Grade: ${newClass.grade?.name}`);
        } catch (error) {
          console.log(`❌ Failed to create class ${classData.name}:`, error.message);
        }
      }

      console.log('');
      console.log(`🎉 Successfully created ${createdClasses.length} Grade 1 classes`);
      console.log('');
    }

    // 6. Check students without classes
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
      console.log('  These students can be assigned to Grade 1 classes:');
      studentsWithoutClasses.forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.user?.name || 'N/A'} (ID: ${student.id})`);
        console.log(`     Admission: ${student.admissionNumber}`);
        console.log(`     Parent: ${student.parentName || 'N/A'} (${student.parentPhone || 'N/A'})`);
      });
      console.log('');
    }

    // 7. Get all Grade 1 classes (including newly created ones)
    const allGrade1Classes = await prisma.class.findMany({
      where: {
        schoolId: school.id,
        gradeId: grade1.id
      },
      include: {
        grade: true
      }
    });

    console.log(`📚 All Grade 1 Classes (${allGrade1Classes.length}):`);
    allGrade1Classes.forEach((cls, index) => {
      console.log(`  ${index + 1}. ${cls.name} (ID: ${cls.id})`);
      console.log(`     Grade: ${cls.grade?.name}`);
      console.log(`     Academic Year: ${cls.academicYear}`);
      console.log(`     Active: ${cls.isActive}`);
      console.log('');
    });

    // 8. Show fee structures that will be applicable
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
      console.log(`     Active: ${fee.isActive}`);
      console.log(`     Breakdown:`, fee.breakdown);
      console.log('');
    });

    console.log('✅ GRADE 1 CLASSES SETUP COMPLETE');
    console.log('');
    console.log('📝 NEXT STEPS:');
    console.log('1. Assign students to the created Grade 1 classes');
    console.log('2. Test the parent dashboard to see if fees are now showing');
    console.log('3. Run the debug script again to verify the setup');

  } catch (error) {
    console.error('❌ Error creating Grade 1 classes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createGrade1Classes(); 