const fs = require('fs');

// Update the teacher API to use default password
const teacherApiPath = 'app/api/schools/[schoolCode]/teachers/route.ts';

try {
  let content = fs.readFileSync(teacherApiPath, 'utf8');
  
  // Replace the validation to not require tempPassword
  content = content.replace(
    "const { name, email, phone, qualification, dateJoined, tempPassword } = body;",
    "const { name, email, phone, qualification, dateJoined } = body;"
  );
  
  content = content.replace(
    "if (!name || !email || !tempPassword) {",
    "if (!name || !email) {"
  );
  
  content = content.replace(
    "const hashedPassword = await bcrypt.hash(tempPassword, 12);",
    "// Use default teacher password\n    const teacherDefaultPassword = 'teacher123';\n    const hashedPassword = await bcrypt.hash(teacherDefaultPassword, 12);"
  );
  
  content = content.replace(
    "tempPassword,",
    "tempPassword: teacherDefaultPassword, // Store the plain text default password for reference"
  );
  
  // Add mustChangePassword field
  content = content.replace(
    "role: 'teacher',",
    "role: 'teacher',\n        mustChangePassword: true, // Force password change on first login"
  );
  
  // Update the return statement to include the default password
  content = content.replace(
    "return NextResponse.json(newTeacher, { status: 201 });",
    "// Return the teacher with the default password for display\n    return NextResponse.json({\n      ...newTeacher,\n      tempPassword: teacherDefaultPassword, // Return the plain text default password\n    }, { status: 201 });"
  );
  
  fs.writeFileSync(teacherApiPath, content, 'utf8');
  console.log('✅ Successfully updated teacher API to use default password');
  
} catch (error) {
  console.error('❌ Error updating teacher API:', error.message);
} 