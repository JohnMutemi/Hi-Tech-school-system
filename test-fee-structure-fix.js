const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFeeStructureCreation() {
  try {
    console.log('🔍 Testing fee structure creation with proper grade IDs...');
    
    // Get the school code from the database
    const school = await prisma.school.findFirst();
    if (!school) {
      console.log('❌ No school found in database');
      return;
    }
    
    console.log(`✅ Found school: ${school.name} (${school.code})`);
    
    // Get Grade 1 for this school
    const grade1 = await prisma.grade.findFirst({
      where: {
        name: 'Grade 1',
        schoolId: school.id
      }
    });
    
    if (!grade1) {
      console.log('❌ No Grade 1 found for this school');
      return;
    }
    
    console.log(`✅ Found Grade 1: ${grade1.name} (ID: ${grade1.id})`);
    
    // Get current academic year
    const academicYear = await prisma.academicYear.findFirst({
      where: {
        schoolId: school.id,
        isCurrent: true
      }
    });
    
    if (!academicYear) {
      console.log('❌ No current academic year found');
      return;
    }
    
    console.log(`✅ Found academic year: ${academicYear.name} (ID: ${academicYear.id})`);
    
    // Get current term
    const term = await prisma.term.findFirst({
      where: {
        academicYearId: academicYear.id,
        isCurrent: true
      }
    });
    
    if (!term) {
      console.log('❌ No current term found');
      return;
    }
    
    console.log(`✅ Found term: ${term.name} (ID: ${term.id})`);
    
    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        schoolId: school.id,
        role: 'admin'
      }
    });
    
    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }
    
    console.log(`✅ Found admin user: ${adminUser.name}`);
    
    // Test creating a fee structure
    console.log('\n🧪 Testing fee structure creation...');
    
    const feeStructure = await prisma.termlyFeeStructure.create({
      data: {
        term: term.name,
        year: parseInt(academicYear.name),
        gradeId: grade1.id,
        totalAmount: 50000,
        breakdown: {
          "Tuition": 30000,
          "Library": 5000,
          "Sports": 5000,
          "Development": 10000
        },
        isActive: true,
        createdBy: adminUser.id,
        schoolId: school.id,
        academicYearId: academicYear.id,
        termId: term.id,
      },
      include: {
        grade: true,
        creator: true,
        academicYear: true,
        termRef: true,
      }
    });
    
    console.log('✅ Fee structure created successfully!');
    console.log(`   - ID: ${feeStructure.id}`);
    console.log(`   - Grade: ${feeStructure.grade.name}`);
    console.log(`   - Total Amount: ${feeStructure.totalAmount}`);
    console.log(`   - Term: ${feeStructure.term}`);
    console.log(`   - Year: ${feeStructure.year}`);
    
    // Clean up - delete the test fee structure
    await prisma.termlyFeeStructure.delete({
      where: { id: feeStructure.id }
    });
    
    console.log('🧹 Test fee structure cleaned up');
    console.log('\n🎉 Test completed successfully! The foreign key constraint issue has been resolved.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFeeStructureCreation(); 