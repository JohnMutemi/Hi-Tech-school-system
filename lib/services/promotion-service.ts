import { PrismaClient } from '@prisma/client';
import { calculateStudentOutstanding } from "@/lib/utils/fee-balance";

const prisma = new PrismaClient();

export interface PromotionResult {
  success: boolean;
  message: string;
  promotedStudents: number;
  graduatedStudents: number;
  excludedStudents: number;
  errors: string[];
  details: {
    promotions: any[];
    graduations: any[];
    exclusions: any[];
    feeCarryForwards: any[];
  };
}

export interface StudentPromotionData {
  studentId: string;
  fromClass: string;
  toClass: string;
  fromYear: number;
  toYear: number;
  outstandingBalance: number;
  isGraduating: boolean;
  reason?: string;
}

export interface PromotionSummary {
  promoted: any[];
  excluded: { studentId: string; reason: string }[];
  errors: string[];
  log: any[];
}

export class PromotionService {
  /**
   * Get all students eligible for promotion (excluding Alumni)
   */
  static async getEligibleStudents(schoolId: string, currentYear: number): Promise<any[]> {
    try {
      // Get all students from all classes except Alumni
      const students = await prisma.student.findMany({
        where: {
          schoolId,
          isActive: true,
          class: {
            grade: {
              isAlumni: false
            }
          }
        },
        include: {
          user: true,
          class: {
            include: {
              grade: true,
              teacher: true
            }
          },
          payments: {
            where: {
              academicYear: {
                name: String(currentYear)
              }
            }
          }
        }
      });
      console.log('PromotionService.getEligibleStudents: Found', students.length, 'students');
      return students;
    } catch (error) {
      console.error('Error getting eligible students:', error);
      throw error;
    }
  }

  /**
   * Get final promotion list with validation
   */
  static async getFinalPromotionList(
    schoolId: string, 
    currentYear: number, 
    selectedStudentIds: string[]
  ): Promise<StudentPromotionData[]> {
    try {
      const students = await this.getEligibleStudents(schoolId, currentYear);
      console.log('PromotionService.getFinalPromotionList: Filtering for', selectedStudentIds.length, 'selected students');
      const promotionList: StudentPromotionData[] = [];

      for (const student of students) {
        if (!selectedStudentIds.includes(student.id)) continue;

        const currentClass = student.class;
        if (!currentClass) {
          promotionList.push({
            studentId: student.id,
            fromClass: 'Unassigned',
            toClass: 'Unassigned',
            fromYear: currentYear,
            toYear: currentYear + 1,
            outstandingBalance: 0,
            isGraduating: false,
            reason: 'No class assigned'
          });
          continue;
        }

        const currentGrade = currentClass.grade;
        const outstandingBalance = await this.calculateOutstandingBalance(student.id, currentYear.toString());
        
        // Check if student is graduating to Alumni (Grade 6)
        const isGraduating = currentGrade.name === 'Grade 6';
        
        if (isGraduating) {
          // Graduate to Alumni
          promotionList.push({
            studentId: student.id,
            fromClass: currentClass.name,
            toClass: 'Alumni',
            fromYear: currentYear,
            toYear: currentYear + 1,
            outstandingBalance,
            isGraduating: true
          });
        } else {
          // Regular promotion to next class
          const nextClass = await this.getNextClass(schoolId, currentClass.name);
          if (nextClass) {
            promotionList.push({
              studentId: student.id,
              fromClass: currentClass.name,
              toClass: nextClass.name,
              fromYear: currentYear,
              toYear: currentYear + 1,
              outstandingBalance,
              isGraduating: false
            });
          } else {
            promotionList.push({
              studentId: student.id,
              fromClass: currentClass.name,
              toClass: '', // Changed from 'No Next Class' to ''
              fromYear: currentYear,
              toYear: currentYear + 1,
              outstandingBalance,
              isGraduating: false,
              reason: 'No next class configured'
            });
          }
        }
      }
      console.log('PromotionService.getFinalPromotionList: promotionList', promotionList);
      return promotionList;
    } catch (error) {
      console.error('Error getting final promotion list:', error);
      throw error;
    }
  }

  /**
   * Calculate outstanding balance for a student in a given year
   */
  private static async calculateOutstandingBalance(studentId: string, academicYear: string): Promise<number> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            grade: true
          }
        }
      }
    });

    if (!student?.class?.grade) return 0;

    // Get fee structures for the student's grade and year
    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class.grade.id,
        year: Number(academicYear), // Ensure year is a number
        isActive: true
      }
    });

    // Get all payments for the year
    const payments = await prisma.payment.findMany({
      where: {
        studentId,
        academicYear: {
          name: String(academicYear) // Filter by AcademicYear's name field
        },
        paymentMethod: { not: 'CARRY_FORWARD' } // Exclude carry-forward entries
      }
    });

    // Use the running balance utility for accurate outstanding (handles overpayments/credits)
    const { outstandingBalance } = await calculateStudentOutstanding({
      student,
      feeStructures,
      payments,
      filterAcademicYear: Number(academicYear),
    });
    return outstandingBalance;
  }

  /**
   * Get next class based on progression rules
   */
  private static async getNextClass(schoolId: string, currentClassName: string): Promise<any> {
    const progression = await prisma.classProgression.findFirst({
      where: {
        schoolId,
        fromClass: currentClassName,
        isActive: true
      }
    });

    if (!progression) return null;

    return await prisma.class.findFirst({
      where: {
        name: progression.toClass,
        schoolId,
        isActive: true
      }
    });
  }

  /**
   * Validate that all target classes exist
   */
  private static async validatePromotionTargets(schoolId: string, promotionList: StudentPromotionData[]): Promise<string[]> {
    const errors: string[] = [];
    const targetClasses = [...new Set(promotionList.map(p => p.toClass).filter(c => c !== 'Alumni' && c !== 'No Next Class'))];

    for (const className of targetClasses) {
      const exists = await prisma.class.findFirst({
        where: {
          name: className,
          schoolId,
          isActive: true
        }
      });

      if (!exists) {
        errors.push(`Target class "${className}" does not exist`);
      }
    }

    return errors;
  }

  /**
   * Get or create Alumni class
   */
  private static async getOrCreateAlumniClass(tx: any, schoolId: string): Promise<any> {
    // First try to find existing Alumni grade
    let alumniGrade = await tx.grade.findFirst({
      where: {
        schoolId,
        isAlumni: true
      }
    });

    if (!alumniGrade) {
      // Create Alumni grade
      alumniGrade = await tx.grade.create({
        data: {
          name: 'Alumni',
          schoolId,
          isAlumni: true
        }
      });
    }

    // Find or create Alumni class
    let alumniClass = await tx.class.findFirst({
      where: {
        gradeId: alumniGrade.id,
        schoolId,
        isActive: true
      }
    });

    if (!alumniClass) {
      alumniClass = await tx.class.create({
        data: {
          name: 'Alumni',
          gradeId: alumniGrade.id,
          schoolId,
          academicYear: new Date().getFullYear().toString(),
          isActive: true
        }
      });
    }

    return alumniClass;
  }

  /**
   * Create fee carry-forward entry
   */
  private static async createFeeCarryForward(
    tx: any, 
    studentId: string, 
    fromYear: number, 
    toYear: number, 
    amount: number
  ): Promise<any> {
    return await tx.payment.create({
      data: {
        studentId,
        amount: Math.abs(amount), // Always positive for carry-forward
        paymentDate: new Date(),
        paymentMethod: 'CARRY_FORWARD',
        referenceNumber: `CF-${fromYear}-${toYear}`,
        receiptNumber: `CF-${studentId}-${Date.now()}`,
        description: amount > 0 ? 
          `Fee Balance Carried Forward from ${fromYear} to ${toYear}` :
          `Overpayment Credit Carried Forward from ${fromYear} to ${toYear}`,
        receivedBy: 'System',
        term: 'CARRY_FORWARD',
        academicYear: toYear.toString()
      }
    });
  }

  /**
   * Create StudentYearlyBalance record
   */
  private static async createStudentYearlyBalanceRecord(
    tx: any,
    studentId: string,
    academicYear: number,
    closingBalance: number
  ): Promise<any> {
    return await tx.studentYearlyBalance.upsert({
      where: {
        studentId_academicYear: {
          studentId,
          academicYear
        }
      },
      update: {
        closingBalance,
        updatedAt: new Date()
      },
      create: {
        studentId,
        academicYear,
        closingBalance,
        isCarriedForward: true
      }
    });
  }

  /**
   * Fetch the active promotion criteria for a given class
   */
  static async getActiveCriteriaForClass(schoolId: string, className: string): Promise<any[]> {
    console.log(`Getting criteria for class: ${className}, school: ${schoolId}`);
    // Try to find progression rule for this class
    const progression = await prisma.classProgression.findFirst({
      where: { schoolId, fromClass: className, isActive: true },
      orderBy: { order: 'asc' }, // Use 'order' field for ordering
    });
    console.log(`Progression found:`, progression);
    let criteria = [];
    if (progression?.criteriaId) {
      const crit = await prisma.promotionCriteria.findUnique({ where: { id: progression.criteriaId } });
      console.log(`Criteria from progression:`, crit);
      if (crit && crit.customCriteria) criteria = crit.customCriteria as any[];
    } else {
      // Fallback: find highest priority active criteria for this class level
      const classObj = await prisma.class.findFirst({ where: { schoolId, name: className, isActive: true }, include: { grade: true } });
      console.log(`Class object:`, classObj);
      if (classObj?.grade?.name) {
        const crit = await prisma.promotionCriteria.findFirst({
          where: { schoolId, classLevel: classObj.grade.name, isActive: true },
          orderBy: { priority: 'asc' },
        });
        console.log(`Criteria from class level:`, crit);
        if (crit && crit.customCriteria) criteria = crit.customCriteria as any[];
      }
    }
    console.log(`Final criteria array:`, criteria);
    return criteria;
  }

  /**
   * Check if a student meets all criteria, return all failed reasons
   */
  static async checkStudentEligibilityWithReasons(student: any, criteria: any[]): Promise<{ eligible: boolean; failed: string[] }> {
    console.log(`Checking eligibility for student: ${student.id}, criteria count: ${criteria.length}`);
    const failed: string[] = [];
    for (const crit of criteria) {
      console.log(`Checking criteria:`, crit);
      if (crit.type === 'fee_balance') {
        // Use running balance logic for fee balance
        const balance = await this.calculateOutstandingBalance(student.id, student.academicYear || new Date().getFullYear());
        console.log(`Student ${student.id} balance: ${balance}, limit: ${crit.limit}`);
        if (balance > crit.limit) {
          failed.push(`Fee balance (${balance}) exceeds limit (${crit.limit})`);
        }
      }
      // Add more criteria types here as needed
    }
    console.log(`Student ${student.id} eligibility result:`, { eligible: failed.length === 0, failed });
    return { eligible: failed.length === 0, failed };
  }

  /**
   * Promote students from one class to another (class-by-class, criteria-driven)
   */
  static async promoteClassStudents(schoolId: string, fromClass: string, toClass: string, studentIds: string[], promotedBy: string): Promise<PromotionSummary> {
    const summary: PromotionSummary = { promoted: [], excluded: [], errors: [], log: [] };
    try {
      const students = await prisma.student.findMany({
        where: { schoolId, class: { name: fromClass }, isActive: true },
        include: { user: true, class: { include: { grade: true } } }
      });
      const criteria = await this.getActiveCriteriaForClass(schoolId, fromClass);
      const toClassObj = await prisma.class.findFirst({ where: { schoolId, name: toClass, isActive: true } });
      if (!toClassObj) {
        summary.errors.push(`Target class ${toClass} not found.`);
        return summary;
      }
      for (const student of students) {
        if (!studentIds.includes(student.id)) continue;
        const eligibility = await this.checkStudentEligibilityWithReasons(student, criteria);
        summary.log.push({ studentId: student.id, eligibility });
        if (!eligibility.eligible) {
          summary.excluded.push({ studentId: student.id, reason: eligibility.failed.join('; ') });
          continue;
        }
        // Promote student
        try {
          await prisma.student.update({ where: { id: student.id }, data: { classId: toClassObj.id } });
          summary.promoted.push(student.id);
        } catch (err: any) {
          summary.errors.push(`Failed to promote ${student.id}: ${err.message}`);
        }
      }
    } catch (err: any) {
      summary.errors.push(`General error: ${err.message}`);
    }
    return summary;
  }

  /**
   * Promote all eligible students in the school (school-wide, criteria-driven)
   */
  static async promoteSchoolWide(schoolId: string, promotedBy: string): Promise<PromotionSummary> {
    const summary: PromotionSummary = { promoted: [], excluded: [], errors: [], log: [] };
    try {
      const students = await prisma.student.findMany({
        where: { schoolId, isActive: true, class: { grade: { isAlumni: false } } },
        include: { user: true, class: { include: { grade: true } } }
      });
      for (const student of students) {
        const currentClass = student.class;
        if (!currentClass) {
          summary.excluded.push({ studentId: student.id, reason: 'No current class' });
          continue;
        }
        // Use ClassProgression to find next class
        const progression = await prisma.classProgression.findFirst({ where: { schoolId, fromClass: currentClass.name, isActive: true } });
        if (!progression) {
          summary.excluded.push({ studentId: student.id, reason: 'No progression rule found' });
          continue;
        }
        const toClassObj = await prisma.class.findFirst({ where: { schoolId, name: progression.toClass, isActive: true } });
        if (!toClassObj) {
          summary.excluded.push({ studentId: student.id, reason: 'Next class not found' });
          continue;
        }
        // Fetch criteria for this class
        const criteria = await this.getActiveCriteriaForClass(schoolId, currentClass.name);
        const eligibility = await this.checkStudentEligibilityWithReasons(student, criteria);
        summary.log.push({ studentId: student.id, eligibility });
        if (!eligibility.eligible) {
          summary.excluded.push({ studentId: student.id, reason: eligibility.failed.join('; ') });
          continue;
        }
        // Promote student
        try {
          await prisma.student.update({ where: { id: student.id }, data: { classId: toClassObj.id } });
          summary.promoted.push(student.id);
        } catch (err: any) {
          summary.errors.push(`Failed to promote ${student.id}: ${err.message}`);
        }
      }
    } catch (err: any) {
      summary.errors.push(`General error: ${err.message}`);
    }
    return summary;
  }

  /**
   * Bulk promote an arbitrary list of students to their specified target classes
   */
  static async bulkPromoteStudents(
    schoolId: string,
    students: Array<{
      studentId: string;
      fromClass: string;
      toClass: string;
      manualOverride?: boolean;
      overrideReason?: string;
      notes?: string;
      criteriaId?: string;
    }>,
    promotedBy: string
  ) {
    const summary = { promoted: [], excluded: [], errors: [], log: [] };
    try {
      for (const s of students) {
        try {
          // Validate fromClass and toClass
          const fromClassObj = await prisma.class.findFirst({ where: { schoolId, name: s.fromClass, isActive: true } });
          if (!fromClassObj) {
            const allClasses = await prisma.class.findMany({ where: { schoolId, isActive: true } });
            console.error(`From class "${s.fromClass}" not found. Available classes:`, allClasses.map(c => c.name));
            summary.excluded.push({ studentId: s.studentId, reason: `From class ${s.fromClass} not found` });
            continue;
          }
          const toClassObj = await prisma.class.findFirst({ where: { schoolId, name: s.toClass, isActive: true } });
          if (!toClassObj && s.toClass !== 'Alumni') {
            const allClasses = await prisma.class.findMany({ where: { schoolId, isActive: true } });
            console.error(`To class "${s.toClass}" not found. Available classes:`, allClasses.map(c => c.name));
            summary.excluded.push({ studentId: s.studentId, reason: `To class ${s.toClass} not found` });
            continue;
          }
          // If toClass is Alumni, handle graduation logic (optional: implement as needed)
          let targetClassId = toClassObj?.id;
          if (s.toClass === 'Alumni') {
            // Find or create Alumni class
            const alumniClass = await this.getOrCreateAlumniClass(prisma, schoolId);
            targetClassId = alumniClass.id;
          }
          // Update student class
          await prisma.student.update({ where: { id: s.studentId }, data: { classId: targetClassId } });
          // Log promotion
          await prisma.promotionLog.create({
            data: {
              studentId: s.studentId,
              fromClass: s.fromClass,
              toClass: s.toClass,
              fromGrade: fromClassObj.gradeId,
              toGrade: toClassObj?.gradeId || null,
              fromYear: new Date().getFullYear().toString(),
              toYear: (new Date().getFullYear() + 1).toString(),
              promotedBy,
              criteriaResults: { type: 'bulk_promotion' },
              appliedCriteriaId: s.criteriaId,
              manualOverride: !!s.manualOverride,
              overrideReason: s.overrideReason,
              notes: s.notes,
              promotionType: 'bulk',
            },
          });
          summary.promoted.push(s.studentId);
        } catch (err: any) {
          summary.errors.push(`Failed to promote ${s.studentId}: ${err.message}`);
        }
      }
    } catch (err: any) {
      summary.errors.push(`General error: ${err.message}`);
    }
    return summary;
  }
} 