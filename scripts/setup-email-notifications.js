const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupEmailNotifications() {
  try {
    console.log('🔄 Setting up email notifications for existing schools...');

    // Get all schools that don't have email configuration
    const schools = await prisma.school.findMany({
      where: {
        emailNotificationConfig: null
      }
    });

    console.log(`📧 Found ${schools.length} schools without email configuration`);

    for (const school of schools) {
      try {
        // Create default email configuration (disabled by default)
        await prisma.emailNotificationConfig.create({
          data: {
            schoolId: school.id,
            isEnabled: false, // Disabled by default - schools need to configure
            emailProvider: 'gmail', // Default to Gmail SMTP
            configuration: {
              // Empty configuration - schools will need to set this up
              username: '',
              password: ''
            },
            fromEmail: school.email || '', // Use school email if available
            fromName: school.name,
            paymentConfirmationEnabled: true,
            receiptAttachmentEnabled: true
          }
        });

        console.log(`✅ Created email config for: ${school.name} (${school.code})`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Email config already exists for: ${school.name} (${school.code})`);
        } else {
          console.error(`❌ Error creating email config for ${school.name}:`, error);
        }
      }
    }

    console.log('✅ Email notification setup complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Go to School Portal → Settings → Email Notifications');
    console.log('2. Select Gmail SMTP and configure with your school Gmail');
    console.log('3. Enable notifications and test the configuration');
    console.log('4. Payments will now automatically send email notifications!');

  } catch (error) {
    console.error('❌ Error setting up email notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupEmailNotifications();






