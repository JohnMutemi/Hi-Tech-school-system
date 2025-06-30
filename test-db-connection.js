// Test database connection
const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Try to connect to the database
    await prisma.$connect();
    console.log('Database connection successful!');
    
    // Try a simple query
    const schoolCount = await prisma.school.count();
    console.log('Number of schools in database:', schoolCount);
    
    await prisma.$disconnect();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testDatabaseConnection(); 