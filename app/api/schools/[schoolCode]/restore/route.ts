import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireRole, requireSchoolAccess } from "@/lib/api-guard";
import { backupService } from "@/lib/services/backup-service";

const bodySchema = z.object({
  backupId: z.string().min(1),
});

export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ["super_admin", "school_admin"]);

    const { backupId } = bodySchema.parse(await request.json());
    const restoredSchool = await backupService.restoreAsClone({
      backupId,
      sourceSchoolId: schoolContext.schoolId,
      createdBy: session.userId,
    });

    return NextResponse.json({
      message: "Backup restored as a cloned school.",
      restoredSchool: {
        id: restoredSchool.id,
        code: restoredSchool.code,
        name: restoredSchool.name,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
