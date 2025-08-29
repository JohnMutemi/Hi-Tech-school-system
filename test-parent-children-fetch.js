const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testParentChildrenFetch() {
  try {
    console.log('🔍 Testing Parent-Children Relationship and Data Fetching...\n');
    
    // 1. Find a school to test with
    const school = await prisma.school.findFirst({
      where: { isActive: true }
    });
    
    if (!school) {
      console.log('❌ No active school found');
      return;
    }
    
    console.log(`✅ School: ${school.name} (${school.code})`);
    console.log(`   - School ID: ${school.id}\n`);
    
    // 2. Check all users in the school and their roles
    const allUsers = await prisma.user.findMany({
      where: {
        schoolId: school.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true
      }
    });
    
    console.log(`👥 Found ${allUsers.length} total users in school`);
    
    // Group users by role
    const usersByRole = {};
    allUsers.forEach(user => {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(user);
    });
    
    console.log('\n📊 Users by Role:');
    Object.entries(usersByRole).forEach(([role, users]) => {
      console.log(`   - ${role}: ${users.length} users`);
    });
    
    // 3. Check all students in the school
    const allStudents = await prisma.student.findMany({
      where: {
        schoolId: school.id,
        isActive: true
      },
      include: {
        user: true,
        class: {
          include: {
            grade: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    console.log(`\n👶 Found ${allStudents.length} total students in school`);
    
    if (allStudents.length > 0) {
      console.log('\n📋 Student Details:');
      allStudents.slice(0, 5).forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.user.name}`);
        console.log(`      - Student ID: ${student.id}`);
        console.log(`      - Admission: ${student.admissionNumber}`);
        console.log(`      - Parent ID: ${student.parentId || 'None'}`);
        console.log(`      - Parent Name: ${student.parent?.name || 'None'}`);
        console.log(`      - Parent Role: ${student.parent?.role || 'None'}`);
        console.log(`      - Class: ${student.class?.name || 'Not Assigned'}`);
        console.log(`      - Grade: ${student.class?.grade?.name || 'Not Assigned'}`);
      });
      
      if (allStudents.length > 5) {
        console.log(`      ... and ${allStudents.length - 5} more students`);
      }
    }
    
    // 4. Check students with parent relationships
    const studentsWithParent = allStudents.filter(student => student.parentId);
    const studentsWithoutParent = allStudents.filter(student => !student.parentId);
    
    console.log(`\n🔗 Parent-Student Relationships:`);
    console.log(`   - Students with parent: ${studentsWithParent.length}`);
    console.log(`   - Students without parent: ${studentsWithoutParent.length}`);
    
    if (studentsWithParent.length > 0) {
      console.log('\n👨‍👩‍👧‍👦 Students with Parents:');
      studentsWithParent.slice(0, 3).forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.user.name} → Parent: ${student.parent?.name} (${student.parent?.role})`);
      });
    }
    
    if (studentsWithoutParent.length > 0) {
      console.log('\n⚠️  Students without Parents:');
      studentsWithoutParent.slice(0, 3).forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.user.name} (${student.admissionNumber})`);
      });
    }
    
    // 5. Check if there are users with 'parent' role
    const parentUsers = usersByRole['parent'] || [];
    console.log(`\n👨‍👩‍👧‍👦 Users with 'parent' role: ${parentUsers.length}`);
    
    if (parentUsers.length > 0) {
      console.log('\n📋 Parent Users:');
      parentUsers.forEach((parent, index) => {
        console.log(`   ${index + 1}. ${parent.name} (${parent.email})`);
      });
      
      // Test each parent user
      for (const parent of parentUsers) {
        console.log(`\n🔍 Testing Parent: ${parent.name} (${parent.id})`);
        
        // Find students for this parent
        const students = await prisma.student.findMany({
          where: {
            parentId: parent.id,
            schoolId: school.id,
            isActive: true
          },
          include: {
            user: true,
            class: {
              include: {
                grade: true
              }
            }
          }
        });
        
        console.log(`   - Children found: ${students.length}`);
        
        if (students.length > 0) {
          students.forEach((student, index) => {
            console.log(`   👶 Child ${index + 1}: ${student.user.name}`);
            console.log(`      - Student ID: ${student.id}`);
            console.log(`      - Admission: ${student.admissionNumber}`);
            console.log(`      - Class: ${student.class?.name || 'Not Assigned'}`);
            console.log(`      - Grade: ${student.class?.grade?.name || 'Not Assigned'}`);
          });
        }
      }
    }
    
    // 6. Check for users who might be parents but don't have the 'parent' role
    console.log('\n🔍 Checking for potential parent users...');
    
    // Look for users who have students but might not have 'parent' role
    const potentialParents = allUsers.filter(user => {
      const hasStudents = allStudents.some(student => student.parentId === user.id);
      return hasStudents && user.role !== 'parent';
    });
    
    if (potentialParents.length > 0) {
      console.log(`⚠️  Found ${potentialParents.length} users who have students but don't have 'parent' role:`);
      potentialParents.forEach(user => {
        const studentCount = allStudents.filter(student => student.parentId === user.id).length;
        console.log(`   - ${user.name} (${user.role}) has ${studentCount} students`);
      });
    }
    
    // 7. Test the API endpoint logic with actual data
    console.log('\n🔧 Testing API Endpoint Logic...');
    
    if (studentsWithParent.length > 0) {
      const testStudent = studentsWithParent[0];
      const testParent = testStudent.parent;
      
      console.log(`\n📡 Simulating API call for parent: ${testParent.name}`);
      
      const apiStudents = await prisma.student.findMany({
        where: {
          parentId: testParent.id,
          schoolId: school.id,
          isActive: true
        },
        include: {
          user: true,
          class: {
            include: {
              grade: true
            }
          }
        }
      });
      
      const apiResponse = {
        parent: {
          id: testParent.id,
          name: testParent.name,
          phone: testParent.phone || 'No phone',
          email: testParent.email,
        },
        students: apiStudents.map(student => ({
          id: student.id,
          userId: student.userId,
          admissionNumber: student.admissionNumber,
          name: student.user.name,
          phone: student.parentPhone,
          email: student.user.email,
          avatarUrl: student.avatarUrl,
          className: student.class?.name || 'Not Assigned',
          classId: student.classId,
          gradeId: student.class?.gradeId,
          gradeName: student.class?.grade?.name || 'Not Assigned',
          academicYear: student.class?.academicYear || 'Not Assigned',
          dateOfBirth: student.dateOfBirth,
          dateAdmitted: student.dateAdmitted,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          address: student.address,
          gender: student.gender,
          status: student.status
        }))
      };
      
      console.log('📋 API Response Structure:');
      console.log(JSON.stringify(apiResponse, null, 2));
    }
    
    console.log('\n✅ Parent-Children relationship test completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testParentChildrenFetch();
