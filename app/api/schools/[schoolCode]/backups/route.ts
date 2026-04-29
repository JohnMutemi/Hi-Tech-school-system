import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireRole, requireSchoolAccess } from "@/lib/api-guard";
import { backupService } from "@/lib/services/backup-service";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  backupEnabled: z.boolean().optional(),
  backupScheduleTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  backupRetentionDays: z.number().int().min(1).max(365).optional(),
});

export async function GET(_: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ["super_admin", "school_admin"]);

    const [backups, schoolSettings] = await Promise.all([
      backupService.listBackups(schoolContext.schoolId),
      prisma.school.findUnique({
        where: { id: schoolContext.schoolId },
        select: {
          backupEnabled: true,
          backupScheduleTime: true,
          backupRetentionDays: true,
        },
      }),
    ]);

    return NextResponse.json({ backups, settings: schoolSettings });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(_: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ["super_admin", "school_admin"]);
    const backup = await backupService.createBackup({
      schoolId: schoolContext.schoolId,
      triggerType: "manual",
      createdBy: session.userId,
    });
    return NextResponse.json({ backup }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ["super_admin", "school_admin"]);
    const body = settingsSchema.parse(await request.json());
    const settings = await backupService.updateSettings(schoolContext.schoolId, body);
    return NextResponse.json({ settings });
  } catch (error) {
    return jsonError(error);
  }
}
