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
      const eligibleStudents = await getEligibleStudents(school.id, classLevel);
      return NextResponse.json(eligibleStudents);
    }

    if (action === 'criteria') {
      const criteria = await prisma.promotionCriteria.findMany({
        where: { schoolId: school.id, isActive: true },
      });
      return NextResponse.json(criteria);
    }

    if (action === 'progression') {
      const progression = await prisma.classProgression.findMany({
        where: { schoolId: school.id, isActive: true },
        orderBy: { order: 'asc' },
      });
      return NextResponse.json(progression);
    }

    if (action === 'history') {
      const history = await prisma.promotionLog.findMany({
        where: { student: { schoolId: school.id } },
        include: {
          student: { include: { user: true } },
          user: true,
          exclusions: { include: { student: { include: { user: true } } } },
        },
        orderBy: { promotionDate: 'desc' },
        take: 50,
      });
      return NextResponse.json(history);
    }

    // Default response if no action matches
    return NextResponse.json({ message: 'Please specify an action.' });
    
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
      excludedStudents = [], // Default to empty array
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

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    let realPromotedBy = promotedBy;
    if (!realPromotedBy || realPromotedBy === "admin") {
      const adminUser = await prisma.user.findFirst({
        where: { role: "admin", schoolId: school.id },
      });
      if (!adminUser) {
        return NextResponse.json({ error: "No admin user found for this school" }, { status: 400 });
      }
      realPromotedBy = adminUser.id;
    }

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      const promotionLogs = [];
      const carryForwardEntries = [];

      // Promote each selected student
      for (const studentId of studentIds) {
        const student = await tx.student.findUnique({
          where: { id: studentId },
          include: {
            class: { include: { grade: true } },
            payments: { where: { academicYear: currentYear } },
          },
        });

        if (!student) continue;

        // Calculate outstanding fee balance from current academic year
        const totalPaid = student.payments.reduce((sum, payment) => sum + payment.amount, 0);

        let outstandingBalance = 0;
        const currentGrade = student.class?.grade;
        if (currentGrade) {
          const feeStructures = await tx.termlyFeeStructure.findMany({
            where: {
              gradeId: currentGrade.id,
              year: currentYear,
              isActive: true,
            },
          });
          
          const totalFees = feeStructures.reduce((sum, fs) => sum + Number(fs.totalAmount), 0);
          outstandingBalance = Math.max(0, totalFees - totalPaid);

          // Create carry-forward entry if there's outstanding balance
          if (outstandingBalance > 0) {
            const carryForwardEntry = await tx.payment.create({
              data: {
                studentId: studentId,
                amount: outstandingBalance,
                paymentDate: new Date(),
                paymentMethod: 'CARRY_FORWARD',
                referenceNumber: `CF-${currentYear}-${nextYear}`,
                receiptNumber: `CF-${studentId}-${Date.now()}`,
                description: `Fee Balance Carried Forward from ${currentYear} to ${nextYear}`,
                receivedBy: 'System',
                term: 'CARRY_FORWARD',
                academicYear: nextYear,
              },
            });
            carryForwardEntries.push(carryForwardEntry);
          }
        }

        // Find the target class for promotion
        const targetClass = await tx.class.findFirst({
          where: { name: toClass, schoolId: school.id, isActive: true },
        });

        if (!targetClass) {
          throw new Error(`Target class ${toClass} not found`);
        }

        // Update student class and academic year
        await tx.student.update({
          where: { id: studentId },
          data: {
            class: { connect: { id: targetClass.id } },
            academicYear: (student.academicYear || currentYear) + 1,
          },
        });

        // Create promotion log
        const promotionLog = await tx.promotionLog.create({
          data: {
            studentId,
            fromClass,
            toClass,
            fromYear: currentYear.toString(),
            toYear: nextYear.toString(),
            promotedBy: realPromotedBy,
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
      if (excludedStudents.length > 0) {
        const logId = promotionLogs[0]?.id;
        if (logId) {
          for (const exclusion of excludedStudents) {
            await tx.promotionExclusion.create({
              data: {
                promotionLogId: logId,
                studentId: exclusion.studentId,
                reason: exclusion.reason,
                notes: exclusion.notes,
                excludedBy: realPromotedBy,
              },
            });
          }
        }
      }

      return { 
        success: true, 
        promotedCount: studentIds.length, 
        excludedCount: excludedStudents.length,
        carryForwardCount: carryForwardEntries.length,
        totalCarriedForward: carryForwardEntries.reduce((sum: number, entry: any) => sum + entry.amount, 0),
      };
    }, {
      timeout: 20000, // Increase timeout to 20 seconds
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
  const targetClass = await prisma.class.findFirst({
    where: { name: classLevel, schoolId: schoolId, isActive: true },
    include: { grade: true },
  });

  if (!targetClass) {
    throw new Error(`Class ${classLevel} not found`);
  }

  const currentYear = new Date().getFullYear();
  const students = await prisma.student.findMany({
    where: {
      schoolId,
      classId: targetClass.id,
      academicYear: currentYear,
      isActive: true,
    },
    include: {
      user: true,
      class: { include: { grade: true } },
      payments: { where: { academicYear: currentYear } },
    },
  });

  const criteria = await prisma.promotionCriteria.findFirst({
    where: { schoolId, classLevel: targetClass.grade.name, isActive: true },
  });

  const feeStructures = await prisma.termlyFeeStructure.findMany({
    where: {
      gradeId: targetClass.grade.id,
      year: currentYear,
      isActive: true,
    },
  });

  const termOrder: { [key: string]: number } = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };
  const sortedFeeStructures = [...feeStructures].sort((a, b) => termOrder[a.term] - termOrder[b.term]);

  return students.map(student => {
    let outstandingBalance = 0;
    const totalFeesForYear = feeStructures.reduce((sum, fs) => sum + Number(fs.totalAmount), 0);
    const totalPaidForYear = student.payments.reduce((sum, p) => sum + p.amount, 0);
    outstandingBalance = Math.max(0, totalFeesForYear - totalPaidForYear);
    
    const allTermsPaid = outstandingBalance === 0;

    return {
      ...student,
      name: student.user?.name,
      email: student.user?.email,
      classLevel: targetClass.grade.name,
      className: targetClass.name,
      eligibility: {
        feeStatus: allTermsPaid ? 'paid' : 'unpaid',
        allTermsPaid,
        meetsCriteria: !criteria || (allTermsPaid && (!criteria.minGrade || true)),
        outstandingBalance: outstandingBalance,
        totalFees: totalFeesForYear,
        totalPaid: totalPaidForYear,
      },
    };
  });
} 