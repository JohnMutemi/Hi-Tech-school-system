const fetch = require('node-fetch');

async function listSchools() {
  console.log('🏫 Available Schools');
  console.log('=' .repeat(50));
  
  try {
    const res = await fetch('http://localhost:3000/api/schools');
    console.log(`API Status: ${res.status}`);
    
    if (!res.ok) {
      console.log('❌ Failed to fetch schools');
      const errorText = await res.text();
      console.log('Error:', errorText);
      return;
    }
    
    const schools = await res.json();
    console.log(`📊 Found ${schools.length} schools:\n`);
    
    if (schools.length === 0) {
      console.log('   No schools found in the database.');
      console.log('   💡 You need to create a school first.');
    } else {
      schools.forEach((school, index) => {
        console.log(`${index + 1}. ${school.name}`);
        console.log(`   Code: ${school.code}`);
        console.log(`   Email: ${school.email}`);
        console.log(`   ID: ${school.id}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listSchools(); 