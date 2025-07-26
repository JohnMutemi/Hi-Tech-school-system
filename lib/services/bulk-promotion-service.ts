import { PrismaClient } from '@prisma/client';
import { calculateStudentOutstanding } from '@/lib/utils/fee-balance';

const prisma = new PrismaClient();

export interface BulkPromotionCriteria {
  minGrade: number;
  maxFeeBalance: number;
  maxDisciplinaryCases: number;
}

export interface StudentEligibility {
  studentId: string;
  studentName: string;
  currentClass: string;
  currentGrade: string;
  averageGrade: number;
  feeBalance: number;
  disciplinaryCases: number;
  isEligible: boolean;
  reason?: string;
  userId: string;
  admissionNumber: string;
}

export interface BulkPromotionResult {
  promoted: StudentEligibility[];
  excluded: StudentEligibility[];
  summary: {
    totalStudents: number;
    promoted: number;
    excluded: number;
  };
}

// Grade progression rules
const PROGRESSION_RULES: Record<string, string> = {
  '1A': '2A',
  '2A': '3A', 
  '3A': '4A',
  '4A': '5A',
  '5A': '6A',
  '6A': 'Alumni'
};

const ELIGIBLE_GRADES = ['1A', '2A', '3A', '4A', '5A', '6A', 'Grade 1A', 'Grade 2A', 'Grade 3A', 'Grade 4A', 'Grade 5A', 'Grade 6A'];

/**
 * Calculate student's average grade (placeholder - can be enhanced later)
 */
async function calculateStudentGrade(studentId: string): Promise<number> {
  // TODO: Implement actual grade calculation from student records
  // For now, return a pass grade (75) - can be enhanced later
  return 75; // Default pass grade
}

/**
 * Get student's fee balance using existing utility
 */
async function getStudentFeeBalance(studentId: string): Promise<number> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        school: true,
        class: true,
        user: true
      }
    });

    if (!student) return 0;

    // Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { 
        schoolId: student.schoolId,
        isCurrent: true 
      }
    });

    if (!currentAcademicYear) {
      console.log('⚠️ No current academic year found for school:', student.schoolId);
      return 0;
    }

    console.log(`🔍 Calculating fee balance for student ${student.user.name} in academic year: ${currentAcademicYear.name}`);

    // Get fee structures for the current academic year
    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: { 
        schoolId: student.schoolId,
        academicYearId: currentAcademicYear.id
      },
      include: {
        academicYear: true
      }
    });

    console.log(`📊 Found ${feeStructures.length} fee structures for current academic year`);

    // Get payments for the student in current academic year
    const payments = await prisma.payment.findMany({
      where: { 
        studentId,
        academicYearId: currentAcademicYear.id
      },
      include: {
        academicYear: true,
        term: true
      }
    });

    console.log(`💰 Found ${payments.length} payments for current academic year`);

    const { outstandingBalance } = await calculateStudentOutstanding({
      student,
      feeStructures,
      payments,
      joinAcademicYearId: student.joinedAcademicYearId || undefined,
      joinTermId: student.joinedTermId || undefined
    });

    console.log(`💵 Student ${student.user.name} outstanding balance: $${outstandingBalance}`);
    return outstandingBalance;
  } catch (error) {
    console.error('❌ Error calculating fee balance:', error);
    return 0;
  }
}

/**
 * Get student's disciplinary cases (placeholder - can be enhanced later)
 */
async function getDisciplinaryCases(studentId: string): Promise<number> {
  // TODO: Implement actual disciplinary case counting
  // For now, return 0 (no disciplinary cases)
  return 0;
}

/**
 * Calculate eligibility for a single student
 */
export async function calculateStudentEligibility(
  studentId: string, 
  criteria: BulkPromotionCriteria
): Promise<StudentEligibility> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      class: {
        include: {
          grade: true
        }
      }
    }
  });

  if (!student || !student.class) {
    return {
      studentId,
      studentName: 'Unknown',
      currentClass: 'Unknown',
      currentGrade: 'Unknown',
      averageGrade: 0,
      feeBalance: 0,
      disciplinaryCases: 0,
      isEligible: false,
      reason: 'Student or class not found',
      userId: '',
      admissionNumber: ''
    };
  }

  const currentGrade = student.class.name; // Use class name instead of grade name
  
  // Check if student is in eligible grade for promotion
  if (!ELIGIBLE_GRADES.includes(currentGrade)) {
    return {
      studentId,
      studentName: student.user.name,
      currentClass: student.class.name,
      currentGrade,
      averageGrade: 0,
      feeBalance: 0,
      disciplinaryCases: 0,
      isEligible: false,
      reason: `Grade ${currentGrade} is not eligible for promotion`,
      userId: student.userId,
      admissionNumber: student.admissionNumber
    };
  }

  // Calculate criteria values
  const averageGrade = await calculateStudentGrade(studentId);
  const feeBalance = await getStudentFeeBalance(studentId);
  const disciplinaryCases = await getDisciplinaryCases(studentId);

  // Check eligibility based on criteria
  const gradeEligible = averageGrade >= criteria.minGrade;
  const feeEligible = feeBalance <= criteria.maxFeeBalance;
  const disciplineEligible = disciplinaryCases <= criteria.maxDisciplinaryCases;

  const isEligible = gradeEligible && feeEligible && disciplineEligible;

  let reason = '';
  if (!isEligible) {
    const reasons = [];
    if (!gradeEligible) reasons.push(`Grade ${averageGrade}% below minimum ${criteria.minGrade}%`);
    if (!feeEligible) reasons.push(`Fee balance $${feeBalance} exceeds maximum $${criteria.maxFeeBalance}`);
    if (!disciplineEligible) reasons.push(`${disciplinaryCases} disciplinary cases exceed maximum ${criteria.maxDisciplinaryCases}`);
    reason = reasons.join(', ');
  }

  return {
    studentId,
    studentName: student.user.name,
    currentClass: student.class.name,
    currentGrade,
    averageGrade,
    feeBalance,
    disciplinaryCases,
    isEligible,
    reason,
    userId: student.userId,
    admissionNumber: student.admissionNumber
  };
}

/**
 * Get all eligible students for bulk promotion
 */
export async function getEligibleStudents(
  schoolCode: string, 
  criteria: BulkPromotionCriteria,
  academicYearId?: string
): Promise<StudentEligibility[]> {
  console.log('🔍 Getting eligible students for school:', schoolCode);
  console.log('📋 Criteria:', criteria);
  
  const school = await prisma.school.findUnique({
    where: { code: schoolCode }
  });

  if (!school) {
    console.log('❌ School not found:', schoolCode);
    throw new Error('School not found');
  }

  console.log('✅ School found:', school.name);

  // Get all students in eligible grades
  console.log('🔍 Querying students with criteria:', {
    schoolId: school.id,
    isActive: true,
    eligibleGrades: ELIGIBLE_GRADES,
    academicYearId
  });

  // Build where clause for students
  const studentWhere: any = {
    schoolId: school.id,
    isActive: true,
  };

  // If academic year is specified, filter by that academic year
  if (academicYearId) {
    studentWhere.class = {
      academicYear: {
        equals: academicYearId
      }
    };
  }

  // First, let's get ALL students to see what we have
  const allStudents = await prisma.student.findMany({
    where: studentWhere,
    include: {
      user: true,
      class: {
        include: {
          grade: true
        }
      }
    }
  });

  console.log(`📊 Found ${allStudents.length} total active students`);
  allStudents.forEach(student => {
    console.log(`   - ${student.user.name} (${student.admissionNumber}) in class: ${student.class?.name || 'No Class'}, grade: ${student.class?.grade?.name || 'No Grade'}`);
  });

  // Now filter for eligible grades - check both class name and grade name
  const students = allStudents.filter(student => {
    const className = student.class?.name;
    const gradeName = student.class?.grade?.name;
    
    console.log(`🔍 Checking student ${student.user.name}: class="${className}", grade="${gradeName}"`);
    
    return (className && ELIGIBLE_GRADES.includes(className)) || 
           (gradeName && ELIGIBLE_GRADES.includes(gradeName));
  });

  console.log(`📊 Found ${students.length} students in eligible grades`);
  console.log('📋 Eligible grades:', ELIGIBLE_GRADES);
  
  if (students.length > 0) {
    students.slice(0, 3).forEach(student => {
      console.log(`   - ${student.user.name} in ${student.class?.grade.name || 'No Grade'}`);
    });
  }

  // Calculate eligibility for each student
  console.log('🔄 Calculating eligibility for each student...');
  const eligibilityResults = await Promise.all(
    students.map(student => calculateStudentEligibility(student.id, criteria))
  );

  const eligibleCount = eligibilityResults.filter(r => r.isEligible).length;
  console.log(`✅ Eligibility calculation complete: ${eligibleCount}/${students.length} eligible`);

  return eligibilityResults;
}

/**
 * Execute bulk promotion for selected students
 */
export async function executeBulkPromotion(
  schoolCode: string,
  selectedStudents: string[],
  criteria: BulkPromotionCriteria,
  promotedBy: string
): Promise<BulkPromotionResult> {
  const school = await prisma.school.findUnique({
    where: { code: schoolCode }
  });

  if (!school) {
    throw new Error('School not found');
  }

  const promoted: StudentEligibility[] = [];
  const excluded: StudentEligibility[] = [];

  // Process each selected student
  for (const studentId of selectedStudents) {
    const eligibility = await calculateStudentEligibility(studentId, criteria);
    
    if (eligibility.isEligible) {
      try {
        // Get current student data
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: {
            user: true,
            class: {
              include: {
                grade: true
              }
            }
          }
        });

        if (!student || !student.class) {
          excluded.push({
            ...eligibility,
            isEligible: false,
            reason: 'Student or class not found'
          });
          continue;
        }

        const currentGrade = student.class.grade.name;
        const nextGrade = PROGRESSION_RULES[currentGrade];

        if (!nextGrade) {
          excluded.push({
            ...eligibility,
            isEligible: false,
            reason: `No progression rule for grade ${currentGrade}`
          });
          continue;
        }

        // Find the next grade and class
        const nextGradeRecord = await prisma.grade.findFirst({
          where: {
            schoolId: school.id,
            name: nextGrade
          }
        });

        if (!nextGradeRecord) {
          excluded.push({
            ...eligibility,
            isEligible: false,
            reason: `Next grade ${nextGrade} not found`
          });
          continue;
        }

        // Get the next academic year (current year + 1)
        const currentYear = new Date().getFullYear();
        const nextAcademicYear = await prisma.academicYear.findFirst({
          where: {
            schoolId: school.id,
            name: (currentYear + 1).toString()
          }
        });

        if (!nextAcademicYear) {
          excluded.push({
            ...eligibility,
            isEligible: false,
            reason: `Next academic year ${currentYear + 1} not found`
          });
          continue;
        }

        // Find or create the next class in the next academic year
        let nextClass = await prisma.class.findFirst({
          where: {
            schoolId: school.id,
            gradeId: nextGradeRecord.id,
            name: nextGrade,
            academicYear: nextAcademicYear.name
          }
        });

        if (!nextClass) {
          // Create the next class if it doesn't exist
          nextClass = await prisma.class.create({
            data: {
              name: nextGrade,
              schoolId: school.id,
              gradeId: nextGradeRecord.id,
              academicYear: nextAcademicYear.name,
              isActive: true
            }
          });
          console.log(`✅ Created new class: ${nextGrade} for academic year ${nextAcademicYear.name}`);
        }

        // Update student's class
        await prisma.student.update({
          where: { id: studentId },
          data: {
            classId: nextClass.id
          }
        });

        // Create promotion log
        await prisma.promotionLog.create({
          data: {
            studentId,
            fromClass: student.class.name,
            toClass: nextClass.name,
            fromGrade: currentGrade,
            toGrade: nextGrade,
            fromYear: student.class.academicYear,
            toYear: nextClass.academicYear,
            promotedBy,
            promotionType: 'bulk',
            criteriaResults: {
              minGrade: criteria.minGrade,
              maxFeeBalance: criteria.maxFeeBalance,
              maxDisciplinaryCases: criteria.maxDisciplinaryCases,
              studentGrade: eligibility.averageGrade,
              studentFeeBalance: eligibility.feeBalance,
              studentDisciplinaryCases: eligibility.disciplinaryCases,
              academicYearProgression: `${student.class.academicYear} → ${nextClass.academicYear}`
            },
            averageGrade: eligibility.averageGrade,
            outstandingBalance: eligibility.feeBalance,
            disciplinaryCases: eligibility.disciplinaryCases
          }
        });

        console.log(`✅ Promoted ${student.user.name} from ${student.class.name} (${student.class.academicYear}) to ${nextClass.name} (${nextClass.academicYear})`);

        promoted.push(eligibility);

      } catch (error) {
        console.error(`Error promoting student ${studentId}:`, error);
        excluded.push({
          ...eligibility,
          isEligible: false,
          reason: `Error during promotion: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    } else {
      excluded.push(eligibility);
    }
  }

  return {
    promoted,
    excluded,
    summary: {
      totalStudents: selectedStudents.length,
      promoted: promoted.length,
      excluded: excluded.length
    }
  };
}

/**
 * Get or create bulk promotion configuration for a school
 */
export async function getBulkPromotionConfig(schoolCode: string) {
  try {
    console.log('🔍 Getting bulk promotion config for school:', schoolCode);
    
    const school = await prisma.school.findUnique({
      where: { code: schoolCode }
    });

    if (!school) {
      console.log('❌ School not found:', schoolCode);
      throw new Error('School not found');
    }

    console.log('✅ School found:', school.name);

    let config = await prisma.promotionCriteria.findFirst({
      where: { 
        schoolId: school.id,
        promotionType: "bulk",
        isActive: true
      }
    });

    if (!config) {
      console.log('⚠️ No config found, creating default configuration...');
      // Create default configuration
      config = await prisma.promotionCriteria.create({
        data: {
          schoolId: school.id,
          name: "Default Criteria",
          description: "Standard promotion criteria",
          minGrade: 50.0,
          maxFeeBalance: 0.0,
          maxDisciplinaryCases: 0,
          isActive: true,
          promotionType: "bulk"
        }
      });
      console.log('✅ Default config created:', config);
    } else {
      console.log('✅ Existing config found:', config);
    }

    return config;
  } catch (error) {
    console.error('❌ Error in getBulkPromotionConfig:', error);
    if (error instanceof Error && error.message.includes('does not exist')) {
      throw new Error('PromotionCriteria table does not exist. Please run the database migration first.');
    }
    throw error;
  }
}

/**
 * Update bulk promotion configuration for a school
 */
export async function updateBulkPromotionConfig(
  schoolCode: string,
  criteria: BulkPromotionCriteria
) {
  const school = await prisma.school.findUnique({
    where: { code: schoolCode }
  });

  if (!school) {
    throw new Error('School not found');
  }

  // Find existing active criteria or create new one
  let config = await prisma.promotionCriteria.findFirst({
    where: { 
      schoolId: school.id,
      promotionType: "bulk",
      isActive: true
    }
  });

  if (config) {
    // Update existing criteria
    config = await prisma.promotionCriteria.update({
      where: { id: config.id },
      data: {
        minGrade: criteria.minGrade,
        maxFeeBalance: criteria.maxFeeBalance,
        maxDisciplinaryCases: criteria.maxDisciplinaryCases
      }
    });
  } else {
    // Create new criteria
    config = await prisma.promotionCriteria.create({
      data: {
        schoolId: school.id,
        name: "Default Criteria",
        description: "Standard promotion criteria",
        minGrade: criteria.minGrade,
        maxFeeBalance: criteria.maxFeeBalance,
        maxDisciplinaryCases: criteria.maxDisciplinaryCases,
        isActive: true,
        promotionType: "bulk"
      }
    });
  }

  return config;
} 