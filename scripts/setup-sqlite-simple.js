const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function setupDatabase() {
  let db;
  
  try {
    console.log('🔧 Setting up SQLite database...');
    
    // Open database
    db = await open({
      filename: 'edusms.db',
      driver: sqlite3.Database
    });
    
    // Create tables
    await db.exec(`
      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        school_id TEXT,
        phone TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT
      );

      -- Create schools table
      CREATE TABLE IF NOT EXISTS schools (
        id TEXT PRIMARY KEY,
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
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT
      );

      -- Create classes table
      CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        school_id TEXT NOT NULL,
        teacher_id TEXT,
        level TEXT,
        capacity INTEGER,
        current_students INTEGER DEFAULT 0,
        academic_year TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (school_id) REFERENCES schools (id),
        FOREIGN KEY (teacher_id) REFERENCES users (id)
      );

      -- Create students table
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        school_id TEXT NOT NULL,
        class_id TEXT,
        admission_number TEXT NOT NULL,
        date_of_birth TEXT,
        gender TEXT,
        parent_name TEXT,
        parent_phone TEXT,
        parent_email TEXT,
        address TEXT,
        date_admitted TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (school_id) REFERENCES schools (id),
        FOREIGN KEY (class_id) REFERENCES classes (id)
      );

      -- Create fee_structures table
      CREATE TABLE IF NOT EXISTS fee_structures (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        frequency TEXT NOT NULL,
        due_date TEXT,
        academic_year TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (school_id) REFERENCES schools (id)
      );

      -- Create student_fees table
      CREATE TABLE IF NOT EXISTS student_fees (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        fee_structure_id TEXT NOT NULL,
        school_id TEXT NOT NULL,
        amount REAL NOT NULL,
        balance REAL NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        academic_year TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (student_id) REFERENCES students (id),
        FOREIGN KEY (fee_structure_id) REFERENCES fee_structures (id),
        FOREIGN KEY (school_id) REFERENCES schools (id)
      );

      -- Create payments table
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        school_id TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        reference_number TEXT,
        transaction_id TEXT,
        status TEXT DEFAULT 'pending',
        payment_date TEXT,
        notes TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (student_id) REFERENCES students (id),
        FOREIGN KEY (school_id) REFERENCES schools (id)
      );

      -- Create receipts table
      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        payment_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        school_id TEXT NOT NULL,
        receipt_number TEXT NOT NULL UNIQUE,
        amount REAL NOT NULL,
        generated_at TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (payment_id) REFERENCES payments (id),
        FOREIGN KEY (student_id) REFERENCES students (id),
        FOREIGN KEY (school_id) REFERENCES schools (id)
      );
    `);

    console.log('✅ Database tables created successfully!');
    
    // Insert sample data
    await insertSampleData(db);
    
    console.log('✅ Sample data inserted successfully!');
    console.log('🎉 Database setup completed!');
    console.log('📁 Database file: edusms.db');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

async function insertSampleData(db) {
  try {
    console.log('📝 Inserting sample data...');
    
    const now = new Date().toISOString();
    
    // Insert sample schools
    const schools = [
      {
        id: crypto.randomUUID(),
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
        description: 'A prestigious Catholic school with excellent academic standards',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
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
        description: 'Modern academy focusing on STEM education and innovation',
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const school of schools) {
      await db.run(`
        INSERT INTO schools (id, name, code, address, phone, email, admin_email, admin_password, admin_first_name, admin_last_name, status, color_theme, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        school.id, school.name, school.code, school.address, school.phone, school.email,
        school.adminEmail, school.adminPassword, school.adminFirstName, school.adminLastName,
        school.status, school.colorTheme, school.description, school.createdAt, school.updatedAt
      ]);
    }

    console.log('✅ Schools inserted:', schools.length);

    // Insert sample users
    const users = [
      {
        id: crypto.randomUUID(),
        name: 'John Smith',
        email: 'admin@stmarys.edu',
        password: 'admin123',
        role: 'admin',
        schoolId: schools[0].id,
        phone: '+1-555-0123',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        name: 'Maria Garcia',
        email: 'admin@brighton.edu',
        password: 'admin123',
        role: 'admin',
        schoolId: schools[1].id,
        phone: '+1-555-0456',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        name: 'Emma Wilson',
        email: 'emma.wilson@student.stmarys.edu',
        password: 'student123',
        role: 'student',
        schoolId: schools[0].id,
        phone: '+1-555-0201',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        name: 'James Davis',
        email: 'james.davis@student.stmarys.edu',
        password: 'student123',
        role: 'student',
        schoolId: schools[0].id,
        phone: '+1-555-0203',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@student.brighton.edu',
        password: 'student123',
        role: 'student',
        schoolId: schools[1].id,
        phone: '+1-555-0401',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        name: 'Sophia Kim',
        email: 'sophia.kim@student.brighton.edu',
        password: 'student123',
        role: 'student',
        schoolId: schools[1].id,
        phone: '+1-555-0403',
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const user of users) {
      await db.run(`
        INSERT INTO users (id, name, email, password, role, school_id, phone, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id, user.name, user.email, user.password, user.role, user.schoolId, user.phone,
        user.createdAt, user.updatedAt
      ]);
    }

    console.log('✅ Users inserted:', users.length);

    // Insert sample classes
    const classes = [
      {
        id: crypto.randomUUID(),
        name: 'Grade 11A',
        schoolId: schools[0].id,
        level: 'Secondary',
        capacity: 30,
        currentStudents: 28,
        academicYear: '2024-2025',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        name: 'Grade 10B',
        schoolId: schools[0].id,
        level: 'Secondary',
        capacity: 25,
        currentStudents: 22,
        academicYear: '2024-2025',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        name: 'Grade 12A',
        schoolId: schools[1].id,
        level: 'Secondary',
        capacity: 25,
        currentStudents: 20,
        academicYear: '2024-2025',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        name: 'Grade 10A',
        schoolId: schools[1].id,
        level: 'Secondary',
        capacity: 30,
        currentStudents: 25,
        academicYear: '2024-2025',
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const classItem of classes) {
      await db.run(`
        INSERT INTO classes (id, name, school_id, level, capacity, current_students, academic_year, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        classItem.id, classItem.name, classItem.schoolId, classItem.level, classItem.capacity,
        classItem.currentStudents, classItem.academicYear, classItem.createdAt, classItem.updatedAt
      ]);
    }

    console.log('✅ Classes inserted:', classes.length);

    // Insert sample students
    const students = [
      {
        id: crypto.randomUUID(),
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
        dateAdmitted: '2022-09-01',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
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
        dateAdmitted: '2023-09-01',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
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
        dateAdmitted: '2021-09-01',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
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
        dateAdmitted: '2023-09-01',
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const student of students) {
      await db.run(`
        INSERT INTO students (id, user_id, school_id, class_id, admission_number, date_of_birth, gender, parent_name, parent_phone, parent_email, address, date_admitted, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        student.id, student.userId, student.schoolId, student.classId, student.admissionNumber,
        student.dateOfBirth, student.gender, student.parentName, student.parentPhone, student.parentEmail,
        student.address, student.dateAdmitted, student.createdAt, student.updatedAt
      ]);
    }

    console.log('✅ Students inserted:', students.length);

    // Insert sample fee structures
    const feeStructures = [
      {
        id: crypto.randomUUID(),
        schoolId: schools[0].id,
        name: 'Tuition Fee',
        description: 'Monthly tuition fee',
        amount: 500.00,
        frequency: 'monthly',
        dueDate: '2024-01-31',
        academicYear: '2024-2025',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        schoolId: schools[0].id,
        name: 'Library Fee',
        description: 'Annual library membership',
        amount: 100.00,
        frequency: 'annually',
        dueDate: '2024-09-30',
        academicYear: '2024-2025',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        schoolId: schools[1].id,
        name: 'Tuition Fee',
        description: 'Monthly tuition fee',
        amount: 600.00,
        frequency: 'monthly',
        dueDate: '2024-01-31',
        academicYear: '2024-2025',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        schoolId: schools[1].id,
        name: 'Technology Fee',
        description: 'Annual technology fee',
        amount: 200.00,
        frequency: 'annually',
        dueDate: '2024-09-30',
        academicYear: '2024-2025',
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const feeStructure of feeStructures) {
      await db.run(`
        INSERT INTO fee_structures (id, school_id, name, description, amount, frequency, due_date, academic_year, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        feeStructure.id, feeStructure.schoolId, feeStructure.name, feeStructure.description,
        feeStructure.amount, feeStructure.frequency, feeStructure.dueDate, feeStructure.academicYear,
        feeStructure.createdAt, feeStructure.updatedAt
      ]);
    }

    console.log('✅ Fee structures inserted:', feeStructures.length);

    // Insert sample student fees
    const studentFees = [
      {
        id: crypto.randomUUID(),
        studentId: students.find(s => s.admissionNumber === 'STU001').id,
        feeStructureId: feeStructures.find(f => f.name === 'Tuition Fee' && f.schoolId === schools[0].id).id,
        schoolId: schools[0].id,
        amount: 500.00,
        balance: 500.00,
        dueDate: '2024-01-31',
        status: 'pending',
        academicYear: '2024-2025',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        studentId: students.find(s => s.admissionNumber === 'STU001').id,
        feeStructureId: feeStructures.find(f => f.name === 'Library Fee' && f.schoolId === schools[0].id).id,
        schoolId: schools[0].id,
        amount: 100.00,
        balance: 100.00,
        dueDate: '2024-09-30',
        status: 'pending',
        academicYear: '2024-2025',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        studentId: students.find(s => s.admissionNumber === 'STU002').id,
        feeStructureId: feeStructures.find(f => f.name === 'Tuition Fee' && f.schoolId === schools[0].id).id,
        schoolId: schools[0].id,
        amount: 500.00,
        balance: 300.00,
        dueDate: '2024-01-31',
        status: 'partial',
        academicYear: '2024-2025',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        studentId: students.find(s => s.admissionNumber === 'STU003').id,
        feeStructureId: feeStructures.find(f => f.name === 'Tuition Fee' && f.schoolId === schools[1].id).id,
        schoolId: schools[1].id,
        amount: 600.00,
        balance: 600.00,
        dueDate: '2024-01-31',
        status: 'pending',
        academicYear: '2024-2025',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        studentId: students.find(s => s.admissionNumber === 'STU004').id,
        feeStructureId: feeStructures.find(f => f.name === 'Tuition Fee' && f.schoolId === schools[1].id).id,
        schoolId: schools[1].id,
        amount: 600.00,
        balance: 0.00,
        dueDate: '2024-01-31',
        status: 'paid',
        academicYear: '2024-2025',
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const studentFee of studentFees) {
      await db.run(`
        INSERT INTO student_fees (id, student_id, fee_structure_id, school_id, amount, balance, due_date, status, academic_year, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        studentFee.id, studentFee.studentId, studentFee.feeStructureId, studentFee.schoolId,
        studentFee.amount, studentFee.balance, studentFee.dueDate, studentFee.status, studentFee.academicYear,
        studentFee.createdAt, studentFee.updatedAt
      ]);
    }

    console.log('✅ Student fees inserted:', studentFees.length);

    // Insert sample payments
    const payments = [
      {
        id: crypto.randomUUID(),
        studentId: students.find(s => s.admissionNumber === 'STU002').id,
        schoolId: schools[0].id,
        amount: 200.00,
        paymentMethod: 'mpesa',
        referenceNumber: 'MPESA123456',
        status: 'completed',
        paymentDate: '2024-01-15',
        notes: 'Partial payment for tuition',
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        studentId: students.find(s => s.admissionNumber === 'STU004').id,
        schoolId: schools[1].id,
        amount: 600.00,
        paymentMethod: 'bank',
        referenceNumber: 'BANK789012',
        status: 'completed',
        paymentDate: '2024-01-10',
        notes: 'Full tuition payment',
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const payment of payments) {
      await db.run(`
        INSERT INTO payments (id, student_id, school_id, amount, payment_method, reference_number, status, payment_date, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        payment.id, payment.studentId, payment.schoolId, payment.amount, payment.paymentMethod,
        payment.referenceNumber, payment.status, payment.paymentDate, payment.notes,
        payment.createdAt, payment.updatedAt
      ]);
    }

    console.log('✅ Payments inserted:', payments.length);

    // Insert sample receipts
    const receipts = [
      {
        id: crypto.randomUUID(),
        paymentId: payments.find(p => p.amount === 200.00).id,
        studentId: students.find(s => s.admissionNumber === 'STU002').id,
        schoolId: schools[0].id,
        receiptNumber: 'RCP001',
        amount: 200.00,
        generatedAt: now,
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        paymentId: payments.find(p => p.amount === 600.00).id,
        studentId: students.find(s => s.admissionNumber === 'STU004').id,
        schoolId: schools[1].id,
        receiptNumber: 'RCP002',
        amount: 600.00,
        generatedAt: now,
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const receipt of receipts) {
      await db.run(`
        INSERT INTO receipts (id, payment_id, student_id, school_id, receipt_number, amount, generated_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        receipt.id, receipt.paymentId, receipt.studentId, receipt.schoolId, receipt.receiptNumber,
        receipt.amount, receipt.generatedAt, receipt.createdAt, receipt.updatedAt
      ]);
    }

    console.log('✅ Receipts inserted:', receipts.length);

  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
  }
}

// Run the setup
setupDatabase(); 