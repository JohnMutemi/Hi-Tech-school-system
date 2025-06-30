const fetch = require('node-fetch');

async function debugClassesAndGrades(schoolCode) {
  const baseUrl = 'http://localhost:3000';

  console.log(`\n--- Fetching Grades for schoolCode=${schoolCode} ---`);
  const gradesRes = await fetch(`${baseUrl}/api/schools/${schoolCode}/grades`);
  const grades = await gradesRes.json();
  console.log('Grades:', grades);

  console.log(`\n--- Fetching Classes for schoolCode=${schoolCode} ---`);
  const classesRes = await fetch(`${baseUrl}/api/schools/${schoolCode}/classes`);
  const classes = await classesRes.json();
  console.log('Classes:', classes);

  // Print classes with grade names
  console.log('\n--- Classes with Grade Names ---');
  for (const cls of classes) {
    const grade = grades.find(g => g.id === cls.gradeId);
    console.log(`Class: ${cls.name}, Grade: ${grade ? grade.name : 'UNKNOWN'}, gradeId: ${cls.gradeId}`);
  }
}

async function printParentUsers(schoolCode) {
  const baseUrl = 'http://localhost:3000';
  console.log(`\n--- Fetching Parent Users for schoolCode=${schoolCode} ---`);
  const usersRes = await fetch(`${baseUrl}/api/schools/${schoolCode}/users?role=parent`);
  const users = await usersRes.json();
  users.forEach(user => {
    console.log(`Parent: name='${user.name}', phone='${user.phone}', email='${user.email}', role='${user.role}'`);
  });
}

// Change this to your actual school code
const schoolCode = 'alliance';
debugClassesAndGrades(schoolCode).then(() => printParentUsers(schoolCode)); 