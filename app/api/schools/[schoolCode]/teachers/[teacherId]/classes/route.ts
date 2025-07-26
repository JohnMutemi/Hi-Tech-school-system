import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { calculateStudentOutstanding } from "@/lib/utils/fee-balance";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; teacherId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Verify teacher exists and belongs to this school
    const teacher = await prisma.user.findFirst({
      where: {
        id: params.teacherId,
        schoolId: school.id,
        role: 'TEACHER',
        isActive: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (action === 'promotion-data') {
      return await getTeacherPromotionData(school.id, params.teacherId);
    }

    // Default: Get teacher's assigned classes
    const classes = await prisma.class.findMany({
      where: {
        schoolId: school.id,
        teacherId: params.teacherId,
        isActive: true,
      },
      include: {
        grade: true,
        students: {
          where: { isActive: true },
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teacher classes' },
      { status: 500 }
    );
  }
}

async function getTeacherPromotionData(schoolId: string, teacherId: string) {
  try {
    const currentYear = new Date().getFullYear();
    
    // Get teacher's assigned classes
    const classes = await prisma.class.findMany({
      where: {
        schoolId,
        teacherId,
        isActive: true,
      },
      include: {
        grade: true,
        students: {
          where: { 
            isActive: true,
            academicYear: currentYear,
          },
          include: {
            user: true,
            payments: {
              where: {
                academicYear: {
                  name: String(currentYear)
                }
              }
            }
          },
        },
      },
    });

    const classesWithPromotionData = await Promise.all(
      classes.map(async (cls) => {
        // Get promotion criteria for this class level
        const criteria = await prisma.promotionCriteria.findMany({
          where: {
            schoolId,
            classLevel: cls.grade.name,
            isActive: true,
          },
          orderBy: { priority: 'asc' },
        });

        // Get fee structures for this grade
        const feeStructures = await prisma.termlyFeeStructure.findMany({
          where: {
            gradeId: cls.grade.id,
            year: currentYear,
            isActive: true,
          },
        });

        // Process students with eligibility checking
        const studentsWithEligibility = await Promise.all(
          cls.students.map(async (student) => {
            // Calculate outstanding balance
            const { outstandingBalance } = await calculateStudentOutstanding({
              student,
              feeStructures,
              payments: student.payments,
              filterAcademicYear: currentYear,
            });

            // Remove all mock data for grade, attendance, discipline
            // These fields are not yet implemented, so set as undefined/null
            // const averageGrade = 75.0; // Mock grade
            // const attendanceRate = 85.0; // Mock attendance
            // const disciplinaryCases = 0;

            // Check eligibility against criteria (only fee balance for now)
            let isEligible = true;
            const failedCriteria: string[] = [];

            for (const criterion of criteria) {
              // Fee balance check
              if (criterion.maxOutstandingBalance && outstandingBalance > criterion.maxOutstandingBalance) {
                isEligible = false;
                failedCriteria.push(`Fee balance (${outstandingBalance}) exceeds limit (${criterion.maxOutstandingBalance})`);
              }
              // Other criteria (grade, attendance, discipline) coming soon
            }

            // Determine next class
            let nextClass = '';
            let isGraduating = false;

            if (cls.grade.name === 'Grade 6') {
              isGraduating = true;
            } else {
              // Find next class using progression rules
              const progression = await prisma.classProgression.findFirst({
                where: {
                  schoolId,
                  fromClass: cls.name,
                  isActive: true,
                },
              });
              nextClass = progression?.toClass || '';
            }

            return {
              id: student.id,
              name: student.user.name,
              admissionNumber: student.admissionNumber,
              outstandingBalance,
              // averageGrade: undefined, // Coming soon
              // attendanceRate: undefined, // Coming soon
              // disciplinaryCases: undefined, // Coming soon
              isEligible,
              failedCriteria,
              nextClass,
              isGraduating,
            };
          })
        );

        const eligibleCount = studentsWithEligibility.filter(s => s.isEligible).length;

        return {
          id: cls.id,
          name: cls.name,
          grade: cls.grade.name,
          studentCount: cls.students.length,
          eligibleCount,
          criteria: criteria.map(c => ({
            type: 'fee_balance', // This would be determined from customCriteria
            name: c.name,
            description: c.description,
            limit: c.maxOutstandingBalance,
          })),
          students: studentsWithEligibility,
        };
      })
    );

    return NextResponse.json(classesWithPromotionData);
  } catch (error) {
    console.error('Error getting teacher promotion data:', error);
    throw error;
  }
} 