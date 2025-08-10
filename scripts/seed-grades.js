const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function seedGrades() {
  try {
    console.log('Starting to seed default grades for all schools...');

    // Get all schools
    const schools = await prisma.school.findMany();
    console.log(`Found ${schools.length} schools`);

    if (schools.length === 0) {
      console.log('No schools found. Please create schools first.');
      return;
    }

    // Default grades to create (only Grade 1-6 as requested)
    const defaultGrades = [
      'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 
      'Grade 5', 'Grade 6'
    ];

    let totalCreated = 0;
    let totalDeleted = 0;

    for (const school of schools) {
      console.log(`\nProcessing school: ${school.name} (${school.code})`);
      
      // Delete all existing grades for this school
      const deletedGrades = await prisma.grade.deleteMany({
        where: {
          schoolId: school.id,
        },
      });
      console.log(`  🗑️  Deleted ${deletedGrades.count} existing grades`);
      totalDeleted += deletedGrades.count;
      
      // Create new grades
      for (const gradeName of defaultGrades) {
        const newGrade = await prisma.grade.create({
          data: {
            id: uuidv4(),
            name: gradeName,
            schoolId: school.id,
          },
        });
        console.log(`  + Created ${gradeName} (ID: ${newGrade.id})`);
        totalCreated++;
      }
    }

    console.log(`\n🎉 Grade seeding completed!`);
    console.log(`   Deleted: ${totalDeleted} existing grades`);
    console.log(`   Created: ${totalCreated} new grades`);
    console.log(`   Total: ${totalCreated} grades`);

  } catch (error) {
    console.error('Error seeding grades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedGrades(); 