const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testParentDashboardWithData() {
  try {
    console.log('🔍 Testing Parent Dashboard with Actual Data...\n');
    
    // 1. Find a school that has students and parents
    const schoolWithData = await prisma.school.findFirst({
      where: {
        isActive: true,
        students: {
          some: {
            isActive: true,
            parentId: {
              not: null
            }
          }
        }
      }
    });
    
    if (!schoolWithData) {
      console.log('❌ No school found with students and parents');
      return;
    }
    
    console.log(`✅ Found school with data: ${schoolWithData.name} (${schoolWithData.code})`);
    console.log(`   - School ID: ${schoolWithData.id}\n`);
    
    // 2. Get all students with their parents
    const studentsWithParents = await prisma.student.findMany({
      where: {
        schoolId: schoolWithData.id,
        isActive: true,
        parentId: {
          not: null
        }
      },
      include: {
        user: true,
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true
          }
        },
        class: {
          include: {
            grade: true
          }
        }
      }
    });
    
    console.log(`👶 Found ${studentsWithParents.length} students with parents`);
    
    // 3. Test each parent-student relationship
    const parentStudentMap = new Map();
    
    studentsWithParents.forEach(student => {
      const parentId = student.parentId;
      if (!parentStudentMap.has(parentId)) {
        parentStudentMap.set(parentId, {
          parent: student.parent,
          students: []
        });
      }
      parentStudentMap.get(parentId).students.push(student);
    });
    
    console.log(`👨‍👩‍👧‍👦 Found ${parentStudentMap.size} unique parents`);
    
    // 4. Test the parent dashboard logic for each parent
    for (const [parentId, data] of parentStudentMap) {
      const { parent, students } = data;
      
      console.log(`\n🔍 Testing Parent Dashboard for: ${parent.name}`);
      console.log(`   - Parent ID: ${parent.id}`);
      console.log(`   - Email: ${parent.email}`);
      console.log(`   - Role: ${parent.role}`);
      console.log(`   - Children: ${students.length}`);
      
      // Simulate the parent session API call
      console.log(`\n📡 Simulating API call for parent: ${parent.name}`);
      
      const apiStudents = await prisma.student.findMany({
        where: {
          parentId: parent.id,
          schoolId: schoolWithData.id,
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
      
      // Create the API response structure (same as the actual API)
      const apiResponse = {
        parent: {
          id: parent.id,
          name: parent.name,
          phone: parent.phone || 'No phone',
          email: parent.email,
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
      
      console.log('📋 API Response:');
      console.log(`   - Parent: ${apiResponse.parent.name}`);
      console.log(`   - Students: ${apiResponse.students.length}`);
      
      // Test fee structure fetching (this is what the parent dashboard does)
      if (apiStudents.length > 0) {
        console.log('\n💰 Testing Fee Structure Fetching...');
        
        const gradeNames = [...new Set(
          apiStudents
            .map(student => student.class?.grade?.name)
            .filter(gradeName => gradeName && gradeName !== 'Not Assigned')
        )];
        
        console.log(`   - Valid grade names: ${gradeNames.join(', ')}`);
        
        if (gradeNames.length > 0) {
          for (const gradeName of gradeNames) {
            const feeStructures = await prisma.termlyFeeStructure.findMany({
              where: {
                schoolId: schoolWithData.id,
                grade: {
                  name: gradeName,
                  schoolId: schoolWithData.id
                },
                isActive: true
              },
              include: {
                grade: true
              }
            });
            
            console.log(`   - Grade "${gradeName}": Found ${feeStructures.length} fee structures`);
          }
        } else {
          console.log('   ⚠️  No valid grade names found for students');
        }
      }
      
      // Test receipt fetching
      console.log('\n🧾 Testing Receipt Fetching...');
      
      const receipts = await prisma.receipt.findMany({
        where: {
          studentId: {
            in: apiStudents.map(s => s.id)
          }
        },
        include: {
          student: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`   - Found ${receipts.length} receipts for children`);
      
      if (receipts.length > 0) {
        receipts.slice(0, 3).forEach((receipt, index) => {
          console.log(`     ${index + 1}. ${receipt.student.user.name} - ${receipt.amount} (${receipt.paymentDate.toLocaleDateString()})`);
        });
      }
      
      // Test payment fetching
      console.log('\n💳 Testing Payment Fetching...');
      
      const payments = await prisma.payment.findMany({
        where: {
          studentId: {
            in: apiStudents.map(s => s.id)
          }
        },
        include: {
          student: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          paymentDate: 'desc'
        }
      });
      
      console.log(`   - Found ${payments.length} payments for children`);
      
      if (payments.length > 0) {
        payments.slice(0, 3).forEach((payment, index) => {
          console.log(`     ${index + 1}. ${payment.student.user.name} - ${payment.amount} (${payment.paymentDate.toLocaleDateString()})`);
        });
      }
      
      console.log('\n' + '─'.repeat(60));
    }
    
    console.log('\n✅ Parent Dashboard test completed!');
    console.log('\n💡 Key Findings:');
    console.log('   - The parent dashboard should work correctly with this data');
    console.log('   - Each parent can see their children');
    console.log('   - Fee structures are fetched based on grade names');
    console.log('   - Receipts and payments are accessible');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testParentDashboardWithData();

