import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { formatSyncReport, getReplicationSyncReport } from './db-sync-check';

const prisma = new PrismaClient();

async function main() {
  if (process.env.SEED_SKIP_SYNC_CHECK !== '1') {
    const syncReport = await getReplicationSyncReport(prisma);
    console.log(formatSyncReport(syncReport));
    console.log('');

    if (syncReport.inRecovery && process.env.SEED_ALLOW_STANDBY !== '1') {
      console.error(
        'Refusing to seed: database reports pg_is_in_recovery() = true (standby / read replica). ' +
          'Point DATABASE_URL at the primary writer, or set SEED_ALLOW_STANDBY=1 if you accept the risk.'
      );
      process.exit(1);
    }

    if (syncReport.primaryReplicasCatchingUp) {
      console.warn(
        'Warning: some replicas are not in steady streaming state. If you need a fully caught-up fleet, wait before seeding production.'
      );
      console.log('');
    }
  } else {
    console.log('[DB sync / replication] skipped (SEED_SKIP_SYNC_CHECK=1)\n');
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@hitechsms.co.ke' },
  });
  if (existingAdmin) {
    console.log(
      'Existing seed data detected (super admin present). Sync status above reflects the current connection.\n'
    );
  }

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

  await prisma.platformTerms.upsert({
    where: { version: "v1.0" },
    update: {
      isActive: true,
      title: "Platform Terms and Conditions",
      content:
        "By accessing this platform, school administrators agree to comply with all platform terms, data protection obligations, acceptable-use policy, and applicable laws. Any misuse, fraud, or violation may result in account suspension or termination by the platform superadmin.",
    },
    create: {
      version: "v1.0",
      title: "Platform Terms and Conditions",
      content:
        "By accessing this platform, school administrators agree to comply with all platform terms, data protection obligations, acceptable-use policy, and applicable laws. Any misuse, fraud, or violation may result in account suspension or termination by the platform superadmin.",
      isActive: true,
    },
  });
  console.log('Seeded default platform terms and conditions.');

  // Clean up existing classes and grades for all schools
  console.log('🗑️ Cleaning up existing classes and grades...');

  // TermlyFeeStructure references Grade — must remove before grades
  const deletedFeeLogs = await prisma.feeStructureLog.deleteMany({});
  console.log(`✅ Deleted ${deletedFeeLogs.count} fee structure logs`);
  const deletedTermlyFees = await prisma.termlyFeeStructure.deleteMany({});
  console.log(`✅ Deleted ${deletedTermlyFees.count} termly fee structures`);

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