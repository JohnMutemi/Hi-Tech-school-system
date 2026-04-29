import { PrismaClient } from "@prisma/client";
import { backupService } from "../lib/services/backup-service";

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst({ where: { isActive: true } });
  if (!school) {
    console.log("[backup-test] skipped: no school found");
    return;
  }

  const before = await prisma.schoolBackup.count({ where: { schoolId: school.id } });
  const backup = await backupService.createBackup({
    schoolId: school.id,
    triggerType: "manual",
  });

  if (backup.status !== "completed") {
    throw new Error("Backup did not complete successfully");
  }

  const after = await prisma.schoolBackup.count({ where: { schoolId: school.id } });
  if (after !== before + 1) {
    throw new Error("Backup record count did not increase");
  }

  const latest = await prisma.schoolBackup.findFirst({
    where: { schoolId: school.id },
    orderBy: { snapshotAt: "desc" },
  });
  if (!latest?.storagePath) {
    throw new Error("Backup file path missing");
  }

  console.log(`[backup-test] passed for school=${school.code} backup=${latest.id}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("[backup-test] failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
