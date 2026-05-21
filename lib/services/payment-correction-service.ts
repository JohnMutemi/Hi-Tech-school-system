import type { PrismaClient, School, Student, User, Class, Grade } from "@prisma/client";
import { canCorrectPayment, normalizeCorrectionReason } from "@/lib/payment-correction";
import { canUndoPayment } from "@/lib/payment-undo";
import { computeStudentFeesSnapshot } from "@/lib/services/student-fees-snapshot";

type StudentWithClass = Student & {
  user: User;
  class: (Class & { grade: Grade }) | null;
};

export type ApplyPaymentCorrectionInput = {
  paymentId: string;
  schoolId: string;
  amount: number;
  referenceNumber?: string | null;
  termName?: string | null;
  reason: string;
  correctedById: string;
  correctedByName?: string | null;
};

export class PaymentCorrectionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function assertLatestPayment(
  prisma: PrismaClient,
  paymentId: string,
  studentId: string
) {
  const latest = await prisma.payment.findFirst({
    where: { studentId },
    orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });
  if (!latest || latest.id !== paymentId) {
    throw new PaymentCorrectionError(
      "Only the student's most recent payment can be corrected.",
      403
    );
  }
}

export async function applyPaymentCorrection(
  prisma: PrismaClient,
  school: School,
  input: ApplyPaymentCorrectionInput
) {
  const reason = normalizeCorrectionReason(input.reason);
  if (!reason) {
    throw new PaymentCorrectionError(
      `A clear reason is required (at least ${10} characters).`
    );
  }

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new PaymentCorrectionError("Amount must be greater than zero.");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      id: input.paymentId,
      student: { schoolId: input.schoolId, isActive: true },
    },
    include: {
      receipt: true,
      term: true,
      academicYear: true,
      student: {
        include: {
          user: true,
          class: { include: { grade: true } },
        },
      },
    },
  });

  if (!payment) {
    throw new PaymentCorrectionError("Payment not found.", 404);
  }

  if (canUndoPayment(payment.paymentDate)) {
    throw new PaymentCorrectionError(
      "Use Undo while the quick-reversal window is still open. Correction is available after that expires.",
      403
    );
  }

  await assertLatestPayment(prisma, payment.id, payment.studentId);

  let targetTermId = payment.termId;
  if (input.termName?.trim() && input.termName.trim() !== payment.term.name) {
    const termRecord = await prisma.term.findFirst({
      where: {
        academicYearId: payment.academicYearId,
        name: input.termName.trim(),
      },
    });
    if (!termRecord) {
      throw new PaymentCorrectionError(
        `Term "${input.termName}" was not found for this academic year.`
      );
    }
    targetTermId = termRecord.id;
  }

  const newReference =
    input.referenceNumber !== undefined
      ? (input.referenceNumber?.trim() || null)
      : payment.referenceNumber;

  const snapshotBefore = await computeStudentFeesSnapshot(
    prisma,
    school,
    payment.student as StudentWithClass,
    payment.academicYearId,
    { persistYearEndCarryForward: false }
  );
  const safeBefore = "error" in snapshotBefore ? null : snapshotBefore;
  const termRowBefore = safeBefore?.termBalances.find((t) => t.termId === payment.termId);

  const correctionNote = `[Corrected ${new Date().toISOString().slice(0, 10)}: ${reason}]`;

  await prisma.$transaction(async (tx) => {
    await tx.paymentCorrection.create({
      data: {
        paymentId: payment.id,
        schoolId: input.schoolId,
        previousAmount: payment.amount,
        newAmount: amount,
        previousReferenceNumber: payment.referenceNumber,
        newReferenceNumber: newReference,
        previousTermId: payment.termId,
        newTermId: targetTermId,
        reason,
        correctedById: input.correctedById,
        correctedByName: input.correctedByName ?? null,
      },
    });

    const baseDescription = payment.description
      .replace(/\s*\[Corrected[^\]]*\]\s*/g, " ")
      .trim();

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        amount,
        referenceNumber: newReference,
        termId: targetTermId,
        description: `${baseDescription} ${correctionNote}`.trim(),
      },
    });
  });

  const updatedPayment = await prisma.payment.findUnique({
    where: { id: payment.id },
    include: {
      receipt: true,
      term: true,
      academicYear: true,
      student: {
        include: {
          user: true,
          class: { include: { grade: true } },
        },
      },
    },
  });

  if (!updatedPayment) {
    throw new PaymentCorrectionError("Payment update failed.", 500);
  }

  const snapshotAfter = await computeStudentFeesSnapshot(
    prisma,
    school,
    updatedPayment.student as StudentWithClass,
    updatedPayment.academicYearId,
    { persistYearEndCarryForward: true }
  );
  const safeAfter = "error" in snapshotAfter ? null : snapshotAfter;
  const termRowAfter = safeAfter?.termBalances.find(
    (t) => t.termId === updatedPayment.termId
  );

  const academicYearOutstandingBefore = safeBefore?.academicYearOutstanding ?? 0;
  const termOutstandingBefore = termRowBefore?.balance ?? 0;
  const academicYearOutstandingAfter = safeAfter?.academicYearOutstanding ?? 0;
  const termOutstandingAfter = termRowAfter?.balance ?? 0;

  if (updatedPayment.receipt) {
    await prisma.receipt.update({
      where: { id: updatedPayment.receipt.id },
      data: {
        amount,
        referenceNumber: newReference,
        termId: targetTermId,
        academicYearOutstandingBefore,
        academicYearOutstandingAfter,
        termOutstandingBefore,
        termOutstandingAfter,
      },
    });
  }

  const correction = await prisma.paymentCorrection.findFirst({
    where: { paymentId: payment.id },
    orderBy: { createdAt: "desc" },
  });

  return {
    payment: updatedPayment,
    correction,
    balances: {
      academicYearOutstandingBefore,
      academicYearOutstandingAfter,
      termOutstandingBefore,
      termOutstandingAfter,
    },
  };
}

export { canCorrectPayment };
