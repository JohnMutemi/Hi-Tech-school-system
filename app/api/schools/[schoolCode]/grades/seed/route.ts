import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { withSchoolContext } from '@/lib/school-context';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    await schoolManager.initialize();
    const schoolContext = schoolManager.getContext();
    
    // Delete all existing grades for this school
    await prisma.grade.deleteMany({
      where: {
        schoolId: schoolContext.schoolId,
      },
    });
    
    // Create new grades 1-6
    const grades = [];
    for (let i = 1; i <= 6; i++) {
      const gradeName = `Grade ${i}`;
      const grade = await prisma.grade.create({ 
        data: { 
          name: gradeName,
          schoolId: schoolContext.schoolId,
          isAlumni: false
        } 
      });
      grades.push(grade);
    }
    
    return NextResponse.json({ success: true, grades });
  } catch (error: any) {
    console.error('Failed to seed grades:', error);
    return NextResponse.json({ error: 'Failed to seed grades' }, { status: 500 });
  }
} 