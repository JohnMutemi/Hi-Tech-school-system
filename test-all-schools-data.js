const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAllSchoolsData() {
  try {
    console.log('🔍 Testing All Schools Data...\n');
    
    // 1. Find all schools
    const allSchools = await prisma.school.findMany({
      where: { isActive: true }
    });
    
    console.log(`🏫 Found ${allSchools.length} active schools\n`);
    
    // 2. Check each school for users and students
    for (const school of allSchools) {
      console.log(`\n🏫 School: ${school.name} (${school.code})`);
      console.log(`   - School ID: ${school.id}`);
      
      // Count users by role
      const users = await prisma.user.findMany({
        where: { schoolId: school.id, isActive: true },
        select: { role: true }
      });
      
      const usersByRole = {};
      users.forEach(user => {
        usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;
      });
      
      console.log(`   - Users: ${users.length} total`);
      Object.entries(usersByRole).forEach(([role, count]) => {
        console.log(`     - ${role}: ${count}`);
      });
      
      // Count students
      const studentCount = await prisma.student.count({
        where: { schoolId: school.id, isActive: true }
      });
      
      console.log(`   - Students: ${studentCount}`);
      
      // If this school has students, show more details
      if (studentCount > 0) {
        const students = await prisma.student.findMany({
          where: { schoolId: school.id, isActive: true },
          include: {
            user: true,
            parent: {
              select: { name: true, role: true }
            }
          }
        });
        
        console.log(`   - Students with parent: ${students.filter(s => s.parentId).length}`);
        console.log(`   - Students without parent: ${students.filter(s => !s.parentId).length}`);
        
        // Show first few students
        students.slice(0, 3).forEach((student, index) => {
          console.log(`     ${index + 1}. ${student.user.name} (Parent: ${student.parent?.name || 'None'} - ${student.parent?.role || 'None'})`);
        });
        
        if (students.length > 3) {
          console.log(`     ... and ${students.length - 3} more`);
        }
      }
    }
    
    // 3. Check if there are any students at all in the system
    const totalStudents = await prisma.student.count({
      where: { isActive: true }
    });
    
    console.log(`\n📊 System-wide Summary:`);
    console.log(`   - Total students: ${totalStudents}`);
    
    if (totalStudents === 0) {
      console.log('\n⚠️  No students found in the entire system!');
      console.log('   This explains why the parent dashboard cannot see any children.');
      console.log('   You need to create students first before testing the parent dashboard.');
    }
    
    // 4. Check if there are any users with 'parent' role anywhere
    const totalParents = await prisma.user.count({
      where: { role: 'parent', isActive: true }
    });
    
    console.log(`   - Total users with 'parent' role: ${totalParents}`);
    
    // 5. Check for any orphaned students (students without valid school)
    // Note: schoolId is required in the schema, so this check is not needed
    
    console.log('\n✅ All schools data test completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAllSchoolsData();
