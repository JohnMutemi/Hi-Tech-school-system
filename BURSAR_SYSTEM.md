# Bursar Fee Management System

## Overview

The Bursar Fee Management System provides comprehensive fee management capabilities for school bursars, including manual payment entry, SMS notifications, and detailed reporting.

## 🎯 System Actors

### Bursar
- **Role**: Fee management specialist
- **Responsibilities**: 
  - View student fee balances by grade/class
  - Record manual cash payments
  - Send SMS notifications to parents
  - Generate payment reports
  - Export data to Excel

### Parent
- **Role**: Fee payer
- **Responsibilities**:
  - Make online payments (M-Pesa, IntaSend)
  - Receive SMS confirmations
  - View payment history

### Student
- **Role**: Fee beneficiary
- **Responsibilities**:
  - Belong to a grade/class
  - Have fee obligations
  - Linked to parent account

## 🔧 Setup Instructions

### 1. Add Bursar User

**Option A: Using School Admin Dashboard (Recommended)**
1. Login as a school admin
2. Navigate to "Staff & Teachers" tab
3. Click "Add Bursar" in the Bursars section
4. Fill in the bursar details and create the account

**Option B: Using Command Line Script**
Run the bursar creation script:

```bash
cd Hi-Tech-school-system
node scripts/add-bursar.js
```

This will create a bursar user with:
- **Email**: bursar@school.com
- **Password**: bursar123
- **Role**: bursar

**Note**: All new bursars are created with the default password `bursar123` for consistency and easy first-time login.

### 2. Configure SMS Service

The system supports multiple SMS providers:

#### Africa's Talking
```env
SMS_PROVIDER=africas_talking
SMS_API_KEY=your_api_key
SMS_API_SECRET=your_username
SMS_SENDER_ID=SCHOOL
```

#### Twilio
```env
SMS_PROVIDER=twilio
SMS_API_KEY=your_account_sid
SMS_API_SECRET=your_auth_token
SMS_PHONE_NUMBER=your_twilio_number
```

#### Simulation (Development)
```env
SMS_PROVIDER=simulation
```

### 3. Access Bursar Dashboard

Navigate to: `http://localhost:3000/schools/{schoolCode}/bursar/login`

## 🚀 Features

### 1. Bursar Dashboard

#### Student Management
- **Filter by Grade**: View all students in a specific grade
- **Filter by Class**: View students in a specific class
- **Search**: Find students by name, admission number, or parent name
- **Real-time Balance**: See outstanding fees for each student

#### Payment Management
- **Manual Payment Entry**: Record cash, bank, cheque, or M-Pesa payments
- **Receipt Generation**: Automatic receipt numbers and detailed records
- **SMS Notifications**: Send payment confirmations to parents
- **Payment History**: View complete payment history for each student

#### Reporting
- **Summary Statistics**: Total students, outstanding amounts, payment status
- **Excel Export**: Export student data with fee balances
- **Payment Reports**: Detailed payment history and receipts

### 2. Manual Payment Process

#### Step-by-Step Process
1. **Select Student**: Choose from filtered list by grade/class
2. **Enter Payment Details**:
   - Amount
   - Payment method (cash, bank, cheque, M-Pesa)
   - Description
   - Reference number (optional)
   - Payment date
3. **SMS Notification**: Option to send confirmation SMS to parent
4. **Receipt Generation**: Automatic receipt with before/after balances

#### Payment Methods Supported
- **Cash**: Physical cash payments
- **Bank Transfer**: Bank deposit payments
- **Cheque**: Cheque payments
- **M-Pesa**: Mobile money payments

### 3. SMS Notifications

#### Automatic Triggers
- **Manual Payment Entry**: When bursar records a cash payment
- **Online Payment Success**: When parent makes online payment
- **Fee Reminders**: Scheduled reminders for outstanding fees

#### Message Templates

**Payment Confirmation**:
```
Dear [ParentName], your cash payment of KES [Amount] for [StudentName] on [Date] has been received. Receipt: [ReceiptNumber]. Thank you. - [School Name]
```

**Online Payment Confirmation**:
```
Dear [ParentName], your payment of KES [Amount] for [StudentName] on [Date] has been received. Thank you. - [School Name]
```

**Fee Reminder**:
```
Dear [ParentName], [StudentName] has outstanding fees of KES [Amount]. Please make payment to avoid any inconveniences. - [School Name]
```

## 📊 Data Flow

### Manual Cash Payment Flow
```
Bursar Login → Select Student → Enter Payment → Save Payment → Send SMS → Generate Receipt
```

### Online Payment Flow
```
Parent Login → Select Payment → Process Payment → Webhook → Save Payment → Send SMS → Generate Receipt
```

## 🔐 Security Features

### Authentication
- **Role-based Access**: Only users with 'bursar' role can access
- **School-specific**: Bursars can only access their school's data
- **Session Management**: Secure session handling with iron-session

### Data Protection
- **Password Hashing**: All passwords are bcrypt hashed
- **Input Validation**: Comprehensive validation on all inputs
- **SQL Injection Protection**: Prisma ORM prevents SQL injection

## 📱 SMS Integration

### Supported Providers
1. **Africa's Talking** (Recommended for Kenya)
2. **Twilio** (Global provider)
3. **Simulation** (Development/testing)

### Configuration
```typescript
// Initialize SMS service
SMSService.initialize({
  provider: 'africas_talking',
  apiKey: process.env.SMS_API_KEY,
  apiSecret: process.env.SMS_API_SECRET,
  senderId: 'SCHOOL'
});
```

### Phone Number Validation
- **Kenyan Format**: Supports +254, 254, and 0 prefixes
- **Auto-formatting**: Converts to international format
- **Validation**: Ensures valid phone number format

## 📈 Reporting Features

### Dashboard Statistics
- **Total Students**: Count of all students
- **Total Outstanding**: Sum of all outstanding fees
- **With Balance**: Students with outstanding fees
- **Fully Paid**: Students with zero balance

### Export Capabilities
- **Excel Export**: CSV format with student and fee data
- **Payment History**: Detailed payment records
- **Receipt Generation**: Printable receipts with balances

## 🛠️ API Endpoints

### Authentication
- `POST /api/schools/{schoolCode}/bursar/login` - Bursar login
- `GET /api/schools/{schoolCode}/bursar/session` - Check session
- `POST /api/schools/{schoolCode}/bursar/logout` - Bursar logout

### Student Management
- `GET /api/schools/{schoolCode}/students` - Get students (with filters)
- `GET /api/schools/{schoolCode}/grades` - Get grades and classes

### Payment Management
- `POST /api/schools/{schoolCode}/payments/manual` - Record manual payment
- `GET /api/schools/{schoolCode}/students/{studentId}/payments` - Payment history
- `GET /api/schools/{schoolCode}/students/{studentId}/fees` - Fee balances

## 🎨 UI Components

### Bursar Dashboard
- **Responsive Design**: Works on desktop and mobile
- **Modern UI**: Clean, professional interface
- **Real-time Updates**: Live data without page refresh
- **Accessibility**: WCAG compliant design

### Key Components
- `BursarDashboard`: Main dashboard component
- `PaymentModal`: Manual payment entry form
- `PaymentHistoryModal`: Payment history viewer
- `StudentTable`: Student list with filters

## 🔧 Development

### Adding New Features
1. **Backend**: Create API endpoints in `/app/api/`
2. **Frontend**: Add components in `/components/bursar-dashboard/`
3. **Database**: Update schema if needed
4. **Testing**: Test with sample data

### SMS Testing
```typescript
// Test SMS sending
const result = await SMSService.sendPaymentConfirmation(
  '+254700000000',
  'John Doe',
  'Jane Doe',
  5000,
  new Date(),
  'Test School',
  'cash'
);
console.log('SMS Result:', result);
```

## 🚨 Troubleshooting

### Common Issues

#### SMS Not Sending
1. Check SMS provider configuration
2. Verify phone number format
3. Check API credentials
4. Review SMS logs in console

#### Payment Not Saving
1. Verify database connection
2. Check required fields
3. Review server logs
4. Validate student exists

#### Session Issues
1. Clear browser cookies
2. Check session configuration
3. Verify user role is 'bursar'
4. Check school association

### Debug Mode
Enable debug logging:
```typescript
// In payment service
logPayment('DEBUG', { data }, 'info');
```

## 📋 Best Practices

### Security
- Change default passwords immediately
- Use strong passwords
- Enable HTTPS in production
- Regular security audits

### Data Management
- Regular backups
- Data validation
- Audit logging
- Privacy compliance

### SMS Management
- Monitor SMS costs
- Rate limiting
- Message templates
- Delivery tracking

## 🔄 Future Enhancements

### Planned Features
- **Bulk SMS**: Send reminders to multiple parents
- **Payment Analytics**: Advanced reporting and charts
- **Mobile App**: Native mobile application
- **Integration**: More payment gateways
- **Automation**: Scheduled fee reminders

### API Extensions
- **Webhooks**: Real-time payment notifications
- **REST API**: Full API for third-party integration
- **GraphQL**: Alternative API interface

## 📞 Support

For technical support or feature requests:
- **Email**: support@hitechsms.com
- **Documentation**: Check this file and code comments
- **Issues**: Create GitHub issues for bugs
- **Community**: Join our developer community

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Maintainer**: Hi-Tech SMS Team 