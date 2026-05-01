import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireRole, requireSchoolAccess } from "@/lib/api-guard";

function getDateWindow(range: string) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  const previousStart = new Date(now);
  const previousEnd = new Date(now);

  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      previousStart.setDate(previousStart.getDate() - 1);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      break;
    case "this-week": {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(now.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      previousEnd.setTime(start.getTime() - 1);
      previousStart.setTime(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    }
    case "this-term":
      start.setMonth(now.getMonth() - 3);
      previousEnd.setTime(start.getTime() - 1);
      previousStart.setMonth(start.getMonth() - 3);
      break;
    case "this-year":
    default:
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      previousStart.setFullYear(start.getFullYear() - 1, 0, 1);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setTime(start.getTime() - 1);
      break;
  }

  return { start, end, previousStart, previousEnd };
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const schoolCode = params.schoolCode.toLowerCase();
    const { session, schoolContext } = await requireSchoolAccess(schoolCode);
    requireRole(session, ["super_admin", "school_admin", "bursar"]);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "this-year";
    const { start, end, previousStart, previousEnd } = getDateWindow(range);

    const [studentsCurrent, studentsPrevious, paymentsCurrent, paymentsPrevious] =
      await Promise.all([
        prisma.student.count({
          where: {
            schoolId: schoolContext.schoolId,
            createdAt: { gte: start, lte: end },
          },
        }),
        prisma.student.count({
          where: {
            schoolId: schoolContext.schoolId,
            createdAt: { gte: previousStart, lte: previousEnd },
          },
        }),
        prisma.payment.aggregate({
          where: {
            student: { schoolId: schoolContext.schoolId },
            paymentDate: { gte: start, lte: end },
          },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: {
            student: { schoolId: schoolContext.schoolId },
            paymentDate: { gte: previousStart, lte: previousEnd },
          },
          _sum: { amount: true },
        }),
      ]);

    const feeCurrent = Number(paymentsCurrent._sum.amount || 0);
    const feePrevious = Number(paymentsPrevious._sum.amount || 0);

    return NextResponse.json({
      data: {
        totalStudents: await prisma.student.count({
          where: { schoolId: schoolContext.schoolId, isActive: true },
        }),
        studentPeriodCount: studentsCurrent,
        studentDeltaPercent: percentChange(studentsCurrent, studentsPrevious),
        feeCollection: feeCurrent,
        feeDeltaPercent: percentChange(feeCurrent, feePrevious),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
