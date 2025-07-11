import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: Get promotion criteria, eligible students, and progression rules
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
        orderBy: [{ classLevel: 'asc' }, { priority: 'asc' }],
        include: {
          creator: { select: { name: true, email: true } }
        }
      });
      return NextResponse.json(criteria);
    }

    if (action === 'progression') {
      const progression = await prisma.classProgression.findMany({
        where: { schoolId: school.id, isActive: true },
        orderBy: { order: 'asc' },
        include: {
          criteria: true,
          creator: { select: { name: true, email: true } }
        }
      });
      return NextResponse.json(progression);
    }

    if (action === 'history') {
      const history = await prisma.promotionLog.findMany({
        where: { student: { schoolId: school.id } },
        include: {
          student: { include: { user: true } },
          user: { select: { name: true, email: true } },
          appliedCriteria: true,
          exclusions: { 
            include: { 
              student: { include: { user: true } },
              user: { select: { name: true, email: true } }
            } 
          },
        },
        orderBy: { promotionDate: 'desc' },
        take: 50,
      });
      return NextResponse.json(history);
    }

    return NextResponse.json({ message: 'Please specify an action.' });

  } catch (error: any) {
    console.error('Promotion API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch promotion data' }, { status: 500 });
  }
}

// POST: Execute bulk promotion or create criteria
export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
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

    console.log('Promotion POST action:', action, 'Data:', data);

    if (action === 'bulk-promotion') {
      // Guard: Ensure required fields are present
      if (!data || !data.fromClass || !data.toClass) {
        console.error('bulk-promotion: Missing fromClass or toClass', data);
        return NextResponse.json({ error: 'fromClass and toClass are required for class-by-class promotion.' }, { status: 400 });
      }
      console.log('bulk-promotion: Executing for', data.studentIds?.length, 'students');
      const PromotionService = (await import('@/lib/services/promotion-service')).PromotionService;
      const result = await PromotionService.promoteClassStudents(school.id, data.fromClass, data.toClass, data.studentIds, data.promotedBy);
      console.log('bulk-promotion: result', result);
      return NextResponse.json(result);
    }

    if (action === 'create-criteria') {
      return await createPromotionCriteria(school.id, data);
    }

    if (action === 'create-progression') {
      return await createClassProgression(school.id, data);
    }

    if (action === 'school-wide-bulk-promotion') {
      const PromotionService = (await import('@/lib/services/promotion-service')).PromotionService;
      try {
        const result = await PromotionService.promoteSchoolWide(school.id, data.promotedBy);
        console.log('school-wide-bulk-promotion: result', result);
        return NextResponse.json(result);
      } catch (err: any) {
        console.error('school-wide-bulk-promotion: Error in PromotionService', err);
        return NextResponse.json({ error: err.message || 'Failed to execute school-wide promotion' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Promotion API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to execute promotion action' }, { status: 500 });
  }
}

// PUT: Update promotion criteria or progression rules
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

    if (action === 'update-criteria') {
      console.log("Updating promotion criteria with data:", data);
      
      // Validate required fields
      if (!data.name || data.name.trim() === '') {
        return NextResponse.json({ error: "Criteria name is required" }, { status: 400 });
      }
      if (!data.classLevel || data.classLevel.trim() === '') {
        return NextResponse.json({ error: "Class level is required" }, { status: 400 });
      }
      if (!data.customCriteria || !Array.isArray(data.customCriteria) || data.customCriteria.length === 0) {
        return NextResponse.json({ error: "At least one custom criteria is required" }, { status: 400 });
      }

      // Validate custom criteria
      for (const criteria of data.customCriteria) {
        if (!criteria.name || criteria.name.trim() === '') {
          return NextResponse.json({ error: "All criteria must have a name" }, { status: 400 });
        }
        if (!criteria.limit || criteria.limit <= 0) {
          return NextResponse.json({ error: "All criteria must have a valid limit greater than 0" }, { status: 400 });
        }
      }

      // Build the update data object
      const updateData: any = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        classLevel: data.classLevel.trim(),
        customCriteria: data.customCriteria,
      };
      
      // Optional fields
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
      if (data.priority !== undefined) updateData.priority = data.priority;

      console.log("Final update data for Prisma:", updateData);

      const criteria = await prisma.promotionCriteria.update({
        where: { id: data.id },
        data: updateData,
        include: {
          creator: { select: { name: true, email: true } }
        }
      });
      return NextResponse.json(criteria);
    }

    if (action === 'update-progression') {
      const progression = await prisma.classProgression.update({
        where: { id: data.id },
        data: {
          fromClass: data.fromClass,
          toClass: data.toClass,
          fromGrade: data.fromGrade,
          toGrade: data.toGrade,
          order: data.order,
          requireCriteria: data.requireCriteria,
          criteriaId: data.criteriaId,
          allowManualOverride: data.allowManualOverride,
          fromAcademicYear: data.fromAcademicYear,
          toAcademicYear: data.toAcademicYear,
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

// Helper function to get eligible students with comprehensive criteria checking
async function getEligibleStudents(schoolId: string, classLevel: string) {
  const targetClass = await prisma.class.findFirst({
    where: { name: classLevel, schoolId: schoolId, isActive: true },
    include: { grade: true },
  });

  if (!targetClass) {
    throw new Error(`Class ${classLevel} not found`);
  }

  const currentYear = new Date().getFullYear();
  
  // Get students
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
    },
  });

  if (students.length === 0) {
    return {
      students: [],
      hasCriteria: false,
      message: `No students found in ${classLevel} for the current academic year.`
    };
  }

  // Get promotion criteria for this class level
  const criteria = await prisma.promotionCriteria.findMany({
    where: { 
      schoolId, 
      classLevel: targetClass.grade.name, 
      isActive: true 
    },
    orderBy: { priority: 'asc' }
  });

  // Get fee structures
  const feeStructures = await prisma.termlyFeeStructure.findMany({
    where: {
      gradeId: targetClass.grade.id,
      year: currentYear,
      isActive: true,
    },
  });

  // If no criteria are set, return all students as manually promotable
  if (criteria.length === 0) {
    const studentsWithManualEligibility = await Promise.all(
      students.map(async (student) => {
        // Get student's payments for basic info
        const payments = await prisma.payment.findMany({
          where: { studentId: student.id },
        });

        const totalFees = feeStructures.reduce((sum, fs) => sum + Number(fs.totalAmount), 0);
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const outstandingBalance = Math.max(0, totalFees - totalPaid);

        return {
          ...student,
          name: student.user?.name,
          email: student.user?.email,
          classLevel: targetClass.grade.name,
          className: targetClass.name,
          eligibility: {
            isEligible: true, // All students eligible for manual promotion
            primaryCriteria: "Manual Promotion",
            allCriteriaResults: [{
              criteriaId: "manual",
              criteriaName: "Manual Promotion",
              passed: true,
              failedReasons: [],
              details: {
                averageGrade: 0,
                outstandingBalance,
                attendanceRate: 0,
                disciplinaryCases: 0,
              }
            }],
            summary: {
              averageGrade: 0,
              attendanceRate: 0,
              outstandingBalance,
              disciplinaryCases: 0,
              totalFees,
              totalPaid,
            }
          },
        };
      })
    );

    return {
      students: studentsWithManualEligibility,
      hasCriteria: false,
      message: `No promotion criteria set for ${classLevel}. All students are available for manual promotion.`
    };
  }

  // Evaluate each student against criteria
  const studentsWithEligibility = await Promise.all(
    students.map(async (student) => {
      // Get student's payments
      const payments = await prisma.payment.findMany({
        where: { studentId: student.id },
      });

      // Calculate basic metrics
      const totalFees = feeStructures.reduce((sum, fs) => sum + Number(fs.totalAmount), 0);
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const outstandingBalance = Math.max(0, totalFees - totalPaid);

      // Mock data for demonstration (in real system, these would come from actual records)
      const averageGrade = 75.0; // Mock grade
      const attendanceRate = 85.0; // Mock attendance
      const disciplinaryCases = 0; // Mock discipline record

      // Evaluate against each criteria
      const eligibilityResults = criteria.map(criterion => {
        const results = {
          criteriaId: criterion.id,
          criteriaName: criterion.name,
          passed: true,
          failedReasons: [] as string[],
          details: {} as any
        };

        // Academic Performance Check
        if (criterion.minAverageGrade && averageGrade < criterion.minAverageGrade) {
          results.passed = false;
          results.failedReasons.push(`Average grade ${averageGrade} below minimum ${criterion.minAverageGrade}`);
        }
        results.details.averageGrade = averageGrade;

        // Fee Payment Check
        if (criterion.requireFullPayment && outstandingBalance > 0) {
          results.passed = false;
          results.failedReasons.push(`Outstanding balance ${outstandingBalance} but full payment required`);
        } else if (criterion.maxOutstandingBalance && outstandingBalance > criterion.maxOutstandingBalance) {
          results.passed = false;
          results.failedReasons.push(`Outstanding balance ${outstandingBalance} exceeds maximum ${criterion.maxOutstandingBalance}`);
        }
        results.details.outstandingBalance = outstandingBalance;

        // Attendance Check
        if (criterion.minAttendanceRate && attendanceRate < criterion.minAttendanceRate) {
          results.passed = false;
          results.failedReasons.push(`Attendance rate ${attendanceRate}% below minimum ${criterion.minAttendanceRate}%`);
        }
        results.details.attendanceRate = attendanceRate;

        // Discipline Check
        if (criterion.requireCleanRecord && disciplinaryCases > 0) {
          results.passed = false;
          results.failedReasons.push(`Has ${disciplinaryCases} disciplinary cases but clean record required`);
        } else if (criterion.maxDisciplinaryCases && disciplinaryCases > criterion.maxDisciplinaryCases) {
          results.passed = false;
          results.failedReasons.push(`Has ${disciplinaryCases} disciplinary cases, maximum allowed is ${criterion.maxDisciplinaryCases}`);
        }
        results.details.disciplinaryCases = disciplinaryCases;

        return results;
      });

      // Overall eligibility (passes at least one criteria)
      const isEligible = eligibilityResults.some(result => result.passed);
      const primaryCriteria = eligibilityResults.find(result => result.passed) || eligibilityResults[0];

      return {
        ...student,
        name: student.user?.name,
        email: student.user?.email,
        classLevel: targetClass.grade.name,
        className: targetClass.name,
        eligibility: {
          isEligible,
          primaryCriteria: primaryCriteria?.criteriaName,
          allCriteriaResults: eligibilityResults,
          summary: {
            averageGrade,
            attendanceRate,
            outstandingBalance,
            disciplinaryCases,
            totalFees,
            totalPaid,
          }
        },
      };
    })
  );

  return {
    students: studentsWithEligibility,
    hasCriteria: true,
    message: `Found ${studentsWithEligibility.filter(s => s.eligibility.isEligible).length} eligible students out of ${studentsWithEligibility.length} total students.`
  };
}

// Helper function to create promotion criteria
async function createPromotionCriteria(schoolId: string, data: any) {
  console.log("Creating promotion criteria with data:", data);
  
  // Validate required fields
  if (!data.name || data.name.trim() === '') {
    throw new Error("Criteria name is required");
  }
  if (!data.classLevel || data.classLevel.trim() === '') {
    throw new Error("Class level is required");
  }
  if (!data.customCriteria || !Array.isArray(data.customCriteria) || data.customCriteria.length === 0) {
    throw new Error("At least one custom criteria is required");
  }

  // Validate custom criteria
  for (const criteria of data.customCriteria) {
    if (!criteria.name || criteria.name.trim() === '') {
      throw new Error("All criteria must have a name");
    }
    if (!criteria.limit || criteria.limit <= 0) {
      throw new Error("All criteria must have a valid limit greater than 0");
    }
  }

  // Build the data object for Prisma
  const criteriaData: any = {
    schoolId,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    classLevel: data.classLevel.trim(),
    customCriteria: data.customCriteria, // Store as JSON
    isActive: true,
    isDefault: false,
    priority: 1,
  };

  console.log("Final criteria data for Prisma:", criteriaData);

  try {
    const criteria = await prisma.promotionCriteria.create({
      data: criteriaData,
      include: {
        creator: { select: { name: true, email: true } }
      }
    });
    return NextResponse.json(criteria);
  } catch (error) {
    console.error("Prisma error creating criteria:", error);
    throw error;
  }
}

// Helper function to create class progression
async function createClassProgression(schoolId: string, data: any) {
  const progression = await prisma.classProgression.create({
    data: {
      schoolId,
      fromClass: data.fromClass,
      toClass: data.toClass,
      fromGrade: data.fromGrade,
      toGrade: data.toGrade,
      order: data.order,
      requireCriteria: data.requireCriteria,
      criteriaId: data.criteriaId,
      allowManualOverride: data.allowManualOverride,
      fromAcademicYear: data.fromAcademicYear,
      toAcademicYear: data.toAcademicYear,
      createdBy: data.createdBy,
    },
  });
  return NextResponse.json(progression);
}

// Helper function to execute bulk promotion
async function executeBulkPromotion(schoolId: string, data: any) {
  if (!data || typeof data !== 'object' || !('fromClass' in data) || !('toClass' in data) || !data.fromClass || !data.toClass) {
    return NextResponse.json({ error: 'fromClass and toClass are required for class-by-class promotion.' }, { status: 400 });
  }
  const {
    fromClass,
    toClass,
    studentIds,
    excludedStudents = [],
    promotedBy,
    notes,
    criteriaId,
    manualOverride = false,
    overrideReason,
  } = data;

  const currentYear = new Date().getFullYear().toString();
  const nextYear = (parseInt(currentYear) + 1).toString();

  const result = await prisma.$transaction(async (tx) => {
    const promotionLogs = [];

    for (const studentId of studentIds) {
      const student = await tx.student.findUnique({
        where: { id: studentId },
        include: {
          class: { include: { grade: true } },
        },
      });

      if (!student) continue;

      // Get target class
      const targetClass = await tx.class.findFirst({
        where: { name: toClass, schoolId: schoolId, isActive: true },
      });

      if (!targetClass) {
        throw new Error(`Target class ${toClass} not found`);
      }

      // Update student class
      await tx.student.update({
        where: { id: studentId },
        data: {
          classId: targetClass.id,
        },
      });

      // Get grade information for the student's current class
      let fromGrade = '';
      if (student.classId) {
        const studentClass = await tx.class.findUnique({
          where: { id: student.classId },
          include: { grade: true }
        });
        fromGrade = studentClass?.grade?.name || '';
      }

      // Get grade information for the target class
      const targetClassWithGrade = await tx.class.findUnique({
        where: { id: targetClass.id },
        include: { grade: true }
      });

      // Create promotion log
      const promotionLog = await tx.promotionLog.create({
        data: {
          studentId,
          fromClass,
          toClass,
          fromGrade,
          toGrade: targetClassWithGrade?.grade?.name || '',
          fromYear: currentYear,
          toYear: nextYear,
          promotedBy,
          criteriaResults: { type: 'bulk_promotion' },
          appliedCriteriaId: criteriaId,
          manualOverride,
          overrideReason,
          notes,
          promotionType: 'bulk',
        },
      });

      promotionLogs.push(promotionLog);
    }

    // Handle exclusions
    if (excludedStudents.length > 0) {
      const logId = promotionLogs[0]?.id;
      if (logId) {
        for (const exclusion of excludedStudents) {
          await tx.promotionExclusion.create({
            data: {
              promotionLogId: logId,
              studentId: exclusion.studentId,
              reason: exclusion.reason,
              detailedReason: exclusion.detailedReason,
              criteriaFailed: exclusion.criteriaFailed,
              excludedBy: promotedBy,
            },
          });
        }
      }
    }

    return {
      success: true,
      promotedCount: studentIds.length,
      excludedCount: excludedStudents.length,
    };
  });

  return NextResponse.json(result);
}
