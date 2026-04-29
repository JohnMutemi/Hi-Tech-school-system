import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireRole, requireSchoolAccess } from "@/lib/api-guard";
import {
  checkBackupStorageHealth,
  getBackupStorageProvider,
} from "@/lib/services/backup-artifact-storage";

export async function GET(_: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { session } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ["super_admin", "school_admin"]);
    const health = await checkBackupStorageHealth();
    return NextResponse.json({
      ...health,
      provider: getBackupStorageProvider(),
    });
  } catch (error) {
    return jsonError(error);
  }
}
