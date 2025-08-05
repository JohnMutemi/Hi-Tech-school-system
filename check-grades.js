const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkGrades() {
  try {
    console.log('Checking for Grade 1...');
    const grade1 = await prisma.grade.findMany({
      where: { name: 'Grade 1' }
    });
    console.log('Grade 1 records:', grade1);

    console.log('\nChecking all grades...');
    const allGrades = await prisma.grade.findMany();
    console.log('All grades:', allGrades.map(g => ({ id: g.id, name: g.name, schoolId: g.schoolId })));

    if (grade1.length === 0) {
      console.log('\n❌ No Grade 1 found! This is the cause of the foreign key constraint error.');
    } else {
      console.log('\n✅ Grade 1 found!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGrades(); 