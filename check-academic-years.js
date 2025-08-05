const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAcademicYears() {
  try {
    console.log('🔍 Checking academic years in database...');
    
    // Get all schools
    const schools = await prisma.school.findMany();
    console.log(`Found ${schools.length} schools`);
    
    for (const school of schools) {
      console.log(`\n📚 School: ${school.name} (${school.code})`);
      
      // Check academic years for this school
      const academicYears = await prisma.academicYear.findMany({
        where: { schoolId: school.id }
      });
      
      console.log(`   Academic years: ${academicYears.length}`);
      academicYears.forEach(year => {
        console.log(`   - ${year.name} (ID: ${year.id}, Current: ${year.isCurrent})`);
      });
      
      // Check if there's a current academic year
      const currentYear = await prisma.academicYear.findFirst({
        where: {
          schoolId: school.id,
          isCurrent: true
        }
      });
      
      if (!currentYear) {
        console.log(`   ❌ No current academic year found for ${school.name}`);
        
        // Create a current academic year
        const currentYearName = new Date().getFullYear().toString();
        const newAcademicYear = await prisma.academicYear.create({
          data: {
            name: currentYearName,
            schoolId: school.id,
            isCurrent: true,
            startDate: new Date(`${currentYearName}-01-01`),
            endDate: new Date(`${currentYearName}-12-31`)
          }
        });
        
        console.log(`   ✅ Created current academic year: ${newAcademicYear.name} (ID: ${newAcademicYear.id})`);
        
        // Create terms for this academic year
        const terms = [
          { name: 'Term 1', startDate: new Date(`${currentYearName}-01-01`), endDate: new Date(`${currentYearName}-03-31`), isCurrent: true },
          { name: 'Term 2', startDate: new Date(`${currentYearName}-04-01`), endDate: new Date(`${currentYearName}-07-31`), isCurrent: false },
          { name: 'Term 3', startDate: new Date(`${currentYearName}-08-01`), endDate: new Date(`${currentYearName}-12-31`), isCurrent: false }
        ];
        
        for (const termData of terms) {
          const term = await prisma.term.create({
            data: {
              ...termData,
              academicYearId: newAcademicYear.id
            }
          });
          console.log(`   ✅ Created term: ${term.name} (ID: ${term.id}, Current: ${term.isCurrent})`);
        }
      } else {
        console.log(`   ✅ Current academic year: ${currentYear.name} (ID: ${currentYear.id})`);
        
        // Check terms for this academic year
        const terms = await prisma.term.findMany({
          where: { academicYearId: currentYear.id }
        });
        
        console.log(`   Terms: ${terms.length}`);
        terms.forEach(term => {
          console.log(`   - ${term.name} (ID: ${term.id}, Current: ${term.isCurrent})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAcademicYears(); 