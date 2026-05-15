import { prisma } from "@/lib/prisma";

/** Resolve school by URL code (case-insensitive, matches DB canonical code). */
export async function findSchoolByCode(schoolCode: string) {
  const decoded = decodeURIComponent(schoolCode).trim();
  if (!decoded) return null;

  return prisma.school.findFirst({
    where: {
      code: {
        equals: decoded,
        mode: "insensitive",
      },
    },
  });
}
