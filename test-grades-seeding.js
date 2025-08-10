const fetch = require('node-fetch');

async function testGradesSeeding() {
  const schoolCode = 'CAS3642'; // Using existing school code from database
  
  console.log('Testing grades seeding for school:', schoolCode);
  
  try {
    // First, try to fetch existing grades
    console.log('Fetching existing grades...');
    const fetchRes = await fetch(`http://localhost:3000/api/schools/${schoolCode}/grades`);
    const existingGrades = await fetchRes.json();
    console.log('Existing grades:', existingGrades);
    
    // If no grades, seed them
    if (!existingGrades || existingGrades.length === 0) {
      console.log('No grades found, seeding grades...');
      const seedRes = await fetch(`http://localhost:3000/api/schools/${schoolCode}/grades/seed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (seedRes.ok) {
        const seedData = await seedRes.json();
        console.log('Grades seeded successfully:', seedData);
      } else {
        console.error('Failed to seed grades');
      }
    } else {
      console.log('Grades already exist');
    }
    
    // Fetch grades again to confirm
    const finalRes = await fetch(`http://localhost:3000/api/schools/${schoolCode}/grades`);
    const finalGrades = await finalRes.json();
    console.log('Final grades:', finalGrades);
    
  } catch (error) {
    console.error('Error testing grades seeding:', error);
  }
}

testGradesSeeding(); 