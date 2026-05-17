import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

/** Deletes every row tied to a school, deepest dependencies first. Superadmin-only. */
export async function deleteSchoolAndAllRelatedData(schoolId: string): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      await deleteSchoolRelatedRecords(tx, schoolId);
      await tx.school.delete({ where: { id: schoolId } });
    },
    {
      maxWait: 10_000,
      timeout: 120_000,
    },
  );
}

export async function deleteSchoolRelatedRecords(tx: Tx, schoolId: string): Promise<void> {
  await tx.schoolTermsAcceptance.deleteMany({ where: { schoolId } });

  await tx.schoolRestoreJob.deleteMany({
    where: {
      OR: [{ targetSchoolId: schoolId }, { sourceSchoolId: schoolId }],
    },
  });
  await tx.schoolBackup.deleteMany({ where: { schoolId } });

  await tx.studentPromotionRequest.deleteMany({
    where: { promotionRequest: { schoolId } },
  });
  await tx.promotionRequest.deleteMany({ where: { schoolId } });

  await tx.promotionExclusion.deleteMany({
    where: { student: { schoolId } },
  });
  await tx.promotionLog.deleteMany({
    where: { student: { schoolId } },
  });
  await tx.classProgression.deleteMany({ where: { schoolId } });
  await tx.bulkPromotionConfig.deleteMany({ where: { schoolId } });
  await tx.promotionCriteria.deleteMany({ where: { schoolId } });

  await tx.paymentNotificationLog.deleteMany({
    where: { payment: { student: { schoolId } } },
  });
  await tx.receipt.deleteMany({
    where: { student: { schoolId } },
  });
  await tx.payment.deleteMany({
    where: { student: { schoolId } },
  });
  await tx.paymentRequest.deleteMany({ where: { schoolId } });

  await tx.feeStatement.deleteMany({
    where: { student: { schoolId } },
  });
  await tx.studentFee.deleteMany({
    where: { student: { schoolId } },
  });
  await tx.studentArrear.deleteMany({ where: { schoolId } });
  await tx.studentYearlyBalance.deleteMany({
    where: { student: { schoolId } },
  });

  await tx.feeStructureLog.deleteMany({
    where: { feeStructure: { schoolId } },
  });
  await tx.termlyFeeStructure.deleteMany({ where: { schoolId } });
  await tx.feeStructure.deleteMany({ where: { schoolId } });

  await tx.studentScore.deleteMany({
    where: {
      OR: [{ student: { schoolId } }, { assessment: { schoolId } }],
    },
  });
  await tx.assessment.deleteMany({ where: { schoolId } });
  await tx.studentGradeResult.deleteMany({ where: { schoolId } });
  await tx.gradingCriteria.deleteMany({ where: { schoolId } });

  await tx.alumni.deleteMany({ where: { schoolId } });
  await tx.subject.deleteMany({ where: { schoolId } });
  await tx.student.deleteMany({ where: { schoolId } });
  await tx.class.deleteMany({ where: { schoolId } });
  await tx.grade.deleteMany({ where: { schoolId } });

  await tx.term.deleteMany({
    where: { academicYear: { schoolId } },
  });
  await tx.academicYear.deleteMany({ where: { schoolId } });

  await tx.emailNotificationConfig.deleteMany({ where: { schoolId } });
  await tx.schoolWebsiteSection.deleteMany({ where: { schoolId } });

  await tx.teacherProfile.deleteMany({
    where: { user: { schoolId } },
  });
  await tx.user.deleteMany({ where: { schoolId } });
}
