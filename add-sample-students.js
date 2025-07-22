const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Enhanced logging utility
const logSetup = (stage, data, type = 'info') => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    stage,
    type,
    data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
  };
  
  console.log(`🔧 [SETUP-${stage.toUpperCase()}] ${timestamp}:`, logData);
};

async function addSampleStudents() {
  logSetup('START', 'Adding sample students to database');
  
  try {
    // Step 1: Find a school
    logSetup('STEP_1', 'Finding a school...');
    const school = await prisma.school.findFirst();
    if (!school) {
      throw new Error('No school found in database');
    }
    logSetup('SCHOOL_FOUND', { schoolId: school.id, schoolName: school.name, schoolCode: school.code });

    // Step 2: Find or create a grade
    logSetup('STEP_2', 'Finding or creating a grade...');
    let grade = await prisma.grade.findFirst({
      where: { schoolId: school.id }
    });
    if (!grade) {
      grade = await prisma.grade.create({
        data: {
          schoolId: school.id,
          name: 'Form 1',
          level: 1,
          isActive: true
        }
      });
      logSetup('GRADE_CREATED', { gradeId: grade.id, gradeName: grade.name });
    } else {
      logSetup('GRADE_FOUND', { gradeId: grade.id, gradeName: grade.name });
    }

    // Step 3: Find or create a class
    logSetup('STEP_3', 'Finding or creating a class...');
    let classRecord = await prisma.class.findFirst({
      where: { 
        schoolId: school.id,
        gradeId: grade.id
      }
    });
    if (!classRecord) {
      classRecord = await prisma.class.create({
        data: {
          schoolId: school.id,
          gradeId: grade.id,
          name: 'Form 1A',
          capacity: 40,
          isActive: true
        }
      });
      logSetup('CLASS_CREATED', { classId: classRecord.id, className: classRecord.name });
    } else {
      logSetup('CLASS_FOUND', { classId: classRecord.id, className: classRecord.name });
    }

    // Step 4: Find or create academic year
    logSetup('STEP_4', 'Finding or creating academic year...');
    const currentYear = new Date().getFullYear().toString();
    let academicYear = await prisma.academicYear.findFirst({
      where: { 
        schoolId: school.id,
        name: currentYear
      }
    });
    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          schoolId: school.id,
          name: currentYear,
          startDate: new Date(parseInt(currentYear), 0, 1),
          endDate: new Date(parseInt(currentYear), 11, 31),
          isCurrent: true
        }
      });
      logSetup('ACADEMIC_YEAR_CREATED', { academicYearId: academicYear.id, name: academicYear.name });
    } else {
      logSetup('ACADEMIC_YEAR_FOUND', { academicYearId: academicYear.id, name: academicYear.name });
    }

    // Step 5: Find or create terms
    logSetup('STEP_5', 'Finding or creating terms...');
    const terms = ['Term 1', 'Term 2', 'Term 3'];
    const termRecords = [];
    
    for (const termName of terms) {
      let term = await prisma.term.findFirst({
        where: { 
          academicYearId: academicYear.id,
          name: termName
        }
      });
      
      if (!term) {
        const termIndex = terms.indexOf(termName);
        const startMonth = termIndex * 4; // Term 1: Jan, Term 2: May, Term 3: Sep
        const endMonth = startMonth + 3;
        
        term = await prisma.term.create({
          data: {
            academicYearId: academicYear.id,
            name: termName,
            startDate: new Date(parseInt(currentYear), startMonth, 1),
            endDate: new Date(parseInt(currentYear), endMonth, 30),
            isCurrent: termIndex === 0 // Only Term 1 is current
          }
        });
        logSetup('TERM_CREATED', { termId: term.id, termName: term.name });
      } else {
        logSetup('TERM_FOUND', { termId: term.id, termName: term.name });
      }
      termRecords.push(term);
    }

    // Step 6: Create fee structures
    logSetup('STEP_6', 'Creating fee structures...');
    const feeStructures = [];
    
    for (const term of termRecords) {
      const feeStructure = await prisma.termlyFeeStructure.create({
        data: {
          gradeId: grade.id,
          academicYearId: academicYear.id,
          termId: term.id,
          term: term.name,
          year: academicYear.name,
          tuitionFee: 15000,
          developmentFee: 5000,
          examinationFee: 3000,
          libraryFee: 1000,
          sportsFee: 2000,
          totalAmount: 26000,
          isActive: true
        }
      });
      feeStructures.push(feeStructure);
      logSetup('FEE_STRUCTURE_CREATED', {
        feeStructureId: feeStructure.id,
        term: feeStructure.term,
        totalAmount: feeStructure.totalAmount
      });
    }

    // Step 7: Create sample students
    logSetup('STEP_7', 'Creating sample students...');
    const sampleStudents = [
      {
        firstName: 'John',
        lastName: 'Doe',
        admissionNumber: 'STU001',
        email: 'john.doe@student.com',
        phone: '+254700000001'
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        admissionNumber: 'STU002',
        email: 'jane.smith@student.com',
        phone: '+254700000002'
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        admissionNumber: 'STU003',
        email: 'mike.johnson@student.com',
        phone: '+254700000003'
      }
    ];

    const createdStudents = [];
    
    for (const studentData of sampleStudents) {
      // Create user first
      const user = await prisma.user.create({
        data: {
          name: `${studentData.firstName} ${studentData.lastName}`,
          email: studentData.email,
          phone: studentData.phone,
          role: 'STUDENT',
          password: '$2a$10$defaultpassword', // Default password
          isActive: true
        }
      });

      // Create student
      const student = await prisma.student.create({
        data: {
          userId: user.id,
          schoolId: school.id,
          classId: classRecord.id,
          admissionNumber: studentData.admissionNumber,
          academicYearId: academicYear.id,
          isActive: true
        }
      });

      createdStudents.push({ user, student });
      logSetup('STUDENT_CREATED', {
        studentId: student.id,
        userId: user.id,
        studentName: user.name,
        admissionNumber: student.admissionNumber
      });
    }

    // Step 8: Create sample parents
    logSetup('STEP_8', 'Creating sample parents...');
    const sampleParents = [
      {
        firstName: 'Robert',
        lastName: 'Doe',
        email: 'robert.doe@parent.com',
        phone: '+254700000101'
      },
      {
        firstName: 'Sarah',
        lastName: 'Smith',
        email: 'sarah.smith@parent.com',
        phone: '+254700000102'
      },
      {
        firstName: 'David',
        lastName: 'Johnson',
        email: 'david.johnson@parent.com',
        phone: '+254700000103'
      }
    ];

    for (let i = 0; i < sampleParents.length; i++) {
      const parentData = sampleParents[i];
      const student = createdStudents[i];

      // Create parent user
      const parentUser = await prisma.user.create({
        data: {
          name: `${parentData.firstName} ${parentData.lastName}`,
          email: parentData.email,
          phone: parentData.phone,
          role: 'PARENT',
          password: '$2a$10$defaultpassword', // Default password
          isActive: true
        }
      });

      // Create parent
      const parent = await prisma.parent.create({
        data: {
          userId: parentUser.id,
          schoolId: school.id,
          studentId: student.student.id,
          relationship: 'Parent',
          isActive: true
        }
      });

      logSetup('PARENT_CREATED', {
        parentId: parent.id,
        userId: parentUser.id,
        parentName: parentUser.name,
        studentName: student.user.name
      });
    }

    logSetup('SUCCESS', 'Sample data created successfully!');

    // Summary
    console.log('\n📊 SAMPLE DATA SETUP SUMMARY:');
    console.log('================================');
    console.log(`🏫 School: ${school.name} (${school.code})`);
    console.log(`📚 Grade: ${grade.name}`);
    console.log(`👥 Class: ${classRecord.name}`);
    console.log(`📅 Academic Year: ${academicYear.name}`);
    console.log(`📝 Terms: ${terms.join(', ')}`);
    console.log(`💰 Fee Structures: ${feeStructures.length} created`);
    console.log(`👤 Students: ${createdStudents.length} created`);
    console.log(`👨‍👩‍👧‍👦 Parents: ${sampleParents.length} created`);
    console.log('================================\n');

    console.log('🎯 Sample Students:');
    createdStudents.forEach((student, index) => {
      console.log(`${index + 1}. ${student.user.name} (${student.student.admissionNumber})`);
    });

    console.log('\n✅ Sample data setup completed! You can now run the payment flow test.');
    console.log('💡 Run: node test-payment-flow.js');

  } catch (error) {
    logSetup('ERROR', error, 'error');
    console.error('❌ Sample data setup failed:', error.message);
  } finally {
    await prisma.$disconnect();
    logSetup('END', 'Setup completed, database disconnected');
  }
}

// Run the setup
if (require.main === module) {
  addSampleStudents();
}

module.exports = { addSampleStudents }; 