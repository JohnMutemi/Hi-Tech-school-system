import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@hitechsms.co.ke' },
    update: {},
    create: {
      name: 'Platform Super Admin',
      email: 'admin@hitechsms.co.ke',
      password: hashedPassword,
      role: 'super_admin',
      schoolId: null,
    },
  });
  console.log('Seeded platform-level super admin.');

  // Clean up existing classes and grades for all schools
  console.log('🗑️ Cleaning up existing classes and grades...');
  
  // Delete all existing classes first (to avoid foreign key constraints)
  const deletedClasses = await prisma.class.deleteMany({});
  console.log(`✅ Deleted ${deletedClasses.count} existing classes`);
  
  // Delete all existing grades
  const deletedGrades = await prisma.grade.deleteMany({});
  console.log(`✅ Deleted ${deletedGrades.count} existing grades`);
  
  // Create platform-level grades (Grade 1 to Grade 6)
  console.log('🌱 Creating platform-level grades...');
  const platformGrades = [];
  
  for (let i = 1; i <= 6; i++) {
    const gradeName = `Grade ${i}`;
    
    const platformGrade = await prisma.grade.create({
      data: {
        name: gradeName,
        schoolId: null, // Platform-level grade (not tied to any specific school)
        isAlumni: false
      }
    });
    
    platformGrades.push(platformGrade);
    console.log(`✅ Created platform-level grade: ${gradeName}`);
  }
  
  console.log(`🎉 Created ${platformGrades.length} platform-level grades`);
  console.log('📝 These grades will be available to all schools');
  
  // Seed grades for each existing school (Grade 1 to Grade 6)
  const schools = await prisma.school.findMany();
  
  for (const school of schools) {
    console.log(`🌱 Seeding grades for school: ${school.name}`);
    
    // Create grades for this school
    const grades = [];
    for (let i = 1; i <= 6; i++) {
      const gradeName = `Grade ${i}`;
      
      const newGrade = await prisma.grade.create({
        data: {
          name: gradeName,
          schoolId: school.id,
          isAlumni: false
        }
      });
      
      grades.push(newGrade);
      console.log(`✅ Created grade: ${gradeName} for school: ${school.name}`);
    }
    
    console.log(`🎉 Completed seeding for school: ${school.name}`);
    console.log(`   - Created ${grades.length} grades`);
  }
  
  console.log('');
  console.log('📊 SEEDING SUMMARY:');
  console.log(`   - Platform-level grades created: ${platformGrades.length}`);
  console.log(`   - Schools processed: ${schools.length}`);
  console.log(`   - School-specific grades created: ${schools.length * 6}`);
  console.log('');
  console.log('✅ Platform now has Grade 1-6 available for all schools');
  console.log('✅ All existing schools now have Grade 1-6');
  console.log('📝 Schools can create classes and custom grades through the admin interface');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect()); 