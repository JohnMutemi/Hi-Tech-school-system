import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;

    // Get the current academic year
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    // Determine academic year based on current date
    // If we're in the first half of the year (Jan-June), it's the previous year's academic year
    // If we're in the second half (July-Dec), it's the current year's academic year
    let academicYear = currentYear;
    if (currentMonth >= 1 && currentMonth <= 6) {
      academicYear = currentYear - 1;
    }

    // Try to find the academic year in the database
    const academicYearRecord = await prisma.academicYear.findFirst({
      where: {
        school: {
          schoolCode: schoolCode,
        },
        name: academicYear.toString(),
        isCurrent: true,
      },
    });

    // If not found, return the calculated year
    const year = academicYearRecord?.name || academicYear.toString();

    return NextResponse.json({
      year,
      isActive: academicYearRecord?.isCurrent || false,
      startDate: academicYearRecord?.startDate,
      endDate: academicYearRecord?.endDate,
    });
  } catch (error) {
    console.error("Error fetching current academic year:", error);
    return NextResponse.json(
      { error: "Failed to fetch current academic year" },
      { status: 500 }
    );
  }
} 