import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { getSession } from "@/lib/session";
import { withSchoolContext } from "@/lib/school-context";
import { prisma } from "@/lib/prisma";
import { getAdminCookieName } from "@/lib/admin-auth";

export type ApiRole =
  | "super_admin"
  | "school_admin"
  | "teacher"
  | "bursar"
  | "parent"
  | "student";

const WEBSITE_EDITOR_ROLES: ApiRole[] = ["super_admin", "school_admin", "bursar"];

export class ApiGuardError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (session?.isLoggedIn) {
    // Keep legacy "admin" users compatible with guard checks that expect "school_admin".
    if (session.role === "admin") {
      session.role = "school_admin";
    }
    return session;
  }

  // Fallback for school admin JWT-based login flow.
  const adminToken =
    cookies().get(getAdminCookieName())?.value ??
    cookies().get("admin_auth_token")?.value;

  if (!adminToken) {
    throw new ApiGuardError("Unauthorized", 401);
  }

  let payload: { userId?: string; role?: string } | null = null;
  try {
    payload = verify(adminToken, process.env.JWT_SECRET!) as {
      userId?: string;
      role?: string;
    };
  } catch {
    throw new ApiGuardError("Unauthorized", 401);
  }

  if (!payload?.userId) {
    throw new ApiGuardError("Unauthorized", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      schoolId: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new ApiGuardError("Unauthorized", 401);
  }

  return {
    isLoggedIn: true,
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role === "admin" ? "school_admin" : user.role,
    schoolId: user.schoolId || undefined,
  };
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

/** School admins and bursars (incl. finance-only login) may edit the public website. */
export async function requireWebsiteEditorAccess(schoolCode: string) {
  const result = await requireSchoolAccess(schoolCode);
  const role = result.session.role as ApiRole | undefined;
  if (!role || !WEBSITE_EDITOR_ROLES.includes(role)) {
    throw new ApiGuardError("Forbidden", 403);
  }
  return result;
}

export function jsonError(error: unknown) {
  if (error instanceof ApiGuardError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
