import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: Get promotion criteria and eligible students
export async function GET(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const classLevel = searchParams.get('classLevel');
    const action = searchParams.get('action');

    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    if (action === 'eligible-students' && classLevel) {
      // Get eligible students for promotion
      const eligibleStudents = await getEligibleStudents(school.id, classLevel);
      return NextResponse.json(eligibleStudents);
    }

    if (action === 'criteria') {
      // Get promotion criteria for the school
      const criteria = await prisma.promotionCriteria.findMany({
        where: { schoolId: school.id, isActive: true },
      });
      return NextResponse.json(criteria);
    }

    if (action === 'progression') {
      // Get class progression rules
      const progression = await prisma.classProgression.findMany({
        where: { schoolId: school.id, isActive: true },
        orderBy: { order: 'asc' },
      });
      return NextResponse.json(progression);
    }

    if (action === 'history') {
      // Get promotion history
      const history = await prisma.promotionLog.findMany({
        where: { 
          student: { schoolId: school.id }
        },
        include: {
          student: {
            include: {
              user: true
            }
          },
          user: true,
          exclusions: {
            include: {
              student: {
                include: {
                  user: true
                }
              }
            }
          }
        },
        orderBy: { promotionDate: 'desc' },
        take: 50
      });
      return NextResponse.json(history);
    }

    // Get all students in the specified class
    const students = await prisma.student.findMany({
      where: {
        schoolId: school.id,
        classLevel: classLevel || undefined,
        isActive: true,
      },
      include: {
        user: true,
        parent: true,
        payments: {
          where: {
            description: { in: ['Term 1', 'Term 2', 'Term 3'] },
          },
        },
      },
    });

    return NextResponse.json(students);
  } catch (error: any) {
    console.error('Promotion API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch promotion data' }, { status: 500 });
  }
}

// POST: Execute bulk promotion
export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { schoolCode } = params;
    const body = await req.json();
    const {
      fromClass,
      toClass,
      studentIds,
      excludedStudents,
      promotedBy,
      notes,
    } = body;

    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    if (!fromClass || !toClass || !studentIds || studentIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const currentYear = new Date().getFullYear().toString();
    const nextYear = (parseInt(currentYear) + 1).toString();

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      const promotionLogs = [];
      const carryForwardEntries = [];

      // Promote each selected student
      for (const studentId of studentIds) {
        const student = await tx.student.findUnique({
          where: { id: studentId },
          include: {
            class: true,
            payments: {
              where: {
                description: { in: ['Term 1', 'Term 2', 'Term 3'] },
              },
            },
          },
        });

        if (!student) continue;

        // Calculate outstanding fee balance from current academic year
        const currentYearPayments = student.payments.filter(p => 
          p.description.includes(currentYear) || 
          ['Term 1', 'Term 2', 'Term 3'].includes(p.description)
        );
        
        const totalPaid = currentYearPayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Get fee structure for current grade to calculate total fees
        const currentGrade = student.class?.grade;
        if (currentGrade) {
          const feeStructures = await tx.termlyFeeStructure.findMany({
            where: {
              gradeId: currentGrade.id,
              year: parseInt(currentYear),
              isActive: true,
            },
          });
          
          const totalFees = feeStructures.reduce((sum, fs) => sum + Number(fs.totalAmount), 0);
          const outstandingBalance = Math.max(0, totalFees - totalPaid);

          // Create carry-forward entry if there's outstanding balance
          if (outstandingBalance > 0) {
            const carryForwardEntry = await tx.payment.create({
              data: {
                studentId: studentId,
                amount: outstandingBalance,
                paymentDate: new Date(),
                paymentMethod: 'carry_forward',
                referenceNumber: `CF-${currentYear}-${nextYear}`,
                receiptNumber: `CF-${studentId}-${Date.now()}`,
                description: `Fee Balance Carried Forward from ${currentYear} to ${nextYear}`,
                receivedBy: promotedBy,
              },
            });
            carryForwardEntries.push(carryForwardEntry);
          }
        }

        // Find the target class (section/stream) for promotion
        const targetClass = await tx.class.findFirst({
          where: {
            name: toClass,
            schoolId: school.id,
            isActive: true,
          },
        });

        if (!targetClass) {
          throw new Error(`Target class ${toClass} not found`);
        }

        // Update student class and academic year
        await tx.student.update({
          where: { id: studentId },
          data: {
            classId: targetClass.id,
            // Remove old fields that are no longer used
            // classLevel: toClass,
            // className: toClass,
            // academicYear: nextYear,
          },
        });

        // Create promotion log
        const promotionLog = await tx.promotionLog.create({
          data: {
            studentId,
            fromClass,
            toClass,
            fromYear: currentYear,
            toYear: nextYear,
            promotedBy,
            criteria: { 
              type: 'bulk_promotion',
              outstandingBalance: outstandingBalance || 0,
              carryForwardCreated: outstandingBalance > 0,
            },
            notes: outstandingBalance > 0 
              ? `${notes} (Fee balance of KES ${outstandingBalance.toLocaleString()} carried forward)`
              : notes,
            promotionType: 'bulk',
          },
        });

        promotionLogs.push(promotionLog);
      }

      // Log exclusions if any
      if (excludedStudents && excludedStudents.length > 0) {
        for (const exclusion of excludedStudents) {
          await tx.promotionExclusion.create({
            data: {
              promotionLogId: promotionLogs[0].id, // Use first promotion log as reference
              studentId: exclusion.studentId,
              reason: exclusion.reason,
              notes: exclusion.notes,
              excludedBy,
            },
          });
        }
      }

      return { 
        success: true, 
        promotedCount: studentIds.length, 
        excludedCount: excludedStudents?.length || 0,
        carryForwardCount: carryForwardEntries.length,
        totalCarriedForward: carryForwardEntries.reduce((sum, entry) => sum + entry.amount, 0),
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Bulk promotion error:', error);
    return NextResponse.json({ error: error.message || 'Failed to execute bulk promotion' }, { status: 500 });
  }
}

// PUT: Update promotion criteria
export async function PUT(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { schoolCode } = params;
    const body = await req.json();
    const { action, data } = body;

    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    if (action === 'criteria') {
      // Update or create promotion criteria
      const criteria = await prisma.promotionCriteria.upsert({
        where: {
          schoolId_classLevel: {
            schoolId: school.id,
            classLevel: data.classLevel,
          },
        },
        update: {
          minGrade: data.minGrade,
          attendance: data.attendance,
          feeStatus: data.feeStatus,
          isActive: data.isActive,
        },
        create: {
          schoolId: school.id,
          classLevel: data.classLevel,
          minGrade: data.minGrade,
          attendance: data.attendance,
          feeStatus: data.feeStatus,
          isActive: data.isActive,
        },
      });
      return NextResponse.json(criteria);
    }

    if (action === 'progression') {
      // Update class progression rules
      const progression = await prisma.classProgression.upsert({
        where: {
          schoolId_fromClass: {
            schoolId: school.id,
            fromClass: data.fromClass,
          },
        },
        update: {
          toClass: data.toClass,
          order: data.order,
          isActive: data.isActive,
        },
        create: {
          schoolId: school.id,
          fromClass: data.fromClass,
          toClass: data.toClass,
          order: data.order,
          isActive: data.isActive,
        },
      });
      return NextResponse.json(progression);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Promotion update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update promotion settings' }, { status: 500 });
  }
}

// Helper function to get eligible students
async function getEligibleStudents(schoolId: string, classLevel: string) {
  // Find the class by name (classLevel parameter)
  const targetClass = await prisma.class.findFirst({
    where: {
      name: classLevel,
      schoolId: schoolId,
      isActive: true,
    },
    include: {
      grade: true,
    },
  });

  if (!targetClass) {
    throw new Error(`Class ${classLevel} not found`);
  }

  const students = await prisma.student.findMany({
    where: {
      schoolId,
      classId: targetClass.id,
      isActive: true,
    },
    include: {
      user: true,
      class: {
        include: {
          grade: true,
        },
      },
      payments: {
        where: {
          description: { in: ['Term 1', 'Term 2', 'Term 3'] },
        },
      },
    },
  });

  // Get promotion criteria for the grade
  const criteria = await prisma.promotionCriteria.findFirst({
    where: { 
      schoolId, 
      classLevel: targetClass.grade.name, 
      isActive: true 
    },
  });

  // Get fee structures for the current grade and year
  const currentYear = new Date().getFullYear();
  const feeStructures = await prisma.termlyFeeStructure.findMany({
    where: {
      gradeId: targetClass.grade.id,
      year: currentYear,
      isActive: true,
    },
  });

  return students.map(student => {
    const paidTerms = student.payments.map(p => p.description);
    const allTermsPaid = ['Term 1', 'Term 2', 'Term 3'].every(term => 
      paidTerms.includes(term)
    );

    // Calculate total fees and outstanding balance
    const totalFees = feeStructures.reduce((sum, fs) => sum + Number(fs.totalAmount), 0);
    const totalPaid = student.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const outstandingBalance = Math.max(0, totalFees - totalPaid);

    return {
      ...student,
      name: student.user?.name,
      email: student.user?.email,
      classLevel: targetClass.grade.name, // For backward compatibility
      className: targetClass.name, // For backward compatibility
      eligibility: {
        feeStatus: allTermsPaid ? 'paid' : 'unpaid',
        allTermsPaid,
        meetsCriteria: !criteria || (allTermsPaid && (!criteria.minGrade || true)), // Simplified for now
        outstandingBalance,
        totalFees,
        totalPaid,
      },
    };
  });
} 