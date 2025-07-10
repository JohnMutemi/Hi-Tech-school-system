import { PrismaClient } from '@prisma/client';

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
              academicYear: currentYear
            }
          }
        }
      });

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
        const outstandingBalance = await this.calculateOutstandingBalance(student.id, currentYear);
        
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
              toClass: 'No Next Class',
              fromYear: currentYear,
              toYear: currentYear + 1,
              outstandingBalance,
              isGraduating: false,
              reason: 'No next class configured'
            });
          }
        }
      }

      return promotionList;
    } catch (error) {
      console.error('Error getting final promotion list:', error);
      throw error;
    }
  }

  /**
   * Execute bulk promotion with all the specified logic
   */
  static async executeBulkPromotion(
    schoolId: string,
    currentYear: number,
    selectedStudentIds: string[],
    promotedBy: string
  ): Promise<PromotionResult> {
    const result: PromotionResult = {
      success: false,
      message: '',
      promotedStudents: 0,
      graduatedStudents: 0,
      excludedStudents: 0,
      errors: [],
      details: {
        promotions: [],
        graduations: [],
        exclusions: [],
        feeCarryForwards: []
      }
    };

    try {
      // Get final promotion list
      const promotionList = await this.getFinalPromotionList(schoolId, currentYear, selectedStudentIds);
      
      // Validate all target classes exist
      const validationErrors = await this.validatePromotionTargets(schoolId, promotionList);
      if (validationErrors.length > 0) {
        result.errors = validationErrors;
        result.message = 'Validation failed';
        return result;
      }

      // Execute promotion in transaction
      const transactionResult = await prisma.$transaction(async (tx) => {
        const nextYear = currentYear + 1;
        const promotions = [];
        const graduations = [];
        const exclusions = [];
        const feeCarryForwards = [];

        for (const promotionData of promotionList) {
          try {
            const student = await tx.student.findUnique({
              where: { id: promotionData.studentId },
              include: {
                class: {
                  include: {
                    grade: true
                  }
                }
              }
            });

            if (!student) {
              exclusions.push({
                studentId: promotionData.studentId,
                reason: 'Student not found'
              });
              continue;
            }

            // Handle fee carry-forward first
            if (promotionData.outstandingBalance !== 0) {
              const carryForwardEntry = await this.createFeeCarryForward(
                tx,
                student.id,
                currentYear,
                nextYear,
                promotionData.outstandingBalance
              );
              feeCarryForwards.push(carryForwardEntry);
            }

            // Create StudentArrears record
            await this.createStudentArrearsRecord(
              tx,
              student.id,
              currentYear,
              promotionData.outstandingBalance
            );

            if (promotionData.isGraduating) {
              // Graduate to Alumni
              const alumniClass = await this.getOrCreateAlumniClass(tx, schoolId);
              await tx.student.update({
                where: { id: student.id },
                data: {
                  classId: alumniClass.id,
                  academicYear: nextYear
                }
              });

              graduations.push({
                studentId: student.id,
                fromClass: promotionData.fromClass,
                toClass: 'Alumni',
                outstandingBalance: promotionData.outstandingBalance
              });
            } else if (promotionData.toClass !== 'No Next Class') {
              // Regular promotion
              const targetClass = await tx.class.findFirst({
                where: { 
                  name: promotionData.toClass, 
                  schoolId: schoolId, 
                  isActive: true 
                }
              });

              if (targetClass) {
                await tx.student.update({
                  where: { id: student.id },
                  data: {
                    classId: targetClass.id,
                    academicYear: nextYear
                  }
                });

                promotions.push({
                  studentId: student.id,
                  fromClass: promotionData.fromClass,
                  toClass: promotionData.toClass,
                  outstandingBalance: promotionData.outstandingBalance
                });
              }
            }

            // Create promotion log
            await tx.promotionLog.create({
              data: {
                studentId: student.id,
                fromClass: promotionData.fromClass,
                toClass: promotionData.toClass,
                fromYear: currentYear.toString(),
                toYear: nextYear.toString(),
                promotedBy,
                promotionType: 'bulk',
                criteria: {
                  feeStatus: promotionData.outstandingBalance === 0 ? 'paid' : 'unpaid',
                  outstandingBalance: promotionData.outstandingBalance
                },
                notes: promotionData.isGraduating ? 
                  `Graduated to Alumni with outstanding balance: ${promotionData.outstandingBalance}` :
                  `Promoted from ${promotionData.fromClass} to ${promotionData.toClass}`
              }
            });

          } catch (error) {
            console.error(`Error processing student ${promotionData.studentId}:`, error);
            exclusions.push({
              studentId: promotionData.studentId,
              reason: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        return { promotions, graduations, exclusions, feeCarryForwards };
      });

      result.success = true;
      result.promotedStudents = transactionResult.promotions.length;
      result.graduatedStudents = transactionResult.graduations.length;
      result.excludedStudents = transactionResult.exclusions.length;
      result.details = transactionResult;
      result.message = `Promotion completed: ${result.promotedStudents} promoted, ${result.graduatedStudents} graduated, ${result.excludedStudents} excluded`;

    } catch (error) {
      console.error('Error executing bulk promotion:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      result.message = 'Promotion failed';
    }

    return result;
  }

  /**
   * Calculate outstanding balance for a student in a given year
   */
  private static async calculateOutstandingBalance(studentId: string, academicYear: number): Promise<number> {
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
        year: academicYear,
        isActive: true
      }
    });

    // Calculate total fees
    const totalFees = feeStructures.reduce((sum, fs) => sum + Number(fs.totalAmount), 0);

    // Get total payments for the year
    const payments = await prisma.payment.findMany({
      where: {
        studentId,
        academicYear,
        paymentMethod: { not: 'CARRY_FORWARD' } // Exclude carry-forward entries
      }
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // Return outstanding balance (can be negative for overpayment)
    return totalFees - totalPaid;
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
        academicYear: toYear
      }
    });
  }

  /**
   * Create StudentArrears record
   */
  private static async createStudentArrearsRecord(
    tx: any,
    studentId: string,
    academicYear: number,
    closingBalance: number
  ): Promise<any> {
    return await tx.studentArrears.upsert({
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
} 