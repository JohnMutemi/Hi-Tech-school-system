const fetch = require('node-fetch');

async function createTestSchool() {
  console.log('🏫 Creating Test School');
  console.log('=' .repeat(50));
  
  const schoolData = {
    name: "Test School",
    code: "test-school",
    email: "test@school.com",
    phone: "1234567890",
    address: "Test Address, Test City",
    website: "https://testschool.com",
    principalName: "Test Principal",
    principalEmail: "principal@testschool.com",
    principalPhone: "1234567891"
  };
  
  try {
    console.log('📝 Creating school with data:', schoolData);
    
    const res = await fetch('http://localhost:3000/api/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schoolData)
    });
    
    console.log(`API Status: ${res.status}`);
    
    if (!res.ok) {
      console.log('❌ Failed to create school');
      const errorText = await res.text();
      console.log('Error:', errorText);
      return;
    }
    
    const createdSchool = await res.json();
    console.log('✅ School created successfully!');
    console.log('📊 School details:');
    console.log(`   Name: ${createdSchool.name}`);
    console.log(`   Code: ${createdSchool.code}`);
    console.log(`   ID: ${createdSchool.id}`);
    console.log(`   Email: ${createdSchool.email}`);
    
    console.log('\n🎉 Now you can run: node check-grades.js test-school');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestSchool(); 