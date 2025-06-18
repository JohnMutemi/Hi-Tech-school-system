const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { migrate } = require('drizzle-orm/better-sqlite3/migrator');

// Create SQLite database
const sqlite = new Database('edusms.db');
const db = drizzle(sqlite);

async function setupDatabase() {
  try {
    console.log('🔧 Setting up SQLite database...');
    
    // Create tables using Drizzle migrations
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Database tables created successfully!');
    
    // Insert sample data
    await insertSampleData();
    
    console.log('✅ Sample data inserted successfully!');
    console.log('🎉 Database setup completed!');
    console.log('📁 Database file: edusms.db');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    sqlite.close();
  }
}

async function insertSampleData() {
  try {
    console.log('📝 Inserting sample data...');
    
    // Insert sample schools
    const schools = await db.insert(schools).values([
      {
        name: 'St. Mary\'s High School',
        code: 'stmarys',
        address: '123 Education Street, City Center',
        phone: '+1-555-0123',
        email: 'admin@stmarys.edu',
        adminEmail: 'admin@stmarys.edu',
        adminPassword: 'admin123',
        adminFirstName: 'John',
        adminLastName: 'Smith',
        status: 'active',
        colorTheme: '#3B82F6',
        description: 'A prestigious Catholic school with excellent academic standards'
      },
      {
        name: 'Brighton Academy',
        code: 'brighton',
        address: '789 Innovation Drive, Tech District',
        phone: '+1-555-0456',
        email: 'admin@brighton.edu',
        adminEmail: 'admin@brighton.edu',
        adminPassword: 'admin123',
        adminFirstName: 'Maria',
        adminLastName: 'Garcia',
        status: 'active',
        colorTheme: '#10B981',
        description: 'Modern academy focusing on STEM education and innovation'
      }
    ]).returning();

    console.log('✅ Schools inserted:', schools.length);

    // Insert sample users
    const users = await db.insert(users).values([
      {
        name: 'John Smith',
        email: 'admin@stmarys.edu',
        password: 'admin123',
        role: 'admin',
        schoolId: schools[0].id,
        phone: '+1-555-0123'
      },
      {
        name: 'Maria Garcia',
        email: 'admin@brighton.edu',
        password: 'admin123',
        role: 'admin',
        schoolId: schools[1].id,
        phone: '+1-555-0456'
      },
      {
        name: 'Emma Wilson',
        email: 'emma.wilson@student.stmarys.edu',
        password: 'student123',
        role: 'student',
        schoolId: schools[0].id,
        phone: '+1-555-0201'
      },
      {
        name: 'James Davis',
        email: 'james.davis@student.stmarys.edu',
        password: 'student123',
        role: 'student',
        schoolId: schools[0].id,
        phone: '+1-555-0203'
      },
      {
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@student.brighton.edu',
        password: 'student123',
        role: 'student',
        schoolId: schools[1].id,
        phone: '+1-555-0401'
      },
      {
        name: 'Sophia Kim',
        email: 'sophia.kim@student.brighton.edu',
        password: 'student123',
        role: 'student',
        schoolId: schools[1].id,
        phone: '+1-555-0403'
      }
    ]).returning();

    console.log('✅ Users inserted:', users.length);

    // Insert sample classes
    const classes = await db.insert(classes).values([
      {
        name: 'Grade 11A',
        schoolId: schools[0].id,
        level: 'Secondary',
        capacity: 30,
        currentStudents: 28,
        academicYear: '2024-2025'
      },
      {
        name: 'Grade 10B',
        schoolId: schools[0].id,
        level: 'Secondary',
        capacity: 25,
        currentStudents: 22,
        academicYear: '2024-2025'
      },
      {
        name: 'Grade 12A',
        schoolId: schools[1].id,
        level: 'Secondary',
        capacity: 25,
        currentStudents: 20,
        academicYear: '2024-2025'
      },
      {
        name: 'Grade 10A',
        schoolId: schools[1].id,
        level: 'Secondary',
        capacity: 30,
        currentStudents: 25,
        academicYear: '2024-2025'
      }
    ]).returning();

    console.log('✅ Classes inserted:', classes.length);

    // Insert sample students
    const students = await db.insert(students).values([
      {
        userId: users.find(u => u.email === 'emma.wilson@student.stmarys.edu').id,
        schoolId: schools[0].id,
        classId: classes.find(c => c.name === 'Grade 11A').id,
        admissionNumber: 'STU001',
        dateOfBirth: '2007-03-15',
        gender: 'female',
        parentName: 'Mr. & Mrs. Wilson',
        parentPhone: '+1-555-0202',
        parentEmail: 'parents.wilson@email.com',
        address: '456 Student Lane, City Center',
        dateAdmitted: '2022-09-01'
      },
      {
        userId: users.find(u => u.email === 'james.davis@student.stmarys.edu').id,
        schoolId: schools[0].id,
        classId: classes.find(c => c.name === 'Grade 10B').id,
        admissionNumber: 'STU002',
        dateOfBirth: '2008-07-22',
        gender: 'male',
        parentName: 'Mrs. Davis',
        parentPhone: '+1-555-0204',
        parentEmail: 'mrs.davis@email.com',
        address: '789 Learning Street, City Center',
        dateAdmitted: '2023-09-01'
      },
      {
        userId: users.find(u => u.email === 'alex.rodriguez@student.brighton.edu').id,
        schoolId: schools[1].id,
        classId: classes.find(c => c.name === 'Grade 12A').id,
        admissionNumber: 'STU003',
        dateOfBirth: '2006-11-08',
        gender: 'male',
        parentName: 'Mr. & Mrs. Rodriguez',
        parentPhone: '+1-555-0402',
        parentEmail: 'rodriguez.family@email.com',
        address: '321 Future Street, Tech District',
        dateAdmitted: '2021-09-01'
      },
      {
        userId: users.find(u => u.email === 'sophia.kim@student.brighton.edu').id,
        schoolId: schools[1].id,
        classId: classes.find(c => c.name === 'Grade 10A').id,
        admissionNumber: 'STU004',
        dateOfBirth: '2008-05-12',
        gender: 'female',
        parentName: 'Mr. & Mrs. Kim',
        parentPhone: '+1-555-0404',
        parentEmail: 'kim.family@email.com',
        address: '654 Tech Avenue, Tech District',
        dateAdmitted: '2023-09-01'
      }
    ]).returning();

    console.log('✅ Students inserted:', students.length);

    // Insert sample fee structures
    const feeStructures = await db.insert(feeStructures).values([
      {
        schoolId: schools[0].id,
        name: 'Tuition Fee',
        description: 'Monthly tuition fee',
        amount: 500.00,
        frequency: 'monthly',
        dueDate: '2024-01-31',
        academicYear: '2024-2025'
      },
      {
        schoolId: schools[0].id,
        name: 'Library Fee',
        description: 'Annual library membership',
        amount: 100.00,
        frequency: 'annually',
        dueDate: '2024-09-30',
        academicYear: '2024-2025'
      },
      {
        schoolId: schools[1].id,
        name: 'Tuition Fee',
        description: 'Monthly tuition fee',
        amount: 600.00,
        frequency: 'monthly',
        dueDate: '2024-01-31',
        academicYear: '2024-2025'
      },
      {
        schoolId: schools[1].id,
        name: 'Technology Fee',
        description: 'Annual technology fee',
        amount: 200.00,
        frequency: 'annually',
        dueDate: '2024-09-30',
        academicYear: '2024-2025'
      }
    ]).returning();

    console.log('✅ Fee structures inserted:', feeStructures.length);

    // Insert sample student fees
    const studentFees = await db.insert(studentFees).values([
      {
        studentId: students.find(s => s.admissionNumber === 'STU001').id,
        feeStructureId: feeStructures.find(f => f.name === 'Tuition Fee' && f.schoolId === schools[0].id).id,
        schoolId: schools[0].id,
        amount: 500.00,
        balance: 500.00,
        dueDate: '2024-01-31',
        status: 'pending',
        academicYear: '2024-2025'
      },
      {
        studentId: students.find(s => s.admissionNumber === 'STU001').id,
        feeStructureId: feeStructures.find(f => f.name === 'Library Fee' && f.schoolId === schools[0].id).id,
        schoolId: schools[0].id,
        amount: 100.00,
        balance: 100.00,
        dueDate: '2024-09-30',
        status: 'pending',
        academicYear: '2024-2025'
      },
      {
        studentId: students.find(s => s.admissionNumber === 'STU002').id,
        feeStructureId: feeStructures.find(f => f.name === 'Tuition Fee' && f.schoolId === schools[0].id).id,
        schoolId: schools[0].id,
        amount: 500.00,
        balance: 300.00,
        dueDate: '2024-01-31',
        status: 'partial',
        academicYear: '2024-2025'
      },
      {
        studentId: students.find(s => s.admissionNumber === 'STU003').id,
        feeStructureId: feeStructures.find(f => f.name === 'Tuition Fee' && f.schoolId === schools[1].id).id,
        schoolId: schools[1].id,
        amount: 600.00,
        balance: 600.00,
        dueDate: '2024-01-31',
        status: 'pending',
        academicYear: '2024-2025'
      },
      {
        studentId: students.find(s => s.admissionNumber === 'STU004').id,
        feeStructureId: feeStructures.find(f => f.name === 'Tuition Fee' && f.schoolId === schools[1].id).id,
        schoolId: schools[1].id,
        amount: 600.00,
        balance: 0.00,
        dueDate: '2024-01-31',
        status: 'paid',
        academicYear: '2024-2025'
      }
    ]).returning();

    console.log('✅ Student fees inserted:', studentFees.length);

    // Insert sample payments
    const payments = await db.insert(payments).values([
      {
        studentId: students.find(s => s.admissionNumber === 'STU002').id,
        schoolId: schools[0].id,
        amount: 200.00,
        paymentMethod: 'mpesa',
        referenceNumber: 'MPESA123456',
        status: 'completed',
        paymentDate: '2024-01-15',
        notes: 'Partial payment for tuition'
      },
      {
        studentId: students.find(s => s.admissionNumber === 'STU004').id,
        schoolId: schools[1].id,
        amount: 600.00,
        paymentMethod: 'bank',
        referenceNumber: 'BANK789012',
        status: 'completed',
        paymentDate: '2024-01-10',
        notes: 'Full tuition payment'
      }
    ]).returning();

    console.log('✅ Payments inserted:', payments.length);

    // Insert sample receipts
    const receipts = await db.insert(receipts).values([
      {
        paymentId: payments.find(p => p.amount === 200.00).id,
        studentId: students.find(s => s.admissionNumber === 'STU002').id,
        schoolId: schools[0].id,
        receiptNumber: 'RCP001',
        amount: 200.00
      },
      {
        paymentId: payments.find(p => p.amount === 600.00).id,
        studentId: students.find(s => s.admissionNumber === 'STU004').id,
        schoolId: schools[1].id,
        receiptNumber: 'RCP002',
        amount: 600.00
      }
    ]).returning();

    console.log('✅ Receipts inserted:', receipts.length);

  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
  }
}

// Run the setup
setupDatabase();
