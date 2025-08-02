import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SchoolContext {
  schoolId: string;
  schoolCode: string;
  schoolName: string;
}

/**
 * Utility class to ensure school-specific data isolation
 */
export class SchoolDataManager {
  private schoolContext: SchoolContext;

  constructor(schoolCode: string) {
    this.schoolContext = {
      schoolId: '',
      schoolCode,
      schoolName: ''
    };
  }

  /**
   * Initialize school context by fetching school details
   */
  async initialize(): Promise<SchoolContext> {
    const school = await prisma.school.findUnique({
      where: { code: this.schoolContext.schoolCode },
      select: { id: true, code: true, name: true }
    });

    if (!school) {
      throw new Error(`School with code ${this.schoolContext.schoolCode} not found`);
    }

    this.schoolContext = {
      schoolId: school.id,
      schoolCode: school.code,
      schoolName: school.name
    };

    return this.schoolContext;
  }

  /**
   * Get school context
   */
  getContext(): SchoolContext {
    return this.schoolContext;
  }

  /**
   * Get school-specific where clause for Prisma queries
   */
  getSchoolWhereClause(additionalFilters: any = {}): any {
    return {
      schoolId: this.schoolContext.schoolId,
      ...additionalFilters
    };
  }

  /**
   * Get school-specific include clause for Prisma queries
   */
  getSchoolIncludeClause(): any {
    return {
      where: { schoolId: this.schoolContext.schoolId }
    };
  }

  /**
   * Validate that a resource belongs to the current school
   */
  async validateSchoolOwnership(resourceId: string, model: any): Promise<boolean> {
    const resource = await model.findFirst({
      where: {
        id: resourceId,
        schoolId: this.schoolContext.schoolId
      }
    });
    return !!resource;
  }

  /**
   * Get school-specific admission settings
   */
  async getAdmissionSettings() {
    const school = await prisma.school.findUnique({
      where: { id: this.schoolContext.schoolId },
      select: {
        admissionNumberAutoIncrement: true,
        admissionNumberFormat: true,
        lastAdmissionNumber: true
      }
    });
    return school;
  }

  /**
   * Update school-specific admission settings
   */
  async updateAdmissionSettings(settings: {
    admissionNumberAutoIncrement?: boolean;
    admissionNumberFormat?: string;
    lastAdmissionNumber?: string;
  }) {
    return await prisma.school.update({
      where: { id: this.schoolContext.schoolId },
      data: settings
    });
  }

  /**
   * Get school-specific teachers
   */
  async getTeachers() {
    return await prisma.user.findMany({
      where: {
        schoolId: this.schoolContext.schoolId,
        role: 'teacher',
        isActive: true
      },
      include: {
        teacherProfile: true
      }
    });
  }

  /**
   * Get school-specific students
   */
  async getStudents(filters: any = {}) {
    return await prisma.student.findMany({
      where: {
        schoolId: this.schoolContext.schoolId,
        isActive: true,
        ...filters
      },
      include: {
        user: true,
        class: true,
        parent: true
      }
    });
  }

  /**
   * Get school-specific classes
   */
  async getClasses() {
    return await prisma.class.findMany({
      where: {
        schoolId: this.schoolContext.schoolId,
        isActive: true
      },
      include: {
        grade: true,
        teacher: true,
        students: true
      }
    });
  }

  /**
   * Get school-specific subjects
   */
  async getSubjects() {
    return await prisma.subject.findMany({
      where: {
        schoolId: this.schoolContext.schoolId,
        isActive: true
      },
      include: {
        teacher: true
      }
    });
  }

  /**
   * Get school-specific fee structures
   */
  async getFeeStructures() {
    return await prisma.feeStructure.findMany({
      where: {
        schoolId: this.schoolContext.schoolId,
        isActive: true
      }
    });
  }

  /**
   * Get school-specific termly fee structures
   */
  async getTermlyFeeStructures() {
    return await prisma.termlyFeeStructure.findMany({
      where: {
        schoolId: this.schoolContext.schoolId,
        isActive: true
      },
      include: {
        grade: true,
        creator: true
      }
    });
  }

  /**
   * Get school-specific promotion criteria
   */
  async getPromotionCriteria() {
    return await prisma.promotionCriteria.findMany({
      where: {
        schoolId: this.schoolContext.schoolId,
        isActive: true
      },
      include: {
        creator: true
      }
    });
  }

  /**
   * Get school-specific academic years
   */
  async getAcademicYears() {
    return await prisma.academicYear.findMany({
      where: {
        schoolId: this.schoolContext.schoolId
      },
      include: {
        terms: true
      },
      orderBy: {
        startDate: 'desc'
      }
    });
  }

  /**
   * Get grades available to this school (both school-specific and platform-level)
   */
  async getGrades() {
    return await prisma.grade.findMany({
      where: {
        OR: [
          // School-specific grades
          {
            schoolId: this.schoolContext.schoolId,
            name: {
              in: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']
            }
          },
          // Platform-level grades (available to all schools)
          {
            schoolId: null,
            name: {
              in: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']
            }
          }
        ]
      },
      include: {
        classes: {
          where: {
            OR: [
              { schoolId: this.schoolContext.schoolId },
              { schoolId: null } // Include platform-level classes if any
            ]
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }
}

/**
 * Middleware to ensure school context is available
 */
export function withSchoolContext(schoolCode: string) {
  return new SchoolDataManager(schoolCode);
}

/**
 * Utility to validate school ownership of resources
 */
export async function validateSchoolResource(
  schoolCode: string, 
  resourceId: string, 
  model: any
): Promise<boolean> {
  const schoolManager = withSchoolContext(schoolCode);
  await schoolManager.initialize();
  return await schoolManager.validateSchoolOwnership(resourceId, model);
}

/**
 * Utility to get school-specific data with proper isolation
 */
export async function getSchoolSpecificData<T>(
  schoolCode: string,
  dataFetcher: (schoolManager: SchoolDataManager) => Promise<T>
): Promise<T> {
  const schoolManager = withSchoolContext(schoolCode);
  await schoolManager.initialize();
  return await dataFetcher(schoolManager);
} 