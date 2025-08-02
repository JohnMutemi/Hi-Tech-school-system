const fetch = require('node-fetch');

async function checkGrades(schoolCode) {
  console.log(`🔍 Checking grades for school: ${schoolCode}`);
  console.log('=' .repeat(50));
  
  try {
    // Check if school exists first
    console.log('1. Checking if school exists...');
    const schoolRes = await fetch(`http://localhost:3000/api/schools/${schoolCode}`);
    console.log(`   School API Status: ${schoolRes.status}`);
    
    if (!schoolRes.ok) {
      console.log('   ❌ School not found!');
      console.log('   💡 You need to create the school first.');
      return;
    }
    
    const schoolData = await schoolRes.json();
    console.log('   ✅ School found:', schoolData.name);
    
    // Check grades
    console.log('\n2. Checking grades...');
    const gradesRes = await fetch(`http://localhost:3000/api/schools/${schoolCode}/grades`);
    console.log(`   Grades API Status: ${gradesRes.status}`);
    
    if (!gradesRes.ok) {
      console.log('   ❌ Failed to fetch grades');
      const errorText = await gradesRes.text();
      console.log('   Error:', errorText);
      return;
    }
    
    const gradesData = await gradesRes.json();
    console.log('   ✅ Grades fetched successfully');
    console.log(`   📊 Found ${gradesData.length} grades:`);
    
    if (gradesData.length === 0) {
      console.log('   ⚠️  No grades found. Seeding grades...');
      
      const seedRes = await fetch(`http://localhost:3000/api/schools/${schoolCode}/seed-grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`   Seed API Status: ${seedRes.status}`);
      
      if (seedRes.ok) {
        const seedData = await seedRes.json();
        console.log('   ✅ Grades seeded successfully');
        console.log(`   📊 Created ${seedData.grades?.length || 0} grades`);
        
        if (seedData.grades) {
          seedData.grades.forEach(grade => {
            console.log(`      - ${grade.name} (ID: ${grade.id})`);
          });
        }
      } else {
        const errorText = await seedRes.text();
        console.log('   ❌ Failed to seed grades:', errorText);
      }
    } else {
      gradesData.forEach(grade => {
        console.log(`      - ${grade.name} (ID: ${grade.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get school code from command line argument or use default
const schoolCode = process.argv[2] || 'test-school';
checkGrades(schoolCode); 