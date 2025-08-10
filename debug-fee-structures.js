const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFeeStructures() {
  try {
    console.log('🔍 Debugging fee structures...');
    
    // Get all schools
    const schools = await prisma.school.findMany();
    console.log(`Found ${schools.length} schools`);
    
    for (const school of schools) {
      console.log(`\n📚 School: ${school.name} (${school.code})`);
      
      // Check all fee structures for this school
      const allFeeStructures = await prisma.termlyFeeStructure.findMany({
        where: { schoolId: school.id },
        include: {
          grade: true,
          creator: true,
          academicYear: true,
          termRef: true,
        }
      });
      
      console.log(`   Total fee structures: ${allFeeStructures.length}`);
      
      if (allFeeStructures.length > 0) {
        allFeeStructures.forEach(fee => {
          console.log(`   - ID: ${fee.id}`);
          console.log(`     Grade: ${fee.grade?.name || 'No Grade'}`);
          console.log(`     Term: ${fee.term}`);
          console.log(`     Year: ${fee.year}`);
          console.log(`     Total Amount: ${fee.totalAmount}`);
          console.log(`     Is Active: ${fee.isActive}`);
          console.log(`     Creator: ${fee.creator?.name || 'No Creator'}`);
          console.log(`     Academic Year: ${fee.academicYear?.name || 'No Academic Year'}`);
          console.log(`     Term Ref: ${fee.termRef?.name || 'No Term Ref'}`);
          console.log('');
        });
      }
      
      // Check active fee structures only
      const activeFeeStructures = await prisma.termlyFeeStructure.findMany({
        where: { 
          schoolId: school.id,
          isActive: true 
        },
        include: {
          grade: true,
          creator: true,
          academicYear: true,
          termRef: true,
        }
      });
      
      console.log(`   Active fee structures: ${activeFeeStructures.length}`);
      
      // Test the exact query that the API uses
      console.log('\n🧪 Testing API query...');
      const apiQueryResult = await prisma.termlyFeeStructure.findMany({
        where: {
          schoolId: school.id,
          isActive: true
        },
        include: {
          grade: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          logs: {
            orderBy: {
              timestamp: 'desc'
            },
            take: 5,
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          academicYear: true,
          termRef: true,
        },
        orderBy: [
          { year: 'desc' },
          { term: 'asc' }
        ]
      });
      
      console.log(`   API query result: ${apiQueryResult.length} fee structures`);
      
      if (apiQueryResult.length > 0) {
        apiQueryResult.forEach(fee => {
          console.log(`   - ${fee.grade?.name || 'No Grade'} - ${fee.term} ${fee.year} - ${fee.totalAmount}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFeeStructures(); 