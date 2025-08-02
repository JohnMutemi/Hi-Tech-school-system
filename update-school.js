const fetch = require('node-fetch');

async function updateSchool() {
  console.log('🏫 Updating Existing School');
  console.log('=' .repeat(50));
  
  try {
    // First, get the existing school
    console.log('1. Fetching existing school...');
    const getRes = await fetch('http://localhost:3000/api/schools');
    
    if (!getRes.ok) {
      console.log('❌ Failed to fetch schools');
      return;
    }
    
    const schools = await getRes.json();
    
    if (schools.length === 0) {
      console.log('❌ No schools found');
      return;
    }
    
    const existingSchool = schools[0]; // Get the first school
    console.log('✅ Found school:', existingSchool.name);
    console.log('   ID:', existingSchool.id);
    console.log('   Current code:', existingSchool.code || 'MISSING');
    
    // Update the school with missing fields
    const updateData = {
      ...existingSchool,
      code: "lillian-ayala", // Add the missing code
      email: "siqurityhi@mailinator.com", // Update email
      phone: "1234567890", // Add phone
      address: "School Address", // Add address
      website: "https://lillianayala.com", // Add website
      principalName: "Principal Name", // Add principal
      principalEmail: "principal@lillianayala.com", // Add principal email
      principalPhone: "1234567891" // Add principal phone
    };
    
    console.log('\n2. Updating school with missing fields...');
    console.log('   New code:', updateData.code);
    console.log('   New email:', updateData.email);
    
    const updateRes = await fetch(`http://localhost:3000/api/schools/${existingSchool.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    console.log(`   Update API Status: ${updateRes.status}`);
    
    if (!updateRes.ok) {
      console.log('❌ Failed to update school');
      const errorText = await updateRes.text();
      console.log('Error:', errorText);
      return;
    }
    
    const updatedSchool = await updateRes.json();
    console.log('✅ School updated successfully!');
    console.log('📊 Updated school details:');
    console.log(`   Name: ${updatedSchool.name}`);
    console.log(`   Code: ${updatedSchool.code}`);
    console.log(`   Email: ${updatedSchool.email}`);
    console.log(`   ID: ${updatedSchool.id}`);
    
    console.log('\n🎉 Now you can run: node check-grades.js lillian-ayala');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateSchool(); 