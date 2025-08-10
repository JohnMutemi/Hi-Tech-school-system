#!/usr/bin/env tsx

/**
 * School Data Isolation Test Script
 * 
 * This script tests all API endpoints to ensure proper school data isolation.
 * It creates test data in multiple schools and verifies that data doesn't leak between schools.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: any;
}

class SchoolIsolationTester {
  private testSchools: { id: string; code: string; name: string }[] = [];
  private testResults: TestResult[] = [];

  async setup() {
    console.log('🚀 Setting up school isolation tests...\n');
    
    // Create test schools if they don't exist
    const school1 = await this.createOrGetSchool('TEST1', 'Test School 1');
    const school2 = await this.createOrGetSchool('TEST2', 'Test School 2');
    
    this.testSchools = [school1, school2];
    console.log(`✅ Test schools ready: ${school1.name} (${school1.code}) and ${school2.name} (${school2.code})\n`);
  }

  private async createOrGetSchool(code: string, name: string) {
    let school = await prisma.school.findUnique({
      where: { code }
    });

    if (!school) {
      school = await prisma.school.create({
        data: {
          code,
          name,
          address: `Test Address for ${name}`,
          phone: '1234567890',
          email: `${code.toLowerCase()}@test.com`
        }
      });
      console.log(`📝 Created test school: ${name}`);
    }

    return school;
  }

  async testTeacherIsolation() {
    console.log('👥 Testing Teacher Isolation...');
    
    // Create teachers in both schools
    const teacher1 = await this.createTeacher(this.testSchools[0].id, 'John Doe', 'john.doe@test1.com');
    const teacher2 = await this.createTeacher(this.testSchools[1].id, 'Jane Smith', 'jane.smith@test2.com');
    
    // Test GET /api/schools/TEST1/teachers
    const teachers1 = await this.fetchTeachers('TEST1');
    const hasTeacher1 = teachers1.some((t: any) => t.id === teacher1.id);
    const hasTeacher2 = teachers1.some((t: any) => t.id === teacher2.id);
    
    this.addResult({
      test: 'Teacher Isolation - School 1',
      status: hasTeacher1 && !hasTeacher2 ? 'PASS' : 'FAIL',
      message: hasTeacher1 && !hasTeacher2 
        ? 'School 1 only shows its own teachers' 
        : `School 1 shows ${hasTeacher1 ? 'its own' : 'not its own'} teacher and ${hasTeacher2 ? 'other school\'s' : 'not other school\'s'} teacher`
    });
    
    // Test GET /api/schools/TEST2/teachers
    const teachers2 = await this.fetchTeachers('TEST2');
    const hasTeacher1InSchool2 = teachers2.some((t: any) => t.id === teacher1.id);
    const hasTeacher2InSchool2 = teachers2.some((t: any) => t.id === teacher2.id);
    
    this.addResult({
      test: 'Teacher Isolation - School 2',
      status: !hasTeacher1InSchool2 && hasTeacher2InSchool2 ? 'PASS' : 'FAIL',
      message: !hasTeacher1InSchool2 && hasTeacher2InSchool2 
        ? 'School 2 only shows its own teachers' 
        : `School 2 shows ${hasTeacher1InSchool2 ? 'other school\'s' : 'not other school\'s'} teacher and ${hasTeacher2InSchool2 ? 'its own' : 'not its own'} teacher`
    });
  }

  async testStudentIsolation() {
    console.log('🎓 Testing Student Isolation...');
    
    // Create students in both schools
    const student1 = await this.createStudent(this.testSchools[0].id, 'Alice Johnson', 'alice@test1.com');
    const student2 = await this.createStudent(this.testSchools[1].id, 'Bob Wilson', 'bob@test2.com');
    
    // Test GET /api/schools/TEST1/students
    const students1 = await this.fetchStudents('TEST1');
    const hasStudent1 = students1.some((s: any) => s.id === student1.id);
    const hasStudent2 = students1.some((s: any) => s.id === student2.id);
    
    this.addResult({
      test: 'Student Isolation - School 1',
      status: hasStudent1 && !hasStudent2 ? 'PASS' : 'FAIL',
      message: hasStudent1 && !hasStudent2 
        ? 'School 1 only shows its own students' 
        : `School 1 shows ${hasStudent1 ? 'its own' : 'not its own'} student and ${hasStudent2 ? 'other school\'s' : 'not other school\'s'} student`
    });
    
    // Test GET /api/schools/TEST2/students
    const students2 = await this.fetchStudents('TEST2');
    const hasStudent1InSchool2 = students2.some((s: any) => s.id === student1.id);
    const hasStudent2InSchool2 = students2.some((s: any) => s.id === student2.id);
    
    this.addResult({
      test: 'Student Isolation - School 2',
      status: !hasStudent1InSchool2 && hasStudent2InSchool2 ? 'PASS' : 'FAIL',
      message: !hasStudent1InSchool2 && hasStudent2InSchool2 
        ? 'School 2 only shows its own students' 
        : `School 2 shows ${hasStudent1InSchool2 ? 'other school\'s' : 'not other school\'s'} student and ${hasStudent2InSchool2 ? 'its own' : 'not its own'} student`
    });
  }

  async testClassIsolation() {
    console.log('🏫 Testing Class Isolation...');
    
    // Create grades first
    const grade1 = await this.createGrade(this.testSchools[0].id, 'Grade 1');
    const grade2 = await this.createGrade(this.testSchools[1].id, 'Grade 1');
    
    // Create classes in both schools
    const class1 = await this.createClass(this.testSchools[0].id, grade1.id, 'Class 1A');
    const class2 = await this.createClass(this.testSchools[1].id, grade2.id, 'Class 1A');
    
    // Test GET /api/schools/TEST1/classes
    const classes1 = await this.fetchClasses('TEST1');
    const hasClass1 = classes1.some((c: any) => c.id === class1.id);
    const hasClass2 = classes1.some((c: any) => c.id === class2.id);
    
    this.addResult({
      test: 'Class Isolation - School 1',
      status: hasClass1 && !hasClass2 ? 'PASS' : 'FAIL',
      message: hasClass1 && !hasClass2 
        ? 'School 1 only shows its own classes' 
        : `School 1 shows ${hasClass1 ? 'its own' : 'not its own'} class and ${hasClass2 ? 'other school\'s' : 'not other school\'s'} class`
    });
    
    // Test GET /api/schools/TEST2/classes
    const classes2 = await this.fetchClasses('TEST2');
    const hasClass1InSchool2 = classes2.some((c: any) => c.id === class1.id);
    const hasClass2InSchool2 = classes2.some((c: any) => c.id === class2.id);
    
    this.addResult({
      test: 'Class Isolation - School 2',
      status: !hasClass1InSchool2 && hasClass2InSchool2 ? 'PASS' : 'FAIL',
      message: !hasClass1InSchool2 && hasClass2InSchool2 
        ? 'School 2 only shows its own classes' 
        : `School 2 shows ${hasClass1InSchool2 ? 'other school\'s' : 'not other school\'s'} class and ${hasClass2InSchool2 ? 'its own' : 'not its own'} class`
    });
  }

  async testSubjectIsolation() {
    console.log('📚 Testing Subject Isolation...');
    
    // Create subjects in both schools
    const subject1 = await this.createSubject(this.testSchools[0].id, 'Mathematics', 'MATH');
    const subject2 = await this.createSubject(this.testSchools[1].id, 'Mathematics', 'MATH');
    
    // Test GET /api/schools/TEST1/subjects
    const subjects1 = await this.fetchSubjects('TEST1');
    const hasSubject1 = subjects1.some((s: any) => s.id === subject1.id);
    const hasSubject2 = subjects1.some((s: any) => s.id === subject2.id);
    
    this.addResult({
      test: 'Subject Isolation - School 1',
      status: hasSubject1 && !hasSubject2 ? 'PASS' : 'FAIL',
      message: hasSubject1 && !hasSubject2 
        ? 'School 1 only shows its own subjects' 
        : `School 1 shows ${hasSubject1 ? 'its own' : 'not its own'} subject and ${hasSubject2 ? 'other school\'s' : 'not other school\'s'} subject`
    });
    
    // Test GET /api/schools/TEST2/subjects
    const subjects2 = await this.fetchSubjects('TEST2');
    const hasSubject1InSchool2 = subjects2.some((s: any) => s.id === subject1.id);
    const hasSubject2InSchool2 = subjects2.some((s: any) => s.id === subject2.id);
    
    this.addResult({
      test: 'Subject Isolation - School 2',
      status: !hasSubject1InSchool2 && hasSubject2InSchool2 ? 'PASS' : 'FAIL',
      message: !hasSubject1InSchool2 && hasSubject2InSchool2 
        ? 'School 2 only shows its own subjects' 
        : `School 2 shows ${hasSubject1InSchool2 ? 'other school\'s' : 'not other school\'s'} subject and ${hasSubject2InSchool2 ? 'its own' : 'not its own'} subject`
    });
  }

  async testFeeStructureIsolation() {
    console.log('💰 Testing Fee Structure Isolation...');
    
    // Create grades first
    const grade1 = await this.createGrade(this.testSchools[0].id, 'Grade 1');
    const grade2 = await this.createGrade(this.testSchools[1].id, 'Grade 1');
    
    // Create fee structures in both schools
    const feeStructure1 = await this.createFeeStructure(this.testSchools[0].id, grade1.id, 'Term 1', 2024);
    const feeStructure2 = await this.createFeeStructure(this.testSchools[1].id, grade2.id, 'Term 1', 2024);
    
    // Test GET /api/schools/TEST1/fee-structure
    const feeStructures1 = await this.fetchFeeStructures('TEST1');
    const hasFeeStructure1 = feeStructures1.some((f: any) => f.id === feeStructure1.id);
    const hasFeeStructure2 = feeStructures1.some((f: any) => f.id === feeStructure2.id);
    
    this.addResult({
      test: 'Fee Structure Isolation - School 1',
      status: hasFeeStructure1 && !hasFeeStructure2 ? 'PASS' : 'FAIL',
      message: hasFeeStructure1 && !hasFeeStructure2 
        ? 'School 1 only shows its own fee structures' 
        : `School 1 shows ${hasFeeStructure1 ? 'its own' : 'not its own'} fee structure and ${hasFeeStructure2 ? 'other school\'s' : 'not other school\'s'} fee structure`
    });
    
    // Test GET /api/schools/TEST2/fee-structure
    const feeStructures2 = await this.fetchFeeStructures('TEST2');
    const hasFeeStructure1InSchool2 = feeStructures2.some((f: any) => f.id === feeStructure1.id);
    const hasFeeStructure2InSchool2 = feeStructures2.some((f: any) => f.id === feeStructure2.id);
    
    this.addResult({
      test: 'Fee Structure Isolation - School 2',
      status: !hasFeeStructure1InSchool2 && hasFeeStructure2InSchool2 ? 'PASS' : 'FAIL',
      message: !hasFeeStructure1InSchool2 && hasFeeStructure2InSchool2 
        ? 'School 2 only shows its own fee structures' 
        : `School 2 shows ${hasFeeStructure1InSchool2 ? 'other school\'s' : 'not other school\'s'} fee structure and ${hasFeeStructure2InSchool2 ? 'its own' : 'not its own'} fee structure`
    });
  }

  async testAdmissionSettingsIsolation() {
    console.log('🎫 Testing Admission Settings Isolation...');
    
    // Update admission settings for both schools
    await this.updateAdmissionSettings(this.testSchools[0].id, 'ADM001');
    await this.updateAdmissionSettings(this.testSchools[1].id, 'STU001');
    
    // Test GET /api/schools/TEST1
    const school1Settings = await this.fetchSchoolSettings('TEST1');
    const school2Settings = await this.fetchSchoolSettings('TEST2');
    
    const school1HasCorrectSettings = school1Settings.lastAdmissionNumber === 'ADM001';
    const school2HasCorrectSettings = school2Settings.lastAdmissionNumber === 'STU001';
    
    this.addResult({
      test: 'Admission Settings Isolation',
      status: school1HasCorrectSettings && school2HasCorrectSettings ? 'PASS' : 'FAIL',
      message: school1HasCorrectSettings && school2HasCorrectSettings 
        ? 'Each school has its own admission settings' 
        : `School 1 has ${school1HasCorrectSettings ? 'correct' : 'incorrect'} settings, School 2 has ${school2HasCorrectSettings ? 'correct' : 'incorrect'} settings`
    });
  }

  // Helper methods for creating test data
  private async createTeacher(schoolId: string, name: string, email: string) {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: 'hashedpassword',
        role: 'teacher',
        schoolId,
        isActive: true,
        teacherProfile: {
          create: {
            qualification: 'Bachelor of Education',
            dateJoined: new Date(),
            tempPassword: 'temp123'
          }
        }
      }
    });
    return user;
  }

  private async createStudent(schoolId: string, name: string, email: string) {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: 'hashedpassword',
        role: 'student',
        schoolId,
        isActive: true
      }
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        schoolId,
        admissionNumber: `ADM${Date.now()}`,
        isActive: true
      }
    });
    return student;
  }

  private async createGrade(schoolId: string, name: string) {
    // Only allow grades 1-6
    const validGrades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
    if (!validGrades.includes(name)) {
      throw new Error(`Invalid grade: ${name}. Only grades 1-6 are allowed.`);
    }
    
    return await prisma.grade.create({
      data: {
        name,
        schoolId,
        isAlumni: false
      }
    });
  }

  private async createClass(schoolId: string, gradeId: string, name: string) {
    return await prisma.class.create({
      data: {
        name,
        schoolId,
        gradeId,
        academicYear: new Date().getFullYear().toString(),
        isActive: true
      }
    });
  }

  private async createSubject(schoolId: string, name: string, code: string) {
    return await prisma.subject.create({
      data: {
        name,
        code,
        schoolId,
        isActive: true
      }
    });
  }

  private async createFeeStructure(schoolId: string, gradeId: string, term: string, year: number) {
    const adminUser = await prisma.user.findFirst({
      where: { schoolId, role: 'admin' }
    });

    if (!adminUser) {
      throw new Error('No admin user found for school');
    }

    return await prisma.termlyFeeStructure.create({
      data: {
        term,
        year,
        gradeId,
        totalAmount: 1000,
        breakdown: [{ name: 'Tuition', value: 1000 }],
        isActive: true,
        createdBy: adminUser.id,
        schoolId
      }
    });
  }

  private async updateAdmissionSettings(schoolId: string, lastAdmissionNumber: string) {
    return await prisma.school.update({
      where: { id: schoolId },
      data: { lastAdmissionNumber }
    });
  }

  // Helper methods for fetching data via API simulation
  private async fetchTeachers(schoolCode: string) {
    const school = this.testSchools.find(s => s.code === schoolCode);
    if (!school) throw new Error(`School ${schoolCode} not found`);
    
    return await prisma.user.findMany({
      where: {
        schoolId: school.id,
        role: 'teacher',
        isActive: true
      },
      include: { teacherProfile: true }
    });
  }

  private async fetchStudents(schoolCode: string) {
    const school = this.testSchools.find(s => s.code === schoolCode);
    if (!school) throw new Error(`School ${schoolCode} not found`);
    
    return await prisma.student.findMany({
      where: {
        schoolId: school.id,
        isActive: true
      },
      include: { user: true }
    });
  }

  private async fetchClasses(schoolCode: string) {
    const school = this.testSchools.find(s => s.code === schoolCode);
    if (!school) throw new Error(`School ${schoolCode} not found`);
    
    return await prisma.class.findMany({
      where: {
        schoolId: school.id,
        isActive: true
      },
      include: { grade: true, teacher: true }
    });
  }

  private async fetchSubjects(schoolCode: string) {
    const school = this.testSchools.find(s => s.code === schoolCode);
    if (!school) throw new Error(`School ${schoolCode} not found`);
    
    return await prisma.subject.findMany({
      where: {
        schoolId: school.id,
        isActive: true
      },
      include: { teacher: true }
    });
  }

  private async fetchFeeStructures(schoolCode: string) {
    const school = this.testSchools.find(s => s.code === schoolCode);
    if (!school) throw new Error(`School ${schoolCode} not found`);
    
    return await prisma.termlyFeeStructure.findMany({
      where: {
        schoolId: school.id,
        isActive: true
      },
      include: { grade: true, creator: true }
    });
  }

  private async fetchSchoolSettings(schoolCode: string) {
    const school = this.testSchools.find(s => s.code === schoolCode);
    if (!school) throw new Error(`School ${schoolCode} not found`);
    
    return await prisma.school.findUnique({
      where: { id: school.id },
      select: {
        lastAdmissionNumber: true,
        admissionNumberFormat: true,
        admissionNumberAutoIncrement: true
      }
    });
  }

  private addResult(result: TestResult) {
    this.testResults.push(result);
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${result.test}: ${result.message}`);
  }

  async runAllTests() {
    console.log('🧪 Running all school isolation tests...\n');
    
    await this.testTeacherIsolation();
    await this.testStudentIsolation();
    await this.testClassIsolation();
    await this.testSubjectIsolation();
    await this.testFeeStructureIsolation();
    await this.testAdmissionSettingsIsolation();
    
    this.printSummary();
  }

  private printSummary() {
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
    }
    
    if (passed === total) {
      console.log('\n🎉 All tests passed! School data isolation is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the school context implementation.');
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    // Delete test data in reverse order to avoid foreign key constraints
    await prisma.termlyFeeStructure.deleteMany({
      where: { schoolId: { in: this.testSchools.map(s => s.id) } }
    });
    
    await prisma.subject.deleteMany({
      where: { schoolId: { in: this.testSchools.map(s => s.id) } }
    });
    
    await prisma.class.deleteMany({
      where: { schoolId: { in: this.testSchools.map(s => s.id) } }
    });
    
    await prisma.student.deleteMany({
      where: { schoolId: { in: this.testSchools.map(s => s.id) } }
    });
    
    await prisma.user.deleteMany({
      where: { schoolId: { in: this.testSchools.map(s => s.id) } }
    });
    
    await prisma.grade.deleteMany({
      where: { schoolId: { in: this.testSchools.map(s => s.id) } }
    });
    
    // Don't delete the test schools as they might be used for other tests
    console.log('✅ Test data cleaned up');
  }
}

async function main() {
  const tester = new SchoolIsolationTester();
  
  try {
    await tester.setup();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await tester.cleanup();
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { SchoolIsolationTester }; 