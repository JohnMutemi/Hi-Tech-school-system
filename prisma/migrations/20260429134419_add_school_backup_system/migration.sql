-- AlterTable
ALTER TABLE "School" ADD COLUMN     "backupEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "backupRetentionDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "backupScheduleTime" TEXT DEFAULT '02:00';

-- CreateTable
CREATE TABLE "SchoolBackup" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "triggerType" TEXT NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checksum" TEXT,
    "storagePath" TEXT,
    "sizeBytes" INTEGER,
    "createdBy" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolBackup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolRestoreJob" (
    "id" TEXT NOT NULL,
    "backupId" TEXT NOT NULL,
    "sourceSchoolId" TEXT NOT NULL,
    "targetSchoolId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolRestoreJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchoolBackup_schoolId_snapshotAt_idx" ON "SchoolBackup"("schoolId", "snapshotAt");

-- CreateIndex
CREATE INDEX "SchoolBackup_status_createdAt_idx" ON "SchoolBackup"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SchoolRestoreJob_backupId_status_idx" ON "SchoolRestoreJob"("backupId", "status");

-- CreateIndex
CREATE INDEX "SchoolRestoreJob_sourceSchoolId_startedAt_idx" ON "SchoolRestoreJob"("sourceSchoolId", "startedAt");

-- AddForeignKey
ALTER TABLE "SchoolBackup" ADD CONSTRAINT "SchoolBackup_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolBackup" ADD CONSTRAINT "SchoolBackup_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolRestoreJob" ADD CONSTRAINT "SchoolRestoreJob_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "SchoolBackup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolRestoreJob" ADD CONSTRAINT "SchoolRestoreJob_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolRestoreJob" ADD CONSTRAINT "SchoolRestoreJob_targetSchoolId_fkey" FOREIGN KEY ("targetSchoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
