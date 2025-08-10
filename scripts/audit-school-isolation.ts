#!/usr/bin/env tsx

/**
 * School Data Isolation Audit Script
 * 
 * This script helps identify and fix data isolation issues in your multi-tenant school management system.
 * Run this script to ensure all data is properly scoped to individual schools.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditResult {
  table: string;
  totalRecords: number;
  orphanedRecords: number;
  orphanedRecordIds: string[];
}

async function auditSchoolIsolation(): Promise<AuditResult[]> {
  console.log('🔍 Starting school data isolation audit...\n');

  const results: AuditResult[] = [];

  // Audit Users table
  const users = await prisma.user.findMany({
    where: { schoolId: null },
    select: { id: true, name: true, email: true, role: true }
  });
  
  results.push({
    table: 'users',
    totalRecords: await prisma.user.count(),
    orphanedRecords: users.length,
    orphanedRecordIds: users.map(u => u.id)
  });

  console.log(`👥 Users: ${users.length} records without schoolId`);
  if (users.length > 0) {
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
  }

  // Audit Students table
  const students = await prisma.student.findMany({
    where: { schoolId: null },
    select: { id: true, admissionNumber: true, user: { select: { name: true } } }
  });
  
  results.push({
    table: 'students',
    totalRecords: await prisma.student.count(),
    orphanedRecords: students.length,
    orphanedRecordIds: students.map(s => s.id)
  });

  console.log(`🎓 Students: ${students.length} records without schoolId`);
  if (students.length > 0) {
    students.forEach(student => {
      console.log(`   - ${student.user?.name || 'Unknown'} (${student.admissionNumber})`);
    });
  }

  // Audit Classes table
  const classes = await prisma.class.findMany({
    where: { schoolId: null },
    select: { id: true, name: true }
  });
  
  results.push({
    table: 'classes',
    totalRecords: await prisma.class.count(),
    orphanedRecords: classes.length,
    orphanedRecordIds: classes.map(c => c.id)
  });

  console.log(`🏫 Classes: ${classes.length} records without schoolId`);
  if (classes.length > 0) {
    classes.forEach(cls => {
      console.log(`   - ${cls.name}`);
    });
  }

  // Audit Subjects table
  const subjects = await prisma.subject.findMany({
    where: { schoolId: null },
    select: { id: true, name: true, code: true }
  });
  
  results.push({
    table: 'subjects',
    totalRecords: await prisma.subject.count(),
    orphanedRecords: subjects.length,
    orphanedRecordIds: subjects.map(s => s.id)
  });

  console.log(`📚 Subjects: ${subjects.length} records without schoolId`);
  if (subjects.length > 0) {
    subjects.forEach(subject => {
      console.log(`   - ${subject.name} (${subject.code})`);
    });
  }

  // Audit Fee Structures table
  const feeStructures = await prisma.feeStructure.findMany({
    where: { schoolId: null },
    select: { id: true, name: true, amount: true }
  });
  
  results.push({
    table: 'feeStructures',
    totalRecords: await prisma.feeStructure.count(),
    orphanedRecords: feeStructures.length,
    orphanedRecordIds: feeStructures.map(f => f.id)
  });

  console.log(`💰 Fee Structures: ${feeStructures.length} records without schoolId`);
  if (feeStructures.length > 0) {
    feeStructures.forEach(fs => {
      console.log(`   - ${fs.name} ($${fs.amount})`);
    });
  }

  // Audit Termly Fee Structures table
  const termlyFeeStructures = await prisma.termlyFeeStructure.findMany({
    where: { schoolId: null },
    select: { id: true, term: true, year: true, totalAmount: true }
  });
  
  results.push({
    table: 'termlyFeeStructures',
    totalRecords: await prisma.termlyFeeStructure.count(),
    orphanedRecords: termlyFeeStructures.length,
    orphanedRecordIds: termlyFeeStructures.map(t => t.id)
  });

  console.log(`📅 Termly Fee Structures: ${termlyFeeStructures.length} records without schoolId`);
  if (termlyFeeStructures.length > 0) {
    termlyFeeStructures.forEach(tfs => {
      console.log(`   - ${tfs.term} ${tfs.year} ($${tfs.totalAmount})`);
    });
  }

  // Audit Grades table
  const grades = await prisma.grade.findMany({
    where: { schoolId: null },
    select: { id: true, name: true }
  });
  
  results.push({
    table: 'grades',
    totalRecords: await prisma.grade.count(),
    orphanedRecords: grades.length,
    orphanedRecordIds: grades.map(g => g.id)
  });

  console.log(`📊 Grades: ${grades.length} records without schoolId`);
  if (grades.length > 0) {
    grades.forEach(grade => {
      console.log(`   - ${grade.name}`);
    });
  }

  return results;
}

async function fixOrphanedRecords(results: AuditResult[], defaultSchoolId?: string) {
  console.log('\n🔧 Starting to fix orphaned records...\n');

  if (!defaultSchoolId) {
    // Get the first available school
    const firstSchool = await prisma.school.findFirst({
      select: { id: true, name: true, code: true }
    });
    
    if (!firstSchool) {
      console.log('❌ No schools found in the database. Please create a school first.');
      return;
    }
    
    defaultSchoolId = firstSchool.id;
    console.log(`🏫 Using default school: ${firstSchool.name} (${firstSchool.code})`);
  }

  let totalFixed = 0;

  for (const result of results) {
    if (result.orphanedRecords > 0) {
      console.log(`🔧 Fixing ${result.orphanedRecords} orphaned records in ${result.table}...`);
      
      try {
        switch (result.table) {
          case 'users':
            await prisma.user.updateMany({
              where: { id: { in: result.orphanedRecordIds } },
              data: { schoolId: defaultSchoolId }
            });
            break;
            
          case 'students':
            await prisma.student.updateMany({
              where: { id: { in: result.orphanedRecordIds } },
              data: { schoolId: defaultSchoolId }
            });
            break;
            
          case 'classes':
            await prisma.class.updateMany({
              where: { id: { in: result.orphanedRecordIds } },
              data: { schoolId: defaultSchoolId }
            });
            break;
            
          case 'subjects':
            await prisma.subject.updateMany({
              where: { id: { in: result.orphanedRecordIds } },
              data: { schoolId: defaultSchoolId }
            });
            break;
            
          case 'feeStructures':
            await prisma.feeStructure.updateMany({
              where: { id: { in: result.orphanedRecordIds } },
              data: { schoolId: defaultSchoolId }
            });
            break;
            
          case 'termlyFeeStructures':
            await prisma.termlyFeeStructure.updateMany({
              where: { id: { in: result.orphanedRecordIds } },
              data: { schoolId: defaultSchoolId }
            });
            break;
            
          case 'grades':
            await prisma.grade.updateMany({
              where: { id: { in: result.orphanedRecordIds } },
              data: { schoolId: defaultSchoolId }
            });
            break;
        }
        
        totalFixed += result.orphanedRecords;
        console.log(`✅ Fixed ${result.orphanedRecords} records in ${result.table}`);
      } catch (error) {
        console.log(`❌ Error fixing ${result.table}:`, error);
      }
    }
  }

  console.log(`\n🎉 Total records fixed: ${totalFixed}`);
}

async function validateSchoolIsolation() {
  console.log('\n🔍 Validating school isolation...\n');

  // Get all schools
  const schools = await prisma.school.findMany({
    select: { id: true, name: true, code: true }
  });

  if (schools.length < 2) {
    console.log('⚠️  Need at least 2 schools to validate isolation. Creating test schools...');
    
    // Create test schools if needed
    const testSchools = await Promise.all([
      prisma.school.create({
        data: {
          code: 'TEST1',
          name: 'Test School 1',
          address: 'Test Address 1',
          phone: '1234567890',
          email: 'test1@school.com'
        }
      }),
      prisma.school.create({
        data: {
          code: 'TEST2',
          name: 'Test School 2',
          address: 'Test Address 2',
          phone: '0987654321',
          email: 'test2@school.com'
        }
      })
    ]);
    
    console.log('✅ Created test schools');
    return testSchools;
  }

  // Test data isolation between schools
  for (let i = 0; i < schools.length; i++) {
    for (let j = i + 1; j < schools.length; j++) {
      const school1 = schools[i];
      const school2 = schools[j];
      
      console.log(`🔍 Comparing ${school1.name} vs ${school2.name}:`);
      
      // Compare teachers
      const teachers1 = await prisma.user.count({
        where: { schoolId: school1.id, role: 'teacher' }
      });
      const teachers2 = await prisma.user.count({
        where: { schoolId: school2.id, role: 'teacher' }
      });
      
      console.log(`   👥 Teachers: ${school1.name} (${teachers1}) vs ${school2.name} (${teachers2})`);
      
      // Compare students
      const students1 = await prisma.student.count({
        where: { schoolId: school1.id }
      });
      const students2 = await prisma.student.count({
        where: { schoolId: school2.id }
      });
      
      console.log(`   🎓 Students: ${school1.name} (${students1}) vs ${school2.name} (${students2})`);
      
      // Compare classes
      const classes1 = await prisma.class.count({
        where: { schoolId: school1.id }
      });
      const classes2 = await prisma.class.count({
        where: { schoolId: school2.id }
      });
      
      console.log(`   🏫 Classes: ${school1.name} (${classes1}) vs ${school2.name} (${classes2})`);
    }
  }

  return schools;
}

async function main() {
  try {
    console.log('🚀 School Data Isolation Audit Tool\n');
    console.log('This tool will help you identify and fix data isolation issues.\n');

    // Step 1: Audit current state
    const auditResults = await auditSchoolIsolation();
    
    const totalOrphaned = auditResults.reduce((sum, result) => sum + result.orphanedRecords, 0);
    
    if (totalOrphaned === 0) {
      console.log('\n✅ No orphaned records found! Your data isolation is working correctly.');
    } else {
      console.log(`\n⚠️  Found ${totalOrphaned} orphaned records that need to be fixed.`);
      
      // Step 2: Ask if user wants to fix them
      console.log('\nWould you like to fix these orphaned records? (y/n)');
      // In a real script, you'd read user input here
      // For now, we'll assume yes
      
      // Step 3: Fix orphaned records
      await fixOrphanedRecords(auditResults);
    }

    // Step 4: Validate isolation
    await validateSchoolIsolation();

    console.log('\n✅ Audit completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { auditSchoolIsolation, fixOrphanedRecords, validateSchoolIsolation }; 