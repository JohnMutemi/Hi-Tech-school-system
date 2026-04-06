import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { withSchoolContext } from "@/lib/school-context";

export type ApiRole =
  | "super_admin"
  | "school_admin"
  | "teacher"
  | "bursar"
  | "parent"
  | "student";

export class ApiGuardError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.isLoggedIn) {
    throw new ApiGuardError("Unauthorized", 401);
  }
  return session;
}

export function requireRole(session: { role?: string }, allowedRoles: ApiRole[]) {
  const role = session.role as ApiRole | undefined;
  if (!role || !allowedRoles.includes(role)) {
    throw new ApiGuardError("Forbidden", 403);
  }
}

export async function requireSchoolAccess(schoolCode: string) {
  const session = await requireSession();

  const schoolManager = withSchoolContext(schoolCode);
  const schoolContext = await schoolManager.initialize();

  // Super admins can access any school.
  if (session.role === "super_admin") {
    return { session, schoolContext, schoolManager };
  }

  if (!session.schoolId || session.schoolId !== schoolContext.schoolId) {
    throw new ApiGuardError("Forbidden", 403);
  }

  return { session, schoolContext, schoolManager };
}

export function jsonError(error: unknown) {
  if (error instanceof ApiGuardError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
