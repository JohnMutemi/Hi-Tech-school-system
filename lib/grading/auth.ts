import { verify } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SessionPayload = {
  userId?: string;
  studentId?: string;
  schoolId?: string;
  schoolCode?: string;
  role?: string;
};

export async function requireUserSession(
  token: string | undefined,
  schoolCode: string,
  allowedRoles: string[]
) {
  if (!token) {
    throw new Error("Unauthorized");
  }
  const payload = verify(token, process.env.JWT_SECRET!) as SessionPayload;
  const normalizedSchoolCode = schoolCode.toLowerCase();
  if (!payload.role || !allowedRoles.includes(payload.role)) {
    throw new Error("Forbidden");
  }
  if (payload.schoolCode !== normalizedSchoolCode) {
    throw new Error("Invalid school session");
  }
  if (!payload.userId) {
    throw new Error("Invalid session");
  }
  const school = await prisma.school.findUnique({
    where: { code: normalizedSchoolCode },
    select: { id: true, code: true, name: true },
  });
  if (!school) {
    throw new Error("School not found");
  }
  return { payload, school };
}

export async function requireStudentSession(
  token: string | undefined,
  schoolCode: string
) {
  if (!token) throw new Error("Unauthorized");
  const payload = verify(token, process.env.JWT_SECRET!) as SessionPayload;
  if (payload.role !== "student" || payload.schoolCode !== schoolCode) {
    throw new Error("Invalid session");
  }
  return payload;
}

export async function requireParentSession(
  token: string | undefined,
  schoolCode: string
) {
  if (!token) throw new Error("Unauthorized");
  const payload = verify(token, process.env.JWT_SECRET!) as SessionPayload;
  if (payload.role !== "parent" || payload.schoolCode !== schoolCode.toLowerCase()) {
    throw new Error("Invalid session");
  }
  return payload;
}
