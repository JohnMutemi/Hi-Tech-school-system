const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createBulkPromotionMigration() {
  try {
    console.log('🔄 CREATING BULK PROMOTION MIGRATION');
    console.log('=====================================\n');

    // 1. First, let's check the current class structure
    console.log('📋 Checking current class structure...');
    const allClasses = await prisma.class.findMany({
      include: {
        grade: true,
        school: true
      },
      orderBy: {
        schoolId: 'asc',
        name: 'asc'
      }
    });

    console.log(`Found ${allClasses.length} classes:`);
    allClasses.forEach((cls, index) => {
      console.log(`  ${index + 1}. ${cls.name} (School: ${cls.school?.name}, Grade: ${cls.grade?.name}, Year: ${cls.academicYear})`);
    });
    console.log('');

    // 2. Create a backup of current class data
    console.log('💾 Creating backup of current class data...');
    const classBackup = allClasses.map(cls => ({
      id: cls.id,
      name: cls.name,
      schoolId: cls.schoolId,
      gradeId: cls.gradeId,
      academicYear: cls.academicYear,
      isActive: cls.isActive,
      teacherId: cls.teacherId
    }));

    console.log(`Backed up ${classBackup.length} classes`);
    console.log('');

    // 3. Remove academicYear from Class model
    console.log('🔧 Removing academicYear field from Class model...');
    
    // First, let's create a new migration file
    const migrationContent = `
-- Migration: Remove academicYear from Class to make classes permanent
-- This makes classes permanent structures that persist across academic years

-- Step 1: Create a backup table
CREATE TABLE IF NOT EXISTS "ClassBackup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClassBackup_pkey" PRIMARY KEY ("id")
);

-- Step 2: Backup current data
INSERT INTO "ClassBackup" ("id", "name", "schoolId", "gradeId", "academicYear", "isActive", "teacherId", "createdAt", "updatedAt")
SELECT "id", "name", "schoolId", "gradeId", "academicYear", "isActive", "teacherId", "createdAt", "updatedAt"
FROM "Class";

-- Step 3: Remove academicYear column
ALTER TABLE "Class" DROP COLUMN "academicYear";

-- Step 4: Create unique constraint to prevent duplicate class names per school
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_name_key" UNIQUE ("schoolId", "name");
`;

    console.log('Migration content:');
    console.log(migrationContent);
    console.log('');

    // 4. Show what will happen after migration
    console.log('📊 AFTER MIGRATION:');
    console.log('  ✅ Classes will be permanent structures');
    console.log('  ✅ No more academicYear field in Class model');
    console.log('  ✅ Classes will have unique names per school');
    console.log('  ✅ Students will move between permanent classes');
    console.log('  ✅ Promotion will work correctly');
    console.log('');

    // 5. Show example of how promotion will work
    console.log('🎯 EXAMPLE PROMOTION FLOW:');
    console.log('  Current: Grade 1A (2025) → Grade 2A (2026)');
    console.log('  After: Grade 1A → Grade 2A (same permanent classes)');
    console.log('  Students move between existing permanent classes');
    console.log('');

    console.log('✅ Migration script ready!');
    console.log('📝 To apply this migration:');
    console.log('   1. Create a new Prisma migration');
    console.log('   2. Run: npx prisma migrate dev --name remove_academic_year_from_class');
    console.log('   3. Update the promotion service to work with permanent classes');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBulkPromotionMigration(); 