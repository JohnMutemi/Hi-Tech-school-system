/*
  Warnings:

  - You are about to drop the column `academicYear` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `classLevel` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `className` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `classSection` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `classLevel` on the `TermlyFeeStructure` table. All the data in the column will be lost.
  - You are about to drop the column `className` on the `TermlyFeeStructure` table. All the data in the column will be lost.
  - Added the required column `gradeId` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gradeId` to the `TermlyFeeStructure` table without a default value. This is not possible if the table is not empty.

*/
-- 1. Add gradeId as nullable
ALTER TABLE "Class" ADD COLUMN "gradeId" TEXT;
ALTER TABLE "TermlyFeeStructure" ADD COLUMN "gradeId" TEXT;

-- 2. Create Grade table
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- 3. Populate Grade table with unique grades from Class and TermlyFeeStructure
INSERT INTO "Grade" ("id", "name", "schoolId")
SELECT gen_random_uuid(), c."name", c."schoolId"
FROM (
  SELECT DISTINCT regexp_replace("name", '[^0-9A-Za-z ]', '', 'g') AS "name", "schoolId" FROM "Class"
) c
WHERE NOT EXISTS (
  SELECT 1 FROM "Grade" g WHERE g."name" = c."name" AND g."schoolId" = c."schoolId"
);

-- 3b. Also insert missing grades from TermlyFeeStructure.classLevel
INSERT INTO "Grade" ("id", "name", "schoolId")
SELECT gen_random_uuid(), t."classLevel", t."schoolId"
FROM (
  SELECT DISTINCT "classLevel", "schoolId" FROM "TermlyFeeStructure" WHERE "classLevel" IS NOT NULL
) t
WHERE NOT EXISTS (
  SELECT 1 FROM "Grade" g WHERE g."name" = t."classLevel" AND g."schoolId" = t."schoolId"
);

-- 4. Update Class.gradeId to reference Grade
UPDATE "Class" SET "gradeId" = (
  SELECT g."id" FROM "Grade" g WHERE g."name" = regexp_replace("Class"."name", '[^0-9A-Za-z ]', '', 'g') AND g."schoolId" = "Class"."schoolId" LIMIT 1
);

-- 5. Update TermlyFeeStructure.gradeId to reference Grade (using old classLevel)
UPDATE "TermlyFeeStructure" SET "gradeId" = (
  SELECT g."id" FROM "Grade" g WHERE g."name" = "TermlyFeeStructure"."classLevel" AND g."schoolId" = "TermlyFeeStructure"."schoolId" LIMIT 1
);

-- 6. Set gradeId as NOT NULL
ALTER TABLE "Class" ALTER COLUMN "gradeId" SET NOT NULL;
ALTER TABLE "TermlyFeeStructure" ALTER COLUMN "gradeId" SET NOT NULL;

-- 7. Add foreign keys
ALTER TABLE "Class" ADD CONSTRAINT "Class_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TermlyFeeStructure" ADD CONSTRAINT "TermlyFeeStructure_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 8. Drop old columns (after data migration)
ALTER TABLE "Student" DROP COLUMN IF EXISTS "academicYear";
ALTER TABLE "Student" DROP COLUMN IF EXISTS "classLevel";
ALTER TABLE "Student" DROP COLUMN IF EXISTS "className";
ALTER TABLE "Student" DROP COLUMN IF EXISTS "classSection";
ALTER TABLE "TermlyFeeStructure" DROP COLUMN IF EXISTS "classLevel";
ALTER TABLE "TermlyFeeStructure" DROP COLUMN IF EXISTS "className";
