const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log('🧹 COMPREHENSIVE DATABASE CLEANUP');
    console.log('==================================\n');

    // Get counts before deletion
    const counts = {
      students: await prisma.student.count(),
      classes: await prisma.class.count(),
      grades: await prisma.grade.count(),
      feeStructures: await prisma.termlyFeeStructure.count(),
      payments: await prisma.payment.count(),
      paymentLogs: await prisma.paymentLog.count(),
      studentFees: await prisma.studentFee.count(),
      subjects: await prisma.subject.count(),
      teachers: await prisma.teacher.count(),
    };

    console.log(`📊 Current Database State:`);
    Object.entries(counts).forEach(([key, count]) => {
      console.log(`   - ${key}: ${count}`);
    });
    console.log('');

    const totalItems = Object.values(counts).reduce((sum, count) => sum + count, 0);
    if (totalItems === 0) {
      console.log('✅ Database is already clean!');
      return;
    }

    // Confirm deletion
    console.log('⚠️  WARNING: This will permanently delete ALL student-related data:');
    Object.entries(counts).forEach(([key, count]) => {
      if (count > 0) {
        console.log(`   - ${count} ${key}`);
      }
    });
    console.log('');
    console.log('This action cannot be undone!');
    console.log('');

    // Delete in the correct order to avoid foreign key constraints
    console.log('🗑️ Starting deletion...');

    // 1. Delete payment-related data first
    if (counts.paymentLogs > 0) {
      console.log('   Deleting payment logs...');
      await prisma.paymentLog.deleteMany({});
      console.log(`   ✅ Deleted ${counts.paymentLogs} payment logs`);
    }

    if (counts.payments > 0) {
      console.log('   Deleting payments...');
      await prisma.payment.deleteMany({});
      console.log(`   ✅ Deleted ${counts.payments} payments`);
    }

    if (counts.studentFees > 0) {
      console.log('   Deleting student fees...');
      await prisma.studentFee.deleteMany({});
      console.log(`   ✅ Deleted ${counts.studentFees} student fees`);
    }

    // 2. Delete fee structures
    if (counts.feeStructures > 0) {
      console.log('   Deleting fee structures...');
      await prisma.termlyFeeStructure.deleteMany({});
      console.log(`   ✅ Deleted ${counts.feeStructures} fee structures`);
    }

    // 3. Delete students
    if (counts.students > 0) {
      console.log('   Deleting students...');
      await prisma.student.deleteMany({});
      console.log(`   ✅ Deleted ${counts.students} students`);
    }

    // 4. Delete classes
    if (counts.classes > 0) {
      console.log('   Deleting classes...');
      await prisma.class.deleteMany({});
      console.log(`   ✅ Deleted ${counts.classes} classes`);
    }

    // 5. Delete grades
    if (counts.grades > 0) {
      console.log('   Deleting grades...');
      await prisma.grade.deleteMany({});
      console.log(`   ✅ Deleted ${counts.grades} grades`);
    }

    // 6. Delete subjects
    if (counts.subjects > 0) {
      console.log('   Deleting subjects...');
      await prisma.subject.deleteMany({});
      console.log(`   ✅ Deleted ${counts.subjects} subjects`);
    }

    // 7. Delete teachers
    if (counts.teachers > 0) {
      console.log('   Deleting teachers...');
      await prisma.teacher.deleteMany({});
      console.log(`   ✅ Deleted ${counts.teachers} teachers`);
    }

    console.log('');
    console.log('🎉 SUCCESS! All student-related data has been cleaned.');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Run the seed script: node run-seed.js');
    console.log('   2. This will create fresh Grade 1-6 with default classes');
    console.log('   3. Add teachers, subjects, and students');
    console.log('   4. Set up fee structures for each grade');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    console.error('Please check your database connection and try again.');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
cleanDatabase(); 