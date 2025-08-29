const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestParentData() {
  try {
    console.log('🔧 Creating Test Parent Data...\n');
    
    // 1. Find the current school (Lillian Ayala)
    const school = await prisma.school.findFirst({
      where: {
        name: 'Lillian Ayala'
      }
    });
    
    if (!school) {
      console.log('❌ School not found');
      return;
    }
    
    console.log(`✅ Found school: ${school.name} (${school.code})`);
    console.log(`   - School ID: ${school.id}\n`);
    
    // 2. Check if there are already students
    const existingStudents = await prisma.student.count({
      where: { schoolId: school.id, isActive: true }
    });
    
    if (existingStudents > 0) {
      console.log(`⚠️  School already has ${existingStudents} students`);
      console.log('   Skipping data creation...');
      return;
    }
    
    // 3. Create test grades
    console.log('📚 Creating test grades...');
    
    const grade1 = await prisma.grade.create({
      data: {
        name: 'Grade 1',
        schoolId: school.id
      }
    });
    
    const grade2 = await prisma.grade.create({
      data: {
        name: 'Grade 2',
        schoolId: school.id
      }
    });
    
    console.log(`   ✅ Created grades: ${grade1.name}, ${grade2.name}`);
    
    // 4. Create test classes
    console.log('\n🏫 Creating test classes...');
    
    const class1A = await prisma.class.create({
      data: {
        name: 'Class 1A',
        schoolId: school.id,
        gradeId: grade1.id,
        isActive: true
      }
    });
    
    const class2A = await prisma.class.create({
      data: {
        name: 'Class 2A',
        schoolId: school.id,
        gradeId: grade2.id,
        isActive: true
      }
    });
    
    console.log(`   ✅ Created classes: ${class1A.name}, ${class2A.name}`);
    
    // 5. Create test parents
    console.log('\n👨‍👩‍👧‍👦 Creating test parents...');
    
    const parent1 = await prisma.user.create({
      data: {
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+254700000001',
        password: 'hashedpassword123', // In real app, this would be properly hashed
        role: 'parent',
        schoolId: school.id,
        isActive: true
      }
    });
    
    const parent2 = await prisma.user.create({
      data: {
        name: 'Mary Johnson',
        email: 'mary.johnson@email.com',
        phone: '+254700000002',
        password: 'hashedpassword456',
        role: 'parent',
        schoolId: school.id,
        isActive: true
      }
    });
    
    console.log(`   ✅ Created parents: ${parent1.name}, ${parent2.name}`);
    
    // 6. Create test students
    console.log('\n👶 Creating test students...');
    
    const student1 = await prisma.user.create({
      data: {
        name: 'Alice Smith',
        email: 'alice.smith@school.com',
        phone: '+254700000003',
        password: 'hashedpassword789',
        role: 'student',
        schoolId: school.id,
        isActive: true
      }
    });
    
    const student2 = await prisma.user.create({
      data: {
        name: 'Bob Johnson',
        email: 'bob.johnson@school.com',
        phone: '+254700000004',
        password: 'hashedpassword012',
        role: 'student',
        schoolId: school.id,
        isActive: true
      }
    });
    
    console.log(`   ✅ Created student users: ${student1.name}, ${student2.name}`);
    
    // 7. Create student profiles
    const studentProfile1 = await prisma.student.create({
      data: {
        userId: student1.id,
        schoolId: school.id,
        classId: class1A.id,
        admissionNumber: 'ADM001',
        dateOfBirth: new Date('2015-03-15'),
        parentId: parent1.id,
        parentName: parent1.name,
        parentPhone: parent1.phone,
        parentEmail: parent1.email,
        address: '123 Oak Street, Nairobi',
        gender: 'Female',
        status: 'active',
        isActive: true,
        dateAdmitted: new Date()
      }
    });
    
    const studentProfile2 = await prisma.student.create({
      data: {
        userId: student2.id,
        schoolId: school.id,
        classId: class2A.id,
        admissionNumber: 'ADM002',
        dateOfBirth: new Date('2014-07-22'),
        parentId: parent2.id,
        parentName: parent2.name,
        parentPhone: parent2.phone,
        parentEmail: parent2.email,
        address: '456 Pine Avenue, Nairobi',
        gender: 'Male',
        status: 'active',
        isActive: true,
        dateAdmitted: new Date()
      }
    });
    
    console.log(`   ✅ Created student profiles: ${studentProfile1.admissionNumber}, ${studentProfile2.admissionNumber}`);
    
    // 8. Create test fee structures
    console.log('\n💰 Creating test fee structures...');
    
    const feeStructure1 = await prisma.termlyFeeStructure.create({
      data: {
        schoolId: school.id,
        gradeId: grade1.id,
        term: 'Term 1',
        year: 2025,
        amount: 15000,
        totalAmount: 15000,
        isActive: true
      }
    });
    
    const feeStructure2 = await prisma.termlyFeeStructure.create({
      data: {
        schoolId: school.id,
        gradeId: grade2.id,
        term: 'Term 1',
        year: 2025,
        amount: 16000,
        totalAmount: 16000,
        isActive: true
      }
    });
    
    console.log(`   ✅ Created fee structures: Term 1 2025 for both grades`);
    
    // Note: Skipping payments and receipts creation as they require academic year and term IDs
    console.log('\n💡 Note: Skipping payments and receipts creation (requires academic year/term setup)');
    
    // 9. Summary
    console.log('\n📊 Test Data Creation Summary:');
    console.log(`   - School: ${school.name}`);
    console.log(`   - Grades: 2 (${grade1.name}, ${grade2.name})`);
    console.log(`   - Classes: 2 (${class1A.name}, ${class2A.name})`);
    console.log(`   - Parents: 2 (${parent1.name}, ${parent2.name})`);
    console.log(`   - Students: 2 (${student1.name}, ${student2.name})`);
    console.log(`   - Fee Structures: 2 (Term 1 2025)`);
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Test the parent dashboard with this data');
    console.log('   2. Login as one of the parents:');
    console.log(`      - Email: ${parent1.email} or ${parent2.email}`);
    console.log(`      - Password: hashedpassword123 or hashedpassword456`);
    console.log('   3. Verify that parents can see their children');
    console.log('   4. Test fee structure display');
    
    console.log('\n✅ Test data creation completed!');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    
    // If there's an error, try to clean up
    console.log('\n🧹 Attempting to clean up...');
    try {
      // You might want to add cleanup logic here
      console.log('   - Check the database for any partial data');
      console.log('   - Manually remove any created records if needed');
    } catch (cleanupError) {
      console.error('   - Cleanup failed:', cleanupError);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createTestParentData();
