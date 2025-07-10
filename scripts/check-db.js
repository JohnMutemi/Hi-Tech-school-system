const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database state...\n');

    // Check schools
    const schools = await prisma.school.findMany();
    console.log(`📚 Schools found: ${schools.length}`);
    schools.forEach(school => {
      console.log(`  - ${school.name} (${school.code}) - Active: ${school.isActive}`);
    });

    // Check grades
    const grades = await prisma.grade.findMany();
    console.log(`\n📊 Grades found: ${grades.length}`);
    if (grades.length > 0) {
      const gradeCounts = {};
      grades.forEach(grade => {
        if (!gradeCounts[grade.schoolId]) {
          gradeCounts[grade.schoolId] = 0;
        }
        gradeCounts[grade.schoolId]++;
      });
      
      for (const [schoolId, count] of Object.entries(gradeCounts)) {
        const school = schools.find(s => s.id === schoolId);
        console.log(`  - ${school ? school.name : 'Unknown School'}: ${count} grades`);
      }
    }

    // Check users
    const users = await prisma.user.findMany();
    console.log(`\n👥 Users found: ${users.length}`);
    const userRoles = {};
    users.forEach(user => {
      if (!userRoles[user.role]) {
        userRoles[user.role] = 0;
      }
      userRoles[user.role]++;
    });
    
    for (const [role, count] of Object.entries(userRoles)) {
      console.log(`  - ${role}: ${count} users`);
    }

    // Check classes
    const classes = await prisma.class.findMany();
    console.log(`\n🏫 Classes found: ${classes.length}`);

    // Check students
    const students = await prisma.student.findMany();
    console.log(`\n🎓 Students found: ${students.length}`);

    console.log('\n✅ Database check completed!');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 