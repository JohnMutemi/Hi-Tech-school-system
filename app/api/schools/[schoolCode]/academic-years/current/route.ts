import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findSchoolByCode } from "@/lib/school-lookup";

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const school = await findSchoolByCode(params.schoolCode);
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const academicYearRecord = await prisma.academicYear.findFirst({
      where: {
        schoolId: school.id,
        isCurrent: true,
      },
      orderBy: { startDate: "desc" },
    });

    if (academicYearRecord) {
      return NextResponse.json({
        year: academicYearRecord.name,
        isActive: academicYearRecord.isCurrent,
        startDate: academicYearRecord.startDate,
        endDate: academicYearRecord.endDate,
      });
    }

    // Fallback when no row is marked current (calendar estimate only)
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    let academicYear = currentYear;
    if (currentMonth >= 1 && currentMonth <= 6) {
      academicYear = currentYear - 1;
    }

    return NextResponse.json({
      year: academicYear.toString(),
      isActive: false,
      startDate: null,
      endDate: null,
    });
  } catch (error) {
    console.error("Error fetching current academic year:", error);
    return NextResponse.json(
      { error: "Failed to fetch current academic year" },
      { status: 500 }
    );
  }
}
