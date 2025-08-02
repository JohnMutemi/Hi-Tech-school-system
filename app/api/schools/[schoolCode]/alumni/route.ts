import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    console.log('🔍 GET /api/schools/[schoolCode]/alumni called');
    console.log('📋 Params:', params);
    
    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode }
    });

    if (!school) {
      console.log('❌ School not found:', params.schoolCode);
      return NextResponse.json(
        {
          success: false,
          error: 'School not found'
        },
        { status: 404 }
      );
    }

    console.log('✅ School found:', school.name);

    // Get all alumni for this school
    const alumni = await prisma.alumni.findMany({
      where: { 
        schoolId: school.id 
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      },
      orderBy: { 
        graduationYear: 'desc',
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${alumni.length} alumni records`);

    // Calculate statistics
    const currentYear = new Date().getFullYear().toString();
    const graduationYears = await prisma.alumni.groupBy({
      by: ['graduationYear'],
      where: { schoolId: school.id },
      _count: {
        id: true
      },
      orderBy: {
        graduationYear: 'desc'
      }
    });

    const stats = {
      totalAlumni: alumni.length,
      totalYears: graduationYears.length,
      thisYearGraduates: alumni.filter(a => a.graduationYear === currentYear).length,
      topPerformers: alumni.filter(a => a.finalGrade === 'A').length
    };

    // Format alumni data
    const formattedAlumni = alumni.map(alum => ({
      id: alum.id,
      studentId: alum.studentId,
      studentName: alum.student.user.name,
      admissionNumber: alum.student.admissionNumber,
      graduationYear: alum.graduationYear,
      finalGrade: alum.finalGrade,
      achievements: alum.achievements || [],
      contactEmail: alum.contactEmail,
      contactPhone: alum.contactPhone,
      currentInstitution: alum.currentInstitution,
      currentOccupation: alum.currentOccupation,
      createdAt: alum.createdAt.toISOString(),
      updatedAt: alum.updatedAt.toISOString()
    }));

    // Format graduation years data
    const formattedGraduationYears = graduationYears.map(year => ({
      year: year.graduationYear,
      count: year._count.id,
      topPerformers: alumni.filter(a => 
        a.graduationYear === year.graduationYear && a.finalGrade === 'A'
      ).length
    }));

    return NextResponse.json({
      success: true,
      alumni: formattedAlumni,
      graduationYears: formattedGraduationYears,
      stats
    });
  } catch (error) {
    console.error('❌ Error getting alumni:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get alumni'
      },
      { status: 500 }
    );
  }
} 