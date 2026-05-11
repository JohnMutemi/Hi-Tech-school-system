#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizePackageType(input: string | null | undefined): string {
  return String(input || 'full').trim().toLowerCase();
}

function isApplyMode(): boolean {
  return process.argv.includes('--apply');
}

async function migrateFinanceOnlyRoles(applyChanges: boolean) {
  const financeSchools = await prisma.school.findMany({
    where: {
      isActive: true,
      packageType: {
        in: ['finance_only', 'FINANCE_ONLY', 'finance-only', 'finance only'],
      },
    },
    select: {
      id: true,
      code: true,
      name: true,
      packageType: true,
      users: {
        where: {
          role: { in: ['admin', 'bursar'] },
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
        },
      },
    },
  });

  console.log(`Found ${financeSchools.length} finance-only school(s).`);

  let convertedCount = 0;
  let skippedCount = 0;

  for (const school of financeSchools) {
    const normalizedPackage = normalizePackageType(school.packageType);
    if (normalizedPackage !== 'finance_only') {
      continue;
    }

    const adminUsers = school.users.filter((user) => user.role === 'admin');
    const bursarUsers = school.users.filter((user) => user.role === 'bursar');

    if (adminUsers.length === 0) {
      console.log(`- ${school.code}: no admin users found (already finance-role clean).`);
      continue;
    }

    if (bursarUsers.length > 0) {
      console.log(
        `- ${school.code}: has ${adminUsers.length} admin and ${bursarUsers.length} bursar user(s); skipping to avoid ambiguous ownership.`
      );
      skippedCount += adminUsers.length;
      continue;
    }

    console.log(`- ${school.code}: ${adminUsers.length} admin user(s) will be converted to bursar.`);

    if (!applyChanges) {
      continue;
    }

    for (const admin of adminUsers) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'bursar' },
      });
      convertedCount += 1;
      console.log(`  ✓ Converted ${admin.email} (${admin.name}) to bursar`);
    }
  }

  if (!applyChanges) {
    console.log('\nDry run complete. No records were changed.');
    console.log('Run with --apply to perform updates.');
  } else {
    console.log(`\nMigration complete. Converted ${convertedCount} user(s); skipped ${skippedCount}.`);
  }
}

async function main() {
  const applyChanges = isApplyMode();
  console.log(applyChanges ? 'Running in APPLY mode' : 'Running in DRY-RUN mode');
  await migrateFinanceOnlyRoles(applyChanges);
}

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

