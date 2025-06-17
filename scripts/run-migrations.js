const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigrations() {
  try {
    console.log('Connecting to database...');
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('Dropping existing tables...');
    const dropPath = path.join(__dirname, 'drop-tables.sql');
    const dropSQL = fs.readFileSync(dropPath, 'utf8');
    
    for (const statement of dropSQL.split(/;\s*$/m)) {
      if (statement.trim()) {
        await sql.unsafe(statement);
      }
    }
    
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, '001-create-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration...');
    for (const statement of migrationSQL.split(/;\s*$/m)) {
      if (statement.trim()) {
        await sql.unsafe(statement);
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations(); 