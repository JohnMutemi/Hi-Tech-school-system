const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function dropStudentsAndClasses() {
  try {
    console.log('🗑️ DROPPING ALL STUDENTS AND CLASSES');
    console.log('=====================================\n');

    // Get counts before deletion
    const studentsCount = await prisma.student.count();
    const classesCount = await prisma.class.count();
    const gradesCount = await prisma.grade.count();

    console.log(`📊 Current Database State:`);
    console.log(`   - Students: ${studentsCount}`);
    console.log(`   - Classes: ${classesCount}`);
    console.log(`   - Grades: ${gradesCount}`);
    console.log('');

    if (studentsCount === 0 && classesCount === 0) {
      console.log('✅ No students or classes to delete!');
      return;
    }

    // Confirm deletion
    console.log('⚠️  WARNING: This will permanently delete:');
    console.log(`   - ${studentsCount} students`);
    console.log(`   - ${classesCount} classes`);
    console.log(`   - ${gradesCount} grades`);
    console.log('');
    console.log('This action cannot be undone!');
    console.log('');

    // Delete in the correct order to avoid foreign key constraints
    console.log('🗑️ Starting deletion...');

    // 1. Delete all students first (they reference classes)
    if (studentsCount > 0) {
      console.log('   Deleting students...');
      await prisma.student.deleteMany({});
      console.log(`   ✅ Deleted ${studentsCount} students`);
    }

    // 2. Delete all classes (they reference grades)
    if (classesCount > 0) {
      console.log('   Deleting classes...');
      await prisma.class.deleteMany({});
      console.log(`   ✅ Deleted ${classesCount} classes`);
    }

    // 3. Delete all grades
    if (gradesCount > 0) {
      console.log('   Deleting grades...');
      await prisma.grade.deleteMany({});
      console.log(`   ✅ Deleted ${gradesCount} grades`);
    }

    console.log('');
    console.log('🎉 SUCCESS! All students, classes, and grades have been deleted.');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Run the seed script: node run-seed.js');
    console.log('   2. This will create fresh Grade 1-6 with default classes');
    console.log('   3. Add new students and assign them to the new classes');

  } catch (error) {
    console.error('❌ Error during deletion:', error);
    console.error('Please check your database connection and try again.');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
dropStudentsAndClasses(); 