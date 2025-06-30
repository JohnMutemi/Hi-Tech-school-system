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

    // Default grades to create
    const defaultGrades = [
      'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 
      'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'
    ];

    let totalCreated = 0;
    let totalExisting = 0;

    for (const school of schools) {
      console.log(`\nProcessing school: ${school.name} (${school.code})`);
      
      for (const gradeName of defaultGrades) {
        // Check if grade already exists
        const existingGrade = await prisma.grade.findFirst({
          where: {
            name: gradeName,
            schoolId: school.id,
          },
        });

        if (existingGrade) {
          console.log(`  ✓ ${gradeName} already exists`);
          totalExisting++;
          continue;
        }

        // Create new grade
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
    console.log(`   Created: ${totalCreated} grades`);
    console.log(`   Existing: ${totalExisting} grades`);
    console.log(`   Total: ${totalCreated + totalExisting} grades`);

  } catch (error) {
    console.error('Error seeding grades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedGrades(); 