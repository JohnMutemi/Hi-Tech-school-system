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
    const dropPath = path.join(__dirname, 'drop-all-tables.sql');
    const dropSQL = fs.readFileSync(dropPath, 'utf8');
    
    const dropStatements = dropSQL.split(/;\s*$/m).filter(stmt => stmt.trim());
    console.log(`Found ${dropStatements.length} drop statements`);
    
    for (const statement of dropStatements) {
      console.log('Executing drop statement:', statement.trim());
      await sql.unsafe(statement);
    }
    
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, '001-create-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    const createStatements = migrationSQL.split(/;\s*$/m).filter(stmt => stmt.trim());
    console.log(`Found ${createStatements.length} create statements`);
    
    console.log('Running migration...');
    for (const statement of createStatements) {
      console.log('Executing create statement:', statement.trim().substring(0, 50) + '...');
      await sql.unsafe(statement);
    }
    
    console.log('Migration completed successfully!');
    
    // Verify tables were created
    console.log('Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `;
    
    console.log('Created tables:', tables.map(t => t.table_name));
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations(); 