const { execSync } = require('child_process');

console.log('🌱 Running seed script...');
console.log('========================');

try {
  // Run the seed script
  execSync('npx prisma db seed', { stdio: 'inherit' });
  
  console.log('');
  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📋 What was created:');
  console.log('   - Deleted all existing classes and grades');
  console.log('   - Created Grade 1-6 for all schools');
  console.log('   - Created default classes for each grade');
  console.log('   - Set academic year to 2025');
  console.log('');
  console.log('🎯 Next steps:');
  console.log('   1. Check your school portal');
  console.log('   2. Go to Subjects & Classes section');
  console.log('   3. You should see Grade 1-6 with default classes');
  console.log('   4. Add students and assign them to classes');
  console.log('   5. Set up fee structures for each grade');
  
} catch (error) {
  console.error('❌ Error running seed:', error.message);
  process.exit(1);
} 