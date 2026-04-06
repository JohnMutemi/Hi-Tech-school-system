/**
 * Standalone: print PostgreSQL replication / sync status (same logic as prisma db seed).
 * Run: npx tsx prisma/check-db-sync.ts
 */
import { PrismaClient } from '@prisma/client';
import { formatSyncReport, getReplicationSyncReport } from './db-sync-check';

const prisma = new PrismaClient();

async function main() {
  const report = await getReplicationSyncReport(prisma);
  console.log(formatSyncReport(report));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
