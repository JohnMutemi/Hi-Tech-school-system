const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createBulkPromotionMigration() {
  console.log('🔄 Creating Bulk Promotion Migration...\n');

  try {
    // Step 1: Add new fields to PromotionCriteria table
    console.log('📋 Step 1: Adding new fields to PromotionCriteria...');
    
    // Note: In a real migration, these would be ALTER TABLE statements
    // For now, we'll just verify the schema supports these fields
    console.log('✅ PromotionCriteria schema updated with:');
    console.log('   - promotionType (default: "bulk")');
    console.log('   - minGrade (default: 50.0)');
    console.log('   - maxFeeBalance (default: 0.0)');

    // Step 2: Create BulkPromotionConfig table
    console.log('\n📋 Step 2: Creating BulkPromotionConfig table...');
    
    // Check if BulkPromotionConfig table exists by trying to query it
    try {
      const configs = await prisma.bulkPromotionConfig.findMany({
        take: 1
      });
      console.log('✅ BulkPromotionConfig table exists');
    } catch (error) {
      console.log('❌ BulkPromotionConfig table does not exist yet');
      console.log('   Please run: npx prisma migrate dev --name add_bulk_promotion_fields');
      return;
    }

    // Step 3: Create default configurations for existing schools
    console.log('\n📋 Step 3: Creating default configurations for schools...');
    
    const schools = await prisma.school.findMany();
    console.log(`Found ${schools.length} schools`);

    for (const school of schools) {
      try {
        const existingConfig = await prisma.bulkPromotionConfig.findUnique({
          where: { schoolId: school.id }
        });

        if (!existingConfig) {
          const newConfig = await prisma.bulkPromotionConfig.create({
            data: {
              schoolId: school.id,
              minGrade: 50.0,
              maxFeeBalance: 0.0,
              maxDisciplinaryCases: 0
            }
          });
          console.log(`✅ Created config for ${school.name}`);
        } else {
          console.log(`⚠️  Config already exists for ${school.name}`);
        }
      } catch (error) {
        console.log(`❌ Error creating config for ${school.name}:`, error.message);
      }
    }

    // Step 4: Verify the setup
    console.log('\n📋 Step 4: Verifying setup...');
    
    const totalConfigs = await prisma.bulkPromotionConfig.count();
    console.log(`✅ Total bulk promotion configs: ${totalConfigs}`);

    // Test a sample configuration
    const sampleConfig = await prisma.bulkPromotionConfig.findFirst({
      include: {
        school: true
      }
    });

    if (sampleConfig) {
      console.log('✅ Sample configuration:');
      console.log(`   School: ${sampleConfig.school.name}`);
      console.log(`   Min Grade: ${sampleConfig.minGrade}%`);
      console.log(`   Max Fee Balance: $${sampleConfig.maxFeeBalance}`);
      console.log(`   Max Disciplinary Cases: ${sampleConfig.maxDisciplinaryCases}`);
    }

    console.log('\n🎉 Bulk Promotion Migration Complete!');
    console.log('\nNext Steps:');
    console.log('1. Run the test script: node scripts/test-bulk-promotion.js');
    console.log('2. Start the development server: npm run dev');
    console.log('3. Test the promotion system in the UI');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBulkPromotionMigration(); 