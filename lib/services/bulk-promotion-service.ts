import { PrismaClient } from '@prisma/client';
import { calculateStudentOutstanding } from '@/lib/utils/fee-balance';
import { ensureSchoolGrades } from '../school-grade-utils';

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

// Dynamic class progression - will be built based on actual classes in the school
const ELIGIBLE_GRADES = ['Grade 1A', 'Grade 1B', 'Grade 2A', 'Grade 2B', 'Grade 3A', 'Grade 3B', 'Grade 3C', 'Grade 4A', 'Grade 4B', 'Grade 4C', 'Grade 5A', 'Grade 5B', 'Grade 6A', 'Grade 6B'];

/**
 * Find the next class for promotion based on dynamic class progression
 */
async function findNextClassForPromotion(
  schoolId: string, 
  currentClassName: string, 
  nextAcademicYear: string
): Promise<{ nextGrade: any; nextClass: any } | null> {
  console.log(`🔍 Finding next class for: ${currentClassName} in year: ${nextAcademicYear}`);
  
  // Get all active classes in the school
  const allClasses = await prisma.class.findMany({
    where: {
      schoolId,
      isActive: true
    },
    include: {
      grade: true
    },
    orderBy: {
      name: 'asc'
    }
  });
  
  console.log(`📚 Available classes in school: ${allClasses.map(c => c.name).join(', ')}`);
  
  // Find the current class
  const currentClass = allClasses.find(c => c.name === currentClassName);
  if (!currentClass) {
    console.log(`❌ Current class ${currentClassName} not found in school`);
    return null;
  }
  
  // Extract grade level and section from class name (e.g., "Grade 1A" -> grade: 1, section: "A")
  const classMatch = currentClassName.match(/Grade\s+(\d+)([A-Z])/);
  if (!classMatch) {
    console.log(`❌ Cannot parse class name format: ${currentClassName}`);
    return null;
  }
  
  const currentGradeLevel = parseInt(classMatch[1]);
  const currentSection = classMatch[2];
  
  console.log(`📊 Current class breakdown: Grade ${currentGradeLevel}, Section ${currentSection}`);
  
  // Check if this is Grade 6 (highest level) - promote to Alumni
  if (currentGradeLevel === 6) {
    console.log(`🎓 Student is in Grade 6 (${currentClassName}) - promoting to Alumni`);
    
    // Find or create Alumni grade
    let alumniGrade = await prisma.grade.findFirst({
      where: {
        OR: [
          { name: 'Alumni', schoolId: schoolId },
          { name: 'Alumni', schoolId: null }
        ]
      }
    });
    
    if (!alumniGrade) {
      console.log(`➕ Creating Alumni grade`);
      alumniGrade = await prisma.grade.create({
        data: {
          name: 'Alumni',
          schoolId: schoolId,
          isAlumni: true
        }
      });
    }
    
    return { 
      nextGrade: alumniGrade, 
      nextClass: null // Alumni doesn't have a class, just a grade
    };
  }
  
  // Calculate next grade level
  const nextGradeLevel = currentGradeLevel + 1;
  const nextClassName = `Grade ${nextGradeLevel}${currentSection}`;
  
  console.log(`🔄 Looking for next class: ${nextClassName}`);
  
  // Find the next class
  const nextClass = allClasses.find(c => c.name === nextClassName);
  
  if (nextClass) {
    console.log(`✅ Found next class: ${nextClass.name} (Grade: ${nextClass.grade.name})`);
    return { nextGrade: nextClass.grade, nextClass };
  }
  
  // Next class doesn't exist - check if we should create it
  console.log(`❌ Next class ${nextClassName} not found`);
  
  // Find the grade for the next level
  const nextGrade = await prisma.grade.findFirst({
    where: {
      OR: [
        { name: `Grade ${nextGradeLevel}`, schoolId: schoolId },
        { name: `Grade ${nextGradeLevel}`, schoolId: null }
      ]
    }
  });
  
  if (!nextGrade) {
    console.log(`❌ Grade ${nextGradeLevel} not found - cannot create next class`);
    return null;
  }
  
  console.log(`💡 Next class ${nextClassName} doesn't exist but grade ${nextGrade.name} is available`);
  console.log(`💡 To fix this, create a class named "${nextClassName}" in the school`);
  return null;
}

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
        class: {
          include: { grade: true }
        },
        user: true
      }
    });

    if (!student || !student.class || !student.class.grade) return 0;

    // Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { schoolId: student.schoolId, isCurrent: true }
    });
    if (!currentAcademicYear) return 0;

    // Fetch only active fee structures for the student's grade and current year (by year name)
    let feeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class.gradeId,
        isActive: true,
        year: parseInt(currentAcademicYear.name)
      },
      include: { grade: true }
    });

    // Deduplicate by term, keeping only one per term
    const feeStructuresByTerm = new Map();
    for (const fs of feeStructures) {
      if (!feeStructuresByTerm.has(fs.term)) {
        feeStructuresByTerm.set(fs.term, fs);
      }
    }
    const finalFeeStructures = Array.from(feeStructuresByTerm.values());

    // Get all payments for the student in the current academic year
    const payments = await prisma.payment.findMany({
      where: {
        studentId: student.id,
        academicYearId: currentAcademicYear.id
      },
      orderBy: { paymentDate: 'asc' },
      include: {
        academicYear: true,
        term: true
      }
    });

    // Use the same outstanding calculation as the parent dashboard
    const { outstandingBalance } = await calculateStudentOutstanding({
      student,
      feeStructures: finalFeeStructures,
      payments,
      joinAcademicYearId: student.joinedAcademicYearId || undefined,
      joinTermId: student.joinedTermId || undefined,
      joinDate: student.dateAdmitted ? new Date(student.dateAdmitted) : undefined,
      filterAcademicYear: parseInt(currentAcademicYear.name)
    });

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
  console.log(`🔍 Checking eligibility for student ${studentId}`);
  
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
    console.log(`❌ Student or class not found for ${studentId}`);
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

  const currentClass = student.class.name; // Use class name for dynamic progression
  console.log(`📚 Student ${student.user.name} is in class: ${currentClass}`);
  console.log(`📋 Eligible classes: ${ELIGIBLE_GRADES.join(', ')}`);
  
  // Check if student is in eligible class for promotion
  if (!ELIGIBLE_GRADES.includes(currentClass)) {
    console.log(`❌ Class ${currentClass} is not eligible for promotion`);
    return {
      studentId,
      studentName: student.user.name,
      currentClass: student.class.name,
      currentGrade: student.class.grade.name,
      averageGrade: 0,
      feeBalance: 0,
      disciplinaryCases: 0,
      isEligible: false,
      reason: `Class ${currentClass} is not eligible for promotion`,
      userId: student.userId,
      admissionNumber: student.admissionNumber
    };
  }

  // Special handling for Grade 6 students - they should be promoted to Alumni regardless of fees
  const isGrade6Student = currentClass.startsWith('Grade 6');
  if (isGrade6Student) {
    console.log(`🎓 Grade 6 student detected: ${student.user.name} - will be promoted to Alumni`);
  }

  // Calculate criteria values
  const averageGrade = await calculateStudentGrade(studentId);
  const feeBalance = await getStudentFeeBalance(studentId);
  const disciplinaryCases = await getDisciplinaryCases(studentId);

  console.log(`📊 Student ${student.user.name} criteria: Grade=${averageGrade}%, Fee=${feeBalance}, Cases=${disciplinaryCases}`);
  console.log(`📋 Required criteria: Grade>=${criteria.minGrade}%, Fee<=${criteria.maxFeeBalance}, Cases<=${criteria.maxDisciplinaryCases}`);

  // Check eligibility based on criteria
  const gradeEligible = averageGrade >= criteria.minGrade;
  const feeEligible = feeBalance <= criteria.maxFeeBalance;
  const disciplineEligible = disciplinaryCases <= criteria.maxDisciplinaryCases;

  // Grade 6 students can be promoted to Alumni regardless of fees
  const isEligible = isGrade6Student ? 
    (gradeEligible && disciplineEligible) : // Grade 6: ignore fees, check grade and discipline
    (gradeEligible && feeEligible && disciplineEligible); // Other grades: check all criteria

  let reason = '';
  if (!isEligible) {
    const reasons = [];
    if (!gradeEligible) reasons.push(`Grade ${averageGrade}% below minimum ${criteria.minGrade}%`);
    if (!feeEligible && !isGrade6Student) reasons.push(`Fee balance $${feeBalance} exceeds maximum $${criteria.maxFeeBalance}`);
    if (!disciplineEligible) reasons.push(`${disciplinaryCases} disciplinary cases exceed maximum ${criteria.maxDisciplinaryCases}`);
    reason = reasons.join(', ');
    console.log(`❌ Student ${student.user.name} is ineligible: ${reason}`);
  } else {
    if (isGrade6Student) {
      console.log(`✅ Grade 6 student ${student.user.name} is eligible for Alumni promotion (fees waived)`);
    } else {
      console.log(`✅ Student ${student.user.name} is eligible for promotion`);
    }
  }

  return {
    studentId,
    studentName: student.user.name,
    currentClass: student.class.name,
    currentGrade: student.class.grade.name,
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
  // Note: Since classes are now permanent, we don't filter by academic year
  // Students can be promoted regardless of the academic year
  if (academicYearId) {
    console.log('⚠️ Academic year filtering disabled - classes are now permanent');
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

        const currentClass = student.class.name;
        
        // Get the next academic year from the school's academic years
        const allAcademicYears = await prisma.academicYear.findMany({
          where: { schoolId: school.id },
          orderBy: { name: 'asc' }
        });
        
        // Find the current academic year
        const currentAcademicYear = allAcademicYears.find(ay => ay.isCurrent);
        if (!currentAcademicYear) {
          excluded.push({
            ...eligibility,
            isEligible: false,
            reason: 'Current academic year not found'
          });
          continue;
        }
        
        // Find the next academic year in the sequence
        const currentYearIndex = allAcademicYears.findIndex(ay => ay.id === currentAcademicYear.id);
        const nextAcademicYear = allAcademicYears[currentYearIndex + 1];
        
        if (!nextAcademicYear) {
          excluded.push({
            ...eligibility,
            isEligible: false,
            reason: `No next academic year found after ${currentAcademicYear.name}`
          });
          continue;
        }

        // Use dynamic class-based progression system
        const nextClassResult = await findNextClassForPromotion(
          school.id, 
          currentClass, 
          nextAcademicYear.name
        );

        if (!nextClassResult) {
          excluded.push({
            ...eligibility,
            isEligible: false,
            reason: `No next class found for class ${currentClass}`
          });
          continue;
        }

        const { nextGrade, nextClass } = nextClassResult;

        // Update student's class (or remove class if promoted to Alumni)
        const updateData: any = {};
        if (nextClass) {
          updateData.classId = nextClass.id;
        } else {
          // Student promoted to Alumni - remove class assignment and mark as graduated
          updateData.classId = null;
          updateData.isActive = false;
          updateData.status = 'graduated';
        }
        
        await prisma.student.update({
          where: { id: studentId },
          data: updateData
        });

        // If student is promoted to Alumni, create Alumni record
        if (!nextClass && nextGrade.name === 'Alumni') {
          console.log(`🎓 Creating Alumni record for ${student.user.name}`);
          
          // Calculate final grade (using the eligibility grade for now)
          const finalGrade = eligibility.averageGrade >= 80 ? 'A' : 
                            eligibility.averageGrade >= 70 ? 'B' : 
                            eligibility.averageGrade >= 60 ? 'C' : 
                            eligibility.averageGrade >= 50 ? 'D' : 'F';
          
          // Create Alumni record
          await prisma.alumni.create({
            data: {
              schoolId: school.id,
              studentId: studentId,
              graduationYear: nextAcademicYear.name,
              finalGrade: finalGrade,
              achievements: [],
              contactEmail: student.parentEmail || null,
              contactPhone: student.parentPhone || null,
              currentInstitution: null,
              currentOccupation: null
            }
          });
          
          console.log(`✅ Alumni record created for ${student.user.name} (Grade: ${finalGrade})`);
        }

        // Find or create a system user for automated promotions
        let systemUser = await prisma.user.findFirst({
          where: {
            email: 'system@school.com',
            role: 'admin'
          }
        });

        if (!systemUser) {
          console.log('➕ Creating system user for automated promotions');
          systemUser = await prisma.user.create({
            data: {
              name: 'System Administrator',
              email: 'system@school.com',
              password: 'system-generated-password',
              role: 'admin',
              isActive: true
            }
          });
        }

        // Create promotion log
        await prisma.promotionLog.create({
          data: {
            studentId,
            fromClass: student.class.name,
            toClass: nextClass?.name || 'Alumni',
            fromGrade: student.class.grade.name,
            toGrade: nextGrade.name,
            fromYear: currentAcademicYear.name,
            toYear: nextAcademicYear.name,
            promotedBy: systemUser.id,
            promotionType: 'bulk',
            criteriaResults: {
              minGrade: criteria.minGrade,
              maxFeeBalance: criteria.maxFeeBalance,
              maxDisciplinaryCases: criteria.maxDisciplinaryCases,
              studentGrade: eligibility.averageGrade,
              studentFeeBalance: eligibility.feeBalance,
              studentDisciplinaryCases: eligibility.disciplinaryCases,
              academicYearProgression: `${currentAcademicYear.name} → ${nextAcademicYear.name}`
            },
            averageGrade: eligibility.averageGrade,
            outstandingBalance: eligibility.feeBalance,
            disciplinaryCases: eligibility.disciplinaryCases
          }
        });

        console.log(`✅ Promoted ${student.user.name} from ${student.class.name} (${currentAcademicYear.name}) to ${nextClass?.name || 'Alumni'} (${nextAcademicYear.name})`);

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