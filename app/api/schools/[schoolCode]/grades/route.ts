import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List all grades for a school
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');

    if (!schoolCode) {
      console.log('Missing schoolCode query param. Returning all grades.');
      const grades = await prisma.grade.findMany();
      return NextResponse.json(grades);
    }

    console.log(`Fetching grades for school code: ${schoolCode}`);
    const school = await prisma.school.findUnique({
      where: { code: schoolCode.toLowerCase() },
    });

    if (!school) {
      console.log('School not found, returning 404.');
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const grades = await prisma.grade.findMany({
      where: { schoolId: school.id },
    });

    console.log(`Found ${grades.length} grades for school ID ${school.id}`);
    return NextResponse.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
}
