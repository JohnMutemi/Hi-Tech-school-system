import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List all grades for a school
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    console.log(`Fetching grades for school code: ${params.schoolCode}`);
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } });
    
    console.log('Found school:', school);

    if (!school) {
      console.log('School not found, returning 404.');
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const grades = await prisma.grade.findMany({ where: { schoolId: school.id } });
    
    console.log(`Found ${grades.length} grades for school ID ${school.id}:`, grades);

    return NextResponse.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
} 