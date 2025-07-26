import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    console.log('🔍 GET /api/schools/[schoolCode]/academic-years called');
    console.log('📋 Params:', params);

    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode }
    });

    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    const academicYears = await prisma.academicYear.findMany({
      where: { schoolId: school.id },
      orderBy: { name: 'desc' }
    });

    console.log(`✅ Found ${academicYears.length} academic years for school ${school.name}`);

    return NextResponse.json({
      success: true,
      data: academicYears
    });

  } catch (error) {
    console.error('❌ Error fetching academic years:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch academic years' },
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