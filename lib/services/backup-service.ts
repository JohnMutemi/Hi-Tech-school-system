import { createHash, randomUUID } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { prisma } from "@/lib/prisma";
import {
  deleteBackupArtifact,
  readBackupArtifact,
  writeBackupArtifact,
} from "@/lib/services/backup-artifact-storage";

type BackupTriggerType = "manual" | "scheduled";

type BackupPayload = {
  version: 1;
  exportedAt: string;
  school: any;
  data: Record<string, any[] | any>;
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

function cloneCode(baseCode: string): string {
  const suffix = Date.now().toString().slice(-6);
  return `${baseCode}-restored-${suffix}`.toLowerCase();
}

export class BackupService {
  private async buildPayload(schoolId: string): Promise<BackupPayload> {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new Error("School not found");

    const [
      users,
      grades,
      classes,
      students,
      subjects,
      feeStructures,
      termlyFeeStructures,
      feeStructureLogs,
      studentFees,
      feeStatements,
      payments,
      receipts,
      paymentNotificationLogs,
      academicYears,
      terms,
      studentArrears,
      studentYearlyBalances,
      paymentRequests,
      promotionCriteria,
      classProgressions,
      promotionLogs,
      promotionExclusions,
      promotionRequests,
      studentPromotionRequests,
      bulkPromotionConfig,
      alumni,
      emailNotificationConfig,
    ] = await Promise.all([
      prisma.user.findMany({ where: { schoolId } }),
      prisma.grade.findMany({ where: { schoolId } }),
      prisma.class.findMany({ where: { schoolId } }),
      prisma.student.findMany({ where: { schoolId } }),
      prisma.subject.findMany({ where: { schoolId } }),
      prisma.feeStructure.findMany({ where: { schoolId } }),
      prisma.termlyFeeStructure.findMany({ where: { schoolId } }),
      prisma.feeStructureLog.findMany({
        where: { feeStructure: { schoolId } },
      }),
      prisma.studentFee.findMany({ where: { student: { schoolId } } }),
      prisma.feeStatement.findMany({ where: { student: { schoolId } } }),
      prisma.payment.findMany({ where: { student: { schoolId } } }),
      prisma.receipt.findMany({ where: { student: { schoolId } } }),
      prisma.paymentNotificationLog.findMany({
        where: { payment: { student: { schoolId } } },
      }),
      prisma.academicYear.findMany({ where: { schoolId } }),
      prisma.term.findMany({ where: { academicYear: { schoolId } } }),
      prisma.studentArrear.findMany({ where: { schoolId } }),
      prisma.studentYearlyBalance.findMany({ where: { student: { schoolId } } }),
      prisma.paymentRequest.findMany({ where: { schoolId } }),
      prisma.promotionCriteria.findMany({ where: { schoolId } }),
      prisma.classProgression.findMany({ where: { schoolId } }),
      prisma.promotionLog.findMany({ where: { student: { schoolId } } }),
      prisma.promotionExclusion.findMany({
        where: { student: { schoolId } },
      }),
      prisma.promotionRequest.findMany({ where: { schoolId } }),
      prisma.studentPromotionRequest.findMany({
        where: { student: { schoolId } },
      }),
      prisma.bulkPromotionConfig.findUnique({ where: { schoolId } }),
      prisma.alumni.findMany({ where: { schoolId } }),
      prisma.emailNotificationConfig.findUnique({ where: { schoolId } }),
    ]);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      school,
      data: {
        users,
        grades,
        classes,
        students,
        subjects,
        feeStructures,
        termlyFeeStructures,
        feeStructureLogs,
        studentFees,
        feeStatements,
        payments,
        receipts,
        paymentNotificationLogs,
        academicYears,
        terms,
        studentArrears,
        studentYearlyBalances,
        paymentRequests,
        promotionCriteria,
        classProgressions,
        promotionLogs,
        promotionExclusions,
        promotionRequests,
        studentPromotionRequests,
        bulkPromotionConfig,
        alumni,
        emailNotificationConfig,
      },
    };
  }

  async createBackup(input: {
    schoolId: string;
    triggerType: BackupTriggerType;
    createdBy?: string;
  }) {
    const backup = await prisma.schoolBackup.create({
      data: {
        schoolId: input.schoolId,
        triggerType: input.triggerType,
        createdBy: input.createdBy,
        status: "pending",
      },
    });

    try {
      const payload = await this.buildPayload(input.schoolId);
      const json = JSON.stringify(payload);
      const compressed = gzipSync(Buffer.from(json));
      const checksum = createHash("sha256").update(compressed).digest("hex");
      const storagePath = await writeBackupArtifact({
        schoolId: input.schoolId,
        backupId: backup.id,
        body: compressed,
      });

      const updated = await prisma.schoolBackup.update({
        where: { id: backup.id },
        data: {
          status: "completed",
          snapshotAt: new Date(),
          checksum,
          storagePath,
          sizeBytes: compressed.length,
          metadata: {
            exportedAt: payload.exportedAt,
            modelCount: Object.keys(payload.data).length,
          },
        },
      });

      await this.enforceRetention(input.schoolId);
      return updated;
    } catch (error) {
      await prisma.schoolBackup.update({
        where: { id: backup.id },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Backup failed",
        },
      });
      throw error;
    }
  }

  async listBackups(schoolId: string) {
    return prisma.schoolBackup.findMany({
      where: { schoolId },
      orderBy: { snapshotAt: "desc" },
      take: 50,
    });
  }

  async updateSettings(schoolId: string, settings: { backupEnabled?: boolean; backupScheduleTime?: string; backupRetentionDays?: number }) {
    return prisma.school.update({
      where: { id: schoolId },
      data: {
        ...(settings.backupEnabled !== undefined ? { backupEnabled: settings.backupEnabled } : {}),
        ...(settings.backupScheduleTime !== undefined ? { backupScheduleTime: settings.backupScheduleTime } : {}),
        ...(settings.backupRetentionDays !== undefined ? { backupRetentionDays: settings.backupRetentionDays } : {}),
      },
      select: {
        backupEnabled: true,
        backupScheduleTime: true,
        backupRetentionDays: true,
      },
    });
  }

  async restoreAsClone(input: {
    backupId: string;
    sourceSchoolId: string;
    createdBy?: string;
  }) {
    const backup = await prisma.schoolBackup.findFirst({
      where: {
        id: input.backupId,
        schoolId: input.sourceSchoolId,
        status: "completed",
      },
    });
    if (!backup || !backup.storagePath) {
      throw new Error("Backup record not found");
    }

    const restoreJob = await prisma.schoolRestoreJob.create({
      data: {
        backupId: backup.id,
        sourceSchoolId: input.sourceSchoolId,
        createdBy: input.createdBy,
        status: "pending",
      },
    });

    try {
      const compressed = await readBackupArtifact(backup.storagePath);
      const payload = JSON.parse(gunzipSync(compressed).toString("utf8")) as BackupPayload;
      const sourceSchool = payload.school;
      const data = payload.data as any;

      const userMap = new Map<string, string>();
      const gradeMap = new Map<string, string>();
      const classMap = new Map<string, string>();
      const yearMap = new Map<string, string>();
      const termMap = new Map<string, string>();
      const studentMap = new Map<string, string>();
      const subjectMap = new Map<string, string>();
      const feeStructureMap = new Map<string, string>();
      const termlyFeeMap = new Map<string, string>();
      const paymentMap = new Map<string, string>();
      const promoCriteriaMap = new Map<string, string>();
      const promotionRequestMap = new Map<string, string>();
      const promotionLogMap = new Map<string, string>();

      const result = await prisma.$transaction(async (tx) => {
        const schoolId = randomUUID();
        const clonedSchool = await tx.school.create({
          data: {
            id: schoolId,
            name: `${sourceSchool.name} (Restored)`,
            code: cloneCode(sourceSchool.code),
            address: sourceSchool.address,
            phone: sourceSchool.phone,
            email: sourceSchool.email,
            logo: sourceSchool.logo,
            colorTheme: sourceSchool.colorTheme,
            isActive: sourceSchool.isActive,
            admissionNumberAutoIncrement: sourceSchool.admissionNumberAutoIncrement,
            admissionNumberFormat: sourceSchool.admissionNumberFormat,
            lastAdmissionNumber: sourceSchool.lastAdmissionNumber,
            backupEnabled: sourceSchool.backupEnabled ?? true,
            backupScheduleTime: sourceSchool.backupScheduleTime ?? "02:00",
            backupRetentionDays: sourceSchool.backupRetentionDays ?? 30,
          },
        });

        for (const row of data.users ?? []) {
          const id = randomUUID();
          userMap.set(row.id, id);
          await tx.user.create({
            data: {
              id,
              name: row.name,
              email: `${row.email}.restored.${Date.now()}@local.invalid`,
              password: row.password,
              role: row.role,
              schoolId,
              isActive: row.isActive,
              phone: row.phone,
              employeeId: row.employeeId,
            },
          });
        }

        for (const row of data.grades ?? []) {
          const id = randomUUID();
          gradeMap.set(row.id, id);
          await tx.grade.create({ data: { id, name: row.name, isAlumni: row.isAlumni, schoolId } });
        }

        for (const row of data.academicYears ?? []) {
          const id = randomUUID();
          yearMap.set(row.id, id);
          await tx.academicYear.create({
            data: {
              id,
              schoolId,
              name: row.name,
              startDate: toDate(row.startDate) ?? new Date(),
              endDate: toDate(row.endDate) ?? new Date(),
              isCurrent: row.isCurrent,
            },
          });
        }

        for (const row of data.terms ?? []) {
          const id = randomUUID();
          termMap.set(row.id, id);
          await tx.term.create({
            data: {
              id,
              academicYearId: yearMap.get(row.academicYearId)!,
              name: row.name,
              startDate: toDate(row.startDate) ?? new Date(),
              endDate: toDate(row.endDate) ?? new Date(),
              isCurrent: row.isCurrent,
            },
          });
        }

        for (const row of data.classes ?? []) {
          const id = randomUUID();
          classMap.set(row.id, id);
          await tx.class.create({
            data: {
              id,
              name: row.name,
              shortCode: row.shortCode,
              schoolId,
              teacherId: row.teacherId ? userMap.get(row.teacherId) : null,
              isActive: row.isActive,
              gradeId: gradeMap.get(row.gradeId)!,
            },
          });
        }

        for (const row of data.students ?? []) {
          const id = randomUUID();
          studentMap.set(row.id, id);
          await tx.student.create({
            data: {
              id,
              userId: userMap.get(row.userId)!,
              schoolId,
              classId: row.classId ? classMap.get(row.classId) : null,
              admissionNumber: row.admissionNumber,
              dateOfBirth: toDate(row.dateOfBirth),
              parentId: row.parentId ? userMap.get(row.parentId) : null,
              isActive: row.isActive,
              address: row.address,
              gender: row.gender,
              parentEmail: row.parentEmail,
              parentName: row.parentName,
              parentPhone: row.parentPhone,
              tempPassword: row.tempPassword,
              avatarUrl: row.avatarUrl,
              dateAdmitted: toDate(row.dateAdmitted),
              emergencyContact: row.emergencyContact,
              medicalInfo: row.medicalInfo,
              notes: row.notes,
              status: row.status,
              academicYear: row.academicYear,
              currentAcademicYearId: row.currentAcademicYearId ? yearMap.get(row.currentAcademicYearId) : null,
              currentTermId: row.currentTermId ? termMap.get(row.currentTermId) : null,
              joinedAcademicYearId: row.joinedAcademicYearId ? yearMap.get(row.joinedAcademicYearId) : null,
              joinedTermId: row.joinedTermId ? termMap.get(row.joinedTermId) : null,
            },
          });
        }

        for (const row of data.subjects ?? []) {
          const id = randomUUID();
          subjectMap.set(row.id, id);
          await tx.subject.create({
            data: {
              id,
              name: row.name,
              code: row.code,
              description: row.description,
              teacherId: row.teacherId ? userMap.get(row.teacherId) : null,
              schoolId,
              isActive: row.isActive,
            },
          });
        }

        for (const row of data.feeStructures ?? []) {
          const id = randomUUID();
          feeStructureMap.set(row.id, id);
          await tx.feeStructure.create({
            data: {
              id,
              name: row.name,
              description: row.description,
              amount: Number(row.amount),
              frequency: row.frequency,
              dueDate: toDate(row.dueDate),
              isActive: row.isActive,
              schoolId,
            },
          });
        }

        for (const row of data.termlyFeeStructures ?? []) {
          const id = randomUUID();
          termlyFeeMap.set(row.id, id);
          await tx.termlyFeeStructure.create({
            data: {
              id,
              term: row.term,
              year: row.year,
              totalAmount: row.totalAmount,
              breakdown: row.breakdown,
              isActive: row.isActive,
              createdBy: userMap.get(row.createdBy)!,
              schoolId,
              dueDate: toDate(row.dueDate),
              isReleased: row.isReleased,
              gradeId: gradeMap.get(row.gradeId)!,
              academicYearId: row.academicYearId ? yearMap.get(row.academicYearId) : null,
              termId: row.termId ? termMap.get(row.termId) : null,
            },
          });
        }

        for (const row of data.payments ?? []) {
          const id = randomUUID();
          paymentMap.set(row.id, id);
          await tx.payment.create({
            data: {
              id,
              studentId: studentMap.get(row.studentId)!,
              amount: Number(row.amount),
              paymentDate: toDate(row.paymentDate) ?? new Date(),
              paymentMethod: row.paymentMethod,
              referenceNumber: row.referenceNumber,
              receiptNumber: row.receiptNumber,
              description: row.description,
              receivedBy: row.receivedBy,
              academicYearId: yearMap.get(row.academicYearId)!,
              termId: termMap.get(row.termId)!,
            },
          });
        }

        for (const row of data.receipts ?? []) {
          await tx.receipt.create({
            data: {
              id: randomUUID(),
              paymentId: paymentMap.get(row.paymentId)!,
              studentId: studentMap.get(row.studentId)!,
              receiptNumber: row.receiptNumber,
              amount: Number(row.amount),
              paymentDate: toDate(row.paymentDate) ?? new Date(),
              academicYearOutstandingBefore: Number(row.academicYearOutstandingBefore),
              academicYearOutstandingAfter: Number(row.academicYearOutstandingAfter),
              termOutstandingBefore: row.termOutstandingBefore ?? null,
              termOutstandingAfter: row.termOutstandingAfter ?? null,
              academicYearId: row.academicYearId ? yearMap.get(row.academicYearId) : null,
              termId: row.termId ? termMap.get(row.termId) : null,
              paymentMethod: row.paymentMethod,
              referenceNumber: row.referenceNumber,
            },
          });
        }

        for (const row of data.paymentNotificationLogs ?? []) {
          await tx.paymentNotificationLog.create({
            data: {
              id: randomUUID(),
              paymentId: paymentMap.get(row.paymentId)!,
              recipientEmail: row.recipientEmail,
              emailType: row.emailType,
              status: row.status,
              sentAt: toDate(row.sentAt),
              errorMessage: row.errorMessage,
              retryCount: row.retryCount,
            },
          });
        }

        for (const row of data.studentFees ?? []) {
          await tx.studentFee.create({
            data: {
              id: randomUUID(),
              studentId: studentMap.get(row.studentId)!,
              feeStructureId: feeStructureMap.get(row.feeStructureId)!,
              amount: Number(row.amount),
              dueDate: toDate(row.dueDate) ?? new Date(),
              status: row.status,
              balance: Number(row.balance),
            },
          });
        }

        for (const row of data.studentArrears ?? []) {
          await tx.studentArrear.create({
            data: {
              id: randomUUID(),
              studentId: studentMap.get(row.studentId)!,
              schoolId,
              academicYearId: yearMap.get(row.academicYearId)!,
              arrearAmount: Number(row.arrearAmount),
              dateRecorded: toDate(row.dateRecorded) ?? new Date(),
              notes: row.notes,
            },
          });
        }

        for (const row of data.studentYearlyBalances ?? []) {
          await tx.studentYearlyBalance.create({
            data: {
              id: randomUUID(),
              studentId: studentMap.get(row.studentId)!,
              academicYear: row.academicYear,
              openingBalance: Number(row.openingBalance),
              totalCharged: Number(row.totalCharged),
              totalPaid: Number(row.totalPaid),
              closingBalance: Number(row.closingBalance),
              isCarriedForward: row.isCarriedForward,
            },
          });
        }

        for (const row of data.feeStatements ?? []) {
          await tx.feeStatement.create({
            data: {
              id: randomUUID(),
              studentId: studentMap.get(row.studentId)!,
              period: row.period,
              openingBalance: Number(row.openingBalance),
              totalCharged: Number(row.totalCharged),
              totalPaid: Number(row.totalPaid),
              closingBalance: Number(row.closingBalance),
              transactions: row.transactions,
              generatedAt: toDate(row.generatedAt) ?? new Date(),
            },
          });
        }

        if (data.emailNotificationConfig) {
          await tx.emailNotificationConfig.create({
            data: {
              id: randomUUID(),
              schoolId,
              isEnabled: data.emailNotificationConfig.isEnabled,
              emailProvider: data.emailNotificationConfig.emailProvider,
              configuration: data.emailNotificationConfig.configuration,
              fromEmail: data.emailNotificationConfig.fromEmail,
              fromName: data.emailNotificationConfig.fromName,
              paymentConfirmationEnabled: data.emailNotificationConfig.paymentConfirmationEnabled,
              receiptAttachmentEnabled: data.emailNotificationConfig.receiptAttachmentEnabled,
            },
          });
        }

        if (data.bulkPromotionConfig) {
          await tx.bulkPromotionConfig.create({
            data: {
              id: randomUUID(),
              schoolId,
              minGrade: Number(data.bulkPromotionConfig.minGrade),
              maxFeeBalance: Number(data.bulkPromotionConfig.maxFeeBalance),
              maxDisciplinaryCases: Number(data.bulkPromotionConfig.maxDisciplinaryCases),
              isActive: data.bulkPromotionConfig.isActive,
            },
          });
        }

        for (const row of data.promotionCriteria ?? []) {
          const id = randomUUID();
          promoCriteriaMap.set(row.id, id);
          await tx.promotionCriteria.create({
            data: {
              ...row,
              id,
              schoolId,
              createdBy: row.createdBy ? userMap.get(row.createdBy) : null,
            },
          });
        }

        for (const row of data.classProgressions ?? []) {
          await tx.classProgression.create({
            data: {
              ...row,
              id: randomUUID(),
              schoolId,
              createdBy: row.createdBy ? userMap.get(row.createdBy) : null,
              criteriaId: row.criteriaId ? promoCriteriaMap.get(row.criteriaId) : null,
            },
          });
        }

        for (const row of data.promotionLogs ?? []) {
          const id = randomUUID();
          promotionLogMap.set(row.id, id);
          await tx.promotionLog.create({
            data: {
              ...row,
              id,
              studentId: studentMap.get(row.studentId)!,
              promotedBy: userMap.get(row.promotedBy)!,
              appliedCriteriaId: row.appliedCriteriaId ? promoCriteriaMap.get(row.appliedCriteriaId) : null,
            },
          });
        }

        for (const row of data.promotionExclusions ?? []) {
          await tx.promotionExclusion.create({
            data: {
              ...row,
              id: randomUUID(),
              promotionLogId: promotionLogMap.get(row.promotionLogId)!,
              studentId: studentMap.get(row.studentId)!,
              excludedBy: userMap.get(row.excludedBy)!,
            },
          });
        }

        for (const row of data.promotionRequests ?? []) {
          const id = randomUUID();
          promotionRequestMap.set(row.id, id);
          await tx.promotionRequest.create({
            data: {
              ...row,
              id,
              schoolId,
              submittedBy: userMap.get(row.submittedBy)!,
              approvedBy: row.approvedBy ? userMap.get(row.approvedBy) : null,
            },
          });
        }

        for (const row of data.studentPromotionRequests ?? []) {
          await tx.studentPromotionRequest.create({
            data: {
              ...row,
              id: randomUUID(),
              promotionRequestId: promotionRequestMap.get(row.promotionRequestId)!,
              studentId: studentMap.get(row.studentId)!,
            },
          });
        }

        for (const row of data.paymentRequests ?? []) {
          await tx.paymentRequest.create({
            data: {
              ...row,
              id: randomUUID(),
              schoolId,
              studentId: studentMap.get(row.studentId)!,
              expiresAt: toDate(row.expiresAt) ?? new Date(),
            },
          });
        }

        for (const row of data.feeStructureLogs ?? []) {
          await tx.feeStructureLog.create({
            data: {
              ...row,
              id: randomUUID(),
              feeStructureId: termlyFeeMap.get(row.feeStructureId)!,
              performedBy: userMap.get(row.performedBy)!,
            },
          });
        }

        for (const row of data.alumni ?? []) {
          await tx.alumni.create({
            data: {
              ...row,
              id: randomUUID(),
              schoolId,
              studentId: studentMap.get(row.studentId)!,
            },
          });
        }

        return clonedSchool;
      });

      await prisma.schoolRestoreJob.update({
        where: { id: restoreJob.id },
        data: {
          status: "completed",
          targetSchoolId: result.id,
          finishedAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      await prisma.schoolRestoreJob.update({
        where: { id: restoreJob.id },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Restore failed",
          finishedAt: new Date(),
        },
      });
      throw error;
    }
  }

  async runScheduledBackups(now = new Date()) {
    const schools = await prisma.school.findMany({
      where: { backupEnabled: true, isActive: true },
      select: { id: true, backupScheduleTime: true },
    });

    const hour = now.getHours().toString().padStart(2, "0");
    const minute = now.getMinutes().toString().padStart(2, "0");
    const currentHHMM = `${hour}:${minute}`;

    let triggered = 0;
    for (const school of schools) {
      if ((school.backupScheduleTime ?? "02:00") !== currentHHMM) continue;
      const existing = await prisma.schoolBackup.findFirst({
        where: {
          schoolId: school.id,
          triggerType: "scheduled",
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        },
      });
      if (existing) continue;
      await this.createBackup({ schoolId: school.id, triggerType: "scheduled" });
      triggered += 1;
    }

    return { triggered };
  }

  async enforceRetention(schoolId: string) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { backupRetentionDays: true },
    });
    const retentionDays = school?.backupRetentionDays ?? 30;
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const oldBackups = await prisma.schoolBackup.findMany({
      where: {
        schoolId,
        snapshotAt: { lt: cutoff },
      },
    });

    for (const backup of oldBackups) {
      if (backup.storagePath) {
        await deleteBackupArtifact(backup.storagePath);
      }
    }

    if (oldBackups.length) {
      await prisma.schoolBackup.deleteMany({
        where: { id: { in: oldBackups.map((b) => b.id) } },
      });
    }
  }
}

export const backupService = new BackupService();
