import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SchoolSeedingService {
  private schoolId: string;
  private schoolCode: string;

  constructor(schoolId: string, schoolCode: string) {
    this.schoolId = schoolId;
    this.schoolCode = schoolCode;
  }

  /**
   * Comprehensive seeding for a new school
   */
  async seedSchoolData() {
    const seedingResults = {
      academicYears: 0,
      terms: 0,
      grades: 0,
      classes: 0,
      students: 0,
      errors: [] as string[]
    };

    try {
      console.log(`🌱 Starting comprehensive seeding for school: ${this.schoolCode}`);

      // 1. Seed Academic Years (current and next year)
      const academicYears = await this.seedAcademicYears();
      seedingResults.academicYears = academicYears.length;

      // 2. Seed Terms for each academic year
      const terms = await this.seedTerms(academicYears);
      seedingResults.terms = terms.length;

      // 3. Ensure platform grades exist or create school-specific grades
      const grades = await this.ensureGrades();
      seedingResults.grades = grades.length;

      // 4. Seed Classes for each grade
      const classes = await this.seedClasses(grades);
      seedingResults.classes = classes.length;

      // 5. Create default fee structures for each grade and term
      const feeStructures = await this.seedFeeStructures(grades, academicYears[0], terms.slice(0, 3));
      console.log(`✅ Created ${feeStructures.length} fee structures`);

      // 6. Seed sample students (2 per grade)
      const students = await this.seedSampleStudents(classes, academicYears[0], terms.slice(0, 3));
      seedingResults.students = students.length;

      console.log(`✅ Seeding completed for school: ${this.schoolCode}`, seedingResults);
      return seedingResults;

    } catch (error) {
      console.error(`❌ Seeding failed for school: ${this.schoolCode}`, error);
      seedingResults.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return seedingResults;
    }
  }

  /**
   * Create academic years (current and next year)
   */
  private async seedAcademicYears() {
    const currentYear = new Date().getFullYear();
    const academicYears = [];

    for (let yearOffset = 0; yearOffset < 2; yearOffset++) {
      const year = currentYear + yearOffset;
      const yearName = year.toString();
      
      try {
        const existingYear = await prisma.academicYear.findFirst({
          where: {
            schoolId: this.schoolId,
            name: yearName
          }
        });

        if (!existingYear) {
          const academicYear = await prisma.academicYear.create({
            data: {
              schoolId: this.schoolId,
              name: yearName,
              startDate: new Date(year, 0, 1), // January 1st
              endDate: new Date(year, 11, 31), // December 31st
              isCurrent: yearOffset === 0 // First year is current
            }
          });
          academicYears.push(academicYear);
          console.log(`✅ Created academic year: ${yearName}`);
        } else {
          academicYears.push(existingYear);
          console.log(`✅ Academic year already exists: ${yearName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create academic year ${yearName}:`, error);
      }
    }

    return academicYears;
  }

  /**
   * Create terms for each academic year
   */
  private async seedTerms(academicYears: any[]) {
    const allTerms = [];
    const termNames = ['Term 1', 'Term 2', 'Term 3'];

    for (const academicYear of academicYears) {
      for (let termIndex = 0; termIndex < termNames.length; termIndex++) {
        const termName = termNames[termIndex];
        
        try {
          const existingTerm = await prisma.term.findFirst({
            where: {
              academicYearId: academicYear.id,
              name: termName
            }
          });

          if (!existingTerm) {
            // Calculate term dates (roughly 4 months each)
            const yearStart = new Date(academicYear.startDate);
            const termStart = new Date(yearStart.getFullYear(), termIndex * 4, 1);
            const termEnd = new Date(yearStart.getFullYear(), (termIndex + 1) * 4 - 1, 30);

            const term = await prisma.term.create({
              data: {
                academicYearId: academicYear.id,
                name: termName,
                startDate: termStart,
                endDate: termEnd,
                isCurrent: academicYear.isCurrent && termIndex === 0 // First term of current year is current
              }
            });
            allTerms.push(term);
            console.log(`✅ Created term: ${termName} for ${academicYear.name}`);
          } else {
            allTerms.push(existingTerm);
            console.log(`✅ Term already exists: ${termName} for ${academicYear.name}`);
          }
        } catch (error) {
          console.error(`❌ Failed to create term ${termName} for ${academicYear.name}:`, error);
        }
      }
    }

    return allTerms;
  }

  /**
   * Ensure grades exist (platform-level or create school-specific)
   */
  private async ensureGrades() {
    const grades = [];

    // First check for platform-level grades
    const platformGrades = await prisma.grade.findMany({
      where: { schoolId: null }
    });

    if (platformGrades.length > 0) {
      console.log(`✅ Using ${platformGrades.length} platform-level grades`);
      return platformGrades;
    }

    // If no platform grades, create school-specific grades
    for (let i = 1; i <= 6; i++) {
      const gradeName = `Grade ${i}`;
      
      try {
        const existingGrade = await prisma.grade.findFirst({
          where: {
            schoolId: this.schoolId,
            name: gradeName
          }
        });

        if (!existingGrade) {
          const grade = await prisma.grade.create({
            data: {
              schoolId: this.schoolId,
              name: gradeName,
              isAlumni: false
            }
          });
          grades.push(grade);
          console.log(`✅ Created grade: ${gradeName}`);
        } else {
          grades.push(existingGrade);
          console.log(`✅ Grade already exists: ${gradeName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create grade ${gradeName}:`, error);
      }
    }

    return grades;
  }

  /**
   * Create classes for each grade (A, B, C sections)
   */
  private async seedClasses(grades: any[]) {
    const allClasses = [];
    const classSections = ['A', 'B', 'C'];

    for (const grade of grades) {
      for (const section of classSections) {
        const className = `${grade.name}${section}`;
        
        try {
          const existingClass = await prisma.class.findFirst({
            where: {
              schoolId: this.schoolId,
              name: className
            }
          });

          if (!existingClass) {
            const newClass = await prisma.class.create({
              data: {
                schoolId: this.schoolId,
                gradeId: grade.id,
                name: className,
                isActive: true
              }
            });
            allClasses.push(newClass);
            console.log(`✅ Created class: ${className}`);
          } else {
            allClasses.push(existingClass);
            console.log(`✅ Class already exists: ${className}`);
          }
        } catch (error) {
          console.error(`❌ Failed to create class ${className}:`, error);
        }
      }
    }

    return allClasses;
  }

  /**
   * Create sample students (2 per grade with realistic data)
   */
  private async seedSampleStudents(classes: any[], currentAcademicYear: any, currentTerms: any[]) {
    const allStudents = [];
    
    // Group classes by grade for easier processing
    const classesByGrade = classes.reduce((acc, cls) => {
      const gradeId = cls.gradeId;
      if (!acc[gradeId]) acc[gradeId] = [];
      acc[gradeId].push(cls);
      return acc;
    }, {});

    // Sample student names
    const studentNames = [
      { first: 'John', last: 'Mwangi', gender: 'male' },
      { first: 'Mary', last: 'Wanjiku', gender: 'female' },
      { first: 'David', last: 'Kipchoge', gender: 'male' },
      { first: 'Grace', last: 'Achieng', gender: 'female' },
      { first: 'Peter', last: 'Kamau', gender: 'male' },
      { first: 'Faith', last: 'Nyambura', gender: 'female' },
      { first: 'Samuel', last: 'Otieno', gender: 'male' },
      { first: 'Joyce', last: 'Wafula', gender: 'female' },
      { first: 'Michael', last: 'Kiprotich', gender: 'male' },
      { first: 'Sarah', last: 'Mutindi', gender: 'female' },
      { first: 'James', last: 'Ochieng', gender: 'male' },
      { first: 'Rose', last: 'Njeri', gender: 'female' }
    ];

    let studentIndex = 0;

    for (const [gradeId, gradeClasses] of Object.entries(classesByGrade)) {
      // Create 2 students per grade
      for (let i = 0; i < 2; i++) {
        const studentData = studentNames[studentIndex % studentNames.length];
        const selectedClass = gradeClasses[i % gradeClasses.length];
        
        try {
          // Generate admission number
          const admissionNumber = `ADM${String(studentIndex + 1).padStart(3, '0')}`;
          
          // Check if student already exists
          const existingStudent = await prisma.student.findFirst({
            where: {
              schoolId: this.schoolId,
              admissionNumber
            }
          });

          if (!existingStudent) {
            // Create student user account
            const studentEmail = `${studentData.first.toLowerCase()}.${studentData.last.toLowerCase()}@${this.schoolCode}.student.local`;
            const hashedPassword = await this.hashDefaultPassword('student123');

            const studentUser = await prisma.user.create({
              data: {
                name: `${studentData.first} ${studentData.last}`,
                email: studentEmail,
                password: hashedPassword,
                role: 'student',
                schoolId: this.schoolId,
                isActive: true
              }
            });

            // Create parent user account
            const parentEmail = `parent.${studentData.first.toLowerCase()}.${studentData.last.toLowerCase()}@${this.schoolCode}.parent.local`;
            const parentPhone = `+254${Math.floor(Math.random() * 900000000 + 100000000)}`;
            const hashedParentPassword = await this.hashDefaultPassword('parent123');

            const parentUser = await prisma.user.create({
              data: {
                name: `Parent of ${studentData.first} ${studentData.last}`,
                email: parentEmail,
                phone: parentPhone,
                password: hashedParentPassword,
                role: 'parent',
                schoolId: this.schoolId,
                isActive: true
              }
            });

            // Create student record
            const student = await prisma.student.create({
              data: {
                userId: studentUser.id,
                schoolId: this.schoolId,
                classId: selectedClass.id,
                admissionNumber,
                dateOfBirth: new Date(2010 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                dateAdmitted: new Date(),
                parentId: parentUser.id,
                parentName: parentUser.name,
                parentPhone: parentPhone,
                parentEmail: parentEmail,
                gender: studentData.gender,
                status: 'active',
                isActive: true,
                currentAcademicYearId: currentAcademicYear.id,
                currentTermId: currentTerms[0]?.id,
                joinedAcademicYearId: currentAcademicYear.id,
                joinedTermId: currentTerms[0]?.id
              }
            });

            allStudents.push(student);
            console.log(`✅ Created sample student: ${studentData.first} ${studentData.last} (${admissionNumber}) in ${selectedClass.name}`);
          } else {
            console.log(`✅ Student already exists: ${admissionNumber}`);
          }
        } catch (error) {
          console.error(`❌ Failed to create sample student ${studentData.first} ${studentData.last}:`, error);
        }
        
        studentIndex++;
      }
    }

    return allStudents;
  }

  /**
   * Create default fee structures for each grade and term
   */
  private async seedFeeStructures(grades: any[], academicYear: any, terms: any[]) {
    const feeStructures = [];

    // Find or create a system user for fee structure creation
    let systemUser = await prisma.user.findFirst({
      where: {
        schoolId: this.schoolId,
        role: 'admin'
      }
    });

    if (!systemUser) {
      // Use any user from the school as fallback
      systemUser = await prisma.user.findFirst({
        where: { schoolId: this.schoolId }
      });
    }

    if (!systemUser) {
      console.log('⚠️ No user found to create fee structures, skipping...');
      return feeStructures;
    }

    for (const grade of grades) {
      for (const term of terms) {
        try {
          // Check if fee structure already exists
          const existingFeeStructure = await prisma.termlyFeeStructure.findFirst({
            where: {
              schoolId: this.schoolId,
              gradeId: grade.id,
              academicYearId: academicYear.id,
              termId: term.id
            }
          });

          if (!existingFeeStructure) {
            // Create default fee breakdown based on grade level
            const feeBreakdown = this.getDefaultFeeBreakdownByGrade(grade.name);
            const totalAmount = Object.values(feeBreakdown).reduce((sum: number, amount: number) => sum + amount, 0);

            const feeStructure = await prisma.termlyFeeStructure.create({
              data: {
                schoolId: this.schoolId,
                gradeId: grade.id,
                academicYearId: academicYear.id,
                termId: term.id,
                term: term.name,
                year: parseInt(academicYear.name),
                totalAmount: totalAmount,
                breakdown: feeBreakdown,
                isActive: true,
                isReleased: true,
                createdBy: systemUser.id,
                dueDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
              }
            });

            feeStructures.push(feeStructure);
            console.log(`✅ Created fee structure: ${grade.name} - ${term.name} (KES ${totalAmount})`);
          } else {
            console.log(`✅ Fee structure already exists: ${grade.name} - ${term.name}`);
          }
        } catch (error) {
          console.error(`❌ Failed to create fee structure for ${grade.name} - ${term.name}:`, error);
        }
      }
    }

    return feeStructures;
  }

  /**
   * Get default fee breakdown based on grade level
   */
  private getDefaultFeeBreakdownByGrade(gradeName: string): Record<string, number> {
    const lowerGradeName = gradeName.toLowerCase();
    
    if (lowerGradeName.includes('1') || lowerGradeName.includes('2')) {
      // Lower primary grades - basic fees
      return {
        tuition: 5000,
        development: 1000,
        activities: 500,
        library: 300,
        medical: 200
      };
    } else if (lowerGradeName.includes('3') || lowerGradeName.includes('4')) {
      // Middle primary grades
      return {
        tuition: 6000,
        development: 1200,
        activities: 800,
        library: 400,
        computer: 600,
        medical: 300
      };
    } else if (lowerGradeName.includes('5') || lowerGradeName.includes('6')) {
      // Upper primary grades
      return {
        tuition: 7000,
        development: 1500,
        activities: 1000,
        library: 500,
        computer: 800,
        examination: 1000,
        medical: 400
      };
    } else {
      // Default for other grades
      return {
        tuition: 6000,
        development: 1200,
        activities: 800,
        library: 400,
        medical: 300
      };
    }
  }

  private async hashDefaultPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(password, 12);
  }
}
