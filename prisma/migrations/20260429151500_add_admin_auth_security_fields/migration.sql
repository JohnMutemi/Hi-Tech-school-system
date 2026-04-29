-- AlterTable
ALTER TABLE "User"
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "resetToken" TEXT,
ADD COLUMN "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "twoFactorCode" TEXT,
ADD COLUMN "twoFactorCodeExpiry" TIMESTAMP(3),
ADD COLUMN "twoFactorLastVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");
