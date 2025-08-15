const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEmailSetup() {
  try {
    console.log('🧪 Testing email notification setup...');

    // Find a test school
    const testSchool = await prisma.school.findFirst({
      include: {
        emailNotificationConfig: true
      }
    });

    if (!testSchool) {
      console.log('❌ No schools found. Please create a school first.');
      return;
    }

    console.log(`📍 Testing with school: ${testSchool.name} (${testSchool.code})`);

    // Check if email config exists
    if (!testSchool.emailNotificationConfig) {
      console.log('📧 Creating test email configuration...');
      
      await prisma.emailNotificationConfig.create({
        data: {
          schoolId: testSchool.id,
          isEnabled: true,
          emailProvider: 'gmail',
          configuration: {
            username: 'test@example.com',
            password: 'test-password'
          },
          fromEmail: 'test@example.com',
          fromName: testSchool.name,
          paymentConfirmationEnabled: true,
          receiptAttachmentEnabled: true
        }
      });

      console.log('✅ Test email configuration created');
    } else {
      console.log('✅ Email configuration already exists');
    }

    // Find a test student with parent email
    const testStudent = await prisma.student.findFirst({
      where: {
        schoolId: testSchool.id,
        parentEmail: {
          not: null
        }
      },
      include: {
        user: true
      }
    });

    if (!testStudent) {
      console.log('❌ No students with parent email found. Please add a student with parent email.');
      return;
    }

    console.log(`👤 Found test student: ${testStudent.user.name} (Parent: ${testStudent.parentEmail})`);

    // Check recent payments
    const recentPayments = await prisma.payment.findMany({
      where: {
        studentId: testStudent.id
      },
      orderBy: {
        paymentDate: 'desc'
      },
      take: 3,
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`💰 Found ${recentPayments.length} recent payments for this student`);

    if (recentPayments.length > 0) {
      const latestPayment = recentPayments[0];
      console.log(`📄 Latest payment: KES ${latestPayment.amount} - Receipt: ${latestPayment.receiptNumber}`);
    }

    // Check notification logs
    const notificationLogs = await prisma.paymentNotificationLog?.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    }).catch(() => []);

    console.log(`📝 Found ${notificationLogs?.length || 0} notification logs`);

    console.log('\n✅ Email notification system is ready!');
    console.log('\n🎯 To test:');
    console.log('1. Configure real Gmail credentials in School Portal');
    console.log('2. Record a test payment in Bursar Dashboard');
    console.log('3. Check parent email for notification');
    console.log('4. Click receipt download link to verify PDF generation');

  } catch (error) {
    console.error('❌ Error testing email setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailSetup();






