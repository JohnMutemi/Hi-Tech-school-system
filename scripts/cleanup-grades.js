#!/usr/bin/env node

/**
 * Cleanup Grades Script
 * 
 * This script removes grades 7-8 from all schools and ensures only grades 1-6 remain.
 * This aligns with the requirement to only have grades 1-6 in the system.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupGrades() {
  try {
    console.log('🧹 Starting grade cleanup...');
    console.log('This will remove grades 7-8 from all schools and keep only grades 1-6\n');

    // Get all schools
    const schools = await prisma.school.findMany();
    console.log(`Found ${schools.length} schools to process\n`);

    let totalRemoved = 0;
    let totalKept = 0;

    for (const school of schools) {
      console.log(`Processing school: ${school.name} (${school.code})`);
      
      // Find grades 7-8 for this school
      const gradesToRemove = await prisma.grade.findMany({
        where: {
          schoolId: school.id,
          name: {
            in: ['Grade 7', 'Grade 8']
          }
        },
        include: {
          classes: true,
          _count: {
            select: {
              classes: true,
              students: true
            }
          }
        }
      });

      if (gradesToRemove.length === 0) {
        console.log(`  ✓ No grades 7-8 found`);
        continue;
      }

      for (const grade of gradesToRemove) {
        console.log(`  Found ${grade.name}:`);
        console.log(`    - Classes: ${grade._count.classes}`);
        console.log(`    - Students: ${grade._count.students}`);

        // Check if grade has classes or students
        if (grade._count.classes > 0 || grade._count.students > 0) {
          console.log(`    ⚠️  WARNING: ${grade.name} has ${grade._count.classes} classes and ${grade._count.students} students`);
          console.log(`    ⚠️  This grade will NOT be deleted to prevent data loss`);
          console.log(`    ⚠️  Please manually move students/classes to other grades first`);
          continue;
        }

        // Delete the grade if it has no classes or students
        await prisma.grade.delete({
          where: { id: grade.id }
        });
        console.log(`    ✅ Deleted ${grade.name}`);
        totalRemoved++;
      }

      // Verify grades 1-6 exist
      const validGrades = await prisma.grade.findMany({
        where: {
          schoolId: school.id,
          name: {
            in: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']
          }
        }
      });

      console.log(`  Valid grades (1-6): ${validGrades.length}/6`);
      totalKept += validGrades.length;

      // Create missing grades 1-6 if they don't exist
      const existingGradeNames = validGrades.map(g => g.name);
      const allGradeNames = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
      
      for (const gradeName of allGradeNames) {
        if (!existingGradeNames.includes(gradeName)) {
          const newGrade = await prisma.grade.create({
            data: {
              name: gradeName,
              schoolId: school.id,
              isAlumni: false
            }
          });
          console.log(`    + Created missing ${gradeName}`);
          totalKept++;
        }
      }
      
      console.log('');
    }

    console.log('🎉 Grade cleanup completed!');
    console.log(`   Removed: ${totalRemoved} grades (7-8)`);
    console.log(`   Kept/Created: ${totalKept} grades (1-6)`);
    console.log(`   Total valid grades: ${totalKept}`);

    // Final verification
    const allGrades = await prisma.grade.findMany({
      where: {
        name: {
          in: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']
        }
      }
    });

    console.log(`\n📊 Final verification:`);
    console.log(`   Total grades 1-6 across all schools: ${allGrades.length}`);
    console.log(`   Expected: ${schools.length * 6} grades (6 grades × ${schools.length} schools)`);

    if (allGrades.length === schools.length * 6) {
      console.log('   ✅ All schools have exactly grades 1-6');
    } else {
      console.log('   ⚠️  Some schools may be missing grades 1-6');
    }

  } catch (error) {
    console.error('❌ Error during grade cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup function
cleanupGrades(); 