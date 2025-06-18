const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function addMockData() {
  try {
    console.log('Connecting to database...');
    const sql = neon(process.env.DATABASE_URL);
    
    // Add super-admin user
    const superAdminPassword = await bcrypt.hash('admin123', 12);
    await sql`
      INSERT INTO users (name, email, password, role, is_active, created_at, updated_at)
      VALUES ('Super Admin', 'admin@hitechsms.co.ke', ${superAdminPassword}, 'super_admin', true, NOW(), NOW());
    `;
    console.log('✅ Added super-admin user');
    
    console.log('Adding mock schools...');
    
    const mockSchools = [
      {
        code: 'STJ001',
        name: 'St. Joseph High School',
        address: '123 Education Street, Nairobi',
        phone: '+254700123456',
        email: 'admin@stjoseph.edu.ke',
        adminName: 'John Mwangi',
        adminPassword: 'admin123'
      },
      {
        code: 'BRK002',
        name: 'Brookhouse School',
        address: '456 Learning Avenue, Karen',
        phone: '+254700234567',
        email: 'admin@brookhouse.edu.ke',
        adminName: 'Sarah Kimani',
        adminPassword: 'admin123'
      },
      {
        code: 'ALL003',
        name: 'Alliance High School',
        address: '789 Knowledge Road, Westlands',
        phone: '+254700345678',
        email: 'admin@alliance.edu.ke',
        adminName: 'David Ochieng',
        adminPassword: 'admin123'
      },
      {
        code: 'KEN004',
        name: 'Kenya High School',
        address: '321 Academic Drive, Kilimani',
        phone: '+254700456789',
        email: 'admin@kenyahigh.edu.ke',
        adminName: 'Grace Wanjiku',
        adminPassword: 'admin123'
      }
    ];
    
    // Add mock schools
    for (const school of mockSchools) {
      console.log(`Adding ${school.name}...`);
      
      // Add school
      const schoolResult = await sql`
        INSERT INTO schools (code, name, address, phone, email, is_active, created_at, updated_at)
        VALUES (${school.code}, ${school.name}, ${school.address}, ${school.phone}, ${school.email}, true, NOW(), NOW())
        RETURNING id;
      `;
      
      const schoolId = schoolResult[0].id;
      
      // Add admin user for the school
      const hashedPassword = await bcrypt.hash(school.adminPassword, 12);
      
      await sql`
        INSERT INTO users (name, email, password, role, school_id, is_active, created_at, updated_at)
        VALUES (${school.adminName}, ${school.email}, ${hashedPassword}, 'school_admin', ${schoolId}, true, NOW(), NOW());
      `;
      
      console.log(`✅ Added ${school.name} (Code: ${school.code})`);
    }
    
    console.log('\n🎉 Mock data added successfully!');
    console.log('\nYou can now:');
    console.log('1. Start the app: pnpm dev');
    console.log('2. Login to super admin dashboard');
    console.log('3. See the 4 sample schools');
    console.log('4. Add more schools using the "Add New School" button');
    console.log('\nSchool admin credentials:');
    mockSchools.forEach(school => {
      console.log(`${school.name}: ${school.email} / ${school.adminPassword}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to add mock data:', error);
    process.exit(1);
  }
}

addMockData(); 