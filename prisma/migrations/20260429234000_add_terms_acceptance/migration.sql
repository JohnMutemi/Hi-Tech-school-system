-- CreateTable
CREATE TABLE "PlatformTerms" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformTerms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolTermsAcceptance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "termsId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolTermsAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformTerms_version_key" ON "PlatformTerms"("version");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolTermsAcceptance_schoolId_termsId_key" ON "SchoolTermsAcceptance"("schoolId", "termsId");

-- CreateIndex
CREATE INDEX "SchoolTermsAcceptance_schoolId_acceptedAt_idx" ON "SchoolTermsAcceptance"("schoolId", "acceptedAt");

-- AddForeignKey
ALTER TABLE "SchoolTermsAcceptance" ADD CONSTRAINT "SchoolTermsAcceptance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolTermsAcceptance" ADD CONSTRAINT "SchoolTermsAcceptance_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolTermsAcceptance" ADD CONSTRAINT "SchoolTermsAcceptance_termsId_fkey" FOREIGN KEY ("termsId") REFERENCES "PlatformTerms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
