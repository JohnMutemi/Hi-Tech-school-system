const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAlumniRecords() {
  try {
    console.log('🔍 Checking for alumni records...');
    
    // Get all alumni records
    const alumni = await prisma.alumni.findMany({
      include: {
        student: {
          include: {
            user: true
          }
        },
        school: true
      },
      orderBy: {
        graduationYear: 'desc',
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${alumni.length} alumni records:`);
    
    if (alumni.length === 0) {
      console.log('❌ No alumni records found');
      console.log('💡 This could mean:');
      console.log('   - No students have graduated yet');
      console.log('   - The promotion system hasn\'t created alumni records');
      console.log('   - Alumni records were deleted');
    } else {
      alumni.forEach((alum, index) => {
        console.log(`  ${index + 1}. ${alum.student.user.name} (${alum.student.admissionNumber})`);
        console.log(`     School: ${alum.school.name}`);
        console.log(`     Graduation Year: ${alum.graduationYear}`);
        console.log(`     Final Grade: ${alum.finalGrade}`);
        console.log(`     Contact: ${alum.contactEmail || 'N/A'}`);
        console.log(`     Created: ${alum.createdAt.toISOString()}`);
        console.log('');
      });
    }

    // Check if there are any Grade 6 students who could be promoted
    const grade6Students = await prisma.student.findMany({
      where: {
        isActive: true,
        class: {
          grade: {
            name: {
              in: ['Grade 6', 'Grade 6A']
            }
          }
        }
      },
      include: {
        user: true,
        class: {
          include: {
            grade: true
          }
        },
        school: true
      }
    });

    console.log(`📚 Found ${grade6Students.length} Grade 6 students who could be promoted:`);
    grade6Students.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.user.name} (${student.admissionNumber})`);
      console.log(`     School: ${student.school.name}`);
      console.log(`     Class: ${student.class.name}`);
      console.log(`     Grade: ${student.class.grade.name}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAlumniRecords(); 