// Script to populate super admin data in the database
const bcrypt = require('bcrypt');
const { sql } = require('../lib/db');

const sampleSuperAdmins = [
  {
    name: "Super Admin",
    email: "admin@hitechsms.co.ke",
    password: "admin123",
    role: "super_admin",
    isActive: true
  },
  {
    name: "Support Admin",
    email: "support@hitechsms.co.ke",
    password: "support123",
    role: "super_admin",
    isActive: true
  }
];

// Function to save super admins to database
async function populateSuperAdminData() {
  try {
    console.log('Adding super admin users...');
    for (const admin of sampleSuperAdmins) {
      // Hash password
      const hashedPassword = await bcrypt.hash(admin.password, 12);
      // Insert super admin
      await sql`
        INSERT INTO users (name, email, password, role, is_active, created_at, updated_at)
        VALUES (
          ${admin.name},
          ${admin.email},
          ${hashedPassword},
          ${admin.role},
          ${admin.isActive},
          datetime('now'),
          datetime('now')
        )
      `;
      console.log(`✅ Added super admin: ${admin.name} (${admin.email})`);
    }
    console.log('✅ All super admin users added successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error adding super admin data:', error);
    return false;
  }
}

// Function to clear all super admin data
async function clearSuperAdminData() {
  try {
    await sql`DELETE FROM users WHERE role = 'super_admin'`;
    console.log('✅ All super admin data cleared!');
    return true;
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    return false;
  }
}

// Function to view current super admin data
async function viewSuperAdminData() {
  try {
    const admins = await sql`SELECT id, name, email, role, is_active, created_at FROM users WHERE role = 'super_admin'`;
    console.log('📊 Current super admins in database:', admins);
    return admins;
  } catch (error) {
    console.error('❌ Error reading data:', error);
    return [];
  }
}

// Export functions
module.exports = {
  populateSuperAdminData,
  clearSuperAdminData,
  viewSuperAdminData,
  sampleSuperAdmins
};

// Run if called directly
if (require.main === module) {
  populateSuperAdminData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
