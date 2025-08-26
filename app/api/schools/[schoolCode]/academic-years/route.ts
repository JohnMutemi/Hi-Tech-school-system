import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: Fetch all academic years for a school
export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const decodedSchoolCode = decodeURIComponent(schoolCode);

    // Find the school
    const school = await prisma.school.findUnique({ 
      where: { code: decodedSchoolCode } 
    });
    
    if (!school) {
      return NextResponse.json(
        { error: 'School not found' }, 
        { status: 404 }
      );
    }

    // Get all academic years for this school
    const academicYears = await prisma.academicYear.findMany({
      where: { schoolId: school.id },
      orderBy: [
        { isCurrent: 'desc' }, // Current year first
        { name: 'desc' } // Then by name descending
      ],
      select: {
        id: true,
        name: true,
        isCurrent: true,
        startDate: true,
        endDate: true,
        createdAt: true
      }
    });

    return NextResponse.json(academicYears);

  } catch (error) {
    console.error('Error fetching academic years:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode } });
    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });
    const { name, startDate, endDate } = await req.json();
    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create academic year" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { id, name, startDate, endDate } = await req.json();
    if (!id || !name || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update academic year" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.academicYear.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete academic year" }, { status: 500 });
  }
} 