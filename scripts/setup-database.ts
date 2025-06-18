import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Create connection pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Create drizzle instance
    const db = drizzle(pool, { schema });

    // Create tables
    console.log('Creating tables...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        school_id UUID REFERENCES schools(id),
        phone TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS schools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        address TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        logo TEXT,
        color_theme TEXT DEFAULT '#3b82f6',
        description TEXT,
        admin_first_name TEXT,
        admin_last_name TEXT,
        admin_email TEXT,
        admin_password TEXT,
        status TEXT DEFAULT 'active',
        profile TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        school_id UUID REFERENCES schools(id) NOT NULL,
        teacher_id UUID REFERENCES users(id),
        level TEXT,
        capacity INTEGER,
        current_students INTEGER DEFAULT 0,
        academic_year TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL,
        school_id UUID REFERENCES schools(id) NOT NULL,
        class_id UUID REFERENCES classes(id),
        admission_number TEXT NOT NULL,
        date_of_birth TEXT,
        gender TEXT,
        parent_name TEXT,
        parent_phone TEXT,
        parent_email TEXT,
        address TEXT,
        date_admitted TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS teachers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL,
        school_id UUID REFERENCES schools(id) NOT NULL,
        employee_id TEXT NOT NULL,
        qualification TEXT,
        date_joined TEXT,
        subjects TEXT,
        classes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        description TEXT,
        school_id UUID REFERENCES schools(id) NOT NULL,
        teacher_id UUID REFERENCES teachers(id),
        classes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS fee_structures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID REFERENCES schools(id) NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        frequency TEXT NOT NULL,
        due_date TEXT,
        academic_year TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS student_fees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) NOT NULL,
        fee_structure_id UUID REFERENCES fee_structures(id) NOT NULL,
        school_id UUID REFERENCES schools(id) NOT NULL,
        amount REAL NOT NULL,
        balance REAL NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        academic_year TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) NOT NULL,
        school_id UUID REFERENCES schools(id) NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        reference_number TEXT,
        transaction_id TEXT,
        status TEXT DEFAULT 'pending',
        payment_date TIMESTAMP DEFAULT NOW(),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_id UUID REFERENCES payments(id) NOT NULL,
        student_id UUID REFERENCES students(id) NOT NULL,
        school_id UUID REFERENCES schools(id) NOT NULL,
        receipt_number TEXT NOT NULL UNIQUE,
        amount REAL NOT NULL,
        generated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS fee_statements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) NOT NULL,
        school_id UUID REFERENCES schools(id) NOT NULL,
        period TEXT NOT NULL,
        total_fees REAL NOT NULL,
        total_paid REAL NOT NULL,
        balance REAL NOT NULL,
        statement_date TIMESTAMP DEFAULT NOW(),
        academic_year TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed!');
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupDatabase(); 