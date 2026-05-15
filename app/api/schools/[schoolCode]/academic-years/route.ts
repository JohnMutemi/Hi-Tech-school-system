import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findSchoolByCode } from "@/lib/school-lookup";

// GET: Fetch all academic years for a school
export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const school = await findSchoolByCode(params.schoolCode);

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const academicYears = await prisma.academicYear.findMany({
      where: { schoolId: school.id },
      orderBy: [{ isCurrent: "desc" }, { name: "desc" }],
      select: {
        id: true,
        name: true,
        isCurrent: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });

    return NextResponse.json(academicYears);
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const school = await findSchoolByCode(params.schoolCode);
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const { name, startDate, endDate } = await req.json();
    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const year = await prisma.academicYear.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        schoolId: school.id,
      },
    });

    return NextResponse.json(year);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create academic year";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, name, startDate, endDate } = await req.json();
    if (!id || !name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const year = await prisma.academicYear.update({
      where: { id },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    return NextResponse.json(year);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update academic year";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.academicYear.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete academic year";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
