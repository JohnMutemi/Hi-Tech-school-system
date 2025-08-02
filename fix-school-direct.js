const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSchoolDirect() {
  console.log('🔧 Fixing School Directly in Database');
  console.log('=' .repeat(50));
  
  try {
    // Find the existing school
    console.log('1. Finding existing school...');
    const existingSchool = await prisma.school.findFirst();
    
    if (!existingSchool) {
      console.log('❌ No school found in database');
      return;
    }
    
    console.log('✅ Found school:', existingSchool.name);
    console.log('   ID:', existingSchool.id);
    console.log('   Current code:', existingSchool.code || 'MISSING');
    console.log('   Current email:', existingSchool.email || 'MISSING');
    
    // Update the school directly in database
    console.log('\n2. Updating school in database...');
    const updatedSchool = await prisma.school.update({
      where: { id: existingSchool.id },
      data: {
        code: "lillian-ayala", // Change from "amet velit tempora" to proper school code
        email: "siqurityhi@mailinator.com",
        phone: existingSchool.phone || "1234567890",
        address: existingSchool.address || "School Address",
        website: existingSchool.website || "https://lillianayala.com",
        principalName: existingSchool.principalName || "Principal Name",
        principalEmail: existingSchool.principalEmail || "principal@lillianayala.com",
        principalPhone: existingSchool.principalPhone || "1234567891"
      }
    });
    
    console.log('✅ School updated successfully!');
    console.log('📊 Updated school details:');
    console.log(`   Name: ${updatedSchool.name}`);
    console.log(`   Code: ${updatedSchool.code}`);
    console.log(`   Email: ${updatedSchool.email}`);
    console.log(`   ID: ${updatedSchool.id}`);
    
    console.log('\n🎉 Now you can run: node check-grades.js lillian-ayala');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixSchoolDirect(); 