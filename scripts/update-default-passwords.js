const fs = require('fs');
const path = require('path');

// Default passwords for different user types
const DEFAULT_PASSWORDS = {
  STUDENT: 'student123',
  PARENT: 'parent123',
  TEACHER: 'teacher123',
  SCHOOL_ADMIN: 'school123',
};

// Files to update
const filesToUpdate = [
  {
    path: 'app/api/schools/[schoolCode]/students/route.ts',
    changes: [
      {
        from: "if (!name || !email || !tempPassword || !className) {",
        to: "if (!name || !email || !className) {"
      },
      {
        from: "parentTempPassword = generateTempPassword();",
        to: "parentTempPassword = 'parent123'; // Default parent password"
      },
      {
        from: "const hashedPassword = await bcrypt.hash(tempPassword, 12);",
        to: "// Use default student password\n    const studentDefaultPassword = 'student123';\n    const hashedPassword = await bcrypt.hash(studentDefaultPassword, 12);"
      },
      {
        from: "tempPassword: tempPassword,",
        to: "tempPassword: studentDefaultPassword, // Return the plain text default password"
      }
    ]
  },
  {
    path: 'app/api/schools/[schoolCode]/teachers/route.ts',
    changes: [
      {
        from: "const { name, email, phone, qualification, dateJoined, tempPassword } = body;",
        to: "const { name, email, phone, qualification, dateJoined } = body;"
      },
      {
        from: "if (!name || !email || !tempPassword) {",
        to: "if (!name || !email) {"
      },
      {
        from: "const hashedPassword = await bcrypt.hash(tempPassword, 12);",
        to: "// Use default teacher password\n    const teacherDefaultPassword = 'teacher123';\n    const hashedPassword = await bcrypt.hash(teacherDefaultPassword, 12);"
      },
      {
        from: "tempPassword,",
        to: "tempPassword: teacherDefaultPassword, // Store the plain text default password for reference"
      }
    ]
  }
];

// Function to update a file
function updateFile(filePath, changes) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    changes.forEach(change => {
      if (content.includes(change.from)) {
        content = content.replace(change.from, change.to);
        updated = true;
        console.log(`Updated ${filePath}`);
      }
    });
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Successfully updated ${filePath}`);
    } else {
      console.log(`⚠️  No changes made to ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Update all files
console.log('🔄 Updating files to use default passwords...\n');

filesToUpdate.forEach(file => {
  updateFile(file.path, file.changes);
});

console.log('\n✅ Default password update script completed!');
console.log('\nDefault passwords:');
Object.entries(DEFAULT_PASSWORDS).forEach(([role, password]) => {
  console.log(`  ${role}: ${password}`);
}); 